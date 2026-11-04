# T-100 — `GET /bundles/zz` with a matching `If-None-Match` returns 304 — run log

**Task:** T-100 · **Branch:** `claude/ecstatic-hopper-lp3me9` · **PR:** #123
**Started:** 2026-11-04 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-04
`Next step` on entry: `(no brief)` → on exit: `worker`

**TL;DR:** I wrote the brief for T-100, pushed it to `claude/ecstatic-hopper-lp3me9` (head `3ac61b2`, confirmed on the remote) and opened draft PR #123. The brief is `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. Before the worker starts, the `Approved:` line needs filling in (by a person, or by the orchestrator's unattended stamp).

**Which task, and why**
- **T-100**: `GET /bundles/zz` with a matching `If-None-Match` returns 304 instead of 404.
- It was the first task in `tasks.md` I could start. T-085b, T-056 and T-095 each wait on a person's decision or an outside source.
- `tasks/` held only `README.md` and `TEMPLATE.md`. T-099's reviewer had already swept, so there was nothing left over from the last cycle.

**What I found in the code** (by reading it; I ran nothing)
- **The bug is real.** In `backend/app/routers/content.py`, `get_bundle` returns 304 on a matching tag before it checks the bundle exists. `store.bundle_etag` (`backend/app/store.py:276`) makes a tag for any id.
- **Already true, not asked for again:**
  - An unconditional request for an unknown bundle is already a 404 (`test_t097_tester_criteria.py::test_c13`).
  - `openapi.yaml` already declares 304 and 404 for this endpoint.
  - `store.bundle_ids` is a cheap existence check that already exists.
  - `response_model_exclude_unset=True` on `get_bundle` has no effect since T-099.

**The 13 criteria**
- **1–3:** an unknown bundle is a 404 problem document for both variants. That holds for its own tag, the other variant's tag, a list containing the matching tag, and `*`. The 404 carries no `ETag` and no `immutable` `Cache-Control`.
- **4–5:** behaviour for `us` is unchanged, both the 304/200 conditional cases and the full 200 response.
- **6:** a 304 for `us` must not read the `questions` table, so a matching tag never costs a full bundle render.
- **7:** the route's `response_model_exclude_unset` is false and its `response_model` is still `Bundle`.
- **8:** `GET /bundles` is unchanged.
- **9–13:** the negatives and the whole suite: no pre-existing test changed (checked by hand, per E-11/E-12), no dependency change, `openapi.yaml`, migrations and the plan untouched, no network in tests, all suites green.

**Out of scope:** `*` on a known bundle (RFC 9110 suggests 304 there, today it is 200), weak validators, other endpoints, `list_bundles`'s flag, and the T-101 flaky test.

**Commits:** only `tasks/` and `tasks.md` changed. The `tasks.md` change is T-100's status set to `doing`. `PROGRESS.md` needed no edit.

Files:
- /home/user/geo-discovery-zone/tasks/T-100-unknown-bundle-304.md
- /home/user/geo-discovery-zone/tasks.md
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/123

## Orchestrator — 2026-11-04
Approved stamped unattended. Note: the expander's returned result summarised the criteria; it is logged here verbatim and was not used in any spawn prompt.

## Round 2 — worker — 2026-11-04
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR: T-100 is fixed and pushed.** `GET /bundles/zz` is now a 404 whatever `If-None-Match` holds, and the backend check passes. The brief is at Status `awaiting verification`, Next step `tester`. It was pushed as commit `e730259` on `claude/ecstatic-hopper-lp3me9`, and `git log origin/claude/ecstatic-hopper-lp3me9 -1` shows that commit. Three question-bank tests go red by design (they pin file contents) and are listed under **Tests made stale** for the tester.

**Changes**
- **`/home/user/geo-discovery-zone/backend/app/routers/content.py`**: `get_bundle` now raises `not_found` when `bundleId not in store.bundle_ids(db)`, before it computes the etag or checks the tag. I also removed the inert `response_model_exclude_unset=True` from the `/bundles/{bundleId}` route; `response_model=Bundle` stays. `store.py` and `list_bundles` are untouched.
- **`/home/user/geo-discovery-zone/backend/tests/test_t100_unknown_bundle_conditional.py`** (new, 4 tests):
  - the unknown-id 404 for every tag in criteria 1–3, with no `ETag` and no `immutable` header;
  - the 304 for `us` still works;
  - a 304 for `us` reads nothing from `questions`, checked with a `before_cursor_execute` listener;
  - the route flag and response model.
  - With the fix stashed, 2 of the 4 fail; with it, all pass.
- **`/home/user/geo-discovery-zone/tasks/T-100-unknown-bundle-304.md`**: Sessions row, Handoff, Notes, Status and Next step.

**Test results**
- **Backend**: `make -C backend check` passes (1020 passed, 9 skipped), with the proxy variables set to `http://127.0.0.1:1`.
- **Question-bank**: 2708 pass, 5 fail.
  - 3 are new and stale by design. They pin file digests that move whenever backend files change, the same re-pin T-097 and T-099 needed: T-092 c16 in `map-click-no-candidates-verify.test.ts`, T-087 c15 in `refresh-regenerate-reminder-verify.test.ts`, and T-091 c20 in `climate-cold-trade-accepted-verify.test.ts`.
  - 2 were already red with my changes stashed: T-096 c21 and T-091 c22.
- **Frontend: not run.** `bun install --frozen-lockfile` fails with a proxy 403, because the lockfile pins tarballs from a private registry (`lovable-core-prod`) this sandbox cannot reach. This task does not touch `frontend/`. The tester or CI needs to run it.

