# Progress

Where the project stands against [`geoquizdataplan.md`](geoquizdataplan.md).
Section numbers below refer to that plan.

_Last updated: 2026-09-18_

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
  unreviewed text never reaches an entity's shippable fields (§1.6). Reviewed
  text comes from the other direction: a `fun_facts` field on `CuratedState`
  (`src/curated/us-states.ts`), folded into each entity by `normalize.ts` the way
  `climate_kid` and `landmark` already are. **All 50 states carry one fact**
  (T-011).
- `EntitySink` seam, one committed sample run, and a recorded fixture of a real
  50-row response so `--offline` reproduces a full build with no network.
- **The built 50-state bank is committed** (`question-bank/data/us-states/`,
  T-010, `engineering-decisions.md` **E-6**) — a fresh clone already has it, and
  an offline rebuild from the committed fixture reproduces it byte-for-byte
  (`sources.built_at` now comes from the fixture's capture time, not wall
  clock), which `committed-bank.test.ts` ("T-010 criteria 6 and 8") checks on
  every `bun test` by actually running the offline build twice and diffing the
  bytes. T-040 still needs to write, this only settles what it reads from.
  Reviewed fun-fact text lives in `question-bank/src/curated/us-states.ts` as a
  build input, not in the built output the rebuild overwrites — see E-6, and
  T-011 filled it for all 50 states.
