"""
auth/service.py — Auth business logic.

Functions here raise Python exceptions, not HTTP exceptions.
router.py is responsible for translating domain errors to HTTP status codes.
This separation keeps service functions reusable and testable in isolation.
"""

from sqlalchemy.orm import Session

from app.auth.models import User
from app.auth.schemas import UserCreate
from app.core.security import hash_password, verify_password


# ── Domain exceptions ─────────────────────────────────────────────────────────

class DuplicateEmailError(Exception):
    """Raised when a registration email is already in use."""


class InvalidCredentialsError(Exception):
    """Raised when email/password combination doesn't match."""


# ── Service functions ─────────────────────────────────────────────────────────

def get_user_by_email(db: Session, email: str) -> User | None:
    """
    Return the User row for *email*, or None if not found.
    Case-sensitive lookup (email is stored exactly as supplied at registration).
    """
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user_in: UserCreate) -> User:
    """
    Insert a new user row and return the created User ORM object.

    Raises:
        DuplicateEmailError — if *email* is already registered.
    """
    if get_user_by_email(db, user_in.email):
        raise DuplicateEmailError(f"Email already registered: {user_in.email}")

    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        name=user_in.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Verify credentials and return the User on success.

    Raises:
        InvalidCredentialsError — if email not found or password doesn't match.
    """
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError("Invalid email or password")
    return user
