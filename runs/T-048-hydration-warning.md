# T-048 — React hydration warning on first load of the production build — run log

**Task:** T-048 · **Branch:** `task/T-048-hydration-warning` · **PR:** #149
**Started:** 2026-11-17 · **Outcome:** ready for merge

## Round 1 — task-expander — 2026-11-17
`Next step` on entry: `(none — no brief)` → on exit: `worker`

**TL;DR:** I wrote the T-048 brief (the React #418 hydration warning on first load of the production bundle) and opened draft PR #149. The push landed: the remote branch head is `91a85d2`. A person needs to approve the criteria before the worker starts.

- **Task:** T-048 — A React hydration warning on first load of the production build (M)
- **Branch:** `task/T-048-hydration-warning`, created from `origin/main`. The brief's `Branch:` header names it.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/149 (draft; the body has a TL;DR and the acceptance criteria)
- **Brief:** tasks/T-048-hydration-warning.md
- **Status:** `awaiting approval` · **Next step:** `worker` · **Approved:** `pending` · Sessions row added
- **Commits:** `d8349d6` (brief) and `91a85d2` (PR number recorded). The diff against main touches only `tasks/T-048-hydration-warning.md`.

**Why T-048 (tasks I skipped, in queue order):**
- **T-085b:** needs a person to choose how to reach a U.S. Census Bureau release (the proxy refuses census.gov).
- **T-056:** needs a design decision.
- **T-095:** needs a person's call on its question, as the queue entry says.
- **T-110:** needs a wording call from Dkaattae.
- **T-116:** already in flight (PR #148).
- **T-044:** the work is in Lovable's project settings, which no agent can reach, and the other way to finish it (retiring Lovable) is a product call. The T-043 run log made the same call.

**What the brief settles:**
- **Defined terms:** "first load" is a fresh Chromium context loading `/` from the compose stack. A "hydration error" is a `console` error or `pageerror` matching `/Minified React error #\d+/` or `/hydrat/i`.
- **Criteria 1–2:** first load is clean for a signed-out visitor and for a signed-in one.
- **Criterion 3:** a Playwright guard test runs in the existing `e2e` CI job, with no change to `ci.yml`.
- **Criterion 4 has two outcomes:**
  - (a) the guard test is shown failing on the unfixed bundle and passing after the fix;
  - (b) #418 no longer reproduces, and nothing under `frontend/src/` changes.
- **Criterion 5:** the cause, or the finding that it no longer reproduces, goes into a new entry `E-33` (`E-32` is the last one used).
- **Negative criteria:**
  - nothing a child sees changes;
  - SPA mode and the static shell stay as they are;
  - the error is not silenced (no blanket `suppressHydrationWarning` or filtered `onRecoverableError`);
  - no new dependency;
  - every suite is green.
- **If the cause cannot be found:** the worker halts with `Status: blocked`. Whether an unexplained warning is acceptable is a person's call, so the brief does not let the worker accept it.

**Risks for later roles:**
- **Nothing here can build the frontend:** `bun install` in `frontend/` gets a 403 from the `lovable-core-prod` registry in this sandbox. The `e2e` CI job is effectively the only place the guard test and the base-commit run can happen, and the brief says so.
- **Not yet confirmed:** nobody has checked that #418 still happens since 2026-08-24, which is why criterion 4 has two outcomes.

I did not run any build, test or pipeline, as the expander role requires.

## Approval — 2026-11-17
Orchestrator wrote the unattended `Approved:` stamp. No human saw the criteria.

## Round 2 — worker — 2026-11-17
`Next step` on entry: `worker` → on exit: `tester`

**T-048 worker is done. The outcome is 4(b): React error #418 no longer reproduces.** I built the bundle from base commit `e6b8a0c` with `frontend/` unmodified, and it loads with no hydration error both signed out and signed in. I added a guard test and saw it catch a #418 I planted. No file under `frontend/src/` changed. The commit is `89cd5a5` on `task/T-048-hydration-warning`, and `git log origin/task/T-048-hydration-warning -1` shows it. Status is `awaiting verification`, Next step `tester`.

**Changes:**
- **`e2e/tests/first-load.spec.ts`** (new): two tests, one for a signed-out first load and one for a signed-in first load. Each fails with a message that names every hydration error it saw.
- **`e2e/tests/app.ts`**: three helpers added, nothing existing edited.
  - `collectHydrationErrors` listens on both `console` errors and `pageerror`, using the brief's regexes.
  - `splashStart` and `homeProgress` are the two selectors the new spec needs.
- **`engineering-decisions.md`**: E-33, in the 4(b) form, naming base commit `e6b8a0c`.
- **`README.md`**: the hydration-warning line is removed from "Known issues".
- **The brief**: Handoff (with a criterion table and pasted test output), Notes, Sessions row, Status and Next step.

**Evidence (all from a local run, not CI):**
- **Base bundle:** both guard tests pass.
- **Planted mismatch:** I put a text node that reads `typeof window` into `RootShell`. Both guard tests then failed with "Minified React error #418". I reverted it, rebuilt, and both passed again.
- **How React reports it:** the #418 arrived as a `pageerror`, not a `console.error`, so a guard watching only the console would have missed it.
- **How it ran:** the frontend `node_modules` already existed here and match `bun.lock`, so `bun run build:static` worked, despite the brief saying this sandbox cannot build. The backend ran under `uv` with SQLite, and Chromium was `/usr/bin/google-chrome`. There is no Docker daemon, so docker compose was not used.

**Suites run locally:**
- **Passed:** frontend typecheck, lint, format:check and `bun test` (248 pass). question-bank typecheck and tests (229 pass). Backend pytest (785 passed, 9 skipped). e2e typecheck.
- **Full e2e suite: 15 passed, 1 failed.** The failure was `quiz.spec.ts` "every quiz type can be played through", which timed out right after registering a new account. Run on its own, `quiz.spec.ts` passed 8/8. I put it down to local parallel runs against SQLite; the change touches no app code.
- **Not run:** backend-postgres and integration (no Postgres or Docker here). I did not wait for CI on PR #149, so the tester should confirm the `e2e` job there.

**Flags for later roles:**
- **Criterion 7 does not match the app.** It, and the Goal, say a signed-in visitor's first screen is Home. In fact the app always opens on the Splash, and Start leads to Home. The guard taps Start and waits for Home, and I changed no screen flow. The reviewer should confirm this reading; if Home really should come first, that is a product call and a new `tasks.md` entry.
- **The signed-in test opens a fresh page in the same context** rather than reloading. That way its listeners only hear the first load, not the sign-up before it. The tester can accept or overturn this.
- **The tester needs a different session.** The expander and I both ran in `cse_011oDiJdNiAkMCtdKuibGJLt`.
- **Tests made stale:** none.

## Round 3 — tester — 2026-11-17
`Next step` on entry: `tester` → on exit: `reviewer`

**T-048 tester: pass. Next step is the reviewer.** I pushed `ccc1a03` to `task/T-048-hydration-warning`, and the remote head matches.

- **#418 no longer happens on the unchanged frontend**, the worker's outcome (b). I rebuilt the static bundle locally, served it from the backend and ran the guard: both tests pass. There are no changes under `frontend/` compared with the base commit `e6b8a0c`.
- **CI on `f5f9e1a` is green in all six jobs.** The e2e log shows "Running 16 tests… 16 passed": the 14 tests that were there before plus the 2 new guard tests.

**Independence is weaker than a separate session.** This is an orchestrated run, and my session id (`cse_011oDiJdNiAkMCtdKuibGJLt`) is the same one the brief lists for the expander and the worker. That means the Sessions check proves nothing. My independence rests only on being a freshly spawned agent that did not watch the work. I said this in the Verdict.

**Mutations.** I broke the code on purpose six times, rebuilt the bundle each time, and checked that the right test went red. Every change is reverted, the bundle is rebuilt clean, and there are no source changes left.

| # | What I broke | Result |
|---|---|---|
| M1 | Text in `RootShell` that differs between the prerendered page and the browser | Both guard tests red, `pageerror` #418 |
| M2 | A mismatch that only appears when `localStorage` is non-empty | Only the signed-in test red, so the two tests are not duplicates |
| M3 | A planted `console.error` with the #418 text | Both red, so the console listener works |
| M4 | A planted `console.error("Hydration failed…")` | Both red, so the `/hydrat/i` pattern works |
| M5 | Changed the page title | My new title/description test red |
| M6 | Changed the description | My new title/description test red |

**What I added.** Criterion 9 (title and description unchanged) had no test, so I wrote one:
- `e2e/tests/first-load-head.spec.ts`, with the expected values taken from the criterion itself.
- `e2e/tests/app.ts` gains one selector, `pageDescription`, appended at the end.

**Criteria checked by hand, all met:**
- **5:** `engineering-decisions.md` has E-33 in the "no longer reproduces" form.
- **6:** the README known-issues line is gone.
- **8:** `nitro` is still off and SPA mode still on; the build writes `dist/client/index.html`; the integration job is green.
- **10:** no `suppressHydrationWarning`, `onRecoverableError` or `onUncaughtError` anywhere.
- **11:** no `package.json`, `pyproject.toml` or lockfile changed.

**For the reviewer:**
- **Criterion 7's wording is wrong about the app.** It says a signed-in visitor's first screen is Home. The app always opens on Splash, and Start then goes to Home. Nothing in the app changed, so I read the criterion as met, but the wording should be noted.
- **Three older e2e tests timed out once locally.** On a full local run with 2 workers against SQLite, two in `progress.spec.ts` and one in `quiz.spec.ts` timed out. All 13 `progress` and `quiz` tests passed when re-run one at a time, and the same specs pass in CI. I read it as local contention, not this task.
- **Not run locally:** the frontend, question-bank and backend unit suites. For those I relied on CI.

No pre-existing test was changed. Test changes stay at `none`.

## Round 4 — reviewer — 2026-11-17
`Next step` on entry: `reviewer` → on exit: `human` (approved; PR marked ready; brief swept)

**I approved T-048 and it is inside the envelope.** PR #149 (https://github.com/Dkaattae/geo-discovery-zone/pull/149) is now marked ready, with no escalation. It can merge cleanly. Next step: Dkaattae merges it; nothing else is owed. All six CI jobs are green on head `3824787`, and e2e ran 17 tests, all passing. That includes the tester's new title/description test, which had not run in CI before this.

**Outcome:** the hydration error (React #418) no longer shows up on first load of the base bundle (`e6b8a0c`), so nothing in `frontend/src/` changed. What the task leaves behind is a guard test, `e2e/tests/first-load.spec.ts`, which listens on both `console` and `pageerror`, plus decision entry E-33 explaining all this. The tester's six planted mutations show the guard really catches a mismatch.

**Review**
- **Every role's work is in the PR.** The expander touched only the brief, the worker stayed inside the Constraints, and the tester changed no source. No `ci-fix` ran. No existing test was deleted or modified: `e2e/tests/app.ts` only had helpers appended.
- **Finding 1 (doesn't block) became new task T-117.** The spec table in `e2e/README.md` lists only two of the five specs (`map-click` was already missing, and this task's two new ones are too). T-117 also asks for a line on the lesson that React 19 reports a recovered mismatch as a `pageerror`, not a `console.error`.
- **Finding 2 (doesn't block, recorded only).** The guard's pattern `/Minified React error #\d+/` catches any minified React error, not just hydration ones. That is the brief's own definition and a stricter check, so it stays.
- **Criterion 7's wording, decided.** The app opens on the Splash screen for every visitor, and Start leads to Home when signed in. The criterion calling Home the first screen is a misdescription, and since behaviour didn't change, the criterion holds. I opened no product task.
- **Worker's other flags:** I accepted the "fresh page in the same context" approach. The local `quiz.spec.ts` timeouts got no task, because CI is green. The bisect was skipped by choice; E-33 says why.

**What I did on the branch** (pushed to `task/T-048-hydration-warning`; local and remote both at `3824787`)
- **Merged `origin/main` in** (T-116 / PR #148, merge commit `de65e50`), so the edits to `tasks.md` and `PROGRESS.md` wouldn't conflict. This was not one of my listed steps. The merge carries no T-048 content.
- **`0888dfb`:** added the `## Review` section to the brief, set Status to `approved` and Next step to `human`, and added my Sessions row.
- **`537f9a8` and `3824787` (the cleanup):**
  - Deleted the brief.
  - Removed T-048 from `tasks.md`, added T-117, and added a line to the sweep log.
  - In `PROGRESS.md`, added a T-048 entry under Completed tasks, removed the hydration line from Known gaps, and added a sentence on the guard to the e2e line.
- **PR body:** rewritten with the acceptance criteria verbatim and what verified each, the review, and what was deliberately not done.

**Caveat:** the expander, worker, tester and I all ran under the same session ID (`cse_011oDiJdNiAkMCtdKuibGJLt`). Our independence rests only on each being a freshly spawned subagent.

## Task ended — 2026-11-17
Ready for merge. PR #149 is Dkaattae's to merge.
