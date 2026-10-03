# T-069 — `highest_point_m` carries feet for some states

**Status:** `awaiting approval`
**Next step:** `worker` — once a human replaces `pending` below
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-069
**Branch:** `task/T-069-highest-point-metres`
**PR:** #70, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-03 | cse_01SUGoHdt5tMKsMnrvhWFDqg |

**Worker model:** Opus. This touches data correctness and has more than one
defensible design (`process.md`, "Choosing the worker's model").

**Size:** the queue says S. Expanded, it is closer to **M**: the unit has to come
from a real Wikidata response, which means one new live recording, and the live
`build`/`refresh` paths have to apply the same correction as the offline one.

## Goal

Five committed states ship an elevation in feet under a key that says metres,
which would make Iowa's cornfield taller than Mount Mitchell in every "which is
highest" question (`geoquizdataplan.md` §1.8). Make every shipped
`highest_point_m` a metre value derived from the unit Wikidata actually states,
and make an elevation whose unit is not known to be metres or feet warn and go
blank instead of shipping.

## Already true, and what remains

- **Already true:** the query reads `P2044` through `wdt:`
  (`question-bank/src/queries/us-states.ts`, `OPTIONAL { ?highestPointItem
  wdt:P2044 ?elevationValue . }`), which **drops the unit**, and aggregates it with
  `MAX(?elevationValue)` — so an item carrying both a metre and a foot statement
  ships the larger raw number, i.e. the feet. `parseUsStates`
  (`src/sources/wikidata.ts:56`) reads it as `highestPointM`, and
  `normalizeUsStates` (`src/normalize.ts:147`) copies it into `highest_point_m`
  with no check. The recorded fixture `src/fixtures/us-states.sparql.json` holds
  the `elevation` binding with **no unit information** for any of the 50 rows.
- **Already true:** the area field has the same trap and is only flagged by a
  magnitude check (`normalize.ts:103-114`). A magnitude check cannot work here:
  Iowa's `1670` (feet) is a plausible metre value.
- **Already true:** `sources.built_at` on every entity is the main fixture's
  `_fixture.captured_at` (`build.ts:144-150`, `refresh.ts` header), so
  re-recording that fixture moves all 50 files.
- **Expander's survey of the committed bank** (values read from
  `question-bank/data/us-states/*.json`; reference figures from memory, **not
  verified** — the worker's cross-check, criterion 17, is the real one):

  | State | Shipped | Expected (m) | Reading |
  |---|---|---|---|
  | AZ Humphreys Peak | 12622 | ~3852 | feet |
  | OR Mount Hood | 11237 | ~3429 | feet |
  | NE Panorama Point | 5429 | ~1654 | feet |
  | KS Mount Sunflower | 4039 | ~1232 | feet |
  | IA Hawkeye Point | 1670 | ~509 | feet |
  | CT Mount Frissell | 748 | ~725 | metres, but the **summit** (in Massachusetts), not Connecticut's high point on its slope |
  | OK Black Mesa | 1737 | ~1516 | metres, but apparently the mesa's overall top (in New Mexico), not Oklahoma's high point |
  | VA Mount Rogers | 1825 | ~1746 | metres-sized, but does not match the known figure |

  The other 42 looked like plausible metre values. The last three rows are **not
  unit errors** and are out of scope here (see Out of scope; queued as T-079).

- **Remains:** everything in the criteria below.

## Acceptance criteria

**Frozen once approved.** They change only by going back through `task-expander`
for a fresh approval.

"The pipeline" below means parsing a Wikidata SPARQL response and normalising it
into entities — the path `parseUsStates` → `normalizeUsStates` takes today,
whatever shape it ends up in. "A response" may be a hand-built test response
passed through the existing seams; criteria 1–6 are about behaviour, not about
the committed data. Wikidata's unit items: metre is `Q11573`, foot is `Q3710`.

### Unit handling

1. **Metres pass through unchanged.** When a response states a state's
   highest-point elevation as `1609` with unit metre, the entity's
   `highest_point_m` is exactly `1609`, and the build warnings contain no entry
   for that entity with field `highest_point_m`.
2. **Feet are converted.** When a response states the elevation as `12622` with
   unit foot, the entity's `highest_point_m` is between `3846.8` and `3847.8`
   inclusive (12622 × 0.3048 = 3847.19, ±0.5 for rounding).
3. **An unrecognised unit does not ship.** When a response states an elevation
   with a unit that is neither metre nor foot (for example kilometre, `Q828224`),
   the entity has **no** `highest_point_m` key, and the build warnings contain an
   entry whose `entity` is that entity's id and whose `field` is
   `highest_point_m`.
4. **A unitless elevation does not ship.** When a response states an elevation
   value but no unit information for it, the entity has no `highest_point_m` key,
   and the warnings contain an entry with that entity's id and field
   `highest_point_m`.
