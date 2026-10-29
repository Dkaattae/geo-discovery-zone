# T-070 — Re-pin the digest guards, and let them survive a refresh

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** orchestrator — 2026-10-28, unattended run. See `runs/T-070-repin-digest-guards.md`.
**Test changes:** `approved — Dkaattae, 2026-10-29`
**From:** [`tasks.md`](../tasks.md) T-070
**Branch:** `claude/charming-pascal-jqpxd3`
**PR:** #103, opened draft at expand time from the branch above

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-28 | cse_011oDiJcaEvyueGBAthPSQu3 |
| worker | 2026-10-28 | cse_011oDiJcaEvyueGBAthPSQu3 (same remote session id as the expander: the orchestrator spawned both as subagents of one session; the tester must still be a fresh one) |
| tester | 2026-10-28 | cse_011oDiJcaEvyueGBAthPSQu3 (orchestrated run: same remote session id as worker and expander. A freshly spawned subagent with its own context, not a separate session; see Verdict) |
| tester (attended) | 2026-10-29 | cse_011oDiJdsZFzW3GaxRfDpUmx (a separate session; Dkaattae attending) |

> **Read before approving: this task is mostly edits to tests that already
> exist.** A worker may not make those edits (D-14). The worker writes `E-30`,
> may add new tests or helpers, and lists every test it makes stale. The tester
> then raises a Test change request, and a person has to approve each row in a
> session they are attending (D-15). **An orchestrated run will halt at
> `test changes requested` / `human`.** That halt is expected, not a fault.
> Plan to attend the tester step.

## Goal

Every task that touched the bank since T-013 has had to teach four to eight
digest guards to ignore its own change. The guards now assert that eight files
still hold wrong elevations underneath, and three of them cannot see a
`top_crops` change at all. Dkaattae decided on 2026-10-27 (Q1): re-pin every
digest guard against the default branch, delete the neutralisations, and keep
the guards green across a refresh that moves only `sources.built_at` and the
SPARQL fixtures. That refresh is what the monthly routine produces.

## Definitions used by the criteria

- **R**: the default-branch commit this task's branch starts from. It is
  `b0ee336` at expansion. If the branch is rebased onto a newer default
  branch, R becomes the new base, and the Handoff says so.
- **Pinned guard**: any test in `question-bank/src/**/*.test.ts` or
  `backend/tests/**/*.py` that compares committed content with a value
  recorded at an earlier commit. The value may be a digest (sha256, whole or
  truncated), a byte or deep-equality copy, or a literal list such as an `E-n`
  number range. The content may be anything committed, including
  `question-bank/data/**`, `question-bank/src/fixtures/**`,
  `backend/app/data/content.json`, `engineering-decisions.md`,
  `openapi.yaml`, manifests and lockfiles, test files, source trees,
  `TEMPLATES` and `LEVEL_SEED_WEIGHTS`. Two kinds are **not** pinned guards:
  GitHub Action SHA pins (`frontend/src/ci-action-pinning.test.ts`), and the
  "no unexpected key" allow-lists (`landmarks.test.ts:584`,
  `climate-kid.test.ts:683`, `state-animals.test.ts:635`).
- **Bank file**: `question-bank/data/us-states/index.json`, or one of the 50
  `question-bank/data/us-states/us-state-*.json`.
- **Simulated refresh S(t)**: take a working tree at the task branch's head and
  make exactly two edits. Set `_fixture.captured_at` to `t` in both
  `question-bank/src/fixtures/us-states.sparql.json` and
  `us-states-elevation.sparql.json`. Set `sources.built_at` in all 50 entity
  files to `new Date(t).toISOString()`. Leave every other byte of those files
  unchanged. Two instants are used:
  - **t₁** = `2027-01-01T00:00:00Z`
  - **t₂** = `2026-08-04T16:05:36Z`, one second after today's committed instant

  This is what `bun run refresh` writes to those fields (`src/refresh.ts`
  header and `:331`/`:352`, and `src/build.ts:150-157`).

## Acceptance criteria

**Neutralisations are gone**

1. No test file under `question-bank/src/` defines or uses
   `T069_DEFAULT_BRANCH_HIGHEST_POINT_M` or `T079_DEFAULT_BRANCH_HIGHEST_POINT_M`.
   No pinned guard puts an earlier `highest_point_m` back into a bank file
   before comparing it.
2. Before comparing a bank file, no pinned guard deletes or strips `landmark`,
   `climate_kid`, `region`, `top_livestock` or `highest_point`, and none
   resets `top_crops` to `[]`. This holds for every one of the 50 files. In
   particular, no guard treats Colorado or Alaska differently from the others.
3. Before comparing questions from `question-bank/data/questions/us-states.json`
   or `backend/app/data/content.json`, no pinned guard strips `choices`,
   `correctIndex` or `choiceGeometryIds` from `map_click` questions.
4. More generally, a pinned guard may change content before comparing it in
   only one way: it may remove `sources.built_at` from a bank entity file.
   Parsing, key-sorting or re-serialising is not a change. Every other removal,
   reset, restoration or exclusion of a key, value, line, question, file or
   directory is a change, and none remains. Example: criterion 14 of
   `hand-check-levels-verify.test.ts` excludes `data/questions/` on T-040's
   behalf.

**The guards still guard**

5. Every bank file is covered by at least one pinned guard that hashes all of
   its content except `sources.built_at`. The tester checks this by mutation:
   each single edit below, made alone in the tree at the branch head, turns at
   least one pinned guard red. They are:
   - `us-state-il.json` `top_crops[0]`
   - `us-state-ct.json` `highest_point_m`
   - `us-state-co.json` `landmark`
   - `us-state-co.json` `climate_kid`
   - `us-state-il.json` `region`
   - `us-state-ak.json` `highest_point`
   - `top_livestock` of any state that has one
   - `us-state-co.json` `population`
   - one id in `index.json`
6. **The `top_crops` blind spot is closed.** Every remaining pinned guard that
   hashes whole bank entity files goes red when `us-state-il.json`'s
   `top_crops` changes and nothing else does.
7. Every pinned guard is green at the branch head. Each value it is pinned to
   equals the value of the same content, computed the same way, at R. The
   exception is content this task itself changes, such as test files and
   `engineering-decisions.md`. For that content, the pin equals the branch
   head.
8. Wherever this task changes a pinned value, the comment or name next to it
   names R, or the branch head as criterion 7 allows, as the commit it was
   recorded at. No changed pin is still labelled with an older commit
   (`e587ec1`, `13a735f`, `eda7fde`, `284b8bc`, `e10f94d`, `323254c`,
   `d71dd8a`, `aa88101`, `41811f9`, `3279555`, `5d72ca5`, `45b00d7`,
   `1032b77`, `2b4edb2`).

**A refresh that moves only `built_at` and the fixtures is not red**

9. On S(t₁), `cd question-bank && bun test` passes in full.
10. On S(t₂), `cd question-bank && bun test` passes in full. This is the
    one-second boundary: no test may pin today's instant.
11. On S(t₁), `make -C backend test` passes in full.
12. No test asserts the byte-identity, digest or parsed deep-equality of either
    SPARQL fixture file, in whole or with parts left out. Tests may still
    *read* a fixture, for example to build or to check `regenerate_with`.
13. No test asserts that `sources.built_at` or `_fixture.captured_at` equals a
    literal instant. Tests that require one shared instant across all 50 files
    (`committed-bank.test.ts:182`), or require `built_at` to equal the
    fixture's `captured_at`, are unaffected.

**What may be deleted**

14. An existing test may be deleted outright only if it falls in one of these
    classes. Any other existing pinned guard is re-pinned, not deleted.
    - (i) It pins a SPARQL fixture (criterion 12).
    - (ii) Its only job is to prove that a neutralisation removed or restored
      something. Examples: "the region removal actually drops the key",
      "the restoration actually removes the crops", "the Alaska
      neutralisation actually removes the highest_point line", and T-016
      criterion 11 "both neutralisation routes are proven real".
    - (iii) It pins a literal `built_at` or `captured_at` (criterion 13).
    - (iv) A person approved its deletion in a Test change request row, and
      the row says why re-pinning was not possible.

    The Verdict lists every deleted test and its class.

**Stale text the entry asked to fix in passing**

15. `highest-point-verify.test.ts` has no describe or test name claiming the
    full fixture build "warns about nothing at all".
16. `highest-point-verify.test.ts` has no comment or name saying "the other 51
    paths". It also has none saying "the sample" is untouched, since
    `sample-data/` has been deleted.

**The decision is written down**

17. `engineering-decisions.md` gains exactly one new entry, numbered with the
    next unused `E-n` (`E-30` at expansion). No other entry's text changes.
18. That entry says the guards were re-pinned rather than kept, attributes the
    decision to Dkaattae on 2026-10-27, and names R.
19. That entry says that `sources.built_at`, and the fixtures as a whole, are
    outside what the guards pin, and that this is so a refresh moving only
    those does not turn the suite red.
