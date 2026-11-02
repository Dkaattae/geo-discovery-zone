"""T-053 tester: one test (or more) per acceptance criterion.

Expected values come from the brief's criteria, not from the implementation.
"Withheld" = `correctIndex` and `answerGeometryId` both absent (not null).
"Carried" = a choice-format question has an integer `correctIndex`, a
`map_click` question a string `answerGeometryId`.

All calls go through the in-process ASGI client; nothing reaches the network.
"""

from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Any

import httpx
import pytest
import yaml

from tests.conftest import DEMO_PROFILE_ID, SPEC_PATH

KEY_FIELDS = ("correctIndex", "answerGeometryId")
REPO = Path(__file__).resolve().parents[2]
BASE = "e2e6495"  # the approved brief, before the worker's commit


def is_withheld(question: dict[str, Any]) -> bool:
    return "correctIndex" not in question and "answerGeometryId" not in question


def is_carried(question: dict[str, Any]) -> bool:
    if question["format"] == "map_click":
        return isinstance(question.get("answerGeometryId"), str)
    return isinstance(question.get("correctIndex"), int) and not isinstance(
        question.get("correctIndex"), bool
    )


async def whole_bank(client: httpx.AsyncClient, **params: Any) -> list[dict[str, Any]]:
    response = await client.get("/questions", params={"limit": 500, **params})
    assert response.status_code == 200, response.text
    return response.json()["data"]


async def start(client: httpx.AsyncClient, headers: dict[str, str], **body: Any) -> dict[str, Any]:
    response = await client.post(
        "/sessions", headers=headers, json={"profileId": DEMO_PROFILE_ID, **body}
    )
    assert response.status_code == 201, response.text
    return response.json()


async def next_q(
    client: httpx.AsyncClient, headers: dict[str, str], session_id: str, body: Any = None
) -> dict[str, Any]:
    url = f"/sessions/{session_id}/next-question"
    if body is None:
        response = await client.post(url, headers=headers)
    else:
        response = await client.post(url, headers=headers, json=body)
    assert response.status_code == 200, response.text
    return response.json()


async def key_of(client: httpx.AsyncClient, question_id: str) -> dict[str, Any]:
    response = await client.get(f"/questions/{question_id}", params={"includeAnswerKey": "true"})
    assert response.status_code == 200, response.text
    return response.json()


def answer_body(keyed: dict[str, Any], *, correct: bool) -> dict[str, Any]:
    if keyed["format"] == "map_click":
        key = keyed["answerGeometryId"]
        tapped = key if correct else ("02" if key != "02" else "01")
        return {"questionId": keyed["id"], "tappedGeometryId": tapped}
    index = keyed["correctIndex"]
    choice = index if correct else (index + 1) % len(keyed["choices"])
    return {"questionId": keyed["id"], "choiceIndex": choice}


async def first_of_format(client: httpx.AsyncClient, fmt: str) -> dict[str, Any]:
    data = (await client.get("/questions", params={"format": fmt, "limit": 1})).json()["data"]
    assert data, f"bank has no {fmt} question"
    return data[0]


# -- content endpoints ------------------------------------------------------


async def test_c1_list_without_flag_withholds_every_question_of_every_format(
    client: httpx.AsyncClient,
) -> None:
    page = await whole_bank(client)
    formats = {q["format"] for q in page}
    assert "map_click" in formats and formats - {"map_click"}, formats
    assert all(is_withheld(q) for q in page)


async def test_c1_a_one_entity_page_with_both_kinds_is_withheld(
    client: httpx.AsyncClient,
) -> None:
    response = await client.get("/questions", params={"entityId": "us-state-tx"})
    assert response.status_code == 200
    page = response.json()["data"]
    formats = {q["format"] for q in page}
    assert "map_click" in formats and formats - {"map_click"}, formats
    assert all(is_withheld(q) for q in page)


async def test_c2_list_with_true_carries_every_question(client: httpx.AsyncClient) -> None:
    page = await whole_bank(client, includeAnswerKey="true")
    assert len(page) > 0
    assert all(is_carried(q) for q in page)


async def test_c3_list_with_false_withholds_every_question(client: httpx.AsyncClient) -> None:
    page = await whole_bank(client, includeAnswerKey="false")
    assert len(page) > 0
    assert all(is_withheld(q) for q in page)


@pytest.mark.parametrize("fmt", ["multiple_choice", "map_click"])
async def test_c4_get_question_without_flag_is_withheld(
    client: httpx.AsyncClient, fmt: str
) -> None:
    question_id = (await first_of_format(client, fmt))["id"]
    response = await client.get(f"/questions/{question_id}")
    assert response.status_code == 200
    assert response.json()["format"] == fmt
    assert is_withheld(response.json())


