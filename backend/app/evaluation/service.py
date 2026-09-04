"""evaluation/service.py — Rubric-based evaluation business logic."""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

import json
from app.core.llm import generate_llm_text
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
    """Compute rubric scores (0-10) for correctness, completeness, and clarity via LLM with fallback."""
    clean_ans = answer_text.strip()
    word_count = len(clean_ans.split())

    if word_count < 5:
        return (
            2.0,
            2.0,
            3.0,
            "Answer is too short to provide adequate technical detail. Expand on key definitions, mechanisms, and practical examples.",
            f"Basic definitions in {topic}",
        )

    system_prompt = (
        "You are a rigorous technical interview evaluator for CS campus placements.\n"
        "Your task is to evaluate a candidate's answer to a technical interview question based on 3 rubric criteria (0.0 to 10.0 scale):\n"
        "1. correctness_score: Technical accuracy, correct terminology, definitions, and logic.\n"
        "2. completeness_score: Depth, thoroughness, coverage of mechanisms and edge cases.\n"
        "3. clarity_score: Readability, structure, precise terminology, and explanation flow.\n\n"
        "STRICT GUARDRAILS:\n"
        "Respond ONLY with a valid JSON object matching this exact format:\n"
        "{\n"
        '  "correctness_score": 8.5,\n'
        '  "completeness_score": 7.0,\n'
        '  "clarity_score": 9.0,\n'
        '  "feedback_text": "Detailed constructive feedback covering strengths and areas for improvement.",\n'
        '  "weakest_subtopic": "Specific subconcept to review, or null"\n'
        "}"
    )

    user_prompt = (
        f"Question Asked: {question_text}\n"
        f"Topic Domain: {topic}\n"
        f"Candidate Answer: {clean_ans}\n\n"
        f"Evaluate the candidate answer and return the JSON evaluation object:"
    )

    try:
        raw_json = generate_llm_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            json_mode=True,
            timeout=25.0,
        )
        parsed = json.loads(raw_json)

        correctness = round(min(10.0, max(0.0, float(parsed.get("correctness_score", 7.0)))), 2)
        completeness = round(min(10.0, max(0.0, float(parsed.get("completeness_score", 6.5)))), 2)
        clarity = round(min(10.0, max(0.0, float(parsed.get("clarity_score", 8.0)))), 2)
        feedback = str(parsed.get("feedback_text", "Detailed technical response evaluated.")).strip()
        weakest = parsed.get("weakest_subtopic")
        weakest_subtopic = str(weakest).strip() if weakest and str(weakest).lower() != "null" else None

        return (correctness, completeness, clarity, feedback, weakest_subtopic)

    except Exception as err:
        LOGGER.warning("LLM rubric evaluation failed: %s. Using heuristic rubric fallback.", err)

    # Heuristic fallback if LLM call or JSON parsing fails
    topic_words = set(topic.lower().split())
    ans_words = set(clean_ans.lower().split())
    topic_matches = len(topic_words.intersection(ans_words))

    correctness = min(10.0, max(4.0, 5.0 + (topic_matches * 1.5) + (min(word_count, 100) / 25.0)))
    indicators = ["because", "example", "such as", "where", "mode", "type", "key", "result", "using", "first", "second"]
    found_indicators = sum(1 for ind in indicators if ind in clean_ans.lower())
    completeness = min(10.0, max(3.0, 4.0 + (found_indicators * 1.2) + (min(word_count, 120) / 30.0)))
    sentences = [s for s in clean_ans.split(".") if s.strip()]
    clarity = min(10.0, max(5.0, 6.0 + (min(len(sentences), 5) * 0.8)))

    correctness = round(correctness, 2)
    completeness = round(completeness, 2)
    clarity = round(clarity, 2)

    feedback = (
        f"Correctness ({correctness}/10): Relevant technical concepts included. "
        f"Completeness ({completeness}/10): Expand on edge cases and mechanisms. "
        f"Clarity ({clarity}/10): Structured explanation."
    )
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
