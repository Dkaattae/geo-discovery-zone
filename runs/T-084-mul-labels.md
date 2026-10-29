# T-084 — Read Wikidata's `mul` labels, so Juneau comes back as "Juneau" — run log

**Task:** T-084 · **Branch:** `claude/stoic-babbage-lsgku4` · **PR:** Dkaattae/geo-discovery-zone#105
**Started:** 2026-10-29 · **Outcome:** ready for merge

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

## Resumed — person approval — 2026-10-29
The person attending this orchestrator session answered the halt, in their words: "approve (a), split it, go ahead".
At their instruction the orchestrator updated only the brief header, as the halt's `Next step` told the person to do: `Approved:` now records their words and the date, `Status: awaiting approval → working`, `Next step: worker`. Outcome is back to in progress.

## Round 2 — worker — 2026-10-29
`Next step` on entry: `worker` → on exit: `tester`
`Status` on exit: `awaiting verification` · branch head `6917d3e`

**TL;DR:** T-084 is built and pushed. A live refresh now brings back Alaska's capital as "Juneau" instead of its ID `Q29445`, and no committed data or fixture changed. The brief is at Status `awaiting verification`, Next step `tester`. The commit `6917d3e` is the tip of `origin/claude/stoic-babbage-lsgku4`; I confirmed with `git log origin/claude/stoic-babbage-lsgku4 -1`.

**What changed**
- **`/home/user/geo-discovery-zone/question-bank/src/queries/us-states.ts`:**
  - The label service now asks for `"en,mul"`.
  - The highest point and the border names each read the `en` label and the `mul` label in two OPTIONALs, then take `COALESCE(en, mul)`. So `en` wins and only one name is ever bound.
  - Comments are updated and name T-084.
- **`/home/user/geo-discovery-zone/question-bank/src/mul-labels.test.ts` (new, 7 tests):** they check the query text and capture what `fetchUsStates` sends through the fixture transport. Five of them fail against `main`'s query.
- **`/home/user/geo-discovery-zone/tasks/T-084-mul-labels.md`:** Handoff, Notes, Sessions row and Status filled in.

**Live check (Review checklist):** I ran `main`'s query and the new one at the same time against query.wikidata.org.
- Both return 50 rows.
- Alaska's capital goes from `Q29445` to `Juneau`.
- Alaska's highest point goes from blank to `Denali`. Denali has also lost its `en` label, and a blank on `main` is the allowed exception.
- No other state changed its highest point, border IDs or border names, and no state has a duplicate border name.
- The output is recorded in the Handoff and the three boxes are ticked. Nothing from the run is committed.

**Checks run**
- **question-bank:** 2498 pass, 0 fail. Typecheck, lint and format check are clean.
- **backend:** `make check` gives 739 passed, 9 skipped.
- **frontend:** 390 pass, 6 fail, plus one typecheck error. All of them are "cannot find package" for `react-simple-maps` and `us-atlas`. `bun install` can't download them because the proxy refuses `europe-west1-npm.pkg.dev`. This change doesn't touch the frontend, and the Handoff names these reds as a sandbox problem.
- **Unchanged files:** checked against `origin/main`, nothing moved in `question-bank/data`, the two fixtures, `backend/app/data`, or the elevation query. The local `main` ref was out of date, so I compared against `origin/main`.
- **Tests made stale:** none.

**Decisions for others to confirm (also in the Handoff)**
- **Border filter:** I added `FILTER(BOUND(?borderLabelRaw))`, so a border with neither label is still dropped completely, ID included, as on `main`. Without it, `borderQids` and `borderNames` could get out of step. The tester should confirm it against criterion 3, and the reviewer can overturn it.
- **"Done when" trim:** the trim to `tasks.md` T-084 is left for the sweep or the reviewer.
- **Denali on the next refresh:** Alaska's highest point will change in the bank on the first real refresh. That belongs to whoever owns that refresh (T-087).
- **Same session id:** the worker and expander rows share one id, because subagents of one orchestrated session share `CLAUDE_CODE_REMOTE_SESSION_ID`. The tester should note this when it checks isolation.

## Round 3 — tester — 2026-10-29
`Next step` on entry: `tester` → on exit: `reviewer`
`Status` on exit: `verified — pass` · branch head `f8c1766`

