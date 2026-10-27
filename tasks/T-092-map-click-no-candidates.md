# T-092 — Stop generating candidates for `map_click`

**Status:** `test changes requested`
**Next step:** `human` — approve or refuse the Test change request below, in a `tester` session you attend
**Approved:** orchestrator — 2026-10-27, unattended run. See `runs/T-092-map-click-no-candidates.md`.
**Test changes:** `requested`
**Fault:** 24 pre-existing tests (and the typecheck of 7 test files) pin candidates on `map_click` that this task removes by design; test changes are waiting for a person's approval.
**From:** [`tasks.md`](../tasks.md) T-092
**Branch:** `claude/tender-feynman-fv9k0l`
**PR:** #100, opened draft at expand time against the branch above

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-27 | cse_011oDiJe6KxQ3qitLn4NjWjF (spawned by the orchestrator; shared session id) |
| task-expander | 2026-10-27 | session_011oDiJe6KxQ3qitLn4NjWjF (spawned by the orchestrator; froze the criteria for Q1 = (a)) |
| worker | 2026-10-27 | cse_011oDiJe6KxQ3qitLn4NjWjF (spawned by the orchestrator; `CLAUDE_CODE_REMOTE_SESSION_ID`, shared with the roles above — the tester should note it runs in a fresh context, not a different id) |
| tester | 2026-10-27 | cse_011oDiJe6KxQ3qitLn4NjWjF (spawned by the orchestrator in a fresh context; the id is shared, so separation from the worker rests on the spawn, not on the id) |

## Q1 — resolved: (a), keep every level as it is

**Answer — the person, 2026-10-27, in the orchestrator's session, verbatim: "a".**

**Why there was a question.** The queue entry asks for no candidates on
`map_click` *and* an unchanged `content.json`. `seedLevels`
(`question-bank/src/seed-level.ts:170-200`) adds `near_distractor_weight` (0.5) ×
the number of near distractors, and for `map_click` finds them through
`choiceGeometryIds` (`seed-level.ts:144`). In the committed file 48 of 50
`map_click` questions have 3 near distractors, 1 has 2, 1 has 0, and `level` is
served (`MAP_CLICK_FIELDS`).

**What (a) means for this task.** The level stage keeps computing, internally,
the three nearest candidates a `map_click` question would have had and counts the
near ones, exactly as today; it stops *writing* them. So every `map_click` level,
and `content.json`, stay byte-identical, and a `map_click` draft is still dropped
into `shortPools` whenever it is today. Options (b) and (c) — dropping the
distractor term, or moving its weight into `concept_load` — were not chosen and
are out of scope.

## Goal

A `map_click` question offers no candidates (E-29), but the generator still
writes four of them into the question file. Dead data invites a later reader to
wire it back into the app; the question file should say what is served.

## Acceptance criteria

Already true and not to be rebuilt: `content_build.py` never serves `choices`,
`correctIndex` or `choiceGeometryIds` on a `map_click` question
(`_served_map_click`, `MAP_CLICK_FIELDS`); grading is by `answerGeometryId`
(`grading.py`, E-29).

**The question file**

1. No question in `question-bank/data/questions/us-states.json` with
   `format: "map_click"` has a `choices`, a `correctIndex` or a
   `choiceGeometryIds` key — not as `null`, not as `[]`, absent.
2. The file still holds exactly 50 `map_click` questions, one per state, with the
   same ids, in the same positions, as the default branch's file.
3. Each `map_click` question's keys other than the three in criterion 1 and
   `level` — `id`, `entityId`, `templateId`, `format`, `prompt`, `answer`,
   `answerGeometryId`, `scope`, `entityType`, `topic`, `region`, `ageBand` —
   have the same values as on the default branch, and the question has no key
   the default branch's question lacked.
4. Every question whose `format` is not `map_click` (365 of them) deep-equals
   the default branch's question with the same id, `level` included, and the
   file's `count` and total question count are 415, as on the default branch.
5. The committed question file is byte-identical to what
   `cd question-bank && bun run ./src/write-questions.ts` writes from the
   committed entity bank.

**The stages, beyond the committed data**

6. Run over any entity bank — including a synthetic one a test builds, not only
   the committed 50 — the questions the pipeline produces for a `map_click`
   draft carry none of `choices`, `correctIndex`, `choiceGeometryIds`. (Today
   `buildChoices` in `distractors.ts`, then `seedLevels`, produce them; the
   worker may move this, and the criterion follows the output, not the
   function.)
7. Over the same synthetic bank, a `multiple_choice` or `map_identify` question
   still carries `choices` (length 4) and a `correctIndex` with
   `choices[correctIndex] === answer`, and carries no `choiceGeometryIds`.
8. Every `map_click` question's `level` in the committed question file equals
   the default branch's level for the question with the same id.
9. For a synthetic entity bank a test builds, every `map_click` question's
   `level` equals the level the default branch's stages compute for the same
   input — including a case where some of the three nearest peers border the
   state or share its region (so the near-distractor term is non-zero) and a case
   where none do.
