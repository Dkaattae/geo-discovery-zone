# T-083 — Retire T-016's source-grep stand-in now the build's stdout is readable

**Status:** `approved`
**Next step:** `human` (merge)
**Approved:** Dkaattae — 2026-10-12, in the orchestrator session ("I approve T083 criteria"). See `runs/T-083-retire-source-grep-stand-in.md`.
**Test changes:** `approved — Dkaattae, 2026-10-12`
**From:** [`tasks.md`](../tasks.md) T-083
**Branch:** `claude/awesome-hamilton-gft1hi`
**PR:** #76, opened draft at expand time, built from the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-12 | cse_01MSfVMBpo6T2CEZcvWpdetK |
| worker | 2026-10-12 | cse_01MSfVMBpo6T2CEZcvWpdetK |
| tester | 2026-10-12 | cse_01U3AvJtbD4ftspuhsxd6PZJ |
| tester | 2026-10-12 | cse_01MSfVMBpo6T2CEZcvWpdetK (orchestrator-spawned subagent; same id as expander/worker, see Verdict) |
| reviewer | 2026-10-12 | cse_01MSfVMBpo6T2CEZcvWpdetK (orchestrator-spawned subagent) |

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
| 1 | `highest-point-verify.test.ts` › "T-016 tester, criterion 8 — a state left without a name says so" › "build.ts's report prints every warning it is given, with no allow-list of fields" (`:432-455`, comment included) | `34a174a`, T-016. It stood in for "`build.ts` prints that warning" by grepping `report()`'s source for a `for…of warnings` loop and no `warnings.filter(`. | Criterion 5: no test may read `build.ts`'s source to check the report. Criterion 6: its comment contains `checked by hand and is`, `cannot live here as a test`, `returns written files, not`. `report-warnings-stdout.test.ts` criteria 1–2 now assert the behaviour on real stdout. A `field === "highest_point"` filter in `report()` turns them red (tester mutation). | delete | — | approved — Dkaattae, in the tester session ("approve 1–4, Dkaattae") |
| 2 | Same file › "T-016 tester, criterion 9 — the full fixture build warns about nothing at all" › "a real offline rebuild of all 50 still produces Alaska's tracked bytes": **comment only** (`:483-487`) | `34a174a`, T-016. It explained where the CLI-stdout warning count came from. | Criteria 6 and 7: it says the check "was run by hand" and gives the "pinned count of 0", but the count above is 3. | modify | Test name, body and assertion unchanged. The comment becomes: "The CLI-stdout side of criterion 9 (the full build prints exactly the three `highest_point_m` warnings) is pinned on real stdout by `build-report-stdout.test.ts` (T-080). This test checks the written bytes through the sanctioned harness (`offline-rebuild.ts`) rather than spawning `build.ts` directly." | approved — Dkaattae, in the tester session ("approve 1–4, Dkaattae") |
| 3 | Same file › file header doc comment (`:28-35`): the criterion 9 and criterion 8 bullets | `34a174a`, T-016. It described how criteria 8 and 9 were verified. | Criterion 7: it says criterion 9's count "is pinned at `0`" (it is 3). It also says criterion 8 "is exercised end to end through the real CLI", which this file never did. | modify | No code changes. The criterion 9 bullet becomes: "the full-fixture warning count is 3: T-079's three `highest_point_m` overrides (its approved test change request row 6) and nothing else. The CLI's stdout carrying that 3 is pinned by `build-report-stdout.test.ts` (T-080)." The criterion 8 bullet becomes: "this file checks the warning in `normalizeUsStates`. The real CLI printing it for a derived fixture is asserted in `report-warnings-stdout.test.ts` (T-083)." | approved — Dkaattae, in the tester session ("approve 1–4, Dkaattae") |
| 4 | Same file › "T-016 tester, criterion 9 — …" › "and no warnings besides the three T-079 highest_point_m overrides": **comment only** (`:469-472`). *Missed by the worker's list.* | `34a174a`, T-016, amended by T-079 row 6. It recorded where the expected count came from. | Criterion 7: "Measured on the default branch … it printed no warning line at all" is a statement that the full-fixture count was measured as 0. It is borderline, because it was true at `284b8bc`. | modify | Test name, body and assertions unchanged. The comment becomes: "The full-fixture count is 3. T-079's three curated overrides each warn once (its test change request row 6, approved; criteria 10–11), and nothing else may. The CLI's stdout carries the same 3, pinned by `build-report-stdout.test.ts`." | approved — Dkaattae, in the tester session ("approve 1–4, Dkaattae") |

