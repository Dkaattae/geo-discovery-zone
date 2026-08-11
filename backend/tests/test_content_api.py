"""Content endpoints.

Read-only and public: the group is build-time generated and carries no user
data, so a request with no token must still work. Response shapes are asserted
against `openapi.yaml` — it is the contract, and a response that does not match
it is a bug even when the test author expected it.
"""

from __future__ import annotations

from typing import Any

import httpx

from tests.conftest import assert_matches, assert_problem


async def test_content_endpoints_need_no_token(client: httpx.AsyncClient) -> None:
    response = await client.get("/content/version")
    assert response.status_code == 200


async def test_content_version_counts_what_was_seeded(
    client: httpx.AsyncClient, spec: dict[str, Any]
) -> None:
    body = (await client.get("/content/version")).json()
    assert_matches(spec, "ContentVersion", body)
    assert body["counts"]["entities"] == 15
    assert body["counts"]["questions"] == 26


async def test_the_bank_is_seeded_from_the_shipped_question_bank(
    client: httpx.AsyncClient, spec: dict[str, Any]
) -> None:
    body = (await client.get("/entities", params={"limit": 500})).json()
    entity = next(row for row in body["data"] if row["id"] == "us-state-co")
    assert_matches(spec, "Entity", entity)
    assert entity["name"] == "Colorado"
    assert entity["capital"] == "Denver"


async def test_join_keys_survive_the_remap(client: httpx.AsyncClient) -> None:
    """FIPS is what the map joins on; losing it breaks every question silently."""
    body = (await client.get("/entities", params={"limit": 500})).json()
    fips = {row["id"]: row.get("geometryId") for row in body["data"]}
    assert fips["us-state-co"] == "08"
    assert fips["us-state-ak"] == "02"
    assert all(value and len(value) == 2 for value in fips.values())


async def test_a_question_carries_the_geometry_id_its_prompt_highlights(
    client: httpx.AsyncClient, spec: dict[str, Any]
) -> None:
    body = (await client.get("/questions/q-co-loc-1")).json()
    assert_matches(spec, "Question", body)
    assert body["highlightGeometryId"] == "08"
    assert body["format"] == "map_identify"


async def test_every_seeded_question_points_at_a_seeded_entity(
    client: httpx.AsyncClient,
) -> None:
    entities = (await client.get("/entities", params={"limit": 500})).json()["data"]
    questions = (await client.get("/questions", params={"limit": 500})).json()["data"]
    known = {entity["id"] for entity in entities}
    assert {question["entityId"] for question in questions} <= known


async def test_every_seeded_question_has_a_usable_answer_key(
    client: httpx.AsyncClient,
) -> None:
    questions = (await client.get("/questions", params={"limit": 500})).json()["data"]
    for question in questions:
        assert 0 <= question["correctIndex"] < len(question["choices"])


async def test_answer_keys_are_withheld_on_request(client: httpx.AsyncClient) -> None:
    """Omitted, not nulled — the client must not see a key it was refused."""
    body = (await client.get("/questions/q-co-loc-1", params={"includeAnswerKey": False})).json()
    assert "correctIndex" not in body
    assert body["choices"]


async def test_questions_filter_by_topic(client: httpx.AsyncClient) -> None:
    body = (await client.get("/questions", params={"topic": "capital", "limit": 500})).json()
    assert body["data"]
    assert {question["topic"] for question in body["data"]} == {"capital"}


async def test_questions_filter_by_comma_separated_lists(client: httpx.AsyncClient) -> None:
    body = (
        await client.get("/questions", params={"topic": "capital,location", "limit": 500})
    ).json()
    assert {question["topic"] for question in body["data"]} == {"capital", "location"}


async def test_the_level_window_is_a_half_width_around_level(client: httpx.AsyncClient) -> None:
    body = (
        await client.get("/questions", params={"level": 7, "levelSpan": 1.5, "limit": 500})
    ).json()
    assert body["data"]
    assert all(abs(question["level"] - 7) <= 1.5 for question in body["data"])


async def test_age_band_filters_are_independent_of_level(client: httpx.AsyncClient) -> None:
    body = (await client.get("/questions", params={"maxAgeBand": 1, "limit": 500})).json()
    assert body["data"]
    assert all(question["ageBand"] <= 1 for question in body["data"])


