# T-053 — The public bank hands out the answer key by default

**Status:** `approved`
**Next step:** `worker`
**Approved:** Dkaattae — 2026-11-02, "approved as written, including 10–11", given in the orchestrator's session. See `runs/T-053-answer-key-default.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-053
**Branch:** `claude/magical-davinci-y58qf6`
**PR:** #117, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-02 | `cse_011oDiJctNqgXZb5TuFbpsXz` (first pass, halted on Q1–Q3) |
| task-expander | 2026-11-02 | `cse_011oDiJctNqgXZb5TuFbpsXz` (second pass, criteria written from the answers) |

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

## Verdict

*(tester)*

## Notes

- Neither expander pass ran a build, the tests or the pipeline
  (`task-expander` role, D-7). The leak counts from the first pass (50
  `map_identify`, 47 superlative, 50 `map_click`) come from reading
  `backend/app/data/content.json`.
- `PROGRESS.md` is unchanged: nothing new is true yet.
- When this merges, `tasks.md` T-053's status line should lose its "blocked"
  wording. That is the reviewer's sweep, not an edit made here.
