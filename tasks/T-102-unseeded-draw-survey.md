# T-102 — Other backend tests may assert on an unseeded draw

**Status:** `approved`
**Next step:** `human` (merge; PR marked ready, no escalation)
**Approved:** orchestrator — 2026-11-06, unattended run. See `runs/T-102-unseeded-draw-survey.md`.
**Test changes:** approved — Dkaattae, 2026-11-06
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-102
**Branch:** `claude/fervent-ptolemy-4py2eg`
**PR:** #126, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-06 | cse_011oDiJbsZTbExMiPULZMiFd |
| worker | 2026-11-06 | cse_011oDiJbsZTbExMiPULZMiFd |
| tester | 2026-11-06 | cse_011oDiJbsZTbExMiPULZMiFd (orchestrated: shared id, freshly spawned subagent) |
| tester | 2026-11-06 | cse_011oDiJc1uVevWo55WsSei6F (attended: applied the approved Test change request) |
| reviewer | 2026-11-06 | cse_011oDiJbsZTbExMiPULZMiFd (orchestrated: shared id, freshly spawned subagent) |

## Goal

T-101 (PR #124) pinned the draw of three tests and did not check any others. This
task finds every other `backend/tests/` test whose result depends on which
question the router happens to draw, and either pins its draw or shows that it
passes whatever is drawn. The aim is that the backend suite cannot pass or fail
by chance.

## Definitions used by the criteria

- **Router serve.** A request that makes the app pick a question:
  `POST /sessions` with `serveFirstQuestion` true or left out (it defaults to
  `True`, `backend/app/models.py:362`), `POST /sessions/{id}/next-question`, or
  `POST /sessions/{id}/review-round`. All three reach
  `app.routers.sessions._serve_next` → `pick_question`
  (`backend/app/routers/sessions.py:112`).
- **Draw-dependent assertion.** An assertion whose truth can change with the
  choice `pick_question` makes from its pool. That pool is
  `store.candidate_questions` (`backend/app/store.py:249`), which has **no
  `ORDER BY`**, and the choice comes from module `random`, which nothing
  seeds. Examples: which id, entity, format or topic was served; how many
  distinct questions, states or formats a run of serves reaches; whether an
  answer built from the served question is right; `isReview`; the summary that
  follows from those answers.
- **Pinned.** The test's router serves do not depend on module `random` or on row
  order. That means the `fixed_draw` fixture (`backend/tests/conftest.py:206`),
  or a picker the test installs on `app.routers.sessions.pick_question` that
  returns a question it names (the `force` fixtures in
  `test_t051_tester_criteria.py`, `test_t093_tester_criteria.py`,
  `test_t093_undo_places_seen.py`).
- **Holds under any draw.** The assertion is true for **every** possible
  sequence of choices from the pools the test reaches. Examples: the pool has
  exactly one member, or the assertion is a property every member of the pool
  shares. "Fails with negligible probability" does **not** count.

## Acceptance criteria

1. **The survey exists.** The worker's `## Handoff` has a table with one row per
   test function in `backend/tests/` that makes at least one router serve and
   makes at least one draw-dependent assertion. Each row gives: the file and
   test name, the draw-dependent assertion or assertions (quoted or line
   numbers), and one classification: `pinned (fixed_draw)`, `pinned (force)`,
   `holds under any draw`, or `needs pin`.
2. **The survey is complete.** Every test function in `backend/tests/` that
   makes a router serve and makes a draw-dependent assertion has a row in that
   table. The tester checks this with its own survey, not from the worker's
   list. Tests that make router serves and assert only on draw-independent
   things (auth refusals, 404s, status codes on a session that is not active)
   may be left out, but the Handoff lists them by file and name, one line each,
   so leaving them out is visible.
3. **Each "holds under any draw" row gives its reason in terms of the pool.**
   For example: "topic `capital` pool, and the assertion is `topic == capital`
   for every serve", or "review pool has one member". The reason is a certainty
   argument, never a probability one. A row whose only support is "it passed N
   times" is a `fail` of this criterion.
4. **No test is left at `needs pin` when the task ends.** Every row the survey
   marks `needs pin` either runs under `fixed_draw` (or a force-style picker)
   after the task, through a Test change request a person approved (D-14,
   `process.md` step 4), or the brief records that person's decision not to pin
   it, with their reason. If the survey finds none, the Handoff says so in one
   line and no pre-existing test file changes.
5. **Pinning keeps the assertion.** A pre-existing test changed under criterion
   4 still makes every assertion it made before. The change adds the pin and
   only adjusts quantities, such as the number of serves played, where the
   pinned draw needs it, as T-101 did for c22. Nothing may be removed or
   loosened unless an approved Test change request row says exactly what and
   why.
6. **The surveyed tests pass under a perturbed draw.** Take every file in
   `backend/tests/` that contains the string `/sessions`. Run those files
   20 times, once for each pair of:
   - a module-`random` seed from 0 to 9, set with `random.seed(s)` at the start
     of every test, and
   - a candidate order: the order `store.candidate_questions` returns, or that
     order reversed.

   All 20 runs pass with zero failures and zero errors. How the perturbation is
   applied is up to the person running it, for example a throwaway pytest plugin
   passed with `-p`. It must not replace `app.routers.sessions.pick_question`,
   because that would disable the `force` and `fixed_draw` pins being tested.
   The tester reports the 20 results.
7. **Production code is unchanged.** `git diff origin/main...HEAD --
   backend/app/` is empty. Selection still draws from module `random` over the
   unordered pool. This task changes tests, not the app.
8. **T-101's pin is unchanged.** `FIXED_DRAW_SEED` stays `101`, and
   `fixed_draw`'s behaviour is unchanged: id-sorted candidates, one
   `random.Random(FIXED_DRAW_SEED)` per test, patched onto
   `app.routers.sessions.pick_question`. The three T-101 tests
   (`test_t040_tester_criteria.py` c25 and c22, and the `mixed` perfect-session
   test in `test_content_build.py`) are not modified.
9. **No new dependency.** `backend/pyproject.toml` and `backend/uv.lock` are
   unchanged. In particular, there is no `pytest-randomly` or similar plugin.
10. **The three unit suites pass:** `make -C backend test`, `cd frontend && bun
    test`, `cd question-bank && bun test`. No test reaches the network (CI's
    dead-proxy guard, `tasks.md` §A).

## Out of scope

- **`backend/integration/` and `e2e/`.** They run against a real stack, and
  their draw is a different question. If the survey finds a likely flake there,
  queue it in `tasks.md`.
- **Seeding or ordering production selection.** That includes adding `ORDER BY`
  to `store.candidate_questions`, giving the router an injected `rng`, or any
  other change under `backend/app/`. If the worker thinks production should
  change, it goes in Notes as a new task.
- **Tests that call `selection.pick_question` directly** with their own seeded
  `random.Random` (`test_selection.py`, `test_t089_tester_criteria.py`,
  `test_measure_selection.py`). They never touch the router.
- **Refactoring the existing `force` fixtures** in `test_t051_*` and `test_t093_*`
  into `conftest.py`, or merging them with `fixed_draw`.
- **Review and mastery semantics** (T-056).
- **Frontend and question-bank tests**, except for the whole-tree pins that
  criterion 10 may turn red (see Constraints).
- **Making the perturbation of criterion 6 a committed test or CI step.** It is
  a verification probe. If it should be permanent, queue that as a new task.

## Constraints

- **Files expected to change:** possibly none outside this brief. At most, test
  files in `backend/tests/` named in an approved Test change request, and
  additions to `backend/tests/conftest.py` that leave `fixed_draw` and
  `FIXED_DRAW_SEED` as criterion 8 requires.
- **The worker does not edit any pre-existing test** (D-14). It lists the
  candidates under **Tests made stale** with the proposed modification. The
  tester raises the Test change request, and a person approves it in an attended
  tester session. If the survey finds any `needs pin` row, **plan to attend the
  tester step.** Unattended, it halts at `test changes requested` / `human`.
- **Whole-tree pins (P-18).** Changes under `backend/tests/` have turned
  question-bank whole-tree digest pins red before (T-101: 5 of them). Run all
  three suites, not only the backend one, and list any pin that goes red under
  Tests made stale.
- **Postgres.** `make -C backend test-postgres` runs the same suite with a
  different row order. Criterion 6's reversed order stands in for it. The task
  does not require a Postgres run.
- **Dependencies:** none (criterion 9; [`CLAUDE.md`](../CLAUDE.md), Packages).

## Context

Required reading for the worker and the tester:

- **`tasks.md` §E, T-102.** Where this task came from. It notes that T-101's
  tester got 0 failures in 500 module seeds per test, so the T-099 failure may
  have come from row order or from random state used up earlier in the suite. A
  survey by reading will find these faster than seeding.
- **`PROGRESS.md`, "T-101 — Three mixed-session tests no longer pass or fail by
  chance".** What T-101 pinned and why c22 needed 300 serves.
- **`backend/tests/conftest.py:200-217`.** `fixed_draw` and `FIXED_DRAW_SEED`.
- **`backend/app/routers/sessions.py`.** `_serve_next` (line 83), and its
  callers `start_session` (line 146), `serve_next_question` (around line 183)
  and `start_review_round` (around line 356).
- **`backend/app/selection.py`.** `pick_question` and `review_pool`: windows
  1.5/3/6, then nearest; review every seventh serve; `chooser = rng or random`.
- **`backend/app/store.py:249`.** `candidate_questions`, which has no
  `ORDER BY`.
- **Files that request a `/sessions` path** (the scope of criterion 6, as of
  `a7945cf`): `test_content_build.py`, `test_sessions_api.py`,
  `test_t026_tester_criteria.py`, `test_t026_topics.py`,
  `test_t039_tester_criteria.py`, `test_t040_tester_criteria.py`,
  `test_t045_tester_criteria.py`, `test_t045_ungradable.py`,
  `test_t051_map_click.py`, `test_t051_tester_criteria.py`,
  `test_t053_answer_key_default.py`, `test_t053_tester_criteria.py`,
  `test_t093_tester_criteria.py`, `test_t093_undo_places_seen.py`. The list
  counts as the files that contain the string `/sessions` when the task runs.
- **`test-guidelines.md`.** The randomness and no-network guidance.
- **`process.md` step 4 and `process-decisions.md` D-14 / D-15.** How a
  pre-existing test is changed.

## Handoff

**TL;DR.** I found nothing to pin. 84 test functions in `backend/tests/` make a router serve and assert on something the draw could affect. 3 are `pinned (fixed_draw)`, 25 are `pinned (force)`, 56 `holds under any draw`, and **0 `needs pin`**. No file changed except this brief. Next is the tester. It still needs a human: the 2 whole-tree count pins under "Tests made stale" are red on this branch, so the tester session must be attended.

- **Files changed:** nothing outside this brief. Nothing under `backend/` was touched, so criteria 7, 8 and 9 hold trivially (`git diff origin/main...HEAD -- backend/` is empty).
- **Criterion 4:** the survey found no `needs pin` row, so no pre-existing test file changes.
- **Tests made stale: 2 question-bank whole-tree count pins, red before my commit.** The task's own `runs/` and `tasks/` files, added by the expander and orchestrator commits, turned them red. My change did not (P-18 again). They are listed in the section below. **They need an attended tester session**, for a Test change request that Dkaattae approves.
- **One trap for criterion 6's probe** (see "Running criterion 6" below): `test_t093_tester_criteria.py` c5 and c7 call `monkeypatch.undo()`. A probe that applies its perturbation through the test's own `monkeypatch` fixture gets silently switched off in those two tests.

### What the arguments rest on

All 415 bank questions were checked once with a throwaway script over `backend/app/data/content.json`. Each "holds" row below leans on one or more of these facts (cited as **B1**–**B9**):

- **B1.** Every question's `entityId` is one of the 50 entities, and every entity has a `name`, a `geometryId` and a reviewed `funFact`.
- **B2.** Every choice-format question (`map_identify`, `multiple_choice`) has exactly 4 distinct choices and a `correctIndex` in range. So `(correctIndex + 1) % 4` (or `% len(choices)`) is always a wrong answer.
- **B3.** Every `map_click` question has a two-digit `answerGeometryId`, no `choices`, no `correctIndex` and no `highlightGeometryId`. The wrong taps the tests use are `"02"`/`"01"` (always different from the key), `"11"` (DC, not a state code), `"13"` and `"28"` (never the key of the question they are sent to).
- **B4.** No question has `shortExplanation` or `detailExplanation`.
- **B5.** For every question, `highlightGeometryId or answerGeometryId or entity.geometryId` equals the entity's `geometryId`.
- **B6.** `reveal` is `map_highlight` for every `location` and `superlative` question, and `none` for every other topic.
- **B7.** No prompt contains "review".
- **B8.** Topic sizes: location 100 (50 `map_identify` + 50 `map_click`, one of each per state), capital 50, superlative 47, wildlife 50, landmark 44, climate 50, agriculture 74.
- **B9.** Texas (`us-state-tx`) has 9 questions, one in each of the 7 topics except agriculture, which has 2.

The facts about selection come from reading `app/selection.py` and `app/routers/sessions.py`:

- **S1.** `store.candidate_questions` narrows by topic in SQL. So for a non-`mixed` session every candidate, review serves included, is in that topic.
- **S2.** A non-review serve draws from the questions not yet asked, whenever any are left. The three windows and the nearest-level fallback all draw only from those. Repeats come only from the `recycled` branch, and only once a topic is exhausted.
- **S3.** A review serve happens only at index ≡ 6 (mod 7), or when forced. Its pool is the questions about queued entities that are not among the last 6 asked.
- **S4.** A re-serve of a pending question does not call `pick_question` at all. This covers `next-question` before answering, and after an undo.
- **S5.** Grading reads only the question and the answer body. Level moves depend only on the correct/wrong streak, never on which question was asked. Undo restores snapshots.
- **S6.** A new `/profiles` profile has an empty review queue. The demo profile `p-demo-maya` starts at level 6.0 with Texas queued, and Colorado's mastery is 0.8 (already mastered).

### The survey (criterion 1)

| # | File :: test | Draw-dependent assertion(s) | Class | Reason (for "holds") |
|---|---|---|---|---|
| 1 | `test_sessions_api.py` :: `test_starting_a_session_serves_the_first_question` | L110–115: `assert_matches` on Session/ServedQuestion, `index == 0`, `askedQuestionIds == [served id]` | holds under any draw | The served payload has the keys {question, isReview, index, phase, entity} for every bank question (B1). The index and asked list are read back from the same draw. |
| 2 | `test_sessions_api.py` :: `test_the_first_question_carries_its_entity_for_the_map` | L122 `entity.id == question.entityId` | holds under any draw | The entity is looked up by the question's own `entityId`, and it exists for every question (B1). |
| 3 | `test_sessions_api.py` :: `test_a_topic_filters_every_question_served` | L153 `topic == "capital"` ×6; `answer` helper's 200 | holds under any draw | Capital pool. Every candidate, fresh or review, is capital (S1), and every capital question is gradable (B2). |
| 4 | `test_sessions_api.py` :: `test_serving_advances_the_index_and_records_what_was_asked` | L167–168 `index == 1`, second id ≠ first | holds under any draw | Index 1 is not a review slot (S3). The fresh pool excludes the asked first id, and 414 fresh questions are left (S2). |
| 5 | `test_sessions_api.py` :: `test_asking_again_before_answering_re_serves_the_same_question` | L177–178 same id, `index == 0` | holds under any draw | A re-serve of the pending question, with no pick (S4). |
| 6 | `test_sessions_api.py` :: `test_a_question_can_be_served_without_its_answer_key` | L187–188 no `correctIndex`, no `answerGeometryId`; `answer` 200 | holds under any draw | Withholding drops both key fields whatever the format. The first answer is gradable (B2, B3). |
| 7 | `test_sessions_api.py` :: `test_a_correct_answer_returns_the_reward_and_the_key` | L199–218: correct, reward tone, a format branch, counts | holds under any draw | The answer is built from the drawn question's own key, so it is correct (B2, B3). A `map_click`'s `correctAnswer` is its entity name, because it has no choices (B3). Counts come from one correct answer (S5). |
| 8 | `test_sessions_api.py` :: `test_a_wrong_answer_returns_the_reason_and_queues_the_entity` | L226–229 correct False, reason tone, delay > 0, entity queued | holds under any draw | The wrong answer is wrong for every question (B2, B3). The queued entity is read from the served question. |
| 9 | `test_sessions_api.py` :: `test_the_profile_comes_back_advanced` | L237–239 Profile shape, answered 13, `mastery[entity] > 0` | holds under any draw | One correct answer adds 0.25 to any entity's mastery (S5). |
| 10 | `test_sessions_api.py` :: `test_answering_the_same_question_twice_is_refused` | `answer` 200; L252 409 | holds under any draw | The first answer is gradable (B2, B3). After it nothing is pending, so 409 follows for any question. |
| 11 | `test_sessions_api.py` :: `test_answering_a_question_never_served_is_refused` | L260–266 `other` ≠ served → 409 | holds under any draw | `other` is chosen to differ from the served id, and both candidate ids exist in the bank. |
| 12 | `test_sessions_api.py` :: `test_an_answer_with_no_choice_cannot_be_graded` | L290 422 | holds under any draw | With no answer field, every served format is refused. A choice format raises at `/choiceIndex`, and a `map_click` at `/tappedGeometryId` (B2, B3). |
| 13 | `test_sessions_api.py` :: `test_four_correct_in_a_row_raises_the_level_quietly` | L301–303 +0.5, level 6.5 | holds under any draw | Four answers built from each question's key are all correct. Level moves depend only on the streak (S5, S6). |
| 14 | `test_sessions_api.py` :: `test_three_wrong_in_a_row_drops_the_level_without_a_message` | L311–314 −0.5, 5.5, dropped quietly, no offer | holds under any draw | Three wrong answers for any questions (B2, B3). The streak rule depends on nothing else (S5). |
| 15 | `test_sessions_api.py` :: `test_a_level_change_is_absent_when_nothing_moved` | L322 no `levelChange` | holds under any draw | One correct answer, so no streak threshold is reached (S5). |
| 16 | `test_sessions_api.py` :: `test_a_milestone_offers_a_stopping_point` | L330 milestone 5 | holds under any draw | The milestone is `answered ∈ {5,10,20}`, and does not depend on which question (S5). |
| 17 | `test_sessions_api.py` :: `test_undo_backs_out_the_answer_and_its_profile_effects` | L346–353 204, profile restored, counts 0 | holds under any draw | Undo restores the snapshot for any question (S5). |
| 18 | `test_sessions_api.py` :: `test_the_question_returns_to_presenting_after_an_undo` | L366–368 same id, PRESENTING, index 0 | holds under any draw | The restored pending question is re-served, with no pick (S4). |
| 19 | `test_sessions_api.py` :: `test_the_same_answer_cannot_be_undone_twice` | `answer` 200; L377–378 | holds under any draw | Gradable for any question (B2, B3). The undo results depend only on the answer id. |
| 20 | `test_sessions_api.py` :: `test_only_the_most_recent_answer_can_be_undone` | `answer` 200 ×2; L389 409 | holds under any draw | Both answers are gradable (B2, B3). The 409 depends only on order. |
| 21 | `test_sessions_api.py` :: `test_a_review_round_serves_from_the_queue` | L418–421 shape, `entityId == us-state-tx`, `isReview` | holds under any draw | Review pool. The queue holds only Texas (S6), nothing has been asked yet, so the pool is Texas's 9 questions (B9). Every member is Texas and is served as review. |
| 22 | `test_sessions_api.py` :: `test_a_review_question_is_not_labelled_to_the_kid` | L469 "review" not in prompt | holds under any draw | No prompt in the bank contains "review" (B7). |
| 23 | `test_sessions_api.py` :: `test_ending_writes_the_end_level_and_reports_places_learned` | L482–488 shape, answered 2, endLevel 8, no "%" | holds under any draw | Two correct answers move no level (S5). The headline never contains "%". |
| 24 | `test_sessions_api.py` :: `test_the_summary_counts_places_learned_this_session` | L501–506 placesSeen, learned ⊆ seen, mastery > 0.7, CO not learned | holds under any draw | Location pool, and every answer is correct. `learned` is filled only when an answered entity crosses 0.7, so learned ⊆ seen, and with no wrong answers mastery never falls back under the line. Colorado starts at 0.8, so it can never cross (S6). |
| 25 | `test_sessions_api.py` :: `test_ending_twice_returns_the_same_summary` | `answer` 200; L536 equal | holds under any draw | Gradable (B2, B3). The second `end` returns stored state. |
| 26 | `test_content_build.py` :: `test_reveals` [location, capital] | L374–389 headline == funFact; highlight present/absent; wrong headline/label/highlight | holds under any draw | Topic pool (S1). Every entity has a reviewed `funFact` (B1). Location reveals `map_highlight` and capital reveals `none` (B6), and every highlight is the entity's geometry (B5). The wrong headline is "The answer is {label}." because no question has a `shortExplanation` (B4). |
| 27 | `test_content_build.py` :: `test_a_perfect_session_reaches_every_question_once` [location, capital] | L462–468 distinct == count, formats, 50 entities × count/50 | holds under any draw | New profile, so the queue is empty (S6). All answers are correct, so there are no review serves. `count` equals the topic size (B8), so S2 forces every serve to be a fresh, distinct question until the topic is exhausted. The set reached is the whole topic in any order. |
| 28 | `test_content_build.py` :: `test_a_perfect_mixed_session_reaches_100_distinct_questions_in_every_format` | L484–485 | pinned (fixed_draw) | — (T-101) |
| 29 | `test_t026_tester_criteria.py` :: `test_c46_a_new_topic_session_serves_only_that_topic_outside_review` [5 topics] | L133/143 200s, L146 topic, L147 `non_review >= 10` | holds under any draw | Topic pool: every candidate is in the topic (S1), and all are multiple choice with 4 choices (B2). Of 16 serves only indices 6 and 13 can be review (S3), so `non_review ≥ 14`. |
| 30 | `test_t026_topics.py` :: `test_a_correct_superlative_answer_highlights_the_answer_state` | L109–120 topic, 200, highlight == entity geometry | holds under any draw | Superlative pool (S1). Every question reveals `map_highlight` (B6), and its highlight is the entity geometry (B5). |
| 31 | `test_t040_tester_criteria.py` :: `test_c20_c21_c25_a_perfect_topic_session_covers_each_state_once_with_its_reveal` [location, capital] | L453–465 distinct, per-state counts, format, headline, highlight | holds under any draw | The same argument as row 27 (whole topic reached), plus B1, B5 and B6. |
| 32 | `test_t040_tester_criteria.py` :: `test_c25_a_perfect_mixed_session_reaches_100_distinct_served_questions` | L476–479 | pinned (fixed_draw) | — (T-101) |
| 33 | `test_t040_tester_criteria.py` :: `test_c22_every_wrong_answer_names_the_answer_and_highlights_the_state` | L498–509 | pinned (fixed_draw) | — (T-101) |
| 34 | `test_t045_tester_criteria.py` :: `test_c1_and_c8_drag_order_is_refused_at_order` [5] | `_pending` 200s; `_assert_refused_unchanged` 422 at `/order` ×2, state unchanged | holds under any draw | Whatever is drawn, `_pending` replaces that row's payload with `payload`, keeping only `id` and `entityId`. Grading then sees only `payload` (S5), and `"<own>"` is refused like any other order. |
| 35 | `test_t045_tester_criteria.py` :: `test_c2_and_c8_click_profile_is_refused_at_question_id` [2] | as row 34, `/questionId` | holds under any draw | As row 34. |
| 36 | `test_t045_tester_criteria.py` :: `test_c3_nearest_centroid_pin_is_graded` [10] | L202–205 200, correct, distanceKm | holds under any draw | As row 34. The distance is measured from the fixed `CENTROID`, never from the drawn entity. |
| 37 | `test_t045_tester_criteria.py` :: `test_c4_and_c8_geometry_strategy_is_refused_at_pin` [4] | as row 34, `/pin` | holds under any draw | As row 34. |
| 38 | `test_t045_tester_criteria.py` :: `test_c5_and_c8_pin_question_without_usable_target_is_refused_at_pin` [6] | as row 34, `/pin` | holds under any draw | As row 34. |
| 39 | `test_t045_tester_criteria.py` :: `test_c6_and_c8_pin_answer_without_pin_is_refused_at_pin` [4] | as row 34, `/pin` | holds under any draw | As row 34. |
| 40 | `test_t045_tester_criteria.py` :: `test_c7_multiple_choice_without_choice_index_is_422_at_choice_index` | L275 `/choiceIndex` | holds under any draw | As row 34. |
| 41 | `test_t045_tester_criteria.py` :: `test_c7_map_click_without_tapped_geometry_is_422_at_tapped_geometry_id` | L283 `/tappedGeometryId` | holds under any draw | As row 34. |
| 42 | `test_t045_ungradable.py` :: `test_a_refusal_names_its_path_and_changes_nothing` [12] | L198–211 422 at path ×2, state unchanged | holds under any draw | `_pending_as` overwrites the drawn row in the same way, so the reasoning of row 34 applies. |
| 43 | `test_t045_ungradable.py` :: `test_a_centroid_pin_is_still_graded_at_the_endpoint` | L227–230 200, wrong, ≈350 km | holds under any draw | As row 42. The distance is from the fixed `CENTROID`. |
| 44 | `test_t051_map_click.py` :: `test_a_right_tap_is_correct_and_names_the_state` | `_session_at_a_map_click` reaches a map_click in ≤ 60 serves; L202–216 | holds under any draw | Location pool on the demo profile, all answers correct. Non-`map_click` serves are either fresh `map_identify` questions (at most 50, distinct by S2) or review serves, which only happen at indices 6, 13, …, 55 (8 slots in the first 59, S3). So at most 58 serves are not `map_click`, and one must arrive by the 59th. The fresh pool is never empty, because `map_click` questions remain in it. The assertions after that hold for any `map_click` (B1, B3, B5). |
| 45 | `test_t051_map_click.py` :: `test_a_wrong_tap_queues_the_state_and_can_be_undone` | as row 44, plus L235–254 | holds under any draw | As row 44. `"11"` is DC and never a key (B3), and undo restores the snapshot (S5). |
| 46 | `test_t051_tester_criteria.py` :: `test_c12_a_session_serves_map_click_without_the_key_when_asked` | L325–347 | pinned (force) | — |
| 47 | `test_t051_tester_criteria.py` :: `test_c14_c16_c17_tapping_the_answer_is_correct` | L358–369 | pinned (force) | — |
| 48 | `test_t051_tester_criteria.py` :: `test_c15_c16_c17_every_other_state_code_and_dc_are_wrong` | L377–389 | pinned (force) | — |
| 49 | `test_t051_tester_criteria.py` :: `test_c16_the_key_from_the_served_question_is_what_grades` | L403–426 | pinned (force) | — |
| 50 | `test_t051_tester_criteria.py` :: `test_c18_no_tapped_geometry_id_is_422_and_the_question_stays_in_play` [3] | L439–448 | pinned (force) | — |
| 51 | `test_t051_tester_criteria.py` :: `test_c19_a_map_click_answer_moves_state_as_a_map_identify_answer_does` [2] | L482–503 | pinned (force) | — |
| 52 | `test_t051_tester_criteria.py` :: `test_c20_undo_restores_profile_and_session_as_for_the_other_formats` | L516–545 | pinned (force) | — |
| 53 | `test_t051_tester_criteria.py` :: `test_c20_after_an_undo_the_map_click_can_be_answered_again` | L555–562 | pinned (force) | — |
| 54 | `test_t051_tester_criteria.py` :: `test_c21_choice_formats_grade_by_choice_index_alone` [4] | L583–584 | pinned (force) | — |
| 55 | `test_t053_answer_key_default.py` :: `test_session_serves_withhold_unless_asked` | L69–101 withheld/carried by format, same id, correct | holds under any draw | Re-serves of the pending question (S4). Withhold and carry go by the question's own format (B2, B3), and the answer is built from its own key. |
| 56 | `test_t053_tester_criteria.py` :: `test_c8_next_question_without_flag_is_withheld` [2] | L171 withheld | holds under any draw | Every format drops both key fields when withheld. |
| 57 | `test_t053_tester_criteria.py` :: `test_c8_force_review_without_flag_is_withheld` | L180–181 `isReview`, withheld | holds under any draw | Review pool: Texas's 9 questions, none of them asked (S3, S6, B9). Every member is served as review. |
| 58 | `test_t053_tester_criteria.py` :: `test_c9_next_question_with_true_is_carried` | L189 carried | holds under any draw | `is_carried` checks the key field that matches the drawn question's format (B2, B3). |
| 59 | `test_t053_tester_criteria.py` :: `test_c10_start_session_default_serves_first_question_withheld` | L196–197 | holds under any draw | As row 56. |
| 60 | `test_t053_tester_criteria.py` :: `test_c11_review_round_serves_withheld` | L207–208 200, withheld | holds under any draw | Review pool of Texas, non-empty (B9). Withholding works the same for every format. |
| 61 | `test_t053_tester_criteria.py` :: `test_c12_a_re_serve_follows_the_request_not_the_first_serve` [3] | L222–232 same id, withheld/carried | holds under any draw | Re-serves (S4), and rows 56/58 apply to whichever question was drawn. |
| 62 | `test_t053_tester_criteria.py` :: `test_c12_re_serve_of_the_start_sessions_first_question_can_opt_in` | L242–244 | holds under any draw | As row 61. |
| 63 | `test_t053_tester_criteria.py` :: `test_c13_served_question_and_entity_match_with_and_without_the_key` | L278–286 | holds under any draw | The second call re-serves the first (S4). Withheld equals carried minus the key fields for every question. |
| 64 | `test_t053_tester_criteria.py` :: `test_c14_a_withheld_choice_question_grades_against_the_stored_key` [2] | L299–308 not `map_click`, correct, `correctIndex` | holds under any draw | Capital pool: every member is multiple choice with a key (S1, B2), and the answer is built from that key. |
| 65 | `test_t053_tester_criteria.py` :: `test_c14_a_withheld_map_click_question_grades_against_the_stored_key` [2] | L317–339 `map_click` within 100 serves, graded | holds under any draw | The argument of row 44, with 100 serves. At most 50 fresh `map_identify` serves plus 14 review slots (indices 6–97) come before a `map_click` must arrive. |
| 66 | `test_t093_tester_criteria.py` :: `test_c1_c4_undoing_a_first_answer_on_an_empty_list_leaves_it_empty` [6] | L157–168 | pinned (force) | — |
| 67 | `test_t093_tester_criteria.py` :: `test_c1_c4_undoing_a_first_answer_keeps_the_places_already_seen` [6] | L177–190 | pinned (force) | — |
| 68 | `test_t093_tester_criteria.py` :: `test_c2_undo_does_not_remove_a_place_an_earlier_kept_answer_saw` [2] | L201–210 | pinned (force) | — |
| 69 | `test_t093_tester_criteria.py` :: `test_c3_places_seen_is_zero_when_the_only_answer_was_undone` | L222–225 | pinned (force) | — |
| 70 | `test_t093_tester_criteria.py` :: `test_c3_places_seen_is_one_with_a_kept_answer_on_another_place` | L233–240 | pinned (force) | — |
| 71 | `test_t093_tester_criteria.py` :: `test_c5_undoing_a_review_round_answer_restores_the_seen_list` [4] | L263–276 `isReview`, `entityId == TX`, seen lists | holds under any draw | The first serve is forced. **`monkeypatch.undo()` at L258 then removes `force`, so the review round draws with the real picker.** Review pool: the queue is only Texas, because the forced CO_CAPITAL was answered correctly and AL identify was left unanswered. Texas's 9 questions are not among the asked (B9), so every member is a Texas review. `_body` grades as asked for any format (B2, B3; tap `"13"` is never Texas's `"48"`). |
| 72 | `test_t093_tester_criteria.py` :: `test_c6_re_answering_after_an_undo_counts_the_place_once` [6] | L286–296 | pinned (force) | — |
| 73 | `test_t093_tester_criteria.py` :: `test_c7_undo_still_restores_the_profile_and_the_session_fields` [6] | L309–323 | pinned (force) | — |
| 74 | `test_t093_tester_criteria.py` :: `test_c8_an_answer_with_a_pre_t093_snapshot_can_still_be_undone` | L339–399 | pinned (force) | — |
| 75 | `test_t093_tester_criteria.py` :: `test_c7_undo_of_a_review_round_answer_restores_review_round_remaining` [2] | L417–429 remaining > 0, changes, restored | holds under any draw | The first serve is forced, then `monkeypatch.undo()` at L412 leaves the review round unpinned. The pool is Texas, as in row 71. `remaining` is `min(1, len(queue)) = 1` before the answer and is decremented by any answer. Restoring it is S5. |
| 76 | `test_t093_undo_places_seen.py` :: `test_undoing_the_first_answer_leaves_an_empty_seen_list` [6] | | pinned (force) | — |
| 77 | `test_t093_undo_places_seen.py` :: `test_undoing_a_new_place_keeps_the_places_already_seen` [6] | | pinned (force) | — |
| 78 | `test_t093_undo_places_seen.py` :: `test_undo_keeps_a_place_an_earlier_kept_answer_saw` | | pinned (force) | — |
| 79 | `test_t093_undo_places_seen.py` :: `test_places_seen_is_zero_after_the_only_answer_is_undone` | | pinned (force) | — |
| 80 | `test_t093_undo_places_seen.py` :: `test_places_seen_counts_the_kept_answer_and_not_the_undone_one` | | pinned (force) | — |
| 81 | `test_t093_undo_places_seen.py` :: `test_undoing_a_review_round_answer_restores_the_seen_list` [2] | L220–230 `isReview`, `entityId == us-state-tx`, seen lists | holds under any draw | This test does **not** request `force`. Nothing has been served (`serveFirstQuestion: False`) and the queue is only Texas (S6), so the review pool is Texas's 9 questions. `_body` grades as asked for any format (B2, B3). |
| 82 | `test_t093_undo_places_seen.py` :: `test_re_answering_after_an_undo_counts_the_place_once` | | pinned (force) | — |
| 83 | `test_t093_undo_places_seen.py` :: `test_undo_still_restores_profile_counts_level_learned_and_review_round` | | pinned (force) | — |
| 84 | `test_t093_undo_places_seen.py` :: `test_an_answer_with_a_pre_t093_snapshot_can_still_be_undone` | | pinned (force) | — |

