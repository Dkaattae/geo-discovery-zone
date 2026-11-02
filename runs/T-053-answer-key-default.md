# T-053 — The public bank hands out the answer key by default — run log

**Task:** T-053 · **Branch:** `claude/magical-davinci-y58qf6` · **PR:** #117
**Started:** 2026-11-02 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-11-02
`Next step` on entry: none (no brief) → on exit: `human`

**I stopped T-053 before writing acceptance criteria. It needs a person to answer three product questions.** The brief is pushed and draft PR #117 is open: https://github.com/Dkaattae/geo-discovery-zone/pull/117

- **Status:** `blocked` · **Next step:** `human` · **Approved:** `pending`
- **To resume:** answer Q1–Q3 in the brief or on the PR, then set `Next step: task-expander` and start a new expander run.

**Why T-053.** The rule is the first entry whose dependencies are done. `tasks/` held no leftover brief, so there was nothing to sweep. Three tasks above T-053 are each waiting on a person:
- **T-085b:** Census access.
- **T-056:** a design decision.
- **T-095:** a choice between its options (a), (b) and (c).

T-053 is next (`Depends on: —`), but its entry says "The decision here is the product one." T-047 is the first entry that needs no decision. I did not switch to it, because a halted expander does not pick a different task.

**What the survey found**
- **The leak is wider than the queue entry says.** `includeAnswerKey=false` only removes `correctIndex` and `answerGeometryId` (`backend/app/serializers.py:21-30`). That leaves the answer visible on 147 of the 415 served questions:
  - **`map_identify`, 50 questions:** the answer shows in `entityId`, `highlightGeometryId` and the served `entity`. The queue entry did not mention this one.
  - **The biggest-state superlative, 47 questions:** the answer shows in `entityId` and the served `entity`.
  - **`map_click`, 50 questions:** the answer shows in `entityId` and `entity.geometryId`, but the prompt names the state anyway.
- **Four surfaces default to `true`:**
  - `GET /questions` (`content.py:171`)
  - `GET /questions/{id}` (`content.py:205`)
  - `GET /bundles/{id}` (`content.py:243`)
  - the `POST /sessions/{id}/next` body (`models.py:404`)
- **`openapi.yaml` already says to flip the default** once the server grades. It says so at lines 49-52, 956-958 and 1216-1225.
- **The client already opts out** (`frontend/src/lib/api/client.ts:142-152`).
- **The e2e suite opts in explicitly** (`e2e/tests/app.ts:269`), so the parameter must stay.

**Questions, with what I recommend**
- **Q1, the default:**
  - (a) flip all four surfaces to `false` and keep the parameter. *Recommended.*
  - (b) flip only the three public content endpoints.
  - (c) keep `true` and document why.
- **Q2, answers carried by the entity (`map_identify` and the superlative):**
  - (a) accept it and say so in `openapi.yaml`. *Recommended.*
  - (b) withhold them too. This changes the `Question` shape and the frontend, so it should be split into its own task.
  - (c) something else, such as opaque question ids.
- **Q3, `map_click`'s `entity.geometryId`:** accept it, because the prompt already names the state. *Recommended.*

The brief sketches the criteria that would follow from the recommended answers. That version cannot use the light path, because it touches `openapi.yaml`. Expect many backend tests that read `correctIndex` from a default response to go red, so plan to attend the tester step.

**Commits and push**
- `07751e7` "T-053 expander: answer-key-default (blocked: needs a person)" adds the brief and changes the T-053 heading in `tasks.md` to `doing (blocked: …)`.
- `75bb7d6` records PR #117 in the brief's `PR:` header.
- **The push landed:** `origin/claude/magical-davinci-y58qf6` is at `75bb7d6`, the same as local.
- **Diff scope:** only `tasks/` and `tasks.md`. `PROGRESS.md` is unchanged, because nothing new is true yet.
- **Brief header:** `Branch: claude/magical-davinci-y58qf6`. My Sessions row uses `cse_011oDiJctNqgXZb5TuFbpsXz`.

I ran no build, tests or pipeline (D-7). The question counts come from reading `backend/app/data/content.json`.

