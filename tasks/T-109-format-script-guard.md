# T-109 — `bun run format` without an install still runs whatever prettier is on `PATH`

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** orchestrator — 2026-11-13, unattended run. See `runs/T-109-format-script-guard.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-109
**Branch:** `task/T-109-format-script-guard`
**PR:** #137, opened draft at expand time, built from the branch above. Stays draft until the reviewer approves
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste |
| worker | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated run; spawned as a subagent, so the env id is the run's, not unique to this role) |

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

**TL;DR: both packages' `format` and `format:check` now run a guard script first and reach prettier only if the pinned prettier is installed.** Hand-checked in throwaway copies for states (a), (b) and (c) in both packages: every run exits 1, no sentinel runs, nothing is rewritten. 17 question-bank whole-tree pins went red by design (listed below). The frontend suite's 4 reds are from this sandbox, not this change.

### What changed

- **`question-bank/src/prettier-pin-guard.ts`** (new): reads `devDependencies.prettier` from `../package.json` (relative to the script, not `cwd`), then exits 1 with a `refusing to run prettier: …` line on stderr if `node_modules/prettier/package.json` is missing (a), its `version` is not string-equal to the pin (b), or `node_modules/.bin/prettier` is missing (c). Every message names the pinned version; (b) also names the found one; all end `Run \`bun install\` in this package first.` Writes nothing.
- **`frontend/scripts/prettier-pin-guard.ts`** (new): the same file, apart from the one doc line that names the other copy. It sits next to `build-static.mjs`.
- **`question-bank/package.json`** (`scripts` only): `format` / `format:check` are now `bun run src/prettier-pin-guard.ts && prettier --write|--check "src/**/*.ts"`.
- **`frontend/package.json`** (`scripts` only): `format` / `format:check` are now `bun run scripts/prettier-pin-guard.ts && prettier --write|--check .`.
- **`conventions.md`**: the Formatting paragraph gains three lines saying that both scripts refuse in both packages unless the pinned prettier is installed, with `bun install` there as the remedy. The two Commands-block comments are unchanged.

### Where each criterion lives

| # | Where | Worker's own check (scratch, not committed) |
|---|---|---|
| 1-3 | the guard runs first; `&&` means prettier (neither `.bin` nor `PATH`) is never spawned when it exits 1 | (a), (b) at 3.8.1 and at 3.9.5, and (c), × both scripts × both packages: all rc=1, and a `PATH` sentinel (plus a `.bin` one in (b)) never ran |
| 4 | same; the guard only reads | the copy's file digest was the same before and after `format`, with an unformatted `src/zz-unformatted.ts` present |
| 5, 6 | the guard's `refuse()` messages | output seen: `pinned prettier 3.9.6 is required, found 3.8.1 in node_modules/prettier` |
| 7 | the pin is read from `package.json` at run time | a copy pinned to `3.8.1` with 3.8.1 installed and a `.bin` present passed the guard (the `.bin` sentinel then ran); a copy pinned to `3.9.9` with 3.9.6 installed refused, naming 3.9.9 and 3.9.6 |
| 8 | unchanged prettier invocation | `bun run format:check` exits 0 in both packages on this tree |
| 9, 10 | unchanged prettier invocation | not hand-run; covered by the existing T-071 and T-075 gate tests, which pass |
| 11 | `bun run <script> args…` appends the args after the `prettier --check …` half of the `&&` | `prettier-gate.test.ts` line 245 passes unmodified |
| 12 | globs untouched (`.` and `"src/**/*.ts"`) | — |
| 13 | no dependency added; `bun.lock` files untouched | `git diff main -- '*/bun.lock'` is empty; `dependencies`/`devDependencies` unchanged |
| 14 | `ci.yml` untouched. The guard needs only `bun`, which CI has | CI result on the PR head: for the tester/reviewer to confirm |
| 15, 16 | the tester's tests | — |
| 17 | `conventions.md` Formatting paragraph | — |
| 18 | no existing test edited | — |

### Deliberately not done

- **No committed worker test.** The behaviour is small and I hand-checked every state above. Criteria 1-7 and 15-16 are the tester's to pin.
- **T-107's two test-level guards are left in place** (out of scope).
- **No `engineering-decisions.md` entry.** E-16 and E-17 already record the pin, and the guard enforces it rather than deciding anything new. Reviewer to confirm.

### Judgment calls (each needs an owner)

- **Two copies of the guard, not one shared file.** A shared file at the repo root would need a `../` path that breaks in the tester's throwaway package copies, and it would sit outside both packages' format, lint and typecheck coverage. Reviewer to confirm or overturn.
- **The question-bank guard is under `src/`**, so `typecheck`, `oxlint` and `format:check` cover it. The cost is one extra red pin (T-091 criterion 20, "every non-test file under question-bank/src/ is 12d242e's"). Putting it in `question-bank/scripts/` would avoid that red but lose the coverage. Reviewer to decide.
- **The frontend guard is under `scripts/`, which `frontend/tsconfig.json` does not include.** So it is linted (eslint `**/*.ts`) and format-checked, but not typechecked. I did not move it into `src/`, which is app code, and I did not widen `tsconfig.json`, which the brief does not list. Reviewer to decide, or this goes to a follow-up in `tasks.md`.

### How to run

```bash
cd question-bank && bun run format:check && bun test
cd frontend && bun run format:check && bun test
# to see a refusal: in a copy without node_modules, or with a fake node_modules/prettier/package.json
```

### Contradictions with the brief

- **None found.** The brief's expected-red list is right about `refresh-regenerate-reminder-verify.test.ts` and `conventions-openapi-row-verify.test.ts`. The frontend `prettier-writer-guard` and `readme-fences` tests did **not** go red.