Rows 76–84 leave the assertion column blank: every serve in those tests is forced (`force["id"]` is set before each `_start`/`_next`), so the assertions cannot depend on the draw.

**Totals:** 84 rows: 3 `pinned (fixed_draw)` (rows 28, 32, 33), 25 `pinned (force)`, 56 `holds under any draw`, **0 `needs pin`**.

### Left out on purpose (criterion 2)

These make a router serve, or try to, but assert only on things the draw cannot affect:

- `test_sessions_api.py` :: `test_another_account_cannot_read_a_session`. It serves, but the assertion is a 404 for another account.
- `test_sessions_api.py` :: `test_the_level_defaults_to_where_the_last_session_ended`. It serves, but checks only the session level and its label, which are set before the pick.
- `test_sessions_api.py` :: `test_an_explicit_level_wins`. It serves, but checks only the session level.
- `test_sessions_api.py` :: `test_answering_an_unknown_question_is_a_404`. It serves, then answers `q-nope` and gets a 404.
- `test_sessions_api.py` :: `test_undoing_an_unknown_answer_is_a_404`. It serves, then undoes `a-nope` and gets a 404.
- `test_sessions_api.py` :: `test_a_review_round_is_capped_by_the_queue`. It serves, but `remaining` is `min(5, 1) - 1 = 0` whatever is drawn.
- `test_sessions_api.py` :: `test_an_ended_session_serves_nothing_more`. The 409s come from the session not being active.

