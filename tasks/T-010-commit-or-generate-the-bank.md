# T-010 — Decide: commit the 50-state output, or keep it generated

**Status:** `blocked`
**Next step:** `human`
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
is blocked on the answer.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-11 | `session_01AccaLe16urCr5CW2EwyJEz` (session URL id; `CLAUDE_CODE_REMOTE_SESSION_ID` is not readable in this sandbox) |

---

## TL;DR

- **This brief is deliberately unfinished, and the halt is the output.** T-010 is
  the exact case `process.md` names as a human-only call — "a product decision an
  agent may not settle: … **whether to commit generated output**" — so no worker
  should start.
- **What is needed from Dkaattae:** one answer to Q1 (commit or keep generated),
  plus Q2 (where reviewed fun facts live) and Q3 (what happens to
  `sample-data/`). Answer in this file.
- **The survey below changes the shape of the choice** as `tasks.md` states it:
  the output is ~40 KB not "a large blob"; a network-free full rebuild
  **already works** from a committed fixture; and every rebuild rewrites all 50
  files because `built_at` is a wall-clock timestamp.
- **Draft criteria are written for both answers** so that answering Q1–Q3
  converts this into an approvable brief in one short expander pass rather than a
  fresh survey.

## Goal

Settle, once and in writing, whether `question-bank/`'s built entity JSON is a
committed artefact or a build product — and make `.gitignore`, the docs and
T-040's assumptions agree with whichever it is. T-040 (the loader that turns
pipeline output into the served bank) depends on this: if a deploy seeds the
database from that JSON, "regenerate from Wikidata first" becomes a deploy step
that nothing today owns.

## The decision — this is what the task is blocked on

### Q1 (the task itself). Is `question-bank/data/` committed, or does it stay generated?

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

**Answer in this file, under each question.** Then set `Status: awaiting
approval` and `Next step: task-expander` — the criteria below are drafts and have
to come back through the expander to be trimmed to the answer and approved
(`process.md`, "Once approved, the criteria are frozen").

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

## Acceptance criteria — DRAFT, not frozen, pending Q1–Q3

Written now so answering Q1–Q3 is cheap. **Not approved and not binding.** The
expander returns to trim these to the branch taken, and Dkaattae approves that
version.

### Common to both answers

