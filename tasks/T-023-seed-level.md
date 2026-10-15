# T-023 — Seed `level` deterministically

**Status:** `blocked`
**Next step:** `task-expander`
**Approved:** Dkaattae (person, in the orchestrator session) — 2026-10-15: "approved, go ahead with the worker". See `runs/T-023-seed-level.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-023
**Branch:** `claude/stoic-lamport-zeq0c3`
**PR:** #83, opened draft at expand time, built from the branch above. It stays draft until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-15 | cse_01U46hLUXQXCwTAjFRk3oYmE |
| worker | 2026-10-15 | cse_01U46hLUXQXCwTAjFRk3oYmE (same id as the expander: relayed run, process.md "Two things break") |

> **TL;DR.** Give every generated question a `level` in 0–18 from plan §1.4's
> formula, as a **new pure stage after `buildChoices`**, with every weight in one
> exported constant and an `E-22` entry. Two scope calls for the approver:
> **`familiarity_bonus` is 0 for every question** (home state is per-player, and
> no "famous states" list exists to read), and **`buildChoices`'s output does not
> change** (adding `level` there would turn two pre-existing tests red — see
> Constraints). Worker model: **Opus** — the weights are a design call.

## Goal

The plan's difficulty system (§1.4) needs every question to carry one stored
`level`, and the generated questions do not have one yet. Seeding it
deterministically from data the bank already holds gets "90% of the way for
free, with zero play data", and gives T-025 something to hand-tune.

## What is already true (survey, 2026-10-15)

- **The inputs exist.** All 50 committed states carry a non-null
  `population_rank` and `area_rank` (1 = largest; `normalize.ts:96–98` sets
  both to `null` for every state when a build holds fewer than 50).
- **`base_difficulty` exists** on every template (`templates.ts`), validated to
  a finite number in 0–18, and documented as "a stored input to `level`, on the
  same 0–18 scale. Not a level itself". The three templates carry 2, 2 and 3.
- **The distractor tier is recoverable from the question.** `buildChoices`
  (`distractors.ts`, E-21) picks distractors in tiers: same region (and, for
  `neighbours_first`, bordering first), then everything else. Its 150 questions
  over the committed bank include 11 small-region states whose capital
  distractors are partly or wholly from outside the region (E-21 lists them).
- **The contract already has the field.** `openapi.yaml` `Question.level` →
  `Level`, a float 0–18, and `backend/app/models.py:27` `Level = Annotated[float,
  Field(ge=0, le=18)]`. Non-integer levels already render
  (`backend/app/levels.py` `band_label` buckets the band). **Nothing in the
  contract changes.**
- **Nothing computes a level in `question-bank/` today.** `generate.ts`'s header
  says "`level` is T-023's"; PROGRESS.md says "A question has no `level` or tags
  yet".

## Acceptance criteria

Throughout: "the stage" is the new exported function this task adds. It takes
the questions `buildChoices` returned, plus the `entities` and `templates` that
produced them, and returns those questions with `level` added. The worker names
it in the Handoff and in E-22. "The committed bank" is the 50 files under
`question-bank/data/us-states/` (not `index.json`), run through `generate()` then
`buildChoices()` with the default `TEMPLATES`. A **near distractor** is a
distractor whose entity is in the question entity's `borders`, or has the same
non-blank `region` as it. Every other distractor is **far**. "Otherwise equal"
means the same template, the same entity fields apart from those named, and the
same count of near distractors.

**Output shape**

1. Over the committed bank, the stage returns exactly 150 questions, with the
   same `id`s in the same order as its input.
2. Every returned question has a `level` that is a JavaScript `number`, finite
   (`Number.isFinite`), with `0 <= level <= 18`, both bounds inclusive.
3. Every returned question's keys are its input question's keys plus `level`,
   and nothing else. Every other field is deep-equal to the input's.
4. The stage does not mutate its inputs: the questions, entities and templates
   it was given are deep-equal before and after the call.

**Determinism**

5. Two calls with the same inputs return deep-equal results.
6. Reversing the order of `entities` (and running `generate` and `buildChoices`
   on the reversed list) leaves every question's `level` unchanged, matched by
   `id`.
7. The stage's module uses no `Math.random`, `Date`, `performance`, network,
   file system or environment read, directly or through anything it imports.

**`base_level(template)`**

8. For two templates that are otherwise equal, a template whose
   `base_difficulty` is greater by `d` gives each entity's question a level that
   is greater by `d` (within `1e-9`), as long as neither level is clamped at 0
   or 18.
9. A template with `base_difficulty: 18` never gives a level above 18. A
   template with `base_difficulty: 0` never gives a level below 0. Both hold for
   every entity rank, from 1 to 50 and `null`, and for every near-distractor
   count, from 0 to 3.

**`entity_obscurity`** — from `population_rank` and `area_rank` (plan §1.4)

10. Monotone: for two otherwise-equal questions, if entity A's
    `population_rank <= ` B's **and** A's `area_rank <= ` B's (both ranks in
    1–50), then `level(A) <= level(B)`.
11. Not constant: at `base_difficulty: 2`, an entity ranked 50 on both ranks
    gets a strictly higher level than an otherwise-equal entity ranked 1 on
    both.
12. A `null` rank, an absent rank key, and a rank that is not a positive integer
    (`0`, `-3`, `2.5`, `NaN`, a string) are all treated the same way as each
    other. The stage does not throw, and criterion 2 still holds. This is
    checked for each rank on its own and for both together.
13. The value a missing rank contributes is written down in E-22. It equals
    what some actual rank in 1–50 would contribute, so a missing rank is never
    harder than rank 50 or easier than rank 1.

**`distractor_tightness`** — "same-region distractors are harder" (plan §1.4)

14. Monotone: for two otherwise-equal questions with `k` and `k + 1` near
    distractors (`k` in 0–2), the one with `k + 1` never has a lower level.
15. Not constant: at `base_difficulty: 2`, a question with 3 near distractors
    gets a strictly higher level than an otherwise-equal one with 0.
16. Over the committed bank, `tpl-capital-of`'s questions for HI, CA and NV
    (0 near distractors, E-21) each get a strictly lower level than they would
    with 3 near distractors and their own ranks. The tester computes the
    3-near value with a synthetic entity set and the same ranks.

**`concept_load` and `familiarity_bonus`**

17. `concept_load` is a per-template value, keyed by template `id` in the
    weights constant (criterion 20), with a documented default for an id that
    has no entry. A valid template whose id is not in `TEMPLATES` still gets
    levels that satisfy criterion 2.
18. `familiarity_bonus` contributes 0 to every question. The stage's inputs are
    the questions, entities and templates alone: no profile, home state or
    player field, and no "famous entity" list.

**Spread over the real bank**

19. Over the committed bank, each of the three templates' 50 questions takes at
    least 2 distinct `level` values.

**One documented place**

20. One exported constant, in one module, holds every weight, bucket edge,
    per-template `concept_load`, default and the missing-rank value that the
    level computation uses. Checked by mutation: changing any one numeric value
    in it changes at least one question's level over the committed bank or a
    synthetic bank. The tester reverts every mutation.
21. `engineering-decisions.md` gains exactly one `## E-22 ` heading, or the next
    unused number if one lands first. Every `## E-n` number stays distinct.
    E-22 contains:
    - the formula, naming all five terms;
    - the name of the stage and of the constant;
    - every key of the constant with its value, as the code spells them;
    - the near/far definition;
    - the missing-rank rule (criterion 13);
    - why `familiarity_bonus` is 0;
    - a "Revisit when" line.
    A shape test reads the constant's keys and values and finds each one in the
    E-22 text.

