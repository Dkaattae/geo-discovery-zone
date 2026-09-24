# T-074 — Three READMEs state suite sizes nothing checks

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** katechen150621@gmail.com — 2026-09-24, approved via chat in the orchestrator session. See `runs/T-074-readme-suite-counts.md`.
**From:** [`tasks.md`](../tasks.md) T-074
**Branch:** `claude/happy-knuth-slmllf`. This is the branch this session was
assigned. Every later role pushes here, not to `task/T-074-*`
(`CLAUDE.md` "Branches", `process.md` "When the environment names the branch for
you").
**PR:** #58, opened draft at expand time from the branch above.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-24 | cse_01VbP99X5Wcy9gLq5di9UETL |
| worker | 2026-09-24 | cse_01VbP99X5Wcy9gLq5di9UETL |
| tester | 2026-09-24 | cse_01VbP99X5Wcy9gLq5di9UETL (orchestrated; shared id, see Verdict) |

## Goal

`backend/README.md`, `backend/integration/README.md` and `e2e/README.md` each
state how many tests a suite has, and at least two of those figures are already
wrong in the tree (the integration suite is not 28). T-065 (PR #57) deleted the
same kind of figure from three other docs and put a guard behind the deletion.
This task does the same for these three READMEs with **the same guard**. It also
closes two gaps T-065's reviewer left in that guard: two live `PROGRESS.md`
sections it does not scan, and a header that credits the wrong role as author.

## Already true before this task starts

Surveyed 2026-09-24 by reading files. Nothing was run. None of this is work for the worker.

- **The detector exists.** `hasSuiteCountClaim()` in
  `frontend/src/stale-suite-counts.criteria.test.ts:122` already fires only on
  the *plural* "tests", splits on clause boundaries, and knows digits,
  thousands commas and number words past twenty. The "one test" prose that
  `tasks.md` worried about when this entry was filed is therefore already
  handled. That is why this task is smaller than when it was filed.
- **The guard already runs inside `frontend`'s `bun test`**, reading files
  from the repo root. No new runner, package or dependency is needed.
- **`PROGRESS.md`'s `## Known gaps in what is done` and `## Next` sections do
  not appear to state a count of tests today** (T-065's reviewer said so, and a
  read of `PROGRESS.md:960-end` agrees). So widening the guard to them should
  not require editing `PROGRESS.md`. If the worker finds that it does, it must
  say so in the Handoff rather than quietly reword.
- **Nothing reads the three READMEs today.** No test, workflow or Makefile
  references `backend/README.md`, `backend/integration/README.md` or
  `e2e/README.md` (grep, 2026-09-24). Editing them breaks no existing assertion.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

**Definitions used below:**

- **Count claim**: a number within five words before the plural word `tests`,
  inside one clause. The number may be digits (thousands commas included), an
  English number word, a hyphenated compound (`twenty-one`), or a scale word
  (`hundred`, `thousand`). A clause does not cross a sentence end, a blank line,
  or the start of a list item, heading or table row. This is exactly what
  `hasSuiteCountClaim()` detects as of the branch point, and the definition is
  written here so the tester need not read the implementation to get it.
- **The guard**: `frontend/src/stale-suite-counts.criteria.test.ts`.
- **Turns the guard red**: running `bun test` on the guard file, with the named
  edit applied to a copy of the repo, exits non-zero. The real repo files are
  never edited to check this. T-065's tester harness in
  `frontend/src/stale-suite-counts-guard.criteria.test.ts` (`guardPassesWith`)
  is the existing way to do it.

Line numbers are as of the branch point. The quoted text is the reliable
locator once a file moves.

### The figures go

1. **`backend/README.md` contains no count claim anywhere.** Gone: `:10`'s
   `221 tests on SQLite` and `:12`'s `28 tests against a real docker compose
   stack`.

2. **`backend/README.md` states no number of Postgres-only tests.** No
   occurrence of `Postgres-only` in the file has a digit or number word as the
   word immediately before it. Gone: `:10`'s `(9 Postgres-only ones skip)`.
   This one is not a count claim, because it says "ones" and not "tests". That
   is why it gets its own criterion.

3. **`backend/README.md`'s first command block still names the same five
   targets**: `make -C backend dev`, `make -C backend test`,
   `make -C backend test-postgres`, `make -C backend test-integration`,
   `make -C backend check`. The line naming `make -C backend test` (the target
   followed by whitespace, not `-postgres` or `-integration`) still contains
   both `SQLite` and `skip`. Only the numbers go.

4. **`backend/integration/README.md` contains no count claim anywhere.** Gone:
   `:3`'s `28 tests that talk to a running server`, `:18`'s `the right shape for
   221 tests`, and `:54`'s `23 tests pass that way; the 5 restart tests skip`.

5. **`backend/integration/README.md` keeps what those sentences said.** The
   text before the first `##` heading still contains `over HTTP` and
   ``never import `app` ``. The `## Known limits` section still contains
   `restart tests` and `skip`.

6. **`e2e/README.md` contains no count claim anywhere.** Gone: `:3`'s `13
   Playwright tests`.

7. **`e2e/README.md` keeps what that sentence said.** The text before the first
   `##` heading still contains `Playwright` and `Chromium`.

8. **The singular prose survives, unchanged.** `e2e/README.md` still contains
   `one test with a loop rather`. `backend/integration/README.md` still contains
   `Every test makes its own account`. The guard passes on the finished tree,
   which contains both.

### The guard covers the three READMEs

9. **Each README's original claim, restored alone, turns the guard red.** Three
   separate edits, each on its own copy:
   - (a) `backend/README.md`: `make -C backend test` line's comment gets
     `# 221 tests on SQLite` back.
   - (b) `backend/integration/README.md`: the first paragraph reads ``28 tests
     that talk to a running server over HTTP and never import `app`.`` again.
   - (c) `e2e/README.md`: the first paragraph starts `13 Playwright tests that
     drive Chromium` again.

10. **A count written in words or across a list comma also turns it red, in
    each README.** Appending `The suite has thirty tests.` as a new paragraph
    at the end of each README turns the guard red. Separately, appending `The
    suite has 221 unit, endpoint and contract tests.` to each also turns it
    red. That makes six edits, each on its own copy.

11. **A restored Postgres-only number turns the guard red.** On
    `backend/README.md`, the `make -C backend test` line's comment gets `(9
    Postgres-only ones skip)` back with no `tests` count beside it: red.
    Separately, `(nine Postgres-only ones skip)`: red.

12. **The READMEs are checked by the same detector as the other docs.** The
    count-claim check applied to the three READMEs is the same function the
    guard applies to `test-guidelines.md` and `PROGRESS.md`. The worker's
    commits add no second implementation of count-claim detection. (This binds
    the guard, not the tester: an independent detector written *to verify* this
    task, as T-065's tester wrote one, is not a violation.) T-065's criterion-10 test ("the two README detectors stay
    two", `stale-suite-counts-guard.criteria.test.ts:271`) still passes
    unmodified.

### The guard covers the rest of `PROGRESS.md`'s live status

13. **A count in `## Known gaps in what is done` turns the guard red.**
    Inserting the line `The frontend suite has 9 tests.` directly after the
    `## Known gaps in what is done` heading: red.

14. **A count in `## Next` turns the guard red, down to the end of the file.**
    Inserting the same line directly after the `## Next` heading: red.
    Separately, appending it as the last line of the file, below `### Deferred
    on purpose (§3.9)`: red.

15. **The history section stays unguarded, on both edges.** Inserting the same
    line directly after the `## Completed tasks` heading leaves the guard
    green. Inserting it on the line directly *before* the `## Known gaps in
    what is done` heading, which is the last line of the history section, also
    leaves it green. The three T-001/T-010/T-014 figures that T-065 criterion 8
    protects (`19 tests`, `190 tests were added (19 → 209)`, `200 tests`) are
    still present in `PROGRESS.md`.

16. **A renamed heading fails loudly rather than shrinking the scan.** Renaming
    `## Known gaps in what is done` to anything else turns the guard red.
    Separately, renaming `## Next` to anything else turns it red. The guard
    must never pass because it scanned an empty or wrong slice.

### The guard's own record

17. **The guard's header credits the right author.** The file-level comment in
    `frontend/src/stale-suite-counts.criteria.test.ts` no longer says it was
    written "by the verifying session", and it names the `worker` as the role
    that wrote it. It also names T-074 as having extended it.

### Nothing else moves

18. **T-065's tester harness still holds.** Every `test(...)` in
    `frontend/src/stale-suite-counts-guard.criteria.test.ts` at the branch
    point still exists under the same name and passes. None of them is
    deleted, skipped (`.skip`, `.todo`, `.if(false)`) or has its expected
    value changed. That includes "the guard passes on unedited copies".

19. **The whole frontend gate is green.** `bun test`, `bun run typecheck` and
    `bun run lint` all pass in `frontend/`.

20. **No new dependency.** `frontend/package.json` and `frontend/bun.lock` are
    unchanged, and so is every other `package.json`, `bun.lock`,
    `pyproject.toml` and `uv.lock`.

21. **No network.** No test added or changed reaches the network. Any `bun`
    subprocess a test spawns runs with every proxy variable pointed at a dead
    loopback port, as `guardPassesWith` does today.

22. **The worker's and tester's commits stay inside their files.** Outside
    `tasks/T-074-readme-suite-counts.md`, the only files those commits change
    are `backend/README.md`, `backend/integration/README.md`, `e2e/README.md`,
    and test files under `frontend/src/`. They change nothing under
    `backend/app/`, `backend/tests/`, `question-bank/`, `.github/`, `.claude/`,
    and they leave `openapi.yaml`, `PROGRESS.md` and `tasks.md` alone. (The
    expander's and reviewer's own edits to `tasks.md` and `PROGRESS.md` are
    expected bookkeeping, per `process.md` step 6, and are not counted here.)

## Out of scope

- **`tasks.md`'s §A "Test counts in docs" row and `PROGRESS.md`'s Known-gaps
  bullet about T-074** (`PROGRESS.md:1007-1011`). Both describe the pre-task
  state and will be stale once this lands. Correcting them is the reviewer's
  sweep, not the worker's diff (criterion 22).
- **Any other doc's counts.** That includes `question-bank/README.md`,
  `frontend/README.md`, `conventions.md`, `runs/` and `PROGRESS.md`'s
  `## Completed tasks` history. The history keeps its figures on purpose (T-065
  criterion 8). If another live doc turns out to state a count, file it as a
  `tasks.md` entry in the Handoff; do not fix it here.
- **Counts that are not counts of tests.** Examples: "15 states and 26
  questions", "29 operations", "13 regions". The guard targets suite sizes
  only, and widening it to other nouns is a different decision.
- **Merging, renaming or refactoring the other two README detectors**
  (`conventions-doc.test.ts`'s `testCountPattern`,
  `readme-test-count.criteria.test.ts`'s `testCountClaims()`). T-065 criterion
  10 keeps them separate.
- **Anything in T-070**: git baselines, digest guards, `rebuildOffline()`
  stdout.
- **Rewording README prose beyond what removing a number needs.** Criteria 3, 5
  and 7 say what must survive. The rest of each file should read as it did.

## Constraints

- **Files expected to change:** `backend/README.md`,
  `backend/integration/README.md`, `e2e/README.md`,
  `frontend/src/stale-suite-counts.criteria.test.ts`. Also, very likely,
  `frontend/src/stale-suite-counts-guard.criteria.test.ts` (see the next
  bullet). A new criteria test file under `frontend/src/` is fine if the worker
  wants one.
- **Watch the T-065 harness's input list.** `guardPassesWith()` copies the guard
  file plus a **fixed list** of the files it reads (`GUARD_INPUTS`,
  `stale-suite-counts-guard.criteria.test.ts:286-291`) into a scratch tree. A
  guard that starts reading three more files will throw on load in that scratch
  tree unless those files travel with it, and "the guard passes on unedited
  copies" goes red. Keeping that harness working is criterion 18. Adding inputs
  to the list is allowed. Weakening, skipping or deleting a test is not.
- **One detector.** Reuse `hasSuiteCountClaim()` (criterion 12). The
  Postgres-only check (criterion 11) is a different shape and may be its own
  small check, but it must not re-implement count-claim detection.
- **Invariant:** the `## Completed tasks` history in `PROGRESS.md` is never
  scanned (criterion 15).
- **Dependencies:** none. Ask first (`CLAUDE.md` "Packages").
- **No network in tests** (`CLAUDE.md` "Tests"; `test-guidelines.md`, "No
  network in tests, ever").
- **Worker model:** mechanical. Sonnet is enough (`process.md`, "Choosing the
  worker's model").

## Context

**Required reading for the worker and the tester.**

- `frontend/src/stale-suite-counts.criteria.test.ts`: the guard being extended.
  `hasSuiteCountClaim()` is at `:122`, `clauses()` at `:108`, the
  `PROGRESS.md` split at `:143-157`. The misattributed header is at `:5-7`.
- `frontend/src/stale-suite-counts-guard.criteria.test.ts`: T-065's tester
  harness. `guardPassesWith()` and `GUARD_INPUTS` are at `:285-322`, and the
  `aboveHistory`/`belowHistory` edit helpers are at `:324-331`. It shows how
  to run "turns the guard red" as a test.
- `backend/README.md:8-15`, `backend/integration/README.md:1-20` and `:50-58`,
  and `e2e/README.md:1-5`: the text being changed.
- `PROGRESS.md`: `## Completed tasks` (`:264`), `## Known gaps in what is done`
  (`:960`), `## Next` (`:1039`) through the end of the file.
- `tasks.md` T-074: the queue entry, including the reviewer's two additions.
- PR #57: T-065's criteria and verdict, which is the precedent this task
  follows.
- `test-guidelines.md`: "No network in tests, ever".
- `backend/tests/test_postgres.py`: defines the Postgres-only tests the
  README's "9" referred to. Criterion 2 removes the number rather than checking
  it against this file.

## Handoff

**TL;DR:** the counts are gone from all three READMEs, and the T-065 guard now
scans those READMEs and `PROGRESS.md` from `## Known gaps in what is done` to the
end of the file. I ran all 18 edit criteria (9–16) against scratch copies and
each came out as the brief expects. Lint is clean. `bun test` and `typecheck`
each show one failure, the same one on the base commit: `react-simple-maps` and
`us-atlas` cannot be installed here (see "Gate" below).

**The Sessions table shows the same session id for the expander and the
worker** (`cse_01VbP99X5Wcy9gLq5di9UETL`). That is the orchestrator's session id
passed down; `$CLAUDE_CODE_REMOTE_SESSION_ID` returned it for this subagent too.
The tester should still run in a fresh context. **Owner: orchestrator/human**, to
decide whether per-subagent ids are recordable at all.

### Files changed

- **`backend/README.md`**
  - `:10` is now `# the suite on SQLite (the Postgres-only ones skip)`.
  - `:12` is now `# the integration suite against a real docker compose stack`.
- **`backend/integration/README.md`**
  - `:3`: `28 tests that talk…` became `Tests that talk…`.
  - `:18`: `for 221 tests` became `for the unit and endpoint tests`.
  - `:54`: `23 tests pass that way; the 5 restart tests skip` became
    `Everything else passes that way; the restart tests skip`.
- **`e2e/README.md`**
  - `:3`: `13 Playwright tests…` became `Playwright tests…`.
  - `:51`: the heading `## Two things these tests found` became
    `## Two things the suite found`. **This is a change the brief did not
    list.** The detector reads that heading as a count claim ("two" is three
    words before "tests"), so criterion 6 could not pass without it. I kept
    "Two" and dropped "tests". Nothing links to the old anchor (checked with
    grep).
- **`frontend/src/stale-suite-counts.criteria.test.ts`** (the guard)
  - **Header (criterion 17):** now says T-065's `worker` wrote it and that
    T-074's `worker` extended it. The phrase "by the verifying session" is gone.
  - **Three READMEs added:** new `READMES` / `readmeDocs`. Each README is
    checked with the existing `hasSuiteCountClaim()`. There is no second
    detector (criterion 12).
  - **`wordsBeforePostgresOnly()` + `isNumberToken()`:** checks that no
    `Postgres-only` in `backend/README.md` has a number right before it
    (criterion 2). It reuses the existing number-token predicate and does not
    detect count claims.
  - **`progressLiveTail()`:** returns the slice from `\n## Known gaps in what is
    done` to EOF, which includes `## Next` and `### Deferred on purpose`.
    `progressHeadingIndex()` requires each heading as a whole line, so renaming
    either one throws, and the test calling it goes red. It also throws unless
    the order is Completed tasks < Known gaps < Next.
  - **New tests:** three `describe` blocks. Each checks the real files and
    also has a check that the detector is not vacuous.
  - **Existing tests:** none changed.
- **`frontend/src/stale-suite-counts-guard.criteria.test.ts`** (T-065's
  harness): added the three READMEs to `GUARD_INPUTS` and nothing else. No test
  was renamed, skipped or changed (criterion 18). Without this change, "the guard
  passes on unedited copies" would fail on load in the scratch tree.

### Where each criterion lives

| # | Where |
|---|---|
| 1, 4, 6 | README edits above; the guard's `the three READMEs state no suite-size count` block |
| 2 | `backend/README.md:10`; guard's `backend/README.md states no number of Postgres-only tests` block |
| 3, 5, 7 | the surrounding text is unchanged: five `make` targets; `SQLite` + `skip` on the `test` line; `over HTTP` / ``never import `app` `` in the intro; `restart tests` / `skip` in Known limits; `Playwright` / `Chromium` in the e2e intro |
| 8 | text untouched; guard's `criterion 8` test |
| 9–11 | guard README block + Postgres-only block (run with scratch copies, see below) |
| 13–16 | guard's `PROGRESS.md's Known gaps and Next sections` block, `progressLiveTail()` |
| 15 | the history is still unscanned: `progressLiveTail()` starts at the Known gaps heading, so the line just above it is outside the slice |
| 17 | guard header |
| 12, 18, 20, 21, 22 | no new detector, no harness test edited, no dependency or lockfile changes, no network, only the listed files touched |

### Scratch-copy check, criteria 9–16 (worker's own run, not committed)

I ran a throwaway script with the same method as `guardPassesWith()`: copy the
files, apply one edit, run the guard with the proxies pointed at a dead port.
Results:

| Edit | Expected | Got |
|---|---|---|
| 9a, 9b, 9c | red | red, red, red |
| 10: `thirty tests` / `221 unit, endpoint and contract tests` × 3 READMEs | red | red × 6 |
| 11: `(9 Postgres-only ones skip)` / `(nine …)` | red | red, red |
| 13: after the Known gaps heading | red | red |
| 14: after the `## Next` heading / as the last line of the file | red | red, red |
| 15: after `## Completed tasks` / the line just before Known gaps | green | green, green |
| 16: Known gaps → `## Known gaps`; `## Next` → `## Up next` | red | red, red |

**`PROGRESS.md` needed no edit.** The widened scan is green on the tree as it
stands, which matches the brief's survey.

### Gate (criterion 19)

- **`bun run lint`:** exits 0. Prettier had reflowed my new lines; I ran
  `eslint --fix` on the two test files.
- **`bun test`:** 304 pass, 1 fail. The failure is
  `Cannot find package 'react-simple-maps'` from `src/components/UsMap.tsx`.
  The base commit gives the same failure (checked with `git stash`: 295 pass,
  1 fail).
- **`bun run typecheck`:** every error is in `src/components/UsMap.tsx`
  (`us-atlas/states-10m.json`, `react-simple-maps`).
- **Why the gate is red:** `bun install --frozen-lockfile` gets a 403. For a
  few packages, `bun.lock` pins tarball URLs on
  `europe-west1-npm.pkg.dev/lovable-core-prod/...`, and this sandbox cannot
  reach that host. I did not work around it, because that would mean changing
  the lockfile or `node_modules` sources.
- **Tester:** run the gate somewhere those packages install (CI on PR #58). If
  it fails there too, it is a separate `tasks.md` entry, not this task. **Owner:
  tester, then reviewer.**

### Not done, on purpose

- **The two other README detectors:** not touched (out of scope; T-065
  criterion 10).
- **`tasks.md` and `PROGRESS.md` bookkeeping:** left for the reviewer's sweep
  (criterion 22).
- **Other docs:** I grepped `question-bank/README.md`, `frontend/README.md`,
  `conventions.md` and `README.md` for obvious count claims and found none. That
  was a rough regex, not the guard's detector. Nothing was filed.

### How to run

```bash
cd frontend
bun test src/stale-suite-counts.criteria.test.ts src/stale-suite-counts-guard.criteria.test.ts
bun test && bun run typecheck && bun run lint
```

## Verdict

**TL;DR: pass.** All 22 criteria hold. The tester's 38 new tests pass, and 8 guard mutations each turned the matching test red. Lint is clean. The full `bun test` and `typecheck` fail locally only on `react-simple-maps`/`us-atlas`, which cannot be installed in this sandbox (the same failure is on the base commit). CI's `frontend (typecheck, lint, test)` job is green on the worker's head `335ca51`. **Next: reviewer.**

**Independence is weaker than a separate session.** This run is orchestrated (`runs/T-074-readme-suite-counts.md` exists), and `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01VbP99X5Wcy9gLq5di9UETL`, the same id the expander and worker recorded. So the session-id check proves nothing here. My independence rests only on being a freshly spawned subagent with its own context: I did not see the worker's conversation or reasoning. That depends on the orchestrator having spawned me correctly, which I cannot verify.

**Tests added:** `frontend/src/readme-suite-counts.criteria.test.ts` (38 tests). It has its own count-claim detector, written from the brief's definition. Criterion 12 allows a verifying detector. It also has its own scratch-copy harness. Every edit runs the guard in a `bun` subprocess with all six proxy variables set to `http://127.0.0.1:1`, and each edit helper throws if the edit changed nothing.

| # | Verdict | Evidence |
|---|---|---|
| 1, 4, 6 | pass | tester detector finds no claim in any of the three READMEs. Mutation: restoring `221 tests` in `backend/README.md`, or `## Two things these tests found` in e2e, turns them red |
| 2 | pass | no number word or digit before `Postgres-only`. Restoring `9 Postgres-only` turns it red |
| 3 | pass | the five targets are in the first bash block, and the `make -C backend test` line has `SQLite` and `skip` |
| 5 | pass | intro has `over HTTP` and ``never import `app` ``. Known limits has `restart tests` and `skip`. Mutating `restart tests skip` turns it red |
| 7 | pass | e2e intro has `Playwright` and `Chromium` |
| 8 | pass | both singular sentences are present. The guard is green on unedited copies (control test) |
| 9a/b/c | pass | each restored claim: guard red |
| 10 | pass | `thirty tests` and `221 unit, endpoint and contract tests` appended to each README: red ×6 |
| 11 | pass | `(9 …)` and `(nine Postgres-only ones skip)` with no tests count: red ×2 |
| 12 | pass | review: the README describe block calls `hasSuiteCountClaim()`. `wordsBeforePostgresOnly()` only pulls the word before `Postgres-only` and reuses `isNumberToken`, so it does not detect count claims. The T-065 criterion-10 test passes unmodified. Mutation M1 (README assertion replaced with `expect(false)`) turned all 9 of criteria 9–10 red, so the READMEs depend on that one detector |
| 13 | pass | red. M8 (scan starts at `## Next`) turns this test red |
| 14 | pass | after `## Next` and as the last line of the file: red. M6 (scan stops at `## Next`) turns both red |
| 15 | pass | after `## Completed tasks` and on the line just before Known gaps: green. The three history figures are present |
| 16 | pass | Known gaps renamed to `## Known gaps`, `## Gaps` or `… (live)`, and `## Next` renamed to `## Up next`, `## Next steps` or `## Nxt`: all red |
| 17 | pass | the header credits T-065's `worker`, names T-074, and no longer contains "by the verifying session" |
| 18 | pass | the harness diff is +4 lines (`GUARD_INPUTS` only), with 0 removed. `test(` count is 28 before and 28 after. All harness tests pass |
| 19 | pass (via CI) | lint exits 0 locally. `bun test` locally: 342 pass, 1 fail (`Cannot find package 'react-simple-maps'`). `typecheck` errors are only in `UsMap.tsx`. `frontend/package.json`, `bun.lock` and `src/components` are unchanged since the base `d4a4da1`. CI frontend job on `335ca51`: success |
| 20 | pass | `git diff d4a4da1 HEAD` touches no manifest or lockfile |
| 21 | pass | both harnesses spawn with dead-loopback proxies. The guard reads local files only |
| 22 | pass | the worker commit `36a5c84` touches exactly the 3 READMEs, 2 `frontend/src` tests and the brief. `tasks.md` changed only in the expander's `6578acc`. The tester commit adds one `frontend/src` test file and edits the brief |

**Mutations to the guard (all reverted with `git checkout`, and the tree is clean):**

| # | Mutation | Result |
|---|---|---|
| M1 | README check → `expect(false).toBe(false)` | criteria 9a–c and 10 ×6 red |
| M2 | `progressLiveTail()` returns `""` | guard's own slice test red (control + 15 red) |
| M3 | live tail starts at `## Completed tasks` | control + 15 red (the history is scanned) |
| M4 | Postgres-only regex never matches | guard's own non-vacuity test red |
| M5 | heading lookup falls back to substring | caught by the guard's `\n## Next\n` slice assertion. 16 still red, so no test of mine went green |
| M6 | live scan stops before `## Next` | criterion 14 ×2 red |
| M7 | Postgres-only real-file loop reads `""` | criterion 11 ×2 red |
| M8 | live scan skips Known gaps | criterion 13 red |

**On the worker's unlisted edit** (`e2e/README.md` heading `## Two things these tests found` → `## Two things the suite found`): criterion 6 says "no count claim anywhere". "Two … tests" is within five words in one clause, so the heading had to change. The edit removes the plural "tests" and nothing else, so it is within "removing a number needs". The prose call is the reviewer's.

**CI on the tester's commit `10d4603`:** all 7 checks succeeded, including `frontend (typecheck, lint, test)`, so criterion 19's gate is green where the map packages install.

## Notes

- **Surprise: `e2e/README.md`'s `## Two things these tests found` heading is a
  count claim to the detector.** The survey did not find it. I changed it to
  `## Two things the suite found` rather than weaken the detector (criterion 12
  forbids a second detector, and criterion 6 says "anywhere"). **Owner: tester
  to confirm this reads as removing a number rather than rewording beyond it;
  reviewer to overturn if not.**
- **Decided: the renamed-heading check matches whole lines, not a substring.**
  A substring `indexOf("## Next")` would still match `## Nextish` or
  `## Next steps`, so the scan would quietly move instead of failing. Criterion
  16 asks for a loud failure. **Owner: tester (criterion 16).**
- **Replacement wording for the removed figures:** "the suite", "the
  integration suite", "the unit and endpoint tests", "Everything else passes".
  In each case I kept the sentence and swapped the number for a noun. **Owner:
  reviewer, for prose.**
