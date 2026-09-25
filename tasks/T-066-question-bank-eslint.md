# T-066 — `question-bank/` gets eslint and a `lint` gate

**Status:** `blocked`
**Next step:** `human`
**Approved:** katechen150621@gmail.com — 2026-09-25, in chat during an orchestrated run. See `runs/T-066-question-bank-eslint.md`.
**From:** [`tasks.md`](../tasks.md) T-066
**Branch:** `claude/relaxed-pascal-ff0fgq` — assigned to the expander's session by
the harness, branched from `origin/main` at `01a32eb`. Every later role pushes
here (`CLAUDE.md` "Branches").
**PR:** #62, opened draft at expand time, built from the branch above.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-25 | cse_01YTpStg8yzQNkWGJJbUnMAP |
| worker | 2026-09-25 | cse_01YTpStg8yzQNkWGJJbUnMAP |

## Goal

Briefs touching `question-bank/` keep requiring `bun run lint`, and the package
has never had one (T-011 criterion 13). The dependency decision is made —
katechen150621@gmail.com, 2026-09-25: "add eslint" (recorded in `tasks.md`
T-066) — so give the package a real lint gate that fails on warnings, runs in
CI, and is documented where the next brief writer will see it.

## What is already true, and what is not

Surveyed on `01a32eb`. **None of the deliverable exists yet**, and two things in
the repo actively pin its absence — the worker has to change both:

- `question-bank/package.json` has `build`, `build:sample`, `typecheck` — no
  `lint`, no eslint in `devDependencies`, no eslint config in the package.
- `.github/workflows/ci.yml:118-121` (question-bank job) carries a comment
  "No lint step: question-bank has no eslint config and no eslint dependency…",
  and there is no Lint step between Typecheck and Test.
- **`frontend/src/lint-gate.test.ts:155`** (T-006 criterion 7) asserts
  `expect(ciYml).toMatch(/No lint step[\s\S]*?#11/)`. Removing that comment turns
  this existing test red; it is expected to be updated in this task (criterion 11).
- `conventions.md` "Commands", question-bank block, names `bun run typecheck` but
  no `lint`. `frontend/src/conventions-doc.test.ts` already checks that every
  `bun run <script>` named there is a real script, so a named `lint` is checked
  for free once it exists.
- `question-bank/` pins `typescript` `^7.0.2`; `frontend/` is on `^5.8.3`. See
  Constraints — this is the one place the task can turn into a second dependency
  question.

## Acceptance criteria

"Run `bun run lint`" below always means from `question-bank/`, via the
package's own script, not by invoking eslint directly.

**The gate exists and is clean**

1. `question-bank/package.json` `scripts` has a key `lint`, and `bun run lint`
   exits 0 on the committed tree.
2. On the committed tree, `bun run lint`'s combined stdout and stderr contain
   neither the word `warning` nor eslint's problem summary (`✖`) — zero
   problems, not merely an exit code that happened to be 0.

**It fails when it should — each checked with a temporary probe file under
`question-bank/src/` that is removed afterwards**

3. **A warning alone fails the script.** A probe producing exactly one eslint
   warning and no error (for example an unused `// eslint-disable-next-line`
   directive, which eslint 9 reports as a warning by default) makes
   `bun run lint` exit non-zero. The limit lives in the `lint` script itself, so
   local and CI verdicts agree (the same rule as `engineering-decisions.md` E-4).
4. **A core JavaScript rule is on.** A probe containing a `debugger;` statement
   makes `bun run lint` exit non-zero (`no-debugger`, in `@eslint/js`'s
   recommended set).
5. **A TypeScript rule is on.** A probe whose only problem is an explicit `any`
   annotation (`const x: any = 1; export { x };`) makes `bun run lint` exit
   non-zero (`@typescript-eslint/no-explicit-any`, in typescript-eslint's
   recommended set). This is what shows the TypeScript files are actually parsed
   as TypeScript rather than skipped or linted as JavaScript.
