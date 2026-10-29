# T-085 — Level inputs the weights cannot reach: drawn apart, and capital is the largest city — run log

**Task:** T-085 · **Branch:** `claude/loving-knuth-umj4pp` · **PR:** #107
**Started:** 2026-10-29 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-29
`Next step` on entry: (no brief) → on exit: `worker`

**TL;DR:** I wrote the T-085 brief, pushed it to `claude/loving-knuth-umj4pp`, and opened draft PR #107 (https://github.com/Dkaattae/geo-discovery-zone/pull/107). The brief is `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. Expect the run to stop at the tester for a person: this change makes many existing pin tests stale by design.

**Push confirmed:** `origin/claude/loving-knuth-umj4pp` is at `c0a76d6`. My two commits touch only `tasks/T-085-level-familiarity-inputs.md` and `tasks.md` (T-085 status changed from `todo` to `doing`).

**Why T-085:** it is the first queue entry whose dependencies are met. Section B is empty, and Dkaattae approved T-085's option, list and accepted risk on 2026-10-27. `tasks/` held no leftover brief.

**What the brief asks for (27 criteria):**
- **Hawaii and Alaska, −2:** applies to identify-on-map, click-the-map and climate. Expected levels are HI 4.5 / 5.5 / 7.5 and AK 4 / 5 / 6. No other state or template changes.
- **Capital is the largest city, −1:** applies to `tpl-capital-of` only, for the states that a named U.S. Census Bureau release confirms out of the approved 17. E-22 must record each state's two populations and say whether it was confirmed or left out. The states that get the reduction must equal the states E-22 marks confirmed.
- **Everything else holds still:** every other question keeps its level. The 0–18 clamp is tested at the 0 boundary. `seedLevels` stays pure. Every new number and state id must come from `LEVEL_SEED_WEIGHTS`. The module's exports do not change.
- **Committed files:** both are regenerated and must match exactly (`question-bank/data/questions/us-states.json`, `backend/app/data/content.json`). The entity bank does not change.
- **E-22:** gets a dated paragraph and a before/after table of the levels that changed. It records the accepted Providence 10 → 9 risk. Its statements that `familiarity_bonus` is 0 must go, and its level-range sentences must be corrected. The T-025 table and every other E-n entry stay unchanged.
- **Negative:** no new dependency, no network in tests, `openapi.yaml` unchanged.

**Calls I made that a person may want to look at:**
- **Amounts pinned at −2 and −1.** The queue says the task "may tune" them. A criterion whose expected value the worker picks cannot be tested, so tuning has to come back through the expander.
- **Census check, no guessing.** If the worker cannot reach a Census release, it must stop as `blocked` for a person. It may not fill the table from memory, and it may not drop all 17 states just to get green.
- **Review checklist:** a person checks the Census figures, at least for TN, WV and WY, which the queue flagged as close calls.

**Already true (from my survey):**
- The `familiarity_bonus` term exists as a scalar 0 in `question-bank/src/seed-level.ts`.
- `levelFor` and `nearDistractorCount` are already unexported.
- `ageBand` depends on the template, not the level, so it will not move.
- I read the starting levels from the committed question file and wrote them into the brief.

**Files:**
- /home/user/geo-discovery-zone/tasks/T-085-level-familiarity-inputs.md
- /home/user/geo-discovery-zone/tasks.md

## Approval — 2026-10-29
Orchestrator wrote the unattended-run `Approved:` stamp (not a certification of the criteria).
