# T-106 — `README.md` and `PROGRESS.md` still call `openapi.yaml` "the contract"

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** orchestrator — 2026-11-12, unattended run. See `runs/T-106-openapi-contract-wording.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-106
**Branch:** `claude/youthful-galileo-hn6hh1`
**PR:** #133, opened draft at expand time; stays draft until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB |
| worker | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (same value `$CLAUDE_CODE_REMOTE_SESSION_ID` gave the expander: the orchestrator spawns roles as subagents under one remote session; see Notes) |

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

**TL;DR: four doc lines reworded, nothing else.** README's two `openapi.yaml`
lines and PROGRESS.md's Layout line now say it describes the API and follows the
backend (E-14); `conventions.md`'s `backend/` row drops "once built". Two T-105
tests are red by design (listed below), plus two whole-tree pins that were
already red before this commit.

**What changed, file by file** (all against base `5f6f811`; line counts unchanged)

- `README.md:32` (Tech stack row) → `` | `openapi.yaml` | Describes the API. It follows the backend, which is the source of truth (E-14) | ``
- `README.md:215` (Layout block) → `openapi.yaml        describes the API; follows the backend (E-14)` (description at column 21)
- `PROGRESS.md:26` (Layout block) → `openapi.yaml    describes the API served by backend/; follows the backend (E-14)` (column 17)
- `conventions.md:10` (Layout block) → `... (Python, uv), serving /api/v1 and the frontend on the same origin` (column 18)
- this brief: Status, Sessions, Handoff, Notes

**Where each criterion lives**

| # | Where |
|---|---|
| 1 | `README.md:32`. No "contract", no "Both sides"; has "follows the backend" and "E-14" |
| 2 | `README.md:215`. Only `^openapi\.yaml\s` line in the block; column 21 |
| 3 | `grep -ic contract README.md` → 0 |
| 4 | `PROGRESS.md:26`. Column 17. Other `contract` mentions in PROGRESS.md left alone |
| 5 | `conventions.md:10`. Still has `/api/v1` and `the frontend on the same origin`; column 18 |
| 6 | `git diff 5f6f811 -- README.md PROGRESS.md conventions.md`: 4 insertions, 4 deletions, same line counts (236 / 2042 / 133) |
| 7 | Single worker commit; `git show --stat` should list only the three docs and this brief |
| 8 | See "Suite" below |

**Deliberately not done**

- No test edited, including the two T-105 tests this task makes stale. Not mine to change (D-14).
- None of the out-of-scope items touched (`README.md:37` counts, `docker-compose.yml` alignment, `geoquizdataplan.md`, `CLAUDE.md`, `openapi.yaml`).

**Contradictions with the brief:** none found. The criteria can all be checked
as written.

**Tests made stale**

- `question-bank/src/conventions-openapi-row-verify.test.ts` › "T-105 criterion 2 — nothing else in conventions.md changes" › "every other line is byte-identical to base 0b78dec, in the same order". Made stale by criterion 5 (the `backend/` line changes). Proposal: **modify** it to exempt the `backend/` line as well (or compare against `5f6f811` with that line exempted), while still pinning the `openapi.yaml` row to T-105's wording.
- same file › "T-105 criterion 2 — nothing else in conventions.md changes" › "the backend/ row keeps 'once built, the frontend on the same origin'". Made stale by criterion 5. Proposal: **modify** it to assert `the frontend on the same origin` is present and `once built` is absent, or **delete** it (T-106's tester tests cover it).
- `question-bank/src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21: the bank and the boundaries" › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added". Whole-tree pin. **Already red at `c5fc48f`, before my commit** (the new brief and run log), and my three docs widen it. Proposal: same treatment as in T-104/T-105.
- `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "every tracked non-test file outside the allowed list is 12d242e's, and none is added". Same situation as the previous item.
- No count floors affected: no test file was touched.

**Suite on the final tree (this session)**

- `make -C backend check`: **1221 passed, 9 skipped**.
- `question-bank/`: `bun test` **2719 pass, 4 fail**. The 4 fails are exactly the four stale tests above. `typecheck`, `lint`, `format:check` all pass.
- `frontend/`: **not fully runnable here, because of the environment, not the change.** `bun install --frozen-lockfile` could not finish: the lockfile resolves some packages (d3-*, `react-simple-maps`, `us-atlas` and their kin, 23 entries) from `europe-west1-npm.pkg.dev`, and the session proxy answers 403 to that host. So `typecheck` fails with TS2307 on `react-simple-maps` / `us-atlas`, and `bun test` gives 419 pass / 5 fail: unhandled "Cannot find package 'react-simple-maps'" errors in the map tests, plus `lint-gate.test.ts` timing out at 5 s on a cold run. `lint-gate.test.ts` alone with `--timeout 30000`: 8/8 pass. `lint` and `format:check` pass. The README/PROGRESS scanners (`conventions-doc`, `readme-test-count`, `readme-suite-counts`, `stale-suite-counts*`): 215/215 pass.
- **Tester:** run the frontend jobs where that registry can be reached (or rely on CI for #133). None of the frontend failures involve a file this task touched.

**How to run**

```bash
git diff 5f6f811 -- README.md PROGRESS.md conventions.md
make -C backend check
(cd question-bank && bun install --frozen-lockfile && bun test && bun run typecheck && bun run lint && bun run format:check)
(cd frontend && bun install --frozen-lockfile && bun test && bun run typecheck && bun run lint && bun run format:check)
```

## Verdict

## Notes

- **Wording.** I modelled the new lines on T-105's `conventions.md:16` row ("describes the API; follows the backend, which is the source of truth"). The README Layout line is shorter so it reads like its neighbours. Each line names E-14 as a bare id, the way `PROGRESS.md:26` already did. Reviewer to confirm or reword. Any rewording must keep satisfying criteria 1–4.
- **PROGRESS.md:26 used to say "follows backend/".** Criterion 4 requires the exact phrase "follows the backend", so the line now says "served by backend/; follows the backend".
- **Session id matches the expander's.** `$CLAUDE_CODE_REMOTE_SESSION_ID` returned the same value for this worker subagent as it did for the expander, because the orchestrator runs every role under one remote session. The roles were still separate agent contexts. The tester should not read the match as "same agent". Owner: tester to note it; if the Sessions check needs a per-subagent id, that is a `process-tasks.md` item for the human.
- **Frontend registry 403** (see Handoff). This is environmental and was not routed around. Owner: the tester, to re-run the frontend checks where the registry is reachable, or to accept CI's frontend job on #133 as the evidence.
