"""T-089, written by the `tester`: one test (or more) per acceptance criterion.

Expected values come from the brief's criteria, not from `selection.py`. Every
behavioural test runs on an inline fixture and asserts over many draws with an
injected `rng` (`test-guidelines.md`, "Randomness and time"). No network.

Byte-identity criteria are pinned by sha256 digests of the default branch
(`origin/main` at 2b4edb2) computed when this file was written, not by handing
`git` a revision at test time.
"""

from __future__ import annotations

import hashlib
import random
import subprocess
from pathlib import Path
from typing import Any

import pytest
import yaml

from app.selection import RECENT_WINDOW, pick_question

REPO = Path(__file__).resolve().parents[2]
DRAWS = 300


def q(qid: str, level: float, topic: str = "location", entity: str | None = None) -> dict[str, Any]:
    return {"id": qid, "entityId": entity or f"ent-{qid}", "level": level, "topic": topic}


def run(bank: list[dict[str, Any]], seed: int = 89089, **kwargs: Any) -> list[tuple[Any, bool]]:
    rng = random.Random(seed)
    return [pick_question(bank, rng=rng, **kwargs) for _ in range(DRAWS)]


def drawn_ids(bank: list[dict[str, Any]], **kwargs: Any) -> set[str]:
    return {question["id"] for question, _ in run(bank, **kwargs)}


# --- Criterion 1: unchanged inside span 6 ------------------------------------

WIDE_BANK = [
    q("a3", 3, "location"),
    q("a4", 4, "capital"),
    q("a5.5", 5.5, "location"),
    q("a7", 7, "capital"),
    q("a8", 8, "location"),
    q("a9.5", 9.5, "capital"),
    q("a10", 10, "location"),
]


def span_pool(bank: list[dict[str, Any]], level: float, topic: str, asked: set[str]) -> set[str]:
    """The pool criterion 1 names: the smallest of 1.5, 3, 6 holding any candidate."""
    cands = [b for b in bank if (topic == "mixed" or b["topic"] == topic) and b["id"] not in asked]
    for span in (1.5, 3.0, 6.0):
        pool = {b["id"] for b in cands if abs(b["level"] - level) <= span}
        if pool:
            return pool
    raise AssertionError("fixture case has no candidate within 6")


@pytest.mark.parametrize(
    ("level", "topic", "asked"),
    [
        (5.0, "mixed", set()),  # span 1.5: 4, 5.5
        (6.0, "mixed", set()),  # span 1.5 inclusive edge: 4.5..7.5
        (1.0, "mixed", set()),  # span 3 from below: 3, 4
        (0.0, "location", set()),  # span 3 inclusive edge: level 3 at distance 3.0
        (13.0, "mixed", set()),  # span 3: 10 only
        (15.5, "capital", set()),  # span 6: 9.5 at distance 6.0, inclusive
        (16.0, "location", set()),  # span 6 inclusive edge: 10 at distance 6.0
        (11.0, "mixed", {"a10", "a9.5"}),  # asked ones drop out, span widens to 3: 8
    ],
)
def test_criterion_1_inside_span_6_the_pool_is_the_smallest_non_empty_span(
    level: float, topic: str, asked: set[str]
) -> None:
    expected = span_pool(WIDE_BANK, level, topic, asked)
    picked = drawn_ids(WIDE_BANK, level=level, topic=topic, asked_ids=sorted(asked))
    assert picked == expected


# --- Criterion 2: existing selection tests unmodified -------------------------

#: sha256 of `backend/tests/test_selection.py` on the default branch (4281 bytes).
SELECTION_TESTS_ON_MAIN = "b6811b4042d0e1891a51f55e679239cae9b01e64461f4a060fa9df7667c21e95"
SELECTION_TESTS_ON_MAIN_LEN = 4281


def test_criterion_2_existing_selection_tests_are_byte_identical_prefix() -> None:
    data = (REPO / "backend/tests/test_selection.py").read_bytes()
    head = data[:SELECTION_TESTS_ON_MAIN_LEN]
    assert hashlib.sha256(head).hexdigest() == SELECTION_TESTS_ON_MAIN


# --- Criteria 3 and 4: the nearest fallback above the bank --------------------

ABOVE = [q("l3", 3), q("l8", 8), q("l10x", 10), q("l10y", 10)]


def test_criterion_3_above_the_bank_only_the_nearest_level_is_drawn() -> None:
    picked = drawn_ids(ABOVE, level=16.5)
    assert picked <= {"l10x", "l10y"}
    assert "l3" not in picked and "l8" not in picked


def test_criterion_3_general_rule_every_draw_is_at_the_minimum_distance() -> None:
    bank = [q("m2", 2), q("m4", 4), q("m5", 5), q("m5b", 5), q("m6", 6)]
    for level in (12.5, 13.0, 14.0, 18.0, 30.0):
        nearest = min(abs(b["level"] - level) for b in bank)
        assert nearest > 6.0
        for question, _ in run(bank, level=level):
            assert abs(question["level"] - level) == nearest


