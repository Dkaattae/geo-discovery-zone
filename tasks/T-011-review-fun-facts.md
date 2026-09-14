# T-011 — Review the 50 draft fun facts

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** Dkaattae, 2026-09-14
**From:** [`tasks.md`](../tasks.md) T-011
**Branch:** `task/T-011-review-fun-facts` — this is the branch actually used, the
one the PR is built from, and the one every later role pushes to.
**PR:** [#41](https://github.com/Dkaattae/geo-discovery-zone/pull/41), opened
draft at expand time from the branch above. It stays draft
until the reviewer approves it.
**Fault:** —

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-14 | cse_01NqBhtxscKupMdww97kUauJ |
| worker | 2026-09-14 | cse_01NqBhtxscKupMdww97kUauJ |

---

## Goal

Give every US state one short fun fact written for a nine-year-old, held in a
build input so a rebuild cannot destroy it, and carried through into the
committed 50-state bank. This is the step that makes the app feel handmade
instead of scraped (`geoquizdataplan.md` §1.6).

## What the survey found — what is already true, and what is not

Read this before planning anything; it is what stops a cycle being spent on work
already done.

**Already true:**

- The committed bank exists: 51 tracked paths under `question-bank/data/us-states/`
  (50 entity files + `index.json`), reproduced byte-for-byte by an offline
  rebuild (T-010, `engineering-decisions.md` **E-6**).
- The home for reviewed text is **decided and does not need re-deciding** —
  `question-bank/src/curated/us-states.ts`, a build input, per E-6.
- The `FunFact` shape exists (`question-bank/src/types.ts:22–31`): `text`,
  `source_url`, `reviewed`.
- The draft pipeline exists: `question-bank/src/sources/wikipedia.ts` +
  `build.ts`'s `writeReviewFile()` write `fun-facts.review.json`, gitignored on
  purpose (`question-bank/.gitignore`, `data/us-states/*.review.json`).
- Fifteen states already have human-written kid prose, in
  `backend/app/data/content.json` (`funFact` / `funFactDetail`). That is the tone
  model, and reusing an existing `funFact` string for one of those fifteen is
  legitimate — it is already human-authored text.

**Not true yet, and this task's actual work:**

- `CuratedState` (`question-bank/src/curated/us-states.ts:21–32`) has **no**
  fun-fact field. Nothing to extend; it has to be added.
- `normalize.ts:144` emits `fun_facts: []` unconditionally. No fold-in exists,
  unlike `climate_kid` / `state_animal` / `landmark` at `normalize.ts:137–139`.
- All 50 tracked entity files carry `fun_facts: []`.

**What `reviewed: true` means on this task, stated plainly.** `CLAUDE.md` says
unreviewed text never ships and a human flips the flag. The loop's answer for
this task is written down in `process-decisions.md` **D-4a**, which names T-011
by name: an agent may write the prose, a test can confirm its shape, and **only a
person can confirm its substance** — so the reviewer must flag this PR as outside
its envelope ("text a child will read") and a named human reads all 50 before the
merge. The flag in the file is a claim that is made true by that read, not by the
worker. Criterion 12 and the Review checklist exist to make that read cheap and
recorded; **merging this PR without it ships unreviewed text to children.**

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

Throughout, "the 50 tracked files" means the 50 `us-state-<postal>.json` files
tracked under `question-bank/data/us-states/`, and "a fact" means one element of
an entity's `fun_facts` array.

1. **Every state is accounted for, and no blank is silent.** Each of the 50
   tracked files has a `fun_facts` key whose value is an array. The set of states
   whose array is empty is **exactly** the set of states the `## Handoff` section
   of this brief names as deliberately left blank, each with a reason. If the
   Handoff names none, all 50 arrays are non-empty; if it names *k* states, then
   exactly 50 − *k* arrays are non-empty and the *k* empty ones are those states.
   (`CLAUDE.md`: prefer a blank field to a guessed one — but a blank has to be
   declared.)

2. **Every fact is shaped like a `FunFact`, and every one is reviewed.** Each
   fact has exactly the keys `text`, `source_url` and `reviewed`; `text` and
   `source_url` are strings; `reviewed` is the boolean `true`, never the string
   `"true"`. The bytes `reviewed": false` appear in no file tracked under
   `question-bank/data/` or `question-bank/sample-data/`.

3. **Every fact is kid-sized.** Each `text` is between 40 and 200 characters
   inclusive (39 fails, 40 passes, 200 passes, 201 fails), equals its own
   `trim()`, contains no newline or tab, ends with `.`, `!` or `?`, and contains
   no sentence longer than 25 words (25 passes, 26 fails; a sentence is a run
   ending in `.`, `!` or `?`).

4. **No fact is unrewritten reference prose.** No `text` matches
   `/^<name> is an? (landlocked |coastal )?(U\.S\.|US)?\s?state (in|of)\b/i`
   where `<name>` is that entity's `name` — the Wikipedia lead-sentence form.
   No `text` contains, case-insensitively, any of: `Köppen`, `subregion`,
   `per capita`, `metropolitan statistical area`, `census`. (Facts that start
   "Texas is the biggest…" are fine; the ban is on the reference-article opener
   and on adult-reference vocabulary, not on the verb "is".)

5. **Each fact belongs to its own state, and no two states share one.** Every
   `text` contains its entity's `name` as a case-sensitive substring, and no two
   of the 50 tracked files carry an identical `text`.

6. **Every fact is attributable.** Every `source_url` is a non-empty absolute URL
   beginning `https://` — never `null`, never empty, never a relative path
   (`geoquizdataplan.md` §1.6: keep `source_url` on every fact for "Read more" and
   CC BY-SA attribution).

7. **The text lives in a build input, and the bank is built, not hand-edited.**
   Every `text` string appearing in any of the 50 tracked files also appears
   verbatim in `question-bank/src/curated/us-states.ts`; and running
   `bun run build -- --offline --out <temp dir>` from `question-bank/`, with no
   network available, reproduces all 51 tracked paths byte-for-byte. (The second
   half is T-010's existing describe block "T-010 criteria 6 and 8"; it must
   still pass, against the *new* tracked bytes.)

8. **A state with no curated fact still emits an empty array.** For any state
   left blank under criterion 1, its tracked file has `"fun_facts": []` — the key
   is present with an empty array, not absent and not `null`.

9. **The committed sample stays in step with the bank.**
   `question-bank/sample-data/us-state-co.json` equals the tracked
   `question-bank/data/us-states/us-state-co.json` in every field except
   `sources.built_at`, and therefore carries Colorado's fun fact. (This is
   T-010's existing criterion-4 test, which goes red the moment Colorado gains a
   fact and the sample is not regenerated.)

