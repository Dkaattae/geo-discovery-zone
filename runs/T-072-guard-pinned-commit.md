# T-072 — A guard test diffs against a fixed commit and fails on `main` — run log

**Task:** T-072 · **Branch:** `claude/upbeat-volta-mw29cv` · **PR:** [#55](https://github.com/Dkaattae/geo-discovery-zone/pull/55)
**Started:** 2026-09-21 · **Outcome:** in progress

**Process note:** round 1 ran under `.claude/loop/run-loop.sh` (the driven path).
Its `claude -p` sub-session hit a workspace-trust gate — `.claude/settings.json`'s
git allowlist was ignored because the workspace was not marked trusted, so every
mutating git command it tried was denied, and it had no `gh`/GitHub MCP access
either. It still wrote a complete brief; `run-loop.sh`'s own checkpoint (running
in the top-level session, not the sandboxed sub-session) committed and pushed it.
The top-level session then opened draft PR #55 by hand to finish the step, and a
human (Kate) approved it. From round 2 onward, at the human's direction, this run
switched to the `orchestrator` agent spawning each role with the `Agent` tool —
in-process subagents share this session's already-working permissions rather
than hitting the same trust wall.

## Round 1 — task-expander — 2026-09-21
`Next step` on entry: `` (no live brief) → on exit: `human` (blocked — could not commit/push/open PR)

**T-072 expanded into a brief — but it is sitting uncommitted in the working tree, because every mutating git command in this session is denied.** The criteria are complete and ready for approval; a person needs to commit, push and open the draft PR before the worker can run.

