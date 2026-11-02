# T-098 — `backend/` has no guard against tests that resolve a git revision

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** orchestrator — 2026-11-02, unattended run. See `runs/T-098-backend-git-revision-guard.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-098
**Branch:** `claude/vibrant-feynman-ap8itp`
**PR:** #118, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-02 | `cse_011oDiJfdetw2zh1MqvpkWNK` |
| worker | 2026-11-02 | `cse_011oDiJfdetw2zh1MqvpkWNK` |

**Not on the light path.** T-098 is sized S, but it needs more than four criteria
(`process.md`, "The light path"): which forms must trip the guard, which must
not, whether comments count, how far it reaches, and that it cannot skip. So this
is a full brief.

## For the approver — read this first

**TL;DR:** Add one backend test that fails when a test under `backend/tests/`
or `backend/integration/` hands `git` a revision. Nothing is built yet. Two
things go beyond the queue entry. Strike them before approving if you don't want them:

- **Criterion 3 (b) covers the exact T-053 shape, which is a revision held in a
  variable** (`BASE`), with no `HEAD` beside it. A scan that only matches literal
  shas or `HEAD` would miss the incident this task exists for. In practice
  this pushes the worker toward an allowlist of subcommands, the way the
  frontend guard works, or toward question-bank's "`diff` takes no positional
  argument before `--`" rule.
- **Criterion 6: the guard may never skip.** T-053's tests escaped CI by
  `pytest.skip`-ing in a shallow clone. That is the failure this guard must not
  repeat.

## Goal

The frontend and question-bank suites refuse tests that resolve a fixed git
revision (E-11, E-12). These tests fail in CI's shallow clone and go red on `main`
after the next merge. `backend/` has no such guard, and that is how T-053's tester
wrote six of them (commit `ce1cf88` deleted them). This task closes that gap.

## Acceptance criteria

"The guard" below means the test or tests this task adds. A **revision form**
is any of the nine `git` invocations listed in criterion 3. "In code" means
somewhere other than a `#` comment or a docstring.

1. **It runs in the unit suite.** The guard lives under `backend/tests/`, so
   `make -C backend test` collects it. So do CI's `backend (lint, format, test)`
   and `backend (postgres)` jobs. It passes on the tree as the worker commits
   it.
2. **It reads both directories.** It checks every git-tracked `.py` file under
   `backend/tests/` and `backend/integration/`, both `conftest.py` files
   included. It also checks files a test author has added and not yet committed,
   **or** the worker states in the Handoff that it reads only tracked files, so
   the tester knows to `git add` a mutation before running it.
