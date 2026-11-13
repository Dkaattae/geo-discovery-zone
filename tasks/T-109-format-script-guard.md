# T-109 — `bun run format` without an install still runs whatever prettier is on `PATH`

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-109
**Branch:** `task/T-109-format-script-guard`
**PR:** opened draft at expand time (number recorded below once known)
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste |

## Goal

`bun run format` is what `conventions.md` tells every role to run, and when the
pinned prettier is not installed it silently runs a different prettier and
rewrites tracked files at the wrong version (the cause of T-076's five
`frontend/README.md` sightings). The scripts themselves should refuse, so the
wrong rewrite cannot happen from a test, a role, or a person's terminal.

## Already true (survey, 2026-11-13, at `2634fc8`)

- **Both packages pin prettier `3.9.6` exactly** in `devDependencies`
  (`frontend/package.json:90`, `question-bank/package.json:18`; E-16, E-17).
- **The scripts are bare prettier today**, so `bun run` falls back to `PATH`
  when `node_modules/.bin/prettier` is absent:
  - `frontend/package.json:14-15`: `"format": "prettier --write ."`,
    `"format:check": "prettier --check ."`
  - `question-bank/package.json:12-13`: `"format": "prettier --write \"src/**/*.ts\""`,
    `"format:check": "prettier --check \"src/**/*.ts\""`
- **T-107 already guards the two frontend *tests*** that spawn `bun run format`
  (`frontend/src/format-gate.criteria.test.ts:172-195`, the guard function
  refuses on a missing `node_modules/prettier`, a wrong version, or a missing
  `node_modules/.bin/prettier`). That guard lives in the test, not the script;
  nothing guards a person or a role running the script directly, and nothing
  guards `question-bank/` at all. This task is the script-level half.
- **CI installs before it formats.** Both jobs run
  `bun install --frozen-lockfile` and then `bun run format:check`
  (`.github/workflows/ci.yml:64-66` and `:137-139`), so in CI the pinned prettier
  is always present.

## Definitions

- **Package**: `frontend/` or `question-bank/`. Every criterion below holds for
  each package separately.
- **Pinned version**: the string in that package's `package.json`
  `devDependencies.prettier` at the time the script runs (today `3.9.6`).
- **Pinned prettier installed**: `<package>/node_modules/prettier/package.json`
  exists with `version` string-equal to the pinned version, **and**
  `<package>/node_modules/.bin/prettier` exists.
- **Not installed** is any other state, specifically these three:
  - **(a) missing**: no `<package>/node_modules/prettier/package.json`;
  - **(b) wrong version**: it exists with a different `version`, including one
    patch either side (`3.9.5`, `3.9.7`) and the sandbox's global `3.8.1`;
  - **(c) no bin**: the version matches but `<package>/node_modules/.bin/prettier`
    is absent, so `bun run` would fall back to `PATH`.
- **Sentinel**: an executable named `prettier` that records that it ran (e.g.
  appends to a log outside the package) and exits 0. Tests place it first on
  `PATH`, and for case (b) also at `<package>/node_modules/.bin/prettier`,
  standing in for an unpinned prettier.

## Acceptance criteria

**Frozen once approved.**

### When the pinned prettier is not installed

1. In each package, for each of states (a), (b) and (c), `bun run format` exits
   non-zero.
2. In each package, for each of states (a), (b) and (c), `bun run format:check`
   exits non-zero.
3. In each of the runs in criteria 1 and 2, no sentinel executes: neither one
   first on `PATH` nor one at `<package>/node_modules/.bin/prettier`.
4. In each of the runs in criterion 1, no tracked file under the package changes
   (byte-for-byte, measured before and after), including when a file the writer
   would reformat is present.
5. The combined stdout and stderr of each run in criteria 1 and 2 contains the
   pinned version string.
6. In state (b), that output also contains the version string actually found in
   `node_modules/prettier/package.json` (e.g. both `3.9.6` and `3.8.1`).