1. `engineering-decisions.md` gains an `E-6` entry that states which way T-010
   went, names the option **not** taken and what it costs, and gives a concrete
   revisit trigger — matching the file's own rule at
   `engineering-decisions.md:14` ("a decision with no trigger for revisiting is a
   habit, not a decision").
2. `PROGRESS.md` records the decision in one line under "Completed tasks",
   including which of the two was chosen.
3. `question-bank/.gitignore` and the recorded decision agree: no path is both
   listed there and tracked by git, and its explanatory comment states the
   decided policy rather than the previous one.
4. `question-bank/README.md` and `conventions.md:61` describe the same policy as
   `E-6` — in particular, whether a fresh clone has the 50-state bank or must
   build it.
5. A test in `question-bank/src/` fails if `question-bank/.gitignore` stops
   agreeing with the decided policy, and it reads the repository rather than
   restating the answer in a literal string. It reaches no network.
6. `tasks.md`'s T-040 entry names which of the two it must assume, so the loader
   task is not re-deciding this.
7. No new dependency in any `package.json` or `pyproject.toml`, and no lockfile
   changes.
8. No behavioural change to the pipeline's output *content*: for the same input
   fixture, every field of every entity has the same value before and after,
   `sources.built_at` excepted where criterion B2 applies.

### Only if Q1 = A (keep it generated)

A1. No built entity JSON is tracked anywhere outside `question-bank/sample-data/`
— `git ls-files` lists no file under `question-bank/data/`.
A2. `E-6` names the committed SPARQL fixture plus `--offline` as the mechanism
that makes a network-free full rebuild possible, and states plainly that fun
facts are **not** reproducible that way (`build.ts:90`).
A3. The docs state, in one place a deployer will find, that seeding a database
from pipeline output requires running the build first — the deploy step T-040
would otherwise inherit silently.
A4. Q2 is answered in writing: the file that will hold `reviewed: true` fun-fact
text is named and is tracked by git, even if it does not exist yet.

### Only if Q1 = B (commit the output)

B1. `question-bank/data/us-states/` is tracked and contains exactly 50 entity
files plus `index.json`, and `index.json`'s `count` is `50`.
B2. Two consecutive offline rebuilds into the tracked directory leave the working
tree clean — `git status --porcelain` is empty after the second — so a rebuild
that changes no fact produces no diff. (Today it produces 50, because
`sources.built_at` is a wall-clock timestamp.)
B3. Rebuilding from the committed fixture reproduces the tracked files
byte-for-byte, and CI runs that check on every PR. It reaches no network.
B4. No tracked file under `question-bank/data/` contains fun-fact prose with
`reviewed: false`, and no entity's `fun_facts` array contains text that has not
been through human review (`CLAUDE.md` "Content rules", plan §1.6).
B5. The tracked output is under 200 KB in total, and a single-state rebuild
cannot overwrite the 50-state tree with a 1-state one (`--states CO` writes only
the states named, so the stale 49 would remain — say what happens).
B6. Q3 is answered: `sample-data/` is either kept with a stated reason or removed
in the same change.

## Out of scope

- **Implementing T-040's loader.** T-010 decides what the loader reads from; it
  does not write it.
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

- **Files expected to change:** `engineering-decisions.md`, `PROGRESS.md`,
  `question-bank/.gitignore`, `question-bank/README.md`, `conventions.md`,
  `tasks.md` (the T-040 entry), one new test file under `question-bank/src/`.
  Under Q1 = B, additionally `question-bank/data/us-states/**`, possibly
  `question-bank/src/normalize.ts` (for B2's determinism) and
  `.github/workflows/ci.yml` (for B3).
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
- **The doc-vs-repo test pattern criterion 5 should follow:**
  `frontend/src/conventions-doc.test.ts` — it reads the repository and asserts the
  doc against it, so the doc cannot ratify itself (T-007, T-058).

## Review checklist — this is a decision task, so there is no test that settles it

A human checks these; record who, in the PR.

- [ ] The decision is **stated**, not implied — a reader can tell from `E-6`
      alone which way it went, without diffing `.gitignore`.
- [ ] The rejected option is described with its real cost, not strawmanned.
- [ ] The revisit trigger is something that could actually be noticed.
- [ ] Q2's answer gives the reviewed fun facts a home that survives `git clean`.
- [ ] Under Option B: someone has read a sample of the committed entity files and
      confirmed no unreviewed prose is in them.
- [ ] `question-bank/README.md`, `conventions.md` and `E-6` cannot be read as
      saying different things.

## Handoff

_Not written — no worker has run. The task is blocked on Q1–Q3 above._

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
- **The halt is cheap to end.** Answer Q1 with one word, Q2 with a path, Q3 with a
  sentence; the expander then deletes one of the two draft blocks and the brief is
  ready to approve.
- **Q2 was not in the queue entry** and is the finding worth keeping regardless of
  Q1: `tasks.md` T-011 promises 50 reviewed fun facts, and as the tree stands the
  only file that could hold them is gitignored.
- **The halt is louder than intended, and that is a second thing to fix.** The
  design is that a blocked brief is pushed, and `blocked-run-notice.yml` then
  labels the PR and comments (`process-decisions.md` D-11). That cannot happen
  here: the push was refused, so there is no PR and no issue, and the only notice
  is this file plus the session's final report. Whoever reads this should commit
  and push the two changed paths — `tasks/T-010-commit-or-generate-the-bank.md`
  and `tasks.md` — and open the draft PR, at which point the workflow takes over
  and labels it `waiting on a human`. Nothing else in the working tree was
  touched.
