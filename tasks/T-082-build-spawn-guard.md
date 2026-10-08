# T-082 — Two refresh tests spawn `build.ts` past the guard that forbids it

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** Dkaattae (in the orchestrator session, 2026-10-08: "I approve, continue"). The orchestrator did not read the criteria. See `runs/T-082-build-spawn-guard.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-082
**Branch:** `claude/affectionate-wright-jaormy`
**PR:** #75, opened draft against the branch above at expand time. It stays draft until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-08 | cse_01QcjHTfUsm5YqzVagoD4oww |
| worker | 2026-10-08 | cse_01QcjHTfUsm5YqzVagoD4oww (orchestrated subagent; the remote session id is shared by every role the orchestrator spawns, so it cannot tell the roles apart here) |

> **Plan to attend the tester step.** Criteria 6 and 7 can only be met by
> changing two tests that existed before this task (`refresh.test.ts`,
> `refresh-verify.test.ts`). The worker may not do that (D-14). It lists them
> under **Tests made stale**, and the tester raises a Test change request that a
> person approves in the tester's own session (D-15). An unattended tester will
> halt at `test changes requested` / `human`.

## Goal

"No test spawns `build.ts` itself" is a rule three suites claim to enforce, and
two tests break it today because they name the script through a constant. Give
the shared offline harness the one thing those two tests need (a `--fixture`
path), move them onto it, and make the guard catch a spawn through a constant,
so the rule is what the guards say it is.

**Which branch of the queue entry's "Done when".** The entry allows either
"both go through the harness and the guards catch a constant" or "write the
exception down". This brief takes the first: the second would leave three guards
asserting a rule that is false, and T-083 needs the same `--fixture` argument on
the harness anyway.

## Acceptance criteria

**Terms used below.**

- **The harness** is `question-bank/src/offline-rebuild.ts`: its exported
  `rebuildOffline` and `rebuildOfflineWithStdout`.
- **A spawn of `build.ts`** is a call to `Bun.spawnSync(…)` or `Bun.spawn(…)` in a
  tracked `*.test.ts` file under `question-bank/src/` whose argv array literal
  contains an element that is either
  (i) a string or template literal containing `build.ts`, or
  (ii) an identifier declared (`const` or `let`) at any scope in the same file
  whose initialiser contains the text `build.ts` — for example
  `const BUILD = join(PKG, "src/build.ts")` or
  `const BUILD_SCRIPT = join(PKG, "src", "build.ts")`.
- **The guard** is the test (or tests) that rejects a spawn of `build.ts`. It may
  be a new test file, or the widening of one or more of the three existing guards
  (`climate-kid.test.ts:738`, `climate-kid-verify.test.ts:979`,
  `top-crops-verify.test.ts:473`). Widening an existing one is a Test change
  request row; a new file is not. CI's existing `question-bank` `bun test` step
  must run it.
- **Mutation** means the tester pastes the named snippet into a tracked
  `*.test.ts` file under `question-bank/src/` (one that is not the guard's own
  file), runs the guard, records the result in the Verdict, and reverts.

**The harness takes a fixture**

1. Both `rebuildOffline` and `rebuildOfflineWithStdout` can be given a path to a
   main SPARQL fixture, and the offline build they run reads that fixture (with
   its elevation fixture beside it, as `build.ts --fixture` already does).
   Observable: given a copy of `src/fixtures/us-states.sparql.json` and
   `src/fixtures/us-states-elevation.sparql.json` in a temp directory, with
   Colorado's `population` binding changed to `5900001`, the returned
   `us-state-co.json` from **each** entry point parses to `population: 5900001`.
2. With a fixture path, `rebuildOfflineWithStdout`'s returned `stdout` contains
   the line `Reading fixture <absolute path of the fixture given>`.
3. Called without a fixture path, both entry points behave exactly as before:
   every pre-existing caller compiles and runs unchanged in source, and
   `committed-bank.test.ts` passes unchanged.
4. With a fixture path, isolation is unchanged: the spawned build gets all six
   `DEAD_PROXY` variables; a non-zero exit throws; and the temp output directory
   is removed both after a normal return and after a throw. Observable for the
   last two: a call given a fixture path that does not exist throws, and
   afterwards no directory starting with the `tmpPrefix` passed to that call
   remains in `os.tmpdir()`.

**The two refresh tests go through the harness**

5. After the task, no tracked `*.test.ts` under `question-bank/src/` contains a
   spawn of `build.ts`. The Verdict lists every `Bun.spawnSync`/`Bun.spawn` call
   the tester found in those files, with file:line and what it spawns.
6. `refresh.test.ts` › "an offline build from the written fixture reproduces the
   bank byte for byte" obtains its rebuild from the harness, passes on the final
   tree, and still fails in each of three cases (each shown by mutation of a
   temporary copy of the test, then reverted):
   (a) one non-`.review.json` bank file differs from the rebuild by one byte;
   (b) the rebuild contains a non-`.review.json` file the bank does not;
   (c) the bank contains a non-`.review.json` file the rebuild does not.
7. `refresh-verify.test.ts` › "criterion 8: build.ts --offline from the written
   fixture reproduces the bank byte for byte" obtains its rebuild from the
   harness, keeps its `us-state-zz.json` removal setup, passes on the final tree,
   and still fails in each of the three cases (a), (b), (c) of criterion 6, shown
   the same way.

**The guard catches a constant**

Each of 8–11 must turn the guard red, naming the file the snippet was pasted into.

8. Constant from a single-string path:
   `const B = join(PKG, "src/build.ts");` then `Bun.spawnSync(["bun", B, "--offline"]);`
9. Constant from a split path:
   `const B2 = join(PKG, "src", "build.ts");` then `Bun.spawnSync(["bun", B2, "--offline", "--quiet"]);`
10. Async spawn: `Bun.spawn(["bun", "src/build.ts", "--offline"]);`
11. Literal, the shape the existing guards already catch:
    `Bun.spawnSync(["bun", "src/build.ts", "--offline"]);`

**The guard: what it accepts**

12. The guard passes on the final tree. In particular it does not flag a
    constant naming `build.ts` that is passed to the harness
    (`rebuildOffline(BUILD, …)`, as in `committed-bank.test.ts` and others), nor
    a spawn of `git` or of `bun run lint` / `bun run format:check`.
13. The guard fails if its scan finds no `*.test.ts` file under
    `question-bank/src/`, and its scan includes `refresh.test.ts` and
    `refresh-verify.test.ts`.
14. The three existing guards (`climate-kid.test.ts:738`,
    `climate-kid-verify.test.ts:979`, `top-crops-verify.test.ts:473`) and
    `highest-point-verify.test.ts:641` still exist and pass, unless an approved
    Test change request row changed them.

**What must not change**

15. The worker's commits modify or delete no `*.test.ts` file that existed
    before the task. Every modification or deletion of such a file on the branch
    matches an approved row in this brief's Test change request.
16. The only non-test file under `question-bank/` that changes is
    `src/offline-rebuild.ts`. In particular `src/build.ts`, `src/refresh.ts`,
    everything under `data/`, `sample-data/` and `src/fixtures/`, and
    `package.json` and `bun.lock` are unchanged; nothing under `frontend/`,
    `backend/` or `.github/` changes. Outside `question-bank/`, only this brief,
    `tasks.md`, `PROGRESS.md` and `runs/` may change.
17. `src/offline-rebuild.ts` is still the only file under `question-bank/src/`
    containing the dead-loopback proxy literal (the existing checks in
    `climate-kid.test.ts` and `top-crops-verify.test.ts` stay green).
18. No new dependency.
19. No test reaches the network.
20. In `question-bank/`, the full `bun test` suite, `bun run typecheck`,
    `bun run lint` and `bun run format:check` pass on the final tree.

## Out of scope

- **T-083**: retiring `highest-point-verify.test.ts:433-455`'s source grep, its
  comments at `:433-447` and `:478-482`, and the `--quiet` / `--help` mismatch in
  `build.ts` (`:110` vs `:135`). This task only makes `--fixture` available on the
  harness for T-083 to use.
- **T-070 (a)**: the pinned-digest guards and every neutralisation in them.
- **Spawns the definition above does not cover**: a constant imported from
  another module, a spawn through `execFileSync`/`child_process`/`Bun.$`, and a
  package script that runs `build.ts` (`bun run build`, `bun run build:sample`).
  None exists in a test today. If the worker notices one, it is a new queue
  entry, not this branch.
- **Comment-awareness in the guard.** A spawn written only in a comment may be
  flagged or not; nothing requires either.
- **Deleting the three narrower existing guards** or merging them into one. Not
  required. If done, each is a Test change request row.
- **The `main(["--bank", …, "--fixture", …])` tests** in both refresh suites.
  They run `refresh.ts` in-process and do not spawn `build.ts`.

## Constraints

- **Files expected to change:** `question-bank/src/offline-rebuild.ts`; a new
  guard test file (or approved rows widening an existing guard);
  `refresh.test.ts` and `refresh-verify.test.ts` through approved Test change
  request rows only.
- **Who edits what:** the worker extends the harness and writes the guard. The
  guard will be **red** on the worker's tree, because the two refresh tests still
  spawn through a constant. The worker says so in its Handoff and lists both
  refresh tests under **Tests made stale**, with the exact replacement it
  proposes. The tester raises the Test change request and applies only the
  approved rows (D-14, D-15).
- **The guard is subject to its own rule and to the proxy-literal rule.** Its
  own source and any mutation snippet it carries must not match its own scan,
  nor the existing three guards' regexes (`/spawnSync\(\s*\[\s*["']bun["'][^]*?build\.ts/`
  and `/spawnSync\(\s*\[[^\]]*\]/` filtered on `build.ts`), nor contain
  `127.0.0.1:1` as one literal. Build such strings from parts, as
  `climate-kid.test.ts:730` does.
- **The replacement must not weaken the two refresh tests.** Today both compare
  a full directory listing (`snapshot()`), so they catch extra and missing files
  as well as changed bytes. The harness reads only the names it is given; if that
  stays so, the replacement must still detect (b) and (c) of criterion 6 some
  other way.
- **`build.ts --fixture` already exists** (`build.ts:65-69`, help at `:106-108`)
  and implies `--offline`. The elevation fixture is resolved beside the main one
  by `elevationFixtureBeside` (`fixture-transport.ts:22`). No change to
  `build.ts` is needed or allowed (criterion 16).
- **Dependencies:** none. See [`CLAUDE.md`](../CLAUDE.md), "Packages".
- **Gates:** typecheck, lint (warnings fail) and `format:check` in `question-bank/`
  (`conventions.md`).

## Context

Required reading for the worker and the tester.

- **The harness:** `question-bank/src/offline-rebuild.ts`, the whole file —
  `runOffline` at `:87-109` is the one spawn both entry points share.
- **The two direct spawns:** `question-bank/src/refresh.test.ts:191-203`
  (`BUILD_SCRIPT` at `:43`, `snapshot()` at `:86-88`) and
  `question-bank/src/refresh-verify.test.ts:371-389` (`BUILD` at `:42`,
  `snapshot()` at `:105`, `temps` cleanup at `:47-49`).
- **The existing guards and why they miss a constant:**
  `climate-kid.test.ts:738-748` and `top-crops-verify.test.ts:473-483` require the
  text `build.ts` after `spawnSync([ "bun"`; `climate-kid-verify.test.ts:979-989`
  requires it inside the argv array literal. `highest-point-verify.test.ts:641`
  applies the first regex to its own file only.
- **The dead-proxy literal checks** the guard must not trip:
  `climate-kid.test.ts:727-736`, `climate-kid-verify.test.ts:946-959`,
  `top-crops-verify.test.ts:462-471`.
- **`build.ts` CLI:** `question-bank/src/build.ts:60-110` (argument parsing and
  `--help`), `:135-155` (`log`, the `Reading fixture` line, `built_at` from the
  fixture's `captured_at`).
- **Where the defect was found:** `runs/T-080-build-report-stdout.md:78`, and the
  T-082 and T-083 entries in [`tasks.md`](../tasks.md).
- **Rules:** [`test-guidelines.md`](../test-guidelines.md) (no network, no mocked
  `fetch`); `process-decisions.md` D-14 and D-15 (who changes an existing test).

## Handoff

**TL;DR.** The harness now takes `{ fixture }` and returns a `listing` of every
file the build wrote; a new guard (`spawn-guard.test.ts`) catches a spawn of
`build.ts` through a constant or `Bun.spawn`. The guard is **red by design** on
this tree because `refresh.test.ts` and `refresh-verify.test.ts` still spawn
through a constant. **The tester needs a human-approved Test change request** for
the two replacements below (D-14, D-15); I applied both to throwaway copies and
they pass and still fail on (a), (b), (c).

**Suite on the worker's tree** (`question-bank/`): `bun test` 1724 pass, **1 fail**
(the guard's "no tracked test spawns build.ts", listing
`refresh-verify.test.ts:379` and `refresh.test.ts:194`, the expected red);
`bun run typecheck`, `bun run lint` (0 warnings, 0 errors) and
`bun run format:check` pass. Run `bun install --frozen-lockfile` first in a fresh
checkout; without `node_modules` the lint/prettier gate tests fail for an
unrelated reason.

### What changed

- **`question-bank/src/offline-rebuild.ts`**: new `OfflineRebuildOptions { fixture?: string }`
  as an optional fourth parameter on `rebuildOffline` and `rebuildOfflineWithStdout`;
  `runOffline` appends `--fixture <resolve(fixture)>` when given. New field
  `listing: string[]` on `OfflineRebuildReport`: every file in the output dir,
  relative, sorted. No other behaviour changed; the throw (`exitCode !== 0` /
  `throw new Error`) and the `finally` cleanup are untouched.
- **`question-bank/src/spawn-guard.test.ts`** (new): the guard, plus probe tests of
  its scanner. Scans `git ls-files -- question-bank/src` filtered to `*.test.ts`,
  including itself.
- **`question-bank/src/offline-rebuild-fixture.test.ts`** (new): worker's own
  checks for criteria 1, 2, 4 and for `listing`.
- **This brief**: Status, Sessions, Handoff, Notes. Nothing else outside `question-bank/`.

### Criterion → where it lives

| # | Where |
|---|---|
| 1 | `offline-rebuild.ts` `runOffline` (`--fixture` push); checked in `offline-rebuild-fixture.test.ts` "rebuildOffline reads the given fixture" / "rebuildOfflineWithStdout reads it too…" |
| 2 | `build.ts:144` prints `Reading fixture ${args.fixture}` (already resolved there); harness also resolves. Checked in the same file |
| 3 | Optional trailing parameter, default `{}`; no caller edited; whole suite (incl. `committed-bank.test.ts`) green apart from the guard |
| 4 | Same spawn/env/`finally` as before; `offline-rebuild-fixture.test.ts` "a fixture that does not exist throws and leaves no temp dir behind" and "a normal return leaves no temp dir behind" |
| 5 | **Not met until the tester applies the rows below.** Guard currently finds exactly `refresh.test.ts:194` and `refresh-verify.test.ts:379` |
| 6, 7 | Proposed replacements below (tester applies after approval) |
| 8–11 | `spawn-guard.test.ts` `spawnsOfBuild`: (i) any `build.ts` text in the argv array; (ii) identifiers in the argv (strings blanked) that were declared `const`/`let` with an initialiser containing `build.ts`. Probe tests for each shape are in the second `describe` |
| 12 | Only argv arrays of `Bun.spawn(`/`Bun.spawnSync(` are inspected, so `rebuildOffline(BUILD, …)` is not flagged; probes for harness use, git, `bun run lint`/`format:check` |
| 13 | "the scan finds test files, the two refresh suites among them" (`length > 0`, contains both refresh files and itself) |
| 14 | Untouched; all four still pass |
| 15 | No pre-existing `*.test.ts` touched by the worker commit |
| 16, 17, 18 | Only `offline-rebuild.ts` changed among non-test files; no proxy literal added (built from nothing; the new files do not contain it); no dependency |
| 19 | All builds go through the harness with `DEAD_PROXY`; the guard spawns only `git ls-files` |
| 20 | See suite line above; green once the two rows are applied |

### Tests made stale

Both go stale because criterion 5 (and the new guard) forbids their direct spawn
through a constant. Proposed: **modify**, as below. Each keeps
`snapshot()`-style detection of (b) via the harness's `listing`, and (c) because
the harness throws ENOENT reading a bank name the rebuild lacks. After the edit
`DEAD_PROXY` is no longer used in either file, so the import changes too.
`BUILD_SCRIPT` / `BUILD` stay, now passed only to the harness. No count floor
pins either file that I found.

1. **`question-bank/src/refresh.test.ts`** › (describe containing it, at `:191`)
   "an offline build from the written fixture reproduces the bank byte for byte".
   - Line 15: `import { DEAD_PROXY } from "./offline-rebuild";` →
     `import { rebuildOfflineWithStdout } from "./offline-rebuild";`
   - Body after `await changedRun();` becomes:
     ```ts
     const strip = (m: Map<string, string>) =>
       new Map([...m].filter(([name]) => !name.endsWith(".review.json")));
     const bank = strip(snapshot(bankDir));
     // T-082: through the harness. Its `listing` is every file the build wrote,
     // so a file only in the rebuild still fails; one only in the bank makes the
     // harness throw when it reads that name back.
     const { files, listing } = rebuildOfflineWithStdout(
       BUILD_SCRIPT,
       [...bank.keys()],
       "question-bank-refresh-rebuild-",
       { fixture: fixturePath },
     );
     expect(listing.filter((name) => !name.endsWith(".review.json"))).toEqual(
       [...bank.keys()].sort(),
     );
     expect(files).toEqual(bank);
     ```
2. **`question-bank/src/refresh-verify.test.ts`** › "criterion 8: build.ts --offline
   from the written fixture reproduces the bank byte for byte" (`:371`).
   - Line 28: same import change.
   - Keep the sandbox, the `us-state-zz.json` write and the `run(...)` line;
     replace from `const out = mkdtempSync(...)` to the end of the test with:
     ```ts
     const strip = (files: Map<string, string>) =>
       new Map([...files].filter(([name]) => !name.endsWith(".review.json")));
     const bank = strip(snapshot(box.bank));
     // T-082: through the harness, which cleans up its own output directory.
     // `listing` is every file the build wrote; a bank file the rebuild lacks
     // makes the harness throw when it reads that name back.
     const { files: rebuilt, listing } = rebuildOfflineWithStdout(
       BUILD,
       [...bank.keys()],
       "t063-verify-rebuild-",
       { fixture: box.fixture },
     );
     expect(listing.filter((name) => !name.endsWith(".review.json"))).toEqual(
       [...bank.keys()].sort(),
     );
     for (const [name, text] of bank) expect(rebuilt.get(name)).toBe(text);
     ```
   `mkdtempSync`/`tmpdir` stay imported (used elsewhere in the file).

**What I checked on throwaway copies** (`src/__t082_trial_*.test.ts`, deleted
again): both replaced files pass (64 tests), typecheck and prettier clean; and the
byte-for-byte test fails in each of (a) one bank file gets a trailing byte,
(b) a bank file is deleted so the rebuild has an extra, (c) an extra file is added
to the bank, for both files. The tester should redo this as the Verdict's own
evidence.

### Deliberately not done

- **Did not edit either refresh test** (D-14). The guard stays red until the tester applies the rows.
- **Did not widen or delete the three older guards**, nor touch `highest-point-verify.test.ts`. Not required; the new guard is a separate file, so no Test change request row is needed for it.
- **Not covered by the guard**, per the brief's definition and Out of scope: constants imported from another module, `child_process`/`Bun.$`, package scripts, the object form `Bun.spawnSync({ cmd: [...] })`, transitive constants (`const C = B` where `B` names `build.ts`). None exists in a test today.

### Judgment calls (owner named)

- **`listing` added to the report** rather than reading every output file or a third entry point. Why: the brief's harness reads only named files, and (b) needs the full output; a sorted name list is the smallest additive change and keeps both signatures backward-compatible. **Reviewer to confirm or overturn**; T-083 may want it too.
- **Options object as a fourth positional parameter** (`{ fixture }`) rather than a bare string, so T-083 or later can add settings without another positional. **Reviewer to confirm.**
- **The replacements use `rebuildOfflineWithStdout`** (not `rebuildOffline`) because only the report carries `listing`; the stdout is ignored. **Tester to apply as proposed or choose otherwise in the Test change request; reviewer to confirm.**
- **The guard scans tracked files only** (`git ls-files`, which includes staged files), per the brief's definition. A tester's mutation must therefore go into a tracked file, as the brief's "Mutation" term already says.

## Verdict

## Notes

- **Survey (expander, 2026-10-08).** The queue entry's file:line references are
  current. Already true: `build.ts --fixture` works and implies `--offline`; both
  direct spawns already use `DEAD_PROXY`, so nothing reaches the network today;
  `rebuildOfflineWithStdout` exists (T-080). What remains: the harness has no
  fixture parameter, the two tests spawn directly, and no guard catches a
  constant or `Bun.spawn`.
- **Worker (2026-10-08).** Baseline before any change: 1708 pass after
  `bun install --frozen-lockfile` (12 lint/prettier gate failures without
  `node_modules`, environment only). The guard's own source is written so it
  never contains a spawn call name followed by `(` nor `build.ts` in code; its
  doc comment mentions `build.ts` in prose only, which no spawn regex reaches.
  The guard's scanner is a small string-aware bracket matcher, not a parser: an
  apostrophe inside a comment within an argv array could desync it. Acceptable
  for test sources; comment-awareness is out of scope.
- **Sessions table caveat.** `$CLAUDE_CODE_REMOTE_SESSION_ID` returns the same id
  for the expander and the worker because the orchestrator spawns both as
  subagents of one remote session. The tester's "not the same session" check
  cannot be made from this column in an orchestrated run; whoever owns
  `process-tasks.md` should decide whether subagent runs need another
  identifier.
