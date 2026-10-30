# T-096 — T-088's loose ends: "six farm animals" in E-22 and `seed-level.ts`, and two comments in `distractors.ts`

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-10-30, unattended run. See `runs/T-096-farm-animal-loose-ends.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-096
**Branch:** `claude/eager-noether-41dajj`
**PR:** #110, opened draft at expand time against the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-30 | cse_011oDiJfRVR9sPsnPiXjAsMq |

**Worker model:** Sonnet is enough. Two comment fixes, two doc rewordings and a
one-line guard; no data, no level, no question moves.

**Plan to attend the tester step.** Editing E-22 changes
`engineering-decisions.md` outside E-25, and at least one guard pins that by
digest (`agriculture-true-wrong-answers-verify.test.ts`,
`MAIN_ED_OUTSIDE_E25_SHA`). Editing `distractors.ts` and `seed-level.ts` may
turn source pins red too. A small Test change request is likely (D-14, D-15).

## Goal

T-088 (PR #109) grew the farm-animal wrong-answer pool from six animals to
eleven, but E-22 and `seed-level.ts` still justify `concept_load` 1 with "six
farm animals". Two `distractors.ts` details are also off: a doc comment sits
above the wrong declaration, and `clickDistractorsFor` would silently emit
`undefined` if a fixed-pool pick ever reached it. Fix the record and make the
assumption fail loudly.

## Acceptance criteria

**Frozen once approved.** **Main** means `85612ed`, the default branch this task
starts from. **The eleven animals** are the six that some committed state lists
in `top_livestock` (`cattle`, `chickens`, `dairy cows`, `pigs`, `sheep`,
`turkeys`) plus the five in `ADDED_FARM_ANIMALS` (`goats`, `horses`, `ducks`,
`rabbits`, `bison`). **The E-22 bullet** is the bullet in
`engineering-decisions.md` §E-22 whose first line starts
`` - `"tpl-farm-animal-of": 1` ``, through the line before the next blank line.

### The farm-animal count

1. The E-22 bullet still exists inside E-22 (between the `## E-22 ` and
   `## E-23 ` headings), and still starts `` - `"tpl-farm-animal-of": 1` ``.
2. The E-22 bullet contains neither the word `six` nor the digit `6`
   (case-insensitive, whole word / whole number).
3. If the E-22 bullet states how many farm animals the choices come from, that
   number is `eleven` or `11`. Stating no count is also a pass; any other count
   is a fail.
4. The `concept_load` doc comment in `question-bank/src/seed-level.ts` (the
   JSDoc immediately above `concept_load: {`) does not say the farm-animal
   choices come from six animals: it contains no match for
   `/six\s+(farm\s+)?animals/i`. Its phrase "six T-026 entries", which counts
   templates, may stay.
5. If that comment states how many animals the farm-animal choices come from,
   the number is `eleven` or `11`.
6. Outside `runs/`, `tasks/`, `tasks.md`, `PROGRESS.md` and test files
   (`*.test.ts`, `test_*.py`), no tracked file contains `six farm animals` or
   `only six animals`, case-insensitive, after collapsing runs of whitespace
   (including line breaks) to one space.

### Nothing about levels changes

7. `LEVEL_SEED_WEIGHTS` deep-equals main's, so
   `concept_load["tpl-farm-animal-of"]` is still `1`.
8. E-22's `concept_load: { … }` line in its constant block is byte-identical to
   main's.
9. `engineering-decisions.md` outside E-22's body (everything before the
   `## E-22 ` heading line, that heading line, and everything from the
   `## E-23 ` heading on) is byte-identical to main's. No `## E-n` heading is
   added, removed or renamed.

### `distractors.ts` comments

10. In `question-bank/src/distractors.ts`, the JSDoc whose text is "The
    fixed-pool candidates a strategy offers after its entity candidates." ends
    on the line immediately before the `function poolFor(` declaration line.
    (Its wording may change only to stay accurate; it must still describe what
    `poolFor` returns.)
11. The declaration `type Pick = Candidate | PoolCandidate;` is preceded by
    exactly one JSDoc block, ending on the line immediately before it, and that
    block describes `Pick` (a wrong answer from an entity or from a fixed pool),
    not `poolFor`. No two JSDoc blocks are adjacent with no declaration between
    them anywhere in the region from `interface PoolCandidate` to
    `function poolFor`.

### `clickDistractorsFor` enforces its assumption

12. `clickDistractorsFor(draft, own, template, entities)` throws an `Error` when
    the picks it would map include a fixed-pool pick (one with no entity). A
    tester can reach this by passing a template whose `distractor_strategy` is
    `livestock_not_raised` with an entity set small or narrow enough that
    `ADDED_FARM_ANIMALS` entries are picked. It must not return in that case.
13. The thrown error's message contains `draft.id`.
14. When `clickDistractorsFor` returns an array, every element is a string —
    never `undefined`, `null`, or a non-string.
15. When every pick has an entity, `clickDistractorsFor`'s return is unchanged
    from main's: the picks' `geometry_id`s, in the same order. Observed at
    least over every `map_click` draft of the committed bank, compared with
    main's result for the same inputs.
16. A `ShortPool` result from the underlying pick is still returned as-is (not
    thrown, not converted).

