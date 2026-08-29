"""history/service.py — Aggregation queries that power the dashboard and history views."""

import logging
import uuid
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.evaluation.models import Evaluation
from app.history.schemas import (
    AnswerHistoryEntry,
    DailyActivityPoint,
    DashboardSummary,
    SubjectScoreSummary,
    WeakTopicEntry,
)
from app.practice.models import Answer, Question, TopicCoverage

LOGGER = logging.getLogger(__name__)

# Topics with avg_score below this threshold surface as "weak topics"
WEAK_TOPIC_THRESHOLD = 6.0


def get_subject_score_summaries(db: Session, user_id: uuid.UUID) -> list[SubjectScoreSummary]:
    """Aggregate rubric scores grouped by subject for bar chart display.

    Joins answers → questions (for subject) → evaluations (for scores).
    Only answers that have been evaluated are included.
    """
    # Fetch all answers for this user that have evaluations
    ans_stmt = (
        select(Answer, Question, Evaluation)
        .join(Question, Answer.question_id == Question.id)
        .join(Evaluation, Evaluation.answer_id == Answer.id)
        .where(Answer.user_id == user_id)
    )
    rows = db.execute(ans_stmt).all()

    # Bucket scores by subject
    buckets: dict[str, dict] = defaultdict(lambda: {
        "attempts": 0,
        "correctness": 0.0,
        "completeness": 0.0,
        "clarity": 0.0,
    })

    for answer, question, evaluation in rows:
        subj = question.subject
        buckets[subj]["attempts"] += 1
        buckets[subj]["correctness"] += float(evaluation.correctness_score)
        buckets[subj]["completeness"] += float(evaluation.completeness_score)
        buckets[subj]["clarity"] += float(evaluation.clarity_score)

    summaries: list[SubjectScoreSummary] = []
    for subject, data in buckets.items():
        n = data["attempts"]
        avg_c = round(data["correctness"] / n, 2)
        avg_cp = round(data["completeness"] / n, 2)
        avg_cl = round(data["clarity"] / n, 2)
        summaries.append(SubjectScoreSummary(
            subject=subject,
            total_attempts=n,
            avg_correctness=avg_c,
            avg_completeness=avg_cp,
            avg_clarity=avg_cl,
            avg_overall=round((avg_c + avg_cp + avg_cl) / 3.0, 2),
        ))

    return sorted(summaries, key=lambda s: s.subject)


def get_weak_topics(
    db: Session,
    user_id: uuid.UUID,
    threshold: float = WEAK_TOPIC_THRESHOLD,
) -> list[WeakTopicEntry]:
    """Return topics where average score is below the weakness threshold."""
    stmt = (
        select(TopicCoverage)
        .where(
            TopicCoverage.user_id == user_id,
            TopicCoverage.avg_score < threshold,
            TopicCoverage.attempts > 0,
        )
        .order_by(TopicCoverage.avg_score.asc())
    )
    coverages = db.execute(stmt).scalars().all()

    return [
        WeakTopicEntry(
            subject=cov.subject,
            topic=cov.topic,
            attempts=cov.attempts,
            avg_score=float(cov.avg_score),
            last_attempted_at=cov.last_attempted_at,
        )
        for cov in coverages
    ]


def get_daily_activity(db: Session, user_id: uuid.UUID, last_days: int = 30) -> list[DailyActivityPoint]:
    """Count answers submitted per calendar day for the last N days.

    Uses Python-side grouping for SQLite compatibility (no DATE_TRUNC).
    """
    stmt = select(Answer.submitted_at).where(Answer.user_id == user_id)
    timestamps = db.execute(stmt).scalars().all()

    day_counts: dict[str, int] = defaultdict(int)
    for ts in timestamps:
        if ts is not None:
            day_key = ts.strftime("%Y-%m-%d")
            day_counts[day_key] += 1

    return [
        DailyActivityPoint(date=day, answer_count=count)
        for day, count in sorted(day_counts.items())
    ]


def get_answer_history(
    db: Session,
    user_id: uuid.UUID,
    subject: Optional[str] = None,
    limit: int = 50,
) -> list[AnswerHistoryEntry]:
    """Chronological list of all answers with their evaluation scores, newest first."""
    stmt = (
        select(Answer, Question, Evaluation)
        .join(Question, Answer.question_id == Question.id)
        .outerjoin(Evaluation, Evaluation.answer_id == Answer.id)
        .where(Answer.user_id == user_id)
        .order_by(Answer.submitted_at.desc())
        .limit(limit)
    )
    if subject:
        stmt = stmt.where(Question.subject == subject)

    rows = db.execute(stmt).all()

    result: list[AnswerHistoryEntry] = []
    for answer, question, evaluation in rows:
        correctness = float(evaluation.correctness_score) if evaluation else None
        completeness = float(evaluation.completeness_score) if evaluation else None
        clarity = float(evaluation.clarity_score) if evaluation else None
        overall = (
            round((correctness + completeness + clarity) / 3.0, 2)
            if (correctness is not None and completeness is not None and clarity is not None)
            else None
        )
        result.append(AnswerHistoryEntry(
            answer_id=answer.id,
            question_text=question.question_text,
            subject=question.subject,
            topic=question.topic,
            difficulty_tag=question.difficulty_tag,
            submitted_at=answer.submitted_at,
            correctness_score=correctness,
            completeness_score=completeness,
            clarity_score=clarity,
            overall_score=overall,
            feedback_text=evaluation.feedback_text if evaluation else None,
            weakest_subtopic=evaluation.weakest_subtopic if evaluation else None,
        ))
    return result


def get_dashboard_summary(db: Session, user_id: uuid.UUID) -> DashboardSummary:
    """Aggregate all dashboard data into one response for the frontend Dashboard screen."""
    # Counts
    total_questions = db.execute(
        select(func.count()).select_from(Question).where(Question.user_id == user_id)
    ).scalar_one()

    total_answers = db.execute(
        select(func.count()).select_from(Answer).where(Answer.user_id == user_id)
    ).scalar_one()

    total_evals = db.execute(
        select(func.count()).select_from(Evaluation).join(
            Answer, Answer.id == Evaluation.answer_id
        ).where(Answer.user_id == user_id)
    ).scalar_one()

    subject_scores = get_subject_score_summaries(db=db, user_id=user_id)
    weak_topics = get_weak_topics(db=db, user_id=user_id)
    recent_activity = get_daily_activity(db=db, user_id=user_id, last_days=30)

    return DashboardSummary(
        total_questions_attempted=total_questions,
        total_answers_submitted=total_answers,
        total_evaluations=total_evals,
        subject_scores=subject_scores,
        weak_topics=weak_topics,
        recent_activity=recent_activity,
    )
