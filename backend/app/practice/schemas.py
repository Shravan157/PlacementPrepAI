"""practice/schemas.py — Pydantic schemas for practice operations."""

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class QuestionGenerateRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=32, json_schema_extra={"example": "dbms"})
    topic: str = Field(..., min_length=1, max_length=255, json_schema_extra={"example": "normalization"})
    company_type: Optional[str] = Field(None, json_schema_extra={"example": "product_based"})
    difficulty_tag: str = Field("medium", json_schema_extra={"example": "medium"})
    generation_method: Literal["rag_generated", "static_behavioral"] = Field("rag_generated")


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subject: str
    topic: str
    company_type: Optional[str] = None
    question_text: str
    source_chunk_ids: list[str]
    difficulty_tag: str
    generation_method: str
    created_at: datetime


class AnswerCreate(BaseModel):
    question_id: UUID
    answer_text: str = Field(..., min_length=1)


class AnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_id: UUID
    user_id: UUID
    answer_text: str
    submitted_at: datetime


class TopicCoverageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subject: str
    topic: str
    attempts: int
    avg_score: float
    last_attempted_at: Optional[datetime] = None


class PlanItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan_id: UUID
    sequence_order: int
    subject: str
    target_question_count: int
    status: str
    question_id: Optional[UUID] = None


class PracticePlanCreate(BaseModel):
    company_id: UUID


class PracticePlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    company_id: UUID
    status: str
    created_at: datetime
    items: list[PlanItemOut] = []
