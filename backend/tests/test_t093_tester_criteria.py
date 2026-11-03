"""T-093 tester: undo takes the place back out of the session's seen list.

Written from `tasks/T-093-undo-places-seen.md` by the tester, not the worker,
one test per criterion (criteria 9-12 are checked by running the suites and
reading the diff, recorded in the brief's Verdict). Expected values come from
the criteria: "the seen list read just before the answer", `placesSeen` 0 or 1,
and so on. Everything is observed through the HTTP API, except criterion 8,
which by its wording inserts an `AnswerRecord` by hand.

To answer a chosen question, `pick_question` is replaced by a picker that
returns that question from the real pool the router offers (the T-051 tester's
pattern). The review-round test uses the real picker, so `isReview` is earned.
"""

from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path
from typing import Any

import httpx
import pytest
from sqlalchemy.orm import Session as DbSession

from app.orm import AnswerRecord, ProfileRecord, SessionRecord
from app.store import utc_now
from tests.conftest import DEMO_PROFILE_ID

REPO = Path(__file__).resolve().parents[2]
CONTENT_FILE = REPO / "backend" / "app" / "data" / "content.json"

AL = "us-state-al"
CO = "us-state-co"
TX = "us-state-tx"  # the only entity the seeded demo profile has queued for review

# One question per served format, all about Alabama.
AL_BY_FORMAT = {
    "map_identify": "gen:tpl-identify-on-map:us-state-al",
    "multiple_choice": "gen:tpl-capital-of:us-state-al",
    "map_click": "gen:tpl-click-the-map:us-state-al",
}
CO_IDENTIFY = "gen:tpl-identify-on-map:us-state-co"
CO_CAPITAL = "gen:tpl-capital-of:us-state-co"

CASES = [(fmt, correct) for fmt in AL_BY_FORMAT for correct in (True, False)]
CASE_IDS = [f"{fmt}-{'correct' if correct else 'wrong'}" for fmt, correct in CASES]


def _question(question_id: str) -> dict[str, Any]:
    questions = json.loads(CONTENT_FILE.read_text(encoding="utf-8"))["questions"]
    return next(q for q in questions if q["id"] == question_id)


def _body(question_id: str, correct: bool) -> dict[str, Any]:
    """An answer body that grades as `correct`, from the committed bank's key."""
    question = _question(question_id)
    if question["format"] == "map_click":
        key = question["answerGeometryId"]
        return {"questionId": question_id, "tappedGeometryId": key if correct else "13"}
    index = question["correctIndex"]
    count = len(question["choices"])
    return {"questionId": question_id, "choiceIndex": index if correct else (index + 1) % count}


@pytest.fixture
def force(monkeypatch: pytest.MonkeyPatch) -> dict[str, str]:
    wanted: dict[str, str] = {}

    def pick(pool: list[dict[str, Any]], **_: Any) -> tuple[dict[str, Any] | None, bool]:
        match = [q for q in pool if q["id"] == wanted["id"]]
        assert match, f"{wanted['id']} is not in the pool the router offered"
        return match[0], False

    monkeypatch.setattr("app.routers.sessions.pick_question", pick)
    return wanted


class Api:
    def __init__(self, client: httpx.AsyncClient, headers: dict[str, str]) -> None:
        self.client = client
        self.headers = headers

    async def start(self) -> str:
        response = await self.client.post(
            "/sessions",
            headers=self.headers,
            json={"profileId": DEMO_PROFILE_ID, "topic": "mixed"},
        )
        assert response.status_code == 201, response.text
        return response.json()["session"]["id"]

    async def session(self, session_id: str) -> dict[str, Any]:
        response = await self.client.get(f"/sessions/{session_id}", headers=self.headers)
        assert response.status_code == 200, response.text
        return response.json()

    async def profile(self) -> dict[str, Any]:
        response = await self.client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=self.headers)
        assert response.status_code == 200, response.text
        return response.json()

    async def next(self, session_id: str) -> dict[str, Any]:
        response = await self.client.post(
            f"/sessions/{session_id}/next-question", headers=self.headers
        )
        assert response.status_code == 200, response.text
        return response.json()

    async def answer(self, session_id: str, body: dict[str, Any]) -> dict[str, Any]:
        response = await self.client.post(
            f"/sessions/{session_id}/answers", headers=self.headers, json=body
        )
        assert response.status_code == 200, response.text
        return response.json()

    async def undo(self, session_id: str, answer_id: str) -> httpx.Response:
        return await self.client.delete(
            f"/sessions/{session_id}/answers/{answer_id}", headers=self.headers
        )

    async def end(self, session_id: str) -> dict[str, Any]:
        response = await self.client.post(f"/sessions/{session_id}/end", headers=self.headers)
        assert response.status_code == 200, response.text
        return response.json()


