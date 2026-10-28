# T-070 — Re-pin the digest guards, and let them survive a refresh

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-070
**Branch:** `claude/charming-pascal-jqpxd3`
**PR:** #103, opened draft at expand time from the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-28 | cse_011oDiJcaEvyueGBAthPSQu3 |

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

## Verdict

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
