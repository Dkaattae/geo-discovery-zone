"""T-097 tester: one test (or more) per acceptance criterion.

Expected values come from the brief's criteria, not from the implementation.
"Unkeyed" = `GET /bundles/us` with no `includeAnswerKey`; "keyed" = with
`includeAnswerKey=true`. "Carries" / "withholds" the key are T-053's
definitions: `correctIndex` (or `answerGeometryId` on a `map_click` question)
present on every question, or absent from every question.

Criteria 16 (no pre-existing test changed) and 17 (no dependency change) are
file-boundary checks. They are checked once, by hand, against the branch's
diff and recorded in the brief's Verdict, not pinned here: a test that diffs
against a fixed commit goes red on `main` once a later task touches those
paths (E-11, E-12). Criterion 18 holds because every test here uses only the
in-process `client` and `db_session` fixtures; the suite was also run with the
proxy variables pointing at `http://127.0.0.1:1`, as CI does.

Criterion 14 checked `openapi.yaml`'s text and was deleted when CI stopped
checking the backend against it (`engineering-decisions.md` E-14).
"""

from __future__ import annotations

from typing import Any

import httpx
import pytest
from sqlalchemy.orm import Session

from app.orm import ContentMeta
from tests.conftest import assert_problem

BUNDLE = "/bundles/us"
KEYED = {"includeAnswerKey": "true"}
CACHE_CONTROL = "public, max-age=31536000, immutable"


def is_withheld(question: dict[str, Any]) -> bool:
    return "correctIndex" not in question and "answerGeometryId" not in question


def is_carried(question: dict[str, Any]) -> bool:
    if question["format"] == "map_click":
        return isinstance(question.get("answerGeometryId"), str)
    value = question.get("correctIndex")
    return isinstance(value, int) and not isinstance(value, bool)


async def fetch(
    client: httpx.AsyncClient, *, keyed: bool, if_none_match: str | None = None
) -> httpx.Response:
    headers = {"If-None-Match": if_none_match} if if_none_match is not None else {}
    params = KEYED if keyed else {}
    return await client.get(BUNDLE, params=params, headers=headers)


async def tag_of(client: httpx.AsyncClient, *, keyed: bool) -> str:
    response = await fetch(client, keyed=keyed)
    assert response.status_code == 200, response.text
    assert "etag" in response.headers
    return response.headers["etag"]


# -- 1 ------------------------------------------------------------------------


async def test_c1_the_two_variants_tags_differ(client: httpx.AsyncClient) -> None:
    unkeyed = await fetch(client, keyed=False)
    keyed = await fetch(client, keyed=True)
    assert unkeyed.status_code == 200
    assert keyed.status_code == 200
    assert unkeyed.headers.get("etag")
    assert keyed.headers.get("etag")
    assert unkeyed.headers["etag"] != keyed.headers["etag"]


# -- 2 ------------------------------------------------------------------------


async def test_c2_false_is_the_default_variant(client: httpx.AsyncClient) -> None:
    explicit_false = await client.get(BUNDLE, params={"includeAnswerKey": "false"})
    assert explicit_false.status_code == 200
    assert explicit_false.headers["etag"] == await tag_of(client, keyed=False)


# -- 3 ------------------------------------------------------------------------


@pytest.mark.parametrize("keyed", [False, True], ids=["unkeyed", "keyed"])
async def test_c3_each_tag_is_stable(client: httpx.AsyncClient, keyed: bool) -> None:
    first = await tag_of(client, keyed=keyed)
    second = await tag_of(client, keyed=keyed)
    assert first == second


# -- 4 ------------------------------------------------------------------------


async def test_c4_the_unkeyed_tag_does_not_revalidate_the_keyed_body(
    client: httpx.AsyncClient,
) -> None:
    unkeyed_tag = await tag_of(client, keyed=False)
    response = await fetch(client, keyed=True, if_none_match=unkeyed_tag)
    assert response.status_code == 200
    questions = response.json()["questions"]
    assert questions and all(is_carried(q) for q in questions)


# -- 5 ------------------------------------------------------------------------


async def test_c5_the_keyed_tag_does_not_revalidate_the_unkeyed_body(
    client: httpx.AsyncClient,
) -> None:
    keyed_tag = await tag_of(client, keyed=True)
    response = await fetch(client, keyed=False, if_none_match=keyed_tag)
    assert response.status_code == 200
    questions = response.json()["questions"]
    assert questions and all(is_withheld(q) for q in questions)


# -- 6 ------------------------------------------------------------------------


@pytest.mark.parametrize("keyed", [False, True], ids=["unkeyed", "keyed"])
async def test_c6_each_variant_revalidates_against_its_own_tag(
    client: httpx.AsyncClient, keyed: bool
) -> None:
    own = await tag_of(client, keyed=keyed)
    response = await fetch(client, keyed=keyed, if_none_match=own)
    assert response.status_code == 304
    assert response.content == b""
    assert response.headers["etag"] == own


