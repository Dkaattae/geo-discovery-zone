# T-115 — `backend/README.md` still calls `openapi.yaml` "the contract"

**Status:** `awaiting approval`
**Next step:** `worker`
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

## Handoff

## Verdict
