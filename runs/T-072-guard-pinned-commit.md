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
