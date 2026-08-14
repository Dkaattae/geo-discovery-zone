"""Serving the built frontend.

In production the API and the app are one origin: the backend serves
`frontend/dist/client` and the browser never learns there were two projects.
That is what removes CORS from the picture entirely, and it is why the client
calls a relative `/api/v1`.

Mounted last, so every API route already matched. Two rules keep it honest:

- **Nothing under the API prefix falls through to HTML.** A mistyped endpoint
  gets the contract's problem document, not an index page with a 200 — that
  particular failure is the reason "the API returned HTML" is a genre of bug.
- **Hashed assets are immutable, the shell is not.** `index.html` names the
  current bundle, so caching it is how a browser gets stuck on an old build.

If the directory is absent the app runs as a bare API. That is the normal state
in development, where Vite serves the frontend and proxies here.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.problems import problem_exception

log = logging.getLogger("geoquiz")

ENV_VAR = "GEO_FRONTEND_DIR"
# Where `bun run build:static` leaves the bundle, relative to this repo.
DEFAULT_FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend" / "dist" / "client"

IMMUTABLE = "public, max-age=31536000, immutable"
NO_CACHE = "no-cache, must-revalidate"


def frontend_dir() -> Path:
    configured = os.environ.get(ENV_VAR)
    return Path(configured) if configured else DEFAULT_FRONTEND_DIR


def mount_frontend(app: FastAPI, directory: Path | None = None, *, api_prefix: str) -> bool:
    """Serve `directory` as the app's frontend. Returns False if it is absent."""
    root = (directory or frontend_dir()).resolve()
    index = root / "index.html"
    if not index.is_file():
        log.info("no frontend bundle at %s — serving the API only", root)
        return False

    assets = root / "assets"
    if assets.is_dir():
        # Content-hashed filenames, so they can be cached forever.
        app.mount("/assets", _ImmutableFiles(directory=assets), name="assets")

    reserved = (api_prefix.rstrip("/"), "/health", "/docs", "/redoc", "/openapi.json")

    @app.get("/{path:path}", include_in_schema=False)
    async def serve_frontend(request: Request, path: str) -> FileResponse:
        requested = "/" + path
        if any(requested == prefix or requested.startswith(prefix + "/") for prefix in reserved):
            raise problem_exception(
                404,
                "No such endpoint",
                f"{request.method} {requested} is not part of this API.",
                instance=requested,
            )

        candidate = _safe_path(root, path)
        if candidate is not None and candidate.is_file():
            return FileResponse(candidate)
        # Any other path is a client route: hand over the shell and let the
        # app's router decide what it means.
        return FileResponse(index, headers={"Cache-Control": NO_CACHE})

    log.info("serving the frontend from %s", root)
    return True


def _safe_path(root: Path, path: str) -> Path | None:
    """Resolve `path` inside `root`, or None if it climbs out of it."""
    if not path:
        return None
    candidate = (root / path).resolve()
    return candidate if candidate.is_relative_to(root) else None


class _ImmutableFiles(StaticFiles):
    """StaticFiles with a long cache lifetime for content-hashed assets."""

    def file_response(self, *args: object, **kwargs: object) -> object:
        response = super().file_response(*args, **kwargs)  # type: ignore[arg-type]
        response.headers.setdefault("Cache-Control", IMMUTABLE)
        return response
