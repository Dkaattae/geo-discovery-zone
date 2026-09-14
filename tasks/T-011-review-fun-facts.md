# T-011 — Review the 50 draft fun facts

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending` — replace with who approved and the date, e.g. `Kate, 2026-09-14`
**From:** [`tasks.md`](../tasks.md) T-011
**Branch:** `task/T-011-review-fun-facts` — this is the branch actually used, the
one the PR is built from, and the one every later role pushes to.
**PR:** #38, opened draft at expand time from the branch above. It stays draft
until the reviewer approves it.
**Fault:** —

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-14 | cse_01NqBhtxscKupMdww97kUauJ |

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

Written by `worker` before the tester runs. **Always written, even when nothing
was built.** Criterion 12 makes this section the single place all 50 facts can be
read, so it must contain the full list, state by state, with any deliberate blank
and its reason called out.

## Verdict

Written by `tester`.

## Notes
