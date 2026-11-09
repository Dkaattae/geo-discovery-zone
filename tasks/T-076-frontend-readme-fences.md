# T-076 — `frontend/README.md`'s diagram and interfaces lost their layout to prettier

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** orchestrator — 2026-11-09, unattended run. See `runs/T-076-frontend-readme-fences.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-076
**Branch:** `task/T-076-frontend-readme-fences`
**PR:** #131, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-09 | `cse_011oDiJbsZTbExMiPULZMiFd` |
| worker | 2026-11-09 | `cse_011oDiJbsZTbExMiPULZMiFd` |

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

## Notes

- **The survey confirmed nothing was done.** `main` has only the one ` ```sh `
  fence. All four sha256s in the Definitions table reproduce from `c2c4781`.
- **The sightings now have an explanation.** It is not "prettier unresolved". A
  global prettier 3.8.1 on `PATH` is used when `node_modules` is missing, and
  3.8.1 escapes a bare `*` in Markdown text where 3.9.6 doesn't. The fence
  removes this README from that disagreement.
- **The brief understated which pins go red:** 5 rather than 2, and 2 of those
  were already red from the expander's own commits.