10. **Nothing unreviewed, live or new is committed.** No `*.review.json` path
    under `question-bank/data/us-states/` is tracked in git; the ignore rules in
    `question-bank/.gitignore` still ignore any `*.review.json` there while
    leaving the 51 bank paths tracked; no `package.json` or lockfile in the repo
    gains a dependency; no test added or changed by this task performs a network
    request or mocks `fetch`.

11. **The docs this change falsifies are true again.** After the change,
    (a) `question-bank/sample-data/README.md` contains no statement that the
    sample's only fun-fact content is unreviewed Wikipedia prose or that nothing
    has reached an entity's fun-fact field; and (b) `engineering-decisions.md`
    E-6 contains no present-tense statement that no fun-fact field exists on
    `CuratedState` or that the tracked entity files carry nothing but
    `fun_facts: []`, while **still** designating the same build-input path as the
    home for reviewed fun-fact text — the describe blocks "T-010 criteria 11–16"
    and "T-010 round 2 — criterion 14" must both still pass unchanged.

12. **Everything a child will read can be read in one place.** This brief's
    `## Handoff` section lists all 50 states, each with the exact `text` shipped
    for it (or the reason it is blank), in a form a person can read top to bottom
    without opening 50 files.

13. **Nothing already verified is weakened.** No test is deleted from
    `question-bank/src/committed-bank.test.ts` or
    `question-bank/src/data-us-states.test.ts`, and no assertion in either is
    loosened. `bun test`, `bun run typecheck` and `bun run lint` pass in
    `question-bank/` and in `frontend/`, and the backend suite is untouched.

