# T-006 — The lint gate ignores warnings, and there are still seven

**Status:** `blocked` — brief complete; the expander could not commit, push or
open the PR (see "Blocked on" below)
**Next step:** `human`
**Approved:** `pending`
**From:** [`tasks.md`](../tasks.md) T-006
**Branch:** `claude/t006-orchestrator-startup-bmqpg4` — assigned to this session by
the harness; this line is the authority, not `task/T-006-…`. Every later role
checks `git branch --show-current` against it and pushes here regardless
(`CLAUDE.md` "Branches").
**PR:** [#29](https://github.com/Dkaattae/geo-discovery-zone/pull/29) — draft,
opened 2026-08-28 against `claude/t006-orchestrator-startup-bmqpg4`, body = the
Goal and Acceptance criteria below.
**Fault:** `task-expander` could not write to git — every mutating git command
(`git add`, `git commit`, even `--dry-run`) was refused for approval in this
session, and no human was present to grant it. The brief itself is complete.

## Blocked on

**The brief is finished and needs no further expansion.** What is missing is
mechanical and belongs to a human or a session whose git is not gated:

1. `git add tasks/T-006-lint-gate-warnings.md tasks.md`
2. `git commit -m "T-006 expander: lint-gate-warnings"`
3. `git push -u origin claude/t006-orchestrator-startup-bmqpg4`
4. Open a **draft** PR against that branch, body = the Goal and Acceptance
   criteria below, title `T-006 — make the frontend lint gate fail on warnings`.
5. Approve: replace `Approved: pending` with a name and the date, set
   `Status: awaiting approval` → `working` and `Next step: worker`.

Read-only git worked in this session (`git status`, `git log`); only the writing
half was gated. Nothing about the task itself is undecided.

**Steps 1-4 are done** (relay session, 2026-08-28): the brief and run log are
committed and pushed at `8689d05`, and the draft PR is #29. **Step 5 — the
approval — is the only thing outstanding**, and it is a human's.


**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-08-28 | orchestrated run on `claude/t006-orchestrator-startup-bmqpg4`; `CLAUDE_CODE_REMOTE_SESSION_ID` not readable from this shell |

## Goal

`frontend`'s lint script is `eslint .`, which exits 0 on warnings, so CI has been
printing `✖ 7 problems (0 errors, 7 warnings)` and passing. Make the lint gate
mean something: warnings fail, the seven existing ones are each fixed or
deliberately exempted with the reason written down, and a warning introduced in
code we actually write cannot slip past.

## Acceptance criteria

Frozen once approved. Each is checkable on its own, from a clean checkout of the
branch, with `bun install --frozen-lockfile` already run in `frontend/`.

1. **The gate is clean.** `bun run lint` in `frontend/` exits **0** on the tree as
   committed, and its output reports **0 errors and 0 warnings** — not "0 errors,
   7 warnings".

2. **Warnings fail.** With a first-party file present that violates a rule
   configured at `warn` severity, `bun run lint` in `frontend/` exits **non-zero**.
   Both sides of the edge: **0 warnings → exit 0** (criterion 1), **1 warning →
   exit non-zero**. A rule that merely got promoted to `error` while some other
   rule stays at `warn` and still passes does **not** satisfy this.

   *Evidence, one way to get it:* add a temporary `.tsx` file outside
   `frontend/src/components/ui/` that exports both a React component and a
   non-constant non-component value, run lint, delete the file, run lint again.

3. **The relaxation, if any, is narrow.** `react-refresh/only-export-components`
   still applies to first-party code **outside** `frontend/src/components/ui/`: a
   module there that exports a component alongside a non-component value produces
   a lint failure. Any exemption is scoped by a path glob no broader than
   `frontend/src/components/ui/**`, and the rule is not disabled, downgraded or
   removed for the project as a whole.

4. **No file-level silencing outside the vendored directory.** No
   `eslint-disable`, `eslint-disable-next-line` or `eslint-disable-line` comment
   for `react-refresh/only-export-components` exists anywhere under
   `frontend/src/` outside `frontend/src/components/ui/`.

5. **The choice is recorded.** `decisions.md` gains an entry, in the file's
   existing `D-n` form, that says which of the seven warnings were fixed and which
   were exempted, why that split (not "to make CI green"), and what would make it
   worth revisiting. It names the directory or the files it covers.

6. **CI runs the same command.** The `Lint` step of the `frontend` job in
   `.github/workflows/ci.yml` runs `bun run lint` and nothing else — the strictness
   lives in `frontend/`, so a developer running lint locally gets the same verdict
   CI does. No `--max-warnings` flag appears only in `ci.yml`.

7. **The dead reference is gone.** No occurrence of the string
   `brief's Handoff` remains in `.github/workflows/ci.yml`; the `question-bank`
   job's "No lint step" comment either points at PR #11 or the clause is deleted.
   The rest of that comment — why `question-bank` has no lint step — still stands.

8. **Nothing else moved.** `frontend/bun.lock` is unchanged on this branch, and no
   entry is added to or removed from `dependencies` or `devDependencies` in
   `frontend/package.json`. The `lint` script's value may change; no other script
   does.

9. **The app still works.** `bun run typecheck` and `bun test` in `frontend/` both
   pass, with no test deleted or skipped, and the frontend test count does not
   drop below the 80 recorded in `tasks.md` §A.

10. **No network in tests.** Nothing added by this task performs a network request
    at lint, typecheck or test time. The dead-proxy guard on CI's test steps is
    untouched.

## Out of scope

- **`question-bank` lint.** Giving it an eslint config or dependency is a
  dependency decision and is not this task. The comment in `ci.yml` is only
  corrected, not acted on.
- **Backend lint and format** (`make -C backend check`). Untouched.
- **Pinning the CI actions by SHA** — that is T-008, in the same file.
- **Prettier rules, formatting churn, or running `bun run format` over the tree.**
  A reformat diff would bury the change this task is actually making.
- **Refactoring or restyling `frontend/src/components/ui/`** beyond whatever a
  chosen fix strictly requires. These are shadcn-generated files nobody
  hand-edits.
- **The other six CI jobs**, `Dockerfile`, `docker-compose.yml`, `e2e/`,
  `backend/`.
- **`conventions.md`'s missing `typecheck`/CI documentation** — that is T-007.

## Constraints

- **Files expected to change:** `frontend/package.json` (the `lint` script),
  `frontend/eslint.config.js`, `decisions.md`, `.github/workflows/ci.yml`
  (comment only), and — only if the chosen fix is to fix rather than exempt —
  files under `frontend/src/components/ui/`.
- **Invariant:** every import path that resolves today still resolves. If a fix
  moves an export (`buttonVariants`, `toggleVariants`, `badgeVariants`,
  `navigationMenuTriggerStyle`, `useSidebar`, `useFormField`) to a new module, every
  call site is updated in the same commit and typecheck proves it.
- **Do not silence wholesale.** Turning the rule off globally, adding
  `--max-warnings 999`, or `/* eslint-disable */` at the top of seven files
  satisfies none of criteria 2–5.
- **Dependencies:** none without asking (`CLAUDE.md`). If the honest fix needs a
  new plugin or package, stop, write the request into this brief, set
  `Status: blocked` / `Next step: human`, and push.
- **If lint reports a warning in a file outside `frontend/src/components/ui/`** —
  `tasks.md` says all seven are inside it, re-checked 2026-08-24, but T-004 and
  T-005 have landed since — fix that file rather than widening the exemption. If it
  cannot be fixed without changing app behaviour, halt as above rather than
  widening it quietly.
- Commit messages name the role: `T-006 worker: …`, `T-006 tester: …`.

## Context

Required reading, not background.

- [`tasks.md`](../tasks.md) §A, entry **T-006** — the queue's own account,
  including the re-check on 2026-08-24 and the steer toward scoping the rule off
  `components/ui/` rather than editing vendored files.
- [`frontend/package.json`](../frontend/package.json) — `scripts.lint` is
  `eslint .`; `scripts.typecheck` is `tsc --noEmit`.
- [`frontend/eslint.config.js`](../frontend/eslint.config.js) — line 35 sets
  `react-refresh/only-export-components` to `["warn", { allowConstantExport: true }]`;
  line 9 is the only `ignores` block; there is no per-path override today.
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — the `frontend` job's
  `Lint` step is lines 55–57 (`run: bun run lint`); the stale comment is lines
  118–121, ending "see the brief's Handoff", which refers to T-003's brief (PR
  #11), swept long ago.
- **Where the warnings are.** Reading the export blocks, six are visible by
  inspection: `badge.tsx:32` (`badgeVariants`), `button.tsx:49` (`buttonVariants`),
  `toggle.tsx:42` (`toggleVariants`), `navigation-menu.tsx:111`
  (`navigationMenuTriggerStyle`), `form.tsx:163` (`useFormField`), `sidebar.tsx:742`
  (`useSidebar`). `tasks.md` counts seven. **The expander did not run eslint** — by
  role, it never runs the suite — so the seventh is unidentified here; the worker
  records the real list from an actual run in its Handoff.
- [`decisions.md`](../decisions.md) — the `D-n` format, and **D-9** and **D-10** as
  the model for a decision about the frontend's checks. The next free number is
  **D-12**.
- [`test-guidelines.md`](../test-guidelines.md) — "No network in tests, ever", and
  what a test of a config change may reasonably assert.
- [`CLAUDE.md`](../CLAUDE.md) — Packages (`bun`, never npm), and ask before adding
  a dependency.

## Handoff

Written by `worker` before the tester runs.

## Verdict

Written by `tester`.

## Notes
