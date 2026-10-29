"""T-040 verification (tester) — the served bank, from the brief's criteria.

Written from `tasks/T-040-pipeline-loader.md`, not from the worker's tests.
Expected values come from the criteria and the committed *inputs*
(`question-bank/data/us-states/`, `question-bank/data/questions/us-states.json`,
`openapi.yaml`), never from `content.json` or `app.content_build`. The loader is
imported only as the entry point that criteria 4, 5 and 16-19 name.

Where the worker's tests sample (one question per reveal kind), these walk every
served question. No network: committed files and the in-process app only.
"""

from __future__ import annotations

import copy
import hashlib
import json
import re
from pathlib import Path
from typing import Any

import httpx
import pytest
import yaml
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import content_build, store
from app.models import Question
from app.orm import ContentMeta, EntityRow, QuestionRow

REPO = Path(__file__).resolve().parents[2]
ENTITY_DIR = REPO / "question-bank" / "data" / "us-states"
QUESTION_FILE = REPO / "question-bank" / "data" / "questions" / "us-states.json"
CONTENT = REPO / "backend" / "app" / "data" / "content.json"
ARCHIVE = REPO / "archive" / "hand-written-bank" / "content.json"
SPEC = yaml.safe_load((REPO / "openapi.yaml").read_text(encoding="utf-8"))

#: Criterion 8's pairs: served camelCase key -> pipeline key.
FIELD_PAIRS = {
    "id": "id",
    "type": "type",
    "scope": "scope",
    "name": "name",
    "capital": "capital",
    "region": "region",
    "geometryId": "geometry_id",
    "centroid": "centroid",
    "population": "population",
    "populationRank": "population_rank",
    "areaKm2": "area_km2",
    "areaRank": "area_rank",
    "borders": "borders",
    "climateKid": "climate_kid",
    "landmark": "landmark",
    "topCrops": "top_crops",
    "topLivestock": "top_livestock",
}

#: Criterion 13's keys, compared as-is against the question file.
QUESTION_KEYS = [
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
]


def index_ids() -> list[str]:
    index = json.loads((ENTITY_DIR / "index.json").read_text(encoding="utf-8"))
    return [row["id"] for row in index["entities"]]


def pipeline() -> dict[str, dict[str, Any]]:
    return {
        i: json.loads((ENTITY_DIR / f"{i}.json").read_text(encoding="utf-8")) for i in index_ids()
    }


def generated() -> list[dict[str, Any]]:
    return json.loads(QUESTION_FILE.read_text(encoding="utf-8"))["questions"]


def schema_properties(name: str) -> set[str]:
    """Every property `name` may carry, through `allOf` and `$ref`."""
    schema = SPEC["components"]["schemas"][name]
    found: set[str] = set(schema.get("properties", {}))
    for part in schema.get("allOf", []):
        if "$ref" in part:
            found |= schema_properties(part["$ref"].rsplit("/", 1)[-1])
        found |= set(part.get("properties", {}))
    return found


