# T-007 — `conventions.md` describes a repo that no longer exists

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** orchestrator — 2026-09-04, unattended run. See `runs/T-007-conventions-current.md`.
**From:** [`tasks.md`](../tasks.md) T-007
**Branch:** `claude/t007-orchestrator-startup-8orc9r` — assigned to this session by
the harness, and **this line is the authority**, not `task/T-007-…`. Every later
role checks `git branch --show-current` against it and pushes here regardless
(`CLAUDE.md` "Branches"; `process.md`, "When the environment names the branch for
you").
**PR:** [#33](https://github.com/Dkaattae/geo-discovery-zone/pull/33) — draft,
opened at expand time against the branch above. It stays draft until the reviewer
approves it.
**Fault:** —

**Sessions:** one line per agent run — role, date, and session id
(`echo $CLAUDE_CODE_REMOTE_SESSION_ID`). The tester must refuse to run in a
session already listed as `worker`.

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-04 | `cse_01AtuAKBQ3YW1N9bz4feeDTP` (orchestrated run) |
| worker | 2026-09-04 | `cse_01AtuAKBQ3YW1N9bz4feeDTP` (orchestrated run — same session id as task-expander; see process.md "Spawning, and the isolation it must not cost") |
| tester | 2026-09-04 | `cse_01AtuAKBQ3YW1N9bz4feeDTP` (orchestrated run — **same session id as worker**; the Sessions check cannot prove independence here, see Verdict) |

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

Written by `worker`, 2026-09-04. Rewrote `conventions.md` in full — the only
file changed besides this brief. No other file was touched: `bun.lock`,
`uv.lock`, `package.json`, `pyproject.toml` and `ci.yml` are all unmodified
(`git status` confirms this, see "How to check" below).

### Criterion by criterion

| # | Criterion | Where it lives now |
|---|---|---|
| 1 | Every Layout path exists | Layout block (lines 8–16) lists `frontend/`, `backend/`, `question-bank/`, `e2e/`, `fixtures/`, `tasks/`, `openapi.yaml` — all seven resolve at repo root; verified with `ls` |
| 2 | Layout names all seven, one line each | Same block, one line per path |
| 3 | Nothing claims the backend is unbuilt | Grepped `conventions.md` for `not built yet`, `once it exists`, `cd api` — no matches. Every sentence about the backend/API/database describes it as built and tested |
| 4 | `api/` gone as a directory | No line names a top-level `api/` dir; the only `api/` substrings left are `/api/v1` (lines 10, 73), which the criterion explicitly allows |
| 5 | `fixtures/` explained | New "Shared fixtures" section (lines 18–27) names `fixtures/level-labels.json` and both `frontend/src/lib/level.test.ts` and `backend/tests/test_levels.py` by path, and says editing one side alone turns one suite red |
| 6 | Backend commands, real targets | Commands block: `make -C backend dev\|test\|check\|migrate`. All four confirmed as targets in `backend/Makefile` (`dev`, `test`, `check`, `migrate` — read the file, not assumed) |
| 7 | Migrations, both commands | `make -C backend migrate` (line 76) and `make -C backend revision m="..."` (line 77), both real `backend/Makefile` targets |
| 8 | Database described | New "The database" section (lines 83–91): `GEO_DATABASE_URL` named as the single setting, SQLite default, Postgres supported and tested |
| 9 | Frontend/question-bank/e2e commands real | Commands block names `bun run typecheck` and `bun test` for frontend; every `bun run <script>` named (`dev`, `typecheck`, `lint`, `format` for frontend; `build`, `build:sample`, `typecheck` for question-bank; `install-browser`, `typecheck`, `test` for e2e) is a key of that package's `scripts` — checked against all three `package.json` files directly |
| 10 | CI described, job list exact | New "CI" section (lines 93–104): names `.github/workflows/ci.yml`, says it runs on every PR to `main` and every push to `main`, lists exactly `frontend`, `question-bank`, `backend`, `backend-postgres`, `integration`, `e2e` — the same six keys under `jobs:` in `ci.yml`, checked by reading the file |
| 11 | Docker pointed at, not restated | New "Docker" section (lines 106–113): names `Dockerfile` and `docker-compose.yml`, says the image serves the frontend and API on one origin, links to `README.md` "Run it locally with Docker" for the run instructions. No `docker run` flag, volume name or port mapping was copied in |
| 12 | Every relative link resolves | Seven markdown links, all relative, all checked to exist: `fixtures/level-labels.json`, `frontend/src/lib/level.test.ts`, `backend/tests/test_levels.py`, `.github/workflows/ci.yml`, `Dockerfile`, `docker-compose.yml`, `README.md` |
| 13 | Nothing outside this file moves | `git status --short` shows only `conventions.md` modified in the working tree; this brief is the only other file this worker touched |
| 14 | No dependency/CI/network change | No `package.json`, lockfile, `pyproject.toml`, `uv.lock` or `ci.yml` changed. `bun install` in `frontend/` and `question-bank/` was run only to get `node_modules` for local test runs (see below), not committed — lockfiles are untouched |

### What I deliberately did not do

- **Left `## Code` and `## Network` untouched**, per "What is already true" and
  the Out of scope item "Rewriting the `## Code` and `## Network` sections" —
  byte-for-byte the same as before.
- **Did not touch `CLAUDE.md`**, which has the identical `api/`/`not built yet`
  staleness. Per Out of scope, that is a `P-n` ticket in `process-tasks.md`
  because `CLAUDE.md` is loop-gated; filing it is a human's call, not this
  task's, so I have not filed it myself, only flagged it here again.
- **Did not touch `PROGRESS.md` or `test-guidelines.md`.** Both become stale in
  the same way this task fixes; per Out of scope, `PROGRESS.md`'s sweep is the
  reviewer's job in the same PR, and `test-guidelines.md`'s `api/` section is
  T-047.
- **Did not restate Docker `docker run` invocations, ports or volume names** in
  `conventions.md` — linked to `README.md` instead, per Constraints ("stays a
  reference, not a second README").
- **Did not add a shape-check test.** Constraints allow the tester to add at
  most one; writing one here would have pre-empted that role, and criteria
  1–4, 6–10 and 12–14 are exactly the mechanically-checkable ones the review
  checklist already calls out as "several are a `grep`."

### Something worth flagging, not blocking

- **`README.md` line 202 is now also slightly stale** — it says "CI runs all
  five jobs on every pull request: `frontend`, `question-bank`, `backend`,
  `backend-postgres` and `integration`," missing `e2e`, the sixth job. I did
  not touch it: `README.md` is not in this brief's Constraints ("Files expected
  to change: `conventions.md`... plus this brief's Handoff") and fixing it
  would be exactly the kind of extra commit Out of scope warns against. Noting
  it here so it becomes a `tasks.md` entry at sweep time rather than getting
  lost. **Proposed owner: reviewer**, to add to `tasks.md` during its sweep (or
  the human at merge, if the reviewer judges it out of its own envelope).

### How to run what I touched

`conventions.md` is prose; there is nothing to run against it directly beyond
reading it beside the repo (which is exactly what the criteria ask). To
re-check the mechanical criteria:

```bash
grep -n "not built yet\|once it exists\|cd api\b" conventions.md   # criterion 3, expect nothing
grep -n "api/" conventions.md                                       # criterion 4, expect only /api/v1
grep -oE '\[[^]]*\]\([^)]*\)' conventions.md                         # criterion 12, then `ls` each target
```

### Invariant checks (Constraints: must stay green)

Ran all of these against the branch with `conventions.md` changed:

- `cd question-bank && bun run typecheck` — clean.
- `cd question-bank && bun test` — 19 pass, 0 fail.
- `make -C backend check` — ruff check clean, ruff format clean, 233 passed / 9
  skipped (the Postgres-only tests, which skip on SQLite by design).
- `cd frontend && bun test` — 88 pass, 0 fail (one run mid-session showed a
  transient timeout in `lint-gate.test.ts`, which shells out to `bun run lint`
  with a 5s timeout; re-running it alone and as part of the full suite passed
  cleanly both before and after my edit, so it is flaky under load rather than
  caused by this change — `conventions.md` is not part of the TypeScript
  program or the lint target).
- `cd frontend && bun run lint` — exit 0, no output.
- `cd frontend && bun run typecheck` — **could not complete**: `bun install`
  in `frontend/` fails on this sandbox with `403` from the pinned package
  registry (`europe-west1-npm.pkg.dev`) for `react-simple-maps`'s transitive
  `d3-*` dependencies, so the corresponding `@types` packages are missing from
  the checked-out `node_modules` and `tsc` reports `Cannot find module
  'react-simple-maps'` in `UsMap.tsx` — a file this task never touches. This is
  a pre-existing sandbox network restriction, not something this change
  introduced: `frontend/bun.lock` is byte-identical to `main` (`git diff
  --stat -- frontend/bun.lock` is empty), `node_modules/` is gitignored, and no
  dependency was added or changed. I could not get a clean `bun run typecheck`
  run to confirm this invariant in this environment; **flagging for the
  tester** to either reproduce (and treat as a pre-existing environment gap
  unrelated to this task) or run in an environment where the frontend registry
  is reachable.

## Verdict

**Pass.** All fourteen criteria hold against the branch as committed. Criteria
1–12 are now asserted by one new test file — `frontend/src/conventions-doc.test.ts`,
50 tests inside the existing `frontend/` `bun test` suite — and every one of them
was proved capable of failing by 23 deliberate mutations of `conventions.md`, all
reverted. Criteria 13–14 were checked against `origin/main` by hand.

**Whole suite green**, with one pre-existing environment gap that is not this
task's: `frontend`'s `bun run typecheck` reports 4 errors in
`src/components/UsMap.tsx`, identical with and without my new file, caused by
`react-simple-maps` and `us-atlas` missing from `node_modules` (sandbox registry
403). `frontend/src` is byte-identical to `origin/main` apart from my added test,
so this is reproducible on `main` and independent of the change.

**Independence, stated honestly.** This is an orchestrated run
(`runs/T-007-conventions-current.md` exists), so every spawned role shares one
session id and the Sessions-table check **did not and cannot** prove I am a
separate session — my id is the same one listed for `worker` and
`task-expander`. What I do have is the weaker form: a freshly spawned agent with
its own context window that never saw the worker's transcript or reasoning, and
read only the brief and the committed repo. Every expected value below comes from
a criterion's wording or from the repo file that criterion names as authority
(`backend/Makefile`, the three `package.json` files, `ci.yml`,
`docker-compose.yml`) — never from `conventions.md`, which is the artefact under
test. A reader deciding how much to trust this `pass` should weigh it as
orchestrator-attested rather than session-proved (`process.md`, "Spawning, and
the isolation it must not cost").

### Criterion by criterion

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | All 7 Layout paths resolve at the repo root; asserted per path, one test each. Mutation M1 (`openapi.yaml`→`openapi.yml`) turned it red |
| 2 | pass | All seven named with a non-empty one-line description. M2 (delete the `fixtures/` line) red |
| 3 | pass | `not built yet`, `once it exists`, `cd api` all absent; a regex for "API/backend/database … not built / does not exist / yet to be built" finds nothing. M3 red. See the judgement call below |
| 4 | pass | After stripping `/api/v1`, no `api/` remains. A companion test asserts `/api/v1` *is* still present, so the check cannot be satisfied by deleting the URL too (M17 red) |
| 5 | pass | Names `fixtures/level-labels.json`, both `frontend/src/lib/level.test.ts` and `backend/tests/test_levels.py`, and says editing one side turns exactly one suite red. M5 and M21 red |
| 6 | pass | `make -C backend dev\|test\|check\|migrate` all present in repo-root form; every `make -C backend <target>` in the doc is a target defined in `backend/Makefile` (parsed from the Makefile, not from the doc). M6 (`check`→`verify`) red |
| 7 | pass | `migrate` and `revision` both named, both defined targets. M7 red |
| 8 | pass | `GEO_DATABASE_URL` named as the single setting, SQLite the default, Postgres supported and tested. M8 red |
| 9 | pass | Frontend block names `bun run typecheck` and `bun test`; every `bun run <script>` the doc names for `frontend/`, `question-bank/` and `e2e/` is a key of that package's `scripts`. M9, M13, M14, M18, M19 red |
| 10 | pass | Names `.github/workflows/ci.yml`, the PR-to-`main` and push-to-`main` triggers, and a job list whose set equals the keys under `jobs:` in `ci.yml` exactly — `frontend`, `question-bank`, `backend`, `backend-postgres`, `integration`, `e2e`. Set equality tested both ways: M10 (drop `e2e`) and M23 (add a fake `lint` job) both red |
| 11 | pass | Names `Dockerfile` and `docker-compose.yml`, says one origin, links `README.md`; no `docker run`, no `-p`/`-v` flag, no `host:port` mapping, and none of `docker-compose.yml`'s named volumes (`atlas-postgres`) appear. M11, M15, M20 red |
| 12 | pass | All 7 markdown links are relative and all resolve; no link is an `http(s)://` URL. M12 and M22 red |
| 13 | pass, with a note | Files differing from `origin/main`: `conventions.md`, `tasks/T-007-conventions-current.md`, `tasks.md` (expander's queue line), `runs/T-007-conventions-current.md` (orchestrator's log). `CLAUDE.md`, `process.md`, `process-decisions.md`, `process-tasks.md`, `openapi.yaml`, `geoquizdataplan.md`, `test-guidelines.md`, `.claude/**`, `.github/workflows/**`, `frontend/src/**`, `backend/app/**`, `question-bank/src/**`, `e2e/tests/**` are all byte-identical. The worker's own commit (`5a4f191`) touched exactly `conventions.md` and this brief |
| 14 | pass | No `package.json`, `bun.lock`, `pyproject.toml`, `uv.lock` or `ci.yml` in the diff against `origin/main`; no job added. The new test reads local files only and passes with `HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY` and their lowercase forms at `http://127.0.0.1:1` |

### The one thing the reviewer should look at

- **`runs/T-007-conventions-current.md` differs from `main` and criterion 13 does
  not list it.** On the strictest reading of its first sentence that is a
  violation; I did not fail the task on it, because the file is the
  **orchestrator's** run log, written by neither worker nor tester, mandated by
  `process.md` for a relayed run, and the criterion's own "In particular" list —
  which is what the criterion is actually guarding — is satisfied in full. Named
  here rather than silently absorbed so the call is the reviewer's, not mine.
- **A judgement call inside criterion 3.** `conventions.md:10` reads "serving
  `/api/v1` and, once built, the frontend on the same origin". "once built"
  refers to the frontend's static bundle, not to the API, the backend or the
  database, and is accurate — `backend/tests/test_frontend_serving.py` covers
  exactly that conditional. It is not one of the three strings the criterion
  forbids. Recorded because it is the nearest thing in the file to the phrasing
  the criterion outlaws.
- **`README.md:202` is stale in the same way** (five CI jobs, missing `e2e`) —
  the worker flagged it and correctly left it alone. Confirmed still stale.

### What I ran

| Check | Result |
|---|---|
| `cd frontend && bun test` (dead-port proxies) | **138 pass, 0 fail** — 88 pre-existing + 50 new |
| `cd frontend && bun run lint` | exit 0 |
| `cd frontend && bun run typecheck` | 4 errors, all `src/components/UsMap.tsx`, **identical without my file** — missing `react-simple-maps`/`us-atlas` in `node_modules`, sandbox registry 403. Pre-existing; `bun.lock` and `frontend/src` are unchanged from `origin/main` |
| `cd question-bank && bun run typecheck` | clean |
| `cd question-bank && bun test` (dead-port proxies) | 19 pass, 0 fail |
| `make -C backend check` | ruff clean, **233 passed, 9 skipped** (Postgres-only) |

### Mutations made, and reverted

23 in two rounds, each a temporary edit to `conventions.md` only, applied and
restored by a script; `git status` afterwards shows `conventions.md` unmodified.
Every mutation turned the expected test — and only tests belonging to that
criterion, plus criterion 1's path check where a mutation renamed a directory —
red. No source file was edited at any point.

M1 nonexistent Layout path · M2 delete `fixtures/` line · M3 add "the backend is
not built yet" · M4 rename `backend/` to `api/` · M5 drop the backend test file
· M6 `check`→undefined `verify` · M7 delete the `revision` command · M8 drop
`GEO_DATABASE_URL` · M9 `build:sample`→undeclared `build:offline` · M10 drop
`e2e` from the job list · M11 paste `docker run -p 8000:8000 -v atlas-postgres:…`
· M12 link at a missing file · M13 delete frontend `typecheck` · M14 delete
frontend `bun test` · M15 remove "one origin" · M16 remove the CI triggers · M17
delete `/api/v1` as well · M18 e2e `install-browser`→undeclared · M19 frontend
`dev`→undeclared `serve` · M20 unname `Dockerfile` · M21 remove the "turns a
suite red" explanation · M22 add an `https://` link · M23 invent a seventh CI
job.

### Files I added

- `frontend/src/conventions-doc.test.ts` — the one test file the Constraints
  allow, in the existing suite the Constraints name, no new runner, no new
  dependency, no network. It parses `backend/Makefile`, the three
  `package.json`s, `ci.yml` and `docker-compose.yml` for its expected values, so
  it stays true if those change and `conventions.md` does not.

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
- **Worker note, 2026-09-04:** the survey held — all six gaps were real and
  unfixed, and criteria 1–14 were satisfied by rewriting `conventions.md`
  alone, no other file. The one surprise was environmental rather than about
  the task: `frontend/`'s package registry is blocked in this sandbox
  (`europe-west1-npm.pkg.dev` returns 403 for some `d3-*` transitive types),
  so `bun run typecheck` in `frontend/` could not be confirmed green here even
  though nothing in this change touches TypeScript or frontend dependencies —
  `bun.lock` is untouched and `node_modules/` is gitignored. `bun test`,
  `bun run lint`, question-bank's full suite and `make -C backend check` (233
  passed, 9 skipped) all ran clean. Flagged in the Handoff for the tester to
  either reproduce or run somewhere the registry is reachable — this is not a
  product or dependency decision, just a sandbox gap, so I did not stop for it.
- **Also flagged, not fixed:** `README.md` line 202 still lists five CI jobs
  and is missing `e2e`, the same staleness this task fixes in `conventions.md`.
  Out of this brief's Constraints (only `conventions.md` is listed as a file
  the worker may change), so I left it and named it in the Handoff for the
  reviewer's sweep or a new `tasks.md` entry.
