# T-085a — Level input the weights cannot reach: Hawaii and Alaska are drawn apart from the mainland

**Status:** `awaiting verification`
**Next step:** `tester`
**Decision:** Dkaattae, 2026-10-29, given in the orchestrator's session, answering the worker's block: "split it — do T-085a now"
**Approved:** orchestrator — 2026-10-29, unattended run (T-085a, after the split). See `runs/T-085-level-familiarity-inputs.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-085 (now T-085a; the largest-city half is T-085b)
**Branch:** `claude/loving-knuth-umj4pp`
**PR:** #107, opened draft at expand time, built from the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P |
| worker | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P (same id as the expander's row: the environment variable gave this value; the tester should check its own differs) |
| task-expander (split into T-085a) | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P (same value again, from `$CLAUDE_CODE_REMOTE_SESSION_ID`; see the worker's Note on the shared id) |
| worker (T-085a) | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P (same value as every row above, from `$CLAUDE_CODE_REMOTE_SESSION_ID`; the tester must confirm its own id differs) |

## Goal

Six served questions about Hawaii and Alaska (both map templates and the
climate question) are seeded harder than a child finds them, because the level
formula sees only rank and near-distractor count. Dkaattae approved
(2026-10-27) a person-approved `familiarity_bonus` entry for the two states
drawn apart from the mainland; this task lands that entry alone, regenerates
the bank, and writes it into E-22. The largest-city entry needs a Census check
this environment cannot reach, so it is split out to T-085b (Dkaattae,
2026-10-29).

## Already true, and what remains

- **Already true.** The `familiarity_bonus` term exists in the formula and in
  `LEVEL_SEED_WEIGHTS` (`question-bank/src/seed-level.ts:68`), as a single
  scalar `0` subtracted in `levelFor` (`seed-level.ts:221`) from every
  question. `levelFor` receives the question, so it can see `templateId` and
  `entityId`. The clamp to 0–18 exists (`seed-level.ts:222`). `levelFor` and
  `nearDistractorCount` are already unexported (E-22, T-086). `ageBand` comes
  from the template's `min_age_band` (`tags.ts`), not from the level, so it
  does not move.
- **Baseline levels** ("before": `question-bank/data/questions/us-states.json`
  at `5ae564a`, which is `origin/main` and this branch's merge base; read by the
  expander). 415 questions; levels run 3 to 10. Every HI and AK question:

  | Template | HI | AK |
  |---|---|---|
  | `tpl-identify-on-map` | 6.5 | 6 |
  | `tpl-click-the-map` | 7.5 | 7 |
  | `tpl-climate-of` | 9.5 | 8 |
  | `tpl-capital-of` | 8.5 | 8 |
  | `tpl-biggest-state` | 8.5 | 7 |
  | `tpl-state-animal-of` | 8.5 | 8 |
  | `tpl-landmark-in` | 8.5 | 8 |
  | `tpl-crop-of` | 8.5 | 7 |

- **Probably already true after the change, but checked anyway (criterion
  18).** E-22's range sentences: the lowest map level is 3.5 (CA, TX), and HI's
  4.5 and AK's 4 stay above it. The highest stays 10. The climate levels 7.5 and
  6 stay inside the 3–10 range of the 265 T-026 levels.
- **Remains.** The per-state, per-template entry, both committed files
  regenerated, and E-22 amended.

## Acceptance criteria

"The bank" below means `seedLevels` applied to the committed entities in
`question-bank/data/us-states/` with the default templates, which is what
`question-bank/data/questions/us-states.json` is generated from. "Before" means
the levels on `origin/main` at `5ae564a` (the table above).

**Drawn apart from the mainland**

1. In the bank, each of these six questions has a level exactly 2 lower than
   before: `gen:tpl-identify-on-map:us-state-hi` 4.5,
   `gen:tpl-click-the-map:us-state-hi` 5.5, `gen:tpl-climate-of:us-state-hi`
   7.5, `gen:tpl-identify-on-map:us-state-ak` 4,
   `gen:tpl-click-the-map:us-state-ak` 5, `gen:tpl-climate-of:us-state-ak` 6.
2. Every HI and AK question of the other five templates (`tpl-capital-of`,
   `tpl-biggest-state`, `tpl-state-animal-of`, `tpl-landmark-in`,
   `tpl-crop-of`) has exactly its before level in the bank; in particular
   `gen:tpl-capital-of:us-state-hi` stays 8.5 and
   `gen:tpl-capital-of:us-state-ak` stays 8.
3. No question about any of the other 48 states changes level, on any template.
4. On a synthetic input, the reduction follows the entity, not the bank: a
   `tpl-identify-on-map` question whose entity is `us-state-hi` gets a level 2
   lower than the same question whose entity is an otherwise identical entity
   with a different id; and a question on a template outside the three of
   criterion 1 gets no reduction for `us-state-hi` or `us-state-ak`.

**The largest-city half is not landed**

5. Every `tpl-capital-of` question in the bank has exactly its before level
   (all 50).
6. `LEVEL_SEED_WEIGHTS` names no state id other than `us-state-hi` and
   `us-state-ak`, and names no capital or city: no unconfirmed largest-city
   membership ships, not even at a reduction of 0.

**The clamp and the module**

7. The clamp holds under the new input, on both sides of 0: on a synthetic
   input, a drawn-apart question whose level before the reduction is exactly 2
   gets 0; one whose level before the reduction is 1.5 gets 0, not -0.5; and
   one at 2.5 gets 0.5.
8. No level in the bank is below 0 or above 18.
9. `seedLevels` is still pure and deterministic: called twice on the same
   inputs it returns deep-equal results, and it mutates neither its
   `questions`, `entities` nor `templates` arguments.
10. The amount, the two state ids and the three template ids are all read from
    `LEVEL_SEED_WEIGHTS`: overriding the constant in place (as T-025 did) so
    the drawn-apart amount is 0 gives back exactly the before levels for all
    415 questions; and overriding it so the amount is 3 gives the six
    questions of criterion 1 a level exactly 3 below before, and changes no
    other question.
11. `question-bank/src/seed-level.ts` exports exactly what it exports now:
    `seedLevels`, `LEVEL_SEED_WEIGHTS`, `LEVEL_MIN`, `LEVEL_MAX`,
    `LevelSeedWeights`, `LeveledQuestion`. `levelFor` and
    `nearDistractorCount` stay unexported.

**Everything else holds still**

12. Every question in the bank other than the six of criterion 1 has exactly
    its before level (409 questions).
13. No question's fields other than `level` change, in the question file or in
    `content.json`.

**The committed files**

14. `question-bank/data/questions/us-states.json` equals what
    `cd question-bank && bun run ./src/write-questions.ts` writes from the
    committed tree (byte-identical), and carries the levels of criteria 1
    and 12.
15. `backend/app/data/content.json` equals what `make -C backend content`
    writes from the committed tree, and each served question's `level` equals
    the same question's level in the question file.
16. No file under `question-bank/data/us-states/` changes. No entity gains a
    field.

**E-22**

17. E-22 (`engineering-decisions.md`) has a new dated paragraph,
    `2026-10-29 (T-085a)` or the date it lands, that states the drawn-apart
    input: its amount (2), the two states (Hawaii, Alaska), the three templates
    (`tpl-identify-on-map`, `tpl-click-the-map`, `tpl-climate-of`), and that the
    list was approved by Dkaattae on 2026-10-27.
18. E-22's statements about the range of levels over the committed bank (the
    "150 levels run from … to …" and "265 new levels run from … to …"
    sentences, and the states named at each end) are true of the regenerated
    bank, or carry a dated note giving the new range and states.
19. E-22 has a table of every question whose level changed, one row each (six
    rows), with its id, the before level and the after level, and those values
    equal the bank's.
20. E-22 says the largest-city input is not landed and names T-085b as where
    it is decided; and no sentence or heading in E-22 still says
    `familiarity_bonus` is 0 for every question, that it is 0 because no
    reviewed list exists, or that whether it is set is T-085's question.
21. Every key and numeric leaf of `LEVEL_SEED_WEIGHTS` appears in E-22's
    "constant, as the code spells it" block with its value.
22. E-22's T-025 hand-check table (the 30 rows under "T-025 hand-check of 30
    questions") is unchanged, as is every `E-n` entry other than E-22.

**Negative**

23. No new dependency: the three `package.json` files, `bun.lock` files,
    `backend/pyproject.toml` and `backend/uv.lock` are unchanged.
24. No test reaches the network.
25. `openapi.yaml` is unchanged.

## Out of scope

- **The largest-city input, all of it** (the 17 capitals, the Census check,
  Rhode Island's accepted risk). That is T-085b in `tasks.md`. Do not add a
  placeholder for it (criterion 6), and do not write the RI risk into E-22.
- **Tuning the amount.** The queue says the amounts "are a first guess the
  task may tune". This brief pins the approved −2, because a criterion whose
  expected value the worker may choose is not a criterion. If the worker finds
  a reason to tune, it says so in Notes and the change comes back through the
  expander for a fresh approval.
- **How two familiarity inputs combine.** Only one exists after this task. Do
  not add a test that pins stacking either way; T-085b decides it.
- **The fact-field option** (a new entity field "drawn apart"). Not chosen. No
  entity schema change, no Wikidata query change, no `normalize.ts` change.
- **A player's home state** as a familiarity source. That is serving-time, not
  a seeded level (E-22).
- **The other `too hard` rows** of E-26 and E-27 (California's climate, NY and
  RI climate), the capital rows for Denver and Honolulu (T-085b), and the
  climate distractor rules (T-091).
- **Rewriting history.** E-26's and E-27's tables, which quote the old HI/AK
  levels as measured on their dates, stay as they are. So does T-025's table.
- **Selection, the level window, and serving** (`backend/app/`, E-10, E-28),
  other than regenerating `content.json`.
- **Elo** (plan §1.4).
- **Making the regeneration a script** (T-087) and **re-pinning the bank
  guards for refreshes** (T-095).

## Constraints

- **Files expected to change:** `question-bank/src/seed-level.ts`,
  `question-bank/data/questions/us-states.json`,
  `backend/app/data/content.json`, `engineering-decisions.md` (E-22 only), new
  test files, and the brief.
- **Invariant (E-22): every number the computation uses lives in
  `LEVEL_SEED_WEIGHTS`**, and the module stays pure: no network, no file, no
  clock, no randomness. The per-state membership and the template list are data
  the computation uses, so they live there too.
- **No outside source is needed.** HI and AK membership was approved by a
  person on 2026-10-27; it is not a population figure and needs no Census
  check.
- **The constant's shape meets an existing rule.** `seed-level.test.ts`
  ("one E-22 heading, and every key and numeric value of LEVEL_SEED_WEIGHTS in
  it") checks numbers, arrays and one level of object nesting against E-22's
  text. A deeper nested shape may turn it red. Either keep a shape it can read,
  or list it under **Tests made stale**; do not edit it.
- **Existing tests will go red by design, and the worker does not touch them.**
  The queue entry lists the known ones: `hand-check-levels-verify.test.ts`
  (criteria 4, 7, 8, 10, 10a, 12, 14), `seed-level-verify.test.ts` (criteria
  18, probably 20), `seed-level-loose-ends-verify.test.ts` (criteria 1–8, 10,
  12, and the E-22 heading pin at line 66), the T-089 and T-092 verify tests
  that pin E-1..E-28 byte for byte, `climate-far-phrases-verify.test.ts`
  (`LEVEL_SEED_WEIGHTS` sha and the `content.json` digest),
  `bank-pins.ts` / `BANK_DIGESTS` over the question file, and
  `highest-point-metres-verify.test.ts` if it hashes the question file. The
  worker lists every one it finds under **Tests made stale**; the tester raises
  the Test change request (D-14, D-15). **This task will halt at the tester
  for a person.**
- **Regeneration commands:** `cd question-bank && bun run ./src/write-questions.ts`,
  then `make -C backend content`. Run both, in that order, and commit both
  files.
- **Dependencies:** none (`CLAUDE.md`, "Packages").
- **Model:** Opus. Data correctness, and many pinned tests to account for.

## Context

**Required reading for the worker and the tester.**

- `tasks.md` T-085 (T-085a) — the approved HI/AK list and the option chosen —
  and T-085b, to know what is deliberately left out.
- `engineering-decisions.md` **E-22** in full (the formula, the constant block,
  "Why `familiarity_bonus` is 0", "What the module exports", the range
  sentences, the T-025 hand-check table, "What the reading found the formula
  cannot express", and its **Revisit when**).
- `engineering-decisions.md` **E-26** table D and **E-27** table D, for the
  `tpl-climate-of` HI and AK rows that make six served rows, not four.
- `engineering-decisions.md` **E-24** — the question file and `content.json`
  are committed and regenerated by hand.
- `geoquizdataplan.md` **§1.4** — the level formula, "very famous" entities as
  a familiarity source, and Elo later.
- `question-bank/src/seed-level.ts` — `LEVEL_SEED_WEIGHTS` (line 29),
  `levelFor` (line 206), `seedLevels` (line 235).
- `question-bank/src/seed-level.test.ts:182` — the constant-in-E-22 rule.
- `question-bank/src/question-file.ts:44` — where `seedLevels` runs in the
  pipeline; `question-bank/src/write-questions.ts`.
- `backend/app/content_build.py`, `backend/Makefile` target `content`.
- The tests named under Constraints, to know what will go red and why.
- `test-guidelines.md` — call `seedLevels` directly; no seam needed, no
  network.
- `CLAUDE.md` "Content rules".

## Review checklist

The criteria are testable. A person checks the one judgement a test cannot:

- [ ] Hawaii at 4.5 / 5.5 / 7.5 and Alaska at 4 / 5 / 6 read as about right for
      a seven-to-ten-year-old next to their neighbours in the bank (for
      example Florida's and California's map questions).

## Handoff

**TL;DR: built. Hawaii and Alaska drop exactly 2 on identify-on-map,
click-the-map and climate (six questions); nothing else moved. Both committed
files are regenerated and E-22 is amended. 25 existing question-bank tests, 3
backend tests and the question-bank typecheck go red by design; every one is
listed under Tests made stale, and the tester has to raise a Test change
request (D-14) for a person.**

(The round-1 Census block that stood here applied to the unsplit brief and is
replaced, as the expander's Note says.)

**What changed, file by file**

- **`question-bank/src/seed-level.ts`**: `familiarity_bonus: 0` became
  `familiarity_bonus: 2`, and two keys were added:
  `familiarity_bonus_states: ["us-state-hi", "us-state-ak"]` and
  `familiarity_bonus_templates: ["tpl-identify-on-map", "tpl-click-the-map", "tpl-climate-of"]`
  (both `readonly string[]`). `levelFor` subtracts `familiarity_bonus` only
  when `own.id` is in the states list and `template.id` is in the templates
  list. Otherwise it subtracts 0. The clamp is unchanged and still comes after
  the subtraction. The header comment and the doc comments are updated. Exports
  are unchanged.
- **`question-bank/data/questions/us-states.json`**: regenerated with
  `bun run ./src/write-questions.ts`. Only the six `level` values changed.
- **`backend/app/data/content.json`**: regenerated with
  `make -C backend content`. Only the same six `level` values changed.
- **`engineering-decisions.md`**: E-22 only.
  - The heading is renamed.
  - The formula line and the constant block now show the three keys.
  - The "Why `familiarity_bonus` is 0" bullet became "What
    `familiarity_bonus` covers".
  - New paragraph **2026-10-29 (T-085a)**: the amount, the states, the
    templates, Dkaattae's 2026-10-27 approval, the six-row before/after
    table, and a note that the range sentences still hold.
  - New paragraph: the largest-city input is not landed, and T-085b decides it.
  - "Revisit when" now names T-085 / T-085b for the largest-city input.
  - The last sentence of "What the reading found the formula cannot express"
    no longer says the term "stays 0".
  - The T-025 table and every other `E-n` are untouched.
- **`question-bank/src/seed-level-familiarity.test.ts`** (new, worker's own):
  - the reduction follows the entity id and the template id
  - templates outside the three get no reduction
  - the clamp at 2 / 1.5 / 2.5 before the reduction
  - in-place overrides to amount 0 and 3 move exactly the six questions

**Where each criterion lives**

| Criteria | Where |
|---|---|
| 1–3, 5, 12, 13 | `levelFor` in `seed-level.ts` (the `familiarity` const); the regenerated question file. I checked the diff against the before file: exactly the six ids move, by −2, and no field other than `level` changed. |
| 4 | `levelFor` compares `own.id`, which is the resolved `question.entityId`, and `template.id`. |
| 6 | `LEVEL_SEED_WEIGHTS` names only `us-state-hi` and `us-state-ak`, and no capital or city. |
| 7, 8 | Clamp `Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, raw))`, unchanged. The bank's levels run 3 to 10. |
| 9, 11 | `seedLevels` is unchanged. The export list is unchanged. |
| 10 | All three values are read from `LEVEL_SEED_WEIGHTS` at call time. To override the amount, set `LEVEL_SEED_WEIGHTS.familiarity_bonus`. |
| 14, 15 | Both regeneration commands were re-run on the final tree, and `git diff` was empty after the second run. |
| 16, 23, 25 | `git diff --quiet` over `data/us-states/`, all `package.json`, `bun.lock`, `pyproject.toml`, `uv.lock` and `openapi.yaml` passed. |
| 17–22 | E-22, as listed above. |
| 24 | The new test reads only the committed bank. |

**Decided, and who should confirm**

- **Shape: three flat keys, not a nested object.**
  - `familiarity_bonus` stays the numeric amount, so the T-025-era tests that
    treat it as a number keep working.
  - The two lists are top-level arrays. Every block line stays JSON-parseable
    for `hand-check-levels-verify` criterion 7, which still passes.
  - Cost: `seed-level.test.ts`'s E-22 rule joins array elements without
    quotes, so no string array can satisfy both it and the JSON block rule.
    It is listed as stale below.
  - T-085b's expander should rename or restructure these keys when a second
    input arrives.
- **The key name `familiarity_bonus` now means "the drawn-apart amount"**,
  which was fine while there is one input. Owner: T-085b's expander.

**Deliberately not done**

- No largest-city key or placeholder (criterion 6, Out of scope).
- No tuning of the amount.
- E-26, E-27 and the T-025 table are not touched, even though they quote the
  old HI/AK levels. That is "Rewriting history", which is out of scope.
- No existing test was touched.

**Contradictions with the brief:** none that block.

- The brief's Constraints said the constant-in-E-22 rule "may" go red for a
  nested shape. With string arrays it goes red for any shape (see above).
- The loose-ends criterion-6 test requires a bullet titled "Why
  `familiarity_bonus` is 0", and this brief's criterion 20 forbids that
  sentence. So it is stale by design.

**How to run**

- `cd question-bank && bun install --frozen-lockfile && bun test && bun run typecheck && bun run lint`
  - Without `bun install`, the 11 T-066 lint tests fail on main too:
    `oxlint` is not found.
- `cd backend && uv run pytest -q && make lint`
- Regenerate: `cd question-bank && bun run ./src/write-questions.ts`, then `make -C backend content`.

**Suite results on the final tree**

- **question-bank:** 2490 pass, 25 fail (all listed below). Lint is clean.
  Typecheck fails with one error, in a stale test (listed below).
- **backend:** 736 pass, 3 fail (all listed below), 9 skipped. `make lint` is
  clean.
- **Before the change:** question-bank 0 fail, typecheck clean; backend 739
  pass.
- **frontend:** not changed. `bun install` is refused by the proxy
  (react-simple-maps tarball, 403), so the full frontend suite cannot load
  three map test files. Its reds are identical before and after this change.
  `bun test src/lib` (which reads `content.json`) passes, 96 of 96.

**Tests made stale** (all pre-existing; proposal per row)

| File | Test | Why stale | Proposal |
|---|---|---|---|
| `question-bank/src/seed-level.test.ts` | E-22 records the constant > one E-22 heading, and every key and numeric value of LEVEL_SEED_WEIGHTS in it | Criterion 21 needs the new string arrays in the block. The rule expects `key: [a, b]` unquoted, while the JSON block (and hand-check criterion 7) needs quotes. | Modify: compare arrays as `` `${key}: ${JSON.stringify(value).replace(/,/g, ", ")}` `` |
| `question-bank/src/seed-level-loose-ends-verify.test.ts` | T-086 criteria 5-6 > criterion 6: the 'Why familiarity_bonus is 0' bullet still explains it and keeps the term | Criterion 20 forbids that bullet | Delete, or re-point to the "What `familiarity_bonus` covers" bullet (home state, famous, approved list) |
| same | T-086 criteria 10-12 > criterion 10: the seeded levels by id, over all TEMPLATES, equal b0ee336's | Criterion 1 moves six levels | Re-pin `R_LEVELS_SHA` to the new bank |
| same | T-086 criteria 10-12 > criterion 10: LEVEL_SEED_WEIGHTS is deep-equal to b0ee336's | New amount and keys | Re-pin `R_WEIGHTS`. Its type is also the **typecheck error** at line 353 (TS2769: missing `familiarity_bonus_states`, `familiarity_bonus_templates`) |
| same | T-086 criteria 10-12 > criterion 12: engineering-decisions.md outside E-22's body is byte-identical to the branch head's | The heading line changed (criterion 20) | Re-pin `HEAD_OUTSIDE_E22_SHA` |
| same | T-086 criteria 10-12 > criterion 12: E-22's heading line is unchanged and no ## E-n heading up to E-23 is added or removed | Heading renamed (criterion 20) | Re-pin `BASE_E22_HEADING` to the new heading |
| `question-bank/src/hand-check-levels-verify.test.ts` | T-025 criteria 1-5 > criterion 4: the Final column equals seedLevels under the committed weights (within 0.05) | The T-025 table keeps the old HI/AK values (criterion 22) | Modify: exempt the four HI/AK map rows, or compare under `familiarity_bonus` 0 |
| same | T-025 criteria 6-9 > criterion 6: the 'which weights changed' list names exactly the changed keys… | `familiarity_bonus` 0 → 2 is a changed leaf against T-023 | Modify: exclude `familiarity_bonus`, since T-085a changed it, not T-025 |
| same | T-025 criteria 6-9 > criterion 6: the changed keys are exactly what the code changed (concept_load capital 1 -> 2 at hand-off) | Same | Same |
| same | T-025 criteria 10-13 > criterion 10: the key set of LEVEL_SEED_WEIGHTS and of concept_load equal the T-023 sets | Two keys added | Add the two keys |
| same | T-025 criteria 10-13 > criterion 12: familiarity_bonus is still 0 | Now 2 | Delete |
| same | T-025 criteria 10-13 > criterion 12: no famous / familiar / well-known list under src/ beyond what aa88101 had | The changed lines in `seed-level.ts` contain "familiarity" | Re-baseline to the new `seed-level.ts` lines |
| same | T-025 criteria 10-13 > criterion 12: seed-level.ts names no state | Criterion 6 requires `us-state-hi` / `us-state-ak` | Modify: allow exactly those two ids |
| same | T-025 criteria 14-17 > criterion 14: question-bank/data is unchanged since b0ee336, built_at aside | The question file regenerated | Re-pin |
| `question-bank/src/seed-level-verify.test.ts` | T-023 criteria 17-18 > criterion 18: familiarity_bonus is 0, and the stage takes no player input | Now 2 | Modify: keep the no-player-input half, drop the `toBe(0)` |
| `question-bank/src/climate-far-phrases-verify.test.ts` | T-090 criterion 12 > question file: every non-climate question deep-equal to 3279555 | HI/AK map levels moved | Re-pin |
| same | T-090 criterion 12 > content.json: every non-climate question deep-equal to b0ee336's | Same | Re-pin |
| same | T-090 criterion 13 > LEVEL_SEED_WEIGHTS deep-equal to 3279555, concept_load for climate still 3 | New amount and keys | Re-pin |
| same | T-090 criterion 14 > (a) the ten states' rows match the regenerated bank, with a verdict and a reason | E-27 table D quotes HI 9.5 and AK 8 as measured (out of scope to rewrite) | Modify: compare levels under `familiarity_bonus` 0, or exempt the HI/AK level cells |
| `question-bank/src/map-click-no-candidates-verify.test.ts` | T-092 criterion 4 > every non-map_click question, level included, hashes to 5d72ca5's | Four non-click levels moved | Re-pin |
| same | T-092 criterion 8 > (id, level) of the 50, in order, hash to 5d72ca5's | HI/AK click levels moved | Re-pin |
| same | T-092 criteria 11 and 12 > backend/app/data/content.json is byte-identical to 5d72ca5's | Regenerated (criterion 15) | Re-pin |
| same | T-092 criterion 13 > E-1..E-28 are byte-identical to 5d72ca5's, and there are 30 E-n headings at the branch head | E-22 amended (criteria 17–21) | Re-pin |
| same | T-092 criterion 16 > backend/app (except [ "backend/app/content_build.py" ]) is byte-identical to 5d72ca5 | `content.json` changed | Re-pin, or also except `content.json` |
| `question-bank/src/t026-tester-verify.test.ts` | T-026 criterion 4 > the old-template questions hash to main's 150 (45b00d7), field for field, in order | Four of the 150 moved | Re-pin |
| `backend/tests/test_t026_tester_criteria.py` | `test_c37_old_served_questions_are_byte_for_byte_main_s` | Served HI/AK map levels moved | Re-pin |
| `backend/tests/test_t051_tester_criteria.py` | `test_c1_the_questions_served_before_t051_are_still_served_unchanged` | Same | Re-pin |
| `backend/tests/test_t089_tester_criteria.py` | `test_criterion_13_e1_to_e27_are_byte_identical` | E-22 amended | Re-pin `DECISIONS_ON_MAIN` |

- **No count floors** are among these.
- **Checked and still passing:** `highest-point-metres-verify.test.ts` and
  `hand-check-levels-verify` criterion 7 (the constant block).

## Verdict

## Notes

- **Worker, 2026-10-29.** The Census check is the only part that needs the
  outside world, and the environment blocks exactly that. The brief anticipated
  this case and named the response, so I am stopping as it says. Worth adding
  to the queue's environment notes: the web harness's egress policy does not
  include `census.gov`. Any future task that cites a Census figure will hit the
  same wall. Proposed owner: Dkaattae, as a `process-tasks.md` entry or an
  allowlist change.
- The Sessions table shows the same session id for expander and worker. That is
  what `$CLAUDE_CODE_REMOTE_SESSION_ID` returned. The orchestrator relay may be
  sharing the id across spawned roles. Orchestrator to check, because the tester
  relies on that table to confirm it is a different session.

- **Task-expander, 2026-10-29 (split).** Dkaattae chose the worker's proposed
  split. This brief is now T-085a, drawn-apart only; the criteria were
  rewritten and renumbered (25 instead of 27), so `Approved:` is back to
  `pending`. The **Handoff** above is the worker's round-1 report on the unsplit
  brief; its Census block does not apply to T-085a, and the next worker
  replaces it. The largest-city half, its approved list, the Census blocker and
  the RI accepted-risk record are now `tasks.md` T-085b.

- **Worker, 2026-10-29 (T-085a).** Ran on Opus.
  - **Two test rules conflict for string arrays.** The two existing
    constant-in-E-22 rules cannot both hold once the constant has a string
    array. That was not foreseeable from the brief's "may turn it red". I kept
    the JSON form because `hand-check-levels-verify` criterion 7 parses the
    block as JSON and compares it to the constant. Tester and reviewer to
    confirm.
  - **The Revisit sentence keeps a bare "T-085".** `\bT-085\b` in the
    loose-ends criterion-5 test does not match "T-085b", so the sentence
    names T-085 and also T-085b. That keeps the test green.
  - **The shared session id.** The id `$CLAUDE_CODE_REMOTE_SESSION_ID`
    returned is again the same as every earlier row's. Orchestrator to check
    before the tester starts.

