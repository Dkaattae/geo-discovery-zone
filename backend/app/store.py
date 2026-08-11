"""In-memory store: content bank, profiles and sessions.

There is no database yet. Everything lives in process memory and is lost on
restart — the seed exists so the frontend has a bank to render against, not so
anyone can keep a child's progress here. `Store.reset()` puts a test back to a
known state, which is why every test can share one module-level instance.

The content half is loaded once from `app/data/content.json`, which is the v1
bundled bank (`frontend/src/data/`) remapped to the contract's field names. The
profile and session halves start empty apart from one demo profile.
"""

from __future__ import annotations

import copy
import hashlib
import json
import secrets
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.auth import DEMO_ACCOUNT_ID

DATA_DIR = Path(__file__).parent / "data"
CONTENT_FILE = DATA_DIR / "content.json"
REVIEW_QUEUE_MAX = 20
CLEAN_PASSES_TO_CLEAR = 2


def utc_now() -> datetime:
    return datetime.now(UTC)


def iso(moment: datetime) -> str:
    return moment.astimezone(UTC).isoformat().replace("+00:00", "Z")


# -- records ----------------------------------------------------------------


@dataclass
class ReviewItem:
    entity_id: str
    added_at: datetime
    clean_passes: int = 0


@dataclass
class ProfileRecord:
    id: str
    account_id: str
    name: str
    avatar: str
    level: float
    best_sustained_level: float
    last_session_end_level: float
    created_at: datetime
    pin_hash: str | None = None
    answered: int = 0
    correct: int = 0
    streak_days: int = 0
    mastery: dict[str, float] = field(default_factory=dict)
    review_queue: list[ReviewItem] = field(default_factory=list)

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


@dataclass
class ServedRecord:
    question_id: str
    index: int
    is_review: bool


@dataclass
class AnswerRecord:
    id: str
    question_id: str
    entity_id: str
    correct: bool
    answered_at: datetime
    is_review: bool
    profile_before: ProfileRecord
    session_before: dict[str, Any]


@dataclass
class SessionRecord:
    id: str
    profile_id: str
    account_id: str
    topic: str
    level: float
    started_at: datetime
    state: str = "active"
    ended_at: datetime | None = None
    answered: int = 0
    correct: int = 0
    wrong: int = 0
    correct_streak: int = 0
    wrong_streak: int = 0
    asked_question_ids: list[str] = field(default_factory=list)
    seen_entity_ids: list[str] = field(default_factory=list)
    learned_entity_ids: list[str] = field(default_factory=list)
    review_round_remaining: int = 0
    pending: ServedRecord | None = None
    answers: list[AnswerRecord] = field(default_factory=list)
    last_answer_wrong: bool = False
    review_offered: bool = False

    def mutable_state(self) -> dict[str, Any]:
        """The fields an answer mutates, for the undo snapshot."""
        return copy.deepcopy(
            {
                "answered": self.answered,
                "correct": self.correct,
                "wrong": self.wrong,
                "correct_streak": self.correct_streak,
                "wrong_streak": self.wrong_streak,
                "learned_entity_ids": self.learned_entity_ids,
                "review_round_remaining": self.review_round_remaining,
                "pending": self.pending,
                "last_answer_wrong": self.last_answer_wrong,
                "review_offered": self.review_offered,
                "level": self.level,
            }
        )

    def restore(self, snapshot: dict[str, Any]) -> None:
        for key, value in copy.deepcopy(snapshot).items():
            setattr(self, key, value)


# -- store ------------------------------------------------------------------


