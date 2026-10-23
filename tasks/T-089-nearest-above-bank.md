# T-089 — Above the bank's top level, a pick is drawn from the whole topic

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** Dkaattae — 2026-10-23, in the orchestrator session ("approved"). Orchestrator stamp was refused as self-approval; see `runs/T-089-nearest-above-bank.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-089
**Branch:** `claude/peaceful-maxwell-mbf9gd`
**PR:** #94, opened draft at expand time, built from the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-23 | cse_014mjPR9EwgWt5EDdiUihfx9 |
| worker | 2026-10-23 | cse_014mjPR9EwgWt5EDdiUihfx9 (orchestrated subagent; the env var is the parent run's id, so it matches the expander's row) |

**Worker model:** Opus. It changes which question a child is served, and it
needs a Test change request drafted correctly.

**Not the light path.** The task is sized S, but it edits `openapi.yaml` (two
operation descriptions), and it has more than four criteria. `process.md`
"The light path" rules out both.

**Plan to attend the tester step.** Two existing pinned-digest tests turn red by
design (see Constraints, "Tests this will turn red"). Each needs an approved Test
change request row (D-14, D-15). Under the orchestrator, the tester will stop at
`test changes requested` and wait for a person.

## Goal

From session level 16.5 every topic, and from 14.5 some, finds no question
within span 6. The pick then falls to span 99, which is the whole topic, drawn
uniformly. So an 8th grader can get a level-3 farm animal as readily as a
level-10 capital. Make the fallback draw from the questions nearest the session
level. Record that answer to E-26's finding as a new decision entry.

## What is already true, and what the survey found

- **Where the behaviour lives.** `pick_question` in `backend/app/selection.py`
  tries `LEVEL_SPANS = (1.5, 3.0, 6.0, 99.0)` in order (`selection.py:18`,
  `:65-72`). The 99 step is the uniform draw this task replaces. The only caller
  is `serve_next` in `backend/app/routers/sessions.py:106-114`. It passes
  `store.candidate_questions(db, session.topic)` and the session's `level`,
  `topic` and `asked_question_ids`.
- **Below the bank, nothing changes.** Session levels start at `grade * 2`, and
  `grade` is 0–8 (`store.py:408`, `models.py:303`), so the lowest level is 0. The
  lowest served question is level 3, so span 6 always reaches something from
  below. E-26 accepts that. The new rule is still written symmetrically
  (criterion 5), so it holds for any bank, not just this one.
- **The client copy of `pickQuestion()` does not exist.** No
  `frontend/src/lib/session.ts` exists, and `git log --all` shows no such file
  in this repo's history. `frontend/src/` has no other selection code. So there
  is nothing to keep in step. Four places still name that path as if it were
  live: `backend/app/selection.py:3`, `backend/README.md:210`, and
  `openapi.yaml:190` (`listQuestions`) and `:906` (`serveNextQuestion`).
  `test-guidelines.md:135` says "the client's old `pickQuestion()`", with no
  path. That is accurate, and it stays as it is.
- **`backend/scripts/measure_selection.py` reads `LEVEL_SPANS`** to report
  "first non-empty span". `backend/tests/test_measure_selection.py:66` asserts
  that span is `99.0` for one inline fixture. E-26 table A's `99` cells come
  from that script. Criterion 14 keeps both files unchanged and passing. The
  new E-n says how those cells read now (criterion 13).
- **The existing selection tests** are in `backend/tests/test_selection.py`.
  None of them reaches the span-99 step, so none should change.

## Acceptance criteria

**Frozen once approved.** They change only by going back through
`task-expander` for a fresh approval.

Terms used below: **L** is the `level` passed to `pick_question`. A
**candidate** is a question that matches the session topic (`topic_matches`)
and whose id is not in `asked_ids`. The **distance** of a question is
`|question.level − L|`. Every criterion is about an ordinary pick, meaning not
a review turn, unless it says otherwise. "Every draw" means every result over
many draws with an injected `rng`, as `test-guidelines.md` "Randomness and
time" describes.

**Unchanged inside span 6**

1. When at least one candidate has distance ≤ 6.0 (inclusive), every draw comes
   from the candidates within the smallest of 1.5, 3.0 and 6.0 that holds any
   candidate. That is the same pool as on the default branch today.
2. Every test in `backend/tests/test_selection.py` that exists on the default
   branch passes, unmodified.

**The new fallback**

3. When no candidate has distance ≤ 6.0, every draw is a candidate whose
   distance equals the smallest distance of any candidate. On an inline fixture
   with candidates at levels 3, 8, 10 and 10 and L = 16.5, every draw is one of
   the two level-10 questions, and the level-3 and level-8 questions are never
   drawn.
4. In the case of criterion 3, every candidate at that smallest distance can be
   drawn. On the same fixture, over many draws, both level-10 questions appear.
5. The rule is symmetric. On an inline fixture with candidates at levels 7, 7.5
   and 12 and L = 0, every draw is the level-7 question.
6. **The span-6 edge, both sides.** With candidates at levels 4 and 10:
   - at L = 16 (distance 6.0 to level 10), every draw is the level-10 question;
   - at L = 16.5 (distances 6.5 and 12.5), every draw is the level-10 question;
   - with candidates at levels 9.5 and 10 and L = 16.5 (distances 7.0 and 6.5),
     every draw is the level-10 question and the 9.5 is never drawn.
7. An asked question is not a candidate in the fallback. With questions at
   levels 10, 9.5 and 3, L = 16.5, and the level-10 question in `asked_ids`,
   every draw is the level-9.5 question.
8. The topic filter holds in the fallback. With `topic="capital"`, a `location`
   question at level 10 and `capital` questions at levels 9 and 3, and
   L = 16.5, every draw is the level-9 `capital` question. With `topic="mixed"`
   and questions in two topics both at the smallest distance, both topics are
   drawn over many draws.
9. The fallback reports `is_review` as `False`.

**Unchanged outside the fallback**

10. When every topic-matching question has been asked, the pick behaves as on
    the default branch. It repeats, never one of the last `RECENT_WINDOW` (6)
    asked, and returns `None` only for an empty bank.
11. A review turn with a non-empty review pool returns a question about a
    queued entity with `is_review` `True`, whatever L is. That includes
    L = 16.5 with every queued entity's questions at level 3.

**Stale references and the record**

12. No tracked file contains the string `lib/session.ts`, except files in
    `tasks.md`, `tasks/`, `runs/`, `PROGRESS.md` and `engineering-decisions.md`.
    Entry E-28 there may name the path, as criterion 13 (c) asks. So
    `backend/app/selection.py`, `backend/README.md` and `openapi.yaml` no longer
    contain it. No file at `frontend/src/lib/session.ts` is created.
13. `engineering-decisions.md` gains exactly one new entry, `## E-28 — …`, the
    next unused number. It appears once, and the numbering stays gap-free from
    E-1. It names T-089, and it states each of these:
    - (a) the fallback rule: when no candidate is within 6, the pool is the
      candidates at the smallest distance, ties included;
    - (b) that this answers E-26's "Table A, rows 14.5 to 18 where the first
      span is 99" finding;
    - (c) that the client `pickQuestion()` / `frontend/src/lib/session.ts`
      named by `selection.py` is not in this repository, so there is no second
      copy to keep in step;
    - (d) that a `99` cell in E-26 table A, and in
      `measure_selection.py`'s output, now means "nearest candidates", not
      "whole topic".

    The text of E-1 to E-27 is byte-identical to the default branch.
