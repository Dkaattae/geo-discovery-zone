# T-048 — A React hydration warning on first load of the production build

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-048
**Branch:** `task/T-048-hydration-warning`
**PR:** #149, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-17 | cse_011oDiJdNiAkMCtdKuibGJLt |

## Goal

The static bundle the container serves logs React error #418 on first load: the
prerendered shell and the first client render disagree. Find out why and make
them agree, and leave a browser test behind so a mismatch cannot come back
unnoticed. A hydration mismatch that "recovers" today is a re-render of the whole
tree that hides real bugs later.

## What is already true (expander's survey)

- **The bundle under test** is built by `frontend/scripts/build-static.mjs` with
  `frontend/vite.static.config.ts` (SPA mode, nitro off, shell prerendered to
  `dist/client/index.html`). The Dockerfile runs it; the backend serves it
  (`backend/app/frontend.py`). `bun run dev` does not show the warning
  (`tasks.md` T-048).
- **The shell** is `RootShell` in `frontend/src/routes/__root.tsx`; the only
  route is `frontend/src/routes/index.tsx`, whose `App` starts with
  `ready = false` / `screen = "splash"` and reads `localStorage` in a
  `useEffect`. That pattern is already hydration-safe on its face, so the cause
  is likely elsewhere (head tags, `HeadContent`/`Scripts`, a component that
  reads `window`/`Date`/`Math.random` during render, or the TanStack Start SPA
  shell itself). This is a lead, not a finding.
- **Already ruled out** in PR #19 (`tasks.md` T-048): stubbing Google Fonts
  reachable, and matching the shell's empty first paint.
- **Nobody has confirmed the warning still occurs** since 2026-08-24. Many
  frontend changes have landed since (T-026, T-043, T-051). Criteria 3 and 4
  below cover both outcomes.
- **No e2e test looks at the console today.** `grep -rn "console\|pageerror"
  e2e/tests` finds nothing. The `e2e` CI job (`.github/workflows/ci.yml`) runs
  Playwright/Chromium against `docker compose`, i.e. against this exact bundle.
- **This sandbox cannot build the frontend.** `bun install --frozen-lockfile` in
  `frontend/` gets a 403 from the `lovable-core-prod` registry (seen in
  `runs/T-074`, `runs/T-100`, `runs/T-067`). The `e2e` CI job is where the
  bundle is built and the new check runs; plan for that.
- **No engineering decision covers this.** The next unused number is `E-33`
  (`E-32` is the shaded relief).

## Acceptance criteria

"First load" below means: a fresh Chromium context, `page.goto("/")` against the
compose stack (the production static bundle), until the first screen is
interactive — the Splash screen's **Start** button is visible for a signed-out
visitor. "A hydration error" means any `console` message of type `error`, or any
Playwright `pageerror`, whose text matches `/Minified React error #\d+/` or
`/hydrat/i`.

1. **Signed-out first load is clean.** On first load with empty `localStorage`,
   no hydration error is emitted.
2. **Signed-in first load is clean.** On a first load in a context whose
   `localStorage` already holds a valid token and last-profile id (i.e. reload
   after signing in and picking a profile, until the Home screen is visible),
   no hydration error is emitted.
3. **A guard test exists and runs in CI.** A Playwright test under `e2e/tests/`
   asserts criteria 1 and 2 by listening on both `console` and `pageerror`, and
   it runs in the existing `e2e` CI job with no change to `ci.yml`. It fails —
   naming the offending message — if a hydration error is emitted.
4. **The guard test was seen to catch the real thing, or the bug was seen to be
   gone.** The worker's Handoff contains exactly one of:
   - (a) the guard test's failing output against the bundle built from this
     branch's base commit (the unfixed frontend), quoting the #418 message, and
     its passing output after the fix; or
   - (b) the guard test's passing output against the bundle built from the base
     commit, stated as "#418 no longer reproduces", in which case **no file
     under `frontend/src/` changes** in this task.
   Output may come from a CI run (link the run) or a local run (paste it).
   "It should pass" without output is not evidence.
5. **The cause is written down.** Under outcome 4(a), `engineering-decisions.md`
   gains `E-33`, which names the component, tag or library behaviour that
   rendered differently in the prerendered shell and on the client, and what
   was changed so they agree. Under 4(b), `E-33` instead records that #418 no
   longer reproduces as of this task, with the base commit hash, and that the
   guard test is what now watches for it.
6. **The known-issue lines are gone.** `README.md`'s "Known issues" no longer
   lists the hydration warning. (`PROGRESS.md`'s "Known gaps" line is the
   reviewer's sweep, not the worker's.)
