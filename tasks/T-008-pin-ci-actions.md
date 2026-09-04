# T-008 — Decide: pin the CI actions by SHA, or stay on major tags

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** orchestrator — 2026-09-04, unattended run. See `runs/T-008-pin-ci-actions.md`.
**From:** [`tasks.md`](../tasks.md) T-008
**Branch:** `claude/t008-orchestrator-startup-ai1zb2` — assigned to the expander's
session by the environment, so this is the task branch. It is **not** named
`task/T-0xx-slug` and that is expected (`process.md`, "When the environment names
the branch for you"). Every role after the expander checks
`git branch --show-current` against this line and pushes here regardless
(`CLAUDE.md` "Branches" carries the standing permission).
**PR:** #34, opened draft at expand time from the branch above. It stays draft
until the reviewer approves it.
**Fault:**

**Sessions:** one line per agent run — role, date, and session id
(`echo $CLAUDE_CODE_REMOTE_SESSION_ID`). The tester must refuse to run in a
session already listed as `worker`.

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-04 | cse_018F9nuHyps3iBuiq4RR2Y4s |
| worker | 2026-09-04 | cse_018F9nuHyps3iBuiq4RR2Y4s |

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

**The decision: split by publisher.** `oven-sh/setup-bun` and `astral-sh/setup-uv`
(third-party) are pinned to a commit SHA with a version comment;
`actions/checkout` and `actions/upload-artifact` (published by GitHub itself,
under the `actions/` org) stay on their major tag. Recorded as
**`engineering-decisions.md` E-5**, added after E-4 — the file's first entry
after the E-1…E-4 block, nothing else in it touched.

### Files changed

- **`.github/workflows/ci.yml`** — the 6 `oven-sh/setup-bun@v2` and
  `astral-sh/setup-uv@v6` references (3 each) rewritten to
  `owner/repo@<40-hex-sha> # v<version>`. The 7 `actions/checkout@v5` and
  `actions/upload-artifact@v4` references are untouched. `git diff origin/main --
  .github/workflows/ci.yml` (verified below) shows exactly those 6 lines and
  nothing else — no job name, `run:`, `if:`, `with:`, `env:`, `services:` or
  `timeout-minutes:` changed.
- **`engineering-decisions.md`** — new `## E-5` entry appended after E-4.
  E-1…E-4 unchanged (diffed against `origin/main`, confirmed below).
- **`frontend/src/ci-workflow-pins.test.ts`** — new file, criterion 10's
  deliverable test. Reads `.github/workflows/ci.yml` from disk (no network),
  applies E-5's rule (`owner === "actions"` → tag category, else → pinned
  category) and asserts: no reference anywhere is `@main`/`@master`/`@latest`/a
  branch name; every `actions/*` reference is a version tag or an
  equal-or-tighter commit SHA; every non-`actions/*` reference is a 40-hex SHA
  with a trailing `# v…` comment. Runs in `frontend/`'s existing `bun test`, so
  CI already runs it — no new suite, no new dependency.
