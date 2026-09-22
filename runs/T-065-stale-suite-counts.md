# T-065 — Delete the stale suite-size counts, and stop them coming back — run log

**Task:** T-065 · **Branch:** `claude/gifted-albattani-0vh9mr` · **PR:** #57
**Started:** 2026-09-22 · **Outcome:** in progress

## Round 1 — task-expander — 2026-09-22
`Next step` on entry: `—` (no brief existed) → on exit: `worker`

**T-065 expanded, brief committed and pushed, draft PR #57 open and waiting on a human approval.** Three §A entries ahead of it were skipped with written reasons; one new entry (T-074) was filed from the survey. Nothing is blocked — the run stops at the normal step-2 gate.

- **Brief:** `/home/user/geo-discovery-zone/tasks/T-065-stale-suite-counts.md` — 13 criteria plus a 3-item review checklist.
- **Branch:** `claude/gifted-albattani-0vh9mr` (this session's assigned branch, recorded in the `Branch:` header). Push confirmed: `origin/claude/gifted-albattani-0vh9mr` = `005674e`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/57 — draft, criteria verbatim in the body. Brief header says `PR: #57`, which matches.
- **Status:** `awaiting approval` · **Next step:** `worker` · **Approved:** `pending`.

## What a human has to do

Approve on PR #57, then replace `Approved: pending` in the brief with a name and date. The worker refuses to start while it says `pending`.

## The task picked, and why not the ones before it

`tasks/` was empty at start (README + TEMPLATE only), so the last cycle swept cleanly.

| Entry | Outcome |
|---|---|
| **T-066** | already skipped twice — eslint for `question-bank/` is a dependency decision |
| **T-060** | already skipped twice — Dependabot/Renovate is a decision reserved for Dkaattae |
| **T-071** | **newly skipped.** Pinning the formatter means adding `prettier` as a `question-bank/` devDependency: `bunx` resolves from the network and that CI job installs behind T-005's dead proxy, so there is no no-dependency route. Prettier already being a `frontend/` devDependency does not settle it — T-066 is the same wall |
| **T-063** | **newly skipped.** A scheduled workflow that opens PRs needs `contents: write` + `pull-requests: write` running unattended (the same call T-060 waits on), and it deliberately reverses T-005's offline CI. Both answerable in one line by a human; guessing either would fabricate the criteria |
| **T-064** | **newly skipped, and its `Depends on:` corrected to T-040.** Its own precondition is "kept until the committed bank is shown to work end to end" and T-040 (the loader) has not run — the app still serves the hand-copied `content.json` |
| **T-065** | **taken.** Marked `doing` |

## What T-065's brief asks for

Two figures are **wrong in the tree right now**: `PROGRESS.md:173` says 687 tests, `test-guidelines.md:209-210` say 19 and 65. The queue entry already settled the route — **delete the figures, don't refresh them a ninth time** — so the criteria pin deletion plus a guard.

- **Removal** (criteria 1–5): `test-guidelines.md`; `PROGRESS.md` above `## Completed tasks`; `tasks.md`'s §A table. Criterion 4 forbids deleting whole bullets to satisfy criterion 2 — only the numbers go.
- **Guard** (6–11): mutation-shaped and both-sided — adding a count above `## Completed tasks` must go red, adding the identical sentence *below* it must stay green, and the historical per-task figures (T-001's "19 tests", T-010's "190 tests were added (19 → 209)") must survive untouched.
- **The boundary that took the most survey work** (criterion 9): the existing `testCountPattern` fires on `test-guidelines.md`'s "Every criterion gets at least one test", "Each should turn exactly one test red" and "One test, twelve assertions". A whole-file guard is therefore *not* satisfiable as-is, and the brief says so rather than leaving the worker to discover it. The advice must survive in some wording; the route (reword vs. smarter detector) is left free.
- **Negative criteria:** no test pins a total suite size (that just moves the rot into a test file), the two independent README detectors stay independent, no new dependency, no lockfile change, no network.
- **Picked up while inside the file:** criterion 11 makes `conventions-doc.test.ts:587-589`'s overstated comment true (found by T-061's tester); the header comment's "third parser, not a fourth" ordinal is a review-checklist item — four tracked `frontend/src/` files reference `ci.yml` today.

## Queue bookkeeping in the same commit

- **T-074 filed** in §A: `backend/README.md`, `backend/integration/README.md` and `e2e/README.md` state suite sizes nothing checks (one says 28 integration tests where there are 30). Split out rather than folded in because all three also carry "one test" advice prose — the same false-positive problem, but harder, so it should reuse whatever detector T-065 lands.
- **Noted for the reviewer's sweep:** removing `test-guidelines.md:210`'s figure closes the "frontend line either carries a true number or no number" half of T-047's done-when.

## Envelope check

The commit touches `tasks.md` and `tasks/T-065-stale-suite-counts.md` and nothing else — no source, tests or config. I ran no build, test suite or pipeline; Bash was used for git, file reads and two read-only regex scans over tracked markdown.
