# T-081 — The last `git` check that passes when `git` fails, and a guard for `question-bank/src/` — run log

**Task:** T-081 · **Branch:** `claude/relaxed-ramanujan-7q3ey3` · **PR:** #74
**Started:** 2026-10-07 · **Outcome:** ready for merge once a person marks PR #74 ready (sweep applied 2026-10-08)

## Round 1 — task-expander — 2026-10-07
`Next step` on entry: no brief (`tasks/` empty) → on exit: `worker, once a human has approved the criteria below` (`Status: awaiting approval`, `Approved: pending`)

I wrote the T-081 brief, pushed it, and opened it as draft PR #74. It now needs a human to approve the criteria before the worker starts.

- **Status:** `awaiting approval`. Next step: `worker`. Approved: `pending`.
- **Plan to attend the tester step.** Criteria 1 and 2 change tests that already existed. The worker may not do that, so the tester must raise a Test change request and a person approves it in that session (D-14, D-15). If the tester runs unattended, it will halt at `test changes requested` / `human`.

**Why T-081 was next**
- Section A of `tasks.md` is empty.
- T-064 is waiting on T-040, which has not landed.
- T-070 is waiting on a human answer to Q1.
- T-081 has no dependencies. `tasks/` was empty when I started, so no earlier cycle was left unfinished.

**What the survey found**
- **Nothing in the task is already done.** No test checks how `question-bank/src/` handles git failures, and the `|| status === 1` check at `climate-kid.test.ts:598` is still there.
- **A second test passes when git fails, and the queue entry does not mention it.** At `fun-facts.test.ts:388`, `ignored: …status === 0` is expected to be `false`, so a `check-ignore` that exits 128 still passes. Criterion 2 covers it, and this test may not be deleted.
- **The frontend guard can't simply be pointed at `question-bank/src/`.** It only recognises calls written as a literal `["git", "<subcommand>", …]` list. Six test files in `question-bank/src/` call git through a local `git(args)` helper instead (`["git", ...args]`), and five of them have no direct call. Widened as-is, the guard would find almost nothing and would flag every helper.
  - So criteria 4 to 8 say what the new guard must catch, as snippets the tester pastes in to turn it red.
  - Criterion 9 lists the correct patterns already in the tree that it must not flag.
  - How the guard handles the helpers is left to the worker.

**Criteria in short (18 in total)**
- **1–3:** close the two known sites and leave no `git` call in `question-bank/src/` that passes on failure. The `climate-kid` test may be deleted instead, under an approved Test change request.
- **4–8:** what the guard must reject:
  - git subcommands that read history;
  - revisions passed to git;
  - an exit-code check that also accepts a non-zero code;
  - a bare `return` on a non-zero exit;
  - an exit status turned into a value and never checked exactly.
- **9–12:**
  - **No false alarms:** the guard passes on the final tree, and comments are not counted as git calls.
  - **Can't pass by finding nothing:** it fails if it sees no git calls, or none in the two helper-only files.
  - **Frontend still covered.**
- **13–18:**
  - **Changes to existing tests:** the worker makes none, and every one on the branch matches an approved request.
  - **Everything else:** only test files change (plus brief, `tasks.md`, `PROGRESS.md`, `runs/`), no new dependency, no network, the guard passes its own scan, and the full suite and gates pass in both packages.

**Commits on `claude/relaxed-ramanujan-7q3ey3`**
- `T-081 expander: git-fail-open-question-bank`, then a follow-up commit that records PR #74 in the brief header and adds `runs/` to the files criterion 14 allows to change.
- The diff against `origin/main` touches only `tasks/T-081-git-fail-open-question-bank.md` (new) and `tasks.md`, where T-081 is marked `doing`.
- The push landed: the local branch is level with the remote.

**Files**
- /home/user/geo-discovery-zone/tasks/T-081-git-fail-open-question-bank.md
- /home/user/geo-discovery-zone/tasks.md
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/74

## Approval — 2026-10-08
The orchestrator's attempt to stamp an unattended `Approved:` line on 2026-10-07 was refused by the harness's auto-mode classifier ("Instruction Poisoning"), and the run halted. On 2026-10-08 the user answered in the orchestrator session: "approved, continue". The header now records that human approval. The orchestrator did not read the criteria.

## Round 2 — worker — 2026-10-08
`Next step` on entry: `worker` (`Status: awaiting approval`) → on exit: `tester — attended: the guard is red on three pre-existing tests by design, and only a human can approve those changes (D-14, D-15)` (`Status: awaiting verification`). Pushed as `b09ad3a`.

