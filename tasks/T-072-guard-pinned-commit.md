# T-072 — A guard test diffs against a fixed commit and fails on `main`

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** `Kate, 2026-09-21`
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
| worker | 2026-09-22 | cse_01A7CH7z2vsiAspj8xWEBTCj |

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

**Ending taken: deleted, not replaced.** Both guards are gone outright, along
with their allowlists and the tests that policed those allowlists. No
git-free replacement check was added, because one already existed next to
each deleted test (`climate-kid.test.ts:832`, "nothing outside
question-bank/ is touched by this task's own new test file" — a pure string
check on the file's own imports, no subprocess) and it is untouched. Reasoning
and both files named in full, in `engineering-decisions.md` E-11.

**Files changed, and only these three plus the brief:**

- `question-bank/src/climate-kid.test.ts` — inside `describe("T-014
  criterion 19 — nothing already verified is weakened")`, deleted
  `ALLOWED_OUTSIDE_QUESTION_BANK`, `outsideQuestionBank`, and the three tests
  built on them (`"frontend/ and backend/ are untouched by this task"`, `"the
  allowlist is one named file..."`, `"the allowed file is a test file..."`).
  Left in place: the `PINNED` floor loop and `"nothing outside
  question-bank/ is touched by this task's own new test file"`. Replaced the
  deleted block with a one-paragraph comment pointing at E-11.
- `question-bank/src/climate-kid-verify.test.ts` — inside `describe("T-014
  tester, criterion 19 — nothing already verified is weakened")`, deleted
  `ALLOWED_OUTSIDE_QUESTION_BANK` and `"frontend/ and backend/ carry no
  change from this task"` (the `13a735f` diff). Left in place: the `FLOORS`
  loop and every other test in the file, including `BASELINE_DIGESTS` and its
  neutralisations (T-070's, untouched). Same one-paragraph pointer comment.
- `engineering-decisions.md` — appended `## E-11 — …` after `E-10`, pure
  append (verified below). Names both file paths, states the ending taken and
  why, and states that the three pinned-digest baselines are T-070's and
  untouched here.

**Criteria, one at a time:**

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `question-bank` suite green in a full clone | met | Unshallowed the repo (`git fetch --unshallow`), fetched `origin/main`, ran `bun test` in `question-bank/`: **1251 pass, 0 fail** (down from 1253 pass / 2 fail because 4 tests were deleted total — 2 that were failing and 2 policing tests that were passing; 1253 − 2 = 1251, and the 2 failures are gone) |
| 2 | No test passes down a git-history-missing path | met | Both named paths (`climate-kid-verify.test.ts:1139-1141`'s exit-code disjunction, `climate-kid.test.ts:880-882`'s `stdout.trim()` fallback) are deleted along with the tests they lived in |
| 3 | No hard-coded commit id passed to `git` | met | `grep` over `question-bank/src` for hex(7+) in a git-spawn position (`grep -n 'git",\s*"[a-f0-9]{7,}\|...'`) — no matches anywhere in the package, not just the two files. `13a735f` survives only in comments (climate-kid-verify.test.ts's module docstring, unrelated to `BASELINE_DIGESTS`, and my own new E-11-pointer comment) — comments are explicitly outside this criterion |
| 4 | Guard no longer measures somebody else's diff | met | Did the brief's own probe: committed a throwaway `backend/tests/test_t072_probe.py`, ran `bun test src/climate-kid.test.ts src/climate-kid-verify.test.ts` in `question-bank/` — **0 failures** (199 pass), then reverted the probe (`git reset --hard HEAD~1` + confirmed `git status` clean) |
| 5 | No expired exception left behind | met | `ALLOWED_OUTSIDE_QUESTION_BANK` is deleted from both files, not merely edited, and both policing tests for it in `climate-kid.test.ts` are deleted with it |
| 6 | Surviving coverage still exists and passes | met | `climate-kid.test.ts:832`'s import test is untouched; the `PINNED` (`climate-kid.test.ts`) and `FLOORS` (`climate-kid-verify.test.ts`) loops — eight filenames, same numbers — are untouched and all pass (part of the 1251) |
| 7 | E-11 written once, append-only, after E-10 | met | `git diff engineering-decisions.md` shows a pure addition after the last line of E-10 (`... level.ts is what would be deleted once they had one.`) — no line above that point touched |
| 8 | Nothing else changes | met | `git diff --stat` against `origin/main...HEAD` (before this commit) touches only `runs/`, `tasks.md`, `tasks/T-072-…md` from the expander's own commit; this worker's uncommitted diff touches exactly the three files listed above, nothing under `.github/`, `frontend/`, `backend/`, `e2e/`, `question-bank/data/`, `question-bank/sample-data/`, `openapi.yaml`, or any non-test file under `question-bank/src/` |
| 9 | No new dependency, no test reaches a remote | met | `question-bank/package.json` and `bun.lock` show no diff (`git status --porcelain -- question-bank/package.json question-bank/bun.lock` empty); grepped both edited files for `git fetch`/`clone`/`ls-remote`/`remote update`/`fetch(`/`fetch =` — none |
| 10 | `bun run typecheck` passes in `question-bank/` | met | `tsc --noEmit` — clean, no output |
| 11 | CI green on the pushed head, all six jobs including shallow `question-bank` | met | Run [35675309302](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/35675309302) on commit `e401750` — `completed`/`success`. All six jobs green: `frontend (typecheck, lint, test)`, `question-bank (typecheck, test)`, `backend (lint, format, test)`, `backend (postgres)`, `integration (docker compose)`, `e2e (playwright)` |

**What I deliberately did not do:**

- **Did not widen `fetch-depth` in `ci.yml`.** Out of reach for a `T` task
  per `process.md` and the brief's own Constraints; noted as the real fix in
  E-11's "Revisit when".
- **Did not touch T-070's scope** — `BASELINE_DIGESTS` in
  `landmarks-verify.test.ts`, `climate-kid-verify.test.ts`,
  `top-crops-verify.test.ts`, or any of the four neutralisations
  (`withEmptyTopCrops`, `withoutAlaskaHighestPoint`, the `climate_kid`
  strip, Colorado's exemption). Confirmed by grep: no diff touches those
  constants or the neutralisation code.
- **Did not fix `highest-point-verify.test.ts:582-584`**, the same class of
  silent-`else` git-path defect the brief names as out of scope — left for
  T-070.
- **Did not run `prettier --write`** over either edited file; matched
  surrounding style by hand (the deleted blocks' indentation and quoting
  style carried over into the replacement comments).
- **Did not touch `PROGRESS.md:176-177` or `test-guidelines.md:209`** (test
  counts), per Out of scope.
- **Did not touch any `climate_kid` phrase or bank file.** No diff under
  `question-bank/data/` or `question-bank/src/curated/`.

**A pre-existing, unrelated failure I found and did not fix — flagged for
`tasks.md`, not this branch.** While confirming criterion 7 I ran
`frontend/src/level-window-claim.criteria.test.ts`, which has its own test
("no existing E-n entry was modified") built the same way as the two guards
this task deletes: it diffs `engineering-decisions.md` at the merge-base
against `origin/main` and assumes the merge-base predates `## E-10 — `
existing at all (true only while T-057, which added E-10, was in flight). Now
that T-057 has merged and E-10 is on `origin/main`, the merge-base already
contains E-10, so the test's hard assumption (`decisions.slice(0, cut)`
should equal the *entire* previous file) breaks structurally — **independent
of this task's changes.** Confirmed by stashing all three of my edits and
re-running: it fails identically on the unmodified branch head
(`6eec097`). This is the same class of defect T-072 exists to fix
(`process.md`, "when reality disagrees with the plan"), in a fourth file this
brief's Constraints do not cover (`frontend/`, owned by T-057 not T-072). I
did not touch it — out of scope by the brief's own Constraints (`frontend/`
is explicitly named as untouched) — and I am not adding a `tasks.md` entry
myself, since that is the reviewer's sweep step, not the worker's; flagging
it here is the record for whoever picks that up. **Owner: reviewer, at sweep,
or task-expander for a small T-0xx if the reviewer judges it needs its own
task — my recommendation is the latter, since it is the same defect shape as
this one and worth naming rather than silently re-discovering later.**

Separately, `frontend/`'s local `bun test` also shows 3 pre-existing
failures/1 error unrelated to any of the above — `bun install` in this
sandbox got 403s from the package proxy on `d3-transition`, `d3-drag`,
`d3-interpolate` and `react-simple-maps` never installed, so `UsMap.tsx`
fails to resolve it. That is a sandbox network limitation, not a repository
defect — noted so the tester does not chase it, but not otherwise acted on
since `frontend/` is out of scope for this branch.

**How to run what I touched:**

```
cd question-bank
bun install
bun run typecheck
bun test                              # full suite, needs a full clone
bun test src/climate-kid.test.ts src/climate-kid-verify.test.ts   # the two edited files alone
```

For criterion 1's full-clone requirement in a shallow checkout:
`git fetch --unshallow origin` (or at minimum `git fetch origin main`) before
running the suite.

**Push status:** committed and pushed to `claude/upbeat-volta-mw29cv` (this
session was assigned that branch and it matches the brief's `Branch:`
header — no divergence to resolve). Confirmed landed with `git log
origin/claude/upbeat-volta-mw29cv -1`.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

- **Overlap with T-070 is deliberate and partial.** This task closes T-070 (c) —
  both criterion-19 copies and the expired allowlist entry. T-070 (a) and (b)
  survive it and the queue entry should be trimmed rather than deleted when this
  merges.
- **Worker's own note: "deleted" was the obvious ending, not a close call.**
  The brief left both endings open, but a replacement check would have had to
  invent a new way to answer "did this task touch something outside its own
  package" without git — and that answer already existed, one test away, doing
  exactly that with a string match on the file's own imports rather than a
  subprocess. Writing a second version of the same idea would have been the
  kind of manufactured work the process asks not to do.
- **A near-miss worth recording:** while reverting the criterion-4 probe file I
  ran `git reset --hard HEAD~1` with my edits to the two test files still
  uncommitted, and it discarded them along with the probe commit — `reset
  --hard` clears the whole working tree, not just the last commit. Caught
  immediately by `git status --porcelain` showing clean when it should not
  have, and the edits were quick to redo since they were mechanical deletions.
  Worth a general note: prefer `git commit`-then-`git revert`, or stage the
  probe alone and `git reset HEAD~1 --soft` plus `rm`, when other uncommitted
  work is sitting in the same tree.
- **Found but not fixed: `frontend/src/level-window-claim.criteria.test.ts`'s
  "no existing E-n entry was modified" test is now failing on `origin/main`
  itself**, independent of this task — see the Handoff's flagged paragraph.
  Same defect shape as T-072's own subject (a guard whose git baseline
  assumption expired once its own task merged), in a file this brief does not
  own. Recommend a small follow-up task, sized like this one.
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
