"""
db/migrations/env.py — Alembic environment script.

Reads DATABASE_URL from the environment (via app.config) so that
secrets never appear in version-controlled files.

Model modules MUST be imported before target_metadata is referenced
so that Alembic autogenerate can detect the correct schema.
"""
import sys
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# ── Make sure the `app` package is importable from this file ──────────────────
# env.py lives at backend/app/db/migrations/env.py.
# When alembic runs from backend/, `app` is already on sys.path via the
# installed package.  The insert below handles the case where alembic is
# invoked from a different working directory.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

# ── Import project config and Base ────────────────────────────────────────────
from app.config import get_settings          # noqa: E402
from app.db.base import Base                 # noqa: E402

# !! IMPORTANT: import every model module here so that their tables are
# registered in Base.metadata before autogenerate runs.
import app.auth.models  # noqa: F401, E402

settings = get_settings()

# ── Alembic config ────────────────────────────────────────────────────────────
config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


# ── Migration modes ───────────────────────────────────────────────────────────

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no live DB connection required)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connects to the DB)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
