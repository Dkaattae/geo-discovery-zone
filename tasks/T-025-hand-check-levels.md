# T-025 — Hand-check 30 generated questions and tune the level weights

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** Dkaattae — 2026-10-16, in the orchestrator session ("approve"), covering the amended criterion 13 (c). The first approval ("approved, go ahead") covered the criteria before the amendment. See `runs/T-025-hand-check-levels.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-025
**Branch:** `claude/practical-clarke-s0b2y4`. The orchestrator assigned this
branch, and this line is the authority for every later role (`process.md`, "When
the environment names the branch for you").
**PR:** #85, opened draft at expand time, built from the branch above. It stays
draft until the reviewer approves it.
**Fault:** tester — criterion 13's last clause (±1 on any single number changes a level) cannot hold over the committed bank for `missing_rank_bucket` or `concept_load_default` under any weights, given criteria 10, 11 and 14. Criterion needs restating; every other criterion verified.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-15 | cse_016eUpyD7jeyBpLWPeaAbRgW |
| worker | 2026-10-16 | cse_016eUpyD7jeyBpLWPeaAbRgW |
| tester | 2026-10-16 | cse_016eUpyD7jeyBpLWPeaAbRgW (orchestrated: shared id, fresh subagent) |
| task-expander | 2026-10-16 | cse_016eUpyD7jeyBpLWPeaAbRgW (orchestrated: shared id, fresh subagent; amended criterion 13 (c) after `blocked`) |

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
13. **Over the committed bank, under the final weights** (three clauses,
    each checked on its own):
    - **(a)** all 150 levels are finite and within 0–18;
    - **(b)** each of the three templates gives at least 2 distinct levels;
    - **(c)** changing any single number in `LEVEL_SEED_WEIGHTS` by +1 or −1
      still changes at least one of the 150 levels, **for every number except
      exactly two: `missing_rank_bucket` and `concept_load_default`.** Every
      element of `rank_bucket_edges` and every entry of `concept_load` is a
      number of its own and is covered. No key other than those two is exempt.
      The two are exempt because the committed bank never reads them: every
      state has a usable `population_rank` and `area_rank`, and every
      `TEMPLATES` id has its own `concept_load` entry. Their liveness is
      covered instead by the T-023 criterion-20 test in
      `seed-level-verify.test.ts`, whose synthetic corpus reaches both; that
      test must still pass unmodified (criterion 17).

    *Amended 2026-10-16 after the tester's `blocked` verdict. The original (c)
    read "Changing any single number in `LEVEL_SEED_WEIGHTS` by +1 or −1 still
    changes at least one of the 150 levels", with no exemption. It could not
    hold under criteria 10, 11 and 14 for any weight values. (a) and (b) are
    unchanged.*
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

**TL;DR:** One weight changed: `concept_load["tpl-capital-of"]` 1 → 2. The
30-question record, the band decision and the updated constant block and range
sentence are in E-22. The suite is green with no stale tests. **Criterion 13's
last clause cannot be met over the committed bank by any weight values**
(details below), so the tester should judge it, and probably send it to the
expander.

**Files changed**

- **`question-bank/src/seed-level.ts`**: one value. `"tpl-capital-of": 1` →
  `2` inside `LEVEL_SEED_WEIGHTS.concept_load`. No key, comment, export or
  signature changed.
- **`engineering-decisions.md`, E-22 only**:
  - the constant block now reads `"tpl-capital-of": 2`
  - the `concept_load` bullet's "first guess" wording now says T-025 raised
    the capital's load and the map values are still the T-023 guess
  - the range sentence is now "3.5 (California and Texas, identify on map) to
    10 (Delaware, Maine, New Hampshire, Rhode Island, Vermont and West
    Virginia, capital)"
  - a new `### T-025 hand-check of 30 questions (2026-10-16)` subsection at the
    end of E-22, just before `## E-23`. It holds the 30-row table, "Which
    weights changed", the weights tried and not adopted, what the formula
    cannot express, the map near-distractor finding, and the band decision.
- **This brief**: Status, Next step, Sessions, Handoff, Notes.

**Where each criterion lives**

