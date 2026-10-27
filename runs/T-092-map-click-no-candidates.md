# T-092 — Stop generating candidates for `map_click` — run log

**Task:** T-092 · **Branch:** `claude/tender-feynman-fv9k0l` · **PR:** #100
**Started:** 2026-10-27 · **Outcome:** halted — needs human

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
