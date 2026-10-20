# T-026 — Templates for the topics the app has never shown (superlative, wildlife, landmark, climate, agriculture)

**Status:** `awaiting approval`
**Next step:** `worker` — once a human replaces `pending` below. Read "Calls this brief makes" first: approving the brief approves those calls
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-026
**Branch:** `claude/serene-ramanujan-msepc5`
**PR:** #91, opened draft at expand time against the branch above. Stays draft until the reviewer approves
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-20 | cse_019R9SRj6CMD4wWi2gd7WNAm (orchestrated; halted on Q1/Q2) |
| task-expander | 2026-10-20 | cse_019R9SRj6CMD4wWi2gd7WNAm (orchestrated; round 2, criteria written for Q1 (a) / Q2 No) |

The filename keeps its round-1 slug (`biggest-state-superlative`) so the branch, the PR and the run log still point at it. The task now covers every topic.

## TL;DR

- **Criteria are written for Dkaattae's answers.** Q1 (a): the superlative uses next-ranked total area and accepts the contested rows. Q2 No: this one task covers every topic in the T-026 table. That is **six new templates**, five new Setup topics, and one client change.
- **Approval also ratifies seven content calls** that the plan and queue only partly settle. They are listed under "Calls this brief makes", each tied to the criteria it shapes. The biggest are the agriculture distractor rule (C3) and the four landmark traps added by the expander (C4).
- **Sizing: this is L, not M.** It also breaks two older verify suites and the 200 KB bank cap, so the tester will raise Test change requests. **Plan to attend the tester step.**

## Questions for a human — answered

### Q1 — Which "biggest" can a child be marked wrong on? → **(a)**

Next-ranked distractors on `area_km2` (total area, water included), as plan §1.8's first rule says. The contested rows from round 1 are accepted. Examples: Michigan is 11th by total area but about 22nd by land, and Oklahoma vs Missouri is a 0.4% gap. Option (a) also mentioned a possible "counting lakes and coastal water" reveal line. **This brief does not add it:** it would be new child-facing prose, and the answer did not ask for it. It is listed under Out of scope.

### Q2 — Split T-026 one topic per task? → **No**

"This task covers all." The expander reads "all" as **every row of the T-026 table in `tasks.md`**: wildlife, landmark, climate, agriculture (crops), agriculture (farm animals), and size/superlative. See C1 for how the size/superlative row is read.

Verbatim answer, recorded by the orchestrator: "Q1, a. Q2, N, this task covers all." (Dkaattae, 2026-10-20.)

## Calls this brief makes — approving the brief approves these

Each call below is the expander's, made where the plan or queue left a gap. **Strike any you disagree with** and send the brief back to the `task-expander`. Do not edit the criteria in place.

| # | Call | Why | Criteria |
|---|---|---|---|
| **C1** | **"Which is bigger?" is served by the superlative multiple-choice template.** No `ab_compare` renderer, and no `size`-topic questions. | `ab_compare` is a new format with no renderer, which is a task of its own. The table row's "Needs" column says "a template and nothing else". | 1, 8–10, Out of scope |
| **C2** | **Every curated topic asks state → fact**, never fact → state. | `tasks.md` T-026 recommends this direction for wildlife, landmark, climate and agriculture, because the reverse has many right answers. It also means the client's state card does not give the answer away. Plan §1.2 lines 89–90 phrase climate and crops this way. | 13, 17, 22, 30 |
| **C3** | **Agriculture distractors must be "not grown or raised nearby".** For crops: no crop listed by the state itself, by a state it borders, or by a state in its region. For farm animals: any value the state does not list. The answer is the **first** value the state lists. | The queue settles farm animals ("pick distractors from values the state does *not* carry"). It says nothing for crops, and nearest-first would offer Michigan "corn", which Michigan grows. **Residual risk, accepted by approving:** a far-away crop the state also grows, e.g. sugar beets (WY) offered for Michigan. | 25–29, 32–33 |
| **C4** | **Four landmark traps added by the expander**, beyond the four pairs `tasks.md` lists. Great Smoky Mountains National Park is also in NC. Yellowstone is also in MT and ID. Hoover Dam is also in AZ. The Statue of Liberty is commonly placed in NJ. | Offered as a wrong answer in those states' questions, each would be a true answer marked wrong. This is the expander's own geography, **not** from a committed source. Confirm it. | 19 |
| **C5** | **Same-thing pairs in agriculture**: `cattle`/`dairy cows`, `corn`/`sweet corn`, `hay`/`alfalfa hay`, `potatoes`/`sweet potatoes`. They never share one question. | Dairy cows are cattle, and sweet corn is corn. Potatoes vs sweet potatoes are different plants, but a nine-year-old will not reliably tell them apart. Found by reading the committed values; not in the queue. | 31, 34 |
| **C6** | **The 200 KB cap on `question-bank/data/` may rise, to at most 400 KB**, recorded in a new `E-n`. | 265 new questions at about 600 bytes each take the folder from about 148 KB to about 310 KB. `tasks.md` T-026 already says "compact the file or raise the cap with an E-n". The cap is a T-010 tester assertion, so changing it needs an approved Test change request. | 39 |
| **C7** | **No new reveal prose, no displayed number.** The superlative reveal is the map highlight plus the existing fun fact. | Q1 (a)'s optional caveat line would be unreviewed child-facing text. | 37, Out of scope |

