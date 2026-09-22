# T-073 — The same expired-git-baseline guard, now in `frontend/`

**Status:** `approved`
**Next step:** `human` — PR #56 marked ready for review. Dkaattae merges (D-4).
See `## Review — round 2`.
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
| tester | 2026-09-22 | `cse_01Rpu7pnkLevs6ixvYy6r7zH` — same id: orchestrated run, see Verdict |
| reviewer | 2026-09-22 | `cse_01Rpu7pnkLevs6ixvYy6r7zH` — same id: orchestrated run (D-3) |
| tester (round 2) | 2026-09-22 | `cse_01Rpu7pnkLevs6ixvYy6r7zH` — same id: orchestrated run, see Verdict — round 2 |
| reviewer (round 2) | 2026-09-22 | `cse_01Rpu7pnkLevs6ixvYy6r7zH` — same id: orchestrated run (D-3) |

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

Written by `tester`, 2026-09-22. **Status: pass.**

**TL;DR:** All ten criteria hold. The defect is gone: on `origin/main` (`393b6ae`)
this environment reproduces **2 fail** in `frontend`'s suite — the expired
git-baseline test *and* an unrelated missing-package failure — and on this branch
only the second remains, at both clone depths, with identical test names and
outcomes. Fifteen new tests in `frontend/src/git-baseline-guard.criteria.test.ts`
cover criteria 3, 4, 5 and 8, each proven to go red under a deliberate mutation;
criterion 7's seven claims are proven live by seven more mutations against the
existing tests. **Criterion 1's "exits 0" half cannot be fully certified here** —
`frontend/node_modules` is missing `react-simple-maps`, which this sandbox's npm
mirror refuses — and that shortfall is demonstrated, not assumed, to pre-date the
branch.

| # | Verdict | Evidence |
|---|---|---|
| 1 | **pass, modulo one environment-only failure** | Full clone (`refs/remotes/origin/main` = `393b6ae`): `bun test` in `frontend/` → **223 pass / 1 fail / 1 error**. The predicted failure (`level-window-claim.criteria.test.ts:166`) is gone. The remaining one is `src/components/screens.criteria.test.tsx` failing to load `UsMap.tsx` (`Cannot find package 'react-simple-maps'`). Proven pre-existing and unrelated: a worktree at `393b6ae` sharing the same `node_modules` gives **208 pass / 2 fail / 1 error** — the same `react-simple-maps` error *plus* `no existing E-n entry was modified`. So the branch removes exactly one failure and adds none. |
| 2 | pass | `git update-ref -d refs/remotes/origin/main`, rerun: **223 pass / 1 fail / 1 error**, and the junit test-name/outcome sets from the two runs are **byte-identical** (223 cases, `identical: True`). Nothing appears, disappears, skips or changes outcome with clone depth. **The ref was restored** to `393b6aee60902941c0d6499768fb6b60c7d3e94a` and re-verified with `git rev-parse`. |
| 3 | pass | New tests: every `git` argument list under `frontend/src` uses a working-tree-only subcommand (`ls-files`/`status`/`check-ignore`), is handed no `HEAD`, `origin/…`, range or sha, and no literal sha reaches `git`. Only one such call exists today — `trackedFiles`' `git ls-files` (`:39-45`). The comment left at `:166-176` names the deleted revision comparison in prose; the scan reads argument lists, not prose, deliberately (see "One nuance" below). |
| 4 | pass | Static: no `exitCode !== 0 … return` branch survives under `frontend/src`, and every `git` call there is followed by a throw. Dynamic (mutation M3): breaking the surviving call so `git` exits non-zero makes `level-window-claim.criteria.test.ts` **error out** (`git ls-files failed: unknown option`), never pass. |
| 5 | pass | Repo-wide over 45 tracked test files in `frontend/`, `question-bank/`, `backend/` and `e2e/`: no `<rev>:engineering-decisions.md` literal, and no `git` argument list anywhere takes that file. I also read all 20 textual occurrences by hand — every one is a `readFileSync` of the working tree. `highest-point-verify.test.ts:584`'s `git show origin/main:${path}` (T-070's, out of scope) resolves over question-bank data paths and `package.json`/`bun.lock`; it never names this file. |
| 6 | pass | `git diff --name-only origin/main...HEAD` is five files: the brief, the run log, `tasks.md`, `engineering-decisions.md` and the one test file — the diff only **removes** a git-revision assertion. No "nothing else moved" guard was added by the worker, and none by me: criteria 9 and 10 are diff-shaped, so I verified them by observation and deliberately wrote no test for them (a test for either would be the fifth instance). |
| 7 | pass, (a)–(g) each mutation-proven | All seven still assert and pass in `level-window-claim.criteria.test.ts` (10 pass / 0 fail). Each was broken on purpose and the matching test went red — M6–M13 below. |
| 8 | pass, ending **(b)** | The claim is gone from the test file, and `engineering-decisions.md` gained **E-12**, numbered above E-11 and appended after it. New tests assert: an entry numbered > 11 exists after E-11's offset, numbers stay unique and ascending, the entry names `frontend/src/level-window-claim.criteria.test.ts` and the removed test `"no existing E-n entry was modified"`, says why deletion beat re-pinning, and carries a `**Revisit when**` paragraph as E-11 does. Deliberately **not** "E-12 is the highest" — `tasks.md:26` forbids reintroducing a ceiling, so a later E-13 will not turn this red. No re-pinning to a newer commit, ref or range appears anywhere. |
| 9 | pass | `.github/workflows/ci.yml` is absent from `git diff --name-only origin/main...HEAD`. Verified by observation, not by a test (criterion 6). |
| 10 | pass | `frontend/package.json` and `frontend/bun.lock` are absent from the same diff, as is every other manifest and lockfile. My new test file adds no dependency and spawns only `git ls-files` against the local repo; the full suite was run with `HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY` pointed at `http://127.0.0.1:1`, CI's own network-fails-closed shape (`test-guidelines.md:72`). |