14. `backend/scripts/measure_selection.py` and
    `backend/tests/test_measure_selection.py` are byte-identical to the default
    branch, and `test_measure_selection.py` passes.
15. `openapi.yaml`'s `serveNextQuestion` description says that when no fresh
    question is within the widest difficulty window, the selector draws from
    the fresh questions nearest the session level. It contains the word
    `nearest`. No path, operation, parameter or schema in `openapi.yaml` changes.
    Only the description text of `serveNextQuestion` and `listQuestions` may
    change.

**What must not happen**

16. No new dependency. No `package.json`, `bun.lock`, `pyproject.toml` or
    `uv.lock` changes.
17. No content change. `backend/app/data/content.json`, everything under
    `question-bank/data/`, and every question's `level` are byte-identical to
    the default branch.
18. Nothing under `frontend/` changes, and no Alembic migration is added.
19. No test reaches the network, and every new test runs on an inline fixture.
    None reads `content.json` for a count or a level.
20. The full suites pass: `make -C backend test`, `cd frontend && bun test`, and
    `cd question-bank && bun test`. The only exception is a test deleted or
    modified under an approved Test change request row.

## Out of scope

- **Below the bank.** Rows 0–2 of E-26 table A stay as they are (E-26 accepted).
- **The spans themselves.** 1.5, 3 and 6, and the order they are tried in, do
  not change. Neither does `RECENT_WINDOW` or `REVIEW_EVERY`.
