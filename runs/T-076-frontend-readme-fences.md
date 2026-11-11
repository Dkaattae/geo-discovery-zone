# T-076 — `frontend/README.md`'s diagram and interfaces lost their layout to prettier — run log

**Task:** T-076 · **Branch:** `task/T-076-frontend-readme-fences` · **PR:** #131
**Started:** 2026-11-09 · **Outcome:** halted — needs human (approve amended criterion 6; attended tester to merge main and re-pin)

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

## Round 2 — worker — 2026-11-09
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** I fenced the four flattened blocks in `frontend/README.md`, restored byte-for-byte from `c2c4781`. Prettier 3.9.6 leaves them alone: `format:check` exits 0 and `format` doesn't change the file. The commit is pushed and landed: `origin/task/T-076-frontend-readme-fences` is at `d701d25 T-076 worker: fence the four flattened blocks in frontend/README.md`. The brief is now at Status `awaiting verification`, Next step `tester`, and has my Sessions row, a Handoff and Notes.

The tester needs to deal with three things:
- **Five question-bank tests are red.** All are whole-tree digest pins, and none is a bug. Two were already red from the expander's own commits; three went red because of the README edit. Clearing them needs a Test change request approved in an attended session.
- **Criterion 6 can't pass as literally worded.** It passes on its intended meaning, but the tester has to judge that in the Verdict or send it back to `task-expander`.
- **The full frontend install can't complete here, so the frontend can't be fully verified in this session.**

**The change**
- **Only `frontend/README.md` changed**, apart from the brief. Each of the four flattened ranges is now a ` ```text ` fence holding the original lines.
- **All four blocks match exactly.** Each fenced block's sha256 equals the one in the brief's table.
- **Criteria 1–5, 7, 8, 9 and 11 hold** by my own checks.
- **No dependency or config change**, and no test was edited.

**Criterion 6.** The task side removes every fenced block's content, but the main side removes only the four flattened ranges. So a ` ```sh ` block that was already in the README on main shows up only on main's side, and that is the whole 6-line difference. If main's existing fences are stripped too, the two sequences of lines are identical. I did not touch that `sh` block to make the wording pass.

**Tests made stale** (the Handoff names each test, the cause, and how to re-pin it):
- **Already red before my change:**
  - `question-bank/src/farm-animal-loose-ends-verify.test.ts` (T-096 criterion 21)
  - `question-bank/src/climate-cold-trade-accepted-verify.test.ts` (T-091 criterion 22)
- **Red because of the README change:**
  - `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` (T-088 criterion 21)
  - `question-bank/src/map-click-no-candidates-verify.test.ts` (T-092 criterion 16)
  - `question-bank/src/refresh-regenerate-reminder-verify.test.ts` (T-087 criterion 15)
- The new README sha256 for re-pinning is `fd47a239fe8df2faccb8e0db72c7b060f703cf912b3e43e914f60c9581981dbe`.

**What I ran**

| Suite | Result |
|---|---|
| backend (`uv run pytest -q`) | 1221 passed, 9 skipped |
| question-bank (`bun test`) | 2708 pass, 5 fail (the stale pins above) |
| frontend `format-gate` and `git-baseline-guard` tests | 48/48 pass |
| frontend lint | clean |
| frontend `bun test` | 406 pass, 4 fail |
| frontend typecheck | fails |

- **Why the frontend fails:** the egress proxy refused one package download (`ProxyConnectFailed (403) downloading tarball topojson-client@3.1.0`), so `bun install --frozen-lockfile` stopped partway. `react-simple-maps`, `us-atlas` and `topojson-client` are missing, and those missing modules cause the 4 test failures and the typecheck errors.
- **Criterion 10 is only partly shown:** a full `bun test` left the README unchanged, but on this partial install rather than a complete one.

