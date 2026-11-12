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

## Round 4 — task-expander (amendment) — 2026-11-12T17:08Z
`Next step` on entry: `task-expander` → on exit: `tester`

**I amended T-107's criteria 1 and 11 so they can be met. The amendment is pushed and needs a fresh approval before the tester resumes.** The header now reads `Status: awaiting approval`, `Next step: tester`, `Approved: pending`. I reset `Approved` because the earlier orchestrator stamp approved the old wording.

- **Pushed:** commit `29134ca` on `task/T-107-prettier-writer-guard`. After a fetch, local HEAD and the remote branch are both `29134caa9747cd0697f7609006cf0e06f0b08e43`.
- **What the commit touches:** only `tasks/T-107-prettier-writer-guard.md`. I ran no build and no tests.
- **PR #134:** I updated its body with the amended criteria. It is still a draft: https://github.com/Dkaattae/geo-discovery-zone/pull/134

**What changed**

I took the tester's option (a): narrow the two criteria. Option (b) would have brought the `format:check` tests into scope, and that is the question Out of scope says this task does not settle.

| Criterion | Before | After |
|---|---|---|
| 1 | The sentinel runs zero times across both files | The sentinel runs zero times when only the eight writer tests are run (for example with `--test-name-pattern`), which is how criterion 4 already reads |
| 11 | Across the whole suite, with no `node_modules`, the sentinel runs zero times | Across the whole suite, with no `node_modules`, there are zero **write starts**. Check starts are allowed and not counted |

- **Definitions:** the sentinel now has to record its arguments. A new term, "write start", means a start whose arguments include `--write` or `-w`. A "check start" is a start with `--check` and neither of those.
- **Notes added to the brief:** an amendment note under the criteria, and a Fault line marked as resolved by the amendment.
- **Sessions:** I added a "task-expander (amendment)" row.
- **Unchanged:** every other criterion and its number, Out of scope, Constraints and Context.

**Why the next step is the tester, not the worker:** the worker's Handoff already says there is nothing to build outside the two test files that predate this task. The amendment does not change that. This follows the T-076 amendment.

