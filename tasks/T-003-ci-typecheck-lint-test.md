# T-003 — CI: typecheck, lint, test on every PR

**Status:** `fail` — on criterion **6c** only. Seven and a half of eight criteria
pass; 6a and 6b are discharged by the archived runs exactly as the amendment
predicted. 6c is not met: the `Test` step's `exit 0` **is** reachable while test
files exist, because the guard's `find` pattern is narrower than `bun test`'s own
discovery. Observed, not argued — run
[31270170161](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31270170161)
concluded **`success`** with a failing test sitting in `frontend/`.
**Next step:** `worker` — **not `task-expander`.** The criteria are fine this
time. The fix is one regex in `.github/workflows/ci.yml`, which the Constraints
already list as a file this task may change: no dependency, no criteria change,
no re-approval. See the Verdict.
**Approved:** Dkaattae, 2026-08-08 — the amended criterion 6, and with it the
whole set, re-approved after PR #14 merged. The criteria are frozen again from
here and change only by coming back through `task-expander`. (The earlier
`Dkaattae, 2026-08-07` approval covered criteria 1–5, 7 and 8; a criteria change
resets approval, `process.md` step 2.)
**From:** [`tasks.md`](../tasks.md) T-003
**Branch:** `claude/t002-sweep-t003-expand-ibrpor` — **still the task branch, and
still the authority for the worker, the tester and the reviewer.** That is where
PR #11 is built from and where every role's commits must land.

> **This amendment could not be pushed there.** The harness pinned the
> `task-expander` session that wrote it to
> `claude/t003-criterion-6-expander-0qifna` and forbade pushing anywhere else, so
> the amendment sits on that branch, based on `4a3f75a` (PR #11's head at the
> time) and containing nothing but this brief and `tasks.md`. It reaches PR #11
> through PR #14, which targets `claude/t002-sweep-t003-expand-ibrpor` rather
> than `main` — one task, one PR to `main`, still true. **Once PR #14 merges,
> this note is history and `claude/t002-sweep-t003-expand-ibrpor` is the only
> branch anyone needs.** If it has not merged, do not start the tester: the
> criteria it would verify against are not yet on the branch it will read.

