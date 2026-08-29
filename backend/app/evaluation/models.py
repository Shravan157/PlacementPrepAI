"""evaluation/models.py — SQLAlchemy ORM model for answer evaluations."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db.base import Base

PortableJSON = JSON().with_variant(JSONB(), "postgresql")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False
    )
    answer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("answers.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    correctness_score: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    completeness_score: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    clarity_score: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    feedback_text: Mapped[str] = mapped_column(Text, nullable=False)
    cited_chunk_ids: Mapped[list[str]] = mapped_column(PortableJSON, nullable=False)
    weakest_subtopic: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint("correctness_score >= 0 AND correctness_score <= 10", name="ck_evaluations_correctness_score"),
        CheckConstraint("completeness_score >= 0 AND completeness_score <= 10", name="ck_evaluations_completeness_score"),
        CheckConstraint("clarity_score >= 0 AND clarity_score <= 10", name="ck_evaluations_clarity_score"),
    )
