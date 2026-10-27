# T-092 — Stop generating candidates for `map_click`

**Status:** `expanding`
**Next step:** `task-expander` — Q1 answered (A); finalise criteria 10–12
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-092
**Branch:** `claude/funny-mendel-s8b39y`
**PR:** #98, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:** the queue entry's Done-when ("`content.json` is unchanged") and its
motivation ("E-21's distractor code still picks them") cannot both hold, because
every served `map_click` `level` is computed from those candidates; which one
gives way is a person's call (Q1).

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-27 | cse_011oDiJcJZcMhYd4hriwRBRy (relayed by the orchestrator; shared session id) |

## Q1 — blocking: what happens to a `map_click` question's `level`?

**TL;DR:** removing the candidates also removes the input that sets the level of
all 50 served `map_click` questions. Either keep the levels exactly as they are
(and keep a hidden "would-be distractor" calculation), or let them change. The
expander cannot pick: it changes what difficulty a child is served.

**The finding.** `seedLevels` (`question-bank/src/seed-level.ts`, `levelFor`)
adds `near_distractor_weight` (0.5) × the number of the question's distractors
that are near its entity (0–3). On a `map_click` question, `entitiesForChoice`
reads those distractors from `choiceGeometryIds`. E-22 says "the map templates
nearly always get 3 near distractors", so that term is +1.5 on nearly every
`map_click` level. Example: `gen:tpl-click-the-map:us-state-ak` has choices
Washington, Oregon, Montana and `level: 7`
(`question-bank/data/questions/us-states.json:2166-2186`). `content_build.py`
serves `level` on `map_click` (`MAP_CLICK_FIELDS`), and the server picks questions
by level. So:

- If the candidates go and nothing replaces them, near-distractor count becomes 0
  and nearly every `map_click` level drops by 1.5. **`content.json` changes**,
  which breaks the queue's Done-when.
- If `content.json` must stay byte-identical, the level stage still has to work
  out the three candidates the old picker would have chosen. **The picker still
  runs for `map_click`**, only now its result is not written down. That is the
  thing the queue entry calls dead logic.

**Options:**

- **(A) Levels unchanged.** No candidate field in the question file, and
  `content.json` byte-identical. The level stage still counts the three
  nearest-first `neighbours_first` picks it would have made, but never writes
  them. Smallest change for a child (nothing they see changes). Cost: the
  candidate-picking rule lives on, hidden inside the level calculation. E-21, E-22
  and E-29 get amended to say so.
- **(B) Drop the term for `map_click`.** No candidates, no near-distractor term.
  Nearly all 50 `map_click` levels fall by 1.5 (clamped at the level floor), so
  `content.json` changes and map clicks are served earlier. E-22 records the new
  levels. Cost: an unchecked difficulty shift. Expect test change requests on the
  level guards (`hand-check-levels-verify`, `seed-level-verify`,
  `seed-level-loose-ends-verify` criterion 10 pins the 150 original levels).
- **(C) A candidate-free input in its place**, e.g. "how many states border this
  one, capped at 3", × 0.5. This is a new level input, the same kind of choice as
  T-085's "a fact field per input". Levels change wherever the border count
  differs from today's near count. E-22 records it. Same test cost as (B).
- **(D) Do not do T-092.** Keep the candidates in the file, and record in E-29
  that they are kept because the level reads them. Delete T-092 from the queue.

**The expander's read, not a decision:** (A) is the only option that meets the
queue entry's Done-when as written. (C) is the only one that leaves no rule about
candidates that do not exist. (B) changes difficulty with nothing behind it.

**To unblock:** write the chosen letter (and, for C, the exact input) into this
section or on PR #98. Then start `task-expander` again. It turns the
option-dependent criteria below into final ones and sets
`Status: awaiting approval`.

**Answer (Dkaattae, 2026-10-27, in the orchestrator session):** **(A) — levels unchanged.**
Their words, after seeing the current `map_click` levels per state: *"I kind of agree with
the current level. just keep as is"*. Recorded by the orchestrator; criterion 8 is read as
"keep the current `no_centroid` behaviour", which is what "keep as is" asks for.

