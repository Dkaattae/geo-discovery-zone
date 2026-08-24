# T-004 — Tests for `level.ts`, and settle how `frontend` typechecks a test file

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** Dkaattae — 2026-08-24
**From:** [`tasks.md`](../tasks.md) T-004
**Branch:** `claude/t004-uqxhky` — the branch this session was assigned by the
harness, used instead of `task/T-004-...` under `CLAUDE.md` "Branches" and
`process.md`, "When the environment names the branch for you". Every role after
this one checks `git branch --show-current` against this line and pushes here
regardless of what it says.
**PR:** #23 — opened draft at expand time, built from the branch above. Stays
draft until the reviewer approves it.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-08-24 | cse_01N1UY1A2KmxuQaP2Cj4QB7V |
| worker | 2026-08-24 | cse_01Qd2mh1xNQCm3wTJjd3f455 |

## Goal

`frontend/src/lib/level.ts` is the last untested logic in `frontend/`, and it is
a hand-copy of `backend/app/levels.py` — two implementations of the same label
arithmetic that currently drift in silence. Test it, and pin the two together so
drift fails a suite instead of showing a child a different grade on each screen.

The same task closes two holes left open as workarounds rather than decisions:
frontend test files are excluded from `tsc` altogether, and CI's
`--pass-with-no-tests` means deleting every frontend test leaves CI green.

## Acceptance criteria

Frozen once approved. They change only by going back through `task-expander`.

1. **Every export of `frontend/src/lib/level.ts` is exercised by tests** —
   `gradeOf`, `bandOf`, `gradeLabel`, `bandLabel`, `levelLabel`. Deleting the
   body of any one of the five and returning a constant fails at least one test.

2. **`bandLabel` boundaries are pinned on both sides of each edge.** Asserted at
   minimum: `bandLabel(0.74) === "Easy"`, `bandLabel(0.75) === "Medium"`,
   `bandLabel(1.49) === "Medium"`, `bandLabel(1.5) === "Hard"`. The band is
   `bandOf(level)`, not the raw level, so the levels chosen must actually
   produce those bands.

3. **`gradeLabel` clamping is pinned at both ends of the 0–18 scale.**
   `gradeLabel(0) === "Kindergarten"` and `gradeLabel(18) === "8th grade"` —
   18 derives grade 9, which exists in neither the scale nor `gradeNames`, and
   must clamp to 8 rather than returning `undefined grade`. A level below the
   scale (e.g. `-2`) also yields `"Kindergarten"`, not a negative index.

4. **One committed table of expected labels is asserted by both suites.** A
   single fixture lists levels spanning 0–18 with the `grade`, `band`,
   `gradeLabel`, `bandLabel` and combined display string each must produce.
   `frontend/`'s tests and `backend/tests/test_levels.py` both read *that same
   file* — neither restates the expectations inline. Changing `level.ts` or
   `levels.py` alone, so the two disagree, turns a suite red.

5. **`bun run typecheck` in `frontend/` covers test files.** `tsconfig.json` no
   longer excludes `src/**/*.test.ts` / `src/**/*.test.tsx`, and a deliberate
   type error introduced in any frontend test file makes `bun run typecheck`
   exit non-zero. `bun test` still passes with the exclusion gone.

6. **`--pass-with-no-tests` is gone from the frontend Test step** in
   `.github/workflows/ci.yml`, along with the comment block explaining a case
   that no longer exists. Deleting every file matching `*.test.ts*` under
   `frontend/src/` would then make `bun test` exit non-zero.

7. **`test-guidelines.md` "Randomness and time" is true as written.** Its
   `Forward-looking` note is gone; it no longer says `frontend/` has no tests
   and no longer places `pickQuestion` in `frontend/`. The randomness guidance
   itself survives, pointed at where that code actually lives
   (`backend/app/selection.py`, `backend/tests/test_selection.py`).

8. **Both settled questions are written down where a future session will find
   them**, with the reasoning and what would reverse each: adding `@types/bun`
   and typechecking frontend tests (criterion 5), and requiring frontend tests
   in CI (criterion 6). `PROGRESS.md`'s "Frontend test files are excluded from
   `tsc` rather than typechecked (T-004)" line is no longer true and does not
   survive as written.

9. **No new dependency beyond `@types/bun`**, which is a `devDependency` of
   `frontend/` only, pinned to the version `question-bank/` already uses
   (`^1.3.14`), with `frontend/bun.lock` committed in the same commit. Nothing
   is added to `dependencies`.

10. **No test reaches the network**, and the whole suite passes — `frontend`,
    `question-bank` and `backend`, not only the new tests.

