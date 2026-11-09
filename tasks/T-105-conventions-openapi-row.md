# T-105 — `conventions.md` still calls `openapi.yaml` "the contract"

**Status:** `test changes requested`
**Next step:** `human`
**Approved:** orchestrator — 2026-11-09, unattended run. See `runs/T-105-conventions-openapi-row.md`.
**Test changes:** `requested`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-105
**Branch:** `claude/fervent-ptolemy-4py2eg`
**PR:** #130, opened draft at expand time; stays draft until the reviewer approves it
**Fault:** test changes are waiting for approval: six pre-existing test pins (Test change request rows 1-6) are stale by this task's own change and need a person's approval in an attended `tester` session (D-15). Criteria 1-3 are met.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-09 | cse_011oDiJbsZTbExMiPULZMiFd |
| worker | 2026-11-09 | cse_011oDiJbsZTbExMiPULZMiFd |
| tester | 2026-11-09 | cse_011oDiJbsZTbExMiPULZMiFd |

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

**TL;DR:** one line of `conventions.md` rewritten; nothing else touched. Five
reds on the final tree: three are stale tests by design (listed below, for an
attended Test change request), the rest are frontend tests/typecheck that cannot
load `react-simple-maps` because this sandbox's `node_modules` is incomplete and
the registry is blocked — not caused by this change.

**Session note for the tester:** the worker's session id equals the expander's
(`cse_011oDiJbsZTbExMiPULZMiFd`) — the orchestrated run reports one remote
session id for all its subagents. Each role still ran as a separate subagent;
record your own row and judge independence from that.

**Changed, file by file:**

- `conventions.md:16` — the `openapi.yaml` Layout row now reads
  `openapi.yaml     describes the API; follows the backend, which is the source of truth (engineering-decisions.md E-14)`
- `tasks/T-105-conventions-openapi-row.md` — this Handoff, Status, Next step,
  Sessions row, a Notes line.

**Criteria → where it lives:**

| # | Where | Worker's own check |
|---|---|---|
| 1 | `conventions.md:16` | one line matches `/^openapi\.yaml\s/`; no `contract`, no `once both are built`; has `follows the backend` and `E-14` |
| 2 | `conventions.md` | `diff <(git show 0b78dec:conventions.md) conventions.md` shows only line 16; 133 lines both sides; description starts at column 18 (padding unchanged); `backend/` row untouched |
| 3 | worker commits `011459b` + the brief commit | `011459b` touches only `conventions.md`; the follow-up only this brief. `git diff --stat 0b78dec..HEAD` also lists `runs/T-105-…` (orchestrator) and this brief (expander) |
| 4 | suites | not green yet — see "Suite on the final tree" |

**Tests made stale** (left failing, not edited):

- `question-bank/src/climate-koppen.criteria.test.ts` › "T-067 criterion 17 —
  conventions.md's openapi.yaml layout line points at E-14" › "the layout line
  describing openapi.yaml mentions E-14". Stale by criterion 1. **Modify:** drop
  `toContain("the contract between frontend and backend")`; keep
  `toHaveLength(1)` and `toMatch(/\bE-14\b/)` (criterion 4 requires both);
  optionally add `toContain("follows the backend")`.
- `question-bank/src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria
  17-21: the bank and the boundaries" › "criterion 21: outside the allowed files
  and test files, every tracked file is main's, and none is added". Count floor
  `282` → now `284`; `MAIN_UNTOUCHABLE_SHA` (line 172) will move too. Cause: the
  two new tracked files `tasks/T-105-conventions-openapi-row.md` and
  `runs/T-105-conventions-openapi-row.md` — not the `conventions.md` edit
  (already in the allowed set). **Modify:** count 284 plus new sha, or add the
  two T-105 paths to the allowed set; tester to choose, as in T-104.
- `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091
  criterion 22: the diff touches only the allowed files" › "every tracked
  non-test file outside the allowed list is 12d242e's, and none is added".
  `MAIN_UNTOUCHABLE_COUNT` (line 106) `285` → now `287`; `MAIN_UNTOUCHABLE_SHA`
  (line 97) will move too. Same cause and fix.
