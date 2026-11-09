"""T-103 worker: both sides of each bank fact's edge, on edited copies of the bank.

Each case makes one edit to a deep copy of the committed bank and runs one
fact from `tests/test_t103_bank_facts.py` on it, expecting red (the fact reports a
problem) or green. The edits are the ones the brief's criteria 5-19 name. A red
case also checks that the failure message names every dependent of the fact.
"""

from __future__ import annotations

import copy
from collections.abc import Callable
from typing import Any

import pytest

from tests.test_t103_bank_facts import DEPENDENTS, FACTS, TEXAS, Bank, failure_message, load_bank

_COMMITTED = load_bank()


def _qs(bank: Bank, **match: Any) -> list[dict[str, Any]]:
    return [q for q in bank["questions"] if all(q.get(k) == v for k, v in match.items())]


def _q(bank: Bank, **match: Any) -> dict[str, Any]:
    return _qs(bank, **match)[0]


def _entity(bank: Bank, entity_id: str) -> dict[str, Any]:
    return next(e for e in bank["entities"] if e["id"] == entity_id)


def _other_geometry(bank: Bank, entity_id: str) -> str:
    return next(e["geometryId"] for e in bank["entities"] if e["id"] != entity_id)


def _add_copies(bank: Bank, rows: list[dict[str, Any]], n: int) -> None:
    for i in range(n):
        row = copy.deepcopy(rows[i % len(rows)])
        row["id"] = f"{row['id']}#t103-copy-{i}"
        bank["questions"].append(row)


def _set_topic_size(bank: Bank, topic: str, n: int) -> None:
    rows = _qs(bank, topic=topic)
    keep = {id(q) for q in rows[:n]}
    bank["questions"] = [q for q in bank["questions"] if q.get("topic") != topic or id(q) in keep]
    if len(rows) < n:
        _add_copies(bank, rows, n - len(rows))


def _set_location_non_click(bank: Bank, n: int) -> None:
    others = [q for q in _qs(bank, topic="location") if q["format"] != "map_click"]
    keep = {id(q) for q in others[:n]}
    bank["questions"] = [
        q
        for q in bank["questions"]
        if q.get("topic") != "location" or q["format"] == "map_click" or id(q) in keep
    ]
    if len(others) < n:
        _add_copies(bank, others, n - len(others))


def _mc(b: Bank) -> dict[str, Any]:
    return _q(b, format="multiple_choice")


def _click(b: Bank) -> dict[str, Any]:
    return _q(b, format="map_click")


def _drop(row: dict[str, Any], key: str) -> None:
    del row[key]


Edit = Callable[[Bank], None]

