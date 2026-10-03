# T-068 — US livestock/poultry per state, separate from crops — run log

**Task:** T-068 · **Branch:** `claude/next-task-queue-3ynpc7` · **PR:** #69
**Started:** 2026-10-03 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-03
`Next step` on entry: (no brief) → on exit: `worker` (Status `awaiting approval`, Approved `pending`)

I wrote the brief for **T-068 (`top_livestock`)** and opened draft PR #69. It needs a human to approve it before the worker runs: `Status: awaiting approval`, `Next step: worker`, `Approved: pending`.

- **Brief:** `/home/user/geo-discovery-zone/tasks/T-068-top-livestock.md`
- **Branch: header:** `claude/next-task-queue-3ynpc7`. This is the branch the harness assigned this session; it was cut from `origin/main` at `ed22980`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/69 (draft, against `main`). The PR body carries the acceptance criteria.
- **Push confirmed:** `origin/claude/next-task-queue-3ynpc7` is at `7d695e0`. My two commits change only `tasks/T-068-top-livestock.md` and `tasks.md` (T-068 set to `doing`).

**Why T-068:** `tasks/` was empty and section A of `tasks.md` has nothing queued. T-064 is the first entry in section B, but it depends on T-040, which has not run. T-068 is the next entry, and it has no dependencies.

**Three calls the brief makes that the approver should check** (listed in the brief and the PR body):
- **Field name:** `top_livestock` in the pipeline and on the backend model, `topLivestock` in `openapi.yaml`, matching `top_crops` / `topCrops`.
- **Where it shows up:** in `openapi.yaml` and the backend `Entity` model now. No question template uses it yet; templates come with T-020/T-026.
- **What counts as livestock:** cattle, dairy, poultry, eggs, hogs, sheep and goats. Farm-raised fish (catfish) and horses are excluded.

**What the brief contains:**
- **26 testable criteria:** the data's shape, where it comes from, nothing else in the bank changing, the contract and backend model, a new E-18 entry in `engineering-decisions.md`, no new dependency and no network in tests.
- **A review checklist for a person:** the criteria can't tell whether the picks are right, so a human checks the content.

**Expect a stop at the tester for a test change request.** Adding the key to all 50 files will turn these existing tests red on purpose (T-070 has not run):
- the four tests that compare the bank against pinned checksums, in `landmarks-verify`, `climate-kid-verify`, `top-crops-verify` and `highest-point-verify`
- the five tests that compare tracked Colorado with the copy in `sample-data/`

The brief tells the worker to list these under "Tests made stale" rather than edit them. The tester then raises the request and a person approves it.

The queue sizes T-068 as S, but the full brief was required because it touches `openapi.yaml` and text children will read.

## Approval — 2026-10-03
The orchestrator's unattended-approval stamp was refused by the harness's permission classifier. Dkaattae was present in the session and approved in chat ("Approve"); recorded as a human approval in `d52e10a`. Status → `approved`, Next step → `worker`.
