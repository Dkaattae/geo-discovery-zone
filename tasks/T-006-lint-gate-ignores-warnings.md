# T-006 — The lint gate ignores warnings, and there are still seven

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending` — replace with who approved and the date, e.g. `Kate, 2026-08-06`
**From:** [`tasks.md`](../tasks.md) T-006
**Branch:** `claude/task-brief-execution-w7lzqz` — this session was assigned this
branch by its harness and forbidden from pushing elsewhere (`process.md`, "When
the environment names the branch for you"; standing permission in `CLAUDE.md`
"Branches"). Every later role checks `git branch --show-current` against this
line and pushes here, not to a freshly created `task/T-006-…` branch.
**PR:** [#32](https://github.com/Dkaattae/geo-discovery-zone/pull/32), opened
draft against `main` from `claude/task-brief-execution-w7lzqz` via the GitHub
MCP tools. Stays draft until the reviewer approves it.
**Fault:** —

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-03 | session_01AiYi8BJUGW1WEMsbvGtfVB |

## Goal

`frontend`'s `lint` script is `eslint .`, which exits 0 on warnings, so CI has
been passing with `✖ 7 problems (0 errors, 7 warnings)` logged and ignored on
every green run. A lint gate that cannot fail is not a gate. Make warnings in
code we actually write fail the build, without demanding hand-edits to
shadcn-generated vendor components that nobody maintains.

## Acceptance criteria

1. Running `frontend`'s lint command (whatever `bun run lint` resolves to once
   this task lands) against the current tree **exits non-zero if any file
   outside `frontend/src/components/ui/` produces an ESLint warning or error**,
   and it exits **zero** against the tree as this task leaves it.
2. Every one of the seven pre-existing `react-refresh/only-export-components`
   warnings under `frontend/src/components/ui/` is accounted for — either fixed,
   or excluded by a rule change that is scoped to that vendor directory (not a
   blanket repo-wide disable of the rule) — and the exclusion, if used, is
   recorded with a one-line reason in `eslint.config.js` or nearby.
3. A warning newly introduced anywhere in `frontend/src/` **outside**
   `components/ui/` (e.g. a component exporting a non-component value from the
   same file) makes the lint command fail. State how you checked this (a
   temporary local warning is the simplest proof; revert it before committing).
4. `.github/workflows/ci.yml`'s `question-bank` job comment "No lint step: …
   see the brief's Handoff" (currently line 121) no longer points at T-003's
   brief, which was swept months ago. Either point it at
   [PR #11](https://github.com/Dkaattae/geo-discovery-zone/pull/11) or delete
   that clause of the comment.
5. CI's `frontend` job is green on the branch, running the updated lint step.

## Out of scope

- Rewriting or hand-editing the shadcn-generated files in
  `frontend/src/components/ui/` to satisfy the rule structurally — the point of
  criterion 2 is that a scoped exclusion is an acceptable, deliberate answer,
  not a fallback.
- `T-007` and `T-008`, the other §A foundations tasks — separate briefs.
- Anything about `question-bank`'s missing lint step beyond fixing the one dead
  comment reference (criterion 4). Adding lint there is a dependency decision
  (see `CLAUDE.md`: no eslint config or dependency exists in `question-bank`
  today) and is not this task.

## Constraints

- Files expected to change: `frontend/eslint.config.js`,
  `frontend/package.json` (the `lint` script), `.github/workflows/ci.yml`.
  Touching `frontend/src/components/ui/*.tsx` is allowed only if you choose the
  "fix it" branch of criterion 2 for some or all of the seven.
- No new dependency without asking first (`CLAUDE.md`).
- Do not silence `react-refresh/only-export-components` project-wide just to
  get a zero-warnings flag to pass — that defeats the point of this task. See
  the queue entry's own framing in `tasks.md`.

## Context

- `tasks.md` §A, T-006 — the queue entry this brief expands, including the
  2026-08-24 re-check that found all seven warnings still in
  `src/components/ui/` and the T-005 reviewer's note (PR #26) about the dead
  `ci.yml` comment.
- `frontend/eslint.config.js` — current rule config,
  `"react-refresh/only-export-components": ["warn", { allowConstantExport: true }]`.
- `frontend/package.json` — `"lint": "eslint ."`.
- `.github/workflows/ci.yml` lines 55–57 (frontend `Lint` step) and 118–121
  (the dead reference to fix).
- `conventions.md` — commands section, once T-007 corrects it; not authoritative
  today (see T-007).

## Handoff

_(worker writes this)_

## Verdict

_(tester writes this)_
