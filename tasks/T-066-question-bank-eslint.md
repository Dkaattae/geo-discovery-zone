# T-066 — `question-bank/` gets oxlint and a `lint` gate

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** katechen150621@gmail.com — 2026-09-28, in chat, for the oxlint re-expansion (round 3). The round-1 approval covered the eslint criteria only. See `runs/T-066-question-bank-eslint.md`.
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
| task-expander (re-expand, oxlint) | 2026-09-25 | cse_01YTpStg8yzQNkWGJJbUnMAP |
| worker (round 2, oxlint) | 2026-09-28 | cse_01YTpStg8yzQNkWGJJbUnMAP |

## Goal

Briefs touching `question-bank/` keep requiring `bun run lint`, and the package
has never had one (T-011 criterion 13). Give it a real lint gate that fails on
warnings, runs in CI, and is documented where the next brief writer will see
it. The linter is **oxlint**: typescript-eslint refuses to load against this
package's `typescript@7` (round 1's Handoff, below), and
katechen150621@gmail.com answered on 2026-09-25: "go with oxlint" (recorded
under "Human answer" below).

## What is already true, and what is not

Re-surveyed at `543c2af` (branch head; source identical to branch point
`01a32eb` — round 1 reverted everything it tried). **None of the deliverable
exists yet**:

- `question-bank/package.json` has `build`, `build:sample`, `typecheck`. It has
  no `lint` script and no linter in `devDependencies`.
- `.github/workflows/ci.yml:118-121` (question-bank job, named
  `question-bank (typecheck, test)`) carries a comment "No lint step:
  question-bank has no eslint config and no eslint dependency…". There is no
  Lint step between Typecheck and Test.
- **`frontend/src/lint-gate.test.ts:155`** (T-006 criterion 7) asserts
  `expect(ciYml).toMatch(/No lint step[\s\S]*?#11/)`. Removing that comment
  turns this existing test red. It is expected to change in this task
  (criterion 13).
- `conventions.md` "Commands", question-bank block (lines ~59–66), names
  `bun run typecheck` and `bun test` but no `lint`.
  `frontend/src/conventions-doc.test.ts` already checks that every
  `bun run <script>` named there is a real script.
- **Three `eslint-disable-next-line` comments already exist**, none with a
  reason: `question-bank/src/sinks/db.ts:30` and `:39`
  (`@typescript-eslint/no-unused-vars`), and `question-bank/src/build.ts:83`
  (`no-fallthrough`). oxlint honours `eslint-disable` directives as well as its
  own `oxlint-disable`. Criterion 10 covers these three.
- **No explicit `any` in `question-bank/src/`.** A grep for `: any`, `as any`,
  `<any>` and `any[]` finds nothing, so criterion 5 should not force source
  edits.
- `question-bank/` pins `typescript` `^7.0.2`. oxlint parses TypeScript with its
  own Rust parser and does not import the `typescript` package. That is why it
  was chosen, and why criterion 15 can still hold.

## Acceptance criteria

"Run `bun run lint`" below always means from `question-bank/`, via the
package's own script, not by invoking oxlint directly.

**The gate exists and is clean**

1. `question-bank/package.json` `scripts` has a key `lint`, and `bun run lint`
   exits 0 on the committed tree.
