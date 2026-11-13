"""T-045, written by the `tester`: one test per acceptance criterion.

Expected values come from the brief (`tasks/T-045-ungradable-formats.md`), not
from the implementation. Criteria 16-17 (no frontend/question-bank/bank/lockfile
change) are checked with `git diff` against the default branch and recorded in
the brief's Verdict, not pinned here as digests. Committed files only; no network.
Criteria 10-15 checked `openapi.yaml`'s text; they were deleted when CI stopped
checking the backend against it (`engineering-decisions.md` E-14).
"""

from __future__ import annotations

import json
import math
from typing import Any

import httpx
import pytest
from sqlalchemy.orm import Session

from app.content_build import (
    CONTENT_FILE,
    build_content,
    load_generated_questions,
    load_pipeline_entities,
)
from app.orm import QuestionRow
from tests.conftest import DEMO_PROFILE_ID, assert_problem

# Kansas, roughly. Any point well away from the poles works for the offsets below.
CENTROID = [-98.0, 38.5]
KM_PER_DEG_LAT = math.pi * 6371.0088 / 180  # ~111.19 km


def _north(km: float) -> list[float]:
    """A pin `km` due north of CENTROID (great-circle distance along a meridian)."""
    return [CENTROID[0], CENTROID[1] + km / KM_PER_DEG_LAT]


# --- endpoint helpers ----------------------------------------------------------


async def _pending(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: Session,
    payload: dict[str, Any],
) -> tuple[str, str, str]:
    """Start a session, serve one question, and turn it in the store into `payload`.

    The served bank holds none of these formats (criterion 9), so the brief says
    the test has to put one in the store. Returns (session id, question id, entity id).
    """
    created = await client.post(
        "/sessions", headers=auth_headers, json={"profileId": DEMO_PROFILE_ID}
    )
    assert created.status_code == 201, created.text
    session_id = created.json()["session"]["id"]
    served = await client.post(
        f"/sessions/{session_id}/next-question", headers=auth_headers, json={}
    )
    assert served.status_code == 200, served.text
    question_id = served.json()["question"]["id"]
    row = db_session.get(QuestionRow, question_id)
    assert row is not None
    entity_id = row.payload["entityId"]
    row.payload = {"prompt": "T-045 tester", **payload, "id": question_id, "entityId": entity_id}
    row.format = payload["format"]
    db_session.flush()
    return session_id, question_id, entity_id


async def _snapshot(
    client: httpx.AsyncClient, auth_headers: dict[str, str], session_id: str
) -> dict[str, Any]:
    s = await client.get(f"/sessions/{session_id}", headers=auth_headers)
    p = await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=auth_headers)
    assert s.status_code == 200 and p.status_code == 200
    sj, pj = s.json(), p.json()
    return {
        "counts": sj["counts"],
        "seenEntityIds": sj["seenEntityIds"],
        "stats": pj["stats"],
        "mastery": pj["mastery"],
        "reviewQueue": pj["reviewQueue"],
    }


async def _submit(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    session_id: str,
    question_id: str,
    answer: dict[str, Any],
) -> httpx.Response:
    return await client.post(
        f"/sessions/{session_id}/answers",
        headers=auth_headers,
        json={"questionId": question_id, **answer},
    )


async def _assert_refused_unchanged(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: Session,
    payload: dict[str, Any],
    answer: dict[str, Any],
    path: str,
) -> None:
    """Criterion 8 wrapped round each refusal: 422 at `path`, twice, state untouched."""
    session_id, question_id, entity_id = await _pending(client, auth_headers, db_session, payload)
    answer = {k: (entity_id if v == "<own>" else v) for k, v in answer.items()}
    if "order" in answer:
        answer["order"] = [entity_id if x == "<own>" else x for x in answer["order"]]
    before = await _snapshot(client, auth_headers, session_id)
    for attempt in (1, 2):
        r = await _submit(client, auth_headers, session_id, question_id, answer)
        problem = assert_problem(r, 422)
        assert [e["path"] for e in problem["errors"]] == [path], (attempt, problem)
    assert await _snapshot(client, auth_headers, session_id) == before


# --- Criterion 1: drag_order at /order ----------------------------------------


@pytest.mark.parametrize(
    "answer",
    [
        {},
        {"order": ["<own>"]},
        {"order": ["us-state-zz", "<own>", "us-state-aa"]},
        {"order": ["<own>", "us-state-aa"]},
        {"choiceIndex": 0},
    ],
    ids=["no-order", "own-id-only", "ids-any-sequence", "own-id-first", "choiceIndex"],
)
async def test_c1_and_c8_drag_order_is_refused_at_order(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: Session,
    answer: dict[str, Any],
) -> None:
    await _assert_refused_unchanged(
        client, auth_headers, db_session, {"format": "drag_order"}, answer, "/order"
    )


# --- Criterion 2: click_profile at /questionId --------------------------------


@pytest.mark.parametrize("answer", [{}, {"choiceIndex": 0}], ids=["bare", "choiceIndex"])
async def test_c2_and_c8_click_profile_is_refused_at_question_id(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: Session,
    answer: dict[str, Any],
) -> None:
    await _assert_refused_unchanged(
        client, auth_headers, db_session, {"format": "click_profile"}, answer, "/questionId"
    )


# --- Criterion 3: nearest_centroid still graded --------------------------------


