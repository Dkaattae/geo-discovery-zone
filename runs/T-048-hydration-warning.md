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
