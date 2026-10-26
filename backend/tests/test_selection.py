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


# T-089: past span 6, the pool is the nearest fresh questions (E-28).


def q(qid: str, level: float, topic: str = "location", entity: str | None = None) -> dict[str, Any]:
    return {"id": qid, "entityId": entity or f"e-{qid}", "level": level, "topic": topic}


def fixture_draws(
    bank: list[dict[str, Any]], count: int = 200, **kwargs: Any
) -> list[dict[str, Any]]:
    rng = random.Random(89)
    picks = [pick_question(bank, rng=rng, **kwargs) for _ in range(count)]
    assert all(is_review is False for _, is_review in picks)
    return [question for question, _ in picks]


def ids(picks: list[dict[str, Any] | None]) -> set[str]:
    return {question["id"] for question in picks if question is not None}


ABOVE = [q("l3", 3), q("l8", 8), q("l10a", 10), q("l10b", 10)]


def test_above_the_bank_draws_only_the_nearest_questions() -> None:
    assert ids(fixture_draws(ABOVE, level=16.5)) <= {"l10a", "l10b"}


def test_above_the_bank_every_nearest_tie_can_be_drawn() -> None:
    assert ids(fixture_draws(ABOVE, level=16.5)) == {"l10a", "l10b"}


def test_below_the_bank_draws_only_the_nearest_question() -> None:
    bank = [q("l7", 7), q("l7.5", 7.5), q("l12", 12)]
    assert ids(fixture_draws(bank, level=0.0)) == {"l7"}


@pytest.mark.parametrize(
    ("bank", "level"),
    [
        ([q("l4", 4), q("l10", 10)], 16.0),  # distance 6.0: inside span 6
        ([q("l4", 4), q("l10", 10)], 16.5),  # distances 12.5 and 6.5: fallback
        ([q("l9.5", 9.5), q("l10", 10)], 16.5),  # distances 7.0 and 6.5: fallback
    ],
)
def test_the_span_six_edge_from_both_sides(bank: list[dict[str, Any]], level: float) -> None:
    assert ids(fixture_draws(bank, level=level)) == {"l10"}


def test_the_fallback_skips_asked_questions() -> None:
    bank = [q("l10", 10), q("l9.5", 9.5), q("l3", 3)]
    assert ids(fixture_draws(bank, level=16.5, asked_ids=["l10"])) == {"l9.5"}


def test_the_fallback_keeps_the_topic_filter() -> None:
    bank = [q("loc10", 10, "location"), q("cap9", 9, "capital"), q("cap3", 3, "capital")]
    assert ids(fixture_draws(bank, level=16.5, topic="capital")) == {"cap9"}


def test_the_fallback_in_mixed_draws_every_topic_at_the_nearest_distance() -> None:
    bank = [q("loc10", 10, "location"), q("cap10", 10, "capital"), q("cap3", 3, "capital")]
    picks = fixture_draws(bank, level=16.5, topic="mixed")
    assert ids(picks) == {"loc10", "cap10"}
    assert {question["topic"] for question in picks if question is not None} == {
        "location",
        "capital",
    }


def test_the_fallback_is_not_a_review() -> None:
    _, is_review = pick_question(ABOVE, level=16.5, rng=random.Random(0))
    assert is_review is False


def test_once_everything_is_asked_the_pick_still_recycles_above_the_bank() -> None:
    bank = [q(f"r{n}", 3 + n) for n in range(8)]
    asked = [question["id"] for question in bank]
    picks = fixture_draws(bank, level=16.5, asked_ids=asked, index=len(asked))
    assert ids(picks) == {"r0", "r1"}


def test_review_wins_over_the_fallback_whatever_the_level() -> None:
    bank = [q("rev3", 3, entity="e-queued"), q("l10", 10)]
    rng = random.Random(7)
    for _ in range(100):
        question, is_review = pick_question(
            bank, level=16.5, index=6, review_entity_ids=["e-queued"], rng=rng
        )
        assert is_review is True
        assert question is not None and question["entityId"] == "e-queued"
