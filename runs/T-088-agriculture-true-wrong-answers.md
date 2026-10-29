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

## Round 2 — worker — 2026-10-29
`Next step` on entry: `worker` → on exit: `tester`

**T-088 is built and pushed. It now waits for the tester.** The commit `6587ed0` is on `origin/claude/epic-hopper-pav2ip`, and I checked it landed with `git log origin/claude/epic-hopper-pav2ip -1`. Status is `awaiting verification`, Next step `tester`. 17 existing tests are red by design: 16 in question-bank and 1 in backend. All are named in the brief's Handoff under **Tests made stale** for the tester's Test change request. Your plan to attend the tester step holds.

**What changed**
- **`question-bank/src/distractors.ts`**:
  - The two lists, Table A (`ALSO_RAISED`) and Table B (`ALSO_GROWN`), are copied verbatim and keyed by postal code.
  - The five new animals are in `ADDED_FARM_ANIMALS`.
  - Each agriculture question now skips everything in its state's row.
  - The five new animals are offered only after every animal some state lists, in the fixed order goats, horses, ducks, rabbits, bison. The same exclusion rules apply to them.
- **`question-bank/src/templates.ts`**: only the two agriculture strategy docstrings.
- **The two bank files**: `question-bank/data/questions/us-states.json` and `backend/app/data/content.json` were regenerated by the two commands in criteria 18–19. Re-running both reproduces them byte for byte.
  - 36 of the 74 agriculture questions changed their choices. Nothing else changed: same 415 ids, every other question identical to main.
- **`engineering-decisions.md`**: only E-25 changed. It gets a dated T-088 amendment covering criteria 26–31, including "not yet checked against USDA NASS".
- **New `question-bank/src/agriculture-true-wrong-answers.test.ts`**: 15 tests, all passing. They cover the committed bank and small made-up inputs for criteria 4–17.

**Results**
- **Pennsylvania and California** come out exactly as criteria 9–10 require: `{sheep, rabbits, bison}` and `{pigs, rabbits, bison}`.
- **The five new animals** appear in 8 of the 24 farm-animal questions: goats 1, horses 4, ducks 4, rabbits 2, bison 2.
- **question-bank**: 2557 pass, 16 fail, all on the stale list. Typecheck, lint and format check are clean. Main was fully green, once I installed the missing dev dependencies from the existing lockfile.
- **backend**: 741 pass, 1 fail (on the list), 9 skipped. Lint and format check are clean.
- **frontend**: no files changed, but its suite could not run cleanly here. The proxy refused a package download (`topojson-client`, 403), so `react-simple-maps` and `us-atlas` are missing. That causes module errors, 2 typecheck errors and one lint-test timeout. The two frontend tests that read the bank pass (16/16). The tester needs to re-run the frontend somewhere packages install.

**Why the 17 tests are red**
- **Three expect every farm-animal wrong answer to be some state's animal**, which the five new animals are not. These need modifying, not just re-pinning.
- **Eleven pin the old bank files** by digest or by comparing to an old commit. One of them is the backend `test_t051_tester_criteria.py`, which the brief did not predict.
- **Three pin `engineering-decisions.md`** outside E-22 or E-29. The brief did not predict these either; criteria 26–31 require the E-25 edit, so they go red.
- The three backend tests the brief expected to go red (t085a, t040, t026) stayed green, and so did `BANK_DIGESTS`.

**Decisions for others**
- **Session id, for the orchestrator or a human**: the shell gave this session the same id as the expander's (`cse_011oDiJfrwMg1JqLUkLqFoYa`). I recorded it in the Sessions table with a note. The tester's "different session" check needs to account for this.
- **Order of the new animals, for the reviewer**: last, in a fixed order, was my call (the brief left it to the worker). It keeps the "never the right answer" giveaway as rare as possible. Changing the order changes the counts above and E-25's sentence.
- **Iowa, for a human reviewer**: Iowa's wrong answers include `dairy cows`. Table A allows this; it is checklist item 2.
- **Stale wording, for the reviewer to queue**: E-22's "six farm animals" line and the comment in `seed-level.ts` are now out of date. I left them alone because the brief puts them out of scope.

No rows were changed, nothing was fetched, and no dependency was added.

Files:
- /home/user/geo-discovery-zone/tasks/T-088-agriculture-true-wrong-answers.md
- /home/user/geo-discovery-zone/question-bank/src/distractors.ts
- /home/user/geo-discovery-zone/question-bank/src/agriculture-true-wrong-answers.test.ts
- /home/user/geo-discovery-zone/engineering-decisions.md
