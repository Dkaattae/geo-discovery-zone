"""T-103 tester: the brief's acceptance criteria, one test (or case) each.

Expected values come from the brief, never from the worker's module. The
worker's module is used only for its entry points: `test_bank_fact(label)` (the
fact check itself) and `store.CONTENT_FILE`, the path the check reads.

Each edge case writes an edited copy of the committed bank to a temp file,
points `store.CONTENT_FILE` at it, and runs the real fact check. Red means the
check raises `AssertionError`; green means it returns.

Criterion 3 is checked through a real `pytest` run in a subprocess (no
network: it only runs the fact checks), because what it pins is pytest's
failure output, not a return value.
"""

from __future__ import annotations

import ast
import copy
import inspect
import json
import os
import random
import re
import subprocess
import sys
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest

from app import selection, store
from tests import test_t103_bank_facts as worker

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent
COMMITTED_PATH = BACKEND / "app" / "data" / "content.json"
COMMITTED: dict[str, Any] = json.loads(COMMITTED_PATH.read_text(encoding="utf-8"))
FACT_FILE = "tests/test_t103_bank_facts.py"

LABELS = ["B1", "B2", "B3a", "B3b", "B3c", "B4", "B5", "B6", "B7", "B8a", "B8b", "B8c", "B8d", "B9"]
TX = "us-state-tx"
NEWER = ["superlative", "wildlife", "landmark", "climate", "agriculture"]


# --- helpers -----------------------------------------------------------------


def fresh() -> dict[str, Any]:
    return copy.deepcopy(COMMITTED)


def qs(bank: dict[str, Any], **match: Any) -> list[dict[str, Any]]:
    return [q for q in bank["questions"] if all(q.get(k) == v for k, v in match.items())]


def q1(bank: dict[str, Any], **match: Any) -> dict[str, Any]:
    found = qs(bank, **match)
    assert found, f"committed bank has no question matching {match}"
    return found[0]


def ent(bank: dict[str, Any], entity_id: str) -> dict[str, Any]:
    return next(e for e in bank["entities"] if e["id"] == entity_id)


def geometry(bank: dict[str, Any], entity_id: str) -> str:
    return ent(bank, entity_id)["geometryId"]


def other_geometry(bank: dict[str, Any], entity_id: str) -> str:
    return next(e["geometryId"] for e in bank["entities"] if e["id"] != entity_id)


def duplicate(bank: dict[str, Any], row: dict[str, Any], suffix: str) -> None:
    extra = copy.deepcopy(row)
    extra["id"] = f"{row['id']}#tester-{suffix}"
    bank["questions"].append(extra)


def remove(bank: dict[str, Any], pred: Callable[[dict[str, Any]], bool]) -> None:
    before = len(bank["questions"])
    bank["questions"] = [q for q in bank["questions"] if not pred(q)]
    assert len(bank["questions"]) < before, "edit removed nothing"


def topic_size(bank: dict[str, Any], topic: str, n: int) -> None:
    rows = qs(bank, topic=topic)
    assert len(rows) >= n, f"{topic} has only {len(rows)}"
    keep = {r["id"] for r in rows[:n]}
    bank["questions"] = [q for q in bank["questions"] if q["topic"] != topic or q["id"] in keep]


