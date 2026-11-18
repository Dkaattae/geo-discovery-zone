# T-117 — `e2e/README.md`'s spec table lists two of five specs

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-11-18, unattended run. See `runs/T-117-e2e-readme-spec-table.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-117
**Branch:** `claude/keen-goodall-29lj4e`
**PR:** #150, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-18 | cse_011oDiJfZc4iaqo64UcGBTnV |

> **Light brief** (`process.md`, "The light path, for S-sized tasks"). Size `S`,
> one file, documentation only; it touches no `openapi.yaml`, migration,
> `geoquizdataplan.md` or text a child reads. Goal, Out of scope, Constraints and
> Context are dropped; what the worker needs from them is in **Notes** below.

## Acceptance criteria

**Frozen once approved.**

1. **Every file in `e2e/tests/` has exactly one row in the "What it holds down"
   table of `e2e/README.md`, and the table names no other file.** Today that set
   is six files: `app.ts`, `first-load-head.spec.ts`, `first-load.spec.ts`,
   `map-click.spec.ts`, `progress.spec.ts`, `quiz.spec.ts`. Each row's first
   column is the bare filename in backticks, as the existing rows are. Checked by
   comparing `ls e2e/tests/` with the table's first column: the two sets are
   equal, with no duplicates.
2. **Each of the three new rows says what its file actually checks**, in terms
   a reader can match against the file's `test(...)` names:
   - `first-load.spec.ts` — no hydration error on first load, **both** signed
     out and signed in (the row says both);
   - `first-load-head.spec.ts` — the page title and meta description on first
     load;
   - `map-click.spec.ts` — a `map_click` question played in a real browser
     (the row contains the literal `map_click`).
   No new row claims a behaviour that no `test(...)` in that file asserts.
3. **"How they are written" holds a paragraph saying that React 19's production
   build reports a recovered hydration mismatch as a Playwright `pageerror`
   (through `reportError`), not as a `console.error`, so a console guard must
   listen on both.** The paragraph contains the literal strings `pageerror`,
   `console.error` and `E-33`, and sits under the `## How they are written`
   heading (after it, before the next `##` heading).
4. **Nothing else changes.** The branch's diff against `main`, excluding
   `tasks/`, `tasks.md` and `PROGRESS.md`, touches `e2e/README.md` only — no file
   under `e2e/tests/`, no other doc, no dependency or lockfile. Within
   `e2e/README.md`, the `quiz.spec.ts`, `progress.spec.ts` and `app.ts` rows and
   every section other than the table and "How they are written" are
   byte-for-byte unchanged.

## Notes

Expander, 2026-11-18. In place of the dropped sections:

- **Already true, nothing to build:** the guard itself. `collectHydrationErrors`
  in `e2e/tests/app.ts` (around line 415) already listens on both `console` and
  `pageerror`. This task only documents it. E-33 in `engineering-decisions.md`
  records the finding ("Why the guard is believed"); link it, do not restate it at
  length.
- **Where to look:** `e2e/README.md` (the table is under "Why these and not more
  backend tests"; "How they are written" follows); the three new specs'
  header comments and `test(...)` names, which are what criterion 2 is matched
  against; `engineering-decisions.md` E-33.
- **Out of scope, and deliberately so** (criterion 4 holds the line). Two stale
  things the expander saw in `e2e/README.md` and left for the reviewer to queue
  if they think them worth it:
  - **The `app.ts` row says "Every selector in the suite".** Not true since T-051:
    `map-click.spec.ts` defines its own `TAPPABLE` selector and says it is
    "self-contained on purpose". The row stays as is in this task.
  - **"Two things the suite found" › "The map cannot fill in on a child's first
    day"** still says the bank "has at most two questions per state" and points at
    T-050. Since T-026 (PR #91) a mixed first sitting can colour states in; the
    single-topic half of the gap is `tasks.md` T-056. Rewording it is T-056's or a
    new task's, not this one's.
- **Testing.** Documentation only. The tester checks criteria 1–4 by reading the
  file and the diff (`test-guidelines.md`: docs are kept true by review, and no CI
  test reads `e2e/README.md`). A shape check for criterion 1 may be done by hand;
  no new test file is expected, and none should be added to a CI suite.
- **Dependencies:** none.

## Handoff

## Verdict
