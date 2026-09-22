# T-073 — The same expired-git-baseline guard, now in `frontend/`

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**From:** [`tasks.md`](../tasks.md) T-073 (§A Foundations)
**Branch:** `claude/task-t073-orchestrator-2ek0bi` — harness-assigned to this
session, already at `origin/main`'s tip `393b6ae`. This line is the authority
(`CLAUDE.md` "Branches"); every later role pushes here.
**PR:** #56, opened draft at expand time from the branch above. Stays draft until
the reviewer approves.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-22 | `cse_01Rpu7pnkLevs6ixvYy6r7zH` |

## Goal

`frontend/src/level-window-claim.criteria.test.ts:166` is red on `origin/main`
today in any full clone, and green in CI only because a shallow checkout makes it
turn itself off. It is the fourth instance of the defect T-072 deleted two of
(`engineering-decisions.md` **E-11**). Remove this one the same way — express the
property without a git baseline that expires, or delete it and write down why —
so `frontend`'s suite means what it says on a developer's machine as well as in
CI.

## Already true — survey, 2026-09-22

Read this before deciding what to build. Criteria that ask for work already
finished waste a cycle.

- **The defect is one test, in one file.** `frontend/src/level-window-claim.criteria.test.ts:166-187`,
  `"no existing E-n entry was modified"`. `cut` at `:178` takes everything above
  the `## E-10 — ` heading and `:184-186` compares it against the **whole**
  `engineering-decisions.md` at the merge base. That held only while T-057 was in
  flight and E-10 was not yet on `main`; E-10 merged, so the base file now
  contains E-10 and E-11 and the comparison can never match.
- **The two silent-`git` escapes are `:171` and `:176`** (`if (base.exitCode !== 0) return;`,
  `if (before.exitCode !== 0) return;`). With `actions/checkout@v5` and no
  `fetch-depth` (`.github/workflows/ci.yml:24`), `origin/main` is absent in CI,
  both branches fire, and the test passes having asserted nothing.
- **`trackedFiles` at `:39-45` is already the correct shape** and is not part of
  this defect: it reads the working tree with `git ls-files`, which works at any
  clone depth, and it **throws** on a non-zero exit instead of returning.
- **The git-free form of the append-only property already exists, twice.** The
  heading-list checks at `:134-150` of the same file (E-10 present, `E-n` numbers
  unique, ascending, nothing after E-10 ≤ 10) pass today, and
  `question-bank/src/region-vocabulary.test.ts:318-351` is the same shape for E-9.
  Criterion 8(a) below, if taken, is mostly reuse rather than new invention.
- **Criterion 5 is already satisfied outside this one file.** No other test in the
  repo compares `engineering-decisions.md` against a git revision.
  `question-bank/src/highest-point-verify.test.ts:584` (`git show origin/main:<path>`)
  reads state JSON, not this file, and belongs to T-070.
- **`engineering-decisions.md`'s highest entry is E-11** (`:529`). `tasks.md:26`
  records that T-072 filed E-11 through the loop with no suite going red, so
  **E-12** is the next number and no ceiling test stands in the way.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

Throughout, **"resolves a git revision"** means passing a commit, ref, range or
merge base to `git` — `git merge-base`, `git show <rev>:<path>`,
`git diff <range>`, `origin/main...HEAD`, or a literal sha. Reading only the
**working tree** (`git ls-files`, `git status`) is not that and stays allowed.

1. **Green in a full clone.** Run in a checkout where `refs/remotes/origin/main`
   resolves and the commit it names is present, `bun test` in `frontend/` exits 0
   and reports **zero failing tests**.
   *Today: exactly one test fails there — `level-window-claim.criteria.test.ts:166`
   (that file alone: 10 pass / 1 fail, reproduced by T-072's reviewer on a clean
   worktree of `origin/main`). If some **other**, unrelated pre-existing failure
   turns up, say so in the Handoff and file it in `tasks.md` — do not absorb it
   into this task, and do not report the suite green while it fails.*

2. **Green in a shallow clone, with the same outcomes.** Run again with
   `refs/remotes/origin/main` absent, `bun test` in `frontend/` exits 0, and the
   set of test names reported and each one's pass/fail result are **identical** to
   criterion 1's run. No test appears, disappears, skips itself, or changes
   outcome because of clone depth.

