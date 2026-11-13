# T-111 — Two `us-states.ts` comments still say "the 15 states shipping today"

**Status:** `fail`
**Next step:** `ci-fix`
**Approved:** orchestrator — 2026-11-13, unattended run (re-stamped after criterion 4 amendment). See `runs/T-111-us-states-15-states-comments.md`.
**Test changes:** `routed to ci-fix (D-20)`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-111
**Branch:** `claude/amazing-franklin-j3x3l1`
**PR:** #136, opened draft at expand time, built from the branch above. Stays draft until the reviewer approves it.
**Fault:** tester round 2: criteria 1 to 4 are all met (criterion 4 as amended). 6 pre-existing pins are stale by the task's own change: 5 are red now, and row 5 goes red once rows 1 and 3 are applied. They are routed to the `ci-fix` for a plan (D-20). No criterion failed.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste |
| worker | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste |
| tester | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated: shared id, fresh subagent) |
| task-expander (amendment) | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated, fresh spawn; amended criterion 4 only) |
| tester (round 2) | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated: shared id, fresh subagent) |

> **Light brief** (`process.md`, "The light path, for S-sized tasks"): an `S`
> task, comments only, one file, no text a child reads, nothing in
> `openapi.yaml`, a migration or the plan. Goal, Out of scope, Constraints and
> Context are dropped; the **Notes** below carry the two things a worker and
> tester would otherwise trip on.

## Acceptance criteria

"The region paragraph" means the doc-comment paragraph in
`question-bank/src/curated/us-states.ts` that begins `**\`region\` vocabulary
(T-017, 2026-09-18).**` and runs to the end of that `/** … */` block (on `main`
at `2634fc8`, lines 67–91).

1. **No present-tense "15 states" claim is left in the file.** In
   `question-bank/src/curated/us-states.ts`, no line contains the phrase
   `shipping today`, and no line contains `already served` (case-insensitive,
   either phrase). These are the two claims on `main`'s lines 69 and 80. The
   region paragraph also contains no occurrence of the word `today`.
2. **T-017's decision is still recorded, in the same paragraph.** The region
   paragraph still contains: the strings `T-017`, `2026-09-18` and `E-9`; the
   word `15` or `fifteen` at least once, in a sentence that places it in the
   past (for example "the 15 states served at the time"; a reviewer judges the
   tense, a test checks the number is present); each of the 13 region values
   (`Great Basin`, `Great Lakes`, `Great Plains`, `Mountain West`,
   `New England`, `Northeast`, `Pacific`, `Pacific Northwest`, `Pacific West`,
   `South Central`, `Southeast`, `Southwest`, `Upper Midwest`) in backticks;
   and each of the 15 state names (`Colorado`, `Florida`, `Texas`, `Alaska`,
   `Hawaii`, `Maine`, `Michigan`, `Louisiana`, `California`, `New York`,
   `Arizona`, `Kansas`, `Washington`, `Minnesota`, `Nevada`) in backticks.
3. **Comments only: no behaviour moves.** With every comment removed (`//` line
   comments and `/* … */` blocks), `question-bank/src/curated/us-states.ts` is
   identical to `main`'s at `2634fc8` apart from whitespace. Every value the
   module exports deep-equals `main`'s, and `question-bank/data/` and
   `backend/app/data/content.json` are byte-identical to `main`'s.
4. **Nothing else changes.** *(Amended 2026-11-13, after the tester's
   `blocked` verdict: the old list left out the files the loop itself must
   change.)* `git diff --name-status origin/main...HEAD` lists no path other
   than these:
   - **The change:** `question-bank/src/curated/us-states.ts`.
   - **The loop's records:** this brief (added, edited, or deleted by the
     reviewer's sweep); `runs/T-111-us-states-15-states-comments.md`;
     `tasks.md`; `PROGRESS.md`.
   - **Test files:** a path ending in `.test.ts` or `.test.tsx`, or under
     `backend/tests/`. A test file that **does not exist on `main`** may be
     added. A test file that **exists on `main`** may change only through a row
     of this brief's Test change request or CI fix plan whose approval is
     recorded (D-14, D-18, D-20); one changed with no such row fails this
     criterion.

   Bounds on the records, before the reviewer's sweep: every line that
   `git diff origin/main...HEAD -- tasks.md` adds or removes lies inside
   T-111's own entry (its `###` heading and the lines under it, up to the next
   `###`), and `PROGRESS.md` is not in the list. The sweep's later edits to
   `tasks.md` and `PROGRESS.md`, and its deletion of this brief, are the
   reviewer's to judge. No `package.json`, `bun.lock`, `uv.lock` or
   `pyproject.toml` appears in the list at any point.