# -- 7 ------------------------------------------------------------------------


@pytest.mark.parametrize("keyed", [False, True], ids=["unkeyed", "keyed"])
@pytest.mark.parametrize("position", ["first", "last"])
async def test_c7_a_tag_list_containing_the_variants_tag_is_a_304(
    client: httpx.AsyncClient, keyed: bool, position: str
) -> None:
    own = await tag_of(client, keyed=keyed)
    other = await tag_of(client, keyed=not keyed)
    tags = [own, other, '"us-old"'] if position == "first" else [other, '"us-old"', own]
    response = await fetch(client, keyed=keyed, if_none_match=", ".join(tags))
    assert response.status_code == 304
    assert response.headers["etag"] == own


@pytest.mark.parametrize("keyed", [False, True], ids=["unkeyed", "keyed"])
async def test_c7_a_list_of_only_the_other_variants_tag_and_an_old_one_is_a_200(
    client: httpx.AsyncClient, keyed: bool
) -> None:
    other = await tag_of(client, keyed=not keyed)
    response = await fetch(client, keyed=keyed, if_none_match=f'{other}, "us-old"')
    assert response.status_code == 200
    questions = response.json()["questions"]
    check = is_carried if keyed else is_withheld
    assert questions and all(check(q) for q in questions)


# -- 8 ------------------------------------------------------------------------


@pytest.mark.parametrize("keyed", [False, True], ids=["unkeyed", "keyed"])
async def test_c8_the_body_etag_equals_the_header(client: httpx.AsyncClient, keyed: bool) -> None:
    response = await fetch(client, keyed=keyed)
    assert response.status_code == 200
    assert response.json()["etag"] == response.headers["etag"]


# -- 9 ------------------------------------------------------------------------


async def test_c9_the_bundle_list_names_the_default_variants_tag(
    client: httpx.AsyncClient,
) -> None:
    response = await client.get("/bundles")
    assert response.status_code == 200
    (us,) = [summary for summary in response.json()["data"] if summary["id"] == "us"]
    assert us["etag"] == await tag_of(client, keyed=False)
    assert us["etag"] != await tag_of(client, keyed=True)


# -- 10 -----------------------------------------------------------------------


@pytest.mark.parametrize("keyed", [False, True], ids=["unkeyed", "keyed"])
async def test_c10_both_tags_are_strong_entity_tags(client: httpx.AsyncClient, keyed: bool) -> None:
    value = await tag_of(client, keyed=keyed)
    assert not value.startswith("W/")
    assert len(value) >= 2
    assert value.startswith('"') and value.endswith('"')
    assert '"' not in value[1:-1]


# -- 11 -----------------------------------------------------------------------


async def test_c11_both_tags_follow_the_content_version(
    client: httpx.AsyncClient, db_session: Session
) -> None:
    first_unkeyed = await tag_of(client, keyed=False)
    first_keyed = await tag_of(client, keyed=True)

    meta = db_session.get(ContentMeta, 1)
    assert meta is not None
    meta.content_version = "t097-tester-second-version"
    db_session.flush()

    second_unkeyed = await tag_of(client, keyed=False)
    second_keyed = await tag_of(client, keyed=True)
    assert second_unkeyed != first_unkeyed
    assert second_keyed != first_keyed
    assert second_unkeyed != second_keyed


# -- 12 -----------------------------------------------------------------------


@pytest.mark.parametrize("keyed", [False, True], ids=["unkeyed", "keyed"])
async def test_c12_cache_control_is_unchanged(client: httpx.AsyncClient, keyed: bool) -> None:
    response = await fetch(client, keyed=keyed)
    assert response.status_code == 200
    assert response.headers["cache-control"] == CACHE_CONTROL


# -- 13 -----------------------------------------------------------------------


@pytest.mark.parametrize("params", [{}, KEYED], ids=["unkeyed", "keyed"])
async def test_c13_an_unknown_bundle_is_still_a_404(
    client: httpx.AsyncClient, params: dict[str, str]
) -> None:
    response = await client.get("/bundles/zz", params=params)
    assert_problem(response, 404)


# -- 15 -----------------------------------------------------------------------


async def test_c15_no_other_content_endpoint_sends_an_etag(client: httpx.AsyncClient) -> None:
    listing = await client.get("/questions", params={"limit": 1})
    assert listing.status_code == 200
    question_id = listing.json()["data"][0]["id"]

    responses = {
        "/questions": listing,
        "/questions/{id}": await client.get(f"/questions/{question_id}"),
        "/entities": await client.get("/entities"),
        "/content/version": await client.get("/content/version"),
    }
    for path, response in responses.items():
        assert response.status_code == 200, (path, response.text)
        assert "etag" not in response.headers, path
