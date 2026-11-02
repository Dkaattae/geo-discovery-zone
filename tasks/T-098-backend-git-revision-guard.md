# T-098 — `backend/` has no guard against tests that resolve a git revision

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-098
**Branch:** `claude/vibrant-feynman-ap8itp`
**PR:** #NN, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-02 | `cse_011oDiJfdetw2zh1MqvpkWNK` |

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

## Verdict

## Notes
