# T-046 — Decide: `backend/` or `api/` — run log

**Task:** T-046 · **Branch:** `claude/relaxed-allen-5ro49x` · **PR:** #141
**Started:** 2026-11-13 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-13
`Next step` on entry: `(no brief)` → on exit: `worker`

T-046 is expanded. The brief is committed, pushed and confirmed on the remote, and draft PR #141 is open. Status: awaiting approval. Next step: worker.
The expander made the decision itself: keep `backend/`, and stop using `api/` as a name for the directory. A person should confirm that before or at merge. If they want the rename instead, the brief has to go back to the expander, because none of the criteria would survive a rename.

**Run details**
- **Task:** T-046, "Decide: `backend/` or `api/`"
- **Brief:** /home/user/geo-discovery-zone/tasks/T-046-backend-directory-name.md
- **Branch:** `claude/relaxed-allen-5ro49x`. It is in the brief's `Branch:` header. `origin/claude/relaxed-allen-5ro49x` is at `3ef0090` ("T-046 expander: record PR #141").
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/141 (draft, base `main`)
- **Diff against main:** `tasks/T-046-backend-directory-name.md` only.
- **Approved:** pending.
- **Sessions row:** task-expander, 2026-11-13, cse_011oDiJd2dgRHzBRDwBhvmNz.

**Why T-046 was the pick**
- **No T-task PRs are open.** The only open PR is #38, which is P-4.
- **T-085b skipped:** it needs Census access or a person to pick a source.
- **T-056 skipped:** it waits on a design decision.
- **T-095 skipped:** it waits on a person's call, its Q.
- **T-110 skipped:** it waits on Dkaattae's wording call.
- **T-046 is next in order** and depends on nothing. Its entry says "Either is fine, and deciding is not optional", and names no person who must decide. So the brief makes the call and puts it first, in a note under the header, in the Review checklist and in the PR body's TL;DR.

**What the brief asks for (12 criteria)**
- **A new entry, E-31, in `engineering-decisions.md`.** It must give:
  - the decision, naming T-046;
  - what a rename would have cost (`Dockerfile`, `ci.yml`, `backend/Makefile`);
  - the two leftover `api/` places in `CLAUDE.md` (lines 4 and 58), which are gated and need a P ticket;
  - a concrete revisit trigger;
  - the option not taken.
- **One line deleted from `backend/README.md`:** line 263, the stale "The directory is `backend/`, where `conventions.md` §Layout says `api/`". The rest of Known gaps stays byte-identical.
- **A `git grep` with stated exclusions must find no reference to an `api/` directory.** On main today it hits only that README line.
- **Negative checks:**
  - nothing is renamed;
  - Docker, CI, Makefile, package files and lockfiles are untouched;
  - no gated file is touched;
  - no test is added or changed.
- **The tester checks everything by hand.** `test-guidelines.md` now forbids committed tests of doc wording or repo shape in all three packages.

**Left for the reviewer (in the brief's Out of scope)**
- **P ticket for `CLAUDE.md`:** one is needed for lines 4 and 58, and none exists in `process-tasks.md`.
- **Two more stale bullets in `backend/README.md` Known gaps:** the "CI only runs the SQLite path" claim and the pin-grading bullet.
- **`PROGRESS.md`:** line 34 ("Which name wins is still T-046") and line 32 (says `CLAUDE.md` "lines 4 and 51", which is now 58).
- **`tasks.md` §A table:** it still names `conventions-doc.test.ts` and doc-count guards that the off-queue commits `8cf40b6` and `d594b38` deleted.
