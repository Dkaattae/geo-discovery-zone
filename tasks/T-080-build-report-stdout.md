# T-080 — The offline harness returns the build's stdout

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** Dkaattae — 2026-10-06, in the orchestrator session ("approved. you write my name on it"). Stamped by the orchestrator on their instruction. See `runs/T-080-build-report-stdout.md`.
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
| worker | 2026-10-06 | cse_01UvBvo6qodvNQDpFJPANTgN |
| tester | 2026-10-06 | cse_01UvBvo6qodvNQDpFJPANTgN (orchestrated: freshly spawned subagent, same session id; see Verdict) |

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

**TL;DR:** I added a second route to the harness, `rebuildOfflineWithStdout(buildScript, fileNames, tmpPrefix?)`. It returns `{ files, stdout }` from the same spawned `build.ts --offline`, but without `--quiet`. `rebuildOffline` is unchanged on the outside. Whole suite 1657/1657 green, and typecheck, lint and format:check are green. **Tests made stale: none.** The tester is up next. Heads-up: the expander, worker and (per the orchestrator) probably the tester all share session `cse_01UvBvo6qodvNQDpFJPANTgN`. See Notes.

**Files changed**

- `question-bank/src/offline-rebuild.ts`
  - New exported `rebuildOfflineWithStdout` and an `OfflineRebuildReport` interface (`files: Map<string,string>`, `stdout: string`).
  - Both public functions now call one private `runOffline(buildScript, fileNames, tmpPrefix, quiet)`. It holds the spawn, the `DEAD_PROXY` env, the `exitCode !== 0` → `throw new Error` check and the `finally` → `rmSync`. The only difference between the two routes is whether `--quiet` goes on the argv.
  - `DEAD_PROXY` is untouched: same six keys, same values.
- `question-bank/src/build-report-stdout.test.ts`: new, the worker's own checks (8 tests). It does not call `spawnSync`/`spawn`, and it holds no dead-loopback literal.
- Not touched: `src/build.ts`, any existing `*.test.ts`, `data/`, `sample-data/`, `fixtures/`, `package.json`, `bun.lock`.

**Where each criterion lives**

| # | Where |
|---|---|
| 1 | `rebuildOfflineWithStdout` in `offline-rebuild.ts`: one call returns `{ files, stdout }`, and the harness spawns |
| 2-4 | Real output of `report()` (`build.ts:189-210`), now visible because `--quiet` is dropped on this route. Worker tests: "stdout carries the summary line", "exactly one warning header…", "the three lines after it…" |
| 5 | Spawned build, no reimplementation. I checked by mutation: renaming `warning(s):` to `warnings:` in `build.ts` turned the two criterion 3/4 tests red, and I reverted it |
| 6 | `files` comes from the same temp `--out` dir as before. Worker test compares `index.json`, `us-state-ct.json`, `us-state-co.json` to `data/us-states/` |
| 7 | `runOffline` spawns with `env: { ...process.env, ...DEAD_PROXY }`, shared by both routes |
| 8 | `runOffline` throws `offline rebuild exited N: …` on non-zero. Both routes are tested against a missing script |
| 9-10 | `finally { rmSync(out, …) }` in `runOffline`, both routes. Worker tests scan `os.tmpdir()` for the per-call prefix after success and after a throw |
| 11 | `rebuildOffline` signature and `Map<string,string>` return are unchanged |
| 12-15 | Only the two files above changed (check with `git diff --name-status origin/main...HEAD`) |
| 16 | Follows from 7. No new network path |

**Deliberately not done**

- **`build.ts`'s `--quiet` mismatch is left alone.** It is out of scope.
- **T-016's source-grep test and comments are not retired.** They are existing tests, and the brief makes retiring them a follow-up.
- **No `--fixture` parameter.**
- **I did not expose the spawn's env for inspection.** Criterion 7 is visible in the source. If the tester wants a runtime check, the spawn's environment is not returned. That is a choice the tester can question, not a gap I found.

**Contradictions with the brief:** none found.

**How to run** (in `question-bank/`)

- `bun install --frozen-lockfile`. This checkout had no `node_modules`. Without it the first suite run gave 12 fails and the lint/typecheck commands could not be found. It installs nothing new.
- `bun test src/build-report-stdout.test.ts` runs this task's tests.
- `bun test`, `bun run typecheck`, `bun run lint`, `bun run format:check` run the full gates.

**Tests made stale:** none.

## Verdict

**TL;DR: pass.** All 16 criteria hold. I added 14 tester tests in `question-bank/src/build-report-stdout-verify.test.ts`. Nine mutations turned the right tests red, and I reverted all of them. Whole suite 1671/1671, and typecheck, lint and format:check are green. **Next: reviewer.**

**Independence, stated plainly.** This is an orchestrated run (`runs/T-080-build-report-stdout.md` exists), so the session-id check cannot work. `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01UvBvo6qodvNQDpFJPANTgN`, the same id as the expander and worker rows. My independence rests only on being a freshly spawned subagent with its own context. I did not see the worker's session or reasoning. That is weaker than a separate session, because it depends on the orchestrator having spawned me correctly, and nothing I can check confirms that. Weigh this `pass` accordingly.

