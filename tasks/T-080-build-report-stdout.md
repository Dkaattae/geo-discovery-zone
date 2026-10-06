# T-080 — The offline harness returns the build's stdout

**Status:** `awaiting approval`
**Next step:** `worker`, once a human has approved the criteria below
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-080, split out of T-070 (b) on 2026-10-06
**Branch:** `claude/serene-heisenberg-cd5unq`
**PR:** #73, opened draft against the branch above. It was opened for T-070, then retitled for T-080 when the split was accepted. T-070 now has no PR, and waits in `tasks.md` for Q1.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-06 | cse_01UvBvo6qodvNQDpFJPANTgN (T-070 round: blocked on Q1 and Q2) |
| task-expander | 2026-10-06 | cse_01UvBvo6qodvNQDpFJPANTgN (T-080 round: split applied, brief written) |

## Goal

The build's `report()` prints a warning line for every data problem, and no test
can read that output. Two things cause this: `rebuildOffline()` returns only the
files the build wrote, and it passes `--quiet`, which silences `report()`
entirely. Give the shared harness a way to return what the real CLI printed.
"The report prints the warning" (T-016 criterion 8) can then be a test, not a
grep of `build.ts`'s source plus a check by hand.

## Acceptance criteria

"The committed fixtures" means `question-bank/src/fixtures/us-states.sparql.json`
and `us-states-elevation.sparql.json`, as tracked. "The harness" means
`question-bank/src/offline-rebuild.ts`.

**The new capability**

1. A test can call the harness once and get two things back: the files that
   offline build wrote, and the build process's complete stdout as one string.
   The harness runs `src/build.ts --offline` itself. The test does not spawn
   anything.
2. On the committed fixtures, that stdout contains a line that begins
   `Wrote 50 entities via json → `.
3. On the committed fixtures, that stdout contains exactly one line that matches
   `^\d+ warning\(s\):$`, and that line reads `3 warning(s):`.
4. The 3 lines directly after it each match `^  <entity>\.<field>: .+$`. Their
   `<entity>.<field>` pairs are exactly `us-state-ct.highest_point_m`,
   `us-state-ok.highest_point_m` and `us-state-va.highest_point_m`, with no
   duplicates and nothing else. These are T-079's three curated overrides
   (`engineering-decisions.md` E-19).
5. Criteria 2 to 4 are asserted on the stdout of a real spawned build. If the
   tester changes the text `report()` prints in `src/build.ts` (for example the
   wording `warning(s):`, or the `entity.field` separator), the test for
   criteria 3 and 4 fails. A hard-coded string, a reimplementation of
   `report()`, or an in-process `runBuild` call with a `log` dependency does not
   satisfy these criteria.
6. On the committed fixtures, each file returned alongside the stdout is
   byte-identical to the tracked file of the same name under
   `question-bank/data/us-states/`. Check at least `index.json`,
   `us-state-ct.json` and `us-state-co.json`.

**What the harness must keep doing**

