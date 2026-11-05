# T-101 — A mixed-session format assertion can fail by chance

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-11-05, unattended run. See `runs/T-101-mixed-session-format-flake.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-101
**Branch:** `claude/pensive-cori-y64q82`
**PR:** #124, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-05 | cse_011oDiJfGwhpXZVuG9dHVa98 |

> **Plan to attend the tester step.** The whole deliverable is a change to tests
> that already exist on `main`. Only the tester may make it, through a Test change
> request a person approves in the tester's own session (`process-decisions.md`
> D-14, D-15). An unattended tester will halt at `test changes requested` /
> `human`; that halt is expected, not a fault.

## Goal

Three backend tests assert that a randomly drawn session served every question
format. `selection.pick_question` draws with the module-level `random` and nothing
seeds it, so those assertions are probabilistic: `make -C backend check` went red
once on one of them during T-099 and green on rerun. A suite that can fail by
chance teaches everyone to rerun red, which is how a real failure gets waved
through.

## Survey — what is already true

Read from the source on `main` at `5cc0ecb`, not run.

- **The draw is unseeded in production and in tests.** `backend/app/routers/sessions.py:112`
  calls `pick_question(...)` with no `rng`, so `selection.py` uses
  `chooser = rng or random` — the module-level generator. No test touching these
  sessions seeds it (`random.Random(...)` appears only in `test_selection.py` and
  `test_t089_tester_criteria.py`, which call `pick_question` directly).
- **The bank holds 50 `map_identify`, 50 `map_click` and 315 `multiple_choice`**
  questions (`backend/app/data/content.json`). A mixed session's first 100 serves
  are a level-windowed random draw from all 415, so nothing guarantees a
  `map_identify` among them.
- **Candidate order is not fixed either.** `store.candidate_questions`
  (`backend/app/store.py:249`) has no `ORDER BY`, so `chooser.choice(pool)`
  indexes into whatever order the database returns. In practice SQLite and a
  freshly loaded Postgres table both return insertion order, but the suite runs on
  both (CI jobs `backend` and `backend (postgres)`), so a fix that works by fixing
  the draw has to hold on both. Criterion 6.
- **The queue entry names one test; the survey found three** with the same defect.
  This brief covers all three, because fixing one leaves the same flake two
  functions away:
  - **(A)** `backend/tests/test_t040_tester_criteria.py::test_c25_a_perfect_mixed_session_reaches_100_distinct_served_questions`
    — line 476, `{formats of 100 served} == {map_identify, map_click, multiple_choice}`.
    The one T-099's worker saw fail. Function from `acaa4a1` (T-040 tester); the
    three-format set from `7792f87` (T-051 tester, Test change request row 19).
  - **(B)** `backend/tests/test_content_build.py::test_a_perfect_session_reaches_every_question_once[mixed-100-...]`
    — line 460, the identical assertion on the `mixed` parametrisation. Test from
    `25c7847` (T-040 worker); the `mixed` row's three-format set from `7792f87`
    (T-051 tester, rows 11–12).
  - **(C)** `backend/tests/test_t040_tester_criteria.py::test_c22_every_wrong_answer_names_the_answer_and_highlights_the_state`
    — line 490, the same three-format equality over 200 wrong answers, and line
    491, `>= 40` distinct states. Function from `acaa4a1` (T-040 tester); 200
    answers from `f1b9de5` (T-026 tester); three formats from `7792f87`.
- **Not affected, and must stay as they are:** the `location` and `capital`
  parametrisations of (B) and of `test_c20_c21_c25_a_perfect_topic_session_...`
  are deterministic — 100 serves of a 100-question topic, and 50 of a
  one-format topic, serve the whole topic. `test_t051_tester_criteria.py:100` and
  `test_t053_tester_criteria.py:99,110` read whole lists, not draws.
- **No source change is expected.** Selection's randomness is the product
  behaviour; the defect is in what the tests assert about it.

## Acceptance criteria

"(A)", "(B)" and "(C)" are the three tests named in the survey. "The three
formats" is `{"map_identify", "map_click", "multiple_choice"}`. "Module `random`"
is Python's module-level generator, the one `app.selection` uses when no `rng` is
passed.

1. **The defect is shown before it is fixed.** The Verdict records, for each of
   (A), (B) and (C) as they stand on `main` at `5cc0ecb`, either a module-`random`
   seed under which that test fails (seeded immediately before the test runs), or
   that no failing seed was found among 500 tried. (Reproduction is evidence, not
   a gate: "none in 500" for one of them does not by itself fail the task.)
2. **Each of (A), (B) and (C) passes whatever module `random` holds when it
   starts.** Run with module `random` seeded to each of at least 50 distinct values
   immediately before the test, every run passes — including, for each test, the
   failing seed from criterion 1 where one was found.
3. **(A) and (B) still fail when a format goes missing.** With any one of the three
   formats removed from the questions a mixed session can be served (a temporary,
   uncommitted mutation, e.g. filtering it out of `store.candidate_questions`),
   (A) fails, and so does (B)'s `mixed` case. Checked once per format: three
   mutations, each red, each reverted.
4. **(C) still fails when a format goes missing**, by the same three mutations as
   criterion 3.
5. **(C) still fails when wrong answers reach too few states.** With the mixed
   session's candidate questions restricted to 39 states (a temporary,
   uncommitted mutation), (C) fails. With them restricted to 40 states (the same
   mutation, one state more), the `>= 40` assertion does not fail.
6. **Each of (A), (B) and (C) passes on SQLite and on Postgres**: in
   `make -C backend test`, and in CI's `backend` and `backend (postgres)` jobs on
   the PR.
7. **Nothing else in (A), (B) or (C) weakens.** (A) still asserts 100 distinct
   question ids. (B)'s `mixed` case still asserts 100 distinct ids. (C) still
   checks every served question's reveal — `headline`, `answerLabel` and
   `mapHighlightGeometryId` — as it does on `main`. The format check in all three
   is still an equality with the three formats, not a subset, an "at least two",
   or a membership test.
8. **No other test changes.** The `location` and `capital` cases of (B) and of
   `test_c20_c21_c25_a_perfect_topic_session_covers_each_state_once_with_its_reveal`,
   and every other test that exists on `main` at `5cc0ecb`, are present and
   unedited on the branch. Every pre-existing test that is edited appears as an
   approved row of this brief's Test change request. (Checked by hand against the
   branch diff and recorded in the Verdict, not pinned in a test that diffs
   against a commit — E-11, E-12.)
9. **No test leaves module `random` changed for the tests after it.** After each of
   (A), (B) and (C) finishes, pass or fail, `random.getstate()` equals its value
   from just before the test started, and `app.selection.random` is the `random`
   module.
10. **Production selection is untouched**: no file under `backend/app/` changes,
    and nor does `backend/scripts/`. A child's session still draws at random.
11. **No dependency change**: `backend/pyproject.toml` and `backend/uv.lock` are
    untouched (no `pytest-randomly`, `hypothesis` or similar).
12. **No test reaches the network**: the changed tests use only the in-process
    `client` / `db_session` / `auth_headers` fixtures, and the backend suite passes
    with the proxy variables pointed at `http://127.0.0.1:1`, as CI runs it.
