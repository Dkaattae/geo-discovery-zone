# T-053 — The public bank hands out the answer key by default

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** Dkaattae — 2026-11-02, "approved as written, including 10–11", given in the orchestrator's session. See `runs/T-053-answer-key-default.md`.
**Test changes:** `approved — Dkaattae, 2026-11-02` (given by the person attending tester session session_011oDiJbUGyPxtYXDq2xV2Bz; no name typed in-session)
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-053
**Branch:** `claude/magical-davinci-y58qf6`
**PR:** #117, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-02 | `cse_011oDiJctNqgXZb5TuFbpsXz` (first pass, halted on Q1–Q3) |
| task-expander | 2026-11-02 | `cse_011oDiJctNqgXZb5TuFbpsXz` (second pass, criteria written from the answers) |
| worker | 2026-11-02 | `cse_011oDiJctNqgXZb5TuFbpsXz` (subagent spawned by the orchestrator; the env var reports the parent session's id, same as the expander rows) |
| tester | 2026-11-02 | `cse_011oDiJctNqgXZb5TuFbpsXz` (fresh subagent spawned by the orchestrator; same parent id, so the id check proves nothing here) |
| tester | 2026-11-02 | `session_011oDiJbUGyPxtYXDq2xV2Bz` (attended; applied the approved test change request) |

## For the approver — read this first

**TL;DR:** Criteria written from Dkaattae's answers (Q1 a, Q2 a, Q3 accept). The
second survey found **two more places that serve a question with its key**:
`POST /sessions` (first question) and `POST /sessions/{id}/review-round`. Neither
takes `includeAnswerKey`. Criteria 10–11 extend the Q1 (a) answer to them: **key
always withheld there, no new opt-in parameter.** Strike or amend 10–11 before
approving if that is not what Q1 (a) meant.

- **Why I extended Q1 (a) instead of halting again:** the answer was "flip all
  four surfaces", and the reason given was that the key should not reach a
  client by default. The app itself calls `review-round`
  (`frontend/src/lib/api/client.ts:165`), so leaving it out would leave the key
  in the real app's network tab, which is the problem this task is meant to fix.
  Approval is the human gate anyway, so a wrong guess gets caught there.
- **Why no opt-in on those two:** no caller needs the key from them. The e2e
  suite builds its answer lookup from `GET /questions?includeAnswerKey=true`
  (`e2e/tests/app.ts:269`). The frontend grades through the server and starts
  sessions with `serveFirstQuestion: false` (`frontend/src/routes/index.tsx:133`).
  Adding a parameter would make the API bigger for no caller.
- **Small correction to the first pass:** the next-question route is
  `POST /sessions/{sessionId}/next-question`, not `/next`.

## Decisions — Dkaattae, 2026-11-02, given in the orchestrator's session

Verbatim: "Q1 a, Q2 a, Q3 accept — go with the recommendations". Relayed by the
orchestrator; recorded in `runs/T-053-answer-key-default.md`. The full questions
are in this file's history (commit `07751e7`).

- **Q1 (a):** default flips to "withheld" on every surface that takes
  `includeAnswerKey`. The parameter stays, so `true` still opts in.
- **Q2 (a):** for questions whose answer is their own entity (`map_identify`,
  superlative), the answer can still be read off `entityId`, the served `entity`
  and (`map_identify`) `highlightGeometryId`. Accept that, and say so in
  `openapi.yaml`.
- **Q3 (accept):** a `map_click` question's served `entity.geometryId` equals its
  `answerGeometryId`. Accept that and say so in the same `openapi.yaml` note.

## Survey — what is already true

- **Withholding already works when asked for.** `question_payload`
  (`backend/app/serializers.py:21-30`) omits (does not null) `correctIndex` and
  `answerGeometryId` when `include_answer_key` is false. Nothing else is removed.
- **The client already opts out.** `frontend/src/lib/api/client.ts:142-152` sends
  `includeAnswerKey: false` on every next-question call.
- **Grading does not depend on the served payload.** The answer result carries
  `correctIndex` from the stored question (`backend/app/routers/sessions.py:289-293`),
  and `Session.tsx:264` reads it from there.
- **Default `true` today, with a parameter:**
  - `GET /questions`: `content.py:171`
  - `GET /questions/{questionId}`: `content.py:205`
  - `GET /bundles/{bundleId}`: `content.py:243`
  - `POST /sessions/{sessionId}/next-question` body: `NextQuestionRequest.include_answer_key`,
    `models.py:404`, passed through at `sessions.py:191-196`
- **Always `true`, with no parameter** (new in this pass): `_serve_next`'s own
  default (`sessions.py:89`) is used by
  - `POST /sessions` when `serveFirstQuestion` is true, which is its default: `sessions.py:159`
  - `POST /sessions/{sessionId}/review-round`: `sessions.py:374`
- **`openapi.yaml` still describes the old default** in: `info.description`
  "Answer keys" (lines 49-52), `IncludeAnswerKey` (1215-1225), the next-question
  body (956-958), `Question.correctIndex` (1635: "Omitted when
  `includeAnswerKey=false`") and `Question.answerGeometryId` (1669-1674).
- **`listQuestions`' description is wrong** (lines 192-194): it says `level` +
  `levelSpan` "mirror the server's widening search". The endpoint applies one
  fixed `±levelSpan` window (`content.py:169`, `store.py:240`) and widens nothing.
- **The integration test pins the old default** on purpose:
  `backend/integration/test_stack.py:118-129`.
- **The e2e answer lookup opts in explicitly** (`e2e/tests/app.ts:269`). Its doc
  comment (line 216) says the key "still defaults to true (`tasks.md` T-053)",
  which becomes false once this task lands.
- **Unit tests that read the key off a default response** are likely in
  `backend/tests/`. Ten files mention `correctIndex`, `answerGeometryId` or
  `includeAnswerKey`. I did not run them (D-7), so I do not know which break.

## Goal

The app is built so that a wrong answer is not a failure. An answer key one tap
away in the network tab undercuts that. Grading has moved to the server, so no
response should carry the key unless the caller asks for it.

## Acceptance criteria

"Withheld" means the key **`correctIndex` and the key `answerGeometryId` are
both absent** from the question object: omitted, not present with `null`.
"Carried" means a choice-format question has an integer `correctIndex` and a
`map_click` question has a string `answerGeometryId`. Where a criterion says "no
`includeAnswerKey`", the parameter or body field is left out entirely.

**Content endpoints (public)**

1. `GET /api/v1/questions` with no `includeAnswerKey` returns a page where every
   question is withheld, including when the page holds both choice-format and
   `map_click` questions.
2. `GET /api/v1/questions?includeAnswerKey=true` returns every question carried.
3. `GET /api/v1/questions?includeAnswerKey=false` returns every question withheld.
4. `GET /api/v1/questions/{questionId}` with no `includeAnswerKey` returns the
   question withheld, both for a choice-format question and for a `map_click`
   question.
5. `GET /api/v1/questions/{questionId}?includeAnswerKey=true` returns the question
   carried, for a choice-format question and for a `map_click` question.
6. `GET /api/v1/bundles/{bundleId}` with no `includeAnswerKey` returns a bundle in
   which every entry of `questions` is withheld.
7. `GET /api/v1/bundles/{bundleId}?includeAnswerKey=true` returns a bundle in which
   every entry of `questions` is carried.

**Session endpoints (authenticated)**

8. `POST /api/v1/sessions/{sessionId}/next-question` serves `served.question`
   withheld in each of three cases: no request body, body `{}`, and body
   `{"forceReview": true}` (when the review queue is non-empty).
9. `POST /api/v1/sessions/{sessionId}/next-question` with body
   `{"includeAnswerKey": true}` serves the question carried.
10. *(Extends Q1 a — see "For the approver".)* `POST /api/v1/sessions` with
    `serveFirstQuestion` omitted (default true) returns a `served.question` that is
    withheld.
11. *(Extends Q1 a — see "For the approver".)* `POST /api/v1/sessions/{sessionId}/review-round`
    returns a `served.question` that is withheld.
12. **Re-serve follows the request, not the first serve.** A question still pending
    is served again by a second next-question call. That repeat call is withheld
    with no `includeAnswerKey`, and carried with `{"includeAnswerKey": true}`. This
    holds whichever flag the first serve used.

**What withholding removes, and what it does not**

13. For any question, the withheld object equals the carried object minus exactly
    `correctIndex` and `answerGeometryId`. Every other field keeps the same value,
    including `id`, `entityId`, `prompt`, `choices` and `highlightGeometryId`. On a
    served question, the sibling `entity` object is identical with and without the
    key. (This is the Q2/Q3 decision: the limitation is documented, not fixed.)
14. Grading is unaffected. When a question was served withheld, submitting an
    answer to it through `POST /api/v1/sessions/{sessionId}/answers` returns the
    same correct/incorrect judgment as before. For a choice-format question, the
    response still includes `correctIndex`.

**`openapi.yaml`**

15. `components.parameters.IncludeAnswerKey.schema.default` is `false`. Its
    `description` says the key is withheld unless `true` is passed. It no longer
    says the client grades locally or that `false` should be set "once grading"
    moves.
16. In the `POST /sessions/{sessionId}/next-question` request body,
    `includeAnswerKey.default` is `false`.
17. The `info.description` "Answer keys" paragraph says:
    - the key is withheld by default and `includeAnswerKey=true` opts in;
    - the first question from `POST /sessions` and questions from
      `POST /sessions/{sessionId}/review-round` are always served without it;
    - the limitation: where a question's answer is its own entity, the answer can
      be read from `entityId`, the served `entity`, and (for `map_identify`)
      `highlightGeometryId`. A `map_click` question's served `entity.geometryId`
      equals its `answerGeometryId`.

    Shape check: the paragraph contains the strings `includeAnswerKey=true`,
    `entityId`, `highlightGeometryId` and `geometryId`. It no longer contains
    "grades locally" or "once grading".
18. The `description`s of `Question.correctIndex` and `Question.answerGeometryId`
    say the field is present only when `includeAnswerKey=true`. Neither describes
    `false` as the condition for omission.
19. The `listQuestions` operation's `description` no longer contains "widening" or
    "widens". It says `level` + `levelSpan` filter to one fixed window around
    `level`.
20. `openapi.yaml` and the app still declare the same set of operations
    (`backend/tests/test_contract.py` passes unchanged).

**Tests and boundaries**

21. The integration test that pinned the old default
    (`backend/integration/test_stack.py::test_the_answer_key_can_be_withheld_from_the_public_bank`,
    which may be renamed) asserts two things: `GET /questions` with no
    `includeAnswerKey` omits `correctIndex`, and `includeAnswerKey=true` includes
    it. Its docstring no longer describes the default as `true`. This is a change
    to an existing test, so it goes through a Test change request (D-14).
22. No file changes under `frontend/`, `question-bank/`, or `backend/app/data/`.
23. Under `e2e/`, only the doc comment at `e2e/tests/app.ts:212-218` may change.
    No e2e behaviour or assertion changes.
24. `backend/app/grading.py` is unchanged.
25. No new dependency: `backend/pyproject.toml` and `backend/uv.lock` are unchanged.
26. No new or changed test reaches the network.

## Out of scope

- **Withholding `entityId`, the served `entity`, or `highlightGeometryId`**, or
  making question ids opaque. Q2 (a) chose to document this, not fix it.
  If it is wanted later, it is a new `tasks.md` entry, because it changes the
  `Question` shape and the frontend.
- **Adding an `includeAnswerKey` field to `POST /sessions` or `review-round`.**
- **Bundle caching.** `GET /bundles/{id}` returns the same `ETag` and
  `Cache-Control: public, immutable` whatever `includeAnswerKey` is. A shared
  cache could therefore serve the keyed body to an unkeyed request. That was
  already true before this task. Worth a `tasks.md` entry; not fixed here.
- How the server grades, or anything in `grading.py`.
- The bank: `backend/app/data/content.json` and `question-bank/data/`.
- Authentication on content endpoints. Content stays public.
- Removing the `includeAnswerKey` parameter.
- Any `frontend/` change, including `client.ts`'s explicit `false`. It becomes
  redundant but stays harmless.

## Constraints

- **Files expected to change:**
  - `backend/app/routers/content.py`
  - `backend/app/models.py` (`NextQuestionRequest`)
  - `backend/app/routers/sessions.py` and/or `backend/app/serializers.py`
    (wherever the defaults live)
  - `openapi.yaml`
  - `backend/integration/test_stack.py` (via Test change request)
  - new tests under `backend/tests/`
  - optionally, the comment in `e2e/tests/app.ts`
- **Existing unit tests that break because they read the key off a default
  response are stale by design.** The worker lists them under **Tests made
  stale**. The tester raises a Test change request. Neither changes them without
  a person's approval (D-14). The likely fix is to pass `includeAnswerKey=true`
  explicitly, not to delete the test. Expect this step to need an attended
  tester session.
- Touches `openapi.yaml`, so the light path is not available (`process.md`, "The
  light path").
- `openapi.yaml` follows the backend (E-14): it is updated to match, with no
  contract ceremony.
- No new dependency (`CLAUDE.md` "Packages"). No network in tests
  (`test-guidelines.md`).

## Context

- Queue entry: `tasks.md` T-053 (§E), including its "Since T-026", "Since T-089"
  and "Since T-051" amendments.
- `openapi.yaml`:
  - `info.description` "Answer keys" (49-52)
  - `listQuestions` description (187-194)
  - next-question request body (940-958)
  - `review-round` (1077 on)
  - `IncludeAnswerKey` (1215-1225)
  - `Question.correctIndex` (1632-1635) and `Question.answerGeometryId` (1667-1674)
  - `StartSessionRequest.serveFirstQuestion` (2101)
- `backend/app/serializers.py`: `question_payload`, `served_payload`.
- `backend/app/routers/content.py`: `list_questions`, `get_question`, `get_bundle`.
- `backend/app/routers/sessions.py`: `_serve_next`, `start_session`,
  `serve_next_question`, the review-round handler (~355-382), and the
  answer-result builder (~285-295).
- `backend/app/models.py`: `NextQuestionRequest`, `StartSessionRequest`.
- `backend/integration/test_stack.py::test_the_answer_key_can_be_withheld_from_the_public_bank`.
- `backend/tests/test_contract.py`: the route ↔ spec drift check.
- `e2e/tests/app.ts:210-275`: the answer lookup that opts in.
- `engineering-decisions.md`: E-14 (`openapi.yaml` follows the backend) and
  E-29 (`map_click`'s `answerGeometryId`).
- `test-guidelines.md`, and `.claude/agents/tester.md` on Test change requests.

## Handoff

*(worker)*

**TL;DR:** Default flipped to "withheld" on all six surfaces (the four with
`includeAnswerKey`, plus `POST /sessions` and `review-round`), and
`openapi.yaml` updated per 15-19. **43 existing unit tests go red by design**
(every one is a `KeyError`/assert on the key read off a default response, or a
spec-text pin), listed below. The tester needs a Test change request (D-14)
before the suite is green.

**Files changed**

- `backend/app/routers/content.py`: `includeAnswerKey` default `True` -> `False`
  in `list_questions`, `get_question`, `get_bundle`.
- `backend/app/models.py`: `NextQuestionRequest.include_answer_key` default -> `False`.
- `backend/app/routers/sessions.py`: `_serve_next(include_answer_key=False)` by
  default, plus a docstring line. `start_session` and the review-round handler
  call it without the flag, so they now always withhold (10, 11). No new parameter.
- `openapi.yaml`: `info.description` "Answer keys" paragraph rewritten (one
  paragraph, includes the Q2/Q3 limitation); `listQuestions` description;
  next-question body `includeAnswerKey.default: false` plus a description;
  `IncludeAnswerKey` parameter; `Question.correctIndex` and
  `Question.answerGeometryId` descriptions.
- `e2e/tests/app.ts`: doc comment only (lines 212-218), now says the key is
  withheld by default and the lookup opts in.
- `backend/tests/test_t053_answer_key_default.py`: new, worker's own tests
  (content defaults and opt-in, withheld == carried minus the key, session
  start/next/re-serve/grading). They pass.

**Where each criterion lives**

| # | Where |
|---|---|
| 1-7 | `content.py` defaults -> `serializers.question_payload` pops the two keys |
| 8, 9, 12 | `models.NextQuestionRequest` default; `_serve_next` uses the flag of the call in hand for a re-serve too (that was already true) |
| 10, 11 | `_serve_next` default `False`; `start_session` (`sessions.py` ~163) and review-round (~378) pass nothing |
| 13 | `question_payload` pops only those two keys; `entity` is added by `served_payload` independent of the flag |
| 14 | grading reads the stored question (`sessions.py` ~293); unchanged |
| 15-19 | `openapi.yaml` as listed above |
| 20 | `tests/test_contract.py` passes unchanged |
| 21 | **not done**: `backend/integration/test_stack.py::test_the_answer_key_can_be_withheld_from_the_public_bank` is an existing test; tester's TCR |
| 22-25 | no change under `frontend/`, `question-bank/`, `backend/app/data/`; `grading.py`, `pyproject.toml`, `uv.lock` unchanged |
| 26 | new test uses the in-process `client` fixture; no network |

**Deliberately not done**

- **`serializers.question_payload` / `served_payload` keep `include_answer_key=True`
  as their function default.** Every HTTP caller now passes the flag explicitly or
  goes through `_serve_next` (default `False`), so no response depends on it.
  Flipping it would also break `test_t051_map_click.py` line 114, which tests the
  pure function, not the HTTP default. Decided by worker; **reviewer to confirm or
  ask for the flip** (it would add one more stale test).
- Bundle `ETag`/caching not touched (Out of scope). Still worth the `tasks.md`
  entry the brief names; **reviewer's sweep to add it**.

**Contradictions with the brief:** none found. The survey's line numbers held.

**How to run**

- `cd backend && uv run pytest -q` (unit, ~1 min): 801 passed, 9 skipped,
  **43 failed** (all listed below), on this branch.
- `uv run pytest -q tests/test_t053_answer_key_default.py tests/test_contract.py`: 8 passed.
- `uv run ruff check .` and `uv run ruff format --check .`: clean.
- Not run: the integration suite (`make -C backend test-integration`, needs
  docker compose) and the e2e suite. The e2e change is a comment.

**Tests made stale**

All 43 fail because they read `correctIndex` / `answerGeometryId` off a response
that no longer carries it by default (criteria 1, 4, 6, 8, 10), except where
noted. **Proposed fix for each: pass `includeAnswerKey=true`** (query param on
content calls, `{"includeAnswerKey": true}` in the next-question body). Where a
test reads the key off `POST /sessions`' first served question (criterion 10
makes that impossible), it should start with `serveFirstQuestion: false` and
fetch via next-question with the opt-in, or read the key from
`GET /questions/{id}?includeAnswerKey=true`. Delete none.

  - `backend/tests/test_content_api.py::test_every_seeded_question_has_a_usable_answer_key`
  - `backend/tests/test_content_build.py::test_served_question_fields_equal_the_question_file`
  - `backend/tests/test_content_build.py::test_question_ids_with_colons_resolve_and_withhold_the_answer_key`
  - `backend/tests/test_content_build.py::test_reveals[location-True]`
  - `backend/tests/test_content_build.py::test_reveals[capital-False]`
  - `backend/tests/test_content_build.py::test_a_perfect_session_reaches_every_question_once[location-100-formats0]`
  - `backend/tests/test_content_build.py::test_a_perfect_session_reaches_every_question_once[capital-50-formats1]`
  - `backend/tests/test_content_build.py::test_a_perfect_session_reaches_every_question_once[mixed-100-formats2]`
  - `backend/tests/test_sessions_api.py::test_a_topic_filters_every_question_served`
  - `backend/tests/test_sessions_api.py::test_serving_advances_the_index_and_records_what_was_asked`
  - `backend/tests/test_sessions_api.py::test_a_question_can_be_served_without_its_answer_key`
  - `backend/tests/test_sessions_api.py::test_a_correct_answer_returns_the_reward_and_the_key`
  - `backend/tests/test_sessions_api.py::test_a_wrong_answer_returns_the_reason_and_queues_the_entity`
  - `backend/tests/test_sessions_api.py::test_the_profile_comes_back_advanced`
  - `backend/tests/test_sessions_api.py::test_answering_the_same_question_twice_is_refused`
  - `backend/tests/test_sessions_api.py::test_four_correct_in_a_row_raises_the_level_quietly`
  - `backend/tests/test_sessions_api.py::test_three_wrong_in_a_row_drops_the_level_without_a_message`
  - `backend/tests/test_sessions_api.py::test_a_level_change_is_absent_when_nothing_moved`
  - `backend/tests/test_sessions_api.py::test_a_milestone_offers_a_stopping_point`
  - `backend/tests/test_sessions_api.py::test_undo_backs_out_the_answer_and_its_profile_effects`
  - `backend/tests/test_sessions_api.py::test_the_question_returns_to_presenting_after_an_undo`
  - `backend/tests/test_sessions_api.py::test_the_same_answer_cannot_be_undone_twice`
  - `backend/tests/test_sessions_api.py::test_only_the_most_recent_answer_can_be_undone`
  - `backend/tests/test_sessions_api.py::test_ending_writes_the_end_level_and_reports_places_learned`
  - `backend/tests/test_sessions_api.py::test_the_summary_counts_places_learned_this_session`
  - `backend/tests/test_sessions_api.py::test_ending_twice_returns_the_same_summary`
  - `backend/tests/test_t026_tester_criteria.py::test_c46_a_new_topic_session_serves_only_that_topic_outside_review[superlative]`
  - `backend/tests/test_t026_tester_criteria.py::test_c46_a_new_topic_session_serves_only_that_topic_outside_review[wildlife]`
  - `backend/tests/test_t026_tester_criteria.py::test_c46_a_new_topic_session_serves_only_that_topic_outside_review[landmark]`
  - `backend/tests/test_t026_tester_criteria.py::test_c46_a_new_topic_session_serves_only_that_topic_outside_review[climate]`
  - `backend/tests/test_t026_tester_criteria.py::test_c46_a_new_topic_session_serves_only_that_topic_outside_review[agriculture]`
  - `backend/tests/test_t026_topics.py::test_a_correct_superlative_answer_highlights_the_answer_state`
  - `backend/tests/test_t040_tester_criteria.py::test_c13_served_question_fields_equal_the_question_file`
  - `backend/tests/test_t040_tester_criteria.py::test_c14_every_question_validates_and_its_key_is_the_files_answer`
  - `backend/tests/test_t040_tester_criteria.py::test_c20_c21_c25_a_perfect_topic_session_covers_each_state_once_with_its_reveal[location-formats0-True-100]`
  - `backend/tests/test_t040_tester_criteria.py::test_c20_c21_c25_a_perfect_topic_session_covers_each_state_once_with_its_reveal[capital-formats1-False-50]`
  - `backend/tests/test_t040_tester_criteria.py::test_c25_a_perfect_mixed_session_reaches_100_distinct_served_questions`
  - `backend/tests/test_t040_tester_criteria.py::test_c22_every_wrong_answer_names_the_answer_and_highlights_the_state`
  - `backend/tests/test_t051_map_click.py::test_listing_map_click_returns_exactly_the_served_ones`
  - `backend/tests/test_t051_tester_criteria.py::test_c9_question_has_an_optional_string_answer_geometry_id`
  - `backend/tests/test_t051_tester_criteria.py::test_c11_listing_map_click_returns_exactly_the_served_ones`
  - `backend/tests/test_t051_tester_criteria.py::test_c12_get_question_without_the_key_drops_answer_geometry_id`
  - `backend/tests/test_t051_tester_criteria.py::test_c12_a_session_serves_map_click_without_the_key_when_asked`

Special cases inside that list:

- `test_t051_tester_criteria.py::test_c9_question_has_an_optional_string_answer_geometry_id`
  asserts the spec text contains `includeAnswerKey=false`. Criterion 18 removes
  that wording. Modify it to assert `includeAnswerKey=true` instead.
- `test_t040_tester_criteria.py::test_c13_served_question_fields_equal_the_question_file`
  compares served fields to the file and now sees the key missing on 415 rows.
  Modify to opt in.
- `test_content_build.py::test_question_ids_with_colons_resolve_and_withhold_the_answer_key`
  reads the key off the default response, then checks withholding with `false`.
  Modify the first call to opt in.
- **Also stale, not in the unit run:**
  `backend/integration/test_stack.py::test_the_answer_key_can_be_withheld_from_the_public_bank`
  (line 118). It asserts `correctIndex` is present by default. Criterion 21 says
  how to rewrite it.

No count floors are affected: no test was removed.

## Test change request

*(tester, 2026-11-02.)* Every row was red after the worker's commit and green
against the pre-task `backend/app/` + `openapi.yaml` (`e2e6495`): the 43 unit
tests were re-run with those two paths checked out from `e2e6495`, 43 passed,
then restored. Each one is red for one reason only: it reads the key off a
default response (or pins the old spec wording), which criteria 1, 4, 6, 8, 10
and 18 deliberately change. The worker's list matched the red set exactly; I
found none it missed. **No row deletes a test, and no assertion is dropped.** Every
fix gets the key the way the e2e suite does: by asking for it
(`includeAnswerKey=true`). No count floor is affected.

Shared helper changes (a helper is test code, so it is listed and approved here):

- **H1** `backend/tests/test_sessions_api.py` › `answer()` helper: read the key from
  `GET /questions/{questionId}?includeAnswerKey=true` instead of from
  `served["question"]`. Nothing else in it changes. (The first question of
  `start()` is always withheld now, criterion 10, so opting in on next-question
  cannot cover it.)
- **H2** `backend/tests/test_content_build.py` › `_next()` helper: POST
  `json={"includeAnswerKey": True}`.
- **H3** `backend/tests/test_t040_tester_criteria.py` › the session-playing helper
  (the loop at ~line 410): POST next-question with `json={"includeAnswerKey": True}`;
  `all_rows()` gains an optional `**params` passed into the query.

| # | Test (file › name) | Introduced (commit, task, what it protected) | Why stale | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `backend/tests/test_content_api.py` › `test_every_seeded_question_has_a_usable_answer_key` | `de417a2`, initial FastAPI backend: every question's key is usable | c1: `GET /questions` with no flag withholds | modify | Same name and asserts; the listing passes `includeAnswerKey=true` || approved |
| 2 | `backend/tests/test_content_build.py` › `test_served_question_fields_equal_the_question_file` | `25c7847`, T-040 worker: served fields equal the file | c1 | modify | Same name and asserts; `_all(client, "/questions", includeAnswerKey="true")` || approved |
| 3 | `backend/tests/test_content_build.py` › `test_question_ids_with_colons_resolve_and_withhold_the_answer_key` | `25c7847`, T-040: colon ids resolve, `false` withholds | c1 (first listing read the key off the default) | modify | Same name and asserts; the first listing passes `includeAnswerKey=true`; the per-question `false` check is unchanged || approved |
| 4 | `backend/tests/test_content_build.py` › `test_reveals[location-True]`, `[capital-False]` | `25c7847`, T-040: reveal on right/wrong | c8 (served via `_next` with no flag) | modify | Unchanged test body; fixed by H2 || approved |
| 5 | `backend/tests/test_content_build.py` › `test_a_perfect_session_reaches_every_question_once[location-100-formats0]`, `[capital-50-formats1]`, `[mixed-100-formats2]` | `25c7847`, T-040: a perfect session covers the bank once | c8 | modify | Unchanged test body; fixed by H2 || approved |
| 6 | `backend/tests/test_sessions_api.py` › `test_a_topic_filters_every_question_served`, `test_serving_advances_the_index_and_records_what_was_asked`, `test_a_question_can_be_served_without_its_answer_key`, `test_a_wrong_answer_returns_the_reason_and_queues_the_entity`, `test_the_profile_comes_back_advanced`, `test_answering_the_same_question_twice_is_refused`, `test_four_correct_in_a_row_raises_the_level_quietly`, `test_three_wrong_in_a_row_drops_the_level_without_a_message`, `test_a_level_change_is_absent_when_nothing_moved`, `test_a_milestone_offers_a_stopping_point`, `test_undo_backs_out_the_answer_and_its_profile_effects`, `test_the_question_returns_to_presenting_after_an_undo`, `test_the_same_answer_cannot_be_undone_twice`, `test_only_the_most_recent_answer_can_be_undone`, `test_ending_writes_the_end_level_and_reports_places_learned`, `test_the_summary_counts_places_learned_this_session`, `test_ending_twice_returns_the_same_summary` (17 tests) | `de417a2`, initial backend: session lifecycle, each answers via the `answer()` helper | c8, c10: the helper reads the key off a served question | modify | Unchanged test bodies; fixed by H1 || approved |
| 7 | `backend/tests/test_sessions_api.py` › `test_a_correct_answer_returns_the_reward_and_the_key` | `de417a2`, initial backend: a correct answer returns the reward and the key | c10; also line 201 compares `result["correctIndex"]` to `served["question"]["correctIndex"]` | modify | H1, and line 201 compares `result["correctIndex"]` to the `correctIndex` of `GET /questions/{id}?includeAnswerKey=true`. Every other assert unchanged || approved |
| 8 | `backend/tests/test_t026_tester_criteria.py` › `test_c46_a_new_topic_session_serves_only_that_topic_outside_review[superlative / wildlife / landmark / climate / agriculture]` | `d201e70`, T-026 tester: a topic session serves only that topic | c8 | modify | Same name and asserts; its next-question POST sends `json={"includeAnswerKey": True}` || approved |
| 9 | `backend/tests/test_t026_topics.py` › `test_a_correct_superlative_answer_highlights_the_answer_state` | `a6e3478`, T-026 worker: superlative reveal highlights the answer state | c8 | modify | Same name and asserts; its next-question POST sends `json={"includeAnswerKey": True}` || approved |
| 10 | `backend/tests/test_t040_tester_criteria.py` › `test_c13_served_question_fields_equal_the_question_file` | `acaa4a1`, T-040 tester: served fields equal the file | c1 | modify | Same name and asserts; `all_rows(client, "/questions", includeAnswerKey="true")` (H3) || approved |
| 11 | `backend/tests/test_t040_tester_criteria.py` › `test_c14_every_question_validates_and_its_key_is_the_files_answer` | `acaa4a1`, T-040 tester: each key is the file's answer | c1 | modify | Same as row 10 || approved |
| 12 | `backend/tests/test_t040_tester_criteria.py` › `test_c20_c21_c25_a_perfect_topic_session_covers_each_state_once_with_its_reveal[location-formats0-True-100]`, `[capital-formats1-False-50]`; `test_c25_a_perfect_mixed_session_reaches_100_distinct_served_questions`; `test_c22_every_wrong_answer_names_the_answer_and_highlights_the_state` | `acaa4a1`, T-040 tester: session coverage and reveals | c8 | modify | Unchanged test bodies; fixed by H3 || approved |
| 13 | `backend/tests/test_t051_map_click.py` › `test_listing_map_click_returns_exactly_the_served_ones` | `e654042`, T-051 worker: listing returns exactly the map_click set, keyed | c1 | modify | Same name and asserts; listing params add `includeAnswerKey=true` || approved |
| 14 | `backend/tests/test_t051_tester_criteria.py` › `test_c9_question_has_an_optional_string_answer_geometry_id` | `6537059`, T-051 tester: spec text for `answerGeometryId` | c18: description must say `includeAnswerKey=true`, not `false` | modify | Same name; `assert "includeAnswerKey=true" in description` replaces the `=false` assert, and adds `assert "includeAnswerKey=false" not in description`; other asserts unchanged || approved |
| 15 | `backend/tests/test_t051_tester_criteria.py` › `test_c11_listing_map_click_returns_exactly_the_served_ones` | `6537059`, T-051 tester | c1 | modify | Same name and asserts; `_walk(client, format="map_click", includeAnswerKey="true")` || approved |
| 16 | `backend/tests/test_t051_tester_criteria.py` › `test_c12_get_question_without_the_key_drops_answer_geometry_id` | `6537059`, T-051 tester: `false` drops the key, default keeps it | c4 / c5: the default now withholds | modify | Same name. For each of the 5 ids: `includeAnswerKey=false` → no `answerGeometryId` (unchanged); **no flag → no `answerGeometryId`** (new); `includeAnswerKey=true` → `answerGeometryId` equals the file's (was the no-flag call) || approved |
| 17 | `backend/tests/test_t051_tester_criteria.py` › `test_c12_a_session_serves_map_click_without_the_key_when_asked` | `6537059`, T-051 tester: line 318 pins "default keeps the key" on the first served question | c10: `POST /sessions`' first question is always withheld | modify | Same name. First served AK question has **no** `answerGeometryId`; a next-question with `{"includeAnswerKey": true}` re-serves AK with `answerGeometryId == "02"`; then `{"includeAnswerKey": false}` re-serves AK with no `answerGeometryId`, `format == "map_click"` (unchanged asserts) || approved |
| 18 | `backend/integration/test_stack.py` › `test_the_answer_key_can_be_withheld_from_the_public_bank` | `7d1b92b`, "Put the backend under CI": opting out works while the default was undecided | c21 names this change | modify | Renamed `test_the_public_bank_withholds_the_answer_key_unless_asked`. `GET /questions?limit=1` → `"correctIndex" not in` the first row; `?limit=1&includeAnswerKey=true` → `"correctIndex" in` it. Docstring: the key is withheld by default since T-053 and `includeAnswerKey=true` opts in; no mention of a `true` default or local grading || approved |

**Decision (attended tester session, 2026-11-02):** "Approve all 18 + H1–H3".
Applied in `0c53042`.

## Verdict

*(tester, attended session `session_011oDiJbUGyPxtYXDq2xV2Bz`, 2026-11-02)*

**TL;DR: pass.** The person approved all 18 Test change request rows plus
H1–H3 in this session, and I applied exactly those rows (`0c53042`). The unit
suite is now green: **884 passed, 9 skipped, 0 failed**. Criterion 21's
integration test could not run here (no docker daemon), so CI's `integration`
job is the first real run of it.

**Approval.** Header: `Test changes: approved — Dkaattae, 2026-11-02`.
The person's words in this session, answering the request row by row:
"Approve all 18 + H1–H3". No name was typed in-session. I recorded Dkaattae
as the repo owner named in `CLAUDE.md`; correct it if someone else approved.

**Independence.** This session is not listed as worker, ci-fix or
task-expander (`session_011oDiJbUGyPxtYXDq2xV2Bz` against `cse_011oDiJctNqgXZb5TuFbpsXz`).
The criteria tests and mutation check below come from the earlier, orchestrated
tester round. As that round said, its independence was only that of a fresh
subagent. This session re-ran everything and added only the approved edits.

**Tests modified (all approved, none deleted, no assertion dropped):**

- **H1** `test_sessions_api.py` › `answer()`: reads the key from
  `GET /questions/{id}?includeAnswerKey=true` (fixes the 17 tests in row 6).
- **H2** `test_content_build.py` › `_next()`: posts `{"includeAnswerKey": true}` (rows 4, 5).
- **H3** `test_t040_tester_criteria.py` › `all_rows(**extra)` and the session loop
  opt in (row 12).
- **Rows 1, 2, 3, 8, 9, 10, 11, 13, 15:** the listing or next-question call adds the opt-in.
- **Row 7:** `correctIndex` compared against the opted-in `GET /questions/{id}`.
- **Row 14:** asserts `includeAnswerKey=true` is in the description and `includeAnswerKey=false` is not.
- **Row 16:** for each id, `false` → withheld; **no flag → withheld (new)**;
  `true` → `answerGeometryId` equals the file's.
- **Row 17:** the first served AK is withheld; `{"includeAnswerKey": true}` →
  `"02"`; `{"includeAnswerKey": false}` → withheld, still `map_click`.
- **Row 18 / criterion 21:** `integration/test_stack.py` renamed to
  `test_the_public_bank_withholds_the_answer_key_unless_asked`. No flag → no
  `correctIndex`; `includeAnswerKey=true` → `correctIndex`. The docstring no
  longer mentions a `true` default or local grading.

| # | Result | Evidence |
|---|---|---|
| 1-20, 22-26 | met | `backend/tests/test_t053_tester_criteria.py`, 40 tests, green (per-criterion table in this file's history, `249fdf9`) |
| 21 | met (unit-level), integration run pending CI | rewritten as row 18. The same two requests passed in-process against the ASGI app (throwaway test, deleted). The real docker stack was not run here: `docker info` reports no daemon |

**Runs (`backend/`, on `0c53042`):**

- `uv run pytest -q`: **884 passed, 9 skipped**. Before the edits it was 43
  failed, 841 passed, 9 skipped, the same 43 as the request (no drift).
- `uv run ruff check .` and `uv run ruff format --check .`: clean.
- Not run: `uv run pytest integration` (needs docker) and e2e (its only change
  is a comment). Both run in CI on PR #117.

**Noticed, not acted on:** `serializers.question_payload` / `served_payload`
still default `include_answer_key=True` as plain functions. Reviewer's call, as
the worker said.

## Notes

- Neither expander pass ran a build, the tests or the pipeline
  (`task-expander` role, D-7). The leak counts from the first pass (50
  `map_identify`, 47 superlative, 50 `map_click`) come from reading
  `backend/app/data/content.json`.
- `PROGRESS.md` is unchanged: nothing new is true yet.
- **Worker:** the change itself was five default flips. The cost is the 43
  stale tests: most session tests answer correctly by reading the served key.
  Expect the TCR to be large but mechanical.
- **Worker:** the Sessions table's worker row shares an id with the expander
  rows because the env var reports the orchestrator's parent session. The
  worker ran as a separate subagent. Tester to note this when checking
  isolation; orchestrator/process owner to decide whether subagent ids should be
  recorded differently.
- When this merges, `tasks.md` T-053's status line should lose its "blocked"
  wording. That is the reviewer's sweep, not an edit made here.
