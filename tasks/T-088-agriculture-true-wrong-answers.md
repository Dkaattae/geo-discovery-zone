# T-088 — Wrong answers that are true: crops and farm animals a state does grow

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-088
**Branch:** `claude/epic-hopper-pav2ip`
**PR:** opened draft at expand time against the branch above (number in the PR list; see Sessions note)
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-29 | cse_011oDiJfrwMg1JqLUkLqFoYa |

**Worker model:** Opus. The task is data correctness in text a child reads.

**Plan to attend the tester step.** Regenerating the agriculture questions turns
several pinned guards red by design (Constraints, "Expected stale tests"), so a
Test change request is close to certain (D-14, D-15).

## Goal

The crop and farm-animal questions offer, as wrong answers, things the state
really does grow or raise. "Which farm animal is Texas known for?" with
"chickens" as a wrong choice teaches a child something false. This task makes
every agriculture question skip the items a person has approved as "also grown
/ raised" for that state. It also adds five farm animals to the pool so every
farm-animal question still has three wrong answers.

## Acceptance criteria

**Frozen once approved.** Two tables below are part of the criteria. They are
copied verbatim from `tasks.md` T-088 as approved by Dkaattae on 2026-10-27.
"Table A" and "Table B" in a criterion mean these tables. **Main** means commit
`a42b71b`, the default branch this task starts from. "The question file" is
`question-bank/data/questions/us-states.json`. "The served bank" is
`backend/app/data/content.json`. A "wrong answer" is any entry of `choices` other
than `choices[correctIndex]`.

**Table A: farm animals excluded as wrong answers** (on top of the state's own
`top_livestock`), by postal code:

| State | Excluded | State | Excluded | State | Excluded |
|---|---|---|---|---|---|
| AL | goats | AR | turkeys | AZ | dairy cows |
| CA | cattle, chickens, turkeys, sheep, goats, horses, ducks | CO | dairy cows, sheep, bison | DE | none |
| GA | goats | IA | cattle, chickens, turkeys, sheep, goats | ID | cattle, sheep |
| KS | pigs, bison | MD | none | MN | pigs, dairy cows, chickens, cattle, goats |
| MS | none | MT | sheep, bison | NC | chickens, goats |
| NE | pigs, bison | NY | goats | OK | pigs, chickens, goats, horses, bison |
| PA | chickens, pigs, turkeys, goats, horses, ducks | SD | pigs, turkeys, sheep, bison | TX | chickens, sheep, dairy cows, goats, horses |
| VT | none | WI | goats | WY | sheep, bison |

**Table B: crops excluded as wrong answers** (on top of T-026's own / bordering
/ same-region rule), by postal code:

