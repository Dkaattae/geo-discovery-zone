"""T-051 tester: serving and grading `map_click`, one test per criterion.

Written from `tasks/T-051-map-click-render.md` by the tester, not the worker.
Expected values come from the criteria and from committed inputs (the question
file, and the served bank as it stood on `main` before this task, pinned below
as a digest), never from the implementation.

To answer a particular question in a session, `pick_question` is replaced by a
picker that returns the wanted question *from the pool the router hands it*,
so the pool itself is still the real one. Selection is out of scope here
(the brief's Out of scope, `selection.py`).
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

import httpx
import pytest
from sqlalchemy.orm import Session as DbSession

from app import store
from app.content_build import render_committed_inputs
from tests.conftest import DEMO_PROFILE_ID, assert_matches, assert_problem

REPO = Path(__file__).resolve().parents[2]
QUESTION_FILE = REPO / "question-bank" / "data" / "questions" / "us-states.json"
CONTENT_FILE = REPO / "backend" / "app" / "data" / "content.json"
SPEC_FILE = REPO / "openapi.yaml"

# The served bank on main at 1032b77 (the branch point), before T-051: 365
# questions, 315 multiple_choice and 50 map_identify. Digest of
# json.dumps(sorted by id, sort_keys=True, ensure_ascii=False,
# separators=(",", ":")), computed by the tester from
# `git show 1032b77:backend/app/data/content.json`.
MAIN_SERVED_COUNT = 365
MAIN_SERVED_DIGEST = "e5be815d160d2875f6fa2d860ec5590b24032ca9be06ff2d16ae46c189ad864e"

FIFTY_STATE_CODES = sorted(
    {
        "01", "02", "04", "05", "06", "08", "09", "10", "12", "13",
        "15", "16", "17", "18", "19", "20", "21", "22", "23", "24",
        "25", "26", "27", "28", "29", "30", "31", "32", "33", "34",
        "35", "36", "37", "38", "39", "40", "41", "42", "44", "45",
        "46", "47", "48", "49", "50", "51", "53", "54", "55", "56",
    }
)  # fmt: skip
TOPICS = ["agriculture", "capital", "climate", "landmark", "location", "superlative", "wildlife"]


def _file_questions() -> list[dict[str, Any]]:
    return json.loads(QUESTION_FILE.read_text(encoding="utf-8"))["questions"]


def _file_map_click() -> dict[str, dict[str, Any]]:
    return {q["id"]: q for q in _file_questions() if q["format"] == "map_click"}


def _served() -> list[dict[str, Any]]:
    return json.loads(CONTENT_FILE.read_text(encoding="utf-8"))["questions"]


def _served_map_click() -> dict[str, dict[str, Any]]:
    return {q["id"]: q for q in _served() if q["format"] == "map_click"}


def _digest(questions: list[dict[str, Any]]) -> str:
    text = json.dumps(
        sorted(questions, key=lambda q: q["id"]),
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
    )
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# -- Serving (criteria 1-7) ---------------------------------------------------


def test_c1_every_map_click_in_the_question_file_is_served() -> None:
    expected = set(_file_map_click())
    assert len(expected) == 50
    assert set(_served_map_click()) == expected


def test_c1_the_questions_served_before_t051_are_still_served_unchanged() -> None:
    before = [q for q in _served() if q["format"] in {"map_identify", "multiple_choice"}]
    assert len(before) == MAIN_SERVED_COUNT
    assert _digest(before) == MAIN_SERVED_DIGEST


def test_c1_no_other_format_is_served() -> None:
    assert {q["format"] for q in _served()} == {"map_identify", "multiple_choice", "map_click"}
    assert len(_served()) == MAIN_SERVED_COUNT + 50


def test_c2_served_answer_geometry_id_equals_the_question_files() -> None:
    expected = _file_map_click()
    for question_id, question in _served_map_click().items():
        assert question["answerGeometryId"] == expected[question_id]["answerGeometryId"]


def test_c2_the_answer_geometry_ids_are_the_fifty_state_codes() -> None:
    codes = sorted(q["answerGeometryId"] for q in _served_map_click().values())
    assert codes == FIFTY_STATE_CODES


@pytest.mark.parametrize(
    "field", ["choices", "correctIndex", "choiceGeometryIds", "highlightGeometryId", "answer"]
)
def test_c3_no_served_map_click_carries(field: str) -> None:
    carrying = [q["id"] for q in _served_map_click().values() if field in q]
    assert carrying == []


@pytest.mark.parametrize("field", ["answerGeometryId", "choiceGeometryIds"])
def test_c4_no_served_choice_format_question_carries(field: str) -> None:
    carrying = [
        q["id"]
        for q in _served()
        if q["format"] in {"map_identify", "multiple_choice"} and field in q
    ]
    assert carrying == []


def test_c5_every_served_map_click_reveals_with_map_highlight() -> None:
    assert {q["reveal"] for q in _served_map_click().values()} == {"map_highlight"}


def test_c6_committed_content_json_is_what_the_build_writes_and_repeats() -> None:
    first = render_committed_inputs()
    second = render_committed_inputs()
    assert CONTENT_FILE.read_text(encoding="utf-8") == first
    assert first == second


@pytest.mark.parametrize(
    "path", ["backend/app/content_build.py", "backend/app/data/content.json", "backend/README.md"]
)
def test_c7_no_file_says_map_click_is_withheld(path: str) -> None:
    text = (REPO / path).read_text(encoding="utf-8")
    assert "until T-051" not in text
    assert "joins in T-051" not in text
    for line in text.splitlines():
        if "map_click" in line:
            assert not re.search(r"withheld|not served|isn't served|is not served", line), line


# -- Contract (criteria 8-9; 10 is test_contract.py) --------------------------


def _schema(spec: dict[str, Any], name: str) -> dict[str, Any]:
    return spec["components"]["schemas"][name]


def test_c8_answer_request_has_an_optional_string_tapped_geometry_id(
    spec: dict[str, Any],
) -> None:
    schema = _schema(spec, "AnswerRequest")
    prop = schema["properties"]["tappedGeometryId"]
    assert prop["type"] == "string"
    assert "tappedGeometryId" not in schema.get("required", [])
    description = prop["description"]
    assert "map_click" in description
    assert "two-digit" in description
    assert "tapped" in description


def test_c9_question_has_an_optional_string_answer_geometry_id(spec: dict[str, Any]) -> None:
    schema = _schema(spec, "Question")
    prop = schema["properties"]["answerGeometryId"]
    assert prop["type"] == "string"
    assert "answerGeometryId" not in schema.get("required", [])
    description = prop["description"]
    assert "map_click" in description
    assert "only" in description
    assert "includeAnswerKey=false" in description
    assert "correctIndex" in description


# -- API: serving (criteria 11-13) --------------------------------------------


async def _walk(client: httpx.AsyncClient, **params: Any) -> list[dict[str, Any]]:
    seen: list[dict[str, Any]] = []
    cursor: str | None = None
    for _ in range(500):
        query: dict[str, Any] = {"limit": 7, **params}
        if cursor:
            query["cursor"] = cursor
        response = await client.get("/questions", params=query)
        assert response.status_code == 200, response.text
        page = response.json()
        seen += page["data"]
        cursor = page["page"]["nextCursor"]
        if not page["page"]["hasMore"]:
            return seen
    raise AssertionError("pagination never ended")


async def test_c11_listing_map_click_returns_exactly_the_served_ones(
    client: httpx.AsyncClient, spec: dict[str, Any]
) -> None:
    listed = await _walk(client, format="map_click")
    ids = [q["id"] for q in listed]
    assert len(ids) == len(set(ids))
    assert set(ids) == set(_served_map_click())
    served = _served_map_click()
    for question in listed:
        assert_matches(spec, "Question", question)
        assert question["answerGeometryId"] == served[question["id"]]["answerGeometryId"]
        for field in ("choices", "correctIndex", "choiceGeometryIds"):
            assert field not in question, (question["id"], field)


async def test_c12_get_question_without_the_key_drops_answer_geometry_id(
    client: httpx.AsyncClient,
) -> None:
    for question_id in sorted(_served_map_click())[:5]:
        withheld = await client.get(
            f"/questions/{question_id}", params={"includeAnswerKey": "false"}
        )
        assert withheld.status_code == 200, withheld.text
        assert "answerGeometryId" not in withheld.json()
        kept = await client.get(f"/questions/{question_id}")
        assert (
            kept.json()["answerGeometryId"] == _served_map_click()[question_id]["answerGeometryId"]
        )


def test_c13_location_and_mixed_pools_hold_every_map_click(db_session: DbSession) -> None:
    expected = set(_served_map_click())
    for topic in ("location", "mixed"):
        pool = {q["id"] for q in store.candidate_questions(db_session, topic)}
        assert expected <= pool, topic


@pytest.mark.parametrize("topic", [t for t in TOPICS if t != "location"])
def test_c13_no_other_topic_pool_holds_a_map_click(db_session: DbSession, topic: str) -> None:
    pool = store.candidate_questions(db_session, topic)
    assert pool, topic
    assert [q["id"] for q in pool if q["format"] == "map_click"] == []


# -- sessions, with a chosen question ----------------------------------------


@pytest.fixture
def force(monkeypatch: pytest.MonkeyPatch) -> dict[str, str]:
    """`force["id"] = question id` makes the next serve return that question,
    taken from the real candidate pool."""
    wanted: dict[str, str] = {}

    def pick(pool: list[dict[str, Any]], **_: Any) -> tuple[dict[str, Any] | None, bool]:
        match = [q for q in pool if q["id"] == wanted["id"]]
        assert match, f"{wanted['id']} is not in the pool the router offered"
        return match[0], False

    monkeypatch.setattr("app.routers.sessions.pick_question", pick)
    return wanted


async def _start(
    client: httpx.AsyncClient, headers: dict[str, str], topic: str = "location"
) -> tuple[str, dict[str, Any]]:
    response = await client.post(
        "/sessions", headers=headers, json={"profileId": DEMO_PROFILE_ID, "topic": topic}
    )
    assert response.status_code == 201, response.text
    body = response.json()
    return body["session"]["id"], body["served"]


async def _answer(
    client: httpx.AsyncClient, headers: dict[str, str], session_id: str, body: dict[str, Any]
) -> httpx.Response:
    return await client.post(f"/sessions/{session_id}/answers", headers=headers, json=body)


async def _undo(
    client: httpx.AsyncClient, headers: dict[str, str], session_id: str, answer_id: str
) -> None:
    response = await client.delete(f"/sessions/{session_id}/answers/{answer_id}", headers=headers)
    assert response.status_code == 204, response.text


AL = "gen:tpl-click-the-map:us-state-al"  # answerGeometryId "01" in the question file
AK = "gen:tpl-click-the-map:us-state-ak"  # "02"
AL_IDENTIFY = "gen:tpl-identify-on-map:us-state-al"


async def test_c12_a_session_serves_map_click_without_the_key_when_asked(
    client: httpx.AsyncClient, auth_headers: dict[str, str], force: dict[str, str]
) -> None:
    force["id"] = AK
    session_id, served = await _start(client, auth_headers)
    assert served["question"]["answerGeometryId"] == "02"  # default keeps the key
    response = await client.post(
        f"/sessions/{session_id}/next-question",
        headers=auth_headers,
        json={"includeAnswerKey": False},
    )
    assert response.status_code == 200, response.text
    question = response.json()["question"]
    assert question["id"] == AK
    assert question["format"] == "map_click"
    assert "answerGeometryId" not in question


# -- API: grading (criteria 14-21) --------------------------------------------


async def test_c14_c16_c17_tapping_the_answer_is_correct(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    force: dict[str, str],
    spec: dict[str, Any],
) -> None:
    force["id"] = AK
    session_id, served = await _start(client, auth_headers)
    assert served["question"]["id"] == AK
    response = await _answer(
        client, auth_headers, session_id, {"questionId": AK, "tappedGeometryId": "02"}
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert_matches(spec, "AnswerResult", result)
    assert result["correct"] is True
    assert result["reveal"]["mapHighlightGeometryId"] == "02"
    assert result["correctAnswer"] == "Alaska"
    assert "correctIndex" not in result


async def test_c15_c16_c17_every_other_state_code_and_dc_are_wrong(
    client: httpx.AsyncClient, auth_headers: dict[str, str], force: dict[str, str]
) -> None:
    force["id"] = AL
    session_id, _ = await _start(client, auth_headers)
    wrong_codes = [code for code in FIFTY_STATE_CODES if code != "01"] + ["11", "1"]
    assert len(wrong_codes) == 51
    for code in wrong_codes:
        response = await _answer(
            client, auth_headers, session_id, {"questionId": AL, "tappedGeometryId": code}
        )
        assert response.status_code == 200, (code, response.text)
        result = response.json()
        assert result["correct"] is False, code
        assert result["reveal"]["mapHighlightGeometryId"] == "01", code
        assert result["correctAnswer"] == "Alabama", code
        assert "correctIndex" not in result, code
        await _undo(client, auth_headers, session_id, result["answerId"])


async def test_c16_the_key_from_the_served_question_is_what_grades(
    client: httpx.AsyncClient, auth_headers: dict[str, str], force: dict[str, str]
) -> None:
    """Every one of the 50: right with its own code, and the reveal names it."""
    file_questions = sorted(_file_map_click().items())
    force["id"] = file_questions[0][0]
    session_id, _ = await _start(client, auth_headers, topic="mixed")
    first = True
    for question_id, question in file_questions:
        force["id"] = question_id
        if not first:
            nxt = await client.post(f"/sessions/{session_id}/next-question", headers=auth_headers)
            assert nxt.status_code == 200, nxt.text
        first = False
        response = await _answer(
            client,
            auth_headers,
            session_id,
            {"questionId": question_id, "tappedGeometryId": question["answerGeometryId"]},
        )
        assert response.status_code == 200, response.text
        result = response.json()
        assert result["correct"] is True, question_id
        assert result["reveal"]["mapHighlightGeometryId"] == question["answerGeometryId"]
        assert result["correctAnswer"] == question["answer"]
        # Undo keeps the run free of milestones and review prompts.
        await _undo(client, auth_headers, session_id, result["answerId"])
        # The question is back in play; answer it again so next-question moves on.
        again = await _answer(
            client,
            auth_headers,
            session_id,
            {"questionId": question_id, "tappedGeometryId": question["answerGeometryId"]},
        )
        assert again.status_code == 200, again.text


@pytest.mark.parametrize("extra", [{}, {"choiceIndex": 0}, {"choiceIndex": None}])
async def test_c18_no_tapped_geometry_id_is_422_and_the_question_stays_in_play(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    force: dict[str, str],
    extra: dict[str, Any],
) -> None:
    force["id"] = AL
    session_id, _ = await _start(client, auth_headers)
    before = (await client.get(f"/sessions/{session_id}", headers=auth_headers)).json()
    response = await _answer(client, auth_headers, session_id, {"questionId": AL, **extra})
    body = assert_problem(response, 422)
    assert [error["path"] for error in body["errors"]] == ["/tappedGeometryId"]
    after = (await client.get(f"/sessions/{session_id}", headers=auth_headers)).json()
    assert after["counts"] == before["counts"]
    graded = await _answer(
        client, auth_headers, session_id, {"questionId": AL, "tappedGeometryId": "01"}
    )
    assert graded.status_code == 200, graded.text
    assert graded.json()["correct"] is True


def _effects(result: dict[str, Any]) -> dict[str, Any]:
    profile = dict(result["profile"])
    session = result["session"]
    return {
        "profile": profile,
        "counts": session["counts"],
        "level": session["level"],
        "seen": session["seenEntityIds"],
        "learned": session["learnedEntityIds"],
        "reviewRoundRemaining": session["reviewRoundRemaining"],
        "levelChange": result.get("levelChange"),
        "prompts": result.get("prompts"),
    }


@pytest.mark.parametrize("correct", [True, False])
async def test_c19_a_map_click_answer_moves_state_as_a_map_identify_answer_does(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    force: dict[str, str],
    correct: bool,
) -> None:
    identify = next(q for q in _served() if q["id"] == AL_IDENTIFY)
    force["id"] = AL
    session_id, _ = await _start(client, auth_headers)
    tapped = await _answer(
        client,
        auth_headers,
        session_id,
        {"questionId": AL, "tappedGeometryId": "01" if correct else "13"},
    )
    assert tapped.status_code == 200, tapped.text
    assert tapped.json()["correct"] is correct
    click_effects = _effects(tapped.json())
    await _undo(client, auth_headers, session_id, tapped.json()["answerId"])

    # The undo put the profile back where it started, so a fresh session on the
    # same profile answers the map_identify from the same starting point.
    force["id"] = AL_IDENTIFY
    other_id, _ = await _start(client, auth_headers)
    index = identify["correctIndex"] if correct else (identify["correctIndex"] + 1) % 4
    chosen = await _answer(
        client, auth_headers, other_id, {"questionId": AL_IDENTIFY, "choiceIndex": index}
    )
    assert chosen.status_code == 200, chosen.text
    assert chosen.json()["correct"] is correct
    identify_effects = _effects(chosen.json())

    # Session ids and asked ids differ by construction and are not compared.
    assert click_effects == identify_effects
    if not correct:
        assert "us-state-al" in click_effects["profile"]["reviewQueue"]
    assert click_effects["profile"]["mastery"].get("us-state-al") is not None


async def _undo_drift(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    force: dict[str, str],
    question_id: str,
    body: dict[str, Any],
) -> tuple[set[str], dict[str, Any], dict[str, Any], str]:
    """Answers wrongly, undoes, and reports which session fields did not come back."""
    force["id"] = question_id
    session_id, _ = await _start(client, headers)
    session_before = (await client.get(f"/sessions/{session_id}", headers=headers)).json()
    profile_before = (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=headers)).json()
    wrong = await _answer(client, headers, session_id, {"questionId": question_id, **body})
    assert wrong.status_code == 200, wrong.text
    assert wrong.json()["correct"] is False
    assert wrong.json()["session"]["counts"] != session_before["counts"]
    await _undo(client, headers, session_id, wrong.json()["answerId"])
    session_after = (await client.get(f"/sessions/{session_id}", headers=headers)).json()
    profile_after = (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=headers)).json()
    drift = {key for key in session_before if session_before[key] != session_after[key]}
    assert profile_after == profile_before
    await client.post(f"/sessions/{session_id}/end", headers=headers)
    return drift, session_before, session_after, session_id


async def test_c20_undo_restores_profile_and_session_as_for_the_other_formats(
    client: httpx.AsyncClient, auth_headers: dict[str, str], force: dict[str, str]
) -> None:
    identify = next(q for q in _served() if q["id"] == AL_IDENTIFY)
    wrong_index = (identify["correctIndex"] + 1) % 4
    identify_drift, *_ = await _undo_drift(
        client, auth_headers, force, AL_IDENTIFY, {"choiceIndex": wrong_index}
    )
    click_drift, before, after, _ = await _undo_drift(
        client, auth_headers, force, AL, {"tappedGeometryId": "28"}
    )
    assert click_drift == identify_drift
    assert after["counts"] == before["counts"]
    assert after["level"] == before["level"]
    assert after["learnedEntityIds"] == before["learnedEntityIds"]


async def test_c20_after_an_undo_the_map_click_can_be_answered_again(
    client: httpx.AsyncClient, auth_headers: dict[str, str], force: dict[str, str]
) -> None:
    force["id"] = AL
    session_id, _ = await _start(client, auth_headers)
    wrong = await _answer(
        client, auth_headers, session_id, {"questionId": AL, "tappedGeometryId": "28"}
    )
    assert wrong.status_code == 200, wrong.text
    await _undo(client, auth_headers, session_id, wrong.json()["answerId"])
    again = await _answer(
        client, auth_headers, session_id, {"questionId": AL, "tappedGeometryId": "01"}
    )
    assert again.status_code == 200, again.text
    assert again.json()["correct"] is True


@pytest.mark.parametrize("tapped", [None, "01", "02", "99"])
async def test_c21_choice_formats_grade_by_choice_index_alone(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    force: dict[str, str],
    tapped: str | None,
) -> None:
    identify = next(q for q in _served() if q["id"] == AL_IDENTIFY)
    capital = next(
        q for q in _served() if q["format"] == "multiple_choice" and q["topic"] == "capital"
    )
    for question, topic in ((identify, "location"), (capital, "capital")):
        for index in range(len(question["choices"])):
            force["id"] = question["id"]
            session_id, _ = await _start(client, auth_headers, topic=topic)
            body: dict[str, Any] = {"questionId": question["id"], "choiceIndex": index}
            if tapped is not None:
                body["tappedGeometryId"] = tapped
            response = await _answer(client, auth_headers, session_id, body)
            assert response.status_code == 200, response.text
            assert response.json()["correct"] is (index == question["correctIndex"])
            # End each session so the profile's open sessions do not pile up.
            await client.post(f"/sessions/{session_id}/end", headers=auth_headers)


# -- What must not change (36, 37) --------------------------------------------


def test_c36_migrations_hold_only_the_initial_schema() -> None:
    versions = REPO / "backend" / "migrations" / "versions"
    assert sorted(p.name for p in versions.glob("*.py")) == ["0001_initial_schema.py"]


def test_c37_question_file_holds_fifty_map_click_without_candidates() -> None:
    """T-092 regenerated the file: no map_click carries candidates (E-29).

    Was `..._with_their_candidates`; changed by T-092's approved Test change
    request, row 24.
    """
    questions = _file_map_click()
    assert len(questions) == 50
    for question in questions.values():
        for key in ("choices", "correctIndex", "choiceGeometryIds"):
            assert key not in question, (question["id"], key)
        assert isinstance(question["answerGeometryId"], str)
        assert question["answerGeometryId"].strip() != ""


# -- Recorded decision (39) ---------------------------------------------------
# "Next unused number" and "no existing entry edited" are checked against git in
# the brief's Verdict, not pinned here: a digest of the whole file would go
# stale on the next task's entry, as T-089's did on this one.


def _e29() -> str:
    text = (REPO / "engineering-decisions.md").read_text(encoding="utf-8")
    sections = re.split(r"(?m)^## ", text)
    found = [s for s in sections if s.startswith("E-29 ")]
    assert len(found) == 1, "exactly one E-29 entry"
    return found[0]


def test_c39_e29_states_the_decision() -> None:
    entry = _e29()
    assert "no candidates" in entry
    assert re.search(r"any state can be tapped|every state responds", entry)
    assert "tappedGeometryId" in entry or "tapped geometry id" in entry


def test_c39_e29_quotes_dkaattaes_answer() -> None:
    entry = " ".join(_e29().split())
    assert "Dkaattae" in entry
    assert (
        "why a map click question has four candidate states? if it is clicking, "
        "just do not provide options."
    ) in entry


def test_c39_e29_names_the_options_not_taken() -> None:
    entry = " ".join(_e29().split()).lower()
    assert "options not taken" in entry
    assert "mark four candidates" in entry and "allow only them" in entry
    assert "mark nothing" in entry and "only the four" in entry


def test_c39_e29_names_what_it_changes_in_e24_e20_e21() -> None:
    entry = " ".join(_e29().split())
    assert "E-24" in entry and "withheld until T-051" in entry
    assert "E-20" in entry and "revisit trigger" in entry
    assert "E-21" in entry and "choiceGeometryIds" in entry and "not served" in entry


def test_c39_e29_ends_with_a_revisit_when_line() -> None:
    paragraphs = [p for p in _e29().strip().split("\n\n") if p.strip()]
    assert paragraphs[-1].startswith("**Revisit when**")
