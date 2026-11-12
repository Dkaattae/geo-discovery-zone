# T-106 — `README.md` and `PROGRESS.md` still call `openapi.yaml` "the contract"

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-106
**Branch:** `claude/youthful-galileo-hn6hh1`
**PR:** #NN, opened draft at expand time; stays draft until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB |

> **Full brief, not light.** T-106 is `S`, but its criteria run past four (three
> files, four lines, plus the boundaries), so the light path does not apply
> (`process.md`, "The light path, for S-sized tasks").

## Goal

Three docs still describe `openapi.yaml` as "the contract" between frontend and
backend, which E-14 withdrew, and `conventions.md` still says the backend serves
the frontend "once built", which has been true since T-049. Bring the four lines
into line with E-14 and the tree, so a reader is not told something false.

## Acceptance criteria

Frozen once approved. **Base** means `5f6f811`, this branch's base on `main`.
"The Layout block" of a file means the lines strictly inside the first fenced
code block after that file's `## Layout` heading.

**Already true, not to be redone:** `conventions.md`'s `openapi.yaml` row
(line 16) already says it follows the backend and cites E-14 (T-105, PR #130).
`PROGRESS.md:26` already cites E-14; only its "the contract" wording is stale.

1. **`README.md`'s Tech stack row for `openapi.yaml` no longer calls it a
   contract.** Under `## Tech stack` there is exactly one table row whose first
   cell is `` `openapi.yaml` `` (a line starting `` | `openapi.yaml` | ``). That
   row does not contain `contract` (case-insensitive) and does not contain
   `Both sides` (case-insensitive) — the frontend is not tested against
   `openapi.yaml`. It does contain `follows the backend` and `E-14` as a whole
   word (`\bE-14\b`).
2. **`README.md`'s Layout line for `openapi.yaml` no longer calls it a
   contract.** The Layout block of `README.md` contains exactly one line matching
   `/^openapi\.yaml\s/`. That line does not contain `contract`
   (case-insensitive), and does contain `follows the backend` and `\bE-14\b`.
   Its description starts at column 21 (1-based), as every other line of that
   block's does today.
3. **No `contract` anywhere in `README.md`.** No line of `README.md` contains
   `contract` (case-insensitive). At base the only two are the lines named in
   criteria 1 and 2.
4. **`PROGRESS.md`'s Layout line for `openapi.yaml` no longer calls it a
   contract.** The Layout block of `PROGRESS.md` contains exactly one line
   matching `/^openapi\.yaml\s/`. That line does not contain `contract`
   (case-insensitive), and does contain `follows the backend` and `\bE-14\b`. Its
   description starts at column 17 (1-based), as it does at base. Lines of
   `PROGRESS.md` outside the Layout block that mention a contract (history
   entries, "contract tests") are not covered and stay as they are.
5. **`conventions.md`'s `backend/` row no longer says "once built".** The Layout
   block of `conventions.md` contains exactly one line starting `backend/ `. That
   line does not contain `once built` (case-insensitive). It still contains
   `/api/v1` and `the frontend on the same origin`, and its description still
   starts at column 18 (1-based), like every other row of that block.
6. **Only those four lines change in those three files.** Compared with base,
   `README.md`, `PROGRESS.md` and `conventions.md` each have the same number of
   lines, and every line other than the four named in criteria 1, 2, 4 and 5 is
   byte-identical and in the same order. Verified by `git diff 5f6f811 -- <file>`
   recorded in the Verdict, **not** by a new committed digest pin (P-17). The
   reviewer's later sweep edits to `PROGRESS.md` are not the worker's and are
   outside this criterion.
7. **The worker changes no other file.** The worker's commits touch only
   `README.md`, `PROGRESS.md`, `conventions.md` and this brief. In particular
   `openapi.yaml`, `geoquizdataplan.md`, `CLAUDE.md`, `engineering-decisions.md`
   and every file under `.claude/` are byte-identical to base. Verified by
   `git show --stat` per worker commit, recorded in the Verdict.
8. **The whole suite is green on the final tree, and pre-existing tests move
   only by approval.** `make -C backend check`, and `bun test`,
   `bun run typecheck`, `bun run lint` and `bun run format:check` in both
   `frontend/` and `question-bank/`, pass on the final tree. Every pre-existing
   test deleted or modified on this branch is changed only by an approved Test
   change request row or an approved CI fix plan row (D-14, D-18, D-20). Expected
   stale by design: `question-bank/src/conventions-openapi-row-verify.test.ts` ›
   "T-105 criterion 2 — nothing else in conventions.md changes" › "every other
   line is byte-identical to base 0b78dec, in the same order" and › "the
   backend/ row keeps 'once built, the frontend on the same origin'". A modified
   version of either still pins that `conventions.md`'s `openapi.yaml` row is
   unchanged from T-105's wording (it does not loosen T-105 criterion 1).

## Out of scope

- **`README.md:37`'s "15 states, 26 questions"** and its "human-written and
  reviewed explanations". Stale (the app serves 50 states and 415 generated
  questions, PROGRESS.md "In one paragraph"), found during this survey, not
  queued yet. Not this task; the reviewer should queue it.
