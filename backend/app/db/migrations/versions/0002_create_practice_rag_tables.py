"""Create Phase 2 practice and RAG persistence tables.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-09

These normalized tables deliberately contain no conversation, transcript, or
chat-history fields.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

UUID = postgresql.UUID(as_uuid=True)
JSONB = postgresql.JSONB(astext_type=sa.Text())


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", UUID, primary_key=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False, unique=True),
        sa.Column("company_type", sa.String(64), nullable=False),
        sa.Column("rounds_json", JSONB, nullable=False),
        sa.Column("subject_weightage_json", JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_companies_company_type", "companies", ["company_type"])

    op.create_table(
        "questions",
        sa.Column("id", UUID, primary_key=True, nullable=False),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subject", sa.String(32), nullable=False),
        sa.Column("topic", sa.String(255), nullable=False),
        sa.Column("company_type", sa.String(64), nullable=True),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("source_chunk_ids", JSONB, nullable=False),
        sa.Column("difficulty_tag", sa.String(64), nullable=False),
        sa.Column("generation_method", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("generation_method IN ('rag_generated', 'static_behavioral')", name="ck_questions_generation_method"),
    )
    op.create_index("ix_questions_user_subject", "questions", ["user_id", "subject"])

    op.create_table(
        "answers",
        sa.Column("id", UUID, primary_key=True, nullable=False),
        sa.Column("question_id", UUID, sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_answers_question_id", "answers", ["question_id"])
    op.create_index("ix_answers_user_id", "answers", ["user_id"])

    op.create_table(
        "evaluations",
        sa.Column("id", UUID, primary_key=True, nullable=False),
        sa.Column("answer_id", UUID, sa.ForeignKey("answers.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("correctness_score", sa.Numeric(4, 2), nullable=False),
        sa.Column("completeness_score", sa.Numeric(4, 2), nullable=False),
        sa.Column("clarity_score", sa.Numeric(4, 2), nullable=False),
        sa.Column("feedback_text", sa.Text(), nullable=False),
        sa.Column("cited_chunk_ids", JSONB, nullable=False),
        sa.Column("weakest_subtopic", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("correctness_score >= 0 AND correctness_score <= 10", name="ck_evaluations_correctness_score"),
        sa.CheckConstraint("completeness_score >= 0 AND completeness_score <= 10", name="ck_evaluations_completeness_score"),
        sa.CheckConstraint("clarity_score >= 0 AND clarity_score <= 10", name="ck_evaluations_clarity_score"),
    )

    op.create_table(
        "topic_coverage",
        sa.Column("id", UUID, primary_key=True, nullable=False),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subject", sa.String(32), nullable=False),
        sa.Column("topic", sa.String(255), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("avg_score", sa.Numeric(4, 2), nullable=False, server_default="0"),
        sa.Column("last_attempted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "subject", "topic", name="uq_topic_coverage_user_subject_topic"),
    )
    op.create_index("ix_topic_coverage_user_subject", "topic_coverage", ["user_id", "subject"])

    op.create_table(
        "behavioral_questions",
        sa.Column("id", UUID, primary_key=True, nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("company_type", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_behavioral_questions_company_type", "behavioral_questions", ["company_type"])

    op.create_table(
        "practice_plans",
        sa.Column("id", UUID, primary_key=True, nullable=False),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_id", UUID, sa.ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_practice_plans_user_status", "practice_plans", ["user_id", "status"])

    op.create_table(
        "plan_items",
        sa.Column("id", UUID, primary_key=True, nullable=False),
        sa.Column("plan_id", UUID, sa.ForeignKey("practice_plans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sequence_order", sa.Integer(), nullable=False),
        sa.Column("subject", sa.String(32), nullable=False),
        sa.Column("target_question_count", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("question_id", UUID, sa.ForeignKey("questions.id", ondelete="SET NULL"), nullable=True),
        sa.UniqueConstraint("plan_id", "sequence_order", name="uq_plan_items_plan_sequence"),
    )
    op.create_index("ix_plan_items_plan_id", "plan_items", ["plan_id"])

    placeholders = sa.table(
        "behavioral_questions",
        sa.column("id", UUID),
        sa.column("question_text", sa.Text()),
        sa.column("company_type", sa.String()),
    )
    op.bulk_insert(
        placeholders,
        [
            {"id": "00000000-0000-0000-0000-000000000001", "question_text": "Placeholder: describe a time you worked with a team to solve a problem.", "company_type": "mass_recruiter_it"},
            {"id": "00000000-0000-0000-0000-000000000002", "question_text": "Placeholder: describe a technically difficult problem and how you approached it.", "company_type": "product_based"},
            {"id": "00000000-0000-0000-0000-000000000003", "question_text": "Placeholder: describe a situation where accuracy and attention to detail mattered.", "company_type": "fintech_core"},
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_plan_items_plan_id", table_name="plan_items")
    op.drop_table("plan_items")
    op.drop_index("ix_practice_plans_user_status", table_name="practice_plans")
    op.drop_table("practice_plans")
    op.drop_index("ix_behavioral_questions_company_type", table_name="behavioral_questions")
    op.drop_table("behavioral_questions")
    op.drop_index("ix_topic_coverage_user_subject", table_name="topic_coverage")
    op.drop_table("topic_coverage")
    op.drop_table("evaluations")
    op.drop_index("ix_answers_user_id", table_name="answers")
    op.drop_index("ix_answers_question_id", table_name="answers")
    op.drop_table("answers")
    op.drop_index("ix_questions_user_subject", table_name="questions")
    op.drop_table("questions")
    op.drop_index("ix_companies_company_type", table_name="companies")
    op.drop_table("companies")
