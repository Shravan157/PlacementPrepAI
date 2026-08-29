"""history/models.py — No dedicated ORM models for history.

The history module is purely a read-aggregation layer over existing tables:
  - questions         (subject, topic, difficulty_tag, created_at, user_id)
  - answers           (submitted_at, user_id, question_id)
  - evaluations       (scores, feedback, weakest_subtopic, answer_id)
  - topic_coverage    (attempts, avg_score, subject, topic, user_id)

No additional tables are needed. All history data is derivable from the
normalized schema created in migration 0002. This file is kept to satisfy
the required 4-file module structure per AGENTS.md.
"""
