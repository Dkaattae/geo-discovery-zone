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
