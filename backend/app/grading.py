"""Grading, profile advancement and the reveal payload.

Pure functions over records and plain dicts. The rules encoded here are the
ones the contract spells out in prose, and they are the ones worth being upset
about getting silently wrong:

- a wrong answer queues the *entity* for review, not the question;
- four correct in a row nudges the level up by 0.5, three wrong in a row drops
  it by 0.5, both silently;
- `bestSustainedLevel` is sustained (two consecutive correct at that level),
  never peak, because peak inflates the next session's start;
- review is *offered* at five cumulative wrong, and never immediately after a
  wrong answer, which would read as being corrected.
"""

from __future__ import annotations

import math
from datetime import datetime
from typing import Any

from app.levels import clamp_level
from app.store import ProfileRecord, SessionRecord

MASTERY_ON_CORRECT = 0.25
MASTERY_ON_WRONG = 0.2
MASTERY_MASTERED = 0.7

CORRECT_STREAK_TO_RAISE = 4
WRONG_STREAK_TO_DROP = 3
LEVEL_STEP = 0.5
SUSTAINED_STREAK = 2

WRONG_TO_OFFER_REVIEW = 5
MILESTONES = (5, 10, 20)

REVEAL_DELAY_WRONG_MS = 1100

CHOICE_FORMATS = {"map_identify", "map_click", "multiple_choice", "image", "ab_compare"}
PIN_FORMATS = {"pin_pick", "pin_drop"}
DEFAULT_PIN_RADIUS_KM = 300.0
EARTH_RADIUS_KM = 6371.0088


class UngradableAnswer(Exception):
    """The question carries no answer key this server knows how to grade."""

    def __init__(self, question_format: str, reason: str):
        super().__init__(reason)
        self.question_format = question_format
        self.reason = reason


def haversine_km(a: list[float], b: list[float]) -> float:
    """Great-circle distance between two `[lon, lat]` points."""
    lon1, lat1 = math.radians(a[0]), math.radians(a[1])
    lon2, lat2 = math.radians(b[0]), math.radians(b[1])
    d_lat, d_lon = lat2 - lat1, lon2 - lon1
    h = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lon / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(min(1.0, math.sqrt(h)))


def grade(
    question: dict[str, Any],
    *,
    choice_index: int | None = None,
    pin: list[float] | None = None,
) -> tuple[bool, float | None]:
    """Returns `(correct, distance_km)`. `distance_km` is set for pin formats."""
    question_format = question["format"]

    if question_format in CHOICE_FORMATS:
        if "correctIndex" not in question:
            raise UngradableAnswer(question_format, "This question has no stored answer key.")
        if choice_index is None:
            raise UngradableAnswer(question_format, "choiceIndex is required for this format.")
        return choice_index == question["correctIndex"], None

    if question_format in PIN_FORMATS:
        target = question.get("pinTarget") or {}
        centroid = target.get("centroid")
        if pin is None:
            raise UngradableAnswer(question_format, "pin is required for this format.")
        if not centroid:
            raise UngradableAnswer(
                question_format,
                "This question has no pin target, so a tap cannot be graded.",
            )
        distance = haversine_km(pin, centroid)
        radius = target.get("maxDistanceKm", DEFAULT_PIN_RADIUS_KM)
        return distance <= radius, distance

    raise UngradableAnswer(
        question_format, f"Grading for {question_format} questions is not implemented."
    )


def apply_mastery(profile: ProfileRecord, entity_id: str, correct: bool) -> bool:
    """Moves mastery for one entity. Returns True when it crossed into mastered."""
    before = profile.mastery.get(entity_id, 0.0)
    if correct:
        after = min(1.0, before + MASTERY_ON_CORRECT)
    else:
        after = max(0.0, before - MASTERY_ON_WRONG)
    profile.mastery[entity_id] = round(after, 4)
    return before <= MASTERY_MASTERED < after


