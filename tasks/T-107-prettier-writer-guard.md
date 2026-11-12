# T-107 — Two frontend tests run prettier's writer, which may resolve to an unpinned global prettier

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** orchestrator — 2026-11-12 (re-stamped after the round-4 amendment), unattended run. See `runs/T-107-prettier-writer-guard.md`.
**Test changes:** `applied through CI fix plan (D-20)` (round 3's 5 rows through CI fix plan 2; round 1's 9 rows through CI fix plan 1)
**CI fix:** `applied — approved — the user, 2026-11-12, given in the orchestrator's session` (round 2: plan 2, 5 rows, below). Round 1 was `applied — approved — the user, 2026-11-12, given in the orchestrator's session (in advance of the plan's push)`
**From:** [`tasks.md`](../tasks.md) T-107
**Branch:** `task/T-107-prettier-writer-guard`
**PR:** #134, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:** none

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB |
| worker | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (same id as the expander: this orchestrated run reports one remote session id for every subagent; the tester should not read a match with this row as proof it shares the worker's context) |
| tester | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated: same id as every subagent; independence rests on a freshly spawned context, not a separate session) |
| task-expander (amendment) | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated, fresh spawn; amended criteria 1 and 11 only) |
| tester (round 2) | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated, fresh spawn; same id as every subagent) |
| ci-fix | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated, fresh spawn; same id as every subagent, pass 1 — plan) |
| ci-fix (pass 2) | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated, fresh spawn; same id as every subagent, pass 2 — apply) |
| tester (round 3) | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated, fresh spawn; same id as every subagent) |
| ci-fix (round 2, pass 1) | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated, fresh spawn; same id as every subagent, pass 1 — plan 2) |
| ci-fix (round 2, pass 2) | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated, fresh spawn; same id as every subagent, pass 2 — apply plan 2) |
| tester (round 4) | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated, fresh spawn; same id as every subagent) |

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

### Round 3 (tester, after CI on `11ece2c`): routed to the `ci-fix` (D-20), Decision blank

