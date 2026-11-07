# T-103 — Guard the bank facts the backend draw survey rests on — run log

**Task:** T-103 · **Branch:** `claude/fervent-ptolemy-4py2eg` · **PR:** #128
**Started:** 2026-11-07 · **Outcome:** halted — needs human (test change request)

## Round 1 — task-expander — 2026-11-07
`Next step` on entry: `(none — no brief)` → on exit: `worker`

**I've written the T-103 brief and opened draft PR #128. It needs a person to approve it before the worker can start.** Pushed to `claude/fervent-ptolemy-4py2eg` at `3ba1344`; the local head matches the remote. Status: `awaiting approval`. Next step: `worker`. Approved: `pending`.

- **Task:** T-103, "The backend draw survey's 'holds under any draw' arguments rest on unguarded bank facts" (`tasks.md` §E).
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-103-bank-facts-guard.md`
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/128 (draft, base `main`). Its body is the acceptance criteria. I opened it through `gh api` (REST), because GraphQL is refused here.
- **Commits:** `392bf90` (the brief) and `3ba1344` (records PR #128 in the header). The diff against `origin/main` is only `tasks/T-103-bank-facts-guard.md`. I did not change `tasks.md` or `PROGRESS.md`; `tasks/` was already empty, so the last cycle had been swept.
- **Branch header:** `claude/fervent-ptolemy-4py2eg`, as the spawn prompt said.

**Tasks skipped, and why:**
- **T-085b:** a person has to choose a Census source first (the `census.gov` hosts were refused through the proxy).
- **T-056:** depends on a design decision that has not been made.
- **T-095:** a person has to answer its question first.
- **No other open task PRs.** The only open PR is #38, a P-4 process ticket.

**What the brief asks for:**
- **One deterministic test per fact,** 14 in all. They are T-102's facts B1–B9, with B3 split into B3a–c and B8 into B8a–d. Each fact is checked against `backend/app/data/content.json` as committed.
- **Every fact has an edge on both sides,** for example 51 green / 52 red for the `location` questions that are not `map_click`, and 16 green / 15 red for the five newer topics.
- **A failing check names the tests that depend on it.** They are listed in a table in the brief, taken from T-102's 84-row survey at `d865519`.
- **The checks assert properties, not digests** (P-17's lesson).
- **Nothing existing changes.** No existing test is edited, `backend/app/` and the bank stay untouched, and no dependency is added.

**Things to know before approving:**
- **Someone should attend the tester step.** Adding a file under `backend/tests/` has turned question-bank whole-tree pins red on recent backend tasks (`CRITERION_21_ALLOWED`, `CRITERION_22_ALLOWED`, an applied-request sha). Only an approved Test change request can put them back.
- **Partial checks already exist.** B4, B6 and part of the location/capital composition are asserted today in `test_content_build.py`, `test_t040_tester_criteria.py` and `test_t026_topics.py`. None of them names the tests that depend on it, so the brief leaves them alone and still asks for the new checks.
- **Out of scope:** the demo profile's seed data and the selection rules (T-102's S1–S6), and making T-102's probe a CI step.

## Approval — 2026-11-07
Orchestrator wrote the unattended-run `Approved:` stamp. No human saw the criteria.

## Round 2 — worker — 2026-11-07
`Next step` on entry: `worker` → on exit: `tester`

**T-103 is built and handed to the tester.** There are 14 bank fact checks, each naming the tests that depend on it, plus edge tests on edited copies of the bank. The backend check passes. Four question-bank whole-tree pins are red, as the brief predicted; they are listed under "Tests made stale" for the tester's Test change request. Status is `awaiting verification`, Next step `tester`. The push landed: `origin/claude/fervent-ptolemy-4py2eg` is at `551315a`.

**Files added** (no other code or data changed):
- `/home/user/geo-discovery-zone/backend/tests/test_t103_bank_facts.py`
  - One pure function per fact, plus the dependents table with full test names, `failure_message` and `assert_fact`.
  - The checks run as `test_bank_fact[B1]` … `[B9]`, 14 cases.
  - `test_every_named_dependent_is_a_real_test` confirms each named dependent exists in its file.
- `/home/user/geo-discovery-zone/backend/tests/test_t103_bank_fact_edges.py`
  - Every red and green case in criteria 5–18, run on an edited copy of the bank. Each red case also asserts its failure message names every dependent.
  - Criterion 19's four edits, each confirmed to leave every fact green.
- `/home/user/geo-discovery-zone/tasks/T-103-bank-facts-guard.md`: Handoff, Notes, Sessions row, Status.

**Test results:**
- **Backend:** `make -C backend check` gives 1113 passed, 9 skipped, ruff clean. The 74 new tests are among them.
- **Question-bank:** 2709 pass, 4 fail, all of them the stale pins below.
- **Frontend:** 406 pass, 4 fail, 4 errors, all from this sandbox. `react-simple-maps` is not installed, and `bun install --frozen-lockfile` was refused by the proxy (403 on `d3-ease`). This task changes nothing under `frontend/`.

**Stale pins (all in `question-bank/src/`):**
- **`refresh-regenerate-reminder-verify.test.ts`**, T-087 criterion 15: the backend tree hash `MAIN_BOUNDARY_SHA` changed because of the two new test files. It needs re-pinning to the hash of the final branch.
- **`farm-animal-loose-ends-verify.test.ts`**, T-096 criterion 21: expected 282 files, got 284. The extra two are this task's brief and run log in `tasks/` and `runs/`.
- **`climate-cold-trade-accepted-verify.test.ts`**, T-091 criterion 22, non-test files: expected 285, got 287. Same cause as the previous one.
- **Same file, T-091 criterion 22, pre-existing test files:** expected 123, got 125, because of the two new backend test files.

Two of these, the T-096 and T-091 non-test counts, were already red from the expander's commit before I wrote any code. The Handoff gives a proposed fix for each, following how earlier tasks re-pinned them.

**Flags:**
- **Session id:** this session reports the same `CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_011oDiJbsZTbExMiPULZMiFd`) the expander recorded. The tester's check that it runs in a different session from the worker cannot rely on that id. Owner: the orchestrator, or a `process-tasks.md` entry.
- **Readings of the criteria:** where a criterion could be read more than one way, the choice I made is listed in the Handoff, for example that B3b fails on a key that is present even with a `null` value. The tester should confirm them, or send any wrong one back to `task-expander`.
- **Helper module folded in:** I first wrote a separate helper, `backend/tests/bank_facts.py`. I folded it into the `test_*.py` file because a non-test file under `backend/` would add another red to two of the pins above.
- **S1–S6:** not surveyed. Nothing unguarded turned up while I worked.

## Round 3 — tester — 2026-11-07
`Next step` on entry: `tester` → on exit: `human`

**T-103 has stopped for a person.** All of the task's own criteria (1-22) are met. Criterion 23 is still red: 4 question-bank whole-tree pins failed because T-103 added files, as the brief predicted. I raised a Test change request for them, and only a person can approve it.

- **Status:** `test changes requested`
- **Next step:** `human`
- **Test changes:** `requested`
- **Push:** landed on `claude/fervent-ptolemy-4py2eg` at `645b89c` (local HEAD matches the remote).

**What a person needs to do:** start a `tester` session they are attending for T-103 and approve or refuse rows 1-4 of the request. That tester applies the approved rows, re-runs all three suites, and sets `pass` / `reviewer` if they are green.

**Independence:** weaker than a separate session. This run is orchestrated (`runs/T-103-bank-facts-guard.md` exists), and `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJbsZTbExMiPULZMiFd`, the same id the expander and worker recorded. So the Sessions check proves nothing either way. My independence rests only on being a freshly spawned agent with its own context. The Verdict says this, and my Sessions row is added with the same note.

**Criteria**

| # | Result | Evidence |
|---|---|---|
| 1 | met | `test_c1_the_committed_bank_passes[B1..B9]`, 14 cases |
| 2 | met | `--collect-only` finds exactly one node per label, 14 distinct nodes |
| 3 | met | a real `pytest` run in a subprocess, on a bank with every fact broken, with and without `CI` set. Each failure names the file and function of every test in the brief's dependents table, which I copied by hand rather than importing the worker's list |
| 4 | met | the checks still run with random, `pick_question`, `candidate_questions` and httpx `send` all made to raise; same results under 4 seeds |
| 5-18 | met | every red and green bullet runs through the real `test_bank_fact(label)` on an edited temp bank; B8d is checked for all five topics |
| 19 | met | the four harmless edits leave all 14 checks green; no hashing; the integer constants are within the criteria's bounds |
| 20-22 | met | checked with `git diff` against the merge-base: `backend/tests/` only gains files (2 worker, 1 tester); `backend/app/`, `question-bank/data/`, `pyproject.toml` and `uv.lock` are unchanged. This is a command, not a committed test, because `test_git_revision_guard.py` refuses `git diff` in backend tests |
| 23 | not yet | details below |

**Suites (criterion 23)**

- **Backend:** `make -C backend check` gives 1209 passed, 9 skipped.
- **Question-bank:** 2709 pass, 4 fail. The 4 are the stale pins.
- **Frontend:** 406 pass, 4 fail, 4 errors. Every one is `Cannot find package 'react-simple-maps'`, because `bun install` gets a proxy 403 in this sandbox. T-103 changes nothing under `frontend/`, so CI has to confirm this suite.

**Mutation testing.** I made 21 mutations to the worker's `test_t103_bank_facts.py`, one at a time, and restored the file after each (`git status` was clean afterwards). 19 turned my tests red. The 2 that survived change nothing a criterion pins:
- **B2, count check `!= 4` → `< 3`:** the distinctness check still turns 3 and 5 choices red.
- **B3a, entity-"11" check removed:** criterion 7's edit is still caught through the `map_click` key branch.

**Test change request rows** (all are modify; nothing is deleted; each is red only because files were added):

1. **`refresh-regenerate-reminder-verify.test.ts`, T-087 c15:** `MAIN_BOUNDARY_SHA` → `7f53b203b5728a892bb1e7023d885f9e32c53b420d0498fcc8e9a0730fb43936`.
2. **`farm-animal-loose-ends-verify.test.ts`, T-096 c21:** add the T-103 brief and run log to `CRITERION_21_ALLOWED`.
3. **`climate-cold-trade-accepted-verify.test.ts`, T-091 c22 (non-test files):** add the same two paths to `CRITERION_22_ALLOWED`.
4. **Same file, T-091 c22 (pre-existing test files):** `MAIN_TESTS_COUNT` 123 → 126, and `MAIN_TESTS_SHA` → `c0ec8c11a8a29ccf1137f4951d46f8af069f0c0b7ed19242c5477d37e980122a`.

I checked all four on scratch copies of the three test files, outside the repo: 84 pass, 0 fail. The real test files are untouched.

**Files**
- `/home/user/geo-discovery-zone/backend/tests/test_t103_tester_criteria.py` (new, 96 tests)
- `/home/user/geo-discovery-zone/tasks/T-103-bank-facts-guard.md` (Verdict, Test change request, header, Sessions row)

## Halted — test change request — 2026-11-07
Raised at commit `645b89c`. Header: `Test changes: requested`, `Status: test changes requested`, `Next step: human`.
A person must start the `tester` step for T-103 in a session they are attending and approve or refuse each row there. The orchestrator cannot take the approval (D-15).