def test_criterion_4_both_tied_nearest_questions_are_drawn() -> None:
    assert drawn_ids(ABOVE, level=16.5) == {"l10x", "l10y"}


# --- Criterion 5: symmetric below the bank ------------------------------------


def test_criterion_5_below_the_bank_only_the_nearest_is_drawn() -> None:
    bank = [q("b7", 7), q("b7.5", 7.5), q("b12", 12)]
    assert drawn_ids(bank, level=0.0) == {"b7"}


# --- Criterion 6: the span-6 edge, both sides ---------------------------------


def test_criterion_6_at_distance_exactly_6_the_level_10_is_drawn() -> None:
    assert drawn_ids([q("e4", 4), q("e10", 10)], level=16.0) == {"e10"}


def test_criterion_6_just_past_6_the_level_10_is_drawn() -> None:
    assert drawn_ids([q("e4", 4), q("e10", 10)], level=16.5) == {"e10"}


def test_criterion_6_past_6_the_half_step_farther_one_is_never_drawn() -> None:
    assert drawn_ids([q("e9.5", 9.5), q("e10", 10)], level=16.5) == {"e10"}


# --- Criterion 7: asked questions are not candidates in the fallback ----------


def test_criterion_7_asked_question_is_skipped_in_the_fallback() -> None:
    bank = [q("f10", 10), q("f9.5", 9.5), q("f3", 3)]
    assert drawn_ids(bank, level=16.5, asked_ids=["f10"]) == {"f9.5"}


# --- Criterion 8: topic filter holds in the fallback --------------------------


def test_criterion_8_single_topic_fallback_ignores_other_topics() -> None:
    bank = [q("t-loc10", 10, "location"), q("t-cap9", 9, "capital"), q("t-cap3", 3, "capital")]
    picks = run(bank, level=16.5, topic="capital")
    assert {question["id"] for question, _ in picks} == {"t-cap9"}


def test_criterion_8_mixed_fallback_draws_both_topics_at_the_nearest_distance() -> None:
    bank = [
        q("x-loc10", 10, "location"),
        q("x-cap10", 10, "capital"),
        q("x-cap9", 9, "capital"),
        q("x-loc3", 3, "location"),
    ]
    picks = run(bank, level=16.5, topic="mixed")
    assert {question["id"] for question, _ in picks} == {"x-loc10", "x-cap10"}
    assert {question["topic"] for question, _ in picks} == {"location", "capital"}


# --- Criterion 9: the fallback is not a review --------------------------------


def test_criterion_9_fallback_reports_is_review_false() -> None:
    picks = run(ABOVE, level=16.5)
    assert all(is_review is False for _, is_review in picks)
    # Also on an index that is not a review turn but follows one.
    picks = run(ABOVE, level=16.5, index=7, review_entity_ids=["ent-l3"])
    assert all(is_review is False for _, is_review in picks)


# --- Criterion 10: recycling unchanged ---------------------------------------


def test_criterion_10_all_asked_repeats_but_never_the_last_six() -> None:
    bank = [q(f"r{n}", 3 + n * 0.5) for n in range(9)]  # levels 3..7
    asked = [b["id"] for b in bank]
    last_six = set(asked[-RECENT_WINDOW:])
    assert RECENT_WINDOW == 6
    for level in (0.0, 5.0, 16.5):
        picked = drawn_ids(bank, level=level, asked_ids=asked)
        assert picked == {"r0", "r1", "r2"}
        assert not picked & last_six


def test_criterion_10_all_asked_respects_the_topic() -> None:
    capitals = [q(f"c{n}", 3 + n, "capital") for n in range(8)]
    bank = [*capitals, q("l1", 10, "location")]
    asked = ["l1", *(c["id"] for c in capitals)]  # last six: c2..c7
    picked = drawn_ids(bank, level=16.5, topic="capital", asked_ids=asked)
    assert picked == {"c0", "c1"}


def test_criterion_10_none_only_for_an_empty_bank() -> None:
    assert pick_question([], level=16.5) == (None, False)
    tiny = [q("only", 3)]
    for question, _ in run(tiny, level=16.5, asked_ids=["only"]):
        assert question is not None


# --- Criterion 11: review wins whatever the level -----------------------------


def test_criterion_11_review_turn_at_16_5_with_level_3_queue_is_a_review() -> None:
    bank = [
        q("rv-a", 3, "location", entity="queued"),
        q("rv-b", 3, "capital", entity="queued"),
        q("hi10", 10, "location"),
    ]
    picks = run(bank, level=16.5, index=6, review_entity_ids=["queued"])
    assert all(is_review is True for _, is_review in picks)
    assert {question["entityId"] for question, _ in picks} == {"queued"}
    forced = run(bank, level=16.5, index=2, force_review=True, review_entity_ids=["queued"])
    assert all(is_review is True for _, is_review in forced)
    assert {question["entityId"] for question, _ in forced} == {"queued"}


