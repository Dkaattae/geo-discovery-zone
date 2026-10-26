# T-051 — Serve and render `map_click`: tap the state on the map

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** Dkaattae — 2026-10-26, in the orchestrator session, verbatim: "approved". See `runs/T-051-map-click-render.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-051
**Branch:** `claude/affectionate-bell-r03ap2`
**PR:** #96, opened draft at expand time, built from the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-26 | cse_01W3CQk9DjveYML94m9kKPKg |
| task-expander | 2026-10-26 | cse_01W3CQk9DjveYML94m9kKPKg (round 2: criteria rewritten for Q1's answer) |

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

## Verdict

## Notes
