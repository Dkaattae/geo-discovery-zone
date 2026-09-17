# T-015 — US crops per state, curated (was: USDA NASS Quick Stats)

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** Dkaattae, 2026-09-17
**From:** [`tasks.md`](../tasks.md) T-015
**Branch:** `claude/zen-johnson-zmsy1e` — the branch this session was assigned by
Claude Code on the web, used as the task branch per `process.md`, "When the
environment names the branch for you", and `CLAUDE.md` "Branches". Every later
role pushes here.
**PR:** #46, opened draft at expand time, built from the branch above. It stays
draft until the reviewer approves it.
**Fault:** the expander halted on 2026-09-17 because the shipped crop values'
source and ranking measure were content decisions, not the expander's to settle.
**Resolved the same day** by Dkaattae's answers below (route B, curated table);
criteria are finalised against that answer and the task is back on the normal
path.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-17 | cse_014UHMAdWWsvkfN9KUD5wDXi — halted on Q1–Q3 |
| task-expander | 2026-09-17 | cse_014UHMAdWWsvkfN9KUD5wDXi — criteria finalised on the answers |

---

## TL;DR

- **Hand-curated, not NASS.** `top_crops` becomes a field on `CuratedState` in
  `question-bank/src/curated/us-states.ts`, folded in by `normalize.ts` exactly
  as `climate_kid`, `state_animal` and `landmark` already are. No API key, no
  source module, no fixture — the live NASS route was considered and rejected
  (see "History" below).
- **One to three genuinely famous plant crops per state**, not an exhaustive
  top-3 from a live source, and **not livestock** — cattle, dairy, poultry and
  eggs are now T-068.
- **What is left to build is small**: the field, the fold-in line, a rebuilt
  bank, four existing `[]` assertions to replace, and provenance in a header
  comment plus an `engineering-decisions.md` entry. Everything else the task
  needs already exists (survey below).

## Goal

Fill `Entity.top_crops` — declared at `question-bank/src/types.ts:51`, exposed as
`topCrops` at `openapi.yaml:1480`, and emitted as `[]` for all 50 states today —
with the crops each state is genuinely known for, so the `agriculture` topic
("What grows most in &lt;state&gt;?", `tasks.md` T-026) has data to generate
questions from. It is the last unpopulated curated field on a US state.

## What is already true — survey, 2026-09-17

Nothing below needs building again. Criteria that look already satisfied are
marked so where they are.

- **The field exists and reaches the client contract.** `types.ts:51`
  (`top_crops?: string[]`), `openapi.yaml:1480` (`topCrops`, array of string),
  `backend/app/models.py:157` (`top_crops: list[str] | None`). **No contract
  change is needed for this task.**
- **Every state already carries the key, empty.** `normalize.ts:142–145` emits
  `top_crops: []` unconditionally, with a comment naming USDA NASS and §1.9; all
  50 tracked files under `question-bank/data/us-states/` show `"top_crops": []`.
  **The fold-in is not generic** — the emitted value is a literal `[]`, so
  criterion 5 needs that line changed to read from the curated entry.
- **The fold-in point for a curated field exists.** `normalize.ts:137–139` folds
  `climate_kid`, `state_animal` and `landmark` from `CuratedState` in exactly the
  shape this task needs; `fun_facts` at `:146` shows the `?? []` form for an
  array-valued curated field.
- **The offline build is already deterministic.** `build.ts:171–178` takes
  `built_at` from the fixture's `_fixture.captured_at`
  (`2026-08-04T16:05:35Z`), and every tracked file carries
  `"built_at": "2026-08-04T16:05:35.000Z"` — so a rebuild does **not** move
  `built_at`, which is what makes criterion 13's "only `top_crops` moves"
  checkable.
- **The offline test harness exists and is mandatory.** `offline-rebuild.ts`
  exports `DEAD_PROXY` and `rebuildOffline(buildScript, fileNames, tmpPrefix?)`.
  `climate-kid.test.ts:640` asserts **exactly one** file under
  `question-bank/src/` contains the loopback literal, and `:651` asserts **no**
  `*.test.ts` there spawns `src/build.ts`. A new suite must import the runner.
