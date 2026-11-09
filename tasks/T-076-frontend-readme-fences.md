# T-076 — `frontend/README.md`'s diagram and interfaces lost their layout to prettier

**Status:** `blocked`
**Next step:** `task-expander`
**Approved:** orchestrator — 2026-11-09, unattended run. See `runs/T-076-frontend-readme-fences.md`.
**Test changes:** `requested`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-076
**Branch:** `task/T-076-frontend-readme-fences`
**PR:** #131, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:** Criterion 6 cannot be met as worded, because its `main` side keeps the pre-existing ` ```sh ` block that its task side strips (owner: task-expander). Separately, seven question-bank whole-tree pins are stale and wait on an attended Test change request (owner: a person).

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-09 | `cse_011oDiJbsZTbExMiPULZMiFd` |
| worker | 2026-11-09 | `cse_011oDiJbsZTbExMiPULZMiFd` |
| tester | 2026-11-09 | `cse_011oDiJbsZTbExMiPULZMiFd` (orchestrated: shared id; a freshly spawned context) |

## Goal

`frontend/README.md` is the design brief the app was built to. T-075's formatting
commit (`6d1b5df`) flattened four of its blocks because they were not in code
fences. Fence those four blocks with their original content. Prettier then leaves
them alone, and a reader sees the layout the author drew.

## Definitions used below

- **The original file** is `frontend/README.md` at commit `c2c4781`, the parent
  of `6d1b5df` (`git show c2c4781:frontend/README.md`). The repo checkout may be
  shallow: `git fetch --unshallow origin` brings the commit in.
- **The four blocks** are line ranges of the original file. The sha256 given for
  each is over those lines joined with `\n`, plus one trailing `\n`. That is the
  output of `git show c2c4781:frontend/README.md | sed -n A,Bp | sha256sum`.

| Block | Original lines | First line → last line | sha256 | On `main` today (flattened) |
|---|---|---|---|---|
| **B1** data-shape interfaces | 104–141 | `// A place in the world. Questions are generated from these.` → `}` (closes `Profile`) | `95f8a9dd2ada3652c0f79d77331350f0fe5fbc122adca7a14b8870f5b4c9bfd3` | 104–141 |
| **B2** level formula | 150–153 | `const gradeOf = …` → `// level 7.0 renders as "3rd grade · Medium"` (includes the blank line 152) | `c56ca1a16b7141ff5684f6be76c58d577916872be761df39612168ae803b26aa` | 149–152 |
| **B3** question-loop states | 166–168 | `PRESENTING  → …` → `REVEALING   → …` | `115d2f0ad70d8873381e73b7861761fc6b30fee206819a7135f826b3369a647a` | 164–166 |
| **B4** "9. Screens" diagram | 268–281 | `Splash` → `                                            └─ [Back home]` | `0b698c6d5f98bdb0edc2c42f5e8fcd4c444d1f0d55537c106085cd12ea2fc042` | 264–277 |

- **A fenced block** is a CommonMark fenced code block. It opens with a line of
  three or more backticks or tildes, optionally followed by an info string. It
  closes with a matching fence line. Its **content** is the lines between those
  two fence lines.

## Acceptance criteria

**Frozen once approved.** They change only by going back through `task-expander`
for a fresh approval.

1. **B1 is fenced, byte for byte.** `frontend/README.md` contains exactly one
   fenced block whose content is byte-identical to B1, including every line's
   leading spaces, the runs of spaces before each `//` comment, and the single
   quotes in `'state' | 'country' | 'city'`. It sits after the line `4. Data
   shapes` and before the line that starts `Ship ~15 entities`.
2. **B2 is fenced, byte for byte.** Exactly one fenced block's content is
   byte-identical to B2. That means the three spaces before the first `//`, the
   two spaces in `bandOf  =`, the blank line, and `2 * gradeOf` with no backslash
   before the `*`. It sits after the line that starts `Grade and difficulty are
   one axis` and before the line that starts `This is deliberate:`.
3. **B3 is fenced, byte for byte.** Exactly one fenced block's content is
   byte-identical to B3, with the padding after `PRESENTING`, `COMMITTED` and
   `REVEALING` that aligns the arrows. It sits after the line `States` and before
   the line `Committing an answer`.