### Environment, not this change

- **The frontend has 4 failures and 4 errors** (`t026-setup.criteria`, `t051-map-click`, `t051-tester.criteria`, `screens.criteria`): `Cannot find package 'react-simple-maps'`. Also **`bun run typecheck` in `frontend/`** fails on the same missing package (`UsMap.tsx`, the t051 tests). `bun install --frozen-lockfile` gets 403 from the proxy downloading tarballs, so this sandbox's `frontend/node_modules` is incomplete. No error comes from this change.
- **Already red at base `514cdc0`** (checked with my change stashed): `farm-animal-loose-ends-verify.test.ts` "T-096 criteria 17-21 > criterion 21…" and `climate-cold-trade-accepted-verify.test.ts` "T-091 criterion 22…". This change adds to what they flag but did not cause them.

### Tests made stale

All are in `question-bank/src/`. All are whole-tree or manifest pins (P-17). The fix proposed for each is a **re-pin to this branch's head**, or an exemption for the files this brief allows. None should be deleted.

| File | Test | Made stale by | Proposal |
|---|---|---|---|
| `agriculture-true-wrong-answers-verify.test.ts` | T-088 criteria 20-25 > criterion 21: every tracked file under frontend/ is byte-identical to main's | `frontend/package.json` scripts and the new `frontend/scripts/prettier-pin-guard.ts` | re-pin |
| same | T-088 criteria 20-25 > criterion 23: every package.json, bun.lock, pyproject.toml and uv.lock is main's | both package.json `scripts` | re-pin the two package.json digests |
| `conventions-openapi-row-verify.test.ts` | T-105 criterion 2 — nothing else in conventions.md changes > the file has the same number of lines as at base 0b78dec | conventions.md +3 lines (criterion 17) | re-pin to the new line count |
| same | … > every line other than the openapi.yaml and backend/ rows is byte-identical to base, in the same order; … | same | re-pin, or exempt the Formatting paragraph |
| `climate-far-phrases-verify.test.ts` | T-090 criterion 17: no new dependency, no lockfile change > every package.json, pyproject.toml and lockfile is byte-identical to 3279555, none added | package.json scripts | re-pin the package.json digests |
| `map-click-no-candidates-verify.test.ts` | T-092 criterion 15: … > every package.json, pyproject.toml and lockfile is byte-identical to 5d72ca5's, none added | same | re-pin |
| same | T-092 criterion 16: no other surface changes > frontend (except []) is byte-identical to 5d72ca5 | frontend package.json and the new guard | re-pin |
| `hand-check-levels-verify.test.ts` | T-025 criteria 14-17: … > criterion 15: every package.json and lockfile is byte-identical to aa88101, and none was added | package.json scripts | re-pin |
| `refresh-regenerate-reminder-verify.test.ts` | T-087 criterion 2: … > scripts minus `questions` equals main's scripts exactly | question-bank `format`/`format:check` values (`MAIN_SCRIPTS`) | update `MAIN_SCRIPTS` to the new two values |
| same | T-087 criterion 15: … > every tracked file under the three trees is as re-pinned by T-039, none added or removed | frontend changes (`MAIN_BOUNDARY_SHA`) | re-pin |
| same | T-087 criterion 16: … > every manifest but question-bank/package.json is byte-identical to 0a98e11 | `frontend/package.json` (`MAIN_MANIFESTS_EXCEPT_QB_PKG_SHA`) | re-pin |
| `farm-animal-loose-ends-verify.test.ts` | T-096 criteria 17-21 > criterion 20: every package.json, bun.lock, pyproject.toml and uv.lock is main's | package.json scripts | re-pin |
| same | T-096 criteria 17-21 > criterion 21: … none is added | **already red at base**; now also flags the two guards, conventions.md and both package.json | re-pin, or exempt this brief's allowed files |
| `familiarity-drawn-apart-verify.test.ts` | T-085a criteria 23-25 > criterion 23: no package.json, bun.lock, pyproject.toml or uv.lock changed since 5ae564a | package.json scripts | re-pin |
| `climate-cold-trade-accepted-verify.test.ts` | T-091 criterion 20 > every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's | new `question-bank/src/prettier-pin-guard.ts` | re-pin, or exempt it |
| same | T-091 criterion 21 > every package.json, bun.lock, backend/pyproject.toml and backend/uv.lock is 12d242e's | package.json scripts | re-pin |
| same | T-091 criterion 22 > … none is added | **already red at base**; now also flags this change's files | re-pin |
| `highest-point-in-state-verify.test.ts` | T-079 tester, criterion 20 … > question-bank/package.json | scripts | re-pin |
| same | T-079 tester, criterion 20 … > frontend/package.json | scripts | re-pin |

**Count floors:** none touched. No test was removed or edited.

**Suite results at the worker's head:** question-bank 2748 pass / 19 fail. That is the 17 stale pins plus the 2 base reds, all listed above. Frontend 434 pass / 4 fail / 4 errors, all `react-simple-maps` (environment). Lint and format:check are green in both packages, and typecheck is green in question-bank. Frontend typecheck is red only on `react-simple-maps` / `us-atlas`.

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
- **Worker:** the frontend and question-bank `bun run` both ran `bun` and the
  `&&` chain fine under the sandbox's `/bin/sh`. Bun appends extra args to the
  end of the script string, so `--use-tabs` reaches prettier, not the guard.
  That is why criterion 11 holds without any argument plumbing.
- **Worker:** the sandbox cannot finish `bun install` in `frontend/` (proxy 403
  on tarballs), so `react-simple-maps` is missing. The tester will see the same
  four frontend reds unless its environment differs.
