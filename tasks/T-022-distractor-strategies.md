# T-022 — Distractor strategies

**Status:** `changes requested`
**Next step:** `tester` — come back and fix Review finding 1 (one assertion in `distractors-verify.test.ts`), then hand back to `reviewer`
**Approved:** Dkaattae — 2026-10-15, in the orchestrator's session: "approved, continue with the worker". See `runs/T-022-distractor-strategies.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-022
**Branch:** `claude/awesome-cerf-v617fy`
**PR:** #82, opened draft at expand time, built from the branch above. It stays
draft until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-15 | cse_01Jqx2eXa4GKKb9X3m5AiHbb |
| worker | 2026-10-15 | cse_01Jqx2eXa4GKKb9X3m5AiHbb |
| tester | 2026-10-15 | cse_01Jqx2eXa4GKKb9X3m5AiHbb (orchestrated subagent; see Verdict) |
| reviewer | 2026-10-15 | cse_01Jqx2eXa4GKKb9X3m5AiHbb (orchestrated subagent) — changes requested |

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
    HI each have 4 choices, picked per criterion 7 with tier 1 empty.
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
    - With 4 committed states as the whole input (the answer's plus 3 more),
      every draft becomes a question.
    - With 3 committed states as the whole input, every draft is reported and
      none becomes a question.
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

**TL;DR.** Built: new `buildChoices()` in `question-bank/src/distractors.ts`,
a separate stage after `generate()`, plus E-21. Over the committed bank it
returns 150 questions and nothing in `shortPools`. Whole suite green (2030 pass,
0 fail), typecheck, lint and format clean. **Tests made stale: none.**

**Note for the tester on sessions.** The worker row in Sessions shows the same
session id as the expander (`cse_01Jqx2eXa4GKKb9X3m5AiHbb`). That is what
`$CLAUDE_CODE_REMOTE_SESSION_ID` returned in this orchestrated run: the
orchestrator spawned both roles as subagents under one remote session. The
tester should record its own id and judge independence against that.

**Files changed**
- `question-bank/src/distractors.ts` (new): `buildChoices`, `correctIndexFor`,
  `greatCircleKm`, `CHOICE_COUNT`, types `GeneratedQuestion`, `ShortPool`,
  `BuildChoicesResult`.
- `question-bank/src/distractors.test.ts` (new): 18 worker tests, one or more
  per criterion 1-17, 20, 22.
- `question-bank/src/templates.ts`: doc comment on `DISTRACTOR_STRATEGIES` only.
  Values untouched.
- `question-bank/src/generate.ts`: module doc comment only (the "T-022's" line).
  Imports still exactly `./templates` and `./types`.
- `engineering-decisions.md`: new **E-21**.

**The function**

```ts
buildChoices(
  drafts: readonly QuestionDraft[],
  entities: readonly Entity[],
  templates: readonly Template[] = TEMPLATES,
): { questions: GeneratedQuestion[]; shortPools: ShortPool[] }
// ShortPool = { draftId: string; found: number; reason: "too_few_candidates" | "no_centroid" }
```

The "reports" in the criteria are `shortPools`. Questions keep draft order.

**Criterion → where it lives**

| # | Where |
|---|---|
| 1-5 | `buildChoices` / `questionFor`; question is `{ ...draft, choices, correctIndex }` |
| 6, 7 | `tierOf` + `byTierThenNearest` (tier, then distance, then `id` with `<`); same-text skip in `questionFor` |
| 8, 9, 10 | fall out of 6/7 over the bank; no special-casing of any state |
| 11 | `tierOf` switches on `template.distractor_strategy` only |
| 12 | field **`choiceGeometryIds`**, set on `map_click` questions only |
| 13-15 | `correctIndexFor(draft.id)`: FNV-1a 32-bit + murmur3 fmix32, `% 4`. Bank split 34/34/40/42; every value appears for every template |
| 16 | `shortPools`; own centroid not two finite numbers → `found: 0, reason: "no_centroid"` |
| 17 | all drafts are resolved before any question is built, so a throw returns nothing |
| 18 | `engineering-decisions.md` E-21 |
| 20 | imports: `./generate` (type-only, erased), `./templates`, `./types`. No I/O, `Date`, `Math.random` |
| 21 | nothing imports `distractors.ts` |
| 22-24 | values unchanged; no `package.json` or `bun.lock` change; diff is only `question-bank/src/` + `engineering-decisions.md` + this brief |

**Deliberately not done**
- **`openapi.yaml` / backend.** Out of scope per the brief. E-21 says the field
  enters them with T-040 or T-051.
- **`choiceGeometryIds` on other formats.** Only on `map_click`. Criterion 12
  leaves it open; `map_identify` already has `highlightGeometryId` and a list
  there would be unused. Reviewer to confirm, or T-051 to change when it
  renders.
- **Duplicate entity ids or template ids** in `buildChoices`' input are not
  rejected: first one wins. `generate()` already throws on both, and no
  criterion asks for it. Reviewer to decide whether that is worth a follow-up.
- **No `tasks.md` edit.** Criterion 24 bounds the diff. The brief's Out of
  scope mentions notes on T-026 and T-040/T-051 in `tasks.md`; I did not check
  or add them, as that is the sweep's job.

**Contradictions with the brief:** none found. Every count in criterion 8 and
the 11 states in criterion 9 matched the bank exactly.

**How to run** (in `question-bank/`; a fresh checkout needs `bun install
--frozen-lockfile` first, or typecheck/lint/format fail for missing tools):

```
bun test src/distractors.test.ts
bun test && bun run typecheck && bun run lint && bun run format:check
```

**Tests made stale:** none. No pre-existing test was modified or deleted, and
none goes red.

## Verdict

**TL;DR. Pass.** All 24 criteria hold. 44 new tests in
`question-bank/src/distractors-verify.test.ts` recompute every expected
distractor from the bank with their own haversine and tier walk; whole suite
2074 pass / 0 fail, typecheck, lint and format clean. Next: reviewer.

**Independence: weaker than a separate session.** `$CLAUDE_CODE_REMOTE_SESSION_ID`
is `cse_01Jqx2eXa4GKKb9X3m5AiHbb`, the same id listed as expander and worker.
This is an orchestrated run (`runs/T-022-distractor-strategies.md` exists), where
every spawned role shares one id, so the check proves nothing either way. My
independence rests on being a freshly spawned subagent with its own context: I
did not see the work done or the worker's reasoning. That depends on the
orchestrator having spawned me correctly, not on anything I could verify.

**Criterion → verdict → evidence** (test names are `T-022 criterion N: …`)

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | 150 questions, ids = draft ids, `shortPools` `[]` |
| 2, 3, 4, 5 | pass | 4 non-blank choices; `choices[correctIndex] === answer`; distinct after trim/lower-case (incl. a padded upper-case copy of the answer, skipped); every draft field deep-equal |
| 6, 7 | pass | all 150 questions' distractors equal an independent tier + haversine + id-tiebreak oracle; Ohio spot checks; tier-2 top-up; decoys for scope, type, NaN / short centroid, blank text; `map_click` needs `geometry_id`, `map_identify` does not; id tie-break with four co-located twins |
| 8 | pass | 39 states with 3 same-region (incl. IA MN ND SD AR LA OK TX); KS MO NE AK OR WA = 2; AZ NM = 1; HI CA NV = 0 and equal to the 3 nearest states' capitals |
| 9 | pass | out-of-region set is exactly the 11 |
| 10 | pass | AK, HI identify + click: 4 choices, `borders` `[]`, match oracle |
| 11 | pass | capital template switched to `neighbours_first`: Ohio gets the 3 nearest bordering states' capitals |
| 12 | pass | `choiceGeometryIds` on all 50 `map_click`, parallel by name, `[correctIndex] === answerGeometryId` |
| 13 | pass | two runs deep-equal |
| 14 | pass | same index over bank, reversed bank, and 3 subsets per state (own + 3 far, 3 near reversed, every 7th) |
| 15 | pass | every index ≥ 20 of 150 and present for each template |
| 16 | pass | 4-state groups (3 groups incl. HI/AK) → 12 questions; 3-state groups → 9 reports, `found: 2`; 2 distinct capitals → reported `found: 2`; own centroid missing / null / NaN / Infinity / 1 / 3 numbers / strings → reported, no throw, others built |
| 17 | pass | unknown `entityId`, unknown `templateId` → throws naming that draft's id |
| 18 | pass | one `## E-21`, highest E number, names `` `choiceGeometryIds` `` (the only extra array key on a question), tiers, "Why nearest", the 11 codes, draft-id position |
| 19 | pass | `git diff e494529~1 HEAD -- '*.test.ts'` shows only the new `distractors.test.ts`; no pre-existing test modified; suite + typecheck + lint + format:check green |
| 20 | pass | imports only `./generate` `./templates` `./types`; no fetch / `node:` / fs / `Bun.` / `Date` / `Math.random` / `performance.` / `process.`; deep-frozen inputs do not throw and stay deep-equal |
| 21 | pass | transitive import walk from build / refresh / normalize never reaches `distractors.ts` |
| 22 | pass | `TEMPLATES` and `DISTRACTOR_STRATEGIES` equal the pre-T-022 values (copied from `e494529~1`), before and after a run |
| 23 | pass | no `package.json` or `bun.lock` in `git diff --name-only e494529~1 HEAD` |
| 24 | pass, read as the worker's diff | worker commit `fc71d87` touches only `question-bank/src/`, `engineering-decisions.md` and this brief. The branch also changes `tasks.md` (expander, `e494529`) and `runs/` (orchestrator), which the brief's own Out of scope and the loop expect. Nothing under `openapi.yaml`, `backend/`, `frontend/`, `question-bank/data/` or fixtures |

**Mutations to `distractors.ts`** (each run against my file, then reverted with
`git checkout`; `git diff` is clean):

| Mutation | Red tests |
|---|---|
| Euclidean degrees instead of great-circle | 3 (crit 6/7 oracle, 8 HI/CA/NV, 10) |
| reversed id tie-break | 1 (tie-break) |
| no skip of answer-equal text | 1 (crit 4) |
| no border tier | 3 (crit 7, 7 Ohio, 11) |
| no region tier | 5 (crit 6, 8, 9) |
| index depends on input length | 1 (crit 14) |
| `map_click` ignores missing `geometry_id` | 1 |
| answer code pushed at end of `choiceGeometryIds` | 1 (crit 12) |
| no own-centroid guard | 7 (crit 16 centroid cases) |
| case-sensitive same-text | 2 (crit 4, 16) |
| `correctIndex` always 0 | 1 (crit 15) |
| scope ignored | 1 |
| strategy chosen by format | 1 (crit 11) |
| unknown template does not throw | 1 (crit 17) |
| **FNV-1a without the murmur3 finalizer** | **0** |

The last one stays green, and correctly so. Without the finalizer the split is
the 13/12/12/13 pattern the worker's note describes, which still meets
criterion 15 as written (≥ 20 each, every value for every template). The
finalizer is a quality choice E-21 records, not something a criterion pins.
Reviewer may want to decide whether that matters.

**Not tested by me:** nothing skipped. Criteria 19, 23 and 24 were checked with
`git` commands (above), not in a test, because a test must not depend on git
history. All values came from the committed bank in `question-bank/data/us-states/`.
No network, no fixture edited, no source edited.

## Notes

- **Expander, on criterion 6–7's "nearest-first".** The queue entry lists three
  possible fallbacks: nearest region, neighbouring states, or skipping the
  entity. Skipping would remove the capital question for 11 states, a fifth of
  the bank. "Nearest region" needs a region adjacency table that does not
  exist. Nearest by centroid needs no new data, gives the same answer for
  every reader, and is what makes a distractor tight. Pinning the order, not
  just the tier, is also what lets the tester compute the expected distractors
  from the data without reading the implementation.

- **Worker, on the correct position.** Plain FNV-1a `% 4` gave all three
  templates the same 13/12/12/13 pattern: its low bits depend only on each
  byte's low bits, so the template part of the id barely moved them. Adding the
  murmur3 finalizer fixed that. Recorded in E-21 because a reader would
  otherwise "simplify" it away.
- **Worker, on the tests' independence.** `distractors.test.ts` recomputes the
  expected distractors with its own tier walk and sort rather than calling the
  module's comparator. It still shares `greatCircleKm`, so a wrong distance
  formula would pass it. The tester should compute distance independently.
- **Worker, on `sibling_capitals_same_region` naming.** The strategy picks by
  the template's `answer_field`, so it would pick names, not capitals, on a
  name template. Criterion 11 needs exactly this. The doc comment now says so.

## Review

**TL;DR. Changes requested, tester only.** The implementation is good and I would
approve it as it stands. One tester assertion goes red the moment *any* later task
adds `E-22`, which would force a person-gated test change request (D-14/D-15) onto
an unrelated task. Needs `tester` to come back and fix finding 1. No worker or
expander change. PR #82 stays draft, and I did not sweep.

**Checked**
- **PR state:** open, draft, not merged.
- **Every role's work is in the PR:** expander (`e494529`, `ebf0812`, `417ae71`),
  worker (`fc71d87`), tester (`7fd16bb`), plus orchestrator run-log commits.
- **Lanes (D-7):** the expander touched only `tasks/` and `tasks.md`. The worker
  touched `question-bank/src/`, `engineering-decisions.md` and the brief. The
  tester added one new test file and edited the brief, with no source. The
  orchestrator touched `runs/` and the brief header.
- **Constraints:** nothing outside `question-bank/src/`, `engineering-decisions.md`,
  `tasks*` and `runs/`. No `package.json` or lockfile change. No `openapi.yaml`,
  backend, data or fixtures. No pre-existing test modified (`Test changes: none`).
- **Suite, run by me** in `question-bank/`: `bun test` 2074 pass / 0 fail.
  `typecheck`, `lint` and `format:check` are clean. CI's question-bank job passes.
- **Approval:** a person's. `Approved:` is Dkaattae's words, relayed after the
  orchestrator's own stamp was refused and reverted (`28c69b1`, `1889a29`).

### Findings

1. **Blocking. `question-bank/src/distractors-verify.test.ts:679`**,
   `expect(Math.max(...nums)).toBe(21);`. This pins E-21 as the *highest* entry in
   `engineering-decisions.md`. Criterion 18 asks for "the next unused `E-n`"
   *at the time it is written*. It does not ask that nothing comes after. Once
   this merges, the first task to add an `E-22` goes red for no fault of its own.
   Clearing that would need a D-14 test change request and a person in a live
   session (D-15), on a task that has nothing to do with distractors. That is the
   expiring-baseline shape E-12 removed. The repo has already written down the
   rule to follow: `highest-point-verify.test.ts:645-654` says "a later, higher
   entry is not a failure of this one", and checks only `toContain(8)` and that no
   number repeats.
   **Acceptable when** line 679 is replaced by a check that holds after later
   entries land, for example `expect(new Set(nums).size).toBe(nums.length)`. Line
   678, exactly one `E-21`, stays. This test was added on this branch, so the
   tester changes it itself and needs no test change request. Rerun the whole suite
   afterwards.
2. **Non-blocking, no task.** Four comment lines exceed the 100-column width the
   rest of the file keeps: `distractors.ts:103`, `228`, `234` and `generate.ts:9`.
   Prettier does not rewrap comments, so `format:check` passes. This is cosmetic
   and not worth a queue entry. Whoever next edits those comments can rewrap them.

### Flags disposed

- **`choiceGeometryIds` only on `map_click` (worker):** decided, keep it.
  `map_identify` already has `highlightGeometryId`, and an extra list would go
  unused. If rendering needs it elsewhere, T-051 owns that change.
- **Duplicate entity or template ids, where the first one wins (worker):**
  decided, no follow-up. `buildChoices` is fed the inputs `generate()` was given,
  and `generate()` already throws on duplicates.
- **The murmur3 finalizer is not pinned by any test (tester):** decided, that is
  acceptable. Criterion 15 is the contract. E-21 records why the finalizer exists,
  which is what stops someone from "simplifying" it away.
- **The worker's tests share `greatCircleKm` (worker):** closed. The tester's file
  uses its own haversine, and the Euclidean mutation went red in 3 tests.
- **`sibling_capitals_same_region` picks by `answer_field` (worker):** decided,
  correct. Criterion 11 requires it, and the `DISTRACTOR_STRATEGIES` doc comment
  now says so.

### For the next reviewer

- **The envelope, once finding 1 is fixed:** everything else is inside it. The
  tester passed, the approval is a person's, no child-facing text was written
  (choices reuse existing `name` / `capital` values), and nothing touches the
  contract, a migration or the plan. Expect "mark ready, no escalation note".
- **The sweep has one extra trim.** Three `tasks.md` notes say the list is "named
  in the `E-n` T-022 records" (under T-040 and T-051, and the T-026 note's
  sibling). Rewrite them to name `choiceGeometryIds` (E-21).