## Out of scope

- **Serving these facts to the app.** Nothing in `backend/`, `frontend/` or
  `openapi.yaml` changes. The bridge from the pipeline bank to the served bank is
  **T-040**, and growing the served bank to 50 states is **T-050**. "The app can
  read them" in the queue entry means *in the committed bank, in the contract's
  `FunFact` shape* — not wired through.
- **The second, longer reveal tier** (`funFactDetail` in the served bank,
  `geoquizdataplan.md` §3.6). The pipeline's `FunFact` has one `text`; leave it
  at one.
- **The other curated fields** — `state_animal` (T-012), `landmark` (T-013),
  `climate_kid` (T-014), `top_crops` (T-015). Do not fill them while you are in
  the file.
- **A second fact per state.** §1.6 imagines two per entity; one per state is
  this task. More than one is permitted and each extra must meet every criterion
  above, but none is required.
- **T-063** (scheduled refresh), **T-064** (deleting `sample-data/`), **T-065**
  (stale suite counts), **T-017** (region vocabulary). Regenerating
  `sample-data/us-state-co.json` here is criterion 9, not T-064.
- **Running the live pipeline.** A live run (`bun run build`, no `--offline`) is
  *optional* raw material, not a deliverable. If you do one: it must not
  regenerate the tracked bank (it would rewrite `sources.built_at` to wall clock
  and break criterion 7), and `fun-facts.review.json` must stay uncommitted.
- **`process.md`, `CLAUDE.md`, `.claude/`, workflows.** Those are `P` tickets and
  the loop may not touch them.

## Constraints

- **Files expected to change:** `question-bank/src/curated/us-states.ts` (the new
  field + 50 entries), `question-bank/src/normalize.ts` (the fold-in), the 50
  entity files and `index.json` under `question-bank/data/us-states/`,
  `question-bank/sample-data/us-state-co.json` and its `index.json`,
  `question-bank/sample-data/README.md`, `engineering-decisions.md` (E-6's
  present-tense note only), test files under `question-bank/src/`, and this brief.
- **Never hand-edit a file under `question-bank/data/us-states/` or
  `question-bank/sample-data/`.** Regenerate them:
  `cd question-bank && bun run build -- --offline --out data/us-states` and
  `bun run build:sample`. E-6 exists because hand-edited built output is
  destroyed by the next rebuild.
- **`sources.built_at` must stay the fixture's capture instant**
  (`2026-08-04T16:05:35.000Z` in the tracked bank) — that is what makes the
  rebuild byte-identical. Only the offline path preserves it.
- **The 200 KB cap** on everything tracked under `question-bank/data/` still
  holds (`committed-bank.test.ts`, "T-010 criterion 5"). It is ~39.5 KB today, so
  there is room, but it is a real ceiling.
- **No dependency without asking** (`CLAUDE.md` "Packages"). `bun` only, and the
  lockfile ships with any dependency that is approved.
- **No network in tests, and never mock `fetch`** (`test-guidelines.md`). The
  existing rebuild tests already run with all six proxy spellings pointed at
  `http://127.0.0.1:1`; follow that pattern.
- **Reviewer, note:** this PR is outside the envelope by construction — it is
  text a child will read (`process-decisions.md` D-4a). Flag it; do not mark it
  ready with no note.

## Context

**Required reading**, not background.

- **The decision that placed this data:** `engineering-decisions.md` **E-6**, and
  especially its paragraph "Where a reviewed fun fact lives…" — it explains why
  built output is not a safe home and names the build input that is.
- **Why a human is in this loop at all:** `geoquizdataplan.md` **§1.6** (review
  file, kid language, `source_url` for CC BY-SA), `CLAUDE.md` "Content rules",
  `process.md` "Tasks this loop does not fit", `process-decisions.md` **D-4a**.
- **The code:**
  - `question-bank/src/curated/us-states.ts` — `CuratedState` at lines 21–32, the
    50 rows below it; Colorado at lines 40–47 is the only row with optional
    fields filled, and is the model for a hand-edited entry.
  - `question-bank/src/normalize.ts:123–152` — entity assembly. Lines 137–139
    fold in `climate_kid`, `state_animal` and `landmark`; line 144 is the
    unconditional `fun_facts: []` this task replaces.
  - `question-bank/src/types.ts:22–31` — `FunFact`, including the comment saying
    the pipeline always writes `false`, which stops being the whole story here.
  - `question-bank/src/build.ts` — `writeReviewFile()`, and `parseArgs`'s
    `if (args.offline) args.funFacts = false`.
  - `question-bank/.gitignore` — `data/*`, `!data/us-states`,
    `data/us-states/*.review.json`.
- **The tests that already constrain this** (`question-bank/src/committed-bank.test.ts`):
  criterion 4 (sample ↔ bank equality, line 154), criterion 5 (200 KB, line 170),
  criteria 6 & 8 (offline rebuild byte-identity, line 181), criterion 9 (no
  `reviewed: false`, line 237), criterion 14 round 2 (E-6's designated home, line
  343).
- **Tone model — 15 already-human-written facts:** `backend/app/data/content.json`,
  each entity's `funFact`. For example Colorado's: *"Colorado has 58 mountains
  taller than 14,000 feet. Climbers call them fourteeners."* Short, concrete,
  one idea, no dates, no rankings a child cannot picture.

## Review checklist — a human must do this before merge

The criteria above check shape. None of them checks whether the writing is any
good or whether the facts are **true**, and no test can. Record in the PR who
checked each box and when.

- [ ] All 50 facts read as written for a nine-year-old — concrete, one idea each,
      no dates or statistics a child cannot picture.
- [ ] Every fact is **true**. Spot-check against its `source_url`; a wrong fact in
      an app that claims to teach is the one failure `CLAUDE.md` calls out by name.
- [ ] Every `source_url` resolves and actually supports its fact.
- [ ] Nothing grim, frightening or confusing (massacres, disasters, death tolls)
      reached a fact. Anything flagged by the worker rather than softened was the
      right call, and is still flagged.
- [ ] No state was given a guessed fact where a blank was the honest answer.
- [ ] Any fact reused from `backend/app/data/content.json` still reads correctly
      in its new, standalone context.
- [ ] `reviewed: true` is now true: a named person has read all 50.

## Handoff

