"""
auth/schemas.py — Pydantic v2 request/response models for auth endpoints.

Shapes match API_REFERENCE.md exactly.
Never include hashed_password in any response schema.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


# ── Request schemas ────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """POST /auth/register — request body."""

    email: EmailStr
    password: str
    name: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name must not be blank")
        return v.strip()


class UserLogin(BaseModel):
    """POST /auth/login — request body."""

    email: EmailStr
    password: str


# ── Response schemas ───────────────────────────────────────────────────────────

class UserOut(BaseModel):
    """
    Returned after register and from /auth/me.
    hashed_password is never included.
    """

    id: uuid.UUID
    email: EmailStr
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    """POST /auth/login — response body."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Decoded JWT payload — used internally by get_current_user."""

    sub: str  # stores user email (subject claim)
