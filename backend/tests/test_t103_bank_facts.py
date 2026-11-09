"""T-103 worker: one check per bank fact T-102's draw survey rests on.

T-102 (PR #126) showed that many router-serving tests pass under any draw only
because of facts about the committed `app/data/content.json`. Each fact here is
a pure function from a parsed bank to a list of violations: an empty list means
the fact holds. `test_bank_fact` runs each one against the committed bank,
read from disk, as its own parametrised case whose node ID carries the fact's
label (`test_bank_fact[B8c]`). On failure it lists every test whose "holds
under any draw" argument needs that fact (`DEPENDENTS`, the brief's "Facts and
their dependents" table). A bank change that breaks a fact therefore fails
here, every run, by name, instead of making those tests flaky.

The checks assert properties and the bounds the dependents need (51, 16, "at
least one"), never today's counts, ids or a digest of the file (P-17). Nothing
here makes an HTTP request, calls a router, draws, or touches `random`.

To run one fact against an edited bank: `assert_fact("B8c", edited_bank)`
raises the same `AssertionError`, naming the same dependents, that the pytest
case does. Edge cases for each fact are in `test_t103_bank_fact_edges.py`.
"""

from __future__ import annotations

import ast
import json
import re
from collections import Counter
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest

from app import store

Bank = dict[str, Any]

CHOICE_FORMATS = frozenset({"map_identify", "multiple_choice"})
TEXAS = "us-state-tx"
#: DC's FIPS code. Not a state, so no entity may carry it; tests tap it as a
#: key no question can have.
NOT_A_STATE_GEOMETRY = "11"
#: B8c: with at most this many non-`map_click` location questions plus the 8
#: review slots at serve indices 6, 13, ..., 55, serve 60 at the latest is a
#: `map_click`. Also covers the 100-serve loop, since 51 + 14 < 100.
MAX_LOCATION_NON_CLICK = 51
#: B8d: the serves `test_c46_a_new_topic_session_serves_only_that_topic_outside_review` makes.
NEWER_TOPICS = ("superlative", "wildlife", "landmark", "climate", "agriculture")
MIN_NEWER_TOPIC_SIZE = 16
REVEAL_BY_TOPIC_MAP = frozenset({"location", "superlative"})
EXPLANATION_FIELDS = ("shortExplanation", "detailExplanation")
CHOICE_ONLY_FIELDS = ("choices", "correctIndex", "highlightGeometryId")

_TWO_DIGITS = re.compile(r"[0-9]{2}")


def load_bank(path: Path | None = None) -> Bank:
    """The bank the server loads by default (`store.CONTENT_FILE`), read from disk."""
    return json.loads((path or store.CONTENT_FILE).read_text(encoding="utf-8"))


def _questions(bank: Bank) -> list[dict[str, Any]]:
    return list(bank.get("questions", []))


def _entities(bank: Bank) -> list[dict[str, Any]]:
    return list(bank.get("entities", []))


def _qid(question: dict[str, Any]) -> str:
    return str(question.get("id", "<question without id>"))


def _entity_geometry(bank: Bank) -> dict[str, Any]:
    return {e.get("id"): e.get("geometryId") for e in _entities(bank)}


def _present(value: Any) -> bool:
    return value is not None


# --- the facts ---------------------------------------------------------------


def b1_entities_exist_and_can_be_shown(bank: Bank) -> list[str]:
    """Every question's entity exists; every entity has a name, geometry and fun fact."""
    problems: list[str] = []
    ids = {e.get("id") for e in _entities(bank)}
    for q in _questions(bank):
        if q.get("entityId") not in ids:
            problems.append(f"{_qid(q)}: entityId {q.get('entityId')!r} names no entity")
    for e in _entities(bank):
        for field in ("name", "geometryId", "funFact"):
            value = e.get(field)
            if not isinstance(value, str) or value == "":
                problems.append(f"entity {e.get('id')!r}: {field} is {value!r}")
    return problems


def b2_choice_questions_are_well_formed(bank: Bank) -> list[str]:
    """Every choice question has exactly four distinct choices and a key in range."""
    problems: list[str] = []
    for q in _questions(bank):
        if q.get("format") not in CHOICE_FORMATS:
            continue
        choices = q.get("choices")
        if not isinstance(choices, list) or len(choices) != 4:
            count = len(choices) if isinstance(choices, list) else choices
            problems.append(f"{_qid(q)}: choices is not a list of 4 (got {count!r})")
        elif len(set(map(json.dumps, choices))) != 4:
            problems.append(f"{_qid(q)}: choices are not distinct: {choices!r}")
        key = q.get("correctIndex")
        if isinstance(key, bool) or not isinstance(key, int) or not 0 <= key <= 3:
            problems.append(f"{_qid(q)}: correctIndex is {key!r}, not 0-3")
    return problems


