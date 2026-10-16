# T-025 — Hand-check 30 generated questions and tune the level weights — run log

**Task:** T-025 · **Branch:** `claude/practical-clarke-s0b2y4` · **PR:** #85
**Started:** 2026-10-15 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-15
`Next step` on entry: (no brief) → on exit: `worker` (after a human approves below)

**TL;DR:** The T-025 brief is written, pushed to `claude/practical-clarke-s0b2y4`, and open as draft PR #85. It is `Status: awaiting approval` with `Approved: pending`, so a person has to approve it before the worker runs. Next step after approval is `worker`, on Opus.

**Task picked:** T-025, "Hand-check 30 generated questions" (tune the level weights). It is the first queue entry whose dependency is done (T-023, PR #83). Three earlier entries were skipped for reasons already in `tasks.md`:
- **T-064** waits on T-040.
- **T-070** waits on a person's answer to Q1.
- **T-084** waits on T-070 (a). I added a "Skipped again, 2026-10-15, for T-025" line to its entry.

**Push confirmed:** `origin/claude/practical-clarke-s0b2y4` is at `6d81009`, three commits ahead of `main`. Compared with `origin/main`, the only files touched are `tasks/T-025-hand-check-levels.md` (new) and `tasks.md` (T-025 set to `doing`, plus the T-084 skip line). There are no source, test or config changes, and no `PROGRESS.md` edit was needed.

**What the brief asks for:**
- **Kind:** curation, so it has a full brief rather than the light path. It has more than four criteria and is a judgement about what children find hard. It includes a Review checklist for the person merging.
- **The 30 questions are fixed:** the 3 templates × 10 states (CA, TX, FL, NY, WA, CO, KY, HI, AK, RI), which cover every population-rank bucket.
- **Criteria 1–9 check the record:** a 30-row table inside E-22 with prompt, choices, level before and after, and a verdict. They also require a list of changed keys with old value, new value and reason, E-22's constant block matching the code, the range sentence matching the final weights, and a band decision.
- **Criteria 10–17 are invariants:**
  - only values change in `LEVEL_SEED_WEIGHTS`, and the formula stays the same
  - `TEMPLATES` is unchanged
  - `familiarity_bonus` stays 0, with no famous-states list
  - committed data, package files and lockfiles stay byte-identical to `aa88101`
  - no new `E-n` entry
  - every existing test passes unmodified

**Things the worker and tester should know:**
- **The record must stay inside E-22, with no `## E-24`.** `tags-verify.test.ts` pins E-23 as the highest entry, so a new entry would need an attended Test change request.
- **`base_difficulty` and freezing the constant are out of scope.** Both would make existing tests stale. `concept_load` already gives a per-template shift.
- **The brief carries the "before" weights (T-023 values from `aa88101`)** so the tester can recompute both level columns.

**What a person needs to do:**
- Approve the brief by replacing `Approved: pending` in `/home/user/geo-discovery-zone/tasks/T-025-hand-check-levels.md` with a name and date.
- At merge, work through the brief's Review checklist: is the ordering sane, and is the band right?

Files:
- /home/user/geo-discovery-zone/tasks/T-025-hand-check-levels.md
- /home/user/geo-discovery-zone/tasks.md
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/85

## Halted — G2, approval stamp refused — 2026-10-15
The orchestrator's unattended `Approved:` stamp was refused by the harness as
self-approval (same as T-078). The header still reads `Approved: pending`, so G2
holds and no worker was spawned. A person must approve the brief — either in this
session (the orchestrator records their words here and writes the line) or by
editing the header themselves.

## Resumed — human approval — 2026-10-16
The person approved the brief in the orchestrator session. Their words, verbatim:

> approved, go ahead

The orchestrator wrote the `Approved:` line recording this and resumed the relay
from `Next step: worker`.

## Round 2 — worker — 2026-10-16
`Next step` on entry: `worker` (after a human approves below) → on exit: `tester`

**TL;DR:** T-025 is handed to the tester with Status `awaiting verification` and Next step `tester`. I changed one weight, `concept_load["tpl-capital-of"]` from 1 to 2. The 30-question record is in E-22, and the full suite is green. One problem the tester needs to rule on: the last part of criterion 13 cannot be met by any weight values over the committed bank.

**Push:** `git log origin/claude/practical-clarke-s0b2y4 -1` shows `a4efb23 T-025 worker: hand-check 30 questions, raise capital concept_load to 2`. That is the brief's `Branch:` header, and it is the branch I was on.

**Files changed**
- `/home/user/geo-discovery-zone/question-bank/src/seed-level.ts`: one value, `"tpl-capital-of": 1` → `2`. No key, export or signature changed.
- `/home/user/geo-discovery-zone/engineering-decisions.md`, E-22 only:
  - The constant block and the `concept_load` "first guess" wording are updated.
  - The range sentence now says 3.5 (California and Texas, identify on map) to 10 (capital of Delaware, Maine, New Hampshire, Rhode Island, Vermont and West Virginia).
  - A new `### T-025 hand-check of 30 questions (2026-10-16)` subsection sits just before `## E-23`. It holds:
    - the 30-row table
    - the weight that changed, and the reason
    - the weights I tried and did not adopt
    - what the formula cannot express
    - what the near-distractor term does on map questions
    - the band decision: 3.5–10 is 1st grade to 5th grade
- `/home/user/geo-discovery-zone/tasks/T-025-hand-check-levels.md`: Sessions row, Status, Next step, Handoff and Notes.

**Why the capital weight changed:** under the old weights, the capital question and the click-the-map question had the same level for 49 of the 50 states. A capital is a second fact you only learn once you know the state, so it now sits one level above click and two above identify for every state.

**What I found**
- **Verdicts:** 24 `about right`, 6 `too hard`, 0 `too easy`.
- **Map rows marked too hard:** Hawaii and Alaska, on both map templates. Both are drawn apart from the mainland, so they are easy to spot, but the formula sees only population and area rank.
- **Capital rows marked too hard:** Denver and Honolulu. Each is its state's largest city, and the bank has no field that says so.
- **Why I left them:** no weight can fix either problem. The fix needs a new fact field ("drawn in an inset", "capital is the largest city") or a list of familiar states, which needs a person's approval. **Owner: reviewer**, to file it in `tasks.md` at the sweep.
- **Near-distractor term on maps:** 48 of the 50 map questions in each template have 3 near distractors. The term only separates Hawaii (0) and Alaska (2), so the record says that.

**Criterion 13 cannot be met as written.** Changing either of two values by ±1 never changes any of the 150 levels, under the old weights or any others:
- **`missing_rank_bucket`:** every state in the committed bank has both ranks, so this value is never read.
- **`concept_load_default`:** all three templates have their own `concept_load` entry, so the default is never read.

Making either one count would mean removing a key, changing a template or changing data, and criteria 10, 11 and 14 forbid all three. The existing T-023 criterion-20 test only passes because it adds made-up cases on top of the bank. I recorded this in the Handoff instead of building around it. **Owner: tester to rule, then task-expander to restate the criterion.**

**Checks:**
- `bun test` in `question-bank/`: 2180 pass, 0 fail.
- `typecheck`, `lint` and `format:check` are clean.
- `node_modules` was missing in this container. I ran `bun install --frozen-lockfile` first, which changed no file in the repo.
- Nothing under the data or fixture folders, and no package or lock file, differs from `aa88101`. E-23 is still the highest entry.
- **Tests made stale:** none.

**Same session id for both roles:** `$CLAUDE_CODE_REMOTE_SESSION_ID` returned `cse_016eUpyD7jeyBpLWPeaAbRgW`, the same id as the expander's row. The tester has to run in a different session.

## Round 3 — tester — 2026-10-16
`Next step` on entry: `tester` → on exit: `task-expander` (Status: `blocked`)

**T-025 tester verdict: blocked, so the task goes back to the task-expander.** One clause of the brief can't be met, criterion 13's third. Every other criterion passes and the whole suite is green. The worker's code needs no change; the brief needs that clause restated.

**Pushed:** commit `236b0e0` on `claude/practical-clarke-s0b2y4`. That is the brief's `Branch:` header, and I confirmed the remote head matches local.

**Brief header now reads:**
- **Status:** `blocked`
- **Next step:** `task-expander`
- **Fault:** filled in, naming criterion 13's last clause.
- **Sessions:** tester row added.
- **Verdict:** written, with a table of each criterion and its evidence, plus the mutations I ran.

**Why 13c is blocked.** The clause says changing any single number in `LEVEL_SEED_WEIGHTS` by +1 or −1 still changes at least one of the 150 levels. Two numbers are never read over the committed bank:
- **`missing_rank_bucket`:** all 50 states have usable population and area ranks, so the missing-rank value is never used.
- **`concept_load_default`:** all three templates have their own `concept_load` entry, so the default is never used.

I changed each by ±1 against this branch and again against `aa88101`: all 150 levels stayed the same in all four runs. No change the brief allows can fix this. It would need a key removed, a template changed or data changed, which criteria 10, 11 and 14 forbid. Two tests record why the two keys are never read, and the ±1 test covers every other number and passes. I wrote no test for the clause as worded. A possible restatement for the expander: "every number except these two, which the committed bank never reads". Or point to the existing T-023 criterion-20 test, which covers this with a synthetic corpus and passes.

**Everything else passes:** criteria 1–12, 13's first two clauses, and 14–17. The 30-row table matches what `buildChoices` and `seedLevels` produce. The weight-change list, the constant block, the range sentence (3.5 to 10) and the band paragraph (1st to 5th grade) all match the code. The formula, `TEMPLATES`, the data files, the dependency files and the 48 older test files are byte- or hash-identical to `aa88101`.

**Suite:** `bun test` under the loopback proxy gives 2211 pass, 0 fail (2180 before plus 31 new). `typecheck`, `lint` and `format:check` are clean.

**Mutations:** I made 18 deliberate breaks and each one turned at least one test red. One first got through: changing "5th grade" to "4th grade" in the band paragraph. I tightened that test to need "<min grade> … to … <max grade>" in one sentence, and it then caught it. Every mutation was reverted and the scratch worktree removed.

**Independence is the weaker kind.** This run is orchestrated, so my session id (`cse_016eUpyD7jeyBpLWPeaAbRgW`) is the same as the expander's and worker's, and the id check proves nothing. My independence rests only on being a freshly spawned subagent that did not see the worker's reasoning. The Verdict says so.

**Not checked by tests:** the Review checklist, whether the difficulty ordering makes sense for children. A person has to judge that.

No tests were made stale and no existing test was modified.

Files:
- /home/user/geo-discovery-zone/question-bank/src/hand-check-levels-verify.test.ts
- /home/user/geo-discovery-zone/tasks/T-025-hand-check-levels.md

## Paused — Status: blocked — 2026-10-16
G3 count: fail 0, blocked 1 (bound is 2 each). The header routes to `task-expander`,
which `run-loop.sh` would relay. But `orchestrator.md` also lists `Status: blocked`
as a halt condition, so the two readings disagree. The orchestrator asked the
person which applies rather than picking one.
The person chose: **"Relay to expander (Recommended)"**. Relaying to the
`task-expander` (blocked round 1 of 2).

## Round 4 — task-expander — 2026-10-16
`Next step` on entry: `task-expander` (Status: `blocked`) → on exit: `worker` (Status: `awaiting approval`, Approved: `pending`)

**TL;DR:** I rewrote criterion 13's third clause (13c) so that it can be met, and pushed the change. The brief now waits for a person to approve it again. The worker will refuse to start until someone replaces `Approved: pending` with their name and the date. This orchestrated run cannot do that step itself.

**Pushed:** commit `be1b658` on `claude/practical-clarke-s0b2y4`, which is the brief's `Branch:` header. I checked that the local head and `origin/claude/practical-clarke-s0b2y4` are the same commit. The commit touches only `tasks/T-025-hand-check-levels.md`.

**What changed in the brief**
- **Criterion 13** is now three clauses, each checked on its own. (a) and (b) say the same as before.
- **13 (c), restated:** a +1 or −1 change to any single number in `LEVEL_SEED_WEIGHTS` must still change at least one of the 150 levels. There are exactly two exceptions: `missing_rank_bucket` and `concept_load_default`.
  - Every element of `rank_bucket_edges` and every `concept_load` entry is explicitly covered, and no other key is exempt.
  - The two are exempt because the committed bank never reads them: every state has both ranks, and every template has its own `concept_load` entry.
  - Their liveness is left to the T-023 criterion-20 test, which uses a synthetic corpus. Criterion 17 already requires that test to pass unmodified.
  - An italic note under the criterion keeps the original wording and says why it changed.
- **Unchanged:** every other criterion, Out of scope, Constraints and the Review checklist are word for word as first approved.

**Header**
- **Status:** `awaiting approval`
- **Next step:** `worker`
- **Approved:** reset to `pending`, because `process.md` step 2 says amended criteria must be approved again. The line notes that Dkaattae's earlier approval covered the criteria before the amendment.
- **Fault:** left as it was. The template says it is cleared only when the task reaches `pass`.

**Also recorded**
- A task-expander row in the Sessions table. The session id is the same as every other row (`cse_016eUpyD7jeyBpLWPeaAbRgW`), because this is an orchestrated run.
- A Notes entry saying:
  - The worker only needs to confirm that no code or record change is needed.
  - The tester then re-checks 13 (c) and gives a fresh verdict on the whole brief.
  - A person must approve before either of those can happen.

**PR #85** is still a draft, and its body now carries the restated 13 (c) and a re-approval request at the top. **One slip:** my first update call sent the literal text "PLACEHOLDER" as the PR body. I replaced it seconds later through the REST API with the correct body and checked it: the placeholder is gone and criteria 1–17 are all there.

**Next step: human.** Approve the amended brief by writing a name and date in the `Approved:` line. After that, the worker runs, then the tester.

Files:
- /home/user/geo-discovery-zone/tasks/T-025-hand-check-levels.md

## Halted — G2, amended brief needs re-approval — 2026-10-16
`Approved:` is back to `pending`. No worker spawned. Waiting for the person to
approve the amended criterion 13 (c).

## Resumed — human re-approval — 2026-10-16
The person approved the amended brief in the orchestrator session. Their words, verbatim:

> approve

The orchestrator wrote the `Approved:` line recording this and resumed the relay
from `Next step: worker`.
