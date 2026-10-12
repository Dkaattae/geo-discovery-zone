# T-083 — Retire T-016's source-grep stand-in now the build's stdout is readable

**Status:** `test changes requested`
**Next step:** `human`
**Approved:** Dkaattae — 2026-10-12, in the orchestrator session ("I approve T083 criteria"). See `runs/T-083-retire-source-grep-stand-in.md`.
**Test changes:** `requested`
**From:** [`tasks.md`](../tasks.md) T-083
**Branch:** `claude/awesome-hamilton-gft1hi`
**PR:** #76, opened draft at expand time, built from the branch above
**Fault:** test changes are waiting for approval — four rows in `## Test change request`, all in `highest-point-verify.test.ts`.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-12 | cse_01MSfVMBpo6T2CEZcvWpdetK |
| worker | 2026-10-12 | cse_01MSfVMBpo6T2CEZcvWpdetK |
| tester | 2026-10-12 | cse_01U3AvJtbD4ftspuhsxd6PZJ |

> **Plan to attend the tester step.** Criteria 5–7 change an existing test file
> (`question-bank/src/highest-point-verify.test.ts`), and only the tester may do
> that, after a person approves each row in the tester's own session (D-14,
> D-15). Under the orchestrator the run will halt at `test changes requested`;
> resume it by starting a tester in a session you are attending.

## Goal

