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
