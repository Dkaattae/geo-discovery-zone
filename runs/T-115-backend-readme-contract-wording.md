# T-115 — `backend/README.md` still calls `openapi.yaml` "the contract" — run log

**Task:** T-115 · **Branch:** `claude/epic-shannon-s86cuf` · **PR:** #145
**Started:** 2026-11-16 · **Outcome:** ready for merge

## Round 1 — task-expander — 2026-11-16
`Next step` on entry: `(none — no brief)` → on exit: `worker`

**TL;DR:** I expanded T-115 (`backend/README.md` still calls `openapi.yaml` "the contract") into a light brief with 4 criteria, pushed it to `claude/epic-shannon-s86cuf`, and opened draft PR #145. Status is `awaiting approval`, Next step is `worker`, and Approved is `pending`, so a human has to approve the brief before the worker starts.

**Why T-115.** Every queue entry ahead of it needs a person first, so I skipped them:
- **T-085b** needs a reachable Census release, or a person choosing another source.
- **T-056** needs a design decision.
- **T-095** needs a person's answer to its question.
- **T-110** needs a product wording call.

T-115 has no dependencies, and no open PR exists for it. The only open PR is #38, which is P-4.

**Brief.** `tasks/T-115-backend-readme-contract-wording.md`
- **Branch:** `claude/epic-shannon-s86cuf`, written into the `Branch:` header.
- **PR:** #145 (draft), recorded in the header: https://github.com/Dkaattae/geo-discovery-zone/pull/145
- **Baseline:** criteria compare against `main` at `45e8124`.
- **Sessions:** the task-expander row is in.

**Criteria:**
1. **`backend/README.md`:** a case-insensitive search for `contract` matches zero lines. At baseline it matches seven: lines 4, 50, 81, 165, 214, 226 and 244.
2. **Nothing else in `backend/README.md` changes.** Edits stay inside the blocks that held those seven lines, and each sentence keeps its meaning. Lines 4 and 165 are named specifically, the layout code block keeps its line count, and `test_t051_tester_criteria.py::test_c7` still passes.
3. **The `tasks.md` "Where the app is today" table:** the header row and the Backend row lose "contract". The header still names `openapi.yaml` and the plan, the Backend row still says 29 operations and "SQLite or Postgres", and every other row is byte-identical to baseline.
4. **Docs only:** no change to source, migrations, frontend, question-bank, e2e, CI, `openapi.yaml`, the decision or process docs, or dependencies, and no pre-existing test modified or deleted.

**Survey.** Nothing is done yet. The only CI test that reads `backend/README.md` is `test_c7`, and no CI test reads the `tasks.md` table, so I don't expect any pin to go red. The monthly snapshot pins don't run on a PR.

**Commits.** Two expander commits, and the branch's diff against `origin/main` is the brief file only. I did not change `tasks.md` or `PROGRESS.md`, because there was nothing to sweep. The push landed: the branch is level with its remote.

## Approval — 2026-11-16
Orchestrator wrote the unattended `Approved:` stamp. No human saw the criteria.

## Round 2 — worker — 2026-11-16
`Next step` on entry: `worker` → on exit: `tester`

T-115 is done and pushed. No "contract" is left in `backend/README.md`, the `tasks.md` table no longer says it, and the change touches only docs. Status is now `awaiting verification` and Next step is `tester`. The commit is a3103e9 on `claude/epic-shannon-s86cuf`; I fetched afterwards and `git log origin/claude/epic-shannon-s86cuf -1` shows it.

**What changed:**
- **`backend/README.md`:** I reworded the seven baseline lines (4, 50, 81, 165, 214, 226, 244) and also line 166, which is in the same paragraph as 165. Each now says `openapi.yaml` or "the spec" where it said "the contract".
  - Line 165 still reads as history: "`openapi.yaml` as first written had no security scheme…".
  - Line 214 is still a single line, so the layout code block keeps its line count.
- **`tasks.md`:** only two lines changed. The table header (line 117) now reads "`openapi.yaml` / plan describes" and the Backend row (line 124) reads "all 29 `openapi.yaml` operations, SQLite or Postgres". I left the sweep paragraph and T-115's queue entry alone.
- **`tasks/T-115-backend-readme-contract-wording.md`:** updated Status, Next step, the worker's Sessions row, Handoff (with a criterion → where table) and Notes.

**Checks:**

| Suite | Result |
|---|---|
| Backend tests | 785 passed, 9 skipped, including `test_c7_no_file_says_map_click_is_withheld` |
| ruff lint and format | clean |
| question-bank | 229 pass, typecheck clean |
| Frontend | not run successfully (see below) |

**Tests made stale:** none.

**Frontend:** `bun install` was refused by the proxy (403 on the `react-simple-maps`, `d3-geo` and `d3-color` downloads). With those packages missing, `bun test` shows 4 failures and typecheck shows matching "cannot find module" errors. No frontend file is in the diff. The Handoff asks the tester to rerun in an environment that can install packages.

**Decision for the reviewer:** where `openapi.yaml` is already named nearby (lines 4, 81, 166, 244) I wrote "the spec" instead of repeating the filename. The criteria allow either; the reviewer can confirm or overturn that.