5. **No elevation stays blank.** When a response has a highest point with no
   elevation at all, the entity has no `highest_point_m` key. (Whether this also
   warns is not specified by this brief.)
6. **Mixed units resolve to metres, not to the bigger number.** When a response
   gives one highest-point item two elevation statements — `3852` metre and
   `12637` foot — the entity's `highest_point_m` is between `3850` and `3853`
   inclusive. It is never `12637`.
7. **The live paths apply the same correction.** A `bun run build` live run and a
   `bun run refresh` run, each driven through the `SparqlTransport` seam with a
   response stating one state's elevation in feet, produce that entity with
   `highest_point_m` in metres per criterion 2. No test reaches the network.

### The committed bank

8. **The five known feet values are now metres.** In
   `question-bank/data/us-states/`:

   | File | `highest_point_m` between (inclusive) |
   |---|---|
   | `us-state-az.json` | 3840 – 3860 |
   | `us-state-or.json` | 3420 – 3435 |
   | `us-state-ne.json` | 1645 – 1660 |
   | `us-state-ks.json` | 1225 – 1240 |
   | `us-state-ia.json` | 505 – 515 |

9. **Alaska is untouched.** `us-state-ak.json`'s `highest_point_m` is exactly
   `6190`.
10. **No state is taller than Denali.** No file in `data/us-states/` has a
    `highest_point_m` greater than `6190`.
11. **Only unit-corrected states moved.** Every state whose recorded elevation
    unit is metre has a `highest_point_m` byte-identical to the default branch's
    (`main` at `e10f94d`). The set of states whose value changed is exactly the
    set whose recorded unit is not metre, and the Handoff names that set.
12. **Nothing else in the bank moved.** Across all 50 state files and
    `data/us-states/index.json`, no key is added or removed, and no value other
    than `highest_point_m` differs from the default branch — `sources.built_at`
    included. `question-bank/sample-data/` is byte-identical to the default
    branch.
13. **The bank is still built, not hand-edited.** An offline rebuild
    (`build.ts --offline` via the existing harness in `src/offline-rebuild.ts`)
    reproduces every file in `data/us-states/` byte for byte.

### Where the unit comes from

14. **The unit is recorded, not typed.** The unit information the offline build
    uses comes from a real `query.wikidata.org` response committed under
    `question-bank/src/fixtures/`. Any recorded file added or re-recorded by this
    task carries a `_fixture` block with `status`, `captured_at`, `endpoint` and
    `query`, as `us-states.sparql.json` does today.
15. **No hand-written elevation.** `question-bank/src/curated/us-states.ts`
    contains no elevation value and no unit, and no source file under
    `question-bank/src/` (tests excepted) holds a per-state elevation number or a
    per-state unit.
16. **A refresh keeps the offline build honest.** When `bun run refresh` reports
    a changed bank, it re-records every fixture file the offline build reads to
    produce `highest_point_m`, so an offline rebuild immediately after a refresh
    still reproduces the refreshed bank. Checked through the `SparqlTransport`
    seam into a temporary directory; no network.

### Cross-check, and what must not happen

