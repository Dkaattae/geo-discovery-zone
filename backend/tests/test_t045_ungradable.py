"""T-045 worker tests: formats and pin strategies v1 cannot grade.

`drag_order` is refused at `/order`, `click_profile` at `/questionId`, and every
pin refusal at `/pin`. A pin whose strategy needs geometry is refused rather
than graded by centroid distance. These are the worker's own checks, written
against what was built; the tester writes the independent ones.
"""

from __future__ import annotations

from typing import Any

import httpx
import pytest
from sqlalchemy.orm import Session

from app.grading import UngradableAnswer, grade
from app.orm import QuestionRow
from tests.conftest import DEMO_PROFILE_ID, assert_problem

CENTROID = [-105.5, 39.0]
BASE = {"id": "q-t045", "entityId": "us-state-co", "prompt": "?"}


def _pin(fmt: str = "pin_drop", **target: Any) -> dict[str, Any]:
    return {**BASE, "format": fmt, "pinTarget": target}


def _path(question: dict[str, Any], **answer: Any) -> str:
    with pytest.raises(UngradableAnswer) as caught:
        grade(question, **answer)
    return caught.value.path


# -- pure: grade() ------------------------------------------------------------


@pytest.mark.parametrize("answer", [{}, {"choice_index": 0}, {"pin": CENTROID}])
def test_drag_order_is_refused_at_order(answer: dict[str, Any]) -> None:
    assert _path({**BASE, "format": "drag_order"}, **answer) == "/order"


@pytest.mark.parametrize("answer", [{}, {"choice_index": 0}])
def test_click_profile_is_refused_at_question_id(answer: dict[str, Any]) -> None:
    assert _path({**BASE, "format": "click_profile"}, **answer) == "/questionId"


def test_an_unknown_format_is_refused_at_question_id() -> None:
    assert _path({**BASE, "format": "something_new"}, choice_index=0) == "/questionId"


@pytest.mark.parametrize("fmt", ["pin_pick", "pin_drop"])
@pytest.mark.parametrize("strategy", ["polygon_then_centroid", "distance_to_line"])
def test_a_geometry_strategy_is_refused_even_on_the_centroid(fmt: str, strategy: str) -> None:
    question = _pin(fmt, strategy=strategy, centroid=CENTROID, maxDistanceKm=500)
    assert _path(question, pin=CENTROID) == "/pin"


@pytest.mark.parametrize(
    "question",
    [
        {**BASE, "format": "pin_pick"},
        _pin(centroid=CENTROID),
        _pin(strategy="nearest_centroid"),
        _pin(strategy="nearest_centroid", centroid=None),
    ],
    ids=["no-target", "no-strategy", "no-centroid", "null-centroid"],
)
def test_a_pin_question_without_a_usable_target_is_refused_at_pin(
    question: dict[str, Any],
) -> None:
    assert _path(question, pin=CENTROID) == "/pin"


@pytest.mark.parametrize("answer", [{}, {"choice_index": 0}])
def test_a_pin_answer_with_no_pin_is_refused_at_pin(answer: dict[str, Any]) -> None:
    assert _path(_pin(strategy="nearest_centroid", centroid=CENTROID), **answer) == "/pin"


@pytest.mark.parametrize(
    ("lat_offset", "correct"),
    # One degree of latitude is about 111 km.
    [(250 / 111.2, True), (350 / 111.2, False)],
)
@pytest.mark.parametrize("fmt", ["pin_pick", "pin_drop"])
def test_an_omitted_radius_means_300_km(fmt: str, lat_offset: float, correct: bool) -> None:
    question = _pin(fmt, strategy="nearest_centroid", centroid=CENTROID)
    got, distance = grade(question, pin=[CENTROID[0], CENTROID[1] + lat_offset])
    assert got is correct
    assert distance == pytest.approx(lat_offset * 111.2, abs=2)


def test_a_null_radius_also_means_300_km() -> None:
    question = _pin(strategy="nearest_centroid", centroid=CENTROID, maxDistanceKm=None)
    assert grade(question, pin=[CENTROID[0], CENTROID[1] + 2.0])[0] is True


def test_other_formats_keep_their_paths() -> None:
    assert _path({**BASE, "format": "multiple_choice", "correctIndex": 1}) == "/choiceIndex"
    assert (
        _path({**BASE, "format": "map_click", "answerGeometryId": "08"}, choice_index=0)
        == "/tappedGeometryId"
    )


