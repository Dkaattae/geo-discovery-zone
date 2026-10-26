# T-051 — Serve and render `map_click`: tap the state on the map

**Status:** `blocked`
**Next step:** `human`. Answer **Q1** below. If you pick **(a)** and accept the
criteria as written, record approval on the `Approved:` line and set Next step to
`worker`. If you pick (b) or (c), set Next step to `task-expander`, which rewrites
the Q1-dependent criteria (marked **[Q1]**) for a fresh approval.
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-051
**Branch:** `claude/affectionate-bell-r03ap2`
**PR:** opened draft at expand time against the branch above (number in the PR list;
the expander's report names it)
**Fault:** the queue entry does not say what a child may tap on a `map_click`
question. Two of the three answers change the contract and the grading, so it is a
product call for a person, not the expander (Q1).

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-26 | cse_01W3CQk9DjveYML94m9kKPKg |

## Q1 — what can a child tap on a `map_click` question? (blocks approval)

Each generated `map_click` question carries **four** candidate states:
`choices` (names), `choiceGeometryIds` (FIPS codes, parallel), and `correctIndex`.
The three distractors are the answer's nearest neighbours (E-21). The backend
grades `map_click` by `choiceIndex` alone (`backend/app/grading.py:39`,
`CHOICE_FORMATS`), and `AnswerRequest` has no field for a tapped geometry id.
The queue entry and E-20 say "a tap on region X becomes the choice whose code is
X", but neither says what happens on the other 46 states. Three answers:

- **(a) Mark the four candidates; only they can be tapped.** The four states are
  shaded alike, the rest of the map is plain and does nothing when tapped. It is a
  recognition task with a 25% guess floor, like plan §2.5's "pick from labelled
  pins". It needs **no backend grading or `AnswerRequest` change**. It uses the
  nearest-neighbour distractors as T-022 built them to be used.
- **(b) Any state can be tapped; nothing is marked.** This is free recall and
  harder. A tap outside the four cannot become a `choiceIndex`, so `AnswerRequest`
  gains a field (for example a tapped geometry id) and `grading.py` learns to grade
  it. That is E-20's own revisit trigger. The four `choices` then mean nothing to
  the child. Bigger task, and arguably a different format (plan §2.5 Format B is
  the pin version of the same idea).
- **(c) Nothing is marked, but only the four respond.** No backend change. A
  6-year-old tapping their best guess and seeing nothing happen on 46 states out
  of 50 reads as a broken app. Listed for completeness.

**The expander's recommendation is (a)**: no contract change to grading, it uses
the distractors as built, and it leaves (b) open as a harder format later. The
criteria below are written for (a). Criteria marked **[Q1]** change under (b) or
(c). Everything else holds whichever way Q1 goes.

## Goal

The question file already holds 50 `map_click` questions ("Find Alaska on the
map."), and they are withheld only because the client cannot draw them (E-24).
Serving and rendering them adds the third v1 format (plan §4), and the first one
where the child answers on the map itself rather than with a name button.

## What is already true

Survey, 2026-10-26, so the worker does not rebuild it:

- **The questions exist.** `question-bank/data/questions/us-states.json` holds
  50 `map_click` questions (`tpl-click-the-map`, topic `location`, levels 4.5 to
  9). Each has `choices`, `correctIndex`, `choiceGeometryIds` with
  `choiceGeometryIds[correctIndex] === answerGeometryId`, and no
  `highlightGeometryId`.
- **Grading needs no change under (a).** `grading.py:39` already puts `map_click`
  in `CHOICE_FORMATS`. `build_reveal` (`grading.py:197`) already sets
  `mapHighlightGeometryId` from the entity's `geometryId` on a wrong answer, and
  on a correct one when the question's `reveal` is `map_highlight`. Criterion 10
  is expected to be satisfied by existing code once the questions are served.
- **`QuestionFormat` already lists `map_click`**: `openapi.yaml:1328`,
  `backend/app/models.py:65` and `frontend/src/lib/api/types.ts:14`.
- **What is missing:** `map_click` is not in `SERVED_FORMATS` or
  `REVEAL_BY_FORMAT` (`backend/app/content_build.py:81`, `:85`).
  `choiceGeometryIds` is not in `QUESTION_FIELDS` (`:63`), in the `Question` model
  (`models.py:181`; responses go through `response_model`, so an unlisted field is
  dropped), or in `openapi.yaml`'s `Question` schema (`:1543`). `Session.tsx` has
  no `map_click` branch. `UsMap.tsx` has no tap handling.

## Acceptance criteria

Frozen once approved. "Served" means present in the committed
`backend/app/data/content.json`. "The question file" means
`question-bank/data/questions/us-states.json` as committed on this branch.

### Serving

1. Every `map_click` question in the question file is served (50 at the time of
   writing). Every `map_identify` and `multiple_choice` question served before this
   task is still served, and no question of any other format is.
2. Each served `map_click` question's `choices`, `correctIndex` and
   `choiceGeometryIds` are equal, element by element, to the question file's
   values for the same `id`.
3. No served `map_click` question carries `highlightGeometryId`, `answer` or
   `answerGeometryId`.
4. No served `map_identify` or `multiple_choice` question carries
   `choiceGeometryIds`.
5. Every served `map_click` question has `reveal: "map_highlight"`. Every served
   `map_identify` and `multiple_choice` question's `reveal` is the same as before
   this task.
6. The committed `content.json` is byte-identical to what `make -C backend content`
   writes from the committed inputs, and a second run writes the same bytes.
7. None of `backend/app/content_build.py`, `backend/app/data/content.json` or
   `backend/README.md` still says `map_click` questions are withheld or not served.
   In particular none of them contains `until T-051` or `joins in T-051`.

### Contract and API

8. `openapi.yaml`'s `Question` schema has a `choiceGeometryIds` property: an array
   of strings, not in `required`. Its description says it is present on `map_click`
   questions only, and that entry `i` is the geometry id of the state named by
   `choices[i]`. The backend's existing contract tests, which walk `openapi.yaml`
   against the app in both directions, pass.
9. Listing questions with `format=map_click` through `GET /api/v1/questions`, across
   every page, returns exactly the served `map_click` questions. Each has
   `choiceGeometryIds` with the same length as its `choices`, which is 4.
10. With `includeAnswerKey=false`, a `map_click` question from
    `GET /api/v1/questions/{id}` omits `correctIndex` and still carries `choices`
    and `choiceGeometryIds`. The same holds for a `map_click` question served by a
    session's next-question operation with `includeAnswerKey=false`.
11. Answering a served `map_click` question in a session with
    `choiceIndex == correctIndex` returns `correct: true`. Each of the other three
    indices in 0–3 returns `correct: false`. In both cases the reveal's
    `mapHighlightGeometryId` equals `choiceGeometryIds[correctIndex]`.
12. With the committed bank loaded, the candidate pool for a `location` session
    and for a `mixed` session each contains all served `map_click` questions. No
    other topic's pool contains any.

### Client: presenting a `map_click` question

13. A served `map_click` question renders its prompt and a US map. It renders no
    answer buttons: no element with `data-variant="choice"`.
14. Before an answer is committed, none of the three wrong choices' names appears
    in the rendered markup, as visible text or in an `aria-label`, `title` or
    `alt`. The answer's own name appears only where the prompt contains it.
15. **[Q1]** Before an answer is committed, the four states in
    `choiceGeometryIds` share one fill, and no other state has that fill.
16. **[Q1]** Before an answer is committed, the answer's state cannot be told apart
    from the other three candidates in the markup: same fill, stroke, stroke width,
    class list and `role`, and same `aria-*` and `data-*` attributes, except an
    attribute whose value is that state's own geometry id.
17. **[Q1]** Each of the four candidates is an interactive control: it has
    `role="button"` (or is a `<button>`), and it is in the tab order. Enter or
    Space on a focused candidate does what a tap does. No non-candidate state has a
    button role or is in the tab order.
18. **[Q1]** Tapping or activating the candidate whose geometry id is
    `choiceGeometryIds[i]` submits exactly one answer for that question, with
    `choiceIndex: i`. This holds for each of `i` = 0, 1, 2 and 3.
19. **[Q1]** Tapping a state outside `choiceGeometryIds` submits nothing and
    changes nothing on screen.
20. While a reveal is on screen, tapping or activating any state submits nothing.

### Client: the reveal

21. After a correct answer, the answer's state is filled with the same
    correct-answer colour a `map_identify` reveal uses (`var(--map-correct)`), and
    the banner reads "You got it" with the server's headline, as for the other two
    formats.
22. **[Q1]** After a wrong answer, the answer's state is filled with the correct-answer
    colour. The tapped state is drawn differently from both the answer's state and
    the two untapped candidates. The banner reads "The answer is <name>", where
    `<name>` is the server's `correctAnswer`.
23. After a wrong answer, Next stays disabled until the server's
    `nextEnabledAfterMs` has passed, and "Oops, tapped by mistake" is offered, as
    for the other two formats.
24. **[Q1]** Undoing a wrong `map_click` answer returns the question to how it was before
    the tap: the candidates are marked as in criterion 15 and can be tapped again.

### What must not change

25. A `map_identify` question still renders its highlighted state and four answer
    buttons. A `multiple_choice` question still renders its choice panel
    (`choicePanel`, `frontend/src/lib/topics.ts`) and four answer buttons. Neither
    renders any state with a button role or in the tab order.
26. No dependency is added or changed in any `package.json`, `bun.lock`,
    `pyproject.toml` or `uv.lock`.
27. No database migration is added: `backend/migrations/versions/` still holds only
    `0001_initial_schema.py`.
28. No test reaches the network.

### Recorded decision

29. `engineering-decisions.md` gains `E-29`, the next unused number. It says what a
    child can tap on a `map_click` question and why, names the options not taken,
    says it updates E-24's "`map_click` is withheld until T-051" and answers E-20's
    revisit trigger, and ends with a `**Revisit when**` line. No existing `E-n`
    entry is edited.

## Out of scope

- **Any other format**: `image`, `ab_compare`, the pin formats, `drag_order`,
  `click_profile` (T-045, plan §2.5).
- **Free-recall tapping**, option (b), unless Q1 picks it. Then it comes back
  through the expander.
- **Regenerating the question file** or changing `tpl-click-the-map`, its prompt,
  its distractors (E-21) or its seeded levels (E-22, T-085). This task serves the
  50 questions as they are.
- **The served `entity` gives the answer away.** A `map_click` question's served
  `entity.geometryId` is its answer, as a superlative's entity is (T-053). The
  client must not show it before commit (criteria 14 to 16), but hiding it from
  the network tab is T-053's product decision, not this task's.
- **Map-level changes**: shaded relief (T-043), zoom, insets, physical features.
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
  `backend/app/models.py`, `backend/README.md`, `openapi.yaml`,
  `frontend/src/components/Session.tsx`, `frontend/src/components/UsMap.tsx`,
  `frontend/src/lib/api/types.ts`, `engineering-decisions.md`, plus new test files.
  Anything else needs a reason in the Handoff.
- **Grading stays by `choiceIndex`** under (a). `backend/app/grading.py` and
  `AnswerRequest` do not change.
- **No new dependency.** The frontend has no jsdom and no `@testing-library/react`.
  Its component tests render to static markup with `react-dom/server`
  (`frontend/src/components/screens.criteria.test.tsx`). Adding either is a
  dependency request for a person (`CLAUDE.md`, "Packages"). Criteria 13 to 24 must
  be checkable without one: through static markup, through a pure function, or
  through the Playwright suite in `e2e/`, which CI runs on every PR.
- **Join on codes, never names** (`conventions.md`; plan §2.3). A tap maps to a
  `choiceIndex` through `choiceGeometryIds`, never by comparing a state's name.
  us-atlas ids are matched after `pad()` to two digits, as `UsMap.tsx` does now.
- **Generous hit areas** (plan §2.3): Rhode Island, Delaware and Connecticut are
  among the candidates. This is checked by a person (Review checklist), not by a
  test.
- **Text a child reads**: any new visible or announced text, such as an
  accessible name for a candidate or a hint, is child-facing. The reviewer
  escalates it (`process.md` step 6 envelope). Keep new text to the minimum.
- **Not eligible for the light path**: touches `openapi.yaml` and child-facing
  text.
- **Worker model:** Opus. It is an interaction design with more than one
  defensible answer (`process.md`, "Choosing the worker's model").

### Expected test cost: plan to attend the tester step

Serving 50 more questions and editing `frontend/`, `backend/app/` and
`openapi.yaml` turns several pre-existing tests red by design. The worker lists
them under **Tests made stale**. The tester raises a Test change request, which a
person approves in an attended tester session (D-14, D-15). Known from the survey:

- **Served-count pins of 365:** `backend/tests/test_content_build.py` (`:90`,
  `:152`), `test_content_api.py` (`:29`, `:150`, `:151`, `:170`),
  `test_t040_tester_criteria.py` (`:155`, `:222`),
  `test_t026_tester_criteria.py` (`:55`),
  `question-bank/src/climate-far-phrases-verify.test.ts` (`:536`).
- **"map_click is withheld" assertions:** `test_t026_tester_criteria.py`
  `test_c36_map_click_is_still_withheld`; `test_t040_tester_criteria.py:541`; and
  possibly `test_c15_a_withheld_key_leaks_the_answer_nowhere_but_choices`.
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

- **Plan:** `geoquizdataplan.md` §1.2 (distractors), §2.3 (FIPS join, generous
  hit areas), §2.5 (Format A, "pick from labelled pins", is the closest analogue
  to option (a)), §3.5 (commit on tap, asymmetric reveal), §4 (the three v1
  formats).
- **Decisions:** `engineering-decisions.md` E-20 (the `map_click` answer is a name
  with its code beside it, and its revisit trigger), E-21 (`choiceGeometryIds`;
  nearest-first distractors), E-24 (what is served, and why `map_click` is
  withheld), E-14 (`openapi.yaml` follows the backend).
- **Contract:** `openapi.yaml` `Question` (`:1543`), `QuestionFormat` (`:1321`),
  `AnswerRequest` (`:2105`), `listQuestions`' `format` parameter.
- **Backend:** `backend/app/content_build.py` (`QUESTION_FIELDS`,
  `SERVED_FORMATS`, `REVEAL_BY_FORMAT`, `_source.note`), `backend/app/models.py`
  `Question` (`:181`), `backend/app/grading.py` (`CHOICE_FORMATS`, `build_reveal`),
  `backend/app/serializers.py` `question_payload`, `backend/app/routers/sessions.py`
  `_serve_next` and the answer handler, `backend/app/store.py`
  `candidate_questions`.
- **Frontend:** `frontend/src/components/Session.tsx` (the `map_identify` branch,
  the choice buttons, `Reveal`, undo), `frontend/src/components/UsMap.tsx`,
  `frontend/src/lib/topics.ts` `choicePanel`, `frontend/src/lib/api/types.ts`,
  `frontend/src/components/screens.criteria.test.tsx` (how component tests are
  written here).
- **Data:** `question-bank/data/questions/us-states.json`, the 50 `map_click`
  entries.
- **E2E:** `e2e/tests/app.ts`, `e2e/tests/quiz.spec.ts`, `e2e/README.md`.
- **Tests:** `test-guidelines.md`; `CLAUDE.md` "Tests".

## Review checklist

Shape criteria above are tests. These are for a person, on the PR:

- [ ] On a tablet-sized viewport, each candidate in Rhode Island's, Delaware's and
      Connecticut's questions can be tapped by a finger without hitting a
      neighbour (plan §2.3).
- [ ] The candidate shading is clear without colour alone, and the reveal reads
      as a reward or a reason, never a red X (plan §3.5).
- [ ] Any new child-facing text (accessible names, hints) reads well to a
      6-to-11-year-old.
- [ ] Alaska's and Hawaii's insets work as candidates.

## Handoff

## Verdict

## Notes
