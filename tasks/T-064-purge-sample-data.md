# T-064 — Purge `question-bank/sample-data/` now the full bank is proven

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** a person — 2026-10-20, in the orchestrator session ("approved, start the worker"). See `runs/T-064-purge-sample-data.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-064
**Branch:** `claude/optimistic-pascal-wk81ey`
**PR:** #89, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-20 | cse_0155zx41KsbKu7xBvuZNrYFV |

> **Not a light brief.** `tasks.md` sizes this `S`, but it needs more than four
> criteria, and the deletion makes pre-existing tests stale in at least eleven
> files (see Context). Every one of those edits needs an approved Test change
> request (D-14, D-15). **Plan to attend the tester step.** M is the honest size.

## Goal

`question-bank/sample-data/` was a one-state teaching copy of the entity shape,
kept "until the committed bank is shown to work end to end". T-040 (PR #88) made
the committed 50-state bank the bank the app serves, so the condition has been met.
The sample is now a frozen, drifting duplicate. It lacks `top_crops` and
`top_livestock`, and its README claims `build:sample` gives the "same output".
Every curation task since T-010 has had to add an exception for it in five
tests. Delete it, and every live claim that it exists.

## Acceptance criteria

**Frozen once approved.** "Base" below means `origin/main` at `97780b5`, the
commit this branch was cut from.

**The directory and its script**

1. No path under `question-bank/sample-data/` is tracked, so
   `git ls-files question-bank/sample-data` prints nothing. The directory also
   does not exist in a fresh checkout of the branch.
2. `question-bank/package.json` has no `scripts` key named `build:sample`.
3. No value in `question-bank/package.json`'s `scripts` contains the string
   `sample-data`.
4. Apart from removing the `build:sample` line, `question-bank/package.json`
   is byte-identical to base. The other script keys and values,
   `devDependencies`, and every other field are unchanged.

**Live docs stop describing it**

5. None of these files contains the string `sample-data` or `build:sample`:
   `README.md`, `conventions.md`, `test-guidelines.md`,
   `question-bank/README.md`, and every non-test `.ts` file under
   `question-bank/src/`. Non-test means a name not ending in `.test.ts`.
   `question-bank/src/build.ts`'s header comment is the one known instance.
6. In `PROGRESS.md`, the text above the `## Completed tasks` heading does not
   contain `sample-data` or `build:sample`. `PROGRESS.md:118` is the one known
   instance. Text from `## Completed tasks` down is history and is exempt.
7. `question-bank/README.md` still gives a reader a single entity record to
   look at. It names the path `data/us-states/us-state-co.json`, or another
   specific `data/us-states/us-state-<xx>.json` file, as an example of one
   entity's shape. Naming only the directory does not satisfy this.

**Nothing else moves**

8. Every tracked file under `question-bank/data/` (both `us-states/` and
   `questions/`) and under `question-bank/src/fixtures/` is byte-identical to
   base. No file is added there and none is removed.
9. No file under `frontend/`, `backend/`, `e2e/`, `.github/` or `.claude/`
   changes, and neither do `openapi.yaml`, `Dockerfile`, `docker-compose.yml`,
   `geoquizdataplan.md` or `process*.md`.
10. No dependency is added, removed or re-versioned. Every lockfile
    (`question-bank/bun.lock`, `frontend/bun.lock`, `e2e/bun.lock`,
    `backend/uv.lock`), `backend/pyproject.toml`, and the `dependencies` and
    `devDependencies` of every `package.json` are byte-identical to base.
11. In the diff to non-test `.ts` files under `question-bank/src/`, every
    changed line is a comment line. The pipeline's behaviour does not change.

**The guarantees the sample tests carried, kept where they still mean something**

12. The suite still contains a passing test that fails when a file tracked
    under `question-bank/data/` contains `"reviewed": false`. A mutation check
    must turn it red: add `"reviewed": false` to one tracked file under
    `question-bank/data/us-states/` and the test fails. Removing
    `sample-data/` from such a test's scan is allowed. Removing the test
    outright is not, unless another test still meets this criterion.
13. No test in the suite reads, hashes, lists or stats a path under
    `question-bank/sample-data/`. A string literal that is never resolved
    against the filesystem does not count, such as the source snippets in
    `git-exit-guard.criteria.test.ts:623` and `:687`.

**Suite and process**

14. These all pass on the branch: `bun test`, `bun run typecheck`,
    `bun run lint` and `bun run format:check` in `question-bank/`, and
    `bun test` in `frontend/`. The frontend suite is in the list because
    `frontend/src/conventions-doc.test.ts` reads `conventions.md` and
    `question-bank/package.json`.
15. A pre-existing test is deleted or modified only under a Test change request
    row in this brief that a person has approved, as `.claude/agents/tester.md`,
    D-14 and D-15 require. A pre-existing test means one present at base. The
    worker changes none of them. It lists them under **Tests made stale** in its
    Handoff.

## Out of scope

- **The digest-guard question (T-070, Q1).** Re-pinning, a shared
  neutralisation helper and the `top_crops` blind spot all stay in T-070. This
  task changes a guard only where `sample-data/` is the thing it reads. It
  does not tidy the guard's other exceptions in passing, even in a file it is
  already editing.
