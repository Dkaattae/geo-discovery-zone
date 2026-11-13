# T-109 — `bun run format` without an install still runs whatever prettier is on `PATH` — run log

**Task:** T-109 · **Branch:** `task/T-109-format-script-guard` · **PR:** #137
**Started:** 2026-11-13 · **Outcome:** in progress

Task 2 of an orchestrated run of 2, started by Dkaattae ("start the next two tasks as an orchestrator").

## Round 1 — task-expander — 2026-11-13 15:30Z
`Next step` on entry: `(no brief)` → on exit: `worker`

**I expanded T-109 and opened draft PR #137. The brief is pushed and is waiting for a person to approve it.** Next step: a person sets `Approved:` in the brief, then the `worker` runs. Plan to attend the tester step, because whole-tree pins will probably go red (P-17).

- **Picked:** T-109, "`bun run format` without an install still runs whatever prettier is on `PATH`".
- **Branch:** `task/T-109-format-script-guard`, created from `origin/main` (`Branch: new`) and written into the brief's `Branch:` header.
- **Push confirmed:** local HEAD and `origin/task/T-109-format-script-guard` are both `ff31a12`.
- **PR:** draft #137, https://github.com/Dkaattae/geo-discovery-zone/pull/137. Its body carries the acceptance criteria.
- **Brief:** /home/user/geo-discovery-zone/tasks/T-109-format-script-guard.md
  - Status `awaiting approval`, Next step `worker`, Approved `pending`.
  - My expander row is in the Sessions table (session `cse_011oDiJfSMW5AuCAW3Bk9Ste`).
- **My commits:** the first adds the brief, and `ff31a12` records the PR number. The diff against `origin/main` touches only `tasks/T-109-format-script-guard.md`.

**Skipped, one line each:**
- **T-085b:** waits on a person's choice of a reachable Census release.
- **T-056:** waits on a design decision.
- **T-095:** waits on a person's call between options (a), (b) and (c).
- **T-110:** waits on a product wording call from Dkaattae.
- **T-111:** in flight, on open PR #136.
- **T-046:** a rename-or-keep decision that is not mine to make. Earlier runs skipped it the same way.

**What the brief asks for (18 criteria, full brief, not the light path):** every criterion holds for each package, `frontend/` and `question-bank/`.
- **Pinned prettier not installed:** this means one of three states: (a) `node_modules/prettier` is missing, (b) it is there at the wrong version, or (c) the version is right but `.bin/prettier` is missing.
  - `format` and `format:check` exit non-zero.
  - No prettier runs: a "sentinel" fake `prettier` is never executed, whether it is first on `PATH` or at `node_modules/.bin/prettier`.
  - When `format` refuses, no tracked file changes.
  - The output names the pinned version, and in state (b) the version it found as well.
  - The pinned version is read from `package.json` `devDependencies.prettier`, not hard-coded.
- **Pinned prettier installed:**
  - Both scripts behave as they do today: `format:check` exits 0 on a clean tree, and an unformatted probe fails the check, is named in the output, and is fixed by `format`.
  - Extra args still reach prettier, so the existing `--use-tabs --no-semi` test in `prettier-gate.test.ts` stays green without changes.
  - Each script covers the same files as on `main`.
- **What must not happen:**
  - No new dependency, and `ci.yml` stays byte-identical. Both are hand checks against `main`, not committed pins (P-17), and CI's two Format steps must pass on the head.
  - No test touches the real `node_modules`.
  - No network.
  - `conventions.md` Formatting says both scripts refuse without the pinned prettier and names `bun install` as the fix.
  - No existing test is deleted or weakened.

**Already true (the survey is recorded in the brief):**
- Both packages pin prettier `3.9.6` exactly.
- CI runs `bun install` before its Format steps.
- T-107 already guards the two frontend writer tests at the test level (`format-gate.criteria.test.ts:172-195`). Nothing guards the scripts themselves, and nothing guards `question-bank/` at all.