### The bank does not move

17. `question-bank/data/questions/us-states.json` is byte-identical to main's.
18. Every file under `question-bank/data/us-states/` is byte-identical to main's.
19. `backend/app/data/content.json` is byte-identical to main's.

### Boundaries

20. No dependency is added or changed: every `package.json`, `bun.lock`,
    `backend/pyproject.toml` and `backend/uv.lock` is byte-identical to main's.
21. The branch's diff against main touches only: `engineering-decisions.md`,
    `question-bank/src/seed-level.ts`, `question-bank/src/distractors.ts`, new
    test files, pre-existing test files changed only through an approved Test
    change request row, and this brief (plus the reviewer's sweep of
    `tasks.md` / `PROGRESS.md`). Nothing under `frontend/`, `backend/app/`,
    `.github/` or `openapi.yaml`.
22. No test reaches the network.
23. The whole suites are green: `cd question-bank && bun test`, its typecheck,
    lint and `format:check`; `make -C backend test`; `cd frontend && bun test`.

## Out of scope

- **Re-judging `concept_load["tpl-farm-animal-of"]`.** It stays 1. Whether
  eleven animals still justify it is a separate call (the queue entry says so).
- **Any other E-n entry.** E-25 already records the five added animals; leave
  it alone.
- **`clickDistractorsFor` with an entity pick whose `geometry_id` is missing.**
  Behaviour there is unspecified by this task; do not add a second guard.
- **Any change to which wrong answers are picked**, the also-raised lists
  (`ALSO_RAISED`, `ALSO_GROWN`) or `ADDED_FARM_ANIMALS`, and the USDA NASS
  check E-25 leaves open.
- **The bank-pin consolidation** of T-095, and anything in T-085b, T-087, T-091.
- `PROGRESS.md` line 384's mention of "the stale 'six farm animals' wording":
  it is a log of T-088 and the reviewer's sweep handles it.

## Constraints

- Files expected to change: `engineering-decisions.md` (E-22 bullet only),
  `question-bank/src/seed-level.ts` (the `concept_load` comment only),
  `question-bank/src/distractors.ts` (the comment move, and the guard in
  `clickDistractorsFor`), plus new tests.
- **Expected stale tests**, for the worker's Handoff and the tester's Test
  change request — candidates, not a complete list; the worker runs the suite
  and names what actually goes red:
  - `question-bank/src/agriculture-true-wrong-answers-verify.test.ts`
    `MAIN_ED_OUTSIDE_E25_SHA` (E-22 is outside E-25), and its
    `MAIN_FILE_SHA` map if it covers either source file.
  - Any guard hashing `distractors.ts` or `seed-level.ts` whole, or listing
    their lines (`hand-check-levels-verify.test.ts` criteria 10–11,
    `climate-far-phrases-verify.test.ts`, `map-click-no-candidates-verify.test.ts`,
    `familiarity-drawn-apart-verify.test.ts`, `seed-level-loose-ends-verify.test.ts`).
  - Guards that hash E-22's body.
- The worker never modifies a pre-existing test; it lists them under **Tests
  made stale**. The bank must not move (criteria 17–19), so no bank digest
  should need re-pinning; if one does, that is a finding, not a Test change
  request.
- Dependencies: none (`CLAUDE.md`, "Packages").
- `bun` only in `question-bank/`; `uv` in `backend/`.

## Context

- Queue entry: [`tasks.md`](../tasks.md) T-096.
- `engineering-decisions.md` §E-22, "The six T-026 templates (2026-10-20,
  T-026)" paragraph and its bullets (the farm-animal bullet is at about line
  1135 on main); §E-25, "Amended 2026-10-29 (T-088)", "Five added farm
  animals" bullet, for where the eleven come from.
- `question-bank/src/seed-level.ts` — `LEVEL_SEED_WEIGHTS.concept_load` and the
  JSDoc above it (about lines 48–64).
- `question-bank/src/distractors.ts` — `ADDED_FARM_ANIMALS` (about line 198),
  `PoolCandidate`, the misplaced comment, `type Pick` and `poolFor` (about lines
  463–482), `clickDistractorsFor` and its comment (about lines 665–683),
  `distractorsFor` (what it returns: `Pick[]` or a `ShortPool`).
- `question-bank/data/us-states/*.json` `top_livestock` — the six state-listed
  animals.
- [`test-guidelines.md`](../test-guidelines.md) — call pure functions directly;
  no seam is needed here.
- `process-decisions.md` D-14 for the Test change request route.

## Handoff

## Verdict

## Notes

- **Already true on main (expander survey, by reading only):** the pool is
  eleven distinct strings — six from the committed entities' `top_livestock`
  plus the five `ADDED_FARM_ANIMALS`. `concept_load["tpl-farm-animal-of"]` is 1.
  Nothing else in the repo outside logs says "six farm animals".
- **"six" elsewhere in E-22 is legitimate** — "the six T-026 templates", "All
  six have `base_difficulty` 2", "the six questions whose level changed". The
  criteria scope the ban to the farm-animal bullet for that reason.
- **PR:** #110, opened draft at expand time from branch
  `claude/eager-noether-41dajj`.
