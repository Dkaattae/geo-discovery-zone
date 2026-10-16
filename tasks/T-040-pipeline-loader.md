# T-040 — Loader: pipeline JSON → the served bank

**Status:** `answered — criteria to finish`
**Next step:** `task-expander` — Q1–Q3 answered under "Questions for a human";
finish the criteria against the answers
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-040
**Branch:** `claude/festive-edison-nuwc27`
**PR:** #88, opened draft at expand time from the branch above
**Fault:** the queue entry needs three product decisions an agent may not make (what happens to the 26 reviewed hand-written questions, whether generated question output is committed, and whether `map_click` is served before T-051); the expander halted rather than guess.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-16 | cse_01EuEUiM5FxMkMiBTb77d5NA |

## Why this task, and not T-026

The first queue entry whose `Depends on:` is met is **T-026** (§C). It was
skipped: its Done-when is "at least one new topic reaches the app end to end —
generated, **loaded**, selectable at Setup, and answerable", and nothing loads a
generated question into the served bank until this task lands. So T-026's
`Depends on:` is incomplete in the same way T-064's was, and T-040 is the
blocker. `PROGRESS.md` "Next" names T-040 first for the same reason. The note is
added to T-026's entry in `tasks.md`.

## Goal

Make the curated 50-state pipeline bank, and the questions generated from it,
what the app actually serves — replacing the 15 states and 26 questions that
were hand-copied into `backend/app/data/content.json` in PR #16.

## Survey — what is already true

- **Startup loading exists and is idempotent.** `store.ensure_content_loaded`
  (`backend/app/store.py:88`) reads `backend/app/data/content.json`, keys on a
  `content_version` derived from a sha256 of the file, and on a version change
  deletes every `EntityRow`/`QuestionRow` and reinserts. Called from
  `backend/app/main.py:61`. Re-running with an unchanged file is already a no-op.