**Why these rows exist.** CI's frontend job on `11ece2c` was red in this task's own `prettier-writer-guard.criteria.test.ts` (criteria 3 and 6, the "each failure names …" tests). The guard was fine. The fault was in that file's output parser, which the tester owns. CI runs Bun 1.3.11 under GitHub Actions. There Bun's JUnit `<failure>` has no message, and Bun repeats every `(fail)` line in an end-of-run summary with nothing before it. The parser used `Map.set`, so the empty summary repeat replaced the real error text. The round-3 tester fixed the parser in its own file: output per name is now appended, never replaced. That changes one file under `frontend/`, so the four digest pins that round 1 re-pinned move again. Same cause as round 1's rows 3-6 and 9, same mechanism, new values. **Apply in order: 1-4, then 5.** The values below are each test's `Received` on the round-3 tester's commit. Recompute if anything else lands first.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` › "T-088 criteria 20-25: what must not change" › "criterion 21: every tracked file under frontend/ is byte-identical to main's" (`MAIN_FRONTEND_SHA`) | `e9d666e`, T-088 tester: nothing under `frontend/` changes. Last re-pinned by T-107 CI fix plan row 3 | The round-3 tester changed `frontend/src/prettier-writer-guard.criteria.test.ts` (this task's own file). Expected `6d99c370…`, received `ab8f396ed9953910d849ba7526b09a08d66781bcb068d8da67160f0590152ebb` | modify | Same name and assertion. `MAIN_FRONTEND_SHA` becomes the received value, with a comment "Re-pinned again by T-107 (round-3 Test change request row 1)" | |
| 2 | `question-bank/src/map-click-no-candidates-verify.test.ts` › "T-092 criterion 16: no other surface changes" › "frontend (except []) is byte-identical to 5d72ca5" | `cf63f66`, T-092 tester: frontend unchanged. Last re-pinned by T-107 CI fix plan row 4 | Same as row 1. Expected `851e0853…`, received `8fcdc6344243848a17a754bbb2e712ade1a72e48c8e20d2cf05a3b12f85e1030` | modify | Same name. The `frontend` digest becomes the received value, with a matching comment | |
| 3 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` › "T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes" › "every tracked file under the three trees is as re-pinned by T-039, none added or removed" (`MAIN_BOUNDARY_SHA`) | `bcb2a38`, T-039 tester: the three trees unchanged. Last re-pinned by T-107 CI fix plan row 5 | Same as row 1. Expected `d374b841…`, received `8d01f8325faab96480be4722ab74bbb34cfb5af8c549a308d544d2dd1a144ca6` | modify | Same name and assertion. `MAIN_BOUNDARY_SHA` becomes the received value, with a matching comment | |
| 4 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "pre-existing test files are main's, except ones in an approved Test change request" (`MAIN_TESTS_SHA`) | `950f334`, T-091 tester: no unseen change to a test file. Last re-pinned by T-107 CI fix plan row 6 | Same as row 1. Expected `49b5117a…`, received `d397b7d66c1883d8052a39bc794a2ea547d77d0690bd30f51dd6d04bfe4544ac`. `MAIN_TESTS_COUNT` stays 131: no file is added | modify | Same name and assertion. `MAIN_TESTS_SHA` becomes the received value, with a matching comment. Count unchanged | |
| 5 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" (`APPLIED_REQUEST_FILE_SHAS`) | `950f334` / `bac230d`, T-091: each request file changed only by its approved re-pin. Last re-pinned by T-107 CI fix plan row 9 | Not red yet. It goes red once rows 1 and 2 change `agriculture-true-wrong-answers-verify.test.ts` and `map-click-no-candidates-verify.test.ts` again | modify | Same name and assertion. Only those two entries are recomputed on the final files, each with a "then again by T-107 (round-3 row 5, for its row N)" comment. `farm-animal-loose-ends`' entry and `MAIN_REQUEST_FILE_SHAS` stay as they are | |

### Round 1 and 2 (applied through CI fix plan 1)

Written by the tester (round 1), then re-checked by the round-2 tester against `origin/main` at `8092372`. That is T-106's merge, which re-pinned several of the same constants. **Decision is blank on every row: nobody has approved anything.** These rows are **routed to the `ci-fix` (D-20)**, which turns each one into a `pre-existing test` row of its CI fix plan.

- **Merge `origin/main` first.** The branch has not merged it. Rows 3-9 must be recomputed on the merged tree, after rows 1-2 are applied.
- **Re-check, round 2:** every test name in rows 1-8 is unchanged on `origin/main`. Rows 3-5 are byte-identical there. Rows 6-8 were re-pinned by T-106, so recompute from main's values. T-106's own files already sit in `CRITERION_21_ALLOWED` and `CRITERION_22_ALLOWED`.
- **Row 9 is new.** Round 1 missed it. Applying rows 3, 4 and 7 changes three files that `climate-cold-trade` pins by digest.

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
| 9 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" (`APPLIED_REQUEST_FILE_SHAS`) | `950f334`, T-091 tester: each file in its request changed only by its approved re-pin | Applying rows 3, 4 and 7 changes `agriculture-true-wrong-answers-verify.test.ts`, `map-click-no-candidates-verify.test.ts` and `farm-animal-loose-ends-verify.test.ts`, all three in `TEST_CHANGE_REQUEST_FILES`. Not red yet: it goes red once those rows land. T-106 did the same re-pin as its CI fix plan row 6 | modify | Same name and assertion. Only those three entries of `APPLIED_REQUEST_FILE_SHAS` are recomputed on the final files, each with a "then by T-107 (row 9, for its row N)" comment. `MAIN_REQUEST_FILE_SHAS` is unchanged | |

## CI fix plan

### Plan 2 (round 2, after the round-3 tester's `fail`): 5 rows, applied

**TL;DR: 5 rows, all re-pins of pre-existing `question-bank` tests, no source change. Nothing applied yet.** They are the round-3 Test change request rows 1-5, unchanged. The guard itself is not touched. **Trialled together in a scratch worktree (since removed): question-bank 2741 pass / 0 fail, its lint, typecheck and format:check clean.**

**Reproduced on the branch head `384342d`, before writing any row:**
- `question-bank` `bun test`: 2737 pass, 4 fail. The fails are exactly request rows 1-4, and each `Received` matches the value the tester recorded.
- `git diff --stat 11ece2c HEAD`: the only file changed outside the brief and run log is `frontend/src/prettier-writer-guard.criteria.test.ts` (+6 −2, the tester's parser fix). So the task's own change is the cause.
- frontend, the two writer files plus `prettier-writer-guard.criteria.test.ts`: 61 pass, 0 fail.
- `origin/main` is still `8092372`, already merged. No merge row is needed.

**Order to apply:** 1-4, then 5. Row 5's two digests are the values observed in the trial **after rows 1-4 were applied with exactly the comments written below**. If the comment text changes, recompute them from the test's own `Received`.

| # | File (and function or test) | Kind | Change | Why — failing test, root cause, criterion | Decision |
|---|---|---|---|---|---|
| 1 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` › "T-088 criteria 20-25: what must not change" › "criterion 21: every tracked file under frontend/ is byte-identical to main's" (`MAIN_FRONTEND_SHA`) (request row 1) | pre-existing test (`e9d666e`, T-088 tester; protects "nothing under `frontend/` changes"; last re-pinned by T-107 CI fix plan 1 row 3) | **Modify.** Same name and assertion. `MAIN_FRONTEND_SHA` `6d99c370…` → `ab8f396ed9953910d849ba7526b09a08d66781bcb068d8da67160f0590152ebb`. Two comment lines above it: "Re-pinned again by T-107 (CI fix plan 2 row 1; round-3 Test change request row 1): T-107's / tester fixed the output parser in prettier-writer-guard.criteria.test.ts." | Red: expected `6d99c370…`, received `ab8f396e…`. **Cause:** the tester's parser fix changed one file of this task's under `frontend/`. Constraints: "Whole-tree pins expected to go red (P-17) … `MAIN_FRONTEND_SHA`"; criterion 12: "A whole-tree pin that went red is fixed only through an approved Test change request or CI fix plan row". It still pins the whole frontend tree by digest, as hard as before || approved (whole plan, per the header's `CI fix:` line) |
| 2 | `question-bank/src/map-click-no-candidates-verify.test.ts` › "T-092 criterion 16: no other surface changes" › "frontend (except []) is byte-identical to 5d72ca5" (request row 2) | pre-existing test (`cf63f66`, T-092 tester; protects "frontend unchanged"; last re-pinned by CI fix plan 1 row 4) | **Modify.** Same name. The `frontend` entry's digest `851e0853…` → `8fcdc6344243848a17a754bbb2e712ade1a72e48c8e20d2cf05a3b12f85e1030`, with the same two comment lines (row 2) above it, indented like T-076's | Red: expected `851e0853…`, received `8fcdc634…`. Same cause and criterion as row 1 || approved (whole plan, per the header's `CI fix:` line) |
| 3 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` › "T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes" › "every tracked file under the three trees is as re-pinned by T-039, none added or removed" (`MAIN_BOUNDARY_SHA`) (request row 3) | pre-existing test (`bcb2a38`, T-039 tester; protects the three trees unchanged; last re-pinned by CI fix plan 1 row 5) | **Modify.** Same name and assertion. `MAIN_BOUNDARY_SHA` `d374b841…` → `8d01f8325faab96480be4722ab74bbb34cfb5af8c549a308d544d2dd1a144ca6`, with the same two comment lines (row 3) | Red: expected `d374b841…`, received `8d01f832…`. Same cause and criterion as row 1 || approved (whole plan, per the header's `CI fix:` line) |
| 4 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "pre-existing test files are main's, except ones in an approved Test change request" (`MAIN_TESTS_SHA`) (request row 4) | pre-existing test (`950f334`, T-091 tester; protects against unseen changes to pre-existing test files; last re-pinned by CI fix plan 1 row 6) | **Modify.** Same name and assertion. `MAIN_TESTS_SHA` `49b5117a…` → `d397b7d66c1883d8052a39bc794a2ea547d77d0690bd30f51dd6d04bfe4544ac`, with the same two comment lines (row 4). `MAIN_TESTS_COUNT` stays 131: no file is added | Red: expected `49b5117a…`, received `d397b7d6…`. Same cause and criterion as row 1. The changed test file is this task's own, in Constraints' "Files expected to change" || approved (whole plan, per the header's `CI fix:` line) |
| 5 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" (`APPLIED_REQUEST_FILE_SHAS`) (request row 5) | pre-existing test (`950f334` / `bac230d`, T-091; protects that each request file changed only by its approved re-pin; last re-pinned by CI fix plan 1 row 9) | **Modify.** Same name and assertion. Only two entries change, after rows 1-2: agriculture `c3e78d96…` → `87a2820de3b0bcbb2109f4629b4a1c88c5406daad25f485f1c3e737228aaa748`, map-click `ccd06452…` → `cc6f4ded984fe6c65272c0023244f841915fce7cd2e4702aafd75cb0f44fbe9c`. Each gets one comment line under its "then by T-107 (CI fix plan row 9, …)" line: "then again by T-107 (CI fix plan 2 row 5, for its row 1)" / "(…, for its row 2)". `MAIN_REQUEST_FILE_SHAS` and the other entries are unchanged | Not red today. In the trial it went red after rows 1-4 with exactly these two entries (`Expected - 2 / Received + 2`) and closed when they were re-pinned. Same criterion as row 1 || approved (whole plan, per the header's `CI fix:` line) |

**Root cause:** the guard (plan 1 rows 1-2) is correct, and no source is at fault. CI on `11ece2c` went red because this task's own test's output parser lost the guard's message under Bun 1.3.11 in GitHub Actions mode. The round-3 tester fixed that in its own file, which it may do. That one changed file under `frontend/` moves four P-17 whole-tree digests, and applying rows 1-2 moves a fifth that digests those two files. This is the same mechanism as plan 1's rows 3-6 and 9, with new values.

**Checked and not drifted:** all 5 request rows reproduce as written, with the tester's `Received` values. No row is missing: the trial's whole question-bank suite is green with exactly these 5. `refresh-regenerate-reminder-verify.test.ts` is not an `APPLIED_REQUEST_FILE_SHAS` entry, so row 3 does not cascade.

**Not doing:**
- **Reverting the tester's parser fix** to keep the old digests. That would bring back the CI red in criteria 3 and 6.
- **Any change to the guard or the two writer files.** Every criterion's behaviour holds (Verdict), so there is nothing to fix there.
- **Making the pins exclude this task's file.** That would weaken them. A re-pin keeps them as strict as they were.

To approve by hand: fill in each Decision, set the header's `CI fix:` to `approved — <name>, <date>` and `Next step` to `ci-fix`, commit, and start a run.

### Plan 1 (round 1): applied

**TL;DR: 10 rows, all test changes, nothing applied yet.** Row 0 merges `origin/main` (clean, no conflicts). Rows 1-2 add the worker's writer guard to the two pre-existing writer tests: that is the whole fix. Rows 3-9 are the whole-tree pins that go red because of it. **Every row was trialled together in a scratch worktree (since removed): the 14 T-107 tests and the two files pass 61/61, question-bank passes 2741/2741, frontend lint is clean.** No source changes.

**Reproduced on the branch head `3300b59`, before writing any row:**
- `frontend` `bun test src/prettier-writer-guard.criteria.test.ts`: 7 pass, 7 fail. The fails are criteria 1, 3 (×2), 4, 6 (×2) and 11.
- `question-bank` `bun test`: 2717 pass, 6 fail. The fails are exactly Test change request rows 3-8.

**Order to apply:** 0, then 1-2, then 3-5 and 7-8, then 6, then 9. Every digest in rows 3-6 and 9 is **the value observed after the earlier rows are applied**. In the trial the comments were not yet written, so the final values will differ from the trial values. The trial values are quoted only to show that the mechanism closes.

| # | File (and function or test) | Kind | Change | Why — failing test or CI line, root cause, criterion quoted for a test row | Decision |
|---|---|---|---|---|---|
| 0 | the branch | merge | `git merge origin/main` (`8092372`, T-106's merge). Merged cleanly in the trial: 9 files, no conflicts, none of them in rows 1-2 | The Test change request says "Merge `origin/main` first … Rows 3-9 must be recomputed on the merged tree". T-106 re-pinned the constants behind rows 6-8 on main, so a re-pin made without merging would be wrong as soon as the branch is rebased | approved (whole plan, per the header's `CI fix:` line) |
| 1 | `frontend/src/format-gate.criteria.test.ts` › "T-075 tester, criterion 7 — the writer and the check cover the same files" › all seven "`${probe.path}`: after bun run format, bun run format:check exits 0" (Test change request row 1) | pre-existing test (`2bab8a5`, T-075, PR #74; it protects "the writer and the checker cover the same files") | **Modify.** Add `existsSync` to the `node:fs` import. Add the worker's `requirePinnedPrettier()` (Handoff, verbatim) just above the criterion 7 `describe`. It reads `devDependencies.prettier` from `frontend/package.json` and throws if (a) `node_modules/prettier/package.json` is missing, with a message naming the pinned version and "node_modules/prettier is missing"; (b) its `version` differs, naming both versions; (c) `node_modules/.bin/prettier` is missing. Call it as the **first statement** of the test body, before `writeProbe`. Names, `writeProbe`, `run("format")` → 0 and `run("format:check")` → 0 are unchanged. The result is prettier 3.9.6-formatted (checked in the trial) | Red today: criteria 1, 3, 4, 6, 11 in `prettier-writer-guard.criteria.test.ts`. **Root cause:** the test spawns `bun run format` without checking which prettier will run. Criterion 1: "Running only the eight writer tests … executes the sentinel **zero** times". Criterion 4: "The writer is refused before it starts". Criteria 3 and 6: each writer test "is reported **failed** … Its failure output names the pinned version and says what it found instead". Criterion 9 is kept, because the body below the guard is unchanged. It pins harder than before: it asserts everything it did, and refuses the writer as well | approved (whole plan, per the header's `CI fix:` line) |
| 2 | `frontend/src/readme-fences.criteria.test.ts` › "T-076 criteria 7-8: prettier 3.9.6 leaves the fenced README alone" › "criterion 8: bun run format leaves frontend/README.md byte-identical" (Test change request row 2) | pre-existing test (`34b97f7`, T-076 tester; it protects "the writer leaves the fenced README byte-identical") | **Modify.** Same as row 1: `existsSync` joins the `node:fs` import, the same `requirePinnedPrettier()` sits above the criteria 7-8 `describe`, and it is called as the first statement, before `readFileSync(README)`. The rest of the body is unchanged. "the installed prettier is 3.9.6" and `installedPrettierVersion()` stay as they are (Out of scope, criterion 15) | Same failing tests and criteria as row 1. Constraints: "Today `readme-fences` checks the version in a separate test, so the writer runs even when that check fails. That is the defect" | approved (whole plan, per the header's `CI fix:` line) |
| 3 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` › "criterion 21: every tracked file under frontend/ is byte-identical to main's" (`MAIN_FRONTEND_SHA`) (TCR row 3) | pre-existing test (`e9d666e`, T-088 tester; it protects "nothing under `frontend/` changes") | **Modify.** Same name and assertion. `MAIN_FRONTEND_SHA` is recomputed on the frontend tree after rows 0-2, with a comment "Re-pinned by T-107 (CI fix plan row 3)". Trial value: `6d99c370…` | Red today (`706eae34…` expected). Rows 1-2 and this task's new `prettier-writer-guard.criteria.test.ts` change `frontend/`, which Constraints lists ("Whole-tree pins expected to go red", P-17). It pins exactly as hard: the whole frontend tree, by digest | approved (whole plan, per the header's `CI fix:` line) |
| 4 | `question-bank/src/map-click-no-candidates-verify.test.ts` › "T-092 criterion 16: no other surface changes" › "frontend (except []) is byte-identical to 5d72ca5" (TCR row 4) | pre-existing test (`cf63f66`, T-092 tester; it protects "frontend unchanged") | **Modify.** Same name. The `frontend` row's digest (line ~745) is recomputed after rows 0-2, with "Re-pinned by T-107 (CI fix plan row 4)" beside T-047's and T-076's comments. Trial value: `851e0853…` | Red today (`d271c4e5…`). Same cause as row 3 | approved (whole plan, per the header's `CI fix:` line) |
| 5 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` › "T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes" › "every tracked file under the three trees is as re-pinned by T-039, none added or removed" (`MAIN_BOUNDARY_SHA`) (TCR row 5) | pre-existing test (`bcb2a38`, T-039 tester; it protects the three trees unchanged) | **Modify.** Same name and assertion. `MAIN_BOUNDARY_SHA` is recomputed after rows 0-2, with "Re-pinned by T-107 (CI fix plan row 5)". Trial value: `d374b841…` | Red today (`5fea1cb3…`). Same cause as row 3 | approved (whole plan, per the header's `CI fix:` line) |
| 6 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "pre-existing test files are main's, except ones in an approved Test change request" (`MAIN_TESTS_COUNT`, `MAIN_TESTS_SHA`) (TCR row 6) | pre-existing test (`950f334`, T-091 tester; it protects against unseen changes to pre-existing test files) | **Modify.** Same name and assertion. `MAIN_TESTS_COUNT` goes 130 → 131 (exactly +1, for `prettier-writer-guard.criteria.test.ts`). `MAIN_TESTS_SHA` is recomputed after rows 0-2 (the set counts `format-gate` and `readme-fences`, but not rows 3-5's or 7's files, which it excludes). Both get a "Re-pinned by T-107 (CI fix plan row 6)" comment. Trial value: `49b5117a…` | Red today (expected 130, got 131). One test file is added and two are modified by this task, all three named in Constraints' "Files expected to change". The count moves by exactly the files added | approved (whole plan, per the header's `CI fix:` line) |
| 7 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21: the bank and the boundaries" › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" (TCR row 7) | pre-existing test (`47581ea`, T-096 tester; it protects against a stray non-test file) | **Modify.** Join `tasks/T-107-prettier-writer-guard.md` and `runs/T-107-prettier-writer-guard.md` to `CRITERION_21_ALLOWED`, with a comment "T-107's loop files, joined through T-107's CI fix plan row 7", the way T-106 did. Count (280) and `MAIN_UNTOUCHABLE_SHA` are unchanged | Red today on the merged tree (expected 280, got 282). The two files are this task's brief and run log, the loop's own records. The pin still holds every other non-test file to main's digest, as hard as before. Of the tester's two options this is the one T-106 set the precedent for, and it does not move the pin | approved (whole plan, per the header's `CI fix:` line) |
| 8 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" (TCR row 8) | pre-existing test (`950f334`, T-091 tester; it protects against a stray non-test file) | **Modify.** Same as row 7: the same two files join `CRITERION_22_ALLOWED` with a matching comment. `MAIN_UNTOUCHABLE_COUNT` (283) and `MAIN_UNTOUCHABLE_SHA` are unchanged | Red today on the merged tree (expected 283, got 285). Same cause as row 7 | approved (whole plan, per the header's `CI fix:` line) |
| 9 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" (`APPLIED_REQUEST_FILE_SHAS`) (TCR row 9) | pre-existing test (`950f334`, T-091 tester; the test's current name and the 8108a42 pinning came from `bac230d`, T-091 review fix; it protects that each request file changed only by its approved re-pin) | **Modify.** Same name and assertion. Only three entries are recomputed, on the final files after rows 3, 4 and 7: `agriculture-true-wrong-answers-verify.test.ts`, `map-click-no-candidates-verify.test.ts` and `farm-animal-loose-ends-verify.test.ts`. Each gets a "then by T-107 (CI fix plan row 9, for its row N)" comment line. `MAIN_REQUEST_FILE_SHAS` and the other three entries are unchanged | Not red until rows 3, 4 and 7 land. In the trial it went red with exactly those three entries and closed when they were re-pinned. T-106's CI fix plan row 6 is the precedent | approved (whole plan, per the header's `CI fix:` line) |

**Root cause:** the defect is in the tests, not in the source. `format-gate`'s seven criterion 7 tests and `readme-fences`' criterion 8 test spawn `bun run format`, the writer, without first checking that the pinned prettier is installed. With no `node_modules/prettier`, or with the wrong version, `bun run` falls back to whatever `prettier` is on `PATH`, and that rewrites tracked files. The worker correctly built nothing (D-14), and the tester could not edit pre-existing tests in an unattended run, so the guard has never been applied. The task's own tests are correct and fail for exactly this reason. Rows 3-9 are the P-17 whole-tree pins that move when two frontend test files change, one is added, and the loop's brief and run log appear.

**Checked and not drifted:** all 9 request rows reproduce as the tester described them on the merged tree. One correction: row 9's current test name and its 8108a42 pinning come from `bac230d` (T-091 review fix), not `950f334`. I found no stale test that the request missed. After the full trial, question-bank was 2741 pass / 0 fail. Frontend was 434 pass / 4 fail / 4 errors, every one `Cannot find package 'react-simple-maps'`, which is environmental (the proxy blocks the install) and pre-existing. Frontend lint exited 0. Working tree had no stray change outside the rows.

**Not doing:**
- **A shared guard module** imported by both files. It would remove the duplication, but Constraints' "Files expected to change" lists only the two files and the tester's file. This is left for the reviewer to queue.
- **Dropping the worker's `.bin/prettier` check.** Without it, a package that is present but has no `.bin` link passes the version check, and `bun run` would still fall back to `PATH`. That is what criterion 7 protects. It costs nothing when the pin is installed.
- **Calling `node_modules/prettier/bin/prettier.cjs` directly** instead of `bun run format`. Criterion 9 says the tests still run the writer, and the script is the thing under test.
- **Recomputing the counts and digests in rows 7-8** instead of joining the allowed sets. That would also work, but the brief is deleted at the sweep, so the pin would go red again on `main`. The allowed-set join is T-106's precedent.
- **Guarding the `format:check` tests.** Out of scope, first bullet.
- **Any change to `package.json`, scripts or CI.** Criterion 14 forbids it.

To approve by hand: fill in Decision, set the header's `CI fix:` to `approved — <name>, <date>` and `Next step` to `ci-fix`, commit, and start a run.

## CI fix

### Round 2, pass 2 (plan 2 applied)

**TL;DR: all 5 approved rows of plan 2 applied, nothing else changed. question-bank is 2741 pass / 0 fail; frontend's only failures are the 4 environmental `react-simple-maps` ones.** No source and no frontend file touched. **Next: a fresh tester re-verifies.**

- **Approval, as the header read:** `approved — the user, 2026-11-12, given in the orchestrator's session`. The run log quotes the user, after plan 2 was pushed (`241a598`): "approve the T-107 CI fix plan". A whole-plan approval from a person, given after the plan existed, so I copied it into each row's Decision, as round 1 did. Every row is a test change, so the reviewer still puts the plan in the PR body (D-18).
- **Plan still held:** since `241a598` the branch moved only by the orchestrator's brief and run-log commits, and `origin/main` is still `8092372`. Every row applied cleanly as written.
- **Independence:** orchestrated run (`runs/T-107-prettier-writer-guard.md` exists). My session id matches every other role's, so the id check proves nothing. My only independence is being a freshly spawned agent that did not write the code, the plan or the verdict.

