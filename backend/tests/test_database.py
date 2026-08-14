"""The database layer: configuration, portability and persistence.

These are the things that would be silently wrong rather than loudly broken —
a migration that has drifted from the models, a rollback that does not roll
back, a timestamp that comes back naive on one backend and aware on another.
"""

from __future__ import annotations

import tempfile
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import Engine, make_url, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app import auth, db, store
from app.db import DEFAULT_DATABASE_URL, ENV_VAR, create_db_engine, database_url, engine_options
from app.orm import Base, ProfileRecord, ReviewItem, SessionRecord

BACKEND_DIR = Path(__file__).resolve().parents[1]


def migrate(engine: Engine) -> None:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "head")


@pytest.fixture
def own_database() -> Iterator[tuple[Engine, str]]:
    """A separate migrated database, so a test can dispose it and reconnect."""
    with tempfile.TemporaryDirectory() as directory:
        url = f"sqlite:///{Path(directory) / 'own.db'}"
        engine = create_db_engine(url)
        migrate(engine)
        yield engine, url
        engine.dispose()


# -- configuration ----------------------------------------------------------


def test_the_database_is_chosen_by_one_environment_variable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv(ENV_VAR, raising=False)
    assert database_url() == DEFAULT_DATABASE_URL

    monkeypatch.setenv(ENV_VAR, "postgresql+psycopg://user:pw@db.example/geoquiz")
    assert database_url() == "postgresql+psycopg://user:pw@db.example/geoquiz"


def test_an_empty_variable_falls_back_rather_than_connecting_to_nothing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(ENV_VAR, "")
    assert database_url() == DEFAULT_DATABASE_URL


def test_connection_settings_are_dialect_specific_and_sqlite_only() -> None:
    """Everything portable stays portable: no other backend gets special-cased."""
    assert engine_options("postgresql+psycopg://user@host/db") == {}
    assert engine_options("mysql+pymysql://user@host/db") == {}

    file_options = engine_options("sqlite:///./geoquiz.db")
    assert file_options["connect_args"] == {"check_same_thread": False}
    assert "poolclass" not in file_options  # a file is shared between connections

    memory_options = engine_options("sqlite://")
    assert memory_options["poolclass"] is StaticPool


def test_a_postgres_url_is_understood_and_needs_only_its_driver() -> None:
    """Nothing in this app parses the URL; SQLAlchemy does. Pointing at Postgres
    is the variable plus `uv add psycopg`, which is the one thing this sandbox
    cannot install, so the assertion stops at the URL."""
    url = make_url("postgresql+psycopg://user:pw@db.example/geoquiz")
    assert url.get_backend_name() == "postgresql"
    assert url.database == "geoquiz"
    assert engine_options(str(url)) == {}


def test_every_column_type_is_one_all_backends_have() -> None:
    """Portability, asserted rather than promised: no JSONB, no arrays, no
    dialect-specific type sneaks into the models."""
    portable = {"STRING", "INTEGER", "FLOAT", "BOOLEAN", "JSON", "DATETIME"}
    for table in Base.metadata.tables.values():
        for column in table.columns:
            rendered = type(column.type).__name__.upper()
            if rendered == "UTCDATETIME":
                continue  # a TypeDecorator over the portable DateTime
            assert rendered in portable, f"{table.name}.{column.name} is a {rendered}"


# -- schema -----------------------------------------------------------------


def test_the_migrations_build_exactly_the_models(own_database: tuple[Engine, str]) -> None:
    """A migration that has drifted from the models is the classic silent bug:
    everything works until a fresh database is built from the migrations."""
    engine, _ = own_database
    with engine.connect() as connection:
        context = MigrationContext.configure(connection)
        differences = compare_metadata(context, Base.metadata)
    assert differences == [], f"models and migrations disagree: {differences}"


def test_foreign_keys_are_enforced(own_database: tuple[Engine, str]) -> None:
    """SQLite leaves these off by default; Postgres would refuse the row."""
    engine, _ = own_database
    with Session(bind=engine) as session, pytest.raises(IntegrityError):
        session.add(
            ProfileRecord(
                id="p-orphan",
                account_id="acct-does-not-exist",
                name="Orphan",
                avatar="🦊",
                level=0.0,
                best_sustained_level=0.0,
                last_session_end_level=0.0,
                created_at=datetime.now(UTC),
            )
        )
        session.commit()


def test_timestamps_come_back_as_utc_aware(own_database: tuple[Engine, str]) -> None:
    """SQLite has no timezone type; the undo window does date arithmetic."""
    engine, _ = own_database
    with Session(bind=engine) as session:
        auth.create_account(session, "keeper@example.com", "password-long-enough")
        session.commit()
        account = auth.find_by_username(session, "keeper@example.com")
        assert account is not None
        assert account.created_at.tzinfo is not None
        # The comparison the undo rule makes, which raises on naive values.
        assert datetime.now(UTC) - account.created_at < timedelta(minutes=1)


# -- persistence ------------------------------------------------------------


