# T-087 — A bank refresh tells you to regenerate the question file and the served bank

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-087
**Branch:** `claude/hopeful-gates-wh4fep`
**PR:** #112, opened draft at expand time against the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-30 | cse_011oDiJf8mLL75U1jKWTn7Jx |

**Worker model:** Sonnet is enough. One `package.json` script, a few printed
lines in `refresh.ts`, two doc edits. No data moves and no question changes.

**Plan to attend the tester step.** Adding a script changes the bytes of
`question-bank/package.json`, and at least seven verify tests pin that file by
sha256 or against an old commit (listed under Constraints). They go red by
design, so a Test change request is near certain (D-14, D-15).

## Goal

After `bun run refresh` changes the entity bank, two more commands have to run
before the suite goes green again: the question file and then the served bank.
Today nothing tells the person running the refresh this, and the first command
is a file path rather than a named script. This task gives it a name and makes
the refresh, and the doc beside it, say what to run next.

## Acceptance criteria

**Frozen once approved.** **Main** means `0a98e11`, the default branch this
task starts from. **The question file** is
`question-bank/data/questions/us-states.json`. **The served bank** is
`backend/app/data/content.json`. **A changed refresh** is a refresh run (the
`bun run refresh` CLI or `refreshBank` in `question-bank/src/refresh.ts`) that
exits / returns `0`. **The question command** is the exact text
`cd question-bank && bun run questions`. **The content command** is the exact
text `make -C backend content`. Both are written as run from the repository
root.

### A named script for the question file

1. `question-bank/package.json` `scripts` has a key `questions`.
2. `scripts` is main's `scripts` plus `questions` and nothing else: no other key
   is added, removed or changed. `dependencies` and `devDependencies` are
   main's, and `question-bank/bun.lock` is byte-identical to main's.
3. On a tree whose entity bank (`question-bank/data/us-states/`) is main's,
   `bun run questions` run in `question-bank/` exits 0 and leaves the question
   file byte-identical to main's.
4. On a tree whose entity bank differs from main's in a field a template asks
   about (for example one state's `capital`), `bun run questions` writes the
   same question-file bytes that `bun run ./src/write-questions.ts` writes from
   that same bank, and those bytes differ from main's question file.
5. `bun run ./src/write-questions.ts`, run in `question-bank/`, still works: it
   exits 0, and on main's entity bank it leaves the question file
   byte-identical to main's.

### The refresh says what to run next

6. A changed refresh prints, on stdout, a line containing the question command
   and a line containing the content command.
7. In that output, the question command's line comes before the content
   command's line, and both come after the `bank changed (` summary line.
8. A refresh that exits 2 (`bank unchanged`) prints neither the question
   command nor the content command, on stdout or stderr.
9. A refresh that exits 1 prints neither command, on stdout or stderr, on each
   of the three failure paths in `question-bank/README.md`'s exit table: the
   transport fails, the response is malformed (no `results.bindings` array),
   and fewer than all 50 states match.
10. A changed refresh does not itself run either command: the question file and
    the served bank are byte-identical before and after it (observable with
    `--bank <tmp dir> --fixture <tmp path>`, or `refreshBank` with temp paths
    and a fixture transport).
11. Every test in `question-bank/src/refresh.test.ts`,
    `question-bank/src/refresh-verify.test.ts` and
    `question-bank/src/refresh-routes-verify.test.ts` passes, and none of those
    three files is modified, except under an approved Test change request row.
    (This is what holds the existing stdout contract: one `  us-state-…` line
    per changed field, exit codes 0 / 1 / 2.)

### The docs say it too

12. In `question-bank/README.md`, the section from `## Refreshing the committed
    bank` up to the next `## ` heading contains the question command and the
    content command, the question command first.
13. `conventions.md`'s question-bank command block (the fenced block under
    `## Commands`) lists `bun run questions`, and no longer lists
    `bun run ./src/write-questions.ts`.

### What must not happen

14. The question file and the served bank are byte-identical to main's. (So the
    question file's `_source.generatedBy`, which names
    `bun run ./src/write-questions.ts`, stays as it is; criterion 5 keeps it
    true.)
15. No file under `backend/`, `frontend/` or `e2e/` changes, except a
    pre-existing test modified under an approved Test change request row.
16. No new dependency, in any `package.json`, `pyproject.toml` or lockfile.
17. No test reaches the network. A test that drives a refresh uses the
    `SparqlTransport` seam with a recorded fixture, or the `--offline` /
    fixture path, never `fetch`.
18. The whole suite passes: in `question-bank/` `bun test`, `bun run typecheck`,
    `bun run lint`, `bun run format:check`; in `frontend/` `bun test`; and
    `make -C backend test`. Any pre-existing test that changed did so only
    under an approved Test change request row, named in the Verdict.

## Out of scope

- **Chaining** the two commands into the refresh, or into the new script.
  That was the bigger option in the queue entry and stays out (criterion 10).
