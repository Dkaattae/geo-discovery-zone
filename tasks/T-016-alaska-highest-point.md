# T-016 — Alaska has no `P610` highest point

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `Dkaattae, 2026-09-18`
**From:** [`tasks.md`](../tasks.md) T-016
**Branch:** `claude/gallant-pasteur-jtdovj` — the harness assigned this session its
own branch and forbids pushing elsewhere, so this is the task branch
(`process.md`, "When the environment names the branch for you"; `CLAUDE.md`
"Branches" carries the standing permission). **Not** `task/T-016-…`. Every later
role pushes here.
**PR:** #47, opened draft at expand time, built from the branch above. It stays
draft until the reviewer approves it.
**Fault:** —

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-18 | `01DcPFTAMrySYcEfrLFRiZHc` |

## Goal

Alaska is the one state in the committed bank with no `highest_point`, and the
mountain in question is the most famous peak in the country — a "which state has
the highest point" question that reveals a blank for Alaska teaches the wrong
thing. Fill the gap from the curated table, and make any *future* missing
highest point announce itself in the build report instead of disappearing
silently the way this one did.

## What is already true — do not rebuild it

Surveyed 2026-09-18 on `284b8bc`. Skip what is done (`process.md`, "Survey first").

- **The field already exists end to end.** `Entity.highest_point` /
  `highest_point_m` are declared (`question-bank/src/types.ts:54-55`), the query
  asks for `P610` and its `P2044` elevation
  (`question-bank/src/queries/us-states.ts:42-52`), the bindings are parsed
  (`question-bank/src/sources/wikidata.ts:55-56`) and `normalize.ts:140-141`
  folds both in conditionally. No schema change is needed.
- **49 of 50 states already ship a `highest_point` name.** Only
  `question-bank/data/us-states/us-state-ak.json` lacks it.
- **Alaska is not missing the elevation** — `highest_point_m: 6190` is present and
  correct in metres. It is only the *name* that is absent, because Alaska's row in
  the committed fixture (`question-bank/src/fixtures/us-states.sparql.json`) has an
  `elevation` binding and no `highestPoint` binding. It is the only one of the 50
  fixture rows without it.
