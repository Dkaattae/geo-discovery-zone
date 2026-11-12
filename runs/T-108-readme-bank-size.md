# T-108 — `README.md` still says "15 states, 26 questions", and cites E-14 by bare id — run log

**Task:** T-108 · **Branch:** `task/T-108-readme-bank-size` · **PR:** #135
**Started:** 2026-11-12 · **Outcome:** in progress

Run: orchestrated, task 3 of 3. In flight at start: T-106, T-107.

## Round 1 — task-expander — 2026-11-12T18:19Z
`Next step` on entry: `none (no brief)` → on exit: `worker`

I expanded T-108. The brief and a draft PR (#135) are pushed and the push is confirmed on the remote. It now needs `Approved:` stamped, then the `worker`.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-108-readme-bank-size.md
- **Branch:** `task/T-108-readme-bank-size`, created from `origin/main` at `8092372`. The brief's `Branch:` header names it.
- **PR:** #135 (draft, against `main`): https://github.com/Dkaattae/geo-discovery-zone/pull/135
- **Header:** `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. The Sessions table has the expander's row.
- **Commits:** `cc13a2b` (`T-108 expander: readme-bank-size`) and `57f7db9` (writes PR #135 into the header). `origin/task/T-108-readme-bank-size` is at `57f7db9`. The diff against `origin/main` touches only the brief.

**How the task was picked.**
- **§A and §B:** no open tasks.
- **T-085b:** skipped. It needs a person to choose a reachable Census source.
- **T-056:** skipped. It depends on a design decision.
- **T-095:** skipped. It needs a person's call (its Q).
- **T-108:** picked. It has no dependency and no open PR. Its only file, `README.md`, is not in T-107's diff.
- **In flight:** T-106 is merged (PR #133) and T-107 is in flight (PR #134), so I left both alone.

**What the brief asks for (14 criteria, full brief because it is over the light path's four).**
- **Remove the stale size:** "15 states, 26 questions" goes, and so does "human-written and reviewed explanations". No served question has an explanation; only the 50 fun facts are reviewed.
- **No question count in `README.md`:** the count changes every time templates are added and nothing checks it.
- **A state count is optional,** but if stated it must be 50.
- **The paragraph keeps saying** that only a US-states bank ships.
- **Both `openapi.yaml` lines (32 and 215) name `engineering-decisions.md` with `E-14`.** Each keeps "follows the backend" and no "contract". The Layout line keeps column 21.
- **Nothing else moves:** only those README lines change, checked by `git diff` rather than a new pin. The worker touches only `README.md` and the brief. No new dependency. The whole suite must be green.

**Out of scope, which the reviewer may want to queue.**
- **README pitch:** lines 5 and 13 promise explanations ("A miss earns the reason the right answer is right"). I treated them as design intent.
- **Stale source comments:** `question-bank/src/curated/us-states.ts:69` and `:80` still say "the 15 states shipping today".

**Expect the usual whole-tree pins to go red** (P-17), the same family as on T-104 to T-106: `farm-animal-loose-ends-verify` criterion 21 and `climate-cold-trade-accepted-verify` criterion 22.

I did not touch `tasks.md` or `PROGRESS.md`. `tasks/` had no leftover brief, and the T-107 expander had not edited those files either. I ran no build or tests.

## Approval — orchestrator — 2026-11-12T18:19Z
Stamped `Approved:` as an unattended run. The criteria were not read.

## Round 2 — worker — 2026-11-12T18:27Z
`Next step` on entry: `worker` → on exit: `tester`

**T-108 is built and handed to the tester.** I changed three lines in `README.md`, plus the brief. The backend suite and every README guard pass. The rest of the suite has two kinds of red, neither from my edit: two `question-bank` count pins that were already failing at the branch head, and four frontend test files plus the frontend typecheck, which fail because a package is missing from this environment. The commit is `8d1dc8f` on `task/T-108-readme-bank-size`, and `git log origin/task/T-108-readme-bank-size -1` shows it.

**Changes to `README.md`:**
- **Line 32, the Tech stack row:** now ends ``(`engineering-decisions.md` E-14) |``.
- **Lines 37-38, the bank paragraph:** now reads "Only a US-states bank ships today, covering all 50 states. A right answer / shows a human-reviewed fun fact; a wrong one names the right answer."
- **Line 215, the Layout line:** now reads `openapi.yaml        describes the API; follows the backend (engineering-decisions.md E-14)`. The description still starts at column 21.

In `tasks/T-108-readme-bank-size.md` I added my Sessions row and wrote the Handoff (a criterion → location table and the suite results) and Notes. Status is now `awaiting verification` and Next step is `tester`.

**Suite results:**

| Check | Result |
|---|---|
| `make -C backend check` | 1221 passed, 9 skipped |
| `question-bank` `bun test` | 2739 pass, 2 fail (the count pins below) |
| `question-bank` typecheck, lint, format:check | pass |
| `frontend` `bun test` | 420 pass, 4 fail |
| `frontend` typecheck | fails |
| `frontend` lint, format:check | pass |
| README guard tests (`conventions-doc`, `readme-test-count`, `readme-suite-counts`, `openapi-contract-wording-verify`, `purge-sample-data-verify`, `lint-gate`) | 192 pass, 0 fail |

**Why the reds are there:**
- **Frontend tests and typecheck:** every failure is `Cannot find package 'react-simple-maps'` or `us-atlas`. `bun install --frozen-lockfile` was refused by the proxy with a 403 on the d3 tarballs, so the tester needs to rerun the frontend checks somewhere the package registry is reachable.
- **Tests made stale** (both listed in the Handoff, both already red at `edbf4d2` before my edit — I stashed the change and reran to confirm):
  - `farm-animal-loose-ends-verify.test.ts`, the T-096 criterion 21 pin: counts 282 files against a pin of 280.
  - `climate-cold-trade-accepted-verify.test.ts`, the T-091 criterion 22 pin: counts 285 against 283.
  - The cause is the two new files (this brief and `runs/T-108-readme-bank-size.md`); the README edit also touches a file these pins check. I proposed the tester file a Test change request to allow those files, as T-104 to T-106 did.

**Judgment calls recorded in the Notes:**
- **"50 states" is stated rather than left out.** It is a fixed number, so it won't go stale the way the question count did. The reviewer should confirm or overturn this.
- **"a wrong one names the right answer"** is true today because no served question has an explanation. If a future task adds explanations, the line would understate what ships rather than overclaim, and that task should own updating it.

Files:
- /home/user/geo-discovery-zone/README.md
- /home/user/geo-discovery-zone/tasks/T-108-readme-bank-size.md

## Round 3 — tester — 2026-11-12T18:41Z
`Next step` on entry: `tester` → on exit: `ci-fix` · G3 count: fail 1, blocked 0

**T-108 tester verdict: `fail`, caused only by stale pins. Next step: `ci-fix`.** The README meets all 14 criteria. Three older whole-tree pins in `question-bank` are red because this task added new tracked files. I wrote them up as Test change request rows with Decision left blank, for the `ci-fix` to plan (D-20). Pushed as `80acd1f` to `task/T-108-readme-bank-size`; local HEAD and the remote branch match.

**Independence:** this is an orchestrated run, so the session-id check proves nothing. My id `cse_011oDiJdbpiNRtapJtyKBeQB` is the same as the worker's. My only independence is being a freshly spawned subagent that never saw the worker's session. That is weaker than a separate session, and the Verdict says so.

**What I did**
- **New test file:** `/home/user/geo-discovery-zone/question-bank/src/readme-bank-size-verify.test.ts`, 26 tests covering criteria 1-10 plus checks of the scanning helpers. Committed as `3568b51`. All 26 pass.
- **Mutations:** every one was reverted and the working tree is clean.
  - Restoring the base README turned 9 tests red, covering criteria 1, 2, 3, 4, 5, 8 and 9.
  - A wrong state count, a question count, a column shift and an extra paragraph turned criteria 2, 3, 7 and 9 red.
  - Removing "Only" and adding "contract" turned criteria 6, 8 and 10 red.
- **Criteria 11-13, checked by diff:** `git diff 8092372 -- README.md` shows only the three allowed hunks (line 32, lines 37-38, line 215). `git show --stat` shows each commit touched only its allowed files. The protected files and every package/lock file are unchanged from base.

**Suite on the final tree**
- **Backend:** `make -C backend check` passes, 1221 passed and 9 skipped.
- **question-bank:** `bun test` gives 2764 pass and 3 fail; all 3 are the stale pins. typecheck, lint and format:check pass.
- **frontend, locally:** lint and format:check pass. 4 tests fail and typecheck fails because `react-simple-maps` is not installed, and the proxy refuses `europe-west1-npm.pkg.dev` with a 403, so I could not install it. CI on `a620111`, read through REST check-runs, has the frontend job green; the only red CI job there is question-bank. I did not see CI results for my own push.

**Test change request rows** (written in `/home/user/geo-discovery-zone/tasks/T-108-readme-bank-size.md`)
1. `farm-animal-loose-ends-verify.test.ts` criterion 21 counts 282 files against a pin of 280. Fix: add T-108's brief and run log to its allowed list.
2. `climate-cold-trade-accepted-verify.test.ts`, the non-test-files pin, counts 285 against a pin of 283. Fix: add the same two files to its allowed list.
3. The same file's pre-existing-test-files pin counts 131 against 130, because of my new test file. Fix: raise `MAIN_TESTS_COUNT` to 131 and recompute `MAIN_TESTS_SHA`.

**Brief header now reads:** Status `fail`, Next step `ci-fix`, Test changes `routed to ci-fix (D-20)`. The Fault line, my Sessions row, the Verdict and the Test change request are all filled in.

## Round 4 — ci-fix (pass 1, plan) — 2026-11-12T18:43Z
`Next step` on entry: `ci-fix` → on exit: `human`

**T-108 ci-fix, pass 1: the plan is pushed and waiting for approval. Nothing was applied.** No criterion failed. Four older `question-bank` pins are stale because of this task's own new tracked files, and the plan has one row for each. The brief now reads `CI fix: requested`, Status `ci fix requested`, Next step `human`. Pushed as `43698ef` to `task/T-108-readme-bank-size`; my HEAD and the remote branch match, and the working tree is clean.

**Reproduced first:** at `4509165`, `bun test` on the two pin files gave 48 pass and 3 fail: 282 vs 280, 285 vs 283, and 131 vs 130. I applied rows 1-3 in a throwaway worktree to see the real values, then removed it. No source or test file on the branch was changed.

**Plan rows** (all `pre-existing test`, all modify, in `/home/user/geo-discovery-zone/tasks/T-108-readme-bank-size.md` under `## CI fix plan`):
1. **`question-bank/src/farm-animal-loose-ends-verify.test.ts`, criterion 21 (tester's row 1).** Add T-108's brief and run log to `CRITERION_21_ALLOWED`. In the trial, the count (280) and digest (`c274a19e…`) came back equal to main's, so neither pin changes.
2. **`question-bank/src/climate-cold-trade-accepted-verify.test.ts`, the non-test-files pin (tester's row 2).** Add the same two files to `CRITERION_22_ALLOWED`. The count (283) and digest (`53524b09…`) also came back unchanged.
3. **The same file's test-files pin (tester's row 3).** Raise `MAIN_TESTS_COUNT` from 130 to 131 and change `MAIN_TESTS_SHA` to `dceadbd5fcba43e9ac32e29d58639ca29327420c489eca08cc07fab4092c8160`. The only thing that moves it is the tester's new `readme-bank-size-verify.test.ts`; I confirmed rows 1 and 2 do not affect it.
4. **One the tester missed:** the farm file's digest in the same file's `APPLIED_REQUEST_FILE_SHAS`. Row 1 edits the farm file, which turns this check red. In the trial, "each test in the approved Test change request is 8108a42's" failed on exactly this one entry. The new digest has to be taken after row 1 is applied, so the row says to apply it after row 1. T-106 needed the same row (its row 6).

**Root cause:** the T-096 and T-091 whole-tree pins count every tracked file outside a hand-kept allowed list, and every task adds its own brief and run log. This is the same P-17 pattern T-104 to T-106 hit. The plan's "Not doing" list covers the alternatives I rejected: switching the pins to globs (a loop change), re-pinning to the new tree (weakens the pin), and the frontend failures seen locally (environmental, the CI job is green).

**Independence:** this is an orchestrated run, so the session-id check proves nothing; my id `cse_011oDiJdbpiNRtapJtyKBeQB` is also the worker's and the tester's. My only independence is being a freshly spawned subagent, as the brief records.

**Next:** a person approves the plan, or after about an hour you stamp `CI fix: approved — orchestrator, …`. Then a fresh `ci-fix` runs pass 2. In pass 2, set `Test changes:` to `applied through CI fix plan (D-20)`.

## Halted — CI fix requested — 2026-11-12T18:43Z
Header: `Status: ci fix requested`, `Next step: human`, `CI fix: requested`. Branch head at halt: `43698ef` (the orchestrator's own log commit follows it and does not count as a person answering).
The plan was not read by the orchestrator. A person may approve or refuse it in the orchestrator's session, on PR #135, or in the brief. If nobody answers by about 2026-11-12T19:45Z, the orchestrator stamps it (D-17) and spawns a fresh ci-fix.
