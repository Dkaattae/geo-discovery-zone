# T-007 — `conventions.md` describes a repo that no longer exists — run log

**Task:** T-007 · **Branch:** `claude/t007-orchestrator-startup-8orc9r` · **PR:** #33
**Started:** 2026-09-04 · **Outcome:** ready for merge — PR #33, approved and swept by the reviewer

## Round 1 — task-expander — 2026-09-04
`Next step` on entry: `—` (no brief existed) → on exit: `worker`

**T-007 brief written, pushed, and draft PR #33 is open. It needs a human approval before the worker starts.** Fourteen acceptance criteria, all satisfiable by editing one file — `conventions.md`. Nothing in the task is undecided; nothing is blocked.

- **Brief:** `/home/user/geo-discovery-zone/tasks/T-007-conventions-current.md`
- **Branch:** `claude/t007-orchestrator-startup-8orc9r` (session-assigned, recorded in the `Branch:` header — this is where the worker and tester push)
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/33 — draft, criteria as the body
- **Push confirmed:** `origin/claude/t007-orchestrator-startup-8orc9r` at `4b97aad`; `git diff --name-only origin/main origin/<branch>` returns exactly `tasks.md` and `tasks/T-007-conventions-current.md` — no source, tests or config, per the expander envelope (`process.md` step 2, D-7).

## Survey — nothing was already done

All six gaps in the queue entry re-confirmed against the tree today. Wrong in `conventions.md` right now:

| Says | Reality |
|---|---|
| `api/ … not built yet` (line 11) | built, 242 tests, in `backend/` |
| `# api (once it exists)` / `cd api && uv sync` (52–55) | `make -C backend dev\|test\|check\|migrate` |
| frontend: `dev`, `lint`, `format` (41–43) | `bun run typecheck` exists and CI runs it; `bun test` runs 88 tests |
| nothing about CI | six jobs in `ci.yml` |
| nothing about the database | `GEO_DATABASE_URL`, SQLite default, Postgres tested |
| layout omits `e2e/`, `fixtures/` | both exist |

Correct and left alone: the `## Code` and `## Network` sections.

## Two things worth your attention

- **`CLAUDE.md` is stale in exactly the same way and I put it out of scope.** Line 4 reads ``` `api/` FastAPI + Postgres (uv, not built yet)``` and line 51 says `uv add` / `uv run` in `api/`. `CLAUDE.md` is loop-gated — a `P-n` ticket done by hand, and `run-loop.sh` G1 refuses a diff touching it. A worker that "helpfully" fixed it would trip the gate, so criterion 13 forbids it by name. **Filing the `P` ticket is your call**; I cannot write `process-tasks.md`.
- **This does not decide T-046** (`backend/` vs `api/`). The brief records where the service is today, which is what T-007's entry asks and what T-046 says to fold in. If T-046 later renames, `conventions.md` changes again — cheaply, because criterion 1 makes the drift visible.

Also noted and deliberately not fixed: `PROGRESS.md`:30 and :322 become false when this lands — reviewer's sweep, not the worker's edit; and `e2e/README.md` uses `E2E_BASE_URL` where `backend/Makefile` uses `GEO_E2E_BASE_URL`, which is neither task.

## Criteria shape

Most are mechanically checkable — the Layout block's paths must resolve, every `make` target named must exist in `backend/Makefile`, every `bun run <script>` must be a key in the right `package.json`, and the CI job list must be **set-equal** to `ci.yml`'s `jobs:` keys (a doc listing five of six is the failure being fixed). A Review checklist covers the part only a person can judge — whether a cold session could actually run the four packages from the file alone. A shape check is welcome inside an existing suite (`frontend/src/lint-gate.test.ts` is the precedent) but not required, and no new runner, job or dependency.

**Next step (expander's own note, not the orchestrator's):** approve on PR #33, replace `Approved: pending` in the brief with your name and the date, then run `worker`.

## Orchestrator note

This is an unattended relayed run — moment 1 (brief approval) does not happen; the
orchestrator stamped `Approved: orchestrator — 2026-09-04, unattended run` on the
brief header without reading the criteria above, per `process.md` "Where the loop
stops for a human" and `.claude/agents/orchestrator.md` "Approval". Relaying to
`worker` next.

## Round 2 — worker — 2026-09-04
`Next step` on entry: `worker` → on exit: `tester`

Push confirmed landed on `origin/claude/t007-orchestrator-startup-8orc9r` at commit `5a4f191`.

### Summary

**Rewrote `conventions.md`** to match the built repo — the only production file this task touches. All 14 acceptance criteria are satisfied; full mapping is in the brief's `## Handoff`. `CLAUDE.md`, `PROGRESS.md`, `test-guidelines.md`, and the `## Code`/`## Network` sections were deliberately left untouched, per the brief's Out of scope.

