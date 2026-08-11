"""Question selection.

The pick is random, so nothing here asserts which question came back — only
the properties that must hold for every possible draw.
"""

from __future__ import annotations

import random
from typing import Any

import pytest

from app.selection import pick_question, wants_review

BANK: list[dict[str, Any]] = [
    {"id": "q-a", "entityId": "e-a", "level": 6.0, "topic": "location"},
    {"id": "q-b", "entityId": "e-b", "level": 6.5, "topic": "capital"},
    {"id": "q-c", "entityId": "e-c", "level": 10.0, "topic": "location"},
    {"id": "q-d", "entityId": "e-d", "level": 14.0, "topic": "capital"},
    {"id": "q-e", "entityId": "e-a", "level": 17.0, "topic": "capital"},
    {"id": "q-f", "entityId": "e-f", "level": 6.2, "topic": "location"},
    {"id": "q-g", "entityId": "e-g", "level": 12.0, "topic": "location"},
    {"id": "q-h", "entityId": "e-h", "level": 4.6, "topic": "capital"},
]

NEAR_SIX = {"q-a", "q-b", "q-f", "q-h"}  # everything within 1.5 of level 6.0
ALL_IDS = [question["id"] for question in BANK]


def draws(count: int = 60, **kwargs: Any) -> list[dict[str, Any]]:
    """Many draws, so an assertion holds across the distribution, not one roll."""
    rng = random.Random(1234)
    return [pick_question(BANK, rng=rng, **kwargs)[0] for _ in range(count)]


@pytest.mark.parametrize(
    ("index", "expected"), [(0, False), (5, False), (6, True), (7, False), (13, True)]
)
def test_review_is_due_on_every_seventh_question(index: int, expected: bool) -> None:
    assert wants_review(index, force_review=False) is expected


def test_index_zero_never_opens_with_review_even_though_zero_is_divisible() -> None:
    """A session should not open by re-asking something they got wrong."""
    assert wants_review(0, force_review=False) is False


def test_review_draw_only_covers_queued_entities() -> None:
    for question in draws(index=6, level=6.0, review_entity_ids=["e-d"]):
        assert question["entityId"] == "e-d"


def test_review_returns_the_entity_from_a_different_angle() -> None:
    """The pool is every question about the entity, not the one they missed."""
    picked = {question["id"] for question in draws(index=6, level=6.0, review_entity_ids=["e-a"])}
    assert picked == {"q-a", "q-e"}


def test_review_draws_are_flagged_as_review() -> None:
    _, is_review = pick_question(BANK, level=6.0, index=6, review_entity_ids=["e-d"])
    assert is_review is True


def test_forced_review_ignores_position() -> None:
    for question in draws(index=1, level=6.0, review_entity_ids=["e-c"], force_review=True):
        assert question["entityId"] == "e-c"


def test_review_falls_through_to_a_normal_pick_when_the_queue_is_empty() -> None:
    question, is_review = pick_question(BANK, level=6.0, index=6, review_entity_ids=[])
    assert is_review is False
    assert question is not None


def test_the_tightest_window_is_tried_first() -> None:
    for question in draws(level=6.0):
        assert question["id"] in NEAR_SIX


def test_the_window_widens_only_as_far_as_it_needs_to() -> None:
    """Nothing sits within 1.5 or 3 of level 0; span 6 reaches the mid-level
    questions, and stopping there keeps level 17 out of a beginner's session."""
    for question in draws(level=0.0):
        assert question["id"] in NEAR_SIX


def test_topic_filters_every_span() -> None:
    for question in draws(level=6.0, topic="capital"):
        assert question["topic"] == "capital"


def test_mixed_draws_across_topics() -> None:
    assert {question["topic"] for question in draws(level=6.0, topic="mixed")} == {
        "location",
        "capital",
    }


def test_fresh_questions_come_before_repeats() -> None:
    for question in draws(level=6.0, asked_ids=["q-a", "q-b"]):
        assert question["id"] not in {"q-a", "q-b"}


def test_repeats_are_allowed_once_everything_has_been_seen() -> None:
    question, _ = pick_question(BANK, level=6.0, asked_ids=ALL_IDS, index=len(ALL_IDS))
    assert question is not None


def test_recycling_avoids_the_last_few_asked() -> None:
    for question in draws(level=6.0, asked_ids=ALL_IDS, index=len(ALL_IDS)):
        assert question["id"] not in ALL_IDS[-6:]


def test_an_empty_bank_returns_none() -> None:
    assert pick_question([], level=6.0) == (None, False)
