"""Postgres, when the suite is pointed at one.

The whole suite runs against whatever `GEO_TEST_DATABASE_URL` names, so the API
tests already cover behaviour on Postgres. What is left here is the handful of
things that are *only* interesting on a real server: that the same migrations
build the same schema, that the sequences and JSON columns behave, and that
concurrency does what a single-file database never had to.

    GEO_TEST_DATABASE_URL=postgresql+psycopg://postgres@127.0.0.1:5432/geoquiz_test \\
      uv run pytest

Skipped entirely on SQLite, which is the default, so nobody needs a server to
run the tests.
"""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import Engine, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import auth, store
from app.orm import Base, ProfileRecord, ReviewItem

pytestmark = pytest.mark.usefixtures("engine")


@pytest.fixture(autouse=True)
def only_postgres(engine: Engine) -> None:
    if engine.dialect.name != "postgresql":
        pytest.skip("suite is running on SQLite; set GEO_TEST_DATABASE_URL to run these")


def test_the_driver_in_use_is_the_one_shipped(engine: Engine) -> None:
    assert engine.dialect.driver == "psycopg"


def test_the_migrations_build_exactly_the_models_here_too(engine: Engine) -> None:
    """The same check the SQLite tests make, against a real server: a migration
    that only happens to be right on SQLite is not portable."""
    with engine.connect() as connection:
        context = MigrationContext.configure(connection)
        differences = compare_metadata(context, Base.metadata)
    assert differences == [], f"models and migrations disagree on Postgres: {differences}"


def test_the_schema_landed_with_the_types_expected(engine: Engine) -> None:
    """`json` not `jsonb`, `timestamptz` not a naive timestamp, `double
    precision` for a level — the portable choices, as Postgres built them."""
    with engine.connect() as connection:
        columns = dict(
            connection.execute(
                text(
                    "select column_name, data_type from information_schema.columns "
                    "where table_name = 'profiles'"
                )
            ).all()
        )
    assert columns["mastery"] == "json"
    assert columns["created_at"] == "timestamp with time zone"
    assert columns["level"] == "double precision"


def test_a_sequence_backs_the_review_queue_order(db_session: Session) -> None:
    """`seq` is a server-assigned identity here, not SQLite's rowid alias."""
    account = auth.create_account(db_session, "parent@example.com", "password-long-enough")
    profile = store.create_profile(
        db_session, account_id=account.id, name="Fox", avatar="🦊", grade=2
    )
    now = store.utc_now()
    profile.queue_entity("us-state-tx", now)
    profile.queue_entity("us-state-co", now)
    db_session.flush()

    seqs = [item.seq for item in profile.review_queue]
    assert all(value is not None for value in seqs)
    assert seqs == sorted(seqs)
    assert profile.review_entity_ids() == ["us-state-tx", "us-state-co"]


def test_json_columns_round_trip_unicode_and_nesting(db_session: Session) -> None:
    account = auth.create_account(db_session, "parent@example.com", "password-long-enough")
    profile = store.create_profile(
        db_session, account_id=account.id, name="Fox", avatar="🦊", grade=2
    )
    profile.mastery.update({"us-state-co": 0.8, "country-côte": 0.25})
    db_session.flush()
    db_session.expire(profile)

    reloaded = db_session.get(ProfileRecord, profile.id)
    assert reloaded is not None
    assert reloaded.mastery == {"us-state-co": 0.8, "country-côte": 0.25}
    assert reloaded.avatar == "🦊"


def test_foreign_keys_cascade_on_the_server(db_session: Session) -> None:
    """SQLite needed a pragma for this; Postgres has always meant it."""
    account = auth.create_account(db_session, "parent@example.com", "password-long-enough")
    profile = store.create_profile(
        db_session, account_id=account.id, name="Fox", avatar="🦊", grade=2
    )
    profile.queue_entity("us-state-tx", store.utc_now())
    db_session.flush()
    profile_id = profile.id

    # Deleted in SQL, behind the ORM's back, so the cascade under test is the
    # server's rather than SQLAlchemy's.
    db_session.execute(text("DELETE FROM profiles WHERE id = :id"), {"id": profile_id})
    db_session.expunge_all()
    remaining = db_session.scalars(
        select(ReviewItem).where(ReviewItem.profile_id == profile_id)
    ).all()
    assert remaining == []


def test_an_orphan_row_is_refused(db_session: Session) -> None:
    db_session.add(
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
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_two_accounts_cannot_share_a_username(db_session: Session) -> None:
    """The unique index is the thing standing between a race and two accounts
    with one name; SQLite and Postgres must agree that it holds."""
    auth.create_account(db_session, "parent@example.com", "password-long-enough")
    # `create_account` flushes, so the constraint fires inside the call.
    with pytest.raises(IntegrityError):
        auth.create_account(db_session, "parent@example.com", "another-long-password")


def test_timestamps_survive_the_wire_as_utc(db_session: Session) -> None:
    account = auth.create_account(db_session, "keeper@example.com", "password-long-enough")
    db_session.flush()
    db_session.expire(account)

    reloaded = auth.find_by_username(db_session, "keeper@example.com")
    assert reloaded is not None
    assert reloaded.created_at.tzinfo is not None
    assert reloaded.created_at.utcoffset() == datetime.now(UTC).utcoffset()
