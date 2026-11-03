# T-093 — An undone answer still counts as a place seen — run log

**Task:** T-093 · **Branch:** `claude/tender-fermi-ad0qx3` · **PR:** #119
**Started:** 2026-11-03 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-11-03
`Next step` on entry: none (no brief) → on exit: `worker` — once a person replaces `pending` below

**TL;DR:** I wrote the T-093 brief (an undone answer still counts as a place seen), pushed it, and opened draft PR #119. Status is `awaiting approval` and Next step is `worker`. A person has to replace `Approved: pending` before the worker starts. Under the orchestrator this approval step is skipped, as it was for T-098.

**Pick**
- **T-093 is the first task in `tasks.md` whose dependencies are done.** §A and §B have no open tasks.
- **T-085b, T-056 and T-095 were skipped.** Each is waiting on a person's decision: T-085b on a reachable Census source, T-056 on a design call, T-095 on its question Q.
- **The previous cycle was finished.** `tasks/` held only `README.md` and `TEMPLATE.md`.

**Brief**
- **File:** `/home/user/geo-discovery-zone/tasks/T-093-undo-places-seen.md`
- **Full brief, not the light path:** it has 12 criteria.
- **Already true:** undo restores everything except `seen_entity_ids`. That list is added to in `backend/app/grading.py:190-191` but is not in `SessionRecord.snapshot`/`restore` (`backend/app/orm.py:295-323`).
- **Two choices flagged for the approver** in the brief and the PR body:
  - **Undo removes the place from the seen list.** The queue entry also allowed the opposite: write down that "a place looked at is a place seen". I chose restore because the code's own comment says "an undo restores exactly what was there" (`backend/app/routers/sessions.py:259-260`).
  - **Criterion 8 goes beyond the queue entry.** An answer recorded before the change has a snapshot with no seen-list key, and undoing it must return 204, not a 500.
- **Criteria cover:**
  - the list restored exactly, starting from an empty and from a non-empty list
  - a place an earlier kept answer saw stays in the list
  - `placesSeen` is 0 or 1 in the two stated cases
  - all three formats, each answered right and wrong
  - a review-round answer
  - re-answering after an undo counts the place once
  - the fields undo already restored are still restored
  - the full backend, frontend and question-bank suites pass
  - no pre-existing test is changed, no migration or dependency is added, and tests reach no network

