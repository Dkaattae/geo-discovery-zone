# T-106 — `README.md` and `PROGRESS.md` still call `openapi.yaml` "the contract"

**Status:** `ci fix requested`
**Next step:** `human`
**Approved:** orchestrator — 2026-11-12, unattended run. See `runs/T-106-openapi-contract-wording.md`.
**Test changes:** `routed to ci-fix (D-20)`
**CI fix:** `requested`
**From:** [`tasks.md`](../tasks.md) T-106
**Branch:** `claude/youthful-galileo-hn6hh1`
**PR:** #133, opened draft at expand time; stays draft until the reviewer approves it
**Fault:** criteria 1-7 are met; criterion 8 is not, because 5 pre-existing tests are stale by the task's own change (the tester's 4, plus a test-file pin its own committed test file trips), and a CI fix plan of 6 test rows is waiting for approval.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB |
| worker | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (same value `$CLAUDE_CODE_REMOTE_SESSION_ID` gave the expander: the orchestrator spawns roles as subagents under one remote session; see Notes) |
| tester | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (same shared id: orchestrated run, freshly spawned tester subagent; see Verdict, "Independence") |
| ci-fix | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (same shared id: orchestrated run, freshly spawned ci-fix subagent, pass 1; see CI fix plan) |

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

**TL;DR: `fail`, on criterion 8 only.** All four doc lines are right, and criteria 1-7 hold.
Four pre-existing tests are red because of the task's own change: two T-105 pins on
`conventions.md`, plus two whole-tree pins. They are routed to the `ci-fix` as Test
change request rows 1-4 (D-20). No source or doc is wrong, and no test was edited.

