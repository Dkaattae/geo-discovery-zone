# T-045 — Three question formats have no answer key

**Status:** `awaiting approval`
**Next step:** `worker` — after a human approves (see "A call the approver should check" below)
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-045
**Branch:** `claude/compassionate-fermat-0jr2q7`
**PR:** #115, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-02 | cse_011oDiJfu1cshxQFeafboWxE (orchestrated, subagent) |

> **TL;DR.** T-045 takes the "mark as not yet gradeable" side, not the "build
> it now" side. `openapi.yaml` says plainly which formats and pin strategies v1
> cannot grade. Every 422 for them names the right request field. A pin question
> whose strategy needs geometry gets a 422 instead of a centroid guess.
> **A human should confirm that call before approving.**

### A call the approver should check

The queue entry says "decide whether these formats are near-term … or whether the
contract should mark them as not yet gradeable". This brief takes the **second**
option. It does not rest on the expander's own preference:

- **Plan §4** (build order) puts countries, and the world's tiny territories that
  pins are designed for (plan §2.5: Cape Verde, Monaco), after the US loop feels
  good. It also puts elevation profiles, which `click_profile` depends on, after
  that. "Rank these by size" (plan §1.2's table, `drag_order`) belongs to the
  superlative work that `tasks.md` §H lists as later.
- **`tasks.md` §H** lists "Pin formats and point-in-polygon grading (plan §2.5)"
  under "Later, in plan order".
- **None of these formats is served.** `backend/app/content_build.py:102`
  (`SERVED_FORMATS`) drops them, and `backend/app/data/content.json` holds only
  `map_identify`, `map_click` and `multiple_choice`. No child can reach the gap
  today.
- **E-14:** `openapi.yaml` follows the backend, so describing what the backend
  actually does is the default when nobody is building the rest.
- The "near-term" option would mean sourcing TopoJSON layers, writing
  generators and building renderers. That is not an `S` task.

If the approver wants the near-term option instead, this brief is the wrong one.
Send it back to the `task-expander`.

The run was orchestrated, so nobody could be asked while the brief was being
written (process.md, "Spawning"). That is why this is flagged here, not settled
in a chat.

### Why this task and not an earlier one

`tasks.md` is in order, and the three entries above T-045 that are not done are
each waiting on a person:

- **T-085b** needs a reachable Census release, or a person's pick among the
  three fallbacks.
- **T-056** says "Depends on: a design decision".
- **T-095** says "Needs a person's call before it is expanded".

T-045 is the first entry with `Depends on: —`.

## Goal

Make the server's handling of the four formats it cannot fully grade honest and
precise, without building them. A client author reading `openapi.yaml` should
know these formats are not gradeable in v1. A 422 should point at the field that
belongs to the format. A pin should never be graded by a strategy the contract
does not describe.

## Acceptance criteria

**Frozen once approved.** "Submitting" means `POST /sessions/{sessionId}/answers`
for a question that is pending in that session. "Its `errors` paths" means the
list of `path` values in the 422 problem body's `errors` array, in order.

### Behaviour

1. **`drag_order` is refused at `/order`.** Submitting an answer to a
   `drag_order` question returns 422 `application/problem+json` with `errors`
   paths exactly `["/order"]`. This holds in all three cases: the request has no
   `order`; it has an `order` listing ids in any sequence, including the
   question's own entity id; and it has a `choiceIndex`.
2. **`click_profile` is refused at `/questionId`.** Submitting an answer to a
   `click_profile` question returns 422 with `errors` paths exactly
   `["/questionId"]`, with or without a `choiceIndex` in the request.
   (`AnswerRequest` has no answer field for this format. The question is what
   cannot be graded.)
3. **A `nearest_centroid` pin is still graded, unchanged.** For a `pin_pick` or
   `pin_drop` question whose `pinTarget` has `strategy: nearest_centroid` and a
   `centroid`, a submitted `pin` returns 200. `correct` is `true` when the
   great-circle distance from pin to centroid is ≤ `maxDistanceKm` and `false`
   when it is greater. `distanceKm` is reported in both cases. A target that
   omits `maxDistanceKm` uses 300 km: a pin about 250 km from the centroid is
   correct and one about 350 km away is wrong. *(Already true at
   `backend/app/grading.py:105-116`. Listed so it does not regress.)*
4. **A pin strategy that needs geometry is refused, not guessed.** For a
   `pin_pick` or `pin_drop` question whose `pinTarget.strategy` is
   `polygon_then_centroid` or `distance_to_line`, submitting a `pin` returns 422
   with `errors` paths exactly `["/pin"]`. This holds even when the target
   carries a `centroid` and the pin is exactly on it. *(Today this is graded by
   centroid distance: a behaviour change.)*
5. **A pin question with no usable target is refused at `/pin`.** Submitting a
   `pin` to a `pin_pick` or `pin_drop` question returns 422 with `errors` paths
   exactly `["/pin"]` when any of these is true: the question has no
   `pinTarget`; its `pinTarget` has no `strategy`; or its `pinTarget` is
   `nearest_centroid` with no `centroid`.
6. **A pin answer with no pin is refused at `/pin`.** Submitting to a
   `nearest_centroid` pin question with a `centroid`, with no `pin` in the
   request (a `choiceIndex` alone, or nothing), returns 422 with `errors` paths
   exactly `["/pin"]`.
7. **Other formats' 422 paths do not move.** A `multiple_choice` question
   submitted with no `choiceIndex` still returns 422 at `["/choiceIndex"]`. A
   `map_click` question submitted with no `tappedGeometryId` still returns 422
   at `["/tappedGeometryId"]`.
8. **A refused answer changes nothing.** After any 422 in criteria 1, 2 and 4–6,
   these are identical to what they were before the request: the `counts` and
   `seenEntityIds` from `GET /sessions/{sessionId}`, and the `stats`, `mastery`
   and `reviewQueue` from `GET /profiles/{profileId}`. Submitting again to the
   same question returns 422 again, not 409. So the question is still pending
   and was not consumed.
9. **No served question has one of these formats.** `backend/app/data/content.json`
   contains no question whose `format` is `image`, `ab_compare`, `pin_pick`,
   `pin_drop`, `drag_order` or `click_profile`. Building content from a
   generated question of any of those six formats leaves it out of the served
   list. *(Already true at `backend/app/content_build.py:102` and `:192`. Listed
   so it does not regress.)*

### The contract (`openapi.yaml`)

10. **`QuestionFormat` says which formats v1 cannot grade.**
    `components.schemas.QuestionFormat.description` contains the phrase
    `Not implemented in v1`, and names `drag_order`, `click_profile`, `pin_pick`
    and `pin_drop`. It also names `map_identify`, `map_click` and
    `multiple_choice` as the formats the v1 bank serves.
11. **`PinTarget` says which strategies v1 grades.**
    `components.schemas.PinTarget.description` contains `Not implemented in v1`
    and names both `polygon_then_centroid` and `distance_to_line`. It states that
    `nearest_centroid` is the only strategy graded. The plan's reasoning for
    point-in-polygon stays, as the design these strategies are for.
12. **`maxDistanceKm` states its default.**
    `components.schemas.PinTarget.properties.maxDistanceKm.description` states
    that an omitted value means 300 km.
13. **`submitAnswer` names every 422 path.** The `submitAnswer` operation's
    `description`, or its `422` response's description, says that a question the
    server cannot grade gets a 422. It contains each of these five path strings:
    `/choiceIndex`, `/tappedGeometryId`, `/pin`, `/order`, `/questionId`.
14. **`AnswerRequest.order` says it is not graded.**
    `components.schemas.AnswerRequest.properties.order.description` contains
    `Not implemented in v1` or states that a `drag_order` answer is a 422.
15. **No enum value is removed.** `QuestionFormat.enum` still lists all nine
    formats. `PinTarget.properties.strategy.enum` still lists all three
    strategies. `AnswerRequest` still has its `pin` and `order` properties.
    `openapi.yaml` still parses, and the existing contract tests
    (`backend/tests/test_contract.py`) still pass.

### What must not happen

16. **No file under `frontend/` or `question-bank/` changes**, except test files
    that a Test change request approved. No question is added to or removed
    from either committed bank file: `question-bank/data/` and
    `backend/app/data/content.json` are byte-identical to the default branch.
17. **No new dependency.** No lockfile changes (`backend/uv.lock`,
    `frontend/bun.lock*`, `question-bank/bun.lock*`).
18. **No test reaches the network.** New tests pass under CI's dead-proxy
    guard, like the rest of the backend unit suite.

## Out of scope

- **Building any of the four formats.** No answer keys, no generators, no
  renderers, no TopoJSON, no point-in-polygon, no distance-to-line.
- **`image` and `ab_compare`.** They grade by `correctIndex` like any choice
  format, and no question of either is served. They stay as they are.
- **Changing `DEFAULT_PIN_RADIUS_KM` (300) or the haversine maths.**
- **The answer-key default on the public bank** (`includeAnswerKey`). That is
  T-053.
- **`seen_entity_ids` and undo.** That is T-093.
- **A stuck session.** If a non-served format were ever served, a child could
  not get past it. The served bank cannot hold one (criterion 9), so this task
  does not add a skip or a timeout.
- **`tasks.md` §H's "Pin formats … see T-045" line, and PROGRESS.md's Known-gaps
  line about T-045.** The reviewer updates both at the sweep.
- **A new `engineering-decisions.md` entry.** The decision lives in
  `openapi.yaml` and this brief. Add an `E-n` only if the worker finds that the
  `openapi.yaml` text cannot carry the reasoning.

## Constraints

- **Files expected to change:** `backend/app/grading.py`, `openapi.yaml`, and
  new or extended tests under `backend/tests/`. `backend/app/routers/sessions.py`
  only if the error path cannot be carried by what `grading.py` raises.
- **Invariant:** only grading changes. Grading still runs before
  `apply_answer`, so a refusal never touches state (criterion 8).
- **Expect pre-existing pins to go red, and plan to attend the tester step.**
  T-039 (PR #113) changed only `openapi.yaml` and still turned eight pins red:
  three `openapi.yaml` hashes, and T-087's backend tree digest, which moves with
  `grading.py`. Several `question-bank/src/*-verify.test.ts` files and
  `backend/tests/test_t0*_tester_criteria.py` files read `openapi.yaml` or
  digest `backend/`. The worker lists them under **Tests made stale**. Only the
  tester changes them, through a Test change request a person approves (D-14).
- **Dependencies:** none (`CLAUDE.md`, "Packages").
- **`uv` in `backend/`**, never pip. The backend suite runs with
  `make -C backend test` (`conventions.md`).
- **No mocked `fetch`, no network** (`CLAUDE.md`, "Tests"). `grade()` is a pure
  function, so test it directly. Use the ASGI client for the endpoint criteria.

## Context

Required reading for the worker and the tester.

- **`backend/app/grading.py`:**
  - `UngradableAnswer` (line 48): its default `path` is `/choiceIndex`.
  - `grade()` (lines 66–121): the pin branch (105–116) ignores `strategy`.
    Formats it does not know fall through to the final raise, which reports
    `/choiceIndex`.
- **`backend/app/routers/sessions.py:238-252`:** turns `UngradableAnswer` into
  the 422, with `errors=[{"path": exc.path, ...}]`. It is the only caller.
- **`backend/app/models.py:173-178`** (`PinTarget`, with the three-value
  `strategy` literal) and **`:420-421`** (`AnswerRequest.pin` / `order`).
- **`backend/app/content_build.py:101-102, 190-197`:** `SERVED_FORMATS` and the
  filter (criterion 9).
- **`backend/tests/test_grading.py:94-118`:** the existing "refused rather than
  guessed" and pin-distance tests.
- **`backend/tests/test_t051_map_click.py`:** the pattern for asserting a 422's
  `errors` paths at the endpoint.
- **Reaching criteria 1–8 at the endpoint** needs a question of that format
  pending in a session. The served bank holds none (criterion 9), so the test
  has to put one in the store.
- **`openapi.yaml`:**
  - `QuestionFormat` (around line 1352)
  - `PinTarget` (around line 1684)
  - `AnswerRequest` (around line 2145)
  - `submitAnswer` (around line 979)
  - `getGeometry` (line 393): T-039's "Not implemented in v1" wording, the house
    style to follow.
- **Plan:**
  - `geoquizdataplan.md` §2.5: pin mechanics, and why polygon comes first and
    rivers use distance to the line.
  - §4: build order.
  - §1.2: format table, including "drag-to-order".
- **`engineering-decisions.md`:**
  - E-14: `openapi.yaml` follows the backend.
  - E-29: `map_click` is graded by geometry id, and its 422 path is
    `/tappedGeometryId`.
- **`tasks.md`:** T-045's entry, including the 2026-10-27 amendment about
  `/pin` and `/order`. §H.

## Handoff

## Verdict

## Notes
