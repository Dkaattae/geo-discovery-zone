"""`openapi.yaml` says which Content endpoints serve nothing in v1 (T-039).

The router deliberately serves no geometry, elevation profiles or superlative
axes. The contract has to say so, and must not say so of anything that is
served.
"""

from __future__ import annotations

from typing import Any

METHODS = {"get", "post", "patch", "put", "delete"}
MARK = "Not implemented in v1"
UNIMPLEMENTED = {
    "getGeometry",
    "listElevationProfiles",
    "getElevationProfile",
    "listSuperlativeAxes",
}


def descriptions(spec: dict[str, Any]) -> dict[str, str]:
    return {
        operation["operationId"]: operation.get("description", "")
        for operations in spec["paths"].values()
        for method, operation in operations.items()
        if method in METHODS
    }


def test_exactly_the_empty_endpoints_are_marked_unimplemented(spec: dict[str, Any]) -> None:
    marked = {op for op, text in descriptions(spec).items() if MARK in text}
    assert marked == UNIMPLEMENTED


def test_each_unimplemented_endpoint_says_what_serving_it_would_take(
    spec: dict[str, Any],
) -> None:
    text = descriptions(spec)
    for needle in (
        "404",
        "us-atlas",
        "build time",
        "TopoJSON",
        "Census TIGER",
        "Natural Earth",
        "later",
    ):
        assert needle in text["getGeometry"], needle
    for needle in ("tpl-biggest-state", "/questions", "promptMost", "reviewed", "entityType"):
        assert needle in text["listSuperlativeAxes"], needle
    for needle in ("terrain", "build time"):
        assert needle in text["listElevationProfiles"], needle
    assert "404" in text["getElevationProfile"]
    assert "listElevationProfiles" in text["getElevationProfile"]


def test_the_overview_does_not_present_the_empty_endpoints_as_served(
    spec: dict[str, Any],
) -> None:
    overview = spec["info"]["description"]
    assert "not implemented in v1" in overview.lower()