- **The entity allowed-key lists already include `top_crops`**
  (`climate-kid.test.ts:626`, `landmarks.test.ts:588`,
  `state-animals.test.ts:647`), so populating it trips no key-whitelist test —
  **already satisfied, nothing to do**.
- **Four suites assert `top_crops` is `[]`** and each names T-015 as the owner:
  `climate-kid.test.ts:604`, `climate-kid-verify.test.ts:740`,
  `landmarks.test.ts:551`, `state-animals.test.ts:604`. These are the four
  criterion 9 replaces. `landmarks-verify.test.ts:184` only *types* the field and
  needs no change.
- **`sample-data/us-state-co.json` is guarded.**
  `climate-kid.test.ts:522–540` asserts the sample stays in step with the bank
  and that `us-state-co.json` does not appear in a diff of
  `question-bank/sample-data`. Its `top_crops` is `[]` at line 31. Criterion 12
  decides this: the sample file stays byte-identical and the README says so.
- **`sample-data/README.md:29`** says `top_crops` is empty because it needs USDA
  NASS. That sentence becomes false the moment this lands.
- **`PROGRESS.md:654`** says `top_crops` is empty and names T-015.
- **The next free decision number is `E-7`** (`engineering-decisions.md` ends at
  E-6).

## Acceptance criteria

**Frozen once approved.** A curated table is the source of truth for every value
below; criteria 1–4 constrain the *shape* of that table's output, and the
**Review checklist** covers the part no test can check — whether the crops are
actually true.

1. **Count.** Every one of the 50 files matched by
   `git ls-files question-bank/data/us-states/us-state-??.json` carries
   `top_crops` as an array of **at least one and at most three** strings. No
   state has zero, none has four or more, and no string is empty or
   whitespace-only after trimming.
2. **Register.** No shipped `top_crops` string is a machine label or carries a
   qualifier: each is trimmed (no leading or trailing whitespace), none matches
   `/[A-Z]{2,}/`, none contains a comma, and none contains `" - "`. Capitals are
   allowed only as the first letter of a proper noun (e.g. `Vidalia onions`).
3. **Distinctness.** Within a single state the strings are distinct
   case-insensitively after trimming — a state with three entries has three
   different crops, not two plus a repeat.
4. **Plant crops only.** No `top_crops` string anywhere in the 50 tracked files
   or in `CURATED_US_STATES` contains, case-insensitively, any of: `cattle`,
   `beef`, `dairy`, `milk`, `poultry`, `chicken`, `broiler`, `turkey`, `egg`,
   `hog`, `pig`, `swine`, `cow`, `livestock`. Those belong to T-068.
5. **The curated table is the source.** For each of the 50 states, the tracked
   file's `top_crops` array equals — same strings, same order — the `top_crops`
   of that state's entry in `CURATED_US_STATES`
   (`question-bank/src/curated/us-states.ts`), and every one of the 50 entries in
   that table carries the field.
6. **Offline determinism.** Two consecutive offline rebuilds via `rebuildOffline`
   (`question-bank/src/offline-rebuild.ts`), with all six proxy spellings pointed
   at the dead loopback, produce `top_crops` byte-identical to each other **and**
   to the tracked files — the crop values survive a rebuild with no network.
7. **No new network or environment surface.** The build reads no environment
   variable for crops (no `NASS`-named variable is referenced anywhere under
   `question-bank/src/`), makes no request to a new host, and no new file is
   added under `question-bank/src/fixtures/`. The build's outbound calls remain
   the Wikidata SPARQL endpoint and the Wikipedia summary API only.
8. **No test reaches the network.** After this task `question-bank/src/` still
   contains **exactly one** file with the `127.0.0.1:1` literal
   (`offline-rebuild.ts`), no `*.test.ts` there spawns `src/build.ts` directly,
   and any new suite imports `rebuildOffline` rather than re-creating it.
