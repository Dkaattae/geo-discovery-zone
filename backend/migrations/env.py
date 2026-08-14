"""Alembic environment.

The schema is owned by migrations, not by `create_all` — the repo's convention,
and the reason a Postgres move later is a migration run rather than a guess
about what the tables looked like.

The URL comes from the same place the app gets it: `GEO_DATABASE_URL`. Alembic's
own `sqlalchemy.url` is left empty so there is only ever one answer to "which
database is this?".
"""

from __future__ import annotations

from logging.config import fileConfig

from alembic import context

from app.db import create_db_engine, database_url
from app.orm import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = config.attributes.get("connection", None)
    if connectable is not None:
        # A caller (the test suite) handed us a live connection to migrate.
        context.configure(
            connection=connectable,
            target_metadata=target_metadata,
            compare_type=True,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()
        return

    engine = create_db_engine(database_url())
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            # Batch mode keeps ALTERs possible on SQLite, which cannot drop or
            # alter a column in place. It is a no-op on every other backend.
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
