# T-113 — `tasks.md` §A and `PROGRESS.md` name guards that were deleted

**Status:** `ci fix requested`
**Next step:** `human`
**Approved:** orchestrator — 2026-11-13, unattended run. See `runs/T-113-deleted-guards-in-docs.md`.
**Test changes:** `none`
**CI fix:** `requested`
**From:** [`tasks.md`](../tasks.md) T-113
**Branch:** `claude/relaxed-allen-5ro49x`
**PR:** #142, opened draft at expand time, built from the branch above. It **stays draft** until the reviewer approves it
**Fault:** the worker's "the one CI test that still reads `conventions.md`" sentence (`tasks.md`, `PROGRESS.md`) is false because `question-bank/src/committed-bank.test.ts` also reads it in CI; a two-row doc-only CI fix plan is waiting for approval.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-13 | cse_011oDiJd2dgRHzBRDwBhvmNz |
| worker | 2026-11-13 | cse_011oDiJd2dgRHzBRDwBhvmNz |
| tester | 2026-11-13 | cse_011oDiJd2dgRHzBRDwBhvmNz (orchestrated: same id as every spawned role; see Verdict) |
| ci-fix | 2026-11-13 | cse_011oDiJd2dgRHzBRDwBhvmNz (orchestrated: same id as every spawned role; see CI fix plan) |

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

**TL;DR: docs only. `tasks.md` Region A and `PROGRESS.md` Region P now name only test files that exist, and say that review alone keeps the root `README.md`, `conventions.md` and `test-guidelines.md` true.** The token scan finds zero missing files. Both bun suites, typecheck, lint, format and the backend suite pass. The 4 frontend reds are not from this change: the frontend packages could not be installed (proxy 403). The tester should verify by hand per the checklist.

**Files changed**

- `tasks.md`: the intro paragraph, three §A table rows and the paragraph under the table.
- `PROGRESS.md`: `## Done` (Backend, Frontend, Question bank, Repo and process) and `## Known gaps` (region vocabulary, Verification and process). No line between `## Completed tasks` and `## Known gaps in what is done` changed. `git diff origin/main -- PROGRESS.md` hunks start at lines 63, 117, 133, 202, 230, 241, 2023 and 2035.
- This brief.

**Where each criterion lives now**

| # | Where | What it says now |
|---|---|---|
| 1 | both regions | Tokens that resolve: `answer-position-spread.test.ts`, `committed-bank.test.ts`, `data-us-states.test.ts`, `fun-facts.test.ts`, `question-file.test.ts`, `frontend/src/ci-action-pinning.test.ts`, `frontend/src/git-baseline-guard.criteria.snapshot.ts`, `backend/tests/snapshot_git_revision_guard.py`, `backend/tests/test_region_vocabulary.py`, `backend/tests/test_t040_tester_criteria.py` |
| 2 | `tasks.md` paragraph under the §A table; `PROGRESS.md` Known gaps git-guard bullet | Each snapshot file is called "monthly snapshot lane, not CI" or "run only monthly, outside CI", in the sentence or sub-bullet that names it |
| 3 | §A `conventions.md` row | "Since `8cf40b6` no test checks it … review keeps it true" |
| 4 | §A "Test counts in docs" row | Counts were taken out of the docs. No test checks this since `8cf40b6`, and `test-guidelines.md` again states `question-bank/`'s file counts |
| 5 | §A `README.md` row | No test checks its job list, commands or test counts since `8cf40b6` |
| 6 | paragraph under the §A table | No CI unit suite refuses a fixed `git` revision any more. Names only the two snapshot files |
| 7 | `tasks.md` intro paragraph | The `region-vocabulary.test.ts` clause is gone. "Do not reintroduce a ceiling" stays. `E-12` corrected to `E-32` (optional per Out of scope) |
| 8 | `PROGRESS.md` Verification and process, first bullet | The docs "were fixed, but no CI test holds them since `8cf40b6` and `d594b38`: review alone keeps them from drifting" |
| 9 | same section, git-guard bullet | The question-bank guard is gone ("`987d2cd` deleted question-bank's git guard"). "hold the line" is replaced by "No CI suite guards this any more" |
| 10 | Repo and process, two bullets | Rewritten to "kept true by review, not by a test" and "were cleared of suite sizes … no test fails if a count comes back" |
| 11 | Question bank: lines 136–137, the offline-rebuild bullet, "Tests cover the built bank" | `dependency-set` is replaced by "no test pins". The `spawn-guard`/"asserted" clauses are replaced by "no test checks". "all six suites" becomes `committed-bank.test.ts`. The per-field files are replaced by the five CI files |
| 12 | Backend bullet | `d594b38` deleted the tests that walked `openapi.yaml`, which is now kept in step by hand (E-14) |
| 13 | Frontend Formatting bullet | The T-107 clause is gone. The T-109 clause stays: both `package.json` `format`/`format:check` scripts run `prettier-pin-guard.ts` first |
| 14 | `tasks.md` paragraph under the §A table (bold sentence), and `PROGRESS.md` Repo and process | States that no CI test checks the three docs and that review keeps them true. Names `test_c28_…` as checking "a single line, the Layout's `archive/` row" |
| 15–16 | `git diff origin/main --stat` | `PROGRESS.md`, `tasks.md` and this brief only |
| 17 | every new claim | Every test my new prose names exists. "No test …" claims are negatives backed by the three commits |
| 18 | kept | Dead-proxy rows, Formatting row (CI runs `format:check`), `ci-action-pinning`, the level-labels table and the "tracked-file reading route" sentence are untouched |