`highest-point-verify.test.ts` still checks T-016 criterion 8 ("a state with no
highest point warns, and `build.ts` prints that warning") by grepping
`build.ts`'s source, and its comments say no test can read the build's stdout.
Since T-080 and T-082 that is false: the harness returns stdout and builds from a
derived fixture. Replace the stand-in with a real assertion, delete the untrue
comments, and make `build.ts --quiet` do what its `--help` says.

## Survey: what is already true

- **The harness is finished.** `rebuildOfflineWithStdout(buildScript, names,
  prefix, { fixture })` in `question-bank/src/offline-rebuild.ts` builds offline
  from a given main fixture (reading `us-states-elevation.sparql.json` from the
  same directory) and returns `{ files, stdout, listing }`. Nothing to build
  there.
- **`report()` already prints every warning** (`build.ts:189-213`, the loop at
  `:205`). The behaviour T-016 criterion 8 describes probably already holds; the
  work is to *assert* it on real stdout. If criterion 1 turns out to hold
  already, that is the expected outcome, not a reason to change `report()`.
- **The full committed-fixture build's stdout is already pinned** by T-080
  (`build-report-stdout.test.ts:32-46`, `build-report-stdout-verify.test.ts:75-103`:
  exactly `3 warning(s):` and the CT/OK/VA `highest_point_m` lines). This brief
  does **not** ask for that again.
- **What is untrue today:**
  - `highest-point-verify.test.ts:432-455` — the test "build.ts's report prints
    every warning it is given, with no allow-list of fields" reads
    `build.ts`'s source instead of running it, and its comment (`:433-447`) says
    `rebuildOffline` "returns written files, not stdout" and that the behavioural
    half "cannot live here as a test".
  - `highest-point-verify.test.ts:483-487` — says the CLI-stdout check was "run
    by hand" and that this is "where the pinned count of 0 above comes from". The
    count above (`:468`) is 3, not 0.
  - `highest-point-verify.test.ts:28-35` (file header) — says criterion 9's
    count "is pinned at `0`" and that criterion 8 "is exercised end to end
    through the real CLI, on a *derived* fixture". Neither is true of the file
    today.
  - `build.ts:110` — `--help` says `--quiet` means "Only print the final
    summary", but `build.ts:135` makes `--quiet` silence `log` entirely, so
    `report()` prints nothing either.
  - `offline-rebuild.ts:67` — "Passes `--quiet`, so the build prints nothing" is
    accurate today and becomes untrue once criterion 8 lands.

**Direction chosen for `--quiet`.** The queue entry allowed either. This brief
makes the **behaviour** match the help text, not the other way round: a quiet
build still prints its summary and its warnings, because a flag that hides
warnings works against `CLAUDE.md` "Flag uncertain data". The approver may flip
this at approval; if so, criteria 8–12 need rewriting, through the expander.

## Acceptance criteria

**Definitions used below.**
- *The derived fixture*: a copy of `question-bank/src/fixtures/us-states.sparql.json`
  in which Colorado's binding (`stateLabel` = `Colorado`) has no `capitalLabel`
  key and no `highestPoint` key, every other byte of meaning unchanged, written
  to a directory under the OS temp dir alongside an unchanged copy of
  `us-states-elevation.sparql.json`.
- *A warning line*: a stdout line matching `^  [a-z-]+\.[a-z_]+: .+$`.
- *The summary*: the lines `build.ts`'s report emits — the
  `Wrote <n> entit(y|ies) via <sink> → <out>` line, an `Ignored … unmatched`
  line when there are unmatched rows, the `<n> warning(s):` header and one
  warning line per warning when there are warnings, and the
  `… missing core fields: …` line when applicable.
- *Progress lines*: `Reading fixture <path>`, `Querying query.wikidata.org …`,
  `  <n> row(s) returned`, `Fetching Wikipedia summaries …`, and the
  `  wrote <n> draft(s) → …` line.

### T-016 criterion 8 on real stdout

1. An offline build from the derived fixture, run through
   `rebuildOfflineWithStdout` with its `fixture` option, prints a stdout that
   contains the line `  us-state-co.capital: missing` exactly once and the line
   `  us-state-co.highest_point: missing` exactly once, both after the one line
   matching `^\d+ warning\(s\):$`.
2. In that same stdout the `<n>` in the `<n> warning(s):` header equals the
   number of warning lines that follow it.
3. An offline build from the **unmodified** committed fixture, through the same
   harness, prints neither of the two lines named in criterion 1.
4. A committed test under `question-bank/src/` asserts criteria 1 and 3 on the
   stdout the harness returns, and turns red when `report()` is mutated to skip
   warnings whose `field` is `highest_point` (the tester demonstrates this by
   mutation and reverts it).

### The stand-in and the untrue comments

5. `highest-point-verify.test.ts` no longer contains a test that reads
   `build.ts`'s source text to check the report. The test at `:432` ("build.ts's
   report prints every warning it is given, with no allow-list of fields") is
   either deleted or rewritten to assert on the stdout returned by
   `rebuildOfflineWithStdout` — and only as an approved Test change request row.
6. No comment or string in any file under `question-bank/src/` states that a
   test cannot read the build's stdout or report, or that T-016 criterion 8's
   behavioural half could only be checked by hand. Concretely, none of these
   phrases appears anywhere under `question-bank/src/`: `returns written files,
   not`, `cannot live here as a test`, `checked by hand and is`, `was run by`
   followed (across a line break or not) by `hand`.
7. No comment in `highest-point-verify.test.ts` states that the full-fixture
   warning count is pinned at, or measured as, `0` (the `:28-35` header and
   `:483-487` passages). Any remaining statement of that count says 3, or names
   no number.

### `--quiet` does what `--help` says

Observed in-process through `runBuild(argv, { log })` with `log` collecting
lines — the CLI passes no `log`, so these lines are its stdout. Every run below
uses `--offline` and an `--out` under the OS temp dir.

8. `runBuild(["--offline", "--out", <tmp>, "--quiet"], { log })` on the
   committed fixtures emits the summary: a line beginning
   `Wrote 50 entities via json → `, exactly one line `3 warning(s):`, and the
   three warning lines for `us-state-ct.highest_point_m`,
   `us-state-ok.highest_point_m` and `us-state-va.highest_point_m`.
9. That same `--quiet` run emits no progress line: no line beginning
   `Reading fixture`, none matching `row\(s\) returned$`, none beginning
   `Querying query.wikidata.org`, none beginning `Fetching Wikipedia summaries`.
10. Without `--quiet`, the same call emits the summary of criterion 8 **and**
    the progress lines `Reading fixture <path>` and `  50 row(s) returned` —
    i.e. the non-quiet output keeps every line it has today.
11. `bun run src/build.ts --help`'s description of `--quiet` still reads
    `Only print the final summary.` (unchanged).
12. No comment in `offline-rebuild.ts` says that `--quiet` makes the build print
    nothing.
13. `rebuildOffline` (which passes `--quiet`) still returns files byte-identical
    to the tracked `question-bank/data/us-states/` — the existing T-080/T-082
    tests that pin this stay green unmodified.

### What must not happen

14. No test spawns `build.ts` itself: `spawn-guard.test.ts` and the three older
    spawn guards pass unmodified, and the new stdout assertions go through
    `offline-rebuild.ts`.
15. No committed fixture or bank file changes: on a clean checkout of the task
    branch, after the full suite runs, `git status --porcelain -- question-bank/`
    is empty, and no directory with a
    new test's temp prefix is left in the OS temp dir.
16. No network: every new build runs under `DEAD_PROXY` (the harness does this)
    or in-process with `--offline`; nothing mocks `fetch`.
17. No new dependency: `question-bank/package.json` and
    `question-bank/bun.lock` are unchanged.
18. In `question-bank/`, `bun test`, `bun run typecheck`, `bun run lint` and
    `bun run format:check` all exit 0. No pre-existing test other than those in
    an approved Test change request row is deleted or modified.

## Out of scope

- **T-070 (a)** — the pinned-digest guards and their neutralisations in
  `highest-point-verify.test.ts` and the other three guards. Do not touch
  `DEFAULT_BRANCH_DIGESTS` or any hashing helper, even though they sit in the
  same file.
- **T-016 criterion 9's stdout assertion.** Already done by T-080; do not
  duplicate it. Only the untrue *comment* about it is in scope (criterion 7).
- **T-077** (bare-QID labels) and **T-078** (`build.ts`'s live fun-fact pass,
  `regenerate_with`), though both touch `build.ts`.
- `refresh.ts`'s output, and any flag other than `--quiet` and `--help`'s
  `--quiet` line.
- Changing what `report()` prints when not quiet, or its line format.
- `rebuildOffline`'s signature, return type or `--quiet` argument.
- Editing the committed fixtures in `src/fixtures/` — derive, never edit
  (`test-guidelines.md`, "Fixtures are recordings").

## Constraints

- **Files expected to change:** `question-bank/src/build.ts` (the `--quiet`
  behaviour), `question-bank/src/offline-rebuild.ts` (doc comment only), one new
  test file under `question-bank/src/` for criteria 1–4 and 8–10, and
  `question-bank/src/highest-point-verify.test.ts` **only via approved Test
  change request rows** (criteria 5–7).
- **The worker does not edit `highest-point-verify.test.ts` at all** — not even
  its comments. It lists the `:432` test and the `:28-35`, `:433-447`,
  `:483-487` passages under **Tests made stale** with the delete-or-modify it
  proposes. The tester raises the request; a person approves it in the tester's
  session (D-14, D-15).
- **Invariants:** the built bank is byte-identical before and after
  (`committed-bank.test.ts` stays green); `runBuild`'s return value is unchanged
  by `--quiet`.
- **Spawning:** never `Bun.spawn`/`Bun.spawnSync` with `build.ts` in a test, by
  literal or by constant (`spawn-guard.test.ts`). Use `rebuildOfflineWithStdout`
  or call `runBuild` in-process.
- **Dependencies:** none (`CLAUDE.md` "Packages").
- **Worker model:** Sonnet is enough; this is mechanical.

## Context

Required reading for the worker and the tester.

- `tasks.md` T-083 — the queue entry this expands.
- `question-bank/src/highest-point-verify.test.ts` — header `:12-39`, the
  criterion 8 block `:405-456`, the criterion 9 block `:458-491`.
- `question-bank/src/offline-rebuild.ts` — the whole file;
  `rebuildOfflineWithStdout` and `OfflineRebuildOptions.fixture`.
- `question-bank/src/build.ts` — `printHelp` `:94-112`, `runBuild` `:132-187`
  (`log` vs `print` at `:134-135`), `report` `:189-213`.
- `question-bank/src/normalize.ts:127` and `:134` — where the `capital` and
  `highest_point` "missing" warnings come from.
- `question-bank/src/offline-rebuild-fixture.test.ts` and
  `offline-rebuild-fixture-verify.test.ts` — how T-082 derives a fixture into a
  temp dir with the elevation fixture beside it.
- `question-bank/src/build-report-stdout.test.ts`,
  `build-report-stdout-verify.test.ts` — the existing full-build stdout pins
  (do not duplicate).
- `question-bank/src/spawn-guard.test.ts` — what counts as spawning `build.ts`.
- `test-guidelines.md` — "No network in tests", "Fixtures are recordings".
- `.claude/agents/tester.md` "Stale or wrong tests", `process.md` step 4 —
  how criteria 5–7 get applied.
- `process-decisions.md` D-14, D-15.

## Handoff

_Written by `worker`._

**TL;DR:** `--quiet` now keeps the summary and warnings and drops only progress
lines; a new test pins criteria 1–4 and 8–10 on real stdout. Whole suite green
(1747 pass, 0 fail), typecheck/lint/format clean. Criteria 5–7 are untouched by
design and are the tester's to raise as Test change request rows.

**Files changed**

- `question-bank/src/build.ts` — `runBuild` passes `print` (not `log`) to
  `report()`, so `--quiet` silences progress only. Comment added at the
  `print`/`log` split. `--help` text unchanged. Return value unchanged.
- `question-bank/src/offline-rebuild.ts` — doc comment of `rebuildOffline` no
  longer says `--quiet` makes the build print nothing (criterion 12). No code change.
- `question-bank/src/report-warnings-stdout.test.ts` — new. Criteria 1–3 via
  `rebuildOfflineWithStdout` on a derived fixture (Colorado's `capitalLabel`
  and `highestPoint` keys deleted, elevation fixture copied beside it, all in a
  `t083-<pid>-` temp dir removed in `afterAll`); criteria 8–10 in-process via
  `runBuild(argv, { log })` with `--offline`; plus a check that `--quiet` does
  not change `runBuild`'s return value.

**Where each criterion lives**

| # | Where |
|---|---|
| 1–3 | `report-warnings-stdout.test.ts`, describe "T-083 criteria 1–3"; behaviour already held in `report()` (no change needed there) |
| 4 | same tests. Worker ran the mutation (`report()` skipping `field === "highest_point"`): criteria 1 and 2 tests went red; reverted. Tester to repeat |
| 5–7 | **not done — tester's job** (see Tests made stale) |
| 8–10 | `build.ts` `runBuild` → `report(..., print)`; tests in describe "T-083 criteria 8–10". Reverting the one-line change turns criterion 8 red (worker checked) |
| 11 | `build.ts` `printHelp`, untouched |
| 12 | `offline-rebuild.ts` `rebuildOffline` doc comment |
| 13 | existing T-080/T-082/committed-bank tests, green unmodified |
| 14 | no spawn in the new file; spawn guards green |
| 15 | `git status --porcelain -- question-bank/` empty after suite (besides this branch's own edits pre-commit); no `t083-*` dir left in tmp |
| 16 | harness uses `DEAD_PROXY`; in-process runs are `--offline`; no `fetch` mock |
| 17 | `package.json`, `bun.lock` unchanged |
| 18 | `bun test` 1747/0, `typecheck` 0, `lint` 0, `format:check` 0 |

**Tests made stale** — all in `question-bank/src/highest-point-verify.test.ts`.
None is red (the source grep still matches, since `report()` still has no
filter); they are stale because they are untrue, per criteria 5–7.

- `T-016 tester, criterion 8 — a state left without a name says so` >
  `build.ts's report prints every warning it is given, with no allow-list of fields`
  (`:432-455`, comment `:433-447`) — criteria 5 and 6. Proposed: **delete** it.
  Its behaviour is now asserted on real stdout by
  `report-warnings-stdout.test.ts` criteria 1–2, which also catches a
  field allow-list by mutation. Deleting it also removes the `checked by hand
  and is`, `cannot live here as a test`, `returns written files, not` phrases.
  Count floors: none found. The file's "pins above are not vacuous" block
  (`:714`) counts digests and states, not tests; `region-vocabulary.test.ts`
  greps this file only for its region neutralisation, which the deletion does
  not touch.
- Same file, `T-016 tester, criterion 9 — …` > `a real offline rebuild of all
  50 still produces Alaska's tracked bytes`, comment `:483-487` — criteria 6
  and 7 (`was run by hand`, "pinned count of 0"). Proposed: **modify the
  comment only** to say the CLI-stdout warning count (3) is pinned by
  `build-report-stdout.test.ts`, with no "by hand" claim. Test body unchanged.
- File header `:28-35` — criterion 7. Proposed: **modify** the two bullets to
  say criterion 9's count is 3 (T-079's three `highest_point_m` overrides) and
  criterion 8's stdout half is asserted in `report-warnings-stdout.test.ts`.

**Deliberately not done**

- Did not touch `highest-point-verify.test.ts` at all (Constraints).
- Did not change `report()`'s format; a quiet build still prints the leading
  blank line `report()` has always emitted (it goes through `print` now). Not
  forbidden by any criterion; tester to confirm it is acceptable.

**How to run**

```
cd question-bank && bun install --frozen-lockfile   # node_modules was absent in this sandbox
bun test src/report-warnings-stdout.test.ts
bun test && bun run typecheck && bun run lint && bun run format:check
```

## Test change request

_Written by `tester`._ All rows are in `question-bank/src/highest-point-verify.test.ts`. Every row was added by `34a174a` (T-016 tester: verify all 16 criteria). None of them is red; they are stale because criteria 5–7 make them untrue. No count floor covers this file (the `:714` block counts digests and states, not tests), so deleting a test needs no floor row.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `highest-point-verify.test.ts` › "T-016 tester, criterion 8 — a state left without a name says so" › "build.ts's report prints every warning it is given, with no allow-list of fields" (`:432-455`, comment included) | `34a174a`, T-016. It stood in for "`build.ts` prints that warning" by grepping `report()`'s source for a `for…of warnings` loop and no `warnings.filter(`. | Criterion 5: no test may read `build.ts`'s source to check the report. Criterion 6: its comment contains `checked by hand and is`, `cannot live here as a test`, `returns written files, not`. `report-warnings-stdout.test.ts` criteria 1–2 now assert the behaviour on real stdout. A `field === "highest_point"` filter in `report()` turns them red (tester mutation). | delete | — | |
| 2 | Same file › "T-016 tester, criterion 9 — the full fixture build warns about nothing at all" › "a real offline rebuild of all 50 still produces Alaska's tracked bytes": **comment only** (`:483-487`) | `34a174a`, T-016. It explained where the CLI-stdout warning count came from. | Criteria 6 and 7: it says the check "was run by hand" and gives the "pinned count of 0", but the count above is 3. | modify | Test name, body and assertion unchanged. The comment becomes: "The CLI-stdout side of criterion 9 (the full build prints exactly the three `highest_point_m` warnings) is pinned on real stdout by `build-report-stdout.test.ts` (T-080). This test checks the written bytes through the sanctioned harness (`offline-rebuild.ts`) rather than spawning `build.ts` directly." | |
| 3 | Same file › file header doc comment (`:28-35`): the criterion 9 and criterion 8 bullets | `34a174a`, T-016. It described how criteria 8 and 9 were verified. | Criterion 7: it says criterion 9's count "is pinned at `0`" (it is 3). It also says criterion 8 "is exercised end to end through the real CLI", which this file never did. | modify | No code changes. The criterion 9 bullet becomes: "the full-fixture warning count is 3: T-079's three `highest_point_m` overrides (its approved test change request row 6) and nothing else. The CLI's stdout carrying that 3 is pinned by `build-report-stdout.test.ts` (T-080)." The criterion 8 bullet becomes: "this file checks the warning in `normalizeUsStates`. The real CLI printing it for a derived fixture is asserted in `report-warnings-stdout.test.ts` (T-083)." | |
| 4 | Same file › "T-016 tester, criterion 9 — …" › "and no warnings besides the three T-079 highest_point_m overrides": **comment only** (`:469-472`). *Missed by the worker's list.* | `34a174a`, T-016, amended by T-079 row 6. It recorded where the expected count came from. | Criterion 7: "Measured on the default branch … it printed no warning line at all" is a statement that the full-fixture count was measured as 0. It is borderline, because it was true at `284b8bc`. | modify | Test name, body and assertions unchanged. The comment becomes: "The full-fixture count is 3. T-079's three curated overrides each warn once (its test change request row 6, approved; criteria 10–11), and nothing else may. The CLI's stdout carries the same 3, pinned by `build-report-stdout.test.ts`." | |

## Verdict

_Written by `tester`._

## Notes

- The expander did not run the build or the suite (D-7). Line numbers above were
  read from the default branch at `b8f8855`.
- Considered and rejected: changing `--help` to say `--quiet` prints nothing.
  Cheaper, but leaves a quiet build hiding its warnings.
- Worker: the brief's Status read `awaiting approval` while the Approved line
  named Dkaattae; treated the Approved line as authoritative and started.
- Worker: in a fresh sandbox `node_modules` was missing, so a first `bun run
  format` used a different prettier and reformatted a pre-existing test
  (`highest-point-metres-verify.test.ts`); that edit was reverted before
  commit. Run `bun install --frozen-lockfile` first.
- Worker: oxlint's `unicorn/prefer-string-starts-ends-with` rejects
  `/…$/.test(l)`, so criterion 9's "matching `row\(s\) returned$`" is
  checked as `l.endsWith("row(s) returned")` — same meaning.
