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

_Last swept: 2026-08-24, after PRs #16–#20 landed the backend off-queue._

---

## Where the app is today

Read this before picking anything. It is the difference between what the app
does and what `openapi.yaml` and the plan describe, and most of the queue below
is that gap.

| | Shipped | Contract / plan describes |
|---|---|---|
| **States** | **15**, hand-written | 50 (the pipeline already builds all 50) |
| **Questions** | **26** | generated from templates × entities (§1.2) |
| **Question formats** | **2** — `map_identify`, `multiple_choice` | 9 — plus `map_click`, `image`, `ab_compare`, `pin_pick`, `pin_drop`, `drag_order`, `click_profile` |
| **Topics** | **2** — location, capital | 10 — plus climate, agriculture, wildlife, landmark, size, physical, superlative, elevation |
| **Map** | US states, `us-atlas`, mastered states fill in | + shaded relief (§2.6), physical features (§2.4) |
| **Backend** | all 29 contract operations, SQLite or Postgres | — |

So: a child sees a highlighted state and picks its name, or picks a capital
city from four choices, over 15 states. **The Setup screen's three buttons —
"Places on the map", "Capital cities", "A bit of both" — are the whole topic
menu**, and picking the default means only ever seeing the first format. That is
not a bug; it is how much bank exists.

Nothing else is half-built. The other formats and topics have **no data, no
generator and no renderer** — they exist as an enum in `openapi.yaml` and as
prose in the plan. §C and §D below are the path to them.

The one exception is the endpoints that exist and serve nothing —
`/geometry/{layer}`, `/elevation-profiles`, `/superlative-axes` — which return
404 or an empty list on purpose, because the data they need is not in this repo
(T-039).

---

## A. Foundations

Nothing here is glamorous and all of it makes the rest cheaper.

### T-004 — Tests for `level.ts`, and settle how `frontend` typechecks a test file · S · todo
**Depends on:** —
**Rewritten 2026-08-24.** Two thirds of this task were overtaken by the backend
work, and what is left is smaller and sharper than the original entry:

- **`session.ts` is gone.** `pickQuestion` moved to the server as
  `backend/app/selection.py` and has 19 tests there (`tests/test_selection.py`),
  so the widening search, review cadence and repeat avoidance are covered. The
  `test-guidelines.md` "Randomness and time" section is still marked
  **Forward-looking** (line 122) and still names `pickQuestion` in `frontend/`;
  it should point at the Python tests or be rewritten.
- **The typecheck blocker was worked around, not decided.**
  `frontend/tsconfig.json` now carries
  `"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]` — so tests run under
  `bun test` and `tsc` never sees them. That was the cheap way past it during
  PR #17 and it means **frontend test files are not typechecked at all**. The
  original choice stands unmade: add `@types/bun` (a dependency, so
  **ask a human first** per `CLAUDE.md`) and typecheck tests, or keep the
  exclusion deliberately and write down why.
- **`level.ts` is the only untested frontend logic left** — `gradeOf`, `bandOf`,
  `gradeLabel`, `bandLabel`, `levelLabel`, 29 lines, with label boundaries and
  clamping at 0 and 18. `backend/app/levels.py` mirrors it and *is* tested
  (`tests/test_levels.py`, 21 tests), so a good test here also pins the two
  implementations together — they drift silently otherwise.

**Also still unanswered:** whether CI should *positively require* frontend tests.
`bun test --pass-with-no-tests` is still in `ci.yml`, so deleting every frontend
test would leave CI green. There are 19 real tests there now
(`src/lib/api/client.test.ts`), which is what makes the flag worth revisiting.
**Done when:** `level.ts` has tests, the typecheck question is decided and
recorded, `test-guidelines.md` line 122 is true, and the `--pass-with-no-tests`
question is answered one way or the other.

### T-005 — Prove "no network in tests" in CI · S · todo
**Depends on:** —
`test-guidelines.md` says "no network in tests, ever" and names the check: point
`HTTPS_PROXY` and `HTTP_PROXY` at a dead port and the suite should not notice.
Nothing enforces it. Split out of T-003 because the env has to be scoped to the
test step alone — set it job-wide and `bun install` breaks. Now applies to the
Python suite too (T-009): 221 backend tests, none of which should reach out.
**Done when:** the test steps run with a dead proxy, the suites still pass, and
a test that reaches the network fails the run.

