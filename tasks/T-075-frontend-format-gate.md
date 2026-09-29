# T-075 — `frontend/` gets a pinned prettier and a CI format gate

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-075
**Branch:** `claude/dazzling-hawking-13k700` — assigned to the expander's session
by the harness, branched from `origin/main` at `f3af87b`. Every later role pushes
here (`CLAUDE.md` "Branches").
**PR:** opened draft at expand time, built from the branch above — number in the
Notes below once known.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-29 | cse_018Nxo8DLTPmamkPxrMGkzpY |

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

## Verdict

## Notes

- Expanded 2026-09-29 from `tasks.md` T-075 at `f3af87b`.
