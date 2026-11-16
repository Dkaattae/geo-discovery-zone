# T-112 — backend README Known gaps — run log

**Task:** T-112 · **Branch:** `claude/relaxed-allen-5ro49x` · **PR:** #144
**Started:** 2026-11-16 · **Outcome:** ready for merge

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

## Round 3 — tester — 2026-11-16
`Next step` on entry: `tester` → on exit: `reviewer`

**T-112 tester: pass.** I checked all 10 criteria by hand and they are all met. It is a doc-only change in `backend/`, so by the brief and `test-guidelines.md` there was nothing to add as a test. Next step is the reviewer. The verdict commit `b08a533` is pushed and `origin/claude/relaxed-allen-5ro49x` now points at it.

- **How independent this check is:** this is an orchestrated run, so I share a session id with the expander and the worker, and comparing ids proves nothing. My independence rests only on being a freshly spawned subagent with my own context. That is weaker than a separate session, and the Verdict says so.
- **The worker's change is on the branch:** commit `5e9d75b` touches only `backend/README.md` and the brief. I diffed against `origin/main` (`29b3e95`) because the local `main` is stale.
- **What I checked:**
  - **Postgres wording (criteria 1–2):** the false CI-skips-Postgres bullet is gone. The remaining Postgres lines in the README are about running the suite locally, which is true.
  - **Facts in the pin bullet (criteria 3–6):** they match `content.json` (315 multiple_choice, 50 map_identify, 50 map_click, none of the four other formats). They also match `grading.py`: only `nearest_centroid` is graded, with a 300 km default radius, and the other strategies and a missing centroid are refused through `UngradableAnswer`, which `sessions.py` turns into a 422.
  - **Selection bullet (criterion 7):** compared with `cmp` against `29b3e95`, it is byte-identical.
  - **README diff (criterion 8):** one hunk, all of it below `## Known gaps`.
- **Criterion 9 needs the reviewer's confirmation.** The branch diff also includes `PROGRESS.md` and `tasks.md` (the expander's T-114 drop) and the orchestrator's `runs/` log. I judged the criterion on the task's own change, `5e9d75b`, which has no source, test, workflow or `openapi.yaml` changes. The reviewer should confirm that reading and the T-114 drop.
- **Suites:**
  - `make -C backend check`: ruff clean, format clean, 785 passed and 9 skipped.
  - `question-bank`'s `bun test`: 229 passed, 0 failed.
  - Frontend: not run, because a README change cannot affect it.
- **Tests:** none added, none changed, none made stale.

In the brief I set Status to `pass` and Next step to `reviewer`, added the tester row to Sessions, and wrote `## Verdict` with a table of each criterion and its evidence.

File: /home/user/geo-discovery-zone/tasks/T-112-backend-readme-known-gaps.md

## Round 4 — reviewer — 2026-11-16
`Next step` on entry: `reviewer` → on exit: `human` (merge; brief swept, last header at `6454e81`: `Status: approved`)

**TL;DR:** I approved T-112 and the change is inside the envelope, so there is no escalation. I swept it in the PR's own branch and marked PR #144 ready for review (it is no longer draft). Nothing is merged. Next: Dkaattae merges once CI on head `01803c6` is green. Those checks were still running when I marked the PR ready.

**Push landed:** `origin/claude/relaxed-allen-5ro49x` and my local HEAD are both at `01803c61de14c679aed2da0c78976bbeead206f6`. GitHub reports PR #144 at `draft: false`, open, with that head.

**Review**
- **Every role's work is in the PR:**
  - expander: `9f4ac17`, `c89bc91`
  - worker: `5e9d75b`
  - tester: `b08a533`
  - orchestrator run log: `d2ac752`, `5082046`, `79f9982`
- **Each role stayed in its lane:**
  - The expander touched only `tasks/`, `tasks.md` and `PROGRESS.md`.
  - The worker touched only one `backend/README.md` hunk under `## Known gaps`, plus the brief.
  - The tester touched only the brief.
- **The new Known-gaps bullet is true of `main`, checked myself:**
  - `content.json` is 315 `multiple_choice`, 50 `map_identify` and 50 `map_click`.
  - Pin grading in `grading.py` matches the bullet: only `nearest_centroid` with a centroid is graded, within `maxDistanceKm` or 300 km.
  - The Postgres bullet is gone, and `ci.yml` does have a `backend-postgres` job.
- **Open flags, each decided:**
  - **Criterion 9:** judged on the task's own change. The other files in the diff are bookkeeping, not source, tests, workflows or `openapi.yaml`.
  - **Local `main`:** it is stale here, so `origin/main` is the correct base.
  - **T-114 drop:** confirmed. `PROGRESS.md` `## Done` now names six agents, and `assert_matches` no longer exists in `backend/`.
  - **Worker's added "and it stores a centroid":** accepted. Without it the bullet would overstate what is graded.
- **One non-blocking finding, queued as new T-115 (S):** `backend/README.md` still calls `openapi.yaml` "the contract" at 7 lines. `tasks.md`'s "Where the app is today" table has the same wording. No queued task owned this. I did not fold it into T-110, because T-110 waits on a product call and this needs none.
- **Envelope:**
  - Tester pass. Local suite green: 785 passed / 9 skipped, and question-bank 229 pass.
  - No dependency, no `openapi.yaml`, migration or plan change, no child-facing text, no tests touched, no CI fix, no product decision.
  - The brief was approved on the orchestrator's stamp. For a README-only change that is not an escalation trigger.

**Commits**
- `6454e81`: `## Review` added to the brief, `Status: approved`, `Next step: human` (merge), and my Sessions row.
- `01803c6`: the sweep.
  - Brief deleted.
  - In `tasks.md`, the T-112 entry is deleted, T-115 is added and the sweep line is updated.
  - `PROGRESS.md` has a T-112 entry under Completed tasks.

**PR body rewritten:**
- TL;DR, with no escalation and the CI caveat
- every criterion verbatim, with its verdict and evidence
- review notes
- what I chose not to do
- the sweep contents

**Files**
- /home/user/geo-discovery-zone/backend/README.md (reviewed, not changed by me)
- /home/user/geo-discovery-zone/tasks.md
- /home/user/geo-discovery-zone/PROGRESS.md
- /home/user/geo-discovery-zone/tasks/T-112-backend-readme-known-gaps.md (deleted in the sweep; the review is in `6454e81`)
- /home/user/geo-discovery-zone/runs/T-112-backend-readme-known-gaps.md (the orchestrator's log, left alone)

## Ended — 2026-11-16
Task ended: reviewer approved and marked PR #144 ready, no escalation. Rounds: expander, worker, tester (pass), reviewer. Run limit (1 task) reached; run ends.