**Verified:**
- `question-bank`: typecheck clean, `bun test` 19/19 pass
- `backend`: `make -C backend check` — 233 passed, 9 skipped (Postgres-only, skip on SQLite by design)
- `frontend`: `bun test` 88/88 pass, `bun run lint` exit 0
- `frontend`: `bun run typecheck` **could not be confirmed** — this sandbox's package registry (`europe-west1-npm.pkg.dev`) returns 403 on some `react-simple-maps` transitive `@types` deps, unrelated to this docs-only change (`bun.lock` untouched, `node_modules/` gitignored). Flagged in the Handoff for the tester.

**One thing flagged but not fixed (named owner: reviewer):** `README.md:202` lists five CI jobs, missing `e2e` — the same staleness this task fixes in `conventions.md`, but out of this brief's Constraints (only `conventions.md` is listed as a worker-editable file).

Files changed: `/home/user/geo-discovery-zone/conventions.md`, `/home/user/geo-discovery-zone/tasks/T-007-conventions-current.md`.

Brief status set to `awaiting verification`, next step `tester`. Note: this run is orchestrated, so the worker and task-expander Sessions rows share one session id (`cse_01AtuAKBQ3YW1N9bz4feeDTP`) by design — flagged in the Sessions table per `process.md`'s note on relayed-run isolation, not a violation for the tester to catch.

## Orchestrator note

G0 (Next step names exactly one role: `tester`), G1 (diff vs `origin/main`: `conventions.md`,
`runs/T-007-conventions-current.md`, `tasks.md`, `tasks/T-007-conventions-current.md` — no
gated path), G2 (`Approved:` present, not `pending`), and G4 (branch matches the header) all
pass. Relaying to `tester` next, in a fresh spawn.

## Round 3 — tester — 2026-09-04
`Next step` on entry: `tester` → on exit: `reviewer`

