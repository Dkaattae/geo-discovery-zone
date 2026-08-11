"""The app and `openapi.yaml` describe the same API.

`openapi.yaml` is the contract between this backend and `frontend/`. These
tests fail when one side drifts: a route with no operation in the spec, an
operation with no route, or a protected group that forgot to say it is
protected.
"""

from __future__ import annotations

from typing import Any

from app.main import API_PREFIX, app

METHODS = {"get", "post", "patch", "put", "delete"}


def app_operations() -> set[tuple[str, str]]:
    """What the running app actually serves, read off its generated schema."""
    return {
        (path[len(API_PREFIX) :] if path.startswith(API_PREFIX) else path, method)
        for path, operations in app.openapi()["paths"].items()
        for method in operations
        if method in METHODS
    }


def spec_operations(spec: dict[str, Any]) -> set[tuple[str, str]]:
    return {
        (path, method)
        for path, operations in spec["paths"].items()
        for method in operations
        if method in METHODS
    }


def test_every_route_is_declared_in_the_contract(spec: dict[str, Any]) -> None:
    undeclared = app_operations() - spec_operations(spec)
    assert not undeclared, f"routes missing from openapi.yaml: {sorted(undeclared)}"


def test_every_operation_in_the_contract_is_implemented(spec: dict[str, Any]) -> None:
    missing = spec_operations(spec) - app_operations()
    assert not missing, f"operations in openapi.yaml with no route: {sorted(missing)}"


def test_the_contract_declares_a_bearer_scheme(spec: dict[str, Any]) -> None:
    scheme = spec["components"]["securitySchemes"]["bearerAuth"]
    assert scheme["type"] == "http"
    assert scheme["scheme"] == "bearer"


def test_every_profile_and_session_operation_declares_security(spec: dict[str, Any]) -> None:
    """Children's data is never served on an unauthenticated operation."""
    unguarded = [
        (path, method)
        for path, operations in spec["paths"].items()
        for method, operation in operations.items()
        if isinstance(operation, dict)
        and set(operation.get("tags", [])) & {"Profiles", "Sessions"}
        and not operation.get("security")
    ]
    assert not unguarded, f"unguarded operations: {unguarded}"


def test_content_operations_stay_public(spec: dict[str, Any]) -> None:
    """A token on a cacheable, user-data-free response buys nothing."""
    guarded = [
        (path, method)
        for path, operations in spec["paths"].items()
        for method, operation in operations.items()
        if isinstance(operation, dict)
        and "Content" in operation.get("tags", [])
        and operation.get("security")
    ]
    assert not guarded, f"content operations should need no token: {guarded}"
