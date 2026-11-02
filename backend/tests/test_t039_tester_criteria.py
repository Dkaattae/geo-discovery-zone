"""T-039, written by the `tester`: one test per acceptance criterion.

Expected values come from the brief (`tasks/T-039-empty-content-endpoints.md`),
not from the implementation. The baseline for "unchanged" (criteria 14-16) is
the brief's approval commit `3de6aca`, recorded here as literals so the tests
need no git history. Committed files only; no network.
"""

from __future__ import annotations

import ast
import hashlib
import re
from pathlib import Path
from typing import Any

import httpx
import yaml

from tests.conftest import SPEC_PATH, assert_problem

METHODS = {"get", "put", "post", "patch", "delete", "head", "options", "trace"}
MARK = "Not implemented in v1"
FOUR = {"getGeometry", "listElevationProfiles", "getElevationProfile", "listSuperlativeAxes"}


def _ops(spec: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        op["operationId"]: op
        for methods in spec["paths"].values()
        for method, op in methods.items()
        if method in METHODS
    }


def _desc(spec: dict[str, Any], operation_id: str) -> str:
    return _ops(spec)[operation_id].get("description", "")


def _flat(text: str) -> str:
    """Collapse YAML block line-wrapping so phrases split across lines still match."""
    return re.sub(r"\s+", " ", text)


# --- Marking -------------------------------------------------------------


def test_c1_each_of_the_four_operations_says_not_implemented_in_v1(spec: dict[str, Any]) -> None:
    for operation_id in FOUR:
        assert MARK in _desc(spec, operation_id), operation_id


def test_c2_no_other_operation_carries_the_mark(spec: dict[str, Any]) -> None:
    others = {oid for oid in _ops(spec) if oid not in FOUR and MARK in _desc(spec, oid)}
    assert others == set()


# --- Geometry --------------------------------------------------------------


def test_c3_geometry_says_every_layer_returns_404(spec: dict[str, Any]) -> None:
    text = _flat(_desc(spec, "getGeometry")).lower()
    assert "404" in text
    assert "every layer" in text or "all layers" in text


def test_c4_geometry_says_the_v1_client_bundles_us_atlas_at_build_time(
    spec: dict[str, Any],
) -> None:
    text = _flat(_desc(spec, "getGeometry"))
    assert "us-atlas" in text
    assert "build time" in text or "build-time" in text
    assert re.search(r"(does not|doesn't|never) call", text), "must say the client does not call it"


def test_c5_geometry_names_topojson_census_tiger_and_natural_earth(spec: dict[str, Any]) -> None:
    text = _flat(_desc(spec, "getGeometry"))
    for needle in ("TopoJSON", "Census TIGER", "Natural Earth"):
        assert needle in text, needle


def test_c6_geometry_is_kept_for_later_clients(spec: dict[str, Any]) -> None:
    assert re.search(r"\blater\b", _desc(spec, "getGeometry"))


# --- Superlative axes ------------------------------------------------------


def test_c7_superlative_axes_returns_an_empty_data_list_whatever_entity_type(
    spec: dict[str, Any],
) -> None:
    text = _flat(_desc(spec, "listSuperlativeAxes"))
    assert "empty" in text.lower()
    assert "data" in text
    assert "entityType" in text


def test_c8_area_superlative_ships_as_tpl_biggest_state_through_questions(
    spec: dict[str, Any],
) -> None:
    text = _flat(_desc(spec, "listSuperlativeAxes"))
    assert "tpl-biggest-state" in text
    assert "/questions" in text
    assert "biggest" in text


def test_c9_superlative_axes_needs_a_reviewed_prompt_most(spec: dict[str, Any]) -> None:
    text = _flat(_desc(spec, "listSuperlativeAxes"))
    assert "promptMost" in text
    assert re.search(r"\breviewed\b", text)
    assert "rank" in text.lower(), "axis objects built from ranked entity fields"


# --- Elevation profiles ----------------------------------------------------


