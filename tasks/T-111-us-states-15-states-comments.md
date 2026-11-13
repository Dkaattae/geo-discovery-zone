# T-111 — Two `us-states.ts` comments still say "the 15 states shipping today"

**Status:** `approved`
**Next step:** `human` (merge PR #136; routine, not escalated)
**Approved:** orchestrator — 2026-11-13, unattended run (re-stamped after criterion 4 amendment). See `runs/T-111-us-states-15-states-comments.md`.
**Test changes:** `applied through CI fix plan (D-20)`
**CI fix:** `applied — approved — Dkaattae, 2026-11-13, given in the orchestrator's session`
**From:** [`tasks.md`](../tasks.md) T-111
**Branch:** `claude/amazing-franklin-j3x3l1`
**PR:** #136, opened draft at expand time, built from the branch above. Stays draft until the reviewer approves it.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste |
| worker | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste |
| tester | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated: shared id, fresh subagent) |
| task-expander (amendment) | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated, fresh spawn; amended criterion 4 only) |
| tester (round 2) | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated: shared id, fresh subagent) |
| ci-fix | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated: shared id, fresh subagent; pass 1, plan) |
| ci-fix (pass 2) | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated: shared id, fresh subagent; applied the approved plan) |
| tester (round 3) | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated: shared id, fresh subagent) |
| reviewer | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated: shared id, fresh subagent) |

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

**TL;DR: `pass`, to the `reviewer`.** Round 3, on `ed8ea7c`, after the `ci-fix` applied the approved plan. All four criteria are met. `question-bank` is **2805 pass / 0 fail**, with `format:check`, `typecheck` and `lint` clean, and the backend is 1221 passed / 9 skipped. The three pre-existing test files changed only as CI fix plan rows 1 to 6 say. One thing for the reviewer: row 5's farm digest was recomputed (`377286f4…`), so it is not the `95d04a10…` written in the approved row.

**Independence:** this is an orchestrated run (`runs/T-111-us-states-15-states-comments.md` exists), so the session-id check proves nothing. My id, `cse_011oDiJfSMW5AuCAW3Bk9Ste`, is listed for every earlier role. My only independence is that I am a freshly spawned subagent with my own context. I did not see any earlier role's session or reasoning. That is weaker evidence than a separate session, because it depends on the orchestrator having spawned me correctly.

**Round history:**
- **Round 1:** `blocked` on criterion 4's wording, which the expander then amended (`80abbee`).
- **Round 2:** `fail` (`6ed5ff5`), for stale pins only. Its 6 rows were routed to the `ci-fix` (D-20).
- **Round 3 (this one):** the `ci-fix` planned the rows (`218304a`), Dkaattae approved the plan, and the `ci-fix` applied it (`7684638`). I re-verified every criterion from scratch.

| # | Verdict | Evidence |
|---|---|---|
| 1 | **met** | `grep -niE "shipping today\|already served"` on `us-states.ts` finds nothing. The region paragraph (from `` **`region` vocabulary `` to its `*/`) contains `today` 0 times. `us-states-region-comment-verify.test.ts` › "T-111 criterion 1" is green. |
| 2 | **met** | **Strings:** `T-017`, `2026-09-18` and `E-9` are all present in the paragraph. **The 13 region values and 15 state names:** each is in backticks, checked with line breaks joined. **`15`:** it appears on paragraph lines 3 and 14, "then the 15 states served at the time" and "The 15 states that bank served in 2026-09". **Tense is the reviewer's call.** The criterion 2 tests are green. |
| 3 | **met** (checked at hand-off, not pinned) | **Comments only:** `Bun.Transpiler` (`minifyWhitespace`) gives the same output for the branch file and `git show 2634fc8:…`. Every changed line in `git diff -U0 2634fc8` is a ` *` comment line. **Exports:** all 5 deep-equal `main`'s. `CURATED_US_STATES`, `HIGHEST_POINT_M_SOURCE`, `curatedByName` and `curatedByPostal` were compared with `isDeepStrictEqual`, and `entityIdFor` has identical source. **Data:** `git diff --quiet 2634fc8 -- question-bank/data backend/app/data/content.json` exits 0. `bun run build -- --offline --out data/us-states` and `bun run questions` both exit 0 and leave `git status` clean. |
| 4 | **met** | See the diff below. |

