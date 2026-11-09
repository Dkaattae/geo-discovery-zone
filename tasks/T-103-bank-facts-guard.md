# T-103 — Guard the bank facts the backend draw survey rests on

**Status:** `approved`
**Next step:** `human` (merge PR #128)
**Approved:** orchestrator — 2026-11-07, unattended run. See `runs/T-103-bank-facts-guard.md`.
**Test changes:** `approved — Dkaattae, 2026-11-09`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-103
**Branch:** `claude/fervent-ptolemy-4py2eg`
**PR:** #128, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-07 | cse_011oDiJbsZTbExMiPULZMiFd |
| worker | 2026-11-07 | cse_011oDiJbsZTbExMiPULZMiFd |
| tester | 2026-11-07 | cse_011oDiJbsZTbExMiPULZMiFd (orchestrated: same id as every spawned role, see Verdict) |
| tester (attended) | 2026-11-09 | cse_011oDiJbVBJppsLkbSyUKGCw |
| reviewer | 2026-11-09 | cse_011oDiJbsZTbExMiPULZMiFd (orchestrated: same id as the other spawned roles, P-14) |

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

**TL;DR.** Built: two new backend test files, 14 fact checks plus edge tests,
74 new tests, all green. `make -C backend check` is green. There are 4
question-bank whole-tree pin reds. All are expected, and all are listed under
**Tests made stale** for the tester's Test change request. Frontend reds come
from this environment (a package could not be installed), not from this
change. **Note:** the `CLAUDE_CODE_REMOTE_SESSION_ID` this worker read is the
same one the expander recorded, so a tester must not assume a different id
means a different session (see Notes).

**Files changed** (only new files under `backend/tests/`, nothing else apart
from this brief):

- `backend/tests/test_t103_bank_facts.py`: the facts as pure functions
  `bank -> list[str]` (an empty list means the fact holds), `FACTS` (label to
  check), `DEPENDENTS` (the dependents table with full names), and
  `failure_message` / `assert_fact`. The pytest checks are
  `test_bank_fact[<label>]` (14 cases) and
  `test_every_named_dependent_is_a_real_test`, which uses `ast` to confirm that
  each named dependent function exists in its file.
- `backend/tests/test_t103_bank_fact_edges.py`: each red/green edge from
  criteria 5-18, run on a deep-copied, edited bank. For red cases it also
  asserts that the message names every dependent. It also covers criterion
  19's four "still green" edits, and two guards (Georgia really is keyed `"13"`,
  and a `multiple_choice` question with neither geometry field exists) so the
  "green on committed" cases mean something.

**Criterion → where it lives**

| # | Where |
|---|---|
| 1 | `test_bank_fact[B1]` … `[B9]`, green on the committed bank |
| 2 | node IDs `tests/test_t103_bank_facts.py::test_bank_fact[B1]`, `[B2]`, `[B3a]`, `[B3b]`, `[B3c]`, `[B4]`, `[B5]`, `[B6]`, `[B7]`, `[B8a]`, `[B8b]`, `[B8c]`, `[B8d]`, `[B9]` |
| 3 | `failure_message` lists `tests/<file>::<function>` for every entry in `DEPENDENTS[label]`, before the problems. I checked a forced B2 failure under plain `pytest -q`: all 18 dependents were printed, with no truncation |
| 4 | the checks only read `store.CONTENT_FILE` and do dict work. No client fixture, no `random`, no `selection`/`store.candidate_questions` |
| 5-18 | one function per fact, `b1_…` through `b9_…`. Each red/green bullet is a case in `test_one_edit_turns_one_fact_red_or_leaves_it_green`, id `<label>-<red|green>-<edit>` |
| 19 | `test_an_edit_that_breaks_no_dependent_leaves_every_fact_green` (4 cases). The only constants are 51, 16, `"11"`, `"13"`, `us-state-tx` and the topic and format names. No count of 50, no digest |
| 20-22 | `git diff origin/main...HEAD --stat` adds 2 files under `backend/tests/` plus this brief and the expander's run log. Nothing under `backend/app/`, `question-bank/data/` or `pyproject.toml`/`uv.lock` changes |
| 23 | backend: 1113 passed, 9 skipped. question-bank: 2709 pass, 4 fail (all stale pins, below). frontend: see "Environment" |

**How to run**

