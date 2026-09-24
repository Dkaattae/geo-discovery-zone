# T-074 — Three READMEs state suite sizes nothing checks — run log

**Task:** T-074 · **Branch:** `claude/happy-knuth-slmllf` · **PR:** #58
**Started:** 2026-09-24 · **Outcome:** in progress

## Round 1 — task-expander — 2026-09-24
`Next step` on entry: `—` (no brief existed) → on exit: `worker`

**TL;DR:** I expanded T-074 ("Three READMEs state suite sizes nothing checks") into a full brief with 22 criteria. It is pushed to `claude/happy-knuth-slmllf` and draft PR #58 is open. **Next:** the brief needs approval (`Approved:` is still `pending`), then `worker`.

- **Brief:** `/home/user/geo-discovery-zone/tasks/T-074-readme-suite-counts.md`
- **Header:** `Status: awaiting approval`, `Next step: worker`, `Approved: pending`, `Branch: claude/happy-knuth-slmllf`, `PR: #58`. I added a Sessions row for task-expander, session `cse_01VbP99X5Wcy9gLq5di9UETL`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/58 (draft, base `main`, criteria in the body).
- **Push confirmed:** `git log origin/claude/happy-knuth-slmllf` shows `163262f T-074 expander: record PR #58…` on top of `6578acc T-074 expander: readme-suite-counts`. Against `main`, the diff touches only `tasks.md` and `tasks/T-074-readme-suite-counts.md`. I ran no build and no tests.

**Why T-074 was picked**
- T-066, T-060 and T-071 come earlier in §A, but each is still waiting on a dependency or bot decision that is Dkaattae's to make. I passed over them again and noted the date in `tasks.md`.
- T-074's dependency, T-065, landed in PR #57. I marked T-074 `doing` in the queue.

**What the brief asks for**
- **Remove the counts:** delete the suite-size figures from `backend/README.md`, `backend/integration/README.md` and `e2e/README.md`. That includes `(9 Postgres-only ones skip)`, which the existing detector misses because it says "ones", not "tests".
- **Reuse the guard:** point the existing `hasSuiteCountClaim()` in `frontend/src/stale-suite-counts.criteria.test.ts` at the three READMEs, with no second detector.
- **Widen the guard:** make it also scan `PROGRESS.md`'s `## Known gaps in what is done` and `## Next` sections, through the end of the file. The criteria pin both edges of the history section, and the guard must fail if either heading is renamed.
- **Fix the header:** the guard's comment credits the verifying session; it should name the worker (git history confirms the T-065 worker wrote it).

**Watch-out for the worker**
- T-065's tester harness (`frontend/src/stale-suite-counts-guard.criteria.test.ts`, `GUARD_INPUTS`) copies a fixed list of the guard's input files into a scratch tree.
- If the guard starts reading new files and that list is not extended, the harness goes red.
- This is in Constraints, and criterion 18 forbids weakening or skipping that harness.

**Left for the reviewer's sweep**
- `tasks.md`'s §A "Test counts in docs" row and `PROGRESS.md:1007-1011` describe the pre-task state. The brief keeps them out of the worker's diff (criterion 22), so the reviewer updates them.

**Nothing blocked:** no dependency and no product decision is needed. The recommended worker model is Sonnet.

## Approved — 2026-09-24
Recorded on the brief: `katechen150621@gmail.com — 2026-09-24, approved via chat in the orchestrator session.`
The run paused at the step-2 gate after round 1 because a human was present; the user replied
"approved, go ahead", and that approval is what is recorded here.
