# T-048 — React hydration warning on first load of the production build — run log

**Task:** T-048 · **Branch:** `task/T-048-hydration-warning` · **PR:** #149
**Started:** 2026-11-17 · **Outcome:** in progress

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