These request `/sessions` but make no router serve at all: `test_session_endpoints_need_a_token` (401), `test_a_session_cannot_be_started_for_another_accounts_profile` (404 before serving), `test_a_session_can_start_without_serving`, `test_a_review_round_needs_something_to_review` (409 before serving), `test_a_review_round_is_never_longer_than_five` (422 validation), and `test_an_unknown_session_is_a_404`, all in `test_sessions_api.py`. `test_t039_tester_criteria.py` mentions `/sessions` only as spec path strings and makes no request to it.

**Files with no router serve:** I grepped every `backend/tests/*.py` for `next-question`, `review-round`, `/sessions` and `routers.sessions`. Only the 14 files the brief lists contain the string `/sessions`. `test_t089_tester_criteria.py` matches only on a spec description, and `test_profiles_api.py` mentions sessions only through `lastSessionEndLevel`.

### Where each criterion stands

| # | Status after the worker | Where |
|---|---|---|
| 1 | Survey table above | this Handoff |
| 2 | Table plus the exclusion list | this Handoff. The tester re-surveys independently. |
| 3 | Every "holds" row cites a pool and the B/S facts. None rests on a pass count. | table |
| 4 | No `needs pin` row, so no pre-existing test file changes | — |
| 5 | Not applicable: nothing was pinned | — |
| 6 | Ran by the worker as a cross-check, 20/20 pass (results below). The tester must run its own. | Notes |
| 7 | `backend/app/` untouched | `git diff origin/main...HEAD -- backend/app/` |
| 8 | `conftest.py` untouched | — |
| 9 | `pyproject.toml` and `uv.lock` untouched | — |
| 10 | All three suites run, results below | Notes |

