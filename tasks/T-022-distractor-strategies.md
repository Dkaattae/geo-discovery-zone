# T-022 — Distractor strategies

**Status:** `awaiting approval`
**Next step:** `worker` — once `Approved:` is filled in. Opus recommended: this
decides which wrong answers a child sees, which is data correctness.
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-022
**Branch:** `claude/awesome-cerf-v617fy`
**PR:** opened draft at expand time, built from the branch above (number in the
expander's Sessions row once known)
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-15 | cse_01Jqx2eXa4GKKb9X3m5AiHbb |

## Goal

Turn each question draft from `generate()` into a four-option question with
`choices` and `correctIndex`, using the distractor strategy named on its
template. Ohio / Indiana / Illinois / Iowa is a real question; Ohio / Hawaii /
Texas / Alaska is free (plan §1.2). Wrong answers that come from nearby, and a
named fallback where a region is too small, are what make the generated bank
worth playing.

## What the survey found — already true, and what is not

- **Already true, do not rebuild:**
  - The strategies are named on templates. `DISTRACTOR_STRATEGIES` and every
    template's `distractor_strategy` are in `question-bank/src/templates.ts`
    (T-020). `tpl-identify-on-map` and `tpl-click-the-map` use
    `neighbours_first`; `tpl-capital-of` uses `sibling_capitals_same_region`.
  - `generate()` in `question-bank/src/generate.ts` returns 150 drafts and no
    skips over the committed bank (T-021). Each draft has the correct `answer`
    only.
  - Every one of the 50 committed states has `region` (one of 13 values),
    `borders` (entity ids; `[]` for AK and HI), `centroid` (`[longitude,
    latitude]`), `name`, `capital` and `geometry_id`.
- **Not true yet — this task:** nothing builds `choices` or `correctIndex`, and
  no function stands behind either strategy name.
- **The queue entry undercounts the small regions.** It names four regions too
  small to supply distractors (Great Basin, Pacific, Pacific West, Southwest).
  With four choices a question needs **three** distractors, so a region needs
  **four** states to supply them all. Seven regions fall short, covering 11
  states:
  - 1 state: Pacific (HI), Pacific West (CA), Great Basin (NV)
  - 2 states: Southwest (AZ, NM)
  - 3 states: Pacific Northwest (AK, OR, WA), Great Plains (KS, MO, NE)
  - Exactly 4, so just enough: Upper Midwest (IA, MN, ND, SD), South Central
    (AR, LA, OK, TX)
- **Why this is a separate stage, not a change to `generate()`.** Many existing
  tests call `generate()` on a single entity and expect drafts back
  (`generate.test.ts` "skipping"; `generate-verify.test.ts` criteria 14–16). A
  single entity has no distractors. Several also assert `skipped` with
  `toEqual` on exact keys, and `generate-verify.test.ts` › "T-021 criteria 23,
  24, 27" pins `generate.ts`'s imports to `./templates` and `./types`.
  Building choices inside `generate()` would turn all of these red. Criterion 19
  below therefore keeps every pre-existing test unchanged and green.

## Acceptance criteria

**Terms used below.**
- **The new function**: an exported function under `question-bank/src/` that
  takes the drafts `generate()` returned, together with the entities and
  templates that produced them, and returns questions plus reports. Its name,
  module and exact signature are the worker's; the Handoff names them.
- **A question**: one output record. It carries every field of its draft with
  the same value, plus `choices` and `correctIndex`.
- **The choice text** of an entity is its value for the template's
  `answer_field`, or its `name` when `answer_field` is `geometry_id` (the same
  rule as the draft's `answer`, `engineering-decisions.md` E-20).
- **A candidate** for a draft is any entity in the input other than the draft's
  own entity, with the same `type` and the same `scope`, whose choice text is a
  non-blank string, and whose `centroid` is two finite numbers. For a
  `map_click` draft a candidate must also have a non-blank string
  `geometry_id`.
- **Distance** is great-circle distance between two `centroid`s, read as
  `[longitude, latitude]` in degrees on a sphere.
- **Nearest-first order** within a set of candidates: ascending distance from
  the draft's entity; on exactly equal distance, ascending entity `id`.
- **Same text**: two strings that are equal after trimming and lower-casing.

**Shape**

1. Over the committed bank (`question-bank/data/us-states/`, 50 states) with
   the default `TEMPLATES`, the new function returns exactly 150 questions, one
   per draft from `generate()`, and reports nothing.
2. Every question has exactly 4 `choices`, every one a non-blank string.
3. Every question's `correctIndex` is an integer from 0 to 3, and
   `choices[correctIndex]` equals the draft's `answer`.
4. No two choices in a question have the same text. In particular, no
   distractor has the same text as the answer.
5. Every field the draft carried is on the question with an unchanged value
   (`id`, `entityId`, `templateId`, `format`, `prompt`, `answer`, and
   `highlightGeometryId` / `answerGeometryId` where present).

**Which distractors** — every distractor is the choice text of a candidate, and
the three are picked as follows.

6. **`sibling_capitals_same_region`.** The distractors are the first three
   candidates taken from tier 1, then tier 2, in nearest-first order within
   each tier, skipping any candidate whose text is the same as the answer or as
   a distractor already taken:
   - tier 1: candidates whose `region` is non-blank and equal to the draft
     entity's `region`
   - tier 2: every other candidate
7. **`neighbours_first`.** The same, with three tiers:
   - tier 1: candidates whose `id` is in the draft entity's `borders`
   - tier 2: candidates not in tier 1 whose `region` is non-blank and equal to
     the draft entity's
   - tier 3: every other candidate
8. **The region boundary, for `tpl-capital-of` over the committed bank.**
   - For every state in a region of 4 or more states, all three distractors
     are capitals of states in the same region. This includes the exactly-4
     regions: IA, MN, ND, SD, AR, LA, OK and TX each get three same-region
     distractors.
   - For KS, MO, NE, AK, OR and WA, exactly 2 distractors are same-region.
   - For AZ and NM, exactly 1 is.
   - For HI, CA and NV, none is. Their 3 distractors are the capitals of the 3
     nearest states, by criterion 6's tier 2.
9. **The fallback fires for exactly those 11 states.** Over the committed bank,
   the `tpl-capital-of` questions with at least one distractor from outside the
   answer's region are exactly the 11 listed in criterion 8, no more and no
   fewer.
10. **A state with no borders still gets a full question.** Over the committed
    bank, the `tpl-identify-on-map` and `tpl-click-the-map` questions for AK and
    HI each have 4 choices, with distractors from tier 2 and then tier 3.
11. **The strategy is read from the template, not from the format or the
    template id.** Take a copy of `tpl-capital-of` with only
    `distractor_strategy` changed to `neighbours_first`. Over the committed
    bank, its question for Ohio (`us-state-oh`) has distractors that are
    capitals of states bordering Ohio, per criterion 7.

**`map_click`**

12. Every `map_click` question carries a list of `geometry_id`s parallel to
    `choices`: same length, and entry `i` is the `geometry_id` of the entity
    whose name is `choices[i]`. Entry `correctIndex` equals the draft's
    `answerGeometryId`. The field's name is the worker's to choose, and it is
    recorded under criterion 18. Whether other formats carry the list is not
    constrained.

**Position of the correct answer**

13. **Deterministic.** Calling `generate()` and then the new function twice
    over the same input gives deep-equal output.
14. **Depends on the draft id only.** A draft with a given `id` gets the same
    `correctIndex` whether the input is the full committed bank, the bank
    reversed, or any subset of it that still yields that draft and at least
    three candidates.
15. **Not predictable from the format.** Over the committed bank, each value 0,
    1, 2 and 3 is the `correctIndex` of at least 20 of the 150 questions, and of
    at least one question for each of the three templates.

**Bad input and short pools**

16. When a draft has fewer than three candidates with distinct text, it is
    **not** returned as a question. It comes back in the reports instead, with
    its draft `id` and how many distractors were found. Both edges:
    - With 4 states as the whole input (the answer's plus 3 more), every draft
      becomes a question.
    - With 3 states as the whole input, every draft is reported and none
      becomes a question.
    The same happens when the draft entity's own `centroid` is missing or not
    two finite numbers. In neither case does the function throw.
17. A draft whose `entityId` is not among the input entities, or whose
    `templateId` is not among the input templates, makes the function throw
    with that draft's `id` in the message. Nothing is returned.

**Recorded, and nothing else moved**

18. **`engineering-decisions.md` gains one new entry**, numbered as the next
    unused `E-n` (`E-21` at the time of writing, unless something lands first).
    It records:
    - the name of criterion 12's parallel list, spelled exactly as the field is
      spelled in code
    - the tier and nearest-first rule, and why nearest
    - the small-region fallback and the 11 states it covers
    - how the correct position is derived from the draft id
19. **No pre-existing test is modified or deleted, and the whole suite stays
    green.** That covers `bun test`, `bun run typecheck`, `bun run lint` and
    `bun run format:check` in `question-bank/`. This includes the existing
    `generate()` tests: `generate()`'s output is unchanged.
20. **No new I/O, clock or randomness.** The new function's module(s) import no
    network, file, `Bun` I/O or clock API, use no `Math.random` and no `Date`,
    and the module(s) do not mutate their inputs.
21. **The pipeline does not import it.** `build.ts`, `refresh.ts` and
    `normalize.ts` do not import the new module(s), directly or transitively.
22. **`TEMPLATES` and `DISTRACTOR_STRATEGIES` are unchanged in value.** Their
    doc comments may be rewritten.
23. **No new dependency** in any `package.json`, and no lockfile change.
24. **Nothing outside `question-bank/src/` and `engineering-decisions.md`
    changes.** In particular: `openapi.yaml`, `backend/`, `frontend/`,
    `question-bank/data/` and the SPARQL fixtures are untouched.

## Out of scope

- **`openapi.yaml` and the backend.** The queue entry says naming the parallel
  code list "and adding it to `openapi.yaml`" is this task's. This brief takes
  the name only, and records it in criterion 18's entry. Under E-14 the contract
  follows what the backend serves, and nothing serves generated questions yet.
  The field enters `openapi.yaml` and `backend/app/models.py` with the task that
  makes the backend serve them, T-040 or T-051. A `tasks.md` note on both says
  so. **Approver: say so at approval if you want it here instead.** It would
  add the backend model, its contract test, and probably a migration.
- **Same-animal, same-climate and same-crop guards.** No template for
  `wildlife`, `climate` or `agriculture` exists yet, so there is no question
  for a guard to act on, and any test of one would be a test of a template
  invented for the purpose. They move to T-026, with the templates that need
  them. A `tasks.md` note on T-026 carries the data the queue gathered. This
  task only guarantees same-**text** distinctness (criterion 4).
- **`level`, tags and `distractor_tightness`.** These belong to T-023 and T-024.
- **Writing generated questions anywhere**: a file, `content.json`, or the
  database. Nothing serves them until T-040.
- **Changing `generate()`, `QuestionDraft`, `SkippedPair` or the three
  templates.**
- **New templates, new strategy names, or a template field.** The validator
  rejects a tenth field on purpose (T-024's call).
- **Rendering `map_click`** — T-051.

## Constraints

- **Files expected to change:**
  - new module(s) and new test file(s) under `question-bank/src/`
  - `engineering-decisions.md`, for the new entry
  - optionally, the doc comments on `DISTRACTOR_STRATEGIES` in
    `question-bank/src/templates.ts`, and the module comment in
    `generate.ts` that says "`choices` and `correctIndex` are T-022's". Any edit
    to `generate.ts` must leave its imports exactly `./templates` and
    `./types`.
- **Invariants:**
  - pure functions: no network, no file, no clock, no randomness
  - inputs are not mutated
  - output is deterministic
- **Existing tests are not the worker's to change** (`process.md` step 3,
  D-14). If one goes red, list it under *Tests made stale* in the Handoff. With
  the separate-stage shape above, none should.
- **Dependencies:** none. Great-circle distance is a few lines of arithmetic.
- **No text a child reads is written by this task.** Choices are the existing
  `name` and `capital` values from the committed bank.
- **Tests read the committed bank from `question-bank/data/us-states/`.** No
  network, and no SPARQL fixture is needed (`test-guidelines.md`, "Start below
  the transport").
- **Unattended run:** `run-loop.sh` G1 is not touched by any of this. No file
  under `.claude/`, `process*.md` or `CLAUDE.md` changes.

## Context

Required reading for the worker and the tester.

- **`geoquizdataplan.md` §1.2**, "Distractors matter more than the question",
  and the template record's `distractor_strategy`.
- **`geoquizdataplan.md` §1.4**: `distractor_tightness`. Same-region
  distractors are harder. Context only; T-023 scores it.
- **`engineering-decisions.md` E-20**: the draft shape, and the `map_click`
  decision this task builds on (names as choices, codes in a parallel list).
- **`engineering-decisions.md` E-14**: why `openapi.yaml` is out of scope.
- **`question-bank/src/generate.ts`**: `generate()`, `QuestionDraft` and
  `draftId`.
- **`question-bank/src/templates.ts`**: `TEMPLATES`, `DISTRACTOR_STRATEGIES`
  and the strategy doc comments.
- **`question-bank/src/types.ts`**: `Entity`, especially `borders` (entity ids),
  `region` and `centroid`.
- **`question-bank/data/us-states/us-state-*.json`**: the bank the
  over-the-bank criteria run against.
- **`question-bank/src/generate.test.ts`** and
  **`question-bank/src/generate-verify.test.ts`**: the existing tests that must
  stay green. Read "T-021 criteria 23, 24, 27" for the import and purity checks
  that rule out building choices inside `generate.ts`.
- **`question-bank/src/region-vocabulary.test.ts`** and `engineering-decisions.md`
  on the 13-region vocabulary (T-017), which is where criterion 8's region
  sizes come from.
- **`backend/app/grading.py`** `CHOICE_FORMATS`: `map_click` is graded by
  `choiceIndex`, which is why `correctIndex` and the parallel list matter.
- **`backend/app/data/content.json`**: the hand-written questions. All 26 have
  exactly four choices, which is where the number four comes from.
- **`test-guidelines.md`**, "Randomness and time" and "Writing tests from
  acceptance criteria".

## Handoff

## Verdict

## Notes

- **Expander, on criterion 6–7's "nearest-first".** The queue entry lists three
  possible fallbacks: nearest region, neighbouring states, or skipping the
  entity. Skipping would remove the capital question for 11 states, a fifth of
  the bank. "Nearest region" needs a region adjacency table that does not
  exist. Nearest by centroid needs no new data, gives the same answer for
  every reader, and is what makes a distractor tight. Pinning the order, not
  just the tier, is also what lets the tester compute the expected distractors
  from the data without reading the implementation.
