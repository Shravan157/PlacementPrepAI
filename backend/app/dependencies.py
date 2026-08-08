"""
dependencies.py — Shared FastAPI dependency functions.

These are reused across every module (auth, and future: practice, resume, etc.).
Keep them generic — do not couple them to auth-specific business logic
beyond what is needed to decode a token and load a user row.
"""

from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_access_token

# ── DB session ────────────────────────────────────────────────────────────────

def get_db() -> Generator[Session, None, None]:
    """
    Yield a SQLAlchemy session and ensure it is closed after the request,
    whether the request succeeds or raises an exception.

    Usage:
        def my_route(db: Session = Depends(get_db)): ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Current user ───────────────────────────────────────────────────────────────
# tokenUrl is only used for OpenAPI UI — the actual /auth/login endpoint
# accepts JSON, not form data.
_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(_oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Decode the Bearer token and return the corresponding User row.

    Raises HTTP 401 if:
      - the token is missing (handled by OAuth2PasswordBearer)
      - the token is invalid or expired (JWTError)
      - the user referenced in the token no longer exists in the DB

    Deliberately imports User inside the function to avoid circular imports
    between auth.models → dependencies → auth.router.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    # Lazy import to avoid circular dependency: auth.router imports get_current_user,
    # and auth.models would otherwise be imported at module load time here.
    from app.auth.models import User  # noqa: PLC0415

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exc

    return user