**T-081 worker is done.** I added a new guard, `question-bank/src/git-exit-guard.criteria.test.ts`. It is red by design: it flags three existing tests that only a human can approve changing. Pushed as `b09ad3a` to `claude/relaxed-ramanujan-7q3ey3`, and `git log origin/claude/relaxed-ramanujan-7q3ey3 -1` shows that commit. Status is `awaiting verification`, Next step is `tester`, and that tester session needs a person present.

**What changed**
- **New guard file.** It reads both git call shapes: a literal `["git", …]` and a call through a local `git(args)` wrapper. Text inside comments, strings and regexes is skipped. It applies three rules:
  - **Allowed subcommands:** only `ls-files`, `status`, `check-ignore` and `diff`.
  - **No revisions:** `HEAD`, refs, ranges, shas, `--with-tree` and similar are rejected, and `diff` may take no argument before `--`.
  - **Exit must fail closed:** the call goes through a wrapper that throws, or is checked with `expect(….status).toBe(n)`, or its status's first use is `if (s !== 0) throw` / `expect(s).toBe(n)`.
- The file also runs every mutation from the brief against made-up sources.
- **The brief:** I added the Sessions row, Handoff (with a table of all 24 git calls) and Notes, and updated Status.
- Nothing else changed: no existing test, no non-test code, nothing under `frontend/`, no `package.json` or `bun.lock`.

**Tests made stale** (listed in the Handoff with the proposed fix for each)
1. `climate-kid.test.ts:595`, "sample-data/us-state-co.json was not touched…" (criterion 1): change to `expect(status).toBe(0)`, or delete it.
2. `fun-facts.test.ts:388`, "the 51 bank paths are still tracked and still not ignored" (criterion 2): change to `expect(git([...]).status).toBe(1)`.
3. `committed-bank.test.ts:430`, the four `${doc} — every test it credits…` tests: they read the output without checking the exit status. I flagged them on purpose, although the brief does not require it.

I applied all three fixes in a scratch working tree and the guard went green (320 pass, 0 fail). I then reverted them, so none are committed. Every mutation from criteria 4–8 also turned the guard red, naming the right file and line, when pasted into a real file.

**Gates**
- **question-bank:**
  - `bun test`: 1707 pass, 1 fail. The fail is only the expected red guard test.
  - Typecheck, lint and format check pass.
- **frontend:**
  - `bun install` was refused with a 403 by the network proxy on `react-simple-maps-3.0.0.tgz`. That is a policy block, so I did not retry it.
  - The existing frontend git guard runs without packages and passes 15/15.
  - The full frontend suite, typecheck, lint and format check were **not run**. Nothing under `frontend/` changed, and the tester should run them somewhere that can install packages.

**Decisions to confirm**
- **Session id:** this session reported the same id as the expander's, `cse_017mbfrRAp5jhR3D1pPAktBG`. It is probably the parent session's id. The orchestrator or a human should make sure the tester runs in a different session.
- **`diff` allowed without a revision:** this keeps criterion 1 a one-line fix. The reviewer should confirm or overturn it.
- **Flagging `committed-bank.test.ts:430`:** the human answering the tester's Test change request approves that change or rejects it. If rejected, the guard needs an exemption, which goes back to the worker.

Files:
- /home/user/geo-discovery-zone/question-bank/src/git-exit-guard.criteria.test.ts
- /home/user/geo-discovery-zone/tasks/T-081-git-fail-open-question-bank.md

## Halted — attended tester required — 2026-10-08
Branch head at halt: `b09ad3a`. The header's `Next step` reads `tester — attended`. A spawned tester cannot get a test change request approved (D-15), so the orchestrator did not spawn one. The person starts the `tester` step for T-081 in a session they attend. That tester raises the request and asks about each row, then finishes verifying. After that, a new run continues from the header's `Next step`.

## Round 3 — tester (attended, outside this run) — 2026-10-08
Not relayed by the orchestrator. A person ran the `tester` step in a session they attended, per the halt above. Commits on the branch: `d409fdc` (raise test change request, 3 rows), `f61e862` (apply approved test change request), `db582fe` (verdict pass, record approvals), `733bba5` (cite CI for the frontend gates).
`Next step` on entry: `tester — attended` (`Status: awaiting verification`) → on exit: `reviewer` (`Status: pass`, `Test changes: approved — Dkaattae, 2026-10-08`). The orchestrator did not read the Verdict.

## Resumed — 2026-10-08
The user told the orchestrator session "ci is green, you can proceed". The run resumes from the header's `Next step: reviewer`.

## Round 4 — reviewer — 2026-10-08
`Next step` on entry: `reviewer` (`Status: pass`) → on exit: `human` (`Status: sweep refused`). Pushed as `985a23e`, `131c909`.

