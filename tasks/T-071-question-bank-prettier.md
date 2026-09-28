# T-071 — `question-bank/` is formatted by a pinned prettier, and CI gates it

**Status:** `test changes requested`
**Next step:** `human`
**Approved:** katechen150621@gmail.com — 2026-09-28, approved via chat in the orchestrator session. See `runs/T-071-question-bank-prettier.md`.
**Test changes:** `requested`
**From:** [`tasks.md`](../tasks.md) T-071
**Branch:** `claude/nice-euler-247a4f` — assigned to the expander's session by
the harness, branched from `origin/main` at `374a713`. Every later role pushes
here (`CLAUDE.md` "Branches").
**PR:** #63, opened draft at expand time, built from the branch above. It stays
draft until the reviewer approves it. The PR body condenses the criteria; where
they differ, this brief's wording is authoritative.
**Fault:** test changes are waiting for approval: nine dependency-pin tests plus one more pin and three count floors that this task makes stale (see `## Test change request`); owner: a person, or the orchestrator's stamp.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-28 | cse_01KmyHhDTUDHHNBeuqPkeiKW |
| worker | 2026-09-28 | cse_01KmyHhDTUDHHNBeuqPkeiKW (same remote session id as the expander: the orchestrator spawned this worker as a subagent inside that session) |
| worker (resumed after the human decision) | 2026-09-28 | cse_01KmyHhDTUDHHNBeuqPkeiKW (again a subagent inside the orchestrator's session) |
| tester | 2026-09-28 | cse_01KmyHhDTUDHHNBeuqPkeiKW (a fresh subagent spawned by the orchestrator, so the same session id; see Verdict on independence) |
| tester (after P-10) | 2026-09-28 | cse_01KmyHhDTUDHHNBeuqPkeiKW (a fresh subagent spawned by the orchestrator, so the same session id; see Verdict on independence) |

## Goal

`question-bank/` has drifted out of prettier and nothing stops it growing, so
every task in the package has to choose between an unreviewable diff and leaving
its own lines unformatted (T-017). Reformat once, pin the formatter, and make CI
fail on drift — and while adding the dependency, collapse the nine tests that
each hand-pin `question-bank/`'s dependency set into one, so the next approved
addition changes one place instead of nine.

**Size:** the queue says S; with the dependency-check consolidation this is
closer to M, and it has more than four criteria, so it is a full brief, not a
light one.

## What is already true, and what is not

Surveyed at `374a713` (current `main`).

- **Dependency approval exists.** katechen150621@gmail.com, 2026-09-25, in chat:
  "allow prettier" — recorded in `tasks.md` T-071. Nothing further is needed
  from a human for the dependency itself.
- **Not present:** `prettier` is not in `question-bank/package.json`; there is
  no prettier config in `question-bank/` or at the repo root (so `bunx prettier`
  there runs on prettier's defaults — `printWidth` 80 — which is how the queue
  entry's "22 files" was counted; the count under the documented settings will
  differ and does not matter).
- **The documented settings already exist**: `conventions.md` "Code" says
  prettier at 100 columns, double quotes, semicolons, trailing commas
  everywhere, and that `question-bank/` "uses the same settings via
  `bunx prettier`". `frontend/.prettierrc` holds exactly those four options.
  The `question-bank/` half of that sentence is currently false — no config,
  unpinned tool — and this task makes it true.
- **CI**: `.github/workflows/ci.yml`'s `question-bank` job runs Install,
  Lockfile unchanged, Typecheck, Lint, Test. Its Lint step comment says
  "Formatting is not checked yet (T-071)". No format step exists.
- **Frontend's prettier** is `^3.7.3` in `frontend/package.json`, resolved to
  `3.9.6` in `frontend/bun.lock`. Frontend has a `format` (write) script and no
  CI format check. That is noted, not in scope (see Out of scope).
- **Nine tests pin the dependency set, not eight.** The queue entry lists eight;
  the survey found a ninth, and it is the one that fails outright on the word
  `prettier`:

  | File | Line (at `374a713`) | What it pins |
  |---|---|---|
  | `question-bank/src/climate-kid-verify.test.ts` | ~1010 | devDependency key set = exactly `@types/bun`, `oxlint`, `typescript` |
  | `question-bank/src/climate-kid.test.ts` | ~773 | same key set |
  | `question-bank/src/landmarks-verify.test.ts` | ~602 | same key set |
  | `question-bank/src/landmarks.test.ts` | ~704 | same key set |
  | `question-bank/src/state-animals.test.ts` | ~749 | same key set |
  | `question-bank/src/region-vocabulary.test.ts` | ~368 | same key set |
  | `question-bank/src/top-crops-verify.test.ts` | ~138, ~519 | `DEPENDENCY_DIGESTS`: sha256 of `package.json` and `bun.lock` |
  | `question-bank/src/highest-point-verify.test.ts` | ~585–607 | dependency blocks vs `origin/main`, `oxlint` allowed by name; returns early on a shallow clone |
  | `question-bank/src/lint-gate.test.ts` | ~362–371 (T-066 criterion 16) | **forbids any devDependency whose name includes `prettier`** |

- **Decision taken in this brief, as the queue entry asked:** replace the nine
  with **one** shared "approved dependency set" check (criteria 11–13), rather
  than editing all nine again. The per-file pins are removed; the shared check
  is the single place the next approved addition changes. T-066's criterion 17
  test (no `trustedDependencies` / `overrides` / `resolutions`) is not a
  dependency-set pin and stays.
- **Many tests read `.ts` source text and match on it** (e.g.
  `readFileSync(join(PKG, "src/curated/us-states.ts"))` in `climate-kid.test.ts`,
  `landmarks.test.ts`, `state-animals.test.ts`, `fun-facts.test.ts`,
  `landmarks-verify.test.ts`, `climate-kid-verify.test.ts`,
  `top-crops-verify.test.ts`; self-reads in several). A reformat may move text
  those patterns expect. That is a risk for the worker to handle, not a reason to
  exclude a file from formatting (criterion 7).

## Acceptance criteria

**Frozen once approved.** They change only by going back through
`task-expander` for a fresh approval, never by an edit during implementation and
never by the tester.

"The format check" below means the command the `question-bank` CI job runs for
formatting (criterion 8), run from `question-bank/`.

**Pinned formatter and its settings**

1. `question-bank/package.json` `devDependencies.prettier` is an exact version
   string — it matches `^3\.\d+\.\d+$`, with no `^`, `~`, range, tag or URL.
2. `question-bank/bun.lock` resolves `prettier` to exactly the version in
   criterion 1, and `bun install --frozen-lockfile` in `question-bank/` succeeds
   without modifying `bun.lock`.
3. For any `.ts` file under `question-bank/src/`, the options prettier resolves
   from `question-bank/`'s committed configuration are `printWidth: 100`,
   `semi: true`, `singleQuote: false`, `trailingComma: "all"` — the settings
   `conventions.md` "Code" documents.

**The gate**

4. On the branch head, the format check exits 0.
5. With one extra file `question-bank/src/<probe>.ts` whose content is valid
   TypeScript that prettier would reformat (for example `const  x = {a:1}`),
   the format check exits non-zero and its output names that file. Removing the
   probe returns it to exit 0.
6. Criterion 5 holds for a probe nested one directory down,
   `question-bank/src/sinks/<probe>.ts`, as well — the gate is not limited to
   the top level of `src/`.
7. No `.ts` file under `question-bank/src/` is exempt from the format check:
   no `.prettierignore` (anywhere prettier would read it from `question-bank/`)
   matches one, the check's file arguments do not leave one out, and no line of
   any file under `question-bank/src/` is a prettier-ignore directive (a line
   whose trimmed text begins with `// prettier-ignore` or
   `/* prettier-ignore`). A test may still mention the word inside a string.
8. `.github/workflows/ci.yml`'s `question-bank` job has a step whose `run` is
   exactly `bun run <script>`, where `<script>` is a key of
   `question-bank/package.json` `scripts` whose value invokes `prettier` in
   check mode (`--check`, not `--write`). That step's `if:` is
   `${{ !cancelled() && steps.install.outcome == 'success' }}`, the same as the
   job's Typecheck, Lint and Test steps.
9. No other job in `ci.yml` changes, and no comment in the `question-bank` job
   still says formatting is not checked.
10. Criteria 4 and 5 hold with all six proxy variables (`HTTP_PROXY`,
    `HTTPS_PROXY`, `ALL_PROXY` and their lowercase forms) set to
    `http://127.0.0.1:1` — the format check needs no network (T-005).

**One shared dependency check**

11. Adding a devDependency to `question-bank/package.json` (for example
    `"left-pad": "1.3.0"`, without installing it) makes `bun test` in
    `question-bank/` fail, and **every** failing test is in one and the same
    test file. The same holds, with the same single file, for (a) removing
    `oxlint` from `devDependencies` and (b) adding a `dependencies` key with one
    entry. Run this in a full (non-shallow) clone, so that a check which only
    skips on shallow clones is still exercised.
12. That shared check passes on the branch head, where `devDependencies` is
    exactly `@types/bun`, `oxlint`, `prettier`, `typescript` and there is no
    `dependencies` key; and it does not spawn `git` or read anything outside the
    working tree, so it gives the same verdict on a shallow CI checkout.
13. Changing `devDependencies.prettier` from the exact version to a range (for
    example `^` plus the same version) makes at least one test in
    `question-bank/` fail — the pin of criterion 1 is guarded, not just true
    today.

**The reformat is only a reformat**

14. The branch contains a commit — the "reformat commit", identified by hash in
    the Handoff — that modifies only existing `question-bank/src/**/*.ts` files
    (it adds, deletes and renames none), and for every file it modifies, the
    file's content after the commit is byte-identical to the output of the
    pinned prettier, with `question-bank/`'s committed configuration from the
    branch head, run on that file's content in the commit's parent.
15. No file under `question-bank/data/`, `question-bank/sample-data/` or
    `question-bank/src/fixtures/` differs between `origin/main` at `374a713`
    and the branch head.

**Nothing else moves**

16. `bun test`, `bun run typecheck` and `bun run lint` in `question-bank/` all
    exit 0 on the branch head, and `bun test` in `frontend/` exits 0 (its
    `conventions-doc.test.ts` reads `question-bank/package.json` and
    `conventions.md`).
17. `question-bank/package.json` has no `trustedDependencies`, `overrides` or
    `resolutions` key, and no devDependency besides the four in criterion 12
    (no prettier plugin, no `eslint-config-prettier`).
18. `conventions.md` no longer contains the text `bunx prettier`, and its
    Commands block lists the question-bank format check as `bun run <script>`
    with the same script name as criterion 8.
19. `engineering-decisions.md` has a new entry headed `## E-16`, following
    E-15, that records (a) prettier as `question-bank/`'s formatter, pinned to an
    exact version, and why exact; and (b) that the nine hand-pinned dependency
    checks were replaced by one, naming the file that now holds it. No existing
    `E-n` entry's text changes.

## Out of scope

- **Reformatting `frontend/`, `e2e/`, `backend/` or the repo root.** The worker
  runs the frontend's own prettier check once and records in the Handoff how
  many files it flags; if any, the reviewer files a queue entry. Frontend's
  prettier stays at `^3.7.3`.
- **A CI format check for `frontend/`.** Same: a finding for the reviewer, not a
  change here.
- **Formatting JSON, Markdown or anything outside `question-bank/src/**/*.ts`.**
  The committed bank and the fixture are reproduced byte-for-byte by the offline
  rebuild (E-6) and must not be touched (criterion 15).
- **`.git-blame-ignore-revs`** or any other blame tooling for the reformat
  commit.
- **T-070's digest guards on the bank files** (`landmarks-verify`,
  `climate-kid-verify`, `top-crops-verify` bank digests) and its two silent-git
  paths. Only the *dependency* pins in those files are this task's — the bank
  digests stay exactly as they are.
