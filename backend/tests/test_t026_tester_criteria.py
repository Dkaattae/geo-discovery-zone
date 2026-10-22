"""T-026 tester: the brief's served-bank and session criteria (36-38, 46).

Expected values come from `tasks/T-026-biggest-state-superlative.md` and the
committed question file, not from the backend's code. Reads committed files and
drives the app through the test client. No network, nothing mocked.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

import httpx
import pytest

from app import content_build

OLD = ("tpl-identify-on-map", "tpl-capital-of", "tpl-click-the-map")
# Criterion 1: the six new templates' topics, by template id as the bank names them.
NEW = {
    "tpl-biggest-state": "superlative",
    "tpl-state-animal-of": "wildlife",
    "tpl-landmark-in": "landmark",
    "tpl-climate-of": "climate",
    "tpl-crop-of": "agriculture",
    "tpl-farm-animal-of": "agriculture",
}
NEW_TOPICS = ("superlative", "wildlife", "landmark", "climate", "agriculture")


def _file() -> list[dict[str, Any]]:
    return json.loads(content_build.QUESTION_FILE.read_text(encoding="utf-8"))["questions"]


def _content() -> dict[str, Any]:
    return json.loads(content_build.CONTENT_FILE.read_text(encoding="utf-8"))


def test_c36_all_265_new_questions_served_as_multiple_choice_with_their_topic() -> None:
    served = _content()["questions"]
    new = [q for q in served if q["templateId"] in NEW]
    assert len(new) == 265
    assert {q["id"] for q in new} == {q["id"] for q in _file() if q["templateId"] in NEW}
    for q in new:
        assert q["format"] == "multiple_choice", q["id"]
        assert q["topic"] == NEW[q["templateId"]], q["id"]


def test_c36_map_click_is_still_withheld() -> None:
    served_ids = {q["id"] for q in _content()["questions"]}
    clicks = [q["id"] for q in _file() if q["format"] == "map_click"]
    assert len(clicks) == 50
    assert served_ids.isdisjoint(clicks)
    assert len(served_ids) == 365


def test_c37_superlative_reveals_the_map_other_new_templates_reveal_none() -> None:
    for q in _content()["questions"]:
        if q["templateId"] == "tpl-biggest-state":
            assert q["reveal"] == "map_highlight", q["id"]
        elif q["templateId"] in NEW:
            assert q["reveal"] == "none", q["id"]


def test_c37_old_served_questions_are_byte_for_byte_main_s() -> None:
    old = [q for q in _content()["questions"] if q["templateId"] in OLD]
    assert len(old) == 100
    # sha256 of json.dumps(main's served questions, sort_keys=True), recorded at 45b00d7.
    digest = hashlib.sha256(json.dumps(old, sort_keys=True).encode()).hexdigest()
    assert digest == "55ce822c824d8fff500a55d04f8ba5771aedc7447e2585641d9dc5f61ef183d5"


def test_c37_no_served_question_gains_a_prose_field() -> None:
    old_keys = {
        "id", "entityId", "templateId", "format", "prompt", "choices", "correctIndex",
        "level", "topic", "scope", "entityType", "region", "ageBand",
        "highlightGeometryId", "reveal",
    }  # fmt: skip
    for q in _content()["questions"]:
        assert set(q) <= old_keys, (q["id"], set(q) - old_keys)


@pytest.mark.parametrize(
    ("topic", "count"),
    [("superlative", 47), ("wildlife", 50), ("landmark", 44), ("climate", 50), ("agriculture", 74)],
)
async def test_c38_questions_by_topic_returns_exactly_that_topics_generated_questions(
    client: httpx.AsyncClient, topic: str, count: int
) -> None:
    got: set[str] = set()
    cursor: str | None = None
    for _ in range(20):
        params: dict[str, Any] = {"topic": topic, "limit": 50}
        if cursor:
            params["cursor"] = cursor
        response = await client.get("/questions", params=params)
        assert response.status_code == 200, response.text
        body = response.json()
        got |= {q["id"] for q in body["data"]}
        if not body["page"]["hasMore"]:
            break
        cursor = body["page"]["nextCursor"]
    want = {q["id"] for q in _file() if NEW.get(q["templateId"]) == topic}
    assert len(want) == count
    assert got == want


@pytest.mark.parametrize("topic", NEW_TOPICS)
async def test_c46_a_new_topic_session_serves_only_that_topic_outside_review(
    client: httpx.AsyncClient, auth_headers: dict[str, str], topic: str
) -> None:
    profile = await client.post(
        "/profiles", headers=auth_headers, json={"name": "t026t", "avatar": "🐢", "grade": 2}
    )
    assert profile.status_code == 201, profile.text
    started = await client.post(
        "/sessions",
        headers=auth_headers,
        json={"profileId": profile.json()["id"], "topic": topic, "serveFirstQuestion": False},
    )
    assert started.status_code == 201, started.text
    session_id = started.json()["session"]["id"]
    non_review = 0
    for i in range(16):
        served = await client.post(f"/sessions/{session_id}/next-question", headers=auth_headers)
        assert served.status_code == 200, served.text
        question = served.json()["question"]
        is_review = served.json()["isReview"]
        # Answer every third wrong so the review queue has something in it.
        index = question["correctIndex"] if i % 3 else (question["correctIndex"] + 1) % 4
        answered = await client.post(
            f"/sessions/{session_id}/answers",
            headers=auth_headers,
            json={"questionId": question["id"], "choiceIndex": index},
        )
        assert answered.status_code == 200, answered.text
        if not is_review:
            non_review += 1
            assert question["topic"] == topic, question["id"]
    assert non_review >= 10