| # | Where |
|---|---|
| 1–5 | The E-22 table: 30 rows, columns State, Template, Prompt, Correct, Distractors (comma-separated, in `choices` order with the correct one taken out), T-023, Final, Verdict, Why left that way |
| 6 | E-22 "**Which weights changed:** one." Just one key is listed |
| 7 | E-22 fenced block under "The constant, as the code spells it:" |
| 8 | E-22 range sentence, above "The option not taken" |
| 9 | E-22 "**The band.**" paragraph: 3.5–10 → grade 1 to grade 5 |
| 10, 10a, 11, 12 | Only one value changed in `seed-level.ts`. `TEMPLATES` was not touched and `familiarity_bonus` is still 0 |
| 13 | Levels are finite, in range, and 9/10/9 distinct per template. The ±1 clause: see "Contradicts the brief" |
| 14, 15 | `git diff aa88101 --stat` touches none of those paths |
| 16 | The record is a `###` subsection with no new `## E-` heading. E-23 is still the highest |
| 17 | `bun test` 2180 pass, 0 fail. `typecheck`, `lint` and `format:check` are clean |

**Verdict counts:** 24 `about right`, 6 `too hard`, 0 `too easy`.
- **Too hard, map:** HI and AK on both map templates.
- **Too hard, capital:** CO (Denver) and HI (Honolulu).
- **Cause:** none of these can be fixed with a weight. The formula only sees
  rank and near count.

**Contradicts the brief: criterion 13's third clause cannot be met.** "Changing
any single number in `LEVEL_SEED_WEIGHTS` by +1 or −1 still changes at least
one of the 150 levels" fails for two keys, under the T-023 weights and under
any values:
- **`missing_rank_bucket`**: every state in the committed bank has a usable
  `population_rank` and `area_rank`, so this value is never read.
- **`concept_load_default`**: all three templates have a `concept_load` entry,
  so the default is never read.

Fixing either would need a key removed (criterion 10), a template changed
(criterion 11) or data changed (criterion 14). The T-023 criterion-20 test
avoids this by adding a synthetic corpus (null-rank AK, renamed templates), and
it passes. I did not build anything to satisfy my own reading of the clause.
**Owner: tester to rule, then task-expander to restate it**, probably as
"every number except these two", or "over the T-023 criterion-20 corpus".
Reproduce with a scratch script that sets each leaf ±1 and compares the 150
levels from `seedLevels(buildChoices(generate(bank)))`.

**Deliberately not done**
- **No familiarity list and no new input.** The record proposes two fact
  fields, "drawn in an inset" (AK, HI) and "capital is the largest city", or a
  person-approved `familiarity_bonus` list. Either one changes the formula.
  **Owner: reviewer to file it as a `tasks.md` entry at the sweep.** It is out
  of scope here.
- **`near_distractor_weight`, `area_rank_weight` and the bucket edges were
  tried and kept.** The record gives the reasons.
- **No `base_difficulty` change was needed.** Identify < click < capital is now
  the order for every state.
- **E-22's "Revisit when" was left as written.** It still names T-025 as a
  trigger. **Owner: reviewer**, who may reword it at the sweep.
- **No committed script.** The scratch scripts lived in the session scratchpad.

**How to run**
- `cd question-bank && bun install --frozen-lockfile` first. node_modules was
  absent in this container, and without it `typecheck` and `lint` fail on
  missing binaries.
- Then `bun test && bun run typecheck && bun run lint && bun run format:check`.
- To recompute the T-023 column, set
  `LEVEL_SEED_WEIGHTS.concept_load["tpl-capital-of"] = 1` at runtime. Every
  other T-023 value is unchanged, so this is the whole T-023 weight set.

**Tests made stale:** none.

**Same session id as the expander.** The Sessions table shows
`cse_016eUpyD7jeyBpLWPeaAbRgW` for both rows. That is what
`$CLAUDE_CODE_REMOTE_SESSION_ID` returned. The tester must run in a different
session.

## Verdict