### Criterion 4: `git diff --name-status origin/main...HEAD` (`origin/main` = `2634fc8`, an ancestor of HEAD = `ed8ea7c`)

```
M	question-bank/src/agriculture-true-wrong-answers-verify.test.ts
M	question-bank/src/climate-cold-trade-accepted-verify.test.ts
M	question-bank/src/curated/us-states.ts
M	question-bank/src/farm-animal-loose-ends-verify.test.ts
A	question-bank/src/us-states-region-comment-verify.test.ts
A	runs/T-111-us-states-15-states-comments.md
M	tasks.md
A	tasks/T-111-us-states-15-states-comments.md
```

- **The change and the records:** `us-states.ts`, this brief, the run log and `tasks.md` are all on the allow-list. `tasks.md`'s only hunk is T-111's own `###` heading (`todo` → `doing`).
- **The new test file:** `us-states-region-comment-verify.test.ts` does not exist on `main`, so it is allowed.
- **Pre-existing test files:** three changed, each only through an approved CI fix plan row (header: `CI fix: applied — approved — Dkaattae, 2026-11-13, given in the orchestrator's session`). I read `git diff origin/main...HEAD` for each one:
  - `agriculture-true-wrong-answers-verify.test.ts` changed by **row 1** only. `MAIN_FILE_SHA[us-states.ts]` is now `98afb4d5…`, which equals the file's actual sha256, and the comment matches the row verbatim.
  - `farm-animal-loose-ends-verify.test.ts` changed by **row 3** only. The two T-111 files joined `CRITERION_21_ALLOWED`, and `MAIN_UNTOUCHABLE_SHA` is now `689e2d12…`. `toBe(280)` is unchanged.
  - `climate-cold-trade-accepted-verify.test.ts` changed by these rows:
    - **Row 2:** `MAIN_SOURCE_TREES_SHA` is now `05dc94e8…`.
    - **Row 4:** the two T-111 files joined `CRITERION_22_ALLOWED`, and `MAIN_UNTOUCHABLE_SHA` is now `d030f3e5…`. `MAIN_UNTOUCHABLE_COUNT` stays 283.
    - **Row 5:** only the agriculture entry (`0206241e…`) and the farm entry (`377286f4…`) changed. Both equal the files' actual sha256.
    - **Row 6:** `MAIN_TESTS_COUNT` went 132 → 133, and `MAIN_TESTS_SHA` is now `26653484…`.
  - **Nothing else changed** in any of the three files. No assertion was weakened, and no count was lowered.
- **Row 5's farm digest differs from the approved row's value** (`95d04a10…` was approved, `377286f4…` was applied). The `ci-fix` says why: row 3's comment had to name the header's approval, which did not exist at pass 1. The plan allowed this ("Pass 2 must use that text verbatim, or recompute row 5 and say so"). The new value is the file's real digest after rows 1 and 3, so the pin is as strong as before. **The reviewer may want a person to confirm they accept this.**
- **Not in the list:** `PROGRESS.md`, and every `package.json`, `bun.lock`, `uv.lock` and `pyproject.toml`.

### Suite, as run on `ed8ea7c`

- **question-bank:** `format:check`, `typecheck` and `lint` are clean. `bun test` gives **2805 pass, 0 fail** (75 files).
- **backend:** `uv run pytest -q` gives 1221 passed, 9 skipped.
- **frontend:**
  - `lint` is clean.
  - I did not re-run `typecheck` or `bun test` locally. Earlier roles found that `bun install` fails here with a proxy 403, and no frontend file is touched.
- **CI on `ed8ea7c`:**
  - **Green:** `question-bank`, `backend (lint, format, test)`, `backend (postgres)` and `integration`.
  - **Still running when I checked:** `frontend` and `e2e`. They were green on `ff58bb2`, and no frontend file has changed since.

