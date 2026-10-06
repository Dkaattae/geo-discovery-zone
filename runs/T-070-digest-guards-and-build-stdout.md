# T-070 — digest guards and build stdout — run log

**Task:** T-070 · **Branch:** `claude/serene-heisenberg-cd5unq` · **PR:** #73
**Started:** 2026-10-06 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-10-06
`Next step` on entry: no brief (`tasks/` empty) → on exit: `human` (`Status: blocked`, `Approved: pending`)

**TL;DR:** I stopped T-070 as blocked. It needs a decision from a person before anyone can write criteria for it. The brief is committed and pushed, and draft PR #73 is open. The brief says `Status: blocked` and `Next step: human`. No code was written and no acceptance criteria were approved.

**What I picked, and why T-070**
- Section A of `tasks.md` is empty.
- T-064 depends on T-040, which has not been built.
- T-070 has no dependencies, so it is the next task by queue order.

**Why it is blocked**
- **Q1 needs a person's decision:** for part (a), either re-pin the digest guards against `main` and delete every per-task neutralisation, or keep the historical pins and gather the neutralisations into one shared helper.
  - The queue entry itself calls this "a deliberate call rather than a tidy-up".
  - The two options lead to criteria that have almost nothing in common.
  - The person should also say whether the guard has to survive a refresh where only `built_at` and the fixture moved.
- **Q2, a proposed split.** The entry is three tasks:
  - **T-070:** part (a), the digest guards, size M.
  - **T-080:** part (b), the offline harness returning stdout, size S. It does not depend on Q1, needs no test change request, and could be expanded first.
  - **T-081:** the leftover `climate-kid.test.ts:598` check that passes when `git` fails, plus widening `git-baseline-guard` to cover `question-bank/src/`, size S.
- **N1:** most of part (a), and all of T-081, change tests that already exist. A worker is not allowed to do that (D-14). Every such change has to go through a test change request that a person approves in a tester session they attend (D-15). An orchestrated run will halt at that point regardless.
- **Survey finding:** the queue entry counts three digest guards. There are actually four (`landmarks-verify`, `climate-kid-verify`, `top-crops-verify`, `highest-point-verify`), or five if `highest-point-in-state-verify` counts.

Draft criteria for T-080 (five) and T-081 (two) are in the brief and the PR body, clearly marked as not approved.

**State**
- **Files:** `/home/user/geo-discovery-zone/tasks/T-070-digest-guards-and-build-stdout.md` (the only file changed against `origin/main`). I did not touch `tasks.md` or `PROGRESS.md`; T-079's reviewer had already swept, and `tasks/` was empty when I started.
- **Branch:** `claude/serene-heisenberg-cd5unq`, which the brief's `Branch:` header also names.
- **Push confirmed:** `git log origin/claude/serene-heisenberg-cd5unq -1` shows `6a42bec T-070 expander: record PR #73 in the brief header`, on top of `3cedfe8 T-070 expander: digest-guards-and-build-stdout (blocked: ...)`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/73 (draft, base `main`).
- **Header:** `Approved: pending`, `Test changes: none`, `Fault:` filled in. My Sessions row is `task-expander | 2026-10-06 | cse_01UvBvo6qodvNQDpFJPANTgN`.
- **Not run:** the build and the test suite, per D-7.
- **File changed after my last edit:** a notice said the brief changed on disk after my last edit, which I made with `sed`. I did not re-read it. What I committed and pushed is commit `6a42bec`.

**Next step:** a person answers Q1 and Q2, on the PR or in the brief, and then `task-expander` runs again.

## Halted — 2026-10-06

Gates: G1 passed (the only file changed against `origin/main` is the brief). G5 passed (a brief now exists with `Status: blocked`). The working tree was clean on return, and `origin/claude/serene-heisenberg-cd5unq` is at `6a42bec`. The halt is `Next step: human` with `Status: blocked`, which the expander wrote. `Approved:` stays `pending`. It was not stamped, and nothing was built.

What a human has to decide is the expander's list, quoted above: **Q1** (re-pin against `main`, or keep the historical pins behind one shared helper; and whether the guard must survive a `built_at`/fixture-only refresh) and **Q2** (whether to split into T-070 / T-080 / T-081). Answer them in the brief or on PR #73, set `Next step: task-expander`, commit, and start a new run.

Orchestrator note: the header fields were read with a field filter over the first 20 lines (`Status`, `Next step`, `Approved`, `Test changes`, `Branch`, `PR`), so the `Fault:` line was not loaded.
