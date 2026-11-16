# T-112 — `backend/README.md`'s Known gaps still say CI never runs Postgres

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** orchestrator — 2026-11-16, unattended run. See `runs/T-112-backend-readme-known-gaps.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-112
**Branch:** `claude/relaxed-allen-5ro49x`
**PR:** #144, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-16 | cse_011oDiJd2dgRHzBRDwBhvmNz |
| worker | 2026-11-16 | cse_011oDiJd2dgRHzBRDwBhvmNz (orchestrated run; separate subagent from the expander) |
| tester | 2026-11-16 | cse_011oDiJd2dgRHzBRDwBhvmNz (orchestrated run; freshly spawned subagent, not the worker) |

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

## Handoff

**TL;DR:** `backend/README.md` `## Known gaps` rewritten: the false Postgres bullet is
deleted, the pin bullet now says the bank holds none of the four formats and states
exactly what is graded and what is refused. The survey was correct on every point. No
code or test touched; backend suite 785 passed / 9 skipped.

**What changed**

- `backend/README.md` — `## Known gaps` only (one diff hunk). The first bullet is
  rewritten. The "CI only runs the SQLite path" bullet is removed outright. The selection
  bullet is untouched.
- This brief: Status, Next step, Sessions row, Handoff, Notes.

**Where each criterion lives**

| # | Where |
|---|---|
| 1, 2 | Postgres bullet deleted. `grep -n -i postgres backend/README.md` hits only lines 4, 10-11, 96-136, 221, all outside Known gaps and true (`make test-postgres`, `GEO_TEST_DATABASE_URL`) |
| 3 | Bullet 1, sentence 1: "holds no `drag_order`, `pin_pick`, `pin_drop` or `click_profile` question" |
| 4 | No "no answer key" wording. 422 is attributed to `drag_order`/`click_profile` and to the non-centroid pin strategies only |
| 5 | Last sentence of bullet 1: `polygon_then_centroid` and `distance_to_line` refused with 422 because the geometry layers are not loaded |
| 6 | "graded only when the question's strategy is nearest-centroid and it stores a centroid: correct within `maxDistanceKm`, or 300 km when that is unset". Matches `grading.py:108-139` |
| 7 | Selection bullet unchanged (it sits outside the diff hunk) |
| 8 | `git diff origin/main -- backend/README.md` has one hunk, starting at `@@ -253` (the line under `## Known gaps`) |
| 9, 10 | This worker commit touches only `backend/README.md` and this brief. See the contradiction below |

**Survey checked, all correct:** content.json has 315 `multiple_choice`, 50 `map_identify`
and 50 `map_click` (415 in all). `ci.yml:215` has `backend-postgres` with `postgres:16-alpine`
and `GEO_TEST_DATABASE_URL`. In `grading.py`, `GRADED_PIN_STRATEGIES = {"nearest_centroid"}`
and `DEFAULT_PIN_RADIUS_KM = 300.0`.

**Contradictions with the brief**

- **Criterion 9 vs the branch.** `git diff origin/main --stat` on this branch also shows
  `PROGRESS.md`, `tasks.md` and `runs/T-112-backend-readme-known-gaps.md`. The expander
  committed those (T-114 drop, run log), not the worker. Read literally, 9 fails on the
  branch diff. Judged on the task's own change (the worker commit), it passes. **Owner:
  the tester decides which reading applies, and the reviewer confirms.**
