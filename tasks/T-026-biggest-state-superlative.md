# T-026 — A third topic: "Which of these states is the biggest?"

**Status:** `blocked`
**Next step:** `human` — answer **Q1** and **Q2** under "Questions for a human" below, then set this back to `task-expander`, which finishes the criteria for a fresh approval
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-026
**Branch:** `claude/serene-ramanujan-msepc5`
**PR:** #91, opened draft at expand time against the branch above. Stays draft until the reviewer approves
**Fault:** the plan says superlatives use next-ranked distractors *and* avoid contested rankings, and on the bank's `area_km2` (total area, water included) those two rules conflict for about a third of the states. Which one gives way is a content call for a person (expander, Q1).

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-20 | cse_019R9SRj6CMD4wWi2gd7WNAm (orchestrated; halted on Q1/Q2) |

## TL;DR

- **Picked T-026**, the first queue entry whose dependencies are done (T-070, T-084, T-085 wait on people), and scoped it to **one topic**, the superlative one, as `PROGRESS.md` "Next" and `tasks.md` both recommend.
- **Halted before the criteria are final.** Next-ranked distractors on total area would mark a child wrong on contested facts: Missouri has more *land* than Oklahoma, but the bank ranks Oklahoma bigger. Q1 is which rule a kids' quiz should follow.
- **Needed from a person:** an answer to Q1 (one letter is enough) and a yes/no on Q2 (the split). Then rerun the `task-expander`.

## Questions for a human

### Q1 — Which "biggest" can a child be marked wrong on?

**What the plan says.** Plan §1.8 gives two rules for superlatives:

- distractors are the next-ranked entities ("#1 vs #2/#3/#4");
- avoid contested rankings: flag them `contested` and exclude them, or turn them into the fun fact.

**What the bank has.** Each state has one `area_km2`: Wikidata P2046, which is **total** area, water included. Its `area_rank` follows from it. There is no land-area field.

**Why the two rules conflict.** For a water-heavy state, its rank by total area and its rank by land area are far apart. Michigan is 11th by total area (the Great Lakes), but about 22nd by land. With next-ranked distractors on total area, the land order disagrees with the marked answer in at least these questions:

| Answer (total-area rank) | Distractors | Land area says |
|---|---|---|
| Oregon (9) | Wyoming, Michigan, Minnesota | Wyoming is bigger |
| Michigan (11) | Minnesota, Utah, Idaho | all three are bigger |
| Washington (18) | North Dakota, Oklahoma, Missouri | all three are bigger |
| Oklahoma (20) | Missouri, Florida, Wisconsin | Missouri is bigger |
| Florida (22) | Wisconsin, Georgia, Illinois | Georgia and Illinois are bigger |
| Hawaii (43) | Massachusetts, Vermont, New Hampshire | all three are bigger |

**Where the land figures come from.** They are the expander's recollection of US Census land areas. They are approximate and **not** from any committed source, so check them before relying on them. The total-area ranks come from the committed bank (`question-bank/data/us-states/*.json`).

**Close calls make it worse.** Some gaps are tiny even on total area. Oklahoma is 181,195 km² and Missouri is 180,533 km², a 0.4% gap. No nine-year-old can tell those apart, and a quiz that claims to teach should not mark either answer wrong.

**Options:**

- **(a) Next-ranked on total area, as the plan's first rule says.** Accept the contested rows. The reveal could say "counting lakes and coastal water". That text needs a person's approval, because a child reads it.
- **(b) Total area, but only when the answer is clearly bigger.**
  - Every distractor must be at most a fixed share of the answer's `area_km2`. The person picks the share, for example 80%.
  - Answers and distractors exclude a person-approved list of water-heavy states, for example MI, HI, FL, MD, MA. A margin alone cannot fix Michigan: 250,493 km² total against roughly 146,000 km² of land.
  - The worker computes no list. The person approves it, because it is curation.
- **(c) Land area first.** Add a land-area field to the entity bank as its own task, sourced and reviewed. The superlative topic then waits for it, and is built on land area with next-ranked distractors.
  - This also moves every digest guard, so it sits behind T-070 (a) / Q1.
- **(d) Something else.**

**Expander's recommendation: (b).** It ships with the data that exists, and it keeps the plan's "avoid contested" rule, which protects the child. It does weaken "next-ranked". (c) is the most correct, but it puts the topic behind T-070's open Q1.

### Q2 — Split T-026 one topic per task?

`tasks.md` T-026 lists six topics, but its Done-when asks for **at least one** topic end to end. Each curated topic needs a decision this one does not:

- **wildlife:** a same-animal guard.
- **landmark:** the reader-collision pairs.
- **climate:** the ten same-climate groups.
- **agriculture:** turning an array answer into text.

Each also ships curated text whose substance still awaits a human read on PRs #42 to #46.

