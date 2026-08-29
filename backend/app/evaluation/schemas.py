"""evaluation/schemas.py — Pydantic schemas for rubric evaluation."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field


class EvaluationCreate(BaseModel):
    answer_id: UUID


class EvaluationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    answer_id: UUID
    correctness_score: float = Field(..., ge=0.0, le=10.0)
    completeness_score: float = Field(..., ge=0.0, le=10.0)
    clarity_score: float = Field(..., ge=0.0, le=10.0)
    feedback_text: str
    cited_chunk_ids: list[str]
    weakest_subtopic: Optional[str] = None
    created_at: datetime

    @computed_field  # type: ignore[misc]
    @property
    def overall_score(self) -> float:
        """Calculate unweighted composite rubric average score."""
        return round((self.correctness_score + self.completeness_score + self.clarity_score) / 3.0, 2)