- **Criterion 8 says `git diff main`.** The local `main` ref in this checkout is stale
  (`2634fc8`, PR #135), not `29b3e95`. Against it the diff falsely shows a third removed
  bullet ("The directory is `backend/` …"), which was already gone on `origin/main`. **Use
  `origin/main`.** Owner: tester.

**Deliberately not done:** the "contract" wording elsewhere in the README, and README:13.
Both are out of scope. I dropped "the contract's" from the bullet I rewrote, which the
brief allows.

**How to run:** `make -C backend check` (lint, format-check and tests: 785 passed, 9
skipped). `cd question-bank && bun test`: 229 pass, 0 fail. Frontend not run: it has no
`test` script under `bun run test`, and a README-only change cannot affect it.

**Tests made stale:** none.

## Verdict

**TL;DR: pass.** All 10 criteria met, every one checked by hand (doc-only task in
`backend/`, so no test is added, per the brief and `test-guidelines.md`). Backend
`make -C backend check` green: ruff, format-check, 785 passed / 9 skipped. Next: reviewer.

**Independence:** orchestrated run (`runs/T-112-backend-readme-known-gaps.md` exists),
so the session id is shared with expander and worker and the id check proves nothing.
My independence rests only on being a freshly spawned subagent with its own context: I
did not see the work done or the worker's reasoning. That is weaker than a separate
session, because it depends on the orchestrator having spawned me correctly.

**Handoff confirmed on branch:** commit `5e9d75b` touches `backend/README.md` and this
brief, as the Handoff says. All diffs below are against `origin/main` = `29b3e95`
(local `main` is stale, as the worker reported).

| # | Verdict | What I ran / saw |
|---|---|---|
| 1 | met | `grep -n -i -E 'postgres\|sqlite path\|automatically' backend/README.md`: hits at 4, 10-11, 96-136, 221 only, all about local SQLite/Postgres use; none says CI skips Postgres. Both quoted phrases are gone (diff shows the bullet removed). |
| 2 | met | No Postgres statement remains in `## Known gaps` (bullet removed). |
| 3 | met | Bullet 1: "The served bank (`app/data/content.json`) holds no `drag_order`, `pin_pick`, `pin_drop` or `click_profile` question". Checked: `content.json` formats are `multiple_choice` 315, `map_identify` 50, `map_click` 50. |
| 4 | met | No "no answer key" wording. 422 is attributed only to `drag_order`/`click_profile`, to non-centroid pin strategies, and (implicitly) a pin with no centroid; nearest-centroid pins are stated as graded. |
| 5 | met | "The `polygon_then_centroid` and `distance_to_line` strategies are refused with 422 rather than graded, because the geometry layers they need are not loaded." Matches `grading.py:44-46,118-124`; 422 from `routers/sessions.py` `except UngradableAnswer`. |
| 6 | met | "graded only when ... nearest-centroid and it stores a centroid: correct within `maxDistanceKm`, or 300 km when that is unset". Matches `GRADED_PIN_STRATEGIES = {"nearest_centroid"}`, `DEFAULT_PIN_RADIUS_KM = 300.0`, `grading.py:126-139` (`distance <= radius`). |
| 7 | met | Extracted the selection bullet from `git show 29b3e95:backend/README.md` and from the branch; `cmp` reports identical. |
| 8 | met | `git diff origin/main -- backend/README.md`: one hunk, `@@ -253,13 +253,15 @@`, starting at the blank line and `## Known gaps` heading context; all changed lines are below the heading. |
| 9 | met (see note) | `git diff origin/main --stat -- backend/app backend/tests backend/integration .github openapi.yaml frontend question-bank '*.test.*'`: empty. Branch diff also shows `PROGRESS.md`, `tasks.md` (expander commit `9f4ac17`, T-114 drop) and `runs/T-112-...md` (orchestrator commits `d2ac752`, `5082046`). The task's own work commit `5e9d75b` touches only `backend/README.md` and this brief. I judged 9 on the task's change; the extra files are loop bookkeeping, not source, test, workflow or `openapi.yaml`. **Reviewer: confirm this reading and the T-114 drop.** |
| 10 | met | Same empty stat over test paths; no `*.test.*`, `backend/tests/`, `backend/integration/` change. |

**Suite as run**

- `make -C backend check`: `ruff check` clean, `ruff format --check` "67 files already formatted", pytest **785 passed, 9 skipped** (Postgres-only tests skip without `GEO_TEST_DATABASE_URL`).
- `cd question-bank && bun test`: **229 pass, 0 fail**.
- Frontend not run: README-only change cannot reach it.

**Tests added:** none (no criterion is testable as API behaviour). **Pre-existing tests changed:** none. **Tests made stale:** none found.

## Notes

- **T-114 was dropped at this expansion, not expanded.** PR #143 (merged
  2026-11-16, off-queue) made all three of its facts true on `main`. `PROGRESS.md`
  `## Done` now says six agents including `ci-fix`, and that `run-loop.sh` was
  removed (D-19). PR #143 also deleted `conftest.py::assert_matches`, so "kept in
  step by hand (E-14)" is accurate again; E-14's 2026-11-13 amendment records that.
  Recorded in `tasks.md` and `PROGRESS.md` in this commit. Reviewer: please confirm.
- **Skipped as needing a person first:** T-085b (a Census source), T-056 (a
  design decision), T-095 (its Q), T-110 (a wording call).
- **Worker:** the survey held on every point. I added "and it stores a centroid" to the
  graded-pin sentence, because a nearest-centroid question without a centroid is also
  refused (`grading.py:126-131`). Leaving it out would overstate what is graded.
