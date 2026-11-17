# T-048 — A React hydration warning on first load of the production build

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** orchestrator — 2026-11-17, unattended run. See `runs/T-048-hydration-warning.md`.
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
| worker | 2026-11-17 | cse_011oDiJdNiAkMCtdKuibGJLt |
| tester | 2026-11-17 | cse_011oDiJdNiAkMCtdKuibGJLt (orchestrated: shared id, fresh subagent context) |

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

**TL;DR — outcome 4(b): #418 no longer reproduces.** The base-commit bundle
(`e6b8a0c`, unmodified `frontend/`) loads clean signed out and signed in. I added
a guard test, `e2e/tests/first-load.spec.ts`, and proved it catches a real #418
by planting one. No file under `frontend/src/` changes. **Tester: run the e2e job
or the local recipe below.** Also: criterion 7's "signed-in first screen is Home"
does not match the app (see Contradictions).

**Same session id as the expander.** The orchestrator ran the expander and me
in the same remote session (`cse_011oDiJdNiAkMCtdKuibGJLt`). The tester's
session must be a different one.

### What changed, file by file

- **`e2e/tests/first-load.spec.ts`** (new): two tests, signed-out and signed-in
  first load. Each asserts the list of collected hydration errors is `[]`, and
  the failure message names each offending message.
- **`e2e/tests/app.ts`**: added a `// -- first load` section with
  `collectHydrationErrors(page)` (listens on `console` type `error` **and**
  `pageerror`, matching `/Minified React error #\d+/` or `/hydrat/i`, the brief's
  definition), `splashStart(page)` and `homeProgress(page)`. Nothing existing
  was edited.
- **`engineering-decisions.md`**: `E-33`, the 4(b) form. It records that #418
  no longer reproduces at `e6b8a0c`, how that was checked, the planted-mismatch
  proof, and that the guard now watches for it.
- **`README.md`**: removed the hydration-warning bullet from "Known issues".
- **`frontend/src/`**: nothing (required by 4(b)).

### Criteria

