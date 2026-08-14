"""Content endpoints — read-only, no user data, no authentication.

This is the group the contract calls "worth implementing first": a static file
host satisfies it, so nothing here touches profiles, sessions or tokens.

Array query parameters are comma-separated (`style: form, explode: false` in
the contract), so `?type=state,country` is one parameter, not two. Filtering
runs as SQL; these handlers translate query strings into store calls.
"""

from __future__ import annotations

import base64
import binascii
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, Path, Query, Request, Response
from sqlalchemy.orm import Session

from app import store
from app.db import get_db
from app.models import (
    Bundle,
    BundleListResponse,
    ContentVersion,
    ElevationProfile,
    ElevationProfileListResponse,
    Entity,
    EntityListResponse,
    GeometryLayer,
    Question,
    QuestionListResponse,
    SuperlativeAxisListResponse,
)
from app.problems import not_found, problem_exception
from app.serializers import question_payload

router = APIRouter(tags=["Content"])

Db = Annotated[Session, Depends(get_db)]

DEFAULT_LEVEL_SPAN = 1.5

# Elevation profiles, superlative axes and vector geometry need sampled or
# licensed source data this repo does not carry yet. Serving invented numbers to
# children is worse than serving none, so these stay empty and say so.
ELEVATION_PROFILES: list[dict[str, Any]] = []
SUPERLATIVE_AXES: list[dict[str, Any]] = []
GEOMETRY_LAYERS: dict[str, dict[str, Any]] = {}


def _csv(value: str | None) -> list[str] | None:
    if value is None:
        return None
    return [part.strip() for part in value.split(",") if part.strip()]


def _encode_cursor(offset: int) -> str:
    return base64.urlsafe_b64encode(f"o:{offset}".encode()).decode().rstrip("=")


def _decode_cursor(cursor: str | None, request: Request) -> int:
    if not cursor:
        return 0
    padded = cursor + "=" * (-len(cursor) % 4)
    try:
        decoded = base64.urlsafe_b64decode(padded.encode()).decode()
        prefix, offset = decoded.split(":", 1)
        if prefix != "o":
            raise ValueError(prefix)
        return max(0, int(offset))
    except (ValueError, UnicodeDecodeError, binascii.Error) as exc:
        raise problem_exception(
            422,
            "Invalid cursor",
            "`cursor` must be a value returned in `page.nextCursor`.",
            instance=request.url.path,
            errors=[{"path": "/cursor", "message": "not a cursor this server issued"}],
        ) from exc


def _page_info(offset: int, limit: int, total: int) -> dict[str, Any]:
    has_more = offset + limit < total
    return {
        "hasMore": has_more,
        "nextCursor": _encode_cursor(offset + limit) if has_more else None,
        "total": total,
    }


@router.get("/content/version", response_model=ContentVersion, summary="Current content build")
def get_content_version(db: Db) -> dict[str, Any]:
    meta = store.content_meta(db)
    entities, questions = store.content_counts(db)
    return {
        "contentVersion": meta.content_version if meta else "unseeded",
        "generatedAt": meta.generated_at if meta else "1970-01-01T00:00:00Z",
        "counts": {
            "entities": entities,
            "questions": questions,
            "bundles": len(store.bundle_ids(db)),
        },
        "sources": meta.sources if meta else [],
    }


@router.get(
    "/entities",
    response_model=EntityListResponse,
    response_model_exclude_unset=True,
    summary="List entities",
)
def list_entities(
    request: Request,
    db: Db,
    scope: str | None = None,
    type: str | None = None,
    region: str | None = None,
    ids: str | None = None,
    q: str | None = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    cursor: str | None = None,
) -> dict[str, Any]:
    offset = _decode_cursor(cursor, request)
    rows, total = store.list_entities(
        db,
        scope=scope,
        types=_csv(type),
        region_slug=store.slug(region),
        ids=_csv(ids),
        query=q,
        offset=offset,
        limit=limit,
    )
    return {"data": rows, "page": _page_info(offset, limit, total)}


@router.get(
    "/entities/{entityId}",
    response_model=Entity,
    response_model_exclude_unset=True,
    summary="Fetch one entity",
)
def get_entity(request: Request, db: Db, entityId: str = Path()) -> dict[str, Any]:
    entity = store.entity(db, entityId)
    if entity is None:
        raise not_found("Entity", entityId, request.url.path)
    return entity