- **`tasks.md`** — added **T-060**, proposing Dependabot/Renovate for
  `github-actions` (see "Out of scope" below and E-5's mechanism paragraph).
  This is the worker adding a discovered, out-of-scope item, per `process.md`
  step 3 ("Work you notice that is not this task becomes a new entry in
  `tasks.md` — not an extra commit here") and the brief's own "Out of scope"
  instruction ("If E-5 recommends it, add a `tasks.md` entry proposing it") —
  not a general license to edit the queue, which is otherwise the expander's
  and reviewer's job.
- **`conventions.md`** — not touched. Nothing in "## CI" claims anything about
  action versions before or after this change (surveyed true in "What is
  already true"), so criterion 12's "still true of `ci.yml` after the change"
  holds without an edit, and touching it risked the fragile
  longest-backticked-run assertion the Constraints section warns about for no
  benefit.

### Criteria

| # | Status | Evidence |
|---|---|---|
| 1 | done | E-5's first "Decided:" paragraph names the split in one sentence, readable without the diff. |
| 2 | done | Rule is `owner === "actions"` → tag, else → SHA. Checked against all four: `actions/checkout`, `actions/upload-artifact` → tag; `oven-sh/setup-bun`, `astral-sh/setup-uv` → SHA. Encoded as `isPinnedCategory()` in the new test, matching the prose. |
| 3 | done | "Both options, and what the rejected one costs" names "stay on tags everywhere" and "pin everything" as the two rejected alternatives, each with its cost, before stating the chosen split's own cost split (6 pinned refs, 7 tagged). |
| 4 | done | "How a version change reaches this repo" paragraph: pinned side needs a human to notice and edit by hand; tag side updates silently on the next CI run when the owner moves the tag; states explicitly "No Dependabot or Renovate config exists in this repo today". |
| 5 | done | Revisit trigger: (a) a pin going ~6 months unrefreshed, or (b) a disclosed tag-integrity incident on `actions/checkout` or `actions/upload-artifact`. Both are conditions someone could notice occurring, not "if this becomes a problem". |
| 6 | done | Final paragraph: `blocked-run-notice.yml`'s `actions/checkout@v5` falls under the same rule, already satisfies it (owner is `actions`), no edit needed; a third-party action added there later is a hand-written `P` ticket. `git diff origin/main -- .github/workflows/blocked-run-notice.yml` is empty — confirmed below. |
| 7 | done | All 13 references conform: 7 on version tags (`v5`, `v4`), 6 on 40-hex SHAs with `# vX.Y.Z` comments. Zero `@main`/`@master`/`@latest`/branch names anywhere (checked by the new test and by eye). |
| 8 | done | Checked by hand via `git ls-remote`, output below. |
| 9 | done | `ci-workflow-pins.test.ts` reads only the local `.github/workflows/ci.yml`; no network call anywhere in it. The tag↔SHA lookup lives only in this Handoff and the shell history, never in an assertion. |
| 10 | done | `ci-workflow-pins.test.ts`, in `frontend/`'s `bun test` (CI already runs this). Three mutations run by hand and reverted — see below. |
| 11 | done | `git diff origin/main -- .github/workflows/ci.yml` shows only the 6 `uses:` lines — see below. |
| 12 | done | `conventions-doc.test.ts`: 50/50 pass, file untouched. |
| 13 | not run by worker | CI itself runs on push to this PR's branch; the worker does not have a way to watch a GitHub Actions run from here. The tester should confirm the run on this branch's head commit against the six job names. |
| 14 | done | No `package.json`, `pyproject.toml` or lockfile touched (`git status --short` below); no action beyond the four already in `ci.yml`. |

### Criterion 8 — SHA ↔ tag correspondence, checked by hand

Run 2026-09-04, from a shell, against the real GitHub remotes (no test encodes
this — criterion 9):

```
$ git ls-remote --tags https://github.com/actions/checkout.git 'v5*'
fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09  refs/tags/v5
08c6903cd8c0fde910a37f88322edcfb5dd907a8  refs/tags/v5.0.0
93cb6efe18208431cddfb8368fd83d5badbf9bfd  refs/tags/v5.0.1
fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09  refs/tags/v5.1.0   # v5 == v5.1.0, unchanged, still a tag under E-5
```

```
$ git ls-remote --tags https://github.com/oven-sh/setup-bun.git 'v2*'
0c5077e51419868618aeaa5fe8019c62421857d6  refs/tags/v2
...
0c5077e51419868618aeaa5fe8019c62421857d6  refs/tags/v2.2.0   # v2 == v2.2.0 — the SHA pinned in ci.yml, commented # v2.2.0
```

```
$ git ls-remote --tags https://github.com/astral-sh/setup-uv.git v6 'v6^{}'
d0d8abe699bfb85fec6de9f7adb5ae17292296ff  refs/tags/v6        # annotated tag object, not the commit
d0cc045d04ccac9d8b7881df0226f9e82c39688e  refs/tags/v6^{}     # peeled: the commit v6 actually resolves to
$ git ls-remote --tags https://github.com/astral-sh/setup-uv.git 'v6.8*'
1433459b8b2ef3e40689abb4c58ea999f6a59b67  refs/tags/v6.8
d0cc045d04ccac9d8b7881df0226f9e82c39688e  refs/tags/v6.8^{}   # peeled v6.8 == peeled v6 == the pinned SHA
d0cc045d04ccac9d8b7881df0226f9e82c39688e  refs/tags/v6.8.0    # v6.8.0 is a lightweight tag directly on that commit
```
setup-uv's `v6` and `v6.8` are annotated tags — `git ls-remote` alone returns the
*tag object* SHA, not the commit. `v6^{}` peels it to the commit, which matches
`v6.8.0` (lightweight) directly. `d0cc045d04ccac9d8b7881df0226f9e82c39688e` is
the commit pinned in `ci.yml`, commented `# v6.8.0` — correct.

```
$ git ls-remote --tags https://github.com/actions/upload-artifact.git 'v4*'
ea165f8d65b6e75b540449e92b4886f43607fa02  refs/tags/v4
...
ea165f8d65b6e75b540449e92b4886f43607fa02  refs/tags/v4.6.2   # v4 == v4.6.2, unchanged, still a tag under E-5
```

Summary — what each pinned reference in `ci.yml` corresponds to:

| Reference in `ci.yml` | Resolves to tag | Commit SHA verified |
|---|---|---|
| `oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0` | `v2`, `v2.2.0` | matches |
| `astral-sh/setup-uv@d0cc045d04ccac9d8b7881df0226f9e82c39688e # v6.8.0` | `v6` (peeled), `v6.8.0` | matches |

(`actions/checkout@v5` and `actions/upload-artifact@v4` are in the tag
category — no SHA to check for either.)

### Criterion 10 — mutations run by hand, all reverted

1. `oven-sh/setup-bun@<sha> # v2.2.0` → `oven-sh/setup-bun@v2` (pinned rewritten
   to a tag): "every non-`actions/*` reference is pinned…" turned red. Reverted.
2. `actions/checkout@v5` → `actions/checkout@main` (tag rewritten to a branch
   name): both the "no `@main`/`@master`/`@latest`" test and the "`actions/*`
   stay on a tag" test turned red. Reverted.
3. `actions/checkout@v5` → `actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0`
   (tag rewritten to a *tighter* SHA): all 4 tests stayed green — pinning more
   than the rule requires is never punished. Reverted; `git diff --stat` after
   each revert confirmed the working tree matched the pre-mutation state.

### Verification run

```
$ git diff origin/main -- .github/workflows/ci.yml   # 6 uses: lines only, nothing else — shown in full above
$ git diff origin/main -- engineering-decisions.md    # E-1..E-4 unchanged; E-5 appended
$ git diff origin/main -- .github/workflows/blocked-run-notice.yml   # empty
$ git status --short
 M .github/workflows/ci.yml
 M engineering-decisions.md
 M tasks.md
?? frontend/src/ci-workflow-pins.test.ts
$ cd frontend && bun test            # 142 pass, 0 fail (includes the 4 new tests)
$ cd frontend && bun test conventions-doc   # 50 pass, 0 fail — criterion 12
$ cd frontend && bun run lint        # exit 0
$ cd question-bank && bun install --frozen-lockfile && bun run typecheck && bun test   # clean, 19 pass
```

### What I deliberately did not do

- **Did not run `bun run typecheck` clean in `frontend/`.** This sandbox's bun
  registry (`europe-west1-npm.pkg.dev/...`) 403s on several packages unrelated
  to this task — `react-simple-maps`, `us-atlas` and their `d3-*` transitive
  deps — so `node_modules/react-simple-maps` was never installed and
  `src/components/UsMap.tsx` (untouched by this task) fails to resolve two
  imports. Confirmed pre-existing and unrelated: `git status --short` shows no
  `package.json` or lockfile touched by this task, and the same failure exists
  on a clean checkout of this branch before any of my edits. `bun test` and
  `bun run lint` both ran clean regardless — only `tsc --noEmit` is blocked by
  the missing packages. The tester should expect the same registry block
  locally and should treat criterion 13's real CI run (which has normal
  registry access) as the authority for whether the frontend job is actually
  green.
- **Did not touch `conventions.md`.** See "Files changed" above — nothing
  there needed to change, and the fragile longest-backticked-run assertion made
  touching it a risk with no criterion requiring it.
- **Did not enable Dependabot or Renovate.** Explicitly out of scope; added
  T-060 to `tasks.md` instead, per the brief's own instruction.
- **Did not run the backend or e2e suites.** Out of this task's Constraints
  ("Files expected to change") and untouched by the diff; criterion 13 is the
  check that covers all six CI jobs, on the real runner.

### Contradictions found

None. The survey in "What is already true" matched the repo exactly — same 13
references, same line numbers, same four actions, no Dependabot config, no
`blocked-run-notice.yml` changes needed.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

- **The "brief-approved" `main` in Constraints/context is the stale local ref,
  not `origin/main`.** Local `main` sat at PR #30 (`c3bc443`); `origin/main` is
  at PR #33 (`6faef78`), which is what "What is already true" was surveyed
  against and what this branch actually forked from. Every diff in this
  Handoff is against `origin/main`; a diff against local `main` would show
  unrelated comment changes from T-005/T-006/T-007 that already landed on
  `origin/main` before this branch existed. Worth a `git fetch` before diffing
  in future tasks on this repo, since the discrepancy is silent otherwise.
- **The publisher split (owner `actions` vs. everyone else) was a genuine
  judgment call**, not dictated by the criteria — "pin everything" and "pin
  nothing" were both available and both satisfy criteria 1-6 as written. I
  went with the split because it matches the brief's own example ("first-party
  `actions/*` versus third-party") and lands closer to the repo's existing
  risk posture (E-4's vendored-vs-ours directory boundary is the same shape of
  argument: treat two categories differently rather than uniformly). Reviewer
  should treat this as the one part of the Handoff that is an opinion, not a
  fact, and is free to disagree — the criteria don't force this specific
  split, only *a* split (or a uniform answer) that resolves all four actions.
- **T-060** (Dependabot/Renovate for `github-actions`) depends on T-008 by
  citation only — nothing blocks it from being picked up before T-008 is
  merged, but it references `engineering-decisions.md` E-5 by name, so
  ordering it after T-008 avoids a forward reference.
