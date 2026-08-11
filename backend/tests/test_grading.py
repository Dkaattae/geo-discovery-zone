"""Grading, mastery, level drift and the reveal.

These are the values computed across a set — the bug is never "it threw", it is
"it moved the level on the wrong streak".
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import pytest

from app.grading import (
    UngradableAnswer,
    apply_answer,
    apply_mastery,
    build_reveal,
    grade,
    haversine_km,
    summary_headline,
)
from app.store import ProfileRecord, SessionRecord

NOW = datetime(2026, 8, 11, 12, 0, tzinfo=UTC)

QUESTION: dict[str, Any] = {
    "id": "q-co-loc-1",
    "entityId": "us-state-co",
    "format": "map_identify",
    "prompt": "Which state is highlighted?",
    "choices": ["Colorado", "Kansas", "Nevada", "Arizona"],
    "correctIndex": 0,
    "level": 4.0,
    "highlightGeometryId": "08",
    "reveal": "map_highlight",
    "shortExplanation": "This is Colorado, the rectangle in the Rockies.",
    "detailExplanation": "Mapmakers drew it with lines of latitude and longitude.",
}

ENTITY: dict[str, Any] = {
    "id": "us-state-co",
    "type": "state",
    "name": "Colorado",
    "geometryId": "08",
    "funFact": "Colorado has 58 mountains taller than 14,000 feet.",
    "funFactDetail": "Denver sits exactly one mile above the sea.",
}


def make_profile(**overrides: Any) -> ProfileRecord:
    defaults: dict[str, Any] = {
        "id": "p-test",
        "account_id": "acct-test",
        "name": "Test",
        "avatar": "🦊",
        "level": 6.0,
        "best_sustained_level": 6.0,
        "last_session_end_level": 6.0,
        "created_at": NOW,
    }
    return ProfileRecord(**{**defaults, **overrides})


def make_session(**overrides: Any) -> SessionRecord:
    defaults: dict[str, Any] = {
        "id": "s-test",
        "profile_id": "p-test",
        "account_id": "acct-test",
        "topic": "mixed",
        "level": 6.0,
        "started_at": NOW,
    }
    return SessionRecord(**{**defaults, **overrides})


def answer(
    profile: ProfileRecord,
    session: SessionRecord,
    correct: bool,
    question: dict[str, Any] = QUESTION,
) -> dict[str, Any]:
    return apply_answer(profile, session, question, correct=correct, is_review=False, now=NOW)


# -- grading ----------------------------------------------------------------


def test_a_choice_answer_is_graded_against_the_stored_key() -> None:
    assert grade(QUESTION, choice_index=0) == (True, None)
    assert grade(QUESTION, choice_index=3) == (False, None)


def test_a_choice_answer_without_a_choice_cannot_be_graded() -> None:
    with pytest.raises(UngradableAnswer):
        grade(QUESTION, choice_index=None)


def test_a_format_with_no_answer_key_is_refused_rather_than_guessed() -> None:
    with pytest.raises(UngradableAnswer):
        grade({**QUESTION, "format": "drag_order"}, choice_index=0)


def test_a_pin_is_graded_by_distance_and_capped() -> None:
    question = {
        **QUESTION,
        "format": "pin_drop",
        "pinTarget": {
            "strategy": "nearest_centroid",
            "centroid": [-105.5, 39.0],
            "maxDistanceKm": 200,
        },
    }
    correct, distance = grade(question, pin=[-105.5, 39.5])
    assert correct is True and distance == pytest.approx(55.6, abs=1.0)

    correct, distance = grade(question, pin=[-95.0, 39.0])
    assert correct is False and distance > 200


def test_haversine_matches_a_known_distance() -> None:
    """Denver to Chicago is about 1,470 km."""
    assert haversine_km([-104.99, 39.74], [-87.63, 41.88]) == pytest.approx(1470, abs=20)


# -- mastery ----------------------------------------------------------------


def test_mastery_rises_on_correct_and_falls_on_wrong() -> None:
    profile = make_profile(mastery={"us-state-co": 0.5})
    apply_mastery(profile, "us-state-co", correct=True)
    assert profile.mastery["us-state-co"] == pytest.approx(0.75)
    apply_mastery(profile, "us-state-co", correct=False)
    assert profile.mastery["us-state-co"] == pytest.approx(0.55)


def test_mastery_stays_inside_zero_and_one() -> None:
    profile = make_profile(mastery={"e": 0.95})
    apply_mastery(profile, "e", correct=True)
    assert profile.mastery["e"] == 1.0
    profile.mastery["e"] = 0.1
    apply_mastery(profile, "e", correct=False)
    assert profile.mastery["e"] == 0.0


def test_crossing_the_mastery_threshold_counts_as_learned_once() -> None:
    profile = make_profile(mastery={"us-state-co": 0.5})
    session = make_session()
    answer(profile, session, correct=True)  # 0.5 -> 0.75, crosses 0.7
    assert session.learned_entity_ids == ["us-state-co"]
    answer(profile, session, correct=True)  # 0.75 -> 1.0, already mastered
    assert session.learned_entity_ids == ["us-state-co"]


def test_sitting_exactly_on_the_threshold_is_not_yet_learned() -> None:
    """Above 0.7 fills the entity in, so 0.7 itself must not count."""
    profile = make_profile(mastery={"us-state-co": 0.45})
    session = make_session()
    answer(profile, session, correct=True)
    assert profile.mastery["us-state-co"] == pytest.approx(0.7)
    assert session.learned_entity_ids == []


# -- review queue -----------------------------------------------------------


def test_a_wrong_answer_queues_the_entity_not_the_question() -> None:
    profile = make_profile()
    answer(profile, make_session(), correct=False)
    assert profile.review_entity_ids() == ["us-state-co"]


def test_the_queue_holds_each_entity_once() -> None:
    profile = make_profile()
    session = make_session()
    answer(profile, session, correct=False)
    answer(profile, session, correct=False)
    assert profile.review_entity_ids() == ["us-state-co"]


def test_the_queue_is_capped_at_twenty_oldest_first() -> None:
    profile = make_profile()
    for index in range(25):
        profile.queue_entity(f"e-{index:02d}", NOW)
    assert len(profile.review_queue) == 20
    assert profile.review_entity_ids()[0] == "e-05"


def test_two_clean_passes_clear_an_entity_from_the_queue() -> None:
    profile = make_profile()
    session = make_session()
    answer(profile, session, correct=False)
    answer(profile, session, correct=True)
    assert profile.review_entity_ids() == ["us-state-co"]
    answer(profile, session, correct=True)
    assert profile.review_entity_ids() == []


# -- level drift ------------------------------------------------------------


def test_four_correct_in_a_row_raises_the_level_by_a_half() -> None:
    profile = make_profile()
    session = make_session()
    changes = [answer(profile, session, correct=True)["levelChange"] for _ in range(4)]
    assert changes == [None, None, None, 0.5]
    assert profile.level == 6.5


def test_three_correct_is_not_enough() -> None:
    profile = make_profile()
    session = make_session()
    for _ in range(3):
        answer(profile, session, correct=True)
    assert profile.level == 6.0


def test_three_wrong_in_a_row_drops_the_level_by_a_half() -> None:
    profile = make_profile()
    session = make_session()
    changes = [answer(profile, session, correct=False)["levelChange"] for _ in range(3)]
    assert changes == [None, None, -0.5]
    assert profile.level == 5.5


def test_a_streak_is_consecutive_not_cumulative() -> None:
    profile = make_profile()
    session = make_session()
    for correct in (True, True, False, True, True):
        answer(profile, session, correct=correct)
    assert profile.level == 6.0


def test_the_level_never_leaves_the_scale() -> None:
    profile = make_profile(level=0.0)
    session = make_session(level=0.0)
    for _ in range(3):
        answer(profile, session, correct=False)
    assert profile.level == 0.0


def test_best_sustained_level_needs_two_consecutive_correct() -> None:
    """Sustained, not peak — one lucky answer at a level does not bank it."""
    profile = make_profile(level=6.0, best_sustained_level=6.0)
    session = make_session()
    answer(profile, session, correct=True)
    answer(profile, session, correct=False)
    assert profile.best_sustained_level == 6.0

    for _ in range(4):
        answer(profile, session, correct=True)
    assert profile.level == 6.5
    assert profile.best_sustained_level == 6.5


# -- prompts ----------------------------------------------------------------


def test_milestones_land_at_five_ten_and_twenty() -> None:
    profile = make_profile()
    session = make_session()
    milestones = [answer(profile, session, correct=True)["prompts"]["milestone"] for _ in range(21)]
    assert [index + 1 for index, value in enumerate(milestones) if value] == [5, 10, 20]


def test_review_is_offered_after_five_wrong_but_never_straight_after_a_wrong_answer() -> None:
    profile = make_profile()
    session = make_session()
    for _ in range(5):
        wrong = answer(profile, session, correct=False)
        assert wrong["prompts"]["offerReview"] is False
    assert session.wrong == 5
    assert answer(profile, session, correct=True)["prompts"]["offerReview"] is True


def test_review_is_not_offered_before_five_wrong() -> None:
    profile = make_profile()
    session = make_session()
    for _ in range(4):
        answer(profile, session, correct=False)
    assert answer(profile, session, correct=True)["prompts"]["offerReview"] is False


def test_a_quiet_level_drop_does_not_also_offer_review() -> None:
    """Three wrong in a row is a different signal: they are already struggling."""
    profile = make_profile()
    session = make_session(wrong=4, answered=4)
    prompts = [answer(profile, session, correct=False)["prompts"] for _ in range(3)]
    assert prompts[-1]["levelDroppedQuietly"] is True
    assert prompts[-1]["offerReview"] is False


# -- reveal -----------------------------------------------------------------


def test_a_correct_answer_gets_the_reward_not_a_re_teach() -> None:
    reveal = build_reveal(QUESTION, ENTITY, correct=True)
    assert reveal["tone"] == "reward"
    assert reveal["headline"] == ENTITY["funFact"]
    assert reveal["nextEnabledAfterMs"] == 0


def test_a_wrong_answer_gets_the_reason_and_a_beat_to_read_it() -> None:
    reveal = build_reveal(QUESTION, ENTITY, correct=False)
    assert reveal["tone"] == "reason"
    assert reveal["headline"] == QUESTION["shortExplanation"]
    assert reveal["detail"] == QUESTION["detailExplanation"]
    assert reveal["nextEnabledAfterMs"] > 0


def test_a_wrong_answer_highlights_the_answer_on_the_map() -> None:
    reveal = build_reveal({**QUESTION, "reveal": "none"}, ENTITY, correct=False)
    assert reveal["mapHighlightGeometryId"] == "08"
    assert reveal["answerLabel"] == "Colorado"


# -- summary ----------------------------------------------------------------


@pytest.mark.parametrize(
    ("learned", "answered", "expected"),
    [(1, 4, "You learned 1 new place!"), (3, 9, "You learned 3 new places!")],
)
def test_the_summary_reports_places_learned(learned: int, answered: int, expected: str) -> None:
    assert summary_headline(learned, answered) == expected


def test_the_summary_never_reports_a_percentage() -> None:
    for learned, answered in [(0, 0), (0, 7), (2, 10)]:
        assert "%" not in summary_headline(learned, answered)
