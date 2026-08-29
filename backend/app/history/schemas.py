"""history/schemas.py — Pydantic schemas for dashboard and history chart data."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SubjectScoreSummary(BaseModel):
    """Aggregate rubric stats for one subject."""
    subject: str
    total_attempts: int
    avg_correctness: float
    avg_completeness: float
    avg_clarity: float
    avg_overall: float


class DailyActivityPoint(BaseModel):
    """Count of answers submitted on a given date, for activity bar charts."""
    date: str  # ISO date string YYYY-MM-DD
    answer_count: int


class WeakTopicEntry(BaseModel):
    """A topic with below-threshold average score, for targeted improvement suggestions."""
    subject: str
    topic: str
    attempts: int
    avg_score: float
    last_attempted_at: Optional[datetime] = None


class AnswerHistoryEntry(BaseModel):
    """One row in the chronological answer history list."""
    model_config = ConfigDict(from_attributes=True)

    answer_id: UUID
    question_text: str
    subject: str
    topic: str
    difficulty_tag: str
    submitted_at: datetime
    correctness_score: Optional[float] = None
    completeness_score: Optional[float] = None
    clarity_score: Optional[float] = None
    overall_score: Optional[float] = None
    feedback_text: Optional[str] = None
    weakest_subtopic: Optional[str] = None


class DashboardSummary(BaseModel):
    """Top-level summary response for the dashboard screen."""
    total_questions_attempted: int
    total_answers_submitted: int
    total_evaluations: int
    subject_scores: list[SubjectScoreSummary]
    weak_topics: list[WeakTopicEntry]
    recent_activity: list[DailyActivityPoint]
