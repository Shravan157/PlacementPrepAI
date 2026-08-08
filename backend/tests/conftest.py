"""
tests/conftest.py — pytest fixtures for the test suite.

Uses SQLite in-memory as the test database so that:
  - Tests never touch the shared Supabase dev database
  - No external services are needed to run the suite locally
  - Each test function gets a fresh, empty schema (function-scoped fixture)

DATABASE_URL is overridden via os.environ BEFORE any app module is imported
so that pydantic-settings / database.py see "sqlite://" instead of the
Supabase connection string from .env.
"""

import os

# ── Override DATABASE_URL before any app import touches pydantic-settings ──────
# Must happen before `from app.*` imports below.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-not-for-production"

# Clear the lru_cache so get_settings() re-reads the env vars we just set.
from app.config import get_settings  # noqa: E402
get_settings.cache_clear()

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.dependencies import get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402  — alias avoids collision with `app` package

# Import all model modules so that Base.metadata is fully populated
# before create_all() runs.
import app.auth.models  # noqa: F401, E402  (this rebinds `app` to the package — hence the alias above)

# ── SQLite in-memory test engine ───────────────────────────────────────────────
# StaticPool ensures all connections share the same in-memory database
# (important because SQLite in-memory DBs are connection-scoped by default).
TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="function")
def db_session():
    """
    Create all tables, yield a session, then drop all tables.
    Function-scoped so every test starts with a clean slate.
    """
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Return a TestClient with get_db overridden to use the test session.
    Dependency override is cleared after the test to avoid cross-test leakage.
    """

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass  # session lifecycle managed by db_session fixture

    fastapi_app.dependency_overrides[get_db] = _override_get_db
    with TestClient(fastapi_app, raise_server_exceptions=True) as c:
        yield c
    fastapi_app.dependency_overrides.clear()
