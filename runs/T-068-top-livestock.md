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