10. For the same synthetic inputs, the `shortPools` entries for `map_click`
    drafts — `draftId`, `found` and `reason` — are the same as the default
    branch's stages report. In particular:
    - state's own `centroid` usable, two eligible peers (same `type` and `scope`, a usable `centroid`, a
      non-blank `geometry_id`, a distinct name) → a `shortPools` entry with
      `found: 2`, `reason: "too_few_candidates"`, and no question;
    - state's own `centroid` usable, three eligible peers → a question, and no `shortPools` entry;
    - state with no usable `centroid`, any number of peers → a `shortPools`
      entry with `reason: "no_centroid"`, and no question.

**The served bank**

11. `make -C backend content` writes bytes identical to the committed
    `backend/app/data/content.json` (the existing drift guard holds).
12. The committed `backend/app/data/content.json` is byte-identical to the
    default branch's.

**Words**

13. `engineering-decisions.md` E-29 gains a dated paragraph naming T-092 that
    says the generator no longer writes candidates for `map_click`, and that a
    `map_click` level still counts the near distractors of the three nearest
    peers it would have offered, computed internally and not written, so served
    levels did not move (Q1 answer (a)). E-1 to E-28 are
    byte-identical to the default branch, and there is no new `## E-n` heading.
14. No comment or docstring in `question-bank/src/` (non-test files) or in
    `backend/app/content_build.py` still says the question file holds candidates,
    `choices`, `correctIndex` or `choiceGeometryIds` for `map_click` questions
    (today: `content_build.py`'s comment above `MAP_CLICK_FIELDS`,
    `distractors.ts`'s header and the `choiceGeometryIds` field doc,
    `question-file.ts`'s header).

**What must not happen**

15. No new dependency, and no change to any `package.json`, `bun.lock`,
    `pyproject.toml` or `uv.lock`.
16. Nothing under `frontend/`, `e2e/`, `backend/migrations/`, and no change to
    `openapi.yaml`, `backend/app/grading.py` or any `backend/app/` file other than
    `content_build.py` (comments only). `backend/app/data/content.json` is not
    changed at all.
17. No test reaches the network, and no child-facing text changes: every
    `prompt`, `choices` entry and `funFact` served in `content.json` is identical
    to the default branch's.
18. The full suites pass: `cd question-bank && bun test`, `cd frontend && bun
    test`, `make -C backend test`.

## Out of scope

- Any other format's distractors, ordering or caps (T-088, T-091).
- What the server sends alongside a `map_click` question (T-053), and the
  answer key on other formats (T-045).
- Re-tuning any level weight, changing what the level formula counts for
  `map_click` (Q1 options (b) and (c)), or re-running E-26's measurement.
- The digest-guard policy (T-070). Guards this change turns red go through a
  Test change request, not a re-pin policy.
- Dropping `answer` from `map_click` questions: it is the state's name, E-20's
  label beside the code, and stays.

## Constraints

- Files expected to change: `question-bank/src/distractors.ts` and/or
  `question-bank/src/seed-level.ts` (whichever stage the worker chooses),
  `question-bank/data/questions/us-states.json` (regenerated, never hand-edited),
  comments in `question-file.ts` and `backend/app/content_build.py`,
  `engineering-decisions.md` (E-29 only). Not `backend/app/data/content.json`,
  and not `LEVEL_SEED_WEIGHTS`.
- The level stage needs the would-be candidates without the question carrying
  them: however the worker routes them (an internal value, a side structure, a
  recomputation), none of it may reach a question object the file or
  `buildQuestionBank`'s returned `questions` holds.
- Expect stale tests. Known candidates, for the worker's **Tests made stale**
  list (the worker never edits them): `distractors.test.ts` and
  `distractors-verify.test.ts` (`choiceGeometryIds` on `map_click`),
  `seed-level-verify.test.ts`, `tags-verify.test.ts`,
  `backend/tests/test_t051_tester_criteria.py:570` (asserts four
  `choiceGeometryIds` on a question-file `map_click` question), and any digest
  or byte pin over `us-states.json`. **Plan to attend the tester step.**
- `seed-level-loose-ends-verify.test.ts` criterion 12 pins E-1..E-23 and
  `test_t089_tester_criteria.py` criterion 13 pins E-1..E-27 bytes and exactly 29
  headings — criterion 12 above is written to stay inside both.
- Content rules (`CLAUDE.md`): no prompt or choice text changes.

## Context

- `engineering-decisions.md` **E-29** (no candidates; its "Revisit when the
  generator stops writing candidates"), **E-21** (distractors, `choiceGeometryIds`),
  **E-22** (level seeding, `LEVEL_SEED_WEIGHTS`), **E-20** (`map_click` draft
  shape), **E-24** (served allowlist), **E-26** (levels measured at 365 served).
- `geoquizdataplan.md` §1.2 (generation, distractors) and §1.4 (the level
  formula, `distractor_tightness`).
- `question-bank/src/distractors.ts` (`questionFor`, `nearestDistractors`,
  `isClick`), `seed-level.ts` (`entitiesForChoice`, `nearDistractorCount`,
  `levelFor`), `question-file.ts` (`buildQuestionBank`, `renderQuestionFile`),
  `write-questions.ts`.
- `backend/app/content_build.py` (`MAP_CLICK_FIELDS`, `_served_map_click`),
  `backend/tests/test_content_build.py` (drift guard),
  `backend/tests/test_t051_map_click.py`.
- `tasks.md` T-092 (the queue entry).

## Handoff

**TL;DR.** `map_click` questions now leave the stages with no `choices`,
`correctIndex` or `choiceGeometryIds`; every level, every `shortPools` entry and
`content.json` are unchanged (Q1 = (a)). 23 question-bank tests, 1 backend test
and the question-bank typecheck (7 test files) go red **by design** — listed
under **Tests made stale**; the tester needs a Test change request for them.

### What changed, file by file

- **`question-bank/src/distractors.ts`**
  - `GeneratedQuestion.choices` / `.correctIndex` are now optional (absent on
    `map_click`); the `choiceGeometryIds` field is gone from the type.
  - New `distractorsFor` (private): the old head of `questionFor` — `no_centroid`
    check, then `nextRankedByArea` or `nearestDistractors`. Unchanged logic.
  - New exported `clickDistractorsFor(draft, own, template, entities)`: the
    `geometry_id`s of the three would-be peers, or the `ShortPool`. Never written
    to a question.
  - `questionFor`: a `map_click` draft that has three distractors returns
    `{ ...draft }` (no candidate keys); otherwise unchanged.
  - `buildChoices` separates results by `"reason" in out` instead of
    `"choices" in out` (a click question has no `choices`).
  - Header and docs rewritten (criterion 14).
- **`question-bank/src/seed-level.ts`**
  - `nearDistractorCount` now goes through `distractorEntities`: for `map_click`
    it calls `clickDistractorsFor` and, for each code, takes the peers with that
    `geometry_id` — exactly what `entitiesForChoice` did via
    `choiceGeometryIds[i]` before. Other formats read `choices` as before.
  - Throws, naming the question, if a `map_click` question's inputs no longer
    give three peers, or a choice-format question has no `choices`.
- **`question-bank/src/question-file.ts`** — header comment only.
- **`question-bank/data/questions/us-states.json`** — regenerated with
  `bun run ./src/write-questions.ts`, never hand-edited (−650 lines: the three
  keys on 50 questions).
- **`backend/app/content_build.py`** — module docstring and the comment above
  `MAP_CLICK_FIELDS`. Comments only.
- **`engineering-decisions.md`** — E-29: new dated T-092 paragraph, placed
  *before* the `**Revisit when**` line (`test_t051_tester_criteria.py::test_c39_e29_ends_with_a_revisit_when_line`
  requires E-29 to end with it). I also dropped the now-fired trigger "the
  generator stops writing candidates for `map_click`" from that line and added
  "a `map_click` level should stop counting distractors it never offers (Q1 (b)/(c))".
- **`question-bank/src/map-click-no-candidates.test.ts`** — new, worker's own
  tests (8): no candidate keys out of `buildChoices`, `seedLevels` and
  `buildQuestionBank`; click levels for 3 / 2 / 0 near peers; the throw; the
  three `shortPools` cases of criterion 10.

### Where each criterion lives

| # | Where | Worker's own check |
|---|---|---|
| 1–4 | regenerated `us-states.json` | script vs `HEAD`'s file: 415 = 415, `_source` equal, same ids in order, 50 `map_click` with no candidate keys and every other key equal (level included), 365 others deep-equal |
| 5 | `write-questions.ts` | file regenerated by it; a re-run gives no diff |
| 6, 7 | `questionFor` in `distractors.ts` | `map-click-no-candidates.test.ts` |
| 8 | `seedLevels` → `distractorEntities` | covered by the 1–4 script |
| 9, 10 | `clickDistractorsFor`, `distractorsFor` | scratch script (not committed) ran old (`HEAD` copies of `distractors.ts`/`seed-level.ts`) vs new stages over the committed bank and 300 random synthetic sub-banks (2–9 states, random null centroids, blank/null `geometry_id`s, shared regions, duplicate names): identical `shortPools` and levels everywhere, 871 synthetic click questions. The tester should build its own. |
| 11, 12 | `make -C backend content` | run: `content.json` not modified (`git status` clean for it) |
| 13 | E-29 | see above; E-1..E-28 untouched, no new heading |
| 14 | comments in `distractors.ts`, `question-file.ts`, `content_build.py`, `seed-level.ts` | grep for `choiceGeometryIds` in non-test `question-bank/src` finds nothing |
| 15–17 | — | no dependency or lockfile change; nothing under `frontend/`, `e2e/`, migrations, `openapi.yaml`, `grading.py` |
| 18 | — | see "How to run"; reds listed below |

### Deliberately not done

- **No edit to any existing test**, including the stale ones (D-14).
- **`content_build.py`'s `_source.note`** ("A map_click question is served
  without candidates…") left alone: it is written into `content.json`, and
  criterion 12 forbids that file changing. It is still true.
- **E-21 / E-22 text** still mention `choiceGeometryIds`; criterion 13 pins
  E-1..E-28 byte-identical, so the E-29 paragraph records that it is gone.
- **Type design**: I made `choices` / `correctIndex` optional rather than a
  discriminated union, because `LeveledQuestion` and `TaggedQuestion` are
  interfaces that extend `GeneratedQuestion` and an interface cannot extend a
  union. Either honest type breaks the same test files' typecheck. **Reviewer
  to confirm or ask for the union** (it would touch `tags.ts` too).

### Contradictions with the brief

- None in the criteria. The Constraints' stale-test list is right but incomplete:
  the typecheck also breaks in three files that pass at runtime
  (`t026-templates.test.ts`, `t026-tester-verify.test.ts`,
  `climate-far-phrases.test.ts`), because the type now says `choices` may be absent.

### How to run

```bash
cd question-bank && bun install --frozen-lockfile && bun test && bun run typecheck && bun run lint && bun run format:check
cd question-bank && bun run ./src/write-questions.ts && git diff --exit-code data/questions/us-states.json
make -C backend content && git diff --exit-code backend/app/data/content.json
make -C backend test lint format-check
cd frontend && bun test
```

Results on this branch:

- **question-bank**: 2349 pass, 23 fail (all listed below); lint, format clean;
  typecheck fails only in the 7 test files below (source compiles).
- **backend**: 738 pass, 1 fail (listed below), 9 skipped; lint and format clean.
- **frontend**: 392 pass, 4 fail — **environmental, not this change**:
  `bun install --frozen-lockfile` cannot fetch `react-simple-maps` / d3 tarballs
  (proxy 403 on `europe-west1-npm.pkg.dev`), so `t026-setup.criteria`,
  `t051-map-click`, `t051-tester.criteria` and `screens.criteria` cannot load.
  Same 392/4 with my changes stashed. Nothing under `frontend/` changed.

### Tests made stale

All existed before this task. Runtime reds (24):

**`question-bank/src/distractors-verify.test.ts`** (12) — all read `choices` /
`correctIndex` / `choiceGeometryIds` on every question, `map_click` included.
- `T-022 criterion 2: exactly four non-blank choices > every question has 4 choices, all non-blank strings` — modify: skip `map_click`, and assert it has none of the three keys.
- `T-022 criterion 3: correctIndex points at the answer > integer 0..3 and choices[correctIndex] equals the draft's answer` — modify: same.
- `T-022 criterion 4: no two choices share text > over the bank, choices are distinct after trim + lower-case` — modify: same.
- `T-022 criteria 6 and 7: tiers, nearest-first, same-text skip > every question's distractors are exactly the first three by the brief's rule` — modify: check `map_click` through `clickDistractorsFor` (codes) instead of `choices`.
- `… > criterion 7 on Ohio: the three nearest bordering states` — modify: same, for the click question.
- `… > criterion 7 tier 2 tops up from the same region when borders run short` — modify: same.
- `… > candidates exclude other scopes, other types, non-finite centroids and blank text` — modify: for `CLICK`, assert on `clickDistractorsFor` geometry ids.
- `… > map_click candidates need a geometry_id; map_identify candidates do not` — modify: assert via `clickDistractorsFor` that the no-geometry state's code is absent (behaviour still holds internally).
- `T-022 criterion 10: no borders still gives a full question > AK and HI map questions have 4 choices, picked with tier 1 empty` — modify: `map_identify` only for 4 choices; for click, three codes from `clickDistractorsFor`.
- `T-022 criterion 12: map_click carries a parallel geometry_id list > choiceGeometryIds is parallel to choices and its correct entry is answerGeometryId` — delete, or invert to "carries no candidate keys" (T-092 criterion 1/6).
- `T-022 criterion 15: position not predictable from the format > each index 0..3 holds at least 20 of 150, and appears for every template` — modify: exclude `tpl-click-the-map` (the "20 of 150" floor becomes 20 of 100).
- `T-022 criterion 18: engineering-decisions.md E-21 > names the parallel list exactly as the code spells it` — delete: the list no longer exists.

**`question-bank/src/distractors.test.ts`** (6)
- `over the committed bank > criteria 2-5: shape, correctIndex, distinct text, draft fields kept` — modify: skip `map_click` / assert no candidate keys.
- `over the committed bank > criterion 7: neighbours_first tiers and order, both map templates` — modify: click via `clickDistractorsFor`.
- `over the committed bank > criterion 10: AK and HI map questions are full, with no border tier` — modify: same.
- `over the committed bank > criterion 12: map_click carries choiceGeometryIds parallel to choices` — delete or invert.
- `over the committed bank > criterion 14: correctIndex depends on the draft id only` — modify: exclude `map_click`.
- `over the committed bank > criterion 15: every position used at least 20 times and once per template` — modify: exclude `tpl-click-the-map` from the per-template loop.

**`question-bank/src/climate-far-phrases-verify.test.ts`** (2) — digest pins over output that includes `map_click`.
- `T-090 criterion 7: every other strategy gives what it gave at 3279555 > committed entities, every non-climate template` — re-pin to `e7213f8a9137f8faca571a16af99eee27735b54c4e8945873174b39a1cbefb5c`, or strip the three keys from `map_click` in the expectation before hashing.
- `T-090 criterion 12: nothing else in the bank moved > question file: every non-climate question deep-equal to 3279555` — re-pin to `a7407efb948aeebe863f5e74b6af341666cb57fea0d74122891591f700481c3f`, same alternative.

**`question-bank/src/hand-check-levels-verify.test.ts`** (1)
- `T-025 criteria 1-5: the 30 questions are recorded > criterion 2: prompt, correct answer and three distractors equal buildChoices' output` — modify: for the `map_click` rows, compare distractors against `clickDistractorsFor` (names via `geometry_id`) instead of `choices`.

**`question-bank/src/seed-level-verify.test.ts`** (1)
- `T-023 criteria 17-18: concept_load and familiarity_bonus > criterion 18: with every rank equal, a question's level depends only on template and near count (no per-entity bonus)` — modify: `nearCount` takes `map_click` distractors from `clickDistractorsFor`.

**`question-bank/src/t026-tester-verify.test.ts`** (1)
- `T-026 criterion 4: the old 150 unchanged, count 415 > the old-template questions hash to main's 150 (45b00d7), field for field, in order` — re-pin to `b5405bf7092ff90ccc2fe99e4458239273bdfef41e422f539aa9317faf3704b4`, or strip the three keys from the 50 click questions before hashing against the old digest.

**`backend/tests/test_t051_tester_criteria.py`** (1)
- `test_c37_question_file_still_holds_fifty_map_click_with_their_candidates` — modify: 50 `map_click` questions, each with **no** `choices` / `correctIndex` / `choiceGeometryIds`.

Typecheck reds (`bun run typecheck`; `choices` / `correctIndex` possibly undefined) — modify each read to narrow or assert (`q.choices as string[]`); no behaviour change:
- `distractors-verify.test.ts` lines 135 159 160 173 181 194 321 453 497–503 (also `choiceGeometryIds` no longer on the type)
- `distractors.test.ts` lines 92–98 108 121 129 163 182 189–193 260
- `seed-level-verify.test.ts` lines 508 511 512
- `hand-check-levels-verify.test.ts` lines 236 237
- `t026-templates.test.ts` lines 48 110 111 161 184 240 262 (**runtime green**)
- `t026-tester-verify.test.ts` lines 58 120 121 251 287 423–425 454 511 (**runtime green**)
- `climate-far-phrases.test.ts` lines 47 141 (**runtime green**)

No count floor I found pins these files' test counts.

### Notes

- **Surprise**: baseline `bun test` showed 12 fails until `bun install` — a
  fresh checkout has no `node_modules`; not a code issue.
- **Decision**: recompute in `seedLevels` rather than pass a side structure
  from `buildChoices`. It keeps the stage signatures (`seedLevels(questions,
  entities, templates)`, criterion 18 of T-023 pins ≤3 params) and nothing
  hidden rides on a question. Cost: the click distractor walk runs twice.
  **Reviewer to confirm.**
- **Decision**: E-29's revisit line edited (fired trigger removed, Q1 (b)/(c)
  added). **Reviewer to confirm**; criterion 13 only asks for the paragraph.
- **`seedLevels` now throws** on a `map_click` question whose inputs give fewer
  than three peers (before, it would silently use the carried ids). Only
  reachable by calling it with different entities than `buildChoices` saw.
  **Reviewer to confirm.**

## Test change request

Raised by the tester, 2026-10-27, in an orchestrated run (nobody attending). **No
test below has been changed.** Every row was checked by the tester on this
branch: each runtime row is red now, and red only because `map_click` questions
no longer carry `choices` / `correctIndex` / `choiceGeometryIds` (criteria 1, 6).
The worker's **Tests made stale** list was complete; no count floor
(`climate-kid-verify.test.ts` `FLOORS`) covers any file below.

**Re-pins (rows 19, 20, 23) were derived independently**, not taken from the
branch: the tester ran each test's own hashing code over the default branch
(`5d72ca5`, a `git worktree`). Unmodified, it reproduces the digest the test
pins today. With exactly the three keys stripped from `map_click` questions, it
gives the new digest below, which is also what the worker suggested. So each
new pin says "the default branch's output, minus the three keys", and holds as
hard as the old one.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/distractors-verify.test.ts` › T-022 criterion 2: exactly four non-blank choices › every question has 4 choices, all non-blank strings | `7fd16bb`, T-022 tester: every generated question has four non-blank choices | criteria 1, 6: a `map_click` question has no `choices` | modify | same name; every non-`map_click` question has 4 non-blank string choices; every `map_click` question has none of the three keys (`Object.hasOwn` false) | |
| 2 | same file › T-022 criterion 3: correctIndex points at the answer › integer 0..3 and choices[correctIndex] equals the draft's answer | `7fd16bb`, T-022: answer key correct | criteria 1, 6 | modify | same assertion over non-`map_click` questions; `map_click` asserted to have no `correctIndex` | |
| 3 | same file › T-022 criterion 4: no two choices share text › over the bank, choices are distinct after trim + lower-case | `7fd16bb`, T-022: no duplicate choices | criteria 1, 6 | modify | same assertion over non-`map_click` questions; `map_click` asserted to have no `choices` | |
| 4 | same file › T-022 criteria 6 and 7: tiers, nearest-first, same-text skip › every question's distractors are exactly the first three by the brief's rule | `7fd16bb`, T-022: tier/nearest-first distractor rule | criteria 1, 6: `map_click` distractors are no longer on the question | modify | non-`map_click` unchanged; for `map_click`, `clickDistractorsFor(draft, own, template, entities)` returns exactly the `geometry_id`s of the first three entities the test's own rule picks, in order | |
| 5 | same file › same describe › criterion 7 on Ohio: the three nearest bordering states | `7fd16bb`, T-022 | same | modify | as today for `map_identify`; for Ohio's `map_click`, `clickDistractorsFor` returns the `geometry_id`s of the same three bordering states, in the same order | |
| 6 | same file › same describe › criterion 7 tier 2 tops up from the same region when borders run short | `7fd16bb`, T-022 | same | modify | same expected entities; for `map_click` compared as `geometry_id`s from `clickDistractorsFor` | |
| 7 | same file › same describe › candidates exclude other scopes, other types, non-finite centroids and blank text | `7fd16bb`, T-022 | same | modify | for the `CLICK` template, the excluded entities' `geometry_id`s are absent from `clickDistractorsFor`'s result; other templates unchanged | |
| 8 | same file › same describe › map_click candidates need a geometry_id; map_identify candidates do not | `7fd16bb`, T-022: click candidates must be tappable | same; the rule still holds internally | modify | `map_identify` part unchanged; `clickDistractorsFor` for the click draft does not include the no-`geometry_id` state (by entity) and has three codes, all non-blank | |
| 9 | same file › T-022 criterion 10: no borders still gives a full question › AK and HI map questions have 4 choices, picked with tier 1 empty | `7fd16bb`, T-022 | same | modify | `map_identify` AK/HI: 4 choices as today; `map_click` AK/HI: a question exists, no candidate keys, and `clickDistractorsFor` gives three codes picked with tier 1 empty | |
| 10 | same file › T-022 criterion 12: map_click carries a parallel geometry_id list › choiceGeometryIds is parallel to choices and its correct entry is answerGeometryId | `7fd16bb`, T-022: the parallel list E-21 introduced | criterion 1/6 removes the list | modify | renamed "T-092: map_click carries no candidate list"; every `map_click` question has none of `choices`, `correctIndex`, `choiceGeometryIds`, and has a non-blank `answerGeometryId` equal to its entity's `geometry_id` | |
| 11 | same file › T-022 criterion 15: position not predictable from the format › each index 0..3 holds at least 20 of 150, and appears for every template | `7fd16bb`, T-022: answer position spread | `map_click` has no position any more | modify | over the 100 non-`map_click` questions of the two remaining original templates, each index 0..3 holds at least 20 (default branch: 21, 22, 27, 30) and appears for each of the two templates | |
| 12 | same file › T-022 criterion 18: engineering-decisions.md E-21 › names the parallel list exactly as the code spells it | `7fd16bb`, T-022: E-21 names the code's list | the list no longer exists in the code (criterion 14); E-21 is pinned byte-identical (criterion 13) | delete | — | |
| 13 | `question-bank/src/distractors.test.ts` › over the committed bank › criteria 2-5: shape, correctIndex, distinct text, draft fields kept | `fc71d87`, T-022 worker | criteria 1, 6 | modify | same assertions over non-`map_click`; `map_click` asserted to keep every draft field and have none of the three keys | |
| 14 | same file › over the committed bank › criterion 7: neighbours_first tiers and order, both map templates | `fc71d87`, T-022 worker | same | modify | `map_identify` unchanged; `map_click` checked through `clickDistractorsFor` codes against the same tier/order rule | |
| 15 | same file › over the committed bank › criterion 10: AK and HI map questions are full, with no border tier | `fc71d87`, T-022 worker | same | modify | as row 9 | |
| 16 | same file › over the committed bank › criterion 12: map_click carries choiceGeometryIds parallel to choices | `fc71d87`, T-022 worker | criteria 1, 6 remove the list | modify | as row 10 | |
| 17 | same file › over the committed bank › criterion 14: correctIndex depends on the draft id only | `fc71d87`, T-022 worker | `map_click` has no `correctIndex` | modify | same assertion over non-`map_click` questions | |
| 18 | same file › over the committed bank › criterion 15: every position used at least 20 times and once per template | `fc71d87`, T-022 worker | same | modify | as row 11 | |
| 19 | `question-bank/src/climate-far-phrases-verify.test.ts` › T-090 criterion 7: every other strategy gives what it gave at 3279555 › committed entities, every non-climate template | `2023a09`, T-090 tester: non-climate distractors unchanged | the pinned output includes `map_click` candidates | modify | same computation; pin becomes `e7213f8a9137f8faca571a16af99eee27735b54c4e8945873174b39a1cbefb5c` (default branch's output with the three keys stripped from `map_click`), comment citing T-092 row 19 | |
| 20 | same file › T-090 criterion 12: nothing else in the bank moved › question file: every non-climate question deep-equal to 3279555 | `2023a09`, T-090 tester | same | modify | pin becomes `a7407efb948aeebe863f5e74b6af341666cb57fea0d74122891591f700481c3f` (default branch's file, three keys stripped from `map_click`), comment citing T-092 row 20 | |
| 21 | `question-bank/src/hand-check-levels-verify.test.ts` › T-025 criteria 1-5: the 30 questions are recorded › criterion 2: prompt, correct answer and three distractors equal buildChoices' output | `236b0e0`, T-025 tester: hand-check record matches the generator | `map_click` distractors are no longer on the question | modify | non-`map_click` rows unchanged; for `map_click` rows the recorded three distractors equal the names of the peers whose `geometry_id`s `clickDistractorsFor` returns, in order | |
| 22 | `question-bank/src/seed-level-verify.test.ts` › T-023 criteria 17-18: concept_load and familiarity_bonus › criterion 18: with every rank equal, a question's level depends only on template and near count (no per-entity bonus) | `8fd5b17`, T-023 tester | `nearCount` reads `choices` / `choiceGeometryIds` | modify | `nearCount` for `map_click` takes its three distractors as the peers with the codes `clickDistractorsFor` returns; everything else, and the assertion, unchanged | |
| 23 | `question-bank/src/t026-tester-verify.test.ts` › T-026 criterion 4: the old 150 unchanged, count 415 › the old-template questions hash to main's 150 (45b00d7), field for field, in order | `d201e70`, T-026 tester | the 50 click questions in the hashed 150 lost three keys | modify | pin becomes `b5405bf7092ff90ccc2fe99e4458239273bdfef41e422f539aa9317faf3704b4` (default branch's 150, three keys stripped from `map_click`, key order kept), comment citing T-092 row 23 | |
| 24 | `backend/tests/test_t051_tester_criteria.py` › `test_c37_question_file_still_holds_fifty_map_click_with_their_candidates` | `6537059`, T-051 tester: T-051 did not regenerate the file | T-092 regenerates it without candidates (criterion 1) | modify | renamed `test_c37_question_file_holds_fifty_map_click_without_candidates`: 50 `map_click` questions, each with none of `choices`, `correctIndex`, `choiceGeometryIds` and a non-blank `answerGeometryId` | |
| 25 | `question-bank/src/distractors-verify.test.ts` (typecheck) | `7fd16bb`, T-022 | `choices` / `correctIndex` now optional, `choiceGeometryIds` gone from the type | modify | narrow each read (`q.choices as string[]`, `q.correctIndex as number`), no runtime change beyond rows 1-12 | |
| 26 | `question-bank/src/distractors.test.ts` (typecheck) | `fc71d87`, T-022 | same | modify | as row 25 | |
| 27 | `question-bank/src/seed-level-verify.test.ts` (typecheck) | `8fd5b17`, T-023 | same | modify | as row 25 | |
| 28 | `question-bank/src/hand-check-levels-verify.test.ts` (typecheck) | `236b0e0`, T-025 | same | modify | as row 25 | |
| 29 | `question-bank/src/t026-templates.test.ts` (typecheck only; runtime green) | `a6e3478`, T-026 worker | same | modify | as row 25; no assertion changes | |
| 30 | `question-bank/src/t026-tester-verify.test.ts` (typecheck; runtime red only in row 23) | `d201e70`, T-026 tester | same | modify | as row 25 | |
| 31 | `question-bank/src/climate-far-phrases.test.ts` (typecheck only; runtime green) | `72927f7`, T-090 worker | same | modify | as row 25; no assertion changes | |

To approve: start the `tester` step for this task in a session you are
attending, and answer row by row there.

## Verdict

**TL;DR.** Not final. All 18 criteria look met; the verdict waits on a Test change request. 24 existing tests (plus the typecheck of 7 test files) go red because this task removes `map_click` candidates, as intended. They are listed in **Test change request** above and none has been changed. **Next: a person approves or refuses those 31 rows in a `tester` session they attend.** That tester applies the approved rows, re-runs everything, and writes the final verdict.

**Independence.** This was an orchestrated run. `CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJe6KxQ3qitLn4NjWjF`, the same id the worker and expander rows list. My independence comes from being a freshly spawned agent with its own context: I did not see the worker's conversation or reasoning. That is weaker evidence than a separate session, because it depends on the orchestrator having spawned me correctly.

**Branch.** I committed to `claude/tender-feynman-fv9k0l`, which is the brief's header and also `git branch --show-current`. Every file the Handoff names is on it.

### Criteria

My test file is `question-bank/src/map-click-no-candidates-verify.test.ts`: 76 tests, all green. Expected values come from the default branch `5d72ca5` (a `git worktree`), never from this branch's code. They are embedded either as digests or, for the synthetic banks, as literal levels and `shortPools`.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `criterion 1` test: none of the 50 has any of the three keys (`Object.hasOwn`) |
| 2 | met | ids and formats in file order hash to `5d72ca5`'s; one per committed state |
| 3 | met | the twelve fields hash to `5d72ca5`'s; key set is exactly the twelve plus `level` |
| 4 | met | the 365 others hash to `5d72ca5`'s; `count` and the total are both 415 |
| 5 | met | `renderQuestionFile(loadCommittedEntities())` gives the file byte for byte |
| 6 | met | 9 synthetic banks: no candidate keys from `buildChoices`, `seedLevels`, `buildQuestionBank` or `renderQuestionFile`; committed bank too |
| 7 | met | same banks: 4 choices, `choices[correctIndex] === answer`, no `choiceGeometryIds`; non-click output equals `5d72ca5`'s |
| 8 | met | `(id, level)` of the 50 hashes to `5d72ca5`'s |
| 9 | met | per bank, click levels equal `5d72ca5`'s literal values. Covers a non-zero near term (`near` aa 7.5) and a zero one (`none` aa 6), with and without ranks |
| 10 | met | per bank, click `shortPools` equal `5d72ca5`'s. Covers the three named cases: two eligible peers gives found 2 / `too_few_candidates`; three gives a question; no centroid (with 0, 2 or 4 peers) gives `no_centroid` |
| 11 | met | `make -C backend content` leaves `content.json` unmodified (`git status` clean); the drift guard in `test_content_build.py` passes |
| 12 | met | `content.json` sha256 equals `5d72ca5`'s |
| 13 | met | E-1..E-28 hash to `5d72ca5`'s; 29 headings; E-29 has a dated T-092 paragraph with the required content |
| 14 | met | no non-test `question-bank/src` file names `choiceGeometryIds`; the named old comments are gone |
| 15 | met | manifests and lockfiles hash to `5d72ca5`'s; none added |
| 16 | met | `frontend`, `e2e`, `backend/migrations`, `openapi.yaml` and `backend/app` (except `content_build.py`) hash to `5d72ca5`'s |
| 17 | met | no URL, fetch, transport or non-git spawn in either T-092 test file; the 830 prompt / choices / funFact values in `content.json` hash to `5d72ca5`'s |
| 18 | **not yet** | red only on the stale tests below, and frontend is environmental |

### Mutations

I made each of these on purpose, saw the tests go red, and reverted it (`git status` is clean apart from my new file):

- **Click questions get `choices` / `correctIndex` back:** c5 and c6 red (8 tests).
- **Click near count forced to 0:** c5 and c9 red (7).
- **Near count over a different pair of peers:** c5 and c9 red (7).
- **`geometry_id` eligibility dropped:** c9 and c10 red (4).
- **Click `no_centroid` reported as `too_few_candidates`:** c10 red (8).
- **A click draft with 2 peers becomes a question:** c6, c7, c9 and c10 red (9).
- **`choiceGeometryIds: []` added to choice formats:** c5 and c7 red.
- **File edits:**
  - `choices: null` on one click question: c1, c3 and c5 red.
  - One click level changed: c5 and c8 red.
  - Two questions swapped: c2, c3, c5 and c8 red.
  - One non-click level changed: c4 and c5 red.
  - An extra key added: c3 and c5 red.
- **Doc and surface edits:**
  - E-28 edited: c13 red.
  - "internally" removed from E-29: c13 red.
  - A `choiceGeometryIds` comment added to `seed-level.ts`: c14 red.
  - `content_build.py` comment reverted to "still holds four": c14 red.
  - `grading.py` touched: c16 red.
- **One mutation had no effect.** Skipping `distractorsFor`'s `no_centroid` check for click drafts left every test green, because `nearestDistractors` repeats that check, so the behaviour did not change. The `no_centroid` behaviour itself is caught by the reason-swap mutation above.

### Suites (this branch, with my file)

- **question-bank `bun test`:** 2425 pass, 23 fail. All 23 are rows 1–23 of the request; none is a T-092 test.
- **question-bank typecheck:** fails only in the 7 test files of rows 25–31. Source and my file compile.
- **question-bank lint and format:** clean.
- **backend `make test`:** 738 pass, 1 fail (row 24), 9 skipped. Lint and format-check clean.
- **frontend `bun test`:** 392 pass, 4 fail, **not run to completion**. `react-simple-maps` cannot be installed here: `bun install --frozen-lockfile` gets a proxy 403 on the d3 tarballs, so four test files cannot load. Nothing under `frontend/` changed (the c16 pin confirms it).

### Noted for the reviewer (not failures)

- **`seedLevels` now throws** if it is called with inputs that no longer give a click question three peers.
- **E-29's `Revisit when` line was edited:** the trigger that has now fired was dropped. Criterion 13 pins only E-1..E-28, so this is allowed.
