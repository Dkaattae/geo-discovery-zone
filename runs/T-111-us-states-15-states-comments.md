# T-111 — Two `us-states.ts` comments still say "the 15 states shipping today" — run log

**Task:** T-111 · **Branch:** `claude/amazing-franklin-j3x3l1` · **PR:** #136
**Started:** 2026-11-13 · **Outcome:** in progress

Orchestrated run of 2 tasks, started by Dkaattae ("start the next two tasks as an orchestrator").

## Round 1 — task-expander — 2026-11-13 15:00Z
`Next step` on entry: `(no brief)` → on exit: `worker`

I expanded T-111 into a light brief and opened draft PR #136 on `claude/amazing-franklin-j3x3l1`. The push landed: `origin/claude/amazing-franklin-j3x3l1` is at `486ee0a`.

- **Status:** awaiting approval
- **Next step:** worker
- **Approved:** pending (the orchestrator stamps it in an unattended run)

**Why T-111.** The queue entries ahead of it all need a person first, and there were no open T-task PRs (the only open PR is #38, P-4):
- **T-085b:** blocked until a person picks a Census source.
- **T-056:** needs a design decision.
- **T-095:** waiting on a person's call between options (a), (b) and (c).
- **T-110:** needs a product wording call from Dkaattae.

**The task.** Two doc comments in `question-bank/src/curated/us-states.ts`, at lines 69 and 80, still say 15 states are what the app serves. The served bank has been 50 states since T-040. The brief asks for those two claims in the past tense, with T-017's region decision still recorded in the same paragraph.

**Acceptance criteria** (light brief, four of them):

| # | What must be true |
|---|---|
| 1 | No line in the file contains `shipping today` or `already served`, and the word `today` does not appear in the region paragraph. |
| 2 | The region paragraph still has `T-017`, `2026-09-18`, `E-9`, a past-tense `15`, all 13 region values and all 15 state names. |
| 3 | Comments only: with comments stripped the file matches `main` at `2634fc8`, the exports are unchanged, and `data/` and `content.json` are byte-identical. |
| 4 | No other file changes beyond the brief and approved test-change rows, and no dependency. This is checked at hand-off rather than by a new committed sha pin (P-17). |

**What to expect downstream**
- **Some existing tests will fail by design.** At least `agriculture-true-wrong-answers-verify.test.ts` "criterion 20" checks a hash of the whole file, so any comment edit breaks it. Others may do the same. The brief's Notes say so; the worker should list them under Tests made stale, and in this run they go to the `ci-fix` (D-20).
- **One stale line is left out of scope.** The docstring at `backend/tests/test_region_vocabulary.py:10` makes the same "already served" claim, but it sits inside a test file.

**What the commits touched:** the brief (new), and `tasks.md`, where T-111 is now marked `doing`. Nothing else.

Files:
- /home/user/geo-discovery-zone/tasks/T-111-us-states-15-states-comments.md
- /home/user/geo-discovery-zone/tasks.md
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/136

Orchestrator: stamped `Approved:` (unattended run).

## Round 2 — worker — 2026-11-13 15:12Z
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** The T-111 worker step is done and pushed: commit `4cd2093` is on `origin/claude/amazing-franklin-j3x3l1` (I checked with `git log origin/... -1`). Both comment phrases are now past tense and T-017's decision is still recorded. The brief now reads Status `awaiting verification`, Next step `tester`. The question-bank suite has 4 failing tests, all whole-tree checksum or file-count checks, all listed in the Handoff. Two were already failing before my edit.

**What changed**
- **`/home/user/geo-discovery-zone/question-bank/src/curated/us-states.ts`**: only the region doc comment (lines 67–93).
  - Line 69 now says "then the 15 states served at the time) returned".
  - Line 80 now says "The 15 states that bank served in 2026-09 … shipped for them then".
  - The rest of the paragraph is re-wrapped to 80 columns, wording unchanged.
- **`/home/user/geo-discovery-zone/tasks/T-111-us-states-15-states-comments.md`**: header updated, worker Sessions row added, Handoff written.

**Criteria**
| # | Result | Evidence |
|---|---|---|
| 1 | met | Neither phrase appears anywhere in the file, and "today" no longer appears in the region paragraph. |
| 2 | met | A script check found T-017, 2026-09-18, E-9, 15, all 13 region values and all 15 state names in backticks inside the paragraph. |
| 3 | met | With comments and whitespace stripped, the file is identical to `2634fc8`. The offline build and `bun run questions` leave `git status` clean. |
| 4 | contradiction | The branch diff also touches `tasks.md` and `runs/T-111-…md`, from the expander and orchestrator commits. |

**Criterion 4, for the tester to judge:** read literally, it fails on those two files, which the process itself added. If the tester holds it strictly, it goes back to the `task-expander`, which should allow those two paths in future light briefs.

**Test results**
- **question-bank:** format, typecheck and lint are clean. `bun test` gives 2763 pass, 4 fail.
  - `agriculture-true-wrong-answers-verify.test.ts`, "criterion 20: curated/us-states.ts is byte-identical to main's": checksum of this file, made stale by my edit.
  - `climate-cold-trade-accepted-verify.test.ts`, "T-091 criterion 20 … is 12d242e's": checksum of the source tree, made stale by my edit.
  - `farm-animal-loose-ends-verify.test.ts`, "T-096 … criterion 21": file count 280 → 282. Already failing before my edit, because of the brief and run log files.
  - `climate-cold-trade-accepted-verify.test.ts`, "T-091 criterion 22": file count 283 → 285. Already failing for the same reason.
  - The Handoff gives the replacement value for each one.
- **backend:** `uv run pytest -q` gives 1221 passed, 9 skipped.
- **frontend: not verified.** `bun install` hit a proxy 403 on `d3-zoom`, so `react-simple-maps` is missing. Typecheck fails and 4 tests fail, all on that missing package. Nothing under `frontend/` was touched. The tester should rerun it with working package downloads, or rely on CI.

**One thing for the tester:** `$CLAUDE_CODE_REMOTE_SESSION_ID` gave the same id (`cse_011oDiJfSMW5AuCAW3Bk9Ste`) for the expander and the worker. The tester will need some other way to show its session is fresh.

## Round 3 — tester — 2026-11-13 15:25Z
`Next step` on entry: `tester` → on exit: `task-expander` (Status `blocked`; G3 count: 0 fail, 1 blocked)

**T-111 tester verdict: `blocked`, next step `task-expander`.** Criteria 1, 2 and 3 are met. Criterion 4 cannot be met as written, so I am returning it rather than choosing a reading myself. Commit `988c08e` is pushed to `claude/amazing-franklin-j3x3l1`, and the remote head matches.

**Independence:** this is an orchestrated run, so the session-id check proves nothing. My id, `cse_011oDiJfSMW5AuCAW3Bk9Ste`, is already listed for the expander and the worker. My only independence is being a freshly spawned subagent that did not see the worker's session. That is weaker than a separate session, and the Verdict says so.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | 3 tests in the new test file, all green. All 3 go red against `main`'s file. |
| 2 | met | 35 tests: `T-017`, `2026-09-18`, `E-9`, `15`, 13 regions and 15 states, each in backticks. All green. The reviewer judges the tense. |
| 3 | met, checked at hand-off and not pinned | Every changed line is a comment line. With comments and whitespace stripped, the file compiles to the same code as `2634fc8`. All 5 exports deep-equal `main`'s. Data and `content.json` are unchanged, and the offline build and `bun run questions` leave the tree clean. |
| 4 | blocked | The diff against `origin/main` also touches `tasks.md` (from expander commit `428a89f`) and `runs/T-111-…` (from orchestrator commit `7c9512e`). The loop requires both files, and criterion 4's allow-list names neither. Its wording also does not clearly allow a tester's new test file. Suggested amendment: allow `tasks.md`, the run log, the sweep's edits and new tester or ci-fix test files. |

**Suite** (on `df1e593` plus my test file):
- **question-bank:** format, typecheck and lint are clean. `bun test` gives 2801 pass, 4 fail; all 4 are stale whole-tree or whole-file pins, and no behaviour test is red. CI's question-bank job is red for the same reason.
- **backend:** 1221 passed, 9 skipped.
- **frontend:** locally it fails only because `react-simple-maps` cannot be installed (proxy 403). CI's frontend job is green on `df1e593`.

**Mutations:** I made 10 mutations to `us-states.ts`, all reverted and confirmed with `cmp`. Nine turned the matching test red. M7 stayed green, which is correct: `Upper Midwest` appears backticked twice in the paragraph, and the criterion only asks that it be present.

**Test change request:** 5 rows, Decision blank, **not routed** while the task is blocked (as T-107 did). The header reads `Test changes: pending …`. No pre-existing test was edited.
1. `agriculture-true-wrong-answers-verify.test.ts`: re-pin the whole-file hash of `us-states.ts` to `98afb4d5…`.
2. `climate-cold-trade-accepted-verify.test.ts`: re-pin `MAIN_SOURCE_TREES_SHA` to `05dc94e8…`.
3. `farm-animal-loose-ends-verify.test.ts`: add the T-111 brief and run log to `CRITERION_21_ALLOWED`, keep the count at 280, re-pin `MAIN_UNTOUCHABLE_SHA` to `689e2d12…`.
4. `climate-cold-trade-accepted-verify.test.ts`: add the same two files to `CRITERION_22_ALLOWED`, keep `MAIN_UNTOUCHABLE_COUNT` at 283, re-pin `MAIN_UNTOUCHABLE_SHA` to `d030f3e5…`.
5. `climate-cold-trade-accepted-verify.test.ts`, "each test in the approved Test change request is 8108a42's…": it is green now, but goes red once rows 1 and 3 change those two files. Re-pin their entries in `APPLIED_REQUEST_FILE_SHAS`. I saw this red in a scratch run, then reverted the edit.

**Files:**
- `/home/user/geo-discovery-zone/tasks/T-111-us-states-15-states-comments.md` has the Verdict, the Test change request, Status `blocked`, Next step `task-expander`, a Fault line and my Sessions row.
- `/home/user/geo-discovery-zone/question-bank/src/us-states-region-comment-verify.test.ts` is the new test file, 38 tests.

## Round 4 — task-expander — 2026-11-13 15:30Z
`Next step` on entry: `task-expander` → on exit: `tester`

**TL;DR:** I amended criterion 4 of T-111 so it can be met. Criteria 1 to 3 are unchanged. The brief is back at `Status: awaiting approval`, `Next step: tester`, with `Approved: pending` and the 5 Test change request rows untouched. It needs re-approval (the orchestrator's re-stamp), then a fresh `tester`. Commit `80abbee` is pushed to `claude/amazing-franklin-j3x3l1`, and the remote head matches local.

**What the amended criterion 4 says**
- **Allowed paths in `git diff --name-status origin/main...HEAD`:**
  - `question-bank/src/curated/us-states.ts`
  - the loop's records:
    - the brief, including its deletion by the sweep
    - `runs/T-111-us-states-15-states-comments.md`
    - `tasks.md`
    - `PROGRESS.md`
  - new test files: `*.test.ts`, `*.test.tsx` or anything under `backend/tests/`, absent on `main`
  - test files that already exist on `main`, but only if changed through a Test change request or CI fix plan row with recorded approval
- **Limits before the reviewer's sweep:**
  - `tasks.md` may change only inside T-111's own `###` entry.
  - `PROGRESS.md` must not appear in the list.
  - The sweep's own later edits are left to the reviewer to judge, because a sweep can add new queue entries.
- **Never allowed:** `package.json`, `bun.lock`, `uv.lock`, `pyproject.toml`.
- **Unchanged:** the check is still done at hand-off, with no committed sha pin (P-17).

**Other edits to the brief**
- **Header:**
  - `Fault:` now says the fault is resolved by amendment and keeps the original text.
  - `Test changes:` says the next tester re-checks the rows and routes them to the `ci-fix` (D-20).
- **Sessions:** added a row for this amendment.
- **Approval reset to `pending`:** I followed T-107's precedent (`29134ca`). The criteria were frozen under the earlier approval, so a changed criterion needs a fresh one.

**Other actions**
- **PR #136 body:** updated through the GitHub REST API (`gh api PATCH`). It now carries the amended criterion 4 and a new Next line. Its footer was also replaced with this session's attribution.
- **My commit's scope:** it touches only `tasks/T-111-us-states-15-states-comments.md`. I ran no build or tests.

**File:** /home/user/geo-discovery-zone/tasks/T-111-us-states-15-states-comments.md

Orchestrator: re-stamped `Approved:` (unattended run).
