# T-004 — Tests for `level.ts`, and settle how `frontend` typechecks a test file

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending` — replace with who approved and the date
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

Written by `worker` before the tester runs. Always written, even if nothing was
built.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes
