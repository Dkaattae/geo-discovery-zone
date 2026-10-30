# T-096 — T-088's loose ends: "six farm animals" in E-22 and `seed-level.ts`, and two comments in `distractors.ts` — run log

**Task:** T-096 · **Branch:** `claude/eager-noether-41dajj` · **PR:** #110
**Started:** 2026-10-30 · **Outcome:** ready for merge

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

## Round 3 — tester — 2026-10-30
`Next step` on entry: `tester` → on exit: `human`

**TL;DR:** T-096 is halted on a Test change request. The code meets all 23 criteria. Criterion 23 (whole suites green) is red only because of 3 old digest pins that went stale on purpose, and a person has to approve changing them. The brief now reads Status `test changes requested`, Next step `human`, Test changes `requested`. The work is pushed to `claude/eager-noether-41dajj` at `47581ea`, and the remote branch matches.

**Independence:** this is an orchestrated run (`runs/T-096-farm-animal-loose-ends.md` exists). The session id is `cse_011oDiJfRVR9sPsnPiXjAsMq`, the same id already listed for task-expander and worker. So the id check proves nothing and did not pass. My independence rests only on being a freshly spawned subagent with its own context, which depends on the orchestrator having spawned me correctly.

**What I did**
- **New test file:** `/home/user/geo-discovery-zone/question-bank/src/farm-animal-loose-ends-verify.test.ts`, 25 tests, all green. Main's state was computed in a temporary worktree of `85612ed` and stored as fixed values and sha256 digests, because CI checks out shallow and cannot read main. The worktree has been removed.
- **Strongest check (criteria 12–15):** I ran `clickDistractorsFor` over the whole committed bank, every template and every draft. On main, 8 farm-animal drafts returned `undefined` in their array (CA, IA, MN, NC, OK, PA, SD, TX). On the branch, exactly those 8 throw an `Error` naming the draft id. The other 410 results, and the 50 `map_click` drafts, match main's results exactly.
- **Brief** (`/home/user/geo-discovery-zone/tasks/T-096-farm-animal-loose-ends.md`): I wrote the Verdict and the Test change request, updated the header, Fault and Status, and added my Sessions row with the shared-id caveat.

**Suites**
| Suite | Result | Why |
|---|---|---|
| question-bank `bun test` | 2644 pass / 2 fail | Both failures are stale pins (rows 1–2 below) |
| question-bank typecheck, lint, `format:check` | clean | — |
| `make -C backend test` | 743 pass / 1 fail / 9 skipped | The failure is a stale pin (row 3) |
| frontend `bun test` | 392 pass / 4 fail | `react-simple-maps` cannot be installed in this sandbox. Same result on main, and nothing under `frontend/` changed, so CI decides this one |

All three stale pins pass on main and fail only on the branch.

**Mutations:** each one was reverted, and `git status` was clean afterwards.
- Changing "eleven" to "six" or another number in the E-22 bullet or in `seed-level.ts` turned criteria 2–6 red.
- Moving the JSDoc back turned 10–11 red.
- Disabling the guard turned 12–14 red, and changing the message to use `draft.entityId` turned 12–13 red.
- Reversing the order of the picks turned 15 red.
- Throwing a ShortPool instead of returning it turned 16 red.
- Changing the farm-animal weight to 2 turned 7 red; editing E-22's weights line turned 8 red; editing the E-24 heading turned 9 red.
- Appending one byte to `openapi.yaml`, an entity file, `content.json` or `package.json` turned 18–21 red.