### T-006 — The lint gate ignores warnings, and there are still seven · S · todo
**Depends on:** —
`frontend`'s `lint` script is `eslint .`, which exits 0 on warnings, so every
green CI run logs `✖ 7 problems (0 errors, 7 warnings)` and passes.
**Re-checked 2026-08-24: still exactly seven, and all seven are in
`src/components/ui/`** — `navigation-menu.tsx`, `sidebar.tsx`, `toggle.tsx` and
four others, all `react-refresh/only-export-components`, all in shadcn-generated
files nobody hand-edits. That changes the shape of the fix: "fix each of the
seven" means editing vendored components, so the likely right answer is to scope
the rule off `components/ui/` in `eslint.config.js` and then turn on
`--max-warnings 0`, which keeps the gate real for code we actually write. Decide
it deliberately; do not silence them wholesale just to get the flag in.
**Done when:** `bun run lint` fails on any warning in first-party code, the
seven are each fixed or explicitly allowed with a recorded reason, and CI is green.

### T-007 — `conventions.md` describes a repo that no longer exists · S · todo
**Depends on:** —
**Scope grew 2026-08-24.** It was two one-line gaps; it is now most of the file:

- Layout says `api/  FastAPI backend (Python, uv) — not built yet`. It is built,
  and it is in `backend/` (see T-046).
- Commands has an `# api (once it exists)` block pointing at `cd api`. The real
  commands are `make -C backend dev|test|check|migrate` — see `backend/Makefile`.
- The frontend block lists `dev`, `lint`, `format` but not `bun run typecheck`.
- Nothing says the repo has CI, so a reader still learns the checks are run by
  whoever remembers to.
- Nothing mentions the database, `GEO_DATABASE_URL`, Alembic-in-practice, the
  `Dockerfile` or `docker-compose.yml`.

**Done when:** `conventions.md` matches the repo — layout, commands, CI, and how
to run the thing.

### T-008 — Decide: pin the CI actions by SHA, or stay on major tags · S · todo
**Depends on:** —
`ci.yml` uses `actions/checkout@v5` and `oven-sh/setup-bun@v2` — mutable major
tags, so a compromised or merely changed action reaches the runner without a
diff here. Raised by T-003's worker and never decided; its tester pointed at the
reason it is not academic: `frontend/bunfig.toml` runs a 24h `minimumReleaseAge`
guard against exactly this risk on the npm side, and CI's own supply chain is
unguarded. Pinning by SHA costs a dependabot-shaped chore nobody has set up yet,
which is the argument for the other side. Decide, act, and record the reason.
**Done when:** the decision is in `decisions.md` and `ci.yml` matches it.

### T-009 — CI does not run the backend tests · S · todo
**Depends on:** —
**New 2026-08-24.** `.github/workflows/ci.yml` has a `frontend` job and a
`question-bank` job and no Python job at all, so **221 backend tests never run on
a pull request**. Everything they cover — grading, selection, auth, the contract
tests against `openapi.yaml` — is unguarded on merge. This was named as T-030's
follow-on before T-030 existed; the backend landed without it.

Two decisions inside a small task: which Python and uv versions to pin (the
other jobs pin `bun-version: 1.3.11` deliberately), and whether to run the
Postgres path too — `make -C backend test-postgres` needs a service container,
and today a Postgres-only regression would not fail a PR.
**Done when:** `make -C backend check` runs on every PR, a deliberately broken
backend test reddens the run, and the Postgres question is answered either way.

---

## B. Finish the US entity table

The pipeline works and has run live against all 50 states; the *data* is not
finished. Each of these is independent. Nothing here reaches the app until T-040
bridges the pipeline to the served bank — but the curation is the long pole, so
it is worth doing in parallel rather than after.

### T-010 — Decide: commit the 50-state output, or keep it generated · S · todo
**Depends on:** —
`question-bank/data/` is gitignored today. Committing it makes builds
reproducible without network and gives reviewable diffs when Wikidata shifts;
keeping it generated avoids a large blob that goes stale. T-040 sharpens this:
if a loader reads that JSON to seed the database, "regenerate it from Wikidata
first" becomes a step in every deploy that does not have one today.
**Done when:** the decision is recorded in `PROGRESS.md` and `.gitignore` matches it.

### T-011 — Review the 50 draft fun facts · M · todo
**Depends on:** —
Run the pipeline for all 50 states, then rewrite each draft in kid language and
set `reviewed: true`. Flag anything grim or confusing rather than softening it.
This is the step that makes the app feel handmade instead of scraped (plan §1.6).
The 15 states shipped today already have human-written prose; these are the
other 35 plus anything the pipeline drafts fresh.
**Done when:** 50 reviewed facts exist and the app can read them.

