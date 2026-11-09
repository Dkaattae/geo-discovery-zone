# T-104 — Two backend test docstrings still call `openapi.yaml` "the contract"

**Status:** `pass`
**Next step:** `reviewer` — conflict with main resolved (`## Review` finding 1); redo the sweep and mark ready
**Approved:** orchestrator — 2026-11-07, unattended run. See `runs/T-104-contract-docstrings.md`.
**Test changes:** `approved — Dkaattae, 2026-11-09` (rows 1-5; rows 6-9 the same day, after merging main)
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-104
**Branch:** `task/T-104-contract-docstrings`
**PR:** #129, opened draft at expand time; stays draft until the reviewer approves it

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-07 | cse_011oDiJbsZTbExMiPULZMiFd |
| worker | 2026-11-07 | cse_011oDiJbsZTbExMiPULZMiFd |
| tester | 2026-11-07 | cse_011oDiJbsZTbExMiPULZMiFd (orchestrated: shared session id, freshly spawned context; see Verdict) |
| tester | 2026-11-09 | session_011oDiJetGTLJwZt9qsn2Bn6 (attended, Dkaattae; applied the approved Test change request) |
| reviewer | 2026-11-09 | session_011oDiJbsZTbExMiPULZMiFd (orchestrated subagent; reviewed work it did not write) |

> **Light brief** (`process.md`, "The light path, for S-sized tasks"). T-104 is
> `S`, touches neither `openapi.yaml` nor a migration, the plan, nor any text a
> child reads, and fits in four criteria. Goal, Out of scope, Constraints and
> Context are dropped; the few rules that bite are in **Notes** below.


### Rows 6-9: after merging `origin/main` (T-103, PR #128) — 2026-11-09, attended tester

Merge commit `3196135` kept both tasks' comment trails and allowed-set entries, and **main's**
values, so no unapproved number is committed. On the merged tree question-bank is
**2710 pass, 3 fail**. Both `MAIN_UNTOUCHABLE_SHA` pins (climate-cold, farm-animal) **pass** with
T-104's row 3/4 values: T-103's files are tests or in the allowed sets, so they need no row.
Values below were observed on `3196135`; row 8 in a dry run with row 7 applied, then reverted.

| # | Test (file › describe › name) | Introduced | Why stale | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 6 | `refresh-regenerate-reminder-verify.test.ts` › T-087 criterion 15 › "every tracked file under the three trees…" | `bcb2a38`, T-039; last T-103 row 1 | Merged tree holds T-103's three backend tests and T-104's docstring edits and tester file | modify | `MAIN_BOUNDARY_SHA` `7f53b203…3936` → `f5da43056929f00c7e042f7d8a4cb06c86a12114887d3b1a6a3e24820bbbd71c`; T-104 comment says "row 6, recomputed on merging main after T-103" | approved — Dkaattae, 2026-11-09 ("approve rows 6–9, Dkaattae") |
| 7 | `climate-cold-trade-accepted-verify.test.ts` › T-091 crit 22 › "pre-existing test files are main's…" (count) | `950f334`, T-091; last T-103 row 4 | T-103's 3 files plus T-104's `test_t104_tester_criteria.py` | modify | `MAIN_TESTS_COUNT` 126 → **127**; T-104 comment corrected to "(126 -> 127, row 7)" | approved — Dkaattae, 2026-11-09 ("approve rows 6–9, Dkaattae") |
| 8 | same test (digest) | same | same; `test_contract.py` changed too | modify | `MAIN_TESTS_SHA` `c0ec8c11…122a` → `592eaba9cfe95d85444262c6f230f25c84aa642b2a314ac33b3c465b352b02df`; T-104 comment updated likewise | |
| 9 | `climate-cold-trade-accepted-verify.test.ts` › T-091 crit 22 › "each test in the approved Test change request is 8108a42's…" | `bac230d`, T-091 | The merge combined T-103 and T-104 edits in `farm-animal-loose-ends-verify.test.ts`; rows 6-8 do not touch that file, so this value is final | modify | `APPLIED_REQUEST_FILE_SHAS` farm-animal entry `cc8f4936…9691` → `25451e3486f036f0bb5d32356f8d7d0f601f7f1e4a84b882b80c514386bdd898`; trail gains "then by T-104 (row 9, on merging main after T-103)" | approved — Dkaattae, 2026-11-09 ("approve rows 6–9, Dkaattae") |