- `make -C backend check`, or only these:
  `cd backend && uv run pytest tests/test_t103_bank_facts.py tests/test_t103_bank_fact_edges.py`
- To run one fact against an edited bank:
  `from tests.test_t103_bank_facts import assert_fact, load_bank`, edit
  `load_bank()`, then call `assert_fact("B8c", bank)`. It raises the same
  `AssertionError` the pytest case raises.

**Choices made in reading the criteria** (tester to confirm, or send back to
`task-expander` if a reading is wrong):

- **B1** treats a non-string `name`/`geometryId`/`funFact` as missing.
- **B2**: `correctIndex` must be an `int` that is not a `bool`, in 0-3.
  Choices are distinct by JSON value.
- **B3a** fails if any entity has geometry `"11"`, whatever that entity's
  question says, and if any `map_click` key is `"11"`, is not two ASCII
  digits, or is no entity's geometry.
- **B3b** fails on whether a key is present, even when its value is `null`.
- **B5** treats a field as "present" when it is not missing and not `null`. It
  skips questions whose entity does not exist, because B1 already fails on
  those.
- **B8a/B8b** count questions per entity id. A question with an unknown
  `entityId` does not count against B8a/B8b (B1 catches it).
- **B8c** depends only on the location topic's format counts, never on B8a.
  The edge test for 51 leaves B8a red and B8c green.

**Deliberately not done**

- No change to any existing test, the bank, `app/` or the pipeline (criteria
  20-21, and Out of scope).
- **S1–S6 (selection and seed facts):** not surveyed. Nothing turned up while
  I worked that looked unguarded. Follow-up, if anyone wants it: `task-expander`.
- **No standalone helper module.** I first wrote `backend/tests/bank_facts.py`,
  then folded it into the `test_*.py` file. A non-`test_` file under
  `backend/` is one more red for the question-bank "non-test files" pins
  (T-096 c21, T-091 c22), and keeping it inside the test file avoided that.

**Environment (not caused by this change)**

- **Frontend:** `cd frontend && bun test` gives 406 pass, 4 fail, 4 errors.
  Every one is `Cannot find package 'react-simple-maps'` (`UsMap.tsx`,
  `t051-map-click.test.tsx`, `t051-tester.criteria.test.tsx`). `bun install
  --frozen-lockfile` failed with `ProxyConnectFailed (403)` downloading
  `d3-ease`, so `node_modules` is incomplete in this sandbox. This task
  changes nothing under `frontend/`. The tester should re-run in a sandbox
  where the install works, or rely on CI.

### Tests made stale

All four are question-bank whole-tree pins. Each one is red because files were
added, not because any behaviour changed. This is the P-17 pattern the brief
predicted. Two of them (the T-096 c21 and T-091 non-test counts) were already
red from the expander's commit, before any worker code.

1. **`question-bank/src/refresh-regenerate-reminder-verify.test.ts`**, test
   `T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes >
   every tracked file under the three trees is as re-pinned by T-039, none
   added or removed`.
   - **Why stale:** the two new `backend/tests/test_t103_*.py` files change
     the tree hash.
   - **Proposed fix:** re-pin `MAIN_BOUNDARY_SHA` to the hash of the final
     branch. At my last commit it was
     `042be705a75b529f1855f5202413d04954977172339068d778db269e04cb5f5d`.
     Recompute it after any tester file lands under `backend/`.
2. **`question-bank/src/farm-animal-loose-ends-verify.test.ts`**, test
   `T-096 criteria 17-21: the bank and the boundaries > criterion 21: outside
   the allowed files and test files, every tracked file is main's, and none is
   added`.
   - **Count:** expected 282, got 284.
   - **Why stale:** `tasks/T-103-bank-facts-guard.md` and
     `runs/T-103-bank-facts-guard.md` are new tracked files.
   - **Proposed fix:** add both to `CRITERION_21_ALLOWED`, as T-091 and T-047
     did.
3. **`question-bank/src/climate-cold-trade-accepted-verify.test.ts`**, test
   `T-091 criterion 22: the diff touches only the allowed files > every
   tracked non-test file outside the allowed list is 12d242e's, and none is
   added`.
   - **Count:** expected 285, got 287.
   - **Why stale:** the same two loop files.
   - **Proposed fix:** add them to `CRITERION_22_ALLOWED`. If the sha pin
     changes too, re-pin `MAIN_UNTOUCHABLE_SHA`.
