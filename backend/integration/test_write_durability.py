"""A write is durable by the time its response says so.

The bug these exist for: `get_db` was a dependency with `yield` that committed
*after* the yield, which reads correctly and is wrong. On a real server FastAPI
runs that exit code after the response has already gone to the client — measured
on uvicorn, the client had the response 400ms before the commit ran.

So `POST /auth/register` answered `201 Created` before the account row existed,
and the app's very next request — exchanging those credentials for a token —
could be told the brand-new password was wrong. Under load that was roughly one
sign-up in eight. Found by the browser suite in `e2e/`, not here, and not by
`backend/tests/`: an in-process test drives the app through
`httpx.ASGITransport` with an overridden session, so it cannot see this ordering
at all. It needs a real server and more than one caller.

These are the regression tests. Every one of them failed before the fix.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

import httpx
import pytest

from integration.conftest import API_PREFIX, PASSWORD, auth, unique_username

# Enough concurrent callers to saturate the threadpool. Password hashing is
# 210,000 PBKDF2 rounds, so a handful of sign-ups is all it takes to make a
# delayed commit visible; one at a time never reproduced it.
CALLERS = 8
ROUNDS = 24


def sign_up(base_url: str) -> tuple[int, int]:
    """Register and immediately exchange the credentials, as the app does."""
    username = unique_username("durability")
    body = {"username": username, "password": PASSWORD}
    with httpx.Client(base_url=f"{base_url}{API_PREFIX}", timeout=60) as client:
        registered = client.post("/auth/register", json=body)
        token = client.post("/auth/token", json=body)
    return registered.status_code, token.status_code


def test_an_account_can_be_used_the_instant_it_is_created(api: httpx.Client) -> None:
    """The single-caller case, which always worked and is the control."""
    username = unique_username("immediate")
    body = {"username": username, "password": PASSWORD}
    assert api.post("/auth/register", json=body).status_code == 201
    assert api.post("/auth/token", json=body).status_code == 200


def test_sign_ups_do_not_fail_when_several_people_register_at_once(stack: str) -> None:
    """The one that caught it. Before the fix this failed 2-3 times in 24."""
    with ThreadPoolExecutor(max_workers=CALLERS) as pool:
        results = list(pool.map(lambda _: sign_up(stack), range(ROUNDS)))

    created = [registered for registered, _ in results]
    tokens = [token for _, token in results]
    assert created == [201] * ROUNDS, "an account was not created"

    rejected = sum(1 for status in tokens if status == 401)
    assert rejected == 0, (
        f"{rejected} of {ROUNDS} brand-new accounts were told their password was wrong — "
        "the register response arrived before its commit did"
    )


def test_a_profile_is_readable_the_instant_it_is_created(
    api: httpx.Client, account: dict[str, str]
) -> None:
    """The same ordering, one layer up: create then immediately fetch. Every
    write endpoint had this bug, not just registration."""
    created = api.post(
        "/profiles", headers=account, json={"name": "Fox", "avatar": "🦊", "grade": 2}
    )
    assert created.status_code == 201, created.text
    profile_id = created.json()["id"]

    # No sleep, no retry: the response said it exists, so it exists.
    fetched = api.get(f"/profiles/{profile_id}", headers=account)
    assert fetched.status_code == 200, fetched.text
    assert fetched.json()["name"] == "Fox"

    listed = api.get("/profiles", headers=account)
    assert profile_id in [profile["id"] for profile in listed.json()["data"]]


def test_an_answer_is_counted_the_instant_it_is_submitted(
    api: httpx.Client, account: dict[str, str], profile: dict[str, str]
) -> None:
    """A child taps an answer and the next screen reads the session back."""
    started = api.post("/sessions", headers=account, json={"profileId": profile["id"]})
    session_id = started.json()["session"]["id"]
    served = (
        started.json().get("served")
        or api.post(f"/sessions/{session_id}/next-question", headers=account).json()
    )
    question = served["question"]

    api.post(
        f"/sessions/{session_id}/answers",
        headers=account,
        json={"questionId": question["id"], "choiceIndex": question["correctIndex"]},
    )
    state = api.get(f"/sessions/{session_id}", headers=account)
    assert state.json()["counts"]["answered"] == 1


@pytest.mark.parametrize("attempt", range(3))
def test_a_token_works_on_the_request_after_it_was_issued(api: httpx.Client, attempt: int) -> None:
    """Issuing a token is itself a write. If it commits late, the token the
    server just handed out is not yet a token the server recognises."""
    username = unique_username(f"token-race-{attempt}")
    body = {"username": username, "password": PASSWORD}
    assert api.post("/auth/register", json=body).status_code == 201

    issued = api.post("/auth/token", json=body)
    assert issued.status_code == 200, issued.text

    who = api.get("/auth/me", headers=auth(issued.json()["accessToken"]))
    assert who.status_code == 200, who.text
    assert who.json()["username"] == username
