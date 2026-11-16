# T-112 — backend README Known gaps — run log

**Task:** T-112 · **Branch:** `claude/relaxed-allen-5ro49x` · **PR:** #144
**Started:** 2026-11-16 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-16
`Next step` on entry: `(no brief)` → on exit: `worker`

**TL;DR:** I expanded **T-112** (`backend/README.md`'s Known gaps still say CI never runs Postgres) and opened **draft PR #144** (https://github.com/Dkaattae/geo-discovery-zone/pull/144). The brief is at `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. The push landed: `origin/claude/relaxed-allen-5ro49x` is at `c89bc91`, the same as local HEAD. I did not expand T-114. I dropped it, because PR #143 had already done all of it.

**Brief:** /home/user/geo-discovery-zone/tasks/T-112-backend-readme-known-gaps.md
**Branch:** `claude/relaxed-allen-5ro49x`, written into the brief's `Branch:` header.

**Why T-112 and not something earlier**
- **T-114 dropped, not expanded.** PR #143 merged today, off-queue. It fixed the "six agents" and "run-loop.sh removed" bullets in `PROGRESS.md` `## Done`. It also deleted `conftest.py::assert_matches` and amended E-14, so "kept in step by hand" is true again. The drop is recorded in `tasks.md` (entry deleted, §A's closing line and the "Last swept" line updated) and in `PROGRESS.md` under Completed tasks. The reviewer should confirm it.
- **Skipped because each needs a person's decision first:**
  - T-085b: a Census source.
  - T-056: a design decision.
  - T-095: its Q.
  - T-110: a wording call from Dkaattae.

**What the brief asks for**
- **10 criteria, all checked by hand.** In `backend/`, tests cover only API behaviour, so none of them is a test.
- **The Postgres bullet:** remove it, or make it true. `ci.yml:215` has run `backend-postgres` on every PR.
- **The pin bullet:**
  - It must still record that the bank holds no `drag_order`, `pin_*` or `click_profile` question. Today it implies such questions exist without answer keys.
  - It must not claim that every pin answer gets a 422. `nearest_centroid` pins are graded.
  - It must say that `polygon_then_centroid` and `distance_to_line` are refused with a 422.
- **The selection bullet** stays byte-identical.
- **Negative criteria:**
  - No change outside `## Known gaps`.
  - No file other than `backend/README.md` and the brief.
  - No test added or modified.
- **Worker model:** Sonnet is enough.

**Commit scope:** the diff is limited to `tasks/T-112-backend-readme-known-gaps.md`, `tasks.md` and `PROGRESS.md`. I ran no build, tests or pipeline.
