"""history/router.py — History and dashboard API endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.models import User
from app.dependencies import get_current_user, get_db
from app.history.schemas import (
    AnswerHistoryEntry,
    DashboardSummary,
)
from app.history.service import (
    get_answer_history,
    get_dashboard_summary,
)

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return aggregated dashboard summary for the authenticated user.

    Includes:
    - Total counts (questions, answers, evaluations)
    - Rubric score averages per subject (for bar charts)
    - Weak topics with avg_score below threshold
    - Daily activity for the last 30 days
    """
    return get_dashboard_summary(db=db, user_id=current_user.id)


@router.get("/answers", response_model=list[AnswerHistoryEntry])
def answer_history_endpoint(
    subject: Optional[str] = Query(None, description="Filter by subject (e.g. dbms, dsa)"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of entries to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return chronological list of answers with evaluation scores.

    Sorted newest-first. Unevaluated answers appear with null score fields.
    """
    return get_answer_history(db=db, user_id=current_user.id, subject=subject, limit=limit)