### Running criterion 6

The probe I used is a throwaway plugin, not committed. A minimal version:

```python
# drawprobe.py — put its directory on PYTHONPATH and pass `-p drawprobe`
import os, random, pytest
SEED = int(os.environ["PROBE_SEED"]); REVERSE = os.environ.get("PROBE_REVERSE") == "1"

@pytest.fixture(autouse=True)
def _probe():
    import app.store as store
    mp = pytest.MonkeyPatch()            # its own instance, NOT the test's `monkeypatch`
    if REVERSE:
        orig = store.candidate_questions
        mp.setattr(store, "candidate_questions", lambda db, t: list(reversed(orig(db, t))))
    random.seed(SEED)
    yield
    mp.undo()
```

```bash
cd backend
FILES=$(grep -l "/sessions" tests/*.py)
PYTHONPATH=<probe dir> PROBE_SEED=$s PROBE_REVERSE=$r uv run pytest -q -p drawprobe $FILES
```

**The trap: use a private `MonkeyPatch`.** `test_t093_tester_criteria.py` c5 and c7 call `monkeypatch.undo()`. If the probe patched `candidate_questions` through the test's `monkeypatch` fixture, that call would silently remove the reversal before the review round, which is the one unpinned serve in those tests. I hit this in my first version of the probe and replaced it.

