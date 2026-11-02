# T-053 — The public bank hands out the answer key by default

**Status:** `questions answered`
**Next step:** `task-expander`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-053
**Branch:** `claude/magical-davinci-y58qf6`
**PR:** #117, opened draft at expand time, built from the branch above
**Fault:** the queue entry reserves the default as a product decision ("The decision here is the product one"), and the survey found the leak is wider than `correctIndex`, so no criterion can be written without a person's call — owned by `human`.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-02 | `cse_011oDiJctNqgXZb5TuFbpsXz` |

## Why this brief is blocked

**TL;DR:** T-053 is the first queue entry with `Depends on: —`. Its entry says
outright that the default is a product call, and the survey found that hiding
`correctIndex` hides the answer for under half the served bank. Three questions
below. I give a recommendation for each, but I have not acted on any of them.

**Why T-053 and not something else.** Pick rule (`process.md` §1): first entry
whose dependencies are done. Above it, T-085b waits on Census access, T-056 on a
design decision, T-095 on a person's choice between (a)/(b)/(c). T-053 is next.
T-093 and T-046 below it are also decisions; **T-047** is the first entry needing
none. I did not switch to it: a halted expander does not pick a different task.

## Survey — what is already true

- **The client already opts out.** `frontend/src/lib/api/client.ts:142-152` sends
  `includeAnswerKey: false` on every next-question call, and the server grades
  (`POST /sessions/{sessionId}/answers`).
- **Four surfaces default to `true`:**
  - `GET /questions` — `backend/app/routers/content.py:171`
  - `GET /questions/{questionId}` — `content.py:205`
  - `GET /bundles/{bundleId}` — `content.py:243`
  - `POST /sessions/{sessionId}/next` body — `NextQuestionRequest.include_answer_key`,
    `backend/app/models.py:404`, used at `backend/app/routers/sessions.py:89,196`
- **What withholding removes today:** `correctIndex` and `answerGeometryId`,
  nothing else (`backend/app/serializers.py:21-30`, `question_payload`).
- **`openapi.yaml` already says to flip it**, in three places: `info.description`
  "Answer keys" (lines 49-52: "Set `includeAnswerKey=false` once grading moves
  to `POST /sessions/{sessionId}/answers`"), the `IncludeAnswerKey` parameter
  (lines 1216-1225, `default: true`), and the next-question body
  (lines 956-958, `default: true`).
- **The e2e suite depends on being able to opt in, not on the default.**
  `e2e/tests/app.ts:269` passes `includeAnswerKey: "true"` explicitly to build its
  answer lookup; its comment at line 216 cites T-053. So the parameter must keep
  existing whatever is decided.
- **The pinning integration test** is
  `backend/integration/test_stack.py::test_the_answer_key_can_be_withheld_from_the_public_bank`,
  which asserts `correctIndex` is present by default (line 125) and absent with
  `false` (line 129).

### The leak is wider than the queue entry says

Hiding `correctIndex` / `answerGeometryId` does not hide the answer when the
answer **is** the question's own entity. Counted in `backend/app/data/content.json`:

| Template | Format | Questions | Answer visible without the key via |
|---|---|---|---|
| `tpl-identify-on-map` ("Which state is highlighted?") | `map_identify` | 50 | `entityId` (e.g. `us-state-co`), `highlightGeometryId`, and the served `entity` |
| `tpl-biggest-state` ("Which of these states is the biggest?") | `multiple_choice` | 47 | `entityId` and the served `entity` |
| `tpl-click-the-map` ("Find Alaska on the map.") | `map_click` | 50 | `entityId`, served `entity.geometryId` — but the prompt already names the state |

The queue entry raised the superlative and `map_click` cases; `map_identify` is
the same leak and was not in it. `entityId` is `required` on `Question`
(`openapi.yaml` `Question.required`), and the frontend reads the served `entity`
for the panel and the reveal (`frontend/src/lib/topics.ts:39-50`,
`frontend/src/lib/map-click.ts:157-161`, `frontend/src/components/Session.tsx:191`).
`map_identify` also needs `highlightGeometryId` to draw the question at all, so
that one cannot be withheld without breaking the format.

## Questions for a person

**Q1 — the default.** Which?
- **(a) Flip to `false` on all four surfaces** listed above, keep the parameter so
  callers (the e2e suite) can still opt in, and rewrite the three `openapi.yaml`
  passages to match. *Recommended:* `openapi.yaml` already commits to it, and
  the only caller that relies on the key opts in explicitly.
- **(b) Flip only the three public content endpoints** (`/questions`,
  `/questions/{id}`, `/bundles/{id}`), and leave the authenticated
  `POST /sessions/{id}/next` defaulting to `true`.
- **(c) Keep `true`**, and rewrite the contract to say why. The bank is public
  reference data, and the key is one query parameter away either way.

**Q2 — answers carried by the entity** (`map_identify`, superlative). Which?
- **(a) Accept it and write it down.** `includeAnswerKey=false` withholds
  `correctIndex` and `answerGeometryId` only. `openapi.yaml` says so, naming
  `entityId` and the served `entity` on questions whose answer is their own
  entity. *Recommended for this task.* It is honest, small, and does not touch the
  `Question` shape or the frontend.
- **(b) Withhold them too.** For the superlative, omit the served `entity` (and
  make `entityId` optional, or serve a neutral one). `map_identify` cannot lose
  `highlightGeometryId`. This changes the contract's `Question` shape and the
  frontend, so I would **split it out as a new task** rather than fold it in.
- **(c) Something else** — e.g. opaque question ids, so `id` (`gen:tpl-…:us-state-co`)
  stops naming the entity as well.

**Q3 — `map_click`'s `entity.geometryId`.** Its prompt names the state ("Find
Alaska on the map."), so the code `"02"` tells a child nothing the screen does
not. *Recommended:* accept it, and say so in the same `openapi.yaml` note as Q2.
Or treat it like Q2 (b).

**If the answers are Q1 (a), Q2 (a), Q3 (accept)**, the brief stays one task, sized
S-to-M. It cannot run light, because it touches `openapi.yaml`. The criteria
would cover:
- each of the four surfaces omitting `correctIndex` and `answerGeometryId` when
  the parameter is absent;
- each one including them with `includeAnswerKey=true`;
- `openapi.yaml`'s three defaults and its "Answer keys" text matching;
- a stated limitation naming `entityId` / `entity`;
- `listQuestions`' `levelSpan` wording corrected to "one fixed window" (queue
  entry, since T-089);
