# T-072 — A guard test diffs against a fixed commit and fails on `main`

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending` — replace with who approved and the date, e.g. `Kate, 2026-09-21`
**From:** [`tasks.md`](../tasks.md) T-072
**Branch:** `claude/upbeat-volta-mw29cv` — the branch this session was assigned by
the harness, used in place of `task/T-072-guard-pinned-commit` under
`CLAUDE.md` "Branches". **This line is the authority.** Every later role checks
`git branch --show-current` against it and pushes here, whatever branch it was
started on.
**PR:** [#55](https://github.com/Dkaattae/geo-discovery-zone/pull/55) — draft,
opened against `claude/upbeat-volta-mw29cv`.
**Fault:** cleared. The expander wrote this brief but its sandboxed `claude -p`
session could not commit, push or open a PR — `.claude/settings.json`'s git
allowlist was ignored because the workspace was not marked trusted, so every
mutating git command returned "This command requires approval", and no `gh` or
GitHub MCP tool was reachable from that session either. The brief itself was
unaffected; `run-loop.sh`'s own checkpoint committed and pushed it, and the
orchestrating (top-level) session opened PR #55 above. Recorded here as a
process note, not a task fault — see `runs/between-tasks.md`.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-21 | f1d2ba19-012c-4156-b7fb-31cedc4687e0 |

## Goal

Two tests written about T-014 assert "nothing outside `question-bank/` moved in
this task" by diffing git ranges that are not T-014's. One of them is **red on
the default branch itself** in any full clone; the other goes red for whatever
the *current* branch legitimately changes. Both are invisible in CI because
`actions/checkout` clones shallow and both swallow the missing history. Every
task from now on pays for this locally, and CI is not checking anything in
exchange.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

Two endings are acceptable and the criteria below hold under either: the two
assertions are **deleted** with the reasoning recorded, or they are **replaced**
by a check that needs no git history. Nothing here requires one over the other.

1. **The `question-bank` suite is green in a full clone.** With complete history
   present and `origin/main` fetched, `bun test` in `question-bank/` reports
   **zero failing tests** at the branch head. (For contrast, the committed run
   log `runs/T-057-level-window-docstring.md:159` records 1253 pass / **2 fail**
   in this same package on a full clone, and names these two assertions as the
   two failures.)

2. **No test in the two files passes because git history is missing.** In
   `question-bank/src/climate-kid.test.ts` and
   `question-bank/src/climate-kid-verify.test.ts`, no test reaches a passing
   assertion down a code path taken because a spawned `git` command exited
   non-zero or printed nothing. The two paths that do this today —
   `climate-kid-verify.test.ts:1139-1141`
   (`expect(proc.exitCode === 0 || proc.exitCode === 128 || proc.exitCode === 1).toBe(true)`)
   and `climate-kid.test.ts:880-882` (`expect(stdout.trim()).toBe("")`) — are
   gone. A test that cannot get the history it needs fails; it does not pass and
   it does not report as skipped.

3. **No hard-coded commit id is passed to git.** No tracked file under
   `question-bank/src/` passes a literal commit id — a hex string of seven or
   more characters used as a revision, `13a735f` included — as an argument to a
   spawned `git` process. Symbolic revisions (`HEAD`, `origin/main`, a
   merge-base resolved at run time) are not commit ids and are not forbidden by
   this criterion. The SHA-256 **digest** constants (`BASELINE_DIGESTS` and
   friends) and the commit ids named in *comments* are outside this criterion and
   are expected to be unchanged — see Out of scope.

4. **The guard no longer measures somebody else's diff.** Adding an unrelated
   file under `backend/`, `frontend/` or `e2e/` to the working tree and
   committing it does not make any test in either of those two files fail.
   Checkable directly: commit a throwaway `backend/tests/test_t072_probe.py`,
   run `bun test src/climate-kid.test.ts src/climate-kid-verify.test.ts` in
   `question-bank/`, observe zero failures, then revert the probe before
   reporting.

5. **No expired exception is left behind.** No allowlist in either file names a
   path that is already present on the default branch. Concretely,
   `ALLOWED_OUTSIDE_QUESTION_BANK` (`climate-kid.test.ts:861`,
   `climate-kid-verify.test.ts:1127`) no longer contains
   `backend/tests/test_region_vocabulary.py`, which merged in PR #49 and is on
   `origin/main`; and any test whose only subject is that allowlist
   (`climate-kid.test.ts:885-917`) is gone too rather than left asserting the
   contents of a list nothing uses.

6. **The coverage that was not the defect survives.** These tests still exist
   under the same names and still pass:
   - `climate-kid.test.ts` — "nothing outside question-bank/ is touched by this
     task's own new test file" (`:832`);
   - the eight per-file floors in `climate-kid.test.ts:821` (`PINNED`) and
     `climate-kid-verify.test.ts:1058` (`FLOORS`), all sixteen generated tests,
     with the same eight filenames and the same numbers.

7. **The decision is written down, once, as `E-11`.**
   `engineering-decisions.md` gains exactly one new entry, headed `## E-11 — …`,
   placed after `E-10` so that every `E-n` heading in the file remains unique and
   the numbers stay ascending. No existing entry's body changes. The entry names
   both file paths, says which ending was taken and why, and states that the
   pinned-digest baselines in `landmarks-verify.test.ts`,
   `climate-kid-verify.test.ts` and `top-crops-verify.test.ts` are deliberately
   **not** touched here and remain T-070's.

