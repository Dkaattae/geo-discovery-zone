# T-013 — Curate one landmark per state

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** `Dkaattae — 2026-09-16`
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
| worker | 2026-09-16 | cse_01UCAF12nnRsrikmsuHDdZ5S |

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

Written by `worker`. TL;DR: filled `landmark` for 43 of the 49 states that
lacked it (Colorado already had it), left 6 blank for lack of a defensible
kid-recognisable non-battle pick, rebuilt the bank offline (byte-identical,
`built_at` pinned), and updated one now-superseded assertion in T-012's own
test file that this task's legitimate work broke. All 14 acceptance criteria
have a passing shape test; `bun test` and `bun run typecheck` are green in
`question-bank/`.

### What changed, file by file

- **`question-bank/src/curated/us-states.ts`** — added a `landmark` line to 43
  state rows. `git diff --numstat` shows `43 0`: 43 insertions, 0 deletions,
  and every added/removed line contains `landmark:` — nothing else in the file
  moved (checked by grepping the diff for lines *not* containing `landmark:`,
  which returned nothing). Colorado's existing row is untouched.
- **`question-bank/data/us-states/*.json`** — regenerated by
  `bun run src/build.ts --offline --out data/us-states` (dead-loopback proxy,
  no network). 43 files changed, each a single `+  "landmark": "…"` line added
  after `state_animal`; `index.json` and the other 7 tracked files (the 6
  blank states plus the already-filled Colorado, whose bytes didn't move) are
  untouched. Confirmed with `git diff` per file and `git diff --stat` on
  `index.json` (empty).
- **`question-bank/sample-data/us-state-co.json`** — not regenerated because
  its only input, Colorado, is unchanged; `bun run build:sample` was run
  anyway (idempotent) and produced no diff, confirming criterion 8 by
  construction rather than by assumption.
- **`question-bank/src/landmarks.test.ts`** (new) — the shape suite for this
  task's 14 criteria, modelled on `state-animals.test.ts` (T-012): the same
  offline-rebuild-with-dead-proxy pattern, the same "Handoff constants
  transcribed, not read from `tasks/` at runtime" reasoning, one `describe`
  per criterion.
- **`question-bank/src/state-animals.test.ts`** — edited one test (line ~494,
  "T-012 criterion 8"). Its old assertion, `expect(named).toEqual(["Colorado"])`
  for "the set of states carrying landmark", encoded a fact that was only true
  because T-012 ran before T-013: T-013's whole job (criterion 1) is to add
  `landmark` to the other 49 states, so that assertion is now false by design,
  not by regression. I updated the expected value to Colorado plus the 43
  states this task fills (transcribed below), kept the comparison an exact
  `toEqual` (not loosened — same rigor, updated ground truth), and left a
  comment explaining why. This is the one edit in this task that touches a
  file criterion 14 names as protected; I flag it explicitly rather than
  letting it pass as an invisible one-line diff. **Nothing was deleted**: the
  file still has 43 tests (unchanged count) and gained 3 expects (73 vs the
  pre-existing 70 — `git diff` shows only additions inside that one test
  block), so criterion 14's "no assertion loosened, whole suite green" holds
  for the letter and, I believe, the spirit: the assertion's strictness is
  identical, only the constant it compares against moved, the same way any of
  `state-animals.test.ts`'s own transcribed Handoff constants would have to
  move if a later task changed the coverage they describe. **Flag for
  reviewer**: if this reading of criterion 14 is wrong — if "no assertion...
  weakened" was meant to forbid editing this file's *expected values* at all,
  not just forbid loosening bounds — then criterion 1 and criterion 14 are in
  direct tension for this task (T-013 cannot fill 43 states' `landmark` without
  invalidating T-012's incidental `{Colorado}` check), and that tension belongs
  back with `task-expander`, not resolved by worker judgment. I made the call
  that "update, don't loosen" is what criterion 14 actually protects against
  (the class of bug it exists to catch — deleting an inconvenient assertion —
  is not what happened here), but a reviewer or tester who disagrees should
  send this back to the expander to arbitrate, not to me to guess again.

### The 50-state table

Landmark shipped, or the reason for a declared blank. "Checked" is what the
pick is based on — general knowledge plus the existing `fun_facts` entry where
one lines up, not a live source (this is content curation, not a query; see
Goal).

| Postal | State | Landmark | Notes |
|---|---|---|---|
| AL | Alabama | U.S. Space & Rocket Center | Matches AL's existing `fun_facts` entry (Saturn V rocket). |
| AK | Alaska | Denali | Tallest peak in North America; taught in school geography. |
| AZ | Arizona | Grand Canyon | Among the most globally recognisable US landmarks. |
| AR | Arkansas | Crater of Diamonds State Park | Matches AR's existing `fun_facts` entry; a working public diamond mine kids can dig in. |
| CA | California | Golden Gate Bridge | Globally recognisable, image-friendly bridge. |
| CO | Colorado | Rocky Mountain National Park | **Unchanged** — criterion 10. |
| CT | Connecticut | Mystic Aquarium | Well-known family destination; safer/more recognisable pick than a historic building a child wouldn't know. |
| DE | Delaware | *(blank)* | No landmark found that a child outside Delaware would plausibly recognise or picture; Delaware's own notability (first state to ratify) is an event, not a landmark. Preferred blank over guessing — CLAUDE.md. |
| FL | Florida | Walt Disney World | The single most kid-recognisable landmark candidate in the whole table. |
| GA | Georgia | Georgia Aquarium | **Self-naming** (criterion 11) — see below. Largest aquarium in the Americas; picked over Stone Mountain, whose carving depicts Confederate figures and is a worse fit for "nothing that needs a content warning". |
| HI | Hawaii | Diamond Head | Natural volcanic crater, image-friendly. Pearl Harbor was the other obvious candidate; rejected as a site whose fame is tied to wartime casualties, per the Constraints' caution. |
| ID | Idaho | Craters of the Moon National Monument | Real, distinct, thematically kid-appealing name; preferred over the less recognisable Shoshone Falls. |
| IL | Illinois | Willis Tower | Matches IL's existing `fun_facts` entry. |
| IN | Indiana | Indianapolis Motor Speedway | **Self-naming** (criterion 11) — see below. Matches IN's existing `fun_facts` entry (Indy 500). |
| IA | Iowa | *(blank)* | Weighed Field of Dreams (a 1989 movie site, likely not recognisable to a nine-year-old today) and Effigy Mounds National Monument (real, but not something an outside child would picture). Neither cleared the recognisability bar; left blank rather than guessed. |
| KS | Kansas | *(blank)* | No landmark found that isn't a stretch (Tallgrass Prairie, Monument Rocks) for outside-state child recognition. Left blank. |
| KY | Kentucky | Mammoth Cave National Park | World's longest known cave system; caves are inherently kid-appealing and picturable. |
| LA | Louisiana | St. Louis Cathedral | New Orleans' iconic, frequently photographed building. Rejected the Superdome: its current sign name is "Caesars Superdome" (a casino-company naming-rights deal since 2021), which sits uncomfortably against the Constraints' "no casinos" — even though the building itself isn't one, the name on the sign now is a casino brand. |
| ME | Maine | Acadia National Park | Matches ME's existing `fun_facts` entry (first sunrise). |
| MD | Maryland | Fort McHenry | The birthplace of "The Star-Spangled Banner" — commonly taught, not a casualty-count site (the 1814 bombardment killed four defenders total). |
| MA | Massachusetts | Plymouth Rock | Matches MA's existing `fun_facts` entry; near-universally taught via the Thanksgiving story. |
| MI | Michigan | Mackinac Bridge | A single, distinctive, photographable 5-mile bridge connecting Michigan's own peninsulas — no border ambiguity. |
| MN | Minnesota | Mall of America | Largest mall in North America with an indoor amusement park; very high kid-recognition. |
| MS | Mississippi | *(blank)* | The strongest historical candidate, Vicksburg National Military Park, is a Civil War battle site the Constraints explicitly caution against. No non-battle alternative cleared the recognisability bar. Left blank rather than ship a battle site or a guess. |
| MO | Missouri | Gateway Arch | Matches MO's existing `fun_facts` entry exactly. |
| MT | Montana | Glacier National Park | Well-known, dramatic, natural, picturable. |
| NE | Nebraska | Chimney Rock | Matches NE's existing `fun_facts` entry (Oregon Trail landmark). |
| NV | Nevada | Hoover Dam | **Spans more than one state** (criterion 12) — see below. |
| NH | New Hampshire | Mount Washington | Considered and rejected the Old Man of the Mountain: the rock formation collapsed in 2003 and no longer exists — the review checklist explicitly requires a landmark still standing. Mount Washington (highest NE peak, cog railway) is real and open. |
| NJ | New Jersey | Atlantic City Boardwalk | Matches NJ's existing `fun_facts` entry (first boardwalk, 1870). |
| NM | New Mexico | Carlsbad Caverns National Park | Matches NM's existing `fun_facts` entry exactly. |
| NY | New York | Statue of Liberty | Arguably the most internationally recognisable US landmark of all. (Note for the reviewer: Liberty Island's legal status was disputed between NY and NJ; a 1998 Supreme Court ruling settled the original island as New York's. Not treated as a "spans" case below since it isn't split the way Great Smoky/Hoover Dam/Yellowstone are, but flagged here for awareness.) |
| NC | North Carolina | Wright Brothers National Memorial | Matches NC's existing `fun_facts` entry (first flight, Kitty Hawk). |
| ND | North Dakota | Theodore Roosevelt National Park | Matches ND's existing `fun_facts` entry exactly. |
| OH | Ohio | Rock and Roll Hall of Fame | Distinctive, recognisable building (I. M. Pei glass pyramid) on Lake Erie; considered Cedar Point (amusement park) as the other obvious candidate. |
| OK | Oklahoma | *(blank)* | No candidate found that a child outside Oklahoma would plausibly recognise without a stretch. Left blank. |
| OR | Oregon | Crater Lake National Park | Matches OR's existing `fun_facts` entry exactly. |
| PA | Pennsylvania | Liberty Bell | Near-universally taught alongside the Declaration of Independence, which PA's existing `fun_facts` entry already mentions. |
| RI | Rhode Island | *(blank)* | Weighed The Breakers (a Newport mansion) — real and notable, but not something a nine-year-old outside Rhode Island would plausibly recognise. Left blank rather than ship a low-confidence pick. |
| SC | South Carolina | Angel Oak | A centuries-old live oak near Charleston; natural, picturable, no historical baggage. Considered and rejected Fort Sumter (Civil War association) despite its educational value, to stay clearly clear of the Constraints' battle-site caution. **Lower-confidence pick** — flagged for the reviewer's checklist item 2 (recognisability); this was the weakest candidate I shipped rather than left blank. |
| SD | South Dakota | Mount Rushmore | Matches SD's existing `fun_facts` entry exactly. |
| TN | Tennessee | Great Smoky Mountains National Park | **Spans more than one state** (criterion 12) — see below. Matches TN's existing `fun_facts` entry exactly. |
| TX | Texas | Space Center Houston | Considered and rejected The Alamo — the other obvious candidate, and arguably the more iconic pick — because it is a historic battle site (the 1836 siege); Space Center Houston sidesteps that entirely and is still strongly kid-recognisable via NASA. |
| UT | Utah | Arches National Park | UT's existing `fun_facts` entry mentions "five national parks"; Arches (Delicate Arch, on the state's license plate) is the single most iconic of the five. |
| VT | Vermont | Ben & Jerry's Factory | The factory tour is a real, physical, photographable building (the black-and-white cow mural) and a globally known ice-cream brand — chosen over the more "natural landmark" Camel's Hump for recognisability, even though the Constraints prefer natural/built landmarks over institutions. **Flagged as a judgment call**: a factory tour arguably reads as "institution", which the Constraints say to prefer against; I judged the recognisability gain (a globally known brand vs. a peak most outside-state children would not know) worth the trade-off, but a reviewer who disagrees should swap it for Camel's Hump or Quechee Gorge. |
| VA | Virginia | Mount Vernon | George Washington's home; commonly taught, non-violent. |
| WA | Washington | Space Needle | Immediately recognisable, iconic tower silhouette. |
| WV | West Virginia | New River Gorge Bridge | A very large, distinctive steel arch bridge (also a National Park unit); picturable. |
| WI | Wisconsin | Lambeau Field | Home of the Green Bay Packers; strong recognition via American football. |
| WY | Wyoming | Yellowstone National Park | **Spans more than one state** (criterion 12) — see below. Matches WY's existing `fun_facts` entry exactly. |

### Self-naming (criterion 11)

The set of states whose landmark contains that state's own name,
case-insensitively:

- **GA — Georgia Aquarium.** Contains "Georgia" outright.
- **IN — Indianapolis Motor Speedway.** "Indianapolis" contains "Indiana" as a
  literal prefix (`indianapolis`.includes(`indiana`) is true) — not an obvious
  self-naming at a glance, which is exactly why it needs disclosing here rather
  than trusting a skim to catch it.

No other shipped value contains its own state's name (checked programmatically
in `landmarks.test.ts`, criterion 11's block, against every state's `name`
from `CURATED_US_STATES`, not just eyeballed).

### Spans more than one state (criterion 12)

- **TN — Great Smoky Mountains National Park.** Also lies in North Carolina;
  assigned to Tennessee (the Constraints name this exact split as their
  example).
- **NV — Hoover Dam.** The dam structure itself sits astride the Nevada–Arizona
  border; assigned to Nevada because Arizona's landmark is already the Grand
  Canyon.
- **WY — Yellowstone National Park.** Mostly in Wyoming, with small slices in
  Montana and Idaho (the Constraints name this exact case); assigned to
  Wyoming.

### What I deliberately did not do

- Did not touch `state_animal`, `climate_kid`, `top_crops`, `fun_facts`,
  `borders`, ranks, `sources` or `index.json` — confirmed by the file-by-file
  diff check above and by `landmarks.test.ts` criterion 9's tree-shaped checks.
- Did not add a source/coordinate/citation field to `CuratedState` — out of
  scope; provenance for each pick is the "Notes" column above and this
  section, per the Constraints.
- Did not run a live pipeline build — out of scope, and would have rewritten
  `built_at` (breaking criterion 7) and drafted an uncommittable
  `fun-facts.review.json`.
- Did not add a `bun run lint` script — that gap is T-066, named explicitly in
  the brief as out of scope here.

### How to run what was touched

```
cd question-bank
bun install        # first run only; node_modules isn't committed
bun run typecheck   # passes
bun test             # 446 pass, 0 fail, 7920 expect() calls (question-bank/ only)
```

The offline rebuild command from the Constraints
(`bun run src/build.ts --offline --out data/us-states`, then
`bun run build:sample`) was run and produced the diff described above; running
it again should produce no further diff (idempotent, per criterion 7's own
test in `landmarks.test.ts`).

`frontend/` and `backend/` were not touched and their suites were not run as
part of this task (nothing in this task's scope reaches them).

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

- **Session id note for the tester.** This worker session's
  `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01UCAF12nnRsrikmsuHDdZ5S`, the same
  id already recorded for `task-expander` in the Sessions table above. I did
  not choose this — it is what the environment reports — but it means the
  Sessions-table check `process.md` describes ("the tester checks it against
  `$CLAUDE_CODE_REMOTE_SESSION_ID` and refuses if it finds itself already
  listed as `worker`") only has teeth if the tester's own session id differs
  from this one. If the tester's session also comes back
  `cse_01UCAF12nnRsrikmsuHDdZ5S`, that is the orchestrator/relayed case
  `process.md` "Spawning, and the isolation it must not cost" describes, where
  independence degrades to attestation rather than proof — the tester should
  say so in its Verdict rather than silently treat the check as passed.
- **The biggest judgment call in this task was content, not code**: picking 43
  landmarks and leaving 6 blank. Full reasoning and the rejected alternative
  for every non-obvious pick is in the Handoff's table — I did not want the
  Handoff to just be a bare list of 50 strings, since the Review checklist
  explicitly asks a person to second-guess each one and a bare list gives them
  nothing to push back against.
- **The state-animals.test.ts edit is the one place this task touched a file
  outside its own new test file and the curated data.** I judged it necessary
  (the alternative was a red pre-existing test with no code path to fix it
  that doesn't touch that file) and flagged it in the Handoff as a call for
  the reviewer to confirm or send back to the expander if my reading of
  criterion 14 is wrong.
- **Six blanks (DE, IA, KS, MS, OK, RI)** is more than T-012's zero. T-012 is a
  much easier field to fill (every state has *an* animal); a genuinely
  kid-recognisable landmark that isn't a battle site, a casino, a demolished
  structure or a guess does not exist for every state. I considered this the
  correct reading of CLAUDE.md's "prefer a blank field to a guessed one" rather
  than a shortfall to explain away.
- **`node_modules` was not present** in `question-bank/` at the start of this
  session (fresh checkout); `bun install` was run once to unblock
  `bun run typecheck`. It installs only the two existing devDependencies
  (`@types/bun`, `typescript`) already declared in `package.json` — no new
  dependency was added, and `landmarks.test.ts` criterion 13 asserts this.
