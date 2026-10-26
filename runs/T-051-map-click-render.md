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