**Handoff check.** The handoff names `offline-rebuild.ts` and `build-report-stdout.test.ts`. Both are on the branch (`git diff --name-status origin/main...HEAD`).

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | "criterion 1 — one harness call returns files and stdout": one `rebuildOfflineWithStdout` call returns a `Map` of all 51 tracked files and a non-empty stdout. The test spawns nothing |
| 2 | pass | "criterion 2": a line begins `Wrote 50 entities via json → ` |
| 3 | pass | "criterion 3": the lines matching `^\d+ warning\(s\):$` are exactly `["3 warning(s):"]` |
| 4 | pass | "criterion 4": the next 3 lines match `^  entity.field: .+$`, their pairs are exactly CT/OK/VA `highest_point_m` with no duplicates, and the 4th line is not a warning line |
| 5 | pass | Mutations M1 and M2 in `build.ts` (below) turned the criterion 3/4 tests red. Stdout comes from a real spawn through the harness |
| 6 | pass | `index.json`, `us-state-ct.json` and `us-state-co.json` are byte-identical to `data/us-states/`, and so are all 51 tracked files |
| 7 | pass | `DEAD_PROXY` has exactly the six keys, all set to the loopback. **Runtime check:** a stand-in script, run through `rebuildOfflineWithStdout`, prints its own env. All six vars arrive set to the loopback (M3 and M8 turn it red) |
| 8 | pass | Both routes throw on a missing script, with `fileNames: []` so only the exit-code check can throw (M5 turns both red) |
| 9 | pass | No leftover dir with the call's unique prefix after a successful call, on either route (M4) |
| 10 | pass | No leftover dir with the call's unique prefix after a throwing call, on either route (M4) |
| 11 | pass | A type-level pin `(string, string[], string?) => Map<string,string>` plus a runtime `Map` of strings. M9 (return type changed to `Map<string, number>`) makes `bun run typecheck` fail |
| 12 | pass | The diff vs `origin/main` has no `M` or `D` row on any existing `*.test.ts`. Whole suite 1671/1671 pass |
| 13 | pass | `grep -rl "127.0.0.1:1" question-bank/src --include=*.ts` returns only `offline-rebuild.ts`. Neither new test file calls `spawn`/`spawnSync` (the only matches are comments). The existing guards stay green |
| 14 | pass | `git diff --stat origin/main...HEAD` shows nothing in `data/`, `sample-data/` or `src/fixtures/` |
| 15 | pass | Same diff: `package.json` and `bun.lock` are unchanged. `src/build.ts` is unchanged too |
| 16 | pass | Follows from 7, which is checked at runtime. No `fetch` mocks |

**Mutations** (all reverted; `git status` shows only my new test file)

- **M1**, `build.ts` `warning(s):` → `warnings:`: criteria 3 and 4 red.
- **M2**, `build.ts` separator `entity.field` → `entity/field`: criterion 4 red.
- **M3**, harness drops `...DEAD_PROXY` from the spawn env: criterion 7 runtime test red.
- **M4**, harness drops the `rmSync` in `finally`: criteria 9 and 10 red on both routes (4 tests).
- **M5**, harness never throws on a non-zero exit: criterion 8 red on both routes. My first version **survived** this mutation, because it passed `["index.json"]` and the `readFileSync` threw instead. I changed it to `[]`, and now it goes red.
- **M6**, harness always passes `--quiet`: criteria 1 to 4 red.
- **M7**, `build.ts` prints one warning line twice: criterion 4 red.
- **M8**, harness overrides one key (`https_proxy`): criterion 7 runtime test red.
- **M9**, `rebuildOffline` return type changed: typecheck red on the criterion 11 pin.

**Gates** (in `question-bank/`, after `bun install --frozen-lockfile`)

- `bun test`: 1671 pass, 0 fail, 28 files.
- `bun run typecheck`: green.
- `bun run lint`: 0 warnings, 0 errors.
- `bun run format:check`: green.

**Worker's design choice** (a second function sharing one private spawner): confirmed. It keeps criterion 11's signature and gives both routes one isolation path, which M3 and M4 show is exercised on both.

**Tests made stale:** none. I checked: no existing test is modified, deleted or red.

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
- **Worker: design choice (worker decided; tester/reviewer to confirm or overturn).** I added a second function rather than an options flag on `rebuildOffline`, because criterion 11 pins that signature. Both functions share one private spawner, so the isolation and cleanup cannot drift apart. That drift is exactly what T-014's extraction existed to prevent.
- **Worker: environment surprise.** Before `bun install`, I ran `bun run format` by mistake. It auto-fetched some prettier and rewrote the existing `highest-point-metres-verify.test.ts`. I reverted it straight away with `git checkout`, and it is not in the commit. After `bun install`, `format:check` passes on the untouched file. So the rewrite came from a different prettier version, not a real formatting fault.
- **Worker: session isolation (orchestrator/human to note).** `$CLAUDE_CODE_REMOTE_SESSION_ID` gives the same id the expander rows record. The tester's same-session check (process.md step 4) will see a `worker` row with that id if the tester also runs under it. The orchestrator owns how it launches the tester.