**Beyond the enumerated criteria (goal-driven, small)**

- **Region vocabulary bullet in Known gaps** (`PROGRESS.md` ~2025): it said the closed set was "enforced by a closed-set test over the curated table, the built bank and `content.json`". That test (`region-vocabulary.test.ts`) was deleted in `987d2cd`. It now credits `backend/tests/test_region_vocabulary.py` with `content.json` and the served API (its tests `test_no_region_in_content_json_is_outside_the_thirteen` and `test_no_region_the_api_serves_is_outside_the_thirteen`), and says the curated/built-bank check was deleted. Reviewer to confirm, or revert if it is read as outside the goal.

**Deliberately not done**

- `## Completed tasks` history: untouched (criterion 15).
- "Five agents", `run-loop.sh` and other non-guard staleness: out of scope. Not queued by me. Reviewer to decide whether to queue them.
- "No test fails on `main` in a full clone any more" (Known gaps git bullet heading): left as it is. It is a fact about the expired baselines, not a guard. I did not run the snapshot lane to re-prove it. Tester or reviewer to decide whether it should become "No CI test …".

**Contradicts the brief**

- Criterion 4 says the row "may still say the docs state no counts". That is no longer true of `test-guidelines.md`: lines 29–30 now say "the five `*.test.ts` files" and "The 13 older `*.snapshot.ts` files" (added by `987d2cd`). So the row and the `PROGRESS.md` bullet say the counts were taken out and that `test-guidelines.md` states them again. This satisfies criterion 4 and avoids a false claim under 17. Reviewer to confirm. Whether `test-guidelines.md` should drop those counts is Dkaattae's call: he wrote them, and that doc is out of scope here.

**How to run what I touched**

- Token scan (criterion 1). Build Region A without the T-113 entry and Region P without Completed tasks, then grep `[A-Za-z0-9_./*-]*(\.test\.tsx?|\.snapshot\.ts|test_[a-z0-9_]+\.py|snapshot_[a-z0-9_]+\.py)` and check each hit against `git ls-files`.
- Suites, as I ran them on this branch:
  - `make -C backend check`: 809 passed, 9 skipped.
  - `make -C backend test`: 809 passed, 9 skipped.
  - `cd question-bank && bun run typecheck && bun run lint && bun run format:check && bun test`: 229 pass, 0 fail.
  - `cd frontend && bun run lint && bun run format:check`: clean.
  - `cd frontend && bun run typecheck` / `bun test`: **red, environmental**. `bun install --frozen-lockfile` fails with `ProxyConnectFailed (403)` on `europe-west1-npm.pkg.dev` tarballs (policy denial, not retried). So `react-simple-maps` and `us-atlas` are missing, and 4 files fail to load: `screens.criteria.test.tsx`, `t026-setup.criteria.test.tsx`, `t051-map-click.test.tsx`, `t051-tester.criteria.test.tsx`. This change touches no code, so these cannot come from it. The tester should rerun them where the registry is reachable.

