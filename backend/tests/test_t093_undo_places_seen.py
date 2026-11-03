"""T-093 worker: an undone answer no longer counts as a place seen.

Every check goes through the HTTP API. To answer a chosen question, the
`force` fixture replaces `pick_question` with a picker that returns that
question from the pool the router hands it, so the pool is still the real one.
"""

from __future__ import annotations

from typing import Any

import httpx
import pytest
from sqlalchemy.orm import Session as DbSession

from app import store
from app.orm import SessionRecord
from tests.conftest import DEMO_PROFILE_ID

AL_IDENTIFY = "gen:tpl-identify-on-map:us-state-al"
AL_CAPITAL = "gen:tpl-capital-of:us-state-al"
AL_CLICK = "gen:tpl-click-the-map:us-state-al"
AL_ANIMAL = "gen:tpl-state-animal-of:us-state-al"
AK_CAPITAL = "gen:tpl-capital-of:us-state-ak"


@pytest.fixture
def force(monkeypatch: pytest.MonkeyPatch) -> dict[str, str]:
    """`force["id"] = question id` makes the next serve return that question."""
    wanted: dict[str, str] = {}

    def pick(pool: list[dict[str, Any]], **_: Any) -> tuple[dict[str, Any] | None, bool]:
        match = [q for q in pool if q["id"] == wanted["id"]]
        assert match, f"{wanted['id']} is not in the pool the router offered"
        return match[0], False

    monkeypatch.setattr("app.routers.sessions.pick_question", pick)
    return wanted


def _body(db: DbSession, question_id: str, *, correct: bool) -> dict[str, Any]:
    """An answer body that grades as asked, built from the stored question's key."""
    question = store.question(db, question_id)
    assert question is not None, question_id
    if question["format"] == "map_click":
        key = question["answerGeometryId"]
        tapped = key if correct else ("02" if key != "02" else "01")
        return {"questionId": question_id, "tappedGeometryId": tapped}
    index = question["correctIndex"]
    if not correct:
        index = (index + 1) % len(question["choices"])
    return {"questionId": question_id, "choiceIndex": index}


async def _start(client: httpx.AsyncClient, headers: dict[str, str], **extra: Any) -> str:
    response = await client.post(
        "/sessions",
        headers=headers,
        json={"profileId": DEMO_PROFILE_ID, "topic": "mixed", **extra},
    )
    assert response.status_code == 201, response.text
    return response.json()["session"]["id"]


