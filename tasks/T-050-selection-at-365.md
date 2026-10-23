# T-050 — Check selection and levels at 365 served questions

**Status:** `awaiting approval`
**Next step:** `worker`, once a person replaces `pending` below
**Approved:** the person attending the orchestrator session — 2026-10-23: "approved, go ahead with the worker". See `runs/T-050-selection-at-365.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-050
**Branch:** `claude/laughing-cerf-og9u2g`
**PR:** #92, opened draft at expand time against the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-23 | cse_01454znq34eEJH6tPgL5JBMX (spawned by the orchestrator) |

**Worker model:** Opus. The criteria are measurements, but item D is a hand-check
of question difficulty, which is a judgement.

## Goal

The served bank went from 26 hand-written questions to 365 generated ones
(T-040, T-026). Nobody has measured how selection, the review queue and the
seeded levels behave at that size. This task takes those measurements and
writes them down as one new decision entry. Every finding is then either
accepted with a reason or proposed as a follow-on. **It changes no behaviour.**

The queue entry's "Done when" allows exactly this: "dropped with the
measurement that shows it already does". So this brief asks for the
measurement and a recorded call on each finding. It does not ask for a fix.
A fix would be a separate task with its own criteria.

## What is already true (survey)

- **Bank shape** (`backend/app/data/content.json`, read for shape only): 365
  questions; formats `multiple_choice` 315 and `map_identify` 50; topics
  location 50, capital 50, wildlife 50, climate 50, superlative 47, landmark 44,
  agriculture 74. `map_click` is not served (E-24).
- **Selection** is `backend/app/selection.py` `pick_question`. It tries
  `LEVEL_SPANS = (1.5, 3.0, 6.0, 99.0)` in order over unasked questions. Then
  it recycles, avoiding the last `RECENT_WINDOW = 6`. A review pick comes on
  every 7th question (`REVIEW_EVERY`) or during a review round.
- **The pool is topic-filtered in SQL, then level-filtered in Python.**
  `backend/app/routers/sessions.py:106-113` passes
  `store.candidate_questions(db, session.topic)` (`store.py:249`). So in a
  single-topic session the review pool only holds that topic's questions about
  the queued entity.
- **`candidate_questions`' docstring** says filtering should move into SQL "at
  bank sizes past a few thousand questions per topic". The largest topic is
  agriculture, at 74.
- **Review queue:** capped at `REVIEW_QUEUE_MAX = 20` entities
  (`backend/app/orm.py:32`), oldest first, no duplicates.
- **Session levels** are any 0.5 step in 0–18. `create_profile` starts a
  profile at `grade * 2` (`store.py:408`), and `levels.level_window` offers a
  window of half-steps around the current level (`levels.py`).
- **Seeded levels:** E-22 records 3.5–10 for the three original templates and
  3–10 for T-026's six. The served range has not been measured as one set.
- **T-085's rows.** The rows T-025 marked `too hard` that T-085 owns are HI and
  AK on `tpl-identify-on-map` and `tpl-click-the-map`, and Colorado and Hawaii
  on `tpl-capital-of`. `tpl-click-the-map` is not served. So **four** of the six
  are in the served bank.
- **Highest entry:** `engineering-decisions.md` currently ends at E-25. The next
  unused number is **E-26**.

Nothing in this brief is already satisfied. No measurement is recorded
anywhere.

## Acceptance criteria

Every criterion below refers to a new entry, **`## E-26`**, in
`engineering-decisions.md`. "The measurement" means the measurement taken over
`backend/app/data/content.json` as committed at the branch head. A count is
exact unless the criterion says otherwise.

### The entry itself

1. `engineering-decisions.md` has exactly one new heading. It starts
   `## E-26 — ` and comes after E-25, as the last `## E-` heading in the file.
2. The bytes of `engineering-decisions.md` from its start to the line before
   `## E-26` are identical to the default branch (`main` at `fb1f615`). E-1 to
   E-25 are untouched.
3. E-26 names the commit, or the `content.json` sha256, that its measurements
   were taken over. It also names the command or script that reproduces tables
   A, B and C, runnable from `backend/` with `uv run` on a clean checkout and
   no network.

### A. Where a session can draw from, at each level