| Row | File | What landed |
|---|---|---|
| 1 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` | `MAIN_FRONTEND_SHA` `6d99c370…` → `ab8f396e…52ebb`, two comment lines "Re-pinned again by T-107 (CI fix plan 2 row 1; round-3 Test change request row 1) …" |
| 2 | `question-bank/src/map-click-no-candidates-verify.test.ts` | `frontend` digest `851e0853…` → `8fcdc634…1030`, same two lines (row 2), indented |
| 3 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` | `MAIN_BOUNDARY_SHA` `d374b841…` → `8d01f832…4ca6`, same two lines (row 3) |
| 4 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` | `MAIN_TESTS_SHA` `49b5117a…` → `d397b7d6…44ac`, same two lines (row 4). `MAIN_TESTS_COUNT` unchanged at 131 |
| 5 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` | After rows 1-4, the test was red with exactly `Expected - 2 / Received + 2`, and the received values equalled the plan's. agriculture `c3e78d96…` → `87a2820d…a748`, map-click `ccd06452…` → `cc6f4ded…be9c`, each with a "then again by T-107 (CI fix plan 2 row 5, for its row N)" line. `MAIN_REQUEST_FILE_SHAS` and the other entries unchanged |

**Refused:** none.

**Suites, as run on the applied tree (web sandbox):**
- **question-bank `bun test`:** 2741 pass, 0 fail. After rows 1-4 alone it was 2740 / 1, the 1 being row 5's test, as planned. **`typecheck`:** exit 0. **`lint`:** 0 warnings, 0 errors. **`format:check`:** clean.
- **frontend `bun test`:** 434 pass, 4 fail, all `Cannot find package 'react-simple-maps'` (environmental, as in every round). One run made straight after the backend suite also had 2 `lint-gate.test.ts` tests time out at 5 s; the next whole-suite run had none, same as round 1 saw.
- **frontend `typecheck`:** 9 errors, all the `react-simple-maps` / `us-atlas` ones (environmental). **`lint`:** exit 0. **`format:check`:** clean.
- **`make -C backend test`:** 1221 passed, 9 skipped.
- **Working tree after all runs:** only the four row files and this brief modified.