**T-084 tester: PASS. Next step: reviewer.** All 10 criteria hold. My 12 new tests pass, and 11 deliberate breaks of the query (plus `main`'s query itself) each turned at least one of them red. The question-bank and backend suites, typecheck, lint and format are all green. The verdict is pushed to `claude/stoic-babbage-lsgku4` at `f8c1766`, and the remote ref matches.

**Independence is the weaker kind.** This is an orchestrated run (`runs/T-084-mul-labels.md` exists), so my session id `cse_011oDiJdG9Xu3xD21LLaAv1o` matches the worker's row and that check proves nothing. What I can say is that I am a freshly spawned subagent and never saw the worker's reasoning. That rests on the orchestrator having spawned me correctly. The Verdict says so.

**Results by criterion**

| # | Verdict | How it was checked |
|---|---|---|
| 1 | pass | The query the refresh actually sends (captured at a `SparqlTransport` spy) has exactly one language list, `"en,mul"` |
| 2, 3 | pass | For the highest point and for borders, the `en` and `mul` labels are each read in their own optional block and merged so `en` wins. Only one name per item reaches the aggregate |
| 4 | pass | The query keeps the 12 variables in order, matching the list in the criterion and the fixture's `head.vars`, and GROUP BY is unchanged |
| 5, 6 | pass | `git diff` against `origin/main` is empty for the elevation query, `question-bank/data`, the fixtures and `backend/app/data` |
| 7 | pass | The fixture replay accepts the new query and returns 50 states, Alaska → Juneau. It still refuses a query it has no recording for. `committed-bank.test.ts` is green |
| 8 | pass | A capital of `Q29445` is still left blank, with a warning naming the QID |
| 9 | pass | question-bank 2510 pass / 0 fail. Backend `make check` 739 passed, 9 skipped. No existing test was changed |
| 10 | pass | All suites ran with every proxy variable pointed at a dead loopback port. No `package.json` or lockfile changed |

**Things to know**

- **Frontend is red locally for an environment reason, not this change.** It shows 4 fails, 4 errors and 3 TS2307 errors, all `Cannot find package 'react-simple-maps'` or `'us-atlas'`. Those packages are missing from this sandbox's `node_modules`, and the task touches no frontend file. CI on HEAD `12e089b`, which is the worker's code before my commits, is green on all six jobs, frontend included.
- **One test of mine was fixed mid-run.** The "refuses an unknown query" test was also going red on the language-list mutations, for the wrong reason. I rewrote it to append a comment to the query instead. I re-ran the affected mutations afterwards, and a follow-up commit corrected the count I had recorded for `main`'s query (now 4 fails, was 5).
- **Every mutation was reverted.** `git status` was clean afterwards.
- **The worker's `FILTER(BOUND(?borderLabelRaw))` choice is consistent with criterion 3.** It drops a border that has neither label, as `main` did. No criterion requires it, so I did not pin it; the worker's own test does.
- **Only the live check shows the query parses on Wikidata.** That evidence is in the Handoff, and the reviewer should confirm it is there.
- **No tests made stale**, and no test change request was raised.

**Files**
- /home/user/geo-discovery-zone/question-bank/src/mul-labels-verify.test.ts (new, 12 tests)
- /home/user/geo-discovery-zone/tasks/T-084-mul-labels.md (Verdict, Status `verified — pass`, Next step `reviewer`, my Sessions row)

## Round 4 — reviewer — 2026-10-29
`Next step` on entry: `reviewer` → on exit: `human` (review commit `e3758b9`), then brief deleted by the sweep · branch head `67a8eb2`

**I approved T-084 with no escalation, swept it, and marked PR #105 ready for review.** The push landed: the head of `origin/claude/stoic-babbage-lsgku4` is `67a8eb2`. Next step: Dkaattae merges PR #105. I did not merge it.

**Checks**
- **PR state:** open, draft until I approved it, not merged.
- **Every role's work is in the PR:** the expander, worker, tester and orchestrator each have commits on the branch. Each stayed in its lane: the expander touched only `tasks/` and `tasks.md`, and the tester added only a new test file.
- **Code fit:** the query keeps the existing explicit `rdfs:label` pattern, and its comments still match what it does. Only `question-bank/src/queries/us-states.ts` and two new test files changed. There is no diff against `origin/main` in `data/`, the fixtures, `backend/`, the elevation query, any `package.json` or lockfile, or `openapi.yaml`.
- **Tests (I reran question-bank):** 2510 pass, 0 fail. Typecheck, lint and format:check are clean.
- **CI on `41a40f9`:** question-bank, frontend, backend and integration are green. The postgres and e2e jobs were still running when I checked; the PR body says so.
- **Live checklist:** present in the Handoff with its output, and all boxes are ticked.

**Envelope:** inside it, so no escalation.
- The tester passed and no dependency was added.
- No child-facing text changed, and neither did `openapi.yaml`, a migration or the plan.
- No pre-existing test was touched (`Test changes: none`).
- The one scope decision, Q1 split, was made by the person attending the session, not by an agent.

**The worker's two flags**
- **`FILTER(BOUND(?borderLabelRaw))`:** decided, kept. A border with neither label is still dropped whole, as on `main`.
- **Denali changes on the first refresh:** deferred to T-095. The live check showed Denali has only a `mul` label too, so Alaska's highest point will go from blank to "Denali".

**Commits**
- **`e3758b9`:** adds a `## Review` section to the brief, sets Status to approved and Next step to `human`, and adds my Sessions row. This keeps the review in git history.
- **`67a8eb2`, the sweep:**
  - Deleted the brief and the T-084 entry from `tasks.md`, and added a line to the sweep log.
  - Amended T-095 to take over T-084's leftover "Done when" items: re-record both fixtures, and check live that Alaska's capital is `Juneau`. It also carries the Denali note. I amended rather than adding a task because T-095 already owns the first real refresh PR.
  - Added a T-084 line under Completed tasks in `PROGRESS.md`, and rewrote the known-gap line about the monthly refresh.

**PR #105 body:** rewritten with the TL;DR, all ten criteria verbatim with what verified each, the live check results, the review, and where the findings went.

I left `runs/T-084-mul-labels.md` unchanged; its outcome line is the orchestrator's to write.

## Ended — 2026-10-29
Reviewer approved and marked PR Dkaattae/geo-discovery-zone#105 ready. It is Dkaattae's to merge. No role merged.