async def all_rows(client: httpx.AsyncClient, path: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    cursor: str | None = None
    for _ in range(100):
        params: dict[str, Any] = {"limit": 25}
        if cursor:
            params["cursor"] = cursor
        page = (await client.get(path, params=params)).json()
        rows += page["data"]
        cursor = page["page"]["nextCursor"]
        if not page["page"]["hasMore"]:
            return rows
    raise AssertionError(f"{path} never stopped paging")


# -- criteria 4, 5: the served bank is generated, and drift is caught -----------


def test_c4_the_command_is_documented_in_backend_readme_and_conventions() -> None:
    for doc in ("backend/README.md", "conventions.md"):
        text = (REPO / doc).read_text(encoding="utf-8")
        assert "make -C backend content" in text, doc
    makefile = (REPO / "backend" / "Makefile").read_text(encoding="utf-8")
    assert re.search(r"^content:.*\n\t\$\(UV\) run python -m app\.content_build$", makefile, re.M)
    assert re.search(r"^UV\s*:=\s*uv$", makefile, re.M)


def _without_extracted_at(text: str) -> dict[str, Any]:
    """The rendered file, parsed, with `_source.extractedAt` removed.

    T-070 (rows W55 and W56, approved): `extractedAt` is the newest bank `built_at`
    date, which a refresh moves without regenerating `content.json` (T-087 owns
    that). Everything else is still compared.
    """
    parsed = json.loads(text)
    del parsed["_source"]["extractedAt"]
    return parsed


def test_c4_c5_the_committed_file_is_byte_for_byte_what_the_command_writes() -> None:
    committed = CONTENT.read_text(encoding="utf-8")
    assert _without_extracted_at(content_build.render_committed_inputs()) == (
        _without_extracted_at(committed)
    )
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", json.loads(committed)["_source"]["extractedAt"])


def test_c4_two_renders_are_byte_identical() -> None:
    assert content_build.render_committed_inputs() == content_build.render_committed_inputs()


def test_c5_a_changed_input_field_would_be_caught() -> None:
    """The drift check above must be able to fail: one capital changed in the
    inputs gives a different render from the committed file."""
    entities = content_build.load_pipeline_entities()
    changed = copy.deepcopy(entities)
    changed[0]["capital"] = "Not A Capital"
    questions = content_build.load_generated_questions()
    committed = _without_extracted_at(CONTENT.read_text(encoding="utf-8"))
    same = content_build.render(content_build.build_content(entities, questions))
    moved = content_build.render(content_build.build_content(changed, questions))
    assert _without_extracted_at(same) == committed
    assert _without_extracted_at(moved) != committed


# -- criteria 6-10: entities -----------------------------------------------------


async def test_c6_version_counts_50_entities_and_415_questions(client: httpx.AsyncClient) -> None:
    counts = (await client.get("/content/version")).json()["counts"]
    assert counts["entities"] == 50
    assert counts["questions"] == 415  # T-051: 50 map_click (Test change request row 13)


async def test_c7_entities_are_exactly_the_index_ids_with_la_not_lo(
    client: httpx.AsyncClient,
) -> None:
    ids = [row["id"] for row in await all_rows(client, "/entities")]
    assert sorted(ids) == sorted(index_ids())
    assert len(ids) == 50
    assert "us-state-la" in ids
    assert "us-state-lo" not in ids


async def test_c8_every_named_field_equals_the_pipeline_value(client: httpx.AsyncClient) -> None:
    source = pipeline()
    mismatches = []
    for row in await all_rows(client, "/entities"):
        for served_key, pipeline_key in FIELD_PAIRS.items():
            want = source[row["id"]].get(pipeline_key)
            if want is None:
                continue  # criterion 9's case
            if row.get(served_key) != want:
                mismatches.append((row["id"], served_key, row.get(served_key), want))
    assert mismatches == []


async def test_c9_absent_landmark_is_absent_and_empty_livestock_is_an_empty_list(
    client: httpx.AsyncClient,
) -> None:
    source = pipeline()
    no_landmark = [i for i, e in source.items() if e.get("landmark") in (None, "")]
    no_livestock = [i for i, e in source.items() if e.get("top_livestock") == []]
    assert len(no_landmark) == 6
    assert len(no_livestock) == 26
    served = {row["id"]: row for row in await all_rows(client, "/entities")}
    for i in no_landmark:
        assert "landmark" not in served[i], i
    for i in no_livestock:
        assert served[i]["topLivestock"] == [], i
    for row in served.values():
        assert None not in row.values(), row["id"]
        assert "" not in row.values(), row["id"]


async def test_c10_no_served_key_outside_the_contract(client: httpx.AsyncClient) -> None:
    entity_keys = schema_properties("Entity")
    question_keys = schema_properties("Question")
    for row in await all_rows(client, "/entities"):
        extra = set(row) - entity_keys
        assert extra == set(), (row["id"], extra)
        assert not any("_" in key for key in row), row["id"]
        for banned in ("stateAnimal", "highestPoint", "sources"):
            assert banned not in row
    for row in await all_rows(client, "/questions"):
        extra = set(row) - question_keys
        assert extra == set(), (row["id"], extra)
        # T-051 (Test change request row 16): answerGeometryId on map_click only.
        for banned in ("answer", "choiceGeometryIds"):
            assert banned not in row
        if row["format"] == "map_click":
            for banned in ("choices", "correctIndex", "highlightGeometryId"):
                assert banned not in row, (row["id"], banned)
        else:
            assert "answerGeometryId" not in row, row["id"]


# -- criteria 11-15: questions ---------------------------------------------------


async def test_c11_served_ids_are_every_file_id(client: httpx.AsyncClient) -> None:
    # T-051 (Test change request row 14): map_click is served too.
    want = {q["id"] for q in generated()}
    served = await all_rows(client, "/questions")
    assert {q["id"] for q in served} == want
    assert len(served) == 415
    per_entity: dict[str, list[tuple[str, str]]] = {}
    for q in served:
        per_entity.setdefault(q["entityId"], []).append((q["format"], q["topic"]))
    assert sorted(per_entity) == sorted(index_ids())
    # T-026: the seven served templates' (format, topic) pairs, read from the file.
    expected: dict[str, list[tuple[str, str]]] = {}
    for q in generated():
        expected.setdefault(q["entityId"], []).append((q["format"], q["topic"]))
    for entity_id, pairs in per_entity.items():
        assert sorted(pairs) == sorted(expected[entity_id]), entity_id
        assert ("map_identify", "location") in pairs
        assert ("multiple_choice", "capital") in pairs
        assert ("map_click", "location") in pairs


async def test_c12_every_map_click_is_served_filtered_or_not(client: httpx.AsyncClient) -> None:
    # T-051 (Test change request row 15) reverses E-24's withholding.
    clicks = {q["id"] for q in generated() if q["format"] == "map_click"}
    assert len(clicks) == 50
    filtered = (await client.get("/questions", params={"format": "map_click", "limit": 500})).json()
    assert {q["id"] for q in filtered["data"]} == clicks
    assert len(filtered["data"]) == 50
    unfiltered = (await client.get("/questions", params={"limit": 500})).json()["data"]
    assert clicks <= {q["id"] for q in unfiltered}


async def test_c13_served_question_fields_equal_the_question_file(
    client: httpx.AsyncClient,
) -> None:
    source = {q["id"]: q for q in generated()}
    mismatches = []
    for row in await all_rows(client, "/questions"):
        want = source[row["id"]]
        # T-051 (Test change request row 17): a map_click serves the file's fields
        # minus its candidates, answerGeometryId included.
        if row["format"] == "map_click":
            for key, value in row.items():
                if key != "reveal" and value != want.get(key):
                    mismatches.append((row["id"], key, value, want.get(key)))
            if row.get("answerGeometryId") != want["answerGeometryId"]:
                mismatches.append((row["id"], "answerGeometryId", "missing or wrong"))
            for key in ("choices", "correctIndex"):
                if key in row:
                    mismatches.append((row["id"], key, "served on a map_click"))
            continue
        for key in QUESTION_KEYS:
            if key not in want:
                if key in row:
                    mismatches.append((row["id"], key, "present but the file omits it"))
            elif row.get(key) != want[key]:
                mismatches.append((row["id"], key, row.get(key), want[key]))
    assert mismatches == []


async def test_c14_every_question_validates_and_its_key_is_the_files_answer(
    client: httpx.AsyncClient,
) -> None:
    answers = {q["id"]: q["answer"] for q in generated()}
    keys = {q["id"]: q.get("answerGeometryId") for q in generated()}
    for row in await all_rows(client, "/questions"):
        Question.model_validate(row)
        # T-051 (Test change request row 18): a map_click's key is the file's code.
        if row["format"] == "map_click":
            assert row["answerGeometryId"] == keys[row["id"]], row["id"]
            assert "choices" not in row and "correctIndex" not in row, row["id"]
            continue
        assert len(row["choices"]) == 4
        assert row["correctIndex"] in range(4)
        assert row["choices"][row["correctIndex"]] == answers[row["id"]], row["id"]


async def test_c15_a_withheld_key_leaks_the_answer_nowhere_but_choices(
    client: httpx.AsyncClient,
) -> None:
    answers = {q["id"]: q["answer"] for q in generated()}
    for q_id, answer in answers.items():
        if q_id not in {q["id"] for q in generated() if q["format"] != "map_click"}:
            continue
        response = await client.get(f"/questions/{q_id}", params={"includeAnswerKey": False})
        assert response.status_code == 200, q_id
        body = response.json()
        assert "correctIndex" not in body
        assert answer in body["choices"]
        rest = {k: v for k, v in body.items() if k != "choices"}
        assert answer not in json.dumps(rest, ensure_ascii=False).split('"'), (q_id, rest)


# -- criteria 16-19: prose -------------------------------------------------------

SENTINEL_UNREVIEWED = "T040-TESTER-UNREVIEWED-zx81"
SENTINEL_REVIEWED = "T040-TESTER-REVIEWED-qq42"


def bank_with(fun_facts: list[dict[str, Any]]) -> str:
    """The committed inputs with Colorado's fun facts replaced, rendered."""
    entities = content_build.load_pipeline_entities()
    for entity in entities:
        if entity["id"] == "us-state-co":
            entity["fun_facts"] = fun_facts
    return content_build.render(
        content_build.build_content(entities, content_build.load_generated_questions())
    )


async def test_c16_fun_fact_is_the_first_reviewed_entry(client: httpx.AsyncClient) -> None:
    source = pipeline()
    for row in await all_rows(client, "/entities"):
        reviewed = [f["text"] for f in source[row["id"]]["fun_facts"] if f.get("reviewed") is True]
        assert row.get("funFact") == reviewed[0], row["id"]


def test_c17_an_unreviewed_only_fact_is_served_nowhere() -> None:
    rendered = bank_with([{"text": SENTINEL_UNREVIEWED, "source_url": "x", "reviewed": False}])
    assert SENTINEL_UNREVIEWED not in rendered
    colorado = next(e for e in json.loads(rendered)["entities"] if e["id"] == "us-state-co")
    assert "funFact" not in colorado
    assert colorado["name"] == "Colorado"


def test_c18_the_reviewed_second_fact_wins_and_the_first_appears_nowhere() -> None:
    rendered = bank_with(
        [
            {"text": SENTINEL_UNREVIEWED, "source_url": "x", "reviewed": False},
            {"text": SENTINEL_REVIEWED, "source_url": "x", "reviewed": True},
        ]
    )
    assert SENTINEL_UNREVIEWED not in rendered
    colorado = next(e for e in json.loads(rendered)["entities"] if e["id"] == "us-state-co")
    assert colorado["funFact"] == SENTINEL_REVIEWED


async def test_c19_no_prose_of_the_loaders_own(client: httpx.AsyncClient) -> None:
    for row in await all_rows(client, "/entities"):
        assert "funFactDetail" not in row and "kidHook" not in row, row["id"]
    for row in await all_rows(client, "/questions"):
        assert "shortExplanation" not in row and "detailExplanation" not in row, row["id"]


# -- criteria 20-22, 25: reveals over every served question, through sessions -----


async def play(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    topic: str,
    count: int,
    *,
    correct: bool,
) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    profile = await client.post(
        "/profiles", headers=headers, json={"name": f"t040-{topic}", "avatar": "🐢", "grade": 2}
    )
    assert profile.status_code == 201, profile.text
    started = await client.post(
        "/sessions",
        headers=headers,
        json={"profileId": profile.json()["id"], "topic": topic, "serveFirstQuestion": False},
    )
    assert started.status_code == 201, started.text
    session_id = started.json()["session"]["id"]
    played = []
    for _ in range(count):
        served = await client.post(f"/sessions/{session_id}/next-question", headers=headers)
        assert served.status_code == 200, served.text
        question = served.json()["question"]
        if question["format"] == "map_click":
            # T-051 (Test change request row 19): a map_click is answered by a tap.
            key = question["answerGeometryId"]
            tapped = key if correct else ("02" if key != "02" else "01")
            body: dict[str, Any] = {"questionId": question["id"], "tappedGeometryId": tapped}
        else:
            choice = question["correctIndex"] if correct else (question["correctIndex"] + 1) % 4
            body = {"questionId": question["id"], "choiceIndex": choice}
        answered = await client.post(f"/sessions/{session_id}/answers", headers=headers, json=body)
        assert answered.status_code == 200, answered.text
        played.append((question, answered.json()["reveal"]))
    return played


# T-051 (Test change request row 19): location now holds 100 questions in two
# formats, so a perfect location session plays 100 and meets each state twice.
@pytest.mark.parametrize(
    ("topic", "formats", "highlight", "count"),
    [
        ("location", {"map_identify", "map_click"}, True, 100),
        ("capital", {"multiple_choice"}, False, 50),
    ],
)
async def test_c20_c21_c25_a_perfect_topic_session_covers_each_state_once_with_its_reveal(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    topic: str,
    formats: set[str],
    highlight: bool,
    count: int,
) -> None:
    source = pipeline()
    played = await play(client, auth_headers, topic, count, correct=True)
    ids = [q["id"] for q, _ in played]
    assert len(set(ids)) == count
    per_state = count // 50
    assert sorted(q["entityId"] for q, _ in played) == sorted(index_ids() * per_state)
    for question, reveal in played:
        assert question["format"] in formats
        entity = source[question["entityId"]]
        fact = next(f["text"] for f in entity["fun_facts"] if f.get("reviewed") is True)
        assert reveal["headline"] == fact, question["id"]
        if highlight:
            assert reveal["mapHighlightGeometryId"] == entity["geometry_id"], question["id"]
        else:
            assert "mapHighlightGeometryId" not in reveal, question["id"]


async def test_c25_a_perfect_mixed_session_reaches_100_distinct_served_questions(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    played = await play(client, auth_headers, "mixed", 100, correct=True)
    ids = [q["id"] for q, _ in played]
    assert len(set(ids)) == 100
    # T-051 (Test change request row 19): mixed serves map_click too.
    assert {q["format"] for q, _ in played} == {"map_identify", "map_click", "multiple_choice"}


async def test_c22_every_wrong_answer_names_the_answer_and_highlights_the_state(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Wrong answers bring review questions back, so a 100-answer session does
    not reach every id; it must reach both formats and many states."""
    source = pipeline()
    # T-026: 200, not 100 -- each state now has seven served questions, so 100
    # answers reach only 32-34 states. The floor of 40 is unchanged.
    played = await play(client, auth_headers, "mixed", 200, correct=False)
    # T-051 (Test change request row 19): mixed serves map_click too, and a
    # map_click's answer is named by its state.
    assert {q["format"] for q, _ in played} == {"map_identify", "map_click", "multiple_choice"}
    assert len({q["entityId"] for q, _ in played}) >= 40
    for question, reveal in played:
        if question["format"] == "map_click":
            label = source[question["entityId"]]["name"]
        else:
            label = question["choices"][question["correctIndex"]]
        assert reveal["headline"] == f"The answer is {label}.", question["id"]
        assert reveal["answerLabel"] == label, question["id"]
        geometry = source[question["entityId"]]["geometry_id"]
        assert reveal["mapHighlightGeometryId"] == geometry, question["id"]


# -- criteria 23-24: loading ---------------------------------------------------------


def snapshot(db: Session) -> tuple[str, dict[str, Any], dict[str, Any]]:
    meta = db.get(ContentMeta, 1)
    assert meta is not None
    return (
        meta.content_version,
        {r.id: r.payload for r in db.scalars(select(EntityRow))},
        {r.id: r.payload for r in db.scalars(select(QuestionRow))},
    )


def test_c23_loading_the_committed_file_again_changes_nothing(db_session: Session) -> None:
    before = snapshot(db_session)
    store.ensure_content_loaded(db_session, path=CONTENT)
    store.ensure_content_loaded(db_session, path=CONTENT)
    assert snapshot(db_session) == before


def test_c24_a_changed_file_is_served_and_leaves_no_stale_rows(
    db_session: Session, tmp_path: Path
) -> None:
    version, _, _ = snapshot(db_session)
    document = json.loads(CONTENT.read_text(encoding="utf-8"))
    document["entities"][0]["capital"] = "Changed Capital"
    first_id = document["entities"][0]["id"]
    dropped_entity = document["entities"].pop()["id"]
    dropped_questions = {q["id"] for q in document["questions"] if q["entityId"] == dropped_entity}
    document["questions"] = [q for q in document["questions"] if q["entityId"] != dropped_entity]
    changed = tmp_path / "content.json"
    changed.write_text(json.dumps(document), encoding="utf-8")
    try:
        store.ensure_content_loaded(db_session, path=changed)
        new_version, entities, questions = snapshot(db_session)
        assert new_version != version
        assert entities[first_id]["capital"] == "Changed Capital"
        assert dropped_entity not in entities
        assert dropped_questions and dropped_questions.isdisjoint(questions)
        assert set(entities) == {e["id"] for e in document["entities"]}
        assert set(questions) == {q["id"] for q in document["questions"]}
    finally:
        store.ensure_content_loaded(db_session, path=CONTENT)


# -- criteria 26-34: archive, docs, contract, limits -----------------------------


#: sha256 of `git show aa88101:backend/app/data/content.json`, as T-025 pinned it.
AA88101_CONTENT_SHA = "81edf041acb6eb71135e09799a7f092fb00f8573ae52f894aa976d25650264fa"


def test_c26_the_archive_is_aa88101s_content_json_byte_for_byte() -> None:
    assert hashlib.sha256(ARCHIVE.read_bytes()).hexdigest() == AA88101_CONTENT_SHA


def test_c27_no_shipped_source_reads_archive() -> None:
    readers = []
    for top in ("backend/app", "frontend/src", "question-bank/src"):
        for path in (REPO / top).rglob("*"):
            if not path.is_file() or path.suffix not in {".py", ".ts", ".tsx", ".js", ".json"}:
                continue
            if ".test." in path.name or path.name.startswith("test_"):
                continue
            if "archive" in path.read_text(encoding="utf-8", errors="ignore"):
                readers.append(str(path.relative_to(REPO)))
    assert readers == []


def test_c28_conventions_layout_names_the_archive() -> None:
    text = (REPO / "conventions.md").read_text(encoding="utf-8")
    line = next(line for line in text.splitlines() if "archive/" in line)
    assert "hand-written" in line.lower()
    assert "purge" in line.lower()


def test_c29_backend_readme_no_longer_calls_the_seed_a_frontend_remap() -> None:
    text = (REPO / "backend" / "README.md").read_text(encoding="utf-8")
    assert "frontend/src/data/" not in text
    assert "make -C backend content" in text
    assert "content.json" in text


def test_c30_source_names_its_inputs_and_claims_no_human_prose() -> None:
    source = json.dumps(json.loads(CONTENT.read_text(encoding="utf-8"))["_source"])
    assert "question-bank/data/us-states/" in source
    assert "question-bank/data/questions/us-states.json" in source
    assert "human-written" not in source.lower()


def test_c31_top_livestock_description() -> None:
    text = (REPO / "openapi.yaml").read_text(encoding="utf-8")
    assert "Empty where the state has no honest standout." in text
    assert "where no state has" not in text


def test_c32_one_new_decision_entry_names_the_three_choices() -> None:
    """E-1..E-23 existed before this task; exactly one entry is added after them."""
    text = (REPO / "engineering-decisions.md").read_text(encoding="utf-8")
    numbers = [int(n) for n in re.findall(r"^## E-(\d+) ", text, re.M)]
    # T-026 adds E-25; numbering stays contiguous and still includes E-24.
    assert sorted(numbers) == list(range(1, max(numbers) + 1))
    assert 24 in numbers
    start = text.index("## E-24 ")
    following = text.find("\n## ", start + 1)
    body = text[start : following if following != -1 else None]
    assert "by hand" in body
    assert "archive" in body
    assert "map_click" in body and "T-051" in body


def test_c34_no_migration_added_and_no_create_all() -> None:
    """`0001_initial_schema.py` is the only migration on the default branch."""
    versions = sorted(p.name for p in (REPO / "backend" / "migrations" / "versions").glob("*.py"))
    assert versions == ["0001_initial_schema.py"]
    for path in (REPO / "backend" / "app").rglob("*.py"):
        assert "create_all" not in path.read_text(encoding="utf-8"), path


# Criterion 33 (no package.json / pyproject.toml / lockfile change) is already
# pinned byte-for-byte by question-bank's T-025 criterion 15 test, which is green.