**Noticed, not changed:**
- **Criterion 12's whole-frontend green still has to come from CI**, since this sandbox cannot install `react-simple-maps`.

### Round 2, pass 1 (plan 2)

- **Plan written, nothing applied.** Plan 2 is above, with Decision blank and waiting for approval.
- **Independence:** orchestrated run (`runs/T-107-prettier-writer-guard.md` exists). My session id matches every other role's, so the id check proves nothing. My only independence is being a freshly spawned agent that did not write the code, plan 1 or the verdict.

### Round 1 (plan 1)

**TL;DR: all 10 approved rows applied, nothing else changed. The two writer files and this task's tests pass 61/61, and question-bank passes 2741/2741.** The only frontend failures left are the 4 `react-simple-maps` ones this sandbox cannot install. **Next: a fresh tester re-verifies.** The approval was given before the plan existed (see below), so the reviewer should weigh it.

- **Approval, as the header read:** `approved — the user, 2026-11-12, given in the orchestrator's session (in advance of the plan's push)`. The run log quotes the user: "approve the T-107 CI fix plan". The orchestrator recorded that the user said this at about 17:30Z, while pass 1 was still writing the plan, before `351a12d` landed. It told them the plan did not exist yet, and they did not object.
- **How I read it:** a whole-plan approval from a person, given through the channel `process.md` (§ "When a run stops for you", item 7) and the orchestrator's "CI fix requests" step 3 allow. T-106 used the same channel. It approves the plan as written, the way the timeout stamp does, so I copied it into every row's Decision. **The caveat:** nobody approved these rows after reading them. Main had not moved since the plan was written (`origin/main` was still `8092372`), so the rows are the ones that were pushed. Every row is a test change, so the reviewer should put the plan in front of a person before merge, as D-18 asks for a stamp.
- **Independence:** orchestrated run (`runs/T-107-prettier-writer-guard.md` exists). My session id matches every other role's, so the id check proves nothing. My only independence is being a freshly spawned agent that did not write the plan or the code.