Patching `app.store.candidate_questions` works because the router calls it as `store.candidate_questions(...)`. `fixed_draw` sorts candidates by id, so the reversal has no effect on its three tests, which is intended.

- **Deliberately not done:** I committed no probe and added no CI step, both out of scope.
- **Not done either:** no Postgres run. The brief does not require one.

### Tests made stale

These were not made stale by this worker. I checked by stashing my brief edit and re-running: both are red at `93b1c4a`, the branch as the expander and orchestrator left it. They go red because `git diff --name-status origin/main...HEAD` adds two files, `runs/T-102-unseeded-draw-survey.md` and `tasks/T-102-unseeded-draw-survey.md`, and each of these tests counts tracked non-test files outside its allowed list.

| File | Test (describe › test) | Why red | Proposed |
|---|---|---|---|
| `question-bank/src/farm-animal-loose-ends-verify.test.ts` | `T-096 criteria 17-21: the bank and the boundaries` › `criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added` | Line 602 expects `283` and gets `285`: the two T-102 files above. | Modify. Re-pin the count to the value CI sees on this branch at merge: **285** while both files are tracked, **284** if the sweep removes the brief first. Follow whatever T-101's re-pin rows did for the same pin. |
| `question-bank/src/climate-cold-trade-accepted-verify.test.ts` | `T-091 criterion 22: the diff touches only the allowed files` › `every tracked non-test file outside the allowed list is 12d242e's, and none is added` | `MAIN_UNTOUCHABLE_COUNT` (line 101) is `286`, and the branch gives `288`, for the same two files. | Modify. `MAIN_UNTOUCHABLE_COUNT` becomes **288** (or **287**, as above). |

