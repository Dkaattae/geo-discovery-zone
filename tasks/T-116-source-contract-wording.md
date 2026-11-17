# T-116 — Source comments and one 422 `detail` stop calling `openapi.yaml` "the contract"

**Status:** `pass`
**Next step:** `reviewer`
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
| worker | 2026-11-17 | cse_011oDiJdNiAkMCtdKuibGJLt |
| tester | 2026-11-17 | cse_011oDiJdNiAkMCtdKuibGJLt (orchestrated: fresh subagent, shared session id) |

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

**TL;DR:** all 21 "contract" hits in in-scope source are reworded to `openapi.yaml` / "the spec"; the validation 422's `detail` is now `"Some of the information sent was not valid."`. Backend, frontend and question-bank suites, lint, format and typecheck are green locally; integration and e2e were not run here. **Tests made stale: none.**

**Same session id as the expander.** The orchestrator ran both roles under one remote session (`cse_011oDiJdNiAkMCtdKuibGJLt`), as separate subagents. The tester should judge whether that counts as "the same session" for its independence check (owner: tester, escalate to human if it does).

### What changed, file by file

Each edit swaps "the contract" for `openapi.yaml` (or "the spec" where `openapi.yaml` is named in the same comment). Nothing else in any line moved.

- `backend/app/auth.py:3` — "The contract's Profiles…" → "`openapi.yaml`'s Profiles…"
- `backend/app/content_build.py:13` — "the contract's names" → "`openapi.yaml`'s names"
- `backend/app/frontend.py:11` — "the contract's problem document" → "`openapi.yaml`'s problem document"
- `backend/app/grading.py:4` — "the contract spells out" → "`openapi.yaml` spells out"
- `backend/app/levels.py:49` — "from the contract" → "from `openapi.yaml`"
- `backend/app/main.py:3` — "the contract's local development server" → "`openapi.yaml`'s …"
- `backend/app/main.py:11` — "the contract has no other error shape" → "`openapi.yaml` describes no other error shape" ("has" → "describes" so it reads as a description, not a rule — criterion 2's "no new conformance claim")
- `backend/app/main.py:116` — **the 422 `detail`**: `"The request did not match the contract."` → `"Some of the information sent was not valid."`
- `backend/app/orm.py:335` — "the contract's Entity" → "`openapi.yaml`'s Entity"
- `backend/app/problems.py:3`, `:6` — "Every error the contract describes" / "does not match the contract" → `openapi.yaml`
- `backend/app/routers/__init__.py:1` — "one per tag in the contract" → "in `openapi.yaml`"
- `backend/app/routers/auth.py:4` — "original v1 contract" → "original v1 spec" (`openapi.yaml` is named on line 3)
- `backend/app/routers/content.py:3`, `:7` — "the contract calls" / "in the contract" → `openapi.yaml`
- `backend/app/serializers.py:1`, `:5` — "Record → contract payload" → "Record → `openapi.yaml` payload"; "the contract's camelCase" → "`openapi.yaml`'s camelCase"
- `backend/app/store.py:198` — "the match the contract describes" → "`openapi.yaml` describes"
- `frontend/src/lib/api/client.ts:188` — "Every error the contract describes" → "`openapi.yaml` describes"
- `frontend/src/lib/api/types.ts:5` — "not the whole contract" → "not the whole spec" (`openapi.yaml` named on line 2)
- `question-bank/src/seed-level.ts:87` — "The contract's range" → "The spec's range" (`openapi.yaml` named earlier in the line)
- **New:** `backend/tests/test_t116_validation_detail.py` — two worker tests via the ASGI client (no network): the `detail` has no forbidden word, is one sentence, says "not valid"; and status, content type, `title`, `instance`, `errors[].path` are as before. The first one fails with `main.py` reverted (checked).

### Where each criterion lives

| # | Where |
|---|---|
| 1 | `grep -rniI contract backend/app frontend/src question-bank/src --include='*.py' --include='*.ts' --include='*.tsx'` minus `.test.ts(x)` / `.snapshot.ts` → no hits |
| 2 | The diff: 20 comment/docstring lines, one-for-one |
| 3 | `backend/app/main.py:116` |
| 4 | `handle_validation_error` otherwise untouched; `_field_error` untouched |
| 5 | Only string literal changed is `main.py:116`; everything else is comments/docstrings |
| 6 | No pre-existing test file touched |
| 7 | Only `backend/app/`, `frontend/src/lib/`, `question-bank/src/`, the brief, and one new test file |
| 8 | No `package.json`, `bun.lock`, `pyproject.toml`, `uv.lock` change |
| 9 | Local: see below. CI on PR #148 is the authority for integration and e2e |

### Checks run

- **backend:** `uv run ruff check .` clean, `uv run ruff format --check .` clean, `uv run pytest -q` → 787 passed, 9 skipped
- **frontend:** `bun run typecheck`, `lint`, `format:check` clean; `bun test` → 248 pass, 0 fail
- **question-bank:** `bun run typecheck`, `lint`, `format:check` clean; `bun test` → 229 pass, 0 fail
- **Not run:** integration and e2e (need docker-compose / Chromium). Before editing, `grep -rn "did not match"` over `e2e/`, `backend/integration/`, `backend/tests/` found nothing, so neither pins the old `detail`.

### Snapshot lane (`seed-level.ts:87` edit)

Ran the four snapshot files that read `seed-level.ts` (`seed-level-loose-ends-verify`, `hand-check-levels-verify`, `farm-animal-loose-ends-verify`, `familiarity-drawn-apart-verify`) with and without the edit: the **same 12 tests fail either way** (stale historical pins against old SHAs and deleted files — e.g. T-025 c15/c17, T-085a c23/c24, T-096 c20/c21). None reads the comment at line 87; they read export signatures, the `concept_load` doc block, and the export list. The edit turns nothing red there.

### Deliberately not done

- No test names touched (`client.test.ts:43`, `test_levels.py:102`, `test_profiles_api.py:79`) — out of scope.
- No reflowing or other rewording; no change to `displayMessage`.

### Contradictions with the brief

- None in the criteria. Minor: the brief's Status read `awaiting approval` while **Approved** carried the orchestrator line; treated as approved per the worker rules.

### Tests made stale

None.

## Verdict

**TL;DR: pass.** All nine criteria are met. Ten new tester tests for criteria 3–4 pass; the full backend, frontend and question-bank suites, lint, format and typecheck are green. On PR head `25ac5b6`, all six CI checks are green, e2e included. The reviewer confirms CI on the final head.

**Independence (read this before trusting the pass).** This is an orchestrated run (`runs/T-116-source-contract-wording.md` exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJdNiAkMCtdKuibGJLt`, the same id listed for expander and worker, so the session check **cannot** show separation here. It is neither passed nor failed. My independence rests only on being a freshly spawned subagent with its own context: I did not see the worker's conversation or reasoning. That is weaker than a separate session, because it depends on the orchestrator having spawned me correctly.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met (by hand) | `grep -rniI contract backend/app frontend/src question-bank/src --include='*.py' --include='*.ts' --include='*.tsx'`, excluding `.test.ts(x)` / `.snapshot.ts` / `node_modules` / `__pycache__`, returns **no hits** |
| 2 | met (by hand) | Read every hunk of `git diff origin/main...HEAD -- backend/app frontend/src question-bank/src`: 20 comment/docstring lines, each a one-for-one swap of "the contract" for `openapi.yaml` / "the spec". No comment was deleted, and none newly claims conformance. One judgment call for the reviewer: `main.py:11` also changes "has" to "describes", which softens the line and adds no claim |
| 3 | met (test) | `test_criterion_3_validation_detail_is_one_plain_sentence_saying_not_valid` × 5 cases. Detail is `"Some of the information sent was not valid."`. **Red against `origin/main`** (5 failed), green on branch |
| 4 | met (test) | `test_criterion_4_rest_of_validation_422_is_unchanged` × 5 cases. Each checks the exact `content-type`, `status`, `title`, `type`, `instance`, the key set, and `errors` **equal to values recorded by running the same requests on `origin/main`**. The cases are missing field, non-JSON body, wrong types, empty body, and bad query param. A mutation of `title` → `"Validation failedX"` turned it red (reverted) |
| 5 | met (by hand) | Full-response probe of the 5 cases, main vs branch: the only diff is `detail`. Python AST compare of every non-docstring constant in `backend/app/` (main vs branch) found the single change `main.py: 'The request did not match the contract.' -> 'Some of the information sent was not valid.'`. The TS diffs are comment-only |
| 6 | met (by hand) | `git diff --name-status origin/main...HEAD`: only `A` for test files (`test_t116_validation_detail.py`, worker; `test_t116_tester_criteria.py`, tester). No `M`/`D` on any pre-existing test or snapshot |
| 7 | met (by hand) | Worker commit `cd5302e` touches only `backend/app/`, `frontend/src/lib/`, `question-bank/src/`, the brief and one new test. `runs/…` is the orchestrator's. `openapi.yaml`, `.claude/`, plan and decision files are untouched |
| 8 | met (by hand) | No `package.json`, `bun.lock`, `pyproject.toml` or `uv.lock` in the diff |
| 9 | met | PR #148 head `25ac5b6`: question-bank, frontend, backend, backend (postgres), integration and e2e (playwright) were all `success`. The tester commit `f9268b5` adds only a test file and the brief, and it triggers a fresh run that the reviewer checks |

**Suite as run locally (branch + tester test):**

- **backend:** `uv run ruff check .` clean, `uv run ruff format --check .` clean, `uv run pytest -q` → **797 passed, 9 skipped**
- **frontend:** `bun run typecheck`, `lint`, `format:check` clean; `bun test` → **248 pass, 0 fail**
- **question-bank:** `bun run typecheck`, `lint`, `format:check` clean; `bun test` → **229 pass, 0 fail**
- **Not run locally:** integration and e2e (CI is the authority)

**Mutations / falsifiability:** the criterion-3 tests were run against `origin/main` in a temporary worktree and went red, as they should. A `title` mutation on the branch turned the criterion-4 tests red. Both were reverted, and the worktree was removed.

**Tests made stale:** none found. No pre-existing test went red.

**New file:** `backend/tests/test_t116_tester_criteria.py`.

## Notes

- Expand-time survey: every hit was found with a case-insensitive search for
  `contract` across `backend/app/`, `frontend/src/` and `question-bank/src/`.
  Outside the in-scope files listed in criterion 1, the only hits are test and
  snapshot files, which stay as they are.
- Worker: the 422 wording "Some of the information sent was not valid." was picked to avoid "request" (jargon to a child) while still saying the request was invalid (criterion 3). Owner to confirm or overturn: reviewer.
- Worker: in `main.py:11` "has no other error shape" became "describes no other error shape" — "`openapi.yaml` has" read as if the file defined behaviour. Owner: reviewer, against criterion 2.
