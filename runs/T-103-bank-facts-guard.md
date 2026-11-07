# T-103 — Guard the bank facts the backend draw survey rests on — run log

**Task:** T-103 · **Branch:** `claude/fervent-ptolemy-4py2eg` · **PR:** #128
**Started:** 2026-11-07 · **Outcome:** in progress

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