17. **All 50 are cross-checked by hand** (`geoquizdataplan.md` §1.9, "Cross-check
    the top 10 by hand" — here, all 50). The worker's Handoff contains a table
    with exactly one row per state — 50 rows — giving: state, `highest_point`
    name, shipped `highest_point_m`, an independent reference value in metres,
    and the source of that reference. Every row where shipped and reference
    differ by more than 2% is marked, with one line on why.
18. **No new dependency.** `question-bank/package.json` and `bun.lock` gain no
    entry (`src/dependency-set.test.ts` stays as it is).
19. **No network in tests.** Every new test runs under the existing loopback
    proxy convention and passes with the network unavailable.
20. **Nothing outside `question-bank/` changes**, other than the brief,
    `tasks.md` and `PROGRESS.md`.
21. **The suite is green.** In `question-bank/`: `bun test`, typecheck, lint and
    `format:check` all pass — after any pre-existing tests this change makes stale
    have gone through a Test change request (see Constraints).

## Out of scope

- **CT, OK and VA's values** (survey table above). They are metre values for the
  wrong point, or simply off — a definitional question (a mountain's summit vs.
  the state's high point) with more than one defensible answer. **Do not change
  them here**; mark them in criterion 17's table. Queued as **T-079**.
- **The `highest_point` name** and T-016's curated fallback for it.
- **`area_km2`'s unit** (`P2046`). The same trap, handled today by a magnitude
  warning; a unit-aware fix there is a separate task if anyone wants one.
- **A full refresh of the bank.** Do not re-record the main fixture or run
  `bun run refresh` into `data/us-states/`: it would move `built_at` and every
  drifted value in all 50 files, and would ship Alaska's capital as `Q29445`
  (T-077). Criterion 12 forbids it.
- **T-070's digest-guard decision** — re-pin or keep. This task does not settle
  it; it goes through the existing test-change path instead (Constraints).
- **Capturing the build report's stdout** (T-070 (b)). Criteria 3 and 4 are about
  the returned warnings, not the printed report.
- **Bare-QID labels** (T-077), **`regenerate_with`** and `build.ts`'s fun-fact
  pass (T-078).
- **The served bank** — `frontend/`, `backend/`, `content.json`, the loader
  (T-040). Nothing here reaches the app.
- **`openapi.yaml`** and `geoquizdataplan.md`.
- **Display-time comparisons** of elevation (§2.6 "relative to something they
  know"). This task only makes the stored metre value true.

## Constraints

- **Files expected to change:** `question-bank/src/queries/` (the existing query
  and/or a new one), `src/sources/wikidata.ts`, `src/normalize.ts`, `src/build.ts`,
  `src/refresh.ts`, `src/fixtures/` (a new recorded file, or additional recorded
  data — see criterion 14), the `data/us-states/` files criterion 11 allows, new
  test files, and `question-bank/README.md` if it describes the fixtures. Anything
  else needs a reason in the Handoff.
- **One live call is needed** to record the units — the only network this task
  should make, and never from a test. Record its time in `_fixture.captured_at`.
  If the worker's environment has no route to `query.wikidata.org`, stop with
  `Status: blocked` rather than hand-writing the data.
- **Pre-existing tests will go stale, by design.** Changing five files' bytes
  breaks the pinned-digest guards — at least `landmarks-verify.test.ts`,
  `climate-kid-verify.test.ts`, `top-crops-verify.test.ts` and
  `highest-point-verify.test.ts` — and may break fixture readers in
  `normalize.test.ts`, `highest-point.test.ts`, `data-us-states.test.ts`,
  `refresh*.test.ts` and the `*-verify` suites. The **worker does not edit them**:
  it lists each under **Tests made stale** in the Handoff with the proposed
  delete or modify (D-14). The tester raises the Test change request; a person
  approves it. T-068 (PR #69) went through exactly this with 14 tests. Under an
  unattended run, expect the halt.
- **Prefer a blank field to a guessed one** (`CLAUDE.md` "Content rules"). An
  elevation of unknown unit is blank and warned, never converted on a guess.
- **Dependencies:** none without asking (`CLAUDE.md` "Packages").
- **Tests:** start below the transport (`CLAUDE.md` "Tests"); use
  `SparqlTransport` only for criteria 7 and 16. Never mock `fetch`.

## Context

**Required reading for the worker and the tester.**

- `tasks.md` T-069 (this entry's origin) and T-070 — T-070 (a) explains the
  digest guards and every neutralisation added so far.
- `geoquizdataplan.md` §1.8 (superlatives — why the number matters) and §1.9
  (source → field mapping; "Cross-check the top 10 by hand").
- `question-bank/src/queries/us-states.ts` — the query, including the
  `?highestPointItem` block and its `MAX(?elevationValue)`.
- `question-bank/src/sources/wikidata.ts:14-15, 55-56` — `highestPoint`,
  `highestPointM`.
- `question-bank/src/normalize.ts:103-122, 146-147` — the area unit flag (the
  precedent for this warning's shape), and where `highest_point_m` is emitted.
- `question-bank/src/build.ts:114-155` — the fixture transport and `built_at`.
- `question-bank/src/refresh.ts` header — what a refresh re-records, and E-6's
  reproducibility property.
- `question-bank/src/offline-rebuild.ts` — the shared offline harness and
  `DEAD_PROXY`.
- `question-bank/src/fixtures/us-states.sparql.json` — `_fixture` block format.
- `engineering-decisions.md` E-6 (committed bank, reproducible offline).
- `PROGRESS.md` "Question bank — the pipeline", the `highest_point` paragraph,
  and T-016's entry under "Completed tasks".
- `test-guidelines.md` — seams, and no network.
- Wikidata: unit items metre `Q11573`, foot `Q3710`. In SPARQL the unit of a
  quantity statement is reachable through the statement's value node
  (`p:P2044/psv:P2044` → `wikibase:quantityAmount`, `wikibase:quantityUnit`),
  and Wikidata also publishes a normalised SI value (`psn:P2044`). Either is a
  legitimate route; which one is the worker's call.

## Review checklist

Criterion 17 is a hand check, and a test can only confirm its shape.

- [ ] A person reads criterion 17's 50-row table and spot-checks at least the
      five corrected states and every marked row against the named source.
- [ ] The recorded unit data is a real response, not hand-assembled — its
      `captured_at`, `endpoint` and `query` agree with each other.
- [ ] CT, OK and VA are marked in the table and left unchanged (T-079).

## Handoff

## Verdict

## Notes
