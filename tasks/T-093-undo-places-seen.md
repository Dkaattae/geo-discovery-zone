# T-093 — An undone answer still counts as a place seen

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** orchestrator — 2026-11-03, unattended run. See `runs/T-093-undo-places-seen.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-093
**Branch:** `claude/tender-fermi-ad0qx3`
**PR:** #119, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-03 | `cse_011oDiJeUyEjWF9EzpoTaWLp` (orchestrated: spawned subagent) |
| worker | 2026-11-03 | `cse_011oDiJeUyEjWF9EzpoTaWLp` (orchestrated: spawned subagent; same remote session id as the expander, so the tester must not run under it) |

**Not on the light path.** T-093 is sized S, but it needs more than four criteria
(`process.md`, "The light path"): the restore itself, the already-seen boundary,
the summary count, each format, re-answering after undo, and answers recorded
before the change. So this is a full brief.

## For the approver — read this first

**TL;DR:** Undo should take the place back out of the session's "places seen"
list, the same way it already rolls back the counts, the streaks and the level.
Nothing is built yet. **The queue entry left one choice open, and this brief
makes it.** Strike it before approving if you want the other one.

- **Chosen: undo removes the place.** The queue offered two options. One was to
  restore the list. The other was to decide that "a place looked at is a place
  seen" and write that in the undo docstring. This brief restores the list,
  because the code already promises that: the comment at
  `backend/app/routers/sessions.py:259-260` says "an undo restores exactly what
  was there", and `openapi.yaml`'s `undoAnswer` says it "backs out the most
  recent answer". Keeping the place counted would mean the code breaks its own
  comment. If you prefer that option, say so and this goes back to the expander.
- **Criterion 8 is beyond the queue entry.** An answer recorded just before
  this change ships has an undo snapshot with no seen list in it. Undoing it
  inside the 30-second window must not return a 500.

## Goal

"Oops, tapped by mistake" is meant to make a mis-tap as if it never happened.
Today it rolls back everything except `seen_entity_ids`, so a child's summary
says they saw a place they only mis-tapped. `map_click` makes this likelier,
because any of the 50 states can be tapped. Undo should restore the seen list
like every other field an answer changes.

## Acceptance criteria

"Seen list" means the `seenEntityIds` array in `GET /sessions/{sessionId}`.
"Undo" means a `DELETE /sessions/{sessionId}/answers/{answerId}` that returns
204. Every criterion is observed through the HTTP API, with the backend's
existing test client.

1. **A first answer on a place, undone, leaves the seen list as it was.** In an
   active session, answer a question about entity X when X is not in the seen
   list, then undo that answer. Afterwards the seen list equals, element for
   element and in the same order, the seen list read just before the answer.
   X is not in it. Check this both when the session had no answers yet (the
   list was `[]` before) and when it already held at least one other entity.
2. **Undo does not remove a place an earlier answer saw.** In one session,
   answer a question about entity X and keep that answer. Then answer a second,
   different question about the same X and undo only the second one. X is still
   in the seen list, exactly once, and the list equals the list read before the
   second answer.
3. **The summary's `placesSeen` counts only answers that stand.** Answer one
   question about X (not seen before), undo it, and end the session with
   `POST /sessions/{sessionId}/end`. `placesSeen` is the value it would have had
   with no answer at all, which is `0` for a session with no other answers. In
   the same scenario with one kept answer on a different entity Y, `placesSeen`
   is `1`.
4. **It holds for every served format and for both outcomes.** Criterion 1
   holds when the undone answer is a `map_identify`, a `multiple_choice` and a
   `map_click` question, each answered **correctly** and each answered
   **wrongly**.
5. **It holds for a review-round answer.** Criterion 1 also holds when the
   undone answer was served by `POST /sessions/{sessionId}/review-round`, for an
   entity not yet in this session's seen list (for example, one the profile
   queued for review in an earlier session).
6. **Re-answering after an undo counts the place once.** After criterion 1's
   undo, answering the same question again (it is back in `PRESENTING`) puts X
   in the seen list exactly once, and `placesSeen` at end of session counts it
   once.
7. **Everything undo already restored is still restored.** After an undo, the
   profile from `GET /profiles/{profileId}` equals what it was before the
   answer. The session's `counts`, `level`, `learnedEntityIds` and
   `reviewRoundRemaining` also equal their values before the answer. This is
   the behaviour pinned today by
   `backend/tests/test_sessions_api.py::test_undo_backs_out_the_answer_and_its_profile_effects`
   and `backend/tests/test_t051_tester_criteria.py::test_c20_undo_restores_profile_and_session_as_for_the_other_formats`,
   and both pass unmodified.
8. **An answer recorded before this change can still be undone.** Insert an
   `AnswerRecord` whose `session_before` snapshot has the shape from before this
   task (no seen-list key), as the session's most recent answer and inside the
   undo window, and undo it through the API. The response is 204, not 5xx. Every
   field criterion 7 names comes back to the snapshot's values. What the seen
   list holds afterwards is not specified (see Out of scope).
9. **The whole suite stays green.** `make -C backend check` (ruff lint, ruff
   format-check, the full unit suite) passes, and so do `cd frontend && bun test`
   and `cd question-bank && bun test`. The frontend run counts because
   `frontend/src/git-baseline-guard.criteria.test.ts` reads every backend test
   file.
10. **No pre-existing test is modified or deleted.** Every file that existed
    under `backend/tests/`, `backend/integration/`, `frontend/src/` and
    `question-bank/src/` before this task is byte-identical afterwards.
11. **No schema change, no dependency.** `backend/migrations/versions/` gains no
    file. `backend/pyproject.toml` and `backend/uv.lock` are unchanged.
12. **No network in tests.** The new tests run under the unit suite's
    dead-proxy guard and reach nothing outside the process.

## Out of scope

- **What the seen list holds after undoing a pre-change answer** (criterion 8).
  It only must not error. A worker may leave the list alone in that case, or
  rebuild it from the answers that remain. Either is fine, and neither is
  tested.
- **`asked_question_ids`.** Undo does not restore it either. The undone
  question comes back through `pending`, and whether it should also leave
  `askedQuestionIds` is a separate question about selection. Note it in the
  Handoff if it looks wrong. Do not change it.
- **The undo window, the "most recent answer only" rule, and the 404/409
  paths.** These stay as they are.
- **The frontend.** `frontend/src/lib/api/types.ts` already declares
  `seenEntityIds` and `placesSeen`, and the shape does not change.
- **`openapi.yaml`.** The `undoAnswer` description already says "backs out the
  most recent answer", and no schema changes. The worker may tighten the
  description to name the seen list, but nothing requires it.
- **Mastery, the review queue, level drift, and anything else in
  `grading.py`'s `apply_answer`** apart from how its seen-list append is undone.
- **A new `engineering-decisions.md` entry**, and edits to
  `test-guidelines.md` or `conventions.md`.
- **The integration (`backend/integration/`) and e2e (`e2e/`) suites.** No new
  tests go there. They must still pass in CI as they do today.

## Constraints

- **Files expected to change:** `backend/app/orm.py` (`SessionRecord.snapshot` /
  `restore`), or the undo path in `backend/app/routers/sessions.py`. Plus one new
  test file under `backend/tests/`. Nothing in `frontend/` or `question-bank/`.
- **The snapshot is JSON in an existing column** (`AnswerRecord.session_before`,
  `SqlJson`). Adding a key needs no migration. Criterion 11 forbids one.
- **Restore must tolerate a missing key** (criterion 8). Snapshots already
  written to a database do not have it.
- **Both databases.** The same code runs on SQLite and Postgres. CI's
  `backend (postgres)` job runs the unit suite against Postgres, so the new
  tests must not assume SQLite.
- **Python standard library only.** Ask before adding any dependency
  (`CLAUDE.md`, "Packages").
- **Ruff clean**, at `backend/pyproject.toml`'s line length of 100.
- **Test files are read by the frontend git guard.** A new backend test must not
  run `git` with a revision. There is no reason for it to run `git` at all.
- **A pre-existing test that turns red is not edited by the worker.** List it
  under the Handoff's "Tests made stale". The only change that should break one
  is the drift set in `test_c20_undo_restores_profile_and_session_as_for_the_other_formats`.
  That test compares two drift sets, `click_drift == identify_drift`, so
  removing `seenEntityIds` from both keeps it green. If it goes red, that means
  the formats disagree, and that is a bug, not a stale test.

## Context

Required reading for the worker and the tester.

- **The queue entry:** [`tasks.md`](../tasks.md) T-093, §E.
- **Where the place is added:** `backend/app/grading.py`, `apply_answer`,
  lines 190-191.
- **The snapshot and restore:** `backend/app/orm.py`, `SessionRecord.snapshot`
  and `SessionRecord.restore` (about lines 295-323). The profile's snapshot is
  `ProfileRecord.snapshot` / `restore` (about lines 157-190), and it is the
  model to follow.
- **Where snapshots are taken and used:** `backend/app/routers/sessions.py`,
  `submit_answer` (the comment at 259-260) and `undo_answer` (from line 313).
- **Where the list is read:** `backend/app/serializers.py:71` (`seenEntityIds`),
  and `end_session`'s `placesSeen` in `backend/app/routers/sessions.py` (about
  line 411).
- **The contract:** `openapi.yaml` `undoAnswer` (`DELETE
  /sessions/{sessionId}/answers/{answerId}`), `Session.seenEntityIds`, and
  `SessionSummary.placesSeen`.
- **Existing undo tests to mirror:** `backend/tests/test_sessions_api.py`, the
  `# -- undo` block. `backend/tests/test_t051_tester_criteria.py`, `_undo_drift`
  and the `force` fixture (line 277), which makes the next serve return a chosen
  question (useful for criteria 2 and 4).
- **Test rules:** [`test-guidelines.md`](../test-guidelines.md). No network.

## Handoff

**TL;DR:** Undo now restores the seen list. The session snapshot gained one key,
`seen_entity_ids`, and `restore` skips it when it is missing, so snapshots
written before this change still undo. That is a three-line change in
`backend/app/orm.py`, plus one new test file. The backend suite is green on
SQLite, and the touched files pass on Postgres. **Three question-bank
freeze-guards go red by design.** They pin `backend/` to old commits, and the
tester needs to re-pin them (listed below).

**Changed**

- **`backend/app/orm.py`**: `SessionRecord.snapshot` adds
  `"seen_entity_ids": list(self.seen_entity_ids)`. `SessionRecord.restore`
  assigns it back only `if "seen_entity_ids" in snapshot`.
- **`backend/tests/test_t093_undo_places_seen.py`** (new, 20 tests). 17 of
  them fail with the `orm.py` change stashed. The 3 that pass without it are
  criteria 2, 6 and 8, which already held: the old code never removed X,
  `apply_answer` never appends X twice, and the old restore never read the
  key. They are regression pins, not proof of the fix. All 20 pass with the
  change.
- **This brief.** Nothing else. No change to `routers/sessions.py`,
  `grading.py`, `openapi.yaml`, the frontend, migrations or the lockfiles.

