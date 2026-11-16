"""T-099 tester: one test (or more) per acceptance criterion.

Expected values come from the brief's criteria, not from the implementation.
"Unkeyed" = `GET /bundles/us` with no `includeAnswerKey`; "keyed" = with
`includeAnswerKey=true`. "The body's length" = `len(response.content)` of the
200 response.

Criteria 11 (no pre-existing test changed) and 12 (no dependency change) are
file-boundary checks, done once by hand against the branch's diff and recorded
in the brief's Verdict. A test that diffs against a fixed commit goes red on
`main` once a later task touches those paths (E-11, E-12). Criterion 13 holds
because every test here uses only the in-process `client` and `db_session`
fixtures; the suite was also run with the proxy variables pointing at
`http://127.0.0.1:1`, as CI does.

Criterion 8's "what they are today" was also checked once against the
pre-task commit (both variants' bodies minus `bytes`, key order, headers and
the 304 responses compared equal); see the Verdict. The tests below pin the
parts of it that can be stated without a recorded copy of the old body.

Criteria 7 and 10 checked `openapi.yaml` (its text, and bodies against its
schemas); they were deleted when CI stopped checking the backend against it
(`engineering-decisions.md` E-14).
"""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.orm import ContentMeta

BUNDLE = "/bundles/us"
KEYED = {"includeAnswerKey": "true"}
CACHE_CONTROL = "public, max-age=31536000, immutable"
KEY_FIELDS = ("correctIndex", "answerGeometryId")