## Goal

A `map_click` question offers no candidates (E-29), yet the committed question
file still gives all 50 `tpl-click-the-map` questions four of them. Stop
generating them, so no later reader takes the dead data for a live feature and
wires it back in.

## Acceptance criteria

**Draft. Not approved.** Criteria 1–9 hold under every option except (D).
Criteria 10–12 depend on Q1. Under (A) they read as written. Under (B) or (C)
they are replaced as noted.

**The question file**

1. In `question-bank/data/questions/us-states.json`, none of the 50 questions with
   `"format": "map_click"` has a `choices`, `correctIndex` or `choiceGeometryIds`
   key. "Has" means the key is present at all, even with a value of `null` or `[]`.
2. Every `map_click` question in that file keeps `id`, `entityId`, `templateId`,
   `format`, `prompt`, `answer`, `answerGeometryId`, `level`, `scope`,
   `entityType`, `topic`, `region` and `ageBand`, each with the value it has on
   the default branch at `5d72ca5` (`level` subject to criterion 10).
3. The file still holds exactly 50 `map_click` questions, one per state, the same
   ids as at `5d72ca5`, in the same positions in the `questions` array. Its
   `count` equals the array length.
4. Every question whose format is not `map_click` is byte-identical, as a JSON
   value, to the same id at `5d72ca5`. The number of such questions is unchanged.
5. The committed file is what `renderQuestionFile` returns for the committed
   entities. The existing drift test stays green, unmodified.

**The pipeline, offline**

6. `buildChoices` returns no `choices`, `correctIndex` or `choiceGeometryIds` key
   on a `map_click` question, whatever the input entities. Checked with a small
   in-test entity set, including one where the state has 0 same-type neighbours
   with a `geometry_id`.
7. A `map_click` draft is never in `shortPools` with reason `too_few_candidates`.
   That holds when the input has exactly one state (no possible candidates), and
   when it has two or three. Non-`map_click` drafts with fewer than three possible
   distractors still are.
8. A `map_click` draft whose own entity has no usable `centroid`: **for a person
   to confirm with Q1.** Today it is reported as `no_centroid`. The draft keeps
   that behaviour, so the question set does not change. Under (C) the state with
   no centroid could become a question. That stays out of scope here.
9. `buildChoices`'s output for every non-`map_click` draft is unchanged
   (`choices`, `correctIndex`, order), checked over the committed entities against
   the questions in the committed file at `5d72ca5`.

**Levels and the served bank (depend on Q1)**

10. **(A)** Every `map_click` question's `level` equals its value at `5d72ca5`, for
    all 50. **(B)** replaced by: every `map_click` level equals
    `base_difficulty + entity_obscurity + concept_load − familiarity_bonus`,
    clamped, with no near-distractor term. **(C)** replaced by: the chosen input,
    stated in E-22, gives each level. A test with a state bordering 0, 3 and 4
    same-type states pins the cap at 3.
11. **(A)** The level stage still treats a `map_click` question's near count as
    dependent on its entity's neighbours. In a two-state input where the states
    border each other, the click question's level is exactly 0.5 higher than in
    the same input with `borders` emptied and `region` differing. **(B)**
    replaced by: the same two inputs give equal levels. **(C)** per the chosen
    input.
12. **(A)** `backend/app/data/content.json` is byte-identical to `5d72ca5`, and
    `make -C backend content` rewrites it to the same bytes. **(B)/(C)**
    replaced by: `content.json` differs from `5d72ca5` only in the `level` values of
    `map_click` questions, and `make -C backend content` reproduces it.

**Records**

13. `engineering-decisions.md` E-29's bullet "E-21's `choiceGeometryIds` is still
    generated into the question file … is a follow-up, not this task" no longer
    says they are generated. E-29 (or a new `E-n`, taking the next unused number)
    says they no longer are, and what `level` reads for a `map_click` question
    now. E-21's "plus `choiceGeometryIds` on `map_click`" sentence carries a
    dated note that T-092 removed it.
