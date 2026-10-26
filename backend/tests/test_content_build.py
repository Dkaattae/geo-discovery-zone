"""T-040 worker tests: the loader from pipeline JSON to the served bank.

The pure mapping is tested directly (`app.content_build`); what the app then
serves is tested through the API, against the committed `content.json` the
session fixture loads. No network: every input is a committed file or a dict
built here.
"""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any

import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import content_build, store
from app.models import Question
from app.orm import ContentMeta, EntityRow, QuestionRow
from tests.conftest import assert_matches

REPO_ROOT = Path(__file__).resolve().parents[2]
ARCHIVE = REPO_ROOT / "archive" / "hand-written-bank" / "content.json"


def _pipeline() -> list[dict[str, Any]]:
    return content_build.load_pipeline_entities()


def _generated() -> list[dict[str, Any]]:
    return content_build.load_generated_questions()


def _by_id(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {row["id"]: row for row in rows}


async def _all(client: httpx.AsyncClient, path: str, **params: Any) -> list[dict[str, Any]]:
    """Every row, paging through: since T-026 the bank is more than one page."""
    rows: list[dict[str, Any]] = []
    cursor: str | None = None
    for _ in range(100):
        page_params: dict[str, Any] = {"limit": 200, **params}
        if cursor:
            page_params["cursor"] = cursor
        response = await client.get(path, params=page_params)
        assert response.status_code == 200, response.text
        body = response.json()
        rows += body["data"]
        cursor = body["page"]["nextCursor"]
        if not body["page"]["hasMore"]:
            return rows
    raise AssertionError(f"{path} never stopped paging")


# -- the committed file is what the command writes (criteria 4, 5) -----------


def test_committed_content_json_is_what_the_loader_writes_from_committed_inputs() -> None:
    assert content_build.CONTENT_FILE.read_text(encoding="utf-8") == (
        content_build.render_committed_inputs()
    )


def test_one_changed_entity_field_makes_the_drift_check_fail() -> None:
    entities = _pipeline()
    edited = copy.deepcopy(entities)
    edited[0]["capital"] = "Somewhere Else"
    stale = content_build.render(content_build.build_content(edited, _generated()))
    assert stale != content_build.CONTENT_FILE.read_text(encoding="utf-8")


def test_rendering_is_deterministic() -> None:
    assert content_build.render_committed_inputs() == content_build.render_committed_inputs()


# -- the served bank (criteria 6-15) ------------------------------------------


async def test_version_counts_fifty_entities_and_415_questions(
    client: httpx.AsyncClient,
) -> None:
    body = (await client.get("/content/version")).json()
    assert body["counts"]["entities"] == 50
    assert body["counts"]["questions"] == 415  # T-051: 50 map_click (Test change request row 5)


async def test_entities_are_exactly_the_index_ids(client: httpx.AsyncClient) -> None:
    index = json.loads((content_build.ENTITY_DIR / "index.json").read_text(encoding="utf-8"))
    served = {e["id"] for e in await _all(client, "/entities")}
    assert served == {row["id"] for row in index["entities"]}
    assert "us-state-la" in served
    assert "us-state-lo" not in served


async def test_served_entity_fields_equal_the_pipeline_fields(client: httpx.AsyncClient) -> None:
    served = _by_id(await _all(client, "/entities"))
    for pipeline in _pipeline():
        entity = served[pipeline["id"]]
        for source, target in content_build.ENTITY_FIELDS:
            if pipeline.get(source) is None:
                assert target not in entity, (pipeline["id"], target)
            else:
                assert entity[target] == pipeline[source], (pipeline["id"], target)


async def test_missing_landmark_is_absent_and_empty_livestock_is_an_empty_list(
    client: httpx.AsyncClient,
) -> None:
    served = _by_id(await _all(client, "/entities"))
    no_landmark = [p["id"] for p in _pipeline() if p.get("landmark") is None]
    empty_livestock = [p["id"] for p in _pipeline() if p.get("top_livestock") == []]
    assert len(no_landmark) == 6
    assert len(empty_livestock) == 26
    for entity_id in no_landmark:
        assert "landmark" not in served[entity_id]
    for entity_id in empty_livestock:
        assert served[entity_id]["topLivestock"] == []


async def test_nothing_served_falls_outside_the_contract(
    client: httpx.AsyncClient, spec: dict[str, Any]
) -> None:
    for entity in await _all(client, "/entities"):
        assert_matches(spec, "Entity", entity)
        assert not any("_" in key for key in entity), entity["id"]
    for question in await _all(client, "/questions"):
        assert_matches(spec, "Question", question)
        # T-051 (Test change request row 7): map_click serves answerGeometryId
        # and no candidates; every other format still serves neither key.
        for key in ("answer", "choiceGeometryIds"):
            assert key not in question
        if question["format"] == "map_click":
            for key in ("choices", "correctIndex", "highlightGeometryId"):
                assert key not in question, (question["id"], key)
        else:
            assert "answerGeometryId" not in question, question["id"]
    # And in the stored payloads, not only after response-model filtering.
    raw = json.loads(content_build.CONTENT_FILE.read_text(encoding="utf-8"))
    entity_keys = set(spec["components"]["schemas"]["Entity"]["properties"])
    question_keys = set(spec["components"]["schemas"]["Question"]["properties"])
    for entity in raw["entities"]:
        assert set(entity) <= entity_keys, entity["id"]
    for question in raw["questions"]:
        assert set(question) <= question_keys, question["id"]


async def test_served_questions_are_every_file_question(
    client: httpx.AsyncClient,
) -> None:
    served = await _all(client, "/questions")
    # T-051 (Test change request row 6): map_click is served too.
    expected = {q["id"] for q in _generated()}
    assert {q["id"] for q in served} == expected
    assert len(served) == 415
    by_entity: dict[str, list[tuple[str, str]]] = {}
    for q in served:
        by_entity.setdefault(q["entityId"], []).append((q["format"], q["topic"]))
    assert len(by_entity) == 50
    # T-026 (approved Test change request A3): the seven served templates' pairs,
    # read from the file.
    expected_pairs: dict[str, list[tuple[str, str]]] = {}
    for q in _generated():
        expected_pairs.setdefault(q["entityId"], []).append((q["format"], q["topic"]))
    for entity_id, pairs in by_entity.items():
        assert sorted(pairs) == sorted(expected_pairs[entity_id]), entity_id
        assert ("map_identify", "location") in pairs
        assert ("multiple_choice", "capital") in pairs
        assert ("map_click", "location") in pairs
    clicks = await _all(client, "/questions", format="map_click")
    assert sorted(q["id"] for q in clicks) == sorted(
        q["id"] for q in _generated() if q["format"] == "map_click"
    )
    assert len(clicks) == 50


async def test_served_question_fields_equal_the_question_file(
    client: httpx.AsyncClient,
) -> None:
    generated = _by_id(_generated())
    for question in await _all(client, "/questions"):
        source = generated[question["id"]]
        # T-051 (Test change request row 8): a map_click serves the file's
        # fields minus its candidates, answerGeometryId included.
        if question["format"] == "map_click":
            for field, value in question.items():
                if field != "reveal":
                    assert value == source[field], (question["id"], field)
            assert question["answerGeometryId"] == source["answerGeometryId"]
            assert "choices" not in question and "correctIndex" not in question
            Question.model_validate(question)
            continue
        for field in (
            "prompt",
            "choices",
            "correctIndex",
            "level",
            "topic",
            "scope",
            "entityType",
            "region",
            "ageBand",
            "templateId",
            "highlightGeometryId",
        ):
            if field in source:
                assert question[field] == source[field], (question["id"], field)
            else:
                assert field not in question, (question["id"], field)
        Question.model_validate(question)
        assert len(question["choices"]) == 4
        assert 0 <= question["correctIndex"] <= 3
        assert question["choices"][question["correctIndex"]] == source["answer"]


async def test_question_ids_with_colons_resolve_and_withhold_the_answer_key(
    client: httpx.AsyncClient,
) -> None:
    for question in await _all(client, "/questions"):
        response = await client.get(
            f"/questions/{question['id']}", params={"includeAnswerKey": "false"}
        )
        assert response.status_code == 200, response.text
        body = response.json()
        # T-051 (Test change request row 9): a map_click's key is answerGeometryId.
        if question["format"] == "map_click":
            source = _by_id(_generated())[question["id"]]
            assert question["answerGeometryId"] == source["answerGeometryId"]
            assert "answerGeometryId" not in body
            continue
        assert "correctIndex" not in body
        answer = question["choices"][question["correctIndex"]]
        assert [k for k, v in body.items() if k != "choices" and v == answer] == []


# -- prose (criteria 16-19) ----------------------------------------------------


def _state(**overrides: Any) -> dict[str, Any]:
    entity = copy.deepcopy(_pipeline()[0])
    entity.update(overrides)
    return entity


def test_fun_fact_is_the_first_reviewed_entry() -> None:
    for pipeline in _pipeline():
        expected = next(f["text"] for f in pipeline["fun_facts"] if f["reviewed"] is True)
        assert content_build.served_entity(pipeline)["funFact"] == expected


def test_an_unreviewed_only_fact_is_served_as_no_fun_fact() -> None:
    secret = "UNREVIEWED-SENTINEL never ships"
    entity = _state(fun_facts=[{"text": secret, "source_url": None, "reviewed": False}])
    content = content_build.build_content([entity, *_pipeline()[1:]], _generated())
    served = content["entities"][0]
    assert served["id"] == entity["id"]
    assert "funFact" not in served
    assert secret not in content_build.render(content)


def test_a_reviewed_fact_after_an_unreviewed_one_is_the_one_served() -> None:
    secret = "UNREVIEWED-SENTINEL first in the list"
    entity = _state(
        fun_facts=[
            {"text": secret, "source_url": None, "reviewed": False},
            {"text": "Reviewed second fact.", "source_url": None, "reviewed": True},
        ]
    )
    content = content_build.build_content([entity, *_pipeline()[1:]], _generated())
    assert content["entities"][0]["funFact"] == "Reviewed second fact."
    assert secret not in content_build.render(content)


def test_the_loader_writes_no_prose_of_its_own() -> None:
    raw = json.loads(content_build.CONTENT_FILE.read_text(encoding="utf-8"))
    for entity in raw["entities"]:
        assert "funFactDetail" not in entity and "kidHook" not in entity
    for question in raw["questions"]:
        assert "shortExplanation" not in question and "detailExplanation" not in question


def test_a_broken_answer_key_is_refused() -> None:
    question = copy.deepcopy(next(q for q in _generated() if q["format"] == "multiple_choice"))
    question["correctIndex"] = (question["correctIndex"] + 1) % 4
    with pytest.raises(ValueError, match="disagree"):
        content_build.served_question(question)


# -- reveals (criteria 20-22) ------------------------------------------------------


async def _session(client: httpx.AsyncClient, auth_headers: dict[str, str], topic: str) -> str:
    profile = await client.post(
        "/profiles", headers=auth_headers, json={"name": "Loader", "avatar": "🐢", "grade": 2}
    )
    assert profile.status_code == 201, profile.text
    started = await client.post(
        "/sessions", headers=auth_headers, json={"profileId": profile.json()["id"], "topic": topic}
    )
    assert started.status_code == 201, started.text
    return started.json()["session"]["id"]


async def _answer(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    session_id: str,
    question: dict[str, Any],
    *,
    correct: bool,
) -> dict[str, Any]:
    if question["format"] == "map_click":
        # T-051 (Test change request row 10): a map_click is answered by a tap.
        key = question["answerGeometryId"]
        tapped = key if correct else ("02" if key != "02" else "01")
        body: dict[str, Any] = {"questionId": question["id"], "tappedGeometryId": tapped}
    else:
        choice = question["correctIndex"] if correct else (question["correctIndex"] + 1) % 4
        body = {"questionId": question["id"], "choiceIndex": choice}
    response = await client.post(f"/sessions/{session_id}/answers", headers=auth_headers, json=body)
    assert response.status_code == 200, response.text
    return response.json()


async def _next(
    client: httpx.AsyncClient, auth_headers: dict[str, str], session_id: str
) -> dict[str, Any]:
    response = await client.post(f"/sessions/{session_id}/next-question", headers=auth_headers)
    assert response.status_code == 200, response.text
    return response.json()["question"]


@pytest.mark.parametrize(
    ("topic", "highlights_on_correct"), [("location", True), ("capital", False)]
)
async def test_reveals(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    topic: str,
    highlights_on_correct: bool,
) -> None:
    entities = _by_id(
        json.loads(content_build.CONTENT_FILE.read_text(encoding="utf-8"))["entities"]
    )
    session_id = await _session(client, auth_headers, topic)
    question = await _next(client, auth_headers, session_id)
    entity = entities[question["entityId"]]

    right = (await _answer(client, auth_headers, session_id, question, correct=True))["reveal"]
    assert right["headline"] == entity["funFact"]
    if highlights_on_correct:
        assert right["mapHighlightGeometryId"] == entity["geometryId"]
    else:
        assert "mapHighlightGeometryId" not in right

    question = await _next(client, auth_headers, session_id)
    entity = entities[question["entityId"]]
    wrong = (await _answer(client, auth_headers, session_id, question, correct=False))["reveal"]
    label = (
        entity["name"]
        if question["format"] == "map_click"
        else question["choices"][question["correctIndex"]]
    )
    assert wrong["headline"] == f"The answer is {label}."
    assert wrong["answerLabel"] == label
    assert wrong["mapHighlightGeometryId"] == entity["geometryId"]


# -- loading (criteria 23-25) ----------------------------------------------------


def _snapshot(db: Session) -> tuple[str, dict[str, Any], dict[str, Any]]:
    meta = db.get(ContentMeta, 1)
    assert meta is not None
    entities = {r.id: r.payload for r in db.scalars(select(EntityRow))}
    questions = {r.id: r.payload for r in db.scalars(select(QuestionRow))}
    return meta.content_version, entities, questions


def test_loading_the_same_file_twice_changes_nothing(db_session: Session) -> None:
    store.ensure_content_loaded(db_session)
    before = _snapshot(db_session)
    store.ensure_content_loaded(db_session)
    assert _snapshot(db_session) == before


def test_loading_a_changed_file_replaces_the_bank(db_session: Session, tmp_path: Path) -> None:
    store.ensure_content_loaded(db_session)
    version_before = _snapshot(db_session)[0]
    entities = _pipeline()
    entities[0]["capital"] = "Changed Capital"
    dropped = entities.pop()
    content = content_build.build_content(entities, _generated()[:0])
    content["questions"] = [
        q
        for q in json.loads(content_build.CONTENT_FILE.read_text(encoding="utf-8"))["questions"]
        if q["entityId"] != dropped["id"]
    ]
    path = tmp_path / "content.json"
    path.write_text(content_build.render(content), encoding="utf-8")

    store.ensure_content_loaded(db_session, path=path)
    version, served_entities, served_questions = _snapshot(db_session)
    assert version != version_before
    assert served_entities[entities[0]["id"]]["capital"] == "Changed Capital"
    assert set(served_entities) == {e["id"] for e in content["entities"]}
    assert set(served_questions) == {q["id"] for q in content["questions"]}
    assert dropped["id"] not in served_entities


@pytest.mark.parametrize(
    ("topic", "count", "formats"),
    [
        # T-051 (Test change request rows 11, 12): map_click is served.
        ("location", 100, {"map_identify", "map_click"}),
        ("capital", 50, {"multiple_choice"}),
        ("mixed", 100, {"map_identify", "map_click", "multiple_choice"}),
    ],
)
async def test_a_perfect_session_reaches_every_question_once(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    topic: str,
    count: int,
    formats: set[str],
) -> None:
    session_id = await _session(client, auth_headers, topic)
    seen: list[dict[str, Any]] = []
    for _ in range(count):
        question = await _next(client, auth_headers, session_id)
        seen.append(question)
        await _answer(client, auth_headers, session_id, question, correct=True)
    assert len({q["id"] for q in seen}) == count
    assert {q["format"] for q in seen} == formats
    if topic != "mixed":
        per_entity: dict[str, int] = {}
        for q in seen:
            per_entity[q["entityId"]] = per_entity.get(q["entityId"], 0) + 1
        assert len(per_entity) == 50
        assert set(per_entity.values()) == {count // 50}


# -- the archived hand-written bank (criteria 26, 27) -----------------------------


def test_the_archive_is_the_hand_written_bank() -> None:
    raw = json.loads(ARCHIVE.read_text(encoding="utf-8"))
    assert len(raw["entities"]) == 15 and len(raw["questions"]) == 26
    assert any(e["id"] == "us-state-lo" for e in raw["entities"])


def test_no_shipped_source_reads_the_archive() -> None:
    roots = [REPO_ROOT / "backend" / "app", REPO_ROOT / "frontend" / "src"]
    roots.append(REPO_ROOT / "question-bank" / "src")
    pattern = re.compile(r"archive[/\\\"']|hand-written-bank")
    offenders = [
        str(path.relative_to(REPO_ROOT))
        for root in roots
        for path in root.rglob("*")
        if path.is_file()
        and path.suffix in {".py", ".ts", ".tsx", ".js", ".json"}
        and not re.search(r"(\.test\.|_test\.|test_)", path.name)
        and pattern.search(path.read_text(encoding="utf-8", errors="ignore"))
    ]
    assert offenders == []