8. **Nothing else changes.** Excluding the brief and the sweep files
   (`tasks/`, `tasks.md`, `PROGRESS.md`), the branch's diff against the default
   branch touches only these three paths:
   `question-bank/src/climate-kid.test.ts`,
   `question-bank/src/climate-kid-verify.test.ts`,
   `engineering-decisions.md`. In particular **no file under `.github/` is
   changed** — raising `fetch-depth` in `ci.yml` is not available as a fix here
   (see Constraints) — and nothing under `frontend/`, `backend/`, `e2e/`,
   `question-bank/data/`, `question-bank/sample-data/`, no `openapi.yaml`, and no
   non-test source file under `question-bank/src/`.

9. **No new dependency, and no test reaches a remote.**
   `question-bank/package.json` still declares no runtime dependency and exactly
   `@types/bun` and `typescript` as devDependencies, and `bun.lock` is unchanged.
   No test in the two edited files spawns `git fetch`, `git clone`,
   `git ls-remote` or `git remote update`, calls `fetch(`, or assigns to
   `fetch`.

10. **`bun run typecheck` passes in `question-bank/`.** (There is no `lint`
    script in this package and this task does not add one — see T-066. Typecheck
    plus the suite is the whole gate here, which is what CI runs.)

11. **CI is green on the pushed branch head, including the shallow job.** All six
    jobs in `.github/workflows/ci.yml` pass on the commit under verification, and
    the `question-bank (typecheck, test)` job — which checks out shallow, at the
    default `fetch-depth: 1` — is among them. This is the evidence that the
    repaired or removed guard behaves the same with and without history: report
    the run's URL or id.

## Out of scope

Everything below is a real defect, and none of it belongs in this branch.

