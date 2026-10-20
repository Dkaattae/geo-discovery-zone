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
missing now), and T-083 is new (retire T-016's source-grep workaround). Swept
again 2026-10-12, after T-083 retired that workaround and made `--quiet` keep
the summary (PR #76): T-070 gained a stale describe name to fix. Swept again
2026-10-13, after T-078 pointed `bun run build`'s live pass and the fixture's
`regenerate_with` at `bun run refresh`'s route (PR #78): T-070 now also owns the
fixture byte pins a refresh turns red, and T-084 points there. Swept again
2026-10-19, after T-040 made the 50 pipeline states and 100 generated
questions the served bank (PR #88): T-040 deleted; T-050 and T-056 rewritten to
what is left of them; T-026, T-051, T-064, T-070 and T-085 updated; T-087
new. Swept again 2026-10-20, after T-064 deleted `question-bank/sample-data/`
and `build:sample` (PR #89): T-064 deleted; T-070 lost the sample from its
guard list and gained two stale phrases to fix; T-076 gained a one-off README
rewrite to check._

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
| **States** | **50**, from the pipeline bank (T-040) | 50 |
| **Questions** | **100**, generated: two per state (T-040) | generated from templates × entities (§1.2) |
| **Question formats** | **2** — `map_identify`, `multiple_choice` | 9 — plus `map_click`, `image`, `ab_compare`, `pin_pick`, `pin_drop`, `drag_order`, `click_profile` |
| **Topics** | **2** — location, capital | 10 — plus climate, agriculture, wildlife, landmark, size, physical, superlative, elevation |
| **Map** | US states, `us-atlas`, mastered states fill in | + shaded relief (§2.6), physical features (§2.4) |
| **Backend** | all 29 contract operations, SQLite or Postgres | — |

So: a child sees a highlighted state and picks its name, or picks a capital
city from four choices, over 50 states. A third generated format, `map_click`,
is in the committed question file but not served until T-051. **The Setup screen's three buttons —
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
finished. Each of these is independent. Since T-040 (PR #88) the bank is what the app
serves, so a curated field reaches a child once a template asks about it
(T-026) and both committed files are regenerated (T-087).

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
`3cedfe8`. `E-20` went to T-021 (PR #80); take the next unused number,
`E-21` unless something else lands first.
**Since T-025 (PR #85): a fifth guard, and a wider one.**
`hand-check-levels-verify.test.ts` pins these at `aa88101`: `TEMPLATES`
(criterion 11), every file under `question-bank/data/` and
`src/fixtures/` (T-064 dropped `sample-data/` from it, PR #89) plus `backend/app/data/content.json` (14), every
`package.json`/lockfile/`pyproject.toml` in the repo (15), and every
question-bank test file (17). Criteria 1 and 13 (c) also assume exactly the
three templates, each with its own `concept_load` entry. Unlike the field
guards, these are not limited to the bank. Any dependency add or any edit to
an older test turns them red too. Whatever Q1 decides should cover this file.
**Since T-086 (PR #86): a sixth guard, on the decisions log itself.**
`seed-level-loose-ends-verify.test.ts` criterion 12 pins
`engineering-decisions.md` outside E-22 (sha256) and the `## E-n` heading
count (23) at `41811f9`; criterion 10 pins the 150 seeded levels and
`LEVEL_SEED_WEIGHTS`. The first task that adds or edits any other `E-n` entry,
this one included, turns it red. Whatever Q1 decides should cover it (P-17).
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
only `built_at` and the fixture moved. Do this, and T-084 (T-077 landed in PR #77
and only blanks a bare-QID label), before the routine is switched on.
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
**Amended 2026-10-12 by T-083's reviewer (PR #76): one more stale name in
the same file.** `highest-point-verify.test.ts`'s describe "T-016 tester,
criterion 9 — the full fixture build warns about nothing at all" is untrue: the
count has been 3 since T-079, and the tests and comments under it say so.
T-083's criteria covered comments only, so it left the name alone. This task
already edits that file under an attended Test change request, so add a row to
rename it there instead of opening a task for one string.
**Amended 2026-10-13 by T-078's reviewer (PR #78): the fixture pins go red on
a refresh too.** `highest-point-in-state-verify.test.ts`'s describe "T-079
tester, criterion 19 — both SPARQL fixtures are byte-identical to 323254c"
hashes both `us-states.sparql.json` and `us-states-elevation.sparql.json` whole.
T-078 had to re-pin the main one (approved row, Dkaattae) just to change
`regenerate_with`. A changed `bun run refresh` re-records both files, so both
entries go red on the first refresh, and on T-084's re-record. Whatever (a)
decides about surviving a refresh has to cover these two pins as well as the
four bank guards.
**Amended 2026-10-19 by T-040's reviewer (PR #88): two of the guards were
loosened in passing.** Under approved rows, `hand-check-levels-verify.test.ts`
criterion 14 now excludes `question-bank/data/questions/` and checks the old
`content.json` at `archive/hand-written-bank/content.json`; criterion 16 allows
any gap-free `E-1..E-max`; criterion 17's digest was re-pinned. In
`seed-level-loose-ends-verify.test.ts` criterion 12 now stops at E-23, so a new
`E-n` no longer turns it red. An edit to E-1..E-23 still does. Whatever Q1
decides starts from these.
**Amended 2026-10-20 by T-064's reviewer (PR #89): the sample is gone, and
two stale phrases are left in `highest-point-verify.test.ts`.** T-064 deleted
`sample-data/`, so the five sample comparisons named in the 2026-10-03
amendment above no longer exist, and `DEFAULT_BRANCH_DIGESTS` lost its sample
key (approved rows, Dkaattae). Two phrases its rows did not cover are now
untrue: the header comment's "the other 51 paths must digest to it" (50 now),
and the describe "T-016 tester, criterion 6 — the other 49 files, index.json
and the sample are untouched". Add them to this task's Test change request
alongside the criterion 9 rename above. T-064 also re-pinned
`question-bank/package.json` in `hand-check-levels-verify.test.ts` criterion 15
and `highest-point-in-state-verify.test.ts` T-079 criterion 20, and re-pinned
the criterion 17 aggregate (P-17).
**Done when:** the pinned-digest guards no longer need a per-task exception (or the
decision to keep them is written down in `engineering-decisions.md` as the next
unused `E-n`, `E-25` at the time of writing).

### T-084 — Read Wikidata's `mul` labels, so Juneau comes back as "Juneau" · S · todo
**Depends on:** — (T-077's guard landed in PR #77, so this is a fix, not a
safety net). Touches the query, so it moves the fixture and every digest guard —
sequence it with T-070 (a). **Gates switching on the monthly refresh routine**
alongside T-070 (a): since T-077, a live refresh blanks Alaska's capital, with a
warning, instead of shipping `Q29445`.
**Since T-025 (PR #85):** a data or fixture change also turns
`hand-check-levels-verify.test.ts` criterion 14 red, and criterion 2 too if a
choice label moves (T-070).
**New 2026-10-13, from T-077's worker.** The query reads the right item: Alaska's
P36 points at `Q29445`, which is Juneau. It has no `en` label any more, only a
`mul` ("default for all languages") label `Juneau`, with labels in about 20 other
languages beside it. Wikidata added `mul` and editors dropped the matching `en`
labels. Checked live against `query.wikidata.org` on 2026-10-13:
`SERVICE wikibase:label { … wikibase:language "en" }` returns `Q29445`, and
`"en,mul"` returns `Juneau`. The explicit `rdfs:label … FILTER(LANG(...) = "en")`
reads for `highestPoint` and `borderNames` in `src/queries/us-states.ts` have the
same blind spot. There a `mul`-only item gives an absent binding, not a QID.
**Done when:** the label service asks for `"en,mul"`, the explicit label reads
accept `mul` as a fallback after `en`, the fixture is re-recorded, and Alaska's
capital is `Juneau` from a live refresh.
**Skipped by the expander, 2026-10-13. Its `Depends on: —` is incomplete.**
Re-recording the fixture is a changed refresh. That moves `sources.built_at` in
all 50 bank files, and the four digest guards go red until T-070 (a) is
settled, which waits on Q1. So this Done-when cannot land before T-070 (a).
**Proposed split, for a human to decide:** the query half (`"en,mul"`, plus a
`mul` fallback for `highestPoint` and `borderNames`) is offline-checkable today
and moves no committed byte. The fixture already records `Juneau`
(`src/fixtures/us-states.sparql.json:100`), and `fixture-transport.ts` matches
by query identity. The re-record and the live check would move to the first
refresh after T-070 (a). T-078 was taken instead.
**Since T-078 (PR #78):** a re-record also turns T-079's criterion-19 fixture
pins red (`highest-point-in-state-verify.test.ts`). See T-070's 2026-10-13
amendment; the re-record needs a Test change request row for each.
**Skipped again by the expander, 2026-10-13, for T-020.** Nothing has changed
since the note above: Q1 is still open, and nobody has decided the proposed
split.
**Skipped again, 2026-10-15, for T-021.** Same reason.
**Skipped again, 2026-10-15, for T-023.** Same reason.
**Skipped again, 2026-10-15, for T-024.** Same reason.
**Skipped again, 2026-10-15, for T-025.** Same reason.
**Skipped again, 2026-10-16, for T-086.** Same reason.

---

## C. Question generation

Since T-040 (PR #88) every served question is generated, as the plan's central
claim asks (§1.2), and generation is what turns curated fields
(§B) into the topics the app does not have yet.

### T-085 — Level inputs the weights cannot reach: drawn apart, and capital is the largest city · M · todo — **waiting on a person**
**Depends on:** a person's choice between the options below
**New 2026-10-16, from T-025's reviewer (PR #85).** T-025's hand-check
(`engineering-decisions.md` E-22, "T-025 hand-check of 30 questions") left six
of 30 rows `too hard`, and no weight can fix them, because the formula sees
only rank and near-distractor count:
- **Map, both templates: HI and AK.** A state drawn apart from the mainland, or
  in an inset, is easy to pick out. Its ranks still put it with RI and VT.
- **Capital: Denver and Honolulu.** Each is its state's largest city, so it is
  likelier to be a name a child has met.
**Options (a person picks one, because a familiarity list needs approval under
the content rule):**
- **A fact field per input**, such as "drawn apart from the mainland" (AK, HI)
  or "capital is the largest city". These are checkable facts, not guesses
  about fame. A new term in the formula, a new key in `LEVEL_SEED_WEIGHTS`, and
  a new E-22 bullet.
- **A person-approved `familiarity_bonus` list.** The term and the key exist
  already.
- **Accept it**, and record in E-22 that seeded levels are this coarse until
  Elo (plan §1.4).
**Check while there:** Providence is Rhode Island's largest city too, but T-025
marked its row `about right`, at the bank's maximum of 10. A "largest city"
input would lower it with Denver and Honolulu. Decide whether that is wanted.
**Test cost:** a new `LEVEL_SEED_WEIGHTS` key, or a changed level, turns
`hand-check-levels-verify.test.ts` red (criteria 4, 7, 8, 10, 10a), and
probably `seed-level-verify.test.ts` criterion 20. Plan to attend the tester
step (D-14, D-15).
**Since T-086 (PR #86):** `seed-level-loose-ends-verify.test.ts` turns red
too: criterion 10 pins the 150 levels (sha) and `LEVEL_SEED_WEIGHTS` at
`41811f9`, and criterion 12 pins `engineering-decisions.md` outside E-22 up to
E-23. Since T-040 (PR #88) a new `E-n` after E-23 no longer breaks it, but an
edit to E-1..E-21 or E-23 does. Its criteria 1-8
read E-22 prose: keep the "What the module exports" bullet, the band
paragraph's `3.5 - 2 = 1.5`, and a `**Revisit when**` that names T-085 and the
other three triggers, or list those rows in the Test change request.
`levelFor` and `nearDistractorCount` are no longer exported (E-22); edit
`levelFor` in place.
**Done when:** the chosen option has landed and E-22 records it, or E-22 says
why the coarseness is accepted.

### T-026 — Templates for the topics the app has never shown · L · doing — **awaiting approval**
**Depends on:** T-021, and the curation task for whichever topic
**Expanded 2026-10-20** (`tasks/T-026-biggest-state-superlative.md`, PR #91).
Dkaattae answered Q1 (a), next-ranked on total area, and Q2 No, one task for
every topic. The brief now covers all six templates and lists seven content
calls (C1–C7) that approving it ratifies. Re-sized M → L.
**Since T-025 (PR #85):** a new template turns `hand-check-levels-verify.test.ts`
criteria 1, 11 and 13 (c) red, because they assume exactly today's three
templates, each with its own `concept_load` entry. It also needs its own
`LEVEL_SEED_WEIGHTS.concept_load` value (E-22). Plan to attend the tester step (T-070).
**Since T-086 (PR #86):** a new template also turns
`seed-level-loose-ends-verify.test.ts` criterion 10 red (it pins exactly 150
seeded levels and `LEVEL_SEED_WEIGHTS`). Since T-040 (PR #88) a new `E-n`
entry no longer turns criterion 12 red.
**Since T-040 (PR #88): getting a question to the app is two commands, and the
bank has a size budget.** `cd question-bank && bun run ./src/write-questions.ts`
rewrites `data/questions/us-states.json`, then `make -C backend content` rewrites
`backend/app/data/content.json`; each has a drift test, so a new template that
skips either is red. The loader serves a question only if its format is in
`SERVED_FORMATS` (`backend/app/content_build.py`), and a new topic also needs a
Setup button. `question-bank/data/` is about 148 KB against
`committed-bank.test.ts`'s 200 KB cap, and each new question adds about 580
bytes, so one 50-question template fits and two may not. Plan to compact the
file or raise the cap with an `E-n`.
**New 2026-08-24.** `openapi.yaml` names ten topics; the app ships two. Each new
topic is one template plus the curated field behind it, and none needs new
infrastructure once T-021 lands:
**Since T-022 (PR #82):** the same-animal, same-climate and same-crop guards
described below are **this task's**, landing with the template each one guards.
`buildChoices` (`question-bank/src/distractors.ts`, E-21) guarantees only that
no two choices share the same text (trimmed, lower-cased).
**Since T-020 (PR #79):** each new template is an entry in `TEMPLATES` and must
pass `validateTemplate`. A new distractor rule is a new name in
`DISTRACTOR_STRATEGIES` plus a case in `tierOf` in `distractors.ts` (T-022).
**Since T-021 (PR #80):** `generate()` fills `{token}`s verbatim and does not
guard against a value that itself contains `{` or `}`; no current field has
one. A new template that puts a free-text field (a landmark name, a climate
phrase) into its prompt should add a check that such a pair is skipped and
reported rather than emitted with a brace in it. Array- and number-valued
answers are reported as `notText` today; this task decides how they become text.
**Since T-024 (PR #84):** a template's topic is not a field on the record. It
is an entry in `TEMPLATE_TOPICS` (`question-bank/src/templates.ts`, E-23), keyed
by template id. A new template with no entry makes `tagQuestions` throw, and a
test fails on any `TEMPLATES` entry without one, so add both together. `TOPICS`
is the backend's ten values, cross-checked against `backend/app/models.py`.
**Carried from T-024's Out of scope:** `generate.ts` still silently adds
`geometry_id` to a `map_identify` template's required fields, and `name` to one
whose `answer_field` is `geometry_id`. T-024 put the format cross-check in a
test, not in `validateTemplate`, so the rule stayed in the generator. When this
task adds templates, move it into `validateTemplate`, so a template that omits
those fields is refused rather than quietly patched.

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
nine-year-old. The `wildlife` template needs a same-animal guard, not a
same-string one: T-022 (PR #82) shipped only the same-string one.

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
**Skipped by the expander, 2026-10-16, for T-040**, which this Done-when needed
to load a generated question. T-040 landed in PR #88, so that dependency is met.

---

## D. The bank the app serves

T-040 (PR #88) bridged the pipeline to the app: `backend/app/data/content.json`
is generated from `question-bank/data/` and the 50 states are served
(`engineering-decisions.md` E-24). What is left here is making that bank behave
well at its new size, and the third format.

### T-056 — The map cannot fill in on a child's first day · M · todo
**Depends on:** a third and fourth question per state (T-051 serves a third,
T-026 adds more), or a design decision below
**New 2026-08-24, found by the browser suite. Rewritten 2026-10-19 by T-040's
reviewer (PR #88)** with the 50-state numbers. "The map is the progress bar" is
one of the four things that shape every decision in this repo. Today the
progress bar **cannot move on day one**, however well a child does.

The arithmetic:

- Mastery moves **+0.25** per right answer and a state fills in above **0.7** —
  so a state needs **four** right answers about it.
- The served bank has **exactly two questions per state** (100 over 50, T-040).
- A session never repeats a question.

So the most any state can reach in one sitting is **0.5**, and a perfect first
session colours in nothing. Mastery is stored on the profile, so a second sitting
can finish a state: T-040's tester measured two sittings of 50 right answers
filling **15–18 of 50**, and two of 26 filling 0–3.

It dissolves once there are four or more served questions per state. T-051's
`map_click` makes three, so that alone is not enough. If the bank is going to
stay at two or three per state for a while, the alternative is to revisit the
0.7 threshold or show partial mastery on the map, which is a design decision
rather than more data. `e2e/tests/progress.spec.ts` has a test that documents
the current behaviour and fails when the premise stops being true.
**Done when:** a good first session visibly colours something in.

### T-050 — Check selection and levels at 50 states · M · todo
**Depends on:** —
**Rewritten 2026-10-19 by T-040's reviewer (PR #88).** This entry was "Grow the
served bank from 15 states to 50". T-040 did that: the app serves the 50
pipeline states, each with its reviewed fun fact, and 100 generated questions.
What is left is the pass this entry always said the size needed:

- **Level spread.** Seeded levels now run 3.5 to 10 over the served bank
  (E-22). Check that a child at each band gets a sensible share of it, and
  that the HI/AK/Denver/Honolulu rows T-085 owns do not dominate a band.
- **Review queue** at 100 questions rather than 26.
- **`store.candidate_questions`** selects in Python. It was documented as fine
  at 26 questions and the place to move filtering into SQL when it is not.
  Measure it at 100, and at T-026's size.

**Done when:** a session at any level draws sensibly from the whole set, or
this is dropped with the measurement that shows it already does.

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
**Corrected 2026-10-13 by T-020's expander.** The sentence above is only half
true:
- `backend/app/grading.py:39` puts `map_click` in `CHOICE_FORMATS`, so it is
  graded by `choiceIndex` against `choices`.
- `openapi.yaml`'s `AnswerRequest` has **no** geometry-id field.

So a tap has to become a `choiceIndex` on the client, or the payload gains a
field. T-020's `tpl-click-the-map` sets `answer_field: "geometry_id"`.
**Since T-021 (PR #80), `engineering-decisions.md` E-20:** a generated
`map_click` question's `answer` is the state's `name`, with the code carried
separately as `answerGeometryId`. E-20 expects T-022 to give `choices` a
parallel list of `geometry_id`s, so the client maps a tap on region `X` to the
choice whose code is `X` and sends its `choiceIndex`. The backend grading stays
as it is.
**Since T-022 (PR #82):** the parallel list is `choiceGeometryIds`
(`engineering-decisions.md` E-21), set on `map_click` questions only, with
`choiceGeometryIds[correctIndex] === answerGeometryId`. It is not in
`openapi.yaml`. Whichever of T-040 and this task first serves a generated
`map_click` question adds it to the contract and the backend model.
**Reordered 2026-10-16 by the repo owner (T-040 Q3): this task comes before
`map_click` is served.** T-040 writes the 50 generated `map_click` questions to
its committed question file but withholds them from the served bank and leaves
`choiceGeometryIds` out of the contract. Putting them in the served bank, and
adding `choiceGeometryIds` to `openapi.yaml` and `backend/app/models.py`, is
now this task's job. T-040 landed in PR #88: add `map_click` to
`SERVED_FORMATS` in `backend/app/content_build.py`, map its `choiceGeometryIds`
there (the loader's field list is an allowlist), and rerun `make -C backend
content`. The question file already holds the 50 `map_click` questions.
**Done when:** a `map_click` question can be shown, answered by tapping the map,
and graded, with the same asymmetric reveal as the other two.

### T-087 — A bank refresh regenerates the question file and the served bank · S · todo
**Depends on:** —
**New 2026-10-19, from T-040's reviewer (PR #88).** T-040 left two hand-run
commands: `cd question-bank && bun run ./src/write-questions.ts`, then
`make -C backend content`. A changed `bun run refresh` moves the entity bank, so
both drift tests go red until someone runs both. That is the intended guard
(E-24), but nothing tells the person running the refresh which commands to run.
Two things:
- **A named script.** T-040's criterion 33 forbade a `package.json` change, so
  the question-file command is a file path. A `"questions"` script would make it
  `bun run questions`. It turns two `package.json` byte pins red (T-025 c15,
  T-079 c20), so plan to attend the tester step.
- **Say it where the refresh is run.** Either `bun run refresh` prints the two
  commands when it changes the bank, or the refresh docs list them. Chaining
  them into the refresh is the bigger option, and it was out of T-040's scope.
**Done when:** a person running a changed refresh is told, by the command or by
the doc next to it, to regenerate both files, and the question-file command is
either a named script or the reason it is not is written down.

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
**Amended 2026-10-20 by T-064's reviewer (PR #89): check nothing in the suite
writes this file.** During T-064's worker run, one `bun test` in `frontend/`
left `frontend/README.md` rewritten (a `*` escaped to `\*`, a prettier-style
edit). It did not recur in two more worker runs or the tester's, and nobody
found the cause. While fencing these blocks, run the frontend suite and confirm
`git status` stays clean for this file. If something does write it, find the
test and say so here.

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
