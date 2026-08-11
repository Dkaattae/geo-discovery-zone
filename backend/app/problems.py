"""RFC 9457 problem details.

Every error the contract describes is `application/problem+json` with at least
`title` and `status`, so errors are raised through here rather than through a
bare `HTTPException` — FastAPI's default `{"detail": ...}` body does not match
the contract.
"""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from fastapi.responses import JSONResponse

PROBLEM_CONTENT_TYPE = "application/problem+json"


class ProblemException(HTTPException):
    """An HTTPException carrying a full problem document."""

    def __init__(self, status_code: int, problem: dict[str, Any], headers: dict[str, str] | None):
        super().__init__(status_code=status_code, detail=problem.get("title"), headers=headers)
        self.problem = problem


def problem_body(
    status: int,
    title: str,
    detail: str | None = None,
    *,
    type_: str = "about:blank",
    instance: str | None = None,
    errors: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {"type": type_, "title": title, "status": status}
    if detail is not None:
        body["detail"] = detail
    if instance is not None:
        body["instance"] = instance
    if errors:
        body["errors"] = errors
    return body


def problem_exception(
    status: int,
    title: str,
    detail: str | None = None,
    *,
    instance: str | None = None,
    errors: list[dict[str, str]] | None = None,
    headers: dict[str, str] | None = None,
) -> ProblemException:
    return ProblemException(
        status,
        problem_body(status, title, detail, instance=instance, errors=errors),
        headers,
    )


def problem_response(
    problem: dict[str, Any], headers: dict[str, str] | None = None
) -> JSONResponse:
    return JSONResponse(
        status_code=int(problem["status"]),
        content=problem,
        media_type=PROBLEM_CONTENT_TYPE,
        headers=headers,
    )


def not_found(resource: str, resource_id: str, instance: str | None = None) -> ProblemException:
    return problem_exception(
        404,
        f"{resource} not found",
        f"No {resource.lower()} with id {resource_id!r}.",
        instance=instance,
    )
