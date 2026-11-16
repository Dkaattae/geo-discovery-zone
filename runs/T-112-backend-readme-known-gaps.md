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

## Round 2 — worker — 2026-11-16
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** T-112 is built and pushed. In `backend/README.md` `## Known gaps`, I deleted the bullet that said CI never runs Postgres and rewrote the pin/drag bullet to match `main`. The backend suite passes. Status is `awaiting verification`, Next step is `tester`.

**Push:** commit `5e9d75b` is on `origin/claude/relaxed-allen-5ro49x`. I confirmed it with `git log origin/claude/relaxed-allen-5ro49x -1`.

**Changed:**
- **`/home/user/geo-discovery-zone/backend/README.md`:** one diff hunk, inside Known gaps only.
  - **Postgres bullet:** removed. CI's `backend-postgres` job does run the suite against Postgres.
  - **Pin/drag bullet:** now says the served bank has no `drag_order`, `pin_pick`, `pin_drop` or `click_profile` question. `drag_order` and `click_profile` answers are refused with a 422. A pin answer is graded only when the strategy is nearest-centroid and a centroid is stored: correct within `maxDistanceKm`, or 300 km when that is unset. `polygon_then_centroid` and `distance_to_line` are refused with a 422 because the geometry layers they need are not loaded.
  - **Selection bullet:** unchanged.
- **`/home/user/geo-discovery-zone/tasks/T-112-backend-readme-known-gaps.md`:** Status, Next step, Sessions row, Handoff and Notes.

**Tests:**
- **Backend:** `make -C backend check` gives 785 passed, 9 skipped.
- **Question bank:** `bun test` gives 229 passed, 0 failed.
- **Frontend:** not run. `bun run test` fails because the frontend has no `test` script, and a README-only change cannot affect it.
- **Tests made stale:** none.

**Flags for the tester (also written in the Handoff):**
- **Criterion 9 cannot pass if read literally.** The branch diff against `origin/main` also includes `PROGRESS.md`, `tasks.md` and `runs/T-112-backend-readme-known-gaps.md`. The expander committed those, not me. My own commit touches only the README and the brief. The tester should decide which reading of criterion 9 applies, and the reviewer should confirm.
- **Criterion 8 has to be checked against `origin/main`.** It says `git diff main`, but the local `main` in this checkout is stale (`2634fc8`). Against it, the diff wrongly shows a third bullet being removed. The tester should use `origin/main`.

**Status line:** the brief's Status read `awaiting approval` when I started, but it already had the `Approved: orchestrator … unattended run` line, so I went ahead.

The brief's survey was correct on every point I checked. One addition of mine: I included "and it stores a centroid" in the graded-pin sentence, because `grading.py` refuses a nearest-centroid question that has no centroid.