- **Levels.** No seeded level, weight or `concept_load` changes (T-085 owns the
  levels of the drawn-apart states).
- **Review behaviour.** That includes a single-topic review pool, `store.review_questions`,
  and whether a review round counts down on a non-review pick (T-056).
- **Level drift and the profile's starting level** (`grading.py`, `store.py:408`).
- **Moving selection into SQL** (E-26 section E keeps it deferred).
- **E-26's text.** It is a measurement record, so it is answered in E-28 and
  not edited. Re-running `measure_selection.py` is not required either.
- **`test-guidelines.md`.** Its "client's old `pickQuestion()`" is accurate.
- Anything else noticed goes into `tasks.md` as a new entry, not into this
  branch.

## Constraints

- **Files expected to change:** `backend/app/selection.py`,
  `backend/tests/test_selection.py` (new tests only; existing ones stay
  byte-identical, criterion 2), `backend/README.md` (line 210),
  `openapi.yaml` (two descriptions), `engineering-decisions.md` (E-28 only).
  The tester's own criteria file is extra.
- **`pick_question`'s signature and return shape stay as they are.** The router
  calls it by keyword (`sessions.py:106-114`).
- **`selection.py` stays pure.** That means no store, no request, and
  randomness only through the injected `rng` (its own docstring, and
  `test-guidelines.md` "Randomness and time").
- **Dependencies:** none (`CLAUDE.md` "Packages").
- **Tests this will turn red, known at expand time.** The worker lists the full
  set under **Tests made stale**. The tester raises the Test change request. No
  one edits these without an approved row.
  - `question-bank/src/climate-far-phrases-verify.test.ts`, describe
    "T-090 criterion 14: the re-read is a new E-n entry". It reads the
    highest `E-n` and expects it to be 27 (`:604-608`), and then reads that
    entry's table D rows. E-28 makes the newest entry T-089's.
  - Same file, describe "T-090 criterion 20: no other surface changes". It holds
    the sha256 tree digests for `backend/app` (except `content.json`) and for
    `openapi.yaml` (`:784-810`). Both move.
  - The "E-26's text" and `measure_selection.py` digests in the same describe
    must **not** move (criteria 13, 14).
- **`T-070` context.** These pins are the kind `T-070` (Q1) exists to settle.
  This task does not settle it. Each red pin gets one approved row, the same as
  every task since T-068.

## Context

**Required reading for the worker and the tester.**

- **`engineering-decisions.md` E-26.** Read all of it, especially table A, the
  "Per-topic level ranges" line, and the Findings bullet "Table A, rows 14.5 to
  18 where the first span is 99: follow-on". That bullet is this task's
  proposal.
- **`engineering-decisions.md` E-10.** The level window is computed once, on the
  server.
- **`engineering-decisions.md` E-14.** `openapi.yaml` follows the backend, which
  is why criterion 15 edits it.
- **`backend/app/selection.py`.** All of it, 80 lines.
- **`backend/app/routers/sessions.py:90-125`.** This is the only caller.
- **`backend/tests/test_selection.py`.** The existing fixture style (`BANK`,
  `draws`) for the new tests to follow.
- **`backend/scripts/measure_selection.py`** and
  **`backend/tests/test_measure_selection.py:61-67`.** These are why
  criterion 14 exists.
- **`openapi.yaml:184-191`** (`listQuestions`) and **`:900-910`**
  (`serveNextQuestion`).
- **`test-guidelines.md`** "Randomness and time". It covers asserting over every
  draw, never one roll.
- **`geoquizdataplan.md` §1.4.** Covers levels, and what a session level means.
- **`question-bank/src/climate-far-phrases-verify.test.ts:599-640, 784-810`.**
  These are the pins named under Constraints.
- **`tasks/TEMPLATE.md` "Test change request".** The format for the rows.

## Handoff

**TL;DR.** Built. Past span 6, `pick_question` now draws from the fresh candidates
at the smallest distance, ties included. E-28 records it, and the stale
`lib/session.ts` references are gone. Backend: 639 passed, 9 skipped, ruff clean.
question-bank: 7 red, all of them the stale T-090 pins the brief predicted
(listed below). The tester needs Test change request rows for those 7.

**Files changed**