**Owner:** the tester raises the Test change request, and Dkaattae approves it in an attended session (D-14). The run should not count on an unattended tester passing.

## Test change request

Raised by the tester, 2026-11-06, in an orchestrated (unattended) run. **No test below has been changed.** The rows follow the precedent T-091 row 5 set and every task since has followed, through T-101 rows 4, 5 and 8: a task's own loop records join the allowed set. I checked them in a throwaway worktree, not committed. With rows 1-3 applied, `cd question-bank && bun test` gave **2713 pass, 0 fail**. Without them it gives 2711 pass and 2 fail.

**Why this differs from the worker's proposal.** The worker proposed re-pinning the counts to 285 and 288. That would pass on this branch but go red as soon as the sweep deletes the brief, and again on main. Adding the two loop records to the allowed set keeps the count (283, 286) and the digest pinned exactly as before. Both files are new, so nothing that was counted before leaves the counted set.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `T-096 criteria 17-21: the bank and the boundaries` › `criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added` | `47581ea`, T-096 tester. It guards that no tracked non-test file outside T-096's allowed set changes or is added. | This task adds two new tracked files, its own loop records `tasks/T-102-unseeded-draw-survey.md` and `runs/T-102-unseeded-draw-survey.md`. So `rest.length` is 285, not 283. | modify | Same test, same name, same assertions: `rest.length` is still **283** and `fileRowsSha(rest)` is still `MAIN_UNTOUCHABLE_SHA` (unchanged). The only change: `CRITERION_21_ALLOWED` gains `"tasks/T-102-unseeded-draw-survey.md"` and `"runs/T-102-unseeded-draw-survey.md"`, after the T-101 entries, with a comment `// T-102's loop records, joined through T-102's Test change request row 1 (approved by <name>, <date>, in the attended tester session that made the edit).` | approved — Dkaattae, 2026-11-06 |
| 2 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › `every tracked non-test file outside the allowed list is 12d242e's, and none is added` | `950f334`, T-091 tester. The same whole-tree guard, for T-091's allowed set. | The same two new files. `rest.length` is 288, not `MAIN_UNTOUCHABLE_COUNT` = 286. | modify | Same test, same assertions. `MAIN_UNTOUCHABLE_COUNT` stays **286** and `MAIN_UNTOUCHABLE_SHA` is unchanged. `CRITERION_22_ALLOWED` gains the same two paths after the T-101 entries, with the same comment, naming row 2. | approved — Dkaattae, 2026-11-06 |
| 3 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › `each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only` | `bac230d`, T-091 tester (review finding 1). It pins the exact bytes of each test file an approved request changed, so nothing besides an approved row edits them. | Row 1 changes the bytes of `farm-animal-loose-ends-verify.test.ts`, so its entry in `APPLIED_REQUEST_FILE_SHAS` no longer matches. This is a cascade of row 1, as T-101 row 8 was. | modify | Same test, same assertion: `now` deep-equals `APPLIED_REQUEST_FILE_SHAS`. Only the `farm-animal-loose-ends-verify.test.ts` value changes, from `f199d230…25dfa7` to the sha256 of that file **exactly as row 1 leaves it**. The value depends on the name and date written into row 1's comment, so compute it at apply time, after row 1. The comment chain gains `, then by T-102 (row 3)`. Every other entry is unchanged. | approved — Dkaattae, 2026-11-06 |

No count floor is involved: nothing is deleted.

To approve: start the `tester` step for T-102 in a session you are attending, and answer row by row there.

## Verdict

**Pass.** Dkaattae approved Test change request rows 1-3 in an attended tester session. I applied them in `ee83a62`, and all of criterion 10 now holds: backend and question-bank are green here, and frontend relies on CI as before.

**Approval.** `Test changes: approved — Dkaattae, 2026-11-06`. Each row was put to Dkaattae in this session, and they answered "Approve" to row 1, "Approve" to row 2 and "Approve" to row 3. They gave the name "Dkaattae" for the record.