13. **The whole backend check passes** (`make -C backend check`: lint, format
    check, and the SQLite suite), and the frontend and question-bank suites pass
    unchanged.

## Out of scope

- **How the fix works.** Seeding the draw for the duration of the test, playing
  a mixed session long enough that selection guarantees every format, or anything
  else that meets criteria 2–9. The criteria do not prefer one.
- **Making production selection deterministic** — an `ORDER BY` in
  `store.candidate_questions`, an `rng` parameter threaded through the router, a
  per-session seed. Each changes `backend/app/` (criterion 10). If the tester or
  worker thinks one is needed for the tests to be robust, that is a new
  `tasks.md` entry.
- **`backend/integration/` and `e2e/`.** Their sessions run against a real stack
  and may have chance-dependent assertions of their own; this task does not look.
- **Any other chance-dependent test found in `backend/tests/`** beyond (A), (B)
  and (C). Name it in the Handoff or Verdict and it becomes a new `tasks.md`
  entry; it is not fixed here.
- **The bank** — `backend/app/data/content.json`, `question-bank/data/`, levels,
  and every bank-pinning guard T-095 owns.
- **`openapi.yaml`**, migrations, `geoquizdataplan.md`, child-facing text.

## Constraints

- **Files expected to change:** `backend/tests/test_t040_tester_criteria.py` and
  `backend/tests/test_content_build.py`, by the **tester only**, under approved
  Test change request rows (D-14, D-15). A new helper or fixture under
  `backend/tests/` is fine if those rows use it. Nothing else outside `tasks/`.
