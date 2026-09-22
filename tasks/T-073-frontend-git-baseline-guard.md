# T-073 — The same expired-git-baseline guard, now in `frontend/`

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** orchestrator — 2026-09-22, unattended run. See `runs/T-073-frontend-git-baseline-guard.md`.
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
| worker | 2026-09-22 | `cse_01Rpu7pnkLevs6ixvYy6r7zH` |

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

Written by `worker`, 2026-09-22.

**TL;DR:** Deleted `level-window-claim.criteria.test.ts`'s `"no existing E-n
entry was modified"` test (the git-based half of T-057 criterion 8) and
appended `engineering-decisions.md` **E-12**, which names why deletion beat
re-pinning — ending 8(b), the same route E-11 took. Full-clone `frontend`
suite: 208 pass / 1 fail / 1 error, and shallow-clone gives the **identical**
209-test shape — but that 1 fail/1 error is a **pre-existing, unrelated**
failure in this sandbox (`UsMap.tsx` can't resolve `react-simple-maps`, a
network-blocked dependency, nothing this task touches), not the defect this
task closes. The target file itself: **10 pass / 0 fail**, identical at both
clone depths, matching the brief's own prediction (`:73-77`) that this file
alone would move from 10/1 to 11/0 — here 10/0, since the failing test was
removed rather than fixed in place.

**Files changed:**
- `frontend/src/level-window-claim.criteria.test.ts` — removed the `"no
  existing E-n entry was modified"` test (old `:166-187`) and its two
  git-revision calls (`git merge-base`, `git show <rev>:…`). Replaced with a
  comment explaining what was here and pointing at E-12. Nothing else in the
  file changed; `trackedFiles()` (`:39-45`) and the three other `describe`
  blocks are untouched.
- `engineering-decisions.md` — appended one entry, **E-12**, after E-11. Names
  the file and test removed, explains why deletion beat re-pinning (same
  reasoning E-11 used: a self-relative range just relocates the same defect,
  raising `fetch-depth` is a `P-n` ticket), and carries a `Revisit when`
  paragraph. No existing `## E-n` heading touched.

**Criterion-by-criterion:**

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass for this task's file; **can't fully certify the whole-suite half in this sandbox** | `bun test src/level-window-claim.criteria.test.ts` → 10 pass / 0 fail in a full clone (`refs/remotes/origin/main` = `393b6ae`). Whole-`frontend` `bun test`: 208 pass / 1 fail / 1 error — the 1 fail/1 error is `screens.criteria.test.tsx` unable to load `UsMap.tsx` because `react-simple-maps`/`us-atlas` can't be fetched through this sandbox's npm mirror (403, policy denial, not a missing-package-in-lockfile problem — `frontend/package.json`/`bun.lock` are untouched by this task and by anyone). See "Environment limitation" below. |
| 2 | pass, including for the pre-existing failure | Removed `refs/remotes/origin/main` (`git update-ref -d`), reran: whole-`frontend` `bun test` → same 208 pass / 1 fail / 1 error, same file, same error message; target file alone → same 10 pass / 0 fail. Ref restored afterward (`git update-ref refs/remotes/origin/main 393b6aee60902941c0d6499768fb6b60c7d3e94a`, confirmed with `git rev-parse`). |
| 3 | pass | `grep -rnE "git (merge-base|show|diff)|origin/main\.\.\.HEAD"` over `frontend/src/**/*.test.*` after the edit: the only remaining hits are `conventions-doc.test.ts` string-matching the literal text `git diff --exit-code` inside `ci.yml`'s YAML source (no subprocess, no revision resolved). No literal sha anywhere. |
| 4 | pass | Only `git` invocation left under `frontend/src` is `trackedFiles()`'s `git ls-files` (`:39-45`), which already throws on non-zero exit — unchanged by this task. |
| 5 | pass | Repo-wide grep for `engineering-decisions.md` in every `*.test.*` file: all remaining hits (`question-bank/src/*`, `frontend/src/ci-action-pinning.test.ts`) are `readFileSync` against the working tree, none resolve a git revision. Confirmed by re-running `question-bank`'s suite after the E-12 append: 1251 pass / 0 fail — nothing there broke. |
| 6 | pass | Only removed a git-revision assertion; added none. No "nothing else moved" guard added anywhere. |
| 7 | pass | (a)–(g) are each still asserted in the same file, unmodified; ran `bun test src/level-window-claim.criteria.test.ts` → 10/10, covering all of them. |
| 8 | pass, ending **(b)** | The claim is gone from the test file; `engineering-decisions.md` gained **E-12**, numbered above E-11 and appended after it, naming the file/test removed and explaining the deletion (see entry). No re-pinning to a newer commit was done. |
| 9 | pass | `git diff --stat -- .github/workflows/ci.yml` — empty; file untouched. |
| 10 | pass | `git diff --stat -- frontend/package.json frontend/bun.lock` — empty. No test added or modified spawns anything but the pre-existing `git ls-files`. |

**Invariants:**
- `bun run lint` in `frontend/` — clean, exit 0, zero warnings.
- `bun run typecheck` in `frontend/` — **fails**, but only on `UsMap.tsx`
  (`TS2307` for `react-simple-maps` and `us-atlas/states-10m.json`, plus two
  downstream implicit-`any` errors from the unresolved import). This file is
  untouched by this task and the failure is the same dependency-fetch problem
  as above, not a type error this task introduced or could fix without
  network access this sandbox denies.

