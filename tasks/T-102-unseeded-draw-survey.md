# T-102 — Other backend tests may assert on an unseeded draw

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-102
**Branch:** `claude/fervent-ptolemy-4py2eg`
**PR:** #NN, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-06 | cse_011oDiJbsZTbExMiPULZMiFd |

## Goal

T-101 (PR #124) pinned the draw of three tests and did not check any others. This
task finds every other `backend/tests/` test whose result depends on which
question the router happens to draw, and either pins its draw or shows that it
passes whatever is drawn. The aim is that the backend suite cannot pass or fail
by chance.

## Definitions used by the criteria

- **Router serve.** A request that makes the app pick a question:
  `POST /sessions` with `serveFirstQuestion` true or left out (it defaults to
  `True`, `backend/app/models.py:362`), `POST /sessions/{id}/next-question`, or
  `POST /sessions/{id}/review-round`. All three reach
  `app.routers.sessions._serve_next` → `pick_question`
  (`backend/app/routers/sessions.py:112`).
- **Draw-dependent assertion.** An assertion whose truth can change with the
  choice `pick_question` makes from its pool. That pool is
  `store.candidate_questions` (`backend/app/store.py:249`), which has **no
  `ORDER BY`**, and the choice comes from module `random`, which nothing
  seeds. Examples: which id, entity, format or topic was served; how many
  distinct questions, states or formats a run of serves reaches; whether an
  answer built from the served question is right; `isReview`; the summary that
  follows from those answers.
- **Pinned.** The test's router serves do not depend on module `random` or on row
  order. That means the `fixed_draw` fixture (`backend/tests/conftest.py:206`),
  or a picker the test installs on `app.routers.sessions.pick_question` that
  returns a question it names (the `force` fixtures in
  `test_t051_tester_criteria.py`, `test_t093_tester_criteria.py`,
  `test_t093_undo_places_seen.py`).
- **Holds under any draw.** The assertion is true for **every** possible
  sequence of choices from the pools the test reaches. Examples: the pool has
  exactly one member, or the assertion is a property every member of the pool
  shares. "Fails with negligible probability" does **not** count.

## Acceptance criteria

1. **The survey exists.** The worker's `## Handoff` has a table with one row per
   test function in `backend/tests/` that makes at least one router serve and
   makes at least one draw-dependent assertion. Each row gives: the file and
   test name, the draw-dependent assertion or assertions (quoted or line
   numbers), and one classification: `pinned (fixed_draw)`, `pinned (force)`,
   `holds under any draw`, or `needs pin`.
2. **The survey is complete.** Every test function in `backend/tests/` that
   makes a router serve and makes a draw-dependent assertion has a row in that
   table. The tester checks this with its own survey, not from the worker's
   list. Tests that make router serves and assert only on draw-independent
   things (auth refusals, 404s, status codes on a session that is not active)
   may be left out, but the Handoff lists them by file and name, one line each,
   so leaving them out is visible.
3. **Each "holds under any draw" row gives its reason in terms of the pool.**
   For example: "topic `capital` pool, and the assertion is `topic == capital`
   for every serve", or "review pool has one member". The reason is a certainty
   argument, never a probability one. A row whose only support is "it passed N
   times" is a `fail` of this criterion.
4. **No test is left at `needs pin` when the task ends.** Every row the survey
   marks `needs pin` either runs under `fixed_draw` (or a force-style picker)
   after the task, through a Test change request a person approved (D-14,
   `process.md` step 4), or the brief records that person's decision not to pin
   it, with their reason. If the survey finds none, the Handoff says so in one
   line and no pre-existing test file changes.
5. **Pinning keeps the assertion.** A pre-existing test changed under criterion
   4 still makes every assertion it made before. The change adds the pin and
   only adjusts quantities, such as the number of serves played, where the
   pinned draw needs it, as T-101 did for c22. Nothing may be removed or
   loosened unless an approved Test change request row says exactly what and
   why.
6. **The surveyed tests pass under a perturbed draw.** Take every file in
   `backend/tests/` that contains the string `/sessions`. Run those files
   20 times, once for each pair of:
   - a module-`random` seed from 0 to 9, set with `random.seed(s)` at the start
     of every test, and
   - a candidate order: the order `store.candidate_questions` returns, or that
     order reversed.

   All 20 runs pass with zero failures and zero errors. How the perturbation is
   applied is up to the person running it, for example a throwaway pytest plugin
   passed with `-p`. It must not replace `app.routers.sessions.pick_question`,
   because that would disable the `force` and `fixed_draw` pins being tested.
   The tester reports the 20 results.
7. **Production code is unchanged.** `git diff origin/main...HEAD --
   backend/app/` is empty. Selection still draws from module `random` over the
   unordered pool. This task changes tests, not the app.
8. **T-101's pin is unchanged.** `FIXED_DRAW_SEED` stays `101`, and
   `fixed_draw`'s behaviour is unchanged: id-sorted candidates, one
   `random.Random(FIXED_DRAW_SEED)` per test, patched onto
   `app.routers.sessions.pick_question`. The three T-101 tests
   (`test_t040_tester_criteria.py` c25 and c22, and the `mixed` perfect-session
   test in `test_content_build.py`) are not modified.
9. **No new dependency.** `backend/pyproject.toml` and `backend/uv.lock` are
   unchanged. In particular, there is no `pytest-randomly` or similar plugin.
10. **The three unit suites pass:** `make -C backend test`, `cd frontend && bun
    test`, `cd question-bank && bun test`. No test reaches the network (CI's
    dead-proxy guard, `tasks.md` §A).

## Out of scope

- **`backend/integration/` and `e2e/`.** They run against a real stack, and
  their draw is a different question. If the survey finds a likely flake there,
  queue it in `tasks.md`.
- **Seeding or ordering production selection.** That includes adding `ORDER BY`
  to `store.candidate_questions`, giving the router an injected `rng`, or any
  other change under `backend/app/`. If the worker thinks production should
  change, it goes in Notes as a new task.
- **Tests that call `selection.pick_question` directly** with their own seeded
  `random.Random` (`test_selection.py`, `test_t089_tester_criteria.py`,
  `test_measure_selection.py`). They never touch the router.
- **Refactoring the existing `force` fixtures** in `test_t051_*` and `test_t093_*`
  into `conftest.py`, or merging them with `fixed_draw`.
- **Review and mastery semantics** (T-056).
- **Frontend and question-bank tests**, except for the whole-tree pins that
  criterion 10 may turn red (see Constraints).
- **Making the perturbation of criterion 6 a committed test or CI step.** It is
  a verification probe. If it should be permanent, queue that as a new task.

## Constraints

- **Files expected to change:** possibly none outside this brief. At most, test
  files in `backend/tests/` named in an approved Test change request, and
  additions to `backend/tests/conftest.py` that leave `fixed_draw` and
  `FIXED_DRAW_SEED` as criterion 8 requires.
- **The worker does not edit any pre-existing test** (D-14). It lists the
  candidates under **Tests made stale** with the proposed modification. The
  tester raises the Test change request, and a person approves it in an attended
  tester session. If the survey finds any `needs pin` row, **plan to attend the
  tester step.** Unattended, it halts at `test changes requested` / `human`.
- **Whole-tree pins (P-18).** Changes under `backend/tests/` have turned
  question-bank whole-tree digest pins red before (T-101: 5 of them). Run all
  three suites, not only the backend one, and list any pin that goes red under
  Tests made stale.
- **Postgres.** `make -C backend test-postgres` runs the same suite with a
  different row order. Criterion 6's reversed order stands in for it. The task
  does not require a Postgres run.
- **Dependencies:** none (criterion 9; [`CLAUDE.md`](../CLAUDE.md), Packages).

## Context

Required reading for the worker and the tester:

- **`tasks.md` §E, T-102.** Where this task came from. It notes that T-101's
  tester got 0 failures in 500 module seeds per test, so the T-099 failure may
  have come from row order or from random state used up earlier in the suite. A
  survey by reading will find these faster than seeding.
- **`PROGRESS.md`, "T-101 — Three mixed-session tests no longer pass or fail by
  chance".** What T-101 pinned and why c22 needed 300 serves.
- **`backend/tests/conftest.py:200-217`.** `fixed_draw` and `FIXED_DRAW_SEED`.
- **`backend/app/routers/sessions.py`.** `_serve_next` (line 83), and its
  callers `start_session` (line 146), `serve_next_question` (around line 183)
  and `start_review_round` (around line 356).
- **`backend/app/selection.py`.** `pick_question` and `review_pool`: windows
  1.5/3/6, then nearest; review every seventh serve; `chooser = rng or random`.
- **`backend/app/store.py:249`.** `candidate_questions`, which has no
  `ORDER BY`.
- **Files that request a `/sessions` path** (the scope of criterion 6, as of
  `a7945cf`): `test_content_build.py`, `test_sessions_api.py`,
  `test_t026_tester_criteria.py`, `test_t026_topics.py`,
  `test_t039_tester_criteria.py`, `test_t040_tester_criteria.py`,
  `test_t045_tester_criteria.py`, `test_t045_ungradable.py`,
  `test_t051_map_click.py`, `test_t051_tester_criteria.py`,
  `test_t053_answer_key_default.py`, `test_t053_tester_criteria.py`,
  `test_t093_tester_criteria.py`, `test_t093_undo_places_seen.py`. The list
  counts as the files that contain the string `/sessions` when the task runs.
- **`test-guidelines.md`.** The randomness and no-network guidance.
- **`process.md` step 4 and `process-decisions.md` D-14 / D-15.** How a
  pre-existing test is changed.

## Handoff

## Verdict

## Notes

**Expander, already true at `a7945cf`:**
- Three tests are pinned by `fixed_draw` (T-101).
- `test_t051_tester_criteria.py`, `test_t093_tester_criteria.py` and
  `test_t093_undo_places_seen.py` install their own `force` picker on
  `app.routers.sessions.pick_question` (lines 287, 75 and 37), so the tests
  that use it are already pinned.
- The likely work is the survey itself, plus whatever unpinned
  `test_sessions_api.py`, `test_t026_*`, `test_t040_*`, `test_t053_*` and
  `test_content_build.py` tests it turns up. I did not run anything (D-7), so I
  make no claim about which of them fail.