3. **No test under `frontend/src/` resolves a git revision.** After this task,
   no test file in `frontend/src/` invokes `git merge-base`, `git show <rev>:…`,
   `git diff <range>`, or names a literal commit sha.
   *Today only `:170` and `:173` do.*

4. **No test in `frontend/src/` can pass because `git` failed.** For every `git`
   invocation remaining under `frontend/src/`, a non-zero exit — 1, 128, or the
   binary missing — makes the test **fail**. Exit code 0 is the only code under
   which a test reaches a passing assertion; there is no `return`, `.skip`, or
   swallowed exit-code branch that lets it pass otherwise.
   *`trackedFiles` at `:39-45` already satisfies this and is the shape to copy.*

5. **Nothing in the repo compares `engineering-decisions.md` against a git
   revision.** Repo-wide — `frontend/`, `question-bank/`, `backend/`, `e2e/`. No
   test reads that file's content at a commit, ref, range or merge base, in whole
   or in part.
   *Already true everywhere but `level-window-claim.criteria.test.ts:166-187`.*

6. **This task introduces no new git-revision assertion anywhere.** No test file
   in the repo gains a `merge-base`, `origin/main...HEAD`, `git show <rev>:`, or
   literal-sha reference as a result of this task — **including** any "nothing
   outside `frontend/` moved" or "nothing else changed in this PR" guard.
   *This is the whole point of the task: a fifth instance in a new place is a
   fail, however well motivated. See E-11, "Revisit when".*

7. **No other T-057 assertion is lost.** After this task, `frontend/`'s suite
   still asserts every one of the following, and each still passes:
   - (a) the banned client function name appears in no tracked file under the
     scanned paths, over a file list of more than 100 entries that includes
     `backend/app/levels.py` and `openapi.yaml`;
   - (b) `components/screens.tsx` and `lib/api/types.ts` are the only non-test
     modules under `frontend/src` that read `suggestedLevels`;
   - (c) `screens.tsx` still contains the exact `const options = …` expression
     asserted at `:104-108`;
   - (d) `lib/level.ts` exports exactly `bandLabel`, `bandOf`, `gradeLabel`,
     `gradeOf`, `levelLabel` and nothing that builds a list of levels;
   - (e) an `## E-10 — ` entry exists in `engineering-decisions.md`;
   - (f) every `E-n` number in that file is unique, the numbers ascend, and
     nothing after E-10 is ≤ 10;
   - (g) E-10's body names `suggestedLevels`, `frontend/src/lib/level.ts`, and at
     least one `screens.tsx:NN` call site.

8. **The append-only claim is re-expressed without git, or deleted on the
   record.** Exactly one of:
   - (a) *Re-expressed* — "no existing `E-n` entry was modified" is asserted in a
     form that resolves no git revision and cannot age (the heading list is the
     precedent: `region-vocabulary.test.ts:318-351`); or
   - (b) *Deleted* — the claim is gone, and `engineering-decisions.md` gains one
     new entry **numbered above E-11** and **appended after it**, which names the
     file and test removed, says why deleting beat re-pinning the baseline to
     today's `main`, and carries a `Revisit when` paragraph in E-11's shape.

   **Re-pinning the existing comparison to a newer commit, ref or range satisfies
   neither and is a fail** — that move produced all four instances.

