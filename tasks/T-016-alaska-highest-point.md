# T-016 — Alaska has no `P610` highest point

**Status:** `pass`
**Next step:** `reviewer`
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
| worker | 2026-09-18 | `cse_01DcPFTAMrySYcEfrLFRiZHc` |
| tester | 2026-09-18 | `cse_01DcPFTAMrySYcEfrLFRiZHc` — same id as `worker`; see the Verdict's independence note |

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

**TL;DR:** All 16 criteria are implemented — a curated `highest_point` fallback
for Alaska, folded in only when Wikidata's own label is absent, with a new
build warning for any future gap. The bank was rebuilt offline (one line added
to `us-state-ak.json`, nothing else moved). The three pinned-digest guards are
neutralised for Alaska only, with their own digests unchanged. `bun test`
(1142 pass) and `bun run typecheck` are both green. The Denali / Mount McKinley
call is left to the Review checklist, as instructed — this ships "Denali"
because that is what `landmark` already says.

### Survey check

The brief's survey (`## What is already true`) still held: the field, query,
parsing and conditional fold-in all existed unchanged; Alaska was still the
only state without a `highest_point` name; `highest_point_m: 6190` was still
correct; `landmark: "Denali"` was still at `curated/us-states.ts:85`; and no
warning fired for a missing `highest_point` before this task. Nothing had
landed on this since the survey date (`284b8bc`).

### What changed, file by file

- **`question-bank/src/curated/us-states.ts`** — added an optional
  `highest_point?: string` field to `CuratedState`, documented as a gap-filler
  only (never a primary source), with provenance pointing at E-8. Set
  `highest_point: "Denali"` on Alaska's row, directly beside its existing
  `landmark: "Denali"`. No other row touched.
- **`question-bank/src/normalize.ts`** — the fold-in now computes
  `const highestPoint = row.highestPoint ?? curated.highest_point;` and emits
  `highest_point` from that (Wikidata wins whenever present; curated only fills
  the gap). Added `if (!highestPoint) warnings.push({ entity: id, field:
  "highest_point", message: "missing" })`, in the same shape and the same
  place as the existing `capital`/`centroid` checks. `build.ts`'s `report()`
  needed no change — it already prints every warning generically
  (`${warning.entity}.${warning.field}: ${warning.message}`), so criterion 8's
  "prints that warning alongside the ones it already prints" was already true
  of the existing code, and criterion 8 is met purely by the warning now
  existing to print.