**What the next tester has to do** (also in the brief's Notes):
- Update this task's own test file, `frontend/src/prettier-writer-guard.criteria.test.ts`, to the amended criteria 1 and 11.
- Merge `origin/main` first. T-106 merged as `8092372` and re-pinned some of the same constants.
- Then re-check Test change request rows 1-8 and send them to the `ci-fix` (D-20).

**Left as it was:** the `Test changes:` header still holds the tester's non-standard `pending — …` value. The tester owns that field.

Brief: /home/user/geo-discovery-zone/tasks/T-107-prettier-writer-guard.md

## Approval (re-stamp after amendment) — orchestrator — 2026-11-12T17:09Z
Stamped `Approved:` again as an unattended run. The amended criteria were not read.

## Round 5 — tester — 2026-11-12T17:23Z
`Next step` on entry: `tester` → on exit: `ci-fix` · G3 count: fail 1, blocked 1

**Verdict: `fail`. Next step: `ci-fix`.** Criteria 1, 3, 4, 6 and 11 fail on the branch head because the writer guard has not been applied. The fix belongs in two pre-existing test files, so I routed it to the `ci-fix` as 9 Test change request rows (D-20), with Decision left blank on every row. When I applied the worker's proposed guard as a temporary trial, all 14 of this task's tests passed. The trial is reverted.

Commit `ae78cf3` is pushed to `task/T-107-prettier-writer-guard`, and `origin` shows it. Working tree is clean.

**Independence:** this is an orchestrated run, and my session id (`cse_011oDiJdbpiNRtapJtyKBeQB`) matches the worker's row, which proves nothing. My independence rests only on being a freshly spawned agent that did not see the work happen. That is weaker than a separate session.

**What I changed**
- **This task's test file** (`frontend/src/prettier-writer-guard.criteria.test.ts`), updated to the amended criteria:
  - **Criterion 1:** runs only the eight writer tests (`--test-name-pattern`), checks that every other test was filtered out, and expects the sentinel to log no starts.
  - **Criterion 11:** counts only write starts (logged arguments contain `--write` or `-w`, per Definitions). Check starts are ignored.
- **Brief header:**
  - Status: `fail`
  - Next step: `ci-fix`
  - Test changes: `routed to ci-fix (D-20)`
  - A Fault line and my Sessions row.
- **Test change request:**
  - Rows 1-8 re-checked against `origin/main` at `8092372`: every test name is unchanged. T-106 re-pinned the constants behind rows 6-8, so they must be recomputed from main's values.
  - **New row 9:** `climate-cold-trade-accepted-verify.test.ts` › "each test in the approved Test change request is 8108a42's…" (`APPLIED_REQUEST_FILE_SHAS`). It goes red once rows 3, 4 and 7 change the three files it pins by digest.
- **Verdict:** written in the brief.

**Criteria with the trial guard applied** (it was formatted with prettier 3.9.6)
- **1, 3, 4, 6, 11:** fail on the head, pass with the guard.
- **2, 5, 7, 8, 9, 10:** pass both ways.
- **12:** not met. The 6 question-bank reds are exactly rows 3-8. The frontend failures come from the sandbox: `react-simple-maps` is not installed and the proxy blocks the install. CI is the authority here.
- **13-16:** pass, checked by hand. For 14 and 15, `git diff --quiet origin/main HEAD` shows the files identical.

**Mutations** (made with the trial guard in place, all reverted; both files match HEAD)
- **Version check disabled:** criterion 4 and both criterion 6 tests go red.
- **Missing-package check disabled:** criterion 3's message test goes red.
- **Guard removed from the format-gate writer test only:** criteria 1 and 11 go red.

**Suites in this sandbox**
- **frontend `bun test`:** 427 pass, 11 fail, 4 errors. 7 of the fails are this task's file; the other 4 fails and the 4 errors are `react-simple-maps`.
- **frontend lint and format:check:** clean.
- **frontend typecheck:** 9 errors, all from `react-simple-maps` / `us-atlas`.
- **question-bank:** 2717 pass, 6 fail.
- **backend:** 1221 passed, 9 skipped.

**For the `ci-fix`:**
- Merge `origin/main` before anything else; the branch has not merged it yet.
- Apply rows 1-2, the guard, as the first statement of each of the eight writer tests. Format them with prettier, or the criterion 10 test fails.
- Then recompute rows 3-9 on the merged tree.

Files:
- /home/user/geo-discovery-zone/tasks/T-107-prettier-writer-guard.md
- /home/user/geo-discovery-zone/frontend/src/prettier-writer-guard.criteria.test.ts

## Round 6 — ci-fix (pass 1, plan) — 2026-11-12T17:38Z
`Next step` on entry: `ci-fix` → on exit: `human`

**T-107 ci-fix, pass 1: the plan is pushed and nothing has been applied. The task now waits for someone to approve the plan.** The commit is `351a12d T-107 ci-fix: plan` on `task/T-107-prettier-writer-guard`, and the push is confirmed: `origin/task/T-107-prettier-writer-guard` points at `351a12d`.

**Header now reads:** `Status: ci fix requested`, `Next step: human`, `CI fix: requested`. The Fault line is rewritten for the ci-fix, and the Sessions table has a ci-fix row.

**Independence:** this was an orchestrated run (`runs/T-107-prettier-writer-guard.md` exists). My session id `cse_011oDiJdbpiNRtapJtyKBeQB` matches every earlier role's, so the session-id check proves nothing. My only independence is being a freshly spawned agent.

**Reproduced on the branch head `3300b59` before writing any row:**
- **T-107's own test file:** 7 pass, 7 fail. The fails are criteria 1, 3 (×2), 4, 6 (×2) and 11.
- **question-bank:** 2717 pass, 6 fail. The fails are exactly Test change request rows 3-8.

**Root cause:** the defect is in two tests that existed before this task, not in the source. The seven `format-gate` criterion 7 tests and the `readme-fences` criterion 8 test spawn `bun run format` without first checking that the pinned prettier is installed. The guard that fixes this was never applied: the worker may not change those tests, and the unattended tester routed them here (D-20).

**Plan, in `## CI fix plan` of the brief (10 rows, all test changes, no source):**

| Row | What |
|---|---|
| 0 | Merge `origin/main` (`8092372`); it merged cleanly in the trial |
| 1-2 | The worker's `requirePinnedPrettier()` guard, as the first statement of all eight writer tests |
| 3, 4, 5 | Frontend-tree digests recomputed |
| 6 | `MAIN_TESTS_COUNT` 130 → 131, and `MAIN_TESTS_SHA` recomputed |
| 7, 8 | T-107's brief and run log added to the allowed-file lists (`CRITERION_21_ALLOWED` / `CRITERION_22_ALLOWED`), as T-106 did |
| 9 | Three entries of `APPLIED_REQUEST_FILE_SHAS` recomputed |

**Trial:** I applied all 10 rows in a scratch worktree, then removed it; nothing from the trial is committed.
- **T-107 file plus the two writer-test files:** 61 of 61 pass.
- **question-bank:** 2741 pass, 0 fail.
- **frontend whole suite:** 434 pass, 4 fail, 4 errors. Every one is `Cannot find package 'react-simple-maps'`: the proxy blocks the install, and these failures were already there before this task.
- **frontend lint:** clean.

**Corrections and notes for whoever picks it up:**
- **Row 9's origin:** the tester gave `950f334`. The test's current name and its `8108a42` pinning actually come from `bac230d` (a T-091 review fix).
- **No missed tests:** I found no stale test the tester's request left out.
- **Final digests will differ:** the trial digests are given only to show the re-pins close. Pass 2 must recompute each value after the rows it depends on, in the order 0, 1-2, 3-5 and 7-8, then 6, then 9.

**Next:** the orchestrator waits about an hour for a person. With no answer, it stamps the approval (D-17) and spawns a fresh ci-fix for pass 2. Because every row changes a test, the reviewer has to escalate the PR to a person if the stamp is what approves it (D-18).

Files:
- /home/user/geo-discovery-zone/tasks/T-107-prettier-writer-guard.md
- /home/user/geo-discovery-zone/frontend/src/format-gate.criteria.test.ts
- /home/user/geo-discovery-zone/frontend/src/readme-fences.criteria.test.ts
- /home/user/geo-discovery-zone/frontend/src/prettier-writer-guard.criteria.test.ts

## CI fix approved — by a person, in the orchestrator's session — 2026-11-12T17:38Z
The user's words, verbatim: "approve the T-107 CI fix plan"
Given at about 17:30Z, while the pass-1 ci-fix was still writing the plan (before `351a12d` landed). The orchestrator told the user the plan did not exist yet and that it would apply the approval when the header read `CI fix: requested` unless told otherwise; the user did not object. The reviewer should weigh that the approval was given in advance of the plan.
Header set: `Status: ci fix approved`, `Next step: ci-fix`, `CI fix: approved — the user, 2026-11-12, given in the orchestrator's session (in advance of the plan's push)`.

## Round 7 — ci-fix (pass 2, apply) — 2026-11-12T17:51Z
`Next step` on entry: `ci-fix` → on exit: `tester`

**I applied all 10 rows of the T-107 CI fix plan and nothing else. The fix is pushed and goes to a fresh tester next.** One thing for the reviewer to weigh: the user approved the plan before it had been written, so nobody approved these rows after reading them.

- **Pushed:** the branch is a merge commit of `origin/main` (row 0), then `52a6409 T-107 ci-fix: apply approved fix`, on `task/T-107-prettier-writer-guard`. After a fetch, `origin` points at `52a6409`.
- **Header now reads:** `Status: awaiting verification`, `Next step: tester`, `CI fix: applied — approved — the user, 2026-11-12, given in the orchestrator's session (in advance of the plan's push)`, `Test changes: applied through CI fix plan (D-20)`, `Fault: none`. I added a Sessions row for `ci-fix (pass 2)` and wrote a `## CI fix` section into the brief.

**The approval:**
- **What it was:** the run log quotes the user: "approve the T-107 CI fix plan". They said it at about 17:30Z, before the plan commit `351a12d` landed.
- **Why I accepted it:** it is a person approving the whole plan, through the channel `process.md` allows ("approve it … in the orchestrator's session"). T-106 used the same channel.
- **What I wrote down:** I copied the approval into every row's Decision as "approved (whole plan, per the header's `CI fix:` line)".
- **Plan still current:** `origin/main` was still `8092372`, the commit the plan was written against.
- **For the reviewer:** every row changes a test, so the plan should go in front of a person before merge.