def check_is_green(
    label: str, bank: dict[str, Any], tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> bool:
    """Run the real fact check `test_bank_fact[label]` against `bank`."""
    path = tmp_path / "content.json"
    path.write_text(json.dumps(bank), encoding="utf-8")
    monkeypatch.setattr(store, "CONTENT_FILE", path)
    try:
        worker.test_bank_fact(label)
    except AssertionError:
        return False
    return True


# --- criteria 5-18: one edit, one fact, red or green -------------------------

Edit = Callable[[dict[str, Any]], None]


def _set(match: dict[str, Any], key: str, value: Any) -> Edit:
    def edit(b: dict[str, Any]) -> None:
        q1(b, **match)[key] = value

    return edit


def _del(match: dict[str, Any], key: str) -> Edit:
    def edit(b: dict[str, Any]) -> None:
        del q1(b, **match)[key]

    return edit


def _ent_set(entity_id: str, key: str, value: Any) -> Edit:
    def edit(b: dict[str, Any]) -> None:
        ent(b, entity_id)[key] = value

    return edit


def _ent_del(entity_id: str, key: str) -> Edit:
    def edit(b: dict[str, Any]) -> None:
        del ent(b, entity_id)[key]

    return edit


CAP = {"topic": "capital", "entityId": "us-state-ak"}
IDENT = {"topic": "location", "format": "map_identify", "entityId": "us-state-ak"}
CLICK = {"topic": "location", "format": "map_click", "entityId": "us-state-ak"}


def _three_choices(b: dict[str, Any]) -> None:
    q = q1(b, **CAP)
    # drop a choice that is not the key, so only the count changes
    drop = 0 if q["correctIndex"] != 0 else 3
    del q["choices"][drop]
    if drop < q["correctIndex"]:
        q["correctIndex"] -= 1


def _five_choices(b: dict[str, Any]) -> None:
    q1(b, **IDENT)["choices"].append("Atlantis")


def _two_equal(b: dict[str, Any]) -> None:
    q = q1(b, **CAP)
    wrong = [i for i in range(4) if i != q["correctIndex"]]
    q["choices"][wrong[0]] = q["choices"][wrong[1]]


def _both_eleven(b: dict[str, Any]) -> None:
    ent(b, "us-state-ak")["geometryId"] = "11"
    q1(b, **CLICK)["answerGeometryId"] = "11"


def _highlight_other(b: dict[str, Any]) -> None:
    q1(b, **IDENT)["highlightGeometryId"] = other_geometry(b, "us-state-ak")


def _answer_other(b: dict[str, Any]) -> None:
    q1(b, **CLICK)["answerGeometryId"] = other_geometry(b, "us-state-ak")


def _mc_neither(b: dict[str, Any]) -> None:
    q = q1(b, **CAP)
    q.pop("highlightGeometryId", None)
    q.pop("answerGeometryId", None)


def _prompt_add(word: str) -> Edit:
    def edit(b: dict[str, Any]) -> None:
        q1(b, **CAP)["prompt"] += f" ({word})"

    return edit


def _second(match: dict[str, Any]) -> Edit:
    def edit(b: dict[str, Any]) -> None:
        duplicate(b, q1(b, **match), "second")

    return edit


def _drop(match: dict[str, Any]) -> Edit:
    def edit(b: dict[str, Any]) -> None:
        target = q1(b, **match)["id"]
        remove(b, lambda q: q["id"] == target)

    return edit


def _location_non_click(n: int) -> Edit:
    def edit(b: dict[str, Any]) -> None:
        idents = qs(b, topic="location", format="map_identify")
        others = [q for q in qs(b, topic="location") if q["format"] != "map_click"]
        assert len(others) <= n
        for i in range(n - len(others)):
            duplicate(b, idents[i], f"extra-{i}")
        assert sum(1 for q in qs(b, topic="location") if q["format"] != "map_click") == n

    return edit


def _no_location_click(b: dict[str, Any]) -> None:
    remove(b, lambda q: q["topic"] == "location" and q["format"] == "map_click")


def _drop_texas(keep: int) -> Edit:
    def edit(b: dict[str, Any]) -> None:
        tx = [q["id"] for q in qs(b, entityId=TX)]
        assert len(tx) > keep
        gone = set(tx[keep:])
        remove(b, lambda q: q["id"] in gone)
        assert len(qs(b, entityId=TX)) == keep

    return edit


RED, GREEN = False, True

CASES: list[tuple[str, str, str, bool, Edit]] = [
    # criterion 5, B1
    ("c5", "B1", "entityId-unknown", RED, _set(CAP, "entityId", "us-state-zz")),
    ("c5", "B1", "funFact-removed", RED, _ent_del("us-state-ak", "funFact")),
    ("c5", "B1", "funFact-empty", RED, _ent_set("us-state-ak", "funFact", "")),
    ("c5", "B1", "name-removed", RED, _ent_del("us-state-ak", "name")),
    ("c5", "B1", "name-empty", RED, _ent_set("us-state-ak", "name", "")),
    ("c5", "B1", "geometryId-removed", RED, _ent_del("us-state-ak", "geometryId")),
    ("c5", "B1", "geometryId-empty", RED, _ent_set("us-state-ak", "geometryId", "")),
    # criterion 6, B2
    ("c6", "B2", "3-choices", RED, _three_choices),
    ("c6", "B2", "5-choices", RED, _five_choices),
    ("c6", "B2", "two-choices-equal", RED, _two_equal),
    ("c6", "B2", "correctIndex-4", RED, _set(CAP, "correctIndex", 4)),
    ("c6", "B2", "correctIndex-minus-1", RED, _set(IDENT, "correctIndex", -1)),
    ("c6", "B2", "correctIndex-missing", RED, _del(CAP, "correctIndex")),
    ("c6", "B2", "correctIndex-0", GREEN, _set(CAP, "correctIndex", 0)),
    ("c6", "B2", "correctIndex-3", GREEN, _set(IDENT, "correctIndex", 3)),
    # criterion 7, B3a
    ("c7", "B3a", "answer-11", RED, _set(CLICK, "answerGeometryId", "11")),
    ("c7", "B3a", "answer-1", RED, _set(CLICK, "answerGeometryId", "1")),
    ("c7", "B3a", "answer-99", RED, _set(CLICK, "answerGeometryId", "99")),
    ("c7", "B3a", "answer-missing", RED, _del(CLICK, "answerGeometryId")),
    ("c7", "B3a", "entity-and-answer-both-11", RED, _both_eleven),
    # criterion 8, B3b
    ("c8", "B3b", "gains-choices", RED, _set(CLICK, "choices", ["Alaska", "Ohio", "Utah", "Iowa"])),
    ("c8", "B3b", "gains-correctIndex", RED, _set(CLICK, "correctIndex", 0)),
    ("c8", "B3b", "gains-highlight", RED, _set(CLICK, "highlightGeometryId", "02")),
    # criterion 9, B3c
    (
        "c9",
        "B3c",
        "texas-click-13",
        RED,
        _set({"entityId": TX, "format": "map_click"}, "answerGeometryId", "13"),
    ),
    # criterion 10, B4
    ("c10", "B4", "gains-shortExplanation", RED, _set(CAP, "shortExplanation", "x")),
    ("c10", "B4", "gains-detailExplanation", RED, _set(CAP, "detailExplanation", "x")),
    # criterion 11, B5
    ("c11", "B5", "highlight-other-state", RED, _highlight_other),
    ("c11", "B5", "click-answer-other-state", RED, _answer_other),
    ("c11", "B5", "multiple-choice-neither-field", GREEN, _mc_neither),
    # criterion 12, B6
    ("c12", "B6", "location-reveal-none", RED, _set(IDENT, "reveal", "none")),
    ("c12", "B6", "superlative-reveal-none", RED, _set({"topic": "superlative"}, "reveal", "none")),
    ("c12", "B6", "capital-reveal-map", RED, _set(CAP, "reveal", "map_highlight")),
    # criterion 13, B7
    ("c13", "B7", "prompt-review", RED, _prompt_add("review")),
    ("c13", "B7", "prompt-Review", RED, _prompt_add("Review")),
    ("c13", "B7", "prompt-REVIEW", RED, _prompt_add("REVIEW")),
    ("c13", "B7", "prompt-revie", GREEN, _prompt_add("revie")),
    ("c13", "B7", "prompt-view", GREEN, _prompt_add("view")),
    # criterion 14, B8a
    ("c14", "B8a", "second-identify", RED, _second(IDENT)),
    ("c14", "B8a", "click-removed", RED, _drop(CLICK)),
    ("c14", "B8a", "location-multiple-choice", RED, _set(IDENT, "format", "multiple_choice")),
    # criterion 15, B8b
    ("c15", "B8b", "second-capital", RED, _second(CAP)),
    ("c15", "B8b", "capital-removed", RED, _drop(CAP)),
    ("c15", "B8b", "capital-map-identify", RED, _set(CAP, "format", "map_identify")),
    # criterion 16, B8c
    ("c16", "B8c", "51-non-click", GREEN, _location_non_click(51)),
    ("c16", "B8c", "52-non-click", RED, _location_non_click(52)),
    ("c16", "B8c", "no-map-click", RED, _no_location_click),
    ("c16", "B8c", "b8a-red-but-under-bound", GREEN, _drop(CLICK)),
    # criterion 18, B9
    ("c18", "B9", "every-texas-question-removed", RED, _drop_texas(0)),
    ("c18", "B9", "one-texas-question-left", GREEN, _drop_texas(1)),
]
# criterion 17, B8d: each of the five topics, both sides
for _t in NEWER:
    CASES += [
        ("c17", "B8d", f"{_t}-16", GREEN, lambda b, t=_t: topic_size(b, t, 16)),
        ("c17", "B8d", f"{_t}-15", RED, lambda b, t=_t: topic_size(b, t, 15)),
        (
            "c17",
            "B8d",
            f"{_t}-one-map-click",
            RED,
            lambda b, t=_t: q1(b, topic=t).__setitem__("format", "map_click"),
        ),
    ]


@pytest.mark.parametrize(
    ("label", "edit", "want_green"),
    [pytest.param(lab, e, g, id=f"{c}-{lab}-{name}") for c, lab, name, g, e in CASES],
)
def test_c5_to_c18_one_edit_turns_its_fact_red_or_leaves_it_green(
    label: str, edit: Edit, want_green: bool, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    bank = fresh()
    edit(bank)
    assert check_is_green(label, bank, tmp_path, monkeypatch) is want_green


def test_c9_georgia_is_keyed_13_and_b3c_is_green() -> None:
    """The "another state keyed 13" green side is today's bank: prove it is."""
    georgia = [q for q in COMMITTED["questions"] if q.get("answerGeometryId") == "13"]
    assert georgia and all(q["entityId"] != TX for q in georgia)
    worker.test_bank_fact("B3c")


def test_c9_a_non_texas_question_keyed_13_by_edit_stays_green(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    bank = fresh()
    q1(bank, **CLICK)["answerGeometryId"] = "13"  # Alaska's click keyed to 13
    assert check_is_green("B3c", bank, tmp_path, monkeypatch)


def test_c11_committed_has_a_multiple_choice_question_with_neither_field() -> None:
    assert any(
        q["format"] == "multiple_choice"
        and "highlightGeometryId" not in q
        and "answerGeometryId" not in q
        for q in COMMITTED["questions"]
    )


# --- criterion 1: committed bank passes --------------------------------------


@pytest.mark.parametrize("label", LABELS)
def test_c1_the_committed_bank_passes(label: str) -> None:
    assert store.CONTENT_FILE == COMMITTED_PATH
    worker.test_bank_fact(label)


# --- criterion 2: one check per fact, label in node id -----------------------


def test_c2_each_fact_has_its_own_node_id_carrying_its_label() -> None:
    out = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "--collect-only",
            "-q",
            "-p",
            "no:cacheprovider",
            FACT_FILE,
        ],
        cwd=BACKEND,
        capture_output=True,
        text=True,
        check=False,
    )
    ids = [line for line in out.stdout.splitlines() if line.startswith(FACT_FILE + "::")]
    for label in LABELS:
        mine = [i for i in ids if re.search(rf"\b{re.escape(label)}\b", i)]
        assert len(mine) == 1, (label, mine)
    # fourteen different checks, not one check naming many labels
    fact_ids = {i for i in ids for lab in LABELS if re.search(rf"\b{re.escape(lab)}\b", i)}
    assert len(fact_ids) == 14


# --- criterion 3: a failure names its dependents -----------------------------
# Written out from the brief's "Facts and their dependents" table, not from the
# worker's DEPENDENTS.

S = "test_sessions_api.py"
T53 = "test_t053_tester_criteria.py"
T93 = "test_t093_tester_criteria.py"
R3 = (S, "test_a_topic_filters_every_question_served")
R26 = ("test_content_build.py", "test_reveals")
R27 = ("test_content_build.py", "test_a_perfect_session_reaches_every_question_once")
R29 = (
    "test_t026_tester_criteria.py",
    "test_c46_a_new_topic_session_serves_only_that_topic_outside_review",
)
R30 = ("test_t026_topics.py", "test_a_correct_superlative_answer_highlights_the_answer_state")
R31 = (
    "test_t040_tester_criteria.py",
    "test_c20_c21_c25_a_perfect_topic_session_covers_each_state_once_with_its_reveal",
)
R44 = ("test_t051_map_click.py", "test_a_right_tap_is_correct_and_names_the_state")
R45 = ("test_t051_map_click.py", "test_a_wrong_tap_queues_the_state_and_can_be_undone")
R64 = (T53, "test_c14_a_withheld_choice_question_grades_against_the_stored_key")
R65 = (T53, "test_c14_a_withheld_map_click_question_grades_against_the_stored_key")
R71 = (T93, "test_c5_undoing_a_review_round_answer_restores_the_seen_list")
R81 = ("test_t093_undo_places_seen.py", "test_undoing_a_review_round_answer_restores_the_seen_list")
B2_ROWS = [
    R3,
    (S, "test_a_question_can_be_served_without_its_answer_key"),
    (S, "test_a_correct_answer_returns_the_reward_and_the_key"),
    (S, "test_a_wrong_answer_returns_the_reason_and_queues_the_entity"),
    (S, "test_answering_the_same_question_twice_is_refused"),
    (S, "test_an_answer_with_no_choice_cannot_be_graded"),
    (S, "test_three_wrong_in_a_row_drops_the_level_without_a_message"),
    (S, "test_the_same_answer_cannot_be_undone_twice"),
    (S, "test_only_the_most_recent_answer_can_be_undone"),
    (S, "test_ending_twice_returns_the_same_summary"),
    R29,
    ("test_t053_answer_key_default.py", "test_session_serves_withhold_unless_asked"),
    (T53, "test_c9_next_question_with_true_is_carried"),
    (T53, "test_c12_a_re_serve_follows_the_request_not_the_first_serve"),
    (T53, "test_c12_re_serve_of_the_start_sessions_first_question_can_opt_in"),
    R64,
    R71,
    R81,
]
B3_ROWS = [r for r in B2_ROWS if r not in (R3, R29, R64)] + [R44, R45, R65]
TABLE: dict[str, list[tuple[str, str]]] = {
    "B1": [
        (S, "test_starting_a_session_serves_the_first_question"),
        (S, "test_the_first_question_carries_its_entity_for_the_map"),
        R26,
        R31,
        R44,
        R45,
    ],
    "B2": B2_ROWS,
    "B3a": B3_ROWS,
    "B3b": B3_ROWS,
    "B3c": [R71],
    "B4": [R26],
    "B5": [R26, R30, R31, R44, R45],
    "B6": [R26, R30, R31],
    "B7": [(S, "test_a_review_question_is_not_labelled_to_the_kid")],
    "B8a": [R27, R31],
    "B8b": [R27, R31, R3, R64],
    "B8c": [R44, R45, R65],
    "B8d": [R29],
    "B9": [
        (S, "test_a_review_round_serves_from_the_queue"),
        (T53, "test_c8_force_review_without_flag_is_withheld"),
        (T53, "test_c11_review_round_serves_withheld"),
        R71,
        (T93, "test_c7_undo_of_a_review_round_answer_restores_review_round_remaining"),
        R81,
    ],
}


def test_c3_the_table_has_fourteen_rows_and_every_named_test_exists() -> None:
    assert sorted(TABLE) == sorted(LABELS)
    for label, rows in TABLE.items():
        for file, name in rows:
            src = (BACKEND / "tests" / file).read_text(encoding="utf-8")
            assert re.search(rf"def {re.escape(name)}\(", src), (label, file, name)


def _break_all_but_b9(b: dict[str, Any]) -> None:
    """One edit per fact, on distinct rows, so all of B1-B8d go red at once."""
    ent(b, "us-state-ak")["funFact"] = ""  # B1
    q1(b, topic="capital", entityId="us-state-al")["correctIndex"] = 4  # B2
    q1(b, format="map_click", entityId="us-state-az")["answerGeometryId"] = "99"  # B3a
    q1(b, format="map_click", entityId="us-state-ar")["correctIndex"] = 0  # B3b
    q1(b, format="map_click", entityId=TX)["answerGeometryId"] = "13"  # B3c
    q1(b, topic="capital", entityId="us-state-ca")["shortExplanation"] = "x"  # B4
    q1(b, format="map_identify", entityId="us-state-co")["highlightGeometryId"] = "02"  # B5
    q1(b, topic="capital", entityId="us-state-ct")["reveal"] = "map_highlight"  # B6
    q1(b, topic="capital", entityId="us-state-de")["prompt"] += " Review!"  # B7
    wy_click = q1(b, format="map_click", entityId="us-state-wy")["id"]  # B8a
    wy_cap = q1(b, topic="capital", entityId="us-state-wy")["id"]  # B8b
    b["questions"] = [q for q in b["questions"] if q["id"] not in (wy_click, wy_cap)]
    for i, q in enumerate(qs(b, format="map_identify")[:2]):  # B8c: 52 non-click
        duplicate(b, q, f"c3-{i}")
    topic_size(b, "landmark", 15)  # B8d


def _break_b9(b: dict[str, Any]) -> None:
    b["questions"] = [q for q in b["questions"] if q["entityId"] != TX]


def _pytest_failure_sections(
    bank: dict[str, Any], labels: list[str], tmp_path: Path, ci: bool
) -> dict[str, str]:
    bank_path = tmp_path / "bank.json"
    bank_path.write_text(json.dumps(bank), encoding="utf-8")
    plugin_dir = tmp_path / "plugin"
    plugin_dir.mkdir(exist_ok=True)
    (plugin_dir / "t103_tester_swap_bank.py").write_text(
        "import os\nfrom pathlib import Path\n\n\n"
        "def pytest_configure(config):\n"
        "    from app import store\n"
        "    store.CONTENT_FILE = Path(os.environ['T103_TESTER_BANK'])\n",
        encoding="utf-8",
    )
    env = {k: v for k, v in os.environ.items() if k not in ("CI", "PYTEST_ADDOPTS")}
    if ci:
        env["CI"] = "true"
    env["T103_TESTER_BANK"] = str(bank_path)
    env["PYTHONPATH"] = os.pathsep.join([str(plugin_dir), str(BACKEND)])
    nodes = [f"{FACT_FILE}::test_bank_fact[{lab}]" for lab in labels]
    out = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "-p",
            "t103_tester_swap_bank",
            "-p",
            "no:cacheprovider",
            "-q",
            *nodes,
        ],
        cwd=BACKEND,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    text = out.stdout + out.stderr
    # split on pytest's per-failure header: "____ test_bank_fact[B2] ____"
    parts = re.split(r"^_{3,} test_bank_fact\[(\w+)\] _{3,}$", text, flags=re.M)
    sections = {parts[i]: parts[i + 1] for i in range(1, len(parts) - 1, 2)}
    assert sorted(sections) == sorted(labels), text[-3000:]
    return sections


