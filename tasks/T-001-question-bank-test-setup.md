# T-001 — Test setup and first tests for `question-bank`

**Status:** `awaiting approval`
**Next step:** `worker`
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

_Written by `worker` before the tester runs. Always written, even when nothing
was built._

## Verdict

_Written by `tester`._

## Notes

_Filled in while working._
