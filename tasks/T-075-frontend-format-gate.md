# T-075 — `frontend/` gets a pinned prettier and a CI format gate

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** Dkaattae — 2026-09-29 (given in the orchestrator's session). See `runs/T-075-frontend-format-gate.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-075
**Branch:** `claude/dazzling-hawking-13k700` — assigned to the expander's session
by the harness, branched from `origin/main` at `f3af87b`. Every later role pushes
here (`CLAUDE.md` "Branches").
**PR:** #66, opened draft at expand time, built from the branch above. It stays
draft until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-29 | cse_018Nxo8DLTPmamkPxrMGkzpY |
| worker | 2026-09-29 | cse_018Nxo8DLTPmamkPxrMGkzpY (same id as the expander's: the orchestrated run spawns both inside one harness session) |
| tester | 2026-09-29 | cse_018Nxo8DLTPmamkPxrMGkzpY (same id again: orchestrated run, see `runs/T-075-frontend-format-gate.md`; independence is a freshly spawned agent's context, not a separate session — see Verdict) |

## Goal

`frontend/` has prettier settings and a `format` script but nothing fails when a
file drifts, and four files already have. Reformat them once, pin prettier to the
exact version `question-bank/` uses, and make CI fail on drift — the same gate
T-071 gave `question-bank/`, so the two packages stop disagreeing about what
"formatted" means.

**Size:** the queue says S, and the work is S. The criteria run past four, so
this is a full brief, not a light one (`process.md`, "The light path").

## What is already true, and what is not

Surveyed at `f3af87b` (current `main`). No build, test or prettier run was made
for this survey (expander role, D-7); "flags 4 files" is T-071's worker's
observation as recorded in `tasks.md`.

- **Already true — settings.** `frontend/.prettierrc` holds the four documented
  settings (`printWidth: 100`, `semi: true`, `singleQuote: false`,
  `trailingComma: "all"`), identical to `question-bank/.prettierrc`. Nothing to do.
- **Already true — an ignore file.** `frontend/.prettierignore` exists and
  excludes `node_modules`, `dist`, `.output`, `.vinxi`, `pnpm-lock.yaml`,
  `package-lock.json`, `bun.lock` and `routeTree.gen.ts` (generated, and
  tracked at `frontend/src/routeTree.gen.ts`). It stays as it is (criterion 8).
- **Already true — the resolved version.** `frontend/bun.lock` already resolves
  `prettier@3.9.6` (line 866), the same version and integrity hash as
  `question-bank/bun.lock`. Only the *specifier* is a range: `"^3.7.3"` in
  `frontend/package.json` and in `bun.lock`'s workspace block (line 80). So
  pinning is a specifier change, not a version change.
- **Already true — `.ts`/`.tsx`/`.js`/`.mjs` are gated, indirectly.**
  `frontend/eslint.config.js` ends with `eslint-plugin-prettier/recommended`, so
  CI's existing `bun run lint` already fails on a prettier diff in any file eslint
  lints, using the same installed prettier and `.prettierrc`. That is why none of
  the four drifted files is TypeScript. What nothing gates is Markdown, CSS and
  JSON — which is what the four are.
- **Already true — a write script over `.`.** `"format": "prettier --write ."`.
- **Not present:** a `format:check` script; a Format step in CI's `frontend`
  job; an exact pin.
- **The four drifted files:** `frontend/AGENTS.md`, `frontend/README.md`,
  `frontend/src/routes/README.md`, `frontend/src/styles.css`.
- **No `prettier-ignore` directive** exists anywhere in tracked `frontend/` files.
- **No existing frontend test pins `frontend/`'s devDependencies or the frontend
  job's step list**, as far as a grep for `prettier`, `devDependencies` and
  `Format` under `frontend/src/` shows. The T-071 tests in
  `question-bank/src/prettier-gate.test.ts` and `dependency-set.test.ts` read only
  `question-bank/` and the `question-bank` job, and `question-bank/` does not
  change here. No stale test is expected; if the worker finds one, it goes under
  **Tests made stale** in the Handoff, not into an edit.

## Decisions made in this brief — the approver should check them

The queue entry left two things to decide. They are engineering calls, not
product ones, so the brief makes them; approving the brief approves them.

1. **The glob is `.`**, not source only. The existing `format` script already
   writes `.`, and a check narrower than the writer would let `bun run format`
   produce changes CI never asks for. Source-only would also gate nothing new:
   `.ts`/`.tsx` are already gated through eslint (above), and all four drifted
   files are Markdown or CSS. Frontend Markdown is read by people and agents,
   never by a child, so no content rule applies (`tasks.md` T-075).
2. **The version is `3.9.6`, exact** — `question-bank/`'s pin, and already what
   `frontend/bun.lock` resolves. This is re-pinning an existing devDependency,
   **not adding a dependency**: no package enters either lockfile. It is named
   here because `CLAUDE.md` "Packages" asks for dependency changes to be seen.

**One risk, accepted rather than designed around:** `frontend/AGENTS.md` is a
`<!-- LOVABLE:BEGIN -->` block Lovable writes. If Lovable is reconnected (T-044)
and rewrites it unformatted, this gate turns red on Lovable's commit. The brief
reformats it like any other file and does **not** add it to `.prettierignore`; if
that happens, T-044 is where it is handled.

## Acceptance criteria

**Frozen once approved.** They change only by going back through `task-expander`
for a fresh approval.

### The pin

1. `frontend/package.json` `devDependencies.prettier` is an exact version: it
   matches `^\d+\.\d+\.\d+$` — no `^`, `~`, range, tag, URL or `latest`.
2. That value is string-equal to `question-bank/package.json`
   `devDependencies.prettier` (both `3.9.6`).
3. `frontend/bun.lock`'s workspace specifier for `prettier` is that same exact
   string, and its resolved `prettier` entry is `prettier@<that version>`.
4. No other dependency changes: `frontend/package.json`'s `dependencies` and
   `devDependencies` have the same keys and values as on `main` except
   `devDependencies.prettier`, and no `trustedDependencies`, `overrides` or
   `resolutions` key is added. The only line that differs in `frontend/bun.lock`
   is the workspace prettier specifier.

### The check

5. `frontend/package.json` has a `format:check` script, and `bun run format:check`
   run in `frontend/` on the branch head exits 0.
6. `bun run format:check` exits **non-zero**, and names the probe in its output,
   when a single prettier-unformatted probe file is added at each of these paths
   in turn (one run per probe, probe removed after):
   `frontend/src/<probe>.ts`, `frontend/src/<probe>.tsx`,
   `frontend/src/<probe>.css`, `frontend/src/<probe>.json`,
   `frontend/<probe>.md`, `frontend/src/routes/<probe>.md`,
   `frontend/scripts/<probe>.mjs`.
7. After `bun run format` in `frontend/` with any one of the probes from
   criterion 6 present, `bun run format:check` exits 0 — the check and the writer
   agree on the files they cover.
8. `frontend/.prettierignore` and `frontend/.prettierrc` are byte-identical to
   `main`.
9. No tracked file under `frontend/` contains a `prettier-ignore` directive in any
   comment syntax (there are none on `main`).
10. `bun run format:check` in `frontend/` exits 0 with all six proxy variables
    (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` and their lowercase forms) set to
    `http://127.0.0.1:1` — the gate needs no network.

### CI

11. CI's `frontend` job has a step whose `run:` is exactly `bun run format:check`.
12. That step's `if:` is character-identical to the `if:` of the same job's
    Typecheck, Lint and Test steps
    (`${{ !cancelled() && steps.install.outcome == 'success' }}`).
13. In `.github/workflows/ci.yml`, nothing outside the `frontend` job's `steps:`
    list changes — in particular the job key `frontend` and its
    `name: frontend (typecheck, lint, test)` are unchanged (a required status
    check may be keyed on that name), and the `question-bank` job is
    byte-identical to `main`.
14. On the branch's head commit, every CI job succeeds, and the `frontend` job's
    Format step ran (not skipped) and succeeded.

### The reformat

15. The reformat of existing files is its own commit on the branch, and that
    commit changes nothing but formatting: every file it touches is exactly what
    `prettier --write` (the pinned version, `frontend/.prettierrc`) produces from
    that file's content in the parent commit.
16. That commit touches no file outside `frontend/`, and no `package.json`,
    `bun.lock`, `.prettierrc`, `.prettierignore` or `ci.yml`.
17. That commit touches no `.ts`, `.tsx`, `.js` or `.mjs` file — those are
    already gated through eslint, so a change there would mean the pinned
    prettier and the lint disagree.

### Nothing else breaks

18. `bun run lint`, `bun run typecheck` and the whole `bun test` suite pass in
    `frontend/`, and the whole `bun test` suite passes in `question-bank/`. CI's
    green run on the head commit (criterion 14) is acceptable evidence where the
    sandbox cannot install `frontend/` (see Context).
19. No file under `question-bank/`, `backend/` or `e2e/` changes.

### Docs

20. `conventions.md` "Code" › **Formatting** states that **both** `frontend/` and
    `question-bank/` pin prettier to an exact version and that CI runs
    `bun run format:check` in both.
21. `conventions.md`'s Commands block has a line for `frontend` that names
    `bun run format:check`.
22. `engineering-decisions.md` gains a `## E-17` entry directly after `## E-16`
    (no heading between them) that records: `frontend/`'s prettier is pinned exact
    to the same version as `question-bank/`'s; the check's glob is `.` and why
    (it matches the `format` writer, and `.ts`/`.tsx` were already gated via
    eslint); and that a prettier bump changes **both** packages in the same
    change. The text of every existing entry, `E-1` through `E-16`, is unchanged.

## Out of scope

- **Upgrading prettier.** The version stays `3.9.6`; this task aligns specifiers,
  it does not move either package.
- **`question-bank/`** in any way — its pin, scripts, tests, `.prettierrc` or CI
  job.
- **Renaming CI jobs**, including adding "format" to either job's `name:`.
- **eslint changes** — `eslint-plugin-prettier`, `eslint-config-prettier` and
  `eslint.config.js` stay as they are, even though the lint now overlaps the
  format check for `.ts`/`.tsx`.
- **A frontend `dependency-set.test.ts`** or any other shared dependency check
  for `frontend/`.
- **Formatting `e2e/`, `backend/`, root Markdown** or anything outside `frontend/`.
- **Lovable's handling of `AGENTS.md`** (T-044).
- **Editing `E-16`** to remove its now-stale "`frontend/` still uses `^3.7.3`"
  line. E-17 supersedes it; decision records are appended, not rewritten.
- **`PROGRESS.md`** — the reviewer logs the task there at the sweep.

## Constraints

- **Files expected to change:** `frontend/package.json`, `frontend/bun.lock`,
  `.github/workflows/ci.yml`, `conventions.md`, `engineering-decisions.md`, and —
  in the formatting-only commit — `frontend/AGENTS.md`, `frontend/README.md`,
  `frontend/src/routes/README.md`, `frontend/src/styles.css`. The tester adds its
  criteria tests under `frontend/src/`. Anything else changed needs a line in the
  Handoff saying why.
- **`bun`, never npm/pnpm/yarn/bunx for the pinned tool.** `bun install` in
  `frontend/` after editing the specifier; commit the lockfile with it. CI installs
  with `--frozen-lockfile`, so a lockfile that disagrees with `package.json` fails
  the Install step.
- **The glob lives in the script, not in `ci.yml`**, so a local run and CI check
  the same files (E-4, E-16).
- **No existing test is edited or deleted by the worker** (D-14). Candidates go
  under **Tests made stale** in the Handoff.
- **No network in tests** (`test-guidelines.md`). A test that spawns
  `bun run format:check` must work with the dead proxy CI sets on the Test step.
- **Dependencies:** none added. Re-pinning prettier is covered by approving this
  brief (Decision 2 above).

## Context

**Required reading for the worker and the tester.**

- `tasks.md` T-075 — the queue entry, including the 4-file observation.
- `engineering-decisions.md` **E-16** — the `question-bank/` precedent: why
  exact, why the glob lives in the script, and its "Revisit when" that this task
  answers. **E-4** for "a local run and CI give the same verdict". **E-15** for
  why `frontend/` stays on eslint.
- `question-bank/package.json` — the `format` / `format:check` pair and the exact
  pin this task mirrors.
- `question-bank/src/prettier-gate.test.ts` — T-071's tester tests for the same
  gate; its criteria 5–6 (probe files), 8 (the CI step and its `if:`) and 10 (dead
  proxy) are the model for criteria 6, 11–12 and 10 here. Probe files go in a
  location cleaned up in `afterEach`.
- `.github/workflows/ci.yml` — the `frontend` job (Typecheck/Lint/Test `if:`) and
  the `question-bank` job's Format step as the pattern.
- `frontend/eslint.config.js` — the last entry is `eslint-plugin-prettier`, which
  is why `.ts`/`.tsx` are already formatted.
- `frontend/.prettierrc`, `frontend/.prettierignore`, `frontend/package.json`,
  `frontend/bun.lock` (line 80 specifier, line 866 resolution).
- `conventions.md` "Code" › Formatting (lines 35–38) and "Commands" (the
  `# frontend` block).
- `frontend/src/conventions-doc.test.ts` criterion 9 — every `bun run <script>`
  named for `frontend/` in `conventions.md` must be a real script, so criterion 21
  is checked by the existing suite too.
- **Sandbox caveat:** earlier runs recorded that `bun install --frozen-lockfile`
  in `frontend/` 403s on some packages in the web sandbox (`runs/T-057-…`,
  `runs/T-067-…`). Where the frontend suite cannot run locally, CI on the head
  commit is the evidence (criterion 14), and the Verdict says which it was.

## Handoff

**TL;DR — built as briefed, no deviations.** prettier pinned to `3.9.6` exact, `format:check` = `prettier --check .`, a Format step in CI's `frontend` job, the four drifted files reformatted in their own commit, `conventions.md` and E-17 written. **Tests made stale: none.** Frontend suite could only be run partially in this sandbox (install 403s, as the brief predicted); CI on the head commit is the evidence for criteria 14 and 18.

**Commits (on `claude/dazzling-hawking-13k700`)**

- **`6d1b5df` — formatting only (criteria 15–17).** `frontend/AGENTS.md`, `frontend/README.md`, `frontend/src/routes/README.md`, `frontend/src/styles.css`, each exactly `prettier --write` 3.9.6 output with `frontend/.prettierrc`. No other file. No `.ts/.tsx/.js/.mjs`.
- **The following worker commit — everything else:**
  - `frontend/package.json` — `devDependencies.prettier` `^3.7.3` → `3.9.6`; new script `"format:check": "prettier --check ."`. Nothing else.
  - `frontend/bun.lock` — line 80 workspace specifier `^3.7.3` → `3.9.6`. The only changed line; resolution at line 866 was already `prettier@3.9.6`.
  - `.github/workflows/ci.yml` — a `Format` step in the `frontend` job between Lint and Test, `run: bun run format:check`, same `if:` as Typecheck/Lint/Test, with a comment. Job key, `name:` and the `question-bank` job untouched.
  - `conventions.md` — Formatting paragraph now says both packages pin the same exact version and CI runs `bun run format:check` in both; Commands `# frontend` block gets a `cd frontend && bun run format:check` line.
  - `engineering-decisions.md` — `## E-17` appended directly after E-16 (E-16 was the last entry; nothing in E-1..E-16 edited).
  - This brief (Sessions row, Status, Handoff, Notes).

**Where each criterion lives**

| # | Where |
|---|---|
| 1–2 | `frontend/package.json` devDependencies.prettier = `"3.9.6"` = question-bank's |
| 3 | `frontend/bun.lock` line 80 (specifier) and line 866 (resolution) |
| 4 | `git diff main -- frontend/package.json frontend/bun.lock` — only the prettier specifier and the new script |
| 5 | `format:check` script; ran locally → exit 0 |
| 6–7 | Ran locally with all seven probe paths: each → exit 1 and the probe named; after `bun run format` → exit 0 |
| 8 | `.prettierrc` / `.prettierignore` not touched |
| 9 | `grep prettier-ignore` over `git ls-files` → no match |
| 10 | Ran with the six proxy vars at `http://127.0.0.1:1` → exit 0 |
| 11–13 | `.github/workflows/ci.yml` frontend job, `Format` step |
| 14 | CI on the head commit — see Notes for the run result, or check PR #66 |
| 15–17 | commit `6d1b5df` |
| 18 | see "How it was run" below |
| 19 | no file under `question-bank/`, `backend/`, `e2e/` changed |
| 20–21 | `conventions.md` "Code" › Formatting, and Commands `# frontend` |
| 22 | `engineering-decisions.md` `## E-17` |

**How it was run (and what could not be)**

- `frontend/` `bun install --frozen-lockfile` 403s on several tarballs (d3-*, react-simple-maps) from the sandbox npm cache. It did **not** report a frozen-lockfile mismatch. Separately, copying `package.json` + `bun.lock` to a scratch dir and running `bun install --lockfile-only` rewrote a byte-identical `bun.lock` — the lockfile agrees with the new specifier.
- The partial install did include `prettier@3.9.6`, so `bun run format:check` / `bun run format` ran for real in `frontend/` (criteria 5–7, 10).
- `frontend/` `bun run lint` → pass.
- `frontend/` `bun run typecheck` → 4 errors, all in `src/components/UsMap.tsx` from `react-simple-maps` not being installed (sandbox). Not caused by this change.
- `frontend/` `bun test` → 342 pass, 1 fail, 1 error; the fail/error is `src/components/screens.criteria.test.tsx` failing to import `react-simple-maps` (same missing package). Baseline `main` shows the same failure in this sandbox. `src/conventions-doc.test.ts` → 80 pass (it checks criterion 21's script name).
- `question-bank/` `bun test` → 1334 pass, 0 fail; typecheck, lint, format:check pass.
- To re-run: `cd frontend && bun install --frozen-lockfile && bun run format:check && bun run lint && bun run typecheck && bun test`.

**Deliberately not done**

- No tests written: the criteria are the tester's to check, and nothing I built has logic beyond a script string.
- No change to `.prettierignore`, eslint config, E-16's stale "`^3.7.3`" line, `PROGRESS.md`, or anything in `question-bank/` (all out of scope).

**Found that the approver should know — owner named**

- **`frontend/README.md` loses its source layout.** Its TypeScript interfaces, the level formula, the state list and the "9. Screens" ASCII flow diagram are *unfenced* Markdown, so prettier treats them as paragraphs: it strips the 2-space indents and collapses the diagram's column alignment. Rendered output was already flat (Markdown collapsed it before this change too), but the raw file is now harder to read, and the Screens diagram is effectively scrambled in source. Criterion 15 forbids any non-prettier edit in that commit, and the brief rules out `prettier-ignore`, so I left it. **Proposed fix:** a small follow-up that wraps those blocks in ``` fences (restoring the original text inside them) — prettier leaves fenced content alone. **Owner:** reviewer, to add as a `tasks.md` entry at the sweep, or to reject if the README is considered disposable Lovable scaffolding.

**Tests made stale:** none. No existing test reads `frontend/package.json`'s devDependencies or the `frontend` job's steps; the question-bank T-071 tests still pass.

## Verdict

**TL;DR — pass.** All 22 criteria hold. 33 new tests in `frontend/src/format-gate.criteria.test.ts` pass, and 16 mutations each turned the right test red (all reverted). CI on `235fe0f` is green in all six jobs, and the `frontend` job's Format step ran and succeeded. **Next: reviewer.**

**What kind of independence this is.** This is an orchestrated run, so the tester has the same session id as the expander and the worker (`cse_018Nxo8DLTPmamkPxrMGkzpY`). The session check therefore proves nothing here. This verdict rests on the tester being a freshly spawned agent with its own context: it did not see the work being done and had no access to the worker's reasoning. That is weaker than a separate session, because it depends on the orchestrator having spawned it correctly, not on anything the tester can check itself.

**Tests:** `frontend/src/format-gate.criteria.test.ts` (tester, from the criteria). The gate tests spawn `bun run format:check` / `bun run format` in `frontend/`, write their probes in place, and remove them in `afterEach`. No network.

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | test: `devDependencies.prettier` matches `^\d+\.\d+\.\d+$` |
| 2 | pass | test: frontend = question-bank = `3.9.6` |
| 3 | pass | tests: the workspace-block specifier and the `prettier@3.9.6` resolution both equal the pin |
| 4 | pass | test: no `trustedDependencies`/`overrides`/`resolutions`. By hand, against `f3af87b` (= `origin/main`): only `devDependencies.prettier` differs in deps/devDeps, no top-level key added, and `bun.lock` differs on line 80 only |
| 5 | pass | tests: `format:check` is a `prettier --check` script; `bun run format:check` exits 0 |
| 6 | pass | 7 tests, one per probe path (`src/*.ts/.tsx/.css/.json`, `*.md`, `src/routes/*.md`, `scripts/*.mjs`): each exits non-zero and names the probe |
| 7 | pass | 7 tests: with the probe present, `bun run format` and then `bun run format:check` exits 0 |
| 8 | pass | by hand: `git diff --quiet f3af87b -- frontend/.prettierrc frontend/.prettierignore` finds no difference |
| 9 | pass | test: no `git ls-files` file under `frontend/` contains the directive string |
| 10 | pass | tests: exits 0 under all six dead proxy vars, and a probe still fails under them |
| 11 | pass | test: exactly one frontend step has `run: bun run format:check` |
| 12 | pass | test: the Format, Typecheck, Lint and Test `if:` lines are character-identical to the documented condition |
| 13 | pass | test: key `frontend` has `name: frontend (typecheck, lint, test)`. By hand: the `question-bank` job block is identical to `f3af87b`'s, and the only `ci.yml` hunk is inside the frontend job's steps |
| 14 | pass | GitHub API, head `235fe0f`: all 6 check runs `success`. Job 109616093876 steps: Typecheck, Lint, **Format**, Test all `success`. The tester's first commit `121c2b7` turned the frontend Test step red because of a **bug in the tester's own test**: criterion 9's `describe` name contained the directive string, so once the file was tracked it matched itself (it passed locally only because the file was still untracked). The fix is in the next tester commit, which renames the `describe` and changes no source. See Notes for CI on that commit |
| 15 | pass | by hand: each of the 4 files in `6d1b5df`, taken from `6d1b5df^` and run through `prettier --write` 3.9.6 with `frontend/.prettierrc` in a scratch dir, is byte-identical to its version in `6d1b5df` |
| 16–17 | pass | `6d1b5df` touches only `frontend/AGENTS.md`, `frontend/README.md`, `frontend/src/routes/README.md` and `frontend/src/styles.css` |
| 18 | pass | locally: frontend `lint` 0, `format:check` 0, `bun test` 375 pass / 1 fail. The fail is `screens.criteria.test.tsx` failing to import `react-simple-maps`, which the sandbox cannot install (403), and it fails the same way alone. `typecheck` shows 4 errors, all in `UsMap.tsx` from the same missing package. question-bank `bun test` 1334 pass / 0 fail. **CI on `235fe0f` is the evidence for frontend typecheck and the full suite** (criterion 14) |
| 19 | pass | by hand: `git diff --name-only f3af87b -- question-bank backend e2e` is empty |
| 20 | pass | test: the Formatting paragraph names both packages, "exact version", and "CI runs `bun run format:check` in both" |
| 21 | pass | test: a `cd frontend` line in Commands names `bun run format:check` |
| 22 | pass | tests: `## E-17` directly follows `## E-16`, and it records the exact shared pin, the `.` glob with the writer and eslint reasons, and "both ... same change" on a bump. By hand: the `engineering-decisions.md` diff against `f3af87b` only adds lines after E-16's last line, so E-1 to E-16 are unchanged |

**Mutations (each reverted, and `git status` clean afterwards):**

- **Pin `^3.9.6` in package.json:** criteria 1, 2 and both 3 tests red.
- **Lock specifier back to `^3.7.3`:** 3 (specifier) red.
- **Format step `if:` set to `always()`:** 12 red.
- **Format step `run:` given an extra flag:** 11 and 12 red.
- **Job name gets ", format":** 13 red.
- **Formatting paragraph "in both" changed to "in question-bank/":** 20 red.
- **Commands `cd frontend && bun run format:check` line deleted:** 21 red.
- **`## E-17` demoted to `###`:** all four 22 tests red.
- **E-17 "same change" reworded:** 22 (bump in both) red.
- **Directive comment appended to `styles.css`:** 9 red.
- **`overrides: {}` added:** 4 red.
- **`format:check` narrowed to `src`:** 6 red for `*.md` and `scripts/*.mjs`.
- **`*.md` and `*.css` added to `.prettierignore`:** 6 red for the css probe and both md probes.
- **`format:check` given `|| true`:** all seven 6 tests red, and 10's probe test red.
- **`format` narrowed to `src`:** 7 red for `*.md` and `scripts/*.mjs`.
- **Tracked `src/routes/README.md` drifted:** both 5 and 10's exit-0 test red.

**Not mutated:** the dead-proxy condition itself. Prettier makes no network call, so there is nothing to break. The criterion 10 test runs the real gate under the proxy.

**Tests made stale:** none. The worker listed none, and the full frontend and question-bank suites are green apart from the sandbox import failure above, which main shows too.

**Noted for the reviewer, not a criterion:** the worker's point about `frontend/README.md` stands. Prettier flattened its unfenced interface, formula and "Screens" diagram blocks in the source text. It is allowed by criterion 15, and the owner is the reviewer (sweep).

## Notes

- Expanded 2026-09-29 from `tasks.md` T-075 at `f3af87b`. Draft PR #66.
- Worker, 2026-09-29: the brief's survey held exactly — prettier already resolved to 3.9.6, the same four files were flagged, nothing else. The only surprise was `frontend/README.md` (see Handoff: unfenced code/diagram blocks get flattened in source by prettier).
- Worker decision: Format step placed between Lint and Test, mirroring the `question-bank` job's order. Owner to overturn: reviewer.
- Tester, 2026-09-29: CI on `121c2b7` was red in the frontend Test step only. Its single failure annotation was criterion 9 matching its own test file (the tester's bug, not the worker's). The next tester commit fixes it.
- Tester, 2026-09-29: CI on `5a0faba` (the fix) is green in all six jobs. In the `frontend` job (109626768430), Typecheck, Lint, Format and Test all succeeded, so criterion 14 and the full frontend suite (criterion 18) hold with the tester's tests included.
