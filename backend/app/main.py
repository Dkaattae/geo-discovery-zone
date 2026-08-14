"""Application wiring.

Routes mount under `/api/v1` to match the contract's local development server
(`http://localhost:3000/api/v1`); `GEO_API_PREFIX` overrides it.

On startup the app brings the schema up to date and makes sure the content bank
and the demo account are present. All three steps are idempotent, so restarting
a server with real data in it changes nothing.

Every error leaves as `application/problem+json`, including FastAPI's own
validation failures — the contract has no other error shape.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from alembic import command
from alembic.config import Config
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import store
from app.auth import ensure_demo_account
from app.db import database_url, session_scope
from app.frontend import mount_frontend
from app.problems import ProblemException, problem_body, problem_response
from app.routers import auth as auth_router
from app.routers import content, profiles, sessions

log = logging.getLogger("geoquiz")

API_PREFIX = os.environ.get("GEO_API_PREFIX", "/api/v1")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("GEO_API_CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
# Set GEO_MIGRATE_ON_STARTUP=0 where a deploy runs `alembic upgrade head` itself.
MIGRATE_ON_STARTUP = os.environ.get("GEO_MIGRATE_ON_STARTUP", "1") != "0"
BACKEND_DIR = Path(__file__).resolve().parent.parent


def run_migrations() -> None:
    """`alembic upgrade head`, in-process."""
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    command.upgrade(config, "head")


def prepare_database() -> None:
    if MIGRATE_ON_STARTUP:
        run_migrations()
    with session_scope() as db:
        meta = store.ensure_content_loaded(db)
        ensure_demo_account(db)
        store.ensure_demo_profile(db)
    log.info("database ready at %s, content %s", database_url(), meta.content_version)


@asynccontextmanager
async def lifespan(app: FastAPI):
    prepare_database()
    yield


app = FastAPI(
    title="Wander the Atlas — Geo Quiz API",
    version="1.0.0",
    summary="Content, profile and session API for the kids' geography quiz.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["ETag", "Location"],
)

app.include_router(content.router, prefix=API_PREFIX)
app.include_router(auth_router.router, prefix=API_PREFIX)
app.include_router(profiles.router, prefix=API_PREFIX)
app.include_router(sessions.router, prefix=API_PREFIX)


@app.exception_handler(ProblemException)
async def handle_problem(request: Request, exc: ProblemException):
    return problem_response(exc.problem, exc.headers)


@app.exception_handler(StarletteHTTPException)
async def handle_http_exception(request: Request, exc: StarletteHTTPException):
    title = exc.detail if isinstance(exc.detail, str) else "Request failed"
    body = problem_body(exc.status_code, title, instance=request.url.path)
    return problem_response(body, getattr(exc, "headers", None))


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError):
    body = problem_body(
        422,
        "Validation failed",
        "The request did not match the contract.",
        instance=request.url.path,
        errors=[_field_error(error) for error in exc.errors()],
    )
    return problem_response(body)


def _field_error(error: dict[str, Any]) -> dict[str, str]:
    """`("body", "pin")` → `/pin`, so the path matches the request document."""
    location = [str(part) for part in error.get("loc", ()) if part not in ("body", "query", "path")]
    return {
        "path": "/" + "/".join(location) if location else "/",
        "message": str(error.get("msg", "invalid")),
    }


@app.get("/health", include_in_schema=False)
async def health() -> dict[str, Any]:
    """Reports the database it is actually talking to, not the one configured."""
    with session_scope() as db:
        meta = store.content_meta(db)
        entities, questions = store.content_counts(db)
    return {
        "status": "ok",
        "database": _redacted(database_url()),
        "contentVersion": meta.content_version if meta else "unseeded",
        "entities": entities,
        "questions": questions,
    }


def _redacted(url: str) -> str:
    """A Postgres URL can carry a password; health output should not."""
    if "@" not in url:
        return url
    scheme, _, rest = url.partition("://")
    _, _, host = rest.rpartition("@")
    return f"{scheme}://***@{host}"


# Last, so every API route is matched first and the catch-all only sees what is
# left. Absent in development, where Vite serves the app and proxies here.
SERVING_FRONTEND = mount_frontend(app, api_prefix=API_PREFIX)
