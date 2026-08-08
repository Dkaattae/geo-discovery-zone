# Tasks

The work queue. Small, independently landable, roughly in order. See
[`process.md`](process.md) for how to use this list, and [`PROGRESS.md`](PROGRESS.md)
for the coarser picture it was derived from.

An entry here is a *placeholder*, not a brief. When a task is picked up the
`task-expander` agent turns it into `tasks/T-0xx-slug.md` — goal, acceptance
criteria, out of scope, constraints — and that brief, once approved, is what the
`worker` builds and the `tester` verifies against (`process.md`).

This list is pruned by the `reviewer` in the same PR as the work: the finished
task is **deleted** and logged in `PROGRESS.md`, tasks the work made unnecessary
are deleted with a reason, and anything it uncovered is added. A queue nobody
prunes stops being read.

**Status**: `todo` · `doing` · `done` · `dropped` (with a reason)

Sizes are a sanity check, not a commitment: **S** ≈ under an hour, **M** ≈ a
few hours, **L** ≈ a day. Anything bigger than L is not a task yet.

---

## A. Foundations

Nothing here is glamorous and all of it makes the rest cheaper.

### T-003 — CI: typecheck, lint, test on every PR · M · doing
**Depends on:** — (T-001 landed)
**Brief:** [`tasks/T-003-ci-typecheck-lint-test.md`](tasks/T-003-ci-typecheck-lint-test.md)
A GitHub Actions workflow running typecheck, lint and tests across `frontend/`
and `question-bank/`. Add the Python job when `api/` exists.

Four script gaps stand between the queue entry and a workflow that runs, all
confirmed against the tree at 8773ed3 — the first two were found while reviewing
T-001, the second two while expanding this task:

- **`bun test` exits 1 in `frontend/`** because it has no test files, so a naive
  matrix job fails on a green tree.
- **`question-bank/package.json` has no `test` script**, so CI must call
  `bun test` directly or the script must be added.
- **`frontend/package.json` has no `typecheck` script** — only `dev`, `build`,
  `build:dev`, `preview`, `lint`, `format`. The entry above assumed one existed.
- **`question-bank/package.json` has no `lint` script**, and the repo has no
  eslint config outside `frontend/`.

Decide all four here. The brief carries the criteria; this entry is the
placeholder. **Re-sized `S` → `M` at expand time**: the criteria came out at
eight, past D-6's four-criteria ceiling, so this runs the full path.

**Criterion 6 was amended on 2026-08-08** after a `blocked` verdict, and is back
with the human for re-approval. It named a file path (`frontend/src/`) where it
meant a behaviour (the frontend test-skip guard switching itself off), which
dragged in `frontend`'s type configuration — see T-004 below. Seven of eight
criteria are already verified against real workflow runs on PR #11.