## Halted — 2026-11-02
Header on exit: `Status: blocked`, `Next step: human`, `Approved: pending`. Branch head at halt: `75bb7d6`.
The expander asks a person to answer Q1–Q3 (quoted above) in the brief or on PR #117, then set `Next step: task-expander` and start a new run. No `Approved:` stamp written: there are no criteria yet, and nothing was spawned past the expander.

## Resumed — 2026-11-02
Dkaattae answered in the orchestrator's session, verbatim: "Q1 a, Q2 a, Q3 accept — go with the recommendations"

Orchestrator wrote the answer into the brief under `### Answers` (before `## Goal`), set `Status: questions answered`, `Next step: task-expander`. Spawning a fresh task-expander.

## Round 2 — task-expander — 2026-11-02
`Next step` on entry: `task-expander` → on exit: `worker` (`Status: awaiting approval`, `Approved: pending`)

**TL;DR:** The T-053 brief now has 26 acceptance criteria, written from Dkaattae's answers (Q1 a, Q2 a, Q3 accept). It is set to `Status: awaiting approval`, `Next step: worker`, `Approved: pending`, committed as `0dcf558` and pushed to `claude/magical-davinci-y58qf6`. The remote head matches. **Before approving, a person should look at criteria 10–11.** They apply the Q1 (a) answer to two places that serve questions, which the first survey missed.

**Criteria 10–11 need a look**
- **The two missed places:** `POST /sessions` (when `serveFirstQuestion` is left at its default of true) and `POST /sessions/{id}/review-round`. Both always send the answer key today, through `_serve_next`'s default (`backend/app/routers/sessions.py:89`, called at `:159` and `:374`). Neither takes an `includeAnswerKey` parameter.
- **What the criteria require:** both withhold the key, and no opt-in parameter is added.
- **Why I wrote them in rather than halting again:**
  - The frontend calls `review-round` (`frontend/src/lib/api/client.ts:165`), so leaving it out would keep the key in the app's network tab, which is the problem this task fixes.
  - No caller needs the key from either endpoint.
  - The approval step will catch it if this is not what Q1 (a) meant.
- **Where this is flagged:** a "For the approver" section at the top of the brief, and the PR #117 body.

**Corrections and finds**
- **Route name:** the next-question route is `/sessions/{sessionId}/next-question`, not `/next` as the first pass said. Fixed.
- **Bundle caching (out of scope, not fixed):** `GET /bundles/{id}` sends the same ETag and `public, immutable` cache headers whether or not the key is included. A shared cache could serve the keyed version to a request that did not ask for it. This was already true; it is a candidate for a new `tasks.md` entry.

**What the criteria cover**
- **Default:** the key is withheld on all four surfaces that take the parameter, and `includeAnswerKey=true` still includes it.
- **Re-serve:** a repeated next-question call follows that call's flag, not the first one's.
- **Withholding removes only the two keys:** `correctIndex` and `answerGeometryId`. Everything else, including `entityId`, the served `entity` and `highlightGeometryId`, is unchanged; that is the documented limitation from Q2 and Q3.
- **Grading:** results are unaffected.
- **`openapi.yaml`:** the defaults, the "Answer keys" paragraph (checked by required strings), the `Question` field descriptions, and the `listQuestions` "widening" wording.
- **Integration test:** it pins the new default, via a Test change request.
- **Negatives:** no change to `frontend/`, the bank or `grading.py`; only a doc comment may change in `e2e/`; no new dependency; no network in tests.

**What comes next**
- **A person must approve:** replace `Approved: pending` in the brief.
- **The tester step will likely need a person present.** Unit tests that read the key from a default response will go stale by design, which means a Test change request.

**What I did**
- **Commit scope:** the brief, plus the T-053 status line in `tasks.md` (changed from "blocked" to "brief awaiting approval"). `PROGRESS.md` is unchanged.
- **PR #117:** body and title updated through the GitHub MCP tool: https://github.com/Dkaattae/geo-discovery-zone/pull/117
- **Sessions table:** I added a second-pass row (`cse_011oDiJctNqgXZb5TuFbpsXz`).
- **Not run:** no build, tests or pipeline, as the role requires (D-7).

Orchestrator: a person is present in the session and the expander flagged criteria 10–11 for them, so the `Approved:` line is held for their answer rather than stamped unattended.