- **`question-bank/data/us-states/us-state-ak.json`** — rebuilt offline
  (`bun run src/build.ts --offline --out <tmpdir>`, then the rebuilt file
  copied over the tracked one; never hand-edited). Diffed against the
  pre-change tracked file: exactly one line added
  (`"highest_point": "Denali",`, placed between `landmark` and
  `highest_point_m` by the object's own field order), nothing removed or
  changed. `highest_point_m` is still `6190`; `sources.built_at` is still
  `2026-08-04T16:05:35.000Z`.
- **The other 49 state files, `data/us-states/index.json`, and
  `sample-data/us-state-co.json`** — confirmed byte-identical to the pre-change
  tree (`git diff --stat` shows only the one Alaska line across the whole
  bank).
- **`question-bank/src/landmarks-verify.test.ts`**,
  **`question-bank/src/climate-kid-verify.test.ts`** — both already parse each
  tracked file to an object and `delete` specific keys before re-hashing
  (`landmark`/`climate_kid`, plus a conditional exception for Colorado). Added
  one more conditional line to each: `if (file === "us-state-ak.json") delete
  parsed["highest_point"];`, right beside the existing Colorado exception, with
  a comment explaining why it is asymmetric (the other 49 states already
  carried `highest_point` at each suite's own pinned baseline — it has existed
  since the pipeline's first commit — so their pinned digests already include
  it; only Alaska's is new). No pinned digest constant was touched, and no
  existing assertion was weakened, skipped or deleted.
- **`question-bank/src/top-crops-verify.test.ts`** — this file's digest check
  works on raw text (a regex swaps the `top_crops` block back to `[]`) rather
  than `JSON.parse`, so the same fix needed a textual route: a new
  `ALASKA_HIGHEST_POINT_LINE` regex and `withoutAlaskaHighestPoint(file, raw)`
  helper strip the one new line for `us-state-ak.json` only, applied in the
  existing "nothing else in the bank moves" digest test. Added one new test —
  "the Alaska neutralisation actually removes the highest_point line" —
  mirroring this file's own pre-existing "the restoration actually removes the
  crops" pattern, which is criterion 11's proof that the digest check cannot
  pass vacuously.
- **`question-bank/src/highest-point.test.ts`** (new) — the worker-written
  suite alongside the data, covering what no existing suite reached: the
  fallback's fill-vs-never-override logic (criterion 2, using hand-built
  minimal `WikidataStateRow` objects, not the network) directly against
  `normalizeUsStates`; the new warning firing exactly when both sources are
  absent and staying silent otherwise (criterion 8); a full-fixture run
  producing zero `highest_point` warnings (criterion 9, reading the committed
  fixture off disk — no network, no build spawned); and Alaska's content shape
  — non-empty, equal to `landmark` in both the curated table and the tracked
  file, and free of parens/`/`/comma/` or ` (criteria 1, 3, 4).
- **`engineering-decisions.md`** — added **E-8**, the next free number,
  covering: the fallback fills a gap only and never overrides a live Wikidata
  value; Alaska is the only state relying on it today and why (the fixture's
  one row with no `P610` label); `highest_point` and `landmark` are pinned to
  one string so the Denali/Mount McKinley call is a single edit; and what this
  task deliberately did not do (the `highest_point_m` unit bug, filed as
  T-069; changing the query or the fixture).

### Criteria → where the behaviour lives

| # | Criterion | Where |
|---|---|---|
| 1 | 50/50 files carry `highest_point` | rebuilt bank; `highest-point.test.ts` criteria-1 block |
| 2 | fallback fills gap, never overrides | `normalize.ts` fold-in; `highest-point.test.ts` criterion-2 block |
| 3 | AK's two fields equal, editing one alone reddens a test | `curated/us-states.ts` AK row; `highest-point.test.ts` "equals its landmark" tests |
| 4 | AK value is one plain name | `curated/us-states.ts` AK row; `highest-point.test.ts` "one plain name" test |
| 5 | AK file: exactly one line added | verified by direct diff (see above); no automated test added beyond the existing rebuild-byte-identity suites, since this is a one-time diff property of the committed tree, not a build invariant |
| 6 | other 49 + index.json + sample untouched | verified by `git diff --stat`; covered ongoingly by `committed-bank.test.ts` and the three digest guards' byte-identity checks |
| 7 | built not hand-edited, rebuild-twice stable | unchanged: `committed-bank.test.ts`, `landmarks-verify.test.ts`, `climate-kid-verify.test.ts` all already spawn `rebuildOffline` twice and diff |
| 8 | missing-highest_point warning shape | `normalize.ts`; `highest-point.test.ts` criterion-8 block |
| 9 | zero warnings on full fixture build | `highest-point.test.ts` criterion-9 block; confirmed manually via `bun run src/build.ts --offline` (no warning line printed) |
| 10 | three digest guards pass, nothing re-pinned | `landmarks-verify.test.ts`, `climate-kid-verify.test.ts`, `top-crops-verify.test.ts` — Alaska-only neutralisation added, no pinned constant touched |
| 11 | neutralisation proven non-vacuous | `top-crops-verify.test.ts`'s new "actually removes the highest_point line" test |
| 12 | `bun test` and typecheck green | confirmed below |
| 13 | no network, no `fetch` mock | `highest-point.test.ts` calls `normalizeUsStates` directly and reads the fixture off disk; no subprocess, no `fetch` |
| 14 | no new dependency | `bun install --frozen-lockfile` reported no changes; `git diff --stat package.json bun.lock` is empty |
| 15 | nothing outside scope changed | `git diff --stat` (full repo) shows only the 7 files listed above |
| 16 | `engineering-decisions.md` entry | E-8, added |

### What I deliberately did not do, and why

- **Did not touch the Review checklist boxes.** The Denali/Mount McKinley call
  is a human content decision this task explicitly does not make; shipped
  "Denali" because that is `landmark`'s current value, unchanged by this task.
- **Did not add a per-criterion automated check for criterion 5's "exactly one
  line, no line changed or removed"** beyond the direct diff recorded above and
  the pre-existing rebuild-byte-identity suites. That property is about the
  one-time commit, not an ongoing build invariant `normalizeUsStates` could
  assert about itself — the existing byte-identity tests (rebuild twice,
  diff against tracked) are what actually re-check it on every future run.
- **Did not touch `build.ts`'s `report()`.** It already prints every warning
  generically; no change was needed for criterion 8's "prints alongside the
  ones it already prints".
- **Did not fix the `highest_point_m` unit bug** (Arizona/Oregon/Nebraska/
  Kansas/Iowa carrying feet under a metres key) — out of scope, already filed
  as T-069.
- **Did not change `US_STATES_QUERY` or re-capture the fixture** — out of
  scope per the brief, and would move all 50 files instead of just Alaska's.

### Contradictions found

None. The survey held; the route (curated fallback) matched what the approved
brief specified; no criterion was ambiguous or impossible to satisfy as
written.

### How to run what I touched

```
cd question-bank
bun install --frozen-lockfile   # only needed once per clone; node_modules is gitignored
bun test                        # 1142 pass, 0 fail
bun run typecheck               # clean
bun test src/highest-point.test.ts   # the new suite alone: 10 pass
```

To reproduce the rebuild that produced the tracked `us-state-ak.json`:

```
bun run src/build.ts --offline --out /tmp/check
diff data/us-states/us-state-ak.json /tmp/check/us-state-ak.json   # empty
```

## Verdict

Written by `tester`.

**TL;DR: pass.** All 16 criteria hold, checked against the criteria's own wording
and against `origin/main`'s committed bytes rather than against the
implementation. The whole `question-bank` suite is green at **1192 pass / 0
fail** (1142 pre-existing + 50 added here) and `bun run typecheck` is clean. 14
deliberate mutations were made and every one turned the expected test red; all
were reverted. **Next: `reviewer`** — and note that the Review checklist (Denali
vs. Mount McKinley) is still unticked and is not the loop's to settle.

### Independence — read this before trusting the verdict

**This was fresh-context attestation, not a distinct-session-id proof.**
`$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01DcPFTAMrySYcEfrLFRiZHc`, which is
already in the Sessions table as `worker`. Under this harness every agent spawned
inside one top-level session shares an id, so that check cannot distinguish a
genuinely separate session from a reused one, and I am not claiming it passed.

What I can attest: I am a freshly spawned agent with my own context window. I
never saw the worker's or the expander's conversation — only the committed repo
state, the brief, and my own prompt. That is real independence, but it rests on
the orchestration having spawned me correctly, which I cannot verify myself. It
is weaker than the driven path's separate `--session-id`. Same posture as
T-006 / T-012 / T-013 / T-014's testers.

`git branch --show-current` is `claude/gallant-pasteur-jtdovj`, matching the
`Branch:` header. No mismatch to resolve.

### Handoff check

The `## Handoff` exists and every file it names is on this branch.
`git diff --stat origin/main..HEAD` is exactly the 7 files it lists, plus the
brief and `tasks.md`. `tasks.md` is the **expander's** commit (`b9be0d5`, the
T-069 entry) and not the worker's — that is the expander's own remit
(`process.md` step 2) and the brief's Out of scope explicitly routes spill-over
work there, so it is not a criterion-15 breach.

