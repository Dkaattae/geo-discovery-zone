# T-045 — Three question formats have no answer key

**Status:** `awaiting verification`
**Next step:** `tester` — attended: eight pre-existing pins are red and need a Test change request (see Handoff, "Tests made stale")
**Approved:** Dkaattae — 2026-11-02, given in the orchestrator's session: "approved, mark them not gradeable". See `runs/T-045-ungradable-formats.md`.
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
| worker | 2026-11-02 | cse_011oDiJfu1cshxQFeafboWxE (orchestrated, subagent) |

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

> **TL;DR.** Built: `grade()` now refuses `drag_order` at `/order`, `click_profile`
> (and any unknown format) at `/questionId`, and every pin refusal — including the
> two geometry strategies, which were silently graded by centroid — at `/pin`.
> `openapi.yaml` carries the "Not implemented in v1" text. Backend suite green
> (800 pass, 9 skip), lint and format clean. **Eight question-bank pins are red,
> six of them by my change and two already red before it** — the tester needs a
> Test change request (list below). Frontend reds are environmental, not this task.

**Note on the session id:** every role in this run reports the same
`CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_011oDiJfu1cshxQFeafboWxE`) because the
orchestrator spawns subagents inside one remote session. Each role was a separate
subagent with its own context; the id cannot show that.

### Files changed

- **`backend/app/grading.py`**
  - New `GRADED_PIN_STRATEGIES = {"nearest_centroid"}`.
  - Pin branch rewritten: checks in order no strategy → strategy not graded →
    no centroid → no pin; every one raises with path `/pin`. Then the unchanged
    haversine/radius grading. `maxDistanceKm: null` now also means 300 (it would
    have raised a `TypeError` before); omitted still means 300.
  - `drag_order` raises at `/order`. The final fall-through (covers
    `click_profile` and any unknown format) raises at `/questionId`.
  - `UngradableAnswer`'s default path stays `/choiceIndex`, so the choice-format
    raises are unchanged.
- **`openapi.yaml`** — text only, no enum or property removed:
  - `QuestionFormat.description`: served formats, `image`/`ab_compare` note, and
    a **Not implemented in v1** paragraph naming the four.
  - `PinTarget.description`: **Not implemented in v1** for the two strategies,
    `nearest_centroid` stated as the only graded one; the plan's
    point-in-polygon reasoning kept as "the design these strategies are for".
  - `maxDistanceKm.description`: "An omitted value means 300 km."
  - `submitAnswer.description`: a 422 paragraph listing all five paths and what
    triggers each.
  - `AnswerRequest.order.description`: **Not implemented in v1**, 422 at `/order`.
- **`backend/tests/test_t045_ungradable.py`** (new, 35 tests): pure `grade()`
  checks plus endpoint checks through the ASGI client.
- **`sessions.py`**: not changed — `UngradableAnswer.path` already carries the path.

### Where each criterion lives

| # | Where |
|---|---|
| 1 | `grading.py`, `drag_order` branch → `/order` |
| 2 | `grading.py`, final raise → `/questionId` |
| 3 | `grading.py`, pin branch tail (unchanged maths; null radius hardened) |
| 4 | `grading.py`, `GRADED_PIN_STRATEGIES` check, before centroid/pin |
| 5 | `grading.py`, no-strategy and no-centroid checks |
| 6 | `grading.py`, `pin is None` check |
| 7 | unchanged paths: `/choiceIndex` default, map_click branch |
| 8 | `sessions.py:238-252` — `grade()` still runs before `apply_answer`; nothing changed there |
| 9 | already true: `content_build.py` `SERVED_FORMATS`; `content.json` not touched |
| 10–14 | `openapi.yaml` as listed above |
| 15 | enums untouched; `test_contract.py` passes |
| 16–17 | `git diff --stat origin/main..` touches no `frontend/`, `question-bank/`, bank or lockfile |
| 18 | new tests use the ASGI client and pure calls only |

**How my endpoint tests reach a pending question of these formats:** start a
session, take the first served question, then rewrite that `QuestionRow`'s
`payload` and `format` in the test's own DB session (rolled back at teardown).
The tester may prefer a different route; this one needs no production seam.

### Deliberately not done

- **No "Not implemented in v1" in `submitAnswer.description`.** My first draft
  had it, and it turned two existing tests red
  (`test_t039_tester_criteria.py::test_c2_no_other_operation_carries_the_mark`,
  `test_unimplemented_content_docs.py::test_exactly_the_empty_endpoints_are_marked_unimplemented`):
  that phrase marks *operations* that are not implemented, and `submitAnswer`
  is implemented. Criterion 13 does not need the phrase, so I used plain wording
  there. Both tests are green.
