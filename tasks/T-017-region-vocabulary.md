# T-017 — Two region vocabularies, and they disagree

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** Kate, 2026-09-18 (approved via chat on PR #49)
**From:** [`tasks.md`](../tasks.md) T-017
**Branch:** `claude/task-t017-xqyyeq` — this session was assigned this branch by
the harness and CLAUDE.md's "Branches" grants pushing to it for this task.
**PR:** [#49](https://github.com/Dkaattae/geo-discovery-zone/pull/49), opened draft at expand time, built from the branch above.
**Fault:** (empty)

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-18 | cse_01NEERZW3gE6qHsQgi6suzSz |
| worker | 2026-09-18 | cse_01NEERZW3gE6qHsQgi6suzSz |

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

**Session note.** `$CLAUDE_CODE_REMOTE_SESSION_ID` for this worker run is
`cse_01NEERZW3gE6qHsQgi6suzSz` — the same id the Sessions table already
recorded for `task-expander`. The brief's `Approved:` line is a genuine human
approval ("Kate, 2026-09-18, approved via chat on PR #49"), not an
orchestrator-unattended one, but the two roles nonetheless ran under one
shared session id, which is the orchestrator-relay shape `process.md` and
`.claude/agents/README.md` describe: the independence check that shared id
would normally support "degrades to attestation." The tester should run in
its **own**, genuinely separate session — if it finds itself sharing this same
id, that is exactly the case `process.md` step 4 tells it to refuse on rather
than proceed and call the check satisfied.

### What changed, file by file

- **`question-bank/src/curated/us-states.ts`** — every one of the 50 `region`
  values, plus two comments:
  - A new provenance paragraph in the file's header block (alongside the
    existing `top_crops` and `highest_point` ones) naming the closed 13-value
    set literally, explaining why the served bank's vocabulary won over the
    pipeline's original eight, and pointing at `engineering-decisions.md` E-9
    for the reasoning (criterion 2).
  - The `region` field's own doc comment on `CuratedState`, rewritten — it
    used to claim the values "match the values already in the frontend",
    which was the exact staleness this task exists to fix.
  - The 15 states `content.json` already serves were brought to match that
    file's value exactly (Alaska `Pacific` → `Pacific Northwest`, California
    `Pacific` → `Pacific West`, Kansas `Midwest` → `Great Plains`, Maine
    `Northeast` → `New England`, Michigan `Midwest` → `Great Lakes`,
    Minnesota `Midwest` → `Upper Midwest`, Nevada `Mountain West` →
    `Great Basin`; the other 8 anchors — Colorado, Florida, Texas, Hawaii,
    Louisiana, New York, Arizona, Washington — already carried the matching
    value and needed no edit).
  - The remaining 35 states were assigned a finer category by hand, adapted
    from ordinary US regional usage (Census Bureau divisions as a starting
    point, not copied line for line — see the Review checklist section below
    and `engineering-decisions.md` E-9 for the specific splits made, e.g.
    Great Lakes vs. Upper Midwest vs. Great Plains for the old `Midwest`
    states, New England split from the rest of the old `Northeast`, Nevada
    alone kept as `Great Basin` while the rest of the old `Mountain West`
    stays `Mountain West`).
  - Net: 21 of the 50 rows changed value (the old 8-region strings that
    weren't already exactly right); the other 29 already carried a value that
    is also a member of the 13-value set (e.g. `Southeast`, `South Central`,
    `Southwest`, several `Northeast`/`Mountain West`/`Pacific Northwest`
    rows) and needed no edit.
- **`question-bank/data/us-states/us-state-*.json`** — regenerated by
  `bun run src/build.ts --offline --out data/us-states --quiet` (the offline
  fixture replay, no network), never hand-edited. Exactly the 21 files whose
  curated `region` changed came out different, each a single-line diff (the
  `"region"` line only — `built_at` stayed pinned to the fixture's capture
  instant, confirmed by re-running the build a second time and diffing: byte
  identical). The other 29 tracked files, and `index.json` (which carries no
  `region` field per entity), are untouched.
- **`question-bank/src/top-crops-verify.test.ts`,
  `landmarks-verify.test.ts`, `climate-kid-verify.test.ts`,
  `highest-point-verify.test.ts`** — each extended with a `region`
  neutralisation, criterion 6. `region` had a real value both before and
  after this task on every tracked file — unlike `top_crops` (which has a
  shared `[]` baseline to restore) or `climate_kid`/`highest_point` (absent
  before, so simply deleted) — so there is no single value to restore it to,
  and the field is dropped entirely before hashing, on all 50 files, in each
  guard's own idiom:
  - `top-crops-verify.test.ts` and `highest-point-verify.test.ts` (textual,
    raw-bytes route): a new `REGION_LINE` regex removes the
    `  "region": "…",\n` line, applied to every state file (Alaska's already
    has two other neutralisations layered on top of it, unchanged).
  - `landmarks-verify.test.ts` and `climate-kid-verify.test.ts` (parsed
    route): `delete parsed["region"]` added alongside the existing deletions.
  - Every one of the four files' pinned digest constants (`DEFAULT_BRANCH_DIGESTS`
    / `BASELINE_DIGESTS`, 50 state-file entries each; `index.json` untouched,
    since it carries no `region`) was recomputed and replaced. They were
    computed from the **pre-edit tree** (before any `region` value changed),
    applying each guard's existing field-specific neutralisations plus the
    new region-line removal — which is valid regardless of the eventual
    region value, since the removal drops the field's content from the hash
    entirely rather than restoring a specific string. Recomputed with a
    throwaway script (not committed; not part of the diff), independently
    re-verified afterwards by running the four suites against the
    already-edited tree.
  - `highest-point-verify.test.ts` additionally needed one more fix, found
    only by running the suite after adding E-9: its criterion-16 test
    asserted `Math.max(...E-numbers) === 8`, i.e. that E-8 stays the
    highest-numbered entry forever. E-9 breaks that by design — it is
    criterion 7's whole point. Loosened to match the forward-compatible shape
    `top-crops-verify.test.ts`'s own E-7 check already uses (entry exists,
    all numbers distinct, no claim about being the max); the entry itself
    still asserts everything it originally meant to about E-8's content.
  - Each file also gained one new mutation-style test (`"the region removal
    actually drops the … — otherwise the digest check proves nothing"`),
    matching the pattern the brief's Constraints point at
    (`test("the Alaska neutralisation actually removes the highest_point
    line...")` in `top-crops-verify.test.ts`) — confirmed by hand that each
    one fails if the corresponding neutralisation function is made a no-op
    (reverted after confirming).
  - `top-crops-verify.test.ts` additionally needed a **separate** constant
    (`SAMPLE_DIGEST`) for its criterion-12 check of
    `sample-data/us-state-co.json`. That file is untouched by this task
    (Colorado is an anchor state whose region did not change) and is compared
    against its *own*, un-neutralised historical digest — it used to share
    `DEFAULT_BRANCH_DIGESTS["us-state-co.json"]` with the tracked-bank check,
    but that key's meaning changed (region now stripped) once criterion 13
    needed it, so reusing it for the sample would have been wrong on both
    sides of the fix as soon as a hash it was never checking meaningfully.
