"""
db/base.py — SQLAlchemy declarative base.

Every ORM model in the project inherits from Base defined here.
Alembic's env.py imports Base.metadata to drive autogenerate.

Import order matters for Alembic autogenerate:
  All model modules must be imported BEFORE Base.metadata is inspected.
  The canonical place to do this is alembic/env.py — see that file.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Project-wide SQLAlchemy declarative base class."""
    pass
