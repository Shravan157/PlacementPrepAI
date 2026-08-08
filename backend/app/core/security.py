"""
core/security.py — Password hashing and JWT utilities.

All crypto operations are centralised here.
Importing from this module is the ONLY approved way to hash passwords
or issue/validate tokens anywhere in the codebase.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()

# ── Password hashing ──────────────────────────────────────────────────────────
# deprecated="auto" ensures old bcrypt rounds are automatically re-hashed
# on the next successful login (forward-compatible scheme upgrade).
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Return a bcrypt hash of *password*."""
    return _pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches *hashed*, False otherwise."""
    return _pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(
    data: dict[str, Any],
    expires_minutes: int | None = None,
) -> str:
    """
    Encode *data* as a signed JWT.

    *expires_minutes* defaults to ACCESS_TOKEN_EXPIRE_MINUTES from config.
    Pass an explicit value in tests to control expiry without touching env vars.
    """
    if expires_minutes is None:
        expires_minutes = settings.access_token_expire_minutes

    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload["exp"] = expire

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and verify *token*.

    Raises:
        jose.JWTError — if the token is expired, tampered with, or malformed.
                        Callers (dependencies.py) are responsible for catching
                        this and raising an appropriate HTTP 401.
    """
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
