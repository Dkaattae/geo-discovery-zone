# T-010 — Decide: commit the 50-state output, or keep it generated

**Status:** `awaiting approval`
**Next step:** `worker` — but not until **Approved:** below stops saying
`pending`. The criteria were trimmed to Option B on 2026-09-11 and are frozen
once approved.
**Approved:** `pending`
**From:** [`tasks.md`](../tasks.md) T-010
**Branch:** `claude/gracious-mendel-1mxa5b` — assigned to this session by the
harness; used as T-010's task branch under `CLAUDE.md` "Branches" (standing
permission from Dkaattae). Every later role pushes here, **not** to
`task/T-010-…`, which does not exist.
**PR:** [#37](https://github.com/Dkaattae/geo-discovery-zone/pull/37) — draft.
The task-expander session itself could not commit, push, or open a PR (every
git write returned *"This command requires approval"* and no GitHub MCP tool
was reachable from it); the orchestrator checkpointed the commit/push, and the
top-level session opened the draft PR afterward using GitHub MCP access
neither of those had. See `process.md`, "Opening and merging the PR", route 3,
and the round-1 note in `runs/T-010-commit-or-generate-the-bank.md`.
**Fault:** T-010 *is* a product decision that `process.md` reserves for a human
("whether to commit generated output"), so the expander cannot write frozen
criteria without making it; the question is in "The decision" below and the brief
is blocked on the answer. **Resolved 2026-09-11** — see the answers under Q1–Q3
below, and the Option B criteria written from them. What remains is not a fault
in the task: the round-2 expander session hit the same "This command requires
approval" wall on every git write, so its commit was checkpointed by the
orchestrator rather than made in-session.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-11 | `session_01AccaLe16urCr5CW2EwyJEz` (session URL id; `CLAUDE_CODE_REMOTE_SESSION_ID` is not readable in this sandbox) |
| task-expander (round 2, criteria trimmed to Option B) | 2026-09-11 | `session_01AccaLe16urCr5CW2EwyJEz` |

---

## TL;DR

- **The decision is made and the criteria are now written for it.** Q1 = commit
  the built 50-state output (Option B). Q2 = reviewed fun facts live in the
  pipeline's committed output, not `backend/app/data/`. Q3 = keep `sample-data/`
  for now (T-064 purges it later). Answers are recorded verbatim under Q1–Q3.
- **Waiting on Dkaattae's approval on PR #37**, then `worker`. Nothing else
  blocks it.
- **The work is three things:** commit `question-bank/data/us-states/` (50 files
  + `index.json`, ~40 KB), make the offline rebuild reproduce them byte-for-byte
  so the committed bank is checkable rather than asserted, and write `E-6` plus
  the doc changes that say so.
- **One thing the worker must not skip:** `sources.built_at` is a wall-clock
  timestamp today (`normalize.ts:46`), so a rebuild rewrites all 50 files even
  when no fact changed. Committing the output is worth little until that is
  deterministic — criterion 6 is the one with teeth.

## Goal

Settle, once and in writing, whether `question-bank/`'s built entity JSON is a
committed artefact or a build product — and make `.gitignore`, the docs and
T-040's assumptions agree with whichever it is. T-040 (the loader that turns
pipeline output into the served bank) depends on this: if a deploy seeds the
database from that JSON, "regenerate from Wikidata first" becomes a deploy step
that nothing today owns.

## The decision — this is what the task is blocked on

### Q1 (the task itself). Is `question-bank/data/` committed, or does it stay generated?

**Answer (Dkaattae, 2026-09-11): Option B — commit it.**

A periodic pipeline to refresh the committed data from Wikidata is needed, but
is **not part of this PR** — added to `tasks.md` as a new task that depends on
T-010.

**Option A — keep it generated** (status quo; `question-bank/.gitignore:4` says
`data/` and its comment already asserts this policy).

**Option B — commit the built 50-state output** into the repository.

Neither is obviously right, and the survey moved three of the four arguments
`tasks.md` records. What is actually true today:

