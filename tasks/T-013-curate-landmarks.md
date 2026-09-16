# T-013 — Curate one landmark per state

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**From:** [`tasks.md`](../tasks.md) T-013
**Branch:** `claude/upbeat-dijkstra-zsrj2i` — this session's harness assigned it
and forbids pushing elsewhere (`CLAUDE.md` "Branches", `process.md` "When the
environment names the branch for you"). **This line is the authority**, not
`task/T-013-…`: it is the branch the PR is built from and the one every later
role pushes to. Check `git branch --show-current` against it before you start.
**PR:** [#43](https://github.com/Dkaattae/geo-discovery-zone/pull/43), opened
draft at expand time from the branch above. It stays draft until the reviewer
approves it.
**Fault:** —

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-16 | cse_01UCAF12nnRsrikmsuHDdZ5S |

---

## Goal

Give every US state one landmark a nine-year-old might plausibly have heard of,
held in the curated build input, so the `landmark` topic (T-026) has data to
generate "Where is `<landmark>`?" from. This is 50 hand-made decisions, not a
query: the plan's own entity example uses a curated landmark, and Wikidata will
happily offer a courthouse on the National Register.

**This is a content-and-curation task** (`process.md`, "Tasks this loop does not
fit"): the criteria below check *shape*, and the substance — is this really that
state's, would a child recognise it — is the **Review checklist** at the bottom,
closed by a person on the PR. Both are required. Neither substitutes for the
other.

## What the survey found — what is already true, and what is not

Read this before planning anything. The plumbing already exists; the work left is
the curation itself and the rebuild.

**Already true — do not rebuild any of it:**

- **The field exists.** `CuratedState.landmark?: string`
  (`question-bank/src/curated/us-states.ts:34`) and `Entity.landmark?: string`
  (`question-bank/src/types.ts:53`).
- **The fold-in exists.** `normalize.ts:139` already emits
  `...(curated.landmark ? { landmark: curated.landmark } : {})` — conditional, so
  a curated blank means the key is **absent** from the built entity, unlike
  `top_crops` and `fun_facts`, which always emit at least `[]`. No change to
  `normalize.ts` should be needed.
- **Colorado is already filled and already correct.**
  `landmark: "Rocky Mountain National Park"` (`us-states.ts:123`), present in both
  `question-bank/data/us-states/us-state-co.json` and
  `question-bank/sample-data/us-state-co.json`. It is also the literal value in
  `geoquizdataplan.md` §1.4's entity example — criterion 10 pins it for that
  reason.
- **The committed bank rebuilds byte-for-byte offline** — 51 tracked paths under
  `question-bank/data/us-states/` (T-010, `engineering-decisions.md` **E-6**),
  checked on every `bun test` by `committed-bank.test.ts` ("T-010 criteria 6 and
  8", line 181). Tracked bytes total ~58 KB against a 200 KB cap, so 50 short
  strings fit comfortably.
- **The precedent is T-011 (`fun_facts`, PR #41) and T-012 (`state_animal`, PR
  #42)** in this exact file: fill the table, regenerate the bank, never hand-edit
  built output. `question-bank/src/state-animals.test.ts` is the shape suite T-012
  produced and the model for this one.

**Not true yet — this task's actual work:**

- **`landmark` is 1 of 50.** Only Colorado sets it; only
  `us-state-co.json` and the sample carry the key.
- The bank has to be regenerated once the table is filled.

**Two traps, recorded so this task does not repeat them:** there is **no
`bun run lint` in `question-bank/`** — only `build`, `build:sample` and
`typecheck` (`question-bank/package.json`); T-011's criterion demanding one was
unsatisfiable and that gap is T-066. And a **live** build (`bun run build`, no
`--offline`) rewrites `sources.built_at` to wall clock, which breaks criterion 7.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

Throughout, **"the 50 tracked files"** means the 50 `us-state-<postal>.json`
files tracked under `question-bank/data/us-states/`, **"the landmark value"**
means the string at the `landmark` key of such a file, and **"the default
branch"** means `main` as of this task's branch point.

1. **Every state is accounted for, and no blank is silent.** The set of states
   whose tracked file has **no** `landmark` key is **exactly** the set of states
   this brief's `## Handoff` names as deliberately left blank, each with a
   reason. If the Handoff names none, all 50 tracked files carry the key; if it
   names *k* states, exactly 50 − *k* files carry it and the *k* without it are
   those states. (`CLAUDE.md`: prefer a blank field to a guessed one — but a
   blank has to be declared.) *Colorado is already filled; the other 49 are the
   work.*

2. **A blank is an absent key, not an empty one.** For any state left blank under
   criterion 1, its tracked file contains no `landmark` key at all — not `""`,
   not `null`, not `"none"`, not `"unknown"`. For every other state the value is
   a non-empty string.

3. **Every value is a name a child could be shown, not prose.** Each landmark
   value is between 4 and 48 characters inclusive (3 fails, 4 passes, 48 passes,
   49 fails), equals its own `trim()`, contains no double space, contains no
   newline or tab, begins with an uppercase letter, and is not entirely
   uppercase.

4. **No value is reference-book prose, a citation or a location gloss.** No
   landmark value contains a comma, semicolon, colon, parenthesis, slash, or the
   substring `http`; none ends with a full stop (an interior one, as in
   `St. Louis` or `Jr.`, is fine); and none contains, case-insensitively, any of:
   `located`, `famous`, `tourist`, `attraction`, `known for`, `national register`,
   `you can`, `is a `. ("Great Smoky Mountains National Park" passes; "The Alamo,
   in San Antonio" and "Gateway Arch (St. Louis, Missouri)" both fail.)

5. **No two states share a landmark, and none contains another.** Compared
   case-insensitively after trimming, the landmark values across the 50 tracked
   files are all distinct, and no value is a substring of any other value.
   (T-026's template is "Where is `<landmark>`?", so the landmark → state
   direction has to have exactly one answer. "Yellowstone" alongside "Yellowstone
   National Park" fails this, and would be two right answers to a nine-year-old —
   the reader-collision problem T-026 records for `state_animal`.)

6. **The text lives in the build input, not in built output.** Every landmark
   value appearing in any of the 50 tracked files also appears verbatim as a
   `landmark` value in `question-bank/src/curated/us-states.ts`, and every
   `landmark` value in that file appears in exactly one tracked file — the one
   for its own state (matched by `postal` → `us-state-<postal>.json`).

7. **The bank is built, not hand-edited.** Running
   `bun run src/build.ts --offline --out <temp dir>` from `question-bank/` with no
   network available reproduces all 51 tracked paths byte-for-byte, twice in a
   row, and `sources.built_at` in every tracked file is still
   `2026-08-04T16:05:35.000Z`. (This is `committed-bank.test.ts`'s existing
   describe block "T-010 criteria 6 and 8", which must still pass against the
   *new* tracked bytes.)

8. **The committed sample stays in step with the bank.**
   `question-bank/sample-data/us-state-co.json` equals the tracked
   `question-bank/data/us-states/us-state-co.json` in every field except
   `sources.built_at`, including `landmark`. (`committed-bank.test.ts` "T-010
   criterion 4", line 154.)

9. **Nothing but `landmark` moves in the bank.** For each of the 50 tracked
   files, the only difference from the same file on the default branch is the
   presence or value of a `landmark` key; `region`, `climate_kid`,
   `state_animal`, `top_crops`, `fun_facts`, `borders`, the ranks and `sources`
   are unchanged. Specifically: all 50 still carry `state_animal` with the same
   values as on the default branch, and the set of states carrying `climate_kid`
   is still exactly {Colorado} — T-014 owns that field and edits the same rows.
   `question-bank/data/us-states/index.json` is byte-identical to the default
   branch's.

10. **Colorado's landmark is unchanged.** `us-state-co.json`, the sample, and the
    curated table all still carry exactly `Rocky Mountain National Park`. It is
    the value `geoquizdataplan.md` §1.4's entity example prints, and changing it
    here would make the plan wrong without saying so. *Already satisfied by
    `us-states.ts:123`; this criterion exists to stop it drifting.*

11. **A landmark that names its own state is disclosed, not hidden.** The set of
    states whose landmark value contains that state's own name
    case-insensitively (as in Colorado's, which contains no state name, versus a
    hypothetical "Utah Olympic Park") is **exactly** the set the `## Handoff`
    lists under that heading, with a reason for each. Such a value is allowed —
    inventing a different landmark to dodge it would be inventing data — but
    "Where is `<landmark>`?" answers itself when it happens, and T-026's author
    needs the list.

12. **Everything a child will read can be read in one place.** The `## Handoff`
    lists all 50 states, each with the exact landmark string shipped for it (or
    the reason it is blank), **and whether the landmark spans more than one
    state** (Great Smoky Mountains National Park, Lake Tahoe and Yellowstone are
    the obvious cases), and where the pick was checked — in a form a person can
    read top to bottom without opening 50 files.

13. **Nothing unreviewed, live or new is committed.** The bytes `reviewed": false`
    appear in no file tracked under `question-bank/data/` or
    `question-bank/sample-data/`; no `*.review.json` path under
    `question-bank/data/us-states/` is tracked; no `package.json` or lockfile in
    the repo gains a dependency; no test added or changed by this task performs a
    network request or mocks `fetch`.

14. **Nothing already verified is weakened.** No test is deleted from
    `question-bank/src/committed-bank.test.ts`,
    `question-bank/src/data-us-states.test.ts`,
    `question-bank/src/fun-facts.test.ts`,
    `question-bank/src/state-animals.test.ts`,
    `question-bank/src/normalize.test.ts` or
    `question-bank/src/sparql.test.ts`, and no assertion in any of them is
    loosened. `bun test` and `bun run typecheck` pass in `question-bank/`, and the
    `frontend/` and `backend/` suites are untouched. (There is no `bun run lint`
    in `question-bank/` — do not add one here; that is T-066.)

## Out of scope

- **Serving these landmarks to the app.** Nothing in `backend/`, `frontend/` or
  `openapi.yaml` changes — `openapi.yaml:1489` already declares `landmark` on the
  entity schema. The bridge from the pipeline bank to the served bank is
  **T-040**; growing the served bank to 50 states is **T-050**.
- **The `landmark` question template, its distractors, and landmark images** —
  that is **T-026** (and T-022 for distractor strategy). The plan's image-format
  landmark question (§1 templates table) needs assets nobody has curated; this
  task produces one string per state and nothing else.
- **`landmark` as an entity *type*.** `EntityType` already includes `"landmark"`
  (`types.ts:13`) for standalone landmark entities. This task fills a string field
  on state entities; it creates no landmark entities, no ids, no coordinates.
- **The other curated fields** — `climate_kid` (T-014), `top_crops` (T-015),
  `state_animal` (done, T-012), `fun_facts` (done, T-011). Do not fill them while
  you are in the file; criterion 9 enforces that, and T-014 edits the same rows.
- **A second landmark per state, or a landmark list.** The field is a single
  string. If a state has two obvious candidates, pick one and say in the Handoff
  what the other was. Changing the schema is a separate decision.
- **Adding a source, coordinate or citation field to `CuratedState`.**
  Provenance for this task lives in the `## Handoff` (criterion 12), which is
  what the human review reads.
- **Running the live pipeline.** A live run is optional raw material, never a
  deliverable: it rewrites `sources.built_at` and would break criterion 7, and it
  drafts a `fun-facts.review.json` that must stay uncommitted.
- **T-063** (scheduled refresh), **T-064** (deleting `sample-data/`), **T-065**
  (stale suite counts), **T-066** (no `lint` in `question-bank`), **T-016**
  (Alaska's missing highest point), **T-017** (region vocabulary). Regenerating
  `sample-data/us-state-co.json` here is criterion 8, not T-064.
- **`process.md`, `CLAUDE.md`, `.claude/`, workflows.** Those are `P` tickets and
  the loop may not touch them.

## Constraints

- **Files expected to change:** `question-bank/src/curated/us-states.ts` (up to 49
  new `landmark` entries), the tracked entity files under
  `question-bank/data/us-states/`, `question-bank/sample-data/us-state-co.json`
  only if Colorado's own bytes move, a new or extended test file under
  `question-bank/src/`, and this brief. Nothing else is expected;
  `normalize.ts:139` already folds the field in.
- **Never hand-edit a file under `question-bank/data/us-states/` or
  `question-bank/sample-data/`.** Regenerate them:
  `cd question-bank && bun run src/build.ts --offline --out data/us-states` and
  `bun run build:sample`. E-6 exists because hand-edited built output is destroyed
  by the next rebuild.
- **`sources.built_at` must stay `2026-08-04T16:05:35.000Z`** — the fixture's
  capture instant, which only the offline path preserves and which is what makes
  the rebuild byte-identical.
- **Choosing which landmark.** Prefer something a nine-year-old outside that state
  could plausibly have heard of — a national park, a monument, a bridge, a
  building — over the state's own most historically significant site. Prefer
  natural and built landmarks that can be shown in a picture later (T-026's image
  format) over events, institutions or districts. **Where a landmark straddles a
  border, assign it to one state and say so** (criterion 12): Great Smoky
  Mountains National Park is TN and NC, Yellowstone is mostly WY, Lake Tahoe is CA
  and NV. If a state has no defensible kid-recognisable landmark, leave it blank
  and say so — `CLAUDE.md`: a wrong answer in a quiz that claims to teach is worse
  than a missing one.
- **Nothing that is not suitable for children.** No disaster memorials, no battle
  sites chosen for the casualty count, no casinos. A landmark that needs a content
  warning is not the one to ship to a nine-year-old.
- **The 200 KB cap** on everything tracked under `question-bank/data/` still holds
  (`committed-bank.test.ts` "T-010 criterion 5"). It is ~58 KB today, so there is
  room, but it is a real ceiling.
- **No dependency without asking** (`CLAUDE.md` "Packages"). `bun` only.
- **No network in tests, and never mock `fetch`** (`test-guidelines.md`). The
  existing rebuild tests run with all six proxy spellings pointed at
  `http://127.0.0.1:1`; follow that pattern (`state-animals.test.ts:47`).
- **Reviewer, note:** this PR is outside the envelope by construction — it is text
  a child will read (`process-decisions.md` **D-4a**, `process.md` step 6). Flag
  it; do not mark it ready with no note. The Review checklist below has to be
  closed by a named person on the PR.

## Context

**Required reading for the worker and the tester**, not background.

- **What the field looks like when filled:** `geoquizdataplan.md` **§1.4**'s
  entity record example — `"landmark": "Rocky Mountain National Park"`. That
  string is the shape and tone model, and criterion 10 pins it.
- **What the field is for:** `tasks.md` **T-026**, the topic table — `landmark` →
  "Where is `<landmark>`?" → needs T-013. Read the paragraphs under it on how
  `state_animal`'s duplicates made the reverse direction unusable for 20 states;
  criterion 5 exists so this field does not repeat that.
- **Why built output is not the home for curated text:**
  `engineering-decisions.md` **E-6**.
- **Content rules:** `CLAUDE.md` "Content rules" (prefer a blank field to a
  guessed one), `process.md` "Tasks this loop does not fit" (content and curation
  are verified by human reading plus shape tests), `process-decisions.md` **D-4a**.
- **The code:**
  - `question-bank/src/curated/us-states.ts` — `CuratedState` at lines 23–43
    (`landmark` at line 34), the 50 rows from line 45. Colorado (line 117) is the
    only row with `climate_kid` and `landmark` filled and is the model row.
  - `question-bank/src/normalize.ts:123–152` — entity assembly; line 139 is the
    `landmark` fold-in, already written and conditional.
  - `question-bank/src/types.ts:33–59` — `Entity`, `landmark` at line 53.
  - `question-bank/package.json` — the only scripts are `build`, `build:sample`
    and `typecheck`.
- **The precedent to copy, including its test shape:**
  `question-bank/src/state-animals.test.ts` (T-012) — the file header explains
  which criteria are tree-shaped tests and which are `git diff` observations
  recorded in the Verdict, and why (CI checks out at `fetch-depth: 1`, so
  `origin/main` is not there). Criterion 9 here has the same property.
- **The tests that already constrain this**
  (`question-bank/src/committed-bank.test.ts`): completeness (line 117), sample ↔
  bank equality (line 154), the 200 KB cap (line 170), offline rebuild
  byte-identity (line 181), no `reviewed: false` (line 237).
- **Where the project thinks this stands:** `PROGRESS.md`, "Content — the big
  one" — "`landmark` and `climate_kid` are **1 of 50**".

## Review checklist — non-testable tasks only

A test can confirm every landmark is a well-formed distinct string. Only a person
can confirm it is the right one. **Record in the PR who checked each box and
when**; the reviewer flags this PR for that reason (D-4a).

- [ ] Every landmark is genuinely in the state it is filed under — and for any
      that straddles a border, the assignment stated in the Handoff is defensible.
- [ ] A nine-year-old who does not live in that state could plausibly have heard
      of it, or could recognise a picture of it.
- [ ] Every landmark still exists and is still open to the public under the name
      shipped (no renamed, closed or demolished sites).
- [ ] Nothing is unsuitable for children — no disaster memorial, battle site
      chosen for its casualties, or casino.
- [ ] Each name is the one commonly used, spelled and capitalised as a visitor
      would see it on a sign.
- [ ] Any state left blank is genuinely better blank than filled, for the reason
      the Handoff gives.
- [ ] Read as a set of 50, the picks are varied — not forty national parks — and
      none of them gives away its own answer in a way criterion 11 did not catch.

## Handoff

Written by `worker` before the tester runs. **Always written, even when nothing
was built.** Criteria 1, 11 and 12 all read this section, so it is a deliverable
and not a note: the per-state table, the declared blanks, the self-naming list,
and the spans-more-than-one-state column.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

Filled in while working.
