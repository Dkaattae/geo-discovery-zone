# T-116 — source comments and the 422 detail still say "contract" — run log

**Task:** T-116 · **Branch:** `claude/epic-shannon-s86cuf` · **PR:** #148
**Started:** 2026-11-17 · **Outcome:** ready for merge — escalated (422 wording needs a person)

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

## Round 2 — worker — 2026-11-17
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** T-116 is built. The 21 places in source that called it "the contract" now say `openapi.yaml`, or "the spec" where `openapi.yaml` is already named nearby. The validation 422's `detail` now reads `"Some of the information sent was not valid."`. Commit `cd5302e` is pushed to `claude/epic-shannon-s86cuf`, and `git log origin/claude/epic-shannon-s86cuf -1` shows it. Status is `awaiting verification`, Next step is `tester`. Tests made stale: none.

- **Changed:** 13 files under `backend/app/`, plus `frontend/src/lib/api/client.ts`, `frontend/src/lib/api/types.ts` and `question-bank/src/seed-level.ts`. Every edit is one comment line replaced by one, except the single `detail` string at `backend/app/main.py:116`. The case-insensitive grep for "contract" over in-scope files now finds nothing.
- **New test:** `backend/tests/test_t116_validation_detail.py` checks criteria 3–4 through the ASGI client, with no network. Its `detail` test fails when `main.py` is reverted.
- **Local checks:**
  - **backend:** ruff check and ruff format are clean; pytest gave 787 passed, 9 skipped.
  - **frontend:** typecheck, lint and format:check are clean; 248 tests pass.
  - **question-bank:** typecheck, lint and format:check are clean; 229 tests pass.
- **Not run:** the integration and e2e suites, which need docker and Chromium. A grep of `e2e/`, `backend/integration/` and `backend/tests/` found nothing that pins the old `detail`. CI on PR #148 will be the real check for criterion 9.
- **Snapshot lane:** I ran the four snapshot files that read `seed-level.ts` with and without my edit. The same 12 tests fail both ways; they are old pins against historical commits and deleted files. My edit adds no failures.
- **Judgment calls, owner reviewer:**
  - I chose the 422 wording to avoid "request", which is jargon to a child.
  - At `main.py:11`, "has no other error shape" became "describes no other error shape". Keeping "has" would have read as if `openapi.yaml` sets the rules (criterion 2).
- **Flag for tester:** the expander and the worker ran under the same remote session id (`cse_011oDiJdNiAkMCtdKuibGJLt`). The tester should decide whether that breaks its independence check, and escalate to a human if it does.
- **Brief:** the Status header still said `awaiting approval` even though the orchestrator's Approved line was there. I took the brief as approved, as the worker rules allow, and noted this in the Handoff.

## Round 3 — tester — 2026-11-17
`Next step` on entry: `tester` → on exit: `reviewer`

**T-116 tester verdict: pass.** All 9 criteria are met. The brief now reads **Status `pass`** and **Next step `reviewer`**, and my Sessions row is added. My commits are on `claude/epic-shannon-s86cuf` (head `8cfea4b`, matching the remote).

**Independence:** this run is orchestrated (`runs/T-116-source-contract-wording.md` exists). My session id `cse_011oDiJdNiAkMCtdKuibGJLt` is the same one listed for the expander and the worker, so the session check cannot show they were separate. I am not claiming it passed. The only independence here is that I was spawned fresh with my own context and never saw the worker's reasoning. That is weaker than a separate session, and the Verdict says so.

| # | Verdict | How it was checked |
|---|---|---|
| 1 | met, by hand | A case-insensitive search for `contract` across the in-scope `.py`/`.ts`/`.tsx` files finds nothing. |
| 2 | met, by hand | I read every hunk. Each swaps "the contract" for `openapi.yaml` or "the spec", one for one. For the reviewer: `main.py:11` also changes "has" to "describes". |
| 3 | met, test | `test_criterion_3_…`, 5 cases. They fail against `origin/main` and pass on the branch. |
| 4 | met, test | `test_criterion_4_…`, 5 cases. Each checks the exact content type, status, title, type, instance, field set, and an `errors` list equal to what `origin/main` returned for the same requests. Changing `title` on purpose made them fail (change reverted). |
| 5 | met, by hand | I compared the full responses from main and the branch, and every non-docstring string literal in the Python code. The only change is the 422 `detail`. The TypeScript changes are comments only. |
| 6 | met, by hand | No test file that existed before this task was modified or deleted. |
| 7 | met, by hand | The worker changed only the allowed folders, the brief and one new test file. |
| 8 | met, by hand | No dependency or lockfile changes. |
| 9 | met | On PR #148 head `25ac5b6`, all six CI checks passed, e2e included. My commits trigger a fresh run, which the reviewer should check. |

