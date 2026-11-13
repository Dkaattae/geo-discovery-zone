# T-113 — Deleted guards in docs — run log

**Task:** T-113 · **Branch:** `claude/relaxed-allen-5ro49x` · **PR:** #142
**Started:** 2026-11-13 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-13
`Next step` on entry: `(no brief)` → on exit: `worker`

I expanded T-113 into a brief and opened draft PR #142 (https://github.com/Dkaattae/geo-discovery-zone/pull/142). The brief is at `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. The push landed: `origin/claude/relaxed-allen-5ro49x` is at `e713fbd`.

**Why T-113:** it is the first task in `tasks.md` with its dependencies done. It is the only open §A task, it has no dependencies, nothing else is in flight, and no remote branch or PR exists for it.

**What the task is:** `tasks.md` §A and the status sections of `PROGRESS.md` still name guards that three commits removed. `987d2cd` (question-bank) and `8cf40b6` (frontend) deleted or moved them, and `d594b38` (backend) did the same. Moved files now sit in the monthly snapshot lane, which does not run on pull requests. The worker makes those sections name only guards that exist, and say which docs are now kept true by review alone. It is a docs-only task, so every criterion is checked by hand.

**The brief has 18 criteria:**
- **Every named test file exists:** each one named in the scoped regions must be in `git ls-files`.
- **Snapshot files are labelled:** any snapshot-lane file named must be described as running monthly or outside CI.
- **Each stale claim is listed by location (criteria 3–13).**
- **Review-alone statement (criterion 14):** a status section must say that review, not a CI test, keeps the root `README.md`, `conventions.md` and `test-guidelines.md` true.
- **Negatives (criteria 15–18):**
  - the `## Completed tasks` history is untouched
  - the worker touches only `tasks.md`, `PROGRESS.md` and the brief
  - no invented guard claims
  - no still-true facts removed

**Scope is wider than the queue entry.** The entry named only §A and one `PROGRESS.md` bullet. My survey found the same problem in more places, so the brief covers them too:
- `tasks.md`'s intro paragraph names a deleted `region-vocabulary.test.ts`.
- `PROGRESS.md`'s Done sections credit tests that no longer exist:
  - **Question bank:** `dependency-set.test.ts`, `spawn-guard.test.ts` and the per-field bank tests
  - **Backend:** the deleted contract tests
  - **Frontend:** the deleted prettier-writer guard
  - **Repo and process:** `conventions-doc.test.ts` and `stale-suite-counts.criteria.test.ts`
- The Known-gaps git-guard bullet does the same.

**One caveat on "review alone":** one CI test still reads a single line of `conventions.md`, `backend/tests/test_t040_tester_criteria.py::test_c28_…`. Criterion 14 is worded so it stays true despite that.

**Left out of scope for a follow-up:** `PROGRESS.md` still says there are five agents (there are six) and still mentions the removed `run-loop.sh` driver. Neither is about guards, so I did not include them and did not queue them. The reviewer may want to.

**My commits** (only `tasks/` changed):
- `8cbaae9` — `T-113 expander: deleted-guards-in-docs`
- `e713fbd` — `T-113 expander: record PR #142`

Brief: /home/user/geo-discovery-zone/tasks/T-113-deleted-guards-in-docs.md

## Round 2 — worker — 2026-11-13
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR: T-113 is done and pushed. `tasks.md` §A and `PROGRESS.md`'s status sections now name only test files that exist, and both say that review alone keeps the root `README.md`, `conventions.md` and `test-guidelines.md` true.** The brief is at Status `awaiting verification`, Next step `tester`. Commit `a443e7c` is on `origin/claude/relaxed-allen-5ro49x`; I checked with `git log origin/claude/relaxed-allen-5ro49x -1`.

