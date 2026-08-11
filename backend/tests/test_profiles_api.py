"""Profile endpoints.

These hold children's data, so the tests that matter most are the ones about
who can see what.
"""

from __future__ import annotations

from typing import Any

import httpx

from tests.conftest import DEMO_PROFILE_ID, assert_matches, assert_problem

NEW_PROFILE = {"name": "Sam", "avatar": "🐢", "grade": 2}


async def create(
    client: httpx.AsyncClient, auth: dict[str, str], **overrides: Any
) -> dict[str, Any]:
    response = await client.post("/profiles", headers=auth, json={**NEW_PROFILE, **overrides})
    assert response.status_code == 201, response.text
    return response.json()


# -- access ----------------------------------------------------------------


async def test_every_profile_endpoint_needs_a_token(client: httpx.AsyncClient) -> None:
    for method, path in [
        ("get", "/profiles"),
        ("post", "/profiles"),
        ("get", f"/profiles/{DEMO_PROFILE_ID}"),
        ("patch", f"/profiles/{DEMO_PROFILE_ID}"),
        ("delete", f"/profiles/{DEMO_PROFILE_ID}"),
        ("get", f"/profiles/{DEMO_PROFILE_ID}/progress"),
        ("get", f"/profiles/{DEMO_PROFILE_ID}/review-queue"),
        ("get", f"/profiles/{DEMO_PROFILE_ID}/export"),
        ("post", "/profiles/import"),
    ]:
        response = await client.request(method.upper(), path, json={})
        assert response.status_code == 401, f"{method} {path} was not protected"


async def test_a_profile_belongs_to_the_account_that_made_it(
    client: httpx.AsyncClient, auth: dict[str, str], other_auth: dict[str, str]
) -> None:
    mine = await create(client, auth)
    listed = (await client.get("/profiles", headers=other_auth)).json()["data"]
    assert mine["id"] not in {profile["id"] for profile in listed}


async def test_another_accounts_profile_is_indistinguishable_from_a_missing_one(
    client: httpx.AsyncClient, other_auth: dict[str, str]
) -> None:
    """404 rather than 403, so an account cannot probe for which ids exist."""
    seen = await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=other_auth)
    unseen = await client.get("/profiles/p-does-not-exist", headers=other_auth)
    assert_problem(seen, 404)
    assert_problem(unseen, 404)
    assert seen.json()["title"] == unseen.json()["title"]


async def test_another_account_cannot_edit_or_delete_a_profile(
    client: httpx.AsyncClient, other_auth: dict[str, str]
) -> None:
    assert_problem(
        await client.patch(f"/profiles/{DEMO_PROFILE_ID}", headers=other_auth, json={"name": "X"}),
        404,
    )
    assert_problem(await client.delete(f"/profiles/{DEMO_PROFILE_ID}", headers=other_auth), 404)


# -- create, read, update, delete ------------------------------------------


async def test_a_new_profile_matches_the_contract(
    client: httpx.AsyncClient, auth: dict[str, str], spec: dict[str, Any]
) -> None:
    response = await client.post("/profiles", headers=auth, json=NEW_PROFILE)
    assert response.status_code == 201
    assert response.headers["Location"].endswith(response.json()["id"])
    assert_matches(spec, "Profile", response.json())


