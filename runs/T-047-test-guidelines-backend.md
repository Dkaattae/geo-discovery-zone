# T-047 — `test-guidelines.md`'s `api/` section is still marked "does not exist yet" — run log

**Task:** T-047 · **Branch:** `task/T-047-test-guidelines-backend` · **PR:** #127
**Started:** 2026-11-06 · **Outcome:** ready for merge

## Round 1 — task-expander — 2026-11-06
`Next step` on entry: `(none — no brief)` → on exit: `worker`

**I expanded T-047 into a brief, pushed it, and opened draft PR #127. It is awaiting approval and the worker is next.** The task makes the backend section of `test-guidelines.md` describe the real `backend/tests/` suite, and fixes the dead-proxy reproduction block so it works on a fresh checkout. It changes docs only.

- **Branch:** `task/T-047-test-guidelines-backend`, created from `origin/main` at `a7945cf`. The push landed: the remote head matches my local head, `fe1276f`.
- **PR:** #127 (https://github.com/Dkaattae/geo-discovery-zone/pull/127), draft. The body is the acceptance criteria plus a TL;DR.
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-047-test-guidelines-backend.md`. Status `awaiting approval`, Next step `worker`, Approved `pending`, PR `#127`, and my row is in the Sessions table.
- **Diff against `main`:** only the brief, in two commits (`T-047 expander: test-guidelines-backend` and `T-047 expander: record PR #127 in the brief`). I made no edits to `tasks.md` or `PROGRESS.md`, because `tasks/` on `main` held no brief to sweep.

**Why T-047, in queue order:**