@pytest.mark.parametrize("fmt", ["multiple_choice", "map_click"])
async def test_c5_get_question_with_true_is_carried(client: httpx.AsyncClient, fmt: str) -> None:
    question_id = (await first_of_format(client, fmt))["id"]
    keyed = await key_of(client, question_id)
    assert keyed["format"] == fmt
    assert is_carried(keyed)


async def test_c6_bundle_without_flag_withholds_every_question(
    client: httpx.AsyncClient,
) -> None:
    response = await client.get("/bundles/us")
    assert response.status_code == 200
    questions = response.json()["questions"]
    assert questions and all(is_withheld(q) for q in questions)


async def test_c7_bundle_with_true_carries_every_question(client: httpx.AsyncClient) -> None:
    response = await client.get("/bundles/us", params={"includeAnswerKey": "true"})
    assert response.status_code == 200
    questions = response.json()["questions"]
    assert questions and all(is_carried(q) for q in questions)


# -- session endpoints ------------------------------------------------------


@pytest.mark.parametrize("body", [None, {}], ids=["no-body", "empty-body"])
async def test_c8_next_question_without_flag_is_withheld(
    client: httpx.AsyncClient, auth_headers: dict[str, str], body: Any
) -> None:
    session_id = (await start(client, auth_headers, serveFirstQuestion=False))["session"]["id"]
    served = await next_q(client, auth_headers, session_id, body)
    assert is_withheld(served["question"])


