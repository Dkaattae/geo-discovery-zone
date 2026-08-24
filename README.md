# Wander the Atlas

A geography quiz for kids in K–8. A place is highlighted on the map, the child
picks its name, and then — the part the app exists for — they get an
explanation or a fun fact about it. The quiz is the delivery mechanism; the
reveal is the product.

Four things shape every decision in here:

- **No timers anywhere.** A child thinking hard about a map is the app working,
  not a delay to optimise away.
- **A wrong answer is not a failure.** No red X, no percentage score. A miss
  earns the reason the right answer is right; a hit earns a fun fact.
- **The map is the progress bar.** Every place learned fills in on a US map, and
  the summary counts places learned, never a percentage.
- **Sessions have no fixed length.** However many questions the child feels
  like, with a gentle "great stopping point" at 5, 10 and 20.

Under the surface, difficulty is one number (`level`, 0–18, where grade and
difficulty are the same axis). Four correct in a row nudges it up, three wrong
nudges it down, both silently. A missed place goes on a review queue and comes
back later from a different angle.

## Tech stack

| Part | Built with |
|---|---|
| `frontend/` | React 19, TanStack Start + Router + Query, Vite 8, Tailwind 4, `react-simple-maps` with `us-atlas` for the map. Package manager: **bun** |
| `backend/` | FastAPI, SQLAlchemy 2, Alembic, Python 3.11+. Package manager: **uv** |
| Database | SQLite by default, Postgres supported. One URL chooses; both run the same migrations and the same test suite |
| `question-bank/` | Wikidata → JSON pipeline (TypeScript, bun) that generates the question bank |
| `openapi.yaml` | The contract between the frontend and the backend. Both sides are tested against it |

The backend serves the API *and* the built frontend, so in production there is
one origin, one port, and no CORS.

Only a US-states bank ships today: **15 states, 26 questions**, with
human-written and reviewed explanations.

## Run it locally with Docker

The image builds the frontend with Node and hands the static files to a Python
image that serves them next to the API.

```bash
# 1. Build (from the repo root)
docker build -t wander-the-atlas .

# 2. Run on port 8000, with a named volume for the database
docker run -d --name atlas -p 8000:8000 -v atlas-data:/data wander-the-atlas
```

Open **http://localhost:8000** — the app. The API is under
`http://localhost:8000/api/v1`, the interactive docs at `/docs`, and a health
check at `/health`.

### Keeping the same database every time

Two rules, and profiles survive restarts, rebuilds and upgrades:

1. **Always pass `-v atlas-data:/data`.** The container writes its SQLite file
   to `/data/geoquiz.db`. Without the volume that file lives inside the
   container and disappears with it.
2. **Always publish the same port, `-p 8000:8000`,** so bookmarks and the
   sign-in a browser remembers keep working.

Stopping and starting the *same* container is enough — the data is in the
volume either way:

```bash
docker stop atlas
docker start atlas
```

After a rebuild, replace the container and keep the volume:

```bash
docker rm -f atlas
docker run -d --name atlas -p 8000:8000 -v atlas-data:/data wander-the-atlas
```

Prefer a folder you can see and back up? Use a bind mount instead of the named
volume — same idea, and `./data/geoquiz.db` is then a file on your machine:

```bash
mkdir -p data
docker run -d --name atlas -p 8000:8000 -v "$(pwd)/data:/data" wander-the-atlas
```

The database is created and migrated on first start, and the question bank is
loaded then too. All of that is idempotent, so starting a container that
already has data changes nothing.

> **Deleting the volume deletes the profiles.** `docker volume rm atlas-data`
> is the one command that throws a child's progress away.

### Postgres instead of SQLite

SQLite is the default because one file and one container is the whole setup.
Postgres is the other supported backend, for when more than one process needs
the same data or the deploy already has a database. It is a URL — the `psycopg`
driver ships in the image, and the same migrations run on startup either way:

```bash
docker run -d --name atlas -p 8000:8000 \
  -e GEO_DATABASE_URL=postgresql+psycopg://user:pw@host:5432/geoquiz \
  wander-the-atlas
```

No volume is needed then; the data lives in Postgres. To get both halves at
once, [`docker-compose.yml`](docker-compose.yml) runs the app against a Postgres
container:

```bash
docker compose up --build     # the app on http://localhost:8000, as before
docker compose down           # stop, keep the data
docker compose down -v        # stop and delete the data
```