**What must not happen**

22. `buildChoices` and `generate` return exactly what they returned before the
    task. No question either of them returns has a `level` key.
23. `TEMPLATES` and the `Template` record are unchanged: the same nine keys,
    and `validateTemplate` accepts and rejects exactly what it did before.
24. Nothing the pipeline runs imports the stage's module, directly or
    transitively: not `build.ts`, `refresh.ts` or `normalize.ts`. No file under
    `question-bank/data/`, `question-bank/sample-data/` or
    `question-bank/src/fixtures/` changes.
25. No new dependency: `question-bank/package.json` and `question-bank/bun.lock`
    are unchanged.
26. No test that existed before this task is deleted or modified.
27. `openapi.yaml`, `backend/` and `frontend/` are unchanged.
28. The whole `question-bank` suite, `typecheck`, `lint` and `format:check`
    pass.

## Out of scope

- **Tuning the weights against real questions.** That is T-025, a human pass
  over 30 questions. This task makes the weights tunable and documented, and
  sane enough that criteria 10–19 hold. It does not have to make the ordering
  look right to a reader.
- **Changing any template's `base_difficulty`**, or adding a template.
- **A home-state bonus.** It depends on the player, so it belongs at serving
  time, not in a stored level. It becomes a `tasks.md` entry if anyone wants it.