- **`backend/app/selection.py`.** `pick_question` builds `fresh` (topic match and
  not asked) once. It tries `LEVEL_SPANS[:-1]` (1.5, 3, 6) as before. If those
  are all empty and `fresh` is not, the pool is the `fresh` questions whose
  `abs(level - L)` equals the minimum. `LEVEL_SPANS` keeps its `99.0`, with a
  comment, so `measure_selection.py` is untouched (criterion 14). The module
  docstring no longer names `frontend/src/lib/session.ts`. Signature, return
  shape and purity are unchanged.
- **`backend/tests/test_selection.py`.** 10 new tests (12 cases), appended after
  the existing ones. The existing tests are byte-identical. The new tests use
  inline fixtures through a `q()` helper and `fixture_draws()` (200 draws with
  `random.Random(89)`). `fixture_draws` also asserts that every draw has
  `is_review is False`. Against the old `selection.py`, 8 of the new cases fail
  and the existing 19 pass.
- **`backend/README.md:210`.** The `selection.py` line now reads
  "pick_question: review turns, widening level window, nearest fallback (E-28)".
- **`openapi.yaml`.** Description text only. `serveNextQuestion` describes the
  windows and the nearest fallback, and contains "nearest". `listQuestions` now
  says `level` + `levelSpan` mirror "the server's widening search in
  `serveNextQuestion`" instead of naming the client file.
- **`engineering-decisions.md`.** Appended `## E-28`. E-1 to E-27 are untouched,
  and the numbering runs 1 to 28 with no gap.
- **This brief.** Status, Sessions row, Handoff and Notes.

**Where each criterion lives**

| # | Where |
|---|---|
| 1 | `selection.py`, the `for span in LEVEL_SPANS[:-1]` loop. Same filter and same `<=` as before |
| 2 | The existing 19 tests are unmodified and pass (`git diff` shows only additions to the file) |
| 3, 4 | The nearest block in `selection.py`. Tests: `test_above_the_bank_draws_only_the_nearest_questions`, `test_above_the_bank_every_nearest_tie_can_be_drawn` |
| 5 | `test_below_the_bank_draws_only_the_nearest_question` |
| 6 | `test_the_span_six_edge_from_both_sides`, 3 cases |
| 7 | `fresh` excludes `asked`. `test_the_fallback_skips_asked_questions` |
| 8 | `fresh` applies `topic_matches`. `test_the_fallback_keeps_the_topic_filter`, `test_the_fallback_in_mixed_draws_every_topic_at_the_nearest_distance` |
| 9 | Returns `False`. `test_the_fallback_is_not_a_review`, and the assert inside `fixture_draws` |
| 10 | The recycle block is unchanged. Existing tests, plus `test_once_everything_is_asked_the_pick_still_recycles_above_the_bank` |
| 11 | The review branch runs before the windows, unchanged. `test_review_wins_over_the_fallback_whatever_the_level` |
| 12 | `git grep -n lib/session.ts` now hits only `engineering-decisions.md` (E-28), `runs/T-089-…`, `tasks.md` and this brief |
| 13 | E-28 bullets: (a) "The fallback rule", (b) "This answers E-26's …", (c) "There is no client copy", (d) "How a `99` reads now" |
| 14 | Both files untouched. `test_measure_selection.py` passes |
| 15 | `openapi.yaml` `serveNextQuestion` description |
| 16–18 | Untouched. No lockfile, content, `frontend/` or migration changes |
| 19 | New tests are pure, with inline fixtures and no I/O |
| 20 | See "How to run" and "Tests made stale" |

**Tests made stale.** All are in
`question-bank/src/climate-far-phrases-verify.test.ts`. The 7 are listed below,
and they are the only reds in question-bank. The E-26 and `measure_selection.py`
digests in the same describe still pass.

- describe "T-090 criterion 14: the re-read is a new E-n entry". All 5 tests go
  red because the describe takes `newest = Math.max(...)` (now 28) and reads that
  entry:
  - "the entry is E-27, the next unused number after E-26, and appears once"
  - "(a) the ten states' rows match the regenerated bank, with a verdict and a reason"
  - "(b) the counts: how many offer at least one of HI's and AK's phrases, and 0 offer both"
  - "(c) a judgement on concept_load[tpl-climate-of]"
  - "(d) CA unchanged and why, and whether it is still too hard; CA's question is as at 3279555"
  - **Why stale:** criterion 13 adds E-28.
  - **Proposal: modify.** Pin the entry to E-27 rather than the newest, i.e.
    `const entry = sectionOf(decisions, "E-27")`. In the first test, replace
    `expect(newest).toBe(27)` with `expect(numbers).toContain(27)` and keep the
    "appears once" and `/T-090/` checks. The other four then pass unchanged.
