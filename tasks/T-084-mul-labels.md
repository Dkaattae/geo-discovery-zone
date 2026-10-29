# T-084 — Read Wikidata's `mul` labels, so Juneau comes back as "Juneau"

**Status:** `awaiting approval` → `working`
**Next step:** `worker`
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

## Verdict
