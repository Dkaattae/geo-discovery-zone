# T-115 — `backend/README.md` still calls `openapi.yaml` "the contract"

**Status:** `approved`
**Next step:** `human` (merge PR #145)
**Approved:** orchestrator — 2026-11-16, unattended run. See `runs/T-115-backend-readme-contract-wording.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-115
**Branch:** `claude/epic-shannon-s86cuf`
**PR:** #145, opened draft at expand time from the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-16 | cse_011oDiJdNiAkMCtdKuibGJLt |
| worker | 2026-11-16 | cse_011oDiJdNiAkMCtdKuibGJLt (as echoed by `$CLAUDE_CODE_REMOTE_SESSION_ID`; same value as the expander's row — the orchestrated run shares one remote session id, the worker ran as a separate subagent) |
| tester | 2026-11-16 | cse_011oDiJdNiAkMCtdKuibGJLt (same shared id; orchestrated run — `runs/T-115-…` exists; freshly spawned subagent, see Verdict) |
| reviewer | 2026-11-16 | cse_011oDiJdNiAkMCtdKuibGJLt (same shared id; freshly spawned subagent) |

> **Light brief for an `S` task** (`process.md`, "The light path", D-6). Four
> criteria. It touches no `openapi.yaml`, no migration, no plan text and no text a
> child reads. Goal, Out of scope, Constraints and Context are dropped. The
> **Notes** below hold the survey and the limits a worker needs.

## Acceptance criteria

Frozen once approved. "Baseline" means `main` at `45e8124` (the merge of PR #144).

1. **`backend/README.md` has no "contract".** A case-insensitive search for
   `contract` in `backend/README.md` matches zero lines. At baseline it matches
   seven, at lines 4, 50, 81, 165, 214, 226 and 244, and every one of them refers to
   `openapi.yaml`.
2. **Nothing else in `backend/README.md` moves.** Every line that differs from
   baseline sits inside a block that held one of those seven lines. A block is a
   paragraph, a list item or a fenced code block, bounded by blank lines. Each
   rewritten sentence keeps its meaning, with `openapi.yaml` (or a phrase naming
   it, such as "the spec") where "the contract" stood. In particular:
   - line 4 still says every operation in `openapi.yaml` is served;
   - line 165 still says it had no security scheme and that this added one;
   - line 214 (`serializers.py`) is still one line in the layout code block, and
     that block has the same number of lines as at baseline;
   - `backend/tests/test_t051_tester_criteria.py::test_c7_no_file_says_map_click_is_withheld`
     still passes for `backend/README.md`.
3. **The "Where the app is today" table in `tasks.md` has no "contract".** The
   table's header row and its **Backend** row match `contract` case-insensitively
   zero times. At baseline they read `Contract / plan describes` and
   `all 29 contract operations`.
   - The header's third column still names both `openapi.yaml` and the plan.
   - The Backend row still says 29 operations and "SQLite or Postgres".
   - Every other row of that table is byte-identical to baseline.
4. **Docs only.** The PR changes no file under `backend/app/`, `backend/migrations/`,
   `frontend/`, `question-bank/`, `e2e/` or `.github/`. It does not change
   `openapi.yaml`, `engineering-decisions.md`, `process*.md` or `CLAUDE.md`, and
   no lockfile or dependency list. It modifies or deletes no test that existed at
   baseline. The tester may add new test files.

## Notes

**Survey (expander, 2026-11-16).** Nothing is done yet. All seven "contract" lines
in `backend/README.md` are as the queue entry says, and so are the two table rows
in `tasks.md` (lines 117 and 124 at baseline). The same fix was made elsewhere by
T-104 to T-106 (`PROGRESS.md` has their entries). It rests on
`engineering-decisions.md` E-14: `openapi.yaml` follows the backend and is not a
contract to protect.

**Limits for the worker**, all from the queue entry:

- **Leave the rest of `tasks.md` alone.** That covers its sweep paragraph (line 91
  quotes "the contract") and T-115's own queue entry, both owned by the reviewer's
  sweep. Leave all other files alone too.
- **Don't rewrite beyond the word.** A re-wrapped paragraph is fine, and so is a
  changed sentence inside one of the seven blocks. Fixing anything else you notice
  in `backend/README.md` is not part of this task. Queue it.
- **No CI pin is known to break.** The only CI test that reads `backend/README.md`
  is `test_t051_tester_criteria.py::test_c7`. It forbids "until T-051",
  "joins in T-051", and "withheld" or "not served" on a line that mentions
  `map_click`. No CI test reads the `tasks.md` table. Monthly snapshot-lane pins
  (`*.snapshot.ts`, `backend/tests/snapshot_*.py`) do not run on a PR. If a
  pre-existing test does go red, list it under **Tests made stale**. Do not change
  it yourself.
- Line 165's sentence is history ("as written had no security scheme"). Keep it
  as history and name `openapi.yaml`.

**Worker (2026-11-16).** Mechanical; no surprises. Judgment call: where the sentence already links or names `openapi.yaml` nearby (L4, L81, L166, L244) I used "the spec" to avoid repeating the filename; elsewhere the filename. Owner to confirm or overturn: reviewer.

## Handoff

**TL;DR:** Seven "contract" lines in `backend/README.md` and the two table rows in
`tasks.md` now name `openapi.yaml` (or "the spec"). Docs only, two files. Backend
suite, ruff and question-bank tests are green; frontend tests/typecheck could not run
here because `bun install` hit proxy 403s — environmental, not caused by this diff.

**What changed, file by file**

- `backend/README.md` — seven edits, one per baseline line:
  - L4: "Every operation in the contract is served" → "…in the spec is served" (L3 links `openapi.yaml` right before it).
  - L50: "the contract's field names" → "`openapi.yaml`'s field names".
  - L81: "the contract's problem document" → "the spec's problem document".
  - L165–166: "The contract as written had no security scheme. This adds one, and `openapi.yaml` was updated to match" → "`openapi.yaml` as first written had no security scheme. This adds one, and the spec was updated to match". L166 is in the same paragraph; kept as history.
  - L214: "record → contract payload" → "record → openapi.yaml payload". Still one line; code block line count unchanged.
  - L226: "The rules the contract states in prose" → "The rules `openapi.yaml` states in prose".
  - L244: "matching the contract's `style: form, …`" → "matching the spec's `style: form, …`".
- `tasks.md` — only L117 (header: "`openapi.yaml` / plan describes") and L124 (Backend: "all 29 `openapi.yaml` operations, SQLite or Postgres"). Sweep paragraph (L91) and T-115's queue entry untouched.
- This brief: Status, Next step, Sessions row, Handoff, Notes.

**Where each criterion lives**

| # | Where | How to check |
|---|---|---|
| 1 | `backend/README.md` | `grep -ci contract backend/README.md` → 0 |
| 2 | same | `git diff -U0 45e8124 -- backend/README.md`: hunks at 4, 50, 81, 165–166, 214, 226, 244 only |
| 3 | `tasks.md` L117, L124 | `git diff -U0 45e8124 -- tasks.md`: two lines |
| 4 | whole PR | `git diff --stat 45e8124`: `backend/README.md`, `tasks.md`, this brief, `runs/T-115-…` (orchestrator's) |

**Deliberately not done:** nothing else in either file reworded; no tests added (pure wording; the criteria are greps the tester can pin).

**Contradictions with the brief:** none.

**How to run:** `make -C backend test lint format-check` — 785 passed, 9 skipped; ruff clean, 67 files formatted. `cd question-bank && bun test` — 229 pass, 0 fail; typecheck clean. Frontend: `bun install --frozen-lockfile` failed with `ProxyConnectFailed (403)` on `react-simple-maps`, `d3-geo`, `d3-color`, so `bun test` shows 4 fails ("Cannot find package 'react-simple-maps'") and typecheck shows the matching TS2307s. No frontend file is touched; the tester should rerun in an environment that can install.

**Tests made stale:** none. `test_t051_tester_criteria.py::test_c7_no_file_says_map_click_is_withheld` passes (in the backend run above).

## Verdict

**TL;DR: pass.** All four criteria met, each checked by hand (they are doc wording
and repo shape, which `test-guidelines.md` says are never tested). No test added.
Backend, question-bank and the PR's CI (frontend included) are green.

**Independence.** Orchestrated run: every role shares session id
`cse_011oDiJdNiAkMCtdKuibGJLt`, so the Sessions-table check cannot show anything.
My independence rests only on being a freshly spawned subagent with its own context:
I did not see the work done or the worker's reasoning. That rests on the
orchestrator having spawned me correctly, not on anything I could check myself, so it is weaker
evidence than a separate session.

| # | Verdict | Evidence (by hand) |
|---|---|---|
| 1 | met | `grep -ci contract backend/README.md` → `0`. Baseline `git grep -n -i contract 45e8124 -- backend/README.md` → lines 4, 50, 81, 165, 214, 226, 244, as the criterion says. |
| 2 | met | `git diff -U0 45e8124 HEAD -- backend/README.md`: hunks at 4, 50, 81, 165–166, 214, 226, 244 only. 166 is the same paragraph as 165. L4 still says "Every operation in the spec is served" (L3 links `openapi.yaml`). L165 is still history: "`openapi.yaml` as first written had no security scheme. This adds one". L214 is one line, and its fenced block is 23 lines at baseline and at HEAD (awk count). `pytest tests/test_t051_tester_criteria.py -k test_c7` → 3 passed. |
| 3 | met | `git diff -U0 45e8124 HEAD -- tasks.md`: only L117 and L124 changed. The header now reads "`openapi.yaml` / plan describes", which names both. Backend row: "all 29 `openapi.yaml` operations, SQLite or Postgres". `grep -i contract` on lines 115–130 → none. Other rows byte-identical, since there are no other hunks. |
| 4 | met | `git diff --name-only 45e8124 HEAD` → `backend/README.md`, `tasks.md`, this brief, `runs/T-115-…`. A grep for the forbidden paths (`backend/app`, `backend/migrations`, `frontend`, `question-bank`, `e2e`, `.github`, `openapi.yaml`, `engineering-decisions`, `process*`, `CLAUDE.md`, lockfiles, `pyproject`, `package.json`, `tests/`) matched nothing. |

**Suite as run**

- **Backend** under the dead-proxy guard: `uv run pytest` → 785 passed, 9 skipped. `ruff check` → all checks passed. `ruff format --check` → 67 files already formatted.
- **question-bank**: `bun test` → 229 pass, 0 fail. `bun run typecheck` → clean.
- **frontend**, local: not runnable. `bun install --frozen-lockfile` → `ProxyConnectFailed (403)` (`@types/d3-selection`, `d3-timer`), so `bun test` gives 4 fails, all "Cannot find package 'react-simple-maps'", and typecheck gives matching TS2307s. This is environmental: `git diff --quiet 45e8124 HEAD -- frontend` shows no change.
- **PR #145 CI** on the worker's commit `a3103e9` (REST check-runs): frontend, backend lint/format/test, backend postgres, question-bank, integration and the halt check all `success`. On HEAD `c152957`, which adds only the run log, the same jobs were green or still in progress when I checked.

**Tests added:** none. Every criterion is doc wording or repo shape (`test-guidelines.md`: backend never tests doc wording or repo shape; the `tasks.md` table is the same kind).
**Pre-existing tests changed:** none. **Test change request:** none.

## Review

**TL;DR: approve, inside the envelope — PR #145 marked ready with no escalation.**
Nine wording edits in two docs, each one the minimal swap of "the contract" for
`openapi.yaml` or "the spec". Nothing else moved. Swept in this branch.

- **Every role's work is in the PR.** Sessions rows: expander, worker, tester. Commits:
  `8183549`/`8e82341` expander, `a3103e9` worker, `7936084` tester, plus the
  orchestrator's run-log and stamp commits. Nothing stranded.
- **Lanes held (D-7).** Expander touched only the brief. Tester touched only the
  brief. Worker touched `backend/README.md`, `tasks.md` (L117, L124 only) and the
  brief. Orchestrator touched only `runs/` and the brief's `Approved:` line.
- **Fit and scope.** No rewording beyond the word, no re-wrap. `serializers.py  record → openapi.yaml payload`
  sits inside a fenced layout block, so the missing backticks are correct there.
- **Docs true.** Every rewritten sentence still says what it said. L165 stays history.
- **Honesty.** No test added, changed or skipped; frontend local failures are the
  known proxy 403 and the PR's CI ran the frontend job green on `a3103e9`.
- **Worker's flag — decided: accepted.** Using "the spec" where `openapi.yaml` is
  already linked or named in the same sentence or the one before (L4, L81, L166,
  L244) reads better than repeating the filename, and "the spec" is the phrase
  criterion 2 itself offers.

**Envelope (process.md step 6):** tester pass; backend/question-bank green locally,
CI green on the worker's commit; nothing outside Constraints (`runs/` is the
orchestrator's); no dependency; no `openapi.yaml`, migration or plan change; no
child-facing text; no pre-existing test touched (`Test changes: none`); no CI fix
(`CI fix: none`); no product decision. Brief approval was the orchestrator's stamp,
which the envelope does not make an escalation trigger for a docs-only `S` task.

**Non-blocking finding → new task T-116.** About twenty source comments and
docstrings still call `openapi.yaml` "the contract" — `backend/app/` (auth, content_build,
frontend, grading, levels, main, orm, problems, routers, serializers, store),
`frontend/src/lib/api/client.ts:188`, `question-bank/src/seed-level.ts:87` — plus one
served string, `backend/app/main.py:116` "The request did not match the contract."
(the 422 problem `detail`/title; no test pins it). Nothing in the queue owns these, so
one new `S` entry covers them all at once rather than another file-at-a-time chain
(T-104 → T-105 → T-106 → T-115). Left out of it on purpose: `geoquizdataplan.md:648`
(plan text; changes only if its reasoning is wrong), `.claude/agents/*` (loop files;
`process-tasks.md` territory, and there "the contract" reads as "the spec the task
touches"), and snapshot-lane tests whose strings are pins.