- describe "T-090 criterion 20: no other surface changes", the `test.each`
  "%s (except %p) is byte-identical to 3279555":
  - **`openapi.yaml (except [])`.** Stale because of criterion 15. **Proposal:
    modify** the digest to
    `88e056ea172797f078c5649a68245b4f0c18627e599a0bda1110f8183c3d5e5d`.
  - **`backend/app (except [ "backend/app/data/content.json" ])`.** Stale
    because `selection.py` changed (criteria 3–5, 12). **Proposal: modify** the
    digest to
    `e7a4e080df1149514332efe2d3b8bad75ee6f270d69d186f7b205ea285dff808`.
  - I computed both digests with the test's own `treeDigest` algorithm, re-done
    in Python on this branch's tree. It reproduces the pinned `frontend` digest
    `7d65dc75…`, which is unchanged. Recompute them if anything else under
    `backend/app` or `openapi.yaml` moves before the change lands.
- **No count floors** pin this file's test count, as far as I found.

**How to run**

- `make -C backend test`: 639 passed, 9 skipped.
- `make -C backend lint` and `uv run ruff format --check` in `backend/`: clean.
- `cd question-bank && bun install --frozen-lockfile && bun test`: 2360 pass, 7
  fail (the stale list above). `bun run lint`: 0 warnings, 0 errors.
- `cd backend && uv run pytest tests/test_selection.py -q`: 31 passed.

**Environment caveats, not caused by this change**

- **Without `bun install`, question-bank's T-066 lint tests fail** (12 on the
  clean tree). After `bun install --frozen-lockfile` they pass.
- **`frontend` would not install.** `bun install --frozen-lockfile` was refused
  by the proxy (403 on `@types/react-simple-maps@3.0.6`). So frontend `bun test`
  shows 386 pass, 8 fail (eslint and prettier gate tests). The clean default
  tree gives the identical 386/8. Nothing under `frontend/` changed.
- **Side effect:** running frontend `bun test` without `node_modules` rewrote
  `frontend/README.md` (a `*` escaped to `\*`). It happens on the clean tree
  too, apparently from the T-075 format-gate test that spawns `bun run format`.
  I reverted the file, and it is not in the commit. **Owner: reviewer**, to
  decide whether that test needs a guard and to queue it in `tasks.md` (section
  F or G).

**Deliberately not done**

- No change to the spans, `RECENT_WINDOW`, `REVIEW_EVERY`, levels or review
  behaviour (Out of scope).
- E-26 was not edited, and `measure_selection.py` was not re-run.
- No existing test was touched.

**Contradictions with the brief:** none found.

## Verdict

## Notes

- **Expander, on "nearest".** The queue entry says "choose from the questions
  nearest the session level". This brief reads that literally: the pool is the
  candidates at the single smallest distance, with ties included. A wider band,
  such as "smallest distance plus 1.5", was not chosen. It would be a second
  span ladder, and E-26 did not propose one. A child at 16.5 in `mixed` gets
  the 16 level-10 questions first, then the level-9.5 ones, and so on down.
- **Expander, on the client copy.** The entry asked whether
  `frontend/src/lib/session.ts` is still live. It is not in the repo at all,
  and never was in its git history. Criterion 12 removes the four references
  that say otherwise, and criterion 13 (c) records it.
- **Worker, on keeping `99.0` in `LEVEL_SPANS`.** Dropping it would have been
  cleaner in `selection.py`, but `measure_selection.py` iterates it and its
  test asserts `99.0` (criterion 14). So the last entry stays, as a marker
  meaning "nearest", and `pick_question` slices it off. **Owner: reviewer**, to
  confirm, or to queue a follow-on that renames it once `measure_selection.py`
  may change.
- **Worker, on exact float equality for ties.** Distances are compared with
  `==` against the minimum. Levels are multiples of 0.5, so they are exact in
  binary floating point, and two questions at the same level always tie.
  **Owner: reviewer**, if a non-half-step level ever lands (T-085).
- **Worker, on the `listQuestions` wording.** It now points at
  `serveNextQuestion` rather than at a client file. I did not verify that
  `GET /questions` actually implements `levelSpan` widening. That is outside
  criterion 15, which only allows a description edit. **Owner: reviewer**.
