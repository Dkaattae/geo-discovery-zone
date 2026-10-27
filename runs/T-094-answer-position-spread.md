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

## Round 2 — worker — 2026-10-27
`Next step` on entry: `worker` (Status `awaiting approval`) → on exit: `tester` (Status `awaiting verification`)

**TL;DR:** I added one new test file for T-094, and it passes on the current source and committed bank. All eight positioned templates already put their answer at each of the four positions (indices 0 to 3), so criterion 4 found no gap and nothing needs blocking. The whole `question-bank` suite passes (2449 pass, 0 fail), and so do typecheck, lint and `format:check`. Next step is the tester.

- **New file:** `/home/user/geo-discovery-zone/question-bank/src/answer-position-spread.test.ts`
  - It picks the templates to check by format: everything in `TEMPLATES` except `map_click`. It does not list ids.
  - It asserts that set is not empty and contains all eight template ids named in the brief.
  - It asserts every template in the set has at least one question at each index 0 to 3. On failure the output names the template and the index, e.g. `"tpl-farm-animal-of: no question with correctIndex 0"`.
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-094-answer-position-spread.md` now has the Handoff with a criterion table and Notes. Status is `awaiting verification`, Next step is `tester`, and my Sessions row is added.
- **Nothing else changed.** No source, data, existing test, `package.json` or `bun.lock` changes. Tests made stale: none.
- **Push landed:** commit `490b7e7` is the tip of `origin/claude/modest-bell-3vg6ok`, which is the brief's `Branch:` header and the branch I was on.

**Mutation checks I ran myself (all reverted):**
- **Criteria 5–7:** each of the eight templates went red when it lost index 3, one at a time. `tpl-farm-animal-of` also went red when it lost index 0.
- **Criterion 8:** a copy of `tpl-capital-of` limited to countries, so it produces zero questions on the state bank, went red and listed all four indices for that template.

**Flags:**
- **Same session id as the expander.** My `CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJdmgY3R4p3uHw5DgmH`, identical to the expander's row. The orchestrator or the `runs/` record should note this, and the tester needs to confirm its own id differs.
- **Criterion 8's example doesn't behave as the brief describes.** A template that requires a field that isn't on `Entity` at all makes `generate` throw. The file still goes red, but as an unhandled error instead of this test's named failure. A real `Entity` field that no state happens to have fails with the template named, as intended. The tester should decide whether the throwing case counts as passing criterion 8. I think it does.
- **Environment:** `node_modules` was missing. Before `bun install --frozen-lockfile`, typecheck, lint and format failed and the suite showed 12 failures; after the install everything was clean and the lockfile was unchanged.
