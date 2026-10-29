# T-085a — Level input the weights cannot reach: Hawaii and Alaska are drawn apart from the mainland

**Status:** `pass`
**Next step:** `reviewer`
**Decision:** Dkaattae, 2026-10-29, given in the orchestrator's session, answering the worker's block: "split it — do T-085a now"
**Approved:** orchestrator — 2026-10-29, unattended run (T-085a, after the split). See `runs/T-085-level-familiarity-inputs.md`.
**Test changes:** `approved — Dkaattae, 2026-10-29`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-085 (now T-085a; the largest-city half is T-085b)
**Branch:** `claude/loving-knuth-umj4pp`
**PR:** #107, opened draft at expand time, built from the branch above

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P |
| worker | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P (same id as the expander's row: the environment variable gave this value; the tester should check its own differs) |
| task-expander (split into T-085a) | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P (same value again, from `$CLAUDE_CODE_REMOTE_SESSION_ID`; see the worker's Note on the shared id) |
| worker (T-085a) | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P (same value as every row above, from `$CLAUDE_CODE_REMOTE_SESSION_ID`; the tester must confirm its own id differs) |
| tester (T-085a) | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P (same value again. This run is orchestrated (`runs/T-085-level-familiarity-inputs.md` exists), and every orchestrated role shares one id, so the id check proves nothing either way. Independence rests on being a freshly spawned subagent with its own context, not on a separate session) |
| tester (T-085a, attended: applied the approved test change request) | 2026-10-29 | cse_011oDiJfZrCMMJkAPHVAy8tQ (differs from every row above) |

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

**TL;DR (attended tester, 2026-10-29): pass. Dkaattae approved all 30 rows
of the Test change request, 28 as raised plus two found while applying them
(rows 29 and 30). With those applied, the whole question-bank suite (2558 pass,
0 fail), its typecheck, lint and `format:check`, and the backend suite (742
pass, 9 skipped) with ruff check and format are green. Next: the reviewer.**

- **Independence: a separate session.** My
  `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJfZrCMMJkAPHVAy8tQ`, which
  differs from every earlier row. A person started me and was attending.
- **Approval.** The header reads `Test changes: approved — Dkaattae,
  2026-10-29`. Dkaattae's answers in this session, quoted:
  - rows 3, 4, 5, 6, 14, 16–18, 20–28: "Approve all 17"
  - rows 1, 11, 15: "Approve all 3"
  - rows 7–10, 12, 13, 19: "Approve all 7"
  - row 2: "Approve"
  - row 29: "Approve"
  - row 30: "Approve"
- **Two rows added while applying.** These were not in the request the
  orchestrated tester raised, so I put them to Dkaattae before applying them.
  - **Row 29.** Row 15's test also asserts the constant holds only number
    arrays, which the old `toBe(0)` hid.
  - **Row 30.** Rows 1, 15 and 29 change files whose digest T-025 criterion 17
    pins.
- **Applied exactly as approved.** Every re-pin is labelled `6a515e2`, the
  branch head it was recorded at (E-30). Its content equals the worker's
  `f97c283`. No test was deleted. No source file was touched. Prettier
  formatting was the only other change, in `hand-check-levels-verify.test.ts`.
- **The 25 criteria still hold.** The criteria tests
  (`familiarity-drawn-apart-verify.test.ts`,
  `test_t085a_tester_criteria.py`) pass inside the full runs above. The table
  below is unchanged.
- **Not run.**
  - **The frontend suite:** this task does not touch it, and `bun install` is
    refused by the proxy, as the worker reported.
  - **The Docker integration job.**

**Earlier verdict (orchestrated tester, same day), kept for the record:**

**TL;DR: every one of the 25 criteria holds, but the suite is red by design.
28 pre-existing tests (25 question-bank, 3 backend) and the question-bank
typecheck fail because of T-085a's own change. Verdict: `test changes
requested`. A person has to approve the Test change request below, in an
attended `tester` session, before this can pass.**

- **Independence: weaker than a separate session.** This run is orchestrated.
  My `$CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_011oDiJdDaFDaDrfHH2XNp8P`) is the
  same as the worker's, because every role the orchestrator spawns shares it.
  So the id check proves nothing. I am a freshly spawned agent with my own
  context: I did not see the work being done or the worker's reasoning. That
  rests on the orchestrator having spawned me correctly, which I cannot check
  myself.
- **The work is on the branch.** All four files the Handoff names
  (`seed-level.ts`, the question file, `content.json`, E-22) are changed in
  `f97c283` on `claude/loving-knuth-umj4pp`, along with the worker's
  `seed-level-familiarity.test.ts`.
- **Expected values come from the brief.** They come from the criteria and the
  brief's before table, and I checked them against `git show 5ae564a`. CI
  checks out shallow, so the before state is pinned as sha256 digests recorded
  at `5ae564a`, and each pin names that commit (E-30).

**Tests added**

- `question-bank/src/familiarity-drawn-apart-verify.test.ts`: 43 tests.
- `backend/tests/test_t085a_tester_criteria.py`: 3 tests, for criterion 15's
  "equals what `make -C backend content` writes". It uses
  `render_committed_inputs()`, the function `main()` writes.

| Criteria | Verdict | Evidence (test names in `describe › test`) |
|---|---|---|
| 1 | pass | "criterion 1: the six HI/AK map and climate questions are exactly 2 below before" |
| 2 | pass | "criterion 2: every HI/AK question on the other five templates keeps its before level" (10 ids, plus capital HI 8.5 and AK 8); "HI and AK have no question on any template outside the eight" |
| 3 | pass | "criterion 3: no question about the other 48 states differs…" (the amount-0 bank is first checked against the `5ae564a` digest) |
| 4 | pass | four synthetic tests: HI 4 vs other id 6 on `tpl-identify-on-map`; AK the same; capital, landmark and crop get no reduction; Hawaii's name or geometry under another id gets none |
| 5 | pass | "criterion 5: all 50 tpl-capital-of questions equal their level under amount 0" |
| 6 | pass | walks every key and value of `LEVEL_SEED_WEIGHTS`: the only state ids are HI and AK, no other entity id, no entity's capital, no key or value about a city, capital or largest |
| 7 | pass | synthetic `us-state-hi` on identify-on-map: pre 2 → 0; pre 1.5 → 0, and not `-0`; pre 2.5 → 0.5. Climate pre 3 → 1 |
| 8 | pass | all 415 levels are within 0 to 18 |
| 9 | pass | two calls deep-equal; the JSON of questions, entities and templates is unchanged after |
| 10 | pass | amount 0 gives the `5ae564a` level digest for all 415; amount 3 puts the six exactly 3 below before and moves nothing else; an emptied states list gives the before bank; a templates list of `["tpl-climate-of"]` moves only those two |
| 11 | pass | the runtime `Object.keys` are the four values; the source `export` declarations are exactly the six names; `levelFor` and `nearDistractorCount` are plain `function`s |
| 12 | pass | 409 questions unchanged over the bank, and the committed file restored at the six equals the before digest |
| 13 | pass | question file without `level`, `_source` and `count`, and content.json without `level` plus its `entities` and `_source`, all equal the `5ae564a` digests |
| 14 | pass | committed file `===` `renderQuestionFile(loadCommittedEntities())`, and it carries criteria 1 and 12's levels |
| 15 | pass | backend: `content.json` text `==` `render_committed_inputs()`; served levels equal the question file's; the six are served lowered. The bun test checks the same level match |
| 16 | pass | the 51 files under `data/us-states/`, `built_at` aside (E-30), equal the `5ae564a` digest, so no entity gained a field |
| 17 | pass | the `**2026-10-29 (T-085a)**` paragraph has `` `familiarity_bonus` is 2 ``, Hawaii, Alaska, the three template ids, and "approved by Dkaattae on 2026-10-27" |
| 18 | pass | both range sentences are present verbatim. Over the regenerated bank: the old 150 run 3.5 (CA and TX identify) to 10 (DE, ME, NH, RI, VT, WV capital); the new 265 run 3 (CA and TX farm animal) to 10 (state-animal or landmark only, WV among them) |
| 19 | pass | E-22's `` `gen:…` `` before/after rows are exactly the six, and each before and after value equals the brief's before and the bank's after |
| 20 | pass | "largest-city input is not landed" paragraph names T-085b; no "familiarity_bonus is/stays/: 0", no "0 for every question", no "Why … is 0", no "stays 0", no "whether it is set is T-085's question", and the heading has no "is 0" |
| 21 | pass | the constant block's keys are exactly `LEVEL_SEED_WEIGHTS`'s; numbers match as text, and arrays and objects match after `JSON.parse` |
| 22 | pass | the T-025 table (header and 30 rows) and the file outside E-22 both equal the `5ae564a` digests |
| 23 | pass | the three `package.json`, three `bun.lock`, `pyproject.toml` and `uv.lock` equal the `5ae564a` digests |
| 24 | pass | neither T-085a test file uses `fetch(`, `node:http`, `node:net`, `Bun.connect`, `WebSocket` or a SPARQL transport. Both read only the committed tree |
| 25 | pass | `openapi.yaml` equals the `5ae564a` digest |

**Mutations** (each reverted, and `diff` against the backup was empty
afterwards; every one turned at least one of my tests red)

| Mutation | Red tests |
|---|---|
| M1: drop the state condition in `levelFor` (all states lowered on the three templates) | 14, including criteria 3, 4, 7, 10, 12, 14 and 18 |
| M2: drop the template condition (HI/AK lowered on all templates) | 7: criteria 2, 4 (other templates), 5, 10, 12 and 14 |
| M3: hard-code `? 2` instead of `weights.familiarity_bonus` | 6: criteria 3, 5, 10 (amount 0, amount 3, template list) and 12 |
| M4: subtract after the clamp | 1: criterion 7, 1.5 → 0 |
| M5: add `us-state-co` to the states list | 8: criteria 3, 6, 10, 12, 14, 18 and 21 |
| M6: drop `tpl-climate-of` from the templates list | 6: criteria 1, 7 (climate), 10, 14, 19 and 21 |
| M7: amount 2 → 1.5 | 10: criteria 1, 4, 7, 10, 14, 19 and 21 |
| M8: `export function levelFor` | 2: both criterion 11 tests |
| D1: E-22 table AK climate after 6 → 6.5 | criterion 19 |
| D2: one `content.json` level 6 → 6.5 | bun criterion 15, plus 2 of the 3 backend tests |
| D3: add a `famous` field to `us-state-ri.json` | criterion 16 |
| D4: approval date 2026-10-27 → 2026-10-28 in E-22 | criterion 17 |
| D5: `familiarity_bonus: 0` in the constant block | criteria 20 and 21 |

**Whole suite on the branch head plus these two test files**

- **question-bank `bun test`:** 2533 pass, 25 fail. The 25 are exactly the
  question-bank rows of the Test change request below.
- **question-bank typecheck:** one error,
  `seed-level-loose-ends-verify.test.ts(353,40)` TS2769. The `R_WEIGHTS`
  literal lacks the two new keys; that is row 4.
- **question-bank lint and `format:check`:** clean.
- **backend `uv run pytest -q`:** 739 pass, 3 fail, 9 skipped. The 3 are rows
  26 to 28. `make lint` is clean.
- **frontend `bun test src/lib`** (reads `content.json`): 96 pass, 0 fail. The
  rest of the frontend was not run. This task does not touch it, and the worker
  reports that `bun install` is refused by the proxy.

**My check of the worker's Tests made stale list**

- **Same 28 tests, each confirmed red.** I re-ran each one and read its
  failure.
- **Each is red because of the brief's own change.** They pin the old amount
  or key set, the old six levels, the old E-22 heading (criterion 20 forces the
  rename: it ended "`familiarity_bonus` is 0"), the old bullet (criterion 20
  forbids it), or `content.json` and E-22 bytes (criteria 15 and 17–21).
- **None is red because the code is wrong.** None asserts something a T-085a
  criterion also requires.
- **None was missed.** Every red test in both suites is on the list.
- **No count floors** are involved.

**One judgement for the reviewer: row 1** (`seed-level.test.ts`'s
constant-in-E-22 rule).

- It is stale because the rule writes array elements without quotes. A string
  array can only meet it if E-22 also carries a second, unquoted copy of each
  list.
- That copy would serve only to satisfy the test, and it would break
  `hand-check-levels-verify` criterion 7's JSON parse if it were in the block.
- The proposed modify keeps the numeric case byte-identical
  (`rank_bucket_edges: [10, 20, 35]`) and pins string arrays exactly as hard.

## Test change request

All rows are raised by the tester on 2026-10-29. Every one is red on
`claude/loving-knuth-umj4pp` at `f97c283` plus the tester's commit, because of
T-085a's own change. **"Re-pin"** means: the same assertion over the same
content, with the pinned digest or literal re-recorded at the commit that
applies this request. The test name and the comment carry that commit's short
sha instead of the old one, plus "re-pinned T-085a (Test change request row
N)" (E-30). It asserts nothing less than before.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/seed-level.test.ts` › E-22 records the constant › "one E-22 heading, and every key and numeric value of LEVEL_SEED_WEIGHTS in it" | `47a6e28`, T-023: E-22 lists every key and value of the constant | Criterion 21 puts the two string arrays in the block as JSON (quoted), which `hand-check-levels-verify` criterion 7 also requires. This rule's `${key}: [${value.join(", ")}]` wants them unquoted | modify | Same name. The same assertions, except an array value must appear as `` `${key}: ${JSON.stringify(value).replaceAll(",", ", ")}` ``. Numeric arrays give the same text as before (`[10, 20, 35]`), and string arrays are matched quoted | | approved — Dkaattae, 2026-10-29 |
| 2 | `question-bank/src/seed-level-loose-ends-verify.test.ts` › T-086 criteria 5-6 › "criterion 6: the 'Why familiarity_bonus is 0' bullet still explains it and keeps the term" | `4009ee5`, T-086: the bullet explaining why the term is 0 survived T-086 | Criterion 20 forbids saying the term is 0 or that no list exists. The bullet is now "What `familiarity_bonus` covers" | modify | "criterion 6: the 'What familiarity_bonus covers' bullet explains its sources and keeps the term (T-085a)". Exactly one E-22 bullet matches ``/What `familiarity_bonus` covers/``, and its flattened text contains "home state", "famous", "serving time" and "approved" | | approved — Dkaattae, 2026-10-29 |
| 3 | same file › T-086 criteria 10-12: what must not move › "criterion 10: the seeded levels by id, over all TEMPLATES, equal b0ee336's" | `83aadd6`, T-070 re-pin: no level moved | Criterion 1 moves six levels | modify (re-pin) | `R_LEVELS_SHA` re-recorded at the applying commit, renamed to that sha | approved — Dkaattae, 2026-10-29 |
| 4 | same › "criterion 10: LEVEL_SEED_WEIGHTS is deep-equal to b0ee336's" | `83aadd6`, T-070 re-pin: no weight moved | Amount 0 → 2 and two keys added (criteria 1, 10). Its `R_WEIGHTS` literal is also the **typecheck error** at line 353 | modify (re-pin) | `R_WEIGHTS` becomes the current constant, with `familiarity_bonus: 2` and both new arrays, deep-equal, renamed to the applying commit | approved — Dkaattae, 2026-10-29 |
| 5 | same › "criterion 12: engineering-decisions.md outside E-22's body is byte-identical to the branch head's" | `4009ee5`, T-086: T-086 edited E-22's body only | The hashed "outside" includes E-22's heading line, which criterion 20 forces to change | modify (re-pin) | `HEAD_OUTSIDE_E22_SHA` re-recorded at the applying commit | approved — Dkaattae, 2026-10-29 |
| 6 | same › "criterion 12: E-22's heading line is unchanged and no ## E-n heading up to E-23 is added or removed" | `4009ee5`, T-086 | Heading renamed (criterion 20) | modify (re-pin) | `BASE_E22_HEADING` = the current heading, "…; `familiarity_bonus` lowers only the states drawn apart from the mainland". The heading-set half is unchanged | approved — Dkaattae, 2026-10-29 |
| 7 | `question-bank/src/hand-check-levels-verify.test.ts` › T-025 criteria 1-5 › "criterion 4: the Final column equals seedLevels under the committed weights (within 0.05)" | `236b0e0`, T-025: the 30-row table matches the code | Criterion 22 keeps the table, so the HI/AK map rows still read 6.5/6/7.5/7 | modify | "criterion 4: the Final column equals seedLevels under T-025's weights (the committed constant with familiarity_bonus overridden to 0 in place, T-085a), within 0.05". All 30 rows, as before; the override is restored after | | approved — Dkaattae, 2026-10-29 |
| 8 | same › T-025 criteria 6-9 › "criterion 6: the 'which weights changed' list names exactly the changed keys, each with old -> new and a reason" | `236b0e0`, T-025: the recorded weight change matches the code's diff from T-023 | `familiarity_bonus` and the two new keys now differ from T-023, through T-085a and not T-025 | modify | The same assertions, with the comparison made against the current constant minus `familiarity_bonus`, `familiarity_bonus_states` and `familiarity_bonus_templates` (named in a comment as T-085a's). So the changed set is still exactly `concept_load["tpl-capital-of"]` | approved — Dkaattae, 2026-10-29 |
| 9 | same › "criterion 6: the changed keys are exactly what the code changed (concept_load capital 1 -> 2 at hand-off)" | `236b0e0`, T-025 | Same as row 8 | modify | Same as row 8 | approved — Dkaattae, 2026-10-29 |
| 10 | same › T-025 criteria 10-13 › "criterion 10: the key set of LEVEL_SEED_WEIGHTS and of concept_load equal the T-023 sets" | `236b0e0`, T-025: no key added | Two keys added (criterion 10) | modify | "…equal the T-023 sets plus T-085a's familiarity_bonus_states and familiarity_bonus_templates". Exact set equality, as before | approved — Dkaattae, 2026-10-29 |
| 11 | same › "criterion 12: familiarity_bonus is still 0" | `236b0e0`, T-025: T-025 did not set the term | T-085a sets it to 2 (criterion 1) | modify | "criterion 12: familiarity_bonus is 2, set by T-085a" — `toBe(2)` | approved — Dkaattae, 2026-10-29 |
| 12 | same › "criterion 12: no famous / familiar / well-known list under src/ beyond what aa88101 had" | `236b0e0`, T-025: no familiarity list crept in | The changed `seed-level.ts` lines contain "familiarity", so they no longer match `BASELINE`'s three `seed-level.ts` lines | modify (re-pin) | `BASELINE`'s `seed-level.ts` lines become every match in the current `seed-level.ts`. The `curated/` lines are unchanged, as is the rule that any other new match is red | approved — Dkaattae, 2026-10-29 |
| 13 | same › "criterion 12: seed-level.ts names no state" | `236b0e0`, T-025 | Criterion 6 requires `us-state-hi` and `us-state-ak` in the constant | modify | "criterion 12: seed-level.ts names no state but us-state-hi and us-state-ak (T-085a)". The set of `/us-state-[a-z]{2}/` matches is exactly those two, and no state name appears quoted, as before | approved — Dkaattae, 2026-10-29 |
| 14 | same › T-025 criteria 14-17 › "criterion 14: question-bank/data is unchanged since b0ee336, built_at aside" | `83aadd6`, T-070 re-pin | The question file is regenerated (criteria 1, 14) | modify (re-pin) | The digest re-recorded at the applying commit | approved — Dkaattae, 2026-10-29 |
| 15 | `question-bank/src/seed-level-verify.test.ts` › T-023 criteria 17-18 › "criterion 18: familiarity_bonus is 0, and the stage takes no player input" | `8fd5b17`, T-023 | Now 2 (criterion 1) | modify | "criterion 18: familiarity_bonus is 2 (T-085a), and the stage takes no player input". `toBe(2)`, and the no-player-input half unchanged | | approved — Dkaattae, 2026-10-29 |
| 16 | `question-bank/src/climate-far-phrases-verify.test.ts` › T-090 criterion 12 › "question file: every non-climate question deep-equal to 3279555" | `2023a09`, T-090 | Four HI/AK map levels moved | modify (re-pin) | Re-recorded at the applying commit | | approved — Dkaattae, 2026-10-29 |
| 17 | same › "content.json: every non-climate question deep-equal to b0ee336's" | `83aadd6`, T-070 re-pin | Same, served | modify (re-pin) | Re-recorded at the applying commit | approved — Dkaattae, 2026-10-29 |
| 18 | same › T-090 criterion 13 › "LEVEL_SEED_WEIGHTS deep-equal to 3279555, concept_load for climate still 3" | `2023a09`, T-090 | Amount and keys changed | modify (re-pin) | The pinned constant becomes the current one; "concept_load for climate still 3" is kept | approved — Dkaattae, 2026-10-29 |
| 19 | same › T-090 criterion 14 › "(a) the ten states' rows match the regenerated bank, with a verdict and a reason" | `2023a09`, T-090: E-27 table D matches the bank | E-27 quotes HI 9.5 and AK 8 as measured, and rewriting it is out of scope | modify | "…match the bank under T-090's weights (familiarity_bonus overridden to 0 in place, T-085a)…". All ten rows, levels exact as before; the override is restored after | approved — Dkaattae, 2026-10-29 |
| 20 | `question-bank/src/map-click-no-candidates-verify.test.ts` › T-092 criterion 4 › "every non-map_click question, level included, hashes to 5d72ca5's" | `cf63f66`, T-092 | Four non-click levels moved | modify (re-pin) | Re-recorded at the applying commit | | approved — Dkaattae, 2026-10-29 |
| 21 | same › T-092 criterion 8 › "(id, level) of the 50, in order, hash to 5d72ca5's" | `cf63f66`, T-092 | The HI and AK click levels moved | modify (re-pin) | Re-recorded at the applying commit | approved — Dkaattae, 2026-10-29 |
| 22 | same › T-092 criteria 11 and 12 › "backend/app/data/content.json is byte-identical to 5d72ca5's" | `cf63f66`, T-092 | Regenerated (criterion 15) | modify (re-pin) | Re-recorded at the applying commit | approved — Dkaattae, 2026-10-29 |
| 23 | same › T-092 criterion 13 › "E-1..E-28 are byte-identical to 5d72ca5's, and there are 30 E-n headings at the branch head" | `cf63f66`, T-092 | E-22 amended (criteria 17–21) | modify (re-pin) | The E-1..E-28 digest re-recorded at the applying commit; the 30-heading half unchanged | approved — Dkaattae, 2026-10-29 |
| 24 | same › T-092 criterion 16 › "backend/app (except [ "backend/app/content_build.py" ]) is byte-identical to 5d72ca5" | `cf63f66`, T-092 | `content.json` regenerated | modify (re-pin) | The digest re-recorded at the applying commit, with the same exception list (no new exclusion, E-30) | approved — Dkaattae, 2026-10-29 |
| 25 | `question-bank/src/t026-tester-verify.test.ts` › T-026 criterion 4 › "the old-template questions hash to main's 150 (45b00d7), field for field, in order" | `d201e70`, T-026 | Four of the 150 moved | modify (re-pin) | Re-recorded at the applying commit | | approved — Dkaattae, 2026-10-29 |
| 26 | `backend/tests/test_t026_tester_criteria.py` › `test_c37_old_served_questions_are_byte_for_byte_main_s` | `d201e70`, T-026 | The served HI/AK map levels moved | modify (re-pin) | Re-recorded at the applying commit | | approved — Dkaattae, 2026-10-29 |
| 27 | `backend/tests/test_t051_tester_criteria.py` › `test_c1_the_questions_served_before_t051_are_still_served_unchanged` | `6537059`, T-051 | Same | modify (re-pin) | Re-recorded at the applying commit | | approved — Dkaattae, 2026-10-29 |
| 28 | `backend/tests/test_t089_tester_criteria.py` › `test_criterion_13_e1_to_e27_are_byte_identical` | `eebec2c`, T-089 | E-22 amended | modify (re-pin) | `DECISIONS_ON_MAIN` digest(s) re-recorded at the applying commit | | approved — Dkaattae, 2026-10-29 |
| 29 | `question-bank/src/seed-level-verify.test.ts` › T-023 criteria 17-18 › "criterion 18: familiarity_bonus is 2 (T-085a), and the stage takes no player input" (row 15's test) | `8fd5b17`, T-023: no entity list in the constant | Raised by the attended tester, 2026-10-29: the same test's walk asserts every array in the constant holds only numbers. The old `toBe(0)` failed first and hid it. T-085a criterion 6 requires the two string arrays | modify | Same name. The walk is unchanged for every key except `familiarity_bonus_states`, which must equal exactly `["us-state-hi", "us-state-ak"]`, and `familiarity_bonus_templates`, which must equal exactly the three template ids | approved — Dkaattae, 2026-10-29 |
| 30 | `question-bank/src/hand-check-levels-verify.test.ts` › T-025 criteria 14-17 › "criterion 17: every question-bank test file at aa88101 is present and unmodified" | `236b0e0`, T-025; last re-pinned `83aadd6`, T-070 W39 | Raised by the attended tester, 2026-10-29: rows 1, 15 and 29 modify two of its 48 files. Every earlier test change request re-pinned it the same way | modify (re-pin) | The digest re-recorded after rows 1, 15 and 29, same 48-file list | approved — Dkaattae, 2026-10-29 |

**To approve:**

- **Start the `tester` step for T-085a in a session you are attending.** Answer
  it there, row by row.
- **What that tester does.** It fills in Decision and sets
  `Test changes: approved — <name>, <date>`.
- **Then it applies exactly the approved rows** in a commit of their own, re-runs
  the whole suite and typecheck, and writes the final verdict.
- **No count floor is involved.**

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

