# T-087 — A bank refresh tells you to regenerate the question file and the served bank

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** orchestrator — 2026-10-30, unattended run. See `runs/T-087-refresh-regenerate-reminder.md`.
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
| worker | 2026-10-30 | cse_011oDiJf8mLL75U1jKWTn7Jx |

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

**TL;DR.** I added a `questions` script. A changed refresh now prints both
regenerate commands to stdout, in order, after the summary. It does not run them.
Both docs are updated. 11 pre-existing tests in 8 files are stale reds caused by
this change, and 2 more were already red at branch HEAD before I touched
anything. A **Test change request is needed**.

**Session note.** The worker session id matches the expander's
(`cse_011oDiJf8mLL75U1jKWTn7Jx`): the orchestrator ran both roles in one remote
session. The tester should run in a different one.

### What changed

- **`question-bank/package.json`**: one added line,
  `"questions": "bun run src/write-questions.ts"`, after `refresh`. No other
  key changed. `bun.lock` and the dependencies are untouched.
- **`question-bank/src/refresh.ts`**: exports `QUESTIONS_COMMAND` and
  `CONTENT_COMMAND`, which hold the brief's exact text. Adds `printNextSteps(out)`,
  called only on the success path, right after `printSummary`. It prints three
  stdout lines:
  - `Next, from the repository root, regenerate in this order:`
  - `  1. cd question-bank && bun run questions   # …`
  - `  2. make -C backend content   # …`

  None of them starts with `  us-state-`. The header comment for exit 0 says the
  commands are printed and not run.
- **`question-bank/README.md`**: in "Refreshing the committed bank", a paragraph
  after the stdout/stderr paragraph, plus a bash block with both commands
  (question command first) and a note on which drift tests fail until they run.
- **`conventions.md`**: in the question-bank command block,
  `bun run ./src/write-questions.ts` is replaced by `bun run questions`, with the
  same comment.
- **New: `question-bank/src/refresh-next-steps.test.ts`** (worker tests, 8):
  - the exact command text
  - order on stdout, and nothing on stderr
  - no `  us-state-` line added
  - the question file and served bank are byte-identical after a changed refresh
  - no command printed on exit 2 or on the three exit-1 paths

  Everything goes through `SparqlTransport` with the committed fixture and temp
  copies. No network.

### Where each criterion lives

| # | Where |
|---|---|
| 1–2 | `question-bank/package.json` `scripts.questions` |
| 3, 5 | Checked by hand: `bun run questions` and `bun run ./src/write-questions.ts` both leave `data/questions/us-states.json` clean in `git status` |
| 4 | The script runs exactly `bun run src/write-questions.ts`, so the bytes match by construction. The tester should check it on a modified bank copy |
| 6–7 | `refresh.ts` `printNextSteps`, called after `printSummary` |
| 8–9 | `printNextSteps` is reached only on the `EXIT_CHANGED` path. Every `return EXIT_FAILED` / `EXIT_UNCHANGED` comes before it |
| 10 | `refreshBank` writes only the bank dir and the two fixture paths, as before |
| 11 | The three refresh test files are unmodified and pass |
| 12 | `question-bank/README.md` "Refreshing the committed bank" |
| 13 | `conventions.md` `## Commands` block. `frontend/src/conventions-doc.test.ts` passes (81/81) |
| 14–16 | Nothing under `backend/`, `frontend/`, `e2e/` or `data/` changed. No dependency added |

### How to run

```bash
cd question-bank && bun install --frozen-lockfile   # node_modules was absent in this session
bun test src/refresh-next-steps.test.ts src/refresh.test.ts src/refresh-verify.test.ts src/refresh-routes-verify.test.ts
bun test && bun run typecheck && bun run lint && bun run format:check
make -C backend test
```

### Results in this session

- **question-bank `bun test`**: 2669 pass, 11 fail. The 11 are listed below and
  include the 2 that were red before this change.
- **typecheck, lint, format:check**: clean (prettier 3.9.6 from
  `node_modules`).
- **`make -C backend test`**: 744 passed, 9 skipped.
- **frontend**: **the full `bun test` was not run.**
  `bun install --frozen-lockfile` in `frontend/` failed: the proxy refused a
  CONNECT to `europe-west1-npm.pkg.dev` (403, policy denial), where the lockfile
  resolves its tarballs. Only `src/conventions-doc.test.ts` ran, and it passed
  81/81. That is the one frontend test that reads a file this task touched.

### Tests made stale

All but one are stale because `question-bank/package.json` changed bytes, which
criteria 1–2 require. For each pin, the fix is the same: **modify it to accept
this task's `package.json`.** Either re-pin the digest, or exempt
`question-bank/package.json` and leave the lockfiles pinned. None should be
deleted.

