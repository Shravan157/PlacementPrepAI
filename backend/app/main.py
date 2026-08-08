"""
main.py — FastAPI application entrypoint.

Phase 1: mounts ONLY the auth router.
Do not add practice/, rag/, evaluation/, resume/, or history/ routers here
until PROGRESS.md marks those modules as active.
"""

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.auth.router import router as auth_router
from app.core.exceptions import http_401_handler, http_403_handler, rate_limit_handler
from app.core.rate_limit import limiter

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

# ── Rate limiter ───────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)  # type: ignore[arg-type]

# ── Routers ────────────────────────────────────────────────────────────────────
# Phase 1: auth only.
app.include_router(auth_router)

# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
def health() -> dict:
    """Liveness probe — returns 200 if the server is running."""
    return {"status": "ok"}
