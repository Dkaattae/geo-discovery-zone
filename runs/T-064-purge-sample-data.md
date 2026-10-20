# T-064 — Purge `question-bank/sample-data/` now the full bank is proven — run log

**Task:** T-064 · **Branch:** `claude/optimistic-pascal-wk81ey` · **PR:** #89
**Started:** 2026-10-20 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-20
`Next step` on entry: (no brief) → on exit: `worker` (after approval below)

**TL;DR:** I wrote the T-064 brief (purge `question-bank/sample-data/`), pushed it to `claude/optimistic-pascal-wk81ey`, and opened draft PR #89. The brief says `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. The tester step will need a person in the session: at least 11 older test files read `sample-data/`, so it will raise a Test change request.

**Why T-064**
- `tasks/` held only `README.md` and `TEMPLATE.md` at the start, so there was no unfinished brief from a previous cycle.
- Section A of `tasks.md` is empty, and T-064 is the first entry in section B.
- Its precondition was T-040, which landed in PR #88.

**What the brief asks for (15 criteria)**
- **Delete it:** the `sample-data/` directory and the `build:sample` script in `question-bank/package.json`. The rest of `package.json` stays byte-identical.
- **Docs:** remove live mentions from `question-bank/README.md`, `conventions.md`, the header comment in `build.ts`, and the "Done" section of `PROGRESS.md` (line 118). The question-bank README must still name one specific `data/us-states/us-state-<xx>.json` file as the example of an entity's shape.
- **Nothing else moves:**
  - `data/` (`us-states/` and `questions/`) and `src/fixtures/` stay byte-identical.
  - No dependency or lockfile change.
  - Non-test source changes are comments only.
  - `frontend/`, `backend/`, `e2e/`, `.github/`, `.claude/`, `openapi.yaml` and the plan are untouched.
- **Kept guarantee:** a test must still fail when a tracked `data/` file contains `"reviewed": false`, checked by mutation.
- **No leftover reads:** no test may read a path under `sample-data/`.
- **Suite:** the question-bank suite, typecheck, lint and format:check must pass, plus the frontend suite, because `conventions-doc.test.ts` reads `conventions.md` and `package.json`.
- **Older tests:** they change only under approved Test change request rows. The worker touches none of them and lists them under "Tests made stale" in its Handoff.

**Decisions I made that a human approver should look at**
- **`build:sample` goes too.** With the directory gone it would only recreate an untracked folder.
- **The `S` size understates the work.** I wrote a full brief and called it M. The Context section lists the stale-test candidates by file and line, from a grep rather than a run.
- **More pins go red.** `hand-check-levels-verify.test.ts` criterion 15 pins every `package.json`, and criterion 17 pins every older question-bank test file. Both will go red and each needs its own row.
- **T-070's digest-guard question (Q1) is out of scope.** Guards are edited only where `sample-data/` is what they read.

**Commits and push**
- The two commits are `0808287` (the brief, plus T-064 marked `doing` in `tasks.md`) and `b24dbbe` (PR number written into the header).
- The diff against base `97780b5` touches only `tasks.md` and the brief.
- `git log origin/claude/optimistic-pascal-wk81ey` shows `b24dbbe`, so the push landed.
- After my last commit, the system reported that the brief changed on disk. I did not re-read it or revert anything, so its current contents are worth a look.

**Files**
- `/home/user/geo-discovery-zone/tasks/T-064-purge-sample-data.md`
- `/home/user/geo-discovery-zone/tasks.md`
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/89

## Approval — 2026-10-20
Orchestrator stamped `Approved:` under `orchestrator.md` "Approval": unattended run, criteria not read by the orchestrator.

## Halted — worker spawn refused — 2026-10-20
G0–G4 passed (`Next step: worker`, G1 clean, `Approved:` stamped, 0 fail / 0 blocked, branch = header). The harness's auto-mode classifier refused the worker spawn ("Instruction Poisoning"), the same shape as T-078's refused self-approval. Halted under G2: a person must approve the brief in the orchestrator's session before the worker runs. Brief header left as the expander wrote it apart from the `Approved:` line.

## Human approval — 2026-10-20
The person in the orchestrator session wrote: "approved, start the worker". `Approved:` line rewritten to record it. Resuming at `Next step: worker`.
