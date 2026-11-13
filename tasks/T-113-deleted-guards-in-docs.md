# T-113 — `tasks.md` §A and `PROGRESS.md` name guards that were deleted

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-11-13, unattended run. See `runs/T-113-deleted-guards-in-docs.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-113
**Branch:** `claude/relaxed-allen-5ro49x`
**PR:** #142, opened draft at expand time, built from the branch above. It **stays draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-13 | cse_011oDiJd2dgRHzBRDwBhvmNz |

## Goal

Three off-queue commits on 2026-11-13 cut every package's CI suite down to bank,
child-facing and API-behaviour tests. They deleted or moved out of CI most of the
guards that `tasks.md` and `PROGRESS.md` still say hold the docs and the repo in
place. Those two files are what every expander and reviewer reads first. A
status line that names a guard which no longer runs misleads them about what is
protected. This task makes those status sections name only guards that exist,
and say plainly what review alone now holds.

## What is already true, and what remains (expander's survey)

These are the commits that removed the guards:

- **`987d2cd`**: deleted 58 `question-bank/src/*.test.ts`, including
  `git-exit-guard.criteria.test.ts`, `dependency-set.test.ts`,
  `spawn-guard.test.ts`, `landmarks*.test.ts`, `climate-kid*.test.ts`,
  `state-animals.test.ts` and `region-vocabulary.test.ts`. It moved 13 to the
  monthly `*.snapshot.ts` lane. CI keeps five: `committed-bank`,
  `data-us-states`, `question-file`, `fun-facts` and `answer-position-spread`.
- **`8cf40b6`**: deleted `frontend/src/conventions-doc.test.ts`,
  `stale-suite-counts*.criteria.test.ts`, `readme-*.criteria.test.ts`,
  `prettier-writer-guard.criteria.test.ts`, `format-gate`, `lint-gate` and
  `level-window-claim`. It moved `git-baseline-guard.criteria` and
  `test-guidelines-backend.criteria` to `frontend/src/*.snapshot.ts`, which runs
  monthly and not on PRs.
- **`d594b38`**: deleted `backend/tests/test_contract.py` and six other doc and
  wording tests. It moved `test_git_revision_guard.py` to
  `snapshot_git_revision_guard.py`, which pytest skips and
  `make -C backend test-snapshots` runs monthly.

Some facts are still true and need no change. The worker may keep them as long
as it does not attribute them to a deleted guard:

- The four unit test steps still run behind the dead-proxy block (`ci.yml`
  lines 94–99 and 148–153).
- CI still runs `format:check` in both bun packages (`ci.yml` lines 66 and
  139).
- `frontend/src/ci-action-pinning.test.ts` still exists and runs in CI.
- The level-labels table is still read by `frontend/src/lib/level.test.ts` and
  `backend/tests/test_levels.py`.

The remaining work is the stale claims, enumerated in criteria 1–14. They are
all in `tasks.md` above `## B.` and in `PROGRESS.md` outside `## Completed
tasks`. Line numbers are as of `main` at `16f3c9c`.

## Acceptance criteria

The deliverable is documentation, so every criterion is checked by hand
(`process.md` step 4: no test asserts doc wording). The tester records what it
ran and what it saw for each criterion.

"**Region A**" means `tasks.md` from its first line up to the line
`## B. Finish the US entity table`. It excludes the T-113 entry itself, which
the reviewer's sweep deletes. "**Region P**" means `PROGRESS.md` minus
everything from `## Completed tasks` up to `## Known gaps in what is done`.

**Every named test file exists**

1. Every test file named in Region A or Region P exists on the branch. A test
   file here is any token matching `*.test.ts`, `*.test.tsx`, `*.snapshot.ts`,
   `test_*.py` or `snapshot_*.py`. A token with a directory must resolve at that
   path from the repo root, or from its package directory when the surrounding
   text makes clear which package it means. A bare filename must match the
   basename of some file tracked by `git ls-files`.
2. Every file named in Region A or Region P that lives in a snapshot lane
   (`*.snapshot.ts`, `backend/tests/snapshot_*.py`) is described as running
   monthly or outside CI, in the same bullet, row or sentence that names it.
   Neither file may be presented as something that fails a pull request.

**`tasks.md` Region A: the specific stale claims**

3. The §A table row for `conventions.md` (currently line 163) no longer says it
   is "held there by `frontend/src/conventions-doc.test.ts`". No other test is
   credited with that role.
4. The §A table row "Test counts in docs" (currently line 164) no longer says
   "a test fails if one comes back". It may still say the docs state no counts.
5. The §A table row for `README.md` (currently line 165) no longer says its
   claims are "under the same test since T-058", or that any test checks its job
   list, commands or test counts.
6. The paragraph under the §A table (currently lines 168–171) no longer says
   that "all three unit suites refuse a test that hands `git` a fixed revision".
   It does not name `backend/tests/test_git_revision_guard.py`.
7. The intro paragraph about `engineering-decisions.md` (currently lines 20–26)
   no longer says that assertions in `question-bank/src/region-vocabulary.test.ts`
   exist or are generalised. The instruction "Do not reintroduce a ceiling" may
   stay.

**`PROGRESS.md` Region P: the specific stale claims**

8. The **Verification and process** section under `## Known gaps in what is
   done` (currently lines 2033–2039) no longer says `conventions.md`, `README.md`
   and `test-guidelines.md` "now fail a test rather than drift".
9. The same section's git-guard bullet (currently lines 2040–2058) no longer
   presents `question-bank/src/git-exit-guard.criteria.test.ts` as existing. It
   no longer says that guards "hold the line" in CI. If it still names the
   frontend and backend git guards, it does so under criterion 2's rule.
10. The **Repo and process** section under `## Done` (currently lines 244–260)
    no longer credits `frontend/src/conventions-doc.test.ts` or
    `frontend/src/stale-suite-counts.criteria.test.ts` with checking
    `conventions.md`, `README.md`, or suite sizes in docs. It no longer says a
    stale doc "now fails a test".
11. The **Question bank** section under `## Done` no longer names the following
    as tests that exist or are asserted:
    - `src/dependency-set.test.ts` (currently line 137);
    - `spawn-guard.test.ts`, "asserted" exactly one `127.0.0.1:1`, and "all six
      suites" importing `offline-rebuild.ts` (currently lines 207–214);
    - the deleted per-field test files in the "Tests cover the built bank"
      bullet (currently lines 230–236).

    Bank tests that still exist may stay named.
12. The **Backend** section under `## Done` (currently line 66) no longer
    says there are "contract tests that walk `openapi.yaml` in both directions".
13. The **Frontend** section under `## Done` (currently lines 120–121) no longer
    says "the tests that run the writer refuse to start it unless the pinned
    prettier is installed (T-107)". The T-109 script-level refusal may stay if it
    is still true of `frontend/package.json` and `question-bank/package.json`.

**Saying plainly what review alone holds**

14. Region A or Region P (at least one, in a status section rather than the
    history) states that no CI test checks the repo's root `README.md`,
    `conventions.md` or `test-guidelines.md` against the repo's layout,
    commands, CI jobs or test counts. It says those docs are now kept true by
    review. It may mention the narrow single-line check
    `backend/tests/test_t040_tester_criteria.py::test_c28_conventions_layout_names_the_archive`.
    It must not describe that check as covering `conventions.md` as a whole.

**What must not change**

15. The worker's commits change no line of `PROGRESS.md` between
    `## Completed tasks` and `## Known gaps in what is done`. That history
    records what each PR did at the time, and it stays as it is.
16. The worker's commits touch only `tasks.md`, `PROGRESS.md` and this brief.
    No source, test, snapshot, workflow, `conventions.md`, `README.md`,
    `test-guidelines.md`, `CLAUDE.md`, `process*.md` or
    `engineering-decisions.md` changes.
17. No sentence the worker adds or rewrites names a test, guard or CI step that
    does not exist on the branch. This is criterion 1 applied to prose that
    describes a guard without naming its file, such as "asserted", "a test
    fails if" or "CI refuses". Each such claim the worker writes must point at
    something the tester can find.
18. The worker removes or rewrites no fact in Region A or Region P that is still
    true and was not tied to a deleted guard. Examples are the dead-proxy row
    and the "Formatting" row's claim that CI runs `format:check` in both bun
    packages. Changing such a fact's attribution is fine.

## Out of scope

- **`## Completed tasks` history in `PROGRESS.md`.** It names many deleted tests
  as they were when each PR landed, and stays as it is (criterion 15).
- **Other stale `PROGRESS.md` facts that are not about guards.** For example,
  "Five agents in `.claude/agents/`" (there are six), and the `run-loop.sh`
  driver that D-19 removed. The worker or reviewer may queue a follow-up. This
  task does not fix them.
- **"`E-12` is next" in `tasks.md`'s intro paragraph**, which is stale because
  `E-31` exists. The worker may correct it while rewriting that sentence for
  criterion 7, but it is not required.
- **"T-113 is the one open §A task" (`tasks.md` line 171).** The reviewer's
  sweep handles this when it deletes T-113.
- **Restoring any deleted guard, or adding a new one.** Dkaattae cut those on
  purpose (`8cf40b6`, `d594b38`, `987d2cd`). This task only makes the docs say
  so.
- **`conventions.md`, `README.md`, `test-guidelines.md`, `backend/README.md`.**
  `backend/README.md`'s Known gaps belong to T-112.
- **`CLAUDE.md`'s `api/` lines.** They are P-19, handled by hand.

## Constraints

- Files expected to change: `tasks.md`, `PROGRESS.md`, and this brief's
  Handoff. Nothing else (criterion 16).
- No dependency, no test, and no snapshot-lane file is added, modified or
  re-pinned.
- Keep the edits small. Fix the claim and keep the row or bullet. Delete a
  bullet only when nothing true is left in it.
- Write plain present-tense prose. Point to commits by short SHA (`8cf40b6`,
  `d594b38`, `987d2cd`) where saying "since X" helps.

## Context

Read these before starting. The worker and the tester both need them.

- `tasks.md` lines 1–176 (Region A) and the T-113 entry at line 173.
- `PROGRESS.md` `## Done` (lines 41–334) and `## Known gaps in what is done`
  through the end (lines 1978 to the end).
- `test-guidelines.md`, the rules at the top and lines 29–57: what each
  package's CI suite now holds and what the snapshot lane is.
- `conventions.md` lines 60–92: the `test:snapshots` and `test-snapshots`
  commands.
- `.github/workflows/ci.yml`, for which steps exist (Format, the proxy block).
  `.github/workflows/snapshot-tests.yml` is the monthly lane.
- `git show --stat 987d2cd 8cf40b6 d594b38` lists every file deleted or moved.
- `git ls-files | grep -E '\.(test|snapshot)\.tsx?$|/(test|snapshot)_[a-z0-9_]+\.py$'`
  is the current set of test files, for criterion 1.
- `backend/tests/test_t040_tester_criteria.py` `test_c28_…` is the one
  remaining CI test that reads `conventions.md` (criterion 14).

## Review checklist — non-testable tasks only

The tester checks each item by hand and records the result in its Verdict:

- [ ] Criterion 1: run the token scan from Context over Region A and Region P
      and check each hit against `git ls-files`. Expect zero missing.
- [ ] Criteria 3–13: read each named location. The quoted stale phrase is gone
      or rewritten, and the rewritten text is true.
- [ ] Criterion 14: the review-alone sentence exists and is accurate.
- [ ] Criteria 15–16: `git diff origin/main...HEAD --stat` shows only the
      allowed files. A diff of `PROGRESS.md` restricted to the Completed-tasks
      span is empty.
- [ ] Criteria 17–18: read every changed hunk.
- [ ] A person reads the rewritten bullets for tone before merge. This is not
      child-facing text, but it is what the next session reads first.

## Handoff

## Verdict

## Notes