class Store:
    def __init__(self) -> None:
        self.entities: dict[str, dict[str, Any]] = {}
        self.questions: dict[str, dict[str, Any]] = {}
        self.elevation_profiles: dict[str, dict[str, Any]] = {}
        self.superlative_axes: list[dict[str, Any]] = []
        self.geometry: dict[str, dict[str, Any]] = {}
        self.content_version: str = "unseeded"
        self.generated_at: str = iso(utc_now())
        self.sources: list[dict[str, str]] = []
        self.profiles: dict[str, ProfileRecord] = {}
        self.sessions: dict[str, SessionRecord] = {}

    # -- lifecycle --------------------------------------------------------

    def reset(self) -> None:
        self.profiles.clear()
        self.sessions.clear()

    def seed(self) -> None:
        """Load the content bank and create the demo profile."""
        self.reset()
        self._load_content()
        self._seed_profiles()

    def _load_content(self) -> None:
        raw = json.loads(CONTENT_FILE.read_text(encoding="utf-8"))
        self.entities = {entity["id"]: entity for entity in raw["entities"]}
        self.questions = {question["id"]: question for question in raw["questions"]}
        # Elevation profiles, superlative axes and vector geometry need sampled or
        # licensed source data that this repo does not carry yet. Serving invented
        # numbers to children is worse than serving none, so these stay empty and
        # the endpoints say so honestly.
        self.elevation_profiles = {}
        self.superlative_axes = []
        self.geometry = {}
        digest = hashlib.sha256(
            json.dumps(raw, sort_keys=True, ensure_ascii=False).encode()
        ).hexdigest()[:6]
        source = raw.get("_source", {})
        self.generated_at = f"{source.get('extractedAt', '2026-08-11')}T00:00:00Z"
        self.content_version = f"{self.generated_at}-{digest}"
        self.sources = [
            {
                "name": "Wander the Atlas bundled question bank",
                "license": "UNLICENSED",
            }
        ]

    def _seed_profiles(self) -> None:
        """One demo profile so `GET /profiles` is not an empty screen."""
        now = utc_now()
        profile = ProfileRecord(
            id="p-demo-maya",
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
        self.profiles[profile.id] = profile

    # -- content ----------------------------------------------------------

    def entity(self, entity_id: str) -> dict[str, Any] | None:
        return self.entities.get(entity_id)

    def question(self, question_id: str) -> dict[str, Any] | None:
        return self.questions.get(question_id)

    def bundle_ids(self) -> list[str]:
        return sorted({str(entity.get("scope", "us")) for entity in self.entities.values()})

    def bundle(self, bundle_id: str) -> dict[str, Any] | None:
        """A bundle is the delivery-layer view of one scope of the flat pool."""
        if bundle_id not in self.bundle_ids():
            return None
        entities = [e for e in self.entities.values() if e.get("scope", "us") == bundle_id]
        entity_ids = {entity["id"] for entity in entities}
        questions = [q for q in self.questions.values() if q["entityId"] in entity_ids]
        labels = {"us": "United States", "world": "World"}
        payload = {
            "id": bundle_id,
            "label": labels.get(bundle_id, bundle_id),
            "scope": bundle_id,
            "entityCount": len(entities),
            "questionCount": len(questions),
            "entities": entities,
            "questions": questions,
            "contentVersion": self.content_version,
        }
        payload["bytes"] = len(json.dumps(payload, ensure_ascii=False).encode())
        payload["etag"] = self.bundle_etag(bundle_id)
        return payload

    def bundle_etag(self, bundle_id: str) -> str:
        """Bundles are immutable per `contentVersion`, so that is the whole etag."""
        return f'"{bundle_id}-{self.content_version}"'

    # -- profiles ---------------------------------------------------------

    def create_profile(
        self,
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
        self.profiles[profile.id] = profile
        return profile

    def profiles_for(self, account_id: str) -> list[ProfileRecord]:
        return [p for p in self.profiles.values() if p.account_id == account_id]

    def profile_for(self, profile_id: str, account_id: str) -> ProfileRecord | None:
        """Scoped lookup: another account's profile is indistinguishable from a
        missing one, so a caller cannot probe for which ids exist."""
        profile = self.profiles.get(profile_id)
        if profile is None or profile.account_id != account_id:
            return None
        return profile

    def delete_profile(self, profile: ProfileRecord) -> None:
        self.profiles.pop(profile.id, None)
        for session_id in [s.id for s in self.sessions.values() if s.profile_id == profile.id]:
            self.sessions.pop(session_id, None)

    # -- sessions ---------------------------------------------------------

    def create_session(self, profile: ProfileRecord, topic: str, level: float) -> SessionRecord:
        session = SessionRecord(
            id=f"s-{int(utc_now().timestamp() * 1000)}-{secrets.token_hex(3)}",
            profile_id=profile.id,
            account_id=profile.account_id,
            topic=topic,
            level=level,
            started_at=utc_now(),
        )
        self.sessions[session.id] = session
        return session

    def session_for(self, session_id: str, account_id: str) -> SessionRecord | None:
        session = self.sessions.get(session_id)
        if session is None or session.account_id != account_id:
            return None
        return session


store = Store()