7. The pinned version is read, not hard-coded: in a copy of the package whose
   `package.json` `devDependencies.prettier` is changed to another exact version
   `X`, an installed prettier at `3.9.6` counts as state (b) and the output
   names `X`; an installed prettier whose `version` is `X` (with
   `.bin/prettier` present) passes the guard.

### When the pinned prettier is installed

8. In each package, `bun run format:check` exits 0 on a clean tree at the
   branch head.
9. In each package, `bun run format:check` exits non-zero when one unformatted
   file in its checked set is added (`frontend/`: anywhere under `.` that its
   `.prettierignore` does not exclude; `question-bank/`: under `src/`), and the
   output names that file.
10. In each package, `bun run format` rewrites such an unformatted file so that
    a following `bun run format:check` exits 0.
11. Extra arguments still reach prettier: in `question-bank/`,
    `bun run format:check --use-tabs --no-semi` on the clean tree exits
    non-zero and its output names every `.ts` file under `src/`, as on `main`
    (the existing `question-bank/src/prettier-gate.test.ts` test "the check's
    own file arguments and ignore files reach every .ts under src/", line 245,
    stays green unmodified).
12. The set of files each script checks or writes is unchanged from `main`:
    `.` for `frontend/`, `src/**/*.ts` for `question-bank/`.

### What must not happen

13. **No new dependency** in either package: `dependencies` and
    `devDependencies` of both `package.json` files, and both `bun.lock` files,
    are byte-identical to `main`. Checked by hand against `main` and recorded in
    the Verdict, not pinned by a committed test (P-17).
14. **`.github/workflows/ci.yml` is byte-identical to `main`**, and CI's
    `frontend` and `question-bank` jobs' Format steps pass on the PR's head
    commit. Checked by hand (P-17).
15. **No test touches the real `node_modules`** of either package: every
    not-installed scenario runs in a throwaway copy, or otherwise leaves
    `frontend/node_modules` and `question-bank/node_modules` unmodified.
16. **No test reaches the network**: every spawned child runs under the dead
    proxy convention (`test-guidelines.md`; `127.0.0.1:1`).
17. **`conventions.md`'s Formatting paragraph says** that both `format` and
    `format:check` refuse to run, in both packages, unless the pinned prettier
    is installed, and names `bun install` as the remedy. No other line of
    `conventions.md` changes except the two Commands-block comments (lines 61
    and 73) if the worker chooses to touch them.
18. **No existing test is deleted or weakened.** Any existing test this change
    makes stale goes through a Test change request (or the `ci-fix` plan under
    the orchestrator, D-20), never a direct edit by the worker.

## Out of scope

- **The two T-107 writer-test guards** in `frontend/src/format-gate.criteria.test.ts`
  and `frontend/src/readme-fences.criteria.test.ts`. They may become redundant;
  removing them is a separate task, not this one.
- **`eslint-plugin-prettier`**, which resolves prettier through `require` inside
  `bun run lint`, not through `PATH`. Not touched.
- **`backend/`'s `ruff format`**, and `e2e/` (it has no prettier script).
- **Changing the pinned version**, `.prettierrc` settings, `.prettierignore`, or
  any formatted file's content.
- **`ci.yml`** in any way (criterion 14).
- **`CLAUDE.md`, `process.md`, `.claude/`** — loop-gated (G1).
- **A new `engineering-decisions.md` entry.** Not required; E-16/E-17 already
  record the pin. The worker may note the guard there only if it judges a
  decision was made, and the reviewer decides.
- **Re-pinning digests** in unrelated tests beyond what this change turns red.

## Constraints

- **Files expected to change**: `frontend/package.json` (`scripts` only),
  `question-bank/package.json` (`scripts` only), `conventions.md`, and whatever
  the guard itself needs (a small script file inside each package, or one shared
  file — the worker chooses). Plus the tester's new test files.