## Out of scope

- **`frontend/src/lib/api/client.test.ts`'s subject matter.** Removing the
  `exclude` makes `tsc` read that file for the first time; fixing type errors it
  surfaces is in scope, rewriting its tests is not.
- **The missing `levelWindow` in the client.** `backend/app/levels.py:60` claims
  to mirror a `levelWindow()` in the client; no such function exists in
  `frontend/`. Do not write one — note it, and it becomes a `tasks.md` entry at
  sweep time. Criterion 4 covers only functions both sides actually have.
- **Unifying the two implementations.** Deleting `level.ts` in favour of the
  server's `levelLabel` object is a real option and a separate task; this one
  pins them together, it does not merge them.
- **The seven eslint warnings** (T-006) and the dead-proxy network check
  (T-005), even though both touch the same CI job.
- **`conventions.md`'s stale `api/` commands** (T-007) — `test-guidelines.md`
  line 122 is named here because it is false *about T-004's own subject*; the
  rest of the doc sweep is not this task.
- Any change to `openapi.yaml`.

## Constraints

- **Files expected to change:** `frontend/src/lib/level.test.ts` (new), the
  shared fixture from criterion 4 (new), `backend/tests/test_levels.py`,
  `frontend/tsconfig.json`, `frontend/package.json`, `frontend/bun.lock`,
  `.github/workflows/ci.yml`, `test-guidelines.md`, `decisions.md`,
  `PROGRESS.md`.
- **The dependency is already approved.** `@types/bun` was put to Dkaattae on
  2026-08-24 with the alternatives (keep the exclusion and document it; a
  separate `tsconfig.test.json`) and the first was chosen. `bun add -d` in
  `frontend/`, never npm/yarn/pnpm. No further dependency without asking again.
- **Invariant:** `level.ts` and `levels.py` produce identical labels for every
  level in the fixture. If the worker finds a level where they already disagree,
  that is a bug to report in the Handoff — do not paper over it by choosing
  fixture values that avoid it.
- **Fixture placement:** it has to be readable by a bun suite and a pytest suite
  without either copying it. `backend/tests/conftest.py:45` already reaches the
  repo root this way (`Path(__file__).resolve().parents[2] / "openapi.yaml"`),
  so repo-root-adjacent is the established pattern. Check `.dockerignore` does
  not need updating for whatever location is chosen.
- **`bandOf` returns floats.** `18 - 2 * 9 === 0` is exact, but assert band
  equality tolerantly where a level is not a multiple of 0.5, as
  `test_levels.py` already does with `pytest.approx`.
- **Do not weaken a suite to make it pass.** If dropping `--pass-with-no-tests`
  or the `tsconfig` exclusion turns something red, fix the cause.

## Context

Required reading, not background.

- **The code under test:** `frontend/src/lib/level.ts` (29 lines, 5 exports) and
  its mirror `backend/app/levels.py` — note the file header of each, which
  already states the two must agree.
- **The existing tests to match in style and to extend:**
  `backend/tests/test_levels.py` (21 tests, the parity target) and
  `frontend/src/lib/api/client.test.ts` (the only frontend test file, 216 lines,
  and the model for `bun:test` imports and injected-seam style).
- **The workaround being replaced:** the `exclude` and its comment in
  `frontend/tsconfig.json`; the `Test` step and its comment block in
  `.github/workflows/ci.yml` (frontend job). `question-bank/tsconfig.json` is
  the working example of the shape being adopted — `"types": ["bun"]`, tests
  inside `include`.
- **The doc line that is false:** `test-guidelines.md` "Randomness and time",
  the `Forward-looking` blockquote at lines 120–124.
- **Where decisions get written:** `decisions.md` — the entries run D-1…D-8 with
  a `Revisit when` clause each; follow that shape.
- **Consumers of `level.ts`, so the tests describe real usage:**
  `frontend/src/components/screens.tsx:5` and
  `frontend/src/components/Session.tsx:6`.
- **How tests get written here:** `test-guidelines.md` — start below the
  transport, no network, no mocking `fetch`. These are pure functions, so they
  need no seam at all.
- **Rules that bite:** `CLAUDE.md` "Packages" (ask before a dependency — done,
  see Constraints) and "Tests" (run the whole suite before saying it works).

## Handoff

Written by `worker`, session `cse_01Qd2mh1xNQCm3wTJjd3f455`, 2026-08-24.