**Suite, typecheck, lint — everything, not just the new tests:**

- `frontend` — `bun test`: **223 pass / 1 fail / 1 error** (the `react-simple-maps`
  failure above, on both this branch and `origin/main`).
- `frontend` — `bun run lint`: **clean, exit 0, zero warnings**, with the new file.
- `frontend` — `bun run typecheck`: **fails on `UsMap.tsx` only** — `TS2307` for
  `react-simple-maps` and `us-atlas/states-10m.json` plus two implicit-`any`
  errors downstream of them. Same missing package; no error in any file this task
  or this verification touched.
- `question-bank` — `bun test`: **1251 pass / 0 fail**. Unaffected by E-12's append.
- `backend` — `uv run pytest`: **517 passed, 9 skipped**.

**Mutations made, and reverted.** Every one was applied, run, and restored; the
working tree was confirmed clean afterwards (`git status --short` shows only the
new test file).

| # | Mutation | Result |
|---|---|---|
| M1 | Added `["git", "merge-base", "HEAD", "origin/main"]` to `lint-gate.test.ts` | Criterion 3's subcommand and revision tests both red |
| M2 | Replaced `trackedFiles`' throw with `if (proc.exitCode !== 0) return []` | Criterion 4's two tests red |
| M3 | Added a bogus flag so `git ls-files` exits non-zero | `level-window-claim.criteria.test.ts` errors out — it cannot pass on a failed `git` |
| M4 | Added a `git show origin/main:engineering-decisions.md` call to `region-vocabulary.test.ts` | Criterion 5's two tests red |
| M5a/b/c | Deleted E-12 · renumbered it as a duplicate `E-11` · removed its `Revisit when` | 5 red · 5 red · 1 red |
| M6 | Removed `suggestedLevels` from E-10's body | 7(g) red |
| M7 | Wrote the banned client function name into `conventions.md` | 7(a) red |
| M8 | Changed `screens.tsx`'s `const options = …` expression | 7(c) red |
| M9 | Added a list-returning export to `lib/level.ts` | 7(d) red |
| M10 | Renumbered `## E-9` to `## E-99` so the numbers stop ascending | 7(f) red |
| M11 | Made a third non-test module mention `suggestedLevels` | 7(b) red |
| M12 | Stripped the `screens.tsx:NN` call site from E-10 | 7(g) red |
| M13 | Renamed the `## E-10 —` heading | 7(e) red, plus three dependants |