- **A "famous states" list** for `familiarity_bonus`. Nothing in the bank holds
  one, and a guessed list is exactly what "prefer a blank field to a guessed
  one" rules out. T-025 may propose one for a human to approve.
- **`age_band`, `rating`, `timesAnswered`, and the other tags** (T-024).
- **Writing, loading or serving generated questions** (T-040). Nothing writes
  the stage's output to disk.
- **Reconciling with `backend/app/data/content.json`'s hand-written levels**
  (1–14). Generated levels need not match them.
- **The same-animal, same-climate and same-crop guards** (T-026).
- **Rounding.** Any finite value in 0–18 is acceptable. If the worker rounds,
  say so in E-22.

## Constraints

- **Files expected to change:**
  - one new module under `question-bank/src/` holding the stage and the
    constant;
  - new test file(s) next to it;
  - `engineering-decisions.md` (E-22);
  - optionally, the header comments of `generate.ts` and `distractors.ts`,
    where they say `level` is T-023's. Comments only.
- **Why a separate stage, not a field on `buildChoices`.** Two pre-existing
  tests would go red if `buildChoices` added `level`:
  - `distractors.test.ts:88–89` strips `choices`, `correctIndex` and
    `choiceGeometryIds` from each question, then `toEqual`s the rest against
    the draft;
  - `distractors-verify.test.ts:707` asserts `distractors.ts` imports only
    `./generate`, `./templates` and `./types`.
  Both would need an attended Test change request (D-14, D-15). A stage after
  `buildChoices` matches E-21's own reasoning: distractors are a separate stage
  after `generate()`, and level is one more after that. Exporting a helper from
  `distractors.ts` is allowed as long as its behaviour and imports do not
  change (criterion 22, and that import test).
- **Pure**, the same way `generate.ts` and `distractors.ts` are: no network,
  file, clock or randomness. A test never reaches the network
  (`test-guidelines.md`), and none is needed: every input is the committed bank
  or a synthetic entity list.
- **Errors.** A question whose `entityId` or `templateId` is not among the
  inputs is a caller bug. Throw, naming the question `id`, as `buildChoices`
  does. The stage's behaviour is defined only for questions `buildChoices`
  returned over the same entities and templates.
- **Dependencies:** none (CLAUDE.md, "Ask before adding a dependency").
- **No pre-existing test changes** (criterion 26). If the worker finds one going
  stale anyway, it goes under **Tests made stale** in the Handoff, not into an
  edit.
- `bun` only, in `question-bank/`.

## Context

Required reading for the worker and the tester.

- **Plan:**
  - `geoquizdataplan.md` §1.4 "Difficulty: one number, two labels": the formula,
    the 0–18 scale, and why `age_band` is separate;
  - §1.2: the template record and "Distractors matter more than the question";
  - §1.3: the tag table, for `level`'s range.
- **Decisions:** `engineering-decisions.md`:
  - E-20, the draft shape (`level` was always to be added after);
  - E-21, the tiers, the 11 small-region states, and "Revisit when T-023 wants
    `distractor_tightness`";
  - E-10, labels are display-only and never compute a level.
- **Source:**
  - `question-bank/src/distractors.ts`: `buildChoices`, `GeneratedQuestion`,
    and `tierOf`, the tier rule this brief's near/far definition restates;
  - `question-bank/src/generate.ts`: `generate`, `QuestionDraft`;
  - `question-bank/src/templates.ts`: `Template.base_difficulty`, `TEMPLATES`;
  - `question-bank/src/types.ts`: `Entity.population_rank` and `area_rank`,
    both `number | null`;
  - `question-bank/src/normalize.ts:93–102`: when ranks are `null`.