def b3a_map_click_keys_are_state_geometries(bank: Bank) -> list[str]:
    """Every `map_click` key is two digits naming some entity's geometry, never "11"."""
    problems: list[str] = []
    geometries = {e.get("geometryId") for e in _entities(bank)}
    for e in _entities(bank):
        if e.get("geometryId") == NOT_A_STATE_GEOMETRY:
            problems.append(f"entity {e.get('id')!r}: geometryId is {NOT_A_STATE_GEOMETRY!r} (DC)")
    for q in _questions(bank):
        if q.get("format") != "map_click":
            continue
        key = q.get("answerGeometryId")
        if not isinstance(key, str) or not _TWO_DIGITS.fullmatch(key):
            problems.append(f"{_qid(q)}: answerGeometryId {key!r} is not two digits")
        elif key == NOT_A_STATE_GEOMETRY:
            problems.append(f"{_qid(q)}: answerGeometryId is {NOT_A_STATE_GEOMETRY!r} (DC)")
        elif key not in geometries:
            problems.append(f"{_qid(q)}: answerGeometryId {key!r} is no entity's geometry")
    return problems


def b3b_map_click_has_no_choice_fields(bank: Bank) -> list[str]:
    """A `map_click` question carries no `choices`, `correctIndex` or `highlightGeometryId`."""
    return [
        f"{_qid(q)}: map_click question has {field}"
        for q in _questions(bank)
        if q.get("format") == "map_click"
        for field in CHOICE_ONLY_FIELDS
        if field in q
    ]


def b3c_thirteen_is_never_a_texas_key(bank: Bank) -> list[str]:
    """No question about Texas has `answerGeometryId` "13"."""
    return [
        f"{_qid(q)}: a Texas question keyed to '13'"
        for q in _questions(bank)
        if q.get("entityId") == TEXAS and q.get("answerGeometryId") == "13"
    ]


def b4_no_explanation_fields(bank: Bank) -> list[str]:
    """No question carries `shortExplanation` or `detailExplanation`."""
    return [
        f"{_qid(q)}: has {field}"
        for q in _questions(bank)
        for field in EXPLANATION_FIELDS
        if field in q
    ]


def b5_highlight_is_the_questions_own_state(bank: Bank) -> list[str]:
    """The first present of highlight, answer and entity geometry is the entity geometry.

    A question whose entity is missing is B1's failure, not this one's, so it
    is skipped here.
    """
    problems: list[str] = []
    geometry_of = _entity_geometry(bank)
    for q in _questions(bank):
        if q.get("entityId") not in geometry_of:
            continue
        own = geometry_of[q.get("entityId")]
        for field in ("highlightGeometryId", "answerGeometryId"):
            if _present(q.get(field)):
                if q[field] != own:
                    problems.append(f"{_qid(q)}: {field} {q[field]!r} is not its state's {own!r}")
                break
    return problems


def b6_reveal_by_topic(bank: Bank) -> list[str]:
    """`map_highlight` for location and superlative, `none` for every other topic."""
    problems: list[str] = []
    for q in _questions(bank):
        want = "map_highlight" if q.get("topic") in REVEAL_BY_TOPIC_MAP else "none"
        if q.get("reveal") != want:
            problems.append(
                f"{_qid(q)}: topic {q.get('topic')!r} has reveal {q.get('reveal')!r}, want {want!r}"
            )
    return problems


def b7_no_prompt_says_review(bank: Bank) -> list[str]:
    """No prompt contains "review" in any letter case."""
    return [
        f"{_qid(q)}: prompt {q.get('prompt')!r} says review"
        for q in _questions(bank)
        if "review" in str(q.get("prompt", "")).casefold()
    ]


def _per_entity(bank: Bank, topic: str, fmt: str) -> Counter[Any]:
    return Counter(
        q.get("entityId")
        for q in _questions(bank)
        if q.get("topic") == topic and q.get("format") == fmt
    )


def b8a_location_is_one_identify_and_one_click_per_state(bank: Bank) -> list[str]:
    """Every location question is `map_identify` or `map_click`; each entity has one of each."""
    problems: list[str] = []
    for q in _questions(bank):
        if q.get("topic") == "location" and q.get("format") not in ("map_identify", "map_click"):
            problems.append(f"{_qid(q)}: location question has format {q.get('format')!r}")
    for fmt in ("map_identify", "map_click"):
        counts = _per_entity(bank, "location", fmt)
        for e in _entities(bank):
            n = counts[e.get("id")]
            if n != 1:
                problems.append(f"entity {e.get('id')!r}: {n} location {fmt} questions, want 1")
    return problems