### Mutations of `us-states.ts` (this round; each reverted, `cmp` against a backup confirmed, `git status` clean)

| # | Mutation | Result on `us-states-region-comment-verify.test.ts` |
|---|---|---|
| M1 | "served at the" → "shipping today at the" | 2 red (`shipping today`, `today`) |
| M2 | Backticks removed from `Nevada` | 1 red (`Nevada`) |
| M3 | `(T-017, 2026-09-18)` → `(T-01, 2026-09-18)` | 34 red |

Rounds 1 and 2 recorded fuller mutation tables (M1 to M10, and M1 to M6), with consistent results.

### Pre-existing tests

- **I deleted and modified none myself.** The changes above are the `ci-fix`'s, made through approved plan rows 1 to 6.

## Review

**TL;DR: approved, inside the envelope, not escalated.** The comment edit is exactly what T-111 asked for, the six pin changes are exactly the approved CI fix plan rows, and every role stayed in its lane. Next: Dkaattae merges PR #136 when convenient.

**Every role's work is in the PR.** Each Sessions row has a commit on `claude/amazing-franklin-j3x3l1`: expander `428a89f`/`486ee0a`/`80abbee`, worker `4cd2093`, tester `988c08e`/`6ed5ff5`/`fbdab9f`, ci-fix `218304a`/`7684638`.

