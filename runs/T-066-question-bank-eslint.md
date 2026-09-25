# T-066 — `question-bank/` gets eslint and a `lint` gate — run log

**Task:** T-066 · **Branch:** `claude/relaxed-pascal-ff0fgq` · **PR:** #62
**Started:** 2026-09-25 · **Outcome:** in progress

## Round 1 — task-expander — 2026-09-25
`Next step` on entry: `(no brief)` → on exit: `worker`

**TL;DR**
- **I've written and pushed the T-066 brief** (eslint and a lint gate for `question-bank/`). Draft PR #62 is open. The brief reads `Status: awaiting approval`, `Next step: worker`, `Approved: pending`.
- **Why T-066:** it is the first task in the queue whose dependencies are done. It had been blocked on a dependency decision, and that is now recorded in `tasks.md` ("add eslint", katechen150621@gmail.com, 2026-09-25).
- **Next:** approve on the PR, then run the worker.

**Where it is**
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-066-question-bank-eslint.md`
- **Branch header:** `claude/relaxed-pascal-ff0fgq`. The harness assigned it; it starts from `origin/main` at `01a32eb`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/62 (draft, base `main`)
- **Push confirmed:** `origin/claude/relaxed-pascal-ff0fgq` is at `e12c538`. The diff against `origin/main` touches only the new brief and `tasks.md`, where T-066 is marked `doing` with a pointer to the brief.

**What the brief says**
- **Scope:** 19 criteria, so this is a full brief, not the light path.
  - The gate is clean on the current code and fails on warnings.
  - It covers every `.ts` file under `src/`, tests included.
  - It does not enforce formatting. Prettier stays with T-071.
  - Nothing under `data/` or `sample-data/` changes, and there is a CI step.
  - The dependencies added must come from `eslint`, `@eslint/js`, `typescript-eslint` and `globals`, with the lockfile committed.
  - The docs must mention `bun run lint`.
- **Already true:** none of the deliverable exists. Two things in the repo record that it is missing:
  - a comment in `ci.yml` (lines 118-121) saying question-bank has no lint step;
  - `frontend/src/lint-gate.test.ts:155`, which asserts that comment is there. The worker is told to update it (criterion 12).

**Worth knowing before approval**
- **TypeScript 7 risk:** `question-bank/` uses `typescript ^7.0.2`, and typescript-eslint's parser loads that package. If the approved packages cannot lint it, the brief tells the worker to set `Status: blocked` / `Next step: human` and ask. It must not downgrade TypeScript, add another parser, or pick some other workaround.
- **My reading of "add eslint":** I took it to mean the smallest set of packages that lets eslint lint TypeScript, the same ones `frontend/` uses. If it should be narrower, change criterion 14 before approving.
- **Merge will be escalated:** the task adds a dependency, so the reviewer will flag it for a human at merge time.

## Approval — 2026-09-25
The orchestrator's unattended self-stamp was refused by the session's permission
check. A human was present, so the brief was approved by katechen150621@gmail.com
in chat ("approved, go ahead with the worker") and recorded as such in `Approved:`.
