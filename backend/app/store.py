"""Queries against the database.

Every function takes the request's `Session` and returns records or plain
dicts; nothing here holds state between calls. The name survives from the
in-memory version because its job did not change — this is still the one place
that knows how content, profiles and sessions are stored.

Filtering happens in SQL rather than in Python: the list endpoints, the review
queue and the progress map all narrow with a query. The one deliberate
exception is question selection, which loads the topic's pool and picks in
`selection.py` — see `candidate_questions`.
"""

from __future__ import annotations

import hashlib
import json
import secrets
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import Select, delete, func, select
from sqlalchemy.orm import Session

from app.auth import DEMO_ACCOUNT_ID
from app.orm import (
    CLEAN_PASSES_TO_CLEAR,
    REVIEW_QUEUE_MAX,
    ContentMeta,
    EntityRow,
    ProfileRecord,
    QuestionRow,
    ReviewItem,
    SessionRecord,
)

__all__ = [
    "CLEAN_PASSES_TO_CLEAR",
    "REVIEW_QUEUE_MAX",
    "EntitySummary",
    "bundle",
    "bundle_etag",
    "bundle_ids",
    "candidate_questions",
    "content_counts",
    "content_meta",
    "count_known_entities",
    "create_profile",
    "create_session",
    "delete_profile",
    "dominant_family",
    "entities_summary",
    "entity",
    "ensure_content_loaded",
    "ensure_demo_profile",
    "entity_names",
    "family_total",
    "iso",
    "list_entities",
    "list_questions",
    "profile_for",
    "profiles_for",
    "question",
    "session_for",
    "utc_now",
]

DATA_DIR = Path(__file__).parent / "data"
CONTENT_FILE = DATA_DIR / "content.json"

DEMO_PROFILE_ID = "p-demo-maya"


def utc_now() -> datetime:
    return datetime.now(UTC)


def iso(moment: datetime) -> str:
    return moment.astimezone(UTC).isoformat().replace("+00:00", "Z")


# -- content ----------------------------------------------------------------