14. The comments that describe candidates on `map_click` no longer say they exist:
    `distractors.ts`'s header bullet and the `choiceGeometryIds` doc comment,
    `question-file.ts`'s header ("`choiceGeometryIds` too"), and
    `content_build.py`'s `MAP_CLICK_FIELDS` comment ("The question file still
    holds four candidates").

**What must not happen**

15. No new dependency, and no change to any `package.json`, lockfile or
    `pyproject.toml`.
16. No change to `openapi.yaml`, `backend/app/models.py`, `backend/app/grading.py`
    or anything under `frontend/`. The served `map_click` shape is already
    candidate-free (E-29).
17. No test reaches the network.
18. The whole suite passes: `cd question-bank && bun test`, `cd frontend && bun
    test`, `make -C backend test`. Any existing test made stale goes through a
    Test change request first (D-14).

## Out of scope

- **Removing `choiceGeometryIds` from the `GeneratedQuestion` type** if a
  different format still needs it. Only `map_click` uses it today. Removing it is
  allowed but not required.
- **Re-tuning any level weight** other than the one Q1 decides (T-085 owns the
  rest).
- **Which states a `map_click` question exists for**, including one with no
  centroid (criterion 8).
- **T-070's digest guards** in general. Only the rows this change makes red go
  through a Test change request.
- **T-053** (the served entity's `geometryId` reveals the answer) and **T-093**.
- **`measure_selection.py`** and E-26's tables. Re-measuring under (B) or (C) is a
  follow-up, not this task.

## Constraints

- **Files expected to change:** `question-bank/src/distractors.ts`,
  `question-bank/src/seed-level.ts` (A, C), `question-bank/src/question-file.ts`
  (comment), `question-bank/data/questions/us-states.json`,
  `backend/app/content_build.py` (comment only, no logic),
  `engineering-decisions.md`. Under (B)/(C) also `backend/app/data/content.json`.
- **Regenerate with the existing commands:** `cd question-bank && bun run
  ./src/write-questions.ts`, then `make -C backend content`.
- **Existing tests read the candidate fields:** among them
  `distractors.test.ts`, `distractors-verify.test.ts`, `seed-level-verify.test.ts`,
  `t026-templates.test.ts`, `climate-far-phrases-verify.test.ts`,
  `backend/tests/test_t051_tester_criteria.py`, `test_t051_map_click.py`,
  `test_t040_tester_criteria.py`. The worker lists any made stale under **Tests
  made stale**; it does not edit them. **Plan to attend the tester step.**
- **Content rule:** no text a child reads changes. Prompts and answers are fixed
  by criterion 2.
- **Dependencies:** none (`CLAUDE.md`, "Packages").

## Context

- **Queue entry:** `tasks.md` T-092.
- **Decisions:** `engineering-decisions.md` E-21 (`choiceGeometryIds`, tiers),
  E-22 (`level` formula, `near_distractor_weight`, "the map templates nearly always
  get 3 near distractors"), E-24 (the question file and the served allowlist),
  E-29 (no candidates served; its "Revisit when" names this task).
- **Source:** `question-bank/src/distractors.ts` (`nearestDistractors`,
  `questionFor`: the `isClick` branches), `question-bank/src/seed-level.ts`
  (`entitiesForChoice`, `nearDistractorCount`, `levelFor`),
  `question-bank/src/templates.ts` (`tpl-click-the-map`, `neighbours_first`),
  `question-bank/src/question-file.ts`, `backend/app/content_build.py`
  (`MAP_CLICK_FIELDS`, `_served_map_click`).
- **Plan:** `geoquizdataplan.md` §1.2 (templates × entities, distractors), §1.4
  (difficulty).
- **Contract:** `openapi.yaml` is not touched (criterion 16).

## Handoff

## Verdict

## Notes

- **Already true:** the served bank carries no `map_click` candidates
  (`content_build.py` `MAP_CLICK_FIELDS`, E-29). This task is about the question
  file and the generator only.
- The sweep was already done: `tasks/` held no brief, and T-051's reviewer had
  trimmed the queue and logged PR #96 in `PROGRESS.md`.
- Picked by queue order: T-070, T-084, T-085, T-088, T-091 and T-056 are each
  waiting on a person. T-092 is the first entry with `Depends on: —`.
