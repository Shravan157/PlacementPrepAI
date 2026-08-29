"""evaluation/router.py — Evaluation API router for scoring and feedback."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.dependencies import get_current_user, get_db
from app.evaluation.schemas import EvaluationCreate, EvaluationOut
from app.evaluation.service import evaluate_answer, get_evaluation_by_answer_id

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.post("/evaluate", response_model=EvaluationOut, status_code=status.HTTP_201_CREATED)
def evaluate_answer_endpoint(
    req: EvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Evaluate a submitted answer using the standardized rubric."""
    try:
        eval_result = evaluate_answer(db=db, user_id=current_user.id, req=req)
        return eval_result
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err),
        )
    except PermissionError as err:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(err),
        )


@router.get("/{answer_id}", response_model=EvaluationOut)
def get_evaluation_endpoint(
    answer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch rubric evaluation for a given answer ID."""
    eval_result = get_evaluation_by_answer_id(db=db, user_id=current_user.id, answer_id=answer_id)
    if not eval_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found for this answer ID",
        )
    return eval_result