6. **Coverage reaches every `.ts` file under `src/`, tests included.** The
   `debugger;` probe of criterion 4 fails the script at each of three
   locations, checked separately: `src/<probe>.ts`, `src/<probe>.test.ts`, and
   one directory deeper, `src/sinks/<probe>.ts`.
7. **Formatting is not this gate's job.** A probe that is lint-clean but
   deliberately mis-formatted for prettier (for example single quotes, no
   semicolons, a 150-column line) leaves `bun run lint` at exit 0. Prettier
   drift in this package is T-071's, and 22 files currently fail it; a lint
   gate that enforced formatting would either be red on `main` or would drag
   T-071's reformat into this diff.

**No behaviour moves**

8. `bun test` and `bun run typecheck` pass in `question-bank/`, and `bun test`,
   `bun run typecheck` and `bun run lint` pass in `frontend/`.
9. No file under `question-bank/data/` or `question-bank/sample-data/` differs
   from the branch point `01a32eb`. Any source edits made to satisfy the new
   rules change no committed output.
10. Every `eslint-disable` comment (any form: `eslint-disable`,
    `eslint-disable-line`, `eslint-disable-next-line`) under
    `question-bank/src/` carries an eslint description after ` -- ` stating why.
    Zero such comments also satisfies this. Likewise every rule the config sets
    to `"off"` or `"warn"` has a comment beside it saying why.

**CI runs it**

11. `.github/workflows/ci.yml`'s `question-bank` job has a step whose `run:` is
    exactly `bun run lint`, carrying the same `if:` condition as that job's
    Typecheck step (`${{ !cancelled() && steps.install.outcome == 'success' }}`),
    so a red lint does not hide a red test. The job's `name:` reflects that it
    now lints.
12. `ci.yml` no longer states that `question-bank` has no lint step, no eslint
    config or no eslint dependency, and `frontend/src/lint-gate.test.ts` no
    longer asserts that it does. The rest of that file's criterion-7 test (no
    "brief's Handoff" in `ci.yml`) and its criterion-6 test (no `--max-warnings`
    anywhere in `ci.yml`) still hold and still run.
