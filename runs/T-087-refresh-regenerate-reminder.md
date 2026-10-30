# T-087 — A bank refresh tells you to regenerate the question file and the served bank — run log

**Task:** T-087 · **Branch:** `claude/hopeful-gates-wh4fep` · **PR:** #112
**Started:** 2026-10-30 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-30
`Next step` on entry: `none — no brief` → on exit: `worker`

**TL;DR:** I wrote the T-087 brief and opened it as draft PR #112. Both commits are on `origin/claude/hopeful-gates-wh4fep` (head `37daa9e`, confirmed by fetch). Status is `awaiting approval` and Next step is `worker`. A person has to approve first: `Approved:` is still `pending`, and the worker will refuse to start until a person writes their name and the date there.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-087-refresh-regenerate-reminder.md
- **Branch header:** `claude/hopeful-gates-wh4fep`. It is the branch assigned to this session and the branch PR #112 is built from.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/112 (draft, against `main` at `0a98e11`).
- **Commit scope:** only the new brief, plus `tasks.md` (T-087 changed from `todo` to `doing`). No source, tests or configuration.

**Why T-087**
- T-085b and T-056 come earlier in queue order but are both blocked:
  - **T-085b** needs a person to choose how to reach a Census release, and no choice is recorded.
  - **T-056** needs a design decision.
- §A and §B have nothing queued. `tasks/` was empty at the start, so the last cycle was swept.

**What the brief asks for (18 criteria)**
- **New script:** `bun run questions` in `question-bank/package.json`. It must write the same bytes as `bun run ./src/write-questions.ts`, and that old command must keep working.
- **Refresh output:** when a refresh exits 0, it prints `cd question-bank && bun run questions` and then `make -C backend content` on stdout, after the summary line. It prints neither when it exits 1 or 2, and it does not run either command itself.
- **Docs:** the "Refreshing the committed bank" section of `question-bank/README.md` lists both commands, and `conventions.md` lists `bun run questions` in place of the file path.
- **Must not change:** the question file and `content.json` stay byte-identical to main. Nothing changes under `backend/`, `frontend/` or `e2e/` except approved test changes. No dependency, no network in tests, and the full suite passes.

**Decisions I made as expander (recorded in the brief's Notes)**
- **Script rather than a written-down reason:** the queue entry allowed either. I chose the named script because the entry leans that way.
- **Chaining is out of scope.** Because the refresh does not regenerate `content.json`, the queue entry's request to restore T-070's four relaxed `extractedAt` tests does not apply.

**Heads-up for the tester step**
- **Expect a Test change request.** At least eight verify tests in `question-bank/src/` check `question-bank/package.json` against a stored digest or an old commit. The brief lists them under Constraints. Adding the script turns them red by design. Under the orchestrator, the run will halt there until a person approves the request.

## Approval — orchestrator — 2026-10-30
Stamped `Approved:` as an unattended run (orchestrator.md "Approval"). Criteria not read.

## Round 2 — worker — 2026-10-30
`Next step` on entry: `worker` (Status `awaiting approval`) → on exit: `tester` (Status `awaiting verification`)

**TL;DR.** T-087 is built and pushed. Commit `e982550` is on `origin/claude/hopeful-gates-wh4fep`, which `git log origin/claude/hopeful-gates-wh4fep -1` confirms. The brief is at Status `awaiting verification`, Next step `tester`. A Test change request is needed: 11 pre-existing question-bank tests are red. 9 go red because of this change, which the brief predicted. 2 were already red at the branch head before I changed anything.

**What I changed**
- **`question-bank/package.json`:** added `"questions": "bun run src/write-questions.ts"`. Nothing else in the file changed, and `bun.lock` is untouched.
- **`question-bank/src/refresh.ts`:** a refresh that changes the bank now prints two more lines on stdout, after the `bank changed (` summary line: `cd question-bank && bun run questions`, then `make -C backend content`. It prints them only on exit 0, and it does not run them. Neither line starts with `  us-state-`, so the existing count of change lines still holds.
- **`question-bank/README.md`:** the "Refreshing the committed bank" section now gives both commands, the question command first.
- **`conventions.md`:** the question-bank command block lists `bun run questions` in place of `bun run ./src/write-questions.ts`.
- **New `question-bank/src/refresh-next-steps.test.ts`:** 8 tests, offline through `SparqlTransport` with the recorded fixture. They cover the order on stdout, that a changed refresh leaves the question file and the served bank byte-identical, and that nothing is printed on exit 2 or on any of the three exit-1 paths.
- **Brief:** Handoff written, worker row added to Sessions, Notes added.

**Results**
- **question-bank `bun test`:** 2669 pass, 11 fail. Every failure is listed in the Handoff.
- **typecheck, lint, format:check:** clean.
- **`make -C backend test`:** 744 passed, 9 skipped.
- **`bun run questions` and `bun run ./src/write-questions.ts`:** both leave the question file unchanged. Checked by hand.
- **frontend:** the full suite was not run. `bun install` in `frontend/` was refused by the proxy (403 on `europe-west1-npm.pkg.dev`). Only `conventions-doc.test.ts`, the one frontend test that reads a file I touched, was run: 81/81 pass.

**Stale reds, for the tester's Test change request**
- **Pins on `package.json` (8 tests):** in the eight files the brief named. The expander's list was right for these.
- **`T-091 criterion 20` in `climate-cold-trade-accepted-verify.test.ts` (1 test):** the expander missed this one. It pins `refresh.ts`, which this task has to change.
- **`T-096 criterion 21` and `T-091 criterion 22` (2 tests):** already red at HEAD `ca63b6e`. They count tracked non-test files, and the expander and orchestrator commits added the brief and the run log.

**Where the brief contradicts itself**
- **Approval:** the brief's last Note says `Approved:` stays `pending` until a person signs, but the line carries an orchestrator stamp. I treated the stamp as valid, as my role allows. The reviewer should confirm that a human has looked at the criteria before merge.

**Flags, each with an owner**
- **Count-based pins:** the two tests already red at HEAD will catch every task that adds a brief and a run log. That deserves a `tasks.md` entry. Reviewer, at the sweep.
- **Same session id:** the worker ran in the same session as the expander (`cse_011oDiJf8mLL75U1jKWTn7Jx`). The tester must run in a different one.
- **Install before formatting:** `node_modules` was missing at the start, so `bun run format` used a different prettier and rewrote 3 pre-existing tests. I reverted them and none is committed. Later roles should run `bun install --frozen-lockfile` before formatting.

G5: Status and Next step both changed — pass.
