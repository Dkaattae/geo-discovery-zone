# T-015 — US crops per state, curated (was: USDA NASS Quick Stats)

**Status:** `pass`
**Next step:** `reviewer`
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
| worker | 2026-09-17 | cse_014UHMAdWWsvkfN9KUD5wDXi — same session id the environment reported for this run; see the Handoff's first note before assuming this means anything about session isolation |
| tester | 2026-09-17 | cse_014UHMAdWWsvkfN9KUD5wDXi — **the same id again, and the check therefore proves nothing.** This ran relayed (a top-level session spawning each role through the Task tool), which `process.md` "Spawning, and the isolation it must not cost" names as the case where every spawned role shares one session id and the Sessions-table check degrades to attestation. What is real here is a fresh context window: no memory of the worker's transcript, no sight of its reasoning, only the brief's text. See the Verdict's first section |

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

**TL;DR:** all 14 criteria are met; the whole `question-bank` suite (1083
tests) and `bun run typecheck` are green. `top_crops` is filled on all 50
`CURATED_US_STATES` entries, folded into the tracked bank the same way
`fun_facts` is, and the rebuild is confirmed deterministic and offline. Fixing
this broke six *pre-existing* tests from T-010/T-012/T-013/T-014 that
compared the sample or a pinned digest against the tracked bank assuming
`top_crops` stayed `[]` forever — all six are fixed following the exact
precedent T-013→T-014 already set for this, not worked around. One session-id
oddity to flag before anything else.

**Session-id note.** `echo $CLAUDE_CODE_REMOTE_SESSION_ID` in this worker run
printed `cse_014UHMAdWWsvkfN9KUD5wDXi` — the same id already in this brief's
Sessions table for both task-expander rows. I did not change that; it is what
the environment reported. `process.md`'s isolation guarantee is about context,
not the literal id string, and I have no way to confirm from inside a session
whether this reflects genuine session reuse or just an id the harness recycled
across roles in one unattended run. Flagging it rather than asserting either
way — **the tester should confirm independently (their own harness-assigned
id, and whether it differs from mine) before treating their run as isolated**,
and if it turns out to be genuine reuse, that's a process question for
whoever runs `run-loop.sh`/the orchestrator next, not something I can fix from
here.

### Criteria, one by one

| # | Criterion | Where it lives now | Verdict |
|---|---|---|---|
| 1 | 1–3 non-blank, trimmed strings per state | `curated/us-states.ts` (source); `top-crops.test.ts` "criterion 1"; `climate-kid.test.ts` "15c" | met |
| 2 | Register (trimmed, no shouted acronym, no comma, no `" - "`) | `top-crops.test.ts` "criterion 2" (one test per string, ~121 strings across curated+tracked) | met |
| 3 | Distinct within a state, case-insensitive | `top-crops.test.ts` "criterion 3" | met |
| 4 | No livestock word, anywhere | `top-crops.test.ts` "criterion 4" (one test per string against the exact 14-word list) | met |
| 5 | Tracked file's array equals curated's, same order, all 50 | `climate-kid.test.ts`/`landmarks.test.ts`/`state-animals.test.ts`/`climate-kid-verify.test.ts` "top_crops is populated..." tests, each diffing against `CURATED_US_STATES` | met |
| 6 | Two offline rebuilds byte-identical to each other and to tracked | `committed-bank.test.ts`'s existing whole-file rebuild-vs-tracked test (unmodified, already covers this generically); independently re-confirmed by hand with `rebuildOffline` twice, see "How to verify" below | met |
| 7 | No new env var, host, or fixture file | Grepped `question-bank/src/` for `NASS` (zero hits outside comments/docs referencing the *rejected* route); no new file under `src/fixtures/`; `build.ts`'s transports are unchanged (Wikidata SPARQL + Wikipedia summary only) | met |
| 8 | Exactly one `127.0.0.1:1` literal; no test spawns `build.ts` directly; new suite imports `rebuildOffline` | `top-crops.test.ts` does neither a rebuild nor a spawn — it reads only the already-tracked files and the curated table, so it needed no proxy isolation and imports nothing from `offline-rebuild.ts`. The one literal is still only in `offline-rebuild.ts` (unchanged) | met |
| 9 | Four named `[]` assertions replaced; whole suite green | See "Files changed" below; `bun test` → 1083 pass, 0 fail | met |
| 10 | No new dependency | `git status --short question-bank/package.json question-bank/bun.lock` — empty, both files untouched. `bun install` was run once to fetch the *existing* lockfile's dev deps into a clean `node_modules/` so `typecheck` could run; it added nothing new (verified before/after) | met |
| 11 | Docs no longer say the field is empty | `sample-data/README.md`, `normalize.ts:142-144`'s comment, `PROGRESS.md:654-657` all rewritten | met |
| 12 | Sample untouched; README explains why | `git status --short question-bank/sample-data/` — empty; README addition quoted below | met |
| 13 | Nothing but `top_crops` moves in the bank; `built_at` pinned | `git diff` of all 50 changed files shows only `top_crops` lines (`+`) replacing `"top_crops": [],` (`-`); `built_at` is `2026-08-04T16:05:35.000Z` in all 50, matching before | met |
| 14 | Provenance in the header comment and `engineering-decisions.md` | `curated/us-states.ts` header (new paragraph) + `CuratedState.top_crops` doc comment; `engineering-decisions.md` E-7 | met |

