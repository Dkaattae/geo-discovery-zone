# T-070 — Re-pin the digest guards, and let them survive a refresh — run log

**Task:** T-070 · **Branch:** `claude/charming-pascal-jqpxd3` · **PR:** #103
**Started:** 2026-10-28 · **Outcome:** ready for merge (approved, escalated on diff size)

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

## Round 2 — worker — 2026-10-28
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR.** I've done the worker step for T-070 and pushed it to `claude/charming-pascal-jqpxd3` (`origin/claude/charming-pascal-jqpxd3` shows `4ee772f`). Brief: Status `awaiting verification`, Next step `tester`. Most of the task is still to do. It is 57 changes to existing tests (W1–W57 in the Handoff), which only the tester may make, so **expect the tester to halt at `test changes requested` / `human`**. Two tests are red at the branch head, both by design and both listed (W45, W53).

**Brief and branch.** Approved by the orchestrator (unattended run), which is a valid stamp, so I started. The branch was on the remote and was the one I was standing on. R is `b0ee336`, and the branch has not been rebased.

**What I changed** (no existing test edited, per D-14):
- **`/home/user/geo-discovery-zone/engineering-decisions.md`**: added E-30 and nothing else. It covers criteria 17–22.
- **`/home/user/geo-discovery-zone/question-bank/src/bank-pins.ts`** (new, imported only by tests):
  - `bankFileDigest` removes `sources.built_at` and nothing else, and throws if it is missing.
  - `BANK_DIGESTS` holds all 51 bank files as they stood at `b0ee336`, computed with `git show`.
- **`/home/user/geo-discovery-zone/question-bank/src/bank-pins.test.ts`** (new, 64 tests): a whole-file guard on all 51 bank files.
  - It stays green when only `built_at` moves.
  - It goes red on every mutation listed in criterion 5 (checked in memory).
  - It is green on both simulated refreshes, S(t₁) and S(t₂).
- **`/home/user/geo-discovery-zone/tasks/T-070-repin-digest-guards.md`**: Sessions row, Handoff, Notes, Status, Next step.

**What I measured:**
- **At the branch head:**
  - `question-bank` `bun test`: 2512 pass, 1 fail (W45: the T-092 test expecting 29 `E-n` headings; E-30 makes 30).
  - Backend: 738 pass, 1 fail (W53: the T-089 test asserting `range(1, 30)`).
  - Typecheck, lint and format checks are clean.
- **Simulated refresh at R:**
  - Both instants give the same **120 question-bank failures**, mapped to W rows in the Handoff.
  - On S(t₁) the backend has 4 failures. None of them is a pinned guard.
- **Frontend could not be verified here.** `node_modules` is missing because the sandbox proxy refuses `europe-west1-npm.pkg.dev` (403). The suite gives 5 failures and 4 errors, all missing modules or tooling. This task touches nothing under `frontend/`. One of those tests rewrote `frontend/README.md` during the run; I reverted it and did not commit it.

**Flags for a person (each has an owner in the Handoff):**
- **F1, criterion 11.** Four backend tests compare `content.json` with a fresh build, and those go red on S(t₁) because `_source.extractedAt` follows the bank's `built_at` date. They are W54–W57: `test_content_build.py`, two in `test_t040_*` and one in `test_t051_*`. The inventory missed them. The proposal is to stop comparing `extractedAt` in those four tests. The tester raises the rows and Dkaattae approves them; if he refuses, criterion 11 can't be met without touching `backend/app/`, and the brief goes back to the expander.
- **F2, what criterion 4 counts as an "exclusion".** My working line: a filter added on a later task's behalf is a neutralisation. A guard pinning a named slice from its own criterion is not. Read literally, criterion 4 would also catch about six of those slices. The tester picks a reading and a person settles it row by row.
- **F3.** For the tests that pin a literal `built_at`, I propose modifying them rather than deleting them. Deleting them would also force re-pinning the test-count floors in four files.
- **F4.** W30 (`highest-point-metres-verify`) becomes trivial once its baseline is R. The tester decides between modify and delete.