**Test run without `node_modules`** (the extra observation the brief's Constraints ask for):
- **This task's README was not rewritten.**
- **Main's README is rewritten.** Without `node_modules`, `bun run format` falls back to a global prettier 3.8.1 at `/opt/node22/bin/prettier` instead of the pinned 3.9.6. That version turns `2 * gradeOf` into `2 \* gradeOf`.
- **The test that does it** is `frontend/src/format-gate.criteria.test.ts`, criterion 7 (its writer runs `run("format")`, line 178). Its criterion 5 check then fails.
- **The sweep should add a `tasks.md` entry** naming that test, because the same fallback can still rewrite any other file where the two prettier versions disagree.

**Flags with owners**
- **Criterion 6 wording:** the tester decides on intent in the Verdict, or sends it back to `task-expander` for an amendment and fresh approval.
- **Same session id for expander and worker** (`cse_011oDiJbsZTbExMiPULZMiFd`): that is all the session variable gives in this orchestrated run. The tester should confirm its own id differs, and the orchestrator should note it in the run log.

Files:
- /home/user/geo-discovery-zone/frontend/README.md
- /home/user/geo-discovery-zone/tasks/T-076-frontend-readme-fences.md

## Round 3 — tester — 2026-11-09
`Next step` on entry: `tester` → on exit: `task-expander` (Status: `blocked`, Test changes: `requested`)

**TL;DR: T-076 is blocked, and nothing is wrong with the README.** The worker's fences hold: criteria 1–5, 7, 8, 9 and 11 are met, and 10 is met with partial evidence. Two things stop a pass. **Criterion 6 cannot be met as worded**, so it goes back to the `task-expander`. **Seven question-bank whole-tree pins are stale**, and their Test change request needs a person in an attended tester session.

- **Pushed:** `eb455a6` is on `origin/task/T-076-frontend-readme-fences`. The local and remote heads match and the tree is clean.
- **Brief header:** Status `blocked`, Next step `task-expander`, Test changes `requested`, Fault filled in.
- **Sessions row:** my row is added. Every role in this orchestrated run shares session id `cse_011oDiJbsZTbExMiPULZMiFd`. My independence rests only on being a freshly spawned context, which is weaker than a separate session. The Verdict says so.

**Criterion 6, why it is blocked:**
- **The two sides are stripped differently.** The task side removes every fenced block. The `main` side removes only the four flattened ranges, so it keeps the README's existing six-line `sh` block (lines 325–330 on `main`).
- **The sequences differ by exactly those six lines:** 146 lines on the task side, 152 on `main`. Any README that keeps that block fails.
- **Stripping fences on both sides makes them identical**, but choosing that reading is a criterion change, not mine to make.
- **Suggested fix for the expander:** apply the fence stripping to both files. The worker flagged the same thing.

**Tests added:** `/home/user/geo-discovery-zone/frontend/src/readme-fences.criteria.test.ts`, 14 tests, all passing.
- **Covered:** criteria 1–4 (digests and placement), 5 (42 flattened lines copied by hand from `main`), 7 and 8.
- **Checked by hand instead:** criteria 6, 9 (files unchanged from `main`), 10 and 11. Asserting them in a test would mean resolving a git revision, which the repo's guard forbids.
- **Mutations:** I made nine to the README. Each one turned the tests for its criterion red, and each was reverted; `cmp` confirms the README is back to its pushed bytes.

**Whole suites:**

| Suite | Result | Cause of failures |
|---|---|---|
| frontend | 420 pass, 4 fail | All "Cannot find package 'react-simple-maps'" |
| question-bank | 2707 pass, 6 fail | All whole-tree pins |
| backend | 1221 passed, 9 skipped; ruff clean | none |

- **Frontend extras:** lint is clean and format:check passes. Typecheck has 9 errors, all from the same missing package.
- **Why the package is missing:** `bun install --frozen-lockfile` gets a 403 from the proxy on some tarballs, so the install is partial.
- **CI on the worker's commit `cd8af2b`:** the frontend job passed with a full install. The question-bank job failed.

**The Test change request has 7 rows.**
- **What they change:**
  - **Rows 1–3** re-pin the frontend tree digests in the agriculture, map-click and refresh tests.
  - **Rows 4–5** add the README, the brief and the run log to the allowed sets in the farm-animal and climate-cold tests (counts 282 → 281 and 285 → 284).
  - **Row 6** raises the climate-cold count of existing test files from 127 to 128, because my test file now counts.
  - **Row 7** updates the stored file digests in the climate-cold test.
- **Beyond the worker's list:** the worker's 5 are confirmed. Row 6 appears once my test file is tracked, and row 7 follows from applying rows 1, 2 and 4.
- **Dry run:** applying rows 1–6 left only row 7 red. I reverted it with `git checkout -- question-bank/src`. The values are recorded in the rows, but they move if T-105 (PR #130) merges first.

**Order for the next steps:**
1. The `task-expander` amends criterion 6 and gets it re-approved.
2. A tester in a session a person is attending asks the person to approve the 7 rows, applies them, and finishes verifying.

Brief: `/home/user/geo-discovery-zone/tasks/T-076-frontend-readme-fences.md` (Verdict and Test change request sections).

## Halted — Status: blocked, with a test change request — 2026-11-09
Raised at commit `eb455a6`. Header: `Status: blocked`, `Next step: task-expander`, `Test changes: requested`.
`Status: blocked` is an orchestrator halt condition, so the orchestrator did not spawn the expander. The test change request also needs an attended tester (D-15). A person decides how to resume: spawn the `task-expander` to amend criterion 6 and approve the amendment, then attend the `tester` step for the 7 rows.

## Run ended — 2026-11-09
Task limit (2) reached; both tasks ended halted (T-105 on a test change request, T-076 blocked).

## Resumed — 2026-11-11
A person told the orchestrator: "proceed with t-076 criterion 6". The branch head had moved to `edf2831`: an attended tester applied the approved test change request (`687ba8a`) and recorded it (`edf2831`). Header on resume: `Status: blocked`, `Next step: task-expander`, `Test changes: approved — Dkaattae, 2026-11-11`. The person's instruction is the authority for leaving the `blocked` halt; the orchestrator spawns the `task-expander` that `Next step` names.

## Round 4 — task-expander — 2026-11-11
`Next step` on entry: `task-expander` → on exit: `tester` (Status: `awaiting approval`, Approved: `pending`)

I reworded T-076's criterion 6 so it can be met, and pushed it. The brief now needs a fresh approval before the tester re-checks criterion 6. Separately, T-105 has merged to `main`, and this branch now has merge conflicts in two pinned question-bank tests. Fixing those needs a person.

- **Header:** `Status: awaiting approval`, `Next step: tester`, `Approved: pending`. I reset `Approved` because the 2026-11-09 orchestrator stamp covered the old wording.
- **Pushed:** commit `946c74a` on `task/T-076-frontend-readme-fences`. I fetched afterwards and the remote branch is at the same commit.
- **PR #131:** its body now carries the new criterion 6, marked as amended and awaiting fresh approval. It is still a draft.

**What changed in criterion 6**
- **Old wording:** fence lines and fenced content were stripped from the task's README only. So `main`'s existing ` ```sh ` setup block was kept on the `main` side alone, and no correct README could pass. The worker and the tester both flagged this.
- **New wording:** remove the four flattened ranges from `main`'s README (at `0b78dec`; the file is the same at `35eefd3`). Then strip fence lines, fenced content and blank lines from both files. The two results must be identical. The ` ```sh ` block must still not be removed, moved or edited.
- **Nothing else changed:** the other criteria and their numbers, Out of scope and Constraints are as they were. I added an amendment note under the criteria.
- **No further README edit should be needed:** the tester's Verdict says the two files match once both sides are stripped the same way. So the next role is the tester re-checking criterion 6 by hand, not the worker.

**Needs a person: conflicts with `main`**
- **Cause:** T-105 (PR #130) merged to `main` as `35eefd3` and moved the same whole-tree pins this branch re-pinned.
- **Conflicting files:** `git merge-tree` reports content conflicts in `question-bank/src/climate-cold-trade-accepted-verify.test.ts` and `question-bank/src/farm-animal-loose-ends-verify.test.ts`.
- **What it takes:** bringing `main` in and re-pinning changes existing tests. That needs a new Test change request, approved by a person in an attended tester session (D-14, D-15). My role may not touch tests. This is written into the brief's Fault line and Notes.
- **Criteria 1–6 are not affected:** `frontend/README.md` is identical at `0b78dec` and `35eefd3`.

The commit touches only the brief, and I did not run any build or test suite.

Brief: /home/user/geo-discovery-zone/tasks/T-076-frontend-readme-fences.md

## Halted — amended criterion awaiting approval — 2026-11-11
The orchestrator did not stamp `Approved:`. The person was told the amended criterion would come back to them for approval, so it is theirs to give. The next tester also has to merge `main` and re-pin under a new test change request, which needs an attended session (D-15).
