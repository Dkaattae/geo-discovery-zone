# T-082 — Two refresh tests spawn `build.ts` past the guard that forbids it — run log

**Task:** T-082 · **Branch:** `claude/affectionate-wright-jaormy` · **PR:** #75
**Started:** 2026-10-08 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-08
`Next step` on entry: no brief (`tasks/` empty) → on exit: `worker, once a human has approved the criteria below` (`Status: awaiting approval`, `Approved: pending`)

**TL;DR:** I picked T-082 and wrote its brief, and pushed it to `claude/affectionate-wright-jaormy` (HEAD `f90ea27`, matches the remote). Draft PR #75 is open: https://github.com/Dkaattae/geo-discovery-zone/pull/75. Status is `awaiting approval`, Next step is `worker`, Approved is `pending`. A person has to approve the criteria before the worker starts. The tester step should be run with a person attending.

**Why T-082**
- **T-064 skipped:** it depends on T-040, which is not done.
- **T-070 skipped:** it is waiting on a human answer to Q1.
- **T-082 is next:** it has no dependencies.

**What the brief asks for**
- The queue entry's "Done when" offers two endings. I chose the first one and wrote the reason into the brief's Goal: the other ending would leave three guards claiming a rule that is false, and T-083 needs the same fixture argument.
- **Harness (criteria 1–4):** `rebuildOffline` and `rebuildOfflineWithStdout` accept a fixture path. Each criterion is observable. Calls without a fixture path behave exactly as before. Isolation and temp-directory cleanup are unchanged.
- **Refresh tests (criteria 5–7):** the two tests that spawn `build.ts` directly get their rebuild from the harness instead. They must still catch a changed byte, an extra file and a missing file. That matters because the harness reads only the files it is told to, while today's tests compare a full directory listing.
- **Guard (criteria 8–14):** I defined what counts as a spawn of `build.ts`, including a constant whose value contains `build.ts`. The guard must reject four pasted-in examples (constant, split-path constant, `Bun.spawn`, literal path). It must not flag constants that are only passed to the harness, and it must not pass when it finds no files to scan. The existing guards stay.
- **Must not change (criteria 15–20):** the worker edits no existing tests. The only non-test file that may change in `question-bank/` is `offline-rebuild.ts`, so `build.ts` and `refresh.ts` stay as they are. No new dependency, no network access, and every check passes in `question-bank/`.

**What a person needs to do**
- **Approve:** replace `Approved: pending` in the brief with a name and date.
- **Attend the tester step:** criteria 6–7 change `refresh.test.ts` and `refresh-verify.test.ts`, which already exist. Under D-14/D-15 that needs a test change request approved by a person, so an unattended tester will halt at `test changes requested` / `human`.
- **Expect red tests in between:** the worker's new guard will fail on its own branch until the tester applies the approved changes. The brief says this.

**What was already true**
- `build.ts --fixture` exists.
- Both direct spawns already block network access, so nothing reaches the network today.
- `rebuildOfflineWithStdout` exists (added by T-080).

**What changed:** only two files. The new brief, and the T-082 entry in `tasks.md`, which is now marked `doing`. I did not run any builds or tests.

**Files**
- /home/user/geo-discovery-zone/tasks/T-082-build-spawn-guard.md
- /home/user/geo-discovery-zone/tasks.md

## Approval — 2026-10-08
The user was asked in the orchestrator session whether to record their approval, stamp an unattended one, or stop. They chose "I approve, continue". The header now records that human approval. The orchestrator did not read the criteria.

## Round 2 — worker — 2026-10-08
`Next step` on entry: `worker` (`Status: awaiting approval`) → on exit: `tester` (`Status: awaiting verification`). Pushed as `2f09b38`.

**TL;DR.** T-082 is built and pushed. It is at `awaiting verification`, and the tester goes next. The new spawn guard fails on purpose until the tester gets a person's approval to change the two refresh tests, so **a person has to be present at the tester step**. An unattended tester will stop at `test changes requested` / `human`.

**Push:** commit `2f09b38` ("T-082 worker: …") is on `origin/claude/affectionate-wright-jaormy`, which is the branch the brief names. I checked with `git log origin/claude/affectionate-wright-jaormy -1`.

**Suite results in `question-bank/`:**
- **`bun test`:** 1724 pass, 1 fail. The failure is the guard's "no tracked test spawns build.ts". It names `refresh-verify.test.ts:379` and `refresh.test.ts:194`, as the brief predicted.
- **Typecheck, lint and format:check:** all pass.
- **Environment:** `node_modules` was missing at first. I ran `bun install --frozen-lockfile`, and the lockfile did not change.

**What changed:**
- **`question-bank/src/offline-rebuild.ts`:**
  - Both entry points take an optional fourth parameter, `{ fixture?: string }`. When it is set, the harness passes `--fixture <resolved path>` to the build.
  - The report returned by `rebuildOfflineWithStdout` has a new `listing: string[]` field: every file the build wrote, sorted.
  - Nothing else in the file changed. Existing callers work unchanged.
- **`question-bank/src/spawn-guard.test.ts` (new): the guard.**
  - It checks the argv array of every `Bun.spawn` / `Bun.spawnSync` call in the tracked `*.test.ts` files under `question-bank/src/`.
  - It flags an argv that contains `build.ts` as text, or that uses a `const`/`let` name whose value contains `build.ts`.
  - It includes probe tests for each mutation shape in criteria 8–11 and each allowed case in criterion 12.
  - Its own source is assembled from parts, so neither it nor the three older guards flag it.
- **`question-bank/src/offline-rebuild-fixture.test.ts` (new):** my own checks for criteria 1, 2 and 4, plus `listing`.
- **The brief (`tasks/T-082-build-spawn-guard.md`):** Status, Next step, my Sessions row, the Handoff (with a criterion-by-criterion table) and Notes.

**Tests made stale** (exact replacement code is in the Handoff):
- **`refresh.test.ts`** › "an offline build from the written fixture reproduces the bank byte for byte".
- **`refresh-verify.test.ts`** › "criterion 8: build.ts --offline from the written fixture reproduces the bank byte for byte".
- **Proposed change for both:** modify them to call `rebuildOfflineWithStdout(…, { fixture })` and swap the `DEAD_PROXY` import for the harness import.
  - A file only in the rebuild is caught by comparing `listing` with the bank.
  - A file only in the bank is caught because the harness throws when it tries to read that name back.
- **Tried on throwaway copies (since deleted):** both replacements pass, and both still fail for each of cases (a), (b) and (c) in criterion 6.

**Decisions for the reviewer to confirm or overturn:**
- Adding `listing` to the report, rather than adding a third entry point.
- Passing the fixture inside an options object rather than as a bare string argument.
- Having the replacements use `rebuildOfflineWithStdout`, because only its report carries `listing`.

**Process flag:** `$CLAUDE_CODE_REMOTE_SESSION_ID` gives the expander and the worker the same id, because the orchestrator spawns both inside one session. The tester's "not the same session" check therefore can't be made from the Sessions table in an orchestrated run. Whoever owns `process-tasks.md` should decide whether to fix that.

Files:
- /home/user/geo-discovery-zone/tasks/T-082-build-spawn-guard.md
- /home/user/geo-discovery-zone/question-bank/src/offline-rebuild.ts
- /home/user/geo-discovery-zone/question-bank/src/spawn-guard.test.ts
- /home/user/geo-discovery-zone/question-bank/src/offline-rebuild-fixture.test.ts
