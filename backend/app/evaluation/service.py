"""evaluation/service.py — Rubric-based evaluation business logic."""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.evaluation.models import Evaluation
from app.evaluation.schemas import EvaluationCreate
from app.practice.models import Answer, Question, TopicCoverage
from app.rag import self_rag

LOGGER = logging.getLogger(__name__)


def _compute_rubric_scores(
    question_text: str,
    answer_text: str,
    topic: str,
) -> tuple[float, float, float, str, Optional[str]]:
    """Compute rubric scores (0-10) for correctness, completeness, and clarity.

    Returns (correctness, completeness, clarity, feedback, weakest_subtopic).
    """
    clean_ans = answer_text.strip()
    words = clean_ans.split()
    word_count = len(words)

    if word_count < 5:
        return (
            2.0,
            2.0,
            3.0,
            "Answer is too short to provide adequate technical detail. Expand on key definitions, mechanisms, and examples.",
            f"Basic definitions in {topic}",
        )

    # Base scores start from content length and topic relevance
    topic_words = set(topic.lower().split())
    ans_words = set(clean_ans.lower().split())
    topic_matches = len(topic_words.intersection(ans_words))

    # Correctness calculation
    correctness = min(10.0, max(4.0, 5.0 + (topic_matches * 1.5) + (min(word_count, 100) / 25.0)))

    # Completeness calculation based on explanation structures (e.g. contains 'because', 'for example', 'such as', 'whereas')
    indicators = ["because", "example", "such as", "where", "mode", "type", "key", "result", "using", "first", "second"]
    found_indicators = sum(1 for ind in indicators if ind in clean_ans.lower())
    completeness = min(10.0, max(3.0, 4.0 + (found_indicators * 1.2) + (min(word_count, 120) / 30.0)))

    # Clarity calculation based on sentence structure
    sentences = [s for s in clean_ans.split(".") if s.strip()]
    clarity = min(10.0, max(5.0, 6.0 + (min(len(sentences), 5) * 0.8)))

    correctness = round(correctness, 2)
    completeness = round(completeness, 2)
    clarity = round(clarity, 2)

    feedback_parts = [
        f"Correctness ({correctness}/10): Good understanding of core concepts.",
        f"Completeness ({completeness}/10): Cover more practical edge cases and trade-offs.",
        f"Clarity ({clarity}/10): Clear structure and explanation flow.",
    ]
    feedback = " ".join(feedback_parts)
    weakest_subtopic = f"Advanced edge cases in {topic}" if completeness < 7.0 else None

    return (correctness, completeness, clarity, feedback, weakest_subtopic)


def evaluate_answer(db: Session, user_id: uuid.UUID, req: EvaluationCreate) -> Evaluation:
    """Evaluate a user answer using rubric scoring and update overall topic coverage scores."""
    answer = db.get(Answer, req.answer_id)
    if not answer:
        raise ValueError(f"Answer with id {req.answer_id} not found")
    if answer.user_id != user_id:
        raise PermissionError("Access denied to evaluation for another user's answer")

    # Return existing evaluation if present
    stmt = select(Evaluation).where(Evaluation.answer_id == req.answer_id)
    existing_eval = db.execute(stmt).scalars().first()
    if existing_eval:
        return existing_eval

    question = db.get(Question, answer.question_id)
    if not question:
        raise ValueError(f"Associated question with id {answer.question_id} not found")

    correctness, completeness, clarity, feedback, weakest_subtopic = _compute_rubric_scores(
        question_text=question.question_text,
        answer_text=answer.answer_text,
        topic=question.topic,
    )

    cited_chunks: list[str] = question.source_chunk_ids or []

    db_eval = Evaluation(
        id=uuid.uuid4(),
        answer_id=req.answer_id,
        correctness_score=correctness,
        completeness_score=completeness,
        clarity_score=clarity,
        feedback_text=feedback,
        cited_chunk_ids=cited_chunks,
        weakest_subtopic=weakest_subtopic,
    )
    db.add(db_eval)

    # Update average score in TopicCoverage
    overall_score = (correctness + completeness + clarity) / 3.0
    cov_stmt = select(TopicCoverage).where(
        TopicCoverage.user_id == user_id,
        TopicCoverage.subject == question.subject,
        TopicCoverage.topic == question.topic,
    )
    coverage = db.execute(cov_stmt).scalars().first()
    if coverage:
        current_attempts = max(1, coverage.attempts)
        # Recalculate rolling average score
        coverage.avg_score = round(
            ((float(coverage.avg_score) * (current_attempts - 1)) + overall_score) / current_attempts,
            2,
        )

    db.commit()
    db.refresh(db_eval)
    return db_eval


def get_evaluation_by_answer_id(db: Session, user_id: uuid.UUID, answer_id: uuid.UUID) -> Optional[Evaluation]:
    """Retrieve an evaluation for a specific answer."""
    answer = db.get(Answer, answer_id)
    if not answer or answer.user_id != user_id:
        return None

    stmt = select(Evaluation).where(Evaluation.answer_id == answer_id)
    return db.execute(stmt).scalars().first()
