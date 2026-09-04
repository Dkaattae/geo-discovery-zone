# T-007 — `conventions.md` describes a repo that no longer exists — run log

**Task:** T-007 · **Branch:** `claude/t007-orchestrator-startup-8orc9r` · **PR:** #33
**Started:** 2026-09-04 · **Outcome:** in progress

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