9. **`.github/workflows/ci.yml` is unchanged.** Raising `fetch-depth` to make the
   existing comparison work is out of reach for a `T` task: workflow changes are
   `P-n` tickets done by hand (`process.md`, "Work on the loop itself never enters
   the loop"; `run-loop.sh` G1 refuses the diff). E-11 already rejected this route
   for the same reason.

10. **No new dependency and no network.** `frontend/package.json` and
    `frontend/bun.lock` are unchanged by this task, nothing is added to any other
    manifest or lockfile, and no test added or modified here makes an outbound
    request (`test-guidelines.md:72`, "No network in tests, ever"). The only
    subprocesses any touched test spawns are read-only local `git` commands.

## Out of scope

Anything noticed here that is worth doing becomes a new entry in `tasks.md`, not
an extra commit on this branch.

- **T-070 (a)** — the pinned `BASELINE_DIGESTS` in `landmarks-verify.test.ts`,
  `climate-kid-verify.test.ts` and `top-crops-verify.test.ts`, and their per-task
  neutralisations. A different defect; E-11's "What this does not touch" says so.
- **T-070 (b)** — `rebuildOffline()` returning stdout.
- **T-070's two leftovers, explicitly** — `question-bank/src/highest-point-verify.test.ts:582-584`
  (`if (base === null) return;`) and `question-bank/src/climate-kid.test.ts:538`
  (`expect(status === 0 || status === 1)`). Both are the same *family* as this
  defect and both are named in T-070's entry as T-070's. Leave them.
- **`ci.yml`'s shallow checkout** — criterion 9. A `P-n` ticket if anyone wants it.
- **T-065's stale suite-size figures** (`PROGRESS.md:173`, `test-guidelines.md:209`,
  `tasks.md`'s §A table). If this task changes the frontend test count, leave the
  figures alone; T-065 owns deleting them.
- **T-071's prettier drift.**
- **Re-litigating T-057 or E-10.** The level-window decision stands; this task
  touches how one of its claims is *checked*, not the decision.
- **Adding eslint to `question-bank/`** (T-066, parked on a dependency decision).

## Constraints

- **Files expected to change:** `frontend/src/level-window-claim.criteria.test.ts`
  (or a replacement test file under `frontend/src/`), and — on ending 8(b) —
  `engineering-decisions.md`, by **appending one new entry only**. Plus the
  brief's `## Handoff` / `## Verdict`.
- **No existing `## E-n` entry may be modified**, reordered or renumbered. A new
  entry is appended with the next unused number (**E-12** as of 2026-09-22) and
  no test may be written that caps the highest number (`tasks.md:26`: "Do not
  reintroduce a ceiling"; `engineering-decisions.md`'s preamble: this file is not
  gated).
- **Invariants:** `frontend`'s suite passes at any clone depth with identical
  outcomes; `frontend`'s CI job (typecheck, lint, test) stays green; `bun run
  typecheck` and `bun run lint` pass in `frontend/` — lint fails on warnings
  (E-4).
- **Dependencies:** none without asking (`CLAUDE.md` "Packages").
- **Do not add a "nothing else moved" guard.** Criterion 6. The file scope above
  is enforced by the reviewer reading the diff, not by a test built on a git
  range.
- `openapi.yaml`, the plan, migrations and any text a child reads are untouched.

## Context

**Required reading for the worker and the tester.**

- **The defect:** `frontend/src/level-window-claim.criteria.test.ts` — `:166-187`
  (the failing test), `:170-176` (the two silent-`git` escapes), `:178-186` (the
  above-E-10 vs whole-base-file comparison), `:134-150` (the git-free heading-list
  tests that survive), `:39-45` (`trackedFiles`, the permitted `git ls-files`
  shape that throws loudly).
- **The precedent, read first:** `engineering-decisions.md` **E-11** (`:529`) —
  T-072's decision to delete rather than repair two instances of this same defect,
  including why `fetch-depth` and a self-relative range were both rejected, and
  its "What this does not touch" paragraph scoping T-070 out. PR #55 is the worked
  example.
- **The git-free form of the property:** `question-bank/src/region-vocabulary.test.ts:318-351`
  — uniqueness and ascending order over the `E-n` heading list, with the comments
  explaining why the old "E-9 is the highest" ceiling was removed.
- **Why CI hides it:** `.github/workflows/ci.yml:17-45` — `actions/checkout@v5`
  with no `fetch-depth`, so `origin/main` is absent; `:63-70` for the dead-proxy
  network guard on the test step.
- **The queue entries:** `tasks.md` T-073 (§A, `:165-193`) and T-070 (`:427-482`)
  for the boundary between them.
- **The rules:** `process.md` "Work on the loop itself never enters the loop";
  `test-guidelines.md:72` "No network in tests, ever";
  `engineering-decisions.md:1-20` (preamble — this file is not gated, and when to
  add an entry); `CLAUDE.md` "Tests".
- **How to produce both clone shapes offline** (criteria 1 and 2), since
  `bun install` in a fresh clone would need the network:
  - *Full clone* — this checkout as it stands; `git rev-parse refs/remotes/origin/main`
    resolves (`393b6ae` today).
  - *Shallow* — record that sha, `git update-ref -d refs/remotes/origin/main`, run
    the suite, then restore with `git update-ref refs/remotes/origin/main <sha>`.
    Reversible, local, and needs no second `node_modules`. Restore the ref before
    reporting, and say in the Handoff/Verdict that you did.

## Handoff

Written by `worker` before the tester runs.

## Verdict

Written by `tester`.

## Notes
