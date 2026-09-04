# Conventions

Detail that does not need to be in front of every session. `CLAUDE.md` carries
the rules that always apply; this carries the rest.

## Layout

```
frontend/        React 19 + TanStack Start app (TypeScript, bun)
backend/         FastAPI + SQLAlchemy + Alembic API (Python, uv), serving /api/v1 and, once built, the frontend on the same origin
question-bank/   Wikidata → entity JSON pipeline (TypeScript, bun)
e2e/             Playwright end-to-end suite, run against a real docker compose stack (TypeScript, bun)
fixtures/        data shared across languages and suites — see "Shared fixtures" below
tasks/           brief for the task in flight; empty when nothing is
openapi.yaml     the contract between frontend and backend
```

### Shared fixtures

[`fixtures/level-labels.json`](fixtures/level-labels.json) is a committed
level → grade/band/label table that two suites in two languages assert
against directly: [`frontend/src/lib/level.test.ts`](frontend/src/lib/level.test.ts)
and [`backend/tests/test_levels.py`](backend/tests/test_levels.py). Both
`frontend/src/lib/level.ts` and `backend/app/levels.py` implement the same
mapping independently — nothing else notices when one changes and the other
does not — so editing the table on one side without the other turns exactly
one of those two suites red instead of drifting quietly.

## Code

**TypeScript is strict**, including `exactOptionalPropertyTypes`. Optional
fields are declared `field?: T | undefined`, not `field?: T` — the latter fails
to typecheck when assigned a possibly-undefined value.

**Formatting** is prettier at 100 columns, double quotes, semicolons, trailing
commas everywhere. `bun run format` in `frontend/`; `question-bank/` uses the
same settings via `bunx prettier`. Python is `ruff format`.

**Alembic owns the database schema.** The pipeline emits JSON and a Python
loader writes it; nothing else creates tables (plan §5.3). `DbSink` in
`question-bank/` is a seam for standalone use, not the path that defines tables.

**Join on codes, never on names.** FIPS for US states, ISO 3166-1 alpha-3 for
countries. "Côte d'Ivoire", "Ivory Coast" and "CIV" are the same place, and
name-joining will lose you an evening finding that out.

**No secrets in the repo, and no API keys in the client.** The pipeline runs at
build time precisely so no key ever reaches a browser. Keys come from the
environment.

## Commands

```bash
# frontend
cd frontend && bun install && bun run dev
cd frontend && bun run typecheck && bun run lint && bun run format
cd frontend && bun test                     # the frontend suite

# question bank
cd question-bank && bun install
bun run build              # live: query.wikidata.org → data/us-states/
bun run build:sample       # offline replay of the recorded fixture
bun run typecheck
bun test

# e2e — thirteen full user journeys against a real docker compose stack
cd e2e && bun install && bun run install-browser   # once, fetches Chromium
cd e2e && bun run typecheck
cd e2e && bun run test                      # brings the stack up, runs, tears it down

# backend — every target below is defined in backend/Makefile; `make -C
# backend help` lists them all with their descriptions
make -C backend dev               # http://127.0.0.1:8000/api/v1/... — docs at /docs
make -C backend test              # the suite on SQLite, the default
make -C backend check             # lint + format check + test — what CI runs
make -C backend migrate           # alembic upgrade head
make -C backend revision m="add streaks"   # a new migration from model changes
```

`backend/README.md` has the full command list, including `test-postgres`,
`test-integration` and running the backend without `make` at all.

## The database

`GEO_DATABASE_URL` is the single setting that chooses the database. SQLite is
the default (`sqlite:///./geoquiz.db`), and Postgres is supported and
tested — both backends run the same Alembic migrations and the same test
suite, and `make -C backend test-postgres` runs it against a real Postgres
server. See `backend/README.md` "The database" for the portability rules
(only column types both dialects share) and why Alembic, not `create_all`,
owns the schema.

## CI

Every pull request against `main`, and every push to `main`, runs
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) as six independent
jobs: `frontend`, `question-bank`, `backend`, `backend-postgres`,
`integration`, `e2e`. Each installs from a frozen lockfile, checks the
lockfile did not move, then runs its checks independently so one red step
never hides another. The four unit-test steps (`frontend`, `question-bank`,
`backend`, `backend-postgres`) point every proxy variable at a dead port so no
outbound request can reach the network (`test-guidelines.md`, "No network in
tests, ever"); `integration` and `e2e` are the two jobs that build the Docker
image and run against a real stack instead.

## Docker

The app ships as one image: [`Dockerfile`](Dockerfile) builds the frontend and
hands the static files to a Python image that serves them and the API on one
origin. [`docker-compose.yml`](docker-compose.yml) runs that image against a
Postgres container for the Postgres path. Build and run instructions are in
[`README.md`](README.md) "Run it locally with Docker" — this file only points
at them so they are not kept true in two places.

## Network

`question-bank` needs `query.wikidata.org` and `en.wikipedia.org`. Bun's `fetch`
cannot negotiate every egress proxy, so `httpGet()` falls back to `curl` on
transport failure and logs when it does; `QUESTION_BANK_NO_CURL=1` disables it.
A `403 Host not in allowlist` is the sandbox, not Wikidata.