- **T-070's four relaxed backend drift tests.** The queue entry says to restore
  their full `extractedAt` comparison *if* this task makes the refresh
  regenerate `content.json`. It does not, so they stay as T-070 left them
  (`backend/tests/test_content_build.py`, `test_t040_tester_criteria.py` ×2,
  `test_t051_tester_criteria.py`).
- **`_source.generatedBy`** in the question file, the docstrings in
  `write-questions.ts` and `backend/app/content_build.py`, and
  `backend/README.md` line 52 all still name `bun run ./src/write-questions.ts`.
  That command still works (criterion 5), so they are not wrong. Changing
  `generatedBy` would move the question file's and served bank's bytes and every
  bank digest with them.
- **The drift tests' failure messages** (`question-file.test.ts`,
  `test_content_build.py`) naming the command to run. Worth a queue entry if
  the worker thinks so; not this task.
- **A `make` target or script in `backend/`** for the question file.
- `bun run build`, `--offline`, and the `--help` text. The help text may
  mention the commands; nothing requires it.

## Constraints

- **Files expected to change:** `question-bank/package.json`,
  `question-bank/src/refresh.ts`, `question-bank/README.md`, `conventions.md`,
  and new test files. The tester's approved Test change request rows may add
  pre-existing test files.
- **Pre-existing tests expected to go red** because `question-bank/package.json`
  changes bytes. They pin it by sha256 or against an older commit. Found by
  the expander, possibly not complete; the worker lists every one under **Tests
  made stale** and does not edit them:
  - `question-bank/src/highest-point-in-state-verify.test.ts` (T-079 criterion 20)
  - `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` (criterion 23)
  - `question-bank/src/climate-far-phrases-verify.test.ts`
  - `question-bank/src/map-click-no-candidates-verify.test.ts`
  - `question-bank/src/hand-check-levels-verify.test.ts` (criterion 15)
  - `question-bank/src/farm-animal-loose-ends-verify.test.ts` (criterion 20)
  - `question-bank/src/familiarity-drawn-apart-verify.test.ts` (criterion 23)
  - `question-bank/src/climate-cold-trade-accepted-verify.test.ts` (criterion 21)
- **The existing refresh stdout contract holds.** `refresh.test.ts` counts
  stdout lines starting with `  us-state-` (two spaces). A new line must not
  start that way (criterion 11).
- **Stdout, not stderr, for the reminder.** `question-bank/README.md` says
  stdout is what a routine pastes into the PR body, and the reminder belongs
  there.
- **`frontend/src/conventions-doc.test.ts`** checks that every
  `bun run <script>` in `conventions.md` is a real script. `bun run questions`
  passes that once criterion 1 holds. The test itself must not change.
- **Dependencies:** none (`CLAUDE.md`, "Packages").
- **Formatting:** prettier is pinned, and `format:check` covers
  `question-bank/src/**/*.ts` (E-16).

## Context

**Required reading for the worker and the tester.**

- `tasks.md` T-087: the queue entry, including the 2026-10-29 amendment from
  T-070's reviewer.
- `question-bank/src/refresh.ts`: the header comment (exit codes),
  `refreshBank`, `printSummary`, `main`.
- `question-bank/src/write-questions.ts`: what the question command runs today,
  and `question-bank/src/question-file.ts` for `generatedBy`.
- `backend/Makefile` `content` target and `backend/app/content_build.py`
  docstring. The served bank reads the question file, which is why the
  question command comes first (criterion 7).
- `question-bank/README.md` "Refreshing the committed bank";
  `conventions.md` "Commands".
- `engineering-decisions.md` E-6 (committed bank, offline rebuild) and E-24
  (the bank the app serves, and the two drift guards this reminder exists
  for).
- `question-bank/src/refresh.test.ts` and `refresh-verify.test.ts`: how a
  refresh is already driven offline through `SparqlTransport`. New tests should
  follow that pattern.
- `test-guidelines.md`: no network, and seams only where the network is
  spanned.

## Handoff

## Verdict

## Notes

- **Why T-087 and not an earlier entry.** T-085b is blocked: it needs a person
  to pick how a Census release is reached, and `PROGRESS.md` records no choice
  yet. T-056 depends on a design decision nobody has made. T-087 is the first
  entry in queue order whose dependencies are done. §A and §B queue nothing.
- **The script, not "the reason it is not".** The queue entry allows either.
  The expander chose the named script: the entry leans that way, and it lets
  the refresh print a short command. The cost is the package.json digest
  family above, which the entry anticipated ("plan to attend the tester step").
  The entry named two pins. The survey found at least eight.
- **Already true, so not asked for:** the refresh exit codes and change summary
  (T-063); both drift guards (`question-file.test.ts`, `test_content_build.py`);
  `conventions.md` and `backend/README.md` listing `make -C backend content`.
- **Approval is not delegated.** Under the orchestrator this step is skipped,
  not performed. `Approved:` stays `pending` until a person writes their name
  and the date.