- **Existing tests to keep green, and to copy the shape of:**
  - `question-bank/src/distractors-verify.test.ts`: the committed-bank loader,
    the E-21 shape tests (`:675–700`, a distinct-number E-n check that does not
    expire), and the transitive-import check (`:748`);
  - `question-bank/src/distractors.test.ts`.
- **Contract:** `openapi.yaml` `components.schemas.Level` and `Question.level`.
  Read only, nothing changes.
- **Rules:** `test-guidelines.md` (pure functions first, no network), and
  `CLAUDE.md` Tests.

## Review checklist — for the human approving the brief

- [ ] `familiarity_bonus` = 0 for every question, with home state deferred to
      serving time and no "famous" list (criterion 18, Out of scope). Is that
      the call you want before T-025?
- [ ] The stage runs after `buildChoices`, which stays unchanged
      (criterion 22, Constraints). The queue entry said "seed `level` on the
      `GeneratedQuestion`s that `buildChoices` returns". This does that, as a
      stage rather than as a new field set inside `buildChoices`.
- [ ] A missing rank counts as some real rank in 1–50, never as harder than the
      hardest (criterion 13).

## Handoff

> **TL;DR.** The stage is built and the whole gate is green, but **criterion 16
> contradicts the brief's own near/far definition for NV**, so it cannot pass as
> written. Status `blocked`, back to **task-expander** to amend criterion 16 (then
> human re-approval). No code change is expected from the fix: the implementation
> follows the brief's near definition exactly.

### Why blocked: criterion 16 versus the near definition

- **The brief defines near** as "in the question entity's `borders`, or the same
  non-blank `region`". Criteria 14 and 15 rely on that definition.
- **Criterion 16 says** HI, CA and NV's `tpl-capital-of` questions have "0 near
  distractors, E-21". E-21 says **0 same-region** distractors. That is a
  different thing, because the borders half of the definition still applies.
- **What the committed bank actually gives**, by the brief's definition:

  | State | Distractors (`choices` minus the answer) | Near count |
  |---|---|---|
  | HI | Sacramento, Salem, Carson City | **0** (no borders, alone in `Pacific`) |
  | CA | Carson City (NV), Salem (OR), Salt Lake City (UT) | **2** (NV and OR border CA) |
  | NV | Sacramento (CA), Salt Lake City (UT), Salem (OR) | **3** (all three border NV) |

- **So for NV, "the level with 3 near distractors and its own ranks" is its
  actual level.** "Strictly lower" cannot hold for any tightness that is a
  function of the near count. HI and CA do pass.
- **What I did not do: build to my reading of it.** I could have made NV pass by
  (a) counting near per strategy tier, so `sibling_capitals_same_region` ignores
  `borders`, or (b) adding a second, same-region-only weight. (a) breaks the
  brief's near definition, which criteria 14 and 15 test. (b) passes or fails
  criterion 16 depending on how the tester builds its synthetic "3 near" set,
  which is building to my reading of the criterion.
- **Proposed fixes, for task-expander, with re-approval by Dkaattae:**
  1. **Replace NV with HI and CA only, or with HI alone.** HI is 0 near, CA is 2.
     Correct the parenthetical to "0 same-region distractors". This is the
     smallest change, and the current code passes it.
  2. Or redefine near for the capital strategy as same-region only, matching
     the tier in `tierOf`. Then criteria 14 and 15 need the same change, and
     E-22 and the code change with them.
  My recommendation is option 1. Borders are a fair signal of confusability for
  capitals too: Carson City is a plausible wrong answer for California.

### What changed, file by file

- **`question-bank/src/seed-level.ts` (new).** The stage is `seedLevels(questions,
  entities, templates = TEMPLATES)`. The constant is `LEVEL_SEED_WEIGHTS`. It
  also exports `levelFor` (one question), `nearDistractorCount`, `LEVEL_MIN` /
  `LEVEL_MAX` (0 / 18), and the types `LeveledQuestion` and `LevelSeedWeights`.
  Imports: `./distractors` (type only), `./templates`, `./types`.
- **`question-bank/src/seed-level.test.ts` (new).** 11 tests, my own. The
  tester's verify file is the independent check.
