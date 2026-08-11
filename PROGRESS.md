# Progress

Last updated: 2026-08-09

## Status: Phase 2 — RAG system and practice integration

### Done
- [x] Phase 2 schema migration (`0002`) applied to Supabase: companies, normalized questions/answers/evaluations, coverage, behavioral questions, and practice plans/items
- [x] Dataset hierarchy expanded to branch/subject layout; RAG ingestion and retrieval must use branch metadata and filtering
- [x] Initial CS ingestion scope expanded beyond the five placement-core subjects to include the supplied programming, tooling, design, and principles PDFs
- [x] Phase 2 Step 2: persistent Chroma ingestion built and verified across all 14 CS PDFs (13,824 stored chunks; repeat DBMS run skipped all 693 duplicates)
- [x] Phase 2 Step 3: branch-aware raw retrieval and independent cross-encoder reranking verified on DBMS normalization, transactions, and joins topics
- [x] Architecture fully designed and locked (see ARCHITECTURE.md)
- [x] Database decision: PostgreSQL via Supabase, shared across team
- [x] Four-screen static frontend mockup delivered (Dashboard, Practice, History, Resume Match)
- [x] Folder structure defined and scaffolded on disk
- [x] `backend/requirements.txt` — pinned dependencies (fastapi, sqlalchemy, alembic, passlib, python-jose, slowapi, pytest)
- [x] `backend/.env` — template with Supabase project ref; team fills in password + JWT secret
- [x] `backend/alembic.ini` — points at `app/db/migrations`, no secrets in file
- [x] `backend/app/config.py` — pydantic-settings, all env vars, cached `get_settings()`
- [x] `backend/app/core/database.py` — SQLAlchemy engine + SessionLocal, direct Supabase connection
- [x] `backend/app/core/security.py` — `hash_password`, `verify_password`, `create_access_token`, `decode_access_token`
- [x] `backend/app/core/rate_limit.py` — slowapi `Limiter`, `LOGIN_RATE_LIMIT = "5/minute"` (tunable constant)
- [x] `backend/app/core/exceptions.py` — handlers for 401, 403, 429 (RateLimitExceeded)
- [x] `backend/app/db/base.py` — SQLAlchemy `DeclarativeBase`
- [x] `backend/app/db/migrations/env.py` — Alembic env, reads `DATABASE_URL` from settings
- [x] `backend/app/db/migrations/versions/0001_create_users_table.py` — creates `users` table only
- [x] `backend/app/auth/models.py` — `User` ORM model (UUID PK, email unique+indexed, hashed_password, name, created_at)
- [x] `backend/app/auth/schemas.py` — Pydantic v2: `UserCreate`, `UserLogin`, `UserOut`, `Token`, `TokenData`
- [x] `backend/app/auth/service.py` — `create_user`, `authenticate_user`, `get_user_by_email`; domain exceptions only
- [x] `backend/app/auth/router.py` — POST /register (201/409), POST /login (200/401, rate-limited), GET /me (200/401)
- [x] `backend/app/dependencies.py` — `get_db()`, `get_current_user()` (generic, reusable by future modules)
- [x] `backend/app/main.py` — FastAPI app, auth router only, slowapi + exception handlers registered
- [x] `backend/tests/conftest.py` — SQLite in-memory test DB, `client` + `db_session` fixtures
- [x] `backend/tests/test_auth.py` — 8 test cases covering all PROGRESS.md scenarios + invalid JWT + short password

### Immediate next actions (do in order)
1. Fill in `backend/.env`: replace `<password>` with your Supabase password, generate a real `JWT_SECRET_KEY`
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Run tests (no Supabase needed): `cd backend && pytest tests/test_auth.py -v`
4. Run Alembic migration against Supabase: `cd backend && alembic upgrade head`
5. Start the server: `uvicorn app.main:app --reload`
6. Smoke-test: POST `/auth/register`, POST `/auth/login`, GET `/auth/me`, confirm 429 on 6th rapid login

### Not started (do not begin until above is complete and tested)
- [ ] DBMS PDF ingestion (`rag/ingestion.py`)
- [ ] Embeddings + Chroma vector store setup
- [ ] Self-RAG relevance filtering + groundedness checking
- [ ] `practice/` module (question generation, answer submission)
- [ ] `evaluation/` module (rubric-based scoring)
- [ ] `resume/` module (skill extraction, JD gap matching)
- [ ] `history/` module (dashboard chart data)
- [x] Frontend template scaffolding (Vite + React, Axios client with JWT interceptors, API services & page templates)
- [ ] Frontend wiring to live API (currently static mockup & templates ready)
- [ ] Expansion of ingestion to DSA, OS, CN, OOP

## Open decisions

- **JWT strategy**: plain JWT with fixed 24h expiry chosen for Phase 1 — no refresh-token rotation. Revisit before viva if evaluators ask about security hardening.

## Rule: folders marked [NOT YET] in ARCHITECTURE.md are not created until their module's phase begins. No empty placeholders.
