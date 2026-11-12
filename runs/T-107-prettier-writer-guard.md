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