**Criterion → where it lives → worker test**

| # | Behaviour lives in | Worker test |
|---|---|---|
| 1 | `SessionRecord.snapshot`/`restore` (`orm.py`), called from `submit_answer`/`undo_answer` unchanged | `test_undoing_the_first_answer_leaves_an_empty_seen_list`, `test_undoing_a_new_place_keeps_the_places_already_seen` |
| 2 | Same. The snapshot already holds the earlier X, so restoring it keeps X once | `test_undo_keeps_a_place_an_earlier_kept_answer_saw` |
| 3 | `end_session` `placesSeen = len(seen_entity_ids)`, unchanged, now fed a restored list | `test_places_seen_is_zero_after_...`, `test_places_seen_counts_the_kept_answer_...` |
| 4 | Format-agnostic: the restore does not look at format | the two criterion-1 tests, parametrised over `map_identify`/`multiple_choice`/`map_click` × correct/wrong |
| 5 | Same snapshot path. `is_review` does not branch it | `test_undoing_a_review_round_answer_restores_the_seen_list` (Texas, the demo profile's queued entity), correct and wrong |
| 6 | `grading.apply_answer`'s `not in` guard, unchanged | `test_re_answering_after_an_undo_counts_the_place_once` |
| 7 | Unchanged restore of every other field | `test_undo_still_restores_profile_counts_level_learned_and_review_round`. The two named pre-existing tests pass unmodified |
| 8 | The `if "seen_entity_ids" in snapshot` guard | `test_an_answer_with_a_pre_t093_snapshot_can_still_be_undone` |
| 9-12 | See "How to run" and "Suite state" | none. Criterion 12: the new file uses only the ASGI test client |

**Criterion 8: how the "pre-change" record is made.** The test records an
answer through the API, then rewrites that `AnswerRecord.session_before` in the
test's DB session to drop the `seen_entity_ids` key, flushes, and undoes it
through the API. The record is the session's most recent answer and inside the
window. I did not build an `AnswerRecord` from scratch. The tester may want to
do that, for independence from my reading.

**Criterion 8: what the list holds afterwards.** The list is left alone, as Out
of scope allows. A legacy undo therefore leaves the place in the list, which is
the old behaviour.

**Deliberately not done**

- **`asked_question_ids` is not restored** (Out of scope). It looks right to
  me. After an undo the question is still pending, so it has been served and
  is correctly "asked". No queue entry proposed.
- **`openapi.yaml` `undoAnswer` description not tightened.** It is optional,
  and "backs out the most recent answer" is already true now.
- **No new e2e/integration tests** (Out of scope).

**How to run**

```bash
make -C backend check                                  # ruff, format-check, unit suite
cd backend && uv run pytest tests/test_t093_undo_places_seen.py -q
GEO_TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost/geoquiz_test \
  uv run pytest -q tests/test_t093_undo_places_seen.py tests/test_sessions_api.py tests/test_t051_tester_criteria.py
cd frontend && bun test ; cd question-bank && bun test
```

**Suite state, as run in this session**

- **`make -C backend check`**: ruff clean, 63 files formatted, **927 passed,
  9 skipped**.
- **Postgres** (the local 16 cluster): the new file plus
  `test_sessions_api.py` and `test_t051_tester_criteria.py` gave **108
  passed**. I did not run the full suite on Postgres.
- **`frontend` `bun test`**: **392 pass, 4 fail, 4 errors**. The cause is
  environmental, and the result is identical with my change stashed.
  `react-simple-maps` could not be installed (the proxy returned 403 on the
  `d3-timer` tarball during `bun install --frozen-lockfile`), so the 4 files
  that import it error. `git-baseline-guard.criteria.test.ts` passes.
  (`bun install` also rewrote `frontend/README.md`. I reverted that. It is
  not part of this change.)
- **`question-bank` `bun test`**: **2708 pass, 5 fail**. 3 are mine (below).
  2 were already red on this branch before my change (with my change
  stashed: 2711 pass, 2 fail):
  - `farm-animal-loose-ends-verify.test.ts`, `T-096 criteria 17-21: the bank and the boundaries > criterion 21: ...`: tracked-file count 288, pinned 286.
  - `climate-cold-trade-accepted-verify.test.ts`, `T-091 criterion 22: the diff touches only the allowed files > ...`: count 292, pinned 290.

  Both counts are 2 over, which matches the expander/orchestrator adding
  `tasks/T-093-undo-places-seen.md` and `runs/T-093-undo-places-seen.md` on
  this branch. This is my reading only, not confirmed. **Tester to confirm
  and re-pin**, the same way as the three below.

**Tests made stale** (criterion 10 forbids me to touch them, so they are left red)

1. `question-bank/src/map-click-no-candidates-verify.test.ts`, `T-092 criterion 16: no other surface changes > backend/app (except [ "backend/app/content_build.py" ]) is byte-identical to T-053's`.
   It goes red because `backend/app/orm.py` changed, which the brief's
   Constraints expect. **Modify:** re-pin the `backend/app` digest at this
   task's commit.
2. `question-bank/src/refresh-regenerate-reminder-verify.test.ts`, `T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes > every tracked file under the three trees is as re-pinned by T-039, none added or removed`.
   It goes red because `orm.py` changed and
   `backend/tests/test_t093_undo_places_seen.py` was added. **Modify:**
   re-pin the digest, and the file count +1.
3. `question-bank/src/climate-cold-trade-accepted-verify.test.ts`, `T-091 criterion 20: no non-test source file moves > every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's`.
   It goes red because `orm.py` changed. **Modify:** re-pin the digest.

None of the pre-existing backend tests went red. That includes `test_c20_undo_restores_profile_and_session_as_for_the_other_formats`: both drift sets lost `seenEntityIds` together, as the brief predicted.

**Contradictions with the brief:** none found. One gap: criterion 10 ("every
pre-existing test file byte-identical") and criterion 9 ("question-bank `bun
test` passes") cannot both hold. Any `backend/app` change trips the three
freeze-guards above. This is the same recurring re-pin the guards' own
comments record (e.g. "re-pinned T-085a"), so it goes through the tester's
D-14 request rather than back to the expander. **Tester to raise; human to
approve the re-pins.**

## Verdict

## Notes

- **The change was smaller than the brief allowed for.** `seen_entity_ids` was
  simply missing from `SessionRecord.snapshot`. Nothing needed to change in the
  router.
- **Decided: on a legacy snapshot, leave the list alone rather than rebuild
  it.** Rebuilding from the remaining answers would be more correct. But it
  adds code for a 30-second window that closes for good minutes after deploy,
  and Out of scope says neither choice is tested. Reviewer to confirm or
  overturn.
- **Surprise:** the review-round test relies on the demo profile having Texas
  queued (`store.ensure_demo_profile`). If that seed changes, the test's
  `entityId == "us-state-tx"` assertion is the one that will say so.