9. **The stale assertions are replaced, not deleted.** No test in
   `question-bank/src/` asserts `top_crops` is `[]` for the tracked files any
   more; each of the four that did — `climate-kid.test.ts:604`,
   `climate-kid-verify.test.ts:740`, `landmarks.test.ts:551`,
   `state-animals.test.ts:604` — asserts a populated invariant in its place, and
   the whole `question-bank` suite is green.
10. **No new dependency.** `question-bank/package.json` gains no runtime or dev
    dependency and `bun.lock` is unchanged.
11. **Docs no longer say the field is empty.** All three of
    `question-bank/sample-data/README.md:29`, the comment at
    `question-bank/src/normalize.ts:142–144`, and `PROGRESS.md:654` describe the
    field as populated from the curated table, and none of them still says
    `top_crops` awaits USDA NASS.
12. **The committed sample is untouched.**
    `question-bank/sample-data/us-state-co.json` is byte-identical to the default
    branch (its `top_crops` stays `[]`), and `sample-data/README.md` says
    explicitly that the sample is an older snapshot whose `top_crops` is empty
    while the tracked bank carries curated crops. T-064 owns that directory.
13. **Nothing else in the bank moves.** `question-bank/data/us-states/index.json`
    and the per-state files still agree on ids and count (50), and a diff of the
    51 tracked files under `question-bank/data/us-states/` against the default
    branch changes `top_crops` lines only. `built_at` in particular does not
    move: it is pinned to the fixture's `captured_at`, so a rebuild that shifts
    it means the build stopped being deterministic.
14. **Provenance is recorded in two places.** The header comment of
    `question-bank/src/curated/us-states.ts` and a new `engineering-decisions.md`
    entry both state: the values are hand-picked by a human, guided informally by
    production quantity, **not** derived from USDA NASS or any live source and
    not tied to a year; plant crops only, with livestock tracked separately by
    T-068; and that the curated strings are themselves the reviewed kid-facing
    text under `CLAUDE.md` "Content rules".

## Out of scope

- **A live USDA NASS integration.** Considered and rejected for this task — no
  Quick Stats key exists in this repo, this environment or CI secrets, and no
  agent can register for one. See "History" below and the `engineering-decisions.md`
  entry criterion 14 adds. There is no `sources/nass.ts`, no fixture, and no key
  handling in this task.
- **Livestock, poultry, dairy and eggs.** Now **T-068**, which adds a sibling
  curated field. Criterion 4 keeps them out of `top_crops`.
