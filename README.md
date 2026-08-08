# Placement Prep AI

RAG-based mock interview and resume evaluation system for Indian campus placement preparation. Built as a final-year CS/IT capstone project.

## What this is not

This is not a chatbot wrapper. It is a structured evaluation system with normalized data (questions, answers, evaluations as separate DB tables), a reflective RAG pipeline (retrieval + relevance filtering + groundedness checking), and an academic/ledger-style UI — not chat bubbles.

## Core subjects covered

DSA, OS, DBMS, CN, OOP — five core CS subjects tested in Indian campus placements. Ingestion starts with DBMS only; other subjects are added one at a time after the pipeline is proven end-to-end on DBMS.

## Current build phase

**Phase 1 (active): Core modules — API foundation, authentication, security.**
Project-specific modules (practice, evaluation, resume, rag, history) are documented in ARCHITECTURE.md but not yet scaffolded. See PROGRESS.md for exact status.

## Tech stack

| Layer | Choice |
|---|---|
| Backend framework | FastAPI |
| Database | PostgreSQL (hosted on Supabase — shared team access) |
| ORM | SQLAlchemy + Alembic migrations |
| Auth | JWT (python-jose), password hashing via passlib/bcrypt |
| Rate limiting | slowapi |
| PDF ingestion | PyMuPDF |
| Embeddings | all-MiniLM-L6-v2 (sentence-transformers) |
| Vector store | Chroma |
| Frontend | HTML/CSS/JS (static mockup delivered — 4 screens) |

## Project structure

See ARCHITECTURE.md for the full folder structure and module breakdown.

## Setup (Phase 1 — core/auth only)

1. Clone the repo, create a Python virtualenv inside `backend/`
2. `pip install -r backend/requirements.txt`
3. Create `backend/.env` with:
   ```
   DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
   JWT_SECRET_KEY=<generate one>
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```
4. Run Alembic migrations: `alembic upgrade head` (creates `users` table only, for now)
5. Run the API: `uvicorn app.main:app --reload`
6. Confirm `/auth/register` and `/auth/login` work before building anything else

## Team notes

- Database is shared via Supabase — do not create local-only Postgres instances, everyone must point at the same connection string.
- Source PDFs live in `/datasets/<subject>/` at project root and are gitignored (likely copyrighted material — do not commit them). Each teammate sources their own copies locally.
- Scope discipline: do not scaffold folders for modules not yet being built. See PROGRESS.md for what's actually in progress.
