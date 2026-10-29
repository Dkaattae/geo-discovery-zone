# T-085 — Level inputs the weights cannot reach: drawn apart, and capital is the largest city

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-085
**Branch:** `claude/loving-knuth-umj4pp`
**PR:** opened draft at expand time against the branch above (number in the PR list; see the Sessions row)
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P |

## Goal

Six served questions about Hawaii and Alaska, and the capital questions whose
answer is the state's largest city, are seeded harder than a child finds them,
because the level formula sees only rank and near-distractor count. Dkaattae
chose (2026-10-27) to fix this with the person-approved `familiarity_bonus`
list in `tasks.md` T-085, and accepted that it lowers Providence too. This task
lands that list, regenerates the bank, and writes it into E-22.

## Already true, and what remains

- **Already true.** The `familiarity_bonus` term exists in the formula and in
  `LEVEL_SEED_WEIGHTS` (`question-bank/src/seed-level.ts`, `levelFor`), at a
  single scalar `0` subtracted from every question. The clamp to 0–18 exists.
  `levelFor` and `nearDistractorCount` are already unexported (E-22, T-086).
  `ageBand` comes from the template's `min_age_band` (`tags.ts`), not from the
  level, so it does not move.
- **Baseline levels in the committed bank at the start of this task**
  (`question-bank/data/questions/us-states.json`, read by the expander):
  HI identify 6.5, click 7.5, climate 9.5; AK identify 6, click 7, climate 8.
  Capital questions of the 17 listed states: AZ 6.5, AR 8.5, CO 7.5, GA 6.5,
  HI 8.5, ID 9, IN 8, IA 8.5, MA 8, MS 8.5, OH 6.5, OK 8, RI 10, TN 8, UT 8,
  WV 10, WY 8.5.
- **Remains.** The per-entry bonus, the source check of the 17 capitals, both
  committed files regenerated, and E-22 amended.

## Acceptance criteria

"The bank" below means `seedLevels` applied to the committed entities in
`question-bank/data/us-states/` with the default templates, which is what
`question-bank/data/questions/us-states.json` is generated from. "Before" means
the levels on `main` at `5ae564a`.

**Drawn apart from the mainland**

1. In the bank, each of these six questions has a level exactly 2 lower than
   before: `gen:tpl-identify-on-map:us-state-hi` 4.5,
   `gen:tpl-click-the-map:us-state-hi` 5.5, `gen:tpl-climate-of:us-state-hi`
   7.5, `gen:tpl-identify-on-map:us-state-ak` 4,
   `gen:tpl-click-the-map:us-state-ak` 5, `gen:tpl-climate-of:us-state-ak` 6.
2. No other template's question about Hawaii or Alaska changes level because
   of the drawn-apart input: in particular `gen:tpl-capital-of:us-state-ak`
   stays 8, and every HI and AK question outside the three templates in
   criterion 1 has its before level, except `gen:tpl-capital-of:us-state-hi`
   (criterion 4).
3. No state other than Hawaii and Alaska gets the drawn-apart reduction on any
   template.

**Capital is the state's largest city**

4. In the bank, the `tpl-capital-of` question of every state on the confirmed
   list (criterion 8) has a level exactly 1 lower than before, and the
   `tpl-capital-of` question of every other state has its before level. If all
   17 are confirmed, that is: AZ 5.5, AR 7.5, CO 6.5, GA 5.5, HI 7.5, ID 8,
   IN 7, IA 7.5, MA 7, MS 7.5, OH 5.5, OK 7, RI 9, TN 7, UT 7, WV 9, WY 7.5.
5. The largest-city reduction applies only to `tpl-capital-of`: no question of
   any other template changes level because of it.
6. The confirmed list is a subset of the 17 approved states (AZ, AR, CO, GA,
   HI, ID, IN, IA, MA, MS, OH, OK, RI, TN, UT, WV, WY). No state outside the 17
   gets the reduction, even one whose capital is in fact its largest city.