20. That entry says the `top_crops` blind spot (T-068's reviewer) is closed.
21. That entry states the rule for a later task that changes pinned content.
    The task re-pins the affected values through a Test change request, and
    does not add an exception.
22. That entry names what re-pinning gave up: a pin no longer shows that
    content is unchanged since the task that wrote it (T-013, T-014, …). It
    shows only that content is unchanged since R.

**What must not happen**

23. Nothing outside these paths changes:
    - test files under `question-bank/src/` and `backend/tests/`
    - new non-test files under `question-bank/src/` that only tests import
    - `engineering-decisions.md`
    - this brief

    In particular, nothing changes under `question-bank/data/`,
    `question-bank/src/fixtures/`, `backend/app/` or `frontend/`, or in
    `openapi.yaml`, or in any `package.json`, `bun.lock`, `pyproject.toml` or
    `uv.lock`. No non-test source under `question-bank/src/` changes.
24. No new dependency.
25. At the branch head, with all six proxy variables set to
    `http://127.0.0.1:1`, these all pass in full:
    - `question-bank`: `bun test`, `bun run typecheck`, `bun run lint` and
      `bun run format:check`
    - `frontend`: `bun test`
    - `make -C backend test`

## Out of scope

- **A refresh that moves a real field.** `bun run refresh` writes nothing and
  exits 2 unless some field other than `built_at` moved (`src/refresh.ts:12-20`).
  So in practice, every refresh PR changes at least one pinned bank value, and
  the re-pinned guards will be red on it. Making guards tolerate field changes
  from a refresh is **not** this task (see Notes).
- **T-084** (`mul` labels and re-recording the fixture), **T-087**
  (regenerating the question file and served bank on refresh), and switching on
  the monthly routine.
- The "no unexpected key" allow-lists and the GitHub Action SHA pins.
- Merging redundant guards into one. It is allowed if the criteria still hold,
  but not required.
- Any change to bank data, fixtures, generated questions, `content.json`,
  source, the frontend or the backend app.
- Rewording test names or comments other than those criteria 8, 15 and 16
  require.

## Constraints

- **Files expected to change:** existing pinned guards, all through approved
  Test change request rows; possibly a new shared test helper or a new standing
  guard under `question-bank/src/`; and `engineering-decisions.md`.
- **The worker never edits an existing test** (D-14). It lists every one it
  makes stale under **Tests made stale**, naming the file, the describe and
  test, and the proposed delete or modify. Do this for every guard in the
  inventory below that criteria 1–16 require to change, even if the worker
  changes nothing else.
- **Adding `E-30` turns some pins red by design.** For example,
  `backend/tests/test_t089_tester_criteria.py:282` asserts
  `range(1, 30)`. Those rows are re-pins under criterion 7, not exceptions.
- **No dependency** without asking (`CLAUDE.md`).
- **No network in tests** (`CLAUDE.md`, `test-guidelines.md`).
- `process-decisions.md`, `process.md`, `CLAUDE.md` and `.claude/` are gated.
  Do not touch them.

## Context

Required reading:

- **The queue entry:** [`tasks.md`](../tasks.md) T-070. Read it in full. Each
  amendment names a guard and a neutralisation, and the Q1 answer is at its
  head.
- **Why `built_at` moves:** `question-bank/src/refresh.ts` (header, `:60`,
  `:300-360`), `question-bank/src/build.ts:150-157`, and
  `engineering-decisions.md` E-6.
- **The test-change rules:** `process-decisions.md` D-14 and D-15, and
  `.claude/agents/tester.md`.
- **Test guidance:** `test-guidelines.md`.
- **Earlier survey:** the first T-070 expander's survey, at commit `3cedfe8`
  (`git show 3cedfe8:tasks/T-070-digest-guards-and-build-stdout.md`).

**Inventory found by this survey.** It may be incomplete. The definition of
"pinned guard" above decides what is in scope.

| File | Pinned at | What it pins / neutralises |
|---|---|---|
| `question-bank/src/landmarks-verify.test.ts` | `e587ec1` | T-013 c9: `DEFAULT_BRANCH_DIGESTS` (truncated sha256 of 50 files and `index.json`). Before hashing it deletes `landmark`, `climate_kid` (except CO), `highest_point` (AK only), `region` and `top_livestock`, resets `top_crops`, and restores T-069/T-079 `highest_point_m`. `PINNED_BUILT_AT` test at `:422`; "region removal drops the key" test |
| `question-bank/src/climate-kid-verify.test.ts` | `13a735f` | T-014 c15: `BASELINE_DIGESTS`, with the same family of strips and restores (`:779-905`). `built_at` pin at `:723` |
| `question-bank/src/top-crops-verify.test.ts` | `eda7fde` | T-015 c13: resets `top_crops` to `[]`, strips AK `highest_point`, `region` and `top_livestock`, restores T-069. Neutralisation-proof tests; "built_at has not moved" |
| `question-bank/src/highest-point-verify.test.ts` | `284b8bc` | T-016 c5, c6, c10, c11: textual strips (`REGION_LINE`, `TOP_LIVESTOCK_BLOCK`) and T-069/T-079 restores. `built_at` pin at `:329`. Stale names (c9, c6, header) |
| `question-bank/src/highest-point-metres-verify.test.ts` | `e10f94d` | T-069 c11, c12: `T079_OVERRIDES` excused from "only unit-corrected states moved" |
| `question-bank/src/highest-point-in-state-verify.test.ts` | `323254c` | T-079 c5 (`MAIN_DIGESTS`, 47 files), c6, c17 and c18 (decisions log), c19 (**both fixtures byte-identical**), c20 (manifests) |
| `question-bank/src/refresh-routes-verify.test.ts` | `d71dd8a` | T-078 c13: parsed main fixture digest, without `regenerate_with` |
| `question-bank/src/hand-check-levels-verify.test.ts` | `aa88101` and later re-pins | T-025 c11 (`TEMPLATES`); c14 (`data/` **excluding `data/questions/`**, plus `src/fixtures/`); c15 (manifests); c16 (`E-n` range); c17 (test-file aggregate) |
| `question-bank/src/seed-level-loose-ends-verify.test.ts` | `41811f9` | T-086 c10 to c12: levels, weights, decisions log outside E-22, `E-n` count |
| `question-bank/src/climate-far-phrases-verify.test.ts` | `3279555` (c7 and c12 re-pinned at `5d72ca5`) | T-090 c7, c11, c12 (**`map_click` fields stripped**), c17 (manifests), c20 (trees) |
| `question-bank/src/map-click-no-candidates-verify.test.ts` | `5d72ca5` | T-092 `AT_MAIN`, c2 to c4, c8 to c12, c15 and c16 |
| `question-bank/src/t026-tester-verify.test.ts` | various | T-026 c4 (**`map_click` fields stripped**, `b5405bf7…`) |
| `question-bank/src/landmarks.test.ts:497`, `climate-kid.test.ts:572`, `state-animals.test.ts` (`PINNED_BUILT_AT`) | — | literal `built_at` pins (criterion 13) |
| `backend/tests/test_t026_tester_criteria.py` | `45b00d7` | served-questions digest |
| `backend/tests/test_t040_tester_criteria.py` | `aa88101` | archive `content.json` sha. The file never moves, so this is probably already compliant |
| `backend/tests/test_t051_tester_criteria.py` | `1032b77` | `MAIN_SERVED_DIGEST` |
| `backend/tests/test_t089_tester_criteria.py` | `2b4edb2` | `E-n` range 1..29 (`:282`), `test_selection.py` prefix, decisions-log prefix, `measure_selection.py` and its test |

## Handoff

**TL;DR.** I wrote `E-30`, added one shared helper (`bank-pins.ts`) that holds
all 51 bank pins at R = `b0ee336`, and added a new standing guard
(`bank-pins.test.ts`). I edited no existing test. Almost all of the task is
still to do: 57 rows of Test change request (W1–W57 below), which only
the tester may raise and only a person may approve (D-14, D-15). **Expect
`test changes requested` / `human`.** At the branch head, exactly two tests
are red, both listed below as stale: W45 and W53.

**R is `b0ee336`.** The branch has not been rebased. Up to my commits, it
differs from R only in `tasks/`, `runs/` and `tasks.md`.

### What I changed

- **`engineering-decisions.md`**: appended `## E-30`, the only new entry. No
  other entry's text changed. It covers c17–c22: re-pinned rather than kept,
  Dkaattae 2026-10-27, R named, `built_at` and the fixtures unpinned and why,
  the `top_crops` blind spot closed, the rule for later tasks, and what
  re-pinning gave up.
- **`question-bank/src/bank-pins.ts`** (new, non-test, imported only by tests):
  - `BANK_PINS_AT = "b0ee336"`.
  - `bankFileDigest(name, text)`: for `index.json`, the sha256 of its bytes.
    For a state file: parse it, delete `sources.built_at`, `JSON.stringify` it
    in its own key order, then sha256. **It throws if `built_at` is missing**,
    so the one allowed removal can never quietly do nothing.
  - `BANK_DIGESTS`: all 51 files, computed from
    `git show b0ee336:question-bank/data/us-states/<name>`. All 51 values are
    distinct.
- **`question-bank/src/bank-pins.test.ts`** (new, 64 tests):
  - the pin commit is R
  - the bank holds exactly the 51 pinned names
  - each of the 51 files digests to its pin
  - moving `built_at` alone leaves all 50 entity digests unchanged
  - a missing `built_at` throws
  - each c5 mutation, made in memory, moves the digest: IL `top_crops[0]`,
    CT `highest_point_m`, CO `landmark`, CO `climate_kid`, IL `region`,
    AK `highest_point`, the first state with non-empty `top_livestock` (`al`),
    CO `population`, and one `index.json` id
- **This brief**: Sessions row, Status, Next step, Handoff, Notes.

### Where each criterion lives now

| C | State at branch head | Where, or what is left |
|---|---|---|
| 1, 2 | **not yet** | W3, W6, W11, W17, W21, W29, W33 remove the T-069/T-079 restores and the strips and resets |
| 3 | **not yet** | W46 (the `omit` in `digestsOf`). Note: climate-far c7/c12 and t026 c4 strip nothing at runtime. Their pins were *computed* with the fields stripped, which at R is a no-op, so they already comply and their values equal R |
| 4 | **not yet** | W38, W40–W42, W44, W46–W47, plus everything under c1–c3. See flag F2 on what counts as an "exclusion" |
| 5, 6 | **done** for the new guard | `bank-pins.test.ts` hashes all 51 files whole except `built_at`. Every c5 mutation turns it red (checked in memory by its own tests; the tester does the tree mutations). c6 also needs every *remaining* whole-file guard to see `top_crops`, which W3/W6/W11 deliver |
| 7, 8 | **partly** | `BANK_DIGESTS` equals R and is labelled `b0ee336`. The re-pins in the W rows are not done |
| 9, 10 | **not yet** | On S(t₁) and S(t₂) at R, **120 bun tests fail**, the same 120 for both instants (list below). W1–W52 clear them. `bank-pins.test.ts` is green on both |
| 11 | **not yet** | On S(t₁), `make -C backend test` has **4 failures, none of them a pinned guard**. See W54–W57 and flag F1 |
| 12 | **not yet** | W36 (T-079 c19, both fixtures byte-pinned) and W37 (T-078 c13). W38 also hashes `src/fixtures` |
| 13 | **not yet** | W1, W5, W16, W20, W49–W51 |
| 14 | — | The deletions I propose are all class (i), (ii) or (iii), and each row names its class |
| 15, 16 | **not yet** | W24 (c15). W21 and W28 (c16) |
| 17–22 | **done** | `E-30` |
| 23 | holds | Only `engineering-decisions.md`, two new files under `question-bank/src/` and this brief changed |
| 24 | holds | No dependency |
| 25 | **red by design** | See "How to run" |

### Tests made stale

"Modify → helper" means: compare `bankFileDigest(name, raw)` with
`BANK_DIGESTS[name]` from `./bank-pins`, with no other strip, reset or
restore, and rename the test so it no longer claims a baseline it does not
check. **Each such test then pins R, so its label must say `b0ee336` (c8).**
The tester can instead re-pin in the guard's own hashing method; c7 allows
that as long as the value is R's, computed the same way. Using the helper
merges the pins into one table.

"Red now" means red at the branch head. "Red on S" means red on S(t₁) and
S(t₂) at R. "Green" rows are stale under c1–c4 or c16 and still pass.

**`question-bank/src/landmarks-verify.test.ts`** (pins at `e587ec1`)

| # | describe > test | Why | Proposal |
|---|---|---|---|
| W1 | T-013 tester, criterion 7 — … > sources.built_at is still the pinned capture instant in all 50 files | c13. Red on S | **Modify**: every file's `built_at` equals `new Date(<main fixture>._fixture.captured_at).toISOString()`. This keeps the test count, so no floor moves. Deleting it is class (iii), but then the floor rows in W10 need lowering |
| W2 | T-013 tester, criterion 9 — … > index.json is byte-identical to the default branch's | Green, and its value already equals R | Optional: point it at the helper, if `DEFAULT_BRANCH_DIGESTS` is removed |
| W3 | same describe > each of the 50 files, with landmark, climate_kid, top_crops and top_livestock removed, is identical to the default branch's | c1, c2, c4, c6. Red on S | **Modify → helper.** Remove `T069_…`, `T079_…` and `DEFAULT_BRANCH_DIGESTS`. The c7 rebuild test reads `Object.keys(DEFAULT_BRANCH_DIGESTS)`, so it needs `Object.keys(BANK_DIGESTS)`. **Keep `stateFiles()` on `readdirSync`**: `climate-kid-verify` c16 and `climate-kid.test.ts:747` assert that route |
| W4 | same > the region removal actually drops the key — otherwise the digest check proves nothing (T-017) | It only proves a neutralisation | **Delete**, class (ii) |

**`question-bank/src/climate-kid-verify.test.ts`** (pins at `13a735f`)

| # | describe > test | Why | Proposal |
|---|---|---|---|
| W5 | T-014 tester, criterion 12 — … > sources.built_at is still the pinned capture instant in all 50 files | c13. Red on S | Modify, as W1 |
| W6 | T-014 tester, criterion 15 — … > each of the 50 files, with climate_kid, top_crops and top_livestock removed, digests to the default branch's value | c1, c2, c4, c6. Red on S | **Modify → helper.** c12's `PATHS = Object.keys(BASELINE_DIGESTS)` needs the helper's keys |
| W7 | same > the region removal actually drops the key — … (T-017) | Neutralisation proof | **Delete**, class (ii) |
| W8 | same > 15d — index.json is byte-identical to the default branch's and mentions no climate_kid | Green, value equals R | Optional, as W2 |
| W9 | same > the digest check has teeth: a changed non-climate_kid field breaks it | It applies `delete parsed["climate_kid"]` (c4) | **Modify**: change `state_animal` alone and assert the helper digest differs from the pin |
| W10 | T-014 tester, criterion 19 — … > `landmarks-verify.test.ts still declares at least 35 tests and 69 expectations` (and the same row in `climate-kid.test.ts` T-014 criterion 19 `PINNED`) | A count floor. W1–W4 lower it: by my count about 34 tests and 66 expects if W1 is a modify and W4 a delete | **Modify**: set it to the recount after the edits. If W49–W51 are deletes rather than modifies, the floors for `landmarks.test.ts` (50/88) and `state-animals.test.ts` (40/73, and 40/70 in `landmarks-verify`) also drop by 1 test and 1 expect each, in `climate-kid-verify`, `climate-kid.test.ts`, `landmarks.test.ts` and `landmarks-verify.test.ts` |

**`question-bank/src/top-crops-verify.test.ts`** (pins at `eda7fde`)

| # | describe > test | Why | Proposal |
|---|---|---|---|
| W11 | T-015 tester, criterion 13 — nothing else in the bank moves > each of the 50 files, with top_crops put back to [], Alaska's highest_point line stripped, region removed and top_livestock removed, digests to the default branch's bytes | c1, c2, c6. Red on S | **Modify → helper.** Remove `withEmptyTopCrops`, `withoutAlaskaHighestPoint`, `withoutRegion`, `withoutTopLivestock`, `withDefaultBranchHighestPointM`, the T-069 table and `DEFAULT_BRANCH_DIGESTS` |
| W12 | same > the region removal actually drops the line — … (T-017) | Neutralisation proof | **Delete** (ii) |
| W13 | same > the restoration actually removes the crops — otherwise the digest check proves nothing | Neutralisation proof | **Delete** (ii) |
| W14 | same > the Alaska neutralisation actually removes the highest_point line — … (T-016 criterion 11) | Neutralisation proof | **Delete** (ii) |
| W15 | same > index.json is byte-identical to the default branch | Green, value equals R | Optional, as W2 |
| W16 | same > built_at has not moved in any of the 50 files | c13. Red on S | Modify, as W1, or delete (iii). This file has no count floor |

**`question-bank/src/highest-point-verify.test.ts`** (pins at `284b8bc`)

| # | describe > test | Why | Proposal |
|---|---|---|---|
| W17 | T-016 tester, criterion 5 — … > removing the highest_point line, reverting landmark, dropping region and dropping top_livestock reproduces the default branch's bytes exactly | c1, c2 (Alaska treated differently), c4. Red on S | **Modify → helper** for `us-state-ak.json`, and rename |
| W18 | same > that removal is real — the neutralised bytes differ and no longer carry the value | Neutralisation proof | **Delete** (ii) |
| W19 | same > the file on disk is not byte-identical to the default branch — the line really was added | Its only job is to show the neutralised comparison above is not trivially equal | **Delete** (ii). Tester to confirm the class. If not, a person decides under (iv) |
| W20 | same > highest_point_m is still 6190 and sources.built_at is still the fixture's pinned instant | c13. Red on S | **Modify**: keep the 6190 check (R's value). Drop the literal instant, or compare with the fixture's `captured_at`. Rename |
| W21 | describe "T-016 tester, criterion 6 — the other 49 files, index.json and the sample are untouched" and its test "each of the 49 non-Alaska state files matches … restored" | c16 ("the sample"). c1, c4 (the T-079 restore, `withoutRegion`, `withoutTopLivestock`). Red on S | **Modify**: rename the describe without "the sample", and point the test at the helper |
| W22 | same describe > the region removal actually drops the line — … (T-017) | Neutralisation proof | **Delete** (ii) |
| W23 | same describe > index.json is byte-identical to the default branch | Green, value equals R. Affected only by W21's rename | Optional, as W2 |
| W24 | describe "T-016 tester, criterion 9 — the full fixture build warns about nothing at all" | c15. Its own second test expects 3 warnings | **Modify**: rename only, e.g. "… warns about nothing but T-079's three overrides" |
| W25 | T-016 tester, criterion 10 — … > no guard strips highest_point unconditionally — every removal is gated on us-state-ak.json | After W3/W6/W11 it finds 0 removals, and `expect(gated).toBeGreaterThanOrEqual(3)` fails | **Modify**: assert that no guard strips `highest_point` at all (the removal list is `[]`). Deleting it as (ii) is the alternative |
| W26 | T-016 tester, criterion 11 — both neutralisation routes are proven real > its three tests (textual route, parsed route, "neutralising a non-Alaska file would change it too") | The brief names it as class (ii). The textual-route test is red on S | **Delete** (ii), all three |
| W27 | T-016 tester — the pins above are not vacuous > DEFAULT_BRANCH_DIGESTS covers exactly the 51 tracked paths / every pinned digest is a distinct 64-hex SHA-256 | They break if W17/W21 remove `DEFAULT_BRANCH_DIGESTS` | **Modify**: check `BANK_DIGESTS` instead. All 51 values are distinct 64-hex |
| W28 | file header comment (lines 18–27: "the other 51 paths", `284b8bc`) and the `DEFAULT_BRANCH_DIGESTS` comment (line 81: "`index.json` and the sample untouched") | c16. c8 too, once the pins move | **Modify** the comments |

