"""Fixtures for the integration suite: a real stack, reached over HTTP.

Nothing in here imports `app`. That is the point — these tests are the only
ones that exercise the image, the compose file, the Postgres container and the
built frontend, and they can only do that by staying outside the process.

Two ways to run:

    make -C backend test-integration          # brings up docker compose, tears it down
    GEO_E2E_BASE_URL=http://localhost:8000 uv run pytest integration

The second points at a stack you are already running — faster to iterate
against, and the only option where Docker is not available. Tests that need to
restart the stack skip themselves in that mode, because it is not ours to bounce.

With neither a base URL nor a working Docker daemon, the whole suite skips with
a reason rather than failing: a missing daemon is not a broken build.
"""

from __future__ import annotations

import os
import subprocess
import time
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import httpx
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPOSE_FILE = REPO_ROOT / "docker-compose.yml"

BASE_URL_ENV = "GEO_E2E_BASE_URL"
API_PREFIX = "/api/v1"

# Its own project name and port, so a stack a developer is already running is
# neither reused nor destroyed. The project name also namespaces the Postgres
# volume, so `down -v` here cannot take someone's local data with it.
PROJECT = "atlas-integration"
PORT = int(os.environ.get("ATLAS_TEST_PORT", "8099"))

BUILD_TIMEOUT_SECONDS = 900
HEALTH_TIMEOUT_SECONDS = 180
RESTART_TIMEOUT_SECONDS = 120

# The demo fixture the image seeds on first start. The README promises it, so
# the suite checks it rather than assuming it.
DEMO_USERNAME = "grownup@example.com"
DEMO_PASSWORD = "atlas-demo-password"


def compose(*args: str, timeout: int = 120, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["docker", "compose", "-p", PROJECT, "-f", str(COMPOSE_FILE), *args],
        cwd=REPO_ROOT,
        env={**os.environ, "ATLAS_PORT": str(PORT)},
        capture_output=True,
        text=True,
        timeout=timeout,
        check=check,
    )


def docker_is_available() -> bool:
    try:
        subprocess.run(["docker", "info"], capture_output=True, timeout=30, check=True)
    except (OSError, subprocess.SubprocessError):
        return False
    return True


def wait_for_health(base_url: str, timeout: int) -> dict[str, Any]:
    """Polls until the app answers, or explains what it was still waiting for.

    The app migrates and seeds on startup, so "the container is running" and
    "the API works" are seconds apart on a cold volume and further apart on a
    cold build.
    """
    deadline = time.monotonic() + timeout
    last: str = "no attempt made"
    while time.monotonic() < deadline:
        try:
            response = httpx.get(f"{base_url}/health", timeout=5)
            if response.status_code == 200:
                return response.json()
            last = f"HTTP {response.status_code}: {response.text[:200]}"
        except httpx.HTTPError as error:
            last = f"{type(error).__name__}: {error}"
        time.sleep(2)
    raise TimeoutError(f"{base_url}/health did not answer within {timeout}s — last: {last}")


@pytest.fixture(scope="session")
def stack() -> Iterator[str]:
    """The base URL of a running stack. Brings one up unless given one."""
    external = os.environ.get(BASE_URL_ENV)
    if external:
        yield external.rstrip("/")
        return

    if not COMPOSE_FILE.exists():  # pragma: no cover - a broken checkout
        pytest.skip(f"{COMPOSE_FILE} is missing")
    if not docker_is_available():
        pytest.skip(
            "no Docker daemon reachable — run these where one is, or point "
            f"{BASE_URL_ENV} at a running stack"
        )

    base_url = f"http://127.0.0.1:{PORT}"
    # Any leftovers from a crashed run, volume included: a stale database would
    # make the seeding assertions pass for the wrong reason.
    compose("down", "-v", "--remove-orphans", check=False)
    try:
        compose("up", "-d", "--build", timeout=BUILD_TIMEOUT_SECONDS)
    except subprocess.CalledProcessError as error:  # pragma: no cover - build failure
        pytest.fail(f"docker compose up failed:\n{error.stdout}\n{error.stderr}")

    try:
        wait_for_health(base_url, HEALTH_TIMEOUT_SECONDS)
        yield base_url
    except TimeoutError as error:  # pragma: no cover - startup failure
        logs = compose("logs", "--no-color", "--tail", "80", check=False)
        pytest.fail(f"{error}\n\n--- compose logs ---\n{logs.stdout}")
    finally:
        compose("down", "-v", "--remove-orphans", timeout=180, check=False)


@pytest.fixture(scope="session")
def owns_the_stack() -> bool:
    """False when pointed at someone else's stack, which we must not bounce."""
    return BASE_URL_ENV not in os.environ


@pytest.fixture
def http(stack: str) -> Iterator[httpx.Client]:
    """Rooted at the origin, so a test can reach both the app and the API."""
    with httpx.Client(base_url=stack, timeout=30, follow_redirects=False) as client:
        yield client


@pytest.fixture
def api(stack: str) -> Iterator[httpx.Client]:
    """Rooted at the API prefix, the way the client talks to it."""
    with httpx.Client(base_url=f"{stack}{API_PREFIX}", timeout=30) as client:
        yield client


def unique_username(prefix: str) -> str:
    """A username no earlier run can have taken.

    The stack outlives a single test — and, when pointed at a long-running one,
    outlives the whole suite — so rows written by one test are still there for
    the next. A hardcoded username passes on a fresh stack and fails with a 409
    the second time the suite runs, which is the worst kind of flake: green in
    CI, red on a developer's machine.
    """
    return f"{prefix}-{time.time_ns()}@example.test"


PASSWORD = "correct-horse-battery"


def register(api: httpx.Client, username: str, password: str = PASSWORD) -> str:
    """A fresh account and its bearer token.

    Every test that needs an account makes its own. The stack is shared across
    the session and rows persist, so two tests reusing one username is a
    cross-test dependency waiting to happen.
    """
    response = api.post("/auth/register", json={"username": username, "password": password})
    assert response.status_code == 201, response.text

    token = api.post("/auth/token", json={"username": username, "password": password})
    assert token.status_code == 200, token.text
    return str(token.json()["accessToken"])


def auth(token: str) -> dict[str, str]:
    return {"authorization": f"Bearer {token}"}


@pytest.fixture
def account(api: httpx.Client, request: pytest.FixtureRequest) -> dict[str, str]:
    """Headers for an account named after the test that asked for one."""
    return auth(register(api, unique_username(request.node.name)))


@pytest.fixture
def profile(api: httpx.Client, account: dict[str, str]) -> dict[str, Any]:
    response = api.post(
        "/profiles", headers=account, json={"name": "Fox", "avatar": "🦊", "grade": 2}
    )
    assert response.status_code == 201, response.text
    return dict(response.json())