@pytest.mark.parametrize("ci", [False, True], ids=["local", "ci"])
def test_c3_a_failing_fact_check_names_every_dependent(ci: bool, tmp_path: Path) -> None:
    bank = fresh()
    _break_all_but_b9(bank)
    sections = _pytest_failure_sections(bank, LABELS[:-1], tmp_path, ci)
    bank9 = fresh()
    _break_b9(bank9)
    sections |= _pytest_failure_sections(bank9, ["B9"], tmp_path, ci)
    missing = [
        f"{label}: {file}::{name}"
        for label, rows in TABLE.items()
        for file, name in rows
        if file not in sections[label] or name not in sections[label]
    ]
    assert not missing, missing


# --- criterion 4: no draw ----------------------------------------------------


def _boom(*_a: Any, **_k: Any) -> Any:
    raise RuntimeError("a fact check drew, served or reached the network")


def test_c4_no_fact_check_draws_serves_or_requests(monkeypatch: pytest.MonkeyPatch) -> None:
    import httpx

    for name in (
        "random",
        "randint",
        "choice",
        "choices",
        "shuffle",
        "sample",
        "seed",
        "getstate",
        "setstate",
        "randrange",
        "uniform",
    ):
        monkeypatch.setattr(random, name, _boom)
        monkeypatch.setattr(random.Random, name, _boom, raising=False)
    monkeypatch.setattr(selection, "pick_question", _boom)
    monkeypatch.setattr(store, "candidate_questions", _boom)
    monkeypatch.setattr(httpx.AsyncClient, "send", _boom)
    monkeypatch.setattr(httpx.Client, "send", _boom)
    for label in LABELS:
        worker.test_bank_fact(label)