**Checks**
- **File-name scan (criterion 1):** zero missing. The 10 test files still named in the two regions all exist.
- **Backend:** `make -C backend check` and `make -C backend test` both give 809 passed, 9 skipped.
- **question-bank:** typecheck, lint and format:check are clean, and `bun test` gives 229 pass, 0 fail.
- **frontend:** lint and format:check are clean. Typecheck and `bun test` are red because the packages could not be installed: `bun install --frozen-lockfile` got a proxy 403 on `europe-west1-npm.pkg.dev`, a policy denial I did not retry. `react-simple-maps` and `us-atlas` are missing, so 4 test files fail to load: `screens.criteria.test.tsx`, `t026-setup.criteria.test.tsx`, `t051-map-click.test.tsx` and `t051-tester.criteria.test.tsx`. This commit changes no code, so it cannot have caused them. The tester should rerun these where the registry is reachable.
- **Tests made stale:** none.

**What changed** (my commit touches only these three files)
- `/home/user/geo-discovery-zone/tasks.md`: the intro paragraph (also `E-12` corrected to `E-32`), the `conventions.md`, "Test counts in docs" and `README.md` table rows, and the paragraph under the table.
- `/home/user/geo-discovery-zone/PROGRESS.md`: the `## Done` and `## Known gaps` sections only. Nothing between `## Completed tasks` and `## Known gaps` changed.
- `/home/user/geo-discovery-zone/tasks/T-113-deleted-guards-in-docs.md`: my Sessions row, Status, Next step, Handoff and Notes.

