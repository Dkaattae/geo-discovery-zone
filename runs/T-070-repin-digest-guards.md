# T-070 — Re-pin the digest guards, and let them survive a refresh — run log

**Task:** T-070 · **Branch:** `claude/charming-pascal-jqpxd3` · **PR:** #103
**Started:** 2026-10-28 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-28
`Next step` on entry: `none (no brief)` → on exit: `worker`

The T-070 brief is written and pushed, and draft PR #103 is open. Status is `awaiting approval`, next step `worker`, and approval is still `pending`.

**Expect a halt later, not now:** this task is mostly edits to tests that already exist. The worker may not make those edits (D-14), so the tester will raise a Test change request. An unattended run will stop at `test changes requested` / `human`, and a person needs to attend the tester step.

**Why T-070:** it is the first task in `tasks.md` whose dependencies are done. Section A is empty, and Dkaattae answered Q1 on 2026-10-27: re-pin every guard, and survive a refresh that moves only `built_at` and the fixtures. `tasks/` was empty when I started, so there was nothing to sweep.

**What the brief requires (25 criteria):**
- **Exceptions gone:** the tables that put old elevations back are deleted. No guard strips or resets bank fields before hashing, or strips `map_click` fields from questions. The only allowed exclusion is `sources.built_at`.
- **Guards still catch changes:** nine named single-field mutations must each turn a guard red. That closes the blind spot where three guards could not see a `top_crops` change.
- **Re-pinned to one base:** every pin equals the default branch at the branch base (`b0ee336`), or the branch head for files this task edits itself. Pins whose value changes are labelled with that commit.
- **Survives a refresh:** with `captured_at` and `built_at` moved to `2027-01-01T00:00:00Z`, and separately to one second after today's instant, the full question-bank suite passes. The backend suite passes at the first instant. No test pins fixture bytes or a literal `built_at`.
- **Deletions limited:** a test may be deleted only if it is one of four named kinds. Anything else is re-pinned.
- **Stale names:** two leftover names in `highest-point-verify.test.ts` are fixed.
- **Decision recorded:** one new entry, `E-30`, records the decision and the rule for later tasks.
- **Limits:** nothing changes outside tests and `engineering-decisions.md`, no new dependency, and every suite, typecheck, lint and format check passes with the network blocked.

The brief also has a 17-row list of guards found by the survey, with the commit each is pinned to and what it currently strips or restores. It may be incomplete; the brief's definition of a pinned guard decides scope, not the list.

**For whoever approves — not a blocker, but it may undercut the goal:** a real `bun run refresh` only writes when some bank field other than `built_at` moved; otherwise it exits 2 and writes nothing (`src/refresh.ts:12-20`). So after this task the re-pinned bank guards will still go red on every real refresh PR. Following Q1's wording, I left this out of scope and wrote it in the brief's Notes and the PR body. A follow-on task is needed if the monthly refresh is meant to open green PRs.

**Commits:**
- `f0d2cab` adds the brief and changes one line of `tasks.md` (T-070 marked `doing`).
- `ad0b117` records PR #103 in the brief.

Only `tasks/` and `tasks.md` changed. `PROGRESS.md` is untouched. I ran no build, test or pipeline. The local and remote heads match at `ad0b1178`.