| State | Excluded |
|---|---|
| AK | potatoes, barley, hay |
| AL | soybeans, corn, pecans, peaches |
| AR | cotton, corn, wheat, peanuts, sorghum |
| AZ | alfalfa hay, hay, wheat, pecans |
| CA | cherries, potatoes, apples, tomatoes, lettuce, rice, oranges, peaches, pears, cotton, alfalfa hay, hay, wheat, corn, sweet corn, sweet potatoes, blueberries, mushrooms, sugar beets, chile peppers, lima beans, sunflowers |
| CO | sunflowers, corn, wheat, hay, alfalfa hay, sugar beets, barley, sorghum |
| CT | apples, maple syrup, sweet corn |
| DE | corn, soybeans, sweet corn |
| FL | sugarcane, tomatoes, sweet corn, peanuts, blueberries, potatoes, cotton |
| GA | cotton, blueberries, corn, soybeans, tobacco, sweet corn |
| HI | none |
| IA | hay, alfalfa hay |
| ID | wheat, barley, sugar beets, alfalfa hay, hay |
| IL | wheat, sweet corn, hay |
| IN | wheat, tomatoes, hay |
| KS | corn, soybeans, sunflowers, hay, alfalfa hay |
| KY | soybeans, wheat, hay, alfalfa hay |
| LA | soybeans, cotton, sweet potatoes, corn, pecans |
| MA | apples, sweet corn |
| MD | wheat, sweet corn, barley, hay |
| ME | apples, maple syrup, hay |
| MI | corn, soybeans, sugar beets, potatoes, grapes, wheat, hay |
| MN | sugar beets, wheat, hay, alfalfa hay, sweet corn, potatoes |
| MO | cotton, rice, wheat, sorghum, hay |
| MS | corn, rice, sweet potatoes, peanuts |
| MT | hay, alfalfa hay, sugar beets, cherries |
| NC | corn, soybeans, cotton, peanuts, blueberries, strawberries, apples, wheat |
| ND | sugar beets, soybeans, corn, barley, potatoes, hay |
| NE | wheat, sorghum, hay, alfalfa hay, sugar beets |
| NH | sweet corn, hay |
| NJ | peaches, sweet corn, apples |
| NM | hay, alfalfa hay, cotton, sorghum, peanuts, corn |
| NV | hay, potatoes |
| NY | sweet corn, potatoes, corn, soybeans, hay |
| OH | wheat, tomatoes, hay, sweet corn |
| OK | cotton, sorghum, hay, alfalfa hay, peanuts, pecans, corn, soybeans |
| OR | wheat, barley, hay, alfalfa hay, potatoes, cherries, blueberries, grapes, apples |
| PA | corn, soybeans, hay, tobacco, sweet corn, peaches, grapes, potatoes |
| RI | apples |
| SC | soybeans, corn, peanuts, tobacco, sweet potatoes, wheat, pecans |
| SD | sorghum, wheat, sunflowers, hay, alfalfa hay |
| TN | corn, wheat, hay, tobacco, tomatoes |
| TX | corn, peaches, wheat, hay, rice, peanuts, pecans, oranges |
| UT | hay, wheat |
| VA | soybeans, corn, wheat, hay, apples, sweet potatoes, tomatoes, cotton |
| VT | hay, sweet corn, corn |
| WA | wheat, barley, alfalfa hay, hay, potatoes, pears, grapes, blueberries, sweet corn |
| WI | soybeans, potatoes, sweet corn, hay, alfalfa hay, cherries |
| WV | hay, corn |
| WY | alfalfa hay, barley, wheat, corn |

Text is compared the way `distractors.ts` already compares it: trimmed and
case-insensitive.

### The bank's shape does not change

1. The set of question `id`s in the question file is exactly the set on main:
   415 ids, of which 24 are `tpl-farm-animal-of` and 50 are `tpl-crop-of`.
2. Every question whose `templateId` is neither `tpl-crop-of` nor
   `tpl-farm-animal-of` is deep-equal to the question with the same `id` on
   main.
3. For every `tpl-crop-of` and `tpl-farm-animal-of` question, every field other
   than `choices` is deep-equal to main's. This covers `answer`,
   `correctIndex`, `level`, `prompt` and the tags.
4. Every agriculture question has exactly four `choices`, with distinct text,
   and `choices[correctIndex]` equals its `answer`.

### Farm animals

5. Every wrong answer in every `tpl-farm-animal-of` question is one of exactly
   these eleven: `chickens`, `cattle`, `dairy cows`, `pigs`, `turkeys`, `sheep`,
   `goats`, `horses`, `ducks`, `rabbits`, `bison`.
6. No wrong answer in a `tpl-farm-animal-of` question is in that state's own
   `top_livestock`.
7. No wrong answer in a `tpl-farm-animal-of` question is in that state's row of
   Table A. Rows that say `none` exclude nothing.
8. No `tpl-farm-animal-of` question has both `cattle` and `dairy cows` among its
   four choices, answer included.
9. Pennsylvania's farm-animal question's wrong answers are exactly
   `{sheep, rabbits, bison}` as a set. This is the boundary case: after
   criteria 6–8 exactly three animals remain.
