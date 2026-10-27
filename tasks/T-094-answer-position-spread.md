# T-094 — Answer-position spread is checked again for every template that has a position

**Status:** `approved — swept, PR ready`
**Next step:** `human` (merge PR #101; routine, inside the envelope)
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
| worker | 2026-10-27 | cse_011oDiJdmgY3R4p3uHw5DgmH |
| tester | 2026-10-27 | cse_011oDiJdmgY3R4p3uHw5DgmH (orchestrated; see Verdict on independence) |
| reviewer | 2026-10-27 | cse_011oDiJdmgY3R4p3uHw5DgmH (orchestrated) |

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

**TL;DR:** I added one new test file, `question-bank/src/answer-position-spread.test.ts`. It passes against the current source and committed bank, so criterion 4 found no gap. All eight positioned templates already put their answer at every index 0..3. The whole suite passes (2449 pass, 0 fail), and so do typecheck, lint and `format:check`. No source, data or existing test changed. Tests made stale: none.

**Same session id as the expander.** The orchestrated run gave the worker the same `CLAUDE_CODE_REMOTE_SESSION_ID` as the expander (`cse_011oDiJdmgY3R4p3uHw5DgmH`). The tester should check that its own id differs from both, and the orchestrator / `runs/` should record that expander and worker shared one id.

### What changed

- **`question-bank/src/answer-position-spread.test.ts`** (new). It has two tests under `describe("answer-position spread over the committed bank")`:
  - **"the positioned set is derived by format and holds every known positioned template"** checks that the set is not empty and that none of the eight survey ids is missing from it (criterion 3).
  - **"every positioned template has its answer at every index 0..3 at least once"** builds a list of `"<template id>: no question with correctIndex <i>"` strings and asserts that the list is `[]` (criteria 1, 8, 9).
- **This brief**: Status, Sessions, Handoff, Notes.
- Nothing else.

### Where each criterion lives

| # | Where / how |
|---|---|
| 1 | The second test: a loop over `positioned` × `POSITIONS`. It checks presence only, so one question at an index is enough. |
| 2 | `positioned = TEMPLATES.filter((t) => t.format !== "map_click")`. No ids are hard-coded in the filter. |
| 3 | The first test. `KNOWN_POSITIONED` holds the eight ids and is used only to check the derived set, never to drive the loop. |
| 4 | Passes today: 2 pass, 0 fail. |
| 5-7 | See "Mutations I ran" below. Every one went red. |
| 8 | A template with zero questions has an empty `seen` set, so all four indices get reported. Verified by mutation, but see the caveat below. |
| 9 | Failure output lists strings such as `"tpl-farm-animal-of: no question with correctIndex 0"`. |
| 10 | Only questions with `typeof q.correctIndex === "number"` are counted. Click questions are never in `positioned` anyway. |
| 11-12 | Against `origin/main` the branch changes only the new test file, the brief, and `tasks.md`. The `tasks.md` edit is the expander's queue edit, which criterion 11 allows. |
| 13 | The file reads `data/us-states/*.json` and calls `generate` and `buildChoices`. It uses no transport, sink, spawn or fetch. |
| 14 | `package.json` and `bun.lock` are unchanged. |
| 15 | `bun test`: 2449 pass, 0 fail. `typecheck`, `lint` (0 warnings) and `format:check` are clean. |

### Mutations I ran (all reverted, `git status` clean apart from the new file)

- **Criteria 5-7.** I temporarily replaced `distractors.ts:507` so that a draft whose id contains `MUT_T`, and whose hashed index equals `MUT_I`, moves to `(i+1)%4`.
  - With `MUT_I=3`, each of the six T-026 templates went red one at a time, and so did identify and capital. Each failure named the template and index 3.
  - `tpl-farm-animal-of` with `MUT_I=0` went red and named index 0.
- **Criterion 8.** I temporarily added `tpl-capital-copy` to `TEMPLATES`, using the `tpl-capital-of` body with `applies_to: ["country"]`. That gives zero questions over the state bank. The test went red and listed indices 0-3 for `tpl-capital-copy`.
- **Criterion 8, caveat on the brief's own example.** "A field no entity has" fails earlier and harder than the brief expects. A `requires` entry that is not an `Entity` field makes `generate` throw (`generate: invalid template(s), nothing generated`). The file still goes red, but as an unhandled error, not as this test's named failure. If the field is a real `Entity` field that just happens to be absent from every state, the test fails by name as intended. **Tester to decide** whether the throwing case counts as "fails for that template"; I think it does, since it is red and names the template.

### Deliberately not done

- No per-index floor, no distribution checks, and no change to the two criterion-15 tests (out of scope).
- No `toHaveLength(8)` on the derived set. A pin like that would break criterion 2, because adding a template would then need a test edit. The check is "contains all eight", as criterion 3 says.

### Contradictions with the brief

- **None of substance.** Only the criterion 8 example caveat above.

### How to run

`cd question-bank && bun install --frozen-lockfile && bun test src/answer-position-spread.test.ts`. Then run `bun test`, `bun run typecheck`, `bun run lint` and `bun run format:check`.

`node_modules` was missing in this environment. Before the install, typecheck, lint and format failed and the suite showed 12 failures. After the install everything is clean. The lockfile is unchanged.

### Tests made stale

None.

## Verdict

_Written by `tester`._

**TL;DR: pass.** The new test passes, and it went red under every mutation that criteria 5-8 name. Each failure named the template and the missing index. The whole `question-bank` suite (2449 pass, 0 fail), typecheck, lint and `format:check` are clean. No existing test, source or data file changed. Next step: `reviewer`.

**How independent this check is.** This is an orchestrated run (`runs/T-094-answer-position-spread.md` exists). The session id here, `cse_011oDiJdmgY3R4p3uHw5DgmH`, is the same one the Sessions table records for the expander and the worker. So the session-id check proves nothing either way. My independence rests only on being a freshly spawned agent with its own context: I did not see the worker's conversation or reasoning. That is weaker than running in a separate session, because it depends on the orchestrator having spawned me correctly, and I cannot check that myself. Weigh this pass with that in mind.

### Criterion → verdict → evidence

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | The control run passes: 2 pass, 0 fail. **Boundary:** I mutated the code so that `tpl-farm-animal-of` kept exactly one question at index 3 and moved the other eight to index 0. The test stayed green, so one question at an index is enough. Zero at an index is checked under criteria 5-7. |
| 2 | met | The filter is `TEMPLATES.filter((t) => t.format !== "map_click")`. A template I added temporarily (`tpl-capital-copy`) was checked without any edit to the test (criterion 8 row). |
| 3 | met | I ran three filter mutations on a temporary copy of the test. `=== "multiple_choice"` went red and named `tpl-identify-on-map`. `=== "nothing"`, which matches no template, went red. A filter that silently drops `tpl-crop-of` went red and named `tpl-crop-of`. |
| 4 | met | It passes today. Generated spread per index 0..3: identify 12/6/15/17, capital 9/16/12/13, biggest 5/16/12/14, state-animal 16/13/10/11, landmark 18/6/12/8, climate 15/11/10/14, crop 13/12/13/12, farm-animal 5/4/6/9. These counts come from the generated output over the committed bank, not from a fixture. |
| 5 | met | Mutation in `questionFor` (`distractors.ts`): when the draft's `templateId` matches the target and its hashed index is 3, the index is moved to 0. I ran it for each of the six T-026 templates, one at a time. Each run gave 1 pass, 1 fail. |
| 6 | met | The same mutation for `tpl-identify-on-map` alone and for `tpl-capital-of` alone. Both went red. |
| 7 | met | The same mutation for `tpl-farm-animal-of` with index 0, which moved its questions to index 1. It went red and the output names `"tpl-farm-animal-of: no question with correctIndex 0"`. |
| 8 | met | I temporarily added `tpl-capital-copy` to `TEMPLATES`: the `tpl-capital-of` body with `applies_to: ["country"]`, so it gives zero questions over the state bank. The test went red and listed `tpl-capital-copy` with each of indices 0, 1, 2 and 3. See the note below on the brief's own example. |
| 9 | met | A failure prints strings such as `"tpl-crop-of: no question with correctIndex 3"`, so both the template id and the index appear as text. |
| 10 | met | The generated bank holds 50 `tpl-click-the-map` questions, none with a `correctIndex`. The test passes with all of them present. Only numeric `correctIndex` values are counted, and click is not in the positioned set. |
| 11 | met | `git diff --name-status origin/main...HEAD` shows the new test file, the brief and `runs/T-094-…md` added, and `tasks.md` modified. No existing test file is touched. The `runs/` log is the orchestrator's own file, and it is an addition. |
| 12 | met | Nothing under `question-bank/src/` other than the new file changed, and nothing under `question-bank/data/` or `backend/`. |
| 13 | met | The file reads only `data/us-states/us-state-*.json` and calls `generate` and `buildChoices` directly. It has no transport, sink, `Bun.spawn` or `fetch`. `spawn-guard.test.ts` is green. |
| 14 | met | `package.json` and `bun.lock` are unchanged. |
| 15 | met | `bun test`: 2449 pass, 0 fail across 59 files. `typecheck` is clean, `lint` has 0 warnings and 0 errors, and `format:check` is clean. I ran `bun install --frozen-lockfile` first; the lockfile is unchanged. |

### Criterion 8: the brief's example does not produce zero questions

The worker asked me to rule on this, and I am not blocking on it.
- **No real field fits the example.** Every `Entity` field is present on at least 24 of the 50 states, so "a field no entity has" can only be a field that is not an `Entity` field at all.
- **Such a field fails earlier.** `generate` rejects the whole template set: `generate: invalid template(s), nothing generated. tpl-capital-copy: requires: "no_such_field" is not an Entity field`. The file goes red (0 pass, 1 fail, 1 error), and the error names the template.
- **Why I accept it.** That case never "produces zero questions". It produces no generation at all. The criterion's actual condition, a positioned template with zero questions, is the `applies_to: ["country"]` case, and that fails by name inside the new test.
- **Worth fixing at sweep:** the example in the brief's wording.

### Mutations (all reverted)

- **How each one was reverted.** I restored each mutation from a scratchpad copy of the original file. The probe and filter-mutation files I created were deleted. At the end, `git diff --quiet` is clean on `src/distractors.ts` and `src/templates.ts`.
- **My tests.** I added no new test file. The deliverable is itself a test, so I verified it by coverage and mutation, as `process.md` step 4 says.

**Tests made stale:** none. I checked: no existing test changed or went red.

## Review

_Written by `reviewer`._

**TL;DR: approve, inside the envelope.** One 65-line test file, written in the idioms of the tests around it, and nothing beyond what the brief asked for. No blocking findings. The PR is swept and marked ready for a routine merge.

- **Every role's work is in the PR.** Expander `0a3b6f3`/`4998c8d`, worker `490b7e7`, tester `c8b617d`, orchestrator run log `407e7e3`/`400c62a`/`2fef27a`.
- **Each role stayed in its lane (D-7).** The expander touched only `tasks/` and `tasks.md`. The tester touched only the brief. The worker touched the new test and the brief.
- **Fits the codebase.** `import.meta.dirname` + `readdirSync` bank loading matches `committed-bank.test.ts` and the others. Collecting every missing (template, index) into one list compared with `[]` is a good call: one run shows them all.
- **Not more than needed.** No floor, no distribution statistics, no `toHaveLength(8)` pin (which would have broken criterion 2).
- **Outside Constraints:** only `runs/T-094-…md`, the orchestrator's own log, which every orchestrated PR carries.
- **Reran the gates myself:** `bun test` 2449 pass / 0 fail, typecheck clean, lint 0/0, `format:check` clean.

**Flags disposed of:**
- **Criterion 8's example (worker, tester).** Decided: accepted as the tester ruled. The example ("a field no entity has") makes `generate` throw instead of producing zero questions; the criterion's real condition is covered by the `applies_to: ["country"]` mutation. The criteria are not edited (the record stands); the discrepancy is noted in `PROGRESS.md`.
- **Shared session id (worker, tester).** Decided: no action. `process.md` "Spawning, and the isolation it must not cost" already names this as a known cost of relayed runs. The tester said which independence it actually had, as required.

**Queue:** no task made smaller, larger or unnecessary. Positions are a hash of the draft id (E-21), so T-088's distractor changes cannot move them. No new tasks.

**Envelope:** tester pass; gates green; nothing outside Constraints except the run log and the sweep; no dependency; no `openapi.yaml`, migration or plan change; no child-facing text; no pre-existing test changed (`Test changes: none`); no product decision. Ready with no escalation note.

## Notes

- **worker, 2026-10-27:** I counted positions with `typeof correctIndex === "number"`, not `!== undefined`, so a stray `null` could not count as a position either.
- **worker:** I reported failures as one list compared to `[]`, not as a separate `expect` for each pair. That way every missing (template, index) shows up in a single run, and not only the first one.