4. **B4 is fenced, byte for byte.** Exactly one fenced block's content is
   byte-identical to B4, including the leading spaces that put `├─` and `└─` in
   the column under `──[Quit]──→`'s branch. It sits after the line `9. Screens`
   and before the line that starts `Session summary copy matters.`
5. **The flattened copies are gone.** No line of `frontend/README.md` outside a
   fenced block equals a line of `main`'s flattened ranges (the right-hand column
   in the table above) that differs from its B1–B4 original. Examples are
   `id: string; // "us-state-co"`, `↓ ↓`, `PRESENTING → question rendered, input
   live` and `├─ [Keep playing] ← default, larger`. Each block appears once, fenced.
6. **No prose moved.** Take the task's `frontend/README.md` and remove every
   fence line, every fenced block's content and every blank line. Take `main`'s
   `frontend/README.md` (at `0b78dec`) and remove the four flattened ranges and
   every blank line. The two sequences of lines are identical, in the same order.
7. **The check passes.** In `frontend/`, after `bun install --frozen-lockfile`,
   `bun run format:check` exits 0.
8. **The writer agrees with the check.** In `frontend/`, after `bun install
   --frozen-lockfile`, `bun run format` leaves `frontend/README.md`
   byte-identical. That is, the four fenced blocks survive prettier 3.9.6's
   writer unchanged.
9. **The fix is in the README alone.** No tracked file under `frontend/` contains
   the prettier ignore directive. T-075's criterion 9 test already pins this,
   and it must stay green. These files are byte-identical to `main`:
   `frontend/.prettierrc`, `frontend/.prettierignore`, `frontend/package.json`
   and `frontend/bun.lock`. No dependency is added anywhere.
10. **A frontend test run does not rewrite the README.** On a tree with
    `frontend/node_modules` installed by `bun install --frozen-lockfile`, a full
    `bun test` in `frontend/` leaves `git status --porcelain --
    frontend/README.md` empty.
11. **Nothing outside the brief's files changes.** Compared with `main`, the
    task's diff touches `frontend/README.md`, this brief, `runs/T-076-*.md`, and
    `tasks.md` and `PROGRESS.md` (the sweep only). It may also touch test files
    the tester adds, and pre-existing tests changed only through an approved
    Test change request row. Nothing else.

**Notes against the criteria (survey, 2026-11-09):**

- **Nothing here is done yet.** `frontend/README.md` has had no commit since
  `6d1b5df` (`git log 6d1b5df..origin/main -- frontend/README.md` is empty), and
  it contains no code fences at all.
- **Already true, and must stay true:** `bun run format:check` passes on `main`
  today (T-075). Criteria 7 and 8 guard against a fence that prettier would
  reformat. They do not ask for a fix to a failing check.

## Out of scope

- **Any other unfenced block in `frontend/README.md`.** That includes the
  `<ComposableMap>` JSX under "7. Map rendering", the reveal table flattened into
  one line under "The reveal — two tiers", and the `[ ]` checklist. Prettier left
  the JSX intact except for one blank line, and the other two were already broken
  in the original. Anything worth doing becomes a new `tasks.md` entry.
- **Rewording, restructuring or updating the README's content.** It describes the
  pre-backend mock-data app, for example `localStorage` and `npm i`. Correcting
  that is not this task.
- **The other three files `6d1b5df` reformatted**: `frontend/AGENTS.md`,
  `frontend/src/routes/README.md` and `frontend/src/styles.css`.
- **Changing prettier's configuration, ignore file, version or scripts**, in
  `frontend/` or `question-bank/`.
- **Fixing whatever rewrote the README when `node_modules` was missing.** That
  covers `format-gate.criteria.test.ts` running `bun run format` with an
  unresolved prettier, or anything else. The task reports what it observes (see
  Constraints and the Review checklist). A fix is a new task, because it would
  change a pre-existing test.
- **`process-tasks.md` P-17** (whole-tree pins). It is hand-done loop work.

## Constraints

- **Files expected to change:** `frontend/README.md` only, besides the loop's
  own records and the tester's tests.
