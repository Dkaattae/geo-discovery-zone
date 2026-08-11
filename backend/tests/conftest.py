"""Shared fixtures.

Endpoint tests go through the app with `httpx.AsyncClient`, not by calling the
handler — routing, validation and serialisation are part of what the contract
promises. `ASGITransport` does not run the lifespan, so the seed is explicit
here, which also means every test starts from the same known state.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

import httpx
import pytest
import yaml

from app.auth import DEMO_PASSWORD, DEMO_USERNAME, auth_store
from app.main import API_PREFIX, app
from app.store import store

SPEC_PATH = Path(__file__).resolve().parents[2] / "openapi.yaml"

DEMO_PROFILE_ID = "p-demo-maya"


@pytest.fixture(autouse=True)
def seeded() -> None:
    store.seed()
    auth_store.seed()


@pytest.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
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
async def auth(client: httpx.AsyncClient) -> dict[str, str]:
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
