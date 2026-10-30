# T-087 — A bank refresh tells you to regenerate the question file and the served bank

**Status:** `approved`
**Next step:** `human` — merge PR #112 (Dkaattae)
**Approved:** orchestrator — 2026-10-30, unattended run. See `runs/T-087-refresh-regenerate-reminder.md`.
**Test changes:** `approved — Dkaattae, 2026-10-30` (rows 1-12, 10a, 11a, 13, 14)
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-087
**Branch:** `claude/hopeful-gates-wh4fep`
**PR:** #112, opened draft at expand time against the branch above
**Fault:** none

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-30 | cse_011oDiJf8mLL75U1jKWTn7Jx |
| worker | 2026-10-30 | cse_011oDiJf8mLL75U1jKWTn7Jx |
| tester | 2026-10-30 | cse_011oDiJf8mLL75U1jKWTn7Jx (orchestrated: shared id; fresh subagent context) |
| tester (attended) | 2026-10-30 | cse_011oDiJctHP57TNboL3nFxs6 |
| reviewer | 2026-10-30 | cse_011oDiJf8mLL75U1jKWTn7Jx (orchestrated: shared id; fresh subagent context) |

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

### Round 2 (attended tester, 2026-10-30): pass

**TL;DR. Pass.** A person approved the test change request, and every approved row is applied. The question-bank suite is green: 2713 pass, 0 fail, and typecheck, lint and format:check are clean. **Next step: reviewer.**

- **Independence: a separate session.** This session is `cse_011oDiJctHP57TNboL3nFxs6`. The expander, worker and round-1 tester ran as `cse_011oDiJf8mLL75U1jKWTn7Jx`. A person started this session directly and answered in it, so it is attended.
- **Approval, in the person's words:** "Approve all 12" for rows 1-12, then "Approve all 4" for rows 10a, 11a, 13 and 14, with the name "Dkaattae". The header records it: `Test changes: approved — Dkaattae, 2026-10-30`.
- **Rows checked before asking.** The branch is level with main (`0a98e11`). The 12 red tests were exactly rows 1-12.
- **Applied in `8bf0959`**, exactly the approved rows, nothing else. Every row is a modify, nothing was deleted, and no count floor moved.

| Row | Test modified | What changed |
|---|---|---|
| 1, 2, 5, 7 | T-079 c20, T-088 c23, T-025 c15, T-085a c23 | `question-bank/package.json` digest → `8e276875…a3a3`; the other digests are unchanged |
| 3, 4 | T-090 c17, T-092 c15 | combined manifest digest → `0ce355ae…5c99`; only `question-bank/package.json` moved (`git diff --name-status origin/main..HEAD`) |
| 6, 8 | T-096 c20, T-091 c21 | combined dependency digest → `9e3ffca9…cabc`; same evidence |
| 9 | T-091 c20 | source-tree digest → `8f004afd…ace6`; the only file that moved is `refresh.ts` (`41de4902…2631`) |
| 10 + 10a | T-096 c21 | T-087's file set added to `CRITERION_21_ALLOWED`; count 297 → 293, digest → `ceaf01f5…e62a` |
| 11 + 11a | T-091 c22 (untouchable) | the same file set added to `CRITERION_22_ALLOWED`; count 301 → 297, digest → `b6b89907…c739` |
| 12 | T-091 c22 (pre-existing tests) | new `T087_TEST_FILES` exclusion; count 110 → 107, digest → `bc91f541…291d` |
| 13 | T-091 c22 (request files at 8108a42) | four `APPLIED_REQUEST_FILE_SHAS` entries → this branch's bytes; "still differs from main" kept |
| 14 | T-025 c17 | the 48-file digest → `2e90dd58…f6aa6` |

- **Why 10a, 11a, 13 and 14 exist.**
  - **10a, 11a:** rows 10 and 11 hit their own stop rule. Exempting four files that already exist on main has to shrink the counted set, so "the count stays" could not hold.
  - **Nothing else moved.** I ran the same filters on a `git worktree` of main. It gives the same counts and digests as this branch for rows 10, 11 and 12.
  - **13, 14:** two guards the request did not name went red only after rows 1-12 were applied.
