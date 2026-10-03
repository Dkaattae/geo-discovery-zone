# T-069 — `highest_point_m` carries feet for some states

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** orchestrator — 2026-10-03, unattended run. See `runs/T-069-highest-point-metres.md`.
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
| worker | 2026-10-03 | cse_01SUGoHdt5tMKsMnrvhWFDqg |

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

**TL;DR:** done, and 70 pre-existing tests are stale by design (listed below). The five feet values are now metres (AZ 3847, OR 3425, NE 1655, KS 1231, IA 509), taken from a new **real** Wikidata recording of each elevation's unit. Nothing else in the bank moved. All 23 new tests pass, and typecheck, lint and `format:check` are clean.
**Needed next:** the tester verifies and raises the Test change request for the 70 stale reds (8 tests/groups, every proposed fix already tried on throwaway copies). A person approves it (D-14).

> **Same session id as the expander.** The orchestrator ran both roles in one
> remote session (`cse_01SUGoHdt5tMKsMnrvhWFDqg`), so the tester must not be this
> session either.

### What changed, file by file (all under `question-bank/`)

- **`src/queries/us-states-elevation.ts`** (new): `US_STATES_ELEVATION_QUERY` returns one row per best-rank P2044 statement on each state's P610 item, with `wikibase:quantityAmount` and an OPTIONAL `wikibase:quantityUnit`. `wikibase:BestRank` selects the same statements `wdt:` returns. Also exports `UNIT_METRE`/`UNIT_FOOT`.
- **`src/fixtures/us-states-elevation.sparql.json`** (new): the one live call, made 2026-10-03T21:16:45Z with the repo's own `createSparqlClient`. It has 55 rows covering all 50 states, and its `_fixture` block carries `status`, `captured_at`, `endpoint`, `query`, `rows`, `why_committed`, `regenerate_with` and `note`.
- **`src/sources/wikidata.ts`**:
  - `parseUsStates(results, elevationResults?)` takes an optional second response.
  - The new `parseElevations` groups statements by state QID.
  - `WikidataStateRow.highestPointM` is gone. It is replaced by `elevationUnitless` (the main query's unitless number, never shipped) and `elevations` (statements with units).
  - `fetchUsStates` now makes both queries through the one transport.
- **`src/normalize.ts`**: `resolveElevation(row)` is new and exported, and decides `highest_point_m`. Its warnings go into `warnings` with field `highest_point_m`. The rules are in its doc comment.
- **`src/fixture-transport.ts`** (new, not in the brief's expected list): the offline replay, moved out of `build.ts`.
  - It answers `US_STATES_QUERY` from the main fixture and `US_STATES_ELEVATION_QUERY` from `us-states-elevation.sparql.json` **in the same directory**. Any other query throws.
  - `built_at` still comes from the main fixture only.
  - **Why it is a new file:** `refresh.ts` needs the same "elevation fixture lives beside the main one" rule, and `build.ts` is a CLI.
- **`src/build.ts`**:
  - `main()` became the exported `runBuild(argv, deps)`, guarded by `import.meta.main`.
  - `deps.sparql`, `deps.summary` and `deps.log` are injectable. The CLI passes nothing and behaves as before.
  - **Why:** criterion 7 needs a live `build` driven through `SparqlTransport`, and existing guards forbid any test from spawning `build.ts`.
  - The `--help` text now names the elevation fixture.
- **`src/refresh.ts`**:
  - It queries both, and fails (exit 1, nothing written) if either fails.
  - On a changed bank it re-records both fixtures with the same `captured_at`.
  - The new optional `elevationFixturePath` defaults to beside `fixturePath`.
  - If no previous elevation block exists, it fills in `status`, `endpoint` and `query`.
- **`data/us-states/us-state-{az,or,ne,ks,ia}.json`**: one line each, `highest_point_m` only. They come from `bun src/build.ts --offline`, not hand edits.
- **`src/highest-point-metres.test.ts`** (new, 23 tests): criteria 1–7, 14 and 16, plus the edges of `resolveElevation`.
- **`README.md`**: the `--offline`/`--fixture` rows, the refresh exit-0 row and the layout block now name the elevation fixture.

### Criterion → where it lives

| # | Where | Evidence |
|---|---|---|
| 1–6 | `normalize.ts` `resolveElevation`; `sources/wikidata.ts` `parseElevations` | `highest-point-metres.test.ts` "criteria 1–6" (km is `Q828224`; Q199 and a missing unit node both count as unitless) |
| 7 | `build.ts` `runBuild` + `deps.sparql`; `refresh.ts` second query | "criterion 7" describe: live `runBuild` → AZ 3847; `refreshBank` with AZ at 12000 ft → 3658 |
| 8 | `data/us-states/` | AZ 3847, OR 3425, NE 1655, KS 1231, IA 509 |
| 9, 10 | `data/us-states/us-state-ak.json` | still 6190, the maximum |
| 11 | `data/us-states/` | **changed set = {AZ, OR, NE, KS, IA}**. NE and KS are foot-only. AZ, OR and IA carry both a metre and a foot statement, and before this change `MAX` picked the foot number. Their recorded units are not *only* metre, so this matches the criterion's "not metre" set. Every metre-only state is byte-identical: its best-rank metre maximum equals the main fixture's value, checked for all 45. |
| 12 | `git diff e10f94d -- question-bank/data question-bank/sample-data` | 5 files, 5 lines, `highest_point_m` only; `index.json`, `built_at` and `sample-data/` unchanged |
| 13 | `committed-bank.test.ts` (existing, green) | the offline rebuild reproduces all files |
| 14 | `src/fixtures/us-states-elevation.sparql.json` | `_fixture` block; test "criterion 14" |
| 15 | `curated/us-states.ts` has no elevation or unit (grep); no per-state number in non-test `.ts` | — |
| 16 | `refresh.ts` writes both; `fixture-transport.ts` reads the pair from one directory | "criterion 16": refresh into a temp dir, then `runBuild --offline --fixture <temp>` → every file byte-identical |
| 17 | table below | — |
| 18 | `package.json`, `bun.lock` untouched | — |
| 19 | new tests use local transports and temp dirs; run under the six dead-loopback proxy vars | — |
| 20 | only `question-bank/` plus this brief | — |
| 21 | **red until the Test change request lands**: typecheck, lint and `format:check` pass; `bun test` is 1372 pass / 70 fail, all 70 listed below | — |

### Criterion 17 — all 50 cross-checked

[R] = en.wikipedia "List of U.S. states and territories by elevation", revision
1377209854 (2026-09-28), read 2026-10-03. Its high-point figures cite NGS
datasheets and Peakbagger per row, not Wikidata. "Diff" is (shipped − reference)
/ reference. Marked rows differ by more than 2%.

| # | State | `highest_point` | Shipped `highest_point_m` | Reference (m) | Source | Diff | Mark |
|---|---|---|---|---|---|---|---|
| 1 | Alabama | Cheaha Mountain | 735.5 | 733 | [R] | +0.3% |  |
| 2 | Alaska | Mount McKinley | 6190 | 6190.5 | [R] | -0.0% |  |
| 3 | Arizona | Humphreys Peak | 3847 | 3851.8 | [R] | -0.1% | unit-corrected by T-069 |
| 4 | Arkansas | Mount Magazine | 839 | 839 | [R] | +0.0% |  |
| 5 | California | Mount Whitney | 4421 | 4421 | [R] | +0.0% |  |
| 6 | Colorado | Mount Elbert | 4401 | 4401.2 | [R] | -0.0% |  |
| 7 | Connecticut | Mount Frissell | 748 | 727.2 | [R] | +2.9% | **>2%** — Shipped 748 is Mount Frissell's **summit** (in Massachusetts); CT's high point is the south slope (~725–727 m). Definitional, not a unit error — left unchanged (T-079). |
| 8 | Delaware | Ebright Azimuth | 137 | 136.9 | [R] | +0.1% |  |
| 9 | Florida | Britton Hill | 105 | 105.2 | [R] | -0.2% |  |
| 10 | Georgia | Brasstown Bald | 1458 | 1458.2 | [R] | -0.0% |  |
| 11 | Hawaii | Mauna Kea | 4207.3 | 4207.3 | [R] | +0.0% |  |
| 12 | Idaho | Borah Peak | 3857 | 3861.2 | [R] | -0.1% |  |
| 13 | Illinois | Charles Mound | 376 | 376.4 | [R] | -0.1% |  |
| 14 | Indiana | Hoosier Hill | 383 | 383.13 | [R] | -0.0% |  |
| 15 | Iowa | Hawkeye Point | 509 | 509.3 | [R] | -0.1% | unit-corrected by T-069 |
| 16 | Kansas | Mount Sunflower | 1231 | 1231.7 | [R] | -0.1% | unit-corrected by T-069 |
| 17 | Kentucky | Black Mountain | 1263 | 1261.6 | [R] | +0.1% |  |
| 18 | Louisiana | Driskill Mountain | 163 | 163.1 | [R] | -0.1% |  |
| 19 | Maine | Katahdin | 1606 | 1606.4 | [R] | -0.0% |  |
| 20 | Maryland | Hoye-Crest | 1020 | 1027.2 | [R] | -0.7% |  |
| 21 | Massachusetts | Mount Greylock | 1064 | 1063.4 | [R] | +0.1% |  |
| 22 | Michigan | Mount Arvon | 603 | 603.2 | [R] | -0.0% |  |
| 23 | Minnesota | Eagle Mountain | 701 | 701.6 | [R] | -0.1% |  |
| 24 | Mississippi | Woodall Mountain | 246 | 246 | [R] | +0.0% |  |
| 25 | Missouri | Taum Sauk Mountain | 540 | 540.1 | [R] | -0.0% |  |
| 26 | Montana | Granite Peak | 3904 | 3903.5 | [R] | +0.0% |  |
| 27 | Nebraska | Panorama Point | 1655 | 1655.7 | [R] | -0.0% | unit-corrected by T-069 |
| 28 | Nevada | Boundary Peak | 4007 | 4007.1 | [R] | -0.0% |  |
| 29 | New Hampshire | Mount Washington | 1917 | 1915.92 | [R] | +0.1% |  |
| 30 | New Jersey | High Point | 550 | 549.2 | [R] | +0.1% |  |
| 31 | New Mexico | Wheeler Peak | 4011 | 4013.3 | [R] | -0.1% |  |
| 32 | New York | Mount Marcy | 1629 | 1628.57 | [R] | +0.0% |  |
| 33 | North Carolina | Mount Mitchell | 2037 | 2037.3 | [R] | -0.0% |  |
| 34 | North Dakota | White Butte | 1069 | 1068.6 | [R] | +0.0% |  |
| 35 | Ohio | Campbell Hill | 472 | 471.8 | [R] | +0.0% |  |
| 36 | Oklahoma | Black Mesa | 1737 | 1516.4 | [R] | +14.5% | **>2%** — Shipped 1737 is Black Mesa's overall top (in New Mexico); Oklahoma's high point on the mesa is ~1516 m. Definitional, not a unit error — left unchanged (T-079). |
| 37 | Oregon | Mount Hood | 3425 | 3428.8 | [R] | -0.1% | unit-corrected by T-069 |
| 38 | Pennsylvania | Mount Davis | 979 | 979.3 | [R] | -0.0% |  |
| 39 | Rhode Island | Jerimoth Hill | 247 | 247.2 | [R] | -0.1% |  |
| 40 | South Carolina | Sassafras Mountain | 1085 | 1083.3 | [R] | +0.2% |  |
| 41 | South Dakota | Black Elk Peak | 2208 | 2208 | [R] | +0.0% |  |
| 42 | Tennessee | Kuwohi | 2025 | 2024.79 | [R] | +0.0% |  |
| 43 | Texas | Guadalupe Peak | 2667 | 2667.4 | [R] | -0.0% |  |
| 44 | Utah | King's Peak | 4123 | 4125.2 | [R] | -0.1% |  |
| 45 | Vermont | Mount Mansfield | 1339.69 | 1339.69 | [R] | +0.0% |  |
| 46 | Virginia | Mount Rogers | 1825 | 1740.6 | [R] | +4.8% | **>2%** — Shipped 1825 vs reference 1740.6 (NGS-derived). Metre-stated on Wikidata, so not a unit error; the Wikidata value looks simply wrong. Left unchanged (T-079). |
| 47 | Washington | Mount Rainier | 4389 | 4389 | [R] | +0.0% |  |
| 48 | West Virginia | Spruce Knob | 1482 | 1482 | [R] | +0.0% |  |
| 49 | Wisconsin | Timms Hill | 594.8 | 594.66 | [R] | +0.0% |  |
| 50 | Wyoming | Gannett Peak | 4207 | 4209.1 | [R] | -0.0% |  |

**Three rows are marked: CT, OK and VA.** These are exactly the expander's three and all are T-079. None is a unit error, and all are left unchanged.

### Tests made stale

The bank and pipeline changes break 70 pre-existing tests by design. I edited none of them. Each proposed modification below was tried on a throwaway copy in `src/` (deleted, never committed) and turned the named tests green.

1. **`src/landmarks-verify.test.ts`** › `T-013 tester, criterion 9 — nothing but landmark moves in the bank` › `each of the 50 files, with landmark, climate_kid, top_crops and top_livestock removed, is identical to the default branch's`. **Why stale:** criterion 8 changes 5 files' bytes. **Proposal:** modify it to also drop `highest_point_m` from `us-state-{az,or,ne,ks,ia}.json` only, or re-pin (T-070 owns that choice).
2. **`src/climate-kid-verify.test.ts`** › `T-014 tester, criterion 15 — nothing but climate_kid moves in the bank` › `each of the 50 files, with climate_kid, top_crops and top_livestock removed, digests to the default branch's value`. Same cause and proposal as 1.
3. **`src/top-crops-verify.test.ts`** › `T-015 tester, criterion 13 — nothing else in the bank moves` › `each of the 50 files, with top_crops put back to [], Alaska's highest_point line stripped, region removed and top_livestock removed, digests to the default branch's bytes`. Same cause and proposal as 1.
4. **`src/highest-point-verify.test.ts`** › `T-016 tester, criterion 6 — the other 49 files, index.json and the sample are untouched` › `each of the 49 non-Alaska state files matches the default branch once T-017's region line and T-068's top_livestock line are dropped`. Same cause and proposal as 1.
   - **Watch:** this file's criterion-10 tests regex-check how guards strip `highest_point`. `delete parsed["highest_point_m"]` does not match their `highest_point["']` pattern, but the tester should re-run them after editing.
5. **`src/highest-point-verify.test.ts`** › `T-016 tester, criterion 9 — the full fixture build warns about nothing at all` › `and zero warnings of any other field — the default branch's count is 0`. **Why stale:** criterion 4. `fixtureRows()` parses the main fixture alone, so every state's elevation now has no unit information and warns.
   - **Proposal:** modify `fixtureRows()` to pass the elevation recording as `parseUsStates`'s second argument (minus `_fixture`). With that change, the whole file passes except item 4.
6. **`src/data-us-states.test.ts`** › `criterion 8 — the committed bank matches an offline rebuild` › all 50 `us-state-XX equals the offline rebuild of the committed fixture`. **Why stale:** `expectedEntities()` mirrors the offline build but reads only the main fixture, so every expected entity lacks `highest_point_m`.
   - **Proposal:** modify `expectedEntities()` to pass the elevation fixture to `parseUsStates`, a one-line change. With that, 50/50 pass.
7. **`src/refresh.test.ts`**: 6 tests. **Why stale:** the fake `transportOf` returns the main recording for *every* query, so refresh's new elevation query gets no units and every state blanks.
   - `criteria 1–2 — an unchanged refresh exits 2 and writes nothing` › `` the committed fixture as the live response: exit 2, `bank unchanged` once, bytes untouched ``
   - same describe › `an existing review file and index.json are not entity files`
   - `criteria 3, 6–9, 11 — a changed refresh` › `` exits 0, prints the one change old → new, never `bank unchanged` or built_at ``
   - `criteria 10, 12, 13 — absent fields, added/removed files, warnings` › `a warning that changes no field still prints, on an unchanged run`
   - `criteria 4–5 — failures exit 1 and write nothing` › `50 matched plus an unmatched row still proceeds`
   - `the CLI entry point` › `--bank and --fixture are honoured and the exit code passes through`
   - **Proposal:** modify `transportOf` to answer `US_STATES_ELEVATION_QUERY` with the committed elevation recording. With that, the whole file passes.
8. **`src/refresh-verify.test.ts`**: 9 tests. Same cause, through `replay`.
   - `T-063 criteria 1-2: a refresh that moves nothing but built_at` › `` criterion 1: exits 2 and prints `bank unchanged` exactly once ``; `criterion 1: the committed built_at differs from the refresh instant, and that alone is not a change`; `criterion 2: unchanged run leaves bank and fixture byte-identical and creates no file`; `criteria 1, 12: index.json is not an entity file — a bank missing it is still unchanged`; `criteria 1, 14: an existing *.review.json is not a bank change and is left alone`
   - `T-063 criterion 5: fewer than all 50 curated states matched` › `exactly 50 matched → proceeds (exit 2 here, since nothing moved)`
   - `T-063 criterion 11: sources.built_at is never a change line` › `not even when the old file's sources block lacks built_at`
   - `T-063 criterion 12: added and removed entity files` › `a file built but not present before is reported added by name`
   - `T-063 CLI: main() honours --bank and --fixture` › `main --bank <copy> --fixture <copy> on an unchanged response exits 2`
   - **Proposal:** modify `replay` to answer `US_STATES_ELEVATION_QUERY` with the elevation recording, **and** modify `warningLines` in `T-063 criterion 13: normalisation warnings reach stdout` to pass that recording to `parseUsStates`.
   - **Why the second edit matters:** without it, the two criterion-13 tests, green today only because both sides carry the same 50 "no unit" warnings, go red. With both edits, 43/43 pass.

**Count floors:** none affected. No test pins a per-file test count that this change moves.

### What I did not do, deliberately

- **`US_STATES_QUERY` and the main fixture are untouched.** The main query still fetches its unitless `?elevation`, which now only signals that "an elevation exists, unit unknown". Changing the query text would make the main fixture no longer a recording of that query, and re-recording it is forbidden (criterion 12). The next real refresh could drop the column. **Reviewer to decide** whether that is worth a queue entry.
- **`sample-data/` is unchanged** (criterion 12), but it was **already stale on `main`**: a `build:sample` today adds `top_crops`/`top_livestock` to CO. I ran it, saw that, and reverted. T-064 already owns `sample-data/`'s fate, so there is no new entry.
- **No edits to `tasks.md` or `PROGRESS.md`.** They are left for the sweep.
- **CT, OK and VA are not touched** (T-079).

### How to run

```bash
cd question-bank
bun install --frozen-lockfile
export HTTP_PROXY=http://127.0.0.1:1 HTTPS_PROXY=http://127.0.0.1:1 ALL_PROXY=http://127.0.0.1:1 \
       http_proxy=http://127.0.0.1:1 https_proxy=http://127.0.0.1:1 all_proxy=http://127.0.0.1:1
bun test src/highest-point-metres.test.ts      # 23 pass
bun test                                       # 1372 pass, 70 fail — exactly the list above
bun run typecheck && bun run lint && bun run format:check
bun src/build.ts --offline --quiet && git status --short data   # empty: bank reproduces
git diff e10f94d -- data sample-data           # 5 files, highest_point_m only
```

## Verdict

## Notes

**Worker (2026-10-03)**

- **Model:** Opus, as the brief asked.
- **Design: a second query and fixture, not a re-recorded main fixture.** Re-recording the main fixture would move `built_at` in all 50 files (criterion 12 forbids it). The elevation recording is therefore separate and has its own `captured_at` (2026-10-03), while the main fixture stays at 2026-08-04, so the offline bank now mixes two snapshots.
  - **Risk checked:** the snapshots agree on every metre-stated state.
  - **Decided by:** worker. **Reviewer to confirm or overturn.** The next real `bun run refresh` re-records both together.
- **Unit resolution rules** (worker's call; **reviewer to confirm**):
  - **Metre statements win when present**, taking their max. This mirrors the old `MAX`, which keeps the 45 metre-only states byte-identical.
  - **Otherwise feet × 0.3048, rounded to whole metres.** A foot is 0.3 m, so decimals would be false precision.
  - **Otherwise blank and warn.** That covers kilometre, a missing unit node, `Q199`, and no elevation response at all.
  - **Extra 1) Metre/foot disagreement:** when metre and foot statements disagree by more than 1%, the metre value ships and a warning is raised. None of the 50 trips it today.
  - **Extra 2) Unknown unit beside a usable value:** the usable value ships with a warning.
  - **Why the extras:** "Flag uncertain data", applied conservatively.
- **An offline build with no elevation fixture beside `--fixture` fails hard** (ENOENT) rather than blanking 50 elevations. Silent mass-blanking would read as data, not as a broken setup. **Reviewer to confirm.**
- **Surprise: three of the five "feet states" also carry a correct metre statement.** AZ (3847), OR (3425) and IA (509) do; the bug was the `MAX` aggregate choosing the bigger number. Only NE and KS are foot-only on Wikidata.
- **Surprise: `sample-data/` is already stale on `main`** (see Handoff). T-064 owns it.
- **The criteria held up.** None was unobservable or self-contradictory. One reading to flag on criterion 11: AZ, OR and IA have *both* units recorded, and I treat them as "recorded unit is not (only) metre". **Tester to confirm that reading, or bounce it to task-expander.**
- **The brief predicted the stale-test halt, and it arrived:** 70 reds across 7 files, larger than T-068's 14 because `data-us-states.test.ts` parametrises one test per state.