### T-012 — Curate state animals · S · todo
**Depends on:** —
Fill `state_animal` in `question-bank/src/curated/us-states.ts`. **0 of 50 filled
today.** Wikidata coverage is poor here on purpose-avoidance grounds (plan §1.9)
— hand-curate. Leave blank rather than guess. This is also the data behind a
`wildlife` topic (T-026).
**Done when:** every state has an animal or a deliberate blank.

### T-013 — Curate one landmark per state · S · todo
**Depends on:** —
Same table, `landmark`. **1 of 50 filled** (Colorado). Pick things a child might
plausibly have heard of.
**Done when:** every state has a landmark or a deliberate blank.

### T-014 — Curate kid-facing climate phrasing · M · todo
**Depends on:** —
`climate_kid`, in the words a nine-year-old would use. **1 of 50 filled.**
Colorado's entry is the model: "dry and cold in the mountains, drier plains to
the east".
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

### T-017 — Two region vocabularies, and they disagree · S · todo
**Depends on:** —
**New 2026-08-24.** `question-bank/src/curated/us-states.ts` assigns each of the
50 states one of **eight** regions — Midwest, Mountain West, Northeast, Pacific,
Pacific Northwest, South Central, Southeast, Southwest. The bank the app
actually serves (`backend/app/data/content.json`, 15 states) uses **thirteen**,
including six the pipeline never emits: Pacific West, Great Basin, Great Lakes,
Upper Midwest, Great Plains, New England.

The curated table's own comment says its regions "match the values already in
the frontend". That stopped being true. Two consequences, both real:

- `GET /questions?region=…` and `GET /entities?region=…` filter on a vocabulary
  that depends on which half of the repo produced the row.
- **T-022 is blocked in practice.** "Distractors from the same region" is only a
  meaningful constraint if one vocabulary decides what a region is.

Pick one list, write it down as the app's vocabulary, and make both sides use it.
Eight regions and thirteen are different products for a child — "Great Basin" is
a geographer's word — so this is a content decision, not a rename.
**Done when:** one vocabulary is documented, both the pipeline and the served
bank use it, and a test fails if a region outside the list appears.

---

## C. Question generation

Today's 26 questions are hand-written. The plan's central claim is that they
should be generated (§1.2), and generation is what turns curated fields
(§B) into the topics the app does not have yet.

### T-020 — Template record type and three templates · M · todo
**Depends on:** —
`{ id, prompt, answer_field, distractor_strategy, requires, applies_to, format,
base_difficulty, min_age_band }`. Start with identify-on-map, capital-of, and
click-the-map — the three the plan names in §4 step 2. Note that the client
renders only the first two (`Session.tsx` handles `map_identify` and
`multiple_choice`); `map_click` needs T-051 to be visible.
**Done when:** the type exists with three templates and a test that validates them.

### T-021 — Generator: entities × templates → questions · M · todo
**Depends on:** T-020
Skip any entity missing a template's `requires` fields rather than emitting a
question with a hole in it.
**Done when:** the generator produces questions for all 50 states and skips
cleanly where data is absent.

### T-022 — Distractor strategies · M · todo
**Depends on:** T-021, T-017
`sibling_capitals_same_region` and neighbours-first for map questions. Ohio /
Indiana / Illinois / Iowa is a real question; Ohio / Hawaii / Texas / Alaska is
free (plan §1.2). **Needs T-017 first** — "same region" is undefined while two
region vocabularies exist.
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
filters `openapi.yaml` exposes on `GET /questions`, all of which the backend
already implements and filters on.
**Done when:** every generated question carries all seven and matches the schema.

### T-025 — Hand-check 30 generated questions · S · todo
**Depends on:** T-023
Read them as a child would. Tune the weights until the ordering looks sane; the
plan expects this to be a manual pass, not a computed one.
**Done when:** 30 are reviewed and the weight changes are recorded.

### T-026 — Templates for the topics the app has never shown · M · todo
**Depends on:** T-021, and the curation task for whichever topic
**New 2026-08-24.** `openapi.yaml` names ten topics; the app ships two. Each new
topic is one template plus the curated field behind it, and none needs new
infrastructure once T-021 lands:

| Topic | Template | Needs |
|---|---|---|
| `wildlife` | "Which animal is <state>'s state animal?" | T-012 |
| `landmark` | "Where is <landmark>?" | T-013 |
| `climate` | "Which state is <climate phrase>?" | T-014 |
| `agriculture` | "What grows most in <state>?" | T-015 |
| `size` / `superlative` | "Which is bigger?" | rank fields — already on entities |

`size` and `superlative` are the cheapest by a wide margin: the ranks are already
computed and populated, so they need a template and nothing else (plan §1.8).
Start there and the app gains a third topic without waiting on any curation.
**Done when:** at least one new topic reaches the app end to end — generated,
loaded, selectable at Setup, and answerable.