## Goal

Give the app every topic its curated data already supports, so a child can choose what to learn instead of choosing between maps and capitals. That is the area ranks plus the four curated fields (T-012 to T-015, T-068). It also gives every state at least four questions, which T-056 needs.

## Already true — do not rebuild

- **The data is on all 50 committed entities** (`question-bank/data/us-states/*.json`):
  - `area_km2` and `area_rank`, ranks 1–50 with no gaps;
  - `state_animal` 50/50;
  - `climate_kid` 50/50;
  - `top_crops` 50/50, one to three each;
  - `landmark` 44/50 (DE, IA, KS, MS, OK, RI blank on purpose);
  - `top_livestock` 24/50.
- **The curated strings count as reviewed text.** `question-bank/src/curated/us-states.ts` says so for `top_crops` and `top_livestock`, and the same table is the source of `state_animal`, `landmark` and `climate_kid`. No new review file is needed.
- **All ten `Topic` values exist** in `TOPICS` (`question-bank/src/templates.ts`) and `backend/app/models.py:50`. `openapi.yaml`'s session-start `topic` already accepts any `Topic` or `mixed`, so the contract needs no change.
- **Topic filtering works for any value.** See `selection.topic_matches` (`backend/app/selection.py:23`) and `store.candidate_questions` (`backend/app/store.py:249`).
- **`multiple_choice` is served and rendered.** It is in `SERVED_FORMATS` (`backend/app/content_build.py`) and has a card in `Session.tsx`.
- **The reveal highlights the answer's state** (`build_reveal`, `backend/app/grading.py:198`). With no `highlightGeometryId` it uses the entity's `geometryId`. It does so on every wrong answer, and on a correct one when the question's `reveal` is `map_highlight`. The correct-answer headline is the entity's reviewed `funFact`.
- **Same-text duplicates are already refused.** `buildChoices` (`question-bank/src/distractors.ts`) never offers two choices whose trimmed, lower-cased text matches. Every guard below is in addition to that.

## Acceptance criteria

**Frozen once approved.** "The new template for X" means the one `TEMPLATES` entry whose `TEMPLATE_TOPICS` value and `answer_field` are as stated in criterion 1. Counts are over `buildQuestionBank` (or whatever writes `question-bank/data/questions/us-states.json`) on the committed entities.

### All new templates

1. `TEMPLATES` gains **exactly six** entries, and the three existing ones are unchanged. Each new entry passes `validateTemplate`, has `format: "multiple_choice"`, has `applies_to` containing `state`, and has its own `TEMPLATE_TOPICS` entry, keyed `topic` / `answer_field` as follows:
   - superlative: `superlative` / `name`
   - wildlife: `wildlife` / `state_animal`
   - landmark: `landmark` / `landmark`
   - climate: `climate` / `climate_kid`
   - crops: `agriculture` / `top_crops`
   - farm animals: `agriculture` / `top_livestock`
