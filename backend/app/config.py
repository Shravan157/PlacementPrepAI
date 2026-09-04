"""
config.py — Application settings loaded from environment / .env.

All secrets and environment-specific values live here.
Never hardcode DATABASE_URL, JWT_SECRET_KEY, or any other secret
directly in source code — always reference settings.* instead.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
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
    dataset_root: Path
    chroma_persist_directory: Path = Path("chroma_db")

    # ── LLM API Configuration ──────────────────────────────────────────────────
    gemini_api_key: str = ""
    groq_api_key: str = ""
    default_llm_provider: str = "gemini"
    gemini_model: str = "gemini-3.6-flash"
    groq_model: str = "openai/gpt-oss-120b"

    @field_validator("dataset_root")
    @classmethod
    def resolve_dataset_root(cls, value: Path) -> Path:
        """Resolve and validate the offline dataset location at startup."""
        resolved = value.expanduser().resolve()
        if not resolved.is_dir():
            raise ValueError(f"DATASET_ROOT does not exist or is not a directory: {resolved}")
        return resolved

    @field_validator("chroma_persist_directory")
    @classmethod
    def resolve_chroma_directory(cls, value: Path) -> Path:
        """Resolve the persistent Chroma location without creating it during config loading."""
        return value.expanduser().resolve()

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
