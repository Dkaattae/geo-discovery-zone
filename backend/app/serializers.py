"""Record → contract payload conversion.

Kept out of the routers so the wire shape is defined in one place, and out of
the store so the store stays about queries. Everything here returns plain dicts
in the contract's camelCase and does no I/O: callers hand in what they have
already fetched.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from app.levels import level_label, level_window
from app.orm import ProfileRecord, ServedRecord, SessionRecord
from app.store import EntitySummary, iso

MASTERY_MASTERED = 0.7


def question_payload(
    question: dict[str, Any], *, include_answer_key: bool = True
) -> dict[str, Any]:
    """`correctIndex` is omitted — not nulled — when the key is withheld."""
    payload = dict(question)
    if not include_answer_key:
        payload.pop("correctIndex", None)
    return payload


def profile_payload(profile: ProfileRecord) -> dict[str, Any]:
    """`pinHash` is never returned: a four-digit PIN's hash is a four-digit PIN."""
    return {
        "id": profile.id,
        "name": profile.name,
        "avatar": profile.avatar,
        "createdAt": iso(profile.created_at),
        "level": profile.level,
        "bestSustainedLevel": profile.best_sustained_level,
        "lastSessionEndLevel": profile.last_session_end_level,
        "stats": {
            "answered": profile.answered,
            "correct": profile.correct,
            "streakDays": profile.streak_days,
        },
        "mastery": dict(profile.mastery),
        "reviewQueue": profile.review_entity_ids(),
    }


def session_payload(session: SessionRecord) -> dict[str, Any]:
    return {
        "id": session.id,
        "profileId": session.profile_id,
        "topic": session.topic,
        "level": session.level,
        "levelLabel": level_label(session.level),
        "state": session.state,
        "startedAt": iso(session.started_at),
        "endedAt": iso(session.ended_at) if session.ended_at else None,
        "counts": {
            "answered": session.answered,
            "correct": session.correct,
            "wrong": session.wrong,
            "correctStreak": session.correct_streak,
            "wrongStreak": session.wrong_streak,
        },
        "askedQuestionIds": list(session.asked_question_ids),
        "seenEntityIds": list(session.seen_entity_ids),
        "learnedEntityIds": list(session.learned_entity_ids),
        "reviewRoundRemaining": session.review_round_remaining,
    }


def served_payload(
    served: ServedRecord,
    question: dict[str, Any],
    entity: dict[str, Any] | None,
    *,
    include_answer_key: bool = True,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "question": question_payload(question, include_answer_key=include_answer_key),
        "isReview": served.is_review,
        "index": served.index,
        "phase": "PRESENTING",
    }
    if entity is not None:
        payload["entity"] = entity
    return payload


def review_queue_payload(profile: ProfileRecord, names: dict[str, str]) -> dict[str, Any]:
    """`names` comes from one query over the queued entities, not a full load."""
    return {
        "profileId": profile.id,
        "entities": [
            {
                "entityId": item.entity_id,
                "name": names.get(item.entity_id),
                "cleanPasses": item.clean_passes,
                "addedAt": iso(item.added_at),
            }
            for item in profile.review_queue
        ],
    }


def mastered_entity_ids(profile: ProfileRecord) -> list[str]:
    """Above 0.7 fills the entity in on the progress map."""
    return [entity_id for entity_id, value in profile.mastery.items() if value > MASTERY_MASTERED]


def progress_payload(
    profile: ProfileRecord,
    *,
    mastered: Sequence[EntitySummary],
    family: tuple[str, str],
    family_total: int,
    entities_seen: int,
) -> dict[str, Any]:
    """`mapProgress` is counted over one entity family at a time — a US map fills
    in states, a world map fills in countries, and mixing them makes the
    denominator meaningless.

    The caller resolves `mastered` and the family counts with queries, so
    painting the map never loads the whole bank.
    """
    return {
        "profileId": profile.id,
        "mastery": dict(profile.mastery),
        "masteredEntityIds": sorted(entity.id for entity in mastered),
        "masteredGeometryIds": sorted(
            entity.geometry_id for entity in mastered if entity.geometry_id
        ),
        "entitiesSeen": entities_seen,
        "mapProgress": {
            "entityType": family[0],
            "scope": family[1],
            "filled": len([entity for entity in mastered if (entity.type, entity.scope) == family]),
            "total": family_total,
        },
        "suggestedLevels": level_window(profile.last_session_end_level),
        "reviewQueue": profile.review_entity_ids(),
    }
