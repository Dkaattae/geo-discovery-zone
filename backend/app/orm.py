"""The mapped tables.

These are the records the rest of the app already worked with — `ProfileRecord`,
`SessionRecord`, `AnswerRecord`, `ReviewItem` — now persisted rather than held
in a dict. Attribute names and helper methods are unchanged, so `grading.py`
and the routers did not have to learn about SQL.

**Portability.** Only column types every supported backend has: `String`,
`Integer`, `Float`, `Boolean`, `JSON`, and a UTC-normalising `DateTime`. No
server defaults, no dialect functions, no `JSONB`, no arrays. Moving to
Postgres is a URL change and a migration run.

**What is a column and what is JSON.** Anything filtered or joined on gets its
own column — ids, ownership, topic, level, counts. Collections that are always
read and written whole get a JSON column: a profile's mastery map, a session's
asked/seen/learned lists, the undo snapshots. The review queue is a table
rather than JSON because it carries per-entity state (`cleanPasses`) and an
order that must survive a rewrite. If mastery ever needs querying per entity,
it promotes to a table the same way.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON as SqlJson
from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, TypeDecorator
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.orm import DeclarativeBase, Mapped, MappedAsDataclass, mapped_column, relationship

REVIEW_QUEUE_MAX = 20
CLEAN_PASSES_TO_CLEAR = 2


class UtcDateTime(TypeDecorator[datetime]):
    """Always hands back timezone-aware UTC.

    SQLite has no timezone type and returns naive values, so without this a
    `now - answered_at` in the undo window would raise on SQLite and work on
    Postgres. Normalising on the way in and out keeps both honest.
    """

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Any) -> datetime | None:
        if value is None:
            return None
        return (value if value.tzinfo else value.replace(tzinfo=UTC)).astimezone(UTC)

    def process_result_value(self, value: datetime | None, dialect: Any) -> datetime | None:
        if value is None:
            return None
        return value if value.tzinfo else value.replace(tzinfo=UTC)


JsonDict = MutableDict.as_mutable(SqlJson)
JsonList = MutableList.as_mutable(SqlJson)


class Base(MappedAsDataclass, DeclarativeBase, kw_only=True):
    """Dataclass-style mapping: records can be built in memory, unattached to a
    session, which is what the pure grading tests do."""

    type_annotation_map = {dict[str, Any]: SqlJson, list[str]: SqlJson}


# -- accounts ---------------------------------------------------------------


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    username: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(UtcDateTime)


class TokenRecord(Base):
    """Only the digest of a token is stored, so a leaked table is not a set of
    working credentials."""

    __tablename__ = "tokens"

    digest: Mapped[str] = mapped_column(String(64), primary_key=True)
    account_id: Mapped[str] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True
    )
    expires_at: Mapped[datetime] = mapped_column(UtcDateTime)


# -- profiles ---------------------------------------------------------------


class ReviewItem(Base):
    """An entity waiting to come back, oldest first."""

    __tablename__ = "review_queue"

    entity_id: Mapped[str] = mapped_column(String(64))
    added_at: Mapped[datetime] = mapped_column(UtcDateTime)
    clean_passes: Mapped[int] = mapped_column(Integer, default=0)
    seq: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, default=None)
    profile_id: Mapped[str | None] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), index=True, default=None
    )


class ProfileRecord(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    account_id: Mapped[str] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(24))
    avatar: Mapped[str] = mapped_column(String(16))
    level: Mapped[float] = mapped_column(Float)
    best_sustained_level: Mapped[float] = mapped_column(Float)
    last_session_end_level: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(UtcDateTime)
    pin_hash: Mapped[str | None] = mapped_column(String(255), default=None)
    answered: Mapped[int] = mapped_column(Integer, default=0)
    correct: Mapped[int] = mapped_column(Integer, default=0)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    mastery: Mapped[dict[str, float]] = mapped_column(JsonDict, default_factory=dict)
    review_queue: Mapped[list[ReviewItem]] = relationship(
        cascade="all, delete-orphan",
        order_by="ReviewItem.seq",
        lazy="selectin",
        default_factory=list,
    )

    def queue_entity(self, entity_id: str, now: datetime) -> None:
        """Push an entity onto the review queue, oldest first, capped at 20."""
        if any(item.entity_id == entity_id for item in self.review_queue):
            return
        self.review_queue.append(ReviewItem(entity_id=entity_id, added_at=now))
        if len(self.review_queue) > REVIEW_QUEUE_MAX:
            del self.review_queue[0 : len(self.review_queue) - REVIEW_QUEUE_MAX]

    def review_entity_ids(self) -> list[str]:
        return [item.entity_id for item in self.review_queue]

    def record_clean_pass(self, entity_id: str) -> None:
        """Two clean passes drop an entity from the queue."""
        for item in list(self.review_queue):
            if item.entity_id == entity_id:
                item.clean_passes += 1
                if item.clean_passes >= CLEAN_PASSES_TO_CLEAR:
                    self.review_queue.remove(item)

    # -- undo snapshots ---------------------------------------------------

    def snapshot(self) -> dict[str, Any]:
        """Everything an answer can move, as JSON for the undo record."""
        return {
            "level": self.level,
            "best_sustained_level": self.best_sustained_level,
            "last_session_end_level": self.last_session_end_level,
            "answered": self.answered,
            "correct": self.correct,
            "mastery": dict(self.mastery),
            "review_queue": [
                {
                    "entity_id": item.entity_id,
                    "clean_passes": item.clean_passes,
                    "added_at": item.added_at.isoformat(),
                }
                for item in self.review_queue
            ],
        }

    def restore(self, snapshot: dict[str, Any]) -> None:
        self.level = snapshot["level"]
        self.best_sustained_level = snapshot["best_sustained_level"]
        self.last_session_end_level = snapshot["last_session_end_level"]
        self.answered = snapshot["answered"]
        self.correct = snapshot["correct"]
        self.mastery = dict(snapshot["mastery"])
        self.review_queue = [
            ReviewItem(
                entity_id=item["entity_id"],
                clean_passes=item["clean_passes"],
                added_at=datetime.fromisoformat(item["added_at"]),
            )
            for item in snapshot["review_queue"]
        ]


# -- sessions ---------------------------------------------------------------


class ServedRecord:
    """The question in play. Three columns on the session, one object here."""

    __slots__ = ("question_id", "index", "is_review")

    def __init__(self, question_id: str, index: int, is_review: bool):
        self.question_id = question_id
        self.index = index
        self.is_review = is_review

    def as_dict(self) -> dict[str, Any]:
        return {"question_id": self.question_id, "index": self.index, "is_review": self.is_review}

    @classmethod
    def from_dict(cls, raw: dict[str, Any] | None) -> ServedRecord | None:
        if not raw:
            return None
        return cls(raw["question_id"], raw["index"], raw["is_review"])

    def __eq__(self, other: object) -> bool:
        return isinstance(other, ServedRecord) and self.as_dict() == other.as_dict()

    def __repr__(self) -> str:
        return f"ServedRecord({self.question_id!r}, {self.index}, {self.is_review})"


class AnswerRecord(Base):
    """One graded answer, with what it changed, so it can be undone exactly."""

    __tablename__ = "answers"

    # `seq` is the primary key rather than `id` because the answer order is the
    # thing the undo rule depends on ("only the most recent"), and an
    # autoincrementing integer primary key is the one portable way to get a
    # server-assigned sequence on both SQLite and Postgres. `id` is the public
    # identifier and stays unique.
    seq: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, default=None)
    id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("sessions.id", ondelete="CASCADE"), index=True
    )
    question_id: Mapped[str] = mapped_column(String(64))
    entity_id: Mapped[str] = mapped_column(String(64))
    correct: Mapped[bool] = mapped_column(default=False)
    answered_at: Mapped[datetime] = mapped_column(UtcDateTime)
    is_review: Mapped[bool] = mapped_column(default=False)
    profile_before: Mapped[dict[str, Any]] = mapped_column(SqlJson, default_factory=dict)
    session_before: Mapped[dict[str, Any]] = mapped_column(SqlJson, default_factory=dict)


class SessionRecord(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), index=True
    )
    account_id: Mapped[str] = mapped_column(String(64), index=True)
    topic: Mapped[str] = mapped_column(String(32))
    level: Mapped[float] = mapped_column(Float)
    started_at: Mapped[datetime] = mapped_column(UtcDateTime)
    state: Mapped[str] = mapped_column(String(16), default="active")
    ended_at: Mapped[datetime | None] = mapped_column(UtcDateTime, default=None)
    answered: Mapped[int] = mapped_column(Integer, default=0)
    correct: Mapped[int] = mapped_column(Integer, default=0)
    wrong: Mapped[int] = mapped_column(Integer, default=0)
    correct_streak: Mapped[int] = mapped_column(Integer, default=0)
    wrong_streak: Mapped[int] = mapped_column(Integer, default=0)
    asked_question_ids: Mapped[list[str]] = mapped_column(JsonList, default_factory=list)
    seen_entity_ids: Mapped[list[str]] = mapped_column(JsonList, default_factory=list)
    learned_entity_ids: Mapped[list[str]] = mapped_column(JsonList, default_factory=list)
    review_round_remaining: Mapped[int] = mapped_column(Integer, default=0)
    last_answer_wrong: Mapped[bool] = mapped_column(default=False)
    review_offered: Mapped[bool] = mapped_column(default=False)
    pending_question_id: Mapped[str | None] = mapped_column(String(64), default=None)
    pending_index: Mapped[int | None] = mapped_column(Integer, default=None)
    pending_is_review: Mapped[bool | None] = mapped_column(default=None)
    answers: Mapped[list[AnswerRecord]] = relationship(
        cascade="all, delete-orphan",
        order_by="AnswerRecord.seq",
        lazy="selectin",
        default_factory=list,
    )

    @property
    def pending(self) -> ServedRecord | None:
        """The question waiting for an answer, or None."""
        if self.pending_question_id is None or self.pending_index is None:
            return None
        return ServedRecord(
            self.pending_question_id, self.pending_index, bool(self.pending_is_review)
        )

    @pending.setter
    def pending(self, served: ServedRecord | None) -> None:
        self.pending_question_id = served.question_id if served else None
        self.pending_index = served.index if served else None
        self.pending_is_review = served.is_review if served else None

    def snapshot(self) -> dict[str, Any]:
        """The fields an answer mutates, for the undo record."""
        pending = self.pending
        return {
            "answered": self.answered,
            "correct": self.correct,
            "wrong": self.wrong,
            "correct_streak": self.correct_streak,
            "wrong_streak": self.wrong_streak,
            "learned_entity_ids": list(self.learned_entity_ids),
            "review_round_remaining": self.review_round_remaining,
            "last_answer_wrong": self.last_answer_wrong,
            "review_offered": self.review_offered,
            "level": self.level,
            "pending": pending.as_dict() if pending else None,
        }

    def restore(self, snapshot: dict[str, Any]) -> None:
        self.answered = snapshot["answered"]
        self.correct = snapshot["correct"]
        self.wrong = snapshot["wrong"]
        self.correct_streak = snapshot["correct_streak"]
        self.wrong_streak = snapshot["wrong_streak"]
        self.learned_entity_ids = list(snapshot["learned_entity_ids"])
        self.review_round_remaining = snapshot["review_round_remaining"]
        self.last_answer_wrong = snapshot["last_answer_wrong"]
        self.review_offered = snapshot["review_offered"]
        self.level = snapshot["level"]
        self.pending = ServedRecord.from_dict(snapshot["pending"])


# -- content ----------------------------------------------------------------


class EntityRow(Base):
    """One place. `payload` is the contract's Entity; the columns beside it are
    the fields the list endpoint filters on."""

    __tablename__ = "entities"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    type: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(128), index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(SqlJson)
    scope: Mapped[str | None] = mapped_column(String(16), index=True, default=None)
    region: Mapped[str | None] = mapped_column(String(64), default=None)
    geometry_id: Mapped[str | None] = mapped_column(String(16), default=None)


class QuestionRow(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    entity_id: Mapped[str] = mapped_column(
        ForeignKey("entities.id", ondelete="CASCADE"), index=True
    )
    format: Mapped[str] = mapped_column(String(32), index=True)
    level: Mapped[float] = mapped_column(Float, index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(SqlJson)
    topic: Mapped[str | None] = mapped_column(String(32), index=True, default=None)
    scope: Mapped[str | None] = mapped_column(String(16), index=True, default=None)
    entity_type: Mapped[str | None] = mapped_column(String(32), default=None)
    region: Mapped[str | None] = mapped_column(String(64), default=None)
    age_band: Mapped[int | None] = mapped_column(Integer, default=None)


Index("ix_questions_topic_level", QuestionRow.topic, QuestionRow.level)


class ContentMeta(Base):
    """One row: which build of the bank is loaded."""

    __tablename__ = "content_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    content_version: Mapped[str] = mapped_column(String(128))
    generated_at: Mapped[str] = mapped_column(String(64))
    sources: Mapped[list[dict[str, Any]]] = mapped_column(SqlJson, default_factory=list)