def test_c10_list_is_empty_and_get_is_404_for_every_profile_key(spec: dict[str, Any]) -> None:
    listing = _flat(_desc(spec, "listElevationProfiles"))
    assert "empty" in listing.lower()
    assert "data" in listing
    one = _flat(_desc(spec, "getElevationProfile"))
    assert "404" in one
    assert "every `profileKey`" in one or "every profileKey" in one or "any `profileKey`" in one


def test_c11_elevation_profiles_need_terrain_data_sampled_at_build_time(
    spec: dict[str, Any],
) -> None:
    listing = _flat(_desc(spec, "listElevationProfiles"))
    assert "terrain" in listing or "elevation data" in listing
    assert "build time" in listing or "build-time" in listing
    one = _flat(_desc(spec, "getElevationProfile"))
    says_same = ("terrain" in one or "elevation data" in one) and (
        "build time" in one or "build-time" in one
    )
    assert says_same or "listElevationProfiles" in one


# --- Contract-wide ---------------------------------------------------------


def test_c12_overview_content_bullet_no_longer_presents_the_three_as_served(
    spec: dict[str, Any],
) -> None:
    overview = spec["info"]["description"]
    match = re.search(r"^- \*\*Content\*\*(.*?)(?=^- \*\*|\Z)", overview, re.S | re.M)
    assert match, "the Content bullet is still there"
    bullet = _flat(match.group(0))
    # The served list in the bullet's opening parenthesis must not include them.
    served = re.match(r"- \*\*Content\*\* \(([^)]*)\)", bullet)
    assert served, bullet
    for path in ("/geometry", "/elevation-profiles", "/superlative-axes"):
        assert path not in served.group(1), path
    # ...and the bullet must say the three are not implemented in v1.
    after = bullet[served.end() :]
    assert "not implemented in v1" in after.lower()
    for path in ("/geometry", "/elevation-profiles", "/superlative-axes"):
        assert path in after, path


# --- Nothing else moves ----------------------------------------------------


async def test_c13_runtime_responses_are_unchanged(client: httpx.AsyncClient) -> None:
    assert_problem(await client.get("/geometry/us-states"), 404)
    assert_problem(await client.get("/geometry/moon-craters"), 422)
    assert (await client.get("/elevation-profiles")).json() == {"data": []}
    assert_problem(await client.get("/elevation-profiles/profile-us-39n"), 404)
    assert (await client.get("/superlative-axes")).json() == {"data": []}
    # "whatever entityType is given" (criterion 7)
    for entity_type in ("state", "river", "country"):
        response = await client.get("/superlative-axes", params={"entityType": entity_type})
        assert response.json() == {"data": []}, entity_type


# sha256 of each test function's whole source lines at 3de6aca (the approval commit).
PINNED_TESTS = {
    "test_unloaded_geometry_says_so_rather_than_inventing_shapes": (
        "e2fb80568337af3264721a31a1893b0fa072141eaf2c6c3dda29abfffb8492a9"
    ),
    "test_an_unknown_geometry_layer_is_rejected_by_the_enum": (
        "27e0e0044f2f21b6243300253ad910534c70e0d8d52b6db19f493bdb1b507f4f"
    ),
    "test_elevation_profiles_are_empty_rather_than_fabricated": (
        "8fcf6401db71f6ddc79df725151c9466f5405176056f59ca3553c63e3ce2827f"
    ),
    "test_superlative_axes_are_empty_until_ranked_data_exists": (
        "0a936898b0847b2d60554b919bd7a2fa8b6d8597bafe9fea82559e6501bee191"
    ),
}


def test_c14_the_four_existing_content_tests_are_byte_for_byte_unmodified() -> None:
    path = Path(__file__).with_name("test_content_api.py")
    source = path.read_text(encoding="utf-8")
    lines = source.splitlines(keepends=True)
    found = {}
    for node in ast.parse(source).body:
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef) and node.name in PINNED_TESTS:
            # Whole lines, so a trailing comment on the last line counts too.
            segment = "".join(lines[node.lineno - 1 : node.end_lineno])
            found[node.name] = hashlib.sha256(segment.encode()).hexdigest()
    assert found == PINNED_TESTS


