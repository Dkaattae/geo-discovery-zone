"""Pydantic models mirroring `openapi.yaml`.

Field names are snake_case in Python and camelCase on the wire — the alias
generator does the translation, and FastAPI serialises responses by alias.
Optional fields are left *unset* rather than null when a value is genuinely
absent, and the content routes serialise with `exclude_unset`, so "not
applicable or not yet sourced" reads as a missing key rather than a guess.
"""

from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class Schema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="ignore",
    )


Level = Annotated[float, Field(ge=0, le=18)]
AgeBand = Literal[1, 2, 3]


class Scope(StrEnum):
    us = "us"
    world = "world"


class EntityType(StrEnum):
    state = "state"
    country = "country"
    city = "city"
    landmark = "landmark"
    river = "river"
    mountain = "mountain"
    mountain_range = "mountain_range"
    lake = "lake"
    ocean = "ocean"
    continent = "continent"
    region = "region"


class Topic(StrEnum):
    location = "location"
    capital = "capital"
    climate = "climate"
    agriculture = "agriculture"
    wildlife = "wildlife"
    landmark = "landmark"
    size = "size"
    physical = "physical"
    superlative = "superlative"
    elevation = "elevation"


class QuestionFormat(StrEnum):
    map_identify = "map_identify"
    map_click = "map_click"
    multiple_choice = "multiple_choice"
    image = "image"
    ab_compare = "ab_compare"
    pin_pick = "pin_pick"
    pin_drop = "pin_drop"
    drag_order = "drag_order"
    click_profile = "click_profile"


class GeometryLayer(StrEnum):
    us_states = "us-states"
    us_counties = "us-counties"
    world_countries = "world-countries"
    world_land = "world-land"
    rivers = "rivers"
    lakes = "lakes"
    marine = "marine"
    elevation_points = "elevation-points"
    region_polys = "region-polys"


# -- shared -----------------------------------------------------------------


class PageInfo(Schema):
    has_more: bool
    next_cursor: str | None = None
    total: int | None = None


class LevelLabel(Schema):
    level: Level
    grade: int
    band: float
    grade_label: str
    band_label: Literal["Easy", "Medium", "Hard"]
    display: str


class FunFact(Schema):
    text: str
    source_url: str | None = None
    reviewed: bool


class GeometryRef(Schema):
    layer: GeometryLayer
    feature_name: str | None = None
    feature_ids: list[str] | None = None


# -- content ----------------------------------------------------------------


class SourceRef(Schema):
    name: str
    license: str | None = None
    url: str | None = None


class ContentCounts(Schema):
    entities: int | None = None
    questions: int | None = None
    bundles: int | None = None


class ContentVersion(Schema):
    content_version: str
    generated_at: str
    counts: ContentCounts | None = None
    sources: list[SourceRef] | None = None


class Entity(Schema):
    id: str
    type: EntityType
    name: str
    scope: Scope | None = None
    capital: str | None = None
    region: str | None = None
    continent: str | None = None
    geometry_id: str | None = None
    geometry_ref: GeometryRef | None = None
    centroid: list[float] | None = None
    population: int | None = None
    population_rank: int | None = None
    area_rank: int | None = None
    area_km2: float | None = None
    borders: list[str] | None = None
    climate_koppen: list[str] | None = None
    climate_kid: str | None = None
    top_crops: list[str] | None = None
    animals: list[str] | None = None
    landmark: str | None = None
    elevation_m: float | None = None
    length_km: float | None = None
    length_rank: int | None = None
    flows_through: list[str] | None = None
    mouth: str | None = None
    kid_hook: str | None = None
    tiny: bool | None = None
    contested: bool | None = None
    fun_fact: str | None = None
    fun_fact_detail: str | None = None
    fun_facts: list[FunFact] | None = None


class PinTarget(Schema):
    strategy: Literal["polygon_then_centroid", "distance_to_line", "nearest_centroid"]
    geometry_ref: GeometryRef | None = None
    centroid: list[float] | None = None
    max_distance_km: float | None = None
    auto_zoom_bounds: list[list[float]] | None = None


class Question(Schema):
    id: str
    entity_id: str
    format: QuestionFormat
    prompt: str
    level: Level
    template_id: str | None = None
    choices: list[str] | None = None
    correct_index: int | None = None
    rating: float | None = None
    times_answered: int | None = None
    topic: Topic | None = None
    scope: Scope | None = None
    entity_type: EntityType | None = None
    region: str | None = None
    age_band: AgeBand | None = None
    highlight_geometry_id: str | None = None
    image_url: str | None = None
    pin_target: PinTarget | None = None
    elevation_profile_key: str | None = None
    time_limit_s: float | None = None
    reveal: Literal["none", "map_highlight", "profile_highlight", "image"] | None = None
    short_explanation: str | None = None
    detail_explanation: str | None = None
    contested: bool | None = None


class EntityListResponse(Schema):
    data: list[Entity]
    page: PageInfo | None = None


class QuestionListResponse(Schema):
    data: list[Question]
    page: PageInfo | None = None


class BundleSummary(Schema):
    id: str
    label: str
    scope: Scope | None = None
    entity_count: int | None = None
    question_count: int | None = None
    bytes: int | None = None
    etag: str | None = None


class Bundle(BundleSummary):
    content_version: str | None = None
    entities: list[Entity]
    questions: list[Question]


class BundleListResponse(Schema):
    data: list[BundleSummary]


class ElevationMarker(Schema):
    at_km: float
    label: str
    elevation_m: float | None = None


