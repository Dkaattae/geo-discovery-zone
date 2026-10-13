# T-078 — Point the other refresh routes at `bun run refresh`

**Status:** `test changes requested`
**Next step:** `human`
**Approved:** Dkaattae — 2026-10-13, in the orchestrator session: "I approve T-078, continue the run". See `runs/T-078-refresh-routes.md`.
**Test changes:** `requested`
**From:** [`tasks.md`](../tasks.md) T-078
**Branch:** `claude/loving-darwin-jij761`
**PR:** #78, opened draft at expand time, built from the branch above. It **stays draft** until the reviewer approves it
**Fault:** test changes are waiting for approval: criterion 12 necessarily breaks T-079's byte pin on `us-states.sparql.json`, which the brief did not foresee (owner: a human, D-14/D-15).

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-13 | `cse_01PtngPoaghwWcXCwbmrjZNw` (orchestrated run: every spawned role shares this id) |
| worker | 2026-10-13 | `cse_01PtngPoaghwWcXCwbmrjZNw` (same orchestrated run; spawned as a separate subagent) |
| tester | 2026-10-13 | `cse_01PtngPoaghwWcXCwbmrjZNw` (same orchestrated run; spawned as a separate subagent, so the id check cannot show independence) |

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

**TL;DR: built.** The live `bun run build` now drafts fun facts through `draftMissingFunFacts` (the rule `refresh.ts` already used), so it makes zero Wikipedia calls while all 50 states are curated. The main fixture's `regenerate_with` now names `bun run refresh`. The suite is 1808 pass and **1 stale red, by design**: T-079's fixture-digest pin (see **Tests made stale**). That one needs a human-approved test change (D-14), and the brief did not foresee it.

**Files changed**

- **`question-bank/src/build.ts`**: the inline loop over every entity (old `:162–176`) is replaced by `draftMissingFunFacts(entities, fetchSummary)`. Its warnings are appended to `warnings` in the same position and format (`String(error)`) as before. The imports of `fetchFunFact` and `FunFactDraft` are dropped. Nothing else changed: no new `BuildDeps` field, `parseArgs`, help text, offline path and sink are untouched.
- **`question-bank/src/fixtures/us-states.sparql.json`**: only `_fixture.regenerate_with`, now `"bun run refresh   # re-records this file and us-states-elevation.sparql.json, keeping this _fixture block apart from captured_at and rows"`.
- **`question-bank/src/build-fun-facts.test.ts`** (new): 8 tests, covering criteria 1–9, 11 and 15.
- **`review-file.ts`, docs, `package.json`, `bun.lock`, `data/`**: not touched.

**Where each criterion lives**

| # | Behaviour lives in | Worker test |
|---|---|---|
| 1, 2 | `build.ts` fun-fact block → `review-file.ts` `draftMissingFunFacts` (skips non-empty `fun_facts`). `writeReviewFile` is only called when `drafts.length > 0` | `criteria 1 and 2: …` |
| 3, 4, 5 | same. Drafts go only to `writeReviewFile`, and entities come from `normalize.ts` `curated.fun_facts ?? []` | `criteria 3, 4 and 5: …` |
| 6 | `draftMissingFunFacts` `if (!title) continue`. The test strips Vermont's `article` binding from the replayed response | `criterion 6: …` |
| 7 | `draftMissingFunFacts` catch → warning, appended in `build.ts` | `criterion 7: …` |
| 8 | `normalizeUsStates({ only })` filters entities before drafting. The test also blanks TX (outside the subset) | `criterion 8: …` |
| 9 | `parseArgs` `--no-fun-facts` → `args.funFacts = false` (unchanged) | `criterion 9: …` |
| 10 | all transports are local functions; `fixtureTransport` reads files. No `fetch` stub | run the file with the six proxy vars set (below) |
| 11 | `afterEach` restores every curated `fun_facts` by identity | `T-078 criterion 11: …` (runs last in the file) |
| 12, 13 | the fixture JSON | none of mine. Checked by hand: parsed fixture minus `regenerate_with` deep-equals `HEAD` (pre-change) → `True` |
| 14 | `git diff --stat` shows nothing under `question-bank/data/`; `committed-bank.test.ts` passes | — |
| 15 | `--offline` forces `funFacts = false` (unchanged) | `criterion 15: …`. Also by hand: an offline build from a pre-change worktree and from this branch give identical `--out` trees and identical stdout, apart from the absolute fixture path on line 1 (different checkout dirs) |
| 16 | `refresh.ts` not touched; its tests pass unmodified | — |
| 17 | not touched | — |
| 18 | only the T-079 pin below goes red | — |

**How to run**

