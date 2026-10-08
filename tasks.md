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
was waiting on it. Swept again 2026-09-29, after T-075 gave `frontend/` an
exact-pinned prettier and a CI Format step (PR #66): section A is empty, T-076
is new in F (the README layout prettier flattened), and T-044 gained the
`AGENTS.md` risk. Swept again 2026-10-06, after T-080 let the offline harness
return the build's stdout (PR #73): T-082 is smaller (only `--fixture` is
missing now), and T-083 is new (retire T-016's source-grep workaround)._

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
| **Formatting** | prettier pinned to one exact version in both `frontend/` and `question-bank/`, and CI runs `format:check` in both (T-071, E-16; T-075, E-17) |

Nothing in section A is queued: T-075 (PR #66) closed the last gap.

---

## B. Finish the US entity table

The pipeline works and has run live against all 50 states; the *data* is not
finished. Each of these is independent. Nothing here reaches the app until T-040
bridges the pipeline to the served bank — but the curation is the long pole, so
it is worth doing in parallel rather than after.

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
**Amended 2026-10-03 by T-068's reviewer (PR #69).** The same five comparisons
now exclude `top_livestock` as well as `top_crops`. That makes two fields the
sample is frozen without. `sample-data/README.md` is now further from true: it
says `build:sample` gives the "same output" and explains only the `top_crops`
gap. Criterion 14 froze it on purpose. Deleting the directory fixes both
problems. If this task is dropped instead, the README must be corrected.
**Skipped by the expander, 2026-09-22 — and its `Depends on: —` is wrong.** The
entry's own precondition is "kept until the committed bank is shown to work end
to end", and nothing serves the committed bank yet: **T-040** is the loader and
has not run, so the app still serves the hand-copied `content.json`. Deleting
`sample-data/` now would be acting before the condition this entry names, and
"dropped because it still earns its place" cannot be settled either while the
thing that would retire it is unbuilt. **Depends on: T-040.** T-065 was taken
instead.

### T-070 — Re-pin the bank's digest guards, or write down why not · M · todo — **waiting on Q1**
**Depends on:** a human answer to **Q1** below (blocks nothing, but every field task since T-068 has hit it, and the monthly refresh routine is gated on it)
**Split 2026-10-06 (Dkaattae, answering the T-070 expander's Q2, PR #73).** This
entry used to hold three pieces. **(b)** became **T-080** and the git leftover
**T-081**; both have landed (PRs #73, #74). What stays here is **(a)** alone, re-sized to M because
it edits four or five verify suites, and every one of those edits needs an
approved Test change request (D-14, D-15). **Plan to attend its tester step.**
**Q1, still open:** re-pin against the default branch and delete every
neutralisation, or keep the historical pins behind one shared helper and write
down the `top_crops` blind spot? Either way: must the guard survive a refresh
where only `sources.built_at` and the fixture moved? The expander's survey for
this half (more guards than the entry says: `highest-point-in-state-verify.test.ts`
pins digests too, at `:135`, `:148`, `:463`) is in PR #73's history, commit
`3cedfe8`. The next decision entry is `E-20`.
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
**(b) is done: T-080, PR #73** (split 2026-10-06).
**(c) and the git leftovers are done.** T-072 (PR #55, E-11) and T-073 (PR #56,
E-12) deleted the red-on-`main` git baselines. T-081 (PR #74) closed the last
fail-open `git` check, `climate-kid.test.ts:598`, and added
`question-bank/src/git-exit-guard.criteria.test.ts` as the standing guard for
`question-bank/src/`. Their history is in those PRs.
**Amended 2026-10-02 by T-063's reviewer (PR #68): (a) now gates the monthly
refresh routine.** `bun run refresh` (T-063) moves `sources.built_at` in all 50
bank files on every *changed* refresh, by design (E-6's reproducibility), so the
first refresh PR will be red on all four digest guards (`landmarks-verify`,
`climate-kid-verify`, `top-crops-verify`, `highest-point-verify`) unless (a) is
settled first. Whichever way (a) goes, the answer has to survive a bank where
only `built_at` and the fixture moved. Do this, and T-077, before the routine is
switched on.
**Amended 2026-10-03 by T-068's reviewer (PR #69): a fifth neutralisation, and
a blind spot worth knowing.** T-068 added `top_livestock` to all 50 files and,
as this entry asked, neutralised it rather than re-pinning. `top-crops-verify`
and `highest-point-verify` strip it textually
(`/^ {2}"top_livestock": \[[^\]]*\],\n/m`); `landmarks-verify` and
`climate-kid-verify` `delete` it. Nine more tests also gained the same
exclusion: the five sample comparisons (T-064) and three "no unexpected key"
allow-lists. That is 14 test edits for one new key. Whatever (a) decides
should also cover those allow-lists. **The blind spot:** three of the four guards reset
`top_crops` to `[]` before hashing, so none of them turns red on a `top_crops`
change. Only `highest-point-verify` and T-015's curated-source and rebuild tests
catch one. T-068's tester proved this by mutation. A re-pin removes the reset
and with it the blind spot. Keeping the pins means the blind spot has to be
written down.
**Amended 2026-10-04 by T-069's reviewer (PR #70): a sixth neutralisation, and
a new kind.** T-069 changed five *values*: `highest_point_m` in AZ, OR, NE, KS and
IA went from feet to metres. All four guards (`landmarks-verify`,
`climate-kid-verify`, `top-crops-verify`, `highest-point-verify`) now **put the old
feet values back** before hashing.
- **How it is written:** the same five-entry table
  (`T069_DEFAULT_BRANCH_HIGHEST_POINT_M`) is pasted into each of the four files.
  Two of them do a textual line rewrite; the other two set the parsed key.
- **Why it is a new kind:** every earlier exception stripped or reset a key
  that a task added. This is the first that restores a value a task
  *corrected*.
- **What it costs:** the guards now assert that those five files still carry
  wrong data underneath, and any later correction to the same field will need
  another table.
- **Ten pre-existing tests changed** (approved by Dkaattae, D-15). Their
  rebuild and refresh helpers also learned to read the second fixture,
  `us-states-elevation.sparql.json`.
- **Re-pinning would remove all of this at once.** The cost grows with every
  task that corrects a value rather than adding one.
**Amended 2026-10-06 by T-079's reviewer (PR #71): a seventh neutralisation,
the same kind as the sixth.** T-079 replaced `highest_point_m` in CT, OK and VA
with curated values (727.2, 1516.4, 1740.6; `engineering-decisions.md` E-19).
All four guards now also put back `748`, `1737` and `1825` for those files before
hashing, and the two textual guards widened their line regex from `\d+` to
`[\d.]+` to match a decimal. That is the second task in a row that restores a
*corrected* value, so the guards now assert eight files still carry wrong data
underneath. Eleven pre-existing tests changed (approved in an attended tester
session, D-15). A full build and every changed refresh now also print three
`highest_point_m` override warnings by design, which any stdout-counting test
under (b), now T-080, must expect.
**Done when:** the pinned-digest guards no longer need a per-task exception (or the
decision to keep them is written down in `engineering-decisions.md` as `E-20`).

### T-082 — Two refresh tests spawn `build.ts` past the guard that forbids it · S · doing
**Depends on:** —
**Found 2026-10-06 by T-080's expander.** `refresh.test.ts:194` and
`refresh-verify.test.ts:379` each call `Bun.spawnSync(["bun", BUILD…, "--offline",
"--fixture", …])` directly. The three guards that forbid a test from spawning
`build.ts` (`climate-kid.test.ts:738`, `climate-kid-verify.test.ts:979`,
`top-crops-verify.test.ts:473`) miss both. They look for the text `build.ts` at or
after the spawn call, and these two name the script through a constant defined
above it (`BUILD`, `BUILD_SCRIPT`). Both do use `DEAD_PROXY`, so nothing reaches
the network. But the rule is not what the guards say it is, and `rebuildOffline`
cannot take these two today because it accepts no `--fixture`. Every fix edits
existing tests, so each needs an approved Test change request.
**Smaller since T-080 (PR #73).** The harness now has
`rebuildOfflineWithStdout`, which returns `{ files, stdout }` from the same
isolated spawn. The only thing these two still need is a `--fixture` argument on
the harness, and T-083 wants the same thing.
**Done when:** either both go through the shared harness and the guards catch a
spawn through a constant, or the exception is written down where the guards are.

### T-083 — Retire T-016's source-grep stand-in now the build's stdout is readable · S · todo
**Depends on:** — (T-080 landed in PR #73; it made this possible)
**New 2026-10-06, from T-080's reviewer.** `highest-point-verify.test.ts:433-455`
("build.ts's report prints every warning it is given…") greps `build.ts`'s
source because no test could read the report's stdout. Its comments
(`:433-447`, `:478-482`) say the same. Both have been untrue since
`rebuildOfflineWithStdout` landed. The behavioural half T-016 checked by hand
dropped `capital`/`highestPoint` from a *derived* fixture, so a faithful
replacement needs the `--fixture` argument T-082 also needs. Do the two
together, or settle for the committed fixtures' three `highest_point_m` lines,
which show a field printing but not "no field is filtered". Either way this
edits an existing test, so it needs an approved Test change request (D-14, D-15).
Second, smaller piece, which T-080 kept out of scope: `build.ts --help` says
`--quiet` means "Only print the final summary" (`:110`), but `:135` makes it
print nothing. Make the two agree, one way or the other.
**Done when:** no comment or test in `question-bank/src/` says the build report
cannot be read, T-016 criterion 8 is asserted on real stdout, and `--quiet`
does what `--help` says.

### T-077 — A label that comes back as a bare QID must warn, not ship · S · todo
**Depends on:** — (T-063 landed in PR #68; it surfaced this). **Gates switching
on the monthly refresh routine**, alongside T-070 (a).
**New 2026-10-02, from T-063's worker.** The first by-hand live run of
`bun run refresh` (into a scratch copy, nothing committed) reported
`us-state-ak capital: "Juneau" → "Q29445"`. WDQS's label service falls back to
the bare QID when an item has no English label, and `normalize.ts` takes
`capitalLabel` as-is — so a monthly refresh would have offered a child
"Q29445" as Alaska's capital, caught only if the PR reviewer reads the summary.
The same fallback can hit any `*Label` binding (`stateLabel`, `highestPoint`).
**Done when:** a label matching `^Q\d+$` is treated as missing for that field
(and warns, `CLAUDE.md` "Prefer a blank field to a guessed one"), with an offline
test through `parseUsStates`/`normalizeUsStates`; check whether Juneau's English
label is really gone on Wikidata or the query reads the wrong item.


### T-078 — Point the other refresh routes at `bun run refresh` · S · todo
**Depends on:** —
**New 2026-10-02, from T-063's reviewer (PR #68).** T-063 left two older routes
saying the old thing, both deliberately out of its scope:
- **`build.ts`'s live fun-fact pass still drafts for every titled entity** (all
  50, every one already curated). T-063 added `draftMissingFunFacts` in
  `src/review-file.ts` and used it only in `refresh.ts`, because its brief kept
  `bun run build`'s behaviour fixed. Switching `build.ts`'s loop to it removes
  the duplicate loop and the 50 redundant drafts.
- **`src/fixtures/us-states.sparql.json`'s `_fixture.regenerate_with`** still
  says "bun run build … then save the raw SPARQL JSON". A refresh preserves that
  key verbatim (T-063 criterion 6), so it will stay wrong until edited by hand.
  Editing it does not change any built byte, so `committed-bank.test.ts` stays
  green; check the other fixture readers under `src/*verify*.test.ts` too.
**Done when:** `bun run build`'s live pass requests drafts only for entities with
empty `fun_facts` (offline test through `SummaryTransport`), and
`regenerate_with` names `bun run refresh`.

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
| `agriculture` (animals) | "Which farm animal is <state> known for?" | T-068 — **landed, PR #69** |
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

**Farm animals exist now too, for 24 of 50 states (T-068, PR #69, E-18).**
`top_livestock` is a separate field from `top_crops`, so a template can ask
about animals without making "what grows" wrong. There are only five distinct
values: `cattle` (9 states, WY included), `chickens` (6), `dairy cows` (6),
`pigs` (IA, NC) and `turkeys` (MN, NC), plus WY's `sheep`. The 26 blank states
emit nothing. **The reverse direction is unsafe for every value except `sheep`**,
so use `<state>` → animal phrasing only, and pick distractors from values the
state does *not* carry.
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
**Amended 2026-10-03 by T-068's reviewer (PR #69).** `Entity.topLivestock` is
now in `openapi.yaml` and on `backend/app/models.py`'s `Entity`
(`engineering-decisions.md` E-18), so the loader has a slot to fill. It is 24 of
50 states, and `[]` is a real value for the rest, not a gap. One wording slip is
owed while you are in that schema: `openapi.yaml`'s `topLivestock.description`
says "Empty where no state has an honest standout". It should say "where the
state has no honest standout".
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

Flipping the default changes `openapi.yaml` too, which since E-14 (amended by
P-8) is just a file to update to match the backend, not a contract to defend.
The decision here is the product one. An integration test asserts the current
behaviour on purpose, and it is the test to update when this is decided.
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

### T-076 — `frontend/README.md`'s diagram and interfaces lost their layout to prettier · S · todo
**Depends on:** —
**New 2026-09-29, from T-075's reviewer (PR #66).** `frontend/README.md` is the
design brief the app is built to. Its TypeScript interfaces, formula, states list
and the "9. Screens" diagram are not in code fences, so T-075's formatting commit
(`6d1b5df`) stripped their indentation and scrambled the diagram's columns in
source. The rendered page was already flat; the source is what got worse.
**Done when:** each of those blocks is fenced with its pre-`6d1b5df` content
(from `6d1b5df^`), and `bun run format:check` in `frontend/` exits 0.

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
Since T-075 (PR #66), `frontend/AGENTS.md` is under CI's frontend Format step, so
a reconnected Lovable that rewrites it unformatted turns CI red. Settle it here:
reformat after each sync, or ignore the file with a line in E-17.
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