**The source check** (the queue entry: "Check all 17 against current Census
city populations before they ship, and leave out any the source does not
confirm")

7. E-22 names one U.S. Census Bureau release, with its year or vintage, as the
   source of every city population it records for this task.
8. For each of the 17 states, E-22 records the capital, its population, the
   state's largest city other than the capital, and that city's population,
   all from the release in criterion 7, and whether the state is **confirmed**
   (the capital's population is strictly greater) or **left out**. A state is
   on the confirmed list exactly when its row says confirmed, and the set of
   states that get the reduction in the bank (criterion 4) equals the set E-22
   marks confirmed.
9. Every state E-22 marks left out names why (a larger other city, or the
   release did not give a figure), and its capital question keeps its before
   level.

**Everything else holds still**

10. Every question in the bank other than the six of criterion 1 and the
    capital questions of the confirmed states has exactly its before level.
    No question's fields other than `level` change.
11. The clamp still holds with the new inputs: `seedLevels` on a synthetic
    input where the drawn-apart reduction would take a raw level below 0
    returns 0 for that question, not a negative number; and no level in the
    bank is below 0 or above 18.
12. `seedLevels` is still pure and deterministic: called twice on the same
    inputs it returns deep-equal results, and it mutates neither its
    `questions`, `entities` nor `templates` arguments.
13. Every amount and every state id the new inputs use is reachable from
    `LEVEL_SEED_WEIGHTS`, so the levels change when, and only when, that
    constant changes. Overriding the constant in place (as T-025 did) to a
    reduction of 0 for both inputs gives back exactly the before levels for
    all 415 questions.
14. `question-bank/src/seed-level.ts` exports exactly what it exports now:
    `seedLevels`, `LEVEL_SEED_WEIGHTS`, `LEVEL_MIN`, `LEVEL_MAX`,
    `LevelSeedWeights`, `LeveledQuestion`. `levelFor` and
    `nearDistractorCount` stay unexported.

**The committed files**

15. `question-bank/data/questions/us-states.json` equals what
    `cd question-bank && bun run ./src/write-questions.ts` writes from the
    committed tree (byte-identical), and carries the levels of criteria 1, 4
    and 10.
16. `backend/app/data/content.json` equals what `make -C backend content`
    writes from the committed tree, and each served question's `level` equals
    the same question's level in the question file.
17. No file under `question-bank/data/us-states/` changes. No entity gains a
    field.

**E-22**

18. E-22 (`engineering-decisions.md`) has a new dated paragraph,
    `2026-10-29 (T-085)` or the date it lands, that states both inputs: the
    drawn-apart reduction (amount, the two states, the three templates) and the
    largest-city reduction (amount, `tpl-capital-of`, the confirmed states),
    and that the list was approved by Dkaattae on 2026-10-27.
19. E-22 records the accepted risk: the largest-city input lowers Rhode
    Island's capital question from 10 to 9, which T-025 had read as
    `about right`, and Dkaattae accepted that on 2026-10-27. (If RI is left out
    under criterion 9, E-22 says so instead.)
20. E-22 has a table of every question whose level changed, one row each, with
    its id, the before level and the after level, and those values equal the
    bank's.
21. No sentence or heading in E-22 still says `familiarity_bonus` is 0 for
    every question, that it is 0 because no reviewed list exists, or that
    whether it is set is T-085's question.
22. E-22's statements about the range of levels over the committed bank (the
    "150 levels run from … to …" and "265 new levels run from … to …"
    sentences, and the states named at each end) are true of the regenerated
    bank, or carry a dated note giving the new range and states.
23. Every key and numeric leaf of `LEVEL_SEED_WEIGHTS` appears in E-22's
    "constant, as the code spells it" block with its value (the existing rule
    in `seed-level.test.ts`, "one E-22 heading, and every key and numeric
    value of LEVEL_SEED_WEIGHTS in it").
24. E-22's T-025 hand-check table (the 30 rows under "T-025 hand-check of 30
    questions") is unchanged, as is every `E-n` entry other than E-22.

**Negative**

25. No new dependency: the three `package.json` files, `bun.lock` files,
    `backend/pyproject.toml` and `backend/uv.lock` are unchanged.
26. No test reaches the network.
27. `openapi.yaml` is unchanged.

## Out of scope

- **Tuning the amounts.** The queue says the amounts "are a first guess the
  task may tune". This brief pins the approved −2 and −1, because a criterion
  whose expected value the worker may choose is not a criterion. If the worker
  finds a reason to tune, it says so in Notes and the change comes back through
  the expander for a fresh approval.
- **Both reductions on one question.** Under the approved list no
  (state, template) pair gets both, so no criterion says how they combine. Do
  not add a test that pins stacking either way.
- **The fact-field option** (a new entity field "drawn apart", "capital is the
  largest city"). Not chosen. No entity schema change, no Wikidata query
  change, no `normalize.ts` change.
- **A player's home state** as a familiarity source. That is serving-time, not
  a seeded level (E-22).
- **The other `too hard` rows** of E-26 and E-27 (California's climate, NY and
  RI climate), and the climate distractor rules (T-091).
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
  clock, no randomness. The per-state membership is data the computation uses,
  so it lives there too.
- **The content rule bites on the 17 capitals.** "Prefer a blank field to a
  guessed one": a state whose capital the named Census release does not show
  as strictly the largest city is left out, not shipped from memory. **If the
  worker cannot reach any Census Bureau release** (the session has no network,
  or the proxy refuses it), it does not fill the table from general knowledge
  and does not leave all 17 out to get green: it sets `Status: blocked`,
  `Next step: human`, and says what it could not reach. The queue already flags
  TN (Memphis), WV (Huntington) and WY (Casper) as close calls.
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
- **Model:** this touches data correctness and a design with more than one
  defensible shape. Opus.

## Context

**Required reading for the worker and the tester.**

- `tasks.md` T-085 — the approved list, the option chosen, the accepted risk,
  and the test cost. The list there is the source of the 17 and of HI/AK.
- `engineering-decisions.md` **E-22** in full (the formula, the constant block,
  "Why `familiarity_bonus` is 0", "What the module exports", the T-025
  hand-check table and "What the reading found the formula cannot express").
- `engineering-decisions.md` **E-26** table D and **E-27** table D, for the
  `tpl-climate-of` HI and AK rows that make six served rows, not four.
- `engineering-decisions.md` **E-24** — the question file and `content.json`
  are committed and regenerated by hand.
- `geoquizdataplan.md` **§1.4** — the level formula, "very famous" entities as
  a familiarity source, and Elo later.
- `question-bank/src/seed-level.ts` — `LEVEL_SEED_WEIGHTS`, `levelFor`,
  `seedLevels`.
- `question-bank/src/question-file.ts:44` — where `seedLevels` runs in the
  pipeline; `question-bank/src/write-questions.ts`.
- `backend/app/content_build.py`, `backend/Makefile` target `content`.
- The tests named under Constraints, to know what will go red and why.
- `test-guidelines.md` — call `seedLevels` directly; no seam needed, no
  network.
- `CLAUDE.md` "Content rules".

## Review checklist

The criteria above are testable for shape and consistency. A test cannot check
that a Census figure is right. A person checks:

- [ ] E-22's release is a real U.S. Census Bureau release, and for at least the
      three close calls (TN, WV, WY) the populations E-22 records match it.
- [ ] Every state E-22 marks confirmed really has its capital as its largest
      city in that release.

## Handoff

## Verdict

## Notes
