"""T-053 worker: the answer key is withheld unless the caller asks for it.

Worker's own tests, written alongside the change. The tester's criterion tests
are separate.
"""

from __future__ import annotations

from typing import Any

import httpx

from tests.conftest import DEMO_PROFILE_ID

KEY_FIELDS = ("correctIndex", "answerGeometryId")


def _withheld(question: dict[str, Any]) -> bool:
    return not any(field in question for field in KEY_FIELDS)


def _carried(question: dict[str, Any]) -> bool:
    if question["format"] == "map_click":
        return isinstance(question.get("answerGeometryId"), str)
    return isinstance(question.get("correctIndex"), int)


async def test_content_endpoints_withhold_by_default_and_opt_in(
    client: httpx.AsyncClient,
) -> None:
    for fmt in ("multiple_choice", "map_click"):
        page = (await client.get("/questions", params={"format": fmt, "limit": 5})).json()
        assert page["data"] and all(_withheld(q) for q in page["data"])
        keyed = await client.get(
            "/questions", params={"format": fmt, "limit": 5, "includeAnswerKey": "true"}
        )
        assert all(_carried(q) for q in keyed.json()["data"])

        question_id = page["data"][0]["id"]
        assert _withheld((await client.get(f"/questions/{question_id}")).json())
        one = await client.get(f"/questions/{question_id}", params={"includeAnswerKey": "true"})
        assert _carried(one.json())

    bundle = (await client.get("/bundles/us")).json()
    assert all(_withheld(q) for q in bundle["questions"])
    keyed_bundle = (await client.get("/bundles/us", params={"includeAnswerKey": "true"})).json()
    assert all(_carried(q) for q in keyed_bundle["questions"])


async def test_withholding_removes_only_the_key(client: httpx.AsyncClient) -> None:
    keyed = (
        await client.get("/questions", params={"limit": 500, "includeAnswerKey": "true"})
    ).json()
    bare = (await client.get("/questions", params={"limit": 500})).json()
    by_id = {q["id"]: q for q in bare["data"]}
    for question in keyed["data"]:
        expected = {k: v for k, v in question.items() if k not in KEY_FIELDS}
        assert by_id[question["id"]] == expected


async def test_session_serves_withhold_unless_asked(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    started = await client.post(
        "/sessions", headers=auth_headers, json={"profileId": DEMO_PROFILE_ID}
    )
    assert started.status_code == 201
    first = started.json()["served"]
    assert _withheld(first["question"])
    session_id = started.json()["session"]["id"]
    url = f"/sessions/{session_id}/next-question"

    # The first question is still pending, so each call re-serves it, and the
    # key follows the call in hand.
    plain = (await client.post(url, headers=auth_headers)).json()
    assert plain["question"]["id"] == first["question"]["id"]
    assert _withheld(plain["question"])
    empty = (await client.post(url, headers=auth_headers, json={})).json()
    assert _withheld(empty["question"])
    keyed = (await client.post(url, headers=auth_headers, json={"includeAnswerKey": True})).json()
    assert keyed["question"]["id"] == first["question"]["id"]
    assert _carried(keyed["question"])
    assert keyed.get("entity") == plain.get("entity")
    again = (await client.post(url, headers=auth_headers)).json()
    assert _withheld(again["question"])

    # Grading does not need the served key.
    question = keyed["question"]
    if question["format"] == "map_click":
        answer = {"tappedGeometryId": question["answerGeometryId"]}
    else:
        answer = {"choiceIndex": question["correctIndex"]}
    graded = await client.post(
        f"/sessions/{session_id}/answers",
        headers=auth_headers,
        json={"questionId": question["id"], **answer},
    )
    assert graded.status_code in (200, 201), graded.text
    assert graded.json()["correct"] is True
    if question["format"] != "map_click":
        assert graded.json()["correctIndex"] == question["correctIndex"]