- **`engineering-decisions.md`.** Appends `## E-22`.
- **`question-bank/src/generate.ts`.** One header comment line: "`level` is
  T-023's" now reads "`level` by `seedLevels` in seed-level.ts (T-023, E-22)".
  Comment only. `distractors.ts` is untouched (it has no `level` mention).

### Where each criterion lives

| # | Where |
|---|---|
| 1, 3 | `seedLevels` maps input to `{ ...question, level }` in input order |
| 2, 9 | `levelFor` clamps to `LEVEL_MIN`–`LEVEL_MAX`. Every term is finite: an unusable rank becomes `missing_rank_bucket` |
| 4 | No input is written. Spreads only |
| 5, 6, 7 | No state, no randomness or clock. Entity lookup is by id. Near-matching is "any match is near", so order does not matter |
| 8 | `base_difficulty` is added unscaled |
| 10, 11 | `rankBucket`: the count of `rank_bucket_edges` the rank is strictly above. Weights 1 (population) and 0.5 (area) |
| 12, 13 | `usableRank`: a positive integer, or missing. Missing means bucket `missing_rank_bucket` = 2, the bucket of ranks 21–35 |
| 14, 15 | `near_distractor_weight` 0.5 × near count, from `nearDistractorCount` |
| **16** | **Blocked**: see above. HI and CA pass, NV cannot |
| 17 | `concept_load[template.id]`, else `concept_load_default` (1) |
| 18 | `familiarity_bonus: 0` in the constant, subtracted. No player input exists |
| 19 | Over the bank: identify 3.5–8, capital 4–9, click 4.5–9 |
| 20 | `LEVEL_SEED_WEIGHTS`. Every numeric leaf mutated by +1 and −1 changes at least one level (24/24), over the committed bank plus base-0 and base-18 copies of the capital template, with AK's `population_rank` set to null |
| 21 | E-22. My test checks each `key: value` (arrays as `[a, b, c]`, `concept_load` entries as `"tpl-…": n`) |
| 22–27 | `buildChoices`, `generate`, `templates.ts`, `package.json`, `bun.lock`, data and fixtures are untouched. No pipeline file imports `seed-level.ts` |
| 28 | Green. See below |

### What I deliberately did not do

- **The clamp bounds are not in `LEVEL_SEED_WEIGHTS`.** I first had `min_level`
  and `max_level` there. Lowering `min_level` can never change a level, because
  no term is negative while `familiarity_bonus` is 0. That would fail
  criterion 20's mutation check, and 0–18 is the contract's `Level` range, not a
  tunable weight. They are now `LEVEL_MIN` / `LEVEL_MAX` beside the constant.
  **Reviewer to confirm, or overturn by moving them back and accepting that one
  mutation is a no-op.**
- **No rounding.** Levels land on multiples of 0.5 with the current weights.
- **An unmatched distractor counts as far.** That is a distractor whose text
  matches no entity, which `buildChoices` output never produces. I did not
  throw, because the brief names only the unknown `entityId` / `templateId` as
  errors. Reviewer to confirm.
- **Mutation edges.** A bucket-edge mutation that crosses no integer (10 → 10.5)
  changes nothing, because ranks are integers. The tester should mutate by
  whole numbers.

### How to run

```
cd question-bank
bun install --frozen-lockfile   # fresh container: node_modules was absent
bun test src/seed-level.test.ts # 11 pass
bun test                        # 2085 pass, 0 fail
bun run typecheck && bun run lint && bun run format:check   # all clean
```

### Tests made stale

None.

## Verdict

## Notes

- **Worker, 2026-10-15.**
  - **Model.** Ran on Opus, as the brief asked.
  - **Prettier.** `bun run format` before `bun install` used a different
    prettier and rewrote two pre-existing test files (`distractors.test.ts`,
    `highest-point-metres-verify.test.ts`). I reverted both before committing.
    With the pinned prettier, `format:check` is clean. Worth knowing for any
    role that formats in a fresh container.
  - **The map templates nearly always get 3 near distractors** (only AK = 2 and
    HI = 0 do not), so `distractor_tightness` barely separates map questions.
    Owner: T-025, when tuning.
  - **Level range.** Over the bank, levels run 3.5 to 9, about 1st grade to 4th
    grade. Whether that is the right band for "which state is highlighted" is
    T-025's call.