**Expect a halt later in the run:**
- **Constraints on the script shape:** some existing tests require the `format:check` script to contain `prettier` and `--check` (`prettier-gate.test.ts` `formatStep()`, and `format-gate` criterion 5). The brief names these so the worker can keep them green.
- **Likely red pins:** in `refresh-regenerate-reminder-verify.test.ts`, `MAIN_SCRIPTS`, `MAIN_MANIFESTS_EXCEPT_QB_PKG_SHA` and `MAIN_BOUNDARY_SHA`. Also `conventions-openapi-row-verify` criterion 2, and possibly the T-076/T-107 frontend digests. These go through a Test change request or the `ci-fix` plan (D-14, D-20).

**A choice I made:** state (c), right version but no `.bin/prettier`, counts as not installed. This mirrors T-107's guard, because `bun run` then falls back to `PATH`. The approver can reverse that.

**Not touched:** `tasks.md` and `PROGRESS.md`. `tasks/` was empty at start, so there was nothing to sweep.

Orchestrator: stamped `Approved:` (unattended run).

## Round 2 — worker — 2026-11-13 15:42Z
`Next step` on entry: `worker` → on exit: `tester`

**T-109 is built and pushed.** In both packages, `format` and `format:check` now refuse to run unless the pinned prettier is installed. Commit `0e04cf7` is on `origin/task/T-109-format-script-guard`, confirmed with `git log origin/task/T-109-format-script-guard -1`. The brief is set to Status `awaiting verification`, Next step `tester`.

**Suite results:** 17 question-bank tests go red by design and are listed in the Handoff under Tests made stale. The other reds were already failing before this change or come from this sandbox.

**How the guard works:**
- Each script now runs a guard file first, joined with `&&`, then the unchanged prettier command: `bun run <guard> && prettier --write|--check <same globs>`.
- The guard reads the pinned version from `devDependencies.prettier` in the package's `package.json` when it runs.
- It exits 1 in each of the brief's three states: prettier missing, wrong version, or the `.bin/prettier` file missing.
- The message always names the pinned version, names the version it found when that differs, and says to run `bun install`.

**Files changed:**
- `/home/user/geo-discovery-zone/question-bank/src/prettier-pin-guard.ts` (new)
- `/home/user/geo-discovery-zone/frontend/scripts/prettier-pin-guard.ts` (new, identical apart from one comment line)
- `/home/user/geo-discovery-zone/question-bank/package.json` and `/home/user/geo-discovery-zone/frontend/package.json`, `scripts` only
- `/home/user/geo-discovery-zone/conventions.md`, Formatting paragraph only (3 added lines)
- `/home/user/geo-discovery-zone/tasks/T-109-format-script-guard.md`: Handoff, Notes, Sessions row, Status

**Checked by hand in throwaway package copies:** all three states, plus a wrong version one patch below the pin, for both scripts in both packages. Every run exited 1, no stand-in prettier ran (whether first on `PATH` or in `.bin`), no file changed, and the output contained the version strings. I also confirmed the pinned version is read rather than hard-coded, in both directions (criterion 7). I did not commit a test of my own; criteria 1–7 and 15–16 are the tester's to pin.

**Suite results in full:**
- **Question-bank:** 2748 pass, 19 fail.
  - 17 are the stale whole-tree and manifest pins, each listed in the Handoff with a proposed re-pin.
  - The other 2 already failed before my change (T-096 criterion 21 and T-091 criterion 22; I checked with my change stashed).
- **Frontend:** 434 pass, 4 fail, 4 errors, all `Cannot find package 'react-simple-maps'`. `bun install --frozen-lockfile` gets a 403 from the proxy, so that package can't be installed here.
- **Typecheck:** green in question-bank. Frontend typecheck is red only on that same missing package.
- **Lint and `format:check`:** green in both packages.

**Decisions for the reviewer** (also in the Handoff):
- **Two copies of the guard, not one shared file.** A file outside the packages would break in throwaway copies of a package and would sit outside lint and format coverage.
- **The question-bank guard is under `src/`.** That gets it typechecked, linted and format-checked, at the cost of one extra red pin (T-091 criterion 20).
- **The frontend guard is not typechecked.** `frontend/tsconfig.json` doesn't include `scripts/`, so it is only linted and format-checked.
- **No `engineering-decisions.md` entry.**

