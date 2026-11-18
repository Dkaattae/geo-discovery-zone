# T-117 — `e2e/README.md`'s spec table lists two of five specs — run log

**Task:** T-117 · **Branch:** `claude/keen-goodall-29lj4e` · **PR:** #150
**Started:** 2026-11-18 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-18
`Next step` on entry: `none (no brief)` → on exit: `worker`

I wrote the brief for T-117 and opened draft PR #150. It is waiting for a person to approve it. Status: `awaiting approval`, Next step: `worker`, Approved: `pending`.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-117-e2e-readme-spec-table.md. It is a light brief (size S, documentation only, one file).
- **Branch:** `claude/keen-goodall-29lj4e`. It is written into the brief's `Branch:` header. Both commits are pushed (`4b16b9a`, `feef08b`), and the local branch matches the remote.
- **PR:** #150, draft, against `main`: https://github.com/Dkaattae/geo-discovery-zone/pull/150. Its number is in the brief's `PR:` header.
- **Diff scope:** the branch adds only the brief. Nothing outside `tasks/` changed, and neither `tasks.md` nor `PROGRESS.md` was edited.
- **Sessions row:** task-expander, 2026-11-18, cse_011oDiJfZc4iaqo64UcGBTnV.

**Why T-117.** It is the first task in the queue that nothing is waiting on. In flight was none, and the only open PR (#38) is a P-4 process ticket.

| Skipped | Why |
|---|---|
| T-085b | Waits on a reachable Census release, which a person has to pick |
| T-056 | Waits on a design decision |
| T-095 | Waits on a person's answer to its Q |
| T-110 | Waits on a wording call from Dkaattae |

**Acceptance criteria:**
1. Every file in `e2e/tests/` has exactly one row in the "What it holds down" table, and the table names no other file. There are six files today.
2. Each of the three new rows says what its spec actually checks:
   - `first-load.spec.ts`: no hydration error, signed out and signed in.
   - `first-load-head.spec.ts`: the page title and description.
   - `map-click.spec.ts`: the row contains the literal `map_click`.
3. "How they are written" has a paragraph saying React 19 reports a recovered hydration mismatch as a `pageerror`, not a `console.error`, so a guard must listen on both. It names E-33.
4. The diff touches only `e2e/README.md`, and the rows and sections it does not need to change stay byte-for-byte the same.

**Already true:** `collectHydrationErrors` in `e2e/tests/app.ts` already listens on both `console` and `pageerror`, so this task only documents it.

**Two stale passages left out of scope.** The brief's Notes list them for the reviewer to queue if worth it:
- **The `app.ts` row** says "Every selector in the suite", but `map-click.spec.ts` defines its own selector.
- **"The map cannot fill in on a child's first day"** has been out of date since T-026. Its single-topic half is T-056.

> Orchestrator note: the expander's returned result included the acceptance criteria. They are logged here verbatim as required; nothing from them enters any spawn prompt.

## Approval — orchestrator — 2026-11-18
Unattended-run stamp written into the brief's `Approved:` line.

## Round 2 — worker — 2026-11-18
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR: T-117 is built. `e2e/README.md` now has one table row per file in `e2e/tests/`, and "How they are written" has a paragraph on the `pageerror` guard that links E-33. The commit `a145417` is on `origin/claude/keen-goodall-29lj4e`. The brief is now `awaiting verification`, and the tester is next.**

**What changed**
- **`/home/user/geo-discovery-zone/e2e/README.md`**:
  - **Three new rows**: `map-click.spec.ts`, `first-load.spec.ts` and `first-load-head.spec.ts`. They go before the `app.ts` row, so the `quiz.spec.ts`, `progress.spec.ts` and `app.ts` rows are byte-identical.
  - **One new paragraph** at the end of `## How they are written`. It contains `pageerror`, `console.error`, `reportError` and `E-33`.
- **`/home/user/geo-discovery-zone/tasks/T-117-e2e-readme-spec-table.md`**: Status `awaiting verification`, Next step `tester`, my Sessions row, a full Handoff with a criterion table, and my Notes.

**Checks**
- **Criterion 1**: comparing `ls e2e/tests/` with the table's first column shows no difference.
- **Criterion 2**: I matched each clause of the `map-click` row to an assertion in its single test. That mapping is in the Handoff.
- **`question-bank` tests**: 229 pass, 0 fail.
- **`frontend` tests**: 6 fail to load with `Cannot find package 'react-simple-maps'`.
  - The sandbox proxy returns 403 on the d3 tarballs, so `bun install` cannot finish.
  - My change is not the cause: the result is the same with my edit stashed.
- **e2e, typecheck, lint**: not run. The e2e suite needs the docker stack, and no code changed.
- **Tests made stale**: none.

**Flags for later roles**
- **Criterion 4 and the run log**: read literally, criterion 4 also catches `runs/T-117-e2e-readme-spec-table.md`. The orchestrator added that file in `d98f9e8`, and the exclusion list does not name `runs/`.
  - **Tester** to confirm it is the expected orchestrator artifact, not a scope breach.
  - **Process owner** to decide whether future light briefs should exclude `runs/` too.
- **Shared session id**: the expander and I both ran in session `cse_011oDiJfZc4iaqo64UcGBTnV`. The tester's session must differ from it.
- **Two stale passages left alone, as the brief says**: the `app.ts` row still says "Every selector in the suite", and the "map cannot fill in on a child's first day" paragraph is unchanged. **Reviewer** to decide whether either becomes a `tasks.md` entry.

## Round 3 — tester — 2026-11-18
`Next step` on entry: `tester` → on exit: `reviewer`

**T-117 passed. I checked all four criteria by hand, as the brief directs for a docs-only change, and added no tests. Next step is the reviewer.**

**Independence:** this run is orchestrated, so my session id (`cse_011oDiJfZc4iaqo64UcGBTnV`) is the same as the worker's and the expander's. That proves nothing either way. My independence rests only on being a freshly spawned subagent that did not see the worker's reasoning. That is weaker than a separate session, and the Verdict says so.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | The files in `e2e/tests/` and the table's first column are the same six names, with no duplicates (`diff` and `uniq -d` both printed nothing). |
| 2 | met | Each of the three new rows matches its spec's `test(...)` names and assertions. The `map_click` row contains the literal string, and each of its clauses has an assertion behind it. No row claims anything the spec doesn't assert. |
| 3 | met | The new paragraph sits between `## How they are written` and the next `##` heading. It contains `pageerror`, `console.error`, `reportError` and `E-33`. E-33 exists, and `app.ts:432` does listen on `pageerror`. |
| 4 | met | In `e2e/README.md` the diff only adds lines, so the existing rows and other sections are unchanged. Nothing under `e2e/tests/`, no other doc and no lockfile changed. |

- **`runs/` file in the diff:** `runs/T-117-e2e-readme-spec-table.md` also differs from main. The orchestrator wrote it, and `process.md` line 75 puts `runs/` in its write scope. I don't count it as a scope breach. The process owner may want light briefs to exclude `runs/` explicitly.
- **Tests run:** `question-bank` `bun test` passed, 229 tests with 0 failures. I did not run frontend, e2e, typecheck or lint, because no code changed.

The brief now has Status `pass`, Next step `reviewer`, my Sessions row and the Verdict. I pushed it as `e25287c` to `claude/keen-goodall-29lj4e`, and `origin/claude/keen-goodall-29lj4e` now points at that commit.

File: /home/user/geo-discovery-zone/tasks/T-117-e2e-readme-spec-table.md