@pytest.mark.parametrize("fmt", ["pin_pick", "pin_drop"])
@pytest.mark.parametrize(
    ("max_km", "pin_km", "correct"),
    [
        (500, 450, True),
        (500, 550, False),
        (100, 0, True),
        (None, 250, True),  # omitted -> 300 km
        (None, 350, False),
    ],
    ids=["explicit-inside", "explicit-outside", "on-centroid", "default-250", "default-350"],
)
async def test_c3_nearest_centroid_pin_is_graded(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: Session,
    fmt: str,
    max_km: float | None,
    pin_km: float,
    correct: bool,
) -> None:
    target: dict[str, Any] = {"strategy": "nearest_centroid", "centroid": CENTROID}
    if max_km is not None:
        target["maxDistanceKm"] = max_km
    session_id, question_id, _ = await _pending(
        client, auth_headers, db_session, {"format": fmt, "pinTarget": target}
    )
    r = await _submit(client, auth_headers, session_id, question_id, {"pin": _north(pin_km)})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["correct"] is correct
    assert body["distanceKm"] == pytest.approx(pin_km, abs=1.0)


# --- Criterion 4: geometry strategies refused, even on the centroid ------------


@pytest.mark.parametrize("fmt", ["pin_pick", "pin_drop"])
@pytest.mark.parametrize("strategy", ["polygon_then_centroid", "distance_to_line"])
async def test_c4_and_c8_geometry_strategy_is_refused_at_pin(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: Session,
    fmt: str,
    strategy: str,
) -> None:
    payload = {
        "format": fmt,
        "pinTarget": {"strategy": strategy, "centroid": CENTROID, "maxDistanceKm": 300},
    }
    await _assert_refused_unchanged(
        client, auth_headers, db_session, payload, {"pin": list(CENTROID)}, "/pin"
    )


# --- Criterion 5: no usable target ----------------------------------------------


@pytest.mark.parametrize("fmt", ["pin_pick", "pin_drop"])
@pytest.mark.parametrize(
    "extra",
    [
        {},
        {"pinTarget": {"centroid": CENTROID}},
        {"pinTarget": {"strategy": "nearest_centroid"}},
    ],
    ids=["no-pinTarget", "no-strategy", "centroid-strategy-without-centroid"],
)
async def test_c5_and_c8_pin_question_without_usable_target_is_refused_at_pin(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: Session,
    fmt: str,
    extra: dict[str, Any],
) -> None:
    await _assert_refused_unchanged(
        client, auth_headers, db_session, {"format": fmt, **extra}, {"pin": list(CENTROID)}, "/pin"
    )


# --- Criterion 6: no pin in the answer -------------------------------------------


@pytest.mark.parametrize("fmt", ["pin_pick", "pin_drop"])
@pytest.mark.parametrize("answer", [{}, {"choiceIndex": 0}], ids=["nothing", "choiceIndex"])
async def test_c6_and_c8_pin_answer_without_pin_is_refused_at_pin(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    db_session: Session,
    fmt: str,
    answer: dict[str, Any],
) -> None:
    payload = {"format": fmt, "pinTarget": {"strategy": "nearest_centroid", "centroid": CENTROID}}
    await _assert_refused_unchanged(client, auth_headers, db_session, payload, answer, "/pin")


# --- Criterion 7: other formats' paths do not move -------------------------------


async def test_c7_multiple_choice_without_choice_index_is_422_at_choice_index(
    client: httpx.AsyncClient, auth_headers: dict[str, str], db_session: Session
) -> None:
    payload = {"format": "multiple_choice", "choices": ["A", "B", "C"], "correctIndex": 1}
    session_id, question_id, _ = await _pending(client, auth_headers, db_session, payload)
    r = await _submit(client, auth_headers, session_id, question_id, {})
    assert [e["path"] for e in assert_problem(r, 422)["errors"]] == ["/choiceIndex"]


async def test_c7_map_click_without_tapped_geometry_is_422_at_tapped_geometry_id(
    client: httpx.AsyncClient, auth_headers: dict[str, str], db_session: Session
) -> None:
    payload = {"format": "map_click", "answerGeometryId": "20"}
    session_id, question_id, _ = await _pending(client, auth_headers, db_session, payload)
    r = await _submit(client, auth_headers, session_id, question_id, {})
    assert [e["path"] for e in assert_problem(r, 422)["errors"]] == ["/tappedGeometryId"]


# --- Criterion 9: none of the six is served -------------------------------------

UNSERVED = ["image", "ab_compare", "pin_pick", "pin_drop", "drag_order", "click_profile"]


def test_c9_committed_content_json_serves_none_of_the_six() -> None:
    content = json.loads(CONTENT_FILE.read_text(encoding="utf-8"))
    formats = {q["format"] for q in content["questions"]}
    assert formats, "content.json has questions"
    assert formats.isdisjoint(UNSERVED), formats


def test_c9_building_content_drops_the_six_formats() -> None:
    entities = load_pipeline_entities()
    questions = load_generated_questions()
    base = next(q for q in questions if q.get("format") == "multiple_choice")
    extra = [{**base, "id": f"t045-{fmt}", "format": fmt} for fmt in UNSERVED]
    built = build_content(entities, [base, *extra])
    ids = [q["id"] for q in built["questions"]]
    assert ids == [base["id"]]
