# T-061 — One rule, one implementation: collapse the duplicated CI-workflow guards

**Status:** `awaiting approval`
**Next step:** `human` — the brief, branch, and draft PR are all in place; the
only remaining gate is a person replacing `Approved: pending` below, which no
session may do on its own; then `worker`.
**Approved:** `pending` — replace with who approved and the date, e.g. `Kate, 2026-09-19`
**From:** [`tasks.md`](../tasks.md) T-061
**Branch:** `claude/next-task-queue-ncef5o` — the branch this session was assigned
(`process.md`, "When the environment names the branch for you"). It is what the
PR must be built from; every later role pushes here, not to `task/T-061-…`.
**PR:** [#52](https://github.com/Dkaattae/geo-discovery-zone/pull/52) — draft,
opened via the GitHub MCP tools from the driving session, which had them where
the `task-expander` subprocess (see Fault) did not.
**Fault:** mechanical, not editorial, and owned by the environment rather than by
a role: `task-expander` ran under `claude -p` inside `run-loop.sh`, and every git
write in that subprocess — `git add`, `git commit`, `git push`, in every spelling
tried — came back "This command requires approval" (the workspace trust dialog
has not been accepted for unattended `claude` invocations here), with no human
to grant it mid-run. `run-loop.sh`'s own checkpoint step committed and pushed the
brief from the trusted outer session immediately after
(`db5230f`), and the PR above was opened the same way. No criterion, code or
brief content was affected — only who ran the git commands.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-19 | 921a9e53-8904-4fdc-bdc3-fb344de313af |

## Goal

Four rules in the `frontend/` suite are each written twice, so changing one means
changing both or the suite quietly contradicts itself — and one of the duplicates
pins `ci.yml` to exactly thirteen `uses:` references, which fires on any
legitimately added CI step and reads as "you added a step". Leave each rule with
one implementation that still goes red for the right reasons.

## Survey — what is already true (2026-09-19)

Read this before writing code; several criteria below are already satisfied and
the work is to keep them satisfied while the duplicates go.

- **Pair 1 — E-5's pinning rule.** `frontend/src/ci-workflow-pins.test.ts`
  (`isPinnedCategory()`, line 59, 4 tests) and
  `frontend/src/ci-action-pinning.test.ts` (the `pinned` branch of
  `violations()`, line 74, 12 tests). The second is a behavioural superset: exact
  action-set equality (line 98) rather than `toContain`, lowercase hex required
  (line 37), a trailing comment that must name a release (line 40), and a
  `describe` block of synthetic fragments (lines 139–181) that already proves
  every "goes red" case in criteria 2 and 3 below against strings rather than
  against `ci.yml` itself.
- **The count literal** is `ci-action-pinning.test.ts:106–107`:
  `expect(references(CI_YML).length).toBe(13)` *and* the raw `uses:`-line count
  `.toBe(13)`. The second line already computes the number the first should be
  compared against.
- **Pair 2 — the lockfile-attribution lookup.** `jobsDocClaimsCheckLockfile()`
  (`conventions-doc.test.ts:589`) and `jobsCreditedByDoc()` (line 692) are the
  same five lines, one `describe` block apart.
- **Pair 3 — the backticked-run extraction.** `longestBacktickRun()` (line 443)
  was factored out for README's job list, but criterion 10's test still carries
  an inline copy of the same regex at lines 357–360.
- **Pair 4 — the test-count detector.** `testCountPattern`
  (`conventions-doc.test.ts:565`, a phrase regex) and `testCountClaims()`
  (`readme-test-count.criteria.test.ts:67`, a tokeniser). **This pair may be
  worth keeping** — the second was written deliberately as an independent
  implementation so it could disagree with the guard beside it, and says so at
  lines 17–20. What the duplication does not buy today: nothing compares the two,
  and `readme-test-count.criteria.test.ts:134` gives only the tokeniser a
  not-vacuous test, so narrowing `testCountPattern` back to the Checks code block
  leaves every test in both files green.
- **Not in this pair set, and not to be folded in:** `conventions-doc.test.ts`
  reads `ci.yml` for doc claims rather than for E-5, and
  `frontend/src/lint-gate.test.ts:143–152` reads it for the lint step. Both stay.
- `PROGRESS.md:245` names `frontend/src/ci-action-pinning.test.ts` as the live
  guard for E-5. `conventions-doc.test.ts:11–13` names both files of pair 1 as
  existing. `PROGRESS.md:653` and `runs/T-008-pin-ci-actions.md` describe them
  historically and are records of what happened, not claims about today.

## Acceptance criteria

Frozen once approved. "Goes red" throughout means `bun test` in `frontend/` exits
non-zero; the mutation is applied one at a time and reverted before the next.
A mutation may be demonstrated either by editing the real file and reverting, or
by passing a synthetic string to the same checker the suite uses — both are
acceptable evidence.

1. **E-5's rule has one implementation.** Exactly one file under `frontend/src/`
   decides, from a `uses:` reference's owner, whether that reference must be
   pinned to a commit SHA. Concretely: exactly one of
   `frontend/src/ci-workflow-pins.test.ts` and
   `frontend/src/ci-action-pinning.test.ts` exists after this task, and no other
   file under `frontend/src/` branches on an action owner being `actions` for
   pinning purposes. (`conventions-doc.test.ts` and `lint-gate.test.ts` read
   `ci.yml` for other claims; neither is in scope and neither counts.)

2. **Third-party pins stay enforced.** Each of these, applied alone to
   `oven-sh/setup-bun`'s reference, goes red:
   - the SHA replaced by the major tag `v2`;
   - the trailing `# v2.2.0` comment deleted, SHA kept;
   - the trailing comment replaced by `# pinned`;
   - the SHA truncated to its first 12 characters, comment kept;
   - the SHA uppercased, comment kept.

3. **`actions/*` keeps both sides of its boundary.** `actions/checkout@main`,
   `actions/checkout@master` and `actions/upload-artifact@latest` each go red;
   `actions/checkout@v5` stays green, and so does `actions/checkout` pinned to a
   lowercase 40-hex SHA with a `# v5.1.0` comment — pinning tighter than the rule
   requires is never punished.

4. **A vanished action is noticed.** Deleting every `uses:` line for
   `astral-sh/setup-uv` from `ci.yml` goes red. (This is the behaviour the
   deleted file's `toContain` assertions carried; it must not be lost with them.)

5. **No literal workflow size survives.** No test under `frontend/src/` asserts a
   specific number of `uses:` references, steps or lines in `ci.yml`, and adding
   one further step — `- uses: actions/checkout@v5`, inside a job that already
   exists — leaves the whole `frontend/` suite green.

6. **Parser coverage survives without the literal.** Replacing one `uses:` line
   with a value the checker cannot decompose into `owner/repo@ref` — for example
   `- uses: docker://alpine:3` — goes red rather than passing silently as one
   fewer parsed reference.

7. **A new action still stops the suite.** Adding
   `- uses: docker/login-action@<40 lowercase hex> # v3.0.0` to `ci.yml` goes
   red, and the failure output names `docker/login-action` rather than reporting
   a count mismatch.

8. **The lockfile-sentence lookup exists once.** `conventions-doc.test.ts`
   contains exactly one function that finds the sentence in `conventions.md`'s
   `## CI` section matching `/lockfile did not move/i` and extracts its backticked
   tokens.

9. **Lockfile attribution still binds, both ways round.** Adding
   `backend-postgres` to that sentence in `conventions.md` goes red, and deleting
   the `git diff --exit-code … bun.lock` step from a job the sentence credits also
   goes red.

10. **The backticked-run extraction exists once, and both job-list claims still
    bind.** The regex that collects a run of adjacent backticked tokens appears
    once under `frontend/src/`; deleting one job name from `conventions.md`'s
    `## CI` job list goes red; deleting one job name from `README.md`'s
    `## Checks` CI sentence goes red.

11. **The test-count detector pair is settled on purpose, and the survivor cannot
    be narrowed silently.** A comment in the file or files concerned states
    whether the two implementations are kept or folded into one, names T-061, and
    gives the reason. Whichever route: narrowing any surviving detector so that it
    no longer reports `The nine Postgres-only tests skip on SQLite` as a
    count-of-tests claim goes red. (Today that holds for
    `readme-test-count.criteria.test.ts` and not for `conventions-doc.test.ts`.)

12. **Nothing in the repo names a test file that is gone.** Every
    `frontend/src/*.test.ts` path named in `PROGRESS.md`'s "Done" prose, in
    `conventions.md`, in `README.md` or in a surviving test file's header comment
    exists on disk. Historical records — `PROGRESS.md`'s "Completed tasks"
    entries and `runs/` — are exempt and must not be rewritten.

13. **The change stays inside the test suite.** The committed diff touches only
    files under `frontend/src/`, plus `PROGRESS.md` and the brief; in particular
    `.github/workflows/ci.yml`, `README.md`, `conventions.md`,
    `engineering-decisions.md` and every `package.json` are byte-identical to
    their state on the default branch. No dependency is added, no test reaches the
    network, no test leaves a tracked file modified after the run, and
    `bun test`, `bun run typecheck` and `bun run lint` all pass in `frontend/`.

## Out of scope

- **Changing E-5 itself**, or which actions are pinned. The rule is settled; this
  task changes only how many places assert it. E-5's prose says "13 `uses:`
  references" as a dated record of 2026-09-04 — leave it alone.
- **`question-bank`'s `lint`** — there is no such script and asking for one is
  T-066's open decision. Do not run it, do not add it, do not write it into a
  criterion.
- **`conventions-doc.test.ts`'s `ci.yml` parsing as a whole.** It is a third
  parser on purpose (T-058 argued against adding a fourth); only its *internal*
  duplicates — criteria 8 and 10 — are in scope.
- **`frontend/src/lint-gate.test.ts`**, which reads `ci.yml` for the lint step.
- **Refreshing suite-size counts elsewhere.** `tasks.md`'s §A table says "184
  frontend"; deleting tests will make it stale. T-065 owns those counts. Do not
  add a test that pins a suite size.
- **Enabling Dependabot** (T-060) and **prettier drift** (T-071).

## Constraints

- Files expected to change: `frontend/src/ci-action-pinning.test.ts`,
  `frontend/src/ci-workflow-pins.test.ts` (one of the two is deleted),
  `frontend/src/conventions-doc.test.ts`,
  `frontend/src/readme-test-count.criteria.test.ts`, and `PROGRESS.md` if
  criterion 12 requires it.
- Invariants: every behaviour the deleted file asserted is still asserted
  somewhere (criteria 2–4 are the enumeration of that); no rule in the
  `frontend/` suite has two implementations of itself afterwards, except a pair
  criterion 11 explicitly decides to keep, with the reason written down.
- No new dependency and no new test runner — `bun test` in `frontend/` already
  runs repo-root assertions from `frontend/src/` and that is where these stay
  (`CLAUDE.md` "Packages": ask first, always).
- No network in any test (`test-guidelines.md`, "No network in tests, ever").
  The tag → SHA correspondence is never looked up at test time; SHAs in synthetic
  fragments are literals.
- Deleting a file is preferred to leaving it as a stub that imports from its
  replacement.

## Context

Required reading, not background.

- **The rule:** [`engineering-decisions.md`](../engineering-decisions.md) **E-5**
  — the owner-not-action split, why `actions/*` stays on tags, and the revisit
  trigger.
- **The queue entry:** [`tasks.md`](../tasks.md) T-061, including its two
  widenings (T-058's reviewer, PR #35; T-062's reviewer, PR #50) and the caveat
  on pair 4.
- **The files:** `frontend/src/ci-workflow-pins.test.ts` (whole, 97 lines),
  `frontend/src/ci-action-pinning.test.ts` (whole, 190 lines),
  `frontend/src/conventions-doc.test.ts` lines 326–364 (criterion 10 and its
  inline regex), 436–479 (the shared helpers), 554–573 (`testCountPattern`),
  588–613 and 688–723 (the lockfile pair),
  `frontend/src/readme-test-count.criteria.test.ts` lines 5–24 (why the second
  detector exists) and 61–137.
- **What the guards read:** `.github/workflows/ci.yml`, `conventions.md` §CI,
  `README.md` §Checks.
- **How tests are written here:** [`test-guidelines.md`](../test-guidelines.md) —
  in particular that a test which stays green while its subject is broken is not
  a test, which is the whole argument for criteria 2–4, 9, 10 and 11.
- **Precedent for dropping a literal count:** T-058 (PR #35) removed
  `conventions.md`'s "thirteen"; T-062 (PR #50) removed README's test count.
  `PROGRESS.md` line 304 records the second.

## Handoff

Written by `worker` before the tester runs.

## Verdict

Written by `tester`.

## Notes

### For the human who lands this brief (expander, 2026-09-19)

The brief and the two `tasks.md` edits are in the working tree, unstaged and
uncommitted, because this session has no git write permission. To land them:

```
git add tasks/T-061-dedupe-e5-guards.md tasks.md
git commit -m "T-061 expander: dedupe-e5-guards"
git push -u origin claude/next-task-queue-ncef5o
```

Commit message body to append, per the session's attribution rules:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FRfWBXHjMiyzdKKrJMYh6j
```

Then open a **draft** PR against `claude/next-task-queue-ncef5o`:

- **Title:** `T-061 — one rule, one implementation: collapse the duplicated CI-workflow guards`
- **Body:** the Goal, Survey and Acceptance criteria sections of this file
  verbatim, then:

  > Draft until the reviewer approves. Approve the criteria on this PR before any
  > code is written (`process.md` step 2), and record it by replacing `pending` on
  > the brief's `Approved:` line.
  >
  > 🤖 Generated with [Claude Code](https://claude.com/claude-code)
  >
  > https://claude.ai/code/session_01FRfWBXHjMiyzdKKrJMYh6j

Once the `Approved:` line names a person and a date, set `Next step: worker`.