3. **Every revision form trips it.** Put any one of these in code in a file under
   either directory, and `make -C backend test` fails with a message that
   names that file:
   - (a) `["git", "diff", "--name-only", "e2e6495", "HEAD", "--", "backend/"]`
   - (b) `["git", "diff", "--name-only", BASE, "--", "backend/"]`, with
     `BASE = "e2e6495"` defined at module level (T-053's shape, minus `HEAD`)
   - (c) `["git", "show", "aa88101:backend/app/data/content.json"]`
   - (d) `["git", "log", "origin/main..HEAD"]`
   - (e) `["git", "merge-base", "HEAD", "origin/main"]`
   - (f) `["git", "rev-parse", "HEAD"]`
   - (g) `("git", "diff", "abc1234", "HEAD")`, a tuple rather than a list
   - (h) `subprocess.run("git diff abc1234 HEAD", shell=True, check=True)`, a
     single command string
   - (i) `["git", "-C", str(REPO), "diff", "e2e6495", "HEAD"]`, with a global
     option before the subcommand
4. **Working-tree reads do not trip it.** With each of these in code, the guard
   passes:
   - `["git", "ls-files", "-z"]`
   - `["git", "ls-files", "-z", "--", "backend/"]`
   - `["git", "status", "--porcelain"]`
   - `["git", "status", "--porcelain", "--", "backend/"]`

   The existing call at `backend/tests/test_t089_tester_criteria.py:240` stays
   as it is and is not flagged.
5. **Prose does not trip it.** A revision form inside a `#` comment or a
   docstring does not make the guard fail. Today's tree already has prose like
   this, and the guard must pass with all of it left unchanged:
   `test_t040_tester_criteria.py:551`, `test_t051_tester_criteria.py:39`,
   `test_t053_tester_criteria.py:14` and `test_t045_tester_criteria.py:5`.
6. **It never skips and is never vacuous.** The guard has no `skip`, `skipif`,
   `xfail` or `importorskip` path. It fails, and does not pass or skip, when
   listing files fails or when it finds zero files under either
   `backend/tests/` or `backend/integration/`.
7. **The rest of the repo stays green.** All of these pass:
   - `make -C backend check` (ruff lint, ruff format-check, the whole unit suite)
   - `cd frontend && bun test`
   - `cd question-bank && bun test`

   The frontend guard reads every backend test file, including the new one, so
   this criterion is load-bearing: `git-baseline-guard.criteria.test.ts`'s
   `REPO_TEST_FILES` and its "T-073 criterion 5" describe.
8. **No pre-existing test is modified or deleted.** Every file that existed under
   `backend/tests/`, `backend/integration/`, `frontend/src/` and
   `question-bank/src/` before this task is byte-identical afterwards.
9. **No new dependency.** `backend/pyproject.toml` and `backend/uv.lock` are
   unchanged. The guard uses only the Python standard library and what is
   already locked.
10. **No network.** The guard reads local files only. If it runs `git` at all,
    it runs only a working-tree subcommand (`ls-files` or `status`), and fails
    on a non-zero exit.

## Out of scope

- **Fail-closed checks on `git` exit codes** in backend tests, the frontend
  guard's "T-073 criterion 4" shape. This task forbids revisions. It does not
  police how a working-tree call handles failure. A follow-up can add that.
- **`git -C <dir> ls-files`, and other global options before an allowed
  subcommand.** Criterion 3 (i) says a revision behind `-C` must trip the guard.
  Whether `-C` in front of an allowed subcommand passes is left to the worker.
  Nothing in the tree uses it today.
- **Indirection that is invisible in source**: commands assembled at runtime
  (`"gi" + "t"`), argv lists built by appending, `os.system`, and shell
  libraries other than `subprocess`. Only literal lists, tuples, and a command
  string passed to `subprocess` are in scope.
- **Code outside the two test directories**: `backend/app/`, `backend/scripts/`
  and `backend/migrations/`.
- **`e2e/`**, which has no `git` calls today and no guard.
- **The frontend and question-bank guards.** Do not change them.
- **`.github/workflows/ci.yml`**, including `fetch-depth`. That is loop and CI
  work, a `P-n` ticket, not this task.
- **A new `engineering-decisions.md` entry, or edits to `test-guidelines.md` /
  `conventions.md`.** The criteria don't ask for them, so leave them out.

## Constraints

- **Files expected to change:** one new test file under `backend/tests/`. The
  name is the worker's choice. Nothing else in source, tests or config.
- **Mutation fixtures inside the guard must not trip it.** If the guard's own
  file holds sample revision forms (mutation snippets), it must not flag them,
  and it must not exclude itself to get there. The frontend guard shows how:
  keep them in comments or strings it does not treat as invocations, or assemble
  `git` from parts (`question-bank/src/git-exit-guard.criteria.test.ts`, `G`).
- **The frontend guard reads Python as JavaScript.** Its `codeOf` strips only
  `//` and `/* */` comments, so a Python `#` comment stays in the text its
  scans read. No line in the new file may hand `engineering-decisions.md` to a
  `git` argv literal, and none may contain `<rev>:engineering-decisions.md`.
  Either one trips "T-073 criterion 5" in `frontend/`.
- **Must work in CI's shallow clone** (`actions/checkout@v5`, no `fetch-depth`).
  `git ls-files` works there. Anything that needs history does not.
- **Python standard library only.** `ast`, `subprocess`, `pathlib` and the like
  are fine. Ask before adding any dependency (`CLAUDE.md`, "Packages").
- **Ruff clean**, at `backend/pyproject.toml`'s line length of 100.

## Context

Required reading for the worker and the tester.

- **The queue entry:** [`tasks.md`](../tasks.md) T-098, §A.
- **Why fixed revisions are banned:**
  [`engineering-decisions.md`](../engineering-decisions.md) E-11 (deleted
  rather than repaired, and why CI's shallow clone hid them) and E-12 (the
  fourth instance, and why re-pinning is rejected).
- **The two existing guards to mirror:**
  - `frontend/src/git-baseline-guard.criteria.test.ts`: `WORKING_TREE_SUBCOMMANDS`,
    `looksLikeRevision`, and comment blanking in `codeOf`. Its
    `REPO_TEST_FILES` already includes `backend/tests/*.py` (see Constraints).
  - `question-bank/src/git-exit-guard.criteria.test.ts`: `ALLOWED_SUBCOMMANDS`,
    the "`diff` takes no positional argument before `--`" rule, and `G` for
    snippets that must not read as invocations.
- **The incident:** commit `ce1cf88` (`git show ce1cf88`). It deleted six tests
  from `backend/tests/test_t053_tester_criteria.py`, all shaped
  `["git", "diff", "--name-only", BASE, "HEAD", "--", *paths]` with a
  `pytest.skip` fallback. Criterion 3 (b) and criterion 6 come from that commit.
  See also [`PROGRESS.md`](../PROGRESS.md), the T-053 entry.
- **The one `git` call that must survive:**
  `backend/tests/test_t089_tester_criteria.py:240`.
- **Collection and CI:** `backend/pyproject.toml` `[tool.pytest.ini_options]`
  (`testpaths = ["tests"]`, which is why the guard cannot live in
  `integration/`), `backend/Makefile` (`test`, `check`), and
  `.github/workflows/ci.yml`'s two backend jobs.
- **Test rules:** [`test-guidelines.md`](../test-guidelines.md). No network.

## Handoff

**TL;DR:** One new file, `backend/tests/test_git_revision_guard.py`. `make -C
backend check` is green (907 passed, 9 skipped). `question-bank` has **4 reds**:
two were already red on this branch before I started, and two are boundary pins
that adding *any* backend file breaks. All four are listed under **Tests made
stale**. The tester needs a Test change request for them. Until then, criterion 7
cannot be green as written.

**Sessions note:** the worker session id matches the expander's
(`cse_011oDiJfdetw2zh1MqvpkWNK`). That is what `$CLAUDE_CODE_REMOTE_SESSION_ID`
returns in this orchestrated run. The tester must run in a different session.

### What changed

- **Added** `backend/tests/test_git_revision_guard.py` (stdlib only: `ast`, `re`,
  `shlex`, `subprocess`, `pathlib`, plus `pytest`).
- **Changed** nothing else in source, tests or config. This brief is the only
  other file touched.

### How it works

- **Parses each file with `ast`.** `#` comments are never in the tree. Docstrings
  and other strings are `Constant` nodes, and the guard never treats those as
  invocations. That is how criterion 5 holds, and it is why the guard's own
  sample snippets (kept as strings) do not trip it, without excluding itself.
- **What counts as an invocation:**
  - a `list` or `tuple` literal whose first element is `"git"`;
  - a call to a `subprocess` function whose command is a string or f-string. This
    covers `subprocess.x`, `import subprocess as sp`, and
    `from subprocess import run [as r]`. The string is split with `shlex`, and
    every `git` at its start or after `&&`, `||`, `;` or `|` is checked.
- **Allowlist:** `ALLOWED_SUBCOMMANDS = {ls-files, status, check-ignore}`. Every
  other subcommand is refused outright, and so is a subcommand the guard cannot
  read. That is what catches criterion 3 (b), `BASE` in a variable.
- **Global options before the subcommand are skipped.** `-C`, `-c`, `--git-dir`
  and the like take a value; flags such as `--no-pager` do not. So 3 (i) is read
  as `diff` and refused.
- **Arguments to an allowed subcommand** are refused if they look like a revision
  (`looks_like_revision`: `HEAD…`, `origin/`, `@{`, `a..b`, a 7-40 hex word,
  `<rev>:<path>`) or are `--with-tree`. Pathspec magic that starts with `:`
  passes.
- **Module-level names** bound to a single string constant are resolved, so
  `["git", SUB, ...]` with `SUB = "status"` passes.

### Criteria → where each one lives

| # | Where / how |
|---|---|
| 1 | `backend/tests/test_git_revision_guard.py`, collected by `testpaths = ["tests"]`. `make -C backend check` → 907 passed, 9 skipped. |
| 2 | `scanned_files()` runs `git ls-files -z -- backend/tests backend/integration` plus `--others --exclude-standard`. **It reads untracked files too**, so the tester does not need to `git add` a mutation. `test_the_scan_reaches_both_directories_so_it_cannot_pass_vacuously` asserts both `conftest.py` files are scanned. |
| 3 | `test_no_backend_test_hands_git_a_revision` prints `path:line: git … (why)`. Each of (a)–(i) is also a sample in `REVISION_FORMS`. By hand, I put 3 (b) in an untracked `test_zz_mutation.py` in each directory; both failed and named the file. |
| 4 | Allowlist. The four forms are samples in `WORKING_TREE_READS`, and `test_t089_tester_criteria.py:240` passes the real scan. |
| 5 | `ast` (see above). The four named files pass the real scan unchanged. Samples are in `PROSE`. |
| 6 | No `skip`/`skipif`/`xfail`/`importorskip` in the file. `_list_files` asserts `returncode == 0`. The reach test fails when either scope has no `.py`. |
| 7 | backend: green. frontend: `git-baseline-guard.criteria.test.ts` passes (15/15) with the new file tracked. **question-bank: 4 reds, see below.** |
| 8 | No pre-existing file under the four trees was modified. |
| 9 | `pyproject.toml` and `uv.lock` are unchanged. |
| 10 | The only spawn is `git ls-files`, and a non-zero exit fails the test. |

### Deliberately not done

- **`check-ignore` is allowed.** The frontend guard allows it too. It is a
  working-tree subcommand, but criterion 10 names only `ls-files`/`status`, and
  that criterion governs what *the guard* runs, not what it permits. The guard
  itself runs only `ls-files`. **Owner:** reviewer to confirm, or drop
  `check-ignore` from the set.
- **`-C <dir>` in front of an allowed subcommand passes.** The brief leaves this
  to the worker (Out of scope).
- **Commands built at runtime, argv built by appending, and `os.system`** are out
  of scope per the brief and are not handled.

### How to run

```bash
make -C backend check
cd backend && uv run pytest -q tests/test_git_revision_guard.py   # 28 tests
cd question-bank && bun test
cd frontend && bun test
```

### Environment reds (not caused by this change)

- **frontend:** `react-simple-maps` and other packages could not be installed.
  `bun install` got proxy 403s on tarballs, so three `components/` test files
  fail to import.
- **frontend:** `src/lint-gate.test.ts` hits its 5s timeout in this container.
  It passes 8/8 with `--timeout 60000`.
- **Unaffected by my file:** the frontend reds look the same with my file
  removed.

### Tests made stale

All four are in `question-bank/`. They are pinned whole-tree boundary checks
from earlier tasks.

**Already red on this branch before my change.** They count the expander's
`tasks/T-098-…md` and the orchestrator's `runs/T-098-…md` (290 → 292):

- **`src/climate-cold-trade-accepted-verify.test.ts`**, test "T-091 criterion
  22: the diff touches only the allowed files > every tracked non-test file
  outside the allowed list is 12d242e's, and none is added".
  - Floor: `MAIN_UNTOUCHABLE_COUNT = 290`, received 292.
  - Proposal: re-pin the count and `MAIN_UNTOUCHABLE_SHA`, or exclude
    `tasks/`/`runs/`.
- **`src/farm-animal-loose-ends-verify.test.ts`**, test "T-096 criteria 17-21:
  the bank and the boundaries > criterion 21: outside the allowed files and test
  files, every tracked file is main's, and none is added".
  - Floor: `286`.
  - Same cause and same proposal.

**Made stale by this task's new file.** Criterion 1 requires a new file under
`backend/tests/`:

- **`src/refresh-regenerate-reminder-verify.test.ts`**, test "T-087 criterion
  15: nothing under backend/, frontend/ or e2e/ changes > every tracked file
  under the three trees is as re-pinned by T-039, none added or removed".
  - Proposal: re-pin `MAIN_BOUNDARY_SHA` to include
    `backend/tests/test_git_revision_guard.py`.
- **`src/climate-cold-trade-accepted-verify.test.ts`**, test "T-091 criterion
  22: the diff touches only the allowed files > pre-existing test files are
  main's, except ones in an approved Test change request".
  - Floor: `MAIN_TESTS_COUNT = 113`, which would need to be **114**, with
    `MAIN_TESTS_SHA` re-pinned.

**This contradicts the brief.** Criterion 7 asks for `cd question-bank && bun
test` to pass. Criterion 8 forbids modifying any pre-existing test under
`question-bank/src/`. Criterion 1 requires a new backend file, which the T-087
and T-091 pins forbid. So 1, 7 and 8 cannot all hold without a Test change
request. **Owner:** the tester raises the Test change request (D-14) for the four
tests above. If a human prefers to treat it as a criterion defect, it goes to
`task-expander`.

## Verdict

## Notes

- **An allowlist rather than revision patterns.** This settles criterion 3 (b)
  cleanly, and the question-bank guard does the same. The revision patterns stay
  only as a second check on allowed subcommands (`ls-files --with-tree=HEAD`).
- **`ast` over a hand lexer.** Python ships its own parser, so comments and
  docstrings come out for free. That is simpler and more exact than the
  frontend's `codeOf`.
- **The brief did not foresee the boundary pins.** Its Constraints say "one new
  test file … nothing else", but question-bank holds four whole-tree pins that
  any new tracked file breaks. Two of them were already red from the brief and
  run-log files themselves. That is the pattern of earlier tasks (the "row N:
  was M" comments), not a defect of this one, but criterion 7 should have
  mentioned it.
- **The file contains no `engineering-decisions` file name** (the frontend
  T-073 criterion 5 constraint).
