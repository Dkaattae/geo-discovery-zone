# T-020 — Template record type and three templates

**Status:** blocked
**Next step:** human. The review approved the work but escalated it for the child-facing `tpl-click-the-map` prompt. The harness then refused the sweep. Apply `### Sweep to apply` under `## Review`, read the prompt, mark PR #79 ready and merge it.
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
| worker | 2026-10-13 | cse_01UpEFQfyRxWfuVGBtPaogEo (subagent spawned by the orchestrator; `$CLAUDE_CODE_REMOTE_SESSION_ID` reads the same id as the expander's row, so the tester must run in a different session) |
| tester | 2026-10-13 | cse_01UpEFQfyRxWfuVGBtPaogEo (subagent spawned by the orchestrator; same id as the worker's row, so independence rests on a fresh context window, not on a separate session) |
| reviewer | 2026-10-13 | cse_01UpEFQfyRxWfuVGBtPaogEo (subagent spawned by the orchestrator; same orchestrated run, fresh context window) |

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

**TL;DR:** built. `question-bank/src/templates.ts` holds the record, the three
templates and the validator; `templates.test.ts` covers them. Nothing else
changed. Full suite 1839 pass / 0 fail, typecheck, lint and format:check exit 0.
**Tests made stale: none.**

**Files changed**

- `question-bank/src/templates.ts` (new): `Template`, `TEMPLATES`,
  `DISTRACTOR_STRATEGIES`, `validateTemplate`. Also exports `QUESTION_FORMATS`,
  and the types `QuestionFormat`, `DistractorStrategy`, `AgeBand`, `EntityField`.
- `question-bank/src/templates.test.ts` (new): 17 worker tests.
- This brief. `types.ts` is **not** touched: the runtime lists of `Entity` keys
  and `EntityType` members live in `templates.ts`, tied by `satisfies`.

**Where each criterion lives**

| # | Where |
|---|---|
| 1 | `interface Template` (nine fields). `TEMPLATE_KEYS ... satisfies Record<keyof Template, true>` keeps the validator's key list in step with it |
| 2, 9 | `TEMPLATES` |
| 3, 20 | `DISTRACTOR_STRATEGIES = ["neighbours_first", "sibling_capitals_same_region"]`. **`"random"` is not in it** |
| 4–7 | `TEMPLATES` entries |
| 8 | `validateTemplate` on each entry returns `[]` |
| 10 | non-plain-object check first; whole body wrapped in `try/catch` (throwing getters, proxies) |
| 11 | missing-key and extra-key loops against `TEMPLATE_KEYS`; messages start with the key name |
| 12 | `ID_PATTERN` |
| 13 | `PLACEHOLDER = /\{([^{}]*)\}/g`; each token must be in `requires`. Also rejected (beyond the brief): empty `{}`, an unmatched brace, an empty prompt |
| 14 | `answer_field` must be in `requires` |
| 15 | `ENTITY_FIELD_SET ... satisfies Record<keyof Entity, true>`, looked up with `Object.hasOwn` (so `toString`, `__proto__` are rejected). Mutation checked by hand: adding `flag_url?: string` to `Entity` makes `bun run typecheck` fail with TS2741 at `templates.ts`; reverted |
| 16 | `ENTITY_TYPE_SET ... satisfies Record<EntityType, true>`; also rejects duplicates and non-arrays |
| 17 | `QUESTION_FORMATS`, copied from `openapi.yaml:1319` (nine values) |
| 18, 19 | type + `Number.isFinite` + range; `band === 1 \|\| 2 \|\| 3` |
| 21 | holds; worker test reads the 50 committed files |
| 22–24 | `git status` shows only the two new files plus the brief. `bun run build -- --offline` (exit 0) left `data/` byte-identical; no pipeline file imports `templates.ts` |
| 26 | no fetch, mock, transport or spawn in either file |
| 27 | all four gates exit 0 |

**Values chosen (criterion 7)**

- `tpl-identify-on-map`: `base_difficulty: 2`. Recognising one shape among four
  named choices is about as hard as the capital question the plan pins at 2.
- `tpl-identify-on-map`: `min_age_band: 1`. State shapes and names are fine
  for 6–8 year olds; nothing in it is uninteresting to them.
- `tpl-click-the-map`: `base_difficulty: 3`. No choices are offered, so the
  child has to find the state on the whole map. That is a step harder than
  picking from four.
- `tpl-click-the-map`: `min_age_band: 1`. Same reasoning as identify.
- `tpl-click-the-map` prompt: **`"Tap {name} on the map."`**. Short, one
  placeholder, no jargon. The reviewer reads it (brief, "Child-facing text").

**Judgment calls, with owners**

- **Validator stricter than the brief in places**: duplicates in `applies_to`,
  `{}` and unmatched braces, empty prompt. None contradicts a criterion.
  Reviewer to confirm.
- **`QUESTION_FORMATS` is a hand copy of the openapi enum**, not read from
  `openapi.yaml`. Nothing ties them yet. If they drift, T-024 (the API tag set)
  is the natural owner of a cross-check. Reviewer to decide whether that goes
  into `tasks.md`.
- **Strategy names are only names** (T-022 implements them). The doc comment
  says what each is meant to do, so T-022 has a starting point. T-022 may
  overturn it.

**Did not do**: no generation, strategy functions, level formula, `topic`
field, or country entities (all out of scope).

**Contradictions with the brief**: none. The brief's own Status line read
`awaiting approval` while `Approved:` named Dkaattae; I took the named approval
as the gate and started.

**How to run**: in `question-bank/`: `bun install --frozen-lockfile`, then
`bun test src/templates.test.ts`, `bun test`, `bun run typecheck`,
`bun run lint`, `bun run format:check`.

**Tests made stale**: none.

## Verdict

**TL;DR: pass.** All 27 criteria hold. 90 new tester tests in
`question-bank/src/templates-verify.test.ts` pass; full suite 1929 pass / 0 fail;
typecheck, lint and format:check exit 0. Next step: reviewer.

**Independence: weaker than a separate session.** This is an orchestrated run
(`runs/T-020-template-record.md` exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is
`cse_01UpEFQfyRxWfuVGBtPaogEo`, the same id as the worker's row, so the
session check proves nothing. My independence rests only on being a freshly
spawned agent with its own context window that did not see the worker's
reasoning, which depends on the orchestrator having spawned me correctly.

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | each entry has exactly the nine keys; a nine-field literal typechecks as `Template` |
| 2, 9 | pass | three entries, the three ids, distinct |
| 3, 20 | pass | both names present; `"random"` absent and rejected |
| 4 | pass | `tpl-capital-of` field for field against plan §1.2 |
| 5, 6 | pass | pinned fields; click prompt has only `{name}` |
| 7 | pass | both map templates: finite 0–18, band in {1,2,3} |
| 8 | pass | `validateTemplate` returns `[]` for each |
| 10 | pass | `null`, `undefined`, `42`, `"tpl-x"`, `[]`, `{}`: non-empty, no throw |
| 11 | pass | each of nine fields deleted is named; extra `topic` named |
| 12 | pass | four rejects, four accepts |
| 13, 14 | pass | `{name}` accepted/rejected by `requires`; no-placeholder prompt accepted; answer outside `requires` rejected |
| 15 | pass | `capitol`, `flag_url` rejected; `top_livestock`, `highest_point_m` accepted (as `requires` and as `answer_field`); empty and duplicate `requires` rejected. Mutation M1 (below): adding `flag_url?: string` to `Entity` makes `bun run typecheck` fail |
| 16 | pass | `["state"]` accepted; `[]`, `["province"]`, `["state","continent"]` rejected |
| 17 | pass | all nine openapi values accepted; `map-identify`, `text-mc` rejected |
| 18, 19 | pass | every listed boundary value |
| 21 | pass | 50 committed files, no gaps |
| 22 | pass | `git diff origin/main...HEAD` empty for `package.json`, `bun.lock` |
| 23 | pass | no diff under `data/`, `sample-data/`, `src/fixtures/`; `bun run build -- --offline` exit 0, tree unchanged after it; stdout identical to main's build (run in a worktree) apart from absolute paths; test asserts `build.ts`, `refresh.ts`, `normalize.ts` do not import `./templates` |
| 24 | pass | outside `question-bank/` only `tasks.md`, the brief and `runs/T-020-template-record.md` (the orchestrator's log) changed |
| 25 | pass | the only test-file change on the branch is the new `templates.test.ts` (plus mine) |
| 26 | pass | tests call `validateTemplate`/read `TEMPLATES` and the committed JSON; no fetch, mock, spawn or seam |
| 27 | pass | typecheck 0, lint 0, format:check 0, `bun test` 1929 pass / 0 fail |

**Mutations** (each reverted with `git checkout`, tree clean afterwards):

- **M1** `Entity` gains `flag_url?: string` → typecheck fails (1 TS error). Criterion 15's tie holds.
- **M2** difficulty upper bound 18 → 99: 1 tester test red.
- **M3** band 0 accepted: 1 red.
- **M4** answer-in-requires check off: 1 red.
- **M5** extra-key problem dropped: 1 red.
- **M6** placeholder check off: 1 red.
- **M7** id pattern `^.*$`: 4 red.
- **M8** click template `answer_field` → `name`: 1 red.
- **M9** `check` throws on `null`: 0 red. Equivalent mutant: the `try/catch` in `validateTemplate` still returns a non-empty list, which is what criterion 10 asks.

**Notes for the reviewer** (not failures):

- The click prompt is `"Tap {name} on the map."` (brief "Child-facing text").
- `QUESTION_FORMATS` is a hand copy of `openapi.yaml`'s enum; my criterion-17
  test pins the nine values from the openapi file as read today, not a live tie.
- **Test changes:** none needed; no pre-existing test touched.

## Review

**TL;DR: approved, escalated.** The code is small, tidy and inside the brief.
Re-run here: 1929 pass / 0 fail; typecheck, lint and format:check are clean.
**Escalated for one reason:** `tpl-click-the-map`'s prompt, `"Tap {name} on the
map."`, is new text a child will read. A person must read it before merging.

**Why escalated (envelope, `reviewer.md` §3)**

- **Child-facing text: yes.** `question-bank/src/templates.ts`, the
  `tpl-click-the-map` entry: `prompt: "Tap {name} on the map."`. It is short,
  has no jargon and reads at age six to eight. One question for the person:
  the app also runs with a mouse, where "Tap" is slightly off. "Find {name} on
  the map." fits both. Either wording passes every criterion.
- **Everything else is inside the envelope.** Tester passed. No dependency. No
  `openapi.yaml`, migration or plan change. No pre-existing test touched
  (`Test changes: none`). No product decision settled. The other two prompts
  already ship: `"Which state is highlighted?"` is the served bank's wording,
  and `"What is the capital of {name}?"` is plan §1.2's example.

**Checks**

- **Every role's work is in the PR.** Expander (`50eda07`, `656d902`), worker
  (`cec0bd4`), tester (`99e36fb`) and orchestrator commits are all on
  `claude/bold-noether-djxpzu`.
- **Lanes held.** The expander touched only `tasks/` and `tasks.md`. The tester
  touched only `templates-verify.test.ts` and the brief. The worker touched
  `templates.ts`, `templates.test.ts` and the brief.
- **Inside Constraints.** The diff is the new module, two new test files, the
  brief, the expander's `tasks.md` notes and `runs/T-020-template-record.md`
  (the orchestrator's log). `types.ts` was not touched.
- **Fits the codebase.** The `satisfies Record<keyof Entity, true>` sets give
  criterion 15's tie through typecheck rather than a test. That is the cheapest
  way to keep the list in step. `Object.hasOwn` instead of `in` is correct
  (`toString` and `__proto__` are rejected). The problem strings use the
  `field: message` shape, which T-021 can show directly. Nothing in it is
  speculative. The extra exports (`QUESTION_FORMATS`, `DistractorStrategy`,
  `AgeBand`, `EntityField`) are the types the record is made of, and T-021 will
  import them.
- **Docs are true.** No README describes templates yet, and none needs to until
  T-021 gives them a reader. The module's header comment says nothing imports
  it, which is true (the tester asserts it for `build.ts`, `refresh.ts` and
  `normalize.ts`).
- **Honesty intact.** No fixture, data or existing test moved. The tester ran
  nine mutations; the one survivor (M9) is an equivalent mutant, and the tester
  explained why.

**Findings.** None block.

- **Non-blocking, folded into T-024:** `QUESTION_FORMATS` is a hand copy. Under
  E-14 the backend is the source of truth, and `backend/app/models.py` already
  holds a `QuestionFormat` enum. T-024 emits `format` as an API tag, so it has
  to settle the tie anyway. Amended T-024 rather than opening a task.
- **Non-blocking, folded into T-021:** `tpl-click-the-map`'s answer is a
  `geometry_id`, and `grading.py:39` grades `map_click` by `choiceIndex`. T-021
  is the first code that builds a question from it, so T-021 has to decide what
  goes in `choices` for that format. A FIPS code must never reach a child as a
  label. `TEMPLATES` is also a mutable exported array, so T-021 should copy, not
  mutate. Both are one-line notes on T-021.

**Flags disposed**

- **Worker: validator stricter than the brief** (duplicate `applies_to`, `{}`,
  unmatched braces, empty prompt). **Accepted.** Each one would otherwise reach
  T-021 as a malformed question, and none contradicts a criterion.
- **Worker: `QUESTION_FORMATS` hand copy.** **Deferred to T-024**, amended above.
- **Worker: strategy doc comments.** **Deferred to T-022**, which owns the
  strategies and may rewrite the comments.
- **Worker: criterion-7 values** (identify 2/band 1, click 3/band 1).
  **Accepted** as stored inputs. Tuning them is T-023/T-025, as the brief says.
- **Tester: one session id across the run.** Deferred to `P-14`, which already
  owns it.

**The sweep was refused.** The auto-mode classifier refused the sweep command
("Irreversible Local Destruction": deleting this brief while editing `tasks.md`
and `PROGRESS.md`). Nothing from it was applied. Because this PR is escalated,
the status is `blocked`, not `sweep refused` (D-16), so the orchestrator's
one-hour fallback does not apply. PR #79 stays **draft** until the sweep rides
inside it.

### Sweep to apply

Apply on `claude/bold-noether-djxpzu`, in this order. Copy the text exactly.

1. **Delete** `tasks/T-020-template-record.md`.

2. **`tasks.md`: delete the whole T-020 entry.** That is from the line
   `### T-020 — Template record type and three templates · M · doing` up to,
   but not including, `### T-021 — Generator: entities × templates → questions · M · todo`.
   This removes the heading, its `**Depends on:** —` line, the four-line
   description and its `**Done when:**` line, plus the blank line after it.

3. **`tasks.md`, T-021:** directly after the line
   `question with a hole in it.`, insert:

   ```
   **Since T-020 (PR #79):** read `TEMPLATES` from `question-bank/src/templates.ts`
   and call `validateTemplate` on each before use. Copy the records, do not mutate
   them: `TEMPLATES` is an exported mutable array. `tpl-click-the-map`'s answer is a
   `geometry_id`, and `backend/app/grading.py:39` grades `map_click` by
   `choiceIndex`, so this task decides what goes in `choices` for it. A FIPS code
   must never be a label a child sees. T-051 owns the client side.
   ```

4. **`tasks.md`, T-022:** directly before the line
   `**Done when:** strategies are named on templates, not hardcoded, and a test`,
   insert:

   ```
   **Since T-020 (PR #79):** the naming half is done. Every template carries a
   `distractor_strategy` from `DISTRACTOR_STRATEGIES` in `templates.ts`, and its doc
   comment says what each name is meant to do. This task implements those names and
   may rewrite the comments.
   ```

5. **`tasks.md`, T-024:** directly after the line
   `already implements and filters on.`, insert:

   ```
   **Since T-020 (PR #79):** `QUESTION_FORMATS` in `question-bank/src/templates.ts`
   is a hand copy of the nine formats, with nothing tying it to the backend's
   `QuestionFormat` enum (`backend/app/models.py`), the source of truth under E-14.
   Emitting `format` makes that drift visible, so add the cross-check here. Whether
   a template carries `topic` is also this task's call: the record has nine fields,
   and the validator rejects a tenth on purpose.
   ```

6. **`tasks.md`, T-026:** directly after the line
   `infrastructure once T-021 lands:`, insert:

   ```
   **Since T-020 (PR #79):** each new template is an entry in `TEMPLATES` and must
   pass `validateTemplate`. A new distractor rule is a new name in
   `DISTRACTOR_STRATEGIES` plus T-022's implementation of it.
   ```

7. **`PROGRESS.md`, "Completed tasks":** directly after the heading
   `### Earlier tasks, on-process` and its blank line, before the T-078 entry,
   insert this, followed by one blank line:

   ```
   - **T-020 — the template record, three templates and a validator** (PR #79,
     2026-10-13). `question-bank/src/templates.ts` holds `Template` (plan §1.2's
     nine fields), `TEMPLATES` (`tpl-identify-on-map`, `tpl-capital-of`,
     `tpl-click-the-map`), `DISTRACTOR_STRATEGIES` (names only) and
     `validateTemplate`, which never throws. Its lists of `Entity` keys and
     `EntityType` members are tied to `types.ts` through `satisfies`, so a new
     entity field fails typecheck until it is listed. Nothing in the build imports
     it yet. The click prompt, `"Tap {name} on the map."`, is new child-facing text,
     so the PR was escalated for a person to read it.
     *Where it differed from the brief:* the validator is a little stricter than
     asked (duplicate `applies_to`, empty `{}`, unmatched braces, empty prompt).
     `QUESTION_FORMATS` is a hand copy of the backend's enum, and the cross-check
     went to T-024. The harness refused the reviewer's sweep. Run orchestrated,
     with one session id across the roles (`P-14`).
   ```

8. **`PROGRESS.md`, "Question bank — the pipeline":** directly before the line
   `- Tests cover the built bank across \`data-us-states.test.ts\` and`, insert:

   ```
   - **Question templates exist but generate nothing yet** (T-020):
     `src/templates.ts` holds the template record, three templates and a
     validator. T-021 is the first reader.
   ```

9. **Check, commit, push.** `grep -n "T-020" tasks.md` should show only the
   `Since T-020` notes and T-051's existing correction. Run `cd question-bank &&
   bun run format:check` (markdown is outside its glob, so this is a sanity
   check only). Then mark PR #79 ready, after reading the click prompt.

## Notes

- worker: the runtime key lists sit in `templates.ts` behind `satisfies Record<…, true>`, so `types.ts` did not need a change. That gives criterion 15's mutation rule through typecheck rather than through a test.
- worker: `Object.hasOwn`, not `in`, for the lookups. With `in`, `"toString"` would pass as an Entity field.