**One nuance, recorded rather than ruled on by me.** Criterion 3's enumeration
ends "…or names a literal commit sha". Read on its own, that also condemns
`frontend/src/ci-action-pinning.test.ts:169-170`, which holds two 40-hex literals
(`bunSha`, `checkoutSha`). They are E-5 action pins compared against `ci.yml`'s
text, are never handed to `git`, pre-date this task by many cycles, and are
excluded both by the brief's own definition of "resolves a git revision"
("passing a commit, ref, range or merge base to `git`") and by criterion 3's
"*Today only `:170` and `:173` do*". So: criterion 3 passes, and my test asserts
the narrower property the definition names — no sha reaches `git`.

**Two things for the reviewer, neither blocking:**

- **The unrelated failure was not filed in `tasks.md`.** Criterion 1 says to name
  such a failure in the Handoff *and* file it; the worker named it and argued it
  is an environment fact rather than a repo defect. I checked and agree:
  `react-simple-maps`, `@types/react-simple-maps` and `us-atlas` are declared in
  `frontend/package.json` and present in `bun.lock` on `main`, CI installs with
  network before its proxy-blocked `Test` step, and nothing in the repo could fix
  a mirror that returns 403. A `tasks.md` entry is the reviewer's call; it is not
  mine to write (`process.md`'s role table).
- **Independence, honestly stated.** This is an orchestrated run
  (`runs/T-073-frontend-git-baseline-guard.md` exists), so every spawned role
  shares one session id: mine is `cse_01Rpu7pnkLevs6ixvYy6r7zH`, the same value
  already in the `task-expander` and `worker` rows. **The Sessions-table check
  therefore did not pass and I am not claiming it did.** My independence is the
  weaker kind `process.md` describes: a freshly spawned agent with its own
  context window that never saw the worker's reasoning or transcript, reading
  only the committed brief and repo. It rests on the orchestrator having spawned
  me correctly, which I cannot verify myself. The worker's flagged
  session-collision question is the same fact, and it is a `process-tasks.md`
  question about the loop, not a T-073 defect.

**Files I added:** `frontend/src/git-baseline-guard.criteria.test.ts` (15 tests).
No source file was edited — every mutation above was temporary and reverted.

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

## Review

Written by `reviewer`, 2026-09-22. **Status: changes requested.
Next step: `tester`, finding 1.**

**TL;DR:** The worker's change is good and I would approve it on its own — the
deletion is the right call, E-12 records it honestly, and the file it touches is
10 pass / 0 fail at both clone depths. **The blocker is the tester's own new test
file:** `frontend/src/git-baseline-guard.criteria.test.ts` fails against itself
now that it is committed, because its scan reads `git ls-files` and it was
verified while still untracked. `bun test` in `frontend/` is **red on this
branch**, so criterion 1 does not hold as committed.

### Finding 1 — blocking. The new guard test fails on the committed branch

**File:** `frontend/src/git-baseline-guard.criteria.test.ts:55` (the offending
text) and `:138-150` (the test that flags it).

Reproduced on `claude/task-t073-orchestrator-2ek0bi` at `58dc2d4`, in a full
clone with `refs/remotes/origin/main` = `393b6ae`:

```
(fail) T-073 criterion 4 — no test in frontend/src can pass because git failed
       > every git call is followed by a throw on a non-zero exit
+   "frontend/src/git-baseline-guard.criteria.test.ts: [\"git\", \"ls-files\", …]"
```

`bun test` in `frontend/`: **222 pass / 2 fail / 1 error**. One of those two
failures is this test; the other is the pre-existing `react-simple-maps` gap
(finding 4 below), so the branch as committed has **one new failure of its own**.

**Why the Verdict did not see it.** `REPO_TEST_FILES` at `:50` comes from
`git ls-files`, which lists **tracked** files. The tester ran the suite before
committing the new file, so the file excluded itself from its own scan. The
moment it was committed it entered the file list, and the `["git", "ls-files",
…]` written in prose in the doc comment at `:55` matched the argument-list regex
at `:142` with no `throw` in the following 400 characters.

That is also the nuance the Verdict records at "One nuance": the scan is
described as reading argument lists and not prose, and this is a prose example of
an argument list. The self-exclusion is the more important half — a scan that
enumerates tracked files cannot be trusted until it has been run with itself
tracked.

**What would make it acceptable:** `bun test` in `frontend/` shows **no failure
other than the `react-simple-maps` one**, run on a branch where
`git-baseline-guard.criteria.test.ts` is already committed — and the criterion-4
tests still go red under the Verdict's own mutation M2 (replacing `trackedFiles`'
throw with a bare `return`). Fixing it by dropping the criterion-4 "throw"
assertion, or by excluding the guard file from its own scan, would not be
acceptable: the first loses the assertion, the second reintroduces the blind spot
that hid this. Narrowing the scan so it reads code rather than comments, or not
writing an example argument list in a comment, both work.