2. The five curated templates' prompts each contain the token `{name}` exactly once and no other `{token}`. The superlative prompt contains no token at all.
3. Every new question has four distinct choices (trimmed, lower-cased) and `choices[correctIndex]` equals its `answer`.
4. The existing 150 generated questions are unchanged in the committed question file, field for field, including `id`, `choices`, `correctIndex`, `level` and `topic`. `count` equals the new total, which is **415**.
5. Every new question has a `level` in 0–18. `LEVEL_SEED_WEIGHTS.concept_load` has an entry for each of the six new template ids, and `engineering-decisions.md` E-22 lists each key with its value.
6. `validateTemplate` now refuses two templates that `generate()` patches silently today (carried from T-024, `tasks.md` T-026):
   - a `map_identify` template whose `requires` lacks `geometry_id`;
   - a template whose `answer_field` is `geometry_id` and whose `requires` lacks `name`.

   The three existing templates still pass.
7. When a template's `answer_field` holds an array of strings, the draft's `answer` is the array's **first** element, and that pair is not reported as `notText`. An empty array is still reported as `missing`. A number-valued answer field is still reported as `notText`.

### Superlative — Q1 (a)

8. The superlative template produces **exactly 47** questions, one for each state with `area_rank` 1–47. Delaware (48), Connecticut (49) and Rhode Island (50) are not answers.
9. For the state of rank *r*, the three wrong choices are **exactly** the states of rank *r*+1, *r*+2 and *r*+3, by `name`. The correct choice is the state of rank *r*.
10. Every superlative question has the same prompt. It asks which of the shown states is the biggest, and contains none of `km`, `area`, `rank`, `square`, `land`, `water`.

### Wildlife

11. The wildlife template produces **exactly 50** questions, one per state, and each answer is that state's `state_animal`.
12. No question's choices contain both members of any of these pairs (from `tasks.md` T-026), as answer or distractor:
    - "Black bear" / "American black bear";
    - "Grizzly bear" / "California grizzly bear";
    - "Gray squirrel" / "Eastern gray squirrel";
    - "Horse" / "Morgan horse";
    - "Desert bighorn sheep" / "Rocky Mountain bighorn sheep".
13. The prompt names the state and asks for its state animal. It is not "Which state…".

### Landmark

14. The landmark template produces **exactly 44** questions. The six states with no `landmark` (DE, IA, KS, MS, OK, RI) get none, and they appear in no landmark question.
15. Each answer is that state's `landmark`, and every distractor is another state's `landmark`.
16. "U.S. Space & Rocket Center" and "Space Center Houston" never appear in the same question.
17. The prompt names the state and asks which landmark is in it. It is not "Where is…".
18. From `tasks.md` T-026: "Mount Washington" is not a wrong choice in the Washington question, "St. Louis Cathedral" is not a wrong choice in the Missouri question, and "Chimney Rock" is not a wrong choice in the North Carolina or Colorado question.
19. **C4:** "Great Smoky Mountains National Park" is not a wrong choice in the North Carolina question, and "Yellowstone National Park" is not a wrong choice in the Montana or Idaho question. "Hoover Dam" is not a wrong choice in the Arizona question, and "Statue of Liberty" is not a wrong choice in the New Jersey question.

### Climate

20. The climate template produces **exactly 50** questions, and each answer is that state's `climate_kid`.
21. No distractor is the `climate_kid` of a state in the same same-climate group as the answer's state. The ten groups are those listed in `tasks.md` T-026, from T-014 criterion 17:
    - Great Plains: IA, NE, KS, SD, ND
    - Northern Rockies: MT, WY, ID
    - Interior Southwest: AZ, NM, UT, NV
    - Pacific Northwest: OR, WA
    - Southern New England: CT, MA, RI
    - Northern New England: NH, VT, ME
    - Mid-Atlantic: NJ, PA, MD, DE
    - Great Lakes / Upper Midwest: OH, IN, IL, MI, WI, MN
    - Deep South: AL, GA, MS, SC, LA
    - Upland South: TN, AR, KY, NC, VA, WV

    The nine ungrouped states (AK, CA, CO, FL, HI, MO, NY, OK, TX) constrain nothing.
22. The prompt names the state and asks what its climate is like. It is not "Which state is…".
23. The group list lives in exactly one place in the pipeline source, and a test fails if it does not hold exactly those 41 states in those ten groups.

### Agriculture — crops (C3, C5)

24. The crops template produces **exactly 50** questions, one per state.
25. Each answer is the **first** entry of that state's `top_crops`.
26. No distractor is in the state's own `top_crops`, any of them.
27. No distractor is in the `top_crops` of any state listed in the answer state's `borders`.
28. No distractor is in the `top_crops` of any state with the same `region` as the answer state.
29. Every distractor is in some other state's `top_crops`. No crop is invented.
30. The prompt names the state and asks which crop it is known for growing, after plan §1.2 line 90.
31. No question's choices contain both "corn" and "sweet corn", both "hay" and "alfalfa hay", or both "potatoes" and "sweet potatoes".