def is_int(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


async def get_ok(client: httpx.AsyncClient, params: dict[str, str] | None = None) -> httpx.Response:
    response = await client.get(BUNDLE, params=params or {})
    assert response.status_code == 200, response.text
    return response


async def us_summary(client: httpx.AsyncClient) -> dict[str, Any]:
    response = await client.get("/bundles")
    assert response.status_code == 200, response.text
    matches = [s for s in response.json()["data"] if s["id"] == "us"]
    assert len(matches) == 1, response.json()
    return matches[0]


async def check_criteria_1_2_3(client: httpx.AsyncClient) -> dict[str, int]:
    unkeyed = await get_ok(client)
    keyed = await get_ok(client, KEYED)
    unkeyed_bytes = unkeyed.json()["bytes"]
    keyed_bytes = keyed.json()["bytes"]
    assert is_int(unkeyed_bytes) and unkeyed_bytes == len(unkeyed.content)
    assert is_int(keyed_bytes) and keyed_bytes == len(keyed.content)
    listed = (await us_summary(client))["bytes"]
    assert is_int(listed) and listed == len(unkeyed.content)
    return {"unkeyed": unkeyed_bytes, "keyed": keyed_bytes, "listed": listed}


# -- 1 ----------------------------------------------------------------------


async def test_c1_unkeyed_body_bytes_is_its_own_length(client: httpx.AsyncClient) -> None:
    response = await get_ok(client)
    value = response.json()["bytes"]
    assert is_int(value)
    assert value == len(response.content)


# -- 2 ----------------------------------------------------------------------


async def test_c2_keyed_body_bytes_is_its_own_length(client: httpx.AsyncClient) -> None:
    response = await get_ok(client, KEYED)
    value = response.json()["bytes"]
    assert is_int(value)
    assert value == len(response.content)


# -- 3 ----------------------------------------------------------------------


async def test_c3_bundle_list_gives_the_unkeyed_size(client: httpx.AsyncClient) -> None:
    unkeyed = await get_ok(client)
    summary = await us_summary(client)
    assert is_int(summary["bytes"])
    assert summary["bytes"] == len(unkeyed.content)


async def test_c3_bundle_list_is_not_the_keyed_size(client: httpx.AsyncClient) -> None:
    keyed = await get_ok(client, KEYED)
    summary = await us_summary(client)
    assert summary["bytes"] != len(keyed.content)


# -- 4 ----------------------------------------------------------------------


async def test_c4_false_is_the_default_variant(client: httpx.AsyncClient) -> None:
    unkeyed = await get_ok(client)
    explicit = await get_ok(client, {"includeAnswerKey": "false"})
    assert explicit.json()["bytes"] == unkeyed.json()["bytes"]
    assert explicit.json()["bytes"] == len(explicit.content)


# -- 5 ----------------------------------------------------------------------


async def test_c5_keyed_bytes_is_strictly_larger(client: httpx.AsyncClient) -> None:
    unkeyed = await get_ok(client)
    keyed = await get_ok(client, KEYED)
    assert keyed.json()["bytes"] > unkeyed.json()["bytes"]


# -- 6 ----------------------------------------------------------------------


async def test_c6_bytes_follows_a_longer_content_version(
    client: httpx.AsyncClient, db_session: Session
) -> None:
    before = await check_criteria_1_2_3(client)

    meta = db_session.get(ContentMeta, 1)
    assert meta is not None
    old_version = meta.content_version
    meta.content_version = old_version + "-t099-tester"  # 12 characters longer
    db_session.flush()

    # The change is visible to the app (otherwise the rest proves nothing).
    version = await client.get("/content/version")
    assert version.json()["contentVersion"] == old_version + "-t099-tester"

    after = await check_criteria_1_2_3(client)
    assert after["unkeyed"] != before["unkeyed"]
    assert after["keyed"] != before["keyed"]


# -- 8 ----------------------------------------------------------------------


async def test_c8_headers_and_body_etag_are_as_t097_left_them(
    client: httpx.AsyncClient,
) -> None:
    version = (await client.get("/content/version")).json()["contentVersion"]
    unkeyed = await get_ok(client)
    keyed = await get_ok(client, KEYED)

    assert unkeyed.headers["ETag"] == f'"us-{version}"'
    assert keyed.headers["ETag"] == f'"us-{version}-key"'
    for response in (unkeyed, keyed):
        body = response.json()
        assert body["etag"] == response.headers["ETag"]
        assert response.headers["Cache-Control"] == CACHE_CONTROL
        assert response.headers["content-type"].startswith("application/json")
        assert body["contentVersion"] == version


async def test_c8_counts_and_arrays_are_unchanged_between_variants(
    client: httpx.AsyncClient,
) -> None:
    unkeyed = (await get_ok(client)).json()
    keyed = (await get_ok(client, KEYED)).json()

    for body in (unkeyed, keyed):
        assert body["entityCount"] == len(body["entities"]) > 0
        assert body["questionCount"] == len(body["questions"]) > 0

    assert unkeyed["entities"] == keyed["entities"]
    stripped = [{k: v for k, v in q.items() if k not in KEY_FIELDS} for q in keyed["questions"]]
    assert unkeyed["questions"] == stripped
    for question in unkeyed["questions"]:
        assert not any(field in question for field in KEY_FIELDS)

    # Everything but `bytes` and `etag` is the same in both variants, in the same order.
    rest = [k for k in unkeyed if k not in ("bytes", "etag", "questions")]
    assert rest == [k for k in keyed if k not in ("bytes", "etag", "questions")]
    assert {k: unkeyed[k] for k in rest} == {k: keyed[k] for k in rest}


async def test_c8_summary_carries_no_entities_or_questions(client: httpx.AsyncClient) -> None:
    summary = await us_summary(client)
    assert "entities" not in summary
    assert "questions" not in summary
    unkeyed = await get_ok(client)
    body = unkeyed.json()
    assert summary["etag"] == unkeyed.headers["ETag"]
    assert summary["entityCount"] == body["entityCount"]
    assert summary["questionCount"] == body["questionCount"]


# -- 9 ----------------------------------------------------------------------


async def test_c9_304_path_is_untouched_for_both_variants(client: httpx.AsyncClient) -> None:
    for params in ({}, KEYED):
        tag = (await get_ok(client, params)).headers["ETag"]
        response = await client.get(BUNDLE, params=params, headers={"If-None-Match": tag})
        assert response.status_code == 304
        assert response.content == b""
        assert response.headers["ETag"] == tag
