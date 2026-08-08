"""
core/exceptions.py — Application-level exception handlers.

Registered on the FastAPI app in main.py.
All error responses follow the FastAPI default shape:
    { "detail": "<message>" }
so clients have a consistent contract across all endpoints.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded


async def http_401_handler(request: Request, exc: Exception) -> JSONResponse:
    """Unauthorised — missing, invalid, or expired Bearer token."""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": "Not authenticated"},
        headers={"WWW-Authenticate": "Bearer"},
    )


async def http_403_handler(request: Request, exc: Exception) -> JSONResponse:
    """Forbidden — authenticated but not allowed to perform the action."""
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": "Forbidden"},
    )


async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """429 Too Many Requests — slowapi fires this when LOGIN_RATE_LIMIT is hit."""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        # CHANGE HERE: exc.detail -> exc.description
        content={"detail": f"Rate limit exceeded: {exc.description}"}, 
    )
