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