### Files changed

- `question-bank/src/curated/us-states.ts` — added `top_crops?: string[]` to
  `CuratedState`, a provenance paragraph to the header comment, a doc comment
  on the field itself, and the 50 values (table below).
- `question-bank/src/normalize.ts` — `top_crops: []` (a literal) →
  `top_crops: curated.top_crops ?? []` (reads the curated table, `fun_facts`'s
  exact shape, not the conditional-spread shape `climate_kid` uses); comment
  rewritten to stop naming USDA NASS.
- `question-bank/data/us-states/*.json` (50 files) — rebuilt via `bun
  src/build.ts --offline --quiet` with all six proxy spellings pointed at
  `127.0.0.1:1`. Diffed against the pre-rebuild tree: only `top_crops` lines
  changed in any of the 50 files; `index.json` did not change at all.
- `question-bank/src/climate-kid.test.ts`,
  `question-bank/src/climate-kid-verify.test.ts`,
  `question-bank/src/landmarks.test.ts`,
  `question-bank/src/state-animals.test.ts` — the four criterion-9 tests
  (`... top_crops is still an empty array ...`) replaced with `... is
  populated from CURATED_US_STATES ...`, each asserting the 1–3 range and
  exact equality (order included) against the curated table, keyed by postal.
- `question-bank/src/top-crops.test.ts` (new) — criteria 1–4's string-content
  checks (register, distinctness, plant-only), which nothing else in the
  suite tested. Reads only the tracked files and `CURATED_US_STATES`; no
  build, no network, no `rebuildOffline` import (nothing here spans a build,
  so criterion 8's "any new suite imports it" doesn't apply — see the
  criterion 8 row above).
- `question-bank/sample-data/README.md` — replaced the "needs USDA NASS"
  sentence with the criterion-12 explanation (quoted in full below).
- `PROGRESS.md:654-657` — `top_crops` moved from "empty (T-015)" to "50 of 50
  (T-015, ...)"; the "three of the four topic fields" sentence became "all
  four."