**Git**
- **Branch:** `claude/tender-fermi-ad0qx3`, recorded in the brief's `Branch:` header.
- **Commits:** `6a7e038 T-093 expander: undo-places-seen` and `f07bf66 T-093 expander: record PR #119 in the brief`.
- **Push confirmed:** `git log origin/claude/tender-fermi-ad0qx3` shows both commits.
- **Files touched,** from the diff against `origin/main`: only `tasks.md` (T-093's status set to `doing`) and `tasks/T-093-undo-places-seen.md`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/119, a draft against `main`.

**Not done**
- **No build, test or pipeline run**, which this role does not do.
- **`PROGRESS.md` is unchanged.** Nothing in it changed state.

### Approval stamp — 2026-11-03
Orchestrator wrote `Approved:` (unattended run). Criteria not read.

## Round 2 — worker — 2026-11-03
`Next step` on entry: `worker` — once a person replaces `pending` below → on exit: `tester`

**T-093 worker is done: undo now takes the place back out of the session's seen list.** Commit `8f16bb7` is on `origin/claude/tender-fermi-ad0qx3` (I checked with `git log origin/... -1`). The brief is set to Status `awaiting verification`, Next step `tester`. The backend suite passes. Three question-bank guard tests that pin `backend/` to old commits now fail by design and need re-pinning by the tester, with a human's approval.

**Changes**
- **`/home/user/geo-discovery-zone/backend/app/orm.py`**: `SessionRecord.snapshot` now saves `seen_entity_ids`. `SessionRecord.restore` puts it back only when the key is present, so answers recorded before this change still undo (criterion 8). The router and `grading.py` are untouched.
- **`/home/user/geo-discovery-zone/backend/tests/test_t093_undo_places_seen.py`** (new, 20 tests): covers criteria 1–8, including all three formats answered right and wrong, and a review-round answer. 17 of them fail without the `orm.py` change. The 3 that pass without it (criteria 2, 6 and 8) already held before this task, so they guard against regressions rather than prove the fix.
- **`/home/user/geo-discovery-zone/tasks/T-093-undo-places-seen.md`**: Handoff, Notes and my Sessions row are written. My row has the same session id as the expander's (`cse_011oDiJeUyEjWF9EzpoTaWLp`), so the tester must not run under that id.

**Test results**

| Suite | Result | Note |
|---|---|---|
| `make -C backend check` | lint and format clean; 927 passed, 9 skipped | |
| Postgres (local cluster) | 108 passed | only the new file plus `test_sessions_api.py` and `test_t051_tester_criteria.py`; full suite not run on Postgres |
| frontend `bun test` | 392 pass, 4 fail | environment only: `react-simple-maps` could not be installed (proxy 403 on a dependency tarball). Same result with my change stashed. `git-baseline-guard` passes |
| question-bank `bun test` | 2708 pass, 5 fail | 3 caused by my change, 2 failing before it (below) |

**Tests made stale** (left failing; the brief bars me from editing them)
- `map-click-no-candidates-verify.test.ts`, T-092 criterion 16, the `backend/app` byte-identical check: fails because `orm.py` changed. Proposed fix: re-pin the digest.
- `refresh-regenerate-reminder-verify.test.ts`, T-087 criterion 15: fails because `orm.py` changed and a test file was added. Proposed fix: re-pin the digest and raise the file count by 1.
- `climate-cold-trade-accepted-verify.test.ts`, T-091 criterion 20: fails because `orm.py` changed. Proposed fix: re-pin the digest.

**Already failing before my change**
- **Tests:** T-096 criterion 21 in `farm-animal-loose-ends-verify.test.ts` and T-091 criterion 22 in `climate-cold-trade-accepted-verify.test.ts`.
- **Likely cause:** each file count is 2 over its pin, which matches the brief and run log added earlier on this branch. I have not confirmed that. Tester to confirm and re-pin.

**Gap in the brief:** criteria 9 (question-bank tests pass) and 10 (no existing test changed) can't both hold, because any `backend/app` change trips those guards. That calls for the usual tester re-pin request, not sending the brief back to the expander. Tester to raise it, human to approve.

**Decisions for others to confirm**
- **Old-style undo leaves the list alone.** When an answer recorded before this change is undone, the seen list is not rebuilt, so the place stays in it. The brief allows either choice. Reviewer to confirm or overturn.
- **Criterion 8 test edits a real record.** It records an answer through the API, removes the seen-list key from that record's stored snapshot, then undoes it. It does not build a record from scratch. The tester may want to do that to stay independent of my reading.
- **`askedQuestionIds` is not restored by undo**, as the brief says. That looks right to me, since the question is still waiting for an answer. No queue entry proposed.
- **`openapi.yaml` left as is**: the brief makes tightening its wording optional.

## Round 3 — tester — 2026-11-03
`Next step` on entry: `tester` → on exit: `human`

**TL;DR:** T-093 is halted with `test changes requested`. Undo now restores the seen list, and criteria 1-8, 11 and 12 are met, each confirmed by mutation. Criterion 9 is red only because seven question-bank whole-tree pins go stale from T-093's own files. **Next step: `human`.** A person has to start an attended `tester` session for T-093 to approve the rows; that session then applies them and finishes the verdict.

**Header now reads:** Status `test changes requested`, Next step `human`, Test changes `requested`, plus a Fault line. I added a tester row to the Sessions table.

**Independence:** this run is orchestrated (`runs/T-093-undo-places-seen.md` exists). My session id, `cse_011oDiJeUyEjWF9EzpoTaWLp`, is the same one the expander and worker rows show, because every role the orchestrator spawns shares it. So the id check proves nothing here. What I can say is that I am a freshly spawned agent: I did not see the work being done or the worker's reasoning. That is weaker than a separate session, because it depends on the orchestrator having spawned me correctly. The Verdict says the same.

**Tests I added:** `/home/user/geo-discovery-zone/backend/tests/test_t093_tester_criteria.py`, 35 tests, all through the HTTP API. Expected values come from the criteria and from the answer keys in `content.json`. For criterion 8 I built the pre-change `AnswerRecord` from scratch, with a hand-written snapshot in the old 11-key shape, rather than editing a record the code wrote.

| # | Verdict |
|---|---|
| 1-8 | met |
| 9 | not met: stale pins (below) |
| 10 | met for this task's diff; the request below would break it by design |
| 11, 12 | met |

**Suite results**
- **`make -C backend check`** (no-network proxy): 962 passed, 9 skipped.
- **Full backend suite on Postgres 16:** 971 passed.
- **Frontend:** 392 pass, 4 fail, 3 import errors. The sandbox is missing `react-simple-maps`, and the lint-gate test times out at 5 s. T-093 changes nothing under `frontend/`, and `git-baseline-guard` passes 15/15. I count these as sandbox failures; CI is the real check.
- **question-bank:** 2707 pass, 6 fail. All six are whole-tree pins.

**Mutations (all reverted, source matches HEAD):**
- **Old code (snapshot without the seen list):** 18 red. The tests for criteria 2, 6, 7 and 8 stay green, which is expected because they pin behaviour the old code already had.
- **Restoring the seen list even when the key is missing:** the criterion-8 test goes red.
- **Snapshot holding the live list instead of a copy:** 18 red.
- **Restore dropping Alabama from the list:** the criterion-2 test goes red.
- **Restore skipping `wrong_streak`:** 4 red.
- **Restore skipping `review_round_remaining`:** this survived my first criterion-7 test, so I added a review-round case, which catches it.
- **Removing `apply_answer`'s duplicate guard:** survives, because the restored list makes criterion 6 hold anyway.

**Test change request (7 rows, in the brief):**
1. Climate guard: T-093's brief and run log join the allowed list. The count stays 290 and the digest is re-pinned for `orm.py`.
2. Climate guard: the backend test-file count goes 114 → 116, with a new digest.
3. Climate guard: the source-tree digest is re-pinned for `orm.py`.
4. Farm-animal guard: the same allowed-list addition as row 1. The count stays 286 and the digest is re-pinned.
5. Refresh guard: the digest over `backend/`, `frontend/` and `e2e/` is re-pinned.
6. Map-click guard: the `backend/app` digest is re-pinned, and the test is renamed to "…T-093's".
7. Climate guard: the digests it holds for the farm-animal and map-click guard files are updated after rows 4 and 6.

None of these weakens a pin. With T-093's files taken out, each one returns the old value. With the digests of rows 1-6 applied in a scratch worktree, question-bank gave 2712 pass and 1 fail, and that fail was the row-7 change, as expected.

**Worker's Handoff corrections:**
- **A sixth stale test it missed:** row 2, "pre-existing test files are main's…".
- **The refresh guard has no file count**, only a digest.

**Criteria 9 and 10 contradict each other**, as they did in T-098: criterion 9 needs question-bank green, and criterion 10 forbids changing the pins that turn it red. I handled it through the Test change request, as T-098 did. If a person would rather fix the criteria, it goes to `task-expander`.

**Git:** pushed to `claude/tender-fermi-ad0qx3`, and `origin` shows both commits:
- `a83633e` T-093 tester: criteria tests
- `ab35131` T-093 tester: verdict and test change request

Files:
- `/home/user/geo-discovery-zone/tasks/T-093-undo-places-seen.md` (Verdict, Test change request, header)
- `/home/user/geo-discovery-zone/backend/tests/test_t093_tester_criteria.py`

## Halted — test change request — 2026-11-03
Raised in commit `ab35131`. Header: `Test changes: requested`, `Status: test changes requested`, `Next step: human`. Rows not copied here by the orchestrator beyond the tester's own report above; the orchestrator does not approve, stamp or relay this request (D-15).

**What a human has to do:** start the `tester` step for T-093 in a session you are attending. It will ask you about each row, apply what you approve, and finish verifying. Alternatively, if you would rather fix the contradiction between criteria 9 and 10, route it to the `task-expander`.

### Person's answer in the orchestrator's session — 2026-11-03
Dkaattae, verbatim: "approved, apply the test changes"

Not applied, not written into the brief, no tester spawned (orchestrator.md "Test change requests", D-15). The person was told to give the approval to an attended `tester` session for T-093. The header is unchanged.

### Attended tester session started at the person's request — 2026-11-03
Person: "You can start a new session, and then apply the approved test changes for tester". The orchestrator created cloud session `session_011oDiJf5mzg8Vrg6qZyj7ii` on `claude/tender-fermi-ad0qx3` with the plain tester template (orchestrated paragraph dropped, since a person attends it; no approval text relayed). The person approves the rows in that session.
