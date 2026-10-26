"""T-051 worker tests: serving and grading `map_click` (engineering-decisions.md E-29).

A `map_click` question offers no candidates. Any state can be tapped, and the
tap is graded by comparing `tappedGeometryId` with the question's
`answerGeometryId`. These are the worker's own checks, written against what was
built; the tester writes the independent ones.
"""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

from app.content_build import CONTENT_FILE, QUESTION_FILE, served_question
from app.grading import UngradableAnswer, build_reveal, grade
from app.serializers import question_payload
from tests.conftest import DEMO_PROFILE_ID, assert_matches, assert_problem

STATE_CODES = sorted(
    q["answerGeometryId"]
    for q in json.loads(QUESTION_FILE.read_text(encoding="utf-8"))["questions"]
    if q["format"] == "map_click"
)
CANDIDATE_FIELDS = ("choices", "correctIndex", "choiceGeometryIds", "highlightGeometryId", "answer")


def _file_map_click() -> dict[str, dict[str, Any]]:
    questions = json.loads(QUESTION_FILE.read_text(encoding="utf-8"))["questions"]
    return {q["id"]: q for q in questions if q["format"] == "map_click"}


def _served() -> list[dict[str, Any]]:
    return json.loads(CONTENT_FILE.read_text(encoding="utf-8"))["questions"]


# -- pure: building and grading ---------------------------------------------


def test_the_file_holds_fifty_distinct_state_codes() -> None:
    assert len(STATE_CODES) == 50
    assert len(set(STATE_CODES)) == 50
    assert "11" not in STATE_CODES


def test_a_served_map_click_drops_its_candidates_and_keeps_its_geometry_key() -> None:
    generated = next(iter(_file_map_click().values()))
    question = served_question(generated)
    for field in CANDIDATE_FIELDS:
        assert field not in question
    assert question["answerGeometryId"] == generated["answerGeometryId"]
    assert question["reveal"] == "map_highlight"


def test_a_map_click_without_a_two_digit_key_fails_the_build() -> None:
    generated = dict(next(iter(_file_map_click().values())), answerGeometryId="2")
    with pytest.raises(ValueError, match="answerGeometryId"):
        served_question(generated)


def test_every_map_click_in_the_file_is_served_with_its_key() -> None:
    expected = _file_map_click()
    served = {q["id"]: q for q in _served() if q["format"] == "map_click"}
    assert set(served) == set(expected)
    for question_id, question in served.items():
        assert question["answerGeometryId"] == expected[question_id]["answerGeometryId"]
        assert question["reveal"] == "map_highlight"
        assert not set(CANDIDATE_FIELDS) & set(question), question_id


def test_no_other_served_question_carries_a_geometry_key() -> None:
    for question in _served():
        if question["format"] != "map_click":
            assert "answerGeometryId" not in question, question["id"]
            assert "choiceGeometryIds" not in question, question["id"]


MAP_CLICK = {"id": "q", "entityId": "us-state-al", "format": "map_click", "answerGeometryId": "01"}


@pytest.mark.parametrize(
    ("tapped", "correct"),
    [("01", True), ("02", False), ("11", False), ("1", False), ("", False)],
)
def test_map_click_is_graded_by_exact_geometry_id(tapped: str, correct: bool) -> None:
    assert grade(MAP_CLICK, tapped_geometry_id=tapped) == (correct, None)


def test_a_choice_index_does_not_grade_a_map_click() -> None:
    with pytest.raises(UngradableAnswer) as caught:
        grade(MAP_CLICK, choice_index=0)
    assert caught.value.path == "/tappedGeometryId"
    assert grade(MAP_CLICK, choice_index=0, tapped_geometry_id="02") == (False, None)


def test_a_tapped_id_does_not_change_a_choice_grade() -> None:
    question = {"format": "map_identify", "correctIndex": 2, "choices": ["a", "b", "c", "d"]}
    assert grade(question, choice_index=2, tapped_geometry_id="99") == (True, None)
    assert grade(question, choice_index=1, tapped_geometry_id="99") == (False, None)


@pytest.mark.parametrize("correct", [True, False])
def test_the_reveal_highlights_the_answer_state(correct: bool) -> None:
    question = dict(MAP_CLICK, reveal="map_highlight")
    reveal = build_reveal(question, {"name": "Alabama", "geometryId": "01"}, correct=correct)
    assert reveal["mapHighlightGeometryId"] == "01"
    assert reveal["answerLabel"] == "Alabama"


def test_the_geometry_key_is_withheld_with_the_answer_key() -> None:
    assert "answerGeometryId" not in question_payload(MAP_CLICK, include_answer_key=False)
    assert question_payload(MAP_CLICK)["answerGeometryId"] == "01"


# -- through the API --------------------------------------------------------