4. **Same file**, test `T-091 criterion 22: the diff touches only the allowed
   files > pre-existing test files are main's, except ones in an approved Test
   change request`.
   - **Count:** expected 123, got 125.
   - **Why stale:** the two new backend test files.
   - **Proposed fix:** re-pin `MAIN_TESTS_COUNT` 123 -> 125 and
     `MAIN_TESTS_SHA`, with a "Re-pinned by T-103" comment, as T-093, T-097,
     T-099 and T-100 did.

Count floors: none of the backend's own pins went red.
`tests/test_git_revision_guard.py` passes, because the new files run no `git`.

## Test change request

Raised by the tester, 2026-11-07, in an orchestrated run. **Nobody was there to
ask, so no row has been approved and none of these tests has been touched.**
Each row is red only because T-103 added files (two worker test files, one
tester test file, this brief and its run log). No behaviour changed. Every
"Becomes" value was checked: scratch copies of the three files with all four
rows applied give **84 pass, 0 fail** against this branch at the tester's
commit. A pin only covers trees and test files, so later edits to this brief
leave the values as they are. A new file under `backend/` or a new test file
would change rows 1 and 4 again.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` › "T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes" › "every tracked file under the three trees is as re-pinned by T-039, none added or removed" | `40f6c54`, T-087: pinned every tracked file under `backend/`, `frontend/` and `e2e/` so a question-bank task could not touch them; re-pinned by each backend task since | T-103 adds `backend/tests/test_t103_bank_facts.py`, `test_t103_bank_fact_edges.py` and `test_t103_tester_criteria.py`, so the tree hash changes (received `7f53b203…`) | modify | Same name, same assertion (`fileRowsSha(gitLsFiles("backend","frontend","e2e"))` equals the pin). `MAIN_BOUNDARY_SHA` becomes `"7f53b203b5728a892bb1e7023d885f9e32c53b420d0498fcc8e9a0730fb43936"`, with a comment `// Re-pinned by T-103 (Test change request row 1): T-103 added three backend test files.` | approved — Dkaattae, 2026-11-09 |
| 2 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21: the bank and the boundaries" › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096: no non-test file outside T-096's allowed set may differ from main or be added | `tasks/T-103-bank-facts-guard.md` and `runs/T-103-bank-facts-guard.md` are new tracked files (count 284, pin 282) | modify | Same name and assertions (count 282, `MAIN_UNTOUCHABLE_SHA` unchanged). `CRITERION_21_ALLOWED` gains `"tasks/T-103-bank-facts-guard.md"` and `"runs/T-103-bank-facts-guard.md"`, under a comment `// T-103's loop files, joined through T-103's Test change request row 2 (approved by <name>, <date>).` | approved — Dkaattae, 2026-11-09 |
| 3 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091: no non-test file outside T-091's allowed set may differ from its base or be added | The same two loop files (count 287, pin 285) | modify | Same name and assertions (`MAIN_UNTOUCHABLE_COUNT` stays 285, `MAIN_UNTOUCHABLE_SHA` unchanged). `CRITERION_22_ALLOWED` gains the same two paths, under a comment like row 2's citing row 3 | approved — Dkaattae, 2026-11-09 |
| 4 | Same file › same describe › "pre-existing test files are main's, except ones in an approved Test change request" | `950f334`, T-091: every pre-existing test file stays byte-identical; re-pinned by each task that adds a test file | T-103 adds three backend test files (count 126, pin 123) | modify | Same name and assertions. `MAIN_TESTS_COUNT` 123 → 126 and `MAIN_TESTS_SHA` → `"c0ec8c11a8a29ccf1137f4951d46f8af069f0c0b7ed19242c5477d37e980122a"`, with comments `// Re-pinned by T-103 (Test change request row 4): T-103 added test_t103_bank_facts.py, test_t103_bank_fact_edges.py and test_t103_tester_criteria.py (123 -> 126).` above each | approved — Dkaattae, 2026-11-09 |
| 5 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | `950f334`, T-091: each file a Test change request re-pinned differs from main only by its re-pin; re-pinned by each task that edits one | Found while applying row 2, which edits `farm-animal-loose-ends-verify.test.ts`, so that file's digest in `APPLIED_REQUEST_FILE_SHAS` moves. The 2026-11-07 request missed it (its "84 pass" check did not cover this test) | modify | Same name and assertions (still required to differ from main's digest). The `farm-animal-loose-ends-verify.test.ts` entry becomes `"cc8f4936863efd14616f5f2017192c23bba1f8997c6aa27015c4553bb3d69691"`, its comment gaining `then by T-103 (row 5, for its row 2)` | approved — Dkaattae, 2026-11-09 |