@pytest.fixture
def api(client: httpx.AsyncClient, auth_headers: dict[str, str]) -> Api:
    return Api(client, auth_headers)


async def _keep_one(api: Api, force: dict[str, str], question_id: str) -> str:
    """Starts a session whose first question is `question_id`, answers it, keeps it."""
    force["id"] = question_id
    session_id = await api.start()
    await api.answer(session_id, _body(question_id, True))
    return session_id


async def _serve(api: Api, force: dict[str, str], session_id: str, question_id: str) -> None:
    force["id"] = question_id
    served = await api.next(session_id)
    assert served["question"]["id"] == question_id


# -- criteria 1 and 4 -------------------------------------------------------


@pytest.mark.parametrize(("fmt", "correct"), CASES, ids=CASE_IDS)
async def test_c1_c4_undoing_a_first_answer_on_an_empty_list_leaves_it_empty(
    api: Api, force: dict[str, str], fmt: str, correct: bool
) -> None:
    question_id = AL_BY_FORMAT[fmt]
    force["id"] = question_id
    session_id = await api.start()
    before = (await api.session(session_id))["seenEntityIds"]
    assert before == []

    result = await api.answer(session_id, _body(question_id, correct))
    assert result["correct"] is correct
    assert result["session"]["seenEntityIds"] == [AL]  # the answer did land

    response = await api.undo(session_id, result["answerId"])
    assert response.status_code == 204, response.text
    after = (await api.session(session_id))["seenEntityIds"]
    assert after == before
    assert AL not in after


@pytest.mark.parametrize(("fmt", "correct"), CASES, ids=CASE_IDS)
async def test_c1_c4_undoing_a_first_answer_keeps_the_places_already_seen(
    api: Api, force: dict[str, str], fmt: str, correct: bool
) -> None:
    session_id = await _keep_one(api, force, CO_IDENTIFY)
    question_id = AL_BY_FORMAT[fmt]
    await _serve(api, force, session_id, question_id)
    before = (await api.session(session_id))["seenEntityIds"]
    assert before == [CO]

    result = await api.answer(session_id, _body(question_id, correct))
    assert result["correct"] is correct
    assert result["session"]["seenEntityIds"] == [CO, AL]

    response = await api.undo(session_id, result["answerId"])
    assert response.status_code == 204, response.text
    after = (await api.session(session_id))["seenEntityIds"]
    assert after == before
    assert AL not in after


# -- criterion 2 ------------------------------------------------------------


@pytest.mark.parametrize("second", ["multiple_choice", "map_click"])
async def test_c2_undo_does_not_remove_a_place_an_earlier_kept_answer_saw(
    api: Api, force: dict[str, str], second: str
) -> None:
    session_id = await _keep_one(api, force, AL_BY_FORMAT["map_identify"])
    second_id = AL_BY_FORMAT[second]
    await _serve(api, force, session_id, second_id)
    before = (await api.session(session_id))["seenEntityIds"]
    assert before == [AL]

    result = await api.answer(session_id, _body(second_id, False))
    response = await api.undo(session_id, result["answerId"])
    assert response.status_code == 204, response.text
    after = (await api.session(session_id))["seenEntityIds"]
    assert after.count(AL) == 1
    assert after == before


# -- criterion 3 ------------------------------------------------------------


async def test_c3_places_seen_is_zero_when_the_only_answer_was_undone(
    api: Api, force: dict[str, str]
) -> None:
    question_id = AL_BY_FORMAT["map_click"]
    force["id"] = question_id
    session_id = await api.start()
    result = await api.answer(session_id, _body(question_id, False))
    assert (await api.undo(session_id, result["answerId"])).status_code == 204
    summary = await api.end(session_id)
    assert summary["placesSeen"] == 0


