# T-092 — Stop generating candidates for `map_click`

**Status:** `Q1 answered`
**Next step:** `task-expander` — freeze the criteria for the Q1 answer and set `awaiting approval`
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-092
**Branch:** `claude/tender-feynman-fv9k0l`
**PR:** #100, opened draft at expand time against the branch above
**Fault:** the queue entry's Done-when ("`content.json` is unchanged") contradicts
its own fix: 49 of the 50 served `map_click` levels are computed from the very
candidates the task removes, so which one gives way is a design call the
expander may not make.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-27 | cse_011oDiJe6KxQ3qitLn4NjWjF (spawned by the orchestrator; shared session id) |

## Q1 — for a human: what seeds a `map_click` level once it has no candidates?

**Answer — the person, 2026-10-27, in the orchestrator's session, verbatim: "a".** Option (a).

**The conflict.** The queue entry asks for two things: no `map_click` question in
`question-bank/data/questions/us-states.json` carries `choices`, `correctIndex`
or `choiceGeometryIds`, **and** `backend/app/data/content.json` is unchanged.
Both cannot hold as the code stands:

- `seedLevels` (`question-bank/src/seed-level.ts:170-200`) adds
  `near_distractor_weight` (0.5) × the number of distractors that border the
  state or share its region. For `map_click` it finds those distractors through
  `choiceGeometryIds` (`seed-level.ts:144`).
- `level` is served on `map_click` (`content_build.py` `MAP_CLICK_FIELDS`).
- In the committed file, **48 of the 50** `map_click` questions have 3 near
  distractors (+1.5), 1 has 2 (+1.0), and 1 has 0. The child is never shown any
  of them (E-29). So today 49 served tap-question levels include a "distractors
  are tight" term for distractors that do not exist.

**Options:**

- **(a) Keep every level as it is.** The level stage still works out, internally,
  the three nearest candidates a `map_click` question *would* have had, and
  counts the near ones; it just stops writing them. `content.json` stays
  byte-identical, as the queue entry asks. Cost: the candidate-picking code still
  runs for `map_click`, which is the dead logic the entry wanted gone, and the
  level keeps measuring something the child never sees. It also keeps today's
  behaviour that a `map_click` draft is dropped (`shortPools`) when fewer than
  three peer states with a centroid and a `geometry_id` exist.
- **(b) Drop the distractor term for `map_click`.** A question with no
  distractors has a near-distractor count of 0. 49 served levels fall (48 by
  1.5, 1 by 1.0); `content.json` changes in those `level` values only. The
  queue's Done-when is amended accordingly. A `map_click` question no longer
  needs peers or a centroid to exist. Cost: tap questions get easier relative to
  everything else, and E-26's measurement (taken at the old levels) no longer
  describes them exactly.
- **(c) Drop the term but move the weight into the template.** As (b), and
  `concept_load["tpl-click-the-map"]` goes from 0 to 1.5, so the 48 questions
  with three near distractors keep their level exactly. Only 2 served levels
  change (the 2-near one by +0.5, the 0-near one by +1.5). Cost: a tuned-by-eye
  number standing in for a measured one, and `content.json` still changes.

The criteria below are written so that only those marked **(Q1)** depend on the
answer. Once a person picks, the expander deletes the other options' variants
and the brief goes to `awaiting approval`.

## Goal

A `map_click` question offers no candidates (E-29), but the generator still
writes four of them into the question file. Dead data invites a later reader to
wire it back into the app; the question file should say what is served.

## Acceptance criteria

Already true and not to be rebuilt: `content_build.py` never serves `choices`,
`correctIndex` or `choiceGeometryIds` on a `map_click` question
(`_served_map_click`, `MAP_CLICK_FIELDS`); grading is by `answerGeometryId`
(`grading.py`, E-29).

**The question file**

1. No question in `question-bank/data/questions/us-states.json` with
   `format: "map_click"` has a `choices`, a `correctIndex` or a
   `choiceGeometryIds` key — not as `null`, not as `[]`, absent.
2. The file still holds exactly 50 `map_click` questions, one per state, with the
   same ids, in the same positions, as the default branch's file.
3. Each `map_click` question's keys other than the three in criterion 1 and
   `level` — `id`, `entityId`, `templateId`, `format`, `prompt`, `answer`,
   `answerGeometryId`, `scope`, `entityType`, `topic`, `region`, `ageBand` —
   have the same values as on the default branch, and the question has no key
   the default branch's question lacked.
4. Every question whose `format` is not `map_click` (365 of them) deep-equals
   the default branch's question with the same id, `level` included, and the
   file's `count` and total question count are 415, as on the default branch.
5. The committed question file is byte-identical to what
   `cd question-bank && bun run ./src/write-questions.ts` writes from the
   committed entity bank.

**The stages, beyond the committed data**

6. Run over any entity bank — including a synthetic one a test builds, not only
   the committed 50 — the questions the pipeline produces for a `map_click`
   draft carry none of `choices`, `correctIndex`, `choiceGeometryIds`. (Today
   `buildChoices` in `distractors.ts`, then `seedLevels`, produce them; the
   worker may move this, and the criterion follows the output, not the
   function.)
7. Over the same synthetic bank, a `multiple_choice` or `map_identify` question
   still carries `choices` (length 4) and a `correctIndex` with
   `choices[correctIndex] === answer`, and carries no `choiceGeometryIds`.