| `tasks.md` says | What the survey found |
|---|---|
| Committing "makes builds reproducible without network" | **Already true without committing.** `question-bank/src/fixtures/us-states.sparql.json` (80,556 bytes) is committed, and `bun run build -- --offline` replays it through the real parsing path for all 50 states (`build.ts:113`, `README.md` "Run it"). The one gap is fun facts: `--offline` implies `--no-fun-facts` (`build.ts:90`). |
| Committing gives "reviewable diffs when Wikidata shifts" | **Only partly.** Every entity carries `sources.built_at = new Date().toISOString()` (`normalize.ts:149`, `types.ts:64`), so a rebuild rewrites all 50 files even when no fact changed. Option B is worth little unless the build is made deterministic. |
| Keeping it generated "avoids a large blob" | **There is no large blob.** One entity file is 821 bytes (`sample-data/us-state-co.json`), and Colorado is one of the *fuller* records — it is the only state with `climate_kid` and one of one with `landmark`. Fifty of them plus `index.json` is roughly **40 KB**, against `backend/app/data/content.json` at 29,432 bytes, which is committed already. |
| Keeping it generated avoids data that "goes stale" | **Stands, and is the real argument for A.** `sample-data/README.md:27` makes the point: Wikidata is edited continuously, so committed values are a snapshot. |

Two further facts that belong to the decision and are in neither column:

- **CI can never rebuild live.** The `question-bank` job runs typecheck and tests
  only, and all four unit-test steps run with every proxy spelling pointed at
  `http://127.0.0.1:1` (T-005). So "CI checks the committed output is current" is
  not available under Option B; the strongest check CI can make is a
  **byte-identical offline rebuild** from the committed fixture.
- **Unreviewed prose is in the output directory.** The Wikipedia pass writes
  `fun-facts.review.json` into `--out` with `reviewed: false` (`build.ts:121-141`).
  Option B commits scraped, unrewritten prose to git. That is not "shipping" it to
  a child, but `CLAUDE.md` "Content rules" is close enough that it should be
  decided rather than absorbed.

### Q2 (uncovered by the survey; T-011 is blocked on it in practice). Where does a reviewed fun fact live?

**Answer (Dkaattae, 2026-09-11): in the data pipeline.** Reviewed fun facts
live in the pipeline's committed output (`question-bank/data/`, under
Option B above), not diverted to `backend/app/data/` on the far side of
T-040's loader — that rules out plausible answer 3 below. This is plausible
answer **2**: the built entity JSON is the committed home for `reviewed: true`
prose, and T-011 edits it (or the source the build folds into it) directly
rather than through a separate `curated/` file. If a later task finds that
reading wrong, correct it here before the criteria freeze.

T-011's deliverable is "50 reviewed facts … and the app can read them". Today the
only file that holds fun-fact text is `fun-facts.review.json`, written into
`--out`, which is **gitignored**. So a human's rewritten, `reviewed: true` prose —
the single most expensive-to-recreate content in this repo — has **nowhere in git
to live**. That is true under Option A and is the strongest argument against it.

The plausible answers, and they are not the same as Q1:

1. Reviewed facts move into `question-bank/src/curated/` (hand-authored source,
   committed, alongside `climate_kid` and `landmark`), and the *built* output
   stays ignored. This decouples Q2 from Q1 entirely.
2. Reviewed facts stay in the built output, which forces Option B.
3. Reviewed facts live in `backend/app/data/` on the far side of T-040's loader.

### Q3. If Q1 is B, what becomes of `sample-data/`?

`sample-data/` is a committed one-state build with its own README explaining the
entity shape. Committing all 50 makes it either redundant or a deliberate
teaching example. Say which.

**Answer (Dkaattae, 2026-09-11): keep it, for now.** Sequence: commit all 50
states first, prove the full bank works, *then* purge `sample-data/` as
redundant. The purge is **not part of this PR** — added to `tasks.md` as a new
task, depending on T-010, so the cleanup isn't silently dropped.

