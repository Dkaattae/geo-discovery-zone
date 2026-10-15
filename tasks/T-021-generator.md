# T-021 — Generator: entities × templates → question drafts

**Status:** awaiting verification
**Next step:** tester
**Approved:** orchestrator — 2026-10-15, unattended run. See `runs/T-021-generator.md`.
**Test changes:** none
**From:** [`tasks.md`](../tasks.md) T-021
**Branch:** `claude/amazing-carson-zrp4qz`
**PR:** #80, opened draft at expand time, built from the branch above. It stays draft until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-15 | cse_01FsXqnpENQjfQBQc9Pmhmfj |
| worker | 2026-10-15 | cse_01FsXqnpENQjfQBQc9Pmhmfj |

**Worker model:** Opus. The task fixes a record shape that T-022, T-023, T-024,
T-026, T-040 and T-051 all build on, and settles how a `map_click` answer is
represented. That is a design choice with more than one defensible answer.

## Goal

Make the plan's central claim (`geoquizdataplan.md` §1.2, "generate, don't
collect") true for the first time. A pure function turns the committed 50-state
bank and `TEMPLATES` into one question draft per applicable (template, entity)
pair. It skips and reports any pair whose data is missing instead of emitting a
question with a hole in it. Distractors, level, tags and serving are later tasks,
and each needs a stable draft to build on.

## What is already true (survey, 2026-10-15)

- **Templates exist and are validated.** `question-bank/src/templates.ts` exports
  `TEMPLATES` (three records: `tpl-identify-on-map`, `tpl-capital-of`,
  `tpl-click-the-map`), `validateTemplate` (returns a problem list and never
  throws), `QUESTION_FORMATS` and `DISTRACTOR_STRATEGIES`. Nothing imports it
  except its two test files. T-020 PR #79.
- **The committed bank has every field the three templates need.** All 50
  `question-bank/data/us-states/us-state-*.json` files carry a non-empty `name`,
  `capital` and an all-digit `geometry_id`, and `type: "state"`. This is already
  asserted by `templates-verify.test.ts`, "T-020 criterion 21". Alaska's
  `capital` is `"Juneau"` in the committed file. So the expected count over the
  committed bank is **150 with zero skipped**, and the skip path can only be
  exercised with synthetic entities.
- **"Missing" already has a definition in this codebase.**
  `templates-verify.test.ts:362-366` treats `undefined`, `null`, a string that is
  empty after trimming, and an empty array as empty. Criterion 6 below uses the
  same definition, so the two cannot drift apart.
- **The build must not import `templates.ts`.** `templates-verify.test.ts`,
  "T-020 criterion 23", asserts that `build.ts`, `refresh.ts` and `normalize.ts`
  do not import `./templates`. This task does not wire the generator into the
  build (see Out of scope), so that test stays green. A new module that imports
  `./templates` is allowed.
- **Nothing generates anything.** There is no generator module, and nothing under
  `question-bank/src/` produces a question.
- **Backend grading.** `backend/app/grading.py:39` puts `map_click` in
  `CHOICE_FORMATS` and grades it by `choiceIndex` against `correctIndex`. Neither
  field exists until T-022 builds `choices`. This task fixes only what the
  correct answer *is* for each draft. See criterion 11 and the decision record in
  criterion 18.

## Acceptance criteria

"The generator" means the exported function this task adds under
`question-bank/src/` (see Constraints). "A draft" means one element of the
question list it returns. "Reported" means listed in the skip report it returns
alongside the drafts. Field names in `code` are the draft's own keys.

**Over the committed bank**

1. Given the 50 committed entity files in `question-bank/data/us-states/` and
   `TEMPLATES`, the generator returns **exactly 150** drafts and an **empty**
   skip report.
2. In that output, each of the three template ids appears on exactly 50 drafts,
   and each of the 50 entity ids appears on exactly 3 drafts, one per template.
3. The Colorado draft from `tpl-capital-of` has `prompt` exactly
   `"What is the capital of Colorado?"` and `answer` exactly `"Denver"`. The
   Alaska draft from the same template has `answer` exactly `"Juneau"`.