### Rows applied (none refused)

| Row | File | What landed |
|---|---|---|
| 0 | the branch | `git merge origin/main` (`8092372`), clean: 9 files, none of them in rows 1-2 |
| 1 | `frontend/src/format-gate.criteria.test.ts` | `existsSync` added to the `node:fs` import. The worker's `requirePinnedPrettier()`, verbatim, sits above the criterion 7 `describe`, and it is the first statement of the seven writer tests. Names and the rest of each body are unchanged. Prettier 3.9.6 `--check` clean |
| 2 | `frontend/src/readme-fences.criteria.test.ts` | Same guard and import. Called first in "criterion 8: bun run format leaves frontend/README.md byte-identical", before `readFileSync(README)`. "the installed prettier is 3.9.6" and `installedPrettierVersion()` are untouched |
| 3 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` | `MAIN_FRONTEND_SHA` `706eae34…` → `6d99c370e4348ffba5d4ff73dee1d5eb176cbf20bb519921292ab51744a93f31`, with a T-107 row 3 comment |
| 4 | `question-bank/src/map-click-no-candidates-verify.test.ts` | `frontend` digest `d271c4e5…` → `851e085377b1ab46f6faa3d2ed32a67638a73698aa2cf59c46032cf5ae791b5a`, with a T-107 row 4 comment |
| 5 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` | `MAIN_BOUNDARY_SHA` `5fea1cb3…` → `d374b84161d960372f3c3400d5fa750b39622de5306434631e2faaa1b7973b88`, with a T-107 row 5 comment |
| 6 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` | `MAIN_TESTS_COUNT` 130 → 131. `MAIN_TESTS_SHA` `e232903b…` → `49b5117ae6f9605ce9fa1374f39654bc1c123506cdbf3cd9d681a342c4a66ea9`. Both carry T-107 row 6 comments |
| 7 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` | `tasks/T-107-prettier-writer-guard.md` and `runs/T-107-prettier-writer-guard.md` added to `CRITERION_21_ALLOWED`, with a comment. Count and digest unchanged |
| 8 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` | The same two files added to `CRITERION_22_ALLOWED`, with a comment. Count and digest unchanged |
| 9 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` | Only three `APPLIED_REQUEST_FILE_SHAS` entries changed, recomputed on the final files after rows 3, 4 and 7. agriculture → `c3e78d96…`, map-click → `ccd06452…`, farm-animal → `a9908e16…`. Each has a "then by T-107 (CI fix plan row 9, for its row N)" line. `MAIN_REQUEST_FILE_SHAS` is unchanged |