2. On the committed tree, `bun run lint`'s output reports **zero warnings and
   zero errors** (oxlint's summary line, e.g. `Found 0 warnings and 0 errors`).
   An exit code of 0 alone is not enough.
3. The linter that `bun run lint` runs is oxlint, and it is the one installed in
   `question-bank/node_modules`. The script does not use `bunx`, `npx` or any
   other on-demand download.

**It fails when it should. Check each with a temporary probe file under
`question-bank/src/`, removed afterwards.**

4. **A core JavaScript rule is on.** A probe containing a `debugger;` statement
   makes `bun run lint` exit non-zero (`eslint/no-debugger`).
5. **A TypeScript rule is on.** A probe whose only problem is an explicit `any`
   annotation (`const x: any = 1; export { x };`) makes `bun run lint` exit
   non-zero (`typescript/no-explicit-any`). This mirrors `frontend/`'s
   typescript-eslint recommended set. oxlint does not enable this rule by
   default, so it has to be switched on deliberately.
6. **A warning alone fails the script.** Add extra arguments to one
   `bun run lint` run so that a single rule is enabled at warning severity,
   using oxlint's `-W <rule>`. Pick a rule the committed config does not
   configure, and use a probe that violates only that rule. For example, `-W
   eqeqeq` with `export const f = (a: number) => a == 1;`, if `eqeqeq` is not
   already configured. The run exits non-zero. The warning limit lives in the
   `lint` script itself, so local and CI verdicts agree (the same rule as
   `engineering-decisions.md` E-4). The tester names the rule it used in the
   Verdict.
7. **Coverage reaches every `.ts` file under `src/`, tests included.** Run the
   `debugger;` probe from criterion 4 at each of three locations separately:
   `src/<probe>.ts`, `src/<probe>.test.ts`, and one directory deeper,
   `src/sinks/<probe>.ts`. Each one makes the script fail.
8. **Formatting is not this gate's job.** A probe that is lint-clean but
   deliberately mis-formatted for prettier leaves `bun run lint` at exit 0. For
   example: single quotes, no semicolons, a 150-column line. Prettier drift in
   this package belongs to T-071.

**No behaviour moves**

9. In `question-bank/`, `bun test` and `bun run typecheck` pass. In
   `frontend/`, `bun test`, `bun run typecheck` and `bun run lint` pass.
10. **Every lint-suppression comment under `question-bank/src/` states why.**
    This covers `eslint-disable` and `oxlint-disable` in every form: file-wide,
    `-line` and `-next-line`. Each one carries a reason, either after ` -- ` on
    the same line or in a comment on the line directly above it. The three
    existing directives listed in the survey are included. Having zero such
    comments also satisfies this criterion.
11. **Every rule or category the lint config turns off or down to warning has
    a reason recorded beside it.** Put the reason in the config file as a
    comment. If the chosen config format does not allow comments, put it in
    `question-bank/README.md`.
12. No file under `question-bank/data/` or `question-bank/sample-data/` differs
    from the branch point `01a32eb`.

**CI runs it**

13. `.github/workflows/ci.yml`'s `question-bank` job has a step whose `run:` is
    exactly `bun run lint`. It carries the same `if:` condition as that job's
    Typecheck step (`${{ !cancelled() && steps.install.outcome == 'success' }}`),
    so a red lint does not hide a red test. The job's `name:` reflects that it
    now lints.
14. `ci.yml` no longer states that `question-bank` has no lint step, no lint
    config or no linter dependency. `frontend/src/lint-gate.test.ts` no longer
    asserts that it does. Two tests in that file still hold and still run: the
    rest of the criterion-7 test (no "brief's Handoff" in `ci.yml`) and the
    criterion-6 test (`run: bun run lint` is present and there is no
    `--max-warnings` anywhere in `ci.yml`).
15. `bun run lint` exits 0 on the committed tree with all six proxy variables
    set to `http://127.0.0.1:1`: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` and
    their lowercase forms.

**Dependencies: exactly the approved one**

16. The only package added to `question-bank/package.json` is `oxlint`, and it
    is in `devDependencies`. No `dependencies` key is added. Specifically, none
    of these is added: `eslint`, `@eslint/js`, `typescript-eslint`, `globals`,
    `oxlint-tsgolint` (type-aware linting), anything prettier (T-071), or
    `biome`. oxlint's own platform-binary packages (`@oxlint/*`) may appear in
    `bun.lock` as its optional dependencies, but not in `package.json`.
17. `question-bank/package.json`'s existing `typescript` and `@types/bun`
    entries are byte-for-byte unchanged, and no `trustedDependencies`,
    `overrides` or `resolutions` key is added.
18. `question-bank/bun.lock` is committed alongside the change, and
    `bun install --frozen-lockfile` in `question-bank/` leaves `bun.lock`
    unchanged. This is the same thing CI's "Lockfile unchanged" step checks.
19. `frontend/package.json` and `frontend/bun.lock` do not change.
20. No eslint config file exists in `question-bank/`. That means no
    `eslint.config.*` and no `.eslintrc*`.

**Written where a brief writer will trip over it**

21. `conventions.md` "Commands", in the question-bank block, names
    `bun run lint`.
22. `conventions.md` or `question-bank/README.md` says that `question-bank/`
    lints with **oxlint, not eslint**. That way nobody writing a brief assumes
    the frontend's eslint config or rule names apply there.
23. None of `conventions.md`, `README.md`, `question-bank/README.md`,
    `test-guidelines.md` or `ci.yml` says or implies that `question-bank/` has
    no lint. `PROGRESS.md`'s Completed-tasks history is exempt, because it
    records the state at the time.
24. **`engineering-decisions.md` gains entry `E-15`** recording four things:
    - `question-bank/` lints with oxlint while `frontend/` uses eslint.
    - Why: typescript-eslint throws on `typescript` 7, and oxlint does not
      depend on the `typescript` package.
    - What was rejected: side-by-side TS 6/7, downgrading TS, and waiting.
    - What would change it: typescript-eslint supporting TS 7
      (typescript-eslint issue #10940), or `frontend/` moving to oxlint.

    No existing `E-n` entry is modified.

## Out of scope

- **Prettier in `question-bank/`.** Formatting the 22 drifted files, pinning
  prettier and a format gate in CI all belong to T-071. Criterion 8 keeps this
  line clean. So does `oxfmt`, or any other formatter.
- **Type-aware linting** (`--type-aware`, `oxlint-tsgolint`). It would add a
  dependency that was not approved.
- **Moving `frontend/` to oxlint**, or touching its eslint config. The one
  exception is the `lint-gate.test.ts` assertion that criterion 14 names.
- **Choosing a large rule set.** The bar is oxlint's default `correctness`
  rules plus `typescript/no-explicit-any`. Enabling more is allowed, but it is
  not required. If it forces source edits, the diff has to justify them.
- **Refactoring beyond what the rules demand.** Fix the minimum.
- **Linting anything outside `question-bank/src/`** (config files, `data/`,
  fixtures JSON). This is allowed but not required.
- **Other stale text in `ci.yml`**, such as the backend job's test-count
  comment. It is not this task's. File it in `tasks.md` if it matters.

## Constraints

- **Files expected to change:**
  - `question-bank/package.json` and `question-bank/bun.lock`
  - an oxlint config in `question-bank/`, if one is used
  - `.github/workflows/ci.yml`
  - `frontend/src/lint-gate.test.ts`
  - `conventions.md`, and `question-bank/README.md` if criterion 11 or 22
    lands there
  - `engineering-decisions.md`
  - source under `question-bank/src/`, only where the new rules or criterion 10
    require it
  - test files the worker or tester adds

  Anything else needs a reason in the Handoff.
- **Dependency:** `oxlint` only, via `bun add -d` in `question-bank/`. Never
  npm, yarn or pnpm. Committing the lockfile with it is required (`CLAUDE.md`
  "Packages").
- **Stop and ask rather than work around the dependency.** Stop in any of these
  cases:
  - oxlint cannot be installed without a lifecycle script that bun blocks.
  - Its binary does not run on the CI runner (linux x64) or offline.
  - Criteria 4–6 cannot be met with `oxlint` alone.

  Any fix would be a new dependency or package-config decision. Write the
  question into this brief, set `Status: blocked`, `Next step: human`, then
  commit, push and stop.
- **No `--max-warnings` in `ci.yml`.** The warning limit goes in the script
  (criterion 6). `lint-gate.test.ts` criterion 6 enforces this across the repo.
- **No network in tests** (`test-guidelines.md`). Tests that shell out to
  `bun run lint` are fine. Anything that fetches is not.
- **Probe files never stay in the tree**, including when a test fails midway.
  Clean up in `afterEach`, as `frontend/src/lint-gate.test.ts` does.
- Not gated by `run-loop.sh` G1: `.github/workflows/` and
  `engineering-decisions.md` are outside `GATED_PATHS`.

## Context

Required reading for the worker and the tester.

- **Round 1's Handoff, below:** why eslint was abandoned. It includes the exact
  typescript-eslint error.
- **"Human answer — 2026-09-25", below:** the decision this brief implements.
- **`tasks.md` T-066**, the entry. **T-071**, the prettier task this must not
  absorb.
- **`engineering-decisions.md` E-4:** why the warning limit lives in the
  script. **E-14:** the most recent entry, the shape to follow for E-15.
- **`frontend/src/lint-gate.test.ts`:** the probe-file pattern (`runLint()`
  via `bun run lint`, `writeProbe`, `afterEach` cleanup) to reuse for
  criteria 4–8. Lines 142–157 are the ones criteria 13–14 affect.
- **`.github/workflows/ci.yml`:** the `question-bank` job, lines ~92–137. The
  `frontend` job's Lint step (line ~55) is the shape to copy.
- **`conventions.md`** "Commands", and `frontend/src/conventions-doc.test.ts`
  (`bunScriptsIn`), which reads it.
- **`question-bank/src/sinks/db.ts:30,39`** and
  **`question-bank/src/build.ts:83`:** the existing suppression comments that
  criterion 10 covers.
- **`test-guidelines.md`:** "No network in tests, ever".
- **oxlint's CLI:** `oxlint --help` from the installed binary. It documents
  `-W`/`-D`/`-A`, `--deny-warnings` and `--max-warnings`, and the
  `.oxlintrc.json` config.

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

### Round 2 Handoff (oxlint) — worker, 2026-09-28

**TL;DR — built. `bun run lint` in `question-bank/` runs the local oxlint
1.86.0 over `src/`, fails on any warning, and is clean on the committed tree
(`Found 0 warnings and 0 errors.`). CI runs it; docs and E-15 are written.
Two things the brief did not foresee: eight older question-bank tests pinned
the dependency set, and I could not run the `frontend/` suite locally (its
registry is blocked here). Next: tester.**

**Files changed**

- **`question-bank/package.json`**: `lint` script
  `oxlint --deny-warnings --report-unused-disable-directives --format default src`,
  and `oxlint ^1.86.0` in `devDependencies` (via `bun add -d oxlint`). Nothing
  else in it moved.
- **`question-bank/bun.lock`**: oxlint plus its `@oxlint/binding-*` optional
  platform packages. `bun install --frozen-lockfile` reports no changes.
  `bun pm untrusted` reports 0 packages with blocked scripts.
- **`question-bank/.oxlintrc.json`** (new, JSONC): oxlint's defaults plus
  `"typescript/no-explicit-any": "error"`. It turns nothing off and nothing
  down to warning, and says so in a comment.
- **`question-bank/src/sinks/db.ts`, `src/build.ts`**: the three
  `eslint-disable-next-line` comments are **deleted, not annotated**. oxlint
  reports all three as `Unused eslint-disable directive (no problems were
  reported)`, so they suppressed nothing. Criterion 10 now holds with zero
  directives under `src/`.
- **`src/landmarks.test.ts`, `src/state-animals.test.ts`,
  `src/climate-kid.test.ts`**: `(x.match(re)?.[1] as string).toUpperCase()`
  becomes `x.match(re)![1]!.toUpperCase()`. That fixes
  `eslint(no-unsafe-optional-chaining)` (a correctness rule) and keeps the
  same behaviour: a non-matching filename still throws a TypeError.
- **`src/climate-kid-verify.test.ts:452`**: `/\.\.$/.test(statement)` becomes
  `statement.endsWith("..")` (`unicorn(prefer-string-starts-ends-with)`). The
  meaning is identical.
- **Eight older tests pinned the dependency set. The brief did not list
  these.** They are in `climate-kid-verify`, `climate-kid`,
  `landmarks-verify`, `landmarks`, `state-animals`, `region-vocabulary`,
  `highest-point-verify` and `top-crops-verify` (`.test.ts`). Each one asserts
  "exactly `@types/bun` + `typescript`", or a byte/digest match of
  `package.json`/`bun.lock`. Criteria 9 and 16 cannot both hold unless these
  change, so:
  - The six set pins now expect `@types/bun`, `oxlint`, `typescript`, with a
    comment naming T-066/E-15.
  - `top-crops-verify`'s `DEPENDENCY_DIGESTS` is re-pinned to the new bytes.
    The old digests are kept in a comment.
  - `highest-point-verify`'s byte comparison against `origin/main` becomes a
    comparison of dependency blocks: same `dependencies`, same ranges for
    every baseline devDependency, and nothing new except `oxlint`. A byte
    comparison would stay red on this branch until merge. The new check holds
    both before and after the merge.
  - Every one of these still fails on any other new dependency.
- **`.github/workflows/ci.yml`**: the job is now named
  `question-bank (typecheck, lint, test)`. There is a new `Lint` step between
  Typecheck and Test, with `run: bun run lint` and the Typecheck step's `if:`.
  The "No lint step … #11" comment is replaced by one pointing at E-15, E-4
  and T-071.
- **`frontend/src/lint-gate.test.ts`**: the
  `toMatch(/No lint step[\s\S]*?#11/)` line is removed, with a comment saying
  why. The "brief's Handoff" check and the criterion-6 test are untouched.
- **`conventions.md`**: the question-bank Commands block now has
  `bun run lint  # oxlint, not eslint (E-15); fails on any warning`.
- **`question-bank/README.md`**: `bun run lint` is added to "Run it", plus a
  paragraph saying the package lints with **oxlint, not eslint**, and why.
- **`engineering-decisions.md`**: new **E-15** at the end, with the four
  required points. No existing entry was edited.

**Criteria: where each one lives, and what I observed**

| # | Where | Observed (by me, this session) |
|---|---|---|
| 1, 2 | `package.json` `lint` | exit 0, `Found 0 warnings and 0 errors.` |
| 3 | script calls bare `oxlint`, so bun resolves `node_modules/.bin/oxlint` | no bunx/npx |
| 4 | default `correctness` | `debugger;` probe: exit 1, `eslint(no-debugger)` |
| 5 | `.oxlintrc.json` | `any` probe: exit 1, `typescript(no-explicit-any)` |
| 6 | `--deny-warnings` in the script | `bun run lint -W eqeqeq` + `a == 1` probe: exit 1; the same probe without `-W` exits 0 (`eqeqeq` is not configured) |
| 7 | positional `src` | `debugger;` at `src/x.ts`, `src/x.test.ts`, `src/sinks/x.ts`: all exit 1 |
| 8 | oxlint has no formatting rules in the default set | single quotes, no semicolons, 150+ col: exit 0 |
| 9 | — | question-bank: `bun test` 1289 pass / 0 fail, `typecheck` ok. **frontend: see below** |
| 10 | zero directives under `src/` | `grep -rn 'lint-disable' question-bank/src` is empty |
| 11 | `.oxlintrc.json` comment | nothing is turned off or down |
| 12 | — | `git diff --quiet 01a32eb -- question-bank/data question-bank/sample-data` is clean |
| 13, 14 | `ci.yml`, `lint-gate.test.ts` | lint-gate criteria 6 and 7 tests pass |
| 15 | — | all six proxy vars set to `http://127.0.0.1:1`: exit 0 |
| 16, 17 | `package.json` diff | only `oxlint` added; `typescript`/`@types/bun` lines untouched |
| 18 | `bun.lock` | frozen install reports no changes |
| 19 | — | `git diff 01a32eb -- frontend/package.json frontend/bun.lock` is empty |
| 20 | — | no eslint config in `question-bank/` |
| 21–23 | `conventions.md`, `question-bank/README.md`, `ci.yml` | see note on criterion 23 below |
| 24 | `engineering-decisions.md` E-15 | — |

**Why `--format default` is in the script.** oxlint notices when it is running
under an AI agent (`AI_AGENT`/`CLAUDECODE` in this session's environment). In
that case it switches to a terse format that **drops the `Found N warnings
and M errors.` line** that criterion 2 reads. I confirmed this by running with
`env -u AI_AGENT -u CLAUDECODE`. Pinning the format makes the output the same
for a human, CI and an agent. The tester will be in an agent session, so
without this flag criterion 2 would have been unobservable.

**Why `--report-unused-disable-directives`.** Every directive that existed
turned out to be dead. With this flag plus `--deny-warnings`, a stale one
fails the gate, so criterion 10 cannot silently rot. Owner: the reviewer can
drop it if it seems stricter than the brief asked. It is not required by any
criterion.

**What I could not run: the `frontend/` suite, typecheck and lint (criterion
9, frontend half).** `frontend/node_modules` does not exist in this sandbox.
`bun install --frozen-lockfile` fails with
`403` on `europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/internmap/...`
(that is the registry `frontend/bun.lock` records). I did not try another
registry route. What I did run from `frontend/`, since it needs no
dependencies:
`bun test src/conventions-doc.test.ts src/ci-action-pinning.test.ts src/git-baseline-guard.criteria.test.ts`
gave 110 pass / 0 fail, and the lint-gate criterion 6 and 7 tests gave
2 pass. The rest of `lint-gate.test.ts` shells out to eslint and could not
run here. The only frontend file I touched is `lint-gate.test.ts`, and only by
deleting one assertion. Owner: **the tester** verifies criterion 9's frontend
half in an environment that can install, or reads it off PR #62's CI
`frontend` job.

**Criterion 23, not fixed on purpose.**
- `engineering-decisions.md:555` (an older E-entry) still names the job
  `question-bank (typecheck, test)`. Criterion 24 forbids modifying existing
  E-entries, and `engineering-decisions.md` is not in criterion 23's list.
- `tasks.md:137` is T-066's own entry, which describes the problem.
Owner: the reviewer. Accept both as history, or file a follow-up in
`tasks.md`.

**Deliberately not done**
- No prettier and no formatting (T-071).
- No type-aware linting.
- No rules beyond defaults plus `no-explicit-any`.
- No permanent test file for criteria 4–8. I ran them as throwaway probes,
  all removed, and `git status` is clean of probes. Regression tests for the
  gate are the tester's output.

**How to run**
```bash
cd question-bank && bun install --frozen-lockfile
bun run lint                      # Found 0 warnings and 0 errors.
bun run lint -W eqeqeq            # with a probe containing `a == 1`: exits 1
bun run typecheck && bun test     # 1289 pass
```

## Verdict

_Written by `tester`._

## Notes

- **worker, 2026-09-25:** the brief called this risk correctly. The failure is
  an explicit version guard in typescript-eslint, not a soft
  peer-dependency mismatch. Owner: **a human (katechen150621@gmail.com)**
  picks a route from the Handoff table. Then **task-expander** rewrites
  criteria 14/15 to match, and the brief goes back through approval before a
  worker runs again.
- **task-expander, 2026-09-25 (re-expand):** criteria rewritten for oxlint per
  the human answer. The eslint-specific criteria (14's package set, the
  eslint-9 unused-directive probe) are gone. The warning probe is now `-W <rule>`
  (criterion 6). Criterion 2 checks the reported counts, not the absence of the
  word "warning", because oxlint's clean summary contains "warnings". New:
  criteria 3, 11, 20, 22 and 24 (the E-15 entry). The file keeps its `-eslint`
  name so the links from `runs/` and `tasks.md` still resolve. The Handoff
  above is round 1's. The next worker writes its round-2 Handoff beneath it
  and does not rewrite it.
- **worker, 2026-09-28 (round 2):**
  - **oxlint installed cleanly**: no lifecycle scripts, and the linux-x64
    binary runs offline. None of the Constraints' stop conditions fired.
  - **All three existing eslint directives were dead under oxlint**, so I
    deleted them rather than annotating them.
  - **The brief's survey missed eight older tests that pin question-bank's
    dependency set.** I updated them as the minimum that lets criteria 9 and
    16 coexist (details in the Handoff). Owner: **the reviewer** confirms that
    this is not weakening them. The next brief that adds a question-bank
    dependency will hit the same pins, so **task-expander** should list them
    in that brief's survey.
  - **oxlint's agent-detected output format** hides the summary line;
    `--format default` pins it. This surprised me.
  - **The frontend suite could not run here** (registry 403). Owner:
    **tester** / PR CI.

## Human answer — 2026-09-25

katechen150621@gmail.com, in chat, answering the worker's blocked question:

> go with oxlint

That is the worker's option C, using oxlint as the linter for `question-bank/` in
place of eslint and typescript-eslint. `frontend/` is not part of this answer.
The brief's criteria must be rewritten for it and approved again before the
worker runs.
