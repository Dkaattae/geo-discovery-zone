"""Accounts, password hashing and bearer tokens."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import httpx

from app.auth import DEMO_PASSWORD, DEMO_USERNAME, auth_store, hash_password, verify_password
from tests.conftest import assert_problem

REGISTRATION = {"username": "parent@example.com", "password": "correct-horse-battery"}


# -- hashing ----------------------------------------------------------------


def test_a_password_is_never_stored_in_the_clear() -> None:
    encoded = hash_password("correct-horse-battery")
    assert "correct-horse-battery" not in encoded
    assert encoded.startswith("pbkdf2_sha256$")


def test_the_same_password_hashes_differently_every_time() -> None:
    """A per-password salt is what stops one crack from unlocking every account."""
    assert hash_password("same-password") != hash_password("same-password")


def test_verify_accepts_the_password_and_rejects_everything_else() -> None:
    encoded = hash_password("correct-horse-battery")
    assert verify_password("correct-horse-battery", encoded) is True
    assert verify_password("correct-horse-batterY", encoded) is False
    assert verify_password("", encoded) is False


def test_verify_rejects_a_corrupt_or_missing_hash() -> None:
    assert verify_password("anything", None) is False
    assert verify_password("anything", "not-a-hash") is False
    assert verify_password("anything", "md5$1$aa$bb") is False


def test_only_the_token_digest_is_kept() -> None:
    token, _ = auth_store.issue_token("acct-demo")
    assert token not in auth_store.tokens
    assert auth_store.resolve_token(token) is not None


def test_an_expired_token_resolves_to_nobody() -> None:
    token, expires_in = auth_store.issue_token("acct-demo")
    assert expires_in > 0
    later = datetime.now(UTC) + timedelta(seconds=expires_in + 1)
    assert auth_store.resolve_token(token, now=later) is None


# -- endpoints --------------------------------------------------------------


async def test_register_then_sign_in(client: httpx.AsyncClient) -> None:
    created = await client.post("/auth/register", json=REGISTRATION)
    assert created.status_code == 201
    assert created.json()["username"] == REGISTRATION["username"]
    assert "password" not in created.text and "pbkdf2" not in created.text

    token_response = await client.post("/auth/token", json=REGISTRATION)
    assert token_response.status_code == 200
    body = token_response.json()
    assert body["tokenType"] == "bearer"
    assert body["expiresIn"] > 0

    me = await client.get("/auth/me", headers={"Authorization": f"Bearer {body['accessToken']}"})
    assert me.json()["username"] == REGISTRATION["username"]


async def test_a_username_is_claimed_once(client: httpx.AsyncClient) -> None:
    await client.post("/auth/register", json=REGISTRATION)
    assert_problem(await client.post("/auth/register", json=REGISTRATION), 409)


async def test_a_short_password_is_refused(client: httpx.AsyncClient) -> None:
    body = assert_problem(
        await client.post("/auth/register", json={"username": "a@b.com", "password": "short"}), 422
    )
    assert body["errors"][0]["path"] == "/password"


async def test_the_wrong_password_does_not_get_a_token(client: httpx.AsyncClient) -> None:
    assert_problem(
        await client.post(
            "/auth/token", json={"username": DEMO_USERNAME, "password": "not-the-password"}
        ),
        401,
    )


async def test_an_unknown_username_fails_the_same_way_as_a_wrong_password(
    client: httpx.AsyncClient,
) -> None:
    """Which half was wrong is not the caller's business."""
    unknown = await client.post(
        "/auth/token", json={"username": "nobody@example.com", "password": "whatever-else"}
    )
    wrong = await client.post(
        "/auth/token", json={"username": DEMO_USERNAME, "password": "whatever-else"}
    )
    assert unknown.status_code == wrong.status_code == 401
    assert unknown.json()["title"] == wrong.json()["title"]


async def test_a_protected_endpoint_without_a_token_is_401(client: httpx.AsyncClient) -> None:
    body = assert_problem(await client.get("/profiles"), 401)
    assert body["title"] == "Not authenticated"


async def test_a_made_up_token_is_401(client: httpx.AsyncClient) -> None:
    assert_problem(await client.get("/profiles", headers={"Authorization": "Bearer made-up"}), 401)


async def test_a_non_bearer_scheme_is_401(client: httpx.AsyncClient) -> None:
    token = (
        await client.post(
            "/auth/token", json={"username": DEMO_USERNAME, "password": DEMO_PASSWORD}
        )
    ).json()["accessToken"]
    assert_problem(await client.get("/profiles", headers={"Authorization": f"Basic {token}"}), 401)


async def test_logout_revokes_the_token_it_was_called_with(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    assert (await client.post("/auth/logout", headers=auth)).status_code == 204
    assert_problem(await client.get("/profiles", headers=auth), 401)
