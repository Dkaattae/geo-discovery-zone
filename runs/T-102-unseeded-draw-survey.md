# T-102 — Other backend tests may assert on an unseeded draw — run log

**Task:** T-102 · **Branch:** `claude/fervent-ptolemy-4py2eg` · **PR:** #126
**Started:** 2026-11-06 · **Outcome:** in progress (resumed after attended tester)

## Round 1 — task-expander — 2026-11-06
`Next step` on entry: `(none — no brief)` → on exit: `worker`

I expanded T-102 into a brief and opened draft PR #126 (https://github.com/Dkaattae/geo-discovery-zone/pull/126). Status is `awaiting approval`, Next step is `worker`, Approved is `pending`, so a person has to approve the brief before the worker starts.

**What got picked:** T-102, "Other backend tests may assert on an unseeded draw" (§E, size S).

- **Skipped T-085b:** it needs a reachable Census release, or a person choosing another source.
- **Skipped T-056:** it waits on a design decision.
- **Skipped T-095:** its question needs a person's answer before it can be expanded.
- **Open PRs:** the only one was #38, which is P-4, a process ticket. Nothing was in flight.

**The brief:** `/home/user/geo-discovery-zone/tasks/T-102-unseeded-draw-survey.md`
- **Branch:** `claude/fervent-ptolemy-4py2eg`, written into the `Branch:` header.
- **Commits:** two, both pushed (`T-102 expander: unseeded-draw-survey`, then the PR number). The local branch matches origin, and the diff against `origin/main` is only the brief file.
- **Sessions row:** task-expander, 2026-11-06, `cse_011oDiJbsZTbExMiPULZMiFd`.
- **Format:** full brief, not the light path, because it has 10 criteria.

**Criteria, in short:**
- **1–3, the survey:** the worker's Handoff has a table of every `backend/tests/` test that serves a question through the API and asserts on what was drawn. Each row is classed `pinned (fixed_draw)`, `pinned (force)`, `holds under any draw` or `needs pin`. The tester checks the table is complete with its own survey. A "holds under any draw" row must give a reason that is certain, not "it passed N times".
- **4–5, pinning:** no row is left at `needs pin`. Each is pinned through a Test change request a person approves, and pinning keeps every assertion the test made.
- **6, perturbed-draw check:** every test file containing `/sessions` must pass 20 runs, seeds 0–9 times the candidate order as returned or reversed. The perturbation must not replace `pick_question`.
- **7–10, things that must not change:** `backend/app/` stays as it is, T-101's `fixed_draw` (seed 101) and its three tests stay as they are, no new dependency, and all three unit suites pass with no network.

**Already true when I surveyed (`a7945cf`):**
- **T-101 pins three tests** with `fixed_draw`.
- **Three test files already force their draw:** `test_t051_tester_criteria.py`, `test_t093_tester_criteria.py` and `test_t093_undo_places_seen.py` install their own picker.
- **Root cause:** `store.candidate_questions` has no `ORDER BY`, so the draw depends on row order as well as on unseeded module `random`.
- **Untested by me:** I ran nothing, as the expander role requires, so I make no claim about which tests actually fail.

**What a person needs to do:**
- **Approve the brief** by filling in its `Approved:` line.
- **Attend the tester step if the survey finds a test that needs pinning.** Changing an existing test needs a person's approval in the tester's session, so an unattended run will stop at `test changes requested` / `human`.

## Approval — 2026-11-06
Orchestrator wrote the unattended-run `Approved:` stamp. No human saw the criteria.

## Round 2 — worker — 2026-11-06
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR.** The survey found no test that needs a pin, so I changed no code or tests. The brief is filled in and pushed as `3f17a70` to `claude/fervent-ptolemy-4py2eg`; `git log origin/claude/fervent-ptolemy-4py2eg -1` shows that commit. Status is now `awaiting verification`, Next step `tester`. **The tester step needs a human present:** two question-bank count tests are already failing on this branch and can only be fixed through a change request a person approves.

**Survey result (criteria 1–4)**
- **84 test functions** make a router serve and assert on something the draw could affect:
  - 3 `pinned (fixed_draw)`: the three T-101 tests.
  - 25 `pinned (force)`.
  - 56 `holds under any draw`.
  - **0 `needs pin`**, so no existing test file changes.
- **Each "holds" row argues from the pool, never from pass counts.** I checked nine facts about the 415-question bank (B1–B9) and six about selection (S1–S6). For example, every question can be answered right or wrong on purpose, and the demo profile's review pool is only Texas's 9 questions.
- **The two "keep serving until a `map_click` appears" loops are certain, not likely.** At most 50 fresh `map_identify` serves plus the review slots fit inside the limit: 58 against 59 in `test_t051_map_click`, and 64 against 99 in `test_t053` c14.
- **Excluded tests are listed one per line:** 7 that serve but assert only things the draw cannot change, and 6 that never serve.

**Tests made stale: 2, already failing before my commit**
- **Which:**
  - `question-bank/src/farm-animal-loose-ends-verify.test.ts`, T-096 criterion 21: expects 283, gets 285.
  - `question-bank/src/climate-cold-trade-accepted-verify.test.ts`, T-091 criterion 22: `MAIN_UNTOUCHABLE_COUNT` is 286, gets 288.
