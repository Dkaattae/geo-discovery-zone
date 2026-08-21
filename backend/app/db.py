"""Engine, session factory and the request-scoped session dependency.

One environment variable decides the database: `GEO_DATABASE_URL`, any URL
SQLAlchemy understands. It defaults to a SQLite file beside the app, so a fresh
clone runs with no setup, and Postgres is the same code with a different URL.

    GEO_DATABASE_URL=sqlite:///./geoquiz.db                       # the default
    GEO_DATABASE_URL=postgresql+psycopg://user:pw@host/geoquiz    # Postgres

Both are supported and both are tested: the whole suite runs against either,
chosen with `GEO_TEST_DATABASE_URL`.

Nothing outside this module names a dialect. The models use portable column
types and the queries are ORM queries; what lives here is the per-dialect
connection settings, and they exist to make the two behave the same rather than
to let them differ:

- **SQLite** gets foreign keys switched on (off by default, which would
  silently stop enforcing the constraints Postgres enforces) and the driver's
  implicit transaction handling replaced with explicit `BEGIN`, without which a
  rollback does not reliably roll back.
- **Postgres** gets `pool_pre_ping`, because a pooled connection that a
  restart, a failover or an idle timeout has closed underneath us looks fine
  until the query fails. SQLite has no such thing to lose.
"""

from __future__ import annotations

import os
from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from sqlalchemy import Engine, create_engine, event, make_url
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

DEFAULT_DATABASE_URL = "sqlite:///./geoquiz.db"
ENV_VAR = "GEO_DATABASE_URL"

# Recycle before the hour most managed Postgres services idle a connection out.
POOL_RECYCLE_SECONDS = 1800
CONNECT_TIMEOUT_SECONDS = 10


def database_url() -> str:
    return os.environ.get(ENV_VAR) or DEFAULT_DATABASE_URL


def engine_options(url: str) -> dict[str, Any]:
    """Per-dialect connection settings, kept in one place.

    SQLite needs two accommodations no other dialect wants: `check_same_thread`
    because FastAPI serves requests on a thread pool, and a single shared
    connection for in-memory databases, which otherwise give each connection its
    own empty database.

    A networked database needs the opposite kind of care — the connection can
    die while it sits in the pool — so Postgres gets `pool_pre_ping` and a
    connect timeout rather than hanging when the server is unreachable.
    """
    backend = make_url(url).get_backend_name()

    if backend == "sqlite":
        options: dict[str, Any] = {"connect_args": {"check_same_thread": False}}
        if ":memory:" in url or url.endswith("sqlite://"):
            options["poolclass"] = StaticPool
        return options

    if backend == "postgresql":
        return {
            "pool_pre_ping": True,
            "pool_recycle": POOL_RECYCLE_SECONDS,
            "connect_args": {
                "connect_timeout": CONNECT_TIMEOUT_SECONDS,
                # Names the app in pg_stat_activity, so "what is holding this
                # lock?" has an answer.
                "application_name": "geoquiz-api",
            },
        }

    return {}


def create_db_engine(url: str | None = None, *, echo: bool = False) -> Engine:
    resolved = url or database_url()
    created = create_engine(resolved, echo=echo, future=True, **engine_options(resolved))
    if created.dialect.name == "sqlite":
        _configure_sqlite(created)
    return created


def _configure_sqlite(target: Engine) -> None:
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
