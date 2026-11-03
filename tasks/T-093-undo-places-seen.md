# T-093 — An undone answer still counts as a place seen

**Status:** `test changes requested`
**Next step:** `human`
**Approved:** orchestrator — 2026-11-03, unattended run. See `runs/T-093-undo-places-seen.md`.
**Test changes:** `requested`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-093
**Branch:** `claude/tender-fermi-ad0qx3`
**PR:** #119, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:** test changes are waiting for approval: seven question-bank whole-tree pins (rows 1-7 below) go red because of T-093's own `orm.py` change, its two new backend test files and its loop records; criterion 10 forbids editing them and criterion 9 needs them green, so a person must approve the re-pins in an attended tester session.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-03 | `cse_011oDiJeUyEjWF9EzpoTaWLp` (orchestrated: spawned subagent) |
| worker | 2026-11-03 | `cse_011oDiJeUyEjWF9EzpoTaWLp` (orchestrated: spawned subagent; same remote session id as the expander, so the tester must not run under it) |
| tester | 2026-11-03 | `cse_011oDiJeUyEjWF9EzpoTaWLp` (orchestrated: freshly spawned subagent; the shared id is the orchestrator's, not evidence of separation, see Verdict) |

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

**TL;DR:** **Halted: test changes requested.** Undo now restores the seen
list. Criteria 1-8, 11 and 12 are met, and mutation confirms each one.
Criterion 9 is red only because seven question-bank whole-tree pins go stale
from T-093's own files. Those pins need the seven-row Test change request
below. Nobody can approve it in this orchestrated run, so **Next step: human**.
A person has to start an attended `tester` session for T-093, approve the rows
there, and let that session apply them and finish the verdict.

**Independence:** this run is orchestrated (`runs/T-093-undo-places-seen.md`
exists). My `$CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_011oDiJeUyEjWF9EzpoTaWLp`) is
the same id the expander and worker rows show, because every role the
orchestrator spawns shares it. So **the session-id check proves nothing here**.
I am a freshly spawned agent with my own context. I did not see the work being
done or the worker's reasoning. That is weaker evidence than a separate session,
because it depends on the orchestrator having spawned me correctly.

