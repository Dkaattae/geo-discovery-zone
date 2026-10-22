# T-026 — Templates for the topics the app has never shown (superlative, wildlife, landmark, climate, agriculture)

**Status:** `test changes requested`
**Next step:** `human` — approve or refuse the 92 rows under "Test change request", in the attended tester session
**Approved:** Dkaattae — 2026-10-20, in the orchestrator session ("approved"), C1–C7 included. See `runs/T-026-biggest-state-superlative.md`.
**Test changes:** `approved — the session owner, attending tester session cse_01P7XSFjPfgo7AvC666zdJD1, 2026-10-22`
**From:** [`tasks.md`](../tasks.md) T-026
**Branch:** `claude/serene-ramanujan-msepc5`
**PR:** #91, opened draft at expand time against the branch above. Stays draft until the reviewer approves
**Fault:** test changes are waiting for approval (92 rows: 78 question-bank, 9 backend, 5 e2e)

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-20 | cse_019R9SRj6CMD4wWi2gd7WNAm (orchestrated; halted on Q1/Q2) |
| task-expander | 2026-10-20 | cse_019R9SRj6CMD4wWi2gd7WNAm (orchestrated; round 2, criteria written for Q1 (a) / Q2 No) |
| worker | 2026-10-20 | cse_019R9SRj6CMD4wWi2gd7WNAm (orchestrated subagent; same remote session id as the expander, so the tester must run in a different one) |
| tester | 2026-10-22 | cse_01P7XSFjPfgo7AvC666zdJD1 (attended; a separate session from the expander and worker) |

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