10. California's farm-animal question's wrong answers are exactly
    `{pigs, rabbits, bison}` as a set. This is the same boundary.

### Crops

11. No wrong answer in a `tpl-crop-of` question is in that state's row of
    Table B. HI's `none` excludes nothing.
12. T-026's crop rules still hold for every `tpl-crop-of` question. No wrong
    answer is in the `top_crops` of the state itself, a state it borders, or a
    state in its region. No question has both members of `corn`/`sweet corn`,
    `hay`/`alfalfa hay` or `potatoes`/`sweet potatoes` among its choices.
13. Every wrong answer in every `tpl-crop-of` question is in some other state's
    `top_crops`. No crop is added to the pool.

### The rule lives in the pipeline, not in the committed file

14. `buildChoices` applies Tables A and B to whatever input it is given. On a
    synthetic bank where an item in a state's Table A or B row would otherwise
    be that question's nearest candidate, `buildChoices` does not offer it for
    that state. In the same input, the item is still offered to a state whose
    row does not list it.
15. An entity whose `id` is not of the form `us-state-<two letters>` gets no
    Table A or Table B exclusion. Its question can offer an item that some
    state's row lists.
16. The five added animals (`goats`, `horses`, `ducks`, `rabbits`, `bison`) are
    never a correct answer to any question. They are offered only as wrong
    answers, and no entity field gains them.
17. `buildChoices` is deterministic. Two calls on the same input give
    deep-equal output.

### Regeneration and serving

18. Rendering the committed entities through the question-file writer
    (`cd question-bank && bun run ./src/write-questions.ts`) reproduces the
    committed question file byte for byte.
19. `make -C backend content` reproduces the committed served bank byte for
    byte. Every agriculture question in the served bank has the same `choices`
    as the matching question in the question file.

### What must not change

20. No file under `question-bank/data/us-states/` changes, and neither does
    `question-bank/src/curated/us-states.ts`. The lists are distractor rules,
    not entity fields.
21. `openapi.yaml` and everything under `frontend/` are unchanged.
22. `LEVEL_SEED_WEIGHTS` is deep-equal to main's, and no question's `level`
    changes. Criterion 3 implies the second half; this criterion names the
    constant.
23. No dependency is added or changed. Every `package.json`, `bun.lock`,
    `pyproject.toml` and `uv.lock` is unchanged.
24. No test reaches the network. Any new test that needs the bank reads the
    committed files or builds a synthetic one in memory.
25. In `engineering-decisions.md`, only the E-25 section changes. No other
    `E-n` entry's text changes, and no new `E-n` entry is added.

### The record (E-25)

26. E-25 gains a dated amendment naming T-088. It says that each state has a
    person-approved "also grown / raised" exclusion list for crops and for farm
    animals, approved by Dkaattae on 2026-10-27. It gives the rule the lists
    follow: roughly a top-10 national producer, or widely known for the item.
27. The amendment says the lists were drafted from general knowledge, not from
    a committed source. It also says whether they have been checked against
    USDA NASS state rankings. Until a person has done that check, it says "not
    yet checked against USDA NASS".
28. The amendment names the five added farm animals and their approval
    (Dkaattae, 2026-10-27). It says they are never a correct answer to any
    question. It says, in one sentence, how they are ordered among the
    candidates relative to the six animals states list.
29. The amendment says `cattle` and `dairy cows` stay separate animals and the
    `AGRICULTURE_SAME_THING_PAIRS` rule still applies to them.
30. The amendment states how many of the 24 farm-animal questions offer at
    least one added animal, and how many questions offer each of the five. The
    numbers match the regenerated question file.
31. E-25's "Revisit when" clause no longer names C3's "not grown nearby" risk
    as open. It says the risk is now narrowed by the T-088 lists and names what
    would reopen it: a row found wrong against NASS, or a new crop or animal
    added to the pool.

