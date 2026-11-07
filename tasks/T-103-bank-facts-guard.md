# T-103 — Guard the bank facts the backend draw survey rests on

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-11-07, unattended run. See `runs/T-103-bank-facts-guard.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-103
**Branch:** `claude/fervent-ptolemy-4py2eg`
**PR:** #128, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-07 | cse_011oDiJbsZTbExMiPULZMiFd |

## Goal

T-102 (PR #126) showed that 56 router-serving backend tests pass whatever the
router draws, but only because of facts about today's
`backend/app/data/content.json` that nothing checks. If a bank change breaks one
of those facts for only some questions, those tests become flaky and nothing
points at why. This task makes each fact a deterministic test of its own, whose
failure names the tests that depend on it. A bank change then fails on the fact,
every run, instead of failing at random.

## Definitions used by the criteria

- **The bank:** `backend/app/data/content.json` as committed, the file
  `store.ensure_content_loaded` loads by default (`app/store.py:72`,
  `CONTENT_FILE`).
- **Choice question:** a question whose `format` is `map_identify` or
  `multiple_choice`.
- **Entity geometry:** for a question, the `geometryId` of the entity whose `id`
  equals the question's `entityId`.
- **Fact check:** the test, or the parametrised case of a test, that asserts
  one fact below. One fact, one check. Each has its own pytest node ID, so a
  failure says which fact broke.
- **Dependents table:** the table under "Facts and their dependents" in Context.
  Each row lists the tests in `backend/tests/` that a fact protects, taken from
  T-102's survey (rows by number, in the 84-row table in
  `git show d865519:tasks/T-102-unseeded-draw-survey.md`).
- **Breaks the fact:** an edited copy of the bank that differs from the
  committed one only by the change named in the criterion.

## Acceptance criteria

**Frozen once approved.**

### The guard as a whole

1. **The committed bank passes.** Every fact check passes against the bank as
   committed on this branch.
2. **One check per fact.** There is a separate fact check for each of the
   fourteen facts B1, B2, B3a, B3b, B3c, B4, B5, B6, B7, B8a, B8b, B8c, B8d and
   B9 (defined in criteria 5–18). For each fact, its pytest node ID, or the ID
   of its parametrised case, contains the fact's label (for example `B8c`).
3. **A failure names its dependents.** When a fact check fails, its pytest
   failure output contains the file name and function name of every test listed
   against that fact in the dependents table. It may name more tests than that,
   but never fewer.
4. **No draw.** No fact check makes an HTTP request, calls a router, calls
   `pick_question` or `store.candidate_questions`, or reads or seeds `random`.
   Run under any `random.seed`, each fact check gives the same result.

### The facts, each with both sides of its edge

Each criterion below is checked by making the single named edit to a copy of
the bank and running that fact's check against it. "Red" means that fact's
check fails. "Green" means it passes.

5. **B1: every question's entity exists and every entity can be shown.**
   - Green on the committed bank.
   - Red when one question's `entityId` is changed to an id no entity has.
   - Red when one entity's `funFact` is removed, or set to `""`.
   - Red when one entity's `name` or `geometryId` is removed, or set to `""`.
6. **B2: every choice question has exactly four distinct choices and a key in
   range.**
   - Red when one choice question has 3 choices. Red when it has 5.
   - Red when two of one choice question's 4 choices are equal.
   - Red when one choice question's `correctIndex` is `4`. Red when it is `-1`.
     Red when it is missing.
   - Green when one choice question's `correctIndex` is moved to `0` or to `3`
     (the other fields left as they are).
7. **B3a: every `map_click` key is a state's geometry.** For every `map_click`
   question, `answerGeometryId` is a string of exactly two digits that equals
   some entity's `geometryId`.
   - Red when one `map_click` question's `answerGeometryId` is `"11"`, `"1"`,
     `"99"`, or missing.
   - Red when one entity's `geometryId` and its `map_click` question's
     `answerGeometryId` are both changed to `"11"`. No entity may have geometry
     `"11"`: DC is not a state, and tests tap `"11"` as a key no question can
     have.
8. **B3b: a `map_click` question carries no choice fields.**
   - Red when one `map_click` question gains `choices`, `correctIndex`, or
     `highlightGeometryId`. Each of the three is its own red case.
9. **B3c: `"13"` is never a Texas key.** No question about `us-state-tx` has
   `answerGeometryId` `"13"`.
   - Red when Texas's `map_click` question's `answerGeometryId` is `"13"`.
   - Green when a question about a state other than Texas has
     `answerGeometryId` `"13"` (Georgia's does today).
10. **B4: no explanation fields.**
    - Red when one question gains `shortExplanation`. Red when one gains
      `detailExplanation`.
11. **B5: every highlight is the question's own state.** For every question,
    the first of `highlightGeometryId`, `answerGeometryId` and the entity
    geometry that is present equals the entity geometry.
    - Red when one question's `highlightGeometryId` is another entity's
      `geometryId`.
    - Red when one `map_click` question's `answerGeometryId` is another entity's
      `geometryId`.
    - Green when one `multiple_choice` question has neither field.
12. **B6: reveal by topic.** `reveal` is `map_highlight` for every question
    whose `topic` is `location` or `superlative`, and `none` for every question
    in any other topic.
    - Red when one `location` question's `reveal` is `none`.
    - Red when one `superlative` question's `reveal` is `none`.
    - Red when one `capital` question's `reveal` is `map_highlight`.
13. **B7: no prompt says "review".** No question's `prompt` contains the
    substring `review` in any letter case.
    - Red when one prompt contains `review`. Red when one contains `Review`.
    - Green when one prompt contains `revie` or `view`.
14. **B8a: the location topic is one `map_identify` and one `map_click` per
    state.** Every `location` question is `map_identify` or `map_click`, and
    every entity has exactly one of each in `location`.
    - Red when one entity has a second `location` `map_identify` question.
    - Red when one entity's `location` `map_click` question is removed.
    - Red when one `location` question's `format` is `multiple_choice`.
15. **B8b: the capital topic is one `multiple_choice` per state.** Every
    `capital` question is `multiple_choice`, and every entity has exactly one.
    - Red when one entity has a second `capital` question. Red when one
      entity's `capital` question is removed.
    - Red when one `capital` question's `format` is `map_identify`.
16. **B8c: a `map_click` arrives in time.** The `location` topic holds at least
    one `map_click` question, and at most 51 questions that are not
    `map_click`. 51 is the bound that makes 60 serves enough: with at most 51
    fresh non-`map_click` serves plus the 8 review slots at indices 6, 13, …,
    55, the 60th serve at the latest must be a `map_click`. The 100-serve test
    (row 65) is covered by the same bound, since 51 + 14 < 100.
    - Green when the `location` topic holds 51 non-`map_click` questions. Red
      when it holds 52. This check's result does not depend on whether B8a
      passes.
    - Red when the `location` topic holds no `map_click` question.
17. **B8d: the five newer topics are choice-only and big enough for 16
    serves.** Every question in `superlative`, `wildlife`, `landmark`,
    `climate` and `agriculture` is `multiple_choice`, and each of those five
    topics holds at least 16 questions (the number of serves
    `test_c46_a_new_topic_session_serves_only_that_topic_outside_review` makes).
    - Green when one of the five topics holds exactly 16. Red when it holds 15.
    - Red when one question in one of the five topics is `map_click`.
18. **B9: Texas has a question to review.** At least one question has
    `entityId` `us-state-tx`.
    - Red when every Texas question is removed. Green when exactly one is left.

### What must not happen

19. **Properties, not digests.** No fact check hashes the bank or any part of
    it, or compares it to a stored copy, a stored id list, or a stored count
    other than the bounds stated in criteria 5–18 (and 50, the number of
    entities, if a check needs it). Each of these edits leaves every fact check
    green: rewording one `capital` prompt without adding `review`; reversing the
    order of `questions`; adding one valid `landmark` `multiple_choice` question
    (4 distinct choices, `correctIndex` 0, `reveal` `none`, an existing
    `entityId`); and changing `_source`.
20. **No existing test changes.** `git diff origin/main...HEAD -- backend/tests/`
    adds files and changes no file that exists on `main`. Every test named in
    the dependents table, and the three tests that already assert B4 or B6
    (listed in Context), are byte-identical to `main`.
21. **Production code and the bank are unchanged.**
    `git diff origin/main...HEAD -- backend/app/ question-bank/data/` is empty.
22. **No new dependency.** `backend/pyproject.toml` and `backend/uv.lock` are
    unchanged.
23. **The three unit suites pass:** `make -C backend test`, `cd frontend && bun
    test`, `cd question-bank && bun test`. No test reaches the network (CI's
    dead-proxy guard, `tasks.md` §A). Any whole-tree pin that this task's new
    files turn red is put back to green only through a Test change request a
    person approved (see Constraints), never by editing it unasked.

## Out of scope

- **S1–S6, the selection and seed facts.** T-102's arguments also rest on how
  `app/selection.py`, `app/routers/sessions.py` and `app/grading.py` behave and
  on the demo profile's seed (`p-demo-maya` at level 6.0, review queue only
  Texas, Colorado at 0.8). Those are code and seed data, with tests of their
  own. If the worker finds one of them unguarded, it goes in the Handoff as a
  follow-up, not into this branch.
- **Making T-102's criterion-6 probe a CI step.** That was the other option in
  the queue entry, and it is weaker: the probe is evidence, not proof.
- **Editing the dependent tests,** including adding a pointer in their
  docstrings back to the fact checks. That would turn whole-tree pins red for
  no behaviour.
- **Removing or merging the existing partial B4 and B6 assertions** in
  `test_content_build.py`, `test_t040_tester_criteria.py` and
  `test_t026_topics.py`. They stay as they are.
- **Re-surveying.** The dependents table is T-102's, as the reviewer accepted
  it. The worker may add tests to a fact's list if it finds more, but it does
  not redo the 84-row survey.
- **The pinned rows** (`pinned (force)`, `pinned (fixed_draw)`). Their pins
  already make them draw-independent.
- **The question-bank pipeline,** the frontend, and `openapi.yaml`.

## Constraints

- **Files expected to change:** one or more new test files under
  `backend/tests/` (and a shared helper there if the worker wants one). Nothing
  else, apart from the brief and any approved Test change request rows.
- **Read the bank the server loads.** The facts are about the committed
  `backend/app/data/content.json`. Read it directly from disk. Do not rebuild it
  from `question-bank/data/`. `test_content_build.py` already keeps the two in
  step (E-6, E-24).
- **Bounds come from the dependents, not from today's counts.** Where a
  criterion gives a bound (51, 16, "at least one"), assert that bound, not
  today's value (50, 47, 9). This is P-17's lesson: a refresh or a new template
  should not turn a fact check red unless it really breaks a dependent's
  argument.
- **The new tests must pass the backend's own guards,** including
  `tests/test_git_revision_guard.py` (no fixed `git` revision).
- **Expect whole-tree pins to go red, and plan to attend the tester step.**
  Adding a file under `backend/tests/` and this brief has turned
  question-bank whole-tree file-set pins red on every recent backend task. On
  T-102 it was `farm-animal-loose-ends-verify.test.ts` criterion 21
  (`CRITERION_21_ALLOWED`) and `climate-cold-trade-accepted-verify.test.ts`
  T-091 criterion 22 (`CRITERION_22_ALLOWED`), plus the applied-request sha.
  Run all three suites, not only `make -C backend check` (`process-tasks.md`
  P-17 and the "Recurred" notes after it). The worker lists every red pin under
  **Tests made stale**. The tester raises the Test change request (D-14). Only
  a person approves it.
- **Dependencies:** none (see [`CLAUDE.md`](../CLAUDE.md), "Packages").

## Context

**Required reading for the worker and the tester.**

- **The survey this guards:** PR #126's body ("Bank facts the 'holds' rows rest
  on", B1–B9), and the full 84-row table in the T-102 brief at `d865519`:
  `git show d865519:tasks/T-102-unseeded-draw-survey.md`, sections "What the
  arguments rest on" and "The survey (criterion 1)". The row numbers below are
  that table's.
- **The queue entry:** [`tasks.md`](../tasks.md) §E, T-103.
- **The bank:** `backend/app/data/content.json`. Question keys used here:
  `entityId`, `topic`, `format`, `choices`, `correctIndex`,
  `answerGeometryId`, `highlightGeometryId`, `reveal`, `prompt`. Entity keys:
  `id`, `name`, `geometryId`, `funFact`. Today it holds 50 entities and 415
  questions: location 50 `map_identify` + 50 `map_click`, capital 50,
  superlative 47, wildlife 50, landmark 44, climate 50, agriculture 74, all
  `multiple_choice` outside location. Texas is `us-state-tx`, geometry `"48"`.
- **Why the bounds in B8c and B8d are what they are:** T-102's S2 (a non-review
  serve draws only from unasked questions while any remain) and S3 (a review
  serve happens only at index ≡ 6 mod 7). See `app/selection.py` and
  `app/routers/sessions.py`. The 60-serve loop is `_session_at_a_map_click` in
  `tests/test_t051_map_click.py`. The 100-serve loop is in
  `test_c14_a_withheld_map_click_question_grades_against_the_stored_key`. The
  16-serve loop is in `test_t026_tester_criteria.py`, `test_c46_…`.
- **Already partly true, and left alone:** B4 is asserted for the committed
  file in `test_content_build.py::test_the_loader_writes_no_prose_of_its_own`,
  and for served rows in
  `test_t040_tester_criteria.py::test_c19_no_prose_of_the_loaders_own` and
  `test_t026_topics.py::test_superlative_reveals_the_map_and_every_other_reveal_is_by_format`.
  That last test also asserts B6, keyed by format through
  `content_build.REVEAL_BY_FORMAT`. `test_content_build.py::test_served_questions_are_every_file_question`
  checks that each entity has a location `map_identify`, a location
  `map_click` and a capital question, but not that it has exactly one of each.
  None of them names the draw-dependent tests they protect, so the new checks
  are still needed.
- **P-17,** in [`process-tasks.md`](../process-tasks.md): why the checks assert
  properties, and why whole-tree pins will go red.
- **Test rules:** [`test-guidelines.md`](../test-guidelines.md) (backend
  section) and [`CLAUDE.md`](../CLAUDE.md) "Tests".

### Facts and their dependents

This is the dependents table criterion 3 refers to. "Row" is T-102's table row.
Every listed test is in `backend/tests/`.

| Fact | Tests whose "holds under any draw" argument uses it |
|---|---|
| **B1** | rows 1, 2 (`test_sessions_api.py::test_starting_a_session_serves_the_first_question`, `::test_the_first_question_carries_its_entity_for_the_map`); 26 (`test_content_build.py::test_reveals`); 31 (`test_t040_tester_criteria.py::test_c20_c21_c25_a_perfect_topic_session_covers_each_state_once_with_its_reveal`); 44, 45 (`test_t051_map_click.py::test_a_right_tap_is_correct_and_names_the_state`, `::test_a_wrong_tap_queues_the_state_and_can_be_undone`) |
| **B2** | `test_sessions_api.py`: rows 3, 6, 7, 8, 10, 12, 14, 19, 20, 25 (`test_a_topic_filters_every_question_served`, `test_a_question_can_be_served_without_its_answer_key`, `test_a_correct_answer_returns_the_reward_and_the_key`, `test_a_wrong_answer_returns_the_reason_and_queues_the_entity`, `test_answering_the_same_question_twice_is_refused`, `test_an_answer_with_no_choice_cannot_be_graded`, `test_three_wrong_in_a_row_drops_the_level_without_a_message`, `test_the_same_answer_cannot_be_undone_twice`, `test_only_the_most_recent_answer_can_be_undone`, `test_ending_twice_returns_the_same_summary`); row 29 (`test_t026_tester_criteria.py::test_c46_a_new_topic_session_serves_only_that_topic_outside_review`); row 55 (`test_t053_answer_key_default.py::test_session_serves_withhold_unless_asked`); `test_t053_tester_criteria.py` rows 58, 61, 62, 64 (`test_c9_next_question_with_true_is_carried`, `test_c12_a_re_serve_follows_the_request_not_the_first_serve`, `test_c12_re_serve_of_the_start_sessions_first_question_can_opt_in`, `test_c14_a_withheld_choice_question_grades_against_the_stored_key`); row 71 (`test_t093_tester_criteria.py::test_c5_undoing_a_review_round_answer_restores_the_seen_list`); row 81 (`test_t093_undo_places_seen.py::test_undoing_a_review_round_answer_restores_the_seen_list`) |
| **B3a** | every B2 test above except rows 3, 29 and 64, plus rows 44, 45 (`test_t051_map_click.py`, both) and 65 (`test_t053_tester_criteria.py::test_c14_a_withheld_map_click_question_grades_against_the_stored_key`) |
| **B3b** | the same tests as B3a |
| **B3c** | row 71 (`test_t093_tester_criteria.py::test_c5_undoing_a_review_round_answer_restores_the_seen_list`) |
| **B4** | row 26 (`test_content_build.py::test_reveals`) |
| **B5** | rows 26 (`test_content_build.py::test_reveals`), 30 (`test_t026_topics.py::test_a_correct_superlative_answer_highlights_the_answer_state`), 31 (`test_t040_tester_criteria.py::test_c20_c21_c25_…`), 44, 45 (`test_t051_map_click.py`, both) |
| **B6** | rows 26, 30, 31 (as for B5) |
| **B7** | row 22 (`test_sessions_api.py::test_a_review_question_is_not_labelled_to_the_kid`) |
| **B8a** | rows 27 (`test_content_build.py::test_a_perfect_session_reaches_every_question_once`), 31 (`test_t040_tester_criteria.py::test_c20_c21_c25_…`) |
| **B8b** | rows 27, 31 (as for B8a); row 3 (`test_sessions_api.py::test_a_topic_filters_every_question_served`); row 64 (`test_t053_tester_criteria.py::test_c14_a_withheld_choice_question_grades_against_the_stored_key`) |
| **B8c** | rows 44, 45 (`test_t051_map_click.py`, both); 65 (`test_t053_tester_criteria.py::test_c14_a_withheld_map_click_question_grades_against_the_stored_key`) |
| **B8d** | row 29 (`test_t026_tester_criteria.py::test_c46_a_new_topic_session_serves_only_that_topic_outside_review`) |
| **B9** | row 21 (`test_sessions_api.py::test_a_review_round_serves_from_the_queue`); rows 57, 60 (`test_t053_tester_criteria.py::test_c8_force_review_without_flag_is_withheld`, `::test_c11_review_round_serves_withheld`); rows 71, 75 (`test_t093_tester_criteria.py::test_c5_undoing_a_review_round_answer_restores_the_seen_list`, `::test_c7_undo_of_a_review_round_answer_restores_review_round_remaining`); row 81 (`test_t093_undo_places_seen.py::test_undoing_a_review_round_answer_restores_the_seen_list`) |

Where the table abbreviates a name (`test_c20_c21_c25_…`), criterion 3 needs
the full function name in the failure output.

## Handoff

## Verdict

## Notes

- **Expander, 2026-11-07.** Picked T-103 as the first runnable entry. Skipped:
  T-085b (needs a person to choose a Census source), T-056 (needs a design
  decision), T-095 (needs a person's answer to its Q). B8 in T-102 was one
  fact. Here it is four (B8a–B8d), because the dependents need different
  things from it: exact composition for the 100- and 50-serve perfect sessions,
  an upper bound for the `map_click` arrival loops, and a size floor for the
  16-serve topic loop. B3 is split the same way. The "13 is never Texas" fact
  (B3c) is test-specific, but it is the one tap value T-102 relied on that
  nothing else covers. "28" was cited in B3 as well, but no unpinned test uses
  it, so it is left out.
