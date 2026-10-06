# T-080 — the offline harness returns the build's stdout — run log

_Opened as T-070; split on Dkaattae's answer and continued as T-080 (rounds 1–2 below are the same run)._

**Task:** T-080 (was T-070) · **Branch:** `claude/serene-heisenberg-cd5unq` · **PR:** #73
**Started:** 2026-10-06 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-06
`Next step` on entry: no brief (`tasks/` empty) → on exit: `human` (`Status: blocked`, `Approved: pending`)

**TL;DR:** I stopped T-070 as blocked. It needs a decision from a person before anyone can write criteria for it. The brief is committed and pushed, and draft PR #73 is open. The brief says `Status: blocked` and `Next step: human`. No code was written and no acceptance criteria were approved.

**What I picked, and why T-070**
- Section A of `tasks.md` is empty.
- T-064 depends on T-040, which has not been built.
- T-070 has no dependencies, so it is the next task by queue order.

**Why it is blocked**
- **Q1 needs a person's decision:** for part (a), either re-pin the digest guards against `main` and delete every per-task neutralisation, or keep the historical pins and gather the neutralisations into one shared helper.
  - The queue entry itself calls this "a deliberate call rather than a tidy-up".
  - The two options lead to criteria that have almost nothing in common.
  - The person should also say whether the guard has to survive a refresh where only `built_at` and the fixture moved.
- **Q2, a proposed split.** The entry is three tasks:
  - **T-070:** part (a), the digest guards, size M.
  - **T-080:** part (b), the offline harness returning stdout, size S. It does not depend on Q1, needs no test change request, and could be expanded first.
  - **T-081:** the leftover `climate-kid.test.ts:598` check that passes when `git` fails, plus widening `git-baseline-guard` to cover `question-bank/src/`, size S.
- **N1:** most of part (a), and all of T-081, change tests that already exist. A worker is not allowed to do that (D-14). Every such change has to go through a test change request that a person approves in a tester session they attend (D-15). An orchestrated run will halt at that point regardless.
- **Survey finding:** the queue entry counts three digest guards. There are actually four (`landmarks-verify`, `climate-kid-verify`, `top-crops-verify`, `highest-point-verify`), or five if `highest-point-in-state-verify` counts.

Draft criteria for T-080 (five) and T-081 (two) are in the brief and the PR body, clearly marked as not approved.

**State**
- **Files:** `/home/user/geo-discovery-zone/tasks/T-070-digest-guards-and-build-stdout.md` (the only file changed against `origin/main`). I did not touch `tasks.md` or `PROGRESS.md`; T-079's reviewer had already swept, and `tasks/` was empty when I started.
- **Branch:** `claude/serene-heisenberg-cd5unq`, which the brief's `Branch:` header also names.
- **Push confirmed:** `git log origin/claude/serene-heisenberg-cd5unq -1` shows `6a42bec T-070 expander: record PR #73 in the brief header`, on top of `3cedfe8 T-070 expander: digest-guards-and-build-stdout (blocked: ...)`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/73 (draft, base `main`).
- **Header:** `Approved: pending`, `Test changes: none`, `Fault:` filled in. My Sessions row is `task-expander | 2026-10-06 | cse_01UvBvo6qodvNQDpFJPANTgN`.
- **Not run:** the build and the test suite, per D-7.
- **File changed after my last edit:** a notice said the brief changed on disk after my last edit, which I made with `sed`. I did not re-read it. What I committed and pushed is commit `6a42bec`.

**Next step:** a person answers Q1 and Q2, on the PR or in the brief, and then `task-expander` runs again.

## Halted (round 1) — 2026-10-06

Gates: G1 passed (the only file changed against `origin/main` is the brief). G5 passed (a brief now exists with `Status: blocked`). The working tree was clean on return, and `origin/claude/serene-heisenberg-cd5unq` is at `6a42bec`. The halt is `Next step: human` with `Status: blocked`, which the expander wrote. `Approved:` stays `pending`. It was not stamped, and nothing was built.