8. **(Q1)** — one of:
   - *(a)* every `map_click` question's `level` equals the default branch's for
     the committed bank, and for a synthetic bank the level is the one the
     default branch's stages compute for the same input;
   - *(b)* a `map_click` question's `level` contains no distractor term: it
     equals `base_difficulty` + `entity_obscurity` + `concept_load` −
     `familiarity_bonus`, clamped to 0–18, with the weights in
     `LEVEL_SEED_WEIGHTS`;
   - *(c)* as (b), and `LEVEL_SEED_WEIGHTS.concept_load["tpl-click-the-map"]`
     is 1.5.
9. **(Q1, (b) and (c) only)** a `map_click` draft becomes a question, not a
   `shortPools` entry, when its state is the only entity of its type and scope
   in the bank, and when its state has no usable `centroid`. A choice-format
   draft in either situation is still reported in `shortPools` as today.

**The served bank**

10. `make -C backend content` writes bytes identical to the committed
    `backend/app/data/content.json` (the existing drift guard holds).
11. **(Q1)** — one of:
    - *(a)* the committed `content.json` is byte-identical to the default
      branch's;
    - *(b)/(c)* the committed `content.json` differs from the default branch's
      only in the `level` value of `map_click` questions, and each such value
      equals the level criterion 8 gives.

**Words**

12. `engineering-decisions.md` E-29 gains a dated paragraph naming T-092 that
    says the generator no longer writes candidates for `map_click`, and how a
    `map_click` level is now seeded (the Q1 answer and why). E-1 to E-28 are
    byte-identical to the default branch, and there is no new `## E-n` heading.
13. No comment or docstring in `question-bank/src/` (non-test files) or in
    `backend/app/content_build.py` still says the question file holds candidates,
    `choices`, `correctIndex` or `choiceGeometryIds` for `map_click` questions
    (today: `content_build.py`'s comment above `MAP_CLICK_FIELDS`,
    `distractors.ts`'s header and the `choiceGeometryIds` field doc,
    `question-file.ts`'s header).

**What must not happen**

14. No new dependency, and no change to any `package.json`, `bun.lock`,
    `pyproject.toml` or `uv.lock`.
15. Nothing under `frontend/`, `e2e/`, `backend/migrations/`, and no change to
    `openapi.yaml`, `backend/app/grading.py` or any `backend/app/` file other than
    `content_build.py` (comments only) and `data/content.json` (only as criterion
    11 allows).
16. No test reaches the network, and no child-facing text changes: every
    `prompt`, `choices` entry and `funFact` served in `content.json` is identical
    to the default branch's.
17. The full suites pass: `cd question-bank && bun test`, `cd frontend && bun
    test`, `make -C backend test`.

## Out of scope

- Any other format's distractors, ordering or caps (T-088, T-091).
- What the server sends alongside a `map_click` question (T-053), and the
  answer key on other formats (T-045).
- Re-tuning any level weight other than the one Q1 (c) names; re-running E-26's
  measurement.
- The digest-guard policy (T-070). Guards this change turns red go through a
  Test change request, not a re-pin policy.
- Dropping `answer` from `map_click` questions: it is the state's name, E-20's
  label beside the code, and stays.

## Constraints

- Files expected to change: `question-bank/src/distractors.ts` and/or
  `question-bank/src/seed-level.ts` (whichever stage the worker chooses),
  `question-bank/data/questions/us-states.json` (regenerated, never hand-edited),
  comments in `question-file.ts` and `backend/app/content_build.py`,
  `engineering-decisions.md` (E-29 only); `backend/app/data/content.json` only
  under Q1 (b)/(c), regenerated with `make -C backend content`.
- Expect stale tests. Known candidates, for the worker's **Tests made stale**
  list (the worker never edits them): `distractors.test.ts` and
  `distractors-verify.test.ts` (`choiceGeometryIds` on `map_click`),
  `seed-level-verify.test.ts`, `tags-verify.test.ts`,
  `backend/tests/test_t051_tester_criteria.py:570` (asserts four
  `choiceGeometryIds` on a question-file `map_click` question), and any
  pinned level on `tpl-click-the-map`. Under (b)/(c), also any test pinning
  `content.json` bytes or `map_click` levels. **Plan to attend the tester step.**
- `seed-level-loose-ends-verify.test.ts` criterion 12 pins E-1..E-23 and
  `test_t089_tester_criteria.py` criterion 13 pins E-1..E-27 bytes and exactly 29
  headings — criterion 12 above is written to stay inside both.
- Content rules (`CLAUDE.md`): no prompt or choice text changes.

## Context

- `engineering-decisions.md` **E-29** (no candidates; its "Revisit when the
  generator stops writing candidates"), **E-21** (distractors, `choiceGeometryIds`),
  **E-22** (level seeding, `LEVEL_SEED_WEIGHTS`), **E-20** (`map_click` draft
  shape), **E-24** (served allowlist), **E-26** (levels measured at 365 served).
- `geoquizdataplan.md` §1.2 (generation, distractors) and §1.4 (the level
  formula, `distractor_tightness`).
- `question-bank/src/distractors.ts` (`questionFor`, `nearestDistractors`,
  `isClick`), `seed-level.ts` (`entitiesForChoice`, `nearDistractorCount`,
  `levelFor`), `question-file.ts` (`buildQuestionBank`, `renderQuestionFile`),
  `write-questions.ts`.
- `backend/app/content_build.py` (`MAP_CLICK_FIELDS`, `_served_map_click`),
  `backend/tests/test_content_build.py` (drift guard),
  `backend/tests/test_t051_map_click.py`.
- `tasks.md` T-092 (the queue entry).

## Handoff

_Not yet: waiting on Q1 and approval._

## Verdict

_Not yet._
