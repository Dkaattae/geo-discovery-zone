"""T-100 tester: one test (or more) per acceptance criterion.

Expected values come from the brief's criteria, not from the implementation.
"Unknown bundle" is `zz`; `<cv>` is the seeded `ContentMeta.content_version`;
"unkeyed" has no `includeAnswerKey`, "keyed" has `includeAnswerKey=true`.

Criteria 9-11 (no pre-existing test changed, no dependency change, no contract /
migration / plan / data change) are file-boundary checks, recorded by hand in the
brief's Verdict rather than pinned against a fixed commit (E-11, E-12). Criterion
12 holds because every test here uses only the in-process `client`,
`db_session` and `engine` fixtures; the suite was also run with the proxy
variables pointed at `http://127.0.0.1:1`, as CI does.
"""

from __future__ import annotations

import re
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
CACHE_CONTROL = "public, max-age=31536000, immutable"


def cv_of(db_session: Session) -> str:
    meta = db_session.get(ContentMeta, 1)
    assert meta is not None
    return meta.content_version


async def fetch(
    client: httpx.AsyncClient,
    bundle: str,
    *,
    keyed: bool,
    if_none_match: str | None = None,
) -> httpx.Response:
    headers = {"If-None-Match": if_none_match} if if_none_match is not None else {}
    return await client.get(f"/bundles/{bundle}", params=KEYED if keyed else {}, headers=headers)


def assert_uncacheable_404(response: httpx.Response, case: object) -> None:
    assert_problem(response, 404)
    assert "etag" not in response.headers, case
    assert "immutable" not in response.headers.get("cache-control", ""), case


# -- 1 ------------------------------------------------------------------------


async def test_c1_unknown_bundle_with_its_own_unkeyed_tag_is_404(
    client: httpx.AsyncClient, db_session: Session
) -> None:
    cv = cv_of(db_session)
    response = await fetch(client, "zz", keyed=False, if_none_match=f'"zz-{cv}"')
    assert_problem(response, 404)


async def test_c1_unknown_bundle_with_its_own_keyed_tag_is_404(
    client: httpx.AsyncClient, db_session: Session
) -> None:
    cv = cv_of(db_session)
    response = await fetch(client, "zz", keyed=True, if_none_match=f'"zz-{cv}-key"')
    assert_problem(response, 404)


# -- 2 ------------------------------------------------------------------------


def criterion_2_cases(cv: str) -> list[tuple[bool, str]]:
    return [
        (False, f'"zz-{cv}-key"'),
        (True, f'"zz-{cv}"'),
        (False, f'"zz-old", "zz-{cv}"'),
        (True, f'"zz-old", "zz-{cv}-key"'),
        (False, "*"),
        (True, "*"),
    ]


@pytest.mark.parametrize("index", range(6))
async def test_c2_unknown_bundle_is_404_for_other_tags_lists_and_star(
    client: httpx.AsyncClient, db_session: Session, index: int
) -> None:
    keyed, tag = criterion_2_cases(cv_of(db_session))[index]
    response = await fetch(client, "zz", keyed=keyed, if_none_match=tag)
    assert_problem(response, 404)


# -- 3 ------------------------------------------------------------------------


async def test_c3_no_unknown_bundle_404_carries_etag_or_immutable(
    client: httpx.AsyncClient, db_session: Session
) -> None:
    cv = cv_of(db_session)
    cases = [(False, f'"zz-{cv}"'), (True, f'"zz-{cv}-key"'), *criterion_2_cases(cv)]
    assert len(cases) == 8
    for keyed, tag in cases:
        response = await fetch(client, "zz", keyed=keyed, if_none_match=tag)
        assert_uncacheable_404(response, (keyed, tag))


# -- 4 ------------------------------------------------------------------------


async def tag_of(client: httpx.AsyncClient, *, keyed: bool) -> str:
    response = await fetch(client, "us", keyed=keyed)
    assert response.status_code == 200, response.text
    return response.headers["etag"]