**`question-bank/src/highest-point-metres-verify.test.ts`** (pins at `e10f94d`)

| # | describe > test | Why | Proposal |
|---|---|---|---|
| W29 | T-069 tester, criterion 11 — … > every state whose recorded unit is metre (and only metre) keeps main's highest_point_m bytes, except CT, OK, VA (T-079 overrides) | `T079_OVERRIDES` excludes files (c4) | **Modify**: re-pin `MAIN_AT_E10F94D`'s `line` values at R, which makes CT 727.2, OK 1516.4 and VA 1740.6. Drop the exclusion, and rename and relabel to R |
| W30 | same > the changed set is the non-metre states AZ, IA, KS, NE, OR plus the T-079 overrides CT, OK, VA | With R's lines the changed set is `[]` | **Modify**: assert changed = `[]` and keep the five-state `notMetre` assertion. Tester may judge it degenerate and propose (iv) instead |
| W31 | T-069 tester, criterion 12 — … > 51 tests `${name}: everything but the highest_point_m line digests to main's bytes` | Removes a line (c4) and hashes `built_at`. Red on S (all 50 state files) | **Modify → helper**, renamed. "the bank holds exactly main's 51 files" can use `BANK_DIGESTS`' keys |
| W32 | T-069 tester, criterion 15 — … > no non-test source under src/ holds a shipped highest_point_m value as code … | Not a pin. But it uses `MAIN_AT_E10F94D`'s `line` values as search terms, so W29 would silently drop the five old feet values | **Modify** only if W29 changes the table: keep the five e10f94d feet values (12622, 11237, 5429, 4039, 1670) as their own literal search list |