**All ten criteria are implemented. Every suite is green — 65 frontend, 19
question-bank, 233 passed + 9 skipped backend — and all three still pass with
`HTTPS_PROXY`/`HTTP_PROXY` pointed at a dead port.** Nothing was already done;
this task had real work in every criterion.

**One thing you must know before you run anything: `bun install` cannot complete
in this sandbox, and `bun run typecheck` in `frontend/` therefore reports 4
errors that have nothing to do with this task.** Details and the exact expected
output are under "The sandbox cannot install `frontend/`" below. Read that
section first or you will read a clean run as a failure.

### What changed, file by file

| File | Change |
|---|---|
| `fixtures/level-labels.json` | **new.** The shared table of criterion 4 — 30 levels spanning 0–18 with `grade`, `band`, `gradeLabel`, `bandLabel`, `display`. Read by both suites. |
| `frontend/src/lib/level.test.ts` | **new.** 46 tests over all five exports, the band edges, the clamps, and the shared table. |
| `backend/tests/test_levels.py` | rewritten to read the shared table. Was 21 tests, now 42. |
| `frontend/tsconfig.json` | `exclude` deleted; `"types": ["vite/client", "bun"]`. |
| `frontend/package.json` | `@types/bun: ^1.3.14` added to `devDependencies`. |
| `frontend/bun.lock` | `@types/bun@1.4.0` and `bun-types@1.4.0` pinned. **Hand-edited, not written by `bun add` — see the caveat below.** |
| `.github/workflows/ci.yml` | frontend `Test` step: `bun test --pass-with-no-tests` → `bun test`, old comment block replaced. |
| `test-guidelines.md` | "Randomness and time" rewritten against `backend/app/selection.py`; the `frontend/` line in "Per-area specifics" corrected. |
| `decisions.md` | **D-9** (typechecking frontend tests, `@types/bun`) and **D-10** (CI requires frontend tests), each with a `Revisit when`. |
| `PROGRESS.md` | the "excluded from `tsc`" gap line deleted; frontend test count and the level-parity pin recorded under Done. |
| `tasks.md` | **T-057** added for the missing `levelWindow`; the test-count table line corrected. |

Not changed, deliberately: `.dockerignore` (checked — see below), `openapi.yaml`,
`frontend/src/lib/level.ts`, `backend/app/levels.py`, `conventions.md`.

### Where each criterion lives

| # | Criterion | Where | Evidence |
|---|---|---|---|
| 1 | all five exports exercised | `frontend/src/lib/level.test.ts` — one `describe` per export, plus the shared-table block | 5 mutations (each export replaced with a constant) each killed at least one test |
| 2 | `bandLabel` edges both sides | `level.test.ts` "bandLabel boundaries" | `0.74`/`0.75`/`1.49`/`1.5` asserted literally; also `16.74`, `12.75`, `13.49`, `13.5`, which are the *same band* edges four grades up |
| 3 | `gradeLabel` clamped both ends | `level.test.ts` "gradeLabel clamping" | `gradeOf(18) === 9` and `gradeLabel(18) === "8th grade"`; `gradeLabel(-2)` and `gradeLabel(-0.5)` → `"Kindergarten"` |
| 4 | one table, both suites | `fixtures/level-labels.json`, read by `level.test.ts:18` and `backend/tests/test_levels.py:32` | tampering with one row (`12.75` → `Easy`) turned **both** suites red at exactly that row |
| 5 | typecheck covers test files | `frontend/tsconfig.json` | a deliberate `const x: number = gradeLabel(0)` in `level.test.ts` produced `src/lib/level.test.ts(164,7): error TS2322`, which the old `exclude` would have hidden |
| 6 | `--pass-with-no-tests` gone | `.github/workflows/ci.yml:59-66` | with both `*.test.ts` files moved out of the tree, `bun test` printed `0 test files matching …` and exited 1 |
| 7 | "Randomness and time" true | `test-guidelines.md:120-143` | blockquote gone; the section names `backend/app/selection.py` and `backend/tests/test_selection.py` and its example is the real `pick_question` signature, `rng` and all |
| 8 | both decisions written down | `decisions.md` D-9, D-10 | `PROGRESS.md`'s "Frontend test files are excluded from `tsc`" line is deleted, not reworded |
| 9 | no dependency beyond `@types/bun` | `frontend/package.json` `devDependencies` | one line added; `dependencies` untouched; `bun.lock` in the same commit |
| 10 | no network, whole suite green | — | see "How to run what I touched" |

### The sandbox cannot install `frontend/` — read this before judging a run