**Proposal:**

- **This brief is T-026, superlative topic only.**
- **On merge, the reviewer re-files the remaining topics** as one entry each (wildlife, landmark, climate, agriculture), carrying the notes now under T-026.

Yes or no.

## Goal

Give the app a third topic using only data the bank already has: the area ranks. This also adds a third question per state, which `T-056` (the map cannot fill in on day one) needs.

## Already true — do not rebuild

- **`area_km2` and `area_rank`** are on all 50 committed entities (`question-bank/data/us-states/*.json`). The ranks run 1–50 with no gaps (Alaska 1, Rhode Island 50).
- **`superlative` and `size` are already `Topic` values.** Both are in `TOPICS` (`question-bank/src/templates.ts`) and `backend/app/models.py`.
- **Topic filtering works for any value.** `selection.topic_matches` (`backend/app/selection.py:23`) and `store.candidate_questions` already filter by any topic string, and `"mixed"` matches everything.
- **The format is already served and rendered.** `multiple_choice` is in `SERVED_FORMATS` (`backend/app/content_build.py`), and `Session.tsx` renders it.
- **The reveal path exists.** `build_reveal` (`backend/app/grading.py:198`) highlights `highlightGeometryId`, or else the entity's `geometryId`, on a correct answer when the question's `reveal` is `map_highlight`, and on every wrong answer.
- **The bank has room for 47 more questions.** It is about 148 KB against `committed-bank.test.ts`'s 200 KB cap. 47 questions at about 580 bytes each is about 27 KB.

## Acceptance criteria — DRAFT, not approved

**Not frozen and not approved.** The criteria marked **[Q1]** are written for option (b) and are rewritten once Q1 is answered. The rest hold under any answer.

**The pipeline**

1. `TEMPLATES` has exactly one new template. It is `multiple_choice`, `applies_to` contains `state`, its topic in `TEMPLATE_TOPICS` is `superlative`, its `answer_field` is `name`, and it passes `validateTemplate`.
2. Its prompt contains no `{token}`. The prompt is identical on every question it produces, it asks which of the shown states is the biggest, and it contains none of: `km`, `area_km2`, `rank`, `square`.
3. For every question it produces, the correct choice is the entity's `name`, and that entity's `area_km2` is strictly greater than the `area_km2` of each of the three other choices.
4. **[Q1]** Each distractor's `area_km2` is at most *S* × the answer's `area_km2`, where *S* is the share a person picks under Q1(b). Check this at the boundary: a state at exactly *S* × may be a distractor, and one just above it may not.
5. **[Q1]** No state on the person-approved exclusion list appears in any of its questions, as answer or as distractor.
6. **[Q1]** Among the states that satisfy criteria 4–5, the distractors are the three with the largest `area_km2`, which is "next-ranked" after the filter. This makes the choice set a fixed function of the bank.
7. A state with fewer than three eligible distractors gets no question from this template. Under any Q1 option this includes Rhode Island, the smallest state, and the 50th-ranked state is never the answer.
8. `buildQuestionBank` over the committed entities gives the existing 150 questions unchanged, byte for byte in their rendered form, plus the new template's. `count` equals the total. No existing question's id, choices, `correctIndex` or `level` moves.
9. Every new question has a `level` in 0–18. `LEVEL_SEED_WEIGHTS.concept_load` has an entry for the new template id, and `engineering-decisions.md` E-22 lists that key and value.
10. Running `cd question-bank && bun run ./src/write-questions.ts` and then `make -C backend content` on the committed tree changes nothing. Both committed files are regenerated in this branch, and both drift tests pass.
11. Every file tracked under `question-bank/data/` still totals under 200 KB, and the cap in `committed-bank.test.ts` is unchanged.

**The served bank**

12. `backend/app/data/content.json` serves every new question with `topic: "superlative"`, `format: "multiple_choice"` and `reveal: "map_highlight"`. Existing served questions keep the reveal they have today.
13. `GET /questions?topic=superlative` returns exactly the new questions. A session started with `topic: "superlative"` serves only them.

**The client**

14. Before the child answers a superlative question, the screen does not show the correct answer except as one of the four choice buttons. It shows no name or map highlight of the question's entity. Today the `multiple_choice` card shows the entity's name and outline, and for this template the entity **is** the answer.
15. After a superlative question is answered, right or wrong, the answer's state is highlighted on a US map.
16. The Setup screen offers a topic that starts a session with `topic: "superlative"`. The existing three options still start `location`, `capital` and `mixed`.
17. No Setup label contains the word "both". With three topics, "A bit of both" is untrue. The wording is the worker's, and a person reviews it on the PR.
18. Capital and map questions render exactly as before. The existing `Session.tsx` tests and the `e2e/` suite pass, and `quiz.spec.ts` plays the new topic because it reads the options from the app.