**Note on sessions.** The worker and the expander share one remote session id (`cse_011oDiJcaEvyueGBAthPSQu3`), because the orchestrator spawned both inside one session. The tester still needs a fresh session.

## Round 3 — tester — 2026-10-28
`Next step` on entry: `tester` → on exit: `human`

**T-070 is halted at `test changes requested` / `human`, as its brief predicted.** The worker's part holds up under independent checks. Everything else in the task means editing existing tests, and a person has to approve each of those edits in a tester session they attend (D-15). I raised 58 rows for that and edited no existing test and no source file. Pushed `21de0e4` to `claude/charming-pascal-jqpxd3`; the remote head matches local.

**Independence:** this is an orchestrated run, so my session id (`cse_011oDiJcaEvyueGBAthPSQu3`) is the same as the worker's and the expander's. That match proves nothing either way. My independence rests only on being a freshly spawned subagent with its own context. I could not check that myself, and the Verdict says so.

**Brief changes:** `/home/user/geo-discovery-zone/tasks/T-070-repin-digest-guards.md`
- **Header:** Status `test changes requested`, Next step `human`, Test changes `requested`, Fault filled in, tester Sessions row added.
- **New sections:** `## Verdict` and `## Test change request` (rows W1–W57, with W10 split into W10a and W10b).

**What I checked myself:**

| Criteria | Result |
|---|---|
| 17–22 (E-30) | Met. It is the only new entry, and the diff removes no lines from any other entry. |
| 7 (pin values) | `BANK_DIGESTS` matches R for all 51 files. I recomputed them in Python from `git show b0ee336:…`, removing only `sources.built_at`. |
| 5 | Met by the new guard. I made each of the 9 edits in the real tree, one line each and reverted after each; every one turned `bank-pins.test.ts` red. |
| 6 | Not met yet. Changing IL `top_crops` alone leaves the T-013 c9, T-014 c15 and T-015 c13 whole-file guards green. W3, W6 and W11 close that gap. |
| 9, 10 | Not met yet. With my own S(t₁) and S(t₂) script on fresh worktrees, both give the same 121 failures: the Handoff's 120 plus W45. |
| 11 | Not met yet. The backend on S(t₁) fails 5: W53 plus W54–W57. |
| 23, 24 | Hold. |
| 25 | Red, as expected. `question-bank` fails only W45 and is clean on typecheck, lint and format; the backend fails only W53. The frontend has 4 failures and 4 errors, all `Cannot find package 'react-simple-maps'` from a sandbox missing that package. Nothing under `frontend/` changed, but that part of the criterion is **unverified** here. |

**Decisions waiting on a person:**
- **The 58 rows:** approve or refuse each one in an attended `tester` session. Apply W39 last, after the two floor rows: it pins a digest over the test files the other rows edit.
- **W54–W57 (F1):** these loosen four backend drift checks by ignoring `_source.extractedAt`, so a stale date in `content.json` would pass. Without them criterion 11 cannot pass, because criterion 23 forbids touching `backend/app/`. If they are refused, the brief goes back to `task-expander`.
- **F2 (what counts as an "exclusion" in criterion 4):** I used the narrow reading. An exclusion is a filter or strip added later on another task's behalf. A slice that the guard's own criterion names, such as "E-1..E-28", is not one. The literal wording also allows a strict reading, which would add rows for those slice pins. The person decides.
- **Also in the Verdict:** literal-`built_at` tests modified rather than deleted (F3), W30 kept as a modify (F4), W19 classed as (ii). The landmarks-verify floor goes from 35/69 to 34/65 in two files (W10a, W10b).

I did not compute the new values for W29, W38–W42, W44 or W53; the tester that applies the rows does that. Every mutation was reverted and both worktrees removed, and `git status` is clean.

## Halted — test change request — 2026-10-28
Raised by commit `21de0e4` (header: `Test changes: requested`, `Status: test changes requested`, `Next step: human`). Rows not copied here; the orchestrator has not read them.

What a person has to do: start the `tester` step for T-070 in a session they are attending. It will ask about each row, apply what is approved, and finish verifying. The orchestrator cannot take the approval.