The whole suite, typecheck, lint and format check pass in `question-bank/`,
`frontend/` and `backend/`. The only exceptions are tests a person has approved
changing through a Test change request.

## Out of scope

- **Changing any row of Table A or B**, or adding a crop or animal beyond the
  five. A row that looks wrong goes in the Handoff and comes back through the
  expander for approval. It is not fixed in place (E-25: "Changing one is a
  brief's decision, not a worker's").
- **Checking the rows against USDA NASS.** That is a person's job (Review
  checklist). The worker does not fetch anything.
- **The climate template** (T-091), Hawaii's and Alaska's caps (T-090), and
  any other strategy's ordering. No farthest-first for agriculture.
- **Levels.** `LEVEL_SEED_WEIGHTS`, E-22 and `seed-level.ts` are untouched.
  E-22's line "every choice is one of six farm animals" and the `concept_load`
  comment in `seed-level.ts` ("choices come from only six animals") go stale.
  They are **not** fixed here: E-22 and that constant are pinned by T-085a's
  guards. The reviewer queues the wording fix as a follow-on.
- **Making the lists an entity field** in `curated/us-states.ts`, the bank
  files or `openapi.yaml`.
- **T-085b** (capitals vs. largest cities), T-087 (refresh scripts) and T-095
  (refresh pins).
- **The farm-animal `concept_load`** (still 1), even though the pool is no
  longer six animals.

## Constraints

- **Files expected to change:**
  - `question-bank/src/distractors.ts`, for the lists and the rule.
    `templates.ts` may change only in the `livestock_not_raised` and
    `crops_not_grown_nearby` docstrings, to say what the rule is now.
  - `question-bank/data/questions/us-states.json` and
    `backend/app/data/content.json`, regenerated by the two commands in
    criteria 18–19 and never edited by hand.
  - `engineering-decisions.md`, E-25 only.
  - New test files.
- **Lists are copied verbatim** from this brief into source, each beside the
  T-088 criterion it serves. This follows the existing pattern for T-026's
  lists in `distractors.ts` (`LANDMARK_TRAPS`, `SAME_CLIMATE_GROUPS`). Keyed
  by postal code, the same way `postalCodeOf` already keys `LANDMARK_TRAPS`.
- **Pure stage stays pure.** `distractors.ts`'s header says it has no network,
  file, clock or randomness. That still holds.
- **Ordering of the added animals is the worker's call.** Criteria 9–10 pin
  the boundary states, and criterion 28 records the choice. Whatever the
  order, it is deterministic (criterion 17). It does not depend on input order
  beyond what `buildChoices` already depends on.
- **Dependencies:** none (`CLAUDE.md`, "Packages").
- **Existing tests are not the worker's to change** (D-14). Expect these to go
  red by design. The worker lists them under **Tests made stale** and leaves
  them for the tester's Test change request:
  - `question-bank/src/t026-tester-verify.test.ts` › criterion 33. It requires
    every farm-animal wrong answer to be some other state's `top_livestock`,
    and the five added animals are no state's.
  - Guards that pin the question file or `content.json` by digest:
    `familiarity-drawn-apart-verify.test.ts` (pinned at `5ae564a`),
    `climate-far-phrases-verify.test.ts` (non-climate questions pinned at
    `3279555`, and its `content.json` digest), `hand-check-levels-verify.test.ts`
    criterion 14 (`2edc3a19…`), and any backend tester-criteria file that
    hashes `content.json` (`test_t085a_tester_criteria.py`,
    `test_t040_tester_criteria.py`, `test_t026_tester_criteria.py`). A digest
    of a source file, `distractors.ts` included, goes red too.
  - This is a list of likely ones, not a complete one. The suite says which.
    E-30's rule applies: re-pin the moved values and name the commit. Never
    add an exclusion so the old pin still holds.
  - `bank-pins.ts` `BANK_DIGESTS` should **not** go red, because criterion 20
    leaves the entity files alone. If it does, something outside scope changed.

## Context