CASES: list[tuple[str, str, bool, Edit]] = [
    # B1
    ("B1", "committed", False, lambda b: None),
    ("B1", "unknown-entityId", True, lambda b: b["questions"][0].update(entityId="us-state-zz")),
    ("B1", "funFact-removed", True, lambda b: _drop(b["entities"][0], "funFact")),
    ("B1", "funFact-empty", True, lambda b: b["entities"][0].update(funFact="")),
    ("B1", "name-removed", True, lambda b: _drop(b["entities"][0], "name")),
    ("B1", "name-empty", True, lambda b: b["entities"][0].update(name="")),
    ("B1", "geometryId-removed", True, lambda b: _drop(b["entities"][0], "geometryId")),
    ("B1", "geometryId-empty", True, lambda b: b["entities"][0].update(geometryId="")),
    # B2
    (
        "B2",
        "three-choices",
        True,
        lambda b: _mc(b).update(choices=_mc(b)["choices"][:3], correctIndex=0),
    ),
    ("B2", "five-choices", True, lambda b: _mc(b)["choices"].append("Atlantis")),
    ("B2", "two-equal", True, lambda b: _mc(b)["choices"].__setitem__(1, _mc(b)["choices"][0])),
    ("B2", "key-4", True, lambda b: _mc(b).update(correctIndex=4)),
    ("B2", "key-minus-1", True, lambda b: _mc(b).update(correctIndex=-1)),
    ("B2", "key-missing", True, lambda b: _drop(_mc(b), "correctIndex")),
    ("B2", "key-0", False, lambda b: _mc(b).update(correctIndex=0)),
    ("B2", "key-3", False, lambda b: _mc(b).update(correctIndex=3)),
    ("B2", "identify-key-4", True, lambda b: _q(b, format="map_identify").update(correctIndex=4)),
    # B3a
    ("B3a", "key-11", True, lambda b: _click(b).update(answerGeometryId="11")),
    ("B3a", "key-1", True, lambda b: _click(b).update(answerGeometryId="1")),
    ("B3a", "key-99", True, lambda b: _click(b).update(answerGeometryId="99")),
    ("B3a", "key-missing", True, lambda b: _drop(_click(b), "answerGeometryId")),
    (
        "B3a",
        "entity-and-key-both-11",
        True,
        lambda b: (
            _entity(b, _click(b)["entityId"]).update(geometryId="11"),
            _click(b).update(answerGeometryId="11"),
        ),
    ),
    # B3b
    ("B3b", "gains-choices", True, lambda b: _click(b).update(choices=["a", "b", "c", "d"])),
    ("B3b", "gains-correctIndex", True, lambda b: _click(b).update(correctIndex=0)),
    (
        "B3b",
        "gains-highlightGeometryId",
        True,
        lambda b: _click(b).update(highlightGeometryId=_click(b)["answerGeometryId"]),
    ),
    # B3c
    (
        "B3c",
        "texas-click-13",
        True,
        lambda b: _q(b, entityId=TEXAS, format="map_click").update(answerGeometryId="13"),
    ),
    ("B3c", "georgia-click-13", False, lambda b: None),
    # B4
    ("B4", "gains-shortExplanation", True, lambda b: _mc(b).update(shortExplanation="x")),
    ("B4", "gains-detailExplanation", True, lambda b: _mc(b).update(detailExplanation="x")),
    # B5
    (
        "B5",
        "highlight-other-state",
        True,
        lambda b: _q(b, format="map_identify").update(
            highlightGeometryId=_other_geometry(b, _q(b, format="map_identify")["entityId"])
        ),
    ),
    (
        "B5",
        "click-key-other-state",
        True,
        lambda b: _click(b).update(answerGeometryId=_other_geometry(b, _click(b)["entityId"])),
    ),
    ("B5", "mc-with-neither-field", False, lambda b: None),
    # B6
    ("B6", "location-none", True, lambda b: _q(b, topic="location").update(reveal="none")),
    ("B6", "superlative-none", True, lambda b: _q(b, topic="superlative").update(reveal="none")),
    (
        "B6",
        "capital-map_highlight",
        True,
        lambda b: _q(b, topic="capital").update(reveal="map_highlight"),
    ),
    # B7
    ("B7", "lower-review", True, lambda b: _mc(b).update(prompt=_mc(b)["prompt"] + " review")),
    ("B7", "title-Review", True, lambda b: _mc(b).update(prompt="Review: " + _mc(b)["prompt"])),
    ("B7", "revie", False, lambda b: _mc(b).update(prompt=_mc(b)["prompt"] + " revie")),
    ("B7", "view", False, lambda b: _mc(b).update(prompt=_mc(b)["prompt"] + " view")),
    # B8a
    (
        "B8a",
        "second-identify",
        True,
        lambda b: _add_copies(b, [_q(b, topic="location", format="map_identify")], 1),
    ),
    (
        "B8a",
        "click-removed",
        True,
        lambda b: b["questions"].remove(_q(b, topic="location", format="map_click")),
    ),
    (
        "B8a",
        "location-mc",
        True,
        lambda b: _q(b, topic="location", format="map_identify").update(format="multiple_choice"),
    ),
    # B8b
    ("B8b", "second-capital", True, lambda b: _add_copies(b, [_q(b, topic="capital")], 1)),
    ("B8b", "capital-removed", True, lambda b: b["questions"].remove(_q(b, topic="capital"))),
    (
        "B8b",
        "capital-identify",
        True,
        lambda b: _q(b, topic="capital").update(format="map_identify"),
    ),
    # B8c
    ("B8c", "51-non-click", False, lambda b: _set_location_non_click(b, 51)),
    ("B8c", "52-non-click", True, lambda b: _set_location_non_click(b, 52)),
    (
        "B8c",
        "no-click",
        True,
        lambda b: b.update(questions=[q for q in b["questions"] if q.get("format") != "map_click"]),
    ),
    # B8d
    ("B8d", "landmark-16", False, lambda b: _set_topic_size(b, "landmark", 16)),
    ("B8d", "landmark-15", True, lambda b: _set_topic_size(b, "landmark", 15)),
    (
        "B8d",
        "wildlife-map_click",
        True,
        lambda b: _q(b, topic="wildlife").update(format="map_click"),
    ),
    # B9
    (
        "B9",
        "no-texas",
        True,
        lambda b: b.update(questions=[q for q in b["questions"] if q.get("entityId") != TEXAS]),
    ),
    (
        "B9",
        "one-texas",
        False,
        lambda b: b.update(
            questions=[q for q in b["questions"] if q.get("entityId") != TEXAS]
            + [_q(b, entityId=TEXAS)]
        ),
    ),
]