What a human has to decide is the expander's list, quoted above: **Q1** (re-pin against `main`, or keep the historical pins behind one shared helper; and whether the guard must survive a `built_at`/fixture-only refresh) and **Q2** (whether to split into T-070 / T-080 / T-081). Answer them in the brief or on PR #73, set `Next step: task-expander`, commit, and start a new run.

Orchestrator note: the header fields were read with a field filter over the first 20 lines (`Status`, `Next step`, `Approved`, `Test changes`, `Branch`, `PR`), so the `Fault:` line was not loaded.

## Human answer — 2026-10-06

Dkaattae, in the orchestrator session: "accept the split and start with T-080". The orchestrator wrote it into the brief as `### Answers` (`10042d5`): Q2 split accepted, start with T-080; Q1 left open for T-070. `Next step` was set to `task-expander`.

## Round 2 — task-expander — 2026-10-06
`Next step` on entry: `task-expander` → on exit: `worker` (`Status: awaiting approval`, `Approved: pending`)

**TL;DR:** I applied the split you accepted and wrote the T-080 brief. **The brief moved:** it is now `/home/user/geo-discovery-zone/tasks/T-080-build-report-stdout.md`, and the T-070 file is gone (git mv). It is on the same branch, `claude/serene-heisenberg-cd5unq`, and the push landed (remote head is `2511e58`). PR #73 is renamed "T-080: the offline harness returns the build's stdout" and its body is now the criteria. It is still a draft. **Next: a human approves** (replaces `Approved: pending`), then the worker runs.

**Brief header**
- Status: `awaiting approval`
- Next step: `worker`
- Approved: `pending`
- Test changes: `none`
- Branch: `claude/serene-heisenberg-cd5unq`
- PR: #73
- Sessions: my row for this round is added.

**Criteria (16)**
- **New capability (1–6):** one harness call returns both the written files and the real build's full stdout. On the committed fixtures, stdout has a `Wrote 50 entities via json → ` line, exactly one `3 warning(s):` line, and then exactly the CT, OK and VA `highest_point_m` warning lines.
  - It must be the real spawned build's output: changing `report()`'s text in `build.ts` must turn the test red.
  - The returned files must match the tracked bank byte for byte.
- **The harness keeps working (7–10):** all six `DEAD_PROXY` variables are still set, a non-zero exit still throws, and the temp directory is removed whether the call succeeds or throws, on both routes.
- **Nothing else moves (11–16):** `rebuildOffline` keeps its signature, and no `*.test.ts` that already exists is modified or deleted. Only `offline-rebuild.ts` contains `127.0.0.1:1`, and no new test spawns anything. No data or fixture changes, no new dependency, no network.

**What the survey found**
- **`--quiet` hides the report.** `rebuildOffline` passes `--quiet`, and `build.ts:135` turns that into a log that prints nothing at all, even though the help text says "Only print the final summary". So today the spawned build prints nothing. `build.ts` is out of scope; how the harness gets the output is left to the worker.
- **The T-070 draft's criterion 5 was false.** `refresh.test.ts:194` and `refresh-verify.test.ts:379` spawn `build.ts` directly. The three spawn guards miss them because the script is named through a constant. I wrote this up as a new queue entry, **T-082**, rather than demanding it here, since fixing it means editing existing tests.
- **Existing guards the new code must pass unedited** are listed under Constraints in the brief: the loopback-literal count, the spawn regexes, the `exitCode !== 0` and `throw new Error` source check, and the `rebuildOffline(` call shape.

**Changes to `tasks.md`**
- **T-070** now holds only (a), resized to M, and is marked as waiting on Q1. It notes that it has no PR now.
- **T-080** (doing), **T-081** (the `git` leftover) and **T-082** are new.

`PROGRESS.md` is unchanged. The commit touches only `tasks/` and `tasks.md`. I did not run the build or the suite (D-7).

