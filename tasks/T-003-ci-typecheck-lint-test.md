# T-003 — CI: typecheck, lint, test on every PR

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending` — replace with who approved and the date
**From:** [`tasks.md`](../tasks.md) T-003
**Branch:** `claude/t002-sweep-t003-expand-ibrpor` — **not** `task/T-003-ci-typecheck-lint-test`.
This session runs under a harness that designates the branch name and forbids
pushing anywhere else, which overrides `process.md`'s `task/T-0xx-slug` rule for
this task only. Everything else about "one task, one branch, one PR" holds: the
worker and tester push here, and the reviewer merges this branch.
**PR:** [#11](https://github.com/Dkaattae/geo-discovery-zone/pull/11), opened
draft at expand time. It **stays draft** until the reviewer approves it.
**Base:** `8773ed3` (origin/main at expand time)

**Sessions**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-08-07 | `cse_01SHSwr9eZT5x1N2iLMZVKJR` — also ran T-002's deferred sweep in the same commit |

> **The tester must not run in `cse_01SHSwr9eZT5x1N2iLMZVKJR`.** That session
> wrote these criteria; a verifier inside it is not independent.

**Path:** full, not light — see Notes for why an `S` task ended up with eight
criteria and got re-sized to `M`.

## Goal

The repo has no CI at all: `.github/` does not exist. Every check that
`test-guidelines.md` says must pass before you call something done — the whole
test suite, typecheck, lint — is today run by whoever remembers to. Put those
checks on every pull request so a red tree is visible before review rather than
after merge.

## Acceptance criteria

Frozen once approved. They change only by coming back through `task-expander`.

1. A GitHub Actions workflow exists under `.github/workflows/` whose triggers
   cause it to run on every pull request targeting the default branch, and on
   every push to the default branch.

2. **A type error fails the run.** Introducing a type error in a file under
   `frontend/src/` causes the workflow to conclude `failure`, and so does
   introducing one under `question-bank/src/`. Both packages are covered, not
   just the one that already has a `typecheck` script.

3. **A lint error fails the run.** Introducing an eslint violation under
   `frontend/src/` causes the workflow to conclude `failure`.

4. **A failing test fails the run.** Making one of `question-bank`'s 19 tests
   assert something false causes the workflow to conclude `failure`.

5. **A green tree passes.** On this branch as it stands — where `frontend/`
   contains no test files at all — the workflow concludes `success`. The bare
   `bun test` exit code of 1 in a package with no tests must not be what decides
   the run.

6. **Criterion 5 is not bought by skipping frontend tests.** Adding a passing
   test file under `frontend/src/` still yields `success`, and adding a *failing*
   one yields `failure`. Whatever handles the no-test-files case must stop
   applying the moment T-004 lands real tests.

7. **The run does not rewrite either lockfile.** After a workflow run,
   `frontend/bun.lock` and `question-bank/bun.lock` are byte-identical to what is
   committed. `frontend/bunfig.toml` sets `minimumReleaseAge = 86400`, so an
   unpinned install can legitimately resolve differently in CI than it did
   locally, and a lockfile that drifts in CI is a supply-chain guard that has
   stopped guarding.

8. **Nothing outside CI changes.** No file under `frontend/src/` or
   `question-bank/src/` is modified, no dependency is added to either
   `package.json`'s `dependencies` or `devDependencies`, and neither `bun.lock`
   is changed. Adding *scripts* to `package.json` is expected and allowed — see
   Constraints.

## Out of scope

- **The Python job.** `api/` does not exist (T-030 builds it). Do not add a job,
  a matrix entry or a commented-out stanza for it; T-030's entry in `tasks.md`
  now names adding it as its own follow-on.
- **Writing any test.** `frontend/` gets its first tests in T-004. If criterion 6
  needs a test file to demonstrate, it is a throwaway the tester adds and removes
  — not a committed one.
- **Enforcing "no network in tests" in CI.** `test-guidelines.md` prescribes the
  check (point `HTTPS_PROXY`/`HTTP_PROXY` at a dead port and confirm the suite
  does not notice), and it is worth having, but it has to be scoped to the test
  step alone or it breaks `bun install`. That is a separate, fiddly task — add it
  to `tasks.md` rather than to this workflow.
- **Branch protection, required checks, merge queues.** Repository settings, not
  files in the repo, and not the worker's to change.
- **Caching, build artifacts, deploy, coverage reporting, status badges.** A
  workflow that is correct and slow beats one that is fast and subtly wrong. Add
  caching later against a measured runtime.
- **`frontend`'s production build** (`vite build`). Typecheck plus lint is the
  gate this task promises; adding a full build changes the runtime and the
  failure modes.

## Constraints

- **Files expected to change:** `.github/workflows/*.yml` (new),
  `frontend/package.json` and `question-bank/package.json` (scripts only), and
  this brief. Nothing else.
- **Four script gaps must each be closed deliberately**, and the choice recorded
  in the PR body. All four were confirmed against the tree at `8773ed3`:

  | Package | Gap | Consequence if ignored |
  |---|---|---|
  | `frontend` | no `typecheck` script — only `dev`, `build`, `build:dev`, `preview`, `lint`, `format` | criterion 2 cannot pass for `frontend` |
  | `frontend` | no test files, so `bun test` exits 1 | criterion 5 fails on a green tree |
  | `question-bank` | no `test` script | CI must call `bun test` directly, or the script gets added |
  | `question-bank` | no `lint` script and no eslint config outside `frontend/` | criterion 3 deliberately asks only about `frontend`; say whether `question-bank` gets linted or is deliberately left unlinted, and why |

- **Do not add a dependency to close any of them.** Both packages already have a
  local `typescript`, and `frontend` already has eslint and its config. If you
  believe a dependency is genuinely required, stop and ask (`CLAUDE.md`) — that
  is one of the four points where this loop goes to a human.
- **Typecheck per package, never repo-wide.** `question-bank` pins
  `typescript@^7.0.2` and `frontend` pins `^5.8.3`, with different `tsconfig.json`
  files. One `tsc` invocation over both is wrong even if it happens to pass.
- **Both packages install from their committed `bun.lock`.** See criterion 7.
- **bun, never npm/yarn/pnpm** (`CLAUDE.md`). The workflow installs bun and uses
  it for every step.
- **Scripts added to `package.json` must match the names the docs already use.**
  `conventions.md` "Commands" and `test-guidelines.md` "Before you say it passes"
  both promise `bun run typecheck` and `bun test` per TS package. If you add a
  script under a different name, those two files become false and fixing them is
  part of this task.

## Context

Required reading, not background.

- **The queue entry:** [`tasks.md`](../tasks.md) T-003 — carries the four script
  gaps in short form.
- **Commands as the docs currently promise them:**
  [`conventions.md`](../conventions.md) "Commands", and
  [`test-guidelines.md`](../test-guidelines.md) "Before you say it passes" and
  "Per-area specifics → `question-bank/` and `frontend/` — `bun test`". The last
  of these already states that `frontend`'s `bun test` "exits 1 until T-004".
- **What the checks actually are today:**
  - `frontend/package.json` — `lint` is `eslint .`; there is no `typecheck`.
  - `frontend/eslint.config.js` — flat config, ignores `dist`, `.output`,
    `.vinxi`, runs prettier as an eslint rule.
  - `frontend/bunfig.toml` — `minimumReleaseAge = 86400` and its exclude list.
    This is why criterion 7 exists.
  - `question-bank/package.json` — `typecheck` is `tsc --noEmit`; no `test`, no
    `lint`.
  - `question-bank/src/sparql.test.ts` and `question-bank/src/normalize.test.ts` —
    the 19 tests, and the only tests in the repo.
- **Process:** [`process.md`](../process.md) "Tasks this loop does not fit" —
  this one *does* fit, but its criteria are verified by observing workflow runs
  rather than by a unit test, so read the note below.

### How this gets verified

Criteria 2, 3, 4 and 6 are **mutations**, in the sense
[`test-guidelines.md`](../test-guidelines.md) already uses for a task whose
deliverable is not ordinary code: break one thing on purpose, confirm the run
goes red, **revert it**. The workflow runs on this task's own PR, so the observed
run conclusion is the evidence. Record which mutation produced which conclusion
in the Verdict, and confirm every mutation was reverted before reporting.

Criteria 1, 5, 7 and 8 are read off the committed files and the run's own logs —
no mutation needed.

## Handoff

Written by `worker` before the tester runs. Always written, even if nothing was
built.

## Verdict

Written by `tester`.

## Notes

**Why this is not on the light path, and why it is `M` rather than `S`.** The
queue sized T-003 as `S`, and D-6 makes a light brief available to `S` tasks —
but it also says four criteria is the ceiling, and that a task needing more "is a
task pretending to be small". Writing these out honestly produced eight. None of
them is padding: five different things can each independently make CI worthless
(it does not run, it runs but cannot fail, it fails on a green tree, it passes by
skipping the checks, it silently mutates a lockfile), and each needs its own
observation. The entry in `tasks.md` has been re-sized to `M` to match.

Splitting was considered and rejected. A workflow that typechecks but does not
test is not independently landable — it would ship a green check that means less
than it appears to, which is the specific failure this task exists to prevent —
and the four script gaps are entangled across both packages.

**On criterion 6.** The obvious way to satisfy criterion 5 is to make the
frontend test step tolerate a non-zero exit, and the obvious way to do *that* is
`continue-on-error` or `|| true`. Both would still be in place when T-004 lands,
at which point `frontend`'s tests would be running and being ignored — a green
check certifying nothing. Criterion 6 is there to make that outcome fail
verification rather than fail silently two tasks later.