13. `bun run lint` exits 0 on the committed tree with all six proxy variables
    (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` and their lowercase forms) set to
    `http://127.0.0.1:1` — the lint needs no network, so it cannot depend on a
    `bunx` download.

**Dependencies — the approved one and nothing else**

14. Every package added to `question-bank/package.json` is in
    `devDependencies`, and the added set is a subset of `eslint`, `@eslint/js`,
    `typescript-eslint`, `globals`. No `dependencies` key is added. In
    particular, no `eslint-plugin-prettier`, `eslint-config-prettier` or
    `prettier` (T-071), and no config loader such as `jiti`.
15. `question-bank/package.json`'s existing `typescript` and `@types/bun`
    entries are byte-for-byte unchanged.
16. `question-bank/bun.lock` is committed alongside, and `bun install
    --frozen-lockfile` in `question-bank/` leaves `bun.lock` unchanged — the
    same thing CI's "Lockfile unchanged" step checks.
17. `frontend/package.json` and `frontend/bun.lock` do not change.

**Written where a brief writer will trip over it**

18. `conventions.md` "Commands", in the question-bank block, names
    `bun run lint`.
19. None of `conventions.md`, `README.md`, `question-bank/README.md`,
    `test-guidelines.md` or `ci.yml` says or implies that `question-bank/` has
    no lint or no eslint. (`PROGRESS.md`'s Completed-tasks history, which
    records the state at the time, is exempt.)

## Out of scope

- **Prettier in `question-bank/`** — formatting the 22 drifted files, pinning
  prettier, a format gate in CI, `eslint-plugin-prettier`. All of it is T-071.
  Criterion 7 exists to keep this line clean.
- **Type-aware linting** (`parserOptions.project`, `recommendedTypeChecked`).
  The recommended, non-type-checked sets are the bar; tightening further is a
  later task.
- **Refactoring beyond what the rules demand.** If recommended rules flag
  existing code, fix the minimum; do not restructure.
- **Linting anything outside `question-bank/src/`** as a requirement — the
  config file itself, `data/`, fixtures JSON. Allowed, not required.
- **`frontend/`'s eslint config and the frontend lint gate** — untouched,
  except the one assertion in `lint-gate.test.ts` criterion 12 names.
- **Other stale text in `ci.yml`** (e.g. the backend job's test count comment)
  — not this task's; file it in `tasks.md` if it matters.
- **An `engineering-decisions.md` entry** — not required. Allowed if the worker
  makes a choice that could reasonably have gone the other way (see
  Constraints on TypeScript 7); `E-15` is next.

## Constraints

- **Files expected to change:** `question-bank/package.json`,
  `question-bank/bun.lock`, a new eslint config in `question-bank/`,
  `.github/workflows/ci.yml`, `frontend/src/lint-gate.test.ts`,
  `conventions.md`; source files under `question-bank/src/` only where the new
  rules require a fix. Anything else needs a reason in the Handoff.
- **Dependencies:** the approval is "add eslint", read as the minimum stack
  that lets eslint lint TypeScript — the set in criterion 14, mirroring what
  `frontend/` already uses. `bun add -d` only; never npm/yarn/pnpm.
- **TypeScript 7 is the known risk. Stop and ask rather than work around it.**
  `question-bank/` is on `typescript` `^7.0.2`; typescript-eslint's parser
  imports the `typescript` package. If the approved packages cannot lint this
  package with its current TypeScript, the fix is **not** yours to pick:
  downgrading or adding a second `typescript`, adding a different parser, or
  anything outside criterion 14 is a new dependency decision (`CLAUDE.md`
  "Packages"). Write the question into this brief, set `Status: blocked`,
  `Next step: human`, commit, push, stop.
- **No `--max-warnings` in `ci.yml`** — the limit goes in the script
  (criterion 3; `lint-gate.test.ts` criterion 6 enforces it repo-wide).
- **No network in tests** (`test-guidelines.md`). Tests that shell out to
  `bun run lint` are fine; `bunx` fetching anything is not.
- **Probe files never stay in the tree**, including when a test fails midway —
  clean up in `afterEach`, as `frontend/src/lint-gate.test.ts` does.
- Not gated by `run-loop.sh` G1: `.github/workflows/` is outside
  `GATED_PATHS`, and T-005/T-006/T-008 changed `ci.yml` through the loop.

## Context

Required reading for the worker and the tester.

- **`tasks.md` T-066** — the entry and the recorded answer ("add eslint").
- **`tasks.md` T-071** — the neighbouring prettier task this must not absorb.
- **`engineering-decisions.md` E-4** — why the warning limit lives in the
  script, not the workflow.
- **`frontend/eslint.config.js`** — the house shape (flat config,
  `tseslint.config(...)`, `js.configs.recommended` +
  `tseslint.configs.recommended`). Drop the React plugins and the prettier
  plugin; they do not apply here.
- **`frontend/src/lint-gate.test.ts`** — the probe-file pattern (`runLint()`
  via `bun run lint`, `writeProbe`, `afterEach` cleanup) to reuse for
  criteria 3–7, and lines 142–157 for criteria 11–12.
- **`.github/workflows/ci.yml`** — `question-bank` job, lines ~92–137; the
  `frontend` job's Lint step (line ~55) is the shape to copy.
- **`conventions.md`** "Commands", and `frontend/src/conventions-doc.test.ts`
  criterion 9 (`bunScriptsIn`), which reads it.
- **`test-guidelines.md`** — "No network in tests, ever".
- **`CLAUDE.md`** "Packages" — lockfile committed with the dependency.

## Handoff

_Written by `worker`._

**TL;DR — blocked on the risk the Constraints section named. typescript-eslint
refuses to load against `typescript@7.0.2`, so no config built from the
approved set can satisfy criterion 5. Nothing is committed except this brief.
A human has to pick a dependency route (below), then the brief goes back to
`task-expander` because every route but D conflicts with criterion 14 or 15.**

**What I did**

- `bun add -d eslint @eslint/js typescript-eslint globals` in `question-bank/`
  resolved to `eslint@10.11.0`, `@eslint/js@10.0.1`, `typescript-eslint@8.70.1`,
  `globals@17.12.0`. bun warned `incorrect peer dependency "typescript@7.0.2"`
  twice.
- I wrote a minimal flat config (`js.configs.recommended` +
  `tseslint.configs.recommended`, `files: ["**/*.ts"]`, node globals) and ran
  `./node_modules/.bin/eslint src`. It failed while loading the config:

  ```
  typescript-eslint does not support TS 7.0.
  Please see https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0 to run typescript-eslint using the TS 6 API.
  See also https://github.com/typescript-eslint/typescript-eslint/issues/10940 for tracking typescript-eslint's support for TS >=7.1
  Error: typescript-eslint does not support TS 7.0.
      at Object.<anonymous> (.../node_modules/typescript-eslint/dist/index.js:52:11)
  ```

- **It is a hard check, not a warning.** `typescript-eslint/dist/index.js`
  reads `require("typescript").versionMajorMinor` and throws when the major is
  7 or more. The peer range of `typescript-eslint` and
  `@typescript-eslint/typescript-estree` is `>=4.8.4 <6.1.0`. There is also
  nothing to parse with: `typescript@7`'s main export is `lib/version.cjs`,
  which exports only the version strings, not the compiler API the parser
  uses.
- **Reverted all of it.** `git checkout -- package.json bun.lock`, deleted the
  config, `bun install --frozen-lockfile` reported no changes. `git status`
  was clean apart from this brief. Branch point `01a32eb` is untouched.

**Files changed:** only `tasks/T-066-question-bank-eslint.md`: Status, Next
step, Sessions row, this Handoff, Notes.

**Criteria:** none are implemented. I did not try to build around criterion 5.
Linting `.ts` without typescript-eslint cannot parse TypeScript syntax. The
Constraints section also says to stop here, not work around it.

**The decision a human has to make.** Each route below needs a new dependency
decision (`CLAUDE.md` "Packages"). Routes A–C also need criteria 14 and/or 15
re-expanded and re-approved.

| Route | What it means | Criteria it conflicts with |
|---|---|---|
| **A. Side-by-side, as Microsoft's TS 7 post recommends** | `typescript` goes to `^6.0` (for typescript-eslint). TS 7 stays as the type-checker under an alias, e.g. `"@typescript/native": "npm:typescript@^7.0.2"`, which is what typescript-eslint's own devDependencies do. `typecheck` points at that alias's `tsc`. | 15 (the `typescript` entry changes), 14 (adds a package outside the set) |
| **B. Downgrade `question-bank/` to TS 5.8/6.0** | Match `frontend/` (`^5.8.3`). This gives up TS 7's type-checker in this package. | 15 |
| **C. A different TS-capable parser or linter** | For example oxlint or biome instead of eslint. | 14, and the "add eslint" answer itself |
| **D. Wait** | Park T-066 until typescript-eslint supports TS 7 (issue #10940). Briefs keep failing to find `bun run lint` in the meantime. | none, but nothing ships |

The worker does not recommend a route. A is the one that fits the error
message and upstream's own setup. B is the smallest diff.

**Minor, for the expander on re-expansion:** `bun add` picks up **eslint 10**,
while `frontend/` is on eslint 9. Criterion 3 describes the eslint 9 default
for unused disable directives. The expander should decide whether to pin
`eslint@^9` to match `frontend/`, or check that eslint 10 still reports this as
a warning.

**How to reproduce:** in `question-bank/`, run
`bun add -d eslint @eslint/js typescript-eslint globals`, add any
`eslint.config.js` that imports `typescript-eslint`, and run
`./node_modules/.bin/eslint src`. Then revert with
`git checkout -- package.json bun.lock`.

## Verdict

_Written by `tester`._

## Notes

- **worker, 2026-09-25:** the brief called this risk correctly. The failure is
  an explicit version guard in typescript-eslint, not a soft
  peer-dependency mismatch. Owner: **a human (katechen150621@gmail.com)**
  picks a route from the Handoff table. Then **task-expander** rewrites
  criteria 14/15 to match, and the brief goes back through approval before a
  worker runs again.