**Tests:** `backend/tests/test_t093_tester_criteria.py`, 35 tests, committed
in `a83633e`. They exercise the HTTP API through the conftest test client, with
`pick_question` forced to a chosen question from the real pool (the T-051
tester's pattern). The review-round tests use the real picker. Expected values
come from the criteria and from `backend/app/data/content.json`'s answer keys.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `test_c1_c4_undoing_a_first_answer_on_an_empty_list_leaves_it_empty` (list `[]` before and after) and `test_c1_c4_undoing_a_first_answer_keeps_the_places_already_seen` (`[CO]` before, `[CO, AL]` after the answer, `[CO]` after undo). Each is checked element for element |
| 2 | met | `test_c2_undo_does_not_remove_a_place_an_earlier_kept_answer_saw` with second answer `multiple_choice` / `map_click`: AL appears once and the list equals the one before the second answer |
| 3 | met | `test_c3_places_seen_is_zero_when_the_only_answer_was_undone` (0) and `test_c3_places_seen_is_one_with_a_kept_answer_on_another_place` (1) |
| 4 | met | both criterion-1 tests, parametrised over `map_identify` / `multiple_choice` / `map_click` × correct / wrong (12 cases) |
| 5 | met | `test_c5_undoing_a_review_round_answer_restores_the_seen_list`: real review round, `isReview` true, entity `us-state-tx`. Run on an empty list and on `[CO]`, correct and wrong |
| 6 | met | `test_c6_re_answering_after_an_undo_counts_the_place_once`, all 6 format/outcome cases: list is `[AL]`, `placesSeen` is 1 |
| 7 | met | `test_c7_undo_still_restores_the_profile_and_the_session_fields` (6 cases) and `test_c7_undo_of_a_review_round_answer_restores_review_round_remaining` (2 cases): profile equals before, and so do `counts`, `level`, `learnedEntityIds` and `reviewRoundRemaining`. Both named pre-existing tests pass unmodified |
| 8 | met | `test_c8_an_answer_with_a_pre_t093_snapshot_can_still_be_undone`. I built the `AnswerRecord` **from scratch**, not by editing the worker's record. Its `session_before` is hand-written in the 11-key shape from `git show 15aac14:backend/app/orm.py` and has no seen-list key. It replaces the record the API wrote, so it is the most recent answer, 5 s old. Result: 204, the criterion-7 fields are restored, and the question can be answered again |
| 9 | **not met: stale pins** | backend green on SQLite and Postgres. Frontend: `git-baseline-guard.criteria.test.ts` 15/15 pass. The other frontend reds come from the environment (below). question-bank: **2707 pass, 6 fail**, all whole-tree pins (rows 1-6) |
| 10 | met for this task's diff | `git diff --diff-filter=MDR 15aac14 -- backend/tests backend/integration frontend/src question-bank/src` is empty. The approved rows below would break this criterion by design; see "Contradiction" |
| 11 | met | `git diff --stat 15aac14 -- backend/migrations backend/pyproject.toml backend/uv.lock` is empty |
| 12 | met | `make -C backend check` with all six proxy variables set to `http://127.0.0.1:1` is green. Both new files use only the ASGI client, and neither runs `git` |

**Suite runs (this session)**

- **`make -C backend check`** (dead proxy): ruff clean, format clean, **962
  passed, 9 skipped**.
- **Full backend suite on Postgres 16** (`GEO_TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost/geoquiz_test uv run pytest -q`):
  **971 passed**.
- **`cd frontend && bun test`**: **392 pass, 4 fail**, plus 3 import errors.
  The errors are `Cannot find package 'react-simple-maps'`, because it is not
  installed in this sandbox. The lint-gate test (`bun run lint exits 0`) also
  fails, after 5 s. T-093 touches nothing under `frontend/`, the diff is empty,
  and `git-baseline-guard` passes. I count these as environment reds, not as
  T-093's. CI is the real check.
- **`cd question-bank && bun test`**: **2707 pass, 6 fail**:
  - `T-092 criterion 16 › backend/app … byte-identical to T-053's` (row 6)
  - `T-087 criterion 15 › every tracked file under the three trees …` (row 5)
  - `T-096 criteria 17-21 › criterion 21 …` (row 4)
  - `T-091 criterion 20 › every non-test file …` (row 3)
  - `T-091 criterion 22 › every tracked non-test file outside the allowed list …` (row 1)
  - `T-091 criterion 22 › pre-existing test files are main's …` (row 2). The
    worker's Handoff missed this one: it went red once
    `test_t093_undo_places_seen.py` was tracked.

**Mutations (each reverted; `git diff` of source is empty afterwards)**

| Mutation in `backend/app` | Result |
|---|---|
| M1: drop `seen_entity_ids` from `SessionRecord.snapshot` (the pre-fix code) | **18 red**: c1 ×12, c3 ×2, c5 ×4. c2, c6, c7 and c8 stay green. That is expected, because those criteria pin behaviour the old code already had |
| M2: restore the key unconditionally | **c8 red** (KeyError → 500) |
| M3: snapshot the live list instead of a copy | **18 red** (the snapshot aliases the list `apply_answer` appends to) |
| M4: drop `apply_answer`'s `not in` guard | all green, because restore resets the list before the re-answer, so c6 still holds. It goes red only together with M1 |
| M5: restore filters AL out of the snapshot | **c2 red ×2** |
| M6: restore skips `review_round_remaining` | **c7 review-round tests red ×2**. My first version had only the non-review c7 test, and M6 survived it, so I added the review-round case |
| M7: restore skips `wrong_streak` | **4 red** (c7/c8) |

**Probes behind the Test change request** (scratch worktrees, removed afterwards)

- **At `15aac14` (main)**, the four guard files pass 160/160, so every old pin
  matches main.
- **`git diff --stat 15aac14 HEAD -- backend frontend e2e question-bank/src`**
  shows only `backend/app/orm.py` and the two new `backend/tests/test_t093_*`
  files.
- **With `15aac14`'s `orm.py` swapped in** and the two T-093 loop records added
  to the allowed sets, rows 1, 3 and 4 return their old digests with unchanged
  counts. With the two T-093 test files filtered out, row 2 returns the old
  digest at 114. So each re-pin moves only because of this task's files.
- **In a worktree at `a83633e` with the digests of rows 1-6 applied**
  (comments and the rename left out), question-bank gave **2712 pass, 1 fail**.
  The fail was the row-7 cascade, as predicted.

**Contradiction (same as T-098's).** Criterion 9 wants question-bank green.
Criterion 10 forbids changing any pre-existing file under `question-bank/src/`.
The Constraints require a change under `backend/app/` and a new backend test
file, and the T-087, T-091, T-092 and T-096 pins forbid both. So criteria 9 and
10 cannot both hold without a Test change request. **Owner:** the tester, via
D-14, which is the precedent T-039, T-045, T-053 and T-098 set. If a person would
rather treat this as a defect in the criteria, it goes to `task-expander`.

**Notes for the reviewer**

- **Undoing a legacy snapshot leaves the place in the seen list.** I observed
  this but did not assert it, because Out of scope leaves it open.
- **The worker's Handoff said row 5's test has "the file count +1".** It does
  not: that test pins one digest and no count.
- **Row 5's and row 2's digests include `test_t093_tester_criteria.py`'s bytes
  at `a83633e`.** If anyone edits that file, both digests need recomputing.

## Test change request

These pins go stale because of T-093's own files. The Constraints require the
`backend/app/orm.py` change and a new file under `backend/tests/`, and every
task adds its brief and run log. **No row weakens a pin.** Rows 1 and 4 follow
the T-098 precedent: the task's loop records join the allowed set, and the
counts stay the same. `orm.py` stays counted, so the digest is re-pinned and
still covers its new bytes. Rows 2, 3, 5 and 6 re-pin to digests that include
T-093's files, and each one was checked to return the old pin once those files
are taken out (Verdict, "Probes"). Row 7 is the cascade that T-053 row 33 and
T-098 row 5 also needed. Paths are relative to `question-bank/`.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091 tester: no non-test file outside T-091's allowed set changes or appears | T-093's brief and run log are new tracked non-test files (292 ≠ 290), and `backend/app/orm.py` (counted) moved | modify | Same name. Add `tasks/T-093-undo-places-seen.md` and `runs/T-093-undo-places-seen.md` to `CRITERION_22_ALLOWED`, with a comment citing T-093 row 1. `MAIN_UNTOUCHABLE_COUNT` stays **290**. `MAIN_UNTOUCHABLE_SHA` `d7ac83e4…5381` → `5e702ce3585afc89dd0c4502e421b53232d9c78830e382d39acbf0ad360bd91d`, comment "Re-pinned by T-093 (Test change request row 1): backend/app/orm.py moved". With 15aac14's `orm.py` the old digest returns (verified) | |
| 2 | same file › same describe › "pre-existing test files are main's, except ones in an approved Test change request" | `950f334`, T-091 tester: no test file is added, removed or modified outside named exceptions | T-093 adds `backend/tests/test_t093_undo_places_seen.py` (worker) and `backend/tests/test_t093_tester_criteria.py` (tester) (116 ≠ 114) | modify | Same name and filter. `MAIN_TESTS_COUNT` **114 → 116**. `MAIN_TESTS_SHA` → `d367f38f012bc230f27fd0125d70bd6ea5f98bc7334dbe495455bd5a9a303c1c`, comment "Re-pinned by T-093 (Test change request row 2): T-093 added test_t093_undo_places_seen.py and test_t093_tester_criteria.py (114 -> 116)". Without those two files the set equals the old pin at 114 (verified) | |
| 3 | same file › "T-091 criterion 20: no non-test source file moves" › "every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's" | `950f334`, T-091 tester: no non-test source file under the three trees moves | `backend/app/orm.py` moved, as the Constraints require | modify | Same name and file set. `MAIN_SOURCE_TREES_SHA` `4c2368a1…e55c` → `c6cf34f62a80d9bbc4d598c662416789eef40544da248e135c956d8053ffcfe9`, comment "Re-pinned by T-093 (Test change request row 3): backend/app/orm.py moved". With 15aac14's `orm.py` the old digest returns (verified) | |
| 4 | `src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21: the bank and the boundaries" › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096 tester: no non-test file outside T-096's allowed set changes or appears | Same as row 1 (288 ≠ 286) | modify | Same name. Add the same two T-093 paths to `CRITERION_21_ALLOWED`, with a comment citing T-093 row 4. Count stays **286**. `MAIN_UNTOUCHABLE_SHA` `6e9754b8…ff78` → `7ad951c78424a1af05401c47e2499b0df94035ebe36626e9ad21ec2b3e847d12`, comment "Re-pinned by T-093 (Test change request row 4): backend/app/orm.py moved". With 15aac14's `orm.py` the old digest returns (verified) | |
| 5 | `src/refresh-regenerate-reminder-verify.test.ts` › "T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes" › "every tracked file under the three trees is as re-pinned by T-039, none added or removed" | `40f6c54`, T-087 tester (re-pinned by T-039, T-045, T-053, T-098): every file under the three trees is pinned | `orm.py` changed and two backend test files were added | modify | Same name and file set. `MAIN_BOUNDARY_SHA` `1ea8c50d…676af` → `69778f17e64fe1807c7b32e746056a6951d5f310dfdeda82aafa702f7c989bc2`, comment "Re-pinned by T-093 (Test change request row 5): T-093 changed backend/app/orm.py and added two backend test files". The digest includes the bytes of both test files at `a83633e`. At 15aac14 the old pin holds, and the diff from there is only those three files (verified) | |
| 6 | `src/map-click-no-candidates-verify.test.ts` › "T-092 criterion 16: no other surface changes" › `backend/app (except [ "backend/app/content_build.py" ]) is byte-identical to T-053's` | `cf63f66`, T-092 tester (re-pinned by T-085a, T-088, T-045, T-053): `backend/app` does not move | `orm.py` moved | modify | Renamed to `… is byte-identical to T-093's` (as T-053 renamed it). Same exception list. Digest `5f842800…2493` → `0da5b1a578fb9d632876527639660153c1e11c83462c904d405e236695550b32`. Add "Re-pinned at T-093 (Test change request row 6), after T-093 added the seen list to the session undo snapshot in orm.py" to the comment above it | |
| 7 | `src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | `bac230d`, T-091 tester: the files in its request hold exactly their approved re-pins | Green today. Rows 4 and 6 change `farm-animal-loose-ends-verify.test.ts` and `map-click-no-candidates-verify.test.ts`, whose digests are pinned in `APPLIED_REQUEST_FILE_SHAS` | modify (only for the files whose row is approved) | Same name. Re-pin those two entries of `APPLIED_REQUEST_FILE_SHAS` to each file's sha256 after rows 4 and 6 are applied. Extend their comments with ", then by T-093 (row 7)". `MAIN_REQUEST_FILE_SHAS` and every other entry stay as they are | |

**To approve:** start the `tester` step for T-093 in a session you are
attending, and approve or refuse each row there. That tester applies the
approved rows as `T-093 tester: apply approved test change request`. It then
re-runs all three suites and writes the final verdict.

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