async def test_listing_map_click_returns_exactly_the_served_ones(
    client: httpx.AsyncClient, spec: dict[str, Any]
) -> None:
    seen: list[dict[str, Any]] = []
    cursor: str | None = None
    while True:
        params: dict[str, Any] = {"format": "map_click", "limit": 20}
        if cursor:
            params["cursor"] = cursor
        page = (await client.get("/questions", params=params)).json()
        seen += page["data"]
        cursor = page["page"].get("nextCursor")
        if not page["page"]["hasMore"]:
            break
    assert sorted(q["id"] for q in seen) == sorted(_file_map_click())
    for question in seen:
        assert_matches(spec, "Question", question)
        assert "answerGeometryId" in question
        assert not {"choices", "correctIndex", "choiceGeometryIds"} & set(question)


async def test_a_single_question_withholds_its_geometry_key(client: httpx.AsyncClient) -> None:
    question_id = next(iter(_file_map_click()))
    response = await client.get(f"/questions/{question_id}", params={"includeAnswerKey": "false"})
    assert response.status_code == 200, response.text
    assert "answerGeometryId" not in response.json()


async def _session_at_a_map_click(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> tuple[str, dict[str, Any]]:
    """A location session whose question in play is a `map_click` one, served
    without its key. Earlier questions are answered correctly to move on."""
    response = await client.post(
        "/sessions",
        headers=auth_headers,
        json={"profileId": DEMO_PROFILE_ID, "topic": "location"},
    )
    assert response.status_code == 201, response.text
    session_id = response.json()["session"]["id"]
    keys = {q["id"]: q for q in _served()}
    for _ in range(60):
        served = (
            await client.post(
                f"/sessions/{session_id}/next-question",
                headers=auth_headers,
                json={"includeAnswerKey": False},
            )
        ).json()
        question = served["question"]
        if question["format"] == "map_click":
            assert "answerGeometryId" not in question
            return session_id, served
        answered = await client.post(
            f"/sessions/{session_id}/answers",
            headers=auth_headers,
            json={
                "questionId": question["id"],
                "choiceIndex": keys[question["id"]]["correctIndex"],
            },
        )
        assert answered.status_code == 200, answered.text
    raise AssertionError("a location session served no map_click question in 60 tries")


def _answer_key(question_id: str) -> str:
    return next(q for q in _served() if q["id"] == question_id)["answerGeometryId"]


async def test_a_right_tap_is_correct_and_names_the_state(
    client: httpx.AsyncClient, auth_headers: dict[str, str], spec: dict[str, Any]
) -> None:
    session_id, served = await _session_at_a_map_click(client, auth_headers)
    question_id = served["question"]["id"]
    key = _answer_key(question_id)

    missing = await client.post(
        f"/sessions/{session_id}/answers",
        headers=auth_headers,
        json={"questionId": question_id, "choiceIndex": 0},
    )
    problem = assert_problem(missing, 422)
    assert [e["path"] for e in problem["errors"]] == ["/tappedGeometryId"]

    response = await client.post(
        f"/sessions/{session_id}/answers",
        headers=auth_headers,
        json={"questionId": question_id, "tappedGeometryId": key},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert_matches(spec, "AnswerResult", result)
    assert result["correct"] is True
    assert "correctIndex" not in result
    assert result["reveal"]["mapHighlightGeometryId"] == key
    assert result["correctAnswer"] == served["entity"]["name"]


async def test_a_wrong_tap_queues_the_state_and_can_be_undone(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    session_id, served = await _session_at_a_map_click(client, auth_headers)
    question_id = served["question"]["id"]
    entity_id = served["question"]["entityId"]
    key = _answer_key(question_id)
    before = (await client.get(f"/sessions/{session_id}", headers=auth_headers)).json()

    response = await client.post(
        f"/sessions/{session_id}/answers",
        headers=auth_headers,
        json={"questionId": question_id, "tappedGeometryId": "11"},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["correct"] is False
    assert result["reveal"]["mapHighlightGeometryId"] == key
    assert result["correctAnswer"] == served["entity"]["name"]
    assert result["session"]["counts"]["wrong"] == before["counts"]["wrong"] + 1
    assert entity_id in result["profile"]["reviewQueue"]

    undone = await client.delete(
        f"/sessions/{session_id}/answers/{result['answerId']}", headers=auth_headers
    )
    assert undone.status_code == 204
    after = (await client.get(f"/sessions/{session_id}", headers=auth_headers)).json()
    assert after["counts"] == before["counts"]

    again = await client.post(
        f"/sessions/{session_id}/answers",
        headers=auth_headers,
        json={"questionId": question_id, "tappedGeometryId": key},
    )
    assert again.status_code == 200, again.text
    assert again.json()["correct"] is True
