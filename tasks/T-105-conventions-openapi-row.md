# T-105 — `conventions.md` still calls `openapi.yaml` "the contract"

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-11-09, unattended run. See `runs/T-105-conventions-openapi-row.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-105
**Branch:** `claude/fervent-ptolemy-4py2eg`
**PR:** #130, opened draft at expand time; stays draft until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-09 | cse_011oDiJbsZTbExMiPULZMiFd |

> **Light brief** (`process.md`, "The light path, for S-sized tasks"). T-105 is
> `S`, touches neither `openapi.yaml` nor a migration, the plan, nor any text a
> child reads, and fits in four criteria. Goal, Out of scope, Constraints and
> Context are dropped; the few rules that bite are in **Notes** below.

## Acceptance criteria

Frozen once approved. "The `openapi.yaml` row" means the line of `conventions.md`
matching `/^openapi\.yaml\s/` inside the `## Layout` code block (today line 16).
"Base" means `0b78dec`, this branch's base on `main`.

1. **The `openapi.yaml` row says it follows the backend, not that it is a
   contract.** There is still exactly one line in `conventions.md` matching
   `/^openapi\.yaml\s/`. That line does not contain the word `contract`
   (case-insensitive) and does not contain `once both are built`. It does contain
   `follows the backend` and the string `E-14` (as a whole word, `\bE-14\b`).
2. **Nothing else in `conventions.md` changes.** Every line of `conventions.md`
   other than the `openapi.yaml` row is byte-identical to `conventions.md` at
   base, in the same order, and the file has the same number of lines. In
   particular the `backend/` row's "once built, the frontend on the same origin"
   is left as it is (see Notes). The `openapi.yaml` row's description starts in
   the same column as the other Layout rows' descriptions (column 18, after
   `openapi.yaml` and padding spaces).
3. **The worker changes no other file.** The worker's commits touch only
   `conventions.md` and this brief. Verified at hand-off by
   `git diff --stat 0b78dec..HEAD` recorded in the Verdict, not by a new
   committed digest pin (P-17).
4. **The whole suite is green at the end, and pre-existing tests moved only by
   approval.** `make -C backend check`, and `bun test`, `bun run typecheck` and
   `bun run lint` in both `frontend/` and `question-bank/`, pass on the final
   tree. Every pre-existing test that is deleted or modified on this branch —
   including `question-bank/src/climate-koppen.criteria.test.ts` ›
   "T-067 criterion 17 …", which asserts the row contains
   `the contract between frontend and backend` — is changed only by an approved
   row of this brief's Test change request (D-14, D-15). A modified criterion-17
   test still asserts that the row exists exactly once and mentions `E-14`.

## Handoff

## Verdict

## Notes

**Expander survey (2026-11-09), so nobody re-derives it:**

- **Nothing here is already done.** `conventions.md:16` still reads "the contract
  between frontend and backend; follows the backend once both are built
  (engineering-decisions.md E-14)". `engineering-decisions.md` E-14 (line 687) and
  `CLAUDE.md`'s opening paragraph already say what the row should say:
  `openapi.yaml` follows the backend, and is not a contract to protect.
- **Expected stale test: one by name, plus whole-tree pins.**
  - `question-bank/src/climate-koppen.criteria.test.ts:296-305`, "T-067 criterion
    17", `toContain("the contract between frontend and backend")`. Criterion 1
    makes this red by design. The worker lists it under **Tests made stale**; it
    does not edit it.
  - **The whole-tree pins (P-17).** `conventions.md` is already in the allowed
    sets of `farm-animal-loose-ends-verify.test.ts` and
    `climate-cold-trade-accepted-verify.test.ts`, but this brief
    (`tasks/T-105-…`) and the orchestrator's `runs/T-105-…` are new tracked files,
    so the `MAIN_UNTOUCHABLE_*` count and sha pins in both, and possibly
    `refresh-regenerate-reminder-verify.test.ts`'s boundary sha, are expected to
    go red. T-104's brief (`git show b6477e5^:tasks/T-104-contract-docstrings.md`)
    shows the exact family. **Run all three suites, not only the one you touched**
    (P-17's recurrence notes): the tester should plan for an attended Test change
    request.
- **Other tests that read `conventions.md`** and must stay green (none of them
  reads line 16, but criterion 2 keeps the rest of the file byte-identical
  anyway): `frontend/src/conventions-doc.test.ts`,
  `frontend/src/format-gate.criteria.test.ts`,
  `frontend/src/level-window-claim.criteria.test.ts`,
  `question-bank/src/committed-bank.test.ts`, `prettier-gate.test.ts`,
  `lint-gate.test.ts`, `refresh-verify.test.ts`,
  `refresh-regenerate-reminder-verify.test.ts`,
  `purge-sample-data-verify.test.ts`, `backend/tests/test_t040_tester_criteria.py`.
- **Wording is the worker's.** Something like "describes the API; follows the
  backend, which is the source of truth (engineering-decisions.md E-14)" meets
  criterion 1. The word `contract` is banned outright so no rewording can keep
  the old meaning.

**Out of scope, for the reviewer to queue if worth it (not this branch):**

- `README.md:32` ("The contract between the frontend and the backend. Both sides
  are tested against it") and `README.md:215` (layout block, "the contract between
  frontend and backend") say the same stale thing. `README.md` is under its own
  tests (T-058, T-062), so it is a separate task.
- `geoquizdataplan.md:648` calls `openapi.yaml` the contract. The plan changes only
  when its reasoning is wrong (`process.md` step 6.5), and touching it leaves the
  light path.
- `conventions.md:9`'s `backend/` row says it serves the frontend "once built".
  It does, since the Docker image (T-049), so that phrase is also stale, but the
  queue entry names only line 16 and criterion 2 freezes line 9.
