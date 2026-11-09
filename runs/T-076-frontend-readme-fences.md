# T-076 — `frontend/README.md`'s diagram and interfaces lost their layout to prettier — run log

**Task:** T-076 · **Branch:** `task/T-076-frontend-readme-fences` · **PR:** #131
**Started:** 2026-11-09 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-09
`Next step` on entry: `(none — no brief)` → on exit: `worker`

**I expanded T-076 into a brief, pushed it, and opened draft PR #131. It is awaiting approval, and the worker is next.** The task fences four blocks in `frontend/README.md` (the interfaces, the level formula, the loop states and the "9. Screens" diagram) that T-075's prettier commit `6d1b5df` flattened. Each fence holds the original content from `c2c4781`, byte for byte. It is a docs-only change, with 11 criteria in the full template.

- **Branch:** `task/T-076-frontend-readme-fences`, created from `origin/main` at `0b78dec`. The push landed: `origin/task/T-076-frontend-readme-fences` is at `1b60e6c`, the same as my local HEAD.
- **PR:** #131 (https://github.com/Dkaattae/geo-discovery-zone/pull/131), draft. The body is a TL;DR plus the acceptance criteria.
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-076-frontend-readme-fences.md`. Status `awaiting approval`, Next step `worker`, Approved `pending`, PR `#131`, and my row is in the Sessions table.
- **Diff against `main`:** only the brief, in two commits (`T-076 expander: frontend-readme-fences` and `T-076 expander: record PR #131 in the brief`). I did not edit `tasks.md` or `PROGRESS.md`, because `tasks/` on `main` held no brief to sweep.

**Why T-076, in queue order:**

| Task | Picked? | Why |
|---|---|---|
| T-085b | skipped | Blocked until a person picks a Census source (`*.census.gov` is refused by the proxy) |
| T-056 | skipped | Needs a design decision |
| T-095 | skipped | Its entry says it needs a person's call before it is expanded |
| T-105 | skipped | In flight (PR #130) |
| T-046 | skipped | Needs a decision: rename `backend/` or keep it. Earlier runs treated it the same way |
| T-076 | **picked** | No dependencies, no decision needed, no open PR |

**What the brief pins down:**
- **The four blocks:** each is given as a line range in `c2c4781:frontend/README.md`, with a sha256. Each must appear exactly once, fenced, byte-identical, between named neighbouring lines (criteria 1–4).
- **No leftovers or prose changes:** the flattened copies are gone (5), and no prose moved (6).
- **Formatting:** `format:check` exits 0 (7), and `bun run format` leaves the file byte-identical (8). Together these catch a fence tagged `ts`, which prettier would reformat.
- **No escape hatches:** no ignore directive (T-075's criterion 9 already bans it), no prettier config, package or lockfile change, and no dependency (9).
- **No rewrite:** a frontend `bun test` with `node_modules` installed leaves the README clean (10).
- **Diff limits:** nothing changes outside the brief's files (11).
- **One report, not a fix:** the worker must say whether a `bun test` run without `node_modules` rewrites the README, and which test did it. Fixing that is out of scope.
- **Already true:** `format:check` passes on `main` today. Nothing in the task is done yet: the README has no fences at all, and has had no commit since `6d1b5df`.

**Risks for the orchestrator and the person:**
- **Plan to attend the tester step.** The brief, its run log and the README edit will turn question-bank's whole-tree digest pins red by design. Those pins are `climate-cold-trade-accepted-verify.test.ts` criterion 22 and `farm-animal-loose-ends-verify.test.ts` criterion 21. Clearing them needs an attended Test change request (D-14, D-15), so an unattended tester will halt at `test changes requested`.
- **Merge conflict expected with T-105 (PR #130).** It re-pins the same guards, so whichever PR merges second needs its pins rebased.
- **The local clone is now unshallow.** I ran `git fetch --unshallow` to read `6d1b5df^`. That changed git history only, not any tracked file.

## Approval — 2026-11-09
Orchestrator wrote the unattended-run `Approved:` stamp. No human saw the criteria.