### Agriculture — farm animals (C3, C5)

32. The farm-animal template produces **exactly 24** questions, one per state with a non-empty `top_livestock`. The 26 states with `[]` get none.
33. Each answer is the first entry of that state's `top_livestock`. No distractor is in that state's `top_livestock`, and every distractor is in some other state's `top_livestock`.
34. No question's choices contain both "cattle" and "dairy cows".

### Regeneration and the served bank

35. Running `cd question-bank && bun run ./src/write-questions.ts` and then `make -C backend content` on the committed tree changes nothing. Both drift tests pass.
36. `backend/app/data/content.json` serves every new question with `format: "multiple_choice"` and its template's topic. It serves all 265 new questions, and `map_click` questions are still withheld.
37. Every served superlative question has `reveal: "map_highlight"`. Every other served question keeps the `reveal` it has today, and the other five new templates get `"none"`, the `multiple_choice` default. No served question gains a prose field (`shortExplanation`, `detailExplanation` or any new key).
38. `GET /questions?topic=X` returns exactly that topic's generated questions for each of `superlative`, `wildlife`, `landmark`, `climate` and `agriculture`. For `agriculture` that is 74 (50 + 24).
39. **C6:** every file tracked under `question-bank/data/` totals under the cap in `committed-bank.test.ts`. That cap is either 200 KB, unchanged, or raised to a figure no higher than 400 KB with a new `E-n` entry saying why. Changing it is a test change and goes through a Test change request (D-14).

### The client

40. Before the child answers a **superlative** question, nothing on the screen names or highlights the answer's state except its choice button. No entity name and no map outline of the question's entity are shown.
41. After a superlative question is answered, right or wrong, the answer's state is highlighted on a US map.
42. On the other five new templates, the `multiple_choice` card shows the question's state, as the capital card does today.
43. The Setup screen offers one option per topic: `location`, `capital`, `superlative`, `wildlife`, `landmark`, `climate`, `agriculture`, plus `mixed`. Each option starts a session with that `topic`. `SessionTopic` (`frontend/src/lib/api/types.ts`) admits all eight.
44. No Setup label contains the word "both". With seven topics, "A bit of both" is untrue. The labels' wording is the worker's, and a person reviews it on the PR.
45. Setup offers no topic that has zero served questions. `size`, `physical` and `elevation` are absent.
46. In a session started with one of the five new topics, every question served **other than a review question** has that topic. Review questions (`selection.review_pool`) ignore topic today, by design.
47. Capital and map questions render as before. The existing `Session.tsx` and `screens` tests and the `e2e/` suite pass.

### Negative

48. No new dependency in any `package.json`, lockfile or `pyproject.toml`.
49. No test reaches the network, and none mocks `fetch`.
50. No entity file under `question-bank/data/us-states/`, no curated table entry in `question-bank/src/curated/us-states.ts`, and no SPARQL fixture changes.
51. The only new child-facing strings are the six prompts and the Setup labels. Every choice text is copied from an existing entity field.
52. `openapi.yaml` is unchanged, unless the backend's behaviour changed in a way it documents (E-14). Nothing in this brief requires such a change.

## Out of scope

- **`ab_compare`**: "Which state is bigger, X or Y?" in plan §1.2. It is a new format with no renderer; see C1.
- **`size`, `physical` and `elevation` topics.** Not in the T-026 table.
- **"Smallest" questions.** Plan §1.8 says to skip "least".
- **Population as an axis, and scope variants by region.**
- **A land-area field.** That was Q1 (c), not chosen.
- **Any reveal caveat** such as "counting lakes and coastal water", and **any displayed area number**. See C7.
- **Reverse-direction questions** ("Which state has the climate…", "Which state grows…", "Where is \<landmark\>?"). See C2.
- **The brace guard for free-text prompt tokens** (`tasks.md` T-026, "Since T-021"). Criterion 2 puts only `{name}` in prompts, so no free-text field reaches a prompt.
- **The answer on the wire.** `GET /questions` returns `correctIndex` (T-053), and a superlative question's served `entity` names its answer. Both belong to T-053.
- **Level tuning beyond the six `concept_load` entries.** That is T-050 and T-085. `nearDistractorCount` measures geographic nearness, which means little for size or crops. Note it in the Handoff; do not fix it.
- **Review-question topic filtering** and **mastery semantics.** Both unchanged.
- **`map_click` / T-051.**