| Task | Picked? | Why |
|---|---|---|
| T-085b | skipped | Blocked until a person picks a Census source; `*.census.gov` is refused by the proxy |
| T-056 | skipped | Needs a design decision |
| T-095 | skipped | Its entry says it needs a person's call before it is expanded |
| T-102 | skipped | In flight (PR #126) |
| T-046 | skipped | Needs a decision (rename `backend/` or keep it). Earlier runs (T-039, T-053) treated it the same way |
| T-047 | **picked** | No dependencies, no decision needed, no open PR |

**What the brief covers (17 criteria, full template):**
- **Wrong today, and the criteria fix it:**
  - the "Forward-looking … does not exist yet" marker;
  - `` `api/` ``, `cd api` and the `# api` label;
  - "Use a real Postgres, not SQLite" (the default run is SQLite);
  - "Assert against `openapi.yaml`. It is the contract", which contradicts E-14.
- **Patterns the section must now describe:** savepoint rollback per test, `httpx.ASGITransport` with no socket, `test_contract.py` checking both directions plus `assert_matches`, and `backend/integration/` running separately.
- **Dead-proxy block:** it must install dependencies before the six proxy variables are set, keep all six on the test command, and exit 0 from a cold checkout (criterion 13, run by the tester).
- **Already done, so no criterion asks for it:** the mutation guidance already exists at `test-guidelines.md:174-189`, and T-065 already removed the test counts.
- **Out of scope:** the T-046 naming decision, `CLAUDE.md` lines 4 and 51 (loop-gated), the "Randomness and time" section (T-102 owns it), and every other doc.

**Risks for the orchestrator and the person:**
- **Plan to attend the tester step.** Editing `test-guidelines.md`, plus the new brief and run log, will turn the whole-tree digest pins red by design. Those pins are in `question-bank/src/climate-cold-trade-accepted-verify.test.ts` (T-091 criterion 22) and `question-bank/src/farm-animal-loose-ends-verify.test.ts` (T-096 criterion 21). Clearing them needs a Test change request approved in an attended tester session, so an unattended tester will halt at `test changes requested`.
- **Merge conflict expected.** T-102's PR #126 re-pins the same two files, so whichever PR merges second will need its pins rebased.

## Approval — 2026-11-06
Orchestrator wrote the unattended-run `Approved:` stamp. No human saw the criteria.

## Round 2 — worker — 2026-11-06
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR**
- **Done and pushed.** Only `test-guidelines.md` changed. Its backend section now describes `backend/tests/` as it actually is. The dead-proxy block now runs the install before the guarded command, and the block passes from a cold checkout.
- **Brief updated:** Status `awaiting verification`, Next step `tester`.
- **Needed next:** a tester run in a different session, attended by a person. Two whole-tree pin tests are red and need an approved Test change request to fix.
- **Landed:** commit `35c961f` is the tip of `origin/task/T-047-test-guidelines-backend` (checked with `git log origin/<branch> -1`). That is the brief's `Branch:` header, and the branch I was on.

**What changed in `/home/user/geo-discovery-zone/test-guidelines.md`**
- **"No network in tests, ever":** the block now runs `cd backend`, then `uv sync --frozen` with no proxy variables, then the guarded `uv run pytest` with all six variables set as before. It no longer mentions bun (criterion 12 allows offering neither package).
- **Backend section:** the heading is now `` `backend/` — pytest ``. It covers:
  - **Run commands:** `cd backend && uv run pytest` and `make -C backend test-postgres`.
  - **Scope:** `uv run pytest` runs `backend/tests/` only; `backend/integration/` runs with `make -C backend test-integration`.
  - **Endpoint tests:** the `client` fixture, `httpx.AsyncClient` over `ASGITransport`, no server and no socket.
  - **Database:** SQLite by default, Postgres through `GEO_TEST_DATABASE_URL`.
  - **Isolation:** `db_session` rolls back each test, with the app's commits joined to a savepoint.
  - **Contract:** `openapi.yaml` follows the backend (E-14), kept in step by `test_contract.py` and `assert_matches`.
  - **Errors:** `assert_problem`.
- **"Before you say it passes":** the label `# api` is now `# backend/`.
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-047-test-guidelines-backend.md` has my Sessions row, a Handoff with a criterion-by-criterion table, and Notes.

**Test results**
- **Cold run (criterion 13):** fresh `git worktree` with no `backend/.venv`, block copied out and run with `sh`. pytest reported every test passed (some skipped, no failures); the guarded pytest is the block's last command, so the script exits 0.
- **Backend suite:** green. The guards criterion 17 names all pass.
- **Two pins are red:**
  - `question-bank/src/farm-animal-loose-ends-verify.test.ts`, T-096 criterion 21
  - `question-bank/src/climate-cold-trade-accepted-verify.test.ts`, T-091 criterion 22

  Both were already red before my edit, because the expander's new brief and run log added two tracked files. The fix is to add `test-guidelines.md` and both T-047 files (`tasks/` and `runs/`) to their allowed sets. That needs a Test change request a person approves (D-14). Both are listed under Tests made stale in the brief.
- **Four frontend reds come from this environment, not the change:**
  - **Cause:** `react-simple-maps` is missing from `frontend/node_modules`.
  - **Not repaired:** `bun install --frozen-lockfile` failed, because the proxy returned 403 when downloading packages.
  - **Flaky lint test:** separately, the lint-gate test timed out in one run out of three.

  The tester should recheck these in a fresh environment.

**Flags, with owners**
- **Same session for expander and worker:** the orchestrator ran both under `cse_011oDiJbsZTbExMiPULZMiFd`, so the tester must use a different session. Owner: orchestrator.
- **Old contract wording in the backend tests:** the docstrings of `test_contract.py` and `conftest.py` still describe `openapi.yaml` as "the contract". That is out of scope here. Owner: reviewer, to queue it.
- **`CLAUDE.md` lines 4 and 51 still say `api/`:** that file is gated, so it needs a `P` ticket done by hand. Owner: human.

## Round 3 — tester — 2026-11-06
`Next step` on entry: `tester` → on exit: `human`

**T-047 tester: halted at `test changes requested`. A person must answer the four rows in an attended tester session.** Every criterion holds: 1–12, 14 and 15 by new tests (all green), 13 by a cold run (exit 0), 16 by the diff. Criterion 17 (every suite green) is still red, on whole-tree pins that this task's own files turn red by design. My commit `c435bb8` is on `origin/task/T-047-test-guidelines-backend`, and I confirmed the remote head matches it.

- **Brief header:** Status `test changes requested`, Next step `human`, Test changes `requested`. Fault is set, and my Sessions row is added.
- **Independence:** this run is orchestrated, and my session id `cse_011oDiJbsZTbExMiPULZMiFd` is the same one listed for the expander and worker, so the id check proves nothing. My independence rests only on being a freshly spawned subagent that never saw the work or the worker's reasoning. That is weaker than a separate session, and the Verdict says so.

**What I added**
- **New test file:** `/home/user/geo-discovery-zone/frontend/src/test-guidelines-backend.criteria.test.ts`, one test per criterion for 1–12, 14 and 15. All 14 pass, and the file passes prettier and eslint.
- **Criterion 15:** the test checks a sha256 of `test-guidelines.md` with the three regions it may change cut out. The pinned value is taken from `a7945cf`, and today's file gives the same digest.

**Mutations, all reverted (the file matches a saved copy byte for byte)**
- **Swapping in the old file** turned 12 of the 14 tests red. Criteria 11 and 15 stayed green, which is correct: the old guard already set all six variables, and nothing outside the regions changed.
- **Ten targeted edits each turned the matching test red:** a proxy variable on the `uv sync` line, `uv sync` moved after the guard, `all_proxy` dropped, a typo in an unchanged section, the label changed back to `# api`, a bun package offered, "no socket" removed, the savepoint removed, the old SQLite rule restored, and the E-14 citation removed.
- **One test was too weak at first:** removing the savepoint did not turn criterion 5 red, because `create_savepoint` in a code span still matched. I tightened the test, and that edit now goes red.

**Criterion 13, the cold run**
- **Cold state:** a fresh `git worktree add --detach` at HEAD, with no `backend/.venv`.
- **What I ran:** the block copied out verbatim and run with `sh` from the worktree root.
- **Result:** `uv sync --frozen` installed through the agent proxy, then the guarded run gave 1039 passed, 9 skipped, exit 0. I removed the worktree afterwards.

**Suites**
- **backend:** pytest green (the cold run). `ruff check` and `ruff format --check` are clean.
- **question-bank:** 2711 pass and 3 fail, all three covered by the request. Typecheck and lint are clean.
- **frontend:** 406 pass and 4 fail, plus typecheck errors in `UsMap.tsx` and the two t051 tests. All of these are "Cannot find package 'react-simple-maps'": it is missing from `node_modules` here, and `bun install` gets a 403 from the proxy. A doc edit can't cause that, but I couldn't confirm it here. **CI on PR #127 is the authority for these.** Lint and format checks are clean.
- **The five guards criterion 17 names** pass without edits.
- **Spot check:** the section's claims match `conftest.py`, the Makefile, `pyproject.toml`, `test_postgres.py` and `backend/integration/README.md`.

**Test change request** (in the brief, none applied)
1. **farm-animal criterion 21:** add the three T-047 files to the allowed set. The count goes 283 → 282, with digest `fda851f3…`.
2. **climate criterion 22, non-test files:** the same three files. The count goes 286 → 285, with digest `0b3efcae…`.
3. **climate criterion 22, pre-existing test files:** the count goes 122 → 123, with digest `c920b17c…`, because of the new tester file (blob `d872014`).
4. **climate's applied-request digests:** the entry for the farm-animal file is recomputed after row 1 is applied.

The proposed counts and digests for rows 1 and 2 are what `a7945cf` gives with the same three files exempted, so those rows exempt only T-047's own files. Run on `a7945cf` without the exemption, the same script gives today's pinned values.

**Watch out**
- T-102's PR #126 re-pins the same constants, so whichever PR merges second has to rebase its pin values.
- The row 3 digest changes if the new test file changes before the rows are applied.

**Needed next:** a person starts a `tester` session for T-047 that they are attending, and approves or refuses each row there.

Brief: `/home/user/geo-discovery-zone/tasks/T-047-test-guidelines-backend.md`

## Halted — test change request — 2026-11-06
Raised at commit `c435bb8`. Header: `Test changes: requested`, `Status: test changes requested`, `Next step: human`.
A person must start the `tester` step for T-047 in a session they are attending and approve or refuse each row there. The orchestrator cannot take the approval (D-15).

## Run ended — 2026-11-06
Two tasks in a row ended halted (T-102, T-047), so the run stopped before its third task, per `orchestrator.md` "The loop you run".

## Resumed — 2026-11-06
A person asked the orchestrator: "pr 127 ci is green, what is the problem?". The branch head had moved to `bd2c8b3`: an attended tester applied the approved test change request (`04ac466`) and recorded a verdict (`bd2c8b3`). Header on resume: `Status: pass`, `Next step: reviewer`, `Test changes: approved — Dkaattae, 2026-11-06`.

## Round 4 — reviewer — 2026-11-06
`Next step` on entry: `reviewer` → on exit: `tester` — attended, to merge `origin/main` into this branch and re-pin under a new Test change request (see `## Review`, finding 1)

**T-047 reviewer: changes requested. PR #127 stays draft and is not swept.** The document is good and I would approve it on its merits. The PR can't merge, though: PR #126 (T-102) merged to `main` first and re-pinned the same test file, so #127 is now `dirty` and CI doesn't run on it. **Next:** an attended `tester` session merges `origin/main` in and re-pins, with a person approving (D-14). Then a reviewer comes back to sweep and mark it ready.

**Blocking finding (one)**
- **Where:** `question-bank/src/climate-cold-trade-accepted-verify.test.ts`, `APPLIED_REQUEST_FILE_SHAS`, the `farm-animal-loose-ends-verify.test.ts` entry (around line 178). This branch pins `12535777…` (T-047 row 4) and `main` pins `2a241617…` (T-102 row 3). Neither is right after a merge.
- **Checked in a scratch worktree** (removed, nothing committed): that file is the only conflict, and `farm-animal-loose-ends-verify.test.ts` merges automatically.
- **What the fix needs:**
  - merge `origin/main` into the branch (a merge, not a rebase, so no force-push);
  - keep both sides' allowed-set entries, including T-102's paths;
  - recompute that digest and every T-047 pin (rows 1–7) on the merged tree;
  - get the new values approved by a person and applied in a `tester` commit;
  - CI green on the merged head.
- **Why it goes to the tester:** these are new values in tests that existed before the task, so a person has to approve them in a tester session. The brief expected this ("whichever merges second will need its pins rebased").

**Review of the work: nothing blocking**
- **Accurate:** every claim in the new backend section checks out against `backend/tests/conftest.py`, `test_postgres.py`, `backend/Makefile` and `backend/integration/README.md`.
- **Each role stayed in its lane.** The edits to existing tests come only from tester commit `04ac466`, they match rows 1–7, and `Test changes:` names Dkaattae.
- **No dependency, source, workflow or `CLAUDE.md` change.**
- **CI on `bd2c8b3` was green on all seven jobs.** That clears the local `react-simple-maps` failures as an environment problem.

**Flags settled**
- **`uv run pytest` guard:** kept as written.
- **"`make -C backend test` does the same after installing":** accurate.
- **`CLAUDE.md` lines 4/51:** already owned by T-046.
- **`test_contract.py`/`conftest.py` docstrings calling `openapi.yaml` "the contract":** a new S entry in `tasks.md`, to be added when the PR is approved and swept.

**State**
- **Brief:** `Status: changes requested`, `Next step: tester` (attended), `## Review` added, reviewer row in Sessions.
- **Pushed** as `7da84b5` to `task/T-047-test-guidelines-backend`; the remote head matches.
- **PR comment** with the findings: https://github.com/Dkaattae/geo-discovery-zone/pull/127#issuecomment-6695901445
- **Not done:** I didn't update the run log `/home/user/geo-discovery-zone/runs/T-047-test-guidelines-backend.md`, since it belongs to the orchestrator.

Brief: /home/user/geo-discovery-zone/tasks/T-047-test-guidelines-backend.md

## Halted — needs attended tester — 2026-11-06
`Next step` names `tester` but requires it attended: the re-pin changes pre-existing tests, which a person must approve in the session making the edits (D-15). An orchestrator-spawned tester cannot take that approval, so the orchestrator did not spawn one.

## Resumed — 2026-11-06
A person told the orchestrator: "pr 127 is fixed please proceed". The branch head had moved to `a28e5ac`: an attended tester merged `origin/main` (`d88964b`, `2f95ce5`) and applied approved row 8 with a verdict (`a28e5ac`). Header on resume: `Status: pass`, `Next step: reviewer`.

## Round 5 — reviewer — 2026-11-06
`Next step` on entry: `reviewer` → on exit: `human` — PR #127 is marked ready, inside the envelope; merge when convenient

**I approved T-047 with no escalation. PR #127 now carries its own sweep and is marked ready, not merged.** CI passed all six jobs on the reviewed head `f42e0dc`. Next: Dkaattae merges when convenient.

- **Branch:** `task/T-047-test-guidelines-backend`. The push landed: the remote head is `d70a15c`, the same as local.
- **CI on `d70a15c`:** it was starting when I stopped and I did not wait for the result. That commit only changes Markdown (`tasks.md`, `PROGRESS.md`, `process-tasks.md` and the deleted brief). I ran the question-bank suite locally after the sweep: 2713 pass, 0 fail.

**Commits**
- `7c6714d`: my second review pass, written into the brief. It adds the Review section and my Sessions row, and sets Status `approved`, Next step `human`.
- `d70a15c`: the sweep.
  - **Brief:** deleted.
  - **`tasks.md`:** T-047 deleted. T-046 amended, because only `CLAUDE.md` lines 4 and 51 still say `api/`. New **T-104** for the `test_contract.py` and `conftest.py` docstrings that still call `openapi.yaml` "the contract". The sweep log line is added.
  - **`PROGRESS.md`:** T-047 logged under Completed tasks, and two outdated lines saying `test-guidelines.md` still uses `api/` corrected.
  - **`process-tasks.md`:** P-17 gets a note that this happened again: 8 re-pin rows, one of them only because T-102 merged first.

**Why it was approved**
- **The first pass's blocking finding is fixed.** It was the merge conflict with T-102.
  - `d88964b` merged `main` in, and `main`'s side is intact.
  - `a28e5ac` applies row 8, which Dkaattae approved.
  - All eight pre-existing test edits come only from tester commits and match rows 1–8.
- **Every role's commits are in the PR.**
- **Inside the envelope:**
  - The tester passed, and the `Test changes:` header names Dkaattae.
  - No CI fix was applied in any round.
  - No dependency, `openapi.yaml`, migration, plan or child-facing text changed.
  - No file changed outside Constraints.
- **The document holds up.** `test-guidelines.md` has not changed since the first pass, whose accuracy check of every claim in it still applies.

**PR #127**
- **Body rewritten:** a TL;DR, the acceptance criteria copied word for word, a table of what verified each, and where each review finding went.
- **Ready flag:** set through the REST route, and I confirmed `draft: false` afterwards.

**Local frontend suite:** 5 failures. Three are `react-simple-maps` missing from `node_modules` here; the earlier roles saw the same thing (this proxy returns 403 on install). The other is the lint-gate test timing out. CI's frontend job is green.

**Files:**
- /home/user/geo-discovery-zone/test-guidelines.md
- /home/user/geo-discovery-zone/tasks.md
- /home/user/geo-discovery-zone/PROGRESS.md
- /home/user/geo-discovery-zone/process-tasks.md
- /home/user/geo-discovery-zone/frontend/src/test-guidelines-backend.criteria.test.ts
