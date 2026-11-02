# T-098 — `backend/` has no guard against tests that resolve a git revision — run log

**Task:** T-098 · **Branch:** `claude/vibrant-feynman-ap8itp` · **PR:** #118
**Started:** 2026-11-02 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-02
`Next step` on entry: (no brief) → on exit: `worker`

**TL;DR:** I wrote the T-098 brief, pushed it to `claude/vibrant-feynman-ap8itp` (head `b46358c`, same locally and on the remote), and opened draft PR #118. Status is `awaiting approval`, Next step is `worker`, Approved is `pending`. A human has to approve the brief before the worker can start.

- **Task picked:** T-098 adds a backend guard against tests that resolve a git revision. It is size S and the first task in `tasks.md` whose dependencies are done. `tasks/` held no live brief when I started, so there was nothing left over from the last cycle.
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-098-backend-git-revision-guard.md`. `Branch:` is `claude/vibrant-feynman-ap8itp` and `PR:` is #118.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/118, draft, with the criteria as its body.
- **Commits:** `T-098 expander: backend-git-revision-guard` and `T-098 expander: record PR #118 in the brief`. Together they change only `tasks/T-098-…md` and `tasks.md`, where T-098 is now `doing (brief awaiting approval …)`. No source, tests or config.
- **Full brief, not the light path:** it needs ten criteria, and the light path caps at four.

**Criteria in brief:**

| # | What it requires |
|---|---|
| 1 | The guard lives in `backend/tests/` and runs under `make -C backend test` and both backend CI jobs |
| 2 | It reads every tracked `.py` file under `backend/tests/` and `backend/integration/` |
| 3 | Nine named revision forms each trip it (list, tuple, shell string, `-C`, and so on) |
| 4 | `ls-files` and `status` calls pass, and the existing `test_t089…:240` call is not flagged |
| 5 | Comments and docstrings pass |
| 6 | No skip path, and zero files found counts as a failure |
| 7 | The backend check plus the frontend and question-bank suites stay green |
| 8 | No pre-existing test is changed |
| 9 | No dependency is added |
| 10 | No network |

**Flagged for the approver:**
- **Criterion 3 (b)** goes beyond the queue entry. It covers T-053's real shape (commit `ce1cf88`): a revision held in a variable `BASE`, with no `HEAD`. A scan for literal shas would miss it.
- **Criterion 6** goes beyond the entry too. T-053's tests escaped CI by skipping, so the guard may never skip.

**Risk named for the worker:** the frontend guard's `REPO_TEST_FILES` already reads backend `.py` test files, and its JS comment stripper does not remove Python `#` comments. So the new file must never place `engineering-decisions.md` in a `git` argv or a `<rev>:<path>` string. The brief covers this under Constraints and checks it through criterion 7.

**Not done:** I ran no build or tests, as the role requires (D-7).

## Round 2 — worker — 2026-11-02
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** I added the T-098 guard as one new file. It is pushed to `claude/vibrant-feynman-ap8itp`; `git log origin/claude/vibrant-feynman-ap8itp -1` shows my commit 0b720ca. `make -C backend check` passes (907 passed, 9 skipped). `cd question-bank && bun test` has 4 failures, so criterion 7 is not met until the tester raises a Test change request for those four tests. Status is `awaiting verification`; next step is `tester`.

**Files**
- `/home/user/geo-discovery-zone/backend/tests/test_git_revision_guard.py` is new. It uses only the standard library and holds 28 tests.
- `/home/user/geo-discovery-zone/tasks/T-098-backend-git-revision-guard.md` has the Handoff and Notes filled in, my Sessions row added, and Status / Next step updated.

**How the guard works**
- **Reads code, not comments:** it parses each file with Python's `ast`, so `#` comments and docstrings are never treated as `git` commands (criterion 5).
- **What it checks:** list or tuple literals that start with `"git"`, and `subprocess` calls given a command string or f-string.
- **Allowlist:** only `ls-files`, `status` and `check-ignore` are allowed. Every other subcommand is refused, which is how it catches the `BASE`-in-a-variable form (3 b).
- **Options before the subcommand:** `-C <dir>`, `-c` and similar are skipped, so a `diff` behind `-C` is still refused (3 i).
- **Arguments:** arguments to an allowed subcommand are also refused if they look like a revision, or are `--with-tree`.
- **Which files:** tracked plus untracked `.py` files under `backend/tests/` and `backend/integration/`. The tester does not need to `git add` a mutation.
- **No skips:** there is no skip path. It fails if `git ls-files` fails or if either directory has no files.
- **Checked by hand:** a 3 (b) mutation placed in each directory made the guard fail and name that file.
- **Frontend guard:** `git-baseline-guard.criteria.test.ts` still passes, 15 of 15.

**The 4 question-bank failures, all under "Tests made stale" in the Handoff**
- **Already failing before my change:** two tests count every tracked non-test file, and the expander's `tasks/` brief and the orchestrator's `runs/` log push the count from 290 to 292:
  - "T-091 criterion 22 … every tracked non-test file …" in `climate-cold-trade-accepted-verify.test.ts`
  - "T-096 … criterion 21" in `farm-animal-loose-ends-verify.test.ts`
- **Broken by the new file:**
  - "T-087 criterion 15" in `refresh-regenerate-reminder-verify.test.ts` pins every file under `backend/`, `frontend/` and `e2e/`. Its `MAIN_BOUNDARY_SHA` needs re-pinning.
  - "T-091 criterion 22 … pre-existing test files are main's" in `climate-cold-trade-accepted-verify.test.ts`. `MAIN_TESTS_COUNT` goes from 113 to 114, and its sha needs re-pinning.
- **The brief contradicts itself here:** criterion 1 requires a new backend file, while criteria 7 and 8 together forbid both the failure and the edit that would fix it. The tester should raise the Test change request; if a human treats this as a criterion defect instead, it goes to `task-expander`.

**Frontend failures caused by this container, not by the change**
- **Packages missing:** `react-simple-maps` and others could not be installed (the proxy returned 403), so three component test files fail to import.
- **Lint gate:** `src/lint-gate.test.ts` times out at 5s here and passes 8 of 8 with `--timeout 60000`.
- **Not mine:** the same failures appear with my file removed.

**Decisions for someone to confirm**
- **`check-ignore` is allowed**, matching the frontend guard. Criterion 10 lists only `ls-files` and `status`, but it governs what the guard itself runs, and the guard runs only `ls-files`. The reviewer should confirm this or drop `check-ignore`.
- **Same session id:** my Sessions row shows the same id as the expander's, because that is what `$CLAUDE_CODE_REMOTE_SESSION_ID` returned in this run. The tester has to run in a different session.
