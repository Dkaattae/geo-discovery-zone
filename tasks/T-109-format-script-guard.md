# T-109 — `bun run format` without an install still runs whatever prettier is on `PATH`

**Status:** `ci fix approved`
**Next step:** `ci-fix`
**Approved:** orchestrator — 2026-11-13, unattended run. See `runs/T-109-format-script-guard.md`.
**Test changes:** `routed to ci-fix (D-20)`
**CI fix:** `approved — Dkaattae, 2026-11-13, given in the orchestrator's session (round 2 plan)`
**From:** [`tasks.md`](../tasks.md) T-109
**Branch:** `task/T-109-format-script-guard`
**PR:** #137, opened draft at expand time, built from the branch above. Stays draft until the reviewer approves
**Fault:** tester round 2: no source is wrong, but one pre-existing pin (T-091 `MAIN_TESTS_SHA`) went red when the tester fixed this task's own criteria test for CI, and a one-row CI fix plan (round 2) to re-pin it is waiting for approval.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste |
| worker | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated run; spawned as a subagent, so the env id is the run's, not unique to this role) |
| tester | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated run; fresh subagent, same env id as every role in the run) |
| ci-fix (pass 1, plan) | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated run; fresh subagent, same env id as every role in the run) |
| ci-fix (pass 2, apply) | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated run; fresh subagent, same env id as every role in the run) |
| tester (round 2) | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated run; fresh subagent, same env id as every role in the run) |
| ci-fix (round 2, pass 1, plan) | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated run; fresh subagent, same env id as every role in the run) |

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

### Round 2 (after the ci-fix), at `d02f63c`

