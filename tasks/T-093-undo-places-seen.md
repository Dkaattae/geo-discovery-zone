# T-093 — An undone answer still counts as a place seen

**Status:** `awaiting approval`
**Next step:** `worker` — once a person replaces `pending` below
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-093
**Branch:** `claude/tender-fermi-ad0qx3`
**PR:** #NN, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-03 | `cse_011oDiJeUyEjWF9EzpoTaWLp` (orchestrated: spawned subagent) |

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

## Verdict

## Notes