None of the four is a count floor protecting tests against deletion, and no
test is deleted. Each re-pin pins the new tree exactly as hard as the old pin
pinned the old one.

## Verdict

**TL;DR. `pass`.** Dkaattae approved Test change request rows 1-5 in an attended
tester session. They were applied in `2b87fea`. backend and question-bank are
fully green, and the frontend shows only the same environment failures as
before (`react-simple-maps` cannot be installed here). Next step: `reviewer`.

**Attended pass, 2026-11-09** (session `cse_011oDiJbVBJppsLkbSyUKGCw`, which differs
from every earlier row, so the Sessions check means something this time).

- **Approval, in the person's words:** rows 1-4: "Approve all 4, as Dkaattae".
  Row 5: "Approve row 5, as Dkaattae".
- **Row 5 was new.** Applying row 2 turned a fifth pin red. That pin is the
  `APPLIED_REQUEST_FILE_SHAS` digest of `farm-animal-loose-ends-verify.test.ts` in
  `climate-cold-trade-accepted-verify.test.ts`. The digest went from
  `e9470a5e…` to `cc8f4936…`. I raised it as row 5, asked, and got it approved
  before editing.
- **Tests modified (none deleted):**
  - `refresh-regenerate-reminder-verify.test.ts`: `MAIN_BOUNDARY_SHA` re-pinned (row 1).
  - `farm-animal-loose-ends-verify.test.ts`: two T-103 loop files joined `CRITERION_21_ALLOWED` (row 2).
  - `climate-cold-trade-accepted-verify.test.ts`: the same two joined `CRITERION_22_ALLOWED` (row 3), `MAIN_TESTS_COUNT` 123 → 126 and `MAIN_TESTS_SHA` re-pinned (row 4), and the farm-animal digest re-pinned (row 5).
- **Criteria 1-22:** unchanged since the 2026-11-07 verdict below. No source
  or T-103 test file changed after it.

| Suite | Result after `2b87fea` |
|---|---|
| backend `make -C backend check` | **1209 passed, 9 skipped** |
| question-bank `bun test` | **2713 pass, 0 fail** |
| frontend `bun test` | 406 pass, 4 fail, 4 errors, all from `react-simple-maps` missing. `bun install --frozen-lockfile` gets `ProxyConnectFailed (403)` here. T-103 touches nothing under `frontend/`, so CI must confirm it |

Criterion 23 is now **met**, subject to CI on the frontend.

### Orchestrated verdict, 2026-11-07

**TL;DR. Every criterion is met: 1-19 by tests, 20-22 by `git diff`, 23 by
running the suites. The verdict is not `pass` yet.** Four question-bank
whole-tree pins are red, as the brief predicted, because T-103 added files.
They need a person to approve the Test change request above. Status: `test
changes requested`, Next step: `human`.

