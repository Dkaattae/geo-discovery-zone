# T-001 — Test setup and first tests for `question-bank`

**Status:** `awaiting verification`
**Next step:** `tester`
**From:** [`tasks.md`](../tasks.md) T-001
**Branch:** `claude/frontend-restructure-openapi-0xp57z` (this repo's designated branch)

## Goal

`question-bank` has no tests. It produces the data every quiz question is built
from, and its failure mode is silent — a wrong rank or an unmatched FIPS code
ships as plausible-looking JSON and teaches a child something false. Cover the
four behaviours where that is most likely, and give the repo a test command that
works.

## Already true

The four behaviours **already exist and appear to work**; this task adds tests,
not implementation. From the survey:

- rank suppression — `normalize.ts:74-85`
- FIPS cross-check — `normalize.ts:96-102`
- border resolution, QID then label — `normalize.ts` `resolveBorders`
- WKT centroid parsing — `sparql.ts` `point()`

`bun test` runs with no configuration, and
`src/fixtures/us-states.sparql.json` is a real recorded 50-row Wikidata
response. Expect the worker to have little or nothing to implement.

## Acceptance criteria

1. `bun test` in `question-bank/` exits 0 and reports at least one passing test
   for each of criteria 2–7 below.
2. Given parsed rows for all 50 states, `normalizeUsStates` returns a
   `population_rank` and an `area_rank` for every entity, each an integer in
   1–50, and no two entities share a rank on the same axis.
3. Given parsed rows for 49 of the 50 states, every returned entity has
   `population_rank: null` and `area_rank: null`, and a warning is reported
   identifying the suppression and the count seen.
4. Ranks are computed across the full result set before subsetting: normalising
   all 50 rows while selecting only Colorado returns Colorado with
   `population_rank: 21` and `area_rank: 8`.
5. When a row's Wikidata FIPS code disagrees with the curated table, the entity's
   `geometry_id` is the **curated** value and a warning is reported naming that
   entity and the `geometry_id` field. When they agree, no such warning appears.
6. Border resolution produces entity ids (`us-state-wy`), not names or QIDs, and
   resolves a neighbour by QID when that neighbour is in the same result set and
   by English label when it is not. Colorado resolves to its seven neighbours by
   either route. A neighbour that is not a US state — a Canadian province, a body
   of water — does not appear.
7. `point()` returns `[longitude, latitude]` in that order for a well-formed WKT
   point, and `undefined` for input that is not one. `Point(-105.5 39.0)` yields
   `[-105.5, 39]`.
8. No test makes a network request. Running the suite with networking unavailable
   changes nothing.
9. No dependency is added to `question-bank/package.json`.
10. `bun run typecheck` still passes.

## Out of scope

- Tests for `frontend/` — a separate task when it comes.
- CI (T-003) and revising `test-guidelines.md` (T-002).
- Any change to pipeline behaviour. If a test reveals a bug, report it and add a
  `tasks.md` entry; fixing it is a different task with its own criteria.
- Coverage tooling or thresholds.
- Testing `build.ts`'s CLI argument parsing, the Wikipedia pass, or the curl
  fallback.

## Constraints

- Files expected to change: new `*.test.ts` files under `question-bank/src/`,
  and `question-bank/package.json` only if a `test` script is added.
- **Do not edit `src/fixtures/us-states.sparql.json`.** It is a recording. Build
  partial cases by filtering parsed rows in the test, never by trimming the file.
- Use the existing seams — `SparqlTransport`, `SummaryTransport`, `EntitySink`.
  Do not mock `fetch`.
- Dependencies: none without asking (see [`CLAUDE.md`](../CLAUDE.md)).
- Tests must not depend on each other's order or shared mutable state.

## Context

Required reading, not background.

- `question-bank/src/normalize.ts` — `normalizeUsStates`, `resolveBorders`,
  `rankBy`; returns `{ entities, warnings, unmatched }`
- `question-bank/src/sparql.ts` — `point()`, `qid()`, `num()`, `text()`
- `question-bank/src/sources/wikidata.ts` — `parseUsStates` turns a recorded
  response into rows
- `question-bank/src/curated/us-states.ts` — the curated FIPS/region table the
  cross-check compares against
- `question-bank/sample-data/us-state-co.json` — a real built entity, and where
  the rank values in criterion 4 come from
- [`test-guidelines.md`](../test-guidelines.md) — the specification for this
  task, not merely its style guide
- `geoquizdataplan.md` §1.4 (why ranks matter), §2.3 (why FIPS is the join key)

## Expander's sanity check

Criteria 3, 4 and 6 were run against the real code before writing them down:
50 rows give Colorado `population_rank: 21`, `area_rank: 8` and seven borders;
49 rows give `null` for both plus `suppressed: 49/50 states in the result set`.
They are satisfiable as written.

## Verification note

This task's deliverable is tests, so the tester does not write more tests to
check them. It verifies **coverage** — one test per criterion — and then
**mutation**: break each behaviour deliberately, confirm exactly the matching
test goes red, and revert. See `test-guidelines.md`, "Verifying a task whose
deliverable is tests".

## Handoff

**Nothing was implemented. No production code was needed, and none was written.**

The brief predicted this and the survey confirmed it: all four behaviours exist
and work. I verified each one by running it rather than by reading it. Nothing in
the repository changed — `git status` is clean, and the tests are yours to write.

### Where each criterion's behaviour lives, and what I observed

| # | Behaviour | Lives in | Observed |
|---|---|---|---|
| 2 | ranks over the full set | `normalize.ts` `rankBy` | 50 entities, 50 distinct population ranks and 50 distinct area ranks, spanning 1–50 |
| 3 | rank suppression | `normalize.ts:74-85` | 49 rows → every rank `null`, warning `suppressed: 49/50 states in the result set` on entity `*` |
| 4 | rank before subset | `normalize.ts`, `only` applied after ranking | all 50 rows with `{only:["CO"]}` → Colorado `population_rank: 21`, `area_rank: 8` |
| 5 | FIPS cross-check | `normalize.ts:96-102` | forced a row to FIPS `99` → `geometry_id` stayed `08`, warning `Wikidata FIPS 99 disagrees with curated 08; kept curated`. Unmodified rows produce zero `geometry_id` warnings |
| 6 | border resolution | `normalize.ts` `resolveBorders` | Colorado → the same seven ids by both routes: `us-state-az, ks, ne, nm, ok, ut, wy`. QID route with the full set, label-fallback route with Colorado alone |
| 7 | WKT parsing | `sparql.ts` `point()` | `Point(-105.5 39.0)` → `[-105.5, 39]`; `POLYGON(1 2)` → `undefined`; `undefined` → `undefined` |

Criterion 10 already holds: `bunx tsc --noEmit` passes on a clean tree.

### One thing the brief did not anticipate

Criterion 6 requires that a non-US-state neighbour does not appear in `borders`.
**Colorado cannot demonstrate this** — all seven of its neighbours are states, so
a Colorado-only test proves nothing about exclusion.

The fixture does contain states that can. Pick one of these:

- **Montana** → `Saskatchewan`, `Alberta`, `British Columbia`
- **Texas** → `Tamaulipas`, `Coahuila`, `Nuevo León`, `Chihuahua`
- **Michigan** → `Ontario`
- **Maryland** and **Virginia** → `District of Columbia` — a US federal district,
  not a state, so correctly excluded by the curated table
- **Connecticut** → `Long Island`, which is not an administrative division at all
- **Pennsylvania** → `Province of Canada`, `Upper Canada`, `Province of Quebec` —
  historical entities Wikidata still asserts

Montana or Texas is the clearest vehicle. This is a gap in the criterion's
*example*, not in the criterion: the requirement is testable as written, just not
with the entity the criterion names.

### Judgment call: no `test` script added

`package.json` is untouched. `bun test` runs with no configuration, so a
`"test": "bun test"` script would only alias the built-in, and the worker brief
says not to manufacture work. `conventions.md` already documents `bun test` as
the command, and T-003 will invoke it directly in CI.

Reviewer may disagree — it is one line, and some people expect `bun run test` to
work. Flagging rather than deciding unilaterally.

### How to run what I checked

```bash
cd question-bank
bun test          # no test files yet — this is what you are adding
bun run typecheck
bun run build:sample   # offline, exercises the whole pipeline through the fixture
```

Nothing here needs the network. The fixture at
`src/fixtures/us-states.sparql.json` is a recorded 50-row response; do not edit
it — filter `parseUsStates(...)` output in the test instead.

## Verdict

_Written by `tester`._

## Notes

Worker session, no implementation.

- Every claim in the handoff came from running the code, not reading it. That
  matters here: a handoff asserting "already works" is exactly the kind of claim
  that gets taken on trust and turns out to be half true.
- The criterion 6 gap is the first thing this loop has caught that a single
  session would probably have missed — the expander wrote a plausible example,
  and only the survey showed Colorado cannot exercise the exclusion half of it.
- Nothing in the pipeline looked wrong while surveying, so no bug entries were
  added to `tasks.md`.
