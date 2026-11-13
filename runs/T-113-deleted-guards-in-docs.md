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