`frontend/bun.lock` pins **23 packages to `europe-west1-npm.pkg.dev`** (a private
Lovable registry mirror; the d3 / `react-simple-maps` / `us-atlas` /
`topojson-client` tree). This session's egress policy answers that host with
**403**, so `bun install --frozen-lockfile` in `frontend/` fails and 21 packages
are absent from `node_modules`. `/root/.ccr/README.md` says to report a 403
rather than route around it, so I did not.

Two consequences, both environmental:

- **`bun run typecheck` in `frontend/` exits 2 with exactly these four errors,
  and they are identical on the commit before mine:**

  ```
  src/components/UsMap.tsx(2,55): error TS2307: Cannot find module 'react-simple-maps' …
  src/components/UsMap.tsx(3,24): error TS2307: Cannot find module 'us-atlas/states-10m.json' …
  src/components/UsMap.tsx(36,15): error TS7031: Binding element 'geographies' implicitly has an 'any' type.
  src/components/UsMap.tsx(37,30): error TS7006: Parameter 'geo' implicitly has an 'any' type.
  ```

  I established that baseline before touching `tsconfig.json`. **My changes add
  zero errors** — no error in any `*.test.ts` file, which is the whole of
  criterion 5. If you can install cleanly, `bun run typecheck` should be silent.

- **`@types/bun` could not be added with `bun add -d`.** `bun add` aborts on the
  403s and writes nothing. I got the exact entries by running
  `bun add -d @types/bun@^1.3.14` in a throwaway project with the same
  `bunfig.toml` settings, then pasted bun's own output into `frontend/bun.lock`
  and `frontend/package.json` by hand. `@types/bun` and `bun-types` were copied
  into `frontend/node_modules` from that project so I could actually run `tsc`.

  **How I checked the hand-edit is what bun would have written:** bun's
  frozen-lockfile consistency check runs *before* any download. With
  `@types/bun` in `package.json` and not in `bun.lock`, `bun install
  --frozen-lockfile` fails with `error: lockfile had changes, but lockfile is
  frozen` and never reaches the network. After the splice it no longer produces
  that error — it gets past resolution and fails only on the 403 downloads. So
  bun agrees the lockfile satisfies `package.json`, including `bun-types`'
  `@types/node: *`, which the existing `@types/node@22.20.1` satisfies (no
  second copy is pinned).

  **This is the one thing I could not fully verify, and it is the likeliest
  place for this branch to be wrong.** If CI's `Install` or `Lockfile unchanged`
  step fails on `frontend/`, that is this, not the tests. **Owner: whoever can
  run `bun install` with normal registry access** — re-run `bun add -d
  @types/bun@^1.3.14` in `frontend/` and commit whatever it writes. Failing
  that, reviewer to decide whether to hold the merge until a CI run is green.

### What I deliberately did not do

- **Did not write `levelWindow()` in the client.** Out of scope. I confirmed the
  gap is real: `grep -rn levelWindow frontend/` returns nothing, so
  `backend/app/levels.py:60`'s docstring describes a function that is not there.
  Logged as **T-057** in `tasks.md`. The brief says that entry belongs to the
  sweep; I wrote it now rather than trusting it to survive two more sessions —
  **reviewer to delete it if they would rather own it at sweep time.**
- **Did not touch `client.test.ts`'s subject matter.** Removing the `exclude`
  made `tsc` read it for the first time and it produced **no** type errors, so
  there was nothing to fix. Only the `dependencies`/`devDependencies` split and
  the `exclude` moved.
- **Did not unify `level.ts` and `levels.py`.** Separate task, as the brief says.
- **Did not touch the 7 eslint warnings (T-006)** or the dead-proxy CI step
  (T-005), even though I ran the dead-proxy check by hand.
- **Did not update `.dockerignore`.** Checked, as the Constraints ask: the
  `Dockerfile` only ever `COPY`s `frontend/` and `backend/`, so a repo-root
  `fixtures/` directory enters the build context (≈4 KB) and never the image —
  exactly like `openapi.yaml`, which is also unignored. No change needed.
- **Did not reformat `fixtures/level-labels.json` with prettier.** Nothing
  formats the repo root, and one row per line is what makes it readable as a
  table. `bunx prettier --check` from `frontend/` will complain about it; that
  file is outside `frontend/` and outside every CI format step.

### Things I found that the brief did not predict

- **`level.ts` and `levels.py` do not disagree anywhere.** The Constraints told
  me to report it if they did. I swept every level from −4.00 to 19.00 in steps
  of 0.01 — 2,301 levels — comparing `grade`, `band`, both labels and the
  display string across the two implementations. **Zero mismatches.** So the
  fixture pins a real invariant rather than papering over a live bug. (The sweep
  script was scratch and is not committed.)