The digests in rows 3-6 match the pass-1 trial values. The frontend tree is the same as in the trial, and the comments sit in question-bank. That is consistent, not copied: each value was read from the failing test's own `Received` on this tree.

### Suites, as run on the applied tree (web sandbox)

- **frontend, the two files plus `prettier-writer-guard.criteria.test.ts`:** 61 pass, 0 fail.
- **frontend `bun test`, run alone:** 434 pass, 4 fail. All 4 are `Cannot find package 'react-simple-maps'`, the environmental failure from the Handoff and Verdict. A first run alongside the question-bank and backend suites also had 5 `lint-gate.test.ts` tests time out at 5 s. Rerun alone, that file passed 8/8, and the solo whole-suite run above had none of them.
- **frontend `typecheck`:** 9 errors, all `react-simple-maps` / `us-atlas` and their implicit-`any` fallout in `UsMap.tsx` (environmental, as before). **`lint`:** exit 0. **`format:check`:** clean.
- **question-bank `bun test`:** 2741 pass, 0 fail. **`typecheck`:** exit 0. **`lint`:** 0 warnings, 0 errors. **`format:check`:** clean.
- **`make -C backend test`:** 1221 passed, 9 skipped.
- **Working tree after all runs:** only the rows' files and this brief were modified. No probe was left behind.

### Noticed, not changed

- **Criterion 12 still needs CI.** This sandbox cannot install `react-simple-maps`, so a whole-frontend green has to come from CI.
- **The guard is duplicated in the two files.** This was left as the plan's "Not doing" says. The reviewer may queue a shared helper.

## Verdict

### Round 4 (tester, after CI fix plan 2): `pass`

**TL;DR: `pass`, next is the `reviewer`. Every criterion holds on `238af21`, and CI on that commit is green in all six jobs, which settles criterion 12.** Locally the only reds are environmental (`react-simple-maps` cannot be installed here) plus two `lint-gate` timeouts under load that pass when the file is rerun alone. **For the reviewer:** every pre-existing test change came through CI fix plans 1 and 2, and those were approved by the user in the orchestrator's session, not after reading each row. Put them in the PR body (D-18).

