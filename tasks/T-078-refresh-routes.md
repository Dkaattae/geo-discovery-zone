# T-078 — Point the other refresh routes at `bun run refresh`

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** Dkaattae — 2026-10-13, in the orchestrator session: "I approve T-078, continue the run". See `runs/T-078-refresh-routes.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-078
**Branch:** `claude/loving-darwin-jij761`
**PR:** #78, opened draft at expand time, built from the branch above. It **stays draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-13 | `cse_01PtngPoaghwWcXCwbmrjZNw` (orchestrated run: every spawned role shares this id) |

## Why T-078 and not T-084

**T-084 was skipped, not done, and its `Depends on: —` is incomplete.** Its
Done-when requires "the fixture is re-recorded" and "Alaska's capital is
`Juneau` from a live refresh". Re-recording the fixture *is* a changed refresh:
`refresh.ts` stamps every bank file's `sources.built_at` with the new
`captured_at`, and `committed-bank.test.ts` needs the bank to match the
fixture byte for byte. That makes the four digest guards red, which is exactly
what T-070 (a) exists to settle, and T-070 (a) is waiting on a human answer to
Q1. T-084's own entry says "sequence it with T-070 (a)". So it is blocked in
the same way T-064 was skipped on 2026-09-22.

**Split proposed for a human, not made here.** The query half of T-084 is
offline-checkable today and moves no committed byte. `capitalLabel` is matched
by the identity of `US_STATES_QUERY` in `fixture-transport.ts:38–43`, and the
committed fixture already holds `Juneau` (`src/fixtures/us-states.sparql.json:100`,
captured 2026-08-04). That half is: `"en,mul"` in the label service, plus a
`mul` fallback for `highestPoint` and `borderNames`. The re-record and the
live check would then become part of the first real refresh after T-070 (a).
Splitting changes T-084's Done-when, so that decision is a person's call. The
note is on T-084 in `tasks.md`.

## Goal

`bun run build`'s live pass still asks Wikipedia for a fun-fact draft for every
state, all 50 already curated, and the main fixture still tells a maintainer to
regenerate it with `bun run build`. Both should point at the route T-063 built:
draft only what is missing, and re-record through `bun run refresh`.

## Already true (do not rebuild)

- **The selection rule exists.** `draftMissingFunFacts` (`question-bank/src/review-file.ts:56`)
  requests a draft only for entities with empty `fun_facts` and a
  `sources.wikipedia_title`, and turns a failed request into a `fun_facts`
  warning. It is tested directly in `refresh.test.ts` (criterion 14) and
  `refresh-verify.test.ts:609`. `refresh.ts` uses it, and `build.ts` does not.
  `build.ts` still has its own loop over every entity (`build.ts:162–176`).
- **The elevation fixture already says the right thing.** Its `regenerate_with`
  (`src/fixtures/us-states-elevation.sparql.json:9`) names `bun run refresh`.
  Only the main fixture is stale.
- **A refresh keeps the `_fixture` block verbatim** apart from `captured_at` and
  `rows` (`refresh.ts`, T-063 criterion 6). An edited `regenerate_with` survives
  every later refresh.
- **No existing test drives `runBuild`'s live fun-fact pass with a
  `SummaryTransport`.** Every existing `runBuild` call passes `--no-fun-facts`,
  `--offline` or `--help`. The worker is expected to add tests, not to change any.

## Acceptance criteria

"A live build" below means `runBuild(argv, deps)` from `question-bank/src/build.ts`
with **no** `--offline`, **no** `--fixture` and **no** `--no-fun-facts`. Its
`deps.sparql` must be a `SparqlTransport` that replays the committed recordings,
and its `deps.summary` must be a `SummaryTransport` that records every title it
is called with. `--out` must point at a temporary directory. "Curated" means
`CURATED_US_STATES` in `src/curated/us-states.ts`.

**The live fun-fact pass**

1. **No drafts for curated states.** A live build over all 50 states, where
   every entity's built `fun_facts` is non-empty (today's curated table), calls
   the `SummaryTransport` **zero** times.
2. **No review file then.** The same build writes no `fun-facts.review.json`
   in `--out`.
3. **One missing fact, one request.** A live build where exactly one entity
   has empty `fun_facts` (the rest non-empty) and has a `sources.wikipedia_title`
   calls the `SummaryTransport` **exactly once**, with that entity's title.
4. **That draft lands in the review file.** The same build writes
   `fun-facts.review.json` in `--out`. It holds exactly one draft, whose `id`
   is that entity's id, and the draft's fact has `reviewed: false`.
5. **The draft never ships.** In that same build, the entity file for that
   entity has `fun_facts` equal to `[]`. The draft's text appears in no entity
   file under `--out`.
6. **No title, no request.** A live build where exactly one entity has empty
   `fun_facts` and **no** `sources.wikipedia_title` calls the `SummaryTransport`
   zero times.
7. **A failed request is a warning.** A live build where exactly one entity has
   empty `fun_facts`, and the `SummaryTransport` throws for its title, still
   resolves and still writes all 50 entity files. It also returns exactly one
   warning with `field: "fun_facts"` and `entity` equal to that entity's id.
8. **Subsets follow the same rule.** A live build with `--states CO,VT`, where
   only VT has empty `fun_facts`, calls the `SummaryTransport` exactly once,
   with VT's title. It never calls it with CO's title, or with the title of any
   state outside the subset.
9. **`--no-fun-facts` still wins.** A build with `--no-fun-facts`, otherwise
   identical to criterion 3's, calls the `SummaryTransport` zero times.
10. **No test reaches the network.** Every test added for 1–9 passes with all
    six proxy variables pointed at `http://127.0.0.1:1`
    (`test-guidelines.md`, "No network in tests"). None of them stubs `fetch`.