# --- Criterion 12: no stale references to the client selector file -------------------------

#: Built from parts so this file does not itself contain the string.
STALE = "lib/" + "session.ts"
ALLOWED_PREFIXES = ("tasks.md", "tasks/", "runs/", "PROGRESS.md", "engineering-decisions.md")


def test_criterion_12_no_tracked_file_names_lib_session_ts_outside_the_allowed() -> None:
    proc = subprocess.run(["git", "ls-files", "-z"], cwd=REPO, capture_output=True, check=True)
    hits = []
    for name in proc.stdout.decode().split("\0"):
        if not name or name.startswith(ALLOWED_PREFIXES):
            continue
        path = REPO / name
        if not path.is_file():
            continue
        if STALE.encode() in path.read_bytes():
            hits.append(name)
    assert hits == []
    assert not (REPO / "frontend/src" / STALE).exists()


# --- Criterion 13: E-28, and E-1..E-27 untouched ------------------------------

#: sha256 of `engineering-decisions.md` on the default branch (115324 bytes).
DECISIONS_ON_MAIN = "5d033ac59c3e422e601fb7dc40720cf5d74b3e792bd24f788841bebb4d8a2dac"
DECISIONS_ON_MAIN_LEN = 115324


def decisions() -> str:
    return (REPO / "engineering-decisions.md").read_text(encoding="utf-8")


def e28() -> str:
    text = decisions()
    start = text.index("\n## E-28 ")
    nxt = text.find("\n## ", start + 1)
    return text[start : nxt if nxt != -1 else len(text)]


def test_criterion_13_e1_to_e27_are_byte_identical() -> None:
    data = (REPO / "engineering-decisions.md").read_bytes()
    assert hashlib.sha256(data[:DECISIONS_ON_MAIN_LEN]).hexdigest() == DECISIONS_ON_MAIN
    assert data[DECISIONS_ON_MAIN_LEN:].startswith(b"\n## E-28 ")


def test_criterion_13_exactly_one_new_entry_numbered_gap_free() -> None:
    import re

    numbers = [int(n) for n in re.findall(r"^## E-(\d+) ", decisions(), flags=re.M)]
    assert numbers == list(range(1, 31))  # T-070 adds E-30 (branch head; row W53)
    assert numbers.count(28) == 1


def test_criterion_13_e28_names_t089_and_states_a_to_d() -> None:
    body = " ".join(e28().split())
    assert "T-089" in body
    # (a) the fallback rule: smallest distance, ties included, past 6
    assert "smallest distance" in body and "ties included" in body and "within 6" in body
    # (b) answers E-26's finding
    assert "E-26" in body and "rows 14.5 to 18" in body and "first span is 99" in body
    # (c) no client copy
    assert "frontend/src/" + STALE in body and "pickQuestion()" in body
    assert "not in this repository" in body
    # (d) a 99 now reads as nearest candidates, not whole topic
    assert "measure_selection.py" in body and "table A" in body
    assert "nearest candidates" in body and "whole topic" in body


# --- Criterion 14: measure_selection untouched -------------------------------


@pytest.mark.parametrize(
    ("path", "digest"),
    [
        (
            "backend/scripts/measure_selection.py",
            "4e243bffb845b8f96497f3909948a8a6b0436f777f1566cff4de1679ded52e94",
        ),
        (
            "backend/tests/test_measure_selection.py",
            "6a06df5158156a5da12d72269d89b866191914e8b7e30292b0dd3dbdcd8779d8",
        ),
    ],
)
def test_criterion_14_measure_selection_files_byte_identical(path: str, digest: str) -> None:
    assert hashlib.sha256((REPO / path).read_bytes()).hexdigest() == digest


# --- Criterion 15: openapi.yaml ------------------------------------------------

# T-051 deleted the structure pin on `openapi.yaml` and the content.json sha pin
# (criterion 17): both guarded T-089's own diff (approved Test change request
# rows 27 and 28).


def spec() -> dict[str, Any]:
    return yaml.safe_load((REPO / "openapi.yaml").read_text(encoding="utf-8"))


def operation(doc: dict[str, Any], op_id: str) -> dict[str, Any]:
    for ops in doc["paths"].values():
        for op in ops.values():
            if isinstance(op, dict) and op.get("operationId") == op_id:
                return op
    raise AssertionError(op_id)


def test_criterion_15_serve_next_description_says_nearest_fresh() -> None:
    text = " ".join(operation(spec(), "serveNextQuestion")["description"].split())
    assert "nearest" in text
    assert "nearest the session level" in text
    assert "fresh" in text and "widest difficulty window" in text


# --- Criterion 18: no migration added ----------------------------------------


def test_criterion_18_only_the_initial_migration_exists() -> None:
    versions = sorted(p.name for p in (REPO / "backend/migrations/versions").glob("*.py"))
    assert versions == ["0001_initial_schema.py"]
