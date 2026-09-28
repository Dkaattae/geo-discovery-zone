# T-071 — `question-bank/` is formatted by a pinned prettier, and CI gates it

**Status:** `working`
**Next step:** `worker`
**Approved:** katechen150621@gmail.com — 2026-09-28, approved via chat in the orchestrator session. See `runs/T-071-question-bank-prettier.md`.
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

**TL;DR — blocked, partially built.** Prettier is pinned and `question-bank/src`
is reformatted (commits `b2f4294`, `6536170`). The next step — deleting the nine
hand-pinned dependency tests the brief tells this task to consolidate — was
**refused by the harness's permission classifier ("Security Test Removal")**,
and the worker may not route around that. A human must either grant that
permission and re-run the worker, or make the removal by hand.

- **Needed from a human (owner: Dkaattae):** allow the worker to remove the nine
  dependency-set pins listed in the survey table (brief "Constraints" already
  scopes this), e.g. by approving the action in an attended session or adding a
  permission rule; then set Next step back to `worker`. Alternatively do the
  removal yourself and hand the rest back to the worker.
- **Not a criteria problem.** Nothing here needs `task-expander`; the criteria
  are fine as written.

### Done so far

| Commit | What |
|---|---|
| `b2f4294` | `question-bank/package.json`: `devDependencies.prettier` = `3.9.6` (exact, via `bun add -d --exact`; same version frontend's lock resolves), scripts `format` (`prettier --write "src/**/*.ts"`) and `format:check` (`prettier --check "src/**/*.ts"`). `question-bank/bun.lock` updated. New `question-bank/.prettierrc` with the four settings from `frontend/.prettierrc`. |
| `6536170` | **Reformat commit (criterion 14)** — output of `bun run format` only; 16 existing `src/**/*.ts` files modified, nothing added/deleted/renamed. |

- The glob `src/**/*.ts` (not `src`) is deliberate: `src/fixtures/*.json` must
  not be formatted (criterion 15).
- After the reformat, `bun test` in `question-bank/` gave **1311 pass, 9 fail** —
  the nine failures are exactly the nine dependency pins (they reject the word
  `prettier` / the new manifest bytes). **No source-scanning test broke** under
  the reformat.

### Not done (blocked behind the removal)

- Removing the nine pins; writing the shared check (planned as a new
  `question-bank/src/dependency-set.test.ts`: key set = the four, no
  `dependencies` key, `prettier` matches `^\d+\.\d+\.\d+$`, `bun.lock` resolves
  the same version; no `git`). Note for whoever resumes: `lint-gate.test.ts`'s
  whole "T-066 criterion 16" describe must go, including its "oxlint is in
  devDependencies; there is no dependencies key" test, or criterion 11 (a)/(b)
  fails in two files.
- CI step (`bun run format:check`), the Lint-step comment in `ci.yml`,
  `conventions.md`, `engineering-decisions.md` E-16, the frontend prettier
  count for the reviewer. None started; the classifier also refused the next
  read of the docs after the first denial, so the worker stopped rather than
  keep probing.

### How to run

`cd question-bank && bun install --frozen-lockfile && bun run format:check && bun test`
— `format:check` exits 0 at `6536170`; `bun test` fails the nine pins until
they are removed.

## Verdict

## Human decision — 2026-09-28

Answer to the worker's blocked question (removing the hand-pinned dependency tests),
given by katechen150621@gmail.com in the orchestrator session, quoted verbatim:

> approved, delete the pins and resume the worker

The deletion of the per-file dependency-pin tests that this brief consolidates into
one shared check is approved by a human, including the related describe block the
worker's Handoff identified. `Next step` is set back to `worker`.
