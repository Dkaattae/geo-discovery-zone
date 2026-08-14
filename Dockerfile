# Wander the Atlas — one image that serves the app and the API.
#
#   docker build -t wander-the-atlas .
#   docker run -p 8000:8000 -v atlas-data:/data wander-the-atlas
#
# Two stages: Node builds the frontend to static files, then a Python image
# takes those files and runs the backend, which serves them. Nothing from the
# build stage survives except `dist/client` — no node_modules, no toolchain, no
# source.
#
# The database defaults to a SQLite file on the /data volume, so the container
# keeps profiles across restarts. Point GEO_DATABASE_URL at Postgres to move it.

# ---------------------------------------------------------------- frontend --
FROM node:22-bookworm-slim AS frontend

# Bun is the package manager this repo locks with (`bun.lock`), copied in rather
# than installed with npm, which the repo does not use. The build itself runs on
# Node: vite, the SSR pass and the prerender that writes index.html.
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app/frontend

# Dependencies first: this layer is rebuilt only when the lockfile changes.
COPY frontend/package.json frontend/bun.lock frontend/bunfig.toml ./
RUN bun install --frozen-lockfile

COPY frontend/ ./
# `build:static` — not the default `build`, which produces a nitro server bundle
# for Cloudflare. This one emits dist/client: index.html, hashed assets, favicon.
RUN node scripts/build-static.mjs \
    && test -f dist/client/index.html

# ----------------------------------------------------------------- backend --
FROM python:3.11-slim-bookworm AS backend

# uv is the only Python tool this repo uses — never pip, never poetry.
COPY --from=ghcr.io/astral-sh/uv:0.8.17 /uv /usr/local/bin/uv

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app/backend

# Dependencies before the source, for the same layer-caching reason. `--no-dev`
# leaves pytest and ruff out of the image; `--frozen` fails rather than quietly
# resolving something the lockfile does not name.
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/ ./
RUN uv sync --frozen --no-dev

# The built app, and where the backend should look for it.
COPY --from=frontend /app/frontend/dist/client /app/frontend-dist
ENV GEO_FRONTEND_DIR=/app/frontend-dist

# A volume, so the database is not inside the container's writable layer, where
# a `docker rm` would take a child's progress with it.
ENV GEO_DATABASE_URL=sqlite:////data/geoquiz.db
RUN mkdir -p /data && chown -R nobody:nogroup /data
VOLUME ["/data"]

# Nothing here needs root once the files are in place.
USER nobody

EXPOSE 8000
# Migrations and seeding run on startup (GEO_MIGRATE_ON_STARTUP=0 to skip them
# where a deploy pipeline migrates first).
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2).status == 200 else 1)"

CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
