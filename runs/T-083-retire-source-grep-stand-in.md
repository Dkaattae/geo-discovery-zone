# T-083 — Retire T-016's source-grep stand-in now the build's stdout is readable — run log

**Task:** T-083 · **Branch:** `claude/awesome-hamilton-gft1hi` · **PR:** #76
**Started:** 2026-10-12 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-12
`Next step` on entry: no brief (`tasks/` empty) → on exit: `worker` (`Status: awaiting approval`, `Approved: pending`)

**The T-083 brief is written and in draft PR #76; nothing is implemented yet.** The brief says `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. Next it needs approval, which under the orchestrator is the orchestrator's `Approved:` stamp, and then the worker.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-083-retire-source-grep-stand-in.md
- **Branch:** `claude/awesome-hamilton-gft1hi`. It is in the brief's `Branch:` header. The push landed: `origin/claude/awesome-hamilton-gft1hi` is at `db330e9`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/76. It is a draft against `main`, and its body carries all 18 criteria.
- **Diff scope:** `tasks.md` (T-083 marked `doing`) and the new brief, nothing else. I ran no build and no tests.

**Why T-083:** section A of the queue is empty. T-064 depends on T-040, which hasn't landed. T-070 is waiting on a human answer to its Q1. T-083 was the first entry whose dependencies are done.

**What the 18 criteria cover:**
- **1–4: T-016 criterion 8 checked on real stdout.** Build from a copy of the fixture with Colorado's `capitalLabel` and `highestPoint` removed, using `rebuildOfflineWithStdout({ fixture })`. Its stdout must contain `  us-state-co.capital: missing` and `  us-state-co.highest_point: missing`. A build from the unmodified fixture must print neither. The new test must go red under a mutation to `report()`.
- **5–7: remove the source-grep stand-in.** The test at `highest-point-verify.test.ts:432` goes. So do the comments that say stdout can't be read (`:433-447`) and the stale "pinned count of 0" comments (`:28-35`, `:483-487`).
- **8–13: `--quiet` matches `--help`.** A quiet build still prints the summary and its warnings, but not progress lines. Non-quiet output is unchanged. The help text stays the same. The `offline-rebuild.ts:67` doc comment is corrected. `rebuildOffline`'s output stays byte-identical.
- **14–18: things that must not happen.** No test spawns `build.ts` itself, no fixture or bank file changes, no network, no new dependency, and the whole question-bank suite, typecheck, lint and format check stay green.

**Already true, recorded in the brief:**
- The harness already supports this (T-080, T-082).
- `report()` already prints every warning.
- The full-build stdout is already pinned by T-080's tests, so the brief marks that as out of scope.

**Two things a human should know:**
- **A design choice I made that the approver may want to reverse.** The queue entry allowed fixing `--quiet` either way. I chose to make it print the summary rather than change the help text to say it prints nothing, so a quiet build doesn't hide warnings. Reversing it means rewriting criteria 8–12 through the expander.
- **The tester step will halt for a person.** Criteria 5–7 change an existing test file, so they need a Test change request that a person approves in the tester's own session (D-14, D-15). An orchestrated run will stop at `test changes requested`. To resume, a human starts a tester in a session they are attending.

## Approval — 2026-10-12
The orchestrator's unattended `Approved:` stamp was refused by the harness as self-approval. Dkaattae then approved in the orchestrator session: "I approve T083 criteria". `Approved:` records that, with the design choice above left as the expander wrote it.