**Independence.** This was an orchestrated run (`runs/T-103-bank-facts-guard.md`
exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJbsZTbExMiPULZMiFd`, the
same id the expander and the worker recorded, so the Sessions check proves
nothing either way. My independence rests only on being a freshly spawned agent
with its own context. I did not see the work being done or the worker's
reasoning. That depends on the orchestrator having spawned me correctly, which I
cannot check myself, so it is weaker evidence than a separate session.

**What I added:** `backend/tests/test_t103_tester_criteria.py`, 96 tests.
Expected values come from the criteria. The dependents table is copied by hand
from this brief, not imported from the worker's `DEPENDENTS`. Each edge case
writes an edited bank to a temp file, points `store.CONTENT_FILE` at it, and
runs the real check `test_bank_fact(label)`.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `test_c1_the_committed_bank_passes[B1..B9]`, 14 cases |
| 2 | met | `test_c2_each_fact_has_its_own_node_id_carrying_its_label`: `pytest --collect-only`, so exactly one node per label and 14 distinct nodes |
| 3 | met | `test_c3_a_failing_fact_check_names_every_dependent[local\|ci]`: a real `pytest` subprocess against a bank with all 14 facts broken (B9 in a second run), with and without `CI` set (pytest truncates long explanations off CI). Each failure section contains the file and function of every row in the brief's table. `test_c3_the_table_has_fourteen_rows_and_every_named_test_exists` |
| 4 | met | `test_c4_no_fact_check_draws_serves_or_requests`: `random.*`, `Random.*`, `selection.pick_question`, `store.candidate_questions` and `httpx` `send` all patched to raise, and all 14 checks still run. `test_c4_same_result_under_any_seed[0,1,7,12345]`. `test_c4_no_router_or_draw_is_referenced_by_the_fact_module` |
| 5-18 | met | `test_c5_to_c18_one_edit_turns_its_fact_red_or_leaves_it_green[c<N>-<label>-<edit>]`: every red and green bullet. B8d's cases run for all five topics. B8c's "independent of B8a" is checked both ways (51 non-click with B8a red, and B8a red from a removed click). Also `test_c9_georgia_is_keyed_13_and_b3c_is_green`, `test_c9_a_non_texas_question_keyed_13_by_edit_stays_green`, `test_c11_committed_has_a_multiple_choice_question_with_neither_field` |
| 19 | met | `test_c19_an_edit_breaking_no_dependent_leaves_every_check_green[reword-capital, reverse-questions, add-landmark, change-source]`. `test_c19_no_hash_or_stored_copy_in_the_fact_module`: no hashing import or call, and the fact functions' integer literals are all in {0-4, 15, 16, 50, 51} |
| 20 | met | `git diff --name-status $(git merge-base origin/main HEAD) HEAD -- backend/tests/` shows only `A` lines: the two worker files plus mine. No existing file changes, so every dependent and the three B4/B6 tests are byte-identical to main |
| 21 | met | The same diff over `backend/app/ question-bank/data/` is empty |
| 22 | met | The same diff over `backend/pyproject.toml backend/uv.lock` is empty |
| 23 | **not yet** | backend `make -C backend check` (ruff, format, pytest): **1209 passed, 9 skipped**. question-bank `bun test`: **2709 pass, 4 fail**, the four stale pins in the Test change request. frontend `bun test`: 406 pass, 4 fail, 4 errors, every one `Cannot find package 'react-simple-maps'`. `bun install --frozen-lockfile` fails here with `ProxyConnectFailed (403)`, and T-103 changes nothing under `frontend/` (criterion 21's diff), so this comes from the environment. CI must confirm the frontend |

Criteria 20-22 are checked by command and not by a committed test, because
`tests/test_git_revision_guard.py` refuses `git diff` and `merge-base` in
backend tests (T-098).

**Mutation testing.** Each mutation was made to `test_t103_bank_facts.py`, my
suite was run, and the file was restored. `git status` was clean afterwards.

- **Caught (19):** dropping `funFact` from B1; B2 range 0-4; B2 distinctness
  off; B3a unknown-geometry branch off; B3b without `highlightGeometryId`; B3c
  keyed "14"; B4 without `detailExplanation`; B5 checking only the highlight;
  B6 without superlative; B7 case-sensitive; B8a `<1` instead of `!=1`; B8b
  `<1`; B8c bound 52; B8c without its no-click check; B8d floor 15; B8d
  accepting `map_click`; B9 always green; one B9 dependent dropped from
  `DEPENDENTS`; `failure_message` listing only the first 3 dependents.
- **Survived (2), both equivalent:**
  - **B2 count `!= 4` → `< 3`:** the distinctness branch (`len(set) != 4`)
    still turns 3 and 5 choices red, so the fact's behaviour does not change.
  - **B3a entity-"11" check removed:** criterion 7's edit also keys the
    `map_click` to "11", and that is still red through the key branch.
  - Neither is a gap a criterion names.

**Readings the worker flagged:** I accept all of them. None conflicts with a
criterion. Each red/green bullet behaves as the criterion says when it runs
through the real check.

**To finish (a person):** start a `tester` session you are attending for T-103,
then approve or refuse rows 1-4. That tester applies the approved rows, re-runs
all three suites, and sets `pass` / `reviewer` if they are green.

## Review

**TL;DR. Approved, inside the envelope.** Two clear, idiomatic test modules
plus the tester's suite; every role stayed in its lane; the only pre-existing
test edits are the five Test change request rows Dkaattae approved. CI is green
on `cb69690`. Swept in the next commit; PR #128 marked ready. Nothing blocks.

**Checks**

- **PR open, draft, every role present.** Expander `392bf90`/`3ba1344`
  (brief only), worker `0aa3c35`/`6e4620d`/`551315a` (`backend/tests/` + brief),
  tester `ebffd62`/`645b89c`/`2b87fea`/`e02de51` (its own test file, brief,
  and the three question-bank pins), orchestrator `runs/` + `Approved:` line.
- **Lanes.** Expander touched only `tasks/`. Tester touched no source. No
  `ci-fix` ran.
- **Constraints.** Outside `backend/tests/` (3 new files), the brief and
  `runs/`, the only changed files are the three question-bank pins, and each
  edit matches Test change request rows 1-5 exactly (`MAIN_BOUNDARY_SHA`;
  two `*_ALLOWED` sets; `MAIN_TESTS_COUNT`/`MAIN_TESTS_SHA`; one
  `APPLIED_REQUEST_FILE_SHAS` digest). Approved by a person (`Test changes:
  approved — Dkaattae, 2026-11-09`), applied in a `tester` commit. No test
  deleted.
- **Suites, re-run here.** backend `make -C backend check`: 1209 passed, 9
  skipped. question-bank `bun test`: 2713 pass, 0 fail. frontend locally: 405
  pass, 5 fail, 4 errors, all `Cannot find package 'react-simple-maps'`
  (`bun install` gets `ProxyConnectFailed (403)` here). CI's
  `frontend (typecheck, lint, test)` is **success** on `cb69690`, as are the
  other five jobs.
- **Envelope.** No dependency, no `openapi.yaml`, migration or plan change, no
  child-facing text, no product decision, no CI fix. The `Approved:
  orchestrator` stamp on the brief is the normal unattended moment-1 cost, not
  an escalation trigger.

**Quality**

- **Fits the codebase.** Pure `bank -> list[str]` functions, read from
  `store.CONTENT_FILE`, no fixtures, no network: the shape `CLAUDE.md` "Tests"
  asks for. Names follow the fact labels; bounds are named constants with the
  argument that justifies them.
- **Not more than needed.** `assert_fact`/`failure_message` and the `ast`
  dependent-exists check are small and each earns its place: the latter stops a
  renamed dependent from making a failure message point nowhere.
- **Honesty.** No fixture edited, no bound loosened to today's counts, no
  pre-existing test touched beyond the approved re-pins.

**Findings (none block)**

1. **Edge cases are written twice.** `test_t103_bank_fact_edges.py` (worker)
   and `test_t103_tester_criteria.py` (tester) both run every red/green edge
   of criteria 5-19. That is how the loop is meant to work (the tester writes
   its own tests from the criteria) and the cost is test time only, so not
   queued.
2. **The dependents table is kept by hand in `DEPENDENTS`.** A renamed
   dependent is caught; a *new* draw-dependent test is not. Accepted: the
   brief puts re-surveying out of scope, and T-102's survey is the record.
   Not queued.

**Flags disposed**

- **Worker's readings of B1, B2, B3a, B3b, B5, B8a/B8b, B8c:** accepted, as
  the tester did. Each is the stricter or the B1-owned reading, and none
  conflicts with a criterion.
- **Session ids identical across spawned roles:** owned by `process-tasks.md`
  P-14, which already describes exactly this. Nothing new to add.
- **S1-S6 follow-up:** the worker found nothing unguarded; no task created.
- **Tester's two surviving mutants (B2 `< 3`, B3a entity-"11"):** equivalent
  under the criteria, as the tester argued. Decided: no change.

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
- **Worker, 2026-11-07.** I ran this on Opus because the task is about data
  correctness and several criteria could be read more than one way.
  - **Session ids:** `echo $CLAUDE_CODE_REMOTE_SESSION_ID` returned
    `cse_011oDiJbsZTbExMiPULZMiFd`, the same id the expander recorded. In an
    orchestrated run, sub-agents seem to share the parent's remote session
    id. The tester should not take a different id as proof of a different
    session, or this id as proof of the same one. Owner: the orchestrator, or
    `process-tasks.md` if the Sessions-table check needs another key.
  - **Survey:** none of B1-B9 was already guarded as a separate check. The
    partial B4/B6 assertions the brief names are still there and unchanged.
  - **Brief vs reality:** there were no contradictions. The bank matched the
    Context figures exactly: 50 entities, 415 questions, Georgia keyed `"13"`,
    and only location `map_identify` questions carry `highlightGeometryId`.