**Tests modified (no deletions, no floor involved):**
- **Row 1**, `farm-animal-loose-ends-verify.test.ts` › criterion 21: `CRITERION_21_ALLOWED` gains `tasks/T-102-unseeded-draw-survey.md` and `runs/T-102-unseeded-draw-survey.md`. Count 283 and `MAIN_UNTOUCHABLE_SHA` are unchanged.
- **Row 2**, `climate-cold-trade-accepted-verify.test.ts` › T-091 criterion 22, allowed-files test: `CRITERION_22_ALLOWED` gains the same two paths. `MAIN_UNTOUCHABLE_COUNT` 286 and the sha are unchanged.
- **Row 3**, the same file › applied-request shas test: the farm-animal entry is re-pinned from `f199d230…25dfa7` to `2a241617…cd1cbe3`, the file exactly as row 1 left it. No other entry changed.

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1-9 | as in the round-3 verdict below | met | Unchanged by `ee83a62`, which touches only the two question-bank test files. |
| 10 | Three suites pass | **met** | Backend: `make -C backend check` gave **1039 passed, 9 skipped** (lint and format clean). Question-bank: `bun test` gave **2713 pass, 0 fail**. Frontend: see below. |

**Frontend, as before, could not run fully here.** `bun install --frozen-lockfile` gets `ProxyConnectFailed (403)` on the d3 / `react-simple-maps` tarballs, so 4 files error on import. No frontend file differs from main, and CI `frontend` was green on `1c4995e`. CI on this push is the evidence for that suite.

**Environment note.** Question-bank first ran with `node_modules` missing (12 lint-gate failures, "oxlint: command not found"). `bun install --frozen-lockfile` fixed that, and it changed no tracked file.

### Round 3 (orchestrated, before approval)

**Not yet a verdict: halted at `test changes requested` / `human`.** I verified every criterion that does not depend on the stale pins: 1-9 hold, my own survey matches the worker's 84 rows, and the perturbation probe passed 20 of 20 runs. Criterion 10 is blocked on the question-bank suite. Its only 2 failures are the stale whole-tree pins in the Test change request above, which need Dkaattae's approval in an attended tester session.

**Independence.** This was an orchestrated run, so my session id (`cse_011oDiJbsZTbExMiPULZMiFd`) is the same as the expander's and the worker's. That is not evidence of separation either way. My independence rests only on being a freshly spawned subagent with its own context: I did not see the worker's session or its reasoning, only what is committed. That is weaker than a separate session, because it rests on the orchestrator having spawned me correctly.

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Survey exists | met | Handoff table, 84 rows, each with file::test, assertions and one class. |
| 2 | Survey complete | met | My own instrumented survey, below. |
| 3 | "Holds" reasons are certainty arguments | met | I re-derived every "holds" row from `selection.py`, `grading.py`, the router and the bank. None rests on a pass count. |
| 4 | No `needs pin` left | met | My survey found none, and no pre-existing test file changes. |
| 5 | Pinning keeps assertions | n/a | Nothing was pinned. |
| 6 | 20 perturbed runs pass | met | 20/20, 374 passed each, 0 failed, 0 errors. |
| 7 | `backend/app/` unchanged | met | `git diff origin/main...HEAD -- backend/app/` is empty. |
| 8 | T-101 pin unchanged | met | `FIXED_DRAW_SEED = 101` (conftest.py:202). `backend/tests/` diff is empty. |
| 9 | No new dependency | met | The `pyproject.toml` and `uv.lock` diff is empty. |
| 10 | Three suites pass | **blocked on rows 1-3** | Backend green. Question-bank has 2 fails, both stale pins. Frontend is green in CI; it could not be run fully here. |

**Criterion 2, my own survey.** I did not rely on reading alone. A throwaway pytest plugin (not committed) wrapped `store.candidate_questions` and the router's original `pick_question` binding. It counted, per test, how many picks happened and how many went through the unpinned picker. I ran it over **all** of `backend/tests/` (1039 passed, 9 skipped).
- **93 test functions call `candidate_questions`.** All are in the 14 `/sessions` files, and no other file makes a router serve.
- **2 of the 93 are not router serves.** `test_t051_tester_criteria.py::test_c13_location_and_mixed_pools_hold_every_map_click` and `::test_c13_no_other_topic_pool_holds_a_map_click` call `store.candidate_questions` directly, so they are rightly absent.
- **The other 91 match the Handoff exactly:** the 84 table rows plus the 7 listed exclusions. I read each of the 7 exclusions and agree they are draw-independent (404s, levels set before the pick, `remaining = min(5,1)-1`, 409 on an ended session).
- **Every `pinned (force)` and `pinned (fixed_draw)` row made 0 unpinned picks.** The rows with unpinned picks are exactly the 56 "holds" rows.
- **The two mixed rows are confirmed as "holds".** `test_t093_tester_criteria.py` c5 and c7 (rows 71, 75) and `test_t093_undo_places_seen.py` row 81 make unpinned picks, and those are the review-round serves.

**Criterion 3, the facts the arguments rest on.** I checked the bank myself over `backend/app/data/content.json`, which the test DB loads:
- **Sizes:** 415 questions and 50 entities. Topic sizes are as B8.
- **Choice formats:** every one has 4 distinct choices and a `correctIndex` in range (B2).
- **`map_click`:** every one has a 2-digit key, with no choices, index or highlight (B3).
- **Explanations, prompts, highlights, reveals:** no `short`/`detailExplanation` (B4), no prompt containing "review" (B7), highlight fallback = entity geometry for all (B5), reveal by topic as B6.
- **Texas:** 9 questions (B9), key `48`.
- **Wrong-answer keys:** the taps `13`, `28`, `01`, `02` occur as keys only where the tests already branch around them.

From the code:
- **Pools and review cadence:** S1-S3 hold (`selection.py:51-91`).
- **Re-serve:** S4 holds (`sessions.py:100-110`). The review round clears `pending` first (`sessions.py:376`).
- **Grading:** S5 holds (`grading.py:166-246`: level by streak, milestone by count, `offerReview` false on a wrong answer).
- **Demo profile:** S6 holds (`store.py:512-513`).

**The map_click bounds are certain.**
- **`_session_at_a_map_click`:** its 60 iterations see indices 0..59. At most 50 can be fresh `map_identify` and at most 8 are review slots (6, 13, …, 55), so 58 < 60.
- **t053 c14:** at most 50 + 14 = 64 < 100.

**Criterion 6, how I perturbed the draw.** My own plugin, `-p tprobe`, not committed:
- **Seed:** `random.seed(s)` in a `tryfirst` `pytest_runtest_call` hook, so it runs at the start of every test body.
- **Reversal:** `store.candidate_questions` is replaced at `pytest_configure` by a plain module attribute that returns `list(reversed(...))`. No test's `monkeypatch.undo()` can remove it, which covers the t093 c5/c7 trap.
- **`pick_question` is never replaced.** The plugin reported, per run, the number of reversed calls (about 1200) and of seeded tests (374).

| order | s=0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| store order | 374 pass | 374 | 374 | 374 | 374 | 374 | 374 | 374 | 374 | 374 |
| reversed | 374 pass | 374 | 374 | 374 | 374 | 374 | 374 | 374 | 374 | 374 |

All 20 runs had 0 failed and 0 errors. Extra, not required: I replaced `app.selection`'s module `random` with adversarial choosers. One always took the first member, one the last, and one avoided `map_click` whenever it could, to attack the map_click bounds. All three gave 374 passed.

**Criterion 10, the suites as run:**
- **Backend:** `make -C backend check` (ruff lint, format check, pytest) gave **1039 passed, 9 skipped**. CI on `1c4995e` is green for `backend (lint, format, test)`, for `backend (postgres)` (real row-order variation) and for integration and e2e.
- **question-bank:** `bun test` gave **2711 pass, 2 fail**. The 2 are Test change request rows 1 and 2. With rows 1-3 trial-applied it gave 2713 pass, 0 fail. CI `question-bank` is red on `1c4995e` for the same reason.
- **Frontend:** `bun test` here gave 387 pass and 9 fail. `react-simple-maps` is missing from `node_modules`, so 3 files error on import, and the lint-gate tests time out at 5 s. No frontend file differs from main. CI `frontend (typecheck, lint, test)` is **green** on `1c4995e`, and I take that as the frontend evidence. `git status` was clean after the run, so the `frontend/README.md` rewrite the worker saw did not recur.