4. The Colorado draft from `tpl-identify-on-map` has `prompt` exactly
   `"Which state is highlighted?"`, `answer` exactly `"Colorado"` and
   `highlightGeometryId` exactly `"08"`.
5. The Colorado draft from `tpl-click-the-map` has `prompt` exactly
   `"Find Colorado on the map."`, `answer` exactly `"Colorado"`,
   `answerGeometryId` exactly `"08"`, and **no** `highlightGeometryId` key. A
   highlighted target would give the answer away.

**Every draft's shape**

6. Every draft carries `id`, `entityId`, `templateId`, `format`, `prompt` and
   `answer`, all non-empty strings. `entityId` is the entity's `id`.
   `templateId` is the template's `id`. `format` is the template's `format`.
7. Every `{token}` in a template's prompt is replaced by that entity's value for
   the named field, verbatim. No draft's `prompt` contains `{` or `}`.
8. `highlightGeometryId` is present, and equal to the entity's `geometry_id`,
   **if and only if** the draft's `format` is `map_identify`. It is absent on
   every `map_click` and `multiple_choice` draft.
9. `answerGeometryId` is present, and equal to the entity's `geometry_id`, **if
   and only if** the template's `answer_field` is `geometry_id`. It is absent on
   every other draft.
10. When the template's `answer_field` is any field other than `geometry_id`,
    `answer` equals the entity's value for that field.
11. **A FIPS code is never a label a child sees.** When the template's
    `answer_field` is `geometry_id`, `answer` is the entity's `name`, never its
    `geometry_id`. Across all 150 committed-bank drafts, no `prompt` or `answer`
    equals any entity's `geometry_id`, and no `answer` consists only of digits.
12. **Ids are unique and stable.** All `id` values in one output are distinct. A
    draft's `id` depends only on its (`templateId`, `entityId`) pair. The same
    pair gets the same `id` whether the generator runs over all 50 entities or
    over a subset that includes that entity, and whatever order the inputs come in.
13. No generated `id` equals any question `id` in
    `backend/app/data/content.json`. T-040 upserts on `id`, and a collision would
    silently overwrite a hand-written question.

**Skipping, at both edges**

14. **Missing data skips the pair, and the skip is reported.** A required field
    counts as missing when its value is absent, `undefined`, `null`, a string that
    is empty after trimming (`""` and `"   "` both), or an empty array. In that
    case the generator emits no draft for that (template, entity) pair. It
    reports the pair with its `templateId`, its `entityId` and the names of every
    missing required field. It does not throw. For the other side of each edge:
    a one-character string (`"X"`), a one-element array and the number `0` all
    count as **present**.
15. **A skip is per pair, not per entity.** An entity with an empty `capital` but
    a valid `name` and `geometry_id` gets no `tpl-capital-of` draft. It still
    gets its `tpl-identify-on-map` and `tpl-click-the-map` drafts.
16. **`applies_to` is respected, and that is not a gap.** An entity whose `type`
    is not in a template's `applies_to` gets no draft from that template and is
    **not** reported. For example, a synthetic `country` entity with `name`,
    `capital` and `geometry_id` gets a `tpl-capital-of` draft (`applies_to`
    includes `country`) and no draft from the two map templates (which apply to
    `state` only), and the skip report stays empty.
17. **A non-string value never becomes text.** If a field used as a prompt token
    or as the answer holds a value that is present but not a string (a number,
    an array, an object), the generator emits no draft for that pair and reports
    it, naming that field. A synthetic template with `answer_field: "top_crops"`
    over an entity whose `top_crops` is `["corn"]` therefore yields no draft and
    one report. Arrays as answers are T-026's job.

**Bad input is refused, not half-used**

18. If any template in the list fails `validateTemplate`, the generator throws.
    The error message contains that template's `id` and at least one of its
    problems. It returns no drafts, including none for the valid templates beside it.
19. If two templates share an `id`, or two entities share an `id`, the generator
    throws and returns no drafts.

**Purity and safety**

20. `TEMPLATES`, and the entity objects passed in, are deep-equal before and
    after a call. Neither the generator nor anything it returns mutates them.
    Mutating a returned draft afterwards does not change `TEMPLATES` either.
21. Calling the generator twice on the same input gives deep-equal output,
    in the same order.
