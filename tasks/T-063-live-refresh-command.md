# T-063 — A one-command live refresh of the 50-state bank, with a change summary

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** `Dkaattae — 2026-10-02, in chat (session_015hHheg4x6qXDQn72KbH5Xj), with the expander's defaults for exit codes, fixture rewrite, and criteria 5, 12, 14`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-063
**Branch:** `claude/exciting-hypatia-jqht79` — assigned by Claude Code on the web
to the expander's session; this is the task branch. Every later role pushes here
(`CLAUDE.md` "Branches").
**PR:** #68 (https://github.com/Dkaattae/geo-discovery-zone/pull/68), opened
draft at expand time against `main` from the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-02 | cse_015hHheg4x6qXDQn72KbH5Xj |
| worker | 2026-10-02 | cse_015hHheg4x6qXDQn72KbH5Xj |

**Worker model:** Opus. The task touches data correctness (what counts as a
change, and what a reviewer of the monthly PR gets to see).

## Goal

The committed bank (`question-bank/data/us-states/`, E-6) is an August 2026
reading of Wikidata and nothing refreshes it. This task builds the one command a
monthly Claude routine will run: refresh the bank from live Wikidata, keep it
reproducible offline, and print a per-state, per-field summary a human can
review in a PR — or say, unambiguously, that nothing moved.

## What is already true (survey, 2026-10-02)

- **A live build exists**: `bun run build` (`question-bank/src/build.ts`) queries
  `query.wikidata.org` and writes `data/us-states/`. It prints only counts and
  warnings — no old → new values — and has no "no change" outcome.
- **A live build cannot be committed today without breaking CI.** It stamps
  `sources.built_at` with wall clock (`normalize.ts`, `options.builtAt ??
  new Date()`), so every one of the 50 files changes on every run, and it does
  not update `src/fixtures/us-states.sparql.json` — so
  `committed-bank.test.ts` ("T-010 criteria 6 and 8"), which rebuilds offline
  from that fixture and diffs bytes, goes red. Criteria 6–8 below exist for this.
- **The offline path is already deterministic**: `--offline` takes `built_at`
  from the fixture's `_fixture.captured_at` (`build.ts`, `fixtureTransport`).
- **The fun-fact pass drafts for every entity** with a `wikipedia_title`
  (`build.ts`, `if (args.funFacts)`), regardless of curated facts. All 50 states
  carry a curated fact today (T-011), so a live run writes 50 redundant drafts.
- **Seams exist**: `SparqlTransport` (`sparql.ts`) and `SummaryTransport`
  (`sources/wikipedia.ts`). Nothing here needs a new one to be testable.

## Acceptance criteria

"The command" below means the single command this task adds, as documented in
criterion 16. "The bank directory" defaults to `question-bank/data/us-states/`
and "the fixture" to `question-bank/src/fixtures/us-states.sparql.json`; tests
point both at temporary copies (criterion 15).

**Outcomes and exit codes**

1. When the newly built entities equal the existing bank on every field **other
   than `sources.built_at`**, and the set of entity files is the same, the
   command exits with code **`2`**, and its stdout contains the line
   `bank unchanged` exactly once.
2. In the case of criterion 1, nothing is written: every file in the bank
   directory and the fixture are byte-identical before and after, and no file
   (including any `*.review.json`) is created in the bank directory.
3. When at least one entity differs on a field other than `sources.built_at`, or
   an entity file is added or removed, the command writes the new bank and
   exits with code **`0`**, and its stdout does **not** contain `bank unchanged`.
