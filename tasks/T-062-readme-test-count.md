# T-062 — One test count in `README.md` is still unasserted

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending` — replace with who approved and the date
**From:** [`tasks.md`](../tasks.md) T-062 · `S`, light brief (`process.md`, D-6)
**Branch:** `claude/happy-shannon-dstj7a` — assigned to the expander's session by
the harness, so it is the task branch (`process.md`, "When the environment names
the branch for you"). Every later role pushes here, whatever branch its own
session starts on; `CLAUDE.md` "Branches" carries the standing permission.
**PR:** #50, draft, built from the branch above
**Fault:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-18 | 01YP7QezsJVN7pxQyV1scM6g |

## Acceptance criteria

*Survey, as of `eea566a`. `README.md:193` reads "The nine Postgres-only tests
skip on SQLite, so nobody needs a database installed to run `make -C backend
check`." — the queue entry cites `:192`, which is the `GEO_TEST_DATABASE_URL`
line; the sentence has drifted one line down. It is the **only** count of tests,
suites, journeys, checks or cases anywhere in `README.md`. It is true today:
`backend/tests/test_postgres.py` defines exactly 9 `test_` functions. The
existing guard, `frontend/src/conventions-doc.test.ts:554-558` ("no digit count
of tests appears in the Checks code block"), does not reach it on two counts —
it looks only inside the fenced block, and only for digits.*

1. **No count of tests in `README.md` survives unpinned.** It is not possible for
   `backend/tests/test_postgres.py` to change size while `README.md` states a
   number that no longer matches it *and* every suite stays green. Boundary, both
   sides: with that file at its current **9** `test_` functions the whole suite is
   green and `README.md` reads true; add a **10th** and either `README.md` is
   still true as written or a test in `frontend/`'s `bun test` goes red. Either
   route to this — dropping the number, or asserting it — satisfies the criterion;
   the queue entry's reasoning favours dropping it, and that reasoning is not
   binding.

2. **The guard reaches the whole file and words as well as digits.** A sentence
   of the form *"The eleven Postgres-only tests skip on SQLite"* placed anywhere
   in `README.md` — inside the `## Checks` prose, in a different section, outside
   any fenced code block — turns a test in `frontend/`'s `bun test` red. So does
   the same sentence written *"The 11 Postgres-only tests"*. Nine spelled as a
   word in a sentence that is not about a count of tests (there are none today,
   but e.g. "nine states") does not.

3. **The reason a reader needs that sentence survives.** `README.md`'s `##
   Checks` section still states, in prose, both halves of what line 193 carries
   today: that the Postgres-only tests **skip when the database is SQLite**, and
   that **therefore no database server has to be installed** to run `make -C
   backend check`. The literal string `make -C backend check` stays in that
   section, and the `GEO_TEST_DATABASE_URL` override sentence above it
   (`README.md:191-192`) is left intact.

4. **Confined, and green.** The diff touches `README.md` and test files only —
   nothing under `backend/`, `question-bank/`, `e2e/`, or `frontend/src/` that is
   not a test file, and **not** `test-guidelines.md:209` or `PROGRESS.md:161`,
   whose stale counts belong to T-065. No dependency is added to any package. No
   test reaches the network (local file reads only — `test-guidelines.md`, "No
   network in tests, ever"). `cd frontend && bun test && bun run typecheck && bun
   run lint` passes, including every pre-existing assertion in
   `frontend/src/conventions-doc.test.ts`.

## Handoff

Written by `worker` before the tester runs. Always written, even when nothing was
built.

## Verdict

Written by `tester`: pass, fail or blocked, which criterion, and what was
observed.
