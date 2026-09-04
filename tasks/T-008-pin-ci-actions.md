# T-008 — Decide: pin the CI actions by SHA, or stay on major tags

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending` — replace with who approved and the date, e.g. `Kate, 2026-08-06`
**From:** [`tasks.md`](../tasks.md) T-008
**Branch:** `claude/t008-orchestrator-startup-ai1zb2` — assigned to the expander's
session by the environment, so this is the task branch. It is **not** named
`task/T-0xx-slug` and that is expected (`process.md`, "When the environment names
the branch for you"). Every role after the expander checks
`git branch --show-current` against this line and pushes here regardless
(`CLAUDE.md` "Branches" carries the standing permission).
**PR:** #35, opened draft at expand time from the branch above. It stays draft
until the reviewer approves it.
**Fault:**

**Sessions:** one line per agent run — role, date, and session id
(`echo $CLAUDE_CODE_REMOTE_SESSION_ID`). The tester must refuse to run in a
session already listed as `worker`.

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-04 | cse_018F9nuHyps3iBuiq4RR2Y4s |

## Goal

`ci.yml` runs four third-party actions at mutable major tags, so whoever controls
those tags can change what executes on this repo's runners without a diff here.
Settle whether that is acceptable, make `ci.yml` match the answer, and write the
answer down with its cost so the next person does not re-argue it.

## What is already true

Surveyed 2026-09-04 on `main` at `6faef78`. None of this needs redoing.

- **`.github/workflows/ci.yml` has 13 `uses:` references, all on mutable major
  tags**, across four actions: `actions/checkout@v5` (6 — lines 24, 100, 148,
  219, 257, 287), `oven-sh/setup-bun@v2` (3 — lines 26, 102, 289),
  `astral-sh/setup-uv@v6` (3 — lines 150, 221, 259), `actions/upload-artifact@v4`
  (1 — line 318). None is pinned; none uses a branch ref or `@latest`.
- **The *tools* those actions install are already version-pinned** and commented
  as such: `bun-version: 1.3.11`, uv `version: "0.8.17"`,
  `python-version: "3.11"`. It is the action code that is unpinned, not the
  toolchain.
- **No `dependabot.yml`, no Renovate config, nothing else that would bump a pin.**
  `.github/` contains only `workflows/`. If pinning wins, the update chore has no
  owner in this repo today — that is a fact the decision has to state, not a gap
  to quietly fill (see Out of scope).
- **`frontend/bunfig.toml` runs a 24h `minimumReleaseAge` supply-chain guard** on
  the npm side (line 4), with a named exclusion list. It is the only such guard in
  the repo — `question-bank/` and `e2e/` have no `bunfig.toml` — and it is the
  asymmetry T-003's tester pointed at.
- **`.github/workflows/blocked-run-notice.yml` also uses `actions/checkout@v5`**
  (line 36). That file is loop machinery, not CI, and is out of scope here.
- **`engineering-decisions.md` holds E-1 … E-4**, so the next free number is
  **E-5**. The file's own rule at line 14: an entry is added when a decision could
  have gone the other way, and "a decision with no trigger for revisiting is a
  habit, not a decision".
- **`conventions.md` "## CI" (lines 93–104) makes no claim about action versions**,
  so nothing there is falsified by either outcome. Its job list *is* asserted
  against `ci.yml` by `frontend/src/conventions-doc.test.ts` (line 302) — see
  Constraints.
- **`.github/workflows/` is not a `run-loop.sh` G1 gated path.** `GATED_PATHS`
  (`.claude/loop/run-loop.sh:60`) is `process.md`, `process-decisions.md`,
  `CLAUDE.md` and `.claude/` only, and T-005 (PR #26) changed `ci.yml` through
  this loop. Editing `ci.yml` here is in bounds.

## Acceptance criteria

Numbered, observable, each checkable on its own. **These do not decide which way
the decision goes** — they say what a finished decision looks like, whichever
option wins. Frozen once approved.

1. `engineering-decisions.md` contains a new entry numbered **E-5**, and its text
   states in a sentence which option was chosen: pinning `uses:` references by
   commit SHA, staying on version tags, or a stated split between them. A reader
   who reads only that sentence can tell which. Entries E-1 to E-4 are unchanged.

2. **E-5 states a rule that determines the form of every `uses:` reference in
   `ci.yml`.** The rule may distinguish categories — first-party `actions/*`
   versus third-party, say — provided each of the four actions in `ci.yml`
   (`actions/checkout`, `oven-sh/setup-bun`, `astral-sh/setup-uv`,
   `actions/upload-artifact`) falls under exactly one branch of it. A rule that
   leaves any of the four undetermined does not satisfy this.

3. **E-5 names both options and says what the rejected one costs** — at minimum,
   the recurring update chore that SHA pinning creates and the mutable-tag
   exposure that tags leave open. Naming only the winner does not satisfy this.

4. **E-5 says how a version change reaches this repo under the chosen rule** —
   who or what updates a pin or notices a tag moved — and says explicitly whether
   that mechanism exists in the repo today. It does not: there is no Dependabot or
   Renovate config (see "What is already true"). An entry that implies one exists
   fails this criterion.

5. **E-5 names a revisit trigger**: a stated condition under which the decision
   should be reopened, per `engineering-decisions.md:14`. "Revisit when the pins
   go six months stale" qualifies; "revisit if this becomes a problem" does not.

6. **E-5 says in one sentence whether the same rule should apply to
   `.github/workflows/blocked-run-notice.yml`**, and if it should, that acting on
   it is a hand-written `P` ticket rather than part of this task. The file itself
   is byte-identical to `main` in this branch's diff.

7. **Every one of the 13 `uses:` references in `.github/workflows/ci.yml`
   conforms to E-5's rule.** For any reference the rule places in the pinned
   category: the ref is a 40-character lowercase hexadecimal commit SHA, followed
   on the same line by a comment naming the released version it corresponds to
   (`# v5.0.0`). For any reference the rule places in the tag category: the ref is
   a version tag. Zero references anywhere in `ci.yml` use `@main`, `@master`,
   `@latest` or any branch name.

8. **Each SHA that appears is the commit that action's named tag actually points
   at**, checked against GitHub for every pinned reference, with the check and its
   output recorded in the `## Handoff` (worker) and re-run in the `## Verdict`
   (tester). If the decision pins nothing, this criterion is vacuously satisfied
   and the Handoff says so.

9. **No test added or changed by this task reaches the network.** The tag ↔ SHA
   correspondence in criterion 8 is verified by hand from a shell, never encoded
   as an assertion in any suite. A test that would fail without internet access
   fails this criterion.

10. **A test that CI already runs fails when a `uses:` reference in `ci.yml` is
    less pinned than E-5's rule requires.** It reads
    `.github/workflows/ci.yml` from disk. Concretely: a reference the rule places
    in the pinned category, rewritten to a tag or a branch, turns that test red; a
    reference in the tag category, rewritten to `@main` or `@latest`, turns it
    red. A reference pinned *more* tightly than the rule requires — a SHA where
    the rule allows a tag — keeps it green, so the test never punishes an
    improvement.

11. **The only lines `ci.yml` gains or loses are `uses:` lines and comments.** Job
    names, step names, `run:` blocks, `if:` guards, `with:` values, `env:` values,
    `services:` and `timeout-minutes:` are identical to `main`. `git diff main --
    .github/workflows/ci.yml` shows nothing else.

12. **`frontend/src/conventions-doc.test.ts` is unchanged and passes**, and
    `conventions.md`'s "## CI" section is still true of `ci.yml` after the change.

13. **The CI run on this branch's head commit starts all six jobs — `frontend`,
    `question-bank`, `backend`, `backend-postgres`, `integration`, `e2e` — and no
    job fails while resolving an action** (GitHub's "Unable to resolve action …"
    is the failure this rules out). The full suite is green as usual
    (`CLAUDE.md` "Tests").

14. **No new dependency is added** — no package in any `package.json`,
    `pyproject.toml` or lockfile, and no new GitHub Action beyond the four already
    in `ci.yml`.

## Out of scope

Anything below that is worth doing becomes a `tasks.md` entry or a `P` ticket, not
an extra commit here.

- **Enabling Dependabot or Renovate.** Adding `.github/dependabot.yml` starts a
  bot opening PRs in Dkaattae's repository on a schedule; that is the owner's call
  and not this loop's. E-5 may *recommend* it (criterion 4 requires the mechanism
  question to be answered honestly) — it may not turn it on. If E-5 recommends it,
  add a `tasks.md` entry proposing it.
- **`.github/workflows/blocked-run-notice.yml`.** Loop machinery: changes to it
  are hand-written `P` tickets (`process.md`, "Work on the loop itself never
  enters the loop"). Criterion 6 covers saying so; changing it is forbidden.
- **The bun/uv/Python version pins inside `with:` blocks.** Already deliberate and
  already commented. Criterion 11 forbids touching them.
- **`frontend/bunfig.toml` and the npm-side supply chain.** The 24h guard is
  context for the argument, not a thing this task changes — including its
  `minimumReleaseAgeExcludes` list and the two packages that have no `bunfig.toml`
  at all.
- **Restructuring CI** — job splits, caching, a reusable workflow, moving the slow
  jobs to a schedule. Criterion 11 is the fence.
- **`README.md:202`'s stale job count.** That is T-058.

## Constraints

- **Files expected to change:** `.github/workflows/ci.yml`,
  `engineering-decisions.md`, and one test file (new or existing) for criterion
  10. Optionally `conventions.md` if the chosen rule is worth a sentence there.
  Nothing else.
- **`conventions.md` "## CI" has a fragile assertion against it.**
  `frontend/src/conventions-doc.test.ts:330` finds the *longest run of adjacent
  backticked tokens* in that section and requires it to equal `ci.yml`'s job list
  (6 names). A new sentence there listing 6 or more backticked action names would
  break that test by winning the "longest run" comparison. Keep any addition
  shorter than six backticked tokens, or put it outside the `## CI` section.
- **`ci.yml`'s job block shape is parsed by a test.** `workflowJobs()`
  (`conventions-doc.test.ts:301`) reads two-space-indented `name:` keys under
  `jobs:`. Indentation and job naming must not move.
- **No network in tests, ever** (`test-guidelines.md`, and the dead-proxy guard on
  the four unit-test steps in `ci.yml`). Criterion 9 is the specific form here.
- **Dependencies: none without asking** (`CLAUDE.md` "Packages"), and criterion 14
  says none is needed.
- **`engineering-decisions.md` is not loop-gated** — a `T` task may add an `E-n`
  entry when its criteria say so (`process.md`, "Work on the loop itself never
  enters the loop", last paragraph). `process-decisions.md` is gated and must not
  be touched.
- **The decision is the worker's to make**, inside criteria 1–6. If it cannot be
  made without a call that belongs to Dkaattae — anything that commits the repo to
  a recurring chore he has not agreed to — write the question into this brief, set
  `Status: blocked`, `Next step: human`, and stop.

## Context

Required reading, not background.

- **`.github/workflows/ci.yml`** — the 13 `uses:` lines listed above, and lines
  27–37, which are the existing comment explaining why bun's *version* is pinned
  and why a drifting lockfile is a guard that has stopped guarding. Same argument,
  one level up.
- **`.github/workflows/blocked-run-notice.yml:36`** — the fifth `uses:`, out of
  scope, covered by criterion 6.
- **`engineering-decisions.md`** — the file's preamble (lines 1–18) for what an
  entry is for, and **E-3** and **E-4** as the shape to match: what was decided,
  what the alternatives cost, what would make it worth revisiting. E-4 is the
  closest analogue — a CI-gate decision made inside this loop.
- **`frontend/bunfig.toml:3-4`** — the 24h `minimumReleaseAge` guard T-003's
  tester cited as the reason CI's own supply chain being unguarded is an
  inconsistency rather than a theoretical worry.
- **`frontend/src/conventions-doc.test.ts:297-337`** — the existing test that
  reads `ci.yml` from disk with no network. The nearest precedent for criterion
  10's test, and the file whose passing criterion 12 requires.
- **`conventions.md` "## CI"**, lines 93–104 — what the docs currently claim about
  CI.
- **`tasks.md`** T-008 — the queue entry, including the two-sided argument it
  records and its "Done when".
- **`process.md`**, "Tasks this loop does not fit" — this is a **decision** task:
  the deliverable is a written decision plus the code matching it, and criteria
  1–6 are checked by reading rather than by running.
- **`CLAUDE.md`** — "Packages" (criterion 14), "Tests" (criterion 13), "Branches"
  (the `Branch:` header above).

## Review checklist — decision task

Criteria 1–6 are read, not run. Whoever reviews the PR confirms:

- [ ] E-5 says which option won, in a sentence, without needing the diff to
      disambiguate it.
- [ ] The rejected option is described in terms its advocate would recognise, not
      as a straw man.
- [ ] The ongoing cost of the chosen option is stated plainly enough that the
      repo owner can price it — including that nothing in the repo automates it
      today.
- [ ] The revisit trigger is a condition someone could actually notice occurring.
- [ ] If the entry recommends Dependabot or similar, it is a recommendation and a
      `tasks.md` entry, not a config file in this PR.

## Handoff

Written by `worker` before the tester runs. Always written, even if nothing was
built.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes
