# T-024 — Emit the API tag set on generated questions

**Status:** `approved`
**Next step:** `human` — merge PR #84
**Approved:** Dkaattae (in the orchestrator session) — 2026-10-15. See `runs/T-024-emit-api-tag-set.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-024
**Branch:** `claude/friendly-archimedes-dw9utb`
**PR:** #84, opened draft at expand time, built from the branch above. Stays draft until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-15 | cse_0148WgLerEA66mjfXXfy932d |
| worker | 2026-10-15 | cse_0148WgLerEA66mjfXXfy932d (orchestrated subagent; `$CLAUDE_CODE_REMOTE_SESSION_ID` is the parent session's, so it matches the expander's row) |
| tester | 2026-10-15 | cse_0148WgLerEA66mjfXXfy932d (orchestrated run, same id: independence is a freshly spawned subagent context, not a separate session) |
| reviewer | 2026-10-15 | cse_0148WgLerEA66mjfXXfy932d (orchestrated subagent, same parent session id) |

## Goal

`GET /questions` filters on seven tags (plan §1.3, `openapi.yaml` `listQuestions`),
and the backend already stores and filters on all of them. Generated questions
carry only two of the seven (`format`, `level`). Without the other five, the
generated bank cannot be loaded (T-040) into something Setup's topic buttons
and the age-band filters can select from.

## What is already true (expander's survey)

- **`format`** is already on every draft, copied from the template
  (`question-bank/src/generate.ts`, `draftFor`), and carried unchanged through
  `buildChoices` (`distractors.ts`) and `seedLevels` (`seed-level.ts`).
- **`level`** is already on every question `seedLevels` returns
  (`seed-level.ts`, `seedLevels`, T-023, E-22). This task must not compute it
  again.
- **`format`'s value set** is already validated by `validateTemplate` against
  `QUESTION_FORMATS` (`templates.ts`). What is missing is anything tying
  `QUESTION_FORMATS` to the backend's `QuestionFormat` enum.
- **The committed bank** (`question-bank/data/us-states/`, 50 files plus
  `index.json`) gives every state `scope: "us"`, `type: "state"`, and a
  non-blank `region` (13 distinct values, E-9). Over that bank the pipeline
  `generate` → `buildChoices` → `seedLevels` yields 150 questions and no short
  pools (PROGRESS.md, T-022).
- **Missing:** `topic`, `scope`, `entityType`, `region`, `ageBand`, and the
  format cross-check. Nothing in `question-bank/` knows the topic set.

**Wire names.** The tags use `openapi.yaml`'s `Question` property names,
camelCase: `scope`, `entityType`, `topic`, `region`, `format`, `ageBand`,
`level`. The queue entry and plan §1.3 write `entity_type` / `age_band`; those
are the backend's Python attribute names. The draft already uses camelCase
(`entityId`, `templateId`, `correctIndex`), and `backend/app/store.py` reads
`question.get("ageBand")` from the served bank, so camelCase is what a loader
needs.

## Acceptance criteria

"The tag stage" below means a pure function, exported from a module under
`question-bank/src/`, that takes the questions `seedLevels` returned plus the
entities and templates that produced them (templates defaulting to
`TEMPLATES`) and returns the questions with the tags added. The worker names
it, and its module, in the Handoff. "The committed bank" means every
`us-state-*.json` under `question-bank/data/us-states/`, run through
`generate` → `buildChoices` → `seedLevels` → the tag stage with the default
templates.

**Shape**

1. The tag stage returns exactly one question per input question, in input
   order: output `[i].id` equals input `[i].id` for every `i`, and the lengths
   are equal. An empty input returns an empty array.
2. Over the committed bank the tag stage returns 150 questions, and every one
   carries all seven keys `scope`, `entityType`, `topic`, `region`, `format`,
   `ageBand`, `level`, none of them `null` or `undefined`.
3. No output question carries a key named `entity_type`, `age_band`,
   `min_age_band` or `entity_id`.
4. Apart from the five added keys (`scope`, `entityType`, `topic`, `region`,
   `ageBand`), every output question has exactly the input question's keys,
   each with a deep-equal value. In particular `id`, `entityId`, `templateId`,
   `prompt`, `answer`, `choices`, `correctIndex`, `highlightGeometryId`,
   `answerGeometryId` and `choiceGeometryIds` are unchanged where present.
5. The tag stage does not mutate its inputs: the questions, entities and
   templates arrays passed in are deep-equal before and after the call, and
   `TEMPLATES` is deep-equal before and after.
6. Calling the tag stage twice on the same inputs gives deep-equal outputs.

**Each tag's value**

7. `scope` equals the question's entity's `scope`. Over the committed bank it
   is `"us"` for all 150.
8. `entityType` equals the question's entity's `type`. Over the committed bank
   it is `"state"` for all 150.
9. `region` equals the question's entity's `region` verbatim — same case, same
   spaces, not slugged. For `us-state-co` questions it is `"Mountain West"`.
10. `topic` is `"location"` for every question from `tpl-identify-on-map`,
    `"location"` for every question from `tpl-click-the-map`, and `"capital"`
    for every question from `tpl-capital-of`. Over the committed bank that is
    100 `"location"` and 50 `"capital"`.
11. `ageBand` equals the question's template's `min_age_band`. Over the
    committed bank it is `1` for all 150. With a test template whose
    `min_age_band` is `2`, its questions get `ageBand: 2`; with `3`, `3`.
12. `format` on the output equals the question's template's `format`.
13. `level` on the output is the input question's `level`, strictly equal. An
    input question whose `level` was set by hand to a value `seedLevels` would
    not produce (for example `17.25`) comes out with `17.25`.

**Matches the schema** (`backend/app/models.py` is the source of truth, E-14)

14. Over the committed bank, every `topic` is a member of the backend's `Topic`
    enum, every `scope` of `Scope`, every `entityType` of `EntityType`, every
    `format` of `QuestionFormat`; every `ageBand` is an integer in {1, 2, 3};
    every `level` is a finite number in 0–18 inclusive; every `region` is a
    string that is non-blank after trimming.

**Holes and bad input**

15. An entity whose `region` is absent, `null`, `""` or whitespace-only yields
    questions with **no `region` key at all** (not `""`, not `null`), while
    the other six tags are still present. The tag stage does not throw for it.
16. A template with no topic defined for it never produces a question with a
    guessed or default `topic`. Passing the tag stage a question generated from
    such a template makes it throw, returning nothing, with a message that
    contains the template's id. (How a template gets a topic is the worker's
    call; the Handoff says how the tester constructs one without.)
17. A topic that is not one of the backend's ten `Topic` values (for example
    `"geography"`) cannot be assigned to a template: the attempt is refused —
    `validateTemplate` reports a problem, or the tag stage throws naming the
    template id — and no question carries it.
18. Every entry in `TEMPLATES` has a topic defined. A test fails if an entry is
    added to `TEMPLATES` without one.
19. A question whose `entityId` is not among the entities passed, or whose
    `templateId` is not among the templates passed, makes the tag stage throw,
    returning nothing, with a message that contains that question's `id`.

**Cross-checks against the backend**

20. A test in `cd question-bank && bun test` asserts that the set of values in
    `QUESTION_FORMATS` (`question-bank/src/templates.ts`) equals the set of
    values of `class QuestionFormat` in `backend/app/models.py`. Adding a
    member to either side alone, or removing one from either side alone, turns
    that test red.
21. `question-bank/src/` exports a runtime list of the topics it can assign,
    and a test asserts its set equals the set of values of `class Topic` in
    `backend/app/models.py`. Adding or removing a member on either side alone
    turns that test red.
22. Both cross-check tests fail — not pass and not skip — when
    `backend/app/models.py` cannot be read, or when the class they look for
    cannot be found in it, or when it yields zero values.

**What must not happen**

23. Nothing reachable from `question-bank/src/build.ts` or
    `question-bank/src/refresh.ts` imports the tag stage's module.
24. The PR changes no file under `question-bank/data/`, `question-bank/sample-data/`,
    `question-bank/src/fixtures/`, `backend/`, `frontend/` or `e2e/`, and does
    not change `openapi.yaml`.
25. No dependency is added or changed: `question-bank/package.json`'s
    `dependencies` and `devDependencies`, and `question-bank/bun.lock`, are
    unchanged.
26. No test added by this task reaches the network; the tag stage reads no
    file, no environment variable and no clock. (The cross-check tests in
    20–22 read `backend/app/models.py` from disk; that is the only file read
    this task's tests add.)
27. `cd question-bank && bun run typecheck`, `bun run lint`,
    `bun run format:check` and the whole `bun test` suite pass — every test
    that existed before this task included, except any deleted or modified
    under a Test change request a person approved (D-14, D-15).

**Record**

28. `engineering-decisions.md` gains one new entry, numbered with the next
    unused `E-n` (`E-23` at the time of writing), that states: the tag stage's
    name and module; where each of the five new tags comes from (entity
    `scope`, entity `type`, entity `region`, the template's topic, the
    template's `min_age_band`); the topic of each of the three templates; how a
    template gets its topic and why that way; the camelCase wire names; that a
    missing region omits the key; and where the two backend cross-checks live.
    Entries `E-1`–`E-22` are unchanged.

## Out of scope

- **Moving the generator's silent required-field rule into `validateTemplate`.**
  The queue made this conditional on putting the format cross-check *inside*
  `validateTemplate`. Criterion 20 puts it in a test, so the condition does not
  fire. `generate.ts` still silently adds `geometry_id` (for `map_identify`)
  and `name` (for a `geometry_id` answer). **Reviewer: carry this note forward
  in `tasks.md`** (it fits T-026, which adds templates) rather than dropping it.
- Writing generated questions to any file, or serving them (T-040).
- New templates or topics (T-026); weight tuning (T-025).
- `reveal`, `shortExplanation`, `detailExplanation`, `rating`,
  `timesAnswered`, `contested`, `imageUrl`, `pinTarget` — other `Question`
  properties.
- Cross-checking `Scope` or `EntityType` against the backend. Note:
  question-bank's `EntityType` (`types.ts`, `ENTITY_TYPE_SET` in
  `templates.ts`) has 9 members and the backend's has 11 (`continent`,
  `region` extra). Emitted values are a subset, so nothing here is wrong; do
  not "fix" it in this task.
- Changing `openapi.yaml`, the backend, or the hand-written
  `backend/app/data/content.json`.
- Any change to `generate`, `buildChoices` or `seedLevels`' output.

## Constraints

- **Files expected to change:** a new or existing module under
  `question-bank/src/` for the tag stage; possibly `templates.ts` (the topic
  list and however a template gets its topic); new test file(s) under
  `question-bank/src/`; `engineering-decisions.md`.
- **Stale-test warning — read before choosing how a template gets its topic.**
  Both designs satisfy the criteria. Adding `topic` as a tenth `Template`
  field makes at least these pre-existing tests stale, each needing an approved
  Test change request with a person attending the tester step (D-14, D-15):
  - `templates-verify.test.ts` › "T-020 criterion 1: Template has exactly the nine plan §1.2 fields"
  - `seed-level-verify.test.ts` › "criterion 23: every TEMPLATES entry has exactly the nine Template keys"
  - `generate-verify.test.ts:655` (`TEMPLATES` toEqual `T020_RECORDS`)
  - `distractors-verify.test.ts:811` (`TEMPLATES` toEqual `T020`)
  A topic assigned by template id, outside the record, keeps plan §1.2's nine
  fields and leaves those tests alone. Whichever is chosen, the Handoff lists
  every stale test under **Tests made stale**, and E-23 says why.
- **Invariants:** the tag stage is pure (no network, file, env, clock or
  randomness) and does not mutate its inputs. Unreviewed text is not involved:
  no tag is free text from a scraped source.
- **Content rule:** prefer a blank to a guess — a missing region is an absent
  key (criterion 15), and a missing topic is a refusal (criterion 16), never a
  default.
- **Dependencies:** none (criterion 25). `bun` only.
- **Tests:** below the transport; no seam, no `fetch` mock (`test-guidelines.md`).

## Context

Required reading for the worker and the tester.

- **Plan:** `geoquizdataplan.md` §1.2 ("Template record" — the nine fields),
  §1.3 (the tag table and the filters it serves), §1.4 (`age_band` is
  appropriateness, not difficulty).
- **Contract:** `openapi.yaml` `paths./questions.get` (`listQuestions`
  parameters) and `components.schemas.Question`, `Topic`, `Scope`,
  `EntityType`, `QuestionFormat`, `AgeBand`, `Level`.
- **Backend (source of truth, `engineering-decisions.md` E-14):**
  `backend/app/models.py` — `Topic`, `Scope`, `EntityType`, `QuestionFormat`,
  `Question`; `backend/app/store.py` around the question loader (reads
  `topic`, `region`, `ageBand` from the served bank) and the filters
  (`min_age_band` / `max_age_band` compare against the question's `age_band`).
- **Pipeline:** `question-bank/src/templates.ts` (`TEMPLATES`,
  `QUESTION_FORMATS`, `validateTemplate`), `generate.ts` (`QuestionDraft`),
  `distractors.ts` (`GeneratedQuestion`, `buildChoices`), `seed-level.ts`
  (`LeveledQuestion`, `seedLevels`), `types.ts` (`Entity`).
- **Decisions:** `engineering-decisions.md` E-9 (region vocabulary), E-14,
  E-20, E-21, E-22.
- **Served bank example:** `backend/app/data/content.json` `questions[]` shows
  the camelCase tag keys as the backend already loads them.
- `test-guidelines.md`, `conventions.md`.

## Handoff

**TL;DR.** Built the tag stage `tagQuestions` in new `question-bank/src/tags.ts`;
topics are assigned by template id in `TEMPLATE_TOPICS` (no tenth `Template`
field), so **no existing test goes stale**. Whole suite green (2134 pass, 0
fail), typecheck, lint and format:check clean. Next: tester.

**Files changed**

- **`question-bank/src/tags.ts`** (new): `tagQuestions(questions, entities,
  templates = TEMPLATES, topics = TEMPLATE_TOPICS)` and `TaggedQuestion`.
- **`question-bank/src/templates.ts`**: added exported `TOPICS` (the ten
  backend `Topic` values), type `Topic`, and `TEMPLATE_TOPICS` (template id →
  topic). `Template`, `TEMPLATES`, `validateTemplate` unchanged.
- **`question-bank/src/tags.test.ts`** (new): worker tests, incl. both backend
  cross-checks.
- **`engineering-decisions.md`**: new `E-23` appended; E-1–E-22 untouched.

**Where each criterion lives**

| # | Where |
|---|---|
| 1, 4, 13 | `tagQuestions` maps `{...question, scope, entityType, topic, region?, ageBand}`; nothing else touched, `level` copied |
| 2, 7–12, 14 | over the bank: `tags.test.ts` › "tagQuestions over the committed bank" |
| 3 | only camelCase keys are added |
| 5, 6 | no writes to inputs; builds new maps and objects |
| 15 | `region` spread only when `nonBlankString(region)`; otherwise no key |
| 16 | `topicFor` throws `tagQuestions: template <id> has no topic defined` |
| 17 | `topicFor` throws naming the template id when the topic is not in `TOPICS` |
| 18 | `tags.test.ts` › "every TEMPLATES entry has a topic in TOPICS" |
| 19 | throws `tagQuestions: question <id> names entity/template …` |
| 20, 21, 22 | `tags.test.ts` › "cross-checks against backend/app/models.py" (`backendEnum` parses `class <Name>(StrEnum):`; `readFileSync` throws if the file is missing; a `length > 0` assertion fails on a missing class or zero values) |
| 23 | `tags.ts` is imported only by `tags.test.ts` |
| 24, 25 | only the four files above changed; `package.json`/`bun.lock` untouched |
| 26 | `tags.ts` imports types and `templates.ts` only; no I/O |
| 27 | see How to run |
| 28 | `engineering-decisions.md` E-23 |

**How the tester constructs the hard cases**

- **Template with no topic (16):** any template whose `id` is not a key of
  `TEMPLATE_TOPICS`, e.g. `{ ...capitalOf, id: "tpl-orphan" }`, run through
  generate → buildChoices → seedLevels with `[orphan]`, then
  `tagQuestions(qs, entities, [orphan])`. The 4th argument defaults to
  `TEMPLATE_TOPICS`.
- **Bad topic (17):** pass the 4th argument: `tagQuestions(qs, entities,
  [orphan], { "tpl-orphan": "geography" })`. It is typed
  `Readonly<Record<string, unknown>>` so no cast is needed.
- **Age band 2/3 (11):** `{ ...capitalOf, min_age_band: 2 }` keeps id
  `tpl-capital-of`, so it has a topic.

**Deliberately not done**

- **No `topic` field on `Template`**, per the brief's stale-test warning;
  reasoning in E-23.
- **`validateTemplate` does not check topics.** The record has no topic field;
  criterion 17 is met by the tag stage throwing.
- **PROGRESS.md not updated** (line ~206 still says "A question has no tags yet
  (T-024)"). Reviewer to update in the sweep.

**Beyond the brief (flag)**

- **A `format` mismatch throws.** If a question's `format` differs from its
  template's, `tagQuestions` throws naming the question, rather than keeping
  one silently. Criteria 4 and 12 would otherwise conflict for such input. No
  pipeline output triggers it. Reviewer to confirm or overturn.

**Contradictions with the brief:** none found.

**How to run**

```bash
cd question-bank && bun install --frozen-lockfile   # node_modules was absent in this env
bun test src/tags.test.ts
bun test && bun run typecheck && bun run lint && bun run format:check
```

Caution: without `bun install`, `bun run format` falls back to a global
prettier 3.8.1 and rewrites two unrelated test files. I reverted that; the
committed tree is formatted by the pinned 3.9.6.

**Tests made stale:** none.

## Verdict

> **TL;DR. Pass.** All 28 criteria hold. My verify file
> (`question-bank/src/tags-verify.test.ts`, 46 tests) is green, and so is the
> whole gate: `bun test` 2180 pass / 0 fail, `typecheck`, `lint`, `format:check`
> exit 0. 33 mutations (source, `templates.ts`, `backend/app/models.py`), each
> reverted, each turned at least one test red. Next: **reviewer**.

**Independence, stated plainly.** This run is orchestrated
(`runs/T-024-emit-api-tag-set.md` exists), so `$CLAUDE_CODE_REMOTE_SESSION_ID`
(`cse_0148WgLerEA66mjfXXfy932d`) is the same as the expander's and worker's
rows. The id check proves nothing here. My independence rests on being a freshly
spawned subagent with its own context: I did not watch the work and cannot see
the worker's reasoning. That is weaker than a separate session, because it rests
on the orchestrator having spawned me correctly, not on anything I can check.

**Expected values** came from the criteria, `backend/app/models.py` and the
committed bank. `tags.ts` was read for the signature
`tagQuestions(questions, entities, templates?, topics?)` and the export names
(`TOPICS`, `TEMPLATE_TOPICS`) only.

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | `criterion 1` tests: ids/length over bank, reversed input stays reversed, `[]` → `[]` |
| 2 | pass | 150 out; all seven keys own, non-null, non-undefined |
| 3 | pass | no `entity_type`/`age_band`/`min_age_band`/`entity_id` |
| 4 | pass | keys = input keys + the five exactly (+ four on a region hole); every input key deep-equal; the ten named fields checked |
| 5 | pass | deep-equal before/after (questions, entities, templates, `TEMPLATES`); deep-frozen inputs do not throw; outputs are new objects |
| 6 | pass | two calls deep-equal |
| 7, 8 | pass | 150 `us` / `state`; and an entity changed to `world` / `country` changes only its questions (not hard-coded) |
| 9 | pass | equals entity's region; CO = `Mountain West`; `"  mountain  WEST "` kept verbatim |
| 10 | pass | per-template topic; 100 location / 50 capital |
| 11 | pass | 150 × `1`; `min_age_band` 2 and 3 on capital-of give 2 / 3 to its questions only |
| 12 | pass | format equals template's per question |
| 13 | pass | `Object.is` level per question; hand-set `17.25` survives |
| 14 | pass | members of `Topic`/`Scope`/`EntityType`/`QuestionFormat` parsed independently from models.py; ageBand integer in {1,2,3}; level finite 0–18; region non-blank trimmed |
| 15 | pass | absent / `null` / `""` / whitespace: no `region` key, other six present, no throw, other states keep theirs |
| 16 | pass | orphan template mixed with good questions throws naming it, returns nothing; `{}` topic map refuses `tpl-capital-of` |
| 17 | pass | `geography` on new and on existing template throws naming it; `null`/`undefined`/`""`/`"Capital"`/`1` refused; valid `landmark` honoured |
| 18 | pass | every `TEMPLATES` id in `TEMPLATE_TOPICS`, value in backend `Topic`; mutation dropping click's entry turns it red |
| 19 | pass | unknown entity (mixed in), entity omitted from input, template omitted: each throws with the question id, returns nothing |
| 20 | pass | by mutation of the worker's `tags.test.ts` cross-check (below) |
| 21 | pass | by mutation of the worker's test, plus my own independent `TOPICS` = `class Topic` set test |
| 22 | pass | models.py moved away, emptied, class renamed, class reduced to `pass`: the cross-check tests **fail**, none skip |
| 23 | pass | transitive relative-import walk from `build.ts` + `refresh.ts` excludes `tags.ts`; mutation adding the import turns it red |
| 24 | pass | `git diff --name-only origin/main...HEAD`: `engineering-decisions.md`, `question-bank/src/{tags,tags.test,templates}.ts`, `runs/…`, `tasks.md`, `tasks/…`. Nothing under the forbidden paths, `openapi.yaml` untouched |
| 25 | pass | same diff: `package.json`, `bun.lock` unchanged |
| 26 | pass | static scan of `tags.ts` and its runtime imports (`./templates` only) for fs/env/clock/random/fetch; both T-024 test files pass with all proxy vars pointed at `127.0.0.1:1` |
| 27 | pass | 2180 pass / 0 fail (2134 before my file), typecheck, lint, format:check exit 0 |
| 28 | pass | one `E-23`, highest number; names stage, module, sources, three topics, camelCase, region omission, `tags.test.ts`; `git diff d10edd5 HEAD -- engineering-decisions.md` removes no line |

**Mutations** (each applied by script, reverted, `git status` clean after):

| Mutation | Worker's `tags.test.ts` | My verify file |
|---|---|---|
| models.py `Topic` + `geography` / − `elevation` | red (TOPICS cross-check) | red |
| models.py `QuestionFormat` + `quiz` / − `click_profile` | red (QF cross-check) | — (not mine) |
| `TOPICS` + `geography` / − `elevation` | red | red |
| `QUESTION_FORMATS` + `quiz` / − `click_profile` | red | — |
| class `Topic` / `QuestionFormat` renamed | red | red |
| class body reduced to `pass` (zero values), each | red | red |
| models.py emptied; models.py moved away | red (fail, 0 skip) | red |
| region `""` on hole; whitespace region kept | red | red |
| region trimmed | **green** | red |
| missing topic defaults to `location` | red | red |
| topic membership check removed | red | red |
| `scope` / `entityType` hard-coded | **green** | red |
| `ageBand` constant 1 | red | red |
| `level` rounded | red | red |
| unknown entity skipped; filter instead of throw (partial output) | red | red |
| input question mutated | red | red |
| `age_band` key added | red | red |
| first question dropped | red | red |
| `TEMPLATE_TOPICS` click → capital; click entry removed | red | red |
| `build.ts` imports `./tags` | **green** | red |
| `tags.ts` reads `process.env` | **green** | red |

The worker's file alone misses four mutations; my file catches all of them.

**For the reviewer:**

- **Format-mismatch throw (worker's flag).** Not exercised by any criterion; it
  does not fire on pipeline output. Confirm or overturn.
- **PROGRESS.md** still says questions have no tags (worker's note).
- **Out-of-scope carry-forward**: the `generate.ts` silent required-field note
  belongs in `tasks.md` (T-026), per the brief.
- **Tests made stale:** none found. Topic is keyed by id, so the four pinned
  nine-field tests are untouched and still green.

## Review

> **TL;DR. Approve, inside the envelope.** `tagQuestions` is small, pure, and
> written in the same idiom as `seedLevels` and `buildChoices`. Nothing landed
> outside the Constraints, and no pre-existing test changed. Gate re-run here:
> `bun test` 2180 pass / 0 fail; typecheck, lint and format:check clean.
> PR #84 marked ready, with no escalation note. Next: Dkaattae merges.

**Commits and lanes**

- **Every Sessions row has a commit in PR #84**: expander `7f72993`/`9098cd1`,
  worker `033b6ec`, tester `5588c60`, plus the orchestrator's run-log commits.
- **Expander** touched only `tasks.md` and `tasks/`. **Tester** touched only
  `tasks/` and a new test file (`tags-verify.test.ts`), no source.
  **Worker** touched `tags.ts`, `tags.test.ts`, `templates.ts`,
  `engineering-decisions.md` and the brief, all within Constraints.

**Quality**

- **Fits the codebase.** The first-wins `Map` lookup over entities and
  templates, the resolve-then-map "throw before returning anything" shape, the
  `tagQuestions:` error prefix and keying a per-template value by id (like
  `LEVEL_SEED_WEIGHTS.concept_load`) all match `seed-level.ts` and
  `distractors.ts`.
- **Not more than needed.** The fourth `topics` parameter exists so tests can
  build a template with no topic, or a bad one (criteria 16 and 17). The same
  pattern exists in `seedLevels`'s `templates` default.
- **Docs true.** E-23 matches the code. The `PROGRESS.md` line "A question
  has no tags yet" was stale; it is fixed in the sweep.
- **Honesty intact.** No fixture, data or pre-existing test changed. The
  tester's mutation table shows four gaps in the worker's own tests, and the
  tester's file closes them.

**Flags disposed of**

- **Format-mismatch throw (worker):** confirmed. A question whose `format`
  disagrees with its template is not something to pick a side on silently
  (CLAUDE.md, "Flag uncertain data"). The throw costs nothing on pipeline
  output.
- **Topic by id, not a tenth `Template` field (worker, E-23):** confirmed. It
  keeps plan §1.2's nine-field record and the four pinned tests. Criterion 18's
  test catches a template added without a topic. T-026 is amended to say a new
  template needs a `TEMPLATE_TOPICS` entry.
- **The generator's silent `geometry_id` / `name` rule (brief, Out of scope):**
  carried into T-026 as instructed.

**Non-blocking findings:** none needed a new entry. T-040 is amended because
the tag stage is now the last stage it wires: nothing writes questions yet, and
`region` can be absent, which the backend's `region: str | None` accepts.

**Envelope:** tester pass; suite, typecheck, lint and format green; changes
outside Constraints are only `runs/` (orchestrator log), `tasks.md` and the
sweep; no dependency; no `openapi.yaml`, migration or plan change; no
child-facing text (the tags are enum values and copied region names); `Test
changes: none`, and the diff modifies no pre-existing test; no product
decision settled (the topic values were in the person-approved criteria).

## Notes

- Worker: chose topic-by-id (`TEMPLATE_TOPICS`) over a tenth `Template` field to keep plan §1.2's record and the four pinned tests intact; same keying as `LEVEL_SEED_WEIGHTS.concept_load`. Owner to confirm: reviewer (E-23).
- Worker: the session id in Sessions is shared with the expander because both ran as subagents of one orchestrated session. The tester should record its own and judge isolation from that.

- Picked T-024 as the first task whose dependencies are done. Skipped: T-064
  (depends on T-040), T-070 (waiting on Q1), T-084 (sequenced after T-070 (a);
  proposed split still undecided).