## Attended tester — outside this run — 2026-10-29
Not spawned by the orchestrator. Header after it: `Test changes: approved — Dkaattae, 2026-10-29`, `Status: pass`, `Next step: reviewer`. Commits `83aadd6` (apply approved test change request), `a0a516e` (verdict pass). Its result was not returned to the orchestrator and is not copied here.

## Resumed — 2026-10-29
Dkaattae, in the orchestrator's session: "ci is fixed, please proceed". Gates G0–G4 re-run on `a0a516e`: one role (`reviewer`), G1 clean, approved, verdicts 0 fail / 0 blocked, branch matches header.

## Round 4 — reviewer — 2026-10-29
`Next step` on entry: `reviewer` → on exit: `human` (merge decision on PR #103)

**T-070 is approved and escalated.** PR #103 is marked ready for review but not merged. I escalated it for one reason: the diff is too large to hold at once (about 1,280 lines deleted across 20 test files). Everything else is inside the envelope. The sweep is pushed to `claude/charming-pascal-jqpxd3` and the remote head is `fe69192`, so the push landed.

**Next step: `human`.** Dkaattae makes the merge decision on PR #103 and should read the escalation note at the top of the PR body first.

**Review**
- **Every role's work is in the PR.** Expander (`f0d2cab`, `ad0b117`), worker (`4ee772f`), tester (`21de0e4`) and attended tester (`83aadd6`, `a0a516e`) all have commits.
- **Each role stayed in its lane.**
  - The expander touched only `tasks/` and `tasks.md`.
  - The worker edited no existing test.
  - The tester touched only test files and the brief.
  - `0068552` (T-095, added at Dkaattae's request) touches only `tasks.md`.
- **The test changes match what was approved.** Dkaattae approved all 58 rows in an attended session, and the header names a person, not `orchestrator`. All the edits to pre-existing tests are in `83aadd6` and match the rows. There are 22 deletions, all class (i) or (ii).
- **I re-ran the suites with the proxies dead.**
  - `question-bank`: `bun test` 2491 pass, 0 fail; typecheck and lint clean.
  - Backend: 739 passed, 9 skipped.
  - Frontend: could not run here because `react-simple-maps` is missing from the sandbox, so CI's frontend job is the only check on it.

**Findings.** None blocks; each went into a task that already owns the area:
1. **Four backend drift tests no longer compare `_source.extractedAt`** (rows W54–W57), so a stale date in `content.json` would pass. I amended **T-087** to restore the comparison.
2. **The bank is pinned in four places besides `BANK_DIGESTS`.** Two helpers are also copied between files: `fixtureBuiltAt` into 7 and `_without_extracted_at` into 3. I amended **T-095**, because re-pinning after a refresh has to cover all of them.
3. **Row W42 now pins the whole decisions log**, so every new `E-n` turns three pins red. I added this as the fifth instance on **P-17** in `process-tasks.md`.

Flags F1–F4 were all already settled, F1 and F2 by Dkaattae, and I agree with each.

**Sweep**
- **Commit order:** in `2f8bb3d` I added a `## Review` section, my Sessions row and `Status: approved, escalated` to the brief, so they stay in git history. `fe69192` then deleted the brief.
- **`tasks.md`:** removed the T-070 entry. T-084 is unblocked, its stale fixture-pin notes are rewritten, and its 13-line skip log is folded into one paragraph. T-087 and T-095 are amended, and the sweep log line is added.
- **`PROGRESS.md`:** added the T-070 Completed entry and updated two Known-gaps lines (the refresh gate now points at T-095, plus a note on the `extractedAt` change).

**PR #103:** the body now has the escalation note at the top, the criteria verbatim, what verified each, and what was not done. I posted a review comment, and the PR is marked ready, not merged.

CI was still running on the earlier head when I checked. Only the backend job had finished, and it passed. I did not see results for `fe69192`.

## Ended — 2026-10-29
Reviewer marked PR #103 ready and escalated it (diff size). The run stops here. Merging is Dkaattae's (D-4).