**TL;DR: `fail`. All 18 criteria are still met, but CI was red on the PR head, and the cause was the round-1 tester's own test file.** `question-bank/src/format-script-guard.criteria.test.ts` crashed at load in CI's question-bank job (`ENOENT … frontend/node_modules`). That job installs only `question-bank/`. I fixed the test file (my role's own file, not a pre-existing test). The fix turns **one pre-existing pin red**: T-091 `MAIN_TESTS_SHA`, which digests that file. It is routed to the `ci-fix` as request row 20. No source was edited.

**Independence:** orchestrated run (`runs/T-109-format-script-guard.md` exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJfSMW5AuCAW3Bk9Ste`, the id every role in this run lists, so the id check proves nothing. My only independence is being a freshly spawned subagent that saw none of the other roles' reasoning. That rests on the orchestrator spawning me correctly. I did not refuse on the id, and I do not claim the check passed.

**What CI showed.** Run 43461510008 (`pull_request`, head `d02f63c`): every job is green except `question-bank (typecheck, lint, test)`. Its **Test** step failed with 2767 pass / 1 fail / 1 error:

```
# Unhandled error between tests   (src/format-script-guard.criteria.test.ts)
277 |   h.update(readdirSync(real).sort().join(","));
ENOENT: no such file or directory, scandir '…/frontend/node_modules'
  at realModulesDigest (format-script-guard.criteria.test.ts:277:12)
```

Run 43461420183 on `8146a3c` failed the same way. Round 1 cited CI on `5b7c055`, which ran before the test file was committed, so this was never seen on CI. The ci-fix's report gives only local results. Locally the sandbox has both packages installed, so the suite was green there.

**Reproduced** in a scratch worktree at `d02f63c` that has only `question-bank/node_modules`, the same shape as the CI job: 0 pass / 1 fail / 1 error, same ENOENT.

**The fix** (test file only; no expected value changed):
- **`realModulesDigest`** (criterion 15) now records an absent `node_modules` as `node_modules:absent` instead of throwing. It still goes red if any test creates or changes one.
- **"Installed" copies** (criteria 8-10) take their byte copy of prettier from whichever package has the pinned version installed (`pinnedPrettierSource`). Both packages pin the same version (E-17). If neither has it, the function throws, so these tests fail rather than skip.
- **Criterion 8** now runs in a clean copy (`probe: false`) of each package, and also in the real `question-bank/` tree. The real `frontend/` tree's `format:check` is CI's frontend Format step, which is `success` on `d02f63c` (criterion 14).
- With the fix: **109 pass / 0 fail** in the full sandbox, and also in the CI-shaped worktree. In that worktree, `frontend/node_modules` is still absent afterwards.

**Mutations, re-run in the CI-shaped worktree** (the frontend scenarios now take their prettier from question-bank). Each was reverted with `git checkout --`:

| Mutation | Result (of 109) |
|---|---|
| frontend guard exits 0 instead of 1 | 27 fail |
| frontend guard: drop the version comparison | 29 fail |
| `frontend/package.json` back to `main`'s (no guard) | 43 fail |
| frontend `format:check` set `.` → `src` | 2 fail (criterion 12) |
| question-bank guard reads the wrong `package.json` (`../..`) | 28 fail |

In the real tree, before the fix, I also re-ran three mutations on the guards: frontend version comparison dropped (29 fail of 108), frontend `.bin` check dropped (7 fail), and question-bank guard exits 0 (27 fail). All were reverted.

| # | Verdict | Evidence (round 2) |
|---|---|---|
| 1-7 | met | the criteria file passes 109/109, and the mutations above turn it red |
| 8 | met | criterion 8 passes in a clean copy for both packages and on the real `question-bank/` tree. CI's frontend Format step is `success` on `d02f63c` |
| 9-12 | met | criteria tests pass. `prettier-gate.test.ts` "the check's own file arguments…" passes and is unmodified (`git diff origin/main` touches no line of it) |
| 13 | met (hand) | `git diff origin/main -- '*/bun.lock'` is empty. `jq -S '.dependencies,.devDependencies'` is identical to `origin/main` in both packages |
| 14 | met (hand) | `git diff origin/main -- .github/workflows/ci.yml` is empty. On run 43461510008 (head `d02f63c`), both jobs' **Format** steps are `success`. Only the question-bank **Test** step is red, as above |
| 15 | met | the criterion 15 tests pass. The real `node_modules` digests are unchanged, and `frontend/node_modules` stays absent in the CI-shaped worktree |
| 16 | met | the `deadEnv` test passes, and every child gets only `PATH`, `HOME`, `DEAD_PROXY` and `NO_COLOR` |
| 17 | met (hand) | the `conventions.md` diff against `origin/main` is +4/−1, in the Formatting paragraph only. It names both scripts in both packages, the refusal, and `bun install` as the remedy |
| 18 | met (hand) | see the ci-fix audit below |

**Ci-fix audit (criterion 18).** The diff `6c7b8ff..d02f63c` under `question-bank/src/` touches exactly the 10 files the CI fix plan names. Apart from comments, every changed line is one of: a digest constant, a count, two `CRITERION_2x_ALLOWED` entries (`tasks/` and `runs/` T-109 only), or the two `MAIN_SCRIPTS` values (row 10). No assertion was removed or loosened. Every digest still covers the same file set or a larger one. Row by row:

| Row | Change |
|---|---|
| 1, 2 | `agriculture-true-wrong-answers-verify.test.ts`: digests |
| 3, 4 | `conventions-openapi-row-verify.test.ts`: 134 → 137 and a digest |
| 5 | `climate-far-phrases-verify.test.ts`: digest |
| 6, 7 | `map-click-no-candidates-verify.test.ts`: digests |
| 8, 9 | `hand-check-levels-verify.test.ts`: digests |
| 10, 11, 12 | `refresh-regenerate-reminder-verify.test.ts`: values and digests |
| 13, 18 | `farm-animal-loose-ends-verify.test.ts`: digests, 280 → 282, 2 allowed entries |
| 14 | `familiarity-drawn-apart-verify.test.ts`: digests |
| 15, 16, 19, 20, 21 | `climate-cold-trade-accepted-verify.test.ts`: digests, 283 → 285, 132 → 133, 2 allowed entries |
| 17 | `highest-point-in-state-verify.test.ts`: digests |

The approval for those rows is the header line `CI fix: applied — approved — Dkaattae, 2026-11-13, given in the orchestrator's session`. I did not witness it.

**Suites, as run:**
- **question-bank at `d02f63c`, unchanged:** 2875 pass / 0 fail locally. Typecheck, lint and `format:check` are green. CI was red as above.
- **question-bank with my test fix:** 2875 pass / **1 fail**: "T-091 criterion 22: the diff touches only the allowed files › pre-existing test files are main's, except ones in an approved Test change request" (`climate-cold-trade-accepted-verify.test.ts:714`). Expected `369ef9f0…b888`, received `6b7d6146…4993`. That is request row 20. Typecheck, lint and `format:check` are green.
- **frontend:** 434 pass / 4 fail / 4 errors, all `Cannot find package 'react-simple-maps'` (the sandbox's proxy 403 on install). Lint and `format:check` are green. Typecheck has 9 errors, every one of them `react-simple-maps` / `us-atlas` / `UsMap`. CI's frontend job is `success` on `d02f63c`.

**Hand-off to the `ci-fix`:** one `pre-existing test` row, request row 20 below. Re-pin T-091's `MAIN_TESTS_SHA` to the digest observed at this commit (count stays 133), with a comment naming this round. Then a fresh tester checks that CI's question-bank Test step is green on the new head. This is fail round 2 of the loop's two.

### Round 1, at `5b7c055` plus the tester's file (superseded by round 2)

**TL;DR: `fail`, for stale pins only. All 18 criteria are met.** The 108 new criteria tests pass, and all 7 mutations of the guard and scripts turned them red. 19 pre-existing question-bank pins are red: 17 are made stale by this task's own files and 2 were already red at base. They are routed to the `ci-fix` as the rows in `## Test change request` (D-20). No source was edited.

**Independence:** this is an orchestrated run (`runs/T-109-format-script-guard.md` exists). My session id `cse_011oDiJfSMW5AuCAW3Bk9Ste` is the same one listed for the worker, so the session-id check proves nothing here. My independence rests only on being a freshly spawned subagent with its own context: I did not see the worker's reasoning. That is weaker than a separate session, because it depends on the orchestrator spawning me correctly.

**New test file:** `question-bank/src/format-script-guard.criteria.test.ts` (108 tests, about 24 s). It covers both packages: each scenario runs in a throwaway copy of that package's tracked files under the OS temp dir. The sentinel logs outside the copy and also appends to an unformatted tracked file inside it. It sits in `question-bank/` so the CI question-bank job runs it for both packages. It uses `offline-rebuild.ts`'s `DEAD_PROXY`, not its own literal, so T-014 criterion 16 stays green.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `… criteria 1-6 … > state <s>, bun run format > criterion 1: exits non-zero`, for 5 states (a, b at pin−1/pin+1/3.8.1, c) × 2 packages |
| 2 | met | same, `bun run format:check > criterion 2` |
| 3 | met | `criterion 3: no sentinel runs…`: the `PATH` log and the `.bin` log are both empty, all 20 runs |
| 4 | met | `criterion 4`: the probe `src/t109-probe.ts` (unformatted) is byte-equal, and so is every non-`node_modules` file's sha256 before/after |
| 5 | met | `criterion 5`: the output contains the pin read from the copy's `package.json` |
| 6 | met | `criterion 6`: the output also contains the found version (3.9.5, 3.9.7, 3.8.1) |
| 7 | met | `criterion 7 …`: pin changed to `3.7.4` with 3.9.6 installed refuses and names both. With `3.7.4` installed plus `.bin`, it exits 0 and the `.bin` logger ran once. Both scripts, both packages |
| 8 | met | `criterion 8`: the real tree's `format:check` exits 0, both packages |
| 9 | met | `criterion 9`: a copy with the real pinned prettier byte-copied in: non-zero, and the output names `src/t109-probe.ts` |
| 10 | met | `criterion 10`: `format` rewrites the probe, then `format:check` exits 0 |
| 11 | met | the real question-bank run of `format:check --use-tabs --no-semi` names every `.ts` under `src/`. In the logger copy, prettier receives exactly `--check <set> --use-tabs --no-semi`. `prettier-gate.test.ts` "the check's own file arguments…" passes and is unmodified |
| 12 | met | `criterion 12`: the `.bin` logger receives exactly `--write .` / `--check .` (frontend) and `--write src/**/*.ts` / `--check src/**/*.ts` (question-bank) |
| 13 | met (hand) | `git diff origin/main -- '*/bun.lock'` is empty. `jq -S .dependencies/.devDependencies` is identical to `origin/main` in both packages |
| 14 | met (hand) | `git diff origin/main -- .github/workflows/ci.yml` is empty. CI run 43455384015 on head `5b7c055`: the Format step is `success` in both the `frontend` and `question-bank` jobs. That run's question-bank **Test** step is red, on the stale pins below |
| 15 | met | `criterion 15`: a digest of the real `node_modules/prettier`, `.bin/prettier` and the top-level entries is unchanged after the file runs, and every copy is outside the package |
| 16 | met | every child gets `env = { PATH, HOME, ...DEAD_PROXY, NO_COLOR }` (no `process.env` inherited). The `criterion 16` test checks all six variables |
| 17 | met (hand) | the `conventions.md` diff against `origin/main` is +3/−1 lines, in the Formatting paragraph only. It says both scripts in both packages refuse unless the pinned prettier is installed, and names `bun install` |
| 18 | met (hand) | `git diff origin/main --stat -- '*.test.ts' '*.test.tsx'` is empty apart from my new file. No existing test was edited or deleted |

**Mutations** (each reverted with `git checkout --`; the tree is clean afterwards):

| Mutation | Result |
|---|---|
| M1 drop the version comparison (qb / frontend guard) | 29 fail / 29 fail |
| M2 drop the `.bin/prettier` check | 7 / 7 |
| M3 hard-code the pin to `"3.9.6"` | 4 / 4 (criterion 7) |
| M5 remove the found version from the (b) message | 8 / 8 (criterion 6) |
| M4 guard exits 0 instead of 1 | 27 / 27 |
| M6 question-bank `package.json` scripts back to `main`'s | 43 fail |
| M7 question-bank `format` glob `src/**/*.ts` → `src/*.ts` | criterion 12 red |

**Suites at head `5b7c055` plus my test file:**
- **question-bank:** 2856 pass / 19 fail. Typecheck, lint and `format:check` are all green. The 19 fails are exactly rows 1-19 below.
- **frontend:** 434 pass / 4 fail / 4 errors, all `Cannot find package 'react-simple-maps'`. That package is missing from this sandbox's `node_modules`. CI's frontend Test step is `success` on `5b7c055`, so this is the environment, not the change. Lint and `format:check` are green. Typecheck is red only on `react-simple-maps` / `us-atlas`, and CI's frontend Typecheck is `success`.
- **Base reds:** rows 18 and 19 were also red at `514cdc0`, which I checked in a scratch worktree. Base had 2765 pass / 2 fail. They are in the rows because this change adds more files for them to flag.

**Hand-off to the `ci-fix`:** turn rows 1-19 into `pre-existing test` rows of a CI fix plan. Each is a re-pin or an exemption for this brief's allowed files. None is a deletion. Each modified pin must still pin every file it pinned before.

## Test change request

Under the orchestrator: Decision left blank, routed to the `ci-fix` (D-20). All files are in `question-bank/src/`. "Introduced" is the earliest commit containing the test name (`git log -S`). Every row is a whole-tree or manifest pin (P-17), and this task's allowed files (`frontend/package.json` and `question-bank/package.json` scripts, the two `prettier-pin-guard.ts`, `conventions.md`, the brief and run log, test files) now differ from its baseline.

| # | Test (file › describe › name) | Introduced | Why stale | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `agriculture-true-wrong-answers-verify.test.ts:645` › T-088 criteria 20-25: what must not change › criterion 21: every tracked file under frontend/ is byte-identical to main's | `e9d666e`, T-088 tester: frontend untouched by T-088 | `frontend/package.json` scripts and the new `frontend/scripts/prettier-pin-guard.ts` (T-109 constraints) | modify | same name, with the frontend digest re-pinned to this branch's head after the ci-fix, so it still covers every tracked frontend file | |
| 2 | same file:657 › … › criterion 23: every package.json, bun.lock, pyproject.toml and uv.lock is main's | `e9d666e`, T-088: no dependency change | both `package.json` `scripts` changed (deps unchanged) | modify | re-pin the two `package.json` digests. Every lockfile digest unchanged | |
| 3 | `conventions-openapi-row-verify.test.ts:87` › T-105 criterion 2 — nothing else in conventions.md changes › the file has the same number of lines as at base 0b78dec | `c90cba3`, T-105 tester | criterion 17 adds 3 lines to the Formatting paragraph | modify | the line count re-pinned to the new count | |
| 4 | same file:95 › … › every line other than the openapi.yaml and backend/ rows is byte-identical to base … | `c90cba3`/`90c7c2a`, T-105/T-106 | same | modify | the base text re-pinned to include T-109's Formatting lines, still comparing every line | |
| 5 | `climate-far-phrases-verify.test.ts:759` › T-090 criterion 17 › every package.json, pyproject.toml and lockfile is byte-identical to 3279555, none added | `57a7fdc` (earliest -S), T-090: no new dependency | `package.json` scripts | modify | re-pin both `package.json` digests. Lockfiles unchanged, still "none added" | |
| 6 | `map-click-no-candidates-verify.test.ts:714` › T-092 criterion 15 › every package.json, pyproject.toml and lockfile is byte-identical to 5d72ca5's, none added | `cf63f66`, T-092 tester | same | modify | as row 5 | |
| 7 | same file › T-092 criterion 16: no other surface changes › frontend (except []) is byte-identical to 5d72ca5 | `cf63f66`, T-092 tester | frontend `package.json` and the new guard | modify | the frontend digest re-pinned to head | |
| 8 | `hand-check-levels-verify.test.ts:806` › T-025 criteria 14-17 › criterion 15: every package.json and lockfile is byte-identical to aa88101, and none was added | `57a7fdc` (earliest -S), T-025 | `package.json` scripts | modify | as row 5 | |
| 9 | `refresh-regenerate-reminder-verify.test.ts:293` › T-087 criterion 2 › scripts minus `questions` equals main's scripts exactly | `40f6c54`, T-087 tester | the question-bank `format`/`format:check` values changed (`MAIN_SCRIPTS`) | modify | `MAIN_SCRIPTS`' two values set to the new strings. Still an exact equality over every script | |
| 10 | same file:531 › T-087 criterion 15 › every tracked file under the three trees is as re-pinned by T-039, none added or removed | `40f6c54` | frontend changes (`MAIN_BOUNDARY_SHA`) | modify | re-pin `MAIN_BOUNDARY_SHA` | |
| 11 | same file:546 › T-087 criterion 16 › every manifest but question-bank/package.json is byte-identical to 0a98e11 | `40f6c54` | `frontend/package.json` (`MAIN_MANIFESTS_EXCEPT_QB_PKG_SHA`) | modify | re-pin that digest | |
| 12 | `farm-animal-loose-ends-verify.test.ts:639` › T-096 criteria 17-21 › criterion 20: every package.json, bun.lock, pyproject.toml and uv.lock is main's | `47581ea`, T-096 tester | `package.json` scripts | modify | as row 2 | |
| 13 | `familiarity-drawn-apart-verify.test.ts:667` › T-085a criteria 23-25 › criterion 23: no package.json, bun.lock, pyproject.toml or uv.lock changed since 5ae564a | `b061fd8`, T-085a tester | `package.json` scripts | modify | as row 2 | |
| 14 | `climate-cold-trade-accepted-verify.test.ts:654` › T-091 criterion 20 › every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's | `950f334`, T-091 tester | new non-test `question-bank/src/prettier-pin-guard.ts` | modify | re-pin, or exempt exactly that one file. Every other file still pinned | |
| 15 | same file:668 › T-091 criterion 21 › every package.json, bun.lock, backend/pyproject.toml and backend/uv.lock is 12d242e's | `950f334` | `package.json` scripts | modify | as row 2 | |
| 16 | `highest-point-in-state-verify.test.ts:410` › T-079 tester, criterion 20 — every package.json and bun.lock is byte-identical to 323254c › question-bank/package.json | `d16f329` (earliest -S), T-079 | scripts | modify | re-pin the question-bank `package.json` digest | |
| 17 | same › … › frontend/package.json | `d16f329` | scripts | modify | re-pin the frontend `package.json` digest | |
| 18 | `farm-animal-loose-ends-verify.test.ts:651` › T-096 criteria 17-21 › criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added | `47581ea`, T-096 tester | **red at base `514cdc0` already** (likely the brief and run log), and it now also flags the two guards, `conventions.md` and both `package.json` | modify | re-pin, or exempt T-109's allowed files plus `tasks/`/`runs/`. All other files still pinned | |
| 19 | `climate-cold-trade-accepted-verify.test.ts:683` › T-091 criterion 22 › every tracked non-test file outside the allowed list is 12d242e's, and none is added | `950f334` | **red at base `514cdc0` already**, and it now also flags this change's files | modify | as row 18 | |

Rows 1-17 are stale by this change alone. Rows 18-19 were red at base and are made redder by it.

**Round 2** (tester, after the ci-fix). Routed to the `ci-fix` (D-20), Decision blank:

| # | Test (file › describe › name) | Introduced | Why stale | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 20 | `climate-cold-trade-accepted-verify.test.ts:714` › T-091 criterion 22: the diff touches only the allowed files › pre-existing test files are main's, except ones in an approved Test change request (`MAIN_TESTS_SHA`) | `950f334`, T-091 tester: guards test files against changes outside an approved request | It digests this task's own `format-script-guard.criteria.test.ts`, which CI fix plan row 20 pinned. The round-2 tester changed that file so it runs in CI's question-bank job, which has no `frontend/node_modules`. The file is this task's tester file, not a pre-existing test. Observed: expected `369ef9f067dbb5605317bef32136d3e53d81f95698f82a710aa007869bceb888`, received `6b7d6146f0f3739fecebd803bc4b4b54fc048837435b4387ad4dea3565a64993` | modify | same name. `MAIN_TESTS_SHA` re-pinned to the digest at the round-2 tester's commit (recompute after writing the comment). `MAIN_TESTS_COUNT` stays 133. Every test file is still pinned by digest | |

## CI fix plan

**Round 2.** This replaces round 1's 21-row table, which was applied at `8146a3c`. Git keeps that table.

**TL;DR: no source is wrong. One `pre-existing test` row re-pins T-091's `MAIN_TESTS_SHA` to the digest after the round-2 tester's fix to this task's own criteria test.** I reproduced the one red locally and in CI. With the row applied in a CI-shaped worktree (only `question-bank/node_modules`), question-bank was **2876 pass / 0 fail**, and `format:check` was green. **Nothing is applied yet.**

**Independence:** orchestrated run (`runs/T-109-format-script-guard.md` exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJfSMW5AuCAW3Bk9Ste`, the id every role in this run lists, so the id check proves nothing. My only independence is that I am a freshly spawned subagent that saw none of the other roles' reasoning. I did not refuse on the id, and I do not claim the check passed.

**Reproduced:**
- **Locally at `1296e50`** (the branch head): `cd question-bank && bun test` gives 2875 pass / 1 fail. The fail is "T-091 criterion 22: the diff touches only the allowed files > pre-existing test files are main's, except ones in an approved Test change request".
- **In CI**, run 43465996210 (`pull_request`, head `85698c3`): question-bank **Test** step, 2875 pass / 1 fail, the same test. Expected `369ef9f0…b888`, received `6b7d6146f0f3739fecebd803bc4b4b54fc048837435b4387ad4dea3565a64993`. Every other job and step is green, including the question-bank Format step. The round-1 `ENOENT … frontend/node_modules` error is gone.
- **`origin/main`** is still `2634fc8`, the merge base, so no merge or recompute is needed.

**The request row checks out.** Request row 20 is right as written. The cause is the round-2 tester's edit to `question-bank/src/format-script-guard.criteria.test.ts` (`d02f63c..85698c3`, that file and the brief only). That file is in the digested set. The set excludes `climate-cold-trade-accepted-verify.test.ts` itself (`T091_TEST_FILES`), so adding a comment there does not move the digest. The count stays 133. I found no stale test it missed: the full suite has exactly this one red.

| # | File (and function or test) | Kind | Change | Why — failing test or CI line, root cause, criterion quoted for a test row | Decision |
|---|---|---|---|---|---|
| 1 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `MAIN_TESTS_SHA`, used by "T-091 criterion 22: the diff touches only the allowed files › pre-existing test files are main's, except ones in an approved Test change request" | pre-existing test (request row 20) | **Modify (re-pin).** `MAIN_TESTS_SHA` `369ef9f067dbb5605317bef32136d3e53d81f95698f82a710aa007869bceb888` → `6b7d6146f0f3739fecebd803bc4b4b54fc048837435b4387ad4dea3565a64993`. Add two comment lines above it: "Re-pinned again by T-109 (CI fix plan 2 row 1; round-2 Test change request row 20): T-109's round-2 tester made format-script-guard.criteria.test.ts run without frontend/node_modules." `MAIN_TESTS_COUNT` stays `133`. The filter and every other line stay as they are | **Red now**, locally and in CI run 43465996210. **Cause:** the round-2 tester changed this task's own criteria test so that it loads without `frontend/node_modules`. That fixed the CI-only `ENOENT` crash. The criteria test is in the set this pin digests. Introduced `950f334` (T-091 tester), protecting test files against changes outside an approved request. **Criterion 18:** "Any existing test this change makes stale goes through … the `ci-fix` plan under the orchestrator". The new digest admits exactly the round-2 edit to this task's own test file, and every other test file is still pinned byte for byte. The value does not depend on this row's own comment lines, because the file excludes itself from the set. It was observed in the trial worktree after the edit |

**Order for pass 2:** apply the one row, then run the whole question-bank suite. Expected: 0 fail. Trial: 2876 pass / 0 fail, with `format:check` green. The next tester must also confirm that CI's question-bank **Test** step is green on the new head.

**Root cause:** no code is wrong. All 18 criteria are met (Verdict, round 2). Round 1's ci-fix had pinned T-091's test-file digest to this task's criteria test as it stood then. The round-2 tester then had to fix that test file, because it crashed in CI's question-bank job. Its own whole-tree pin from row 20 of round 1 moved with it. This is the same second-order P-17 pin as round 1's row 20.

**Not doing:**
- **Excluding `format-script-guard.criteria.test.ts` from T-091's set** (as `T087_TEST_FILES` does for T-087's tests). That would end the churn for this file, but the file would then be unpinned there. Re-pinning keeps every test file digested, matching every earlier re-pin of this constant.
- **Touching the criteria test, the guards, the scripts or `conventions.md`.** They meet every criterion, and CI is green apart from this pin. No `source` or `task test` row.
- **Frontend `react-simple-maps` reds and frontend typecheck** in this sandbox. These are environmental (proxy 403 on install), and CI's frontend job is green on `85698c3`.

To approve by hand: fill in Decision, set the header's `CI fix:` to `approved — <name>, <date>` and `Next step` to `ci-fix`, commit, and start a run.

## CI fix

**TL;DR: all 21 plan rows are applied, test files only. question-bank is 2875 pass / 0 fail, and typecheck, lint and `format:check` are green.** No source, guard, script or `conventions.md` line was touched. Next, a fresh tester re-runs the criteria. The reviewer should note that the approval was given before the plan was written (see Approval).

**Approval:** the header read `CI fix: approved — Dkaattae, 2026-11-13, given in the orchestrator's session`. `runs/T-109-format-script-guard.md` quotes Dkaattae: *"approve the T-109 CI fix plan too"*. This was said while pass 1 was still running. The orchestrator says it told them the plan was not written yet and offered to halt so they could read it first, and no retraction came. No row's Decision cell is filled in, and I have not filled any in: nobody gave me a decision row by row. I took the header as approving **every row as written**, the same scope the timeout stamp has. T-107 and T-108 applied this form of header the same way.
- **For the reviewer (D-18):** every row is a test row, and the person approved them without having seen them. That gives the same assurance as the orchestrator's stamp, so escalate the PR as for a stamped plan.

**Pre-check:** `origin/main` is still `2634fc8`, the merge base, so no merge or full recompute was needed. I reproduced the plan's 20 reds at `3c306ae` before applying anything: question-bank was 2855 pass / 20 fail, the same 20 tests the plan names.

**Rows applied** (all are `pre-existing test`, all modify, none refused; files are in `question-bank/src/`):

| Row | File | Value written |
|---|---|---|
| 1, 2 | `agriculture-true-wrong-answers-verify.test.ts` | the plan's `MAIN_FRONTEND_SHA` and the two `package.json` digests |
| 3, 4 | `conventions-openapi-row-verify.test.ts` | `BASE_SPLIT_LENGTH` 134 → 137, `BASE_OTHER_LINES_SHA` as planned |
| 5 | `climate-far-phrases-verify.test.ts` | manifest digest as planned |
| 6, 7 | `map-click-no-candidates-verify.test.ts` | manifest and frontend digests as planned |
| 8, 9 | `hand-check-levels-verify.test.ts` | row 8: the two `package.json` digests. Row 9 **(recompute)**: `8f51a351…7116`, observed after row 17 |
| 10, 11, 12 | `refresh-regenerate-reminder-verify.test.ts` | `MAIN_SCRIPTS` format/format:check set to the guarded scripts, plus the two digests as planned |
| 13, 18 | `farm-animal-loose-ends-verify.test.ts` | `MAIN_DEP_SHA`; the T-109 brief and run log join `CRITERION_21_ALLOWED`; count 280 → 282; `MAIN_UNTOUCHABLE_SHA` as planned |
| 14 | `familiarity-drawn-apart-verify.test.ts` | the two `package.json` digests |
| 15, 16, 19, 20, 21 | `climate-cold-trade-accepted-verify.test.ts` | rows 15, 16 and 19 as planned (the brief and run log join `CRITERION_22_ALLOWED`, count 283 → 285). Row 20 **(recompute)**: count 132 → 133, `MAIN_TESTS_SHA` `369ef9f0…b888`. Row 21 **(recompute)**: agriculture `a515fa96…7329`, map-click `ca469fbe…d52d`, farm-animal `ca3c2afd…8906`, familiarity `cb70404e…5d13` |
| 17 | `highest-point-in-state-verify.test.ts` | the two `package.json` digests |

Each edit carries a `T-109 (CI fix plan row N)` comment. I applied them in the plan's order: rows 1-8 and 10-19, then 9, then 20, then 21. Every value the plan marked as standing reproduced exactly: every test that uses one went green with no change. The recompute values differ from the plan's trial values, as the plan said they would, because my comment bytes differ from its trial.

**Results, as run at the applied head:**
- **question-bank:** `bun test` gives **2875 pass / 0 fail**. `bun run typecheck`: 0 errors. `bun run lint`: 0 warnings, 0 errors. `bun run format:check`: guard passes, "All matched files use Prettier code style!".
- **frontend:** `bun test` gives 434 pass / 4 fail / 4 errors, all from the missing `react-simple-maps` (proxy 403 on install). That matches the worker's and tester's counts. `bun run lint` and `bun run format:check` are green. `bun run typecheck` shows 9 errors, all from the missing `react-simple-maps` / `us-atlas` (including the `UsMap.tsx` implicit-`any` errors that follow from it). I touched no frontend file.

**Independence:** this is an orchestrated run (`runs/T-109-format-script-guard.md` exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJfSMW5AuCAW3Bk9Ste`, the same id the expander, worker, tester and pass-1 ci-fix list, so the session-id check proves nothing. My only independence is that I am a freshly spawned subagent that saw none of their reasoning. I did not refuse on the id, and I do not claim the check passed.

**Noticed, not changed:**
- **Rows 18-19 counts:** the plan gave 285 and 287 as the red counts and 282 and 285 as the targets. The targets are what the tests now observe, so I wrote them as given.
- **P-17 again:** this is the fourth task in a row to need second-order pins (rows 9, 20 and 21). That recurrence belongs to `process-tasks.md` P-17, not to this task.

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