class ElevationProfile(Schema):
    key: str
    label: str
    from_: list[float] = Field(alias="from")
    to: list[float]
    samples: list[float]
    scope: Scope | None = None
    markers: list[ElevationMarker] | None = None
    vertical_exaggeration: float | None = None
    population_overlay: bool | None = None


class ElevationProfileListResponse(Schema):
    data: list[ElevationProfile]


class SuperlativeAxis(Schema):
    id: str
    axis: str
    entity_type: EntityType
    prompt_most: str
    prompt_least: str | None = None
    scope_variants: list[str] | None = None
    reveal: Literal["map_highlight", "none"] | None = None


class SuperlativeAxisListResponse(Schema):
    data: list[SuperlativeAxis]


# -- profiles ---------------------------------------------------------------


class ProfileStats(Schema):
    answered: int
    correct: int
    streak_days: int | None = None


class Profile(Schema):
    id: str
    name: str
    avatar: str
    level: Level
    best_sustained_level: Level
    last_session_end_level: Level
    stats: ProfileStats
    mastery: dict[str, float]
    review_queue: list[str]
    created_at: str | None = None


class ProfileListResponse(Schema):
    data: list[Profile]


class CreateProfileRequest(Schema):
    name: str = Field(min_length=1, max_length=24)
    avatar: str
    grade: int = Field(ge=0, le=8)
    pin: str | None = Field(default=None, pattern=r"^[0-9]{4}$")


class UpdateProfileRequest(Schema):
    name: str | None = Field(default=None, min_length=1, max_length=24)
    avatar: str | None = None
    level: Level | None = None
    last_session_end_level: Level | None = None
    best_sustained_level: Level | None = None
    pin: str | None = Field(default=None, pattern=r"^[0-9]{4}$")
    mastery: dict[str, float] | None = None
    review_queue: list[str] | None = None


class MapProgress(Schema):
    entity_type: EntityType | None = None
    scope: Scope | None = None
    filled: int
    total: int


class ProfileProgress(Schema):
    profile_id: str
    mastery: dict[str, float]
    mastered_entity_ids: list[str]
    mastered_geometry_ids: list[str]
    entities_seen: int
    map_progress: MapProgress
    suggested_levels: list[float]
    review_queue: list[str]


class ReviewQueueEntry(Schema):
    entity_id: str
    name: str | None = None
    clean_passes: int | None = None
    added_at: str | None = None


class ReviewQueue(Schema):
    profile_id: str
    entities: list[ReviewQueueEntry]


class ProfileExport(Schema):
    export_version: int
    profile: Profile
    exported_at: str | None = None


# -- sessions ---------------------------------------------------------------


class StartSessionRequest(Schema):
    profile_id: str
    topic: str = "mixed"
    level: Level | None = None
    serve_first_question: bool = True


class SessionCounts(Schema):
    answered: int
    correct: int
    wrong: int
    correct_streak: int = 0
    wrong_streak: int = 0


class Session(Schema):
    id: str
    profile_id: str
    topic: str
    level: Level
    state: Literal["active", "ended"]
    started_at: str
    counts: SessionCounts
    level_label: LevelLabel | None = None
    ended_at: str | None = None
    asked_question_ids: list[str] = Field(default_factory=list)
    seen_entity_ids: list[str] = Field(default_factory=list)
    learned_entity_ids: list[str] = Field(default_factory=list)
    review_round_remaining: int = 0


class ServedQuestion(Schema):
    question: Question
    is_review: bool
    index: int
    entity: Entity | None = None
    phase: Literal["PRESENTING", "SELECTED", "COMMITTED", "REVEALING"] = "PRESENTING"


class StartSessionResponse(Schema):
    session: Session
    served: ServedQuestion | None = None


class NextQuestionRequest(Schema):
    force_review: bool = False
    include_answer_key: bool = True


class ReviewRoundRequest(Schema):
    length: int = Field(default=5, ge=1, le=5)


class ReviewRoundResponse(Schema):
    served: ServedQuestion
    remaining: int


class AnswerRequest(Schema):
    question_id: str
    choice_index: int | None = None
    pin: list[float] | None = None
    order: list[str] | None = None
    elapsed_ms: int | None = None
    client_answered_at: str | None = None


class Reveal(Schema):
    tone: Literal["reward", "reason"]
    headline: str
    detail: str | None = None
    answer_label: str | None = None
    map_highlight_geometry_id: str | None = None
    source_url: str | None = None
    next_enabled_after_ms: int = 0


class SessionPrompts(Schema):
    milestone: int | None = None
    offer_review: bool = False
    level_dropped_quietly: bool = False


class AnswerResult(Schema):
    answer_id: str
    correct: bool
    reveal: Reveal
    session: Session
    correct_index: int | None = None
    correct_answer: str | None = None
    distance_km: float | None = None
    profile: Profile | None = None
    level_change: float | None = None
    prompts: SessionPrompts | None = None


class SessionSummary(Schema):
    session_id: str
    answered: int
    learned_count: int
    headline: str
    correct: int | None = None
    places_seen: int | None = None
    learned_entity_ids: list[str] | None = None
    end_level: Level | None = None
    end_level_label: LevelLabel | None = None


# -- auth -------------------------------------------------------------------


class RegisterRequest(Schema):
    username: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class TokenRequest(Schema):
    username: str
    password: str


class TokenResponse(Schema):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int


class AccountResponse(Schema):
    id: str
    username: str
    created_at: str


class Problem(Schema):
    """Documentation-only: errors are emitted as plain dicts by `problems.py`."""

    title: str
    status: int
    type: str = "about:blank"
    detail: str | None = None
    instance: str | None = None
    errors: list[dict[str, Any]] | None = None
