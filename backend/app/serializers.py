"""Record → contract payload conversion.

Kept out of the routers so the wire shape is defined in one place, and out of
the store so the store stays about state. Everything here returns plain dicts
in the contract's camelCase; the routers hand them to the response models.
"""

from __future__ import annotations

from typing import Any

from app.levels import level_label, level_window
from app.store import ProfileRecord, ServedRecord, SessionRecord, iso


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


def review_queue_payload(
    profile: ProfileRecord, entities: dict[str, dict[str, Any]]
) -> dict[str, Any]:
    return {
        "profileId": profile.id,
        "entities": [
            {
                "entityId": item.entity_id,
                "name": entities.get(item.entity_id, {}).get("name"),
                "cleanPasses": item.clean_passes,
                "addedAt": iso(item.added_at),
            }
            for item in profile.review_queue
        ],
    }


def progress_payload(
    profile: ProfileRecord,
    entities: dict[str, dict[str, Any]],
    *,
    mastered_threshold: float = 0.7,
) -> dict[str, Any]:
    """`mapProgress` is counted over one entity family at a time — a US map fills
    in states, a world map fills in countries, and mixing them makes the
    denominator meaningless."""
    mastered_ids = [
        entity_id
        for entity_id, value in profile.mastery.items()
        if value > mastered_threshold and entity_id in entities
    ]
    mastered_geometry_ids = [
        entities[entity_id]["geometryId"]
        for entity_id in mastered_ids
        if entities[entity_id].get("geometryId")
    ]
    family = _dominant_family(entities)
    family_ids = {
        entity_id
        for entity_id, entity in entities.items()
        if (entity.get("type"), entity.get("scope", "us")) == family
    }
    return {
        "profileId": profile.id,
        "mastery": dict(profile.mastery),
        "masteredEntityIds": sorted(mastered_ids),
        "masteredGeometryIds": sorted(mastered_geometry_ids),
        "entitiesSeen": len([e for e in profile.mastery if e in entities]),
        "mapProgress": {
            "entityType": family[0],
            "scope": family[1],
            "filled": len([e for e in mastered_ids if e in family_ids]),
            "total": len(family_ids),
        },
        "suggestedLevels": level_window(profile.last_session_end_level),
        "reviewQueue": profile.review_entity_ids(),
    }


def _dominant_family(entities: dict[str, dict[str, Any]]) -> tuple[str, str]:
    """The (type, scope) pair the map is drawn over — the largest family present."""
    counts: dict[tuple[str, str], int] = {}
    for entity in entities.values():
        key = (str(entity.get("type", "state")), str(entity.get("scope", "us")))
        counts[key] = counts.get(key, 0) + 1
    if not counts:
        return ("state", "us")
    return max(counts.items(), key=lambda item: item[1])[0]
