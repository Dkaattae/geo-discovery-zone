# T-007 — `conventions.md` describes a repo that no longer exists

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending` — replace with who approved and the date, e.g. `Kate, 2026-09-04`
**From:** [`tasks.md`](../tasks.md) T-007
**Branch:** `claude/t007-orchestrator-startup-8orc9r` — assigned to this session by
the harness, and **this line is the authority**, not `task/T-007-…`. Every later
role checks `git branch --show-current` against it and pushes here regardless
(`CLAUDE.md` "Branches"; `process.md`, "When the environment names the branch for
you").
**PR:** #30 — draft, opened at expand time against the branch above. It stays
draft until the reviewer approves it.
**Fault:** —

**Sessions:** one line per agent run — role, date, and session id
(`echo $CLAUDE_CODE_REMOTE_SESSION_ID`). The tester must refuse to run in a
session already listed as `worker`.

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-04 | `cse_01AtuAKBQ3YW1N9bz4feeDTP` (orchestrated run) |

## Goal

`conventions.md` is the file a new session reads to find out how this repo is
laid out and what commands to run, and most of what it says is now false: it
places the API in a directory that does not exist, tells you to run it with
commands that do not work, and describes a repo with no CI, no database and no
Docker. Make it true, so that a session that trusts it is not wrong.

## What is already true — do not rebuild it

Surveyed 2026-09-04, before writing the criteria below.

- **Correct today, and out of scope:** `conventions.md`'s `## Code` section
  (strict TypeScript, prettier at 100 columns, "Alembic owns the database
  schema", join on codes, no secrets in the repo) and its `## Network` section
  (the `curl` fallback, `QUESTION_BANK_NO_CURL=1`). Leave both alone except where
  a criterion below names them.
- **The facts the file is missing already exist elsewhere** and can be read
  rather than invented: `backend/Makefile` (targets), `backend/README.md`,
  `README.md` (Docker), `docker-compose.yml`, `.github/workflows/ci.yml` (six
  jobs), and the three `package.json` files.
- **Nothing about the repo needs to change** for this task. Every criterion below
  is satisfied by editing one markdown file.

Wrong today, and the substance of the work:

| `conventions.md` says | Reality |
|---|---|
| `api/  FastAPI backend (Python, uv) — not built yet` (line 11) | built, 242 tests, and in `backend/` |
| `# api (once it exists)` / `cd api && uv sync && …` (lines 52–55) | `make -C backend dev\|test\|check\|migrate`, wrapping `uv` |
| frontend commands: `dev`, `lint`, `format` (lines 41–43) | `bun run typecheck` exists and CI runs it; `bun test` runs the 88 frontend tests |
| nothing about CI | six jobs on every PR, `.github/workflows/ci.yml` |
| nothing about the database | `GEO_DATABASE_URL`, SQLite default, Postgres supported, Alembic applied by `make -C backend migrate` |
| nothing about Docker | `Dockerfile` + `docker-compose.yml`, one image serving both halves on :8000 |
| layout lists neither `e2e/` nor `fixtures/` | both exist; `fixtures/level-labels.json` is asserted against by two suites in two languages |

## Acceptance criteria

Frozen once approved. Each is checkable on its own, against the branch as
committed, by reading `conventions.md` beside the repo it describes. "Names" below
means the string appears in `conventions.md`; case and surrounding prose are free.

1. **Every path in the Layout block exists.** Each filesystem path listed in
   `conventions.md`'s `## Layout` code block resolves to a file or directory that
   exists in the working tree when interpreted relative to the repo root.

2. **The Layout block names all seven of these**, each with a one-line
   description: `frontend/`, `backend/`, `question-bank/`, `e2e/`, `fixtures/`,
   `tasks/`, `openapi.yaml`. Anything else it lists is optional and is governed by
   criterion 1.

3. **Nothing claims the backend is unbuilt.** The strings `not built yet`,
   `once it exists` and `cd api` do not appear anywhere in `conventions.md`, and
   no sentence in the file describes the API, the backend or the database as not
   yet existing.

4. **`api/` is gone as a directory.** `conventions.md` contains no reference to a
   top-level directory named `api/`. Occurrences of `/api/v1` — the URL prefix the
   backend serves the contract under — are unaffected and may appear.

5. **`fixtures/` is explained.** `conventions.md` names
   `fixtures/level-labels.json` and says it is a committed table that both the
   frontend suite and the backend suite assert against, naming both sides
   (`frontend/` and `backend/`, or the two test files). A reader who has never
   seen the file learns from `conventions.md` that editing one side alone turns a
   suite red.

6. **Backend commands exist.** `conventions.md` shows how to run, test and
   migrate the backend, and **every `make` target it names for the backend is a
   target defined in `backend/Makefile`**. It names at least `dev`, `test`,
   `check` and `migrate`, invoked in a form runnable from the repo root
   (`make -C backend <target>`).

7. **Migrations, in practice.** `conventions.md` names both the command that
   applies migrations and the command that creates a new one, and both resolve to
   targets defined in `backend/Makefile` (`migrate` and `revision` today).

8. **The database is described.** `conventions.md` names `GEO_DATABASE_URL` as
   the single setting that chooses the database, and says SQLite is the default
   and Postgres is supported and tested.

9. **Frontend commands are complete and real.** The frontend command block names
   `bun run typecheck` and names how to run the frontend tests (`bun test`), and
   **every `bun run <script>` it names for `frontend/` is a key of `scripts` in
   `frontend/package.json`**. The same holds per-package for every
   `bun run <script>` it names for `question-bank/` and `e2e/`
   (`question-bank/package.json`, `e2e/package.json`).

10. **CI is described, and the job list matches.** `conventions.md` names
    `.github/workflows/ci.yml`, says it runs on every pull request to `main` and
    every push to `main`, and lists job names whose set is **exactly** the set of
    keys under `jobs:` in `ci.yml` — six today: `frontend`, `question-bank`,
    `backend`, `backend-postgres`, `integration`, `e2e`. Neither a job in the
    workflow that the doc omits nor a name in the doc that is not a job satisfies
    this.

11. **Docker is pointed at, not restated.** `conventions.md` names `Dockerfile`
    and `docker-compose.yml`, says the image serves the built frontend and the API
    on one origin, and links to `README.md` for the run instructions rather than
    reproducing them. No `docker run` flag set, volume name or port mapping is
    copied into `conventions.md`.

12. **Every relative link resolves.** Every markdown link in `conventions.md`
    whose target is a relative path points at a file that exists in the repo. No
    link targets a URL that would have to be fetched to check.

13. **Nothing outside this file moves.** On this branch, the only paths that
    differ from `main` are `conventions.md`, `tasks/T-007-conventions-current.md`,
    and — if the tester adds one — a test file plus the sweep's expected
    `tasks.md` and `PROGRESS.md`. In particular `CLAUDE.md`, `process.md`,
    `process-decisions.md`, `process-tasks.md`, `.claude/**`,
    `.github/workflows/**`, `openapi.yaml`, `geoquizdataplan.md`,
    `test-guidelines.md` and every file under `frontend/src`, `backend/app`,
    `question-bank/src` and `e2e/tests` are byte-identical to `main`.

14. **No dependency, no new CI job, no network.** No `package.json`,
    `bun.lock`, `pyproject.toml` or `uv.lock` changes; no job is added to
    `ci.yml`; and any check written for this task passes with every proxy variable
    pointed at a dead port (`test-guidelines.md`, "No network in tests, ever").

## Out of scope

Anything noticed here that is worth doing becomes a new entry in `tasks.md`, not
an extra commit on this branch.

- **`CLAUDE.md` is stale in the same way and must not be touched.** Line 4 still
  reads ``` `api/` FastAPI + Postgres (uv, not built yet)```, and line 51 says
  `uv add` / `uv run` in `api/`. `CLAUDE.md` is a loop-gated file: changes to it
  are `P-n` tickets in `process-tasks.md`, done by hand, and `run-loop.sh` G1
  refuses a diff that touches it (`process.md`, "Work on the loop itself never
  enters the loop"). Leave it exactly as it is and say so in the Handoff; filing
  the `P` ticket is a human's call, not this task's.
- **`PROGRESS.md` and `test-guidelines.md`.** `PROGRESS.md:30` ("`conventions.md`
  still says `api/`") and `PROGRESS.md:322` ("`conventions.md` describes a repo
  with no backend and no CI") both become false when this lands — that is the
  **reviewer's sweep**, in the same PR, not the worker's edit.
  `test-guidelines.md`'s stale `api/` section is **T-047**.
- **Deciding `backend/` vs `api/` (T-046).** This task records where the service
  is *today*; it does not settle whether it should be renamed. If T-046 later
  renames it, `conventions.md` changes again — cheaply, because criterion 1 makes
  the drift visible.
- **Renaming, moving or creating any directory.** No file outside
  `conventions.md` is edited to make a criterion true.
- **A general documentation-link or doc-drift harness**, and any new CI job to run
  one. A cheap shape check inside an existing suite is welcome (see Constraints);
  new infrastructure is not.
- **Rewriting the `## Code` and `## Network` sections.** They are correct.
- **The `E2E_BASE_URL` / `GEO_E2E_BASE_URL` inconsistency** between
  `e2e/README.md` and `backend/Makefile`. Real, noticed while surveying, and not
  this task — file it in `tasks.md` if it matters.

## Constraints

- **Files expected to change:** `conventions.md` (worker), plus this brief's
  `## Handoff`. The tester may add at most one test file; the reviewer sweeps
  `tasks.md` and `PROGRESS.md`.
- **`conventions.md` stays a reference, not a second README.** `CLAUDE.md` says
  it "carries the rest" — detail that does not need to be in front of every
  session. Where the root `README.md`, `backend/README.md` or `e2e/README.md`
  already explains something at length, link to it rather than copying it;
  duplicated instructions are what went stale here in the first place.
- **Facts come from the repo, not from memory.** Every command written down must
  be read out of `backend/Makefile`, a `package.json`, `ci.yml` or
  `docker-compose.yml`. Do not write a command you have not seen defined.
- **A shape check, if written, lives in an existing suite** — `frontend/`'s
  `bun test` is the precedent (`frontend/src/lint-gate.test.ts` asserts on
  repo-level config; `frontend/src/lib/level.criteria.test.ts` reads
  `fixtures/level-labels.json` from the repo root). No new runner, no new job, no
  new dependency.
- **Dependencies:** none without asking (`CLAUDE.md`).
- **Invariant:** `bun run typecheck`, `bun run lint` and `bun test` in
  `frontend/`, `bun run typecheck` and `bun test` in `question-bank/`, and
  `make -C backend check` are all still green at the end. A markdown edit should
  not move them; if one is red, something outside this task's scope was touched.

## Context

**Required reading for the worker and the tester.**

- **The file under change:** [`conventions.md`](../conventions.md) — Layout at
  lines 6–14, Commands at lines 38–56, the correct `## Code` and `## Network`
  sections either side of them.
- **The queue entry this expands:** [`tasks.md`](../tasks.md) §A, T-007, which
  lists the six known gaps; and T-046 and T-047, which own the parts deliberately
  left out above.
- **Where the true facts live:**
  - `backend/Makefile` — every target, with its help text.
  - `backend/README.md` — the `make -C backend …` block and what the backend
    does and does not serve.
  - `.github/workflows/ci.yml` — the six jobs under `jobs:`, their triggers
    (lines 4–8), and the dead-proxy guard on the four unit test steps.
  - `docker-compose.yml` (header comment) and `README.md` "Run it locally with
    Docker" — the Docker story, to link to rather than restate.
  - `frontend/package.json`, `question-bank/package.json`, `e2e/package.json` —
    the only authority on what `bun run <script>` names exist.
  - `fixtures/level-labels.json`, with `frontend/src/lib/level.test.ts` and
    `backend/tests/test_levels.py` — the two-suite pattern criterion 5 asks the
    doc to explain.
- **Rules that bind this task:** [`CLAUDE.md`](../CLAUDE.md) "Packages" (uv and
  bun, never pip/npm) and "Branches"; [`process.md`](../process.md), "Work on the
  loop itself never enters the loop" (why `CLAUDE.md` is untouchable here) and
  "Tasks this loop does not fit" (why this brief carries a review checklist).
- **Plan:** [`geoquizdataplan.md`](../geoquizdataplan.md) §5 is the tech stack
  `conventions.md` should be consistent with — §5.3 in particular for "Alembic
  owns the schema, a Python loader writes the data".
- **Contract:** `openapi.yaml` is not changed by this task. It is named in the
  Layout block, and that is the whole of its involvement.

## Review checklist — non-testable tasks only

Criteria 1–4, 6–10 and 12–14 are mechanically checkable and several are a `grep`.
What a human still has to read, and record in the PR:

- [ ] A session that has never seen this repo could set up and run **each of the
      four packages** from `conventions.md` alone, without opening a README first.
- [ ] The file still reads as a *conventions* file — rules and pointers — rather
      than a duplicate of the root `README.md`.
- [ ] Nothing added contradicts `CLAUDE.md`, `test-guidelines.md` or
      `geoquizdataplan.md` §5.
- [ ] The Docker and CI additions are short enough that the next person keeps
      them up to date.
- [ ] Who checked the above, and when, is written in the PR.

## Handoff

Written by `worker` before the tester runs. **Always written, even when nothing
was built.**

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

- **Survey note for the worker:** the six gaps in the queue entry were all
  re-confirmed against the tree on 2026-09-04. None of them has been fixed since
  the entry was written, and no criterion above is already satisfied.
- **Criterion 10 is deliberately set equality.** A doc that lists five of six CI
  jobs is the failure this task exists to fix, and "mentions CI" would not catch
  it.
- **Criterion 13 is the one that keeps this task small.** A doc task that starts
  correcting `CLAUDE.md` and `PROGRESS.md` on the way past is how a one-hour
  change becomes a gated one.
