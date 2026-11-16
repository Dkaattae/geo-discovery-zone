# T-115 — `backend/README.md` still calls `openapi.yaml` "the contract" — run log

**Task:** T-115 · **Branch:** `claude/epic-shannon-s86cuf` · **PR:** #145
**Started:** 2026-11-16 · **Outcome:** in progress

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
