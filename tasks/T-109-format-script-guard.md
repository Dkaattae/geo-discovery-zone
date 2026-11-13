# T-109 — `bun run format` without an install still runs whatever prettier is on `PATH`

**Status:** `ci fix approved`
**Next step:** `ci-fix`
**Approved:** orchestrator — 2026-11-13, unattended run. See `runs/T-109-format-script-guard.md`.
**Test changes:** `routed to ci-fix (D-20)`
**CI fix:** `approved — Dkaattae, 2026-11-13, given in the orchestrator's session`
**From:** [`tasks.md`](../tasks.md) T-109
**Branch:** `task/T-109-format-script-guard`
**PR:** #137, opened draft at expand time, built from the branch above. Stays draft until the reviewer approves
**Fault:** no code is wrong; 20 pre-existing question-bank whole-tree/manifest/test-file pins are stale against this task's allowed changes (one more than the tester routed), and a 21-row CI fix plan re-pinning them is waiting for approval.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste |
| worker | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated run; spawned as a subagent, so the env id is the run's, not unique to this role) |
| tester | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated run; fresh subagent, same env id as every role in the run) |
| ci-fix (pass 1, plan) | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste (orchestrated run; fresh subagent, same env id as every role in the run) |

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

## CI fix plan

**TL;DR: no source is wrong; 21 `pre-existing test` rows re-pin whole-tree and manifest pins to this task's allowed changes.** All 18 criteria are met (Verdict). I reproduced **20** reds, not 19: the tester missed T-091's test-file pin, which went red when its own new test file was committed. Two more rows are knock-ons that go red once the other rows land. With all 21 rows applied in a throwaway worktree, question-bank was **2875 pass / 0 fail**, and `format:check` was green. **Nothing is applied yet.**

**Independence:** this is an orchestrated run (`runs/T-109-format-script-guard.md` exists). My session id `cse_011oDiJfSMW5AuCAW3Bk9Ste` is the same one the expander, worker and tester list, so the id check proves nothing. My independence is only that I am a freshly spawned subagent that saw none of their sessions.

**Reproduced** at `6c7b8ff`: `cd question-bank && bun test` gives 2855 pass / 20 fail. The 20 are request rows 1-19 plus "T-091 criterion 22 › pre-existing test files are main's, except ones in an approved Test change request" (132 expected, 133 received). `origin/main` is still `2634fc8`, the merge base.

