# T-046 — Decide: `backend/` or `api/` — keep `backend/`

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** orchestrator — 2026-11-13, unattended run. See `runs/T-046-backend-directory-name.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-046
**Branch:** `claude/relaxed-allen-5ro49x`
**PR:** #141, opened draft at expand time, built from the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-13 | cse_011oDiJd2dgRHzBRDwBhvmNz |
| worker | 2026-11-13 | cse_011oDiJd2dgRHzBRDwBhvmNz |

> **The decision in this brief was made by the expander, and is the thing to
> approve.** The queue entry says "Either is fine, and deciding is not
> optional", and names no person who must make the call, so this brief makes it:
> **keep `backend/`, and retire `api/` as a name for the directory.** Reasons are
> under Goal. If Dkaattae would rather rename to `api/`, do not approve; send the
> brief back to the `task-expander`, because a rename is a different, much larger
> set of criteria (Dockerfile, `ci.yml`, `backend/Makefile`, every doc and test
> path) and none of the criteria below would survive it.

## Goal

The directory has been `backend/` since the API was built, and every doc a `T`
task may edit already says so. What is missing is the decision itself, written
down where the next reader will find it, and the last stale sentence outside the
loop-gated `CLAUDE.md` that still treats the name as open. Keeping `backend/`
costs two lines in `CLAUDE.md` (a hand-written `P` ticket). Renaming would touch
the Docker build, `ci.yml` (11 mentions), `backend/Makefile`, and roughly a
hundred tracked files that say `backend/`, for no change in behaviour.

## Acceptance criteria

"Outside the excluded paths" below means: every tracked file except
`CLAUDE.md`, `tasks.md`, `PROGRESS.md`, `process-tasks.md`,
`process-decisions.md`, `engineering-decisions.md`, anything under `runs/` or
`tasks/`, and `frontend/src/test-guidelines-backend.criteria.snapshot.ts` (which
mentions `` `api/` `` only to assert its absence from `test-guidelines.md`).

1. **The decision is a numbered entry.** `engineering-decisions.md` contains
   exactly one heading that starts `## E-31 — `, it is the last `## E-` heading
   in the file, and no other `## E-31` heading exists. The heading text says the
   service directory is `backend/` (it contains the string `` `backend/` ``).
2. **E-31 states the decision and its date.** The E-31 entry (from its heading
   to the next `---` line or end of file) contains a bold `**Decided:**` or a
   bold date line naming `T-046`, and a sentence saying `api/` is not used as a
   directory name. It contains both strings `` `backend/` `` and `` `api/` ``.
3. **E-31 says why, including what a rename would have cost.** The entry names
   at least these three files a rename would have had to change: `Dockerfile`,
   `.github/workflows/ci.yml` (or `ci.yml`), and `backend/Makefile`.
4. **E-31 names what is left and who owns it.** The entry says that `CLAUDE.md`
   still says `api/`, names both places by line or by quoted text (on `main` at
   `b10fa64` they are line 4, `` `api/` FastAPI + Postgres (uv, not built yet) ``,
   and line 58, `` `uv add` / `uv run` in `api/` ``), and says they are
   loop-gated and need a hand-written `P` ticket rather than a `T` task.
5. **E-31 has a revisit trigger.** The entry contains a line starting
   `**Revisit when**`, naming a concrete condition (for example: a second
   service is added beside `backend/`, or the repo is restructured so `backend/`
   no longer describes one service). "If needed" or "if it becomes a problem"
   does not count.
6. **E-31 records the option not taken.** The entry contains the word `rename`
   in a sentence describing renaming `backend/` to `api/` as the option
   considered and not taken.
7. **`backend/README.md` no longer treats the name as open.** The line
   `- The directory is \`backend/\`, where \`conventions.md\` §Layout says \`api/\`.`
   (on `main` at `b10fa64`, line 263, under `## Known gaps`) is gone, and
   `backend/README.md` contains no occurrence of the string `` `api/` ``.
8. **The other Known-gaps bullets in `backend/README.md` are untouched.** Apart
   from the removal in criterion 7, the `## Known gaps` section of
   `backend/README.md` is byte-identical to `main`'s at `b10fa64`, and no other
   line of `backend/README.md` changes.
9. **No tracked file outside the excluded paths refers to an `api/`
   directory.** On the task branch,
   `git grep -nIE '(^|[^/A-Za-z0-9_.-])api/' -- . ':!CLAUDE.md' ':!tasks.md' ':!PROGRESS.md' ':!process-tasks.md' ':!process-decisions.md' ':!engineering-decisions.md' ':!runs/' ':!tasks/' ':!frontend/src/test-guidelines-backend.criteria.snapshot.ts'`
   prints nothing, and `git grep -nIw 'cd api'` with the same exclusions prints
   nothing. (On `main` at `b10fa64` the first prints only
   `backend/README.md:263`; the second prints nothing.)