- **Existing tests constrain the script shape**, and the worker should keep them
  green rather than route them to a Test change request where it can:
  - `question-bank/src/prettier-gate.test.ts` `formatStep()` (lines 70-83)
    finds CI's step by requiring the `format:check` script's value to match
    `/\bprettier\b/` and `/(^|\s)--check(\s|$)/`, and `runFormatCheck` appends
    extra args to `bun run <script>`.
  - `frontend/src/format-gate.criteria.test.ts` criterion 5 (lines 139-144)
    requires `format:check` to match `\bprettier\b` and `--check`, and not
    `--write`.
  - `frontend/src/conventions-doc.test.ts` requires every `bun run <script>`
    named in `conventions.md` to be a key of the package's `scripts`.
- **A new script file in `frontend/` is covered by `prettier --check .`**, and
  one under `question-bank/src/` by `src/**/*.ts`; it must itself be formatted.
- **Runtime**: bun only. No node, npm, npx or bunx (`CLAUDE.md` Packages).
- **Dependencies**: none (criterion 13). Ask before adding any.
- **Expected red pins (P-17, whole-tree pins).** Likely, not exhaustive — the
  tester runs all three suites:
  - `question-bank/src/refresh-regenerate-reminder-verify.test.ts`:
    `MAIN_SCRIPTS` (question-bank `scripts`), `MAIN_MANIFESTS_EXCEPT_QB_PKG_SHA`
    (`frontend/package.json`), `MAIN_BOUNDARY_SHA` (tracked files under
    `frontend/`).
  - `question-bank/src/conventions-openapi-row-verify.test.ts` criterion 2
    ("nothing else in conventions.md changes").
  - `frontend/src/prettier-writer-guard.criteria.test.ts` and
    `frontend/src/readme-fences.criteria.test.ts` may hash `frontend/` files.
  - Other `*-verify.test.ts` files that digest `question-bank/src/` or the
    `frontend/` tree.
  These go through the Test change request / `ci-fix` route (D-14, D-20).
  **Plan to attend the tester step.**

## Context

Required reading for the worker and the tester.

- `tasks.md` T-109 (the queue entry) and `runs/T-107-prettier-writer-guard.md`
  (why the test-level guard came first, and which pins went red then).
- `engineering-decisions.md` E-16 (line 760) and E-17 (line 808): why prettier
  is pinned exactly, and why both packages share one version.
- `frontend/src/format-gate.criteria.test.ts:172-195` — T-107's test-level
  guard; its three refusal cases are this brief's states (a)-(c).
- `frontend/src/prettier-writer-guard.criteria.test.ts` — how T-107's tester
  built throwaway copies with a `PATH` sentinel; a model for criteria 1-7, 15.
- `question-bank/src/prettier-gate.test.ts` — the question-bank gate tests
  (T-071), including the extra-args case at line 252 (criterion 11).
- `conventions.md` lines 36-41 (Formatting) and 60-73 (Commands).
- `.github/workflows/ci.yml` lines 59-66 and 134-139 (both Format steps).
- `test-guidelines.md` — dead-proxy convention and no-network rule.
- `process-tasks.md` P-17 — why criteria 13 and 14 are hand checks, not pins.

## Handoff

## Verdict

## Notes

- **Sweep:** `tasks/` held only `README.md` and `TEMPLATE.md` at start; T-108
  was swept by its reviewer. Nothing to sweep, so `tasks.md` and `PROGRESS.md`
  are untouched.
- **Picked over:** T-085b (needs a reachable Census release), T-056 (design
  decision), T-095 (a person's call between (a)/(b)/(c)), T-110 (product
  wording call), T-111 (in flight, PR #136), T-046 (rename-or-keep decision;
  earlier runs skipped it the same way).
- **Not the light path**: 18 criteria and a `conventions.md` change.
- **A choice the approver can reverse:** state (c) (version matches, `.bin`
  missing) counts as not installed, mirroring T-107's guard, because `bun run`
  then falls back to `PATH` exactly as in state (a).
