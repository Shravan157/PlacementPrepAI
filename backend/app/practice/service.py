"""practice/service.py — Business logic for mock interview question generation, answer tracking, and coverage."""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.practice.models import (
    Answer,
    BehavioralQuestion,
    Company,
    PlanItem,
    PracticePlan,
    Question,
    TopicCoverage,
)
from app.practice.schemas import AnswerCreate, QuestionGenerateRequest
from app.rag import rerank, retriever, self_rag

LOGGER = logging.getLogger(__name__)


def _synthesize_question_from_chunks(
    subject: str,
    topic: str,
    difficulty: str,
    chunks: list,
) -> str:
    """Synthesize a targeted conceptual or practical interview question from syllabus chunks."""
    if not chunks:
        return f"Explain the fundamental principles of {topic} in {subject.upper()} and discuss key trade-offs."

    top_chunk_text = chunks[0].text.strip()
    first_sentence = top_chunk_text.split(".")[0].strip()

    if difficulty == "easy":
        return f"Define {topic} in {subject.upper()}. Specifically, explain: {first_sentence}."
    elif difficulty == "hard":
        return (
            f"Analyze the advanced implementation and performance characteristics of {topic} in {subject.upper()}.\n"
            f"Context snippet: '{first_sentence}'.\n"
            f"Discuss edge cases, error conditions, and optimization techniques."
        )
    else:  # medium
        return (
            f"In the context of {subject.upper()} ({topic}), consider the following concept:\n"
            f"'{first_sentence}'.\n"
            f"Explain how this mechanism operates, why it is important, and how it is applied in practice."
        )


def generate_question(db: Session, user_id: uuid.UUID, req: QuestionGenerateRequest) -> Question:
    """Generate or select an interview question based on RAG retrieval or static behavioral fallback."""
    if req.generation_method == "static_behavioral":
        stmt = select(BehavioralQuestion)
        if req.company_type:
            stmt = stmt.where(BehavioralQuestion.company_type == req.company_type)
        behavioral_item = db.execute(stmt).scalars().first()

        q_text = (
            behavioral_item.question_text
            if behavioral_item
            else "Describe a situation where you had to solve a complex technical challenge with a team."
        )
        chunk_ids: list[str] = []

    else:  # rag_generated
        retrieved_chunks = retriever.retrieve(
            subject=req.subject,
            topic=req.topic,
            company_type=req.company_type,
            top_k=10,
        )
        reranked_chunks = rerank.rerank(
            query=f"{req.subject} {req.topic}",
            chunks=retrieved_chunks,
            top_n=5,
        )
        relevant_chunks = self_rag.filter_relevance(
            query=req.topic,
            chunks=reranked_chunks,
        )

        q_text = _synthesize_question_from_chunks(
            subject=req.subject,
            topic=req.topic,
            difficulty=req.difficulty_tag,
            chunks=relevant_chunks,
        )
        chunk_ids = [c.id for c in relevant_chunks]

        # Verify groundedness of synthesized question
        self_rag.check_groundedness(q_text, relevant_chunks)

    db_question = Question(
        id=uuid.uuid4(),
        user_id=user_id,
        subject=req.subject,
        topic=req.topic,
        company_type=req.company_type,
        question_text=q_text,
        source_chunk_ids=chunk_ids,
        difficulty_tag=req.difficulty_tag,
        generation_method=req.generation_method,
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


def submit_answer(db: Session, user_id: uuid.UUID, req: AnswerCreate) -> Answer:
    """Save user answer and increment topic coverage attempt counts."""
    question = db.get(Question, req.question_id)
    if not question:
        raise ValueError(f"Question with id {req.question_id} not found")

    db_answer = Answer(
        id=uuid.uuid4(),
        question_id=req.question_id,
        user_id=user_id,
        answer_text=req.answer_text,
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(db_answer)

    # Update or insert TopicCoverage
    stmt = select(TopicCoverage).where(
        TopicCoverage.user_id == user_id,
        TopicCoverage.subject == question.subject,
        TopicCoverage.topic == question.topic,
    )
    coverage = db.execute(stmt).scalars().first()

    if coverage:
        coverage.attempts += 1
        coverage.last_attempted_at = datetime.now(timezone.utc)
    else:
        coverage = TopicCoverage(
            id=uuid.uuid4(),
            user_id=user_id,
            subject=question.subject,
            topic=question.topic,
            attempts=1,
            avg_score=0.0,
            last_attempted_at=datetime.now(timezone.utc),
        )
        db.add(coverage)

    db.commit()
    db.refresh(db_answer)
    return db_answer


def get_user_coverage(db: Session, user_id: uuid.UUID, subject: Optional[str] = None) -> list[TopicCoverage]:
    """Retrieve topic coverage statistics for a specific user."""
    stmt = select(TopicCoverage).where(TopicCoverage.user_id == user_id)
    if subject:
        stmt = stmt.where(TopicCoverage.subject == subject)
    return list(db.execute(stmt).scalars().all())


def create_practice_plan(db: Session, user_id: uuid.UUID, company_id: uuid.UUID) -> PracticePlan:
    """Generate a structured practice plan based on company subject weightages."""
    company = db.get(Company, company_id)
    if not company:
        raise ValueError(f"Company with id {company_id} not found")

    plan = PracticePlan(
        id=uuid.uuid4(),
        user_id=user_id,
        company_id=company_id,
        status="active",
    )
    db.add(plan)
    db.flush()

    weightage: dict[str, int] = company.subject_weightage_json or {"dbms": 3, "dsa": 3, "os": 2}
    seq = 1
    for subj, count in weightage.items():
        item = PlanItem(
            id=uuid.uuid4(),
            plan_id=plan.id,
            sequence_order=seq,
            subject=subj,
            target_question_count=int(count),
            status="pending",
        )
        db.add(item)
        seq += 1

    db.commit()
    db.refresh(plan)
    return plan


def get_user_plans(db: Session, user_id: uuid.UUID) -> list[PracticePlan]:
    """Fetch practice plans for a specific user."""
    stmt = select(PracticePlan).where(PracticePlan.user_id == user_id)
    return list(db.execute(stmt).scalars().all())
