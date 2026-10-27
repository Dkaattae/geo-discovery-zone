# T-092 — Stop generating candidates for `map_click`

**Status:** `awaiting approval`
**Next step:** `worker` — once a human replaces `pending` below with their name and the date
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-092
**Branch:** `claude/tender-feynman-fv9k0l`
**PR:** #100, opened draft at expand time against the branch above

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-27 | cse_011oDiJe6KxQ3qitLn4NjWjF (spawned by the orchestrator; shared session id) |
| task-expander | 2026-10-27 | session_011oDiJe6KxQ3qitLn4NjWjF (spawned by the orchestrator; froze the criteria for Q1 = (a)) |

## Q1 — resolved: (a), keep every level as it is

**Answer — the person, 2026-10-27, in the orchestrator's session, verbatim: "a".**

**Why there was a question.** The queue entry asks for no candidates on
`map_click` *and* an unchanged `content.json`. `seedLevels`
(`question-bank/src/seed-level.ts:170-200`) adds `near_distractor_weight` (0.5) ×
the number of near distractors, and for `map_click` finds them through
`choiceGeometryIds` (`seed-level.ts:144`). In the committed file 48 of 50
`map_click` questions have 3 near distractors, 1 has 2, 1 has 0, and `level` is
served (`MAP_CLICK_FIELDS`).

**What (a) means for this task.** The level stage keeps computing, internally,
the three nearest candidates a `map_click` question would have had and counts the
near ones, exactly as today; it stops *writing* them. So every `map_click` level,
and `content.json`, stay byte-identical, and a `map_click` draft is still dropped
into `shortPools` whenever it is today. Options (b) and (c) — dropping the
distractor term, or moving its weight into `concept_load` — were not chosen and
are out of scope.

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
8. Every `map_click` question's `level` in the committed question file equals
   the default branch's level for the question with the same id.
9. For a synthetic entity bank a test builds, every `map_click` question's
   `level` equals the level the default branch's stages compute for the same
   input — including a case where some of the three nearest peers border the
   state or share its region (so the near-distractor term is non-zero) and a case
   where none do.
10. For the same synthetic inputs, the `shortPools` entries for `map_click`
    drafts — `draftId`, `found` and `reason` — are the same as the default
    branch's stages report. In particular:
    - state's own `centroid` usable, two eligible peers (same `type` and `scope`, a usable `centroid`, a
      non-blank `geometry_id`, a distinct name) → a `shortPools` entry with
      `found: 2`, `reason: "too_few_candidates"`, and no question;
    - state's own `centroid` usable, three eligible peers → a question, and no `shortPools` entry;
    - state with no usable `centroid`, any number of peers → a `shortPools`
      entry with `reason: "no_centroid"`, and no question.

**The served bank**

11. `make -C backend content` writes bytes identical to the committed
    `backend/app/data/content.json` (the existing drift guard holds).
12. The committed `backend/app/data/content.json` is byte-identical to the
    default branch's.

**Words**

13. `engineering-decisions.md` E-29 gains a dated paragraph naming T-092 that
    says the generator no longer writes candidates for `map_click`, and that a
    `map_click` level still counts the near distractors of the three nearest
    peers it would have offered, computed internally and not written, so served
    levels did not move (Q1 answer (a)). E-1 to E-28 are
    byte-identical to the default branch, and there is no new `## E-n` heading.
14. No comment or docstring in `question-bank/src/` (non-test files) or in
    `backend/app/content_build.py` still says the question file holds candidates,
    `choices`, `correctIndex` or `choiceGeometryIds` for `map_click` questions
    (today: `content_build.py`'s comment above `MAP_CLICK_FIELDS`,
    `distractors.ts`'s header and the `choiceGeometryIds` field doc,
    `question-file.ts`'s header).

**What must not happen**

15. No new dependency, and no change to any `package.json`, `bun.lock`,
    `pyproject.toml` or `uv.lock`.
16. Nothing under `frontend/`, `e2e/`, `backend/migrations/`, and no change to
    `openapi.yaml`, `backend/app/grading.py` or any `backend/app/` file other than
    `content_build.py` (comments only). `backend/app/data/content.json` is not
    changed at all.
17. No test reaches the network, and no child-facing text changes: every
    `prompt`, `choices` entry and `funFact` served in `content.json` is identical
    to the default branch's.
18. The full suites pass: `cd question-bank && bun test`, `cd frontend && bun
    test`, `make -C backend test`.

## Out of scope

- Any other format's distractors, ordering or caps (T-088, T-091).
- What the server sends alongside a `map_click` question (T-053), and the
  answer key on other formats (T-045).
- Re-tuning any level weight, changing what the level formula counts for
  `map_click` (Q1 options (b) and (c)), or re-running E-26's measurement.
- The digest-guard policy (T-070). Guards this change turns red go through a
  Test change request, not a re-pin policy.
- Dropping `answer` from `map_click` questions: it is the state's name, E-20's
  label beside the code, and stays.

## Constraints

- Files expected to change: `question-bank/src/distractors.ts` and/or
  `question-bank/src/seed-level.ts` (whichever stage the worker chooses),
  `question-bank/data/questions/us-states.json` (regenerated, never hand-edited),
  comments in `question-file.ts` and `backend/app/content_build.py`,
  `engineering-decisions.md` (E-29 only). Not `backend/app/data/content.json`,
  and not `LEVEL_SEED_WEIGHTS`.
- The level stage needs the would-be candidates without the question carrying
  them: however the worker routes them (an internal value, a side structure, a
  recomputation), none of it may reach a question object the file or
  `buildQuestionBank`'s returned `questions` holds.
- Expect stale tests. Known candidates, for the worker's **Tests made stale**
  list (the worker never edits them): `distractors.test.ts` and
  `distractors-verify.test.ts` (`choiceGeometryIds` on `map_click`),
  `seed-level-verify.test.ts`, `tags-verify.test.ts`,
  `backend/tests/test_t051_tester_criteria.py:570` (asserts four
  `choiceGeometryIds` on a question-file `map_click` question), and any digest
  or byte pin over `us-states.json`. **Plan to attend the tester step.**
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

_Not yet: waiting on approval._

## Verdict

_Not yet._
