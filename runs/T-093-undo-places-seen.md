# T-093 — An undone answer still counts as a place seen — run log

**Task:** T-093 · **Branch:** `claude/tender-fermi-ad0qx3` · **PR:** #119
**Started:** 2026-11-03 · **Outcome:** in progress

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