def ensure_content_loaded(db: Session, *, path: Path = CONTENT_FILE) -> ContentMeta:
    """Load the bank if this build is not already in the database.

    Idempotent and keyed on the content version, so restarting the server does
    not rewrite the tables and a rebuilt bank replaces the old one wholesale.
    """
    raw = json.loads(path.read_text(encoding="utf-8"))
    digest = hashlib.sha256(
        json.dumps(raw, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()[:6]
    source = raw.get("_source", {})
    generated_at = f"{source.get('extractedAt', '2026-08-11')}T00:00:00Z"
    version = f"{generated_at}-{digest}"

    meta = db.get(ContentMeta, 1)
    if meta is not None and meta.content_version == version:
        return meta

    db.execute(delete(QuestionRow))
    db.execute(delete(EntityRow))
    db.add_all(
        EntityRow(
            id=entity["id"],
            type=entity["type"],
            name=entity["name"],
            scope=entity.get("scope"),
            region=entity.get("region"),
            geometry_id=entity.get("geometryId"),
            payload=entity,
        )
        for entity in raw["entities"]
    )
    db.flush()
    db.add_all(
        QuestionRow(
            id=question["id"],
            entity_id=question["entityId"],
            format=question["format"],
            level=float(question["level"]),
            topic=question.get("topic"),
            scope=question.get("scope"),
            entity_type=question.get("entityType"),
            region=question.get("region"),
            age_band=question.get("ageBand"),
            payload=question,
        )
        for question in raw["questions"]
    )

    sources = [{"name": "Wander the Atlas bundled question bank", "license": "UNLICENSED"}]
    if meta is None:
        meta = ContentMeta(
            id=1, content_version=version, generated_at=generated_at, sources=sources
        )
        db.add(meta)
    else:
        meta.content_version = version
        meta.generated_at = generated_at
        meta.sources = sources
    db.flush()
    return meta


def content_meta(db: Session) -> ContentMeta | None:
    return db.get(ContentMeta, 1)


def content_counts(db: Session) -> tuple[int, int]:
    entities = db.scalar(select(func.count()).select_from(EntityRow)) or 0
    questions = db.scalar(select(func.count()).select_from(QuestionRow)) or 0
    return entities, questions


def entity(db: Session, entity_id: str) -> dict[str, Any] | None:
    row = db.get(EntityRow, entity_id)
    return row.payload if row else None


def question(db: Session, question_id: str) -> dict[str, Any] | None:
    row = db.get(QuestionRow, question_id)
    return row.payload if row else None


def _page(db: Session, statement: Select[Any], offset: int, limit: int) -> tuple[list[Any], int]:
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    rows = list(db.scalars(statement.offset(offset).limit(limit)))
    return rows, total


def list_entities(
    db: Session,
    *,
    scope: str | None = None,
    types: Sequence[str] | None = None,
    region_slug: str | None = None,
    ids: Sequence[str] | None = None,
    query: str | None = None,
    offset: int = 0,
    limit: int = 100,
) -> tuple[list[dict[str, Any]], int]:
    statement = select(EntityRow).order_by(EntityRow.id)
    if scope:
        statement = statement.where(EntityRow.scope == scope)
    if types:
        statement = statement.where(EntityRow.type.in_(list(types)))
    if region_slug:
        statement = statement.where(_slug_expression(EntityRow.region) == region_slug)
    if ids is not None:
        statement = statement.where(EntityRow.id.in_(list(ids)))
    if query:
        # Case-insensitive substring, the same match the contract describes.
        statement = statement.where(func.lower(EntityRow.name).like(f"%{query.lower()}%"))
    rows, total = _page(db, statement, offset, limit)
    return [row.payload for row in rows], total


def list_questions(
    db: Session,
    *,
    scope: str | None = None,
    entity_types: Sequence[str] | None = None,
    entity_ids: Sequence[str] | None = None,
    topics: Sequence[str] | None = None,
    formats: Sequence[str] | None = None,
    region_slug: str | None = None,
    min_age_band: int | None = None,
    max_age_band: int | None = None,
    level: float | None = None,
    level_span: float = 1.5,
    exclude: Iterable[str] = (),
    offset: int = 0,
    limit: int = 100,
) -> tuple[list[dict[str, Any]], int]:
    statement = select(QuestionRow).order_by(QuestionRow.id)
    if scope:
        statement = statement.where(QuestionRow.scope == scope)
    if entity_types:
        statement = statement.where(QuestionRow.entity_type.in_(list(entity_types)))
    if entity_ids:
        statement = statement.where(QuestionRow.entity_id.in_(list(entity_ids)))
    if topics:
        statement = statement.where(QuestionRow.topic.in_(list(topics)))
    if formats:
        statement = statement.where(QuestionRow.format.in_(list(formats)))
    if region_slug:
        statement = statement.where(_slug_expression(QuestionRow.region) == region_slug)
    if min_age_band is not None:
        statement = statement.where(func.coalesce(QuestionRow.age_band, 1) >= min_age_band)
    if max_age_band is not None:
        statement = statement.where(func.coalesce(QuestionRow.age_band, 3) <= max_age_band)
    if level is not None:
        statement = statement.where(
            QuestionRow.level >= level - level_span, QuestionRow.level <= level + level_span
        )
    excluded = list(exclude)
    if excluded:
        statement = statement.where(QuestionRow.id.not_in(excluded))
    rows, total = _page(db, statement, offset, limit)
    return [row.payload for row in rows], total


def candidate_questions(db: Session, topic: str) -> list[dict[str, Any]]:
    """The pool `selection.pick_question` chooses from.

    The topic narrows in SQL; the difficulty window does not, because the
    selector widens that window itself and needs to see what a wider one would
    reach. At bank sizes past a few thousand questions per topic this should
    push the spans into the query — the spans are already explicit constants
    there, so it is a contained change.
    """
    statement = select(QuestionRow)
    if topic != "mixed":
        statement = statement.where(QuestionRow.topic == topic)
    return [row.payload for row in db.scalars(statement)]


def review_questions(db: Session, entity_ids: Sequence[str]) -> list[dict[str, Any]]:
    if not entity_ids:
        return []
    statement = select(QuestionRow).where(QuestionRow.entity_id.in_(list(entity_ids)))
    return [row.payload for row in db.scalars(statement)]


def bundle_ids(db: Session) -> list[str]:
    scopes = db.scalars(select(EntityRow.scope).distinct().order_by(EntityRow.scope))
    return sorted({scope or "us" for scope in scopes})


def bundle_etag(db: Session, bundle_id: str) -> str:
    """Bundles are immutable per `contentVersion`, so that is the whole etag."""
    meta = content_meta(db)
    return f'"{bundle_id}-{meta.content_version if meta else "unseeded"}"'


def bundle(db: Session, bundle_id: str) -> dict[str, Any] | None:
    if bundle_id not in bundle_ids(db):
        return None
    entities = [
        row.payload
        for row in db.scalars(
            select(EntityRow).where(EntityRow.scope == bundle_id).order_by(EntityRow.id)
        )
    ]
    questions = [
        row.payload
        for row in db.scalars(
            select(QuestionRow)
            .join(EntityRow, QuestionRow.entity_id == EntityRow.id)
            .where(EntityRow.scope == bundle_id)
            .order_by(QuestionRow.id)
        )
    ]
    meta = content_meta(db)
    labels = {"us": "United States", "world": "World"}
    payload: dict[str, Any] = {
        "id": bundle_id,
        "label": labels.get(bundle_id, bundle_id),
        "scope": bundle_id,
        "entityCount": len(entities),
        "questionCount": len(questions),
        "entities": entities,
        "questions": questions,
        "contentVersion": meta.content_version if meta else "unseeded",
    }
    payload["bytes"] = len(json.dumps(payload, ensure_ascii=False).encode())
    payload["etag"] = bundle_etag(db, bundle_id)
    return payload


@dataclass(frozen=True)
class EntitySummary:
    id: str
    type: str
    scope: str
    geometry_id: str | None


def entities_summary(db: Session, entity_ids: Sequence[str]) -> list[EntitySummary]:
    """Just the columns the progress map needs, for the entities named."""
    if not entity_ids:
        return []
    rows = db.execute(
        select(EntityRow.id, EntityRow.type, EntityRow.scope, EntityRow.geometry_id)
        .where(EntityRow.id.in_(list(entity_ids)))
        .order_by(EntityRow.id)
    )
    return [
        EntitySummary(id, type_, scope or "us", geometry_id)
        for id, type_, scope, geometry_id in rows
    ]


def entity_names(db: Session, entity_ids: Sequence[str]) -> dict[str, str]:
    if not entity_ids:
        return {}
    rows = db.execute(
        select(EntityRow.id, EntityRow.name).where(EntityRow.id.in_(list(entity_ids)))
    )
    return {entity_id: name for entity_id, name in rows}


def count_known_entities(db: Session, entity_ids: Sequence[str]) -> int:
    if not entity_ids:
        return 0
    return (
        db.scalar(
            select(func.count()).select_from(EntityRow).where(EntityRow.id.in_(list(entity_ids)))
        )
        or 0
    )


def dominant_family(db: Session) -> tuple[str, str]:
    """The (type, scope) pair the progress map is drawn over — the largest
    family present, since a US map fills in states and a world map countries."""
    row = db.execute(
        select(EntityRow.type, EntityRow.scope, func.count().label("n"))
        .group_by(EntityRow.type, EntityRow.scope)
        .order_by(func.count().desc(), EntityRow.type)
        .limit(1)
    ).first()
    if row is None:
        return ("state", "us")
    return (row[0], row[1] or "us")


def family_total(db: Session, family: tuple[str, str]) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(EntityRow)
            .where(EntityRow.type == family[0], func.coalesce(EntityRow.scope, "us") == family[1])
        )
        or 0
    )