## Acceptance criteria

Frozen once approved. "Module docstring" means the string literal that is the
first statement of the file, as returned by `ast.get_docstring` on the parsed
module.

1. **`backend/tests/test_contract.py`'s module docstring** no longer presents
   `openapi.yaml` as a contract the backend is held to: it does not contain the
   phrase `contract between` (case-insensitive), and it says that `openapi.yaml`
   follows, or is kept in step with, the backend and contains the string `E-14`.
   It still says what the tests in the file catch (a route with no operation in
   the spec, an operation with no route, a protected group that does not say it
   is protected) — those three may be reworded but none may be dropped.
2. **`backend/tests/conftest.py`'s module docstring** no longer says that
   routing, validation and serialisation are something the contract promises:
   it does not contain the phrase `contract promises` or `what the contract`
   (case-insensitive), and it contains the string `E-14` together with a
   statement that `openapi.yaml` follows, or is kept in step with, the backend.
   It still gives a reason that endpoint tests go through the app with
   `httpx.AsyncClient` rather than calling the handler, and every other
   paragraph of the docstring (database choice, the two `uv run pytest` lines,
   Alembic migrations, per-test rollback, the Postgres clean schema) is present
   with its meaning unchanged.
3. **Nothing but those two module docstrings changes in those two files.** For
   each file, the module parsed with `ast` and its module docstring removed is
   identical (`ast.dump`) to the same file at this branch's base on `main`
   (`dca80da`). No assertion, fixture, test name, comment outside the module
   docstring, or other docstring in either file changes — in particular the
   `# -- contract assertions` comment, the `assert_matches` docstring and the
   `test_*_contract*` test names stay as they are.
4. **The worker changes no other source, test or configuration file.** The
   worker's commits touch only the two files above and this brief. Re-pins of
   earlier whole-tree digest tests that this change turns red happen only
   through an approved Test change request (D-14), and the full backend,
   frontend and question-bank suites pass at the end. Verified at hand-off by
   `git diff --stat dca80da..HEAD` recorded in the Verdict, not by a new
   committed digest pin (P-17).

## Handoff

**TL;DR:** Both module docstrings rewritten; nothing else in either file changed (AST check below). Backend suite green. Four question-bank digest/count pins are red: two were already red at the branch head before any worker edit (the brief and run log the expander/orchestrator committed), two are turned red by this edit. Tester raises one Test change request for all four.

**Session note for the tester:** the worker session id is `cse_011oDiJbsZTbExMiPULZMiFd`, the same id the expander recorded. The orchestrator ran both roles under one remote session id. Check your own id against this table as usual. If it is the same id, that is the orchestrator's call to make, not mine.

**Files changed (worker commit):**

- `backend/tests/test_contract.py`: module docstring only. It now says `openapi.yaml` follows the backend and is updated to match it (`engineering-decisions.md` E-14). It keeps all three things the tests catch: a route with no operation, an operation with no route, and a protected group that forgot to say so.
- `backend/tests/conftest.py`: module docstring, first paragraph only. The `httpx.AsyncClient` reason is now "routing, validation and serialisation are part of the behaviour a client sees, so a test that skips them is not testing the endpoint", followed by "`openapi.yaml` follows the backend and is kept in step with it … (E-14)". The other paragraphs are byte-identical.
- `tasks/T-104-contract-docstrings.md`: this brief (header, Sessions row, Handoff, Notes).

**Where each criterion lives:**

| # | Where | Worker's own check |
|---|---|---|
| 1 | `backend/tests/test_contract.py` lines 1-8 | no `contract between`; has `E-14` and "follows the backend"; all three drift kinds present |
| 2 | `backend/tests/conftest.py` lines 1-23 | no `contract promises` or `what the contract`; has `E-14` and "follows the backend and is kept in step with it"; other paragraphs unchanged |
| 3 | both files | for each file, `ast.dump` with the module docstring removed equals `dca80da`'s: **True** for both |
| 4 | `git diff --stat dca80da..HEAD` | expected: the two backend files, this brief, and `runs/T-104-contract-docstrings.md` (orchestrator's commit, not the worker's) |

**Deliberately not done:**

- **`assert_matches` docstring, `# -- contract assertions` comment and `test_*_contract*` names:** left alone. Criterion 3 freezes them.
- **No new committed test:** the checks above were throwaway scripts. Writing the criterion tests is the tester's job.
- **No re-pins:** existing tests are not the worker's to change (D-14).