@pytest.mark.parametrize(
    ("label", "edit", "red"),
    [(label, edit, red) for label, _, red, edit in CASES],
    ids=[f"{label}-{'red' if red else 'green'}-{name}" for label, name, red, _ in CASES],
)
def test_one_edit_turns_one_fact_red_or_leaves_it_green(label: str, edit: Edit, red: bool) -> None:
    bank = copy.deepcopy(_COMMITTED)
    edit(bank)
    problems = FACTS[label](bank)
    assert bool(problems) is red, problems
    if red:
        message = failure_message(label, problems)
        for file, name in DEPENDENTS[label]:
            assert file in message and name in message, (file, name)


def test_georgia_is_keyed_to_13_and_is_not_texas() -> None:
    """B3c's green case only means something if a non-Texas question really holds "13"."""
    keyed_13 = _qs(_COMMITTED, answerGeometryId="13")
    assert keyed_13 and all(q["entityId"] != TEXAS for q in keyed_13)


def test_some_multiple_choice_question_has_neither_geometry_field() -> None:
    """B5's green case only means something if such a question exists."""
    assert any(
        "highlightGeometryId" not in q and "answerGeometryId" not in q
        for q in _qs(_COMMITTED, format="multiple_choice")
    )


def _reword_a_capital_prompt(b: Bank) -> None:
    q = _q(b, topic="capital")
    q["prompt"] = "Which city is the capital here?"


def _add_a_landmark_question(b: Bank) -> None:
    b["questions"].append(
        {
            "id": "t103:extra-landmark",
            "entityId": TEXAS,
            "templateId": "tpl-t103-extra",
            "format": "multiple_choice",
            "prompt": "Which of these is a landmark?",
            "choices": ["One", "Two", "Three", "Four"],
            "correctIndex": 0,
            "level": 5,
            "topic": "landmark",
            "scope": "us",
            "entityType": "state",
            "region": "Southwest",
            "ageBand": 1,
            "reveal": "none",
        }
    )


@pytest.mark.parametrize(
    "edit",
    [
        _reword_a_capital_prompt,
        lambda b: b["questions"].reverse(),
        _add_a_landmark_question,
        lambda b: b.update(_source="something else"),
    ],
    ids=["reword-capital-prompt", "reverse-questions", "add-landmark", "change-source"],
)
def test_an_edit_that_breaks_no_dependent_leaves_every_fact_green(edit: Edit) -> None:
    """Criterion 19: the checks assert properties, not a digest of today's bank."""
    bank = copy.deepcopy(_COMMITTED)
    edit(bank)
    assert {label: check(bank) for label, check in FACTS.items()} == dict.fromkeys(FACTS, [])