**Next:** the tester, in a fresh session. It will need to route the 17 stale pins through the Test change request / `ci-fix` route (D-14, D-20).

## Round 3 — tester — 2026-11-13 15:57Z
`Next step` on entry: `tester` → on exit: `ci-fix` (Status `fail`; G3 count: 1 fail, 0 blocked)

**The verdict on T-109 is `fail`, but only because of stale pins. All 18 acceptance criteria are met.** 19 question-bank tests that existed before this task are red: 17 go red because of this task's own change, and the other 2 were already red at base `514cdc0`. I have routed them to the `ci-fix` (D-20). Next step: `ci-fix`.

Commit `6a62404` is pushed to `task/T-109-format-script-guard`, and `origin/task/T-109-format-script-guard` now points at it.

**How independent this check is:** this is an orchestrated run, so `runs/T-109-format-script-guard.md` exists. My session id is `cse_011oDiJfSMW5AuCAW3Bk9Ste`, which is the same id listed for the worker. The session-id check therefore proves nothing here. My independence rests only on being a freshly spawned subagent that never saw the worker's reasoning. That is weaker than a separate session, and the Verdict says so.

**New test file:** `/home/user/geo-discovery-zone/question-bank/src/format-script-guard.criteria.test.ts`
- It has 108 tests and they all pass. It covers both packages, and each scenario runs in a throwaway copy of the package under the OS temp directory.
- It uses `DEAD_PROXY` imported from `offline-rebuild.ts`. My first version wrote its own `127.0.0.1:1` literal, which turned T-014 criterion 16 red; the shared import fixed that.

**How the criteria were checked:**

| Criteria | How |
|---|---|
| 1–12, 15, 16 | Pinned by the new tests |
| 13 | By hand: `bun.lock` and dependencies are identical to `origin/main` |
| 14 | By hand: `ci.yml` is identical to `origin/main`. In CI run 43455384015 on `5b7c055`, the Format step passed in both the frontend and question-bank jobs |
| 17 | By hand: read the `conventions.md` diff |
| 18 | By hand: no existing test was edited or deleted |

**Mutations:** I made seven, and each turned the new tests red.
- In both guards:
  - dropping the version check
  - dropping the `.bin` check
  - hard-coding the pin
  - removing the found version from the message
  - making the guard exit 0
- In `question-bank/package.json`:
  - restoring `main`'s scripts
  - changing the glob

I reverted every one, and the tree was clean afterwards.

**Suites:**
- **question-bank:** 2856 pass, 19 fail. The 19 failures are exactly rows 1–19 of the brief's `## Test change request`. Typecheck, lint and `format:check` are green.
- **frontend:** 434 pass, 4 fail, 4 errors, all `react-simple-maps` missing from this sandbox. CI's frontend Test and Typecheck steps pass on `5b7c055`, so this is the sandbox, not the change. Lint and `format:check` are green.

