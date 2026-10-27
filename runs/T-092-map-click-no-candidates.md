# T-092 — Stop generating candidates for `map_click` — run log

**Task:** T-092 · **Branch:** `claude/tender-feynman-fv9k0l` · **PR:** #100
**Started:** 2026-10-27 · **Outcome:** halted — test change request, needs an attended tester

## Round 1 — task-expander — 2026-10-27
`Next step` on entry: (no brief) → on exit: `human`

> **I've written the T-092 brief, but it is blocked: a person has to answer Q1 before the criteria can be frozen.** The queue entry asks for no candidates on `map_click` questions and also for an unchanged `content.json`. Both can't be true: 49 of the 50 served `map_click` levels are calculated from the candidates the task removes.
>
> - **Status:** `blocked` · **Next step:** `human` (answer Q1), then `task-expander` to delete the options not chosen and set `awaiting approval` · **Approved:** `pending`
> - **Branch:** `claude/tender-feynman-fv9k0l`, the brief's `Branch:` header. The push landed: `origin/claude/tender-feynman-fv9k0l` is at `5444bdd`.
> - **PR:** #100, a draft against `main` (https://github.com/Dkaattae/geo-discovery-zone/pull/100). Q1 is in its body as well as in the brief.
> - **Brief:** `tasks/T-092-map-click-no-candidates.md`
>
> **Why I picked T-092:** it is the first entry in `tasks.md` whose dependencies are met. I passed over T-070, T-084, T-085, T-088, T-091 and T-056 because each is waiting on a person, and added a "Skipped again, 2026-10-27, for T-092" line to T-084.
>
> **Q1, the conflict:**
> - `seedLevels` adds 0.5 for each distractor that borders the state or shares its region. For `map_click` it finds those distractors through `choiceGeometryIds` (`question-bank/src/seed-level.ts:144`).
> - `level` is served on `map_click` questions (`MAP_CLICK_FIELDS` in `backend/app/content_build.py`).
> - In the committed file, 48 of the 50 `map_click` questions get +1.5 from this, 1 gets +1.0 and 1 gets 0. The child never sees these distractors.
>
> **The options in Q1:**
> - **(a) Keep every level.** The level step still works out the candidates internally and just stops writing them. `content.json` stays byte-identical, but the candidate-picking code keeps running.
> - **(b) Drop the distractor term for `map_click`.** 49 served levels go down. `content.json` changes in `level` only.
> - **(c) As (b), but raise `concept_load["tpl-click-the-map"]` from 0 to 1.5.** Only 2 served levels change.
>
> **The brief:**
> - **Criteria:** 17 in total. Only criteria 8, 9 and 11 depend on the Q1 answer.
> - **Decision record:** criterion 12 puts it in a dated paragraph appended to E-29 rather than a new E-n. That keeps it clear of the guards that pin E-1..E-27 and the heading count of 29.
> - **Already true, not to be rebuilt:** `content_build.py` never serves candidates on `map_click`.
> - **Stale tests:** I listed the likely ones for the worker, including `backend/tests/test_t051_tester_criteria.py:570`. A Test change request is expected, so someone should attend the tester step.
>
> **My commits:** `57a7fdc` (the brief and the `tasks.md` edits) and `5444bdd` (PR number recorded in the brief). They touch only `tasks/` and `tasks.md`, with no source, tests or config. I didn't need to sweep anything, since `tasks/` held no live brief. For the survey I only read the committed JSON with Python; I ran no build, test or pipeline.
>
> **Sessions row:** task-expander, 2026-10-27, `cse_011oDiJe6KxQ3qitLn4NjWjF`. It is marked as spawned by the orchestrator, so the session id is shared.

Gates after return: G1 clean (diff is `tasks.md`, `tasks/T-092-…`). G5 passed (no brief → `Status: blocked`, `Next step: human`). Push confirmed at `5444bdd`.
`Approved:` not stamped — the brief is `blocked`, so the run halts before G2 matters.

Orchestrator note: the header read with `head -20` included the `Fault:` line, which sat inside the first 20 lines on this brief. No role was spawned after it.

## Halted
`Status: blocked`, `Next step: human`. A person must answer **Q1** in the brief: how a `map_click` question's `level` is seeded once it has no distractors — (a) keep candidates internal so every level is unchanged, (b) drop the distractor term (49 levels fall), or (c) drop it and raise `concept_load["tpl-click-the-map"]` to 1.5 (2 levels change). Then restart the `task-expander` to freeze criteria 8, 9, 11 and set `awaiting approval`.

## Resumed — 2026-10-27
The person answered Q1 in the orchestrator's session with the single word: "a".
Recorded verbatim under the Q1 heading in the brief; header set to `Status: Q1 answered`, `Next step: task-expander` (process.md "When a run stops for you", steps 1–3). The orchestrator did not read Q1's body or the criteria.

