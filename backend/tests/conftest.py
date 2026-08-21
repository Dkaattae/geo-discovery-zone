"""Shared fixtures.

Endpoint tests go through the app with `httpx.AsyncClient`, not by calling the
handler — routing, validation and serialisation are part of what the contract
promises.

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
import tempfile
from collections.abc import AsyncIterator, Iterator
from pathlib import Path
from typing import Any

import httpx
import pytest
import yaml
from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, text
from sqlalchemy.orm import Session

from app import auth, db, store
from app.auth import DEMO_PASSWORD, DEMO_USERNAME
from app.db import get_db
from app.main import API_PREFIX, app

SPEC_PATH = Path(__file__).resolve().parents[2] / "openapi.yaml"
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


# -- contract assertions ----------------------------------------------------


@pytest.fixture(scope="session")
def spec() -> dict[str, Any]:
    return yaml.safe_load(SPEC_PATH.read_text(encoding="utf-8"))


def resolve(spec: dict[str, Any], schema: dict[str, Any]) -> dict[str, Any]:
    """Flattens `$ref` and `allOf` into one schema object."""
    if "$ref" in schema:
        node: Any = spec
        for part in schema["$ref"].lstrip("#/").split("/"):
            node = node[part]
        return resolve(spec, node)
    if "allOf" in schema:
        merged: dict[str, Any] = {"type": "object", "required": [], "properties": {}}
        for part in schema["allOf"]:
            resolved = resolve(spec, part)
            merged["required"] += resolved.get("required", [])
            merged["properties"].update(resolved.get("properties", {}))
        return merged
    return schema


def assert_matches(spec: dict[str, Any], schema_name: str, payload: dict[str, Any]) -> None:
    """Every required property of `schema_name` is present, and nothing the
    contract does not declare is."""
    schema = resolve(spec, {"$ref": f"#/components/schemas/{schema_name}"})
    missing = [key for key in schema.get("required", []) if key not in payload]
    assert not missing, f"{schema_name} response is missing required {missing}: {payload}"
    declared = set(schema.get("properties", {}))
    undeclared = [key for key in payload if key not in declared]
    assert not undeclared, f"{schema_name} response carries undeclared {undeclared}"


def assert_problem(response: httpx.Response, status: int) -> dict[str, Any]:
    """Errors are RFC 9457 problem documents, not FastAPI's `{"detail": ...}`."""
    assert response.status_code == status, response.text
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["status"] == status
    assert isinstance(body.get("title"), str) and body["title"]
    return body
