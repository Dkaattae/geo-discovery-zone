# T-086 — `seed-level.ts` and E-22 loose ends after T-025 — run log

**Task:** T-086 · **Branch:** `claude/wonderful-heisenberg-0ekakv` · **PR:** #86
**Started:** 2026-10-16 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-16
`Next step` on entry: (no brief) → on exit: `worker` (after a human approves below)

**TL;DR:** I wrote the T-086 brief and opened it as draft PR #86. It sits at `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. The push is on `origin/claude/wonderful-heisenberg-0ekakv`: `git log` there shows `88b85d6`, and the local branch is level with it. Next, a person approves the brief (or the orchestrator stamps it under its rules), then the `worker` runs.

**Pick**
- **T-086 — `seed-level.ts` and E-22 loose ends after T-025** (S). It is the first entry in the queue whose dependencies are done.
- **Skipped:**
  - T-064 depends on T-040, which has not run.
  - T-070 is waiting on Q1.
  - T-084 is gated on T-070. I added a "Skipped again, 2026-10-16, for T-086" line to its entry.
  - T-085 is waiting on a person.
- `tasks/` held only README and TEMPLATE when I started, so the last cycle was swept.

**Files** (my commits touch only `tasks/` and `tasks.md`)
- /home/user/geo-discovery-zone/tasks/T-086-seed-level-loose-ends.md — the brief: 14 criteria, a full template rather than a light one because the criteria run past four. `Branch:` is `claude/wonderful-heisenberg-0ekakv` and `PR:` is #86.
- /home/user/geo-discovery-zone/tasks.md — T-086 marked `doing`, plus the T-084 skip line.
- Commits: `146c64f T-086 expander: seed-level-loose-ends` and `88b85d6 T-086 expander: record PR #86 in the brief header`.
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/86 (draft, criteria in the body).

**What the survey found that the queue entry did not say**
- **The band label is already right.** The entry says level 3.5 is "between medium and hard". But `band_label` in `backend/app/levels.py` and `bandLabel` in `frontend/src/lib/level.ts` both render band 1.5 as "Hard". So E-22's "1st grade (hard)" matches what the app shows. Criteria 7 and 8 ask E-22 to state band 1.5, the Medium/Hard boundary, without calling it "medium".
- **There is a second stale future-tense T-025 reference.** It is "so T-025 can set it", in E-22's `familiarity_bonus` bullet. I added it as criterion 6 under the entry's "E-22 is true".
- **`levelFor` and `nearDistractorCount` have no importer, and no caller passes `weights`.** Their only mention outside `seed-level.ts` is as string pins in `hand-check-levels-verify.test.ts` criterion 10.

**Decisions I made that a reviewer may want to check**
- **Keep-or-drop is left to the worker.** The queue entry allows either, but the criteria require E-22 to record the choice for each of the three items. A "kept" choice must name a real use, a caller or a queued task id. The test pin does not count as a use, and neither does "harmless".
- **Removing anything turns two existing tests red by design:** `hand-check-levels-verify.test.ts` criterion 10 (signature pins) and criterion 12 (the `weights.familiarity_bonus;` baseline line). That needs a Test change request, which a person has to approve in an attended tester session (D-14, D-15). The brief says to plan for that.
- **Worker model:** Sonnet is enough.

I ran no build, test or pipeline command. Bash was used only for git, plus two small file edits.
