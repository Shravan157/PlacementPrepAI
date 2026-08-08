"""
core/database.py — SQLAlchemy engine and session factory.

Reads DATABASE_URL from pydantic-settings (config.py).
Targets Supabase-hosted PostgreSQL via the direct connection string
(not the pgbouncer pooler) as required by ARCHITECTURE.md.

Usage inside route handlers:
    from app.dependencies import get_db
    def my_route(db: Session = Depends(get_db)): ...

Never open raw connections inside route handlers.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings

settings = get_settings()

# connect_args is only needed for SQLite (test isolation).
# For PostgreSQL it is ignored, so this works for both environments.
_connect_args: dict = {}
if settings.database_url.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=_connect_args,
    # pool_pre_ping=True keeps connections healthy after Supabase idle timeouts.
    pool_pre_ping=True,
    echo=False,  # set to True temporarily when debugging SQL
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)
