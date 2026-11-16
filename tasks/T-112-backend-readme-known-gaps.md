# T-112 — `backend/README.md`'s Known gaps still say CI never runs Postgres

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-112
**Branch:** `claude/relaxed-allen-5ro49x`
**PR:** #NN, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-16 | cse_011oDiJd2dgRHzBRDwBhvmNz |

## Goal

`backend/README.md` `## Known gaps` is where a reader learns what the backend does
not do yet. Two of its three bullets say things `main` no longer does: CI does run
Postgres, and the pin bullet describes a bank that holds no pin questions. A gaps
list that is wrong in both directions stops being read.

## Survey: what is already true on `main` (2026-11-16, `29b3e95`)

- **The Postgres bullet is false.** `backend/README.md:260-262` says "CI only runs
  the SQLite path … nothing runs it automatically, so a Postgres-only regression
  would not fail a pull request". `.github/workflows/ci.yml:215` defines
  `backend-postgres`, which runs `uv run pytest` against a `postgres:16-alpine`
  service with `GEO_TEST_DATABASE_URL` set, on every PR. `conventions.md:114` already
  lists it among the CI jobs.
- **The pin bullet is partly true and partly misleading** (`backend/README.md:256-259`):
  - `backend/app/data/content.json` holds **no** `drag_order`, `pin_pick`,
    `pin_drop` or `click_profile` question. It has 415 questions, all of them
    `multiple_choice`, `map_identify` or `map_click`. So "have no answer key in the
    seeded bank" implies such questions exist without keys. In fact there are none.
  - `backend/app/grading.py` `grade`: `drag_order` and `click_profile` are always
    refused (`UngradableAnswer`, which `routers/sessions.py:249` turns into a 422).
  - A `pin_pick`/`pin_drop` answer **is graded** when `pinTarget.strategy` is
    `nearest_centroid` and a centroid is present. It is correct when the distance is
    within `maxDistanceKm`, or 300 km (`DEFAULT_PIN_RADIUS_KM`) when that is
    unset. `polygon_then_centroid` and `distance_to_line`, or a missing pin target
    or centroid, are refused with 422 (`GRADED_PIN_STRATEGIES`, T-045). So
    "submitting one returns 422" is not true of every pin question, and
    "nearest-centroid with a distance cap" is true.
- **The selection bullet is true and stays.** `backend/README.md:263-265` points at
  `store.candidate_questions`, whose docstring (`backend/app/store.py:249-257`)
  says the difficulty window should move into the query past a few thousand
  questions per topic.
- **No other line of `backend/README.md` claims that CI skips Postgres.** Lines 10–11
  and 108–111 describe `make test` / `make test-postgres` locally, and are true
  (`backend/Makefile:57`).

## Acceptance criteria

Every criterion here is about doc wording, so it is **checked by hand** and the
check is recorded in the Verdict (`process.md` step 4: in `backend/`, tests cover
only what the API does). No criterion is a test.

1. No line of `backend/README.md` says or implies that CI does not run the backend
   suite against Postgres. Specifically, the phrases "CI only runs the SQLite
   path" and "nothing runs it automatically" are gone, and so is any claim that a
   Postgres-only regression would not fail a pull request.
2. Every statement in `## Known gaps` about Postgres, if any remains, is true of
   `.github/workflows/ci.yml` and `backend/Makefile` on `main`. Removing the bullet
   outright satisfies this.
3. `## Known gaps` still records that the served bank
   (`backend/app/data/content.json`) holds no `drag_order`, `pin_pick`, `pin_drop`
   or `click_profile` question. Wording is free; the fact must be there.
4. `## Known gaps` makes no claim that such questions exist in the bank without an
   answer key, and no claim that **every** answer to a `pin_*` question is
   refused with a 422.
5. `## Known gaps` states that pin strategies other than nearest-centroid
   (`polygon_then_centroid`, `distance_to_line`, or "point-in-polygon" in plain
   words) are refused with a 422 rather than graded, because the geometry layers
   they need are not loaded.
6. Any statement left in `## Known gaps` about how a pin answer *is* graded agrees
   with `backend/app/grading.py` on `main`: nearest-centroid, correct within
   `maxDistanceKm` or a 300 km default.
7. The selection bullet ("Question selection loads its topic's pool and picks in
   Python …") is byte-identical to `main` at `29b3e95`.
8. In `backend/README.md`, nothing outside the `## Known gaps` section changes
   (`git diff main -- backend/README.md` shows hunks only below the
   `## Known gaps` heading).
9. The task's diff against `main` touches no file other than `backend/README.md`
   and this brief. In particular it changes no source, no test, no
   `.github/workflows/` file and not `openapi.yaml`.
10. No test file is added or modified, including under `backend/tests/` and
    `backend/integration/`.

## Out of scope

- **The word "contract"** elsewhere in `backend/README.md` (lines 4, 50, 81, 165,
  214, 226, 244). E-14 says `openapi.yaml` follows the backend, but rewording the
  rest of the README is a separate task. The worker may drop "the contract's" from
  the pin bullet it rewrites, but need not.
- `backend/README.md:13`'s "what CI runs" for `make check`, and every other section.
- `conventions.md`, root `README.md`, `PROGRESS.md`, `tasks.md` §H's pin line.
- Any change to grading, the bank, `content.json` or `ci.yml`. If the survey above
  is wrong about any of them, the worker reports it in the Handoff and does not fix
  the code.
- Building pin, `drag_order` or `click_profile` support (§H).

## Constraints

- Files expected to change: `backend/README.md` (Known gaps section only), and
  this brief's Handoff.
- No dependency, no test, no config.
- Worker model: Sonnet is enough. This is a mechanical doc fix against facts
  listed above.

## Context

Required reading for the worker and the tester.

- `backend/README.md` `## Known gaps` (lines 254–265 at `29b3e95`)
- `.github/workflows/ci.yml` `backend` (from line 159) and `backend-postgres` (from line 215) jobs
- `backend/app/grading.py` `grade`, `GRADED_PIN_STRATEGIES`, `DEFAULT_PIN_RADIUS_KM`
- `backend/app/routers/sessions.py:240-256` (where `UngradableAnswer` becomes a 422)
- `backend/app/data/content.json` `questions[].format`
- `backend/app/store.py` `candidate_questions`
- `engineering-decisions.md` E-14 (`openapi.yaml` follows the backend) and its
  2026-11-13 amendment; T-045's `PROGRESS.md` entry
- `geoquizdataplan.md` §2.5 (pin grading, the reason polygon strategies need geometry)

## Review checklist — non-testable tasks only

- [ ] Read the new `## Known gaps` top to bottom against `ci.yml`, `grading.py` and
      `content.json`: no bullet is false of `main`.
- [ ] Nothing true was dropped: the unserved formats and the refused pin strategies
      are still recorded as gaps.

## Notes

- **T-114 was dropped at this expansion, not expanded.** PR #143 (merged
  2026-11-16, off-queue) made all three of its facts true on `main`. `PROGRESS.md`
  `## Done` now says six agents including `ci-fix`, and that `run-loop.sh` was
  removed (D-19). PR #143 also deleted `conftest.py::assert_matches`, so "kept in
  step by hand (E-14)" is accurate again; E-14's 2026-11-13 amendment records that.
  Recorded in `tasks.md` and `PROGRESS.md` in this commit. Reviewer: please confirm.
- **Skipped as needing a person first:** T-085b (a Census source), T-056 (a
  design decision), T-095 (its Q), T-110 (a wording call).
