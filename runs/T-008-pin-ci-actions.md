# T-008 — Decide: pin the CI actions by SHA, or stay on major tags — run log

**Task:** T-008 · **Branch:** `claude/t008-orchestrator-startup-ai1zb2` · **PR:** #34
**Started:** 2026-09-04 · **Outcome:** in progress

## Round 1 — task-expander — 2026-09-04
`Next step` on entry: `—` (no brief existed) → on exit: `worker`

**T-008 is expanded, pushed, and waiting on approval.** Draft PR: https://github.com/Dkaattae/geo-discovery-zone/pull/34 — brief at `/home/user/geo-discovery-zone/tasks/T-008-pin-ci-actions.md`, on branch `claude/t008-orchestrator-startup-ai1zb2` (the assigned session branch, recorded in the `Branch:` header). Push confirmed: `origin/claude/t008-orchestrator-startup-ai1zb2` at `d5e8f8d`, based on current `origin/main` (`6faef78`), diff touching only `tasks.md` and the brief.

**Status:** `awaiting approval` · **Next step:** `worker` · **Approved:** `pending` · 14 criteria.

## What the survey found (recorded in the brief, so nobody re-derives it)

- **13 `uses:` references in `ci.yml`, all on mutable major tags** — `actions/checkout@v5` ×6, `oven-sh/setup-bun@v2` ×3, `astral-sh/setup-uv@v6` ×3, `actions/upload-artifact@v4` ×1. `tasks.md` named only the first two.
- **The toolchain versions inside `with:` are already pinned** (`bun-version: 1.3.11`, uv `0.8.17`, Python `3.11`) and commented as deliberate. It is the action code that is unpinned, not the tools.
- **No Dependabot and no Renovate config exists anywhere** — `.github/` holds only `workflows/`. If pinning wins, the update chore has no owner today.
- **`.github/workflows/blocked-run-notice.yml:36` carries a fifth `actions/checkout@v5`.** It is loop machinery, so changing it is a `P` ticket — out of scope, but the decision has to say whether it should follow.
- **`.github/workflows/` is not a G1 gated path** (`GATED_PATHS` at `.claude/loop/run-loop.sh:60` is `process.md`, `process-decisions.md`, `CLAUDE.md`, `.claude/`), and T-005 changed `ci.yml` through this loop. Editing `ci.yml` here is in bounds despite `process.md`'s prose listing "the workflows" under `P` tickets — worth a human eye at some point, but not a blocker for this task.
- **Next free entry number is `E-5`.**

## Choices in the criteria worth knowing about

- **They do not pick a side.** Criterion 2 requires E-5 to state a *rule* covering all four actions, and explicitly permits a first-party/third-party split — a defensible middle option a flat "pin everything or nothing" criterion would have outlawed.
- **Criterion 10's test only fires downward.** A ref less pinned than the rule turns it red; a ref pinned *more* tightly stays green, so an all-tags outcome does not produce a test that punishes someone for later pinning a SHA.
- **Enabling Dependabot is out of scope, deliberately.** It starts scheduled PRs in Dkaattae's repository, which is his call, not the loop's. E-5 may recommend it and add a `tasks.md` entry; criterion 4 forces the entry to say plainly that nothing automates the pins today.
- **Criterion 9 forbids a network test.** Verifying a SHA against its tag needs GitHub, so it is a shell check recorded in the Handoff and re-run in the Verdict, never an assertion in the suite.
- **A trap for the worker is in Constraints:** `frontend/src/conventions-doc.test.ts:330` takes the longest run of adjacent backticked tokens in `conventions.md`'s `## CI` section and requires it to equal `ci.yml`'s six job names — adding six or more backticked action names there would break that test.

No halt was needed: `tasks.md`'s own "Done when" routes this decision to `engineering-decisions.md`, which the loop may write (E-4 was decided in-loop by T-006).
