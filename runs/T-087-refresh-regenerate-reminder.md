# T-087 — A bank refresh tells you to regenerate the question file and the served bank — run log

**Task:** T-087 · **Branch:** `claude/hopeful-gates-wh4fep` · **PR:** #112
**Started:** 2026-10-30 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-30
`Next step` on entry: `none — no brief` → on exit: `worker`

**TL;DR:** I wrote the T-087 brief and opened it as draft PR #112. Both commits are on `origin/claude/hopeful-gates-wh4fep` (head `37daa9e`, confirmed by fetch). Status is `awaiting approval` and Next step is `worker`. A person has to approve first: `Approved:` is still `pending`, and the worker will refuse to start until a person writes their name and the date there.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-087-refresh-regenerate-reminder.md
- **Branch header:** `claude/hopeful-gates-wh4fep`. It is the branch assigned to this session and the branch PR #112 is built from.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/112 (draft, against `main` at `0a98e11`).
- **Commit scope:** only the new brief, plus `tasks.md` (T-087 changed from `todo` to `doing`). No source, tests or configuration.

**Why T-087**
- T-085b and T-056 come earlier in queue order but are both blocked:
  - **T-085b** needs a person to choose how to reach a Census release, and no choice is recorded.
  - **T-056** needs a design decision.
- §A and §B have nothing queued. `tasks/` was empty at the start, so the last cycle was swept.

**What the brief asks for (18 criteria)**
- **New script:** `bun run questions` in `question-bank/package.json`. It must write the same bytes as `bun run ./src/write-questions.ts`, and that old command must keep working.
- **Refresh output:** when a refresh exits 0, it prints `cd question-bank && bun run questions` and then `make -C backend content` on stdout, after the summary line. It prints neither when it exits 1 or 2, and it does not run either command itself.
- **Docs:** the "Refreshing the committed bank" section of `question-bank/README.md` lists both commands, and `conventions.md` lists `bun run questions` in place of the file path.
- **Must not change:** the question file and `content.json` stay byte-identical to main. Nothing changes under `backend/`, `frontend/` or `e2e/` except approved test changes. No dependency, no network in tests, and the full suite passes.

**Decisions I made as expander (recorded in the brief's Notes)**
- **Script rather than a written-down reason:** the queue entry allowed either. I chose the named script because the entry leans that way.
- **Chaining is out of scope.** Because the refresh does not regenerate `content.json`, the queue entry's request to restore T-070's four relaxed `extractedAt` tests does not apply.

**Heads-up for the tester step**
- **Expect a Test change request.** At least eight verify tests in `question-bank/src/` check `question-bank/package.json` against a stored digest or an old commit. The brief lists them under Constraints. Adding the script turns them red by design. Under the orchestrator, the run will halt there until a person approves the request.

## Approval — orchestrator — 2026-10-30
Stamped `Approved:` as an unattended run (orchestrator.md "Approval"). Criteria not read.

## Round 2 — worker — 2026-10-30
`Next step` on entry: `worker` (Status `awaiting approval`) → on exit: `tester` (Status `awaiting verification`)

**TL;DR.** T-087 is built and pushed. Commit `e982550` is on `origin/claude/hopeful-gates-wh4fep`, which `git log origin/claude/hopeful-gates-wh4fep -1` confirms. The brief is at Status `awaiting verification`, Next step `tester`. A Test change request is needed: 11 pre-existing question-bank tests are red. 9 go red because of this change, which the brief predicted. 2 were already red at the branch head before I changed anything.

**What I changed**
- **`question-bank/package.json`:** added `"questions": "bun run src/write-questions.ts"`. Nothing else in the file changed, and `bun.lock` is untouched.
- **`question-bank/src/refresh.ts`:** a refresh that changes the bank now prints two more lines on stdout, after the `bank changed (` summary line: `cd question-bank && bun run questions`, then `make -C backend content`. It prints them only on exit 0, and it does not run them. Neither line starts with `  us-state-`, so the existing count of change lines still holds.
- **`question-bank/README.md`:** the "Refreshing the committed bank" section now gives both commands, the question command first.
- **`conventions.md`:** the question-bank command block lists `bun run questions` in place of `bun run ./src/write-questions.ts`.
- **New `question-bank/src/refresh-next-steps.test.ts`:** 8 tests, offline through `SparqlTransport` with the recorded fixture. They cover the order on stdout, that a changed refresh leaves the question file and the served bank byte-identical, and that nothing is printed on exit 2 or on any of the three exit-1 paths.
- **Brief:** Handoff written, worker row added to Sessions, Notes added.

**Results**
- **question-bank `bun test`:** 2669 pass, 11 fail. Every failure is listed in the Handoff.
- **typecheck, lint, format:check:** clean.
- **`make -C backend test`:** 744 passed, 9 skipped.
- **`bun run questions` and `bun run ./src/write-questions.ts`:** both leave the question file unchanged. Checked by hand.
- **frontend:** the full suite was not run. `bun install` in `frontend/` was refused by the proxy (403 on `europe-west1-npm.pkg.dev`). Only `conventions-doc.test.ts`, the one frontend test that reads a file I touched, was run: 81/81 pass.

**Stale reds, for the tester's Test change request**
- **Pins on `package.json` (8 tests):** in the eight files the brief named. The expander's list was right for these.
- **`T-091 criterion 20` in `climate-cold-trade-accepted-verify.test.ts` (1 test):** the expander missed this one. It pins `refresh.ts`, which this task has to change.
- **`T-096 criterion 21` and `T-091 criterion 22` (2 tests):** already red at HEAD `ca63b6e`. They count tracked non-test files, and the expander and orchestrator commits added the brief and the run log.

**Where the brief contradicts itself**
- **Approval:** the brief's last Note says `Approved:` stays `pending` until a person signs, but the line carries an orchestrator stamp. I treated the stamp as valid, as my role allows. The reviewer should confirm that a human has looked at the criteria before merge.

**Flags, each with an owner**
- **Count-based pins:** the two tests already red at HEAD will catch every task that adds a brief and a run log. That deserves a `tasks.md` entry. Reviewer, at the sweep.
- **Same session id:** the worker ran in the same session as the expander (`cse_011oDiJf8mLL75U1jKWTn7Jx`). The tester must run in a different one.
- **Install before formatting:** `node_modules` was missing at the start, so `bun run format` used a different prettier and rewrote 3 pre-existing tests. I reverted them and none is committed. Later roles should run `bun install --frozen-lockfile` before formatting.

G5: Status and Next step both changed — pass.

## Round 3 — tester — 2026-10-30
`Next step` on entry: `tester` (Status `awaiting verification`) → on exit: `human` (Status `test changes requested`, Test changes `requested`)

**TL;DR.** T-087 meets criteria 1–17. Criterion 18 (the whole suite passes) is held up only by 12 stale pre-existing question-bank pins, so there is no pass verdict yet. I raised a 12-row Test change request and halted: Status `test changes requested`, Next step `human`, Test changes `requested`. A person needs to start a `tester` in a session they are attending and approve or refuse each row there.

**Push landed.** Commit `40f6c54` ("T-087 tester: criteria tests, 1-17 met; test change request for 12 stale pins") is on `origin/claude/hopeful-gates-wh4fep`, which `git log` after a fetch confirms.

**Independence is the weaker kind.** This run is orchestrated, so `$CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_011oDiJf8mLL75U1jKWTn7Jx`) is the same id the expander and worker used, and the session check proves nothing. My independence comes only from being a freshly spawned subagent that did not see the build or the worker's reasoning. The Verdict says this, and my Sessions row is marked as orchestrated.