async def _session(client: httpx.AsyncClient, headers: dict[str, str], sid: str) -> dict[str, Any]:
    response = await client.get(f"/sessions/{sid}", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


async def _next(client: httpx.AsyncClient, headers: dict[str, str], sid: str) -> None:
    response = await client.post(f"/sessions/{sid}/next-question", headers=headers)
    assert response.status_code == 200, response.text


async def _answer(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    db: DbSession,
    sid: str,
    question_id: str,
    *,
    correct: bool = False,
) -> str:
    body = _body(db, question_id, correct=correct)
    response = await client.post(f"/sessions/{sid}/answers", headers=headers, json=body)
    assert response.status_code == 200, response.text
    assert response.json()["correct"] is correct
    return response.json()["answerId"]


async def _undo(client: httpx.AsyncClient, headers: dict[str, str], sid: str, aid: str) -> None:
    response = await client.delete(f"/sessions/{sid}/answers/{aid}", headers=headers)
    assert response.status_code == 204, response.text


async def _end(client: httpx.AsyncClient, headers: dict[str, str], sid: str) -> dict[str, Any]:
    response = await client.post(f"/sessions/{sid}/end", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


# -- criterion 1 and 4: first answer on a place, every format and outcome -----


@pytest.mark.parametrize("correct", [True, False], ids=["correct", "wrong"])
@pytest.mark.parametrize("question_id", [AL_IDENTIFY, AL_CAPITAL, AL_CLICK])
async def test_undoing_the_first_answer_leaves_an_empty_seen_list(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: DbSession,
    force: dict[str, str],
    question_id: str,
    correct: bool,
) -> None:
    force["id"] = question_id
    sid = await _start(client, auth_headers)
    before = (await _session(client, auth_headers, sid))["seenEntityIds"]
    assert before == []
    aid = await _answer(client, auth_headers, db_session, sid, question_id, correct=correct)
    assert (await _session(client, auth_headers, sid))["seenEntityIds"] == ["us-state-al"]
    await _undo(client, auth_headers, sid, aid)
    assert (await _session(client, auth_headers, sid))["seenEntityIds"] == before


@pytest.mark.parametrize("correct", [True, False], ids=["correct", "wrong"])
@pytest.mark.parametrize("question_id", [AL_IDENTIFY, AL_CAPITAL, AL_CLICK])
async def test_undoing_a_new_place_keeps_the_places_already_seen(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: DbSession,
    force: dict[str, str],
    question_id: str,
    correct: bool,
) -> None:
    force["id"] = AK_CAPITAL
    sid = await _start(client, auth_headers)
    await _answer(client, auth_headers, db_session, sid, AK_CAPITAL, correct=True)
    force["id"] = question_id
    await _next(client, auth_headers, sid)
    before = (await _session(client, auth_headers, sid))["seenEntityIds"]
    assert before == ["us-state-ak"]
    aid = await _answer(client, auth_headers, db_session, sid, question_id, correct=correct)
    assert (await _session(client, auth_headers, sid))["seenEntityIds"] == [
        "us-state-ak",
        "us-state-al",
    ]
    await _undo(client, auth_headers, sid, aid)
    assert (await _session(client, auth_headers, sid))["seenEntityIds"] == before


# -- criterion 2: a place an earlier answer saw stays seen --------------------


async def test_undo_keeps_a_place_an_earlier_kept_answer_saw(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: DbSession,
    force: dict[str, str],
) -> None:
    force["id"] = AL_CAPITAL
    sid = await _start(client, auth_headers)
    await _answer(client, auth_headers, db_session, sid, AL_CAPITAL, correct=True)
    force["id"] = AL_ANIMAL
    await _next(client, auth_headers, sid)
    before = (await _session(client, auth_headers, sid))["seenEntityIds"]
    assert before == ["us-state-al"]
    aid = await _answer(client, auth_headers, db_session, sid, AL_ANIMAL)
    await _undo(client, auth_headers, sid, aid)
    after = (await _session(client, auth_headers, sid))["seenEntityIds"]
    assert after == before
    assert after.count("us-state-al") == 1


# -- criterion 3: the summary counts only answers that stand ------------------


async def test_places_seen_is_zero_after_the_only_answer_is_undone(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: DbSession,
    force: dict[str, str],
) -> None:
    force["id"] = AL_CAPITAL
    sid = await _start(client, auth_headers)
    aid = await _answer(client, auth_headers, db_session, sid, AL_CAPITAL)
    await _undo(client, auth_headers, sid, aid)
    assert (await _end(client, auth_headers, sid))["placesSeen"] == 0


async def test_places_seen_counts_the_kept_answer_and_not_the_undone_one(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: DbSession,
    force: dict[str, str],
) -> None:
    force["id"] = AK_CAPITAL
    sid = await _start(client, auth_headers)
    await _answer(client, auth_headers, db_session, sid, AK_CAPITAL, correct=True)
    force["id"] = AL_CAPITAL
    await _next(client, auth_headers, sid)
    aid = await _answer(client, auth_headers, db_session, sid, AL_CAPITAL)
    await _undo(client, auth_headers, sid, aid)
    assert (await _end(client, auth_headers, sid))["placesSeen"] == 1


# -- criterion 5: a review-round answer ---------------------------------------


@pytest.mark.parametrize("correct", [True, False], ids=["correct", "wrong"])
async def test_undoing_a_review_round_answer_restores_the_seen_list(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: DbSession,
    correct: bool,
) -> None:
    """The demo profile has Texas queued for review from an earlier session."""
    sid = await _start(client, auth_headers, serveFirstQuestion=False)
    review = await client.post(f"/sessions/{sid}/review-round", headers=auth_headers, json={})
    assert review.status_code == 200, review.text
    served = review.json()["served"]
    assert served["isReview"] is True
    assert served["question"]["entityId"] == "us-state-tx"
    before = (await _session(client, auth_headers, sid))["seenEntityIds"]
    assert "us-state-tx" not in before
    qid = served["question"]["id"]
    aid = await _answer(client, auth_headers, db_session, sid, qid, correct=correct)
    assert "us-state-tx" in (await _session(client, auth_headers, sid))["seenEntityIds"]
    await _undo(client, auth_headers, sid, aid)
    assert (await _session(client, auth_headers, sid))["seenEntityIds"] == before


# -- criterion 6: re-answering after an undo counts the place once ------------


async def test_re_answering_after_an_undo_counts_the_place_once(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: DbSession,
    force: dict[str, str],
) -> None:
    force["id"] = AL_CLICK
    sid = await _start(client, auth_headers)
    aid = await _answer(client, auth_headers, db_session, sid, AL_CLICK)
    await _undo(client, auth_headers, sid, aid)
    # The question is back in play: a next-question call re-serves it.
    reserved = await client.post(f"/sessions/{sid}/next-question", headers=auth_headers)
    assert reserved.status_code == 200, reserved.text
    assert reserved.json()["question"]["id"] == AL_CLICK
    assert reserved.json()["phase"] == "PRESENTING"
    await _answer(client, auth_headers, db_session, sid, AL_CLICK, correct=True)
    assert (await _session(client, auth_headers, sid))["seenEntityIds"] == ["us-state-al"]
    assert (await _end(client, auth_headers, sid))["placesSeen"] == 1


# -- criterion 7: everything else undo restored still comes back --------------


async def test_undo_still_restores_profile_counts_level_learned_and_review_round(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: DbSession,
    force: dict[str, str],
) -> None:
    force["id"] = AL_CAPITAL
    sid = await _start(client, auth_headers)
    session_before = await _session(client, auth_headers, sid)
    profile_before = (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=auth_headers)).json()
    aid = await _answer(client, auth_headers, db_session, sid, AL_CAPITAL)
    await _undo(client, auth_headers, sid, aid)
    session_after = await _session(client, auth_headers, sid)
    profile_after = (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=auth_headers)).json()
    assert profile_after == profile_before
    for key in ("counts", "level", "learnedEntityIds", "reviewRoundRemaining", "seenEntityIds"):
        assert session_after.get(key) == session_before.get(key), key