**Re-run the whole suite after committing, not before.** Every scan in this repo
that starts from `git ls-files` has this property.

### Finding 2 — not blocking. The guard file is a frontend test asserting repo-wide facts

`frontend/src/git-baseline-guard.criteria.test.ts:153-172` scans
`question-bank/`, `backend/` and `e2e/` test files, so a git-revision comparison
added in `question-bank/` turns **`frontend`'s** suite red. Criterion 5 is
repo-wide and there is no repo-level suite, so there was nowhere better; the
precedent (`level-window-claim.criteria.test.ts` scanning all tracked files) is
the same shape. Recorded so the surprise lands on a reader rather than on a
future `question-bank` task. No change requested.

### Finding 3 — not blocking. The criterion-4 heuristic is brittle by construction

`:138-150` asserts "an `exitCode !== 0` and a `throw` appear within 400
characters after a `git` argument list". It found a real defect once (this one),
and it will also flag a correctly-written call whose error handling sits in a
helper or more than 400 characters away. Acceptable for a defect that has now
recurred four times, but it is a trip-wire with a false-positive mode, and
finding 1 is its first false positive. Worth a line in whatever fixes finding 1
rather than a task of its own.

### Worker and tester flags — all disposed of here

| Flag | Raised by | Disposition |
|---|---|---|
| Criterion 8: ending (a) vs (b) | worker | **(b) accepted.** A git-free check of *body-text* immutability needs a pinned copy or hash inside the test, which is the same expiring baseline in a new place. E-12 says so in "What survives"; that is the right record and closes the question. |
| `react-simple-maps` failure not filed in `tasks.md` | worker, endorsed by tester | **Agreed, no task filed.** `react-simple-maps`, `@types/react-simple-maps` and `us-atlas` are declared in `frontend/package.json:49,62,69` and present in `bun.lock`; `frontend/node_modules` in this sandbox simply does not contain them, and `tsc` fails only on `UsMap.tsx` for the same reason. Nothing in the repo can fix a mirror that returns 403. If it ever reproduces on a machine that *can* install, that is a new task. |
| Session-id collision across all four rows | worker, tester | **Known and accepted, no action.** `process-decisions.md` D-3 and "Known weaknesses" already record that every role in an orchestrated run shares one id and that the Sessions check degrades to attestation. Both roles said so plainly instead of claiming the check passed, which is the behaviour the entry asks for. Not a T-073 defect; if it is to be escalated, it is a `process-tasks.md` `P-n` ticket done by hand. |
| Criterion 3 vs the literal shas in `ci-action-pinning.test.ts:169-170` | tester | **Agreed: criterion 3 passes.** The brief defines "resolves a git revision" as passing something to `git`, and those two shas are E-5 action pins compared against `ci.yml`'s text. The test asserting "no sha reaches `git`" is the right reading. |

### What I checked and found clean

- **The worker's change fits.** The deletion matches E-11/PR #55's precedent
  exactly; the replacement comment at `level-window-claim.criteria.test.ts:166-176`
  explains what was removed and points at E-12 instead of leaving a silent gap.
  E-12 is in E-11's voice and shape, appended after it, no existing `## E-n`
  heading touched. No re-pinning anywhere.