**What I did**
- **New test file:** `/home/user/geo-discovery-zone/question-bank/src/refresh-regenerate-reminder-verify.test.ts`. It has 33 tests, one `describe` per criterion, and all pass.
  - The two commands are checked against the brief's literal text, not the constants exported by `refresh.ts`.
  - Main's file contents are pinned as sha256 digests taken from a temporary checkout of `0a98e11`. No git call in the tests is handed a revision, as the T-081 guard requires.
  - Criteria 3–5 run `bun run questions` and `bun run ./src/write-questions.ts` in temporary copies of `question-bank/`. Criterion 4 moves Colorado's capital to `Boulder` and checks both commands write identical bytes that differ from main's.
  - Every refresh test goes through `SparqlTransport` with the recorded fixture; nothing reaches the network.
- **Mutations:** I made 11 deliberate breaks in the code, docs and `package.json`, and each one turned the matching tests red. Examples: dropping the reminder call, swapping the two lines, printing to stderr, printing on the exit-2 or exit-1 paths, pointing the script somewhere else, adding an extra script, having the refresh write the question file, and reverting the docs. All were reverted, and `git status` was clean afterwards.

**Suite results**
- **question-bank:** 2701 pass, 12 fail. typecheck, lint and format:check are clean.
- **Backend:** `make -C backend test` gives 744 passed, 9 skipped.
- **Frontend, locally:** 4 fails and 4 errors, all from the environment. `react-simple-maps` is not installed, because the proxy refuses `bun install` (403 on the npm tarballs). Nothing under `frontend/` changed (criterion 15 pin). CI's frontend job is green on `22e7a12`; only CI's question-bank job is red, from the stale pins.

**Test change request (12 rows, all modify, none delete)**
- **8 rows** re-pin the `question-bank/package.json` digest from `5286f4f7…` to `8e276875…a3a3`, with the other pins untouched.
- **1 row** re-pins the source-tree digest because `refresh.ts` changed. The worker found this one.
- **2 rows** add T-087's seven changed or added files to the allowed lists of the T-096 criterion 21 and T-091 criterion 22 whole-tree checks. They keep their counts and digests, and stop if those no longer match.
- **1 row** is new and the worker missed it: T-091 criterion 22, "pre-existing test files are main's". It counts tracked test files and expects 110; this task's two new test files make 112. The row excludes them and the rows' own files, then recomputes the count and digest.

**Flagged for the reviewer**
- **`Approved:` is the orchestrator's stamp**, and the run log says "Criteria not read". No person has approved the criteria yet.
- **The whole-tree checks will keep tripping** on every later task, including on its own brief. That is worth a `tasks.md` entry.

**Files**
- /home/user/geo-discovery-zone/tasks/T-087-refresh-regenerate-reminder.md (Verdict, Test change request, header, Sessions row)
- /home/user/geo-discovery-zone/question-bank/src/refresh-regenerate-reminder-verify.test.ts

G5: Status and Next step both changed — pass.

## Halted — test change request — 2026-10-30
Raised by the tester in commit `40f6c54`. Rows not copied here; the orchestrator has not read them.

What a human has to decide: whether to approve the tester's test change request. Per D-15 the orchestrator cannot take that approval. To resume: start the `tester` step for T-087 in a session you are attending. It will ask about each row, apply what you approve, and finish verifying. Its header then names the next role, and a new run starts from there.

## Resumed — 2026-10-30
Dkaattae, in the orchestrator's session: "Ci is fixed please proceed".
Since the halt the branch moved (`0ce2398` → `7672370`): an attended tester applied the test change request (header: `Test changes: approved — Dkaattae, 2026-10-30` (rows 1-12, 10a, 11a, 13, 14)) and wrote `Status: pass`, `Next step: reviewer`. Carrying on from that Next step.
