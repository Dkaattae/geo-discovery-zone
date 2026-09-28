# T-071 — `question-bank/` is formatted by a pinned prettier, and CI gates it

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** katechen150621@gmail.com — 2026-09-28, approved via chat in the orchestrator session. See `runs/T-071-question-bank-prettier.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-071
**Branch:** `claude/nice-euler-247a4f` — assigned to the expander's session by
the harness, branched from `origin/main` at `374a713`. Every later role pushes
here (`CLAUDE.md` "Branches").
**PR:** #63, opened draft at expand time, built from the branch above. It stays
draft until the reviewer approves it. The PR body condenses the criteria; where
they differ, this brief's wording is authoritative.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-28 | cse_01KmyHhDTUDHHNBeuqPkeiKW |
| worker | 2026-09-28 | cse_01KmyHhDTUDHHNBeuqPkeiKW (same remote session id as the expander: the orchestrator spawned this worker as a subagent inside that session) |
| worker (resumed after the human decision) | 2026-09-28 | cse_01KmyHhDTUDHHNBeuqPkeiKW (again a subagent inside the orchestrator's session) |
| tester | 2026-09-28 | cse_01KmyHhDTUDHHNBeuqPkeiKW (a fresh subagent spawned by the orchestrator, so the same session id; see Verdict on independence) |

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

**TL;DR: blocked, not tested. The harness classifier refused the tester too.**
The second human decision sent the removal of the stale dependency pins to the
tester. The harness's auto-mode classifier refused that edit in this session
("Security Test Removal"), just as it refused the worker twice. It then also
refused the next command, which only ran the format-check probes for criteria
4–6 and 10. No agent can clear this. **A human has to delete the pins in an
attended session, or add a permission rule.**

- **Status:** `blocked`. **Next step:** `human`.
- **Needed from a human (katechen150621@gmail.com / Dkaattae), one of:**
  1. **Do the removal by hand.** Use the worker's "Removal to make" list in the
     Handoff: nine tests plus the tenth in `climate-kid-verify.test.ts` and the
     T-066 criterion 16 `describe` in `lint-gate.test.ts`. Also decide the three
     test-count floors the Handoff describes (43→42, 53→52). Commit, then set
     Next step to `tester`.
  2. **Add a harness permission rule** that allows the tester to edit
     `question-bank/src/*.test.ts` on this task, then re-run the tester.
- **Not a criteria problem.** Nothing here goes to `task-expander`.

**Independence.** This is an orchestrated run: `runs/T-071-question-bank-prettier.md`
exists, and `$CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_01KmyHhDTUDHHNBeuqPkeiKW`)
matches the expander and worker rows. So the Sessions-table check proves
nothing. My independence rests only on being a freshly spawned subagent that
never saw the worker's context. That is weaker than a separate session.

**What was and was not established**

| Item | State |
|---|---|
| Branch head matches the Handoff | Confirmed. `package.json` has `"prettier": "3.9.6"` and the `format:check` script. `.prettierrc` has the four settings. `ci.yml` has a `Format` step (`bun run format:check`, same `if:` as Typecheck/Lint/Test). `src/dependency-set.test.ts` exists. |
| `bun install --frozen-lockfile` | Exit 0; no change to `bun.lock`. |
| `bun test` in `question-bank/` at `2adae2c` | **1315 pass / 9 fail.** The 9 failures are the dependency pins the Handoff lists. The tenth (`climate-kid-verify.test.ts` "no dependencies block growth") passes today but would fail under criterion 11(b). |
| Criteria 1–10, 12–15, 17–19 | **Not verified.** No tests written, no mutations run. The classifier refused the probe run before I started. |
| Criteria 11, 16 | **Not met on the branch head.** They cannot be met until the pins are removed. That removal is now the human's to make. |

The working tree was left clean: no partial removal, no probe files.

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
