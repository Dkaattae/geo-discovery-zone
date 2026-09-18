# T-017 — Two region vocabularies, and they disagree

**Status:** `awaiting approval`
**Next step:** `human` (approve on the PR), then `worker`
**Approved:** pending
**From:** [`tasks.md`](../tasks.md) T-017
**Branch:** `claude/task-t017-xqyyeq` — this session was assigned this branch by
the harness and CLAUDE.md's "Branches" grants pushing to it for this task.
**PR:** [#49](https://github.com/Dkaattae/geo-discovery-zone/pull/49), opened draft at expand time, built from the branch above.
**Fault:** (empty)

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-18 | cse_01NEERZW3gE6qHsQgi6suzSz |

## Goal

`question-bank/src/curated/us-states.ts` assigns each of the 50 states one of
**eight** regions; the bank the app actually serves
(`backend/app/data/content.json`, 15 states) uses **thirteen**. The curated
table's own comment claims to match "the values already in the frontend" — that
stopped being true. Two consequences: `region` query filters mean different
things depending on which half of the repo produced the row, and T-022 (same-region
distractors) cannot be built on an undefined vocabulary. This task settles the
vocabulary and makes both sides use it.

**Decided 2026-09-18 (product call, asked of the human rather than guessed, per
`process.md`'s expander gate for decisions "not yours to make"): the app adopts
the served bank's thirteen-region vocabulary**, not the pipeline's eight. The
finer list is the one already shipping to children today, and it is the one
`openapi.yaml`'s `region` filter already returns real values from.

## Acceptance criteria

1. Every one of the 50 states in `question-bank/src/curated/us-states.ts` has a
   `region` drawn **only** from this closed set of 13 values: `Great Basin`,
   `Great Lakes`, `Great Plains`, `Mountain West`, `New England`, `Northeast`,
   `Pacific`, `Pacific Northwest`, `Pacific West`, `South Central`, `Southeast`,
   `Southwest`, `Upper Midwest`. No state carries a value from the old
   eight-region set that is not also in this 13-value set (`Midwest` in
   particular must not survive anywhere).
2. That 13-value set is written down once, in a comment in `us-states.ts`
   alongside the file's existing provenance comments (`top_crops`,
   `highest_point`), so a later curator or the loader (T-040) finds the whole
   vocabulary named in one place instead of inferring it from the data.
3. The 15 states already served in `backend/app/data/content.json` keep exactly
   the region value they carry today — this task does not touch that file's
   region values, only confirms them:
   `Colorado=Mountain West`, `Florida=Southeast`, `Texas=South Central`,
   `Alaska=Pacific Northwest`, `Hawaii=Pacific`, `Maine=New England`,
   `Michigan=Great Lakes`, `Louisiana=South Central`, `California=Pacific West`,
   `New York=Northeast`, `Arizona=Southwest`, `Kansas=Great Plains`,
   `Washington=Pacific Northwest`, `Minnesota=Upper Midwest`, `Nevada=Great Basin`.
4. A test fails if any `region` value in `question-bank/src/curated/us-states.ts`,
   in the built `question-bank/data/us-states/us-state-*.json` files, or in
   `backend/app/data/content.json` is not one of the 13 values named in
   criterion 1.
5. `openapi.yaml`'s `Region` parameter description (`components/parameters/Region`,
   currently `Region slug, e.g. \`mountain-west\`, \`europe\`, \`southeast-asia\`.`)
   gives an example the API actually returns — the real values are titled
   strings with spaces (`Mountain West`), never kebab-case slugs. Documentation
   text only; no schema or shape change, and say so in the PR per `CLAUDE.md`'s
   "change `openapi.yaml` deliberately and say so."
6. The bank's pinned-digest guards still pass:
   `question-bank/src/landmarks-verify.test.ts`,
   `question-bank/src/climate-kid-verify.test.ts`,
   `question-bank/src/top-crops-verify.test.ts`, and
   `question-bank/src/highest-point-verify.test.ts` each still assert "nothing
   but this task's field moved," extended with a `region` neutralisation of the
   same shape as their existing per-field exceptions (`withEmptyTopCrops`,
   `withoutAlaskaHighestPoint`, etc.) — see Constraints below.
7. `engineering-decisions.md` gets a new entry (next number, `E-9`) recording
   that the served bank's 13-region vocabulary was chosen over the pipeline's
   8-region one, and why — mirroring `E-7` and `E-8`'s shape.
8. No new dependency. No test reaches the network.

## Out of scope

- **T-022's actual distractor-strategy implementation** (same-region grouping
  for map/capital questions). This task only makes "same region" well-defined;
  T-022 still needs T-021 first regardless.
