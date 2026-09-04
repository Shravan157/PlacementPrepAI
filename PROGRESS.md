# Progress

Last updated: 2026-08-30

## Status: Phase 2 — RAG system, LLM Self-RAG, and practice UI integration

### Done
- [x] Phase 2 schema migration (`0002`) applied to Supabase: companies, normalized questions/answers/evaluations, coverage, behavioral questions, and practice plans/items
- [x] Dataset hierarchy expanded to branch/subject layout; RAG ingestion and retrieval use branch metadata and filtering
- [x] Ingestion completed across all 14 CS PDFs: DBMS, DSA, OS, CN, OOP, C, C++, Java, JS, Python, Linux, Git, SOLID principles, and System Design (13,824 stored vector chunks in ChromaDB)
- [x] Phase 2 Step 3: branch-aware raw retrieval and independent cross-encoder reranking verified on DBMS normalization, transactions, and joins topics
- [x] Unified LLM Core Engine (`app/core/llm.py`): Google Gemini 3.6 Flash (`gemini-3.6-flash`) as primary, Groq (`openai/gpt-oss-120b`) as fallback provider with automated failover and JSON schema guardrails
- [x] RAG Question Generation (`practice/service.py`): Runtime question synthesis grounded in retrieved vector chunks with Self-RAG groundedness checking (`self_rag.check_groundedness`)
- [x] AI Rubric Evaluation (`evaluation/service.py`): Automated rubric scoring across Correctness (0-10), Completeness (0-10), and Clarity (0-10) with constructive feedback and weak subtopic detection
- [x] Frontend API Client Services (`frontend/src/api/`): Axios wrappers for `/auth`, `/practice`, and `/evaluation` endpoints
- [x] Interactive Frontend Practice Workspace (`frontend/src/pages/Practice/`): Full 3-step live interactive mock interview UI (01 Configure -> 02 Interview -> 03 Evaluate) wired to backend API
- [x] Architecture fully designed and locked (see ARCHITECTURE.md)
- [x] Database decision: PostgreSQL via Supabase, shared across team
- [x] Four-screen static frontend mockup delivered (Dashboard, Practice, History, Resume Match)
- [x] Folder structure defined and scaffolded on disk
- [x] `backend/requirements.txt` — pinned dependencies (fastapi, sqlalchemy, alembic, passlib, python-jose, slowapi, pytest, httpx, chromadb)
- [x] `backend/.env` — Supabase project ref, JWT secret, GEMINI_API_KEY, GROQ_API_KEY, DATASET_ROOT, CHROMA_PERSIST_DIRECTORY
- [x] `backend/alembic.ini` — points at `app/db/migrations`
- [x] `backend/app/config.py` — pydantic-settings with LLM API keys and model options
- [x] `backend/app/core/database.py` — SQLAlchemy engine + SessionLocal
- [x] `backend/app/core/security.py` — `hash_password`, `verify_password`, `create_access_token`, `decode_access_token`
- [x] `backend/app/core/rate_limit.py` — slowapi `Limiter`, `LOGIN_RATE_LIMIT = "5/minute"`
- [x] `backend/app/core/exceptions.py` — handlers for 401, 403, 429 (RateLimitExceeded)
- [x] `backend/app/db/base.py` — SQLAlchemy `DeclarativeBase`
- [x] `backend/app/db/migrations/env.py` — Alembic env, reads `DATABASE_URL` from settings
- [x] `backend/app/auth/models.py`, `schemas.py`, `service.py`, `router.py` — User registration, login, profile
- [x] `backend/app/practice/models.py`, `schemas.py`, `service.py`, `router.py` — Question generation, answer submission, topic coverage
- [x] `backend/app/evaluation/models.py`, `schemas.py`, `service.py`, `router.py` — Rubric evaluation and score updates
- [x] `backend/app/dependencies.py` — `get_db()`, `get_current_user()`
- [x] `backend/app/main.py` — FastAPI app with auth, practice, evaluation, history routers mounted

### Current focus & Next steps
1. Test live mock interview flow in frontend browser UI (`http://localhost:5173`)
2. Wire Dashboard and History components to display live user coverage and rubric performance charts
3. Implement `resume/` module (skill extraction from resume PDFs and JD gap matching)

### Completed Roadmap Checklist
- [x] DBMS PDF ingestion (`rag/ingestion.py`)
- [x] Embeddings + Chroma vector store setup (13,824 chunks stored)
- [x] Expansion of ingestion to DSA, OS, CN, OOP, and CS core tools
- [x] Self-RAG relevance filtering + groundedness checking
- [x] Core LLM Integration (Gemini 3.6 Flash + Groq fallback)
- [x] `practice/` module (LLM question generation from RAG chunks, answer submission)
- [x] `evaluation/` module (LLM rubric-based scoring)
- [x] `history/` module (dashboard & chart data API endpoints)
- [x] Frontend template scaffolding (Vite + React, Axios client with JWT interceptors, API services & page templates)
- [x] Frontend practice workspace wiring to live API
- [ ] `resume/` module (skill extraction, JD gap matching)

## Open decisions

- **JWT strategy**: plain JWT with fixed 24h expiry chosen for Phase 1 — no refresh-token rotation. Revisit before viva if evaluators ask about security hardening.

## Rule: folders marked [NOT YET] in ARCHITECTURE.md are not created until their module's phase begins. No empty placeholders.

