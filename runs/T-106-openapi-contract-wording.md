# T-106 — `README.md` and `PROGRESS.md` still call `openapi.yaml` "the contract" — run log

**Task:** T-106 · **Branch:** `claude/youthful-galileo-hn6hh1` · **PR:** #133
**Started:** 2026-11-12 · **Outcome:** in progress

Run: orchestrated, task 1 of 3. Started from the `next-task` skill.

## Round 1 — task-expander — 2026-11-12T15:28Z
`Next step` on entry: `none (no brief)` → on exit: `worker`

**TL;DR:** I expanded T-106 ("`README.md` and `PROGRESS.md` still call `openapi.yaml` 'the contract'"). The brief is pushed to `claude/youthful-galileo-hn6hh1` and draft PR #133 is open. Status is `awaiting approval`, Next step is `worker`, Approved is `pending`, so a human has to approve before the worker starts.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-106-openapi-contract-wording.md
- **Branch:** `claude/youthful-galileo-hn6hh1`. It is written into the brief's `Branch:` header, and the push landed: local and origin are level at `9eac5da`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/133 (draft). Its body holds the acceptance criteria.
- **Commits:** `eb19df9` (the brief) and `9eac5da` (records PR #133 in the brief). The diff against `origin/main` touches only `tasks/T-106-openapi-contract-wording.md`.
- **Sessions row:** task-expander, 2026-11-12, cse_011oDiJdbpiNRtapJtyKBeQB

**Why T-106 and not an earlier task:**
- **T-085b:** it needs a person to pick a Census source, and none has been recorded.
- **T-056:** it depends on a design decision that nobody has made.
- **T-095:** its "Needs a person's call" question is still unanswered.
- **Open PRs:** the only other one is #38 (a `P-4` ticket), so nothing collides.

**What the brief asks for (8 criteria, full brief because there are more than four):**
- **Four lines change:**
  - `README.md:32` (Tech stack row): also drops "Both sides are tested against it", because the frontend is not tested against `openapi.yaml`.
  - `README.md:215` (Layout).
  - `PROGRESS.md:26` (Layout).
  - `conventions.md:10` (the `backend/` row's "once built"; the queue entry says :9, which has drifted by one line).
- **Wording:** each `openapi.yaml` line must say `follows the backend` and cite `E-14`. `README.md` must contain no "contract" anywhere.
- **Alignment:** each changed line keeps its description column.
- **Nothing else moves:** no other line in those files and no other file changes. This is checked by `git diff` recorded in the Verdict, not by a committed pin (P-17).
- **Whole suite green:** pre-existing tests change only by approval.

**Already done, so not in the criteria:** T-105 already fixed the `openapi.yaml` row in `conventions.md`, and `PROGRESS.md:26` already cites E-14.

**Expected to go red:**
- **T-105 tests:** two in `question-bank/src/conventions-openapi-row-verify.test.ts` (the "every other line byte-identical" digest and "backend/ row keeps 'once built…'").
- **Whole-tree pins:** the usual ones, set off by the new brief and run-log files.

**Found while surveying, left out of scope:** `README.md:37` still says "15 states, 26 questions". The app serves 50 states and 415 questions. It is not in the queue yet; the brief asks the reviewer to queue it.

## Approval — orchestrator — 2026-11-12T15:29Z
Stamped `Approved:` as an unattended run. The criteria were not read.

## Round 2 — worker — 2026-11-12T15:46Z
`Next step` on entry: `worker` → on exit: `tester`

TL;DR: I reworded the four lines in three files and changed nothing else. The commit is `406241f` on `claude/youthful-galileo-hn6hh1`, and `git log origin/claude/youthful-galileo-hn6hh1 -1` shows it. The brief is now Status `awaiting verification`, Next step `tester`. Backend and question-bank are green apart from the reds expected by design. The frontend could not be fully checked here: the proxy refused part of `bun install`.

**What changed** (against base `5f6f811`; line counts are unchanged at 236, 2042 and 133)
- **`README.md:32`** (Tech stack row): now says "Describes the API. It follows the backend, which is the source of truth (E-14)".
- **`README.md:215`** (Layout block): now "describes the API; follows the backend (E-14)". Description starts at column 21. `README.md` no longer contains "contract" anywhere.
- **`PROGRESS.md:26`** (Layout block): now "describes the API served by backend/; follows the backend (E-14)". Column 17.
- **`conventions.md:10`**: "once built" is removed. The line still has `/api/v1` and "the frontend on the same origin", at column 18.
- **`/home/user/geo-discovery-zone/tasks/T-106-openapi-contract-wording.md`**: Status, Sessions row, Handoff and Notes filled in.
- **The commit touches only those four files**, per `git show --stat`.

**Suite on the final tree**
- **`make -C backend check`:** 1221 passed, 9 skipped.
- **question-bank:** `bun test` gives 2719 pass, 4 fail. Typecheck, lint and format:check pass.
- **The 4 question-bank fails, all listed under Tests made stale in the Handoff:**
  - Two T-105 tests in `conventions-openapi-row-verify.test.ts`, red by design under criterion 5. I proposed modifying them, but did not touch them.
  - Two whole-tree pins, T-096 criterion 21 and T-091 criterion 22. These were already red at `c5fc48f`, before my commit, because the new brief and run log are tracked files.
- **frontend, not fully runnable:** `bun install --frozen-lockfile` could not fetch 23 lockfile packages (d3-*, `react-simple-maps`, `us-atlas`) because the proxy returns 403 for `europe-west1-npm.pkg.dev`. I did not try to route around it.
  - As a result, typecheck fails with TS2307 on the missing packages.
  - `bun test` gives 419 pass, 5 fail: "Cannot find package 'react-simple-maps'" errors, plus `lint-gate.test.ts` timing out at 5 s on a cold run. That file passes 8/8 with `--timeout 30000`.
  - Lint and format:check pass.
  - The README and PROGRESS scanner tests pass 215/215.
  - The tester should re-run the frontend checks where that registry is reachable, or rely on CI for PR #133.

**Flags, each with an owner**
- **Session id:** my id is the same as the expander's (`cse_011oDiJdbpiNRtapJtyKBeQB`), because the orchestrator runs every role under one remote session. The tester should note this. If the loop needs a per-agent id, that is a `process-tasks.md` item for the human.
- **New wording:** modelled on T-105's `conventions.md:16` row. The reviewer can confirm or reword it, as long as criteria 1–4 still hold.

No contradictions with the brief, no criteria problems, and no new dependencies.

## Round 3 — tester — 2026-11-12T15:55Z
`Next step` on entry: `tester` → on exit: `ci-fix` · G3 count: fail 1, blocked 0

**T-106 tester verdict: `fail`, on criterion 8 only.** All four doc lines are correct, and criteria 1-7 hold. Four tests that existed before this task are red because of the task's own change. I wrote them up as Test change request rows 1-4 and routed them to the `ci-fix` (D-20). No source or doc is wrong, and I edited no existing test.

**Next step: `ci-fix`**. Its plan needs approving: by a person, or by your one-hour stamp if nobody answers.

Pushed to `claude/youthful-galileo-hn6hh1` as `7135ac2`. The local HEAD and the remote branch match.

**Independence.** This run is orchestrated, so the session check proves nothing. `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJdbpiNRtapJtyKBeQB`, the same id the expander and worker recorded. My independence rests only on being a freshly spawned subagent with its own context, which is weaker evidence than a separate session. The Verdict says so, and my Sessions row is added.

**Criteria**

| # | Verdict | Evidence |
|---|---|---|
| 1-5 | met | 18 new tests in `question-bank/src/openapi-contract-wording-verify.test.ts`, all green |
| 6 | met | `git diff 5f6f811` shows exactly 4 one-line hunks (README.md:32 and :215, PROGRESS.md:26, conventions.md:10). Line counts are unchanged: 236, 2042, 133 |
| 7 | met | The worker's only commit is `406241f`, touching the 3 docs and the brief. The protected files are byte-identical to base |
| 8 | not met | question-bank `bun test`: 2737 pass, 4 fail. The 4 are exactly the stale tests below |

**Do the new tests catch anything?** Yes:
- Putting the base text back turned 10 of the 18 red.
- Moving each changed line one column turned the 3 column tests red.
- Both mutations were reverted.

**The four stale tests (rows 1-4, Decision left blank)**
1. **T-105 digest of `conventions.md`.** Modify: drop the `backend/` line from the digest too, re-record it at `5f6f811`, and add an exact-string check that the `openapi.yaml` row still has T-105's wording.
2. **T-105 "backend/ row keeps 'once built…'".** Modify: assert the row says `serving /api/v1 and the frontend on the same origin` and does not contain `once built`.
3. **`farm-animal-loose-ends-verify` criterion 21 (whole tree).** Modify: add root `README.md` and T-106's brief and run log to the allowed set. The count goes 281 → 280 and the digest is recomputed.
4. **`climate-cold-trade-accepted-verify` criterion 22 (whole tree).** Same change. The count goes 284 → 283 and the digest is recomputed.

**Rest of the suite**
- **Backend:** `make -C backend check` gives 1221 passed, 9 skipped.
- **question-bank:** typecheck, lint and format:check pass. My new file first failed format:check, which also turned the T-071 format-gate tests red; prettier on my own file fixed both.
- **Frontend, locally: not fully run.** The proxy returns 403 on some package downloads, so `react-simple-maps` never installs. That leaves 4 test errors and 9 TS errors, all from the missing package. Lint and format pass, and the README/PROGRESS scanner tests pass 229/229.
- **Frontend, on CI:** green at `25519fc`. Backend, postgres, integration and e2e passed there too; only question-bank failed, which matches rows 1-4.

**Files**
- /home/user/geo-discovery-zone/question-bank/src/openapi-contract-wording-verify.test.ts (new)
- /home/user/geo-discovery-zone/tasks/T-106-openapi-contract-wording.md: header, Sessions, Verdict and Test change request
  - Status: `fail`
  - Next step: `ci-fix`
  - Test changes: `routed to ci-fix (D-20)`
  - Fault: filled in

## Round 4 — ci-fix (pass 1, plan) — 2026-11-12T16:05Z
`Next step` on entry: `ci-fix` → on exit: `human`

**T-106 CI fix plan is pushed and waiting for approval. Pass 1 only: I changed no source and no test.** The plan has 6 rows, all pre-existing tests and none in source. Five tests are red on the committed tree, not the four the tester reported.

**Header:** `Status: ci fix requested`, `Next step: human`, `CI fix: requested`, `Fault:` updated. Pushed as `3f5d25a` to `claude/youthful-galileo-hn6hh1`; local HEAD and origin match.

**Reproduced on `6cb54e0`**
- **question-bank:** `bun test` gave 2736 pass, 5 fail.
- **backend:** `make -C backend check` gave 1221 passed, 9 skipped.
- **The fifth red test:** `climate-cold-trade-accepted-verify` › "pre-existing test files are main's, except ones in an approved Test change request" (130 ≠ 129). The tester ran its suite before committing its own test file, so `git ls-files` did not see that file yet.

**Plan rows** (all in `/home/user/geo-discovery-zone/tasks/T-106-openapi-contract-wording.md`, `## CI fix plan`)

| # | Test | Change |
|---|---|---|
| 1 | T-105 "every other line is byte-identical" (request row 1) | Leave both the `openapi.yaml` and `backend/` rows out of the digest, re-pinned at `5f6f811`. Also pin the `openapi.yaml` row to T-105's exact wording, which criterion 8 asks for |
| 2 | T-105 "backend/ row keeps 'once built'" (request row 2) | Assert `serving /api/v1 and the frontend on the same origin` is present and `/once built/i` is absent (criterion 5) |
| 3 | T-096 criterion 21, whole-tree pin (request row 3) | Add `README.md` and T-106's brief and run log to the allowed set; count 281 → 280; digest re-pinned |
| 4 | T-091 criterion 22, non-test pin (request row 4) | Same three paths; count 284 → 283; digest re-pinned |
| 5 | T-091 criterion 22, test-file pin (added by me) | Count 129 → 130; digest re-pinned after rows 1-2 |
| 6 | T-091 `APPLIED_REQUEST_FILE_SHAS` entry for the farm file (added by me) | Green now, but row 3 would turn it red. Re-pinned after row 3, as T-105 row 5 did |

**Trial run**
- **Result:** I applied all 6 rows in a throwaway git worktree, not on the branch, and got question-bank 2741 pass, 0 fail, with `typecheck`, `lint` and `format:check` clean. The worktree has been removed.
- **Rows 3-4 hide nothing:** the new count and digest pins give the same result on base `5f6f811`, so no other file moved.
- **Digests may shift:** the trial digest values are in the plan, but pass 2 must record the values it actually sees after applying the rows in order and running prettier.

**Independence:** the run is orchestrated, and the session id `cse_011oDiJdbpiNRtapJtyKBeQB` is shared with the expander, worker and tester. My only independence is being a freshly spawned subagent. I added my Sessions row.

**Next:** the orchestrator waits about an hour for a person, then (D-17) stamps `CI fix: approved — orchestrator, …` and spawns a fresh ci-fix for pass 2. Every row changes a test, so the reviewer must escalate if the stamp approves them (D-18). Frontend can't be checked locally because the registry returns 403; CI's frontend job passed at `25519fc`.

## Halted — CI fix requested — 2026-11-12T16:05Z
Header: `Status: ci fix requested`, `Next step: human`, `CI fix: requested`. Branch head at halt: `3f5d25a`.
The plan was not read by the orchestrator. A person may approve or refuse it in the orchestrator's session, on PR #133, or in the brief. If nobody answers by about 2026-11-12T17:05Z, the orchestrator stamps it (D-17) and spawns a fresh ci-fix.

## CI fix approved — by a person, in the orchestrator's session — 2026-11-12T16:22Z
The user's words, verbatim: "approve the T-106 CI fix plan"
Header set: `Status: ci fix approved`, `Next step: ci-fix`, `CI fix: approved — the user, 2026-11-12, given in the orchestrator's session`. A fresh ci-fix (pass 2) is spawned once the checkout is free (T-107's worker is running in it).

## Round 5 — ci-fix (pass 2, apply) — 2026-11-12T16:30Z
`Next step` on entry: `ci-fix` → on exit: `tester`

**I applied all six approved rows of the T-106 CI fix plan and refused none. question-bank now passes 2741 of 2741 tests.** Only three pre-existing test files changed; no source or doc file did. The fix is pushed as `90c7c2a` to `claude/youthful-galileo-hn6hh1`, and local HEAD matches origin. The brief now reads Status `awaiting verification`, Next step `tester`, so a fresh tester is next.

**Approval I acted on**
- The header read `CI fix: approved — the user, 2026-11-12, given in the orchestrator's session`.
- The run log quotes the person: "approve the T-106 CI fix plan". I recorded that in every row's Decision cell, noting that it reached me through the orchestrator (commit `2601932`) rather than being given in my session.
- The plan still held: since it was written (`3f5d25a`), only the run log and the brief header had changed.

**Rows applied**
- **Rows 1-2, `question-bank/src/conventions-openapi-row-verify.test.ts`:**
  - The digest now leaves out both the `openapi.yaml` and `backend/` lines. Its value, `f13eb52a…`, matches both at `5f6f811` and at HEAD.
  - The `openapi.yaml` row is now pinned word for word to T-105's wording.
  - The `backend/` test now checks the row still contains `serving /api/v1 and the frontend on the same origin` and no longer contains "once built".
- **Row 3, `question-bank/src/farm-animal-loose-ends-verify.test.ts`:** `README.md` and T-106's brief and run log are added to the allowed list. The count goes from 281 to 280, and the new digest `c274a19e…` matches the plan's trial value.
- **Row 4, `question-bank/src/climate-cold-trade-accepted-verify.test.ts`:** the same three files are added to its allowed list. The count goes from 284 to 283, and the digest `53524b09…` matches the trial value.
- **Row 5, same file:** the test-file count goes from 129 to 130 and the digest becomes `e232903b…`. **This differs from the trial value `f9eae92d…`.**
- **Row 6, same file:** the farm file's digest becomes `015526d2…`. **This also differs from the trial value `066f1da5…`.**
- **Why rows 5 and 6 differ:** these digests hash the edited test files byte for byte, and my code comments are worded differently from the pass-1 trial run. The plan said pass 2 would record whatever value it saw. Each one was read after the rows it depends on were applied and prettier had run.

**Checks run**
- **Backend:** `make -C backend check` gave 1221 passed, 9 skipped.
- **question-bank:** `bun test` gave 2741 pass, 0 fail, and typecheck, lint and format:check are all clean.
- **Frontend, locally:** could not be fully checked, for the same environment reason the worker and tester hit. `bun install` gets 403 from the proxy, so `bun test` gives 420 pass and 4 fail, and typecheck gives 9 errors. All of these are in the map files that need the missing `react-simple-maps` package; I touched no frontend file. Lint and format:check pass, and the README scanners pass 149 of 149. CI's frontend job on PR #133 remains the evidence there.

**Independence:** this is an orchestrated run, and every role shares the session id `cse_011oDiJdbpiNRtapJtyKBeQB`, so the session check proves nothing. My only independence is being a newly spawned subagent that read only the committed sections of the brief.

**For the reviewer:** all six rows change pre-existing tests, the approval came to me secondhand, and two of the digests that landed are not the trial values the person saw. The reviewer should confirm the approval covers the values as recorded. This is written in the brief's `## CI fix` section.

Files:
- /home/user/geo-discovery-zone/tasks/T-106-openapi-contract-wording.md
- /home/user/geo-discovery-zone/question-bank/src/conventions-openapi-row-verify.test.ts
- /home/user/geo-discovery-zone/question-bank/src/farm-animal-loose-ends-verify.test.ts
- /home/user/geo-discovery-zone/question-bank/src/climate-cold-trade-accepted-verify.test.ts