10. **Nothing moves on disk.** No file is renamed, added or deleted under
    `backend/`, and no directory named `api` exists at the repo root.
    `Dockerfile`, `docker-compose.yml`, `.github/workflows/`, `backend/Makefile`,
    every `package.json`, `backend/pyproject.toml` and every lockfile are
    byte-identical to `main`'s at `b10fa64`.
11. **The loop-gated files are untouched.** The PR's diff against `main` does
    not touch `CLAUDE.md`, `process.md`, `process-decisions.md`, or anything
    under `.claude/` (the orchestrator's G1 would halt the task).
12. **The diff is only these files.** The PR's diff against `main` touches only
    `engineering-decisions.md`, `backend/README.md`, this brief, and — at the
    reviewer's sweep — `tasks.md` and `PROGRESS.md`. No test file is added,
    deleted or modified.

Every criterion here is about doc wording or the repo's shape, which
`test-guidelines.md` forbids as a committed test in all three packages. **The
tester checks each one by hand** and puts the command and its output, or the
quoted text, in the Verdict. Do not commit a test for any of them, and do not
add a pin for criteria 8, 10 or 12 (P-17).

## Out of scope

- **`CLAUDE.md` lines 4 and 58.** Loop-gated (G1). The reviewer, at the sweep,
  makes sure a `P` ticket exists for them in `process-tasks.md`, or says in its
  findings that one is needed. The worker does not touch `CLAUDE.md` or
  `process-tasks.md`.
- **`PROGRESS.md` and `tasks.md`.** `PROGRESS.md` line 34 ("Which name wins is
  still T-046") and line 32 (which says `CLAUDE.md` "lines 4 and 51"; it is now
  58) are the reviewer's sweep, not the worker's.
- **Renaming anything.** No directory, file, Make target, Docker stage, CI job
  or import path changes.
- **The rest of `backend/README.md`'s Known gaps.** Two other bullets there
  look stale too: "CI only runs the SQLite path … nothing runs it automatically"
  (CI has a `backend-postgres` job, per `conventions.md`'s CI section), and the pin-grading bullet (T-045, PR #115, made `pin_*` a 422).
  Leave them byte-identical (criterion 8); the reviewer queues them as a new
  `tasks.md` entry.
- **`geoquizdataplan.md` §5.1**, whose Backend row still says "Does not exist
  yet". Product doc, different staleness, not this task.
- **`runs/`, old `PROGRESS.md` entries and `process-decisions.md`**, which
  mention `api/` as history. History stays as written.
- **`tasks.md` §A's table**, which still names `conventions-doc.test.ts` and
  doc-count guards that Dkaattae's off-queue commits `8cf40b6` and `d594b38`
  deleted. Noted for the reviewer; not this task.

## Constraints

- **Files expected to change:** `engineering-decisions.md` (append E-31 after
  E-30, with a `---` separator above it, in the file's existing style:
  heading, `**Decided:**` or dated lead paragraph, reasons, options not taken,
  `**Revisit when**`), and `backend/README.md` (delete one line).
- **E-31 is the next unused number.** E-30 is the highest entry on `main` at
  `b10fa64`. If another task merges an E-31 first, take the next free number
  and say so in the Handoff; criteria 1–6 then apply to that number.
- **No dependency, no lockfile change, no test added.**
- **Content rules** (`CLAUDE.md`): nothing here reaches a child.

## Context

Required reading for the worker and the tester.

- [`tasks.md`](../tasks.md) T-046 — the queue entry, including why the doc
  half is already done.
- [`PROGRESS.md`](../PROGRESS.md) "Layout" (lines 20–34) — what is already
  true: `conventions.md` says `backend/` since T-007, `test-guidelines.md`
  since T-047.
- [`conventions.md`](../conventions.md) line 10 (Layout) and lines 86–98
  (commands) — the `backend/` name in use.
- [`backend/README.md`](../backend/README.md) `## Known gaps`, line 263.
- [`engineering-decisions.md`](../engineering-decisions.md) header (when to add
  an entry; "a decision with no trigger for revisiting is a habit") and E-30
  for the current shape of an entry.
- [`CLAUDE.md`](../CLAUDE.md) lines 4 and 58 — read only, to quote them in
  E-31.
- [`test-guidelines.md`](../test-guidelines.md) — the three per-package rules
  that make this a by-hand verification.

**What is already true (survey, 2026-11-13, `main` at `b10fa64`):**
`conventions.md`, `test-guidelines.md`, `README.md`, `Dockerfile`, `ci.yml` and
`backend/Makefile` all use `backend/`. `git grep` for an `api/` directory
outside the excluded paths finds one line: `backend/README.md:263`. No `api/`
directory exists. No P ticket in `process-tasks.md` mentions `api/`.

## Review checklist — non-testable tasks only

- [ ] Dkaattae agrees with **keep `backend/`** (the expander's call, see the
      note under the header).
- [ ] E-31 reads as a decision a newcomer could act on: which name, why, what
      the rename would have cost, what is left in `CLAUDE.md`, when to revisit.
- [ ] A `P` ticket exists, or is queued at the sweep, for `CLAUDE.md` lines 4
      and 58.

## Handoff

**TL;DR:** E-31 appended to `engineering-decisions.md` (keep `backend/`), and the one stale Known-gaps line removed from `backend/README.md`. Two files, no code, no tests. Backend and question-bank suites green; frontend has 4 pre-existing reds from packages this sandbox could not download (same on `b10fa64` without this change).

**Files changed**

- `engineering-decisions.md` — appended `---` then `## E-31 — The service directory is \`backend/\`; \`api/\` is not a directory name` at end of file. E-31 was free (E-30 is still the last on `b10fa64`).
- `backend/README.md` — deleted line 263, `- The directory is \`backend/\`, where \`conventions.md\` §Layout says \`api/\`.` Nothing else touched.

**Where each criterion lives**

| # | Where |
|---|---|
| 1 | `engineering-decisions.md`, last `## E-` heading, `## E-31 — The service directory is \`backend/\`…` |
| 2 | E-31 first paragraph: `**Decided: 2026-11-13 (T-046).**` and "`api/` is not used as a directory name anywhere in the repo" |
| 3 | E-31 **Why** and **Option not taken**: `Dockerfile`, `.github/workflows/ci.yml`, `backend/Makefile` |
| 4 | E-31 **What is left, and who owns it**: quotes `CLAUDE.md` line 4 and line 58, says loop-gated (G1), needs a hand-written `P` ticket, not a `T` task |
| 5 | E-31 last paragraph, `**Revisit when** a second service is added beside \`backend/\` … or the repo is restructured into a \`services/\` or \`apps/\` layout` |
| 6 | E-31 **Option not taken**: "*Rename \`backend/\` to \`api/\`* …" |
| 7, 8 | `backend/README.md` — `git diff b10fa64 -- backend/README.md` is the single `-` line |
| 9 | Both `git grep` commands from the criterion print nothing (exit 1) on this branch, run by the worker |
| 10–12 | `git diff --stat b10fa64` shows only `engineering-decisions.md`, `backend/README.md` and this brief (plus the orchestrator's `runs/` log from before the worker) |

**Deliberately not done**

- `CLAUDE.md`, `process-tasks.md`, `PROGRESS.md`, `tasks.md` — out of scope; the P ticket and the sweep are the reviewer's.
- The two other stale Known-gaps bullets (SQLite-only CI, pin grading) — left byte-identical per criterion 8.
- No test committed (brief: all criteria are by-hand).

**Contradictions with the brief:** none found. One wording note: E-31 says `/api/v1` is a route prefix and unaffected — `backend/Makefile` line 11 has `/api/v1`, which criterion 9's regex correctly does not match (preceded by `/`).

**How to run**

- Criterion 9: the two `git grep` commands verbatim from the criterion.
- Suites: `make -C backend check` (809 passed, 9 skipped); `cd question-bank && bun test` (229 pass) plus typecheck, lint, format:check all clean; `cd frontend && bun test`, `bun run typecheck`, `bun run lint`, `bun run format:check`.

**Frontend reds — environmental, not stale tests, not from this change.** `bun install --frozen-lockfile` failed with `ProxyConnectFailed (403)` downloading `react-simple-maps@3.0.0`, `d3-geo@2.0.2`, `@types/geojson`. So `bun test` shows 4 fail / 4 errors (`UsMap.tsx`, `t051-map-click.test.tsx`, `t051-tester.criteria.test.tsx` cannot find `react-simple-maps`) and `tsc` reports the matching TS2307s. I stashed my change and reran on the base: identical 4 fail. Lint and format:check pass. Tester: rerun in an environment that can install the lockfile, or confirm the same reds on `b10fa64`.

**Tests made stale:** none.

## Verdict

## Notes

- **Session id is shared with the expander.** `$CLAUDE_CODE_REMOTE_SESSION_ID` returned `cse_011oDiJd2dgRHzBRDwBhvmNz` for this worker, the same id the expander recorded — the orchestrator ran both roles as subagents of one remote session. The tester's isolation check reads this table; the orchestrator (owner) should confirm the tester runs as a separate subagent, and a human decides whether subagent isolation under one remote session id is acceptable (`process-decisions.md`, not this task).
- **Frontend could not install** in this sandbox (proxy 403 on npm tarballs). Owner: tester to rerun the frontend suite where install works; not a code issue.
- **No `---` above E-30** in the current file, though the brief asked for one above E-31. Added it as the brief says; the file's separators are inconsistent anyway. Reviewer to confirm or drop.
- Survey matched the brief exactly: one `api/` hit outside exclusions, at `backend/README.md:263`.