**Judgment calls, each with an owner** (details are in the brief's Handoff)
- **Criterion 4 assumes something that is no longer true.** It lets the row keep saying the docs state no test counts. Commit `987d2cd` put counts back into `test-guidelines.md` (five test files, 13 snapshot files), so I wrote that the counts were taken out and that `test-guidelines.md` states them again. The reviewer should confirm this. Whether `test-guidelines.md` should drop those counts is Dkaattae's call, and that file is outside this task.
- **One edit beyond the listed criteria.** The `PROGRESS.md` Known-gaps bullet on region names still credited a closed-set check on the curated table and the built bank, and that test was deleted. It now credits `backend/tests/test_region_vocabulary.py` with checking `content.json` and what the API serves. The reviewer should confirm it, or revert it as outside the goal.
- **One heading left alone.** "No test fails on `main` in a full clone any more" stays as written. I did not run the monthly snapshot tests to re-prove it. The tester or reviewer should decide whether it should say "No CI test".
- **Rule I followed:** a deleted test is described by its commit (`8cf40b6`, `d594b38`, `987d2cd`), never by its file name. Criterion 1 counts every file name in the two sections, including ones described as deleted.

The brief's diff against `main` also lists `runs/T-113-deleted-guards-in-docs.md`. That file came from the orchestrator's commit, not mine.

## Round 3 — tester — 2026-11-13
`Next step` on entry: `tester` → on exit: `ci-fix` (fail #1)

**T-113 tester: FAIL. Next step: `ci-fix`.** A new sentence the worker added makes a false claim about which CI tests read `conventions.md`. The fix is a small doc rewording. I checked all the other criteria by hand and they hold. The verdict is pushed to `claude/relaxed-allen-5ro49x` as `728796e`, and the remote now matches.

**What is wrong (criterion 14, and 17 for the same sentence)**
- **Where:** `tasks.md` lines 169–171 and `PROGRESS.md` lines 247–249. Both say "The one CI test that still reads `conventions.md` checks a single line, the Layout's `archive/` row (`backend/tests/test_t040_tester_criteria.py::test_c28_…`)".
- **Why it is false:** `question-bank/src/committed-bank.test.ts` is one of the five question-bank files CI runs, and it also reads `conventions.md`:
  - `criterion 11 — no shipped file still asserts the bank is not stored in git` checks that a phrase is absent from it.
  - `criterion 15 — README and conventions say a fresh clone already has the bank` asserts it matches `/committed/` and `/data\/us-states/`.
- **Reproduce:** `grep -n 'conventions.md' question-bank/src/committed-bank.test.ts` finds lines 241, 271 and 272.
- **Where the wrong fact came from:** the brief's own Context says the same thing, and the worker repeated it. The criteria themselves are sound, so this is `fail`, not `blocked`.
- **What the fix needs:** name both narrow checks, or drop "the one". Also, committed-bank's criterion 15 does pin one fact in `conventions.md` (the bank is committed under `data/us-states`). So "no CI test checks it as a whole" is accurate, but a flat "no CI test checks it against the layout" should be qualified.

**Criteria**

| Criteria | Verdict | Evidence |
|---|---|---|
| 1 | met | Scanned both regions for test-file names: 13 hits (3 in `tasks.md`, 10 in `PROGRESS.md`), every one tracked. Zero missing. |
| 2 | met | Both snapshot-lane files are described as monthly / outside CI where they are named. The snapshot workflow's cron runs monthly. |
| 3–11, 13 | met | Each stale phrase is gone and I checked the new text against the code. |
| 12 | met, with a note for the reviewer | The rewrite says `openapi.yaml` is "kept in step by hand". That matches E-14 and `test-guidelines.md`, but CI still checks response shapes against its schemas through `backend/tests/conftest.py::assert_matches`. |
| 14 | **not met** | The false "one CI test" sentence above. |
| 15 | met | The `PROGRESS.md` span between `## Completed tasks` and `## Known gaps in what is done` is identical on `origin/main` and `HEAD` (1643 lines). |
| 16 | met | The worker's commit `a443e7c` touches only `PROGRESS.md`, `tasks.md` and the brief. |
| 17 | not met | Same sentence as 14. Every other new claim checks out. |
| 18 | met | The facts that were still true are unchanged. |

**Suite (I committed no tests: the change is docs only, so every criterion was checked by hand)**
- **question-bank:** typecheck, lint, format and tests all pass (229 pass, 0 fail).
- **backend:** `make check` gives 809 passed, 9 skipped.
- **frontend here:** lint and format are clean, but typecheck and tests are red because the packages could not be installed (proxy 403). Four test files fail to load on missing modules.
- **frontend in CI:** GitHub CI on the branch head `a9e98bc` is all green, including the frontend job.
- **Stale tests:** none, and no pre-existing test was changed.

**Independence:** this is an orchestrated run, and my session id is the same one the expander and worker rows carry, so the id check proves nothing. My independence rests only on being a freshly spawned agent that never saw the work. I say so in the Verdict.

Brief: /home/user/geo-discovery-zone/tasks/T-113-deleted-guards-in-docs.md — Status `fail`, Next step `ci-fix`, Fault line and my Sessions row added.

## Round 4 — ci-fix (pass 1) — 2026-11-13
`Next step` on entry: `ci-fix` → on exit: `human`

**T-113 ci-fix, pass 1: the plan is written and pushed, and nothing is applied yet.** Two doc-only rows are waiting for approval. Status is `ci fix requested`, Next step is `human` and the header reads `CI fix: requested`. Commit `346235e` is on `claude/relaxed-allen-5ro49x`; local HEAD matches origin.

**Root cause, reproduced:**
- `tasks.md:169-171` and `PROGRESS.md:247-249` both say "The one CI test that still reads `conventions.md` …" and name `test_c28_…`. That is false.
- `question-bank/src/committed-bank.test.ts` also reads `conventions.md`, at lines 241, 271 and 272, in the tests "criterion 11 …" and "criterion 15 …".
- CI runs that file (`ci.yml:154`, `bun test`). I ran the two tests with `bun test src/committed-bank.test.ts -t 'criterion 1[15]'`: 2 pass.
- The false sentence came from the brief's own Context line, which the worker copied without checking.
- I grepped every tracked CI test file. Apart from these two tests and `test_c28`, nothing reads root `README.md`, `conventions.md` or `test-guidelines.md`; the other matches are comments.

**Plan** (in `tasks/T-113-deleted-guards-in-docs.md`, `## CI fix plan`):
1. **`tasks.md`, the paragraph under the §A table:** replace the "one CI test" sentence with one sentence saying two narrow CI checks still read `conventions.md`, neither covers it as a whole, and what each checks. `test_c28` checks the `archive/` row; `committed-bank.test.ts` checks that the doc says the bank is committed under `data/us-states` and does not say the bank is kept out of git. The bold criterion-14 sentence is not changed.
2. **`PROGRESS.md`, `## Done` › Repo and process bullet:** the same replacement.

**Not doing:**
- Dropping the sentence instead of correcting it.
- Rewording the bold criterion-14 sentence.
- Editing the brief's Context line.
- Acting on the tester's criterion-12 advisory (`assert_matches`); that is left for the reviewer.
- Any test change. No test is red.

**Independence:** this is an orchestrated run, and every role carries the same session id (`cse_011oDiJd2dgRHzBRDwBhvmNz`). My only independence is that I was freshly spawned with my own context. I added my `ci-fix` row to the Sessions table.

**Next:** a person approves the rows, or the orchestrator stamps them after its timeout. Then a fresh `ci-fix` runs pass 2.

## Halted — CI fix requested — 2026-11-13
Halt time: 2026-11-13T21:46:48Z. Branch head at halt: `346235e`.
Header: `CI fix: requested`, `Status: ci fix requested`, `Next step: human`. Plan not read by the orchestrator.
Person asked in the orchestrator's session to approve or refuse. If nobody answers in about an hour, the orchestrator stamps it (D-17).

## CI fix approved by a person — 2026-11-13
The person in the orchestrator's session answered before the hour was up, in their words: "approve T113 fix plan". Header set to `CI fix: approved — session user (repo owner), 2026-11-13, given in the orchestrator's session`, `Status: ci fix approved`, `Next step: ci-fix`. The scheduled one-hour check-in was deleted; no auto-approval stamp was written.

## Round 5 — ci-fix (pass 2) — 2026-11-13
`Next step` on entry: `ci-fix` → on exit: `tester`

**T-113 ci-fix, pass 2: I applied both approved rows. They are doc-only and none was refused.** The brief now reads Status `awaiting verification` and Next step `tester`. Commit `d283def` is on `claude/relaxed-allen-5ro49x`, and local HEAD matches origin. **Next: spawn a fresh `tester`.**

**Approval used**
- **Header on entry:** `CI fix: approved — session user (repo owner), 2026-11-13, given in the orchestrator's session`.
- **The person's words:** "approve T113 fix plan", as recorded in `runs/T-113-deleted-guards-in-docs.md` (commit `45a3fd8`). That covers the whole plan, so I wrote it into both rows' Decision cells.
- **Not a timeout stamp:** this approval came from a person, and the plan has no test rows.

**What changed**
- **`/home/user/geo-discovery-zone/tasks.md`** (the paragraph under the §A table): the false sentence "The one CI test that still reads `conventions.md`…" is replaced. The new sentence says two narrow CI checks still read `conventions.md` and neither covers it as a whole. `test_c28_conventions_layout_names_the_archive` checks the Layout's `archive/` row. `question-bank/src/committed-bank.test.ts` checks that it says the bank is committed under `data/us-states` and does not say the bank is kept out of git. The bold criterion-14 sentence is unchanged.
- **`/home/user/geo-discovery-zone/PROGRESS.md`** (`## Done` › Repo and process bullet): the same replacement. It is outside the `## Completed tasks` span, so criterion 15 still holds.
- **`/home/user/geo-discovery-zone/tasks/T-113-deleted-guards-in-docs.md`:**
  - Decision cells filled in.
  - New `## CI fix` section.
  - Sessions row `ci-fix (pass 2)` added.
  - Header: `CI fix: applied — <approval as it read>`, Fault set to `none`. `Test changes` stays `none`.

**Suite, run after the edits**
- **question-bank:** typecheck, lint, format:check and tests all pass (229 pass, 0 fail).
- **backend:** `make check` gives 809 passed, 9 skipped.
- **frontend:** lint and format:check are clean. Typecheck and `bun test` fail here (111 pass, 4 fail, 4 errors). The cause is the same one the worker and tester recorded: `react-simple-maps` and `us-atlas` could not be installed (proxy 403), so the `t051-*` and screens files fail to load. The diff touches no code.

**Independence:** this is an orchestrated run, and every role has the same session id, `cse_011oDiJd2dgRHzBRDwBhvmNz`. So the session check can neither pass nor fail. My only independence is that I was freshly spawned with my own context.

**Noticed and left alone, for the reviewer**
- The brief's Context line still says `test_c28_…` is the only CI test that reads `conventions.md`, which is wrong.
- The tester's advisory on criterion 12 (`conftest.py::assert_matches`) is still open.

## Round 6 — tester (re-verify) — 2026-11-13
`Next step` on entry: `tester` → on exit: `reviewer`

**T-113 passes on re-verification.** I checked all 18 criteria by hand after the ci-fix at `d283def`, and the round-1 failure on criterion 14 is fixed. The verdict is pushed as `fe2c04d` to `claude/relaxed-allen-5ro49x`, and local HEAD matches the remote. **Next: `reviewer`.**

**Independence:** this is an orchestrated run. My session id `cse_011oDiJd2dgRHzBRDwBhvmNz` is the same id every role on this task carries, so the session check neither passes nor fails. My independence rests only on being a freshly spawned agent with its own context, which is weaker evidence than a separate session. The Verdict says so.

**Criterion 14 fix:**
- **What changed:** `tasks.md` and `PROGRESS.md` now name two narrow CI readers of `conventions.md`: `test_c28_…`, which checks one line (the `archive/` row), and `committed-bank.test.ts` criteria 11 and 15.
- **Both descriptions are accurate.** I read both tests.
- **Nothing else reads these docs in CI.** I searched every tracked CI test file. None reads the root `README.md` or `test-guidelines.md`, so the bold "No CI test checks …" sentence holds.

**Other criteria:**
- **Criterion 1:** the token scan finds 4 test-file names in `tasks.md`'s region and 11 in `PROGRESS.md`'s, and none is missing.
- **Criterion 15:** the `## Completed tasks` span of `PROGRESS.md` is identical to `origin/main` (1643 lines).
- **Criterion 16:** the worker's and ci-fix's commits touch only `PROGRESS.md`, `tasks.md` and the brief.
- **Criteria 2–13, 17 and 18:** read hunk by hunk against the files and commits each one names (`987d2cd`, `d594b38`, `ci.yml`, both `package.json` files, `engineering-decisions.md`'s E-31). All met.

**Suite at `5a2a750`:**
- **question-bank:** typecheck, lint and format check are clean; 229 tests pass, 0 fail.
- **backend:** `make check` gives 809 passed, 9 skipped.
- **frontend:** lint and format check are clean. Typecheck and `bun test` fail here only because `react-simple-maps` and `us-atlas` could not be installed (registry proxy returned 403).
- **GitHub CI on `5a2a750`:** every job that had finished is green, including frontend. The e2e job was still running when I checked.

No tests were added, changed or deleted, and none is stale.

**Left for the reviewer:**
- **Wrong survey line in the brief:** the Context section still says `test_c28` is "the one remaining CI test that reads `conventions.md`". It is the expander's notes, not part of what ships.
- **Criterion 12 wording:** the round-1 note stands. CI still checks response shapes against `openapi.yaml` through `conftest.py::assert_matches`, so "kept in step by hand" may want qualifying.
- **Tone check:** the brief's checklist asks a person to read the rewritten bullets before merge.

Brief: /home/user/geo-discovery-zone/tasks/T-113-deleted-guards-in-docs.md (Status `pass`, Next step `reviewer`, Sessions row added).
