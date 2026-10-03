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

## Round 2 — worker — 2026-10-03
`Next step` on entry: `worker` (Status `approved`) → on exit: `tester` (Status `awaiting verification`)

**`top_livestock` is built and pushed, and T-068 is ready for the tester. The suite has 14 red tests, all expected from adding the new key, and all listed in the brief.** Commit `d00a85f` is on `origin/claude/next-task-queue-3ynpc7`, the brief's `Branch:` header; I confirmed it with `git log origin/... -1`. The brief now reads Status `awaiting verification`, Next step `tester`.

**What changed**
- **Pipeline:** the field is added to `question-bank/src/types.ts`, `question-bank/src/curated/us-states.ts` and `question-bank/src/normalize.ts` (`curated.top_livestock ?? []`). The curated file also gets the T-068 note on where the values come from, at the top.
- **Data:** I regenerated all 50 `question-bank/data/us-states/us-state-*.json` files with an offline rebuild. The diff only adds lines, and `index.json` is unchanged.
- **Contract and backend:** `topLivestock` is added to `openapi.yaml` and `top_livestock` to `backend/app/models.py`.
- **Decision record:** E-18 is appended to `engineering-decisions.md`, with no edits to earlier entries.
- **Picks:** 24 states have values and 26 are blank.

| Value | States |
|---|---|
| `chickens` | AL, AR, DE, GA, MD, MS |
| `cattle` | AZ, CO, KS, MT, NE, OK, SD, TX |
| `dairy cows` | CA, ID, NY, PA, VT, WI |
| `pigs` | IA |
| `turkeys` | MN |
| `pigs`, `turkeys` | NC |
| `cattle`, `sheep` | WY |

**Checks run**
- **Shape and "nothing else moved" (criteria 1–9, 12):** a one-off script I did not commit found 0 violations across the 50 files. The list of blank states matches the one in E-18.
- **Rebuild repeatability (criterion 11):** two offline rebuilds with the network blocked both came out byte-identical to the tracked files.
- **Frozen files (13–15, 24):** `index.json`, `sample-data/`, `content.json`, both lockfiles, `package.json` and `pyproject.toml` are byte-identical to the base commit.
- **Suites:**
  - **Typecheck, lint, format check:** all clean.
  - **Backend suite:** 525 passed and 9 skipped, also with the network blocked.
  - **`question-bank`:** 1384 passed and 14 failed. The 14 failures are the stale tests below.

**The 14 stale tests** are each listed in the brief's Handoff with a one-line fix that removes only `top_livestock`:
- 6 pinned-digest checks: one each in `top-crops-verify`, `landmarks-verify` and `climate-kid-verify`, and three in `highest-point-verify`.
- 5 tests comparing the tracked Colorado file to `sample-data/us-state-co.json`, which the brief freezes.
- 3 lists of allowed keys, in `landmarks`, `state-animals` and `climate-kid`.

The brief's Constraints predicted most of these, but not the three key lists or two of the `highest-point-verify` tests. Nothing is deleted, so no test-count limit moves.

**Flags, each with an owner**
- **`beef` can never be used under criterion 6.** Criterion 7 bans the substring `bee`, so "beef cattle" would fail; I wrote `cattle` instead. The expander should know this if the criteria are reused.
- **My Sessions row has the same session id as the expander's.** This orchestrated run shares one web session. The tester should judge whether that breaks the rule that roles run in separate sessions.
- **Close calls for the human reviewer:** CO and AZ `cattle`, ID `dairy cows`, MS `chickens`, NC `turkeys` and WY `sheep`, plus the deliberate blanks (FL and MO cattle, OH and IN eggs, VA poultry).
- **PR note:** the reviewer should say on the PR that this adds a fifth exception to the digest checks rather than re-pinning them, which T-070 owns.
- **Setup:** `question-bank/node_modules` was missing at the start. `bun install --frozen-lockfile` fixed it without changing the lockfile.

The brief is at `/home/user/geo-discovery-zone/tasks/T-068-top-livestock.md`.

## Round 3 — tester — 2026-10-03
`Next step` on entry: `tester` (Status `awaiting verification`) → on exit: `human` (Status `test changes requested`, Test changes `requested`)

