# T-093 — An undone answer still counts as a place seen — run log

**Task:** T-093 · **Branch:** `claude/tender-fermi-ad0qx3` · **PR:** #119
**Started:** 2026-11-03 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-03
`Next step` on entry: none (no brief) → on exit: `worker` — once a person replaces `pending` below

**TL;DR:** I wrote the T-093 brief (an undone answer still counts as a place seen), pushed it, and opened draft PR #119. Status is `awaiting approval` and Next step is `worker`. A person has to replace `Approved: pending` before the worker starts. Under the orchestrator this approval step is skipped, as it was for T-098.

**Pick**
- **T-093 is the first task in `tasks.md` whose dependencies are done.** §A and §B have no open tasks.
- **T-085b, T-056 and T-095 were skipped.** Each is waiting on a person's decision: T-085b on a reachable Census source, T-056 on a design call, T-095 on its question Q.
- **The previous cycle was finished.** `tasks/` held only `README.md` and `TEMPLATE.md`.

**Brief**
- **File:** `/home/user/geo-discovery-zone/tasks/T-093-undo-places-seen.md`
- **Full brief, not the light path:** it has 12 criteria.
- **Already true:** undo restores everything except `seen_entity_ids`. That list is added to in `backend/app/grading.py:190-191` but is not in `SessionRecord.snapshot`/`restore` (`backend/app/orm.py:295-323`).
- **Two choices flagged for the approver** in the brief and the PR body:
  - **Undo removes the place from the seen list.** The queue entry also allowed the opposite: write down that "a place looked at is a place seen". I chose restore because the code's own comment says "an undo restores exactly what was there" (`backend/app/routers/sessions.py:259-260`).
  - **Criterion 8 goes beyond the queue entry.** An answer recorded before the change has a snapshot with no seen-list key, and undoing it must return 204, not a 500.
- **Criteria cover:**
  - the list restored exactly, starting from an empty and from a non-empty list
  - a place an earlier kept answer saw stays in the list
  - `placesSeen` is 0 or 1 in the two stated cases
  - all three formats, each answered right and wrong
  - a review-round answer
  - re-answering after an undo counts the place once
  - the fields undo already restored are still restored
  - the full backend, frontend and question-bank suites pass
  - no pre-existing test is changed, no migration or dependency is added, and tests reach no network

**Git**
- **Branch:** `claude/tender-fermi-ad0qx3`, recorded in the brief's `Branch:` header.
- **Commits:** `6a7e038 T-093 expander: undo-places-seen` and `f07bf66 T-093 expander: record PR #119 in the brief`.
- **Push confirmed:** `git log origin/claude/tender-fermi-ad0qx3` shows both commits.
- **Files touched,** from the diff against `origin/main`: only `tasks.md` (T-093's status set to `doing`) and `tasks/T-093-undo-places-seen.md`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/119, a draft against `main`.

**Not done**
- **No build, test or pipeline run**, which this role does not do.
- **`PROGRESS.md` is unchanged.** Nothing in it changed state.

### Approval stamp — 2026-11-03
Orchestrator wrote `Approved:` (unattended run). Criteria not read.
