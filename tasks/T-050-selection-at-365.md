# T-050 — Check selection and levels at 365 served questions

**Status:** `approved — escalated`
**Next step:** `human` (merge decision on PR #92; see Review)
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
| worker | 2026-10-23 | cse_01454znq34eEJH6tPgL5JBMX (spawned by the orchestrator; `$CLAUDE_CODE_REMOTE_SESSION_ID` reads the same as the expander's, see Notes) |
| tester | 2026-10-23 | cse_01454znq34eEJH6tPgL5JBMX (spawned by the orchestrator as a fresh subagent; same id as worker, see Verdict) |
| reviewer | 2026-10-23 | cse_01454znq34eEJH6tPgL5JBMX (spawned by the orchestrator; same id, P-14) |

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

**TL;DR**
- **E-26 is appended to `engineering-decisions.md`** with tables A–D, section E and a Findings list; every number came from `content.json` at sha256 `8481068a…a4b3` (unchanged from `main` `fb1f615`).
- **No behaviour changed.** Nothing under `backend/app/`, the question bank, `frontend/` or `openapi.yaml` is touched. One new script and its inline-fixture tests.
- **Four follow-ons for the reviewer to queue** (listed below). The backend suite and question-bank suite pass; the frontend suite could not install its dependencies here (details under "How to run").

**Files changed**
- `engineering-decisions.md`: E-26 appended after E-25. A blank separator line, then `## E-26 — …`. The first `len(main)` bytes are byte-identical to `main` (checked with a `startswith` over `git show main:engineering-decisions.md`).
- `backend/scripts/measure_selection.py` (new): prints tables A–D, the HI/AK phrase counts, and section E's timing. Nothing in `app/` imports it. It reuses `selection.LEVEL_SPANS` and `selection.topic_matches`.
- `backend/tests/test_measure_selection.py` (new): checks the script's pure functions on inline fixtures. Nothing in it reads `content.json` or pins a bank count.
- This brief: Status, Sessions, Handoff, Notes.

**Where each criterion lives**

| Criteria | Where |
|---|---|
| 1–2 | `engineering-decisions.md` `## E-26` is the last `## E-` heading; the prefix up to it is `main`'s file |
| 3 | E-26 "What was measured" (commit + sha256) and "To reproduce" (`uv run python scripts/measure_selection.py` from `backend/`) |
| 4–8 | E-26 §A table: 37 rows × 8 topics, cells `pool within 1.5 / first span` |
| 9–12 | E-26 §B table, T-085 column, lowest/highest bullets |
| 13–15 | E-26 §C table, and the "When the review pool is empty" paragraph (`selection.py:60-63` → `65-72`) |
| 16–18 | E-26 §D table and the "47 / 42" paragraph |
| 19–20 | E-26 §E table and threshold paragraph |
| 21–22 | E-26 Findings and `**Revisit when**` (names T-085, T-088, T-051) |
| 23 | Below |
| 24–27 | No file under the guarded paths changed; no lockfile or `pyproject.toml` change |
| 28 | See "How to run" |

**Follow-ons for the reviewer to queue (criterion 23)**
- **Top-of-scale picks are uniform over the whole topic.** When no span up to 6 reaches a question (rows 14.5–18, and an 8th grader at 16 in four topics), choose from the questions nearest the session level instead of the whole topic.
- **A single-topic review turn re-asks the same question.** Decide whether a review turn draws the queued state's questions from every topic (`store.review_questions` does this and has no caller), and whether a review round should count down on a non-review pick (`grading.py:146-147`). This is a product call.
- **The climate distractor rule.** Offer at most one of Hawaii's and Alaska's phrases per question, and never three from one group. Then re-read table D and re-judge `concept_load["tpl-climate-of"]`.
- **Add HI and AK `tpl-climate-of` to T-085's rows.** These are the T-085 cause on a seventh and eighth question.

**What I deliberately did not do**
- **Changed nothing the measurement found** (the brief's Out of scope).
- **Did not edit `tasks.md`** (criterion 23).
- **Did not migrate with Alembic for the timing.** The script uses `orm.Base.metadata.create_all` on a temp SQLite file. The query is the same, and this avoids the script depending on test fixtures.

**Contradictions with the brief, and judgment calls**

| What | What I did | Who should confirm or overturn |
|---|---|---|
| **Verdict direction in criterion 16** | The brief says D copies E-22's T-025 format. In that table, `too hard` means *the seeded level is higher than the question deserves*. `tasks.md` asks whether climate questions are "too easy for their level", which is the opposite wording. I followed E-22, said so in E-26, and marked CA, HI and AK `too hard`. | Reviewer, or the person at the Review checklist |
| **Criterion 2's "line before"** | E-26 is preceded by one new blank separator line, as every other entry is. `main`'s bytes are an exact prefix. | Tester to read it that way, or bounce to the expander if it means something stricter |
| **Section E timing** | The numbers are noisy. Across three runs, `mixed` was 5.3–5.7 ms and `agriculture` 1.2–2.7 ms. E-26 records the first run and gives the spread. | Tester's own run should land in the same order of magnitude, not the same digits |

**How to run**
- `cd backend && uv run python scripts/measure_selection.py` (add `--no-timing` for A–D only)
- `make -C backend test` → all pass; the only skips are the Postgres-only tests (the new file included)
- `cd backend && uv run ruff check . && uv run ruff format --check .` → clean
- `cd question-bank && bun install --frozen-lockfile && bun test` → all pass, none fail
- **`cd frontend && bun test` could not run clean here.** `bun install --frozen-lockfile` fails because the lockfile's tarballs point at `europe-west1-npm.pkg.dev/lovable-core-prod/…`, and the proxy refuses that host (403 on `d3-color@2.0.0`). Without `node_modules`, the eslint-gate tests fail and two `.tsx` test files cannot find `react/jsx-runtime` or `react-simple-maps`. No frontend file is touched, so CI's run is the real check.
- **Side effect seen once:** after a frontend `bun test` run, `frontend/README.md` showed a one-character prettier-style escape (`2 * gradeOf` → `2 \* gradeOf`). I reverted it with `git checkout`, and it did not recur on the next run. It is probably a test that formats in place. It is not from this task.

**Tests made stale:** none.

## Verdict

**TL;DR**
- **Pass.** Every number in E-26 tables A, B, C, the lowest/highest levels, the HI/AK phrase counts and table D's prompts, choices and levels matches my own computation from `content.json` (sha256 `8481068a…a4b3`), written from the criteria without using the worker's script.
- **Whole suite green:** backend 627 passed / 9 skipped (Postgres-only), ruff clean; question-bank 2306 pass / 0 fail locally; frontend green on CI at this head (could not install locally, same proxy 403 the worker hit).
- **Independence is the weaker kind.** Orchestrated run: `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01454znq34eEJH6tPgL5JBMX`, the same as worker and expander, so the id check proves nothing. My independence rests only on being a freshly spawned subagent with its own context, which depends on the orchestrator having spawned me correctly, not on anything I can verify.

**No new tests committed, on purpose.** Criterion 26 forbids tests that pin counts derived from the bank, and every check here is a count over `content.json`. The independent check is a throwaway script in the tester scratchpad (not committed). For the worker's own script tests, I ran a mutation check instead (below).

| Criteria | Verdict | Evidence |
|---|---|---|
| 1 | pass | `grep '^## E-'` ends `E-24, E-25, E-26`; exactly one `## E-26` heading, last in file |
| 2 | pass | `main` (`fb1f615`) file is a byte-exact prefix of the new file; the only byte between it and `## E-26` is one `\n` blank separator line. I read "the line before `## E-26`" as that separator, which any appended Markdown heading needs. E-1..E-25 untouched |
| 3 | pass | Names commit `fb1f615` and the full sha256 (matches `sha256sum`). `uv run python scripts/measure_selection.py --no-timing` in a fresh `git worktree` of HEAD, `UV_OFFLINE=1`, produced output identical to the main checkout's |
| 4–8 | pass | 37 rows, 8 topic columns; all 296 cells (`pool within 1.5 / first span`) equal my computation, using `abs(level − row) <= span` inclusive |
| 9–12 | pass | Grades 0..9 = 0,4,59,166,120,16,0,0,0,0 (sum 365); T-085 column 3 in grade 3, 1 in grade 4 (my 4 rows: identify HI/AK, capital CO/HI). Lowest 3 = farm-animal CA, TX; highest 10 = the 16 template/state pairs listed, all match |
| 13–14 | pass | Table C min/max/zero per topic over 50 states all match (e.g. superlative 0/1/3, landmark 0/1/6, mixed 5/8/0) |
| 15 | pass | Checked against `selection.py`: lines 60-63 return a review pick only if `review_pool` is non-empty; otherwise control falls to the `LEVEL_SPANS` loop at 65-72, returning `is_review=False`. The sentence says exactly that. `grading.py:146-147` decrement also checked |
| 16–17 | pass | 10 rows (CA TX FL NY WA CO KY HI AK RI); each prompt, correct choice, the four-choice set and level match the served `tpl-climate-of` question exactly; verdicts are from the allowed three; the three non-`about right` rows (CA, HI, AK) give reasons |
| 18 | pass | HI/AK `climate_kid` phrases from `question-bank/data/us-states/`: 47 with at least one as distractor, 42 with both, my count identical |
| 19–20 | pass | Median of 200 calls, ms, environment named. My run of the script: mixed 5.773 ms, agriculture 2.276 ms, within the recorded spread. Largest topic 74 quoted, threshold not reached |
| 21 | pass | Every table A row with a first span of 6 or 99 (0–2, 11.5–18) is covered by a Findings bullet; CA, HI and AK non-`about right` verdicts appear; each bullet is marked accepted (with reason) or follow-on (with proposal) |
| 22 | pass | `**Revisit when**` names T-085, T-088, T-051 |
| 23 | pass | Handoff lists the four follow-ons, matching the four follow-on bullets in E-26; `tasks.md` diff on the branch is the expander's, not the worker's |
| 24 | pass | `git diff fb1f615 --stat -- backend/app question-bank frontend/src e2e openapi.yaml` is empty |
| 25 | pass | Only test-file change since `fb1f615` is the added `backend/tests/test_measure_selection.py` |
| 26 | pass | New tests use inline fixtures only; none reads `content.json` or pins a bank count, level or digest |
| 27 | pass | No `pyproject.toml`, `uv.lock`, `package.json` or lockfile change |
| 28 | pass | Local: `make -C backend test` 627 passed, 9 skipped; `ruff check` and `ruff format --check` clean; question-bank `bun test` 2306 pass, 0 fail. Frontend: `bun install --frozen-lockfile` fails here (proxy 403 on `d3-color@2.0.0`); CI check runs on this head's commit report `frontend (typecheck, lint, test)` success, as are backend, backend (postgres), question-bank and integration. e2e was still in progress when I looked |

**Mutations on the worker's script tests** (each reverted with a copy of the original; `git status` clean afterwards)
- **`pool_size`: `<= span` changed to `< span`.** 3 tests went red, including the inclusive-boundary test.
- **`table_b`: `math.floor(level / 2)` changed to `round(level / 2)`.** `test_table_b_buckets_by_floor_of_half_the_level_and_counts_flagged_rows` went red.

**For the reviewer, not blocking**
- **Criterion 16's verdict direction.** The worker followed E-22's T-025 convention, where `too hard` means the seeded level is higher than the question deserves. I confirmed that is how E-22's table uses it (HI/AK/CO rows). `tasks.md`'s "too easy for their level" wording reads the other way. E-26 states which convention it uses, so the table is unambiguous as written. The person merging should confirm the convention.
- **Criterion 2** read as described in the table above.

## Review

**TL;DR**
- **Approved, escalated.** E-26 is careful, reproducible and stays inside the brief; nothing under `backend/app/`, the banks, `frontend/src/`, `e2e/` or `openapi.yaml` changed. Marked ready, but **not to be merged until a person has read the brief's Review checklist** (copied into the PR body).
- **Why escalated:** E-26 *accepts* several findings that are product calls (no questions below level 3 for a kindergartner; the empty-review fallback; the review cap), and table D's verdicts are a judgement about how children meet the questions. The brief itself reserves both to a person.
- **Swept in this PR:** brief deleted, T-050 out of `tasks.md`, four follow-ons queued, `PROGRESS.md` updated.

**Lanes (D-7):** expander commits touch only `tasks/` and `tasks.md`; worker's touch `engineering-decisions.md`, the new script, its test and the brief; tester's only the brief; orchestrator's only `runs/` and the brief's `Approved:` line. Every Sessions row has a commit on this branch.

**Quality findings, none blocking**
- **Fits the codebase.** The script reuses `selection.LEVEL_SPANS` and `topic_matches` rather than re-deriving them, so it cannot drift from `pick_question`. Pure functions with inline-fixture tests, as `test-guidelines.md` asks. `backend/scripts/` is a new directory: nothing under `app/` imports it, ruff covers it, and pytest reaches it through `pythonpath = ["."]`.
- **Not more than needed.** `--calls` and `--no-timing` are the only options; both are used by E-26's own reproduce line.
- **One overstatement, not blocking.** E-26's Findings say a single-topic review turn "re-asks the very question missed". When the missed question is still in the last `RECENT_WINDOW`, `review_pool` excludes it and the turn falls back to an ordinary pick instead (E-26's own "When the review pool is empty" paragraph). Recorded in T-056's amendment; E-26 is not edited (the record stands).
- **Docs true.** No doc describes behaviour that changed, since none did.

**Worker's flags, disposed**
- **Verdict direction (criterion 16): decided, follow E-22.** E-22's T-025 table uses `too hard` for "seeded higher than it deserves" (HI/AK/CO/HI rows), and E-26 states the convention above its table, so the log reads one way throughout. The queue's "too easy for their level" wording is noted in `PROGRESS.md`. Still on the person's checklist, because the verdicts themselves are theirs to judge.
- **Criterion 2's blank line: decided, accepted.** `main`'s file is a byte-exact prefix; the one `\n` is the separator every entry has. Tester read it the same way.
- **Timing noise: accepted.** E-26 records the spread and says the order of magnitude is the finding.
- **`frontend/README.md` rewritten once by a frontend `bun test`: deferred to T-076**, which already owned this; amended with the second sighting and the likely suspect (`format-gate.criteria.test.ts` spawns `bun run format`).

**Follow-ons (criterion 23), where each went**
- **Top-of-scale uniform picks → new T-089.** Nothing owned selection above the bank.
- **Single-topic review re-asks → amended T-056.** T-056 already has to decide whether a topic session may reach into other topics, for mastery; review is the same question.
- **Climate distractor rule → new T-090.** E-25's farthest-first is not owned by any queued task. T-088 option (b) also gained a line: E-26 measured farthest-first's cost.
- **HI/AK climate rows → amended T-085.** It owns that cause.

**Envelope:** tester pass; backend 627 passed / 9 skipped and ruff clean (rerun here); CI green on the tester head for backend, postgres, question-bank, frontend and integration. No dependency, no `openapi.yaml`, migration or plan change, no pre-existing test touched (`Test changes: none`), no new child-facing text (table D quotes served prompts verbatim). Outside the envelope only on "a product decision settled along the way" (the accepted findings), hence the escalation.

## Notes

- **Session id.** `echo $CLAUDE_CODE_REMOTE_SESSION_ID` printed `cse_01454znq34eEJH6tPgL5JBMX`, the same value the expander recorded. The orchestrator spawns each role as a subagent of one remote session, so the variable cannot tell them apart. The tester should not rely on it alone to show independence; the orchestrator owns that question.
- **The brief's "Status: awaiting approval" line was stale.** `Approved:` already carried the attending person's words (recorded in `runs/T-050-selection-at-365.md`), so I started.
- **Surprise: the top of the scale.** Below the bank, a widened span lands on the easiest questions, which is fine. Above it, span 99 means *uniform over everything*. That is the one table A finding with a real cost.
- **Surprise: review in a single topic** is almost always the identical question. The pool is topic-filtered before `review_pool` sees it.
- **Surprise: `store.review_questions` has no caller** in `app/`.
- **Climate.** HI/AK phrases appear in 47 of 50 questions. Farthest-first also gives California three "cold snowy winters" distractors, and gives Hawaii and Alaska three same-family opposites each.
