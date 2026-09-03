# T-006 — The lint gate ignores warnings, and there are still seven

**Status:** `blocked` — independent tester ran 2026-09-03 in a session with a
working `bun` and an id distinct from the worker's; criteria 1,2,3,4,6,7,8,9,10
now pass **by an actual run** (not inspection); criterion 5 is unsatisfiable as
written — it names `decisions.md`, which no longer exists
**Next step:** `task-expander` — repoint criterion 5 at the file the split
(`b5a7519`) actually left it in. The two blockers a prior tester session
couldn't clear — same-id-as-worker, no working `bun` — are cleared; nothing
else needs a human here.
**Approved:** Dkaattae — 2026-08-29. Criteria frozen. The expander's git halt was
cleared by the relay session (see "Blocked on"); nothing about the criteria
changed between the halt and the approval.
**From:** [`tasks.md`](../tasks.md) T-006
**Branch:** `claude/t006-orchestrator-startup-bmqpg4` — assigned to this session by
the harness; this line is the authority, not `task/T-006-…`. Every later role
checks `git branch --show-current` against it and pushes here regardless
(`CLAUDE.md` "Branches").
**PR:** [#29](https://github.com/Dkaattae/geo-discovery-zone/pull/29) — draft,
opened 2026-08-29 against `claude/t006-orchestrator-startup-bmqpg4`, body = the
Goal and Acceptance criteria below.
**Fault:** no role after the expander could be spawned at all — the `Agent` tool
was disabled and `claude -p` was refused permission for `git commit` (measured).
Dkaattae elected to let G1 win and hand-finish the task, so the worker's changes
were made directly in the relay session. **No independent tester ran.** See
"Independence, and what it cost" below.

## Blocked on

**The brief is finished and needs no further expansion.** What is missing is
mechanical and belongs to a human or a session whose git is not gated:

1. `git add tasks/T-006-lint-gate-warnings.md tasks.md`
2. `git commit -m "T-006 expander: lint-gate-warnings"`
3. `git push -u origin claude/t006-orchestrator-startup-bmqpg4`
4. Open a **draft** PR against that branch, body = the Goal and Acceptance
   criteria below, title `T-006 — make the frontend lint gate fail on warnings`.
5. Approve: replace `Approved: pending` with a name and the date, set
   `Status: awaiting approval` → `working` and `Next step: worker`.

Read-only git worked in this session (`git status`, `git log`); only the writing
half was gated. Nothing about the task itself is undecided.

**Steps 1-4 are done** (relay session, 2026-08-29): the brief and run log are
committed and pushed at `8689d05`, and the draft PR is #29. **Step 5 — the
approval — is the only thing outstanding**, and it is a human's.


**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-08-29 | orchestrated run on `claude/t006-orchestrator-startup-bmqpg4`; `CLAUDE_CODE_REMOTE_SESSION_ID` not readable from this shell |
| worker *(by hand)* | 2026-08-29 | relay session — same session as the orchestrator and as this brief's PR. Not an independent worker session. |
| reviewer | 2026-08-29 | fresh `claude -p --agent reviewer` session; read-only — its shell refused `bun run lint` and all git writes, so it reviewed by reading and its findings were applied by the relay session |
| tester | 2026-09-03 | `session_01S5hqK8ZZJVEjVYNWAM3RrH` — **the same id as the worker's commit `592235c`**. Fresh context window, no sight of the work; not a separate session. All execution (`bun`, `eslint`, `node <script>`) and all git writes refused for approval |
| tester | 2026-09-03 | `session_01NhnicqMm1Yvc42QLXbZNWJ` — **a different id from the worker's `592235c`**, a genuinely independent session for the first time on this task. `bun` (1.3.11), `eslint` and `tsc` all executed successfully; git writes permitted |

## Goal

`frontend`'s lint script is `eslint .`, which exits 0 on warnings, so CI has been
printing `✖ 7 problems (0 errors, 7 warnings)` and passing. Make the lint gate
mean something: warnings fail, the seven existing ones are each fixed or
deliberately exempted with the reason written down, and a warning introduced in
code we actually write cannot slip past.

## Acceptance criteria

Frozen once approved. Each is checkable on its own, from a clean checkout of the
branch, with `bun install --frozen-lockfile` already run in `frontend/`.

1. **The gate is clean.** `bun run lint` in `frontend/` exits **0** on the tree as
   committed, and its output reports **0 errors and 0 warnings** — not "0 errors,
   7 warnings".

2. **Warnings fail.** With a first-party file present that violates a rule
   configured at `warn` severity, `bun run lint` in `frontend/` exits **non-zero**.
   Both sides of the edge: **0 warnings → exit 0** (criterion 1), **1 warning →
   exit non-zero**. A rule that merely got promoted to `error` while some other
   rule stays at `warn` and still passes does **not** satisfy this.

   *Evidence, one way to get it:* add a temporary `.tsx` file outside
   `frontend/src/components/ui/` that exports both a React component and a
   non-constant non-component value, run lint, delete the file, run lint again.

3. **The relaxation, if any, is narrow.** `react-refresh/only-export-components`
   still applies to first-party code **outside** `frontend/src/components/ui/`: a
   module there that exports a component alongside a non-component value produces
   a lint failure. Any exemption is scoped by a path glob no broader than
   `frontend/src/components/ui/**`, and the rule is not disabled, downgraded or
   removed for the project as a whole.

4. **No file-level silencing outside the vendored directory.** No
   `eslint-disable`, `eslint-disable-next-line` or `eslint-disable-line` comment
   for `react-refresh/only-export-components` exists anywhere under
   `frontend/src/` outside `frontend/src/components/ui/`.

5. **The choice is recorded.** `decisions.md` gains an entry, in the file's
   existing `D-n` form, that says which of the seven warnings were fixed and which
   were exempted, why that split (not "to make CI green"), and what would make it
   worth revisiting. It names the directory or the files it covers.

6. **CI runs the same command.** The `Lint` step of the `frontend` job in
   `.github/workflows/ci.yml` runs `bun run lint` and nothing else — the strictness
   lives in `frontend/`, so a developer running lint locally gets the same verdict
   CI does. No `--max-warnings` flag appears only in `ci.yml`.

7. **The dead reference is gone.** No occurrence of the string
   `brief's Handoff` remains in `.github/workflows/ci.yml`; the `question-bank`
   job's "No lint step" comment either points at PR #11 or the clause is deleted.
   The rest of that comment — why `question-bank` has no lint step — still stands.

8. **Nothing else moved.** `frontend/bun.lock` is unchanged on this branch, and no
   entry is added to or removed from `dependencies` or `devDependencies` in
   `frontend/package.json`. The `lint` script's value may change; no other script
   does.

9. **The app still works.** `bun run typecheck` and `bun test` in `frontend/` both
   pass, with no test deleted or skipped, and the frontend test count does not
   drop below the 80 recorded in `tasks.md` §A.

10. **No network in tests.** Nothing added by this task performs a network request
    at lint, typecheck or test time. The dead-proxy guard on CI's test steps is
    untouched.

## Out of scope

- **`question-bank` lint.** Giving it an eslint config or dependency is a
  dependency decision and is not this task. The comment in `ci.yml` is only
  corrected, not acted on.
- **Backend lint and format** (`make -C backend check`). Untouched.
- **Pinning the CI actions by SHA** — that is T-008, in the same file.
- **Prettier rules, formatting churn, or running `bun run format` over the tree.**
  A reformat diff would bury the change this task is actually making.
- **Refactoring or restyling `frontend/src/components/ui/`** beyond whatever a
  chosen fix strictly requires. These are shadcn-generated files nobody
  hand-edits.
- **The other six CI jobs**, `Dockerfile`, `docker-compose.yml`, `e2e/`,
  `backend/`.
- **`conventions.md`'s missing `typecheck`/CI documentation** — that is T-007.

## Constraints

- **Files expected to change:** `frontend/package.json` (the `lint` script),
  `frontend/eslint.config.js`, `decisions.md`, `.github/workflows/ci.yml`
  (comment only), and — only if the chosen fix is to fix rather than exempt —
  files under `frontend/src/components/ui/`.
- **Invariant:** every import path that resolves today still resolves. If a fix
  moves an export (`buttonVariants`, `toggleVariants`, `badgeVariants`,
  `navigationMenuTriggerStyle`, `useSidebar`, `useFormField`) to a new module, every
  call site is updated in the same commit and typecheck proves it.
- **Do not silence wholesale.** Turning the rule off globally, adding
  `--max-warnings 999`, or `/* eslint-disable */` at the top of seven files
  satisfies none of criteria 2–5.
- **Dependencies:** none without asking (`CLAUDE.md`). If the honest fix needs a
  new plugin or package, stop, write the request into this brief, set
  `Status: blocked` / `Next step: human`, and push.
- **If lint reports a warning in a file outside `frontend/src/components/ui/`** —
  `tasks.md` says all seven are inside it, re-checked 2026-08-24, but T-004 and
  T-005 have landed since — fix that file rather than widening the exemption. If it
  cannot be fixed without changing app behaviour, halt as above rather than
  widening it quietly.
- Commit messages name the role: `T-006 worker: …`, `T-006 tester: …`.

## Context

Required reading, not background.

- [`tasks.md`](../tasks.md) §A, entry **T-006** — the queue's own account,
  including the re-check on 2026-08-24 and the steer toward scoping the rule off
  `components/ui/` rather than editing vendored files.
- [`frontend/package.json`](../frontend/package.json) — `scripts.lint` is
  `eslint .`; `scripts.typecheck` is `tsc --noEmit`.
- [`frontend/eslint.config.js`](../frontend/eslint.config.js) — line 35 sets
  `react-refresh/only-export-components` to `["warn", { allowConstantExport: true }]`;
  line 9 is the only `ignores` block; there is no per-path override today.
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — the `frontend` job's
  `Lint` step is lines 55–57 (`run: bun run lint`); the stale comment is lines
  118–121, ending "see the brief's Handoff", which refers to T-003's brief (PR
  #11), swept long ago.
- **Where the warnings are.** Reading the export blocks, six are visible by
  inspection: `badge.tsx:32` (`badgeVariants`), `button.tsx:49` (`buttonVariants`),
  `toggle.tsx:42` (`toggleVariants`), `navigation-menu.tsx:111`
  (`navigationMenuTriggerStyle`), `form.tsx:163` (`useFormField`), `sidebar.tsx:742`
  (`useSidebar`). `tasks.md` counts seven. **The expander did not run eslint** — by
  role, it never runs the suite — so the seventh is unidentified here; the worker
  records the real list from an actual run in its Handoff.
- [`decisions.md`](../decisions.md) — the `D-n` format, and **D-9** and **D-10** as
  the model for a decision about the frontend's checks. The next free number is
  **D-12**.
- [`test-guidelines.md`](../test-guidelines.md) — "No network in tests, ever", and
  what a test of a config change may reasonably assert.
- [`CLAUDE.md`](../CLAUDE.md) — Packages (`bun`, never npm), and ask before adding
  a dependency.

## Handoff

**Done by hand in the relay session, not by a spawned `worker`.** Dkaattae chose
"let the gate win, hand-finish T-006" after all three spawn mechanisms were shown
closed. Every criterion below was checked by running the command named against it.

### The fix

`bun run lint` is now `eslint . --max-warnings 0`, so **any** rule at `warn`
severity fails the build — not just this one. The strictness is in
`frontend/package.json`, so a developer gets the same verdict CI does; `ci.yml`'s
`Lint` step is still a bare `bun run lint` and already was.

The seven split **1 fixed / 6 exempted**:

- **Fixed:** `frontend/src/components/screens.tsx` — `AVATARS` was exported
  alongside eight components. Nothing anywhere imports it (`grep -rn AVATARS`
  over `frontend/` and `e2e/` returns three hits, all inside that file), so it
  stopped being exported. No call site changed because there were none, and no
  import path stopped resolving.
- **Exempted:** the six shadcn-generated files in `frontend/src/components/ui/`,
  via one path glob in `eslint.config.js`, not via `eslint-disable` comments.

Reasoning is recorded in `decisions.md` **D-12** — moved to `engineering-decisions.md` **E-4** when the process/engineering split (PR #31) landed and this branch was rebased onto it; text unchanged.

### `tasks.md` was wrong, and the brief predicted it

The queue entry said, re-checked 2026-08-24, that all seven warnings were in
`components/ui/`. **They were not.** The seventh was
`src/components/screens.tsx:8` — first-party code. The brief's Constraints
anticipated exactly this and said to fix such a file rather than widen the
exemption, so that is what happened. Had I trusted `tasks.md`, the glob would have
been drawn around a file we actually write.

### Criterion by criterion

| # | Verdict | Evidence |
|---|---|---|
| 1 | **pass** | `bun run lint` exits 0 with no output at all |
| 2 | **pass** | temp `.tsx` outside `ui/` exporting a component + a function → `✖ 1 problem (0 errors, 1 warning)`, `ESLint found too many warnings (maximum: 0)`, exit 1. Probe deleted; lint back to exit 0 |
| 3 | **pass** | `eslint --print-config` gives severity `1` (warn) on `screens.tsx` and `0` (off) on `ui/button.tsx`. Rule not promoted to error, not disabled globally; glob is exactly `src/components/ui/**` |
| 4 | **pass, with one disclosure** | no rule-specific disable anywhere under `src/`. See caveat below |
| 5 | **pass** | `engineering-decisions.md` E-4 (originally written as `decisions.md` D-12, moved by the PR #31 rebase) — names the 1/6 split, the six files, why, and what would revisit it |
| 6 | **pass, already true** | `ci.yml` `Lint` step was already `run: bun run lint`; `max-warnings` appears 0 times in `ci.yml`. No change needed |
| 7 | **pass** | `brief's Handoff` now appears 0 times in `ci.yml`; clause repointed at PR #11. Rest of the comment stands |
| 8 | **pass** | `bun.lock` unchanged; `package.json` diff is one line, the `lint` script. No dependency added or removed |
| 9 | **partial — see below** | `bun test`: **80 pass, 0 fail**. `bun run typecheck`: **could not be verified** |
| 10 | **pass** | `ci.yml` diff is comment-only; the dead-proxy guard is untouched. Nothing added performs a network request |

### What I could not verify, and why

**Criterion 9's typecheck half is unverified.** `bun install --frozen-lockfile`
aborts here: `frontend/bun.lock` pins tarballs to a private registry
(`europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache`) that returns
**403** from this environment. 237 of ~600 packages installed — enough for eslint
and `bun test`, not enough for `tsc`. `bun run typecheck` reports 4 errors, all in
`UsMap.tsx`, all module-resolution failures for `react-simple-maps` and
`us-atlas`.

I did not assume those were pre-existing. I stashed the change, re-ran typecheck
on the unmodified tree, and got **byte-for-byte the same four errors**, then
restored. So the failure is the incomplete install, not this change — but
"typecheck passes" remains unproven here and **CI must be the one to confirm it.**

**Criterion 4 caveat.** No `eslint-disable` for `react-refresh/only-export-components`
exists under `frontend/src/` outside `components/ui/`. But
`frontend/src/routeTree.gen.ts:1` carries a blanket `/* eslint-disable */`, which
disables every rule including this one. It is generated by TanStack Router,
pre-dates this task, and is unchanged by it — regenerating the file would restore
it. I read criterion 4 as targeting hand-written silencing and left it alone,
**but that is an interpretation, and it is the reviewer's to overturn, not mine.**

### Independence, and what it cost

`process.md` separates worker from tester so that verification is done by someone
who has not just built the thing. **That separation does not exist for this task.**
One session opened the PR, read the criteria, wrote the code, and checked its own
work. The evidence above is real — every command was run and its output is quoted
— but it was gathered by the party with an interest in it.

Two specific risks a fresh reader should weigh: the criterion 4 interpretation
above, and criterion 2's probe, which I designed after writing the fix and could
have shaped to pass. A tester writing that probe from the criterion alone might
choose a different rule or a different file.

## Review

**2026-08-29, reviewer.** Changes requested. The change itself is approved on
reading — small, in-idiom, correctly scoped, `decisions.md` D-12 is a real
decision entry. Criteria 3, 4, 5, 6, 7, 8 and 10 pass by inspection and need no
rework. What is missing is verification, and it needs `tester`, not `worker`.

1. **No independent verification exists.** The Sessions table has no `tester`
   row and the PR has no tester commit; every verdict in the Handoff table was
   written by the session that wrote the code (process.md step 4). A session not
   already listed must run criteria 1–10 and write the `## Verdict`.
2. **Criterion 9 is unproven.** `bun run typecheck` has never passed — the work
   session's install was incomplete (private-registry 403) and produced 4
   module-resolution errors in `UsMap.tsx`. The worker showed those errors are
   identical on the unmodified tree, so they are not caused by this change, but
   the criterion says typecheck passes and nothing has shown that. Quote a
   passing run from a complete install, or PR #29's `frontend` job Typecheck
   step, and name which.
3. **Criterion 2's probe was authored by the implementer, after the fix.** Build
   a probe from the criterion alone: use a warn-severity rule *other than*
   `react-refresh/only-export-components` (the point of `--max-warnings 0` is
   that any warn-level rule fails), and prove the glob is a directory boundary
   by showing a sibling path such as `src/components/uiHelpers.tsx` still fails.
   Delete every probe file and show lint back at exit 0.

**Disposed, no action needed.** Criterion 4 and `frontend/src/routeTree.gen.ts:1`:
the blanket `/* eslint-disable */` there is TanStack-Router-generated, pre-dates
this task and is restored by regeneration. Criterion 4 targets hand-written
silencing of first-party code, so it is met. The reviewer overturns nothing —
the worker's reading stands, and no follow-up task is created.

## Verdict

**blocked — 2026-09-03.** Not a code finding. Two things stopped verification and
neither is about the change: the tester session's id is identical to the worker's,
and the session could execute nothing — `bun run lint`, `bun run typecheck` and
`bun test` are all refused for approval. Criteria 3, 4, 6, 7, 8 and 10 pass on
inspection; 5 passes in substance but names a file that no longer exists; 1, 2 and
9 — the reviewer's three findings — remain unverified.

| # | Verdict | Evidence |
|---|---|---|
| 1 | unverified | `bun run lint` refused for approval |
| 2 | unverified | cannot run lint, so cannot build a probe. Static support only: `react-hooks/exhaustive-deps` is `warn` in the plugin's `configRules` and is in force project-wide, so a second warn rule does exist for `--max-warnings 0` to bite on |
| 3 | pass (static) | base config keeps the rule at `warn` (line 35); sole override is `files: ["src/components/ui/**"]`, exactly the permitted glob. Directory-vs-prefix not proven by a run |
| 4 | pass | one `eslint-disable` under `src/` outside `ui/`: `routeTree.gen.ts:1`, generated, pre-existing, untouched. Disposed by the reviewer |
| 5 | pass in substance, criterion stale | `decisions.md` no longer exists (`b5a7519` split it). The entry is `engineering-decisions.md` E-4 and satisfies every clause. The criterion is frozen and unsatisfiable as written — `task-expander` must repoint it |
| 6 | pass | `ci.yml:55–57` runs `bun run lint` and nothing else; `max-warnings` appears 0 times in the file |
| 7 | pass | `brief's Handoff` appears 0 times; clause repointed at PR #11; rest of the comment intact |
| 8 | pass | `bun.lock` absent from the diff; `package.json` diff is the `lint` script only |
| 9 | unverified | `bun test` and `bun run typecheck` refused. No test file appears in the diff, so nothing was deleted or skipped |
| 10 | pass | `ci.yml` diff is comment-only; dead-proxy guard untouched; nothing added runs at lint/typecheck/test time |

**Independence.** `592235c` (worker) carries
`Claude-Session: .../session_01S5hqK8ZZJVEjVYNWAM3RrH`, and this session signs
with the same id; `printenv CLAUDE_CODE_REMOTE_SESSION_ID` is refused so it cannot
be refuted. `runs/T-006-lint-gate-warnings.md` exists, but T-006 was hand-finished
after spawning failed, so the orchestrated-run exemption does not apply. What this
verdict has is a fresh context window — no sight of the work, every expected value
taken from the criteria — which is real but weaker than a separate session. It is
not enough to sign the `pass` the reviewer asked for.

**Finding outside the criteria.** `frontend/eslint.config.js:44` says
"See decisions.md D-12."; both the file and the number are now wrong (E-4). The
task deletes one dead cross-reference under criterion 7 and adds another. Worth a
one-line worker fix before merge.

**Nothing was committed in the tester's own session.** `git add`/`commit`/`push`
were refused there. `git branch --show-current` matched
`claude/t006-orchestrator-startup-bmqpg4`, so there was no branch mismatch — only
a blocked write. This section was applied by a separate relay session that could
write. The probe script that would settle criteria 1, 2, 3 and 9 in one pass is
in `runs/T-006-lint-gate-warnings.md` and should be pasted in by whoever runs
next.

---

### Verdict, superseding the above — 2026-09-03, independent session

**blocked — but for one reason only, and it is the criteria's, not the code's.**
Both things the previous tester session couldn't clear are clear in this one:
`get_session` reports this session as `session_01NhnicqMm1Yvc42QLXbZNWJ`, distinct
from the worker's `592235c` (`session_01S5hqK8ZZJVEjVYNWAM3RrH`) — a genuinely
independent tester, checked against the Sessions table, not merely a fresh
context window in a shared session id. `bun` (1.3.11) is installed and `eslint`
and `tsc` both execute. Every criterion below was checked **by running the
actual command**, not by reading the config and reasoning about what it should
do.

| # | Verdict | Evidence |
|---|---|---|
| 1 | **pass** | `bun run lint` in `frontend/`: `$ eslint . --max-warnings 0`, no output, exit 0. Reproduced on PR #29's `frontend (typecheck, lint, test)` check run on this exact head commit (`87743c4`) |
| 2 | **pass** | Built the probe the reviewer asked for: a file outside `ui/` violating `react-hooks/exhaustive-deps` (warn severity, **not** the rule `ui/` is exempted from) → `✖ 1 problem (0 errors, 1 warning)`, `ESLint found too many warnings (maximum: 0)`, exit 1. Confirms `--max-warnings 0` catches any warn-level rule, not only the relaxed one. Probe deleted; lint back to exit 0, 0 warnings |
| 3 | **pass** | Two probes with the identical export shape (a component + a plain function): `src/components/uiHelpers.tsx` (a **sibling** of `ui/`, not inside it) → warns and fails; `src/components/ui/__probe_ui_export.tsx` (inside it) → silent, exit 0. Proves the glob is a directory boundary (`src/components/ui/**`), not a name-prefix match on "ui". Both probes deleted; lint back to clean |
| 4 | **pass** | `grep -rn eslint-disable frontend/src/` finds exactly one hit: `src/routeTree.gen.ts:1`, a TanStack-Router-generated file, pre-existing, unchanged by this task, restored by regeneration. Nothing hand-written under `src/` outside `ui/` disables the rule. Concur with the prior reviewer: this disposes the caveat, not a fresh finding |
| 5 | **unsatisfiable as written** | The criterion names `decisions.md`. That file does not exist — `b5a7519` split it into `process-decisions.md` and `engineering-decisions.md` before this branch's approval. `engineering-decisions.md` **E-4** satisfies every clause the criterion asks for (names the 1-fixed/6-exempted split, the six files, why not "to make CI green", and a revisit trigger), but a test that checks `engineering-decisions.md` in place of `decisions.md` would be rewriting the criterion, not verifying it (`process.md` step 4 forbids exactly that). This is the one thing left for `task-expander` |
| 6 | **pass** | `.github/workflows/ci.yml`: `Lint` step is `run: bun run lint`, nothing else. `grep -c max-warnings ci.yml` → 0 |
| 7 | **pass** | `grep -c "brief's Handoff" ci.yml` → 0. The `question-bank` "No lint step" comment now reads "the omission was first recorded in PR #11 and is still open"; the rest of the comment is byte-identical to before |
| 8 | **pass** | `git diff f08d021..HEAD -- frontend/bun.lock` → empty. `git diff f08d021..HEAD -- frontend/package.json` → one line, the `lint` script value. No `dependencies`/`devDependencies` entry added or removed |
| 9 | **pass** | Two independent sources, since this sandbox's `bun install --frozen-lockfile` still 403s on the same private-registry packages (`react-simple-maps`, `us-atlas`, `d3-*`) the prior tester hit — confirmed structural, not this task's: `git diff f08d021..HEAD -- frontend/src/components/UsMap.tsx` (the file every typecheck error is in) is empty, this task never touches it. (a) This sandbox, 237/~600 packages installed: `bun test` → **88 pass, 0 fail** (80 pre-existing + 8 added by this session, see below), no test skipped or deleted. (b) PR #29's `frontend` check run on this exact head commit (`87743c4`, job id `100769295461`, full 438-package install): `Typecheck` step (`tsc --noEmit`) produced no output and the job continued — a clean pass — and its `Test` step logged `80 pass`, `0 fail`, `322 expect() calls`, `Ran 80 tests across 3 files` |
| 10 | **pass** | `git diff f08d021..HEAD -- .github/workflows/ci.yml` is two lines inside one existing comment; the dead-proxy guard (`HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY` → `127.0.0.1:1`) a few lines below is untouched. Nothing added by this task runs at lint, typecheck or test time |

**Mutation-tested the new tests, not just written them.** For each of criteria
1-4 and 6-7, committed a real test in `frontend/src/lint-gate.test.ts`
(`bun:test`, shells out to `bun run lint` — not to `eslint` directly, so a
change to the `package.json` script itself is what the tests exercise) and broke
the thing it checks, on purpose, before reporting:

- Reverted `lint` to bare `eslint .` → criteria-2/3 tests (the "warnings fail"
  edge) went red, criterion-1's stayed green (0 warnings still exits 0 either
  way, correctly). Restored, green again.
- Deleted the `ui/**` exemption block from `eslint.config.js` → criteria-1/2/3
  tests all went red, because the six shadcn files themselves started warning.
  Restored, green again.
- Added a first-party `eslint-disable` comment (to `Button.tsx`, outside `ui/`)
  → the criterion-4 test caught the added file directly; it also tripped
  criteria-1/2/3 as a side effect, because the directive was unused on that file
  and ESLint's own "unused eslint-disable directive" is itself a warning. Left
  every mutation reverted; `git status --short` shows only the new test file
  before this commit.

Criteria 8, 9 and 10 are properties of a diff or a CI run rather than of the
local tree, so they are verified above by `git diff` against the brief's
pre-worker commit (`f08d021`) and by the PR's own CI log, not by a `bun test`
assertion — writing a test that reads its own expected value out of `git log`
would be circular.

**What is left:** `task-expander` repoints criterion 5 at wherever the
`decisions.md`/`engineering-decisions.md` split actually left the entry
(`engineering-decisions.md` E-4, today), then this brief is done. The stale
cross-reference at `frontend/eslint.config.js:44` ("See decisions.md D-12.")
is real and unrelated to any criterion; whoever fixes criterion 5 should update
it in the same pass rather than leaving a second dangling reference.

## Notes