- No `engineering-decisions.md` entry: the `openapi.yaml` text carries the reasoning.
- No `tasks.md` / `PROGRESS.md` edits (reviewer's sweep, per Out of scope).

### Contradictions with the brief

- None in the criteria. The brief predicted T-087's backend digest and
  `openapi.yaml` hashes would go red; they did (below). It did not predict that
  two pins were **already red on the branch before I started** (from the new
  `tasks/` and `runs/` files the expander and orchestrator added).

### How to run

- `make -C backend test` — 800 passed, 9 skipped.
- `make -C backend lint` and `make -C backend format-check` — clean.
- `uv run pytest tests/test_t045_ungradable.py -q` in `backend/` — 35 passed.
- `cd question-bank && bun test` — 2705 pass, 8 fail (all listed below).
  `bun run typecheck` and `bun run lint` clean.
- `cd frontend && bun test --timeout 60000` — 392 pass, 4 fail, **all
  environmental**: `bun install` gets a proxy 403 (`ProxyConnectFailed` on
  `d3-drag`), so `react-simple-maps` is missing and four component test files
  cannot load. Under bun's default 5 s timeout the ESLint-spawning gate tests
  also time out in this container. No `frontend/` file changed.

### Tests made stale

All in `question-bank/src/`. The first six go red because of this change. The
last two were **already red at `61bffb9`** (before any worker change) and stay red.

| File | Test (describe > name) | Made stale by | Proposed fix |
|---|---|---|---|
| `agriculture-true-wrong-answers-verify.test.ts` | T-088 criteria 20-25: what must not change > criterion 21: openapi.yaml is byte-identical to main's | criteria 10–14 (openapi text) | re-pin to this branch's `openapi.yaml` |
| `map-click-no-candidates-verify.test.ts` | T-092 criterion 16: no other surface changes > backend/app (except [ "backend/app/content_build.py" ]) is byte-identical to 6587ed0 | criterion 4 (`grading.py`) | add `backend/app/grading.py` to the exception list, or re-pin |
| `map-click-no-candidates-verify.test.ts` | T-092 criterion 16: no other surface changes > openapi.yaml (except []) is byte-identical to ed00235 | criteria 10–14 | re-pin to this branch's `openapi.yaml` |
| `refresh-regenerate-reminder-verify.test.ts` | T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes > every tracked file under the three trees is as re-pinned by T-039, none added or removed | `grading.py` + new backend test file | re-pin `MAIN_BOUNDARY_SHA` (line 72) |
| `familiarity-drawn-apart-verify.test.ts` | T-085a criteria 23-25: negative > criterion 25: openapi.yaml is unchanged since ed00235 (re-pinned T-039) | criteria 10–14 | re-pin |
| `climate-cold-trade-accepted-verify.test.ts` | T-091 criterion 20: no non-test source file moves > every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's | `grading.py` | re-pin `MAIN_SOURCE_TREES_SHA` (line 65) |
| `farm-animal-loose-ends-verify.test.ts` | T-096 criteria 17-21: the bank and the boundaries > criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added | **pre-existing**: count 294 vs 292 from the new `tasks/T-045-…md` and `runs/T-045-…md`; once the count is fixed, `grading.py` and `openapi.yaml` will also fail the content check | count floor 292 → 294 is wrong-headed; better add the T-045 files (brief, run log, `grading.py`, `openapi.yaml`) to `CRITERION_21_ALLOWED`, as T-039 row 8 did, keeping 292 |
| `climate-cold-trade-accepted-verify.test.ts` | T-091 criterion 22: the diff touches only the allowed files > every tracked non-test file outside the allowed list is 12d242e's, and none is added | **pre-existing**: count 298 vs `MAIN_UNTOUCHABLE_COUNT = 296` (line 81), same two files; same follow-on for `grading.py`/`openapi.yaml` | add the same four files to `CRITERION_22_ALLOWED`, as T-039 row 7 did, keeping 296 |

**Count floors:** `farm-animal-loose-ends-verify.test.ts:554` (292) and
`climate-cold-trade-accepted-verify.test.ts` `MAIN_UNTOUCHABLE_COUNT` (296).
Adding the four T-045 files to each allowed set keeps both numbers where they are.

### Flags, with owners

- **`maxDistanceKm: null` treated as 300.** Decided because a stored `null`
  would otherwise crash grading with a 500, and the contract text now says
  "omitted means 300". Tester to confirm it is within criterion 3; reviewer to
  overturn if they want `null` refused instead.
- **Unknown formats answer at `/questionId`** (not just `click_profile`).
  Decided because the question is what cannot be graded, the same reasoning
  criterion 2 gives. Reviewer to confirm.
- **Check order in the pin branch** (target checks before the `pin` check). All
  paths are `/pin`, so it changes only the `message`. No owner needed beyond the
  reviewer's read.

## Verdict

## Notes

- **Surprise:** the "Not implemented in v1" phrase is load-bearing for two
  existing tests that use it to mark unimplemented *operations*. It belongs on
  schemas here, not on `submitAnswer`.
- **Surprise:** the old pin branch checked `pin is None` before the target, and
  reported both at `/choiceIndex`; the old fall-through also said `/choiceIndex`
  for `drag_order`/`click_profile`. The existing
  `test_grading.py::test_a_format_with_no_answer_key_is_refused_rather_than_guessed`
  only asserts the exception type, so it stays green.
- **Environment:** `frontend/` dependencies cannot install here (proxy 403), so
  the frontend suite could not be fully run. Nothing in `frontend/` changed.
