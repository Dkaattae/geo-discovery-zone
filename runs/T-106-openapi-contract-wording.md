# T-106 — `README.md` and `PROGRESS.md` still call `openapi.yaml` "the contract" — run log

**Task:** T-106 · **Branch:** `claude/youthful-galileo-hn6hh1` · **PR:** #133
**Started:** 2026-11-12 · **Outcome:** in progress

Run: orchestrated, task 1 of 3. Started from the `next-task` skill.

## Round 1 — task-expander — 2026-11-12T15:28Z
`Next step` on entry: `none (no brief)` → on exit: `worker`

**TL;DR:** I expanded T-106 ("`README.md` and `PROGRESS.md` still call `openapi.yaml` 'the contract'"). The brief is pushed to `claude/youthful-galileo-hn6hh1` and draft PR #133 is open. Status is `awaiting approval`, Next step is `worker`, Approved is `pending`, so a human has to approve before the worker starts.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-106-openapi-contract-wording.md
- **Branch:** `claude/youthful-galileo-hn6hh1`. It is written into the brief's `Branch:` header, and the push landed: local and origin are level at `9eac5da`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/133 (draft). Its body holds the acceptance criteria.
- **Commits:** `eb19df9` (the brief) and `9eac5da` (records PR #133 in the brief). The diff against `origin/main` touches only `tasks/T-106-openapi-contract-wording.md`.
- **Sessions row:** task-expander, 2026-11-12, cse_011oDiJdbpiNRtapJtyKBeQB

**Why T-106 and not an earlier task:**
- **T-085b:** it needs a person to pick a Census source, and none has been recorded.
- **T-056:** it depends on a design decision that nobody has made.
- **T-095:** its "Needs a person's call" question is still unanswered.
- **Open PRs:** the only other one is #38 (a `P-4` ticket), so nothing collides.

**What the brief asks for (8 criteria, full brief because there are more than four):**
- **Four lines change:**
  - `README.md:32` (Tech stack row): also drops "Both sides are tested against it", because the frontend is not tested against `openapi.yaml`.
  - `README.md:215` (Layout).
  - `PROGRESS.md:26` (Layout).
  - `conventions.md:10` (the `backend/` row's "once built"; the queue entry says :9, which has drifted by one line).
- **Wording:** each `openapi.yaml` line must say `follows the backend` and cite `E-14`. `README.md` must contain no "contract" anywhere.
- **Alignment:** each changed line keeps its description column.
- **Nothing else moves:** no other line in those files and no other file changes. This is checked by `git diff` recorded in the Verdict, not by a committed pin (P-17).
- **Whole suite green:** pre-existing tests change only by approval.

**Already done, so not in the criteria:** T-105 already fixed the `openapi.yaml` row in `conventions.md`, and `PROGRESS.md:26` already cites E-14.

**Expected to go red:**
- **T-105 tests:** two in `question-bank/src/conventions-openapi-row-verify.test.ts` (the "every other line byte-identical" digest and "backend/ row keeps 'once built…'").
- **Whole-tree pins:** the usual ones, set off by the new brief and run-log files.

**Found while surveying, left out of scope:** `README.md:37` still says "15 states, 26 questions". The app serves 50 states and 415 questions. It is not in the queue yet; the brief asks the reviewer to queue it.

## Approval — orchestrator — 2026-11-12T15:29Z
Stamped `Approved:` as an unattended run. The criteria were not read.
