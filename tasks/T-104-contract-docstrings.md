# T-104 — Two backend test docstrings still call `openapi.yaml` "the contract"

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-104
**Branch:** `task/T-104-contract-docstrings`
**PR:** #129, opened draft at expand time; stays draft until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-07 | cse_011oDiJbsZTbExMiPULZMiFd |

> **Light brief** (`process.md`, "The light path, for S-sized tasks"). T-104 is
> `S`, touches neither `openapi.yaml` nor a migration, the plan, nor any text a
> child reads, and fits in four criteria. Goal, Out of scope, Constraints and
> Context are dropped; the few rules that bite are in **Notes** below.

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

## Verdict

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
