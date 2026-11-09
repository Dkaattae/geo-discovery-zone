# T-076 — `frontend/README.md`'s diagram and interfaces lost their layout to prettier

**Status:** `awaiting approval`
**Next step:** `worker`
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
