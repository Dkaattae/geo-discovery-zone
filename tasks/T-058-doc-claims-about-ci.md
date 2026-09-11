# T-058 — Three doc claims that are true-ish, and one that is not

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** Dkaattae — 2026-09-11
**From:** [`tasks.md`](../tasks.md) T-058
**Branch:** `claude/t009-orchestrator-startup-uot0vc` — the branch this session
was assigned by the environment (Claude Code on the web), used instead of
`task/T-058-…` per `process.md`, "When the environment names the branch for you".
**Every role on this task pushes here.**
**PR:** [#35](https://github.com/Dkaattae/geo-discovery-zone/pull/35) — draft,
opened at expand time from the branch above, and it stays draft until the
reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-05 | cse_01ACZu6WMBf4Kx8dTMZLKKuW |
| worker | 2026-09-11 | cse_01ACZu6WMBf4Kx8dTMZLKKuW |

## Goal

`README.md` and `conventions.md` make four claims about how this repo is checked.
One is simply false (CI runs six jobs, not five), one has become false since it
was written (CI does run the Postgres path), one overstates a guard that four of
six jobs actually have, and one hardcodes a count that the next `e2e` task will
invalidate. Correct them, and — where the claim is about `ci.yml` — put it under a
test, because `conventions.md`'s job list stayed true only because a test holds it
there while `README.md`'s drifted alone.

## What is already true — surveyed 2026-09-05, do not rebuild

Read this before starting; several things the criteria mention already exist.

| Fact | Where |
|---|---|
| `ci.yml` has **six** jobs: `frontend`, `question-bank`, `backend`, `backend-postgres`, `integration`, `e2e` | `.github/workflows/ci.yml:16-322` |
| **Four** jobs verify their lockfile did not move with `git diff --exit-code` | `ci.yml:45` (bun.lock), `:112` (bun.lock), `:165` (uv.lock), `:299` (bun.lock) |
| **Two do not** — they install with `--frozen` and stop there | `backend-postgres` install at `ci.yml:227`, `integration` install at `ci.yml:266` |
| `conventions.md`'s **job list is already correct** and already asserted set-equal to `ci.yml`'s `jobs:` keys | `conventions.md:96-98`, test at `frontend/src/conventions-doc.test.ts:301-337` |
| `conventions.md:10`'s "once built" clause is **accurate** — the backend serves the bundle when one exists | `backend/tests/test_frontend_serving.py` |
| Machinery for parsing `ci.yml` and asserting on a doc already exists and needs no new dependency | `frontend/src/conventions-doc.test.ts:23-61`, `301-312` |

And the four defects, each with its line:

- **`README.md:202-203`** — "CI runs all **five** jobs on every pull request:
  `frontend`, `question-bank`, `backend`, `backend-postgres` and `integration`."
  Six, and `e2e` is the missing one. This is the one that is plainly false.
- **`README.md:229-231`** — "**CI only runs the SQLite path.** … nothing runs
  `make -C backend test-postgres` automatically, so a Postgres-only regression
  would not fail a pull request." False since the `backend-postgres` job landed
  (`ci.yml:197-244` runs the whole suite against Postgres 16 on every PR).
  **Found by this survey, not by T-007's reviewer** — it is the same defect in the
  same file and is folded in here rather than queued separately.
- **`conventions.md:98`** — "Each installs from a frozen lockfile, checks the
  lockfile did not move" — said of all six; true of four.
- **`conventions.md:66`** — "`# e2e — thirteen full user journeys`". True today,
  stale after the next `e2e` task, and nothing asserts it.

Two counts in `README.md`'s Checks block are stale in the same way and are in
scope: `README.md:183` "ruff + 221 tests" and `README.md:185` "28 tests"
(`tasks.md` §A and `PROGRESS.md` both say 242 backend and 30 integration today).

`README.md` never mentions the browser suite at all — no `e2e` command in the
Checks block, which is why nobody noticed the sixth job.

## Acceptance criteria

Frozen once approved. They change only by coming back through `task-expander`.

1. **`README.md`'s CI claim names every job and states the right number.** The set
   of job names it lists for `ci.yml` is exactly the set of top-level keys under
   `jobs:` in `.github/workflows/ci.yml` — six today, including `e2e` — and no
   sentence in `README.md` states a number of CI jobs other than that set's size.

2. **A test in the repo goes red when `README.md`'s job list and `ci.yml` disagree**,
   in both directions: deleting one job name from `README.md`'s list fails it, and
   adding a seventh job to `ci.yml` without touching `README.md` fails it too.

3. **`README.md` no longer says CI skips the Postgres path.** No sentence in it
   claims that `make -C backend test-postgres` runs only locally, that nothing
   exercises Postgres automatically, or that a Postgres-only regression would not
   fail a pull request. Whatever replaces the bullet is consistent with
   `ci.yml:197-244`.

4. **`README.md`'s Checks section names a way to run every suite CI runs** — the
   frontend, question-bank and backend suites, the Postgres run, the integration
   run, and the browser suite in `e2e/` — and every command it names is a real
   script or `make` target (a key of the relevant `package.json`'s `scripts`, or a
   target in `backend/Makefile`).

5. **`conventions.md` attributes the lockfile-drift check only to the jobs that
   have it.** For every job the CI section says checks its lockfile, that job in
   `ci.yml` contains a step running `git diff --exit-code` against the lockfile it
   installed from. Today that is exactly `frontend`, `question-bank`, `backend`
   and `e2e`; `backend-postgres` and `integration` must not be among those the doc
   claims it for. The section still says all six install from a frozen lockfile,
   which is true of all six.

6. **A test in the repo goes red when that attribution stops matching `ci.yml`**,
   in both directions: deleting the `Lockfile unchanged` step from any of the four
   jobs that have it fails the test, and adding such a step to `backend-postgres`
   without updating `conventions.md` fails it too.

7. **No count of e2e journeys survives in `conventions.md` unless something
   asserts it.** Either the number is gone from the `e2e` comment at
   `conventions.md:66`, or a test in the repo goes red when the number of tests
   under `e2e/tests/` stops matching it. Adding a fourteenth e2e test must not be
   able to make the doc quietly wrong.

8. **The same holds for `README.md`'s Checks block.** No number describing the size
   of a test suite appears there unless a test asserts it — `README.md:183`'s
   "221 tests" and `README.md:185`'s "28 tests" are both wrong today and are
   either removed or made true *and* asserted.

9. **`.github/workflows/ci.yml` is byte-identical to its state at the branch
   point, and no dependency is added anywhere.** `git diff main -- .github/` is
   empty at the end of this task. Adding the two missing `Lockfile unchanged`
   steps is a CI change, not a doc fix — see Out of scope.

10. **The whole existing suite stays green and no test reaches the network.**
    `cd frontend && bun test && bun run typecheck && bun run lint` passes with no
    warnings (the lint gate fails on warnings — T-006), the twelve criterion
    groups already in `frontend/src/conventions-doc.test.ts` still pass, and every
    test added or changed here reads repo files from disk only.

## Out of scope

- **Adding `Lockfile unchanged` steps to `backend-postgres` and `integration`.**
  `tasks.md` offers it as the other way to make `conventions.md:98` true, and it is
  genuinely cheap — but it changes what CI does, and `process.md` ("Work on the
  loop itself never enters the loop") puts workflow changes outside a `T` task's
  reach. The doc is what is wrong here; the guard is a separate, arguable
  improvement. **Reviewer: add it to `tasks.md` at sweep** as a small entry, so the
  option is not lost. Criterion 9 makes the boundary checkable.
- **Rewording `conventions.md:10`** ("serving `/api/v1` and, once built, the
  frontend on the same origin"). Accurate as written; `tasks.md` marks the reword
  optional. It is a review-checklist item below, not a criterion. If it is
  reworded it must stay true and must not reintroduce any string
  `conventions-doc.test.ts:118-131` forbids.
- **Deduplicating `frontend/src/ci-workflow-pins.test.ts` and
  `ci-action-pinning.test.ts`** — that is T-061, and it is the reason this task
  should not casually add a third independent parser of `ci.yml` (see Constraints).
- **`CLAUDE.md` lines 4 and 51**, which still call the backend `api/` and "not
  built yet". Loop-gated: a hand-written `P` ticket, not this.
- **`test-guidelines.md`** — T-047 owns it.
- Any change to `backend/`, `question-bank/`, `e2e/` source, `openapi.yaml`, or
  the plan.

## Constraints

- **Files expected to change:** `README.md`, `conventions.md`, and one or more
  test files under `frontend/src/`. Nothing else, apart from the brief itself.
- **Prefer extending an existing frontend test file** over adding a new one.
  `frontend/src/conventions-doc.test.ts` already reads `ci.yml`, `package.json`
  files and `backend/Makefile` from the repo root and has the helpers criteria 2,
  6 and 7 need. Three files parsing `ci.yml` is already one too many (T-061); a
  fourth is worse. If a new file is genuinely clearer, say in the Handoff how it
  relates to T-061.
- **No new dependency, no new test runner, no new CI job.** The frontend `bun test`
  suite is where repo-level doc assertions live.
- **No network in tests** (`test-guidelines.md`, "No network in tests, ever").
  Everything here is a file read.
- **Assert against the repo, never against the doc.** Expected values come from
  `ci.yml`, `e2e/tests/`, `package.json` and `backend/Makefile` — reading them out
  of `README.md` or `conventions.md` only ratifies whatever the doc happens to
  say. `conventions-doc.test.ts:5-21` states this rule; keep it.
- **Do not weaken `conventions-doc.test.ts` criterion 10** (`:325-336`). It finds
  the doc's job list as the longest run of adjacent backticked tokens in the CI
  section, so a *shorter* backticked list added for the lockfile claim is safe and
  a longer one is not.
- Text a child reads is not involved; both files are for developers.

## Context

Required reading, not background.

- `README.md:181-203` (Checks and the CI claim) and `README.md:224-235` (Known
  issues).
- `conventions.md:6-16` (Layout), `:51-78` (Commands, including the `e2e` comment
  at `:66`), `:93-104` (CI).
- `.github/workflows/ci.yml` — the authority for criteria 1, 2, 5, 6 and 9.
  Job keys at `:17`, `:93`, `:141`, `:197`, `:253`, `:280`; `Lockfile unchanged`
  steps at `:42-45`, `:110-112`, `:163-165`, `:297-299`.
- `frontend/src/conventions-doc.test.ts` — how this repo already asserts a doc
  against the repo, especially `section()`/`codeBlock()` at `:32-55`,
  `workflowJobs()` at `:301-312`, and criterion 10 at `:314-337`.
- `e2e/tests/` — two spec files, the subject of criterion 7.
- `tasks.md` §A, T-058 (the queue entry), T-047 and T-061 (the neighbouring
  cleanups), and its "Foundations" table at `tasks.md:93-103`.
- `PROGRESS.md:394-398` — the standing note that `README.md:202` is wrong; it is
  the reviewer's sweep line when this lands.
- `test-guidelines.md`, "No network in tests, ever".
- `process.md`, "Work on the loop itself never enters the loop" — why criterion 9
  exists.

## Review checklist — for the human on the PR

The criteria above cover every factual claim mechanically. These are the parts
only a person can judge.

- [ ] The corrected sentences read as naturally as the ones they replace — the
      lockfile sentence in particular should not turn into a list of exceptions.
- [ ] Nothing removed took real information with it. Dropping "221 tests" is
      fine; dropping *which* command runs the backend suite is not.
- [ ] `conventions.md:10`'s optional reword: either it was left alone (fine), or
      the new wording is clearer *and* still true of `backend/app/main.py`'s
      static serving.
- [ ] No new claim was introduced that nothing asserts. This task exists because
      of unasserted claims; adding one would be an odd way to finish it.

## Handoff

Written by `worker` before the tester runs.

**TL;DR:** all four defects fixed in `README.md`/`conventions.md`; every
`ci.yml`-derived claim now sits under a test in
`frontend/src/conventions-doc.test.ts` (extended, not duplicated); the two
count claims (criteria 7, 8) were fixed by *removing* the numbers rather than
asserting them, a choice the brief explicitly allows and I'm flagging as a
judgment call below; `.github/` diff against `main` is empty; `bun test`,
`typecheck` and `lint` are all green modulo one pre-existing, documented,
unrelated sandbox gap (see "What I did not touch").

### Files changed

- **`README.md`** — Checks block: dropped "221 tests" / "28 tests", added the
  missing `cd e2e && bun run test` line and a one-line note on what `e2e`
  needs (Docker + a one-time Chromium install), fixed "all five jobs" →
  "all six jobs" with `e2e` added to the list. Known issues: deleted the
  "CI only runs the SQLite path" bullet outright — the fact it described is no
  longer true, so there was no accurate replacement to write, only removal.
- **`conventions.md`** — CI section: split "each installs from a frozen
  lockfile, checks the lockfile did not move" into two claims — all six
  install from a frozen lockfile (still true, kept), and only `frontend`,
  `question-bank`, `backend` and `e2e` additionally check it did not move
  (now correct; was claimed of all six). Commands block: dropped "thirteen"
  from the `# e2e —` comment.
- **`frontend/src/conventions-doc.test.ts`** — extended, not duplicated (see
  Constraints). Added:
  - `sectionOf(lines, heading)` — the existing `section()` helper generalised
    over which document's lines it searches, so `section()` (conventions.md)
    and the new `readmeSection()` (README.md) share one implementation.
  - `backendTargetsNamedIn(text)` and `bunScriptsIn(block)` — the existing
    `backendTargetsNamedInDoc()` / `bunScriptsByPackage()` generalised the same
    way, so README's Checks block can be checked with the same logic already
    proven against conventions.md's Commands block.
  - `longestBacktickRun(text)` — conventions.md's existing criterion-10 trick
    (find the doc's job list as the longest run of adjacent backticked
    tokens) factored out so README's CI sentence can use it too.
  - `jobsWithLockfileCheck()` — parses `ci.yml`'s job blocks and returns the
    ones containing a `git diff --exit-code` step.
  - Six new `describe` blocks (search `T-058 #` in the file) covering
    criteria 1-8: README's job list/count, README's Postgres claim, README's
    Checks completeness against real commands, the two count-removal guards
    (7, 8), and conventions.md's lockfile attribution (5, 6).

### Criteria → where the behaviour lives

| # | Criterion | Where |
|---|---|---|
| 1 | README names every job, right count | `README.md` Checks section CI sentence; test `README's CI claim names every job and states the right count (T-058 #1, #2)` |
| 2 | Test goes red both directions | Same describe block — verified by hand in both directions (see below), not just by inspection |
| 3 | README no longer claims CI skips Postgres | Bullet removed from `README.md` Known issues; test `README no longer says CI skips the Postgres path (T-058 #3)` |
| 4 | README names a real command for every CI suite | `README.md` Checks block (added `e2e` line); test `README's Checks section runs every suite CI runs, with real commands (T-058 #4)` |
| 5 | conventions.md attributes lockfile check only to the 4 jobs that have it | `conventions.md` CI section, reworded; test `conventions.md attributes the lockfile check only to the jobs that have it (T-058 #5, #6)` |
| 6 | Test goes red both directions | Same describe block — verified by hand in both directions (see below) |
| 7 | No unasserted e2e count | Number removed from `conventions.md:66`; guard test `no unstated e2e journey count survives...(T-058 #7)` |
| 8 | No unasserted test-suite size in README's Checks block | Numbers removed from `README.md`; guard test `no unstated test-suite size survives...(T-058 #8)` |
| 9 | `.github/` byte-identical to `main`, no dependency added | Verified: `git diff main -- .github/` is empty (checked below); no `package.json`/lockfile touched |
| 10 | Whole suite green, no network | `cd frontend && bun test && bun run typecheck && bun run lint` — see "Test run" below |

### Both directions verified for criteria 2 and 6

I mutated a scratch copy of the repo to confirm each new test actually goes
red, then restored the originals and reconfirmed `git diff main -- .github/`
is empty:

- **Criterion 2, direction 1** (delete a job name from README's list): failed
  `README's CI claim names every job and states the right count (T-058 #1, #2)`.
- **Criterion 2, direction 2** (append a 7th job to `ci.yml`, README untouched):
  failed the same test (and, as a side effect, conventions.md's existing
  criterion-10 test too — expected, since both read the same job set).
- **Criterion 6, direction 1** (delete the `Lockfile unchanged` step from
  `frontend`'s job): failed `conventions.md attributes the lockfile check only
  to the jobs that have it (T-058 #5, #6)`.
- **Criterion 6, direction 2** (add a `Lockfile unchanged` step to
  `backend-postgres`, doc untouched): failed the same test.

### Judgment call — flagging for reviewer

**Criteria 7 and 8 were satisfied by removing the count, not by asserting it.**
Both criteria explicitly allow this ("either the number is gone... or a test
... goes red"). I chose removal over a parser that counts `test(` occurrences
in `e2e/tests/*.spec.ts` or invokes `pytest --collect-only`, because:
- the e2e count is easy to assert (13 `test(` calls today, matching the old
  "thirteen") but doing so needs a spelled-number ↔ digit mapping that adds
  fragility for no real benefit over just dropping the word;
- the backend/integration counts (221, 28) would need either a subprocess
  invocation of `pytest --collect-only` from a frontend test (a cross-language
  dependency this file doesn't otherwise have, and a slower, more brittle
  test) or hand-copying numbers I'd have to keep in sync manually — exactly
  the failure mode this task exists to close.
Removal is lower-risk and satisfies the letter of both criteria. **Reviewer:
confirm this reading is acceptable** — if a future task wants the counts back
with real assertions, that is new scope, not a revert of this one.

### What I did not touch, and why

- **`ci.yml`** — untouched per criterion 9 and "Out of scope" (adding the two
  missing `Lockfile unchanged` steps is a CI change, not a doc fix; already
  flagged by the expander for `tasks.md` at sweep).
- **`conventions.md:10`'s optional reword** — left alone; it's accurate as
  written and the brief marks the reword optional.
- **`frontend/src/lint-gate.test.ts` and `UsMap.tsx`'s missing
  `react-simple-maps`/`us-atlas` types** — pre-existing, undocumented by me
  but documented by T-007's worker in `PROGRESS.md:268-271`: `bun.lock` pins
  these packages' download URLs at a private Lovable npm mirror
  (`europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache`) this
  sandbox's egress proxy denies with a 403 policy rejection, not a transient
  fault — the proxy status endpoint reports it as `connect_rejected`, "policy
  denial or upstream failure". I ran `bun install` early on to chase a
  separate, since-resolved `@eslint/js` gap; that command failed to refetch
  `react-simple-maps` and its `d3-*` dependencies (same 403), leaving
  `UsMap.tsx`'s two `TS2307` "cannot find module" errors plus two downstream
  `any`-type errors in `bun run typecheck`'s output. These are not caused by
  anything in this task's diff (`UsMap.tsx` is untouched) and match exactly
  what T-007's worker hit in the same sandbox. Per the agent-proxy README,
  403s are a policy denial, not something to retry. CI has full registry
  access and typechecks clean there.

### Test run

```
cd frontend && bun test           # 174 pass, 0 fail (was 156 before this task;
                                   # +18 from the new T-058 describe blocks)
cd frontend && bun run typecheck  # clean except the pre-existing UsMap.tsx
                                   # errors above — no error in any file this
                                   # task touched
cd frontend && bun run lint       # clean, 0 warnings
```

No test added or changed here reaches the network — every one reads
`README.md`, `conventions.md`, `.github/workflows/ci.yml`,
`backend/Makefile` or a `package.json` from disk.

`git diff main -- .github/` is empty; no dependency was added; no lockfile
touched.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

- The survey table in the brief was accurate throughout — no surprises there.
- Generalising `section()`/`backendTargetsNamedInDoc()`/`bunScriptsByPackage()`
  into text-parameterised helpers (`sectionOf`, `backendTargetsNamedIn`,
  `bunScriptsIn`) let README's Checks block reuse conventions.md's existing,
  already-proven parsing logic instead of writing a parallel copy — this felt
  like the right amount of refactor for "prefer extending an existing file"
  without turning it into a rewrite. Existing T-007 tests are untouched in
  behaviour; only their implementation moved behind the wrapper functions.
- Removing the two hardcoded test-suite counts (README's 221/28, and
  conventions.md's "thirteen") rather than asserting them is the one real
  judgment call in this task — see the Handoff's "Judgment call" section.
  I believe it is the lower-risk reading of criteria 7 and 8, but it is a
  reviewer-checkable choice, not a fact.
- An unrelated `bun install` (chasing a transient `@eslint/js` gap that
  resolved itself) briefly broke `react-simple-maps`/`us-atlas` in
  `node_modules` by trying to refetch them from a private registry mirror
  this sandbox can't reach. This reproduces a documented, pre-existing gap
  (`PROGRESS.md:268-271`, T-007), not a new one — but it's worth recording
  that running unscoped `bun install` in this sandbox is a way to *lose*
  packages, not just gain them, since the lockfile's pinned download URLs
  aren't all reachable here. A future worker hitting the same `@eslint/js`
  gap should reach for `bun install --frozen-lockfile` only if truly needed,
  expect it to fail loudly on the same mirror, and not treat that failure as
  something to fix.