**Independence.** This run is orchestrated (`runs/T-106-openapi-contract-wording.md`
exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJdbpiNRtapJtyKBeQB`, the same
id the expander and worker recorded, so the session check proves nothing here. My
independence rests only on being a freshly spawned subagent with its own context. I
did not see the worker's conversation or reasoning. That is weaker evidence than a
separate session, because it depends on the orchestrator having spawned me correctly.

**Tests added:** `question-bank/src/openapi-contract-wording-verify.test.ts`, 18 tests
named `T-106 criterion N — …`. They read the three committed docs and use no spawn
and no network.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | criterion 1 describe (5 tests): one Tech stack row starting `` | `openapi.yaml` | ``. It has no `contract` or `both sides` in any case, and it has `follows the backend` and `\bE-14\b` |
| 2 | met | criterion 2 describe (4 tests): one `/^openapi\.yaml\s/` line in the README Layout block. It has no `contract`, it has the two phrases, and its description is at column 21, the same as every line of the block |
| 3 | met | criterion 3: no line of `README.md` matches `/contract/i` |
| 4 | met | criterion 4 describe (4 tests): one line in the PROGRESS.md Layout block, no `contract`, has the two phrases, column 17. Other `contract` mentions in PROGRESS.md are untouched (diff below) |
| 5 | met | criterion 5 describe (4 tests): one `backend/ ` line, no `once built`, has `/api/v1` and `the frontend on the same origin`. Column 18, the same as every row of the block |
| 6 | met | `git diff 5f6f811 -- README.md PROGRESS.md conventions.md` has exactly 4 hunks of 1 line each: README.md:32, README.md:215, PROGRESS.md:26 and conventions.md:10. Line counts at base and head: 236/236, 2042/2042, 133/133 |
| 7 | met | the worker made one commit, `406241f`. Its `git show --stat` lists only `PROGRESS.md`, `README.md`, `conventions.md` and the brief. The other commits are the expander's (`eb19df9`, `9eac5da`: brief only) and the orchestrator's (`c5fc48f`, `25519fc`: brief and run log). `git diff --quiet 5f6f811 -- openapi.yaml geoquizdataplan.md CLAUDE.md engineering-decisions.md .claude/` exits 0 |
| 8 | **not met** | the question-bank `bun test` has 4 red tests, all stale by design (rows 1-4 below). Everything else is green |

**Mutation check of my tests.** I made two temporary mutations and reverted both
(`git status` was clean apart from my test file afterwards):

- **Base text restored.** `git checkout 5f6f811 -- README.md PROGRESS.md conventions.md` turned 10 of the 18 tests red. Those are every content assertion that base fails: `contract`, `Both sides`, the two phrases, E-14, `once built`. The 8 that stayed green check things base also satisfies, such as row counts and columns.
- **Column shifted.** Moving each of the three changed lines one column left turned the three column tests red (criteria 2, 4 and 5).

**Suite on the final tree (this session, with my test file):**

- `make -C backend check`: **1221 passed, 9 skipped**, exit 0.
- `question-bank`:
  - `bun test` gives **2737 pass, 4 fail** out of 2741. The 4 fails are exactly rows 1-4.
  - `typecheck`, `lint` and `format:check` all pass. My new file first failed `format:check`, which also turned the T-071 format-gate tests red. I fixed that by running prettier on my own file.
- `frontend`, locally: **not fully runnable, because of the environment.**
  - `bun install --frozen-lockfile` gets 403 from the proxy on some tarballs (internmap, commander, …), so `react-simple-maps` is missing.
  - `bun test` gives 420 pass and 4 "fail". Those 4 are the unhandled "Cannot find package 'react-simple-maps'" errors in `UsMap.tsx` and the two t051 map tests.
  - `typecheck` gives 9 TS errors, all in those same three files.
  - `lint` and `format:check` pass.
  - The README and PROGRESS scanners all pass, 229/229: `conventions-doc`, `readme-test-count`, `readme-suite-counts`, `stale-suite-counts*` and `readme-fences`.
- **Frontend on CI.** The REST check-runs for `25519fc` (worker tree plus run log) show **`frontend (typecheck, lint, test)`: success**. The same holds for `backend (lint, format, test)`, `backend (postgres)`, `integration (docker compose)` and `e2e (playwright)`. Only `question-bank` failed there, which matches rows 1-4.

**Stale tests (Test change request below).** I checked the worker's four candidates
myself and confirmed each is red for the reason it gives. I found no others.

- Rows 1-2 are T-105's pins. Criterion 5 changes the `backend/` line they pin.
- Rows 3-4 are whole-tree pins.
  - Root `README.md` is not in either allowed set, and the task changes it.
  - This task's brief and run log are new tracked files. They are the loop's own records, the same as in T-104 and T-105.
  - `PROGRESS.md` and `conventions.md` are already allowed in both pins.
- No count floors are affected.

**Reproduce:** `cd question-bank && bun test src/conventions-openapi-row-verify.test.ts src/farm-animal-loose-ends-verify.test.ts src/climate-cold-trade-accepted-verify.test.ts`
shows the 4 red tests:

- farm: expected 281, received 283.
- climate: expected 284, received 286.
- Each digest assertion follows its count.
- The T-105 digest no longer matches, and the T-105 `once built` assertion fails.

## Test change request

Written by the orchestrated tester and routed to the `ci-fix` (D-20). Decision is
blank on purpose. These rows are the `ci-fix`'s input, not an approval.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/conventions-openapi-row-verify.test.ts` › "T-105 criterion 2 — nothing else in conventions.md changes" › "every other line is byte-identical to base 0b78dec, in the same order" | `c90cba3`, T-105 tester. It pinned that T-105 changed only the `openapi.yaml` row of `conventions.md` | T-106 criterion 5 changes the `backend/` line (line 10), which this digest covers | modify | Name: "every line other than the openapi.yaml and backend/ rows is byte-identical to base, in the same order; the openapi.yaml row is T-105's wording". It asserts two things. (a) `sha256(JSON.stringify(lines))` over `split("\n")`, with the `/^openapi\.yaml\s/` line and the `backend/ ` line both removed, equals a digest recorded at `5f6f811`. The comment names that commit (E-30). (b) The `openapi.yaml` row equals, byte for byte, `openapi.yaml     describes the API; follows the backend, which is the source of truth (engineering-decisions.md E-14)`, its text at `5f6f811`. That keeps T-105 criterion 1's wording pinned exactly (T-106 criterion 8) | |
| 2 | same file › same describe › "the backend/ row keeps 'once built, the frontend on the same origin'" | `c90cba3`, T-105 tester. It pinned that T-105 left the `backend/` row alone | T-106 criterion 5 removes `once built` from that row | modify | Name: "the backend/ row serves /api/v1 and the frontend on the same origin, without 'once built' (T-106)". It asserts exactly one line starting `backend/ `. That line contains `serving /api/v1 and the frontend on the same origin` and does not match `/once built/i` | |
| 3 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21: the bank and the boundaries" › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096 tester. It pinned that no tracked non-test file outside T-096's allowed set changes or is added | T-106 changes root `README.md`, which main counted and which is not in `CRITERION_21_ALLOWED`. It also adds `tasks/T-106-openapi-contract-wording.md` and `runs/T-106-openapi-contract-wording.md` | modify | `"README.md"`, `"tasks/T-106-openapi-contract-wording.md"` and `"runs/T-106-openapi-contract-wording.md"` join `CRITERION_21_ALLOWED`, under a comment citing T-106 row 3. The count goes 281 → 280 (README.md leaves the counted set; the two new files were never in it). `MAIN_UNTOUCHABLE_SHA` is recomputed over the remaining set, with a `// Re-pinned by T-106 (Test change request row 3)` line. Nothing else is loosened | |
| 4 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091 tester. Same protection, for T-091's allowed set | Same as row 3: root `README.md` is not in `CRITERION_22_ALLOWED`, and the brief and run log are new | modify | The same three paths join `CRITERION_22_ALLOWED`, under a comment citing T-106 row 4. `MAIN_UNTOUCHABLE_COUNT` goes 284 → 283, and `MAIN_UNTOUCHABLE_SHA` is recomputed, with a `// Re-pinned by T-106 (Test change request row 4)` line. Nothing else is loosened | |

## CI fix plan

**TL;DR: 6 test rows, no source rows.** The four doc lines are right. Five
pre-existing pins are red because of the task's own change: the tester's four
rows, plus one it could not see (its own test file only entered `git ls-files`
when it was committed). Row 6 keeps a sixth pin green once row 3 lands. I tried
all 6 rows in a throwaway worktree, not on the branch, and got question-bank
**2741 pass / 0 fail**, with `typecheck`, `lint` and `format:check` clean.

**Independence.** This run is orchestrated (`runs/T-106-openapi-contract-wording.md`
exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJdbpiNRtapJtyKBeQB`, the
same id the expander, worker and tester recorded, so the session check proves
nothing. My independence rests only on being a freshly spawned subagent: I did
not see the worker's or the tester's reasoning, only their committed sections.

**Reproduced** on `6cb54e0` with `cd question-bank && bun test`: **2736 pass, 5 fail**.

- `conventions-openapi-row-verify` › "every other line is byte-identical to base 0b78dec…": the digest is `48a587b8…`, the pin is `61792261…`.
- same file › "the backend/ row keeps 'once built…'": `once built` is gone.
- `farm-animal-loose-ends-verify` › "criterion 21…": the count is 283, the pin is 281.
- `climate-cold-trade-accepted-verify` › "every tracked non-test file outside the allowed list…": the count is 286, the pin is 284.
- `climate-cold-trade-accepted-verify` › "pre-existing test files are main's, except ones in an approved Test change request": the count is **130**, the pin is 129. **The tester did not list this one.** It ran the suite before committing `openapi-contract-wording-verify.test.ts`, so `git ls-files` did not see the file yet. That is the same pattern as T-105 row 4 (127 → 128).

`make -C backend check`: 1221 passed, 9 skipped. Neither frontend nor backend has
a pin on these files, and none goes red.

| # | File (and function or test) | Kind | Change | Why — failing test or CI line, root cause, criterion quoted for a test row | Decision |
|---|---|---|---|---|---|
| 1 | `question-bank/src/conventions-openapi-row-verify.test.ts` › "T-105 criterion 2 — nothing else in conventions.md changes" › "every other line is byte-identical to base 0b78dec, in the same order" | pre-existing test (modify). Test change request row 1. Introduced `c90cba3`, T-105 tester; it protected T-105 criterion 2 (T-105 changed only the `openapi.yaml` row) | Rename it to "every line other than the openapi.yaml and backend/ rows is byte-identical to base, in the same order; the openapi.yaml row is T-105's wording". (a) Filter out both `/^openapi\.yaml\s/` and `startsWith("backend/ ")`, then compare `sha256(JSON.stringify(lines))` to a new constant recorded at `5f6f811` (E-30, the comment names the commit). In the trial this was `f13eb52a2bc793a3118fba5c2d6e8d682fd48749ce6b1334ea3d5b1268c82e2b`, the same at `5f6f811` and at HEAD. It replaces `BASE_OTHER_LINES_SHA`, which would otherwise be unused and fail lint. (b) Add `expect(openapiRows()[0]).toBe(...)` on the exact row text at `5f6f811`: `openapi.yaml     describes the API; follows the backend, which is the source of truth (engineering-decisions.md E-14)`. Also update the file's header comment so it describes the new digest's coverage | Red: the digest moves because T-106 criterion 5 rewrites `conventions.md:10`. **Criterion measured against:** T-106 criterion 8, "A modified version of either still pins that `conventions.md`'s `openapi.yaml` row is unchanged from T-105's wording (it does not loosen T-105 criterion 1)". Part (b) pins that row byte for byte, which is stronger than before (the old digest left that row out). Every other line stays pinned as hard as before, and the `backend/` row is now pinned by row 2 and by T-106 criterion 5's own tests | |
| 2 | same file › same describe › "the backend/ row keeps 'once built, the frontend on the same origin'" | pre-existing test (modify). Test change request row 2. Introduced `c90cba3`, T-105 tester; it protected that T-105 left the `backend/` row alone | Rename it to "the backend/ row serves /api/v1 and the frontend on the same origin, without 'once built' (T-106)". It asserts exactly one line starting `backend/ `, that the line contains `serving /api/v1 and the frontend on the same origin`, and that it does not match `/once built/i` | Red: the assertion `toContain("once built, …")` fails. **Criterion:** T-106 criterion 5, "That line does not contain `once built` (case-insensitive). It still contains `/api/v1` and `the frontend on the same origin`". The new version asserts all three. The brief's line that removes what the old test pinned is criterion 5 itself | |
| 3 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21: the bank and the boundaries" › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | pre-existing test (modify). Test change request row 3. Introduced `47581ea`, T-096 tester; it protected that no tracked non-test file outside T-096's allowed set changes or is added | Add `"README.md"`, `"tasks/T-106-openapi-contract-wording.md"` and `"runs/T-106-openapi-contract-wording.md"` to `CRITERION_21_ALLOWED`, under a comment citing T-106 CI fix plan row 3. Change the count from 281 to 280, extending the inline history comment. Recompute `MAIN_UNTOUCHABLE_SHA` and add a `// Re-pinned by T-106 (CI fix plan row 3)` line. Trial value: `c274a19eb00773d8057d349e3117271ef72c2c54aa79415d543cfab999be3fbf`. **Checked:** with the same exemption, base `5f6f811` gives the same count and digest, so the re-pin hides no other moved file | Red: 283 ≠ 281. Root `README.md` changes by T-106 criteria 1-2, and the brief and run log are new loop records, as in T-104 and T-105. **Criterion:** T-106 criterion 7, "The worker's commits touch only `README.md`, `PROGRESS.md`, `conventions.md` and this brief". The pin still asserts that every other non-test file is base's, and no new file is exempt beyond those the brief names | |
| 4 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | pre-existing test (modify). Test change request row 4. Introduced `950f334`, T-091 tester; same protection, for T-091's allowed set | Add the same three paths to `CRITERION_22_ALLOWED`, under a comment citing T-106 CI fix plan row 4. Change `MAIN_UNTOUCHABLE_COUNT` from 284 to 283 and recompute `MAIN_UNTOUCHABLE_SHA`, adding `// Re-pinned by T-106 (CI fix plan row 4)` lines. Trial value: `53524b09033aec046377bc5530f6cc5bd351eb5a262f2eda877d8cb54263aac0`. Also checked against base `5f6f811`: equal | Red: 286 ≠ 284. The cause and criterion are the same as row 3 | |
| 5 | same file › same describe › "pre-existing test files are main's, except ones in an approved Test change request" | pre-existing test (modify). **Not in the Test change request; added here.** Introduced `950f334`, T-091 tester; it protected that no test file changes unless an approved request names it | Change `MAIN_TESTS_COUNT` from 129 to 130 and recompute `MAIN_TESTS_SHA`, each with a `// Re-pinned by T-106 (CI fix plan row 5)` comment naming the new tester file and rows 1-2. **Apply rows 1-2 first and run prettier**: the digest covers `conventions-openapi-row-verify.test.ts` byte for byte, so the pinned value is the one observed after them. Trial value: `f9eae92dfddf5447efe7cf2a7d1756973917385390ec492b1e0ae8ba7b664ca2` | Red: 130 ≠ 129. The tester committed `question-bank/src/openapi-contract-wording-verify.test.ts`, and rows 1-2 change a counted file, so the digest moves too. **Criterion:** T-106 criterion 8, "Every pre-existing test deleted or modified on this branch is changed only by an approved Test change request row or an approved CI fix plan row". The only test files that move are the new one and rows 1-2's | |
| 6 | same file › same describe › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" (`APPLIED_REQUEST_FILE_SHAS["question-bank/src/farm-animal-loose-ends-verify.test.ts"]`) | pre-existing test (modify). Introduced `bac230d`, T-091 tester (review finding 1); it protected that each named request file holds only its approved re-pins | Recompute the farm file's entry and extend its history comment with `then by T-106 (CI fix plan row 6, for its row 3)`. **Apply row 3 first**: the value is the one observed after it. Trial value: `066f1da50645542889e257adabc6d28eb0914900f9ea9fa11d41bde1f32a180d` | Green now. Applying row 3 turns it red, because the farm file's bytes change. This is the same chain as T-105 row 5 and T-076 row 7. **Criterion:** T-106 criterion 8, quoted under row 5. The pin still holds that file to exactly its approved re-pins | |

**Root cause:** this is not a code fault. T-106 does what its criteria say:
criterion 5 rewrites `conventions.md:10`, and criteria 1-2 change root
`README.md`. The tester then committed one new test file. Five pre-existing pins
hash exactly those bytes or count exactly those files: two T-105 pins on
`conventions.md`, and three whole-tree pins (T-096's non-test set, and T-091's
non-test and test-file sets). They go red by design, as criterion 8 anticipates
for the first two. The sixth pin is one that holds the farm file's digest. It
follows once row 3 edits that file. The tester listed four of the five because
it ran its suite before its own test file was tracked.

**Not doing:**

- **No source or doc row.** The four lines meet criteria 1-5, as the tester's 18 tests confirm. Reverting any of them to keep a pin green would break a criterion.
- **No deletion of row 2's test.** T-106's tester covers `once built` too, but deleting the test drops T-105's "exactly one `backend/ ` row" check from that file. A modify keeps it.
- **No exemption for the tester's new test file**, such as a `T106_TEST_FILES` set in the climate file. Earlier tasks re-pinned the count instead (T-105 row 4, T-076 row 6), and that keeps the file under the digest.
- **Trial digests are not final.** The SHA values above were observed in a throwaway worktree. Pass 2 records whatever value it observes after applying the rows in order (1, 2, 3, 4, then 5 and 6) and running prettier. If any value differs from the trial, `## CI fix` says so and why.
- **Frontend 403.** The registry is unreachable locally (Handoff, Verdict). This is environmental and not this task's. CI's `frontend` job on #133 passed at `25519fc`.

## Notes

- **Wording.** I modelled the new lines on T-105's `conventions.md:16` row ("describes the API; follows the backend, which is the source of truth"). The README Layout line is shorter so it reads like its neighbours. Each line names E-14 as a bare id, the way `PROGRESS.md:26` already did. Reviewer to confirm or reword. Any rewording must keep satisfying criteria 1–4.
- **PROGRESS.md:26 used to say "follows backend/".** Criterion 4 requires the exact phrase "follows the backend", so the line now says "served by backend/; follows the backend".
- **Session id matches the expander's.** `$CLAUDE_CODE_REMOTE_SESSION_ID` returned the same value for this worker subagent as it did for the expander, because the orchestrator runs every role under one remote session. The roles were still separate agent contexts. The tester should not read the match as "same agent". Owner: tester to note it; if the Sessions check needs a per-subagent id, that is a `process-tasks.md` item for the human.
- **Frontend registry 403** (see Handoff). This is environmental and was not routed around. Owner: the tester, to re-run the frontend checks where the registry is reachable, or to accept CI's frontend job on #133 as the evidence.