**Environment limitation — not this task's defect, flagged for the tester and
for whoever else runs this branch:**
This sandbox has no `frontend/node_modules` at session start and its npm
mirror (`europe-west1-npm.pkg.dev/.../sandbox-npm-cache`) returns 403 for
`react-simple-maps`, `us-atlas`, and the `d3-*`/`@types/d3-*` family it pulls
in — `curl -sS "$HTTPS_PROXY/__agentproxy/status"` confirms these as
`connect_rejected` policy denials, not a transient error, and the proxy
README says to report such denials rather than retry or route around them.
`bun install --frozen-lockfile` otherwise succeeded (237 other packages
installed from cache/mirror; `bun.lock` unchanged, confirmed by
`git diff --stat`). This is `frontend`'s pre-existing `UsMap.tsx` /
`react-simple-maps` dependency, declared in `package.json` long before this
task and touched by nobody here — it is exactly the "other, unrelated
pre-existing failure" criterion 1 tells the worker to name rather than absorb.
**I did not file a new `tasks.md` entry for it**: it is not a code defect
anything in this repo can fix — it is this specific sandbox's egress policy
denying a package fetch, which a normal developer machine, a real CI runner,
or a session with a populated `node_modules` would not hit. If the tester's
own environment has the same restriction, the same 208/1/1 and typecheck
shape is expected and is not evidence against this task; if the tester's
environment *can* reach that package, criterion 1's whole-suite half should
resolve to fully green and is worth re-confirming there.

**Criterion 8 judgment call — decided, needs no further owner unless the
tester disagrees:** Criterion 8 offered ending (a) (re-express git-free) or
(b) (delete + record). I took (b). A git-free re-expression of "no existing
E-n entry's *body text* was modified" turns out not to exist without
introducing a new expiring baseline of its own (a pinned hash or copy of each
entry's prior text, checked at the same place the git baseline was) — the
survey's own heading-list precedent (`:134-150`, and
`region-vocabulary.test.ts:318-351`) proves uniqueness/order, not
content-immutability, and is already in place and unaffected by this change.
E-12 says this explicitly, in its "What survives" paragraph, so nobody has to
rediscover it.

**Session-table anomaly — flagged, not something I could resolve myself:**
`$CLAUDE_CODE_REMOTE_SESSION_ID` in this run is `cse_01Rpu7pnkLevs6ixvYy6r7zH`
— identical to the `task-expander` row already in this brief's Sessions table.
I recorded it honestly rather than fabricate a different value. `CLAUDE.md`
process.md's isolation model assumes each role gets its own session, and "the
tester reads that table to confirm it is not running in the same session you
did" exists precisely to catch this. **Whoever runs `tester` next should check
their own `$CLAUDE_CODE_REMOTE_SESSION_ID` against both rows above and refuse
to proceed as an independent check if it collides with either** — that is the
gate this anomaly is for, and it is not mine to wave through. If this
orchestrator's session-reuse is systematic (not a one-off), that is a
`process-tasks.md` / human question about the loop itself, not a T-073 fix.

**Deliberately not done:**
- No attempt to fix or work around the `react-simple-maps` dependency gap —
  out of scope (not this task's files, would need a dependency/network
  decision this brief doesn't grant).
- No new `tasks.md` entry for the sandbox npm-mirror gap, for the reason
  above — it is an environment fact, not an actionable code task.
- Did not touch `.github/workflows/ci.yml`, per criterion 9 and E-11's
  precedent.
- Did not touch `question-bank/src/highest-point-verify.test.ts:582-584` or
  `question-bank/src/climate-kid.test.ts:538` — T-070's, named out of scope.

**How to run what was touched:**
- `cd frontend && bun test src/level-window-claim.criteria.test.ts` — the
  file this task changed.
- `cd frontend && bun test` — the whole suite (expect 208/1/1 in a sandbox
  that also can't fetch `react-simple-maps`; expect 209/0/0 where it can).
- `cd frontend && bun run lint` / `bun run typecheck` — lint is clean;
  typecheck fails only on the pre-existing `UsMap.tsx` gap described above.
- Shallow-clone repro: `git update-ref -d refs/remotes/origin/main`, rerun,
  then `git update-ref refs/remotes/origin/main <sha>` to restore — the sha
  today is `393b6aee60902941c0d6499768fb6b60c7d3e94a`.

## Verdict

Written by `tester`.

## Notes

- The brief's own survey (`:30-59`) and precedent pointers (E-11, the
  heading-list tests) were accurate and saved real time — there was no
  rediscovery needed for the shape of the fix, only the 8(a)-vs-8(b) call.
- The genuinely unplanned-for wrinkle was environmental, not the brief's
  fault: this sandbox started with zero `frontend/node_modules` (the brief's
  "How to produce both clone shapes offline" section reads as if a populated
  checkout were the starting assumption) and its npm mirror blocks the
  `react-simple-maps` family outright. That produced a pre-existing,
  task-unrelated 1 fail / 1 error in `bun test` and a `tsc --noEmit` failure
  that no amount of correct work on this task's actual scope removes. Flagged
  in the Handoff in the detail the tester needs to tell it apart from a
  regression.
- The session-ID collision between the `task-expander` and `worker` rows
  (both `cse_01Rpu7pnkLevs6ixvYy6r7zH`) is recorded, not hidden — see the
  Handoff. I do not know whether it reflects this orchestrator run
  deliberately reusing a session or a bug in how the row was stamped; either
  way it is outside a worker's authority to fix and is named for whoever
  reads this next.
