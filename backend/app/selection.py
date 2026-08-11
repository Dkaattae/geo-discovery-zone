"""Question selection.

A direct port of `pickQuestion()` in `frontend/src/lib/session.ts`: every
seventh question comes from the review queue when one is waiting, otherwise the
difficulty window widens until the pool is non-empty, and only then does it
fall back to repeats while avoiding the last few asked.

Pure functions over plain dicts — no store, no request. The randomness is
injected so a test can assert on the pool rather than on a draw.
"""

from __future__ import annotations

import random
from collections.abc import Sequence
from typing import Any

LEVEL_SPANS = (1.5, 3.0, 6.0, 99.0)
RECENT_WINDOW = 6
REVIEW_EVERY = 7


def topic_matches(question: dict[str, Any], topic: str) -> bool:
    return topic == "mixed" or question.get("topic") == topic


def wants_review(index: int, force_review: bool) -> bool:
    """True on every seventh served question (0-based), or when forced."""
    return force_review or (index > 0 and index % REVIEW_EVERY == REVIEW_EVERY - 1)


def review_pool(
    questions: Sequence[dict[str, Any]],
    review_entity_ids: Sequence[str],
    recently_asked: Sequence[str],
) -> list[dict[str, Any]]:
    """Questions about queued entities — a missed entity comes back from a
    different angle, so the pool is every question about it, not the one missed."""
    queued = set(review_entity_ids)
    recent = set(recently_asked)
    return [q for q in questions if q["entityId"] in queued and q["id"] not in recent]


def pick_question(
    questions: Sequence[dict[str, Any]],
    *,
    level: float,
    topic: str = "mixed",
    asked_ids: Sequence[str] = (),
    index: int = 0,
    review_entity_ids: Sequence[str] = (),
    force_review: bool = False,
    rng: random.Random | None = None,
) -> tuple[dict[str, Any] | None, bool]:
    """Returns `(question, is_review)`. `None` only when the bank is empty."""
    chooser = rng or random
    recently_asked = list(asked_ids)[-RECENT_WINDOW:]
    asked = set(asked_ids)

    if wants_review(index, force_review) and review_entity_ids:
        pool = review_pool(questions, review_entity_ids, recently_asked)
        if pool:
            return chooser.choice(pool), True

    for span in LEVEL_SPANS:
        pool = [
            q
            for q in questions
            if topic_matches(q, topic) and q["id"] not in asked and abs(q["level"] - level) <= span
        ]
        if pool:
            return chooser.choice(pool), False

    # Everything has been seen: allow repeats, avoid the last few.
    recycled = [
        q for q in questions if topic_matches(q, topic) and q["id"] not in set(recently_asked)
    ]
    if recycled:
        return chooser.choice(recycled), False
    return (chooser.choice(list(questions)), False) if questions else (None, False)