- `refresh-regenerate-reminder-verify.test.ts` stayed **green**; the expander's
  "possibly" did not happen.

**Suite on the final tree (worker run, 2026-11-09):**

- `make -C backend check`: 1221 passed, 9 skipped.
- `question-bank/`: `bun test` 2710 pass / 3 fail (the three above);
  `typecheck` exit 0; `lint` exit 0.
- `frontend/`: `bun test` 406 pass / 4 fail; `typecheck` exit 2; `lint` exit 0.
  Every error is `Cannot find package 'react-simple-maps'` / `us-atlas` from
  `src/components/UsMap.tsx`, `t051-map-click.test.tsx`,
  `t051-tester.criteria.test.tsx`. `bun install --frozen-lockfile` failed: the
  proxy answers 403 to `europe-west1-npm.pkg.dev` (policy denial; not retried).
  No frontend file is touched on this branch, so this is environmental.
  **Tester:** re-run where `bun install` succeeds, or take CI's frontend job as
  the evidence.

**Deliberately not done:** `README.md:32`/`:215`, `geoquizdataplan.md:648`,
`conventions.md:9` — out of scope per the expander's Notes; reviewer to queue.

**How to run:** `cd question-bank && bun test src/climate-koppen.criteria.test.ts
src/farm-animal-loose-ends-verify.test.ts src/climate-cold-trade-accepted-verify.test.ts`
for the stale three; criterion 4 lists the full commands.

## Verdict

### Tester, 2026-11-09 — **test changes requested** (criteria 1-3 met; 4 waits on approval)

**TL;DR:** the `conventions.md` change meets criteria 1-3, and every mutation I tried turned the new tests red. Criterion 4 cannot pass yet: six pre-existing pins are red, or will be once my tests are committed, because of this task's own change. The Test change request below lists them. **Needed:** a person approves rows 1-6 in an attended `tester` session.

