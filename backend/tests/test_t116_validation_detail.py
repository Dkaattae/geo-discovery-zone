"""T-116 worker: the validation 422's `detail` is plain English, the rest unchanged."""

from __future__ import annotations

import re

import httpx

from tests.conftest import assert_problem


async def _invalid_create(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> httpx.Response:
    # Missing `name`: FastAPI's request validation, not a handler's own 422.
    return await client.post("/profiles", headers=auth_headers, json={"avatar": "🐢", "grade": 2})


async def test_the_validation_detail_names_no_spec(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    body = assert_problem(await _invalid_create(client, auth_headers), 422)
    detail = body["detail"]
    assert isinstance(detail, str) and detail.strip()
    for word in ("contract", "openapi", "spec", "schema"):
        assert word not in detail.lower()
    assert "not valid" in detail
    assert len(re.findall(r"[.!?](\s|$)", detail)) == 1


async def test_the_rest_of_the_validation_422_is_unchanged(
    client: httpx.AsyncClient, auth_headers: dict[str, str]
) -> None:
    response = await _invalid_create(client, auth_headers)
    body = assert_problem(response, 422)
    assert body["title"] == "Validation failed"
    assert body["instance"].endswith("/profiles")
    assert [error["path"] for error in body["errors"]] == ["/name"]
    assert all(isinstance(error["message"], str) and error["message"] for error in body["errors"])
