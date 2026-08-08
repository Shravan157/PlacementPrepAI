"""
config.py — Application settings loaded from environment / .env.

All secrets and environment-specific values live here.
Never hardcode DATABASE_URL, JWT_SECRET_KEY, or any other secret
directly in source code — always reference settings.* instead.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Database ───────────────────────────────────────────────────────────────
    # Points at Supabase-hosted PostgreSQL (direct connection, not pgbouncer).
    database_url: str

    # ── JWT ────────────────────────────────────────────────────────────────────
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # ── Dataset root (used by rag/ module when that phase begins) ──────────────
    # Kept here so config is the single source of truth for paths.
    dataset_path: str = "/datasets"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        # Silently ignore env vars not declared in this model (e.g. TEST_DATABASE_URL
        # which is consumed by tests/conftest.py directly, not by the app).
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Return a cached Settings instance.

    The @lru_cache ensures the .env file is read only once per process,
    which is the correct behaviour for a production server.  In tests,
    call get_settings.cache_clear() after monkey-patching env vars if needed.
    """
    return Settings()
