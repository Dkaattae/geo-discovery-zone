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

## Approved — 2026-11-02
The person answered in the orchestrator's session, verbatim: "approved, mark them not gradeable".
Recorded in the brief's `Approved:` line. Resuming at `worker`.

## Round 2 — worker — 2026-11-02
`Next step` on entry: `worker — after a human approves` → on exit: `tester — attended: eight pre-existing pins are red and need a Test change request (see Handoff, "Tests made stale")`

> **T-045 is built and pushed. It is ready for the tester, but the tester step needs a person there.** Eight question-bank hash and count pins are red and need a Test change request (D-14). Six of them are red because of this change. The other two were already red before I started.
>
> - **Status:** `awaiting verification` · **Next step:** `tester` (attended)
> - **Commit:** `9129620`, pushed to `claude/compassionate-fermat-0jr2q7` (the brief's `Branch:` header). `git log origin/claude/compassionate-fermat-0jr2q7 -1` shows `9129620`.
> - **Approval:** the brief's `Approved:` line is filled in, by Dkaattae on 2026-11-02 (given in the orchestrator's session), so the gate was passed.
>
> **What changed**
> - **`backend/app/grading.py`**
>   - A `drag_order` answer is refused at `/order`.
>   - A `click_profile` answer, or any format the server doesn't know, is refused at `/questionId`.
>   - Every pin refusal now names `/pin`: no target, no strategy, no centroid, no pin, or a strategy v1 can't grade.
>   - `polygon_then_centroid` and `distance_to_line` were being graded by centroid distance. They are now refused with a 422.
>   - `nearest_centroid` grading works as before.
>   - Other formats keep their paths (`/choiceIndex`, `/tappedGeometryId`).
>   - `sessions.py` is unchanged, so grading still runs before any state changes.
> - **`openapi.yaml`:** wording only, no enum value removed. It adds "Not implemented in v1" to `QuestionFormat`, `PinTarget` and `AnswerRequest.order`, says `maxDistanceKm` defaults to 300 km, and lists all five 422 paths in the `submitAnswer` description.
> - **`backend/tests/test_t045_ungradable.py`** (new, 35 tests): direct `grade()` checks, plus endpoint checks that a refusal changes nothing and that resubmitting gets 422 again, not 409. To get a pending question of these formats, the endpoint tests rewrite the pending question's row in the store. The test's transaction is rolled back afterwards.
> - **`tasks/T-045-ungradable-formats.md`:** Handoff, Notes, my Sessions row, Status and Next step.
>
> **Test results**
> - **Backend:** 800 passed, 9 skipped. Lint and format-check are clean.
> - **Question-bank:** 2705 pass, 8 fail, all listed under "Tests made stale" in the brief. Typecheck and lint are clean.
> - **Frontend:** 4 fail, all from the environment. The proxy returns 403 on `bun install`, so `react-simple-maps` is missing and four component test files can't load. No `frontend/` file changed.
>
> **The 8 red pins** (file, test name and proposed fix for each are in the brief)
> - **Six caused by this change:** `openapi.yaml` and `backend/` hashes in `agriculture-true-wrong-answers-verify`, `map-click-no-candidates-verify` (two), `refresh-regenerate-reminder-verify` (`MAIN_BOUNDARY_SHA`), `familiarity-drawn-apart-verify`, and `climate-cold-trade-accepted-verify` T-091 criterion 20.
> - **Two already red at `61bffb9`:** the count floors in `farm-animal-loose-ends-verify:554` (expects 292, gets 294) and `climate-cold-trade-accepted-verify` (`MAIN_UNTOUCHABLE_COUNT`: expects 296, gets 298). The extra files are the new brief and run log in `tasks/` and `runs/`. The proposed fix is to add the four T-045 files to each allowed set, as T-039 did, so the floors stay where they are.
>
> **Judgment calls (owners named in the brief)**
> - **"Not implemented in v1" is not in the `submitAnswer` description.** Two existing tests use that phrase to mark endpoints that aren't built, and `submitAnswer` is built. My first draft included it and turned both red. Criterion 13 doesn't need the phrase, so the 422 paragraph uses plain wording.
> - **`maxDistanceKm: null` is treated as 300 km.** Before, a stored `null` would have crashed grading with a 500. The tester should confirm this fits criterion 3, and the reviewer can overturn it.
> - **Unknown formats are refused at `/questionId`.** That uses the same reasoning criterion 2 gives for `click_profile`. The reviewer should confirm.
>
> **Session ids:** every role in this orchestrated run reports the same `CLAUDE_CODE_REMOTE_SESSION_ID`. The brief's Handoff says so, so the tester's separate-session check doesn't misread it.

## Halted — attended tester required — 2026-11-02
Branch head at halt: `9129620`. G5 passed (Status `awaiting approval` → `awaiting verification`).
`Next step` names `tester`, qualified as **attended**: the pre-existing tests it marks red need a
Test change request, which only a tester in a session the person attends can have approved and
applied (D-14, D-15). The orchestrator did not spawn a subagent tester. Run stops here; a person starts
the `tester` step for T-045 in a session they attend, and a new run resumes from the header after that.
