# T-051 — Serve and render `map_click`: tap the state on the map

**Status:** `test changes requested`
**Next step:** `human`
**Approved:** Dkaattae — 2026-10-26, in the orchestrator session, verbatim: "approved". See `runs/T-051-map-click-render.md`.
**Test changes:** `requested`
**From:** [`tasks.md`](../tasks.md) T-051
**Branch:** `claude/affectionate-bell-r03ap2`
**PR:** #96, opened draft at expand time, built from the branch above
**Fault:** Test changes are waiting for a person's approval. The Test change request lists 33 rows of existing tests (backend, question-bank, e2e helpers) that this task's own criteria 1, 3, 4, 14 and 39 make stale. No criterion is unmet.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-26 | cse_01W3CQk9DjveYML94m9kKPKg |
| task-expander | 2026-10-26 | cse_01W3CQk9DjveYML94m9kKPKg (round 2: criteria rewritten for Q1's answer) |
| worker | 2026-10-26 | cse_01W3CQk9DjveYML94m9kKPKg (orchestrated worker subagent; `CLAUDE_CODE_REMOTE_SESSION_ID` is the orchestrator's, so the tester must run in a different one) |
| tester | 2026-10-26 | cse_01W3CQk9DjveYML94m9kKPKg (orchestrated tester subagent. Every role in this run shares this id, so the id check cannot show separation; see Verdict) |

## Q1 — answered: no options, any state can be tapped

The first round of this brief asked what a child may tap on a `map_click`
question. Each generated `map_click` question carries four candidate states
(`choices`, `choiceGeometryIds`, `correctIndex`), and the backend grades it by
`choiceIndex` alone.

**Dkaattae's answer, in the orchestrator session, 2026-10-26, verbatim:** "eh...
why a map click question has four candidate states? if it is clicking, just do
not provide options."

So a `map_click` question offers **no candidates**. Nothing on the map is marked,
every state can be tapped, and the tap itself is the answer. That is the first
round's option (b). It has three consequences, and the criteria below are written
for all of them:

- **Grading changes.** A tap on any of 50 states cannot become a `choiceIndex`.
  `AnswerRequest` gains a field carrying the tapped state's geometry id, and the
  backend grades `map_click` by comparing it with the answer's geometry id. This
  is E-20's own revisit trigger.
- **The four candidates stop being served.** `choices`, `correctIndex` and
  `choiceGeometryIds` are dropped from a served `map_click` question. Serving them
  would hand a client the 25% guess floor the answer above rejects.
- **The answer key becomes a geometry id.** The served `map_click` question
  carries `answerGeometryId`, which is withheld exactly as `correctIndex` is when
  `includeAnswerKey=false`.

The question file is not changed. It still holds the four candidates, and the
content build simply does not copy them (Out of scope).

**Names fixed by this brief.** The two new contract fields are named here so the
tester can check them: `AnswerRequest.tappedGeometryId` and
`Question.answerGeometryId`. The second already exists under that name in the
question file. These are contract names, not an implementation choice.

## Goal

The question file already holds 50 `map_click` questions ("Find Alaska on the
map."). They are withheld only because the client cannot draw them (E-24).
Serving and rendering them adds the third v1 format (plan §4). It is also the
first format where the child answers on the map itself, with no name to pick
from.

## What is already true

Survey, 2026-10-26, so the worker does not rebuild it:

- **The questions exist.** `question-bank/data/questions/us-states.json` holds
  50 `map_click` questions (`tpl-click-the-map`, topic `location`, levels 4.5 to
  9), one per state. Each has `answer` (the state's name), `answerGeometryId`
  (two-digit FIPS: `"01"` to `"56"`, the 50 state codes, no DC), the four
  candidate fields, and no `highlightGeometryId`.
- **`QuestionFormat` already lists `map_click`**: `openapi.yaml:1328`,
  `backend/app/models.py:65` and `frontend/src/lib/api/types.ts:14`.
- **The reveal already works without choices.** `build_reveal`
  (`backend/app/grading.py:197`) takes `mapHighlightGeometryId` from the entity's
  `geometryId` on a wrong answer, and on a correct one when `reveal` is
  `map_highlight`. `_answer_label` (`grading.py:231`) falls back to the entity's
  `name` when a question has no `choices`. `Session.tsx` already falls back from
  `correctAnswer` to `reveal.answerLabel` for the banner name.
- **Undo needs no change.** Answers are stored as `AnswerRecord`
  (`backend/app/orm.py:222`), which keeps `correct` and the before-snapshots, not
  the choice made. No new column is needed, so there is no migration.
- **What is missing:**
  - `map_click` is not in `SERVED_FORMATS` or `REVEAL_BY_FORMAT`
    (`backend/app/content_build.py:81`, `:85`).
  - `served_question` (`content_build.py`) requires four `choices`.
    `answerGeometryId` is not in `QUESTION_FIELDS` (`:63`).
  - `grade` (`grading.py:64`) grades `map_click` by `choiceIndex`, because
    `map_click` is in `CHOICE_FORMATS` (`:39`).
  - `AnswerRequest` (`models.py:415`, `openapi.yaml:2105`) has no field for a
    tapped geometry id. `Question` (`models.py:181`, `openapi.yaml:1543`) has no
    `answerGeometryId`. Responses go through `response_model`, so an unlisted field
    is silently dropped.
  - `question_payload` (`backend/app/serializers.py:21`) withholds only
    `correctIndex`.
  - The answer handler (`backend/app/routers/sessions.py:282`) sets
    `correctAnswer` only from `choices`, and its 422 always names `/choiceIndex`.
  - `Session.tsx` has no `map_click` branch, `UsMap.tsx` has no tap handling, and
    `api.submitAnswer` (`frontend/src/lib/api/client.ts:154`) takes only a
    `choiceIndex`.

## Acceptance criteria

Frozen once approved. "Served" means present in the committed
`backend/app/data/content.json`. "The question file" means
`question-bank/data/questions/us-states.json` as committed on this branch. "A
session" means one created and answered through the backend's HTTP API.

### Serving

1. Every `map_click` question in the question file is served, 50 at the time of
   writing. Every `map_identify` and `multiple_choice` question served before this
   task is still served, unchanged. No question of any other format is served.
2. Each served `map_click` question's `answerGeometryId` equals the question
   file's `answerGeometryId` for the same `id`.
3. No served `map_click` question carries `choices`, `correctIndex`,
   `choiceGeometryIds`, `highlightGeometryId` or `answer`.
4. No served `map_identify` or `multiple_choice` question carries
   `answerGeometryId` or `choiceGeometryIds`.
5. Every served `map_click` question has `reveal: "map_highlight"`.
6. The committed `content.json` is byte-identical to what `make -C backend content`
   writes from the committed inputs, and a second run writes the same bytes.
7. None of `backend/app/content_build.py`, `backend/app/data/content.json` or
   `backend/README.md` still says `map_click` questions are withheld or not served.
   In particular none of them contains `until T-051` or `joins in T-051`.

### Contract

8. `openapi.yaml`'s `AnswerRequest` has a `tappedGeometryId` property: a string,
   not in `required`. Its description says it is the answer to a `map_click`
   question, the two-digit geometry id of the state the child tapped.
9. `openapi.yaml`'s `Question` schema has an `answerGeometryId` property: a string,
   not in `required`. Its description says it is present on `map_click` questions
   only, and is withheld when `includeAnswerKey=false`, as `correctIndex` is.
10. The backend's existing contract tests, which walk `openapi.yaml` against the
    app in both directions, pass.

### API: serving

11. Listing questions with `format=map_click` through `GET /api/v1/questions`,
    across every page, returns exactly the served `map_click` questions. With the
    default `includeAnswerKey`, each carries `answerGeometryId`. None carries
    `choices`, `correctIndex` or `choiceGeometryIds`.
12. With `includeAnswerKey=false`, a `map_click` question from
    `GET /api/v1/questions/{id}` carries no `answerGeometryId`. The same holds for
    a `map_click` question served by a session's next-question operation with
    `includeAnswerKey=false`.
13. With the committed bank loaded, the candidate pool for a `location` session
    and for a `mixed` session each contains all served `map_click` questions. No
    other topic's pool contains any.

### API: grading

14. Answering a served `map_click` question in a session with `tappedGeometryId`
    equal to its `answerGeometryId` returns 200 with `correct: true`.
15. Answering it with `tappedGeometryId` set to any other of the 50 state codes
    returns 200 with `correct: false`. So does `"11"` (DC, which the map draws).
    Matching is exact string equality: for Alabama (`"01"`), `"1"` is wrong.
16. In both cases (14 and 15) the reveal's `mapHighlightGeometryId` equals the
    question's `answerGeometryId`, and the result's `correctAnswer` is the
    answer state's name.
17. No result for a `map_click` answer carries `correctIndex`.
18. Answering a served `map_click` question with no `tappedGeometryId` returns
    422. This holds whether or not `choiceIndex` is sent. The problem's `errors`
    name the path `/tappedGeometryId`. The question stays in play: a following
    answer with a `tappedGeometryId` is graded.
19. A `map_click` answer moves the profile, the session counts, mastery and the
    review queue exactly as a `map_identify` answer with the same correctness
    does.
20. Undoing a `map_click` answer restores the profile and session to their
    state before it, as for the other formats, and the question can be
    answered again.
21. `map_identify` and `multiple_choice` questions are still graded by
    `choiceIndex` alone. A `tappedGeometryId` sent with one of them does not
    change the grade.

### Client: presenting a `map_click` question

22. A served `map_click` question renders its prompt and a US map. It renders no
    answer buttons: no element with `data-variant="choice"`.
23. Before an answer is committed, no state's name appears in the rendered markup,
    as visible text or in an `aria-label`, `title` or `alt`, except where the
    prompt contains it.
24. Before an answer is committed, every state is drawn alike: same fill, stroke,
    stroke width, class list and `role`, and the same `aria-*` and `data-*`
    attributes, except an attribute whose value is that state's own geometry id.
    In particular the answer's state cannot be told apart from any other.
25. Before an answer is committed, every drawn state is an interactive control:
    it has `role="button"` (or is a `<button>`), and it is in the tab order. Enter
    or Space on a focused state does what a tap does.
26. Tapping or activating a drawn state submits exactly one answer for that
    question, with `tappedGeometryId` set to that state's geometry id padded to
    two digits. The tap is matched by geometry id, never by name. This holds for
    every drawn state, including Alaska (`"02"`) and Hawaii (`"15"`) in their
    insets, Rhode Island (`"44"`) and Delaware (`"10"`).
27. While an answer is being submitted, or a reveal is on screen, tapping or
    activating any state submits nothing.

### Client: the reveal

28. After a correct answer, the answer's state is filled with the correct-answer
    colour a `map_identify` reveal uses (`var(--map-correct)`), and the banner
    reads "You got it" with the server's headline, as for the other two formats.
29. After a wrong answer, the answer's state is filled with the correct-answer
    colour, and the banner reads "The answer is <name>", where `<name>` is the
    server's `correctAnswer`.
30. After a wrong answer, the tapped state is drawn differently from the answer's
    state and from every state that was not tapped.
31. After a wrong answer, Next stays disabled until the server's
    `nextEnabledAfterMs` has passed, and "Oops, tapped by mistake" is offered, as
    for the other two formats.
32. Undoing a wrong `map_click` answer returns the question to how it was before
    the tap: every state drawn alike as in criterion 24, and every state tappable
    again.

### What must not change

33. A `map_identify` question still renders its highlighted state and four answer
    buttons. A `multiple_choice` question still renders its choice panel
    (`choicePanel`, `frontend/src/lib/topics.ts`) and four answer buttons. Neither
    renders any state with a button role or in the tab order.
34. A `map_identify` and a `multiple_choice` answer still send `choiceIndex` and
    no `tappedGeometryId`.
35. No dependency is added or changed in any `package.json`, `bun.lock`,
    `pyproject.toml` or `uv.lock`.
36. No database migration is added: `backend/migrations/versions/` still holds only
    `0001_initial_schema.py`.
37. The question file is unchanged by this task.
38. No test reaches the network.

### Recorded decision

39. `engineering-decisions.md` gains `E-29`, the next unused number. It:
    - says a `map_click` question offers no candidates, that any state can be
      tapped, and that it is graded by the tapped geometry id;
    - quotes Dkaattae's answer above as the reason;
    - names the options not taken (mark four candidates and allow only them; mark
      nothing but let only four respond);
    - says it updates E-24's "`map_click` is withheld until T-051", answers E-20's
      revisit trigger, and leaves E-21's `choiceGeometryIds` generated but not
      served;
    - ends with a `**Revisit when**` line.

    No existing `E-n` entry is edited.

## Out of scope

- **Any other format**: `image`, `ab_compare`, the pin formats, `drag_order`,
  `click_profile` (T-045, plan §2.5).
- **The question file and the generator.** This task does not regenerate
  `us-states.json` or change `tpl-click-the-map`, its prompt, its levels (E-22,
  T-085) or its distractors (E-21). `map_click` questions will still carry four
  unused candidates in the file. Whether the generator should stop writing them is
  a follow-up for `tasks.md`, not this task.
- **The served `entity` gives the answer away.** A `map_click` question's served
  `entity.geometryId` is its answer, as a superlative's entity is (T-053). The
  client must not show it before commit (criteria 23 and 24). Hiding it from the
  network tab is T-053's product decision, not this task's.
- **Map-level changes**: shaded relief (T-043), zoom, a magnifier for small
  states, physical features. If tapping Rhode Island proves too hard on a tablet,
  that is a finding for a follow-up, not a reason to widen this task.
- **Partial credit or "close" feedback** for tapping a neighbour. A tap is right
  or wrong.
- **Mastery and review rules**, and single-topic map fill (T-056). Serving 50 more
  `location` questions changes what a `location` session can pick, and that is
  expected.
- **Selection and level rules** (`selection.py`, E-26, E-28). Nothing here changes
  how a question is picked.
- `tasks.md` and `PROGRESS.md` beyond the reviewer's sweep. `PROGRESS.md`'s
  "365 questions" and "two formats" lines are the reviewer's to update.

## Constraints

- **Files expected to change:** `backend/app/content_build.py`,
  `backend/app/data/content.json` (regenerated, never hand-edited),
  `backend/app/grading.py`, `backend/app/models.py`, `backend/app/serializers.py`,
  `backend/app/routers/sessions.py`, `backend/README.md`, `openapi.yaml`,
  `frontend/src/components/Session.tsx`, `frontend/src/components/UsMap.tsx`,
  `frontend/src/lib/api/types.ts`, `frontend/src/lib/api/client.ts`,
  `engineering-decisions.md`, plus new test files. Anything else needs a reason in
  the Handoff.
- **No new dependency.** The frontend has no jsdom and no `@testing-library/react`.
  Its component tests render to static markup with `react-dom/server`
  (`frontend/src/components/screens.criteria.test.tsx`). Adding either is a
  dependency request for a person (`CLAUDE.md`, "Packages"). Criteria 22 to 34
  must be checkable without one: through static markup, through a pure function,
  or through the Playwright suite in `e2e/`, which CI runs on every PR.
- **Join on codes, never names** (`conventions.md`; plan §2.3). us-atlas ids are
  matched after `pad()` to two digits, as `UsMap.tsx` does now.
- **No migration.** `AnswerRecord` does not store what was tapped, and this task
  does not make it.
- **Generous hit areas** (plan §2.3). Rhode Island, Delaware and Connecticut are
  answers too. This is checked by a person (Review checklist), not by a test.
- **Text a child reads.** Any new visible or announced text is child-facing, for
  example an accessible name for a tappable state or a hint. The reviewer
  escalates it (`process.md` step 6 envelope). Keep new text to the minimum, and
  remember criterion 23: no state's name before commit.
- **Not eligible for the light path**: touches `openapi.yaml`, grading and
  child-facing text.
- **Worker model:** Opus. It is an interaction design with more than one
  defensible answer (`process.md`, "Choosing the worker's model").

### Expected test cost: plan to attend the tester step

Serving 50 more questions, changing `map_click` grading and editing `frontend/`,
`backend/app/` and `openapi.yaml` turns several pre-existing tests red by design.
The worker lists them under **Tests made stale**. The tester raises a Test change
request, which a person approves in an attended tester session (D-14, D-15).
Known from the survey:

- **Served-count pins of 365:** `backend/tests/test_content_build.py` (`:90`,
  `:152`), `test_content_api.py` (`:29`, `:150`, `:151`, `:170`),
  `test_t040_tester_criteria.py` (`:155`, `:222`),
  `test_t026_tester_criteria.py` (`:55`),
  `question-bank/src/climate-far-phrases-verify.test.ts` (`:536`).
- **"map_click is withheld" assertions:** `test_t026_tester_criteria.py`
  `test_c36_map_click_is_still_withheld`; `test_t040_tester_criteria.py:541`; and
  possibly `test_c15_a_withheld_key_leaks_the_answer_nowhere_but_choices`.
- **Grading tests** that treat `map_click` as a choice format, if any. Search for
  `map_click` under `backend/tests/`.
- **Digest guards (T-070 Q1 is still open):** `test_t089_tester_criteria.py`
  criteria 13 (`E-n` numbered exactly 1..28), 15 (`openapi.yaml` digest) and 17
  (`content.json` sha). `climate-far-phrases-verify.test.ts` criterion 20 (tree
  digests of `frontend/`, `backend/app/` and `openapi.yaml`) and criteria 7, 11,
  12 and 19 (non-climate questions in `content.json`).
  `hand-check-levels-verify.test.ts` criterion 14 (`content.json`).
- **Playwright:** `e2e/tests/app.ts` `answerAtRandom` expects more than one
  `data-variant="choice"` button ("a question with nothing to answer it with"), and
  `answerDeliberately` answers by button. "every quiz type can be played through"
  plays the `location` topic, which will now serve `map_click`.
- **Possibly** `backend/tests/test_measure_selection.py` and E-26's figures, which
  are measured at 365 questions.

## Context

Required reading for the worker and the tester.

- **This brief's Q1 section**, for the decision and its consequences.
- **Plan:** `geoquizdataplan.md` §2.3 (FIPS join, generous hit areas), §2.5
  (Format B, the pin version of free recall), §3.5 (commit on tap, asymmetric
  reveal), §4 (the three v1 formats).
- **Decisions:** `engineering-decisions.md` E-20 (the `map_click` answer is a name
  with its code beside it, and its revisit trigger), E-21 (`choiceGeometryIds`),
  E-24 (what is served, and why `map_click` is withheld), E-14 (`openapi.yaml`
  follows the backend).
- **Contract:** `openapi.yaml` `Question` (`:1543`), `QuestionFormat` (`:1321`),
  `AnswerRequest` (`:2105`), `AnswerResult`, `listQuestions`' `format` parameter.
- **Backend:** `backend/app/content_build.py` (`QUESTION_FIELDS`,
  `SERVED_FORMATS`, `REVEAL_BY_FORMAT`, `served_question`, `_source.note`),
  `backend/app/models.py` `Question` (`:181`) and `AnswerRequest` (`:415`),
  `backend/app/grading.py` (`CHOICE_FORMATS`, `grade`, `build_reveal`,
  `_answer_label`), `backend/app/serializers.py` `question_payload`,
  `backend/app/routers/sessions.py` `_serve_next` and the answer handler,
  `backend/app/store.py` `candidate_questions`.
- **Frontend:** `frontend/src/components/Session.tsx` (the `map_identify` branch,
  `commit`, `Reveal`, undo), `frontend/src/components/UsMap.tsx`,
  `frontend/src/lib/topics.ts` `choicePanel`, `frontend/src/lib/api/types.ts`,
  `frontend/src/lib/api/client.ts` `submitAnswer`,
  `frontend/src/components/screens.criteria.test.tsx` (how component tests are
  written here).
- **Data:** `question-bank/data/questions/us-states.json`, the 50 `map_click`
  entries.
- **E2E:** `e2e/tests/app.ts`, `e2e/tests/quiz.spec.ts`, `e2e/README.md`.
- **Tests:** `test-guidelines.md`; `CLAUDE.md` "Tests".

## Review checklist

The shape criteria above are tests. These are for a person, on the PR:

- [ ] On a tablet-sized viewport, Rhode Island, Delaware and Connecticut can each be tapped by a finger without hitting a neighbour
      (plan §2.3). If not, record it as a follow-up, do not widen this task.
- [ ] Alaska's and Hawaii's insets can be tapped.
- [ ] The reveal reads as a reward or a reason, never a red X (plan §3.5), and the
      tapped state is distinguishable from the answer without colour alone.
- [ ] Any new child-facing text (accessible names, hints) reads well to a
      6-to-11-year-old.
- [ ] Hovering a state with a mouse does not single out the answer.

## Handoff

**TL;DR.** Built. The backend serves the 50 `map_click` questions without
candidates and grades them by `tappedGeometryId`. On the client every state is a
button. 32 existing backend tests and 5 question-bank tests are red by design,
and the e2e helpers will go red in CI. All of them are listed under **Tests made
stale**. The tester needs a person at the gate for the Test change request
(D-14).

- **Suites, run here:** backend 660 pass / 32 stale-red / 9 skip, ruff and format
  clean. Frontend 412 pass / 0 fail, typecheck, eslint and prettier clean,
  `build:static` builds. Question-bank 2362 pass / 5 stale-red. e2e typecheck
  clean.
- **Not run here: Playwright.** The sandbox cannot download Chromium. CI is the
  only place criteria 25 to 27 and 30 to 32 can be seen in a real browser.
- **Frontend install workaround (local only).** `bun install --frozen-lockfile`
  gets a 403 from the proxy, because `bun.lock` pins the tarballs to
  `europe-west1-npm.pkg.dev` (known; `runs/T-058…`). I installed from a scratch
  copy of the lockfile, with the host rewritten to `registry.npmjs.org` (same
  integrity hashes), and copied `node_modules` in. No committed file changed.
  A tester in this sandbox can repeat that. `bun.lock` and `package.json` are
  untouched (criterion 35).

### Changed, file by file

- `backend/app/content_build.py`: adds `MAP_CLICK_FIELDS` (the choice fields minus
  `choices`/`correctIndex`/`highlightGeometryId`, plus `answerGeometryId`),
  `map_click` in `SERVED_FORMATS`, `REVEAL_BY_FORMAT["map_click"] = "map_highlight"`
  and `_served_map_click`, which refuses an `answerGeometryId` that is not two
  digits. The docstring and `_source.note` no longer say "withheld".
- `backend/app/data/content.json`: regenerated with `make -C backend content`.
  It now holds 415 questions; a second run gives the same bytes.
- `backend/app/grading.py`: `map_click` moves out of `CHOICE_FORMATS` into the new
  `GEOMETRY_FORMATS`. `grade(..., tapped_geometry_id=)` compares strings exactly.
  `UngradableAnswer` gains `path` (default `/choiceIndex`, so other formats are
  unchanged). `build_reveal`'s highlight falls back to `answerGeometryId` before
  `entity.geometryId`. `_answer_label` is renamed to `answer_label` (public),
  because the router now uses it too.
- `backend/app/models.py`: `AnswerRequest.tapped_geometry_id`,
  `Question.answer_geometry_id`.
- `backend/app/serializers.py`: `question_payload` also pops `answerGeometryId`
  when the key is withheld.
- `backend/app/routers/sessions.py`: passes `tapped_geometry_id` to `grade`. The 422
  `errors[].path` comes from `exc.path`. A `map_click` result's `correctAnswer`
  is `answer_label(question, entity)` (the entity's name).
- `backend/README.md`: the "not served until T-051" line is replaced.
- `openapi.yaml`: `AnswerRequest.tappedGeometryId` and `Question.answerGeometryId`
  (strings, not required, described as criteria 8 and 9 ask). The `info`
  "Answer keys" paragraph and the `IncludeAnswerKey` parameter now name both
  keys (E-14).
- `frontend/src/lib/map-click.ts` (**new; not in the brief's file list**):
  `pad`, `stateProps`, `TAPPABLE_STATE_LABEL`, `createAnswerGate`,
  `mapClickView`, `AnswerInput`. They live outside the components because
  eslint's `react-refresh/only-export-components` fails `--max-warnings 0` on
  non-component exports from a `.tsx` component file.
- `frontend/src/components/UsMap.tsx`: new props `tappedFips` and `onTap`. Each path
  gets `stateProps(...)`. With `onTap`, every state has `role="button"`,
  `tabIndex=0`, the same `aria-label`, `data-geometry-id="<its id>"`, click and
  Enter/Space handlers, and the same hover/focus style. Without it, every state
  gets `tabIndex=-1` and no role. Geographies with no projected path (the five
  territories us-atlas carries) are no longer drawn.
- `frontend/src/components/Session.tsx`: a `map_click` branch renders `UsMap` with
  `onTap` while presenting. `commit` takes `{choiceIndex}` or
  `{tappedGeometryId}`. A ref-held `answerGate` lets one answer through per
  question, and is released on undo, on the next question, or when the send
  fails. `tappedGeometryId` state feeds the wrong-answer drawing.
- `frontend/src/lib/api/client.ts`, `types.ts`: `submitAnswer` accepts either
  shape; `Question.answerGeometryId`.
- `engineering-decisions.md`: adds **E-29**. No other entry is touched.
- New tests: `backend/tests/test_t051_map_click.py` (19),
  `frontend/src/components/t051-map-click.test.tsx` (14).

### Where each criterion lives

| # | Where |
|---|---|
| 1–5 | `content_build.py` `SERVED_FORMATS`, `MAP_CLICK_FIELDS`, `_served_map_click`, `REVEAL_BY_FORMAT`; non-`map_click` questions are byte-for-byte what they were (the 365 entries are unchanged in the `content.json` diff, which only adds) |
| 6 | `make -C backend content`; existing `test_committed_content_json_is_what_the_loader_writes_from_committed_inputs` passes |
| 7 | `content_build.py` docstring, comment, `_source.note`; `backend/README.md:54` |
| 8, 9 | `openapi.yaml` `AnswerRequest.tappedGeometryId`, `Question.answerGeometryId` |
| 10 | `tests/test_contract.py` passes unchanged |
| 11, 12 | `serializers.question_payload` (all `/questions`, `/questions/{id}`, bundles and served questions go through it) |
| 13 | unchanged `store.candidate_questions` (filters by topic only; `map_click` is `topic: location`) |
| 14–18 | `grading.grade` (`GEOMETRY_FORMATS`), `build_reveal`, `routers/sessions.py` `submit_answer`. The 422 is raised before any state changes, so the question stays pending |
| 19, 20 | unchanged `apply_answer` and undo (format-blind; snapshots in `AnswerRecord`) |
| 21 | `grade`: choice formats never read `tapped_geometry_id` |
| 22, 23 | `Session.tsx` `map_click` branch (no choices rendered: a served `map_click` has none); `TAPPABLE_STATE_LABEL` names no state |
| 24–26 | `map-click.ts` `stateProps` with `onTap`; `UsMap.tsx` spreads it on every path; `pad()` before `onTap` |
| 27 | `Session.tsx` `commit`: `if (result \|\| busy)` plus `answerGate.tryHold()`; while revealing `onTap` is `undefined`, so no state is a control |
| 28, 29 | `mapClickView` → `correctFips` = `reveal.mapHighlightGeometryId` → `var(--map-correct)`; banner is the existing `Reveal` (`correctAnswer` from server) |
| 30 | `stateProps`: tapped = `var(--map-highlight)` fill, `var(--foreground)` stroke, width 1.6, dashed `3 2` |
| 31 | unchanged `commit` timer and `Reveal` undo button (shared with the other formats) |
| 32 | `undo()` clears `result` and `tappedGeometryId` and releases the gate → `mapClickView(null)` → tappable |
| 33, 34 | `stateProps` without `onTap` → `tabIndex=-1`, no role; choice buttons send `{choiceIndex}` only |
| 35–38 | no lockfile, manifest, migration or question-file change; new tests use no network |
| 39 | `engineering-decisions.md` E-29 |

### Deliberately not done

- **No generous hit area for Rhode Island, Delaware or Connecticut.** Any extra
  hit target would make those states differ from the rest (criterion 24) or
  overlap their neighbours. The Review checklist owns this. If a tablet shows
  they are too small, it is a follow-up (magnifier or zoom, out of scope).
- **No new e2e spec.** I cannot run Playwright here, and unrun browser code is
  not evidence. The tester's independent check, and CI, is where 25 to 27 and
  30 to 32 get a real browser.
- **`tasks.md` not edited** (Out of scope). Proposed follow-ups for the
  reviewer's sweep are in Notes.
- **`pin` 422s still name `/choiceIndex`.** That predates this task and is out of
  scope.

### Found against the brief

- The brief lists `test_content_build.py` and others as stale. The run also shows
  a **flaky** family: any test that answers by `choiceIndex` in a `mixed` or
  `location` session fails whenever selection serves a `map_click` question.
  Which tests fail changes from run to run (below).
- `UsMap` used to put **every path on every map** (quiz and progress) in the tab
  order, because react-simple-maps' `Geography` hard-codes `tabIndex="0"`.
  Criterion 33 needs that gone on quiz maps. I removed it on the progress map
  too, since it is the same component and 56 unlabelled tab stops help nobody.
  **Reviewer to confirm**, or to restrict it to quiz maps.
- New child-facing text: one string, the accessible name every tappable state
  shares: **"A state you can tap"**. **Reviewer escalates** (process step 6).

### How to run

```bash
make -C backend content                    # regenerates content.json; rerun → same bytes
cd backend && uv run pytest -q && uv run ruff check . && uv run ruff format --check .
cd frontend && bun test && bun run typecheck && bun run lint && bunx prettier --check .
cd question-bank && bun test
cd e2e && bun run typecheck                # Playwright itself needs CI or a machine with Chromium
```

### Tests made stale

None of these are edited. Each is red by design, from criterion 1 (serve
`map_click`), 3/4 (keys) or 39 (E-29), or from the content.json and openapi
digests that move with them.

**A. Fixed counts of 365 (criterion 1 → 415):**
1. `backend/tests/test_content_api.py::test_content_version_counts_what_was_seeded`: modify `365` → `415`.
2. `test_content_api.py::test_a_bundle_carries_its_entities_and_questions`: `365` → `415`.
3. `test_content_api.py::test_pagination_walks_the_whole_set_once`: `range(100)` × `limit 4` caps at 400. Raise the loop bound (for example `range(200)`), and change both `365` → `415`.
4. `test_content_build.py::test_version_counts_fifty_entities_and_365_questions`: `365` → `415`, and rename.
5. `test_t040_tester_criteria.py::test_c6_version_counts_50_entities_and_365_questions`: `365` → `415`, and rename.

**B. "`map_click` is withheld" (criterion 1, 3, 4 reverse them):**
6. `test_content_build.py::test_served_questions_are_the_files_non_map_click_questions`: modify so it expects *every* file question, 415. The per-entity pairs then include `("map_click","location")`. Its last line (`format=map_click` → `[]`) should expect the 50.
7. `test_t040_tester_criteria.py::test_c11_served_ids_are_the_files_non_map_click_ids`: the same modification as 6.
8. `test_t040_tester_criteria.py::test_c12_no_map_click_is_served_filtered_or_not`: delete. It is superseded by T-051 criterion 11. Alternatively, invert it to "filtered returns the 50".
9. `test_t026_tester_criteria.py::test_c36_map_click_is_still_withheld`: delete. T-051 criterion 1 reverses it.
10. `test_t026_topics.py::test_all_265_new_questions_are_served_with_their_topic_and_format`: delete its last line (`not any(map_click)`). The rest holds.
11. `test_content_build.py::test_nothing_served_falls_outside_the_contract`: the banned-keys loop should ban `answerGeometryId` only on non-`map_click` questions (criterion 4). `answer` and `choiceGeometryIds` stay banned on all.
12. `test_t040_tester_criteria.py::test_c10_no_served_key_outside_the_contract`: the same modification as 11.
13. `test_t026_topics.py::test_served_question_keys_are_unchanged_by_the_new_templates`: `allowed` should be `QUESTION_FIELDS | MAP_CLICK_FIELDS | {"reveal"}`, or the check limited to non-`map_click` questions.
14. `test_t026_tester_criteria.py::test_c37_no_served_question_gains_a_prose_field`: add `answerGeometryId` to `old_keys`. It is a key, not prose.
15. `test_t026_tester_criteria.py::test_c37_old_served_questions_are_byte_for_byte_main_s`: `OLD` includes `tpl-click-the-map`, so it now counts 150. Limit the digest to `tpl-identify-on-map` and `tpl-capital-of`. Those 100 are unchanged: I computed the digest over them and it matches the recorded `55ce822c…`.

**C. Answer-key checks that assume `choices` on every question (criterion 3):**
16. `test_content_api.py::test_every_seeded_question_has_a_usable_answer_key`: skip `map_click`, or assert `answerGeometryId` is two digits for it.
17. `test_content_build.py::test_served_question_fields_equal_the_question_file`: for `map_click`, compare `answerGeometryId` and assert no `choices`/`correctIndex`. Keep the rest for the other formats.
18. `test_content_build.py::test_question_ids_with_colons_resolve_and_withhold_the_answer_key`: for `map_click`, assert `answerGeometryId` is absent with `includeAnswerKey=false` instead of reading `choices`.
19. `test_t040_tester_criteria.py::test_c13_served_question_fields_equal_the_question_file`: the same modification as 17.
20. `test_t040_tester_criteria.py::test_c14_every_question_validates_and_its_key_is_the_files_answer`: the same modification as 16 and 17.

**D. Sessions that answer by `choiceIndex` and now meet `map_click` (flaky: depends on what selection serves).** The fix is in the helper, not in each test. Answer a `map_click` question with `tappedGeometryId` = `question["answerGeometryId"]` when right, and any other two-digit code when wrong.
21. `test_sessions_api.py` helper `answer()` (`:22`, used by `play()`). Seen failing over six runs: `test_a_correct_answer_returns_the_reward_and_the_key`, `test_a_milestone_offers_a_stopping_point`, `test_answering_the_same_question_twice_is_refused`, `test_ending_twice_returns_the_same_summary`, `test_ending_writes_the_end_level_and_reports_places_learned`, `test_four_correct_in_a_row_raises_the_level_quietly`, `test_only_the_most_recent_answer_can_be_undone`, `test_serving_advances_the_index_and_records_what_was_asked`, `test_the_question_returns_to_presenting_after_an_undo`, `test_the_same_answer_cannot_be_undone_twice`, `test_the_summary_counts_places_learned_this_session`, `test_three_wrong_in_a_row_drops_the_level_without_a_message`, `test_undo_backs_out_the_answer_and_its_profile_effects`, `test_a_level_change_is_absent_when_nothing_moved`, `test_a_wrong_answer_returns_the_reason_and_queues_the_entity`. Any test in the file that answers in a `mixed` session can join the list. `test_a_correct_answer_returns_the_reward_and_the_key` asserts `result["correctIndex"]` (`:192`), so it also needs a non-`map_click` branch, or a topic that serves only choice formats.
22. `test_content_build.py` helper `_answer()` (`:283`). This makes `test_reveals[location-True]` flaky. Also, its wrong-answer `label` reads `choices`: for `map_click` it should be the entity's name.
23. `test_content_build.py::test_a_perfect_session_reaches_every_question_once[location-50-formats0]`: location now has 100 questions in two formats. Make it `("location", 100, {"map_identify","map_click"})`, with each entity seen twice. Needs helper 22.
24. `test_content_build.py::test_a_perfect_session_reaches_every_question_once[mixed-100-formats2]`: `formats` → `{"map_identify","map_click","multiple_choice"}` (with 100 of 415, all three appear in practice; use `<=` if a strict set is too tight). Needs helper 22.
25. `test_t040_tester_criteria.py` helper `play()` (`:343`): the same fix as 21. Then:
    - `test_c20_c21_c25_a_perfect_topic_session_covers_each_state_once_with_its_reveal[location-map_identify-True]`: location is now 100 questions and both map formats. Play 100 and check each entity twice, or filter to `map_identify`.
    - `test_c25_a_perfect_mixed_session_reaches_100_distinct_served_questions`: formats set gains `map_click`.
    - `test_c22_every_wrong_answer_names_the_answer_and_highlights_the_state`: needs the helper only.

**E. Digest pins (move with any change to these files):**
26. `test_t089_tester_criteria.py::test_criterion_13_exactly_one_new_entry_numbered_gap_free`: `range(1, 29)` → `range(1, 30)` (E-29 added, criterion 39).
27. `test_t089_tester_criteria.py::test_criterion_15_nothing_but_those_two_descriptions_changes`: re-pin `OPENAPI_STRUCTURE_ON_MAIN`, or delete it as T-089-only.
28. `test_t089_tester_criteria.py::test_criterion_17_content_json_byte_identical`: re-pin or delete. Its job was T-089-only.
29. `question-bank/src/climate-far-phrases-verify.test.ts` › "T-090 criterion 10: same counts" › "content.json serves 365 questions, climate 50": `365` → `415`.
30. same file › "T-090 criterion 12: nothing else in the bank moved" › "content.json: every non-climate question deep-equal to 3279555": limit it to non-`map_click`, or re-pin.
31. same file › "T-090 criterion 20: no other surface changes" › "frontend (except []) is byte-identical to 3279555": re-pin or delete (T-090-only).
32. same file › same describe › "openapi.yaml (except []) is byte-identical to T-089's tree": re-pin or delete.
33. same file › same describe › "backend/app (except [ "backend/app/data/content.json" ]) is byte-identical to T-089's tree": re-pin or delete.

**F. e2e (not run here; will go red in CI whenever a `mixed` or `location` quiz serves `map_click`):**
34. `e2e/tests/app.ts`: `answerAtRandom`, `answerDeliberately`, `awaitFreshQuestion` and `fetchAnswerKey` assume choice buttons. Proposed modification:
    - when `[role="button"][data-geometry-id]` is present, answer on the map;
    - pick at random, or by `answerGeometryId` from `fetchAnswerKey` (which should also key `map_click` ids to `answerGeometryId`);
    - `awaitFreshQuestion` should wait for either a choice button or a tappable state.
    - Tap with `locator.focus()` + `keyboard.press("Enter")`, or `dispatchEvent("click")`. A plain `click()` hits the bounding-box centre, which on a concave state such as Michigan or Maryland can land on a neighbour.
35. Affected tests:
    - `e2e/tests/quiz.spec.ts`: "every quiz type can be played through", "a right answer earns a fact and a wrong one earns the reason", "the summary counts places, never a percentage or a score", "a session can be picked up by switching profiles and back";
    - `e2e/tests/progress.spec.ts`: all five tests (all play `mixed` or `location`).

    They need the helper change only.

Not stale despite the brief's guess: `test_measure_selection.py`,
`hand-check-levels-verify.test.ts` criterion 14 and
`test_t040…::test_c15_a_withheld_key_leaks_the_answer_nowhere_but_choices` all
pass.

## Verdict

**TL;DR. Not yet a verdict: test changes requested.** All 39 criteria hold
under my own tests: 50 backend, 30 frontend and 1 Playwright spec, with no
failures in anything I could run. The pre-existing suite is still red, but
only from tests this task's own criteria make stale. That is 33 rows below,
and a person must approve them in an attended `tester` session before I can
call this a pass.

- **Independence: weaker than a separate session.** This is an orchestrated
  run (`runs/T-051-map-click-render.md` exists). Every role in it shares
  `cse_01W3CQk9DjveYML94m9kKPKg`, so the Sessions-table check cannot show
  separation. My independence rests only on being a freshly spawned subagent
  with my own context. I did not see the worker's reasoning or session. That
  depends on the orchestrator having spawned me correctly, not on anything I
  could check myself.
- **Handoff present, and the work is on the branch.** Every file it names is
  in `git diff origin/main...HEAD`.
- **Fault: none in the code.** No criterion is unmet. Nothing is ambiguous
  enough to block.
- **Next:** a person starts a `tester` in a session they are attending,
  approves or refuses each row below, and that tester applies the approved
  rows and finishes the verdict.

### Suites, run here (tester, 2026-10-26)

| Suite | Result |
|---|---|
| backend `uv run pytest` | 707 pass, 35 fail, 9 skip. Every failure is a row below. Across three runs, 30 failed every time and 8 failed on some runs only: `test_sessions_api` tests and `test_reveals[location-True]`, which fail whenever selection serves a `map_click` to a `choiceIndex` helper |
| backend `ruff check`, `ruff format --check` | clean |
| frontend `bun test` | 442 pass, 0 fail (412 existing plus my 30) |
| frontend `typecheck`, `lint`, `prettier --check` | clean |
| question-bank `bun test` | 2362 pass, 5 fail. All 5 are rows 29 to 31 |
| e2e `bun run typecheck` | clean |
| **Playwright: not run** | The sandbox has no Chromium. `e2e/tests/map-click.spec.ts` is typechecked but **unrun**. CI on the PR is its first run, and the stale e2e helpers (row 33) will also be red there |
| No network (38) | backend, frontend and question-bank all ran with every proxy variable set to `http://127.0.0.1:1`, with the same results |

### Criterion → test

Backend tests are in `backend/tests/test_t051_tester_criteria.py`, frontend
tests in `frontend/src/components/t051-tester.criteria.test.tsx` (FE below),
and the Playwright spec in `e2e/tests/map-click.spec.ts` (e2e below).

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `test_c1_*`. The 50 file ids are served. The 365 non-`map_click` questions match a digest I computed from `git show 1032b77:backend/app/data/content.json` (`e5be815d…`). Formats are exactly the three |
| 2 | met | `test_c2_*`: equal to the file. The 50 codes are the 50 state FIPS, with no DC |
| 3 | met | `test_c3_no_served_map_click_carries[*]`, five fields |
| 4 | met | `test_c4_no_served_choice_format_question_carries[*]` |
| 5 | met | `test_c5_*` |
| 6 | met | `test_c6_*`, plus by hand: `make -C backend content` twice gives sha256 `20e46a9b…` both times, the same as the committed file, and git sees no diff |
| 7 | met | `test_c7_no_file_says_map_click_is_withheld[*]` |
| 8, 9 | met | `test_c8_*`, `test_c9_*`: string type, not required, and the description's key words |
| 10 | met | `tests/test_contract.py` passes unchanged |
| 11 | met | `test_c11_*`: walks every page at `limit=7`, matching the contract and the key, with no candidate fields |
| 12 | met | `test_c12_*`, for both `/questions/{id}` and a session's next-question |
| 13 | met | `test_c13_*`: the location and mixed pools hold all 50; the other six topics hold none |
| 14 | met | `test_c14_c16_c17_tapping_the_answer_is_correct` |
| 15 | met | `test_c15_*`: each of the other 49 codes, `"11"` and `"1"` is wrong (51 answers with an undo after each) |
| 16 | met | 14 and 15, plus `test_c16_*`: all 50 questions are right with their own code, the highlight is their code and `correctAnswer` is their name |
| 17 | met | 14 and 15 assert no `correctIndex` |
| 18 | met | `test_c18_*[3 cases]`: none, `choiceIndex: 0` and `choiceIndex: null`. 422 with errors `["/tappedGeometryId"]`, counts unchanged, then a graded answer |
| 19 | met | `test_c19_*[correct/wrong]`: profile, counts, level, seen, learned, levelChange and prompts are equal to a `map_identify` answer for the same entity |
| 20 | met | `test_c20_*`: the profile is fully restored. The session fields that do not come back are the same set as after a `map_identify` undo (`seenEntityIds` is not in the session snapshot, for any format). Then it answers again |
| 21 | met | `test_c21_*[4 cases]`: every `choiceIndex` on a `map_identify` and a capital question, with no tap, `"01"`, `"02"` and `"99"` |
| 22 | met | FE "criterion 22" |
| 23 | met | FE "criterion 23": no state name in the markup outside the prompt, and none in any `aria-label`, `title` or `alt` |
| 24 | met | FE "criterion 24": all paths' attributes are identical apart from the own-id value, and so are the hover and pressed styles |
| 25 | met | FE "criterion 25" (role, tabindex, Enter and Space). In a browser: e2e, unrun |
| 26 | met | FE "criterion 26": all atlas ids, numeric padding, and AK, HI, RI and DE send exactly one `submitAnswer` with their code. In a browser: e2e, unrun |
| 27 | met | FE "criterion 27": a second tap in flight sends nothing, and the reveal map has no role, tab stop or handler. In a browser: e2e, unrun |
| 28, 29 | met (colour); banner e2e only | FE "criteria 28 and 29" cover the colour. The banner text appears only after a state change that static markup cannot reach, so it is checked in e2e (unrun) |
| 30 | met | FE "criterion 30" |
| 31 | e2e only (unrun) | Session state after an answer cannot be reached without a DOM. The `Reveal` code path it uses is shared with the other formats and unchanged |
| 32 | met (pure half); browser half e2e | FE "criterion 32": `mapClickView(null)` and the gate release. The full undo is in e2e (unrun) |
| 33 | met | FE "criterion 33" |
| 34 | met | FE "criterion 34": the third button sends exactly `{questionId, choiceIndex: 2}` |
| 35 | met | By git: the sha256 of every `package.json`, `bun.lock`, `pyproject.toml` and `uv.lock` in the repo equals `1032b77`'s |
| 36 | met | `test_c36_*` |
| 37 | met | By git: the question file's sha256 equals `1032b77`'s (`982a2087…`). `test_c37_*` checks it still holds the four candidates |
| 38 | met | Dead-proxy runs, above |
| 39 | met | `test_c39_*` (five tests). By git: the `engineering-decisions.md` diff only appends after E-28, so no existing entry changed, and E-29 is the next number |

### How the frontend tests see the map

Static markup normally holds no state paths, because react-simple-maps draws
them in an effect.

- **`Geographies` is replaced** by one that passes every us-atlas geometry to
  `UsMap`'s real children function, and the real `Geography` renders each
  path.
- **`api` is replaced by a recorder**, so a tap is observed as a
  `submitAnswer` call. `fetch` is not touched.
- **`Button` is wrapped** so its `onClick` can be called.
- **These are `mock.module` overrides that spread the real module.** Bun keeps
  them for the rest of the process, and the full suite stays green with them.

### Mutations: each made, run, then reverted (`git status` clean after)

| Mutation | Went red |
|---|---|
| `Session.tsx`: pass `highlightFips={entity.geometryId}` to the `map_click` map before commit | FE 24 (2 tests) |
| `map-click.ts`: tap reports the raw id, no `pad` | FE 26 (padding) |
| `Session.tsx`: drop `answerGate.tryHold()` | FE 27 (second tap in flight) |
| `map-click.ts`: `isTapped = false` | FE 30 |
| `map-click.ts`: Space no longer taps | FE 25 |
| `map-click.ts`: Alaska's `aria-label` is "Alaska" | FE 23 (3), FE 24 (2) |
| `Session.tsx`: choice buttons also send `tappedGeometryId` | FE 34 (2) |
| `map-click.ts`: states stay controls without `onTap` | FE 27 (reveal), FE 33 (2) |
| `grading.py`: compare with leading zeros stripped | `test_c15_*` |
| `serializers.py`: never pop `answerGeometryId` | `test_c12_*` (2) |
| `grading.py`: a missing tap is not a 422 | `test_c18_*` (3) |
| `grading.py`: choice formats read the tap | `test_c21_*` (3 tap cases) |

### For the reviewer (not faults)

- **Undo leaves `seenEntityIds` in place** for every format. This predates the
  task: `SessionRecord.snapshot` does not hold it. Criterion 20 says "as for
  the other formats", and that is what happens.
- **New child-facing text: "A state you can tap"** is the accessible name of
  every state. Per the brief, it goes to a person.
- **The progress map lost its 56 tab stops too** (Handoff, "Found against the
  brief"). Criterion 33 needs this only on quiz maps.
- **I chose the e2e spec's wrong tap myself:** California (`06`), or New York
  (`36`) when the answer is California. It is not a criterion value.

## Test change request

Raised by the tester on 2026-10-26, orchestrated, with no person in the
session. No row has been applied. Each one is stale only because of this
task's own change, and I checked each against the current branch. Every
backend row is red in the run above. Row 33 is unrun. A modify pins the new
behaviour as hard as the old test pinned the old.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `backend/tests/test_content_api.py` › `test_content_version_counts_what_was_seeded` | `73b49f9` (PR #35 merge), later bumped by T-026: served-question count | Crit. 1 adds 50 served `map_click` questions, so the count is 415 | modify | same name. Asserts `questionCount == 415` (was 365), and everything else as now | |
| 2 | `backend/tests/test_content_api.py` › `test_a_bundle_carries_its_entities_and_questions` | `73b49f9`: the bundle carries the whole bank | Crit. 1: 415 | modify | same name. Asserts the bundle holds 415 questions, and the rest as now | |
| 3 | `backend/tests/test_content_api.py` › `test_pagination_walks_the_whole_set_once` | `73b49f9`: cursor pagination visits every question once | Crit. 1: 415 questions, and `range(100)` × `limit 4` stops at 400 | modify | same name. Loop bound `range(200)`. Asserts `len(seen) == 415` and `len(set(seen)) == 415` | |
| 4 | `backend/tests/test_content_api.py` › `test_every_seeded_question_has_a_usable_answer_key` | `73b49f9`: every question can be graded | Crit. 3: `map_click` has no `choices` or `correctIndex` | modify | same name. Choice formats: as now. `map_click`: `answerGeometryId` is a two-digit string, one of the 50 state codes, and there is no `choices` or `correctIndex` | |
| 5 | `backend/tests/test_content_build.py` › `test_version_counts_fifty_entities_and_365_questions` | `f1b9de5`, T-026: bank size | Crit. 1 | modify | renamed `…_415_questions`. Asserts 50 entities and 415 questions | |
| 6 | `backend/tests/test_content_build.py` › `test_served_questions_are_the_files_non_map_click_questions` | `25c7847`, T-040: served = file minus `map_click` | Crit. 1 reverses the exclusion | modify | renamed `test_served_questions_are_every_file_question`. Served ids == all 415 file ids. Each entity's (format, topic) pairs equal the file's, now including `("map_click","location")`. `format=map_click` lists exactly the 50 file `map_click` ids (was `[]`) | |
| 7 | `backend/tests/test_content_build.py` › `test_nothing_served_falls_outside_the_contract` | `25c7847`, T-040: no non-contract key served | Crit. 3/4: `answerGeometryId` is served on `map_click` | modify | same name. `answer` and `choiceGeometryIds` banned on every question. `answerGeometryId` banned on non-`map_click`. `choices`, `correctIndex` and `highlightGeometryId` banned on `map_click` | |
| 8 | `backend/tests/test_content_build.py` › `test_served_question_fields_equal_the_question_file` | `25c7847`, T-040 | Crit. 2/3 | modify | same name. Non-`map_click`: as now. `map_click`: every served field except `reveal` equals the file's, `answerGeometryId` included, and `choices` and `correctIndex` are absent | |
| 9 | `backend/tests/test_content_build.py` › `test_question_ids_with_colons_resolve_and_withhold_the_answer_key` | `25c7847`, T-040 | Crit. 12: the `map_click` key is `answerGeometryId` | modify | same name. Choice formats: as now. `map_click`: with the key, `answerGeometryId` equals the file's; with `includeAnswerKey=false` it is absent | |
| 10 | `backend/tests/test_content_build.py` › helper `_answer()` (fixes `test_reveals[location-True]`, flaky) | `25c7847`, T-040 | Crit. 14/18: `map_click` is answered by `tappedGeometryId` | modify | `map_click`: right sends `tappedGeometryId = answerGeometryId`; wrong sends a different state code. Choice formats unchanged. In `test_reveals`, a wrong `map_click`'s expected label is the entity's name | |
| 11 | `backend/tests/test_content_build.py` › `test_a_perfect_session_reaches_every_question_once[location-50-formats0]` | `25c7847`, T-040 | Crit. 1/13: the location pool is now 100 questions in two formats | modify | parameter becomes `("location", 100, {"map_identify","map_click"})`. 100 distinct ids, formats == that set, and each of the 50 entities seen exactly twice | |
| 12 | `backend/tests/test_content_build.py` › `test_a_perfect_session_reaches_every_question_once[mixed-100-formats2]` | `25c7847`, T-040 | Crit. 1 | modify | formats == `{"map_identify","map_click","multiple_choice"}` (strict, as now). Still 100 distinct ids | |
| 13 | `backend/tests/test_t040_tester_criteria.py` › `test_c6_version_counts_50_entities_and_365_questions` | `f1b9de5`, T-026 | Crit. 1 | modify | renamed `…_415_questions`. Asserts 50 and 415 | |
| 14 | `backend/tests/test_t040_tester_criteria.py` › `test_c11_served_ids_are_the_files_non_map_click_ids` | `acaa4a1`, T-040 tester | Crit. 1 | modify | renamed `test_c11_served_ids_are_every_file_id`. The same change as row 6 | |
| 15 | `backend/tests/test_t040_tester_criteria.py` › `test_c12_no_map_click_is_served_filtered_or_not` | `acaa4a1`, T-040 tester | Crit. 1/11 reverse it | modify | renamed `test_c12_every_map_click_is_served_filtered_or_not`. `format=map_click&limit=500` returns exactly the 50 file `map_click` ids. The unfiltered listing contains all 50 | |
| 16 | `backend/tests/test_t040_tester_criteria.py` › `test_c10_no_served_key_outside_the_contract` | `acaa4a1` | Crit. 3/4 | modify | the same change as row 7 | |
| 17 | `backend/tests/test_t040_tester_criteria.py` › `test_c13_served_question_fields_equal_the_question_file` | `acaa4a1` | Crit. 2/3 | modify | the same change as row 8 (`QUESTION_KEYS` plus `answerGeometryId` for `map_click`) | |
| 18 | `backend/tests/test_t040_tester_criteria.py` › `test_c14_every_question_validates_and_its_key_is_the_files_answer` | `acaa4a1` | Crit. 3 | modify | same name. Every row validates as `Question`. Choice formats: as now. `map_click`: `answerGeometryId` equals the file's, and there is no `choices` or `correctIndex` | |
| 19 | `backend/tests/test_t040_tester_criteria.py` › helper `play()`, and through it `test_c20_c21_c25_…[location-map_identify-True]`, `test_c25_a_perfect_mixed_session_reaches_100_distinct_served_questions`, `test_c22_every_wrong_answer_names_the_answer_and_highlights_the_state` | `acaa4a1` | Crit. 1/14 | modify | `play()` as in row 10. c20 `location`: plays 100, each entity twice, and the format is `map_identify` or `map_click`; fact and highlight checks unchanged. c25: formats == all three. c22: formats == all three; for `map_click` the expected label is the entity's name; other checks unchanged | |
| 20 | `backend/tests/test_t026_tester_criteria.py` › `test_c36_map_click_is_still_withheld` | `d201e70`, T-026 tester | Crit. 1 reverses it exactly. T-051 `test_c1_*` covers the new behaviour | delete | | |
| 21 | `backend/tests/test_t026_tester_criteria.py` › `test_c37_no_served_question_gains_a_prose_field` | `d201e70` | Crit. 2: `answerGeometryId` is a key, not prose | modify | same name. `old_keys` gains `answerGeometryId` only | |
| 22 | `backend/tests/test_t026_tester_criteria.py` › `test_c37_old_served_questions_are_byte_for_byte_main_s` | `d201e70` | `OLD` includes `tpl-click-the-map`, which now adds 50 | modify | filter on `tpl-identify-on-map` and `tpl-capital-of` only. Asserts 100, with the same digest `55ce822c…` (I recomputed it on this branch and it matches) | |
| 23 | `backend/tests/test_t026_topics.py` › `test_all_265_new_questions_are_served_with_their_topic_and_format` | `a6e3478`, T-026 worker | Its last line asserts no `map_click` is served; crit. 1 | modify | same name. Delete only the last line; the 265 checks stay | |
| 24 | `backend/tests/test_t026_topics.py` › `test_served_question_keys_are_unchanged_by_the_new_templates` | `a6e3478` | Crit. 2: `map_click` carries `answerGeometryId` | modify | same name. Non-`map_click` keys ⊆ `QUESTION_FIELDS ∪ {reveal}` (as now). `map_click` keys ⊆ `MAP_CLICK_FIELDS ∪ {reveal}` | |
| 25 | `backend/tests/test_sessions_api.py` › helper `answer()`, and `test_a_correct_answer_returns_the_reward_and_the_key`. Flaky, seen red: `test_serving_advances…`, `test_a_question_can_be_served_without_its_answer_key`, `test_a_milestone…`, `test_only_the_most_recent…`, `test_the_summary_counts…`, `test_ending_twice…`, `test_undo_backs_out…`, `test_a_level_change_is_absent…`, and the worker's list | `73b49f9` | Crit. 1/14: mixed sessions now serve `map_click` | modify | `answer()` as in row 10. In `test_a_correct_answer…`, a `map_click` asserts no `correctIndex` and `correctAnswer` == the entity's name; otherwise `correctIndex` as now. In `test_a_question_can_be_served_without…`, also assert `answerGeometryId` absent | |
| 26 | `backend/tests/test_t089_tester_criteria.py` › `test_criterion_13_exactly_one_new_entry_numbered_gap_free` | `eebec2c`, T-089 tester | Crit. 39 adds E-29 | modify | same name. `range(1, 30)` | |
| 27 | `backend/tests/test_t089_tester_criteria.py` › `test_criterion_15_nothing_but_those_two_descriptions_changes` | `eebec2c` | It pins `openapi.yaml`'s structure as of T-089, and crit. 8/9 change it. The job was T-089's own diff | delete | (Alternative: re-pin to this branch's digest. I recommend against it, because the pin goes stale on every contract task) | |
| 28 | `backend/tests/test_t089_tester_criteria.py` › `test_criterion_17_content_json_byte_identical` | `eebec2c` | It pins `content.json`'s sha; crit. 1 changes it. The job was T-089's own diff | delete | (Same alternative as row 27) | |
| 29 | `question-bank/src/climate-far-phrases-verify.test.ts` › "T-090 criterion 10: same counts" › "content.json serves 365 questions, climate 50" | `2023a09`, T-090 tester | Crit. 1 | modify | renamed "…serves 415 questions, climate 50". Asserts 415 and 50 | |
| 30 | same file › "T-090 criterion 12: nothing else in the bank moved" › "content.json: every non-climate question deep-equal to 3279555" | `2023a09` | Crit. 1 adds 50 that were not in 3279555 | modify | renamed "…every non-climate, non-`map_click` question deep-equal to 3279555". The same deep-equality over that set | |
| 31 | same file › "T-090 criterion 20: no other surface changes" › "frontend (except []) is byte-identical to 3279555", "openapi.yaml (except []) is byte-identical to T-089's tree", "backend/app (except [ "backend/app/data/content.json" ]) is byte-identical to T-089's tree" | `2023a09` | T-051 must change all three surfaces (Constraints). The job was T-090's own diff | delete (three tests) | (Alternative: re-pin. I recommend against it, as in row 27) | |
| 32 | `e2e/tests/app.ts` › `fetchAnswerKey` | `73b49f9` | Crit. 3: `map_click` ids have no `choices`, so the key skips them | modify | also maps each `map_click` id to its `answerGeometryId` (for example, a key value tagged as a geometry id). Choice entries unchanged | |
| 33 | `e2e/tests/app.ts` › `answerAtRandom`, `answerDeliberately`, `awaitFreshQuestion`; through them `quiz.spec.ts` "every quiz type can be played through", "a right answer earns a fact and a wrong one earns the reason", "the summary counts places, never a percentage or a score", "a session can be picked up by switching profiles and back", and all five `progress.spec.ts` tests | `73b49f9` | Crit. 22: a `map_click` has no `data-variant="choice"` buttons, so "a question with nothing to answer it with" fails and `awaitFreshQuestion` waits forever | modify | when `[role="button"][data-geometry-id]` is present: `answerAtRandom` taps a random one; `answerDeliberately` taps `answerGeometryId` (right) or another state (wrong), with the same graded-as-wanted assertion; `awaitFreshQuestion` waits for a choice button **or** a tappable state. Taps go through `focus()` + Enter or `dispatchEvent("click")`. Choice paths unchanged | |

**To approve:** start the `tester` step for T-051 in a session you are
attending and answer each row there. Writing a Decision here first is fine, but
the tester still asks you to confirm it in its own session (D-15). There are no
count floors in these files, so no floor row is needed.

## Notes

- **Worker, 2026-10-26.** Model: Opus, as the brief asks.
- **Two layers guard against a double tap.** `result || busy` reads React state,
  which is stale until the next render. Two taps in one frame, or a tap landing
  between `setResult` and the re-render, would both get through, and the second
  would come back 409. The ref-held `createAnswerGate` closes that gap. It also
  guards the choice buttons, with no visible change for them. **Tester to
  confirm** criterion 27 in a browser if it can.
- **The answer key is guarded in two places.** `served_question` dispatches on
  format, so `answerGeometryId` is copied only for `map_click`. Criterion 4 does
  not depend on the question file leaving it off other formats. Putting
  `answerGeometryId` into `QUESTION_FIELDS` instead would have kept stale test 13
  green. I chose the explicit allowlist. **Reviewer to confirm.**
- **The tapped-state style is a choice with no criterion behind it.** It is the
  highlight fill plus a dashed, darker outline. The outline is the cue that does
  not rely on colour (Review checklist). It reuses existing CSS vars, so
  `styles.css` is untouched. **Reviewer to judge** whether orange reads as "where
  you tapped" rather than as a mistake.
- **Proposed follow-ups for the reviewer's sweep into `tasks.md`:**
  - the generator should stop writing `choices`, `correctIndex` and
    `choiceGeometryIds` for `tpl-click-the-map` (E-29, owner: question-bank);
  - small-state hit areas, if the tablet check fails (owner: a map-level task
    beside T-043);
  - pin-format 422s should name `/pin`, not `/choiceIndex` (owner: whichever task
    builds pin formats).