- **Independence:** orchestrated run (`runs/T-107-prettier-writer-guard.md` exists). My session id matches every row, and under the orchestrator that proves nothing. My independence rests only on being a freshly spawned agent that did not see the work happen. That is weaker than a separate session, because it depends on the orchestrator having spawned me correctly.
- **Loop count:** this pass follows two `fail`s. The user allowed the third fix round (`384342d`).
- **No new tests from me.** The round-1 to round-3 testers' `prettier-writer-guard.criteria.test.ts` already maps each of criteria 1-11. I re-read it against the criteria, not the code, and checked it with fresh mutations (below).

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | Test `criterion 1`: writer tests only, no `node_modules`, sentinel logs nothing. Mutation M1 turns it red |
| 2 | pass | Test `criterion 2` |
| 3 | pass | Tests `criterion 3` ×2. Mutation M1 turns both red. CI (Bun 1.3.11, GitHub Actions mode) green on them |
| 4 | pass | Test `criterion 4`: neither the sentinel nor the fake 3.8.1 package's `.bin` is started. M1 and M2 each turn it red |
| 5 | pass | Test `criterion 5` |
| 6 | pass | Tests `criterion 6` ×2. M1 and M2 each turn them red |
| 7 | pass | Test `criterion 7` |
| 8 | pass | Test `criterion 8`. Real tree, pinned 3.9.6: the two files plus the task's file pass 61/61 |
| 9 | pass | Committed tests (`format` script made `true` gives 7 fails; README heading reformatted gives a fail) are green, so both mutations were seen to go red. M3 is my own run in the real tree |
| 10 | pass | Test `criterion 10`. `git status --porcelain` was empty after every local run |
| 11 | pass | Test `criterion 11`. M1 turns it red (write starts logged) |
| 12 | pass | **CI run 43306721526 on `238af21`:** frontend, question-bank, backend ×2, integration and e2e all `success`. Locally: question-bank 2741/0, typecheck, lint and format:check clean. Backend 1221 passed, 9 skipped. Frontend lint exit 0, format:check clean. Frontend `bun test` gave 432 pass / 6 fail: 4 are `Cannot find package 'react-simple-maps'` (environmental) and 2 are `lint-gate.test.ts` 5 s timeouts, which passed 8/8 when the file was rerun alone. Frontend typecheck gave 9 errors, all `react-simple-maps` / `us-atlas` / `UsMap` (environmental) |
| 13 | pass | The diff of the two files against `origin/main` adds only a read-only guard. The task's file writes only under `os.tmpdir()` and copies the real prettier, which it only reads |
| 14 | pass | `git diff --quiet origin/main HEAD --` on `frontend/package.json`, `frontend/bun.lock`, `frontend/.prettierrc`, `frontend/.prettierignore`, `.github/workflows/ci.yml`, `question-bank/package.json`, `question-bank/bun.lock`, `backend/pyproject.toml` and `backend/uv.lock` exited 0 |
| 15 | pass | `git diff origin/main HEAD` on the two files: `existsSync` added to the import, `requirePinnedPrettier()` defined, and one call as the first statement of the 7 + 1 writer tests. Nothing else. `test(` occurrences are 23 and 8 on both main and the branch head |
| 16 | pass | No `fetch` and no URL apart from the dead proxy `http://127.0.0.1:1`, which every child process runs under |

**Pre-existing tests changed since the last verdict (CI fix plan 2):** `git diff f9901a4 HEAD -- question-bank/` shows exactly plan 2's rows. Row 1 is `MAIN_FRONTEND_SHA`, row 2 the `frontend` digest in map-click, row 3 `MAIN_BOUNDARY_SHA`, row 4 `MAIN_TESTS_SHA` (count stays 131), and row 5 the two `APPLIED_REQUEST_FILE_SHAS` entries. Each carries the planned comment. Nothing else changed. Plan 1's rows were checked by the round-3 verdict and have not changed since.

**Mutations (each reverted with `git checkout`, and `git status --porcelain` was empty afterwards):**
- **M1. Guard call commented out** in the first `format-gate` writer test. 7 of the task's 14 tests went red: criteria 1, 3 ×2, 4, 6 ×2 and 11.
- **M2. Version comparison disabled** in `readme-fences`' guard (`found !== pinned` became `found === "never"`). Criteria 4 and 6 ×2 went red.
- **M3. The first `# ` heading of `frontend/README.md` changed to `#   `** in the real tree. readme-fences criterion 8 went red (`Expected: true / Received: false`). After the revert it passed.
- **Not mutated:** the guard's `.bin/prettier` check. The criteria do not require it, and no test pins it.

### Round 3 (tester): `fail`, kept for the record

**TL;DR: `fail`, next is the `ci-fix`. The guard is right: every criterion's behaviour holds, here and in a CI-equivalent Bun 1.3.11 run.** CI on `11ece2c` was red in this task's own test file because its output parser broke under GitHub Actions. I fixed that in my own file. The fix moves 4 pre-existing whole-tree digest pins (P-17), and I may not re-pin those unattended, so they are routed as round-3 Test change request rows 1-5 (D-20).

- **Independence:** orchestrated run (`runs/T-107-prettier-writer-guard.md` exists). My session id matches every row, which proves nothing under the orchestrator. My independence rests only on being a freshly spawned agent that did not see the work happen. That is weaker than a separate session, because it depends on the orchestrator having spawned me correctly.
- **Needed from the `ci-fix`:** plan and apply round-3 rows 1-5, recomputing each digest from its test's own `Received`. Then a fresh tester re-verifies, and CI's frontend job is the check for criterion 12.
- **Loop count:** this is the second `fail`. If the next round does not pass, it escalates to a human (process.md).
- **Not a source or guard fault:** rows 1-2 of CI fix plan 1 are the fix, and they are correct as applied.

### What CI showed, and the fix to my own file

- **CI on `11ece2c`, frontend job:** 482 pass, 2 fail. The fails were `criterion 3: each failure names the pinned version and that node_modules/prettier is missing` and `criterion 6: each failure names both the pinned version and the version found`, both on the readme-fences writer test (`names: false`). Every other job was green.
- **Reproduced locally** with the Bun 1.3.11 release binary and `env -i … GITHUB_ACTIONS=true CI=true`: the same 2 fail. Bun 1.4.4 does not reproduce it, and neither does 1.3.11 outside GitHub Actions mode.
- **Root cause (in `runTests`, my file):** on 1.3.11 the JUnit `<failure type="AssertionError" />` carries no message. Under GitHub Actions Bun also prints a "17 tests failed:" summary that repeats every `(fail)` line with nothing before it. `consoleOutput.set` overwrote each name's real error with that empty repeat. All eight writer tests were affected, but the loop stops at the first.
- **The guard's real output, as printed by the child:** `error: refusing to run the prettier writer: pinned prettier 3.9.6 is required, but node_modules/prettier is missing` (×8), and `… found 3.8.1 in node_modules/prettier` (×8). Seen in my own sentinel runs, outside the test file.
- **Fix:** each name's output is now appended, never replaced. The assertions are unchanged and just as strict.
- **The fix is not vacuous:** I removed `${pinned}` and `${found}` from readme-fences' guard messages (reverted). Criteria 3 and 6 then go red on both Bun 1.4.4 and 1.3.11 in GitHub Actions mode. Reverted, they pass on both: the whole file is 14/14 on 1.4.4, and 14/14 on 1.3.11 in GitHub Actions mode.

