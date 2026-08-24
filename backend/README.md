# `backend/` — Geo Quiz API

FastAPI implementation of [`openapi.yaml`](../openapi.yaml). Every operation in
the contract is served; state lives in a database — SQLite or Postgres — that is
migrated and seeded at startup, so a fresh clone has a real bank to render
against and a restart is not a reset.

```bash
make -C backend dev              # http://127.0.0.1:8000/api/v1/... — docs at /docs
make -C backend test             # 221 tests on SQLite (9 Postgres-only ones skip)
make -C backend test-postgres    # the same suite against a real Postgres server
make -C backend test-integration # 28 tests against a real docker compose stack
make -C backend check            # lint + format check + tests, what CI runs
make -C backend help             # every target
```

`make` is a thin wrapper over `uv`; the underlying commands still work from
inside `backend/`:

```bash
uv sync
uv run fastapi dev app/main.py
uv run pytest && uv run ruff check .
```

Override the port with `make dev PORT=8080`. With a server running,
`make -C backend token` prints a bearer token for the demo account and
`make -C backend smoke` hits health, content version and an authenticated
profile list. Interactive docs at `/docs`, health at `/health`.

## What is real and what is not

| Group | State |
|---|---|
| **Content** — entities, questions, bundles, version | Loaded into the database from the shipped v1 bank: 15 states, 26 questions |
| **Profiles / Sessions** | Fully implemented and persisted; a restart is not a reset |
| **Geometry, elevation profiles, superlative axes** | Endpoints implemented, **no data seeded** — see below |

Vector geometry, elevation cross-sections and superlative rankings need sampled
or licensed source data this repo does not carry yet. Inventing them would put
wrong numbers in front of children in an app that claims to teach, so
`/elevation-profiles` and `/superlative-axes` return empty lists and
`/geometry/{layer}` returns a 404 that says what is missing and where the real
data comes from. The v1 client bundles `us-atlas` at build time and does not
need the geometry endpoint.

The content seed in `app/data/content.json` is `frontend/src/data/` remapped to
the contract's field names (`type` → `format`, `fipsCode` → `geometryId`,
`highlightFips` → `highlightGeometryId`). The prose is the same human-written,
reviewed text the client already ships — nothing here was generated.

## Docker: one image, both halves

[`Dockerfile`](../Dockerfile) at the repo root builds the frontend with Node and
hands the static files to a Python image, which serves them alongside the API:

```bash
docker build -t wander-the-atlas .
docker run -p 8000:8000 -v atlas-data:/data wander-the-atlas
# the app on http://localhost:8000, the API under /api/v1, docs at /docs
```

Same origin for both, which is what removes CORS from the picture — the client
asks for a relative `/api/v1`. The database lives on the `/data` volume so a
`docker rm` does not take a child's progress with it, and migrations and seeding
run on startup.

`app/frontend.py` does the serving: hashed assets under `/assets` cached
forever, `index.html` never cached, and anything that is not a real file falls
back to the shell so client-side routes work. Paths under `/api/v1` are
excluded from that fallback — a mistyped endpoint returns the contract's problem
document rather than a page with a 200, which is how "the API returned HTML"
starts.

Without a bundle the app runs as a bare API; that is the normal state in
development, where Vite serves the frontend and proxies here. Point
`GEO_FRONTEND_DIR` at a bundle to serve one from a checkout:

```bash
cd frontend && bun run build:static     # → frontend/dist/client
GEO_FRONTEND_DIR=../frontend/dist/client make -C backend run
```

## The database

**Two backends are supported: SQLite and Postgres.** One environment variable
chooses between them, and nothing else in the app names a dialect:

```bash
GEO_DATABASE_URL=sqlite:///./geoquiz.db                          # the default
GEO_DATABASE_URL=postgresql+psycopg://user:pw@host:5432/geoquiz  # Postgres
```

The `psycopg` driver ships with the app, so moving to Postgres is the variable
and a migration run — no install, no code change. Both backends run the same
migrations and the same tests:

```bash
make test           # the suite on SQLite
make test-postgres  # the same suite on a real Postgres server
                    # GEO_TEST_DATABASE_URL=postgresql+psycopg://... make test-postgres
```

`docker compose up --build` from the repo root runs the app against a Postgres
container if you would rather not install one.

**Alembic owns the schema** (`conventions.md`); nothing calls `create_all`.
`make migrate` runs `alembic upgrade head`, and the app also runs it on startup
so a fresh clone works — set `GEO_MIGRATE_ON_STARTUP=0` where the deploy
pipeline migrates instead. `make revision m="..."` writes the next migration
from the models, and a test asserts the migrations and the models still agree,
so drift fails the suite rather than a deployment.

**Staying portable.** Only column types both backends have: `String`,
`Integer`, `Float`, `Boolean`, `JSON`, and a `DateTime` wrapped so it always
returns UTC-aware values. No `JSONB`, no arrays, no server defaults, no dialect
functions — a test walks the metadata and fails if one appears, and a Postgres
test reads `information_schema` to confirm what actually landed (`json`,
`timestamptz`, `double precision`).

The per-dialect settings in `db.py` exist to make the two behave the *same*:

- **SQLite** gets foreign keys switched on (off by default there) and the
  driver's implicit transaction handling replaced with explicit `BEGIN`,
  without which a rollback does not reliably roll back.
- **Postgres** gets `pool_pre_ping` and a `pool_recycle`, because a pooled
  connection that a restart, a failover or an idle timeout closed underneath us
  looks fine until the query fails, plus a connect timeout and an
  `application_name` so `pg_stat_activity` can name the app holding a lock.

