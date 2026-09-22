# T-072 — A guard test diffs against a fixed commit and fails on `main`

**Status:** `pass`
**Next step:** `reviewer`
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
| tester | 2026-09-22 | cse_01A7CH7z2vsiAspj8xWEBTCj (orchestrated — see Verdict, "What kind of independence this verdict has") |

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

**Pass.** All eleven criteria hold, independently checked. The `question-bank`
suite is **1251 pass / 0 fail** in a full clone *and* **1251 pass / 0 fail** in a
shallow one — identical, which is the whole point of the task — against
`origin/main`'s **1254 pass / 1 fail** full / **1255 pass / 0 fail** shallow.
Nothing new regresses; the two frontend failures the worker flagged are present
on `origin/main` unchanged. **Next step: `reviewer`.**

**No new test file was committed, deliberately.** Criterion 8 restricts the
branch's diff to three named paths plus the brief, so adding one would have
broken the criterion it was verifying — and the criteria are frozen. The brief
anticipates this: criterion 4 is written as an executed procedure ("commit a
throwaway … then revert the probe before reporting"), and criterion 11 as an
observation of CI. Verification is therefore by **execution and mutation**, with
every command and its output recorded below. Flagged for the expander under
"Two things for whoever writes the next brief of this shape".

### What kind of independence this verdict has

**Weaker than a separate session, and the brief should say so plainly.** This is
an orchestrated run (`runs/T-072-guard-pinned-commit.md` exists), so every role
shares one session id: `$CLAUDE_CODE_REMOTE_SESSION_ID` is
`cse_01A7CH7z2vsiAspj8xWEBTCj`, which is already in the Sessions table as
`worker`. **The Sessions-table check did not pass and is not being claimed as
passing.** What is real is that this is a freshly spawned agent with its own
context window: it never saw the worker's transcript or reasoning, and read only
the brief, the repo and the committed docs. That rests on the orchestrator having
spawned the role correctly rather than on anything checkable from here
(`process.md`, "Spawning, and the isolation it must not cost").

### Criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | suite green in a full clone | **pass** | `git rev-parse --is-shallow-repository` → `false`; `origin/main` (`c967fd2`) and `13a735f` both resolve locally; `bun test` in `question-bank/` → **1251 pass, 0 fail**, 15 files |
| 2 | no test passes because history is missing | **pass** | Both named paths deleted. No `git` subprocess remains anywhere in `climate-kid-verify.test.ts`; the only two left in `climate-kid.test.ts` are `ls-files` (throws on failure, `:164`) and a working-tree `diff --name-only --` (no revision). See the caveat below |
| 3 | no hard-coded commit id passed to git | **pass** | Every `git` spawn under `question-bank/src/` enumerated: only `ls-files`, `check-ignore`, `diff --name-only --`, and `show origin/main:<path>` (symbolic, allowed). `13a735f` survives only at `climate-kid-verify.test.ts:26`, `:157`, `:1113` — all comments, explicitly out of scope. Hex scan hits only `BASELINE_DIGESTS` (out of scope) and decimal populations in `fixtures/us-states.sparql.json` |
| 4 | guard no longer measures somebody else's diff | **pass** | Probed **all three** paths the criterion names, not just `backend/`: committed `backend/tests/test_t072_probe.py`, `frontend/src/t072-probe.ts`, `e2e/t072-probe.txt` in a detached worktree at the branch head → the two files gave **199 pass, 0 fail**, and the *whole* package gave **1251 pass, 0 fail**. Same probe on `origin/main` turns **both** old guards red (below) |
| 5 | no expired exception left behind | **pass** | `ALLOWED_OUTSIDE_QUESTION_BANK` returns zero hits across `question-bank/src/`; the three tests that policed it are gone. `test_region_vocabulary.py` survives only as prose in `region-vocabulary.test.ts:20` |
| 6 | the coverage that was not the defect survives | **pass** | `PINNED` and `FLOORS` are **byte-identical** to `origin/main` (no `+`/`-` line in the diff touches either block); same eight filenames, same numbers, 16 generated tests, all green. `"nothing outside question-bank/ is touched by this task's own new test file"` present at `:832`. All three proved live by mutation (below) |
| 7 | the decision is written down once, as `E-11` | **pass** | Headings run `E-1 … E-11`, unique and ascending, `E-11` at `:529` immediately after `E-10`. The diff contains exactly **one** `-` line — the `--- a/` header — so it is a pure append and no existing body moved. Entry names both file paths, states "delete, not repair" and why, and states the three pinned-digest baselines are T-070's and untouched |
| 8 | nothing else changes | **pass, with one named exception** | The worker's implementation commit `e401750` touches exactly `engineering-decisions.md` + the two test files + the brief. No `.github/`, no `frontend/`, `backend/`, `e2e/`, `question-bank/data/`, `sample-data/`, `openapi.yaml`, no non-test source. **Exception: `runs/`** — see below |
| 9 | no new dependency, no test reaches a remote | **pass** | `git diff origin/main...HEAD -- question-bank/package.json question-bank/bun.lock` is empty; `package.json` declares no `dependencies` and exactly `@types/bun` + `typescript`. No `git fetch`/`clone`/`ls-remote`/`remote update`, no `fetch(`, no assignment to `fetch` in either file. Every suite run below was executed with all six proxy vars at `http://127.0.0.1:1` |
| 10 | `bun run typecheck` passes | **pass** | `tsc --noEmit` clean, exit 0, in both the full clone and the shallow one |
| 11 | CI green on the pushed head, incl. the shallow job | **pass** | Two runs, **all six jobs green in each** (`frontend`, `question-bank (typecheck, test)`, `backend`, `backend (postgres)`, `integration`, `e2e`): **[35675701598](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/35675701598)** on `4dbd111`, the last commit carrying any code, and **[35676388554](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/35676388554)** on `7187665`, this Verdict's own commit. Independently reproduced locally against a real `--depth=1` clone (below). Any push after `7187665` contains only this markdown file |

### The defect, measured from both sides

The premise and the repair, in one table. Every cell is a `bun test` run in
`question-bank/` with the network proxied to `127.0.0.1:1`:

| | full clone | shallow clone (`--depth=1`, what CI gets) |
|---|---|---|
| `origin/main` (`c967fd2`) | 1254 pass / **1 fail** | 1255 pass / 0 fail — **both guards vacuous** |
| branch head (`4dbd111`) | **1251 pass / 0 fail** | **1251 pass / 0 fail** |

- **The shallow clone was made for real**, not simulated: `git clone --depth=1`,
  after which `git rev-parse origin/main` and `git cat-file -e 13a735f` both
  fail — exactly the state `actions/checkout@v5` at `fetch-depth: 1` leaves.
- **The counts reconcile.** 1255 − 4 = 1251: one deleted test in
  `climate-kid-verify.test.ts`, three in `climate-kid.test.ts`.
- **The `origin/main` failure is the `13a735f` guard**, and it reports twelve
  paths under `backend/` and `frontend/` that have nothing to do with T-014 —
  `backend/app/levels.py`, `frontend/src/ci-action-pinning.test.ts` and so on.
  That is criterion 1's "red on the default branch itself", reproduced.
- **Criterion 4, from the other side.** The same three probe files committed on
  top of `origin/main` turn **both** guards red (`2 fail`), naming
  `backend/tests/test_t072_probe.py`. On the branch head the same probe gives
  `0 fail`. The guard demonstrably did measure somebody else's diff, and
  demonstrably no longer does.

### Mutation — proving the surviving coverage is not a tautology

Criterion 6 says the tests that were not the defect must still pass. Passing is
cheap; these had to be shown to still *fail on breakage*. **All three mutations
were made in a disposable `--depth=1` clone under the scratchpad, never in the
repository** — `git status --porcelain` in `/home/user/geo-discovery-zone` was
empty before and after. Each was reverted and the clone verified clean.

| Mutation | Expected to kill | Result |
|---|---|---|
| **M1** — delete one `test()` block from `normalize.test.ts` (14 → 13) | the two per-file floors for that file | **2 fail**, exactly: `normalize.test.ts still declares at least 14 tests and 31 expectations` (`FLOORS`) and `… at least its 14 tests and 31 expectations` (`PINNED`). Nothing else moved |
| **M2** — prepend `import { something } from "../../frontend/src/lib/level";` to `climate-kid.test.ts` | the surviving structural guard at `:832` | **1 fail**: `nothing outside question-bank/ is touched by this task's own new test file` |
| **M3** — rename the `## E-11 —` heading to `## E-9 —` | criterion 7's enforcement in `region-vocabulary.test.ts` | **2 fail**: `E-9 is the next number … no other entry claims it` and `the entries run in ascending order` |

M2 matters most: it is the test the worker kept *instead of* writing a
replacement, and the whole "delete, don't replace" argument in E-11 rests on it
being a real check. It is.

### Findings that are not failures

- **Criterion 8 and `runs/`.** The branch diff also touches
  `runs/T-072-guard-pinned-commit.md`, `runs/between-tasks.md`,
  `runs/ledger.tsv` and `runs/transcripts/…json`, which criterion 8's exclusion
  list (`tasks/`, `tasks.md`, `PROGRESS.md`) does not cover. **None of it is the
  worker's**: per-commit attribution puts it in `27c47ab`/`38dcf53` (the
  driver's own checkpoint) and `4dbd111` (`T-072 orchestrator:`), and
  `process.md`'s role table assigns `runs/` to the orchestrator. This is the
  same shape as process.md's note that a swept PR always touches `tasks.md` and
  `PROGRESS.md` without any brief listing them. Recorded, not counted against
  the work.
- **A weak assertion of the same family survives at `climate-kid.test.ts:538`.**
  `expect(status === 0 || status === 1).toBe(true)` in `"sample-data/us-state-co.json`
  `was not touched by this task"`. It is **not** one of the two paths criterion 2
  names, it is unchanged by this branch, and it does not suffer the defect —
  `git diff --name-only -- <path>` takes no revision and needs no history, and
  there is no conditional, so no assertion is reached *because* git failed. It
  is still a disjunction that would swallow a broken `git`. **For T-070**, with
  `highest-point-verify.test.ts:582-584`.
- **The worker's flagged frontend failure is confirmed, and is genuinely
  pre-existing.** `frontend/src/level-window-claim.criteria.test.ts`'s `"no
  existing E-n entry was modified"` fails identically on `origin/main`
  (`208 pass / 2 fail / 1 error`) and on this branch (`208 pass / 2 fail /
  1 error`) — **the same numbers**, so this branch adds nothing. The failure
  diff is E-10's own body, not E-11's: the test compares everything above
  `## E-10 — ` against the *entire* file at the merge-base, which only held
  while T-057 was in flight and E-10 was not yet on `main`. Third instance of
  this exact defect shape, and it is invisible in CI for the same reason as the
  other two (`if (base.exitCode !== 0) return;` at `:171`, and CI clones
  shallow). **Recommend a small follow-up task, sized like T-072.** The `1 error`
  in both counts is `react-simple-maps` missing from this sandbox's
  `node_modules`, not a repository defect.
- **Constraint neighbours all hold.** `climate-kid-verify.test.ts` carries no
  `.skip`/`.todo`/`.skipIf`/`xtest` and 140 `expect(` calls (needs > 10);
  `climate-kid.test.ts` carries 109. The `region` neutralisation, the
  dead-loopback proxy exception and the `top_crops` invariants are all untouched
  and green inside the 1251.

### Two things for whoever writes the next brief of this shape

Neither blocks the merge; both are for `task-expander`, at the template.

1. **Criterion 8 forecloses the tester's own deliverable.** A criterion that
   pins the branch diff to N paths leaves the tester nowhere to commit a test,
   which forces either a self-defeating commit or verification by executed
   procedure. This brief got away with it because criteria 4 and 11 were
   *written* as procedures — but that was luck, not design. Say it explicitly,
   or leave the tester a path.
2. **`runs/` belongs in the "excluding" list**, next to `tasks/`, `tasks.md` and
   `PROGRESS.md`. Under an orchestrated run it is always in the diff and never
   the worker's.

### Exactly what was run

From `/home/user/geo-discovery-zone`, all with
`HTTP_PROXY=HTTPS_PROXY=ALL_PROXY=http://127.0.0.1:1` and their lowercase forms:

```
git fetch origin main                                  # origin/main = c967fd2
cd question-bank && bun test                           # 1251 pass, 0 fail
cd question-bank && bun run typecheck                  # exit 0

# origin/main, full clone, in a scratch worktree
bun test                                               # 1254 pass, 1 fail

# criterion 4, branch head + probes under backend/ frontend/ e2e/
bun test src/climate-kid.test.ts src/climate-kid-verify.test.ts   # 199 pass, 0 fail
bun test                                               # 1251 pass, 0 fail

# criterion 4, same probe on origin/main
bun test src/climate-kid.test.ts src/climate-kid-verify.test.ts   # 201 pass, 2 fail

# shallow, what CI sees
git clone --depth=1 -b claude/upbeat-volta-mw29cv …    # origin/main, 13a735f both absent
bun test                                               # 1251 pass, 0 fail
bun run typecheck                                      # exit 0
git clone --depth=1 -b main …  && bun test             # 1255 pass, 0 fail (guards vacuous)

# regression check outside the package
cd frontend && bun test                                # 208 pass, 2 fail, 1 error — same on origin/main
```

Scratch worktrees and clones were removed; `git worktree list` shows only the
repository and `git status --porcelain` is empty.

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