# Every (path, method, operationId) in openapi.yaml at 3de6aca.
BASELINE_OPERATIONS = {
    ("/auth/logout", "post", "logout"),
    ("/auth/me", "get", "getCurrentAccount"),
    ("/auth/register", "post", "register"),
    ("/auth/token", "post", "issueToken"),
    ("/bundles", "get", "listBundles"),
    ("/bundles/{bundleId}", "get", "getBundle"),
    ("/content/version", "get", "getContentVersion"),
    ("/elevation-profiles", "get", "listElevationProfiles"),
    ("/elevation-profiles/{profileKey}", "get", "getElevationProfile"),
    ("/entities", "get", "listEntities"),
    ("/entities/{entityId}", "get", "getEntity"),
    ("/geometry/{layer}", "get", "getGeometry"),
    ("/profiles", "get", "listProfiles"),
    ("/profiles", "post", "createProfile"),
    ("/profiles/import", "post", "importProfile"),
    ("/profiles/{profileId}", "delete", "deleteProfile"),
    ("/profiles/{profileId}", "get", "getProfile"),
    ("/profiles/{profileId}", "patch", "updateProfile"),
    ("/profiles/{profileId}/export", "get", "exportProfile"),
    ("/profiles/{profileId}/progress", "get", "getProfileProgress"),
    ("/profiles/{profileId}/review-queue", "get", "getReviewQueue"),
    ("/profiles/{profileId}/review-queue/{entityId}", "delete", "removeFromReviewQueue"),
    ("/questions", "get", "listQuestions"),
    ("/questions/{questionId}", "get", "getQuestion"),
    ("/sessions", "post", "startSession"),
    ("/sessions/{sessionId}", "get", "getSession"),
    ("/sessions/{sessionId}/answers", "post", "submitAnswer"),
    ("/sessions/{sessionId}/answers/{answerId}", "delete", "undoAnswer"),
    ("/sessions/{sessionId}/end", "post", "endSession"),
    ("/sessions/{sessionId}/next-question", "post", "serveNextQuestion"),
    ("/sessions/{sessionId}/review-round", "post", "startReviewRound"),
    ("/superlative-axes", "get", "listSuperlativeAxes"),
}


def test_c15_paths_methods_and_operation_ids_are_unchanged(spec: dict[str, Any]) -> None:
    current = {
        (path, method, op["operationId"])
        for path, methods in spec["paths"].items()
        for method, op in methods.items()
        if method in METHODS
    }
    assert current == BASELINE_OPERATIONS


def test_c16_the_three_schemas_remain_with_their_required_lists(spec: dict[str, Any]) -> None:
    schemas = spec["components"]["schemas"]
    assert "GeometryLayer" in schemas
    assert "required" not in schemas["GeometryLayer"]  # a string enum, as at 3de6aca
    assert schemas["SuperlativeAxis"]["required"] == ["id", "axis", "entityType", "promptMost"]
    assert schemas["ElevationProfile"]["required"] == ["key", "label", "from", "to", "samples"]


def test_c17_openapi_yaml_still_parses_as_yaml() -> None:
    parsed = yaml.safe_load(SPEC_PATH.read_text(encoding="utf-8"))
    assert isinstance(parsed, dict)
    assert parsed["paths"]


def test_c19_the_t039_doc_tests_read_files_only() -> None:
    """No test this task added imports a network client or names a URL host."""
    here = Path(__file__).parent
    for name in ("test_unimplemented_content_docs.py", Path(__file__).name):
        source = (here / name).read_text(encoding="utf-8")
        for forbidden in ("import requests", "urllib.request", "socket", "http://", "https://"):
            assert forbidden not in source.replace(f'"{forbidden}"', ""), (name, forbidden)
