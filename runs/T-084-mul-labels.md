# T-084 — Read Wikidata's `mul` labels, so Juneau comes back as "Juneau" — run log

**Task:** T-084 · **Branch:** `claude/stoic-babbage-lsgku4` · **PR:** Dkaattae/geo-discovery-zone#105
**Started:** 2026-10-29 · **Outcome:** halted — needs human

## Preflight — 2026-10-29
- `origin/main` at `12cb7e6`; `tasks/` held only `README.md` and `TEMPLATE.md`.
- Branch `claude/stoic-babbage-lsgku4` was not on the remote; pushed it at `origin/main` before spawning.
- G1: `git diff --name-only origin/main...HEAD` empty.

## Round 1 — task-expander — 2026-10-29
`Next step` on entry: none (no brief) → on exit: `human`
`Status` on exit: `blocked` · branch head `0452e74`

**I've drafted the T-084 brief, but it's blocked until a person answers Q1.** The `tasks.md` entry leaves splitting the task for a person to decide, and an unattended run can't decide it, because the orchestrator stamps approval with no one reading the brief. The brief is pushed and draft PR #105 is open. Status is `blocked`, Next step is `human`.

**What the person needs to do:** answer Q1 in `/home/user/geo-discovery-zone/tasks/T-084-mul-labels.md`, which is also in the PR #105 body.
- **(a) Split. The brief is written for this.** The task covers only the query: ask Wikidata for `"en,mul"` labels, with `mul` used only when there is no `en` label for the highest point and the borders. No committed data byte moves. Re-recording the fixture and checking live that Alaska's capital is Juneau go with the first real refresh, next to T-095 and T-087.
- **(b) Whole.** The task also re-records both SPARQL fixtures from a live refresh. The fixture was captured 2026-08-04, so this pulls in about three months of Wikidata changes across all 50 states. Every bank pin T-095 lists goes red, and the tester step has to be attended. Choosing (b) sends the brief back to the expander.

If they approve (a), they put their name and the date on the `Approved:` line, set Status to `awaiting approval` and Next step to `worker`.

**Why (a) is the default:** the committed fixture already records `Juneau` for Alaska's capital. So the committed bank and `content.json` already ship Juneau, and the bug only appears on a live refresh.

**Survey:**
- **No live brief at start:** `tasks/` held only README and TEMPLATE, so nothing was left over from the last cycle.
- **T-084 was the pick:** it is the first entry in `tasks.md` whose dependencies are done. T-070 landed in PR #103.
- **No test pins the query text:** I found none by grep. The fixture transport matches on the imported `US_STATES_QUERY` constant, so changing the text keeps offline replay working.
- **What only a live endpoint can show:** whether `en` really wins over `mul` can't be tested offline. The worker runs the old and new queries live once and records the result in the Handoff (the brief's Review checklist).

**Criteria as drafted (10):**
- **1–5, the query:** it asks for exactly `"en,mul"`, in that order. The highest point and border names fall back to `mul` only when `en` is missing, and a border with both labels gives one name. The twelve result variables and the `GROUP BY` are unchanged, and the elevation query is byte-identical to `main`.
- **6–10, what must not move:**
  - No byte changes in `question-bank/data/`, either fixture, or `backend/app/data/content.json`.
  - The offline rebuild still matches the committed bank.
  - The T-077 bare-QID guard still holds.
  - The full suite is green with no existing test changed.
  - No test reaches the network, and no dependency is added.

**Pushed to `claude/stoic-babbage-lsgku4`:**
- **Commits:** `25474be` (the brief plus the `tasks.md` status line), then a second commit recording PR #105 in the brief header. The branch matches its remote.
- **Diff against `origin/main`:** only `tasks.md` and `tasks/T-084-mul-labels.md`. No source, tests or config.
- **`tasks.md`:** T-084 is now marked `doing — brief blocked on Q1`. `PROGRESS.md` is not touched.
- **`tasks.md` changed on disk during the run:** the tool reported it after my commit. I did not re-read it, and the committed diff shows only my 3-line edit.

## Halted — 2026-10-29
Header: `Status: blocked`, `Next step: human`, `Approved: pending`. The orchestrator did not stamp `Approved:`, because the brief is blocked on a person's decision.

What a human has to decide, quoted from the header: "answer **Q1** below. If you approve the split as drafted, replace `pending` on the Approved line with your name and the date, set Status to `awaiting approval` → `working` and Next step to `worker`."