def apply_answer(
    profile: ProfileRecord,
    session: SessionRecord,
    question: dict[str, Any],
    *,
    correct: bool,
    is_review: bool,
    now: datetime,
) -> dict[str, Any]:
    """Applies every side effect of one answer. Returns what the caller reports."""
    entity_id = question["entityId"]

    session.answered += 1
    profile.answered += 1
    if correct:
        session.correct += 1
        profile.correct += 1
        session.correct_streak += 1
        session.wrong_streak = 0
    else:
        session.wrong += 1
        session.wrong_streak += 1
        session.correct_streak = 0

    if entity_id not in session.seen_entity_ids:
        session.seen_entity_ids.append(entity_id)

    became_mastered = apply_mastery(profile, entity_id, correct)
    if became_mastered and entity_id not in session.learned_entity_ids:
        session.learned_entity_ids.append(entity_id)

    if correct:
        profile.record_clean_pass(entity_id)
    else:
        profile.queue_entity(entity_id, now)

    level_change = _apply_level_rules(profile, session, correct)
    if session.review_round_remaining > 0:
        session.review_round_remaining -= 1

    dropped_quietly = session.wrong_streak > 0 and session.wrong_streak % WRONG_STREAK_TO_DROP == 0
    prompts = {
        "milestone": session.answered if session.answered in MILESTONES else None,
        # An invitation, not an interruption: never straight after a wrong answer,
        # and never while the level has just dropped — they are already struggling.
        "offerReview": (
            session.wrong >= WRONG_TO_OFFER_REVIEW
            and correct
            and not dropped_quietly
            and bool(profile.review_queue)
            and session.review_round_remaining == 0
        ),
        "levelDroppedQuietly": dropped_quietly,
    }
    if prompts["offerReview"]:
        session.review_offered = True

    session.last_answer_wrong = not correct
    session.pending = None
    return {
        "levelChange": level_change,
        "prompts": prompts,
        "isReview": is_review,
        "becameMastered": became_mastered,
    }


def _apply_level_rules(
    profile: ProfileRecord, session: SessionRecord, correct: bool
) -> float | None:
    """Four correct in a row raises, three wrong in a row drops. Silently."""
    change: float | None = None
    if correct and session.correct_streak % CORRECT_STREAK_TO_RAISE == 0:
        change = LEVEL_STEP
    elif not correct and session.wrong_streak % WRONG_STREAK_TO_DROP == 0:
        change = -LEVEL_STEP

    if change is not None:
        new_level = clamp_level(profile.level + change)
        change = round(new_level - profile.level, 4) or None
        profile.level = new_level
        session.level = new_level

    # Sustained, not peak: it only counts once they have held the level.
    if correct and session.correct_streak >= SUSTAINED_STREAK:
        profile.best_sustained_level = max(profile.best_sustained_level, profile.level)
    return change


def build_reveal(
    question: dict[str, Any],
    entity: dict[str, Any] | None,
    *,
    correct: bool,
) -> dict[str, Any]:
    """Reward on a correct answer, reason on a wrong one — deliberately asymmetric."""
    entity = entity or {}
    answer_label = _answer_label(question, entity)
    highlight = question.get("highlightGeometryId") or entity.get("geometryId")

    if correct:
        headline = entity.get("funFact") or question.get("shortExplanation") or "Correct!"
        detail = entity.get("funFactDetail") or question.get("detailExplanation")
        reveal = {
            "tone": "reward",
            "headline": headline,
            "nextEnabledAfterMs": 0,
        }
    else:
        headline = question.get("shortExplanation") or (
            f"The answer is {answer_label}." if answer_label else "Not this time."
        )
        detail = question.get("detailExplanation")
        reveal = {
            "tone": "reason",
            "headline": headline,
            # A short beat so the reason is seen before the next question lands.
            "nextEnabledAfterMs": REVEAL_DELAY_WRONG_MS,
        }

    if detail:
        reveal["detail"] = detail
    if answer_label:
        reveal["answerLabel"] = answer_label
    if highlight and (not correct or question.get("reveal") == "map_highlight"):
        reveal["mapHighlightGeometryId"] = highlight
    return reveal


def _answer_label(question: dict[str, Any], entity: dict[str, Any]) -> str | None:
    choices = question.get("choices")
    index = question.get("correctIndex")
    if choices and index is not None and 0 <= index < len(choices):
        return choices[index]
    return entity.get("name")


def summary_headline(learned_count: int, answered: int) -> str:
    """Places learned, never a percentage."""
    if learned_count == 1:
        return "You learned 1 new place!"
    if learned_count > 1:
        return f"You learned {learned_count} new places!"
    if answered == 0:
        return "Come back any time — the map is waiting!"
    return f"You explored {answered} place{'s' if answered != 1 else ''} today!"
