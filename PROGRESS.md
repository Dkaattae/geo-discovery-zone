# Progress

Where the project stands against [`geoquizdataplan.md`](geoquizdataplan.md).
Section numbers below refer to that plan.

_Last updated: 2026-08-24_

## In one paragraph

The **whole stack is built and runs**: a React app, a FastAPI backend serving all
29 operations in `openapi.yaml`, a database that survives restarts (SQLite or
Postgres), accounts with hashed passwords, and one Docker image that serves both
halves on one origin. What is thin is the **content**: 15 hand-written states and
26 questions in two formats, where the plan describes 50 states generated from
templates across ten topics. The pipeline that builds all 50 states works and has
run live — nothing connects it to the app yet. That bridge is §D of
[`tasks.md`](tasks.md) and it is the highest-leverage work left.

## Layout

```
frontend/       the TanStack Start app (question loop, map, profiles)
backend/        the FastAPI API, and the server that serves the built app
question-bank/  build-time data pipeline (Wikidata → entity JSON)
openapi.yaml    the contract, implemented by backend/ and consumed by frontend/
Dockerfile      Node build stage → Python runtime, one image
docker-compose.yml  the same image plus a Postgres
```

The service is in `backend/`; `conventions.md` still says `api/` (T-046).

Docs: [`geoquizdataplan.md`](geoquizdataplan.md) is the plan (§5 is the tech
stack), [`tasks.md`](tasks.md) is the work queue, [`process.md`](process.md) is
how to work through it, and [`CLAUDE.md`](CLAUDE.md) holds the repo rules. This
file is the coarse-grained view; `tasks.md` is where the detail lives.

## Done

### Backend — the API exists (plan §5)

- **Every operation in `openapi.yaml` is served**: content, bundles, auth,
  profiles, sessions, review rounds, undo, export/import. Errors are RFC 9457
  `application/problem+json` throughout, including FastAPI's own validation
  failures.
- **The rules moved server-side.** Selection (`selection.py`), grading, mastery,
  level drift and reveal (`grading.py`) and level→grade/band (`levels.py`) are
  pure functions ported from the client, so a child cannot edit their own
  progress and two clients cannot disagree about a rule.
- **Database, not memory** (§5.3): SQLAlchemy 2 models, **Alembic owns the
  schema**, one session per request, committed on return and rolled back on
  exception. `GEO_DATABASE_URL` chooses the backend and nothing else in the app
  names a dialect.
- **SQLite and Postgres both supported and both tested** — the same 221 tests run
  against either, with 9 Postgres-only checks that skip on SQLite.
- **Accounts and auth**: PBKDF2-SHA256 passwords (210k iterations), opaque bearer
  tokens stored as SHA-256 digests with a 12h TTL, another account's profile
  answers 404 rather than 403. `openapi.yaml` gained the security scheme to match.
- **One image serves both halves**: the frontend builds under Node, the Python
  image serves those files next to the API — same origin, no CORS, hashed assets
  cached forever, SPA fallback that excludes `/api/v1` so a mistyped endpoint
  returns a problem document rather than an HTML page with a 200.
- 221 unit and endpoint tests, including contract tests that walk `openapi.yaml`
  in both directions, plus 28 integration tests against a real stack.

### Frontend — the v1 loop, now on the API

- Screen flow end to end (§3.1): splash → sign-in → profile picker → create →
  home → setup → question loop → summary.
- **Talks to the real backend.** TanStack Query against a typed client; profiles,
  sessions, grading and progress all come from the server. `localStorage` holds
  the bearer token and nothing else.
- Question loop with the asymmetric reveal (§3.5): a correct answer gets a fun
  fact, a wrong one gets a reason plus the answer on the map. Two tiers, second
  behind a button.
- US map on `us-atlas` + `react-simple-maps`, joined on FIPS, `geoAlbersUsa`
  (§2.2, §2.3). **The map fills in as states are mastered** (§3.6) — from the
  server's join keys, not the client's opinion.
- Difficulty as one scalar (§1.4): `level` 0–18, grade and band derived for
  display. Level drift ±0.5 applied silently (§1.5).
- Review queue (§3.7): wrong answers queue the entity, every ~7th question pops
  one, two clean passes clear it, capped at 20.
- **`bestSustainedLevel` is sustained, not peak** (§1.5) — it only rises after
  two consecutive correct.
- Soft milestones at 5/10/20, a quit flow reporting places learned rather than a
  percentage (§3.6, §3.8), and no timers anywhere (§3.4).
- 19 tests over the API client.

### Question bank — the pipeline

- `question-bank/` builds entity records for the 50 US states from a single
  Wikidata SPARQL query (§1.9), with backoff and a descriptive User-Agent.