**Rows applied (none refused):**

| Row | File | Change |
|---|---|---|
| 0 | the branch | merged `origin/main` (`8092372`), no conflicts |
| 1 | `format-gate.criteria.test.ts` | the worker's `requirePinnedPrettier()` guard, copied exactly, called first in the seven writer tests |
| 2 | `readme-fences.criteria.test.ts` | the same guard, called first in the criterion 8 test |
| 3-5 | three question-bank files | frontend-tree digests re-pinned |
| 6 | `climate-cold-trade-accepted-verify.test.ts` | `MAIN_TESTS_COUNT` 130 → 131; `MAIN_TESTS_SHA` re-pinned |
| 7-8 | two question-bank files | the T-107 brief and run log added to `CRITERION_21_ALLOWED` and `CRITERION_22_ALLOWED` |
| 9 | `climate-cold-trade-accepted-verify.test.ts` | three `APPLIED_REQUEST_FILE_SHAS` entries re-pinned |

Every new digest came from the failing test's own `Received` value on this tree. The harness did not refuse any edit.

**Results, run in this sandbox:**
- **The two writer files plus `prettier-writer-guard.criteria.test.ts`:** 61 pass, 0 fail.
- **question-bank:** 2741 pass, 0 fail; typecheck, lint and format:check clean.
- **Backend:** 1221 passed, 9 skipped.
- **frontend whole suite, run alone:** 434 pass, 4 fail. All 4 are `Cannot find package 'react-simple-maps'`: the sandbox cannot install it, and these failed before this task too.
- **frontend lint and format:check:** clean.
- **frontend typecheck:** 9 errors, all from the same missing `react-simple-maps` / `us-atlas` packages.
- **lint-gate timeouts:** a first frontend run, alongside the other two suites, had 5 `lint-gate` tests time out at 5 s. Rerun alone, they passed 8/8.
- **Working tree:** clean after every run.

**Still open:**
- **Criterion 12** (every suite green) needs CI, because of the missing package.
- **The guard is written out twice**, once in each file. A shared helper is for the reviewer to queue; I did not change it.

Files:
- /home/user/geo-discovery-zone/tasks/T-107-prettier-writer-guard.md
- /home/user/geo-discovery-zone/frontend/src/format-gate.criteria.test.ts
- /home/user/geo-discovery-zone/frontend/src/readme-fences.criteria.test.ts
- /home/user/geo-discovery-zone/question-bank/src/agriculture-true-wrong-answers-verify.test.ts
- /home/user/geo-discovery-zone/question-bank/src/map-click-no-candidates-verify.test.ts
- /home/user/geo-discovery-zone/question-bank/src/refresh-regenerate-reminder-verify.test.ts
- /home/user/geo-discovery-zone/question-bank/src/climate-cold-trade-accepted-verify.test.ts
- /home/user/geo-discovery-zone/question-bank/src/farm-animal-loose-ends-verify.test.ts
