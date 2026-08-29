"""
main.py — FastAPI application entrypoint.

Phase 2: mounts auth, practice, evaluation, and history routers.
Do not add resume/ router here until PROGRESS.md marks that module as active.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.core.exceptions import http_401_handler, http_403_handler, rate_limit_handler
from app.core.rate_limit import limiter
from app.auth.router import router as auth_router
from app.evaluation.router import router as evaluation_router
from app.history.router import router as history_router
from app.practice.router import router as practice_router

app = FastAPI(
    title="Placement Prep AI",
    description=(
        "RAG-based mock interview and resume evaluation system "
        "for CS/IT campus placement preparation (DSA, OS, DBMS, CN, OOP)."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# The Vite development UI runs on a different local origin from the API.  Its
# JSON auth requests trigger a browser preflight, so CORS must be configured on
# the API rather than letting OPTIONS fall through to the auth router (405).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Rate limiter ───────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)  # type: ignore[arg-type]

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(practice_router)
app.include_router(evaluation_router)
app.include_router(history_router)

# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
def health() -> dict:
    """Liveness probe — returns 200 if the server is running."""
    return {"status": "ok"}
