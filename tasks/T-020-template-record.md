# T-020 — Template record type and three templates

**Status:** awaiting approval
**Next step:** worker
**Approved:** Dkaattae — 2026-10-13, given in the orchestrator session (AskUserQuestion). See `runs/T-020-template-record.md`.
**Test changes:** none
**From:** [`tasks.md`](../tasks.md) T-020
**Branch:** `claude/bold-noether-djxpzu`
**PR:** #79, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-13 | session_01UpEFQfyRxWfuVGBtPaogEo |

## Why this task, and not an earlier one

The queue's first entries are all blocked, and nothing has changed since the
last expander wrote that down:

- **T-064** depends on T-040, which has not run.
- **T-070** is waiting on Q1, a human answer that is still open.
- **T-084**'s Done-when cannot land before T-070 (a). The split proposed on
  2026-10-13 has not been decided.

T-020 is the first entry with `Depends on: —` that can land today.

## Goal

Plan §1.2 says the questions should be generated from **templates × entities**,
not written by hand. Every generation task (T-021 through T-026) needs a
template record to read. This task defines that record, writes the three
templates plan §4 step 2 names, and adds a validator, so T-021 starts from a
shape that has been checked rather than one it has to invent.

## Survey: what already exists

- **No template type, template list or validator exists** anywhere in the repo.
  The only "template" file is `tasks/TEMPLATE.md`. Nothing under
  `question-bank/src/` mentions `distractor_strategy`, `answer_field` or
  `min_age_band`.
- **The plan's field list exists only as prose and one JSON example**:
  `geoquizdataplan.md` §1.2, "Template record" (lines 61–75).
- **The vocabularies a template points into already exist:**
  - `Entity` and `EntityType` are in `question-bank/src/types.ts`.
  - `QuestionFormat` (nine values) is `openapi.yaml:1319`.
  - `AgeBand` (1, 2, 3) is `openapi.yaml:1335`.
  - `Level` (0–18) is `openapi.yaml:1340`.
- **The served bank's identify prompt is `"Which state is highlighted?"`**
  (`backend/app/data/content.json:179`, and every other `map_identify` question
  there).
- **Every committed state file already carries a non-empty `name`, `capital` and
  `geometry_id`.** Alaska's capital is `Juneau` in
  `question-bank/data/us-states/us-state-ak.json:6`, and no file has an empty or
  null capital. Criterion 21 should therefore already hold for the data. It is
  stated so that it keeps holding.
- **The backend grades `map_click` as a choice format** (`backend/app/grading.py:39`,
  `CHOICE_FORMATS`), using `choices` and `choiceIndex`. `openapi.yaml`'s
  `AnswerRequest` (line 2103) has **no** slot for a tapped geometry id, although
  `tasks.md` T-051 says it has one. That is T-051's problem, not this task's.
  It is noted on T-051 in `tasks.md`.

## Acceptance criteria

The four exports this brief names (`Template`, `TEMPLATES`,
`DISTRACTOR_STRATEGIES`, `validateTemplate`) are the interface T-021 and the
tester import, so their names and their module are fixed:
**`question-bank/src/templates.ts`**. Everything behind them is the worker's to
choose.

**The record**

1. `question-bank/src/templates.ts` exports a TypeScript type `Template` with
   exactly these nine fields, as named in plan §1.2: `id`, `prompt`,
   `answer_field`, `distractor_strategy`, `requires`, `applies_to`, `format`,
   `base_difficulty`, `min_age_band`.
2. The same module exports `TEMPLATES`, an array of exactly **3** `Template`
   values, whose `id`s are exactly `tpl-identify-on-map`, `tpl-capital-of` and
   `tpl-click-the-map`, in any order.
3. The same module exports `DISTRACTOR_STRATEGIES`, a collection of strategy
   names (strings). It contains at least `neighbours_first` and
   `sibling_capitals_same_region`. Every template's `distractor_strategy` is a
   member of it.

**The three templates**

4. `tpl-capital-of` equals the plan §1.2 example record field for field:
   - `prompt` is `"What is the capital of {name}?"`
   - `answer_field` is `"capital"`
   - `distractor_strategy` is `"sibling_capitals_same_region"`
   - `requires` is `["name", "capital"]`, as a set
   - `applies_to` is `["state", "country"]`, as a set
   - `format` is `"multiple_choice"`
   - `base_difficulty` is `2`
   - `min_age_band` is `1`
5. `tpl-identify-on-map` has:
   - `prompt` exactly `"Which state is highlighted?"`, the served bank's wording
   - `answer_field` `"name"`
   - `format` `"map_identify"`
   - `distractor_strategy` `"neighbours_first"`
   - `applies_to` exactly `["state"]`
   - `requires` containing both `"name"` and `"geometry_id"`, because a
     highlight cannot be drawn without the join key