4. E-26 has a table, **table A**, with one row for every session level from
   0 to 18 in steps of 0.5. That is 37 rows, `0` and `18` included.
5. Table A has one column for each of the eight topic choices: `mixed`,
   `location`, `capital`, `superlative`, `wildlife`, `landmark`, `climate`,
   `agriculture`.
6. Each table A cell gives the number of served questions in that topic, or
   all of them for `mixed`, whose `level` `L` satisfies `|L − row level| ≤ 1.5`.
   That is the first span `pick_question` tries. The boundary is inclusive, as
   in `selection.py`: a question exactly 1.5 away counts.
7. Each table A cell also gives the first `LEVEL_SPANS` value (1.5, 3, 6 or 99)
   whose pool is non-empty for a session with nothing asked yet.
8. Every number in table A equals what the tester gets by computing it
   independently from the same `content.json`.

### B. How the levels are spread

9. E-26 has a table, **table B**, with one row for each grade
   `floor(level / 2)` from 0 to 9. Each row gives the number of served
   questions in that grade. The rows sum to the served total (365 at the time
   of writing).
10. Each table B row also gives how many of that grade's questions are among
    the four served T-085 rows: HI and AK on `tpl-identify-on-map`, and CO and
    HI on `tpl-capital-of`.
11. E-26 states the lowest and the highest `level` in the served bank. For
    each, it names the template(s) and state(s) at that level.
12. Every number in table B and criterion 11 equals the tester's independent
    computation.

### C. The review queue at this size

13. E-26 has a table, **table C**, with one row per topic choice (the same
    eight as criterion 5). Each row gives the minimum and the maximum number of
    served questions about one entity in that topic, over all 50 states. That
    is the size of a review pool for one queued entity before
    `RECENT_WINDOW` is applied. It also gives how many states have zero
    questions in that topic.
14. Every number in table C equals the tester's independent computation.
15. E-26 says, in one sentence, what `pick_question` does on a review turn in a
    single-topic session when every same-topic question about every queued
    entity is among the last `RECENT_WINDOW` asked. It cites the lines of
    `selection.py` that cause it. The tester checks the sentence against the
    code.

### D. Climate questions, read by hand

16. E-26 has a hand-check table of the served `tpl-climate-of` question for
    each of the ten states T-025 read: CA, TX, FL, NY, WA, CO, KY, HI, AK, RI.
    Each row has: state, prompt, correct choice, the three distractors, `level`,
    and a verdict of exactly `too easy`, `about right` or `too hard`. Every row
    whose verdict is not `about right` gives a reason.
17. Prompt, choices and `level` in that table match the served question
    byte for byte (choices may be in any order, but must be the same four
    strings).
18. E-26 gives the number of served `tpl-climate-of` questions with at least
    one distractor that is Hawaii's or Alaska's `climate_kid` phrase. It also
    gives the number with both. Both numbers equal the tester's computation.

### E. `candidate_questions` at this size

19. E-26 records the wall time of `store.candidate_questions` for `mixed` and
    for `agriculture`, on SQLite, with the served bank loaded. Each figure is
    the median of at least 100 calls, with units, the number of calls, and the
    machine or environment it ran on.
20. E-26 says whether the docstring's threshold ("past a few thousand questions
    per topic") is reached. It quotes the largest per-topic count from the
    measurement.

### Findings

21. E-26 ends with a **Findings** list. Every finding from tables A–D and
    section E is one bullet, marked either **accepted** with a reason, or
    **follow-on** with a one-line proposal. A row of table A with a cell whose
    first non-empty span is 6 or 99 is a finding and must appear in the list.
    So is any table D verdict other than `about right`.
22. E-26 has a `**Revisit when**` line. It names T-085, T-088 and T-051 as
    changes that would move these numbers.
23. The worker's Handoff lists each **follow-on** bullet. The reviewer turns
    those into `tasks.md` entries; the worker does not edit `tasks.md`.

### What must not change

24. No file under `backend/app/`, `question-bank/src/` (tests excepted),
    `question-bank/data/`, `frontend/src/` or `e2e/`, and not `openapi.yaml`,
    differs from the default branch. Levels, weights, spans, the review cap and
    the served bank are all unchanged.