**TL;DR.** All six templates are built: 265 new questions, 415 in all, with 365 served. Five new Setup topics are in, and superlatives reveal on the map. Every count in the criteria matches. **87 existing tests are red by design.** They are listed under "Tests made stale" and the tester raises the Test change requests. **Three content flags need Dkaattae.** The largest is that many crop and farm-animal wrong answers are things the state does grow or raise (C3's accepted risk, bigger than expected; new `tasks.md` T-088).

**This environment could not run everything.** The frontend's `bun install` gets 403s from its private npm mirror, so `react-simple-maps` and `us-atlas` are missing. That makes `screens.criteria.test.tsx` unloadable and the eslint gate tests slow out. Both failed the same way before this change. Docker builds the same lockfile, so the e2e suite was **not run**. The tester should run the frontend suite and e2e where those installs work.

### What changed, file by file

- **`question-bank/src/templates.ts`**
  - The six templates (`tpl-biggest-state`, `tpl-state-animal-of`, `tpl-landmark-in`, `tpl-climate-of`, `tpl-crop-of`, `tpl-farm-animal-of`) and their `TEMPLATE_TOPICS` entries.
  - Six new `DISTRACTOR_STRATEGIES` names.
  - `validateTemplate`'s two new refusals.
- **`question-bank/src/generate.ts`**
  - A list-valued answer field becomes its first entry (`firstOfTextList`).
  - The two silent `required.add` patches are gone, now that the validator refuses those templates.
- **`question-bank/src/distractors.ts`**
  - The person-approved lists, verbatim, each beside its criterion: `SAME_ANIMAL_PAIRS`, `SAME_LANDMARK_PAIRS`, `LANDMARK_TRAPS`, `SAME_CLIMATE_GROUPS`, `AGRICULTURE_SAME_THING_PAIRS`.
  - `choiceTextsOf`, which reads list fields.
  - `exclusionFor` and `pairsFor`, plus the new `tierOf` cases.
  - `nextRankedByArea` for the superlative.
  - `questionFor` is split into `nearestDistractors` and `nextRankedByArea`. The no-centroid report still applies to every strategy (E-21).
- **`question-bank/src/seed-level.ts`**: six `concept_load` entries.
- **`question-bank/data/questions/us-states.json`** and **`backend/app/data/content.json`**: regenerated by the two commands, not edited by hand.
- **`backend/app/content_build.py`**: `REVEAL_BY_TOPIC = {"superlative": "map_highlight"}`. Every other question keeps `REVEAL_BY_FORMAT`.
- **`frontend/src/lib/topics.ts`** (new): `SETUP_TOPICS`, the eight Setup options and their labels, and `choicePanel()`, the pure rule for what a `multiple_choice` card shows.
- **`frontend/src/components/screens.tsx`**: Setup maps over `SETUP_TOPICS`.
- **`frontend/src/components/Session.tsx`**: renders `choicePanel()`.
  - A superlative shows nothing before the answer, then a full US map with the answer lit.
  - Every other `multiple_choice` question shows the state card as before.
- **`frontend/src/lib/api/types.ts`**: `SessionTopic` admits all eight.
- **`engineering-decisions.md`**
  - E-22 gets the new constant line and a T-026 paragraph.
  - New **E-25** covers the strategies, the lists, list-valued answers, the validator, the reveal, and the cap proposal.
- **`tasks.md`**: new T-088 (see the flags below).
- **Tests added (mine):** `question-bank/src/t026-templates.test.ts` (24), `backend/tests/test_t026_topics.py` (9), `frontend/src/lib/topics.test.ts` (8).

### Where each criterion lives

| # | Where | Observed |
|---|---|---|
| 1–2 | `TEMPLATES` / `TEMPLATE_TOPICS` in `templates.ts` | 9 templates; the 3 old ones are untouched |
| 3 | `nearestDistractors` / `nextRankedByArea`, `distractors.ts` | holds over the bank (my test) |
| 4 | regenerated question file | the 150 old questions are deep-equal to the pre-change file; `count` is 415 |
| 5 | `LEVEL_SEED_WEIGHTS.concept_load`, E-22 | levels run 3 to 10 |
| 6 | `validateTemplate`, `templates.ts` | the 3 old templates pass |
| 7 | `firstOfTextList`, `generate.ts` | |
| 8–10 | `nextRankedByArea`; prompt "Which of these states is the biggest?" | 47 questions; DE, CT and RI are reported as short pools (found 1, 2, 0) |
| 11–13 | `state_animals_neighbours_first`; "What is the state animal of {name}?" | 50 |
| 14–19 | `landmarks_neighbours_first`, `LANDMARK_TRAPS`; "Which of these landmarks is in {name}?" | 44; the 6 blank states are skipped by `generate` |
| 20–23 | `climates_outside_group`, `SAME_CLIMATE_GROUPS`; "What kind of climate does {name} have?" | 50 |
| 24–31 | `crops_not_grown_nearby`; "Which crop is {name} known for growing?" | 50 |
| 32–34 | `livestock_not_raised`; "Which farm animal is {name} known for?" | 24 |
| 35 | the two commands; both drift tests pass | |
| 36–37 | `content_build.py` `REVEAL_BY_TOPIC` | 365 served, 265 new, no `map_click` |
| 38 | `selection.topic_matches` (unchanged) | 47 / 50 / 44 / 50 / 74 (`test_t026_topics.py`) |
| 39 | **red by design**: the folder is 310,595 bytes | proposal: cap 400 KB, recorded in E-25 |
| 40–42 | `choicePanel`, `frontend/src/lib/topics.ts`; rendered in `Session.tsx` | |
| 43–45 | `SETUP_TOPICS`, `SessionTopic` | labels: "Places on the map", "Capital cities", "Biggest states", "State animals", "Famous sights", "Weather and climate", "Farms and crops", "A bit of everything" |
| 46 | unchanged backend selection | |
| 47 | capital/map rendering unchanged | `screens` test and e2e **not runnable here** (see TL;DR) |
| 48–52 | no dependency, entity file, curated entry, fixture or `openapi.yaml` change | |

### Judgment calls, each with an owner

- **Climate distractors come farthest first, not nearest first.** No criterion sets the order. Nearest-first gave many questions two choices a child could not tell apart, from neighbours in different groups. For example, Alabama's phrase was offered beside Tennessee's "hot humid summers and mild winters, with occasional snow in the higher hills". Farthest-first is correct but easy and repetitive: Hawaii's and Alaska's phrases appear in most questions. Recorded in E-25. **Owner: Dkaattae at review.** Confirm it, or send it to the expander for a criterion.
- **Crop and farm-animal distractors stay nearest-first**, as C3's own reasoning implies. The residual risk C3 accepted is common. Examples: "sugar beets" for Minnesota and North Dakota, "wheat" for Washington, "sheep" for Texas. Full list in **`tasks.md` T-088**. **Owner: Dkaattae.** Decide before merge whether T-088 blocks this PR or follows it.
- **The concept_load values** (superlative 2, wildlife 2, landmark 2, climate 3, crops 2, farm animals 1; `base_difficulty` 2 for all) are first guesses. **Owner: T-050 / T-085.**
- **Setup labels** are mine (criterion 44). **Owner: the PR's human reviewer.**
- **"A bit of both" became "A bit of everything".** That breaks e2e tests that click "A bit of both" (listed below). **Owner: tester**, via a Test change request.
- **The landmark prompt says "landmarks", not "famous places".** `hand-check-levels-verify.test.ts` criterion 12 forbids new "famous" text under `src/`.

### Things that contradict the brief, or that it did not foresee

- **Criteria 44 and 47 conflict.** No label may say "both", yet the e2e suite must pass unchanged, and six e2e tests click "A bit of both". I followed 44 and listed the six as stale.
- **The stale list is much longer than the brief's Constraints suggest.** 78 question-bank tests and 9 backend tests are red, almost all count pins (150 / 100 / three templates). The brief named four suites.
- **`seed-level-verify.test.ts` criterion 20 is a timeout, not a dead weight.** It takes about 9.7 s against bun's 5 s default. With `--timeout 120000` it passes.
- **Nothing is skipped silently.** `write-questions.ts` reports "32 pairs skipped, 3 short distractor pools": 6 landmarks, 26 farm animals, and DE/CT/RI for the superlative.

### Not done, on purpose

- No `ab_compare`, no reverse-direction questions, and no reveal caveat text (C1, C2, C7).
- No fix to `nearDistractorCount` for list choices. Those always count as far (noted in E-22).
- No change to `committed-bank.test.ts` or any other existing test.

### How to run

```
cd question-bank && bun run ./src/write-questions.ts && make -C ../backend content   # no diff on the committed tree
cd question-bank && bun test && bun run typecheck && bun run lint && bun run format:check
make -C backend test && make -C backend lint format-check
cd frontend && bun test src/lib/topics.test.ts && bun run typecheck   # full suite needs a working install
cd e2e && bun run test                                                # not run here
```

Results here:
- **question-bank:** 2178 pass, 78 fail, all stale-listed. Lint, format and typecheck are clean.
- **backend:** 594 pass, 9 fail, all stale-listed. ruff is clean.
- **frontend:** the same failures as before this change. All are install-related: `react-simple-maps` is missing, and the eslint gate times out. `topics.test.ts` passes 8/8. Typecheck errors are only the pre-existing `UsMap.tsx` missing-module ones, and eslint is clean on the touched files.

### Tests made stale

Every one is red because of the count, template set or size this brief changes on purpose. For each I give the change that makes it stale and what to do.

**Size cap (criterion 39, C6):** modify the 200 KB figure to **400 KB**, citing E-25.
- `question-bank/src/committed-bank.test.ts`: "T-010 criterion 5 — the committed bank stays small > every file tracked under question-bank/data/ totals under 200 KB"
- `question-bank/src/climate-kid-verify.test.ts`: "T-014 tester, criterion 12 — the bank is built, not hand-edited > the tracked bank is still inside the 200 KB cap the Constraints name"
- `question-bank/src/landmarks-verify.test.ts`: "T-013 tester, criterion 13 — nothing unreviewed, live or new is committed > the tracked bank is still well inside the 200 KB cap"

**Three templates / 150 questions / 3 per entity (criteria 1, 4).** Modify each to scope its assertion to the three original template ids. Where that loses the test's point, re-pin it: 9 templates, 415 questions, 365 served, 32 skips, 3 short pools.
- `question-bank/src/distractors-verify.test.ts`:
  - "T-022 criterion 1: one question per draft over the committed bank > 150 questions, one per generate() draft, and no reports"
  - "T-022 criterion 5: every draft field carried unchanged > each question contains its draft deep-equal"
  - "T-022 criteria 6 and 7: tiers, nearest-first, same-text skip > every question's distractors are exactly the first three by the brief's rule". The T-022 rule does not describe the new strategies; scope it to the 3 original templates.
  - "T-022 criterion 14: correctIndex depends on the draft id only > same index over the bank, the bank reversed, and per-draft subsets"
  - "T-022 criterion 16: short pools are reported, not returned > 4 committed states as the whole input: every draft becomes a question". The superlative needs consecutive ranks.
  - "… > 3 committed states as the whole input: every draft reported with found 2, none a question"
  - "… > own centroid missing / null / NaN / Infinity / one number / three numbers / strings: its drafts are reported, others still built, no throw" (7 tests). They now report 8 drafts, not 3.
  - "T-022 criterion 22: TEMPLATES and DISTRACTOR_STRATEGIES unchanged in value > equal to the pre-T-022 values at load and after buildChoices runs". **Delete it, or re-pin it** to the 9 templates and 8 strategies.
- `question-bank/src/distractors.test.ts`:
  - "over the committed bank > criterion 1: 150 questions, one per draft, nothing reported"
  - "… > criteria 2-5: shape, correctIndex, distinct text, draft fields kept"
  - "… > criterion 7: neighbours_first tiers and order, both map templates"
  - "… > criterion 14: correctIndex depends on the draft id only"
  - "short pools and bad input > criterion 16: 4 states give questions; 3 states give reports only"
  - "short pools and bad input > criterion 16: missing or non-finite own centroid is reported, not thrown"
  - "short pools and bad input > criterion 22: strategy names unchanged"
- `question-bank/src/generate.test.ts`:
  - "over the committed bank > 150 drafts, nothing skipped, 50 per template and 3 per entity"
  - "over the committed bank > no code is a label, no brace survives, ids are unique" (expects 150)
  - "skipping > capital absent / null / empty / blank / empty array skips tpl-capital-of only, and reports it" (5 tests). Other templates' skips now appear too; scope them to `tpl-capital-of`.
  - "skipping > a non-string answer is reported, not stringified". The same scoping; check the case it builds against criterion 7.
- `question-bank/src/generate-verify.test.ts`:
  - "T-021 criterion 1: … > 50 committed entities in, 150 drafts and an empty skip report out"
  - "T-021 criterion 1: … > the template list defaults to TEMPLATES"
  - "T-021 criterion 2: … > each entity id appears on exactly 3 drafts, one from each template"
  - "T-021 criterion 12: … > all 150 ids in one output are distinct"
  - "T-021 criterion 12: … > the same pair gets the same id over a subset"
  - "T-021 criterion 12: … > the same pair gets the same id with entities and templates reversed"
  - "T-021 criterion 15: … > empty capital loses only the capital-of draft"
  - "T-021 criterion 15: … > a gap in one entity does not cost the other 50 anything"
  - "T-021 criterion 17: a non-string value never becomes text > answer_field top_crops = ['corn']: no draft, one report naming top_crops". **Criterion 7 reverses this: delete it, or flip it** to "answer is 'corn'".
  - "T-021 criterion 17: … > answer capital as an array: skipped, capital reported". **Criterion 7 reverses this too**: a string array is now the first entry.
  - "T-021 criterion 25: TEMPLATES unchanged > still the three T-020 records, every field, at load and after every call above". Re-pin, or scope it to the 3 ids.
- `question-bank/src/templates.test.ts`:
  - "TEMPLATES > holds the three templates of plan §4 step 2, with distinct ids"
  - "TEMPLATES > every template's required fields are present and non-empty in all 50 state files". `landmark` is blank for 6 states and `top_livestock` for 26.
- `question-bank/src/templates-verify.test.ts`:
  - "T-020 criterion 1: … > type check: a record of the nine fields is assignable to Template" (criterion 6)
  - "T-020 criterion 17: format is a QuestionFormat > map_identify accepted" (criterion 6). Its fixture needs `geometry_id` in `requires`.
  - "T-020 criterion 2: TEMPLATES holds exactly the three ids > three entries with the three named ids"
  - "T-020 criterion 21: every template applies to every committed state > 50 files, every required field present and non-empty". The blank landmarks and empty livestock lists are deliberate.
- `question-bank/src/tags.test.ts`:
  - "tagQuestions over the committed bank > 150 questions, ids in input order, all seven tags present"
  - "holes and bad input > a blank or missing region omits the key and keeps the other tags". Expects 3 per entity.
- `question-bank/src/tags-verify.test.ts`:
  - "T-024 criterion 2: … > committed bank"
  - "T-024 criterion 7: … > committed bank: all 150 are us"
  - "T-024 criterion 8: … > committed bank: all 150 are state"
  - "T-024 criterion 9: … > committed bank: equals the entity's region; CO is Mountain West"
  - "T-024 criterion 9: … > odd case and spacing are kept, not trimmed or slugged"
  - "T-024 criterion 10: topic by template > identify and click are location, capital-of is capital; 100 / 50"
  - "T-024 criterion 11: … > committed bank: 1 for all 150"
  - "T-024 criterion 14: committed bank matches backend enums > topic, scope, entityType, format in backend enums; ageBand, level, region in range"
  - "T-024 criterion 15: … > absent region / null region / empty region / whitespace region: no region key, other six present, no throw" (4 tests)
- `question-bank/src/question-file.test.ts`: "T-040 — what the file holds today > 150 questions: 50 per format, one per entity per template"
- `question-bank/src/seed-level.test.ts`: "seedLevels over the committed bank > 150 questions, same ids and order, level in 0-18, nothing else changed"
- `question-bank/src/seed-level-verify.test.ts`:
  - "T-023 criteria 1-4: output shape > criterion 1: 150 questions over the committed bank, same ids in the same order"
  - "T-023 criteria 17-18: concept_load and familiarity_bonus > criterion 18: with every rank equal, a question's level depends only on template and near count (no per-entity bonus)". The test's own `nearCount` finds no entity for a list-valued choice; teach it lists.
  - "T-023 criterion 20: every number in LEVEL_SEED_WEIGHTS is live > changing any one numeric value by +1 or -1 changes at least one level (reverted after each)". **A timeout only.** It passes with `--timeout 120000`; give the test a 30 s timeout.
  - "T-023 criteria 22-24: … > criterion 23: every TEMPLATES entry has exactly the nine Template keys". Pins `TEMPLATES.length === 3`.
- `question-bank/src/seed-level-loose-ends-verify.test.ts`: "T-086 criteria 10-12: what must not move > criterion 10: the 150 seeded levels by id equal 41811f9's" and "… > criterion 10: LEVEL_SEED_WEIGHTS is deep-equal to 41811f9's". Re-pin to this branch, or scope to the old 150 (those levels are unchanged).
- `question-bank/src/hand-check-levels-verify.test.ts` (T-025):
  - "criteria 1-5 … > criterion 1: exactly 30 rows, one per (10 states x 3 templates), no pair twice"
  - "criteria 6-9 … > criterion 8: the range sentence states the min and max of the 150 final levels, each end naming a state and template that reach it"
  - "criteria 10-13 … > criterion 10: the key set of LEVEL_SEED_WEIGHTS and of concept_load equal the T-023 sets"
  - "… > criterion 10a: under the T-023 weights set at runtime, the 150 levels by id equal aa88101's"
  - "… > criterion 11: TEMPLATES is deep-equal to aa88101's"
  - "… > criterion 13: all 150 final levels are finite and within 0-18"
  - "… > criterion 13 (c): every number is covered, and exactly missing_rank_bucket and concept_load_default are exempt"

  Scope each to the three T-025 templates, or re-pin it.
- `backend/tests/test_content_api.py`:
  - `test_content_version_counts_what_was_seeded` (100 → 365)
  - `test_pagination_walks_the_whole_set_once` (100; also its 30-page × 4 loop caps at 120 → raise the page count)
  - `test_a_bundle_carries_its_entities_and_questions` (100 → 365)
- `backend/tests/test_content_build.py`:
  - `test_version_counts_fifty_entities_and_a_hundred_questions` (→ 365)
  - `test_served_questions_are_the_files_non_map_click_questions`. 100 → 365, and `_all`'s `limit=200` truncates; page through.
- `backend/tests/test_t040_tester_criteria.py`:
  - `test_c6_version_counts_50_entities_and_100_questions` (→ 365)
  - `test_c11_served_ids_are_the_files_non_map_click_ids` (→ 365, plus its per-entity format/topic pairs)
  - `test_c22_every_wrong_answer_names_the_answer_and_highlights_the_state`. A 100-answer mixed session reaches 32 states, not ≥ 40, because each state now has 7 served questions. Lower the floor or scope it to the old topics.
  - `test_c32_one_new_decision_entry_names_the_three_choices`. Pins E-1..E-24 exactly; E-25 is required by this brief (criterion 39, Constraints). Allow numbers after 24.
- **e2e, criterion 44** ("A bit of both" → "A bit of everything"; not run here): in `e2e/tests/progress.spec.ts`, modify the label in "signing out and back in starts where the child left off", "the level a child reaches is remembered between sittings", "progress belongs to the profile, not the browser" and "the map fills in once a child has come back a second time" (two uses). In `e2e/tests/quiz.spec.ts`, do the same in "the summary counts places, never a percentage or a score".

## Verdict

**Not yet given — waiting on the Test change request below.** Everything else is verified.

- **Independence:** separate session (`cse_01P7XSFjPfgo7AvC666zdJD1`), not the expander's or worker's `cse_019R9…`. Attended by a person.
- **Tester tests (all green):**
  - `question-bank/src/t026-tester-verify.test.ts`: 50 tests, criteria 1–35, 39, 50, 51.
  - `backend/tests/test_t026_tester_criteria.py`: 15 tests, criteria 36, 37, 38, 46.
  - `frontend/src/lib/t026-tester.criteria.test.ts`: 8 tests, criteria 40–45 through `choicePanel` and `SETUP_TOPICS`.
  - `frontend/src/components/t026-setup.criteria.test.tsx`: the rendered Setup buttons (43–45). **Not run here**, because the frontend install 403s on its private mirror. CI's frontend job runs it.
- **Negative criteria 48, 50 and 52:** `git diff main` shows no change to any `package.json`, lockfile, `pyproject.toml`, entity file, curated table, fixture or `openapi.yaml`. Criterion 49: the new tests contain no `fetch`, URL or mock.
- **Mutation:** removing WA from `SAME_CLIMATE_GROUPS` turns criterion 23 red (reverted). The bank-reading tests are bound to the code through criterion 35, which re-renders the file and compares bytes.
- **Pre-change pins are recorded hashes, not git reads:** CI checks out shallow, and the T-081 guard forbids a revision in a test's git call. They are the old 150 generated questions, the old 100 served questions and the entity files, all from `main` at `45b00d7`.
- **The stale list is the worker's, checked:** 77 question-bank reds here, plus `seed-level-verify` criterion 20, which times out only on CI (78 there); 9 backend; 5 e2e. Each one is red only because of the template count, question count, cap, label or criterion 7. None is red because the code is wrong.

## Test change request

**Status: approved, 2026-10-22, every row and A1–A3, by the person attending the tester's session.** Their answers, verbatim: "Approve rows 1–3", "Approve rows 4–78", "Approve rows 79–87", "Approve rows 88–92"; then "Approve A1", "Approve A2", "Approve A3".

**S3** means: same name, same assertions, same numbers (150, 50 per template, 3 per entity), but the test runs over **only the three original templates** (`tpl-identify-on-map`, `tpl-capital-of`, `tpl-click-the-map`). Where it builds, it passes `TEMPLATES` filtered to those ids into `generate` / `buildChoices` / `seedLevels` / `tagQuestions`. Where it reads the committed file, it filters to those `templateId`s. The six new templates are pinned instead by `t026-tester-verify.test.ts` (counts 47/50/44/50/50/24, 415 in all, and the old 150 hashed against `main`).

**PFX** means: the old values stay pinned exactly as the *first* entries, and the test also pins the new total (9 templates, 8 strategies), so nothing can be dropped or reordered unseen.

| # | Test (file › describe › name) | Introduced | Why stale or wrong | Action | Becomes | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/committed-bank.test.ts` › T-010 criterion 5 — the committed bank stays small > every file tracked under question-bank/data/ totals under 200 KB | `78c5ce2` (file history starts here; the cap is T-010 criterion 5): kept the committed bank small | criterion 39 / C6: the bank is 310,595 bytes | modify | Same name with `400 KB`; asserts the total is under 400 × 1024 bytes (C6, E-25). | approved |
| 2 | `question-bank/src/climate-kid-verify.test.ts` › T-014 tester, criterion 12 — the bank is built, not hand-edited > the tracked bank is still inside the 200 KB cap the Constraints name | `78c5ce2`, T-014 tester criterion 12: the bank stays inside the cap | criterion 39 / C6: the bank is 310,595 bytes | modify | Same name with `400 KB`; asserts under 400 × 1024 bytes (C6, E-25). | approved |
| 3 | `question-bank/src/landmarks-verify.test.ts` › T-013 tester, criterion 13 — nothing unreviewed, live or new is committed > the tracked bank is still well inside the 200 KB cap | `78c5ce2`, T-013 tester criterion 13: the bank stays inside the cap | criterion 39 / C6: the bank is 310,595 bytes | modify | Same name with `400 KB`; asserts under 400 × 1024 bytes (C6, E-25). | approved |
| 4 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 1: one question per draft over the committed bank > 150 questions, one per generate() draft, and no reports | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 5 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 5: every draft field carried unchanged > each question contains its draft deep-equal | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 6 | `question-bank/src/distractors-verify.test.ts` › T-022 criteria 6 and 7: tiers, nearest-first, same-text skip > every question's distractors are exactly the first three by the brief's rule | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 7 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 14: correctIndex depends on the draft id only > same index over the bank, the bank reversed, and per-draft subsets | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 8 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 16: short pools are reported, not returned > 4 committed states as the whole input: every draft becomes a question | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 9 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 16: short pools are reported, not returned > 3 committed states as the whole input: every draft reported with found 2, none a question | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 10 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 16: short pools are reported, not returned > own centroid missing: its drafts are reported, others still built, no throw | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 11 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 16: short pools are reported, not returned > own centroid null: its drafts are reported, others still built, no throw | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 12 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 16: short pools are reported, not returned > own centroid NaN: its drafts are reported, others still built, no throw | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 13 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 16: short pools are reported, not returned > own centroid Infinity: its drafts are reported, others still built, no throw | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 14 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 16: short pools are reported, not returned > own centroid one number: its drafts are reported, others still built, no throw | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 15 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 16: short pools are reported, not returned > own centroid three numbers: its drafts are reported, others still built, no throw | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 16 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 16: short pools are reported, not returned > own centroid strings: its drafts are reported, others still built, no throw | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 17 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 22: TEMPLATES and DISTRACTOR_STRATEGIES unchanged in value > equal to the pre-T-022 values at load and after buildChoices runs | `7fd16bb`, T-022 tester: distractor strategies over the bank | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **PFX**: TEMPLATES' first three entries and DISTRACTOR_STRATEGIES' first two names stay deep-equal to the pre-T-022 values, at load and after buildChoices; also asserts exactly 9 templates and 8 strategies. | approved |
| 18 | `question-bank/src/distractors.test.ts` › over the committed bank > criterion 1: 150 questions, one per draft, nothing reported | `fc71d87`, T-022 worker: buildChoices | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 19 | `question-bank/src/distractors.test.ts` › over the committed bank > criteria 2-5: shape, correctIndex, distinct text, draft fields kept | `fc71d87`, T-022 worker: buildChoices | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 20 | `question-bank/src/distractors.test.ts` › over the committed bank > criterion 7: neighbours_first tiers and order, both map templates | `fc71d87`, T-022 worker: buildChoices | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 21 | `question-bank/src/distractors.test.ts` › over the committed bank > criterion 14: correctIndex depends on the draft id only | `fc71d87`, T-022 worker: buildChoices | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 22 | `question-bank/src/distractors.test.ts` › short pools and bad input > criterion 16: 4 states give questions; 3 states give reports only | `fc71d87`, T-022 worker: buildChoices | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 23 | `question-bank/src/distractors.test.ts` › short pools and bad input > criterion 16: missing or non-finite own centroid is reported, not thrown | `fc71d87`, T-022 worker: buildChoices | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 24 | `question-bank/src/distractors.test.ts` › short pools and bad input > criterion 22: strategy names unchanged | `fc71d87`, T-022 worker: buildChoices | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **PFX**: the first two names are `neighbours_first`, `sibling_capitals_same_region`, in that order; exactly 8 names in all. | approved |
| 25 | `question-bank/src/generate.test.ts` › over the committed bank > 150 drafts, nothing skipped, 50 per template and 3 per entity | `b0102e1`, T-021 worker: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 26 | `question-bank/src/generate.test.ts` › over the committed bank > no code is a label, no brace survives, ids are unique | `b0102e1`, T-021 worker: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 27 | `question-bank/src/generate.test.ts` › skipping > capital absent skips tpl-capital-of only, and reports it | `b0102e1`, T-021 worker: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 28 | `question-bank/src/generate.test.ts` › skipping > capital null skips tpl-capital-of only, and reports it | `b0102e1`, T-021 worker: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 29 | `question-bank/src/generate.test.ts` › skipping > capital empty skips tpl-capital-of only, and reports it | `b0102e1`, T-021 worker: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 30 | `question-bank/src/generate.test.ts` › skipping > capital blank skips tpl-capital-of only, and reports it | `b0102e1`, T-021 worker: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 31 | `question-bank/src/generate.test.ts` › skipping > capital empty array skips tpl-capital-of only, and reports it | `b0102e1`, T-021 worker: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 32 | `question-bank/src/generate.test.ts` › skipping > a non-string answer is reported, not stringified | `b0102e1`, T-021 worker: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 33 | `question-bank/src/generate-verify.test.ts` › T-021 criterion 1: committed bank gives exactly 150 drafts and no skips > 50 committed entities in, 150 drafts and an empty skip report out | `a6ed390`, T-021 tester: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 34 | `question-bank/src/generate-verify.test.ts` › T-021 criterion 1: committed bank gives exactly 150 drafts and no skips > the template list defaults to TEMPLATES | `a6ed390`, T-021 tester: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 35 | `question-bank/src/generate-verify.test.ts` › T-021 criterion 2: 50 drafts per template, 3 per entity, one per template > each entity id appears on exactly 3 drafts, one from each template | `a6ed390`, T-021 tester: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 36 | `question-bank/src/generate-verify.test.ts` › T-021 criterion 12: ids are unique and stable > all 150 ids in one output are distinct | `a6ed390`, T-021 tester: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 37 | `question-bank/src/generate-verify.test.ts` › T-021 criterion 12: ids are unique and stable > the same pair gets the same id over a subset | `a6ed390`, T-021 tester: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 38 | `question-bank/src/generate-verify.test.ts` › T-021 criterion 12: ids are unique and stable > the same pair gets the same id with entities and templates reversed | `a6ed390`, T-021 tester: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 39 | `question-bank/src/generate-verify.test.ts` › T-021 criterion 15: a skip is per pair, not per entity > empty capital loses only the capital-of draft | `a6ed390`, T-021 tester: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 40 | `question-bank/src/generate-verify.test.ts` › T-021 criterion 15: a skip is per pair, not per entity > a gap in one entity does not cost the other 50 anything | `a6ed390`, T-021 tester: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 41 | `question-bank/src/generate-verify.test.ts` › T-021 criterion 17: a non-string value never becomes text > answer_field top_crops = ['corn']: no draft, one report naming top_crops | `a6ed390`, T-021 tester: generate() | criterion 7 reverses it | modify | Criterion 7 reverses it. Becomes "answer_field top_crops = ['corn']: one draft, answer 'corn', no report". | approved |
| 42 | `question-bank/src/generate-verify.test.ts` › T-021 criterion 17: a non-string value never becomes text > answer capital as an array: skipped, capital reported | `a6ed390`, T-021 tester: generate() | criterion 7 reverses it | modify | Criterion 7 reverses it. Becomes "answer capital as a string array: the first entry, no report"; a non-string array element is still reported notText. | approved |
| 43 | `question-bank/src/generate-verify.test.ts` › T-021 criterion 25: TEMPLATES unchanged > still the three T-020 records, every field, at load and after every call above | `a6ed390`, T-021 tester: generate() | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **PFX**: the first three entries are still the three T-020 records, every field, at load and after every call; exactly 9 in all. | approved |
| 44 | `question-bank/src/templates.test.ts` › TEMPLATES > holds the three templates of plan §4 step 2, with distinct ids | `cec0bd4`, T-020 worker: template record and validator | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **PFX**: the first three are the three of plan §4 step 2 in order; all 9 ids distinct. | approved |
| 45 | `question-bank/src/templates.test.ts` › TEMPLATES > every template's required fields are present and non-empty in all 50 state files | `cec0bd4`, T-020 worker: template record and validator | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 46 | `question-bank/src/templates-verify.test.ts` › T-020 criterion 1: Template has exactly the nine plan §1.2 fields > type check: a record of the nine fields is assignable to Template | `99e36fb`, T-020 tester: template record and validator | criterion 6: new refusal | modify | Same name; its fixture's `requires` gains `geometry_id` (criterion 6 now refuses a map_identify without it). Assertions unchanged. | approved |
| 47 | `question-bank/src/templates-verify.test.ts` › T-020 criterion 2: TEMPLATES holds exactly the three ids > three entries with the three named ids | `99e36fb`, T-020 tester: template record and validator | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Becomes "T-020 criterion 2: TEMPLATES starts with the three ids": first three ids as pinned, exactly 9 entries, all distinct. | approved |
| 48 | `question-bank/src/templates-verify.test.ts` › T-020 criterion 17: format is a QuestionFormat > map_identify accepted | `99e36fb`, T-020 tester: template record and validator | criterion 6: new refusal | modify | Same name; fixture's `requires` gains `geometry_id` (criterion 6). Assertions unchanged. | approved |
| 49 | `question-bank/src/templates-verify.test.ts` › T-020 criterion 21: every template applies to every committed state > 50 files, every required field present and non-empty | `99e36fb`, T-020 tester: template record and validator | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 50 | `question-bank/src/tags.test.ts` › tagQuestions over the committed bank > 150 questions, ids in input order, all seven tags present | `033b6ec`, T-024 worker: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 51 | `question-bank/src/tags.test.ts` › holes and bad input > a blank or missing region omits the key and keeps the other tags | `033b6ec`, T-024 worker: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 52 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 2: 150 questions, all seven keys, none null/undefined > committed bank | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 53 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 7: scope is the entity's scope > committed bank: all 150 are us | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 54 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 8: entityType is the entity's type > committed bank: all 150 are state | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 55 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 9: region is the entity's region verbatim > committed bank: equals the entity's region; CO is Mountain West | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 56 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 9: region is the entity's region verbatim > odd case and spacing are kept, not trimmed or slugged | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 57 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 10: topic by template > identify and click are location, capital-of is capital; 100 / 50 | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 58 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 11: ageBand is the template's min_age_band > committed bank: 1 for all 150 | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 59 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 14: committed bank matches backend enums > topic, scope, entityType, format in backend enums; ageBand, level, region in range | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 60 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 15: a missing or blank region omits the key > absent region: no region key, other six present, no throw | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 61 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 15: a missing or blank region omits the key > null region: no region key, other six present, no throw | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 62 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 15: a missing or blank region omits the key > empty region: no region key, other six present, no throw | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 63 | `question-bank/src/tags-verify.test.ts` › T-024 criterion 15: a missing or blank region omits the key > whitespace region: no region key, other six present, no throw | `5588c60`, T-024 tester: tag stage | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 64 | `question-bank/src/question-file.test.ts` › T-040 — what the file holds today > 150 questions: 50 per format, one per entity per template | `25c7847`, T-040 worker: the committed question file | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 65 | `question-bank/src/seed-level.test.ts` › seedLevels over the committed bank > 150 questions, same ids and order, level in 0-18, nothing else changed | `47a6e28`, T-023 worker: seedLevels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 66 | `question-bank/src/seed-level-verify.test.ts` › T-023 criteria 1-4: output shape > criterion 1: 150 questions over the committed bank, same ids in the same order | `8fd5b17`, T-023 tester: seedLevels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 67 | `question-bank/src/seed-level-verify.test.ts` › T-023 criteria 17-18: concept_load and familiarity_bonus > criterion 18: with every rank equal, a question's level depends only on template and near count (no per-entity bonus) | `8fd5b17`, T-023 tester: seedLevels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 68 | `question-bank/src/seed-level-verify.test.ts` › T-023 criterion 20: every number in LEVEL_SEED_WEIGHTS is live > changing any one numeric value by +1 or -1 changes at least one level (reverted after each) | `8fd5b17`, T-023 tester: seedLevels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name and assertions; a 60 s per-test timeout. The bank is 2.8× bigger, so on CI it outruns bun's 5 s default. | approved |
| 69 | `question-bank/src/seed-level-verify.test.ts` › T-023 criteria 22-24: nothing upstream moved, and the pipeline does not import the stage > criterion 23: every TEMPLATES entry has exactly the nine Template keys | `8fd5b17`, T-023 tester: seedLevels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name; drops only the `TEMPLATES.length === 3` pin and asserts 9. Every entry still has exactly the nine keys. | approved |
| 70 | `question-bank/src/seed-level-loose-ends-verify.test.ts` › T-086 criteria 10-12: what must not move > criterion 10: the 150 seeded levels by id equal 41811f9's | `4009ee5`, T-086 tester: levels must not move | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 71 | `question-bank/src/seed-level-loose-ends-verify.test.ts` › T-086 criteria 10-12: what must not move > criterion 10: LEVEL_SEED_WEIGHTS is deep-equal to 41811f9's | `4009ee5`, T-086 tester: levels must not move | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name; deep-equal to 41811f9's after removing the six new `concept_load` keys, and asserts those six are the only added keys. | approved |
| 72 | `question-bank/src/hand-check-levels-verify.test.ts` › T-025 criteria 1-5: the 30 questions are recorded > criterion 1: exactly 30 rows, one per (10 states x 3 templates), no pair twice | `236b0e0`, T-025 tester: the hand-checked levels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 73 | `question-bank/src/hand-check-levels-verify.test.ts` › T-025 criteria 6-9: the weight decision is recorded and matches the code > criterion 8: the range sentence states the min and max of the 150 final levels, each end naming a state and template that reach it | `236b0e0`, T-025 tester: the hand-checked levels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 74 | `question-bank/src/hand-check-levels-verify.test.ts` › T-025 criteria 10-13: what must still hold > criterion 10: the key set of LEVEL_SEED_WEIGHTS and of concept_load equal the T-023 sets | `236b0e0`, T-025 tester: the hand-checked levels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name; the top-level key set equals T-023's; `concept_load`'s equals T-023's set plus exactly the six new ids. | approved |
| 75 | `question-bank/src/hand-check-levels-verify.test.ts` › T-025 criteria 10-13: what must still hold > criterion 10a: under the T-023 weights set at runtime, the 150 levels by id equal aa88101's | `236b0e0`, T-025 tester: the hand-checked levels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 76 | `question-bank/src/hand-check-levels-verify.test.ts` › T-025 criteria 10-13: what must still hold > criterion 11: TEMPLATES is deep-equal to aa88101's | `236b0e0`, T-025 tester: the hand-checked levels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **PFX**: the first three entries are deep-equal to aa88101's; exactly 9 in all. | approved |
| 77 | `question-bank/src/hand-check-levels-verify.test.ts` › T-025 criteria 10-13: what must still hold > criterion 13: all 150 final levels are finite and within 0-18 | `236b0e0`, T-025 tester: the hand-checked levels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | **S3** | approved |
| 78 | `question-bank/src/hand-check-levels-verify.test.ts` › T-025 criteria 10-13: what must still hold > criterion 13 (c): every number is covered, and exactly missing_rank_bucket and concept_load_default are exempt | `236b0e0`, T-025 tester: the hand-checked levels | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name; the expected key list adds `concept_load["<id>"]` for the six new ids. The exemption check is unchanged. | approved |
| 79 | `backend/tests/test_content_api.py` › `test_content_version_counts_what_was_seeded` | `4be5e2b` (history starts at the #31 merge), T-040: version counts | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name; 100 → 365 served. | approved |
| 80 | `backend/tests/test_content_api.py` › `test_pagination_walks_the_whole_set_once` | `4be5e2b`, T-040: pagination | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name; loop cap 30 → 100 pages of 4; 100 → 365 seen, 365 distinct. | approved |
| 81 | `backend/tests/test_content_api.py` › `test_a_bundle_carries_its_entities_and_questions` | `4be5e2b`, T-040: bundle | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name; 100 → 365. | approved |
| 82 | `backend/tests/test_content_build.py` › `test_version_counts_fifty_entities_and_a_hundred_questions` | `25c7847`, T-040 worker | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Renamed `…_and_365_questions`; 100 → 365. | approved |
| 83 | `backend/tests/test_content_build.py` › `test_served_questions_are_the_files_non_map_click_questions` | `25c7847`, T-040 worker | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name; 100 → 365, and `_all` pages through instead of `limit=200`. | approved |
| 84 | `backend/tests/test_t040_tester_criteria.py` › `test_c6_version_counts_50_entities_and_100_questions` | `acaa4a1`, T-040 tester | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Renamed `…_365_questions`; 100 → 365. | approved |
| 85 | `backend/tests/test_t040_tester_criteria.py` › `test_c11_served_ids_are_the_files_non_map_click_ids` | `acaa4a1`, T-040 tester | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name; 100 → 365; the per-entity (format, topic) pairs become the seven served templates' pairs, read from the file. | approved |
| 86 | `backend/tests/test_t040_tester_criteria.py` › `test_c22_every_wrong_answer_names_the_answer_and_highlights_the_state` | `acaa4a1`, T-040 tester | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name; plays 200 answers instead of 100. **Floor stays ≥ 40 states** (200 reaches 50 here; 100 reaches 32–34). | approved |
| 87 | `backend/tests/test_t040_tester_criteria.py` › `test_c32_one_new_decision_entry_names_the_three_choices` | `acaa4a1`, T-040 tester | criteria 1/4/36: six new templates, 415 generated, 365 served | modify | Same name; E numbers are contiguous from 1 (`range(1, max+1)`) and include 24; the E-24 body checks unchanged. | approved |
| 88 | `e2e/tests/progress.spec.ts` › "signing out and back in starts where the child left off" | `4be5e2b` (history starts at the #31 merge): user journeys | criterion 44: the label changed | modify | Same name; clicks "A bit of everything" instead of "A bit of both" (criterion 44). Nothing else changes. | approved |
| 89 | `e2e/tests/progress.spec.ts` › "the level a child reaches is remembered between sittings" | `4be5e2b` (history starts at the #31 merge): user journeys | criterion 44: the label changed | modify | Same name; clicks "A bit of everything" instead of "A bit of both" (criterion 44). Nothing else changes. | approved |
| 90 | `e2e/tests/progress.spec.ts` › "progress belongs to the profile, not the browser" | `4be5e2b` (history starts at the #31 merge): user journeys | criterion 44: the label changed | modify | Same name; clicks "A bit of everything" instead of "A bit of both" (criterion 44). Nothing else changes. | approved |
| 91 | `e2e/tests/progress.spec.ts` › "the map fills in once a child has come back a second time" | `4be5e2b` (history starts at the #31 merge): user journeys | criterion 44: the label changed | modify | Same name; clicks "A bit of everything" instead of "A bit of both" (criterion 44). Nothing else changes. | approved |
| 92 | `e2e/tests/quiz.spec.ts` › "the summary counts places, never a percentage or a score" | `4be5e2b` (history starts at the #31 merge): user journeys | criterion 44: the label changed | modify | Same name; clicks "A bit of everything" instead of "A bit of both" (criterion 44). Nothing else changes. | approved |


**Amendments, raised while applying and approved in the same session:**

| # | Test | Why | Action | Becomes | Decision |
|---|---|---|---|---|---|
| A1 | corrects row 32: `question-bank/src/generate.test.ts` › skipping > a non-string answer is reported, not stringified | S3 was the wrong rule: its fixture `top_crops: ['corn']` is the criterion-7 reversal, like rows 41–42. The question put to the person called it "row 39"; it is row 32. | modify | Same name; fixture `top_crops: [7]`; still no draft and still `notText: ["top_crops"]` | approved |
| A2 | new row 93: `question-bank/src/hand-check-levels-verify.test.ts` › T-025 criteria 14-17 > criterion 17: every question-bank test file at aa88101 is present and unmodified | Its sha256 over the 48 old test files changes because of the approved edits above | modify | Digest re-pinned to `be563d37…` with a T-026 comment, as T-040 and T-064 did; the 48-file list and presence checks unchanged | approved |
| A3 | corrects row 83: `backend/tests/test_content_build.py` › `test_served_questions_are_the_files_non_map_click_questions` | Row 83 left out its per-state (format, topic) pin to the old two pairs | modify | As row 85: each state's pairs equal the file's non-map_click pairs for it, and include the two old pairs; 50 states | approved |

Also, to keep lint clean after rows 18–21: `distractors.test.ts` dropped its describe-level `shortPools` and `drafts` bindings, which those rows had left unused.

## Notes

- **Expected counts.** Superlative 47, wildlife 50, landmark 44, climate 50, crops 50, farm animals 24: **265 new**, 415 generated, 365 served (the 50 `map_click` withheld). The expander derived these from the committed entities. It did not run the pipeline.
- **Area precision.** `area_km2` for NJ (`22591.4`) and RI (`3144.245565`) carries Wikidata's odd precision. That is harmless here, because no criterion displays a number.
- **Worker, 2026-10-20.**
  - **The expected counts held exactly**: 47 / 50 / 44 / 50 / 50 / 24, so 415 generated and 365 served.
  - **The guards never left a pool short.** The only short pools are DE, CT and RI on the superlative, as criterion 8 expects.
  - **Surprise: the climate guard is not enough by itself.** The ten groups stop same-group pairs, but neighbours *across* groups read alike. So climate is farthest-first (E-25).
  - **Surprise: C3's residual risk is common, not rare** (T-088).
  - **Surprise: the stale list is about 20 times what the Constraints named.** Most older suites pin 150 questions or three templates.
  - **The data folder is 310,595 bytes.** Compacting the JSON alone would leave it at about 239 KB, so the cap has to move either way.
  - **The landmark prompt avoids "famous"**, because a T-025 guard scans `src/` for familiarity words.