6. `tpl-click-the-map` has:
   - `format` `"map_click"`
   - `answer_field` `"geometry_id"` (`conventions.md`: join on codes, never on
     names)
   - `distractor_strategy` `"neighbours_first"`
   - `applies_to` exactly `["state"]`
   - `requires` containing both `"name"` and `"geometry_id"`
   - a `prompt` containing the placeholder `{name}` and no other placeholder
7. `tpl-identify-on-map` and `tpl-click-the-map` each have:
   - a `base_difficulty` that is a finite number in **0–18 inclusive**
   - a `min_age_band` in `{1, 2, 3}`

   The exact values are the worker's choice. The Handoff records them, with one
   line of reasoning each. Tuning them is T-023/T-025.
8. `validateTemplate` returns an empty list for each of the three entries in
   `TEMPLATES`.
9. The three `id`s in `TEMPLATES` are distinct.

**The validator**

`validateTemplate(value: unknown)` returns an array of problem strings. An empty
array means the value is valid. It never throws, whatever it is given. Each
criterion below names the input and says what must be returned for it.

10. **Never throws.** For each of `null`, `undefined`, `42`, `"tpl-x"`, `[]` and
    `{}`, it returns a non-empty array and does not throw.
11. **Missing and extra keys.** For a valid template with any one of the nine
    fields deleted, it returns at least one problem, and some problem string
    contains that field's name. For a valid template with an extra key such as
    `topic` added, it returns at least one problem, and some problem string
    contains the extra key's name.
12. **`id`.** An `id` matching `^tpl-[a-z0-9]+(-[a-z0-9]+)*$` is accepted.
    `"tpl-"`, `"capital-of"` (no prefix), `"tpl-Capital-Of"` (upper case) and
    `"tpl-capital_of"` (underscore) are each rejected.
13. **Placeholders.** Every `{token}` in `prompt` must name a field in
    `requires`. Given `"What is the capital of {name}?"`:
    - it is accepted when `requires` is `["name", "capital"]`
    - it is rejected when `requires` is `["capital"]`

    A prompt with no placeholders at all, like `"Which state is highlighted?"`,
    is accepted.
14. **`answer_field`.** `answer_field` must be a member of `requires`. A
    template whose `answer_field` is `"capital"` and whose `requires` is
    `["name"]` is rejected.
15. **Field names are `Entity`'s keys.**
    - Each entry of `requires`, and `answer_field`, must be a key of the
      `Entity` interface in `question-bank/src/types.ts`. `"capitol"` and
      `"flag_url"` are each rejected. `"top_livestock"` and `"highest_point_m"`
      are each accepted.
    - `requires` must be non-empty and contain no duplicates.
    - The set of accepted names is tied to `Entity`. If a mutation adds a key to
      `Entity`, then either the validator accepts that key without any other
      edit, or `bun run typecheck` in `question-bank/` fails.
16. **`applies_to`.** `applies_to` must be non-empty, and each entry must be a
    member of `EntityType` in `question-bank/src/types.ts`. `["state"]` is
    accepted. `[]`, `["province"]` and `["state", "continent"]` are each
    rejected. (`continent` is in `openapi.yaml`'s enum but not in `types.ts`'s.)
