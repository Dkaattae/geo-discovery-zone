# T-107 — Two frontend tests run prettier's writer, which may resolve to an unpinned global prettier — run log

**Task:** T-107 · **Branch:** `task/T-107-prettier-writer-guard` · **PR:** #134
**Started:** 2026-11-12 · **Outcome:** in progress

Run: orchestrated, task 2 of 3. In flight at start: T-106.

## Round 1 — task-expander — 2026-11-12T16:10Z
`Next step` on entry: `none (no brief)` → on exit: `worker`

**I expanded T-107 and opened draft PR #134. The brief is pushed and is waiting for a person to approve it.** Next step: a person sets `Approved:`, then the `worker` runs.

- **Picked:** T-107, "two frontend tests run prettier's writer, which may resolve to an unpinned global prettier".
- **Branch:** `task/T-107-prettier-writer-guard`, created from `origin/main` and written into the brief's `Branch:` header.
- **Push confirmed:** local HEAD and `origin/task/T-107-prettier-writer-guard` are both `abbdd94`.
- **PR:** draft #134, https://github.com/Dkaattae/geo-discovery-zone/pull/134. Its body carries the acceptance criteria.
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-107-prettier-writer-guard.md`
  - Status `awaiting approval`, Next step `worker`, Approved `pending`.
  - My expander row is in the Sessions table (session `cse_011oDiJdbpiNRtapJtyKBeQB`).
- **My commits:** `a6a6978` adds the brief, and `abbdd94` records the PR number. Both touch only `tasks/`.

**Skipped, one line each:**
- **T-085b:** waits on a person's choice of a reachable Census release.
- **T-056:** waits on a design decision.
- **T-095:** waits on a person's call between options (a), (b) and (c).
- **T-106:** in flight, on open PR #133.
- **T-046:** a rename-or-keep decision that is not mine to make. Earlier runs (T-039, T-047, T-076) skipped it the same way.

**What the brief asks for (16 criteria):**
- **Pinned prettier not installed, or the wrong version installed:**
  - No prettier runs at all. A "sentinel" fake `prettier` placed first on `PATH` is never executed.
  - No tracked file under `frontend/` changes.
  - All eight writer tests are reported failed, with both versions named in the output.
- **Pinned 3.9.6 installed:**
  - The writer tests pass.
  - A mutation shows they still check what they checked before.
  - The sentinel is still never executed.
- **Whole suite:** a frontend `bun test` run with no `node_modules` writes nothing.
- **Hand checks against `main`, not committed pins (P-17):**
  - No test touches the real `node_modules` or `package.json`.
  - `package.json`, `bun.lock`, the prettier config and `ci.yml` are byte-identical.
  - No dependency is added.
  - No test is deleted and none is weakened.
- **No network.**

**Expect a halt later in the run:**
- **Tester step:** the fix changes two existing test files (`frontend/src/format-gate.criteria.test.ts` and `frontend/src/readme-fences.criteria.test.ts`). Under D-14 the worker can't change them, so it will probably have nothing to implement, and the change goes through a Test change request or the `ci-fix` plan (D-20). The brief tells the approver to plan to attend the tester step.
- **Red pins:** whole-tree pins in the `question-bank` verify tests will go red. The brief names the likely ones: `MAIN_FRONTEND_SHA`, `MAIN_TESTS_SHA` and `MAIN_TESTS_COUNT`, plus the T-076 re-pin sites.
- **Rebase:** T-106 (PR #133) may re-pin some of the same constants. Whichever PR merges second will need a rebase and a recompute.

**A choice I made:** the queue entry allowed "skips or fails" when the pinned prettier is missing. I specified **fails**, because a skipped test reports green while the writer check goes unverified. The approver can reverse that.

**Not touched:** `tasks.md` and `PROGRESS.md`. `tasks/` was empty at start, so there was nothing to sweep.

## Approval — orchestrator — 2026-11-12T16:10Z
Stamped `Approved:` as an unattended run. The criteria were not read.

## Round 2 — worker — 2026-11-12T16:23Z
`Next step` on entry: `worker` → on exit: `tester`

**I built nothing for T-107. The whole fix is in two tests that already exist on `main`, and the worker may not change those (D-14).** I wrote the Handoff, which lists both tests as stale with the exact guard I propose. The brief is now `awaiting verification`, Next step `tester`. Commit `a1d607e` is on `origin/task/T-107-prettier-writer-guard`; `git log origin/<branch> -1` shows it.

**Next:** the tester routes the change to the two files through a Test change request or the `ci-fix` plan, then writes the tests for criteria 1–11.

**Tests made stale**
- **`frontend/src/format-gate.criteria.test.ts`**, "T-075 tester, criterion 7", all seven probe tests. Proposal: modify, by calling a new `requirePinnedPrettier()` as the first line of each, before `writeProbe`.
- **`frontend/src/readme-fences.criteria.test.ts`**, "T-076 criteria 7-8", the "criterion 8: bun run format…" test. Proposal: modify, by calling the same guard first.
- **What the guard checks:** it reads the pinned version from `package.json`. It throws if `node_modules/prettier` is missing, if its version differs from the pin, or if `node_modules/.bin/prettier` is missing. Each message names the pinned version and what it found. The full code is in the Handoff.

**Checked:** with prettier 3.9.6 installed, `bun run` uses `node_modules/.bin` ahead of `PATH`. I put a sentinel `prettier` first on `PATH`, ran `bun run format:check`, and the sentinel never ran (criterion 7).

**Judgment calls, all for the tester to confirm or overturn**
- **Throw instead of `expect`:** a thrown error prints both versions in the failure output, which criteria 3 and 6 need.
- **Extra `.bin` check:** without it, a package that is present but unlinked would fall back to the global prettier.
- **Writer stays `bun run format`:** the script is what the tests check, so I did not call prettier's binary directly.
- **Guard copied into both files:** a shared module is not in the brief's list of files to change.

**Already red before any change** (named in the Handoff so nobody reads them as bugs)
- **Frontend tests and typecheck:** 4 failures plus 4 errors in `bun test`, and typecheck exits 2. All come from `react-simple-maps` (and the `us-atlas` types) not being installed. `bun install --frozen-lockfile` failed with a proxy 403, so a full pass for criterion 12 has to come from CI or a sandbox that can reach the registry.
- **`question-bank`:** 2 tracked-file count pins are off by +2, because the expander and orchestrator added the brief and the run log:
  - `farm-animal-loose-ends-verify.test.ts`: expected 281, got 283.
  - `climate-cold-trade-accepted-verify.test.ts`: expected 284, got 286.

  These are P-17 Test change request rows for the tester.
- **Everything else passed:** backend 1221 passed and 9 skipped, lint exit 0, format:check clean, and the working tree is clean.

**Session id:** my Sessions row has the same id as the expander's (`cse_011oDiJdbpiNRtapJtyKBeQB`), because the run reports one id for every subagent. The row says so, so the tester does not take a match as proof it shares my context.

File: /home/user/geo-discovery-zone/tasks/T-107-prettier-writer-guard.md

## Round 3 — tester — 2026-11-12T17:06Z
`Next step` on entry: `tester` → on exit: `task-expander` · G3 count: fail 0, blocked 1
Relayed per process.md step table (tester `blocked` → `task-expander`); Next step names one role, so G0 passes.

**T-107 tester verdict: `blocked`. Next step: `task-expander`.** Criteria 1 and 11 cannot be met as written, so the task goes back to the expander before any fix. Separately, criteria 3, 4 and 6 fail because the guard has not been applied yet. The guard has to go into two tests that existed before this task, so I wrote 8 Test change request rows. Every Decision is blank and none of them has been routed yet.

Pushed: `b73fdc6` on `task/T-107-prettier-writer-guard`. Local HEAD and the remote branch match, and the working tree is clean.

**Independence:** this is an orchestrated run, so my session id is the same as the worker's row and that match proves nothing. My independence rests only on being a freshly spawned agent that did not see the work, which is weaker than a separate session. The Verdict says this.

**Why it is blocked**
- **What the criteria require:** criteria 1 and 11 say the sentinel `prettier` must run zero times across the whole of the two files, and across the whole frontend suite.
- **What actually runs it:** the read-only `format:check` tests start it too. I applied the worker's proposed guard temporarily (since reverted) and ran in a copy with no `node_modules`. The sentinel log read `11 ran --check .` and nothing else.
- **Why no fix helps:** those 11 runs come from format-gate criteria 5, 6 and 10 and readme-fences criterion 7. The brief's Out of scope says this task does not guard those tests, so no change limited to the eight writer tests can satisfy criterion 1 or 11.
- **The expander's choice:**
  - (a) Restrict criteria 1 and 11 to the writer tests, the way criterion 4 already reads.
  - (b) Bring the `format:check` tests into scope.

**Criteria on the branch head**

| Result | Criteria |
|---|---|
| Met | 2, 5, 7, 8, 9, 10, 13, 14, 16 |
| Met for now | 15: the two files have not been touched yet, so it needs rechecking once the guard is applied |
| Fail | 3 and 6: all 8 writer tests pass when they should fail. 4: the fake 3.8.1 package ran 15 times when it should run 0 |
| Blocked | 1 and 11 |
| Not met | 12, see suites below |

With the trial guard applied, criteria 3, 4, 6 and 10 passed (10 only after the guard was prettier-formatted). Only 1 and 11 stayed red.

**Tests added:** `/home/user/geo-discovery-zone/frontend/src/prettier-writer-guard.criteria.test.ts`, 14 tests.
- Each scenario copies the repo's tracked files into the OS temp directory and puts a sentinel `prettier` first on `PATH`. The scenarios are: prettier missing, a fake wrong version, and the real pinned package copied in.
- Pass or fail is read from a JUnit report, and file changes are found by hashing every tracked `frontend/` file before and after.
- Every child test run uses a dead proxy, and the real `node_modules` and `package.json` are only read.
- Criterion 9's two mutations are committed as tests. Making the `format` script a no-op turns all 7 format-gate writer tests red. Changing a README heading so the pinned prettier rewrites it turns readme-fences criterion 8 red.

**Mutations, all reverted** (the two pre-existing files are byte-identical to HEAD)
- Turning off the guard's version check turned criteria 4 and 6 red.
- Turning off its missing-package check turned criteria 1 and 3 red.

**Suites** (web sandbox)
- **frontend `bun test`:** 427 pass, 11 fail, 4 errors.
  - 7 of the fails are my tests, catching the missing guard and the two blocked criteria.
  - The other 4 fails and the 4 errors are `react-simple-maps` not being installed. That was already broken before this task, and the install is refused by the proxy.
- **frontend lint and format:check:** clean.
- **frontend typecheck:** 9 errors, all from the same missing packages, none in the new file.
- **question-bank `bun test`:** 2717 pass, 6 fail, all checks that pin the whole file tree.
  - Rows 3-6 went red because of my new test file.
  - Rows 7-8 were already red from the brief and the run log.
- **backend:** 1221 passed, 9 skipped.
- **Criterion 12:** CI is the authority, since this sandbox cannot install the missing frontend packages.

**Test change request rows**
- **Rows 1-2:** add the guard as the first statement of the 8 writer tests. The guard must be prettier-formatted, or `bun run format` rewrites it and criterion 10 fails.
- **Rows 3-8:** re-pin the whole-tree checks in the question-bank verify tests.
- **Merge `origin/main` first:** it has moved to `8092372`, where T-106 already re-pinned some of the same values. Every digest and count has to be recomputed after that merge.

**Brief header now reads:**
- **Status:** `blocked`
- **Next step:** `task-expander`
- **Test changes:** a non-standard `pending — …` value, because the rows are not routed until the brief is amended. The orchestrator should key on Status and Next step, not on this line.
- **Fault:** filled in.
- **Sessions:** my tester row is added.

Brief: `/home/user/geo-discovery-zone/tasks/T-107-prettier-writer-guard.md`
