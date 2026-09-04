# Progress

Where the project stands against [`geoquizdataplan.md`](geoquizdataplan.md).
Section numbers below refer to that plan.

_Last updated: 2026-09-04_

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

The service is in `backend/`, and `conventions.md` has said so since T-007.
`CLAUDE.md` (lines 4 and 51) and `test-guidelines.md` still say `api/` — the
first is loop-gated and needs a hand-written `P` ticket, the second is T-047.
Which name wins is still T-046.

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
  in both directions, plus 30 integration tests and 13 browser tests against a
  real stack.
- **The session commits before the response is sent** (`DbSessionMiddleware`).
  It used to commit after, which FastAPI runs *after the response has reached the
  client* — so `register` could answer 201 before the row existed and the very
  next request would reject the brand-new password. Found by the browser suite.

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
- 80 tests — 19 over the API client, 61 over level→grade/band display. Test
  files are typechecked rather than excluded (`engineering-decisions.md` E-2) and CI fails
  if they stop existing (E-3).
- **The client's level labels and the server's are pinned to one another.**
  `frontend/src/lib/level.ts` and `backend/app/levels.py` are hand-copies; both
  suites now assert against the same committed table, `fixtures/level-labels.json`,
  so changing one alone turns a suite red instead of showing a child a different
  grade on each screen.

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
  `test-guidelines.md`, `conventions.md`, `process-decisions.md`,
  `engineering-decisions.md`, `process-tasks.md`, and `tasks/` for the
  brief in flight.
- **`conventions.md` is checked, not just written.**
  `frontend/src/conventions-doc.test.ts` asserts it against the repo it
  describes — every Layout path resolves, every `make` target and `bun run`
  script it names is defined, its CI job list equals `ci.yml`'s, and every
  relative link points at a file that exists (T-007). A doc that goes stale now
  fails a test instead of misleading the next session.
- Five agents in `.claude/agents/` — task-expander, worker, tester, reviewer,
  each prevented from grading its own work, plus `orchestrator`, which relays one
  task between the other four and reads none of their work.
- **A blocked run now announces itself.** `.github/workflows/blocked-run-notice.yml`
  reads a pushed brief's header and labels the PR `waiting on a human` with one
  comment when a task stops for a decision. Nothing is left running when a run
  halts, so the push is what raises the notice.
- Two unattended drivers for the same loop, enforcing the same six gates:
  `.claude/loop/run-loop.sh` locally (no model in it, a spend cap the CLI
  enforces, a fresh session id per step) and the `orchestrator` agent where no
  shell can run. **Neither has yet driven a task end to end.**
- CI on every PR and push to `main`, six jobs: `frontend` and `question-bank`
  (typecheck, lint, test), `backend` (ruff + 221 tests on SQLite),
  `backend-postgres` (the same suite against a Postgres service container),
  `integration` (the compose stack over HTTP) and `e2e` (a browser).
- **"No network in tests" is a fact about CI, not a claim in a doc.** The four
  unit test steps run with every proxy spelling pointed at a dead loopback port
  and a 15-minute timeout, demonstrated on a runner with a canary that goes red
  under the guard and green without it (T-005). `integration` and `e2e` are
  deliberately left unguarded.
- **Integration tests** in `backend/integration/` — 30 black-box tests over HTTP
  that import nothing from `app`: the image serves the frontend and the API on
  one origin, content is public, a child's sitting works end to end, accounts
  cannot see each other's profiles, a restart is not a reset, and a write is
  durable by the time its response says so.
- **End-to-end tests** in `e2e/` — 13 Playwright tests driving Chromium against
  docker compose: sign in, make an explorer, play every quiz type the app
  offers, and come back to find the progress still there.
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
- **#21** — renamed the compose file.
- **Then, on the queue:** T-009 and T-052 put the backend, the Postgres path and
  the compose stack under CI; T-054 added the browser suite, which found T-055
  on its first run — a write that was not durable when its response said it was.
  T-049 is closed: Dkaattae ran `docker compose up` and the stack works.

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

- **T-007 — `conventions.md` describes the repo that exists** (PR #33,
  2026-09-04). The file placed the API in an `api/` directory that was never
  built, told you to run it with `cd api && uv sync`, and described a repo with
  no CI, no database and no Docker. It now carries a Layout block whose seven
  paths all resolve, `make -C backend dev|test|check|migrate|revision` read out
  of `backend/Makefile`, `bun` commands checked against all three
  `package.json` files, `GEO_DATABASE_URL` with SQLite-default/Postgres-tested,
  the six CI jobs by name, Docker as a pointer to `README.md` rather than a
  second copy of it, and an explanation of `fixtures/level-labels.json` — the
  one committed table that `frontend/src/lib/level.test.ts` and
  `backend/tests/test_levels.py` both assert against, so a one-sided edit turns
  exactly one suite red. `## Code` and `## Network` were already correct and are
  byte-identical.
  *Differed from the brief:* nothing in the criteria, but two things worth
  knowing. The tester's 50 assertions (`frontend/src/conventions-doc.test.ts`,
  88 → 138 frontend tests) read their expected values out of `backend/Makefile`,
  the `package.json` files, `ci.yml` and `docker-compose.yml` rather than out of
  the doc, so the doc cannot ratify itself — and 23 mutations proved each one
  can fail. `CLAUDE.md` is stale in exactly the same way and was deliberately
  left alone: it is loop-gated, so it needs a hand-written `P` ticket. The
  worker could not run `frontend`'s `bun run typecheck` in the sandbox
  (`react-simple-maps` unreachable from the pinned registry, `node_modules`
  incomplete); CI's `frontend (typecheck, lint, test)` job is green on the head
  commit, which is what settled it.
