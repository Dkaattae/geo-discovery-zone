"""T-099 worker: a bundle's `bytes` is the exact length of the body it is in.

These are the worker's own checks; the tester writes the per-criterion file.
Everything goes through the in-process `client` fixture; nothing reaches the
network.
"""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.orm import ContentMeta
from app.routers.content import _sized

KEYED = {"includeAnswerKey": "true"}


async def fetch(client: httpx.AsyncClient, **params: str) -> httpx.Response:
    response = await client.get("/bundles/us", params=params)
    assert response.status_code == 200, response.text
    return response


async def listed_bytes(client: httpx.AsyncClient) -> int:
    (us,) = [s for s in (await client.get("/bundles")).json()["data"] if s["id"] == "us"]
    return us["bytes"]


async def sizes(client: httpx.AsyncClient) -> dict[str, Any]:
    unkeyed, keyed = await fetch(client), await fetch(client, **KEYED)
    for response in (unkeyed, keyed):
        assert response.json()["bytes"] == len(response.content)
    return {
        "unkeyed": len(unkeyed.content),
        "keyed": len(keyed.content),
        "listed": await listed_bytes(client),
    }


async def test_each_variant_states_its_own_length(client: httpx.AsyncClient) -> None:
    measured = await sizes(client)
    assert measured["keyed"] > measured["unkeyed"]


async def test_false_is_the_unkeyed_variant(client: httpx.AsyncClient) -> None:
    unkeyed = await fetch(client)
    explicit = await fetch(client, includeAnswerKey="false")
    assert explicit.json()["bytes"] == unkeyed.json()["bytes"] == len(explicit.content)


async def test_the_list_gives_the_unkeyed_size(client: httpx.AsyncClient) -> None:
    measured = await sizes(client)
    assert measured["listed"] == measured["unkeyed"]


async def test_bytes_follows_the_content_version(
    client: httpx.AsyncClient, db_session: Session
) -> None:
    before = await sizes(client)
    meta = db_session.get(ContentMeta, 1)
    assert meta is not None
    meta.content_version = meta.content_version + "-t099-longer"
    db_session.flush()

    after = await sizes(client)
    assert after["listed"] == after["unkeyed"]
    assert after["unkeyed"] != before["unkeyed"]
    assert after["keyed"] != before["keyed"]


def test_sizing_settles_across_a_digit_boundary() -> None:
    # Pad lengths so the body lands either side of 10, 100 and 1000 bytes,
    # where the digit count of `bytes` itself changes the length.
    for pad in range(0, 1100):
        rendered = _sized({"bytes": 0, "pad": "x" * pad})
        assert f'"bytes":{len(rendered)},'.encode() in rendered