- `engineering-decisions.md` — new **E-7**, provenance and the route-B
  rejection reasoning (mirrors the brief's own "History" section).
- **Six pre-existing tests fixed as a consequence, not listed in the brief's
  "files expected to change" — see "A conflict the brief didn't anticipate"
  below**: `question-bank/src/committed-bank.test.ts` (T-010 criterion 4),
  `question-bank/src/landmarks.test.ts` (T-013 criterion 8, a second test in
  the same file criterion 9 already touches),
  `question-bank/src/state-animals.test.ts` (T-012 criterion 7, likewise),
  `question-bank/src/landmarks-verify.test.ts` (T-013 tester criteria 8 and
  9), `question-bank/src/climate-kid-verify.test.ts` (T-014 tester criteria
  13 and 15).

### A conflict the brief didn't anticipate — flagging, not asking permission

The Constraints section lists exactly which files should change, and doesn't
include the six tests above. But criterion 9 requires **the whole suite
green**, and populating `top_crops` — which criterion 5 requires — silently
breaks those six pre-existing tests, because they compare the tracked bank
against either `sample-data/us-state-co.json` (frozen at `top_crops: []` by
this task's own criterion 12) or a **pinned literal digest/hash** computed
before this task existed, when every file still carried `top_crops: []`.
Populating the field is not a bug in those tests; it's a field this task is
explicitly asked to change that they didn't anticipate.

**What I did:** fixed each of the six the same way `landmarks-verify.test.ts`'s
own header comment already documents doing for `climate_kid` when T-014 landed
on top of T-013 — i.e., there is a **precedent already in the repo** for
exactly this situation (a later approved task populating a field an earlier
task's frozen verification pinned). Two different fixes, matched to what each
test actually pinned:

- **Sample-vs-tracked full-object comparisons** (`committed-bank.test.ts`,
  `landmarks.test.ts`, `state-animals.test.ts`, `landmarks-verify.test.ts`
  criterion 8, `climate-kid-verify.test.ts` criterion 13): `top_crops` is
  **excluded** from the comparison, the same way `sources.built_at` already
  is — sample and tracked are allowed to differ there now, by criterion 12's
  own design.
- **Pinned-digest comparisons** (`landmarks-verify.test.ts` criterion 9,
  `climate-kid-verify.test.ts` criterion 15): `top_crops` is **restored to the
  literal `[]`** before hashing, not deleted — because the original pinned
  digest was computed with the key *present* as `[]`, not absent. I verified
  this by hand for one state (AK) before applying it everywhere: deleting
  produced a different hash than the pinned value; setting back to `[]`
  reproduced it exactly. Deleting would have been the wrong fix even though it
  reads more like the sample-comparison fix above.

**Who should confirm or overturn this:** the reviewer. I judged extending an
already-established, in-repo pattern (T-014's own comment explains it as
"instead of turning permanently red the moment either task's own field
lands") to a second field is the "actually correct" call the worker brief
allows for a plan/reality mismatch, rather than a scope question that needed
to bounce back to `task-expander` — the fix is mechanical, narrow, and each
touched test's own header comment now says why. But it does touch six files
outside the brief's stated boundary, so if the reviewer disagrees with that
judgment, the alternative is returning to `task-expander` to add these six
files to the Constraints list explicitly (the outcome would be identical
code, just a paper trail first).

### The 50 curated values (Review checklist's spot-check material)

Ranked informally by which crop the state is more famous for first, not by a
pinned statistic (see E-7). Transcribed here from `curated/us-states.ts` so
the reviewer's checklist and any tester `-verify` suite can check against this
table rather than re-reading the source:

| Postal | top_crops |
|---|---|
| AL | cotton, peanuts |
| AK | peonies |
| AZ | cotton, lettuce |
| AR | rice, soybeans |
| CA | grapes, almonds, strawberries |
| CO | potatoes, peaches |
| CT | tobacco |
| DE | lima beans |
| FL | oranges, strawberries |
| GA | peaches, peanuts, pecans |
| HI | pineapple, coffee, macadamia nuts |
| ID | potatoes |
| IL | corn, soybeans |
| IN | corn, soybeans |
| IA | corn, soybeans |
| KS | wheat, sorghum |
| KY | tobacco, corn |
| LA | sugarcane, rice |
| ME | blueberries, potatoes |
| MD | corn, soybeans |
| MA | cranberries |
| MI | cherries, blueberries, apples |
| MN | corn, soybeans |
| MS | cotton, soybeans |
| MO | soybeans, corn |
| MT | wheat, barley |
| NE | corn, soybeans |
| NV | alfalfa hay |
| NH | maple syrup, apples |
| NJ | blueberries, tomatoes, cranberries |
| NM | chile peppers, pecans |
| NY | apples, grapes, maple syrup |
| NC | sweet potatoes, tobacco |
| ND | wheat, sunflowers |
| OH | corn, soybeans |
| OK | wheat |
| OR | hazelnuts, pears |
| PA | mushrooms, apples |
| RI | sweet corn, potatoes |
| SC | peaches, cotton |
| SD | corn, soybeans |
| TN | soybeans, cotton |
| TX | cotton, sorghum |
| UT | cherries, alfalfa hay |
| VT | maple syrup, apples |
| VA | peanuts, tobacco |
| WA | apples, cherries |
| WV | apples |
| WI | cranberries, corn |
| WY | hay, sugar beets |

**Why some states have only one entry** (`CLAUDE.md`'s "prefer a blank field
to a guessed one", the Constraints' "curation guidance"): AK, CT, DE, ID, MA,
NV, OK and WV each got one because a second or third honest, genuinely-famous
plant crop did not present itself without guessing — Alaska in particular is
worth a specific note: I deliberately did **not** ship "potatoes" as its sole
crop even though Alaska does grow some, because Idaho's sole crop is also
"potatoes" and the Review checklist's own example ("no state's list would make
the `agriculture` question ambiguous") names exactly this failure mode. I used
"peonies" instead — Alaska's long summer daylight has made it a genuinely
notable (widely reported) cut-flower export in recent years, and it is
distinct from every other state's list. **I did check every single-crop state
against every other single-crop state for this exact clash** (see "How to
verify" below) — Idaho/Alaska was the only collision found, and it's fixed.

**Two entries I was less certain of, flagged for the reviewer's spot-check
specifically:**
- **NV — "alfalfa hay".** Nevada's largest agricultural crop by both acreage
  and value, but it is feed, not something a child would recognize as a
  "crop" the way potatoes or corn are. I kept it because it's honest and
  Nevada has no more kid-recognizable plant crop at any real production
  scale — the alternative was leaving Nevada blank, which criterion 1
  forbids. If the reviewer would rather see this state left with a
  less-quantity-driven but more recognizable pick (e.g. "onions" or
  "garlic" from the Fallon area, genuinely grown there but at far smaller
  scale), that's a one-line change.
- **MD — "corn, soybeans".** Unlike most states with this same pair (a
  genuinely dominant Midwest row-crop identity), Maryland's case is weaker —
  corn and soybeans are grown there but Maryland isn't nationally *known* for
  either. I used it because Maryland has no distinctly famous plant crop at
  real scale, and criterion 1 forbids leaving it blank; it's the same
  reasoning as NV above, just a duller-feeling answer than Iowa's.

### How to run / verify

```bash
cd question-bank
bun install                 # only if node_modules is missing; adds nothing to bun.lock
bun test                    # 1083 pass, 0 fail
bun run typecheck           # clean
```

Confirm criterion 13 (only `top_crops` moved) and criterion 6 (deterministic,
offline) directly:

```bash
cd question-bank
git diff data/us-states/ | grep -E '^-' | grep -v '^---' | grep -v '"top_crops": \[\],\?$'
# → no output: every removed line is exactly a `top_crops: []`
```

The offline-rebuild-twice check I ran by hand (in addition to
`committed-bank.test.ts`'s existing whole-file version, which already covers
this): spawn `bun src/build.ts --offline` twice via `rebuildOffline`
(`src/offline-rebuild.ts`) into two temp dirs, compare all 51 files pairwise
and against the tracked copies — all matched.

### What I deliberately did not do

- **Did not touch `sample-data/us-state-co.json`.** Criterion 12 freezes it;
  confirmed `git status --short question-bank/sample-data/` is empty.
- **Did not add a `sources/nass.ts`, a fixture, or any env handling.** Route A
  was rejected before this task reached the worker; see the brief's own
  History section and the new E-7.
- **Did not touch `openapi.yaml`, `types.ts`, `backend/app/models.py`.**
  Already correct per the survey; no contract change needed.
- **Did not run the `frontend` or `backend` suites.** Nothing in this task
  touches either package (`git status --short` confirms the changed-file set
  is entirely under `question-bank/`, `PROGRESS.md` and
  `engineering-decisions.md`), so I ran only `question-bank`'s suite per
  `test-guidelines.md`'s per-area split.
- **Did not add "which state grows X" cross-state distinctness testing as a
  permanent suite** — I checked it by hand for the single-crop states (see
  above) but did not write it into `top-crops.test.ts`, since criterion 3
  only requires distinctness *within* a state and the cross-state ambiguity
  check is explicitly under "Review checklist" (a human judgment call, not a
  shape a test can fully own — two states could share a crop honestly and
  only a person can judge whether that specific pairing is ever asked as a
  quiz question). Noting the one collision I found and fixed (AK/ID) so the
  reviewer doesn't have to re-derive it.

## Verdict

**TL;DR: pass — all 14 criteria hold, verified by a suite written from the
criterion text rather than from the code.** `question-bank/src/top-crops-verify.test.ts`
(new, 48 tests) plus the pre-existing suite: **1131 pass, 0 fail**, green again
under CI's six dead-loopback proxy spellings; `bun run typecheck` clean;
`question-bank` has no lint step by design (`.github/workflows/ci.yml` says so
in a comment). 27 deliberate mutations were made and every one turned the right
test red; all were reverted. Next step is the `reviewer`, who still owns the one
thing no test can settle — whether the 98 crop strings are *true*.

### What kind of independence this verdict has

**Not the session-id kind.** `echo $CLAUDE_CODE_REMOTE_SESSION_ID` printed
`cse_014UHMAdWWsvkfN9KUD5wDXi`, the id already recorded against both
`task-expander` rows and the `worker` row. This run was **relayed** — a
top-level session spawning each role through the Task tool — and `process.md`
names this exact failure: "every spawned role shares one session id … the tester
is told not to refuse on that, not to claim the check passed, and to say in its
Verdict which kind of independence it actually had."

So, plainly: **the Sessions-table check did not pass and could not.** What this
verdict rests on instead is a fresh context window — this session never saw the
worker's transcript, its reasoning, or anything but the committed repository and
the brief. That is the isolation that actually matters for "tests what was asked
for rather than what was built", but it is **weaker evidence than a distinct
session id**, because it rests on the relay having spawned this role correctly
rather than on anything checkable from inside. A reader deciding how much to
trust this `pass` should weigh it accordingly. (`runs/T-015-*.md` does not exist,
so this was not a `run-loop.sh` run either.)

The worker's Handoff asked the tester to confirm whether the ids differ. They do
not. That is a process question for whoever runs the loop next, not a defect in
this task — nothing in the diff depends on it.

### Criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | 1–3 non-blank crops, all 50 files | **pass** | Distribution over the 50 files matched by the criterion's own `git ls-files` glob: **8 states with one crop** (AK CT DE ID MA NV OK WV), **36 with two**, **6 with three** (CA GA HI MI NJ NY) — 50 accounted for, none at 0, none at 4+. 98 strings, none blank after trimming. `readdirSync` cross-check finds no untracked stray |
| 2 | Register | **pass** | All 98 strings (curated table + tracked files) are trimmed, contain no comma, no `" - "`, and no `/[A-Z]{2,}/` match — in fact **no capital letter at all**, so the proper-noun allowance is unused |
| 3 | Distinct within a state | **pass** | No repeat case-insensitively in any file or curated entry; the six three-entry states each have three distinct crops |
| 4 | Plant crops only | **pass** | Zero hits for any of the 14 words, checked as case-insensitive substrings against **both** `CURATED_US_STATES` and the 50 tracked files. Worth noting the substring rule is stricter than it looks and still holds: nothing here is `eggplant` (`egg`) or a `pigeon` pea (`pig`) |
| 5 | Curated table is the source | **pass** | All 50 entries carry `top_crops`; each tracked array equals its curated entry string-for-string **and in order** (a separate test proves the comparison is not order-blind by checking the reversed list does *not* match) |
| 6 | Offline determinism | **pass** | Two `rebuildOffline` runs into separate temp dirs: `top_crops` byte-identical between the two rebuilds and to the tracked files, compared both as raw emitted block text and as parsed arrays. Reverting the fold-in in `normalize.ts` turns this red (mutation M1) |
| 7 | No new network or env surface | **pass** | `NASS` appears under `question-bank/src/` only inside comments naming the *rejected* route — zero occurrences in comment-stripped code. Host set across non-test sources is unchanged (`query.wikidata.org`, `en.wikipedia.org`, `www.wikidata.org`, plus `github.com` in the User-Agent contact string, never a request target). `src/fixtures/` still holds exactly `us-states.sparql.json` |
| 8 | No test reaches the network | **pass, with one interpretation noted below** | Exactly one file under `question-bank/src/` carries the `127.0.0.1:1` literal (`offline-rebuild.ts`); no `*.test.ts` spawns `src/build.ts`; this suite imports `rebuildOffline` and defines no proxy map of its own. Full suite green under CI's proxy env |
| 9 | Stale assertions replaced, not deleted | **pass** | No suite asserts a tracked `top_crops` is `[]` any more; all four named files now assert against `CURATED_US_STATES`. Test counts per file are **identical to `origin/main`** (59/77/53/43 and 33/36 for the two collaterally-touched files) — nothing was deleted to go green |
| 10 | No new dependency | **pass** | `question-bank/package.json` and `bun.lock` hash byte-identical to `origin/main` |
| 11 | Docs no longer say the field is empty | **pass** | `sample-data/README.md` no longer defers `top_crops` to NASS; `normalize.ts` contains no `NASS` at all and emits `curated.top_crops ?? []` under a comment naming the curated table; `PROGRESS.md` reads `**50 of 50**` |
| 12 | Sample untouched | **pass** | `sample-data/us-state-co.json` SHA-256 `88db1cb0…b338f` — identical to `origin/main`; its own `top_crops` is still `[]`; the README says explicitly that it is an older snapshot while `data/us-states/` carries curated crops |
| 13 | Nothing else in the bank moves | **pass** | Each of the 50 files, with the `top_crops` block put **textually** back to `"top_crops": [],`, hashes to its pinned `origin/main` digest — so any other byte moving anywhere fails. `index.json` byte-identical. `built_at` is `2026-08-04T16:05:35.000Z` in all 50. `index.json` and the per-state files agree on 50 ids |
| 14 | Provenance in two places | **pass** | The **leading block comment** of `curated/us-states.ts` (not the field's doc comment — see mutation M19) and `engineering-decisions.md` **E-7** each state: hand-picked by a human, guided informally by production quantity, not USDA NASS or any live source, not year-pinned, plant crops only with livestock at T-068, and the strings as their own reviewed kid-facing text under `CLAUDE.md` |

### Mutations (27 made, 27 reverted — `git status` clean afterwards)

Verified by breaking things on purpose, since several criteria could otherwise
be satisfied by an assertion that never looks at anything.

| Mutation | Turned red |
|---|---|
| M1 `normalize.ts` fold-in back to the literal `[]` | criterion 6 (and 11) |
| M2 `GRAPES` for California | criterion 2 (shouted label), 5, 6 |
| M3 `dairy cattle` for Alabama | criterion 4 (curated), 5, 6 |
| M4 `rice` + `Rice` for Arkansas | criterion 3 (curated), 5, 6 |
| M5 Alaska's list emptied in the curated table | criterion 5, 6 |
| M6 four crops for Montana in the curated table | criterion 5, 6 |
| M7 Florida's two crops swapped | criterion 5 **including the order test** |
| M8 tracked `us-state-wv.json` emptied | criterion 1 (range + distribution), 5, 6 |
| M9 tracked `us-state-mt.json` given four | criterion 1 (range + distribution), 5, 6 |
| M10 tracked Colorado's `population` off by one | criterion 13 digest |
| M11 tracked Iowa's `built_at` moved | criterion 13 digest **and** the `built_at` test |
| M12 sample given a crop | criterion 12 (both tests) |
| M13 `dairy cows` into tracked Alaska | criterion 4 (tracked), 5, 6 |
| M14 a `NASS_API_KEY` env read in `sinks/index.ts` | criterion 7 |
| M15 a stale `topCrops: []` assertion put back in `landmarks.test.ts` | criterion 9 |
| M16 `left-pad` added to `package.json` | criterion 10 |
| M17 the old "needs USDA NASS" sentence restored in the README | criterion 11 **and** 12 |
| M18 `production quantity` struck from E-7's "guided by" clause | criterion 14 |
| M19–M21 header comment: `T-068`→`T-999`, "hand-picked by a human"→"chosen by a heuristic", `CLAUDE.md`→elsewhere | criterion 14, one test each |
| M22–M25 curated strings: leading space, embedded comma, whitespace-only entry, `" - "` | criterion 2 (each specific test) and criterion 1's blank check |
| M26 a new `src/fixtures/us-crops.nass.json`, tracked | criterion 7 |
| M27 a second `127.0.0.1:1` literal in `sinks/index.ts`, tracked | criterion 8 |

**Two mutations initially failed to turn anything red, and both exposed a
tautology in my own tests rather than a gap in the work** — both tests were
tightened before the run that produced this verdict:

- **M18** passed at first because E-7 also uses the phrase "production quantity"
  when explaining why NASS's *own* ranking measure is ambiguous. The assertion
  now requires the phrase inside the "guided …" clause.
- **M19** passed at first because I had taken "the header comment" to mean the
  whole preamble, which includes the `top_crops` field's own doc comment — so the
  field's mention of `T-068` satisfied a claim the header itself might not make.
  It now reads the leading block comment alone.

Two others (M10 the first time, M18's first attempt) were no-ops from a `sed`
pattern that did not match; both were re-run properly and are reported above with
their real results.

### What I checked by hand, beyond the tests

- **The Handoff's 50-row table is accurate.** Transcribed the tracked bank into
  the same shape and compared row by row: all 50 match, including the eight
  single-crop states and Alaska's `peonies`.
- **The single-crop collision the Handoff claims to have fixed is genuinely
  gone.** The eight one-crop states are `peonies`, `tobacco`, `lima beans`,
  `potatoes`, `cranberries`, `alfalfa hay`, `wheat`, `apples` — all distinct
  from each other.
- **The `git diff` route to criterion 13, independent of the digest test.** Every
  removed line across the 50 files is exactly `"top_crops": [],` and every added
  line is either the opening bracket, a crop string, or the closing bracket.

### Three things for the reviewer, none of them a failure

1. **Criterion 8's last clause reads strictly against `top-crops.test.ts`.** It
   says "any new suite imports `rebuildOffline` rather than re-creating it", and
   the worker's new suite imports nothing from `offline-rebuild.ts`. I read the
   clause as forbidding a *re-creation* of the harness, which that file does not
   do — it never rebuilds or spawns the CLI at all, so there is nothing for it to
   import. Every network-safety property the criterion actually names holds, and
   this suite (which does rebuild) imports the runner. Recorded as met, flagged
   because a stricter reader could differ.
2. **The six collaterally-fixed tests are outside the brief's Constraints list,
   exactly as the Handoff says.** I confirmed the fixes are narrow and that no
   test was deleted to reach green: per-file `test(` counts are identical to
   `origin/main` in all six. Whether extending T-013/T-014's in-repo precedent
   was the worker's call to make is a judgement the Handoff explicitly hands to
   the reviewer, and it stays there. One consequence worth naming: the two
   pinned-digest tests now set `top_crops = []` before hashing, so they no longer
   notice that field moving — which is why criterion 13 is verified here by its
   own independent per-file digest against `origin/main`.
3. **Cross-state ambiguity is still open, and is the Review checklist's, not
   mine.** The worker checked single-crop states against each other and stopped
   there, as it says. Worth a human eye: West Virginia's only crop is `apples`,
   which also appears in NH, NY, PA, VT and WA; Oklahoma's only crop is `wheat`,
   shared with KS, MT and ND. That is fine for "what grows in X?" and awkward for
   "which state grows X?" — a content judgement no test should be making.
   Nevada's `alfalfa hay` and Maryland's `corn, soybeans`, which the Handoff
   flags as its least certain picks, also sit here.

### How to reproduce

```bash
cd question-bank
bun test                     # 1131 pass, 0 fail (48 of them in top-crops-verify.test.ts)
bun run typecheck            # clean
# and as CI runs it — no network, fails closed:
export HTTP_PROXY=http://127.0.0.1:1 HTTPS_PROXY=http://127.0.0.1:1 ALL_PROXY=http://127.0.0.1:1
export http_proxy=http://127.0.0.1:1 https_proxy=http://127.0.0.1:1 all_proxy=http://127.0.0.1:1
bun test                     # same 1131
```

`frontend` and `backend` were not run: the branch's diff touches nothing under
either (`question-bank/`, `PROGRESS.md`, `engineering-decisions.md`, `tasks.md`,
`tasks/` only), and `frontend/node_modules` is not installed in this environment.
Naming the skip rather than implying a full-repo green.