- **T-070 (a) — the three pinned-digest guards** and their four accumulated
  per-task neutralisations (`withEmptyTopCrops`, `withoutAlaskaHighestPoint`, the
  `climate_kid` strip, Colorado's exemption). Do not re-pin `BASELINE_DIGESTS`,
  do not touch the neutralisations, do not change what they hash.
- **T-070 (b) — `rebuildOffline()` returning stdout.** Untouched.
- **Other silent-`else` git paths outside the two named files** — for example
  `highest-point-verify.test.ts:582-584` (`if (base === null) return;`). Same
  class of defect, not this task's two assertions; leave them and note them for
  T-070 rather than fixing them here.
- **`.github/workflows/ci.yml`.** Workflow changes are `P-n` tickets done by
  hand, never inside this loop (`process.md`, "Work on the loop itself never
  enters the loop"). If the only repair you can see requires a deeper checkout,
  stop and say so rather than editing the workflow.
- **Reformatting.** `question-bank/` is 22 files out of prettier (T-071); do not
  run `prettier --write` over either file. Match the surrounding style by hand.
- **Test-count figures in the docs** (T-065). Do not refresh
  `PROGRESS.md:176-177` or `test-guidelines.md:209` because this task changes a
  test count.
- **Any change to what T-014 curated** — the 50 `climate_kid` phrases and the
  bank files stay byte-identical.

## Constraints

- **Files expected to change:** `question-bank/src/climate-kid.test.ts`,
  `question-bank/src/climate-kid-verify.test.ts`, `engineering-decisions.md`.
  Plus this brief. Nothing else.
- **Other suites read these two files by name and must stay green.** All of these
  assert something about them and will go red if the edit overshoots:
  - `highest-point-verify.test.ts:443-461` — `climate-kid-verify.test.ts` must
    contain **no** `test.skip` / `describe.skip` / `.todo` / `.skipIf` and must
    keep more than ten `expect(` calls. **This rules out "mark it skipped" as an
    ending.**
  - `region-vocabulary.test.ts:289-310` — `climate-kid-verify.test.ts` must keep
    its `region` neutralisation and the test proving that neutralisation is not
    a no-op.
  - `top-crops-verify.test.ts:446-455` — exactly one file under
    `question-bank/src/` may carry the dead-loopback proxy literal, with
    `climate-kid.test.ts` named as an exception to that scan; and
    `:494-500` requires both files to assert a populated `top_crops` invariant.
  - `climate-kid.test.ts:782-794` — no test file under `question-bank/src` may
    call or stub `fetch`, which also binds whatever you write.
- **Invariants:** the bank under `question-bank/data/` does not move; no test
  spawns `src/build.ts`; nothing in `question-bank/` reaches the network.
- **Dependencies:** none without asking (see [`CLAUDE.md`](../CLAUDE.md)).
  `question-bank/` has no runtime dependency and two devDependencies; keep it
  that way.
- **`engineering-decisions.md` is not gated** and a `T` task may add to it when
  its criteria say so — this one's criterion 7 does. It is append-only here:
  `frontend/src/level-window-claim.criteria.test.ts:166-187` compares everything
  above `## E-10 — ` against the branch base and will catch an edit to an older
  entry, and `question-bank/src/region-vocabulary.test.ts:318-351` requires every
  `E-n` heading to be unique and ascending.
- **Commit style:** each commit names its role — `T-072 worker: …`.

## Context

**Required reading**, not background.

- **The two assertions themselves:**
  - `question-bank/src/climate-kid-verify.test.ts:1110-1143` — the `13a735f`
    copy, inside `describe("T-014 tester, criterion 19 — nothing already verified
    is weakened")`. Its own docstring states it is red on `origin/main` and that
    the allowlist exists only so the task that added it "adds nothing to that
    failure".
  - `question-bank/src/climate-kid.test.ts:837-917` — the `origin/main...HEAD`
    copy, inside `describe("T-014 criterion 19 — nothing already verified is
    weakened")`, with the allowlist and its two policing tests.
- **What the assertions were originally for:** T-014's criterion 19, and the
  narrower structural form of the same idea that already works without git —
  `climate-kid.test.ts:832`, which checks the file imports nothing from outside
  the package.
- **Why CI never saw it:** `.github/workflows/ci.yml` — the
  `question-bank (typecheck, test)` job at `:94-130` runs `actions/checkout@v5`
  with no `fetch-depth`, so the checkout is shallow and `origin/main` and
  `13a735f` are both absent. That job runs `typecheck` and `test` only; there is
  no `lint` (T-066).
- **The history:** `tasks.md` T-072 (the queue entry this expands) and T-070 (c)
  (the same defect described from T-017's side, which also asks for the expired
  allowlist entry to be deleted); `PROGRESS.md:415-429` on how a shallow-clone
  verdict missed this class of failure once already;
  `runs/T-057-level-window-docstring.md:79` and `:159` for the measured 2
  failures on a full clone.
- **Repo rules that bite here:** [`CLAUDE.md`](../CLAUDE.md) "Tests" (no network,
  whole suite before claiming done) and "Packages";
  [`test-guidelines.md`](../test-guidelines.md); [`process.md`](../process.md),
  "Work on the loop itself never enters the loop" for why `ci.yml` is off limits.

## Handoff

Written by `worker` before the tester runs. Always written, even if nothing was
built.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

- **Overlap with T-070 is deliberate and partial.** This task closes T-070 (c) —
  both criterion-19 copies and the expired allowlist entry. T-070 (a) and (b)
  survive it and the queue entry should be trimmed rather than deleted when this
  merges.
- **What a person has to do before the `worker` can start**, in order, from
  `/home/user/geo-discovery-zone` on branch `claude/upbeat-volta-mw29cv`:

  ```
  git add tasks/T-072-guard-pinned-commit.md tasks.md
  git commit -m "T-072 expander: guard-pinned-commit"
  git push -u origin claude/upbeat-volta-mw29cv
  gh pr create --draft --base main --head claude/upbeat-volta-mw29cv \
    --title "T-072 — a guard test diffs against a fixed commit and fails on main" \
    --body-file tasks/T-072-guard-pinned-commit.md
  ```

  Then replace `Approved: pending` with your name and the date, set `Status:
  awaiting approval` → the worker's `Next step: worker`, and clear the `Fault:`
  line. The commit touches only `tasks/` and `tasks.md`, which is the whole of
  what an expander's diff is allowed to contain (`process.md` step 2).
- **The expander did not run the suite** (`process.md`, D-7). Every count and
  every "is red today" claim above is quoted from a committed file —
  `runs/T-057-level-window-docstring.md` and the two files' own docstrings — and
  is cited where it is used.