Every Handoff claim I re-checked held, including the counts: `bun test` before
my file was 1142 pass / 0 fail, and `bun test src/highest-point.test.ts` alone is
10 pass. The one place the Handoff under-claims is criterion 9 — see that row.

### Criterion → verdict → evidence

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | `git ls-files` finds exactly 50 state files; all 50 carry a non-empty string `highest_point`. Mutation **M11** (strip it from Wyoming) reddens this. |
| 2 | pass | `normalizeUsStates` returns the curated value when the row has no label, the Wikidata label when it does, and no key when neither exists. Mutations **M5** (inverted precedence) and **M7** (fallback removed) each redden it. Also checked the fixture's real Alaska row genuinely has no `highestPoint`, so the gap case is not hypothetical. |
| 3 | pass | Equal in both places, and proven by mutation in all four directions: **M1** curated `highest_point` alone → 4 red; **M2** curated `landmark` alone → 3 red; **M3** tracked `highest_point` alone → 5 red; **M4** tracked `landmark` alone → 7 red. |
| 4 | pass | Shipped value `"Denali"` — non-empty, no `(`, `)`, `/`, `,`, no `" or "`. Asserted against the **tracked file**, not only the curated table. |
| 5 | pass | Checked byte-for-byte, not by eye. `git diff --unified=0` is one `@@ -20,0 +21 @@` hunk adding `  "highest_point": "Denali",` — nothing removed, nothing changed. Committed as a test: the tracked file with that one line removed digests to `744c58bd…`, the SHA-256 of `origin/main:…/us-state-ak.json`. `highest_point_m` is `6190`; `sources.built_at` is `2026-08-04T16:05:35.000Z`. |
| 6 | pass | All 49 other files, `index.json` and `sample-data/us-state-co.json` digest to their `origin/main` SHA-256s — 51 pins computed here from `git show origin/main:<path>`, independent of the three existing guards' pins. |
| 7 | pass | `committed-bank.test.ts` already runs `rebuildOffline` twice and compares all 51 paths. Independently reproduced: a real `--offline` build into a temp dir is byte-identical to the tracked bank, and differs from a same-build on the `origin/main` worktree by exactly the one Alaska line. |
| 8 | pass | Warning has `entity: "us-state-co"`, `field: "highest_point"`, and the set of warned entities equals the set of entities with no `highest_point` key. **The "report prints it" half was checked end to end by hand** — a *derived* fixture (the committed recording untouched) with Colorado's `highestPoint` and `capital` dropped makes the real CLI print `2 warning(s):` / `us-state-co.capital: missing` / `us-state-co.highest_point: missing`, exactly the "alongside the ones it already prints" the criterion asks for. It could not be committed as a test: `top-crops-verify.test.ts` (T-015 criterion 8) and `climate-kid-verify.test.ts` (T-014 criterion 16) forbid any `*.test.ts` from spawning `build.ts`, and `rebuildOffline` returns written files rather than stdout. What is committed instead asserts the property behind the printed line — `report()` iterates its warnings and filters none by field. Mutations **M6** (delete the warning) and **M14** (add a field allow-list to `report()`) each redden it. |
| 9 | pass | Measured rather than assumed: `bun run src/build.ts --offline` on a worktree at `origin/main` prints **no warning line at all** — count 0. The same build on this branch also prints none. Both halves pinned as tests, including one that asserts `warnings` is `[]` for *every* field, not just `highest_point`. Note the worker's own criterion-9 test hand-built rows with only two fields, so it could not have caught a new warning of another kind; this one parses the fixture through `parseUsStates`. |
| 10 | pass | No digest literal in the three guards is re-pinned and no assertion is deleted, skipped or loosened — confirmed from the diff and asserted as a test (no `.skip`/`.todo`, `expect()` counts intact, no ungated `delete parsed["highest_point"]`). The asymmetry is independently verified: at all three guards' pinned baselines (`e587ec1`, `13a735f`, `eda7fde`) 49 files carried `highest_point` and only `us-state-ak.json` did not. Mutation **M8** (strip for all 50) reddens `landmarks-verify`; **M9** (remove the strip) reddens `climate-kid-verify`; **M10** (no-op the helper) reddens `top-crops-verify`. |
| 11 | pass | The worker proved the textual route only. Both routes are now proven: the textual strip changes the bytes, drops the value and lands exactly on `origin/main`'s digest; the `JSON.parse` + `delete` route used by the other two guards changes the serialisation and removes the key. Plus a check that the same strip would move a non-Alaska file, so the Alaska-only gate is load-bearing. |
| 12 | pass | `bun test` in `question-bank/`: **1192 pass, 0 fail**, 18199 expects, 14 files. `bun run typecheck`: clean. No lint step exists for this package (`ci.yml:118`). |
| 13 | pass | Whole suite re-run with all six proxy spellings at the dead loopback port — no difference. No `fetch` mock anywhere; the one build a test here runs goes through `offline-rebuild.ts`. **My first draft of this suite broke it** and the repo's own guards caught me: spawning `build.ts` directly tripped T-014 criterion 16 and T-015 criterion 8 the moment the file was staged. Reworked to use `rebuildOffline`; both guards green. |
| 14 | pass | `git diff origin/main..HEAD -- question-bank/package.json question-bank/bun.lock` is empty. |
| 15 | pass | Only `question-bank/`, `engineering-decisions.md`, the brief and (expander-only) `tasks.md` changed. `openapi.yaml`, `backend/`, `frontend/` untouched. Alaska's `landmark` value is identical to `origin/main`. |
| 16 | pass | E-8 is the next free number and the highest; it states the gap-fill-never-override rule, names Alaska as the only state relying on it and why (the fixture's one row with no `P610` label), and records the `landmark` pinning so the Denali call is one edit. Mutations **M12** (renumber) and **M13** (strip the never-override claim) each redden it. |

### Mutations made, and what each did

Every one was reverted; `git status` afterwards shows only my new, untracked
test file, and the full suite is back to 1192/0.

| # | Mutation | Result |
|---|---|---|
| M1 | curated Alaska `highest_point` → `"Mount McKinley"`, `landmark` left | 4 red, incl. the offline-rebuild byte check |
| M2 | curated Alaska `landmark` → `"Mount McKinley"`, `highest_point` left | 3 red |
| M3 | tracked `us-state-ak.json` `highest_point` value changed alone | 5 red, incl. two rebuild guards |
| M4 | tracked `us-state-ak.json` `landmark` value changed alone | 7 red |
| M5 | `normalize.ts`: `curated.highest_point ?? row.highestPoint` (precedence inverted) | 2 red — both "Wikidata wins" tests |
| M6 | `normalize.ts`: warning push deleted | 4 red, incl. the end-to-end CLI report check |
| M7 | `normalize.ts`: curated fallback dropped | 10 red across criteria 1, 2, 8, 9 |
| M8 | `landmarks-verify`: Alaska strip made unconditional (all 50) | 2 red — proves the 49 must keep the key |
| M9 | `climate-kid-verify`: Alaska strip removed | 1 red |
| M10 | `top-crops-verify`: `withoutAlaskaHighestPoint` made a no-op | 2 red, incl. the worker's own non-vacuity test |
| M11 | `highest_point` deleted from `us-state-wy.json` | 4 red across criteria 1, 6, 10 |
| M12 | `engineering-decisions.md`: `E-8` heading renumbered | 4 red |
| M13 | E-8's "never overrides" claim rewritten to the opposite | 1 red |
| M14 | `build.ts` `report()`: warnings filtered to exclude `highest_point` | 1 red |

### What I did not check, and one thing worth the reviewer's eye

- **The Review checklist is untouched**, as instructed. Denali vs. Mount McKinley
  is a human content call and out of the loop's hands. It is still unticked, and
  this PR ships `"Denali"`.
- **`frontend/` tests were not run** — `node_modules` is absent there and this
  task changes nothing under `frontend/`. Criterion 12 scopes to `question-bank/`.
- **For the reviewer, not a criterion:** the three digest guards now each carry a
  task-specific neutralisation (`us-state-co` for `climate_kid`, `us-state-ak`
  for `highest_point`). That is correct here and each exception is commented with
  its reason, but the pattern is accreting one conditional per task. `tasks.md`
  T-068's "One thing it must not miss" already flags this wall; it may be worth a
  queue entry before a fourth field lands.

### Test file added

`question-bank/src/highest-point-verify.test.ts` — 50 tests, named per
criterion, expected values derived from the criteria and from `origin/main`'s
bytes. It does not duplicate `highest-point.test.ts`; it adds the byte-pinned
`origin/main` comparison (criteria 5 and 6), the all-fields warning count
(criterion 9), the report's no-allow-list property (criterion 8), the
guard-weakening checks (criterion 10) and the second neutralisation proof
(criterion 11).

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

- Surveyed on `284b8bc` (merge of PR #46, T-015). `tasks/` held only `README.md`
  and `TEMPLATE.md` — the previous cycle swept cleanly.
- Sixteen criteria for an `S` task looks heavy; ten of them are guards and
  negatives that cost a line of test each. The task itself is one curated value,
  one conditional fold-in and one warning. The light path is unavailable anyway:
  this ships text a child will read (`process.md`, "The light path").
- **Worker note (2026-09-18).** The survey held exactly as written; nothing
  needed re-checking beyond confirming the same commit's state. The one thing
  worth flagging for whoever reads this next: `highest_point` turned out to
  have existed in 49 of the 50 tracked files since the pipeline's very first
  commit (`git log -p --follow` on `us-state-al.json` shows it in "Add
  question-bank pipeline"), predating T-013/T-014/T-015 entirely — which is
  *why* those three tasks' pinned digests already include it for every state
  but Alaska, and why the neutralisation this task adds is asymmetric (strip
  for Alaska only, leave the other 49 alone) rather than symmetric. Worth
  knowing before assuming a "strip field X for all 50" pattern generalises to
  a future field that does *not* predate every guard the way this one did.
- `node_modules/` was absent at the start of this session (fresh clone,
  gitignored) — `bun install --frozen-lockfile` was needed before `bun run
  typecheck` would run at all. It reported no lockfile changes, consistent
  with criterion 14.
- No dependency was added; no product decision was made (the Denali/Mount
  McKinley call is explicitly left to the Review checklist below); no
  criterion was ambiguous, wrong or impossible as written.
