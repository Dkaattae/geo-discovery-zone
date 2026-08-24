"""A restart is not a reset.

This is the claim the database, the volume and the compose healthcheck exist to
make, and it is the one claim no in-process test can make at all: the unit suite
builds its database, asserts, and throws it away inside one interpreter.

Every test here restarts a container, so they skip when pointed at a stack we do
not own — bouncing someone else's server out from under them is not a test.
"""

from __future__ import annotations

import time
from typing import Any

import httpx
import pytest

from integration.conftest import RESTART_TIMEOUT_SECONDS, compose, wait_for_health


@pytest.fixture
def restart_app(stack: str, owns_the_stack: bool) -> Any:
    if not owns_the_stack:
        pytest.skip("pointed at a stack this suite does not own; it must not be restarted")

    def _restart() -> None:
        compose("restart", "app", timeout=RESTART_TIMEOUT_SECONDS)
        # `restart` returns when the container is up, not when the app inside it
        # has migrated, seeded and bound a port.
        wait_for_health(stack, RESTART_TIMEOUT_SECONDS)

    return _restart


def test_a_childs_progress_survives_a_restart(
    api: httpx.Client,
    account: dict[str, str],
    profile: dict[str, Any],
    restart_app: Any,
) -> None:
    """The whole point of moving off `localStorage` and in-memory state."""
    started = api.post("/sessions", headers=account, json={"profileId": profile["id"]})
    assert started.status_code == 201, started.text
    payload = started.json()
    session_id = payload["session"]["id"]
    served = (
        payload.get("served")
        or api.post(f"/sessions/{session_id}/next-question", headers=account).json()
    )
    question = served["question"]
    api.post(
        f"/sessions/{session_id}/answers",
        headers=account,
        json={"questionId": question["id"], "choiceIndex": question["correctIndex"]},
    )
    before = api.get(f"/profiles/{profile['id']}", headers=account).json()

    restart_app()

    after = api.get(f"/profiles/{profile['id']}", headers=account)
    assert after.status_code == 200, after.text
    assert after.json()["id"] == before["id"]
    assert after.json()["name"] == before["name"]
    assert after.json()["level"] == before["level"]

    # The session and its answer are still there too, not just the profile row.
    session = api.get(f"/sessions/{session_id}", headers=account)
    assert session.status_code == 200
    assert session.json()["counts"]["answered"] == 1


def test_a_token_still_works_after_a_restart(
    api: httpx.Client, account: dict[str, str], restart_app: Any
) -> None:
    """Tokens live in the database, so a deploy no longer signs every grown-up
    out mid-session. When they were in memory, this failed."""
    assert api.get("/auth/me", headers=account).status_code == 200
    restart_app()
    assert api.get("/auth/me", headers=account).status_code == 200


def test_restarting_does_not_reseed_the_bank(
    http: httpx.Client, api: httpx.Client, restart_app: Any
) -> None:
    """Seeding runs on every startup and is keyed on the content version, so a
    restart with real data in the database must change nothing. Duplicated
    entities would show up here as a growing count."""
    before = http.get("/health").json()
    restart_app()
    after = http.get("/health").json()

    assert after["entities"] == before["entities"]
    assert after["questions"] == before["questions"]
    assert after["contentVersion"] == before["contentVersion"]


def test_a_profile_deleted_before_a_restart_stays_deleted(
    api: httpx.Client, account: dict[str, str], profile: dict[str, Any], restart_app: Any
) -> None:
    """The inverse of the first test, and the one that catches a restart that
    quietly rebuilds from a seed instead of reading what is there."""
    assert api.delete(f"/profiles/{profile['id']}", headers=account).status_code == 204
    restart_app()
    assert api.get(f"/profiles/{profile['id']}", headers=account).status_code == 404


def test_the_app_recovers_when_the_database_goes_away_and_comes_back(
    http: httpx.Client, api: httpx.Client, owns_the_stack: bool, stack: str
) -> None:
    """`pool_pre_ping` earns its keep here: a pooled connection closed by a
    database restart looks fine until the next query fails. Without the ping the
    first request after this returns a 500."""
    if not owns_the_stack:
        pytest.skip("pointed at a stack this suite does not own")

    compose("restart", "db", timeout=RESTART_TIMEOUT_SECONDS)

    # The app is not restarted — it has to notice by itself. Give the database a
    # moment to accept connections again, then the very next request must work.
    deadline = time.monotonic() + RESTART_TIMEOUT_SECONDS
    last: httpx.Response | None = None
    while time.monotonic() < deadline:
        last = api.get("/content/version")
        if last.status_code == 200:
            break
        time.sleep(2)

    assert last is not None and last.status_code == 200, (
        "the app did not recover from a database restart: "
        f"{last.status_code if last else 'no response'}"
    )
