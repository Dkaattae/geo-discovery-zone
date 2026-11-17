# T-116 — Source comments and one 422 `detail` stop calling `openapi.yaml` "the contract"

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-11-17, unattended run. See `runs/T-116-source-contract-wording.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-116
**Branch:** `claude/epic-shannon-s86cuf`
**PR:** #148, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-17 | cse_011oDiJdNiAkMCtdKuibGJLt |

> **Not the light path.** T-116 is sized S, but the 422 `detail` string reaches a
> screen: `ApiError.displayMessage` (`frontend/src/lib/api/client.ts:63-66`)
> returns `problem.detail` first, and `frontend/src/routes/index.tsx:262` renders
> it. Text a child may read rules the light path out (`process.md`, "The light
> path").

## Goal

E-14 made the backend the source of truth and `openapi.yaml` a description that
follows it. T-104–T-106 and T-115 fixed the docs; the source still calls the file
"the contract" in about twenty comments and in one served error string, which
tells the next reader the opposite of E-14.

## Acceptance criteria

**Frozen once approved.**

Definitions used below:

- **In-scope source file**: any `*.py` file under `backend/app/` (recursively), and
  any `*.ts` or `*.tsx` file under `frontend/src/` or `question-bank/src/`
  (recursively) whose name does **not** end in `.test.ts`, `.test.tsx` or
  `.snapshot.ts`. `node_modules/` and `__pycache__/` are not in scope.
- **The validation 422**: the response the backend sends when FastAPI's request
  validation fails (`RequestValidationError`), e.g. `POST /api/v1/profiles` with a
  body that is not valid JSON or lacks a required field.

1. **No in-scope source file contains the substring `contract`**, matched
   case-insensitively (so `Contract`, `contracts`, `contract's` all count). At
   expand time this is false in at least these places, which is the work list,
   not a limit on it:
   `backend/app/auth.py:3`, `content_build.py:13`, `frontend.py:11`,
   `grading.py:4`, `levels.py:49`, `main.py:3`, `main.py:11`, `main.py:116`,
   `orm.py:335`, `problems.py:3`, `problems.py:6`, `routers/__init__.py:1`,
   `routers/auth.py:4`, `routers/content.py:3`, `routers/content.py:7`,
   `serializers.py:1`, `serializers.py:5`, `store.py:198`;
   `frontend/src/lib/api/client.ts:188`, `frontend/src/lib/api/types.ts:5`;
   `question-bank/src/seed-level.ts:87`.
   (`routers/auth.py:4`, `serializers.py:1` and `types.ts:5` are not in the
   `tasks.md` entry's list; they were found at expand time and are in scope.)
2. **Every edited comment still says what it said, with `openapi.yaml` (or "the
   spec", where `openapi.yaml` is already named nearby) in place of "the
   contract".** No comment is deleted outright to satisfy criterion 1, and no
   edited comment newly claims that the backend must conform to `openapi.yaml`.
   *(Checked by reading the diff; T-115's "`openapi.yaml` or 'the spec'" choice
   is the precedent.)*
3. **The validation 422's `detail` no longer contains `contract`
   (case-insensitive), nor `openapi`, `spec` or `schema`**, is a non-empty
   single sentence in plain English, and still says the request was not valid.
   The exact wording is the worker's choice within those bounds.
4. **Everything else about the validation 422 is unchanged:** status `422`,
   `Content-Type: application/problem+json`, `title` `"Validation failed"`,
   `instance` equal to the request path, and an `errors` array with the same
   entries (same `path` and `message` per field) as before the change.
5. **No other served response changes.** No other status code, `title`,
   `detail`, header or body produced by `backend/app/` differs from `main`; the
   only string literal whose value changes anywhere in in-scope source files is
   the 422 `detail` from criterion 3. Everything else in the diff is comments
   and docstrings.
6. **No test file that existed before this task is modified or deleted** —
   including `frontend/src/lib/api/client.test.ts` (its line-43 test name says
   "contract"), `backend/tests/test_levels.py:102`,
   `backend/tests/test_profiles_api.py:79`, `test_t053_tester_criteria.py`, and
   every `*.snapshot.ts` / `snapshot_*.py` file. If one turns red, it goes to the
   Handoff's "Tests made stale", not into the diff.
7. **No file outside `backend/app/`, `frontend/src/lib/` and `question-bank/src/`
   is changed by the worker**, apart from the brief's Handoff and new test files.
   In particular `openapi.yaml`, `geoquizdataplan.md`, `engineering-decisions.md`
   and everything under `.claude/` are untouched.
8. **No dependency is added, removed or bumped**; no lockfile changes.
9. **Every suite CI runs on a pull request is green** on the PR: frontend,
   question-bank, backend, backend-postgres, integration and e2e.

## Out of scope

- **Test files**, including test *names* that say "contract"
  (`client.test.ts:43`, `test_levels.py:102`, `test_profiles_api.py:79`). They
  may change only through a Test change request, and this task does not need
  them to.
- **`*.snapshot.ts` and `backend/tests/snapshot_*.py`.** Their strings are pins.
  Several snapshot files read `seed-level.ts` (e.g.
  `familiarity-drawn-apart-verify.snapshot.ts:417`,
  `farm-animal-loose-ends-verify.snapshot.ts:336`,
  `hand-check-levels-verify.snapshot.ts:542`); they run in the monthly lane, not
  on a PR. If the worker can see that the `seed-level.ts:87` edit would turn one
  red, name it in the Handoff; do not edit it.
- `geoquizdataplan.md:648` (plan text), `.claude/agents/*` and every other loop
  file, `process*.md`.
- `openapi.yaml` itself. It has no "did not match the contract" example to keep
  in step (checked at expand time).
- `README.md`, `backend/README.md`, `conventions.md` — T-104–T-106 and T-115.
- `frontend/src/` outside `lib/`: no in-scope hit there at expand time. If one
  appears, criterion 1 covers it anyway.
- Any rewording beyond replacing "the contract" — no comment cleanups, no
  refactors, no reflowing untouched paragraphs.
- What the frontend shows for a 422 (`displayMessage`). The new `detail` flows
  through it unchanged.

## Constraints

- **Files expected to change:** the 13 `backend/app/` files named in criterion 1,
  `frontend/src/lib/api/client.ts`, `frontend/src/lib/api/types.ts`,
  `question-bank/src/seed-level.ts`. Optionally a new test file.
- **Invariants:** behaviour unchanged apart from the one `detail` string
  (criteria 4–5). Formatting gates still pass: prettier `format:check` in
  `frontend/` and `question-bank/` (E-16, E-17), and the backend's lint.
- **Before changing the 422 string**, grep `e2e/`, `backend/integration/` and
  `backend/tests/` for it. At expand time nothing outside `main.py` contains
  "did not match"; `client.test.ts:177` uses `title: "Validation failed"` in a
  fixture of its own, which criterion 4 keeps true.
- **Dependencies:** none (CLAUDE.md "Packages").
- **Content rules:** the new `detail` can reach a screen; keep it short and
  plain (criterion 3).

## Context

**Required reading for the worker and the tester.**

- `engineering-decisions.md` **E-14** (line 687) — why `openapi.yaml` is not "the
  contract".
- `tasks.md` §E, **T-116** — the queue entry and its leave-alone list.
- `PROGRESS.md`, the **T-115** entry — the "`openapi.yaml` or 'the spec'" wording
  precedent this task follows.
- `backend/app/main.py:111-120` — `handle_validation_error`, the validation 422.
- `backend/app/problems.py` — `problem_body` / `problem_response`.
- `frontend/src/lib/api/client.ts:63-66` (`displayMessage`) and
  `frontend/src/routes/index.tsx:262` — where a `detail` reaches the screen.
- `test-guidelines.md` — how to test the 422 (criteria 3–4) below the transport,
  without network.
- `conventions.md` — commands for each package's suite, format and lint.

## Handoff

## Verdict

## Notes

- Expand-time survey: every hit was found with a case-insensitive search for
  `contract` across `backend/app/`, `frontend/src/` and `question-bank/src/`.
  Outside the in-scope files listed in criterion 1, the only hits are test and
  snapshot files, which stay as they are.