**Values:** each was observed in a scratch worktree at `6c7b8ff`, with every row applied, before any comment lines were added. The worktree has since been removed. Values marked **(recompute)** depend on the bytes of test files that other rows edit, so pass 2 must recompute them after it writes the comments, in the order given under the table. Every other value depends only on non-test files and stands as written. **If `origin/main` moves before pass 2** (T-111, PR #136, is open), merge it first and recompute every value. That is not a new row.

| # | File (and function or test) | Kind | Change | Why — failing test or CI line, root cause, criterion quoted for a test row | Decision |
|---|---|---|---|---|---|
| 1 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` › `MAIN_FRONTEND_SHA`, used by "T-088 criteria 20-25 › criterion 21: every tracked file under frontend/ is byte-identical to main's" | pre-existing test (request row 1) | **Modify (re-pin).** `ab8f396e…52ebb` → `1d7567d69e4d513ead3a019a1be8c0672ba95eda2c4ac7d4e4c9800316b4fdca`. Add a `// Re-pinned by T-109 (CI fix plan row 1): …` comment naming `frontend/package.json` scripts and the new `frontend/scripts/prettier-pin-guard.ts` | Red: the digest differs. **Cause:** T-109 changes `frontend/package.json` `scripts` and adds `frontend/scripts/prettier-pin-guard.ts`. The brief allows both: "**Files expected to change**: `frontend/package.json` (`scripts` only), … and whatever the guard itself needs". Introduced `e9d666e` (T-088 tester), protecting the frontend tree from T-088. The new digest still covers every tracked frontend file, byte for byte |
| 2 | same file › `MAIN_DEP_SHA["frontend/package.json"]` and `["question-bank/package.json"]`, used by "… › criterion 23: every package.json, bun.lock, pyproject.toml and uv.lock is main's" | pre-existing test (request row 2) | **Modify (re-pin).** `frontend/package.json` `22870bb9…` → `65dc7bd49fc98164da55068e497cc505a609583634c4b849cc0597fcd2147f57`. `question-bank/package.json` `8e276875…` → `1ba5a65010a0d2e9e9b2063d6c984a35a5c4e86360fe4242a0a7467f0587d35e`. Comment as row 1. The six other entries, and the file list, are unchanged | Red on both entries. **Cause:** only `scripts` changed. **Criterion 13:** "`dependencies` and `devDependencies` of both `package.json` files, and both `bun.lock` files, are byte-identical to `main`" holds (Verdict, by hand). The whole-file digest still pins `dependencies` and `devDependencies` byte for byte. Introduced `e9d666e` (T-088) |
| 3 | `question-bank/src/conventions-openapi-row-verify.test.ts` › `BASE_SPLIT_LENGTH`, used by "T-105 criterion 2 — nothing else in conventions.md changes › the file has the same number of lines as at base 0b78dec" | pre-existing test (request row 3) | **Modify (re-pin).** `134` → `137`. Its trailing comment becomes "136 lines plus the empty element after the final newline (T-109 CI fix plan row 3: was 134, 133 lines)". `BASE_ROW_INDEX` (15) is unchanged: the new lines are below line 16 | Red, 134 vs 137. **Cause:** **criterion 17** "`conventions.md`'s Formatting paragraph says that both `format` and `format:check` refuse to run …". The worker's diff is +4/−1 in that paragraph only. Introduced `c90cba3` (T-105 tester), protecting the rest of `conventions.md` from T-105's one-row change |
| 4 | same file › `BASE_OTHER_LINES_SHA`, used by "… › every line other than the openapi.yaml and backend/ rows is byte-identical to base, in the same order; the openapi.yaml row is T-105's wording" | pre-existing test (request row 4) | **Modify (re-pin).** `f13eb52a…82e2b` → `db686eed519d06cf99f4e06d49d654f4e5cc31d8588754118a9c4746c91e12f0`. Extend the doc comment: "re-recorded by T-109 (CI fix plan row 4) after its criterion 17 Formatting lines". The `T105_OPENAPI_ROW` exact match is unchanged | Red. Same cause as row 3. **Criterion 17** also says "No other line of `conventions.md` changes except the two Commands-block comments". The new digest still covers every other line, in order. Introduced `c90cba3` (T-105) and re-recorded at `5f6f811` (T-106) |
| 5 | `question-bank/src/climate-far-phrases-verify.test.ts` › the manifest digest literal in "T-090 criterion 17 › every package.json, pyproject.toml and lockfile is byte-identical to 3279555, none added" | pre-existing test (request row 5) | **Modify (re-pin).** `0ce355ae…5c99` → `2cb0b6eef792dba50d54c1a3cdc4ec348f872c67a684904eed171dcfc3e09935`. Add a comment: "re-pinned by T-109 (CI fix plan row 5): both package.json `scripts` changed, deps unchanged". The `MANIFESTS` list and the "none added" equality are unchanged | Red. Same cause and **criterion 13** as row 2. Introduced `57a7fdc` (earliest `-S`), T-090 |
| 6 | `question-bank/src/map-click-no-candidates-verify.test.ts` › the manifest digest literal in "T-092 criterion 15 › every package.json, pyproject.toml and lockfile is byte-identical to 5d72ca5's, none added" | pre-existing test (request row 6) | **Modify (re-pin).** `0ce355ae…5c99` → `2cb0b6eef792dba50d54c1a3cdc4ec348f872c67a684904eed171dcfc3e09935`, with a comment as row 5 | As row 5. Introduced `cf63f66` (T-092 tester) |
| 7 | same file › the `["frontend", [], …]` row of "T-092 criterion 16: no other surface changes › frontend (except []) is byte-identical to 5d72ca5" | pre-existing test (request row 7) | **Modify (re-pin).** `8fcdc634…1030` → `d937109641f1fc3e280718f712c17f8e49b3c50c874a177aacdfd2f8e23ed253`. Add a comment as row 1. The exception list stays `[]` | Red. Same cause as row 1. Introduced `cf63f66` (T-092). The new digest still covers the whole frontend tree |
| 8 | `question-bank/src/hand-check-levels-verify.test.ts` › `AT_AA88101["frontend/package.json"]` and `["question-bank/package.json"]`, in "T-025 criteria 14-17 › criterion 15: every package.json and lockfile is byte-identical to aa88101, and none was added" | pre-existing test (request row 8) | **Modify (re-pin).** The same two new digests as row 2, each with a `// re-pinned by T-109 row 8: …` comment. The other six entries and the "none added" check are unchanged | Red. Same cause and **criterion 13** as row 2. Introduced `57a7fdc` (earliest `-S`), T-025 |
| 9 | same file › the digest literal in "… › criterion 17: every question-bank test file at aa88101 is present and unmodified" | pre-existing test (**not in the request**; added by the ci-fix) | **Modify (re-pin), apply after row 17 (recompute).** `4defd29f…9024` → the digest observed after row 17 (trial value `bc49fef2626ec60724f244013480800e587441c11e1c2245547d2d1ea5b9164b`). Add "Re-pinned by T-109 (CI fix plan row 9, for its row 17)" to the comment chain. The 48-file list is unchanged | Not red now. **It goes red when row 17 lands**: `highest-point-in-state-verify.test.ts` is one of the 48 files it digests. **Cause:** row 17's approved edit. Introduced `57a7fdc` (earliest `-S`), protecting old tests from unapproved edits. **Criterion 18:** "Any existing test this change makes stale goes through … the `ci-fix` plan under the orchestrator". The new digest admits exactly row 17's edit |
| 10 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` › `MAIN_SCRIPTS.format` and `["format:check"]`, used by "T-087 criterion 2 › scripts minus `questions` equals main's scripts exactly" | pre-existing test (request row 9) | **Modify.** The two values become `'bun run src/prettier-pin-guard.ts && prettier --write "src/**/*.ts"'` and `'bun run src/prettier-pin-guard.ts && prettier --check "src/**/*.ts"'`, with a comment naming T-109 row 10. The exact `toEqual` over every script is unchanged | Red. **Cause:** T-109 changes those two scripts. The brief allows it: "`question-bank/package.json` (`scripts` only)", and **criterion 12** keeps the glob `src/**/*.ts`. Still an exact equality, so any other script change still fails. Introduced `40f6c54` (T-087 tester) |
| 11 | same file › `MAIN_BOUNDARY_SHA`, used by "T-087 criterion 15 › every tracked file under the three trees is as re-pinned by T-039, none added or removed" | pre-existing test (request row 10) | **Modify (re-pin).** `8d01f832…4ca6` → `8f22f1550570a47c755496b118aa5e94d35721ac91e9c80799d99d7a2f3915e2`. Add a comment as row 1 | Red. Same cause as row 1. Introduced `40f6c54` (T-087). It still pins all of `backend/`, `frontend/` and `e2e/` |
| 12 | same file › `MAIN_MANIFESTS_EXCEPT_QB_PKG_SHA`, used by "T-087 criterion 16 › every manifest but question-bank/package.json is byte-identical to 0a98e11" | pre-existing test (request row 11) | **Modify (re-pin).** `6d6c9f94…c005` → `274a2b741063b6b20dcd913f861df85bed89dcbb657f1421c242d35c8409b90f`. Add a comment naming `frontend/package.json` scripts | Red. **Cause:** the `frontend/package.json` scripts. **Criterion 13**, as row 2. Introduced `40f6c54` |
| 13 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `MAIN_DEP_SHA`, used by "T-096 criteria 17-21 › criterion 20: every package.json, bun.lock, pyproject.toml and uv.lock is main's" | pre-existing test (request row 12) | **Modify (re-pin).** `9e3ffca9…cabc` → `9b11ae15a8413bed210768c4b21431d7f3b51bda1f478c9d4a29cc5a3361eaba`, with a comment as row 5. `MAIN_DEP_FILES` is unchanged | Red. As row 2. Introduced `47581ea` (T-096 tester) |
| 14 | `question-bank/src/familiarity-drawn-apart-verify.test.ts` › `BEFORE_FILE_SHA["frontend/package.json"]` and `["question-bank/package.json"]`, in "T-085a criteria 23-25 › criterion 23: no package.json, bun.lock, pyproject.toml or uv.lock changed since 5ae564a" | pre-existing test (request row 13) | **Modify (re-pin).** The same two digests as row 2, each with a comment | Red. As row 2. Introduced `b061fd8` (T-085a tester) |
| 15 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `MAIN_SOURCE_TREES_SHA`, used by "T-091 criterion 20 › every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's" | pre-existing test (request row 14) | **Modify (re-pin).** `6b45b3a1…2f21` → `b6ca80cef709e083a78d3c5973ff082c74eec2ebf82c8287c4c6583df509fc93`. Add "Re-pinned by T-109 (CI fix plan row 15): question-bank/src/prettier-pin-guard.ts added" | Red. **Cause:** a new non-test file under `question-bank/src/`, allowed by the brief's "whatever the guard itself needs". Re-pinned rather than exempted, so the guard's bytes are pinned too, which matches the T-087 to T-100 re-pins above it. Introduced `950f334` (T-091 tester) |
| 16 | same file › `MAIN_DEPENDENCY_FILES_SHA`, used by "T-091 criterion 21 › every package.json, bun.lock, backend/pyproject.toml and backend/uv.lock is 12d242e's" | pre-existing test (request row 15) | **Modify (re-pin).** `9e3ffca9…cabc` → `9b11ae15a8413bed210768c4b21431d7f3b51bda1f478c9d4a29cc5a3361eaba`, with a comment | Red. As row 2. Introduced `950f334` |
| 17 | `question-bank/src/highest-point-in-state-verify.test.ts` › `manifests["question-bank/package.json"]` and `["frontend/package.json"]`, in "T-079 tester, criterion 20 — every package.json and bun.lock is byte-identical to 323254c" | pre-existing test (request rows 16, 17) | **Modify (re-pin).** The same two digests as row 2, each with a `// re-pinned by T-109 row 17: …` comment | Two reds. As row 2. Introduced `d16f329` (earliest `-S`), T-079 |
| 18 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `CRITERION_21_ALLOWED`, the count, and `MAIN_UNTOUCHABLE_SHA`, used by "… › criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | pre-existing test (request row 18) | **Modify.** Add **only** `tasks/T-109-format-script-guard.md` and `runs/T-109-format-script-guard.md` to `CRITERION_21_ALLOWED`, with a comment naming this row and its approval. The count goes `280` → `282`, with "T-109 CI fix plan row 18: was 280 (…)" prepended to the trailing comment. `MAIN_UNTOUCHABLE_SHA` goes `c274a19e…3fbf` → `c3039ef32c81b55f2c10f72476fbfa816a40ce064fd7d42ce84d0cfbda28c4e4`, with a re-pin comment line naming `frontend/package.json` and the two guard files | Red at base (the brief is a new tracked file) and redder now (285 vs 280). **Cause:** T-109's brief and run log are new loop records, as every task's are. The two guard files are also new, and `frontend/package.json` moved. **Criterion 18**, as row 9. The guards and `frontend/package.json` stay **counted and digested**, not exempted, so the pin covers strictly more files than before. Introduced `47581ea` (T-096 tester) |
| 19 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `CRITERION_22_ALLOWED`, `MAIN_UNTOUCHABLE_COUNT`, `MAIN_UNTOUCHABLE_SHA`, used by "T-091 criterion 22 › every tracked non-test file outside the allowed list is 12d242e's, and none is added" | pre-existing test (request row 19) | **Modify.** Add only the same two T-109 loop records to `CRITERION_22_ALLOWED`, with a comment naming this row and its approval. `MAIN_UNTOUCHABLE_COUNT` goes `283` → `285`. `MAIN_UNTOUCHABLE_SHA` goes `53524b09…aac0` → `432c7685f085f6f5982b26e5b3620fc96848e0a5e702ff755b0bb4c25bffd05d`, with a re-pin comment line | Red at base and redder now (287 vs 283). Same cause and reading as row 18. Introduced `950f334` (T-091 tester) |
| 20 | same file › `MAIN_TESTS_COUNT`, `MAIN_TESTS_SHA`, used by "T-091 criterion 22 › pre-existing test files are main's, except ones in an approved Test change request" | pre-existing test (**not in the request**; the tester missed it) | **Modify (re-pin), apply after rows 3-4 (recompute).** `MAIN_TESTS_COUNT` `132` → `133`. `MAIN_TESTS_SHA` `c39ee799…81d7` → the digest observed after rows 3-4 are written with their comments (trial value `ca57d9a91634f512cd6a6783e1c0dcc1390c62516f59d5c50e26db372d6fc367`). Add re-pin comment lines naming `format-script-guard.criteria.test.ts` and `conventions-openapi-row-verify.test.ts` | **Red now**, 133 vs 132. **Cause:** the tester's new `question-bank/src/format-script-guard.criteria.test.ts` (commit `6a62404`) is a tracked test file this set counts. The tester saw 19 reds because it ran before committing the file. Rows 3-4 then edit `conventions-openapi-row-verify.test.ts`, which is in this set. Introduced `950f334` (T-091 tester), protecting against test files being changed outside an approved request. **Criterion 18**, as row 9. The new file is this task's own test, and every other test file is still pinned by digest. T-108 needed the same row (its row 3) |
| 21 | same file › `APPLIED_REQUEST_FILE_SHAS` entries for `agriculture-true-wrong-answers-verify.test.ts`, `map-click-no-candidates-verify.test.ts`, `farm-animal-loose-ends-verify.test.ts` and `familiarity-drawn-apart-verify.test.ts`, used by "… › each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | pre-existing test (**not in the request**; added by the ci-fix) | **Modify (re-pin), apply last (recompute).** Set each of the four entries to that file's sha256 after rows 1-2, 6-7, 13 + 18 and 14 respectively are written with their comments. Append `// then by T-109 (CI fix plan row 21, for its rows …)` to each entry's comment chain. The `seed-level-loose-ends` and `test_t089` entries are unchanged. Trial values, for reference only: `4a79c9df…38c2`, `056851e1…9725`, `18e00a9b…b695`, `2847e13c…4749` | Not red now. **It goes red when those rows land**, because each edits a file this map pins by digest. Introduced `bac230d` (T-091 tester, review finding 1), protecting against request files changing beyond their approved re-pins. **Criterion 18**, as row 9. The new digests admit exactly those rows' edits. T-108 needed the same row (its row 4) |

**Order for pass 2:** rows 1-8, 10-19 in any order, then 9, then 20, then 21. After that, run the whole question-bank suite. Expected: 0 fail. Trial: 2875 pass / 0 fail, with `format:check` green.

**Root cause:** no code is wrong. All 18 criteria are met. The 20 reds come from the recurring P-17 pattern: whole-tree, manifest and test-file "nothing else moved" pins written by earlier tasks. They go red on any task that is allowed to change a `package.json` `scripts` block, `conventions.md`, a frontend file, or a source file, or that adds its own brief, run log and test file. T-109 is allowed all of those. Each row restores the pin's strength against this task's allowed change set. Rows 9, 20 and 21 are the second-order pins that digest the test files the other rows edit.

**Not doing:**
- **Exempting `frontend/package.json` and the two guard files in rows 18-19** (adding them to the allowed sets, as T-087 did for `question-bank/package.json`). That would stop those two pins covering them. Re-pinning keeps them counted and digested.
- **Exempting `question-bank/src/prettier-pin-guard.ts` in row 15** instead of re-pinning. That would keep "12d242e's" literally true, but the new file would then be unpinned there. Re-pinning matches the six re-pins already above that constant.
- **Rewriting these pins to read `tasks/`/`runs/` or a task's file set dynamically.** That would stop the recurrence, but it changes what the pins protect. It is a loop change (P-17), not this task's.
- **Touching the guards, the `package.json` scripts or `conventions.md`.** They meet every criterion, so no `source` row.
- **Frontend `react-simple-maps` reds and frontend typecheck.** These are environmental (proxy 403 on install). CI's frontend Test and Typecheck steps are `success` per the Verdict. Nothing here touches them.
- **Moving the question-bank guard to `question-bank/scripts/`** to avoid row 15. That is the worker's judgment call for the reviewer, not a fix.

To approve by hand: fill in Decision, set the header's `CI fix:` to `approved — <name>, <date>` and `Next step` to `ci-fix`, commit, and start a run.

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