**Test change request** (all three rows are modify, and all are pending a person's decision)
1. `question-bank/src/agriculture-true-wrong-answers-verify.test.ts`, the T-088 criterion 25 test: `MAIN_ED_OUTSIDE_E25_SHA` becomes `5eded744…151c7`.
2. `question-bank/src/map-click-no-candidates-verify.test.ts`, the T-092 criterion 13 E-1..E-28 test: the digest becomes `2ab3d27a…e0`, and the test name changes to say `49444c8`.
3. `backend/tests/test_t089_tester_criteria.py` `test_criterion_13_e1_to_e27_are_byte_identical`: `DECISIONS_ON_MAIN` becomes `f38eb546…f0`, `DECISIONS_ON_MAIN_LEN` becomes `120085`.

I computed these digests myself, and they match the worker's Handoff. No pre-existing test was touched.

**Two readings I chose, recorded in the Verdict**
- **Criterion 21:** the branch also changes `runs/T-096…` and flips `tasks.md` from todo to doing. I treated both as the loop's records rather than the task's work, and exempted them in the test.
- **Criterion 14:** I tested it over the committed bank and real subsets of it. An entity with no `geometry_id` would still give `undefined`, but Out of scope leaves that case unspecified, so I did not block on it.

**Needed next:** a person starts a `tester` in a session they are attending, approves or refuses rows 1–3, and that tester applies the approved rows and gives the final verdict.

## Halted — test change request — 2026-10-30
Raised by `47581ea` (T-096 tester). Header: `Test changes: requested`, `Status: test changes requested`, `Next step: human`. Per D-15 the orchestrator does not approve, stamp or relay it. A person resumes it by starting the `tester` step for T-096 in a session they are attending.

## Resumed — 2026-10-30
Dkaattae, in the orchestrator's session: "ci is fixed you can proceed". The attended tester had pushed `c5e0064` (apply approved test change request) and `3912701` (verdict pass). Header on resume: `Status: pass`, `Next step: reviewer`, `Test changes: approved — Dkaattae, 2026-10-30`. Orchestrator did not take the approval; it was given in the tester's session.

## Round 4 — reviewer — 2026-10-30
`Next step` on entry: `reviewer` → on exit: brief deleted by sweep (`48fe8b1`); PR #110 marked ready.

**TL;DR:** I approved T-096. PR #110 is marked **ready for review** with no escalation note, so it is routine. It is **not merged**: the merge is Dkaattae's. The sweep is in the PR as `48fe8b1`, pushed to `claude/eager-noether-41dajj`, and the remote head matches. All 7 CI checks on `48fe8b1` are green.

**Review**
- **Diff:** small and fits the code around it.
  - **E-22 bullet and `seed-level.ts` JSDoc:** "six" became "eleven".
  - **`distractors.ts`:** the `poolFor` JSDoc moved onto `poolFor`, and `clickDistractorsFor` now throws an `Error` naming `draft.id` when a pick has no entity.
- **The new comment is true:** it says the guard never fires on the committed bank. The only caller, `seed-level.ts` `distractorEntities`, calls it only for `map_click` questions.
- **Every role's work is in the PR:** expander, worker and tester each have commits. Each commit stays in its lane: the expander touched only `tasks.md` and the brief, the tester touched only tests and the brief, and there was no `ci-fix`.
- **Inside the envelope:**
  - The three pre-existing tests that changed are `engineering-decisions.md` digest re-pins. Dkaattae approved them as a person in an attended session.
  - No dependency was added.
  - Nothing touched `openapi.yaml`, a migration or the plan.
  - No text a child reads changed.
- **Flags settled:**
  - **Criterion 14 vs Out of scope:** decided here, no task needed.
  - **Shared session id:** P-14 already owns it.
  - **Tester exempting `runs/` and the `tasks.md` status flip from criterion 21:** agreed.

**Non-blocking finding, for a person:**
- **What it is:** the tester's criterion 21 test in `question-bank/src/farm-animal-loose-ends-verify.test.ts` (`MAIN_UNTOUCHABLE_SHA`) is one digest over 298 tracked files. Almost any later task will turn it red. That is the P-17 pattern again.
- **Why I did not record it:** the pinned files include `process-tasks.md`, so adding this to P-17 from this PR would have turned the pin red. I reverted that edit.
- **What to do:** paste the P-17 "sixth instance" text from the PR body into `process-tasks.md` by hand.

**Sweep (`48fe8b1`)**
- Deleted the brief `tasks/T-096-farm-animal-loose-ends.md`, so there is no `## Review` section or Sessions row in it. The review record is in the PR body.
- Removed T-096's entry from `/home/user/geo-discovery-zone/tasks.md` and added a sweep note.
- Logged T-096 in `/home/user/geo-discovery-zone/PROGRESS.md` and updated the T-088 follow-on line.
- No other queue entry moved.

**Suites at `48fe8b1`**
- **question-bank:** 2646 pass / 0 fail; typecheck, lint and format:check clean.
- **backend:** 744 passed / 9 skipped.
- **frontend:** not run locally, because the sandbox cannot install `react-simple-maps`. The frontend CI job is green.

**PR body:** rewritten through the REST API. It carries the TL;DR, the review, the test changes, the evidence for each criterion and the acceptance criteria verbatim. `gh pr edit` and `gh pr ready` failed because GraphQL is blocked here, so I used `PATCH /pulls/110` and the CCR `ready_for_review` route. Afterwards the PR showed `draft: false`, `state: open`, `merged: false`.

## Ended — 2026-10-30
Reviewer approved and marked PR #110 ready. Run over; merge is Dkaattae's.