**What is a column and what is JSON.** Anything filtered or joined on is a
column — ids, ownership, topic, level, counts — so `/questions?topic=capital`
is a query rather than a scan. Collections always read and written whole are
JSON: a profile's mastery map, a session's asked/seen/learned lists, and the
undo snapshots. The review queue is its own table because it carries per-entity
state and an order.

**Transactions.** One session per request, committed when the handler returns
and rolled back if it raises, so the answer that moves a level, queues an
entity and writes a row either lands whole or not at all. Undo restores
snapshots taken before the answer rather than computing an inverse.

**Seeding** is idempotent: content reloads only when the bank's version
changes, and the demo account and profile are created only if absent, so
restarting a server with real data in it changes nothing.

```bash
make migrate     # alembic upgrade head
make revision m="add streaks"
make db-reset    # delete the local SQLite file (refuses anything else)
```

## Authentication

The contract as written had no security scheme. This adds one, and
`openapi.yaml` was updated to match (tag `Auth`, `securitySchemes.bearerAuth`,
per-operation `security` on every Profiles and Sessions operation).

- **Content is public.** It is build-time generated, cacheable and carries no
  user data; a token on it would buy nothing.
- **Profiles and Sessions require a bearer token.** They hold children's data.
- Passwords are stored as `pbkdf2_sha256$<iterations>$<salt>$<hash>` — 210,000
  iterations, per-account salt, constant-time comparison. The format records its
  own cost, so it can be raised later without invalidating stored hashes.
- Tokens are opaque random strings; only their SHA-256 digest is stored, and
  they expire after 12 hours. Not JWTs: nothing here needs offline verification,
  and an opaque token can be revoked (`POST /auth/logout`).
- A profile belongs to the account that created it. Another account's profile
  answers **404, not 403**, so an account cannot probe for which ids exist.
- `Profile.pinHash` is never returned. A four-digit PIN's hash is a four-digit
  PIN.

Both hashing and tokens are standard library — no new dependency was taken for
them. Tokens now live in the database, so a restart no longer signs everyone
out; `purge_expired_tokens` clears the rows that have aged out.

### Seeded credentials

`grownup@example.com` / `atlas-demo-password`, owning one demo profile
(`p-demo-maya`). It exists so the frontend has something to log in as in local
development. **It is a fixture, not a credential to deploy** — it is created
only when absent, so deleting the row is enough to be rid of it.

```bash
curl -s localhost:8000/api/v1/auth/token \
  -H 'content-type: application/json' \
  -d '{"username":"grownup@example.com","password":"atlas-demo-password"}'
```

## Layout

```
app/
  main.py         app wiring, migrations on startup, problem+json handlers, CORS
  models.py       pydantic models mirroring openapi.yaml (snake_case ↔ camelCase)
  db.py           engine, session-per-request, GEO_DATABASE_URL
  orm.py          the mapped tables
  store.py        queries: content, profiles, sessions, seeding
  auth.py         accounts, password hashing, bearer tokens, the auth dependency
  problems.py     RFC 9457 problem details
  levels.py       level → grade/band/labels (mirrors frontend/src/lib/level.ts)
  selection.py    pickQuestion, ported from frontend/src/lib/session.ts
  grading.py      grading, mastery, level drift, prompts, reveal
  serializers.py  record → contract payload
  routers/        content.py, auth.py, profiles.py, sessions.py
  data/           content.json — the bank loaded into the database
migrations/       Alembic; the schema is defined here, not by create_all
tests/            pytest; endpoint tests go through the app with httpx.AsyncClient
                  against a migrated database, each test in a rolled-back
                  transaction. GEO_TEST_DATABASE_URL points the suite at Postgres
integration/      the tests that need a real stack — over HTTP, importing nothing
                  from app. See integration/README.md
```

The rules the contract states in prose live in `grading.py` and `selection.py`
as pure functions, so they can be tested without a request:

- every seventh question comes from the review queue when one is waiting;
- a wrong answer queues the **entity**, not the question — a missed place comes
  back from a different angle;
- four correct in a row raises the level by 0.5, three wrong drops it by 0.5,
  both silently;
- `bestSustainedLevel` needs two consecutive correct, never a peak;
- review is *offered* at five cumulative wrong and never straight after a wrong
  answer;
- the summary reports places learned, never a percentage.

## Notes on the implementation

- **Errors** are `application/problem+json` everywhere, including FastAPI's own
  validation failures, which are rewritten into `errors[{path, message}]`.
- **Array query parameters are comma-separated** (`?topic=capital,location`),
  matching the contract's `style: form, explode: false`.
- **Absent means absent.** Optional fields the seed does not carry are omitted
  rather than nulled, so "not yet sourced" does not read as a value.
- **Pagination** cursors are opaque (base64 offset); a forged one is a 422.
- **Bundles** are immutable per `contentVersion` and support `If-None-Match`.
- **Re-serving is idempotent.** Calling `next-question` with a question still in
  play returns that same question rather than burning a new one.
- **Undo** restores a snapshot of the profile and session taken before the
  answer, within a 30-second window, and only for the most recent answer.

## Known gaps

- `drag_order`, `pin_*` and `click_profile` questions have no answer key in the
  seeded bank; submitting one returns 422 rather than a guess. Pin grading is
  implemented as nearest-centroid with a distance cap — the contract's
  polygon-then-centroid strategy needs the geometry layers.
- CI only runs the SQLite path. The suite passes against a real Postgres 16
  locally (`make test-postgres`), but nothing runs it automatically, so a
  Postgres-only regression would not fail a pull request.
- The directory is `backend/`, where `conventions.md` §Layout says `api/`.
- Question selection loads its topic's pool and picks in Python. Past a few
  thousand questions per topic the difficulty window should move into SQL —
  `store.candidate_questions` says where.
