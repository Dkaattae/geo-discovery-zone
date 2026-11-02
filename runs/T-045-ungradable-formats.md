# T-045 — Three question formats have no answer key — run log

**Task:** T-045 · **Branch:** `claude/compassionate-fermat-0jr2q7` · **PR:** #115
**Started:** 2026-11-02 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-11-02
`Next step` on entry: `(no brief)` → on exit: `worker — after a human approves (see "A call the approver should check" below)`

> **I expanded T-045 into a brief and opened draft PR #115. A human needs to approve it before the worker runs.** The brief takes a position on the decision the queue entry left open, so the approver should check that first.
>
> - **Status:** `awaiting approval` · **Next step:** `worker` · **Approved:** `pending`
> - **Brief:** tasks/T-045-ungradable-formats.md
> - **Branch:** `claude/compassionate-fermat-0jr2q7`, recorded in the brief's `Branch:` header. The push landed: `origin/claude/compassionate-fermat-0jr2q7` is at `6a53c56`.
> - **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/115, draft, against `main`. The acceptance criteria are its body.
> - **What the commits touch:** only the new brief. `git diff --stat origin/main..` shows that one file and nothing else.
>
> **Why T-045:** `tasks/` held no leftover brief, so there was no sweep to do. The three entries above T-045 that are not done are each waiting on a person:
> - **T-085b** needs Census access, or a person to pick a fallback.
> - **T-056** waits on a design decision.
> - **T-095** waits on a person's call.
>
> T-045 is the first entry with `Depends on: —`.
>
> **The call the approver should check:** T-045 asked whether `drag_order`, `pin_*` and `click_profile` should be built now or marked as not gradeable. The brief marks them, and does not build them. That rests on documents already in the repo, not my preference:
> - **Plan §4** puts countries and elevation profiles after the US loop.
> - **`tasks.md` §H** lists pin formats as later.
> - **Nothing serves them:** `content_build.py` `SERVED_FORMATS` drops all of these formats.
> - **E-14:** `openapi.yaml` follows the backend.
>
> The run was orchestrated and nobody could be asked, so I flagged this at the top of the brief and the PR rather than blocking. If the approver wants the formats built now, the brief goes back to the expander.
>
> **What the 18 criteria cover:**
> - **Error paths:** each refused answer's 422 names the right request field — `/order` for `drag_order`, `/questionId` for `click_profile`, `/pin` for every pin case.
> - **One behaviour change:** a pin question whose strategy is `polygon_then_centroid` or `distance_to_line` gets a 422 instead of being graded by its centroid.
> - **A refused answer changes nothing:** the session and profile are untouched, and the question stays pending.
> - **Two criteria are already true** and are kept so they don't regress: `nearest_centroid` pin grading, and the served bank holding none of these formats.
> - **Contract text:** `openapi.yaml` gets "Not implemented in v1" wording on `QuestionFormat`, `PinTarget`, `maxDistanceKm`, `submitAnswer` and `AnswerRequest.order`, and no enum value is removed.
> - **Must not:** no `frontend/` or `question-bank/` change, no bank file change, no new dependency, no network in tests.
>
> **Expect pre-existing tests to go red:** some tests hash `openapi.yaml` or the backend tree, as happened in T-039. The brief tells the worker to list them and to plan an attended tester step for the Test change request.

## Halted — awaiting human approval — 2026-11-02
Branch head at halt: `6a53c56`. The expander returned asking a person to approve a product call
(build `drag_order` / `pin_*` / `click_profile` now, or mark them not gradeable) before the worker runs.
The orchestrator did not write an `Approved:` stamp: a role asking for a product decision is a halt
condition, and the orchestrator does not answer it. Asked the person in the orchestrator's session.
