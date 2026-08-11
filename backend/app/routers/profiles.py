"""Profile endpoints.

These hold children's data, so every one of them requires a bearer token and
every lookup is scoped to the calling account. A profile belonging to someone
else answers 404, not 403 — an account cannot probe for which profile ids
exist.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Path, Request, Response, status

from app.auth import Account, current_account, hash_password
from app.models import (
    CreateProfileRequest,
    Profile,
    ProfileExport,
    ProfileListResponse,
    ProfileProgress,
    ReviewQueue,
    UpdateProfileRequest,
)
from app.problems import not_found, problem_exception
from app.serializers import profile_payload, progress_payload, review_queue_payload
from app.store import REVIEW_QUEUE_MAX, ProfileRecord, ReviewItem, iso, store, utc_now

router = APIRouter(tags=["Profiles"])

CurrentAccount = Annotated[Account, Depends(current_account)]

PIN_MIN_GRADE = 4


def _require_profile(profile_id: str, account: Account, request: Request) -> ProfileRecord:
    profile = store.profile_for(profile_id, account.id)
    if profile is None:
        raise not_found("Profile", profile_id, request.url.path)
    return profile


@router.get("/profiles", response_model=ProfileListResponse, summary="List profiles")
def list_profiles(account: CurrentAccount) -> dict[str, Any]:
    profiles = sorted(store.profiles_for(account.id), key=lambda p: p.created_at)
    return {"data": [profile_payload(profile) for profile in profiles]}


@router.post(
    "/profiles",
    response_model=Profile,
    status_code=status.HTTP_201_CREATED,
    summary="Create a profile",
)
def create_profile(
    request: Request, response: Response, account: CurrentAccount, body: CreateProfileRequest
) -> dict[str, Any]:
    if body.pin is not None and body.grade < PIN_MIN_GRADE:
        # A kindergartener cannot manage a PIN; the profile picker is the answer
        # for younger kids.
        raise problem_exception(
            422,
            "PIN not offered below grade 4",
            "Leave `pin` unset for a profile in grade 3 or below.",
            instance=request.url.path,
            errors=[{"path": "/pin", "message": "only offered from grade 4 up"}],
        )
    profile = store.create_profile(
        account_id=account.id,
        name=body.name,
        avatar=body.avatar,
        grade=body.grade,
        pin_hash=hash_password(body.pin) if body.pin else None,
    )
    response.headers["Location"] = f"{request.url.path.rstrip('/')}/{profile.id}"
    return profile_payload(profile)


@router.get("/profiles/{profileId}", response_model=Profile, summary="Fetch a profile")
def get_profile(
    request: Request, account: CurrentAccount, profileId: str = Path()
) -> dict[str, Any]:
    return profile_payload(_require_profile(profileId, account, request))


@router.patch("/profiles/{profileId}", response_model=Profile, summary="Update a profile")
def update_profile(
    request: Request,
    account: CurrentAccount,
    body: UpdateProfileRequest,
    profileId: str = Path(),
) -> dict[str, Any]:
    profile = _require_profile(profileId, account, request)
    fields = body.model_dump(exclude_unset=True, by_alias=False)

    if "name" in fields and fields["name"] is not None:
        profile.name = fields["name"]
    if "avatar" in fields and fields["avatar"] is not None:
        profile.avatar = fields["avatar"]
    if "level" in fields and fields["level"] is not None:
        profile.level = float(fields["level"])
    if "last_session_end_level" in fields and fields["last_session_end_level"] is not None:
        profile.last_session_end_level = float(fields["last_session_end_level"])
    if "best_sustained_level" in fields and fields["best_sustained_level"] is not None:
        profile.best_sustained_level = float(fields["best_sustained_level"])
    if "pin" in fields:
        profile.pin_hash = hash_password(fields["pin"]) if fields["pin"] else None
    if "mastery" in fields and fields["mastery"] is not None:
        _validate_mastery(fields["mastery"], request)
        profile.mastery = {key: float(value) for key, value in fields["mastery"].items()}
    if "review_queue" in fields and fields["review_queue"] is not None:
        _replace_review_queue(profile, fields["review_queue"], request)
    return profile_payload(profile)


def _validate_mastery(mastery: dict[str, float], request: Request) -> None:
    bad = [key for key, value in mastery.items() if not 0.0 <= float(value) <= 1.0]
    if bad:
        raise problem_exception(
            422,
            "Mastery out of range",
            "Mastery values are 0.0 to 1.0.",
            instance=request.url.path,
            errors=[
                {"path": f"/mastery/{key}", "message": "must be between 0 and 1"} for key in bad
            ],
        )


def _replace_review_queue(profile: ProfileRecord, entity_ids: list[str], request: Request) -> None:
    if len(entity_ids) > REVIEW_QUEUE_MAX:
        raise problem_exception(
            422,
            "Review queue too long",
            f"The review queue holds at most {REVIEW_QUEUE_MAX} entities.",
            instance=request.url.path,
            errors=[{"path": "/reviewQueue", "message": f"at most {REVIEW_QUEUE_MAX} entries"}],
        )
    existing = {item.entity_id: item for item in profile.review_queue}
    now = utc_now()
    profile.review_queue = [
        existing.get(entity_id, ReviewItem(entity_id=entity_id, added_at=now))
        for entity_id in entity_ids
    ]


@router.delete(
    "/profiles/{profileId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a profile and its history",
)
def delete_profile(request: Request, account: CurrentAccount, profileId: str = Path()) -> Response:
    store.delete_profile(_require_profile(profileId, account, request))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/profiles/{profileId}/progress",
    response_model=ProfileProgress,
    summary="Mastery and map progress",
)
def get_progress(
    request: Request, account: CurrentAccount, profileId: str = Path()
) -> dict[str, Any]:
    profile = _require_profile(profileId, account, request)
    return progress_payload(profile, store.entities)


@router.get(
    "/profiles/{profileId}/review-queue",
    response_model=ReviewQueue,
    summary="Entities queued for review",
)
def get_review_queue(
    request: Request, account: CurrentAccount, profileId: str = Path()
) -> dict[str, Any]:
    profile = _require_profile(profileId, account, request)
    return review_queue_payload(profile, store.entities)


@router.delete(
    "/profiles/{profileId}/review-queue/{entityId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Drop an entity from the review queue",
)
def remove_from_review_queue(
    request: Request,
    account: CurrentAccount,
    profileId: str = Path(),
    entityId: str = Path(),
) -> Response:
    profile = _require_profile(profileId, account, request)
    remaining = [item for item in profile.review_queue if item.entity_id != entityId]
    if len(remaining) == len(profile.review_queue):
        raise not_found("Review queue entry", entityId, request.url.path)
    profile.review_queue = remaining
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/profiles/{profileId}/export",
    response_model=ProfileExport,
    summary="Export a profile as JSON",
)
def export_profile(
    request: Request, account: CurrentAccount, profileId: str = Path()
) -> dict[str, Any]:
    profile = _require_profile(profileId, account, request)
    return {
        "exportVersion": 1,
        "exportedAt": iso(utc_now()),
        "profile": profile_payload(profile),
    }


@router.post(
    "/profiles/import",
    response_model=Profile,
    status_code=status.HTTP_201_CREATED,
    summary="Import a previously exported profile",
)
def import_profile(
    request: Request, response: Response, account: CurrentAccount, body: ProfileExport
) -> dict[str, Any]:
    incoming = body.profile
    profile = store.create_profile(
        account_id=account.id,
        name=incoming.name,
        avatar=incoming.avatar,
        grade=0,
    )
    profile.level = float(incoming.level)
    profile.best_sustained_level = float(incoming.best_sustained_level)
    profile.last_session_end_level = float(incoming.last_session_end_level)
    profile.answered = incoming.stats.answered
    profile.correct = incoming.stats.correct
    profile.streak_days = incoming.stats.streak_days or 0
    _validate_mastery(incoming.mastery, request)
    profile.mastery = dict(incoming.mastery)
    _replace_review_queue(profile, incoming.review_queue, request)
    # A fresh id is always assigned: the import lands in this account, and the
    # exported id may still be live on the device it came from.
    response.headers["Location"] = f"/profiles/{profile.id}"
    return profile_payload(profile)