- **All 50 states carry a `state_animal`** (T-012, PR #42), curated the same way
  and living in the same build input as the fun facts — no blanks, 35 distinct
  values, and the shared ones (white-tailed deer ×10, black bear ×3, bison ×3,
  moose ×2, beaver ×2) are recorded on the PR because they make the `wildlife`
  question ambiguous in the animal → state direction (T-026).
- **44 of 50 states carry a `landmark`** (T-013, PR #43), in the same build input
  as the fun facts and the animals. Six are deliberately blank — DE, IA, KS, MS,
  OK, RI — because no kid-recognisable pick survived the "no battle site, no
  casino, no demolished structure, no guess" bar, which `CLAUDE.md` prefers to a
  guessed value. All 44 values are distinct and none is a substring of another, so
  landmark → state is unambiguous as a string compare; four pairs still collide to
  a *reader* (NH's "Mount Washington", LA's "St. Louis Cathedral", the two NASA
  museums in AL and TX, NE's "Chimney Rock") and T-026 records them.
- **All 50 states carry a `climate_kid` phrase** (T-014, PR #44), in the same
  build input as the fun facts, the animals and the landmarks — Colorado's was
  already there and is untouched. All 50 strings are distinct and none contains
  another, none names a state, none carries a digit, a unit or a geographer's
  word. What a test could not check is whether they are *true* and readable at
  nine: that is open on PR #44 as eight unticked boxes, and ten groups of
  substantively-interchangeable climates covering 41 of the 50 states are recorded
  there for T-026/T-022.
- **All 50 states carry a `highest_point` name** (T-016, PR #47). Forty-nine came
  from Wikidata's `P610` and have since the first commit; Alaska's row in the
  fixture has an elevation but no label, so it now comes from `CuratedState` —
  read only as a **fallback**, never over a live value (`engineering-decisions.md`
  **E-8**). A state left with neither source now warns at build time, so the next
  gap of this shape announces itself instead of shipping blank. Alaska's value
  is pinned equal to its `landmark`, so the two never drift apart — and
  **Dkaattae decided the still-open name question directly on PR #47
  (2026-09-18): Mount McKinley**, the same call T-013's reviewer left open on
  PR #43. Both fields were updated together.
  **`highest_point_m` is a separate problem** — at least five states carry feet
  under a metres key (T-069).
- **The offline-rebuild test harness lives in one place** (T-014, PR #44):
  `question-bank/src/offline-rebuild.ts` exports the dead-loopback proxy map and
  `rebuildOffline()`, and all six suites that check a byte-identical offline
  rebuild import it instead of pasting a fifth and sixth copy. There is exactly
  one `127.0.0.1:1` under `question-bank/src/`, asserted. The tracked-file
  *reading* route stays duplicated on purpose — `git ls-files` and `readdirSync`
  catch different failures.
- 687 tests (19 pre-existing, 190 added by T-010 across `data-us-states.test.ts`
  and `committed-bank.test.ts`, 34 by T-011 in `fun-facts.test.ts`, 96 by T-012 in
  `state-animals.test.ts`, 148 by T-013 across `landmarks.test.ts` and
  `landmarks-verify.test.ts`, 200 by T-014 across `climate-kid.test.ts` and
  `climate-kid-verify.test.ts`). That figure
  has now gone stale eleven times — T-065 replaces the hard-coded counts in this
  file, `tasks.md` and `test-guidelines.md` with something that cannot rot.

### Repo and process

- Working docs in place — `CLAUDE.md`, `tasks.md`, `process.md`,
  `test-guidelines.md`, `conventions.md`, `process-decisions.md`,
  `engineering-decisions.md`, `process-tasks.md`, and `tasks/` for the
  brief in flight.
- **`conventions.md` and `README.md` are checked, not just written.**
  `frontend/src/conventions-doc.test.ts` asserts both against the repo they
  describe — every Layout path resolves, every `make` target and `bun run`
  script they name is defined, their CI job lists equal `ci.yml`'s, the jobs
  credited with a lockfile-drift guard are exactly the ones that run
  `git diff --exit-code` against the lockfile they installed from, no count of
  tests is stated anywhere in `README.md` in digits or words (T-062), and every
  relative link points at a file that
  exists (T-007 for `conventions.md`, T-058 for `README.md`). A doc that goes
  stale now fails a test instead of misleading the next session.
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
  shell can run. **The `orchestrator` has now driven four tasks end to end** —
  T-006 (PR #29), T-007 (PR #33), T-008 (PR #34) and T-058 (PR #35), logged in
  `runs/`. What that
  costs is the same every time and is written into each brief rather than
  disguised: nobody approves the criteria (`Approved: orchestrator`), and every
  spawned role shares one session id, so the Sessions-table independence check
  does not run — only the fresh context window is real. `run-loop.sh` has still
  never driven a task.
- **`.claude/settings.json` now exists (P-2).** Its `permissions.allow` names the
  exact git verbs a role's ending calls for (`add`, `commit`, `push`, `checkout`,
  `fetch`, `status`, `log`, `diff`, `branch`, `rev-parse`) and the CLAUDE.md
  "Tests" checks (`bun install`, `bun run lint|typecheck|format`, `bun test`,
  `make -C backend check|test|migrate`) — verbs, never a `git:*`/`bun:*`
  wildcard. `process-decisions.md` **D-13** has the reasoning, plus a caveat
  found while wiring it up and not written down before: the allowlist only
  takes effect in a directory Claude Code has already marked trusted, which is
  per-machine state outside the repo. That was already true everywhere
  `run-loop.sh` has actually run; it just was not stated. **Still open:**
  `run-loop.sh` has not yet completed an end-to-end role run under the new
  allowlist — the sandboxed session that wired it up cannot itself accept a
  trust prompt, so the first real proof is still the first live run on a
  trusted machine.
- CI on every PR and push to `main`, six jobs: `frontend` and `question-bank`
  (typecheck, lint, test), `backend` (ruff + the suite on SQLite),
  `backend-postgres` (the same suite against a Postgres service container),
  `integration` (the compose stack over HTTP) and `e2e` (a browser). Four of the
  six also fail if the lockfile they installed from moved; `backend-postgres`
  and `integration` do not, which is P-3.
- **"No network in tests" is a fact about CI, not a claim in a doc.** The four
  unit test steps run with every proxy spelling pointed at a dead loopback port
  and a 15-minute timeout, demonstrated on a runner with a canary that goes red
  under the guard and green without it (T-005). `integration` and `e2e` are
  deliberately left unguarded.
- **CI's own supply chain has a written rule.** `oven-sh/setup-bun` and
  `astral-sh/setup-uv` are pinned to a commit SHA with a version comment;
  `actions/checkout` and `actions/upload-artifact`, published by GitHub, stay on
  their major tag. The reasoning, the rejected options and the revisit trigger
  are `engineering-decisions.md` **E-5** (T-008), and
  `frontend/src/ci-action-pinning.test.ts` turns red if `ci.yml` stops obeying
  it — since T-061 (PR #52) that is the **only** file implementing the rule, and
  it no longer pins `ci.yml`'s size, so adding a CI step does not read as a
  violation. **Nothing automates the pins** — no Dependabot, no Renovate; T-060 is the
  open question about whether to add one.
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
diverged unnoticed (T-017 — since found and settled, PR #49), and the Docker path
nobody has run (T-049).

Also decided during it, and recorded here because it changes plan §5.2:
**profiles and accounts were built.** The plan said "profiles last, and only if
wanted… until there is a concrete reason and a considered privacy answer."
Dkaattae gave that answer on 2026-08-11 — the server stores a username, a
password or PIN, and nothing else identifying; a child's profile is a nickname
and an animal, never a real name. Plan §5.2 and §5.4 are amended to match.

### Earlier tasks, on-process

- **T-061 — one rule, one implementation for E-5's CI guards** (PR #52,
  2026-09-19). Four rules in the `frontend/` suite were each written twice.
  `frontend/src/ci-workflow-pins.test.ts` is **deleted** — it was a behavioural
  subset of `ci-action-pinning.test.ts`, which is now the only file under
  `frontend/src/` that decides from a `uses:` owner whether a reference must be
  SHA-pinned. The two `toBe(13)` assertions on `ci.yml`'s size are gone,
  replaced by `unparsedUsesLines()`: every line that looks like `uses:` must
  decompose into `owner/repo@ref`, checked **by name rather than by count**, so
  a legitimately added CI step no longer reads as "you added a step" while a
  line the parser cannot read still fails and says which line. Inside
  `conventions-doc.test.ts`, `jobsCreditedByDoc()` and the inline copy of the
  backtick-run regex are gone in favour of the one `jobsDocClaimsCheckLockfile()`
  and the existing `longestBacktickRun()`. The `frontend/` suite is **198**
  tests afterwards (four went with the deleted file; two were added).
  *Differed from the brief:* the fourth pair — `testCountPattern` here versus
  `testCountClaims()` in `readme-test-count.criteria.test.ts` — was **kept, not
  folded**, which criterion 11 explicitly allowed either way. The second was
  written to be an independent implementation that can disagree with the first,
  and folding would have deleted that on a task that was not asked to revisit
  it; the real gap (only one of the two had a not-vacuous test) was closed
  instead. Both files carry the decision in a comment naming T-061.
  *Where the loop itself differed, and it is the part worth reading:*
  **no independent `tester` ever ran.** Every `claude -p` subprocess in this
  workspace was refused command execution — `bun`, `node`, `git add`, `gh` —
  across three roles in a row, so the tester returned `blocked` having run
  nothing, and `Status: pass` was set by Kate Chen on the strength of a direct
  suite run from the driving session that had already read the Handoff. **No
  mutation testing was run**: criteria 2, 3 and 6 are exercised by
  synthetic-fragment tests that do run in the green suite (the brief's preamble
  allows that as evidence), but the real-file mutations behind criteria 4, 5, 7,
  9, 10 and 11 were never executed, and nothing but reading says those guards
  still fire. The PR was marked ready **with an escalation note** saying exactly
  that rather than as routine. `process-tasks.md` **P-5** is the ticket for the
  underlying gap.

- **T-062 — the last unasserted test count in `README.md`** (PR #50,
  2026-09-18). `README.md:193` said "The **nine** Postgres-only tests skip on
  SQLite" — true, unasserted, and out of reach of T-058's guard, which looked
  only inside the Checks code block and only for digits. The number is gone and
  the sentence's real content stays (skip on SQLite, so no database server is
  needed for `make -C backend check`). The guard was widened rather than
  replaced: `testCountPattern` in `frontend/src/conventions-doc.test.ts` now
  scans the **whole** file for a number — digits or `one`…`fifteen` — followed
  within three words by `test`/`tests`, so "nine states" still passes and "the
  eleven Postgres-only tests" fails wherever it is written.
  *Differed from the brief:* nothing in the criteria. The brief allowed either
  dropping the number or pinning it; dropping it is the third time this repo has
  made that call (T-058 made it twice) and the only one that cannot itself go
  stale. Pinning would have meant counting `test_` functions in
  `backend/tests/test_postgres.py` from a `bun test` file. *Worth knowing:*
  `bun run typecheck` cannot be run in the sandbox these sessions use — the npm
  mirror 403s the `react-simple-maps`/`us-atlas` family, so `UsMap.tsx` fails to
  resolve on the unmodified tree too. Both worker and tester reproduced it
  pre-diff; CI's `frontend` job is green and is where the clean typecheck was
  confirmed.

- **T-017 — one region vocabulary, and it is the served bank's thirteen values**
  (PR #49, 2026-09-18). The pipeline's curated table used eight regions and the
  bank the app actually serves used thirteen; the curated file's own comment
  still claimed the two matched. **Dkaattae decided the thirteen win** — it is
  the list already shipping to children — so all 50 curated rows were reassigned
  (21 changed text; `Midwest`'s 12 states split across `Great Lakes`,
  `Upper Midwest` and `Great Plains`, `New England` split out of `Northeast`,
  Nevada out to `Great Basin`), the 13-value set is written down once in
  `us-states.ts`'s header block, and 21 built `us-state-*.json` files were
  regenerated by the offline build rather than hand-edited. Recorded as
  `engineering-decisions.md` **E-9**. `openapi.yaml`'s `Region` parameter
  description was corrected — doc text only, no schema change, still a free
  string per the brief's Out of scope. 68 tester tests
  (`question-bank/src/region-vocabulary.test.ts`,
  `backend/tests/test_region_vocabulary.py`) close the vocabulary over all three
  sources: the curated table, the built bank, and `content.json` plus the served
  `/entities` and `/questions` responses. Suite 1192 → 1254 in `question-bank`,
  233 → 248 in `backend`.
  *Where it differed from the brief:* all eight criteria met as written, but
  three things are worth carrying forward:
  - **It took two review rounds.** Round 1 found that `openapi.yaml`'s new text
    claimed `region` was "matched … exactly" when `backend/app/store.py`'s
    `_slug_expression` matches case- and hyphen-insensitively — the task existed
    to stop the contract and the data disagreeing, and shipped a fresh
    disagreement in the paragraph it was sent to fix. Also that `E-9` had been
    filed *between* `E-7` and `E-8`. Both fixed, both now under a regression
    test.
  - **The PR turned a passing test red and the first verdict did not see it**,
    because `climate-kid.test.ts`'s T-014 guard self-disables on a shallow clone
    and CI checks out shallow — so CI was green in two seconds while the test was
    red on any full clone. Closed with a named, test-policed allowlist; the
    underlying defect (task-scoped guards frozen into the permanent suite) went
    to **T-070**. *The lesson is the checkout, not the guard:* a verdict measured
    on a shallow clone cannot see this class of failure at all.
  - **Four regions have one or two states** — `Great Basin` = NV, `Pacific` = HI,
    `Pacific West` = CA, `Southwest` = AZ + NM — so T-022 cannot draw same-region
    distractors for them and needs a fallback. Noted on T-022.
  - **The per-state curation is flagged for a human, not closed.** The closed-set
    test proves every state has *a* value from the thirteen, never that it is the
    right one; five calls (Missouri → `Great Plains`, KY/WV → `Southeast`,
    DE/MD → `Northeast`, Idaho → `Mountain West`, the Dakotas → `Upper Midwest`
    while Nebraska → `Great Plains`) are recorded on PR #49 for review.

- **T-016 — Alaska's missing `highest_point`, filled from the curated table**
  (PR #47, 2026-09-18). The last blank field in the committed bank: Alaska's row
  in the recorded SPARQL fixture carries a `P2044` elevation and no `P610`
  *label*, the only one of 50 like that, so it shipped `highest_point_m: 6190`
  with no name. `CuratedState` gains an optional `highest_point`, read by
  `normalize.ts` as `row.highestPoint ?? curated.highest_point` — a live Wikidata
  label always wins, the curated value only fills a gap — and a state left with
  neither now raises a `field: "highest_point"` build warning, which is the half
  of the task that was actually missing: nothing warned before, so this gap had
  been invisible since the first commit. One line added to
  `us-state-ak.json`, nothing else in the bank moved. Recorded as
  `engineering-decisions.md` **E-8**. 50 worker tests + 50 tester tests
  (`highest-point.test.ts`, `highest-point-verify.test.ts`), 14 mutations each
  proven to redden the expected criterion, suite 1142 → 1192.
  *Where it differed from the brief:* nowhere in substance — all 16 criteria met
  as written, the survey held, no route change. Three things are worth carrying
  forward:
  - **It shipped "Denali" at review, then Dkaattae settled the name on the same
    PR (2026-09-18): Mount McKinley.** The value was copied from Alaska's
    existing `landmark`, and the two fields are pinned equal, so this was a
    **one-place edit in the curated table**, followed by an offline rebuild —
    exactly the shape the pinning was built for. It was the same open box as
    T-013 / PR #43; settling it here settled both. The "one edit" was one edit
    *in the curated data* — the name was also a literal in three test
    expectation tables (updated alongside it) and in `backend/app/data/content.json`'s
    Alaska fun fact (also updated; that file is the served bank T-040 replaces).
  - **The pinned-digest guards took a fourth exception**, in all three of
    `landmarks-verify`, `climate-kid-verify` and `top-crops-verify`, and this one
    had to be **asymmetric** — strip `highest_point` for `us-state-ak.json` only,
    because the field predated every pin for the other 49 states. A symmetric
    strip turns the guards red, proven by mutation. The accretion is now its own
    queue entry, **T-070**, which T-067, T-068 and T-069 all point at.
  - **The build report's printed output is still untested.** Criterion 8's "the
    report prints it" half could only be asserted by grepping `build.ts` for the
    absence of a field filter, because `rebuildOffline()` returns written files
    rather than stdout and two committed guards forbid a test from spawning
    `build.ts`. The behaviour was checked by hand and the workaround is declared
    in the test's own comment; closing it properly is part of T-070.
  - *Also worth knowing:* as with T-012 to T-015, all four roles ran under one
    session id — freshly spawned agents with separate context windows, but the
    Sessions-table independence check could not discriminate, and the Verdict
    said so rather than claiming it passed.
- **T-015 — all 50 states have crops, hand-curated rather than from USDA NASS**
  (PR #46, 2026-09-17). 98 crop strings across 50 new `top_crops` entries in
  `question-bank/src/curated/us-states.ts` — one to three genuinely famous
  **plant** crops per state, folded in by `normalize.ts` as
  `curated.top_crops ?? []` (`fun_facts`'s shape, not `climate_kid`'s
  conditional spread, so a future blank state keeps the key) and rebuilt offline
  into the 50 tracked files. Eight states carry one crop, 36 two, six three.
  This was the **last unpopulated curated field**, so all four topic fields now
  have data. **`top_crops` is the reviewed kid-facing text itself** — there is
  no `fun-facts.review.json`-style second pass for it, which is why the PR was
  escalated to Dkaattae for a content read rather than marked routinely ready.
  *Differed from the brief, four ways:*
  - **The task stopped being a NASS integration.** The expander halted on Q1–Q3
    before approval: no Quick Stats key exists in the repo, the environment or
    CI secrets, no agent can register for one, and CI's dead-loopback proxies
    would block a live fetch anyway. Dkaattae chose the curated route; the
    reasoning is kept in `engineering-decisions.md` **E-7**, and the queue entry's
    title ("from USDA NASS Quick Stats") is the thing that turned out to be wrong.
  - **Livestock split out mid-scope.** Cattle, dairy, poultry and eggs are farm
    output but not crops; criterion 4 bans fourteen livestock words from the
    field and the data moved to the new **T-068**.
  - **Six pre-existing tests outside the brief's Constraints had to change.**
    `committed-bank`, `landmarks`, `landmarks-verify`, `state-animals`,
    `climate-kid-verify` (and `climate-kid`) pinned the tracked bank against
    either the frozen sample or a literal digest computed when every file still
    carried `top_crops: []`. The worker fixed them along T-013→T-014's existing
    in-repo precedent and flagged it rather than hiding it; the tester confirmed
    per-file `test(` counts are unchanged from `origin/main`, so nothing was
    deleted to reach green, and the reviewer upheld the call. **The consequence
    to watch:** the two pinned-digest tests now neutralise `top_crops` before
    hashing, so each new curated field hollows out the "nothing else moved"
    guard a little further — recorded on T-068, the next field to hit it.
  - **Alaska ships `peonies`, not potatoes.** Alaska does grow potatoes, but
    Idaho's sole crop is `potatoes`, and a single-crop collision makes the
    `agriculture` question ambiguous backwards. Peonies are the cut-flower export
    Alaska's long summer daylight actually made it known for, and they collide
    with nothing. All eight single-crop states were checked against each other;
    that was the only clash.
- **T-014 — all 50 states have a kid-facing climate phrase** (PR #44,
  2026-09-17). 49 rows in `question-bank/src/curated/us-states.ts` gained
  `climate_kid` (Colorado already carried the string `geoquizdataplan.md` §1.4 and
  `openapi.yaml:1478` both print, and it is untouched); the 49 matching entity
  files were **rebuilt offline** to carry it — 49 added lines, nothing deleted,
  `sources.built_at` still the pinned fixture instant, `index.json` and
  `sample-data/` byte-identical. No schema change; `normalize.ts` already folded
  the field in conditionally. 200 tests across `climate-kid.test.ts` (worker,
  116) and `climate-kid-verify.test.ts` (tester, 84), 487 → 687, eleven mutations
  each proven to turn the expected criterion red.
  *Where reality differed from the brief:* three things.
  **The task's open harness question was closed by extraction**, not by an
  `engineering-decisions.md` entry: `question-bank/src/offline-rebuild.ts` now
  holds the dead-loopback proxy map and the offline-rebuild runner that four
  suites had each copy-pasted, and all six rebuild suites import it. That forced
  edits to three files this task otherwise had no reason to open — their pinned
  `expect(` floor for `committed-bank.test.ts` dropped 60 → 58, exactly the two
  `expect(proc.exitCode).toBe(0)` calls the extraction turned into a thrown
  error, which a mutation confirmed still catches what they caught.
  **The task cost a review round to a defect in the tester's own test file, not
  in the work**: `climate-kid-verify.test.ts` spelled `127.0.0.1:1` out in two
  comments, which made the criterion "exactly one file under `question-bank/src/`
  carries that literal" false and turned the committed suite and CI red — and the
  round-1 Verdict reported 687 pass / 0 fail because the run predated `git add`,
  so the `git ls-files`-based check could not see the offending file. Fixed in
  round 2 by rewriting the comments and widening the suite's own scan, which had
  excluded itself; the loop gap behind it is **P-4**.
  **The phrases' substance is still unread.** All eight Review-checklist boxes on
  PR #44 are open and are Dkaattae's, and the reviewer flagged three phrases and
  a list of vocabulary for that read (WI's "right in the middle of the country",
  OH's mismatched place/time contrast, DE's "moderating") along with the measured
  phrasing-variety numbers. The interchangeable-climate groups T-026 needs — ten
  groups covering 41 states — are recorded on PR #44 and summarised under T-026.

- **T-013 — 44 of 50 states have a landmark** (PR #43, 2026-09-16). 43 rows in
  `question-bank/src/curated/us-states.ts` gained `landmark` (Colorado already had
  `Rocky Mountain National Park`, the string `geoquizdataplan.md` §1.4 prints);
  the 43 matching entity files were **rebuilt offline** to carry it — 43 added
  lines, nothing deleted, `sources.built_at` still the pinned fixture instant,
  `index.json` and `sample-data/` byte-identical. No schema change: `normalize.ts`
  already folded the field in conditionally. 148 tests across
  `question-bank/src/landmarks.test.ts` (worker) and `landmarks-verify.test.ts`
  (tester), 339 → 487, sixteen mutations each proven to turn the expected
  criterion red.
  *Where reality differed from the brief:* three things, none a criterion failure.
  **Six states ship no landmark at all** (DE, IA, KS, MS, OK, RI) — more blanks
  than any curation task so far, because a kid-recognisable landmark that is not a
  battle site, a casino town, a demolished rock formation or a guess does not
  exist everywhere; each blank is declared with its rejected alternatives except
  Oklahoma's, which names none. **One pre-existing assertion had to move**:
  `state-animals.test.ts`'s "the set of states carrying `landmark` is exactly
  {Colorado}" was true only because T-012 ran first, and T-013's criterion 1
  necessarily falsifies it. It was updated to an exact 44-name set, not loosened —
  the reviewer confirmed the strictness is identical and that mutation M1 (giving
  Delaware a landmark) still turns it red — so criteria 1 and 14 were never in
  tension and nothing went back to the expander. And **the offline-rebuild test
  harness is now copy-pasted into four suites**; T-014 carries the note to extract
  it or say why not.
  *And the part no test closed:* the landmarks' **truth, currency and
  age-appropriateness are unverified**. The brief's seven-box checklist is the
  gate, the PR was escalated for it (`process-decisions.md` D-4a), and it names
  the calls a person has to settle — **AK "Denali"** (the federal name became
  Mount McKinley in 2025; the state, the park and school maps did not follow),
  **three commercial picks** (FL Walt Disney World, MN Mall of America, VT Ben &
  Jerry's Factory), **NJ Atlantic City Boardwalk** (shipped by the same worker
  that rejected the Superdome over a casino naming-rights deal), and **SC Angel
  Oak / CT Mystic Aquarium** as the weakest on outside-state recognition.
  *Also worth knowing:* as with T-012, all three roles ran under one session id —
  freshly spawned agents with separate context windows, but the Sessions-table
  independence check could not discriminate and the Verdict said so rather than
  claiming it passed.

- **T-012 — every state has a state animal** (PR #42, 2026-09-15). All 50 rows in
  `question-bank/src/curated/us-states.ts` gained `state_animal`; the 50 tracked
  entity files and `sample-data/us-state-co.json` were **rebuilt offline** to
  carry it — 51 added lines, nothing deleted, `sources.built_at` still the pinned
  fixture instant. No schema change was needed: `normalize.ts:138` already folded
  the field in conditionally. 96 tests in `question-bank/src/state-animals.test.ts`
  (243 → 339), each proven able to fail by mutation.
  *Where reality differed from the brief:* two things, neither a criterion
  failure. **Six states have no mammal-type designation at all** (ID, IN, IA, MD,
  MN, ND) and ship their official **bird** instead, which the brief's Out of scope
  section sanctions in advance ("if a state's only sensible animal designation is
  a bird, that is a value for `state_animal`"); Virginia ships its **state bat**
  on the same logic. And **criterion 5 is self-contradictory read literally** —
  "every value … appears in exactly one tracked file" cannot hold while criterion
  9 explicitly permits shared animals; the tester resolved it per-row (each
  curated row's value is carried by its own `postal`'s file) from the brief's own
  text rather than blocking.
  *And the part no test closed:* the animals' **truth and age-appropriateness are
  unverified**. The brief's six-box review checklist is the gate, the PR was
  escalated for it (`process-decisions.md` D-4a), and it names four judgment calls
  a person has to settle — California's grizzly (extinct in the wild since 1924,
  still the designation), Michigan's codified white-tailed deer over the
  uncodified "traditional" wolverine, Virginia's big-eared bat over a bird, and
  New Jersey's plain "Horse". One more thing the loop found rather than the brief:
  **five pairs of values collide to a reader but not to a string compare** ("Black
  bear" vs "American black bear", and four others) — recorded on T-026, because it
  is the distractor rule's problem, not this data's.
  *Also worth knowing:* every role on this task ran under the same session id,
  because this harness assigns one id to all subagents of a session. Each was a
  freshly spawned agent with its own context, but the Sessions-table independence
  check `process.md` step 4 describes could not discriminate and none of the three
  claimed it had — they said so in the brief instead.

- **T-011 — every state has a fun fact, written for a nine-year-old** (PR #41,
  2026-09-14). `CuratedState` gained a `fun_facts` field,
  `normalize.ts` folds it into each entity (`fun_facts: curated.fun_facts ?? []`,
  so a state with none still emits the key), and the 50-state bank was **rebuilt
  offline** to carry the result — never hand-edited, per E-6. All 50 states have
  one fact, `reviewed: true`, 56–104 characters, each naming its own state and
  carrying an `https://` `source_url`. 34 tests in
  `question-bank/src/fun-facts.test.ts` (209 → 243), each proven able to fail by
  mutation.
  *Where reality differed from the brief:* three things. **A stale review draft
  had to be deleted** — `question-bank/sample-data/fun-facts.review.json` carried
  Colorado's raw `reviewed: false` Wikipedia prose and was tracked, which
  criterion 2 bans under `sample-data/` as well as `data/`; it was not on the
  brief's "files expected to change" list, and the reviewer confirmed the
  deletion as forced rather than optional. **Criterion 13 named a check that does
  not exist** — there is no `bun run lint` in `question-bank/`, deliberately
  (no eslint config, no eslint dependency, and adding one is a dependency
  decision) — now T-066. **`source_url` is each state's general Wikipedia
  article**, not a citation for the specific claim: enough for criterion 6 and for
  a "read more" link, but it means verifying a fact against its URL is real work
  rather than a click.
  *And the part no test closed:* the facts' **truth and tone are unverified**. The
  brief's seven-box review checklist is the gate, the PR was escalated for it
  (`process-decisions.md` D-4a — content for children always goes to a human),
  and the drafting model was Sonnet rather than the Opus `process.md` recommends
  for this kind of content.

- **T-010 — the built 50-state bank is committed** (PR #37, 2026-09-12). A
  decision task, answered by Dkaattae: `question-bank/data/us-states/` — 50
  entity files plus `index.json`, 39.5 KB — is now tracked, and the reasoning is
  `engineering-decisions.md` **E-6** (with the rejected option's real cost,
  staleness against a continuously-edited Wikidata, and a revisit trigger).
  `.gitignore`, `README.md`, `conventions.md`, `PROGRESS.md` and `tasks.md`'s
  T-040 entry were brought into line, and 190 tests were added (19 → 209).
  *Where reality differed from the brief:* three things. **The determinism fix
  was much smaller than expected** — `normalizeUsStates` already took
  `options.builtAt`, so the whole of criterion 6 came down to `build.ts`'s
  `fixtureTransport` stashing the fixture's `_fixture.captured_at` as it read the
  file. `built_at` therefore changed meaning on the offline path, to "the fixture
  this build replayed was captured at X"; the live path still stamps wall clock.
  **Q2's answer was re-read during review.** The brief recorded reviewed fun-fact
  text as living in the built output; the review found that an offline rebuild
  overwrites those files wholesale with `fun_facts: []`, so E-6 names a build
  *input* instead — a field on `CuratedState` in
  `question-bank/src/curated/us-states.ts`, folded in by `normalize.ts` the way
  `climate_kid` already is. That is inside Q2's own wording ("or the source the
  build folds into it") but it is a re-reading of a human's answer, and the PR
  was escalated for Dkaattae to confirm rather than merged as routine. T-011 now
  carries what it inherits. **The `!data/us-states` negation un-ignored more than
  the bank** — a default live run writes `fun-facts.review.json` with
  `reviewed: false` into that same directory, which review caught and a third
  ignore rule closes. Two review rounds; round 1 sent all three of these back.

- **T-058 — `README.md` describes the CI that runs** (PR #35, 2026-09-11).
  `README.md` claimed CI ran **five** jobs and named five; six have run on every
  PR since T-054. It also carried a Known-issues bullet saying "CI only runs the
  SQLite path … a Postgres-only regression would not fail a pull request", false
  since `backend-postgres` landed, and two stale suite sizes ("221 tests", "28
  tests"). `conventions.md` overstated the lockfile-drift guard as belonging to
  all six jobs when four have it, and hardcoded "thirteen full user journeys".
  All five are fixed, the Checks block gained the missing `cd e2e && bun run
  test` line, and — the point of the task — **`README.md` is now held against
  `ci.yml` by the same test that holds `conventions.md`**: its job list must
  equal `ci.yml`'s `jobs:` keys, every command it names must be a real `make`
  target or `bun` script, and no suite size may appear that nothing asserts.
  `.github/` is byte-identical to `main`.
  *Differed from the brief:* nothing in the criteria. **Both count claims were
  closed by deleting the number rather than asserting it** — criteria 7 and 8
  allowed either, and the alternative was a `pytest --collect-only` subprocess
  from a `bun test` file or a word↔digit mapping, both of which add the kind of
  machinery whose failure mode is the drift the task existed to close. The
  reviewer confirmed that reading rather than leaving it open. **The tester's
  four added tests were not redundant**: `all 5 jobs` written in digits, a job
  running `git diff --exit-code` against the wrong file, and two commands named
  in the Checks section's prose rather than its fenced block all slipped past the
  worker's assertions and now do not — 15 mutations, 15 reds. The worker and
  tester each wrote their own copy of the same doc-parsing helper, which is
  folded into T-061. Two loose ends live in `ci.yml` itself and so became **P-3**
  rather than queue entries: the two jobs with no lockfile guard, and a comment
  still saying "thirteen". As in T-007, `bun run typecheck` could not run in the
  sandbox (`react-simple-maps` unreachable from the pinned registry); CI's
  `frontend (typecheck, lint, test)` job is green on the head commit, which is
  what settled it.

- **T-008 — the CI actions have a pinning rule, and it is written down** (PR #34,
  2026-09-04). `ci.yml`'s 13 `uses:` references were all on mutable major tags,
  which `frontend/bunfig.toml`'s 24h `minimumReleaseAge` guard made an
  inconsistency rather than a theoretical worry. Settled as
  `engineering-decisions.md` **E-5**: the rule is the publisher, not the action —
  owner `actions` stays on a tag, everyone else is pinned to a 40-character
  commit SHA with a comment naming the release. Six references moved
  (`oven-sh/setup-bun` ×3 → `0c5077e5… # v2.2.0`, `astral-sh/setup-uv` ×3 →
  `d0cc045d… # v6.8.0`), seven did not, and the diff on `ci.yml` is those six
  lines and nothing else. Both SHAs were checked against GitHub by hand three
  times — worker, tester, reviewer — never in an assertion, because that would be
  a network test.
  *Differed from the brief:* nothing in the criteria, and three things worth
  knowing. **The split was a genuine choice**, not forced by the criteria — "pin
  everything" and "pin nothing" would both have satisfied criteria 1–6, and E-5
  names and prices both rather than only the winner. **The brief budgeted one
  test file and two landed**: the worker's `ci-workflow-pins.test.ts` and the
  tester's stricter `ci-action-pinning.test.ts`, which is a behavioural superset
  of it — T-061 is the entry to collapse them. And **`astral-sh/setup-uv`'s `v6`
  is an annotated tag**, so a bare `git ls-remote` returns the tag object rather
  than the commit; it has to be peeled with `v6^{}`, which is the kind of detail
  that would have produced a plausible-looking wrong pin if nobody had looked.
  *Flagged for Dkaattae on the PR:* E-5 sets the repository's CI supply-chain
  posture and creates a recurring manual chore with no owner, in a run whose
  brief no human approved.

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
- Fun facts: all 50 exist in the **pipeline** bank, curated and marked
  `reviewed: true` (T-011, PR #41). Two things are still open. Their **substance**
  — are they true, do they read well to a nine-year-old — is a human read, and
  the checklist for it lives on PR #41 rather than in any test. And nothing
  serves them: the app's fun facts are still the 15 hand-written ones in
  `backend/app/data/content.json` until T-040 and T-050.
- `state_animal` is **50 of 50** (T-012, PR #42) but, like the fun facts, its
  substance — is each animal really that state's, does it read to a nine-year-old
  — is a human read, and the checklist for it lives on PR #42 rather than in any
  test. `landmark` is **44 of 50** (T-013, PR #43) with six declared blanks (DE,
  IA, KS, MS, OK, RI) and the same unread substance, on PR #43 — so the `landmark`
  topic will cover 44 states, not 50. `climate_kid` is **50 of 50** (T-014, PR
  #44), with the same unread substance on PR #44 and one extra thing waiting
  there: ten groups of states whose phrases describe the same climate, which
  `climate` questions must not offer two of. `top_crops` is **50 of 50** (T-015,
  hand-curated plant crops, one to three per state, folded in from
  `CuratedState.top_crops` the same way the other curated fields are — not USDA
  NASS) and was the last curated field. So all four topic fields now have data
  and `wildlife`, `landmark`, `climate` and `agriculture` wait only on
  T-021/T-026, a same-value distractor guard (T-022), and something serving
  them (T-040, T-050).
- **One region vocabulary, settled** (T-017, PR #49): the served bank's thirteen
  values, used by both halves and enforced by a closed-set test over the curated
  table, the built bank and `content.json`. What is *not* settled is whether each
  state's assignment is the right member of the thirteen — 35 rows are hand
  curation awaiting a human read on PR #49, and four regions hold one or two
  states, which T-022 needs a distractor fallback for.

**Verification and process.**

- The public question bank hands out `correctIndex` by default — a leftover from
  when the client graded locally (T-053).
- `test-guidelines.md` still says `api/` does not exist (T-047), and `CLAUDE.md`
  still calls the backend "not built yet" in `api/` (lines 4 and 51). `CLAUDE.md`
  is loop-gated, so correcting it is a hand-written `P` ticket, not a `T` task.
  `conventions.md` was the third of these and is fixed (T-007, PR #33), as is
  `README.md` (T-058, PR #35) — both now fail a test rather than drift.
- `test-guidelines.md:209` and `PROGRESS.md:161` still quote suite sizes that
  nothing asserts and that are already wrong (T-065). `README.md`'s last one is
  closed (T-062, PR #50).

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

1. **T-040** — a loader, so the pipeline's output becomes the served bank. It is
   now the only thing between the curated 50-state bank and a child (T-011
   landed the fun facts, PR #41).
2. **T-050** — 50 states in the app, and a map that can actually fill.
3. **T-026 starting with superlatives** — a third topic for free, since the rank
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