7. The build that produces the captured stdout runs with all six `DEAD_PROXY`
   variables (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` and their lower-case
   forms) set to the dead-loopback address. `DEAD_PROXY` is still exported
   with exactly those six keys.
8. When the build exits non-zero, the stdout-returning route throws, as
   `rebuildOffline` does. Pointing it at a build script that does not exist is
   enough to show this. `rebuildOffline` itself still throws in the same case.
9. After a successful call, no directory whose name starts with the temp prefix
   that call was given remains in `os.tmpdir()`. This holds for both routes.
10. After a call that throws (criterion 8), no directory with that call's prefix
    remains in `os.tmpdir()` either. This holds for both routes.

**What must not change**

11. `rebuildOffline(buildScript, fileNames, tmpPrefix?)` keeps its signature. It
    still returns a `Map<string, string>` of file name to UTF-8 text.
12. Every `*.test.ts` file that existed under `question-bank/src/` before this
    task is unmodified and undeleted. This shows in
    `git diff --name-status origin/main...HEAD` (no `M` or `D` rows on those
    paths), and the whole `question-bank` suite passes.
13. No new or changed file under `question-bank/src/` other than
    `offline-rebuild.ts` contains the dead-loopback literal (`127.0.0.1:1`).
    No new test file calls `spawnSync` or `spawn` on `bun` or on `build.ts`.
14. Nothing under `question-bank/data/`, `question-bank/sample-data/` or
    `question-bank/src/fixtures/` changes.
15. No new dependency. `question-bank/package.json` and `question-bank/bun.lock`
    are unchanged.
16. No test reaches the network. This follows from criterion 7. It is stated
    separately because it is the risk that matters.

## Out of scope

- **`src/build.ts` and its `--quiet` flag.** Today `--quiet` prints nothing at
  all, even though `--help` says "Only print the final summary". That mismatch
  is real, and this task does not fix it. Whether the harness drops `--quiet`
  on the stdout-returning route, or uses some other route, is up to the worker,
  as long as `build.ts` is not edited.
- **Replacing T-016's source-grep test** (`highest-point-verify.test.ts:430-455`)
  or the comments that say stdout cannot be read (`:443`, `:478-487`). They are
  existing tests (criterion 12). Retiring them can be a follow-up once this
  lands.
- **The two refresh tests that spawn `build.ts` directly** (`refresh.test.ts:194`,
  `refresh-verify.test.ts:379`) and the guards that miss them. Queued as T-082.
- **A `--fixture` argument for the harness.** It is not needed for any criterion
  here.
- **T-070 (a), the digest guards**, and **T-081, the `git` leftover.** Both are
  separate entries in `tasks.md`.
- **`refresh.ts`'s own `N warning(s):` output** (`refresh.ts:379`). It is a
  different program.

## Constraints

- **Files expected to change:** `question-bank/src/offline-rebuild.ts`, plus new
  test file(s) under `question-bank/src/`. Nothing else. `src/build.ts` does
  not change.
- **Existing guards that bind the new code.** They all pass today, and
  criterion 12 means they must still pass unedited:
  - **Dead-loopback literal.** `climate-kid.test.ts:727`,
    `climate-kid-verify.test.ts:953` and `top-crops-verify.test.ts:462` each
    require that exactly one `.ts` file under `src/` contains it, and that the
    file is `offline-rebuild.ts`. Build it from parts in any new test, as those
    files do.
  - **Spawn guards.** `climate-kid.test.ts:738` and `top-crops-verify.test.ts:473`
    match `spawnSync([ "bun"` followed **anywhere later in the file** by
    `build.ts`. A new test file that spawns `bun` at all, and mentions
    `build.ts` anywhere after that, turns them red.
  - **Harness source check.** `climate-kid-verify.test.ts:1210-1222` requires
    `offline-rebuild.ts` to contain the text `exitCode !== 0` and
    `throw new Error`.
  - **Call shape.** `climate-kid-verify.test.ts:991-1020` requires five suites
    to contain `rebuildOffline(`. They are unchanged, so this holds unless
    `rebuildOffline` is renamed. Do not rename it (criterion 11).
- **Gates:** `bun run typecheck`, `bun run lint` (warnings fail) and
  `bun run format:check` in `question-bank/` stay green (`conventions.md`).
- **Dependencies:** none (see [`CLAUDE.md`](../CLAUDE.md), "Packages").
- **No mocks of `fetch`, no network** ([`test-guidelines.md`](../test-guidelines.md)
  "Start below the transport, not at it"). The spawned CLI with `DEAD_PROXY`
  is the sanctioned route here, because the thing under test is what the real
  process prints.

## Context

Required reading for the worker and the tester.

- **The harness:** `question-bank/src/offline-rebuild.ts`, the whole file (69
  lines). Note the `--quiet` in its spawn argv.
- **What prints:** `question-bank/src/build.ts`. Read `runBuild` (`:132-187`),
  where `--quiet` replaces `log` with a no-op, and `report()` (`:189-210`). The
  `--quiet` help text is at `:110`.
- **Where the three warnings come from:** `question-bank/src/normalize.ts:138`,
  and `engineering-decisions.md` **E-19**.
- **The workaround this replaces:** `question-bank/src/highest-point-verify.test.ts:430-490`.
  `:463-477` already pins exactly three `highest_point_m` warnings, by calling
  `normalizeUsStates` directly. Criteria 3 and 4 are the same fact, read
  through the CLI.
- **The guards in Constraints:** `climate-kid.test.ts:722-770`,
  `climate-kid-verify.test.ts:940-1020` and `:1210-1222`, and
  `top-crops-verify.test.ts:460-490`.
- **Test rules:** [`test-guidelines.md`](../test-guidelines.md), "Per-area
  specifics" › `question-bank/`, and "Writing tests from acceptance criteria".
- **The origin:** `tasks.md` T-070 (its history) and T-080.

## Handoff

## Verdict

## Notes

- **Survey: nothing in the criteria is already satisfied.** `rebuildOffline`
  returns only a file map, and its `--quiet` means the spawned build prints
  nothing to stdout today (`build.ts:135`). `runBuild` already accepts a `log`
  dependency (`build.ts:123`), so `report()`'s lines *can* be captured in
  process. The entry asks for the real CLI's output, though, and criterion 5
  holds it to that.
- **Correction to the T-070 draft.** The T-070 round's draft criterion 5 said
  "no test spawns `src/build.ts` other than through the harness … and it still
  holds". It does not hold: `refresh.test.ts:194` and `refresh-verify.test.ts:379`
  both spawn it directly, through a constant the guards do not see. This brief
  constrains only the code this task adds (criterion 13). The existing pair is
  queued as **T-082**.
- **Count pinned at 3, on purpose.** It matches
  `highest-point-verify.test.ts:463-477`. A later task that adds a fixture
  warning will have to update both, and that is the point.
- **Split applied** (Dkaattae, 2026-10-06, answering Q2 on the T-070 round). In
  `tasks.md`: T-070 keeps (a) only, re-sized to M and marked as waiting on Q1;
  T-080 (this task) and T-081 are new; T-082 is new from this survey. The full
  T-070 round's questions and survey are in commit `3cedfe8`.
- **The expander did not run the build or the suite** (D-7). Every line number
  above comes from reading the source on this branch.