```bash
cd question-bank
bun install   # node_modules was absent in this sandbox; no lockfile change
export HTTP_PROXY=http://127.0.0.1:1 HTTPS_PROXY=http://127.0.0.1:1 http_proxy=http://127.0.0.1:1 https_proxy=http://127.0.0.1:1 ALL_PROXY=http://127.0.0.1:1 all_proxy=http://127.0.0.1:1
bun test src/build-fun-facts.test.ts   # 8 pass
bun test                               # 1808 pass, 1 fail (stale, below)
bun run typecheck && bun run lint && bun run format:check   # all clean
```

**Tests made stale**

- **`question-bank/src/highest-point-in-state-verify.test.ts`**, `describe("T-079 tester, criterion 19 — both SPARQL fixtures are byte-identical to 323254c")` › `test("us-states.sparql.json")`.
  - **Why it is stale:** it pins the main fixture's sha256 to `994223fe…f41f`. Criterion 12 requires changing `_fixture.regenerate_with` in that file, so any implementation turns it red. The sibling `us-states-elevation.sparql.json` test still passes.
  - **Proposed fix:** modify it. Either update the digest to `121a4b8a1d94409ab76063909cb64b3b40ddde93431b07dec5416662455cfd9d` (this branch's file) and rename the describe to say "…except T-078's `regenerate_with`", or, more durably, compare the parsed fixture minus `_fixture.regenerate_with` against a digest. Tester to raise it with a human under D-14.
  - **Count floors:** none affected. No test was removed, and the new file only adds tests.

**Contradicts the brief**

- **"Nothing above expects one" (Constraints, stale tests) is wrong.** Criteria 12 and 18 conflict as written: the T-079 pin above makes "every existing test still passes unmodified" impossible once the fixture string changes. I implemented criterion 12 as specified and left the pin red, per D-14. **Owner:** the tester raises the test change with Dkaattae. If the human would rather keep the pin, criterion 12 goes back to task-expander.

**Deliberately not done**

- **No `BuildDeps` seam added.** Mutating `curatedByPostal` in-process was enough, as the brief allowed.
- **Docs left alone.** No line in `question-bank/README.md`, `conventions.md`, the `build.ts` header or `--help` says the live build drafts "every" state, so there was nothing to correct. The README (`:77`) already describes the missing-only rule.
- **No live build or refresh was run.** No fixture was re-recorded.

**Notes**

- **The output dir holds `index.json` as well as the 50 entity files.** My first count expected 50 `.json` files and failed. The test now counts `us-state-*.json`. The tester should know this when checking criterion 7's "all 50 entity files".
- **Warning order is the same as before.** Fun-fact warnings are appended after the normalisation warnings, as the old inline loop did, so `report()` prints the same sequence.
- **Same session id as the expander.** This is an orchestrated run, so every role shares `cse_01PtngPoaghwWcXCwbmrjZNw`. The tester's session check will see a `worker` row with its own id. Orchestrator/human to decide whether that isolation is enough: the subagent contexts are separate, but the id is not.

## Verdict

**TL;DR: halted for a test change, not failed.** All 18 criteria hold on the
branch. 17 are met outright, and 18 is met except for one existing test. That
test is T-079's byte pin on `us-states.sparql.json`, and criterion 12 has to
break it. Changing it needs a person's approval in an attended tester session
(D-14/D-15), so the run stops here: **Next step `human`**.

**Independence.** This is an orchestrated run (`runs/T-078-refresh-routes.md`).
Every role shares `cse_01PtngPoaghwWcXCwbmrjZNw`, so I appear in the Sessions
table under the worker's id. That is not evidence either way. My independence
rests only on being a freshly spawned subagent with its own context. I did not
see the worker's reasoning, only its committed Handoff. That is weaker than a
separate session, because it depends on the orchestrator having spawned me
correctly, which I cannot check myself.

**Suite (six proxies at `http://127.0.0.1:1`):** `bun test` gives 1821 pass and
1 fail, across 38 files. The one fail is the stale pin below.
`typecheck`, `lint` (0 warnings) and `format:check` are clean.

**Tests added:** `question-bank/src/refresh-routes-verify.test.ts`, 13 tests.
I wrote them from the criteria. The expected values came from the brief, from
`d71dd8a` (the default branch) and from the curated table, never from `build.ts`.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `criterion 1: …`: 50 entities, all non-empty `fun_facts`, recorder saw 0 titles |
| 2 | met | `criterion 2: …`: no `fun-facts.review.json` |
| 3 | met | `criterion 3: …`: WY blanked, calls equal `[WY's built wikipedia_title]` |
| 4 | met | `criterion 4: …`: 1 draft, `id` `us-state-wy`, `reviewed: false` |
| 5 | met | `criterion 5: …`: WY file `fun_facts: []`. The draft text and marker appear in no `.json` under `--out` except the review file (`index.json` included) |
| 6 | met | `criterion 6: …`: the `article` binding is dropped for Wyoming, the entity has no title, 0 calls |
| 7 | met | `criterion 7: …`: the transport throws for WY's title, the build resolves, 50 `us-state-*.json` are written, and exactly 1 `fun_facts` warning has `entity` `us-state-wy` |
| 8 | met | `criterion 8: …`: `--states CO,VT`, VT and ME (outside the subset) blanked, calls equal `[VT title]` and never CO's |
| 9 | met | `criterion 9: …`: `--no-fun-facts`, 0 calls, no review file |
| 10 | met | Both T-078 test files pass with all six proxy variables set to the dead loopback. Neither stubs `fetch`: the SPARQL side is `fixtureTransport`, the summary side a local function |
| 11 | met | `criterion 11: …`: runs last. Every curated `fun_facts` is the same array by identity and by JSON content |
| 12 | met | `criterion 12: …` |
| 13 | met | `criterion 13: …`: the parsed fixture minus `regenerate_with`, key-sorted, hashes to the sha256 of the same object from `d71dd8a` (`2acd0f04…a360`) |
| 14 | met | `git diff origin/main -- question-bank/data` is empty. `committed-bank.test.ts` passes |
| 15 | met | `criterion 15: …` (0 calls, no review file). **stdout checked by hand:** I ran `bun run build -- --offline` from a worktree of `origin/main` and from this branch. The two `--out` trees are identical (`diff -r`). stdout is identical except the absolute paths on lines 1, 2 and 5 (different checkout and out dirs). Both show the same `3 warning(s):` CT/OK/VA lines. The T-080 stdout tests also pass |
| 16 | met | `refresh.ts`, `refresh.test.ts`, `refresh-verify.test.ts` and `review-file.ts` have no diff from `origin/main`, and all pass |
| 17 | met | `package.json` and `bun.lock` have no diff |
| 18 | **met except one stale test** | No pre-existing test file is in the diff (only the new `build-fun-facts.test.ts`). One pre-existing test is red by design, see the Test change request below |

**Mutations** (each reverted with `git checkout`. The working tree was clean apart
from my test file before I committed):

- **Draft every entity** (pass `fun_facts: []` copies to `draftMissingFunFacts`, which is the old behaviour): criteria 1, 2, 3, 4, 6 and 8 go red.
- **Run the pass despite `--no-fun-facts`:** criterion 9 goes red.
- **Drop `warnings.push(...drafted.warnings)`:** criterion 7 goes red.
- **Copy each draft into its entity's `fun_facts`:** criterion 5 goes red.
- **Draft an extra out-of-subset entity:** criterion 8 goes red. Criteria 1–4 and 6 do too, because the mutation was crude and fired on every run.
- **Fixture: `regenerate_with` back to `bun run build`:** criterion 12 goes red.
- **Fixture: `rows` 50 to 51:** criterion 13 goes red.
- **Test file: disable the `afterEach` restore:** criterion 11 goes red.

**Worker's tests** (`build-fun-facts.test.ts`, 8): all pass and are honest. No
network, no `fetch` stub, no fixture edits beyond the criterion-12 string.

**Stale-test check.** I confirmed the worker's single entry independently, and
found no others. The full suite has exactly one red test. Its expected value is
a sha256 of the whole fixture file, and criterion 12 requires changing a string
in that file, so no implementation of criterion 12 can keep it green. The
sibling `us-states-elevation.sparql.json` pin stays green and is not touched.
No count floor is affected: the request is a modify, not a delete.

**What a human has to do:** start a `tester` in a session you are attending for
T-078. Approve or refuse row 1 below there. If you refuse, criteria 12 and 18
conflict, and the brief goes back to `task-expander`.

## Test change request

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/highest-point-in-state-verify.test.ts` › `T-079 tester, criterion 19 — both SPARQL fixtures are byte-identical to 323254c` › `"us-states.sparql.json"` | `2a1202d`, T-079 tester. It protected T-079's promise not to re-record or edit either SPARQL fixture: the main fixture's sha256 is pinned to `994223fe…f41f` | T-078 criterion 12 requires `_fixture.regenerate_with` in this file to change from `bun run build …` to a `bun run refresh` string. Any change to the file changes its sha256, so the pin is red by design (criterion 13 separately pins that nothing else moved) | modify | Same test name, same whole-file sha256 assertion, with the digest updated to `121a4b8a1d94409ab76063909cb64b3b40ddde93431b07dec5416662455cfd9d` (this branch's file, `sha256sum` checked by the tester). The describe becomes `T-079 tester, criterion 19 — both SPARQL fixtures are byte-identical to 323254c (main fixture: as of T-078's regenerate_with)`, with a comment citing T-078 criterion 12 and this request. It still pins every byte, so it is no weaker. The elevation entry is unchanged | *(awaiting a person, in an attended tester session)* |