- **Changing oxlint's configuration or version.**
- **Aligning `frontend/`'s prettier version with `question-bank/`'s.**
- **Updating `PROGRESS.md`** — the reviewer's sweep does that
  (`PROGRESS.md:112` still says formatting is ungated).

## Constraints

- **Files expected to change:**
  - `question-bank/package.json`, `question-bank/bun.lock` — the dependency and
    the script.
  - A prettier config file in `question-bank/` (worker's choice of format).
  - `question-bank/src/**/*.ts` — the reformat commit (criterion 14).
  - The nine test files in the survey table, to remove their dependency-set
    pins — **and only those pins**; every other assertion in them stays.
  - One test file holding the shared dependency check — new, or one of the nine;
    worker's choice, named in the Handoff and in E-16.
  - `.github/workflows/ci.yml` — the `question-bank` job only.
  - `conventions.md`, `engineering-decisions.md`.
  - `.prettierignore` in `question-bank/` only if needed, and then subject to
    criterion 7.
- **Commit separation:** the reformat commit (criterion 14) contains nothing
  but formatting. Dependency, config, CI, doc and test-logic changes go in other
  commits.
- **Dependencies:** `prettier` only, approved (see survey). Nothing else — no
  plugin, no `eslint-config-prettier` (`question-bank/` lints with oxlint, E-15).
  Install with `bun add`; commit `bun.lock` with it.
- **No network in tests.** Any test that runs the format check spawns the
  locally installed binary via the package script, never `bunx` (which resolves
  from the network).
- **A source-scanning test that breaks under the reformat is fixed in the test's
  pattern**, not by excluding the scanned file from formatting (criterion 7).
- **Do not weaken any other assertion** in the nine files while removing the
  dependency pins; the bank-digest guards in particular are T-070's.
- **`ci.yml` is not a gated path** (`run-loop.sh` `GATED_PATHS`); T-005, T-006,
  T-008 and T-066 all changed it inside the loop.

## Context

Required reading for the worker and the tester.

- `tasks.md` T-071 — the queue entry, the dependency answer, and T-066's
  reviewer's amendment listing the pins.
- `engineering-decisions.md` **E-15** (oxlint, and why `question-bank/` is not
  on eslint), **E-4** (the limit lives in the script so local and CI agree),
  **E-6** (the committed bank is reproduced byte-for-byte), **E-11/E-12** (house
  style for an entry that removes tests).
- `conventions.md` "Code" (the formatting settings) and "Commands".
- `frontend/.prettierrc` — the four settings, as they are written in the
  sibling package.
- `.github/workflows/ci.yml` — the `question-bank` job, and the `frontend`
  job's comments on why steps are gated on `steps.install.outcome`.
- `question-bank/src/lint-gate.test.ts` — the shape T-066's tester used to test a
  gate through its package script with probe files under `src/`, including
  cleanup in `afterEach` and parsing the `question-bank` job out of `ci.yml`.
  Criterion 16 there is one of the nine pins.
- `question-bank/src/offline-rebuild.ts` — exports `DEAD_PROXY`, the proxy
  environment used for criterion 10.
- `question-bank/src/committed-bank.test.ts` — the offline byte-for-byte rebuild
  that criterion 15 protects.
- `test-guidelines.md` — no network in tests; test through the real entry point.
- `CLAUDE.md` "Packages" and "Tests".

## Handoff

**TL;DR: blocked again, on the same single step.** Everything except removing the
nine dependency pins is now built and pushed. The harness's permission
classifier refused that removal a **second time** ("Security Test Removal"), even
though the human decision below is recorded in the brief. A decision written
into a file by the orchestrator does not clear the harness's permission check,
and the worker may not route around it. A human has to **make the removal by
hand** (the exact edit list is below and takes about ten minutes) or **add a
permission rule** and re-run the worker.

- **Needed from a human (owner: Dkaattae / katechen150621@gmail.com):** either
  (1) apply the "Removal to make" list below yourself, commit as
  `T-071: remove the nine dependency pins (human)`, and set Next step to
  `worker` for the Handoff refresh, or straight to `tester` if the suite is
  green; or (2) allow the action in an attended session or in the harness
  settings, then re-run the worker.
- **Not a criteria problem.** The criteria are fine as written. This does not
  need to go to `task-expander`.

### Commits on the branch

| Commit | What |
|---|---|
| `b2f4294` | `question-bank/package.json`: `devDependencies.prettier` = `3.9.6` (exact, via `bun add -d --exact`; the same version frontend's lock resolves), plus the `format` (`prettier --write "src/**/*.ts"`) and `format:check` (`prettier --check "src/**/*.ts"`) scripts. Updated `question-bank/bun.lock`. New `question-bank/.prettierrc` with the four settings from `frontend/.prettierrc`. |
| `6536170` | **The reformat commit (criterion 14).** Output of `bun run format` only. It modifies 16 existing `src/**/*.ts` files and adds, deletes or renames nothing. |
| `505cfe9` | `ci.yml` `question-bank` job: new `Format` step, `run: bun run format:check`, with the same `if:` as Typecheck, Lint and Test. The Lint comment's "Formatting is not checked yet (T-071)" is gone, and no other job changed. New `question-bank/src/dependency-set.test.ts` (the shared check). `conventions.md`: `bunx prettier` is removed, and the Commands block lists `bun run format:check`. `engineering-decisions.md`: new `## E-16` after E-15, with no existing entry touched. |

### Criteria: where each lives

| # | Where | State |
|---|---|---|
| 1, 2 | `question-bank/package.json` `"prettier": "3.9.6"`; `bun.lock` resolves `prettier@3.9.6` | done |
| 3 | `question-bank/.prettierrc` | done |
| 4–7, 10 | script `format:check` = `prettier --check "src/**/*.ts"`; no `.prettierignore`; no ignore directives | done. Exits 0 on `505cfe9`. Seen failing on an unformatted `src/dependency-set.test.ts` before I formatted it. The tester still needs to check probes, the nested probe and the dead proxy. |
| 8, 9 | `.github/workflows/ci.yml`, `Format` step | done |
| 11, 12 | `question-bank/src/dependency-set.test.ts` | **the check exists and passes (4/4), but 11 fails until the nine pins are removed.** Today any change to the dependency set fails in up to 10 files. |
| 13 | `dependency-set.test.ts` "prettier is pinned to an exact version" (`/^3\.\d+\.\d+$/`) | done |
| 14 | `6536170` | done |
| 15 | untouched: the glob is `src/**/*.ts`, so no JSON gets formatted | done |
| 16 | question-bank typecheck and lint exit 0. `bun test` is **1315 pass / 9 fail**, and the 9 are exactly the pins. | **blocked on the removal** |
| 17 | package.json | done |
| 18 | `conventions.md` | done |
| 19 | `engineering-decisions.md` E-16. Its part (b) describes the end state ("replaced by `dependency-set.test.ts`"), which is true only once the removal lands. | done, conditional on the removal |

### Removal to make (the blocked step), exact

Delete these tests and change nothing else in their files:

1. `climate-kid-verify.test.ts`: test `"question-bank declares no runtime dependency and the same two devDependencies"`, **and** test `"the only package.json under question-bank/ still has no dependencies block growth"`. The second one is **not in the survey table**. It asserts `package.json` has no `"dependencies"` text, so leaving it in makes criterion 11(b) fail in two files. It is a dependency-set pin in all but name.
2. `climate-kid.test.ts`: test `"question-bank/package.json still declares no runtime dependency and the same two devDependencies"`.
3. `landmarks-verify.test.ts`: test `"question-bank still declares no runtime dependency and the same two devDependencies"`.
4. `landmarks.test.ts`: the same-named test as in 2.
5. `state-animals.test.ts`: the same-named test as in 2.
6. `region-vocabulary.test.ts`: test `"question-bank declares no runtime dependency and the same two devDependencies as before this task"`.
7. `top-crops-verify.test.ts`: the `DEPENDENCY_DIGESTS` constant and its docstring, and the test `"package.json and bun.lock are byte-identical to the default branch"`. Leave the bank digests alone (they belong to T-070).
8. `highest-point-verify.test.ts`: test `"question-bank/package.json lists exactly the dependencies the default branch listed"`, plus any helper only it uses.
9. `lint-gate.test.ts`: the whole `describe("T-066 criterion 16 — …")` block (both tests). Also drop `devDependencies` / `dependencies` from its `packageJson()` type if nothing else reads them, or oxlint may flag them as unused.

**Test-count floors: a knock-on the brief did not foresee.** Two T-014/T-013
"nothing weakened" tests count `test(` lines per file:
`climate-kid-verify.test.ts` `FLOORS` has `state-animals.test.ts: 43` and
`landmarks.test.ts: 53`, and `landmarks-verify.test.ts` `FLOORS` has
`state-animals.test.ts: 43`. Those files currently hold **exactly** 43 and 53
tests, so removing one pin from each drops them below their floors and turns 3
floor tests red. Expectation floors still hold (76 ≥ 73 and 91 ≥ 88 after
removal). **What I propose:** lower those three `tests` floors by exactly 1
(43→42, 53→52), each with a comment citing T-071/E-16. The floors exist to
catch *unapproved* deletion, and this deletion is approved. **Who confirms:**
the human making the removal, then the reviewer. The alternative, padding
the files with a replacement test to keep the count, would be manufacturing
a test to satisfy a counter.

### Not done, and why

- **The nine removals and the floor adjustment** are blocked, as above.
- **PROGRESS.md** was not touched: that is the reviewer's sweep, and it is out of
  scope.

### Findings for the reviewer

- **Frontend prettier check:** `prettier --check .` in `frontend/` (its own
  3.9.6) flags **4 files**: `AGENTS.md`, `README.md`, `src/routes/README.md`,
  `src/styles.css`. None is a `.ts`/`.tsx` file. **Owner: reviewer**, to file a
  queue entry or not.
- **Frontend environment in this session was incomplete.** `bun install
  --frozen-lockfile` in `frontend/` got a 403 from the npm mirror on
  `d3-ease-2.0.0.tgz`, so `react-simple-maps` is missing and `bun run typecheck`
  fails in `UsMap.tsx`. `bun test` in `frontend/` gave 342 pass / 1 fail (one
  lint-gate test; a timing-sensitive `bun run lint` test that also failed with
  5 more on a first cold run). `src/conventions-doc.test.ts`, the one frontend
  test this task can affect, is **80/80 pass**. This task changes no frontend
  file. **Owner: tester**, to re-run `frontend/` in a clean environment for
  criterion 16.

### How to run

```bash
cd question-bank && bun install --frozen-lockfile
bun run format:check      # exit 0 at 505cfe9
bun run typecheck && bun run lint
bun test                  # 1315 pass / 9 fail until the pins are removed; then expect 3 floor failures unless the floors are adjusted
bun test src/dependency-set.test.ts   # 4 pass
cd ../frontend && bun test src/conventions-doc.test.ts
```

## Verdict

**TL;DR: test changes requested, and no other finding.** Every criterion that does
not depend on the stale pins holds: 18 of 19, checked by 21 new tests in
`question-bank/src/prettier-gate.test.ts` or by hand. Criteria **11 and 16** cannot
hold until 10 stale pin tests are deleted and 3 count floors lowered, and that
needs approval first (D-14). The rows are in `## Test change request` below. I
changed none of those tests in this run.

- **Status:** `test changes requested`. **Next step:** `human`. **Test changes:** `requested`.
- **Needed:** approval of the 13 rows below. A person can decide row by row, or the
  orchestrator can stamp the request under its unattended-run rule. Then a fresh
  tester makes exactly those edits and re-runs criteria 11 and 16.
- **No fail, no blocked criterion.** Nothing goes back to the worker or to
  `task-expander`.

**Independence.** This is an orchestrated run: `runs/T-071-question-bank-prettier.md`
exists, and `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01KmyHhDTUDHHNBeuqPkeiKW`, the
same id as the expander and worker rows. So the Sessions-table check proves nothing.
My independence rests only on being a freshly spawned subagent that never saw the
worker's context. That is weaker evidence than a separate session. Expected values
came from the criteria. I read the implementation for entry points only: the script
name and file paths.

### Criteria

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `prettier-gate.test.ts` "criterion 1". Mutation `3.9.6` → `^3.9.6` turns it red. |
| 2 | met | "criterion 2" (every `prettier@` entry in `bun.lock` equals the pin). `bun install --frozen-lockfile`: exit 0, and `git status` shows `bun.lock` unchanged. |
| 3 | met | "criterion 3": `prettier.resolveConfig` for **every** `.ts` under `src/`, with defaults applied, gives 100/true/false/"all". The config file resolves inside `question-bank/`. Mutation `printWidth` 80 turns it red. |
| 4 | met | "criterion 4": `bun run format:check` (script name read from ci.yml's step) exits 0. |
| 5, 6 | met | Probes `src/t071-probe.ts` and `src/sinks/t071-probe.ts`, each containing `const  x = {a:1}`: the check exits non-zero and names the file, then exits 0 once the probe is removed. Mutation glob `src/*.ts` turns the nested probe red. |
| 7 | met | No `.prettierignore` in `src/`, `question-bank/` or the repo root, and no ignore directive line. Coverage: the real script run with `--use-tabs --no-semi` flags **every** `.ts` under `src/`, through its own globs and ignore files (`.gitignore` included). Mutations: a `.prettierignore` with `src/queries/` turns 2 tests red, and a `// prettier-ignore` probe turns 1 red. |
| 8 | met | "criterion 8": the step `run` is exactly `bun run format:check`, the script uses `--check` and not `--write`, and its `if:` equals that of Typecheck, Lint and Test. Mutations: `--write` in the script turns 9 red; removing `!cancelled() &&` from the Format `if:` turns the `if:` test red. |
| 9 | met | Test: no comment in the job says formatting is not checked. By hand: `git diff 374a713 HEAD -- ci.yml` touches only the question-bank job (one comment line trimmed, the Format step added). |
| 10 | met | "criterion 10": criteria 4 and 5 hold with `DEAD_PROXY` (all six variables). |
| 11 | **not met yet: stale pins** | By hand, in a **full** clone (`is-shallow-repository` = false). With `left-pad` added, failures spread across **11 files**. With `oxlint` removed, 11 files. With a `dependencies` key, 11 files. The shared check `dependency-set.test.ts` fails in every case. Everything else failing is a request row below, apart from my own first draft's duplicate pin, which I removed (see note). |
| 12 | met | `dependency-set.test.ts` passes, 4/4. Test "criterion 12": the file imports no process-spawning API, runs no `git`, and reads only `package.json`/`bun.lock` under `QB_ROOT`. Mutation: an added `execSync` import turns it red. |
| 13 | met | By hand: `^3.9.6` turns red 2 tests in `dependency-set.test.ts` and 2 in `prettier-gate.test.ts`. |
| 14 | met | By hand: `6536170` is 16 × `M`, all `question-bank/src/**/*.ts`, with nothing added, deleted or renamed. For each file, parent content piped through the pinned `node_modules/.bin/prettier --stdin-filepath` with the head's `.prettierrc` is byte-identical (`cmp`) to the committed content: **16/16**. |
| 15 | met | By hand: `git diff --stat 374a713 HEAD -- question-bank/data question-bank/sample-data question-bank/src/fixtures` is empty. |
| 16 | **not met yet: stale pins** | question-bank: typecheck 0, lint 0 (0 warnings), `bun test` **1336 pass / 9 fail**, and the 9 failures are rows 1, 3–10 below. frontend: `conventions-doc.test.ts` 80/80. The full frontend `bun test` gave 340 pass / 3 fail, all environmental: the npm mirror returned 403 on `d3-drag-2.0.0.tgz`, so `react-simple-maps` is missing, and two lint-gate tests hit the 5 s timeout while `bun run lint` alone takes 4.5 s and exits 0. No frontend file differs between `374a713` and HEAD. **Re-run the frontend in a clean environment** before the final pass. |
| 17 | met | "criterion 17": no `trustedDependencies`, `overrides` or `resolutions` key. The four-name set is pinned by the shared check. |
| 18 | met | "criterion 18": `bunx prettier` is absent, and the `## Commands` block has `bun run format:check`, the same script as CI. |
| 19 | met | "criterion 19": `## E-16` directly follows E-15 and names prettier, exact, why, the nine and `dependency-set.test.ts`. By hand: `git diff 374a713 HEAD -- engineering-decisions.md` deletes 0 lines. |

**Mutations** (all reverted; `git status` clean apart from the new test file) are
shown inline above. None of the 21 tests stayed green under the mutation aimed at it.

**Note on criterion 11 and my own tests.** My first draft also pinned the
four-name set in `prettier-gate.test.ts`, which made it an eleventh file failing
on `left-pad`. I removed that test. Criterion 12's "passes on the head" is now
evidenced by the shared check's own run, not by a second copy of the set.

**Run with:** `cd question-bank && bun test src/prettier-gate.test.ts` (21 pass,
about 15 s, spawns the format script 7 times).

## Test change request

Raised by the tester, 2026-09-28. The Handoff's "Removal to make" list was checked
independently. I confirmed each row by running criterion 11's three mutations in a
full clone and recording which tests failed, and by counting `test(` lines against
the floors. I added nothing beyond the Handoff's list except the floor rows, which
the Handoff proposed but did not list as rows. Every deleted test pins
`question-bank/`'s dependency set, which criterion 11 requires to be pinned in
exactly one file (`dependency-set.test.ts`, E-16).

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `src/climate-kid-verify.test.ts` › "T-014 tester, criterion 18 — nothing unreviewed, live or new is committed" › "question-bank declares no runtime dependency and the same two devDependencies" | `775671c`, T-014 tester: no new dependency | Pins devDependencies to `@types/bun`/`oxlint`/`typescript`, so it fails today on `prettier` and fails under all three criterion 11 mutations. Criterion 11 requires one file. | delete | — | |
| 2 | `src/climate-kid-verify.test.ts` › same describe › "the only package.json under question-bank/ still has no dependencies block growth" | `775671c`, T-014 tester: no runtime dependency | Passes today, but fails under criterion 11(b) (`dependencies` key), making a second failing file. Not in the brief's survey table. | delete | — | |
| 3 | `src/climate-kid.test.ts` › "T-014 criterion 18 — nothing unreviewed, live or new is committed" › "question-bank/package.json still declares no runtime dependency and the same two devDependencies" | `bc544e3`, T-014 worker: no new dependency | As row 1. | delete | — | |
| 4 | `src/landmarks-verify.test.ts` › "T-013 tester, criterion 13 — nothing unreviewed, live or new is committed" › "question-bank still declares no runtime dependency and the same two devDependencies" | `8b5bb81`, T-013 tester: no new dependency | As row 1. | delete | — | |
| 5 | `src/landmarks.test.ts` › "T-013 criterion 13 — nothing unreviewed, live or new is committed" › "question-bank/package.json still declares no runtime dependency and the same two devDependencies" | `93fc433`, T-013 worker: no new dependency | As row 1. | delete | — | |
| 6 | `src/state-animals.test.ts` › "T-012 criterion 11 — nothing unreviewed, live or new is committed" › "question-bank/package.json still declares no runtime dependency and the same two devDependencies" | `17ddab1`, T-012 tester: no new dependency | As row 1. | delete | — | |
| 7 | `src/region-vocabulary.test.ts` › "T-017 criterion 8 — no new dependency, no network" › "question-bank declares no runtime dependency and the same two devDependencies as before this task" | `e4fc36b`, T-017 tester: no new dependency | As row 1. | delete | — | |
| 8 | `src/top-crops-verify.test.ts` › "T-015 tester, criterion 10 — no new dependency" › "package.json and bun.lock are byte-identical to the default branch", **with** the `DEPENDENCY_DIGESTS` constant and its docstring, which only this test uses | `313d72d`, T-015 tester: no new dependency, by sha256 | Its digests fail on any change to either file, including this task's approved one. The bank digests in the same file (T-070) are **not** part of this row. | delete | — | |
| 9 | `src/highest-point-verify.test.ts` › "T-016 tester, criteria 14 and 15 — no dependency, nothing out of scope" › "question-bank/package.json lists exactly the dependencies the default branch listed" | `34a174a`, T-016 tester: no new dependency vs `origin/main`, allowing `oxlint` | Fails on `prettier`, and spawns `git` (criterion 12's design moves the check off git). The Alaska-landmark test in the same describe stays. | delete | — | |
| 10 | `src/lint-gate.test.ts` › "T-066 criterion 16 — the only package added is oxlint, as a devDependency" › both tests: "oxlint is in devDependencies; there is no dependencies key" and "none of the excluded packages is present" (the whole `describe`) | `23a0576`, T-066 tester: only oxlint was added, no eslint or prettier | The second test forbids any name containing `prettier`, so it fails today. The first fails under criterion 11(a) and (b). Any `packageJson()` type fields left unused go with them. | delete | — | |
| 11 | `src/climate-kid-verify.test.ts` › "T-014 tester, criterion 19 — nothing already verified is weakened" › `FLOORS["state-animals.test.ts"]` | `775671c`, T-014 tester: count floor | Row 6 removes 1 test from a file at exactly 43. | modify | `state-animals.test.ts` floor `{ tests: 42, expects: 73 }`, with a comment citing T-071 row 6. Expects are unchanged: 78 → 76 is still ≥ 73. | |
| 12 | same file and describe › `FLOORS["landmarks.test.ts"]` | `775671c`, T-014 tester: count floor | Row 5 removes 1 test from a file at exactly 53. | modify | `landmarks.test.ts` floor `{ tests: 52, expects: 88 }`, with a comment citing T-071 row 5. Expects are unchanged: 93 → 91 is still ≥ 88. | |
| 13 | `src/landmarks-verify.test.ts` › "T-013 tester, criterion 14 — nothing already verified is weakened" › `FLOORS["state-animals.test.ts"]` | `8b5bb81`, T-013 tester: count floor | Row 6 removes 1 test from a file at exactly 43. | modify | `state-animals.test.ts` floor `{ tests: 42, expects: 70 }`, with a comment citing T-071 row 6. | |

No other floor moves. `landmarks-verify.test.ts` sits at 37 tests, 73 expects,
against a floor of 36 and 69 in `climate-kid-verify.test.ts`. After row 4 it has
36 and 71, so it still holds.

To approve by hand: fill in Decision on each row, set the header's `Test
changes:` to `approved — <name>, <date>`, and set `Next step: tester`.

## Human decision — 2026-09-28

Answer to the worker's blocked question (removing the hand-pinned dependency tests),
given by katechen150621@gmail.com in the orchestrator session, quoted verbatim:

> approved, delete the pins and resume the worker

The deletion of the per-file dependency-pin tests that this brief consolidates into
one shared check is approved by a human, including the related describe block the
worker's Handoff identified. `Next step` is set back to `worker`.

## Human decision — 2026-09-28 (second)

Answer to the worker's second blocked question, given by katechen150621@gmail.com in
the orchestrator session, quoted verbatim:

> only testers can delete tests. workers cannot. if the tests is stale or wrong in ci, send tester in to fix it.

This supersedes the first decision's route: the worker does not delete tests. Removing
or adjusting tests that this task makes stale or wrong is the tester's job. `Next step`
is set to `tester`.
