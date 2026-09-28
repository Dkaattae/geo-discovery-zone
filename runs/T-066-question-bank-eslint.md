# T-066 — `question-bank/` gets eslint and a `lint` gate — run log

**Task:** T-066 · **Branch:** `claude/relaxed-pascal-ff0fgq` · **PR:** #62
**Started:** 2026-09-25 · **Outcome:** ready for merge — escalated to a human

## Round 1 — task-expander — 2026-09-25
`Next step` on entry: `(no brief)` → on exit: `worker`

**TL;DR**
- **I've written and pushed the T-066 brief** (eslint and a lint gate for `question-bank/`). Draft PR #62 is open. The brief reads `Status: awaiting approval`, `Next step: worker`, `Approved: pending`.
- **Why T-066:** it is the first task in the queue whose dependencies are done. It had been blocked on a dependency decision, and that is now recorded in `tasks.md` ("add eslint", katechen150621@gmail.com, 2026-09-25).
- **Next:** approve on the PR, then run the worker.

**Where it is**
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-066-question-bank-eslint.md`
- **Branch header:** `claude/relaxed-pascal-ff0fgq`. The harness assigned it; it starts from `origin/main` at `01a32eb`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/62 (draft, base `main`)
- **Push confirmed:** `origin/claude/relaxed-pascal-ff0fgq` is at `e12c538`. The diff against `origin/main` touches only the new brief and `tasks.md`, where T-066 is marked `doing` with a pointer to the brief.

**What the brief says**
- **Scope:** 19 criteria, so this is a full brief, not the light path.
  - The gate is clean on the current code and fails on warnings.
  - It covers every `.ts` file under `src/`, tests included.
  - It does not enforce formatting. Prettier stays with T-071.
  - Nothing under `data/` or `sample-data/` changes, and there is a CI step.
  - The dependencies added must come from `eslint`, `@eslint/js`, `typescript-eslint` and `globals`, with the lockfile committed.
  - The docs must mention `bun run lint`.
- **Already true:** none of the deliverable exists. Two things in the repo record that it is missing:
  - a comment in `ci.yml` (lines 118-121) saying question-bank has no lint step;
  - `frontend/src/lint-gate.test.ts:155`, which asserts that comment is there. The worker is told to update it (criterion 12).

**Worth knowing before approval**
- **TypeScript 7 risk:** `question-bank/` uses `typescript ^7.0.2`, and typescript-eslint's parser loads that package. If the approved packages cannot lint it, the brief tells the worker to set `Status: blocked` / `Next step: human` and ask. It must not downgrade TypeScript, add another parser, or pick some other workaround.
- **My reading of "add eslint":** I took it to mean the smallest set of packages that lets eslint lint TypeScript, the same ones `frontend/` uses. If it should be narrower, change criterion 14 before approving.
- **Merge will be escalated:** the task adds a dependency, so the reviewer will flag it for a human at merge time.

## Approval — 2026-09-25
The orchestrator's unattended self-stamp was refused by the session's permission
check. A human was present, so the brief was approved by katechen150621@gmail.com
in chat ("approved, go ahead with the worker") and recorded as such in `Approved:`.

## Round 2 — worker — 2026-09-25
`Next step` on entry: `worker` → on exit: `human`

**T-066 is blocked and needs a human.** typescript-eslint won't load against `question-bank/`'s `typescript@^7.0.2`, so no config built from the four approved packages can lint the TypeScript files (criterion 5 can't pass). None of the task was built. The brief says to stop here rather than work around it, so I did. The only commit is the brief update: Status `blocked`, Next step `human`, my Sessions row, Handoff and Notes. It's `d8e1dcf` on `claude/relaxed-pascal-ff0fgq`, and `git log origin/claude/relaxed-pascal-ff0fgq -1` shows it, so the push landed.

**What happened**
- **Install:** `bun add -d eslint @eslint/js typescript-eslint globals` installed eslint 10.11.0, @eslint/js 10.0.1, typescript-eslint 8.70.1 and globals 17.12.0. bun warned `incorrect peer dependency "typescript@7.0.2"`.
- **Run:** with a minimal config (the same shape as `frontend/`'s), eslint failed while loading typescript-eslint with `Error: typescript-eslint does not support TS 7.0.`
- **This is a hard stop, not a warning.** typescript-eslint deliberately throws when TypeScript's major version is 7 or higher, and it only supports TypeScript `>=4.8.4 <6.1.0`. TypeScript 7 also doesn't ship the compiler API that typescript-eslint parses with.
- **Reverted:** `package.json` and `bun.lock` are restored, the config file is deleted, `bun install --frozen-lockfile` reported no changes, and the tree is clean. No code or dependency change is committed.

**Decision needed (katechen150621@gmail.com)**

The options are in a table in the brief's Handoff. Each one is a new dependency decision, and A–C also mean `task-expander` rewrites criteria 14/15 and the brief is approved again:

| Option | What it means | Conflicts with |
|---|---|---|
| **A. Run TS 6 and TS 7 side by side** | `typescript` goes to `^6`; TS 7 stays as the type-checker under an alias such as `@typescript/native`. This is what the error message and typescript-eslint's own setup point to. | criteria 14 and 15 |
| **B. Downgrade to TS 5.8 or 6** | Matches `frontend/`, which is on `^5.8.3`. Smallest diff. | criterion 15 |
| **C. Use a different linter or parser** | For example oxlint or biome. | criterion 14 and the "add eslint" answer |
| **D. Wait** | Park T-066 until typescript-eslint supports TS 7 (their issue #10940). | none, but nothing ships |

**For the expander when the brief is rewritten:** `bun add` installs eslint 10, while `frontend/` is on eslint 9, and criterion 3 describes eslint 9's default behaviour. Decide whether to pin `eslint@^9`.

Brief: /home/user/geo-discovery-zone/tasks/T-066-question-bank-eslint.md

## Halted
`Status: blocked`, `Next step: human`, set by the worker. A human has to choose
between options A–D above (the worker's words, quoted). The orchestrator does
not answer it.

## Resumed — 2026-09-25
katechen150621@gmail.com answered in chat: "go with oxlint". Recorded in the
brief under `## Human answer`; `Next step` set to `task-expander`.