- **Fences must not depend on a prettier escape hatch.** No ignore directive
  (criterion 9) and no config change. A fence whose info string names a language
  prettier formats (for example `ts`, `typescript` or `js`) is reformatted by
  default (`embeddedLanguageFormatting: "auto"`). B1 would lose its alignment
  and its single quotes, and criteria 1, 2 and 8 would catch it. Which info
  string to use, if any, is the worker's choice.
- **Tests must not hand `git` a revision.** All three suites refuse it: the
  frontend's `git-baseline-guard.criteria.test.ts` (T-073), question-bank's
  guard, and `backend/tests/test_git_revision_guard.py` (T-098). So a test
  cannot read `c2c4781` or `main` through git. The tester embeds the expected
  block content as literals copied from `c2c4781`, or pins it by the sha256s in
  the table above. Criteria 6, 9 and 11 compare against `main`. Verify those by
  hand in the Verdict, or with a literal or digest computed by hand at
  verification time.
- **No network in tests.** CI runs the frontend Test step under the dead proxy
  (T-005).
- **Dependencies:** none (CLAUDE.md "Packages").
- **The worker's Handoff must report one extra observation.** Run `bun test` in
  `frontend/` once with `frontend/node_modules` absent, then check `git status
  --porcelain -- frontend/README.md`. Report whether the README was rewritten
  and, if it was, which test did it, with the evidence. Then restore the file
  and reinstall. This is a report only. Criterion 10 is the installed case, and
  the uninstalled case is out of scope to fix.
- **Expect the whole-tree pins to go red. Plan to attend the tester step.** This
  brief, its run log and `frontend/README.md` all change tracked files that
  question-bank's whole-tree digest guards count:
  `question-bank/src/climate-cold-trade-accepted-verify.test.ts` (criterion 22:
  `MAIN_UNTOUCHABLE_SHA` / `_COUNT`, `CRITERION_22_ALLOWED`) and
  `question-bank/src/farm-animal-loose-ends-verify.test.ts` (criterion 21:
  `CRITERION_21_ALLOWED`). Others of the same family may go red too. Clearing
  them takes a Test change request approved in an attended tester session
  (D-14, D-15). Worker and tester both run **all three suites**, not only the
  frontend's (P-17's recurrence note).
- **Merge conflict expected with T-105** (PR #130, in flight). It re-pins the
  same whole-tree guards, so whichever PR merges second rebases its pins.

## Context

Required reading for the worker and the tester.

- **The file:** `frontend/README.md`, and its original, `git show
  c2c4781:frontend/README.md`.
- **What flattened it:** `git show 6d1b5df -- frontend/README.md`. This was the
  T-075 worker's reformat commit, and its message records prettier 3.9.6 with
  `frontend/.prettierrc`.
- **The gate:** `frontend/package.json` scripts `format` (`prettier --write .`)
  and `format:check` (`prettier --check .`). See `frontend/.prettierrc`,
  `frontend/.prettierignore` and `engineering-decisions.md` E-17.
- **The tests that bite:**
  - `frontend/src/format-gate.criteria.test.ts`, T-075. Criterion 5 runs
    `format:check`, criterion 7 runs the writer `bun run format` over the whole
    package, and criterion 9 bans the ignore directive.
  - `frontend/src/git-baseline-guard.criteria.test.ts`, which bans git
    revisions in tests.
- **The sightings:** `tasks.md` T-076. Five times, a frontend `bun test` without
  `node_modules` rewrote `2 * gradeOf` to `2 \* gradeOf`. That line is in B2,
  and once fenced its `*` is code, not Markdown emphasis.
- **How tests are written here:** `test-guidelines.md`, and `conventions.md` for
  commands.

## Review checklist

The criteria are testable, but this is a documentation task, so a person also
checks:

- [ ] The rendered `frontend/README.md` on GitHub shows the four blocks in
      monospace, with the comment columns in B1 and the diagram in B4 lined up.
- [ ] The worker's Handoff reports the uninstalled `bun test` observation (see
      Constraints). If the README was rewritten there, the sweep adds a
      `tasks.md` entry that names the test.

## Handoff