---

## D. The bank the app serves

The pipeline builds 50 states. The app serves 15 hand-written ones. **Nothing
connects them** — `backend/app/data/content.json` was copied from the old
`frontend/src/data/` by hand in PR #16, and `frontend/src/data/` has since been
deleted. This section is that bridge, and it is the highest-leverage work in the
queue: every curation and generation task above is invisible until it exists.

### T-040 — Loader: pipeline JSON → the served bank · M · todo
**Depends on:** T-010
**Rewritten 2026-08-24.** The old entry said "replace the hand-written
`frontend/src/data/` with generated data, bundled at build time". That directory
is gone and the app fetches everything from the API, so the task moved
downstream: a Python command that reads `question-bank/`'s output and upserts
into `entities` and `questions`, idempotent on id.

Half of it already exists — `store.ensure_content_loaded` reads
`app/data/content.json` at startup, keyed on content version, and reloading is a
no-op. What is missing is the step before it: taking the pipeline's shape into
that shape. Plan §5.3 is explicit that this is the Python loader's job and not
`DbSink`'s, and Alembic still owns the schema.
**Done when:** a documented command turns a pipeline build into a served bank,
running it twice changes nothing, and the app serves states that were never
hand-written.

### T-050 — Grow the served bank from 15 states to 50 · M · todo
**Depends on:** T-040, T-011
**New 2026-08-24.** The bank is Alaska, Arizona, California, Colorado, Florida,
Hawaii, Kansas, Louisiana, Maine, Michigan, Minnesota, Nevada, New York, Texas,
Washington. A child who learns those fifteen has finished the app, and the map —
which is the progress bar — can never fill past 30%.

This is mostly the payoff of T-040 and T-011 rather than new work, but it needs
its own pass: 50 states means the level spread has to still make sense, the
review queue has to behave at that size, and `store.candidate_questions`'s
in-Python selection pool wants a look (it is fine at 26 questions and documented
as the place to move filtering into SQL when it is not).
**Done when:** the app serves 50 states with reviewed prose, and a session at
any level draws sensibly from the whole set.

### T-051 — Render a third question format in the client · M · todo
**Depends on:** T-020
**New 2026-08-24.** `Session.tsx` has exactly two branches: `map_identify` and
`multiple_choice`. A question in any other format would render as a prompt with
nothing to answer it with. `map_click` — tap the state on the map — is the third
of the three formats plan §4 step 2 calls v1, it needs no new data beyond what
`us-atlas` already provides, and it is the one that makes the map interactive
rather than decorative.

The backend already grades it: `openapi.yaml` carries `map_click` in
`QuestionFormat` and the answer payload has a place for the tapped geometry id.
**Done when:** a `map_click` question can be shown, answered by tapping the map,
and graded, with the same asymmetric reveal as the other two.

---

## E. Backend follow-ons

The API is built and serves all 29 operations (see `PROGRESS.md`). What is left
is what it deliberately does not do.

### T-039 — Three endpoints exist and serve nothing · M · todo
**Depends on:** —
**New 2026-08-24.** `/geometry/{layer}` returns 404, `/elevation-profiles` and
`/superlative-axes` return empty lists. That is deliberate — they need sampled or
licensed source data this repo does not carry, and inventing numbers in an app
that claims to teach children is the one thing `CLAUDE.md` forbids outright — but
"implemented, returns nothing" is a state that should not last indefinitely.

Three separable decisions:
- **Geometry.** The client bundles `us-atlas` at build time and does not need
  this endpoint. Either source real vector layers or say the endpoint is for
  later clients and mark it so in the contract.
- **Superlatives** are nearly free (plan §1.8) — the rank fields are populated.
  This may be the fastest of the three, and T-026 overlaps it.
- **Elevation** needs a real terrain source (plan §2.6) and is a project of its own.
**Done when:** each of the three is either serving real data or documented in
`openapi.yaml` as intentionally unimplemented, with what it would take.