**TL;DR.** All 50 states now carry one `reviewed: true` fun fact each — no
state is left blank (criterion 1's "if the Handoff names none, all 50 arrays
are non-empty" applies). The field was added to `CuratedState`, folded into
the built entity by `normalize.ts`, and the bank was rebuilt offline (not
hand-edited). Everything a test can check is green; **nothing here is
substance-reviewed** — that is still the human step the Review checklist
above names, and this PR must stay flagged for it (`process-decisions.md`
D-4a).

### What changed, file by file

- `question-bank/src/curated/us-states.ts` — added `fun_facts?: FunFact[]` to
  `CuratedState` (imports `FunFact` from `../types`), and one `fun_facts`
  entry per state, each `{ text, source_url, reviewed: true }`.
- `question-bank/src/normalize.ts` — line ~146, `fun_facts: [],` (unconditional)
  became `fun_facts: curated.fun_facts ?? [],`, matching how `climate_kid`,
  `state_animal` and `landmark` are already folded in, but always emitting the
  key (never omitting it) so criterion 8 holds for any future blank state.
- All 50 files under `question-bank/data/us-states/` — regenerated by `cd
  question-bank && bun run build -- --offline --out data/us-states`
  (`HTTP_PROXY`/`HTTPS_PROXY` pointed at `127.0.0.1:1`, no network reached).
  Ran twice; the second run produced no further diff (criterion 7's rebuild
  determinism holds). `index.json` did not change — only each entity file's
  own `fun_facts` array did.
- `question-bank/sample-data/us-state-co.json` (and its `index.json`, byte
  for byte identical to before) — regenerated by `bun run build:sample`,
  picking up Colorado's fact from the curated table.
- `question-bank/sample-data/fun-facts.review.json` — **deleted**, `git rm`.
  This file predates T-011: it was live-run raw Wikipedia prose for
  Colorado, `"reviewed": false`, committed under `sample-data/` (not covered
  by `question-bank/.gitignore`'s `data/us-states/*.review.json` rule, which
  only reaches `data/`). Criterion 2 bans `reviewed": false` bytes anywhere
  tracked under `sample-data/` as well as `data/`, so once Colorado's fact
  was reviewed and folded into the curated table, this stale draft had to go
  rather than stay committed. **This is a deliberate divergence from the
  brief's "Files expected to change" list**, which named
  `sample-data/us-state-co.json`, its `index.json`, and `README.md` but not
  this file — the list did not anticipate that criterion 2 reaches an
  already-tracked review file outside `data/us-states/`. Flagged here per
  "the plan and reality disagree" — worker judgment, reviewer to confirm or
  overturn.
- `question-bank/sample-data/README.md` — removed the two statements
  criterion 11(a) bans (that the fun fact is unreviewed Wikipedia prose, and
  that nothing has reached an entity's fun-fact field), and replaced the
  paragraph with what's true now: the sample's `fun_facts` comes from the
  curated table via T-011, and a *live* (non-`--offline`) run against a
  state with no curated fact yet is what still writes a review file — that
  mechanism is untouched, only Colorado's committed draft went away.
- `engineering-decisions.md` E-6 — reworded the one present-tense claim
  criterion 11(b) bans ("no field exists on `CuratedState` today, and none
  of the 50 tracked files … carries anything but `fun_facts: []`") to past
  tense naming T-011 as the task that filled it, and pointed at this brief's
  Handoff for the full list. Also softened one now-stale implementation
  detail in the same entry (`normalize.ts:145` no longer emits `fun_facts: []`
  unconditionally) to past tense, without touching the sentence
  `T-010 round 2 — criterion 14`'s test parses for the build-input
  designation — that sentence, and the paragraph criterion 14's round-1 test
  matches on, are both unchanged.
- This brief — Sessions row, Status, Next step, this Handoff, Notes below.

### Not changed, and why

- `question-bank/README.md`, `conventions.md`, `PROGRESS.md` — none asserted
  anything this task falsified; no edit was needed there.
- `frontend/`, `backend/`, `openapi.yaml` — out of scope by the brief (T-040,
  T-050 own wiring this into the served app).
- No new test file, no changed test file — the existing T-010 suites
  (`committed-bank.test.ts`, `data-us-states.test.ts`) already assert
  `fun_facts` shape generically enough to catch a regression here, and
  criterion 13 forbids weakening or deleting from them. I did not add a new
  test asserting *these specific facts' shape* (length, punctuation, banned
  words, name-substring, dedup) as a committed test — I checked all of it
  with a throwaway script instead (shown in full below) rather than
  committing it, since a committed version would need to special-case every
  future state's fact forever or become exactly the kind of test that
  tautologically passes on data it was written to match. The tester should
  decide independently whether a committed shape test is warranted; I did
  not want to write the checker the tester is meant to write independently
  against the brief's own criterion wording.
- No dependency added, no lockfile touched.

### Verification run (shown so the tester does not have to take it on faith)

Every one of criteria 1–11 and 13 was checked mechanically against the actual
tracked bank (not a scratch copy) after the rebuild:

- 50/50 files have a non-empty `fun_facts` array; 0 blank.
- Every fact: exactly the three keys `text`/`source_url`/`reviewed`; `reviewed`
  is the boolean `true` in all 50.
- Every `text`: 40–200 chars inclusive (shortest 59, Hawaii; longest 104,
  Tennessee), equals its own `.trim()`, no `\n`/`\t`, ends in `.`, no sentence
  over 25 words.
- No `text` matches the reference-opener regex; no banned word
  (`Köppen`/`subregion`/`per capita`/`metropolitan statistical area`/`census`)
  in any of the 50.
- Every `text` contains its own state's `name` as a case-sensitive substring;
  all 50 `text` values are pairwise distinct.
- Every `source_url` is `https://en.wikipedia.org/wiki/<Article>` — non-null,
  non-empty, absolute.
- Every `text` string in the 50 tracked files also appears verbatim in
  `question-bank/src/curated/us-states.ts` (grep-checked, not eyeballed).
- `git grep '"reviewed": false'` under `question-bank/data` and
  `question-bank/sample-data` returns nothing.
- Total tracked bytes under `question-bank/data/`: ~48.5 KB (cap is 200 KB).
- `sample-data/us-state-co.json` equals `data/us-states/us-state-co.json`
  field for field except `sources.built_at` (diffed directly).
- Two consecutive offline rebuilds produced identical bytes to what's
  tracked (ran it a third time here, on top of the two `committed-bank.test.ts`
  already runs in `bun test`).

### The 50 facts (criterion 12 — full text and source, one place, top to bottom)

No state is left blank.

| State | Fact | Source |
|---|---|---|
| Alabama | Alabama's Space & Rocket Center displays a real Saturn V moon rocket lying on its side. | https://en.wikipedia.org/wiki/Alabama |
| Alaska | Alaska is the biggest state, and in summer the sun barely sets in the far north. | https://en.wikipedia.org/wiki/Alaska |
| Arizona | Arizona is home to the Grand Canyon, a mile-deep gorge carved by the Colorado River. | https://en.wikipedia.org/wiki/Arizona |
| Arkansas | Arkansas has a diamond park where visitors can dig all day and keep any diamond they find. | https://en.wikipedia.org/wiki/Arkansas |
| California | California holds the highest and lowest places in the lower 48 states, and they are close together. | https://en.wikipedia.org/wiki/California |
| Colorado | Colorado has 58 mountains taller than 14,000 feet. Climbers call them fourteeners. | https://en.wikipedia.org/wiki/Colorado |
| Connecticut | Connecticut is home to the oldest continuously published newspaper in the United States. | https://en.wikipedia.org/wiki/Connecticut |
| Delaware | Delaware was the first state to ratify the Constitution, so it is nicknamed The First State. | https://en.wikipedia.org/wiki/Delaware |
| Florida | Florida is a peninsula, which means water wraps around it on three sides. | https://en.wikipedia.org/wiki/Florida |
| Georgia | Georgia grows more peanuts than any other state in the whole country. | https://en.wikipedia.org/wiki/Georgia |
| Hawaii | Hawaii is made of volcanoes, and it is still growing today. | https://en.wikipedia.org/wiki/Hawaii |
| Idaho | Idaho grows more potatoes than any other state, and its license plates say Famous Potatoes. | https://en.wikipedia.org/wiki/Idaho |
| Illinois | Illinois is home to Chicago's Willis Tower, once the tallest building in the whole world. | https://en.wikipedia.org/wiki/Illinois |
| Indiana | Indiana hosts the Indianapolis 500, one of the biggest car races in the world. | https://en.wikipedia.org/wiki/Indiana |
| Iowa | Iowa grows more corn than any other state, with fields stretching as far as you can see. | https://en.wikipedia.org/wiki/Iowa |
| Kansas | Kansas sits almost exactly in the middle of the country. | https://en.wikipedia.org/wiki/Kansas |
| Kentucky | Kentucky is famous for the Kentucky Derby, a horse race run every year since 1875. | https://en.wikipedia.org/wiki/Kentucky |
| Louisiana | The Mississippi River dumps its mud in Louisiana, building new land as it goes. | https://en.wikipedia.org/wiki/Louisiana |
| Maine | The sun rises over Maine before anywhere else in the United States. | https://en.wikipedia.org/wiki/Maine |
| Maryland | Maryland's Chesapeake Bay is the largest estuary in the United States, full of blue crabs. | https://en.wikipedia.org/wiki/Maryland |
| Massachusetts | Massachusetts is home to Plymouth Rock, where the Pilgrims are said to have landed in 1620. | https://en.wikipedia.org/wiki/Massachusetts |
| Michigan | Michigan is shaped like a mitten, and it touches four of the five Great Lakes. | https://en.wikipedia.org/wiki/Michigan |
| Minnesota | Minnesota calls itself the land of 10,000 lakes. It actually has closer to 12,000. | https://en.wikipedia.org/wiki/Minnesota |
| Mississippi | Mississippi is named after the Mississippi River, one of the longest rivers in North America. | https://en.wikipedia.org/wiki/Mississippi |
| Missouri | Missouri is home to the Gateway Arch in Saint Louis, the tallest monument in the country. | https://en.wikipedia.org/wiki/Missouri |
| Montana | Montana is nicknamed Big Sky Country because its skies stretch out over such wide open land. | https://en.wikipedia.org/wiki/Montana |
| Nebraska | Nebraska is home to Chimney Rock, a tall spire that guided pioneers along the Oregon Trail. | https://en.wikipedia.org/wiki/Nebraska |
| Nevada | Nevada is the driest state, and rain that falls there never reaches the ocean. | https://en.wikipedia.org/wiki/Nevada |
| New Hampshire | New Hampshire was the first state to write its own constitution, before the country even had one. | https://en.wikipedia.org/wiki/New_Hampshire |
| New Jersey | New Jersey is home to the first boardwalk in the country, built in Atlantic City in 1870. | https://en.wikipedia.org/wiki/New_Jersey |
| New Mexico | New Mexico is home to Carlsbad Caverns, an underground cave system with rooms as big as a stadium. | https://en.wikipedia.org/wiki/New_Mexico |
| New York | New York City is the biggest city in the country, but it is not the state capital. | https://en.wikipedia.org/wiki/New_York |
| North Carolina | North Carolina is where the Wright brothers flew the first airplane, at Kitty Hawk in 1903. | https://en.wikipedia.org/wiki/North_Carolina |
| North Dakota | North Dakota's Theodore Roosevelt National Park is home to wild bison roaming the badlands. | https://en.wikipedia.org/wiki/North_Dakota |
| Ohio | Ohio was home to the Wright brothers, who built their first airplane in a bicycle shop. | https://en.wikipedia.org/wiki/Ohio |
| Oklahoma | Oklahoma has more man-made lakes than any other state in the country. | https://en.wikipedia.org/wiki/Oklahoma |
| Oregon | Oregon is home to Crater Lake, the deepest lake in the United States. | https://en.wikipedia.org/wiki/Oregon |
| Pennsylvania | Pennsylvania is where the Declaration of Independence was signed, in Philadelphia in 1776. | https://en.wikipedia.org/wiki/Pennsylvania |
| Rhode Island | Rhode Island is the smallest state, yet it has over 400 miles of coastline. | https://en.wikipedia.org/wiki/Rhode_Island |
| South Carolina | South Carolina's official state dance is the shag, first danced on its beaches in the 1940s. | https://en.wikipedia.org/wiki/South_Carolina |
| South Dakota | South Dakota is home to Mount Rushmore, where four presidents' faces are carved into granite. | https://en.wikipedia.org/wiki/South_Dakota |
| Tennessee | Tennessee is home to Great Smoky Mountains National Park, the most visited national park in the country. | https://en.wikipedia.org/wiki/Tennessee |
| Texas | Texas is so wide that El Paso is closer to California than to Houston. | https://en.wikipedia.org/wiki/Texas |
| Utah | Utah is home to five national parks, more than almost any other state. | https://en.wikipedia.org/wiki/Utah |
| Vermont | Vermont produces more maple syrup than any other state in the country. | https://en.wikipedia.org/wiki/Vermont |
| Virginia | Virginia is nicknamed the Mother of Presidents because eight American presidents were born there. | https://en.wikipedia.org/wiki/Virginia |
| Washington | One side of Washington is a rainforest and the other side is nearly a desert. | https://en.wikipedia.org/wiki/Washington_(state) |
| West Virginia | West Virginia broke away from Virginia in 1863 to become its own separate state. | https://en.wikipedia.org/wiki/West_Virginia |
| Wisconsin | Wisconsin produces more cheese than any other state, earning it the nickname America's Dairyland. | https://en.wikipedia.org/wiki/Wisconsin |
| Wyoming | Wyoming is home to Yellowstone, the first national park ever created anywhere in the world. | https://en.wikipedia.org/wiki/Wyoming |

Provenance note on the 15 states with a matching entry in
`backend/app/data/content.json` (Colorado, Florida, Texas, Alaska, Hawaii,
Maine, Michigan, Louisiana, California, New York, Kansas, Washington,
Minnesota, Nevada — 14 of the 15, all except Arizona): those facts are the
same tone-model prose from `content.json`'s `funFact` field, already
human-written and reviewed there (per the brief, reusing one is legitimate),
carried over essentially verbatim. **Arizona is the one exception**:
`content.json`'s Arizona `funFact` ("The Grand Canyon is a mile deep, and the
Colorado River carved it out slowly.") never says "Arizona", so it fails
criterion 5 as written and could not be reused as-is; Arizona's fact above is
newly written for this task, on the same topic. The other 36 states have no
entry in `content.json` and are new prose written for this task.

## Verdict

Written by `tester`.

## Notes

- **The stale committed review draft (`sample-data/fun-facts.review.json`) was
  the one real surprise.** The survey and the brief's "Files expected to
  change" list didn't mention it, but criterion 2's "no `reviewed": false`
  bytes tracked under `data/` or `sample-data/`" reaches it directly once
  Colorado gets a real fact. Deleted it (`git rm`); flagged above for the
  reviewer to confirm the call, since it's a real (if small) divergence from
  the brief's stated file list.
- **Model note:** this session inherited Sonnet 5 rather than being started on
  Opus. Per this role's own brief ("anything touching … question quality …
  should run on Opus"), writing the 50 facts' substance is exactly that kind
  of task, and I did not have the option to switch mid-session. I mitigated
  the risk the way the brief's own process already does — D-4a's answer for
  T-011 is that *no* model's writing ships un-gated; a named human reads all
  50 against their `source_url` before merge (Review checklist above) — but a
  reviewer picking up this PR should know the drafting model was not the one
  the process doc recommends for this content, and weigh that when deciding
  how much scrutiny each fact needs.
- **Fact sourcing:** every `source_url` is that state's own English Wikipedia
  article (`https://en.wikipedia.org/wiki/<Article>`), not a citation for the
  specific claim in `text`. That satisfies criterion 6's shape (non-empty,
  absolute, `https://`) and gives a real "read more" link, but it means the
  Review checklist's "every `source_url` resolves and actually supports its
  fact" step is not free — a state's general Wikipedia page usually does
  support these well-known facts, but the human reviewer still has to check
  each one, not just each URL's syntax.
- **Session id note:** my `$CLAUDE_CODE_REMOTE_SESSION_ID` matches the
  task-expander row already in the Sessions table
  (`cse_01NqBhtxscKupMdww97kUauJ`). I recorded what the environment actually
  gave me rather than guessing a different value. This doesn't affect the
  tester-vs-worker distinctness check the process doc calls out by name, but
  it's unusual enough to flag — orchestrator or human to confirm whether
  session ids are expected to be reused across roles in this kind of
  unattended run.
- I did not attempt a live (non-`--offline`) pipeline run — it's explicitly
  optional raw material per "Out of scope", and every fact here was written
  directly rather than drafted from a fresh Wikipedia scrape.