## Round 3 — task-expander — 2026-09-25
`Next step` on entry: `task-expander` → on exit: `worker`

**TL;DR:** I rewrote the T-066 brief for oxlint, as you asked ("go with oxlint"). It is committed and pushed to `claude/relaxed-pascal-ff0fgq`: `e6bccc1`, and local HEAD matches the remote. **Next step: you re-approve the brief, then the worker runs.** The earlier approval covered the eslint criteria, so I set `Approved:` back to `pending`.

**Header now reads**
- **Status:** `awaiting approval`
- **Next step:** `worker`
- **Approved:** `pending`
- **Sessions:** a new re-expand row
- **Title:** changed to "oxlint". The filename keeps `-eslint` so the existing links from `runs/` and `tasks.md` still work.

**What changed in the criteria (24 in total)**
- **Only one new dependency:** `oxlint`, as a dev dependency (criterion 16). eslint, typescript-eslint, globals and the type-aware add-on `oxlint-tsgolint` are all excluded. The `typescript@^7.0.2` entry must stay byte-for-byte unchanged (criterion 17).
- **Warnings must fail the lint.** The test runs `bun run lint` once with an extra `-W <rule>` flag against a sample file that breaks only that rule; the run must exit non-zero (criterion 6). This replaces the old eslint-9-only check.
- **Clean output is judged by the counts** — zero warnings, zero errors — not by the word "warning" being absent, because oxlint's clean summary line contains "warnings" (criterion 2).
- **The explicit-`any` rule must be switched on deliberately** (criterion 5), because oxlint leaves it off by default. There are no explicit `any`s in `question-bank/src/` today, so this should not force source edits.
- **New criteria:**
  - 3: the script uses the locally installed oxlint, never a download.
  - 11: every rule turned off or down to a warning gets a written reason.
  - 20: no eslint config file in the package.
  - 22: the docs say the package lints with oxlint, not eslint.
  - 24: a new `engineering-decisions.md` entry, E-15, explains why this package uses oxlint while `frontend/` uses eslint.
- **Existing comments that switch off lint checks** have no stated reason today: `question-bank/src/sinks/db.ts:30,39` and `question-bank/src/build.ts:83`. Criterion 10 requires a reason on each.
- **The worker stops and asks you** if installing oxlint needs a blocked install script, if the binary won't run on CI or offline, or if the criteria can't be met with oxlint alone.

**Other changes**
- **`tasks.md` T-066:** I added a line recording the switch to oxlint.
- **Round 1's Handoff is left untouched.** The next worker adds its own below it.
- **PR #62:** retitled, and its body now holds the new criteria: https://github.com/Dkaattae/geo-discovery-zone/pull/62
- **Scope of my commit:** it touches only `tasks/` and `tasks.md`.