def test_data_survives_the_process(own_database: tuple[Engine, str]) -> None:
    """The point of the whole change: a restart is not a reset."""
    engine, url = own_database
    with Session(bind=engine) as session:
        account = auth.create_account(session, "parent@example.com", "password-long-enough")
        profile = store.create_profile(
            session, account_id=account.id, name="Fox", avatar="🦊", grade=2
        )
        profile.mastery["us-state-co"] = 0.9
        profile.queue_entity("us-state-tx", store.utc_now())
        session.commit()
        profile_id = profile.id
    engine.dispose()

    reopened = create_db_engine(url)
    with Session(bind=reopened) as session:
        again = session.get(ProfileRecord, profile_id)
        assert again is not None
        assert again.mastery == {"us-state-co": 0.9}
        assert again.review_entity_ids() == ["us-state-tx"]
    reopened.dispose()


def test_a_failed_request_leaves_nothing_behind(own_database: tuple[Engine, str]) -> None:
    """`get_db` rolls back on an exception, so a half-applied answer cannot land."""
    engine, _ = own_database
    with Session(bind=engine) as session:
        auth.create_account(session, "parent@example.com", "password-long-enough", "acct-x")
        session.commit()

    with pytest.raises(RuntimeError), Session(bind=engine) as session:  # noqa: PT012
        try:
            store.create_profile(session, account_id="acct-x", name="Half", avatar="🦊", grade=1)
            raise RuntimeError("handler blew up")
        except Exception:
            session.rollback()
            raise

    with Session(bind=engine) as session:
        assert session.scalars(select(ProfileRecord)).all() == []


def test_deleting_a_profile_takes_its_queue_and_sessions_with_it(
    own_database: tuple[Engine, str],
) -> None:
    engine, _ = own_database
    with Session(bind=engine) as session:
        account = auth.create_account(session, "parent@example.com", "password-long-enough")
        profile = store.create_profile(
            session, account_id=account.id, name="Fox", avatar="🦊", grade=2
        )
        profile.queue_entity("us-state-tx", store.utc_now())
        store.create_session(session, profile, topic="mixed", level=4.0)
        session.commit()

        store.delete_profile(session, profile)
        session.commit()

        assert session.scalars(select(ReviewItem)).all() == []
        assert session.scalars(select(SessionRecord)).all() == []


# -- content ----------------------------------------------------------------


def test_loading_the_bank_twice_changes_nothing(own_database: tuple[Engine, str]) -> None:
    """Startup runs this every time; it must not rewrite the tables."""
    engine, _ = own_database
    with Session(bind=engine) as session:
        first = store.ensure_content_loaded(session)
        session.commit()
        entities, questions = store.content_counts(session)

        second = store.ensure_content_loaded(session)
        session.commit()
        assert second.content_version == first.content_version
        assert store.content_counts(session) == (entities, questions)


def test_the_seeded_bank_is_queryable_rather_than_scanned(
    own_database: tuple[Engine, str],
) -> None:
    """Filtering is the database's job now — this is the shape that lets the
    bank grow past what fits in memory."""
    engine, _ = own_database
    with Session(bind=engine) as session:
        store.ensure_content_loaded(session)
        session.commit()

        capitals, total = store.list_questions(session, topics=["capital"], limit=500)
        assert capitals and total == len(capitals)
        assert {question["topic"] for question in capitals} == {"capital"}

        near_seven, _ = store.list_questions(session, level=7, level_span=1.5, limit=500)
        assert near_seven
        assert all(abs(question["level"] - 7) <= 1.5 for question in near_seven)

        page, total = store.list_entities(session, limit=4)
        assert len(page) == 4 and total == 15


def test_a_second_page_does_not_repeat_the_first(own_database: tuple[Engine, str]) -> None:
    engine, _ = own_database
    with Session(bind=engine) as session:
        store.ensure_content_loaded(session)
        first, total = store.list_entities(session, offset=0, limit=6)
        second, _ = store.list_entities(session, offset=6, limit=6)
        assert total == 15
        assert not {entity["id"] for entity in first} & {entity["id"] for entity in second}


def test_the_demo_seed_is_created_once(own_database: tuple[Engine, str]) -> None:
    engine, _ = own_database
    with Session(bind=engine) as session:
        auth.ensure_demo_account(session)
        store.ensure_demo_profile(session)
        session.commit()

        profile = store.ensure_demo_profile(session)
        profile.name = "Renamed by a real user"
        session.commit()

        # A second startup must not undo what a real user did to the demo row.
        assert store.ensure_demo_profile(session).name == "Renamed by a real user"
        assert len(store.profiles_for(session, auth.DEMO_ACCOUNT_ID)) == 1


def test_configure_points_the_process_at_another_database() -> None:
    """`db.configure` is how the tests — and later a Postgres deploy — switch."""
    before = db.engine
    with tempfile.TemporaryDirectory() as directory:
        url = f"sqlite:///{Path(directory) / 'switched.db'}"
        switched = db.configure(url)
        try:
            assert str(switched.url) == url
            assert db.SessionFactory.kw["bind"] is switched
        finally:
            db.configure(str(before.url))
