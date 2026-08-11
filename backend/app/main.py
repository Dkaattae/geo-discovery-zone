"""Application wiring.

Routes mount under `/api/v1` to match the contract's local development server
(`http://localhost:3000/api/v1`); `GEO_API_PREFIX` overrides it.

Every error leaves as `application/problem+json`, including FastAPI's own
validation failures — the contract has no other error shape.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.auth import auth_store
from app.problems import ProblemException, problem_body, problem_response
from app.routers import auth as auth_router
from app.routers import content, profiles, sessions
from app.store import store

API_PREFIX = os.environ.get("GEO_API_PREFIX", "/api/v1")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("GEO_API_CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    store.seed()
    auth_store.seed()
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
    return {
        "status": "ok",
        "contentVersion": store.content_version,
        "entities": len(store.entities),
        "questions": len(store.questions),
    }
