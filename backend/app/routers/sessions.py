"""Session endpoints: selection, grading and the summary.

Authenticated and account-scoped, like profiles. The selection and grading
rules live in `selection.py` and `grading.py` — this module is the transport
around them plus the session lifecycle (what is in play, what may be undone,
when a review round is running).
"""

from __future__ import annotations

import copy
import secrets
from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Path, Request, Response, status

from app.auth import Account, current_account
from app.grading import (
    UngradableAnswer,
    apply_answer,
    build_reveal,
    grade,
    summary_headline,
)
from app.levels import clamp_level, level_label
from app.models import (
    AnswerRequest,
    AnswerResult,
    NextQuestionRequest,
    ReviewRoundRequest,
    ReviewRoundResponse,
    ServedQuestion,
    Session,
    SessionSummary,
    StartSessionRequest,
    StartSessionResponse,
)
from app.problems import not_found, problem_exception
from app.selection import pick_question
from app.serializers import profile_payload, served_payload, session_payload
from app.store import (
    AnswerRecord,
    ProfileRecord,
    ServedRecord,
    SessionRecord,
    store,
    utc_now,
)

router = APIRouter(tags=["Sessions"])

CurrentAccount = Annotated[Account, Depends(current_account)]

UNDO_WINDOW = timedelta(seconds=30)


def _require_session(session_id: str, account: Account, request: Request) -> SessionRecord:
    session = store.session_for(session_id, account.id)
    if session is None:
        raise not_found("Session", session_id, request.url.path)
    return session


def _require_active(session: SessionRecord, request: Request) -> None:
    if session.state != "active":
        raise problem_exception(
            409,
            "Session already ended",
            "Start a new session to keep playing.",
            instance=request.url.path,
        )


def _serve_next(
    session: SessionRecord,
    profile: ProfileRecord,
    request: Request,
    *,
    force_review: bool = False,
    include_answer_key: bool = True,
) -> dict[str, Any] | None:
    """Picks, records and renders the next question.

    A repeated call with a question still in play re-serves that same question
    rather than burning a new one — a client retrying a request should not skip
    a child past a question they never saw.
    """
    if session.pending is not None:
        question = store.question(session.pending.question_id)
        if question is not None:
            return served_payload(
                session.pending,
                question,
                store.entity(question["entityId"]),
                include_answer_key=include_answer_key,
            )

    question, is_review = pick_question(
        list(store.questions.values()),
        level=session.level,
        topic=session.topic,
        asked_ids=session.asked_question_ids,
        index=len(session.asked_question_ids),
        review_entity_ids=profile.review_entity_ids(),
        force_review=force_review or session.review_round_remaining > 0,
    )
    if question is None:
        return None

    session.asked_question_ids.append(question["id"])
    served = ServedRecord(
        question_id=question["id"],
        index=len(session.asked_question_ids) - 1,
        is_review=is_review,
    )
    session.pending = served
    return served_payload(
        served,
        question,
        store.entity(question["entityId"]),
        include_answer_key=include_answer_key,
    )


@router.post(
    "/sessions",
    response_model=StartSessionResponse,
    response_model_exclude_unset=True,
    status_code=status.HTTP_201_CREATED,
    summary="Start a session",
)
def start_session(
    request: Request, response: Response, account: CurrentAccount, body: StartSessionRequest
) -> dict[str, Any]:
    profile = store.profile_for(body.profile_id, account.id)
    if profile is None:
        raise not_found("Profile", body.profile_id, request.url.path)

    level = clamp_level(body.level if body.level is not None else profile.last_session_end_level)
    session = store.create_session(profile, topic=body.topic, level=level)
    response.headers["Location"] = f"{request.url.path.rstrip('/')}/{session.id}"

    payload: dict[str, Any] = {"session": session_payload(session)}
    if body.serve_first_question:
        served = _serve_next(session, profile, request)
        if served is not None:
            payload["served"] = served
            payload["session"] = session_payload(session)
    return payload


@router.get("/sessions/{sessionId}", response_model=Session, summary="Fetch session state")
def get_session(
    request: Request, account: CurrentAccount, sessionId: str = Path()
) -> dict[str, Any]:
    return session_payload(_require_session(sessionId, account, request))


@router.post(
    "/sessions/{sessionId}/next-question",
    response_model=ServedQuestion,
    response_model_exclude_unset=True,
    summary="Serve the next question",
)
def serve_next_question(
    request: Request,
    account: CurrentAccount,
    sessionId: str = Path(),
    body: NextQuestionRequest | None = None,
) -> dict[str, Any]:
    session = _require_session(sessionId, account, request)
    _require_active(session, request)
    profile = store.profiles.get(session.profile_id)
    if profile is None:
        raise not_found("Profile", session.profile_id, request.url.path)

    body = body or NextQuestionRequest()
    served = _serve_next(
        session,
        profile,
        request,
        force_review=body.force_review,
        include_answer_key=body.include_answer_key,
    )
    if served is None:
        raise problem_exception(
            409,
            "No question available",
            "The content bank has no question matching this session.",
            instance=request.url.path,
        )
    return served