- **The worker writes no source and edits no pre-existing test.** Its Handoff
  says "nothing to implement", lists (A), (B) and (C) under **Tests made stale**
  (wrong, rather than stale: chance-dependent on `main`), and proposes what each
  becomes. That proposal is input to the tester, not a decision.
- **Never a route to green** (D-14): each modified test must catch a missing
  format, and (C) too few states, as hard as it did before — criteria 3–5 and 7.
- **Dependencies:** none, without asking (`CLAUDE.md` "Packages").
- **No test pinned to a commit** (E-11, E-12): criteria 1 and 8 are checked by
  hand and recorded in the Verdict.
- **Envelope:** the change is to pre-existing tests under a Test change request,
  so expect the reviewer to treat it as outside the routine envelope and copy the
  approved rows into the PR body.

## Context

Required reading for the worker and the tester.

- **Source:** `backend/app/selection.py` (`pick_question`, `LEVEL_SPANS`,
  `REVIEW_EVERY`, `RECENT_WINDOW` — what is and is not guaranteed about a draw);
  `backend/app/routers/sessions.py:112` (the call with no `rng`);
  `backend/app/store.py:249` (`candidate_questions`, no `ORDER BY`).
- **The three tests:** `backend/tests/test_t040_tester_criteria.py` — `play`
  (line 392), `test_c25_...` (469), `test_c22_...` (479);
  `backend/tests/test_content_build.py` — `test_a_perfect_session_reaches_every_question_once`
  (437–464). `backend/tests/conftest.py` for `client`, `db_session`,
  `auth_headers`.
- **Patterns already in the suite:** `test_selection.py` and
  `test_t089_tester_criteria.py` pass a seeded `random.Random` to
  `pick_question` directly; `test_t051_tester_criteria.py`'s `force` fixture
  monkeypatches `app.routers.sessions.pick_question`.
- **Queue entry:** `tasks.md` §E, T-101.
- **Decisions:** `process-decisions.md` D-14 and D-15 (who changes an existing
  test, and how it is approved); `engineering-decisions.md` E-11, E-12 (no tests
  pinned to a fixed commit); E-28 (selection's nearest-pool fallback).
- **Guidelines:** `test-guidelines.md` — no network; test below the transport
  where you can. These three are endpoint-level by design (T-040's criteria), so
  they stay on the in-process `httpx.ASGITransport` client.

## Handoff

## Verdict

## Test change request

## Notes

- **Why T-101 and not an earlier entry** (expander, 2026-11-05): §A and §B are
  empty; T-085b waits on a person's choice of Census source, T-056 on a design
  decision, T-095 on its Q (a/b/c). T-101 is the first entry with nothing to wait
  for.
- **Scope widened from the queue entry**: the entry names (A) only; (B) and (C)
  are the same defect, found in the survey. Approving this brief approves that.