### Criteria (branch head `11ece2c` plus my parser fix)

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | Test `criterion 1`. By hand, in a copy without `node_modules`, with a sentinel first on `PATH` and only the writer tests selected: 8 fail, and the sentinel log was never created |
| 2 | pass | Test `criterion 2` |
| 3 | pass | Tests `criterion 3` ×2. The guard's message is shown above. The CI red was the parser (fixed) |
| 4 | pass | Test `criterion 4`. By hand, with a fake 3.8.1 package whose `.bin/prettier` logs, writer tests only: the sentinel and package logs were both empty |
| 5 | pass | Test `criterion 5`. By hand, two whole files, wrong version: `git status --porcelain --untracked-files=no` was empty. The package logged 11 `--check .` starts, all from the out-of-scope `format:check` tests |
| 6 | pass | Tests `criterion 6` ×2, and the message shown above |
| 7 | pass | Test `criterion 7` |
| 8 | pass | Test `criterion 8`. The real tree with pinned 3.9.6: the two files plus this task's file, 61/61 |
| 9 | pass | Committed mutation tests (format → `true`; README heading → `#   `). **My own mutation in the real tree:** the first `# ` heading of `frontend/README.md` changed to `#   ` turned readme-fences criterion 8 red (`Expected: true / Received: false`). Reverted with `git checkout`, and `cmp` confirmed it |
| 10 | pass | Test `criterion 10` |
| 11 | pass | Test `criterion 11`. By hand, the whole frontend `bun test` in a git-initialised copy without `node_modules`: 407 pass / 31 fail / 4 errors (expected without packages). No tracked change. The sentinel logged 11 × `ran --check .` and **0 write starts** |
| 12 | **fail** | CI frontend job red on `11ece2c` (above). On my commit, question-bank goes red in 4 pins (round-3 rows 1-4). Everything else is green or environmental: see Suites |
| 13 | pass | The two files' change is a read-only guard (diff reviewed). This task's file writes only under `os.tmpdir()`, and my fix touches only the parser |
| 14 | pass | `git diff --quiet origin/main HEAD --` on `frontend/package.json`, `frontend/bun.lock`, `frontend/.prettierrc`, `frontend/.prettierignore`, `.github/workflows/ci.yml`, `question-bank/package.json`, `question-bank/bun.lock`, `backend/pyproject.toml` and `backend/uv.lock`: identical. No dependency added |
| 15 | pass | `git diff origin/main HEAD` on the two files shows only `existsSync` in the import, the `requirePinnedPrettier()` definition, and one call as the first statement of the 7 + 1 writer tests. No test deleted or renamed, and no other assertion touched. This matches CI fix plan rows 1-2 |
| 16 | pass | No `fetch` and no URL. Every child runs under the dead proxy `http://127.0.0.1:1` |

### Pre-existing tests changed since the last verdict (CI fix plan 1)

- **Rows 1-2:** `format-gate` and `readme-fences` writer tests. They match the plan, as checked in criterion 15.
- **Rows 3-9:** the question-bank pins. They were green on `11ece2c` (2741/2741) and are only red again because of my parser fix. That is round-3 rows 1-5.

### Mutations (all reverted; `git status` showed only my test file afterwards)

- **Guard call removed** from readme-fences' writer test: criteria 1, 4 and 6 ("all eight reported failed") went red.
- **Version and found values dropped** from the guard messages: criteria 3 and 6 ("each failure names …") went red, on Bun 1.4.4 and on 1.3.11 in GitHub Actions mode.
- **README heading reformatted:** readme-fences criterion 8 went red (criterion 9).

### Suites (web sandbox, Bun 1.4.4, my commit)

- **frontend `bun test`:** 434 pass, 4 fail, 4 errors. That was before my fix, which only changes this task's file. All 4 fails and 4 errors are `Cannot find package 'react-simple-maps'`, which is environmental: the proxy blocks the install, and CI does not have the problem. This task's file is 14/14 after the fix.
- **frontend `typecheck`:** 9 errors, all `react-simple-maps` / `us-atlas` (environmental). **`lint`:** exit 0. **`format:check`:** clean.
- **question-bank `bun test`:** 2737 pass, 4 fail: round-3 rows 1-4, red only because of my fix. On `11ece2c` it was 2741/2741. **`typecheck`:** exit 0. **`lint`:** clean. **`format:check`:** clean.
- **`make -C backend test`:** 1221 passed, 9 skipped.
- **CI on `11ece2c`:** frontend red (above). question-bank, backend ×2, e2e and integration green.

## Notes

- **Worker, survey:** the brief predicted this outcome, and it held. Nothing in production code or `package.json` is in scope (criterion 14 forbids it), so the whole fix is the guard in two pre-existing tests.
- **Worker, surprise:** this sandbox's `frontend/node_modules` is missing `react-simple-maps`, and the proxy refuses the install. A whole-suite pass for criterion 12 needs a full install, which means CI or a sandbox that can reach the registry. **Tester to note this in the Verdict. CI is the authority for criterion 12.**
- **Worker, surprise:** the two `question-bank` count pins were already red on the branch head, from this task's own brief and run log. Owner: the tester, as P-17 Test change request rows alongside the pins the brief lists.
- **Expander, amendment (2026-11-12):** `Approved:` reset to `pending`. The earlier orchestrator stamp covered the old wording of criteria 1 and 11. Next step is the `tester`, not the worker: the worker's Handoff already says there is nothing to build outside the two pre-existing files, and the amendment does not change that. The next tester (a) updates this task's own `frontend/src/prettier-writer-guard.criteria.test.ts` to the amended criteria 1 and 11 (the sentinel must log its arguments; see Definitions), and (b) re-checks Test change request rows 1-8 after merging `origin/main` (T-106 merged as `8092372` and re-pinned some of the same constants), then routes them to the `ci-fix` (D-20).