- **Nothing was weakened.** Every modified test still pins exact bytes. Each pin now covers the T-087 state, which main's own state confirms for 10a, 11a and 12.

**Suite**

- **question-bank:** 2713 pass, 0 fail (71 files). `typecheck`, `lint` and `format:check` are clean.
- **backend:** `uv run pytest` gives 744 passed, 9 skipped (the Postgres-only tests). `ruff check` and `ruff format --check` are clean.
- **frontend: not run locally.** `bun install --frozen-lockfile` is refused by the proxy (403 on the `d3-transition` / `internmap` tarballs), and without the packages the tests error. T-087 changes nothing under `frontend/` (round-1 criterion 15). CI runs that job on this push.
- **Criterion 18: met** on question-bank and backend locally. Frontend and e2e rest on CI.
- **Criteria 1-17:** round 1's verdict stands. Its test file, `refresh-regenerate-reminder-verify.test.ts`, is unmodified and passes in the run above.

### Round 1 (orchestrated tester)

**TL;DR. Criteria 1–17 are met. Criterion 18 is held up only by 12 stale pins, and they need a person's approval.** The 12 are pre-existing question-bank tests that pin `package.json`, `refresh.ts`, or the set of tracked files. This task changes all three by design. A Test change request for 12 rows is below. **Next step: a human.** Start a `tester` in a session you are attending and approve or refuse each row there.

- **Independence: weaker than a separate session.** This run is orchestrated (`runs/T-087-refresh-regenerate-reminder.md` exists). So `$CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_011oDiJf8mLL75U1jKWTn7Jx`) is the same id as the expander's and the worker's, and the id check proves nothing. My independence rests only on being a freshly spawned subagent with its own context: I did not see the work done or the worker's reasoning. That depends on the orchestrator having spawned me correctly, which I cannot check myself.
- **New tests:** `question-bank/src/refresh-regenerate-reminder-verify.test.ts`, 33 tests, one `describe` per criterion. All pass. Main's bytes are pinned as sha256 digests recorded at `0a98e11` from a `git worktree`. No git call is given a revision (T-081 guard).
- **Expected values come from the brief.** The two commands are the brief's literal text, not the constants exported by `refresh.ts`.

| # | Verdict | Evidence (`describe` in the new file) |
|---|---|---|
| 1 | met | `scripts.questions` exists |
| 2 | met | scripts minus `questions` deep-equal main's; deps, devDeps and `bun.lock` digests are main's |
| 3 | met | in a temp copy of `question-bank/` with main's bank (bank digest checked), `bun run questions` exits 0. The question file is first overwritten with `stale`, then rewritten to main's sha |
| 4 | met | Colorado's capital is set to `Boulder` in two temp copies. `bun run questions` and `bun run ./src/write-questions.ts` write identical bytes, not main's, and the bytes contain `Boulder` |
| 5 | met | `bun run ./src/write-questions.ts` exits 0 and writes main's sha on main's bank |
| 6 | met | exit 0 with both commands on stdout, through `refreshBank` and through `main --bank --fixture` |
| 7 | met | `bank changed (` index < question index < content index; one summary line |
| 8 | met | on exit 2, neither command appears on stdout or stderr (`refreshBank` and CLI) |
| 9 | met | on exit 1, neither command appears, for each failure path: transport throws, no `results.bindings`, 49 states on an otherwise-changed response |
| 10 | met | the real question file and `content.json` are byte-identical before and after a changed refresh (`refreshBank` and CLI) |
| 11 | met | the three refresh test files match main's sha. From the summary on, the only `  us-state-` line is the one field change. All three files pass |
| 12 | met | the README section contains both commands, the question command first |
| 13 | met | the conventions question-bank block has `bun run questions` and not `bun run ./src/write-questions.ts` |
| 14 | met | question file and `content.json` match main's sha; `generatedBy` still names `write-questions.ts` |
| 15 | met | the digest of every tracked file under `backend/`, `frontend/` and `e2e/` equals main's |
| 16 | met | the tracked manifest list is main's, and every manifest except `question-bank/package.json` is byte-identical |
| 17 | met | both T-087 test files use `SparqlTransport`, with no `fetch(` and no live client constructor |
| 18 | **not yet** | question-bank: 2701 pass, **12 fail** (all 12 in the request below). typecheck, lint and format:check are clean. `make -C backend test`: 744 passed, 9 skipped. frontend: see below |

