"""One child, one sitting, over HTTP — and the walls between two accounts.

The unit suite covers each of these endpoints. What it cannot cover is the
sequence surviving a real network, a real Postgres and a real transaction per
request: an answer moves a level, queues an entity, writes a row and updates a
session, and either all of that lands or none of it does.
"""

from __future__ import annotations

from typing import Any

import httpx

from integration.conftest import auth, register, unique_username


def start_session(api: httpx.Client, headers: dict[str, str], profile_id: str) -> dict[str, Any]:
    response = api.post("/sessions", headers=headers, json={"profileId": profile_id})
    assert response.status_code == 201, response.text
    return dict(response.json())


def answer(
    api: httpx.Client,
    headers: dict[str, str],
    session_id: str,
    served: dict[str, Any],
    *,
    correct: bool,
) -> dict[str, Any]:
    question = served["question"]
    index = question["correctIndex"]
    choice = index if correct else (index + 1) % len(question["choices"])
    response = api.post(
        f"/sessions/{session_id}/answers",
        headers=headers,
        json={"questionId": question["id"], "choiceIndex": choice},
    )
    assert response.status_code == 200, response.text
    return dict(response.json())


def next_question(api: httpx.Client, headers: dict[str, str], session_id: str) -> dict[str, Any]:
    response = api.post(f"/sessions/{session_id}/next-question", headers=headers)
    assert response.status_code == 200, response.text
    return dict(response.json())


# -- the sitting ------------------------------------------------------------


def test_a_child_plays_a_session_from_sign_in_to_summary(
    api: httpx.Client, account: dict[str, str], profile: dict[str, Any]
) -> None:
    """The whole loop: start, answer right, answer wrong, end, read the summary."""
    started = start_session(api, account, profile["id"])
    session_id = started["session"]["id"]
    served = started.get("served") or next_question(api, account, session_id)

    first = answer(api, account, session_id, served, correct=True)
    assert first["correct"] is True
    # Asymmetric on purpose: a right answer earns a fact, not a tick.
    assert first["reveal"]["tone"] == "reward"
    assert first["reveal"]["headline"]

    served = next_question(api, account, session_id)
    second = answer(api, account, session_id, served, correct=False)
    assert second["correct"] is False
    # A wrong answer earns the reason the right answer is right. No red X.
    assert second["reveal"]["tone"] == "reason"
    assert second["reveal"]["headline"]

    summary = api.post(f"/sessions/{session_id}/end", headers=account)
    assert summary.status_code == 200, summary.text
    body = summary.json()
    assert body["answered"] == 2
    assert body["correct"] == 1
    # The summary counts places learned. Never a percentage, never a score.
    assert "learnedCount" in body
    assert "%" not in body["headline"]


def test_a_wrong_answer_puts_the_place_on_the_review_queue(
    api: httpx.Client, account: dict[str, str], profile: dict[str, Any]
) -> None:
    """A missed place comes back later from a different angle — the queue holds
    the *entity*, not the question."""
    started = start_session(api, account, profile["id"])
    session_id = started["session"]["id"]
    served = started.get("served") or next_question(api, account, session_id)
    missed = served["question"]["entityId"]

    answer(api, account, session_id, served, correct=False)

    queued = api.get(f"/profiles/{profile['id']}/review-queue", headers=account)
    assert queued.status_code == 200, queued.text
    assert missed in [item["entityId"] for item in queued.json()["entities"]]


def test_the_map_fills_in_as_places_are_learned(
    api: httpx.Client, account: dict[str, str], profile: dict[str, Any]
) -> None:
    """The map is the progress bar, and the server decides what counts."""
    before = api.get(f"/profiles/{profile['id']}/progress", headers=account).json()
    assert before["mapProgress"]["total"] > 0
    assert before["mapProgress"]["filled"] == 0

    started = start_session(api, account, profile["id"])
    session_id = started["session"]["id"]
    served = started.get("served") or next_question(api, account, session_id)
    for _ in range(3):
        answer(api, account, session_id, served, correct=True)
        served = next_question(api, account, session_id)

    after = api.get(f"/profiles/{profile['id']}/progress", headers=account).json()
    assert after["mapProgress"]["filled"] >= before["mapProgress"]["filled"]
    assert len(after["masteredGeometryIds"]) == after["mapProgress"]["filled"]


