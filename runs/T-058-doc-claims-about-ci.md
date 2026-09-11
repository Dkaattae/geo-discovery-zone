# T-058 — Three doc claims that are true-ish, and one that is not — run log

**Task:** T-058 · **Branch:** `claude/t009-orchestrator-startup-uot0vc` · **PR:** #35
**Started:** 2026-09-05 · **Outcome:** ready for merge

## Round 1 — task-expander — 2026-09-05
`Next step` on entry: (none — no brief existed) → on exit: `worker`

**T-058 expanded, PR [#35](https://github.com/Dkaattae/geo-discovery-zone/pull/35) open as draft, waiting on approval before the worker runs.** Ten criteria over `README.md` and `conventions.md`; the diff is one new file and nothing else.

- **Picked:** T-058, the first entry in `tasks.md` §A with no dependencies. `tasks/` held only `README.md` and `TEMPLATE.md`, so the last cycle's sweep was complete — nothing to clean up.
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-058-doc-claims-about-ci.md`
- **Branch:** `claude/t009-orchestrator-startup-uot0vc` (assigned by the environment), recorded in the `Branch:` header. Push confirmed at `origin/claude/t009-orchestrator-startup-uot0vc`, head `6ca3426`.
- **Status:** `awaiting approval` · **Next step:** `worker` · **Approved:** `pending`.

## What the survey found

| Claim | Where | Reality |
|---|---|---|
| CI runs "all **five** jobs", names five | `README.md:202-203` | Six — `e2e` missing |
| "**CI only runs the SQLite path**" | `README.md:229-231` | False since `backend-postgres` landed (`ci.yml:197-244`) — **not in the queue entry; I found it and folded it in** |
| "Each … checks the lockfile did not move" | `conventions.md:98` | Four of six. `backend-postgres` (`ci.yml:227`) and `integration` (`ci.yml:266`) have no `git diff --exit-code` step |
| "thirteen full user journeys" | `conventions.md:66` | True, unasserted, stale next e2e task |
| "221 tests", "28 tests" | `README.md:183`, `:185` | 242 and 30; also unasserted |

**Already true, so no criterion demands it:** `conventions.md`'s job list is correct and already held set-equal to `ci.yml` by `frontend/src/conventions-doc.test.ts:325-336`; `conventions.md:10`'s "once built" clause is accurate (`backend/tests/test_frontend_serving.py`). `README.md` is under no such test, which is the mechanism behind every row above — hence criteria 2 and 6, which require the two `ci.yml`-derived claims to be asserted rather than merely corrected.

## The one judgement call, flagged on the PR

`tasks.md` offers two ways to fix `conventions.md:98`: qualify the sentence, or add the two missing `Lockfile unchanged` steps. **I ruled the ci.yml route out of scope** — `process.md` ("Work on the loop itself never enters the loop") puts workflow changes outside a `T` task, and criterion 9 makes that boundary checkable (`git diff main -- .github/` empty). The guard is genuinely cheap and worth having, so the brief asks the reviewer to queue it at sweep, and the PR body invites you to overturn the call at approval time if you would rather have the steps than the qualified sentence. I did not edit `tasks.md` or `PROGRESS.md` — there was nothing to sweep, and the follow-on belongs to the reviewer.

Per the run's instructions I ran no build, test or lint — Bash was git and the PR call only.

## Round 2 — worker — 2026-09-11
`Next step` on entry: `worker` → on exit: `tester`

Push confirmed landed on `origin/claude/t009-orchestrator-startup-uot0vc` at commit `5be9158`.

### Summary

**Fixed all four stale CI claims T-058 named, with tests holding each one.** Branch `claude/t009-orchestrator-startup-uot0vc`, commit `5be9158`, pushed and verified on remote. Status set to `awaiting verification`, next step `tester`.

**Files changed:**
- `/home/user/geo-discovery-zone/README.md` — CI sentence now says six jobs including `e2e`; Checks block gained the missing `e2e` command and dropped two unasserted test counts; the stale "CI only runs SQLite" bullet is removed.
- `/home/user/geo-discovery-zone/conventions.md` — lockfile-drift check now attributed only to `frontend`/`question-bank`/`backend`/`e2e` (still says all six install from a frozen lockfile); the unasserted "thirteen" e2e count is gone.
- `/home/user/geo-discovery-zone/frontend/src/conventions-doc.test.ts` — generalized existing helpers (`section`→`sectionOf`, `backendTargetsNamedInDoc`, `bunScriptsByPackage`) so README's claims reuse conventions.md's proven `ci.yml`-parsing logic rather than a fourth parser; added six `describe` blocks covering all 8 criteria (search `T-058 #`).
- `/home/user/geo-discovery-zone/tasks/T-058-doc-claims-about-ci.md` — Handoff, Sessions row, Status/Next step, Notes.

**One flagged judgment call:** criteria 7 and 8 (the e2e/backend/integration counts) were satisfied by *removing* the numbers rather than adding assertions — both criteria explicitly permit this, and asserting would have meant either fragile word↔digit matching (e2e) or a cross-language `pytest --collect-only` subprocess call from a frontend test (backend counts). Flagged in the brief's Handoff for reviewer confirmation.

**Verification:** `git diff main -- .github/` is empty (criterion 9); manually mutated `ci.yml`/README in both directions to confirm the new job-list and lockfile-attribution tests actually go red, then restored. `cd frontend && bun test` (174 pass, 0 fail) / `bun run typecheck` / `bun run lint` (0 warnings) all pass — typecheck shows only pre-existing, documented `UsMap.tsx` errors (`PROGRESS.md:268-271`) from a private-registry package this sandbox's proxy can't reach, unrelated to this task's diff.

## Round 3 — tester — 2026-09-11
`Next step` on entry: `tester` → on exit: `reviewer`

**PASS.** All ten criteria of T-058 hold. Verdict written, committed and pushed to `claude/t009-orchestrator-startup-uot0vc` (PR #35) as `4f394c5`; remote confirmed. **Next step: `reviewer`.**

Two caveats a reader must not skip: my independence is the weaker orchestrated kind, and `bun run typecheck` is not green in this sandbox for a reason provably outside the diff.

### Criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | README names every job, right count | pass | `README.md:206-207`; set-equality with `ci.yml` `jobs:` keys. M1, M3, M3b |
| 2 | Test red both directions | pass | M1 (drop `e2e` from README) red; M2 (7th job in `ci.yml`) red |
| 3 | No "CI skips Postgres" claim | pass | Bullet gone; M6 re-adds it → 4 tests red |
| 4 | Checks section names a real command per suite | pass | `cd e2e && bun run test` added; M7/M7b/M7c/M7d red |
| 5 | Lockfile check credited to the right four jobs | pass | M10 red; M5b (frontend diffs `package.json`) red |
| 6 | Test red both directions | pass | M4 (delete step) red; M5 (add step to `backend-postgres`) red |
| 7 | No unasserted e2e journey count | pass | "thirteen" removed; M8, M8b red |
| 8 | No unasserted suite size in Checks block | pass | "221"/"28" removed; M9 red |
| 9 | `.github/` byte-identical, no dependency | pass | `git diff main -- .github/` empty; no `package.json`/lockfile in the diff |
| 10 | Suite green, no network | pass with caveat | `bun test` 184 pass / 0 fail; lint clean at `--max-warnings 0`; typecheck below |

### What the tester did

- **15 mutations, 15 reds, all reverted** (md5sums re-checked; working tree clean). Mutation table is in the brief's Verdict.
- **Added 10 tests** to `/home/user/geo-discovery-zone/frontend/src/conventions-doc.test.ts` for four gaps where a criterion says more than the worker's blocks assert. Each is the *only* test that catches its mutation:
  - **Digit job counts** (criterion 1) — the worker's regex matches spelled words only, so `all 5 jobs` passed it (M3b).
  - **Checks *section*, not just the fenced block** (criterion 4) — the prose names `make -C backend test-integration-against` and `cd e2e && bun run install-browser`, neither under a test (M7d).
  - **"against the lockfile it installed from"** (criterion 5) — a job diffing the wrong file still counted (M5b).
  - **A journey count anywhere in `conventions.md`** (criterion 7), not just the `# e2e` comment (M8b).
- Factored `ciJobBlocks()` out of `jobsWithLockfileCheck()`; behaviour unchanged, all 78 tests in that file still pass.
- **Handoff verified on the branch** — `README.md`, `conventions.md` and the test file are all present at `5be9158`. Nothing stranded.

### Caveats

- **Independence is attested, not proven.** This is an orchestrated run (`runs/T-058-doc-claims-about-ci.md` exists), so `cse_01ACZu6WMBf4Kx8dTMZLKKuW` is listed against `task-expander` and `worker` as well as me. The Sessions-table check did not pass — it did not run. What I have is a fresh context window and committed files only.
- **Typecheck.** Four errors, all in `/home/user/geo-discovery-zone/frontend/src/components/UsMap.tsx`, which is untouched and byte-identical to `main`. `node_modules/react-simple-maps` and `us-atlas` are absent and `bun.lock` pins their tarballs at `europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache`, which this sandbox's proxy refuses. Same gap `PROGRESS.md:268-271` records for T-007; CI is the authority and `gh` is not installed here.

### For the reviewer

- `README.md:192` — "**The nine** Postgres-only tests skip on SQLite" is an unasserted test count in the Checks *section*. Pre-existing on `main`, and criterion 8 says "Checks **block**" and names only `:183`/`:185` (both inside the fence) while criterion 4 deliberately says "section" — so the tester did not fail on it and did not invent a test that would. Worth a small `tasks.md` entry.
- `ci.yml:279` still comments "thirteen full user journeys" — out of scope by criterion 9, but the same stale count survives this task.

## Round 4 — reviewer — 2026-09-11
`Next step` on entry: `reviewer` → on exit: — (PR marked ready; a person merges)

**Approved. PR #35 is ready for review, swept, and waiting on your merge — no escalation.**

- **Verdict:** approve. Four non-blocking findings, all queued rather than fixed. Nothing sent back to any agent.
- **Envelope:** clear on every count — tester passed, all six CI jobs green on the swept head `652848e`, no dependency, no `openapi.yaml`/migration/plan, no text a child reads, nothing outside Constraints except the expected sweep set.
- **State:** `draft: false`, `mergeable_state: clean`. I hold no merge tool; merging is yours (D-4).

### What I checked beyond the tester

| Check | Result |
|---|---|
| Every role's work in the PR | Yes — expander (2 commits), worker, tester, orchestrator, reviewer, all on `claude/t009-orchestrator-startup-uot0vc` |
| Role lanes against the diff | Held. Expander touched only `tasks/`; tester touched no source; orchestrator only `runs/` + the `Approved:` line |
| Docs actually true | Verified by hand, not just by the new tests: `check`, `test-postgres`, `test-integration`, `test-integration-against` are real `backend/Makefile` targets; `test` and `install-browser` are real `e2e/package.json` scripts; the lockfile split is exactly 4 of 6 in `ci.yml` |
| The tester's typecheck caveat | **Closed.** CI's `frontend (typecheck, lint, test)` is green on the head commit; the four local errors are all in `src/components/UsMap.tsx`, byte-identical to `main`, from the documented sandbox registry gap |

### Findings and where each went

1. `frontend/src/conventions-doc.test.ts` carries an internal duplicate — `jobsDocClaimsCheckLockfile()` and `jobsCreditedByDoc()` are the same function, and `longestBacktickRun()` was extracted while criterion 10 kept its inline copy. **Amended T-061**, which already owns that shape of duplication, rather than adding an entry it would have absorbed.
2. `README.md:192`'s "The nine Postgres-only tests" is the one unasserted count left (true today — 9 tests in `backend/tests/test_postgres.py`). **New `tasks.md` entry T-062.**
3. The brief asked me to queue the two missing `Lockfile unchanged` steps in `tasks.md`. **I put them in `/home/user/geo-discovery-zone/process-tasks.md` as P-3 instead**, with `ci.yml:279`'s stale "thirteen" — both are workflow changes, which `process.md` and `tasks.md`'s own preamble keep out of the loop. Same intent, right file; said so in the PR.
4. Two nits (a one-column comment misalignment in README's Checks block; a job-count regex slightly stricter than criterion 1) left alone and deliberately not queued.

**The worker's flagged judgment call is decided, not deferred:** removing the hardcoded counts rather than asserting them is accepted — the criteria offered it and the alternative adds cross-language machinery whose failure mode is the very drift the task closes.

**Sweep, pushed to the brief's branch and confirmed on the remote** (`652848e`): brief deleted, T-058's queue entry deleted, logged in `PROGRESS.md` under Completed tasks, the standing "`README.md:202` says five jobs" gap closed, `PROGRESS.md`'s own stale "ruff + 221 tests" corrected, `tasks.md` Foundations table given a `README.md` row, T-047's stale count made undriftable.

Files: `/home/user/geo-discovery-zone/tasks.md`, `/home/user/geo-discovery-zone/PROGRESS.md`, `/home/user/geo-discovery-zone/process-tasks.md`, `/home/user/geo-discovery-zone/README.md`, `/home/user/geo-discovery-zone/conventions.md`, `/home/user/geo-discovery-zone/frontend/src/conventions-doc.test.ts`.