### Mutations (each reverted; `git status` clean afterwards)

| Mutation | Went red |
|---|---|
| M1 removed the `printNextSteps(out)` call | c6 ×2, c7 |
| M2 swapped the two command lines | c7 |
| M3 printed the commands on the unchanged path | c8 ×2 |
| M4 printed the commands to `err` | c6 ×2, c7 |
| M5 printed the commands after each `nothing was written` | c9 ×3 |
| M6 `questions` script → `bun run src/build.ts --help` | c3, c4 |
| M7 added an extra `content` script | c2 |
| M8 the refresh writes the real question file | c14 ×2 on the full file; c10 ×2 when run alone, because earlier tests had already written the sentinel |
| M9 conventions line reverted | c13 ×2 |
| M10 README commands swapped | c12 |
| M11 content command text changed to `make backend content` | c6 ×2, c7 |

### Suite detail

- **question-bank `bun test`:** 2701 pass, 12 fail across 71 files, with the new file staged.
  - The worker listed 11 of the 12.
  - **The 12th it missed:** `T-091 criterion 22 › pre-existing test files are main's…`. It counts tracked test files (expects 110). The worker's own committed `refresh-next-steps.test.ts` makes 111. Every new test file a task adds turns it red.
- **frontend, locally:** 392 pass, 4 fail, 4 errors, all environmental.
  - `react-simple-maps` is not installed. `bun install --frozen-lockfile` is refused by the proxy (403 on `d3-transition` / `d3-zoom` tarballs).
  - Criterion 15's digest shows nothing under `frontend/` changed.
  - CI's `frontend (typecheck, lint, test)` job is **success** on `22e7a12` (GitHub check-runs API).
- **CI on `22e7a12`:** `question-bank` job failure (the stale pins); every other job success.

### For the reviewer

- **The `Approved:` stamp is the orchestrator's** ("Criteria not read", run log). A person has not approved these criteria yet. The worker raised this too.

## Test change request

All 12 rows go stale for the same reason. T-087 has to change `question-bank/package.json` (criteria 1–2) and `question-bank/src/refresh.ts` (criteria 6–7), and it adds the brief, a run log and new test files (Constraints). Every row is a **modify** and none is a delete. No count floor is affected. Every other pin in each test stays as it is.

