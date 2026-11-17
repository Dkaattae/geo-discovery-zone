# T-116 — source comments and the 422 detail still say "contract" — run log

**Task:** T-116 · **Branch:** `claude/epic-shannon-s86cuf` · **PR:** #148
**Started:** 2026-11-17 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-17
`Next step` on entry: `(none — no brief)` → on exit: `worker`

I wrote the T-116 brief and opened draft PR #148 for it. It now needs a person's approval before the worker can start.

- **Status:** `awaiting approval`
- **Next step:** `worker`
- **Approved:** `pending`
- **Branch:** `claude/epic-shannon-s86cuf`, which is also the brief's `Branch:` header
- **PR:** #148, draft, against `main`. https://github.com/Dkaattae/geo-discovery-zone/pull/148
- **Push confirmed:** `origin/claude/epic-shannon-s86cuf` is at `eddb6a2`. Its diff against `origin/main` is only `tasks/T-116-source-contract-wording.md`; `tasks.md` and `PROGRESS.md` were not touched.

**Why T-116.** It is the first task in the queue that nothing blocks:
- **T-085b:** needs a person to choose how Census data is reached.
- **T-056:** needs a design decision.
- **T-095:** needs a person to answer its question.
- **T-110:** needs a wording call from Dkaattae.
- **T-116:** has no dependency and no open PR. Nothing was in flight.

**What the brief says:**
- **The work:** about 20 source comments and the validation 422's `detail` still call `openapi.yaml` "the contract". They should stop, as E-14 says.
- **Full brief, not the light path:** the 422 `detail` can reach a screen through `ApiError.displayMessage` (`frontend/src/lib/api/client.ts:63-66`), which `routes/index.tsx:262` displays.
- **Criteria 1–9:**
  - No non-test source file under `backend/app/`, `frontend/src/` or `question-bank/src/` contains "contract", in any letter case.
  - Edited comments keep their meaning.
  - The new 422 `detail` is plain English with no "contract", "openapi", "spec" or "schema". The worker picks the exact wording.
  - Every other part of the 422 is unchanged, and no other served response changes.
  - No test that existed before the task changes, and no file outside the three source directories changes.
  - No dependency is added or bumped, and every CI suite is green.
- **Survey:** I found three hits the queue entry did not list: `backend/app/routers/auth.py:4`, `backend/app/serializers.py:1` and `frontend/src/lib/api/types.ts:5`. The brief puts them in scope.
- **One risk, outside PR CI:** several snapshot files read `question-bank/src/seed-level.ts`. They run in the monthly snapshot lane, not on PRs, so editing its comment may turn one red there. The brief tells the worker to report any such file under "Tests made stale" and not edit it.

## Approval — 2026-11-17
Orchestrator wrote the unattended `Approved:` stamp. No human saw the criteria.
