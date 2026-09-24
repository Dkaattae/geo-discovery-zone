# T-074 — Three READMEs state suite sizes nothing checks

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
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

## Verdict

## Notes
