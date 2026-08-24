"""The stack itself: it comes up, it is one origin, and content is public.

These are the claims the unit suite structurally cannot make. It runs the app
in-process against a database it built itself, so it can tell you the handler is
right and nothing about whether the image, the compose file, the Postgres
container or the built frontend exist.
"""

from __future__ import annotations

import re

import httpx

from integration.conftest import API_PREFIX, DEMO_PASSWORD, DEMO_USERNAME

# -- it came up -------------------------------------------------------------


def test_the_stack_answers_and_says_what_it_is_talking_to(http: httpx.Client) -> None:
    health = http.get("/health")
    assert health.status_code == 200
    body = health.json()
    assert body["status"] == "ok"
    # Migrations and seeding both run on startup; an unseeded database here
    # means the startup path silently did nothing.
    assert body["contentVersion"] != "unseeded"
    assert body["entities"] > 0
    assert body["questions"] > 0


def test_a_password_does_not_appear_in_the_health_output(http: httpx.Client) -> None:
    """The compose file puts a password in `GEO_DATABASE_URL`. `/health` is
    unauthenticated, so it is the one place that credential could leak."""
    database = http.get("/health").json()["database"]
    assert "geoquiz:geoquiz" not in database
    if database.startswith("postgresql"):
        assert "***" in database


def test_the_interactive_docs_are_served(http: httpx.Client) -> None:
    assert http.get("/docs").status_code == 200
    schema = http.get("/openapi.json")
    assert schema.status_code == 200
    assert f"{API_PREFIX}/content/version" in schema.json()["paths"]


# -- one origin -------------------------------------------------------------


def test_the_app_shell_is_served_from_the_root(http: httpx.Client) -> None:
    """The whole point of the image: the API also serves the frontend."""
    response = http.get("/")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert "<div id=" in response.text or "<script" in response.text


def test_the_shell_is_never_cached_but_hashed_assets_are_cached_forever(
    http: httpx.Client,
) -> None:
    """A cached `index.html` pins a browser to a deploy that no longer exists;
    a hashed asset can never change under its name, so it is free to cache."""
    shell = http.get("/")
    cache_control = shell.headers.get("cache-control", "")
    assert "no-cache" in cache_control or "no-store" in cache_control

    asset_paths = re.findall(r'"(/assets/[^"]+)"', shell.text)
    assert asset_paths, "the shell references no hashed assets — did the frontend build?"

    asset = http.get(asset_paths[0])
    assert asset.status_code == 200
    assert "immutable" in asset.headers.get("cache-control", "")


def test_a_client_route_falls_back_to_the_shell(http: httpx.Client) -> None:
    """Client-side routing means a deep link is not a file on disk."""
    response = http.get("/some/client/route")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")


def test_an_unknown_api_path_is_a_problem_document_not_a_page(http: httpx.Client) -> None:
    """The SPA fallback must stop at the API prefix. Serving HTML with a 200
    for a mistyped endpoint is how "the API returned HTML" starts, and it is
    invisible until a client tries to parse it."""
    response = http.get(f"{API_PREFIX}/does-not-exist")
    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/problem+json")
    assert "text/html" not in response.headers["content-type"]


# -- content is public ------------------------------------------------------


def test_content_needs_no_token(api: httpx.Client) -> None:
    """Build-time reference data with no user in it. A token would buy nothing,
    and the client fetches it before anyone has signed in."""
    version = api.get("/content/version")
    assert version.status_code == 200
    assert version.json()["contentVersion"]

    entities = api.get("/entities")
    assert entities.status_code == 200
    assert entities.json()["data"], "no entities served"

    questions = api.get("/questions")
    assert questions.status_code == 200
    assert questions.json()["data"], "no questions served"


def test_the_served_bank_matches_what_health_reports(http: httpx.Client, api: httpx.Client) -> None:
    health = http.get("/health").json()
    entities = api.get("/entities", params={"limit": 200}).json()
    assert entities["page"]["total"] == health["entities"]


def test_the_answer_key_can_be_withheld_from_the_public_bank(api: httpx.Client) -> None:
    """`/questions` is public and `includeAnswerKey` defaults to **true**, which
    the contract explains as the v1 client grading locally. It does not any more
    — the server grades — so today a child with the network tab open can read
    `correctIndex` off the unauthenticated bank. Flipping that default is a
    contract change and its own task; what is asserted here is that opting out
    works, which is the half a test can hold steady while the default is decided.
    """
    with_key = api.get("/questions", params={"limit": 1}).json()["data"][0]
    assert "correctIndex" in with_key  # the current default, contract line 1166

    without = api.get("/questions", params={"limit": 1, "includeAnswerKey": "false"})
    assert "correctIndex" not in without.json()["data"][0]


def test_a_bundle_revalidates_rather_than_being_resent(api: httpx.Client) -> None:
    """Bundles are immutable per contentVersion, which is what makes the ETag
    worth having — the client asks once per release, not once per launch."""
    listed = api.get("/bundles").json()["data"]
    if not listed:
        return  # no bundles in this bank; nothing to revalidate

    bundle = api.get(f"/bundles/{listed[0]['id']}")
    assert bundle.status_code == 200
    etag = bundle.headers["etag"]

    again = api.get(f"/bundles/{listed[0]['id']}", headers={"If-None-Match": etag})
    assert again.status_code == 304


# -- the seeded demo account ------------------------------------------------


def test_the_demo_account_the_readme_promises_exists(api: httpx.Client) -> None:
    """The README tells a new user to sign in with these. If seeding did not
    run, they get a 401 and no way in."""
    response = api.post("/auth/token", json={"username": DEMO_USERNAME, "password": DEMO_PASSWORD})
    assert response.status_code == 200, response.text
    assert response.json()["accessToken"]


def test_the_demo_password_is_not_accepted_for_a_different_account(api: httpx.Client) -> None:
    response = api.post(
        "/auth/token", json={"username": "nobody@example.test", "password": DEMO_PASSWORD}
    )
    assert response.status_code == 401