| File | Test (describe > test) | Why stale |
|---|---|---|
| `highest-point-in-state-verify.test.ts` | `T-079 tester, criterion 20 — every package.json and bun.lock is byte-identical to 323254c` > `question-bank/package.json` | sha256 of `package.json` |
| `agriculture-true-wrong-answers-verify.test.ts` | `T-088 criteria 20-25: what must not change` > `criterion 23: every package.json, bun.lock, pyproject.toml and uv.lock is main's` | manifest pin |
| `climate-far-phrases-verify.test.ts` | `T-090 criterion 17: no new dependency, no lockfile change` > `every package.json, pyproject.toml and lockfile is byte-identical to 3279555, none added` | manifest pin |
| `map-click-no-candidates-verify.test.ts` | `T-092 criterion 15: no new dependency, no manifest or lockfile change` > `every package.json, pyproject.toml and lockfile is byte-identical to 5d72ca5's, none added` | manifest pin |
| `hand-check-levels-verify.test.ts` | `T-025 criteria 14-17: …` > `criterion 15: every package.json and lockfile is byte-identical to aa88101, and none was added` | manifest pin |
| `farm-animal-loose-ends-verify.test.ts` | `T-096 criteria 17-21: the bank and the boundaries` > `criterion 20: every package.json, bun.lock, pyproject.toml and uv.lock is main's` | manifest pin |
| `familiarity-drawn-apart-verify.test.ts` | `T-085a criteria 23-25: negative` > `criterion 23: no package.json, bun.lock, pyproject.toml or uv.lock changed since 5ae564a` | manifest pin |
| `climate-cold-trade-accepted-verify.test.ts` | `T-091 criterion 21: no dependency is added or changed` > `every package.json, bun.lock, backend/pyproject.toml and backend/uv.lock is 12d242e's` | manifest pin |
| `climate-cold-trade-accepted-verify.test.ts` | `T-091 criterion 20: no non-test source file moves` > `every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's` | **Not in the expander's list.** It pins `question-bank/src/refresh.ts`, which this task must change (criteria 6–7). Modify it to exempt `refresh.ts`, or re-pin |

**Already red at branch HEAD `ca63b6e`, before any worker change.** With my
changes stashed, these two fail. Both count tracked non-test files, and the
expander and orchestrator commits added two: `tasks/T-087-…md` and
`runs/T-087-…md`. This task also changes `package.json`, `refresh.ts`,
`README.md` and `conventions.md`, so they would go red even without those added
files.

- `farm-animal-loose-ends-verify.test.ts`: `T-096 criteria 17-21: the bank and
  the boundaries` > `criterion 21: outside the allowed files and test files,
  every tracked file is main's, and none is added`
- `climate-cold-trade-accepted-verify.test.ts`: `T-091 criterion 22: the diff
  touches only the allowed files` > `every tracked non-test file outside the
  allowed list is 12d242e's, and none is added` (expects 301 files, gets 303 at
  HEAD)

What to do: modify both to tolerate brief and run-log files under `tasks/` and
`runs/`, plus this task's four changed files. **Tester to raise this with a
human.** It is a standing hazard for every task, not only T-087, so it is also
worth a `tasks.md` entry. **Owner: reviewer at the sweep.**

### What I deliberately did not do

- **No chaining**: the refresh does not run either command (Out of scope,
  criterion 10).
- **No `--help` text change.** It was allowed, not required.
- **`_source.generatedBy`, the docstrings and `backend/README.md` are
  untouched** (Out of scope). They still name a working command.
- **No queue entry** for the drift-test failure messages (Out of scope says
  optional). The new README paragraph names the failing tests, which covers most
  of the value. **Owner: reviewer**, if they want the entry.

### Contradictions with the brief

- **The expander's stale list misses `T-091 criterion 20`**, which pins
  `refresh.ts`.
- **The `Approved:` line and the last Notes bullet disagree.** The line is an
  orchestrator stamp. The bullet says it "stays `pending` until a person
  writes their name". I took the orchestrator stamp as valid, which my role
  instructions allow. **Owner: reviewer**, to confirm a human has looked at the
  criteria before merge.

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
- **Worker: `bun run format` rewrites pre-existing tests when the pinned
  prettier is absent.** At the start of this session `question-bank/node_modules`
  was missing, so `bun run format` used some other prettier. It reformatted
  three pre-existing test files (`distractors.test.ts`,
  `highest-point-metres-verify.test.ts`, `mul-labels-verify.test.ts`). I
  reverted them with `git checkout`, and none is in the commit. After
  `bun install --frozen-lockfile`, prettier 3.9.6 reports the tree clean. Later
  roles should install before formatting.
- **Worker: the reminder's wording.** I numbered the two lines (`1.` / `2.`)
  and put an arrow comment on each naming the file it writes. The order is
  visible even if someone reads only one line, and neither line can be mistaken
  for a change line. **Owner: reviewer**, to accept or reword.