**`question-bank/src/highest-point-in-state-verify.test.ts`** (pins at `323254c`)

| # | describe > test | Why | Proposal |
|---|---|---|---|
| W33 | T-079 tester, criterion 4 — … > 3 tests `${file}: putting main's value back on that one line restores main's exact bytes` | Restores (c1, c4). Red on S | **Modify → helper** for CT, OK and VA. Keep the "the new line is present once" assertion. Rename |
| W34 | describe "T-079 tester, criterion 5 — the other 47 state files are byte-identical to 323254c" > 47 tests `${name} digests to main's value`, plus "there are exactly 47 of them" | Raw bytes including `built_at`. Red on S | **Modify → helper**, and relabel the describe to R |
| W35 | T-079 tester, criterion 6 — … > the other 47 keep main's bytes, label included (criterion 5's digests) | Same as W34. Red on S | **Modify → helper** |
| W36 | describe "T-079 tester, criterion 19 — both SPARQL fixtures are byte-identical to 323254c …" > tests `us-states.sparql.json`, `us-states-elevation.sparql.json` | c12. Red on S | **Delete**, class (i) |

**Other `question-bank/src/` files**

| # | file > describe > test | Why | Proposal |
|---|---|---|---|
| W37 | `refresh-routes-verify.test.ts` > T-078 tester — the fixture's regeneration note > criterion 13: apart from regenerate_with, the parsed fixture deep-equals the default branch's (d71dd8a) | c12. Red on S | **Delete**, class (i) |
| W38 | `hand-check-levels-verify.test.ts` > T-025 criteria 14-17 … > criterion 14: question-bank/data (outside T-040's data/questions/) and src/fixtures are byte-identical to aa88101 | It hashes the fixtures (c12), excludes `data/questions/` (c4, the brief's own example), and hashes `built_at`. Red on S | **Modify**: drop the fixtures half. Hash every file under `question-bank/data/` with no exclusion, using `bankFileDigest` for `data/us-states/*` and raw bytes for the rest. Re-pin at R, rename and relabel |
| W39 | same describe > criterion 17: every question-bank test file at aa88101 is present and unmodified | Any tester edit to one of those 48 files turns it red | **Modify last**: re-pin the aggregate at the branch head, after every other row (c7 exception) |
| W40 | `seed-level-loose-ends-verify.test.ts` > T-086 criteria 10-12 … > criterion 10: the 150 seeded levels by id equal 41811f9's | `TEMPLATES.slice(0, 3)` excludes questions on T-026's behalf (c4). Green | **Modify**: all of `TEMPLATES`, re-pinned at R (count and digest), renamed |
| W41 | same > criterion 10: LEVEL_SEED_WEIGHTS is deep-equal to 41811f9's | It deletes T-026's six `concept_load` keys before comparing (c4). Green | **Modify**: deep-equal the whole `LEVEL_SEED_WEIGHTS` as at R |
| W42 | same > criterion 12: engineering-decisions.md outside E-22's body, up to the first heading after E-23, is byte-identical to 41811f9's | The truncation at E-24 was added for T-040 (c4). Green | **Modify**: drop the truncation and pin at the branch head (E-30 included; c7 exception). Whether carving out E-22's own body is an "exclusion" too: see F2 |
| W43 | `climate-far-phrases-verify.test.ts` > T-090 criterion 12 … > every file under question-bank/data/us-states/ is byte-identical to 3279555 | Hashes `built_at`. Red on S | **Modify → helper** (or the same tree digest with `bankFileDigest`, re-pinned at R) |
| W44 | same describe > content.json: every non-climate, non-map_click question deep-equal to 3279555 | The non-`map_click` filter is T-051's exclusion (c4). Green | **Modify**: drop the `tpl-click-the-map` filter and re-pin at R |
| W45 | `map-click-no-candidates-verify.test.ts` > T-092 criterion 13 … > E-1..E-28 are byte-identical to 5d72ca5's, and there are still 29 E-n headings | **Red now**, because E-30 makes 30 headings | **Modify**: 30 headings, labelled as the branch head. The E-1..E-28 digest is unchanged |
| W46 | same file, helper `digestsOf` (`clickFields`), used by T-092 criterion 3 > the twelve fields, in order, hash to 5d72ca5's | `omit(q, [...CANDIDATE_KEYS, "level"])` strips `choices`/`correctIndex`/`choiceGeometryIds` from `us-states.json`'s `map_click` questions (c3). Green | **Modify**: omit only `"level"`. **The pin value does not change**: c1 asserts the keys are absent, so the strip was a no-op at R |
| W47 | same file, helper `baselineOf` (`clickRest`), used by T-092 criterion 9 test.each "bank %s …" | Same strip on the synthetic banks (c4). Green | **Modify**: drop the `omit`. Values are unchanged for the same reason (criterion 6 asserts it) |
| W48 | `t026-tester-verify.test.ts` > T-026 criteria 50-51 … > criterion 50: the committed entity files are byte-equal to main's (45b00d7) | Raw bytes including `built_at`. Red on S | **Modify → helper**, renamed |
| W49 | `landmarks.test.ts` > T-013 criterion 7 — the bank is built, not hand-edited > `sources.built_at is ${PINNED_BUILT_AT} in every tracked file` | c13. Red on S | Modify, as W1 (keeps the floors), or delete (iii) and do W10's floor rows |
| W50 | `climate-kid.test.ts` > T-014 criterion 12 — … > the same test | Same | Same |
| W51 | `state-animals.test.ts` > T-012 criterion 6 — … > the same test | Same | Same |
| W52 | `region-vocabulary.test.ts` > T-017 criterion 6 — each pinned-digest guard gained a region neutralisation > 8 tests: `${guard} neutralises region before hashing` and `${guard} proves its own region neutralisation is not a no-op`, for the four guards | They assert that the neutralisation exists. Red once W3/W6/W11/W21 land | **Delete**, class (ii) |

**`backend/tests/`**

| # | test | Why | Proposal |
|---|---|---|---|
| W53 | `test_t089_tester_criteria.py::test_criterion_13_exactly_one_new_entry_numbered_gap_free` | **Red now**: `range(1, 30)`, and E-30 exists | **Modify**: `range(1, 31)`, labelled as the branch head |
| W54 | `test_content_build.py::test_committed_content_json_is_what_the_loader_writes_from_committed_inputs` | Red on S(t₁) only. `content.json`'s `_source.extractedAt` is the newest bank `built_at` date (`backend/app/content_build.py:199-211`), and t₁ changes the date | See **F1**. Proposed **modify**: compare with `_source.extractedAt` removed from both sides |
| W55 | `test_t040_tester_criteria.py::test_c4_c5_the_committed_file_is_byte_for_byte_what_the_command_writes` | Same | Same |
| W56 | `test_t040_tester_criteria.py::test_c5_a_changed_input_field_would_be_caught` | Same (its first assert) | Same |
| W57 | `test_t051_tester_criteria.py::test_c6_committed_content_json_is_what_the_build_writes_and_repeats` | Same | Same |

(W2, W8, W15 and W23 are optional. W58 is reserved, in case the tester's
mutation run finds a guard I missed.)

**Pins I checked and left alone**, because they are green on S, compliant, and
their values equal R: T-079 c18 and c20; T-025 c11, c15 and c16; T-086 c11 and
c12 heading count; T-090 c7, c11, c12 (question-file digests), c13, c17, c19
and c20; T-092 c2–c4, c8–c12, c15 and c16; T-026 c4; backend t026 (old
templates), t040 (archive sha), t051 `MAIN_SERVED_DIGEST`, and t089 c13
prefix and c14. Under c8, an unchanged pin keeps its old label.

### The 120 failures on S(t₁) and S(t₂) at R

S(t) was applied to a clean worktree of R with a script that rewrites only
`_fixture.captured_at` in both fixtures and `sources.built_at` in the 50 files.
`git diff --stat` showed 52 files, each with 1 line changed. Both instants gave
the same 120:

- `highest-point-in-state-verify`: 53 (W33–W36)
- `highest-point-metres-verify`: 50 (W31)
- `highest-point-verify`: 4 (W17, W20, W21, W26's textual-route test)
- `landmarks-verify`: 2 (W1, W3)
- `climate-kid-verify`: 2 (W5, W6)
- `top-crops-verify`: 2 (W11, W16)
- 1 each in `climate-far-phrases-verify` (W43), `hand-check-levels-verify`
  (W38), `refresh-routes-verify` (W37), `t026-tester-verify` (W48),
  `landmarks.test.ts` (W49), `climate-kid.test.ts` (W50) and
  `state-animals.test.ts` (W51)

Backend on S(t₁): the 4 tests in W54–W57. S(t₂) keeps the same date, so the
backend is not at risk there.

### Flags, each with an owner

- **F1. c11 needs four backend tests changed that are not pinned guards.**
  - **The problem**: W54–W57 compare the committed `content.json` with a fresh
    render. A refresh that moves `built_at` to a new date moves
    `_source.extractedAt` in the render, but S(t) does not regenerate
    `content.json`, so they go red. c23 forbids touching `backend/app/`.
    Changing these tests is the only route to c11 green, and c4 does not
    govern them because they are not pinned guards. The inventory does not
    name them.
  - **The cost**: ignoring `extractedAt` lets a stale date in `content.json`
    through. That is the date a refresh moves, and T-087 owns regenerating
    `content.json` on refresh.
  - **Owner**: the tester raises the rows. Dkaattae approves or refuses. If
    refused, c11 cannot hold within c23, and the brief goes back to
    `task-expander`.
- **F2. What counts as an "exclusion" under c4.**
  - **My working line**: a filter or strip added so that a *later* task's
    change would not trip an older pin is a neutralisation. These are
    W38, W40–W42, W44 and W46–W47.
  - **What I left alone**: a guard that pins one named slice from its own
    criterion, such as "E-1..E-18 before E-19", "the old 150 questions",
    "E-26's text" or "outside E-22's body".
  - **The strict reading**: c4 read literally ("every other … exclusion")
    would also turn those slices into whole-content pins. Examples: T-086 c12
    (E-22's body), T-090 c11/c12 (non-climate), T-092 c16 (`backend/app`
    except `content_build.py`), T-026 c4 and backend t026/t051 (old formats
    only).
  - **Owner**: the tester decides at verification and names the reading it
    applied in the Verdict. A person settles it row by row in the Test change
    request. If they want the strict reading everywhere, add rows for those
    pins.
- **F3. Modify, not delete, for the literal-`built_at` tests (W1, W5, W16, W20,
  W49–W51).**
  - **What I propose**: compare `built_at` with the fixture's `captured_at`
    instead of deleting the test. c13 explicitly leaves that comparison
    unaffected, and it saves re-pinning the count floors in four files (W10).
  - **The alternative**: deletion is class (iii) and also allowed.
  - **Owner**: the tester proposes; a person approves.
- **F4. W30 degenerates.** Against R, "the changed set" is always empty.
  **Owner**: the tester, choosing between modify and (iv) delete.

### What I did not do

- **No existing test edited** (D-14). Every edit criteria 1–16 need is a W row.
- **I did not prototype the re-pinned values** (the R values for W38, W40–W42
  and W44) for the tester. Computing them independently is part of the
  verification. The only R values I supply are `BANK_DIGESTS`, which my own
  tests check against the tree.
- **No bank, fixture, source or `content.json` change**, and nothing in
  `frontend/`.

### How to run

```bash
cd question-bank && bun test src/bank-pins.test.ts     # 64 pass
cd question-bank && bun test                            # 2512 pass, 1 fail (W45)
make -C backend test                                    # 738 pass, 1 fail (W53)
cd question-bank && bun run typecheck && bun run lint && bun run format:check   # all clean
```

- **Full run**: all of the above was run with the six proxy variables set to
  `http://127.0.0.1:1`.
- **Frontend could not be checked here.** `frontend/bun test` fails 5 and
  errors 4. The cause is that `frontend/node_modules` is absent:
  `bun install --frozen-lockfile` gets a 403 from the sandbox proxy on
  `europe-west1-npm.pkg.dev`. The failures are `Cannot find module
  'react/jsx-runtime'` and the lint/format gate tests. This task changes
  nothing under `frontend/`.
- **Side effect, reverted**: one of those frontend tests rewrote
  `frontend/README.md` (`*` escaped as `\*`) when run without `node_modules`.
  I reverted it, and it is not committed.
- **Re-running S(t)**: apply it to a fresh worktree of the branch head, then
  run the suites there. All W rows must have landed for it to go green.

## Verdict

**TL;DR. Pass.** Dkaattae approved all 58 rows in this attended session; I
applied exactly those rows (`83aadd6`) and every criterion now holds. The suite
is green at the branch head and on both simulated refreshes, and CI is green on
`83aadd6`. **Next: `reviewer`.**

- **Independence: a separate session.** This tester is
  `cse_011oDiJdsZFzW3GaxRfDpUmx`, not the expander's and worker's
  `cse_011oDiJcaEvyueGBAthPSQu3`. I did not see the worker's reasoning.
- **Approval, quoted from this session.** Asked which rows to apply, Dkaattae
  chose **"All 58 as written"**. On F2, Dkaattae chose **"Narrow (as raised)"**.
  The header reads `Test changes: approved — Dkaattae, 2026-10-29`, and every row
  has `approved` in its Decision column. Dkaattae started the session with
  "you are the tester for T070, fix ci".
- **R stays `b0ee336`.** The branch was not rebased.

### Criteria

| C | Verdict | Evidence |
|---|---|---|
| 1 | pass | `grep` for `T069_…`/`T079_DEFAULT_BRANCH_HIGHEST_POINT_M` under `question-bank/src` and `backend/tests`: no hits. No guard writes `highest_point_m` back |
| 2 | pass | No `delete parsed["landmark"/"climate_kid"/"region"/"top_livestock"/"highest_point"]`, no `["top_crops"] = []`, no `withoutRegion`/`withoutTopLivestock`/`withEmptyTopCrops`/`withoutAlaskaHighestPoint`/`withDefaultBranchHighestPointM` in any test. CO and AK go through `bankFileDigest` like the other 48 |
| 3 | pass | `digestsOf` omits only `level` (W46); `baselineOf` omits nothing (W47). Pins unchanged, as predicted |
| 4 | pass, narrow F2 reading | Every bank guard strips only `built_at`, through `bankFileDigest`. T-025 c14's `data/questions/` exclusion is gone (W38), along with T-086's `slice(0, 3)`, `concept_load` deletes and E-24 truncation (W40–W42), and T-051's `map_click` filter (W44). Slices a guard's own criterion named stay, as Dkaattae chose |
| 5 | pass | 9 single edits in a worktree of the head, each `git diff --numstat` = 1 line, reverted after each. Every one turned guards red: IL `top_crops[0]`, CT `highest_point_m`, CO `landmark`, CO `climate_kid`, IL `region`, AK `highest_point`, AL `top_livestock[0]`, CO `population`, `index.json` id. Each turned 7–14 guard tests red |
| 6 | pass | IL `top_crops[0]` alone turned red **every** whole-bank guard: T-013 c9, T-014 c15, T-015 c13, T-016 c6, T-069 c12, T-079 c5 and c6, T-090 c12, T-025 c14, T-026 c50 and `bank-pins.test.ts` |
| 7 | pass | R values computed by me from `b0ee336`, not from the head. W38 used `git show b0ee336:` for all 52 data files (`7760ab89…`). W40/W41 came from a `git worktree` of `b0ee336`: 415 levels, `a3a28b64…`, and the full `LEVEL_SEED_WEIGHTS`. W44 used `git show b0ee336:backend/app/data/content.json` (365 non-climate questions, `5533329a…`). W29 has the 51 `highest_point_m` lines at `b0ee336`. Pins at the head (c7 exception): W42 `e487a481…`, checked a second time in Python; W39 `e82de501…`, computed in Python; W45 is 30 headings; W53 is `range(1, 31)` |
| 8 | pass | Every changed pin's name or comment says `b0ee336` or "branch head". No changed pin still cites `e587ec1`, `13a735f`, `eda7fde`, `284b8bc`, `e10f94d`, `323254c`, `d71dd8a`, `aa88101`, `41811f9`, `3279555`, `45b00d7` or `2b4edb2` as its value's source. Unchanged pins (W45's E-1..E-28 digest, for example) keep their label |
| 9 | pass | S(t₁) in a worktree of the head, with 52 files at +52 −52: `bun test` 2491 pass, 0 fail |
| 10 | pass | S(t₂), same: 2491 pass, 0 fail |
| 11 | pass | S(t₁): `make -C backend test` 739 passed, 9 skipped |
| 12 | pass | W36 and W37 deleted; W38's fixtures half removed. No test hashes or deep-equals either SPARQL fixture |
| 13 | pass | No assertion of a literal `built_at`/`captured_at`. `fun-facts.test.ts:338/356` pass the instant as a build *input*, not as an assertion |
| 14 | pass | 22 tests deleted, all approved, each in its class. (i): W36 (2), W37 (1). (ii): W4, W7, W12, W13, W14, W18, W19, W22 (1 each), W26 (3), W52 (8). No class (iii) or (iv) deletions. 2513 − 22 = 2491 |
| 15 | pass | The describe now reads "… warns about nothing but T-079's three overrides" |
| 16 | pass | No "other 51" or "the sample" left in `highest-point-verify.test.ts` |
| 17–22 | pass | E-30 is unchanged since the earlier pass, which checked it (below) |
| 23 | pass | `git diff --name-only b0ee336..HEAD` lists only test files, `bank-pins.ts`, `engineering-decisions.md`, `tasks/`, `runs/` and `tasks.md` |
| 24 | pass | No manifest or lockfile in the diff |
| 25 | pass | All six proxies set to `127.0.0.1:1`. `question-bank`: `bun test` 2491/0; `typecheck`, `lint` and `format:check` clean. Backend: 739 passed, 9 skipped. **Frontend: not runnable here.** `bun install` gets a 403 from the sandbox proxy on `react-simple-maps`. The CI job "frontend (typecheck, lint, test)" passed on `83aadd6`, and so did the other five jobs |

### What I changed, and what I did not

- **One commit of test edits, `83aadd6`.** It applies exactly rows W1–W57,
  W10a and W10b. Edits that follow from an approved row:
  - **Dead helpers removed**: `canonical` (W37), `manifestSha` (W38), and the
    `createHash` imports the rows left unused. Lint requires it.
  - **Comments**: one comment in `region-vocabulary.test.ts` notes that
    criterion 6's tests went with W52.
  - **Formatting**: `bun run format` touched only the files I edited.
- **Floors (W10a/W10b) dropped by exactly the approved removals.**
  `landmarks-verify.test.ts` went from 35/70 to 34/66 by count: W4 removed
  1 test and 2 `expect(`, and W3 removed 2 `expect(`. The floor moves
  35/69 → 34/65. The other floors did not move, because W1 and W49–W51 kept one
  `expect` each.
- **No source, data, fixture or `content.json` touched.** Every mutation and
  both S(t) runs happened in throwaway worktrees, which are removed. The main
  tree's `git status` is clean.

### Notes for the reviewer

- **W54–W57 weaken four backend drift checks**, as F1 says and as approved.
  `_source.extractedAt` is no longer compared, though each test still requires
  it to be a `YYYY-MM-DD` date. A stale date would pass. T-087 owns
  regenerating `content.json` on refresh.
- **Unchanged since the expander's Notes**: a real `bun run refresh` moves more
  than `built_at`, so these guards will be red on it. T-095 is the follow-on.

### Earlier pass, 2026-10-28 (orchestrated, halted at `test changes requested`)

**TL;DR. Not yet verdictable: halted at `test changes requested` / `human`, as
the brief predicted.** The worker's part (E-30, `bank-pins.ts`, `bank-pins.test.ts`)
checks out independently. Criteria 1–4, 6–16 and 25 can only hold once the 58
rows below are applied, and only a person may approve them, in an attended
tester session (D-15). Nothing under test was edited.

- **Independence: weaker than a separate session.** This is an orchestrated run
  (`runs/T-070-repin-digest-guards.md` exists), so my session id
  (`cse_011oDiJcaEvyueGBAthPSQu3`) matches the worker's and the expander's. That
  match proves nothing either way. My independence rests only on being a
  freshly spawned subagent with its own context: I did not watch the work, and
  I could not see the worker's reasoning. That rests on the orchestrator having
  spawned me correctly, which I cannot check myself.
- **Next: a person starts a `tester` step in a session they attend.** That
  tester re-checks the rows below against the branch, asks for each row's
  decision, applies the approved rows, then reruns everything here.
- **Two decisions are yours, not the tester's**: rows W54–W57 (F1, criterion 11
  vs. weakening the backend drift checks), and which reading of criterion 4
  applies (F2, below).

#### What I verified, independently of the Handoff

| C | State at branch head `cc42a03` | Evidence |
|---|---|---|
| 1–4 | **not met yet**, all by W rows | Neutralisations still present in `landmarks-verify`, `climate-kid-verify`, `top-crops-verify`, `highest-point-verify`, `highest-point-metres-verify` (grep for `delete parsed`, `"top_crops"] = []`, `T069_`/`T079_`, `withoutRegion`, `T079_OVERRIDES`), `region-vocabulary`, and the c4 exclusions in W38, W40–W42, W44, W46–W47 |
| 5 | **met** by the new guard | Each of the 9 single edits made *in the tree* (`git diff --numstat` = 1 line each, reverted after each): IL `top_crops[0]` → `wheat`, CT `highest_point_m` → 728.2, CO `landmark`, CO `climate_kid`, IL `region` → `Midwest`, AK `highest_point` → `Denali`, AL `top_livestock[0]`, CO `population` + 1, `index.json` id `us-state-ak` → `us-state-zz`. Every one turned `bank-pins.test.ts` red (the file's own pin test, plus the `built_at`-move test for entity files). |
| 6 | **not met yet** | IL `top_crops[0]` alone, whole suite: 53 red, but **not** `T-013 tester c9 "each of the 50 files…"`, `T-014 tester c15 "each of the 50 files…"` or `T-015 tester c13 "each of the 50 files…"`. The blind spot is real and is closed only by W3, W6, W11 |
| 7 | **partly** | `BANK_DIGESTS` recomputed by me from `git show b0ee336:…` with my own script (Python: parse, delete `sources.built_at`, compact re-serialise, sha256; raw sha256 for `index.json`): 51/51 match, 0 mismatches. The other pins wait on rows |
| 8 | **partly** | `BANK_PINS_AT = "b0ee336"`; rest waits on rows |
| 9, 10 | **not met yet** | My own S(t) script on fresh worktrees of `cc42a03` (52 files changed, 1 line each): S(t₁) and S(t₂) give **121 failures, the identical list for both**: the Handoff's 120 plus W45. The per-file split matches the Handoff exactly |
| 11 | **not met yet** | S(t₁): `make -C backend test` 5 failed: W53 plus the four `content.json` drift checks W54–W57 (F1) |
| 12 | **not met yet** | W36, W37, and the fixtures half of W38 |
| 13 | **not met yet** | Literal `2026-08-04T16:05:35.000Z` asserted in 7 tests (W1, W5, W16, W20, W49–W51). `fun-facts.test.ts:338/356` and `highest-point-metres.test.ts:303` use literal instants as *inputs* to synthetic builds, not as assertions about committed content, so they are not in scope |
| 14 | pending | Every deletion row below is class (i), (ii) or (iii), and says which |
| 15, 16 | **not met yet** | W24; W21, W28 |
| 17 | **met** | `git diff b0ee336..HEAD -- engineering-decisions.md` has no `-` lines; 30 `## E-` headings, the new one is E-30 |
| 18–22 | **met** | E-30: re-pinned not kept, Dkaattae 2026-10-27, names `b0ee336` (18); `built_at` and both fixtures outside the pins, so a refresh moving only those is not red (19); `top_crops` blind spot (T-068's reviewer) closed (20); later task re-pins through a Test change request, adds no exception (21); pins now show unchanged since R, not since the writing task (22) |
| 23 | **holds so far** | Changed since R: `engineering-decisions.md`, `question-bank/src/bank-pins.ts` (non-test, imported only by `bank-pins.test.ts`, checked with grep), `bank-pins.test.ts`, this brief. Also `runs/T-070-…md` and the one-line `tasks.md` status flip by the expander, both loop bookkeeping |
| 24 | **holds** | No manifest or lockfile in the diff |
| 25 | **red, by design** | Proxies set to `http://127.0.0.1:1`. `question-bank`: `bun test` 2512 pass / 1 fail (W45); typecheck, lint, format:check clean. Backend: 738 pass / 1 fail (W53) / 9 skipped. Frontend: 392 pass / 4 fail / 4 errors, all `Cannot find package 'react-simple-maps'` (incomplete `frontend/node_modules` in this sandbox). The task changes nothing under `frontend/`, so I read this as environmental, but **c25's frontend leg is unverified here** |

`bank-pins.test.ts` is honest: no network, no fixture touched, and the pins are
literal values that match R as I computed them myself. A mutation of
`bankFileDigest` that strips any more than `built_at` would fail 50 pin tests,
because my recomputation strips only `built_at`.

#### Readings I applied, for you to confirm or overrule

- **F2: what counts as an "exclusion" under criterion 4.** I applied the
  worker's narrower reading. An exclusion is a filter, strip or truncation
  **added later on another task's behalf** so an older pin still holds (T-040's
  `data/questions/` carve-out, T-040's truncation at E-24, T-026's
  `TEMPLATES.slice(0, 3)` and `concept_load` deletes, T-051's `map_click`
  filter, T-092's candidate-key `omit`). A guard that pins one slice its **own**
  criterion named (T-086 c12 "outside E-22's body", T-090 c11/c12
  "non-climate", T-092 c13 "E-1..E-28", T-092 c16 `backend/app` except
  `content_build.py`, T-026 c4 "the old 150") is not changed, and has no row.
  The strict reading of c4's literal wording ("every other … exclusion") would
  turn each of those into a whole-content pin. If you want that, say so, and the
  attended tester adds those rows. I think the literal wording is genuinely
  ambiguous here, and that is your call, not mine.
- **F3: the literal-`built_at` tests are modified, not deleted.** Deletion
  (class iii) is allowed. Modifying them to compare with the fixture's
  `captured_at` keeps a real check that c13 explicitly leaves alone, and keeps
  the count floors in four files unmoved.
- **F4 (W30): modify, not delete.** "The changed set is `[]`" is degenerate but
  still a real check that no metre-unit state's line differs from R.
- **W19 is class (ii).** Its only job is to show the neutralised AK comparison
  was not trivially equal. With no neutralisation, it has nothing left to prove.

#### What I did not do

- **No existing test edited or deleted**, and no source touched. All changes
  wait for approval.
- **I did not compute the new R values** for W29, W38, W40, W41, W42, W44, W39
  or W53. The tester that applies the rows computes each at `b0ee336`, or at the
  branch head where c7 allows, the same way the guard computes it.
- **Every mutation and S(t) worktree was reverted or removed.** `git status` is
  clean apart from this brief.

## Test change request

Raised by `tester`, 2026-10-28, orchestrated run, so **no row is approved**. R is
`b0ee336`. "**→ helper**" means: compare `bankFileDigest(name, raw)` with
`BANK_DIGESTS[name]` from `./bank-pins` (pinned at `b0ee336`), with no other
strip, reset or restore. The test's name and comments drop any claim about an
older baseline and say `b0ee336`. "Introduced": `git log -S` mostly lands on
`505cfe9` (T-071's formatting pass rewrote those lines), so the task that wrote
each guard is named from its describe.

**Order when applying:** every row except W10a/W10b and W39, then the two floor
rows, then **W39 last** (it pins the aggregate digest of 48 test files that the
other rows edit).

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| W1 | `question-bank/src/landmarks-verify.test.ts` › T-013 tester, criterion 7 — the bank is built, not hand-edited › "sources.built_at is still the pinned capture instant in all 50 files" | T-013 tester (last rewritten `505cfe9`); pinned `built_at` literal | c13; red on S(t₁), S(t₂) | modify | "sources.built_at equals the main fixture's captured_at in all 50 files": for each state file, `built_at === new Date(<us-states.sparql.json>._fixture.captured_at).toISOString()`. Same one `expect` per file. `PINNED_BUILT_AT` constant removed || approved |
| W2 | same file › T-013 tester, criterion 9 — … › "index.json is byte-identical to the default branch's" | T-013 tester; `index.json` bytes at `e587ec1` | Only so `DEFAULT_BRANCH_DIGESTS` can go (W3). Value is unchanged | modify | "index.json is byte-identical to b0ee336's": raw sha256 equals `BANK_DIGESTS["index.json"]` || approved |
| W3 | same describe › "each of the 50 files, with landmark, climate_kid, top_crops and top_livestock removed, is identical to the default branch's" | T-013 tester c9; pins at `e587ec1` with strips | c1, c2, c4, c6; red on S | modify | "each of the 50 state files digests to its b0ee336 pin, built_at aside" → helper, one `expect` per file. Remove `T069_…`, `T079_…` (and their two CT `expect`s) and `DEFAULT_BRANCH_DIGESTS`. The c7 rebuild test's path list switches to `Object.keys(BANK_DIGESTS)`. `stateFiles()` stays on `readdirSync` (climate-kid-verify c16 and `climate-kid.test.ts:747` check that route). Header comment (lines ~18–27) updated to name `b0ee336` || approved |
| W4 | same describe › "the region removal actually drops the key — otherwise the digest check proves nothing (T-017)" | T-017 addition to T-013 tester | Proves a neutralisation only | delete (ii) | — || approved |
| W5 | `climate-kid-verify.test.ts` › T-014 tester, criterion 12 — … › "sources.built_at is still the pinned capture instant in all 50 files" | T-014 tester; literal `built_at` | c13; red on S | modify | as W1 || approved |
| W6 | same file › T-014 tester, criterion 15 — nothing but climate_kid moves in the bank › "each of the 50 files, with climate_kid, top_crops and top_livestock removed, digests to the default branch's value" | T-014 tester c15; `BASELINE_DIGESTS` at `13a735f` with strips | c1, c2, c4, c6; red on S | modify | "each of the 50 state files digests to its b0ee336 pin, built_at aside" → helper. Remove `T069_…`, `T079_…`, `BASELINE_DIGESTS`; c12's `PATHS` switches to `Object.keys(BANK_DIGESTS)` || approved |
| W7 | same describe › "the region removal actually drops the key — otherwise the digest check proves nothing (T-017)" | T-017 addition | Proves a neutralisation only | delete (ii) | — || approved |
| W8 | same describe › "15d — index.json is byte-identical to the default branch's and mentions no climate_kid" | T-014 tester | Only so `BASELINE_DIGESTS` can go. Value unchanged | modify | same name with "b0ee336's"; raw sha256 equals `BANK_DIGESTS["index.json"]`; keeps the "no climate_kid" check || approved |
| W9 | same describe › "the digest check has teeth: a changed non-climate_kid field breaks it" | T-014 tester | Applies `delete parsed["climate_kid"]` (c4) | modify | "the digest check has teeth: a changed state_animal breaks it": change `state_animal` in CO's parsed file, re-serialise, assert `bankFileDigest` ≠ `BANK_DIGESTS["us-state-co.json"]`. No strip || approved |
| W10a | `climate-kid-verify.test.ts` › T-014 tester, criterion 19 — nothing already verified is weakened › "landmarks-verify.test.ts still declares at least 35 tests and 69 expectations" | `2def022`, T-064 row 39; floor for `landmarks-verify.test.ts` | W4 deletes 1 test and 2 `expect(`; W3 drops the 2 CT restore `expect(` | modify | floor 35/69 → **34/65**, exactly the approved removals from that file. Comment cites T-070 rows W3, W4. Only if W3 and W4 are approved as written; otherwise lower by what was approved || approved |
| W10b | `climate-kid.test.ts` › T-014 criterion 19 — … › "landmarks-verify.test.ts still declares at least its 35 tests and 69 expectations" | `2def022`, T-064 row 39 | as W10a | modify | as W10a: 35/69 → 34/65 || approved |
| W11 | `top-crops-verify.test.ts` › T-015 tester, criterion 13 — nothing else in the bank moves › "each of the 50 files, with top_crops put back to [], Alaska's highest_point line stripped, region removed and top_livestock removed, digests to the default branch's bytes" | T-015 tester c13; pins at `eda7fde` | c1, c2, c6; red on S | modify | "each of the 50 state files digests to its b0ee336 pin, built_at aside" → helper. Remove `withEmptyTopCrops`, `withoutAlaskaHighestPoint`, `withoutRegion`, `withoutTopLivestock`, `withDefaultBranchHighestPointM`, the T-069 table, `DEFAULT_BRANCH_DIGESTS` || approved |
| W12 | same describe › "the region removal actually drops the line — …(T-017)" | T-017 addition | neutralisation proof | delete (ii) | — || approved |
| W13 | same › "the restoration actually removes the crops — otherwise the digest check proves nothing" | T-015 tester | neutralisation proof | delete (ii) | — || approved |
| W14 | same › "the Alaska neutralisation actually removes the highest_point line — … (T-016 criterion 11)" | T-016 tester | neutralisation proof | delete (ii) | — || approved |
| W15 | same › "index.json is byte-identical to the default branch" | T-015 tester | Only so `DEFAULT_BRANCH_DIGESTS` can go | modify | "… to b0ee336's" against `BANK_DIGESTS["index.json"]` || approved |
| W16 | same › "built_at has not moved in any of the 50 files" | T-015 tester; literal `built_at` | c13; red on S | modify | "built_at equals the main fixture's captured_at in all 50 files", as W1 || approved |
| W17 | `highest-point-verify.test.ts` › T-016 tester, criterion 5 — us-state-ak.json gains one line and nothing else › "removing the highest_point line, reverting landmark, dropping region and dropping top_livestock reproduces the default branch's bytes exactly" | T-016 tester c5; `284b8bc` | c1, c2 (Alaska singled out), c4; red on S | modify | "us-state-ak.json digests to its b0ee336 pin, built_at aside" → helper for AK only || approved |
| W18 | same describe › "that removal is real — the neutralised bytes differ and no longer carry the value" | T-016 tester | neutralisation proof | delete (ii) | — || approved |
| W19 | same › "the file on disk is not byte-identical to the default branch — the line really was added" | T-016 tester | Only shows the neutralised comparison above was not trivial | delete (ii) | — || approved |
| W20 | same › "highest_point_m is still 6190 and sources.built_at is still the fixture's pinned instant" | T-016 tester | c13; red on S | modify | "highest_point_m is still 6190 and sources.built_at equals the fixture's captured_at": keeps `toBe(6190)`; `built_at === new Date(fixture._fixture.captured_at).toISOString()` || approved |
| W21 | describe "T-016 tester, criterion 6 — the other 49 files, index.json and the sample are untouched" › "each of the 49 non-Alaska state files matches the default branch once T-017's region line and T-068's top_livestock line are dropped, and T-079's three highest_point_m lines restored" | T-016 tester c6 | c16 ("the sample"), c1, c4; red on S | modify | describe "T-016 tester, criterion 6 — the other 49 state files and index.json match b0ee336"; test "each of the 49 non-Alaska state files digests to its b0ee336 pin, built_at aside" → helper. Remove `withoutRegion`, `withoutTopLivestock`, the T-069/T-079 restores, `DEFAULT_BRANCH_DIGESTS` || approved |
| W22 | same describe › "the region removal actually drops the line — … (T-017)" | T-017 addition | neutralisation proof | delete (ii) | — || approved |
| W23 | same describe › "index.json is byte-identical to the default branch" | T-016 tester | Only so `DEFAULT_BRANCH_DIGESTS` can go | modify | "… to b0ee336's" against `BANK_DIGESTS["index.json"]` || approved |
| W24 | describe "T-016 tester, criterion 9 — the full fixture build warns about nothing at all" | T-016 tester | c15; its own second test expects 3 warnings | modify | rename the describe only, e.g. "T-016 tester, criterion 9 — the full fixture build warns about nothing but T-079's three overrides". Tests inside unchanged || approved |
| W25 | › T-016 tester, criterion 10 — … › "no guard strips highest_point unconditionally — every removal is gated on us-state-ak.json" | T-016 tester | After W3/W6/W11 it finds 0 removals and `toBeGreaterThanOrEqual(3)` fails | modify | "no guard strips highest_point before comparing": the same scan of the guard files finds no `highest_point` removal at all (`toEqual([])`) || approved |
| W26 | describe "T-016 tester, criterion 11 — both neutralisation routes are proven real", all three tests (textual route, parsed route, "neutralising a non-Alaska file would change it too") | T-016 tester c11, named by the brief | c14(ii) names it; textual route red on S | delete (ii), all 3 | — || approved |
| W27 | › "T-016 tester — the pins above are not vacuous" › "DEFAULT_BRANCH_DIGESTS covers exactly the 51 tracked paths" and "every pinned digest is a distinct 64-hex SHA-256" | `2def022`, T-064 | Break once W17/W21 remove `DEFAULT_BRANCH_DIGESTS` | modify | same assertions over `BANK_DIGESTS`: exactly the 51 tracked names; every value distinct and `/^[0-9a-f]{64}$/` || approved |
| W28 | file header comment (lines 18–27: "the other 51 paths", `284b8bc`) and the `DEFAULT_BRANCH_DIGESTS` comment (~line 81: "index.json and the sample untouched") | T-016 tester | c16; c8 | modify | comments say the bank is pinned at `b0ee336` through `bank-pins.ts`; no "other 51 paths", no "sample" || approved |
| W29 | `highest-point-metres-verify.test.ts` › T-069 tester, criterion 11 — … › "every state whose recorded unit is metre (and only metre) keeps main's highest_point_m bytes, except CT, OK, VA (T-079 overrides)" | `cd2dc04`, T-079 apply; T-069 c11 | `T079_OVERRIDES` excludes files (c4) | modify | "every state whose recorded unit is metre keeps b0ee336's highest_point_m line": `MAIN_AT_E10F94D` renamed and re-pinned to each file's `highest_point_m` line at `b0ee336` (CT 727.2, OK 1516.4, VA 1740.6), no `T079_OVERRIDES` exclusion || approved |
| W30 | same › "the changed set is the non-metre states AZ, IA, KS, NE, OR plus the T-079 overrides CT, OK, VA" | `cd2dc04` | With R's lines the changed set is `[]` | modify | "no state's highest_point_m line differs from b0ee336": changed set `toEqual([])`; keeps the five-state `notMetre` assertion as is || approved |
| W31 | same file › T-069 tester, criterion 12 — nothing else in the bank moved › 51 tests "${name}: everything but the highest_point_m line digests to main's bytes" (and the "the bank holds exactly main's 51 files" test) | `1386de3`, T-069 tester | Removes a line (c4), hashes `built_at`; red on S | modify | "${name} digests to its b0ee336 pin, built_at aside" → helper, 51 tests; the file-set test uses `Object.keys(BANK_DIGESTS)` || approved |
| W32 | same file › T-069 tester, criterion 15 — … › "no non-test source under src/ holds a shipped highest_point_m value as code …" | `1386de3` | Its search set is every `MAIN_AT_E10F94D` line plus every shipped value. W29 would silently drop the e10f94d values that differ from R | modify | search set = every currently shipped `highest_point_m` value, plus a literal list of the e10f94d values W29 drops: 12622, 11237, 5429, 4039, 1670 (AZ, OR, NE, KS, IA feet) and 748, 1737, 1825 (CT, OK, VA). Same walk, same exception for the three curated overrides. The attended tester confirms the list against `MAIN_AT_E10F94D` before editing || approved |
| W33 | `highest-point-in-state-verify.test.ts` › T-079 tester, criterion 4 — in CT, OK and VA only the highest_point_m line moved › 3 tests "${file}: putting main's value back on that one line restores main's exact bytes" | `2a1202d`, T-079 tester | Restores (c1, c4); red on S | modify | "${file} digests to its b0ee336 pin, built_at aside" → helper, keeping "the new line is present once" || approved |
| W34 | describe "T-079 tester, criterion 5 — the other 47 state files are byte-identical to 323254c" › 47 tests "${name} digests to main's value" and "there are exactly 47 of them" | `2a1202d` | raw bytes incl. `built_at`; red on S | modify | describe "… the other 47 state files match b0ee336, built_at aside" → helper; the count test still asserts 47 || approved |
| W35 | › T-079 tester, criterion 6 — … › "the other 47 keep main's bytes, label included (criterion 5's digests)" | `2a1202d` | same; red on S | modify | → helper, name says b0ee336 || approved |
| W36 | describe "T-079 tester, criterion 19 — both SPARQL fixtures are byte-identical to 323254c …" › `us-states.sparql.json`, `us-states-elevation.sparql.json` | `2a1202d` | c12; red on S | delete (i), both | — || approved |
| W37 | `refresh-routes-verify.test.ts` › T-078 tester — the fixture's regeneration note › "criterion 13: apart from regenerate_with, the parsed fixture deep-equals the default branch's (d71dd8a)" | `179fa2c`, T-078 tester | c12; red on S | delete (i) | — || approved |
| W38 | `hand-check-levels-verify.test.ts` › T-025 criteria 14-17 … › "criterion 14: question-bank/data (outside T-040's data/questions/) and src/fixtures are byte-identical to aa88101" | `236b0e0`, T-025 tester | hashes fixtures (c12), excludes `data/questions/` (c4, the brief's own example), hashes `built_at`; red on S | modify | "criterion 14: question-bank/data is unchanged since b0ee336, built_at aside": one digest over every tracked file under `question-bank/data/`, no exclusion, `bankFileDigest` for `data/us-states/*`, raw bytes for the rest; re-pinned at `b0ee336`. Fixtures half removed || approved |
| W39 | same describe › "criterion 17: every question-bank test file at aa88101 is present and unmodified" | `236b0e0` | Any approved edit to those 48 files turns it red | modify (**last**) | same 48 names and presence checks; aggregate digest re-pinned at the branch head after every other approved row, comment citing T-070 (c7 exception) || approved |
| W40 | `seed-level-loose-ends-verify.test.ts` › T-086 criteria 10-12 › "criterion 10: the 150 seeded levels by id equal 41811f9's" | `4009ee5`, T-086 tester | `TEMPLATES.slice(0, 3)` excludes on T-026's behalf (c4) | modify | "criterion 10: the seeded levels by id, over all TEMPLATES, equal b0ee336's": count and digest re-pinned at `b0ee336` || approved |
| W41 | same › "criterion 10: LEVEL_SEED_WEIGHTS is deep-equal to 41811f9's" | `4009ee5` | deletes T-026's six `concept_load` keys first (c4) | modify | "… deep-equal to b0ee336's": the whole object, no key deleted, against the value at `b0ee336` || approved |
| W42 | same › "criterion 12: engineering-decisions.md outside E-22's body, up to the first heading after E-23, is byte-identical to 41811f9's" | `0032410`, T-040 apply | truncation at E-24 added for T-040 (c4) | modify | "criterion 12: engineering-decisions.md outside E-22's body is byte-identical to the branch head's": no truncation; E-22 body carve-out kept (F2); pinned at the branch head, E-30 included (c7 exception) || approved |
| W43 | `climate-far-phrases-verify.test.ts` › T-090 criterion 12: nothing else in the bank moved › "every file under question-bank/data/us-states/ is byte-identical to 3279555" | `2023a09`, T-090 tester | hashes `built_at`; red on S | modify | "every file under question-bank/data/us-states/ matches its b0ee336 pin, built_at aside" → helper || approved |
| W44 | same › "content.json: every non-climate, non-map_click question deep-equal to 3279555" | `7792f87`, T-051 apply | the `map_click` filter is T-051's exclusion (c4) | modify | "content.json: every non-climate question deep-equal to b0ee336's": filter removed, digest re-pinned at `b0ee336` || approved |
| W45 | `map-click-no-candidates-verify.test.ts` › T-092 criterion 13 … › "E-1..E-28 are byte-identical to 5d72ca5's, and there are still 29 E-n headings" | `cf63f66`, T-092 tester | **red now**: E-30 makes 30 | modify | "E-1..E-28 are byte-identical to 5d72ca5's, and there are 30 E-n headings at the branch head": digest unchanged; both counts 29 → 30 || approved |
| W46 | same file, helper `digestsOf` (`clickFields`), used by "T-092 criterion 3 … the twelve fields, in order, hash to 5d72ca5's" | `cf63f66` | strips `choices`/`correctIndex`/`choiceGeometryIds` from `map_click` questions (c3) | modify | `omit(q, ["level"])` only. Pin value does not change (c1 there asserts the keys are absent) || approved |
| W47 | same file, helper `baselineOf` (`clickRest`), used by the criterion 9 `test.each` "bank %s …" | `cf63f66` | same strip on synthetic banks (c4) | modify | drop the `omit` of `CANDIDATE_KEYS`; pin values unchanged || approved |
| W48 | `t026-tester-verify.test.ts` › T-026 criteria 50-51 … › "criterion 50: the committed entity files are byte-equal to main's (45b00d7)" | `d201e70`, T-026 tester | raw bytes incl. `built_at`; red on S | modify | "criterion 50: the committed entity files match their b0ee336 pins, built_at aside" → helper || approved |
| W49 | `landmarks.test.ts` › T-013 criterion 7 — the bank is built, not hand-edited › "sources.built_at is ${PINNED_BUILT_AT} in every tracked file" | T-013 worker | c13; red on S | modify | "sources.built_at equals the main fixture's captured_at in every tracked file", as W1. One `expect` per file, so no floor moves || approved |
| W50 | `climate-kid.test.ts` › T-014 criterion 12 — … › same | T-014 worker | same | modify | same || approved |
| W51 | `state-animals.test.ts` › T-012 criterion 6 — … › same | T-012 worker | same | modify | same || approved |
| W52 | `region-vocabulary.test.ts` › T-017 criterion 6 — each pinned-digest guard gained a region neutralisation › 8 tests "${guard} neutralises region before hashing" and "${guard} proves its own region neutralisation is not a no-op" | T-017 | assert the neutralisations exist; red once W3/W6/W11/W21 land | delete (ii), all 8 | — || approved |
| W53 | `backend/tests/test_t089_tester_criteria.py::test_criterion_13_exactly_one_new_entry_numbered_gap_free` | `eebec2c`, T-089 tester | **red now**: E-30 exists | modify | `range(1, 31)`, comment "T-070 adds E-30 (branch head)"; `count(28) == 1` kept || approved |
| W54 | `backend/tests/test_content_build.py::test_committed_content_json_is_what_the_loader_writes_from_committed_inputs` | `25c7847`, T-040 worker; `content.json` not stale | Red on S(t₁): `_source.extractedAt` is the newest `built_at` date and S does not regenerate `content.json`. Not a pinned guard, but c11 cannot hold otherwise and c23 forbids `backend/app/` (F1) | modify | parse both sides; delete `_source.extractedAt` from both; assert deep-equal; and assert committed `extractedAt` matches `^\d{4}-\d{2}-\d{2}$`. **Weakens**: a stale date in `content.json` passes. **Your call** || approved |
| W55 | `backend/tests/test_t040_tester_criteria.py::test_c4_c5_the_committed_file_is_byte_for_byte_what_the_command_writes` | `acaa4a1`, T-040 tester | as W54 | modify | as W54 || approved |
| W56 | same file `::test_c5_a_changed_input_field_would_be_caught` | `acaa4a1` | as W54 (first assert) | modify | both asserts compare with `_source.extractedAt` removed from both sides: unchanged inputs equal, changed capital differs || approved |
| W57 | `backend/tests/test_t051_tester_criteria.py::test_c6_committed_content_json_is_what_the_build_writes_and_repeats` | `6537059`, T-051 tester | as W54 | modify | committed vs first render as W54; `first == second` byte-equal kept || approved |

**If W54–W57 are refused**, criterion 11 cannot hold within criterion 23, and
the brief goes back to `task-expander`. **If you choose the strict F2 reading**,
the attended tester adds rows for the slice pins named under F2.

To approve: start the `tester` step for this task in a session you are
attending, and answer it there, row by row.

## Notes

- **For the approver: the refresh this task survives is narrower than a real
  refresh.** Q1's condition is "a refresh in which only `sources.built_at` and
  the SPARQL fixtures moved". `bun run refresh` writes nothing when that is all
  that moved: it exits 2, `bank unchanged`. Every refresh that writes therefore
  moves at least one other bank field, and after this task the re-pinned bank
  guards will be red on it, as designed. If the monthly routine has to open
  green PRs, it needs a follow-on: either that PR re-pins the bank guards, or
  the bank guards stop pinning values a refresh may move. The expander did not
  widen the criteria to cover this, because Q1's answer did not ask for it.
- `tasks/` was empty at start. T-094's reviewer swept it.
- T-070 is the first task in `tasks.md` whose dependencies are done. Its
  `Depends on:` reads "nothing. Q1 is answered". Section A is empty.
- The expander did not run the build, the suite or the pipeline (D-7).
- **Worker (2026-10-28):**
  - **My own guard was red on S(t₁) at first.** Its "moving `built_at`
    leaves the digest unchanged" test used `2027-01-01` as the moved
    instant, which is t₁ itself. It now picks between two instants. This is
    the class of bug S(t) exists to catch.
  - **Count floors.** Exact floors in four files cross-check
    `landmarks.test.ts`, `state-animals.test.ts` and
    `landmarks-verify.test.ts`. This is why F3 prefers modify over delete
    for the `built_at` tests.
  - **A strip that did nothing at R still counts.** T-092's `omit` of the
    candidate keys removed nothing at R. It still has to go (c3), but its pin
    value does not move.

