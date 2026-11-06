# T-047 — `test-guidelines.md`'s `api/` section is still marked "does not exist yet"

**Status:** `approved`
**Next step:** `human` — PR #127 is marked ready, inside the envelope; merge when convenient
**Approved:** orchestrator — 2026-11-06, unattended run. See `runs/T-047-test-guidelines-backend.md`.
**Test changes:** `approved — Dkaattae, 2026-11-06`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-047
**Branch:** `task/T-047-test-guidelines-backend`
**PR:** #127, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-06 | cse_011oDiJbsZTbExMiPULZMiFd |
| worker | 2026-11-06 | cse_011oDiJbsZTbExMiPULZMiFd |
| tester | 2026-11-06 | cse_011oDiJbsZTbExMiPULZMiFd (orchestrated: freshly spawned subagent, same remote session id as every role) |
| tester (attended, applied the request) | 2026-11-06 | cse_011oDiJda1ZpvnR6WaQMphrU |
| reviewer | 2026-11-06 | cse_011oDiJbsZTbExMiPULZMiFd (orchestrated subagent; reviewed work it did not write) |
| reviewer (second pass, approve and sweep) | 2026-11-06 | cse_011oDiJbsZTbExMiPULZMiFd (orchestrated subagent; reviewed work it did not write) |

## Goal

`test-guidelines.md` is what every tester reads before writing tests, and its
backend section still describes a service that "does not exist yet". Parts of it
are now false (`cd api`, "use a real Postgres, not SQLite", `openapi.yaml` as a
contract to assert against). This task makes that section describe the suite
`backend/tests/` actually is, and makes the copy-paste dead-proxy block work
on a fresh checkout.

## What is already true (survey, 2026-11-06, `origin/main` `a7945cf`)

- **The suite exists and the patterns are real.** Everything the section has to
  describe is in `backend/tests/conftest.py`: `engine` (one database per run,
  built by `alembic upgrade head`, SQLite temp file by default or
  `GEO_TEST_DATABASE_URL`), `db_session` (a connection-level transaction, app
  commits joined to a savepoint with `join_transaction_mode="create_savepoint"`,
  rolled back at the end of each test), `client` (`httpx.AsyncClient` over
  `httpx.ASGITransport(app=app)`, no socket), and `assert_matches` /
  `assert_problem`. `backend/tests/test_contract.py` compares the app's own
  `app.openapi()` operations with `openapi.yaml`'s in both directions.
  `backend/tests/test_postgres.py` skips on SQLite.
- **`uv run pytest` runs `backend/tests/` only.** `backend/pyproject.toml`
  sets `testpaths = ["tests"]`. `backend/integration/` runs through
  `make -C backend test-integration` and has its own README.
- **Mutation testing is already written down,** in general form:
  `test-guidelines.md` "Verifying a task whose deliverable is tests"
  (lines 174–189). No criterion asks for a backend copy of it.
- **The test-count clause is already done.** T-065 (PR #57) removed the counts
  and `frontend/src/stale-suite-counts.criteria.test.ts` keeps them out.
- **What is still wrong**, all in `test-guidelines.md`:
  - line 223, the heading `` ### `api/` — pytest ``;
  - lines 225–227, the "**Forward-looking.** `api/` does not exist yet" block;
  - line 230, `cd api && uv run pytest`;
  - line 236, "**Assert against `openapi.yaml`.** It is the contract; a response
    that does not match it is a bug even when the test author expected it."
    This contradicts `engineering-decisions.md` E-14 and `CLAUDE.md`: the
    backend is the source of truth, and `openapi.yaml` follows it;
  - line 240, "Use a real Postgres, not SQLite." The default run is SQLite
    (`conftest.py` `engine`; `backend/Makefile` `test`), and Postgres is a second
    run (`make -C backend test-postgres`, CI job `backend-postgres`);
  - line 246, the `# api` label on `uv run pytest && uv run ruff check`;
  - lines 81–85, the dead-proxy block. Its only command is `uv run pytest`, under
    all six proxy variables. On a checkout with no `backend/.venv`, `uv run`
    first tries to sync the environment through the dead proxy and fails, for a
    reason that has nothing to do with the guard (T-005's reviewer, PR #26). The
    trailing comment says `bun test` "works the same way", and that has the same
    problem when there is no `node_modules`. CI installs first, without the
    variables (`ci.yml`: `uv sync --frozen`, `bun install --frozen-lockfile`),
    and sets them only on the Test step.

## Acceptance criteria

All of them are about `test-guidelines.md` unless they say otherwise. "The
backend section" means the text from the `###` heading that introduces the
pytest suite up to the next `##` heading ("Before you say it passes").

1. **The marker is gone.** `test-guidelines.md` does not contain the strings
   `Forward-looking`, `does not exist yet`, or `Nothing below has been
   exercised`.
2. **No `api/` directory survives.** `test-guidelines.md` does not contain
   `` `api/` ``, `cd api`, or a shell comment `# api` (that is, `#`, whitespace,
   then `api` as a whole word). A URL path such as `/api/v1` is allowed.
3. **The backend section's heading names `backend/`**, and its run command is
   `uv run pytest` run from `backend/` (as `cd backend && uv run pytest`, or as
   `make -C backend test`).
4. **Default database stated correctly.** The backend section says the default
   run uses SQLite, and that the same suite runs against Postgres when
   `GEO_TEST_DATABASE_URL` is set. It names either `make -C backend
   test-postgres` or that variable as the way to run it. It no longer says, or
   implies, that tests must not use SQLite.
5. **Per-test isolation stated correctly.** The backend section says each test
   runs inside a transaction that is rolled back when the test ends, and that the
   app's own commits during a request are joined to a savepoint, so the real
   commit path runs and nothing is left behind. It points at
   `backend/tests/conftest.py` (the fixture name `db_session` or the file).
6. **Endpoint tests, no socket.** The backend section says endpoint tests go
   through the app with `httpx.AsyncClient` over `httpx.ASGITransport`, with no
   server and no socket, and names the `client` fixture or `conftest.py`.
7. **The contract is described as following the backend.** The backend section
   says `openapi.yaml` follows the backend (citing `engineering-decisions.md`
   E-14). It names both of these as the checks that keep the two in step:
   `test_contract.py` (routes against operations, both directions) and
   `assert_matches` (every required key present, no undeclared key).
8. **The old contract rule is gone.** `test-guidelines.md` contains neither
   `It is the contract` nor `a bug even when`. No sentence in it says a backend
   response that differs from `openapi.yaml` is wrong because it differs. A
   difference is fixed by updating `openapi.yaml` (E-14).
9. **Integration is placed.** The backend section says `uv run pytest` runs
   `backend/tests/` only, and that the tests needing a real stack live in
   `backend/integration/` and are run with `make -C backend test-integration`.
10. **The dead-proxy block installs first, outside the guard.** In the "No network
   in tests, ever" block, the backend reproduction runs a dependency install
   (`uv sync` or `uv sync --frozen`, from `backend/`) **before** the command that
   sets the six proxy variables, and the install line itself does not set any of
   the six variables.
11. **The guard is unchanged in strength.** The test command in that block still
    sets all six of `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `http_proxy`,
    `https_proxy` and `all_proxy` to `http://127.0.0.1:1`.
12. **The bun half says how, or is not offered.** If the block or its comments
    still offer `frontend/` or `question-bank/` as places to run it, the block
    shows `bun install` (with or without `--frozen-lockfile`) for each package it
    offers, before the guarded command and without the six variables. If it
    offers neither, this criterion holds.
13. **The block runs from a cold checkout.** Copied verbatim into `sh` from the
    directory the block says to start in, on a checkout with no `backend/.venv`
    and with a package index reachable, the backend reproduction exits 0. The
    tester records how it got the cold state: a fresh `git worktree` or clone,
    or a `backend/.venv` moved aside and restored afterwards.
14. **The "Before you say it passes" block labels the backend correctly.** Its
    pytest/ruff line is labelled `backend` (or `backend/`), not `api`.
15. **Nothing else in the file regresses.** Every section of `test-guidelines.md`
    other than the backend section, the "No network in tests, ever" paragraph
    and its block, and the "Before you say it passes" block is byte-identical to
    `origin/main` at `a7945cf`.
16. **Only this file changes outside the loop's own files.** The diff against
    `main` touches `test-guidelines.md`, this brief, `runs/` and, through an
    approved Test change request only, the whole-tree pin tests (see
    Constraints). No source file, no workflow, no `CLAUDE.md` change, no new
    dependency.
17. **Every suite stays green.** `bun test` in `frontend/` and in
    `question-bank/`, and `uv run pytest` in `backend/`, pass. Any failure is
    listed with an approved Test change request row. In particular these guards,
    which read `test-guidelines.md`, stay green without being edited:
    `frontend/src/stale-suite-counts.criteria.test.ts` (no suite-size count,
    digits or spelled out, so the worker must not copy a figure such as ci.yml's
    "The 9 Postgres-only tests"),
    `frontend/src/stale-suite-counts-guard.criteria.test.ts` (criterion 9: "at
    least one test", "exactly one test red", "one test, twelve assertions"),
    `frontend/src/level-window-claim.criteria.test.ts`,
    `question-bank/src/lint-gate.test.ts` (T-066 criterion 23) and
    `question-bank/src/purge-sample-data-verify.test.ts`.

## Out of scope

- **T-046, the name.** This task describes the tree as it is (`backend/`), the
  way T-007 did for `conventions.md`. It does not rename anything or decide
  whether `api/` is retired. If T-046 later renames, this section changes again.
- **`CLAUDE.md` lines 4 and 51** (`api/` FastAPI + Postgres, "not built yet";
  `uv add` / `uv run` in `api/`). They are loop-gated (G1): a `P` ticket,
  done by hand. Do not touch them, and do not file the `P` ticket from inside
  this task. A Notes line is enough.
- **"Randomness and time"** (lines 132–155), including `fixed_draw`. T-102 is
  in flight on the unseeded-draw question (PR #126) and owns the backend's draw.
  Leave the section byte-identical even if it looks incomplete.
- **Every other section** of `test-guidelines.md` (criterion 15), including the
  `question-bank/` and `frontend/` subsection and the mutation guidance.
- **`backend/integration/README.md`, `e2e/README.md`, `backend/README.md`,
  `conventions.md`, `PROGRESS.md`.** If one of them is also wrong, put it in Notes
  for the reviewer to queue.
- **Any change to `backend/tests/`, `conftest.py`, `ci.yml` or the Makefile** to
  make the prose true. The prose follows the code.
- **A light path.** This brief has more than four criteria, so it uses the full
  template.

## Constraints

- **Files expected to change:** `test-guidelines.md`, and nothing else outside
  `tasks/` and `runs/` unless a Test change request is approved.
- **Whole-tree pins will go red, by design.** `test-guidelines.md` is a tracked
  non-test file, so editing it changes the digest that
  `question-bank/src/climate-cold-trade-accepted-verify.test.ts` (T-091
  criterion 22) and `question-bank/src/farm-animal-loose-ends-verify.test.ts`
  (T-096 criterion 21) pin over every tracked non-test file outside their
  allowed sets. This brief and its run log are new non-test files too. Earlier
  tasks have handled this by adding their files to the allowed set through a
  Test change request (see the re-pin comments at
  `climate-cold-trade-accepted-verify.test.ts:94–101`). The worker lists every
  pin that goes red under **Tests made stale** and does not edit it (D-14). The
  tester raises the request, and a person approves it in an attended tester
  session. **Plan to attend the tester step.** T-102's PR #126 re-pins the same
  files, so whichever merges second will need its pins rebased.
- **No counts.** No number of tests, test files or skipped tests anywhere in
  the file (criterion 17, T-065).
- **Accurate, not aspirational.** Every claim in the rewritten section must be
  checkable against a file that exists on `main`. Name the file or fixture. Do
  not describe a pattern the suite does not use.
- **Dependencies:** none (`CLAUDE.md` "Packages").
- **This is documentation** (`process.md`, "Tasks this loop does not fit").
  Criteria 1–12, 14 and 15 are shape checks a test can make. Criterion 13 is an
  execution check. The Review checklist below is what no test can tell.

## Context

Required reading for the worker and the tester.

- `test-guidelines.md`, the whole file, especially lines 72–87 and 204–250.
- `backend/tests/conftest.py`: the module docstring and the `engine`,
  `db_session`, `client`, `assert_matches` and `assert_problem` fixtures and
  helpers.
- `backend/tests/test_contract.py`: the module docstring and the first two tests
  (both directions).
- `backend/tests/test_postgres.py`: the module docstring (skipped on SQLite).
- `backend/pyproject.toml` `[tool.pytest.ini_options]` (`testpaths`).
- `backend/Makefile`: targets `install`, `test`, `test-postgres`,
  `test-integration`, `check`.
- `backend/integration/README.md`: what lives there and why.
- `.github/workflows/ci.yml`: the `backend` job's Install (`uv sync --frozen`)
  and Test steps, and the comment above Test explaining why the variables are
  set inside the shell. Also the `backend-postgres` job.
- `engineering-decisions.md` E-14 (backend is the source of truth; the P-8
  amendment says `openapi.yaml` is a file to update, not a promise to defend).
- `tasks.md` T-047's entry, and T-005's reviewer finding quoted in it.
- `runs/T-007-conventions-current.md`: the precedent for describing `backend/`
  without deciding T-046.

## Review checklist — non-testable tasks only

A person reading the rewritten section checks:

- [ ] A tester who has never opened `backend/tests/` could write a new endpoint
      test from this section alone: which fixtures to request, what isolation
      they get, and how to assert a response shape and an error.
- [ ] Nothing in it is aspirational. Each claim matches the file it names.
- [ ] The E-14 framing reads as "keep `openapi.yaml` in step", not as "defend
      `openapi.yaml`", and not as "ignore it" either. `assert_matches` still
      fails a test.
- [ ] The dead-proxy block is still short enough to copy and paste, and it is
      still obvious which part is the guard.
- [ ] The section reads in the same voice as the rest of the file. It is not a
      changelog of T-0xx numbers.

## Handoff

**TL;DR.** `test-guidelines.md` is the only file changed: the backend section
now describes `backend/tests/` as it is, and the dead-proxy block installs first.
The backend block runs cold (fresh worktree, exit 0). Two whole-tree pins are red,
and they were already red before my edit. A Test change request is needed at the
tester step.

**Same session id as the expander.** The orchestrator ran both roles under one
remote session (`cse_011oDiJbsZTbExMiPULZMiFd`). The tester must run in a
different one.

### What changed

- **`test-guidelines.md`**, three places, nothing else:
  - **"No network in tests, ever"**: the sentence before the block, and the
    block. It now starts from the repository root, runs `cd backend` and
    `uv sync --frozen` with no proxy variables, and then the guarded
    `uv run pytest` with all six variables, unchanged. The bun half is no longer
    offered (criterion 12, the "offers neither" branch).
  - **Backend section**: the heading is now `` ### `backend/` — pytest ``. It
    gives the run commands and bullets for the scope of `backend/tests/` vs
    `backend/integration/`, `client`, the database, `db_session`, E-14 and
    `assert_matches` / `test_contract.py`, and `assert_problem`.
  - **"Before you say it passes"**: `# api` is now `# backend/`.
- **This brief**: Status, Next step, Sessions row, Handoff, Notes.

### Where each criterion lives

| # | Where |
|---|---|
| 1, 2, 8 | The strings are gone from the file. `grep -nE 'Forward-looking\|does not exist yet\|Nothing below has been exercised\|`api/`\|cd api\|#\s+api\b\|It is the contract\|a bug even when' test-guidelines.md` prints nothing |
| 3 | The heading `` ### `backend/` — pytest `` and `cd backend && uv run pytest` |
| 4 | Bullet "The database is real, and SQLite by default", plus the `make -C backend test-postgres` line in the code block |
| 5 | Bullet "Each test runs inside a transaction…" (`db_session`, `create_savepoint`) |
| 6 | Bullet "Endpoint tests go through the app" (`client`, `httpx.ASGITransport`, no server, no socket) |
| 7 | Bullet "`openapi.yaml` follows the backend" (E-14, `test_contract.py` both directions, `assert_matches` required/undeclared) |
| 9 | First bullet ("`uv run pytest` runs `backend/tests/` only", `make -C backend test-integration`) |
| 10, 11 | The `sh` block: `uv sync --frozen` on its own line before the guarded command, with all six variables on the guarded command |
| 12 | Neither `frontend/` nor `question-bank/` is offered in the block or its comments |
| 13 | See "How to run" below |
| 14 | `uv run pytest && uv run ruff check # backend/` |
| 15 | `git diff origin/main -- test-guidelines.md` touches only the three regions above |
| 16 | `git diff origin/main --stat`: `test-guidelines.md`, this brief, `runs/T-047-…` |
| 17 | See "Suites" below |

### How to run what I touched

- **Criterion 13 (my own run; the tester records theirs).** I ran
  `git worktree add <scratch>/wt HEAD` and copied in the edited
  `test-guidelines.md`. `backend/.venv` was absent. I extracted the block with
  `awk '/^```sh$/{f=1;next} /^```$/{if(f){exit}} f' test-guidelines.md`, ran
  `sh` on it from the worktree root, and got the pytest summary "passed, …
  skipped" with no failures. The guarded command is the last line, so `sh`
  exits with pytest's status, 0. I removed the worktree afterwards. The package
  index went through this environment's agent proxy.
- **Suites, run in this checkout:**
  - **`backend/`** `uv run pytest`: green (the cold run above, same tree).
  - **`question-bank/`** `bun test`: everything passes except the two pins
    under Tests made stale.
  - **`frontend/`** `bun test`: four reds, and they come from the environment,
    not this change. `react-simple-maps` is missing from `frontend/node_modules`
    ("Cannot find package 'react-simple-maps'" from `UsMap.tsx`,
    `t051-map-click.test.tsx`, `t051-tester.criteria.test.tsx`).
    `bun install --frozen-lockfile` could not repair it here: the proxy
    returned 403 on tarballs (`d3-color@2.0.0`, `d3-timer@2.0.0`). A doc edit
    cannot cause a module-resolution error. In one of three runs, `criterion 1
    — the gate is clean … bun run lint exits 0` also failed, on a timeout
    (5445 ms); it passed in the other two, and `bun run lint` on its own is
    clean.
  - **The guards criterion 17 names** pass:
    `stale-suite-counts.criteria`, `stale-suite-counts-guard.criteria`,
    `level-window-claim.criteria` (frontend, 90 pass) and `lint-gate`,
    `purge-sample-data-verify` (question-bank, 39 pass).
- **No typecheck or lint change is possible.** No source file was touched.

### Tests made stale

Both pins were **already red on this branch before my edit**. `git stash` of
`test-guidelines.md` still shows both failing. The cause is the expander's new
`tasks/T-047-test-guidelines-backend.md` and `runs/T-047-test-guidelines-backend.md`
(the tracked-file count is +2). My edit to `test-guidelines.md` adds a content
mismatch on top of that.

- **`question-bank/src/farm-animal-loose-ends-verify.test.ts`**, test
  `T-096 criteria 17-21: the bank and the boundaries > criterion 21: outside
  the allowed files and test files, every tracked file is main's, and none is
  added`. Received 285 against an expected 283.
  - **Stale because of:** criterion 16, which allows `test-guidelines.md`, this
    brief and the run log.
  - **Proposed fix:** modify the test. Add `test-guidelines.md`,
    `tasks/T-047-test-guidelines-backend.md` and
    `runs/T-047-test-guidelines-backend.md` to its allowed set, the way earlier
    re-pins did.
- **`question-bank/src/climate-cold-trade-accepted-verify.test.ts`**, test
  `T-091 criterion 22: the diff touches only the allowed files > every tracked
  non-test file outside the allowed list is 12d242e's, and none is added`.
  Received 288 against an expected 286.
  - **Stale because of:** the same criterion 16.
  - **Proposed fix:** the same three paths added to its allowed list. See the
    re-pin comments at lines 94–101.
- **Who acts:** the tester, through a Test change request a person approves
  (D-14). T-102 / PR #126 re-pins the same files, so whichever merges second
  rebases its pins.

### What I deliberately did not do

- **`CLAUDE.md`, `conftest.py`, `test_contract.py`, `ci.yml`, Makefile**: not
  touched. Out of scope or gated.
- **"Randomness and time" / `fixed_draw`**: not mentioned in the backend
  section, and the section itself is left byte-identical. T-102 owns it.
- **The bun half of the proxy block**: dropped, not rewritten. Criterion 12
  allows either, and the review checklist asks for a block short enough to
  paste.

### Contradictions with the brief

- **None in the criteria.** The brief's Status line read `awaiting approval`
  next to a valid orchestrator `Approved:` stamp, so I treated the brief as
  approved.

## Verdict

### Attended tester, 2026-11-06 — **pass**

**TL;DR.** **Pass.** All seven test change rows were approved by Dkaattae in this
attended session and applied in `04ac466`. Both red CI jobs on PR #127 are fixed:
question-bank goes from 6 failures to 0 and frontend typecheck is clean.
**Next:** reviewer.

**Independence.** My session `cse_011oDiJda1ZpvnR6WaQMphrU` differs from the
expander/worker session `cse_011oDiJbsZTbExMiPULZMiFd`, so this is a separate
session.

**What CI on PR #127 showed (run 42270416729)**
- **question-bank:** 6 fails. These were rows 1–3 plus **three pins the orchestrated
  tester missed**. They are frontend/ tree digests in T-088, T-092 and T-087's guards,
  and they went red because that tester put its criteria file under `frontend/`.
  These became rows 5–7.
- **frontend:** tests 456/0, but **typecheck failed**. The criteria file
  `frontend/src/test-guidelines-backend.criteria.test.ts` indexed arrays without
  checks under `noUncheckedIndexedAccess` (lines 44, 218, 219, 230). It is this
  task's tester file, so I fixed it with four `!` assertions. Each sits after an
  existing guard (a `throw`, or an `expect(idx) >= 0`). No assertion changed and
  the file is still 14/14.
- **backend, postgres, integration, e2e:** green. Nothing under them changed
  since.
- **Considered and rejected:** moving the criteria file to `question-bank/src/`.
  It trips three dead-loopback-literal guards (T-014, T-015), so it does not
  reduce the number of re-pins.

**Approval (the person's words, via the session's question prompt)**
- Rows 1–4 as written: "Approve" ×4.
- New rows 5–7 and the extension of row 4 to the agriculture and map-click
  entries: "Approve" ×4.
- Recomputed digests for rows 3–7 after the tsc fix: "Approve".
- Header line: `Test changes: approved — Dkaattae, 2026-11-06`.

**Tests modified (all modify, none deleted)**

| Row | File | Change |
|---|---|---|
| 1 | `farm-animal-loose-ends-verify.test.ts` | 3 paths allowed; count 283 → 282; digest `fda851f3…` |
| 2 | `climate-cold-trade-accepted-verify.test.ts` | 3 paths allowed; count 286 → 285; digest `0b3efcae…` |
| 3 | `climate-cold-trade-accepted-verify.test.ts` | tests count 122 → 123; digest `830fac35…` |
| 4 | `climate-cold-trade-accepted-verify.test.ts` | applied-request digests for farm-animal, agriculture and map-click |
| 5 | `agriculture-true-wrong-answers-verify.test.ts` | `MAIN_FRONTEND_SHA` → `4de52321…` |
| 6 | `map-click-no-candidates-verify.test.ts` | frontend digest → `179208d1…` |
| 7 | `refresh-regenerate-reminder-verify.test.ts` | `MAIN_BOUNDARY_SHA` → `437329ad…` |

None of these asserts less than before. Every one still pins an exact count or
digest, and each digest equals main's tree plus only T-047's own files.

**Suites in this session**
- **question-bank:** 2713 pass, 0 fail. Typecheck, lint and format are clean.
- **frontend:**
  - The criteria file passes 14/14, and typecheck shows no errors in it.
  - The rest of the suite has 5 local reds and 3 typecheck errors. All of them
    trace to `react-simple-maps` and `us-atlas`, which are missing because
    `bun install` gets a 403 from this proxy (`d3-timer`).
  - Before the fix, CI ran the same suite on the same tree at 456/0.
  - **CI is the authority** for the frontend suite.
- **backend:** not re-run here. `test-guidelines.md` and `backend/` are unchanged
  since `c435bb8` (empty `git diff`), and CI was green on them.
- **Criteria 1–17:** the document is unchanged since the orchestrated verdict
  below, so its per-criterion evidence stands.

**Merged `main` (`e87e2fe`, T-102) on 2026-11-06, at Dkaattae's request. This resolves review finding 1 as row 8, which Dkaattae approved in this session ("Approve").**
- **The one conflict:** climate's `APPLIED_REQUEST_FILE_SHAS` entry for
  `farm-animal-loose-ends-verify.test.ts`. Both tasks had re-pinned it.
- **How it was resolved:** the entry was recomputed over the merged file, which
  now holds both T-102's row 1 and T-047's row 1:
  `e9470a5ecb54496e624e58701aec72a9c1372fb12a9a35c55776c741a476cdd6`.
  That is row 4 as approved, applied to the merged bytes.
- **Nothing else moved:** T-102 only added its own paths to the allowed sets, so
  every count and digest in rows 1–7 holds unchanged.
- **After the merge:** question-bank has 2713 pass and 0 fail, and typecheck, lint
  and format are clean.

### Orchestrated tester (superseded on the request; criteria evidence stands)

**TL;DR.** Every criterion the task can be held to is met: 1–12, 14 and 15 by
new tests (all green), 13 by a cold run (exit 0), 16 and 17 by observation.
**Not a pass yet:** the two whole-tree pins are red by design, three tests in
two files, and one more row follows from re-pinning them. They need the Test
change request below, approved by a person in an attended tester session.
**Next:** a person starts a `tester` session for T-047 and answers the four rows.

**Independence.** This run is orchestrated (`runs/T-047-test-guidelines-backend.md`
exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJbsZTbExMiPULZMiFd`,
the same id as the expander and worker rows, so the session-id check proves
nothing either way. My independence rests only on being a freshly spawned
subagent with its own context: I did not see the work done or the worker's
reasoning. That depends on the orchestrator spawning me correctly, which I
cannot check myself, so it is weaker evidence than a separate session.

### Criteria

New test file: `frontend/src/test-guidelines-backend.criteria.test.ts`, one test
per criterion. The expected values come from the criteria's wording.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `criterion 1: …` green |
| 2 | met | `criterion 2: …` green (`` `api/` ``, `cd api`, `/#\s+api\b/` absent) |
| 3 | met | `criterion 3: …` green (heading names `backend/`; `cd backend && uv run pytest`) |
| 4 | met | `criterion 4: …` green (SQLite + default in one sentence; Postgres + `GEO_TEST_DATABASE_URL`; no "not/never/avoid SQLite" anywhere) |
| 5 | met | `criterion 5: …` green (one bullet: transaction, rolled back, commits joined to a savepoint *in prose*, "nothing is left behind"; `db_session`) |
| 6 | met | `criterion 6: …` green (`httpx.AsyncClient` + `httpx.ASGITransport` in one bullet, "no server", "no socket"; `client`) |
| 7 | met | `criterion 7: …` green ("`openapi.yaml` follows the backend", `engineering-decisions.md` E-14, `test_contract.py` "both directions", `assert_matches` required key / undeclared key) |
| 8 | met | `criterion 8: …` green (both strings absent; no sentence pairs `openapi.yaml` with "is a bug/is wrong/is broken/must match"; "update `openapi.yaml`" present) |
| 9 | met | `criterion 9: …` green |
| 10 | met | `criterion 10: …` green (`cd backend`, then `uv sync --frozen` with none of the six names on its line, then the guarded command) |
| 11 | met | `criterion 11: …` green (each of the six `=http://127.0.0.1:1` on the logical guard line, with `uv run pytest`) |
| 12 | met | `criterion 12: …` green (the block offers neither bun package) |
| 13 | met | Cold run, below |
| 14 | met | `criterion 14: …` green (`# backend/`) |
| 15 | met | `criterion 15: …` green: sha256 of the file with the three allowed regions cut out equals the same cut of `test-guidelines.md` at `a7945cf` (`d028b32d…`, computed from `git show` of that commit in a scratch script; embedded because tests may not resolve revisions) |
| 16 | met, observed | `git diff origin/main --stat`: `test-guidelines.md`, this brief, `runs/T-047-…`, plus this tester's own new test file. No source, workflow, `CLAUDE.md` or dependency change |
| 17 | **not yet** | Red only on the pins in the Test change request, and on frontend reds this environment causes (below). The five guards it names are green, unedited |

**Accuracy spot-check (Constraints, "Accurate, not aspirational").** I checked
the section's claims against `backend/tests/conftest.py` (`create_savepoint`,
`ASGITransport`, a base URL that carries `API_PREFIX`, `auth_headers`,
`other_auth`, `spec`, `assert_matches`, `assert_problem`), `backend/pyproject.toml`
(`testpaths`), `backend/Makefile` (`test`/`test-postgres`/`test-integration` all
depend on `install`), `test_postgres.py` (skips on SQLite) and
`backend/integration/README.md` (Docker, not in `make check`). Nothing I found
is false.

### Mutations (each reverted; `cmp` against a saved copy confirmed the file restored)

| Mutation to `test-guidelines.md` | Went red |
|---|---|
| Whole file swapped for `a7945cf`'s | criteria 1–10, 12, 14 (11 and 15 stay green, correctly: the old guard had all six variables, and the remainder is identical) |
| `HTTPS_PROXY=…` prefixed onto the `uv sync` line | 10 (and 11, because that line now becomes the first proxy-setting line) |
| `uv sync` moved after the guarded command | 10 |
| `all_proxy` dropped from the guard | 11 |
| One-letter typo in "Three patterns worth copying" | 15 |
| `# backend/` relabelled `# api` | 2, 14 |
| Comment offers "bun test from frontend/" | 12 |
| "and no socket" removed | 6 |
| "joined to a savepoint" → "joined to an outer scope" | 5. **This one survived my first draft**, because `create_savepoint` in the code span still matched. I tightened the test to require the savepoint in prose, and it now goes red |
| "SQLite by default" bullet replaced with "Use a real Postgres, not SQLite." | 4 |
| E-14 citation removed | 7 |

### Criterion 13: cold run

- **How I got the cold state:** `git worktree add --detach <scratch>/wt HEAD`
  (at `a3ba3e3`). `backend/.venv` was absent (`ls` failed).
- **What I ran:** the block extracted verbatim with
  `awk '/^```sh$/{f=1;next} /^```$/{if(f){exit}} f' test-guidelines.md`,
  then `sh` from the worktree root, which is where the prose says to start.
- **Result:** `uv sync --frozen` created `.venv` through this environment's agent
  proxy (the package index). The guarded `uv run pytest` reported
  `1039 passed, 9 skipped`. **Exit 0.** I removed the worktree afterwards.
- This also confirms the worker's open Note: `uv run pytest` (without `--frozen`)
  under the dead proxy resolves nothing over the network after `uv sync --frozen`.

### Suites (criterion 17)

- **`backend/`:** `uv run pytest` green (the cold run). `ruff check` clean,
  `ruff format --check` clean.
- **`question-bank/`:** `bun test`, everything passes except **three tests**,
  all in the request below. Typecheck and lint are clean.
  - `farm-animal-loose-ends-verify.test.ts` › criterion 21: received 285, expected 283.
  - `climate-cold-trade-accepted-verify.test.ts` › criterion 22 non-test pin: received 288, expected 286.
  - `climate-cold-trade-accepted-verify.test.ts` › criterion 22 pre-existing
    test files: received 123, expected 122. This one comes from **my** new
    test file. The worker could not see it, because it did not exist at their step.
- **`frontend/`:** `bun test` gives 406 pass and 4 fail. **All four are
  module-load errors caused by this environment:** "Cannot find package
  'react-simple-maps'" in `t026-setup.criteria`, `t051-map-click`,
  `t051-tester.criteria` and `screens.criteria`. The package is declared in
  `frontend/package.json` but is missing from `node_modules`, and
  `bun install --frozen-lockfile` gets a 403 from the proxy on the `d3-*`
  tarballs. A Markdown edit plus a test that only reads files cannot cause that.
  For the same reason `bun run typecheck` fails, only on `UsMap.tsx` and the two
  t051 tests. `bun run lint` and `format:check` are clean. **CI on PR #127,
  which installs from scratch, is the authority for these.**
  - On my first full run, `lint-gate` and `format-gate` were red because my
    new file was not prettier-formatted yet. After formatting they are green.
- **Guards criterion 17 names**, unedited and green:
  `stale-suite-counts.criteria`, `stale-suite-counts-guard.criteria`,
  `level-window-claim.criteria`, `lint-gate`, `purge-sample-data-verify`.

### For the person approving

- **Rows 1 and 2** follow the T-045 precedent: the task's files join each allowed set.
  Re-run on `a7945cf` with the same three files exempted, my scratch script gives
  exactly the proposed count and digest. So the only thing they exempt
  is T-047's own three files. On `a7945cf` without the exemption, the same script reproduces
  today's pins (286 / `01eae9b3…`, 283 / `353529aa…`), so the script is faithful.
- **Row 3** re-pins over this tester's new test file, like T-039/T-045/T-053
  did for theirs. Its digest moves if that file changes again.
- **Row 4** is forced by row 1: `climate` pins the applied digest of the `farm` file.
- **T-102 / PR #126 re-pins the same constants.** Whichever PR merges second
  rebases its values.

## Review

### Reviewer, second pass, 2026-11-06 — **approved, inside the envelope**

**TL;DR.** **Approved.** Finding 1 (the merge conflict with T-102) is resolved:
`main` is merged in, the one conflicting digest was recomputed as row 8, which
Dkaattae approved, and CI on the head `f42e0dc` is green in all six jobs. The
PR is swept and marked ready with no escalation. **Next:** Dkaattae merges.

- **Finding 1, resolved.** `d88964b` merges `origin/main` (`e87e2fe`). Main's
  side is intact: the diff against `main` adds T-047's paths and pins only, and
  T-102's allowed-set entries survive. `a28e5ac` changes one comment line and
  matches row 8. All pre-existing test edits come from `tester` commits
  (`04ac466`, `d88964b`, `a28e5ac`) and match rows 1 to 8.
- **Every role is in the PR.** expander `cac85af`/`fe1276f`, worker `35c961f`,
  tester `c435bb8`/`04ac466`/`bd2c8b3`/`d88964b`/`a28e5ac`, orchestrator `runs/`
  commits, and the first reviewer pass `7da84b5`.
- **The document, re-read on the merged head.** Unchanged since the first pass
  (`test-guidelines.md` has not moved since `35c961f`). That review holds: each
  claim matches the file it names, it is in the file's voice, and the E-14
  framing reads as "keep in step".
- **Suites.** CI on `f42e0dc`: backend, backend (postgres), question-bank,
  frontend, integration and e2e all succeed. Locally, `question-bank` `bun test`
  gives 2713 pass and 0 fail.
- **Envelope.** Tester passed. No file outside Constraints (the pre-existing
  test edits are under rows 1 to 8, approved by a person: `Test changes:` names
  Dkaattae). `CI fix: none` in every round. No dependency, no `openapi.yaml`,
  migration or plan change, no child-facing text, no product decision.

**Flags from the first pass, now carried out by this sweep**
- **`test_contract.py` / `conftest.py` docstrings call `openapi.yaml` "the
  contract":** queued as new **T-104** in `tasks.md` §E.
- **`CLAUDE.md` lines 4 and 51:** stay with T-046, whose entry is amended now
  that `test-guidelines.md` is done.
- **The whole-tree pins cost eight rows and two attended rounds:** recorded as
  a recurrence on P-17 in `process-tasks.md`, not a `T` task.

### Reviewer, first pass, 2026-11-06 — **changes requested** (one blocking finding, and it is not about the document)

**TL;DR.** **The document is good and I would approve it as written.** The PR
cannot merge: PR #126 (T-102) merged to `main` after this branch was cut, and both
re-pinned `question-bank/src/climate-cold-trade-accepted-verify.test.ts`. GitHub
shows #127 as `dirty` and runs no CI on it. **Next:** an **attended** `tester`
session merges `origin/main` in, re-pins, and gets a person's approval (D-14).
Then the reviewer comes back for the sweep and marks the PR ready.

**Blocking**

1. **Merge conflict with `main` in a pre-existing test, which needs a person-approved re-pin.**
   - **Where:** `question-bank/src/climate-cold-trade-accepted-verify.test.ts`,
     `APPLIED_REQUEST_FILE_SHAS`, the `farm-animal-loose-ends-verify.test.ts`
     entry (around line 178). This branch pins `12535777…` (T-047 row 4).
     `main` pins `2a241617…` (T-102 row 3). Neither value is right once the two
     are merged.
   - **What I checked** in a scratch worktree, since removed, with nothing
     committed: `git merge origin/main` conflicts only in that file.
     `farm-animal-loose-ends-verify.test.ts` auto-merges, and its
     `CRITERION_21_ALLOWED` then carries both T-102's and T-047's paths.
   - **What would make it acceptable:** merge `origin/main` into
     `task/T-047-test-guidelines-backend`, not a rebase, which would need a
     force-push. Keep both sides' comment lines and allowed-set entries, which
     includes T-102's two `CRITERION_22_ALLOWED` paths. Then recompute the farm-animal
     `APPLIED_REQUEST_FILE_SHAS` digest from the merged file. Re-run the
     `question-bank` suite and recompute every T-047 pin (rows 1–7) on the merged
     tree. Raise the changed values as new Test change request rows, have a
     person approve them, and apply them in a `tester` commit. CI must go
     green on the merged head. The brief anticipated this (Constraints:
     "whichever merges second will need its pins rebased"), so this is the
     expected cost of being second, not a defect in anyone's work.
   - **Why the tester and not me:** these are new values in pre-existing tests,
     and D-14 reserves that for a person's approval in a tester session. I do not
     implement.

**Review of the work (no blocking findings)**

- **Accurate.** I checked every claim in the new backend section against the
  file it names. All are true:
  - `conftest.py`: `engine` is session-scoped and runs `alembic upgrade head`;
    `GEO_TEST_DATABASE_URL`; `db_session` uses `create_savepoint`; `client` uses
    `ASGITransport`, and its base URL carries `API_PREFIX`; `auth_headers`,
    `other_auth`, `spec`, `assert_matches` and `assert_problem` do what the
    section says.
  - `test_postgres.py`: covers sequences, JSON columns and concurrency, and
    skips on SQLite.
  - `backend/Makefile`: `test`, `test-postgres` and `test-integration` each
    depend on `install`.
  - `backend/integration/README.md`: the integration tests are not part of
    `make check` and need Docker.
- **Fits the file.** It reads in the file's voice, with no T-0xx numbers in the
  prose. A tester could write an endpoint test from the bullets alone. The E-14
  framing says "keep `openapi.yaml` in step", and it states that
  `assert_matches` still fails a test. The proxy block is still short, and its
  comments mark the guard.
- **Scope and lanes.**
  - The expander's commits touch only `tasks/`.
  - The worker's touch `test-guidelines.md` and the brief.
  - The tester's touch only test files and the brief.
  - The orchestrator's touch only `runs/` and the brief's `Approved:` line.
  - No source file, workflow, `CLAUDE.md` or dependency changed.
  - The pre-existing test edits match rows 1–7 and come only from `04ac466`, a
    `tester` commit.
  - `Test changes:` names Dkaattae.
- **CI on `bd2c8b3`** (the content head before the run-log commit): all seven
  jobs green, including frontend typecheck. This closes the worker's and
  tester's local `react-simple-maps` reds as environmental.

**Flags, disposed**

- **Guard stays `uv run pytest`, not `uv run --frozen pytest`:** decided, keep.
  The tester's cold run confirmed that nothing resolves over the network after
  `uv sync --frozen`.
- **"`make -C backend test` does the same after installing":** decided, accurate
  enough. `install` is `uv sync`, and `test` is `install` then `uv run pytest`.
- **`CLAUDE.md` lines 4 and 51:** already owned by T-046's entry in `tasks.md`,
  which names the hand-written `P` ticket. No new entry.
- **`test_contract.py` / `conftest.py` docstrings call `openapi.yaml` "the
  contract":** not blocking. The approving reviewer's sweep adds a new S entry to `tasks.md` to align
  the two docstrings with E-14. No existing task owns those files.
- **The criteria file under `frontend/` cost three extra re-pins** (rows 5–7):
  not blocking, and noted for the `PROGRESS.md` line at sweep. The tester showed
  that `question-bank/` would have cost as many.

**Not swept.** The PR was sent back, so the brief stays and the PR stays draft.

## Test change request

Raised by the tester on 2026-11-06, in an orchestrated run with nobody attending.
None of these tests has been changed. All four rows are stale because of
criterion 16: it allows this task to change `test-guidelines.md` and to add its
brief and run log, and the tester's step adds a criteria test file.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `T-096 criteria 17-21: the bank and the boundaries` › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096 tester. It protected T-096's criterion 21: no tracked non-test file outside T-096's set differs from main | Criterion 16: `test-guidelines.md` changes, and `tasks/T-047-test-guidelines-backend.md` and `runs/T-047-test-guidelines-backend.md` are new. Received 285, expected 283 | modify | Same name. `CRITERION_21_ALLOWED` gains `test-guidelines.md`, `tasks/T-047-test-guidelines-backend.md` and `runs/T-047-test-guidelines-backend.md` with a comment citing T-047 row 1. `rest.length` is pinned to **282** (was 283; comment "T-047 row 1: was 283"), and `MAIN_UNTOUCHABLE_SHA` to **`fda851f3e82936035bd784f2d32b252a7b2788d93cb56b308c0f0b6d7380422d`**. `a7945cf` gives the same count and digest with the same exemption | approved — Dkaattae, 2026-11-06, in the attended tester session |
| 2 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091 tester. It protected T-091's criterion 22: the diff touches only the allowed files | The same as row 1. Received 288, expected 286 | modify | Same name. `CRITERION_22_ALLOWED` gains the same three paths with a comment citing T-047 row 2. `MAIN_UNTOUCHABLE_COUNT` becomes **285** (was 286; re-pin comment), and `MAIN_UNTOUCHABLE_SHA` becomes **`0b3efcae2b47ff11f705117ef9fdea0f17e2a118629a9b07914ea233972027b5`**. `a7945cf` gives the same count and digest with the same exemption | approved — Dkaattae, 2026-11-06, in the attended tester session |
| 3 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › "pre-existing test files are main's, except ones in an approved Test change request" | `950f334`, T-091 tester. It protected the test files: none added or changed outside an approved request | The T-047 tester added `frontend/src/test-guidelines-backend.criteria.test.ts`. Received 123, expected 122 | modify | Same name. `MAIN_TESTS_COUNT` becomes **123** (was 122), and `MAIN_TESTS_SHA` becomes **`c920b17c497a02c1bcbd4df06a7f75adc741e457b13da407b00863355bbacd38`**, the digest with that file at blob `d872014`. Its comment reads "Re-pinned by T-047 (Test change request row 3): T-047's tester added test-guidelines-backend.criteria.test.ts (122 -> 123)". If the file changes before applying, recompute both | approved — Dkaattae, 2026-11-06, in the attended tester session; digest recomputed to `830fac35ae68cb672741c234f4402b001d46c503210d77d12bdc45c1d577ef2b` after the tsc fix to the criteria file, as the row allows (re-approved) |
| 4 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | `950f334`, T-091 tester. It protected the request files: each one changed only by its approved re-pin | It turns red once row 1 is applied, because it pins the `farm-animal-loose-ends-verify.test.ts` digest (`f199d230…`) | modify | Same name. Only the `farm-animal-loose-ends-verify.test.ts` entry of `APPLIED_REQUEST_FILE_SHAS` changes, to the sha256 of that file after row 1 is applied, with a comment citing T-047 row 4. No other entry changes, and the `MAIN_REQUEST_FILE_SHAS` check still requires it to differ from main | approved — Dkaattae, 2026-11-06, in the attended tester session; extended (approved) to the agriculture and map-click entries, which rows 5 and 6 change: `771b1850…` and `9650c28a…` |
| 5 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` › `T-088 criteria 20-25: what must not change` › "criterion 21: every tracked file under frontend/ is byte-identical to main's" | T-088 tester. It protected T-088's criterion 21: frontend/ unchanged | Added in the attended session; the orchestrated tester missed it. T-047's tester added `frontend/src/test-guidelines-backend.criteria.test.ts`, the only frontend/ change. Red on PR #127 CI | modify | Same name. `MAIN_FRONTEND_SHA` becomes **`4de52321996756b826c638bd9da8d2a3b8e673b1172817a9e2c1534414ce3a77`** (main's frontend/ plus that file), comment citing T-047 row 5 | approved — Dkaattae, 2026-11-06, in the attended tester session (digest re-approved after the tsc fix) |
| 6 | `question-bank/src/map-click-no-candidates-verify.test.ts` › `T-092 criterion 16: no other surface changes` › "frontend (except []) is byte-identical to 5d72ca5" | T-092 tester. It protected T-092's criterion 16 | Same as row 5 | modify | Same name. The frontend row's digest becomes **`179208d1b350009bc7251cb06a3fa33074f2388c115f7a7bc8418e51f2d422d5`**, comment citing T-047 row 6 | approved — Dkaattae, 2026-11-06, in the attended tester session (digest re-approved after the tsc fix) |
| 7 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` › `T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes` › "every tracked file under the three trees is as re-pinned by T-039, none added or removed" | T-087 tester. It protected T-087's criterion 15 | Same as row 5 | modify | Same name. `MAIN_BOUNDARY_SHA` becomes **`437329add2ccdb352732514d61ba4d78bc3183ec6d75b520f5da0ff56c61f597`**, comment citing T-047 row 7 | approved — Dkaattae, 2026-11-06, in the attended tester session (digest re-approved after the tsc fix) |
| 8 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | `950f334`, T-091 tester | Review finding 1: after merging `main` (`e87e2fe`, T-102), neither T-102's `2a241617…` nor T-047's `12535777…` is the merged farm-animal file's digest | modify | Same name. Only the `farm-animal-loose-ends-verify.test.ts` entry changes, to **`e9470a5ecb54496e624e58701aec72a9c1372fb12a9a35c55776c741a476cdd6`**. Both tasks' comment lines are kept | approved — Dkaattae, 2026-11-06, in the attended tester session |

Applied in `04ac466` (`T-047 tester: apply approved test change request`), rows 1–7 exactly.

## Notes

- **Decided: the guarded command stays `uv run pytest`, not `uv run --frozen
  pytest`.** It is the command CI runs, and after `uv sync --frozen` it
  resolved nothing over the network in the cold run. **Tester to confirm**
  through criterion 13.
- **Decided: `make -C backend test` is mentioned as an equivalent.** It is the
  same command after `uv sync` (`install` target). Note that it runs
  `uv sync`, not `uv sync --frozen`. **Reviewer to confirm** that the wording
  "does the same after installing" is accurate enough.
- **For the reviewer to queue (out of scope here):**
  - `backend/tests/test_contract.py`'s module docstring still calls
    `openapi.yaml` "the contract between this backend and `frontend/`", and
    `conftest.py`'s docstring says "what the contract promises". That is softer
    than E-14 but not false.
  - **`CLAUDE.md` lines 4 and 51** (`api/` … "not built yet", `uv add` in
    `api/`) need a `P` ticket by hand (G1). **Owner: human.**
- **The frontend `react-simple-maps` reds come from this environment's
  node_modules.** They are worth one look from the tester in a fresh
  environment. **Owner: tester.**