**Session id:** `$CLAUDE_CODE_REMOTE_SESSION_ID` gave the same value as the expander's row (`cse_011oDiJdNiAkMCtdKuibGJLt`). The run shares one remote session id; I noted that in my Sessions row so the tester can see it.

## Round 3 — tester — 2026-11-16
`Next step` on entry: `tester` → on exit: `reviewer`

**T-115 passes.** All four criteria are met. I checked each one by hand and added no tests, because they are about doc wording and repo shape, which `test-guidelines.md` says are never tested. The verdict is pushed to `claude/epic-shannon-s86cuf` as commit `7936084`, and the remote branch matches it. Status is `pass` and Next step is `reviewer`.

- **How independent this check is:** this is an orchestrated run (`runs/T-115-…` exists), so every role has the same session id, `cse_011oDiJdNiAkMCtdKuibGJLt`, and the Sessions-table check shows nothing. My independence comes only from being a newly spawned subagent that never saw the work done. That depends on the orchestrator having spawned me correctly, so it is weaker than running in a separate session. The Verdict says so.

| # | Verdict | What I checked |
|---|---|---|
| 1 | met | `grep -ci contract backend/README.md` returns 0. At baseline `45e8124` it matched the seven lines the brief names: 4, 50, 81, 165, 214, 226, 244. |
| 2 | met | The diff only changes those seven lines plus line 166, which is in the same paragraph as 165. Lines 4 and 165 keep their meaning, line 214 is still one line, and its code block is 23 lines both before and after. The `test_c7` test passes. |
| 3 | met | In `tasks.md`, only lines 117 and 124 changed, and neither contains "contract" now. The header still names both `openapi.yaml` and the plan. The Backend row still says 29 operations and "SQLite or Postgres". |
| 4 | met | The PR changes only `backend/README.md`, `tasks.md`, the brief and the run log. None of the forbidden paths is touched. |

**Test results**
- **Backend** (with the outbound proxy blocked, as in CI): 785 passed, 9 skipped. `ruff check` and `ruff format --check` are clean.
- **question-bank:** 229 pass, 0 fail, and the typecheck is clean.
- **frontend:** could not run here. `bun install` failed with proxy 403s, which leaves 4 test failures ("Cannot find package 'react-simple-maps'") and matching typecheck errors. The diff touches nothing in `frontend/`.
- **PR #145 CI** on the worker's commit `a3103e9`: every job succeeded, including frontend. On the current head `c152957`, which only adds the run log, the jobs were green or still running when I checked.

No existing tests were changed and there is no test change request.

## Round 4 — reviewer — 2026-11-16
`Next step` on entry: `reviewer` → on exit: `human` (approved, PR marked ready; brief swept)

**I approved T-115 and marked PR #145 ready for review. It is inside the envelope, so there is no escalation.** The sweep is pushed to the PR's branch. Dkaattae only needs to merge; I did not merge.

CI on the new head (`5ff59e7`) had not finished when I stopped. "Green" below means CI on the worker's commit `a3103e9` plus my local runs.

**What landed**
- **`backend/README.md`:** the seven lines that said "the contract" now say `openapi.yaml` or "the spec".
- **`tasks.md`:** the header and Backend row of the "Where the app is today" table do the same.
- **Nothing else changed in either file.** It is docs only.

**Review**
- **Every role's work is in the PR:** the expander, worker and tester all have commits on `claude/epic-shannon-s86cuf`.
- **Each role stayed in its lane:** expander and tester commits touch only the brief. The worker's commit touches the two docs and the brief. The orchestrator's commits touch only `runs/` and the brief's `Approved:` line.
- **No scope creep:** I read every hunk, and each sentence still means what it did.
- **The worker's flag is settled:** I accepted using "the spec" where `openapi.yaml` is already named nearby.
- **Why no escalation:** the tester passed, the suites are green, nothing changed outside the Constraints, and nothing touched dependencies, `openapi.yaml`, migrations, the plan or text a child reads. `Test changes` and `CI fix` are both `none`, and no product decision was made along the way.

**Non-blocking finding, queued as T-116 (S, §E of `tasks.md`)**
- **About twenty code comments and docstrings still say "the contract":** in `backend/app/`, `frontend/src/lib/api/client.ts:188` and `question-bank/src/seed-level.ts:87`.
- **One served string does too:** the validation 422's `detail` at `backend/app/main.py:116`, "The request did not match the contract." No test pins it.
- **I made it one task** so this doesn't become another one-file-at-a-time chain like T-104 → T-105 → T-106 → T-115.

**Commits pushed** (confirmed: local and origin both at `5ff59e7`)
- **`415b509`:** adds the brief's `## Review` and my Sessions row, and sets Status to `approved` and Next step to `human`. Committing this before the sweep keeps the review in git history.
- **`5ff59e7`:** the sweep. It deletes the brief, replaces T-115 with T-116 in `tasks.md`, adds a line to the sweep log, and adds the T-115 entry to `PROGRESS.md` under Completed tasks.

**PR body:** rewritten with the four criteria verbatim, what verified each, the review, what I chose not to do, and the sweep.

**Tests run after the sweep:** backend 785 passed, 9 skipped. `question-bank/src/committed-bank.test.ts` (the one non-snapshot test that reads `tasks.md` or `PROGRESS.md`): 134 passed.

## Task ended — 2026-11-16
Ready for merge. PR #145 is Dkaattae's to merge.
