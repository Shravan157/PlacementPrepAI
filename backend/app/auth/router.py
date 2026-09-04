"""
auth/router.py — Auth endpoints.

Routes:
    POST /auth/register  →  201 UserOut  |  409 duplicate  |  422 validation
    POST /auth/login     →  200 Token    |  401 bad creds   |  429 rate limit
    GET  /auth/me        →  200 UserOut  |  401 no/bad token

Rate limit (POST /auth/login): LOGIN_RATE_LIMIT from core/rate_limit.py.
To change the limit, edit that constant — not this file.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.schemas import Token, UserCreate, UserLogin, UserOut, UserUpdate
from app.auth.service import (
    DuplicateEmailError,
    InvalidCredentialsError,
    authenticate_user,
    create_user,
    update_user,
)
from app.core.rate_limit import LOGIN_RATE_LIMIT, limiter
from app.core.security import create_access_token
from app.dependencies import get_current_user, get_db
from app.auth.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> UserOut:
    """
    Create a new user account.

    Returns the created user (without hashed_password).
    409 if the email is already registered.
    """
    try:
        user = create_user(db, user_in)
    except DuplicateEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    return user  # type: ignore[return-value]  # Pydantic from_attributes handles it


@router.post("/login", response_model=Token)
@limiter.limit(LOGIN_RATE_LIMIT)
def login(request: Request, credentials: UserLogin, db: Session = Depends(get_db)) -> Token:
    """
    Authenticate and return a JWT access token.

    Rate-limited to LOGIN_RATE_LIMIT (default 5/minute per IP) to prevent
    brute-force attacks.
    401 on invalid credentials.
    """
    try:
        user = authenticate_user(db, credentials.email, credentials.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    token = create_access_token(data={"sub": user.email})
    return Token(access_token=token, token_type="bearer")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> UserOut:
    """
    Return the currently authenticated user.

    Requires Authorization: Bearer <token> header.
    401 if the token is missing, invalid, or expired.
    """
    return current_user  # type: ignore[return-value]


@router.put("/me", response_model=UserOut)
def update_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserOut:
    """
    Update the authenticated user's profile (name or password).

    Requires Authorization: Bearer <token> header.
    """
    return update_user(db=db, user=current_user, user_update=user_update)  # type: ignore[return-value]