**Contradictions with the brief:** none in the criteria. One thing the Notes missed: two of the stale reds below come from the brief and run log themselves, not from the docstring edit.

**How to run:**

```bash
make -C backend check                       # ruff, format check, pytest: 1039 passed, 9 skipped
cd question-bank && bun test && bun run typecheck && bun run lint
cd frontend && bun test && bun run typecheck && bun run lint
```

**Suite results at hand-off:**

- **backend:** `make -C backend check` green (1039 passed, 9 skipped). `uv run mypy .` stops with a module-path error in `tests/conftest.py`. That is not part of `make check` and is unrelated to the docstring.
- **question-bank:** 2709 pass, 4 fail (all four listed below). Typecheck and lint are clean.
- **frontend:** 406 pass, 4 fail. All four failures are "Cannot find package 'react-simple-maps'": `bun install --frozen-lockfile` gets a proxy 403 because the lockfile's tarball host is `europe-west1-npm.pkg.dev`. The same 406/4 shows with my edit stashed, so this is environmental and not caused by this change. Typecheck shows the same missing-module errors. Lint shows the same. The tester should run the frontend where `node_modules` installs.

### Tests made stale

All four pins were last set by `04ac466` ("T-047 tester: apply approved test change request").

1. **`question-bank/src/refresh-regenerate-reminder-verify.test.ts`**, `T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes > every tracked file under the three trees is as re-pinned by T-039, none added or removed`
   - **Why stale:** criteria 1-2 edit two files under `backend/`.
   - **Proposal:** modify `MAIN_BOUNDARY_SHA` (line 90) from `437329ad…f597` to `9092278337f1572f35f6199f6396e183dd53b7666bdc34a52083299158973539`, the value observed with this branch's edit.
2. **`question-bank/src/climate-cold-trade-accepted-verify.test.ts`**, `T-091 criterion 22: the diff touches only the allowed files > pre-existing test files are main's, except ones in an approved Test change request`
   - **Why stale:** `backend/tests/conftest.py` and `test_contract.py` count as test files.
   - **Proposal:** modify `MAIN_TESTS_SHA` (line 122) from `830fac35…ef2b` to `2f2ca0e2d8cb03e950693e4fdaff6c6a5502c9256b4e567066cc1e44b3dd3a78`. `MAIN_TESTS_COUNT` (123) is unchanged.
3. **`question-bank/src/climate-cold-trade-accepted-verify.test.ts`**, `T-091 criterion 22: the diff touches only the allowed files > every tracked non-test file outside the allowed list is 12d242e's, and none is added`
   - **Already red before the worker touched anything.** It fails on the expander's and orchestrator's commits: `tasks/T-104-contract-docstrings.md` and `runs/T-104-contract-docstrings.md` add two tracked files.
   - **Proposal:** modify `MAIN_UNTOUCHABLE_COUNT` (line 104) from 285 to 287, and re-pin `MAIN_UNTOUCHABLE_SHA` (line 95) to the value observed after that. The sha is not shown yet because the count assertion fails first.
4. **`question-bank/src/farm-animal-loose-ends-verify.test.ts`**, `T-096 criteria 17-21: the bank and the boundaries > criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added`
   - **Already red before the worker, same cause as 3.**
   - **Proposal:** modify the count literal on line 613 from 282 to 284 and add the usual "was 282" trail. Re-pin `MAIN_UNTOUCHABLE_SHA` (line 170) to the observed value.

**Flags, each with an owner:**