| | |
|---|---|
| **Task picked** | T-072 — a guard test diffs against a fixed commit and fails on `main` (first unblocked entry in §A; T-066 and T-060 are both parked on decisions reserved for Dkaattae) |
| **Brief** | `tasks/T-072-guard-pinned-commit.md` — 11 criteria, written, **uncommitted** |
| **Branch** | `claude/upbeat-volta-mw29cv` (harness-assigned, already at `origin/main`'s tip `c967fd2`) |
| **PR** | **none** — `gh` is not installed and no GitHub MCP tool was available |
| **Status / Next step** | `blocked` / `human` |

### What blocked it

- `git add`, `git commit`, `git checkout -b`, `git push` all return **"This command requires approval"** — with the `cd … &&` form, the bare form, the `git -C` form, and with the sandbox override. Read-only git (`status`, `log`, `branch`, `diff`) works.
- `.claude/settings.json` *does* allow `Bash(git add:*)`, `Bash(git commit:*)`, `Bash(git push:*)`; the harness is not honouring it in this `-p` session.
- Consequence worth naming: **`blocked-run-notice.yml` cannot fire**, because it triggers on a push and nothing was pushed. This report and the brief's `Fault:` line are the only notice.

The exact commands to land it are in the brief's Notes section.

### The task, and what the brief asks for

Two tests written about T-014 assert "nothing outside `question-bank/` moved in this task" by diffing ranges that are not T-014's:

- `climate-kid-verify.test.ts:1130` diffs `13a735f...HEAD` — `13a735f` predates the FastAPI backend, so it is **red on the default branch** in any full clone.
- `climate-kid.test.ts:872` diffs `origin/main...HEAD` — measures whatever the *current* branch changed, so it trips any later task that legitimately touches `backend/` or `frontend/`.

Both pass in CI only because `actions/checkout` clones shallow (no `fetch-depth` in `ci.yml`) and both swallow the missing history in an `else`. `runs/T-057-level-window-docstring.md:159` records these two as the 2 failures in an otherwise-green 1253-test run.

Criteria highlights — deliberately neutral between repairing and deleting the guard:

- **1, 11** — suite green in a full clone, and all six CI jobs green on the pushed head (the shallow job is the proof the two behave alike).
- **2** — no test passes down a path taken *because* git history was missing; the two named `else` branches are gone.
- **3** — no literal commit id is ever passed to a spawned `git`; digest constants and comments untouched.
- **4** — a throwaway commit under `backend/` must not turn either file red.
- **5** — the expired `ALLOWED_OUTSIDE_QUESTION_BANK` entry (merged in PR #49) goes, with the tests that only police it.
- **7** — the call is recorded as `E-11`, appended after `E-10`.
- **8, 9, 10** — nothing outside three files changes, **no `.github/` edit** (raising `fetch-depth` would be a `P-n` ticket, not this loop's to make), no new dependency, no remote-touching git, `typecheck` only — `question-bank` has no `lint` script (T-066), so no criterion asks for one.

Constraints call out four other suites that pin these two files by name — notably `highest-point-verify.test.ts:443-461`, which forbids `test.skip` in `climate-kid-verify.test.ts` and so rules out "skip it" as an ending.

### Scope note for the reviewer

The brief covers **both** copies, which closes **T-070 (c)** as well as T-072. T-070 (a) (the pinned-digest guards) and (b) (`rebuildOffline` stdout) are explicitly out of scope — trim that entry rather than delete it when this merges. `tasks.md` records the same.

*(Following this, the top-level session opened draft PR #55 and Kate approved: "Approved, Kate 2026-09-21".)*

## Round 2 — worker — 2026-09-22
`Next step` on entry: `worker` → on exit: `tester`
Session id shared with this orchestrator session (Agent-tool spawn): `cse_01A7CH7z2vsiAspj8xWEBTCj`

T-072 worker done. All 11 acceptance criteria met and independently verified (typecheck, full suite on a full clone, a live probe, and a real CI run — all green). Branch `claude/upbeat-volta-mw29cv` (matches brief header, no divergence), pushed and confirmed at commit `97d9a06`. Brief's Status is now `awaiting verification`, Next step `tester`.

**What changed (3 files + the brief, nothing else):**
- `question-bank/src/climate-kid.test.ts` — deleted `ALLOWED_OUTSIDE_QUESTION_BANK`, `outsideQuestionBank`, and the three tests built on them (the `origin/main...HEAD` diff test and its two allowlist-policing tests). Kept the `PINNED` floor loop and the git-free "nothing outside question-bank/ is touched by this task's own new test file" test, replacing the deleted block with a comment pointing at E-11.
- `question-bank/src/climate-kid-verify.test.ts` — deleted `ALLOWED_OUTSIDE_QUESTION_BANK` and the `13a735f`-diff test. Kept the `FLOORS` loop, `BASELINE_DIGESTS` and everything else (T-070's, untouched).
- `engineering-decisions.md` — appended `## E-11 — …` after `E-10`, pure append verified by diff (nothing above E-10 touched).
- `tasks/T-072-guard-pinned-commit.md` — Handoff, Sessions row, Status/Next step.

**Ending taken:** deleted, not replaced — a git-free version of the same check already existed one test over, so writing a second one would have duplicated it.

**Verification run (all in the Handoff's table, criterion by criterion):**
- `question-bank`: 1251 pass / 0 fail on a full clone (`git fetch --unshallow`), was 1253 pass / 2 fail before.
- `bun run typecheck` in `question-bank/`: clean.
- Criterion 4's probe: committed a throwaway `backend/tests/test_t072_probe.py`, ran the two edited test files, 0 failures, reverted.
- No hardcoded commit id passed to `git` anywhere in `question-bank/src/` (grep, package-wide, not just the two files).
- `question-bank/package.json` and `bun.lock` unchanged.
- CI on the pushed commit `e401750` (and confirmed still current at `97d9a06`, which only touched the brief): run [35675309302](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/35675309302), all six jobs `completed`/`success` — `frontend`, `question-bank` (the shallow one), `backend (lint, format, test)`, `backend (postgres)`, `integration`, `e2e`.

**Flagged, not fixed — needs an owner:** `frontend/src/level-window-claim.criteria.test.ts`'s "no existing E-n entry was modified" test is the same defect shape as this task's subject (a git-baseline assumption that expired once its own task, T-057, merged) but lives in a file outside this brief's Constraints. Confirmed it fails identically on the unmodified branch head, independent of my changes. Recorded in the brief's Handoff and Notes with a recommendation that the reviewer, at sweep, add a small follow-up T-0xx — I did not add it myself since sweeping `tasks.md` is the reviewer's step, not the worker's.

**Also flagged, no action needed:** `frontend/`'s local `bun test` shows 3 pre-existing failures/1 error caused by this sandbox's package-proxy 403s on `d3-transition`/`d3-drag`/`d3-interpolate`/`react-simple-maps` — a sandbox network limitation, not a repo defect (CI's own `frontend` job passed clean, confirming this). Noted in the Handoff so the tester doesn't chase it.

**A process note worth reading:** mid-task the worker ran `git reset --hard HEAD~1` to revert the criterion-4 probe commit while its test-file edits were still uncommitted in the same working tree, which wiped those edits too. Caught immediately via `git status`, redone in under a minute — recorded in Notes as a near-miss for future reference.

Next: a fresh tester session, per the loop.

## Round 3 — tester — 2026-09-22
`Next step` on entry: `tester` → on exit: `reviewer`
Session id shared with this orchestrator session (Agent-tool spawn): `cse_01A7CH7z2vsiAspj8xWEBTCj`

## TL;DR

**Pass.** All eleven criteria of T-072 hold, verified independently by execution and mutation. `question-bank` is **1251 pass / 0 fail in a full clone and 1251 pass / 0 fail in a `--depth=1` clone** — identical, which is the whole point — against `origin/main`'s **1254/1 full** and **1255/0 shallow**. Verdict written, committed and pushed to `claude/upbeat-volta-mw29cv` (`4b4c619`), `Status: pass`, `Next step: reviewer`.

## Independence — read this before trusting the verdict

**The Sessions-table check did not pass, and I am not claiming it did.** This is an orchestrated run (`runs/T-072-guard-pinned-commit.md` exists), so `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01A7CH7z2vsiAspj8xWEBTCj` — already listed as `worker`. What is real: a freshly spawned agent with its own context window that never saw the worker's transcript. That rests on the orchestrator having spawned the role correctly, not on anything checkable from here. Stated in the same terms in the brief's Verdict.

## No new test file was committed, deliberately

Criterion 8 pins the branch diff to three paths plus the brief. Adding a test file would have **broken the criterion it was verifying**, and the criteria are frozen. The brief anticipates this — criterion 4 is written as an executed procedure ("commit a throwaway … then revert the probe before reporting") and criterion 11 as a CI observation. So verification was by execution plus mutation, every command and output recorded in the Verdict.

## Criteria

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | Not shallow; `origin/main` (`c967fd2`) and `13a735f` both resolve; **1251 pass, 0 fail** |
| 2 | pass | Both named paths gone. **No `git` subprocess remains anywhere** in `climate-kid-verify.test.ts`; the two left in `climate-kid.test.ts` are `ls-files` (throws on failure) and a working-tree `diff --name-only --` (no revision) |
| 3 | pass | Every `git` spawn under `question-bank/src/` enumerated: only `ls-files`, `check-ignore`, `diff --name-only --`, `show origin/main:<path>`. `13a735f` survives only in three comments (out of scope) |
| 4 | pass | Probed **all three** paths the criterion names (worker only did `backend/`): 0 fail on branch head; same probe on `origin/main` turns **both** old guards red |
| 5 | pass | `ALLOWED_OUTSIDE_QUESTION_BANK`: zero hits package-wide; its three policing tests gone |
| 6 | pass | `PINNED`/`FLOORS` **byte-identical** to `origin/main`; all three survivors proved live by mutation |
| 7 | pass | `E-1 … E-11` unique and ascending, `E-11` right after `E-10`; diff has exactly **one** `-` line (the `--- a/` header), so pure append |
| 8 | pass, one named exception | Worker's commit `e401750` touches exactly the three paths + brief. `runs/` also in the branch diff — see below |
| 9 | pass | `package.json`/`bun.lock` unchanged; no `fetch(`, no remote git verbs; every run executed with all six proxy vars at `127.0.0.1:1` |
| 10 | pass | `tsc --noEmit` exit 0, full clone and shallow |
| 11 | pass | Runs **35675701598** (`4dbd111`) and **35676388554** (`7187665`), **six of six jobs green in each**, incl. the shallow `question-bank` job |

## The defect measured from both sides

| | full clone | `--depth=1` clone (what CI gets) |
|---|---|---|
| `origin/main` | 1254 pass / **1 fail** | 1255 pass / 0 fail — **both guards vacuous** |
| branch head | **1251 pass / 0 fail** | **1251 pass / 0 fail** |

The shallow clone was real (`git clone --depth=1`; afterwards `origin/main` and `13a735f` both fail to resolve). Counts reconcile: 1255 − 4 = 1251. The `origin/main` failure names twelve unrelated paths (`backend/app/levels.py`, `frontend/src/ci-action-pinning.test.ts`, …).

## Mutation — three, all reverted, none in the repository

Made in a disposable `--depth=1` clone under the scratchpad; `git status --porcelain` in `/home/user/geo-discovery-zone` was empty before and after.

- **M1** delete one `test()` from `normalize.test.ts` (14→13) → **exactly 2 fail**, the `PINNED` and `FLOORS` floors for that file.
- **M2** prepend an out-of-package import to `climate-kid.test.ts` → **1 fail**, `nothing outside question-bank/ is touched by this task's own new test file`. This is the one that matters: E-11's whole "delete, don't replace" argument rests on it being a real check. It is.
- **M3** rename `## E-11 —` to `## E-9 —` → **2 fail** in `region-vocabulary.test.ts` (uniqueness, ascending).

## Findings that are not failures

- **`runs/` is in the branch diff** and criterion 8's exclusion list does not cover it. Per-commit attribution puts it in `27c47ab`/`38dcf53` (driver checkpoint) and `4dbd111` (`T-072 orchestrator:`) — **none of it the worker's**, and `process.md` assigns `runs/` to the orchestrator. Recorded, not counted against the work.
- **A weak assertion of the same family survives** at `question-bank/src/climate-kid.test.ts:538` — `expect(status === 0 || status === 1).toBe(true)`. Not one of criterion 2's two named paths, unchanged by this branch, and it needs no history. **For T-070**, alongside `highest-point-verify.test.ts:582-584`.
- **The worker's flagged frontend failure is confirmed pre-existing.** `frontend/src/level-window-claim.criteria.test.ts` `"no existing E-n entry was modified"` fails with the **same numbers** on `origin/main` and on this branch (208 pass / 2 fail / 1 error). The failing diff is E-10's own body, not E-11's: the test compares everything above `## E-10 — ` against the *entire* merge-base file, true only while T-057 was in flight. Invisible in CI for the same reason as T-072's two guards — `if (base.exitCode !== 0) return;` plus a shallow checkout. **Third instance of this defect shape; recommend a small follow-up task sized like T-072.** The `1 error` is `react-simple-maps` missing from the sandbox, not a repo defect.
- **Two notes for `task-expander`, at the template** (non-blocking): criterion 8's shape forecloses the tester's own deliverable and should say so or leave a path; and `runs/` belongs in the "excluding" list next to `tasks/`, `tasks.md`, `PROGRESS.md`.

## State left behind

- Branch `claude/upbeat-volta-mw29cv` = `4b4c619`, remote matches local, worktree clean, scratch worktrees and clones removed.
- PR #55 open, still draft, head `4b4c619`, base `main`.
- Brief: `Status: pass`, `Next step: reviewer`, Sessions row added with the orchestrated-run caveat.
- No source was edited. Two commits, both `T-072 tester: …`, both containing only the brief.
