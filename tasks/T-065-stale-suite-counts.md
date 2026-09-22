# T-065 — Delete the stale suite-size counts, and stop them coming back

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** katechen150621@gmail.com — 2026-09-22, approved via chat on PR #57.
**From:** [`tasks.md`](../tasks.md) T-065
**Branch:** `claude/gifted-albattani-0vh9mr` — the branch this session was
assigned. Every later role pushes here, not to `task/T-065-*`
(`CLAUDE.md` "Branches", `process.md` "When the environment names the branch for
you").
**PR:** #57, opened draft at expand time from the branch above.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-22 | cse_01KkjXcoL82TkpiL7GbimiCh |
| worker | 2026-09-22 | cse_01KkjXcoL82TkpiL7GbimiCh |

## Goal

Three documents currently state how many tests this repo has, and two of those
figures are wrong in the tree right now — `PROGRESS.md` says 687 against a real
1131, `test-guidelines.md` says 19 and 65. The same two numbers have been
hand-corrected five times and abandoned the sixth, and `tasks.md`'s frontend
figure has been wrong eight times. Delete the figures rather than refresh them
a ninth time, and put a guard behind the deletion so the next task cannot
reintroduce one.

## Already true before this task starts

Surveyed 2026-09-22; none of this is work for the worker.

- **`README.md` is already done** — T-062 (PR #50) removed its last count and
  `frontend/src/conventions-doc.test.ts:569-605` plus
  `frontend/src/readme-test-count.criteria.test.ts` hold it there with two
  independently written detectors. That pair is the shape to copy, and criterion
  10 says to keep both rather than fold them together.
- **`conventions.md` states no count of tests**, and its e2e journey count is
  already guarded (`conventions-doc.test.ts`, "no unstated e2e journey count").
- **A repo-level doc test already runs inside `frontend`'s `bun test`** reading
  files from the repo root. No new runner, no new package and no new dependency
  is needed to add or extend one.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

Line numbers below are as of the branch point; the quoted text is the reliable
locator once the file moves.

### The stale figures go

1. `test-guidelines.md` states no number of tests for any suite or package.
   Specifically, `:209`'s `# 19 tests today` and `:210`'s `# 65 tests today` are
   gone, and the fenced block still names both `cd question-bank && bun test`
   and `cd frontend && bun test`.

2. `PROGRESS.md`, everywhere **above** the `## Completed tasks` heading (`:260`
   today), states no number of tests for any suite, package or directory. Gone
   at minimum: `:56` "the same 221 tests", `:65-66` "221 unit and endpoint tests
   … plus 30 integration tests and 13 browser tests", `:94` "80 tests — 19 over
   the API client, 61 over level→grade/band display", `:173-177` "687 tests (19
   pre-existing, 190 added by T-010 …)", `:250` "30 black-box tests", `:255`
   "13 Playwright tests".

3. `PROGRESS.md:57`'s "with 9 Postgres-only checks that skip on SQLite" either
   states no number at all, or states a number equal to the count of test
   functions in `backend/tests/test_postgres.py`. ("Checks" rather than "tests"
   is a wording difference, not a different claim — this is the same sentence
   T-062 deleted from `README.md`.)

4. Nothing is deleted wholesale to satisfy criteria 2 and 3: after the change,
   `PROGRESS.md` still names `backend/integration/` as where the integration
   tests live, still names `e2e/` as where the browser tests live, still says the
   backend suite runs against both SQLite and Postgres, and still says the
   frontend suite covers the API client and level→grade/band display. Only the
   numbers go.

5. The table under `## A. Foundations` in `tasks.md` states no number of tests:
   its `Unit and endpoint tests`, `Integration tests` and `End-to-end tests`
   rows carry none of `242`, `184`, `687`, `30` or `13`, and each still names
   where that suite lives or how to run it.

### The guard

6. With `test-guidelines.md` edited to add a line stating a suite's test count —
   for example restoring `cd frontend      && bun test    # 223 tests today` —
   at least one test in `frontend/`'s `bun test` fails. With that edit reverted,
   the suite is green.

7. With `PROGRESS.md` edited to add a sentence stating a suite's test count
   **above** the `## Completed tasks` heading, at least one test in `frontend/`'s
   `bun test` fails — and it fails whether the number is written in digits
   ("9 tests") or in words ("nine tests"). With the edit reverted, the suite is
   green.

8. The same sentence added **below** the `## Completed tasks` heading leaves the
   suite green, and the per-task figures already under that heading are
   untouched by this task and fail nothing — T-001's "19 tests", T-010's "190
   tests were added (19 → 209)" and T-014's "200 tests" are all still there and
   still say those numbers. They are historical facts about a PR, not claims
   about the current suite.

9. The guard distinguishes "a test" from "how many tests exist": all three
   pieces of advice in `test-guidelines.md` that mention a test without claiming
   a suite size survive in some wording, with the suite green — `:162` ("Every
   criterion gets at least one test"), `:183` ("Each should turn exactly one
   test red") and `:200` ("One test, twelve assertions"). Rewording them is
   allowed; losing the advice is not.

10. No test in the repo asserts a total count of tests for any package, and the
    two existing README detectors — `testCountPattern` in
    `conventions-doc.test.ts` and `testCountClaims()` in
    `readme-test-count.criteria.test.ts` — are still two independent
    implementations rather than one shared helper. The route this task takes is
    deleting the figures, not pinning them.

11. `conventions-doc.test.ts:587-589`'s claim is true after this task:
    narrowing the README guard's scan from the whole file back to only the
    Checks code block turns at least one test in `frontend/`'s suite red. Either
    the comment is corrected to describe what the tests actually bind, or the
    scope-level test it describes now exists.

### Nothing else moves

12. `bun test`, `bun run typecheck` and `bun run lint` all pass in `frontend/`,
    and `bun test` and `bun run typecheck` pass in `question-bank/`.

13. No new dependency is added, no `bun.lock` or `uv.lock` changes, and no test
    added or changed by this task reaches the network.

## Out of scope

- **`README.md`** — T-062 already did it (criterion 10 keeps its guard intact).
- **`conventions.md`** — states no count of tests today.
- **The rest of T-047's corrections to `test-guidelines.md`** — the `api/`
  "does not exist yet" marker, the `api/` → `backend/` naming, and the missing
  `uv sync` in the dead-proxy reproduction block. Note for the reviewer: taking
  `:210`'s figure out closes the "frontend line either carries a true number or
  no number" half of T-047's done-when, so trim that clause at the sweep.
- **`backend/README.md`, `backend/integration/README.md` and `e2e/README.md`** —
  found stale by this survey (they say 221, 28 and 13) and filed as **T-074**
  rather than folded in here. Do not touch them; their prose also contains
  "one test" advice that a naive whole-file guard would fire on, which is a
  design problem worth its own task.
- **Historical counts** — everything below `PROGRESS.md`'s `## Completed tasks`
  heading, the `runs/` logs, `engineering-decisions.md`, `process-decisions.md`
  and `process.md`. They describe what a PR did, which does not rot.
- **A guard over the whole of `tasks.md`.** The queue legitimately quotes
  historical counts in entry prose (§G's T-052 and T-054 entries, and T-065's own
  entry, which the reviewer deletes at the sweep). Criterion 5 is a one-time
  removal from one table, not a scan of the file.
- **Deleting or rewriting the T-065 entry in `tasks.md`** — that is the
  reviewer's sweep, in this same PR, after the tester has passed.
- **Counts of things that are not tests** — "26 questions", "15 states", "six
  jobs on every PR", "the four unit test steps". This task is about counts of
  tests only.
- **Loop-gated files** — `process.md`, `process-decisions.md`, `CLAUDE.md`,
  `.claude/`. They quote "19 tests" historically and are not this task's to edit.

## Constraints

- **Files expected to change:** `test-guidelines.md`, `PROGRESS.md`, `tasks.md`
  (the §A table only), and `frontend/src/conventions-doc.test.ts` and/or a new
  `frontend/src/*.test.ts`. Nothing under `backend/`, `question-bank/`, `e2e/`
  or `.github/`.
- **Invariants:** the guard runs inside `frontend/`'s existing `bun test` and
  reads local files only — no network (`test-guidelines.md`, "No network in
  tests, ever"), no new runner, no new CI job.
- **Dependencies:** none without asking (see [`CLAUDE.md`](../CLAUDE.md)).
- **Do not run a suite in order to write a number into a doc.** If a figure feels
  necessary, the answer is that the figure is what this task exists to delete.
- The `Approved:` line must be filled in before the worker starts.

## Context

**Required reading for the worker and the tester.**

- **The queue entry:** [`tasks.md`](../tasks.md) T-065, including its two
  amendments (2026-09-19 by T-061's reviewer, 2026-09-22 by T-073's reviewer).
  It is where the "delete, don't refresh" decision was settled.
- **The precedent to copy:** `frontend/src/conventions-doc.test.ts:569-605`
  (`testCountPattern` and its non-vacuity test) and
  `frontend/src/readme-test-count.criteria.test.ts:1-30, 124-145`
  (`testCountClaims()`, the independent tokeniser, and the "route taken" test
  that records deletion rather than pinning). T-062, PR #50.
- **The files under test:** `test-guidelines.md:207-211`, `PROGRESS.md:40-259`
  (the `## Done` sections) and `:260` (where history starts),
  `tasks.md:109-120` (the §A table).
- **Why the boundary at `## Completed tasks` matters:** `PROGRESS.md` below that
  heading is a per-PR log; a whole-file guard would demand deleting the record of
  what every past task did.
- **How guards like this are written here:**
  [`test-guidelines.md`](../test-guidelines.md) — derive expected values from
  the criterion, not from the code; assert the detector is not vacuous.
- **`conventions.md`** — the command table, for what each package's checks are.

## Review checklist — for the parts no test can settle

The criteria above are testable. These three comment corrections are not, and a
human (or the reviewer) reads them:

- [ ] `conventions-doc.test.ts`'s header comment no longer states an ordinal or
      count of `ci.yml` parsers that is wrong. Four tracked files under
      `frontend/src/` reference `ci.yml` today — `ci-action-pinning.test.ts`,
      `conventions-doc.test.ts`, `lint-gate.test.ts` and
      `git-baseline-guard.criteria.test.ts` — so "a third parser, not a fourth"
      says nothing useful. Either name the files or make no count claim.
- [ ] `PROGRESS.md` still reads as a coherent status document with the figures
      out, rather than as sentences with holes in them.
- [ ] Whatever replaced each figure cannot rot: a command, a directory, or
      nothing — not a number in a different shape ("roughly a thousand tests").

## Handoff

_Written by `worker`._

**TL;DR:** all 13 criteria and the three review-checklist items are done. The
three stale-count figures are gone from `test-guidelines.md`, `PROGRESS.md`
(above its history) and `tasks.md`'s §A table, and a new guard
(`frontend/src/stale-suite-counts.criteria.test.ts`) fails if any of the three
states one again — verified against the real files by mutation, not just by
synthetic strings. `question-bank/` is fully green (test + typecheck).
`frontend/` lint is clean and 249/250 tests pass; the one failure plus one
typecheck error are a **pre-existing sandbox limitation** unrelated to this
task — see "What I could not verify" below, and please read it before treating
criterion 12 as unmet.

### Files changed

- **`test-guidelines.md`** — criterion 1. Removed `:209`'s `# 19 tests today`
  and `:210`'s `# 65 tests today`; both `cd ... && bun test` command lines stay.
- **`PROGRESS.md`** — criteria 2, 3, 4. Removed every suite-size figure above
  `## Completed tasks` (the six spots the brief names: `:56`, `:65-66`, `:94`,
  `:173-177`, `:250`, `:255`). Left `:57`'s "9 Postgres-only checks" as-is —
  9 already equals `backend/tests/test_postgres.py`'s real `def test_` count,
  so criterion 3's "either states no number, or one that matches" was already
  satisfied without an edit (verified by the new guard's own test, which reads
  that file rather than trusting the doc). Nothing was deleted wholesale:
  `backend/integration/`, `e2e/`, "SQLite and Postgres both supported and both
  tested" and "the API client and level→grade/band display" all still read in
  the file (criterion 4), now with directories/commands standing in for the
  numbers rather than a hole in the sentence.
- **`tasks.md`** — criterion 5. §A's three test-suite rows lost their numbers;
  each still names where the suite lives or how to run it (`make -C backend
  test`, `bun test` in `frontend/` and `question-bank/`, `backend/integration/`,
  `e2e/`).
- **`frontend/src/stale-suite-counts.criteria.test.ts`** (new) — criteria 6, 7,
  8, 9, 10. The guard behind the deletion: reads the three docs above from
  disk and fails if a digit or spelled-out number sits within a few words of
  the *plural* word "tests" anywhere in `test-guidelines.md`, or above
  `## Completed tasks` in `PROGRESS.md`. Requiring the plural is what keeps it
  off `test-guidelines.md`'s three singular "a test" advice lines (criterion 9)
  without having to reword them — "at least **one test**", "exactly **one
  test** red" and "**One test**, twelve assertions" never match a pattern that
  only looks at "tests". Also asserts: the Postgres-only count claim (criterion
  3), the four "nothing deleted wholesale" substrings (criterion 4), that the
  history below `## Completed tasks` is untouched and its own figures (T-001's
  "19 tests", T-010's "190 tests were added (19 → 209)", T-014's "200 tests")
  still read exactly as before (criterion 8), and the three stale-figure-free
  §A rows in `tasks.md` (criterion 5). It reads only these four local files —
  no network.
- **`frontend/src/conventions-doc.test.ts`** — criterion 11 and one review-
  checklist item.
  - Fixed the header comment's wrong parser count (review checklist item 1):
    it said "a third parser, not a fourth" when four tracked files under
    `frontend/src/` now parse `ci.yml` (`ci-action-pinning.test.ts`,
    `lint-gate.test.ts`, `git-baseline-guard.criteria.test.ts`, and this one).
    Named the three siblings instead of counting them, so the comment can't go
    wrong the same way again.
  - Criterion 11: the comment at `:587-589` claimed narrowing the README
    suite-size scan to just the Checks block "goes red here too" — I tried
    that mutation by hand (`readmeDoc.match(...)` → scanning only
    `codeBlock(readmeSection("## Checks"))`) and the suite stayed green,
    because `README.md` currently states no count anywhere at all (T-062), so
    a narrower scan finds the same nothing. The comment was correct in spirit
    but not literally true of the current tree. Rewrote the comment to say so
    and added the test that actually backs the whole-file claim: a synthetic
    document (not read from `readmeDoc`) with a stale count placed outside a
    synthetic Checks block, asserting the pattern still catches it there. That
    test is order-independent — see the next point.
  - While building that test I hit the same bug in the *existing* `.toMatch()`
    calls in that describe block: `testCountPattern` carries the `g` flag, and
    bun's `.toMatch()` runs it through `RegExp.prototype.test()`, which
    advances the regex's shared `lastIndex` across calls. Two `.toMatch()`
    calls on different strings, back to back, can silently make the second one
    pass (or fail) for the wrong reason depending on execution order. I did
    not touch the existing tests (they happen to pass regardless, and
    rewriting a test I wasn't asked to touch felt like scope creep), but I
    wrote my own new assertions with `.match()` instead, which resets
    `lastIndex` on every call, and left a comment explaining why. Worth a look
    for the reviewer — it's not a T-065 criterion, but it's a real latent
    fragility in a file this task touches.

### Criteria not requiring any edit

- **Criterion 3** — see above; the sentence already carried the right number.
- **Criterion 10** — nothing added pins a total count anywhere (the new guard
  only asserts absence/pattern-match, never a literal number), and
  `testCountPattern` (`conventions-doc.test.ts`) and `testCountClaims()`
  (`readme-test-count.criteria.test.ts`) are untouched as two separate
  implementations — I added a test *inside* the existing `testCountPattern`
  describe block, not a merge of the two.

### Mutation testing done (test-guidelines.md, "Verifying a task whose
deliverable is tests")

All done against the **real tracked files**, not just synthetic strings, then
reverted and diffed back to nothing (`diff` exit 0 each time):

1. Added `# 223 tests today` to `test-guidelines.md`'s `frontend` command line,
   ran `frontend`'s whole `bun test` → the new guard's "no claim survives" test
   went red (criterion 6). Reverted.
2. Added `The frontend suite now has 9 tests.` just above `## Completed tasks`
   in `PROGRESS.md` → guard test went red (criterion 7, digits). Reverted.
3. Same sentence with `nine tests` instead of `9 tests` → guard test went red
   again (criterion 7, spelled out). Reverted.
4. Same sentence moved to just *below* `## Completed tasks` → the whole
   `stale-suite-counts.criteria.test.ts` file stayed green, 25/25 (criterion
   8's boundary). Reverted.
5. Narrowed `conventions-doc.test.ts`'s README suite-size scan from `readmeDoc`
   to only the Checks block → confirmed it does *not* currently go red (see
   criterion 11 above), which is why I added a dedicated synthetic-document
   test rather than relying on that mutation alone.

### What I could not verify — a sandbox limitation, not a code defect

`frontend/`'s `bun test` and `bun run typecheck` both fail on exactly one
thing: `UsMap.tsx`'s imports of `react-simple-maps` and `us-atlas`, which
`bun install` cannot fetch in this sandbox (`403` from the proxy on those
specific packages — confirmed by running `bun install` directly, which
succeeded for `@types/bun` in `question-bank/` but hard-403'd on
`react-simple-maps`, `d3-*`, `us-atlas` and `topojson-client` in `frontend/`
every time). I confirmed this is **not caused by this task**: `git stash`-ing
every change I made and re-running `bun test` and `bun run typecheck` on the
untouched tree reproduces the identical failure (the exact module that fails
to resolve varied a little between runs as the partial install cache
changed — `react/jsx-dev-runtime` once, `react-simple-maps` on later runs —
but it was always a missing-package resolution error in `UsMap.tsx` or its
test, never anything in a file this task touches). `bun run lint` is clean.
`question-bank/`'s `bun test` and `bun run typecheck` are both fully green.

I did not touch `UsMap.tsx`, its dependencies, or any lockfile — there is
nothing in scope for T-065 to fix here, and adding or forcing a dependency
resolution isn't mine to do unilaterally either. Flagging per CLAUDE.md
"Reporting": criterion 12 is not literally 250/250 green in *this* sandbox,
and whoever runs the tester should confirm whether their environment has full
registry access; if it does, this should just disappear.

### A Sessions-table oddity worth naming

My own `$CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_01KkjXcoL82TkpiL7GbimiCh`) is
identical to the one the `task-expander` recorded for itself. I did not carry
over any of that session's reasoning — I read the brief and the repo fresh,
the way `process.md` step 3 describes — but the Sessions table can't prove
that the way it's meant to, the same caveat `process.md` names for a relayed
`orchestrator` run even though the `Approved:` line here names a person, not
`orchestrator`. Worth the tester's attention: if its own session id also comes
back `cse_01KkjXcoL82TkpiL7GbimiCh`, it should say so plainly in its Verdict
rather than claim the independence check passed, per `process.md` step 4 and
the "Two things break under a relayed run" section.

### What I deliberately did not do

- Did not reword `test-guidelines.md`'s three singular "test" advice
  lines — the plural-only pattern design makes that unnecessary, and criterion
  9 only requires the advice to survive, not that it be reworded.
- Did not touch `README.md`, `conventions.md`, `backend/README.md`,
  `backend/integration/README.md`, `e2e/README.md`, or the T-065 entry in
  `tasks.md` — all explicitly out of scope.
- Did not fold `testCountPattern` and `testCountClaims()` together, or
  compare them to each other or to the new guard — criterion 10 asks for them
  to stay separate.
- Did not update `PROGRESS.md`'s `_Last updated:_` date — not asked for by any
  criterion, and touching it would be an unreviewed editorial call outside
  what this task's Constraints list.

### How to run what I touched

```bash
cd frontend && bun test src/stale-suite-counts.criteria.test.ts
cd frontend && bun test src/conventions-doc.test.ts
cd frontend && bun test && bun run lint && bun run typecheck   # 249/250, see above
cd question-bank && bun test && bun run typecheck              # fully green
```

## Verdict

_Written by `tester`._

## Review

_Written by `reviewer`, only when it sends the PR back._

## Notes

- **The "nothing deleted wholesale" wording in criteria 3 and 4 turned out to
  already be satisfied for criterion 3** — the Postgres-only count in
  `PROGRESS.md:57` was already correct (9 matches the real test-function
  count), so the brief's "either states no number, or a number equal to..."
  was true on arrival. Worth knowing for future briefs of this shape: a survey
  that checks the actual number before assuming every occurrence needs an edit
  saves a needless change.
- **Requiring the plural "tests" (not "test(s)") turned out to be the cheap
  fix for criterion 9**, instead of rewording the three advice lines. I
  considered rewording them first (to "a test" instead of "one test") but
  that's a real content decision about phrasing in a document a person reads,
  and the plural-only pattern gets the same guarantee for free without
  touching prose that wasn't broken.
- **The sandbox's `bun install` cannot reach some packages** — `react-simple-
  maps`, the `d3-*` family, `us-atlas`, `topojson-client` all 403 from
  `europe-west1-npm.pkg.dev`'s cache in this environment, while `@types/bun`
  and the `eslint` toolchain resolved fine on a second `bun install`. This
  pre-dates T-065 (confirmed via `git stash`) and blocks a literal "250/250
  green" read of criterion 12 in this session. Filing this as a note rather
  than a new `tasks.md` entry because it's environmental, not a repo defect —
  but if the tester's environment has the same restriction, it's worth a P-n
  ticket about the sandbox's package allowlist rather than repeatedly
  rediscovering it per task.
