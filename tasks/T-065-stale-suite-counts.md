# T-065 — Delete the stale suite-size counts, and stop them coming back

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**From:** [`tasks.md`](../tasks.md) T-065
**Branch:** `claude/gifted-albattani-0vh9mr` — the branch this session was
assigned. Every later role pushes here, not to `task/T-065-*`
(`CLAUDE.md` "Branches", `process.md` "When the environment names the branch for
you").
**PR:** #57, opened draft at expand time from the branch above.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-22 | cse_01KkjXcoL82TkpiL7GbimiCh |

## Goal

Three documents currently state how many tests this repo has, and two of those
figures are wrong in the tree right now — `PROGRESS.md` says 687 against a real
1131, `test-guidelines.md` says 19 and 65. The same two numbers have been
hand-corrected five times and abandoned the sixth, and `tasks.md`'s frontend
figure has been wrong eight times. Delete the figures rather than refresh them
a ninth time, and put a guard behind the deletion so the next task cannot
reintroduce one.

## Already true before this task starts

Surveyed 2026-09-22; none of this is work for the worker.

- **`README.md` is already done** — T-062 (PR #50) removed its last count and
  `frontend/src/conventions-doc.test.ts:569-605` plus
  `frontend/src/readme-test-count.criteria.test.ts` hold it there with two
  independently written detectors. That pair is the shape to copy, and criterion
  10 says to keep both rather than fold them together.
- **`conventions.md` states no count of tests**, and its e2e journey count is
  already guarded (`conventions-doc.test.ts`, "no unstated e2e journey count").
- **A repo-level doc test already runs inside `frontend`'s `bun test`** reading
  files from the repo root. No new runner, no new package and no new dependency
  is needed to add or extend one.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

Line numbers below are as of the branch point; the quoted text is the reliable
locator once the file moves.

### The stale figures go

1. `test-guidelines.md` states no number of tests for any suite or package.
   Specifically, `:209`'s `# 19 tests today` and `:210`'s `# 65 tests today` are
   gone, and the fenced block still names both `cd question-bank && bun test`
   and `cd frontend && bun test`.

2. `PROGRESS.md`, everywhere **above** the `## Completed tasks` heading (`:260`
   today), states no number of tests for any suite, package or directory. Gone
   at minimum: `:56` "the same 221 tests", `:65-66` "221 unit and endpoint tests
   … plus 30 integration tests and 13 browser tests", `:94` "80 tests — 19 over
   the API client, 61 over level→grade/band display", `:173-177` "687 tests (19
   pre-existing, 190 added by T-010 …)", `:250` "30 black-box tests", `:255`
   "13 Playwright tests".

3. `PROGRESS.md:57`'s "with 9 Postgres-only checks that skip on SQLite" either
   states no number at all, or states a number equal to the count of test
   functions in `backend/tests/test_postgres.py`. ("Checks" rather than "tests"
   is a wording difference, not a different claim — this is the same sentence
   T-062 deleted from `README.md`.)

4. Nothing is deleted wholesale to satisfy criteria 2 and 3: after the change,
   `PROGRESS.md` still names `backend/integration/` as where the integration
   tests live, still names `e2e/` as where the browser tests live, still says the
   backend suite runs against both SQLite and Postgres, and still says the
   frontend suite covers the API client and level→grade/band display. Only the
   numbers go.

5. The table under `## A. Foundations` in `tasks.md` states no number of tests:
   its `Unit and endpoint tests`, `Integration tests` and `End-to-end tests`
   rows carry none of `242`, `184`, `687`, `30` or `13`, and each still names
   where that suite lives or how to run it.

### The guard

6. With `test-guidelines.md` edited to add a line stating a suite's test count —
   for example restoring `cd frontend      && bun test    # 223 tests today` —
   at least one test in `frontend/`'s `bun test` fails. With that edit reverted,
   the suite is green.

7. With `PROGRESS.md` edited to add a sentence stating a suite's test count
   **above** the `## Completed tasks` heading, at least one test in `frontend/`'s
   `bun test` fails — and it fails whether the number is written in digits
   ("9 tests") or in words ("nine tests"). With the edit reverted, the suite is
   green.

8. The same sentence added **below** the `## Completed tasks` heading leaves the
   suite green, and the per-task figures already under that heading are
   untouched by this task and fail nothing — T-001's "19 tests", T-010's "190
   tests were added (19 → 209)" and T-014's "200 tests" are all still there and
   still say those numbers. They are historical facts about a PR, not claims
   about the current suite.

9. The guard distinguishes "a test" from "how many tests exist": all three
   pieces of advice in `test-guidelines.md` that mention a test without claiming
   a suite size survive in some wording, with the suite green — `:162` ("Every
   criterion gets at least one test"), `:183` ("Each should turn exactly one
   test red") and `:200` ("One test, twelve assertions"). Rewording them is
   allowed; losing the advice is not.

10. No test in the repo asserts a total count of tests for any package, and the
    two existing README detectors — `testCountPattern` in
    `conventions-doc.test.ts` and `testCountClaims()` in
    `readme-test-count.criteria.test.ts` — are still two independent
    implementations rather than one shared helper. The route this task takes is
    deleting the figures, not pinning them.

11. `conventions-doc.test.ts:587-589`'s claim is true after this task:
    narrowing the README guard's scan from the whole file back to only the
    Checks code block turns at least one test in `frontend/`'s suite red. Either
    the comment is corrected to describe what the tests actually bind, or the
    scope-level test it describes now exists.

### Nothing else moves

12. `bun test`, `bun run typecheck` and `bun run lint` all pass in `frontend/`,
    and `bun test` and `bun run typecheck` pass in `question-bank/`.

13. No new dependency is added, no `bun.lock` or `uv.lock` changes, and no test
    added or changed by this task reaches the network.

## Out of scope

- **`README.md`** — T-062 already did it (criterion 10 keeps its guard intact).
- **`conventions.md`** — states no count of tests today.
- **The rest of T-047's corrections to `test-guidelines.md`** — the `api/`
  "does not exist yet" marker, the `api/` → `backend/` naming, and the missing
  `uv sync` in the dead-proxy reproduction block. Note for the reviewer: taking
  `:210`'s figure out closes the "frontend line either carries a true number or
  no number" half of T-047's done-when, so trim that clause at the sweep.
- **`backend/README.md`, `backend/integration/README.md` and `e2e/README.md`** —
  found stale by this survey (they say 221, 28 and 13) and filed as **T-074**
  rather than folded in here. Do not touch them; their prose also contains
  "one test" advice that a naive whole-file guard would fire on, which is a
  design problem worth its own task.
- **Historical counts** — everything below `PROGRESS.md`'s `## Completed tasks`
  heading, the `runs/` logs, `engineering-decisions.md`, `process-decisions.md`
  and `process.md`. They describe what a PR did, which does not rot.
- **A guard over the whole of `tasks.md`.** The queue legitimately quotes
  historical counts in entry prose (§G's T-052 and T-054 entries, and T-065's own
  entry, which the reviewer deletes at the sweep). Criterion 5 is a one-time
  removal from one table, not a scan of the file.
- **Deleting or rewriting the T-065 entry in `tasks.md`** — that is the
  reviewer's sweep, in this same PR, after the tester has passed.
- **Counts of things that are not tests** — "26 questions", "15 states", "six
  jobs on every PR", "the four unit test steps". This task is about counts of
  tests only.
- **Loop-gated files** — `process.md`, `process-decisions.md`, `CLAUDE.md`,
  `.claude/`. They quote "19 tests" historically and are not this task's to edit.

## Constraints

- **Files expected to change:** `test-guidelines.md`, `PROGRESS.md`, `tasks.md`
  (the §A table only), and `frontend/src/conventions-doc.test.ts` and/or a new
  `frontend/src/*.test.ts`. Nothing under `backend/`, `question-bank/`, `e2e/`
  or `.github/`.
- **Invariants:** the guard runs inside `frontend/`'s existing `bun test` and
  reads local files only — no network (`test-guidelines.md`, "No network in
  tests, ever"), no new runner, no new CI job.
- **Dependencies:** none without asking (see [`CLAUDE.md`](../CLAUDE.md)).
- **Do not run a suite in order to write a number into a doc.** If a figure feels
  necessary, the answer is that the figure is what this task exists to delete.
- The `Approved:` line must be filled in before the worker starts.

## Context

**Required reading for the worker and the tester.**

- **The queue entry:** [`tasks.md`](../tasks.md) T-065, including its two
  amendments (2026-09-19 by T-061's reviewer, 2026-09-22 by T-073's reviewer).
  It is where the "delete, don't refresh" decision was settled.
- **The precedent to copy:** `frontend/src/conventions-doc.test.ts:569-605`
  (`testCountPattern` and its non-vacuity test) and
  `frontend/src/readme-test-count.criteria.test.ts:1-30, 124-145`
  (`testCountClaims()`, the independent tokeniser, and the "route taken" test
  that records deletion rather than pinning). T-062, PR #50.
- **The files under test:** `test-guidelines.md:207-211`, `PROGRESS.md:40-259`
  (the `## Done` sections) and `:260` (where history starts),
  `tasks.md:109-120` (the §A table).
- **Why the boundary at `## Completed tasks` matters:** `PROGRESS.md` below that
  heading is a per-PR log; a whole-file guard would demand deleting the record of
  what every past task did.
- **How guards like this are written here:**
  [`test-guidelines.md`](../test-guidelines.md) — derive expected values from
  the criterion, not from the code; assert the detector is not vacuous.
- **`conventions.md`** — the command table, for what each package's checks are.

## Review checklist — for the parts no test can settle

The criteria above are testable. These three comment corrections are not, and a
human (or the reviewer) reads them:

- [ ] `conventions-doc.test.ts`'s header comment no longer states an ordinal or
      count of `ci.yml` parsers that is wrong. Four tracked files under
      `frontend/src/` reference `ci.yml` today — `ci-action-pinning.test.ts`,
      `conventions-doc.test.ts`, `lint-gate.test.ts` and
      `git-baseline-guard.criteria.test.ts` — so "a third parser, not a fourth"
      says nothing useful. Either name the files or make no count claim.
- [ ] `PROGRESS.md` still reads as a coherent status document with the figures
      out, rather than as sentences with holes in them.
- [ ] Whatever replaced each figure cannot rot: a command, a directory, or
      nothing — not a number in a different shape ("roughly a thousand tests").

## Handoff

_Written by `worker` before the tester runs._

## Verdict

_Written by `tester`._

## Review

_Written by `reviewer`, only when it sends the PR back._

## Notes
