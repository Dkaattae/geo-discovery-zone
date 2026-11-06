# T-047 — `test-guidelines.md`'s `api/` section is still marked "does not exist yet"

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-047
**Branch:** `task/T-047-test-guidelines-backend`
**PR:** opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-06 | cse_011oDiJbsZTbExMiPULZMiFd |

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

## Verdict

## Notes