def b8b_capital_is_one_multiple_choice_per_state(bank: Bank) -> list[str]:
    """Every capital question is `multiple_choice`; each entity has exactly one."""
    problems: list[str] = []
    for q in _questions(bank):
        if q.get("topic") == "capital" and q.get("format") != "multiple_choice":
            problems.append(f"{_qid(q)}: capital question has format {q.get('format')!r}")
    counts = Counter(q.get("entityId") for q in _questions(bank) if q.get("topic") == "capital")
    for e in _entities(bank):
        n = counts[e.get("id")]
        if n != 1:
            problems.append(f"entity {e.get('id')!r}: {n} capital questions, want 1")
    return problems


def b8c_a_map_click_arrives_in_time(bank: Bank) -> list[str]:
    """Location holds a `map_click`, and at most 51 questions that are not."""
    problems: list[str] = []
    location = [q for q in _questions(bank) if q.get("topic") == "location"]
    clicks = sum(1 for q in location if q.get("format") == "map_click")
    others = len(location) - clicks
    if clicks < 1:
        problems.append("the location topic holds no map_click question")
    if others > MAX_LOCATION_NON_CLICK:
        problems.append(
            f"the location topic holds {others} non-map_click questions, "
            f"more than {MAX_LOCATION_NON_CLICK}"
        )
    return problems


def b8d_newer_topics_are_choice_only_and_big_enough(bank: Bank) -> list[str]:
    """The five newer topics are all `multiple_choice` and hold at least 16 each."""
    problems: list[str] = []
    for topic in NEWER_TOPICS:
        rows = [q for q in _questions(bank) if q.get("topic") == topic]
        if len(rows) < MIN_NEWER_TOPIC_SIZE:
            problems.append(f"topic {topic!r} holds {len(rows)}, fewer than {MIN_NEWER_TOPIC_SIZE}")
        problems += [
            f"{_qid(q)}: {topic} question has format {q.get('format')!r}"
            for q in rows
            if q.get("format") != "multiple_choice"
        ]
    return problems


def b9_texas_has_a_question(bank: Bank) -> list[str]:
    """At least one question is about Texas."""
    if any(q.get("entityId") == TEXAS for q in _questions(bank)):
        return []
    return [f"no question has entityId {TEXAS!r}"]


FACTS: dict[str, Callable[[Bank], list[str]]] = {
    "B1": b1_entities_exist_and_can_be_shown,
    "B2": b2_choice_questions_are_well_formed,
    "B3a": b3a_map_click_keys_are_state_geometries,
    "B3b": b3b_map_click_has_no_choice_fields,
    "B3c": b3c_thirteen_is_never_a_texas_key,
    "B4": b4_no_explanation_fields,
    "B5": b5_highlight_is_the_questions_own_state,
    "B6": b6_reveal_by_topic,
    "B7": b7_no_prompt_says_review,
    "B8a": b8a_location_is_one_identify_and_one_click_per_state,
    "B8b": b8b_capital_is_one_multiple_choice_per_state,
    "B8c": b8c_a_map_click_arrives_in_time,
    "B8d": b8d_newer_topics_are_choice_only_and_big_enough,
    "B9": b9_texas_has_a_question,
}

# --- who depends on each fact -------------------------------------------------
# The brief's dependents table, T-102's survey rows, full names spelled out.

_SESSIONS = "test_sessions_api.py"
_T053 = "test_t053_tester_criteria.py"
_T093 = "test_t093_tester_criteria.py"

_ROW_26 = ("test_content_build.py", "test_reveals")
_ROW_27 = ("test_content_build.py", "test_a_perfect_session_reaches_every_question_once")
_ROW_29 = (
    "test_t026_tester_criteria.py",
    "test_c46_a_new_topic_session_serves_only_that_topic_outside_review",
)
_ROW_30 = ("test_t026_topics.py", "test_a_correct_superlative_answer_highlights_the_answer_state")
_ROW_31 = (
    "test_t040_tester_criteria.py",
    "test_c20_c21_c25_a_perfect_topic_session_covers_each_state_once_with_its_reveal",
)
_ROWS_44_45 = (
    ("test_t051_map_click.py", "test_a_right_tap_is_correct_and_names_the_state"),
    ("test_t051_map_click.py", "test_a_wrong_tap_queues_the_state_and_can_be_undone"),
)
_ROW_3 = (_SESSIONS, "test_a_topic_filters_every_question_served")
_ROW_64 = (_T053, "test_c14_a_withheld_choice_question_grades_against_the_stored_key")
_ROW_65 = (_T053, "test_c14_a_withheld_map_click_question_grades_against_the_stored_key")
_ROW_71 = (_T093, "test_c5_undoing_a_review_round_answer_restores_the_seen_list")
_ROW_81 = (
    "test_t093_undo_places_seen.py",
    "test_undoing_a_review_round_answer_restores_the_seen_list",
)

