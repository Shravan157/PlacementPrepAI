"""practice/router.py — Practice API router for mock interview questions, answers, and coverage."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.dependencies import get_current_user, get_db
from app.practice.schemas import (
    AnswerCreate,
    AnswerOut,
    PracticePlanCreate,
    PracticePlanOut,
    QuestionGenerateRequest,
    QuestionOut,
    TopicCoverageOut,
)
from app.practice.service import (
    create_practice_plan,
    generate_question,
    get_user_coverage,
    get_user_plans,
    submit_answer,
)

router = APIRouter(prefix="/practice", tags=["practice"])


@router.post("/questions", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def generate_question_endpoint(
    req: QuestionGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate or retrieve a mock interview question."""
    try:
        question = generate_question(db=db, user_id=current_user.id, req=req)
        return question
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate question: {err}",
        )


@router.post("/answers", response_model=AnswerOut, status_code=status.HTTP_201_CREATED)
def submit_answer_endpoint(
    req: AnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit an answer for an interview question."""
    try:
        answer = submit_answer(db=db, user_id=current_user.id, req=req)
        return answer
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err),
        )


@router.get("/coverage", response_model=list[TopicCoverageOut])
def get_coverage_endpoint(
    subject: Optional[str] = Query(None, description="Optional subject filter (e.g. dbms, dsa)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve topic coverage statistics for the authenticated user."""
    return get_user_coverage(db=db, user_id=current_user.id, subject=subject)


@router.post("/plans", response_model=PracticePlanOut, status_code=status.HTTP_201_CREATED)
def create_plan_endpoint(
    req: PracticePlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a company-tailored practice plan."""
    try:
        plan = create_practice_plan(db=db, user_id=current_user.id, company_id=req.company_id)
        return plan
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err),
        )


@router.get("/plans", response_model=list[PracticePlanOut])
def get_plans_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve practice plans for the authenticated user."""
    return get_user_plans(db=db, user_id=current_user.id)