- **Stale reds 3 and 4 come from the brief and run log, not from this change.** I listed them anyway so they are not read as bugs. They will recur on every task that adds a brief and a run log. **Owner:** the tester includes them in this task's Test change request. Whether these pins should exempt `tasks/` and `runs/` is a `process-tasks.md` question for Dkaattae.
- **T-103 (PR #128) re-pins the same digests.** Whichever PR merges second needs one more re-pin round. **Owner:** the reviewer of the second PR, as the brief's Notes already say.

## Verdict

**TL;DR: pass again, on the merged tree.** `origin/main` (T-103) is merged in (`3196135`).
Dkaattae approved rows 6-9, which are applied in `605c476`. Question-bank is **2713 pass, 0 fail**,
backend is **1221 passed, 9 skipped**. Next: the reviewer redoes the sweep.

**Approval for rows 6-9.** Dkaattae's words in this session: "approve rows 6–9, Dkaattae".

**What the merge did.** It kept both tasks' comment trails and allowed-set entries, and main's
values. Rows 6-9 then re-pinned `MAIN_BOUNDARY_SHA`, `MAIN_TESTS_COUNT` (126 → 127),
`MAIN_TESTS_SHA` and the farm-animal `APPLIED_REQUEST_FILE_SHAS` entry, each to the value observed
on the merged tree. Both `MAIN_UNTOUCHABLE_SHA` pins already passed after the merge and were left
alone. No test was deleted, and no assertion was loosened.

**Suites on `605c476`:**

- **question-bank:** 2713 pass, 0 fail; typecheck, lint and format:check clean.
- **backend:** `make -C backend check`: ruff clean, **1221 passed, 9 skipped**.
- **frontend:** locally 4 fail, all "Cannot find package 'react-simple-maps'" (the proxy returns
  403 on that tarball here). One run showed a fifth, unhandled-error failure; two reruns gave the
  same 4. No frontend file changed on this branch.

### Earlier verdict (attended tester, rows 1-5)

**TL;DR: pass.** All four criteria met. Dkaattae approved all five Test change request
rows in an attended tester session, they are applied in `63c7e84`, and question-bank
is green again (**2713 pass, 0 fail**). Next: reviewer.

**Approval.** Header: `Test changes: approved — Dkaattae, 2026-11-09`. Dkaattae's
words in the session: "approve rows 1–5, Dkaattae".

**Independence (2026-11-09 tester).** This is a separate session (`session_011oDiJetGTLJwZt9qsn2Bn6`),
started directly by a person. It is not in the Sessions table as worker, ci-fix or expander.

**Tests modified (no test deleted), all in `63c7e84`:**

| Row | Test | Change | Why |
|---|---|---|---|
| 1 | `refresh-regenerate-reminder-verify.test.ts` › T-087 criterion 15 | `MAIN_BOUNDARY_SHA` → `75e72445…d3af` | T-104 edits `conftest.py` and `test_contract.py`, and its tester adds `test_t104_tester_criteria.py` |
| 2 | `climate-cold-trade-accepted-verify.test.ts` › T-091 crit 22 "pre-existing test files" | `MAIN_TESTS_COUNT` 123 → 124; `MAIN_TESTS_SHA` → `e91fe4e6…224f` | `test_contract.py` edited; one backend test file added |
| 3 | same file › T-091 crit 22 "every tracked non-test file" | T-104 brief and run log added to `CRITERION_22_ALLOWED` (count stays 285); `MAIN_UNTOUCHABLE_SHA` → `eba70070…3193` | `conftest.py` counts as a non-test file |
| 4 | `farm-animal-loose-ends-verify.test.ts` › T-096 criterion 21 | T-104 brief and run log added to `CRITERION_21_ALLOWED` (count stays 282); `MAIN_UNTOUCHABLE_SHA` → `d29be0bf…7aaf` | same as row 3 |
| 5 | `climate-cold-trade-accepted-verify.test.ts` › T-091 "each test in the approved Test change request" | `APPLIED_REQUEST_FILE_SHAS` for `farm-animal-loose-ends-verify.test.ts` → `797e631f…d3b2` | row 4 changed that file |

Every value in rows 1–4 equals the one the earlier tester's dry run observed. Row 5 was computed
last, after row 4's comments and the prettier pass. No assertion was loosened: each test still
checks the same count and digest over the same set.

**Suites on `63c7e84`:**

- **question-bank:** **2713 pass, 0 fail**; typecheck, lint, format:check clean.
- **backend:** `make -C backend check`: **1051 passed, 9 skipped**.
- **frontend:** locally 406 pass, 4 fail. All four are "Cannot find package 'react-simple-maps'",
  because `bun install --frozen-lockfile` gets a proxy 403 on that tarball here. No frontend file
  changed, and CI on `846a9d1` had frontend green.

**Merge order with T-103 (PR #128).** It re-pins the same digests. Whichever PR merges second
needs one more re-pin round on top of main.

### Earlier verdict (orchestrated tester, 2026-11-07)

**TL;DR: all four criteria met; halted on a Test change request, not a fail.**
Five re-pin rows below need a person's approval in an attended tester session.
Until then question-bank stays red (4 tests now, all stale pins). Everything else is green.

**Independence.** This run is orchestrated (`runs/T-104-contract-docstrings.md`
exists), so every role shares session id `cse_011oDiJbsZTbExMiPULZMiFd` and the
Sessions-table check proves nothing. The tester is a freshly spawned subagent
with its own context window. It did not see the work happen or the worker's
reasoning. That is real independence, but weaker than a separate session: it
rests on the orchestrator having spawned it correctly, not on anything the
tester can verify itself.

| # | Verdict | Evidence |
|---|---|---|
| 1 | **met** | `backend/tests/test_t104_tester_criteria.py`, five `test_criterion_1_*` tests: no `contract between`; "`openapi.yaml` follows … the backend" and `E-14`; all three drift kinds (route with no operation, operation with no route, protected group that does not say so). |
| 2 | **met** | Seven `test_criterion_2_*` tests: no `contract promises` / `what the contract`; follows-the-backend statement and `E-14`; a reason after "not by calling the handler"; database choice, both `uv run pytest` lines, Alembic + rollback, Postgres clean schema all present. Also checked by procedure: paragraphs 3-6 of the docstring are byte-identical to `dca80da`'s, and so is the title line. |
| 3 | **met** (executed procedure, P-17) | For each file, `ast.dump` of the module with its docstring removed equals `dca80da`'s: **True** for both. The source text after the docstring is line-identical to `dca80da`'s for both, which also covers comments (`# -- contract assertions`). |
| 4 | **met** (executed procedure, P-17) | `git diff --stat dca80da..846a9d1` (before the tester's commits) is below. The worker's commit `36872b5` touches only `backend/tests/conftest.py`, `backend/tests/test_contract.py` and this brief. No re-pin was made; the stale pins wait for the request below. |

```
$ git diff --stat dca80da..846a9d1
 backend/tests/conftest.py          |   6 +-
 backend/tests/test_contract.py     |   9 +-
 runs/T-104-contract-docstrings.md  |  76 ++++++++++++++++
 tasks/T-104-contract-docstrings.md | 172 +++++++++++++++++++++++++++++++++++++
 4 files changed, 257 insertions(+), 6 deletions(-)
```

**Criterion 3 procedure** (scratch script, run from the repo root):
strip `tree.body[0]` (asserted to be a string constant) from
`ast.parse(git show dca80da:<f>)` and `ast.parse(<f>)`, then compare
`ast.dump(..., include_attributes=False)`. Both files print `True`.

**Do the tests bite?** The new tests were run against `dca80da`'s two files:
the four "no longer says / now says" tests go red, and the eight "still says"
tests stay green, as they should. Eight mutations of the branch's docstrings,
each reverted:

| Mutation | Test that went red (only that one) |
|---|---|
| drop "protected group … forgot to say it is protected" | `keeps_unmarked_protected_group` |
| "an operation with" → "a thing with" | `keeps_operation_with_no_route` |
| "a route with" → "a path with" | `keeps_route_with_no_operation` |
| drop the reason after "not by calling the handler" | `still_gives_a_reason_for_async_client` |
| drop the Postgres clean-schema paragraph | `keeps_postgres_clean_schema_paragraph` |
| drop the `# Postgres` pytest line | `keeps_both_uv_run_pytest_lines` |
| "rolled back afterwards" → "kept" | `keeps_alembic_and_rollback_paragraph` |
| drop `E-14` from conftest | `conftest_docstring_says_spec_follows_backend_and_cites_e14` |

**Suites, on `6196ee9` (with the tester's test):**

- **backend:** `make -C backend check`: ruff, format check, pytest **1051 passed, 9 skipped**.
- **question-bank:** **2709 pass, 4 fail**, typecheck and lint clean. The four reds are rows 1-4 below. Once rows 1-4 are applied, row 5's cascade test also goes red until row 5 is applied (seen in a dry run, reverted).
- **frontend:** locally 406 pass, 4 fail, all "Cannot find package 'react-simple-maps'" / `us-atlas`: `bun install --frozen-lockfile` gets a proxy 403 on tarballs. No frontend file changed. CI on `846a9d1` has **frontend green**, as are backend, backend (postgres), e2e and integration; only question-bank is red there, from these stale pins.

**One correction to the worker's Tests made stale list.** The worker said the
two `MAIN_UNTOUCHABLE_*` reds come only from the new brief and run log. Not
quite: `backend/tests/conftest.py` is not a `test_*` file, so both pins count it
as a non-test file and its docstring edit moves both digests too (as T-101's
conftest edit did). The established fix is also different from the worker's
proposal: earlier tasks add their brief and run log to the allowed set (count
unchanged) rather than raising the count. Rows 3 and 4 follow that pattern. The
tester's own new test file also moves rows 1 and 2.

**No existing test was deleted or modified.**

## Test change request

All values below were observed on `6196ee9` in a dry run that applied rows 1-4
and was then reverted. Row 1, 2's sha and row 5 depend on the exact tree, so
**re-read each observed value when applying**, and recompute row 5 last, after
rows 3-4's comments are written.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` › `T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes` › "every tracked file under the three trees is as re-pinned by T-039, none added or removed" | `bcb2a38`, T-039 (from T-087): whole-tree digest of `backend/`, `frontend/`, `e2e/`. Last re-pinned by `04ac466`, T-047. | Criteria 1-2 edit `backend/tests/conftest.py` and `test_contract.py`; the tester adds `backend/tests/test_t104_tester_criteria.py`. | modify | Same name and assertion. `MAIN_BOUNDARY_SHA` (line 90) `437329ad…f597` → `75e724453de9d426d89b38cdd4e34e73ab079d14ed7adca4fdaa0bd137fdd3af`, with a "Re-pinned by T-104 (row 1)" comment naming the three files. | approved — Dkaattae, 2026-11-09 ("approve rows 1–5, Dkaattae") |
| 2 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › "pre-existing test files are main's, except ones in an approved Test change request" | `950f334`, T-091: count and digest of every pre-existing test file. Last re-pinned by `04ac466`, T-047. | `test_contract.py` changes (criterion 1); the tester adds one backend test file. | modify | Same name and assertions. `MAIN_TESTS_COUNT` (line 136) 123 → **124**; `MAIN_TESTS_SHA` (line 122) `830fac35…ef2b` → `e91fe4e63fbbdb42461c6a8afa979aaa5e9a9ac0ce244760c046c0842e60224f`. "Re-pinned by T-104 (row 2)" comments on both. | approved — Dkaattae, 2026-11-09 ("approve rows 1–5, Dkaattae") |
| 3 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: …` › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091: count and digest of every tracked non-test file outside the allowed list. Last re-pinned by `04ac466`, T-047. | The task adds `tasks/T-104-contract-docstrings.md` and `runs/T-104-contract-docstrings.md`, and edits `backend/tests/conftest.py`, which this pin counts as a non-test file. | modify | Same name and assertions. Add `"tasks/T-104-contract-docstrings.md"` and `"runs/T-104-contract-docstrings.md"` to `CRITERION_22_ALLOWED`, with a T-104 row 3 comment. `MAIN_UNTOUCHABLE_COUNT` stays **285**. `MAIN_UNTOUCHABLE_SHA` (line 95) `0b3efcae…027b5` → `eba70070b3ab2d5e22e90e49bd5e7ee7ba8d924478c0040ccf9e0fc213863193` (conftest.py moved). | approved — Dkaattae, 2026-11-09 ("approve rows 1–5, Dkaattae") |
| 4 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `T-096 criteria 17-21: the bank and the boundaries` › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096: count and digest of every tracked file outside its allowed set and the test files. Last re-pinned by `04ac466`, T-047. | Same as row 3. | modify | Same name and assertions. Add the T-104 brief and run log to `CRITERION_21_ALLOWED`, with a T-104 row 4 comment. The count literal (line 613) stays **282**. `MAIN_UNTOUCHABLE_SHA` (line 170) `fda851f3…422d` → `d29be0bf166cb42d1bdf6c9cfe5077b76cc9b0c1b5393ccb37fcb0509f5c7aaf`. | approved — Dkaattae, 2026-11-09 ("approve rows 1–5, Dkaattae") |
| 5 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: …` › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | `bac230d`, T-091: per-file sha of the test files in T-091's request, including `farm-animal-loose-ends-verify.test.ts`. | Row 4 edits `farm-animal-loose-ends-verify.test.ts`, so its pinned sha moves (as for T-047 rows 4 and 8). | modify | Same name and assertion. The `APPLIED_REQUEST_FILE_SHAS` entry for `question-bank/src/farm-animal-loose-ends-verify.test.ts` (line 183) `e9470a5e…cdd6` → the file's sha256 **after row 4 is applied, comments included**. The dry run without comments gave `831f84c4…0302`; the real value will differ. Add "then by T-104 (row 5, for its row 4)" to its comment trail. | approved — Dkaattae, 2026-11-09 ("approve rows 1–5, Dkaattae") |

**Merge order with T-103 (PR #128).** Rows 1-5 are the same digests T-103
re-pins. Whichever PR merges second needs one more re-pin round on top of main.

**Process note, for Dkaattae (`process-tasks.md`, P-17 territory, not for this
task):** rows 3 and 4 recur on every task, because each adds a brief and a run
log. Exempting `tasks/` and `runs/` from these two pins would end that.

## Review

### Reviewer, 2026-11-09 — **changes requested** (one blocking finding, and it is not about the work)

**TL;DR.** **The work is good and I would approve it as written.** The PR cannot
merge: PR #128 (T-103) merged to `main` (`902284b`) after this branch was cut,
and both re-pinned the same three question-bank test files. GitHub shows #129 as
`dirty`. **Next:** an **attended** `tester` session merges `origin/main` in,
re-pins, and gets a person's approval (D-14). Then the reviewer comes back for the
sweep and marks the PR ready.

*What happened in this session, for the record:* I approved, swept (`b7e040b`)
and marked #129 ready before I saw that `main` had moved. Then I found the
conflict, put the PR back to draft and reverted the sweep (`git revert`, no
force-push), so this brief is live again. The non-blocking findings and the
dispositions below still stand, and the next reviewer pass can reuse `b7e040b`'s
sweep as a starting point. Re-check it against the merged `tasks.md` and
`PROGRESS.md` first.

**Blocking**

1. **Merge conflict with `main` in three pre-existing tests. Fixing it needs a re-pin a person approves.**
   - **Where (checked by a trial `git merge origin/main` in a scratch worktree, since removed, nothing committed):**
     - `question-bank/src/refresh-regenerate-reminder-verify.test.ts` ~line 90, `MAIN_BOUNDARY_SHA`.
       This branch has `75e72445…` (T-104 row 1). `main` has `7f53b203…` (T-103 row 1).
     - `question-bank/src/climate-cold-trade-accepted-verify.test.ts`:
       - `MAIN_TESTS_SHA` (~124) and `MAIN_TESTS_COUNT` (~140). This branch has 124, `main` has 126; merged it should be 127.
       - The `APPLIED_REQUEST_FILE_SHAS` farm-animal entry (~186): `797e631f…` here, `cc8f4936…` on `main`.
       - `CRITERION_22_ALLOWED` (~205): both sides added their own brief and run log.
     - `question-bank/src/farm-animal-loose-ends-verify.test.ts` `CRITERION_21_ALLOWED` (~183): both sides added their brief and run log.
     - **Also wrong after the merge, though they auto-merge:** both `MAIN_UNTOUCHABLE_SHA` constants (climate-cold ~97, farm-animal ~172). Each side computed them over a tree without the other's files.
   - **What would make it acceptable:**
     1. Merge `origin/main` into `task/T-104-contract-docstrings`. Do not rebase, because a rebase needs a force-push.
     2. Keep both sides' comment lines and allowed-set entries.
     3. Recompute every T-104 value on the merged tree: rows 1-5, plus both `MAIN_UNTOUCHABLE_SHA` values. Compute the farm-animal `APPLIED_REQUEST_FILE_SHAS` digest last.
     4. Raise the changed values as new Test change request rows, get a person's approval, and apply them in a `tester` commit.
     5. `question-bank` must pass, and CI must be green on the merged head.

     The brief's Notes expected this ("whichever merges second will find its re-pinned values stale"). It is the cost of merging second, not a defect in anyone's work.
   - **Why the tester and not me:** these are new values in pre-existing tests. D-14 reserves those for a person's approval in a tester session. I do not implement.

**Review of the work (no blocking findings)**

- **Every role is in the PR.** expander `70166f3`/`205fdbf`, worker `36872b5`,
  tester `6196ee9`/`dd4b994`/`63c7e84`/`0d81fd2`, orchestrator `runs/` commits.
- **Lanes.**
  - The expander touched only the brief.
  - The worker touched only the two docstrings and the brief.
  - The tester touched no source.
  - Every pre-existing test edit is in tester commit `63c7e84` and matches rows 1-5, which Dkaattae approved.
- **The wording.** Both docstrings read in the voice of their file and carry E-14's meaning. The conftest reason no longer leans on the spec at all, which is the better fix. `assert_matches`, the `# -- contract assertions` comment and the test names are untouched.
- **Suites on `83cdd7a` (pre-conflict):**
  - **CI:** all six jobs green.
  - **Locally:** backend 1051 passed, 9 skipped; question-bank 2713 pass, 0 fail.
- **Envelope (for the next pass):**
  - No dependency.
  - No `openapi.yaml`, migration or plan change.
  - No text a child will read.
  - `CI fix: none`, and no product decision.
  - Test changes approved by a person.

**Non-blocking findings (the approving reviewer's sweep queues them)**

1. **`conventions.md:16` still says `openapi.yaml` is "the contract between frontend and backend; follows the backend once both are built".**
   - Same drift one file over, and "once both are built" is stale.
   - Pinned by `question-bank/src/climate-koppen.criteria.test.ts:302`.
   - **Becomes a new S task** (T-105 in `b7e040b`). No existing task owns `conventions.md`.
2. **`test_t104_tester_criteria.py` quotes the kept conftest paragraphs word for word.**
   - A later task that rewords those paragraphs will pay a Test change request row.
   - **Recorded as a P-17 recurrence**, not a task.

**Flags disposed of**

- **Rows 3-4 come back on every task:** goes on P-17, which already owns the "exempt `tasks/` and `runs/`" option.
- **Merge order with T-103:** T-103 merged first. That is finding 1.
- **`uv run mypy .` stops on a module-path error:** it fails on `main` too and mypy is not a gate, so it is not queued.

## Notes

**Survey (expander, 2026-11-07).**

- **Not yet done.** On `main` at `dca80da`, `backend/tests/test_contract.py:3`
  reads "`openapi.yaml` is the contract between this backend and `frontend/`",
  and `backend/tests/conftest.py:3-5` reads "routing, validation and
  serialisation are part of what the contract promises". Nothing else in the
  repo quotes either phrase except the `tasks.md` entry itself, so no existing
  test pins this wording.
- **The target wording already exists elsewhere.** `test-guidelines.md` around
  line 266 ("`openapi.yaml` follows the backend", E-14) and
  `engineering-decisions.md` E-14 (amended by P-8: "a file to update, not a
  promise to defend") are the meaning the docstrings should carry. Copying the
  idea is fine; copying the exact sentence is not required.
- **The `assert_matches` docstring ("nothing the contract does not declare")
  is left alone** on purpose. It uses "contract" as a name for the file and
  says nothing about who follows whom; renaming it or the `test_*_contract*`
  functions would churn test IDs for no gain. Criterion 3 freezes them.

**Expected test cost (P-17).** `backend/` sits under several whole-tree and
per-file digest pins from earlier tasks (for example
`question-bank/src/refresh-regenerate-reminder-verify.test.ts`
`MAIN_BOUNDARY_SHA`, `farm-animal-loose-ends-verify.test.ts`,
`climate-cold-trade-accepted-verify.test.ts`, and the frontend tree digests
T-047 tripped). Editing `backend/tests/conftest.py` and `test_contract.py` will
almost certainly turn some of them red even though no behaviour changes. The
worker lists them under **Tests made stale**; the tester raises the Test change
request. Plan to attend the tester step.

**Merge order with T-103 (in flight, PR #128).** T-103 adds backend tests on
another branch and will re-pin the same whole-tree digests. Whichever merges
second will find its re-pinned values stale against `main`; the reviewer of the
second should expect one more re-pin round. This task does not depend on T-103.

**Rules that bite.** No new dependency. No network in tests. Any test the
tester adds for criteria 1–3 asserts properties of the docstrings and the AST
comparison, not a sha256 of either file (P-17).

**Worker (2026-11-07).**

- **Kept "contract" out of the new conftest sentence.** The first paragraph now gives its own reason: the client sees routing, validation and serialisation. The E-14 sentence follows it. That way the reason does not depend on the spec at all.
- **Did not guess at sha values the run did not show.** For the two count pins I could only observe the counts, so the tester has to read the sha after re-pinning the count.
