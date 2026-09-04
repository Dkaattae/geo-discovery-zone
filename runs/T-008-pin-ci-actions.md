# T-008 — Decide: pin the CI actions by SHA, or stay on major tags — run log

**Task:** T-008 · **Branch:** `claude/t008-orchestrator-startup-ai1zb2` · **PR:** #34
**Started:** 2026-09-04 · **Outcome:** ready for merge — PR #34, approved and swept by the reviewer, with an escalated question for Dkaattae

## Round 2 — worker — 2026-09-04
`Next step` on entry: `worker` → on exit: `tester`

Push confirmed landed at `f4cfd96` on `origin/claude/t008-orchestrator-startup-ai1zb2`, matching local HEAD.

### Summary

**T-008 done as worker.** Decided to pin third-party CI actions (`oven-sh/setup-bun`, `astral-sh/setup-uv`) by commit SHA, leaving first-party `actions/*` (`checkout`, `upload-artifact`) on tags. Recorded as `engineering-decisions.md` E-5, `ci.yml` updated to match, a new test (`frontend/src/ci-workflow-pins.test.ts`) makes CI itself enforce the rule going forward, and `tasks.md` gained T-060 proposing Dependabot as the follow-up the decision itself flags as missing.

- **Branch:** `claude/t008-orchestrator-startup-ai1zb2` — verified current branch matches the brief's header before starting; pushed and confirmed `origin/claude/t008-orchestrator-startup-ai1zb2` is at my commit `f4cfd96`.
- **Files changed:** `/home/user/geo-discovery-zone/.github/workflows/ci.yml`, `/home/user/geo-discovery-zone/engineering-decisions.md`, `/home/user/geo-discovery-zone/tasks.md`, `/home/user/geo-discovery-zone/frontend/src/ci-workflow-pins.test.ts` (new), `/home/user/geo-discovery-zone/tasks/T-008-pin-ci-actions.md`.
- **Verification done:** `git diff origin/main -- .github/workflows/ci.yml` shows exactly the 6 `uses:` lines changed; the 2 SHAs verified by hand against GitHub via `git ls-remote` (astral-sh/setup-uv's `v6` is an annotated tag — had to peel it with `v6^{}` to get the real commit); 3 mutations run by hand against the new test (under-pin → red, branch-name → red, over-pin → stays green), reverted afterward; `frontend/bun test` 142/142, `conventions-doc.test.ts` 50/50, `question-bank` typecheck+test clean.
- **Known gap, not this task's fault:** `frontend/bun run typecheck` fails on `UsMap.tsx`'s `react-simple-maps`/`us-atlas` imports because this sandbox's package registry 403s those packages — confirmed pre-existing (no `package.json`/lockfile touched, same failure on a clean checkout before my edits). Flagged in the Handoff for the tester as a sandbox limitation, not a T-008 regression; criterion 13's real CI run is the authority.
- **Judgment call flagged for the reviewer:** the "pin third-party, tag first-party" split was a genuine choice among several the criteria would have accepted (uniform pin-all or pin-none also satisfy criteria 1–6). Called out explicitly in the brief's Notes as an opinion the reviewer is free to overturn, distinct from the facts in the rest of the Handoff.

Status set to `awaiting verification`, Next step `tester`.

## Round 3 — tester — 2026-09-04
`Next step` on entry: `tester` → on exit: `reviewer`

## Verdict: **pass**

All fourteen criteria hold. The two pinned SHAs resolve to exactly the releases their comments name (re-checked with `git ls-remote`), and the rule-enforcing tests survived a battery of eight mutations — seven red, one green control — every one reverted. CI is green across all six jobs on the branch head.

**Independence caveat, stated plainly:** this is an orchestrated run, so every role shares session id `cse_018F9nuHyps3iBuiq4RR2Y4s`. The Sessions-table check **did not pass — it did not run**. What is real is that I am a freshly spawned agent with my own context window that never saw the worker's transcript. That is the weaker of the two kinds of independence, and it rests on the orchestrator having spawned me correctly.

| # | Verdict | Evidence |
|---|---|---|
| 1–6 | pass | E-5 appended to `engineering-decisions.md`, E-1…E-4 byte-identical. Names the split in one sentence; the rule is a predicate on the owner (`actions` or not) resolving all four actions; both rejected options costed; states "No Dependabot or Renovate config exists in this repo today"; two observable revisit triggers; final paragraph covers `blocked-run-notice.yml` (whose diff is empty) |
| 7 | pass | 13 refs: 6 `checkout@v5`, 1 `upload-artifact@v4`, 3 `setup-bun@0c5077e5… # v2.2.0`, 3 `setup-uv@d0cc045d… # v6.8.0`. Lowercase 40-hex, release comments, no branch refs |
| 8 | pass | Re-verified from a shell. `0c5077e5…` = `v2` = `v2.2.0`. `v6` is annotated; peeled it is `d0cc045d…` = `v6.8.0` — the Handoff's account of that wrinkle is accurate |
| 9 | pass | Whole frontend suite 156 pass / 0 fail behind `http://127.0.0.1:1` proxies |
| 10 | pass | 8 mutations, all reverted; `git status` clean |
| 11 | pass | `git diff origin/main -- .github/workflows/ci.yml` is 6 changed lines, all `uses:` |
| 12 | pass | `conventions-doc.test.ts` unchanged, 50 pass; `conventions.md` "## CI" still true |
| 13 | pass | Runs 33900037927 (`f4cfd96`) and 33900799605 (`9c20e07`), six jobs each, all `success` |
| 14 | pass | No manifest or lockfile differs from `origin/main`; a fifth action now turns a test red |

**Mutations** (all reverted): pinned→tag, pinned→`@main`, tag→`@main`, tag→`@latest`, SHA with comment stripped, SHA truncated to 12 chars, and a fifth action swapped in — all red. The control, `actions/checkout@v5` → a *tighter* SHA, stayed green, which criterion 10 requires. Three of those (comment stripped, truncated SHA, fifth action) were checks the criteria require that the worker's own mutation round did not cover.

**What I added:** `/home/user/geo-discovery-zone/frontend/src/ci-action-pinning.test.ts` — 12 tests written from the criteria, deliberately overlapping the worker's file and stricter where criterion 7 is explicit and that file is not (lowercase hex, comment must name a release, action set must stay exactly four). Its criterion-10 block runs E-5's rule against synthetic workflow fragments, so the check proves inside the suite that it discriminates. No source edited, no criterion edited.

**One thing the reviewer should not be alarmed by:** `frontend`'s `bun run typecheck` fails locally with four errors in `src/components/UsMap.tsx`, because `react-simple-maps` and `us-atlas` are absent — this sandbox's npm mirror 403s on their `d3-*` deps. Pre-existing and unrelated: the branch changes no `package.json` or lockfile, and CI's `frontend` job ran `Typecheck` green.

**Pushed to `claude/t008-orchestrator-startup-ai1zb2`** (the brief's `Branch:` header, which matched my working branch). `origin` head is `18991eb`; PR #34 still draft, head `9c20e07`→`18991eb`. Brief updated: `/home/user/geo-discovery-zone/tasks/T-008-pin-ci-actions.md`, **Status: `pass`**, **Next step: `reviewer`**.

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

## Round 4 — reviewer — 2026-09-04
`Next step` on entry: `reviewer` → on exit: — (brief deleted on sweep; PR ready)

**Approved. PR #34 is ready for review, swept, and escalated — waiting on Dkaattae to merge.**

- **The work is good.** `ci.yml`'s diff is exactly six `uses:` lines; E-5 reads like E-4, its nearest analogue; the enforcing test sits beside `conventions-doc.test.ts`, which already reads `ci.yml` from disk for the same kind of reason. All 14 criteria hold, all six CI jobs green, and I re-verified both pinned SHAs myself against GitHub.
- **Escalated, one question:** E-5 sets the repository's CI supply-chain posture and creates a recurring manual chore, in a run whose brief no human approved (`Approved: orchestrator`). Does Dkaattae want the publisher split, or all four actions pinned? Reversing it is six lines plus an E-5 amendment.
- **Two non-blocking findings → T-061**, not fixed here.

| Check | Result |
|---|---|
| Every role has a commit in the PR | expander, worker, tester, orchestrator — none stranded on another branch |
| Roles stayed in their lanes | expander only `tasks.md` + `tasks/`; tester only a test file + the brief; orchestrator only `runs/` + the `Approved:` line |
| `ci.yml` diff | 6 changed lines, all `uses:` — nothing else moved |
| SHAs re-checked by me | `0c5077e5…` = `setup-bun` `v2` = `v2.2.0`; `d0cc045d…` = `setup-uv` `v6^{}` (annotated, peeled) = `v6.8.0` |
| Suite | frontend 156 pass / 0 fail locally; all six jobs `success` on `12c38cf` (run 33901184694). The sweep commit `171f404` is re-running now — markdown only, 4 of 6 already green |

**Findings (non-blocking, now T-061):**
1. **Two files enforce the same rule.** `frontend/src/ci-workflow-pins.test.ts` (worker, 4 tests) and `frontend/src/ci-action-pinning.test.ts` (tester, 12 tests). The second is a behavioural superset. E-5's rule now has two implementations — `isPinnedCategory()` at `ci-workflow-pins.test.ts:59` and the `pinned` branch of `violations()` at `ci-action-pinning.test.ts:74` — so a rule change has to be made twice or the suite contradicts itself.
2. **A hardcoded count** at `ci-action-pinning.test.ts:106`: `expect(references(CI_YML).length).toBe(13)`. It fires on any legitimately added CI step and reads as "you added a step". Asserting the parsed count against the raw `uses:`-line count gets the same parser coverage without pinning the workflow's size — the call this repo already made in T-058 and T-047.

**Flags disposed of:** the publisher split is accepted on the record (criterion 2 permitted it; E-5 prices the rejected option fairly; same shape as E-4) — and separately escalated, because accepting a defensible call and choosing the owner's security posture are different acts. The stale-local-`main` note needs no action. T-060's forward reference was fixed in the sweep. The tester's independence caveat is carried into the PR body rather than buried.

**Sweep (`171f404`, pushed to the brief's branch and confirmed on `origin`):** brief deleted; T-008's queue entry deleted; T-060's `Depends on: T-008` rewritten so it doesn't dangle; T-061 added; `PROGRESS.md` logged with what differed from the brief, plus two reconciliations — a new bullet stating CI's pinning rule, and correcting "Neither has yet driven a task end to end", which stopped being true at T-006.

The brief `tasks/T-008-pin-ci-actions.md` no longer exists by design: on approve the record moves to the PR body and `PROGRESS.md`, so there is no `## Review` section or Sessions row to write. `tasks/` is empty and the next cycle can start clean.

## Halted — reviewer escalation

The reviewer approved and marked PR #34 ready for merge, and in the same round escalated a question that this orchestrated run cannot answer on Dkaattae's behalf (`CLAUDE.md`, "moment 3" in `process.md` — a product/security-posture decision):

> E-5 sets the repository's CI supply-chain posture and creates a recurring manual chore, in a run whose brief no human approved (`Approved: orchestrator`). Does Dkaattae want the publisher split (third-party actions pinned by SHA, first-party `actions/*` on tags), or all four actions pinned by SHA? Reversing it is six lines plus an E-5 amendment.

Per the orchestrator role: the reviewer marking a PR ready **is** the end of the line — no role merges. The relay stops here.
