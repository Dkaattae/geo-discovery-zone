# T-107 — Two frontend tests run prettier's writer, which may resolve to an unpinned global prettier

**Status:** `awaiting approval`
**Next step:** `tester`
**Approved:** orchestrator — 2026-11-12 (re-stamped after the round-4 amendment), unattended run. See `runs/T-107-prettier-writer-guard.md`.
**Test changes:** `pending — 8 rows written below, Decision blank, not yet routed: the brief is blocked first. Once the expander amends criteria 1 and 11, the next tester routes them to the ci-fix (D-20)`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-107
**Branch:** `task/T-107-prettier-writer-guard`
**PR:** #134, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:** resolved by amendment (task-expander, 2026-11-12): criteria 1 and 11 now cover only the writer tests and `--write` starts, matching Out of scope. Original fault, tester: criteria 1 and 11 contradict the brief's Out of scope (the read-only `format:check` tests run the sentinel under a missing prettier, and the brief declines to guard them), so no fix can meet them as written. Criteria 3, 4 and 6 also fail today (the guard is not applied yet; it lives in two pre-existing tests, 8 Test change request rows written).

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB |
| worker | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (same id as the expander: this orchestrated run reports one remote session id for every subagent; the tester should not read a match with this row as proof it shares the worker's context) |
| tester | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated: same id as every subagent; independence rests on a freshly spawned context, not a separate session) |
| task-expander (amendment) | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated, fresh spawn; amended criteria 1 and 11 only) |

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
  that comes first on `PATH`, which records each time it runs **together with
  the arguments it was given** (for example, by appending `ran $*` to a file
  outside `frontend/`) and exits 0 without touching any other file. It stands in
  for an unpinned global prettier.
- **A write start**: a recorded sentinel start whose arguments include `--write`
  or `-w`. A start with `--check` and neither of those is a **check start**.
- **No tracked file changes**: `git status --porcelain -- frontend/` prints
  nothing after the run, counting only tracked paths (`--untracked-files=no`).

## Acceptance criteria

**Not installed.** Criteria 1 to 3 hold with `frontend/node_modules/prettier/`
absent and a sentinel prettier first on `PATH`.

1. Running only the eight writer tests (for example with
   `--test-name-pattern`) executes the sentinel **zero** times. *(Amended
   2026-11-12. Check starts from the other tests in the two files are out of
   scope; see Out of scope, first bullet.)*
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
    `PATH`, leaves no tracked file changed in that copy and records **zero write
    starts** of the sentinel. Check starts are allowed and not counted (Out of
    scope, first bullet). Other tests may fail there (some need installed
    packages). This criterion checks only that nothing is written and the
    sentinel is never started as a writer. *(Amended 2026-11-12.)*
12. With `node_modules` installed, the full suites pass on the branch head:
    frontend `bun test`, `question-bank` `bun test`, `make -C backend test`, and
    frontend `typecheck`, `lint` and `format:check`. A whole-tree pin that went
    red is fixed only through an approved Test change request or CI fix plan row.

**Amendment, 2026-11-12 (task-expander, after the tester's `blocked`
verdict).** As first written, criteria 1 and 11 required the sentinel to run
zero times across the whole of the two files and the whole suite. The read-only
`format:check` tests (format-gate criteria 5, 6 and 10, readme-fences criterion
7) also start it, 11 times, and Out of scope declines to guard them, so no fix
could meet both. Of the tester's two options this takes (a): criterion 1 now
covers only the eight writer tests, the way criterion 4 already did, and
criterion 11 counts only write starts. Out of scope is unchanged. Nothing else
changed: every other criterion, its number, Constraints and Context are as they
were. Needs a fresh approval before the tester resumes.

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

**TL;DR: nothing built. The whole fix lives in the two pre-existing test files, which the worker may not change (D-14).** Both are listed under **Tests made stale** with the exact guard proposed. The tester routes it through a Test change request (or the `ci-fix` plan), then writes the criteria 1-11 tests.

- **Changed:** nothing outside this brief. Only this file (Status, Next step, Sessions row, Handoff, Notes).
- **Dependencies:** none added.
- **Do not mistake these for bugs:** two `question-bank` count pins and the frontend suite were already red before this task. See "Suite state" below.

### Where each criterion lives (once the proposed change lands)