**Files**
- /home/user/geo-discovery-zone/tasks/T-066-question-bank-eslint.md
- /home/user/geo-discovery-zone/tasks.md

## Approval — 2026-09-28
katechen150621@gmail.com approved the oxlint brief in chat ("approved, go ahead with the worker"); recorded in `Approved:`.

## Round 4 — worker — 2026-09-28
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** T-066 is built. On the committed tree, `bun run lint` in `question-bank/` uses the locally installed oxlint 1.86.0, prints `Found 0 warnings and 0 errors.`, and fails on any warning. CI now runs it, and the docs and E-15 are written. I could not run the `frontend/` suite, typecheck or lint here because its registry returns 403, so half of criterion 9 is still unchecked. The brief now says Status `awaiting verification`, Next step `tester`.

**Push:** commit `fb6926d` ("T-066 worker: question-bank gets oxlint and a lint gate") is on `origin/claude/relaxed-pascal-ff0fgq`, the brief's `Branch:` header. I confirmed it with `git log origin/claude/relaxed-pascal-ff0fgq -1`.

**What changed**
- **The lint script:** `oxlint --deny-warnings --report-unused-disable-directives --format default src`. The config, `question-bank/.oxlintrc.json`, is oxlint's defaults plus `typescript/no-explicit-any: error`. It turns nothing off.
- **The one new dependency:** only `oxlint` was added, via `bun add -d`. The `bun.lock` is committed and a frozen install leaves it unchanged. oxlint has no blocked install scripts.
- **Old suppression comments:** the three `eslint-disable` comments in `src/sinks/db.ts` and `src/build.ts` were deleted. oxlint reports all three as unused, so criterion 10 holds with zero such comments left.
- **Four warnings fixed**, all in test files, with no change in behaviour: three `no-unsafe-optional-chaining` and one `prefer-string-starts-ends-with`.
- **CI (`ci.yml`):** the job is now `question-bank (typecheck, lint, test)`, with a Lint step whose `run:` is `bun run lint` and which has the same `if:` as Typecheck. The old "No lint step … #11" comment is gone.
- **`frontend/src/lint-gate.test.ts`:** the `/No lint step[\s\S]*?#11/` check is removed. Its other tests are untouched.
- **Docs:** `conventions.md` and `question-bank/README.md` now name `bun run lint` and say the package uses oxlint, not eslint. `engineering-decisions.md` has a new E-15; no existing entry was edited.

**Where this departs from the brief** (all detailed in the Handoff)
- **I edited eight older question-bank tests the brief didn't list.** Each required `question-bank/package.json` to list exactly `@types/bun` + `typescript`, or to match `package.json`/`bun.lock` byte for byte. Criteria 9 and 16 can't both pass without changing them:
  - Six now expect `oxlint` as well.
  - `top-crops-verify`'s pinned file hashes are updated to the new files.
  - `highest-point-verify` used to compare the whole file against `origin/main`. It now compares only the dependency lists and allows just `oxlint` as new. That passes before and after the merge.
  - Any other new dependency still fails all of them.
  - **Reviewer:** confirm this isn't weakening them.
- **`--format default` is in the script** because oxlint detects an AI agent (`AI_AGENT`/`CLAUDECODE`) and switches to a format without the summary line. Without the flag, criterion 2 could not be checked from an agent session. I confirmed this by running with those variables unset.
- **`--report-unused-disable-directives` goes beyond what the brief asks.** It makes a stale suppression comment fail the lint. **Reviewer:** keep it or drop it.
- **Criterion 23 leftovers, reviewer to accept or file:**
  - `engineering-decisions.md:555` still uses the old job name. Criterion 24 forbids editing existing entries.
  - `tasks.md:137` is T-066's own problem statement.

**What I checked, and what I couldn't**
- **question-bank:** `bun test` gives 1289 pass / 0 fail, and `bun run typecheck` passes.
- **Criteria 4–8, 12, 15 and 17–20:** checked by hand with throwaway files, all removed afterwards. The warning check used `-W eqeqeq`.
- **frontend, partly checked:** `conventions-doc`, `ci-action-pinning` and `git-baseline-guard.criteria` tests give 110 pass. The lint-gate criterion 6 and 7 tests give 2 pass.
- **frontend, not checked:** `frontend/node_modules` is missing, and `bun install --frozen-lockfile` gets a 403 from `europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache`. I tried installing from a different registry and it was blocked, so I stopped. **Tester:** check this half of criterion 9 somewhere that can install, or read it off PR #62's CI.