@router.get(
    "/questions",
    response_model=QuestionListResponse,
    response_model_exclude_unset=True,
    summary="List questions",
)
def list_questions(
    request: Request,
    db: Db,
    scope: str | None = None,
    entityType: str | None = None,
    entityId: str | None = None,
    topic: str | None = None,
    format: str | None = None,
    region: str | None = None,
    minAgeBand: int | None = None,
    maxAgeBand: int | None = None,
    level: float | None = None,
    levelSpan: Annotated[float, Query(ge=0)] = DEFAULT_LEVEL_SPAN,
    exclude: str | None = None,
    includeAnswerKey: bool = True,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    cursor: str | None = None,
) -> dict[str, Any]:
    offset = _decode_cursor(cursor, request)
    rows, total = store.list_questions(
        db,
        scope=scope,
        entity_types=_csv(entityType),
        entity_ids=_csv(entityId),
        topics=_csv(topic),
        formats=_csv(format),
        region_slug=store.slug(region),
        min_age_band=minAgeBand,
        max_age_band=maxAgeBand,
        level=level,
        level_span=levelSpan,
        exclude=_csv(exclude) or [],
        offset=offset,
        limit=limit,
    )
    return {
        "data": [question_payload(row, include_answer_key=includeAnswerKey) for row in rows],
        "page": _page_info(offset, limit, total),
    }


@router.get(
    "/questions/{questionId}",
    response_model=Question,
    response_model_exclude_unset=True,
    summary="Fetch one question",
)
def get_question(
    request: Request, db: Db, questionId: str = Path(), includeAnswerKey: bool = True
) -> dict[str, Any]:
    question = store.question(db, questionId)
    if question is None:
        raise not_found("Question", questionId, request.url.path)
    return question_payload(question, include_answer_key=includeAnswerKey)


BUNDLE_SUMMARY_KEYS = ("id", "label", "scope", "entityCount", "questionCount", "bytes", "etag")


@router.get(
    "/bundles",
    response_model=BundleListResponse,
    response_model_exclude_unset=True,
    summary="List lazy-load content bundles",
)
def list_bundles(db: Db) -> dict[str, Any]:
    summaries = []
    for bundle_id in store.bundle_ids(db):
        bundle = store.bundle(db, bundle_id)
        if bundle is None:
            continue
        summaries.append({key: bundle[key] for key in BUNDLE_SUMMARY_KEYS if key in bundle})
    return {"data": summaries}


@router.get(
    "/bundles/{bundleId}",
    response_model=Bundle,
    response_model_exclude_unset=True,
    summary="Fetch a content bundle",
)
def get_bundle(
    request: Request,
    response: Response,
    db: Db,
    bundleId: str = Path(),
    includeAnswerKey: bool = True,
    if_none_match: Annotated[str | None, Header(alias="If-None-Match")] = None,
) -> Any:
    etag = store.bundle_etag(db, bundleId)
    # Bundles are immutable per contentVersion, so a matching etag is always fresh.
    if if_none_match and etag in {tag.strip() for tag in if_none_match.split(",")}:
        return Response(status_code=304, headers={"ETag": etag})

    bundle = store.bundle(db, bundleId)
    if bundle is None:
        raise not_found("Bundle", bundleId, request.url.path)

    response.headers["ETag"] = bundle["etag"]
    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    bundle = dict(bundle)
    bundle["questions"] = [
        question_payload(q, include_answer_key=includeAnswerKey) for q in bundle["questions"]
    ]
    return bundle


@router.get("/geometry/{layer}", summary="Fetch a TopoJSON geometry layer")
def get_geometry(
    request: Request,
    layer: GeometryLayer,
    detail: str = Query(default="110m", pattern="^(110m|50m|10m)$"),
) -> dict[str, Any]:
    topology = GEOMETRY_LAYERS.get(f"{layer.value}:{detail}") or GEOMETRY_LAYERS.get(layer.value)
    if topology is None:
        raise problem_exception(
            404,
            "Geometry layer not available",
            (
                f"No {detail} topology is loaded for '{layer.value}'. Vector layers ship as "
                "build artefacts (Census TIGER for US layers, Natural Earth for world "
                "layers); the v1 client bundles us-atlas at build time instead."
            ),
            instance=request.url.path,
        )
    return topology


@router.get(
    "/elevation-profiles",
    response_model=ElevationProfileListResponse,
    response_model_exclude_unset=True,
    summary="List precomputed elevation cross-sections",
)
def list_elevation_profiles(scope: str | None = None) -> dict[str, Any]:
    rows = ELEVATION_PROFILES
    if scope:
        rows = [profile for profile in rows if profile.get("scope") == scope]
    return {"data": rows}


@router.get(
    "/elevation-profiles/{profileKey}",
    response_model=ElevationProfile,
    response_model_exclude_unset=True,
    summary="Fetch one elevation cross-section",
)
def get_elevation_profile(request: Request, profileKey: str = Path()) -> dict[str, Any]:
    profile = next((row for row in ELEVATION_PROFILES if row.get("key") == profileKey), None)
    if profile is None:
        raise not_found("Elevation profile", profileKey, request.url.path)
    return profile


@router.get(
    "/superlative-axes",
    response_model=SuperlativeAxisListResponse,
    response_model_exclude_unset=True,
    summary="List superlative axes",
)
def list_superlative_axes(entityType: str | None = None) -> dict[str, Any]:
    rows = SUPERLATIVE_AXES
    if entityType:
        rows = [axis for axis in rows if axis.get("entityType") == entityType]
    return {"data": rows}