- **Scope.** The diff is six files: the brief, `runs/`, `tasks.md`,
  `engineering-decisions.md`, the edited test and the new test — all inside
  Constraints. `ci.yml`, `openapi.yaml`, the plan, migrations,
  `frontend/package.json` and `frontend/bun.lock` are untouched; no dependency
  added; no text a child reads.
- **Lanes.** The expander's commit (`5d1872b`) touches only `tasks.md` and
  `tasks/`; the tester's (`3310d0b`) only a test file and the brief. One
  irregularity, **not blocking and not the worker's fault**: `1472a68`, "T-073
  worker: checkpoint mid-step (orchestrator commit, uncommitted worker output)",
  is the orchestrator committing the worker's `engineering-decisions.md` and test
  edits because the worker's session ended without committing them. The content is
  the worker's and no role's text was authored out of lane, but `process.md`'s
  role table does not give the orchestrator source files, and a worker that does
  not commit is the failure D-8 is about. A loop question for
  `process-tasks.md`, by hand — not a `T` task, and not something to fix here.
- **`bun run lint` in `frontend/`** — clean, exit 0, zero warnings.
- **`bun run typecheck` in `frontend/`** — fails only on `UsMap.tsx`, the
  environment gap above.

### Not swept

The brief stays, `tasks.md` keeps its T-073 entry and nothing was logged in
`PROGRESS.md`: the task is not done, and sweeping would delete these findings.
PR #56 stays **draft**.

## Verdict — round 2

Written by `tester`, 2026-09-22, after the reviewer's finding 1. **Status: pass.**

**TL;DR:** Finding 1 is fixed and the fix was verified **after** committing, which
is the check that missed it last time. `bun test` in `frontend/` is now **223 pass
/ 1 fail / 1 error** with the guard file tracked — down from 222/2/1 — and the
single remaining failure is the pre-existing `react-simple-maps` module-load gap,
demonstrated (not assumed) to be there on `origin/main` too. All ten criteria
hold; sixteen mutations, including the reviewer's named M2, were applied and
reverted.

**What changed this round.** One file:
`frontend/src/git-baseline-guard.criteria.test.ts`. No source file was edited.

- **The scans read code, not prose.** A new `codeOf(source)` blanks every comment
  — each comment character replaced by a space, newlines kept, so offsets and line
  numbers still match the file on disk — and `read()` returns that. `gitCalls`,
  the criterion-4 throw scan and the criterion-5 `<rev>:<path>` scan all read it.
- **`engineering-decisions.md` is read raw** (`readRaw`), because it is prose and
  `codeOf` is a source stripper. Criterion 8's assertions are about what the entry
  says.
- **The sample argument list is gone from the doc comments** as well, so the file
  does not rely solely on the stripper to stay honest about itself.
- **Finding 3 got its line.** The 400-character proximity heuristic is now
  commented with its false-positive mode: a correct call whose error handling
  lives in a helper will trip it, and the right response then is to reconsider the
  rule, not contort the call.

**Neither escape the review ruled out was taken.** The criterion-4 throw assertion
is intact, and the guard file is **not** excluded from its own scan — it is in
`REPO_TEST_FILES`, scans itself, and passes because its only `git` argument list
is real code with a throw two lines below it.

| Finding | Verdict | Evidence |
|---|---|---|
| **1 — blocking** | **fixed** | Reproduced first at `629c8c1`: 222 pass / **2 fail** / 1 error, the guard file flagging its own doc comment. After the fix, committed as `20bae0f` and then re-run: **223 pass / 1 fail / 1 error**, the remaining failure being `react-simple-maps` only. |
| 2 — not blocking | unchanged, by design | The guard still scans `question-bank/`, `backend/` and `e2e/` from `frontend`'s suite. Criterion 5 is repo-wide and there is no repo-level suite; the review requested no change. |
| 3 — not blocking | line added | The heuristic and its false-positive mode are now documented at the test that uses it. |

**Criteria, re-verified this round (not carried over):**

