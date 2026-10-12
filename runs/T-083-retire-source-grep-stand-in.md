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

## Round 2 — worker — 2026-10-12
`Next step` on entry: `worker` (`Status: awaiting approval`) → on exit: `tester` (`Status: awaiting verification`)

**TL;DR:** T-083 is built and pushed as commit `37a6342` to `claude/awesome-hamilton-gft1hi`, and `git log origin/claude/awesome-hamilton-gft1hi -1` shows it. The brief is now Status `awaiting verification`, Next step `tester`. The full suite passes (1747 pass, 0 fail), and typecheck, lint and format:check all exit 0. Criteria 5–7 (rewriting the old test file) are left for the tester to raise as Test change request rows, which a person has to approve. So whoever starts the tester session needs to be present for it.

**Files changed**
- **`/home/user/geo-discovery-zone/question-bank/src/build.ts`**: `runBuild` now hands `report()` the always-on printer, `report(entities, warnings, unmatched, args, print)`, instead of the logger that `--quiet` silences. A quiet build now drops only the progress lines and still prints its summary and every warning, which is what `--help` already said. The `--help` text and the return value are unchanged.
- **`/home/user/geo-discovery-zone/question-bank/src/offline-rebuild.ts`**: only the doc comment changed. It no longer says `--quiet` makes the build print nothing (criterion 12).
- **`/home/user/geo-discovery-zone/question-bank/src/report-warnings-stdout.test.ts`** (new):
  - **Criteria 1–3:** an offline build through `rebuildOfflineWithStdout` on a derived fixture. It is a temp copy with Colorado's `capitalLabel` and `highestPoint` keys removed and the elevation fixture copied beside it.
  - **Criteria 8–10:** checked in-process through `runBuild(argv, { log })` with `--offline`.
  - **Extra check:** `--quiet` does not change what `runBuild` returns.
- **`/home/user/geo-discovery-zone/tasks/T-083-retire-source-grep-stand-in.md`**: Handoff, Sessions row, Status and Notes filled in.

**Checks I ran**
- **Criterion 4 mutation:** I made `report()` skip warnings whose field is `highest_point`. The criterion 1 and 2 tests went red, and I reverted it.
- **Undoing the `print` change:** the criterion 8 test goes red.
- **Clean up:** no `t083-*` temp directories are left behind, and `package.json` and `bun.lock` are unchanged.

**Tests made stale** (all in `highest-point-verify.test.ts`, which I did not touch; none of them are red)
- **The test at `:432`**, "build.ts's report prints every warning it is given, with no allow-list of fields": I propose deleting it, because the new file now checks the same thing on real stdout.
- **The comment at `:483-487`**, which says "run by hand" and "count of 0": I propose rewriting it to say the count is 3 and is pinned in `build-report-stdout.test.ts`.
- **The file header at `:28-35`**: I propose fixing both bullets the same way.
- **Test-count floors:** none would be affected.

**Things to know**
- **Brief header contradiction:** Status read `awaiting approval` while the Approved line named Dkaattae. I went by the Approved line and started.
- **Install dependencies first:** `node_modules` was missing here. My first `bun run format` used a different Prettier and reformatted an existing test, `highest-point-metres-verify.test.ts`. I reverted that before committing. Run `bun install --frozen-lockfile` before formatting.
- **Criterion 9's pattern:** the lint rules reject the regex `row\(s\) returned$`, so the test uses `endsWith("row(s) returned")`, which means the same thing.
- **Leading blank line:** a quiet build now prints the blank line `report()` has always started with. No criterion forbids it; the tester should confirm it is acceptable.