- **T-006 — the frontend lint gate fails on warnings** (PR #29, 2026-09-03).
  `frontend`'s `lint` script is now `eslint . --max-warnings 0`, so any
  `warn`-severity rule fails the build, not only the one this task touches. Of
  the seven warnings CI had been printing and ignoring, one was in first-party
  code — `screens.tsx` exported `AVATARS` unused outside the file — and is
  fixed by un-exporting it; the other six are shadcn-generated primitives in
  `frontend/src/components/ui/`, exempted by a single path-scoped
  `eslint.config.js` override rather than per-file `eslint-disable` comments.
  The reasoning is `engineering-decisions.md` **E-4**. A dead `ci.yml` comment
  pointing at a swept brief is repointed at PR #11.
  *Differed from the brief:* `tasks.md`'s 2026-08-24 recheck said all seven
  warnings were in `components/ui/`; the seventh was first-party, so the split
  landed 1 fixed / 6 exempted rather than 0/7, exactly as the brief's
  Constraints anticipated. Every spawn mechanism (`Agent`, `claude -p` with
  `acceptEdits`, `bypassPermissions`) was closed at implementation time, so the
  fix was hand-finished by the relay session rather than by a spawned
  `worker` — root cause logged as **P-2** in `process-tasks.md`. The first
  independent-tester attempt was blocked by a session-id collision with the
  worker's; a second, genuinely independent session then verified all ten
  criteria by execution and mutation-tested the new assertions in
  `frontend/src/lint-gate.test.ts` (80 → 88 frontend tests). Criterion 5 named
  `decisions.md`, which no longer existed after PR #31 split it; `task-expander`
  repointed it at `engineering-decisions.md` and Dkaattae re-approved before the
  final tester pass.
- **T-005 — "no network in tests" is enforced rather than asserted** (PR #26,
  2026-08-28). CI's four unit test steps — `frontend` → `Test`, `question-bank` →
  `Test`, `backend` → `Test`, `backend-postgres` → `Test against Postgres` — now
  run with all six proxy spellings (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` and
  the lowercase forms) pointed at `http://127.0.0.1:1`, plus `timeout-minutes: 15`
  so a hang fails instead of burning the runner's six-hour default. Nothing else
  in the file is guarded: `Install` still resolves packages, and `integration` and
  `e2e` still talk HTTP to a real stack, which is what they exist to test. The
  rule was proved rather than assumed — a temporary canary doing
  `httpx.get("https://example.com/")` and a bare `fetch` turned
  [run 32982842910](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/32982842910)
  red under the guard and
  [run 32983516529](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/32983516529)
  green without it, then was deleted. `test-guidelines.md` carries the command to
  reproduce it locally.
  *Differed from the brief:* the six variables are `export`ed as the first lines
  of each step's script instead of declared as a step `env:` mapping. During the
  work, every push whose `ci.yml` carried those six names as `env:` keys produced
  a zero-job run marked failed before any job started, while six non-proxy names
  in the same shape ran clean — isolated across ten pushes, **cause never
  established**, possibly specific to the sessions that saw it. The two forms are
  identical at runtime and `ci.yml` says so, so this is a note rather than a rule.
  *Decided and not built:* no permanent self-check re-proving the canary on every
  run — it would spend CI minutes on every PR to catch something diff review
  catches, and its design has more than one defensible answer. Revisit if the
  guard is ever found silently deleted.
- **T-004 — tests for `level.ts`, and frontend test files typechecked** (PR #23,
  2026-08-24). 61 tests over the five exports of `frontend/src/lib/level.ts`, and
  one committed table — `fixtures/level-labels.json`, at the repo root beside
  `openapi.yaml` — that both `frontend/src/lib/level.test.ts` and
  `backend/tests/test_levels.py` assert against, so the client and server label
  arithmetic can no longer drift in silence. Two workarounds became decisions:
  **E-2** (was D-9), `frontend/tsconfig.json` stops excluding `*.test.ts(x)` and
  `@types/bun` pays for it; **E-3** (was D-10), `--pass-with-no-tests` is gone, so deleting
  the frontend suite now fails CI.
  *Differed from the brief:* three things. The two implementations turned out
  **not** to disagree anywhere — 2,301 levels compared, zero mismatches — so the
  fixture pins a live invariant rather than papering over a bug, which is the
  cheap moment to install it. `bun add -d` could not run: 23 packages in
  `frontend/bun.lock` are pinned to a private registry the agent sandbox answers
  with 403, so the two lockfile entries were taken from a throwaway project and
  spliced in by hand — CI's `Install` and `Lockfile unchanged` steps are what
  confirm bun accepts them, and a clean local `bun add` never happened. And the
  survey found `backend/app/levels.py:60` documenting a `levelWindow()` the
  client does not have, now **T-057**.
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
  instead (`bun test --pass-with-no-tests`). *That flag is itself now gone* —
  `frontend/` has tests, so T-004 removed it and recorded why in `engineering-decisions.md`
  E-3. The step is a bare `bun test`.
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

- The public question bank hands out `correctIndex` by default — a leftover from
  when the client graded locally (T-053).
- `test-guidelines.md` still says `api/` does not exist (T-047), and `CLAUDE.md`
  still calls the backend "not built yet" in `api/` (lines 4 and 51). `CLAUDE.md`
  is loop-gated, so correcting it is a hand-written `P` ticket, not a `T` task.
  `conventions.md` was the third of these and is fixed (T-007, PR #33).
- `README.md:202` says CI runs five jobs and names five; there are six (T-058).

**Behaviour.**

- **The map cannot fill in during a child's first session.** A state needs four
  right answers; the bank has at most two questions per state. A perfect first
  sitting colours in nothing, and it takes a second visit (T-056).
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
