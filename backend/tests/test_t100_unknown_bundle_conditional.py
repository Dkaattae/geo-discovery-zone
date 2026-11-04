"""T-100 worker: an unknown bundle is a 404 whatever `If-None-Match` says.

`get_bundle` used to answer the conditional check before checking the bundle
existed, and `store.bundle_etag` mints a tag for any id, so `GET /bundles/zz`
with `If-None-Match: "zz-<cv>"` was a 304. These pin the fix and the cheapness
of the known-bundle 304 that the fix must not cost.
"""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import httpx
import pytest
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.orm import ContentMeta
from tests.conftest import assert_problem

KEYED = {"includeAnswerKey": "true"}


def version(db_session: Session) -> str:
    meta = db_session.get(ContentMeta, 1)
    assert meta is not None
    return meta.content_version


async def get(
    client: httpx.AsyncClient, bundle: str, *, keyed: bool, if_none_match: str
) -> httpx.Response:
    return await client.get(
        f"/bundles/{bundle}",
        params=KEYED if keyed else {},
        headers={"If-None-Match": if_none_match},
    )


def unknown_tags(cv: str) -> list[tuple[bool, str]]:
    return [
        (False, f'"zz-{cv}"'),
        (True, f'"zz-{cv}-key"'),
        (False, f'"zz-{cv}-key"'),
        (True, f'"zz-{cv}"'),
        (False, f'"zz-old", "zz-{cv}"'),
        (True, f'"zz-old", "zz-{cv}-key"'),
        (False, "*"),
        (True, "*"),
    ]


async def test_an_unknown_bundle_is_a_404_whatever_if_none_match_says(
    client: httpx.AsyncClient, db_session: Session
) -> None:
    for keyed, tag in unknown_tags(version(db_session)):
        response = await get(client, "zz", keyed=keyed, if_none_match=tag)
        assert_problem(response, 404)
        assert "etag" not in response.headers, (keyed, tag)
        assert "immutable" not in response.headers.get("cache-control", ""), (keyed, tag)


async def test_a_matching_tag_for_a_known_bundle_is_still_a_304(
    client: httpx.AsyncClient,
) -> None:
    for keyed in (False, True):
        tag = (await client.get("/bundles/us", params=KEYED if keyed else {})).headers["etag"]
        for header in (tag, f'"us-old", {tag}'):
            response = await get(client, "us", keyed=keyed, if_none_match=header)
            assert response.status_code == 304
            assert response.content == b""
            assert response.headers["etag"] == tag


@pytest.fixture
def statements(engine: Engine) -> Iterator[list[str]]:
    seen: list[str] = []

    def record(*args: Any) -> None:
        seen.append(args[2])

    event.listen(engine, "before_cursor_execute", record)
    try:
        yield seen
    finally:
        event.remove(engine, "before_cursor_execute", record)


async def test_a_known_bundle_304_does_not_read_questions(
    client: httpx.AsyncClient, statements: list[str]
) -> None:
    for keyed in (False, True):
        tag = (await client.get("/bundles/us", params=KEYED if keyed else {})).headers["etag"]
        statements.clear()
        response = await get(client, "us", keyed=keyed, if_none_match=tag)
        assert response.status_code == 304
        assert statements, "the listener saw nothing; it is not observing the request"
        assert not [s for s in statements if "questions" in s.lower()], statements


def _api_routes(routes: list[Any]) -> Iterator[Any]:
    """FastAPI 0.141 wraps each `include_router` in an `_IncludedRouter`, so the
    `APIRoute`s sit under `original_router`, not directly in `app.routes`."""
    from fastapi.routing import APIRoute

    for route in routes:
        if isinstance(route, APIRoute):
            yield route
        inner = getattr(route, "original_router", None)
        if inner is not None:
            yield from _api_routes(inner.routes)


def test_the_bundle_route_no_longer_carries_an_inert_exclude_unset() -> None:
    from app.main import app
    from app.models import Bundle

    routes = [r for r in _api_routes(app.routes) if r.path.endswith("/bundles/{bundleId}")]
    assert len(routes) == 1
    assert routes[0].response_model_exclude_unset is False
    assert routes[0].response_model is Bundle