**TL;DR:** the four blocks are restored byte-for-byte from `c2c4781` inside
` ```text ` fences, and prettier 3.9.6 leaves them alone (`format:check` exits 0,
`format` is a no-op on the README). **Five question-bank whole-tree pins are red**:
two were already red from the expander's commits, and three go red because of
the README. All five are listed under Tests made stale. **Criterion 6 cannot pass
read literally** because of a ` ```sh ` block that was already on `main`. Its
intended reading passes. See Flags.

**Changed:**

- `frontend/README.md`: the four flattened ranges on `main` (104–141, 149–152,
  164–166, 264–277) were each replaced by a ` ```text ` line, the original lines
  from `c2c4781` (104–141, 150–153, 166–168, 268–281) and a closing ` ``` `.
  Nothing else in the file changed.
- This brief: Status, Next step, Sessions row, Handoff, Notes.

**Where each criterion stands (worker's own check; the tester verifies):**

| # | Where / evidence |
|---|---|
| 1–4 | The fenced blocks in `frontend/README.md`. The content sha256s match the table exactly: `95f8a9dd…`, `c56ca1a1…`, `115d2f0a…`, `0b698c6d…`. Each sits between the anchors the criteria name. The fifth fenced block is the existing ` ```sh ` one. |
| 5 | Checked by script: no line outside a fence equals a flattened line that differs from its original. |
| 6 | **Fails literally** and passes as intended. See Flags. |
| 7 | `bun run format:check` exits 0 ("All matched files use Prettier code style!"), with `node_modules/prettier` 3.9.6. |
| 8 | `bun run format` leaves the README sha256 unchanged at `fd47a239fe8df2faccb8e0db72c7b060f703cf912b3e43e914f60c9581981dbe`. |
| 9 | No ignore directive was added. `.prettierrc`, `.prettierignore`, `package.json` and `bun.lock` are untouched. T-075 criterion 9 is green. |
| 10 | After a full `bun test` in `frontend/`, the README sha256 is unchanged. But see "Environment": the install here is partial. |
| 11 | `git diff --name-only 0b78dec` lists `frontend/README.md`, this brief and `runs/T-076-frontend-readme-fences.md`. Nothing else. |

**Info string.** I used `text`. Prettier has no formatter for it, so it leaves
the content verbatim, and GitHub renders it in monospace with no highlighting. A
bare ` ``` ` would also have worked. `ts` would not, for the reason the
Constraints give.

**Uninstalled `bun test` observation (Constraints):**

- **On this task's tree, no rewrite happened.** I moved `frontend/node_modules`
  aside and ran a full `bun test`. `git status`/sha256 showed the README
  unchanged at `fd47a239…`. The 9 failures were all missing packages:
  `lint-gate.test.ts` couldn't find `@eslint/js`, and 4 component test files
  couldn't find `react/jsx-runtime`.
- **On `main`'s README, it does rewrite, and I identified the test.** With
  `node_modules` absent, `bun run format` resolves to a **global
  `/opt/node22/bin/prettier` at 3.8.1**, not the pinned 3.9.6. I put `main`'s
  README in place and ran `bun test src/format-gate.criteria.test.ts` alone. Line
  150 became `2 \* gradeOf`, exactly the sighting. The writer is `T-075 tester,
  criterion 7 — the writer and the check cover the same files` (`run("format")`
  at line 178). Its criterion 5 test then failed: `bun run format:check exits 0`.
  `prettier 3.8.1 --stdin-filepath README.md` on `main`'s README gives the same
  one-line diff. On the fenced README it gives no diff.
- After the test I restored the task README and moved `node_modules` back.
  Because of the fence, the uninstalled case no longer touches this file. The
  underlying hazard is still there for any other file where 3.8.1 and 3.9.6
  disagree: the test runs a writer that can resolve to an unpinned global
  prettier. **The sweep should add a `tasks.md` entry** that names
  `format-gate.criteria.test.ts` criterion 7 (Review checklist item 2).

**Environment, read before re-running anything:**

- **`bun install --frozen-lockfile` cannot complete here.** The egress proxy
  refuses with a policy denial: `ProxyConnectFailed (403) downloading tarball
  topojson-client@3.1.0`. `node_modules` is partial. Prettier 3.9.6, eslint and
  most other packages are present, but `react-simple-maps`, `us-atlas` and
  `topojson-client` are missing.
- As a result, **the "installed" frontend `bun test` shows 406 pass, 4 fail**.
  All 4 are "Cannot find package 'react-simple-maps'" in the 4 component test
  files. `typecheck` fails on the same missing modules. These are environmental
  and unrelated to a Markdown file. `format-gate` and `git-baseline-guard` show
  48/48 pass. `lint` is clean. A tester in an environment with registry access
  should get a full install. Criterion 10 is strictly about a complete install,
  so it is only partly evidenced here.
- **backend:** `uv run pytest -q` reports 1221 passed, 9 skipped.
- **question-bank:** `bun test` reports 2708 pass, 5 fail. All 5 are listed below.

**How to run:**

```sh
cd frontend && bun install --frozen-lockfile && bun run format:check && bun run format && git status --porcelain -- README.md && bun test
cd question-bank && bun test
cd backend && uv run pytest -q
```

**Tests made stale** (all are whole-tree digest pins; all should be **modified to
re-pin** to this task's tree, under an approved Test change request, D-14/D-15).
This task's `frontend/README.md` sha256 is
`fd47a239fe8df2faccb8e0db72c7b060f703cf912b3e43e914f60c9581981dbe`.

- `question-bank/src/farm-animal-loose-ends-verify.test.ts` → `T-096 criteria 17-21:
  the bank and the boundaries > criterion 21: outside the allowed files and test
  files, every tracked file is main's, and none is added`. **Already red before
  my change**, from the expander's brief and run log. Add those files and
  `frontend/README.md` to `CRITERION_21_ALLOWED`.
- `question-bank/src/climate-cold-trade-accepted-verify.test.ts` → `T-091 criterion
  22: the diff touches only the allowed files > every tracked non-test file
  outside the allowed list is 12d242e's, and none is added`. **Already red before
  my change**, for the same reason. Re-pin `MAIN_UNTOUCHABLE_SHA`/`_COUNT` or
  extend `CRITERION_22_ALLOWED`.
- `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` → `T-088
  criteria 20-25: what must not change > criterion 21: every tracked file under
  frontend/ is byte-identical to main's`. Red because of the README. Re-pin the
  frontend digest.
- `question-bank/src/map-click-no-candidates-verify.test.ts` → `T-092 criterion 16:
  no other surface changes > frontend (except []) is byte-identical to 5d72ca5`.
  Red because of the README. Re-pin the frontend digest.
- `question-bank/src/refresh-regenerate-reminder-verify.test.ts` → `T-087
  criterion 15: nothing under backend/, frontend/ or e2e/ changes > every tracked
  file under the three trees is as re-pinned by T-039, none added or removed`.
  Red because of the README. Re-pin.

The brief named only the first two. The other three are of the same family, as
its "Others may go red too" anticipated. I changed no test.

**Flags (decision, why, owner):**

- **Criterion 6 is unsatisfiable as literally worded.** The task side removes
  *every* fenced block's content. The `main` side removes only the four flattened
  ranges. So the content and fence lines of the pre-existing ` ```sh ` block
  (`git clone …` / `npm run dev`) appear only on the `main` side. The resulting
  diff is exactly those 6 lines. If `main`'s pre-existing fences are also
  stripped, the two sequences are identical, so no prose moved. I did not touch
  the `sh` block to game the wording. **Owner:** the tester judges it on intent
  and records that in the Verdict. If the tester won't, it goes back to
  `task-expander` to amend the criterion and needs a fresh approval.
- **The worker and expander Sessions rows share one session id**
  (`cse_011oDiJbsZTbExMiPULZMiFd`). This run is orchestrated from one remote
  session, and the env var is all I can report. **Owner:** the tester confirms
  its own id differs. The orchestrator notes it in the run log.

**Deliberately not done:** I did not fix the global-prettier fallback in
`format-gate.criteria.test.ts` (out of scope, and it is a pre-existing test). I
did not change the README's other unfenced blocks (JSX, reveal table,
checklist). I made no `tasks.md` entry, because that belongs to the sweep.

## Verdict

**Blocked.** The README work is right: criteria 1–5, 7, 8, 9 and 11 hold.
**Criterion 6 cannot be met as written by any correct README**, so it goes back
to `task-expander` for a rewording and a fresh approval. **Seven question-bank
whole-tree pins are stale** because of this task. The Test change request below
needs a person to approve it in an attended tester session.

**How independent this is.** This run is orchestrated (`runs/T-076-frontend-readme-fences.md`
exists), so every role shares session id `cse_011oDiJbsZTbExMiPULZMiFd`. The id
check proves nothing here. My independence rests only on being a freshly spawned
agent with its own context. I did not see the worker's conversation or reasoning.
That is weaker than a separate session, because it depends on the orchestrator
having spawned me correctly.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `readme-fences.criteria.test.ts` › criterion 1: one fenced block's content has sha256 `95f8a9dd…`, and it sits between `4. Data shapes` and `Ship ~15 entities` |
| 2 | met | Same file › criterion 2: sha256 `c56ca1a1…` and placement. A separate test checks the bare `*`, `bandOf  =` and the blank line |
| 3 | met | Same file › criterion 3: sha256 `115d2f0a…` and placement |
| 4 | met | Same file › criterion 4: sha256 `0b698c6d…` and placement |
| 5 | met | Same file › criterion 5: no line outside a fence equals any of the 42 flattened-and-changed lines, which I copied by hand from `0b78dec` (lines 104–141, 149–152, 164–166, 264–277). The brief's four examples have their own test |
| 6 | **blocked** | Cannot be met as worded. See below |
| 7 | met | Same file › criterion 7 (installed prettier is 3.9.6; `bun run format:check` exits 0). T-075's criterion 5 test is green too. CI `frontend` passed on `cd8af2b` with a full install |
| 8 | met | Same file › criterion 8: README bytes are equal before and after `bun run format`, and all four digests still match afterwards |
| 9 | met (by hand) | `git diff --quiet 0b78dec -- frontend/.prettierrc frontend/.prettierignore frontend/package.json frontend/bun.lock` exits 0, and so do question-bank's and backend's manifests and lockfiles. `git grep prettier-ignore -- frontend` finds nothing. T-075's criterion 9 test is green |
| 10 | met, partly evidenced | After a full frontend `bun test`, `git status --porcelain -- frontend/README.md` is empty. **But the install is partial:** `bun install --frozen-lockfile` gets 403 `ProxyConnectFailed` on tarballs (`d3-*`, `@types/d3-zoom`), so `react-simple-maps` is missing. CI's frontend job passed with a full install, but CI does not run the `git status` check |
| 11 | met (by hand) | Before my commit, `git diff --name-only 0b78dec` showed `frontend/README.md`, the brief and the run log. My commit adds only `frontend/src/readme-fences.criteria.test.ts` |

**Criterion 6, why it is blocked.** The criterion says:

- **Task side:** remove every fence line, every fenced block's content and every blank line.
- **`main` side:** remove only the four flattened ranges and every blank line.

`main`'s `frontend/README.md` already contains one fenced block: lines 325–330,
` ```sh ` / `git clone <this-repository-url>` / `cd <repository-name>` / `npm i` /
`npm run dev` / ` ``` `. The `main` side keeps those six lines. The task side
strips them.

My script showed the sequences differ by exactly those six lines: 146 lines on the
task side, 152 on `main`. Any README that keeps that block fails the criterion. Removing
the block would be a prose change the brief puts out of scope. Even then, a
` ```sh ` line on the `main` side can never equal a line that survives the task
side's stripping.

If `main`'s pre-existing fenced blocks are stripped the same way, the sequences
are identical, so no prose moved. But choosing that reading is a criterion
change, and that is not mine to make. **For the expander:** apply the fence
stripping to both sides, for example "remove every fence line and every fenced
block's content from both files." The worker raised the same point under Flags.

**Tests added.** `frontend/src/readme-fences.criteria.test.ts` has 14 tests, all
passing. Criteria 6, 9 (byte-identity), 10 and 11 are checked by hand above, not
asserted, because asserting them would mean resolving a git revision (T-073).

**Mutations.** Each was made to `frontend/README.md` and reverted. `cmp` against
the saved copy confirms the README is back to its pushed bytes.

| Mutation | Tests that went red |
|---|---|
| M1: drop one space of B1's `//` alignment | c1 sha, c1 placement, c8 |
| M2: `bandOf  =` → `bandOf =` | c2 sha, c2 placement, c2 `*`/blank, c8 |
| M3: `2 * gradeOf` → `2 \* gradeOf` (the sighting) | c2 sha, c2 placement, c2 `*`/blank, c8 |
| M4: B3's fence lines removed | c3 sha, c3 placement, c7, c8 |
| M5: B4's `├─` shifted one column | c4 sha, c4 placement, c8 |
| M6: B1's info string `text` → `ts` | c7, c8 (prettier reformats the block) |
| M7: B3 moved below `Committing an answer` | c3 placement, c7, c8 |
| M8: a flattened `PRESENTING → …` line added under `States` | both c5 tests |
| M9: B3's fenced block duplicated | c3 sha (count 2), c8 |

**Whole suites**, run on this branch with my test committed:

- **frontend:** `bun test` gives 420 pass, 4 fail. All 4 failures are "Cannot find package
  'react-simple-maps'", from the partial install. `lint` is clean. `typecheck` has 9
  errors, all in `UsMap.tsx` and the two `t051-*` test files, all from the same
  missing package. `format:check` passes.
- **question-bank:** `bun test` gives 2707 pass, 6 fail. All 6 are whole-tree pins, listed
  in the Test change request. `typecheck` is clean.
- **backend:** `uv run pytest -q` gives 1221 passed, 9 skipped. `ruff check` is clean.

**The worker's Tests made stale list**, checked:

- **All 5 confirmed.** A sixth goes red once my test file is tracked: T-091's
  pre-existing-test-files count goes from 127 to 128.
- **A seventh follows from the fix itself.** Re-pinning three of the files in
  `TEST_CHANGE_REQUEST_FILES` moves their digests in T-091's
  `APPLIED_REQUEST_FILE_SHAS`.
- **The dry run cleared all seven.** I applied rows 1–6 without comments: `bun test`
  gave 2712 pass, 1 fail, and the one failure was row 7, which depends on the final
  comment text. Then I reverted with `git checkout -- question-bank/src`.

**Note for whoever resumes:**

- **Re-check every value.** All the values below were observed on this branch at the
  tester commit.
- **What can change them:** an expander edit to the brief or run log does not, once
  those files are in the allowed sets. A T-105 (PR #130) merge first changes all of
  them.

## Test change request

These values were observed in a dry run at the tester commit. The run applied
rows 1–6 without comments and was then reverted. **Re-read every value when
applying:**

- **Rows 4–6 move if T-105 merges first,** and so does any value tied to a tracked
  file's bytes.
- **Row 7 depends on the comments rows 1, 2 and 4 add.** Compute it last.

"README" means `frontend/README.md`. "The tester's file" means
`frontend/src/readme-fences.criteria.test.ts`.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` › `T-088 criteria 20-25: what must not change` › "criterion 21: every tracked file under frontend/ is byte-identical to main's" | `e9d666e`, T-088: digest of every tracked file under `frontend/`. Last re-pinned by T-047 | The task changes the README (criteria 1–4), and the tester adds a test file under `frontend/` | modify | Same name and assertion. `MAIN_FRONTEND_SHA` (line 193) `4de52321…3a77` → `706eae346cd45a5b9457e0942db94b31eec7cfdd1ceb8e045830603806a2a638`, with a "Re-pinned by T-076 (Test change request row 1)" comment naming both files | |
| 2 | `question-bank/src/map-click-no-candidates-verify.test.ts` › `T-092 criterion 16: no other surface changes` › "frontend (except []) is byte-identical to 5d72ca5" | `cf63f66`, T-092: tree digest of `frontend/`. Last re-pinned by T-047 | Same as row 1 | modify | Same name and assertion. The `"frontend"` row's digest (line 743) `179208d1…22d5` → `d271c4e53ee0c08b66a0a866686553cd45d6512b02622650a1779a54165b56ef`, with a T-076 row 2 comment | |
| 3 | `question-bank/src/refresh-regenerate-reminder-verify.test.ts` › `T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes` › "every tracked file under the three trees is as re-pinned by T-039, none added or removed" | `40f6c54`, T-087: whole-tree digest of `backend/`, `frontend/`, `e2e/`. Last re-pinned by T-104 | Same as row 1 | modify | Same name and assertion. `MAIN_BOUNDARY_SHA` (line 94) `f5da4305…bd71c` → `5fea1cb359bed066c1feb28f2bca2d7ae2e87f04bcb785eceb974d1403247837`, with a T-076 row 3 comment | |
| 4 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `T-096 criteria 17-21: the bank and the boundaries` › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096: count and digest of every tracked file outside `CRITERION_21_ALLOWED` and the test files. Last re-pinned by T-104 | The task adds its brief and run log, which are new tracked files, and changes the README, which this pin counts (criterion 11 allows all three) | modify | Same name and assertions. Add `"frontend/README.md"`, `"tasks/T-076-frontend-readme-fences.md"` and `"runs/T-076-frontend-readme-fences.md"` to `CRITERION_21_ALLOWED`, with a T-076 row 4 comment. The count literal (line 623) goes from 282 to **281**, because the README leaves the counted set. That is the same move as T-047 row 1, and its comment trail gets "T-076 row 4: was 282". `MAIN_UNTOUCHABLE_SHA` (line 172) `d29be0bf…aaf` → `83c08bed16a6ed0b6741bcad55c12644b7d4d0b4f471bcdac750fb7db100aca6` | |
| 5 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091: count and digest of tracked non-test files outside `CRITERION_22_ALLOWED`. Last re-pinned by T-104 | Same as row 4 | modify | Same name and assertions. Add the same three paths to `CRITERION_22_ALLOWED`, with a T-076 row 5 comment. `MAIN_UNTOUCHABLE_COUNT` (line 106) goes from 285 to **284**, because the README leaves the counted set. `MAIN_UNTOUCHABLE_SHA` (line 97) `eba70070…3193` → `7ca071d2c6b7617ce21d4f32cc006b8c93d8af6fc88a0b3de19b7e700cc6c3e6` | |
| 6 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: …` › "pre-existing test files are main's, except ones in an approved Test change request" | `950f334`, T-091: count and digest of every pre-existing test file. Last re-pinned by T-104 | The tester adds `frontend/src/readme-fences.criteria.test.ts` | modify | Same name and assertions. `MAIN_TESTS_COUNT` (line 144) goes from 127 to **128**. `MAIN_TESTS_SHA` (line 127) `592eaba9…02df` → `ea5a5b91c0faa472f601432d08168b257c807cf4a82aa76afa1cd9b0a65802a9`. Both get a "Re-pinned by T-076 (row 6)" comment | |
| 7 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: …` › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | `950f334`, T-091: the per-file sha of each file in `TEST_CHANGE_REQUEST_FILES` | Rows 1, 2 and 4 edit `agriculture-true-wrong-answers-verify.test.ts`, `map-click-no-candidates-verify.test.ts` and `farm-animal-loose-ends-verify.test.ts`, so their pinned shas move. This is the same move as T-104 row 5 | modify | Same name and assertion. In `APPLIED_REQUEST_FILE_SHAS`, the entries for those three files take each file's sha256 **after rows 1, 2 and 4 are applied, comments included**. Without comments, the dry run gave `206f3cb4…c730`, `4d42fa24…f4ee` and `7bcf7b21…5323`. The real values will differ. Append "then by T-076 (row 7, for its row N)" to each comment trail | |

**Merge order with T-105 (PR #130).** Both PRs re-pin the same digests.
Whichever merges second needs another re-pin round on top of `main`.

## Notes

- **The survey confirmed nothing was done.** `main` has only the one ` ```sh `
  fence. All four sha256s in the Definitions table reproduce from `c2c4781`.
- **The sightings now have an explanation.** It is not "prettier unresolved". A
  global prettier 3.8.1 on `PATH` is used when `node_modules` is missing, and
  3.8.1 escapes a bare `*` in Markdown text where 3.9.6 doesn't. The fence
  removes this README from that disagreement.
- **The brief understated which pins go red:** 5 rather than 2, and 2 of those
  were already red from the expander's own commits.