**Tests made stale:** none.

## Verdict

**Fail: one false guard claim, in two places.** Criteria 1–13 and 15–18 hold, checked by hand. Criterion 14 does not. The new sentence "The one CI test that still reads `conventions.md` checks a single line" is false, because `question-bank/src/committed-bank.test.ts` reads `conventions.md` in CI too. **Next: `ci-fix`**, a doc-only rewording of `tasks.md:169-171` and `PROGRESS.md:247-249`.

**Independence.** This is an orchestrated run (`runs/T-113-deleted-guards-in-docs.md` exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJd2dgRHzBRDwBhvmNz`, the same id the expander and worker rows carry. That says nothing either way. My independence rests only on being a freshly spawned agent with its own context, which did not see the work or the worker's reasoning. That is weaker than a separate session, because it depends on the orchestrator having spawned me correctly.

**The failure (criterion 14, read with 17 and the checklist's "exists and is accurate")**

- **Where:** `tasks.md` lines 169–171 and `PROGRESS.md` lines 247–249. Both say: "The one CI test that still reads `conventions.md` checks a single line, the Layout's `archive/` row (`backend/tests/test_t040_tester_criteria.py::test_c28_…`)".
- **Observed:** `question-bank/src/committed-bank.test.ts` is one of the five CI files. Its `describe("T-010 criteria 11–16 — the rules and the docs say the same thing")` reads `conventions.md` in two tests:
  - `criterion 11 — no shipped file still asserts the bank is not stored in git` (line ~236) checks that a phrase is absent from it.
  - `criterion 15 — README and conventions say a fresh clone already has the bank` (line ~268) asserts that `conventions.md` matches `/committed/` and `/data\/us-states/`.
- **How to reproduce:** `grep -n 'conventions.md' question-bank/src/committed-bank.test.ts` gives lines 241, 271 and 272. The tests are green (`cd question-bank && bun test`).
- **Expected:** the review-alone statement is accurate. It may name `test_c28_…` as a narrow check (criterion 14), but it must not call it the only CI test that reads `conventions.md`. A fix that keeps the statement true names both narrow checks, or drops the "the one" claim. The fix must also keep criterion 14's main sentence true: committed-bank's criterion 15 pins one fact in `conventions.md`, that the bank is committed under `data/us-states`. Saying "no CI test checks it as a whole" stays true. A flat "no CI test checks it against the repo's layout" should be qualified by that one fact.
- **Origin:** the brief's own Context says `test_c28_…` "is the one remaining CI test that reads `conventions.md`". The worker repeated a wrong survey fact. The criteria themselves are fine, so this is a `fail` (fixable in prose), not `blocked`.

**Criteria, checked by hand (no test committed: doc-only deliverable, `test-guidelines.md`)**

| # | Verdict | What I ran / saw |
|---|---|---|
| 1 | met | Built Region A (`tasks.md` 1–177, before the T-113 entry) and Region P (`PROGRESS.md` minus lines 331–1973) and grepped for test-file tokens. Hits: 3 in A, 10 in P. All resolve: `git ls-files --error-unmatch` for each path, and a basename match in `question-bank/src/` for the five bare names. Zero missing |
| 2 | met | `git-baseline-guard.criteria.snapshot.ts` and `snapshot_git_revision_guard.py` are each called "monthly … outside CI" / "monthly snapshot lane, not CI" in their naming sentence or sub-bullet. `snapshot-tests.yml` cron is `17 6 1 * *` (monthly) |
| 3 | met | The `conventions.md` row credits no test: "Since `8cf40b6` no test checks it … review keeps it true" |
| 4 | met | "a test fails if one comes back" is gone. The "test-guidelines.md again states counts" claim is true (`test-guidelines.md:29-30`: "the five `*.test.ts` files", "The 13 older `*.snapshot.ts` files") |
| 5 | met | The `README.md` row no longer claims a test. No CI test file references the root `README.md` (grep over tracked `*.test.ts(x)` / `test_*.py`) |
| 6 | met | The paragraph says no CI unit suite refuses a fixed revision, and does not name `test_git_revision_guard.py` |
| 7 | met | The `region-vocabulary.test.ts` clause is gone. "Do not reintroduce a ceiling" stays. `E-32` is next, which is correct (the highest is `## E-31`) |
| 8 | met | "were fixed, but no CI test holds them … review alone keeps them from drifting" |
| 9 | met | The question-bank guard is described as deleted, without its filename. "hold the line" is gone. The two remaining guards follow criterion 2 |
| 10 | met | Neither deleted frontend test is named. "now fails a test" is gone |
| 11 | met | `dependency-set`, `spawn-guard`, "asserted" `127.0.0.1:1` and "all six suites" are gone. `committed-bank.test.ts` is the only CI importer of `offline-rebuild.ts` (grep: the other importers are all `*.snapshot.ts`). The per-field list is replaced by the five CI files. `987d2cd`'s `--stat` confirms each deletion |
| 12 | met (advisory) | "contract tests … both directions" is gone, and `d594b38` did delete `test_contract.py`. **Advisory:** "kept in step by hand" matches E-14 and `test-guidelines.md`, but CI still checks response shapes against `openapi.yaml`'s schemas through `backend/tests/conftest.py::assert_matches` (used e.g. by `test_content_api.py`). The reviewer may want "by hand" qualified. I did not count this as a failure because the sentence restates the repo's stated policy |
| 13 | met | The T-107 clause is gone. T-109 is true: both `package.json` `format`/`format:check` scripts run `prettier-pin-guard.ts` first |
| 14 | **not met** | The statement exists in both regions and does not call `test_c28` whole-file coverage, but its "the one CI test that still reads `conventions.md`" is false (above) |
| 15 | met | I extracted the `## Completed tasks` → `## Known gaps in what is done` span from `origin/main` and from `HEAD` and ran `diff`: identical (1643 lines) |
| 16 | met | `git show --name-only a443e7c` (the worker's commit) lists `PROGRESS.md`, `tasks.md` and the brief only. The branch diff also has `runs/T-113-…`, which is the orchestrator's |
| 17 | not met, for the same sentence | The other new claims check out: region-vocabulary (`test_no_region_in_content_json_is_outside_the_thirteen` and `test_no_region_the_api_serves_is_outside_the_thirteen` exist, and `region-vocabulary.test.ts` was deleted in `987d2cd`), the format scripts, the offline-rebuild importer and the git-guard deletions |
| 18 | met | The dead-proxy row, the Formatting row (CI `format:check` in both packages), `ci-action-pinning`, the level-labels table and "tracked-file reading route" are unchanged |

**Suite, as run on this branch at `a9e98bc`**

- `question-bank`: `bun run typecheck && bun run lint && bun run format:check && bun test` gives 229 pass, 0 fail.
- `backend`: `make check` gives 809 passed, 9 skipped.
- `frontend`: lint and `format:check` are clean. **Typecheck and `bun test` are red here for environmental reasons:** `bun install --frozen-lockfile` gets `ProxyConnectFailed (403)` on tarballs, so `react-simple-maps` and `us-atlas` are missing (TS2307), and the 4 files that import them fail to load. **GitHub CI on `a9e98bc` is all green**, including `frontend (typecheck, lint, test)` (`gh api …/commits/a9e98bc/check-runs`). The diff touches no code.
- No red test is stale. No pre-existing test was deleted or modified. I committed no tests: the deliverable is documentation, and every criterion is checked by hand.

## CI fix plan

| # | File (and function or test) | Kind | Change | Why — failing test or CI line, root cause, criterion quoted for a test row | Decision |
|---|---|---|---|---|---|
| 1 | `tasks.md`, the paragraph under the §A table (lines 169–171) | source (the doc deliverable; no test) | Replace the sentence "The one CI test that still reads `conventions.md` checks a single line, the Layout's `archive/` row (`backend/tests/test_t040_tester_criteria.py::test_c28_conventions_layout_names_the_archive`)." with: "Two narrow CI checks still read `conventions.md`, and neither covers it as a whole: `backend/tests/test_t040_tester_criteria.py::test_c28_conventions_layout_names_the_archive` checks the Layout's `archive/` row, and `question-bank/src/committed-bank.test.ts` checks that it says the bank is committed under `data/us-states` and does not say the bank is kept out of git." Nothing else in the paragraph changes; the bold sentence stays word for word | Tester Verdict, criterion 14 (and 17) not met. Criterion 14: "It may mention the narrow single-line check `…test_c28_…`. It must not describe that check as covering `conventions.md` as a whole", read with the checklist's "the review-alone sentence exists and is accurate". Root cause below | |
| 2 | `PROGRESS.md`, `## Done` › Repo and process, the "kept true by review, not by a test" bullet (lines 247–249) | source (the doc deliverable; no test) | Replace "The one CI test that still reads `conventions.md` checks a single line, the Layout's `archive/` row (`backend/tests/test_t040_tester_criteria.py::test_c28_conventions_layout_names_the_archive`)." with the same replacement sentence as row 1, rewrapped to the bullet's indentation. Nothing else in the bullet changes | Same failure, second location. Same criterion 14 / 17 | |

**Root cause:** the brief's own Context line says `test_c28_…` "is the one remaining CI test that reads `conventions.md`", and the worker copied that survey fact into both docs without checking it. It is wrong: `question-bank/src/committed-bank.test.ts`, one of the five question-bank files CI runs (`ci.yml:154`, `bun test`), reads `conventions.md` in `describe("T-010 criteria 11–16 …")` › "criterion 11 — no shipped file still asserts the bank is not stored in git" (line 241) and "criterion 15 — README and conventions say a fresh clone already has the bank" (lines 271–272). Reproduced: `grep -n conventions.md question-bank/src/committed-bank.test.ts` gives 241, 271, 272, and `bun test src/committed-bank.test.ts -t 'criterion 1[15]'` runs both, 2 pass. I grepped every tracked CI test file (`*.test.ts(x)`, `backend/tests/test_*.py`) for `conventions.md`, `README.md` and `test-guidelines.md`: the only real reads are these two plus `test_c28`; the other hits (`ci-action-pinning`, `screens.criteria`, `level.criteria`, `level.test`, `fun-facts`) are comments. So the replacement sentence names every CI reader of the three docs, and the bold criterion-14 sentence ("No CI test checks … against the repo's layout, commands, CI jobs or test counts") stays true with the two narrow checks spelled out next to it. The criterion itself is sound; only the survey fact was wrong, so this is a fix, not a `blocked`.

**Not doing:**

- **Dropping the sentence instead of correcting it.** Criterion 14 allows naming `test_c28`, and the reader is better served by knowing exactly which narrow checks exist than by silence.
- **Rewording the bold "No CI test checks …" sentence.** It is criterion 14's required statement, and with the narrow checks named beside it, it is accurate. Qualifying it further risks drifting from the criterion's wording.
- **Editing the brief's Context line** ("`test_c28_…` is the one remaining CI test …"). It is the expander's survey, not a deliverable; noted here so the reviewer can see it was wrong.
- **The tester's criterion-12 advisory** (`conftest.py::assert_matches` still checks response shapes against `openapi.yaml` in CI, so "kept in step by hand" may want qualifying). The tester scored 12 as met; changing it is outside a fix for the fail. Left for the reviewer.
- **Any test change.** No test is red; the deliverable is documentation, checked by hand.

**Independence:** orchestrated run (`runs/T-113-deleted-guards-in-docs.md` exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJd2dgRHzBRDwBhvmNz`, the same id as every role on this task, so the session check cannot pass or fail. My independence is only that of a freshly spawned agent with its own context that did not write or verify the change.

To approve by hand: fill in Decision, set the header's `CI fix:` to `approved — <name>, <date>` and `Next step` to `ci-fix`, commit, and start a run.

## Notes

- **Surprise: `test-guidelines.md` states counts again.** The brief's survey assumed the "no counts" fact still held (see Handoff, Contradicts the brief).
- **Decision: never name a deleted test file, even as "deleted".** Criterion 1 counts every token in the regions, so a deleted guard is described by its commit SHA and its job, not its filename.
- **Decision: `E-12` → `E-32`.** It was cheap and the sentence was being rewritten anyway (allowed by Out of scope). The highest entry is `E-31`.
- **Observation: `committed-bank.test.ts` is the only CI file that imports `offline-rebuild.ts`.** The other four importers are snapshot files. `data-us-states.test.ts` checks the rebuild in-process, without the harness.