async def test_c3_places_seen_is_one_with_a_kept_answer_on_another_place(
    api: Api, force: dict[str, str]
) -> None:
    session_id = await _keep_one(api, force, CO_IDENTIFY)
    question_id = AL_BY_FORMAT["map_click"]
    await _serve(api, force, session_id, question_id)
    result = await api.answer(session_id, _body(question_id, False))
    assert (await api.undo(session_id, result["answerId"])).status_code == 204
    summary = await api.end(session_id)
    assert summary["placesSeen"] == 1


# -- criterion 5 ------------------------------------------------------------


@pytest.mark.parametrize("correct", [True, False], ids=["correct", "wrong"])
@pytest.mark.parametrize("seen_before", [False, True], ids=["empty-list", "co-seen"])
async def test_c5_undoing_a_review_round_answer_restores_the_seen_list(
    api: Api,
    force: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
    correct: bool,
    seen_before: bool,
) -> None:
    if seen_before:
        session_id = await _keep_one(api, force, CO_CAPITAL)
    else:
        force["id"] = AL_BY_FORMAT["map_identify"]
        session_id = await api.start()
    # The review round picks for itself, from the profile's real queue.
    monkeypatch.undo()
    response = await api.client.post(
        f"/sessions/{session_id}/review-round", headers=api.headers, json={"length": 1}
    )
    assert response.status_code == 200, response.text
    served = response.json()["served"]
    assert served["isReview"] is True
    assert served["question"]["entityId"] == TX
    before = (await api.session(session_id))["seenEntityIds"]
    assert TX not in before
    assert before == ([CO] if seen_before else [])

    result = await api.answer(session_id, _body(served["question"]["id"], correct))
    assert result["correct"] is correct
    assert TX in result["session"]["seenEntityIds"]
    assert (await api.undo(session_id, result["answerId"])).status_code == 204
    after = (await api.session(session_id))["seenEntityIds"]
    assert after == before


# -- criterion 6 ------------------------------------------------------------


@pytest.mark.parametrize(("fmt", "correct"), CASES, ids=CASE_IDS)
async def test_c6_re_answering_after_an_undo_counts_the_place_once(
    api: Api, force: dict[str, str], fmt: str, correct: bool
) -> None:
    question_id = AL_BY_FORMAT[fmt]
    force["id"] = question_id
    session_id = await api.start()
    first = await api.answer(session_id, _body(question_id, correct))
    assert (await api.undo(session_id, first["answerId"])).status_code == 204

    again = await api.answer(session_id, _body(question_id, correct))
    seen = (await api.session(session_id))["seenEntityIds"]
    assert again["session"]["seenEntityIds"] == [AL]
    assert seen == [AL]
    summary = await api.end(session_id)
    assert summary["placesSeen"] == 1


# -- criterion 7 ------------------------------------------------------------

RESTORED_SESSION_FIELDS = ["counts", "level", "learnedEntityIds", "reviewRoundRemaining"]


@pytest.mark.parametrize(("fmt", "correct"), CASES, ids=CASE_IDS)
async def test_c7_undo_still_restores_the_profile_and_the_session_fields(
    api: Api, force: dict[str, str], fmt: str, correct: bool
) -> None:
    # A kept Colorado answer first, so counts and streaks are not all zero.
    session_id = await _keep_one(api, force, CO_IDENTIFY)
    question_id = AL_BY_FORMAT[fmt]
    await _serve(api, force, session_id, question_id)
    session_before = await api.session(session_id)
    profile_before = await api.profile()

    result = await api.answer(session_id, _body(question_id, correct))
    assert result["session"]["counts"] != session_before["counts"]
    assert result["profile"] != profile_before
    assert (await api.undo(session_id, result["answerId"])).status_code == 204

    session_after = await api.session(session_id)
    assert await api.profile() == profile_before
    for field in RESTORED_SESSION_FIELDS:
        assert session_after[field] == session_before[field], field


# -- criterion 8 ------------------------------------------------------------

