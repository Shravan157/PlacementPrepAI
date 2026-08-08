# Prompt Templates

Reusable prompts for AI-assisted ("vibe coding") sessions on this project. Copy the relevant block, fill in the blank, paste into the coding assistant. Always paste ARCHITECTURE.md and AGENTS.md as context first if the tool supports persistent context — otherwise include them inline.

---

## Master context block (paste first, every session)

```
Project: Placement Prep AI — RAG-based mock interview and resume evaluation
system for CS/IT campus placement prep. Architecture is locked — see
ARCHITECTURE.md. Do not deviate from it. Current phase: core modules only
(auth, core, db) — see PROGRESS.md for exact status. Do not scaffold or
generate code for practice/, evaluation/, resume/, rag/, or history/ unless
I explicitly say the phase has changed. Follow AGENTS.md rules exactly.
```

---

## Phase 1 prompts — core modules

### 1. Database setup
```
Create backend/app/core/database.py using SQLAlchemy. It should:
- Read DATABASE_URL from environment via pydantic-settings (config.py)
- Create an engine and a SessionLocal factory
- Expose a get_db() generator dependency for FastAPI's Depends
Target: Supabase-hosted PostgreSQL. Use the direct connection string format,
not the pgbouncer pooler, unless I say otherwise.
```

### 2. User model
```
Create backend/app/auth/models.py with a SQLAlchemy User model:
- id: UUID primary key
- email: unique, indexed, not null
- hashed_password: not null
- name: not null
- created_at: timestamp, default now
Base class comes from backend/app/db/base.py.
```

### 3. Migration
```
Generate an Alembic migration for the User model above. This should create
only the users table — no other tables. Confirm the migration file before
running it.
```

### 4. Security utilities
```
Create backend/app/core/security.py with:
- hash_password(password: str) -> str using passlib[bcrypt]
- verify_password(plain: str, hashed: str) -> bool
- create_access_token(data: dict, expires_minutes: int) -> str using JWT
  (python-jose), reading JWT_SECRET_KEY and JWT_ALGORITHM from config
- decode_access_token(token: str) -> dict, raising on invalid/expired tokens
```

### 5. Auth schemas
```
Create backend/app/auth/schemas.py with Pydantic v2 models:
- UserCreate (email, password, name) — password min_length=8
- UserLogin (email, password)
- UserOut (id, email, name, created_at) — for responses, never include
  hashed_password
- Token (access_token, token_type)
```

### 6. Auth service
```
Create backend/app/auth/service.py with functions:
- create_user(db, user_in: UserCreate) -> User — checks for existing email,
  hashes password, inserts, returns the created user
- authenticate_user(db, email, password) -> User | None
- get_user_by_email(db, email) -> User | None
Uses core/security.py for hashing. Raises appropriate exceptions on
duplicate email / invalid credentials — let router.py translate to HTTP.
```

### 7. Auth router
```
Create backend/app/auth/router.py with:
- POST /auth/register -> calls auth/service.create_user, returns UserOut,
  409 on duplicate email
- POST /auth/login -> calls auth/service.authenticate_user, returns Token,
  401 on failure, rate-limited via slowapi
- GET /auth/me -> requires Bearer token via a get_current_user dependency,
  returns UserOut
Match the request/response shapes documented in API_REFERENCE.md exactly.
```

### 8. Current user dependency
```
Create the get_current_user dependency in backend/app/dependencies.py:
- Extracts Bearer token via FastAPI's OAuth2PasswordBearer
- Decodes it via core/security.decode_access_token
- Looks up the user in the DB, raises 401 if not found or token invalid
This will be reused by every future module (practice, resume, etc.) — keep
it generic, don't couple it to auth-specific logic beyond token decoding.
```

### 9. Rate limiting
```
Create backend/app/core/rate_limit.py using slowapi. Apply a limit to
/auth/login specifically (brute-force protection) — pick a reasonable
default (e.g. 5/minute) and tell me where to adjust it.
```

### 10. Tests
```
Write backend/tests/test_auth.py covering:
- register with valid data -> 201
- register with duplicate email -> 409
- login with correct credentials -> 200, returns token
- login with wrong password -> 401
- /auth/me with valid token -> 200
- /auth/me with missing/invalid token -> 401
Use FastAPI's TestClient and a test database or fixture-based rollback —
do not run tests against the shared Supabase dev database.
```

---

## Guardrail prompt (use if the assistant starts overreaching)

```
Stop — check AGENTS.md and PROGRESS.md before continuing. Are you about to
create a file or folder outside the current phase (auth, core, db)? If so,
don't. Tell me what you were about to do and I'll confirm before you proceed.
```

---

## Phase 2 prompts (project-specific modules)

Not written yet — add these when PROGRESS.md marks Phase 2 as active. Do not ask the assistant to build `rag/`, `practice/`, `evaluation/`, or `resume/` using Phase 1 prompts as a template without first updating PROGRESS.md and confirming the phase gate in AGENTS.md.