- **`engineering-decisions.md`** — new `E-9` entry (next number after `E-8`),
  same shape as `E-7`/`E-8`: what the two vocabularies were, why the served
  bank's thirteen values won (the product decision, asked of the human), what
  changed vs. what was frozen, and a revisit trigger (T-050, when the
  pipeline's full 50-state output actually starts being served — at that
  point all 35 judgment-call rows go live, not just the 15 anchors).
- **`openapi.yaml`** — `components/parameters/Region`'s `description` only.
  Was: `` Region slug, e.g. `mountain-west`, `europe`, `southeast-asia`. `` —
  fabricated kebab-case examples that don't match anything the API stores or
  returns. Now describes the real shape (titled strings with spaces) with
  real examples (`Mountain West`, `Southeast`, `Pacific Northwest`) and points
  at E-9. **No schema or shape change** — `type: string` is unchanged, and the
  brief's Out of scope explicitly rules out making it an enum, which this
  does not do. Flagging per `CLAUDE.md`'s "change `openapi.yaml` deliberately
  and say so": this is the one file in this diff that is the frontend/backend
  contract, and the only change to it is this one description string. I
  additionally verified `backend/app/store.py`'s `_slug_expression`/`slug`
  helpers, which case- and hyphen-normalise both sides of a `region` filter
  match (so a query of `mountain-west` still matches a stored `Mountain
  West`) — that backend leniency is unaffected by this doc-only change and
  isn't contradicted by it: the new description says what the canonical
  *stored/returned* form is, not that any other input form is rejected.