- **`test-guidelines.md` said `frontend/` has no tests in a second place**, line
  198's `cd frontend && bun test # no test files yet — exits 1 until T-004`, not
  only in the blockquote criterion 7 names. Criterion 7 says the file must no
  longer say `frontend/` has no tests, so I fixed both.
- **`tasks.md`'s summary table said "19 frontend"** and my change makes that
  false, so I corrected it to 65 (and backend 221 → 242 collected). That file is
  not in the Constraints list; flagging it because the reviewer checks for work
  outside them. **Reviewer to confirm or revert.**
- **`bun-types@1.4.0` is happy under TypeScript 5.8 and alongside `DOM`,
  `DOM.Iterable`, `vite/client` and `@types/node@22`** — no duplicate-global
  errors, `skipLibCheck` not doing any heavy lifting for it. That was the main
  technical risk in criterion 5 and it did not materialise.

### How to run what I touched

```bash
cd frontend      && bun test && bun run lint && bun run typecheck
cd question-bank && bun test && bun run typecheck
cd backend       && uv run pytest && uv run ruff check . && uv run ruff format --check .
```

Actual results in this session, in full:

- `frontend`: **65 pass, 0 fail**, 237 `expect()` calls, 2 files.
- `frontend` lint: **0 errors, 7 warnings** — the same seven `react-refresh`
  warnings that were there before, which are T-006.
- `frontend` typecheck: **the 4 pre-existing sandbox errors above and nothing
  else.**
- `question-bank`: **19 pass, 0 fail**. `typecheck` silent.
- `backend`: **233 passed, 9 skipped** (the 9 are the Postgres-only tests, which
  skip on SQLite). `ruff check` clean, `ruff format --check` clean.
- **No network:** all three suites re-run with `HTTPS_PROXY`, `HTTP_PROXY` and
  their lowercase twins set to `http://127.0.0.1:1` and `NO_PROXY` emptied.
  Identical results.

My own mutation pass, for what it is worth — the tester should do its own:
sixteen deliberate breakages (each of the five TS exports replaced with a
constant; both clamps dropped; each band edge moved by 0.01; `bandLabel`
comparing the raw level; and six equivalents in `levels.py` including swapping
the `·` separator). **All sixteen were killed**, and both files were restored
and confirmed clean in `git status`.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

*Worker, 2026-08-24.*

- **The brief was right about everything except one word: "bug".** The
  Constraints anticipated finding a level where the two implementations already
  disagree. There isn't one — 2,301 levels compared from −4.00 to 19.00 in 0.01
  steps, zero mismatches. Worth saying because a clean parity check is easy to
  read as "the test proves nothing"; what it proves is that the pin is being
  installed while the two are still in step, which is the only time installing
  it is cheap.
- **The real surprise was the sandbox, not the code.** 23 packages in
  `frontend/bun.lock` are pinned to a private registry mirror this session is
  denied by egress policy, so `bun install` cannot finish and `bun add -d`
  cannot write anything. The dependency the whole task depends on had to be
  hand-pinned from a throwaway project's lockfile. That is the one unverified
  thing on this branch and it is called out at the top of the Handoff.
- **`bun add -d @types/bun@^1.3.14` resolves to `@types/bun@1.4.0` today**, not
  1.3.14. The criterion pins the *range* `question-bank/` uses, which is what
  `package.json` now carries; `bun.lock` carries whatever that range resolved
  to, as lockfiles do. `question-bank/bun.lock` may well pin an older point
  release — that is normal and not drift.
- **Decision I made without being told to: `grade` in the shared table is the
  *unclamped* `gradeOf(level)`.** Level 18 is therefore `grade: 9`. The
  alternative is `level_label()`'s clamped `grade`, but that has no counterpart
  export in `level.ts`, and criterion 3 says in so many words that "18 derives
  grade 9". The clamp is asserted separately on both sides. The fixture's
  `_fixture.fields` block names which function produces each column so nobody
  has to re-derive this.
- **Band equality is asserted with a tolerance everywhere, not only off the
  half-steps.** `bandOf(16.74)` is `0.7400000000000002` in both languages, and a
  rule that says "exact here, tolerant there" is a rule someone will get wrong
  later. The tolerance is `1e-9`; real drift between the two implementations
  would be ≥ 0.25, so nothing is being hidden by it.
- **Two files changed that no Constraint lists** — `tasks.md` (the new T-057
  entry, and a test count my own change falsified) and nothing else. Both are
  flagged in the Handoff with the reviewer named.
