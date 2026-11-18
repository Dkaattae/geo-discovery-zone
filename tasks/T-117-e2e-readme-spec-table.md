# T-117 — `e2e/README.md`'s spec table lists two of five specs

**Status:** `approved`
**Next step:** `human` (merge PR #150)
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
| worker | 2026-11-18 | cse_011oDiJfZc4iaqo64UcGBTnV |
| tester | 2026-11-18 | cse_011oDiJfZc4iaqo64UcGBTnV (orchestrated; fresh subagent context) |
| reviewer | 2026-11-18 | cse_011oDiJfZc4iaqo64UcGBTnV (orchestrated; fresh subagent context) |

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
- **Worker, 2026-11-18.**
  - **Row order**: the new rows go before `app.ts`, which stays last. This keeps the
    specs together, with the helper module at the end.
  - **No surprises**: the brief matched the code. `collectHydrationErrors` already
    listens on both `console` and `pageerror`.

## Handoff

Worker, 2026-11-18.

**TL;DR: `e2e/README.md` now has six table rows, one per file in `e2e/tests/`, and a
`pageerror` paragraph under "How they are written". It is a docs-only change, so no test
reads it. Next is the tester, who checks criteria 1–4 by reading the file.**

**Same session id as the expander.** The orchestrator ran both roles in the session
`cse_011oDiJfZc4iaqo64UcGBTnV`. The tester's session must differ from it.

### What changed

- **`e2e/README.md`**: the only file touched.
  - It gains three table rows: `map-click.spec.ts`, `first-load.spec.ts` and
    `first-load-head.spec.ts`. They sit between the `progress.spec.ts` row and the
    `app.ts` row, so all three existing rows are byte-identical.
  - It gains one paragraph at the end of `## How they are written`, just before
    `## Two things the suite found`.
- **This brief**: Status, Next step, Sessions row, Handoff, Notes.

### Criteria

| # | Where | Evidence |
|---|---|---|
| 1 | Table under "Why these and not more backend tests" | `diff <(ls e2e/tests/) <(awk '/^\| File \|/{f=1;next} f&&/^\|---/{next} f&&/^\|/{print} f&&!/^\|/{exit}' e2e/README.md \| sed -E 's/^\| `([^`]+)`.*/\1/' \| sort)` prints nothing. Six rows, no duplicates. |
| 2 | The three new rows | **`first-load.spec.ts`**: "both signed out … and signed in". This matches its two `test(...)` names. **`first-load-head.spec.ts`**: title and meta description. This matches `toHaveTitle` and the description `content` check. **`map-click.spec.ts`**: contains `map_click`. Each clause matches an assertion in its single test (detail below). |
| 3 | Final paragraph of `## How they are written` | It contains `pageerror`, `console.error`, `reportError` and `E-33`. It also names `collectHydrationErrors` in `app.ts`. |
| 4 | `git diff main -- . ':!tasks' ':!tasks.md' ':!PROGRESS.md'` | `e2e/README.md` plus `runs/T-117-e2e-readme-spec-table.md` (see Contradictions). |

**Each `map-click.spec.ts` clause, and the assertion behind it:**

- **"every state is a keyboard control"**: `TAPPABLE` count equals the drawn count, and none has a `tabindex` other than 0 (comment "25").
- **"one tap sends one answer"**: Enter sends exactly one `{questionId, tappedGeometryId}`. Clicks during the reveal send nothing. The tap on the answer sends exactly one (comments 25/26, 27, 26/28).
- **"the reveal names and draws the answer apart from the tapped state"**: the banner reads "The answer is …". Exactly one `--map-correct` fill, and exactly two one-of-a-kind drawings (comments 29, 30).
- **"Next waits"**: `toBeDisabled` and then `toBeEnabled` (comment 31).
- **"undo reopens the map"**: after the undo click, every state is tappable and all states are drawn alike (comment 32).

### Deliberately not done

- **The `app.ts` row's "Every selector in the suite" is still wrong.** `map-click.spec.ts` has its own `TAPPABLE`. Criterion 4 keeps the row frozen, so I left it.
- **The stale "map cannot fill in on a child's first day" paragraph is unchanged.** It is outside the table and outside "How they are written".
- **Reviewer to decide** whether either stale item becomes a `tasks.md` entry, as the expander's Notes propose.

### Contradictions with the brief

- **Criterion 4, read literally, also catches `runs/T-117-e2e-readme-spec-table.md`.**
  - The orchestrator added it in `d98f9e8` ("T-117 orchestrator: run log…").
  - The criterion's exclusion list names `tasks/`, `tasks.md` and `PROGRESS.md`, but not `runs/`.
  - The worker did not add the file. It is the run log that the loop writes for every orchestrated task.
  - **Tester to confirm** this is the expected orchestrator artifact and not a scope breach. **Process owner** to decide whether future light briefs should exclude `runs/` too.

### How to run

- **No code changed.** The checks are the `diff` command above and reading the file.
- **`question-bank`**: `bun test` gives 229 pass, 0 fail.
- **`frontend`**: `bun test` gives 6 load errors (`Cannot find package 'react-simple-maps'`).
  - Cause: `bun install` gets proxy 403s on d3 tarballs in this sandbox.
  - My change did not cause them: the result is the same with my edit stashed.
- **e2e**: not run. It needs the docker stack, and no spec changed.
- **Typecheck and lint**: not run. No TypeScript or Python changed.

### Tests made stale

None.

## Verdict

Tester, 2026-11-18.

**TL;DR: pass. All four criteria hold, checked by hand (docs only; no test reads `e2e/README.md`, and none was added). Next is the reviewer.**

**Independence.** This run is orchestrated (`runs/T-117-e2e-readme-spec-table.md` exists), so my session id matches the worker's and the expander's; that proves nothing either way. My independence rests only on being a freshly spawned subagent with its own context: I did not see the worker's reasoning. That is weaker than a separate session, because it depends on the orchestrator having spawned me correctly.

| # | Verdict | What I ran and saw |
|---|---|---|
| 1 | met | The handoff's `diff <(ls e2e/tests/) <(awk … e2e/README.md \| sed … \| sort)` printed nothing (sets equal, six files). `uniq -d` on the table's first column printed nothing (no duplicates). Each first column is a bare backticked filename. |
| 2 | met | Read each new row against the file's `test(...)` names and assertions. `first-load.spec.ts`: the row says "both signed out … and signed in", matching the two tests `a signed-out first load…` / `a signed-in first load…`. `first-load-head.spec.ts`: title and meta description, matching `toHaveTitle` and the `content` check. `map-click.spec.ts`: contains literal `map_click`; each clause (keyboard control via `tabindex="0"` + Enter, exactly one answer sent, banner "The answer is …" plus two one-of-a-kind drawings, Next `toBeDisabled` then `toBeEnabled`, undo makes every state tappable and alike) has an assertion in the single test. No new row claims anything that is not asserted. |
| 3 | met | The new paragraph sits after `## How they are written` and before `## Two things the suite found`. It contains `pageerror`, `console.error`, `reportError` and `E-33`. E-33 exists (`engineering-decisions.md:2244`). The paragraph is accurate: `app.ts:432` registers `page.on("pageerror", …)`. |
| 4 | met | `git diff --stat origin/main...HEAD` lists `e2e/README.md`, `tasks/T-117-…` and `runs/T-117-…`. The `e2e/README.md` diff has 0 removed lines, so the three existing rows and every other section are byte-for-byte unchanged. Nothing under `e2e/tests/`, no other doc, and no lockfile changed. |

**On `runs/` in criterion 4.** The worker flagged that the criterion's exclusion list leaves out `runs/`. `runs/T-117-…` was added by the orchestrator (`d98f9e8`), and `process.md` line 75 places `runs/` in the orchestrator's write scope. It is the loop's own record, not task content, so I do not count it as a scope breach. Process owner may want light briefs to exclude `runs/` explicitly.

**Suite.** `question-bank`: `bun test` gave 229 pass, 0 fail. I did not run frontend, e2e, typecheck or lint: no code changed. The worker reports a pre-existing frontend load failure in this sandbox (`react-simple-maps` missing after proxy 403s), which has nothing to do with this diff.

**Tests added:** none, as the brief's Notes direct. **Mutations:** none; the deliverable is not tests. **Pre-existing tests changed:** none.

## Review

Reviewer, 2026-11-18.

**TL;DR: approved, inside the envelope. Ten added lines in `e2e/README.md`, nothing removed, every claim checked against the specs. Two stale bits next to the edit go to a new task, T-118; nothing blocks.**

- **Every role's commit is in the PR.** Expander `4b16b9a`/`feef08b`, worker `a145417`, tester `e25287c`, orchestrator `d98f9e8`/`e33fbda`/`9b72fab`.
- **Each role stayed in its lane.** The expander touched only `tasks/`. The tester touched only the brief. The worker touched `e2e/README.md` and the brief. The orchestrator touched `runs/` and the stamp line.
- **It fits the file.** The new rows use the table's existing wording style. The new paragraph opens with a bold lead, as its three neighbours do.
- **The rows are true.** I read them against `map-click.spec.ts:125-230` and `first-load*.spec.ts`. Every clause has an assertion behind it, and none is missing.
- **The paragraph is true.** It matches the record in `PROGRESS.md` (T-048) and E-33. It links E-33 instead of restating it.
- **Scope held.** The diff has 0 removed lines in `e2e/README.md`. No dependency, no spec, no child-facing text.

**Flags, disposed of:**

- **The `app.ts` row's "Every selector in the suite" is false** (`map-click.spec.ts:25` defines its own `TAPPABLE`). Not blocking. It goes to **new T-118**.
- **"The map cannot fill in on a child's first day" (`e2e/README.md:72-79`) is stale.** It says "at most two questions per state" and points at T-050. T-026 made that false. Not blocking. It also goes to **T-118**: it is false today, whatever T-056 decides, so it should not wait for T-056. T-056 gets a one-line note to re-check the paragraph when it lands.
- **Criterion 4 does not exclude `runs/`.** The orchestrator's run log is expected, not a scope breach. Already owned by **P-6** in `process-tasks.md` (its "`runs/` belongs in the excluding list" bullet), so nothing new is queued.
- **Tester independence rests on the subagent spawn.** That is already **P-14**. Nothing new.

**Envelope:** the tester passed. `Test changes: none` and `CI fix: none`. No file changed outside the Constraints (`runs/` is the orchestrator's). No dependency, no `openapi.yaml`, migration or plan change, and no child-facing text. No product decision. The diff is small. CI on the PR head has to be green before the PR is marked ready.