**For the orchestrator:** the brief's path changed from `tasks/T-070-digest-guards-and-build-stdout.md` to `tasks/T-080-build-report-stdout.md`. The `runs/T-070-...` log is yours to rename or continue.

Gates after return: tree clean, `origin/claude/serene-heisenberg-cd5unq` at `2511e58`. G1 passed (diff is `runs/`, `tasks.md`, `tasks/` only). G5 passed (`blocked`/`task-expander` → `awaiting approval`/`worker`).

## Approval — 2026-10-06

Dkaattae, in the orchestrator session, answering the approval question: "approved. you write my name on it". The orchestrator wrote `Approved: Dkaattae — 2026-10-06` into the brief header on that instruction. The orchestrator did not read the criteria.

## Round 3 — worker — 2026-10-06
`Next step` on entry: `worker` → on exit: `tester` (`Status: awaiting verification`)

T-080 is built and pushed to `claude/serene-heisenberg-cd5unq`: `git log origin/claude/serene-heisenberg-cd5unq -1` shows `71e446c T-080 worker: rebuildOfflineWithStdout returns the build's stdout`. The whole question-bank suite passes (1657 of 1657), and typecheck, lint and format:check pass. No tests were made stale. Status is now `awaiting verification`, Next step `tester`.

**Before you launch the tester:** this worker session has the same id as the expander's, `cse_01UvBvo6qodvNQDpFJPANTgN`. If the tester runs under that id too, its same-session check will find a `worker` row with its own id and should refuse. It needs a different session.

**Changes**
- **`question-bank/src/offline-rebuild.ts`:**
  - New exported function `rebuildOfflineWithStdout(buildScript, fileNames, tmpPrefix?)`. It runs the same offline build without `--quiet` and returns the written files plus the build's full stdout.
  - Both it and `rebuildOffline` now go through one private function. That function holds the shared parts: the dead-proxy settings, the throw on a non-zero exit, and the temp-folder cleanup. The only difference between the two is whether `--quiet` is passed.
  - `rebuildOffline`'s signature and return type are unchanged, and so is `DEAD_PROXY`.
- **`question-bank/src/build-report-stdout.test.ts`:** new, my own 8 tests. They cover criteria 2–4, 6 and 8–11. The file spawns nothing itself and does not contain `127.0.0.1:1`.
- **Not touched:** `build.ts`, any existing test, `data/`, `sample-data/`, the fixtures, `package.json`, `bun.lock`.

**Criterion 5 checked by breaking it on purpose:** I changed `warning(s):` to `warnings:` in `build.ts`. The two tests for criteria 3 and 4 failed, and I reverted the change.

**Gaps and things to know**
- **Criterion 7 is only visible in the source.** The new function does not return the environment the build ran with, so a runtime check of the six proxy variables isn't possible through it. I named this in the Handoff for the tester to decide.
- **This checkout had no `node_modules`.** Before I ran `bun install --frozen-lockfile`, the suite showed 12 failures and the lint and typecheck tools were missing. The install adds no dependencies.
- **One existing test file was briefly reformatted.** Before that install I ran `bun run format` by mistake, and it reformatted the existing `highest-point-metres-verify.test.ts`. I reverted it with `git checkout` straight away, so it is not in the commit. format:check passes on the untouched file.

**Judgment call for the tester or reviewer:** I added a second function rather than an option on `rebuildOffline`, because criterion 11 fixes that signature. The tester or reviewer can confirm or overturn this.

The full Handoff, with where each criterion lives and how to run things, is in `/home/user/geo-discovery-zone/tasks/T-080-build-report-stdout.md`.

Gates after return: tree clean, `origin/claude/serene-heisenberg-cd5unq` at `71e446c`. G1 passed. G5 passed (`awaiting approval`/`worker` → `awaiting verification`/`tester`). Orchestrator note: the worker's request about the tester's session is recorded here and was not relayed. The spawn prompt is the fixed template. Under a relayed run every role shares one session id, and `process.md` step 4 covers how the tester handles that.