**Required reading** for the worker and the tester:

- `tasks.md` T-088 (until the sweep) is where the two tables come from, along
  with the history: T-026's C3 risk, PR #91's review, and the options (a)–(d).
- `engineering-decisions.md`:
  - **E-25** is the entry this task amends, and it records T-026's agriculture
    strategies.
  - **E-21** covers nearest-first tiers and the correct position as a hash of
    the id.
  - **E-22** explains why a list-valued choice always counts as "far", which is
    why levels do not move.
  - **E-30** is the re-pinning rule for content guards.
  - **E-24** says the generated questions are committed and regenerated by hand.
- `question-bank/src/distractors.ts`:
  - `exclusionFor` holds `crops_not_grown_nearby` and `livestock_not_raised`.
  - `nearestDistractors` builds candidates only from other entities' field
    values with a centroid. This is why the added animals need a source of
    their own.
  - `AGRICULTURE_SAME_THING_PAIRS`, `LANDMARK_TRAPS` and `postalCodeOf` show the
    pattern for keyed lists.
- `question-bank/src/templates.ts` holds `tpl-crop-of` and `tpl-farm-animal-of`,
  and the strategy docstrings at lines 138–153.
- `question-bank/src/seed-level.ts`:
  - `entitiesForChoice` is why an array-valued choice matches no entity.
  - `LEVEL_SEED_WEIGHTS` is the constant criterion 22 freezes.
- `question-bank/src/write-questions.ts` and `backend/app/content_build.py`
  (`make -C backend content`) are the two regeneration commands.
- `question-bank/src/curated/us-states.ts` has every state's `top_crops` and
  `top_livestock`. 24 states have `top_livestock`, exactly the 24 rows of
  Table A.
- `question-bank/src/t026-tester-verify.test.ts`, criteria 24–34, are the
  existing agriculture assertions this task extends.
- `test-guidelines.md` covers pure functions first and no network.
- The plan: `geoquizdataplan.md` §1.2 ("Distractors matter more than the
  question").

**Already true, so nothing to build:**

- Criteria 2–4's invariants (answer = first listed, `correctIndex` from the id
  hash) and criterion 12's T-026 rules hold today. The task must keep them.
- Criterion 22 holds as long as levels are untouched. Agriculture distractors
  always count as far (E-22), so changing them does not move a level.

## Review checklist — the human part

Tests can check the rule. Only a person can check whether the lists are true.

- [ ] **Every row of Tables A and B checked against USDA NASS state rankings**
      before merge (`tasks.md` T-088: "before it ships"). Record who checked,
      which NASS release, and any row found wrong. A wrong row comes back
      through the expander, and E-25's "not yet checked" sentence is updated to
      match (criterion 27).
- [ ] **Iowa and dairy cows.** PR #91's review named "Iowa is also offered
      'dairy cows'" as an example of the problem. Table A's IA row does not
      exclude dairy cows, so Iowa's question may still offer it. Confirm this
      is intended.
- [ ] **Read all 24 farm-animal questions and a sample of crop questions** in
      the regenerated file. Check that no wrong answer is something the state
      is known for, and that the added animals do not read as obvious
      give-aways.
- [ ] **The never-correct trade.** The five added animals are never a right
      answer (criterion 16). A child who notices "rabbits is never right" can
      rule it out. Criterion 30's counts show how often that happens. Decide
      whether it is acceptable at that level.

## Handoff

## Verdict

## Notes

- **Picked over T-085b**, which comes first in `tasks.md` but is blocked. It
  needs a person to choose a Census source (allow `*.census.gov`, supply 17
  rows by hand, or accept Wikidata P1082), and nobody has chosen. T-088's
  `Depends on` is "nothing" and its lists are approved.
- PA and CA were worked out by hand from Table A, the six state-listed animals,
  the five additions and the cattle/dairy-cows pair. Both come to exactly three
  wrong answers, which matches the queue entry's "PA and CA exactly three".