## Constraints

- **Size: L.** Six templates, two pipeline guards with person-approved lists, a generator change, a backend reveal rule, and three client changes.
- **Files expected to change:**
  - `question-bank/src/templates.ts`, `distractors.ts`, `generate.ts` and `seed-level.ts`, plus new strategy names and their `tierOf` cases or an equivalent.
  - `question-bank/data/questions/us-states.json` and `backend/app/data/content.json`, regenerated by their two commands, never hand-edited.
  - `backend/app/content_build.py`, for the superlative reveal.
  - `frontend/src/components/Session.tsx`, `screens.tsx` and `frontend/src/lib/api/types.ts`.
  - `engineering-decisions.md`: E-22, plus the next unused `E-n` for the distractor rules, and for the cap if it moves.
  - New tests.
- **Every person-approved list goes into the code verbatim**, with a comment pointing at this brief's criterion number: the five wildlife pairs, the landmark traps, the ten climate groups, and the four agriculture pairs. The worker adds no entry and removes none. A list that seems wrong is reported in the Handoff, not fixed.
- **Expected red, by design.** List these under **Tests made stale** and leave them red; the tester raises the Test change requests (D-14, D-15):
  - `hand-check-levels-verify.test.ts` assumes exactly three templates and pins `LEVEL_SEED_WEIGHTS`, both committed files and `TEMPLATES`;
  - `seed-level-loose-ends-verify.test.ts` criterion 10 pins the 150 seeded levels;
  - `committed-bank.test.ts`'s 200 KB cap, if C6 is used;
  - any other older verify suite that counts templates or questions.
- **Plan to attend the tester step.**
- **Content rules (`CLAUDE.md`).** Prefer a dropped question to a doubtful one. If a guard leaves a pool short, the question is skipped and reported, and the count criteria above then fail. That failure is the signal to come back through the expander, not to loosen a guard.
- **Packages and network.** `bun` and `uv` only, no dependency without asking, and no network in tests.

## Context

Required reading:

- **Plan:** `geoquizdataplan.md`
  - §1.2: the template table, lines 80–104 (climate and crop phrasings at 89–90, "Which is the {est}…" → MC + reveal on map), and "Distractors matter more than the question";
  - §1.4: level;
  - §1.8: superlatives (next-ranked, skip "least", always reveal on the map).
- **Queue:** `tasks.md` T-026, every "Since T-0xx" note and the per-topic paragraphs, which hold the pair and group lists quoted above. Also T-056 and T-053.
- **Decisions:** `engineering-decisions.md` E-20 (draft shape), E-21 (distractors), E-22 (level weights), E-23 (topic by template id), E-24 (committed question file, two regeneration commands, `SERVED_FORMATS`).
- **Pipeline:** `question-bank/src/templates.ts`, `generate.ts` (`draftFor`, the `notText` rule), `distractors.ts` (`tierOf`, `questionFor`), `seed-level.ts`, `tags.ts`, `question-file.ts`, `write-questions.ts`, `committed-bank.test.ts`, and `curated/us-states.ts` (the provenance notes).
- **Backend:** `backend/app/content_build.py` (`SERVED_FORMATS`, `REVEAL_BY_FORMAT`, `served_question`), `grading.py` `build_reveal`, `selection.py` (`topic_matches`, `review_pool`), `store.py` `candidate_questions`.
- **Frontend:** `frontend/src/components/Session.tsx` (the `multiple_choice` card, which shows `entity.name` and the outline), `screens.tsx` `Setup` (the three topic options), `frontend/src/lib/api/types.ts` `SessionTopic`.
- **End to end:** `e2e/tests/quiz.spec.ts`.

## Handoff

## Verdict

## Notes

- **Expected counts.** Superlative 47, wildlife 50, landmark 44, climate 50, crops 50, farm animals 24: **265 new**, 415 generated, 365 served (the 50 `map_click` withheld). The expander derived these from the committed entities. It did not run the pipeline.
- **Area precision.** `area_km2` for NJ (`22591.4`) and RI (`3144.245565`) carries Wikidata's odd precision. That is harmless here, because no criterion displays a number.
