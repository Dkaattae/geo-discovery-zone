# T-051 — Serve and render `map_click`: tap the state on the map — run log

**Task:** T-051 · **Branch:** `claude/affectionate-bell-r03ap2` · **PR:** #96
**Started:** 2026-10-26 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-10-26
`Next step` on entry: none (no brief) → on exit: `human` (Status: `blocked`)

**T-051 is halted on Q1, a product question, and needs a person before any code is written.** The brief is written and pushed, and draft PR #96 is open. Status is `blocked` and Next step is `human`.

**Q1: on a `map_click` question, which states can a child tap?** Each question has four candidate states. The backend grades by `choiceIndex` alone, and the answer request has no field for a tapped state.
- **(a) Shade the four candidates, and only they can be tapped.** Grading and the answer request stay as they are. This is my recommendation, and the criteria are written for it.
- **(b) Any state can be tapped, and nothing is shaded.** The answer request gains a field and `grading.py` has to change.
- **(c) Nothing is shaded, but only the four respond.** Taps on the other 46 states do nothing.

**To resume:**
- **If you pick (a)** and accept the criteria as written, fill in `Approved:` in the brief and set Next step to `worker`.
- **If you pick (b) or (c)**, set Next step to `task-expander`. It rewrites the criteria marked [Q1] (15–19, 22 and 24) for a fresh approval.

**Why T-051.** It is the first task in the queue whose dependencies are done. T-020 landed in PR #79. T-070, T-084, T-085, T-088, T-091 and T-056 each still wait on a person.

**What the brief holds:**
- **29 criteria** in six groups: serving, contract and API, the client presenting the question, the reveal, what must not change, and a recorded decision.
  - The serving and API criteria hold whichever way Q1 goes.
  - Criterion 29 asks for a new decision entry, `E-29`.
  - Criterion 11 (grading) should already pass once the questions are served, since `grading.py:39` already lists `map_click`.
- **No jsdom or testing-library in `frontend/`.** The constraints say the tap criteria must be checkable through static markup, a pure function or the existing Playwright suite. Adding either library is a dependency request for a person.
- **Plan to attend the tester step.** Serving 50 more questions breaks several existing tests by design:
  - the "365 questions" count pins in the backend and `climate-far-phrases-verify`;
  - the T-026 and T-040 tests that assert `map_click` is withheld;
  - the T-089, T-090 and T-025 digest guards over `content.json`, `openapi.yaml`, `frontend/`, `backend/app/` and the `E-n` numbering;
  - the Playwright `answerAtRandom` helper, which expects answer buttons.

  The brief lists them with file and line.

**What I changed and pushed:**
- **Commits:** `f22109f` (the brief and `tasks.md`) and `3756f10` (PR number in the header).
- **Push confirmed:** `git log origin/claude/affectionate-bell-r03ap2` shows `3756f10` at the tip.
- **Files touched:** only `tasks/T-051-map-click-render.md` and `tasks.md`. In `tasks.md`, T-051 is now `doing — brief blocked on Q1` and T-084 has a new skip line.
- **Nothing to sweep:** `tasks/` held no leftover brief from the last cycle.
- **Not run:** I ran no build, tests or pipeline.

### Gates after return
- G5: Status and Next step changed (no brief → `blocked` / `human`). Pass.
- G1: diff vs main is `tasks.md`, `tasks/T-051-map-click-render.md`. Pass.
- `Approved:` not stamped — the run halts on `Next step: human` before any build step.

## Halted — 2026-10-26
The expander asks, quoted: "**Q1: on a `map_click` question, which states can a child tap?**" — (a) shade the four candidates, only they tappable (recommended; criteria written for it); (b) any state tappable, nothing shaded (contract and `grading.py` change); (c) nothing shaded, only the four respond.

A human has to answer Q1 in the brief and set `Next step` (`worker` for (a) with `Approved:` filled in; `task-expander` for (b)/(c)).

## Resumed — Q1 answered — 2026-10-26
Dkaattae, in the orchestrator session, verbatim: "eh... why a map click question has four candidate states? if it is clicking, just do not provide options."

Recorded in the brief's `Next step` line, which now reads `task-expander`. Not one of the three listed options as worded: no candidate options at all, any state tappable.

## Round 2 — task-expander — 2026-10-26
`Next step` on entry: `task-expander` (Status `blocked`) → on exit: `worker` (Status `awaiting approval`)

**TL;DR:** I rewrote the T-051 brief to follow Dkaattae's Q1 answer: a `map_click` question has no options, the child can tap any state, and the backend grades the tapped geometry id. The brief is now `Status: awaiting approval` and `Next step: worker`, with `Approved: pending`. A person has to approve it before the worker runs. Pushed as `d593b7f` to `claude/affectionate-bell-r03ap2`, and `origin` shows that commit at its tip.

**What the Q1 answer changed in the brief**
- **Grading changes.** `AnswerRequest` gets a new `tappedGeometryId` field. `map_click` is graded by exact string match against `answerGeometryId`. Both names are fixed in the brief so the tester can check them.
- **The four options are no longer served.** A served `map_click` question carries no `choices`, `correctIndex` or `choiceGeometryIds`.
- **The answer key is `answerGeometryId`.** It is left out when `includeAnswerKey=false`, the same way `correctIndex` is.
- **Client.** Before the commit, every state is drawn the same way and can be tapped or reached by keyboard. No state name shows except in the prompt. The reveal colours the answer state and marks the tapped state differently.
- **New error behaviour.** A missing `tappedGeometryId` returns 422 with the path `/tappedGeometryId`. `map_identify` and `multiple_choice` are still graded by `choiceIndex`.
- **What stays the same.** No migration is needed: `AnswerRecord` stores `correct`, not the option chosen. No new dependency, and the question file is not changed.
- **Decision record.** A new E-29 entry records the decision. It updates E-24 and E-20, and notes that E-21's options are still generated but no longer served.

**Criteria**
- **39 in total, covering:** serving, contract, API serving, API grading, client presentation, reveal, what must not change, and the recorded decision.
- **Still for a person (Review checklist):** whether small states can be tapped (RI, DE, CT), the AK and HI insets, any new child-facing text, and whether hovering gives the answer away.

**Not done**
- **No product question is open.** Choosing the two field names and making the server's matching exact are engineering calls, and the brief writes them down.
- **The question-bank generator still writes unused options for `map_click`.** I left that out of scope as a follow-up and did not add it to `tasks.md`.
- **I ran no build, tests or pipeline.**

**Files**
- `/home/user/geo-discovery-zone/tasks/T-051-map-click-render.md`: rewritten for Q1. The header is updated and a second Sessions row is added (session `cse_01W3CQk9DjveYML94m9kKPKg`).
- `/home/user/geo-discovery-zone/tasks.md`: the T-051 status line now reads "brief awaiting approval", plus a note on the Q1 answer.
- **These are the only two files in the commit**, so it stays within what the expander may write (G1).

**PR**
- **#96 updated** (https://github.com/Dkaattae/geo-discovery-zone/pull/96): the title and body now carry the rewritten criteria. It is still a draft.
- **Plan to attend the tester step.** Several existing tests will go red by design: the 365 count pins, the assertions that `map_click` is withheld, the digest guards, and Playwright's `answerAtRandom`. The brief lists them with file and line.

### Gates after return
- G5: Status and Next step both changed. Pass.
- G1: diff vs main is `runs/`, `tasks.md`, `tasks/T-051-…`. Pass.
- G2: `Approved: pending`. Dkaattae is in the session, so approval is asked of them rather than stamped as unattended.
