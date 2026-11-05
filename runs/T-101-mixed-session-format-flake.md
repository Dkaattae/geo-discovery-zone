# T-101 — A mixed-session format assertion can fail by chance — run log

**Task:** T-101 · **Branch:** `claude/pensive-cori-y64q82` · **PR:** #124
**Started:** 2026-11-05 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-05
`Next step` on entry: (no brief) → on exit: `worker` · `Status` on exit: `awaiting approval`

**TL;DR:** I wrote the T-101 brief, pushed it to `claude/pensive-cori-y64q82`, and opened draft PR #124. A person needs to approve it next. The fix changes tests that already exist, so the tester will stop at `test changes requested` / `human` unless a person is in its session. Someone should plan to attend the tester step.

- **Status:** `awaiting approval` · **Next step:** `worker` · **Approved:** `pending`
- **Brief:** /home/user/geo-discovery-zone/tasks/T-101-mixed-session-format-flake.md
- **Branch:** `claude/pensive-cori-y64q82`. The brief's `Branch:` header names it, and it matches the remote at `dcf8223`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/124 (draft, base `main`, body is the acceptance criteria)
- **Commits:** `T-101 expander: mixed-session-format-flake` and `T-101 expander: record PR #124 in the brief`. Together they touch only `tasks/T-101-…md` and `tasks.md`, where T-101's heading now says `doing (brief awaiting approval …)`.
- **Sessions row:** task-expander, 2026-11-05, cse_011oDiJfGwhpXZVuG9dHVa98

**Why T-101:** §A and §B of the queue are empty. Each entry ahead of T-101 is waiting on a person:
- **T-085b:** needs a choice of Census source.
- **T-056:** needs a design decision.
- **T-095:** needs an answer to its question (a, b or c).

**What the survey found**
- **No seed reaches the draw.** `backend/app/routers/sessions.py:112` calls `pick_question` without an `rng`, so the module-level `random` is used and nothing seeds it.
- **Row order isn't fixed either.** `store.candidate_questions` has no `ORDER BY`. The criteria therefore require passing on both SQLite and Postgres.
- **The scope is wider than the queue entry.** The entry names one test, but two more make the same chance-dependent claim:
  - **(A)** `test_t040_tester_criteria.py::test_c25…`, line 476 (the one in the queue entry)
  - **(B)** the `mixed` case of `test_content_build.py::test_a_perfect_session_reaches_every_question_once`, line 460
  - **(C)** `test_t040_tester_criteria.py::test_c22…`, lines 490–491: the format set, plus `>= 40` states
- The brief covers all three and says that approving it approves the wider scope.

**The 13 criteria, in short**
- **1:** reproduce the failure on `main` (`5cc0ecb`) with a seed, or report "none found in 500 seeds".
- **2:** each test passes under at least 50 different starting states of the random generator.
- **3–5:** mutations prove the tests still catch a missing format, and (C) still catches 39 states versus 40.
- **6:** pass on SQLite and Postgres.
- **7–8:** nothing else in the tests is weakened and no other test changes. Criterion 8 is checked by hand (E-11, E-12).
- **9:** the global random state is restored after each test.
- **10:** nothing changes under `backend/app/` or `backend/scripts/`.
- **11–13:** no new dependency, no network, and the full check passes.

How to fix it (seeding, or a longer session) is left open. The worker is told it has nothing to implement: it lists the three tests under "Tests made stale" and proposes what each should become.

I ran no build, tests or pipeline. Everything above comes from reading source and git history.

> Orchestrator note: the expander's hand-back carried its criteria summary to the orchestrator unprompted. It is recorded here only; it goes into no spawn prompt.