## Approval — 2026-11-02
Dkaattae, in the orchestrator's session, verbatim: "approved as written, including 10–11". Written into the brief's `Approved:` line; `Status: approved`. Next step stays `worker`.

## Round 3 — worker — 2026-11-02
`Next step` on entry: `worker` → on exit: `tester` (`Status: approved` → `awaiting verification`)

**TL;DR:** T-053 is built. The answer key is now withheld by default on all six places that serve a question, and `openapi.yaml` is updated. 43 existing unit tests now fail on purpose because they read the key from a default response. Each one is listed in the brief, and the tester needs a person to approve a Test change request (D-14) before the suite can go green. Pushed to `claude/magical-davinci-y58qf6`; `git log origin/claude/magical-davinci-y58qf6 -1` shows `c0fcb9b T-053 worker: withhold the answer key by default`.

**Brief state:** Status `awaiting verification`, Next step `tester`. I added my Sessions row and filled in the Handoff and Notes in `/home/user/geo-discovery-zone/tasks/T-053-answer-key-default.md`.

**Changes**
- **`/home/user/geo-discovery-zone/backend/app/routers/content.py`:** `includeAnswerKey` now defaults to `False` on `GET /questions`, `GET /questions/{id}` and `GET /bundles/{id}`.
- **`/home/user/geo-discovery-zone/backend/app/models.py`:** `NextQuestionRequest.include_answer_key` now defaults to `False`.
- **`/home/user/geo-discovery-zone/backend/app/routers/sessions.py`:** `_serve_next` now defaults to `include_answer_key=False`. `POST /sessions` and review-round don't pass the flag, so they always withhold (criteria 10–11). Neither got a new parameter.
- **`/home/user/geo-discovery-zone/openapi.yaml`:** updated for criteria 15–19:
  - the "Answer keys" paragraph is rewritten and states the accepted `entityId` / `geometryId` limitation (Q2/Q3);
  - the `listQuestions` description now describes the one fixed window;
  - both `includeAnswerKey` defaults are `false`;
  - the `correctIndex` and `answerGeometryId` descriptions say the field is present only when `includeAnswerKey=true`.
- **`/home/user/geo-discovery-zone/e2e/tests/app.ts`:** only the doc comment changed.
- **`/home/user/geo-discovery-zone/backend/tests/test_t053_answer_key_default.py`:** new worker tests (3), all passing.

**Checks run**
- **Unit suite (`uv run pytest`):** 801 passed, 9 skipped, 43 failed. Every failure is a `KeyError` on `correctIndex` / `answerGeometryId`, or a check on spec wording that criterion 18 removes.
- **`test_contract.py` and the new tests:** pass.
- **`ruff check` and `ruff format --check`:** clean.
- **Not run:** the integration suite (it needs docker compose) and e2e. The e2e change is a comment only.

**Tests made stale**
- **Unit tests (43):** in `test_sessions_api.py` (18), `test_content_build.py` (7), `test_t040_tester_criteria.py` (6), `test_t026_tester_criteria.py` (5), `test_t051_tester_criteria.py` (4), and one each in `test_content_api.py`, `test_t026_topics.py` and `test_t051_map_click.py`.
- **Integration test:** `backend/integration/test_stack.py::test_the_answer_key_can_be_withheld_from_the_public_bank` is also stale. Criterion 21 says how to rewrite it.
- **Proposed fix:** have each test opt in with `includeAnswerKey=true`. Delete none. The brief names every test and covers the special cases.

**Flags, each with an owner**
- **Function default left as is:** `serializers.question_payload` and `served_payload` still default to `include_answer_key=True`. No HTTP response depends on that default, and flipping it would make one more test stale (`test_t051_map_click.py:114`). Reviewer to confirm, or to ask for the flip.
- **Bundle `ETag`/caching:** out of scope here. The reviewer's sweep should add the `tasks.md` entry the brief proposes.
- **Sessions table:** my worker row has the same session id as the expander rows (`cse_011oDiJctNqgXZb5TuFbpsXz`), because the environment variable returns the parent session's id. I ran as a separate subagent. The tester should take that into account when checking that it runs in a different session from me. Process owner to decide how subagent sessions should be recorded.
