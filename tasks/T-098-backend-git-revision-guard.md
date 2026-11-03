# T-098 — `backend/` has no guard against tests that resolve a git revision

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** orchestrator — 2026-11-02, unattended run. See `runs/T-098-backend-git-revision-guard.md`.
**Test changes:** `approved — the person in the attended tester session, 2026-11-03 ("approve all five rows")`
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
| tester | 2026-11-02 | `cse_011oDiJfdetw2zh1MqvpkWNK` (orchestrated: shared id, fresh subagent; see Verdict) |
| tester (attended) | 2026-11-03 | `cse_011oDiJfdetw2zh1MqvpkWNK` (the orchestrator's own session, resumed by the person; see Verdict) |

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

### Final verdict — attended tester, 2026-11-03: **pass**

**TL;DR:** **Pass.** All five Test change request rows were approved by the
person in this session and applied in `d30bf88`. Every suite this task can
affect is green: backend 907 passed / 9 skipped, question-bank 2713 pass / 0
fail. The only red is frontend packages this container cannot download, the
same as before the task. **Next step: reviewer.**

**The approval, quoted.** In this session the person wrote "approve all five
rows", then "run the tester step for T-098". Header: `Test changes: approved —
the person in the attended tester session, 2026-11-03 ("approve all five rows")`.
No name was given, so none is recorded.

**Independence: weaker than usual, read this.** This attended step ran in the
**orchestrator's own session**, resumed by the person. That session had read the
worker's and the first tester's reports. It was not a cold session. What it did
here was mechanical: apply the five approved rows exactly as the request worded
them and re-run the suites. It did not re-judge criteria 1-6 or 8-10. Those
verdicts stand on the first tester's mutation runs below, which were made by a
freshly spawned subagent. The reviewer should weigh this pass accordingly.

**Rows applied (exactly as approved, nothing else):**

| Row | File | Change |
|---|---|---|
| 1 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` | T-098 brief and run log added to `CRITERION_22_ALLOWED`; count 290 and digest unchanged |
| 2 | same | `MAIN_TESTS_COUNT` 113 → 114, `MAIN_TESTS_SHA` → `1ea43d08…6bcb51` |
| 3 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` | the same two paths added to `CRITERION_21_ALLOWED`; count 286 and digest unchanged |
| 4 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` | `MAIN_BOUNDARY_SHA` → `1ea8c50d…7676af` |
| 5 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` | farm-animal entry of `APPLIED_REQUEST_FILE_SHAS` → `4998b4cb…27981c`, the file's sha256 after row 3 |

The rows still held on the branch before I applied them: the same four tests
were red (2709 pass / 4 fail). After rows 1-4, only row 5's test was red
(2712 / 1), as the request predicted. After row 5: 2713 / 0. Every comment cites
T-098 and its row.

**Suites after `d30bf88`:**

| Check | Result |
|---|---|
| `make -C backend check` | ruff clean, **907 passed, 9 skipped** |
| question-bank `typecheck` / `lint` / `format:check` / `bun test` | clean / 0 warnings / clean / **2713 pass, 0 fail** |
| frontend `bun run lint` | exit 0 |
| frontend `src/lint-gate.test.ts --timeout 60000` | 8 pass |
| frontend `bun test` | 392 pass, 4 fail: three `components/` files cannot import `react-simple-maps`, plus the lint-gate 5 s timeout |
| frontend `typecheck` | 3 errors, all `Cannot find module 'react-simple-maps'` / `us-atlas/states-10m.json` |

**Frontend reds are the environment.** `bun install --frozen-lockfile` fails
with `ProxyConnectFailed (403)` on tarball downloads, so `react-simple-maps` and
`us-atlas` are absent from `node_modules`. T-098 touches no frontend file. CI,
which can install, is the check that counts here.

**Carried forward for the reviewer:** the untracked-file reach has no test of
its own (coverage gap, below), and whether to keep `check-ignore` in the
allowlist.

### First verdict — orchestrated tester, 2026-11-02 (halted on the request)

**TL;DR:** **Halted: test changes requested.** The guard does its job. Criteria
1-6 and 8-10 hold, and I confirmed each by mutation. Criterion 7 is red only
because of question-bank whole-tree pins that T-098's own new files make stale.
That needs the five-row Test change request below. Nobody could approve it in
this orchestrated run, so **Next step: human**. A person has to start an attended
`tester` session to approve the rows. That session applies them and finishes the
verdict.

**Independence:** this run is orchestrated (`runs/T-098-…md` exists).
`$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJfdetw2zh1MqvpkWNK`, the same id the
expander and worker rows show, so the session check proves nothing here. My
independence rests only on being a freshly spawned subagent with its own context.
I did not see the worker's conversation or reasoning. That is weaker evidence than
a separate session, because it depends on the orchestrator having spawned me
correctly.

**How I verified:** the deliverable is a test, so I verified it with coverage and
mutation (tester.md), not with more tests. I committed no test file. A new
`backend/tests/` file would also trip the same pins again. Every mutation was
reverted, and `git status` was clean after each batch.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `make -C backend check`: ruff clean, **907 passed, 9 skipped**. The guard is in `backend/tests/`, collected by `testpaths`. Under `make -C backend test`, a planted offender made **1 failed, 906 passed** (rc 2). |
| 2 | met | Plants in both `backend/tests/` and `backend/integration/` were caught. Untracked plants were caught, and so was a `git add`ed plant (form b, integration, via `make`). Temporarily appending `["git", "rev-parse", "HEAD"]` to each `conftest.py` turned the guard red, naming `backend/tests/conftest.py:201` and `backend/integration/conftest.py:201`. |
| 3 | met | I planted each of forms (a)-(i), verbatim as in the criterion inside a `test_x` body (b with module-level `BASE = "e2e6495"`, i with `REPO`), as untracked `test_zz_tester_mutation.py` in **each** directory. All 18 runs were red, and the failure message named the file each time. |
| 4 | met | One planted file holding all four working-tree forms: green in both directories. `test_t089_tester_criteria.py:240` is unchanged and the real scan passes. |
| 5 | met | A planted file with forms in a module docstring, a function docstring, `#` lines and a trailing `#` comment: green in both directories. The four named files are byte-identical to main and pass. |
| 6 | met | No `skip`/`skipif`/`xfail`/`importorskip` in the file (grep). Mutations: a scope with no files gave 1 red; `ls-files` with a bad flag gave 2 red; `ls-files` run outside a repo (`cwd="/"`) gave 2 red. Each failed and none skipped. |
| 7 | **not met: stale pins** | backend green. `cd frontend && bun test`: `git-baseline-guard.criteria.test.ts` passes 15/15 with the new file tracked. The 6 frontend reds are environment reds, below. `cd question-bank && bun test`: **2709 pass, 4 fail**, all whole-tree pins (rows 1-4). |
| 8 | met | `git diff --name-status 9cac751..HEAD`: one `A` under the four trees (the guard). No other file changed. |
| 9 | met | `pyproject.toml` and `uv.lock` are unchanged. Imports: `ast`, `re`, `shlex`, `subprocess`, `pathlib`, `pytest`. |
| 10 | met | The file's only `subprocess.run` is `["git", "ls-files", "-z", …]` with an exit-code assert. Mutated to a bad flag or a non-repo cwd, it fails. |

**Guard-logic mutations** (`backend/tests/test_git_revision_guard.py`, each
reverted):

| Mutation | Result |
|---|---|
| Drop `ast.Tuple` from invocation detection | 1 red (g-tuple) |
| No global-option skipping (`at += 1`) | 1 red (i) |
| An unreadable subcommand is allowed | 1 red |
| Shell-string invocations are ignored | 4 red |
| Add `diff` to `ALLOWED_SUBCOMMANDS` | 1 red. Most diff samples are still caught by `looks_like_revision`. That is defence in depth, not a gap. |
| Untracked files not read (`untracked = []`) | **0 red** |

**Coverage gap, not a failure:** the untracked-file reach has no test of its own.
Criterion 2 accepts it as behaviour, and I confirmed the behaviour with untracked
plants (criterion 3 runs). Nothing pins it, so a later refactor could drop it
silently.

**Environment reds (frontend):**
- `react-simple-maps` is not installed: it is absent from `node_modules`, though
  `package.json` lists it. Three `components/` files fail to import.
- `src/lint-gate.test.ts` hits the 5 s timeout. It passes **8/8** with
  `--timeout 60000`.

None of these touch backend files.

**Stale tests confirmed by probe.** I made untracked copies of the three files
with logging added, ran them, then deleted the copies:
- Excluding `tasks/T-098-…md` and `runs/T-098-…md` restores T-091's 290 /
  `d7ac83e…` and T-096's 286 / its digest exactly.
- Dropping `backend/tests/test_git_revision_guard.py` restores T-091's 113 /
  `MAIN_TESTS_SHA` and T-087's `MAIN_BOUNDARY_SHA` exactly.
- So T-098's three files are the only cause. The worker's list was right, and I
  added row 5, the cascade from row 3.

**`check-ignore` in the allowlist:** criterion 4 is satisfied either way.
Criterion 10 governs what the guard runs, and it runs only `ls-files`. I leave
the call to the reviewer, as the Handoff asks.

## Test change request

T-098's own new files make these stale. Criterion 1 requires a new file under
`backend/tests/`, and every task adds its brief and run log. No row weakens a
pin. Rows 1 and 3 follow the T-039/T-045/T-053 precedent of joining a task's loop
records to the allowed set, with count and digest unchanged. Rows 2 and 4 re-pin
to digests that include the new file. Row 5 is the cascade T-053's row 33 also
needed. Paths are relative to `question-bank/`.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091 tester: no non-test file outside T-091's allowed set changes or appears | T-098's brief and run log are new tracked non-test files (292 ≠ 290) | modify | Same name. Add `tasks/T-098-backend-git-revision-guard.md` and `runs/T-098-backend-git-revision-guard.md` to `CRITERION_22_ALLOWED`, with a comment citing T-098 row 1. `MAIN_UNTOUCHABLE_COUNT` stays **290** and `MAIN_UNTOUCHABLE_SHA` stays `d7ac83e44b9ef704b9920906c80fd90ebe7ce12d0ed0381595d71ff954ff5381` (verified) || approved |
| 2 | same file › same describe › "pre-existing test files are main's, except ones in an approved Test change request" | `950f334`, T-091 tester: no test file is added, removed or modified outside named exceptions | Criterion 1 adds `backend/tests/test_git_revision_guard.py` (114 ≠ 113) | modify | Same name and filter. `MAIN_TESTS_COUNT` **113 → 114**, `MAIN_TESTS_SHA` → `1ea43d084611aa52c68664791325369bba9a5dc452800ae6410357d28c6bcb51`, comment "Re-pinned by T-098 (Test change request row 2): T-098 added backend/tests/test_git_revision_guard.py (113 -> 114)". Without the guard file the set is byte-identical to the old pin (verified) || approved |
| 3 | `src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21: the bank and the boundaries" › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096 tester: no non-test file outside T-096's allowed set changes or appears | Same as row 1 (288 ≠ 286) | modify | Same name. Add the same two T-098 paths to `CRITERION_21_ALLOWED`, with a comment citing T-098 row 3. Count stays **286** and `MAIN_UNTOUCHABLE_SHA` stays `6e9754b8…bdaff78` (verified) || approved |
| 4 | `src/refresh-regenerate-reminder-verify.test.ts` › "T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes" › "every tracked file under the three trees is as re-pinned by T-039, none added or removed" | `40f6c54`, T-087 tester (last re-pinned `bcb2a38`, T-039, then T-045, T-053): every file under the three trees is pinned | Criterion 1 adds a file under `backend/` | modify | Same name and file set. `MAIN_BOUNDARY_SHA` → `1ea8c50dc0edf32de32320fb7550cdef8209ca83e8c78eadf4b7abd3937676af`, comment "Re-pinned by T-098 (Test change request row 4): T-098 added backend/tests/test_git_revision_guard.py". Without that file the tree equals the old pin (verified) || approved |
| 5 | `src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | `950f334`, T-091 tester: the files in its request hold exactly their approved re-pins | Green today. Row 3 changes `farm-animal-loose-ends-verify.test.ts`, whose digest is pinned in `APPLIED_REQUEST_FILE_SHAS` | modify (only if row 3 is approved) | Same name. Re-pin the `farm-animal-loose-ends-verify.test.ts` entry of `APPLIED_REQUEST_FILE_SHAS` to that file's sha256 after row 3 is applied, and extend its comment to "…then by T-053 (row 33), then by T-098 (row 5)". Every other entry is unchanged || approved |

**To approve:** start the `tester` step for T-098 in a session you are attending,
and approve or refuse each row there. That tester applies the approved rows as
`T-098 tester: apply approved test change request`. It then re-runs all three
suites and writes the final verdict.

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
