"""Engine, session factory and the request-scoped session dependency.

One environment variable decides the database: `GEO_DATABASE_URL`, any URL
SQLAlchemy understands. It defaults to a SQLite file beside the app, so a fresh
clone runs with no setup.

    GEO_DATABASE_URL=sqlite:///./geoquiz.db                  # the default
    GEO_DATABASE_URL=postgresql+psycopg://user@host/geoquiz  # later, unchanged code

Nothing outside this module names a dialect. The models use portable column
types, the queries are ORM queries, and the only SQLite-specific line here is
turning on foreign keys — SQLite's are off by default, which would silently
stop enforcing the very constraints Postgres enforces, and finding that out
after a migration is the wrong time.
"""

from __future__ import annotations

import os
from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

DEFAULT_DATABASE_URL = "sqlite:///./geoquiz.db"
ENV_VAR = "GEO_DATABASE_URL"


def database_url() -> str:
    return os.environ.get(ENV_VAR) or DEFAULT_DATABASE_URL


def engine_options(url: str) -> dict[str, Any]:
    """Per-dialect connection settings, kept in one place.

    SQLite needs two accommodations and no other dialect needs either:
    `check_same_thread` because FastAPI serves requests on a thread pool, and a
    single shared connection for in-memory databases, which otherwise give each
    connection its own empty database.
    """
    if not url.startswith("sqlite"):
        return {}
    options: dict[str, Any] = {"connect_args": {"check_same_thread": False}}
    if ":memory:" in url or url.endswith("sqlite://"):
        options["poolclass"] = StaticPool
    return options


def create_db_engine(url: str | None = None, *, echo: bool = False) -> Engine:
    resolved = url or database_url()
    created = create_engine(resolved, echo=echo, future=True, **engine_options(resolved))
    if created.dialect.name == "sqlite":
        _enable_sqlite_foreign_keys(created)
    return created


def _enable_sqlite_foreign_keys(target: Engine) -> None:
    """Two SQLite-only corrections, both about matching what other backends do.

    Foreign keys are off by default in SQLite, so without the pragma the
    constraints Postgres enforces would silently stop being enforced here.

    The driver's own transaction handling is worse: pysqlite opens transactions
    implicitly, commits before DDL, and breaks `SAVEPOINT`. Turning it off and
    emitting `BEGIN` explicitly is the fix SQLAlchemy documents, and it is what
    makes a rollback actually roll back — which the test suite depends on and a
    failed request depends on just as much.
    """

    @event.listens_for(target, "connect")
    def _on_connect(dbapi_connection: Any, _record: Any) -> None:
        dbapi_connection.isolation_level = None
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    @event.listens_for(target, "begin")
    def _on_begin(connection: Any) -> None:
        connection.exec_driver_sql("BEGIN")


engine: Engine = create_db_engine()
SessionFactory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def configure(url: str) -> Engine:
    """Point the process at another database. Used by tests and by scripts."""
    global engine
    engine.dispose()
    engine = create_db_engine(url)
    SessionFactory.configure(bind=engine)
    return engine


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request, committed or rolled back.

    A handler that raises leaves nothing half-written — the answer that moved a
    level and queued an entity either lands whole or not at all.
    """
    session = SessionFactory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@contextmanager
def session_scope() -> Iterator[Session]:
    """The same lifecycle outside a request — startup seeding, scripts, tests."""
    session = SessionFactory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