Criteria 1 to 3 are checked against the task branch's tree. Criterion 4 is a
no-change check on this PR. **Verify it at hand-off** (the diff command and its
output in the Verdict), and do not add a committed sha256 pin for it. A pin
like that stays in the suite after merge and goes red on the next task that
touches the tree (P-17).

## Notes

- **Expect whole-file pins to go red.** At least
  `question-bank/src/agriculture-true-wrong-answers-verify.test.ts`
  "criterion 20: curated/us-states.ts is byte-identical to main's" hashes this
  file whole (`MAIN_FILE_SHA`, pinned at `a42b71b`). Other tests may hash
  `question-bank/src/` or the tracked tree too (P-17). The worker leaves them red
  and lists them under **Tests made stale**. They reach a person through the
  tester's Test change request, or under the orchestrator through the `ci-fix`'s
  plan (D-20). They are stale by design, so a red pin does not mean criterion 3
  failed.
- **What is already true (survey, 2026-11-13):** no test reads the two stale
  phrases. `grep` finds `shipping today` and `already served` only in
  `us-states.ts` lines 69 and 80, and in
  `backend/tests/test_region_vocabulary.py` line 10. The served bank has been
  the pipeline's 50 states since T-040 (PR #88, E-24).
- **Not this task:** `backend/tests/test_region_vocabulary.py` line 10's
  docstring ("the 15 states already served keep exactly the region…") describes
  T-017's criterion 3 as it stood, inside a test file, and is left alone. If a
  reviewer thinks it should change, that is a new `tasks.md` entry. The other
  present-tense wording in the paragraph ("`content.json` already ships for
  them", line 82) is still true: those 15 states keep those regions in today's
  50-state `content.json`. The worker may reword it for flow, but criterion 1
  does not require it.
- **Context, if wanted:** `engineering-decisions.md` E-9 (the region decision
  this paragraph records), E-24 (the bank the app serves now), and
  `PROGRESS.md`'s T-017 line.

## Handoff

**TL;DR:** The two comment phrases are now past tense, and T-017's decision is still recorded in the same paragraph. Only `question-bank/src/curated/us-states.ts` changed, and only inside its doc comment. The suite has **4 reds**. Two are whole-tree pins that this edit makes stale. The other two were already red on this branch before the worker started, because the expander and orchestrator commits added files. All four are listed under **Tests made stale**. Next: the `tester`, in a fresh session.

**Session note for the tester:** `$CLAUDE_CODE_REMOTE_SESSION_ID` returned the same id for the worker and the expander (`cse_011oDiJfSMW5AuCAW3Bk9Ste`). The orchestrator runs every role under that id. The tester should check that its own session is fresh by some other means, and record what it finds.

### What changed, file by file

- **`question-bank/src/curated/us-states.ts`**: the region paragraph only, on lines 67–93 (it was 67–91 on `main`).
  - Line 69, "the 15 states shipping today) already returns", now reads "then the 15 states served at the time) returned".
  - Line 80, "The 15 states already served … carry the exact value `content.json` already ships for them", now reads "The 15 states that bank served in 2026-09 … carry the exact value `content.json` shipped for them then". The Notes allowed this rewording of the line-82 phrase for flow.
  - The rest of the paragraph is re-wrapped to stay within 80 columns, with the wording unchanged.
- **This brief**: header, Sessions row, Handoff.
- **Nothing else.** No code, no tests, no data, no dependencies.

### Criteria → where it lives

| # | Status | Evidence |
|---|---|---|
| 1 | met | `grep -niE "shipping today\|already served" question-bank/src/curated/us-states.ts` returns nothing. The word `today` does not appear in the region paragraph. It still appears on lines 44 and 103 and in a fun-fact string, all outside the paragraph and outside the criterion. |
| 2 | met | A script check found all of `T-017`, `2026-09-18`, `E-9` and `15`, all 13 region values and all 15 state names in backticks, within the slice from `**\`region\` vocabulary` to the next `*/`. The past-tense sentences are "then the 15 states served at the time" and "The 15 states that bank served in 2026-09". The reviewer judges the tense. |
| 3 | met (as far as the worker can check) | A tokenizer that strips `//` and `/* */` comments (string-aware) and removes all whitespace finds the branch file identical to `git show 2634fc8:question-bank/src/curated/us-states.ts`. `bun run build -- --offline --out data/us-states` and `bun run questions` both exit 0 and leave `git status` clean, so `question-bank/data/` is byte-identical. `backend/app/data/content.json` is untouched. The worker did not run a separate deep-equal of the exports; it follows from the comment-stripped identity. |
| 4 | **see contradiction below** | `git diff --stat 2634fc8` touches `question-bank/src/curated/us-states.ts`, this brief, **`tasks.md`** and **`runs/T-111-us-states-15-states-comments.md`**. |

### Contradiction with the brief: criterion 4 versus the loop's own commits

Criterion 4 allows only `us-states.ts`, the brief and test files. The expander's commit `428a89f` flips `tasks.md` T-111 from `todo` to `doing`, and the orchestrator's commit `7c9512e` adds `runs/T-111-us-states-15-states-comments.md`. Neither file is the worker's, and the process puts both there. Read literally, criterion 4 fails on files the worker did not touch.
- **Decided:** the worker left both files alone, because reverting the loop's bookkeeping is not the worker's job.
- **Who decides:** the tester should judge whether these process files fall outside criterion 4's intent. If the tester reads criterion 4 strictly, it goes back to the `task-expander`, which should add `tasks.md` and `runs/` to the allowed list in future light briefs.

### Tests made stale

These are the four reds in `cd question-bank && bun test` (2763 pass, 4 fail). Each one is a pin, not a behaviour test.

1. **`question-bank/src/agriculture-true-wrong-answers-verify.test.ts`**, test "T-088 criteria 20-25: what must not change > criterion 20: curated/us-states.ts is byte-identical to main's". The file is now `98afb4d5…`, against the pinned `e61e8e50…`. It is made stale by criteria 1–2 (a comment-only edit to this file). **Proposed:** modify the `MAIN_FILE_SHA` entry for `question-bank/src/curated/us-states.ts` to the new sha256, `98afb4d56d4eb55b07fc2dfeb933bd0d8d3addd43d79288f48cdefeb53cd97fd`. Deleting it is the other option.
2. **`question-bank/src/climate-cold-trade-accepted-verify.test.ts`**, test "T-091 criterion 20: no non-test source file moves > every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's". The tree is now `05dc94e8…`, against the pinned `6b45b3a1…`. It is made stale by the same edit. **Proposed:** modify `MAIN_SOURCE_TREES_SHA` to `05dc94e8e6c01091a7c4f76476f55b5485e7c5ef6854a0f36d86712b582ee8c3`. The tester should recompute it after any CI-fix change.
3. **`question-bank/src/farm-animal-loose-ends-verify.test.ts`**, test "T-096 criteria 17-21: the bank and the boundaries > criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added". It expects `280` and gets `282`. **This red is not caused by the worker's change.** It was already red at `7c9512e`, with the worker's edit stashed, because the two new tracked files are this brief and the run log. **Proposed:** modify the count floor to `282`, in the file's existing "was N" comment chain. Alternatively, have the loop stop counting `tasks/` and `runs/` (a P-17 matter, owned by `process-tasks.md`).
4. **`question-bank/src/climate-cold-trade-accepted-verify.test.ts`**, test "T-091 criterion 22: the diff touches only the allowed files > every tracked non-test file outside the allowed list is 12d242e's, and none is added". It expects `MAIN_UNTOUCHABLE_COUNT` `283` and gets `285`. It was already red before the worker's edit, for the same reason as 3. **Proposed:** modify `MAIN_UNTOUCHABLE_COUNT` to `285`.

### How to run

```
cd question-bank && bun install --frozen-lockfile   # node_modules was missing in this container; without it lint/typecheck/oxlint tests fail
bun run format:check && bun run typecheck && bun run lint && bun test
bun run build -- --offline --out data/us-states && bun run questions && git status --short   # expect clean
cd ../backend && uv run pytest -q                     # 1221 passed, 9 skipped
git diff --stat origin/main                           # criterion 4
```

### What was run, and what was not

- **question-bank:** `format:check`, `typecheck` and `lint` are clean. `bun test` gives 2763 pass and 4 fail; the four are the reds listed above.
- **backend:** `uv run pytest -q` gives 1221 passed and 9 skipped.
- **frontend: not fully run.** `bun install --frozen-lockfile` failed with `ProxyConnectFailed (403) downloading tarball d3-zoom@2.0.0`, so `react-simple-maps` and `us-atlas` are missing in this container.
  - Because of that, `bun run typecheck` fails on `t051-tester.criteria.test.tsx`, and `bun test` gives 434 pass and 4 fail, all of them "Cannot find package 'react-simple-maps'".
  - This is an environment problem, and the change touches nothing under `frontend/`. The tester should rerun the frontend in an environment that can fetch the package, or rely on CI.

### Deliberately not done

- **`backend/tests/test_region_vocabulary.py` line 10's docstring** was left alone, per the Notes. It is a test file, and changing it is not the worker's job.
- **No new test** was written. Criteria 1–2 are grep-shaped, and the brief says not to add a committed pin (P-17).

## Verdict

**TL;DR: `fail`, to the `ci-fix`, for stale pins only.** All four criteria are met on `ff58bb2`. That includes criterion 4 as amended. The `question-bank` suite has **5 reds**, and every one is a whole-tree or whole-file pin made stale by this task's own files. No behaviour test is red. The 6 rows below go to the `ci-fix` for its plan (D-20). Row 6 is new this round.

**Independence:** this is an orchestrated run (`runs/T-111-us-states-15-states-comments.md` exists), so the session-id check proves nothing. My id, `cse_011oDiJfSMW5AuCAW3Bk9Ste`, is already listed for every earlier role. My independence rests only on being a freshly spawned subagent with its own context. I did not see the worker's session, its reasoning, or the first tester's. That is weaker evidence than a separate session, because it depends on the orchestrator having spawned me correctly.

**Round history:** round 1's tester returned `blocked` on criterion 4's wording. The expander amended criterion 4 (`80abbee`). This is round 2, and I re-verified every criterion from scratch.

| # | Verdict | Evidence |
|---|---|---|
| 1 | **met** | `question-bank/src/us-states-region-comment-verify.test.ts` › "T-111 criterion 1": 3 tests, green. |
| 2 | **met** | The same file › "T-111 criterion 2": 35 tests, green. They cover `T-017`, `2026-09-18`, `E-9`, `15`/`fifteen`, and the 13 region values and 15 state names, each in backticks, all inside the region paragraph. **Tense is the reviewer's call.** The sentences are "then the 15 states served at the time) returned" and "The 15 states that bank served in 2026-09". |
| 3 | **met** (checked at hand-off, not pinned, per the brief) | **Comments only:** `Bun.Transpiler` (`minifyWhitespace`) output is identical for the branch file and `git show 2634fc8:…`. Every `+`/`-` line of `git diff -U0 2634fc8 -- question-bank/src/curated/us-states.ts` starts with ` *`. **Exports:** I imported all 5 from both versions. `CURATED_US_STATES`, `HIGHEST_POINT_M_SOURCE`, `curatedByName` and `curatedByPostal` are deep-equal (`util.isDeepStrictEqual`), and `entityIdFor` has identical source. **Data:** `git diff --quiet 2634fc8 -- question-bank/data backend/app/data/content.json` exits 0. `bun run build -- --offline --out data/us-states` and `bun run questions` exit 0 and leave `git status` clean. |
| 4 | **met** | See the diff below. |

### Criterion 4: `git diff --name-status origin/main...HEAD` (`origin/main` = `2634fc8`, HEAD = `ff58bb2`)

```
M	question-bank/src/curated/us-states.ts
A	question-bank/src/us-states-region-comment-verify.test.ts
A	runs/T-111-us-states-15-states-comments.md
M	tasks.md
A	tasks/T-111-us-states-15-states-comments.md
```

- **The change, records and run log:** `us-states.ts`, the brief and the run log are each named in the allow-list.
- **The new test file:** `us-states-region-comment-verify.test.ts` is a `.test.ts` that does not exist on `main`, so it is allowed.
- **No pre-existing test file has changed yet.** Rows 1 to 6 below, once approved and applied, are the only route for that.
- **`tasks.md`:** its only hunk is T-111's own `###` heading (`todo` → `doing`).
- **Not in the list:** `PROGRESS.md`, and every `package.json`, `bun.lock`, `uv.lock` and `pyproject.toml`.

### Suite, as run on `ff58bb2`

- **question-bank:**
  - `format:check`, `typecheck` and `lint` are clean.
  - `bun test` gives **2800 pass, 5 fail**. The 5 reds are the stale pins in rows 1 to 4 and 6.
  - CI's `question-bank` job is red on `ff58bb2` for the same reason. The other CI jobs are green: frontend, both backend jobs, integration, e2e, and the blocked-run notice.
- **backend:** `uv run pytest -q` gives 1221 passed, 9 skipped.
- **frontend: environmental failures only.**
  - Locally, `bun install --frozen-lockfile` fails with `ProxyConnectFailed (403)` (d3-array). As a result, `typecheck` fails on the missing `react-simple-maps`/`us-atlas`, and `bun test` gives 434 pass, 4 fail.
  - `lint` is clean.
  - CI's `frontend (typecheck, lint, test)` job is **green** on `ff58bb2`.

**The 5 red tests**, each mapped to its row:
1. `agriculture-true-wrong-answers-verify.test.ts` › "criterion 20: curated/us-states.ts is byte-identical to main's" (row 1)
2. `climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 20 … is 12d242e's" (row 2)
3. `farm-animal-loose-ends-verify.test.ts` › "criterion 21: … none is added" (row 3)
4. `climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22 … every tracked non-test file … none is added" (row 4)
5. `climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22 … pre-existing test files are main's, except ones in an approved Test change request" (**row 6, new**)

Row 5's test is green today. It goes red once rows 1 and 3 are applied.

**Why row 6 is new:** the round-1 tester counted 4 reds, because its test file was not yet tracked when it ran. Now that `us-states-region-comment-verify.test.ts` is committed, `MAIN_TESTS_COUNT` sees 133 test files against 132. This is the same shape as T-108's CI fix plan row 3.

### Mutations of `us-states.ts` (re-run this round; all reverted, `cmp` against a backup confirmed)

| # | Mutation | Result |
|---|---|---|
| M1 | Whole file replaced by `main`'s (`2634fc8`) | 3 criterion-1 tests red |
| M2 | "served in 2026-09" → "served Today" | `today` test red |
| M3 | `` `engineering-decisions.md` E-9 `` → `E9` | `E-9` test red |
| M4 | Backticks removed from `Kansas` | `Kansas` test red |
| M5 | Both "15 states" → "states" | `15`/`fifteen` test red |
| M6 | Backticks removed from `Great Basin` | `Great Basin` test red |

Round 1 recorded a fuller mutation table (M1 to M10), with the same outcomes for the overlapping cases.

### Pre-existing tests

- **None deleted or modified.** The rows below have Decision blank, and are **routed to the `ci-fix`** (D-20).
- **I re-checked rows 1 to 4 on `ff58bb2`.** I applied them scratch to the working tree and read off the observed digests, then reverted with `git checkout`. Rows 1 to 4 reproduce the round-1 digests exactly. Row 6's digest was observed the same way.
- **Row 5's digests cannot be precomputed.** They are the whole-file sha256 of two test files after the `ci-fix` writes its own comment lines into them, so the `ci-fix` computes them after applying rows 1 and 3.

## Test change request

Written by the tester (round 1), then re-checked and extended with row 6 by the round-2 tester. Both were orchestrated runs. **Decision is blank on every row: nobody has approved anything.**

- **Routed to the `ci-fix` (D-20)** for its CI fix plan.
- **Recompute before applying.** If `origin/main` moves, merge it first, then recompute every digest and count.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` › "T-088 criteria 20-25: what must not change" › "criterion 20: curated/us-states.ts is byte-identical to main's" | `e9d666e`, T-088 tester: `us-states.ts` must not move during T-088 | Criteria 1–2 require a comment edit to `us-states.ts`, so the whole-file sha256 moves: it is now `98afb4d5…`, against the pinned `e61e8e50…` | modify | The same name and assertion. `MAIN_FILE_SHA["question-bank/src/curated/us-states.ts"]` is re-pinned to `98afb4d56d4eb55b07fc2dfeb933bd0d8d3addd43d79288f48cdefeb53cd97fd`, with a comment citing T-111 and its plan row (a comment-only edit, criterion 3) | |
| 2 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 20: no non-test source file moves" › "every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's" | `950f334`, T-091 tester: no non-test source file moves | Same edit: `us-states.ts` is under `question-bank/src/`. The digest is now `05dc94e8…`, against `6b45b3a1…` | modify | The same name and assertion. `MAIN_SOURCE_TREES_SHA` is re-pinned to `05dc94e8e6c01091a7c4f76476f55b5485e7c5ef6854a0f36d86712b582ee8c3`, with a "Re-pinned by T-111 … us-states.ts comment moved" line | |
| 3 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21: the bank and the boundaries" › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096 tester: no stray non-test file changed or added | T-111 adds its brief and run log (count 282 vs 280), and its `us-states.ts` edit changes a counted file | modify | The same name and assertions. Add `tasks/T-111-us-states-15-states-comments.md` and `runs/T-111-us-states-15-states-comments.md` to `CRITERION_21_ALLOWED`, with a comment citing the row. `toBe(280)` is **unchanged**. `MAIN_UNTOUCHABLE_SHA` is re-pinned to `689e2d1289e22524b7c701457af9b4e4b22185df32fda9b159229a959fee1dcb` (observed with the two files allowed), with a "Re-pinned by T-111 … us-states.ts moved; brief and run log join the allowed set (count unchanged, 280)" line | |
| 4 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091 tester: no stray non-test file changed or added | The same two files (285 vs 283) and the same `us-states.ts` edit | modify | The same name and assertions. Add the two T-111 files to `CRITERION_22_ALLOWED`, with a comment. `MAIN_UNTOUCHABLE_COUNT` is **unchanged at 283**. `MAIN_UNTOUCHABLE_SHA` is re-pinned to `d030f3e5fb7cf461a886d00942673314ec895c58ef083e3925f6255b4310675f`, with a re-pin comment line | |
| 5 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | `bac230d`, T-091 tester: the request files carry exactly their approved re-pins | **Green today.** It goes red as a consequence of rows 1 and 3, because it pins the whole-file sha256 of `agriculture-true-wrong-answers-verify.test.ts` and `farm-animal-loose-ends-verify.test.ts` in `APPLIED_REQUEST_FILE_SHAS` (observed red in the scratch run) | modify | The same name and assertions. Those two entries of `APPLIED_REQUEST_FILE_SHAS` are re-pinned to the files' sha256 after rows 1 and 3 are applied, with a "then by T-111 (row N, for its rows 1 and 3)" comment. All other entries stay unchanged | |
| 6 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "pre-existing test files are main's, except ones in an approved Test change request" | `950f334`, T-091 tester: no pre-existing test file changes outside an approved row, and none is added unannounced | T-111's tester added `question-bank/src/us-states-region-comment-verify.test.ts` (criteria 1-2), a new tracked test file: count 133 vs 132, and the digest moves | modify | The same name and assertions. `MAIN_TESTS_COUNT` goes 132 → 133 and `MAIN_TESTS_SHA` is re-pinned to `2665348439773d3c1fb27a430c6877acc94971e66d20a325952e37633f16380d` (observed on `ff58bb2` with rows 1-4 applied), each with a "Re-pinned by T-111 (CI fix plan row N): T-111's tester added us-states-region-comment-verify.test.ts (132 -> 133)" comment, as T-108 did | |
