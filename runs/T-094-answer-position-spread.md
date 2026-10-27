# T-094 — Answer-position spread is checked again for every template that has a position — run log

**Task:** T-094 · **Branch:** `claude/modest-bell-3vg6ok` · **PR:** #101
**Started:** 2026-10-27 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-27
`Next step` on entry: `none (no brief)` → on exit: `worker` (Status: `awaiting approval`)

**TL;DR:** I wrote and pushed the T-094 brief and opened draft PR #101. It is waiting for a person to approve it. Next step: a human approves, then `worker`. Nothing is blocked.

- **Task picked: T-094**, "Answer-position spread is no longer checked per template for six templates" (S). It is the first entry in the queue that does not depend on anything. Passed over:
  - **T-070, T-085, T-088, T-091, T-056** are each waiting on a person.
  - **T-084** is still skipped for the reason already recorded in `tasks.md`. I added a skip note there for T-094.
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-094-answer-position-spread.md`
  - `Status: awaiting approval`, `Next step: worker`, `Approved: pending`.
  - `Branch: claude/modest-bell-3vg6ok`, `PR: #101`. I added my Sessions row (cse_011oDiJdmgY3R4p3uHw5DgmH).
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/101 (draft, base `main`). The body carries the 15 acceptance criteria.
- **Push landed.** `origin/claude/modest-bell-3vg6ok` is at `4998c8d` (record PR #101), on top of `0a3b6f3` (brief). The diff against `origin/main` touches only `tasks.md` and `tasks/T-094-answer-position-spread.md`, within D-7.

**What the brief asks for:** one new test file under `question-bank/src/`. For every template whose format is not `map_click`, it asserts that the answer appears at each index 0..3 at least once. There are eight such templates today.
- **Questions tested:** the questions are generated from the committed entity bank.
- **Which templates:** the test works out the template list from `TEMPLATES` by format, not from a list of ids written into the test. It also asserts that list holds all eight ids.
- **Must fail on purpose (criteria 5–8):** the tester checks these by temporarily breaking the code, once per template and also for index 0. The test must also fail when a template produces no questions at all.
- **Failure output (criterion 9):** must name the template and the missing index.
- **Must not change (criteria 11–14):** no existing test file, source, data or `backend/` file changes, nothing reaches the network, and no dependency is added.

**Things a person should know:**
- **The current code may not pass.** As my role requires, I did not run the suite or work out the current spread. The smallest template, `tpl-farm-animal-of`, has only 24 questions. If the new test is red today, criterion 4 tells the worker not to change source, data or the assertion. It sets `Status: blocked` and `Next step: human` instead, because that would be a content problem for a person to decide.
- **Scope choices I made:**
  - The test runs over questions generated from the committed bank, not over the committed question file, so a change to `correctIndexFor` turns it red directly.
  - There is no "at least 20 per index" minimum. The queue entry asks for at least one per index, and a minimum for the 24-question template would be a separate decision.
  - It has to be a new file, because adding a test to an existing file would count as changing an existing test.
- `PROGRESS.md` is unchanged.