7. **Nothing a child sees changes.** For a signed-out visitor the first screen
   is still the Splash with a **Start** button; for a signed-in visitor with a
   last profile, Home. Every existing e2e test (`quiz.spec.ts`,
   `progress.spec.ts`, `map-click.spec.ts`) still passes unmodified.
8. **The served bundle keeps its shape.** `bun run build:static` still writes
   the shell to `frontend/dist/client/index.html`, SPA mode stays on and nitro
   stays off in `vite.static.config.ts`, and the backend serves the shell at `/`
   as before (the `integration` CI job stays green unmodified).
9. **The page `<title>` and description are unchanged** on first load: the title
   is `Wander the Atlas — Geography Quiz for Kids` and the
   `meta[name=description]` content is the K–8 sentence from `index.tsx`.
10. **Not silenced.** The fix does not add `suppressHydrationWarning`, a custom
    `onRecoverableError`/`onUncaughtError` that drops #418, a console filter, or
    any other mechanism that hides the error instead of removing the mismatch.
    (A `suppressHydrationWarning` on a single element whose content is
    legitimately client-only — e.g. a timestamp — is allowed only if `E-33`
    names that element and says why.)
11. **No new dependency** in `frontend/`, `e2e/` or `backend/`: no
    `package.json`, `pyproject.toml` or lockfile in those directories changes.
12. **Every suite is green**: frontend, question-bank, backend,
    backend-postgres, integration and e2e CI jobs (including `frontend/`'s
    `format:check` and lint, and `e2e/`'s typecheck).

**If the cause cannot be found:** do not choose "live with it" yourself. Whether
an unexplained warning is acceptable is a person's call (`tasks.md` T-048's
"documented with why living with it is acceptable"). Write what was tried and
ruled out under Notes, set `Status: blocked`, `Next step: human`, and stop.

## Out of scope

- Server-side rendering of real screens, turning SPA mode off, or reinstating
  nitro for the served bundle.
- The dev server (`vite.config.ts`, `bun run dev`) — it does not show the bug.
- Any other console noise (font or network failures, React warnings that are not
  hydration errors). Note them under Notes; they become `tasks.md` entries.
- Lovable reconnection (T-044) and `frontend/AGENTS.md`.
- `PROGRESS.md` and `tasks.md` edits — the reviewer's sweep.
- Restyling, copy changes, or refactoring `index.tsx`'s screen flow beyond what
  the fix needs.

## Constraints

- **Files expected to change:** one or a few files under `frontend/src/` (only
  under outcome 4(a)), a new or extended spec under `e2e/tests/` (selectors in
  `e2e/tests/app.ts`, per that file's header), `engineering-decisions.md`
  (`E-33`), `README.md` (Known issues).
- **No change to `.github/workflows/ci.yml`**, `docker-compose.yml`, the
  Dockerfile, or `backend/`.
- **Never mock the browser's console or React internals** to make the test pass;
  the guard listens to the real page.
- **No network in unit tests** still holds; `e2e` is deliberately unguarded and
  may load Google Fonts as it does today.
- Dependencies: none without asking (see [`CLAUDE.md`](../CLAUDE.md)).
- The frontend cannot be installed in this sandbox (403 on `lovable-core-prod`);
  CI's `e2e` job is the place the bundle is built and checked. Say plainly in the
  Handoff which outputs came from CI and which from a local run.

## Context

- **Files:** `frontend/src/routes/__root.tsx` (`RootShell`, `head`),
  `frontend/src/routes/index.tsx` (`App`, `head`),
  `frontend/src/components/screens.tsx`, `frontend/src/components/UsMap.tsx`,
  `frontend/src/router.tsx`, `frontend/src/start.ts`,
  `frontend/vite.static.config.ts`, `frontend/scripts/build-static.mjs`,
  `backend/app/frontend.py`, `e2e/tests/app.ts`, `e2e/playwright.config.ts`,
  `e2e/README.md`.
- **CI:** `.github/workflows/ci.yml`, jobs `e2e` and `integration`.
- **History:** `tasks.md` T-048 (what PR #19 ruled out), `README.md` "Known
  issues", `PROGRESS.md` "Known gaps".
- **Tests:** `test-guidelines.md` (e2e section) for how browser tests are written
  here.
- **Plan:** `geoquizdataplan.md` §5 (tech stack: TanStack Start, static bundle
  served by the backend).
- **Contract:** not touched.

## Handoff

## Verdict

## Notes