**Flags in the Handoff, each with an owner**
- **Criterion 7's wording does not match FastAPI 0.141.1 (tester to confirm, expander to reword if needed).** The criterion says the route is in `app.main.app.routes`, but each included router shows up there as an `_IncludedRouter`, so a literal scan finds no matching route. My test looks inside `.original_router.routes` and finds exactly one.
- **The worker and expander session ids are the same, `cse_011oDiJeFc5BLAbjAcwGQdfw` (orchestrator or human to note).** The tester's check that it runs in a different session should compare against this id.
- **`bun test` run before `bun install` rewrote `frontend/README.md`.** I reverted it; it is not in the commit. Raised for the sweep.
- **Out-of-scope items left alone.** These include `*` on a known bundle, which still returns 200. I did not add a `tasks.md` entry for it because the brief already names it; the reviewer can decide.

## Round 3 — tester — 2026-11-04
`Next step` on entry: `tester` → on exit: `human`

**T-100 tester: the fix meets every functional criterion, but the task is halted on a Test change request.** T-100's own files moved 7 question-bank boundary pins, and a person has to approve the re-pins in an attended `tester` session. Status is now `test changes requested`, Next step `human`, Test changes `requested`. I pushed to `claude/ecstatic-hopper-lp3me9` and it landed: the remote head is `65498ff`, matching local.

**Independence is weak here.** `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJeFc5BLAbjAcwGQdfw`, the same id as the expander and the worker, so the Sessions check proves nothing in this orchestrated run. The only basis is that I was spawned as a fresh subagent and saw only the committed Handoff. The Verdict says so.

**Criteria**
- **Criteria 1-8: met.** Covered by 19 new tests in `/home/user/geo-discovery-zone/backend/tests/test_t100_tester_criteria.py`.
- **Criterion 7: met on a reading, not blocked.** FastAPI 0.141 wraps included routers in `_IncludedRouter`, so a flat scan of `app.routes` finds no `APIRoute` at all. I read the criterion as "the route reachable from `app.routes`, including through included routers", which is also the worker's reading.
- **Criteria 9-11: met, checked by hand.** Under `backend/tests/` the diff from `15a3175` only adds files. No dependency, `openapi.yaml`, migration, plan or `data/` file changed.
- **Criterion 12: met.** `make -C backend check` passed with all six proxy variables pointed at `127.0.0.1:1`: 1039 passed, 9 skipped.
- **Criterion 13: not yet met.**
  - Question-bank: 2707 pass, 6 fail. All six failures are the stale pins in the request.
  - Frontend: could not run here. `bun install` gets a proxy 403 and `node_modules` is incomplete. The GitHub check `frontend (typecheck, lint, test)` passed at `5563400`.

**Mutations:** I made 7 mutations in `content.py` and each one turned the matching tests red. Every mutation was reverted, and a `cmp` against a backup was clean afterwards. They covered: the guard removed, `exclude_unset` restored, the existence check done by a full render, the tag match forced always true, a 404 sent with `ETag` and immutable `Cache-Control`, and a wrong `bytes` value.

**The Handoff was wrong on one point.** It said 2 question-bank failures were "already red before". They were not. All four boundary test files pass at `15a3175`. Those two went red because T-100's brief and run log are new tracked files. The worker also missed two more stale tests: the `MAIN_TESTS_COUNT`/`MAIN_TESTS_SHA` pin, which the new backend test files move, and the `APPLIED_REQUEST_FILE_SHAS` cascade that rows 1 and 3 trigger.

**The 7 rows in the Test change request** (none applied):
1. `map-click-no-candidates-verify.test.ts`: re-pin the `backend/app` digest and rename the test to "T-100's".
2. `refresh-regenerate-reminder-verify.test.ts`: re-pin `MAIN_BOUNDARY_SHA`.
3. `farm-animal-loose-ends-verify.test.ts`: add T-100's brief and run log to `CRITERION_21_ALLOWED`.
4. `climate-cold-trade-accepted-verify.test.ts`: re-pin `MAIN_SOURCE_TREES_SHA`.
5. Same file: add T-100's brief and run log to `CRITERION_22_ALLOWED`.
6. Same file: `MAIN_TESTS_COUNT` 120 → 122, and re-pin `MAIN_TESTS_SHA`.
7. Same file: re-pin the cascade in `APPLIED_REQUEST_FILE_SHAS`.

Every row is modify, none delete. I tried rows 1-6 in a throwaway worktree, then removed it: they leave only row 7 red, as expected. The brief gives the exact digest values.

**Commits**
- `19b7162`: T-100 tester: criteria tests.
- `65498ff`: T-100 tester: Verdict and Test change request.

**What is needed:** a person starts the `tester` step for T-100 in a session they are attending and approves or refuses each row there. The orchestrator cannot approve them (D-15).

Files:
- /home/user/geo-discovery-zone/tasks/T-100-unknown-bundle-304.md
- /home/user/geo-discovery-zone/backend/tests/test_t100_tester_criteria.py

## Halted — test change request — 2026-11-04
Raised by the tester at commit `65498ff`. Header: `Status: test changes requested`, `Next step: human`, `Test changes: requested`. The orchestrator did not open the request and cannot approve it (D-15).

To resume: a person starts the `tester` step for T-100 in a session they are attending. It asks about each row, applies what is approved, and finishes verifying. Then start a new run from the `Next step` it writes.

Roles run: task-expander → worker → tester.

## Resumed — 2026-11-04
Dkaattae in the orchestrator's session: "ci fixed. please proceed". The branch head had moved since the halt: an attended tester pushed `64ea707` (apply approved test change request) and `0d65cec` (verdict pass). Header now reads `Status: pass`, `Next step: reviewer`, `Test changes: approved — Dkaattae, 2026-11-04`. Carrying on from that `Next step`.
