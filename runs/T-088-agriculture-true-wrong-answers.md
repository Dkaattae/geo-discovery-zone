# T-088 — Wrong answers that are true: crops and farm animals a state does grow — run log

**Task:** T-088 · **Branch:** `claude/epic-hopper-pav2ip` · **PR:** #109
**Started:** 2026-10-29 · **Outcome:** ready for merge — escalated by the reviewer (PR #109 marked ready, not to be merged without a decision)

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

## Round 3 — tester — 2026-10-29
`Next step` on entry: `tester` → on exit: `human`

**T-088 meets all 31 acceptance criteria, but the task now halts until a person approves 18 test changes.** These are older tests that pin main's bank or main's `engineering-decisions.md`, and this task changes both on purpose (16 in question-bank, 2 in backend). The status is `test changes requested`, Next step is `human`, and the push landed: `e9d666e` is on `origin/claude/epic-hopper-pav2ip`.

**Next:** a person starts an attended tester session for T-088 and approves or refuses each of the 18 rows. That tester applies the approved rows and re-runs every suite. I changed none of the 18 tests.

**Independence: orchestrated run.** `runs/T-088-agriculture-true-wrong-answers.md` exists, and `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJfrwMg1JqLUkLqFoYa`, the same id the expander and worker recorded. So the session-id check proves nothing. My only independence is being a freshly spawned agent with its own context. That is weaker than a separate session, because it rests on the orchestrator having spawned me correctly. The Verdict says this, and my Sessions row is added.

**What I checked**
- **The work is on the branch.** Every file the Handoff names is changed in `6587ed0`, on the branch the `Branch:` header names.
- **New tests, all passing:**
  - `/home/user/geo-discovery-zone/question-bank/src/agriculture-true-wrong-answers-verify.test.ts`: 42 tests. Tables A and B are copied from the brief, not imported from source. Main (`a42b71b`) is pinned as sha256 digests, because a test may not hand `git` a revision.
  - `/home/user/geo-discovery-zone/backend/tests/test_t088_tester_criteria.py`: 2 tests for criterion 19.
- **The two regeneration commands** (criteria 18 and 19) were re-run by hand, and `git diff` is empty after each.
- **Mutations: 13, every one went red, all reverted.** Removing either exclusion list, loosening the postal-code regex, emptying the added-animal pool, and nine edits to the committed question file or `content.json` each turned the matching criterion's test red.

**Suites** (all proxies pointed at `127.0.0.1:1`, so no network)

| Suite | Pass | Fail | Notes |
|---|---|---|---|
| question-bank | 2599 | 16 | All 16 are request rows 1–13 and 15–17. Typecheck, lint and format check are clean. |
| backend | 742 | 2 | Rows 14 and 18. 9 skipped. Lint and format check are clean. |
| frontend | 392 | 4 | The 4 are module-load errors: `bun install` got a proxy 403 on `d3-*` packages, so `react-simple-maps` is missing. No tracked frontend file changed (criterion 21 test). PR CI on `6a67051` shows the frontend job passing. |

**The 18 rows:**
- **Rows 1–3** let farm-animal wrong answers also be the five added animals (`goats`, `horses`, `ducks`, `rabbits`, `bison`), written into each test as literals.
- **Rows 4–17 and 18** re-pin their digests at `6587ed0` (the worker's commit), as E-30 requires. Each row keeps its old pin's scope: none narrows, none adds an exclusion.
- **Row 18 is one the worker's list missed:** `test_t089_tester_criteria.py::test_criterion_13_e1_to_e27_are_byte_identical`. It pins the part of `engineering-decisions.md` that contains E-25, which this task amends.
- **No count floor went red.**

**For the reviewer, not failures:**
- Iowa still offers `dairy cows` as a wrong answer, which Table A allows.
- The order in which the added animals are offered was the worker's choice, recorded in E-25.
- E-22's "six farm animals" line is stale and left alone, as Out of scope says.
- The check of Tables A and B against USDA NASS is still open.

The brief, `/home/user/geo-discovery-zone/tasks/T-088-agriculture-true-wrong-answers.md`, holds the full Verdict (criterion table, mutation table) and the Test change request.

## Halted — test change request — 2026-10-29
Raised by the tester in commit `e9d666e`. Header: `Test changes: requested`, `Status: test changes requested`, `Next step: human`.
The request's rows are not copied here; the orchestrator has not read them.

To resume: a person starts the `tester` step for T-088 in a session they are attending. It asks about each row, applies what is approved, and finishes verifying. The orchestrator cannot take the approval (D-15). Once that tester has finished, its header names the next role, and a new run starts from there.

## Round 4 — tester (attended, in the orchestrator's session) — 2026-10-29
`Next step` on entry: `human` → on exit: `reviewer`

The person in this session said "run the tester step for T-088". D-15 requires the approval to be given in the session that makes the edits, so this session acted as the attended tester rather than spawning a subagent. It was shown the 18 rows and answered, verbatim: **"approve"**. No name was given. All 18 rows were applied in `8aea8b5`, and the verdict was written in `62dbe6d`: `pass`. question-bank 2615/0 and backend 744 passed, 9 skipped; typecheck, lint and format are clean. The frontend was not run here (proxy 403 on `d3-timer`).

Caveat recorded in the Verdict addendum: this session had read the earlier roles' returned reports, so this step's independence is weaker than a cold tester's. It applied the approved rows and re-ran the suites. The criteria verdicts are the first tester's.

## Round 5 — reviewer — 2026-10-30
`Next step` on entry: `reviewer` → on exit: `human` (approved — escalated; brief swept in `9b61eeb`)

**T-088 is approved and escalated.** PR #109 is now ready for review, with a warning at the top of its body saying it must not be merged without a decision. The sweep is inside the PR. Next: Dkaattae decides whether to merge. I did not merge.

**Why it is escalated:**
- **Child-facing text.** 36 of the 74 agriculture questions changed their `choices`.
- **The NASS check has not been done.** `tasks.md` T-088 required Tables A and B to be checked against USDA NASS "before it ships", and nobody has.
- **No person read the criteria.** The brief's `Approved:` line is the orchestrator's stamp. Dkaattae approved only Tables A and B, on 2026-10-27.
- **The test change approver gave no name.** A person approved it, so the D-14/D-15 rule is met, but the record has no name. I copied all 18 rows into the PR body.

**What I checked:**
- **The PR has every role's work.** Commits are there from the expander (`7918629`, `545d646`), the worker (`6587ed0`) and the tester (`e9d666e`, `8aea8b5`, `62dbe6d`). The orchestrator's commits only touch `runs/`.
- **Each role stayed in its lane.**
  - The expander's commits touch only `tasks.md` and the brief.
  - The worker changed no existing test.
  - Existing tests changed only in the tester's `8aea8b5`. Those changes are exactly the 9 files named in test change request rows 1–18, and each matches its row. Nothing was deleted and no count floor was lowered.
- **Nothing landed outside the brief's Constraints.** There is no dependency, and `openapi.yaml`, `frontend/`, migrations and the plan are untouched.
- **The suites pass.**
  - At `5b93e41`: question-bank 2615 pass, 0 fail; typecheck, lint and format check are clean. Backend: 744 passed, 9 skipped. All six CI jobs on the PR are green, including frontend and e2e.
  - After the sweep commit, both local suites still pass. CI on that commit was still running when I finished.
- **I read all 24 farm-animal questions.** The table is in the PR body.

**Findings (none block the merge).** All three are queued as one new task, **T-096**:
1. In `question-bank/src/distractors.ts`, the doc comment for `poolFor` sits above `type Pick` instead.
2. `clickDistractorsFor` uses `p.entity?.geometry_id as string`. If a pool ever reached a `map_click` question it would silently emit `undefined`; it should throw instead.
3. E-22 and the `concept_load` comment in `seed-level.ts` still say "six farm animals". The brief left this out of scope.

**What I decided on the worker's and tester's flags:**
- **Added animals go last, in their listed order: confirmed.** That keeps the "rabbits is never right" giveaway as rare as possible: 8 of 24 questions.
- **Iowa still offers `dairy cows`.** This matches the approved table, which lists items where the state is roughly a top-10 producer. It is on the person's checklist.
- **The frontend could not run locally.** CI's frontend and e2e jobs pass, so that is covered.
- **Every role reports the same session id.** That is already tracked as P-14 in `process-tasks.md`.

**Sweep, pushed to `claude/epic-hopper-pav2ip`:**
- `85b05a9` added the `## Review` section to the brief, set Status to `approved — escalated` and Next step to `human`, and added my Sessions row.
- `9b61eeb`:
  - Deleted the brief.
  - Removed T-088 from `tasks.md` and added T-096.
  - Noted in T-095 that T-088 re-pinned the bank guards at `6587ed0` and added two new pinning test files.
  - Added the sweep line to `tasks.md`.
  - In `PROGRESS.md`: logged T-088 under Completed tasks, rewrote its known-gap line to say the lists are not yet checked against NASS, and removed it from Next.
- The push landed: `origin/claude/epic-hopper-pav2ip` is at `9b61eeb`.

**What the person merging needs to do** (the checklist is in the PR body):
- Check Tables A and B against USDA NASS.
- Confirm or overturn Iowa and dairy cows.
- Read the 24 farm-animal questions and a sample of crop questions.
- Accept, or not, that the five added animals are never a correct answer.

`gh pr edit` was refused by the permission classifier. I made the PR update with `mcp__github__update_pull_request` instead, which is the route the reviewer role names.

Files:
- /home/user/geo-discovery-zone/tasks.md
- /home/user/geo-discovery-zone/PROGRESS.md
- /home/user/geo-discovery-zone/question-bank/src/distractors.ts
- /home/user/geo-discovery-zone/tasks/T-088-agriculture-true-wrong-answers.md (deleted; its last version is at `85b05a9`)
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/109

## Ended — 2026-10-30
The reviewer approved, escalated and marked PR #109 ready. The run ends here; merging is Dkaattae's (D-4).