| # | Verdict | Evidence |
|---|---|---|
| 1 | **pass, modulo one environment-only failure** | Full clone (`refs/remotes/origin/main` = `393b6ae`): `bun test` in `frontend/` → **223 pass / 1 fail / 1 error**, with the guard file **tracked and committed**. The failure is `src/components/screens.criteria.test.tsx` failing to load `UsMap.tsx` (`Cannot find package 'react-simple-maps'`). Proven pre-existing: a `git worktree` at `393b6ae` sharing this `node_modules` gives **208 pass / 2 fail / 1 error** — the same `react-simple-maps` failure *plus* `no existing E-n entry was modified`. The branch removes exactly one failure and adds none. |
| 2 | pass | `git update-ref -d refs/remotes/origin/main`, rerun: **223 pass / 1 fail / 1 error**, and the junit test-name/outcome sets from the two runs are **identical** (223 cases, `identical: True`, compared programmatically). **The ref was restored** to `393b6aee60902941c0d6499768fb6b60c7d3e94a` and re-verified with `git rev-parse`. |
| 3 | pass | Guard tests, now reading code only: every `git` argument list under `frontend/src` uses a working-tree subcommand (`ls-files`/`status`/`check-ignore`), none is handed a `HEAD`, `origin/…`, range or sha, and no 40-hex literal reaches `git`. Only one such call exists — `trackedFiles`' `git ls-files` (`level-window-claim.criteria.test.ts:39-45`). Mutation-proven twice (M1, M14). |
| 4 | pass | Static: no `exitCode !== 0 … return` survives under `frontend/src`, and every `git` call is followed by a throw. Dynamic: M3 makes `git ls-files` exit non-zero and `level-window-claim.criteria.test.ts` **errors out** (`git ls-files failed: unknown option`) — it cannot reach a passing assertion. M2, the reviewer's named check, turns both criterion-4 tests red. |
| 5 | pass | Repo-wide over every tracked test file in `frontend/`, `question-bank/`, `backend/` and `e2e/`: no `<rev>:engineering-decisions.md` literal in code, and no `git` argument list takes that file. M4 proves it red. `highest-point-verify.test.ts:584` (T-070's, out of scope) resolves over question-bank data paths, never this file. |
| 6 | pass | `git diff --name-only origin/main...HEAD` is six files: the brief, the run log, `tasks.md`, `engineering-decisions.md` and two test files. The diff only **removes** a git-revision assertion. No "nothing else moved" guard was added. The guard file holds the strings `"origin/"` and `HEAD` inside a *detector predicate* — patterns it searches for, never arguments handed to `git`; its own criterion-3 test would flag them if they ever were. |
| 7 | pass, (a)–(g) each mutation-proven again | `level-window-claim.criteria.test.ts` is 10 pass / 0 fail, and M6–M13 below each turned the matching test red. |
| 8 | pass, ending **(b)** | E-12 is present, numbered above E-11, appended after it, names the file and the removed test, says why deletion beat re-pinning, and carries a `**Revisit when**` paragraph. Deliberately **not** "E-12 is the highest" (`tasks.md:26`: do not reintroduce a ceiling). M5a/b/c prove the five assertions bite. |
| 9 | pass | `.github/workflows/ci.yml` is absent from `git diff --name-only origin/main...HEAD`. Verified by observation, not by a test — a test for it would be criterion 6's fifth instance. |
| 10 | pass | `frontend/package.json` and `frontend/bun.lock` absent from the same diff, as is every other manifest and lockfile. The guard file spawns only `git ls-files` against the local repo; every suite run above had `HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY` pointed at `http://127.0.0.1:1`, CI's fail-closed shape (`test-guidelines.md:72`). |

**Whole suite, typecheck, lint — all of it, after the commit:**

- `frontend` — `bun test`: **223 pass / 1 fail / 1 error** (`react-simple-maps`,
  present on `origin/main` too).
- `frontend` — `bun run lint`: **clean, exit 0, zero warnings**.
- `frontend` — `bun run typecheck`: **fails on `UsMap.tsx` only** — `TS2307` for
  `react-simple-maps` and `us-atlas/states-10m.json`, plus two implicit-`any`
  errors downstream. No error in any file this task or this verification touched.
- `question-bank` — `bun test`: **1251 pass / 0 fail**.
- `backend` — `uv run pytest`: **517 passed, 9 skipped**.

**Mutations, all applied, run and reverted.** `git status --short` afterwards
showed only the guard test file; no worktree and no ref change was left behind.

| # | Mutation | Result |
|---|---|---|
| M1 | `["git", "merge-base", "HEAD", "origin/main"]` added to `lint-gate.test.ts` | criterion 3's subcommand and revision tests red (3 red) |
| M2 | `trackedFiles`' throw replaced by a bare `return []` | **both** criterion-4 tests red — the reviewer's named check |
| M3 | bogus flag so `git ls-files` exits non-zero | `level-window-claim.criteria.test.ts` errors out; cannot pass on a failed `git` |
| M4 | `["git", "show", "origin/main:engineering-decisions.md"]` added to `region-vocabulary.test.ts` | criterion 5's two tests red |
| M5a/b/c | E-12 deleted · renumbered a duplicate `E-11` · `Revisit when` removed | 5 red · 5 red · 1 red |
| M6 | `suggestedLevels` renamed out of E-10's body | 7(g) red |
| M7 | the banned client function name written into `conventions.md` | 7(a) red |
| M8 | `screens.tsx`'s `const options = …` expression changed | 7(c) red |
| M9 | a list-returning export added to `lib/level.ts` | 7(d) red |
| M10 | `## E-9` renumbered `## E-99` so the numbers stop ascending | 7(f) red |
| M11 | a third non-test module (`lib/api/client.ts`) reads `suggestedLevels` | 7(b) red |
| M12 | the `screens.tsx:NN` call sites stripped from E-10 | 7(g) red |
| M13 | the `## E-10 —` heading renamed | 7(e) red, plus three dependants |
| **M14** | a revision call written **on the same line after a block comment** | criterion 3 red — the stripper blanks comments without swallowing the code beside them |
| **M15** | the same argument list written **in a comment**, not code | **stays green (15 pass / 0 fail)** — prose recording a removal is not an invocation, which is the whole of the fix |

M14 and M15 are the pair that matters for finding 1: together they show the scan
lost nothing it used to catch and gained the ability to tell a record of the
defect from the defect.

**Two things for the reviewer, neither blocking:**

- **The `react-simple-maps` failure is still unfiled in `tasks.md`.** Unchanged
  from round 1, and the review already disposed of it: the packages are declared
  in `frontend/package.json` and present in `bun.lock`; this sandbox's
  `node_modules` simply lacks them because the npm mirror refuses them. Filing
  `tasks.md` entries is the reviewer's lane, not mine.
- **Independence, honestly stated, again.** This is an orchestrated run
  (`runs/T-073-frontend-git-baseline-guard.md` exists), so every spawned role
  shares one session id — mine is `cse_01Rpu7pnkLevs6ixvYy6r7zH`, the value
  already in all four rows. **The Sessions-table check did not pass and I am not
  claiming it did.** My independence is the weaker kind `process.md` describes: a
  freshly spawned agent with its own context window, which never saw the worker's
  or the previous tester's transcript and read only the committed brief and repo.
  It rests on the orchestrator having spawned me correctly, which I cannot verify
  myself. `process-decisions.md` D-3 already records this as accepted.

**Rounds used:** this is the first fail→fix→verify round on T-073 and it came from
the reviewer rather than from a failing criterion, so the two-round escalation
bound in `process.md` step 4 is not close.

## Review — round 2

Written by `reviewer`, 2026-09-22. **Status: approved. PR #56 marked ready, no
escalation note.**

**TL;DR:** Finding 1 is genuinely fixed, and I re-verified it myself on the
committed tree rather than taking the Verdict's word for it. `bun test` in
`frontend/` is **223 pass / 1 fail / 1 error** here, the one failure being this
sandbox's missing `react-simple-maps` package — and **all six CI jobs are green
on the head commit `eea13da`**, which settles that gap: in an environment that
can install, frontend typecheck, lint and test all pass. Findings 2 and 3 are
disposed of. The PR is ready for Dkaattae to merge.

### Finding 1 — fixed, re-verified independently

The fix is `codeOf()` at `git-baseline-guard.criteria.test.ts:74-122`: a comment
stripper that blanks comment characters to spaces while preserving newlines and
offsets, so every scan reads code and not prose. The sample argument list that
tripped the scan is also gone from the doc comments, so the file does not lean on
the stripper alone to stay honest about itself. **Neither of the two escapes I
ruled out was taken** — the criterion-4 throw assertion is intact, and the guard
file is still in `REPO_TEST_FILES` and scans itself.

What I ran, on the pushed tree at `eea13da` with the guard file tracked:

| Check | Result |
|---|---|
| `bun test` in `frontend/` | **223 pass / 1 fail / 1 error** — only `screens.criteria.test.tsx` / `Cannot find package 'react-simple-maps'` |
| `bun test` on the two criteria files | **25 pass / 0 fail** |
| Mutation M2 (`trackedFiles`' throw → `return []`) | **2 fail** — both criterion-4 tests red, which is exactly what I asked for |
| A real `["git", "merge-base", "HEAD", "origin/main"]` added **in code** to `lint-gate.test.ts` | **3 fail** — criterion 3 catches it |
| The same list added **in a comment** | **15 pass / 0 fail** — prose is not flagged |
| `bun run lint` in `frontend/` | clean, exit 0, zero warnings |
| `bun run typecheck` in `frontend/` | fails on `UsMap.tsx` only (`TS2307` ×2 plus two downstream implicit-`any`) |
| `bun test` in `question-bank/` | **1251 pass / 0 fail** |
| `uv run pytest` in `backend/` | **517 passed, 9 skipped** |
| CI on `eea13da` | **six jobs, all `success`**, including `frontend (typecheck, lint, test)` |

Every mutation was reverted; `git status --short` is clean.

### Finding 2 — closed, no change

The guard still scans `question-bank/`, `backend/` and `e2e/` from `frontend`'s
suite, as I said it could. Criterion 5 is repo-wide and there is no repo-level
suite. Recorded in `PROGRESS.md` so the surprise lands on a reader rather than on
a future `question-bank` task.

### Finding 3 — closed, line added

`:207-212` now documents the 400-character proximity heuristic and its
false-positive mode, and says the right response to a future trip is to
reconsider the rule rather than contort the call. That is what I asked for.

### One observation, deliberately not filed as a task

`codeOf`'s doc comment claims "the failure mode is scanning too much, never too
little". That is very nearly true and not quite: a regex literal with an
unescaped `//` inside a character class — `/[//]/` — would blank the rest of that
line. No such literal exists in the repo, the consequence is one under-scanned
line rather than a wrong assertion, and a `tasks.md` entry for an over-precise
sentence in a test comment would make the queue longer without making it more
useful. Recorded here instead.

### Envelope check (`process.md` step 6)

Every item holds, so the PR is marked **ready with no escalation note**:

- tester returned **pass**; suite, typecheck and lint green in CI on the head
  commit, and green locally apart from the demonstrated environment gap;
- nothing outside Constraints — the six files are the brief, `runs/` (the
  orchestrator's log), `tasks.md`, `engineering-decisions.md` and two test files
  under `frontend/src/`;
- no dependency added; `frontend/package.json` and `frontend/bun.lock` untouched;
- `openapi.yaml`, migrations and `geoquizdataplan.md` untouched;
- **no text a child will read** — `engineering-decisions.md` is developer prose;
- no product decision settled. E-12 is an engineering decision the brief's own
  criterion 8(b) authorised.

### Lanes, re-checked for round 2

`20bae0f` (tester) touches only the test file; `391e260` (tester) only the brief;
`eea13da` (orchestrator) only `runs/`. The round-1 irregularity stands unchanged
and is **not** blocking: `1472a68` is the orchestrator committing the worker's
source edits because the worker's session ended without committing them. The
content is the worker's and nothing was authored out of lane, but it is a gap in
the loop rather than in this task — filed as **P-7** in `process-tasks.md`.

### Swept

Brief deleted, `tasks.md`'s T-073 entry deleted, `PROGRESS.md` updated. Queue
trimmed: T-070 amended (the defect family is now down to its two named
leftovers, and the new guard file is the shape to extend); T-065 amended (the
frontend figure moved again, which is its argument, not a new task). Loop gaps to
`process-tasks.md`: **P-4** amended with this cycle's recurrence, **P-7** added.