11. **The curated table is left as found.** If a test makes an entity's
    `fun_facts` empty by mutating curated data in-process, a later test in the
    same `bun test` run that reads `CURATED_US_STATES` sees every state's
    original `fun_facts`. Restore it in `finally` or `afterEach`.

**The fixture's regeneration note**

12. **The note names `bun run refresh`.** `_fixture.regenerate_with` in
    `question-bank/src/fixtures/us-states.sparql.json` contains `bun run refresh`
    and does not contain `bun run build`.
13. **Nothing else in that file moves.** Apart from `_fixture.regenerate_with`,
    the parsed fixture deep-equals the default branch's: every other `_fixture`
    key, `head` and `results`.

**What must not move**

14. **The bank is untouched.** No file under `question-bank/data/` differs
    from the default branch. `committed-bank.test.ts`'s offline rebuild stays
    byte-identical.
15. **The offline build is unchanged.** `bun run build -- --offline --out <tmp>`
    makes zero `SummaryTransport` calls and writes no `fun-facts.review.json`.
    Its stdout is unchanged too: the same warnings and the same summary lines
    as on the default branch.
16. **The refresh is unchanged.** `refresh.ts`'s behaviour does not change, and
    every existing test in `refresh.test.ts` and `refresh-verify.test.ts`
    passes unmodified.
17. **No dependency is added.** `question-bank/package.json` and `bun.lock` do
    not change.
18. **No existing test is modified or deleted.** Every test that existed before
    this task still passes unmodified. The whole `question-bank` suite passes,
    along with `format:check` and lint.

## Out of scope

- **T-084** in any form: the `mul` labels, the query, and re-recording either
  fixture. **No fixture is re-recorded in this task.**
- **Running `bun run refresh` or a live `bun run build`.** No live Wikidata or
  Wikipedia call is needed or wanted. A live refresh would move the bank and
  turn the T-070 (a) digest guards red.
- **T-070 (a)**: the digest guards and their neutralisations.
- **`sample-data/`** and `build:sample` (T-064).
- **Docs.** `question-bank/README.md`, `conventions.md` and the `build.ts`
  header comment can keep describing `bun run build` as the live build, which
  it still is. Correct any line that says the live build drafts "every" state.
  Do not rewrite anything else.
- **The review file's format**, `fetchFunFact`, `firstSentences` and
  `createSummaryTransport`.
- **Switching on the monthly refresh routine.**

## Constraints

- **Files expected to change:**
  - `question-bank/src/build.ts`
  - `question-bank/src/fixtures/us-states.sparql.json` (the one `_fixture` string only)
  - new test file(s) under `question-bank/src/`
  - `question-bank/src/review-file.ts` only if sharing the rule needs it, and
    `draftMissingFunFacts`'s existing tests must still pass unmodified
- **Use `bun`.** Never npm, yarn or pnpm. No new dependency without asking
  ([`CLAUDE.md`](../CLAUDE.md) "Packages").
- **Unreviewed text never ships** ([`CLAUDE.md`](../CLAUDE.md) "Content rules").
  Drafts go to the review file with `reviewed: false` and nowhere else.
- **Use the seams that exist.** Use `SparqlTransport` and `SummaryTransport`
  and never mock `fetch` (`test-guidelines.md`, "Start below the transport").
  The worker decides how a test gets an entity with empty `fun_facts`. One
  route needs no new seam: the curated objects in `CURATED_US_STATES` and
  `curatedByPostal` are plain mutable objects that `normalize.ts:209` reads at
  call time. If the worker adds a `BuildDeps` field instead, the CLI path must
  pass nothing and behave exactly as before.
- **If a pre-existing test breaks by design,** list it under "Tests made stale"
  in the Handoff and do not touch it (D-14). Nothing above expects one.

## Context

Required reading for the worker and the tester:

- `tasks.md` T-078: the queue entry and its origin in T-063's review (PR #68).
- `question-bank/src/build.ts`: `runBuild` and `BuildDeps`, and the live
  fun-fact loop at `:162–176`.
- `question-bank/src/review-file.ts`: `draftMissingFunFacts` and `writeReviewFile`.
- `question-bank/src/refresh.ts`: how T-063 calls the same thing (around
  `draftMissingFunFacts(entities, options.summary)`), and its fixture-block
  handling.
- `question-bank/src/normalize.ts:203–209`: where `fun_facts` comes from
  (`curated.fun_facts ?? []`).
- `question-bank/src/fixture-transport.ts`: replaying both recordings by query
  identity. This is a ready-made `SparqlTransport` for a live-path test.
- `question-bank/src/refresh.test.ts` (criterion 14) and
  `question-bank/src/refresh-verify.test.ts:609`: existing tests of the rule.
- `question-bank/src/highest-point-metres.test.ts:250`: an existing example of
  driving `runBuild`'s live path through `deps.sparql`.
- `test-guidelines.md`: "Start below the transport" and "No network in tests".
- `geoquizdataplan.md` §1.6 (fun facts and the review file) and §1.9
  (build-time only).
- `engineering-decisions.md` E-6: the committed bank must be reproducible from
  the fixture.

## Handoff

## Verdict