def _slug_expression(column: Any) -> Any:
    """`Mountain West` and `mountain-west` are the same region."""
    return func.replace(func.lower(column), " ", "-")


def slug(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip().casefold().replace(" ", "-")


# -- profiles ---------------------------------------------------------------


def create_profile(
    db: Session,
    *,
    account_id: str,
    name: str,
    avatar: str,
    grade: int,
    pin_hash: str | None = None,
) -> ProfileRecord:
    level = float(grade * 2)
    profile = ProfileRecord(
        id=f"p-{int(utc_now().timestamp() * 1000)}-{secrets.token_hex(3)}",
        account_id=account_id,
        name=name,
        avatar=avatar,
        level=level,
        best_sustained_level=level,
        last_session_end_level=level,
        created_at=utc_now(),
        pin_hash=pin_hash,
    )
    db.add(profile)
    db.flush()
    return profile


def profiles_for(db: Session, account_id: str) -> list[ProfileRecord]:
    return list(
        db.scalars(
            select(ProfileRecord)
            .where(ProfileRecord.account_id == account_id)
            .order_by(ProfileRecord.created_at, ProfileRecord.id)
        )
    )


def profile_for(db: Session, profile_id: str, account_id: str) -> ProfileRecord | None:
    """Scoped lookup: another account's profile is indistinguishable from a
    missing one, so a caller cannot probe for which ids exist."""
    return db.scalar(
        select(ProfileRecord).where(
            ProfileRecord.id == profile_id, ProfileRecord.account_id == account_id
        )
    )


def profile_by_id(db: Session, profile_id: str) -> ProfileRecord | None:
    return db.get(ProfileRecord, profile_id)


def delete_profile(db: Session, profile: ProfileRecord) -> None:
    db.execute(delete(SessionRecord).where(SessionRecord.profile_id == profile.id))
    db.delete(profile)
    db.flush()


# -- sessions ---------------------------------------------------------------


def create_session(
    db: Session, profile: ProfileRecord, *, topic: str, level: float
) -> SessionRecord:
    session = SessionRecord(
        id=f"s-{int(utc_now().timestamp() * 1000)}-{secrets.token_hex(3)}",
        profile_id=profile.id,
        account_id=profile.account_id,
        topic=topic,
        level=level,
        started_at=utc_now(),
    )
    db.add(session)
    db.flush()
    return session


def session_for(db: Session, session_id: str, account_id: str) -> SessionRecord | None:
    return db.scalar(
        select(SessionRecord).where(
            SessionRecord.id == session_id, SessionRecord.account_id == account_id
        )
    )


# -- seeding ----------------------------------------------------------------


def ensure_demo_profile(db: Session) -> ProfileRecord | None:
    """One demo profile for the demo account, so a fresh database is not an
    empty screen. Created once; a real profile with this id is left alone."""
    existing = db.get(ProfileRecord, DEMO_PROFILE_ID)
    if existing is not None:
        return existing
    now = utc_now()
    profile = ProfileRecord(
        id=DEMO_PROFILE_ID,
        account_id=DEMO_ACCOUNT_ID,
        name="Maya",
        avatar="🦊",
        level=6.0,
        best_sustained_level=6.0,
        last_session_end_level=6.0,
        created_at=now,
        answered=12,
        correct=9,
        streak_days=2,
        mastery={"us-state-co": 0.8, "us-state-fl": 0.5, "us-state-tx": 0.25},
        review_queue=[ReviewItem(entity_id="us-state-tx", added_at=now)],
    )
    db.add(profile)
    db.flush()
    return profile
