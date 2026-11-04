"""T-097 worker: a bundle's `ETag` tells the keyed and unkeyed bodies apart.

These are the worker's own checks. The tester writes the per-criterion file.
Everything goes through the in-process `client` fixture; nothing reaches the
network.
"""

from __future__ import annotations

import httpx
from sqlalchemy.orm import Session

from app.orm import ContentMeta

KEYED = {"includeAnswerKey": "true"}


async def tag(client: httpx.AsyncClient, **params: str) -> str:
    response = await client.get("/bundles/us", params=params)
    assert response.status_code == 200, response.text
    return response.headers["ETag"]


async def test_the_keyed_and_unkeyed_tags_differ(client: httpx.AsyncClient) -> None:
    assert await tag(client) != await tag(client, **KEYED)


async def test_false_is_the_unkeyed_variant(client: httpx.AsyncClient) -> None:
    assert await tag(client, includeAnswerKey="false") == await tag(client)


async def test_one_variants_tag_does_not_revalidate_the_other(
    client: httpx.AsyncClient,
) -> None:
    unkeyed, keyed = await tag(client), await tag(client, **KEYED)

    response = await client.get("/bundles/us", params=KEYED, headers={"If-None-Match": unkeyed})
    assert response.status_code == 200
    assert all("correctIndex" in q or "answerGeometryId" in q for q in response.json()["questions"])

    response = await client.get("/bundles/us", headers={"If-None-Match": keyed})
    assert response.status_code == 200
    assert all(
        "correctIndex" not in q and "answerGeometryId" not in q
        for q in response.json()["questions"]
    )


async def test_each_variant_revalidates_against_its_own_tag(client: httpx.AsyncClient) -> None:
    for params in ({}, KEYED):
        own = await tag(client, **params)
        response = await client.get("/bundles/us", params=params, headers={"If-None-Match": own})
        assert response.status_code == 304
        assert not response.content
        assert response.headers["ETag"] == own


async def test_a_tag_list_matches_per_variant(client: httpx.AsyncClient) -> None:
    unkeyed, keyed = await tag(client), await tag(client, **KEYED)
    for params, own, other in (({}, unkeyed, keyed), (KEYED, keyed, unkeyed)):
        for header in (f'{own}, "us-old"', f'"us-old", {own}'):
            response = await client.get(
                "/bundles/us", params=params, headers={"If-None-Match": header}
            )
            assert response.status_code == 304, header
        response = await client.get(
            "/bundles/us", params=params, headers={"If-None-Match": f'{other}, "us-old"'}
        )
        assert response.status_code == 200


async def test_the_body_etag_equals_the_header(client: httpx.AsyncClient) -> None:
    for params in ({}, KEYED):
        response = await client.get("/bundles/us", params=params)
        assert response.json()["etag"] == response.headers["ETag"]


async def test_the_bundle_list_names_the_unkeyed_tag(client: httpx.AsyncClient) -> None:
    summaries = (await client.get("/bundles")).json()["data"]
    (us,) = [summary for summary in summaries if summary["id"] == "us"]
    assert us["etag"] == await tag(client)
    assert us["etag"] != await tag(client, **KEYED)


async def test_both_tags_are_strong(client: httpx.AsyncClient) -> None:
    for value in (await tag(client), await tag(client, **KEYED)):
        assert value.startswith('"') and value.endswith('"')
        assert value.count('"') == 2


async def test_both_tags_follow_the_content_version(
    client: httpx.AsyncClient, db_session: Session
) -> None:
    before = (await tag(client), await tag(client, **KEYED))

    meta = db_session.get(ContentMeta, 1)
    assert meta is not None
    meta.content_version = f"{meta.content_version}-t097"
    db_session.flush()

    after = (await tag(client), await tag(client, **KEYED))
    assert before[0] != after[0]
    assert before[1] != after[1]
    assert after[0] != after[1]