@router.post(
    "/sessions/{sessionId}/answers",
    response_model=AnswerResult,
    response_model_exclude_unset=True,
    summary="Submit an answer and get the reveal",
)
def submit_answer(
    request: Request,
    account: CurrentAccount,
    body: AnswerRequest,
    sessionId: str = Path(),
) -> dict[str, Any]:
    session = _require_session(sessionId, account, request)
    _require_active(session, request)
    profile = store.profiles.get(session.profile_id)
    if profile is None:
        raise not_found("Profile", session.profile_id, request.url.path)

    question = store.question(body.question_id)
    if question is None:
        raise not_found("Question", body.question_id, request.url.path)

    if session.pending is None or session.pending.question_id != body.question_id:
        raise problem_exception(
            409,
            "Question is not in play",
            "That question has already been answered, or was never served in this session.",
            instance=request.url.path,
        )

    try:
        correct, distance_km = grade(question, choice_index=body.choice_index, pin=body.pin)
    except UngradableAnswer as exc:
        raise problem_exception(
            422,
            "Answer could not be graded",
            exc.reason,
            instance=request.url.path,
            errors=[{"path": "/choiceIndex", "message": exc.reason}],
        ) from exc

    now = utc_now()
    profile_before = copy.deepcopy(profile)
    session_before = session.mutable_state()
    is_review = session.pending.is_review

    effects = apply_answer(
        profile, session, question, correct=correct, is_review=is_review, now=now
    )

    answer = AnswerRecord(
        id=f"a-{secrets.token_hex(6)}",
        question_id=question["id"],
        entity_id=question["entityId"],
        correct=correct,
        answered_at=now,
        is_review=is_review,
        profile_before=profile_before,
        session_before=session_before,
    )
    session.answers.append(answer)

    entity = store.entity(question["entityId"])
    result: dict[str, Any] = {
        "answerId": answer.id,
        "correct": correct,
        "reveal": build_reveal(question, entity, correct=correct),
        "session": session_payload(session),
        "profile": profile_payload(profile),
        "levelChange": effects["levelChange"],
        "prompts": effects["prompts"],
    }
    if "correctIndex" in question:
        result["correctIndex"] = question["correctIndex"]
        choices = question.get("choices") or []
        if 0 <= question["correctIndex"] < len(choices):
            result["correctAnswer"] = choices[question["correctIndex"]]
    if distance_km is not None:
        result["distanceKm"] = round(distance_km, 1)
    return result


@router.delete(
    "/sessions/{sessionId}/answers/{answerId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Undo an accidental answer",
)
def undo_answer(
    request: Request,
    account: CurrentAccount,
    sessionId: str = Path(),
    answerId: str = Path(),
) -> Response:
    session = _require_session(sessionId, account, request)
    _require_active(session, request)

    match = next((answer for answer in session.answers if answer.id == answerId), None)
    if match is None:
        raise not_found("Answer", answerId, request.url.path)
    if match is not session.answers[-1]:
        raise problem_exception(
            409,
            "A later answer exists",
            "Only the most recent answer can be undone.",
            instance=request.url.path,
        )
    if utc_now() - match.answered_at > UNDO_WINDOW:
        raise problem_exception(
            409,
            "Undo window has closed",
            f"An answer can be undone within {int(UNDO_WINDOW.total_seconds())} seconds.",
            instance=request.url.path,
        )

    profile = store.profiles.get(session.profile_id)
    if profile is not None:
        store.profiles[profile.id] = copy.deepcopy(match.profile_before)
    session.restore(match.session_before)
    session.answers.pop()
    # The question goes back to PRESENTING rather than being reselected.
    session.pending = ServedRecord(
        question_id=match.question_id,
        index=session.asked_question_ids.index(match.question_id),
        is_review=match.is_review,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/sessions/{sessionId}/review-round",
    response_model=ReviewRoundResponse,
    response_model_exclude_unset=True,
    summary="Accept the review offer",
)
def start_review_round(
    request: Request,
    account: CurrentAccount,
    sessionId: str = Path(),
    body: ReviewRoundRequest | None = None,
) -> dict[str, Any]:
    session = _require_session(sessionId, account, request)
    _require_active(session, request)
    profile = store.profiles.get(session.profile_id)
    if profile is None:
        raise not_found("Profile", session.profile_id, request.url.path)
    if not profile.review_queue:
        raise problem_exception(
            409,
            "Review queue is empty",
            "There is nothing waiting to review.",
            instance=request.url.path,
        )

    body = body or ReviewRoundRequest()
    session.review_round_remaining = min(body.length, len(profile.review_queue))
    # Whatever was in play is replaced by the review question the child accepted.
    session.pending = None
    served = _serve_next(session, profile, request, force_review=True)
    if served is None:
        raise problem_exception(
            409,
            "Review queue is empty",
            "No question exists for any entity in the review queue.",
            instance=request.url.path,
        )
    return {"served": served, "remaining": max(0, session.review_round_remaining - 1)}


@router.post(
    "/sessions/{sessionId}/end",
    response_model=SessionSummary,
    summary="End the session and get the summary",
)
def end_session(
    request: Request, account: CurrentAccount, sessionId: str = Path()
) -> dict[str, Any]:
    session = _require_session(sessionId, account, request)
    if session.state == "active":
        session.state = "ended"
        session.ended_at = utc_now()
        session.pending = None
        profile = store.profiles.get(session.profile_id)
        if profile is not None:
            profile.last_session_end_level = session.level

    return {
        "sessionId": session.id,
        "answered": session.answered,
        "correct": session.correct,
        "placesSeen": len(session.seen_entity_ids),
        "learnedCount": len(session.learned_entity_ids),
        "learnedEntityIds": list(session.learned_entity_ids),
        "headline": summary_headline(len(session.learned_entity_ids), session.answered),
        "endLevel": session.level,
        "endLevelLabel": level_label(session.level),
    }