- **Making `region` an enum in `openapi.yaml`.** It stays a free string; the
  closed set is enforced by a test (criterion 4), not by the contract's schema.
  Enumerating it is a separate, larger contract change this task does not make.
- **Reassigning `backend/app/data/content.json`'s 15 region values.** Criterion
  3 freezes them; this task does not edit that file's `region` fields.
- **T-040 (the loader) and T-050 (serving 50 states).** This task fixes the
  vocabulary in the data; it does not wire the pipeline's output into the served
  app.
- **T-070's broader digest-guard cleanup** (re-pinning all three baselines and
  removing the accumulated exceptions). This task adds one more exception the
  same way T-013–T-016 did; it does not resolve T-070, which is still `todo`.

## Constraints

- **Files expected to change:** `question-bank/src/curated/us-states.ts` (region
  values + the new vocabulary comment); the `question-bank/data/us-states/us-state-*.json`
  files whose region changes, **regenerated by the pipeline's offline build, never
  hand-edited** (the same rule T-069 states — the fix has to survive a rebuild);
  `question-bank/src/landmarks-verify.test.ts`, `climate-kid-verify.test.ts`,
  `top-crops-verify.test.ts`, `highest-point-verify.test.ts` (the new `region`
  digest exception); `openapi.yaml` (criterion 5's description text only);
  `engineering-decisions.md`.
- **This is the largest change any of these digest guards have absorbed** —
  earlier exceptions covered one field on one or two states
  (`top_crops` reset to `[]`, Alaska's `highest_point` stripped). Region changes
  can touch a large share of the 50 tracked files at once, because most of the
  eight-region set needs splitting into finer thirteen-region categories.
  Read the existing neutralisation functions in `top-crops-verify.test.ts` and
  `climate-kid-verify.test.ts` before writing a new one, and confirm by mutation
  (per `process.md` step 4 for verify, and the pattern those files already use)
  that the neutralisation actually strips what it claims to, the same way
  `test("the Alaska neutralisation actually removes the highest_point line...")`
  does today.
- **`backend/app/data/content.json`'s 15 region values are not touched** except
  to confirm they already satisfy criterion 1's closed set (they should — that
  set is defined as the union of this file's current values). If one of them
  turns out not to, that is a discrepancy to report in the Handoff, not to
  silently correct.
- No hand-editing generated JSON — the pipeline is the source of truth.
- No new dependency (`CLAUDE.md` "Packages" — ask first if one seems needed).
- No network in tests.

## Context

- `question-bank/src/curated/us-states.ts` — the region field for all 50 states
  today (eight-value set), and the file's existing provenance-comment pattern
  (top of file) to extend for criterion 2.
- `backend/app/data/content.json` — the 15-state anchor values (criterion 3).
- `question-bank/src/normalize.ts:136` — `region: curated.region`, where the
  curated value flows into the built entity.
- `question-bank/src/top-crops-verify.test.ts`,
  `question-bank/src/climate-kid-verify.test.ts`,
  `question-bank/src/landmarks-verify.test.ts`,
  `question-bank/src/highest-point-verify.test.ts` — the pinned-digest pattern
  to extend for criterion 6.
- `tasks.md` T-070 — documents the digest-guard wall this task will hit in
  detail, still `todo`.
- `tasks.md` T-022 — blocked on this task landing.
- `openapi.yaml` — `components/parameters/Region` (~line 1131), `Entity.region`
  (~line 1446), `Question.region` (~line 1585).
- `engineering-decisions.md` E-7, E-8 — the two most recent hand-curated-field
  decisions, for tone and format to match in the new E-9 entry.

## Review checklist — the per-state assignment is content curation

The closed-set test (criterion 4) only proves every state has *a* value from
the list — not that it is the *right* one. Assigning ~35 states that were never
in the 13-vocabulary to the correct finer category (e.g. `Great Lakes` vs.
`Upper Midwest` vs. `Great Plains` for a former `Midwest` state; `Mountain West`
vs. `Great Basin`; `Northeast` vs. `New England`; `Pacific` vs. `Pacific West`)
is a geography judgment call, the same kind of hand-curation `CLAUDE.md`
"Content rules" already governs for `state_animal` and `climate_kid`.

- [ ] Spot-check a sample of the newly-assigned states against ordinary US
      regional usage (e.g. Wikipedia's "List of regions of the United States",
      or the US Census Bureau's regions/divisions as a starting point, adjusted
      for what an adult would actually call each state's region) and confirm
      they read right.
- [ ] Confirm the 15 anchor states (criterion 3) were not touched.
- [ ] Confirm no assignment is surprising next to its neighbors — a state a
      child would place with one group that lands in another is worth a second
      look, since T-022 will eventually use this grouping for distractors.

Record who checked this in the PR.

## Handoff

(worker writes this)

## Verdict

(tester writes this)

## Notes

(filled in while working)