**Negative**

19. No new dependency in any `package.json`, lockfile or `pyproject.toml`.
20. No test reaches the network.
21. No new prose field reaches `content.json`. The only new child-facing strings are the template prompt and the Setup label, and those come to a person in the PR.
22. No entity file under `question-bank/data/us-states/` and no SPARQL fixture changes.

## Out of scope

- **The other topics in T-026's table.** That is wildlife, landmark, climate, agriculture and the A/B "Which is bigger, X or Y?" (`ab_compare`, which no renderer supports). See Q2.
- **"Smallest" questions.** Plan §1.8 says to skip "least".
- **Population as an axis.**
- **Scope variants by region.**
- **A land-area field.** That is Q1(c), its own task if chosen.
- **`map_click` / T-051**, and adding `choiceGeometryIds` to the contract.
- **The answer reaching the network tab.** `GET /questions` returns `correctIndex` by default (T-053). The served `entity` on a superlative question names the answer too. Neither is fixed here; T-053 owns the product call.
- **Level tuning beyond the new `concept_load` entry.** That is T-050 and T-085. `nearDistractorCount` measures geographic nearness, which means little for a size question. Note it, do not fix it.
- **Mastery semantics.** A superlative answer moves mastery on the answer's state, as every question does today.

## Constraints

- **Files expected to change:**
  - `question-bank/src/templates.ts` and `distractors.ts`: a new strategy name in `DISTRACTOR_STRATEGIES`, plus its `tierOf` case or an equivalent.
  - `question-bank/src/seed-level.ts`: the `concept_load` entry.
  - `question-bank/data/questions/us-states.json` and `backend/app/content.json`, regenerated by their commands, never hand-edited.
  - `backend/app/content_build.py`: the reveal for the new questions.
  - `frontend/src/components/Session.tsx` and `screens.tsx`, plus `frontend/src/lib/api/types.ts` for `SessionTopic`.
  - `engineering-decisions.md` E-22 and, if the reveal or strategy needs a record, the next unused `E-n`. That is `E-25` at the time of writing.
  - New tests.
- **Expected red, by design.** `hand-check-levels-verify.test.ts` assumes exactly three templates (criteria 1, 11, 13 (c)) and pins `LEVEL_SEED_WEIGHTS` and both committed files (10, 14, 17). `seed-level-loose-ends-verify.test.ts` criterion 10 pins the 150 levels.
  - The worker lists these under **Tests made stale** and leaves them red.
  - **Plan to attend the tester step** (D-14, D-15).
- **`openapi.yaml`:** follow the backend if the `SessionTopic` / `topic` enum it documents needs `superlative` (E-14). `openapi.yaml` is outside the reviewer's envelope, so expect an escalation.
- **Content rules (`CLAUDE.md`).** No guessed data, and no unreviewed text in a shippable field. Any exclusion list or margin is the person's from Q1, written into the code verbatim with a pointer to where it was approved.
- **Packages and network.** `bun` and `uv` only. No dependency without asking. No network in tests.

## Context

Required reading:

- **Plan:** `geoquizdataplan.md` §1.2 (the template table, "Which is the {est}…" → `superlative`, MC + reveal on map; distractors), §1.3 (tags), §1.4 (level), §1.8 (superlatives: next-ranked, skip "least", avoid contested, always reveal on the map).
- **Queue:** `tasks.md` T-026 (all the "Since T-0xx" notes), T-056 (why a third question per state matters), T-053 (answer key on the wire).
- **Decisions:** `engineering-decisions.md` E-20 (draft shape), E-21 (distractors), E-22 (level weights), E-23 (topic by template id), E-24 (committed question file, two regeneration commands, `SERVED_FORMATS`).
- **Pipeline:** `question-bank/src/templates.ts`, `generate.ts`, `distractors.ts`, `seed-level.ts`, `tags.ts`, `question-file.ts`, `write-questions.ts`, `committed-bank.test.ts`.
- **Backend:** `backend/app/content_build.py` (`SERVED_FORMATS`, `REVEAL_BY_FORMAT`), `grading.py` `build_reveal`, `selection.py`, `store.py` `candidate_questions`, `models.py` `Topic`.
- **Frontend:** `frontend/src/components/Session.tsx` (the `multiple_choice` card at the entity name), `screens.tsx` `Setup`, `frontend/src/lib/api/types.ts` `SessionTopic`.
- **End to end:** `e2e/tests/quiz.spec.ts`.
- **Contract:** `openapi.yaml` `Topic`, `QuestionFormat`, the session-start request's `topic`.

## Handoff

## Verdict

## Notes

- **Area data:** `area_km2` values for NJ (`22591.4`) and RI (`3144.245565`) carry Wikidata's odd precision. That is harmless for comparison, but a displayed number would need rounding. No criterion displays one.