**Second tester's note on the request above** (`cse_01MS…`): I wrote my own
four rows independently before I saw `7c957db`, then kept the rows above
because they were pushed first. They name the same four passages with the same
actions. Their wording differs from my dry-run's, but neither version contains
any phrase that criteria 6–7 forbid (none of ``pinned at `0` ``, `count of 0`,
`printed no warning line`, `by hand`). One more item for the approver: the
describe name "T-016 tester, criterion 9 — the full fixture build warns about
nothing at all" also implies a count of 0. Criterion 7 covers comments only, so
no row proposes renaming it. If you want it renamed, say so and it becomes a
fifth row.

## Verdict

_Written by `tester`._

**Pass.** All 18 criteria hold. The full `question-bank` suite is green: **1763 pass, 0 fail**. That is the worker's 1747, minus the one approved deletion, plus the orchestrated tester's 17 verify tests, and its criterion 5–7 tests are now green, and typecheck, lint and format:check all exit 0. Next step: `reviewer`.

**Independence:** this is a separate session (`cse_01U3AvJtbD4ftspuhsxd6PZJ`) from the expander and the worker (`cse_01MSfVMBpo6T2CEZcvWpdetK`). A person started it directly. It was not spawned by the orchestrator.

| # | Verdict | Evidence |
|---|---|---|
| 1–3 | pass | `report-warnings-stdout.test.ts` "T-083 criteria 1–3", on the stdout `rebuildOfflineWithStdout` returns for a derived fixture (Colorado's `capitalLabel` and `highestPoint` removed) and for the committed fixture. |
| 4 | pass | **Mutation:** `report()` skipping `field === "highest_point"` turned criteria 1 and 2 red (6 pass, 2 fail). Reverted. |
| 5 | pass | The `:432` source-grep test was deleted (approved row 1). |
| 6 | pass | A grep of `question-bank/src/` finds no `returns written files, not`, `cannot live here as a test`, `checked by hand and is`, or `was run by` + `hand` (including across a line break). |
| 7 | pass | The header and the `:469` and `:483` comments now say 3 or name no number (rows 2–4). A grep for `pinned at 0`, `count of 0` and `no warning line at all` finds nothing. |
| 8–10 | pass | "T-083 criteria 8–10" via `runBuild(argv, { log })`. **Mutation:** putting back `report(…, log)` turned criterion 8 red. Reverted. |
| 11 | pass | `bun run src/build.ts --help` prints `--quiet                Only print the final summary.` |
| 12 | pass | The `offline-rebuild.ts` doc comment now says the summary is printed and discarded, not that the build prints nothing. |
| 13 | pass | The T-080, T-082 and committed-bank tests are green and unmodified. |
| 14 | pass | The new file spawns nothing. Every spawn guard is green and unmodified. |
| 15 | pass | `git status --porcelain -- question-bank/` is empty after the suite, and no `t083-*` directory is left in `/tmp`. |
| 16 | pass | The harness runs under `DEAD_PROXY`, the in-process builds use `--offline`, and nothing mocks `fetch`. |
| 17 | pass | `package.json` and `bun.lock` are unchanged since `b8f8855`. |
| 18 | pass | All four commands exit 0. The only pre-existing test file changed is `highest-point-verify.test.ts`, and only through approved rows 1–4. |

**Test changes applied** (commit "T-083 tester: apply approved test change request"):
- **Row 1, deleted:** "build.ts's report prints every warning it is given, with no allow-list of fields". It was a source grep standing in for stdout, and is replaced by the real stdout assertions in criteria 1–2.
- **Rows 2–4, modified:** comment text only, at the file header, `:469` and `:483`. They no longer say the count is 0 or that the stdout check was done by hand. No test name, body or assertion changed.
- **Header approval line:** `Test changes: approved — Dkaattae, 2026-10-12`.
- **The person's words, in this session:** "approve 1–4, Dkaattae".

**Observations, not failures:**
- **A stale describe name:** "T-016 tester, criterion 9 — the full fixture build warns about nothing at all" is now untrue, since the count is 3. Criterion 7 covers comments only, so I left it alone. It could go in a later task.
- **A blank line in quiet output:** a quiet build still prints `report()`'s leading blank line (the worker raised this). No criterion forbids it, and criterion 8's summary lines are all present.

### Earlier verdict from the orchestrated tester (`cse_01MS…`), kept as a record

That tester ran at the same time as this one and halted before the rows were approved. It is superseded by the verdict above. Its 17 verify tests (`report-warnings-stdout-verify.test.ts`) and its mutations M1–M4 still stand, and its criterion 5–7 tests are now green.

**TL;DR: not a pass yet. The task is halted at `test changes requested`.**
Criteria 1–4 and 8–18 hold, each tested and checked by mutation. Criteria 5–7
need four comment/test edits to `highest-point-verify.test.ts`, and nobody has
approved them yet. **Next:** a person starts an attended `tester` session for
T-083 and approves or refuses the four rows above. That tester applies them and
reruns everything.

**Independence.** This is an orchestrated run (`runs/T-083-…md` exists), so
every role has the same session id (`cse_01MSfVMBpo6T2CEZcvWpdetK`) and the
Sessions-table check cannot prove anything. My independence comes only from
being a freshly spawned agent with its own context. I did not see the worker's
reasoning. That is weaker evidence than a separate session, because it depends
on the orchestrator having spawned me correctly.

**Tests added:** `question-bank/src/report-warnings-stdout-verify.test.ts`
(17 tests). Expected values are quoted from the criteria, not from the code.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | three tests in "criteria 1–3": one header line, each Colorado line exactly once and after it (derived fixture via `rebuildOfflineWithStdout({ fixture })`) |
| 2 | met | header `<n>` = warning lines after it |
| 3 | met | committed fixture: neither line, and the `Wrote 50 entities…` line is checked so an empty stdout can't pass |
| 4 | met | mutation M1 below turns both test files red |
| 5 | **not yet met** (pending row 1) | criterion 5 tests red: `readFileSync(BUILD_SCRIPT` still present |
| 6 | **not yet met** (pending rows 1–2) | scan of every file under `src/` finds all four phrases, all in `highest-point-verify.test.ts` |
| 7 | **not yet met** (pending rows 2–4) | ``pinned at `0` ``, `count of 0`, `printed no warning line` still present |
| 8 | met | quiet `runBuild` emits `Wrote 50 entities via json → …`, exactly one `3 warning(s):`, and one CT/OK/VA `highest_point_m` line each |
| 9 | met | quiet run has no `Reading fixture`, `row(s) returned$`, `Querying…`, `Fetching…` or `  wrote …` line |
| 10 | met | non-quiet run = the quiet output plus exactly `Reading fixture <default fixture>` and `  50 row(s) returned` (out path masked) |
| 11 | met | in-process `runBuild(["--help"])`, with `console.log` captured and `process.exit` stubbed to throw: the `--quiet` line reads `Only print the final summary.` (also checked by hand with `bun run src/build.ts --help`) |
| 12 | met | `offline-rebuild.ts` has no "prints nothing" |
| 13 | met | new test: `rebuildOffline` output is byte-identical to every `data/us-states/*.json`. T-080/T-082/committed-bank tests are green and unmodified |
| 14 | met | no `Bun.spawn` in either new file; `git diff b8f8855 --` the four spawn guards is empty, and they pass |
| 15 | met | after the full suite, `git status --porcelain -- question-bank/` shows only my then-uncommitted test file, and no `t083-*` dir is left in `/tmp`. One leftover pair showed up from a `-t`-filtered run, where eager builds raced `afterAll`. I made those builds lazy and the leftovers did not come back (3 filtered runs, 2 full runs) |
| 16 | met | harness uses `DEAD_PROXY`; in-process runs are `--offline`; no `fetch` anywhere in either file except a comment |
| 17 | met | `git diff b8f8855 -- package.json bun.lock` empty |
| 18 | met except the criterion 5–7 tests | `bun test`: **1760 pass, 4 fail**. The 4 fails are my criterion 5–7 tests, which are red until the rows are applied. `typecheck`, `lint` and `format:check` exit 0. The worker deleted or modified no pre-existing test |

**Mutations** (all on `src/build.ts`; each was reverted by restoring a saved
copy, and `git status` afterwards showed only my new test file):
- **M1 (criterion 4).** `report()` skips warnings whose `field` is
  `highest_point`. Red: the worker's criteria 1 and 2 tests, and my criterion 1
  `highest_point` test and criterion 2 test. My criterion 1 `capital` test
  stayed green, which is correct.
- **M2.** `report()` gets `log` instead of `print` (the old behaviour). Red:
  criterion 8 (both of my tests and the worker's) and my criterion 10
  equivalence test. I re-ran this after the lazy-build change and got the same
  result.
- **M3.** `--quiet` is ignored (`log = print`). Red: criterion 9 (mine and the
  worker's) and my criterion 10 equivalence test.
- **M4.** `--help` text changed. Red: criterion 11.

**Rows were dry-run.** I applied my own wording of the same four rows (delete row 1; rows 2–4 rewritten to name 3 or no number, row 4 by dropping the two "Measured … no warning line" lines) to a scratch copy of
`highest-point-verify.test.ts` and then restored the file. With them applied,
criteria 5–7 go green, and that file plus `region-vocabulary.test.ts` pass
(122/0), with typecheck, lint and prettier clean. Once the rows are approved
and applied, I expect the whole suite to be green and the verdict to be
**pass**, with Next step `reviewer`.

**Worker's open question.** A quiet build now prints `report()`'s leading
blank line. No criterion forbids that, so I accept it.

## Review

_Written by `reviewer`._

**Approved, inside the envelope.** The code change is one line in `build.ts`
(`report(…, print)`) and a doc comment. The approved test changes match the
diff, and the full suite is green in this session (1763 pass, 0 fail;
typecheck, lint and format:check exit 0). PR #76 is marked ready with no
escalation note.

- **Lanes:** the expander touched only `tasks/` and `tasks.md`. The worker
  changed `build.ts`, `offline-rebuild.ts` and one new test, and did not touch
  `highest-point-verify.test.ts`. The tester changes to that file are only in
  `25a884e`, and they match rows 1–4 exactly. `Test changes:` names Dkaattae,
  not `orchestrator`.
- **Constraints:** nothing outside them. The second new test file
  (`report-warnings-stdout-verify.test.ts`) is the tester's, and `runs/` is the
  orchestrator's log.
- **Fit:** the `print`/`log` split already existed. The fix routes `report()`
  through it and does not add a new flag or path.
- **Docs:** `--help` was already right. `offline-rebuild.ts` now describes what
  it does, and no README mentions `--quiet`.

**Flags disposed:**
- **Blank line in quiet output** (worker, both testers): accepted. It is
  `report()`'s existing separator, and the brief keeps `report()`'s format out
  of scope.
- **Stale describe name** "…the full fixture build warns about nothing at all"
  (both testers): deferred to **T-070**, which already has to edit
  `highest-point-verify.test.ts` under an attended Test change request. I added
  it to that entry rather than opening a one-line task.
- **Tester of record** (orchestrated tester's Fault): the attended session
  `cse_01U3AvJtbD4ftspuhsxd6PZJ`. It was started by a person, applied the
  approved rows and wrote the final pass. The orchestrated tester's verify file
  and mutations stand as additional evidence.
- **Two testers at once:** this is a loop gap, not a task defect. I opened it as
  **P-15** in `process-tasks.md`.

**Not a finding:** `report-warnings-stdout.test.ts` runs its harness builds when
the describe block is collected, not lazily. The orchestrated tester saw temp
directories left over from this pattern only under `-t`-filtered runs. A full
run leaves none, so criterion 15 holds.

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