**Answered, and carried into the criteria.** The expander returned on
2026-09-11, deleted the conditional A/B draft and wrote the Option B criteria
below. `Status: awaiting approval`, `Next step: worker` — but only once
`Approved:` names a person (`process.md`, "Once approved, the criteria are
frozen").

## What is already true — survey, so nobody rebuilds it

Checked by reading, not by running anything (`process.md`: the expander's Bash is
git only).

- **`question-bank/.gitignore:4`** is `data/`, with the comment "Only
  `sample-data/` is committed — the full bank is regenerated from Wikidata, not
  stored in git." So under Option A, `tasks.md`'s "`.gitignore` matches it" is
  **already satisfied** and the whole remaining task is the written record.
- **The output shape is one file per entity plus `index.json`**
  (`sinks/json.ts:14-63`), chosen for readable diffs — "a rebuild that only moves
  Colorado's population shows one changed file instead of one changed 50-state
  blob". That comment is an argument for Option B that predates this task.
- **No consumer reads `question-bank/data/` today.** `grep` for it finds only
  `build.ts:37`/`:101`, `conventions.md:61` and `tasks.md` itself. T-040 would be
  the first.
- **`engineering-decisions.md` E-1** already fixes the neighbouring question —
  the pipeline emits JSON and a Python loader writes the database; `DbSink` is a
  seam, not the schema owner (plan §5.3). T-010 decides whether that JSON is
  tracked, not who owns the schema.
- **The default output path is `question-bank/data/us-states`** (`build.ts:37`).
- There is **no `.gitignore` at the repository root**; the ignore rules live in
  `question-bank/`, `frontend/`, `backend/` and `e2e/`.

## Acceptance criteria

Written for **Option B** and the Q2/Q3 answers above, and **frozen once
`Approved:` is filled in** (`process.md`, step 2). Nothing here is conditional
any more; the earlier two-branch draft is in git history at `a68ab8b`.

Several of these are already true — that is marked inline, and confirming one
still holds is a legitimate way to satisfy it. Criteria 1–9 are shape checks a
test can make; 10–16 are the written decision, which only a human can judge (see
the Review checklist).

### What is committed

1. `git ls-files question-bank/data/us-states` lists **exactly 51 paths**:
   `index.json` plus 50 files named `us-state-<postal>.json` — one for each of
   the 50 two-letter `postal` values in `CURATED_US_STATES`
   (`question-bank/src/curated/us-states.ts`). Not 49 entity files, not 51.
2. The tracked `question-bank/data/us-states/index.json` has `count: 50`, and its
   `entities` array holds 50 entries whose `id` values are exactly the `id`
   fields of the 50 tracked entity files, with no duplicates and none missing.
3. Every tracked entity file parses as JSON and has a non-null `id`, `name`,
   `capital`, `geometry_id`, `centroid`, `population` and `area_km2`, with
   `type: "state"` and `scope: "us"`. Across the 50 files, `population_rank`
   takes each integer 1–50 exactly once, and `area_rank` does too. (A 1-state or
   49-state build emits `null` ranks — `build.ts:98-100` — so this fails it.)
4. The tracked `question-bank/data/us-states/us-state-co.json` and the committed
   `question-bank/sample-data/us-state-co.json` are equal field for field except
   `sources.built_at` — either because the tracked file matches the existing
   sample, or because `sample-data/` was regenerated offline from the same
   fixture in this same change. A difference in any other field means the two
   were built by different code paths and is a finding, not a rounding error.
5. The total size of all files tracked under `question-bank/data/` is **under
   200 KB**. (Today's one-entity file is 821 bytes, so 50 plus an index is
   roughly 40 KB — the headroom is deliberate, the cap is the guard against a
   later "just commit the blob".)

### It stays reproducible, and a test says so

6. An **offline** build from the committed fixture
   (`question-bank/src/fixtures/us-states.sparql.json`) into
   `question-bank/data/us-states/` leaves `git status --porcelain
   question-bank/data` **empty**, and running that build a second time leaves it
   empty again. Byte-for-byte identical, `sources.built_at` included. This binds
   the offline path only: a live build against Wikidata may legitimately differ,
   and that difference is T-063's subject.
7. In all 50 tracked entity files, `sources.built_at` is a valid ISO-8601 UTC
   instant and is **the same string in every one of the 50**; `sources.builder_version`
   equals `BUILDER_VERSION` in `question-bank/src/normalize.ts`. Criterion 6 is
   met by making the value deterministic, not by deleting provenance.
8. `bun test` in `question-bank/` goes **red** when any tracked file under
   `question-bank/data/us-states/` stops matching what the offline build from the
   committed fixture produces — changing a single value in a single tracked file
   is enough to fail it. That test reaches no network, does not mock `fetch`,
   writes nothing inside `question-bank/data/`, and runs under the existing
   `question-bank` CI job with **no change to `.github/workflows/ci.yml`**.
9. **No unreviewed prose in a shippable field.** Every tracked entity file's
   `fun_facts` is an array in which every element has `reviewed: true`; today
   that means all 50 are `[]`. No file tracked under `question-bank/data/`
   contains `"reviewed": false` anywhere (`CLAUDE.md` "Content rules",
   plan §1.6).

### The rules and the docs say the same thing

10. `git check-ignore` matches **no** tracked path under `question-bank/data/`,
    and a path that is *not* part of the committed bank — say
    `question-bank/data/subset/us-state-co.json`, which
    `question-bank/README.md:18` tells people to produce — is **still ignored**.
    Both sides of that boundary hold.
11. `question-bank/.gitignore`'s comment describes the decided policy. In
    particular the tree contains no file asserting that the full bank is
    "regenerated from Wikidata, not stored in git" (`question-bank/.gitignore:2-3`
    today), except where `E-6` describes the option that was rejected.
12. `engineering-decisions.md` gains an **`E-6`** entry that states the decision
    in its own right — a reader learns which way T-010 went from `E-6` alone,
    without diffing `.gitignore`.
13. `E-6` names the option **not** taken and its real cost — a committed snapshot
    goes stale against a continuously edited Wikidata
    (`question-bank/sample-data/README.md:27`) — and gives a revisit trigger
    that could actually be noticed, as `engineering-decisions.md:14` requires
    ("a decision with no trigger for revisiting is a habit, not a decision").
14. `E-6` names **the tracked path where `reviewed: true` fun-fact text will
    live** and says whether it is built output or a build input, such that an
    offline rebuild (criterion 6) does not destroy it. T-010 names that home; it
    does not fill it — that is T-011.
15. `question-bank/README.md` and `conventions.md` (its `# question bank` command
    block, around `conventions.md:59-64`) both say that a fresh clone already
    contains the 50-state bank and what `bun run build` does to it. Neither can
    be read as contradicting `E-6`.
16. `tasks.md`'s **T-040** entry states that the loader reads the committed
    `question-bank/data/us-states/` and that seeding needs no live Wikidata run
    at deploy time, and `PROGRESS.md` says in one line that the built 50-state
    bank is committed. T-040 does not get to re-decide this.

### What must not happen

17. **No new dependency**: no addition to any `package.json` or
    `pyproject.toml`, and `question-bank/bun.lock` is byte-identical to its
    current content.
18. **Nothing changes outside the Constraints list below.** In particular no
    change to `openapi.yaml`, `geoquizdataplan.md`, any Alembic migration,
    `.github/workflows/`, `process.md`, `process-decisions.md`, `CLAUDE.md` or
    `.claude/`.
19. **The whole suite stays green**, not just the new test: `question-bank`'s
    existing 19 tests and its typecheck, plus frontend and backend unchanged.
    No existing test is edited to accommodate this change.

## Out of scope

- **Implementing T-040's loader.** T-010 decides what the loader reads from; it
  does not write it.
- **The scheduled refresh of the committed bank — T-063.** Committing the data
  makes it a snapshot; keeping it fresh is a new CI job and a new decision, and
  it is explicitly not this PR. Do not add a workflow here.
- **Deleting `question-bank/sample-data/` — T-064.** Q3 was answered "keep it for
  now". Regenerating it offline from the same fixture is allowed where
  criterion 4 needs it; deleting it is not.
- **Reviewing or rewriting fun facts.** That is T-011. Q2 decides only *where the
  reviewed text lives*, not what it says.
- **Filling any curated field** — `state_animal`, `landmark`, `climate_kid`,
  `top_crops` (T-012–T-015).
- **The region vocabulary** (T-017), even though it is visible in every entity
  file this task might commit.
- **Refreshing the SPARQL fixture** or running the pipeline against live
  Wikidata.
- **`DbSink`** (`question-bank/src/sinks/db.ts`) stays unimplemented; E-1 and plan
  §5.3 already settled that it is not the path that defines tables.
- **`backend/app/data/content.json`**, the hand-copied 15-state bank. It is
  replaced by T-040/T-050, not by this task.
- **Adding a lint or formatter to `question-bank/`** — noted as still open in
  `ci.yml:118-121`, and a dependency decision of its own.

## Constraints

- **Files expected to change:** `question-bank/data/us-states/**` (new, tracked),
  `question-bank/.gitignore`, `question-bank/README.md`, `conventions.md`,
  `engineering-decisions.md`, `PROGRESS.md`, `tasks.md` (the T-040 entry), one
  new test file under `question-bank/src/`, and — for criterion 6's determinism —
  `question-bank/src/build.ts` and/or `question-bank/src/normalize.ts`.
  `question-bank/sample-data/**` may be regenerated offline if criterion 4 needs
  it. **Not** `.github/workflows/ci.yml`: criterion 8's check has to ride inside
  `bun test`, which the `question-bank` job already runs (`ci.yml:118-124`).
- **Build the committed bank offline, from the committed fixture.** No live
  Wikidata run: the sandbox has no egress to it, criterion 6 requires the
  committed bytes to be reproducible from committed inputs, and `--offline`
  implies `--no-fun-facts` (`build.ts:89-90`), which is what keeps criterion 9
  true by construction. The consequence — the bank is an August 2026 snapshot
  until T-063 exists — is the known cost of Option B and belongs in `E-6`.
- **`sources.built_at` may change meaning, but not disappear.**
  `normalizeUsStates` already takes `options.builtAt` (`normalize.ts:31,46`), so
  determinism does not require inventing a new seam.
- **`process-decisions.md`, `process.md`, `CLAUDE.md` and `.claude/` are
  off-limits** — loop-gated, `P` tickets, `run-loop.sh` G1. `engineering-decisions.md`
  is the correct home for this decision and is explicitly not gated
  (`engineering-decisions.md:7`).
- **No new dependency without asking** (`CLAUDE.md` "Packages"). `bun add` in
  `question-bank/`, never npm/yarn/pnpm, lockfile committed with it.
- **No network in tests, ever** (`test-guidelines.md`, T-005). Any new test reads
  files from the repository; none of them calls Wikidata or Wikipedia, and none
  mocks `fetch`.
- **Unreviewed text never ships** (`CLAUDE.md` "Content rules"). This binds hard
  on Option B: `fun-facts.review.json` is written into the same directory the
  option would commit.
- **The whole suite must stay green** — 242 backend, 184 frontend, 19
  question-bank, plus integration and e2e — not only the new test.
- Do **not** change what the pipeline computes. This is a decision about storage,
  not about data.

## Context

Required reading, not background.

- **The queue entry:** [`tasks.md`](../tasks.md) T-010, and T-040 immediately
  below it — T-040 is the reason this cannot stay undecided.
- **Why it is a human call:** [`process.md`](../process.md), "Where the loop stops
  for a human", moment 3; and "Tasks this loop does not fit", which lists T-010 by
  name as a Decision task verified by a written decision rather than a test.
- **The pipeline:** `question-bank/README.md` (all of it — "Run it", "The database
  seam", "Layout"), `question-bank/src/build.ts:31-41` (default `--out`),
  `:89-91` (`--offline` implies `--no-fun-facts`), `:112-141` (fixture replay and
  the review file), `question-bank/src/sinks/json.ts:1-63` (the output shape and
  why it is one file per entity), `question-bank/src/normalize.ts:10` and `:143-151`
  (`BUILDER_VERSION`, `built_at`).
- **What is committed today:** `question-bank/.gitignore`,
  `question-bank/sample-data/README.md`, `question-bank/sample-data/us-state-co.json`,
  `question-bank/src/fixtures/us-states.sparql.json`.
- **The neighbouring decision:** `engineering-decisions.md` E-1 (Alembic owns the
  schema) and its long form, `geoquizdataplan.md` §5.3.
- **Why the pipeline exists at all:** `geoquizdataplan.md` §1.2 (generate, don't
  collect), §1.9 (source → field mapping), §1.6 (fun facts need a human).
- **Content rules:** [`CLAUDE.md`](../CLAUDE.md), "Content rules" — unreviewed
  text, blank over guessed, flag the uncertain.
- **Test rules:** [`test-guidelines.md`](../test-guidelines.md), "No network in
  tests, ever"; `ci.yml:93-124` for what the `question-bank` job actually runs.
- **The doc-vs-repo test pattern criteria 8 and 10 should follow:**
  `frontend/src/conventions-doc.test.ts` — it reads the repository and asserts the
  doc against it, so the doc cannot ratify itself (T-007, T-058). The nearest
  in-package example is `question-bank/src/normalize.test.ts:10-20`, which reads
  the fixture off disk and never writes.
- **Determinism, concretely:** the fixture's own `_fixture.captured_at`
  (`question-bank/src/fixtures/us-states.sparql.json`, `2026-08-04T16:05:35Z`) is
  a committed, meaningful instant, and `normalizeUsStates(rows, { builtAt })`
  already accepts one. That is one way to satisfy criteria 6 and 7; the criteria
  do not require it.
- **Why `--offline` gives no fun facts:** `build.ts:89-90`. `writeReviewFile`
  (`build.ts:121-141`) therefore never runs on the offline path, so nothing with
  `reviewed: false` reaches the tracked directory.

## Review checklist — this is a decision task, so there is no test that settles it

A human checks these; record who, in the PR.

Criteria 12–16 are written decisions and documentation: a test can check that
`E-6` exists and that no doc still asserts the old policy, but not whether the
reasoning is honest. A human checks these; record who, in the PR.

- [ ] The decision is **stated**, not implied — a reader can tell from `E-6`
      alone which way it went, without diffing `.gitignore`.
- [ ] The rejected option is described with its real cost, not strawmanned.
      Staleness is the genuine argument for keeping the bank generated.
- [ ] The revisit trigger is something that could actually be noticed — "the
      committed bank is more than N months behind Wikidata" only counts if
      something surfaces that.
- [ ] Q2's answer gives the reviewed fun facts a home that survives both
      `git clean` **and** an offline rebuild. If `E-6` puts them in built output
      that the rebuild overwrites, criterion 14 is not really met.
- [ ] Someone has read a sample of the committed entity files and confirmed no
      unreviewed prose is in them — not merely that `fun_facts` is `[]`.
- [ ] `question-bank/README.md`, `conventions.md` and `E-6` cannot be read as
      saying different things.
- [ ] The change to `built_at`'s meaning (criterion 7) is described somewhere a
      future reader will find it, rather than only visible in a diff.

## Handoff

_Not written — no worker has run. The brief is waiting on approval, not on a
decision: Q1–Q3 are answered above._

## Verdict

_Not written._

## Notes

- **Why the expander halted rather than writing criteria.** Every criterion that
  makes T-010 testable presupposes the answer: "`data/` is not tracked" and
  "`data/` is tracked" cannot both be in one frozen list, and a criterion phrased
  as "`.gitignore` matches the recorded decision" hands the decision to the
  worker. `process.md` reserves precisely this one ("whether to commit generated
  output") for a person, so guessing it would be the failure the role exists to
  prevent.
- **The halt ended as designed** (round 2, 2026-09-11). Q1–Q3 were answered in
  the brief, the expander deleted the A/B draft blocks and wrote 19 frozen
  criteria for Option B. No source, test or config file was touched by the
  expander — the diff is `tasks/` and `tasks.md` only.
- **Two places the round-2 criteria went further than the draft, deliberately.**
  (a) The reproducibility check moved out of `.github/workflows/ci.yml` and into
  `bun test` (criterion 8), because `process.md` "Work on the loop itself never
  enters the loop" names the workflows as hand-done `P` tickets; a test inside
  the package gets the same CI coverage with none of that argument. (b) Criterion
  14 forces `E-6` to say where reviewed fun-fact text lives *such that a rebuild
  does not destroy it* — because criterion 6 and hand-edited built output cannot
  both be true, and T-011 would have discovered that the expensive way.
- **Criterion 4 could legitimately fail** if `normalize.ts` has drifted since
  `sample-data/` was built in August. That is the point of it: the fix is to
  regenerate `sample-data/` offline, not to drop the comparison.
- **Q2 was not in the queue entry** and is the finding worth keeping regardless of
  Q1: `tasks.md` T-011 promises 50 reviewed fun facts, and as the tree stands the
  only file that could hold them is gitignored.
- **The halt was quieter than intended, and that is now closed.** The design is
  that a blocked brief is pushed and `blocked-run-notice.yml` labels the PR
  (`process-decisions.md` D-11); in round 1 the push was refused, so the notice
  was only this file. The commit and PR #37 landed afterwards, and round 2 pushes
  to the same branch — so the brief and the PR are the record from here, not a
  chat log.