def test_c4_no_router_or_draw_is_referenced_by_the_fact_module() -> None:
    src = inspect.getsource(worker)
    for banned in (
        "import random",
        "from random",
        "pick_question",
        "candidate_questions",
        "routers",
        "AsyncClient",
        "httpx",
        "client",
    ):
        assert banned not in src, banned


@pytest.mark.parametrize("seed", [0, 1, 7, 12345])
def test_c4_same_result_under_any_seed(
    seed: int, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    broken = fresh()
    _break_all_but_b9(broken)
    for bank in (COMMITTED, broken):
        random.seed(seed)
        first = [check_is_green(lab, bank, tmp_path, monkeypatch) for lab in LABELS]
        random.seed(seed + 1)
        second = [check_is_green(lab, bank, tmp_path, monkeypatch) for lab in LABELS]
        assert first == second
    assert first == [False] * 13 + [True]  # the broken bank: all but B9 red


# --- criterion 19: properties, not digests -----------------------------------


def _reword_capital(b: dict[str, Any]) -> None:
    q = q1(b, **CAP)
    q["prompt"] = q["prompt"].replace("What is the capital of", "Which city is the capital of")
    assert q["prompt"] != q1(COMMITTED, **CAP)["prompt"]


def _reverse(b: dict[str, Any]) -> None:
    b["questions"].reverse()


def _add_landmark(b: dict[str, Any]) -> None:
    b["questions"].append(
        {
            "id": "tester:t103-extra-landmark",
            "entityId": TX,
            "templateId": "tpl-landmark-in",
            "format": "multiple_choice",
            "prompt": "Which of these is in Texas?",
            "choices": ["The Alamo", "Gateway Arch", "Space Needle", "Mount Rushmore"],
            "correctIndex": 0,
            "level": 5,
            "topic": "landmark",
            "scope": "us",
            "entityType": "state",
            "region": "South Central",
            "ageBand": 1,
            "reveal": "none",
        }
    )


def _change_source(b: dict[str, Any]) -> None:
    b["_source"] = {"changed": "by the T-103 tester"}


@pytest.mark.parametrize(
    "edit",
    [_reword_capital, _reverse, _add_landmark, _change_source],
    ids=["reword-capital", "reverse-questions", "add-landmark", "change-source"],
)
def test_c19_an_edit_breaking_no_dependent_leaves_every_check_green(
    edit: Edit, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    bank = fresh()
    edit(bank)
    red = [lab for lab in LABELS if not check_is_green(lab, bank, tmp_path, monkeypatch)]
    assert red == []


def test_c19_no_hash_or_stored_copy_in_the_fact_module() -> None:
    tree = ast.parse(inspect.getsource(worker))
    imported = {
        alias.name.split(".")[0]
        for node in ast.walk(tree)
        if isinstance(node, ast.Import | ast.ImportFrom)
        for alias in (
            node.names if isinstance(node, ast.Import) else [ast.alias(node.module or "")]
        )
    }
    assert not imported & {"hashlib", "zlib", "binascii", "pickle", "subprocess"}, imported
    names = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)} | {
        n.attr for n in ast.walk(tree) if isinstance(n, ast.Attribute)
    }
    assert not names & {"sha256", "md5", "crc32", "hexdigest", "digest"}, names
    # every integer a fact function uses is one the criteria allow
    allowed = {0, 1, 2, 3, 4, 15, 16, 50, 51}
    for label in LABELS:
        fn_src = inspect.getsource(worker.FACTS[label])
        ints = {int(n) for n in re.findall(r"(?<![\w'\".])\d+(?![\w'\"])", fn_src)}
        assert ints <= allowed, (label, ints - allowed)


# Criteria 20-22 (what the diff touches) are checked by command in the
# Verdict, not here: `test_git_revision_guard.py` refuses `git diff` in a test.