**Digests.** `question-bank/package.json` is now `8e27687560ccc8a0a08751dee8d7c7b578a81e575bbea02e8f09d9a5fafdd3a3` (main's is `5286f4f7…3f72`). `question-bank/src/refresh.ts` is now `41de4902890f281040a4d3b683a5e4a457eb1a280d205a274bf133cf296c2631`.

**T-087's file set** (used by rows 9–12): `question-bank/package.json`, `question-bank/src/refresh.ts`, `question-bank/README.md`, `conventions.md`, `tasks.md`, `tasks/T-087-refresh-regenerate-reminder.md`, `runs/T-087-refresh-regenerate-reminder.md`. **T-087's test files:** `question-bank/src/refresh-next-steps.test.ts` and `question-bank/src/refresh-regenerate-reminder-verify.test.ts`.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/highest-point-in-state-verify.test.ts` › `T-079 tester, criterion 20 — every package.json and bun.lock is byte-identical to 323254c` › `question-bank/package.json` | `2a1202d`, T-079: no dependency change | T-087 criteria 1–2 add the `questions` script | modify | Same test and name. The `question-bank/package.json` digest is re-pinned to `8e276875…a3a3`, with the comment `// re-pinned by T-087 row 1: questions script added (its criteria 1-2)`. The other five digests are unchanged | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 2 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` › `T-088 criteria 20-25: what must not change` › `criterion 23: every package.json, bun.lock, pyproject.toml and uv.lock is main's` | `e9d666e`, T-088: no dependency change | same as row 1 | modify | Same name. `MAIN_DEP_SHA["question-bank/package.json"]` is re-pinned to `8e276875…a3a3` with a T-087 row 2 comment. The file list and the other digests are unchanged | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 3 | `question-bank/src/climate-far-phrases-verify.test.ts` › `T-090 criterion 17: no new dependency, no lockfile change` › `every package.json, pyproject.toml and lockfile is byte-identical to 3279555, none added` | `2023a09`, T-090: no dependency change | same as row 1 | modify | Same name. Only the `question-bank/package.json` expected digest becomes `8e276875…a3a3` (T-087 row 3 comment). The list-equality check and the other seven digests are unchanged | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 4 | `question-bank/src/map-click-no-candidates-verify.test.ts` › `T-092 criterion 15: no new dependency, no manifest or lockfile change` › `every package.json, pyproject.toml and lockfile is byte-identical to 5d72ca5's, none added` | `cf63f66`, T-092: no dependency change | same as row 1 | modify | Same as row 3: only the `question-bank/package.json` digest is re-pinned (T-087 row 4 comment) | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 5 | `question-bank/src/hand-check-levels-verify.test.ts` › `T-025 criteria 14-17: no data, dependency or E-n moved; old tests unmodified` › `criterion 15: every package.json and lockfile is byte-identical to aa88101, and none was added` | `236b0e0`, T-025: no dependency change | same as row 1 | modify | Same name. `AT_AA88101["question-bank/package.json"]` becomes `8e276875…a3a3`, with a comment below the existing T-064 row 31 comment. Everything else is unchanged | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 6 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `T-096 criteria 17-21: the bank and the boundaries` › `criterion 20: every package.json, bun.lock, pyproject.toml and uv.lock is main's` | `47581ea`, T-096: no dependency change | same as row 1 | modify | Same name. The `deps` list must still equal `MAIN_DEP_FILES`. `MAIN_DEP_SHA` (the `fileRowsSha` over all of them) is re-pinned to the value computed on this branch, with a T-087 row 6 comment | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 7 | `question-bank/src/familiarity-drawn-apart-verify.test.ts` › `T-085a criteria 23-25: negative` › `criterion 23: no package.json, bun.lock, pyproject.toml or uv.lock changed since 5ae564a` | `b061fd8`, T-085a: no dependency change | same as row 1 | modify | Same name. `BEFORE_FILE_SHA["question-bank/package.json"]` becomes `8e276875…a3a3` (T-087 row 7 comment). Other entries are unchanged | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 8 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 21: no dependency is added or changed` › `every package.json, bun.lock, backend/pyproject.toml and backend/uv.lock is 12d242e's` | `950f334`, T-091: no dependency change | same as row 1 | modify | Same name and both `toContain` checks. `MAIN_DEPENDENCY_FILES_SHA` is re-pinned to the branch value (T-087 row 8 comment) | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 9 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 20: no non-test source file moves` › `every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's` | `950f334`, T-091: no source file outside T-091's own changes moves | T-087 criteria 6–7 change `refresh.ts` (the worker found this one) | modify | Same name and the three `toContain` checks. `MAIN_SOURCE_TREES_SHA` is re-pinned to the branch value, and a comment records that the only file that moved is `question-bank/src/refresh.ts` (sha `41de4902…2631`), under T-087 row 9 | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 10 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `T-096 criteria 17-21: the bank and the boundaries` › `criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added` | `47581ea`, T-096: the diff touches only T-096's files | T-087 changes or adds the 7 files in T-087's file set. Note: it was already red at `ca63b6e` from the brief and run log alone | modify | Same name. Add T-087's file set to `CRITERION_21_ALLOWED`. `rest.length` stays `297` and `MAIN_UNTOUCHABLE_SHA` stays as it is. If either no longer matches after the exemption, stop: that means T-087 touched a file it should not have | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 11 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › `every tracked non-test file outside the allowed list is 12d242e's, and none is added` | `950f334`, T-091: the diff touches only T-091's files | same as row 10 (expects 301, gets 303 at HEAD) | modify | Same name. Add T-087's file set to `CRITERION_22_ALLOWED`. `MAIN_UNTOUCHABLE_COUNT` and `MAIN_UNTOUCHABLE_SHA` stay as they are, with the same stop rule as row 10 | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 12 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › `pre-existing test files are main's, except ones in an approved Test change request` | `950f334`, T-091: no pre-existing test edited without approval | T-087 adds two new test files (Constraints), so the count goes 110 → 111 → 112. The worker missed this one | modify | Same name. Exclude T-087's two test files, alongside `T091_TEST_FILES`, and also the files rows 1–11 modify (they are now changed by approval). `MAIN_TESTS_COUNT` and `MAIN_TESTS_SHA` are recomputed over the remaining set, which must equal main's with those files excluded. A comment cites T-087 row 12 | approved — Dkaattae, 2026-10-30, in the attended tester session |

**Follow-on rows, raised 2026-10-30 by the attended tester while applying rows 1-12.** Rows 1-9 and 12 applied cleanly. Two things came up:

- **Rows 10 and 11 hit their own stop rule, but not because T-087 touched a wrong file.** Adding the four T-087 files that already exist on main (`question-bank/package.json`, `refresh.ts`, `README.md`, `conventions.md`) to an allowed list necessarily takes them out of the counted set, so "`rest.length` stays 297 / `MAIN_UNTOUCHABLE_COUNT` stays 301" cannot hold as written. **Evidence nothing else moved:** the same filters run on a checkout of main (`0a98e11`) and on this branch give identical results. Row 10: 293 files, `ceaf01f5…e62a`. Row 11: 297 files, `b6b89907…c739`. Row 12: 107 files, `bc91f541…291d`. `git diff --name-status origin/main..HEAD` lists exactly T-087's file set plus its two test files.
- **Two guards the request did not name went red** once the approved rows were applied:
  - `T-091 criterion 22 › each test in the approved Test change request is 8108a42's`. The "Not in the request" note expected it to stay green. But rows 2, 4, 6/10 and 7 modify four of the files it pins byte for byte.
  - `T-025 criterion 17`, which hashes 48 old test files together. Row 1 modified one of them, `highest-point-in-state-verify.test.ts`.

| # | Test (file › describe › name) | Introduced | Why stale | Action | Becomes | Decision |
|---|---|---|---|---|---|---|
| 10a | as row 10 | `47581ea`, T-096 | row 10 as written cannot hold (above) | modify | Row 10's exemption, plus `MAIN_UNTOUCHABLE_SHA` re-pinned to `ceaf01f5308835cf8ee2fa75aff2f6a4a8011ab085b0133706418c4ce212e62a`, the value main gives with the same exemption. The `297` expectation becomes `293`, with a comment saying the four files left the counted set and that main gives the same pair | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 11a | as row 11 | `950f334`, T-091 | row 11 as written cannot hold (above) | modify | Row 11's exemption, plus `MAIN_UNTOUCHABLE_COUNT` 301 → 297 and `MAIN_UNTOUCHABLE_SHA` → `b6b899079f1e4877d74d60bb6243662199b907691ce1c1a92e982c7d493ac739`, both equal to main's with the same exemption. Same comment | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 13 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › `each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only` | `bac230d`, T-091: each file in T-091's request holds exactly its approved re-pin | rows 2, 4, 6, 7 and 10 (T-087) change four of those files | modify | Same name and both checks. `APPLIED_REQUEST_FILE_SHAS` for `agriculture-true-wrong-answers-verify`, `map-click-no-candidates-verify`, `farm-animal-loose-ends-verify` and `familiarity-drawn-apart-verify` becomes each file's digest after T-087's approved rows. The other two entries and `MAIN_REQUEST_FILE_SHAS` are unchanged, so "differs from main" still holds. A comment cites T-087 row 13 | approved — Dkaattae, 2026-10-30, in the attended tester session |
| 14 | `question-bank/src/hand-check-levels-verify.test.ts` › `T-025 criteria 14-17: no data, dependency or E-n moved; old tests unmodified` › `criterion 17: every question-bank test file at aa88101 is present and unmodified` | `236b0e0`, T-025: no old test edited without approval | row 1 modifies `highest-point-in-state-verify.test.ts`, one of the 48 | modify | Same name, same 48-file list and length check. The digest is re-pinned to the value after T-087's approved rows, with a comment line `Re-pinned by T-087's approved rows 1-13 (this is row 14).` under the existing ones | approved — Dkaattae, 2026-10-30, in the attended tester session |

**Not in the request.** `T-091 criterion 22 › each test in the approved Test change request is 8108a42's` still passes, and rows 8, 9, 11 and 12 do not touch its files. If applying the rows turns it red, add a row for it rather than editing it.

**Observation, not a request.** Rows 10–12 count every tracked file, so each later task trips them, including on its own brief. The worker suggested a `tasks.md` entry for that. **Owner: reviewer.**

## Review

**TL;DR. Approved, inside the envelope.** The change is small, idiomatic and exactly what the brief asked for. The suite is green locally and in CI. Swept in this PR and marked ready; **Dkaattae merges.** One thing to know before merging: the criteria carry the orchestrator's `Approved:` stamp, so no person approved them by name.

**Checks**

- **PR open and draft**, built from `claude/hopeful-gates-wh4fep`, level with main `0a98e11`.
- **Every role has a commit:** expander `0d2072c`/`37daa9e`, worker `e982550`, tester `40f6c54`/`ed1fc30`/`8bf0959`/`7672370`, orchestrator `ca63b6e`/`22e7a12`/`0ce2398`/`de4148a`.
- **Lanes held.** The expander touched only `tasks/` and `tasks.md`. The tester touched only test files and the brief. Pre-existing tests changed only in `8bf0959` (tester), and they match rows 1-14 exactly.
- **Suite, this session:** question-bank `bun test` 2713 pass, 0 fail. `typecheck`, `lint` and `format:check` are clean. CI on `de4148a`: question-bank, backend, backend (postgres), frontend and integration all pass. e2e was still running when I checked.

**Findings: none block.**

- **Fits the codebase.** `printNextSteps(out)` follows `printSummary` / `printWarnings`: same `out` injection, same placement on the success path. Exporting the two command constants is the least that lets tests import them. The tester's tests deliberately use the brief's literal text instead.
- **No scope creep.** Nothing is chained. The `--help` text and `generatedBy` are untouched.
- **Docs are true.** The README paragraph, the `refresh.ts` header comment and `conventions.md` match the behaviour. `backend/README.md:52` and `engineering-decisions.md` still name `bun run ./src/write-questions.ts`. That command still works, and the brief keeps it out of scope.

**Flags disposed**

- **The reminder's wording (worker):** accepted as written. The numbering and the arrow comments make the order readable from either line.
- **`Approved:` is an orchestrator stamp (worker, tester):** not an envelope trigger (D-2: the stamp records that nobody checked). It is called out at the top of the PR body so the merger sees it. Dkaattae was present for the attended tester step, but approving test rows is not approving the criteria.
- **Queue entry for the drift-test failure messages (worker):** declined. The new README paragraph names both failing tests. Only the drift test's own message would add anything, and that is not worth a queue slot.
- **Whole-repo tracked-file pins trip every task (worker, tester):** already P-17. T-087 is a seventh instance: rows 10-14 existed only because of those pins. I did **not** add it to `process-tasks.md`. T-091's criterion 22 pins every tracked non-test file outside its allowed set, and `process-tasks.md` is not in that set, so the edit would turn the suite red. The PR body asks a person to add it by hand. This is the same thing T-091's and T-096's reviewers did.

**Queue changes (sweep)**

- **T-087:** deleted. Logged under "Completed tasks" in `PROGRESS.md`.
- **T-095 amended:** its sentence saying T-087 "regenerates" was untrue, and is corrected. It now owns the restore of T-070's four relaxed `extractedAt` tests if its option (a) makes the refresh regenerate `content.json`. That condition moved here from T-087's queue entry.
- **`tasks.md` §B intro and `PROGRESS.md` "Regenerating is by hand":** reworded. The refresh now prints the commands but does not run them.

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
