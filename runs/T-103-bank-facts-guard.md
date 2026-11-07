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
