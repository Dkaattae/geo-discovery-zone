"""The backend serving the built frontend.

Mounted against a throwaway app built from a fake bundle, so these run without
`bun run build:static` having happened — what is being tested is the routing and
the headers, not the contents of somebody's JavaScript.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path

import httpx
import pytest
from fastapi import FastAPI

from app.frontend import DEFAULT_FRONTEND_DIR, ENV_VAR, frontend_dir, mount_frontend
from app.problems import ProblemException, problem_response

API_PREFIX = "/api/v1"

SHELL = "<!DOCTYPE html><html><body>the app shell</body></html>"


@pytest.fixture
def bundle(tmp_path: Path) -> Path:
    """A stand-in for `frontend/dist/client`."""
    (tmp_path / "assets").mkdir()
    (tmp_path / "index.html").write_text(SHELL, encoding="utf-8")
    (tmp_path / "assets" / "index-abc123.js").write_text("console.log('app')", encoding="utf-8")
    (tmp_path / "favicon.ico").write_bytes(b"\x00icon")
    return tmp_path


def build_app(directory: Path | None) -> FastAPI:
    """An app with one API route, mounted the way `main.py` mounts it."""
    app = FastAPI()

    @app.get(f"{API_PREFIX}/content/version")
    async def version() -> dict[str, str]:
        return {"contentVersion": "test"}

    @app.get("/health", include_in_schema=False)
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.exception_handler(ProblemException)
    async def handle_problem(request: object, exc: ProblemException):  # type: ignore[no-untyped-def]
        return problem_response(exc.problem, exc.headers)

    mount_frontend(app, directory, api_prefix=API_PREFIX)
    return app


@pytest.fixture
async def client(bundle: Path) -> AsyncIterator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=build_app(bundle))
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as created:
        yield created


# -- where the bundle comes from --------------------------------------------


def test_the_bundle_location_is_configurable(monkeypatch: pytest.MonkeyPatch) -> None:
    """The container puts it somewhere else than a checkout does."""
    monkeypatch.delenv(ENV_VAR, raising=False)
    assert frontend_dir() == DEFAULT_FRONTEND_DIR

    monkeypatch.setenv(ENV_VAR, "/srv/frontend")
    assert frontend_dir() == Path("/srv/frontend")


async def test_without_a_bundle_the_api_still_runs(tmp_path: Path) -> None:
    """The normal state in development, where Vite serves the app."""
    transport = httpx.ASGITransport(app=build_app(tmp_path / "not-built-yet"))
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as bare:
        assert (await bare.get(f"{API_PREFIX}/content/version")).status_code == 200
        assert (await bare.get("/")).status_code == 404


def test_a_directory_without_a_shell_is_not_served(tmp_path: Path) -> None:
    """Assets with no `index.html` is a half-finished build, not a frontend."""
    (tmp_path / "assets").mkdir()
    assert mount_frontend(FastAPI(), tmp_path, api_prefix=API_PREFIX) is False


# -- serving ----------------------------------------------------------------


async def test_the_root_serves_the_shell(client: httpx.AsyncClient) -> None:
    response = await client.get("/")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert "the app shell" in response.text


async def test_a_client_route_gets_the_shell_rather_than_a_404(client: httpx.AsyncClient) -> None:
    """The router runs in the browser, so an unknown path is its business."""
    response = await client.get("/profiles/p-1/anything")
    assert response.status_code == 200
    assert "the app shell" in response.text


async def test_real_files_are_served_as_themselves(client: httpx.AsyncClient) -> None:
    assert (await client.get("/assets/index-abc123.js")).text == "console.log('app')"
    assert (await client.get("/favicon.ico")).content == b"\x00icon"


async def test_hashed_assets_are_cached_forever_and_the_shell_never_is(
    client: httpx.AsyncClient,
) -> None:
    """`index.html` names the current bundle; caching it strands a browser on
    an old build."""
    assert "immutable" in (await client.get("/assets/index-abc123.js")).headers["cache-control"]
    assert "no-cache" in (await client.get("/")).headers["cache-control"]


# -- the API is not shadowed ------------------------------------------------


async def test_api_routes_still_answer(client: httpx.AsyncClient) -> None:
    response = await client.get(f"{API_PREFIX}/content/version")
    assert response.status_code == 200
    assert response.json() == {"contentVersion": "test"}


async def test_health_is_not_swallowed_by_the_catch_all(client: httpx.AsyncClient) -> None:
    assert (await client.get("/health")).json() == {"status": "ok"}


async def test_an_unknown_api_path_is_a_problem_document_not_html(
    client: httpx.AsyncClient,
) -> None:
    """ "The API returned HTML" is its own genre of bug; a 200 shell in place of
    a 404 is how it starts."""
    response = await client.get(f"{API_PREFIX}/nope")
    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/problem+json")
    assert "the app shell" not in response.text


async def test_the_schema_is_still_the_schema(client: httpx.AsyncClient) -> None:
    """`/openapi.json` and `/docs` belong to FastAPI, not to the catch-all."""
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert "openapi" in response.json()


# -- traversal ---------------------------------------------------------------


@pytest.mark.parametrize(
    "path",
    ["/../../etc/passwd", "/%2e%2e/%2e%2e/etc/passwd", "/assets/../../../etc/passwd"],
)
async def test_a_path_climbing_out_of_the_bundle_serves_the_shell_instead(
    client: httpx.AsyncClient, path: str
) -> None:
    """Never a file from outside the bundle, whatever the encoding."""
    response = await client.get(path)
    assert response.status_code in (200, 404)
    assert "root:" not in response.text
    if response.status_code == 200:
        assert "the app shell" in response.text


async def test_a_file_outside_the_bundle_is_not_served_even_when_it_exists(
    bundle: Path, tmp_path: Path
) -> None:
    secret = tmp_path.parent / "secret.txt"
    secret.write_text("do not serve me", encoding="utf-8")
    transport = httpx.ASGITransport(app=build_app(bundle))
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as outside:
        response = await outside.get(f"/../{secret.name}")
        assert "do not serve me" not in response.text