17. **`format`.** `format` must be one of the nine `QuestionFormat` values in
    `openapi.yaml:1319`. `"map_click"` and `"click_profile"` are each accepted.
    `"map-identify"` (the v1 client's spelling) and `"text-mc"` are each
    rejected.
18. **`base_difficulty`.** `base_difficulty` must be a finite number in 0–18
    inclusive:
    - `0`, `18` and `7.5` are each accepted
    - `-0.5`, `18.5`, `NaN`, `Infinity` and `"2"` (a string) are each rejected
19. **`min_age_band`.** `min_age_band` must be exactly `1`, `2` or `3`. `0`,
    `4`, `1.5` and `"1"` are each rejected.
20. **`distractor_strategy`.** `distractor_strategy` must be a member of
    `DISTRACTOR_STRATEGIES`. `"random"` is rejected unless the worker has added
    it to the set. If it has, the Handoff says so, and the tester substitutes
    any string that is not in the set.

**Against the committed data**

21. **Every template applies to every committed state.** Take every template in
    `TEMPLATES` and every one of the 50 `question-bank/data/us-states/us-state-*.json`
    files. Each field the template's `requires` names is present in the file,
    is not `null`, and is not an empty string or empty array. The test reads the
    committed files. It does not build them.

**What must not happen**

22. **No dependency added or changed.** `question-bank/package.json` and
    `question-bank/bun.lock` are byte-identical to the default branch.
23. **No built byte moves.** Everything under `question-bank/data/`,
    `question-bank/sample-data/` and `question-bank/src/fixtures/` is
    byte-identical to the default branch. `bun run build -- --offline` output
    and its stdout are unchanged. Nothing in `build.ts`, `refresh.ts` or
    `normalize.ts` imports `templates.ts`.
24. **No change outside `question-bank/`**, apart from `tasks/` and the brief.
    `backend/`, `frontend/`, `e2e/`, `openapi.yaml` and `fixtures/` are
    untouched.
25. **No pre-existing test is modified or deleted.** The worker expects no Test
    change request. If one turns out to be needed, the worker says so under
    **Tests made stale**, and the tester raises the request (D-14).
26. **No test reaches the network.** The validator's tests and the template
    tests call `validateTemplate` and read `TEMPLATES` directly. Nothing spawns
    a build, mocks `fetch`, or uses a transport seam.
27. **The package's gates pass.** In `question-bank/`, each of these exits 0:
    `bun run typecheck`, `bun run lint`, `bun run format:check`, and the full
    `bun test`.

## Out of scope

- **Generating questions** (T-021). No code turns `TEMPLATES` into questions,
  and no `questions` file is written anywhere.
- **Implementing any distractor strategy** (T-022). `DISTRACTOR_STRATEGIES` is
  a list of names. There is no function behind a name, and no fallback for the
  small regions.
- **Computing `level`** (T-023). `base_difficulty` is a stored input, not a
  level formula. **Tuning the values** is T-023/T-025.
- **The API tag set** (T-024). This means no `topic`, `scope`, `region` or
  `age_band` on the template record. Criterion 11 makes adding a tenth field a
  validation failure on purpose. Whether templates should carry `topic` is
  T-024's call.
- **Rendering `map_click`** (T-051), and the missing tapped-geometry slot in
  `AnswerRequest`.
- **Templates beyond these three**, including every row of plan §1.2's table
  after the first three, and every topic in T-026.
- **`openapi.yaml`, `backend/`, `frontend/`, `content.json`.** The served bank
  does not change. Nothing reaches a child in this task.
- **Countries.** `tpl-capital-of` lists `country` in `applies_to` because the
  plan's example does. No country entity exists, and none is added.

## Constraints

- **Files expected to change:**
  - `question-bank/src/templates.ts`, new
  - one or more new `question-bank/src/*.test.ts` files
  - the brief's Handoff

  Possibly `question-bank/src/types.ts`, if the worker needs a runtime list of
  the `EntityType` values. If so, the existing exports must keep their names
  and shapes.
- **Child-facing text:** `tpl-click-the-map`'s prompt is the only new wording a
  child will eventually see. Keep it short, at a reading age of six to eight,
  and free of words like "polygon" or "FIPS". The reviewer reads it.
- **TypeScript strictness** (`conventions.md` "Code"): `exactOptionalPropertyTypes`
  is on. The new file must be prettier-clean and oxlint-clean under the pinned
  configs.
- **Existing sweeps over `question-bank/src/` will scan the new files.** No new
  file may contain:
  - `fetch(`
  - `mock(`
  - `fetch =`
  - the dead-loopback literal (`climate-kid-verify.test.ts:953`)
  - a `git` call that fails open (`git-exit-guard.criteria.test.ts`)
  - a spawn of `build.ts` (`spawn-guard.test.ts`)
- **Dependencies:** none (`CLAUDE.md` "Packages").
- **Model:** this is a design-shaped task whose record T-021 to T-026 inherit.
  Opus is advised (`process.md`, "Choosing the worker's model").

## Context

Required reading for the worker and the tester:

- **`geoquizdataplan.md` §1.2**, "Template record" and "Templates to build
  first". This is the field list and the `tpl-capital-of` example criterion 4
  pins.
- **`geoquizdataplan.md` §1.3** (the `format` tag) and **§1.4** (`level` 0–18;
  `age_band` is appropriateness, not challenge).
- **`geoquizdataplan.md` §4** step 2: the three templates.
- **`openapi.yaml`:**
  - `QuestionFormat` (line 1319)
  - `AgeBand` (line 1335)
  - `Level` (line 1340)
  - `Question` (line 1541), what a generated question will become
- **`question-bank/src/types.ts`:** `Entity` and `EntityType`.
- **`backend/app/data/content.json`:** the hand-written questions T-021 will
  eventually replace. Note the identify prompt and the choice shape.
- **`backend/app/grading.py:39`:** `map_click` is graded as a choice format.
- **`tasks.md`:** T-021, T-022, T-023, T-024 and T-051, to see what this record
  has to serve and what it must not pre-empt.
- **`conventions.md`:** "Code" and "Join on codes, never on names".
- **`test-guidelines.md`:** pure functions first, called directly. No seam is
  needed here.

## Handoff

## Verdict

## Notes
