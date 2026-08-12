# `backend/` — Geo Quiz API

FastAPI implementation of [`openapi.yaml`](../openapi.yaml). Every operation in
the contract is served; state lives in memory and is seeded at startup, so the
frontend has a real bank to render against without a database.

```bash
make -C backend dev     # http://127.0.0.1:8000/api/v1/... — docs at /docs
make -C backend test    # 178 tests
make -C backend check   # lint + format check + tests, what CI should run
make -C backend help    # every target
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
| **Content** — entities, questions, bundles, version | Seeded from the shipped v1 bank: 15 states, 26 questions |
| **Profiles / Sessions** | Fully implemented, in memory, lost on restart |
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
them.

### Seeded credentials

`grownup@example.com` / `atlas-demo-password`, owning one demo profile
(`p-demo-maya`). It exists so the frontend has something to log in as in local
development. **It is a fixture, not a credential to deploy** — the store is
in-memory, so there is nothing to migrate when it goes.

```bash
curl -s localhost:8000/api/v1/auth/token \
  -H 'content-type: application/json' \
  -d '{"username":"grownup@example.com","password":"atlas-demo-password"}'
```

## Layout

```
app/
  main.py         app wiring, problem+json error handlers, CORS
  models.py       pydantic models mirroring openapi.yaml (snake_case ↔ camelCase)
  store.py        in-memory content bank, profiles, sessions, seed
  auth.py         accounts, password hashing, bearer tokens, the auth dependency
  problems.py     RFC 9457 problem details
  levels.py       level → grade/band/labels (mirrors frontend/src/lib/level.ts)
  selection.py    pickQuestion, ported from frontend/src/lib/session.ts
  grading.py      grading, mastery, level drift, prompts, reveal
  serializers.py  record → contract payload
  routers/        content.py, auth.py, profiles.py, sessions.py
  data/           content.json — the seeded bank
tests/            pytest; endpoint tests go through the app with httpx.AsyncClient
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
- The store is in memory. Postgres, Alembic and the `api/` layout in
  `conventions.md` §Layout are a separate task; nothing here creates tables.
- Tokens and profiles vanish on restart.