Files:
- /home/user/geo-discovery-zone/tasks/T-066-question-bank-eslint.md (round-2 Handoff, Notes, Sessions row)
- /home/user/geo-discovery-zone/question-bank/package.json
- /home/user/geo-discovery-zone/question-bank/.oxlintrc.json
- /home/user/geo-discovery-zone/question-bank/bun.lock
- /home/user/geo-discovery-zone/.github/workflows/ci.yml
- /home/user/geo-discovery-zone/frontend/src/lint-gate.test.ts
- /home/user/geo-discovery-zone/conventions.md
- /home/user/geo-discovery-zone/question-bank/README.md
- /home/user/geo-discovery-zone/engineering-decisions.md

## Round 5 — tester — 2026-09-28
`Next step` on entry: `tester` → on exit: `reviewer`

**T-066 verdict: pass.** All 24 criteria hold on the branch. The frontend half of criterion 9 is the exception: I couldn't observe it here, so the reviewer needs to confirm PR #62's `frontend` CI job is green before merge. The brief now reads Status `verified — pass (…)` and Next step `reviewer`. My commit is `23a0576` on `claude/relaxed-pascal-ff0fgq`, and after a fetch the local HEAD and the remote branch match.

**Independence:** this is an orchestrated run (`runs/T-066-question-bank-eslint.md` exists), so every role shares session id `cse_01YTpStg8yzQNkWGJJbUnMAP` and the Sessions-table check proves nothing. My independence rests only on being a freshly spawned agent that never saw the worker's reasoning. That is weaker than a separate session, and the Verdict says so.

**What I did**
- **Handoff checked:** it exists, and every file it names is on the branch.
- **New test file:** `/home/user/geo-discovery-zone/question-bank/src/lint-gate.test.ts`, 31 tests mapped to criteria 1–8, 10, 11, 13–17 and 20–24.
  - The probes shell out to `bun run lint` and are removed in `afterEach`.
  - **Criterion 6 used `-W eqeqeq`** with the probe `a == 1`. The tests confirm the config doesn't set `eqeqeq` and that the probe is clean without `-W`.
- **Checked by hand (no permanent test):** criteria 12, 17, 18 and 19. They compare against the branch point `01a32eb`, which CI's shallow checkout doesn't have. All four are clean.
- **13 mutations, all reverted:**
  - Each one turned the matching test red, e.g. dropping `--deny-warnings` (criterion 6), dropping `no-explicit-any` (5), ignoring tests and `sinks/` (7), switching to `bunx` (3), and dropping `--format default` (2).
  - The first attempt at the `if:` mutation (M8) changed the frontend job's matching step by mistake and stayed green. That was correct behaviour. Redone on the question-bank step, it went red.
  - One control mutation, an `off` rule with a reason comment, correctly stayed green.

**Test results**
- **question-bank:** `bun test` 1320 pass / 0 fail, and the same with all six proxy variables set. `typecheck` and `lint` are clean (`Found 0 warnings and 0 errors.`).
- **frontend, passing:** `bun run lint` exits 0 and `lint-gate.test.ts` is 8/0.
- **frontend, failing for reasons outside this task:** full `bun test` is 342 pass / 1 fail, and `typecheck` has 4 errors. Every one is in the untouched `src/components/UsMap.tsx`: `react-simple-maps` and `us-atlas` are missing from `node_modules`. `bun install --frozen-lockfile` fails with a 403 from the registry, and I had no `gh` to read CI.

**Changes I had to make to my own test file**
- **It must pass the new lint gate:** it lives in `src/`, so it is linted too. Two `unicorn(prefer-string-starts-ends-with)` warnings made me swap regexes for `startsWith`.
- **It must not repeat the dead-loopback address:** the older T-014/T-015 tests allow that literal in exactly one file. My test imports `DEAD_PROXY` from `offline-rebuild.ts` instead and asserts its values match criterion 15.

**For the reviewer**
- The criterion 23 test is a phrase search, so it catches the known wording but not every paraphrase.
- In the criterion 11 test I chose to forbid `-A`/`-W` flags in the script, since a relaxation there has nowhere to carry a reason.

Files: `/home/user/geo-discovery-zone/question-bank/src/lint-gate.test.ts`, `/home/user/geo-discovery-zone/tasks/T-066-question-bank-eslint.md` (Verdict, Status, Next step, Sessions row).