- **Run live against Wikidata**: 50 states, every core field populated, zero
  warnings. Ranks verified against reality — California first by population,
  Alaska first by area, Rhode Island fiftieth.
- Curated override table for the things Wikidata is bad at: FIPS join keys,
  regions, animals, kid-facing climate phrasing (§1.7, §1.9). Wikidata's FIPS is
  cross-checked; mismatches warn rather than silently win.
- Ranks computed across the full field and suppressed to `null` on a partial
  build, so a one-state run cannot claim Colorado is the largest state.
- Wikipedia summary pass writes `fun-facts.review.json` for human review —
  unreviewed text never reaches an entity's shippable fields (§1.6).
- `EntitySink` seam, one committed sample run, and a recorded fixture of a real
  50-row response so `--offline` reproduces a full build with no network.
- 19 tests.

### Repo and process

- Working docs in place — `CLAUDE.md`, `tasks.md`, `process.md`,
  `test-guidelines.md`, `conventions.md`, `decisions.md`, and `tasks/` for the
  brief in flight.
- Four agents in `.claude/agents/` — task-expander, worker, tester, reviewer —
  each prevented from grading its own work.
- CI on every PR and push to `main`, five jobs: `frontend` and `question-bank`
  (typecheck, lint, test), `backend` (ruff + 221 tests on SQLite),
  `backend-postgres` (the same suite against a Postgres service container), and
  `integration` (the compose stack).
- **Integration tests** in `backend/integration/` — 28 black-box tests over HTTP
  that import nothing from `app`: the image serves the frontend and the API on
  one origin, content is public, a child's sitting works end to end, accounts
  cannot see each other's profiles, and a restart is not a reset.
- A root `README.md` covering what the app is, the stack, and how to run it.

## Completed tasks

One line per task as it lands, newest first. The queue in `tasks.md` holds only
what is still ahead; this is where finished work is recorded.

### The backend, built off-queue (PRs #16–#21, 2026-08-11 → 2026-08-24)

**This did not go through `process.md`.** It was five conversational requests
built end to end in one long session — no briefs in `tasks/`, no `task-expander`,
no independent `tester`, no `reviewer`. It closes **T-030 through T-038 and
T-041 and T-042**, which are deleted from the queue as done; it is logged here as
one entry because it did not land as separate tasks.

- **#16** — FastAPI implementing `openapi.yaml`, in-memory, seeded, with auth.
- **#17** — the frontend moved onto the real client; a `Makefile`; the store
  replaced with SQLAlchemy + SQLite + Alembic, dialect-neutral behind
  `GEO_DATABASE_URL`. This is where `frontend/src/data/` was deleted and its bank
  copied by hand into `backend/app/data/content.json`.
- **#18** — the `Dockerfile`: Node build stage → Python runtime, one image.
- **#19** — the root `README.md`.
- **#20** — Postgres: `psycopg` in the production deps, per-dialect engine
  settings, the suite runnable against either backend, `docker-compose.yml`.
- **#21** — renamed the compose file (open at the time of writing).

**What that costs, stated plainly:** every verdict on this work came from the
session that wrote it. The tests are real and they pass — 221 backend, 19
frontend, 19 question-bank — and the app was driven end to end in a browser
against both databases, but `process.md`'s "independently verified in a fresh
session" did not happen. Where a fresh pair of eyes would most likely find
something: the hand-copied content bank (T-040), the region vocabulary that
diverged unnoticed (T-017), and the Docker path nobody has run (T-049).

Also decided during it, and recorded here because it changes plan §5.2:
**profiles and accounts were built.** The plan said "profiles last, and only if
wanted… until there is a concrete reason and a considered privacy answer."
Dkaattae gave that answer on 2026-08-11 — the server stores a username, a
password or PIN, and nothing else identifying; a child's profile is a nickname
and an animal, never a real name. Plan §5.2 and §5.4 are amended to match.

### Earlier tasks, on-process