**TL;DR: blocked, on criterion 13's third clause only.** It cannot be met over
the committed bank by any weight values, so it is a brief problem, not a code
problem. Every other criterion (1–12, 13's first two clauses, 14–17) passes, with
31 new tests, and the whole suite is green. **Next: task-expander** restates
clause 13c. The worker does not need to change anything.

**Independence.** This run is orchestrated (`runs/T-025-hand-check-levels.md`
exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_016eUpyD7jeyBpLWPeaAbRgW`, the
same id as the expander and worker rows. Every orchestrator-spawned role shares
that id, so the session check proves nothing here. My independence rests only on
being a freshly spawned subagent with its own context. I did not see the worker's
conversation or reasoning. That is weaker evidence than a separate session,
because it depends on the orchestrator having spawned me correctly.

**Tests:** `question-bank/src/hand-check-levels-verify.test.ts` (31 tests).
Baselines at `aa88101` are embedded as sha256 digests, because CI checks out
shallow. I computed them once from a `git worktree` of `aa88101`, which I have
since removed.

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | The E-22 table has 30 rows, the 30 required ids each once, and `TEMPLATES` ids are the 3 templates |
| 2 | pass | Prompt, correct answer and distractor set equal `buildChoices` output for every row, and no `{`/`}` is left in any prompt |
| 3 | pass | The T-023 column is within 0.05 of `seedLevels` with the brief's T-023 weights set at runtime, and every computed value is a multiple of 0.5 |
| 4 | pass | The Final column is within 0.05 of `seedLevels` under the committed constant |
| 5 | pass | Each verdict is one of the three. All 6 `too hard` rows carry a sentence |
| 6 | pass | The "Which weights changed" bullets name exactly the changed keys (`concept_load["tpl-capital-of"]` 1 → 2) with old → new and a reason |
| 7 | pass | The fenced block parses to an object deep-equal to `LEVEL_SEED_WEIGHTS`, with no duplicate keys |
| 8 | pass | The range sentence says 3.5 and 10. The computed minimum and maximum are 3.5 (CA, TX identify) and 10 (DE, ME, NH, RI, VT, WV capital). All the states it names are correct |
| 9 | pass | The "**The band.**" paragraph is 1–5 sentences and names "1st grade … to 5th grade", which is floor(3.5/2)=1 and floor(10/2)=5 |
| 10 | pass | The key sets of the constant and of `concept_load` are unchanged. `LEVEL_MIN`/`LEVEL_MAX` are 0/18. Export signatures match `aa88101` |
| 10a | pass | With the T-023 weights set at runtime, the 150 `[id, level]` pairs hash to `aa88101`'s digest. The constant is restored afterwards |
| 11 | pass | The `TEMPLATES` digest equals `aa88101`'s |
| 12 | pass | `familiarity_bonus` is 0. The famous/familiar/well-known hits in non-test `src/` are exactly the 6 lines present at `aa88101`. `seed-level.ts` names no state |
| 13a, 13b | pass | All 150 levels are finite and in 0–18. Distinct levels per template are 9 (identify), 10 (capital) and 9 (click) |
| **13c** | **blocked** | See below |
| 14 | pass | Manifest digests of `data/`, `sample-data/` and `src/fixtures/`, and the `content.json` hash, equal `aa88101` |
| 15 | pass | All 8 tracked package/lock/pyproject files are byte-identical, and none was added |
| 16 | pass | `## E-` headings are exactly 1..23, once each |
| 17 | pass | The 48 test files at `aa88101` are present and hash-identical. Full suite under the loopback proxy: **2211 pass, 0 fail** (2180 before + 31 new). `typecheck`, `lint` (0 warnings) and `format:check` are clean |

**Criterion 13c: why it is blocked.** The clause reads "Changing any single
number in `LEVEL_SEED_WEIGHTS` by +1 or −1 still changes at least one of the 150
levels". It fails for two keys:

- **`missing_rank_bucket`**: every state in the committed bank has a usable
  positive-integer `population_rank` and `area_rank`, so this value is never read.
- **`concept_load_default`**: all three `TEMPLATES` ids have their own
  `concept_load` entry, so the default is never read.

I ran ±1 on each key over the committed bank, with the code at this branch and
again with the code at `aa88101`. All four runs left all 150 levels unchanged.
No compliant change can fix it: making either key live would need a key removed
(criterion 10), a template changed (criterion 11) or data changed (criterion 14).
The test file pins both premises in two tests (`criterion 13 (blocked): …`) and
checks 13c for every other number, which passes. I wrote no test for the
literal clause.

**Suggested restatement for the expander** (its call, not mine): "every number
except `missing_rank_bucket` and `concept_load_default`, which the committed bank
never reads". Or say the clause is already covered by the T-023 criterion-20
synthetic corpus, which passes.

**Mutations** (each reverted; `git status` clean afterwards apart from the new test file):

| Mutation | Went red |
|---|---|
| Final level of CA capital in the table 5 → 4 | c4 |
| TX distractor New Mexico → Arkansas | c2 |
| KY capital T-023 level 8 → 8.5 | c3 |
| Constant block capital load 2 → 1 | c7 |
| `seed-level.ts` capital load 2 → 3 | c4, c6 (both), c7, c8 |
| Range sentence maximum 10 → 9.5 | c8 |
| RI click row deleted | c1 |
| AK click "why" emptied | c5 |
| CA identify verdict → "fine" | c5 |
| Unchanged `area_rank_weight` added to the changed list | c6 |
| Band paragraph "5th grade" → "4th grade" | c9. The first version survived this because "above grade 5" appears elsewhere in the paragraph. I tightened the test to require "<min> … to … <max>" in one sentence |
| `## E-24` appended | c16 |
| near-distractor term zeroed in the formula | c3, c4, c8, c9, c10a, c13c |
| `familiarity_bonus` line with a famous-states list | c12 (both) |
| A byte changed in `us-state-ri.json` | c2, c14 |
| A line appended to `tags.test.ts` | c17 |
| First `base_difficulty: 2` → 3 in `templates.ts` | c3, c4, c8, c9, c10a, c11 |
| `seedLevels` return type changed | c10 |

**Not tested here: the Review checklist.** Whether the ordering is sane is for a
person to judge, per the brief's Kind.

**Tests made stale:** none found. No pre-existing test was modified.

## Notes

- **Expander, 2026-10-15:** T-064 (waits on T-040), T-070 (waits on Q1) and
  T-084 (waits on T-070 (a)) were skipped for the reasons already recorded in
  `tasks.md`. T-025 is the first entry whose dependency (T-023, PR #83) is done.
- **Not on the light path**, although it is sized S: it has more than four
  criteria, and the deliverable is a judgement about what children find hard.
- **Worker, 2026-10-16:** The capital and click-the-map templates gave the
  same level for 49 of the 50 states under T-023 (all but CA). That cross-template tie was
  the one problem a weight could fix.
- **Worker, 2026-10-16:** The within-template problems found (HI, AK, Denver,
  Honolulu) all come from inputs the formula lacks: how a state is drawn, and
  whether the capital is a city a child has heard of. Weights cannot reach
  them.
- **Worker, 2026-10-16:** The verdicts are one reader's judgement, not play
  data. Where a verdict depended on what a child has heard of, the row says
  so. **Owner: the person working the Review checklist.**
- **Expander (amendment), 2026-10-16:** Criterion 13 (c) restated after the
  tester's `blocked` verdict. **Only that clause changed.** (a) and (b), and
  every other criterion, Out of scope, Constraints and the Review checklist,
  are word-for-word as approved. The fix exempts exactly
  `missing_rank_bucket` and `concept_load_default`, the two numbers the
  committed bank never reads, and points their liveness at the T-023
  criterion-20 synthetic corpus, which criterion 17 already requires to pass
  unmodified. I took the tester's first suggestion over "covered by
  criterion 20" alone because it keeps a check over the real bank for every
  other number.
- **What the next rounds have to do.** The Verdict found no fault in the
  worker's output, and the amendment asks nothing new of the code or the E-22
  record. **Worker:** after the fresh approval, confirm no change is needed
  and hand off. **Tester:** re-verify 13 (c) as restated, then give a fresh
  verdict on the whole brief. The `Fault:` line stays until the task reaches
  `pass` (`tasks/TEMPLATE.md`).
- **Needs a person:** the `Approved:` line went back to `pending`, because
  `process.md` step 2 says amended criteria are re-approved. Nobody can
  approve in this orchestrated run, so the worker will refuse to start until a
  person writes their name and the date there.