async def test_c8_force_review_without_flag_is_withheld(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    # The seeded demo profile has a non-empty review queue (Texas).
    session_id = (await start(client, auth_headers, serveFirstQuestion=False))["session"]["id"]
    served = await next_q(client, auth_headers, session_id, {"forceReview": True})
    assert served["isReview"] is True
    assert is_withheld(served["question"])


async def test_c9_next_question_with_true_is_carried(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    session_id = (await start(client, auth_headers, serveFirstQuestion=False))["session"]["id"]
    served = await next_q(client, auth_headers, session_id, {"includeAnswerKey": True})
    assert is_carried(served["question"])


async def test_c10_start_session_default_serves_first_question_withheld(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    started = await start(client, auth_headers)  # serveFirstQuestion omitted
    assert started.get("served") is not None
    assert is_withheld(started["served"]["question"])


async def test_c11_review_round_serves_withheld(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    session_id = (await start(client, auth_headers, serveFirstQuestion=False))["session"]["id"]
    response = await client.post(
        f"/sessions/{session_id}/review-round", headers=auth_headers, json={}
    )
    assert response.status_code == 200, response.text
    assert is_withheld(response.json()["served"]["question"])


@pytest.mark.parametrize(
    "first_flag", [None, True, False], ids=["first-none", "first-true", "first-false"]
)
async def test_c12_a_re_serve_follows_the_request_not_the_first_serve(
    client: httpx.AsyncClient, auth_headers: dict[str, str], first_flag: bool | None
) -> None:
    session_id = (await start(client, auth_headers, serveFirstQuestion=False))["session"]["id"]
    first_body = None if first_flag is None else {"includeAnswerKey": first_flag}
    first = await next_q(client, auth_headers, session_id, first_body)
    qid = first["question"]["id"]

    bare = await next_q(client, auth_headers, session_id)
    assert bare["question"]["id"] == qid
    assert is_withheld(bare["question"])

    keyed = await next_q(client, auth_headers, session_id, {"includeAnswerKey": True})
    assert keyed["question"]["id"] == qid
    assert is_carried(keyed["question"])

    bare_again = await next_q(client, auth_headers, session_id, {})
    assert bare_again["question"]["id"] == qid
    assert is_withheld(bare_again["question"])


async def test_c12_re_serve_of_the_start_sessions_first_question_can_opt_in(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    started = await start(client, auth_headers)
    qid = started["served"]["question"]["id"]
    keyed = await next_q(client, auth_headers, started["session"]["id"], {"includeAnswerKey": True})
    assert keyed["question"]["id"] == qid
    assert is_carried(keyed["question"])


# -- what withholding removes ----------------------------------------------


async def test_c13_withheld_equals_carried_minus_exactly_the_key_across_the_bank(
    client: httpx.AsyncClient,
) -> None:
    carried = await whole_bank(client, includeAnswerKey="true")
    withheld = {q["id"]: q for q in await whole_bank(client)}
    assert set(withheld) == {q["id"] for q in carried}
    for question in carried:
        expected = {k: v for k, v in question.items() if k not in KEY_FIELDS}
        assert withheld[question["id"]] == expected, question["id"]
    # The fields the criterion names survive withholding (where the question has them).
    sample = next(q for q in withheld.values() if q.get("highlightGeometryId"))
    for field in ("id", "entityId", "prompt", "highlightGeometryId"):
        assert field in sample


@pytest.mark.parametrize("fmt", ["multiple_choice", "map_identify", "map_click"])
async def test_c13_single_question_withheld_equals_carried_minus_the_key(
    client: httpx.AsyncClient, fmt: str
) -> None:
    question_id = (await first_of_format(client, fmt))["id"]
    carried = await key_of(client, question_id)
    withheld = (await client.get(f"/questions/{question_id}")).json()
    assert withheld == {k: v for k, v in carried.items() if k not in KEY_FIELDS}


async def test_c13_served_question_and_entity_match_with_and_without_the_key(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    session_id = (await start(client, auth_headers, serveFirstQuestion=False))["session"]["id"]
    bare = await next_q(client, auth_headers, session_id)
    keyed = await next_q(client, auth_headers, session_id, {"includeAnswerKey": True})
    assert keyed["question"]["id"] == bare["question"]["id"]
    assert bare["question"] == {k: v for k, v in keyed["question"].items() if k not in KEY_FIELDS}
    assert "entity" in keyed
    assert bare["entity"] == keyed["entity"]
    assert {k: v for k, v in bare.items() if k != "question"} == {
        k: v for k, v in keyed.items() if k != "question"
    }


# -- grading ---------------------------------------------------------------


@pytest.mark.parametrize("correct", [True, False], ids=["right", "wrong"])
async def test_c14_a_withheld_choice_question_grades_against_the_stored_key(
    client: httpx.AsyncClient, auth_headers: dict[str, str], correct: bool
) -> None:
    session_id = (await start(client, auth_headers, serveFirstQuestion=False, topic="capital"))[
        "session"
    ]["id"]
    served = await next_q(client, auth_headers, session_id)
    assert is_withheld(served["question"])
    keyed = await key_of(client, served["question"]["id"])
    assert keyed["format"] != "map_click"
    response = await client.post(
        f"/sessions/{session_id}/answers",
        headers=auth_headers,
        json=answer_body(keyed, correct=correct),
    )
    assert response.status_code == 200, response.text
    assert response.json()["correct"] is correct
    assert response.json()["correctIndex"] == keyed["correctIndex"]


@pytest.mark.parametrize("correct", [True, False], ids=["right", "wrong"])
async def test_c14_a_withheld_map_click_question_grades_against_the_stored_key(
    client: httpx.AsyncClient, auth_headers: dict[str, str], correct: bool
) -> None:
    session_id = (await start(client, auth_headers, serveFirstQuestion=False, topic="location"))[
        "session"
    ]["id"]
    for _ in range(100):
        served = await next_q(client, auth_headers, session_id)
        assert is_withheld(served["question"])
        keyed = await key_of(client, served["question"]["id"])
        if keyed["format"] == "map_click":
            break
        await client.post(
            f"/sessions/{session_id}/answers",
            headers=auth_headers,
            json=answer_body(keyed, correct=True),
        )
    else:
        pytest.fail("a location session never served a map_click question")
    response = await client.post(
        f"/sessions/{session_id}/answers",
        headers=auth_headers,
        json=answer_body(keyed, correct=correct),
    )
    assert response.status_code == 200, response.text
    assert response.json()["correct"] is correct


# -- openapi.yaml ------------------------------------------------------------


@pytest.fixture(scope="module")
def raw_spec() -> dict[str, Any]:
    return yaml.safe_load(SPEC_PATH.read_text())


def test_c15_include_answer_key_parameter_defaults_false(raw_spec: dict[str, Any]) -> None:
    param = raw_spec["components"]["parameters"]["IncludeAnswerKey"]
    assert param["schema"]["default"] is False
    description = param["description"]
    assert "withheld" in description.lower()
    assert "true" in description
    assert "grades locally" not in description
    assert "locally" not in description.lower()
    assert "once grading" not in description


def test_c16_next_question_body_include_answer_key_defaults_false(
    raw_spec: dict[str, Any],
) -> None:
    op = raw_spec["paths"]["/sessions/{sessionId}/next-question"]["post"]
    schema = op["requestBody"]["content"]["application/json"]["schema"]
    if "$ref" in schema:
        name = schema["$ref"].rsplit("/", 1)[-1]
        schema = raw_spec["components"]["schemas"][name]
    assert schema["properties"]["includeAnswerKey"]["default"] is False


def _answer_keys_paragraph(raw_spec: dict[str, Any]) -> str:
    description = raw_spec["info"]["description"]
    start = description.index("Answer keys")
    rest = description[start:]
    end = rest.find("\n\n")
    return rest if end == -1 else rest[:end]


def test_c17_info_answer_keys_paragraph(raw_spec: dict[str, Any]) -> None:
    paragraph = _answer_keys_paragraph(raw_spec)
    for needle in ("includeAnswerKey=true", "entityId", "highlightGeometryId", "geometryId"):
        assert needle in paragraph, needle
    assert "grades locally" not in paragraph
    assert "once grading" not in paragraph
    assert "withheld" in paragraph.lower() or "without" in paragraph.lower()
    assert "/sessions" in paragraph and "review-round" in paragraph
    assert "map_identify" in paragraph and "map_click" in paragraph
    assert "answerGeometryId" in paragraph
    whole = raw_spec["info"]["description"]
    assert "grades locally" not in whole and "once grading" not in whole


@pytest.mark.parametrize("field", ["correctIndex", "answerGeometryId"])
def test_c18_question_key_fields_present_only_when_true(
    raw_spec: dict[str, Any], field: str
) -> None:
    description = raw_spec["components"]["schemas"]["Question"]["properties"][field]["description"]
    assert "includeAnswerKey=true" in description
    assert "includeAnswerKey=false" not in description


def test_c19_list_questions_description_names_a_fixed_window(raw_spec: dict[str, Any]) -> None:
    op = raw_spec["paths"]["/questions"]["get"]
    assert op["operationId"] == "listQuestions"
    description = op["description"]
    assert "widening" not in description and "widens" not in description
    assert "levelSpan" in description and "level" in description
    assert "fixed" in description.lower() and "window" in description.lower()


# -- boundaries (diff against the approved brief's commit) ----------------


def _changed(*paths: str) -> list[str]:
    try:
        out = subprocess.run(
            ["git", "diff", "--name-only", BASE, "HEAD", "--", *paths],
            cwd=REPO,
            capture_output=True,
            text=True,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        pytest.skip(f"git history at {BASE} not available")
    return [line for line in out.stdout.splitlines() if line]


def test_c20_contract_test_file_is_unchanged() -> None:
    assert _changed("backend/tests/test_contract.py") == []


def test_c22_no_change_under_frontend_question_bank_or_app_data() -> None:
    # Criterion 22 as amended by the person approving Test change request rows
    # 23-33 (2026-11-02): question-bank/ may change only in the six boundary
    # tests those rows re-pin.
    assert _changed("frontend", "backend/app/data") == []
    assert set(_changed("question-bank")) == {
        "question-bank/src/agriculture-true-wrong-answers-verify.test.ts",
        "question-bank/src/climate-cold-trade-accepted-verify.test.ts",
        "question-bank/src/familiarity-drawn-apart-verify.test.ts",
        "question-bank/src/farm-animal-loose-ends-verify.test.ts",
        "question-bank/src/map-click-no-candidates-verify.test.ts",
        "question-bank/src/refresh-regenerate-reminder-verify.test.ts",
    }


def test_c23_e2e_change_is_only_the_answer_lookup_doc_comment() -> None:
    # Criterion 23 as amended by the person approving Test change request row 22
    # (2026-11-02): map-click.spec.ts's answerKey() may also opt in to the key.
    assert set(_changed("e2e")) <= {"e2e/tests/app.ts", "e2e/tests/map-click.spec.ts"}
    diff = subprocess.run(
        ["git", "diff", "-U0", BASE, "HEAD", "--", "e2e/tests/app.ts"],
        cwd=REPO,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    changed_lines = [
        line[1:]
        for line in diff.splitlines()
        if line[:1] in "+-" and not line.startswith(("+++", "---"))
    ]
    for line in changed_lines:
        assert line.strip().startswith("*"), line
    for hunk in [h for h in diff.splitlines() if h.startswith("@@")]:
        old = hunk.split()[1]  # -start,count
        start = int(old[1:].split(",")[0])
        assert 212 <= start <= 218, hunk


def test_c24_grading_is_unchanged() -> None:
    assert _changed("backend/app/grading.py") == []


def test_c25_no_dependency_change() -> None:
    assert _changed("backend/pyproject.toml", "backend/uv.lock") == []


def test_c23_amended_map_click_spec_change_is_only_the_key_opt_in() -> None:
    """Row 22: the only e2e behaviour change is the lookup asking for the key."""
    try:
        diff = subprocess.run(
            ["git", "diff", "-U0", BASE, "HEAD", "--", "e2e/tests/map-click.spec.ts"],
            cwd=REPO,
            capture_output=True,
            text=True,
            check=True,
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        pytest.skip(f"git history at {BASE} not available")
    removed = [
        line[1:].strip()
        for line in diff.splitlines()
        if line.startswith("-") and not line.startswith("---")
    ]
    added = [
        line[1:].strip()
        for line in diff.splitlines()
        if line.startswith("+") and not line.startswith("+++")
    ]
    assert removed == ["`/api/v1/questions/${encodeURIComponent(questionId)}`,"]
    assert added == [
        "// T-053: the key is withheld by default, so the lookup opts in.",
        "`/api/v1/questions/${encodeURIComponent(questionId)}?includeAnswerKey=true`,",
    ]
