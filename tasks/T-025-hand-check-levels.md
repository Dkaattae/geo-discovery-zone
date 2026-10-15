# T-025 — Hand-check 30 generated questions and tune the level weights

**Status:** `awaiting approval`
**Next step:** `worker` (after a human approves below)
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-025
**Branch:** `claude/practical-clarke-s0b2y4`. The orchestrator assigned this
branch, and this line is the authority for every later role (`process.md`, "When
the environment names the branch for you").
**PR:** opened draft at expand time, built from the branch above. Number recorded
in the expander's handback and on the PR itself. It stays draft until the reviewer
approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-15 | cse_016eUpyD7jeyBpLWPeaAbRgW |

**Worker model:** Opus. This task is a judgement about question difficulty for
children, which `process.md` ("Choosing the worker's model") gives to Opus.

**Kind:** content and curation (`process.md`, "Tasks this loop does not fit").
Most of the deliverable is a recorded human-style reading plus, possibly, a few
changed numbers. The criteria below test the **shape** of that record and the
invariants around it. Whether the ordering is actually sane is the **Review
checklist**, and a person checks it.

## Goal

The 150 generated questions carry levels from a first-guess formula that nobody
has read as a child would (`engineering-decisions.md` E-22 calls its values "a
first guess"). Plan §1.4 says to hand-check about 30 and tune the weights until
the ordering looks sane, so that the levels are trusted before T-040 starts
serving them.

## Survey: what is already true

- **The formula and every weight are done.** `question-bank/src/seed-level.ts`
  `seedLevels` and the constant `LEVEL_SEED_WEIGHTS` (T-023, PR #83). E-22 lists
  every key and value. Nothing in this task builds a stage.
- **Tuning means editing numbers in one constant.** Every number the formula
  uses, except the template's `base_difficulty` and the clamp, is in
  `LEVEL_SEED_WEIGHTS`.
- **The weights before this task**, which this brief calls the **T-023 weights**
  (as in `seed-level.ts` and E-22 at `aa88101`):

  ```
  rank_bucket_edges: [10, 20, 35]
  population_rank_weight: 1
  area_rank_weight: 0.5
  missing_rank_bucket: 2
  near_distractor_weight: 0.5
  concept_load: { "tpl-identify-on-map": 0, "tpl-capital-of": 1, "tpl-click-the-map": 0 }
  concept_load_default: 1
  familiarity_bonus: 0
  ```

- **The pipeline that produces the 150 questions:** `generate` →
  `buildChoices` → `seedLevels` over the committed bank
  `question-bank/data/us-states/` and `TEMPLATES`. Question ids are
  `gen:<templateId>:<entityId>`, for example `gen:tpl-capital-of:us-state-ca`
  (`generate.ts` `draftId`).
- **Templates:** `tpl-identify-on-map` (base 2), `tpl-capital-of` (base 2),
  `tpl-click-the-map` (base 3), all `min_age_band: 1`.
- **Under the T-023 weights the levels run 3.5 to 9** (E-22). The hand-written
  bank the app serves today (`backend/app/data/content.json`) runs 1 to 14.
  This is context for the band judgement, not a target.
- **No test imports `levelFor` or `nearDistractorCount`** outside
  `seed-level.ts`.
- **What is not done:** nobody has read the generated questions as a child
  would, and no weight has been changed on purpose.

## Acceptance criteria

**Frozen once approved.**

Terms used below:

- **The 10 states:** CA, TX, FL, NY, WA, CO, KY, HI, AK, RI. Their population
  ranks in the committed bank are 1, 2, 3, 4, 13, 21, 26, 40, 48 and 43, so every
  obscurity bucket is covered. The list mixes distinctive shapes (FL, TX, AK, HI)
  with crowded neighbourhoods (RI, KY).
- **The 30 questions:** the 10 states × the 3 templates in `TEMPLATES`. Each one
  is the question with id `gen:<templateId>:us-state-<xx>`.
- **The record:** a passage inside the existing E-22 section of
  `engineering-decisions.md`. It is everything after the `## E-22 ` heading and
  before the next line that begins with `## `. It is dated, and it names T-025.
- **The final weights:** `LEVEL_SEED_WEIGHTS` as committed on the task branch
  when the worker hands off.

### The 30 questions are recorded

1. The record contains a table with **exactly 30 rows**, one for each of the 30
   questions, and no pair appears twice. Each row names the state (its postal
   code or its name) and the template id.
2. Each row shows the **prompt exactly as a child sees it**, after `{name}` is
   filled (for example "What is the capital of Colorado?"). It also shows the
   **correct answer** and the **three distractors**. Each value must equal what
   `buildChoices` returns for that question id over the committed bank.
3. Each row shows the question's **level under the T-023 weights** (listed in
   the survey above). The value must equal what `seedLevels` returns for that id
   when `LEVEL_SEED_WEIGHTS` holds those values. The table may round to one
   decimal place, and every level the formula produces is a multiple of 0.5, so
   rounding loses nothing.
4. Each row shows the question's **level under the final weights**. The value
   must equal what `seedLevels` returns for that id. It is shown exactly, or
   rounded to one decimal place and within 0.05 of the computed value. Final
   weights need not keep levels on multiples of 0.5.
5. Each row carries a **verdict under the final weights**: exactly one of
   `about right`, `too easy` or `too hard`. Every row marked `too easy` or
   `too hard` also carries a sentence saying why it was left that way. A row
   marked `about right` needs no sentence.

### The weight decision is recorded and matches the code

6. The record says, in one place, **whether any weight changed**. If any did,
   it lists **every key of `LEVEL_SEED_WEIGHTS` whose value differs** from the
   T-023 weights, with its old value, its new value and a one-sentence reason.
   It lists no key whose value did not change. For `concept_load`, each
   template id counts as its own key. If nothing changed, the record says "no
   weight changed" and gives the reason.
7. E-22's fenced block under "**The constant, as the code spells it:**" lists
   **every key of the final `LEVEL_SEED_WEIGHTS` exactly once, with its final
   value**. It lists no other key, and no key with a value the constant does
   not hold. The block is the current constant, not a history of it.
8. E-22's sentence giving the range of levels over the committed bank (today:
   "Over the committed bank the 150 levels run from 3.5 (Texas, identify on
   map) to 9 (…)") states the **minimum and maximum of all 150 levels under the
   final weights**. At each end it names at least one state and template that
   reaches that value.
9. The record states the **band decision**: whether the final minimum-to-maximum
   range is right for these three templates, and why. It is one to five
   sentences, and it names the grade range that range renders as under plan
   §1.4 (`grade = floor(level / 2)`).

### What must still hold, and what must not happen

10. **Only values change in `seed-level.ts`.** After the task, the set of keys
    in `LEVEL_SEED_WEIGHTS` (and in its `concept_load` object) equals the set
    before it. `LEVEL_MIN` is still 0 and `LEVEL_MAX` is still 18. The exported
    names and the function signatures of `seed-level.ts` are unchanged.
10a. **The formula does not change.** With `LEVEL_SEED_WEIGHTS` set at runtime
    back to the T-023 weights, `seedLevels` over the committed bank returns
    exactly the 150 levels, by id, that it returned at `aa88101`.
11. **`TEMPLATES` is deep-equal to its state at `aa88101`.** Neither
    `base_difficulty` nor any other template field changes.
12. **`familiarity_bonus` is still 0**, and no list of famous, familiar or
    well-known states (or of state ids picked for familiarity) is added
    anywhere under `question-bank/src/`.
13. **Over the committed bank, under the final weights:** all 150 levels are
    finite and within 0–18. Each of the three templates gives at least 2
    distinct levels. Changing any single number in `LEVEL_SEED_WEIGHTS` by +1
    or −1 still changes at least one of the 150 levels.
14. **No committed data moves.** Every file under `question-bank/data/`, under
    `question-bank/sample-data/`, and under `question-bank/src/fixtures/`, plus
    `backend/app/data/content.json`, is byte-identical to `aa88101`.
15. **No new dependency.** Every `package.json` and lockfile in the repository
    is byte-identical to `aa88101`.
16. **No new `E-n` entry.** The highest `## E-` heading in
    `engineering-decisions.md` is still `E-23`, and E-1 through E-23 each appear
    exactly once.
17. **Every question-bank test that existed at `aa88101` passes unmodified**,
    and so do `typecheck`, `lint` and `format:check` in `question-bank/`. No test
    reaches the network.

## Out of scope

- **`base_difficulty`, and any change to `TEMPLATES`.** `concept_load` already
  gives a per-template shift. Changing a template record would make the tests
  that pin `TEMPLATES` stale. If the review shows a template's base is wrong,
  say so in the Handoff, and the reviewer files it.
- **Changing the formula:** adding a term, a continuous scale instead of
  buckets, a new bucket input, or rounding.
- **`familiarity_bonus` and any famous-states list.** A list of famous states
  needs a person's approval (content rule, E-22). If the review shows one is
  needed, say so in the Handoff as a proposal.
- **Freezing `LEVEL_SEED_WEIGHTS`.** The T-023 criterion-20 test mutates it at
  runtime, so freezing it would need an attended Test change request.
- **`levelFor`'s unused `weights` parameter, and exporting or unexporting
  `levelFor` / `nearDistractorCount`.** The worker may call them from a
  throwaway script to compare weight sets, but `seed-level.ts`'s exports and
  signatures stay as they are (criterion 10).
- **Wiring `seedLevels` or `tagQuestions` into the build, or writing their
  output to a file.** That is T-040.
- **Any committed script, CLI flag or package script for printing the
  questions.** A scratch script the worker runs and does not commit is fine.
- **The served bank, the backend and the frontend.** Their levels, and T-056's
  map-mastery arithmetic, are not touched.
- **Rewording prompts, choices or any child-facing text.**
- **Reviewing more than the 30 questions.** The other 120 change level only
  through the shared weights.

## Constraints

- **Files expected to change:**
  - `question-bank/src/seed-level.ts`, values inside `LEVEL_SEED_WEIGHTS` only
    (or no change at all)
  - `engineering-decisions.md`, E-22 only: the record, the constant block, the
    range sentence, and E-22's "The values are a first guess" wording if the
    review supersedes it
  - This brief: Handoff and Notes
  - New test files from the tester
- **The record stays inside E-22.** It gets no `## ` heading of its own: use bold
  text or a `### ` heading. A new `## E-24` would break the T-024 test that pins
  E-23 as the highest entry (`tags-verify.test.ts`, "exactly one E-23, it is the
  highest"), and changing that test would need an attended Test change request.
- **If the tuning you want would turn an existing test red, do not adopt it.**
  Record it in the Handoff under "Tests made stale" as a proposal, adopt the
  nearest set that keeps the suite green, and say what the difference is.
- **E-22's existing statements must stay true.** It still names all five
  formula terms, the near/far rule, the missing-rank rule, why
  `familiarity_bonus` is 0, and "Revisit when". The T-023 tests in
  `seed-level-verify.test.ts` (criterion 21) and `seed-level.test.ts` ("E-22
  records the constant") read this section.
- **Dependencies:** none (`CLAUDE.md`, "Packages").
- **Content rules** (`CLAUDE.md`): do not guess. When a verdict depends on
  something you cannot judge, such as whether a nine-year-old knows Frankfort,
  say that in the row's sentence rather than inventing a basis for it.

## Context

Required reading for the worker and the tester.

- **Plan:** `geoquizdataplan.md` §1.4 ("Difficulty: one number, two labels"),
  for the formula, the `grade`/`band` rendering and the instruction this task
  carries out. §3.3 ("Level selection") explains why the band matters: Setup
  shows a window of three or four levels around the profile's level.
- **Decision:** `engineering-decisions.md` E-22, all of it: the formula, the
  constant, the bucket and near/far rules, and why `familiarity_bonus` is 0.
  E-21 covers distractor tiers, which is where "near" comes from. E-23 is the
  ceiling that criterion 16 protects.
- **Source:**
  - `question-bank/src/seed-level.ts`: the constant and the formula
  - `question-bank/src/distractors.ts` `buildChoices`
  - `question-bank/src/generate.ts` `generate`, `draftId`
  - `question-bank/src/templates.ts` `TEMPLATES`
- **Existing tests that pin this area:**
  - `question-bank/src/seed-level-verify.test.ts`: criteria 16 (HI and CA
    capital), 18 (`familiarity_bonus` is 0), 19 (spread), 20 (every number is
    live) and 21 (E-22 text)
  - `question-bank/src/seed-level.test.ts` ("E-22 records the constant")
  - `question-bank/src/tags-verify.test.ts` (the E-23 ceiling)
- **Queue entry:** `tasks.md` T-025, for the four things to look at while
  tuning: map templates nearly always get 3 near distractors, the 3.5–9 band,
  `familiarity_bonus`, and `levelFor`'s parameter.
- **Contract:** `openapi.yaml` `Level` (0–18). It is not changed.
- **Commands** (`conventions.md`): `cd question-bank && bun test`,
  `bun run typecheck`, `bun run lint`, `bun run format:check`.

## Review checklist

A person checks these before merge and says in the PR who checked them. Tests
cannot check them.

- [ ] **Within each template**, the 10 states' final levels order the way a
      seven-to-ten-year-old would find them, from easiest to hardest. Ties are
      acceptable where the child would not tell the questions apart.
- [ ] **Across templates**, the final levels for one state compare sensibly.
      For example, "What is the capital of Kentucky?" against "Which state is
      highlighted?" for Kentucky.
- [ ] **The band decision** (criterion 9) is acceptable for where the app's
      players are. Remember that Setup shows only a window of levels (§3.3).
- [ ] **Every `too easy` / `too hard` row left that way** has a reason you
      accept.
- [ ] **Every changed weight's reason** (criterion 6) holds up, and none of them
      encodes a guess about which states are famous.
- [ ] **Map questions:** the near-distractor term still means something, given
      that most map questions have 3 near distractors. If it does not, the
      record says so.

## Handoff

## Verdict

## Notes

- **Expander, 2026-10-15:** T-064 (waits on T-040), T-070 (waits on Q1) and
  T-084 (waits on T-070 (a)) were skipped for the reasons already recorded in
  `tasks.md`. T-025 is the first entry whose dependency (T-023, PR #83) is done.
- **Not on the light path**, although it is sized S: it has more than four
  criteria, and the deliverable is a judgement about what children find hard.