| # | Where it lives / evidence |
|---|---|
| 1 | `first-load.spec.ts` "a signed-out first load emits no hydration error". It passes against the base bundle (local run below). |
| 2 | Same file, "a signed-in first load emits no hydration error". It registers, creates a profile (which writes the token and last-profile id the app's own way), closes the page, then opens a **new page in the same context** (same `localStorage`, fresh document, fresh listeners), taps Start and waits for Home. It passes locally. |
| 3 | The spec is in `e2e/tests/`, so the existing `e2e` job's `bun run test` picks it up. `ci.yml` is unchanged. On failure it prints `hydration errors on first load:` followed by each message (see the planted run below). |
| 4 | **(b)**: passing output against the base bundle is below, from a local run. CI e2e on this branch is a second source. **Tester to confirm** the run on PR #149 (I did not wait for it; see "How to run"). |
| 5 | `engineering-decisions.md` E-33, with base commit `e6b8a0c`. |
| 6 | `README.md` "Known issues": the line is gone. `PROGRESS.md` is untouched (the reviewer's sweep). |
| 7 | No frontend change. The full e2e suite ran locally (see below). |
| 8 | `vite.static.config.ts`, `build-static.mjs` and `backend/` are untouched. `bun run build:static` still writes `dist/client/index.html`. |
| 9 | Untouched. The built shell's `<title>` is `Wander the Atlas — Geography Quiz for Kids` and `meta[name=description]` is the K–8 sentence (checked in `dist/client/index.html`). No test asserts this. Tester may want to check it in a browser. |
| 10 | Nothing was silenced. There is no fix at all, and no `suppressHydrationWarning`, `onRecoverableError` or console filter anywhere. |
| 11 | No `package.json`, `pyproject.toml` or lockfile changed (`git diff --stat`). |
| 12 | Local results: frontend typecheck, lint, `format:check` and `bun test` (248 pass). question-bank typecheck and test (229 pass). backend `pytest` on SQLite (785 passed, 9 skipped). e2e typecheck is clean, and the full e2e suite was run (see below). I did not run backend-postgres or integration locally: no Docker daemon or Postgres server here. Neither touches anything I changed. |

### Evidence: all from a **local run**, not CI

Setup: the frontend's `node_modules` already existed in this sandbox. Its
`react`/`react-dom` 19.2.8, `@tanstack/react-router` 1.170.18,
`@tanstack/react-start` 1.168.32, `@lovable.dev/vite-tanstack-config` 2.8.5 and
`vite` 8.1.5 all match `bun.lock`. So the brief's "cannot build here" did not
hold this time. `bun run build:static` succeeded. The backend was run with
`uv run fastapi run app/main.py` (SQLite, `GEO_FRONTEND_DIR=frontend/dist/client`),
not docker compose, because there is no Docker daemon here. Chromium was
`/usr/bin/google-chrome` (Chrome for Testing 153) via `E2E_CHROMIUM`.

**Base bundle (`frontend/` = `e6b8a0c`), guard passes: "#418 no longer reproduces".**

```
Running 2 tests using 2 workers
  ✓  1 [chromium] › tests/first-load.spec.ts:19:1 › a signed-out first load emits no hydration error (1.7s)
  ✓  2 [chromium] › tests/first-load.spec.ts:29:1 › a signed-in first load emits no hydration error (4.0s)
  2 passed (4.9s)
```

**Planted mismatch, guard fails naming #418.** This proves the guard is not
vacuous; it is not evidence for 4(a). I temporarily added
`<span>{typeof window === "undefined" ? "shell" : "client"}</span>` to
`RootShell`'s body, rebuilt and ran the guard, then reverted with
`git checkout`, rebuilt and re-ran (passing again):

```
  ✘  1 [chromium] › tests/first-load.spec.ts:19:1 › a signed-out first load emits no hydration error (2.0s)
  ✘  2 [chromium] › tests/first-load.spec.ts:29:1 › a signed-in first load emits no hydration error (3.8s)
    Error: hydration errors on first load:
    pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=text&args[]= for the full message ...
```

The error arrived as a **`pageerror`, not a `console.error`**. React 19 reports
recovered mismatches via `reportError`. A console-only guard would have missed
it, which is why criterion 3's "both" matters.

**Full e2e suite on the reverted base bundle:** 15 passed, 1 failed. The failure
was `quiz.spec.ts` "every quiz type can be played through": a timeout waiting
for `+ New explorer` after registering. Re-run on its own, `quiz.spec.ts` passed
8/8. I read it as local contention: default worker count against SQLite, where
CI uses 2 workers and Postgres. It is not related to this change, which touches
no app code. **Tester to confirm on CI's e2e job.** If it recurs there, it is
a `tasks.md` entry for the reviewer, not this task.

### Contradictions with the brief

- **Criterion 7 and the goal say a signed-in visitor's first screen is Home. It
  is not.** `App` always starts on `screen = "splash"` (`index.tsx`), and Start
  goes to Home when a token and active profile are present. Criterion 2 is still
  observable: the guard taps Start and waits for Home, with listeners attached
  the whole time. I changed no screen flow, since that is out of scope and a
  child-visible change. **Owner: reviewer to confirm the reading.** If Home
  really should be first, that is a product call and a new `tasks.md` entry.
- **"This sandbox cannot build the frontend"** was not true this session (see
  Setup above). No owner needed; noted for the expander's survey habit.

### Deliberately not done

- No bisect for the commit that made #418 go away. E-33 says why: it would name
  a cause for a bug that no longer exists.
- No title/description assertion in the guard. Criterion 9 is about not
  changing them, and nothing changed.
- `PROGRESS.md` and `tasks.md` were not edited (reviewer's sweep).

### How to run

```bash
cd frontend && bun run build:static
cd ../backend && GEO_FRONTEND_DIR=$PWD/../frontend/dist/client uv run fastapi run app/main.py --port 8000 &
cd ../e2e && bun install --frozen-lockfile
E2E_BASE_URL=http://localhost:8000 E2E_CHROMIUM=/usr/bin/google-chrome bunx playwright test first-load
# or, with Docker: cd e2e && bun run test   (brings compose up)
```

To see the guard catch a mismatch, plant the span above in `RootShell`, rebuild,
re-run, and revert.

### Tests made stale

None.

## Verdict

**TL;DR: pass.** #418 does not reproduce on the base bundle. The guard goes red for
every planted mismatch I tried, through both `pageerror` and `console.error`, and the
signed-in test catches a mismatch the signed-out one misses. CI on `f5f9e1a` is green
in all six jobs, and e2e ran 16 tests. I added one e2e test, for criterion 9. Next: reviewer.

**Independence: weaker than a separate session.** This run is orchestrated
(`runs/T-048-hydration-warning.md` exists). My `$CLAUDE_CODE_REMOTE_SESSION_ID`
(`cse_011oDiJdNiAkMCtdKuibGJLt`) is the same one listed for the expander and the
worker, so the Sessions check proves nothing. My independence rests only on being a
freshly spawned subagent: I did not watch the work and cannot see the worker's
reasoning. That depends on the orchestrator having spawned me correctly, which I
cannot check myself.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `first-load.spec.ts` "a signed-out first load emits no hydration error". It passes locally on the base bundle and in CI e2e. |
| 2 | met | Same file, "a signed-in first load…". It passes. Mutation M2 shows it is not a duplicate of test 1. |
| 3 | met | The spec is under `e2e/tests/`, it listens on `console` (type error) and on `pageerror`, and the regexes are the brief's. `ci.yml` has no diff. The CI e2e job log for `f5f9e1a` says "Running 16 tests… 16 passed" (the base had 14). The failure message names each offending message (M1, M3, M4 output). |
| 4 | met, (b) | The Handoff states "#418 no longer reproduces" and pastes local passing output. I reproduced it: `frontend/` has no diff against `e6b8a0c`, and the guard passes 2/2 locally. `git diff e6b8a0c HEAD -- frontend/` is empty. |
| 5 | met (by hand) | `engineering-decisions.md` E-33 is in the 4(b) form. It names base `e6b8a0c` and says the guard now watches. |
| 6 | met (by hand) | The README "Known issues" bullet is removed. `PROGRESS.md` is untouched. |
| 7 | met | No frontend change. Signed-out Start is visible (test 1). Signed-in: Start then Home (test 2). `quiz`/`progress`/`map-click` specs have no diff and pass in CI. Locally, 3 of them timed out under 2 workers against SQLite. All 13 passed on a serial re-run (`--workers=1 progress quiz`), so I read that as local contention, not this task. On the worker's criterion-7 contradiction (the app always opens on Splash): I read 7 as "unchanged". The criterion's description of the signed-in first screen is off, but nothing changed, so it holds. The reviewer should still note the wording. |
| 8 | met (by hand) | `bun run build:static` wrote `frontend/dist/client/index.html`. `vite.static.config.ts` has `nitro: false` and `spa.enabled: true`, with no diff. The backend served the shell at `/` locally. The integration job is green. |
| 9 | met | **New test** `e2e/tests/first-load-head.spec.ts` "T-048 c9: the first load keeps the page title and description". The expected values are the criterion's own. Mutations M5 and M6 turn it red. |
| 10 | met (by hand) | `grep -rn "suppressHydrationWarning\|onRecoverableError\|onUncaughtError" frontend/src e2e/tests` finds nothing, and there is no frontend diff. |
| 11 | met (by hand) | `git diff --name-only e6b8a0c HEAD` lists no `package.json`, `pyproject.toml` or lockfile. |
| 12 | met | CI check runs on `f5f9e1a`: backend, backend-postgres, frontend, question-bank, integration and e2e all `success`. Locally: e2e `tsc --noEmit` is clean. |

### Mutations (the guard is itself the deliverable)

Each one was applied to `frontend/src`, rebuilt with `bun run build:static`, and run
against a local backend (`uv run fastapi run`, SQLite, `GEO_FRONTEND_DIR=frontend/dist/client`)
with Chrome `/usr/bin/google-chrome`. Each was reverted with `git checkout`. After the
last one I rebuilt clean, and `git status` shows no source change.

- **M1**: added `<span>{typeof window === "undefined" ? "s" : "c"}</span>` in `RootShell`'s body. Both tests went red, with `pageerror: Minified React error #418 …`.
- **M2**: added a span that renders `"in"` only when `localStorage.length > 0`. **The signed-out test stayed green and the signed-in test went red** (#418 via `pageerror`). So test 2 hears its own load, and the fresh page does not inherit noise from sign-up.
- **M3**: added `console.error("Minified React error #418; planted by tester")` during client render. Both tests went red via `console.error:`, so the console path is live.
- **M4**: added `console.error("Hydration failed because …")`. Both tests went red, so the `/hydrat/i` branch is live.
- **M5**: shortened the `title` in `index.tsx`. The c9 test went red (Expected/Received title).
- **M6**: dropped "in K–8" from the description. The c9 test went red (Expected/Received content).

### Honesty

The guard listens to the real page: there is no stub of the console, React or the
network. The fixtures are not involved. The assertions are `toEqual([])` on the
collected list, which fails whenever anything matches (M1–M4).

### Which outputs came from where

- **CI**: run 44162743612 on `f5f9e1a`, all six jobs green. The e2e log says "16 passed (2.8m)".
- **Local**: the base-bundle guard runs, all mutations, the c9 test, and the full e2e run (13 passed and 3 timed out at 2 workers; the 13 re-ran serially and passed).
- **Not run locally**: the frontend, question-bank and backend unit suites. I took those from CI.

### Tests made stale

None. No pre-existing test was modified or deleted. `e2e/tests/app.ts` gains one
selector, `pageDescription`, appended at the end.

## Notes

- **Surprise: the bug is simply gone** at `e6b8a0c`. Nothing found says which
  change removed it. E-33 says so plainly instead of guessing.
- **Surprise: React 19's production build reports a recovered #418 as
  `pageerror`**, not `console.error`. Worth knowing for any future console
  guard.
- **Surprise: the frontend built fine here.** `node_modules` was present and
  matches `bun.lock`.
- **Decision: the signed-in case uses a fresh page in the same context**, not
  `page.reload()`. A reload on the same page would keep listeners from the
  sign-up flow, and anything emitted then would be blamed on the first load.
  Owner: tester to accept or overturn.
- **Other console noise:** none was collected. The guard only records
  hydration-matching messages, and I did not survey other console output.
  Nothing to file.
- **Local flake:** `quiz.spec.ts` "every quiz type can be played through" timed
  out once under full parallelism against local SQLite, then passed alone (see
  Handoff).