**Suite run locally:**
- **backend:** ruff check and format clean; pytest 797 passed, 9 skipped.
- **frontend:** typecheck, lint and format:check clean; 248 tests pass.
- **question-bank:** typecheck, lint and format:check clean; 229 tests pass.
- **Not run locally:** integration and e2e.

**No tests went stale.** I added only `backend/tests/test_t116_tester_criteria.py`.

## Round 4 — reviewer — 2026-11-17
`Next step` on entry: `reviewer` → on exit: `human` (approved — escalated; PR marked ready; brief swept)

**I approved T-116 but escalated it, so it needs a person's decision before merging.** PR #148 is marked ready for review with a "do not merge" note at the top of the body. The swept bookkeeping rides inside the PR, and I did not merge.

**What the person must decide:** whether a child should see the new validation 422 `detail`, "Some of the information sent was not valid." It can reach a screen through `ApiError.displayMessage`, which `frontend/src/routes/index.tsx` `messageFor` displays. Text a child will read is outside the envelope. Everything else in the PR is inside it.

**Checks**
- **PR state:** open and draft when I started, not merged. Every role in the Sessions table has commits on the branch:
  - expander: `405a3d4`, `eddb6a2`
  - worker: `cd5302e`
  - tester: `f9268b5`, `8cfea4b`
  - orchestrator: run-log commits
- **Lanes:** each role stayed in its own.
  - The expander touched only the brief.
  - The worker touched only `backend/app/`, `frontend/src/lib/` and `question-bank/src/`, plus one new test and the brief.
  - The tester touched only a new test and the brief.
  - There were no `ci-fix` commits. `Test changes: none`, `CI fix: none`.
- **The diff:** 21 one-for-one comment swaps plus the one `detail` string. Nothing was reflowed and nothing else changed.
- **Suites:** all six CI jobs were green on `bbb9e8d`, the last head with code or test changes. I re-ran the backend locally: 797 passed, 9 skipped, ruff clean. CI on the new head `c372e60` was still queued when I finished; my two commits there change only markdown files.
- **No** dependency, `openapi.yaml`, migration or plan change, and no pre-existing test was touched.

**Findings (none block)**
- **Overlapping tests:** the worker's and the tester's new test files overlap. This is harmless, so I did not queue it.
- **Test names:** three still say "contract": `test_profiles_api.py:79`, `test_levels.py:102` and `client.test.ts:43`. I did not queue a task, because renaming each would need a person's Test change request (D-14) and changes no behaviour.
- **Loop files:** `process.md`, `tasks/TEMPLATE.md` and `.claude/agents/{task-expander,tester,worker,reviewer}.md` still call `openapi.yaml` "the contract". `reviewer.md:187` uses that idea to justify escalating `openapi.yaml` changes, which contradicts E-14. I queued this as a new ticket, **P-20**, in `process-tasks.md`.
- **Flags from earlier roles, all settled:**
  - The 422 wording passes review; only whether it suits a child is left to the person.
  - The worker's change of "has" to "describes" in `main.py:11` is accepted.
  - The shared session id across orchestrated roles is already recorded in `process-decisions.md`, so it gets no new ticket.

**Commits pushed to `claude/epic-shannon-s86cuf` (push confirmed: local and origin are both at `c372e60`)**
- **`f70b748`:** adds `## Review` to the brief, sets `Status: approved — escalated` and `Next step: human`, and adds my Sessions row. This keeps the review in git history.
- **`c372e60` (the sweep):**
  - deletes the brief
  - deletes the T-116 entry from `tasks.md` and adds a line to its sweep log
  - logs T-116 under Completed tasks in `PROGRESS.md`
  - adds P-20 to `process-tasks.md`

Nothing else in the queue moved.

**PR body:** rewritten with the escalation note at the top, then a TL;DR, the criteria verbatim with what verified each, the review, the sweep, and what was left out on purpose.

## Task ended — 2026-11-17
Ready, escalated. Dkaattae: decide whether the 422 detail "Some of the information sent was not valid." is fine for a child to read, then merge PR #148.
