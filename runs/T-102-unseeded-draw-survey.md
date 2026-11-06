# T-102 — Other backend tests may assert on an unseeded draw — run log

**Task:** T-102 · **Branch:** `claude/fervent-ptolemy-4py2eg` · **PR:** #126
**Started:** 2026-11-06 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-06
`Next step` on entry: `(none — no brief)` → on exit: `worker`

I expanded T-102 into a brief and opened draft PR #126 (https://github.com/Dkaattae/geo-discovery-zone/pull/126). Status is `awaiting approval`, Next step is `worker`, Approved is `pending`, so a person has to approve the brief before the worker starts.

**What got picked:** T-102, "Other backend tests may assert on an unseeded draw" (§E, size S).

- **Skipped T-085b:** it needs a reachable Census release, or a person choosing another source.
- **Skipped T-056:** it waits on a design decision.
- **Skipped T-095:** its question needs a person's answer before it can be expanded.
- **Open PRs:** the only one was #38, which is P-4, a process ticket. Nothing was in flight.

**The brief:** `/home/user/geo-discovery-zone/tasks/T-102-unseeded-draw-survey.md`
- **Branch:** `claude/fervent-ptolemy-4py2eg`, written into the `Branch:` header.
- **Commits:** two, both pushed (`T-102 expander: unseeded-draw-survey`, then the PR number). The local branch matches origin, and the diff against `origin/main` is only the brief file.
- **Sessions row:** task-expander, 2026-11-06, `cse_011oDiJbsZTbExMiPULZMiFd`.
- **Format:** full brief, not the light path, because it has 10 criteria.

**Criteria, in short:**
- **1–3, the survey:** the worker's Handoff has a table of every `backend/tests/` test that serves a question through the API and asserts on what was drawn. Each row is classed `pinned (fixed_draw)`, `pinned (force)`, `holds under any draw` or `needs pin`. The tester checks the table is complete with its own survey. A "holds under any draw" row must give a reason that is certain, not "it passed N times".
- **4–5, pinning:** no row is left at `needs pin`. Each is pinned through a Test change request a person approves, and pinning keeps every assertion the test made.
- **6, perturbed-draw check:** every test file containing `/sessions` must pass 20 runs, seeds 0–9 times the candidate order as returned or reversed. The perturbation must not replace `pick_question`.
- **7–10, things that must not change:** `backend/app/` stays as it is, T-101's `fixed_draw` (seed 101) and its three tests stay as they are, no new dependency, and all three unit suites pass with no network.

**Already true when I surveyed (`a7945cf`):**
- **T-101 pins three tests** with `fixed_draw`.
- **Three test files already force their draw:** `test_t051_tester_criteria.py`, `test_t093_tester_criteria.py` and `test_t093_undo_places_seen.py` install their own picker.
- **Root cause:** `store.candidate_questions` has no `ORDER BY`, so the draw depends on row order as well as on unseeded module `random`.
- **Untested by me:** I ran nothing, as the expander role requires, so I make no claim about which tests actually fail.

**What a person needs to do:**
- **Approve the brief** by filling in its `Approved:` line.
- **Attend the tester step if the survey finds a test that needs pinning.** Changing an existing test needs a person's approval in the tester's session, so an unattended run will stop at `test changes requested` / `human`.

## Approval — 2026-11-06
Orchestrator wrote the unattended-run `Approved:` stamp. No human saw the criteria.