- **The historical record.** `engineering-decisions.md` (E-6 at `:243`, the
  prettier entry at `:772`), `PROGRESS.md` from `## Completed tasks` down,
  `runs/`, `archive/`, and `tasks.md` are left as they are. `tasks.md` is
  updated in the reviewer's sweep.
- **The committed bank's content.** No field, value or curation change.
- **The question file.** `data/questions/us-states.json` and
  `write-questions.ts` stay as they are.
- **Any replacement sample or fixture.** The committed bank is the example now.
  Do not create a new example directory.
- **The `--out` flag and `--states` subsetting in `build.ts`.** They stay. Only
  the script that pointed them at `sample-data/` goes.
- **`.gitignore` files.** None of them names `sample-data/` at base, so none
  needs to change.

## Constraints

- **Files expected to change:**
  - deleted: `question-bank/sample-data/README.md`,
    `question-bank/sample-data/index.json`,
    `question-bank/sample-data/us-state-co.json`
  - edited: `question-bank/package.json` (one script line),
    `question-bank/README.md`, `conventions.md`, `PROGRESS.md` (the "Done"
    claim at `:118`), and `question-bank/src/build.ts` (comment only)
  - the tester alone, under approved rows: the stale test files listed in
    Context
- **Worker:** must not edit any test file that existed at base (criterion 15).
  If no new test is needed, write none.
- **Dependencies:** none (criterion 10). See [`CLAUDE.md`](../CLAUDE.md),
  "Packages".
- **No network in tests**, as always (`test-guidelines.md`).
- Keep `conventions.md` true to `question-bank/package.json`.
  `frontend/src/conventions-doc.test.ts` checks that every `bun run <script>`
  it names is a real script, so removing the script without removing its
  mention would turn the suite red.

## Context

**Required reading for the worker and the tester.**

- **The queue entry:** `tasks.md`, T-064, including its 2026-10-03 amendment
  (the README is "further from true") and the expander's 2026-09-22 skip note
  (why T-040 was the precondition).
- **What is being deleted:** `question-bank/sample-data/README.md` (read it; it
  says what the sample was for), `index.json`, `us-state-co.json`.
- **The script:** `question-bank/package.json:8`, `build:sample`.
- **Live mentions found by the expander's survey** (grep `sample-data` and
  `build:sample`, excluding `runs/`, `archive/` and history):
  - `question-bank/README.md:20` (Run it) and `:188` (layout)
  - `conventions.md:69` (Commands)
  - `question-bank/src/build.ts:6` (header comment)
  - `PROGRESS.md:118` (Done › Question bank, the prettier glob claim)
- **Why the bank is now the example:** `engineering-decisions.md` E-6 (the bank
  is committed), and PR #88 / T-040 in `PROGRESS.md` "Completed tasks" (the
  bank is served).
- **Test files that read `sample-data/` at base.** These are the expander's
  candidates for **Tests made stale**. They come from a grep, not a run, so the
  worker and tester confirm them, and there may be more:
  - **Sample-vs-bank comparisons (the "five").**
    `committed-bank.test.ts:153`, `landmarks.test.ts:522`,
    `state-animals.test.ts:467`, `landmarks-verify.test.ts:447` and `:450`,
    `climate-kid-verify.test.ts:756`, `:762` and `:775`.
    `climate-kid.test.ts:583` and `:620` do the same.
  - **Byte or digest pins on the sample.** `top-crops-verify.test.ts:572` and
    `:577`, `highest-point-verify.test.ts:137`, `:394` and `:692`,
    `highest-point-metres-verify.test.ts:670`, and
    `hand-check-levels-verify.test.ts:704` (criterion 14's `sample:` key).
  - **README content tests.** `top-crops-verify.test.ts:536` and `:581`,
    `fun-facts.test.ts:396` and `:404`, and `committed-bank.test.ts:260`. That
    last one lists `sample-data/README.md` among the paths it reads.
  - **`reviewed: false` scans that include `sample-data/`.**
    `climate-kid-verify.test.ts:1122`, `landmarks-verify.test.ts:652`,
    `landmarks.test.ts:693`, `state-animals.test.ts:727`,
    `climate-kid.test.ts:831` and `fun-facts.test.ts:172`. Some of these use
    `walk()` on the directory, which may throw when it is missing. Others use
    `git ls-files`, which would just return nothing. Criterion 12 is the
    guarantee these carry.
  - **`climate-kid.test.ts:594`.** It asserts that `git diff` is clean for
    `sample-data`. It may stay green after the deletion, but criterion 13
    still applies to it.
  - **Knock-on pins in `hand-check-levels-verify.test.ts`.** Criterion 15
    (`:723`) pins every `package.json` at `aa88101`, so removing the script
    turns it red. Criterion 17 (`:768`) pins every question-bank test file at
    `aa88101`, so **any** approved edit to an older test turns it red. Each
    needs its own row.
- **How stale tests are handled:** `process.md` step 4, "Stale or wrong tests go
  through the tester, and through a person". Also `.claude/agents/tester.md`,
  and `process-decisions.md` D-14 and D-15.
- **Test style:** `test-guidelines.md`.

## Handoff

## Verdict

## Notes
