# T-001 — Test setup and first tests for `question-bank`

**Status:** `pass`
**Next step:** `reviewer`
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
   for each of criteria 2–8 below.
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
   reaches the same result by either route: normalising all 50 rows resolves
   Colorado's neighbours by QID, and normalising Colorado's row alone resolves
   them by English label. Both give the same seven ids.
7. A neighbour that is not one of the 50 states does not appear in `borders`.
   Montana's row asserts seven neighbours, three of them Canadian provinces;
   its `borders` contain exactly `us-state-id`, `us-state-nd`, `us-state-sd` and
   `us-state-wy`.
8. `point()` returns `[longitude, latitude]` in that order for a well-formed WKT
   point, and `undefined` for input that is not one. `Point(-105.5 39.0)` yields
   `[-105.5, 39]`.
9. No test makes a network request. Running the suite with networking unavailable
   changes nothing.
10. No dependency is added to `question-bank/package.json`.
11. `bun run typecheck` still passes.

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

## Amendment — 2026-08-04, after the worker's survey

Criterion 6 originally bundled three things and used Colorado to demonstrate all
of them. The worker's survey found that **Colorado cannot demonstrate exclusion**:
all seven of its neighbours are states, so a Colorado-only test would prove
nothing about non-states while appearing to.

Split into 6 (two resolution routes agree) and 7 (non-states excluded, using
Montana, whose row asserts three Canadian provinces alongside four states).
Criteria 7–10 renumbered to 8–11. Nothing else changed.

Amended by `task-expander` and re-approved, rather than edited by the worker —
criteria stay frozen against the role they judge, and this is the first run, so
the rule is worth holding. Montana's resolved borders were run before writing:
`us-state-id, us-state-nd, us-state-sd, us-state-wy`.

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
| 6 | border resolution, both routes | `normalize.ts` `resolveBorders` | Colorado → the same seven ids by both routes: `us-state-az, ks, ne, nm, ok, ut, wy`. QID route with the full set, label-fallback route with Colorado alone |
| 7 | non-states excluded | `normalize.ts` `resolveBorders` | Montana asserts `Saskatchewan, Alberta, British Columbia, Idaho, Wyoming, South Dakota, North Dakota` → resolves to exactly `us-state-id, us-state-nd, us-state-sd, us-state-wy` |
| 8 | WKT parsing | `sparql.ts` `point()` | `Point(-105.5 39.0)` → `[-105.5, 39]`; `POLYGON(1 2)` → `undefined`; `undefined` → `undefined` |

Criterion 11 already holds: `bunx tsc --noEmit` passes on a clean tree.

### Resolved: the criterion 6 gap

Raised by this survey, amended by the expander above, and now criterion 7. The
fixture's other candidates, recorded in case a future test wants them:

- **Montana** → `Saskatchewan`, `Alberta`, `British Columbia`
- **Texas** → `Tamaulipas`, `Coahuila`, `Nuevo León`, `Chihuahua`
- **Michigan** → `Ontario`
- **Maryland** and **Virginia** → `District of Columbia` — a US federal district,
  not a state, so correctly excluded by the curated table
- **Connecticut** → `Long Island`, which is not an administrative division at all
- **Pennsylvania** → `Province of Canada`, `Upper Canada`, `Province of Quebec` —
  historical entities Wikidata still asserts

Montana was chosen: three excluded neighbours is a clearer signal than one.

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

## Verdict — **PASS**

19 tests across `src/normalize.test.ts` and `src/sparql.test.ts`. Full suite,
typecheck and lint green. Every criterion has at least one test, named for the
criterion it covers.

Expected values came from the criteria, not from reading the implementation.
Criterion 4's `21` and `8` are the brief's numbers; criterion 7's four ids are
the brief's list.

### Mutation results

Each behaviour was broken deliberately and the suite re-run. Every mutation
turned the matching tests red and nothing else. **All six reverted** — the source
tree is unchanged.

| Mutation | Result |
|---|---|
| M1 — invert the rank-suppression condition | 6 red: all of criteria 2, 3 and 4 |
| M2 — let the Wikidata FIPS code win over curated | 1 red: criterion 5, "a disagreeing code does not reach the entity" |
| M3 — delete the label-fallback branch | 1 red: criterion 6, "the label fallback, with no neighbour in the result set" |
| M4 — keep unresolved neighbour names in `borders` | 2 red: criterion 6 "ids not names", criterion 7 Montana |
| M5 — apply `only` before ranking instead of after | 1 red: criterion 4, Colorado's ranks collapse to 1/1 |
| M6 — return `[lat, lon]` from `point()` | 2 red: criterion 8 ordering and whitespace |

M5 is the one worth keeping. It is the plausible refactor — filter early, rank
the smaller set — and it silently turns Colorado into the largest state in the
country. Nothing else in the suite notices.

### Criteria 9–11

- **9, no network:** re-ran the suite with `HTTPS_PROXY` and `HTTP_PROXY` pointed
  at a dead port — 19 pass, unchanged, 115ms. No test file mentions `fetch`,
  `http`, or either live transport.
- **10, no dependency:** `question-bank/package.json` is untouched.
- **11:** `bunx tsc --noEmit` passes.

### Notes for the reviewer

Criterion 5 gained a test the brief did not ask for — every state's
`geometry_id` matches the curated table, not just Colorado's. It is the
criterion's claim applied across the whole set, and it costs one assertion.

No bug was found. The behaviours the brief named all work.

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
