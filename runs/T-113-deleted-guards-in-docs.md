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
