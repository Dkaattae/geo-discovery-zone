# T-084 — Read Wikidata's `mul` labels, so Juneau comes back as "Juneau"

**Status:** `verified — pass`
**Next step:** `reviewer`
**Approved:** person attending the orchestrator session — 2026-10-29, in their words: "approve (a), split it, go ahead". Q1 answered (a), split. See `runs/T-084-mul-labels.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-084
**Branch:** `claude/stoic-babbage-lsgku4`
**PR:** #105, opened draft at expand time against the branch above
**Fault:** The `tasks.md` entry leaves the split for a person to decide, and the unattended run cannot decide it.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-29 | cse_011oDiJdG9Xu3xD21LLaAv1o (spawned by the orchestrator; unattended) |
| worker | 2026-10-29 | cse_011oDiJdG9Xu3xD21LLaAv1o (spawned by the orchestrator; unattended; same remote session id as the expander, the subagents share it) |
| tester | 2026-10-29 | cse_011oDiJdG9Xu3xD21LLaAv1o (spawned by the orchestrator; unattended; fresh subagent context, same shared remote session id) |

## Q1 — for a person: split T-084, or keep it whole?

`tasks.md` T-084 says *"The proposed split still stands for a person to
decide."* An unattended expander may not decide it, because under the
orchestrator approval is stamped without a person reading the brief. Thirteen
earlier expanders skipped T-084 for a different reason: T-070 had not landed.
That reason is gone. This question is what is left.

- **(a) Split. This is what the brief below is written for.** This task is the
  query half only. It changes what `US_STATES_QUERY` asks Wikidata for and moves
  no committed data byte. The fixture re-record and the live "Alaska's capital
  is Juneau from a live refresh" check go with the first real refresh. That
  refresh already has to settle T-095 (bank guards go red on any refresh that
  writes) and T-087 (regenerate the question file and `content.json`). The
  "Done when" in `tasks.md` gets trimmed to match when this lands.
- **(b) Whole.** Same criteria, plus re-recording both SPARQL fixtures with a
  live `bun run refresh` and committing the new bank. The fixture was captured
  2026-08-04 (`_fixture.captured_at`), so this pulls in about three months of
  Wikidata drift across all 50 states, not only Alaska's capital. Every bank
  pin T-095 lists goes red. The tester step has to be attended for a Test
  change request, and T-087's two hand-run regeneration commands become part of
  this task. If you pick (b), say whether T-095 should land first. The brief
  then comes back through the expander.

**Why (a) is the default:** the committed fixture already says `Juneau`
(`question-bank/src/fixtures/us-states.sparql.json`, Alaska's `capitalLabel`). So
the committed bank, `data/questions/us-states.json` and
`backend/app/data/content.json` already ship Juneau today. The defect only
shows on a live refresh, and the fix for it is the query text. Doing (a) means
the next refresh ships Juneau instead of a blank with a warning.

---

## Goal

A live refresh currently blanks Alaska's capital: Juneau (`Q29445`) now has only
a `mul` label, and the query asks for `en` alone. This task makes the query read
`mul` whenever `en` is missing, so the monthly refresh routine can be switched
on without losing a capital, a highest point or a border.

## Acceptance criteria

The query is observable offline as **the exact text `bun run refresh` hands to
its `SparqlTransport`**. Criteria 1–5 are about that text, criteria 6–10 are
about what does not move, and the Review checklist covers what only a live
endpoint can show.

**The query asks for `mul` after `en`**

1. The label service clause in `US_STATES_QUERY` (the query the refresh sends
   first, for the 50 states) asks for the language list `"en,mul"`, in that
   order: `en` first, `mul` second, nothing else. A query that still asks for
   `"en"` alone fails. So do `"mul,en"` and a list with a third language.
2. The highest-point label (`?highestPoint` in the result) can be bound from a
   `mul` label: `rdfs:label` with language `mul` is read for the P610 item.
   `en` still wins. In the query, a `mul` label for the highest point is only
   used when the item has no `en` label. The query must never bind both, so
   `SAMPLE` cannot choose between them.
3. A border's name (`?borderNames` in the result) can be bound from a `mul`
   label, on the same rule as criterion 2: `mul` only when that border item
   has no `en` label. A border item that has both contributes **one** name to
   the `|`-separated list, not two.
4. The result still has the same twelve variables, with the same names, in the
   same `SELECT` order: `state`, `stateLabel`, `capitalLabel`, `fips`,
   `population`, `area`, `coord`, `article`, `highestPoint`, `elevation`,
   `borderQids`, `borderNames`. These are the `head.vars` the committed fixture
   records. `GROUP BY` is still `?state ?stateLabel ?capitalLabel`, so a state
   is still one row.
5. `US_STATES_ELEVATION_QUERY` (`src/queries/us-states-elevation.ts`) is
   byte-identical to `main`. It reads no labels.

**What does not move**

6. No committed data byte changes. `question-bank/data/` (every file),
   `question-bank/src/fixtures/us-states.sparql.json`,
   `question-bank/src/fixtures/us-states-elevation.sparql.json` and
   `backend/app/data/content.json` are byte-identical to `main`.
7. An offline build (`bun run build --offline`, or whatever route
   `committed-bank.test.ts` uses) still reproduces the committed bank exactly.
   It replays the fixture, and the fixture transport still accepts the new
   `US_STATES_QUERY`, so changing the text must not make the offline path
   refuse or miss the fixture.
8. The T-077 bare-QID guard still holds. A capital or highest-point value
   matching `^Q\d+$` is still treated as absent, with the existing warning text.
   That covers the item with neither `en` nor `mul` label, and the label service
   still falls back to the QID for it.
9. The whole suite stays green in all three packages (`question-bank`,
   `frontend`, `backend`), with **no existing test deleted or modified**. If a
   test pins the query text, that is a stale test and goes through a Test change
   request, not a quiet edit. The expander found none that pin it.
10. No test reaches the network, and no dependency is added to any
    `package.json` or lockfile.

## Out of scope

- **Re-recording either SPARQL fixture**, and any live `bun run refresh` whose
  output is committed. That is option (b) of Q1, and the first real refresh.
- **Bank pins**: `BANK_DIGESTS` in `src/bank-pins.ts` and every other guard
  T-095 lists. None should move. If one does, criterion 6 has already failed.
- **T-095** (what a refresh PR does about the pins) and **T-087**
  (regenerating the question file and `content.json`).
- **`stateLabel`**: it comes from the label service too, so criterion 1 covers
  it, but no state is known to lack an `en` label. Nothing else is required.
- **Any normalisation change** in `normalize.ts` or `sources/wikidata.ts`,
  apart from what criterion 8 keeps as it is.
- **Other languages or label sources**: no `skos:altLabel`, no `schema:name`,
  no third language.
- Switching on the monthly refresh routine.

## Constraints

- **Files expected to change:** `question-bank/src/queries/us-states.ts`, plus
  new test file(s) in `question-bank/src/`. Nothing in `data/`, `fixtures/` or
  `backend/`.
- **Keep the comment honest.** The comment next to the highest-point label
  explains why it is labelled explicitly rather than through the label service.
  It must still be true afterwards, and it should say why `mul` is read
  (T-084).
- **Content rule:** a `mul` label is a name an editor wrote, not a translation,
  so it is safe to ship to a child. A QID is not (criterion 8). Prefer blank to
  guessed still applies to anything that resolves to neither.
- **Tests:** start below the transport. Import `US_STATES_QUERY` and inspect
  it, or capture what a fake `SparqlTransport` receives. Never mock `fetch`.
  See `test-guidelines.md`.
- **Dependencies:** none (`CLAUDE.md`, "Packages").

## Context

Required reading for the worker and the tester:

- `tasks.md` T-084: the live evidence from 2026-10-13. `"en"` returns
  `Q29445`, `"en,mul"` returns `Juneau`.
- `runs/T-077-bare-qid-label.md`, worker section: how that was checked live
  (`query.wikidata.org` reachable, `www.wikidata.org/w/api.php` refused by the
  proxy).
- `question-bank/src/queries/us-states.ts`: the query, and its comments on
  why the highest point and borders are labelled explicitly (aggregates).
- `question-bank/src/sources/wikidata.ts:109`: `borderNames` is split on `|`.
- `question-bank/src/normalize.ts`: `isBareQid` and its comment, the capital
  and highest-point handling (around lines 137–170), and `resolveBorders`,
  which matches border names case-insensitively against the curated table.
- `question-bank/src/fixture-transport.ts`: compares the incoming query with
  `US_STATES_QUERY` to replay the fixture (criterion 7).
- `question-bank/src/refresh.ts`: what the refresh sends, and in what order.
- `question-bank/src/committed-bank.test.ts`: the offline-rebuild guard (E-6).
- `geoquizdataplan.md` §1.9: one query for all 50 states.
- `engineering-decisions.md` E-30 (T-070): fixtures are no longer pinned.
- `tasks.md` T-095 and T-087: why the re-record is kept out of this task.

## Review checklist — what only a live endpoint shows

Tests cannot run SPARQL, so whether criteria 2 and 3 really make `en` win needs
a live check. **The worker runs it once and records the output in the Handoff.**
The reviewer checks that it is there. Nothing from it is committed.

- [ ] The new `US_STATES_QUERY`, run live against `query.wikidata.org`, returns
      50 rows, and Alaska's `capitalLabel` is `Juneau`.
- [ ] Compared with the same query on `main` run live at the same time, no state
      has a different `highestPoint`, except where `main` returned nothing or a
      bare QID.
- [ ] Compared the same way, no state's `borderNames` gains a name that is
      already in its list under another spelling, and none loses one.
- [ ] If the live endpoint cannot be reached, the Handoff says so, and these
      boxes stay unticked for a person to run.

## Handoff

**TL;DR:** `US_STATES_QUERY` now asks the label service for `"en,mul"` and reads
`mul` for the highest point and borders through `COALESCE(en, mul)`. A live
run gives 50 rows and Alaska's capital comes back as `Juneau` (it was `Q29445`
on `main`). No data, fixture or elevation-query byte moved. Next: tester.

**Files changed**

- `question-bank/src/queries/us-states.ts`: three edits inside the query text,
  each with a comment that names T-084.
  - Label service: `wikibase:language "en"` becomes `"en,mul"`.
  - Highest point: two OPTIONALs (`?highestPointEn` with `LANG = "en"`,
    `?highestPointMul` with `LANG = "mul"`), then
    `BIND(COALESCE(?highestPointEn, ?highestPointMul) AS ?highestPointLabel)`.
    The old comment (why it is labelled explicitly) is still there and still true.
  - Borders: the same pattern into `?borderLabelRaw`, plus
    `FILTER(BOUND(?borderLabelRaw))`. Without that filter, a border with neither
    label would now add its QID to `borderQids` with no name. On `main` the
    border triple pattern dropped the whole border, and the filter keeps that.
- `question-bank/src/mul-labels.test.ts` (new, 7 tests): inspects the query
  text, and captures what `fetchUsStates` sends through a spy wrapped around
  `fixtureTransport`. Five of the seven fail against `main`'s query. I checked
  this by swapping the file in temporarily.

**Where each criterion lives**

| # | Where |
|---|---|
| 1 | `us-states.ts`, the `SERVICE wikibase:label` line. Test: "the label service asks for exactly en,mul" |
| 2 | `us-states.ts`, the P610 block. COALESCE takes the first bound argument, so `en` wins and only one value is bound per item. Test: "the highest point label reads en and mul…" |
| 3 | `us-states.ts`, the P47 block, same pattern. One `?borderLabelRaw` per border means one name per border in `GROUP_CONCAT`. Test: "the border label reads en and mul…" |
| 4 | SELECT and GROUP BY are untouched. Test: "SELECT keeps the fixture's twelve variables…" checks them against the fixture's `head.vars` |
| 5 | `git diff origin/main -- question-bank/src/queries/us-states-elevation.ts` is empty |
| 6 | `git diff --stat origin/main -- question-bank/data question-bank/src/fixtures backend/app/data` is empty |
| 7 | `fixture-transport.ts` compares against the imported constant, so it follows the new text. `committed-bank.test.ts` is green. Test: "the refresh sends US_STATES_QUERY then the elevation query" (50 rows, Alaska → Juneau) |
| 8 | `normalize.ts` is not touched. The `bare-qid-label*.test.ts` files are green |
| 9 | question-bank 2498 pass / 0 fail. backend `make check` 739 passed, 9 skipped. frontend: see the environment note below |
| 10 | Nothing new uses the network. `package.json` and lockfiles are not touched |

**Live check (Review checklist).** I ran it once on 2026-10-29, `main`'s query
and the new one at the same time, POSTed to `query.wikidata.org/sparql` from a
throwaway scratchpad script. Nothing from it is committed. Full output:

```
rows old 50 new 50
Alaska capitalLabel "Q29445" -> "Juneau"
Alaska highestPoint "" -> "Denali"
Alaska capital new: Juneau | old: Q29445
```

The script diffed `stateLabel`, `capitalLabel`, `highestPoint`, `borderQids`
and `borderNames` for every state. It also flagged any state where the
name/QID counts differ, or where a border name appears twice (case-insensitive).
Only the two Alaska lines above came out.

- [x] 50 rows, and Alaska's `capitalLabel` is `Juneau`.
- [x] `highestPoint` changed only for Alaska, where `main` returned nothing
      (Denali has lost its `en` label too). That is the allowed exception.
- [x] `borderNames` and `borderQids`: no state gained or lost a name, and no
      state has a duplicate.

**Environment note: frontend.** The frontend shows 390 pass and 6 fail, plus a
typecheck error. All of them are `Cannot find package 'react-simple-maps'` /
`'us-atlas/states-10m.json'`. `bun install --frozen-lockfile` cannot fetch
those tarballs, because the proxy answers 403 to `europe-west1-npm.pkg.dev`.
This task does not touch the frontend. Those reds come from the sandbox, not
from the change. Frontend lint and format:check are clean.

**Deliberately not done**

- No fixture re-record and no live refresh committed (Q1 (a) and Out of scope).
- `tasks.md` T-084's "Done when" is not trimmed yet. Q1 (a) says that happens
  "when this lands", so it belongs to the sweep. **Owner: reviewer / sweep.**
- No test asserts that the query is valid SPARQL. There is no parser
  available offline, and adding one would be a dependency. The live run is the
  evidence that it parses.

**Judgment calls**

- **`FILTER(BOUND(?borderLabelRaw))` in the border block.** I added it so a
  border with neither label is still dropped whole, as on `main`. The brief
  does not ask for it, but without it `borderQids` and `borderNames` could
  drift out of step. **Owner: tester to confirm against criterion 3 and the
  checklist, reviewer to overturn if they want unlabelled borders kept.**
- **Denali also changes on the next refresh.** Alaska's highest point will go
  from blank to "Denali", and that will move bank bytes then. This is expected
  and is the first-refresh work in T-095/T-087. **Owner: whoever runs the first
  refresh (T-087).**

**Contradicts the brief:** nothing. The tasks.md evidence covered only Juneau.
Denali also lacking an `en` label is new information, and it strengthens the
case for this change.

**How to run**

```
cd question-bank && bun install && bun test && bun run typecheck && bun run lint && bun run format:check
bun test src/mul-labels.test.ts
```

**Tests made stale:** none.

### Notes

- Backticks inside the query's template literal broke parsing on the first
  try, so the comments use plain words for `en` and `mul`.
- The local `main` ref was stale (it showed a 650-line diff in
  `data/questions/`). I ran every byte-identity check against `origin/main`.
- The worker and expander rows carry the same session id, because subagents
  of one orchestrated remote session share `CLAUDE_CODE_REMOTE_SESSION_ID`.
  The tester should note this when it checks isolation.

## Verdict

**TL;DR: pass.** Every criterion 1–10 holds. My 12 new tests are green, and 11
mutations of the query each turned at least one of them red. question-bank
(2510 pass), backend (`make check`: 739 passed, 9 skipped), typecheck, lint and
format are all green. Next: reviewer.

**Independence: weaker kind.** This is an orchestrated run (`runs/T-084-mul-labels.md`
exists), so `$CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_011oDiJdG9Xu3xD21LLaAv1o`)
matches the worker row and the session-id check proves nothing. I am a freshly
spawned subagent with my own context. I did not see the worker's conversation
or reasoning, only the committed brief, Handoff and code. That rests on the
orchestrator having spawned me correctly, which I cannot verify myself.

**Work is on the branch.** `git diff origin/main...HEAD` touches
`question-bank/src/queries/us-states.ts` and `question-bank/src/mul-labels.test.ts`,
as the Handoff says, plus the brief, run log and `tasks.md`.

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | `mul-labels-verify.test.ts` "criterion 1" tests: the query `refreshBank` sends first (captured at a spy `SparqlTransport`) has exactly one `wikibase:language`, and its value is `"en,mul"`. Mutations `"mul,en"`, `"en,mul,fr"` and `"en"` each go red |
| 2 | pass | "criterion 2": the P610 item gets an en `rdfs:label` and a mul `rdfs:label`, each in its own innermost OPTIONAL. They are combined as `COALESCE(en, mul)` into the variable `SAMPLE(…) AS ?highestPoint` reads, and that variable is bound nowhere else. Mutations: mul first, en+mul merged into one OPTIONAL, a second `rdfs:label` into the aggregated variable. All red |
| 3 | pass | "criterion 3": same rule for the P47 item and `GROUP_CONCAT(…) AS ?borderNames`, plus the `"|"` separator, plus "no language other than en/mul". Mutations: mul first, mul only, mul filter → `fr`. All red |
| 4 | pass | "criterion 4": the SELECT projections parse to the criterion's literal twelve names in order, the fixture's `head.vars` equals the same list, and GROUP BY is exactly `?state ?stateLabel ?capitalLabel`. Mutations: an extra projection, a shortened GROUP BY. Both red |
| 5 | pass | `git diff origin/main -- question-bank/src/queries/us-states-elevation.ts` is empty |
| 6 | pass | `git diff --stat origin/main -- question-bank/data question-bank/src/fixtures backend/app/data` is empty |
| 7 | pass | "criterion 7": `fixtureTransport` accepts the sent query and returns 50 bindings (Alaska → Juneau), and still rejects a query it has no recording for. `committed-bank.test.ts` (the offline rebuild byte-compare) is green |
| 8 | pass | "criterion 8": Alaska's `capitalLabel` set to `Q29445` in memory ends up blank, with one capital warning that names the QID and says "bare QID". `normalize.ts` is untouched, and the T-077 `bare-qid-label*.test.ts` files are green |
| 9 | pass | question-bank 2510 pass / 0 fail. backend `make check` 739 passed / 9 skipped. No existing test deleted or modified (the only test files in the diff are new). Frontend: see below |
| 10 | pass | Every suite ran with all six proxy variables pointed at `127.0.0.1:1`. No `package.json` or lockfile is in the diff |

**Frontend, local vs CI.** Locally the frontend shows 392 pass, 4 fail, 4 errors,
plus 3 TS2307 errors. Every one of them is `Cannot find package 'react-simple-maps'`
or `'us-atlas/states-10m.json'`. Those packages are not in this sandbox's
`node_modules`, and this task changes no frontend file. CI on this branch's HEAD
`12e089b`, read via `gh api …/check-runs`, is green on all six jobs, including
`frontend (typecheck, lint, test)`. Lint passes locally.

**Mutations** (11, plus `main`'s whole query, all made to `us-states.ts` and
reverted with `cp` from a saved copy; `git diff` on the file is empty afterwards).
Each row gives the result of `mul-labels-verify.test.ts`:

- `main`'s query: 4 fail (re-run after the test fix below; it was 5 before)
- `"mul,en"` / `"en,mul,fr"` / `"en"`: 1 fail each (criterion 1)
- highest point `COALESCE(mul, en)`: 1 fail
- border `COALESCE(mul, en)`: 1 fail
- border mul filter `"fr"`: 2 fail
- highest point en and mul merged into one OPTIONAL: 1 fail
- border bound from mul only: 1 fail
- an extra SELECT variable: 1 fail
- GROUP BY without `?capitalLabel`: 1 fail
- an extra `rdfs:label ?highestPointLabel`: 1 fail

The first mutation run showed the criterion-7 "refuses an unknown query" test
also going red on the criterion-1 mutations, for the wrong reason. I rewrote it
to append a comment to the query rather than swapping the language list, before
the final run. The counts above for `main` and the criterion-1 mutations are from the
corrected test.

**The worker's judgement call (`FILTER(BOUND(?borderLabelRaw))`).** It is
consistent with criterion 3 and the checklist's "none loses one". A border with
neither label is dropped whole, which is what `main`'s required border triple
did, so `borderQids` and `borderNames` stay paired. I did not pin it in my
tests because no criterion requires it. The worker's `mul-labels.test.ts`
pins it.

**Not verifiable offline:** whether the query parses and how Blazegraph
evaluates it. The live check in the Handoff is the only evidence of that. The
reviewer checks it is present.

**Files:** `question-bank/src/mul-labels-verify.test.ts` (new, 12 tests).

**Tests made stale:** none. No existing test went red, and none pins the query text.