### Not changed, deliberately

- **`backend/app/data/content.json`** — confirmed all 15 `region` values are
  already members of the 13-value closed set (they define it), matching
  criterion 3 exactly. Not edited, per the Constraints. No discrepancy found.
- **`sample-data/us-state-co.json`** — not in the brief's "files expected to
  change" list, and Colorado's region did not change, so nothing needed
  updating there. Its digest is unaffected.
- **T-022's actual distractor logic, the enum change to `openapi.yaml`,
  T-040/T-050, T-070's digest-guard cleanup** — all explicitly out of scope,
  untouched.
- **Repo-wide prettier drift.** `bunx prettier --check` already fails on ~21
  files under `question-bank/src/` on this branch before this task's changes
  (including files this task never touches, e.g. `build.ts`, `sparql.ts`) —
  a pre-existing formatting/version mismatch, not something this task
  introduced. I deliberately did **not** run `prettier --write` on the files
  I edited, because doing so reformatted unrelated pre-existing lines (e.g.
  wrapping long `climate_kid` strings, restructuring `expect({...}).toEqual`
  calls) well beyond this task's actual diff. Flagging for whoever owns
  repo-wide formatting hygiene (not this task) rather than silently absorbing
  a large, unrelated reformat into a content-curation PR.

### Pre-existing, unrelated test failures (not introduced by this task)

Two tests were already failing on this branch before any of my edits, and
still fail after them, for the same reason in both cases — confirmed by
`git stash`-ing every file this task touches and re-running each in
isolation:

- `question-bank/src/climate-kid-verify.test.ts` → `"T-014 tester, criterion
  19 … frontend/ and backend/ carry no change from this task"`
- `question-bank/src/climate-kid.test.ts` → `"T-014 criterion 19 … frontend/
  and backend/ are untouched by this task"`

Both assert `git diff --name-only 13a735f...HEAD` touches nothing under
`frontend/`, `backend/` or `e2e/`. `13a735f` is T-014's branch point, and
`backend/app/data/content.json` has legitimately changed since then (the
FastAPI backend itself was added after that point — see `git log --oneline
-- backend/app/data/content.json`, and this task's own Handoff above
confirms `content.json` is untouched by T-017 specifically). This is a stale
assertion left over from before the backend existed, not a T-017 regression.
Recorded here rather than fixed, since editing another task's frozen
digest-guard test is outside this brief's Constraints.

### Whole-suite results

- `question-bank`: `bun test` → **1195 pass, 2 fail** (both pre-existing,
  above), 18225 `expect()` calls. `bun run typecheck` → clean (after
  `bun install`, which had not been run in this environment yet — no lockfile
  change, `question-bank/bun.lock` and `package.json` are byte-identical to
  before).
- `backend`: `make test` → **233 passed, 9 skipped**, 0 failed.
- `frontend`: `bun test` → **184 pass, 0 fail** (untouched by this task;
  `bun install` hit a sandboxed-registry 403 fetching a couple of
  sub-dependencies not already cached, unrelated to this task and not
  blocking since the existing `node_modules` already had what the suite
  needed).
- No lockfile changed anywhere in the repo; no new dependency added
  (criterion 8).
- No test reaches the network: the only subprocess any of the four verify
  suites spawns is the offline build CLI via `offline-rebuild.ts`, with every
  proxy spelling pointed at a dead loopback port — unchanged by this task.

### Criteria → where each is satisfied