| Criteria | Where |
|---|---|
| 1-6 (missing or wrong-version prettier: the writer is refused, the test fails and names the versions) | The proposed `requirePinnedPrettier()` guard. It is the **first statement** of each of the eight writer tests, before `writeProbe` and before `bun run format`. |
| 7 (sentinel never runs when the pin is installed) | Already true with no change. `bun run` puts `frontend/node_modules/.bin` ahead of `PATH`. I checked this: a sentinel `prettier` first on `PATH` plus `bun run format:check` ran the package's prettier, and the sentinel log stayed empty. The guard's `.bin` check (below) covers the case where the package exists but its `.bin` link does not. |
| 8-10 | The existing test bodies, unchanged below the guard. The `afterEach` probe cleanup in `format-gate` is unchanged. |
| 11-16 | The tester's new test file and the manual Verdict checks. Nothing for the worker to do. |

### Tests made stale

These tests are not stale in the "now asserts the wrong thing" sense. **They are the defect**: each runs the writer without first checking that the pinned prettier is the one that will run. Both are changes to pre-existing tests, so they belong to the tester under D-14 and D-20.

1. **`frontend/src/format-gate.criteria.test.ts`** › `T-075 tester, criterion 7 — the writer and the check cover the same files` › all seven `${probe.path}: after bun run format, bun run format:check exits 0`.
   - **Why:** criteria 1-6 (the writer must be refused before it starts).
   - **Proposal: modify.** Add `requirePinnedPrettier()` (below) to the file and call it as the first line of the test body, before `writeProbe(...)`. Add `existsSync` to the `node:fs` import. Keep the names and the rest of the body as they are.
2. **`frontend/src/readme-fences.criteria.test.ts`** › `T-076 criteria 7-8: prettier 3.9.6 leaves the fenced README alone` › `criterion 8: bun run format leaves frontend/README.md byte-identical`.
   - **Why:** same as above. Today the version check is a separate test (`the installed prettier is 3.9.6`), so the writer still runs when that check fails. The brief's Constraints name this as the defect.
   - **Proposal: modify.** Call the same guard as the first line, before `readFileSync(README)`. Add `existsSync` to the import. Leave `the installed prettier is 3.9.6` and `installedPrettierVersion()` as they are (Out of scope; criterion 15).

Proposed guard, the same in both files (`FRONTEND_ROOT` is already defined in each):

```ts
/** Refuse the writer unless the pinned prettier is what `bun run format` will run (T-107). */
function requirePinnedPrettier(): void {
  const pkg = JSON.parse(readFileSync(join(FRONTEND_ROOT, "package.json"), "utf8")) as {
    devDependencies?: Record<string, string>;
  };
  const pinned = pkg.devDependencies?.["prettier"];
  const manifest = join(FRONTEND_ROOT, "node_modules/prettier/package.json");
  if (!existsSync(manifest)) {
    throw new Error(
      `refusing to run the prettier writer: pinned prettier ${pinned} is required, but node_modules/prettier is missing`,
    );
  }
  const found = (JSON.parse(readFileSync(manifest, "utf8")) as { version: string }).version;
  if (found !== pinned) {
    throw new Error(
      `refusing to run the prettier writer: pinned prettier ${pinned} is required, found ${found} in node_modules/prettier`,
    );
  }
  if (!existsSync(join(FRONTEND_ROOT, "node_modules/.bin/prettier"))) {
    throw new Error(
      `refusing to run the prettier writer: prettier ${found} is installed but node_modules/.bin/prettier is missing, so bun run would fall back to PATH`,
    );
  }
}
```

**Design notes for the tester (judgment calls):**

- **I threw an error instead of using `expect`.** Criteria 3 and 6 need a failure whose output names both versions, and a thrown `Error` with that message does that whatever matcher output Bun prints. **Tester to confirm or overturn.** An `expect(found, message)` would do the same job.
- **I added the `.bin` check, which the brief does not ask for.** Without it, a package that is present but has no `.bin` link would pass the version check, and `bun run` would still fall back to the global prettier. **Tester to keep or drop**, since criterion 7 is the one it protects.
- **Keep the writer as `bun run format`. Do not call `node_modules/prettier/bin/prettier.cjs` directly.** Criterion 9 says the tests "still run the writer", and the script is the thing under test. **Tester to decide.**
- **The two files repeat the guard.** A shared non-test module would avoid that, but the brief's "Files expected to change" lists only the two files and the tester's new file. **Tester to decide, or leave the shared helper to the reviewer.**

**Whole-tree pins** (P-17) that will go red once the two files change are in the brief's Constraints. They are Test change request rows, not worker work.

### Suite state on the branch head (`3ba7069`), before any change

Run in the web sandbox, where `frontend/node_modules` exists but is incomplete.

- **frontend `bun test`:** 420 pass, 4 fail, 4 errors. Every failure is `Cannot find package 'react-simple-maps'` (from `UsMap.tsx`, `t051-map-click.test.tsx` and `t051-tester.criteria.test.tsx`). The package is in the lockfile but not installed. `bun install --frozen-lockfile` failed with `ProxyConnectFailed (403) downloading tarball d3-ease@2.0.0`, so this is the environment, not the branch. `node_modules/prettier` is 3.9.6, so the eight writer tests passed.
- **frontend `typecheck`:** exit 2, for the same missing `react-simple-maps` / `us-atlas` types. **`lint`:** exit 0. **`format:check`:** clean.
- **`question-bank` `bun test`:** 2721 pass, 2 fail. Both are tracked-file count pins, off by +2 because the expander and orchestrator added this brief and `runs/T-107-prettier-writer-guard.md`:
  - `farm-animal-loose-ends-verify.test.ts` › `T-096 criteria 17-21: the bank and the boundaries` › `criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added`: expected 281, got 283.
  - `climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › `every tracked non-test file outside the allowed list is 12d242e's, and none is added`: expected 284, got 286.
  - These are not caused by any worker change. They are P-17 whole-tree pins, for the tester's Test change request rows (or they may resolve as other branches merge).
- **`make -C backend test`:** 1221 passed, 9 skipped.
- **Working tree:** clean after all runs (`git status --porcelain` empty).

### How to run

- `cd frontend && bun test src/format-gate.criteria.test.ts src/readme-fences.criteria.test.ts`
- Sentinel I used: `printf '#!/bin/sh\necho ran >> $DIR/log\nexit 0\n' > $DIR/prettier && chmod +x $DIR/prettier`, then `PATH=$DIR:$PATH`, with `$DIR` outside the repo.

## Test change request