- **Independence.** This is an orchestrated run (`runs/T-105-…` exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJbsZTbExMiPULZMiFd`, the same id as the expander and worker rows. That check proves nothing here, so it did not pass. My independence rests only on being a freshly spawned subagent with its own context: I did not see the worker's reasoning. That is weaker evidence than a separate session, because it depends on the orchestrator having spawned me correctly.
- **Handoff checked against the branch.** `conventions.md:16` holds the row the Handoff quotes, and `011459b` touches only that file. The work is on `claude/fervent-ptolemy-4py2eg`.

| # | Verdict | Evidence |
|---|---|---|
| 1 | **met** | `question-bank/src/conventions-openapi-row-verify.test.ts` › "T-105 criterion 1 …", 5 tests green |
| 2 | **met** | same file › "T-105 criterion 2 …", 5 tests green. Base `0b78dec`'s other 133 lines are pinned as a sha256 (E-30: CI is shallow, so a test may not `git show` a revision) |
| 3 | **met** | `git diff --stat` and per-commit stats, below |
| 4 | **not yet** | three pins are red now; three more would go red once this test file is committed, or once row 1 is applied. Rows 1-6 below |

**Criterion 3, recorded (not pinned, per the criterion):**

```
$ git diff --stat 0b78dec..9cc7751
 conventions.md                         |   2 +-
 runs/T-105-conventions-openapi-row.md  |  82 +++++++++++++++
 tasks/T-105-conventions-openapi-row.md | 184 +++++++++++++++++++++++++++++++++
```

Per commit: worker `011459b` changed `conventions.md` only, and worker `bf7b318` changed the brief only. The `runs/` file comes from the orchestrator (`b3da726`, `9cc7751`), and the brief's other commits come from the expander (`3a23593`, `43a7444`). So the worker touched nothing outside `conventions.md` and the brief.

**Mutations** (each one a temporary edit to `conventions.md`, restored from a copy, `git status` clean afterwards):

| Mutation | Went red |
|---|---|
| base `0b78dec`'s file restored (the old row) | c1 "no 'contract'", c1 "no 'once both are built'" |
| `backend/` row: "once built, the frontend" → "the frontend" | c2 "byte-identical", c2 "backend/ row keeps …" |
| openapi row padding cut by one space (description at column 17) | c2 "column 18" |
| `E-14)` → `E-140)` | c1 "E-14 as a whole word" |
| "Contract " inserted into the row | c1 "no 'contract' in any case" |
| one extra trailing line | c2 "same number of lines", c2 "byte-identical" |

**Suites on the final tree** (`9cc7751` plus my new test file, staged):

- **`make -C backend check`:** 1221 passed, 9 skipped. Lint and format clean.
- **`question-bank/`:** `bun test` gives 2720 pass, 3 fail. The three failures are rows 1-3 below, with the new file still untracked. Once it is tracked, row 4's pin goes red too, as the dry run showed. `typecheck` exit 0. `lint` exit 0. My new file passes `prettier --check`.
- **`frontend/`:** locally `bun test` gives 406 pass, 4 fail, and `typecheck` fails. Every error traces to `react-simple-maps` / `us-atlas` missing from `node_modules`; the worker found the registry blocked by the proxy. `lint` exit 0. No frontend file changes on this branch. **CI on `9cc7751`:** `frontend (typecheck, lint, test)` success, and so are backend, backend (postgres), e2e and integration. `question-bank` fails, from rows 1-3.

**Dry run of the request.** I applied rows 1-6 (row 1 with the comment shown below) and the question-bank suite went to 0 fail, with backend still 1221 passed. Then I reverted all six with `git checkout`. Only my new test file is committed.

**Worker's "Tests made stale" list, checked.** Its three entries are rows 1-3. It missed three:
- **Row 4:** this tester's new file raises `MAIN_TESTS_COUNT`.
- **Row 5:** row 2 edits `farm-animal-loose-ends-verify.test.ts`, so its per-file sha moves.
- **Row 6:** row 1 edits `climate-koppen.criteria.test.ts`, which `hand-check-levels-verify.test.ts` digests.

The worker was right that `refresh-regenerate-reminder-verify.test.ts` stays green.

## Test change request

Observed on `9cc7751` with `conventions-openapi-row-verify.test.ts` tracked. Rows 2 and 3 leave their counts and shas unchanged: `conventions.md` is already in both allowed sets, so once the two T-105 files join them the counted set is main's again. That held in the dry run. The digests in rows 4-6 depend on the exact bytes of the files they cover. **Apply rows 1-3 first, then row 6, then rows 4 and 5, and re-read each observed value when applying.** The dry-run values below were taken without the new comments in rows 2-6, so the real ones will differ.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/climate-koppen.criteria.test.ts` › `T-067 criterion 17 — conventions.md's openapi.yaml layout line points at E-14` › "the layout line describing openapi.yaml mentions E-14" | T-067, merged in `9d1efe0` (PR #66): the `openapi.yaml` Layout row exists once, carries T-067's wording, and names E-14 | Criterion 1 bans `contract` from the row, so `toContain("the contract between frontend and backend")` is red by design | modify | Same describe and name. Still asserts `toHaveLength(1)` and `toMatch(/\bE-14\b/)`. Replaces the `contract` assertion with `toContain("follows the backend")` and `not.toMatch(/contract/i)`, under the comment `// Modified by T-105 (Test change request row 1): the row no longer calls openapi.yaml a contract; it follows the backend (E-14).` | |
| 2 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `T-096 criteria 17-21: the bank and the boundaries` › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096: count and digest of every tracked file outside its allowed set and the test files. Last re-pinned by T-104 | The task adds `tasks/T-105-conventions-openapi-row.md` and `runs/T-105-conventions-openapi-row.md` (count 282 → 284) | modify | Same name and assertions. Add those two paths to `CRITERION_21_ALLOWED`, after the T-104 entries, with a `// T-105 (Test change request row 2)` comment. Count literal stays **282**, and `MAIN_UNTOUCHABLE_SHA` stays `d29be0bf…7aaf` (dry run green). Add `// Re-pinned by T-105 (Test change request row 2): T-105's brief and run log join the allowed set (count and digest unchanged, 282).` to the comment trail | |
| 3 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091: count and digest of tracked non-test files outside `CRITERION_22_ALLOWED`. Last re-pinned by T-104 | Same two new files (count 285 → 287) | modify | Same name and assertions. Add the two paths to `CRITERION_22_ALLOWED`, after the T-104 entries, with a T-105 row 3 comment. `MAIN_UNTOUCHABLE_COUNT` stays **285**, and `MAIN_UNTOUCHABLE_SHA` stays `eba70070…3193` (dry run green). Add a "Re-pinned by T-105 (Test change request row 3) … (count and digest unchanged, 285)" line to its comment trail | |
| 4 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: …` › "pre-existing test files are main's, except ones in an approved Test change request" | `950f334`, T-091: count and digest of every pre-existing test file. Last re-pinned by T-104 (rows 2, 7, 8) | This tester adds `question-bank/src/conventions-openapi-row-verify.test.ts` (127 → 128). Row 1 changes `climate-koppen.criteria.test.ts` and row 6 changes `hand-check-levels-verify.test.ts`, and the digest counts both | modify | Same name and assertions. `MAIN_TESTS_COUNT` 127 → **128**. `MAIN_TESTS_SHA` `592eaba9…02df` → the value observed after rows 1, 2, 3 and 6 are applied (dry run without comments: `f35e1dadcc00ff985b98dc28d46425a86b8e49c8d7eb565625b0c3dec5ae1b71`). "Re-pinned by T-105 (Test change request row 4)" comments on both | |
| 5 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: …` › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | `bac230d`, T-091: per-file sha of T-091's request files, including `farm-animal-loose-ends-verify.test.ts` | Row 2 edits `farm-animal-loose-ends-verify.test.ts`, so its pinned sha moves, as in T-104 row 5 | modify | Same name and assertion. The `APPLIED_REQUEST_FILE_SHAS` entry for `question-bank/src/farm-animal-loose-ends-verify.test.ts`, `25451e34…d898` → that file's sha256 after row 2, comments included (dry run without comments: `36cd41ac…21e5`). Append "then by T-105 (row 5, for its row 2)" to its comment trail | |
| 6 | `question-bank/src/hand-check-levels-verify.test.ts` › `T-025 criteria 14-17: no data, dependency or E-n moved; old tests unmodified` › "criterion 17: every question-bank test file at aa88101 is present and unmodified" | T-025's tester: a digest of the 48 question-bank test files present at `aa88101`, `climate-koppen.criteria.test.ts` among them. Last re-pinned by `8bf0959`, T-087 row 14 | Row 1 modifies `climate-koppen.criteria.test.ts` | modify | Same name and assertions. The digest literal `2e90dd58…aa6` → the value observed after row 1 (dry run with the row 1 comment above: `41f74f5074106d5619fc73714a2899c91154823ae7fab75ac7e32c140c5be317`). Add `// Re-pinned by T-105's approved Test change request row 1 (this is row 6).` | |

**Process note, for Dkaattae (P-17, not this task):** rows 2, 3 and 5 recur on every task, because each task adds a brief and a run log. T-104's request raised the same point.


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

**Worker (2026-11-09):** wording follows the expander's suggestion so it mirrors `CLAUDE.md` ("the backend is the source of truth"). Only surprise: the frontend install is blocked in this sandbox (see Handoff).

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
