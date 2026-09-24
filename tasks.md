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
add to `engineering-decisions.md` when its criteria say so — and since T-057
(PR #53) that is actually possible: the assertions in
`question-bank/src/region-vocabulary.test.ts` that pinned `E-9` as the highest
entry for ever are generalised to uniqueness and ascending order. T-072 (PR #55)
filed `E-11` through the loop and no suite went red, so that is now demonstrated
rather than expected; `E-12` is next. Do not reintroduce a ceiling.

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
fact (PR #41). Swept again 2026-09-18, after T-016 filled Alaska's
`highest_point` (PR #47) — the T-012 to T-015 sweeps happened too, and are
logged in `PROGRESS.md` rather than here. Swept again 2026-09-22, after T-072
deleted the two criterion-19 diff guards (PR #55): T-070 (c) is closed and
trimmed out of that entry, and T-073 is the fourth instance of the same defect,
in `frontend/`. Swept again 2026-09-22, after T-073 deleted the fourth instance
(PR #56): **every known red-on-`main` git baseline is now gone**, T-070 is down
to its two silent-`git` leftovers, and T-065 gained one more stale figure. Swept again 2026-09-22, after T-065 deleted
the stale suite-size counts and guarded them (PR #57): T-074 is smaller and
unblocked, T-047 lost its count clause, and T-064 now depends on T-040. Swept
again 2026-09-24, after T-074 deleted the suite sizes from the three package
READMEs and widened the same guard to them (PR #58): nothing else in the queue
was waiting on it._

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
| **Unit and endpoint tests** | `make -C backend test` (backend), `cd frontend && bun test`, `cd question-bank && bun test` |
| **Integration tests** | over HTTP against a real stack (`backend/integration/`) |
| **End-to-end tests** | in a browser against docker compose (`e2e/`) |
| **CI** | six jobs on every PR: frontend, question-bank, backend, backend-postgres, integration, e2e |
| **No network in tests** | enforced, not assumed: the four unit test steps run with all six proxy spellings pointed at `http://127.0.0.1:1` and a 15-minute timeout (T-005, PR #26). `integration` and `e2e` are deliberately unguarded |
| **Databases** | SQLite and Postgres, same migrations, same suite |
| **Docker** | one image serves the app and the API; compose adds Postgres |
| **`conventions.md`** | current as of T-007 (PR #33) — layout, commands, database, CI and Docker — and held there by `frontend/src/conventions-doc.test.ts`, which checks it against `backend/Makefile`, the three `package.json` files and `ci.yml` |
| **Test counts in docs** | none stated in `README.md`, `test-guidelines.md`, `backend/README.md`, `backend/integration/README.md`, `e2e/README.md`, `PROGRESS.md`'s status, Known-gaps and Next sections, or this table, and a test fails if one comes back (T-062, PR #50; T-065, PR #57; T-074, PR #58). Name a command or a directory instead |
| **`README.md`** | its Checks and CI claims are under the same test since T-058 (PR #35): the job list it names equals `ci.yml`'s, every command it gives is a real `make` target or `bun` script, and — since T-062 (PR #50) — no count of tests is stated **anywhere in the file**, digits or spelled out |

What is missing from that picture is below.

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
**Skipped by the expander, 2026-09-19:** the first half is a dependency decision
reserved for Dkaattae (`CLAUDE.md` "Packages"), so no criterion can be written
for it without guessing the answer. Unblocks the moment that call is recorded
here; T-061 was taken instead. **Passed over again 2026-09-22** for the same
reason; T-073 was taken. **And again 2026-09-24**; T-074 was taken.

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
**Skipped by the expander, 2026-09-19:** the whole task is the decision, and it
is Dkaattae's. Nothing to expand until it is answered; T-061 was taken instead.
**Passed over again 2026-09-22** for the same reason; T-073 was taken. **And
again 2026-09-24**; T-074 was taken.

### T-071 — `question-bank/` is 22 files out of prettier, and nothing gates it · S · todo
**Depends on:** —
**New 2026-09-18, from T-017's reviewer (PR #49).** `bunx prettier --check
"src/**/*.ts"` in `question-bank/` flags **22 files**, including ones no recent
task has touched (`build.ts`, `sparql.ts`, `normalize.ts`). It is pre-existing
drift, not any one task's doing — but `question-bank`'s CI job runs typecheck and
test only, so nothing catches it and nothing stops it growing.

The cost is already being paid task by task: T-017's worker deliberately did not
run `prettier --write` on the files it edited, because doing so reformatted
unrelated pre-existing lines well beyond that task's diff and would have made a
content-curation PR unreviewable. That was the right call, and it is the wrong
call to keep making — every future task in this package faces the same choice.

Fix it in one commit that is *only* the reformat, then add the gate so the next
one cannot accumulate. Check `frontend/` and the repo root for the same drift
while you are there, and check whether the prettier version is pinned — an
unpinned formatter is how this happens.
**Done when:** `bunx prettier --check` is clean in `question-bank/`, the
formatter version is pinned, and CI fails on a badly-formatted file.
**Skipped by the expander, 2026-09-22:** "the formatter version is pinned" and
"CI fails on a badly-formatted file" both require `prettier` as a devDependency
of `question-bank/` — `bunx` resolves from the network, and that job installs
behind the dead proxy (T-005), so an unpinned `bunx prettier` cannot run there at
all. Adding it is a dependency decision reserved for Dkaattae (`CLAUDE.md`
"Packages"), the same wall T-066 is waiting at, and prettier already being a
`frontend/` devDependency does not settle it. Unblocks the moment that call is
recorded here; T-065 was taken instead. **Passed over again 2026-09-24** for the
same reason; T-074 was taken.

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
**Skipped by the expander, 2026-09-22:** two calls inside it are Dkaattae's, and
neither can be guessed into an acceptance criterion. **One** — a scheduled
workflow that opens PRs needs `contents: write` and `pull-requests: write` on a
job that runs unattended against a live external source, which is the same "turn
a bot loose to open PRs on a schedule" decision T-060 is already waiting on.
**Two** — it deliberately reverses T-005: every existing CI job runs with all six
proxy spellings on a dead loopback, and this one must reach Wikidata. Both are
answerable in a line here; until then the criteria would be a guess. T-065 was
taken instead.

### T-064 — Purge `question-bank/sample-data/` once the full bank is proven · S · todo
**Depends on:** T-040 (corrected by T-065's reviewer, per the expander's note below)
Split out of T-010's Q3: `sample-data/` (one committed state, with its own
README) stays alongside the full 50-state commit for now, on purpose — kept
until the committed bank is shown to work end to end. Once that is proven, it is
redundant and this task removes it, updating anything that pointed at it as an
example (`question-bank/README.md`, `conventions.md`).
**One thing it must not miss — and it is five files now, not one.**
`committed-bank.test.ts` (T-010 criterion 4), `landmarks.test.ts` (T-013
criterion 8), `landmarks-verify.test.ts` (T-013 tester criterion 8),
`state-animals.test.ts` (T-012 criterion 7) and `climate-kid-verify.test.ts`
(T-014 tester criterion 13) all compare the tracked `us-state-co.json` against
`sample-data/us-state-co.json`. Deleting `sample-data/` makes every one of them
throw, so this task removes or re-points all five — found by T-010's tester as
one file, and grown by every curation task since (T-015/PR #46 touched all five
to exclude `top_crops`, the sample being frozen while the bank moved).
**The count going up each cycle is itself the argument for doing this sooner.**
**Smaller since T-011 (PR #41):** `sample-data/fun-facts.review.json` is already
gone. It held Colorado's raw `reviewed: false` Wikipedia draft, which T-011's
criterion 2 banned from anything tracked under `sample-data/`, and
`sample-data/README.md` no longer advertises it. What is left to delete is
`us-state-co.json`, `index.json` and that README.
**Done when:** `sample-data/` is deleted, or this task is dropped with the reason
it turned out still to earn its place.
**Skipped by the expander, 2026-09-22 — and its `Depends on: —` is wrong.** The
entry's own precondition is "kept until the committed bank is shown to work end
to end", and nothing serves the committed bank yet: **T-040** is the loader and
has not run, so the app still serves the hand-copied `content.json`. Deleting
`sample-data/` now would be acting before the condition this entry names, and
"dropped because it still earns its place" cannot be settled either while the
thing that would retire it is unbuilt. **Depends on: T-040.** T-065 was taken
instead.

### T-067 — `climate_koppen` is declared and never emitted · S · todo
**Depends on:** —
**New 2026-09-17, carried over by T-014's reviewer (PR #44)** because T-014's Out
of scope said the gap was a sweep entry rather than a commit there.
`Entity.climate_koppen` exists (`question-bank/src/types.ts:49`) and
`geoquizdataplan.md` §1.4's entity example prints it, but no query produces it and
no tracked file carries the key — so the plan shows a field the pipeline has never
emitted. T-014 filled `climate_kid` for all 50 states by hand precisely because
the codes are not on disk to translate from (plan §1.9), which means the raw codes
now buy the app nothing a child would see. Two honest endings: **delete the field
and correct §1.4's example**, or **emit it** and say what reads it. Deleting looks
right — nothing in `openapi.yaml` exposes it and `climate_kid` is the shipped
version — but it edits the plan's example, so it is a deliberate call rather than
a tidy-up.
**If this one ends by *emitting* the field, it hits the pinned-digest wall —
read T-070 first.** Deleting the field touches no tracked file and avoids it
entirely, which is one more small argument for that ending.
**A second, smaller plan correction rides here (T-015's reviewer, PR #46)**,
because it is the same one-line kind of deliberate plan edit and is not worth its
own entry: **`geoquizdataplan.md:256` still lists US crops as coming from the
"USDA NASS Quick Stats API", notes "Free key", and is now false.** T-015
considered that route and rejected it — no key exists in the repo, the
environment or CI secrets, no agent can register for one (signup form plus
email), and CI runs with all six proxy spellings on a dead loopback, so a live
fetch cannot run there by design. `top_crops` ships hand-curated instead, on
`CuratedState`, and the full reasoning is already written down in
`engineering-decisions.md` **E-7**. The plan's *reasoning* is what is wrong, not
a detail: it prices the route at "free key" when the real cost is a human action
outside the loop. Correct the row to say hand-curated, pointing at E-7. **Leave
the `world crops | FAOSTAT` row alone** — that one is untouched, still unbuilt,
and still plausible, since a bulk download needs no key.
**Done when:** `climate_koppen` is either emitted by a build or gone from
`types.ts` and from the plan's example, nothing describes a field that does not
exist, and §1.9's US-crops row names the source the code actually uses.
**Expanded and blocked 2026-09-24** (`tasks/T-067-climate-koppen.md`): this entry
says "nothing in `openapi.yaml` exposes it", which is false.
`openapi.yaml:1477` declares `Entity.climateKoppen` and `backend/app/models.py:155`
declares `climate_koppen`, so deleting the field is a contract change. The brief
asks Dkaattae to choose between deleting it everywhere, deleting it from the
pipeline only, or emitting it.

### T-068 — US livestock/poultry per state, separate from crops · S · todo
**Depends on:** — (**T-015 landed, PR #46**, and settled the pattern this
inherits.)
**Smaller than when it was written (T-015's reviewer, PR #46).** T-015 proved the
whole route end to end, so this is now a copy of a working shape rather than a
design: a `string[]` field on `CuratedState`, folded in by `normalize.ts` as
`curated.<field> ?? []` (`fun_facts`'s shape — **not** `climate_kid`'s
conditional spread, so a blank state keeps the key and the bank diff does not
move), values curated as the reviewed kid-facing text itself with no second
review pass, provenance in the table's header comment and an `engineering-decisions.md`
entry. Read **E-7** and PR #46's body before writing the brief; the field name
and the `openapi.yaml`/template exposure are the only genuinely open questions
left, since `top_crops` was already declared and this one is not.
**One thing it must not miss — the pinned-digest wall, now owned by T-070.**
T-016 (PR #47) reached it before this task did and added the third and fourth
neutralisations rather than re-pinning, so the judgement this entry used to
carry has moved to its own entry: **read T-070 before writing this brief**, and
do not add a fifth exception without reading it. If T-070 has not run, neutralise
`top_livestock` the same way the three guards already do and say so on the PR.
**Why it exists, from a question raised while scoping T-015:** cattle, dairy,
poultry and eggs are farm output but not crops, and folding them into
`top_crops` would make that field's own name wrong and could crowd out an
actual plant crop in a state where livestock is the bigger commodity by value
(e.g. cattle over corn). Neither `tasks.md` nor `geoquizdataplan.md` currently
tracks livestock at all — this is a new entry, not a gap in an existing one.
Add a sibling curated field (e.g. `top_livestock`) with one or two standout
livestock/poultry products per state where one is genuinely well known (e.g.
poultry in Delaware or Arkansas, dairy in Wisconsin) — hand-curated, same route
T-015 took for crops, not a live API. Leave it blank for states with no
standout, per `CLAUDE.md`'s "prefer a blank field to a guessed one."
**Done when:** a decision is recorded on the field name and where it's exposed
(`openapi.yaml`, the `agriculture` topic's templates), and it's populated for
the states where a standout genuinely exists.

### T-069 — `highest_point_m` carries feet for some states · S · todo
**Depends on:** —
**New 2026-09-18, found while surveying T-016.** `P2044` carries a unit that
`wdt:` drops, so an elevation stated in feet arrives as a plausible-looking
number under a metres key — the same trap `normalize.ts:103-114` already flags
for `area_km2` on `P2046`, and nothing flags here. At least five of the 50
committed files are wrong by a factor of 3.28: **AZ `12622`** (Humphreys Peak is
3,852 m), **OR `11237`** (Mount Hood, 3,429 m), **NE `5429`** (Panorama Point,
1,653 m), **KS `4039`** (Mount Sunflower, 1,232 m), **IA `1670`** (Hawkeye Point,
509 m). Two of those are also *plausible* metre values for a mountain, so a
magnitude sanity check alone will not catch the low ones — Iowa's 1,670 "m" would
make a cornfield taller than Mount Mitchell and reads as fine. This poisons every
superlative question that ranks states by height (§1.8), which is the whole point
of the field. Check all 50, not just the five; the fix has to survive an offline
rebuild, so it belongs in the query or in `normalize.ts`, not in hand-edited JSON.
Alaska's `6190` is genuinely metres — leave it.
**Done when:** every state's `highest_point_m` is in metres and cross-checked by
hand against the plan's §1.9 instruction to cross-check peaks, and a value in the
wrong unit warns instead of shipping.
**It will move five tracked files' bytes, so it hits the pinned-digest wall —
read T-070 first.** This is the first queued task that *changes* a value rather
than adding a key, which none of the existing neutralisations handle.

### T-070 — Re-pin the bank's digest guards, and let the offline harness return stdout · S · todo
**Depends on:** — (blocks nothing, but **T-067, T-068 and T-069 all hit it**)
**New 2026-09-18, from T-016's reviewer (PR #47).** Two small things in
`question-bank/`'s test suite, both consequences of the same design, and both
cheaper to settle once than to work around a fifth time.

**(a) The pinned-digest guards now carry one exception per task, and there are
four.** `landmarks-verify.test.ts` (T-013 criterion 9), `climate-kid-verify.test.ts`
(T-014 criterion 15) and `top-crops-verify.test.ts` (T-015 criterion 13) each
assert "nothing but this task's field moved in the bank" by hashing every tracked
file against a digest pinned at an older branch point. Every later task that
touches the bank must neutralise its own change before hashing, and the list only
grows: `climate_kid` is deleted, `top_crops` is set back to the literal `[]` (the
key predates those digests, so deleting it is the wrong fix — T-015's worker
checked that empirically against AK), Colorado's `climate_kid` is exempted from
the deletion, and T-016 added a fourth — Alaska's `highest_point` stripped for
`us-state-ak.json` alone, in all three guards, because the field predated every
pin for the other 49 states. **Each exception covers a little less, and the shape
is not the same each time**: T-016's had to be asymmetric, and T-015's had to be a
reset rather than a delete. T-016's tester proved the asymmetry is load-bearing by
mutation (a symmetric strip turns the guard red), which is the same thing as
saying it is easy to get wrong.
**Either** re-pin all three baselines against the current default branch and
delete the accumulated exceptions — the guards then mean "nothing has moved since
today", which is what each new task actually wants — **or** write down why the
historical pins are worth more than what they now cost, and give the neutralisation
one shared helper instead of three hand-copied conditionals. Re-pinning looks
right, but it discards the "unchanged since T-013" property those digests exist to
hold, so it is a deliberate call rather than a tidy-up. Whichever way it goes, say
it in `engineering-decisions.md` so the next field task inherits an answer instead
of the question.
**(b) `rebuildOffline()` returns written files, not stdout**, so no test can see
what `build.ts`'s `report()` actually prints — and `top-crops-verify.test.ts:438`
and `climate-kid-verify.test.ts:828` (rightly) forbid a test from spawning
`build.ts` itself. T-016's criterion 8 wanted "the report prints the warning" and
had to settle for grepping `build.ts`'s source for the absence of a field filter,
with the real behaviour checked by hand and recorded in the PR. Returning captured
stdout from the existing harness would make that a real test and costs a few lines.
**(c) is closed — T-072 did it (PR #55).** Both criterion-19 diff guards in
`climate-kid.test.ts` and `climate-kid-verify.test.ts`, and the expired
`ALLOWED_OUTSIDE_QUESTION_BANK` allowlist in each, are **deleted**, with the
reasoning in `engineering-decisions.md` **E-11**. Nothing here is left to do, and
E-11 is the precedent for how (a) should be written up whichever way it goes. Two
related things stayed out of T-072's scope and belong to this entry:
- **`highest-point-verify.test.ts:582-584`** (`if (base === null) return;`) —
  another silent-`else` git path in this package. Not a pinned commit, so it is
  not red anywhere, but it is a check that turns itself off on a shallow clone.
- **`climate-kid.test.ts:538`'s `expect(status === 0 || status === 1).toBe(true)`**
  in `"sample-data/us-state-co.json was not touched by this task"` — takes no
  revision, so it needs no history and does not have T-072's defect, but the
  disjunction would still swallow a broken `git`.
**Amended 2026-09-22 by T-073's reviewer (PR #56).** T-073 deleted the fourth and
last red-on-`main` instance and recorded it as `engineering-decisions.md` **E-12**,
so **those two bullets are the whole of what remains of this family** — neither is
red anywhere, both only turn themselves off. Two things landed that make them
cheaper to close than they were:
- **`frontend/src/git-baseline-guard.criteria.test.ts` is the shape to extend, not
  to re-invent.** It already asserts repo-wide that no test hands
  `engineering-decisions.md` to `git`, and asserts *within `frontend/src/`* that
  every `git` call uses a working-tree subcommand and throws on a non-zero exit.
  Widening that second scan to `question-bank/src/` is most of what this half
  needs; its `codeOf()` stripper and 400-character throw heuristic come with it,
  including the documented false-positive mode at `:207-212`.
- **E-11 and E-12 are now two worked examples of the write-up**, so (a)'s decision
  has a house style to follow whichever way it goes.
**Done when:** the three digest guards no longer need a per-task exception (or the
decision to keep them is written down in `engineering-decisions.md`), no test in
`question-bank/src/` passes down a path taken because a spawned `git` failed, and
a test can assert on the build report's printed warnings without spawning
`build.ts`.

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
**Depends on:** T-021
`sibling_capitals_same_region` and neighbours-first for map questions. Ohio /
Indiana / Illinois / Iowa is a real question; Ohio / Hawaii / Texas / Alaska is
free (plan §1.2). **T-017 is done (PR #49)** — "same region" is now one
documented 13-value vocabulary, used by both the pipeline and the served bank.

**Four of the thirteen regions are too small to draw distractors from, and this
task has to have an answer for them** (found by T-017's reviewer, PR #49). The
settled assignment leaves `Great Basin` = Nevada, `Pacific` = Hawaii and
`Pacific West` = California with **one state each**, and `Southwest` = Arizona +
New Mexico with two. `sibling_capitals_same_region` cannot produce a single
same-region distractor for HI, CA or NV, nor three for AZ/NM. This follows from
`content.json`'s frozen anchor values and the approved product decision, so it
is not a defect to fix in the data — but the strategy needs a named fallback
(nearest region, neighbouring states, or skip the entity for that template) and
a test that the fallback fires for exactly those states rather than silently
emitting a question with two choices.
**Three same-value guards are now waiting on this, not just same-region:**
`wildlife` needs a same-animal guard (20 of 50 states share an animal, T-012),
`climate` needs a same-climate one (41 of 50 states fall into ten
substantively-interchangeable groups, T-014/PR #44 — listed under T-026), and
`agriculture` needs a same-crop one (T-015/PR #46: nine states' whole crop list
is `corn, soybeans`; `apples` spans six states and `wheat` four — listed under
T-026). The first two are invisible to a string compare, which is what makes
them this task's problem rather than the curation tasks'. **`agriculture` is the
opposite case and worth separating:** its collisions *are* exact string matches,
deliberately, because crops genuinely repeat across states. A same-string check
catches them — what it cannot decide is that the right response is to gate the
reverse question direction rather than to reshuffle distractors.
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
| `wildlife` | "Which animal is <state>'s state animal?" | T-012 — **landed, PR #42** |
| `landmark` | "Where is <landmark>?" | T-013 — **landed, PR #43** |
| `climate` | "Which state is <climate phrase>?" | T-014 — **landed, PR #44** |
| `agriculture` | "What grows most in <state>?" | T-015 — **landed, PR #46** |
| `size` / `superlative` | "Which is bigger?" | rank fields — already on entities |

`size` and `superlative` are the cheapest by a wide margin: the ranks are already
computed and populated, so they need a template and nothing else (plan §1.8).
Start there and the app gains a third topic without waiting on any curation.

**`wildlife`'s data exists now (T-012, PR #42) — and it is ambiguous backwards.**
All 50 states carry `state_animal`, but only 35 distinct values: ten states share
"White-tailed deer", three "American black bear", three "American bison", two
"Moose", two "Beaver". So `<state>` → animal is a sound question and animal →
`<state>` is not, for 20 of the 50.

**Five more pairs collide only to a reader, not to a string compare**, which is
the part a duplicate check will miss: "Black bear" (LA) vs "American black bear"
(AL/NM/WV); "Grizzly bear" (MT) vs "California grizzly bear" (CA); "Gray
squirrel" (KY) vs "Eastern gray squirrel" (NC); "Horse" (NJ) vs "Morgan horse"
(VT); "Desert bighorn sheep" (NV) vs "Rocky Mountain bighorn sheep" (CO). Two of
those offered as four options is a question with two right answers to a
nine-year-old. Whoever writes the distractor rule (T-022) needs a same-animal
guard, not a same-string one.

**`landmark`'s data exists now (T-013, PR #43) — for 44 states, not 50.** DE, IA,
KS, MS, OK and RI are deliberately blank (no defensible kid-recognisable,
non-battle-site pick), so this template emits nothing for them and the topic
covers 44 of 50. All 44 values are distinct and none contains another (T-013
criterion 5), so unlike `wildlife` the landmark → state direction is sound as a
*string* compare. **Four pairs still collide to a reader**, which is the same
class of problem T-012 left above and the one a duplicate check misses:

- **NH "Mount Washington"** names a different state outright; WA's own landmark is
  "Space Needle", so both can appear as options in one question.
- **LA "St. Louis Cathedral"** points a child at Missouri, whose landmark
  ("Gateway Arch") is itself in St. Louis.
- **AL "U.S. Space & Rocket Center"** and **TX "Space Center Houston"** are two
  NASA museums a nine-year-old will not tell apart.
- **NE "Chimney Rock"** shares its name with well-known formations in North
  Carolina and Colorado, neither of which is in the bank — the collision is with
  what the child knows, not with another row.

Never offer two of a pair as options in the same question, and prefer `<state>` →
landmark phrasing where the pair is unavoidable.

**`climate`'s data exists now — 50 of 50 (T-014, PR #44) — and the ambiguity is
already mapped for you.** Every state carries a `climate_kid` phrase, all 50
strings distinct and none a substring of another, none naming a state (T-014
criteria 10–11). That makes the strings safe; it does **not** make the question
safe. T-014's criterion 17 required the worker to group the states whose phrases
describe **substantively the same climate**, and it found **ten groups covering
41 of the 50 states** — Great Plains (IA, NE, KS, SD, ND), Northern Rockies (MT,
WY, ID), Interior Southwest (AZ, NM, UT, NV), Pacific Northwest (OR, WA),
Southern New England (CT, MA, RI), Northern New England (NH, VT, ME),
Mid-Atlantic (NJ, PA, MD, DE), Great Lakes / Upper Midwest (OH, IN, IL, MI, WI,
MN), Deep South (AL, GA, MS, SC, LA), Upland South (TN, AR, KY, NC, VA, WV). The
nine left ungrouped are AK, CA, CO, FL, HI, MO, NY, OK, TX. **"Which state is
`<phrase>`?" has more than one true answer inside every one of those groups**, so
this topic needs a same-climate guard exactly like `wildlife`'s same-animal one
— it cannot rely on a string compare. The groups are recorded in PR #44 (the
brief is swept); read them there before writing the template. The reverse
direction, "What kind of climate does X have?" (plan line 90), is unambiguous and
is the cheaper place to start.

**`agriculture`'s data exists now — 50 of 50 (T-015, PR #46) — and it is the
most ambiguous backwards of the four.** Every state carries one to three plant
crops (eight states one, 36 two, six three; 98 strings). Unlike `landmark`, the
strings are **deliberately** shared: crops repeat across states because that is
what is true. So **"What grows in `<state>`?" is sound and "Which state grows
`<crop>`?" is not**, for most of the bank — the reverse direction needs a
same-crop guard before it can be asked at all, not just a distractor rule:

- **`corn` and `soybeans` are the *entire* list for nine states** — IL, IN, IA,
  MD, MN, NE, OH, SD, and MO with the pair reordered — and appear again in AR,
  KY, MS, TN and WI. Asking which state grows corn has a dozen right answers,
  and those nine states are mutually indistinguishable on this topic.
- **`apples` is six states** (NH, NY, PA, VT, WA, **WV**) and **`wheat` four**
  (KS, MT, ND, **OK**). WV's and OK's lists are *only* that crop, so those two
  states cannot be the answer to a reverse question at all.
- **Safe in both directions**, because the crop is unique to one state: AK
  `peonies`, DE `lima beans`, HI `pineapple`/`macadamia nuts`, LA `sugarcane`,
  NM `chile peppers`, OR `hazelnuts`, PA `mushrooms`, WY `sugar beets`. That is
  the set a reverse-direction template could safely draw from, and it is small.
- **Single-crop states were checked against each other** and are mutually
  distinct (T-015's worker; Alaska ships `peonies` rather than `potatoes`
  precisely to avoid colliding with Idaho). That check does **not** extend to
  multi-crop states, which is where the collisions above live.

Prefer `<state>` → crop phrasing, and treat "which state grows X" as gated on the
unique-crop list above.
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
**Smaller since T-065 (PR #57):** the frontend and question-bank count comments
are gone from the command block, and a guard stops them coming back.
**Also, found by T-005's reviewer (PR #26):** the "No network in tests, ever"
paragraph now ships a copy-pasteable block for reproducing CI's dead-proxy guard
locally, and it omits `uv sync` — on a cold checkout the reader's first `uv run
pytest` fails for a reason that has nothing to do with the guard. One line, and
it belongs here rather than in T-005 because T-047 already owns correcting this
file.
**Done when:** the section describes the real suite, the marker is gone, and the
dead-proxy reproduction block runs from a cold checkout.

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