**To resume:** start the `tester` step for T-102 in a session you are attending. It confirms the request with you row by row and applies the approved rows as `T-102 tester: apply approved test change request`. It then re-runs all three suites and writes the final verdict. On approval of all three rows, I expect `pass`.

## Review

**Approve, inside the envelope: mark ready, no escalation.** The survey is careful, and the tester checked it independently by instrumenting the suite rather than re-reading it. The only code change is three Test change request rows that Dkaattae approved, applied in exactly the T-101 shape. Nothing blocks.

**PR completeness.** Every Sessions row has a commit on this branch: expander `2efe856`/`f2414e0`, worker `3f17a70`, tester `e447605`, attended tester `ee83a62`/`e52b7d7`, orchestrator logs.

**Lanes.**
- **Expander:** touched only `tasks/`. The orchestrator touched only `runs/` and the brief's `Approved:` line.
- **Worker:** touched only the brief.
- **Tester:** `ee83a62` changes only the two question-bank test files named by rows 1-3. Each edit matches its row: two paths added to each allowed set, count and digest unchanged, and the farm-animal sha re-pinned to `2a241617…cd1cbe3`, which I checked is the sha256 of the file as committed.
- **ci-fix:** none ran.

**Fit and scope.**
- **No source, no dependency, no backend test changed.** `git diff origin/main...HEAD -- backend/` is empty, so criteria 7-9 hold trivially.
- **The tester's allowed-set route beats the worker's re-pin.** Re-pinning the counts to 285/288 would have gone red again the moment the sweep deletes the brief. It follows T-091 row 5 and T-101 rows 4, 5 and 8.
- **Spot-check:** I re-counted the bank facts the map_click bounds rest on: 50 `map_identify` and 50 `map_click` in location, Texas with 9 questions, and no prompt containing "review". All as the Handoff says.

**Findings (none blocking):**
1. **The "holds under any draw" rows rest on bank facts nothing guards.** 56 rows lean on B1-B9, a snapshot of `backend/app/data/content.json`. If the bank changes (a refresh, a new topic, a first `shortExplanation`), some of those certainty arguments can quietly become probability arguments, and nothing would say so. No task owns this, so I queued **T-103** in `tasks.md` §E, sized S.
2. **A survey-only task still needed an attended tester round.** It changed no source, but its own brief and run log turned 2 whole-tree count pins red. That is P-17's pattern in its purest form, so I added it as a recurrence note on **P-17** in `process-tasks.md` rather than opening a new P ticket. (P-18 does not fit: this brief named all three suites, and the worker caught the pins.)

**Flags disposed:**
- **Worker, rows 71/75 (t093 c5/c7 classed as "holds", not "pinned"):** the tester confirmed it by instrumentation. **Decided:** "holds" is correct.
- **Worker, the probe's `monkeypatch.undo()` trap:** the tester's probe patches at `pytest_configure`, so the trap does not apply. **Closed.**
- **Worker, `frontend/README.md` rewritten by a test run:** this is T-076's open question, and its fifth sighting. **Deferred to T-076**, amended with this sighting.
- **Tester, frontend suite not runnable locally (proxy 403):** CI is the evidence. I checked CI before marking ready.

## Notes

**Expander, already true at `a7945cf`:**
- Three tests are pinned by `fixed_draw` (T-101).
- `test_t051_tester_criteria.py`, `test_t093_tester_criteria.py` and
  `test_t093_undo_places_seen.py` install their own `force` picker on
  `app.routers.sessions.pick_question` (lines 287, 75 and 37), so the tests
  that use it are already pinned.
- The likely work is the survey itself, plus whatever unpinned
  `test_sessions_api.py`, `test_t026_*`, `test_t040_*`, `test_t053_*` and
  `test_content_build.py` tests it turns up. I did not run anything (D-7), so I
  make no claim about which of them fail.

**Worker, 2026-11-06:**
- **Survey by reading found no `needs pin`.** I read the 14 files that request `/sessions`, together with `selection.py`, the sessions router, `grading.py` and the committed bank. Every unpinned draw-dependent assertion holds for one of three reasons:
  - **The topic pool forces it** (S1), or the topic is played to exhaustion, so the set reached does not depend on order (S2).
  - **The review pool is only Texas** on the demo profile (S6, B9).
  - **The answer is built from the drawn question's own key,** and every bank question is gradable both ways (B2, B3).

  The two "within N serves a `map_click` arrives" loops (`test_t051_map_click`, `test_t053` c14) are certain, not merely likely. At most 50 fresh `map_identify` serves plus the review slots fit inside N (58 ≤ 59, and 64 ≤ 99).
- **Unpinned review rounds in tests that also use `force`.** `test_t093_tester_criteria.py` c5 and c7 request `force`, then call `monkeypatch.undo()`, so their review-round serve uses the real picker. I classed them `holds under any draw` (rows 71 and 75), not `pinned (force)`. Reason: the review pool is all Texas. **Tester to confirm or overturn.**
- **The criterion 6 probe could be silently disabled.** The same `monkeypatch.undo()` removes any perturbation the probe installed through the test's `monkeypatch` fixture. My first probe did exactly that, so the probe described in the Handoff uses a private `pytest.MonkeyPatch()`. **Tester to use a probe of that shape, or to explain why theirs is unaffected.**
- **Probe results (worker's cross-check, not the tester's evidence):** the 14 files, 374 tests per run.
  - **20 of 20 runs passed:** seeds 0–9 × {store order, reversed}, 0 failed and 0 errors in each. Rev=1 seeds 0–3 were re-run after the private-`MonkeyPatch` fix, and passed again.
  - **Extra adversarial runs, also all passed:** `random.choice` forced to always take the first member, then the last, each with both candidate orders (4 runs).
- **Suites at `93b1c4a` plus this brief:**
  - **Backend:** `make -C backend check` (ruff lint, format check, pytest) gave 1039 passed, 9 skipped.
  - **question-bank:** `bun test` gave 2711 pass, 2 fail. Both failures are the count pins under "Tests made stale", and both are already red without my edit. Lint is clean.
  - **Frontend:** `bun test` could not be run fully here. `bun install --frozen-lockfile` fails with `ProxyConnectFailed (403)` on tarballs that `bun.lock` pins to `europe-west1-npm.pkg.dev/lovable-core-prod/...` (for example d3-timer@2.0.0 and d3-dispatch@2.0.0). So `react-simple-maps` is missing and its importers error, along with the lint-gate tests that need the full tree. This is environmental: no frontend file differs from main. CI is the check for the frontend.
- **A test run modified a tracked file once.** After my first, pre-install run of the frontend and question-bank suites, `frontend/README.md` had one line changed, `2 * gradeOf` escaped to `2 \* gradeOf`. That looks like a `prettier --write` reaching it, probably the frontend format-gate test running while dependencies were missing. I reverted it with `git checkout`, and later runs did not reproduce it. Not queued. **Reviewer to decide whether it deserves a `tasks.md` entry.**
- **Same session id as the expander.** The orchestrator ran the expander and this worker in session `cse_011oDiJbsZTbExMiPULZMiFd`, so my Sessions row repeats the expander's id. The tester must run in a different session.
- **No production change is proposed.** The unordered pool and unseeded `random` are fine for the app. The tests that care are pinned or certain.

