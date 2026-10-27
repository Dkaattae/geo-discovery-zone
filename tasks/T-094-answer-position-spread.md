# T-094 — Answer-position spread is checked again for every template that has a position

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-10-27, unattended run. See `runs/T-094-answer-position-spread.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-094
**Branch:** `claude/modest-bell-3vg6ok`
**PR:** #101, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-27 | cse_011oDiJdmgY3R4p3uHw5DgmH |

## Goal

T-092's approved test changes narrowed the "every answer position 0..3 occurs for
every template" check to `tpl-identify-on-map` and `tpl-capital-of`, so the six
T-026 templates lost it as a side effect. Put it back as a new test, so a change
that makes a template's answer position predictable (a child learning "the
answer is never D for crops") goes red. This is a test-only task: no source,
data or existing test changes.

## What is already true (survey, 2026-10-27)

- **Nine templates** in `TEMPLATES` (`question-bank/src/templates.ts:194-296`).
  Eight carry a `correctIndex`: `tpl-identify-on-map` (`map_identify`) and seven
  `multiple_choice` templates — `tpl-capital-of`, `tpl-biggest-state`,
  `tpl-state-animal-of`, `tpl-landmark-in`, `tpl-climate-of`, `tpl-crop-of`,
  `tpl-farm-animal-of`. The ninth, `tpl-click-the-map` (`map_click`), has no
  `correctIndex` since T-092 (E-29).
- **Questions per template** in the committed question file
  (`question-bank/data/questions/us-states.json`, 415 total): 50 each for
  identify, capital, click, state-animal, climate, crop; 47 biggest-state;
  44 landmark; **24 farm-animal** (the smallest).
- **The position** comes from `correctIndexFor(draftId)` in
  `question-bank/src/distractors.ts:279`, a hash of the draft id (E-21).
- **The two person-approved tests stay as they are**:
  `distractors.test.ts` › "over the committed bank" › "criterion 15: every
  position used at least 20 times and once per template", and
  `distractors-verify.test.ts` › "T-022 criterion 15: position not predictable
  from the format". Both are scoped to identify and capital.
- **Nothing else checks this**: `t026-tester-verify.test.ts`,
  `t026-templates.test.ts` and `map-click-no-candidates-verify.test.ts` check
  `choices[correctIndex] === answer` per question, never the spread of
  positions over a template.
- The expander did not run the suite or compute the current spread (D-7).
  Whether the eight templates cover all four positions today is for the worker
  to find out (see criterion 4).

## Acceptance criteria

"The questions" below means the output of `buildChoices(generate(entities,
TEMPLATES).drafts, entities, TEMPLATES)` over the committed entity bank in
`question-bank/data/us-states/` — the same path the committed question file is
rendered from (`question-file.test.ts` holds the two equal). "A positioned
template" means an entry of `TEMPLATES` whose `format` is not `map_click`.

1. **A new test exists** under `question-bank/src/`, in a new file, that for every
   positioned template and every index 0, 1, 2 and 3 asserts that at least one of
   that template's questions has `correctIndex` equal to that index. Exactly one
   question at an index passes; zero fails.
2. **The set of templates it checks is derived from `TEMPLATES` by format, not
   written out by id.** Today that set is the eight templates listed in the
   survey above. A template added to `TEMPLATES` with a format other than
   `map_click` is checked without editing the test; `tpl-click-the-map` is
   excluded only because its format is `map_click`.
3. **The test also asserts the derived set is not empty and contains all eight
   ids named in the survey**, so a mistaken filter (e.g. one that matches
   nothing, or only `multiple_choice`, dropping `tpl-identify-on-map`) fails
   rather than passing vacuously.
4. **The test passes against the current source and committed bank.** If it does
   not — some positioned template genuinely never puts its answer at some
   index — the worker does **not** change source, data or the test's
   assertion to make it green. It records the template and index in the Handoff,
   sets `Status: blocked`, `Next step: human`, and stops: that is a content
   defect needing a person's decision, not a test to adjust.
5. **Red when one T-026 template loses one position.** With the source
   temporarily mutated so that, for exactly one of `tpl-biggest-state`,
   `tpl-state-animal-of`, `tpl-landmark-in`, `tpl-climate-of`, `tpl-crop-of` or
   `tpl-farm-animal-of`, no question has `correctIndex` 3 (every other template
   unchanged), the new test fails. This must hold for each of the six, one at a
   time.
6. **Red when an original positioned template loses one position.** The same
   mutation applied to `tpl-identify-on-map` alone, and separately to
   `tpl-capital-of` alone, also fails the new test.
7. **Red for any missing index, not only 3.** The mutation in criterion 5
   applied to `tpl-farm-animal-of` with index 0 missing instead of 3 fails the
   new test.
8. **Red when a positioned template yields no questions at all.** If a template
   whose format is not `map_click` produces zero questions over the bank (for
   example a copy of `tpl-capital-of` with a new id and a field no entity has),
   the new test fails for that template rather than skipping it.
9. **The failure names what is missing.** When it fails, the test output contains
   the template id and the missing index (both, as text), so a reader does not
   have to rerun anything to know which template and which position.
10. **`map_click` does not break it.** The test passes with `tpl-click-the-map`
    present in `TEMPLATES` and its 50 questions carrying no `correctIndex`; it
    neither fails on them nor reads `undefined` as a position.
11. **No existing test changes.** Every test file that existed before the task is
    byte-identical at the end of it, including both criterion-15 tests named in
    the survey. The branch's diff against the default branch adds files and
    edits only the brief, `tasks.md` and `PROGRESS.md` (the last two at sweep).
12. **No source or data change.** Nothing under `question-bank/src/` other than
    the new test file, nothing under `question-bank/data/`, and nothing under
    `backend/` (including `backend/app/data/content.json`) changes.
13. **No network, no spawn, no seam.** The new test reads only committed files
    under `question-bank/`, calls `generate` and `buildChoices` directly, calls
    no transport or sink, and does not use `Bun.spawn`/`Bun.spawnSync` or
    `fetch`.
14. **No new dependency.** `question-bank/package.json` and `question-bank/bun.lock`
    are unchanged.
15. **Whole `question-bank` suite, typecheck, lint and `format:check` pass**,
    including the guards that scan every `*.test.ts` (`spawn-guard.test.ts`,
    `prettier-gate.test.ts`, `lint-gate.test.ts`).

## Out of scope

- **The two person-approved criterion-15 tests.** Not edited, not merged into the
  new test, not "restored" to all templates (criterion 11).
- **A per-index floor** (the "at least 20" of the old check) for the T-026
  templates. The new test asks for at least one per index per template, as the
  queue entry's Done-when does. Farm-animal has 24 questions; a floor there is a
  separate decision.
- **Any change to `correctIndexFor`, `buildChoices`, `TEMPLATES`** or how
  positions are chosen, including if criterion 4 finds a gap.
- **Regenerating** the committed question file or `content.json`.
- **The served bank** (`backend/app/data/content.json`) and backend tests.
- **Distribution quality beyond presence** — chi-square, balance between
  positions, position vs. topic correlation.
- Any other queue item (T-070, T-084, T-087, ...).

## Constraints

- **Files expected to change:** one new `*.test.ts` under `question-bank/src/`;
  the brief. Nothing else (criteria 11, 12).
- **Existing tests are not the worker's to change** (`process.md` step 3, D-14).
  Adding a new `test(...)` inside an existing file counts as changing that file;
  use a new file.
- **Dependencies:** none (`CLAUDE.md`, "Packages").
- **No network in tests** (`CLAUDE.md`, "Tests"; `test-guidelines.md` "No
  network in tests, ever"). Pure functions called directly, no seam.
- **Formatting:** the new file must pass the exact-pinned prettier (E-16) and
  oxlint (E-15).
- **Commands:** `cd question-bank && bun test`, plus the typecheck, lint and
  `format:check` scripts in `question-bank/package.json` (see `conventions.md`).
- Worker model: Sonnet is enough — mechanical, one test file.

## Context

Required reading for the worker and the tester.

- **Queue entry:** `tasks.md` T-094.
- **Why positions are hashed:** `engineering-decisions.md` E-21 ("the correct
  position is a hash of the draft id"); `map_click` has none: E-29.
- **Source (entry points only):** `question-bank/src/distractors.ts`
  (`buildChoices`, `correctIndexFor` at :279, the `GeneratedQuestion` type at
  :33-41); `question-bank/src/generate.ts` (`generate`);
  `question-bank/src/templates.ts` (`TEMPLATES`, `format` field).
- **The two tests the new one supplements, and their scoping comments:**
  `question-bank/src/distractors.test.ts:248-261`,
  `question-bank/src/distractors-verify.test.ts:638-658`. Their bank-loading
  helpers are a fair pattern to copy into the new file.
- **Drift guard tying generated output to the committed file:**
  `question-bank/src/question-file.test.ts`.
- **Test rules:** `test-guidelines.md` (pure functions first, no network);
  for the tester, `process.md` step 4 on verifying a test deliverable by
  mutation — criteria 5-8 are mutation checks; revert every mutation.

## Handoff

_Written by `worker`._

## Verdict

_Written by `tester`._

## Notes