**Brief updated** (`/home/user/geo-discovery-zone/tasks/T-109-format-script-guard.md`):
- The header now reads Status `fail`, Next step `ci-fix`, Test changes `routed to ci-fix (D-20)`, and has a Fault line.
- I added my row to Sessions and wrote the Verdict.
- The Test change request has 19 rows, every one a modify (re-pin, or an exemption for this brief's allowed files). Decision is left blank on each.

**For the `ci-fix`:** turn rows 1–19 into `pre-existing test` rows of its plan. Every re-pin must still cover everything it covered before.

## Round 4 — ci-fix (pass 1) — 2026-11-13 16:07Z
`Next step` on entry: `ci-fix` → on exit: `human` (Status `ci fix requested`, CI fix `requested`)

**T-109 ci-fix, pass 1: the plan is pushed and nothing is applied. It is waiting for approval.** No source is wrong, and all 18 criteria are met. The CI fix plan has 21 rows, all `pre-existing test` re-pins of whole-tree, manifest and test-file pins. When I applied them in a throwaway worktree, the question-bank suite went to 0 fail.

**Next:** a person approves the plan, or after about an hour the orchestrator stamps it (D-17). Then a fresh `ci-fix` runs pass 2. Every row changes a test, so if the stamp is what approves it, the reviewer has to escalate (D-18).

**Pushed**
- **Commit:** `32bebbf T-109 ci-fix: plan` on `task/T-109-format-script-guard`. After a fetch, `origin` shows the same SHA, and the working tree is clean.
- **Header:**
  - `Status: ci fix requested`, `Next step: human`, `CI fix: requested`.
  - `Fault` is rewritten for the plan. `Test changes` stays `routed to ci-fix (D-20)`.
  - Sessions row added: `ci-fix (pass 1, plan)`.
- **Changed:** only the brief, which now has a `## CI fix plan` section. No source or test file was touched.

**What I found**
- **Reproduced at `6c7b8ff`:** `bun test` in `question-bank/` gave 2855 pass and **20** fail, not the tester's 19.
  - The extra red is T-091 criterion 22, "pre-existing test files are main's…". It expects 132 test files and finds 133.
  - The cause is the tester's own new test file, committed in `6a62404`. The tester likely ran before committing it.
- **Two more rows are knock-ons.** They are green now but go red once other rows land:
  - row 9: T-025 criterion 17 digests `highest-point-in-state-verify.test.ts`, which row 17 edits.
  - row 21: T-091's `APPLIED_REQUEST_FILE_SHAS` pins four files that other rows edit.
- **Why request rows 18-19 were already red at base:** this task's brief is a new tracked file.

**Plan design choices** (alternatives are under "Not doing" in the plan)
- **Rows 18-19:** only the T-109 brief and run log join the allowed sets. `frontend/package.json` and the two guard files stay counted and digested, so those pins now cover more files, not fewer. The counts go 280→282 and 283→285.
- **Row 15:** I re-pinned the digest rather than exempting the new guard file, matching the earlier re-pins of that constant.
- **Pass 2 order:**
  - rows 1-8 and 10-19 in any order, then 9, then 20, then 21.
  - The values marked "(recompute)" in rows 9, 20 and 21 depend on the bytes of edited test files, so pass 2 recomputes them after it writes the comments.
  - If `origin/main` moves first (T-111, PR #136, is open), merge it and recompute every value.

**Trial run**
- **Where:** a scratch worktree at `6c7b8ff`, now removed.
- **Result:** with all 21 rows applied, question-bank gave 2875 pass / 0 fail, and `format:check` was green.
- **One environment issue:** the first full run hit an unhandled error in `format-script-guard.criteria.test.ts`, because the worktree had no `frontend/node_modules`. I symlinked it, re-ran that file, and got 108 pass. That combined 2875 total is what I quote above.

**Independence:** this is an orchestrated run (`runs/T-109-format-script-guard.md` exists). My session id `cse_011oDiJfSMW5AuCAW3Bk9Ste` matches the expander's, the worker's and the tester's, so the id check proves nothing. I am only a freshly spawned subagent that saw none of their sessions. I did not refuse on the id.

**Not touched:** the frontend `react-simple-maps` test failures and frontend typecheck are environmental (the proxy returns 403 on install). CI's frontend Test and Typecheck steps pass, per the Verdict.

Brief: /home/user/geo-discovery-zone/tasks/T-109-format-script-guard.md

## CI fix approved by a person — 2026-11-13 16:08Z
Dkaattae, in the orchestrator's session, while pass 1 was still running: "approve the T-109 CI fix plan too". The orchestrator told them the plan was not yet written and offered to halt instead if they wanted to read it first; no retraction came. Applied once the header read `CI fix: requested`: `CI fix: approved — Dkaattae, 2026-11-13, given in the orchestrator's session`, `Status: ci fix approved`, `Next step: ci-fix`. No timeout stamp was used.