Same port, so the bookmark does not change. The database lives in the
`atlas-postgres` named volume, and the app waits for Postgres to answer
`pg_isready` before it migrates.

### Signing in

Profiles are behind a grown-up's account: a username and a password, and
nothing else — no email, no real names. A child's profile is a nickname and an
animal.

A demo account is created on first start so there is something to look at:

```
username: grownup@example.com
password: atlas-demo-password
```

It is a fixture for local use, not a credential to deploy. Delete the account
row, or make your own account from the app's sign-in screen and use that.

### Settings

Everything is an environment variable, all optional:

| Variable | Default in the image | What it does |
|---|---|---|
| `GEO_DATABASE_URL` | `sqlite:////data/geoquiz.db` | SQLite or Postgres (`postgresql+psycopg://…`). The driver for both ships in the image |
| `GEO_FRONTEND_DIR` | `/app/frontend-dist` | Where the built app is. Unset it and the container serves only the API |
| `GEO_API_PREFIX` | `/api/v1` | Where the API is mounted |
| `GEO_MIGRATE_ON_STARTUP` | `1` | Set `0` when a deploy pipeline runs `alembic upgrade head` itself |

```bash
docker run -d --name atlas -p 8000:8000 \
  -v atlas-data:/data \
  -e GEO_DATABASE_URL=postgresql+psycopg://user:pw@host/geoquiz \
  wander-the-atlas
```

## Run it locally without Docker

Two processes: the API, and Vite serving the app with hot reload and proxying
`/api` to the API.

```bash
make -C backend dev              # API on :8000, migrates and seeds on start
cd frontend && bun install && bun run dev   # app on :8080
```

Use the URL Vite prints — **http://localhost:8080** by default. It proxies
`/api` to the backend, so the app talks to a same-origin API exactly as it does
in the container, whichever port Vite ends up on. `GEO_API_URL` moves the
backend it proxies to.

The backend on :8000 serves only the API in development: it has no built
frontend to serve unless you run `bun run build:static` in `frontend/`.

The database is `backend/geoquiz.db`, a file in the repo (git-ignored). It is
the same database every run; `make -C backend db-reset` deletes it and the next
start rebuilds and reseeds.

## Checks

```bash
make -C backend check           # ruff + 221 tests, against a migrated SQLite file
make -C backend test-postgres   # the same suite against a real Postgres server
cd frontend && bun test && bun run typecheck && bun run lint
cd question-bank && bun test && bun run typecheck
```

`test-postgres` needs a server to point at; override the default with
`GEO_TEST_DATABASE_URL=postgresql+psycopg://… make -C backend test-postgres`.
The nine Postgres-only tests skip on SQLite, so nobody needs a database
installed to run `make -C backend check`.

CI runs the frontend and question-bank jobs on every pull request. **It does
not run the backend tests yet** — a Python job is the obvious next addition.

## Layout

```
frontend/           the app (React, bun)
backend/            the API and the server that serves the app (FastAPI, uv)
question-bank/      Wikidata → JSON pipeline that generates questions (bun)
openapi.yaml        the contract between frontend and backend
Dockerfile          Node build stage → Python runtime, one image
docker-compose.yml  the same image plus a Postgres, for the Postgres path
```

More detail, and the reasoning behind it:

- [`backend/README.md`](backend/README.md) — the API, the database, auth
- [`frontend/README.md`](frontend/README.md) — the design brief the app is built to
- [`geoquizdataplan.md`](geoquizdataplan.md) — the plan and why it is shaped this way
- [`CLAUDE.md`](CLAUDE.md), [`process.md`](process.md),
  [`conventions.md`](conventions.md) — how work gets done here
- [`PROGRESS.md`](PROGRESS.md) — what is done, broken and next

## Known issues

- **A React hydration warning on first load of the Docker build.** The app
  recovers and every screen works, but the prerendered shell and the first
  client render disagree about something. It does not happen in development.
- **CI only runs the SQLite path.** The suite passes against a real Postgres 16
  locally, but nothing runs `make -C backend test-postgres` automatically, so a
  Postgres-only regression would not fail a pull request.
- Geometry, elevation profiles and superlative endpoints exist but serve no
  data: they need sampled or licensed sources this repo does not carry, and a
  guessed number in an app that teaches children is worse than none.