- **The pipeline's question stages exist but nothing runs them end to end or
  writes their output.** `generate` → `buildChoices` → `seedLevels` →
  `tagQuestions` (`question-bank/src/{generate,distractors,seed-level,tags}.ts`)
  give 150 questions over the committed bank: 50 × `tpl-identify-on-map`
  (`map_identify`, topic `location`), 50 × `tpl-capital-of`
  (`multiple_choice`, topic `capital`), 50 × `tpl-click-the-map`
  (`map_click`, topic `location`). No file holds them (E-23: "Nothing in the
  build imports it").
- **Shapes do not match.** The pipeline entity is snake_case
  (`geometry_id`, `fun_facts: [{text, source_url, reviewed}]`,
  `population_rank`, …; e.g. `question-bank/data/us-states/us-state-co.json`).
  `content.json` and everything that reads a payload are camelCase:
  `grading.build_reveal` (`backend/app/grading.py:198`) reads
  `entity.funFact`, `entity.funFactDetail`, `entity.geometryId`,
  `question.shortExplanation`, `question.detailExplanation`,
  `question.highlightGeometryId`, `question.reveal`. Generated questions carry
  none of `reveal`, `shortExplanation`, `detailExplanation`.
- **Entity ids differ for one state.** `content.json` serves Louisiana as
  `us-state-lo` (lines 86, 492); the pipeline id is `us-state-la`. Stored
  profile `mastery` and `review_queue` are keyed by entity id.
- **The client renders two formats.** `frontend/src/components/Session.tsx`
  branches only on `map_identify` (line 203) and `multiple_choice` (line 212).
  A served `map_click` question would show a prompt with nothing to answer it
  (T-051). `choiceGeometryIds` (E-21) is in neither `openapi.yaml` nor
  `backend/app/models.py`.
- **Tests that pin today's bank** and would go red by design: 
  `backend/tests/test_content_api.py:28-29, 143-144, 162-164` (15 entities, 26
  questions); `backend/tests/test_region_vocabulary.py:106`
  ("still serves exactly those fifteen states");
  `question-bank/src/hand-check-levels-verify.test.ts` criterion 14 (pins
  `content.json` at `aa88101`). Each needs a Test change request (D-14, D-15),
  so **the tester step must be attended**.
- **`openapi.yaml` `topLivestock.description`** carries the wording slip T-068's
  reviewer filed against this task ("where no state has" → "where the state
  has").

## Questions for a human

Each is a decision `CLAUDE.md` or `process.md` reserves for a person. The
criteria below cannot be written as observable and bounded until they are
answered.

**Q1 — What happens to the 26 hand-written questions and the 15
`funFactDetail` texts?** They are reviewed child-facing prose. Generated
questions have no `shortExplanation`/`detailExplanation`, so a wrong answer on
one falls back to `"The answer is X."` (`grading.py:218`), and the pipeline has
no `funFactDetail` at all. Options:
- **(a) Replace.** Serve only generated questions and pipeline entities. The
  26 explanations and 15 fun-fact details stop being served (they stay in git).
- **(b) Keep both.** Serve the 26 hand-written questions alongside the
  generated ones. 15 states then have two near-identical questions per
  concept (`q-co-loc-1` and `gen:tpl-identify-on-map:us-state-co`), which
  doubles their weight in selection.
- **(c) Hand-written wins where it exists.** For the 15 states, serve the
  hand-written question for a (state, template) pair and drop the generated
  one; carry `funFactDetail` over onto the pipeline entity for those 15.
  Generated questions fill the other 35 states.

**Q2 — Is the generated question output committed?** `CLAUDE.md` and
`process.md` name "whether to commit generated output" as a person's call.
E-6 committed the *entity* bank for reasons that would carry over (CI cannot
rebuild live; diffs are reviewable), but it did not decide this. Options:
- **(a) Committed.** A `question-bank` command writes the tagged questions
  (and a Python command, or the same step, writes the served bank) to a
  tracked file; a test checks it equals a fresh offline regeneration, as
  `committed-bank.test.ts` does for entities. `ensure_content_loaded` keeps
  reading one committed file.
- **(b) Generated at image build.** The Dockerfile's Node stage runs the
  `question-bank` stages and hands the JSON to the Python stage. Nothing new
  is tracked, but `make -C backend test` and a local `uv run` then need a
  build step first.

**Q3 — Is `map_click` served before T-051 renders it?** The expander's
recommendation is **no**: exclude the 50 `tpl-click-the-map` questions, so the
`location` pool never hands the client a question it cannot answer, and leave
`choiceGeometryIds` in the contract to T-051. Confirm or overrule.

**Smaller, with a proposed default (say if you disagree):**
- **Louisiana's id** becomes `us-state-la`. Any stored `mastery` or
  `review_queue` entry for `us-state-lo` is orphaned rather than migrated —
  there is no production deployment yet (plan §5.4, hosting not chosen).

**Proposed split, if the answers make this larger than M:** (i) a
`question-bank` command that writes the tagged questions (E-23's unwired
stage), and (ii) the Python loader and the served-bank swap. (i) is useful on
its own and moves no served byte.

### Answers — from the repo owner, in the orchestrator session, 2026-10-16

Recorded verbatim by the orchestrator, which did not read the questions' detail
and adds no interpretation. The expander turns these into criteria.

> Q1, use the newly generated questions, but keep the hand written question in a folder, in case I need it. will purge them, after the whole app first round is done
>
> Q2, a but maybe just once a quarter, or once a month
>
> Q3, you can adjust the task order, put T051 before the map click.

## Acceptance criteria

**Draft — not for approval until Q1–Q3 are answered.** These hold whichever
way the questions go; the expander adds the decision-dependent ones (counts,
which questions, where the file lives, explanation handling) once answered.

1. After loading, `GET /api/v1/content/version`'s `counts.entities` is 50, and
   `GET /api/v1/entities` returns exactly the 50 ids in
   `question-bank/data/us-states/index.json`.
2. Every served entity's `name`, `capital`, `region`, `geometryId`,
   `population`, `populationRank`, `areaKm2`, `areaRank`, `borders`,
   `climateKid`, `landmark`, `topCrops` and `topLivestock` equal the
   corresponding pipeline file's values (absent where the pipeline value is
   absent or null; `[]` served as `[]`).
3. A served entity's `funFact` is the text of a `fun_facts` entry with
   `reviewed: true`; no text from an entry with `reviewed: false` appears in
   any served field. (All 50 are `reviewed: true` today; a test with one
   flipped to `false` must show it is not served.)
4. Every served question with `format: "map_identify"` has a
   `highlightGeometryId` equal to its entity's `geometryId`, and a correct
   answer to it returns a reveal whose `mapHighlightGeometryId` is that id.
5. Every served question passes the `Question` model in
   `backend/app/models.py` and has `choices` of length 4 with `correctIndex`
   in 0–3 and `choices[correctIndex]` equal to the generated answer.
6. Loading twice from unchanged inputs leaves `content_version`, every
   entity row and every question row unchanged.
7. Changing one entity field in the input and loading again changes
   `content_version` and serves the new value; nothing from the previous load
   remains (no entity or question whose id is absent from the new input).
8. A child's full session on topic `location`, and one on `capital`, run end
   to end against the loaded bank with no question the client cannot render
   (no format outside `map_identify` and `multiple_choice`, subject to Q3).
9. The loader is invoked by a command documented in `backend/README.md` and
   `conventions.md`, and `conventions-doc.test.ts` stays green.
10. `openapi.yaml`'s `topLivestock.description` reads "where the state has no
    honest standout" (not "where no state has").
11. No new dependency in any `package.json`, `pyproject.toml` or lockfile.
12. No test reaches the network.
13. The whole suite (`make -C backend test`, `bun test` and typecheck/lint in
    `frontend/` and `question-bank/`) is green, with every pre-existing test
    that this change makes stale handled through an approved Test change
    request, not edited by the worker.

## Out of scope

- Rendering `map_click` in the client (T-051), and adding
  `choiceGeometryIds` to the contract unless Q3 says to serve `map_click`.
- New templates or topics (T-026); Setup still offers location, capital, mixed.
- Level tuning (T-085) and the 0.7 mastery threshold (T-056).
- `store.candidate_questions` moving filtering into SQL (T-050).
- Deleting `question-bank/sample-data/` (T-064, which depends on this).
- Settling T-070's digest-guard question.
- The `includeAnswerKey` default (T-053).

## Constraints

- **Alembic owns the schema** (plan §5.3, E-1). No migration unless a column is
  genuinely needed; if one is, it is a migration, not `create_all`.
- The loader is Python, in `backend/` (plan §5.3); `DbSink` is not the path.
- E-6 stands: the entity input is the committed `question-bank/data/us-states/`.
- **Unreviewed text never ships** (`CLAUDE.md`).
- `openapi.yaml` follows the backend (E-14); update it to match, no ceremony.
- Dependencies: none without asking.
- Files expected to change: settled after Q1–Q2.

## Context

- `geoquizdataplan.md` §5.3 (two languages, one schema), §1.2 (templates),
  §1.4 (levels).
- `engineering-decisions.md` E-1, E-6, E-9, E-14, E-18, E-20, E-21, E-22, E-23.
- `backend/app/store.py:88` `ensure_content_loaded`; `backend/app/main.py:61`;
  `backend/app/grading.py:198` `build_reveal`; `backend/app/models.py`
  `Entity` (line 139), `Question` (line 181).
- `question-bank/src/generate.ts`, `distractors.ts`, `seed-level.ts`,
  `tags.ts`, `templates.ts`; `question-bank/data/us-states/`.
- `backend/app/data/content.json` (the bank being replaced).
- `frontend/src/components/Session.tsx:203-212` (formats the client renders).
- `tasks.md` T-040, T-026, T-050, T-051, T-064.

## Handoff

## Verdict

## Notes
