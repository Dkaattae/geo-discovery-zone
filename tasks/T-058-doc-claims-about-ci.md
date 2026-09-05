# T-058 — Three doc claims that are true-ish, and one that is not

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-09-05, unattended run. See `runs/T-058-doc-claims-about-ci.md`.
**From:** [`tasks.md`](../tasks.md) T-058
**Branch:** `claude/t009-orchestrator-startup-uot0vc` — the branch this session
was assigned by the environment (Claude Code on the web), used instead of
`task/T-058-…` per `process.md`, "When the environment names the branch for you".
**Every role on this task pushes here.**
**PR:** [#35](https://github.com/Dkaattae/geo-discovery-zone/pull/35) — draft,
opened at expand time from the branch above, and it stays draft until the
reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-05 | cse_01ACZu6WMBf4Kx8dTMZLKKuW |

## Goal

`README.md` and `conventions.md` make four claims about how this repo is checked.
One is simply false (CI runs six jobs, not five), one has become false since it
was written (CI does run the Postgres path), one overstates a guard that four of
six jobs actually have, and one hardcodes a count that the next `e2e` task will
invalidate. Correct them, and — where the claim is about `ci.yml` — put it under a
test, because `conventions.md`'s job list stayed true only because a test holds it
there while `README.md`'s drifted alone.

## What is already true — surveyed 2026-09-05, do not rebuild

Read this before starting; several things the criteria mention already exist.

| Fact | Where |
|---|---|
| `ci.yml` has **six** jobs: `frontend`, `question-bank`, `backend`, `backend-postgres`, `integration`, `e2e` | `.github/workflows/ci.yml:16-322` |
| **Four** jobs verify their lockfile did not move with `git diff --exit-code` | `ci.yml:45` (bun.lock), `:112` (bun.lock), `:165` (uv.lock), `:299` (bun.lock) |
| **Two do not** — they install with `--frozen` and stop there | `backend-postgres` install at `ci.yml:227`, `integration` install at `ci.yml:266` |
| `conventions.md`'s **job list is already correct** and already asserted set-equal to `ci.yml`'s `jobs:` keys | `conventions.md:96-98`, test at `frontend/src/conventions-doc.test.ts:301-337` |
| `conventions.md:10`'s "once built" clause is **accurate** — the backend serves the bundle when one exists | `backend/tests/test_frontend_serving.py` |
| Machinery for parsing `ci.yml` and asserting on a doc already exists and needs no new dependency | `frontend/src/conventions-doc.test.ts:23-61`, `301-312` |

And the four defects, each with its line:

- **`README.md:202-203`** — "CI runs all **five** jobs on every pull request:
  `frontend`, `question-bank`, `backend`, `backend-postgres` and `integration`."
  Six, and `e2e` is the missing one. This is the one that is plainly false.
- **`README.md:229-231`** — "**CI only runs the SQLite path.** … nothing runs
  `make -C backend test-postgres` automatically, so a Postgres-only regression
  would not fail a pull request." False since the `backend-postgres` job landed
  (`ci.yml:197-244` runs the whole suite against Postgres 16 on every PR).
  **Found by this survey, not by T-007's reviewer** — it is the same defect in the
  same file and is folded in here rather than queued separately.
- **`conventions.md:98`** — "Each installs from a frozen lockfile, checks the
  lockfile did not move" — said of all six; true of four.
- **`conventions.md:66`** — "`# e2e — thirteen full user journeys`". True today,
  stale after the next `e2e` task, and nothing asserts it.

Two counts in `README.md`'s Checks block are stale in the same way and are in
scope: `README.md:183` "ruff + 221 tests" and `README.md:185` "28 tests"
(`tasks.md` §A and `PROGRESS.md` both say 242 backend and 30 integration today).

`README.md` never mentions the browser suite at all — no `e2e` command in the
Checks block, which is why nobody noticed the sixth job.

## Acceptance criteria

Frozen once approved. They change only by coming back through `task-expander`.

1. **`README.md`'s CI claim names every job and states the right number.** The set
   of job names it lists for `ci.yml` is exactly the set of top-level keys under
   `jobs:` in `.github/workflows/ci.yml` — six today, including `e2e` — and no
   sentence in `README.md` states a number of CI jobs other than that set's size.

2. **A test in the repo goes red when `README.md`'s job list and `ci.yml` disagree**,
   in both directions: deleting one job name from `README.md`'s list fails it, and
   adding a seventh job to `ci.yml` without touching `README.md` fails it too.

3. **`README.md` no longer says CI skips the Postgres path.** No sentence in it
   claims that `make -C backend test-postgres` runs only locally, that nothing
   exercises Postgres automatically, or that a Postgres-only regression would not
   fail a pull request. Whatever replaces the bullet is consistent with
   `ci.yml:197-244`.

4. **`README.md`'s Checks section names a way to run every suite CI runs** — the
   frontend, question-bank and backend suites, the Postgres run, the integration
   run, and the browser suite in `e2e/` — and every command it names is a real
   script or `make` target (a key of the relevant `package.json`'s `scripts`, or a
   target in `backend/Makefile`).

5. **`conventions.md` attributes the lockfile-drift check only to the jobs that
   have it.** For every job the CI section says checks its lockfile, that job in
   `ci.yml` contains a step running `git diff --exit-code` against the lockfile it
   installed from. Today that is exactly `frontend`, `question-bank`, `backend`
   and `e2e`; `backend-postgres` and `integration` must not be among those the doc
   claims it for. The section still says all six install from a frozen lockfile,
   which is true of all six.

6. **A test in the repo goes red when that attribution stops matching `ci.yml`**,
   in both directions: deleting the `Lockfile unchanged` step from any of the four
   jobs that have it fails the test, and adding such a step to `backend-postgres`
   without updating `conventions.md` fails it too.

7. **No count of e2e journeys survives in `conventions.md` unless something
   asserts it.** Either the number is gone from the `e2e` comment at
   `conventions.md:66`, or a test in the repo goes red when the number of tests
   under `e2e/tests/` stops matching it. Adding a fourteenth e2e test must not be
   able to make the doc quietly wrong.

8. **The same holds for `README.md`'s Checks block.** No number describing the size
   of a test suite appears there unless a test asserts it — `README.md:183`'s
   "221 tests" and `README.md:185`'s "28 tests" are both wrong today and are
   either removed or made true *and* asserted.

9. **`.github/workflows/ci.yml` is byte-identical to its state at the branch
   point, and no dependency is added anywhere.** `git diff main -- .github/` is
   empty at the end of this task. Adding the two missing `Lockfile unchanged`
   steps is a CI change, not a doc fix — see Out of scope.

10. **The whole existing suite stays green and no test reaches the network.**
    `cd frontend && bun test && bun run typecheck && bun run lint` passes with no
    warnings (the lint gate fails on warnings — T-006), the twelve criterion
    groups already in `frontend/src/conventions-doc.test.ts` still pass, and every
    test added or changed here reads repo files from disk only.

## Out of scope

- **Adding `Lockfile unchanged` steps to `backend-postgres` and `integration`.**
  `tasks.md` offers it as the other way to make `conventions.md:98` true, and it is
  genuinely cheap — but it changes what CI does, and `process.md` ("Work on the
  loop itself never enters the loop") puts workflow changes outside a `T` task's
  reach. The doc is what is wrong here; the guard is a separate, arguable
  improvement. **Reviewer: add it to `tasks.md` at sweep** as a small entry, so the
  option is not lost. Criterion 9 makes the boundary checkable.
- **Rewording `conventions.md:10`** ("serving `/api/v1` and, once built, the
  frontend on the same origin"). Accurate as written; `tasks.md` marks the reword
  optional. It is a review-checklist item below, not a criterion. If it is
  reworded it must stay true and must not reintroduce any string
  `conventions-doc.test.ts:118-131` forbids.
- **Deduplicating `frontend/src/ci-workflow-pins.test.ts` and
  `ci-action-pinning.test.ts`** — that is T-061, and it is the reason this task
  should not casually add a third independent parser of `ci.yml` (see Constraints).
- **`CLAUDE.md` lines 4 and 51**, which still call the backend `api/` and "not
  built yet". Loop-gated: a hand-written `P` ticket, not this.
- **`test-guidelines.md`** — T-047 owns it.
- Any change to `backend/`, `question-bank/`, `e2e/` source, `openapi.yaml`, or
  the plan.

## Constraints

- **Files expected to change:** `README.md`, `conventions.md`, and one or more
  test files under `frontend/src/`. Nothing else, apart from the brief itself.
- **Prefer extending an existing frontend test file** over adding a new one.
  `frontend/src/conventions-doc.test.ts` already reads `ci.yml`, `package.json`
  files and `backend/Makefile` from the repo root and has the helpers criteria 2,
  6 and 7 need. Three files parsing `ci.yml` is already one too many (T-061); a
  fourth is worse. If a new file is genuinely clearer, say in the Handoff how it
  relates to T-061.
- **No new dependency, no new test runner, no new CI job.** The frontend `bun test`
  suite is where repo-level doc assertions live.
- **No network in tests** (`test-guidelines.md`, "No network in tests, ever").
  Everything here is a file read.
- **Assert against the repo, never against the doc.** Expected values come from
  `ci.yml`, `e2e/tests/`, `package.json` and `backend/Makefile` — reading them out
  of `README.md` or `conventions.md` only ratifies whatever the doc happens to
  say. `conventions-doc.test.ts:5-21` states this rule; keep it.
- **Do not weaken `conventions-doc.test.ts` criterion 10** (`:325-336`). It finds
  the doc's job list as the longest run of adjacent backticked tokens in the CI
  section, so a *shorter* backticked list added for the lockfile claim is safe and
  a longer one is not.
- Text a child reads is not involved; both files are for developers.

## Context

Required reading, not background.

- `README.md:181-203` (Checks and the CI claim) and `README.md:224-235` (Known
  issues).
- `conventions.md:6-16` (Layout), `:51-78` (Commands, including the `e2e` comment
  at `:66`), `:93-104` (CI).
- `.github/workflows/ci.yml` — the authority for criteria 1, 2, 5, 6 and 9.
  Job keys at `:17`, `:93`, `:141`, `:197`, `:253`, `:280`; `Lockfile unchanged`
  steps at `:42-45`, `:110-112`, `:163-165`, `:297-299`.
- `frontend/src/conventions-doc.test.ts` — how this repo already asserts a doc
  against the repo, especially `section()`/`codeBlock()` at `:32-55`,
  `workflowJobs()` at `:301-312`, and criterion 10 at `:314-337`.
- `e2e/tests/` — two spec files, the subject of criterion 7.
- `tasks.md` §A, T-058 (the queue entry), T-047 and T-061 (the neighbouring
  cleanups), and its "Foundations" table at `tasks.md:93-103`.
- `PROGRESS.md:394-398` — the standing note that `README.md:202` is wrong; it is
  the reviewer's sweep line when this lands.
- `test-guidelines.md`, "No network in tests, ever".
- `process.md`, "Work on the loop itself never enters the loop" — why criterion 9
  exists.

## Review checklist — for the human on the PR

The criteria above cover every factual claim mechanically. These are the parts
only a person can judge.

- [ ] The corrected sentences read as naturally as the ones they replace — the
      lockfile sentence in particular should not turn into a list of exceptions.
- [ ] Nothing removed took real information with it. Dropping "221 tests" is
      fine; dropping *which* command runs the backend suite is not.
- [ ] `conventions.md:10`'s optional reword: either it was left alone (fine), or
      the new wording is clearer *and* still true of `backend/app/main.py`'s
      static serving.
- [ ] No new claim was introduced that nothing asserts. This task exists because
      of unasserted claims; adding one would be an odd way to finish it.

## Handoff

Written by `worker` before the tester runs.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes
