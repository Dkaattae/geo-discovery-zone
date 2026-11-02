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
