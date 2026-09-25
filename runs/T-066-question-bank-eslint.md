# T-066 — `question-bank/` gets eslint and a `lint` gate — run log

**Task:** T-066 · **Branch:** `claude/relaxed-pascal-ff0fgq` · **PR:** #62
**Started:** 2026-09-25 · **Outcome:** in progress

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
