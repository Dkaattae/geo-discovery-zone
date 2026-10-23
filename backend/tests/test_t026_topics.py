"""T-026 worker tests: the five new topics as the backend serves them.

Reads the committed `content.json` and question file, and drives the app
through the test client. No network, nothing mocked. The tester's suite is the
check on the brief; this is the worker's own safety net.
"""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

from app import content_build

NEW_TEMPLATES = {
    "tpl-biggest-state": "superlative",
    "tpl-state-animal-of": "wildlife",
    "tpl-landmark-in": "landmark",
    "tpl-climate-of": "climate",
    "tpl-crop-of": "agriculture",
    "tpl-farm-animal-of": "agriculture",
}


def _generated() -> list[dict[str, Any]]:
    return content_build.load_generated_questions()


def _served() -> list[dict[str, Any]]:
    return json.loads(content_build.CONTENT_FILE.read_text(encoding="utf-8"))["questions"]


def test_all_265_new_questions_are_served_with_their_topic_and_format() -> None:
    new = [q for q in _served() if q["templateId"] in NEW_TEMPLATES]
    assert len(new) == 265
    for q in new:
        assert q["format"] == "multiple_choice", q["id"]
        assert q["topic"] == NEW_TEMPLATES[q["templateId"]], q["id"]
    assert not any(q["format"] == "map_click" for q in _served())


def test_superlative_reveals_the_map_and_every_other_reveal_is_by_format() -> None:
    for q in _served():
        if q["topic"] == "superlative":
            assert q["reveal"] == "map_highlight", q["id"]
        else:
            assert q["reveal"] == content_build.REVEAL_BY_FORMAT[q["format"]], q["id"]
        assert "shortExplanation" not in q and "detailExplanation" not in q, q["id"]


def test_served_question_keys_are_unchanged_by_the_new_templates() -> None:
    allowed = set(content_build.QUESTION_FIELDS) | {"reveal"}
    for q in _served():
        assert set(q) <= allowed, q["id"]


@pytest.mark.parametrize(
    ("topic", "count"),
    [("superlative", 47), ("wildlife", 50), ("landmark", 44), ("climate", 50), ("agriculture", 74)],
)
async def test_questions_filter_by_each_new_topic(
    client: httpx.AsyncClient, topic: str, count: int
) -> None:
    response = await client.get("/questions", params={"topic": topic, "limit": 200})
    assert response.status_code == 200, response.text
    body = response.json()
    want = {q["id"] for q in _generated() if q["topic"] == topic}
    assert {q["id"] for q in body["data"]} == want
    assert len(body["data"]) == count
    assert body["page"]["hasMore"] is False


async def test_a_correct_superlative_answer_highlights_the_answer_state(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    profile = await client.post(
        "/profiles", headers=auth_headers, json={"name": "t026", "avatar": "🐢", "grade": 2}
    )
    assert profile.status_code == 201, profile.text
    started = await client.post(
        "/sessions",
        headers=auth_headers,
        json={
            "profileId": profile.json()["id"],
            "topic": "superlative",
            "serveFirstQuestion": False,
        },
    )
    assert started.status_code == 201, started.text
    session_id = started.json()["session"]["id"]
    geometry = {
        e["id"]: e["geometryId"]
        for e in json.loads(content_build.CONTENT_FILE.read_text(encoding="utf-8"))["entities"]
    }
    for correct in (True, False):
        served = await client.post(f"/sessions/{session_id}/next-question", headers=auth_headers)
        assert served.status_code == 200, served.text
        question = served.json()["question"]
        assert question["topic"] == "superlative"
        index = question["correctIndex"] if correct else (question["correctIndex"] + 1) % 4
        answered = await client.post(
            f"/sessions/{session_id}/answers",
            headers=auth_headers,
            json={"questionId": question["id"], "choiceIndex": index},
        )
        assert answered.status_code == 200, answered.text
        reveal = answered.json()["reveal"]
        assert reveal["mapHighlightGeometryId"] == geometry[question["entityId"]]
