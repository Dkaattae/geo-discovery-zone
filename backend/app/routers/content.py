"""Content endpoints — read-only, no user data, no authentication.

This is the group the contract calls "worth implementing first": a static file
host satisfies it, so nothing here touches profiles, sessions or tokens.

Array query parameters are comma-separated (`style: form, explode: false` in
the contract), so `?type=state,country` is one parameter, not two.
"""

from __future__ import annotations

import base64
import binascii
from typing import Annotated, Any

from fastapi import APIRouter, Header, Path, Query, Request, Response

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
from app.store import store

router = APIRouter(tags=["Content"])

DEFAULT_LEVEL_SPAN = 1.5


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


def _paginate(rows: list[Any], offset: int, limit: int) -> tuple[list[Any], dict[str, Any]]:
    page = rows[offset : offset + limit]
    has_more = offset + limit < len(rows)
    return page, {
        "hasMore": has_more,
        "nextCursor": _encode_cursor(offset + limit) if has_more else None,
        "total": len(rows),
    }


@router.get("/content/version", response_model=ContentVersion, summary="Current content build")
def get_content_version() -> dict[str, Any]:
    return {
        "contentVersion": store.content_version,
        "generatedAt": store.generated_at,
        "counts": {
            "entities": len(store.entities),
            "questions": len(store.questions),
            "bundles": len(store.bundle_ids()),
        },
        "sources": store.sources,
    }


@router.get(
    "/entities",
    response_model=EntityListResponse,
    response_model_exclude_unset=True,
    summary="List entities",
)
def list_entities(
    request: Request,
    scope: str | None = None,
    type: str | None = None,
    region: str | None = None,
    ids: str | None = None,
    q: str | None = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    cursor: str | None = None,
) -> dict[str, Any]:
    types = _csv(type)
    wanted_ids = _csv(ids)
    rows = list(store.entities.values())

    if scope:
        rows = [e for e in rows if e.get("scope") == scope]
    if types:
        rows = [e for e in rows if e.get("type") in types]
    if region:
        rows = [e for e in rows if _slug(e.get("region")) == _slug(region)]
    if wanted_ids is not None:
        rows = [e for e in rows if e["id"] in set(wanted_ids)]
    if q:
        needle = q.casefold()
        rows = [e for e in rows if needle in e["name"].casefold()]

    rows.sort(key=lambda entity: entity["id"])
    page, page_info = _paginate(rows, _decode_cursor(cursor, request), limit)
    return {"data": page, "page": page_info}


@router.get(
    "/entities/{entityId}",
    response_model=Entity,
    response_model_exclude_unset=True,
    summary="Fetch one entity",
)
def get_entity(request: Request, entityId: str = Path()) -> dict[str, Any]:
    entity = store.entity(entityId)
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
    rows = list(store.questions.values())
    entity_types = _csv(entityType)
    entity_ids = _csv(entityId)
    topics = _csv(topic)
    formats = _csv(format)
    excluded = set(_csv(exclude) or [])

    if scope:
        rows = [q for q in rows if q.get("scope") == scope]
    if entity_types:
        rows = [q for q in rows if q.get("entityType") in entity_types]
    if entity_ids:
        rows = [q for q in rows if q["entityId"] in set(entity_ids)]
    if topics:
        rows = [q for q in rows if q.get("topic") in topics]
    if formats:
        rows = [q for q in rows if q.get("format") in formats]
    if region:
        rows = [q for q in rows if _slug(q.get("region")) == _slug(region)]
    if minAgeBand is not None:
        rows = [q for q in rows if (q.get("ageBand") or 1) >= minAgeBand]
    if maxAgeBand is not None:
        rows = [q for q in rows if (q.get("ageBand") or 3) <= maxAgeBand]
    if level is not None:
        rows = [q for q in rows if abs(q["level"] - level) <= levelSpan]
    if excluded:
        rows = [q for q in rows if q["id"] not in excluded]

    rows.sort(key=lambda question: question["id"])
    page, page_info = _paginate(rows, _decode_cursor(cursor, request), limit)
    return {
        "data": [question_payload(q, include_answer_key=includeAnswerKey) for q in page],
        "page": page_info,
    }


@router.get(
    "/questions/{questionId}",
    response_model=Question,
    response_model_exclude_unset=True,
    summary="Fetch one question",
)
def get_question(
    request: Request, questionId: str = Path(), includeAnswerKey: bool = True
) -> dict[str, Any]:
    question = store.question(questionId)
    if question is None:
        raise not_found("Question", questionId, request.url.path)
    return question_payload(question, include_answer_key=includeAnswerKey)


@router.get(
    "/bundles",
    response_model=BundleListResponse,
    response_model_exclude_unset=True,
    summary="List lazy-load content bundles",
)
def list_bundles() -> dict[str, Any]:
    summaries = []
    for bundle_id in store.bundle_ids():
        bundle = store.bundle(bundle_id)
        if bundle is None:
            continue
        summaries.append({key: bundle[key] for key in BUNDLE_SUMMARY_KEYS if key in bundle})
    return {"data": summaries}


BUNDLE_SUMMARY_KEYS = ("id", "label", "scope", "entityCount", "questionCount", "bytes", "etag")


@router.get(
    "/bundles/{bundleId}",
    response_model=Bundle,
    response_model_exclude_unset=True,
    summary="Fetch a content bundle",
)
def get_bundle(
    request: Request,
    response: Response,
    bundleId: str = Path(),
    includeAnswerKey: bool = True,
    if_none_match: Annotated[str | None, Header(alias="If-None-Match")] = None,
) -> Any:
    bundle = store.bundle(bundleId)
    if bundle is None:
        raise not_found("Bundle", bundleId, request.url.path)

    etag = bundle["etag"]
    # Bundles are immutable per contentVersion, so a matching etag is always fresh.
    if if_none_match and etag in {tag.strip() for tag in if_none_match.split(",")}:
        return Response(status_code=304, headers={"ETag": etag})

    response.headers["ETag"] = etag
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
    topology = store.geometry.get(f"{layer.value}:{detail}") or store.geometry.get(layer.value)
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
    rows = list(store.elevation_profiles.values())
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
    profile = store.elevation_profiles.get(profileKey)
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
    rows = list(store.superlative_axes)
    if entityType:
        rows = [axis for axis in rows if axis.get("entityType") == entityType]
    return {"data": rows}


def _slug(value: str | None) -> str | None:
    """`Mountain West` and `mountain-west` are the same region."""
    if value is None:
        return None
    return value.strip().casefold().replace(" ", "-")