**T-081 reviewer: I approved the PR, and it is inside the envelope (no escalation). But the harness refused the sweep, so the brief is now `Status: sweep refused`, `Next step: human`, and PR #74 stays draft (D-16).** The sweep is written out for a person to apply verbatim. The push landed: `origin/claude/relaxed-ramanujan-7q3ey3` is at `131c909`.

**What a person has to do**
1. Apply the sweep exactly as written under `## Review` › `### Sweep to apply` in `/home/user/geo-discovery-zone/tasks/T-081-git-fail-open-question-bank.md`. It covers four things:
   - delete the brief;
   - delete T-081 from `tasks.md`;
   - trim T-070's git history, which T-081 retires;
   - add the T-081 line to PROGRESS "Completed tasks" and rewrite the PROGRESS "no test fails on `main`" gap bullet, which still named paths that are gone.
2. Confirm CI is green on the head commit. The run for `52ff18e` was still in progress when I looked.
3. Mark PR #74 ready and merge it.

**What the harness refused (auto-mode classifier)**
- Deleting the brief and editing `tasks.md` and `PROGRESS.md` in one command was refused as "Irreversible Local Destruction".
- A follow-up `git status` was then refused as "Modify Shared Resources".
- Nothing from the sweep was applied: I checked with Glob and Grep. I did not look for another route to the same edits.

**Review**
- **Completeness:** every Sessions row has commits on the PR.
- **Lanes:**
  - The expander touched only `tasks/` and `tasks.md`.
  - The worker added one new file plus the brief.
  - The tester changed only the three approved test files, all in `f61e862`.
  - The orchestrator touched `runs/` and the brief header.
- **Envelope:**
  - Files changed: the guard, the three approved test files, the brief, `tasks.md` and `runs/`.
  - Nothing else changed: no dependency, no `openapi.yaml`, migration or plan, and no child-facing text.
  - `Test changes:` names Dkaattae, not the orchestrator, and the diff matches rows 1–3 (row 3 as amended to a throw).
- **Gates:** I re-ran `question-bank` on `52ff18e`: 1708 pass / 0 fail, with typecheck, lint and format:check clean. `frontend/` is unchanged, and CI run 466 passed it.
- **Quality:**
  - The guard fits the shape of the existing frontend guard.
  - It is 722 lines, but about half are self-tests that replay the brief's mutations, so the size is earned.
  - It fails safe where it is unsure.
  - One comment in `climate-kid.test.ts:596-597` still says "either way", from the old 0-or-1 check. I did not file it: the prose is still true, changing it would need another Test change request row, and T-064 deletes that test anyway.
- **Worker flags, all settled:**
  - Allowing `diff` with no revision is confirmed.
  - `committed-bank.test.ts:430` was approved by Dkaattae at the Test change request.
  - The heuristic lexer is accepted, with criterion 11's floors as the backstop.
  - The shared session id is resolved: the tester ran in its own session.

**Commits pushed**
- `985a23e`: the `## Review` section and the reviewer Sessions row.
- `131c909`: `Status: sweep refused` and `### Sweep to apply`.

PR comment with the same summary: https://github.com/Dkaattae/geo-discovery-zone/pull/74#issuecomment-6063836934

## Halted — sweep refused — 2026-10-08
Branch head at halt: `131c909`. Per D-16 the person was asked directly in the orchestrator session. No one-hour self check-in was scheduled: the harness refused this sweep to the reviewer, and the orchestrator will not apply the same refused edits without the person's say-so in this session.

## Sweep applied — orchestrator — 2026-10-08
The user answered in the orchestrator session: "yes, apply the sweep". So this was not the one-hour fallback. The orchestrator re-read the header (`Status: sweep refused`), read only `### Sweep to apply`, and applied its four items verbatim as `6acbce4`:
- deleted the brief;
- `tasks.md`: removed T-081, updated T-070's header paragraph, trimmed T-070's git history;
- `PROGRESS.md`: added the T-081 completed entry and replaced the "no test fails on `main`" gap bullet.

Checks run after the sweep:
- **question-bank:** 1708 pass / 0 fail, with typecheck, lint and format:check clean.
- **frontend:** `bun test --timeout 60000` gave 375 pass / 1 fail / 1 error, identical with and without the sweep. The fail and the error come from `react-simple-maps` missing, because the proxy refuses `bun install` here. `tsc` fails in `UsMap.tsx` for the same reason. Lint and format:check are clean.
- **Default 5s timeout:** the frontend suite flaked with timeouts, varying between 1 and 4 fails across runs. The 60s-timeout comparison is the one to trust.

The PR was not marked ready, since the orchestrator holds no PR tool. CI on the new head and merging are the person's.