# -- criterion 8: a snapshot written before T-093 still undoes ----------------


async def test_an_answer_with_a_pre_t093_snapshot_can_still_be_undone(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: DbSession,
    force: dict[str, str],
) -> None:
    force["id"] = AK_CAPITAL
    sid = await _start(client, auth_headers)
    await _answer(client, auth_headers, db_session, sid, AK_CAPITAL, correct=True)
    force["id"] = AL_CAPITAL
    await _next(client, auth_headers, sid)
    session_before = await _session(client, auth_headers, sid)
    profile_before = (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=auth_headers)).json()
    aid = await _answer(client, auth_headers, db_session, sid, AL_CAPITAL)

    # Rewrite the stored snapshot to the shape it had before this task.
    record = db_session.get(SessionRecord, sid)
    assert record is not None
    answer = record.answers[-1]
    assert answer.id == aid
    legacy = {k: v for k, v in answer.session_before.items() if k != "seen_entity_ids"}
    assert "seen_entity_ids" not in legacy
    answer.session_before = legacy
    db_session.flush()
    db_session.expire_all()

    response = await client.delete(f"/sessions/{sid}/answers/{aid}", headers=auth_headers)
    assert response.status_code == 204, response.text
    session_after = await _session(client, auth_headers, sid)
    profile_after = (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=auth_headers)).json()
    assert profile_after == profile_before
    for key in ("counts", "level", "learnedEntityIds", "reviewRoundRemaining"):
        assert session_after.get(key) == session_before.get(key), key