async def test_grade_seeds_all_three_level_fields(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    profile = await create(client, auth, grade=3)
    assert profile["level"] == 6
    assert profile["lastSessionEndLevel"] == 6
    assert profile["bestSustainedLevel"] == 6


async def test_a_new_profile_starts_with_nothing_learned(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    profile = await create(client, auth)
    assert profile["mastery"] == {}
    assert profile["reviewQueue"] == []
    assert profile["stats"] == {"answered": 0, "correct": 0, "streakDays": 0}


async def test_a_pin_is_hashed_and_never_returned(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    """A four-digit PIN's hash is a four-digit PIN — it does not leave the server."""
    response = await client.post(
        "/profiles", headers=auth, json={**NEW_PROFILE, "grade": 5, "pin": "1234"}
    )
    assert response.status_code == 201
    assert "1234" not in response.text
    assert "pinHash" not in response.json()

    fetched = await client.get(f"/profiles/{response.json()['id']}", headers=auth)
    assert "pinHash" not in fetched.json()


async def test_a_pin_is_not_offered_below_grade_four(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    body = assert_problem(
        await client.post(
            "/profiles", headers=auth, json={**NEW_PROFILE, "grade": 1, "pin": "1234"}
        ),
        422,
    )
    assert body["errors"][0]["path"] == "/pin"


async def test_a_pin_must_be_four_digits(client: httpx.AsyncClient, auth: dict[str, str]) -> None:
    assert_problem(
        await client.post("/profiles", headers=auth, json={**NEW_PROFILE, "grade": 5, "pin": "12"}),
        422,
    )


async def test_a_name_cannot_be_empty_or_a_paragraph(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    assert_problem(
        await client.post("/profiles", headers=auth, json={**NEW_PROFILE, "name": ""}), 422
    )
    assert_problem(
        await client.post("/profiles", headers=auth, json={**NEW_PROFILE, "name": "n" * 25}), 422
    )


async def test_a_partial_update_leaves_the_rest_alone(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    profile = await create(client, auth)
    updated = await client.patch(
        f"/profiles/{profile['id']}", headers=auth, json={"name": "Samantha"}
    )
    assert updated.json()["name"] == "Samantha"
    assert updated.json()["avatar"] == profile["avatar"]
    assert updated.json()["level"] == profile["level"]


async def test_an_out_of_range_level_is_refused(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    profile = await create(client, auth)
    assert_problem(
        await client.patch(f"/profiles/{profile['id']}", headers=auth, json={"level": 19}), 422
    )


async def test_mastery_written_by_hand_stays_in_range(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    profile = await create(client, auth)
    assert_problem(
        await client.patch(
            f"/profiles/{profile['id']}", headers=auth, json={"mastery": {"us-state-co": 1.4}}
        ),
        422,
    )


async def test_deleting_a_profile_removes_it(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    profile = await create(client, auth)
    assert (await client.delete(f"/profiles/{profile['id']}", headers=auth)).status_code == 204
    assert_problem(await client.get(f"/profiles/{profile['id']}", headers=auth), 404)


# -- progress and review queue ---------------------------------------------


async def test_progress_reports_the_join_keys_the_map_fills_in(
    client: httpx.AsyncClient, auth: dict[str, str], spec: dict[str, Any]
) -> None:
    body = (await client.get(f"/profiles/{DEMO_PROFILE_ID}/progress", headers=auth)).json()
    assert_matches(spec, "ProfileProgress", body)
    # The demo profile has Colorado at 0.8 and Florida at 0.5.
    assert body["masteredEntityIds"] == ["us-state-co"]
    assert body["masteredGeometryIds"] == ["08"]


async def test_map_progress_counts_one_entity_family(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    body = (await client.get(f"/profiles/{DEMO_PROFILE_ID}/progress", headers=auth)).json()
    assert body["mapProgress"] == {"entityType": "state", "scope": "us", "filled": 1, "total": 15}


async def test_suggested_levels_are_centred_on_the_last_session(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    body = (await client.get(f"/profiles/{DEMO_PROFILE_ID}/progress", headers=auth)).json()
    assert body["suggestedLevels"] == [5.0, 6.0, 7.0, 8.0]


async def test_the_review_queue_names_the_entities_waiting(
    client: httpx.AsyncClient, auth: dict[str, str], spec: dict[str, Any]
) -> None:
    body = (await client.get(f"/profiles/{DEMO_PROFILE_ID}/review-queue", headers=auth)).json()
    assert_matches(spec, "ReviewQueue", body)
    assert body["entities"][0]["entityId"] == "us-state-tx"
    assert body["entities"][0]["name"] == "Texas"


async def test_an_entity_can_be_cleared_by_hand(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    path = f"/profiles/{DEMO_PROFILE_ID}/review-queue/us-state-tx"
    assert (await client.delete(path, headers=auth)).status_code == 204
    body = (await client.get(f"/profiles/{DEMO_PROFILE_ID}/review-queue", headers=auth)).json()
    assert body["entities"] == []


async def test_clearing_something_not_queued_is_a_404(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    assert_problem(
        await client.delete(f"/profiles/{DEMO_PROFILE_ID}/review-queue/us-state-hi", headers=auth),
        404,
    )


# -- export and import ------------------------------------------------------


async def test_an_export_round_trips_through_import(
    client: httpx.AsyncClient, auth: dict[str, str], spec: dict[str, Any]
) -> None:
    exported = (await client.get(f"/profiles/{DEMO_PROFILE_ID}/export", headers=auth)).json()
    assert_matches(spec, "ProfileExport", exported)

    imported = await client.post("/profiles/import", headers=auth, json=exported)
    assert imported.status_code == 201
    body = imported.json()
    assert body["name"] == "Maya"
    assert body["level"] == 6
    assert body["mastery"] == exported["profile"]["mastery"]
    assert body["reviewQueue"] == exported["profile"]["reviewQueue"]
    assert body["stats"]["answered"] == exported["profile"]["stats"]["answered"]


async def test_an_import_never_collides_with_a_live_profile(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    exported = (await client.get(f"/profiles/{DEMO_PROFILE_ID}/export", headers=auth)).json()
    imported = (await client.post("/profiles/import", headers=auth, json=exported)).json()
    assert imported["id"] != DEMO_PROFILE_ID
    assert (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=auth)).status_code == 200


async def test_an_import_lands_in_the_importing_account(
    client: httpx.AsyncClient, auth: dict[str, str], other_auth: dict[str, str]
) -> None:
    exported = (await client.get(f"/profiles/{DEMO_PROFILE_ID}/export", headers=auth)).json()
    imported = (await client.post("/profiles/import", headers=other_auth, json=exported)).json()
    assert (await client.get(f"/profiles/{imported['id']}", headers=other_auth)).status_code == 200
    assert_problem(await client.get(f"/profiles/{imported['id']}", headers=auth), 404)


async def test_a_malformed_export_is_refused(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    assert_problem(
        await client.post("/profiles/import", headers=auth, json={"exportVersion": 1}), 422
    )