### T-045 — Three question formats have no answer key · S · todo
**Depends on:** —
**New 2026-08-24.** `drag_order`, `pin_*` and `click_profile` questions cannot be
graded by the seeded bank — submitting one returns 422 rather than a guess, which
is the right failure. Pin grading is implemented as nearest-centroid with a
distance cap; the contract's polygon-then-centroid strategy (§2.5) needs the
geometry layers from T-039. Decide whether these formats are near-term (in which
case they need keys and T-039's geometry) or whether the contract should mark
them as not yet gradeable.
**Done when:** the gap is closed or written into `openapi.yaml` as deliberate.

### T-046 — Decide: `backend/` or `api/` · S · todo
**Depends on:** —
**New 2026-08-24.** `conventions.md` §Layout and `PROGRESS.md` both say the
FastAPI service lives in `api/`. It was built in `backend/` and everything —
`Makefile`, `Dockerfile`, `CLAUDE.md`, both READMEs — now says `backend/`.
Renaming is cheap but touches the Docker build, the compose file and every doc;
leaving it means editing two docs. Either is fine. Deciding is not optional,
because right now the docs disagree with the tree and a new session believes the
docs. Fold the doc half into T-007 if that lands first.
**Done when:** one name is used everywhere, and `decisions.md` says which and why
if the answer was a rename.

### T-047 — `test-guidelines.md`'s `api/` section is still marked "does not exist yet" · S · todo
**Depends on:** —
**New 2026-08-24.** Line 205: "**Forward-looking.** `api/` does not exist yet
(plan §5, tasks T-030 onward)." There are 221 tests in `backend/tests/` and they
invented patterns worth writing down — savepoint-joined session rollback for
per-test isolation, `httpx.ASGITransport` for endpoint tests with no socket,
contract tests that walk `openapi.yaml` in both directions, and mutation testing
used to check the tests rather than the code. This is the same job T-002 did for
`question-bank`: correct the guidance against the tests that actually got written.
**Done when:** the section describes the real suite and the marker is gone.

---

## F. Frontend follow-ons

### T-043 — Shaded-relief basemap · S · todo
**Depends on:** —
One Natural Earth grayscale raster under the state paths. Cheapest visual win in
the plan — every existing map question starts looking like an atlas (§2.6, §4),
and it is worth more now that map questions are 15 of the 26.
**Done when:** the relief renders under the map without hurting first paint.

### T-044 — Point Lovable at `frontend/` · S · todo
**Depends on:** —
Lovable builds from the repo root and the app moved. Its build and sync are
likely broken until its project root is reconfigured. Now further out of date:
the app is served by the backend in production and the Vite dev server proxies
`/api`, so a Lovable preview that builds the client alone has no API to talk to.
**Done when:** a Lovable build succeeds, or the integration is deliberately retired.

### T-048 — A React hydration warning on first load of the production build · M · todo
**Depends on:** —
**New 2026-08-24.** The static build logs React error #418 — the prerendered
shell and the first client render disagree — on first load. The app recovers and
every screen works, and it does not happen in `bun run dev`, only in the
prerendered bundle the container serves. Investigated during PR #19 without a
root cause: Google Fonts was ruled out (stubbing it reachable did not help), and
matching the shell's empty first paint had no effect and was reverted. It is a
warning, not a broken screen, which is why it is not blocking — but a hydration
mismatch is the kind of thing that turns into a real bug later.
**Done when:** the cause is found and fixed, or documented with why living with
it is acceptable.

---

## G. Unverified in the environment they were built in

Not features — claims this repo makes that nothing here has checked.

### T-049 — Nobody has ever run `docker build` or `docker compose up` · S · todo
**Depends on:** —
**New 2026-08-24.** The `Dockerfile` and `docker-compose.yml` were written,
reviewed and merged (PRs #18, #20, #21) in an environment with **no Docker
daemon**. `docker compose config` validates the compose file's shape, and the
single-origin serving path was verified by running the built static bundle
against the real backend directly — but the image has never been built and the
stack has never been brought up. The root `README.md` tells a new user to start
with `docker build`, so this is the first thing a stranger does and the one thing
nobody has done.
**Done when:** both `docker build` and `docker compose up` are run on a machine
with a daemon, the app answers on :8000 in each, and whatever breaks is fixed.

---

## H. Later, in plan order

Not broken down yet — they depend on decisions above. Break each one down when
it comes into view.

- **Superlatives** — nearly free once entities carry rank fields (plan §1.8),
  and the fastest new topic. Started in T-026 and T-039
- **Countries**, then world cities, then rivers / mountains / oceans (plan §1.7).
  Not before the US loop feels good (plan §4) — which means not before §D
- **Pin formats** and point-in-polygon grading (plan §2.5) — see T-045
- **Elevation profiles** and the altitude → climate → farming → population chain
  (plan §2.6) — the strongest content for the older band
- **Elo** — only with real play data. `rating` and `times_answered` already have
  their places, so nothing needs reseeding (plan §1.4). The backend records
  answers now, so the data this needs is finally being collected

## Deferred on purpose (plan §3.9)

Leaderboards, multiplayer, badges, sound design, daily challenges, parent
dashboard. Each is reasonable and each is a week not spent finding out whether
the core loop is fun.
