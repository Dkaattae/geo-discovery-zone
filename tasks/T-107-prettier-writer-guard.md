# T-107 — Two frontend tests run prettier's writer, which may resolve to an unpinned global prettier

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-107
**Branch:** `task/T-107-prettier-writer-guard`
**PR:** #134, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB |

**Read this before approving.** The fix changes two test files that already
exist on `main`, and only the tester may change those, through a Test change
request (D-14, D-20). So the worker most likely has nothing to implement. It
lists both files under **Tests made stale** with the change it proposes, and
the tester routes them. Expect the usual whole-tree pins to go red too (P-17;
see Constraints). Plan to attend the tester step, or expect the change to go
through the `ci-fix` plan.

## Goal

`bun run format` rewrites every file in `frontend/`. Two tests run it, and when
`frontend/node_modules` is missing that command picks up whatever `prettier` is
on `PATH` (in the web sandbox, a global 3.8.1 at `/opt/node22/bin/prettier`), not
the pinned 3.9.6. That version rewrote tracked files at least five times
(T-076's `2 \* gradeOf`, T-021, T-024). A test suite must not be able to reformat
the repo it is checking.

## Definitions

- **The two writer tests**: every test in
  `frontend/src/format-gate.criteria.test.ts` › "T-075 tester, criterion 7 — the
  writer and the check cover the same files" (seven tests, one per probe), and
  `frontend/src/readme-fences.criteria.test.ts` › "T-076 criteria 7-8: prettier
  3.9.6 leaves the fenced README alone" › "criterion 8: bun run format leaves
  frontend/README.md byte-identical".
- **The two files**: `frontend/src/format-gate.criteria.test.ts` and
  `frontend/src/readme-fences.criteria.test.ts`.
- **The pinned version**: the string at `devDependencies.prettier` in
  `frontend/package.json` (today `3.9.6`).
- **Pinned prettier installed**: `frontend/node_modules/prettier/package.json`
  exists and its `version` equals the pinned version.
- **A sentinel prettier**: an executable named `prettier`, placed in a directory
  that comes first on `PATH`, which records each time it runs (for example, by
  appending a line to a file outside `frontend/`) and exits 0 without touching
  any other file. It stands in for an unpinned global prettier.
- **No tracked file changes**: `git status --porcelain -- frontend/` prints
  nothing after the run, counting only tracked paths (`--untracked-files=no`).

## Acceptance criteria

**Not installed.** Criteria 1 to 3 hold with `frontend/node_modules/prettier/`
absent and a sentinel prettier first on `PATH`.

1. Running the two files executes the sentinel **zero** times.
2. Running the two files leaves no tracked file changed under `frontend/`.
3. Each of the two writer tests (all eight) is reported **failed**, not passed
   and not skipped. Its failure output names the pinned version and says what it
   found instead (here, that `node_modules/prettier` is missing).

**Wrong version installed.** Criteria 4 to 6 hold with
`frontend/node_modules/prettier/package.json` present but its `version` set to
something other than the pinned version (for example `3.8.1`), and a sentinel
prettier first on `PATH`.

4. Running the two files executes no prettier at all, neither the sentinel nor
   the package at `node_modules/prettier`, for any of the writer tests. The
   writer is refused before it starts.
5. Running the two files leaves no tracked file changed under `frontend/`.
6. Each of the eight writer tests is reported **failed**, and its output names
   both the pinned version and the version it found.

**Pinned version installed.** Criteria 7 to 10 hold with the pinned prettier
installed (the normal CI state).

7. With a sentinel prettier first on `PATH`, running the two files executes the
   sentinel zero times. The writer that runs is the package's own.
8. All eight writer tests pass on the branch head.
9. The writer tests still check what they checked before. Each `format-gate`
   criterion 7 test still runs the writer over its probe, and the probe is
   formatted afterwards. The `readme-fences` criterion 8 test still fails when a
   line of `frontend/README.md` is changed so that the pinned prettier rewrites
   it. The tester shows this with a mutation and records it in the Verdict.
10. Running the two files leaves no tracked file changed under `frontend/`, and
    every probe file the tests wrote is gone.

**Whole suite.**

11. A frontend `bun test` (the whole suite, not just the two files), run in a
    copy of `frontend/` with no `node_modules` and a sentinel prettier first on
    `PATH`, leaves no tracked file changed in that copy and executes the sentinel
    zero times. Other tests may fail there (some need installed packages). This
    criterion checks only that nothing is written and the sentinel never runs.
12. With `node_modules` installed, the full suites pass on the branch head:
    frontend `bun test`, `question-bank` `bun test`, `make -C backend test`, and
    frontend `typecheck`, `lint` and `format:check`. A whole-tree pin that went
    red is fixed only through an approved Test change request or CI fix plan row.

**What must not change.**

13. No test added or changed by this task deletes, moves or writes into the real
    `frontend/node_modules`, or edits the real `frontend/package.json`. A test
    that needs a missing or wrong-version prettier builds it in a temporary copy
    or directory outside the tracked tree, and removes that afterwards.
14. `frontend/package.json` (including its `format` and `format:check`
    scripts), `frontend/bun.lock`, `frontend/.prettierrc`,
    `frontend/.prettierignore` and `.github/workflows/ci.yml` are byte-identical
    to `main`. No dependency is added in any package. Checked by hand, using a
    diff against `main` that is recorded in the Verdict, not as a committed test
    (P-17).
15. No test in the two files is deleted. Every test other than the eight writer
    tests keeps its name and its assertions. Checked by hand against `main`'s
    copies and recorded in the Verdict.
16. No test reaches the network.

## Out of scope

- **The read-only `format:check` tests.** These are `format-gate` criteria 5, 6
  and 10, and `readme-fences` criterion 7. Under a global prettier they check
  with the wrong version, but they write nothing. Guarding them is a different
  question, which this task does not settle.
- **The `format` and `format:check` scripts themselves.** A person who runs
  `bun run format` without installing first still gets the global prettier
  (T-021, T-024). Fixing that changes the package's commands and docs, so it is
  a separate task, and a reviewer may queue it.
- **`question-bank/`.** Its `format` script is never spawned by a test (its
  `prettier-gate.test.ts` imports prettier and only runs the checker), so it
  does not have this hazard.
- `readme-fences`' test that pins the literal `3.9.6` ("the installed prettier
  is 3.9.6"). It is left as it is.
- Any prettier version bump, and any change to how CI installs packages.
- T-106's files (`README.md`, `PROGRESS.md`, `conventions.md`), which are in
  flight on PR #133.

## Constraints

- **Files expected to change:** `frontend/src/format-gate.criteria.test.ts` and
  `frontend/src/readme-fences.criteria.test.ts` (pre-existing, so only through an
  approved Test change request or CI fix plan row), plus whatever test file the
  tester adds for criteria 1 to 11, and the whole-tree pins that go red because
  of those changes.
- **Whole-tree pins expected to go red** (P-17). These are a survey, not a
  complete list. The `question-bank` verify tests hash every tracked file under
  `frontend/` or count test files:
  - `agriculture-true-wrong-answers-verify.test.ts` `MAIN_FRONTEND_SHA`
  - `climate-cold-trade-accepted-verify.test.ts` `MAIN_TESTS_SHA` and
    `MAIN_TESTS_COUNT`
  - the T-076 re-pin sites in `map-click-no-candidates-verify.test.ts` (around
    line 744) and `refresh-regenerate-reminder-verify.test.ts` (around line 95)

  Each one is a Test change request row. T-106 (PR #133) may re-pin some of the
  same constants, so whichever PR merges second rebases and recomputes.
- **The worker changes no existing test** (D-14). If there is nothing else to
  build, the Handoff says so and lists both files under **Tests made stale**,
  with the exact change proposed for each.
- **The guard must come before the writer, in the same test.** Today
  `readme-fences` checks the version in a separate test, so the writer runs even
  when that check fails. That is the defect, and criteria 4 to 6 are written
  against it.
- Dependencies: none (see [`CLAUDE.md`](../CLAUDE.md), "Packages").
- No test may resolve a fixed git revision (T-073,
  `frontend/src/git-baseline-guard.criteria.test.ts`). The "same as `main`"
  checks in criteria 14 and 15 are manual and recorded in the Verdict.

## Context

- `frontend/src/format-gate.criteria.test.ts`: `run()` at lines 52–65, `PROBES`
  at lines 83–91, and the criterion 7 block at lines 172–186.
- `frontend/src/readme-fences.criteria.test.ts`: `runScript()` at lines 252–267,
  `installedPrettierVersion()` at lines 270–275, and the criteria 7–8 block at
  lines 277–299.
- `frontend/package.json`: the `format` / `format:check` scripts and
  `devDependencies.prettier`.
- [`runs/T-076-frontend-readme-fences.md`](../runs/T-076-frontend-readme-fences.md),
  lines 89 and 219, for the reproduction and the finding.
- [`engineering-decisions.md`](../engineering-decisions.md) E-17, on why
  frontend pins prettier exactly.
- [`test-guidelines.md`](../test-guidelines.md), on no network and on not
  touching real state.
- [`process-decisions.md`](../process-decisions.md) D-14, D-15 and D-20, which
  govern changes to existing tests. [`process-tasks.md`](../process-tasks.md)
  P-17 covers whole-tree pins.

**Already true, so nothing to build:** no other test in `frontend/src`,
`question-bank/src` or `backend/tests` spawns a prettier writer. The survey
grepped for `"format"`, `prettier --write` and `bun run format`, and found only
the two files. `lint-gate.test.ts` runs `bun run lint`, which does not write.

## Handoff

## Verdict

## Notes
