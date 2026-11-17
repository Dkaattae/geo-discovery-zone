"""T-116 tester: the validation 422, criteria 3 and 4.

Written from the brief's criteria, not from the implementation. The `errors`
entries below were recorded by running the same requests against `origin/main`
(before the change) through the same ASGI client; criterion 4 says they must
not move. Criterion 3 leaves the wording to the worker, so it is checked by its
bounds only: no forbidden word, one non-empty sentence, says "not valid".
"""

from __future__ import annotations

import re
from typing import Any

import httpx
import pytest

from app.main import API_PREFIX

# (case, request kwargs, path, expected `errors` as recorded on main)
CASES: list[tuple[str, str, str, dict[str, Any], list[dict[str, str]]]] = [
    (
        "missing_field",
        "POST",
        "/profiles",
        {"json": {"avatar": "🐢", "grade": 2}},
        [{"path": "/name", "message": "Field required"}],
    ),
    (
        "body_not_json",
        "POST",
        "/profiles",
        {"content": b"{not json", "headers": {"content-type": "application/json"}},
        [{"path": "/1", "message": "JSON decode error"}],
    ),
    (
        "wrong_types",
        "POST",
        "/profiles",
        {"json": {"name": 5, "avatar": "🐢", "grade": "x"}},
        [
            {"path": "/name", "message": "Input should be a valid string"},
            {
                "path": "/grade",
                "message": "Input should be a valid integer, unable to parse string as an integer",
            },
        ],
    ),
    (
        "empty_body",
        "POST",
        "/profiles",
        {"json": {}},
        [
            {"path": "/name", "message": "Field required"},
            {"path": "/avatar", "message": "Field required"},
            {"path": "/grade", "message": "Field required"},
        ],
    ),
    (
        "bad_query_param",
        "GET",
        "/entities",
        {"params": {"limit": "abc"}},
        [
            {
                "path": "/limit",
                "message": "Input should be a valid integer, unable to parse string as an integer",
            }
        ],
    ),
]

IDS = [case[0] for case in CASES]


async def _send(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    method: str,
    path: str,
    kwargs: dict[str, Any],
) -> httpx.Response:
    kwargs = dict(kwargs)
    headers = dict(auth_headers)
    headers.update(kwargs.pop("headers", {}))
    return await client.request(method, path, headers=headers, **kwargs)


@pytest.mark.parametrize(("case", "method", "path", "kwargs", "errors"), CASES, ids=IDS)
async def test_criterion_3_validation_detail_is_one_plain_sentence_saying_not_valid(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    case: str,
    method: str,
    path: str,
    kwargs: dict[str, Any],
    errors: list[dict[str, str]],
) -> None:
    body = (await _send(client, auth_headers, method, path, kwargs)).json()
    detail = body["detail"]
    assert isinstance(detail, str) and detail.strip()
    lowered = detail.lower()
    for word in ("contract", "openapi", "spec", "schema"):
        assert word not in lowered, f"{word!r} in {detail!r}"
    # Says the request was not valid.
    assert "not valid" in lowered or "invalid" in lowered, detail
    # A single sentence: exactly one terminator, and it ends the string.
    assert re.fullmatch(r"[^.!?]+[.!?]", detail.strip()), detail
    # Plain English: letters, spaces and ordinary punctuation only.
    assert re.fullmatch(r"[A-Za-z ,'.!?-]+", detail), detail


@pytest.mark.parametrize(("case", "method", "path", "kwargs", "errors"), CASES, ids=IDS)
async def test_criterion_4_rest_of_validation_422_is_unchanged(
    client: httpx.AsyncClient,
    auth_headers: dict[str, str],
    case: str,
    method: str,
    path: str,
    kwargs: dict[str, Any],
    errors: list[dict[str, str]],
) -> None:
    response = await _send(client, auth_headers, method, path, kwargs)
    assert response.status_code == 422
    assert response.headers["content-type"] == "application/problem+json"
    body = response.json()
    assert body["status"] == 422
    assert body["title"] == "Validation failed"
    assert body["type"] == "about:blank"
    assert body["instance"] == f"{API_PREFIX}{path}"
    assert body["errors"] == errors
    assert set(body) == {"type", "title", "status", "detail", "instance", "errors"}