| # | Criterion | Where |
|---|---|---|
| 1 | Every state's `region` is one of the 13 values, no `Midwest` survives | `us-states.ts`, all 50 rows (verified with a script; zero rows outside the set, zero `"Midwest"` matches) |
| 2 | Vocabulary written down once | `us-states.ts` header comment, new paragraph after the `highest_point` provenance block |
| 3 | 15 anchor states unchanged in `content.json`, and match | Confirmed by direct comparison (see Handoff above); file untouched |
| 4 | A test fails if any `region` anywhere is outside the 13 values | Not yet written — this is the tester's deliverable per the brief's own framing (the four *existing* digest guards this task extends check "nothing but named fields moved", not the closed-set property itself; a dedicated closed-set test over `us-states.ts` + the built JSON + `content.json` is criterion 4's literal ask and is for step 4 to add, the same way `test-guidelines.md`'s worker/tester split works for every other task) |
| 5 | `openapi.yaml`'s Region description gives a real example | `openapi.yaml`, `components/parameters/Region` |
| 6 | The four pinned-digest guards still pass, extended with a region exception | All four extended; 228/229 pass in that group (1 pre-existing unrelated failure, see above) |
| 7 | `engineering-decisions.md` E-9 | New entry, end of file |
| 8 | No new dependency, no network in tests | Confirmed (lockfiles unchanged; no new proxy/fetch surface) |

**On criterion 4:** I read this as the tester's own coverage requirement
(process.md: "criteria... become the tests"), not something the worker
pre-writes, and the brief's Constraints list the four *specific* files I did
extend without listing a fifth new closed-set test file — but flagging this
explicitly rather than assuming, since it's the one criterion this Handoff
doesn't point at a line of code for. If the tester's reading disagrees and
expects the worker to have already written that specific test, that's a
brief-clarity gap for `task-expander` to settle, not something to guess
silently either way.

### Review checklist (for the human reviewer to record who checked it)

Not closed by this worker — it names the reviewer as the closer
(`process.md`: "Content and curation... Human reading"). What I can report:
the specific 35-state assignment and its reasoning are written out in
`engineering-decisions.md` E-9 and above; the three deliberately-narrow
categories (`Great Basin` = Nevada only, `Pacific` = Hawaii only, `Pacific
West` = California only) and the two closest calls I made (Missouri →
`Great Plains` over `Great Lakes`/`South Central`, since it has no Great
Lakes shoreline and isn't Gulf-adjacent; Kentucky and West Virginia kept at
`Southeast` rather than split into a separate Appalachian category the
13-value set has no room for) are worth a second look before the checklist
is marked closed.

## Verdict

(tester writes this)

## Notes

- **The digest-recomputation approach generalises cleanly.** Because `region`
  is dropped from the hash entirely (rather than reset to a shared value the
  way `top_crops` is), the new pinned digests could be computed from the
  *pre-edit* tree, before any region value actually changed — deleting a key
  produces the same bytes regardless of what the key held, so the guard's
  correctness didn't depend on doing the digest math and the content curation
  in any particular order. That decoupling made it safe to finalise the
  50-state region assignment and the digest recomputation as two independent
  passes.
- **The brief undercounted how many rows actually needed a new string.** The
  Goal describes "eight" vs. "thirteen" region sets, but seven of the eight
  old values are themselves already members of the new thirteen-value set —
  only `Midwest` (12 states) was flatly invalid. The other ~35-state
  "judgment call" the Review checklist describes is real, but it is about
  whether an old value like `Northeast` or `Mountain West` is the *right*
  member of the 13-set for that state, not about the string being invalid —
  so only 21 of the 50 rows actually changed text, even though many more were
  reconsidered.
- **Criterion 4 is written as an outcome ("a test fails if...") rather than
  naming a file**, and the brief's Constraints list the four specific guard
  files to extend without naming a fifth. I read that as deliberate — the
  tester's own closed-set test, independent of anything I wrote — and said so
  in the Handoff rather than guessing either way silently.
- **Two pre-existing test failures**, unrelated to this task
  (`climate-kid-verify.test.ts` and `climate-kid.test.ts`, both asserting
  `frontend/`/`backend/` are untouched against a stale branch point that
  predates the backend's own addition), were already present before this
  task's first edit — confirmed by `git stash`. Left as found; fixing another
  task's frozen digest-guard assertion is outside this brief's Constraints.
- **Repo-wide `prettier --check` already fails on ~21 files** under
  `question-bank/src/`, most of which this task never touches. I formatted
  nothing beyond what I hand-wrote, to avoid folding an unrelated, large
  reformat into a content-curation PR — flagged in the Handoff for whoever
  owns that separately.