Written by the tester, orchestrated run. **Decision is blank on every row: nobody has approved anything.** These rows are not routed yet because the verdict is `blocked` (criteria 1 and 11, see Verdict). After the expander amends the brief, the next tester re-checks these rows on the then-current branch and routes them to the `ci-fix` (D-20). **`origin/main` has moved to `8092372` (T-106 merged) and re-pinned several of the same constants (rows 3-8)**, so the branch must merge `origin/main` before any digest or count below is recomputed.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `frontend/src/format-gate.criteria.test.ts` › "T-075 tester, criterion 7 — the writer and the check cover the same files" › all seven "`${probe.path}`: after bun run format, bun run format:check exits 0" | T-075 tester, merged in `2bab8a5` (PR #74): the writer and the checker cover the same files | Criteria 1-6: the writer must be refused before it starts unless the pinned prettier is installed. Today it runs whatever `prettier` `bun run` finds | modify | Same seven names. First statement of each body is a guard that reads `devDependencies.prettier` from `frontend/package.json` and throws (a) if `node_modules/prettier/package.json` is missing, with a message naming the pinned version and the word "missing" after `node_modules/prettier`, (b) if its `version` differs, naming both versions, (c) if `node_modules/.bin/prettier` is missing (worker's extra check, optional). Rest of the body unchanged: `writeProbe`, `bun run format` exits 0, `bun run format:check` exits 0. The worker's Handoff has the exact code. **Must be prettier-formatted**, or `bun run format` in criterion 10's run rewrites it (observed, below) | |
| 2 | `frontend/src/readme-fences.criteria.test.ts` › "T-076 criteria 7-8: prettier 3.9.6 leaves the fenced README alone" › "criterion 8: bun run format leaves frontend/README.md byte-identical" | `34b97f7`, T-076 tester: the writer leaves the fenced README byte-identical | Same as row 1. The version check is a separate test, so the writer still runs when it fails (Constraints call this the defect) | modify | Same name. The same guard as row 1 as the first statement, before `readFileSync(README)`. Rest unchanged. `existsSync` added to the import. "the installed prettier is 3.9.6" and `installedPrettierVersion()` left as they are | |
| 3 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` › "criterion 21: every tracked file under frontend/ is byte-identical to main's" (`MAIN_FRONTEND_SHA`) | `e9d666e`, T-088 tester: nothing under `frontend/` changes | This task adds `frontend/src/prettier-writer-guard.criteria.test.ts` and modifies the two files in rows 1-2 | modify | Same name and assertion; `MAIN_FRONTEND_SHA` recomputed on the final frontend tree, with a comment citing T-107 and this row | |
| 4 | `question-bank/src/map-click-no-candidates-verify.test.ts` › "T-092 criterion 16: no other surface changes" › "frontend (except []) is byte-identical to 5d72ca5" | `cf63f66`, T-092 tester: frontend unchanged | Same as row 3 | modify | Same name; the `frontend` row's digest recomputed, with a "Re-pinned by T-107 (row 4)" comment beside T-047's and T-076's | |
| 5 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` › "T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes" › "every tracked file under the three trees is as re-pinned by T-039, none added or removed" (`MAIN_BOUNDARY_SHA`) | `bcb2a38`, T-039 tester (applied request): the three trees unchanged | Same as row 3 | modify | Same name and assertion; `MAIN_BOUNDARY_SHA` recomputed, comment citing T-107 | |
| 6 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "pre-existing test files are main's, except ones in an approved Test change request" (`MAIN_TESTS_COUNT`, `MAIN_TESTS_SHA`) | `950f334`, T-091 tester: no pre-existing test file changes unseen | One test file added (count +1) and two test files modified (digest) by this task | modify | Same name and assertion; `MAIN_TESTS_COUNT` up by exactly 1 and `MAIN_TESTS_SHA` recomputed, comment citing T-107 | |
| 7 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21: the bank and the boundaries" › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096 tester: no stray non-test file | This task's brief and run log (`tasks/T-107-…`, `runs/T-107-…`) are tracked non-test files. Red on the branch head before any code change (worker's Handoff: 283 vs 281). T-106 re-pinned this test on main, so recheck after merging main | modify | Same name; count and `MAIN_UNTOUCHABLE_SHA` recomputed after merging main, or the two T-107 files joined to `CRITERION_21_ALLOWED` the way T-106 did. Comment citing T-107 | |
| 8 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091 tester: no stray non-test file | Same as row 7 (286 vs 284) | modify | Same as row 7, for `MAIN_UNTOUCHABLE_COUNT` / `MAIN_UNTOUCHABLE_SHA` / `CRITERION_22_ALLOWED` | |

## Verdict

**TL;DR: `blocked`, back to the `task-expander`.** Criteria 1 and 11 cannot be met as written: they require the sentinel to run zero times across the whole of the two files (and the whole suite), but the read-only `format:check` tests also start it, 11 times, and Out of scope says this task does not guard them. Separately, criteria 3, 4 and 6 fail today because the guard has not been applied (it lives in two pre-existing tests; 8 Test change request rows written, Decision blank).

- **Independence:** orchestrated run. My session id matches the worker's row, which under the orchestrator is not evidence of anything. My independence rests only on being a freshly spawned agent that did not see the work; that is weaker than a separate session, because it depends on the orchestrator having spawned me correctly.
- **Needed from the expander:** decide criteria 1 and 11. Either (a) restrict them to the writer tests, as criterion 4 already is ("for any of the writer tests"), or to `--write` starts; or (b) bring the `format:check` tests into scope and drop that Out-of-scope bullet. Then the next tester updates `prettier-writer-guard.criteria.test.ts` (this task's own file) to the amended wording and routes rows 1-8 to the `ci-fix`.

### The contradiction, observed

In a repo copy with no `node_modules` and a sentinel `prettier` first on `PATH`, with the worker's proposed guard **temporarily** applied to both files (reverted, see below), the sentinel log read `11 ran --check .` and nothing else. Those 11 are format-gate criteria 5 (1), 6 (7), 10 (2) and readme-fences criterion 7 (1), all named by Out of scope ("Under a global prettier they check with the wrong version, but they write nothing. Guarding them is a different question, which this task does not settle"). No change confined to the eight writer tests can make criterion 1 or 11 hold.

### Criteria

Tests are in `frontend/src/prettier-writer-guard.criteria.test.ts` (14 tests). Each scenario runs the real test files inside a temp copy of the repo's tracked files, with a sentinel first on `PATH`, statuses read from a JUnit report, file changes measured by hashing every tracked `frontend/` file before and after.

| # | Verdict on the branch head | With the proposed guard (temporary trial) | Evidence |
|---|---|---|---|
| 1 | **blocked** (and red) | red: sentinel ran 11 times (all `--check`) | `criterion 1: running the two files executes the sentinel zero times`: today 26 runs |
| 2 | met | met | `criterion 2: no tracked file under frontend/ changes` |
| 3 | **fail** | met | today all 8 writer tests **pass** under the sentinel, expected **fail**; with guard, all 8 fail naming `3.9.6` and "node_modules/prettier is missing" |
| 4 | **fail** | met | writer tests only (`--test-name-pattern`): today the fake 3.8.1 package ran 15 times, expected 0; with guard 0 and sentinel 0 |
| 5 | met | met | `criterion 5` |
| 6 | **fail** | met | today all 8 pass, expected fail; with guard all 8 fail naming `3.9.6` and `3.8.1` |
| 7 | met | met | sentinel 0 with the pinned package copied in |
| 8 | met | met | all 8 writer tests pass in the pinned copy; also 47/47 in the real tree |
| 9 | met | met | two committed mutation tests in a copy: `format` script made a no-op (`true`) turns all 7 format-gate criterion 7 tests red; a README heading changed to `#   …` turns readme-fences criterion 8 red |
| 10 | met | met only once the guard is prettier-formatted | an unformatted trial guard was rewritten by `bun run format` in the copy (`changedFiles` listed both files): the test catches it. Formatted, it passes |
| 11 | **blocked** (and red) | red: same `--check` starts | today the whole suite in a no-`node_modules` copy ran the sentinel; no tracked file changed |
| 12 | not met | n/a | see Suites. Frontend has 4 environment failures (`react-simple-maps` not installed, proxy 403); question-bank pins in rows 3-8. CI is the authority |
| 13 | met for this task's test file | n/a | it only reads the real `node_modules/prettier` (as a copy source) and `package.json`; writes go under `os.tmpdir()`, removed in `afterAll`. Rows 1-2 change only test bodies |
| 14 | met | n/a | `git diff --quiet origin/main HEAD -- frontend/package.json frontend/bun.lock frontend/.prettierrc frontend/.prettierignore .github/workflows/ci.yml question-bank/package.json question-bank/bun.lock`: identical. No dependency added |
| 15 | met (nothing changed yet) | n/a | `git diff --quiet origin/main HEAD --` on the two files: identical. Recheck after rows 1-2 are applied |
| 16 | met | n/a | no fetch or URL in the new file; every child `bun test` runs with all six proxy variables set to `http://127.0.0.1:1` |

### Mutations (all reverted; the two files are byte-identical to HEAD, `git status` clean apart from my commit)

- **Trial guard applied to both files:** my tests went from 7 red to 3 red (1, 4-before-narrowing, 11), then to 2 red (1, 11) once criterion 4's test was narrowed to the writer tests, as its wording says.
- **Guard's version check disabled** (`if (false && found !== pinned)`): criteria 4, 6 and 6 went red.
- **Guard's missing-package check disabled:** criteria 1 and 3 (message test) went red.
- **Criterion 9's two mutations** are committed tests and pass (each sees its writer test go red).

### Suites (branch head plus my test file, web sandbox)

- **frontend `bun test`:** 427 pass, 11 fail, 4 errors. 7 fails are mine (1, 3×2, 4, 6×2, 11: the unfixed defect and the blocked criteria). 4 fails and 4 errors are `Cannot find package 'react-simple-maps'`, environmental, pre-existing.
- **frontend `lint`:** exit 0. **`format:check`:** clean. **`typecheck`:** 9 errors, all `react-simple-maps` / `us-atlas` (environmental, pre-existing); none in the new file.
- **question-bank `bun test`:** 2717 pass, 6 fail, all whole-tree pins: rows 3-6 (red from my new test file) and rows 7-8 (red before this task's code, from the brief and run log).
- **`make -C backend test`:** 1221 passed, 9 skipped.


## Notes

- **Worker, survey:** the brief predicted this outcome, and it held. Nothing in production code or `package.json` is in scope (criterion 14 forbids it), so the whole fix is the guard in two pre-existing tests.
- **Worker, surprise:** this sandbox's `frontend/node_modules` is missing `react-simple-maps`, and the proxy refuses the install. A whole-suite pass for criterion 12 needs a full install, which means CI or a sandbox that can reach the registry. **Tester to note this in the Verdict. CI is the authority for criterion 12.**
- **Worker, surprise:** the two `question-bank` count pins were already red on the branch head, from this task's own brief and run log. Owner: the tester, as P-17 Test change request rows alongside the pins the brief lists.
- **Expander, amendment (2026-11-12):** `Approved:` reset to `pending`. The earlier orchestrator stamp covered the old wording of criteria 1 and 11. Next step is the `tester`, not the worker: the worker's Handoff already says there is nothing to build outside the two pre-existing files, and the amendment does not change that. The next tester (a) updates this task's own `frontend/src/prettier-writer-guard.criteria.test.ts` to the amended criteria 1 and 11 (the sentinel must log its arguments; see Definitions), and (b) re-checks Test change request rows 1-8 after merging `origin/main` (T-106 merged as `8092372` and re-pinned some of the same constants), then routes them to the `ci-fix` (D-20).