- **Question generation.** The `agriculture` template ("What grows most in
  &lt;state&gt;?") is T-026 and T-021, not this task.
- **World crops / FAOSTAT** (plan §1.9, second crops row).
- **Anything in `openapi.yaml`.** `topCrops` is already declared correctly.
- **The backend loader and served bank** (`backend/app/data/content.json`).
- **`question-bank/sample-data/us-state-co.json`** and deleting `sample-data/`
  (T-064) — criterion 12 freezes the file.
- **`climate_koppen`** (T-067), **Alaska's highest point** (T-016), **the two
  region vocabularies** (T-017) — separate entries even though this task touches
  neighbouring lines.
- **Refreshing the suite-size counts** (T-065), which this task will make stale
  again.

## Constraints

- **Files expected to change, and nothing outside them:**
  `question-bank/src/curated/us-states.ts` (the field, the 50 values, the header
  comment), `question-bank/src/normalize.ts` (the fold-in line — the current
  `top_crops: []` at `:145` is a literal, not a read from `curated`),
  `question-bank/data/us-states/*.json` (rebuilt output, never hand-edited),
  one new `question-bank/src/*.test.ts`, the four suites named in criterion 9,
  `question-bank/sample-data/README.md`, `PROGRESS.md`,
  `engineering-decisions.md`.
- **Built output is built.** `question-bank/data/us-states/*.json` is overwritten
  whole by `sinks/json.ts` with no merge (E-6), so every value must come from a
  build **input** — the curated table. A hand-edited JSON file does not survive
  the next rebuild and fails criterion 6.
- **The key must not become conditional.** A curated entry without `top_crops`
  must still yield `"top_crops": []` on the entity, the way `fun_facts` does at
  `normalize.ts:146` — do not spread the key conditionally the way `climate_kid`
  is spread, or a future blank state loses the key and moves the bank diff.
- **Curation guidance (not a testable criterion).** Pick crops the state is
  genuinely famous for — grapes for California, potatoes for Idaho — ordering
  them by rough production quantity where that is clear. Fewer than three is the
  right answer when three honest ones do not exist: `CLAUDE.md` says prefer a
  blank field to a guessed one. **If a state has no honest crop at all**, stop
  and say so in the Handoff rather than inventing one — criterion 1 requires at
  least one, so that is a return through `task-expander`, not a guess.
- **Content:** every shipped crop string is text a child reads and is graded on.
  There is no separate review step under this route; the curated table *is* the
  reviewed text, so it may contain nothing a human has not checked.
- **Dependencies:** none without asking (`CLAUDE.md`).
- **A criterion checked through `git ls-files` must be re-run with new files
  tracked** (`tasks.md` T-015, P-4): T-014's tester lost a round to a new file
  that was untracked when the check ran.

## Context

**Required reading for the worker and the tester.**

- Fold-in pattern to copy: `question-bank/src/normalize.ts:137–146` —
  `climate_kid`, `state_animal`, `landmark` (conditional spread) and `fun_facts`
  (`?? []`, the shape an array field wants). The line to change is `:145`.
- The curated table and its header comment:
  `question-bank/src/curated/us-states.ts` — the `CuratedState` interface at the
  top, each optional field documented with why it is curated rather than queried.
- Field and contract: `question-bank/src/types.ts:51`;
  [`openapi.yaml`](../openapi.yaml) line 1480 (`topCrops`) and the `Entity`
  description at 1426–1430 ("Absent means not applicable or not yet sourced;
  generators must gate on presence").
- Plan: [`geoquizdataplan.md`](../geoquizdataplan.md) §1.9 (the crops row, and
  the rule that everything is resolved at build time and shipped as JSON) and
  §1.4's entity example (`"top_crops": ["corn", "wheat", "hay"]`, line 53) — the
  shape and register expected.
- Determinism: `question-bank/src/build.ts:171–178` (`built_at` from the
  fixture's `_fixture.captured_at`) and
  `question-bank/src/committed-bank.test.ts:173–192` (byte-identity of the
  tracked bank across two offline rebuilds).
- Test harness: `question-bank/src/offline-rebuild.ts` (import `DEAD_PROXY` and
  `rebuildOffline` — do not re-create either) and the guards that enforce it,
  `question-bank/src/climate-kid.test.ts:635–693`.
- The assertions criterion 9 must replace: `climate-kid.test.ts:604`,
  `climate-kid-verify.test.ts:740`, `landmarks.test.ts:551`,
  `state-animals.test.ts:604`.
- The sample-data guard criterion 12 must not break:
  `question-bank/src/climate-kid.test.ts:522–540`.
- Decisions: [`engineering-decisions.md`](../engineering-decisions.md) E-6 — why
  the bank is committed and why a hand-edited value in built output cannot
  survive a rebuild. The new entry is E-7.
- Rules: [`test-guidelines.md`](../test-guidelines.md) "No network in tests,
  ever"; [`CLAUDE.md`](../CLAUDE.md) "Content rules".
- Queue: [`tasks.md`](../tasks.md) T-015, T-068 (livestock, the sibling this
  task deliberately excludes) and T-026's `agriculture` row (line 448), the
  consumer of this field.

## Review checklist — the part no test can check

The criteria above check shape, not truth. A human signs off on the content:

- [ ] Every crop listed is genuinely one that state is known for — spot-check the
      states where a wrong answer would be most visible (California, Iowa, Idaho,
      Florida, Kansas, Washington, Maine).
- [ ] No entry is a guess made to reach three. Short lists are expected and fine.
- [ ] Every string reads naturally to a child: "sweet corn", not "corn for
      grain"; "peaches", not "peach production".
- [ ] No state's list would make the `agriculture` question ambiguous — e.g. two
      states whose only listed crop is the same, where the quiz asks which state
      grows it.

## History — the questions this brief halted on, and their answers

Kept because Out of scope points here for *why* the live-NASS route was
rejected. Nothing below is still open.

### Answers, from Dkaattae, 2026-09-17

- **Q1 — Route B.** Hand-curated `top_crops` on `CuratedState`, folded in by
  `normalize.ts` exactly as `climate_kid`/`state_animal`/`landmark` are. No NASS
  module, no fixture. A few very well-known crops per state — e.g. grapes for
  California, potatoes for Idaho — not an exhaustive top-N from a live source.
  **This also means criterion 1's "exactly three" should be revisited**: a
  curated "what's this state actually famous for" list may genuinely have fewer
  than three honest entries for some states, and forcing three risks a guess
  where `CLAUDE.md`'s "prefer a blank field to a guessed one" says to leave it
  short instead. Finalize this as up to three, allowing fewer, rather than
  exactly three.
- **Q2 — Not needed.** Confirmed by Q1: no key, no live capture, route A is
  dropped entirely. Delete the route-A-only criteria (11–14) and the route-A row
  from Constraints' "files expected to change."
- **Q3 — Ranked by production quantity**, used informally as the human's guide
  when picking which crops are genuinely famous for a state, not as a NASS
  statistic tied to a specific year (there is no live lookup to pin a year to).
  **Livestock does not count as a crop** — cattle, dairy, poultry and eggs are
  tracked separately now: see the new queue entry **T-068**, added to
  `tasks.md` alongside this task, sized independently. `top_crops` stays
  plant crops only. Whose words: the curated table itself is the reviewed,
  kid-facing text — there is no separate machine-label rewrite step under route
  B, so drop that part of Q3 as moot.

### Q1 — Where do the shipped values come from? (as posed)

The constraint that ruled the choice is E-6:
`question-bank/data/us-states/*.json` is **built output**, overwritten whole by
every rebuild, and `committed-bank.test.ts` (lines 173–192) spawns the CLI
offline twice and asserts the tracked bytes match. So `top_crops` values must
come from something the *offline* build reads.

| Route | What lands | What it costs |
|---|---|---|
| **A — live source module + committed fixture** | `sources/nass.ts` with a transport seam, a captured `src/fixtures/us-crops.nass.json` (`_fixture.captured_at`, as `test-guidelines.md` requires), replayed on `--offline` | Needs a key **and** a human to run the live capture once. Matches plan §1.9 and the task title. Commits a captured third-party response — precedent exists (`us-states.sparql.json`), but it is ~50 states × commodities of JSON |
| **B — hand-curated field** *(chosen)* | `top_crops` on `CuratedState` in `curated/us-states.ts`, folded in by `normalize.ts` exactly as `climate_kid`, `state_animal` and `landmark` are | No key, ships this cycle, and a human reads the crop names anyway (they are kid-facing). Abandons the "source module" the queue entry asks for, and the values go stale with nothing to refresh them |
| **C — module now, data later** | The seam, the env handling, the fixture-replay path — `top_crops` stays `[]` | Does not satisfy the queue entry's own "Done when" |

### Q2 — Who supplies the key, and when? (as posed)

- **There is no key anywhere**: no `NASS_API_KEY` in this environment, no
  `.env.example`, no `secrets.*` reference in `.github/workflows/` at all.
- **No agent can obtain one** — Quick Stats keys come from a signup form and an
  email, which is an external action outside every role's remit.
- CI cannot help: the `question-bank` job runs with all six proxy spellings
  pointed at `127.0.0.1:1` (`.github/workflows/ci.yml`), so a live fetch can
  never run there by design.

### Q3 — "Top three" by what measure, and in whose words? (as posed)

- **Ranked by** acres harvested, production quantity, or value of production?
  California is grapes/almonds/strawberries by value and roughly hay/almonds/
  wheat by acreage — different quiz answers for the same state.
- **Which year**, and is a single year or a multi-year average wanted?
- **Is livestock a crop?** Cattle is the top agricultural commodity by value in
  several states and is not a crop.
- **Whose words?** NASS commodity labels are machine strings in caps, and every
  shipped string is text a child reads.

## Handoff

_Not started._

## Verdict

_Not started._
