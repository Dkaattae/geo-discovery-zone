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

**Work on the loop itself does not go here.** Changes to `process.md`,
`process-decisions.md`, `CLAUDE.md`, `.claude/` or the workflows are `P-n`
tickets in [`process-tasks.md`](process-tasks.md), done by hand and never
expanded into a brief. `run-loop.sh` G1 refuses to run them. A `T` task may still
add to `engineering-decisions.md` when its criteria say so.

**Status**: `todo` · `doing` · `done` · `dropped` (with a reason)

Sizes are a sanity check, not a commitment: **S** ≈ under an hour, **M** ≈ a
few hours, **L** ≈ a day. Anything bigger than L is not a task yet.

_Last swept: 2026-08-24, four times — after PRs #16–#20 landed the backend
off-queue; after T-009 and T-052 put the backend and a real stack under CI;
after T-054's browser suite found the write-durability bug; and after T-004
pinned the client's level labels to the server's (PR #23). Swept again
2026-08-28, after T-005 put CI's four unit test steps behind a dead proxy
(PR #26). Swept again 2026-09-03, after T-006 made the frontend lint gate fail
on warnings (PR #29). Swept again 2026-09-04, after T-007 made `conventions.md`
describe the repo that exists (PR #33), and again the same day after T-008 pinned
the third-party CI actions by SHA (PR #34). Swept again 2026-09-11, after T-058
put `README.md`'s CI claims under the same test (PR #35). Swept again 2026-09-12,
after T-010 committed the 50-state bank and recorded the decision as `E-6`
(PR #37). Swept again 2026-09-14, after T-011 gave all 50 states a curated fun
fact (PR #41)._

## How this list is ordered

**Structural work first, features after.** The loop in `process.md` is built for
adding things — pick a task, build it, verify it, ship it — and it only works if
the ground under it holds. A test suite, a CI job, a decision that two halves of
the repo disagree about: none of those are features, all of them make every
feature after them cheaper, and each one skipped is paid for with interest by
whatever lands on top of it.

So §A is the ground and it comes first. It is not a backlog to get to eventually
— it is what the feature sections depend on. **Prefer an unfinished §A task to a
started §C one**, and when they conflict, §A wins.

Everything below §A is ordered by what it unblocks, not by size or appeal.

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

## A. Foundations — the ground everything else stands on

Nothing here is glamorous and all of it makes the rest cheaper. **This section
comes first on purpose** (see "How this list is ordered"). What is already in
place, so nobody rebuilds it:

| | |
|---|---|
| **Unit and endpoint tests** | 242 backend, 184 frontend, 243 question-bank |
| **Integration tests** | 30 over HTTP against a real stack (`backend/integration/`) |
| **End-to-end tests** | 13 in a browser against docker compose (`e2e/`) |
| **CI** | six jobs on every PR: frontend, question-bank, backend, backend-postgres, integration, e2e |
| **No network in tests** | enforced, not assumed: the four unit test steps run with all six proxy spellings pointed at `http://127.0.0.1:1` and a 15-minute timeout (T-005, PR #26). `integration` and `e2e` are deliberately unguarded |
| **Databases** | SQLite and Postgres, same migrations, same suite |
| **Docker** | one image serves the app and the API; compose adds Postgres |
| **`conventions.md`** | current as of T-007 (PR #33) — layout, commands, database, CI and Docker — and held there by `frontend/src/conventions-doc.test.ts`, which checks it against `backend/Makefile`, the three `package.json` files and `ci.yml` |
| **`README.md`** | its Checks and CI claims are under the same test since T-058 (PR #35): the job list it names equals `ci.yml`'s, every command it gives is a real `make` target or `bun` script, and no suite size is stated that nothing asserts |

What is missing from that picture is below.

### T-062 — One test count in `README.md` is still unasserted · S · todo
**Depends on:** —
**New 2026-09-11, found by T-058's tester (PR #35)** and left deliberately
unfixed there. T-058 removed the two hardcoded suite sizes inside `README.md`'s
Checks code block and put every other claim in that section under
`frontend/src/conventions-doc.test.ts`. One escaped, in the prose just below the
block: **`README.md:192` — "The nine Postgres-only tests skip on SQLite."** It is
true today (9 tests in `backend/tests/test_postgres.py`) and nothing asserts it,
so the next test added there makes the README quietly wrong — the exact drift
T-058 existed to close. Out of T-058's reach because criterion 8 named the Checks
*block* and lines `:183`/`:185`, and the tester was right not to stretch it.
Cheapest fix is the same call T-058 made twice: drop the number, keeping the
sentence's real content (that nobody needs a database installed to run
`make -C backend check`). Asserting it instead means counting `test_` functions
in `backend/tests/test_postgres.py` from a `bun test` file, which is a
cross-language reach this suite does not otherwise make.
**Done when:** no unasserted count of tests survives anywhere in `README.md`, and
the reason a reader needs that sentence survives with it.

### T-066 — `question-bank` has no `lint`, and briefs keep asking for it · S · todo
**Depends on:** —
**New 2026-09-14, found by T-011's tester and confirmed by its reviewer (PR #41).**
T-011's criterion 13 required "`bun test`, `bun run typecheck` and `bun run lint`
pass in `question-bank/` and in `frontend/`". There is no `lint` script in
`question-bank/package.json` — only `build`, `build:sample` and `typecheck` — and
`.github/workflows/ci.yml` says why in a comment: the package has no eslint config
and no eslint dependency, and adding either is a dependency decision the loop may
not make on its own (`CLAUDE.md` "Packages"). So the criterion named a check that
has never existed, the tester could neither run it nor fail it, and the next brief
touching this package will write the same clause again.
Two halves, and the second is the cheap one:
- **The decision** is Dkaattae's: give `question-bank/` eslint (a dependency), or
  record that `typecheck` is deliberately the whole gate there.
- **Either way, write it where a brief writer will trip over it** —
  `conventions.md`'s command table, which
  `frontend/src/conventions-doc.test.ts` already checks against the three
  `package.json` files, so a `lint` script added later cannot go undocumented.
**Done when:** `bun run lint` either exists in `question-bank/` or is documented
as deliberately absent, and nothing in the repo's docs implies a command the
package does not have.

### T-060 — Enable Dependabot (or Renovate) for GitHub Actions · S · todo
**Depends on:** — (T-008 landed in PR #34; this is its follow-on, not its blocker)
T-008's `engineering-decisions.md` E-5 pins `oven-sh/setup-bun` and
`astral-sh/setup-uv` in `ci.yml` to a commit SHA, with `actions/checkout` and
`actions/upload-artifact` staying on their major tags — and states plainly that
nothing in the repo notices when a pinned SHA goes stale or a watched tag moves,
because `.github/` holds only `workflows/` and no dependency bot exists. E-5
recommends closing that gap with Dependabot or Renovate scoped to
`package-ecosystem: "github-actions"`, but turning a bot loose to open PRs on a
schedule is Dkaattae's call, not a task the loop can make on its own
(`CLAUDE.md` "Packages").
**Done when:** Dkaattae has decided whether to enable it, and — if yes —
`.github/dependabot.yml` (or the Renovate equivalent) exists, is scoped to
`github-actions`, and E-5's "no mechanism exists in the repo today" sentence is
updated to match.

### T-061 — Two test files enforce E-5, and one of them hardcodes a count · S · todo
**Depends on:** —
**New 2026-09-04, found by T-008's reviewer (PR #34).** T-008 left the frontend
suite with two files parsing `.github/workflows/ci.yml` and applying the same
rule: `frontend/src/ci-workflow-pins.test.ts` (the worker's, 4 tests) and
`frontend/src/ci-action-pinning.test.ts` (the tester's, 12 tests). The second is
a behavioural superset of the first — exact action-set equality rather than
`toContain`, lowercase hex required, the trailing comment required to name a
release — so nothing is lost by keeping only it. What the duplication costs is
that E-5's rule has two implementations (`isPinnedCategory()` at
`ci-workflow-pins.test.ts:59`, the `pinned` branch of `violations()` at
`ci-action-pinning.test.ts:74`), and changing the rule means changing both or
the suite contradicts itself.

While there: `ci-action-pinning.test.ts:106` asserts `ci.yml` has exactly 13
`uses:` references. The intent is to catch a `uses:` line the regex cannot read,
which is worth keeping — but the literal also fires on any legitimately added CI
step, and reads as "you added a step" rather than "the parser missed a line".
Asserting the parsed count against the raw `uses:`-line count gets the same
coverage without pinning the workflow's size. This repo has made that call twice
already: T-058 dropped `conventions.md:66`'s "thirteen" (PR #35) and T-047 will
drop `test-guidelines.md:198`'s.

**Widened 2026-09-11 by T-058's reviewer (PR #35).** The same duplication now
exists a third time, *inside* `frontend/src/conventions-doc.test.ts`, and it is
cheap to fold in while the parsers are already open:

- `jobsDocClaimsCheckLockfile()` (the worker's block) and `jobsCreditedByDoc()`
  (the tester's) are the same function written twice, one describe block apart.
- `longestBacktickRun()` was factored out for README's job list but criterion
  10's test still carries its own inline copy of the same regex — T-058's
  Constraints forbade weakening criterion 10, so the worker rightly left it, and
  collapsing the two is a separate, safe step.

That file is **not** one of the two to collapse — it reads `ci.yml` for a
different purpose (doc claims, not E-5) and T-058's Constraints argued against
adding a fourth parser. Only its internal duplicates are in scope.
**Done when:** one file enforces E-5, the count literal is gone, no rule in the
frontend suite has two implementations of itself, and deleting a `# v2.2.0`
comment or writing `oven-sh/setup-bun@v2` still turns the suite red.

### T-057 — `levels.py` claims to mirror a `levelWindow()` the client does not have · S · todo
**Depends on:** —
Found by T-004's worker while pinning the two level implementations together.
`backend/app/levels.py:60` documents `level_window()` as mirroring
`levelWindow()` in the client — there is no such function anywhere in
`frontend/`, and `grep levelWindow frontend/` returns nothing. So either the
client lost a level picker that the server still describes, or the docstring is
describing a function that never existed. Either way the comment is false, and
`fixtures/level-labels.json` deliberately covers only the functions both sides
actually have.
T-004 left a second, larger question in the same place and deliberately did not
answer it: the session endpoints already return a `levelLabel` object, so the
client may not need its own copy of the arithmetic at all. `fixtures/level-labels.json`
now makes drift loud, which buys the time to decide it properly rather than
forcing it.
**Done when:** it is settled which of the two is true — the docstring is
corrected, or the client grows the picker the server is sizing windows for — and
`level_window`'s three-or-four-choices rule is documented wherever it really
lives. Say in the same breath whether `frontend/src/lib/level.ts` keeps existing.

---

## B. Finish the US entity table

The pipeline works and has run live against all 50 states; the *data* is not
finished. Each of these is independent. Nothing here reaches the app until T-040
bridges the pipeline to the served bank — but the curation is the long pole, so
it is worth doing in parallel rather than after.

### T-063 — Periodic pipeline to refresh the committed 50-state data · M · todo
**Depends on:** — (T-010 landed in PR #37; this is its follow-on, not its blocker)
Split out of T-010's Q1: once `question-bank/data/` is committed, it goes stale
against Wikidata unless something regenerates and diffs it on a schedule. Design
and build that refresh (likely a scheduled CI job that reruns the pipeline live
and opens a PR with the diff — `.github/workflows/ci.yml`'s existing jobs run
offline on purpose, per T-005, so this is a new one). Explicitly out of scope for
T-010 itself.
**One thing it must not miss, found by T-011's reviewer (PR #41):** the live
Wikipedia pass (`build.ts`, `if (args.funFacts)`) drafts a fact for **every**
entity with a `wikipedia_title`, with no check for whether that state already has
a curated one. All 50 do now, so a live run writes a 50-draft
`fun-facts.review.json` of which every entry is already answered. Nothing is
corrupted — the drafts never touch entity output, `normalize.ts` reads the
curated table — but a scheduled refresh that dumps 50 redundant drafts in front
of a human each time is noise that will get ignored, which is the failure mode
this task exists to avoid. Skip states that already carry a curated fact, or say
why not.
**Done when:** the committed bank can be refreshed from live Wikidata on a
schedule without a human running the pipeline by hand, and a stale bank is
visible (a PR, an alert, or both) rather than silent.

### T-064 — Purge `question-bank/sample-data/` once the full bank is proven · S · todo
**Depends on:** — (T-010 landed in PR #37; this is its follow-on, not its blocker)
Split out of T-010's Q3: `sample-data/` (one committed state, with its own
README) stays alongside the full 50-state commit for now, on purpose — kept
until the committed bank is shown to work end to end. Once that is proven, it is
redundant and this task removes it, updating anything that pointed at it as an
example (`question-bank/README.md`, `conventions.md`).
**One thing it must not miss:** `question-bank/src/committed-bank.test.ts`'s
criterion-4 tests compare the tracked `us-state-co.json` against
`sample-data/us-state-co.json`. Deleting `sample-data/` makes them throw, so this
task removes or re-points them — found by T-010's tester, recorded here so it is
not a surprise.
**Smaller since T-011 (PR #41):** `sample-data/fun-facts.review.json` is already
gone. It held Colorado's raw `reviewed: false` Wikipedia draft, which T-011's
criterion 2 banned from anything tracked under `sample-data/`, and
`sample-data/README.md` no longer advertises it. What is left to delete is
`us-state-co.json`, `index.json` and that README.
**Done when:** `sample-data/` is deleted, or this task is dropped with the reason
it turned out still to earn its place.

### T-065 — Refresh the stale suite-size counts, and stop them going stale · S · todo
**Depends on:** —
`test-guidelines.md:209` (`# 19 tests today`) still quotes a count that is
already wrong and will be wrong again. `question-bank` alone went 19 → 209 in
T-010, and the number moved **three times inside that one PR** — each round of
worker and tester added tests, and each round left a doc naming the previous
figure. T-010's sweep corrected `PROGRESS.md`'s bullet and this file's coverage
table to 209 by hand, which is the third hand-correction and the argument for
this task: **prefer removing the figures to refreshing them again.** T-011 made
it the fourth and fifth: 209 → 243, corrected by hand in the same two places
again (PR #41). This is
exactly the drift `frontend/src/conventions-doc.test.ts` was built to catch
(T-007, T-058), and neither `test-guidelines.md` nor `tasks.md` is covered by it.
**Done when:** the counts match a real run, and either a test asserts them
against the suite or the numbers are replaced by something that cannot rot (a
command to run, not a figure).

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
**Depends on:** — (T-010 landed in PR #37; this is its follow-on, not its blocker)
**Rewritten 2026-08-24.** The old entry said "replace the hand-written
`frontend/src/data/` with generated data, bundled at build time". That directory
is gone and the app fetches everything from the API, so the task moved
downstream: a Python command that reads `question-bank/`'s output and upserts
into `entities` and `questions`, idempotent on id.
**T-010 resolved 2026-09-12 (E-6): the loader reads the committed
`question-bank/data/us-states/`.** That JSON is tracked in git, not generated at
deploy time — seeding needs no live Wikidata run when this loader runs. This
task does not get to re-decide that; it consumes the committed bank as-is.

Half of it already exists — `store.ensure_content_loaded` reads
`app/data/content.json` at startup, keyed on content version, and reloading is a
no-op. What is missing is the step before it: taking the pipeline's shape into
that shape. Plan §5.3 is explicit that this is the Python loader's job and not
`DbSink`'s, and Alembic still owns the schema.
**Done when:** a documented command turns a pipeline build into a served bank,
running it twice changes nothing, and the app serves states that were never
hand-written.

### T-056 — The map cannot fill in on a child's first day · M · todo
**Depends on:** T-050 (or T-021, whichever gets there first)
**New 2026-08-24, found by the browser suite.** "The map is the progress bar" is
one of the four things that shape every decision in this repo. Today the progress
bar **cannot move on day one**, however well a child does.

The arithmetic, measured against a running server rather than reasoned about:

- Mastery moves **+0.25** per right answer and a state fills in above **0.7** —
  so a state needs **four** right answers about it.
- The shipped bank has **at most two questions per state** (26 questions over 15
  states; 11 states have two, 4 have one).
- A session never repeats a question.

So the most any state can reach in one sitting is **0.5**. A perfect first
session — all 26 answered correctly — colours in **0 of 15**. Mastery is stored
on the profile, so a *second* full sitting takes those states to 1.0: 52 right
answers fills in 11 of 15. A child's first session ends with the same empty map
it started with, and nothing on screen explains why.

This is a content gap and it dissolves on its own once there are four or more
questions per state (T-050, T-021). It is filed separately because it is the
thing to check *after* the bank grows — and because if the bank is going to stay
small for a while, the alternative is to revisit the 0.7 threshold or show
partial mastery on the map, which is a design decision rather than more data.
`e2e/tests/progress.spec.ts` has a test that documents the current behaviour and
fails when the premise stops being true.
**Done when:** a good first session visibly colours something in.

### T-050 — Grow the served bank from 15 states to 50 · M · todo
**Depends on:** T-040 (T-011 landed in PR #41 — all 50 curated facts exist in the
pipeline bank; nothing serves them yet)
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

### T-053 — The public bank hands out the answer key by default · S · todo
**Depends on:** —
**New 2026-08-24, found while writing T-052.** `GET /questions` and
`GET /questions/{id}` take `includeAnswerKey`, and `openapi.yaml` sets its
**default to `true`** (line 1166). The contract explains why: "the v1 client
grades locally. Set `false` once grading runs through
`POST /sessions/{sessionId}/answers`."

**Grading moved to the server.** The client already passes `includeAnswerKey=false`
on every call. What is left is the default on a public, unauthenticated endpoint:
`curl /api/v1/questions` returns `correctIndex` for all 26 questions, so a child
who opens the network tab can read every answer.

Not a security hole — the bank is public reference data by design, and nothing
stops someone reading the questions either. It is a **product** problem: the app
is built so a wrong answer is not a failure, and an answer key one tap away
undercuts that more than it enables cheating.

Flipping the default is a contract change (`CLAUDE.md`: change `openapi.yaml`
deliberately and say so). An integration test asserts the current behaviour on
purpose, and it is the test to update when this is decided.
**Done when:** the default is decided, `openapi.yaml` and the implementation
agree, and `test_the_answer_key_can_be_withheld_from_the_public_bank` reflects
whichever way it went.

### T-046 — Decide: `backend/` or `api/` · S · todo
**Depends on:** —
**New 2026-08-24. Smaller since T-007 (PR #33).** The service was built in
`backend/` and the docs used to say `api/`. `conventions.md` now says `backend/`
and `PROGRESS.md` never did, so **the doc half is done except for two files**:
`CLAUDE.md` line 4 (``` `api/` FastAPI + Postgres (uv, not built yet)```) and
line 51 (`uv add` / `uv run` in `api/`), which are loop-gated and belong to a
hand-written `P` ticket rather than to this task; and `test-guidelines.md`,
which is T-047.

What is left here is the decision itself, not the doc sweep: rename `backend/`
to `api/`, or keep `backend/` and retire the name `api/` for the directory.
Renaming touches the Docker build, the compose file, `ci.yml` and every doc;
keeping `backend/` costs the two lines above. Either is fine, and deciding is
not optional — an undecided name is how the docs drifted from the tree in the
first place.
**Done when:** one name is used everywhere, and `engineering-decisions.md` says which and why
if the answer was a rename.

### T-047 — `test-guidelines.md`'s `api/` section is still marked "does not exist yet" · S · todo
**Depends on:** —
**New 2026-08-24.** Line 205: "**Forward-looking.** `api/` does not exist yet
(plan §5, tasks T-030 onward)." `backend/tests/` is now the largest suite in the
repo, and it invented patterns worth writing down — savepoint-joined session rollback for
per-test isolation, `httpx.ASGITransport` for endpoint tests with no socket,
contract tests that walk `openapi.yaml` in both directions, and mutation testing
used to check the tests rather than the code. This is the same job T-002 did for
`question-bank`: correct the guidance against the tests that actually got written.
While there: line 198's `cd frontend && bun test # 65 tests today` went stale
inside the very PR that wrote it (T-004 finished at 80). A count that is wrong
after every task is worth dropping rather than maintaining.
**Also, found by T-005's reviewer (PR #26):** the "No network in tests, ever"
paragraph now ships a copy-pasteable block for reproducing CI's dead-proxy guard
locally, and it omits `uv sync` — on a cold checkout the reader's first `uv run
pytest` fails for a reason that has nothing to do with the guard. One line, and
it belongs here rather than in T-005 because T-047 already owns correcting this
file.
**Done when:** the section describes the real suite, the marker is gone, the
frontend line either carries a true number or no number, and the dead-proxy
reproduction block runs from a cold checkout.

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

### T-052 — Integration tests against the compose stack · M · **done** (2026-08-24)
28 tests in `backend/integration/`, black-box over HTTP, importing nothing from
`app`: the stack comes up and migrates, the single origin holds (shell at `/`,
immutable assets, SPA fallback, `/api/v1/*` returning problem documents rather
than HTML), content is public, a child's whole sitting works end to end, one
account cannot see another's profile, and a restart is not a reset. `make -C
backend test-integration` brings the stack up and tears it down; the
`integration` CI job runs it on every PR. See `backend/integration/README.md`.
**Verified how:** 23 pass against a hand-built stack of the same shape (real
Postgres, the real frontend bundle); the 5 restart tests skip there and their
assertions were reproduced manually against a real process restart and a real
Postgres bounce. **The compose path itself is still unrun** — that is T-049,
below, which these tests now do the work of, once something executes them.

### T-054 — End-to-end tests in a browser · M · **done** (2026-08-24)
13 Playwright tests in `e2e/`, driving Chromium against the compose stack: sign
in, make an explorer, play **every quiz type the Setup screen offers** (read from
the app, so a new topic is covered without editing the tests), answer at random
so both reveal paths run, and check progress survives a full sign-out. An `e2e`
CI job runs them on every PR. See `e2e/README.md`.
**It found a real bug on its first run** — see T-055, fixed — and one product
finding, T-056.

### T-055 — A write was not durable when its response said so · S · **done** (2026-08-24)
`get_db` was a dependency with `yield` that committed **after** the yield, and on
a real server FastAPI runs that exit code after the response has already gone to
the client. Measured on uvicorn: the client had the response **400ms before the
commit ran**.

So `POST /auth/register` answered `201 Created` before the account row existed,
and the app's very next call — exchanging those credentials for a token — could
be told the brand-new password was wrong. Roughly **one sign-up in eight** under
load. Every write endpoint had it: create a profile and immediately read it,
submit an answer and immediately read the session.

Fixed with `DbSessionMiddleware` (`app/db.py`), which owns the session and
commits before the response is sent; 4xx and 5xx roll back as before. Regression
tests in `backend/integration/test_write_durability.py`, all of which fail
without the fix.
**Worth remembering:** no in-process test could have caught this.
`httpx.ASGITransport` and the suite's overridden session never exercise that
ordering. It took a browser, a real server, and two callers at once.

### T-049 — Nobody has ever run `docker build` or `docker compose up` · S · **done** (2026-08-24)
Confirmed working by Dkaattae. `docker compose up` builds the image and serves
the app on :8000. The `integration` and `e2e` CI jobs now exercise that path on
every PR, so it cannot rot back to unverified.

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