# The keys `SessionRecord.snapshot` wrote before T-093 (`git show
# 15aac14:backend/app/orm.py`, the branch point): everything but a seen list.
PRE_T093_SESSION_KEYS = {
    "answered", "correct", "wrong", "correct_streak", "wrong_streak", "learned_entity_ids",
    "review_round_remaining", "last_answer_wrong", "review_offered", "level", "pending",
}  # fmt: skip


async def test_c8_an_answer_with_a_pre_t093_snapshot_can_still_be_undone(
    api: Api, force: dict[str, str], db_session: DbSession
) -> None:
    session_id = await _keep_one(api, force, CO_IDENTIFY)
    question_id = AL_BY_FORMAT["multiple_choice"]
    await _serve(api, force, session_id, question_id)
    session_before = await api.session(session_id)
    profile_before = await api.profile()

    record = db_session.get(SessionRecord, session_id)
    profile = db_session.get(ProfileRecord, DEMO_PROFILE_ID)
    assert record is not None and profile is not None
    profile_snapshot = profile.snapshot()
    counts = session_before["counts"]
    # Written by hand, in the old shape, from what the API reported.
    legacy_snapshot = {
        "answered": counts["answered"],
        "correct": counts["correct"],
        "wrong": counts["wrong"],
        "correct_streak": counts["correctStreak"],
        "wrong_streak": counts["wrongStreak"],
        "learned_entity_ids": list(session_before["learnedEntityIds"]),
        "review_round_remaining": session_before["reviewRoundRemaining"],
        "last_answer_wrong": record.last_answer_wrong,
        "review_offered": record.review_offered,
        "level": session_before["level"],
        "pending": {"question_id": question_id, "index": 1, "is_review": False},
    }
    assert set(legacy_snapshot) == PRE_T093_SESSION_KEYS

    # The answer lands through the API, so the session and profile really move.
    result = await api.answer(session_id, _body(question_id, False))
    assert result["session"]["counts"] != counts

    # Swap the record the API wrote for one built from scratch with the old shape:
    # still the most recent answer, still inside the window.
    written = next(a for a in record.answers if a.id == result["answerId"])
    record.answers.remove(written)
    db_session.flush()
    legacy = AnswerRecord(
        id="a-legacy-t093",
        session_id=session_id,
        question_id=question_id,
        entity_id=AL,
        correct=False,
        answered_at=utc_now() - timedelta(seconds=5),
        is_review=False,
        profile_before=profile_snapshot,
        session_before=legacy_snapshot,
    )
    record.answers.append(legacy)
    db_session.flush()
    db_session.expire_all()
    stored = db_session.get(AnswerRecord, legacy.seq)
    assert stored is not None
    assert "seen_entity_ids" not in stored.session_before

    response = await api.undo(session_id, "a-legacy-t093")
    assert response.status_code == 204, response.text

    session_after = await api.session(session_id)
    assert await api.profile() == profile_before
    for field in RESTORED_SESSION_FIELDS:
        assert session_after[field] == session_before[field], field
    # And the question is back in play, as after any undo.
    again = await api.answer(session_id, _body(question_id, True))
    assert again["correct"] is True


@pytest.mark.parametrize("correct", [True, False], ids=["correct", "wrong"])
async def test_c7_undo_of_a_review_round_answer_restores_review_round_remaining(
    api: Api, force: dict[str, str], monkeypatch: pytest.MonkeyPatch, correct: bool
) -> None:
    """Outside a review round an answer leaves `reviewRoundRemaining` at 0, so
    only a review-round answer shows whether undo restores it."""
    session_id = await _keep_one(api, force, CO_CAPITAL)
    monkeypatch.undo()
    response = await api.client.post(
        f"/sessions/{session_id}/review-round", headers=api.headers, json={"length": 1}
    )
    assert response.status_code == 200, response.text
    served = response.json()["served"]
    session_before = await api.session(session_id)
    profile_before = await api.profile()
    assert session_before["reviewRoundRemaining"] > 0

    result = await api.answer(session_id, _body(served["question"]["id"], correct))
    assert result["session"]["reviewRoundRemaining"] != session_before["reviewRoundRemaining"]
    assert (await api.undo(session_id, result["answerId"])).status_code == 204

    session_after = await api.session(session_id)
    assert await api.profile() == profile_before
    for field in RESTORED_SESSION_FIELDS:
        assert session_after[field] == session_before[field], field
