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

## Round 2 — worker — 2026-10-30
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** T-096 is built and pushed as `49444c8` to `claude/eager-noether-41dajj`. I checked `origin/claude/eager-noether-41dajj -1` after pushing and it shows that commit. Four tests fail on purpose: three pinned digests of `engineering-decisions.md`, all made stale by the E-22 edit. The tester needs to raise one Test change request to re-pin them. The brief is set to Status `awaiting verification`, Next step `tester`.

**What changed**
- **`engineering-decisions.md`**: only the E-22 farm-animal bullet. It now says "one of eleven farm animals a child already knows (E-25 says where they come from)."
- **`question-bank/src/seed-level.ts`**: only the JSDoc above `concept_load`. It now says "eleven animals a child already knows". The weights are untouched.
- **`question-bank/src/distractors.ts`**:
  - The `poolFor` doc comment moved to sit directly above `function poolFor(`.
  - `clickDistractorsFor` now throws an `Error` naming `draft.id` when a pick has no entity (a fixed-pool pick).
  - Entity picks and `ShortPool` results come back exactly as before.
- **`question-bank/src/farm-animal-loose-ends.test.ts`** (new, 6 tests): covers the throw and its message, string-only output over every `map_click` draft in the committed bank, and both `ShortPool` reasons passing through. The throw test fails on main.
- **`tasks/T-096-farm-animal-loose-ends.md`**: Handoff and Notes written, Sessions row added.

**Tests made stale** (left red; the new digest values are in the Handoff)
- `question-bank/src/agriculture-true-wrong-answers-verify.test.ts`, criterion 25: re-pin `MAIN_ED_OUTSIDE_E25_SHA` to `5eded744…151c7`.
- `question-bank/src/map-click-no-candidates-verify.test.ts`, "E-1..E-28 are byte-identical to 6587ed0's…": re-pin to `2ab3d27a…51e0`.
- `backend/tests/test_t089_tester_criteria.py::test_criterion_13_e1_to_e27_are_byte_identical`: set `DECISIONS_ON_MAIN_LEN = 120085` and the digest to `f38eb546…88f0`.

**Suite results on the branch**
- **question-bank:** 2619 pass, 2 fail (the two stale tests above). Main is 2615 pass, 0 fail. Typecheck, lint and `format:check` are clean.
- **backend:** 743 pass, 1 fail (the stale test above), 9 skipped.
- **frontend:** 392 pass, 4 fail, the same on main. The sandbox proxy returns 403 on the `react-simple-maps` download, so three test files can't import it. Nothing under `frontend/` changed.

**Flags, each with an owner**
- **Criterion 14 vs Out of scope:** criterion 14 says every returned element is a string. Out of scope forbids a guard for an entity pick with no `geometry_id`, so that path still uses `as string`. Every committed entity has a `geometry_id`, so criterion 14 holds over the bank. The tester judges it; if it means "for any input", it goes back to `task-expander`.
- **Same session id:** `$CLAUDE_CODE_REMOTE_SESSION_ID` gave the expander's id (`cse_011oDiJfRVR9sPsnPiXjAsMq`) in this worker session too. I recorded it as printed. The orchestrator or a human should confirm the roles are really running in separate sessions.
- **Environment trap:** before `bun install`, `bun run format` and a frontend test run rewrote three existing test files and `frontend/README.md`. I reverted all four and committed none of them. Whoever runs the suites next should run `bun install --frozen-lockfile` first.

Files: `/home/user/geo-discovery-zone/tasks/T-096-farm-animal-loose-ends.md`, `/home/user/geo-discovery-zone/question-bank/src/distractors.ts`, `/home/user/geo-discovery-zone/question-bank/src/seed-level.ts`, `/home/user/geo-discovery-zone/engineering-decisions.md`, `/home/user/geo-discovery-zone/question-bank/src/farm-animal-loose-ends.test.ts`

Orchestrator note: every spawned role shares this session's id (next-task §4, P-14); the tester reports it in its Verdict.
