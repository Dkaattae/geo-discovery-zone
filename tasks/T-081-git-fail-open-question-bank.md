# T-081 — The last `git` check that passes when `git` fails, and a guard for `question-bank/src/`

**Status:** `awaiting verification`
**Next step:** `tester` — attended: the guard is red on three pre-existing tests by design, and only a human can approve those changes (D-14, D-15)
**Approved:** the user (repo owner), in the orchestrator session — 2026-10-08. See `runs/T-081-git-fail-open-question-bank.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-081, split out of T-070 on 2026-10-06
**Branch:** `claude/relaxed-ramanujan-7q3ey3`
**PR:** #74, opened draft against the branch above at expand time. It stays draft until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-07 | cse_017mbfrRAp5jhR3D1pPAktBG |
| worker | 2026-10-08 | cse_017mbfrRAp5jhR3D1pPAktBG |

> **Plan to attend the tester step.** Criteria 1 and 2 can only be met by
> changing tests that existed before this task. The worker may not do that
> (D-14). It lists them under **Tests made stale**, and the tester raises a Test
> change request that a person approves in the tester's own session (D-15). An
> unattended tester will halt at `test changes requested` / `human`.

## Goal

A test that spawns `git` should fail when `git` fails. `frontend/src/` has had a
guard for that since T-073. `question-bank/src/` has no guard, and it still has
at least two tests that pass when `git` exits with an error. Close both sites and
add the guard, so the defect cannot come back unnoticed a sixth time.

## Acceptance criteria

**Terms used below.**

- **A `git` invocation** is a spawn of `git` from a tracked `*.test.ts` file
  under `question-bank/src/`, in either of two shapes. **Literal:** an argv array
  literal whose first element is `"git"` (e.g. `Bun.spawnSync(["git", "ls-files"])`).
  **Wrapper:** a call with an array literal to a function defined in the same file
  whose body spawns `["git", ...<its parameter>]`. Today every such function is
  named `git` (e.g. `climate-kid.test.ts:216`, `committed-bank.test.ts:26`).
- **Fails open** means the test still passes when that invocation exits with a
  status the test does not explicitly expect. For example, `git` exits 128 when
  it is not inside a repository, and 129 on an unknown option.
- **The guard** is the test (or tests) this task adds that scans those files.
  It may live in `frontend/src/` or `question-bank/src/`, as long as CI's
  existing `bun test` step for that package runs it.
- **Mutation** means that the tester pastes the named snippet into a tracked
  `*.test.ts` file under `question-bank/src/` (or, for criterion 12, under
  `frontend/src/`), runs the guard, records the result in the Verdict, and then
  reverts the change.

**The two known fail-open sites**

1. `climate-kid.test.ts` › "sample-data/us-state-co.json was not touched by this
   task (git status is clean for it)" no longer fails open. On the real tree it
   passes. If its `git` invocation exits 1, or exits 128, the test fails. One
   alternative is allowed: the test is **deleted** under an approved Test change
   request row whose reason is recorded. `sample-data/` is due to go under T-064.
2. `fun-facts.test.ts` › "the 51 bank paths are still tracked and still not
   ignored" no longer fails open. On the real tree it passes. For each path,
   `git check-ignore --no-index -q` exit 1 (not ignored) passes, exit 0
   (ignored) fails, and any other exit (e.g. 128) fails. Today a 128 reads as
   `ignored: false` and passes. Unlike criterion 1, this test may not be deleted.
3. After the task, no `git` invocation under `question-bank/src/` fails open.
   The Verdict lists every invocation the tester found, with file:line and how a
   non-zero exit fails the test (throw, or an exact-value `expect`). No row is
   left as "passes".

**The guard: what it rejects** (each is shown by mutation and must turn the
guard red, naming the offending file)

4. A `git` invocation whose subcommand reads history. This applies to both
   shapes. At minimum, `show`, `log`, `rev-parse`, `rev-list`, `merge-base`,
   `cat-file`, `blame`, `describe` and `for-each-ref` are rejected. Mutations:
   `Bun.spawnSync(["git", "rev-parse", "HEAD"])` and `git(["log", "-1"])` (in a
   file that defines a `git` wrapper).
5. A `git` invocation, of either shape, that is handed a revision. Mutations:
   `git(["diff", "--name-only", "origin/main...HEAD"])`,
   `Bun.spawnSync(["git", "ls-files", "--with-tree=HEAD~1"])` and an argument
   containing a 7- to 40-character lowercase hex sha. The guard decides whether
   `diff` with **no** revision is an allowed subcommand. With a revision, it is
   always rejected.
6. An exit-code check written as a disjunction that accepts a non-zero value.
   Mutation: restoring `expect(status === 0 || status === 1).toBe(true)`
   (today's `climate-kid.test.ts:598`).
7. A literal invocation whose non-zero exit leads to a bare `return`. Mutation:
   `if (proc.exitCode !== 0) return;` straight after a literal
   `Bun.spawnSync(["git", "ls-files"])`.
8. A wrapper's exit status turned into a value that is never thrown on or
   asserted exactly. Mutation: restoring today's `fun-facts.test.ts:388` shape,
   `ignored: git(["check-ignore", "--no-index", "-q", path]).status === 0`,
   inside an `expect({...}).toEqual({...})`.

**The guard: what it accepts and what it covers**

9. The guard passes on the final tree. Every fail-closed shape below is still
   present and is not flagged, unless an approved Test change request changed
   that line:
   - a wrapper that throws on a non-zero exit itself (`top-crops-verify.test.ts:132-136`);
   - `const { status, stdout } = git([...])` followed by `if (status !== 0) throw`
     (the `trackedUnder` helpers);
   - `expect(git([...]).status).toBe(0)` or `.toBe(1)` (`committed-bank.test.ts:238`, `:243`);
   - `expect(proc.exitCode).toBe(0)` after a literal invocation
     (`highest-point-in-state-verify.test.ts:487-488`).
10. A `git` command written only in a comment is not an invocation. For
    example, ``git show 323254c:<path>`` in a doc comment
    (`highest-point-in-state-verify.test.ts:17`, `top-crops-verify.test.ts:23`)
    does not turn the guard red.
11. The guard cannot pass vacuously. It fails if its scan finds no `git`
    invocation under `question-bank/src/`. It also fails if it finds none in
    `fun-facts.test.ts` or `committed-bank.test.ts`, both of which reach `git`
    only through a wrapper. **Exception:** a file deleted under an approved Test
    change request is dropped from that list.
12. `frontend/src/` stays covered. Pasting `Bun.spawnSync(["git", "show", "HEAD:x"])`
    into a test under `frontend/src/` still turns a guard red. Every test
    `frontend/src/git-baseline-guard.criteria.test.ts` held before this task
    still exists and passes, unless an approved Test change request row changed it.

**What must not change**

13. The worker's commits modify or delete no `*.test.ts` file that existed
    before the task. Every modification or deletion of such a file on the branch
    matches an approved row in this brief's Test change request.
14. Nothing outside test files changes, apart from this brief, `tasks.md`,
    `PROGRESS.md` and `runs/`. In particular, no non-test `.ts` under `question-bank/src/`
    or `frontend/src/` changes, and nothing under `question-bank/data/`,
    `question-bank/sample-data/`, `question-bank/src/fixtures/`, `.github/` or
    `backend/` changes.
15. No new dependency. Both `package.json` files and both `bun.lock` files are
    unchanged.
16. The guard itself spawns `git` only with a subcommand it allows, and it
    throws when that spawn exits non-zero. Placed in `question-bank/src/`, it
    passes its own scan.
17. No test reaches the network.
18. In both `frontend/` and `question-bank/`, the full `bun test` suite,
    `bun run typecheck`, `bun run lint` and `bun run format:check` pass on the
    final tree.

## Out of scope

- **T-070 (a), the pinned-digest guards and Q1.** That decision is untouched, and
  so is every neutralisation in those four suites.
- **T-082 and T-083**: the guards against spawning `build.ts`, the `--fixture`
  argument, and `--quiet`.
- **Deleting `sample-data/` (T-064).** Criterion 1 may delete one test that reads
  it. Nothing else about `sample-data/` changes.
- **Merging the duplicated `git()` helpers into one shared module.** This is not
  required. If someone does it anyway, each existing file it touches is a Test
  change request row.
- **`committed-bank.test.ts:430`**, which reads `.stdout` with no status check.
  It fails closed today, because empty output makes `tracked: false` fail. If the
  guard flags it, a change to it is a Test change request row. Nothing requires
  the guard to flag it.
- **Backend Python tests** (`test_*.py`), and non-test helper modules such as
  `offline-rebuild.ts`. They are not scanned.
- **The frontend guard's 400-character heuristic and its known false-positive
  mode** (`git-baseline-guard.criteria.test.ts:207-212`). It is not reworked for
  `frontend/src/`.

## Constraints

- **Files expected to change:** at least one new test file for the guard.
  `climate-kid.test.ts` and `fun-facts.test.ts` change only through approved
  Test change request rows. If the guard is written by widening
  `frontend/src/git-baseline-guard.criteria.test.ts`, that file is pre-existing
  too, so it is a row as well. A **new** guard file avoids that row.
- **Who edits what:** the worker writes the guard and leaves it red on the two
  sites in criteria 1 and 2. It says so in its Handoff and lists both under
  **Tests made stale**. The tester raises the Test change request and applies
  only the approved rows (D-14, D-15).
- **The guard is subject to its own rules,** and so is any guard under
  `frontend/src/` that reads every tracked test file. Mutation snippets and
  revision strings written inside the guard must not look like invocations to
  either guard. `git-baseline-guard.criteria.test.ts:27-32` shows the trick: it
  builds `DECISIONS` from two halves.
- **Exit codes worth knowing:** `git diff --name-only` exits 0 whether or not
  anything differs. It exits 1 only with `--exit-code`, so the 1 that
  `climate-kid.test.ts:598` accepts is never a success there.
  `git check-ignore -q` exits 0 when the path is ignored, 1 when it is not, and
  128 on a fatal error.
- **Dependencies:** none. See [`CLAUDE.md`](../CLAUDE.md), "Packages".
- **Gates:** typecheck, lint (warnings fail) and `format:check` in both packages
  (`conventions.md`).

## Context

Required reading for the worker and the tester.

- **The precedent guard:** `frontend/src/git-baseline-guard.criteria.test.ts`,
  the whole file. Read `codeOf()` at `:74-122`, `gitCalls()` at `:134-150`, which
  sees only literal argv and treats a `...spread` as unreadable, and
  `looksLikeRevision` at `:154-159`.
- **The wrapper shape the precedent cannot see:** the `git(args)` helpers in
  `climate-kid.test.ts:216`, `committed-bank.test.ts:26`, `fun-facts.test.ts:43`,
  `landmarks.test.ts:143`, `state-animals.test.ts:140` and `top-crops.test.ts:30`,
  which return the status. Compare `top-crops-verify.test.ts:132` and
  `top-livestock-verify.test.ts:47`, which throw.
- **Fail-open site 1:** `question-bank/src/climate-kid.test.ts:594-600`.
- **Fail-open site 2:** `question-bank/src/fun-facts.test.ts:382-391`.
- **Literal invocations:** `climate-koppen.criteria.test.ts:67`,
  `highest-point-verify.test.ts:57` and `highest-point-in-state-verify.test.ts:487`.
- **Decisions:** `engineering-decisions.md` **E-11** and **E-12** cover the
  git-baseline family this closes. `process-decisions.md` **D-14** and **D-15**
  cover the test change rules.
- **Test rules:** [`test-guidelines.md`](../test-guidelines.md), "Writing tests
  from acceptance criteria".
- **The origin:** `tasks.md` T-081, and T-070's history (amendments by T-072's
  and T-073's reviewers).

## Handoff

**TL;DR.** One new file, `question-bank/src/git-exit-guard.criteria.test.ts`, guards `question-bank/src/`.
It is **red by design** in one test, "every invocation fails when git exits with a status it does not expect". That test names three
pre-existing call sites: the two from criteria 1 and 2, plus `committed-bank.test.ts:430`. All three are listed under
**Tests made stale**, each with a one-line fix that I checked turns the guard green. Next: an **attended** tester raises the Test change request.

**Note: the worker and the expander share session id `cse_017mbfrRAp5jhR3D1pPAktBG`.** It is the value
`$CLAUDE_CODE_REMOTE_SESSION_ID` returned here. The orchestrator spawned this run, so the id is probably the
parent session's and not this subagent's. The tester should run in a session whose id differs from this one.

### What changed, file by file

- **`question-bank/src/git-exit-guard.criteria.test.ts`**: new. This is the whole guard, plus self-tests that run the brief's mutations on synthetic sources.
- **This brief**: the Sessions row, Status, Handoff and Notes.
- **Nothing else.** No pre-existing test, no non-test `.ts`, no `package.json`, no `bun.lock`. `frontend/` is untouched.

### How the guard works

1. **Lex.** A small lexer tags every character as code, text (string, template text or regex) or comment. A template's `${…}` counts as code.
   - Comment mentions like `highest-point-in-state-verify.test.ts:17` are not invocations.
   - Neither is the string `'git(["ls-files"'` at `climate-kid.test.ts:778`.
2. **Find invocations.**
   - **Literal:** an array literal in code whose first element is the string `git`.
   - **Wrapper definition:** a literal that is exactly `[git, ...P]` inside a `function NAME(P` or `const NAME = (P`. It is not counted as an invocation.
   - **Wrapper call:** every call `NAME(` to a defined wrapper, apart from the definition itself.
3. **Apply three rules to each invocation.**
   - **Subcommand** (criterion 4): it must be one of `ls-files`, `status`, `check-ignore` or `diff`, written as a string literal.
   - **Revision** (criterion 5): no argument may look like a revision. That covers `HEAD`, `origin/`, `upstream/`, `refs/`, `a..b`, `a...b`, `@{`, `~n`, `^`, a 7–40 character hex sha, `--with-tree`, `--merge-base`, `--since` and `--until`. `diff` also takes no positional argument before `--`.
   - **Exit** (criteria 3 and 6–8): the call must be fail-closed in one of these shapes:
     - through a wrapper that throws itself;
     - `expect(<call>.status|.exitCode).toBe|toEqual|toStrictEqual(<integer>)`;
     - `const {status}` or `const proc = <call>`, where the **first** later use of the status is `if (S !== 0) throw` or `expect(S).toBe(<integer>)`.

   Anything else is flagged, reported as `file:line: reason — snippet`.

### Where each criterion lives

| # | Where |
|---|---|
| 1, 2 | Not done by me. The guard flags both (`climate-kid.test.ts:595`, `fun-facts.test.ts:388`). See Tests made stale. |
| 3 | The exit rule. The full inventory, as the guard classifies it, is below. |
| 4 | `subcommandProblem`, the allowlist. Self-tests run each of the nine named subcommands plus both brief mutations. |
| 5 | `revisionProblem`. Self-tests cover the range, `--with-tree=HEAD~1`, a 7-character and a 40-character sha, and `diff main --`. |
| 6, 7, 8 | `exitProblem`. Self-tests use the brief's exact snippets. |
| 9, 10 | The self-tests in "criteria 9–10" cover every listed shape, plus comment, string and regex mentions. |
| 11 | The describe block "criterion 11": more than 20 files, at least one invocation, and wrapper-only invocations found in `fun-facts.test.ts` and `committed-bank.test.ts`. |
| 12 | Unchanged. `frontend/src/git-baseline-guard.criteria.test.ts` is untouched and passes, 15/15. |
| 13–15 | Nothing pre-existing was modified. Check with `git diff --stat origin/main...`. |
| 16 | Its one spawn is `git ls-files -z -- question-bank/src`, which throws on a non-zero exit. The describe block "criterion 16" asserts that exactly one invocation is found in the guard and that it is clean. |
| 17 | No network. The only spawn is that `git ls-files`. |
| 18 | See "Gates run" below. The frontend full suite could **not** be run. |

**Inventory (criterion 3)**, as the guard reads the tree today. "ok" means a non-zero exit fails the test in the way given.

| file:line | shape | how a non-zero exit fails |
|---|---|---|
| climate-kid.test.ts:223 | wrapper | `if (status !== 0) throw` |
| climate-kid.test.ts:595 | wrapper | **fails open**: disjunction (criterion 1) |
| climate-koppen.criteria.test.ts:67 | literal | `if (proc.exitCode !== 0) throw` |
| committed-bank.test.ts:37 | wrapper | throw |
| committed-bank.test.ts:238, :243, :391, :397, :403 | wrapper | `expect(….status).toBe(n)` |
| committed-bank.test.ts:349 | wrapper | `expect(status).toBe(0)` |
| committed-bank.test.ts:430 | wrapper | **flagged**: `.stdout` read, status never checked (fails closed by accident, see below) |
| fun-facts.test.ts:50 | wrapper | throw |
| fun-facts.test.ts:375, :378 | wrapper | `expect(….status).toBe(0)` |
| fun-facts.test.ts:388 | wrapper | **fails open**: `=== 0` boolean (criterion 2) |
| git-exit-guard.criteria.test.ts:53 | literal | throw |
| highest-point-in-state-verify.test.ts:487 | literal | `expect(proc.exitCode).toBe(0)` |
| highest-point-verify.test.ts:57 | literal | throw |
| landmarks.test.ts:150, state-animals.test.ts:147, top-crops.test.ts:37 | wrapper | throw |
| top-crops-verify.test.ts:140, :151; top-livestock-verify.test.ts:54 | throwing wrapper | the wrapper throws |

### Tests made stale

The guard test that is red is the new test `git-exit-guard.criteria.test.ts` › "T-081 criteria 3–8 — every git invocation under question-bank/src is fail-closed" › "every invocation fails when git exits with a status it does not expect".
It is red because of these three pre-existing tests. The tests themselves still pass.

1. **`climate-kid.test.ts` › "T-014 criterion 13…" describe › "sample-data/us-state-co.json was not touched by this task (git status is clean for it)"**
   - **Why:** criterion 1. Line 598 is a disjunction that accepts exit 1.
   - **Proposed: modify.** Replace `expect(status === 0 || status === 1).toBe(true);` with `expect(status).toBe(0);`.
   - Deleting it is also allowed under criterion 1, because T-064 removes `sample-data/`. That is the human's call at the Test change request.
2. **`fun-facts.test.ts` › "T-011 criterion 10 — nothing unreviewed, live or new is committed" › "the 51 bank paths are still tracked and still not ignored"**
   - **Why:** criterion 2. Line 388 turns the status into `=== 0`, so a 128 passes.
   - **Proposed: modify.** Replace the `expect({ path, ignored: … }).toEqual({ path, ignored: false })` block with `expect(git(["check-ignore", "--no-index", "-q", path]).status).toBe(1);`. This is the shape `committed-bank.test.ts:238` already uses.
   - This test may not be deleted (criterion 2).
3. **`committed-bank.test.ts` › "T-010 round 2 — criteria 11 and 15…" › `${doc} — every test it credits with a criterion exists and contains that claim`** (four generated tests, one per doc)
   - **Why:** line 430 reads `git([...]).stdout` with no status check.
   - **Proposed: modify.** Destructure `const { status, stdout } = git([...]);` and add `expect(status).toBe(0);`, then split `stdout` as before.
   - **Out of scope says** nothing requires the guard to flag this, and that a change here is a Test change request row. I flagged it on purpose (see Notes).
   - If the human rejects the row, the guard needs a narrow exemption instead. That makes it a guard change, not a test change.

I applied all three fixes in a scratch working tree. The guard plus those three files went 320 pass / 0 fail. I then reverted them, so none are committed.

**Count floors:** none affected.

### How to run

- `cd question-bank && bun test src/git-exit-guard.criteria.test.ts`: 36 pass, 1 fail (the stale red above).
- Mutations: append the snippet inside a `test(...)` in a tracked file, run the guard, then `git checkout -- <file>`.
- I ran every brief mutation against a real file (criterion 4: `Bun.spawnSync([git, "rev-parse", "HEAD"])` and `git(["log", "-1"])`; criterion 5: the range, `--with-tree=HEAD~1` and a sha; criteria 6, 7 and 8). Each one was flagged with its file and line.
- I did not run criterion 12's mutation. The frontend guard is unchanged, and its criterion-3 test already rejects `show` and `HEAD:`.

### Gates run

- **question-bank**:
  - `bun test`: 1707 pass, 1 fail (the stale red only).
  - `typecheck`, `lint` and `format:check`: clean.
- **frontend**:
  - `bun install --frozen-lockfile` failed with **403 from the egress proxy** on `react-simple-maps-3.0.0.tgz`. That is a policy denial, so I did not retry it.
  - I ran `bun test src/git-baseline-guard.criteria.test.ts` on its own, since it needs no packages: 15 pass, 0 fail.
  - **The full frontend suite, typecheck, lint and format:check were not run.** Nothing under `frontend/` changed. The tester should run them in an environment that can install.

### Deliberately not done

- **No edit to any pre-existing test** (D-14), including the three above.
- **No shared `git()` module** (out of scope).
- **No change to the frontend guard.**

## Verdict

## Test change request

## Notes

- **Survey: nothing here is already satisfied.**
  - **No guard for `question-bank/src/`.** No test scans `question-bank/src/`
    for git exit handling. The frontend guard's criterion-5 scan reads every
    tracked test file in the repo, but only for `engineering-decisions.md`
    arguments.
  - **Site 1 is unchanged.** `climate-kid.test.ts:598` still holds the
    disjunction the queue entry names.
- **A second fail-open site the queue entry does not name:**
  `fun-facts.test.ts:388` (criterion 2). `trackedUnder` runs first and throws if
  `git ls-files` fails, so the two only diverge when `check-ignore` fails on its
  own. That is still a passing path taken because `git` failed, which is exactly
  what the entry's "Done when" rules out.
- **Why criteria 4 to 8 are written as mutations.** The frontend scan cannot
  see the wrapper shape. Five of the files above reach `git` only through
  `git([...])`, so widening that scan's directory alone would find almost
  nothing in `question-bank/src/`. It would also flag every wrapper's
  `["git", ...args]` as having no readable subcommand and no `exitCode !== 0`
  nearby. How the guard handles wrappers is the worker's choice. The mutations
  pin down what it must catch.
- **Worker: the guard is an allowlist of fail-closed shapes, not a denylist of
  the brief's mutations.** A denylist would miss the next variant, such as
  `if (r.status === 0) {…}`. The cost is that it also flags
  `committed-bank.test.ts:430`, which only fails closed because empty output
  happens to make `tracked: false` fail. I took that cost: a `.stdout` read with
  no status check is exactly the shape that recurs. **Owner:** the human at the
  tester's Test change request approves row 3, or rejects it. If they reject it,
  the tester sends the task back to the worker to add an exemption.
- **Worker: `diff` is allowed only with no revision.** That means no argument
  before `--`, because a bare branch name such as `main` is a revision that no
  pattern can see. `diff` compares the working tree to the index. Allowing it
  lets criterion 1 be fixed in one line, without rewriting the test to use
  `status --porcelain`. **Owner:** the reviewer confirms it or overturns it. If
  overturned, remove `diff` from `ALLOWED_SUBCOMMANDS`, and site 1 then needs
  `status --porcelain` or deletion.
- **Worker: the lexer handles regex literals and template expressions.** The
  frontend `codeOf()` does neither. Without regex handling, the quote inside
  `/["'`]/` in `committed-bank.test.ts`, and in the guard itself, would throw
  off string tracking. Regex-versus-division is decided by the previous
  significant character, a standard heuristic. **Known limit:** it is
  heuristic, not a parser. A file that defeats it errs towards finding nothing,
  and criterion 11's per-file floors are there to catch that for the two
  wrapper-only files.
- **Worker: the session id is shared with the expander.** See the Handoff.
  **Owner:** the orchestrator or a human, who should confirm that the tester
  runs in a distinct session.