- **Cause:** the expander's `runs/T-102-…` and `tasks/T-102-…` files, which these tests count. I confirmed both fail at `93b1c4a`, before my edit.
- **Proposed fix:** re-pin both counts. The tester raises the Test change request and Dkaattae approves it.

**Things I found that the tester needs**
- **A trap in criterion 6's check.** `test_t093_tester_criteria.py` c5 and c7 call `monkeypatch.undo()` (lines 258 and 412). That removes `force`, so their review rounds use the real picker; I classed them `holds under any draw`. It also silently switches off any perturbation the check installs through the test's own `monkeypatch`. My first version did exactly that. The Handoff gives a version that uses its own `pytest.MonkeyPatch()`.
- **Same session id as the expander.** The orchestrator ran both in `cse_011oDiJbsZTbExMiPULZMiFd`, so the tester must run in a different session.

**What I ran (a cross-check only; the tester must run its own)**
- **Criterion 6 check:** 20 of 20 runs passed, 374 tests each. I also ran 4 extra runs with `random.choice` forced to always take the first or the last member; all passed.
- **Backend:** `make -C backend check` gave 1039 passed, 9 skipped.
- **question-bank:** `bun test` gave 2711 pass and 2 fail, the two stale pins above.
- **Frontend: could not run fully.** `bun install` gets a 403 on packages `bun.lock` pins to a private registry (`lovable-core-prod`), so `react-simple-maps` is missing. No frontend file differs from main.
- **A test run edited `frontend/README.md` once.** One line came out as if `prettier --write` had run on it. I reverted it and it did not happen again. Whether to queue it is the reviewer's call.

Brief: /home/user/geo-discovery-zone/tasks/T-102-unseeded-draw-survey.md

## Round 3 — tester — 2026-11-06
`Next step` on entry: `tester` → on exit: `human`

**T-102 tester: stopped at `test changes requested` / `human`. Three stale question-bank pins need a person's approval before I can give a verdict.** Criteria 1–9 are verified and pass. Criterion 10 is held up only by the 3 pins named in the brief's Test change request. Nothing was approved and no test was changed. Pushed as `e447605` to `claude/fervent-ptolemy-4py2eg`, and `origin` matches.

**Independence:** this run was orchestrated, so my session id (`cse_011oDiJbsZTbExMiPULZMiFd`) is the same as the expander's and the worker's. My only independence is being a freshly spawned subagent that never saw the worker's context. That is weaker than running in a separate session, and the Verdict says so.

| # | Result | Evidence |
|---|---|---|
| 1–4 | met | My own survey, run with a throwaway plugin on the full backend suite, found 91 test functions that make router serves. That matches the worker's 84 table rows plus 7 exclusions exactly. 2 other tests (the t051 `c13` pair) call `candidate_questions` directly and are rightly left out. Every `pinned` row made 0 unpinned picks. I re-derived every "holds under any draw" argument from the code and the bank, so none rests on a pass count, and none needs a pin. |
| 5 | n/a | Nothing was pinned. |
| 6 | met | 20 of 20 runs passed (seeds 0–9, store order and reversed), 374 tests each, 0 failures, 0 errors. My probe sets `random.seed` at the start of each test body and swaps in the reversed order as a plain module attribute, so `monkeypatch.undo()` cannot remove it. `pick_question` is never replaced. Three extra adversarial runs (always first, always last, avoid `map_click`) also passed. |
| 7–9 | met | `backend/` diff against `origin/main` is empty, `FIXED_DRAW_SEED = 101` is unchanged, and no dependencies changed. |
| 10 | waiting on approval | **Backend:** `make -C backend check` gives 1039 passed, 9 skipped. **question-bank:** 2711 pass, 2 fail, both stale pins. **Frontend:** here, 9 tests fail because `react-simple-maps` is missing locally, but CI is green on `1c4995e`. |

**The Test change request (3 modify rows):**
- **Rows 1–2:** add `tasks/T-102-…` and `runs/T-102-…` to the allowed sets in T-096 criterion 21 and T-091 criterion 22. The counts (283, 286) and digests stay as they are, which is the precedent from T-091 row 5 through T-101.
- **Row 3:** re-pin the farm-animal file's entry in `APPLIED_REQUEST_FILE_SHAS`, which row 1 breaks.
- **Why not the worker's fix:** re-pinning the counts to 285 and 288 would go red again once the sweep deletes the brief.
- **Trial:** I applied rows 1–3 in a throwaway worktree, since removed. The question-bank suite gave 2713 pass, 0 fail.

**What a human needs to do:** start the `tester` step for T-102 in a session you are attending and approve or refuse each row there. That tester applies the approved rows, re-runs all three suites and writes the final verdict. If all three rows are approved, I expect a `pass`.

Brief: /home/user/geo-discovery-zone/tasks/T-102-unseeded-draw-survey.md

## Halted — test change request — 2026-11-06
Raised at commit `e447605`. Header: `Test changes: requested`, `Status: test changes requested`, `Next step: human`.
A person must start the `tester` step for T-102 in a session they are attending and approve or refuse each row there. The orchestrator cannot take the approval (D-15).

## Resumed — 2026-11-06
A person told the orchestrator: "pr 126 ci is fixed please proceed". The branch head had moved to `e52b7d7`: an attended tester applied the approved test change request (`ee83a62`) and recorded a verdict (`e52b7d7`). Header on resume: `Status: pass`, `Next step: reviewer`, `Test changes: approved — Dkaattae, 2026-11-06`.
