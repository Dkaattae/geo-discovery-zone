# T-058 — Three doc claims that are true-ish, and one that is not — run log

**Task:** T-058 · **Branch:** `claude/t009-orchestrator-startup-uot0vc` · **PR:** #35
**Started:** 2026-09-05 · **Outcome:** in progress

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