**T-068 tester: no final verdict yet. The task is waiting for a person to approve test changes.** Status is `test changes requested` and Next step is `human`. 25 of the 26 criteria hold. Criterion 16 is still open because the four guards it names are among the 14 tests that went stale. **Next:** Dkaattae starts a `tester` in a session they are attending and approves or refuses the 14 rows there. That tester applies the approved rows, checks criterion 16 by mutation and writes the final verdict. Under D-15 the orchestrator must not approve or relay this.

**Pushed:** commit `27afd58` on `claude/next-task-queue-3ynpc7` (the brief's `Branch:` header, and the branch I was on). `origin` is at the same SHA.

**Independence (stated in the Verdict as well):** this is an orchestrated run. The session id `cse_018ET4S26HVxh9FbiQMgTU3y` is the same one listed for the expander and the worker, so the Sessions check proves nothing here. My only independence is being a freshly spawned subagent that did not see the work being done. That is weaker evidence than a separate session would be.

**Tests added:**
- `/home/user/geo-discovery-zone/question-bank/src/top-livestock-verify.test.ts`: 21 tests covering criteria 1–11, 20, 21 and 23.
- `/home/user/geo-discovery-zone/backend/tests/test_top_livestock_t068_criteria.py`: 12 tests covering criteria 17–19.

**Criteria compared against the base commit were checked once, not pinned.** Criteria 12–15, 22 and 24 compare files to `ed229805`. Pinning those bytes in a test would repeat the expiring-baseline pattern that E-11 and E-12 removed and T-070 is retiring. I followed the T-067 precedent: checked them once in a full clone and recorded the results in the Verdict. All six hold:
- **Criterion 12:** all 50 files, with `top_livestock` removed, deep-equal the base versions, `built_at` included.
- **Criteria 13–15 and 24:** `git diff --quiet ed229805` reports no difference for each of those paths.
- **Criterion 22:** the base `engineering-decisions.md` is a byte-for-byte prefix of the current file, followed directly by E-18.

**Suites, run with all six proxy variables pointed at `127.0.0.1:1`:**

| Check | Result |
|---|---|
| question-bank `bun test` | 1405 pass, 14 fail (only the 14 stale tests) |
| typecheck, lint, format:check | green |
| backend `make test` | 537 passed, 9 skipped |
| backend lint, format-check | green |

**Mutation results:** every mutation turned the matching test red, and every one was reverted.
- **Pipeline:** I removed the `?? []` fold, pointed the fold at `top_crops`, and edited the curated table and data files to add catfish, horses, corn, duplicates, upper-case and padded strings, a third item, an emptied DE or WI, and a removed AK key. I also dropped NV from E-18's list and reworded the header comment.
- **Backend:** I deleted the field, made it required, widened its type to `list[str] | str` (this one survived at first, so I added a test that rejects a bare string), and renamed `topLivestock` in the contract.

**The 14 stale tests are stale, not a sign of broken code.** With `top_livestock` stripped from all 50 files in the working tree, none of the 14 failed. The worker's list was complete. All 14 rows in the request are "modify": no test is deleted and no count floor changes. The rows are in `## Test change request` in `/home/user/geo-discovery-zone/tasks/T-068-top-livestock.md`.

**Not a block:** the worker is right that `beef` can never satisfy criterion 6, because criterion 7 bans the substring `bee`. The criteria can still be met. The expander should know this if the criteria are ever reused.

## Halted — test change request — 2026-10-03
Raised in commit `27afd58`. Header: `Status: test changes requested`, `Next step: human`, `Test changes: requested`. Rows not read by the orchestrator.

To resume: Dkaattae starts the `tester` step for T-068 in a session they are attending; it asks about each row, applies what is approved, and finishes verifying. The orchestrator cannot take the approval (D-15).

## Resumed — attended tester — 2026-10-03
Outside this run, an attended `tester` applied the approved test change request (`e1f2689`) and wrote the final verdict (`a3491a1`). Header on resume: `Status: pass`, `Next step: reviewer`, `Test changes: approved — Dkaattae, 2026-10-03`. CI on `a3491a1`: all 7 check runs green. Dkaattae asked the orchestrator to continue ("Ci should be fixed. Keep going").