**Verdict: pass.** All fourteen criteria hold. Committed as `a73edcf` and pushed to `claude/t007-orchestrator-startup-8orc9r` (the brief's `Branch:` header, which matched my checked-out branch); confirmed the remote ref is now `a73edcf`, so PR #33 sees it. **Next step: `reviewer`.**

**Independence — read this before trusting the pass.** This is an orchestrated run (`runs/T-007-conventions-current.md` exists), so my session id `cse_01AtuAKBQ3YW1N9bz4feeDTP` is the *same* one listed for `worker` and `task-expander`. The Sessions-table check did not pass and could not. What I have is the weaker form: a freshly spawned agent with its own context window that never saw the worker's transcript, working from the brief and the committed repo only. Every expected value came from a criterion's wording or the repo file it names as authority — never from `conventions.md`, the artefact under test.

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | All 7 Layout paths resolve; one test per path |
| 2 | pass | All seven named with a non-empty description |
| 3 | pass | Three forbidden strings absent; regex for equivalent "not built" claims finds nothing |
| 4 | pass | No `api/` after stripping `/api/v1`; companion test asserts `/api/v1` is still there, so deleting it cannot satisfy the check |
| 5 | pass | Names the fixture, both test files, and the one-side-turns-red consequence |
| 6 | pass | Every `make -C backend <target>` in the doc parsed against `backend/Makefile`'s real targets |
| 7 | pass | `migrate` and `revision`, both defined |
| 8 | pass | `GEO_DATABASE_URL`, SQLite default, Postgres supported and tested |
| 9 | pass | Every `bun run <script>` checked per-package against `frontend/`, `question-bank/`, `e2e/` `package.json` |
| 10 | pass | Doc's job list set-equal to `jobs:` keys in `ci.yml`; tested both directions (drop a job, add a fake one) |
| 11 | pass | Names both files, "one origin", links `README.md`; no `docker run`, `-p`/`-v`, port mapping or `atlas-postgres` |
| 12 | pass | 7 links, all relative, all resolve |
| 13 | pass, noted | Only `conventions.md`, the brief, `tasks.md`, and the orchestrator's run log differ from `origin/main`; the entire "In particular" list is byte-identical. Worker's commit `5a4f191` touched exactly `conventions.md` + brief |
| 14 | pass | No manifest, lockfile or CI job in the diff; tests pass with all six proxy vars at `http://127.0.0.1:1` |

**Two things for the reviewer to weigh, not silently absorbed by me:**

- **`runs/T-007-conventions-current.md` differs from `main` and criterion 13 does not list it.** Strictest reading, that is a violation. I did not fail on it: it is the *orchestrator's* log, written by neither worker nor tester, mandated by `process.md` for a relayed run, and the criterion's "In particular" list is fully satisfied. The call is the reviewer's.
- **Criterion 3 judgement call.** `conventions.md:10` reads "serving `/api/v1` and, once built, the frontend on the same origin". "once built" is about the frontend's static bundle (covered by `backend/tests/test_frontend_serving.py`), not the API/backend/database, and is not one of the three forbidden strings. Nearest thing in the file to the outlawed phrasing.
- The worker's flag about `README.md:202` (five CI jobs, missing `e2e`) is confirmed still stale, and correctly left alone.

**Suite:** frontend `bun test` 138 pass / 0 fail (88 pre-existing + 50 new), lint exit 0, question-bank typecheck clean and 19 pass, `make -C backend check` 233 passed / 9 skipped. **One caveat the worker asked me to check:** frontend `bun run typecheck` emits 4 errors, all in `frontend/src/components/UsMap.tsx` (`react-simple-maps`, `us-atlas`). Reproduced and confirmed pre-existing — byte-identical with the new test file removed, the packages are declared dependencies absent from `node_modules` (sandbox registry 403), `bun.lock` unchanged, `frontend/src` otherwise byte-identical to `origin/main`. Not caused by this task.

**Mutation testing:** 23 temporary edits to `conventions.md`, in two scripted rounds, each restored immediately. Every one turned the expected test red — none stayed green. `git status` after both rounds showed `conventions.md` unmodified. No source file was edited at any point.

**Files:**
- `frontend/src/conventions-doc.test.ts` — new, the one test file the Constraints allow
- `tasks/T-007-conventions-current.md` — Verdict, Status `pass`, Next step `reviewer`, Sessions row added

## Orchestrator note

G0 (`tester`), G1 (diff vs `origin/main`: `conventions.md`, `frontend/src/conventions-doc.test.ts`,
`runs/T-007-conventions-current.md`, `tasks.md`, `tasks/T-007-conventions-current.md` — no
gated path), G2 (`Approved:` present), G4 (branch matches) all pass. `Status: pass`, so no G3
round to count. Relaying to `reviewer` next, in a fresh spawn.

## Round 4 — reviewer — 2026-09-04
On entry, brief `Status`: `pass` · `Next step`: `reviewer` — on exit: brief deleted (swept), PR #33 marked ready

**Approved, swept, and PR #33 is ready for merge.** All six CI jobs are green on the sweep head `fc9cb6a`. Did not merge — that is Dkaattae's (`process-decisions.md` D-4).

### Verdict

| Check | Result |
|---|---|
| Every role's work in the PR | Yes — expander `cd91bab`/`4b97aad`, worker `5a4f191`, tester `a73edcf`, orchestrator logs, all on `claude/t007-orchestrator-startup-8orc9r` |
| Lanes held | Expander touched only `tasks.md` + brief; worker only `conventions.md` + brief; tester only its one test file + brief (D-7 check passes) |
| Suite | frontend 138, question-bank 19, backend 233 passed / 9 skipped, lint clean; six CI jobs green |
| Envelope | Inside it — no dependency, no `openapi.yaml`, no migration, no plan change, no child-facing text. Marked ready with no escalation |

`conventions.md` reads as a conventions file rather than a second README (Docker is six lines and a link), every command in it is read out of `backend/Makefile` or a `package.json`, and the tester's `frontend/src/conventions-doc.test.ts` takes its expected values from those authorities rather than from the doc under test.

### Findings — none blocking, filed as `tasks.md` T-058

1. `README.md:202` — "CI runs all **five** jobs" and names five; there are six, `e2e` has run since T-054.
2. `conventions.md:98` — "checks the lockfile did not move" holds for four of six jobs; `backend-postgres` and `integration` install `--frozen` but have no `git diff --exit-code` step.
3. `conventions.md:66` — "thirteen full user journeys" hardcodes a count, the pattern T-047 already decided against maintaining.
4. `conventions.md:10` — "once built" clause; accepted as accurate, logged as optional wording only.

All worker/tester flags disposed: the worker's unrunnable `bun run typecheck` resolved (CI's `frontend` job green; sandbox-only registry 403, `bun.lock` unchanged). The tester's `runs/` vs criterion 13 question decided as not a violation.

### Queue trimmed

- T-007 deleted from `tasks.md`; brief deleted; criteria preserved verbatim in the PR body.
- T-046 rewritten — smaller, since `conventions.md` no longer says `api/`.
- T-058 added; §A's "already in place" table updated.
- `PROGRESS.md` lines 30 and 322 corrected; T-007 logged under "Completed tasks".

### One thing for a human, not a merge blocker

`CLAUDE.md` lines 4 and 51 still say the API lives in `api/` and is "not built yet" — after this merges, `CLAUDE.md` and `conventions.md` disagree and `conventions.md` is correct. `CLAUDE.md` is loop-gated, needs a hand-written `P` ticket in `process-tasks.md`. Flagged in the PR body and `PROGRESS.md` "Known gaps" rather than filed by the reviewer, per the brief's Out of scope.

## Orchestrator note — run ends here

The reviewer approved, swept the brief, and marked PR #33 ready — the terminal state for a
relayed run (`process.md`: "you stop" once the reviewer marks the PR ready). Confirmed:
`origin/claude/t007-orchestrator-startup-8orc9r` is at `fc9cb6a`, `tasks/` holds only
`README.md`/`TEMPLATE.md` (swept), and the diff vs `origin/main` (`PROGRESS.md`,
`conventions.md`, `frontend/src/conventions-doc.test.ts`, `runs/T-007-conventions-current.md`,
`tasks.md`) touches no gated path. No `Next step` to route — the brief no longer exists.
Handing PR #33 to Dkaattae to merge. This orchestrator run does not pick a next task.