**Lanes (D-7):**
- **Expander** commits touch only `tasks/` and `tasks.md` (T-111's heading, `todo` → `doing`).
- **Worker** touched `us-states.ts` (comment lines only) and the brief.
- **Tester** added one new test file and edited the brief; no source, no pre-existing test.
- **ci-fix** `7684638` changed only the three files named by plan rows 1–6, and within them only the named constants, allowed-set entries and comments.

**Findings:**

| # | Finding | Blocks? | Disposition |
|---|---|---|---|
| 1 | **Tense reads right.** "then the 15 states served at the time) returned" and "The 15 states that bank served in 2026-09 … carry the exact value `content.json` shipped for them then". "carry" is present tense about this table's rows, which is still true. Criterion 2's tense call: met. | no | — |
| 2 | **Re-wrap left one short line**, `us-states.ts` " * Northeast). See" before " * `engineering-decisions.md` E-9 …". Cosmetic only. | no | Not queued: a one-word re-wrap is not worth a task or another round of whole-file pins. |
| 3 | **CI fix plan row 5's farm digest was recomputed** (`377286f4…` applied, `95d04a10…` written). | no | **Decided here: accepted.** The approved plan itself says "Pass 2 must use that text verbatim, or recompute row 5 and say so", the ci-fix said so, and `377286f4…` is the file's real sha256 after rows 1 and 3 (suite green). The approval covers the recompute; no separate human confirmation needed. |
| 4 | **Worker's criterion-4 contradiction** (loop records not on the allow-list). | no | Already settled: the expander amended criterion 4 (`80abbee`), re-stamped. |
| 5 | **`backend/tests/test_region_vocabulary.py:10` docstring** still says "the 15 states already served". | no | **Decided here: leave it.** It describes T-017's criterion 3 as written, inside a test that still checks those 15 states' regions; the brief's Notes put it out of scope. No task. |
| 6 | **The tree pins went red again by design** (P-17). | no | Already owned by `process-tasks.md` P-17; nothing new to add. |
| 7 | **The new test pins comment text permanently.** A later edit to this paragraph must keep T-017, E-9, the 13 regions and the 15 names. That is the point (the decision record), and it is not a hash pin. | no | Accepted. |

**Envelope (process.md step 6 / reviewer §3):**
- Tester **pass**; I re-ran `question-bank` `bun test`: **2805 pass, 0 fail**. CI on `ed8ea7c` and `7684638`: all jobs **success**.
- No file outside criterion 4's list; no dependency; nothing in `openapi.yaml`, a migration or `geoquizdataplan.md`; no child-facing text (comment only).
- Pre-existing tests changed only via CI fix plan rows approved by a **person** (Dkaattae, logged verbatim in `runs/`, line 213); `git log -p` shows `CI fix:` never carried an orchestrator stamp.
- No product decision settled; the diff is small and nothing surprised me.

## CI fix plan

**TL;DR:** no code is wrong. All 5 reds are pins that T-111's own files made stale, and 1 more pin goes red once those are fixed. The plan has 6 `pre-existing test` rows, one per Test change request row, each re-checked. I tried them all together in a throwaway worktree, and the suite went fully green. **Nothing here is applied yet.**

Pass 1, written by the `ci-fix`. This run is orchestrated, so there was nobody to ask in-session.

**Independence:** this is an orchestrated run (`runs/T-111-us-states-15-states-comments.md` exists), so the session-id check proves nothing. My id, `cse_011oDiJfSMW5AuCAW3Bk9Ste`, is also listed for the expander, the worker and both testers. My only independence is that I am a freshly spawned subagent and saw none of their sessions.

**Reproduced red** on `21da551`: `cd question-bank && bun test` gave 2800 pass, 5 fail. The 5 are exactly the tests in the Verdict.

**Trial:** I applied rows 1 to 6 in a throwaway worktree of `21da551`, with the exact comment text below, then removed it. The working tree is unchanged.
- **question-bank:** `bun test` gave **2805 pass, 0 fail**. `format:check`, `lint` and `typecheck` were clean.
- **backend:** `uv run pytest -q` gave 1221 passed, 9 skipped.
- **Row-5 timing:** with rows 1 to 4 and 6 applied, row 5's test was the only red, as the tester predicted.

**Base:** `origin/main` is still `2634fc8`, an ancestor of HEAD, so no recompute is needed. If `main` moves before pass 2, every digest below must be recomputed. Under "Check the plan still holds", that sends the plan back round pass 1.

**Every digest below was observed, not derived.** Rows 1, 2, 3, 4 and 6 match the tester's values exactly. The tester could not precompute row 5; its values are the digests of the two files after rows 1 and 3 are applied with the comment text written in those rows. Pass 2 must use that text verbatim, or recompute row 5 and say so.

| # | File (and function or test) | Kind | Change | Why — failing test or CI line, root cause, criterion quoted for a test row | Decision |
|---|---|---|---|---|---|
| 1 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` › `MAIN_FILE_SHA["question-bank/src/curated/us-states.ts"]`, used by "T-088 criteria 20-25: what must not change > criterion 20: curated/us-states.ts is byte-identical to main's" | pre-existing test (request row 1) | **Modify (re-pin).** `e61e8e50bd0fa6f1c958698009e23c3e92b83ba1e2af71426c6ae7afb95b4cbc` → `98afb4d56d4eb55b07fc2dfeb933bd0d8d3addd43d79288f48cdefeb53cd97fd`. Add two comment lines directly above the key: `// re-pinned by T-111 (CI fix plan row 1): T-111 past-tensed two comments in the` / `// region paragraph (comments only, its criterion 3).` The test name and assertion do not change | **Fails:** the digest is `98afb4d5…`, against `e61e8e50…`. **Cause:** criteria 1 and 2 require editing this file's comment ("no line contains the phrase `shipping today`"), so its whole-file digest must move. **Introduced:** `e9d666e` (T-088 tester), protecting `us-states.ts` from moving during T-088. **Strength:** it still pins the file byte-for-byte, now to the content criteria 1 to 3 require. Criterion 3 (comments only) was checked by the tester at hand-off | approved — Dkaattae, 2026-11-13 (whole plan: "approve the T-111 CI fix plan", given in the orchestrator's session; see `runs/`) |
| 2 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `MAIN_SOURCE_TREES_SHA`, used by "T-091 criterion 20: no non-test source file moves > every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's" | pre-existing test (request row 2) | **Modify (re-pin).** `6b45b3a1…f21` → `05dc94e8e6c01091a7c4f76476f55b5485e7c5ef6854a0f36d86712b582ee8c3`. Add `// Re-pinned by T-111 (CI fix plan row 2): question-bank/src/curated/us-states.ts moved (comments only).` above the const | **Fails:** the digest is `05dc94e8…`, against `6b45b3a1…`. **Cause:** the same edit, and `us-states.ts` is under `question-bank/src/`. **Introduced:** `950f334` (T-091 tester), protecting against any non-test source file moving. **Strength:** every file in the three trees is still pinned. `us-states.ts` is the only one that moved | approved — Dkaattae, 2026-11-13 (whole plan: "approve the T-111 CI fix plan", given in the orchestrator's session; see `runs/`) |
| 3 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `CRITERION_21_ALLOWED` and `MAIN_UNTOUCHABLE_SHA`, used by "T-096 criteria 17-21: the bank and the boundaries > criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | pre-existing test (request row 3) | **Modify.** Add `"tasks/T-111-us-states-15-states-comments.md"` and `"runs/T-111-us-states-15-states-comments.md"` at the top of `CRITERION_21_ALLOWED`, under a comment saying they joined through T-111's CI fix plan row 3 and naming the approval as it reads in the header. Re-pin `MAIN_UNTOUCHABLE_SHA` from `c274a19e…` to `689e2d1289e22524b7c701457af9b4e4b22185df32fda9b159229a959fee1dcb`, with the line `// Re-pinned by T-111 (CI fix plan row 3): question-bank/src/curated/us-states.ts moved (comments only);` / `// T-111's brief and run log join the allowed set (count unchanged, 280).`. **`toBe(280)` is unchanged** | **Fails:** 282, against 280. **Cause:** T-111 adds two new tracked non-test files (its brief and its run log), and `us-states.ts`, a counted file, moved. **Introduced:** `47581ea` (T-096 tester), protecting against any stray non-test file being changed or added. **Criterion 4** lists "this brief" and "`runs/T-111-us-states-15-states-comments.md`" as the loop's records, and "`question-bank/src/curated/us-states.ts`" as the change. **Strength:** the count stays at 280. `us-states.ts` stays counted and is pinned by digest, which is stronger than putting it in the allowed set. This follows T-108 rows 1 and 2 | approved — Dkaattae, 2026-11-13 (whole plan: "approve the T-111 CI fix plan", given in the orchestrator's session; see `runs/`) |
| 4 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `CRITERION_22_ALLOWED` and `MAIN_UNTOUCHABLE_SHA`, used by "T-091 criterion 22: the diff touches only the allowed files > every tracked non-test file outside the allowed list is 12d242e's, and none is added" | pre-existing test (request row 4) | **Modify.** Add the same two T-111 files at the top of `CRITERION_22_ALLOWED`, under a comment naming T-111's CI fix plan row 4 and its approval. Re-pin `MAIN_UNTOUCHABLE_SHA` from `53524b09…` to `d030f3e5fb7cf461a886d00942673314ec895c58ef083e3925f6255b4310675f`, with the line `// Re-pinned by T-111 (CI fix plan row 4): question-bank/src/curated/us-states.ts moved (comments only);` / `// T-111's brief and run log join the allowed set (count unchanged, 283).`. **`MAIN_UNTOUCHABLE_COUNT` stays at 283** | **Fails:** 285, against 283. **Cause:** the same as row 3. **Introduced:** `950f334` (T-091 tester), protecting the same thing against T-091's base. **Criterion 4**, as in row 3. **Strength:** as in row 3 | approved — Dkaattae, 2026-11-13 (whole plan: "approve the T-111 CI fix plan", given in the orchestrator's session; see `runs/`) |
| 5 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `APPLIED_REQUEST_FILE_SHAS`, its `agriculture-true-wrong-answers-verify.test.ts` and `farm-animal-loose-ends-verify.test.ts` entries, used by "T-091 criterion 22 … > each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | pre-existing test (request row 5) | **Modify (re-pin). Apply after rows 1 and 3.** Change agriculture `87a2820d…` → `0206241ec21ba762a3352e44e49cd941e06239582c51303ded70ed825a9b9061` and farm `a1316c61…` → `95d04a10a1b5d4572baa1defae3ed29ed1fc699ca5ac16895f37757a1ee7e143`. These are the observed sha256 of each file after rows 1 and 3, with exactly the comment text those rows give. Append `// then by T-111 (CI fix plan row 5, for its row 1)` and `// then by T-111 (CI fix plan row 5, for its row 3)` to the two entries' comment chains. No other entry changes | **Green now; red once rows 1 and 3 land** (seen in the trial: "Expected - 2 / Received + 2"). **Cause:** rows 1 and 3 edit two files that this map pins whole. **Introduced:** `bac230d` (T-091 tester, review finding 1), protecting against a request file changing beyond its approved re-pins. **Criterion 4:** "A test file that exists on `main` may change only through a row of this brief's … CI fix plan whose approval is recorded". The new digests admit exactly rows 1 and 3 and nothing more | approved — Dkaattae, 2026-11-13 (whole plan: "approve the T-111 CI fix plan", given in the orchestrator's session; see `runs/`) |
| 6 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `MAIN_TESTS_COUNT`, `MAIN_TESTS_SHA`, used by "T-091 criterion 22 … > pre-existing test files are main's, except ones in an approved Test change request" | pre-existing test (request row 6) | **Modify (re-pin).** `MAIN_TESTS_COUNT` 132 → 133, with `// Re-pinned by T-111 (CI fix plan row 6): T-111's tester added` / `// us-states-region-comment-verify.test.ts (132 -> 133).`. `MAIN_TESTS_SHA` `c39ee799…` → `2665348439773d3c1fb27a430c6877acc94971e66d20a325952e37633f16380d`, with `// Re-pinned by T-111 (CI fix plan row 6): T-111's tester added` / `// us-states-region-comment-verify.test.ts.`. The digest does not depend on rows 1 to 5, because the files they edit are excluded from this set | **Fails:** 133, against 132. **Cause:** T-111's tester added `question-bank/src/us-states-region-comment-verify.test.ts` (criteria 1 and 2), the only tracked test file that differs. **Introduced:** `950f334` (T-091 tester), protecting against test files being added or changed outside an approved row. **Criterion 4:** "A test file that does not exist on `main` may be added." **Strength:** the other 132 stay pinned as hard as before. This follows T-108 row 3 | approved — Dkaattae, 2026-11-13 (whole plan: "approve the T-111 CI fix plan", given in the orchestrator's session; see `runs/`) |

**Root cause:** No code is wrong, and criteria 1 to 4 are met (Verdict). Four "nothing else moved" pins, from T-088, T-091 and T-096, hash `us-states.ts`, the source trees, or every tracked file outside a hand-kept allowed set. T-111's comment edit to `us-states.ts`, its new brief and run log, and its tester's new test file move them by design, as the brief's Notes predicted ("Expect whole-file pins to go red"). Re-pinning two of those files then moves the T-091 map that pins request files whole (row 5). This is the recurring P-17 pattern seen in T-104 to T-108.

**Not doing:**
- **Adding `us-states.ts` to the allowed sets** (as T-106 did for `README.md`) to keep `MAIN_UNTOUCHABLE_SHA` at its old value. Rejected: it would take the file out of the count and digest. Re-pinning keeps it pinned to its new bytes.
- **Rewriting the pins to read `tasks/` and `runs/` by glob.** That would stop this recurring, but it changes what the pins protect. It is a loop change (P-17, `process-tasks.md`), not this task's.
- **`backend/tests/test_region_vocabulary.py` line 10's docstring.** The brief's Notes leave it alone. It is not red.
- **`backend/tests/test_t088_tester_criteria.py`** names `agriculture-true-wrong-answers-verify.test.ts` only in its docstring. It hashes nothing there and is green in the trial.
- **Frontend reds seen locally** (`react-simple-maps` missing). They come from a proxy 403 on install, and CI's frontend job is green on `ff58bb2`. Nothing in this plan touches them.

To approve by hand: fill in Decision, set the header's `CI fix:` to `approved — <name>, <date>` and `Next step` to `ci-fix`, commit, and start a run.

## CI fix

**TL;DR: all 6 approved rows applied, `question-bank` now 2805 pass / 0 fail.** No source changed; only the six stale pins the plan named. Row 5's farm digest was recomputed (the plan allowed this). Next: a fresh `tester`.

**Approval:** header read `CI fix: approved — Dkaattae, 2026-11-13, given in the orchestrator's session`. Dkaattae's words, as the orchestrator logged them in `runs/T-111-us-states-15-states-comments.md`: "approve the T-111 CI fix plan". That approves the whole plan, so I recorded it in each row's Decision; the rows had no Decision cell filled in. I did not hear it myself (see Independence).

**Applied, file by file** (nothing refused, nothing added):
- `question-bank/src/agriculture-true-wrong-answers-verify.test.ts`: **row 1**, `MAIN_FILE_SHA[us-states.ts]` re-pinned to `98afb4d5…`, with the two comment lines from the row, verbatim.
- `question-bank/src/farm-animal-loose-ends-verify.test.ts`: **row 3**, T-111's brief and run log at the top of `CRITERION_21_ALLOWED`; `MAIN_UNTOUCHABLE_SHA` re-pinned to `689e2d12…`. `toBe(280)` unchanged.
- `question-bank/src/climate-cold-trade-accepted-verify.test.ts`:
  - **row 2**: `MAIN_SOURCE_TREES_SHA` re-pinned to `05dc94e8…`.
  - **row 4**: the same two files at the top of `CRITERION_22_ALLOWED`; `MAIN_UNTOUCHABLE_SHA` re-pinned to `d030f3e5…`. `MAIN_UNTOUCHABLE_COUNT` stays 283.
  - **row 5**: `APPLIED_REQUEST_FILE_SHAS`. Agriculture is now `0206241e…`, the plan's value exactly. Farm is now **`377286f43af06196b3ed8a73d4755c80f9807998aa1177cd94470b94bb450eb9`, recomputed rather than the plan's `95d04a10…`**. Row 3 did not give the allowed-set comment verbatim. It said to name "the approval as it reads in the header", and that approval did not exist when the pass-1 trial ran. Both values are the observed sha256 after rows 1 and 3. The plan provides for this: "Pass 2 must use that text verbatim, or recompute row 5 and say so."
  - **row 6**: `MAIN_TESTS_COUNT` 132 → 133 and `MAIN_TESTS_SHA` re-pinned to `26653484…`, with the row's comments.
- **Every other digest matched the plan.** Rows 1 to 4 and 6 went green on their planned values. The base had not moved: `origin/main` is still `2634fc8`, an ancestor of HEAD.

**Suite, as run** on the applied tree:
- **question-bank:** `bun test` gives **2805 pass, 0 fail** (75 files). `format:check`, `typecheck` and `lint` are clean.
- **backend:** `uv run pytest -q` gives 1221 passed, 9 skipped.
- **frontend:**
  - `lint` is clean.
  - `typecheck` and `bun test` (434 pass, 4 fail) fail locally on the missing `react-simple-maps` / `us-atlas`. This is the same environmental proxy-403 install gap the tester recorded. No frontend file is touched, and CI's frontend job was green on `ff58bb2`.

**Independence:** orchestrated run (`runs/T-111-…` exists), so the session-id check proves nothing. My id, `cse_011oDiJfSMW5AuCAW3Bk9Ste`, is listed for every earlier role. My only independence is being a freshly spawned subagent. I did not see the worker's, testers' or pass-1 ci-fix's reasoning, beyond what they committed.

**Noticed, not changed:**
- **Row 5 was approved with `95d04a10…` written in it, and I applied `377286f4…`.** This was the recompute the plan allowed, but the reviewer may want to confirm a person is content with that.
- **The P-17 pattern recurs** (every task's brief and run log join two allowed sets by hand). That is already tracked in `process-tasks.md`.

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
