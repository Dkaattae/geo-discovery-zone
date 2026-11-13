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