# -- through the API ------------------------------------------------------------


async def _pending_as(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: Session,
    payload: dict[str, Any],
) -> tuple[str, str]:
    """A session whose pending question is rewritten in the store to `payload`.

    The served bank holds none of these formats (criterion 9), so the question
    in play is replaced in place; the test's transaction is rolled back after.
    """
    created = await client.post(
        "/sessions", headers=auth_headers, json={"profileId": DEMO_PROFILE_ID}
    )
    assert created.status_code == 201, created.text
    session_id = created.json()["session"]["id"]
    served = await client.post(
        f"/sessions/{session_id}/next-question",
        headers=auth_headers,
        json={"includeAnswerKey": False},
    )
    assert served.status_code == 200, served.text
    question_id = served.json()["question"]["id"]

    row = db_session.get(QuestionRow, question_id)
    assert row is not None
    row.payload = {**payload, "id": question_id, "entityId": row.payload["entityId"]}
    row.format = payload["format"]
    db_session.flush()
    return session_id, question_id


async def _state(
    client: httpx.AsyncClient, auth_headers: dict[str, str], session_id: str
) -> tuple[Any, ...]:
    session = (await client.get(f"/sessions/{session_id}", headers=auth_headers)).json()
    profile = (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=auth_headers)).json()
    return (
        session["counts"],
        session["seenEntityIds"],
        profile["stats"],
        profile["mastery"],
        profile["reviewQueue"],
    )


REFUSALS = [
    ({"format": "drag_order"}, {}, "/order"),
    ({"format": "drag_order"}, {"order": ["us-state-co", "us-state-al"]}, "/order"),
    ({"format": "drag_order"}, {"choiceIndex": 0}, "/order"),
    ({"format": "click_profile"}, {}, "/questionId"),
    ({"format": "click_profile"}, {"choiceIndex": 1}, "/questionId"),
    (
        {
            "format": "pin_pick",
            "pinTarget": {"strategy": "polygon_then_centroid", "centroid": CENTROID},
        },
        {"pin": CENTROID},
        "/pin",
    ),
    (
        {"format": "pin_drop", "pinTarget": {"strategy": "distance_to_line", "centroid": CENTROID}},
        {"pin": CENTROID},
        "/pin",
    ),
    ({"format": "pin_drop"}, {"pin": CENTROID}, "/pin"),
    (
        {"format": "pin_pick", "pinTarget": {"strategy": "nearest_centroid"}},
        {"pin": CENTROID},
        "/pin",
    ),
    (
        {"format": "pin_drop", "pinTarget": {"strategy": "nearest_centroid", "centroid": CENTROID}},
        {"choiceIndex": 0},
        "/pin",
    ),
    ({"format": "multiple_choice", "correctIndex": 0, "choices": ["a", "b"]}, {}, "/choiceIndex"),
    ({"format": "map_click", "answerGeometryId": "08"}, {"choiceIndex": 0}, "/tappedGeometryId"),
]


@pytest.mark.parametrize(("payload", "answer", "path"), REFUSALS)
async def test_a_refusal_names_its_path_and_changes_nothing(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: Session,
    payload: dict[str, Any],
    answer: dict[str, Any],
    path: str,
) -> None:
    session_id, question_id = await _pending_as(client, auth_headers, db_session, payload)
    before = await _state(client, auth_headers, session_id)

    for _ in range(2):  # a second try is 422 again, not 409: still pending
        response = await client.post(
            f"/sessions/{session_id}/answers",
            headers=auth_headers,
            json={"questionId": question_id, **answer},
        )
        problem = assert_problem(response, 422)
        assert [e["path"] for e in problem["errors"]] == [path]

    assert await _state(client, auth_headers, session_id) == before


async def test_a_centroid_pin_is_still_graded_at_the_endpoint(
    client: httpx.AsyncClient, auth_headers: dict[str, str], db_session: Session
) -> None:
    payload = {
        "format": "pin_drop",
        "pinTarget": {"strategy": "nearest_centroid", "centroid": CENTROID},
    }
    session_id, question_id = await _pending_as(client, auth_headers, db_session, payload)
    response = await client.post(
        f"/sessions/{session_id}/answers",
        headers=auth_headers,
        json={"questionId": question_id, "pin": [CENTROID[0], CENTROID[1] + 3.15]},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["correct"] is False
    assert body["distanceKm"] == pytest.approx(350, abs=3)