async def test_excluded_questions_do_not_come_back(client: httpx.AsyncClient) -> None:
    body = (
        await client.get("/questions", params={"exclude": "q-co-loc-1,q-co-cap-1", "limit": 500})
    ).json()
    assert {"q-co-loc-1", "q-co-cap-1"}.isdisjoint({q["id"] for q in body["data"]})


async def test_entities_search_is_case_insensitive(client: httpx.AsyncClient) -> None:
    body = (await client.get("/entities", params={"q": "colo"})).json()
    assert [entity["id"] for entity in body["data"]] == ["us-state-co"]


async def test_entities_filter_by_id_set(client: httpx.AsyncClient) -> None:
    body = (await client.get("/entities", params={"ids": "us-state-co,us-state-tx"})).json()
    assert {entity["id"] for entity in body["data"]} == {"us-state-co", "us-state-tx"}


async def test_pagination_walks_the_whole_set_once(
    client: httpx.AsyncClient, spec: dict[str, Any]
) -> None:
    seen: list[str] = []
    cursor: str | None = None
    for _ in range(20):
        params: dict[str, Any] = {"limit": 4}
        if cursor:
            params["cursor"] = cursor
        page = (await client.get("/questions", params=params)).json()
        assert_matches(spec, "PageInfo", page["page"])
        seen += [question["id"] for question in page["data"]]
        cursor = page["page"]["nextCursor"]
        if not page["page"]["hasMore"]:
            break
    assert len(seen) == 26
    assert len(set(seen)) == 26


async def test_a_forged_cursor_is_refused(client: httpx.AsyncClient) -> None:
    assert_problem(await client.get("/questions", params={"cursor": "not-a-cursor"}), 422)


async def test_a_missing_entity_is_a_problem_document(client: httpx.AsyncClient) -> None:
    body = assert_problem(await client.get("/entities/us-state-zz"), 404)
    assert body["instance"].endswith("/entities/us-state-zz")


async def test_a_bundle_carries_its_entities_and_questions(
    client: httpx.AsyncClient, spec: dict[str, Any]
) -> None:
    response = await client.get("/bundles/us")
    body = response.json()
    assert_matches(spec, "Bundle", body)
    assert len(body["entities"]) == 15
    assert len(body["questions"]) == 26
    assert body["entityCount"] == 15


async def test_a_bundle_is_immutable_per_content_version(client: httpx.AsyncClient) -> None:
    first = await client.get("/bundles/us")
    etag = first.headers["ETag"]
    assert "immutable" in first.headers["Cache-Control"]

    again = await client.get("/bundles/us", headers={"If-None-Match": etag})
    assert again.status_code == 304
    assert not again.content


async def test_a_stale_etag_gets_the_bundle(client: httpx.AsyncClient) -> None:
    response = await client.get("/bundles/us", headers={"If-None-Match": '"us-old"'})
    assert response.status_code == 200


async def test_bundle_summaries_do_not_carry_the_payload(
    client: httpx.AsyncClient, spec: dict[str, Any]
) -> None:
    body = (await client.get("/bundles")).json()
    summary = body["data"][0]
    assert_matches(spec, "BundleSummary", summary)
    assert "entities" not in summary


async def test_unloaded_geometry_says_so_rather_than_inventing_shapes(
    client: httpx.AsyncClient,
) -> None:
    body = assert_problem(await client.get("/geometry/us-states"), 404)
    assert "us-states" in body["detail"]


async def test_an_unknown_geometry_layer_is_rejected_by_the_enum(
    client: httpx.AsyncClient,
) -> None:
    assert_problem(await client.get("/geometry/moon-craters"), 422)


async def test_elevation_profiles_are_empty_rather_than_fabricated(
    client: httpx.AsyncClient,
) -> None:
    """A guessed cross-section teaches a shape that is not there."""
    assert (await client.get("/elevation-profiles")).json() == {"data": []}
    assert_problem(await client.get("/elevation-profiles/profile-us-39n"), 404)


async def test_superlative_axes_are_empty_until_ranked_data_exists(
    client: httpx.AsyncClient,
) -> None:
    assert (await client.get("/superlative-axes")).json() == {"data": []}