22. **No unreviewed text ships.** No string in any draft contains the `text` of
    any entry in the input entities' `fun_facts`, whether that entry is
    `reviewed: true` or `reviewed: false`.

**What must not change**

23. No file under `question-bank/data/`, `question-bank/sample-data/`,
    `backend/`, `frontend/`, or `openapi.yaml` is modified. The generator writes
    no file. Its tests read the committed bank, and nothing writes it.
24. `build.ts`, `refresh.ts` and `normalize.ts` do not import the generator or
    `./templates`, so `bun run build` output is byte-identical to before.
25. `TEMPLATES`' three records, and `validateTemplate`'s result for any input,
    are unchanged.
26. No new dependency. Both `question-bank/package.json` and `bun.lock` are
    unchanged.
27. No test reaches the network. The generator makes no network call and takes
    no transport.
28. In `question-bank/`, `bun test`, `bun run typecheck`, `bun run lint` and
    `bun run format:check` all pass. That covers every pre-existing test, with
    none deleted or modified.

**The decision, written down**

29. `engineering-decisions.md` gains one new `E-n` entry, numbered with the next
    unused number (E-20 unless something else has taken it). It records the
    draft shape and the `map_click` representation:
    - the child-facing `answer` is the entity's `name`;
    - the click target is carried separately as `answerGeometryId`, so nothing
      downstream joins on names (`conventions.md`, "Join on codes, never on
      names");
    - what T-022 and T-051 should therefore build `choices` and `correctIndex`
      from.

    It also names the option not taken and what that option would have cost.

## Out of scope

- **Distractors, `choices` and `correctIndex`.** That is T-022. A draft carries
  the correct answer only. Do not add a placeholder `choices` array, not even
  a one-element one.
- **`level`, `rating` and `timesAnswered`.** T-023 owns `level`. A draft is
  therefore **not** yet an `openapi.yaml` `Question`, which requires `level`, and
  nothing here should pretend otherwise.
- **The tag set.** `topic`, `scope`, `entityType`, `region` and `ageBand` belong
  to T-024, as do the `QUESTION_FORMATS` ↔ backend enum cross-check and whether a
  template carries `topic`.
- **Explanations, `reveal`, `imageUrl`, `pinTarget`, `timeLimitS`.**
- **New templates and topics.** That is T-026. Array- and number-valued answers
  come with it.
- **Writing generated output anywhere.** No questions file, no change to the
  committed bank, no wiring into `bun run build` or `bun run refresh`. Whether
  generated questions are committed is a product decision (`process.md`, "Where
  the loop stops for a human", moment 3). It belongs to whichever task first needs
  them on disk, most likely T-040 or T-050. It is not this task's to make.
- **Loading or serving.** That is T-040 and T-050. `backend/app/data/content.json`
  is read by criterion 13's test and never written.
- **The client's `map_click` renderer.** That is T-051.
- **Editing `TEMPLATES`, `validateTemplate` or any template prompt.** The prompts
  are approved child-facing text (T-020, Dkaattae chose the click prompt).

## Constraints

- **Files expected to change:**
  - a new module under `question-bank/src/` (suggested: `generate.ts`), with its
    test file beside it (`generate.test.ts`);
  - `engineering-decisions.md`, for criterion 29;
  - this brief's Handoff.
- **Entry point.** The generator takes the entity list and the template list as
  arguments. Tests have to pass synthetic templates and entities. Defaulting the
  template list to `TEMPLATES` is fine. It returns the drafts and the skip
  report together. Name the function, its signature and the draft's exported
  type in the Handoff: the tester finds them there.
- **`templates.ts` should not need to change.** If it truly must (for example,
  to export a type), the change is additive only, and criterion 25 still holds.
- **Copy, don't mutate.** `TEMPLATES` is an exported mutable array (see the
  T-021 entry in `tasks.md`).
- **Strict TypeScript.** `exactOptionalPropertyTypes` is on, so optional draft
  fields are declared `field?: T | undefined` (`conventions.md`, "Code").
- **Pure.** No `fetch`, no file writes, no clock, no randomness. Tests may read
  the committed bank and `content.json` from disk.
- **No dependencies** without asking (`CLAUDE.md`, "Packages").
- **Child-facing text.** Prompts reach a child, but only through the already
  approved templates. The generator must not invent or alter wording beyond
  filling `{token}`s.

## Context

Required reading for the worker and the tester:

- `geoquizdataplan.md` §1.2 covers the entity and template records and why
  distractors are stored on the template. §1.3 covers the tag set, which is
  T-024's and not this task's. §1.4 covers `level`, which is T-023's.
- `question-bank/src/templates.ts` holds the `Template` record, `TEMPLATES` and
  `validateTemplate`.
- `question-bank/src/types.ts` holds `Entity`, `EntityType` and `FunFact`.
- `question-bank/src/templates-verify.test.ts`. "T-020 criterion 21" has the
  emptiness definition reused in criterion 14. "T-020 criterion 23" has the
  no-import guard that criterion 24 keeps green.
- `question-bank/data/us-states/` is the committed bank (`engineering-decisions.md`
  E-6).
- `backend/app/data/content.json` holds the 26 hand-written questions. Their ids
  matter for criterion 13, and their shape shows where these drafts are headed.
- `backend/app/grading.py:39` is the `CHOICE_FORMATS` list that grades
  `map_click` by `choiceIndex`.
- `openapi.yaml`, `components.schemas.Question`, especially `templateId`,
  `highlightGeometryId` and `choices`. Read it but do not edit it.
- `conventions.md`, "Code" covers strict TypeScript and "Join on codes, never on
  names".
- `test-guidelines.md`, "Writing tests from acceptance criteria" and
  "`question-bank/` and `frontend/` — `bun test`".
- `tasks.md` has the T-021 entry, and the T-022, T-024 and T-051 entries for
  what is deliberately left to them.

## Handoff

_Written by `worker`, 2026-10-15._

**TL;DR.** Built `generate()` in `question-bank/src/generate.ts`, with 20 worker
tests beside it, and recorded E-20. The committed bank gives 150 drafts and 0
skips. In `question-bank/` the full suite (1949 pass, 0 fail), typecheck, lint
and format:check are all green. **Tests made stale: none.** Next: tester.

**Files changed**
- **`question-bank/src/generate.ts`** (new). The generator.
- **`question-bank/src/generate.test.ts`** (new). Worker tests, 20 cases.
- **`engineering-decisions.md`**. Appends **E-20**, the draft shape and the `map_click` representation (criterion 29). E-20 was unused. `tasks.md` T-070's "Done when" still names `E-20`, and its line 201 already says to take the next unused number. The sweep should change that wording to E-21.
- **This brief**. Handoff, Notes, Status, Sessions.
- Nothing under `question-bank/data/`, `sample-data/`, `backend/`, `frontend/` or `openapi.yaml`. `templates.ts`, `package.json` and `bun.lock` are untouched.

**The API, for the tester**
- `export function generate(entities: readonly Entity[], templates: readonly Template[] = TEMPLATES): GenerateResult`
- `export interface GenerateResult { drafts: QuestionDraft[]; skipped: SkippedPair[] }`
- `export interface QuestionDraft { id; entityId; templateId; format: QuestionFormat; prompt; answer; highlightGeometryId?: string | undefined; answerGeometryId?: string | undefined }`. The optional keys are **omitted**, never set to `undefined`.
- `export interface SkippedPair { templateId: string; entityId: string; missing: EntityField[]; notText: EntityField[] }`. There is one entry per skipped pair. `missing` covers criterion 14's emptiness (absent, `undefined`, `null`, blank after trim, `[]`). `notText` covers criterion 17: a value that is present, has to become text and is not a string.
- `export function draftId(templateId, entityId)` returns `gen:<templateId>:<entityId>`.
- **Order**: templates in input order, then entities in input order within each.

**Where each criterion lives**

| # | Where |
|---|---|
| 1–5 | `generate` + `draftFor`. Tests: "over the committed bank" |
| 6–10 | `draftFor` builds the draft. Tokens are filled with `String.replace` and a function, so a `$` in a value is not treated as a pattern |
| 11 | `answerIsCode` branch: `answer` is `name`, and the code goes to `answerGeometryId` |
| 12–13 | `draftId`. A template id cannot contain `:`, so the id parses unambiguously. The `gen:` prefix cannot match content.json's `q-…` ids |
| 14–17 | `draftFor` (`missing` / `notText`). `applies_to` filtering in `generate` happens before any check, so out-of-scope pairs are never reported |
| 18–19 | `checkInputs`. It runs before any drafting, so a throw means nothing is generated |
| 20–22 | Drafts hold only primitive strings copied from the entity. The generator writes to nothing it was given. `fun_facts` is never read unless a template names it, and an array would then be `notText` |
| 23–27 | No I/O in `generate.ts`. Nothing in the pipeline imports it |
| 28 | See "How to run" |
| 29 | `engineering-decisions.md` E-20 |

**Judgment calls. Each has an owner.**
- **Implicitly required fields.**
  - **What I decided:** a `map_identify` draft also requires `geometry_id`, and a code answer also requires `name`, even when a template's `requires` omits them. Otherwise criterion 8 or 11 could not hold, and the alternative is a draft with a hole in it. A pair missing one is skipped under `missing`. No current template triggers this.
  - **Who decides:** tester to confirm against 8, 11 and 14. Or T-024, which owns template/format cross-checks, could move it into `validateTemplate`.
- **An entity with no usable `id` throws.** It could not be named in a skip report.
  - **Who decides:** the tester, as an extension of criterion 19. The reviewer may overturn it.
- **`geometry_id` must be a string** wherever it is copied onto a draft. Otherwise the pair is reported under `notText`.
  - **Who decides:** tester.
- **Prompt values are filled verbatim, not trimmed** (criterion 7). A value that itself contains `{` would put a brace in a prompt. That is unguarded because no entity has one.
  - **Who decides:** the reviewer, on whether to add a guard. If added, it belongs to T-026, which brings new fields.

**Deliberately not done**
- **No `choices`, `level`, tags, or file writes.** These are out of scope per the brief.
- **No wiring into build or refresh.** Same reason.

**Contradictions with the brief**
- **None in the criteria.**
- **Sessions table.** This worker session's id, `cse_01FsXqnpENQjfQBQc9Pmhmfj`, is the **same** as the task-expander's. The orchestrated run reused one remote session id across both roles. The tester must not run under it. Owner: orchestrator / human, to start the tester in a session with a different id.

**How to run** (in `question-bank/`, after `bun install --frozen-lockfile`)
- `bun test src/generate.test.ts`
- `bun test`
- `bun run typecheck && bun run lint && bun run format:check`

**Tests made stale:** none.

## Verdict

_Written by `tester`._

## Notes

- **Why a draft and not a `Question`.** `openapi.yaml` requires `level`, and
  T-023 owns it. `choices` and `correctIndex` are T-022's. Emitting any of them
  here would mean inventing values that later tasks then have to undo.
- **The `map_click` call the queue entry handed to this task.** T-021's entry
  says "this task decides what goes in `choices` for it". This task cannot build
  `choices`, because those are distractors. What it can settle, and does, is the
  representation of the correct answer: the name is the label, and the
  `geometry_id` is carried beside it as a code. That keeps "a FIPS code is never
  a label" and "join on codes, never on names" both true. Criterion 29 makes the
  worker write it down so T-022 and T-051 inherit an answer rather than the question.
- **Picked over T-064, T-070 and T-084.** T-064 waits on T-040. T-070 waits on
  Q1. T-084 waits on T-070 (a). All three are as recorded in `tasks.md`, and
  nothing has changed since 2026-10-13.
- **Worker, 2026-10-15.** The brief matched the code. Nothing was already built, and the survey held. One surprise: the
  global `prettier` that `bun run format` resolved before `bun install` reformatted
  an unrelated existing test (`highest-point-metres-verify.test.ts`). I reverted it
  and nothing of it is committed. Run `bun install --frozen-lockfile` first so the
  pinned 3.9.6 is the one used.
- **Worker: id scheme.** I chose `gen:<templateId>:<entityId>` over a `q-…` id
  derived from the entity's postal code. It needs no lookup, it cannot collide
  with the hand-written ids, and it parses back unambiguously.
