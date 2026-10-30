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