- **T-003 — CI: typecheck, lint and test on every PR** (PR #11, 2026-08-10). One
  job per package in `.github/workflows/ci.yml`, on `pull_request` and `push` to
  `main`: `bun install --frozen-lockfile`, a lockfile-drift check, then
  typecheck, lint (`frontend` only) and tests.
  *Differed from the brief:* three verify rounds and one lost criterion. The
  criterion named a **file path** where it meant a **behaviour**, so the mutation
  it prescribed died at `Typecheck` before reaching the step under test. Rewording
  it exposed a worse problem: the guard was a hand-written `find` deciding what
  counts as a test file, and it disagreed with bun. Run 31270170161 was **green
  with a failing test in the tree** — a green check certifying nothing, the exact
  failure the task existed to prevent. The fix deleted the guard and asked bun
  instead (`bun test --pass-with-no-tests`).
- **T-002 — `test-guidelines.md` corrected against the first real tests** (PR #9,
  2026-08-06). The seams table pointed at the wrong door: it said to test through
  `SparqlTransport`, `SummaryTransport` and `EntitySink`, and none of the 19 tests
  uses any of them — they call `parseUsStates` and `normalizeUsStates` directly,
  because the behaviours worth testing sit downstream of the network.
  *Differed from the brief:* ran on the light path with no brief file, which
  produced three defects inside one task; D-6 was amended so a light task gets a
  **shorter brief**, not none. *Also weaker than it looks:* the tester ran in the
  worker's session, so T-002's verdict is not independent evidence either.
- **T-001 — first tests for `question-bank`** (PR #6, 2026-08-04). 19 tests
  covering ranks across the full field and their suppression on a partial one,
  curated FIPS winning over Wikidata's, border resolution by QID and by label,
  and WKT centroid parsing. Verified by mutation: six deliberate breakages, each
  killing exactly the right tests. *Differed from the brief:* criterion 6 was
  amended mid-task — Colorado cannot demonstrate that non-state neighbours are
  excluded, because all seven of its neighbours are states. Montana carries that
  case instead.

## Known gaps in what is done

**Content — the big one.**

- The app serves **15 states and 26 questions**, in **2 of 9 formats** and **2 of
  10 topics**. A child who learns those fifteen has finished it, and the map can
  never fill past 30%. (§D of `tasks.md`)
- **The pipeline's 50 states never reach the app.** `backend/app/data/content.json`
  was hand-copied from the deleted `frontend/src/data/`; no loader bridges the two
  (T-040).
- Fun facts for the other 35 states are drafted but **not reviewed**. Nothing
  ships until a human rewrites them (§1.6).
- `state_animal` is **0 of 50**; `landmark` and `climate_kid` are **1 of 50**;
  `top_crops` is empty. These are the data behind four unbuilt topics.
- **Two region vocabularies exist and they disagree** — eight in the pipeline,
  thirteen in the served bank, six of which the pipeline never emits (T-017).

**Verification and process.**

- **Nobody has run `docker build` or `docker compose up`** — no daemon in the
  environment they were written in. The integration suite now tests that path,
  but nothing has executed it against a real daemon yet, so the first
  `integration` CI run is the first honest signal (T-049).
- **No CI run has exercised the three new jobs.** Each step was run locally;
  that is not the same as GitHub running it.
- The public question bank hands out `correctIndex` by default — a leftover from
  when the client graded locally (T-053).
- `test-guidelines.md` still says `api/` does not exist (T-047), and
  `conventions.md` describes a repo with no backend and no CI (T-007).
- Frontend test files are excluded from `tsc` rather than typechecked (T-004),
  and `eslint .` still passes on 7 warnings (T-006).

**Behaviour.**

- A **React hydration warning** (#418) on first load of the production build. The
  app recovers; the cause is unfound (T-048).
- `/geometry`, `/elevation-profiles` and `/superlative-axes` are implemented and
  serve nothing, deliberately — the data is not in this repo (T-039).
- `drag_order`, `pin_*` and `click_profile` have no answer key; submitting one is
  a 422 rather than a guess (T-045).
- Bun's `fetch` cannot traverse some egress proxies, so the pipeline falls back
  to `curl`. A runtime without curl needs another path.
- Lovable builds from the repo root and will need repointing (T-044).

## Next

Broken into small, independently landable tasks in [`tasks.md`](tasks.md) — that
is the queue to work from. §4 of the plan is the authority on sequencing: **do
not build the world until the US loop feels good**, and the US loop is fifteen
states deep.

The shortest path to an app that is worth playing for an hour:

1. **T-040** — a loader, so the pipeline's output becomes the served bank.
2. **T-011** — review the 50 fun facts, the step that makes it feel handmade.
3. **T-050** — 50 states in the app, and a map that can actually fill.
4. **T-026 starting with superlatives** — a third topic for free, since the rank
   fields are already populated.

CI now guards all of it: the backend, the Postgres path and the compose stack
run on every pull request (T-009, T-052).

Then, in plan order: countries → world cities → rivers/mountains/oceans (§1.7),
pin formats (§2.5), elevation profiles (§2.6), and Elo once there is real play
data — which the backend is now finally collecting (§1.4).

### Deferred on purpose (§3.9)

Leaderboards, multiplayer, badges, sound, daily challenges, parent dashboard.
Each is a reasonable idea and each is a week not spent finding out whether the
core loop is fun.