- **`PROGRESS.md`'s Layout alignment of `docker-compose.yml`** (its description
  starts at column 21, the others at 17). Leave it.
- **Any other `contract` in `PROGRESS.md`** — history entries and line 66's
  "contract tests" describe what happened or name `backend/tests/test_contract.py`.
- **`geoquizdataplan.md:648`** — deliberately left alone; E-14 records the change.
- **`CLAUDE.md`** lines 4 and 51 (`api/`), and the `backend/` vs `api/` name —
  T-046 and a `P` ticket.
- **`openapi.yaml` itself**, and any backend or frontend source.
- **Rewording anything else** in the four lines' neighbours, or in
  `conventions.md`'s `openapi.yaml` row (done by T-105).

## Constraints

- Files expected to change: `README.md` (two lines), `PROGRESS.md` (one line),
  `conventions.md` (one line), this brief.
- `README.md` is under its own tests — `frontend/src/conventions-doc.test.ts`
  (T-058 job list and commands; T-062 "no count of tests anywhere in README"),
  `frontend/src/readme-test-count.criteria.test.ts`,
  `frontend/src/readme-suite-counts.criteria.test.ts`. The new wording must state
  no count of tests, in digits or words.
- `PROGRESS.md` is scanned by `frontend/src/stale-suite-counts*.criteria.test.ts`
  and `question-bank/src/committed-bank.test.ts`; same rule.
- Expect the usual whole-tree pins to go red from this brief and the run log
  being new tracked files (as in T-104, T-105: `farm-animal-loose-ends-verify`,
  `climate-cold-trade-accepted-verify` and their kin). Run **every** CI job's
  checks, not only one package's (see P-17's recurrences).
- No new dependency. No new committed digest pin for criteria 6 and 7.

## Context

Required reading for the worker and the tester.

- `engineering-decisions.md` **E-14** (line 687 on): the backend is the source of
  truth and `openapi.yaml` follows it; the P-8 amendment withdraws "contract".
- `README.md:32` (Tech stack row), `README.md:215` (Layout block).
- `PROGRESS.md:26` (Layout block).
- `conventions.md:10` (`backend/` row; the queue entry's ":9" has drifted by one)
  and `conventions.md:16` (`openapi.yaml` row, T-105's wording — the model for
  the new lines).
- `question-bank/src/conventions-openapi-row-verify.test.ts` — T-105's tests,
  two of which this task makes stale (criterion 8).
- `question-bank/src/climate-koppen.criteria.test.ts` › "T-067 criterion 17" —
  pins `conventions.md`'s `openapi.yaml` row, which this task does not touch.
- `tasks.md` T-106 entry; `PROGRESS.md` T-105 entry (line 389 on), which says
  "`conventions.md:9`'s 'once built' is now T-106".
- `process-tasks.md` P-17 — why "nothing else moved" is checked by diff, not pin.

## Handoff

## Verdict

## Notes