#: B2's list in table order; B3a/B3b drop rows 3, 29 and 64 from it.
_B2 = (
    _ROW_3,
    (_SESSIONS, "test_a_question_can_be_served_without_its_answer_key"),
    (_SESSIONS, "test_a_correct_answer_returns_the_reward_and_the_key"),
    (_SESSIONS, "test_a_wrong_answer_returns_the_reason_and_queues_the_entity"),
    (_SESSIONS, "test_answering_the_same_question_twice_is_refused"),
    (_SESSIONS, "test_an_answer_with_no_choice_cannot_be_graded"),
    (_SESSIONS, "test_three_wrong_in_a_row_drops_the_level_without_a_message"),
    (_SESSIONS, "test_the_same_answer_cannot_be_undone_twice"),
    (_SESSIONS, "test_only_the_most_recent_answer_can_be_undone"),
    (_SESSIONS, "test_ending_twice_returns_the_same_summary"),
    _ROW_29,
    ("test_t053_answer_key_default.py", "test_session_serves_withhold_unless_asked"),
    (_T053, "test_c9_next_question_with_true_is_carried"),
    (_T053, "test_c12_a_re_serve_follows_the_request_not_the_first_serve"),
    (_T053, "test_c12_re_serve_of_the_start_sessions_first_question_can_opt_in"),
    _ROW_64,
    _ROW_71,
    _ROW_81,
)
_B3 = tuple(t for t in _B2 if t not in (_ROW_3, _ROW_29, _ROW_64)) + _ROWS_44_45 + (_ROW_65,)

DEPENDENTS: dict[str, tuple[tuple[str, str], ...]] = {
    "B1": (
        (_SESSIONS, "test_starting_a_session_serves_the_first_question"),
        (_SESSIONS, "test_the_first_question_carries_its_entity_for_the_map"),
        _ROW_26,
        _ROW_31,
        *_ROWS_44_45,
    ),
    "B2": _B2,
    "B3a": _B3,
    "B3b": _B3,
    "B3c": (_ROW_71,),
    "B4": (_ROW_26,),
    "B5": (_ROW_26, _ROW_30, _ROW_31, *_ROWS_44_45),
    "B6": (_ROW_26, _ROW_30, _ROW_31),
    "B7": ((_SESSIONS, "test_a_review_question_is_not_labelled_to_the_kid"),),
    "B8a": (_ROW_27, _ROW_31),
    "B8b": (_ROW_27, _ROW_31, _ROW_3, _ROW_64),
    "B8c": (*_ROWS_44_45, _ROW_65),
    "B8d": (_ROW_29,),
    "B9": (
        (_SESSIONS, "test_a_review_round_serves_from_the_queue"),
        (_T053, "test_c8_force_review_without_flag_is_withheld"),
        (_T053, "test_c11_review_round_serves_withheld"),
        _ROW_71,
        (_T093, "test_c7_undo_of_a_review_round_answer_restores_review_round_remaining"),
        _ROW_81,
    ),
}


def failure_message(label: str, problems: list[str], *, shown: int = 20) -> str:
    """What a failing fact check prints: the fact, its dependents, then the problems."""
    lines = [
        f"bank fact {label} ({FACTS[label].__doc__.splitlines()[0]}) is broken.",
        "These tests rely on it to pass under any draw, and may now fail at random:",
        *(f"  - tests/{file}::{name}" for file, name in DEPENDENTS[label]),
        f"{len(problems)} problem(s) in the bank:",
        *(f"  * {p}" for p in problems[:shown]),
    ]
    if len(problems) > shown:
        lines.append(f"  * ... and {len(problems) - shown} more")
    return "\n".join(lines)


def assert_fact(label: str, bank: Bank) -> None:
    """Raise `AssertionError` naming the dependents if fact `label` fails on `bank`."""
    problems = FACTS[label](bank)
    assert not problems, failure_message(label, problems)


# --- the checks ---------------------------------------------------------------

TESTS_DIR = Path(__file__).resolve().parent


@pytest.mark.parametrize("label", list(FACTS), ids=list(FACTS))
def test_bank_fact(label: str) -> None:
    assert_fact(label, load_bank())


def _test_functions(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    return {
        node.name
        for node in ast.walk(tree)
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef)
        and node.name.startswith("test_")
    }


def test_every_named_dependent_is_a_real_test() -> None:
    """A renamed or deleted dependent would make a failure message point nowhere."""
    assert set(DEPENDENTS) == set(FACTS)
    missing = [
        f"{file}::{name} (dependent of {label})"
        for label, deps in DEPENDENTS.items()
        for file, name in deps
        if name not in _test_functions(TESTS_DIR / file)
    ]
    assert not missing, missing