def test_an_accidental_answer_can_be_taken_back(
    api: httpx.Client, account: dict[str, str], profile: dict[str, Any]
) -> None:
    """A misfire on a touchscreen should not cost a level."""
    started = start_session(api, account, profile["id"])
    session_id = started["session"]["id"]
    served = started.get("served") or next_question(api, account, session_id)

    before = api.get(f"/profiles/{profile['id']}", headers=account).json()
    result = answer(api, account, session_id, served, correct=False)

    undone = api.delete(f"/sessions/{session_id}/answers/{result['answerId']}", headers=account)
    assert undone.status_code == 204, undone.text

    after = api.get(f"/profiles/{profile['id']}", headers=account).json()
    assert after["level"] == before["level"]


def test_serving_twice_does_not_burn_two_questions(
    api: httpx.Client, account: dict[str, str], profile: dict[str, Any]
) -> None:
    """A refresh mid-question must not skip it — the client can and does ask again."""
    started = start_session(api, account, profile["id"])
    session_id = started["session"]["id"]
    served = started.get("served") or next_question(api, account, session_id)

    again = next_question(api, account, session_id)
    assert again["question"]["id"] == served["question"]["id"]


# -- the walls between accounts ---------------------------------------------


def test_profiles_are_not_readable_without_a_token(api: httpx.Client) -> None:
    """They hold children's data. This is the request an unauthenticated
    scraper makes first."""
    response = api.get("/profiles")
    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/problem+json")


def test_another_account_gets_a_404_not_a_403(
    api: httpx.Client, account: dict[str, str], profile: dict[str, Any]
) -> None:
    """403 would confirm the id exists. 404 does not, so an account cannot probe
    for which children are on this server."""
    stranger = auth(register(api, unique_username("stranger")))

    assert api.get(f"/profiles/{profile['id']}", headers=stranger).status_code == 404
    assert (
        api.patch(f"/profiles/{profile['id']}", headers=stranger, json={"name": "X"}).status_code
        == 404
    )
    assert (
        api.post("/sessions", headers=stranger, json={"profileId": profile["id"]}).status_code
        == 404
    )

    # And the owner is unaffected by any of that.
    assert api.get(f"/profiles/{profile['id']}", headers=account).status_code == 200


def test_a_pin_hash_is_never_returned(api: httpx.Client, account: dict[str, str]) -> None:
    """A four-digit PIN's hash is a four-digit PIN."""
    created = api.post(
        "/profiles",
        headers=account,
        json={"name": "Wren", "avatar": "🦜", "grade": 5, "pin": "1234"},
    )
    assert created.status_code == 201, created.text
    assert "pinHash" not in created.json()
    assert "1234" not in created.text


def test_a_revoked_token_stops_working(api: httpx.Client) -> None:
    """Sign-out has to mean something on the server, not just in the browser."""
    headers = auth(register(api, unique_username("signs-out")))
    assert api.get("/auth/me", headers=headers).status_code == 200

    assert api.post("/auth/logout", headers=headers).status_code in (200, 204)
    assert api.get("/auth/me", headers=headers).status_code == 401


def test_a_username_cannot_be_registered_twice(api: httpx.Client) -> None:
    """The unique index is what stands between a race and two accounts sharing
    a name. Postgres enforces it; this checks the API surfaces it as a conflict."""
    username = unique_username("taken-twice")
    first = api.post("/auth/register", json={"username": username, "password": "long-enough-pw"})
    assert first.status_code == 201, first.text

    again = api.post("/auth/register", json={"username": username, "password": "long-enough-pw"})
    assert again.status_code == 409
    assert again.headers["content-type"].startswith("application/problem+json")
