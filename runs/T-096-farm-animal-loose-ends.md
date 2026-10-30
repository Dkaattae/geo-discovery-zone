# T-096 — T-088's loose ends: "six farm animals" in E-22 and `seed-level.ts`, and two comments in `distractors.ts` — run log

**Task:** T-096 · **Branch:** `claude/eager-noether-41dajj` · **PR:** #110
**Started:** 2026-10-30 · **Outcome:** in progress

## Preflight — 2026-10-30
Branch at `origin/main` (`85612ed`), no live brief in `tasks/`, branch not yet on the remote. G1 trivially clean.

## Round 1 — task-expander — 2026-10-30
`Next step` on entry: `(no brief)` → on exit: `worker`

I picked T-096 from the queue and wrote its brief. The brief is pushed and draft PR #110 is open on `claude/eager-noether-41dajj`. Status is `awaiting approval`, Next step is `worker`, and Approved is `pending`, so a person has to approve before the worker starts.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-096-farm-animal-loose-ends.md
- **Branch header:** `claude/eager-noether-41dajj`, the branch I was assigned.
- **PR:** #110, draft, base `main`. Its body holds the acceptance criteria. https://github.com/Dkaattae/geo-discovery-zone/pull/110
- **Push landed:** `git log origin/claude/eager-noether-41dajj -1` shows `cc9a0f8 T-096 expander: record PR #110 in the brief`.
- **Files changed:** only `tasks.md` (T-096 set from `todo` to `doing`) and the new brief. Nothing outside what the expander may write.
- **Sessions row:** task-expander, 2026-10-30, `cse_011oDiJfRVR9sPsnPiXjAsMq`.
- **Commits:** `T-096 expander: farm-animal-loose-ends`, then `T-096 expander: record PR #110 in the brief`.

**Why T-096:**
- §A of the queue is empty.
- T-085b, the only §C task, is blocked until someone can reach a Census release.
- T-096 is the first §D entry and depends on nothing.

**What the brief asks for** (23 criteria):
- **Farm-animal count:** E-22's `tpl-farm-animal-of` bullet and the `concept_load` comment in `seed-level.ts` stop saying "six". If they state a count, it is eleven: the six animals states list in `top_livestock`, plus the five in `ADDED_FARM_ANIMALS`. I counted these by reading the committed data.
- **Comment move:** in `distractors.ts`, the misplaced JSDoc goes from above `type Pick` to above `poolFor`.
- **Guard:** `clickDistractorsFor` throws an `Error` whose message contains `draft.id` when it gets a fixed-pool pick. Its output is otherwise unchanged.
- **Nothing else moves:** the levels, `LEVEL_SEED_WEIGHTS`, everything outside E-22's body, the bank files, `content.json` and the dependencies all stay as they are on main (`85612ed`).

**For whoever runs this next:**
- **Approval:** a person has to replace `Approved: pending` with their name and the date.
- **Attend the tester step:** a small Test change request is likely. E-22 sits outside the part of `engineering-decisions.md` that `agriculture-true-wrong-answers-verify.test.ts` excludes from its digest (`MAIN_ED_OUTSIDE_E25_SHA`), so editing E-22 should turn that test red. Other tests that pin `distractors.ts` or `seed-level.ts` may go red too; the brief lists the likely ones.
- **Worker model:** Sonnet is enough, as noted in the brief.

## Approval — 2026-10-30
Unattended run: orchestrator stamps `Approved:` per `orchestrator.md` "Approval". No human saw the criteria.