## Round 2 — task-expander — 2026-10-27
`Next step` on entry: `task-expander` → on exit: `worker`

> **TL;DR:** I rewrote the T-092 brief for the Q1 answer (a). It is now at `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. Commit 7fdbdb0 is on `claude/tender-feynman-fv9k0l`, and I checked that the local HEAD matches the remote. I also updated PR #100's body to the frozen criteria.
> **Needed next:** a human replaces `Approved: pending` in the brief with their name and the date. Only then can the worker start.
>
> **What changed in the brief**
> - **Header:** I removed the `Fault:` line and set Status and Next step as above. I added my row to the Sessions table.
> - **Q1:** this section now records that (a) was chosen and what that means here. The level stage still works out the three nearest candidates internally and counts the near ones, but stops writing them. Levels and `content.json` don't move, and `shortPools` behaves exactly as today. Options (b) and (c) are recorded as not chosen and are out of scope.
> - **Criteria are now 1–18:**
>   - c8: committed `map_click` levels equal the default branch's.
>   - c9: on a synthetic bank, levels equal what the default branch computes, tested with both a non-zero and a zero near-distractor term.
>   - c10: `shortPools` entries for `map_click` match the default branch:
>     - 2 eligible peers give `too_few_candidates`
>     - 3 eligible peers give a question
>     - a state with no centroid of its own gives `no_centroid`
>   - c12: `content.json` is byte-identical to the default branch's.
>   - c13: the dated E-29 paragraph must say levels still count the would-be candidates internally.
>   - c16: `content.json` may not change at all.
>   - The old (b)/(c)-only criterion 9 is deleted.
> - **Constraints:**
>   - `content.json` and `LEVEL_SEED_WEIGHTS` are not to be changed.
>   - New rule: the internally computed candidates must never reach a question object.
>   - The likely-stale tests list now includes any byte or digest pin on `us-states.json`. Plan to attend the tester step.
>
> **Other files**
> - **`tasks.md` T-092:** the heading now reads "brief awaiting approval" and Depends-on records the Q1 answer.
> - **Commit scope:** only `tasks/` and `tasks.md`. `PROGRESS.md` is untouched.

Gates: G5 passed (`Q1 answered` → `awaiting approval`; `task-expander` → `worker`). Push confirmed at `7fdbdb0`.
Orchestrator stamped `Approved: orchestrator — 2026-10-27, unattended run` without reading the criteria.

## Round 3 — worker — 2026-10-27
`Next step` on entry: `worker` → on exit: `tester`

> **TL;DR.** T-092 is built and pushed. `map_click` questions no longer carry `choices`, `correctIndex` or `choiceGeometryIds`. Every level, every `shortPools` entry and `content.json` came out byte-identical, per Q1 = (a). The brief is at Status `awaiting verification`, Next step `tester`. 24 existing tests now fail on purpose: 23 in question-bank, 1 in backend. The question-bank typecheck also fails, in 7 test files. The Handoff lists every one, and the tester will need a human-approved Test change request (D-14) to fix them.
>
> **Push.** Commit `bb2cf42` ("T-092 worker: stop writing candidates for map_click") is on `origin/claude/tender-feynman-fv9k0l`, the branch the brief names.
>
> **What changed**
> - `question-bank/src/distractors.ts`: new exported `clickDistractorsFor` returns the `geometry_id`s of the three peers a click question would have offered, or the `ShortPool`; never writes to a question. A `map_click` draft becomes `{ ...draft }` with no candidate keys. `choices`/`correctIndex` optional on the type; `choiceGeometryIds` gone.
> - `question-bank/src/seed-level.ts`: recomputes a click question's three peers with `clickDistractorsFor` and counts the near ones; throws, naming the question, if the inputs no longer give three peers.
> - `question-bank/data/questions/us-states.json`: regenerated with `write-questions.ts`; idempotent.
> - Comments only in `question-bank/src/question-file.ts` and `backend/app/content_build.py`.
> - `engineering-decisions.md`: E-29 gains a dated T-092 paragraph before the `**Revisit when**` line; the fired trigger removed from that line. E-1..E-28 untouched, no new heading.
> - New worker tests: `question-bank/src/map-click-no-candidates.test.ts`, 8 tests, passing.
>
> **Evidence**
> - Committed file compared with default branch: 415 questions in the same order, 50 click questions lack the three keys and keep every other value (level included), other 365 deep-equal.
> - Synthetic banks (scratch script, not committed): default-branch stages vs new over the committed bank and 300 random sub-banks; `shortPools` and levels matched across 871 synthetic click questions.
> - `make -C backend content` left `content.json` unchanged.
>
> **Suite results**
> - question-bank: 2349 pass, 23 fail (stale by design). Lint/format clean. Typecheck fails only in test files.
> - backend: 738 pass, 1 fail (stale: `test_t051_tester_criteria.py::test_c37_question_file_still_holds_fifty_map_click_with_their_candidates`), 9 skipped. Lint/format clean.
> - frontend: 392 pass, 4 fail, not caused by this change — proxy 403 on `europe-west1-npm.pkg.dev` prevents installing `react-simple-maps` and d3 packages; same with changes stashed; nothing under `frontend/` changed.
>
> **Stale tests:** runtime reds in `distractors-verify.test.ts` (12), `distractors.test.ts` (6), `climate-far-phrases-verify.test.ts` (2), `hand-check-levels-verify.test.ts` (1), `seed-level-verify.test.ts` (1), `t026-tester-verify.test.ts` (1), backend `test_c37`. Typecheck reds in the same files plus `t026-templates.test.ts`, `t026-tester-verify.test.ts`, `climate-far-phrases.test.ts` (not anticipated by the brief's Constraints).
>
> **Decisions for the reviewer:** optional fields instead of a union type; recompute in `seedLevels` (click distractor walk runs twice) to keep T-023's three-parameter pin; the E-29 Revisit line edit; `seedLevels` now throws if entities no longer yield three click peers.
>
> Sessions row: same session id `cse_011oDiJe6KxQ3qitLn4NjWjF` as the expander; noted in the row.

Gates: G5 passed (`awaiting approval` → `awaiting verification`; `worker` → `tester`). Push confirmed at `bb2cf42`. G1 clean.

## Round 4 — tester — 2026-10-27
`Next step` on entry: `tester` → on exit: `human`

> **T-092 is halted at `test changes requested`. All 18 criteria are met as far as I can test them, but 24 existing tests and the typecheck of 7 test files go red because the task removes `map_click` candidates, which is what it set out to do.** I wrote a 31-row Test change request and changed none of those tests. **Next: a person has to approve or refuse the rows in a `tester` session they are attending.**
>
> - Brief header: Status `test changes requested`, Next step `human`, Test changes `requested`, plus a `Fault:` line. Sessions row added.
> - Pushed: commit `cf63f66`; local HEAD equals `origin/claude/tender-feynman-fv9k0l`.
> - Independence: same session id `cse_011oDiJe6KxQ3qitLn4NjWjF` as the worker; freshly spawned context only. The Verdict says so.
>
> **What I tested:** new `question-bank/src/map-click-no-candidates-verify.test.ts`, 76 tests passing (typecheck, lint, prettier clean). Expected values from default branch `5d72ca5` via a temporary worktree (removed), embedded as sha256 digests; 9 synthetic entity banks with literal levels and `shortPools`. Criteria 9 and 10 cover non-zero and zero near-distractor terms and the three `shortPools` cases.
>
> **Mutations:** 18 deliberate breaks, all reverted; 17 turned a test red. One stayed green: skipping the `no_centroid` check in `distractorsFor` (redundant with `nearestDistractors`).
>
> | Suite | Pass | Fail | Notes |
> |---|---|---|---|
> | question-bank `bun test` | 2425 | 23 | all 23 are request rows 1–23 |
> | question-bank typecheck | — | 7 test files | request rows 25–31; source compiles |
> | question-bank lint, format | clean | — | |
> | backend `make test` | 738 | 1 | row 24; 9 skipped; lint and format clean |
> | `make -C backend content` | — | — | leaves `content.json` unchanged |
> | frontend `bun test` | 392 | 4 | proxy 403 on `react-simple-maps` / d3 tarballs; nothing under `frontend/` changed |
>
> **Test change request (31 rows):** every row confirmed independently; worker's stale list complete; no count floor covers these files. Re-pins (rows 19, 20, 23) recomputed from `5d72ca5` and match the worker's. Rows 11 and 18: position floor becomes "at least 20 of 100" (default branch counts 21, 22, 27, 30). One deletion (row 12, the E-21 "parallel list" test); the rest are modifications.
>
> **For the reviewer:** `seedLevels` now throws if inputs no longer give a click question three peers; the worker edited E-29's `Revisit when` line.

Gates: G5 passed (`awaiting verification` → `test changes requested`; `tester` → `human`). Push confirmed at `cf63f66`. G3: 0 fail, 0 blocked.

## Halted — test change request — 2026-10-27
Raised in commit `cf63f66`. The orchestrator has not read the rows and does not approve, stamp or relay an approval (D-15).
To resume: a person starts the `tester` step for T-092 in a session they are attending. It asks about each row, applies what is approved, and finishes verifying. After that, a new run carries on from the header's `Next step`.

## Resumed after attended tester — 2026-10-27
The person said in this session: "ci is fixed. please proceed".
The test change request was handled outside this run, in an attended tester session (`3ca88bf`, `8202f3e`, `baf3ac9`). Header on resume: `Status: pass`, `Next step: reviewer`, `Test changes: approved … (rows 1–32)`. Not read further.