@pytest.mark.parametrize("keyed", [False, True])
async def test_c4_known_bundle_own_tag_alone_or_in_list_is_304(
    client: httpx.AsyncClient, keyed: bool
) -> None:
    tag = await tag_of(client, keyed=keyed)
    for header in (tag, f'"us-old", {tag}', f'{tag}, "us-old"'):
        response = await fetch(client, "us", keyed=keyed, if_none_match=header)
        assert response.status_code == 304, header
        assert response.content == b"", header
        assert response.headers["etag"] == tag, header


@pytest.mark.parametrize("keyed", [False, True])
async def test_c4_known_bundle_other_variant_or_old_tag_is_200(
    client: httpx.AsyncClient, keyed: bool
) -> None:
    own = await tag_of(client, keyed=keyed)
    other = await tag_of(client, keyed=not keyed)
    assert own != other
    for header in (other, '"us-old"'):
        response = await fetch(client, "us", keyed=keyed, if_none_match=header)
        assert response.status_code == 200, header
        body = response.json()
        assert body["entities"] and body["questions"], header
        assert response.headers["etag"] == own, header


# -- 5 ------------------------------------------------------------------------


@pytest.mark.parametrize("keyed", [False, True])
async def test_c5_known_bundle_unconditional_200_is_unchanged(
    client: httpx.AsyncClient, keyed: bool
) -> None:
    response = await fetch(client, "us", keyed=keyed)
    assert response.status_code == 200
    assert response.headers.get("etag")
    assert response.headers["cache-control"] == CACHE_CONTROL
    body = response.json()
    assert body["etag"] == response.headers["etag"]
    assert body["bytes"] == len(response.content)


# -- 6 ------------------------------------------------------------------------


@pytest.fixture
def statements(engine: Engine) -> Iterator[list[str]]:
    seen: list[str] = []

    def record(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:
        seen.append(statement)

    event.listen(engine, "before_cursor_execute", record)
    try:
        yield seen
    finally:
        event.remove(engine, "before_cursor_execute", record)


NAMES_QUESTIONS = re.compile(r'\b"?questions"?\b', re.IGNORECASE)


@pytest.mark.parametrize("keyed", [False, True])
async def test_c6_known_bundle_304_reads_no_questions(
    client: httpx.AsyncClient, statements: list[str], keyed: bool
) -> None:
    tag = await tag_of(client, keyed=keyed)
    # Prove the listener sees the questions table when a body *is* built.
    assert any(NAMES_QUESTIONS.search(s) for s in statements), statements
    statements.clear()
    response = await fetch(client, "us", keyed=keyed, if_none_match=tag)
    assert response.status_code == 304
    assert statements, "listener observed nothing during the 304 request"
    assert not [s for s in statements if NAMES_QUESTIONS.search(s)], statements


# -- 7 ------------------------------------------------------------------------


def walk_api_routes(routes: list[Any]) -> Iterator[Any]:
    """`app.routes`, including routers mounted with `include_router` (FastAPI
    0.141 lists those as wrappers whose `APIRoute`s sit under `original_router`)."""
    from fastapi.routing import APIRoute

    for route in routes:
        if isinstance(route, APIRoute):
            yield route
        inner = getattr(route, "original_router", None)
        if inner is not None:
            yield from walk_api_routes(inner.routes)


def test_c7_bundle_route_has_exclude_unset_false_and_bundle_model() -> None:
    from app.main import app
    from app.models import Bundle

    matching = [r for r in walk_api_routes(app.routes) if r.path.endswith("/bundles/{bundleId}")]
    assert len(matching) == 1, [r.path for r in matching]
    route = matching[0]
    assert route.response_model_exclude_unset is False
    assert route.response_model is Bundle


# -- 8 ------------------------------------------------------------------------


async def test_c8_bundle_list_unchanged(client: httpx.AsyncClient) -> None:
    listing = await client.get("/bundles")
    assert listing.status_code == 200
    by_id = {item["id"]: item for item in listing.json()["data"]}
    assert "us" in by_id
    assert "zz" not in by_id
    unkeyed = await fetch(client, "us", keyed=False)
    assert by_id["us"]["etag"] == unkeyed.headers["etag"]
    assert by_id["us"]["bytes"] == len(unkeyed.content)
