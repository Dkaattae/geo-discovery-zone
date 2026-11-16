"""Shared fixtures.

Endpoint tests go through the app with `httpx.AsyncClient`, not by calling the
handler — routing, validation and serialisation are part of the behaviour a
client sees, so a test that skips them is not testing the endpoint.
`openapi.yaml` follows the backend and is kept in step with it by hand; no test
checks a response against it (`engineering-decisions.md` E-14).

The database is real, and which one is a choice: by default a temporary SQLite
file, or any URL in `GEO_TEST_DATABASE_URL`. Both are supported backends, so
both can be run:

    uv run pytest                                                    # SQLite
    GEO_TEST_DATABASE_URL=postgresql+psycopg://postgres@localhost/geoquiz_test \
      uv run pytest                                                  # Postgres

The schema is built by the same Alembic migrations production runs, so a
migration that does not match the models fails the suite rather than a
deployment. Each test runs inside a transaction that is rolled back afterwards,
so tests cannot see each other's rows and none of them has to clean up.

A Postgres run starts from a clean schema — it drops and recreates `public`
first, because a database left over from a previous run is not a fixture.
"""

from __future__ import annotations

import os
import random
import tempfile
from collections.abc import AsyncIterator, Iterator
from pathlib import Path
from typing import Any

import httpx
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, text
from sqlalchemy.orm import Session

from app import auth, db, selection, store
from app.auth import DEMO_PASSWORD, DEMO_USERNAME
from app.db import get_db
from app.main import API_PREFIX, app

BACKEND_DIR = Path(__file__).resolve().parents[1]

DEMO_PROFILE_ID = "p-demo-maya"

TEST_URL_ENV = "GEO_TEST_DATABASE_URL"


def _migrate(engine: Engine) -> None:
    """`alembic upgrade head` against this engine, not whatever is configured."""
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "head")


def _reset_schema(engine: Engine) -> None:
    """Start a non-SQLite run from nothing, rather than from last time."""
    with engine.begin() as connection:
        connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    """One migrated database for the suite, with the content bank loaded once."""
    configured = os.environ.get(TEST_URL_ENV)
    with tempfile.TemporaryDirectory() as directory:
        url = configured or f"sqlite:///{Path(directory) / 'test.db'}"
        created = db.configure(url)
        if created.dialect.name != "sqlite":
            _reset_schema(created)
        _migrate(created)
        with Session(bind=created) as setup:
            store.ensure_content_loaded(setup)
            setup.commit()
        yield created
        created.dispose()


@pytest.fixture
def db_session(engine: Engine) -> Iterator[Session]:
    """A session inside a transaction that is rolled back when the test ends.

    The app commits during a request; joining those commits to a savepoint
    means the real commit path is exercised and still leaves nothing behind.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    auth.ensure_demo_account(session)
    store.ensure_demo_profile(session)
    session.flush()

    def override_get_db() -> Iterator[Session]:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield session
    finally:
        app.dependency_overrides.pop(get_db, None)
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
async def client(db_session: Session) -> AsyncIterator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url=f"http://testserver{API_PREFIX}"
    ) as async_client:
        yield async_client


async def token_for(
    client: httpx.AsyncClient, username: str = DEMO_USERNAME, password: str = DEMO_PASSWORD
) -> str:
    response = await client.post("/auth/token", json={"username": username, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["accessToken"]


@pytest.fixture
async def auth_headers(client: httpx.AsyncClient) -> dict[str, str]:
    """Authorization header for the seeded demo account."""
    return {"Authorization": f"Bearer {await token_for(client)}"}


@pytest.fixture
async def other_auth(client: httpx.AsyncClient) -> dict[str, str]:
    """A second account, so cross-account isolation can be tested."""
    await client.post(
        "/auth/register",
        json={"username": "someone-else@example.com", "password": "hunter2hunter2"},
    )
    token = await token_for(client, "someone-else@example.com", "hunter2hunter2")
    return {"Authorization": f"Bearer {token}"}


def assert_problem(response: httpx.Response, status: int) -> dict[str, Any]:
    """Errors are RFC 9457 problem documents, not FastAPI's `{"detail": ...}`."""
    assert response.status_code == status, response.text
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["status"] == status
    assert isinstance(body.get("title"), str) and body["title"]
    return body


# T-101: a mixed session's draw comes from module `random`, which nothing seeds,
# so a test asserting what 100 random serves contain could fail by chance.
FIXED_DRAW_SEED = 101


@pytest.fixture
def fixed_draw(monkeypatch: pytest.MonkeyPatch) -> None:
    """Runs the real `selection.pick_question` for every serve, but over
    candidates sorted by id (so database row order cannot matter) and with one
    `random.Random(FIXED_DRAW_SEED)` per test (so module `random` is never read
    or advanced). Pool, level windows and review cadence are unchanged."""
    rng = random.Random(FIXED_DRAW_SEED)

    def pick(questions: list[dict[str, Any]], **kwargs: Any) -> tuple[dict[str, Any] | None, bool]:
        ordered = sorted(questions, key=lambda q: q["id"])
        return selection.pick_question(ordered, **kwargs, rng=rng)

    monkeypatch.setattr("app.routers.sessions.pick_question", pick)
