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

## Round 2 — worker — 2026-10-16
`Next step` on entry: `worker` (after a human approves below) → on exit: `tester` — **attended**: one pre-existing test is stale by design and needs a Test change request a person approves (D-14, D-15)

**TL;DR:** T-086 is built and pushed in commit `23b3227` on `claude/wonderful-heisenberg-0ekakv`. I removed all three unused pieces in `seed-level.ts` and corrected E-22 in place. Levels and weights are unchanged. One existing test now fails on purpose, so the tester step needs a person present to approve a Test change request (D-14, D-15).

- **Status:** `awaiting verification`
- **Next step:** `tester`, attended by a person
- **Push:** `git log origin/claude/wonderful-heisenberg-0ekakv -1` shows `23b3227 T-086 worker: …`

**Why everything was removed:** the brief only lets you keep an item if a caller in the repo or a queued task uses it. Nothing does, and T-085 does not name a call to `levelFor`. So `levelFor`'s `weights` parameter, the `export` on `levelFor` and the `export` on `nearDistractorCount` are all gone.

**Files changed:**
- **`/home/user/geo-discovery-zone/question-bank/src/seed-level.ts`**
  - Both exports and the `weights` parameter are removed.
  - `levelFor` now opens with `const weights = LEVEL_SEED_WEIGHTS;`, so the rest of its body is byte-identical. Because the `weights.familiarity_bonus;` line is unchanged, criterion 12's baseline test still passes. That leaves one stale test instead of two.
  - The header comment no longer says T-025 will tune it.
- **`/home/user/geo-discovery-zone/engineering-decisions.md`** (inside E-22 only):
  - New bullet, "What the module exports", records the three removals and why.
  - The `familiarity_bonus` sentence that said T-025 would set it is reworded.
  - "Revisit when" now names T-085 instead of T-025; the other three triggers are kept.
  - The band paragraph now gives `3.5 - 2 = 1.5`: the Medium/Hard boundary, which the app shows as Hard.
- **`/home/user/geo-discovery-zone/tasks/T-086-seed-level-loose-ends.md`:** Handoff, Notes, my Sessions row, Status and Next step.

**Test now failing (stale):**
- **Test:** `hand-check-levels-verify.test.ts` › `T-025 criteria 10-13: what must still hold` › `criterion 10: exported names and function signatures of seed-level.ts equal aa88101's`.
- **Proposed fix:** take the two removed entries out of `AA88101_EXPORT_SIGNATURES` and keep the other six pinned.

**Suite results:**
- **question-bank:** 2211 pass, 1 fail (the stale test). Typecheck, lint and format check are clean.
- **backend:** 537 passed, 9 skipped.
- **frontend:** 375 pass, 1 fail. This is the 403 already noted in `PROGRESS.md`: the agent proxy blocks the `pkg.dev` registry, so `react-simple-maps` can't install. I changed no frontend files, so CI has to close this part of criterion 14.
- **Side effect:** a frontend lint test rewrote `frontend/README.md` while dependencies were half-installed. I reverted it; the tester may see the same thing.

**Decisions for others:**
- **Tester:** criterion 13's diff also includes `runs/T-086-seed-level-loose-ends.md`, which the orchestrator wrote. The criterion's list of allowed files doesn't name `runs/`, so it's your call whether that counts.
- **Reviewer:** confirm removing all three, or send it back to `task-expander` if T-085 is expected to need `levelFor` exported. Also confirm the local-const approach in `levelFor`.
- **Orchestrator / process owner:** the session-id variable returns the orchestrator's id to every role. My Sessions row therefore matches the expander's, so the table can't show that the worker and tester ran in separate sessions in this run.
