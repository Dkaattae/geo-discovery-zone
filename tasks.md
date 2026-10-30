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
rewrite to check. Swept again 2026-10-22, after T-026 added six templates and
five Setup topics (PR #91): T-026 deleted; T-056 rewritten to what is left of
it; T-050, T-053, T-088, T-039 and §H's superlatives line updated. Swept
again 2026-10-23, after T-050 measured selection and levels at 365 questions
as E-26 (PR #92): T-050 deleted; T-089 and T-090 new from its follow-ons;
T-056, T-085, T-088 and T-076 amended. Swept again 2026-10-23, after T-090
capped Hawaii's and Alaska's climate phrases (PR #93): T-090 deleted; T-091
new from its content trade; T-070 and T-088 amended. Swept again 2026-10-26,
after T-089 made a pick past span 6 draw from the nearest questions (PR #94):
T-089 deleted; T-070, T-053 and T-076 amended. Swept again 2026-10-27,
after T-051 served and rendered `map_click` (PR #96): T-051 deleted; T-092
and T-093 new; T-070, T-053 and T-045 amended. Swept again 2026-10-27,
after T-092 stopped writing candidates on `map_click` (PR #100): T-092
deleted; T-094 new; T-070 amended. Swept again 2026-10-27, after T-094
restored per-template answer-position checks (PR #101): T-094 deleted. Swept again 2026-10-29,
after T-070 re-pinned the digest guards at `b0ee336` (PR #103): T-070 deleted;
T-084 unblocked and its skip log folded; T-087 and T-095 amended. Swept again 2026-10-29, after T-084 made the 50-state query read `mul`
labels after `en` (PR #105): T-084 deleted; T-095 absorbs its re-record and
live Juneau check. Swept again 2026-10-29, after T-085a lowered Hawaii and
Alaska by 2 on the map and climate questions (PR #107): T-085 deleted, its
accepted Rhode Island risk moved into T-085b; T-085b and T-095 amended. Swept again 2026-10-30, after T-088 excluded the crops and farm animals a state also grows or raises (PR #109): T-088 deleted; T-096 new from its review; T-095 amended. Swept again 2026-10-30, after T-096 corrected "six farm animals" to eleven and made `clickDistractorsFor` throw on a fixed-pool pick (PR #110): T-096 deleted; nothing else in the queue moved. Swept again 2026-10-30, after T-091 recorded Dkaattae's acceptance of the climate "only cold phrase" trade in E-25 and E-27 (b) (PR #111): T-091 deleted; nothing else in the queue moved._

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
| **Questions** | **415** served, generated: about eight per state (T-040, T-026, T-051) | generated from templates × entities (§1.2) |
| **Question formats** | **3** — `map_identify`, `map_click`, `multiple_choice` | 9 — plus `image`, `ab_compare`, `pin_pick`, `pin_drop`, `drag_order`, `click_profile` |
| **Topics** | **7** — location, capital, superlative, wildlife, landmark, climate, agriculture (T-026) | 10 — plus size, physical, elevation |
| **Map** | US states, `us-atlas`, mastered states fill in | + shaded relief (§2.6), physical features (§2.4) |
| **Backend** | all 29 contract operations, SQLite or Postgres | — |

So: a child sees a highlighted state and picks its name, or picks one of four
answers about a named state (capital, state animal, landmark, climate, crop,
farm animal), or picks the biggest of four states, or taps a named state on
the map with nothing marked and any state allowed (`map_click`, T-051, PR #96,
E-29), over 50 states. Setup offers the seven topics plus "A bit of everything"
(T-026, PR #91).

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
(since T-026, PR #91, every topic field has one) and both committed files are
regenerated (T-087).

---

## C. Question generation

Since T-040 (PR #88) every served question is generated, as the plan's central
claim asks (§1.2), and generation is what turns curated fields
(§B) into the topics the app does not have yet.

### T-085b — Capital is the state's largest city: the Census-checked half of T-085 · S · todo
**Depends on:** T-085a (PR #107) merged (it changes `familiarity_bonus`'s shape and the
bank this regenerates), and **a reachable U.S. Census Bureau release**. The
2026-10-29 worker found `api.census.gov`, `www.census.gov`, `data.census.gov`
and `www2.census.gov` refused by the web session's proxy (403 on CONNECT), so
a person first picks one: allow `*.census.gov` for the session; supply the 17
rows by hand from one named release; or accept Wikidata P1082 statements whose
reference is a named Census release (a source change, which needs the
expander and a fresh approval).
**Approved 2026-10-27 (Dkaattae), carried over from T-085:** −1 on
`tpl-capital-of` for AZ Phoenix, AR Little Rock, CO Denver, GA Atlanta,
HI Honolulu, ID Boise, IN Indianapolis, IA Des Moines, MA Boston, MS Jackson,
OH Columbus, OK Oklahoma City, RI Providence, TN Nashville, UT Salt Lake City,
WV Charleston, WY Cheyenne. **Flag:** TN (Memphis), WV (Huntington) and WY
(Casper) are close calls. Check all 17 against one named Census release and
leave out any it does not confirm (strictly larger than every other city).
**The accepted risk** (Dkaattae, 2026-10-27; moved here from T-085 when
T-085a landed, PR #107): a largest-city entry lowers Providence (RI) from 10,
which T-025 read as `about right`, and that is wanted. **This line is the
record of the accepted risk** until this task writes it into E-22. The amount
(−1) is a first guess the task may tune; the membership is what was approved.
**What T-085a left for this task** (reviewer, PR #107):
- **The key shape.** T-085a added three flat keys: `familiarity_bonus` (the
  drawn-apart amount, 2), `familiarity_bonus_states` and
  `familiarity_bonus_templates`. A second input needs either its own three
  keys or a restructure into per-input entries; decide which, and rename
  `familiarity_bonus` if it stops meaning "the drawn-apart amount". E-22's
  constant block must stay JSON-parseable per line
  (`hand-check-levels-verify` criterion 7) and arrays are matched quoted
  (`seed-level.test.ts`, as modified by T-085a row 1).
- **E-22's Revisit sentence** keeps a bare "T-085" only so
  `seed-level-loose-ends-verify.test.ts` criterion 5's `\bT-085\b` stays green;
  rewording it is that test's row in the Test change request.
- **The pins that will go red** are T-085a's family again, plus T-085a's own
  `familiarity-drawn-apart-verify.test.ts` (it pins the constant's key set,
  the HI/AK levels, and `5ae564a` digests) and
  `backend/tests/test_t085a_tester_criteria.py`.
**Decide in the brief:** how the two inputs combine if one question ever gets
both (none does under the approved lists).
**Test cost:** the same family as T-085a (E-22 pins, `LEVEL_SEED_WEIGHTS`
sha, bank digests). Plan to attend the tester step.
**Done when:** the confirmed capitals' questions are one lower, E-22 names the
release and records every row confirmed or left out, and the RI risk is in
E-22.

---

## D. The bank the app serves

T-040 (PR #88) bridged the pipeline to the app: `backend/app/data/content.json`
is generated from `question-bank/data/` and the 50 states are served
(`engineering-decisions.md` E-24). T-051 (PR #96) served the third format,
`map_click`. What is left here is making that bank behave well at its size.

### T-056 — The map cannot fill in on a child's first day · M · todo
**Depends on:** a design decision below
**Rewritten 2026-10-22 by T-026's reviewer (PR #91).** T-026 made it seven
served questions per state, so a **mixed** first sitting can now colour states
in. The e2e test's first-sitting-is-empty premise went red and was dropped
(T-026 Test change request row 94): CI saw two states fill after 50 right
answers. What is left is **single-topic sessions**, which Setup now leads with.
Each topic has one question per state (agriculture up to two), and a session
never repeats a question. Mastery is +0.25 per right answer and fills above
0.7, so a child who only plays "Capital cities" or "State animals" can fill no
state in their first sitting, and needs four sittings to fill any.
Options: revisit the 0.7 threshold, show partial mastery on the map, or let a
topic session count the same state's questions from other topics. Each is a
design decision, not more data.
**Amended 2026-10-23 by T-050's reviewer (PR #92): review has the same
single-topic problem.** E-26 table C: in `location`, `capital`, `wildlife` and
`climate` every state has exactly one question, and the review pool is
topic-filtered before `review_pool` sees it (`routers/sessions.py:106-113`).
So a single-topic review turn re-asks the very question missed, or, when it is
in the last six, falls back to an ordinary pick, though `review_pool`'s
docstring promises "a different angle". `store.review_questions` draws a
state's questions from every topic and has no caller. Whether a topic session
may reach into other topics is one question for mastery and review alike;
settle both here. Also decide whether a review round should count down on a
pick that was not a review (`grading.py:146-147`).
**Done when:** a good first session in any Setup topic visibly colours
something in, or the gap is accepted and written down.

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
**Amended 2026-10-29 by T-070's reviewer (PR #103).** T-070 made four backend
drift tests ignore `_source.extractedAt` so a `built_at`-only refresh stays
green (approved rows W54–W57: `test_content_build.py`, `test_t040_tester_criteria.py`
×2, `test_t051_tester_criteria.py`). A stale date in `content.json` now passes.
If this task makes the refresh regenerate `content.json`, restore the full
comparison in those four tests through a Test change request.
**Done when:** a person running a changed refresh is told, by the command or by
the doc next to it, to regenerate both files, and the question-file command is
either a named script or the reason it is not is written down.

### T-095 — A real refresh still turns the re-pinned bank guards red · S · todo
**Depends on:** T-070. **Needs a person's call before it is expanded** (Q below).
**New 2026-10-28, from T-070's expander (PR #103), added at Dkaattae's request.**
T-070 makes the bank guards survive a refresh in which only `sources.built_at`
and the SPARQL fixtures moved, which is what Q1 asked for. But `bun run refresh`
writes nothing in that case: it exits 2, `bank unchanged`
(`question-bank/src/refresh.ts`, header comment). Every refresh that writes has
moved at least one other bank field, so every real refresh PR will still go red
on the re-pinned guards, starting with T-070's `bank-pins.ts` / `BANK_DIGESTS`.
That is safe, but it means the monthly routine can never open a green PR on its
own. T-087 is related (it regenerates the question file and served bank) and may
land in the same PR as whatever this decides.
**Q (for a person):** which of these?
- **(a) The refresh PR re-pins.** The refresh, or a documented step after it,
  regenerates the bank pins, so the PR's diff shows the pin change next to the
  data change and a reviewer sees both. The guards keep pinning exact values.
- **(b) The bank guards stop pinning values a refresh may move.** They keep
  checking shape, the curated fields and anything Wikidata does not supply, and
  leave refreshable values to `committed-bank.test.ts` (offline rebuild matches
  the committed bank, E-6).
- **(c) Accept the red PR,** and write down that a refresh PR is re-pinned by
  hand in an attended tester step (D-14).
**Amended 2026-10-29 by T-070's reviewer (PR #103): the bank is pinned in more
than one place.** Option (a) has to re-pin all of these, not just
`BANK_DIGESTS`: `hand-check-levels-verify.test.ts` criterion 14 (one digest over
`question-bank/data/`, `7760ab89…`), `highest-point-metres-verify.test.ts`
`LINE_AT_B0EE336`, `climate-far-phrases-verify.test.ts` criterion 12's
`content.json` digest, and `seed-level-loose-ends-verify.test.ts` criterion 10's
levels digest. Eleven guards hash whole bank files, all through `BANK_DIGESTS`.
Folding the rest into `bank-pins.ts`, together with the `fixtureBuiltAt` helper
now copied into seven test files, would make (a) one edit.
**Amended 2026-10-29 by T-084's reviewer (PR #105).** T-084 was split by a
person (its Q1, answer (a)): it changed only the query text, so the rest of its
old "Done when" is the first real refresh's, and this task owns that PR. When
it lands: both SPARQL fixtures are re-recorded by a live `bun run refresh`, and
Alaska's capital is `Juneau` from that live run (it is `Juneau` in the
committed fixture already). T-084's worker also found Denali has lost its `en`
label: on `main`'s query Alaska's `highestPoint` came back empty live, and the
new query binds `Denali`. Expect that field to move on the first refresh.
**Amended 2026-10-29 by T-085a's reviewer (PR #107).** T-085a re-pinned the
guards above at `6a515e2` (so `hand-check-levels-verify` criterion 14 is now
`2edc3a19…`, not `7760ab89…`), and added two more files that pin bank state:
`question-bank/src/familiarity-drawn-apart-verify.test.ts` (digests of the
question file, `content.json`, `data/us-states/` and the levels at `5ae564a`)
and `backend/tests/test_t085a_tester_criteria.py`. A refresh turns both red;
option (a) must cover them too.
**Amended 2026-10-30 by T-088's reviewer (PR #109).** T-088 re-pinned the
bank and E-n guards at `6587ed0`: the guards in `climate-far-phrases-verify`,
`map-click-no-candidates-verify`, `hand-check-levels-verify` criterion 14,
`familiarity-drawn-apart-verify` criterion 13, and `test_t051_tester_criteria.py`.
It added two more files that pin main's bank at `a42b71b` by digest:
`question-bank/src/agriculture-true-wrong-answers-verify.test.ts` (criteria
1–3, 20–23) and `backend/tests/test_t088_tester_criteria.py`. Option (a) must
cover them too.
**Done when:** a refresh that moves a real bank field opens a PR whose suite is
green, or (c) is chosen and recorded as the next unused `E-n`.

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
  T-026 (PR #91) serves area superlatives from `area_rank` without this endpoint.
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
**Amended 2026-10-27 by T-051's reviewer (PR #96).** T-051 gave
`UngradableAnswer` a `path`, so a `map_click` 422 names `/tappedGeometryId`.
A pin question's 422 still names `/choiceIndex` (`grading.py`, `PIN_FORMATS`
branch). When these formats get keys, pass the right path (`/pin`, `/order`).
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
**Since T-026 (PR #91):** a superlative question's served `entity` *is* its
answer, so `includeAnswerKey=false` does not hide it. Whatever is decided
here, decide it for the superlative's entity too.
**Since T-089 (PR #94):** `listQuestions`' description says "`level` +
`levelSpan` mirror the server's widening search in `serveNextQuestion`". The
endpoint applies one fixed `±levelSpan` window (`routers/content.py:169`,
`store.py:240`) and widens nothing, and the selector's nearest fallback (E-28)
has no `levelSpan` equivalent. While editing this operation's text, say that it
filters to one window.
**Since T-051 (PR #96):** a `map_click` question carries a second answer key,
`answerGeometryId`, served by default and withheld with `includeAnswerKey=false`
(E-29). Its served `entity.geometryId` is the same code, as a superlative's
entity is, so `includeAnswerKey=false` does not hide that either. Decide both
with the superlative's entity.
**Done when:** the default is decided, `openapi.yaml` and the implementation
agree, and `test_the_answer_key_can_be_withheld_from_the_public_bank` reflects
whichever way it went.

### T-093 — An undone answer still counts as a place seen · S · todo
**Depends on:** —
**New 2026-10-27, from T-051's tester and reviewer (PR #96).** `apply_answer`
appends the entity to `session.seen_entity_ids` (`grading.py:159`), and undo
restores the session from a snapshot that does not hold that list. So an answer
backed out with "Oops, tapped by mistake" still counts toward the summary's
`placesSeen` (`routers/sessions.py:407`), for every format. `map_click` makes a
mis-tap likelier, since every state is a target. Either snapshot the list, or
decide that a place looked at is a place seen and say so in the undo docstring.
**Done when:** an undone first answer on a state leaves `placesSeen` where it
was, or the choice is written down.

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
**Seen again 2026-10-23 in T-050's worker run** (PR #92): the same `2 * gradeOf`
→ `2 \* gradeOf` edit after one frontend `bun test`, not on the next run. Two
sightings now. First suspect: `frontend/src/format-gate.criteria.test.ts`,
which spawns `bun run format` (a write) around its probe files.
**Seen a third time 2026-10-23 in T-089's worker run** (PR #94), the same
edit, and the worker noted it also happens on a clean tree without
`node_modules`. That points harder at the format-gate test's `bun run format`
when prettier cannot be resolved.

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

- **Superlatives** — area "biggest" landed in T-026 (PR #91). Other axes,
  `ab_compare` and region scopes are left, with T-039
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
