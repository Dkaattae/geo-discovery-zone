# T-088 — Wrong answers that are true: crops and farm animals a state does grow — run log

**Task:** T-088 · **Branch:** `claude/epic-hopper-pav2ip` · **PR:** #109
**Started:** 2026-10-29 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-29
`Next step` on entry: (no brief) → on exit: `worker`

**TL;DR:** I wrote the T-088 brief (crop and farm-animal wrong answers that the state actually grows or raises), pushed it to `claude/epic-hopper-pav2ip`, and opened draft PR #109. The brief says `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. Next, someone records an approval on the brief's `Approved:` line (a person, or the orchestrator's unattended stamp), and then the `worker` starts, on Opus.

**What was picked, and why**
- **T-088 was picked.** Its `Depends on` is "nothing", and its lists and the five extra farm animals were approved by Dkaattae on 2026-10-27.
- **T-085b was skipped.** It comes first in the queue but is blocked: a person still has to choose a Census source. This is recorded in the brief's Notes.
- **`tasks/` was empty at the start**, so the last cycle had been swept.

**What the brief contains**
- **Two tables from the queue entry**, copied word for word and made part of the criteria:
  - Table A: farm animals to exclude for the 24 states that list `top_livestock`.
  - Table B: crops to exclude for all 50 states.
- **31 acceptance criteria**:
  - **1–4:** the set of questions and every field except `choices` stay as on main `a42b71b`.
  - **5–10:** the farm-animal rules. Two boundary cases are pinned exactly: Pennsylvania's wrong answers are {sheep, rabbits, bison} and California's are {pigs, rabbits, bison}.
  - **11–13:** crops are excluded on top of T-026's existing rule.
  - **14–17:** the rule lives in `buildChoices`, not in an edit to the committed file. Non-`us-state-xx` entities are unaffected, the five added animals are never a correct answer, and output is deterministic.
  - **18–19:** both regeneration commands reproduce the committed files byte for byte.
  - **20–25:** things that must not change: entity data, `openapi.yaml`, `frontend/`, `LEVEL_SEED_WEIGHTS` and every level, dependencies, network use, and every engineering-decisions entry except E-25.
  - **26–31:** what the E-25 amendment must say.
- **Review checklist for a person:**
  - Check every table row against USDA NASS before merging.
  - Iowa: its row does not exclude dairy cows, although PR #91 named that pairing as an example of the problem. Confirm this is intended.
  - Read the regenerated questions.
  - Decide whether it is acceptable that the five added animals are never a right answer.
- **Tests expected to go red by design** are listed under Constraints:
  - `t026-tester-verify` criterion 33, which assumes every wrong answer comes from some state's list.
  - The pins on the question file and `content.json` in the T-085a, T-090, T-025 and backend tester files.
  - A Test change request is close to certain, so the brief says to have a person attend the tester step.
- **Already true, noted in the brief:** agriculture choices never match an entity, so they always count as "far" and levels cannot move. That makes criterion 22 a guard rather than new work.

**Push and branch**
- Two commits are on `origin/claude/epic-hopper-pav2ip`: `7918629` (the brief) and `545d646` (adds PR #109 to the brief). I confirmed both with `git log origin/claude/epic-hopper-pav2ip`.
- The diff against `a42b71b` touches only `tasks/T-088-agriculture-true-wrong-answers.md` and `tasks.md`, where T-088 moved from `todo` to `doing`.
- The brief's `Branch:` header is `claude/epic-hopper-pav2ip`.

**Files**
- /home/user/geo-discovery-zone/tasks/T-088-agriculture-true-wrong-answers.md
- /home/user/geo-discovery-zone/tasks.md
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/109