### T-004 — First tests for `frontend` · S · todo
**Depends on:** — (deferred out of T-001's scope)
`level.ts` and `session.ts` are pure functions carrying real logic and no tests:
grade/band derivation and its label boundaries, `levelWindow` clamping at 0 and
18, and `pickQuestion`'s widening search, review-queue cadence and repeat
avoidance. `pickQuestion` calls `Math.random()`, so assert invariants that hold
for every draw rather than which question came back (`test-guidelines.md`).
T-002 left the "Randomness and time" section marked **Forward-looking** and named
this task as the one that makes it real — drop that marker when the tests land.
**`frontend` cannot typecheck *any* test file today — fix that first.** Found by
T-003's tester on 2026-08-08 and recorded here so this task does not rediscover
it. A file containing `import { … } from "bun:test"` placed under `frontend/src/`
fails `bun run typecheck` with:

```
src/<name>.test.ts(1,30): error TS2307: Cannot find module 'bun:test' or its
corresponding type declarations.
```

Two causes, both in `frontend`: there is no `@types/bun` in its devDependencies,
and `frontend/tsconfig.json` sets `"types": ["vite/client"]` — which replaces the
default "all of `node_modules/@types`" — while its `include` covers
`src/**/*.ts`. Dropping the import does not help; the bare globals are equally
unknown to `tsc`. Observed on run
[31235019281](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31235019281);
the same test outside the `include` typechecks and passes
([31235143550](https://github.com/Dkaattae/geo-discovery-zone/actions/runs/31235143550)).

So this task's **first commit** has to make `frontend` typecheck test files —
adding `@types/bun` (**a dependency, which means asking a human first**, per
`CLAUDE.md`) and adjusting `tsconfig.json`'s `types`, or whatever equivalent it
decides on. Until then T-003's CI goes red at the frontend `Typecheck` step the
moment a test lands under `src/`. T-003 deliberately left this alone rather than
guess the shape of a decision that belongs with real tests; see its criterion 6.
Re-size from `S` if the type-configuration decision turns out to be contested.

**Done when:** `bun test` in `frontend/` passes with tests for both modules,
`bun run typecheck` passes with those tests in the tree, and
`test-guidelines.md` no longer calls that section forward-looking.

### T-005 — Prove "no network in tests" in CI · S · todo
**Depends on:** T-003
`test-guidelines.md` says "no network in tests, ever" and names the check: point
`HTTPS_PROXY` and `HTTP_PROXY` at a dead port and the suite should not notice.
Nothing enforces it. Split out of T-003 because the env has to be scoped to the
test step alone — set it job-wide and `bun install` breaks.
**Done when:** the test step runs with a dead proxy, the suite still passes, and
a test that reaches the network fails the run.

### T-006 — The lint gate ignores warnings, and there are already seven · S · todo
**Depends on:** T-003
Found by T-003's tester, non-blocking. `frontend`'s `lint` script is `eslint .`,
which exits 0 on warnings, so every green CI run logs
`✖ 7 problems (0 errors, 7 warnings)` and passes. All seven are
`react-refresh/only-export-components`. Error-level rules do fail the run — T-003
criterion 3 is genuinely satisfied — but the gate is weaker than it reads, and
warnings now accumulate invisibly behind a green check. `--max-warnings 0` closes
it, which means first deciding each of the seven: fix, or downgrade the rule
deliberately with a reason. Do not silence them wholesale to get the flag in.
**Done when:** `bun run lint` fails on any warning, the seven are each fixed or
explicitly allowed with a recorded reason, and CI is green.

---

## B. Finish the US entity table

The pipeline works; the data is not finished. Each of these is independent.

### T-010 — Decide: commit the 50-state output, or keep it generated · S · todo
**Depends on:** —
`question-bank/data/` is gitignored today. Committing it makes builds
reproducible without network and gives reviewable diffs when Wikidata shifts;
keeping it generated avoids a large blob that goes stale. Decide, act, and write
the reason down.
**Done when:** the decision is recorded in `PROGRESS.md` and `.gitignore` matches it.

### T-011 — Review the 50 draft fun facts · M · todo
**Depends on:** —
Run the pipeline for all 50 states, then rewrite each draft in kid language and
set `reviewed: true`. Flag anything grim or confusing rather than softening it.
This is the step that makes the app feel handmade instead of scraped (plan §1.6).
**Done when:** 50 reviewed facts exist and the app can read them.

### T-012 — Curate state animals · S · todo
**Depends on:** —
Fill `state_animal` in `question-bank/src/curated/us-states.ts`. Wikidata
coverage is poor here on purpose-avoidance grounds (plan §1.9) — hand-curate.
Leave blank rather than guess.
**Done when:** every state has an animal or a deliberate blank.

### T-013 — Curate one landmark per state · S · todo
**Depends on:** —
Same table, `landmark`. Pick things a child might plausibly have heard of.
**Done when:** every state has a landmark or a deliberate blank.

### T-014 — Curate kid-facing climate phrasing · M · todo
**Depends on:** —
`climate_kid`, in the words a nine-year-old would use. Colorado's entry is the
model: "dry and cold in the mountains, drier plains to the east".
**Done when:** every state has a phrase, and none of them says "Köppen".

### T-015 — US crops from USDA NASS Quick Stats · M · todo
**Depends on:** —
Add a source module that fills `top_crops`, aggregated to the top three per
state. Needs a free API key — keep it out of the repo, read from the environment
at build time (plan §1.9).
**Done when:** `top_crops` is populated for all 50 states and the key is not committed.

### T-016 — Alaska has no `P610` highest point · S · todo
**Depends on:** —
The only field missing after the live run. Either add a curated fallback for
Denali or accept the blank and stop warning about it. Deliberate either way.
**Done when:** the full build reports zero unexplained gaps.

---

## C. Question generation

Today's questions are hand-written in `frontend/src/data/questions.ts`. The
plan's central claim is that they should be generated (§1.2).

### T-020 — Template record type and three templates · M · todo
**Depends on:** —
`{ id, prompt, answer_field, distractor_strategy, requires, applies_to, format,
base_difficulty, min_age_band }`. Start with identify-on-map, capital-of, and
click-the-map — the same three the frontend already renders.
**Done when:** the type exists with three templates and a test that validates them.

### T-021 — Generator: entities × templates → questions · M · todo
**Depends on:** T-020
Skip any entity missing a template's `requires` fields rather than emitting a
question with a hole in it.
**Done when:** the generator produces questions for all 50 states and skips
cleanly where data is absent.

### T-022 — Distractor strategies · M · todo
**Depends on:** T-021
`sibling_capitals_same_region` and neighbours-first for map questions. Ohio /
Indiana / Illinois / Iowa is a real question; Ohio / Hawaii / Texas / Alaska is
free (plan §1.2).
**Done when:** strategies are named on templates, not hardcoded, and a test
asserts distractors come from the same region.

### T-023 — Seed `level` deterministically · M · todo
**Depends on:** T-022
`base_level(template) + entity_obscurity + distractor_tightness + concept_load −
familiarity_bonus`, using the rank fields already on entities (plan §1.4).
**Done when:** every generated question has a level in 0–18 and the weights are
in one documented place.

### T-024 — Emit the API tag set · S · todo
**Depends on:** T-021
`scope`, `entity_type`, `topic`, `region`, `format`, `age_band`, `level` — the
filters `openapi.yaml` exposes on `GET /questions`.
**Done when:** every generated question carries all seven and matches the schema.

### T-025 — Hand-check 30 generated questions · S · todo
**Depends on:** T-023
Read them as a child would. Tune the weights until the ordering looks sane; the
plan expects this to be a manual pass, not a computed one.
**Done when:** 30 are reviewed and the weight changes are recorded.

---

## D. Backend

FastAPI + Postgres + uv (plan §5). Content endpoints first — they hold no user
data at all. Profiles last, deliberately (plan §5.2).

### T-030 — Scaffold `api/` with uv and FastAPI · S · todo
**Depends on:** —
`uv init`, FastAPI, uvicorn, pytest, ruff. One health endpoint and one passing
test, nothing more. Two follow-ons this unblocks: `test-guidelines.md`'s `api/`
pytest section is marked **Forward-looking** pending the first real endpoint test
(T-002), and T-003's CI workflow adds its Python job once this exists.
**Done when:** `uv run fastapi dev` serves and `uv run pytest` passes.

### T-031 — Postgres and Alembic baseline · S · todo
**Depends on:** T-030
Local Postgres 16 via docker compose, Alembic wired, one empty baseline
migration. Alembic owns the schema from here (plan §5.3).
**Done when:** `uv run alembic upgrade head` succeeds against a fresh database.

### T-032 — `entities` table and migration · M · todo
**Depends on:** T-031
Model the `Entity` schema from `openapi.yaml`. `id` is the natural key. Ranks
and optional fields are nullable — a partial build legitimately produces nulls.
**Done when:** the migration applies and round-trips a sample entity.

### T-033 — Loader: entity JSON → Postgres · M · todo
**Depends on:** T-032
A Python command that reads the pipeline's JSON output and upserts on
`entities.id`. Idempotent — running it twice changes nothing. This is the path
that writes the database, not `DbSink` (plan §5.3).
**Done when:** loading `question-bank/sample-data/` twice yields one row and no error.

### T-034 — `GET /entities` and `GET /entities/{id}` · M · todo
**Depends on:** T-033
Filters: `scope`, `type`, `region`, `ids`, `q`, plus cursor pagination. Response
shapes come from `openapi.yaml`.
**Done when:** both endpoints match the contract and are tested against a seeded database.

### T-035 — `questions` table, loader, and `GET /questions` · L · todo
**Depends on:** T-034, T-024
The filter set is the tag set from T-024, plus the `level` / `levelSpan` window.
Honour `includeAnswerKey`.
**Done when:** the endpoint matches the contract and level windowing is tested.

### T-036 — `GET /content/version` and bundles · M · todo
**Depends on:** T-035
Content version, counts, source attribution; region bundles with ETag support.
**Done when:** a matching `If-None-Match` returns 304.

### T-037 — Session endpoints · L · todo
**Depends on:** T-035
Start, serve next question, submit answer, review round, end. Port the selection
and grading rules from `frontend/src/lib/session.ts` and `Session.tsx` — they are
the spec. Note that `bestSustainedLevel` must be *sustained*, not peak (see T-042).
**Done when:** a full session runs through the API and grading matches the client's.

### T-038 — Profile endpoints · L · todo
**Depends on:** T-037
**Do not start this without a decision.** This is the step that stores children's
data (plan §3.2, §5.2). The app works without it today.
**Done when:** the decision is recorded, and if it is yes, the endpoints match the
contract.

---

## E. Frontend follow-ons

### T-040 — Read the bank from pipeline output · M · todo
**Depends on:** T-021
Replace the hand-written `frontend/src/data/` with generated data. Bundled at
build time still — no runtime fetch until the API exists.
**Done when:** the app runs on generated data and the hand-written bank is deleted.

### T-041 — Map fills in as entities are mastered · S · todo
**Depends on:** —
`masteredFips` already exists and `UsMap` already renders a mastered fill. The
map is the progress bar (plan §3.6).
**Done when:** mastered states are visibly filled on Home and the count is right.

### T-042 — `bestSustainedLevel` should be sustained, not peak · S · todo
**Depends on:** —
`Session.tsx` writes `max(best, level)`, which is peak. The plan wants 2–3
consecutive correct at that level (§1.5), and `openapi.yaml` specifies sustained.
Peak inflates the next session's start and opens the app too hard — the classic
quit moment.
**Done when:** the value only rises after sustained performance, with a test.

### T-043 — Shaded-relief basemap · S · todo
**Depends on:** —
One Natural Earth grayscale raster under the state paths. Cheapest visual win in
the plan — every existing map question starts looking like an atlas (§2.6, §4).
**Done when:** the relief renders under the map without hurting first paint.

### T-044 — Point Lovable at `frontend/` · S · todo
**Depends on:** —
Lovable builds from the repo root and the app moved. Its build and sync are
likely broken until its project root is reconfigured.
**Done when:** a Lovable build succeeds, or the integration is deliberately retired.

---

## F. Later, in plan order

Not broken down yet — they depend on decisions above. Break each one down when
it comes into view.

- **Superlatives** — nearly free once entities carry rank fields (plan §1.8)
- **Countries**, then world cities, then rivers / mountains / oceans (plan §1.7).
  Not before the US loop feels good (plan §4)
- **Pin formats** and point-in-polygon grading (plan §2.5)
- **Elevation profiles** and the altitude → climate → farming → population chain
  (plan §2.6) — the strongest content for the older band
- **Elo** — only with real play data. `rating` and `times_answered` already have
  their places, so nothing needs reseeding (plan §1.4)

## Deferred on purpose (plan §3.9)

Leaderboards, multiplayer, badges, sound design, daily challenges, parent
dashboard. Each is reasonable and each is a week not spent finding out whether
the core loop is fun.