- **The string to copy already exists**: `landmark: "Denali"` on the Alaska row,
  `question-bank/src/curated/us-states.ts:85` (T-013, PR #43).
- **Nothing warns about it today.** `normalizeUsStates` warns on missing
  `capital`, `centroid`, FIPS mismatch, implausible area, unresolved borders and
  rank suppression; it says nothing about a missing highest point, and
  `build.ts`'s `report()` (`:206-230`) only counts `capital`/`centroid`/
  `population` as core. So "stop warning about it" has nothing to switch off —
  the gap is currently invisible, which is the half of this task worth building.

## The route this brief takes, and the one it does not

`tasks.md` offers two: add a curated fallback, or accept the blank. **This brief
takes the fallback**, because the string already exists three lines away in the
same table, the plan lists peak elevation as a field the bank carries
(`geoquizdataplan.md` §1.9), and a blank on Denali specifically is the worst
possible blank to accept. If you would rather accept the blank, say so at
approval and the brief comes back through `task-expander` — do not let the worker
switch routes.

**The mountain's name is not settled here, and criterion 3 is why.** The federal
name became Mount McKinley in 2025; Alaska's own usage, the national park and
school maps kept Denali. T-013's reviewer escalated that to a human on PR #43 and
the box is still open. This task therefore ships *whatever `landmark` already
says* and pins the two fields equal, so the name stays a one-place decision
rather than becoming a two-place one. The Review checklist below carries the
question; it is not a criterion, because it is not the loop's to settle.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

1. Every one of the 50 tracked files in `question-bank/data/us-states/` carries a
   `highest_point` key whose value is a non-empty string — 50 of 50, not 49.

2. The curated fallback fills a gap and never overrides Wikidata: given a state
   row with **no** highest-point label and a curated fallback for that state, the
   entity `normalizeUsStates` returns carries the curated value as
   `highest_point`; given a state row that **does** carry a highest-point label
   and a curated fallback for the same state, the entity carries the Wikidata
   label, not the curated one.

3. Alaska's `highest_point` and its `landmark` are the same string, character for
   character — both in `question-bank/data/us-states/us-state-ak.json` and in the
   Alaska row of `question-bank/src/curated/us-states.ts` — and editing one
   without the other turns a test in the committed suite red.

4. Alaska's `highest_point` is one plain name a child can read aloud: it contains
   no parenthesis, no `/`, no `,`, no ` or `, and is not the empty string.

5. `question-bank/data/us-states/us-state-ak.json` differs from its bytes on the
   default branch by exactly one added line — the `highest_point` line — with no
   line removed and none changed. `highest_point_m` is still `6190`,
   `sources.built_at` is still `2026-08-04T16:05:35.000Z`, and every other key and
   value is untouched.

6. The other 49 files in `question-bank/data/us-states/`, that directory's
   `index.json`, and `question-bank/sample-data/us-state-co.json` are
   byte-identical to the default branch.

7. The bank is built, not hand-edited: an offline build from the committed
   fixture reproduces all 50 committed files byte-for-byte, and running it twice
   produces identical bytes both times.

8. A build that still leaves a state without a highest-point name says so: when
   `normalizeUsStates` produces an entity with no `highest_point`, its result
   carries a warning whose `entity` is that state's entity id and whose `field` is
   `highest_point`, and `build.ts`'s report prints that warning alongside the ones
   it already prints.

9. A full offline build of all 50 states from the committed fixture emits **zero**
   warnings with field `highest_point`, and no new warning of any other field
   either — the warning count for the full fixture build is what it is on the
   default branch.

10. The three pinned-digest guards still pass with their pinned constants
    unchanged: no digest literal in `question-bank/src/landmarks-verify.test.ts`,
    `climate-kid-verify.test.ts` or `top-crops-verify.test.ts` is re-pinned, and no
    assertion in those files is deleted, skipped or loosened. Where a file's hashed
    bytes must be neutralised, only Alaska's new `highest_point` line is removed
    before hashing — the other 49 files keep their `highest_point` in the hashed
    bytes, because their pinned digests were computed with it present.

11. Whichever neutralisation criterion 10 needs is proven to be real: a test
    shows that the neutralised Alaska bytes differ from the file on disk and no
    longer contain the highest-point value, so the digest comparison cannot pass
    vacuously.

12. `bun test` in `question-bank/` is green in full — every pre-existing suite as
    well as anything added — and `bun run typecheck` passes.

13. No test added or changed by this task reaches the network, and none mocks
    `fetch`: any build a test runs goes through the dead-proxy harness in
    `question-bank/src/offline-rebuild.ts`.

14. No dependency is added: `question-bank/package.json` and
    `question-bank/bun.lock` are byte-identical to the default branch.

15. Nothing outside `question-bank/`, `engineering-decisions.md` and the brief
    changes — in particular `openapi.yaml`, `backend/` and `frontend/` are
    untouched — and Alaska's `landmark` **value** is not changed by this task.

16. `engineering-decisions.md` gains one entry (the next free `E-n`) recording:
    that a curated highest-point value fills a Wikidata gap only and never
    overrides a live value; that Alaska is the only state relying on it today and
    why; and that Alaska's `highest_point` and `landmark` are pinned to one
    string, so the Denali / Mount McKinley call stays a single edit.

## Out of scope

Anything here that is worth doing becomes an entry in `tasks.md`, not a commit on
this branch.

- **The `highest_point_m` unit bug.** Several states carry the elevation in
  **feet** under a metres key — Arizona `12622`, Oregon `11237`, Nebraska `5429`,
  Kansas `4039`, Iowa `1670` — because `P2044` carries a unit that `wdt:` drops,
  the same trap `normalize.ts:103-114` already flags for area. Found while
  surveying this task and filed as **T-069**; do not fix it here, and do not
  "correct" Alaska's `6190` (that one is genuinely metres).
- **Changing `US_STATES_QUERY`.** The missing label may well be fixable at the
  SPARQL level, but the committed fixture is the input every test replays, so a
  query change cannot be verified offline and risks moving the other 49 files.
- **Re-capturing the fixture** for the same reason.
- **Any other state's `landmark`, `highest_point` or curated value.**
- **Deciding whether the mountain is called Denali or Mount McKinley** — see the
  Review checklist. This task pins the two fields together; it does not choose.
- Wiring the bank into the app (T-040) and the region-vocabulary clash (T-017).

## Constraints

- **Files expected to change:** `question-bank/src/curated/us-states.ts` (the
  fallback value and its `CuratedState` field), `question-bank/src/normalize.ts`
  (fold-in and warning), `question-bank/data/us-states/us-state-ak.json`
  (**rebuilt offline, never hand-edited**), one new test file under
  `question-bank/src/`, Alaska-only neutralisation in the three digest guards
  named in criterion 10, and `engineering-decisions.md`.
- **Invariants:** `sources.built_at` stays the fixture's pinned instant; ranks,
  borders and every other field keep their current values; the `Entity` shape in
  `types.ts` gains no new key; the offline path stays network-free.
- **Dependencies:** none without asking (`CLAUDE.md`).
- **Content rules:** the shipped name is text a child will read. It is copied from
  an already-curated value, not invented, and it is not a guess (`CLAUDE.md`,
  "Content rules"). The reviewer will escalate this PR for the human content read
  regardless — that is expected, not a failure.
- The queue entry sizes this **S**; if it grows past the files above, stop and say
  so rather than expanding it.

## Context

**Required reading for the worker and the tester.**

- **The gap itself:** `question-bank/src/fixtures/us-states.sparql.json` — the
  Alaska binding set has `elevation` and no `highestPoint`; it is the only one of
  the 50 rows like that.
- **Where the field is folded in:** `question-bank/src/normalize.ts:140-141`.
  **How warnings are shaped:** `normalize.ts:115-121` (`{entity, field, message}`)
  and how they are printed: `question-bank/src/build.ts:206-230`.
- **The curated table:** `question-bank/src/curated/us-states.ts` — the
  `CuratedState` interface at the top, Alaska's row at `:79-95`, its
  `landmark: "Denali"` at `:85`. Its header comment is where provenance for a new
  field goes.
- **The query:** `question-bank/src/queries/us-states.ts:42-52` — the `P610`
  `OPTIONAL` block and why the label is fetched explicitly rather than via the
  label service.
- **The no-network build harness:** `question-bank/src/offline-rebuild.ts` —
  `DEAD_PROXY` and the temp-dir runner. Use it; do not paste a sixth copy.
- **The digest guards this task must not disturb:**
  `question-bank/src/landmarks-verify.test.ts:435-468` (and its comments
  explaining the `us-state-co.json` climate-kid exception, which is the exact
  shape Alaska now needs), `climate-kid-verify.test.ts`,
  `top-crops-verify.test.ts:71` and `:538-556`. **Read `tasks.md` T-068's "One
  thing it must not miss"** — it describes this wall in full, and this task is the
  next field to hit it.
- **Plan:** `geoquizdataplan.md` §1.9 source→field table, the row *"river length,
  lake area, peak elevation | Wikidata | Good coverage. Cross-check the top 10 by
  hand"* — hand cross-checking is precisely this; and §1.7 on physical features.
  §1.8 is where superlative questions ("highest") come from, and `geoquizdataplan.md:243`
  on contested superlatives.
- **Decisions:** `engineering-decisions.md` **E-6** (why the bank is committed and
  what "rebuilt not hand-edited" means) and **E-7** (how T-015 recorded a
  hand-curated field — the shape criterion 16's entry should follow).
- **Rules:** `test-guidelines.md` (test below the transport, no network),
  `CLAUDE.md` "Content rules" and "Tests".

## Review checklist — the human content read

The criteria above cannot settle the mountain's name; only a person can. Record
who checked these on the PR.

- [ ] **The name that ships.** This task copies Alaska's existing `landmark`, so
      it ships **"Denali"** unless you say otherwise. The federal name became
      Mount McKinley in 2025; Alaska's usage, the national park and most school
      maps kept Denali. Confirm Denali, or name the string you want.
- [ ] **If you change it, it changes in both fields** — that is what criterion 3
      buys. It is one edit in `question-bank/src/curated/us-states.ts`, plus a
      rebuild and the digest guards.
- [ ] **This is the same open box as T-013 / PR #43.** Settling it here settles it
      there; settling it there settles it here. Do not answer it twice differently.
- [ ] **Route.** Filling the blank from the curated table rather than accepting
      it — confirm, or send the brief back to `task-expander`.

## Handoff

Written by `worker` before the tester runs. **Always written, even when nothing
was built.**

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

- Surveyed on `284b8bc` (merge of PR #46, T-015). `tasks/` held only `README.md`
  and `TEMPLATE.md` — the previous cycle swept cleanly.
- Sixteen criteria for an `S` task looks heavy; ten of them are guards and
  negatives that cost a line of test each. The task itself is one curated value,
  one conditional fold-in and one warning. The light path is unavailable anyway:
  this ships text a child will read (`process.md`, "The light path").