25. No test that existed before this task is modified or deleted.
26. No new test pins a count, a level or a digest derived from the bank. A
    later regeneration of `content.json` (T-088, T-051) must not turn any new
    test red. If the worker adds tests for a measurement script, they run on a
    small inline fixture, not on `content.json`.
27. No new dependency: no `pyproject.toml`, `uv.lock`, `package.json` or
    lockfile changes.
28. The whole suite passes in all three packages, as CI runs them
    (`make -C backend test`, `cd frontend && bun test`,
    `cd question-bank && bun test`), and nothing in it reaches the network.

## Out of scope

- **Changing anything the measurement finds.** That includes levels,
  `LEVEL_SEED_WEIGHTS`, `concept_load` values, `LEVEL_SPANS`, `RECENT_WINDOW`,
  `REVIEW_EVERY`, `REVIEW_QUEUE_MAX` and the 0.7 mastery threshold. Each is a
  follow-on.
- **Moving filtering into SQL** in `candidate_questions`.
- T-085's familiarity inputs, T-088's agriculture distractors, T-056's
  first-day map, T-051's `map_click`.
- Climate distractor ordering (E-25's farthest-first). Measure it here; change
  it elsewhere.
- Editing `tasks.md` or `PROGRESS.md` (the reviewer's, at sweep).
- `ageBand`. `pick_question` does not read it, and this task does not
  change that.

## Constraints

- **Files expected to change:** `engineering-decisions.md` (append E-26 only).
  Optionally, one new measurement script that `backend/app/` does not import,
  e.g. under `backend/scripts/`, plus tests for it on inline fixtures. The
  brief's Handoff.
- **Invariants:** the served bank, every level and every selection constant are
  byte-identical to `main` (criterion 24).
- **Decisions-log guards:** `hand-check-levels-verify.test.ts` criterion 16
  wants a gap-free `E-1..E-max`. `seed-level-loose-ends-verify.test.ts`
  criterion 12 pins E-1..E-23. `region-vocabulary.test.ts` wants unique
  ascending `E-n`. Appending E-26 at the end satisfies all three. Editing any
  earlier entry does not (criterion 2).
- **No counts of tests** in any doc (the T-062/T-065 guard). Question counts
  are fine.
- **Dependencies:** none (`CLAUDE.md`, "Packages").
- **No network** in tests or in the measurement (`CLAUDE.md`, "Tests").

## Context

Required reading for the worker and the tester:

- `tasks.md` T-050: the four bullets this brief turns into sections A–E.
- `engineering-decisions.md` **E-22**: the formula, the level range, and the
  T-025 hand-check table whose format section D copies. Also **E-24** (what is
  served and why `map_click` is not) and **E-25** (climate farthest-first, the
  agriculture rules).
- `backend/app/selection.py`: `LEVEL_SPANS`, `RECENT_WINDOW`, `REVIEW_EVERY`,
  `review_pool`, `pick_question`.
- `backend/app/store.py:249` `candidate_questions` and its docstring;
  `store.py:408` the starting level.
- `backend/app/routers/sessions.py:80-130` `_serve_next`: how the topic pool and
  the review queue reach `pick_question`.
- `backend/app/orm.py:32,137-145`: the review queue cap and order.
- `backend/app/levels.py`: `grade_of`, `band_of`, `level_window`.
- `backend/app/data/content.json`: the served bank being measured.
- `question-bank/data/us-states/*.json` `climate_kid`: Hawaii's and Alaska's
  phrases, for criterion 18.
- `geoquizdataplan.md` §1.4 (difficulty and levels) and §3.3 (Setup's level
  window).
- `test-guidelines.md`: backend section, and "No network in tests".

## Review checklist — for the person merging

Sections A–C and E can be checked by computation, and the criteria above cover
that. What only a person can judge:

- [ ] Each **accepted** finding's reason holds. In particular: is it fine that a
      session level outside the bank's range (e.g. a kindergartner at 0, a
      7th grader at 14) draws everything from a wide span?
- [ ] Table D's verdicts read the way a seven-to-ten-year-old would meet the
      questions.
- [ ] Each **follow-on** is worth a queue entry.

## Handoff

## Verdict

## Notes