**PR:** [#11](https://github.com/Dkaattae/geo-discovery-zone/pull/11), opened
draft at expand time. It **stays draft** until the reviewer approves it. The
criterion-6 amendment arrives via
[#14](https://github.com/Dkaattae/geo-discovery-zone/pull/14) → PR #11's branch.

> **PR #11's *body* still quotes the pre-amendment criterion 6**, and was left
> that way deliberately. This session has no way to read that body — no `gh`, and
> no read-PR tool — so replacing it would have meant retyping the expander's
> original text from memory and risking a silent loss. **This file is the
> authority on the criteria** (`process.md`: the brief is the loop's shared
> state), and PR #11's body is brought up to date at step 5, where the reviewer
> writes the criteria into it verbatim on approve. Anyone reading PR #11 before
> then should read criterion 6 here, not there. PR #14's body carries the amended
> wording in full in the meantime.

**Base:** `8773ed3` (origin/main at expand time)

**Sessions**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-08-07 | `cse_01SHSwr9eZT5x1N2iLMZVKJR` — also ran T-002's deferred sweep in the same commit |
| worker | 2026-08-07 | `cse_01VPwNNDJbsuRw8Ag6yTBhqd` — on `claude/worker-t003-i1kbih`, not the branch named above; see Handoff |
| — (out of band) | 2026-08-07 | `cse_01PT6etPpidd8PU8cZgY1jCV` — not a loop role. Reviewed this task at the human's request, landed PR #12 (the lint fix) and PR #13 (the process fix), and appended the Handoff's "Update" block. Wrote no source for this task. **The tester must not run here either** |
| tester | 2026-08-08 | `cse_01GJgQEymzAYi8Nx1vDW4gU3` — fresh session, none of the three above. Ran on the harness-assigned `claude/t003-tester-startup-gi675x`, which differs from the `Branch:` header; pushing here instead was authorised explicitly by Dkaattae before any commit. See the Verdict's "On the branch mismatch" |
| task-expander | 2026-08-08 | `cse_01HMQ72V73ADbUkKu29EAgjP` — second expander run, on the `blocked` return path. Amended criterion 6 only; wrote no source, ran no build, test or pipeline. Pinned to `claude/t003-criterion-6-expander-0qifna`; see the `Branch:` note |
| tester (2nd round) | 2026-08-08 | `cse_01GJgQEymzAYi8Nx1vDW4gU3` — **the same session as the first tester run**, which the note below marks as permitted but not preferred. It wrote no criteria and no source. Pushed to the `Branch:` header under `CLAUDE.md` "Branches", the standing grant that landed in PR #15; no per-session permission was needed this time. Independence caveat in the Verdict |

> **The tester must not run in `cse_01SHSwr9eZT5x1N2iLMZVKJR` or
> `cse_01HMQ72V73ADbUkKu29EAgjP`.** Both wrote criteria for this task; a verifier
> inside either is not independent. `cse_01GJgQEymzAYi8Nx1vDW4gU3` — the first
> tester — is *not* disqualified: it wrote no criteria and no source. But a fresh
> session is preferred, because the amended criterion 6 was written in response to
> that session's own verdict and re-reading one's own diagnosis is the weakest
> form of the check this loop is built on.

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

> **Amended 2026-08-08, criterion 6 only.** Criteria 1–5, 7 and 8 are byte-for-byte
> what was approved on 2026-08-07 and are untouched. Criterion 6 is replaced; the
> wording it replaces, and why, are recorded under "Amendment history" below.
> Approval is reset to `pending` for the whole set, because a set with one
> unapproved member is not an approved set.

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

6. **Criterion 5 is not bought by skipping frontend tests.** The `frontend` job's
   `Test` step may skip `bun test` in exactly one state — when `frontend/` holds
   no test file at all, which is criterion 5's state — and the moment one test
   file exists it must run `bun test` and let `bun test`'s own exit code decide
   the step. Both sides of that boundary are observed, plus the artefact itself:

   **6a — one test file, passing → the step runs and the run is green.** With
   exactly one *passing* test file present anywhere under `frontend/` that
   `frontend`'s own `bun run typecheck` accepts, the `Test` step's log says it is
   running `bun test` rather than skipping, `bun test` reports `1 pass / 0 fail`,
   the `Test` step concludes `success`, and the whole run concludes `success`.

   **6b — one test file, failing → the step goes red.** With one test file
   present under `frontend/` that asserts something false, the **`Test` step
   itself** concludes `failure` and the run concludes `failure`. Where the file
   sits does not matter for 6b: what is being observed is that a non-zero
   `bun test` exit reaches the step's conclusion instead of being swallowed.

   **6c — nothing in the workflow can swallow a test failure.**
   `.github/workflows/ci.yml` contains no `continue-on-error`, no `|| true`, and
   no other construct at step, job or workflow level that would let a non-zero
   `bun test` exit leave a step or job green. The one `exit 0` that bypasses
   `bun test` is reachable only when the no-test-files condition holds, so the
   skip disables itself when T-004 commits `frontend`'s first test — without
   anyone editing `ci.yml`.

   **What 6 deliberately does not require.** It does not require that a test file
   under `frontend/src/` typechecks. It cannot today: `frontend` has no
   `@types/bun` and `frontend/tsconfig.json` sets `"types": ["vite/client"]` with
   `include: ["src/**/*.ts", …]`, so any `bun:test` import under `src/` fails
   `tsc` with TS2307 — a property of the package's type configuration, not of
   this workflow. Fixing it means a new dependency or a `tsconfig.json` change,
   both of which criterion 8 and the Constraints forbid here, and both of which
   T-004 has to settle anyway when it writes real tests. It is recorded against
   T-004 in `tasks.md`. **The consequence is stated plainly rather than hidden:
   T-004's first commit will turn this workflow red at the frontend `Typecheck`
   step until it adds bun's types**, which is CI reporting a real gap in the
   package on the first task that hits it, and is the correct place to fix it.

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

### Amendment history

**2026-08-08 — criterion 6 replaced.** The approved wording was:

> 6. **Criterion 5 is not bought by skipping frontend tests.** Adding a passing
>    test file under `frontend/src/` still yields `success`, and adding a
>    *failing* one yields `failure`. Whatever handles the no-test-files case must
>    stop applying the moment T-004 lands real tests.

The tester's verdict established that its second half holds and its first half
cannot, for a reason outside this task's diff: the criterion named a **file
path** (`frontend/src/`) where what it meant was a **behaviour** (the skip guard
switching itself off). A file under `frontend/src/` is inside
`frontend/tsconfig.json`'s `include`, so the mutation it prescribes fails
`Typecheck` before `Test` runs, and the criterion ends up testing the package's
type configuration rather than the workflow. Run
[31235143550](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31235143550)
proved the point: the identical passing test, moved to `frontend/`'s root, gave a
fully green run with `bun test` reporting `1 pass`.

**The route taken, and the one rejected.** Two were available (the Verdict lists
both). This amendment takes the first — reword criterion 6 to name the guard —
and rejects the second, widening the brief to permit `@types/bun` plus a lockfile
change or a `frontend/tsconfig.json` edit. The rejection has three reasons and
they are worth having on the record:

1. **It is a dependency decision, and `CLAUDE.md` sends those to a human** — not
   into a CI task as a side effect of a mutation the tester needed.
2. **It is T-004's decision on the merits, not just by scope.** How `frontend`
   typechecks tests is entangled with where its tests live, whether
   `"types": ["vite/client"]` survives, and whether a second `tsconfig` is
   wanted. Settling that here, with no real test to validate it against, freezes
   a choice T-004 needs to make with tests in hand.
3. **It enlarges a task already re-sized `S` → `M`.** T-003 exists to put a gate
   on every PR; it does not need to also configure another package's type system.

**What the new wording still forbids.** The whole point of criterion 6 is that
criterion 5 must not be bought by making the frontend test step incapable of
failing. 6b keeps that observable — a failing test must turn the `Test` step red
— and 6c forbids the two shortcuts by name (`continue-on-error`, `|| true`) plus
anything else with the same effect, at any level. The one permitted `exit 0` is
pinned to the zero-test-files condition, so the guard's lifetime is bounded by
`frontend/` having no tests, which is exactly the condition T-004 ends. Nothing
that would have failed criterion 6 as approved passes criterion 6 as amended.

### What the next tester has to do

Recorded here because the amendment changes the work, not just the words. The
mutations criterion 6 needs have **already been run and pushed to PR #11, and
reverted**; the branch tip is byte-identical to `8adc7b3`. Re-running them is not
required and re-pushing them is not wanted.

| Sub-criterion | Discharged by | What to read |
|---|---|---|
| 6a | run [31235143550](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31235143550) (`4e1d7b5`) — passing test at `frontend/` root | `Test` step log says "running bun test", `1 pass`, step `success`, run `success` |
| 6b | run [31235108008](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31235108008) (`12917d0`) — failing test | `Test` step conclusion `failure`, run `failure` |
| 6c | **not yet verified** — read `.github/workflows/ci.yml` at the branch tip | no `continue-on-error`, no `\|\| true`, the single `exit 0` guarded by the empty-`test_files` branch |

Only 6c is new work, and it is a file read. If the tester judges the archived
runs insufficient evidence — for example because it cannot open them — it may
re-run the two mutations on PR #11's branch under the same rules the first tester
followed: one at a time, each reverted, the tree byte-identical at the end.

## Out of scope

- **The Python job.** `api/` does not exist (T-030 builds it). Do not add a job,
  a matrix entry or a commented-out stanza for it; T-030's entry in `tasks.md`
  now names adding it as its own follow-on.
- **Writing any test.** `frontend/` gets its first tests in T-004. If criterion 6
  needs a test file to demonstrate, it is a throwaway the tester adds and removes
  — not a committed one.
- **Making `frontend` able to typecheck a test file.** Added 2026-08-08 with the
  criterion 6 amendment. `@types/bun` (or any equivalent), and any change to
  `frontend/tsconfig.json`'s `types` or `include`, are **out of scope here and
  belong to T-004**, whose queue entry now carries the diagnosis. Criterion 8 and
  the Constraints already forbid both; this bullet says so where someone reading
  criterion 6 will see it.
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

Written by `worker` before the tester runs.

### Update — 2026-08-07, out of band

*Appended in session `cse_01PT6etPpidd8PU8cZgY1jCV`, which is not a `worker`
run. The worker's text below is unchanged; this block records what happened
after it stopped. Two of its statements have since become false and are
corrected here rather than edited in place.*

**1. The lint blocker is resolved.** PR #12 formats `frontend/src` to the repo's
own `.prettierrc`, which takes `bun run lint` from exit 1 (20 `prettier/prettier`
errors, 7 files) to exit 0. It landed as its own PR precisely so this task would
not have to touch `frontend/src/`, so **criterion 8 stays true as written and the
frozen criteria need no re-approval.** Criteria 3, 5 and 8 are no longer mutually
unsatisfiable. The worker was right to refuse to resolve it here.

Verified independently before that PR was opened: `bun run lint` exit 1 → 0,
`tsc --noEmit` exit 0 → 0, `question-bank` 19 pass throughout. The reformat was
also checked for behaviour change by compiling both trees with `--jsx react-jsx`
and diffing the emitted JavaScript — only line wrapping, trailing commas and
redundant parentheses differ, and the one JSX text reflow leaves the transformed
children array identical.

**2. This commit is not in PR #11, and that is now the blocker.** The Handoff's
"Branch and push" section below says the commits are "local to this branch only"
and that the worker "was instructed not to push". Both are out of date: the
branch **is** on the remote as `claude/worker-t003-i1kbih`. What is true is that
PR #11 is built from `claude/t002-sweep-t003-expand-ibrpor` and cannot see this
commit — `git merge-base --is-ancestor 3c0e6cc origin/claude/t002-sweep-t003-expand-ibrpor`
returns false.

So the PR carries a brief describing a `.github/workflows/ci.yml` that the PR
does not contain. Nothing errored; the two branches simply disagree about which
one is the task branch.

**Resolved.** `claude/t002-sweep-t003-expand-ibrpor` was fast-forwarded onto the
worker's branch — no cherry-pick was needed, since the worker branched from this
one and only added to it — and then `origin/main` was merged in to pick up PR
#12's reformat and PR #13's process fix. That last part matters: without it the
branch predates #12 and the frontend job still goes red at Lint for the old
reason.

**PR #11 now contains `.github/workflows/ci.yml`**, so criteria 1–6 have real
runs to be verified against. The two branches no longer disagree about which one
is the task branch.

**3. The process gap this exposed is fixed.** PR #13 makes the brief's `Branch:`
header the authority on where each role pushes, adds the mismatch check to
`worker.md` and `tester.md` that would have caught this, and gives the reviewer a
commits-vs-Sessions-table check as the backstop. Recorded as `decisions.md` D-8.
This task is the worked example in all of them.

**4. The npm-mirror question is answered: the registry is readable from a GitHub
runner.** The open worry was whether the 23 packages `frontend/bun.lock` pins to
`europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache` could be fetched
outside the sandbox. The 403 seen locally was this environment's egress policy
denying CONNECT, not the registry's own answer, so it settled nothing either way.

The first real run settles it: `bun install --frozen-lockfile` **succeeded** in
the `frontend` job. No task is needed for it, and the contingency named here
before — re-resolving the lockfile against `registry.npmjs.org` — is not
required.

**First observed run** — [run
31224955232](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31224955232),
on `c468e76`:

| Job | Conclusion |
|---|---|
| `question-bank (typecheck, test)` | **success** |
| `frontend (typecheck, lint, test)` | **success** |

The frontend `Test` step printed `No test files in frontend/ yet — skipping bun
test (T-004 adds the first).` and exited 0, which is the no-test-files half of
criterion 6 behaving as designed on a real runner rather than in a local shell.

**This is an observation, not a verdict.** It is the green-tree half of criterion
5 and one third of criterion 6. Criteria 2, 3, 4 and the two *test-file* halves
of criterion 6 are mutations and remain entirely the tester's work — nothing here
substitutes for breaking each thing on purpose and confirming the run goes red.
Criterion 7 can now be read off this run's `Lockfile unchanged` steps.

### Blocker — read before running anything

> **Superseded** — resolved by PR #12, see the Update above. Kept because it is
> the record of why the reformat had to land as a separate PR, and because the
> reasoning applies again the next time criteria freeze around a pre-existing
> failure.

**`bun run lint` already fails on this tree, and has since before this task.**
`frontend/`'s committed source is not formatted to `frontend/.prettierrc`, and
`frontend/eslint.config.js` runs prettier as an eslint rule, so `eslint .` reports
**20 `prettier/prettier` errors across 7 files** on an untouched checkout. There
was no CI, so nobody had run it.

Measured here, on the tree as committed, with each package installed from its
own `bun.lock`:

| Command | Exit code on the untouched tree |
|---|---|
| `cd frontend && bun run typecheck` | `0` |
| `cd frontend && bun run lint` | **`1`** |
| `cd question-bank && bun run typecheck` | `0` |
| `cd question-bank && bun test` | `0` (19 pass) |

That makes criteria **3, 5 and 8 mutually unsatisfiable as written**:

- criterion 3 requires the workflow to run frontend lint and go red on a violation;
- criterion 5 requires the run to conclude `success` on this branch as it stands;
- criterion 8 forbids modifying any file under `frontend/src/`.

The only ways out all change something a criterion freezes, so **the worker did
none of them** and the workflow runs the real `bun run lint`. Weakening the lint
step to buy criterion 5 is exactly the failure criterion 6 exists to prevent, one
step over.

**Decision needed, and it is not the worker's.** Proposed owner: **the human, via
`task-expander`** (criteria are frozen; only a re-expansion and a fresh approval
can move them). Two options, both cheap:

1. **Reformat** — `cd frontend && bun run format`. Measured: 7 files, +48/−29,
   whitespace only (line wrapping of arguments and ternaries; a representative
   hunk is `pickQuestion`'s parameter list in `src/lib/session.ts` going
   one-line → multi-line). It makes the repo obey its own documented convention.
   Needs criterion 8 amended to permit a formatting-only commit under
   `frontend/src/`, or a separate task landed first.
2. **Descope frontend lint from T-003** — drop criterion 3, ship typecheck + test
   now, and queue "make `frontend` lint-clean, then add the lint step" as its own
   task. Weaker, but honest, and does not touch `frontend/src/` here.

Option 1 is the recommendation: it is a one-command change with no behavioural
risk, and a CI task that ships without a lint gate leaves the gap it was written
to close.

**What the tester should expect.** Everything except criterion 5 (and the "green
tree" half of criterion 6) is observable now; the frontend job will conclude
`failure` at the Lint step on any run of this branch, for the pre-existing reason
above. Under `process.md` step 4 that is the **blocked** row — a criterion that is
wrong as written — not **fail**, because no change the worker is permitted to
make can turn it green. Note also that criterion 3's mutation is untestable in
the ordinary sense while lint is red: injecting an eslint violation changes
nothing observable, since the step already fails.

### What changed, file by file

**`.github/workflows/ci.yml` (new).** One workflow, `CI`, two jobs, `frontend`
and `question-bank`. Triggers: `pull_request` and `push`, both filtered to
`branches: [main]` (criterion 1; `main` is the default branch — `Base: 8773ed3`
is `origin/main`). `permissions: contents: read`. Each job checks out
(`actions/checkout@v5`), installs bun (`oven-sh/setup-bun@v2`, `bun-version`
pinned to `1.3.11`, the version used locally), then:

| Job | Steps after install |
|---|---|
| `frontend` | `Lockfile unchanged` → `Typecheck` (`bun run typecheck`) → `Lint` (`bun run lint`) → `Test` (guarded `bun test`) |
| `question-bank` | `Lockfile unchanged` → `Typecheck` (`bun run typecheck`) → `Test` (`bun test`) |

**`frontend/package.json`.** One line added: `"typecheck": "tsc --noEmit"`,
between `preview` and `lint`. The name is the one `conventions.md` "Commands" and
`test-guidelines.md` "Before you say it passes" already promise, so no doc became
false. `tsconfig.json` already sets `noEmit`; the flag is explicit so the script
reads the same as `question-bank`'s. No dependency added — `typescript@^5.8.3` was
already a devDependency. Verified that adding a *script* does not invalidate
`--frozen-lockfile`: with a throwaway script added to `question-bank/package.json`,
`bun install --frozen-lockfile` succeeded and `bun.lock` stayed byte-identical.

**`tasks/T-003-ci-typecheck-lint-test.md`.** Status, Next step, Sessions row,
this Handoff, and Notes. The acceptance criteria are untouched.

Nothing else changed. `git status` on this branch shows exactly `.github/`,
`frontend/package.json` and this brief. No file under `frontend/src/` or
`question-bank/src/`, no `dependencies`/`devDependencies` entry, neither
`bun.lock` (criterion 8).

### Where each criterion lives

| # | Where | Verified locally? |
|---|---|---|
| 1 | `ci.yml` `on:` block — `pull_request` and `push`, `branches: [main]` | File read; YAML parses. **A workflow run cannot be observed from this session** |
| 2 | `frontend` job → `Typecheck`; `question-bank` job → `Typecheck` | Yes, by mutation — see below |
| 3 | `frontend` job → `Lint` (`bun run lint` → `eslint .`) | Step exits 1 — but so does the unmutated tree; see the blocker |
| 4 | `question-bank` job → `Test` (`bun test`) | Yes, by mutation |
| 5 | Whole workflow | **No — fails at frontend Lint, see the blocker.** Every other step is green |
| 6 | `frontend` job → `Test`, the `find`-based guard | Yes, all three states — see below |
| 7 | `bun install --frozen-lockfile` in both jobs, plus a `Lockfile unchanged` step (`git diff --exit-code -- bun.lock`) that puts the evidence in the run's own log | Yes for `question-bank`; partially for `frontend` (see "What could not be verified") |
| 8 | The diff | Yes — `git status` |

### The four script gaps, and how each was closed

| Package | Gap | Decision |
|---|---|---|
| `frontend` | no `typecheck` script | **Added** `"typecheck": "tsc --noEmit"`. Named to match what the docs already promise, so `conventions.md` and `test-guidelines.md` stay true |
| `frontend` | no test files, `bun test` exits 1 | **Guard in the workflow, not a script.** The `Test` step runs `find` over `frontend/` (pruning `node_modules`, `dist`, `.output`, `.vinxi`, `.git`) for `*.{test,spec}.{js,jsx,ts,tsx}` and `*_{test,spec}.*`; if there are none it prints why and exits 0, otherwise `bun test`'s own exit code decides. No `continue-on-error`, no `\|\| true`, nothing at job or workflow level that could mask a failure. It self-disables the moment T-004 lands a test file |
| `question-bank` | no `test` script | **CI calls `bun test` directly; no script added.** `bun test` is a builtin runner, and a `"test": "bun test"` script would only add a second name for the command every doc already spells `bun test`. `package.json` stays minimal |
| `question-bank` | no `lint` script, no eslint config outside `frontend/` | **Deliberately left unlinted.** eslint is not a dependency of `question-bank`, and neither is prettier; adding either — or reaching across to `frontend/eslint.config.js`, which is React-flavoured (`react-hooks`, `react-refresh`, `globals.browser`) and would need a new config to be useful here — is a dependency decision, and `CLAUDE.md` says the worker stops and asks rather than making it. Criterion 3 deliberately asks only about `frontend`, so nothing is skipped that the brief promised. There is a comment saying so in `ci.yml` |

### Deliberately not done

- **`bun run format` on `frontend/src/`** — the fix for the blocker. Forbidden by
  criterion 8; see above.
- **Any Python job** for `api/` — out of scope; `api/` does not exist.
- **Any test file** — out of scope. Criterion 6 was exercised with a throwaway
  `frontend/src/throwaway.test.ts` that was deleted; nothing is committed.
- **Caching, build, coverage, badges, concurrency/cancel-in-progress.** The first
  four are out of scope. Concurrency is not named, but a cancelled run concludes
  `cancelled` rather than `success`/`failure`, which would make the tester's
  observations ambiguous for no benefit at this size.
- **A dead-proxy env for the test step** — out of scope, and already queued as
  T-005.
- **Adding `bun run typecheck` to `conventions.md`'s frontend command block.** It
  is now true of `frontend` and the block does not mention it. Nothing there
  became *false*, and the Constraints list the files this task may change; one
  line, proposed owner **reviewer, during the step-6 sweep**.
- **Linting or formatting `question-bank`** — see the table. If it should be
  linted, that is a task with a dependency decision in it. Proposed owner:
  **reviewer**, to add to `tasks.md` at the sweep, sized `S`.
- **SHA-pinning the two third-party actions.** `actions/checkout@v5` and
  `oven-sh/setup-bun@v2` are pinned by major tag, not commit. For a repo that
  runs a 24h `minimumReleaseAge` guard on npm this is arguably too loose; against
  that, there is no dependabot here and an unbumped SHA pin rots quietly. Flagged
  rather than decided — proposed owner: **reviewer**.

### What could not be verified from this session, and why

Say it plainly: **no GitHub Actions run was observed.** This session cannot start
one or read one. Everything below the workflow-runner level was run locally; the
YAML was parsed with `js-yaml` and its trigger/job/step structure printed, but
whether GitHub schedules and passes the job is unverified by definition.

**`frontend`'s install could not be completed here.** `frontend/bun.lock` pins 23
packages (`react-simple-maps`, the `d3-*` chain, `us-atlas`, `topojson-client`,
`commander`, `internmap` and their `@types`) to
`https://europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/…` instead
of `registry.npmjs.org`. This sandbox's egress proxy denies that host (403 on
CONNECT), so `bun install --frozen-lockfile` in `frontend/` fails here. To get a
usable `node_modules` I fetched those 23 tarballs from `registry.npmjs.org` at
their locked versions and checked each against the `sha512` in `bun.lock`: **all
23 matched**, so the mirror is a transparent cache and the lockfile's contents are
sound. That install was local-only, into gitignored `node_modules`; no tracked
file was touched.

**The risk this leaves for CI:** if that Artifact Registry repo is not readable
anonymously, `bun install --frozen-lockfile` will fail on a GitHub runner and the
`frontend` job will go red at Install. Whether it is public cannot be determined
from here. If the tester sees that, the fix is *not* in this task's scope — it
means re-resolving `frontend/bun.lock` against `registry.npmjs.org`, which
criterion 8 forbids. Proposed owner: **`task-expander`**, as its own task; the
integrity check above says such a re-resolve would produce identical package
contents.

### Evidence: mutations run locally, all reverted

Not workflow runs — the underlying commands, run in the package directory, exit
code captured. `git status` after each block confirmed the revert.

| Mutation | Command | Exit |
|---|---|---|
| *(none — baseline)* | `frontend`: `bun run typecheck` | `0` |
| *(none — baseline)* | `frontend`: `bun run lint` | **`1`** (pre-existing, see blocker) |
| *(none — baseline)* | `question-bank`: `bun run typecheck` / `bun test` | `0` / `0` (19 pass) |
| `const typeErrorProbe: number = "not a number";` appended to `frontend/src/lib/session.ts` | `bun run typecheck` | `2` |
| same, appended to `question-bank/src/normalize.ts` | `bun run typecheck` | `1` |
| `const lintProbe = 1; lintProbe = 2;` appended to `frontend/src/lib/session.ts` | `bun run lint` | `1` |
| a `expect(1).toBe(2)` test appended to `question-bank/src/sparql.test.ts` | `bun test` | `1` (19 pass, 1 fail) |

The frontend `Test` step's shell body was run verbatim in all three states it has
to handle:

| State of `frontend/src/` | Step output | Exit |
|---|---|---|
| no test files (as committed) | "No test files in frontend/ yet — skipping bun test" | `0` |
| one passing throwaway test | "Test files found … — running bun test", 1 pass | `0` |
| one failing throwaway test | "Test files found … — running bun test", 1 fail | `1` |

The throwaway file was deleted; `git status` is clean of it.

### How to run what I touched

```bash
cd frontend      && bun install --frozen-lockfile && bun run typecheck && bun run lint
cd question-bank && bun install --frozen-lockfile && bun run typecheck && bun test
```

The frontend `Test` step is the `run:` block of the step named `Test` in
`.github/workflows/ci.yml`; paste it into `bash` from inside `frontend/` to
exercise it. To see the whole thing for real, the branch has to reach GitHub —
see the branch note below.

### Branch and push

This session ran on **`claude/worker-t003-i1kbih`**, fast-forwarded to the
expander's commits, because the harness designates the branch name. The brief's
header names `claude/t002-sweep-t003-expand-ibrpor`, which carries draft PR #11.
**The worker was instructed not to push**: the push target is unresolved between
the harness and the brief, and a human is deciding it. So the commits are local
to this branch only, and **no PR yet contains them** — which is also why no
workflow run exists to observe. Resolving that is a prerequisite for the tester,
since criteria 1–6 are verified by watching runs. Proposed owner: **the human**,
before the tester session starts.

## Verdict

> Two rounds have run. **Round 2 is the live one** and is written first; round 1
> is kept below it unedited, because the amendment that produced criterion 6a–6c
> was written against it and stops making sense without it.

---

# Round 2 — **FAIL**, on criterion 6c only

Written by `tester`, session `cse_01GJgQEymzAYi8Nx1vDW4gU3`, 2026-08-08, against
the amended criteria re-approved at `4c2806d`.

**TL;DR**

- **The amendment worked.** 6a and 6b are discharged exactly as it predicted, off
  the archived runs. Criteria 1–5, 7 and 8 still pass, re-checked at the new tip.
- **6c does not hold.** The `Test` step's `exit 0` is reachable *while test files
  exist*: the guard's `find` matches only `js|jsx|ts|tsx`, but `bun test` also
  runs `.mts`, `.cts`, `.mjs` and `.cjs`. Run
  [31270170161](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31270170161)
  concluded **`success`** with a failing test in `frontend/`.
- **Next: `worker`, not `task-expander`.** One regex in `ci.yml` — a file the
  Constraints already permit. No dependency, no criteria change, no re-approval.

| # | Verdict | Evidence |
|---|---|---|
| 1 triggers | **PASS** | `on:` block; every run on PR #11 fired as `pull_request` |
| 2 type error | **PASS** | run 31234909634 — Typecheck `failure` in both jobs |
| 3 lint error | **PASS** | run 31234970937 — fe Lint `failure`, Typecheck `success` |
| 4 failing test | **PASS** | run 31234970937 — qb Test `failure`, Typecheck `success` |
| 5 green tree | **PASS** | run 31235261531 / final revert run — both jobs green |
| **6a** passing test runs | **PASS** | run 31235143550 — "running bun test", `1 pass / 0 fail`, step + run `success` |
| **6b** failing test reddens | **PASS** | run 31235108008 — **`Test` step** `failure`, run `failure` |
| **6c** nothing swallows a failure | **FAIL** | run 31270170161 — `success` with a failing test present |
| 7 lockfiles intact | **PASS** | `Lockfile unchanged` green in every job of every run |
| 8 nothing outside CI | **PASS** | re-checked at `4c2806d`: no `src/`, no `bun.lock`, no dependency |

### 6c — what was checked, and what failed

The criterion has two halves. The **enumerated half passes**: `ci.yml` contains
no `continue-on-error`, no `|| true`, no `set +e`, no `always()`, no job- or
workflow-level equivalent. The only occurrence of those strings anywhere in the
file is a comment at line 64 saying they were deliberately avoided, and the two
`--exit-code` uses are the lockfile check, which fails loudly by design.

The **reachability half fails**:

> "The one `exit 0` that bypasses `bun test` is reachable only when the
> no-test-files condition holds, so the skip disables itself when T-004 commits
> `frontend`'s first test — without anyone editing `ci.yml`."

That is false. The guard decides "no test files" with

```
-type f -regex '.*[._](test|spec)\.(js|jsx|ts|tsx)$'
```

while `bun test` discovers a wider set. Measured on a scratch tree of ten
candidate filenames, one deliberately failing test each — **bun ran all ten,
`find` matched six**:

| Filename | `bun test` runs it | workflow `find` sees it |
|---|---|---|
| `a.test.ts`, `b_test.ts`, `c.spec.ts`, `d.spec.tsx`, `i.test.js` | yes | yes |
| `nested/__tests__/j.test.ts` | yes | yes |
| **`e.test.mts`** | **yes** | **no** |
| **`f.test.cts`** | **yes** | **no** |
| **`g.test.mjs`** | **yes** | **no** |
| **`h.test.cjs`** | **yes** | **no** |

So a `frontend/` holding only `.mts`/`.cts`/`.mjs`/`.cjs` tests satisfies
`[ -z "$test_files" ]`, takes the `exit 0`, and reports the tree as having no
tests. The skip does **not** disable itself on `frontend`'s first test — it
disables itself on `frontend`'s first test *with one of four extensions*.

**Demonstrated on a real run rather than argued from the regex.** Mutation 6 put
`frontend/probe.test.mts` — asserting `1 + 1 === 3` — at `frontend/`'s root, so
`tsconfig`'s `include` (`src/**/*.ts`) and eslint's `files` (`**/*.{ts,tsx}`)
both miss it and the `Test` step is the only thing under observation. Run
[31270170161](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31270170161)
on `db919ff`:

| Job | Conclusion |
|---|---|
| `frontend (typecheck, lint, test)` | **success** |
| `question-bank (typecheck, test)` | success |
| **Run** | **success** |

with the `Test` step logging

```
No test files in frontend/ yet — skipping bun test (T-004 adds the first).
```

Locally, `bun test` in `frontend/` on that same tree reports `0 pass / 1 fail`.
**CI was green with a failing test in the repository** — the precise outcome
criterion 6 exists to prevent, arrived at through the skip rather than through
`continue-on-error`.

### Why this is `fail` and not `blocked`

Unlike round 1, nothing is frozen against the fix:

- The change is to `.github/workflows/ci.yml`, first item in the Constraints'
  "Files expected to change".
- No dependency, no lockfile, nothing under `frontend/src/` or
  `question-bank/src/` — criterion 8 is untouched.
- No criterion needs rewording. 6c is *correct as written*; the workflow does not
  satisfy it.

So it goes back to the `worker` on the same branch, per `process.md` step 4.

**Not prescribing the implementation** — but the shape is small: the extension
alternation needs the four missing extensions, and whatever it becomes should be
checked against `bun test`'s discovery rather than against a list written by
hand. A regression test is awkward here (the subject is a workflow), so the
worker re-running mutation 6 and seeing the run go **red** is the check.

### Second-order observation, not a criterion

`find` prunes `dist`, `.output` and `.vinxi`; `bun test` does not. A built tree
containing a compiled `*.test.js` would be run by bun and unseen by the guard —
the same class of divergence in the opposite direction. **Not reachable in CI
today**: no job builds, so those directories never exist on the runner. Recording
it because it shares a root cause with the 6c failure — the guard reimplements
bun's file discovery instead of asking bun — and a fix that only adds four
extensions leaves that root cause in place.

### Findings carried forward from round 1

Still true, still not criteria, still for the `reviewer`:

- **`eslint .` has no `--max-warnings`.** Every green run logs
  `✖ 7 problems (0 errors, 7 warnings)` and exits 0. Criterion 3 passes because
  error-level rules do fail the step, but warnings accumulate invisibly forever.
- **`frontend` cannot typecheck any test file** (`TS2307` on `bun:test`). Now
  explicitly out of scope here and recorded against T-004, which is right — but
  T-004's first commit will turn the frontend `Typecheck` step red until it adds
  bun's types. The amendment states this plainly; worth the reviewer confirming
  T-004's entry still carries it.

### Honesty notes on this round

- **Same session as round 1.** The brief permits it and prefers otherwise, and
  the preference is sound: I re-read my own diagnosis. Mitigation is that 6c was
  new work I had not looked at before, and its failure was found by testing
  `bun test`'s actual behaviour rather than by re-reading anything I wrote. 6a
  and 6b I re-derived from the runs' own step conclusions and logs rather than
  from my previous verdict.
- **`frontend`'s suite still cannot run in this session.** `bun install` fails
  here with 403s on the 23 packages pinned to the Lovable npm mirror, so every
  frontend claim is read off runner logs. `question-bank` ran locally: 19 pass,
  typecheck clean.
- **Branch.** Pushed to `claude/t002-sweep-t003-expand-ibrpor`, the `Branch:`
  header, under the standing grant in `CLAUDE.md` "Branches" (PR #15). No
  per-session permission was needed this round — the grant did exactly the job
  D-8 says it was written for.
- **Cycle bound.** Round 1 returned `blocked`, round 2 returns `fail`. If round 3
  does not pass, `process.md` step 4's two-round bound is reached and it goes to
  a human rather than round 4.

### Mutation 6, and confirmation it was reverted

| # | What was changed | Reverted in |
|---|---|---|
| M6 | `frontend/probe.test.mts`, a failing test with an extension the guard cannot see | this commit |

**Confirmed clean**: `git diff 4c2806d` is empty at this commit, no file matching
`probe` exists under `frontend/` or `question-bank/`, and `question-bank` reports
19 pass. **No source file was edited to make anything pass**; this round leaves
behind only this Verdict, the header and the Sessions row.

---

# Round 1 — **BLOCKED** — on criterion 6 only. Seven of eight criteria pass.

> Superseded by round 2 above, and by the criterion 6 amendment it triggered.
> Kept unedited: the amendment's reasoning, and its 6a/6b evidence table, are
> written against this text.

Back to `task-expander`, not to the `worker`: the code is not wrong, the
criterion cannot be satisfied without unfreezing something. Details below.

### The runs this verdict is read off

Every mutation was pushed to this branch, observed on PR #11, and reverted. The
final commit restores the tree byte-for-byte to `8adc7b3` (`git diff 8adc7b3`
empty).

| Run | SHA | Tree | Conclusion |
|---|---|---|---|
| [31225020656](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31225020656) | `8adc7b3` | unmutated baseline | **success** |
| [31234909634](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31234909634) | `e86be44` | M1 — type error in *both* packages | **failure** |
| [31234970937](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31234970937) | `59b6680` | M2 — lint error (frontend) + false assertion (question-bank) | **failure** |
| [31235019281](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31235019281) | `f2ef5b2` | M3 — **passing** test at `frontend/src/` | **failure** ← criterion 6 |
| [31235108008](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31235108008) | `12917d0` | M4 — **failing** test at `frontend/src/` | **failure** |
| [31235143550](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31235143550) | `4e1d7b5` | M5 — passing test at `frontend/` root, outside `tsconfig` include | **success** |

Step-level conclusions, which are what make each criterion independently
readable:

| Run | fe Typecheck | fe Lint | fe Test | qb Typecheck | qb Test |
|---|---|---|---|---|---|
| `8adc7b3` | success | success | success (skipped) | success | success |
| M1 | **failure** | success | success | **failure** | success |
| M2 | success | **failure** | success | success | **failure** |
| M3 | **failure** | success | success (1 pass) | success | success |
| M4 | **failure** | success | **failure** | success | success |
| M5 | success | success | success (1 pass) | success | success |

### Criterion by criterion

**1 — Triggers. PASS.** `on:` is `pull_request: branches: [main]` and
`push: branches: [main]`; `main` is the default branch (it is the base of PR #11).
All six runs above fired as `event: pull_request` against PR #11, so the
pull-request half is observed, not merely read. The push-to-`main` half is read
off the trigger block only — it cannot be observed until this branch merges. The
brief anticipates this ("read off the committed files").

**2 — A type error fails the run. PASS.** M1 appended
`export const typeErrorProbe: number = "not a number";` to
`frontend/src/lib/session.ts` *and* `question-bank/src/normalize.ts` in one
commit. Run `31234909634` concluded `failure` with the **Typecheck step failing
in both jobs independently** — so both packages are covered, which is what the
criterion's second sentence asks. Note the `question-bank` Test step still ran
and passed: a failing step does not stop the others, and the job still fails.

**3 — A lint error fails the run. PASS.** M2 appended
`export const lintProbe   =   1;` to `frontend/src/lib/session.ts` — a
`prettier/prettier` violation, which `eslint-plugin-prettier/recommended` sets to
**error**. Deliberately type-valid, so the failure is isolated: frontend
Typecheck `success`, Lint **`failure`**, run `failure`.

**4 — A failing test fails the run. PASS.** M2 also changed
`question-bank/src/normalize.test.ts:27` from `toHaveLength(50)` to
`toHaveLength(49)` against the 50-row fixture — an *existing* test made to assert
something false, as the criterion words it. Isolated the same way: question-bank
Typecheck `success`, Test **`failure`** (18 pass / 1 fail), run `failure`.

**5 — A green tree passes. PASS.** Run `31225020656` on the unmutated tip:
both jobs `success`. The frontend Test step logged `No test files in frontend/
yet — skipping bun test (T-004 adds the first).` and exited 0, so the bare
`bun test` exit code of 1 is demonstrably not what decided the run.

**6 — Criterion 5 is not bought by skipping frontend tests. FAILS AS WRITTEN.**

The criterion has two halves. The second holds; the first does not.

- *Adding a failing test file under `frontend/src/` yields `failure`* — **holds**
  (M4). The Test step itself concluded `failure`, so bun's exit code really does
  decide once a file exists.
- *Adding a **passing** test file under `frontend/src/` still yields `success`* —
  **does not hold**. M3 concluded **`failure`**.

**The guard is not what failed.** M3's Test step behaved exactly as designed: it
found the file, stopped skipping, ran `bun test`, and passed —
`Test files found (first match: ./src/t003-probe.test.ts) — running bun test.` /
`1 pass  0 fail`. The job died one step earlier:

```
$ tsc --noEmit
src/t003-probe.test.ts(1,30): error TS2307: Cannot find module 'bun:test' or its
corresponding type declarations.
##[error]Process completed with exit code 2.
```

`frontend` has no `@types/bun` in its devDependencies, and `tsconfig.json` sets
`"types": ["vite/client"]` while `include` covers `src/**/*.ts`. So **any** bun
test file under `frontend/src/` fails `tsc` before its assertions matter. Writing
the test without the import does not help — the globals are equally unknown to
`tsc`.

M5 nails the diagnosis down. The same passing test, moved to `frontend/`'s root
so `tsconfig`'s `include` misses it while the workflow's `find` still sees it,
concluded **`success`** with every step green and `bun test` reporting `1 pass`.
So: the workflow's handling of frontend tests is correct, and the sole obstacle
to criterion 6 is the package's own type configuration.

**Why this is `blocked` and not `fail`.** Nothing the worker is permitted to do
turns it green:

| Fix | Blocked by |
|---|---|
| Add `@types/bun` to `frontend` devDependencies | Criterion 8 — "no dependency is added to either `package.json`'s `dependencies` or `devDependencies`", and it would change `frontend/bun.lock`, also criterion 8. `CLAUDE.md` also sends dependencies to a human |
| Exclude test files in `frontend/tsconfig.json` | Permitted by criterion 8 (not under `src/`, not a dep, not a lockfile) but forbidden by Constraints — "Files expected to change: … Nothing else" |
| Point the `typecheck` script at a test-free project | `tsc` has no exclude-files flag; needs a second `tsconfig`, again a new file outside Constraints |

That is the same shape the worker hit with the lint blocker, and the brief itself
classified that shape as **blocked** — "a criterion that is wrong as written …
because no change the worker is permitted to make can turn it green". So this
goes back through `task-expander` for a fresh approval, per `process.md` step 4.

**What the expander should decide.** Two honest routes, both cheap:

1. **Reword criterion 6 to name the guard**, which is what it was always about —
   e.g. "adding a test file under `frontend/` makes the Test step run `bun test`
   rather than skip, and the test's own result decides the step". Run
   `31235143550` (pass → `success`) and run `31235108008` (fail → Test step
   `failure`) already discharge that wording; no further work. Recommended.
2. **Widen the brief** to permit `@types/bun` plus the lockfile change, or to
   permit `frontend/tsconfig.json`, and keep criterion 6 literal. This is really
   T-004's problem arriving early — `frontend` cannot hold *any* typechecked test
   until it is solved, so it has to be solved by T-004 regardless.

Either way it is a criteria decision with a human approval attached, which is
exactly why this is not the worker's to take.

**7 — The run does not rewrite either lockfile. PASS.** Both jobs run
`bun install --frozen-lockfile` and then a `Lockfile unchanged` step
(`git diff --exit-code -- bun.lock`). That step concluded `success` in **every
job of every run above**, including frontend installs that resolved 436 packages.
Neither `bun.lock` is in this branch's diff against `origin/main` either.

**8 — Nothing outside CI changes. PASS.** `git diff origin/main...` at the
reverted tip touches five files: `.github/workflows/ci.yml` (new), one script
line in `frontend/package.json`, this brief, and `tasks.md` / `PROGRESS.md` from
the expander's T-002 sweep. Checked individually:

- `git diff origin/main... -- frontend/src question-bank/src` — **empty**.
- `git diff origin/main... -- frontend/bun.lock question-bank/bun.lock` — **empty**.
- `frontend/package.json` gains only `"typecheck": "tsc --noEmit"`; no
  `dependencies` or `devDependencies` entry. `question-bank/package.json` is
  untouched.

### The pre-existing suite

`question-bank`: `bun run typecheck` exit 0, `bun test` **19 pass / 0 fail**,
both locally and in run `31235143550`. `frontend` has no tests by design until
T-004; its typecheck and lint are green on the runner.

**`frontend`'s suite could not be run in this session, and that is worth
stating.** `bun install --frozen-lockfile` fails here with 403s on the 23
packages `frontend/bun.lock` pins to
`europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache` — this sandbox's
egress policy, the same wall the worker hit. So every frontend claim in this
verdict is read off GitHub runner logs rather than local execution. The runner
installs those packages without trouble, so this is a limitation of the verifying
session, not of the workflow.

### Findings that are not criteria

Recorded for the `reviewer` rather than blocking anything.

1. **`eslint .` never fails on warnings, and the tree already has seven.** Every
   green run logs `✖ 7 problems (0 errors, 7 warnings)` and exits 0 — all
   `react-refresh/only-export-components`. Criterion 3 is satisfied because
   error-level rules do fail the step, but the Lint gate is weaker than it looks:
   warnings accumulate invisibly forever. `eslint . --max-warnings 0` would close
   it, and the seven existing warnings would have to be fixed or explicitly
   allowed first. Not in this task's scope; worth a queue entry.
2. **Criterion 6's real subject is untested by criterion 6's wording.** The
   guard's job is to self-disable when T-004 lands. M5 proves it does. The
   criterion's literal wording tested the package's tsconfig instead, which is
   how a green-looking task ends up blocked on something unrelated to its own
   diff. Worth remembering the next time a criterion is written against a file
   path rather than a behaviour.
3. **`frontend` cannot typecheck any test file today.** Whatever T-004 does, its
   first commit has to add `@types/bun` (or equivalent) and adjust
   `tsconfig.json`'s `types`. Worth adding to T-004's entry now, while the
   TS2307 is in front of us, so that task does not rediscover it.

### On the branch mismatch

`process.md` and `tester.md` both say a tester whose session branch differs from
the brief's `Branch:` header must stop. It did differ: this session was assigned
`claude/t003-tester-startup-gi675x`, the header names
`claude/t002-sweep-t003-expand-ibrpor`.

I stopped and asked before committing anything, and **Dkaattae authorised pushing
to the header's branch** — which is the branch PR #11 is built from, so the
commits are where every downstream role will look. This is the D-8 rule working
as intended rather than an exception to it: the header stayed the authority, and
the harness's default branch was the one overridden.

It also could not have gone the other way. Criteria 2, 3, 4 and 6 are verified by
observing run conclusions, the workflow triggers only on `pull_request` → `main`
and `push` → `main`, and PR #11 is the task's only PR. Tests pushed to the
session branch would have produced no runs at all — the T-003 stranding failure a
second time, in the role whose whole output is observations.

### Mutations, and confirmation that every one was reverted

Six commits: five mutations and the revert. Each mutation commit records the
previous run's result, so the branch history reads as the experiment log.

| # | What was changed | Reverted in |
|---|---|---|
| M1 | `typeErrorProbe` appended to `frontend/src/lib/session.ts` and `question-bank/src/normalize.ts` | `59b6680` |
| M2 | `lintProbe` appended to `frontend/src/lib/session.ts`; `normalize.test.ts:27` → `toHaveLength(49)` | `f2ef5b2` |
| M3 | `frontend/src/t003-probe.test.ts`, passing | `12917d0` |
| M4 | `frontend/src/t003-probe.test.ts`, failing | `4e1d7b5` |
| M5 | `frontend/t003-probe.test.ts`, passing, outside `tsconfig` include | this commit |

**Confirmed clean**: at this commit `git diff 8adc7b3` is empty — the tree is
byte-identical to the pristine pre-tester state — and no file matching
`t003-probe`, `typeErrorProbe` or `lintProbe` exists anywhere under `frontend/`
or `question-bank/`. One correction worth recording: M1's first revert attempt
used `git checkout --` against `HEAD`, which had already *committed* the
mutation, so it restored the mutated file. Caught locally before the push by
re-running `bun run typecheck`; the revert now restores from `8adc7b3` explicitly.

**No source file was edited to make anything pass.** The only changes this
session leaves behind are this Verdict, the header, and the Sessions row.

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

### Worker's notes

**The first thing CI found was that the tree was already red.** `frontend`'s
committed source has never been run through the repo's own prettier config, and
because `eslint.config.js` runs prettier as a rule, `bun run lint` has been
failing since `721efeb` — the commit that added both the code and the config.
This was not a version drift: prettier `3.9.6` (what `bun.lock` pins) and
`3.7.3` (the floor of the `^3.7.3` range in `package.json`) flag the same 7
files, so it is the source that never matched the config, not the config that
moved. That is the whole argument for this task in one observation, and it is
also what makes criteria 3, 5 and 8 unsatisfiable together. See the Handoff's
blocker; the decision is the expander's and the human's, not the worker's.

**The `if:` conditions on the check steps are not an escape hatch.** Each check
after Install carries `if: ${{ !cancelled() && steps.install.outcome ==
'success' }}`, which makes the three checks independent of *each other* rather
than fail-fast. A failing step still fails its job and the run — nothing is
softened. Two reasons: one red check should not hide the results of the others,
and more concretely, with lint red today a fail-fast job would never reach the
`Test` step, so criterion 6 could not be demonstrated at all.

**The lockfile guard is doubled on purpose.** `--frozen-lockfile` prevents the
drift; the `Lockfile unchanged` step (`git diff --exit-code -- bun.lock`) puts
the proof in the run's log, which is where the brief says criterion 7 gets read
off. It costs a second and turns an assumption into an observation.

**`frontend/bun.lock` points 23 packages at a sandbox npm mirror**
(`europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache`), a leftover from
whatever environment first resolved it. Their tarballs are byte-identical to
`registry.npmjs.org` (all 23 sha512s checked), so nothing is wrong with the
*contents* — but if that registry is not anonymously readable, `frontend`'s
Install step will fail on a GitHub runner for reasons that have nothing to do
with this workflow. Unverifiable from the sandbox, which denies that host.
Flagged in the Handoff with `task-expander` as the proposed owner.

**On criterion 6.** The obvious way to satisfy criterion 5 is to make the
frontend test step tolerate a non-zero exit, and the obvious way to do *that* is
`continue-on-error` or `|| true`. Both would still be in place when T-004 lands,
at which point `frontend`'s tests would be running and being ignored — a green
check certifying nothing. Criterion 6 is there to make that outcome fail
verification rather than fail silently two tasks later.