- the integration test reflecting the new default;
- no `frontend/` or bank change, and no new dependency.

Expect many backend tests that read `correctIndex` off a default response to
go red. That needs an attended tester step for the Test change request.

### Answers — Dkaattae, 2026-11-02, given in the orchestrator's session

Verbatim: "Q1 a, Q2 a, Q3 accept — go with the recommendations"

- **Q1:** (a) flip all four surfaces to `false`, keep the parameter.
- **Q2:** (a) accept the entity-carried answers and say so in `openapi.yaml`.
- **Q3:** accept `map_click`'s `entity.geometryId`.

Relayed by the orchestrator; recorded in `runs/T-053-answer-key-default.md`.

## Goal

The app is built so that a wrong answer is not a failure. An answer key one tap
away in the network tab undercuts that. Grading moved to the server, so the
public bank no longer needs to hand the key out by default.

## Acceptance criteria

Not written. They depend on Q1–Q3, and writing them first would decide a product
question on the person's behalf (`process.md` "Tasks this loop does not fit";
the queue entry: "The decision here is the product one").

## Out of scope

Provisional, whatever the answers:

- Changing how the server grades, or anything in `grading.py`.
- Changing the bank (`backend/app/data/content.json`, `question-bank/data/`).
- Authentication on content endpoints. Content stays public (`openapi.yaml`
  `info.description` "Authentication").
- Removing the `includeAnswerKey` parameter. The e2e suite needs to opt in.

## Constraints

Provisional:

- Touches `openapi.yaml`, so the light path is not available (`process.md`, "The
  light path").
- No new dependency.
- No network in tests.

## Context

- Queue entry: `tasks.md` T-053 (§E), including its "Since T-026", "Since T-089"
  and "Since T-051" amendments.
- `openapi.yaml`: `info.description` "Answer keys" (lines 49-52), the
  next-question request body (956-958), `IncludeAnswerKey` (1216-1225), and
  `Question` (`required`, `correctIndex`, `answerGeometryId`).
- `backend/app/serializers.py` `question_payload`; `backend/app/routers/content.py`
  `list_questions`, `get_question`, `get_bundle`; `backend/app/routers/sessions.py`
  `_serve_next` and the next-question handler; `backend/app/models.py`
  `NextQuestionRequest`.
- `backend/integration/test_stack.py::test_the_answer_key_can_be_withheld_from_the_public_bank`.
- `e2e/tests/app.ts:210-275` — the answer lookup that opts in.
- `engineering-decisions.md` E-14 (`openapi.yaml` follows the backend), E-29
  (`map_click`'s `answerGeometryId`).

## Notes

- I ran no build, no tests and no pipeline (`task-expander` role, D-7).
  The counts in the leak table come from reading `backend/app/data/content.json`.
- `PROGRESS.md` is unchanged: nothing new is true yet.