4. When the SPARQL request fails (the transport throws or returns a non-success
   response after the client's retries), the command exits with code **`1`**,
   writes nothing (bank directory and fixture byte-identical, no new files), and
   its output does **not** contain `bank unchanged`. A failure must never read as
   "no change".
5. When the live response matches **fewer than all 50** curated states, the
   command exits **`1`**, writes nothing, and names the missing state(s) in its
   output. With exactly 50 matched it proceeds to criterion 1 or 3. (49 → fail,
   50 → proceed.)

**Reproducibility after a refresh (E-6's invariant)**

6. After a changed refresh (criterion 3), the fixture holds the live SPARQL
   response that was used, and `_fixture.captured_at` names the instant of that
   refresh; every other key already in the `_fixture` block (`endpoint`,
   `query`, `why_committed`, `regenerate_with`, `note`, …) is preserved, and
   `_fixture.rows` equals the number of result bindings written.
7. After a changed refresh, every written entity's `sources.built_at` is the
   same instant as the fixture's `_fixture.captured_at`.
8. After a changed refresh, an offline build from the written fixture
   (`build.ts --offline --fixture <fixture> --out <tmp>`) reproduces every file
   the command wrote to the bank directory **byte for byte**, and produces no
   file the bank directory lacks (ignoring `*.review.json`).

**The change summary**

9. For every entity field that changed, stdout has one line naming the entity id
   (e.g. `us-state-co`), the field path (`population`, `sources.wikidata_id`,
   …), the old value and the new value. Array- and object-valued fields
   (`borders`, `centroid`, `top_crops`, `fun_facts`) may be shown whole on each
   side.
10. A field present on one side and absent on the other is reported under
    criterion 9, and the absent side is printed distinguishably from `null`,
    from `""` and from `0`.
11. `sources.built_at` never appears as a per-field change line, even though its
    value moves on every changed refresh.
12. An entity file present before but not produced by the new build is reported
    as removed by name and is absent from the bank directory afterwards; an
    entity file produced but not present before is reported as added by name.
    `index.json` and `*.review.json` are not entity files for this purpose.
13. Every warning the normalisation step produces (the same `entity.field:
    message` warnings `build.ts`'s report prints today, e.g. a FIPS mismatch or
    the area-unit range check) appears in the command's stdout.

**Fun-fact drafts**

14. The Wikipedia summary pass requests a draft only for entities whose built
    `fun_facts` is empty. With the current curated table (all 50 states carry a
    fact) the `SummaryTransport` is called **zero** times and no
    `fun-facts.review.json` is written anywhere. For an entity whose built
    `fun_facts` is empty, a draft is requested and lands `reviewed: false` in a
    review file, never in an entity file. A review file is never counted as a
    bank change (criteria 1–3).

**Tests and safety**

15. Every behaviour in criteria 1–14 is exercised offline through
    `SparqlTransport` and `SummaryTransport` (or calling pure functions
    directly), against temporary copies of the bank directory and fixture. No
    test reaches the network, mocks `fetch`, or modifies a tracked file:
    `git status --porcelain` is empty after `bun test` in `question-bank/`.
16. `question-bank/README.md` documents the command — how to run it, the three
    exit codes `0` / `1` / `2` and what each means — and the question-bank block
    of `conventions.md`'s Commands section names it. (`frontend/src/conventions-doc.test.ts`
    already checks that any `bun run <script>` named there is real.)
17. This task's diff does not change any file under `question-bank/data/` or
    `question-bank/sample-data/`, or `src/fixtures/us-states.sparql.json`.
18. No new dependency in any `package.json`, and no new outbound host in
    `question-bank/src/` (the pinned set in `top-crops-verify.test.ts` stays
    `en.wikipedia.org`, `github.com`, `query.wikidata.org`, `www.wikidata.org`).
19. The whole `question-bank/` suite, `bun run typecheck`, `bun run lint` and
    `bun run format:check` pass, and so does `cd frontend && bun test` (for
    criterion 16's doc guard).

## Out of scope

- **The monthly routine itself** — scheduling the Claude Code session, opening
  the PR. That is a chat step after this lands (`tasks.md` T-063, option B).
- **Any CI change.** CI stays offline (T-005) and gains no write permission and
  no live job. No workflow file is touched.
- **Running the command live** and committing a refreshed bank. The worker may
  run it once by hand to see real output, but nothing it writes is committed
  (criterion 17).
- **Fixing the values a refresh would bring in** — `highest_point_m` in feet is
  T-069; the bank is refreshed as Wikidata has it.
- **The pinned-digest guards** (`landmarks-verify`, `climate-kid-verify`,
  `top-crops-verify`, `highest-point-verify`). A real changed refresh moves
  `built_at` in all 50 files and will turn them red; that is T-070 (a), and must
  be settled before the routine's first PR, not here. See "For the approver".
- **`rebuildOffline()` returning stdout** (T-070 b). Tests for this task may
  capture output however they like; changing that shared harness is not
  required.
- `sample-data/` (T-064), the loader (T-040), `--sink db`.
- Changing what the existing `bun run build` / `--offline` paths do, except
  where sharing code with the command requires it — and then their output for
  the same inputs must not change (`committed-bank.test.ts` stays green).

## Constraints

- **Files expected to change:** `question-bank/src/` (new module(s) and/or
  `build.ts`, new test file(s)), `question-bank/package.json` (a `scripts`
  entry only), `question-bank/README.md`, `conventions.md`.
- **No new file under `question-bank/src/fixtures/`** — `top-crops-verify.test.ts`
  pins that directory to the one fixture. Test inputs are built in the test or
  copied to a temp dir.
- **Tests must be able to reach both sides of criterion 14** without editing
  `src/curated/us-states.ts` — e.g. by feeding entities with and without
  `fun_facts` to the drafting step directly.
- **Existing tests are not the worker's to change** (D-14). If one goes stale,
  list it under "Tests made stale" in the Handoff.
- Never `npm`/`yarn`/`pnpm`; `bun` only. No dependency without asking.
- **Content rules (`CLAUDE.md`):** scraped prose lands `reviewed: false` in a
  review file and never in an entity's shippable fields.

## Context

Required reading for the worker and the tester:

- `tasks.md` T-063 — the reshaped entry (option B) and the fun-fact note from
  T-011's reviewer.
- `engineering-decisions.md` **E-6** — why the bank is committed, why `built_at`
  comes from `_fixture.captured_at` offline, and its "Revisit when" naming this
  task.
- `question-bank/src/build.ts` — `parseArgs`, `fixtureTransport`,
  `writeReviewFile`, the `if (args.funFacts)` pass, `report`.
- `question-bank/src/normalize.ts` — `normalizeUsStates`, its `builtAt` option,
  `warnings` and `unmatched`.
- `question-bank/src/sparql.ts` (`SparqlTransport`, `createSparqlClient`),
  `question-bank/src/sources/wikidata.ts`, `question-bank/src/sources/wikipedia.ts`
  (`SummaryTransport`, `fetchFunFact`), `question-bank/src/sinks/json.ts`.
- `question-bank/src/fixtures/us-states.sparql.json` — the `_fixture` block.
- `question-bank/src/committed-bank.test.ts` ("T-010 criteria 6 and 8") and
  `question-bank/src/offline-rebuild.ts` — the reproducibility check criterion 8
  must keep satisfiable.
- `question-bank/.gitignore` — why `data/us-states/*.review.json` is ignored;
  `climate-kid-verify.test.ts` ("no *.review.json file sits under
  data/us-states/") is why criterion 14's zero-draft case writes nothing.
- `geoquizdataplan.md` §1.6 (fun facts need a human) and §1.9 (source → field
  mapping, build-time only).
- `test-guidelines.md` — "No network in tests, ever", and the seam rules.
- `conventions.md` — Commands section.

## For the approver

Two things decided here that you may want to override before approving:

- **Exit codes `0` changed / `2` unchanged / `1` failure.** The entry allowed
  "an exit code or a single line"; this pins both (criteria 1, 3, 4) so the
  routine can do `if cmd; then open PR` and a failure is never mistaken for
  "nothing moved".
- **A refresh re-records the fixture** (criteria 6–8). The alternative —
  leaving the fixture alone — makes every refresh PR fail `committed-bank.test.ts`
  by construction. The cost is that every changed refresh rewrites the ~80 KB
  fixture and moves `built_at` in all 50 files; criterion 11 keeps that out of
  the summary.

And one consequence for the routine, not this task: **the first changed refresh
PR will be red** on the four pinned-digest guards until T-070 (a) re-pins or
retires them. Consider running T-070 before switching the routine on.

## Handoff

**TL;DR — `bun run refresh` is built (`question-bank/src/refresh.ts`) and all 19
criteria have a home. The full `question-bank/` suite (1355 pass, 0 fail),
typecheck, lint, format:check and `frontend` `bun test` (380 pass) are green.
No tests made stale. One live run by hand (into scratch copies only) found a
real bad value, now queued as T-077.**

**Same session id as the expander.** The orchestrator ran expander and worker
in one remote session, so the Sessions table shows one id twice. The tester
must be a different session from this one.

### What changed, file by file

- **`question-bank/src/refresh.ts`** (new) — the command. Pure parts:
  `diffEntity`, `diffBank`, `isUnchanged`, `formatChange`, `formatSide`,
  `isEntityFile`, `ABSENT`. Orchestration: `refreshBank(options)` returns
  `0 | 1 | 2`. CLI: `main(argv, deps)`, which parses `--bank`, `--fixture`,
  `--no-fun-facts` and `--help`, plus an `import.meta.main` block that wires the
  live `createSparqlClient` and `createSummaryTransport` and calls
  `process.exit(code)`.
- **`question-bank/src/review-file.ts`** (new) — `writeReviewFile`, moved
  verbatim out of `build.ts`, and `draftMissingFunFacts`, the
  empty-`fun_facts`-only draft pass.
- **`question-bank/src/build.ts`** — now imports `writeReviewFile` and
  `FunFactDraft` from `review-file.ts`. Nothing else changed. Its own draft loop
  still drafts for every titled entity (see "Not done").
- **`question-bank/src/refresh.test.ts`** (new) — 21 tests, offline, against temp
  copies of the bank and the fixture.
- **`question-bank/package.json`** — `"refresh": "bun run src/refresh.ts"`.
- **`question-bank/README.md`** — new "Refreshing the committed bank" section
  with the exit-code table. Also a command line in "Run it", and the stale
  "T-063, not yet built" pointer is updated.
- **`conventions.md`** — `bun run refresh` added to the question-bank commands.
- **`tasks.md`** — new **T-077** (see Notes).

### Where each criterion lives

| # | Where |
|---|---|
| 1, 2 | `refreshBank`: `isUnchanged(diff)` → prints `UNCHANGED_LINE`, returns 2. It runs before any write and before the draft pass |
| 3 | `refreshBank` write block → `JsonFileSink`, then `printSummary` (`bank changed (…)`), returns 0 |
| 4 | the first `try` in `refreshBank` covers reading the bank and fixture, the SPARQL call and `assertResults`. Any throw → 1, and nothing has been written yet |
| 5 | `missing` = `CURATED_US_STATES` minus built ids. Non-empty → stderr names each one (`Wyoming (us-state-wy)`) and returns 1 |
| 6 | write block: `{ _fixture: { ...oldBlock, captured_at, rows }, ...response }`. `captured_at` is second precision, the same style as the committed one |
| 7 | `builtAt = new Date(capturedAt).toISOString()`, the same conversion `build.ts --offline` applies |
| 8 | follows from 6 and 7, plus the same `JsonFileSink`. Tested by spawning `build.ts --offline --fixture` |
| 9, 10 | `diffEntity`/`walk`: descends into plain objects (`sources.wikidata_id`) and shows arrays whole. `formatSide` prints JSON or `(absent)` |
| 11 | `IGNORED_PATHS = {"sources.built_at"}`, checked in `walk`, so a whole missing `sources` block cannot leak it either |
| 12 | `diffBank` → `added`/`removed`. Removed files are `rm`'d. `isEntityFile` excludes `index.json` and `*.review.json` |
| 13 | `printWarnings(warnings, out)` → stdout, same `  entity.field: message` format as `build.ts`'s report. Printed on every outcome, unchanged included |
| 14 | `draftMissingFunFacts` skips any entity with `fun_facts.length > 0`. Runs only on the changed path |
| 15 | `refresh.test.ts`: fake `SparqlTransport`/`SummaryTransport`, temp dirs, `DEAD_PROXY` for the one spawn. `git status --porcelain` empty after `bun test` (checked) |
| 16 | README section + `conventions.md` line. `frontend/src/conventions-doc.test.ts` passes (80/80) |
| 17 | nothing under `data/`, `sample-data/` or the fixture is in the diff |
| 18 | no `package.json` dependency change. No new URL host: `refresh.ts` has none, and `example.org` appears only in the test file |
| 19 | see "How to run" |

### Judgment calls (each with an owner)

- **The draft pass runs only on a changed refresh.** Criterion 2 forbids writing
  a review file on an unchanged run, so asking Wikipedia then would be wasted.
  *Tester to confirm against criterion 14; expander to overturn if drafts on
  unchanged runs are wanted.*
- **Progress and failure messages go to stderr; the summary and warnings go to
  stdout.** That keeps stdout pasteable as the PR body. Criteria 4 and 5 say
  "output", and the tests check both streams. *Reviewer to confirm.*
- **`--help` exits 1, not 0**, so a routine that mis-invokes the command can
  never read it as "changed". *Reviewer to confirm or overturn.*
- **Equality ignores key order** (canonical JSON). A bank whose only difference
  is key order counts as unchanged and is not rewritten. *Reviewer.*
- **A stale or missing `index.json` with identical entities is still `bank
  unchanged`**: the criteria define "unchanged" by entity fields and entity
  files only. *Expander, if index drift should count.*
- **Unparseable existing entity files count as a change** and are listed
  `rewritten (old file was not valid JSON)`. *Reviewer.*

### Not done, deliberately

- **`build.ts`'s own fun-fact pass is unchanged.** It still drafts for all 50.
  The brief keeps the existing build paths' behaviour as it is, and criterion 14
  is about the command. *Owner: whoever next touches `build.ts`; it is a
  one-line switch to `draftMissingFunFacts`.*
- **The `_fixture.regenerate_with` text is preserved as-is** ("bun run build …
  then save the raw SPARQL JSON"). It is now stale, since `bun run refresh` does
  this. Criterion 6 requires the key preserved, and criterion 17 forbids editing
  the fixture here. *Owner: the first refresh PR, or T-070.*
- No routine, no CI change, no committed live output.

### Contradictions with the brief

None found. The live run confirmed criteria 6–8 end to end: an offline rebuild
from the live-written fixture was `diff -r` identical to the written bank. A
second live run then printed `bank unchanged` and exited 2.

### How to run

```bash
cd question-bank && bun install --frozen-lockfile
bun test src/refresh.test.ts        # this task's tests (21)
bun test && bun run typecheck && bun run lint && bun run format:check
cd ../frontend && bun test          # criterion 16's doc guard
# live, into copies (never the tracked paths):
bun run refresh -- --bank /tmp/x/bank --fixture /tmp/x/fx.json; echo $?
```

**Environment note (frontend):** `frontend/bun.lock` resolves 27 tarballs from a
private registry (`europe-west1-npm.pkg.dev/lovable-core-prod/...`) that returns
403 here, so `bun install` fails and `bun test` errors on `react-simple-maps`. I
installed by rewriting those URLs to `registry.npmjs.org` in a temporary copy
of the lockfile and restored the original afterwards; `frontend/` is not in the
diff. The tester will hit the same thing.

### Tests made stale

None. Every test that existed before this task passes unchanged.

## Verdict

## Notes

- **The first live run found a real bad value.** It printed
  `us-state-ak capital: "Juneau" → "Q29445"`: WDQS's label service fell back to
  the bare QID. The summary did exactly what it is for, but `normalize.ts` would
  ship that value. Queued as **T-077** (warn and blank a QID-shaped label). This
  matters before the routine is switched on, alongside T-070 (a).
- **`refreshBank` reads and computes everything before writing anything**, so
  the failure paths (criteria 4 and 5) write nothing by construction. A failure
  *during* writing still returns 1, with a message saying to restore from git.
- **`main(argv, deps)` exists so the tester can exercise argument parsing and
  exit codes in-process.** The alternative was a replay flag on the real CLI,
  which would have stamped a fixture `captured_at` that was not the capture
  time. I chose not to add a flag that can record a false provenance.
- **Expander and worker ran in the same session.** That is recorded above, not
  hidden.