## Round 6 — reviewer — 2026-09-28
`Next step` on entry: `reviewer` → on exit: `human` (brief swept at `d182d08`; last header at `382eb61`)

**I approved T-066 and escalated it.** PR #62 is marked ready for review (no longer draft), but its body opens with a note asking you not to merge it until a person has looked at two things:
- **A new dependency:** `oxlint`, added to `question-bank/`'s dev dependencies. katechen150621@gmail.com approved it in chat, but my rules send every new dependency to a person at merge time.
- **Test files changed outside the brief's allowed list:** 8 older tests that pin the package's dependency list, plus 3 small fixes the new lint rules forced. All are justified in the worker's handoff.

Nothing blocks. The sweep is committed and pushed to `claude/relaxed-pascal-ff0fgq`; the remote head matches my local HEAD at `d182d08`. **Next step: a human merges, or doesn't.** I did not merge.

**Checks before reviewing**
- **PR state:** open and not merged when I started.
- **Every role's work is in the PR:** each role in the Sessions table has a commit on this branch.
- **Each role stayed in its lane:** the expander's commits touched only `tasks.md` and `tasks/`. The tester's touched only `question-bank/src/lint-gate.test.ts` and the brief.
- **Frontend half of criterion 9:** read off PR #62's CI on `7ad85c9`. The `frontend`, `question-bank` and both backend jobs passed. `integration` and `e2e` were still running when I marked the PR ready, and the PR body says so. The diff doesn't touch anything they test, but check they are green before merging.
- **Re-ran in `question-bank/`:**
  - `bun run lint` reports `Found 0 warnings and 0 errors.`
  - `bun run typecheck` is clean.
  - `bun test`: 1320 pass, 0 fail.
- **Re-ran in `frontend/`:** the tests that read the docs and `ci.yml` (conventions, lint-gate, suite counts, git-baseline guard): 231 pass, 0 fail, after the sweep edits.

**Findings (none block)**
1. **Eight tests pin `question-bank/`'s dependency list by hand**, so every new dependency means editing all eight. I added this to T-071 (prettier) rather than opening a new task, because T-071 will hit these tests next and has to settle it anyway.
2. **`highest-point-verify.test.ts` allows `oxlint` by name.** Once PR #62 merges that exception is redundant but harmless. It goes into the same T-071 note.
3. **T-071 said the question-bank CI job "runs typecheck and test only".** That is no longer true, and I corrected it in `tasks.md`.
4. **`engineering-decisions.md:555` still uses the old job name.** I left it as history, since criterion 24 forbids editing old entries.

**Worker flags, decided**
- **`--report-unused-disable-directives`: kept.** It matches eslint 9's default in `frontend/`.
- **Deleting the three dead `eslint-disable` comments instead of annotating them: accepted.** oxlint reported that none of them suppressed anything.
- **`--format default`: accepted.** Without it, oxlint drops the summary line criterion 2 checks whenever it runs under an AI agent.
- **Editing the eight pin tests:** accepted. None of them got weaker: each still fails on any new dependency other than `oxlint`.

**Commits**
- **`382eb61`:** adds a `## Review` section and a reviewer row to the Sessions table in the brief. It also sets Status to `approved — ready for review, escalated (…)` and Next step to `human`.
- **`d182d08` (sweep):**
  - deletes the brief;
  - removes T-066 from `tasks.md`;
  - amends T-071;
  - adds a Completed-tasks entry and a "Question bank" bullet to `PROGRESS.md`.

  The brief no longer exists at the head. The Status and Review sections survive in `382eb61`.

**PR body:** holds the escalation note, all 24 criteria verbatim with what verified each, the files outside the Constraints, the findings, and what was deliberately not done. One small inaccuracy there: the code change in the three test files shows as `m[1]!`; the real change is `m![1]!`.

Files:
- /home/user/geo-discovery-zone/tasks.md
- /home/user/geo-discovery-zone/PROGRESS.md
- /home/user/geo-discovery-zone/tasks/T-066-question-bank-eslint.md (deleted; last version at `382eb61`)
- https://github.com/Dkaattae/geo-discovery-zone/pull/62

## Ended — 2026-09-28
The reviewer marked PR #62 ready and escalated it. No role merges; the PR is a
human's to merge. Path: expander → (human approval) → worker (blocked) →
(human answer: oxlint) → expander → (human approval) → worker → tester (pass) →
reviewer (approve, escalated).
