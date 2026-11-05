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

## Round 2 — worker — 2026-11-05
`Next step` on entry: `worker` → on exit: `tester` · `Status` on exit: `awaiting verification` · head `b8bc1d3`

**T-101 worker: nothing to implement. The handoff is pushed and the brief is now `awaiting verification`, with the tester next.** The fix is a change to three tests that already exist on `main`. The brief and D-14 say only the tester may make it, so I changed no source and no test. Commit `b8bc1d3` is on `origin/claude/pensive-cori-y64q82`; I checked with `git log origin/claude/pensive-cori-y64q82 -1`.

**Changed:** only `/home/user/geo-discovery-zone/tasks/T-101-mixed-session-format-flake.md`, in these sections:
- **Status / Next step:** set to `awaiting verification` / `tester`.
- **Sessions:** worker row added.
- **Handoff:** written in full.
- **Notes:** one line added.

**Checked and run:**
- **Survey holds on the branch:** the session draw uses Python's shared `random` because no generator is passed in (`sessions.py:112`). `store.candidate_questions` has no `ORDER BY`. The three assertions sit where the brief says.
- **Baseline `make -C backend check` passed:** lint and format check clean, 1039 passed, 9 skipped, in 122 s. The flake did not show up.
- **Partial seed probe, test (A) only:** I seeded `random` just before the test body for seeds 0–79, and all 80 passed. This is not the criterion 1 evidence. The tester still has to try 500 seeds for each of (A), (B) and (C). Failures look rare, so criterion 1 may come back "none found in 500". The handoff has the four-line throwaway pytest plugin and the command for the tester to reuse.

**Tests made stale:** these three are wrong rather than stale: they pass or fail by chance on `main`. I left them unedited.
- **(A)** `test_c25_...` in `test_t040_tester_criteria.py`
- **(B)** the `mixed` case of `test_a_perfect_session_reaches_every_question_once` in `test_content_build.py`
- **(C)** `test_c22_...` in `test_t040_tester_criteria.py`

**Proposed fix (tester picks, a person approves the rows):** a fixture that replaces `app.routers.sessions.pick_question` with a wrapper that:
- sorts the candidate questions by id, so SQLite and Postgres serve the same sequence (criterion 6);
- passes the real selection function its own seeded generator, so the shared `random` is never read or changed (criteria 2 and 9).

The format check stays an exact three-format equality and the `>= 40` states check stays, so removing a format or a state still turns them red (criteria 3–5). The handoff also gives the two rejected alternatives and why each loses.

**Flag:** the Sessions table shows the same session id (`cse_011oDiJfGwhpXZVuG9dHVa98`) for the expander and the worker. Every agent this orchestrator spawns gets that value back. It does not mean one context did both roles. I noted it in the handoff for the tester, or a human reading the run log, to weigh.

**Not done, on purpose:** no test edits, no 500-seed reproduction, no local Postgres run, no frontend or question-bank runs. All of these belong to the tester. No count-floor tests pin either file.

**Expected next:** the tester step will likely stop at `test changes requested` / `human`, as the brief warns. That is expected, not a fault.

> Orchestrator note: this hand-back also carried work content to the orchestrator unprompted. Recorded here only; nothing from it goes into the tester's prompt.

## Round 3 — tester — 2026-11-05
`Next step` on entry: `tester` → on exit: `human` · `Status` on exit: `test changes requested` · `Test changes:` `requested` · head `a2da4e7`

**TL;DR:** T-101 is stopped at `test changes requested` and needs a person. All three fixes change tests that already exist, and only a person can approve that, in a tester session they are attending (D-15). I applied nothing. Brief commit `a2da4e7` is pushed to `claude/pensive-cori-y64q82`, and `origin/claude/pensive-cori-y64q82` points at `a2da4e7` too.

**Header:** Status `test changes requested` · Next step `human` · Test changes `requested` · Fault says the approval is waiting on a person. I added a tester row to the Sessions table.

**Independence:** this is an orchestrated run. My session id `cse_011oDiJfGwhpXZVuG9dHVa98` is the same one listed for task-expander and worker, so the id check proves nothing either way. My independence rests only on being freshly spawned with my own context, which is weaker than a separate session. The Verdict says so.

**Criterion 1 (showing the flake on `main`): no failing seed in 500 for any of the three tests.**
- The branch's `backend/` is identical to `5cc0ecb`, so these runs are against `main`.
- A throwaway pytest plugin, not committed, seeded the global `random` with each value 0–499 right before the test body.
- I checked the harness first on a dummy test: it flagged exactly the seeds that should fail.
- Results: (A) 500 runs, 0 failures; (B) mixed case 500 runs, 0 failures; (C) 500 runs, 0 failures.
- So the failure T-099 saw did not reproduce. The brief allows this outcome. The cause may be rarer than 1 in 500, may come from the database's row order, or may come from random state used earlier in a full-suite run.

**Test change request (rows 1–3, all pending):**
- **Shared helper:** a new `fixed_draw` fixture in `backend/tests/conftest.py`. It replaces the router's `pick_question` with the real selection function, but feeds it the candidates sorted by id and its own `random.Random(101)`. The global `random` is never read, and the order SQLite or Postgres returns rows in no longer matters.
- **Row 1, (A):** adds the fixture. The test body does not change.
- **Row 2, (B):** pytest 9.1.1 will not attach a fixture to a single parametrised case (`ValueError: pytest.param cannot add pytest.mark.usefixtures`). So the `mixed` case moves into its own new test using the fixture, with the same two checks: 100 distinct ids, and exactly the three formats. The `location` and `capital` cases and the shared body stay byte-identical.
- **Row 3, (C):** adds the fixture and plays **300 wrong answers instead of 200**. Every other check stays: exactly the three formats, at least 40 states, and every reveal check on every served question.

**Criterion 5 can't be met by (C) at 200 answers.**
- I ran a prototype test under `backend/tests/` and deleted it before committing.
- With questions restricted to 40 states, 200 wrong answers reached only 36–37 states under every seed I tried, so the "40 states does not fail" half fails.
- 40 of 40 states were first reached at answers 251–265 (seeds 101, 1, 2). That is why row 3 proposes 300.
- The person approving should know that row 3 changes T-026's count of 200.

**Still to verify after approval:** criteria 2–9, 12 and 13 depend on the rows being applied, so they are unchecked. Criteria 10 and 11 hold: nothing under `backend/` changed. No count-floor tests cover either file.

**What a human needs to do:** start the `tester` step for T-101 in a session you are attending, and approve or refuse rows 1–3 there.

Files: the brief (Verdict and Test change request); scratchpad seed harness, per-seed logs and prototype (session-local, not committed).

## Halted — test change request — 2026-11-05
Raised by the tester in commit `a2da4e7`. The rows are in the brief's `## Test change request`; per D-15 the orchestrator does not approve, stamp or relay them.

**What a human has to do:** start the `tester` step for T-101 in a session you are attending. It will ask about each row, apply what you approve, and finish verifying. Then start a new run from whatever `Next step` it writes.

## Resumed — 2026-11-05
Dkaattae, in the orchestrator's session: "ci fixed. please proceed". The attended tester session had acted on the branch since the halt (head `592eb41` → `1a0fde7`, last commit `T-101 tester: verdict pass`). Header on resume: `Status: pass` · `Next step: reviewer` · `Test changes: approved — Dkaattae, 2026-11-05`. Carrying on from `Next step`.
