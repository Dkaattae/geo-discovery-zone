# T-014 — Curate kid-facing climate phrasing

**Status:** `verified — pass (shape); Review checklist still open for a human`
**Next step:** `reviewer`
**Approved:** `Dkaattae — 2026-09-17`
**From:** [`tasks.md`](../tasks.md) T-014
**Branch:** `claude/ecstatic-mendel-x3m3tk` — this session's harness assigned it
and forbids pushing elsewhere (`CLAUDE.md` "Branches", `process.md` "When the
environment names the branch for you"). **This line is the authority**, not
`task/T-014-…`: it is the branch the PR is built from and the one every later
role pushes to. Check `git branch --show-current` against it before you start.
**PR:** [#44](https://github.com/Dkaattae/geo-discovery-zone/pull/44), opened
draft at expand time from the branch above. It stays draft until the reviewer
approves it.
**Fault:** —

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-16 | cse_01EA17nGfGQfj9H6WstCQo5j |
| worker | 2026-09-17 | cse_01EA17nGfGQfj9H6WstCQo5j |
| tester | 2026-09-17 | cse_01EA17nGfGQfj9H6WstCQo5j (relayed run — see Verdict) |

---

## Goal

Give every US state one sentence-fragment describing its climate in words a
nine-year-old uses, held in the curated build input, so the `climate` topic
(T-026) has data to generate from. Fifty judgement calls about wording, not a
query: the plan says outright that the Köppen codes have to be mapped to
kid-friendly phrasing by hand (§1.9), and the pipeline does not even carry the
codes.

**This is a content-and-curation task** (`process.md`, "Tasks this loop does not
fit"): the criteria below check *shape*, and the substance — is this true of that
state, can a child read it — is the **Review checklist** at the bottom, closed by
a named person on the PR. Both are required and neither substitutes for the other.

## What the survey found — what is already true, and what is not

Read this before planning anything. The plumbing exists; the work left is the
curation, the rebuild, and one decision about the test harness.

**Already true — do not rebuild any of it:**

- **The field exists** on both sides: `CuratedState.climate_kid?: string`
  (`question-bank/src/curated/us-states.ts:31`) and `Entity.climate_kid?: string`
  (`question-bank/src/types.ts:50`).
- **The fold-in exists.** `normalize.ts:137` already emits
  `...(curated.climate_kid ? { climate_kid: curated.climate_kid } : {})` —
  conditional, so a curated blank means the key is **absent** from the built
  entity. No change to `normalize.ts` should be needed.
- **Colorado is already filled and already correct.**
  `climate_kid: "dry and cold in the mountains, drier plains to the east"`
  (`us-states.ts:127`), present in both
  `question-bank/data/us-states/us-state-co.json:26` and
  `question-bank/sample-data/us-state-co.json:26`. It is the literal value in
  `geoquizdataplan.md` §1.4's entity example and in `openapi.yaml:1478`'s
  `climateKid` example — criterion 14 pins it for that reason.
- **The committed bank rebuilds byte-for-byte offline** — 51 tracked paths under
  `question-bank/data/us-states/` (T-010, `engineering-decisions.md` **E-6**),
  checked on every `bun test` by `committed-bank.test.ts` ("T-010 criteria 6 and
  8", line 181). Tracked bytes total **53,018** against the 200 KB cap
  (`committed-bank.test.ts:170`), so fifty short phrases fit with room to spare.
- **The precedent is T-011 (`fun_facts`), T-012 (`state_animal`) and T-013
  (`landmark`)** in this exact file and in this exact shape: fill the table,
  regenerate the bank, never hand-edit built output.
  `question-bank/src/landmarks.test.ts` and `landmarks-verify.test.ts` are the
  worker's and tester's shape suites from T-013 and the model for this one.
- **The contract already carries the field.** `openapi.yaml:1477–1479`
  (`climateKid`) and `openapi.yaml:1305` (`topic: climate`) need no change.

**Not true yet — this task's actual work:**

- **`climate_kid` is 1 of 50.** Only Colorado sets it, and only its two files
  carry the key. Forty-nine phrases have to be written.
- The bank has to be regenerated once the table is filled.
- **`climate_koppen` is never emitted at all** — it is declared on `Entity`
  (`types.ts:49`) and appears in the plan's §1.4 example, but no tracked file has
  the key and no query produces it. So there are no codes on disk to translate
  from; the phrases come from the curator's own reading. Out of scope below.
- **The offline-rebuild harness is copy-pasted four times, and nobody has
  decided whether that is right.** Measured, not estimated: the dead-loopback
  proxy map appears in `committed-bank.test.ts:25`, `state-animals.test.ts:47`,
  `landmarks.test.ts:48` and `landmarks-verify.test.ts:49` (six occurrences of
  `127.0.0.1:1` in each); the "spawn `src/build.ts --offline --out <tempdir>`"
  invocation appears five times across those four files
  (`committed-bank.test.ts:191` **and** `:391`, `state-animals.test.ts:431`,
  `landmarks.test.ts:485`, `landmarks-verify.test.ts:399`); and `git()` +
  `trackedUnder()` + a tracked-state-file reader appear three times
  (`committed-bank.test.ts:34/44`, `state-animals.test.ts:148/154/163`,
  `landmarks.test.ts:151/157/166`). This task's own suites would make it six.
  Criterion 16 makes that a decision instead of a default — **and note what must
  not be collapsed**: `landmarks-verify.test.ts:198–202` documents that the
  tester reads the bank with `readdirSync` *on purpose*, a deliberately different
  route from the worker's `git ls-files`, so that a stray or missing file shows up
  as a mismatch. Sharing the *observation* route would delete a real check.

**Two traps, recorded so this task does not repeat them:** there is **no
`bun run lint` in `question-bank/`** — the only scripts are `build`,
`build:sample` and `typecheck` (`question-bank/package.json`); a criterion
demanding one would be unsatisfiable, and that gap is T-066. And a **live** build
(`bun run build`, no `--offline`) rewrites `sources.built_at` to wall clock,
which breaks criterion 12.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

Throughout, **"the 50 tracked files"** means the 50 `us-state-<postal>.json`
files tracked under `question-bank/data/us-states/`; **"a phrase"** means the
string at the `climate_kid` key of such a file; and **"the default branch"**
means `main` as of this task's branch point.

1. **All fifty are filled, and none is a placeholder.** Every one of the 50
   tracked files carries a `climate_kid` key whose value is a non-empty string.
   No file is missing the key, and no value is `""`, `null`, `"unknown"`,
   `"none"`, `"tbd"`, `"n/a"` or `"—"`. *Unlike `landmark` (T-013), no blank is
   permitted here: the queue entry's "done when" is every state, and every
   state's climate is knowable. If the worker believes a state genuinely cannot
   be phrased, that is a blocked criterion and goes back through
   `task-expander` — not a silent blank.* Colorado is already filled; the other
   49 are the work.

2. **Each phrase is short enough to read and long enough to say something.**
   Every phrase is between **15 and 90 characters** inclusive (14 fails, 15
   passes, 90 passes, 91 fails) and between **3 and 16 words** inclusive, words
   being whitespace-separated runs (2 fails, 3 passes, 16 passes, 17 fails).
   Colorado's is 55 characters and 11 words.

3. **Each phrase is clean text.** Every phrase equals its own `trim()`, contains
   no double space, and contains no newline or tab character.

4. **Each phrase is a fragment that slots into a sentence, not a sentence.**
   Every phrase begins with a lowercase letter `a`–`z`; does not end with `.`,
   `!` or `?`; and contains none of `;`, `:`, `(`, `)`, `/`, `"`, `*`, `|` or the
   substring `http`. Commas are allowed — Colorado's has one. (Both of T-026's
   phrasings have to read: "Which state is `<phrase>`?" and "`<State>` is
   `<phrase>`.")

5. **No numbers and no units.** No phrase contains a digit `0`–`9`, the character
   `°`, or any of `celsius`, `fahrenheit`, `degrees`, `inches`, `millimetres`,
   `millimeters` (case-insensitive). ("snow up to 300 inches" fails; "loads of
   snow" passes.)

6. **Nothing says Köppen.** No phrase contains `köppen` or `koppen`,
   case-insensitively, and neither does any `climate_kid` value in
   `question-bank/src/curated/us-states.ts`. *This is the queue entry's second
   "done when" and it is deliberately its own criterion.*

7. **No phrase carries a Köppen class code.** No phrase contains any of these 31
   codes as a whole word, matched **case-sensitively**: `Af`, `Am`, `Aw`, `As`,
   `BWh`, `BWk`, `BSh`, `BSk`, `Csa`, `Csb`, `Csc`, `Cwa`, `Cwb`, `Cwc`, `Cfa`,
   `Cfb`, `Cfc`, `Dsa`, `Dsb`, `Dsc`, `Dsd`, `Dwa`, `Dwb`, `Dwc`, `Dwd`, `Dfa`,
   `Dfb`, `Dfc`, `Dfd`, `ET`, `EF`. (Lowercase `as` in "as wet as" does not trip
   this; a stray `BSk` does.)

8. **No phrase uses a geographer's word for a climate.** No phrase contains, as a
   case-insensitive substring, any of: `arid`, `subtropical`, `subarctic`,
   `temperate`, `oceanic`, `continental`, `steppe`, `tundra`, `mediterranean`,
   `precipitation`, `humidity`, `latitude`, `elevation`, `climate zone`, `biome`,
   `annual`, `average`. ("humid subtropical summers" fails on `subtropical`;
   "semi-arid" fails on `arid`; "hot sticky summers" passes. `humid` on its own
   is allowed — a nine-year-old knows it; `humidity` is not.)

9. **Each phrase is actually about weather.** Every phrase contains at least one
   of these as a case-insensitive substring: `hot`, `cold`, `cool`, `warm`,
   `wet`, `dry`, `rain`, `snow`, `sun`, `wind`, `storm`, `humid`, `mild`, `freez`,
   `ice`, `icy`, `fog`, `breez`, `chill`, `damp`, `muggy`, `sticky`, `frost`.
   ("beautiful all year round" fails; Colorado's passes on `dry` and `cold`.)

10. **No phrase names a state.** No phrase contains, as a whole word matched
    case-insensitively, the `name` of any of the 50 states in
    `CURATED_US_STATES` — its own included. "Which state is `<phrase>`?" answers
    itself when the phrase names its own state, and points at the wrong one when
    it names another. *Note the edge this bites: "wet winters in the Sierra
    Nevada" fails on `Nevada` and has to be rephrased ("wet winters in the high
    Sierra"); "cold snowy winters by the Great Lakes" passes.*

11. **No two phrases are the same string, and none contains another.** Compared
    after `trim()` and lowercasing, the 50 phrases are all distinct, and no
    phrase is a substring of any other phrase. (Two states whose climates are
    genuinely alike still get two different strings; whether the *content* is
    interchangeable is criterion 17 and the Review checklist.)

12. **The bank is built, not hand-edited.** Running
    `bun run src/build.ts --offline --out <temp dir>` from `question-bank/` with
    no network available reproduces all 51 tracked paths byte-for-byte, twice in
    a row, and `sources.built_at` in every tracked file is still
    `2026-08-04T16:05:35.000Z`. (This is `committed-bank.test.ts`'s existing
    describe block "T-010 criteria 6 and 8" at line 181, which must still pass
    against the *new* tracked bytes.)

13. **The committed sample stays in step with the bank.**
    `question-bank/sample-data/us-state-co.json` equals the tracked
    `question-bank/data/us-states/us-state-co.json` in every field except
    `sources.built_at`, including `climate_kid`.
    (`committed-bank.test.ts` "T-010 criterion 4", line 154.)

14. **Colorado's phrase is unchanged.** `us-states.ts`, the tracked
    `us-state-co.json` and `sample-data/us-state-co.json` all still carry exactly
    `dry and cold in the mountains, drier plains to the east`. It is the string
    `geoquizdataplan.md` §1.4 and `openapi.yaml:1478` both print, and changing it
    here would make the plan and the contract wrong without saying so. *Already
    satisfied by `us-states.ts:127`; this criterion exists to stop it drifting.*

15. **Nothing but `climate_kid` moves in the bank.** For each of the 50 tracked
    files, the only difference from the same file on the default branch is the
    presence or value of a `climate_kid` key. Specifically and independently
    checkable against the tree as it stands:
    a. the set of states carrying `landmark` is still exactly the 44 that carry
       it on the default branch — DE, IA, KS, MS, OK and RI have no `landmark`
       key — and every one of those 44 values is unchanged;
    b. all 50 still carry `state_animal`, unchanged, and every state's
       `fun_facts` array still has exactly one entry with the same `text` and
       `reviewed: true`;
    c. `top_crops` is still `[]` in all 50 (T-015 owns that field);
    d. `question-bank/data/us-states/index.json` is byte-identical to the default
       branch's.

16. **The duplicated test harness is decided, not defaulted.** Exactly one of
    these is true when this task lands, and the `## Handoff` says which and why:

    **(a) Extracted.** A module under `question-bank/src/` that is not itself a
    `*.test.ts` file exports both the dead-loopback proxy environment and the
    "build offline into a temp directory" runner; the string `127.0.0.1:1`
    appears in exactly **one** file under `question-bank/src/`; no `*.test.ts`
    under `question-bank/src/` spawns `src/build.ts` itself; and every suite that
    checks the offline rebuild — `committed-bank`, `state-animals`, `landmarks`,
    `landmarks-verify`, plus any suite this task adds — obtains both from that
    module. Editing those four files for this is expected and is not a
    "loosened" test under criterion 19.

    **(b) Kept, with the reason on the record.** `engineering-decisions.md` gains
    a new `E-n` entry that names the duplicated pieces (the dead-loopback proxy
    map, the offline-rebuild runner, the tracked-state-file reader), states how
    many copies of each exist once this task lands, and gives the reason
    self-containment is worth them — so T-015 inherits a decision rather than
    this same paragraph.

    Under **either** branch, the tracked-state-file *reading route* may stay
    duplicated: `landmarks-verify.test.ts:198–202` uses `readdirSync` where
    `landmarks.test.ts:157` uses `git ls-files`, deliberately, and collapsing
    those two removes a check. Nothing in this criterion requires sharing it, and
    a tester suite added by this task may read the bank by its own route.

17. **Everything a person has to read is in one place.** The `## Handoff` lists
    **all 50 states**, each with the exact phrase shipped for it and what the
    phrase was checked against, in a form a person can read top to bottom
    without opening 50 files — and, separately, **groups the states whose
    phrases describe substantively the same climate** (Iowa and Nebraska, say).
    That grouping is what T-022 and T-026 need: "Which state is `<phrase>`?" has
    more than one true answer inside a group, however distinct the strings are
    under criterion 11. Every phrase in the Handoff's table matches the string in
    that state's tracked file exactly.

18. **Nothing unreviewed, live or new is committed.** The bytes
    `reviewed": false` appear in no file tracked under `question-bank/data/` or
    `question-bank/sample-data/`; no `*.review.json` path under
    `question-bank/data/us-states/` is tracked; no `package.json` or lockfile in
    the repo gains a dependency; and no test added or changed by this task
    performs a network request or mocks `fetch`.

19. **Nothing already verified is weakened.** No test is deleted from
    `question-bank/src/committed-bank.test.ts`, `data-us-states.test.ts`,
    `fun-facts.test.ts`, `state-animals.test.ts`, `landmarks.test.ts`,
    `landmarks-verify.test.ts`, `normalize.test.ts` or `sparql.test.ts`, and no
    assertion in any of them is loosened — replacing a local harness constant
    with an import of the same value under criterion 16(a) is not a loosening.
    `bun test` and `bun run typecheck` pass in `question-bank/`, and `frontend/`
    and `backend/` are untouched. (There is no `bun run lint` in
    `question-bank/` — do not add one here; that is T-066.)

## Out of scope

- **Serving these phrases to the app.** Nothing in `backend/`, `frontend/` or
  `openapi.yaml` changes — `openapi.yaml:1477` already declares `climateKid`. The
  bridge from the pipeline bank to the served bank is **T-040**; growing the
  served bank to 50 states is **T-050**.
- **The `climate` question template and its distractors** — that is **T-026**
  (and **T-022** for distractor strategy, which is itself blocked on **T-017**).
  This task produces one string per state and nothing else. Criterion 17's
  interchangeable-climate groups are *input* to T-026, not work done here.
- **`climate_koppen`.** It is declared on `Entity` (`types.ts:49`) and printed in
  `geoquizdataplan.md` §1.4's example, and the pipeline emits it for nobody. Do
  not add a query for it, do not add codes to the curated table, and do not
  delete the field. If that gap is worth closing it is a new `tasks.md` entry for
  the reviewer to add at sweep, not a commit here.
- **The other curated fields** — `state_animal` (done, T-012), `landmark` (done,
  T-013), `fun_facts` (done, T-011), `top_crops` (**T-015**). Do not fill or
  touch them while you are in the file; criterion 15 enforces that, and T-015
  edits the same rows next.
- **A second phrase, a per-season breakdown, or a phrase list.** The field is one
  string. Changing its shape is a schema and contract decision, not this task.
- **Adding a source or citation field to `CuratedState`.** Provenance for this
  task lives in the `## Handoff` (criterion 17), which is what the human review
  reads.
- **Running the live pipeline.** A live run is optional raw material and never a
  deliverable: it rewrites `sources.built_at` and would break criterion 12, and
  it drafts a `fun-facts.review.json` that must stay uncommitted.
- **T-063** (scheduled refresh), **T-064** (deleting `sample-data/`), **T-065**
  (stale suite counts), **T-066** (no `lint` in `question-bank`), **T-016**
  (Alaska's highest point), **T-017** (region vocabulary), **T-061** (duplicated
  *frontend* CI-workflow parsers — criterion 16 is about `question-bank/` only).
- **`process.md`, `CLAUDE.md`, `.claude/`, the workflows.** Those are `P`
  tickets and the loop may not touch them (`run-loop.sh` G1). Criterion 16(b)'s
  `engineering-decisions.md` entry is explicitly allowed — that file is not
  gated.

## Constraints

- **Files expected to change:** `question-bank/src/curated/us-states.ts` (49 new
  `climate_kid` entries), the 50 tracked entity files under
  `question-bank/data/us-states/`, a new or extended test file under
  `question-bank/src/`, and this brief. Under criterion 16(a) also a new
  non-test module under `question-bank/src/` and the harness lines of the four
  suites named there; under 16(b) also `engineering-decisions.md`.
  `sample-data/us-state-co.json` should **not** move — Colorado's phrase is
  already shipped and criterion 14 pins it. Nothing else is expected;
  `normalize.ts:137` already folds the field in.
- **Never hand-edit a file under `question-bank/data/us-states/` or
  `question-bank/sample-data/`.** Regenerate them:
  `cd question-bank && bun run src/build.ts --offline --out data/us-states`, and
  `bun run build:sample` only if Colorado's bytes genuinely move. **E-6** exists
  because hand-edited built output is destroyed by the next rebuild.
- **`sources.built_at` must stay `2026-08-04T16:05:35.000Z`** — the fixture's
  capture instant, which only the offline path preserves and which is what makes
  the rebuild byte-identical.
- **How to choose the words.** Colorado's entry is the model and it is doing two
  things at once: plain words a nine-year-old uses (*dry*, *cold*, *drier*), and
  an **inside-the-state contrast** (mountains versus plains to the east) that
  makes it that state's phrase rather than a generic one. Prefer the same:
  describe the climate as a child would feel it across the year, and where a
  state is genuinely two climates, say both. Where extreme weather is part of the
  honest answer (hurricanes, tornadoes, blizzards), name it as a fact about the
  place, calmly — not as a warning, a death toll or a superlative.
- **Prefer honest and plain to clever.** No jokes, no second person ("you'll
  need a coat"), no comparisons to other states, no marketing ("perfect beach
  weather"). Criteria 8–10 catch some of that; the rest is the Review checklist's.
- **The 200 KB cap** on everything tracked under `question-bank/data/` still
  holds (`committed-bank.test.ts:170`). It is **53,018 bytes** today and 50
  phrases add roughly 4 KB, so there is room — but it is a real ceiling.
- **No dependency without asking** (`CLAUDE.md` "Packages"). `bun` only.
- **No network in tests, and never mock `fetch`** (`test-guidelines.md`). The
  existing rebuild tests point all six proxy spellings at `http://127.0.0.1:1`;
  follow that pattern (`landmarks.test.ts:48`), from wherever criterion 16 leaves
  it living.
- **Reviewer, note:** this PR is outside the envelope by construction — it is
  text a child will read (`process.md` step 6, `process-decisions.md` **D-4a**).
  Flag it; do not mark it ready with no note. The Review checklist below has to
  be closed by a named person on the PR.

## Context

**Required reading for the worker and the tester**, not background.

- **What the field looks like when filled:** `geoquizdataplan.md` **§1.4**'s
  entity record example (`"climate_kid": "dry and cold in the mountains, drier
  plains to the east"`, line 52). That string is the tone and shape model, and
  criterion 14 pins it.
- **Why it is hand-curated at all:** `geoquizdataplan.md` **§1.9**, the
  source → field table — "Köppen climate | Wikidata, or Beck et al. climate
  raster | **Map codes → kid-friendly phrasing yourself**". Also the header
  comment of `question-bank/src/curated/us-states.ts` (lines 12–17), which names
  kid-facing climate phrasing as one of the two things the table exists for.
- **What the field is for:** `tasks.md` **T-026**, the topic table — `climate` →
  "Which state is `<climate phrase>`?" → needs T-014. Read the paragraphs under
  it on how `state_animal`'s duplicates and `landmark`'s reader-collisions made
  the reverse direction unsafe; criteria 10, 11 and 17 exist so this field does
  not repeat that. `geoquizdataplan.md` line 90 has the other direction ("What
  kind of climate does X have?").
- **The contract:** `openapi.yaml:1477–1479` (`climateKid`, whose `example` is
  Colorado's string) and `openapi.yaml:1305` (`topic: climate`). Neither changes.
- **Why built output is not the home for curated text:**
  `engineering-decisions.md` **E-6**.
- **Content rules:** `CLAUDE.md` "Content rules", `process.md` "Tasks this loop
  does not fit" (content and curation are verified by human reading *plus* shape
  tests), `process-decisions.md` **D-4a**.
- **The code:**
  - `question-bank/src/curated/us-states.ts` — `CuratedState` at lines 23–43
    (`climate_kid` at 31), the 50 rows from line 45. Colorado (line 117) is the
    only row with `climate_kid` filled and is the model row.
  - `question-bank/src/normalize.ts:123–152` — entity assembly; line 137 is the
    `climate_kid` fold-in, already written and conditional.
  - `question-bank/src/types.ts:33–59` — `Entity`; `climate_kid` at 50,
    `climate_koppen` at 49 (declared, never emitted).
  - `question-bank/package.json` — the only scripts are `build`, `build:sample`
    and `typecheck`.
- **The precedent to copy, including its test shape:**
  `question-bank/src/landmarks.test.ts` (T-013 worker) and
  `landmarks-verify.test.ts` (T-013 tester); `state-animals.test.ts` (T-012).
  Their file headers explain which criteria are tree-shaped tests and which are
  `git diff` observations recorded in the Verdict, and why (CI checks out at
  `fetch-depth: 1`, so `origin/main` is not there). Criterion 15 has the same
  property: 15a–15d are checkable against the tree as it stands, "unchanged from
  the default branch's bytes" is a property of this branch's diff.
- **The tests that already constrain this** (`committed-bank.test.ts`):
  completeness (line 117), sample ↔ bank equality (line 154), the 200 KB cap
  (line 170), offline rebuild byte-identity (line 181), no `reviewed: false`
  (line 237).
- **The harness duplication criterion 16 is about:** the four copies at
  `committed-bank.test.ts:25/34/44/191/391`, `state-animals.test.ts:47/148/154/163/431`,
  `landmarks.test.ts:48/151/157/166/485`, `landmarks-verify.test.ts:49/203/399`,
  and the comment at `landmarks-verify.test.ts:198–202` explaining the one
  duplication that is deliberate. `test-guidelines.md` "No network in tests,
  ever" is the rule they all implement.
- **Where the project thinks this stands:** `PROGRESS.md` "Content — the big
  one" — "`climate_kid` is still **1 of 50**".

## Review checklist — non-testable tasks only

A test can confirm all 50 phrases are well-formed, distinct, jargon-free strings.
Only a person can confirm they are *true* and *readable*. **Record in the PR who
checked each box and when**; the reviewer flags this PR for that reason (D-4a).

- [ ] Every phrase is true of that state's climate across a normal year — not of
      one famous storm, one season, or one corner of the state presented as the
      whole.
- [ ] A nine-year-old could read every phrase aloud and know what every word
      means. No word needs a grown-up to explain it.
- [ ] Each phrase reads correctly in both of T-026's sentences: "Which state is
      `<phrase>`?" and "`<State>` is `<phrase>`." Grammar, not just vocabulary.
- [ ] Where extreme weather is named, it is calm and age-appropriate — a fact
      about the place, not a threat, a casualty count or a superlative.
- [ ] Read as a set of 50: varied phrasing, not one template with the adjectives
      swapped, and no phrase gives away its own answer in a way criterion 10 did
      not catch (a state's nickname, its capital, a one-of-a-kind landmark).
- [ ] The Handoff's groups of substantively-interchangeable climates (criterion
      17) are right — both that the states grouped together really are alike, and
      that no pair which is alike was left out. This is what stops T-026 shipping
      a question with two true answers.
- [ ] Where a phrase draws an inside-the-state contrast (Colorado's model), the
      contrast is the real one a resident would draw.
- [ ] Nothing reads as a value judgement about a place or the people in it.

## Handoff

**TL;DR:** all 49 missing `climate_kid` phrases are written and shipped (Colorado's
was already correct and is untouched); the bank is rebuilt offline and every
existing suite plus a new 59-test `climate-kid.test.ts` passes (603 tests total,
0 failures) along with `bun run typecheck`. Criterion 16 is resolved as **(a)
extracted** — a new `question-bank/src/offline-rebuild.ts` module. The one thing
this Handoff does **not** certify is whether each phrase is *true* and
*readable* — that is the Review checklist below, closed by a named human, not by
me.

### Files changed

- **`question-bank/src/curated/us-states.ts`** — added a `climate_kid:` line to
  the 49 rows that lacked one (every state but Colorado, line 127, which
  criterion 14 pins and which I did not touch). No other field on any row
  changed.
- **`question-bank/data/us-states/*.json`** (49 of the 50 files — every state
  but Colorado's) — regenerated by `cd question-bank && bun run src/build.ts
  --offline --out data/us-states`, never hand-edited. Each gained exactly one
  key, `climate_kid`, in the position `normalize.ts:137` already emits it
  (between `borders` and `state_animal`). `index.json` and
  `sample-data/us-state-co.json` are untouched (confirmed with `git diff
  --stat`, both empty).
- **`question-bank/src/offline-rebuild.ts`** (new) — criterion 16(a)'s
  extraction. Exports `DEAD_PROXY` (the dead-loopback proxy env map) and
  `rebuildOffline(buildScript, fileNames, tmpPrefix?)` (spawn `src/build.ts
  --offline --out <tempdir>`, read the named files back, always clean up).
  Not a `*.test.ts` file itself.
- **`question-bank/src/committed-bank.test.ts`**, **`state-animals.test.ts`**,
  **`landmarks.test.ts`**, **`landmarks-verify.test.ts`** — each lost its own
  copy of the dead-loopback proxy map and its own `rebuild()`/inline-spawn
  function, replacing both with an import from `offline-rebuild.ts`. Beyond
  the harness swap, three of these files also needed a second edit because
  this task's own content changed the ground truth they were built to check
  (all pre-existing assertions kept their exact-equality strength — none was
  loosened to a count or a `toContain`):
  - **`state-animals.test.ts`** and **`landmarks.test.ts`**: each had a test
    asserting "the set of states carrying `climate_kid` is exactly
    `{Colorado}`" (written at T-012 and T-013 as a regression fence against
    this field). Both now assert it is exactly all 50, transcribed as an
    explicit list in `state-animals.test.ts` (matching that file's own
    `T013_LANDMARK_STATES` precedent) and derived from `CURATED_US_STATES` in
    `landmarks.test.ts`.
  - **`landmarks-verify.test.ts`**: its criterion-9 digest check pinned a
    SHA-256 of each tracked file **with `landmark` removed**, computed from
    the tree just before T-013 landed, to prove nothing else moved. Since
    Colorado already carried `climate_kid` at that pinned baseline and the
    other 49 states did not, the check now also strips `climate_kid` before
    hashing — except for Colorado's own file, whose pinned digest already
    included it. Its "climate_kid is exactly `{Colorado}`" test was updated
    the same way as the two above.
  - All three files' own `PINNED`/`FLOORS` tables for `committed-bank.test.ts`
    were lowered from `expects: 60` to `expects: 58` — moving two inline
    `expect(proc.exitCode).toBe(0)` calls into `rebuildOffline` (which throws
    on a non-zero exit instead) removed two `expect(` occurrences from that
    file's own text without removing what they verified. Criterion 16(a) names
    this kind of edit explicitly exempt from "loosened."
- **`question-bank/src/climate-kid.test.ts`** (new) — this task's own shape
  suite, 19 `describe` blocks (one per criterion, 15 split into lettered
  sub-tests), 59 `test`s / 108 `expect`s, modelled on `landmarks.test.ts`. Runs
  the offline rebuild via `rebuildOffline`; contains no literal `127.0.0.1:1`
  (built from string parts in the one test that has to check for it, so it
  cannot become a second match for what it's counting).
- **This brief** — Sessions row, Status/Next step, this Handoff.

**Not touched:** `normalize.ts` (the fold-in at line 137 already existed and
needed no change), `openapi.yaml`, `geoquizdataplan.md`, `engineering-decisions.md`
(criterion 16(a) was taken, so no new `E-n` entry — see below), `frontend/`,
`backend/`, `landmark`/`state_animal`/`top_crops`/`fun_facts` on any row
(criterion 15's regression fence — verified in `climate-kid.test.ts`'s own
criterion-15 block, a/b/c/d).

### Criterion 16 — extracted, not kept

**Took (a).** `offline-rebuild.ts` now holds the one `127.0.0.1:1` in
`question-bank/src/` (`climate-kid.test.ts` checks this by building the
literal from string parts, not by writing it, so the check doesn't trip on its
own source) and the one "spawn `build.ts --offline`, read files back, clean
up" implementation; all five suites that check an offline rebuild — the four
named in the criterion plus this task's own `climate-kid.test.ts` — import
both `DEAD_PROXY`'s replacement and `rebuildOffline` from it, and none of them
spawns `src/build.ts` directly any more.

**Why (a) over (b):** the duplication was about to become worse under this
task even if left alone (a fifth copy in `climate-kid.test.ts`), and the two
extracted pieces are genuinely identical across all four existing copies —
same six proxy keys, same value, same spawn/read/cleanup shape — so there was
no real per-suite variation being lost by sharing them. That is different in
kind from the tracked-state-file *reading* route (`git ls-files` vs.
`readdirSync`), which the criterion itself says must stay duplicated because
the two routes catch different failures; nothing about that duplication was
touched. Extracting cost one new file and four small edits; keeping and
writing an `E-n` entry would have cost a paragraph now and a sixth
(`climate-kid-verify.test.ts`, the tester's own suite) or seventh copy later
with no corresponding benefit, so (b)'s bar — "self-containment is worth it" —
wasn't met here the way it might be for something with real per-suite
variation.

### The 50-row table

Every phrase below is the exact string committed in
`question-bank/src/curated/us-states.ts` and rebuilt verbatim into
`question-bank/data/us-states/us-state-<postal>.json`. "Checked against"
lists character count / word count and which of criterion 9's weather words
it matched (a phrase can match more than one; only one is required). Every
phrase also passed, individually and pairwise: no digit, `°`, or unit word
(criterion 5); no `koppen`/`köppen` and no whole-word Köppen code (criteria
6–7); none of the 17 geographer's words (criterion 8); no whole-word state
name, its own included (criterion 10); distinct from, and not a substring of,
every other phrase (criterion 11) — all mechanically re-verified by
`climate-kid.test.ts`, not asserted here by hand.

| Postal | State | Phrase | chars / words | weather word(s) matched |
|---|---|---|---|---|
| AL | Alabama | hot sticky summers and mild winters, with strong thunderstorms much of the year | 79 / 13 | hot, storm, mild, sticky |
| AK | Alaska | long cold snowy winters inland, milder and rainy along the southern coast | 73 / 12 | cold, rain, snow, mild |
| AZ | Arizona | scorching dry summers in the desert, cooler snowy winters up north | 66 / 11 | cool, dry, snow |
| AR | Arkansas | hot humid summers with strong storms, and mild winters that turn icy at times | 77 / 14 | hot, storm, humid, mild, icy |
| CA | California | sunny dry summers near the coast, hot deserts and snowy mountains further inland | 80 / 13 | hot, dry, snow, sun |
| CO | Colorado | dry and cold in the mountains, drier plains to the east | 55 / 11 | cold, dry |
| CT | Connecticut | cold snowy winters and warm sticky summers, with all four seasons clearly felt | 78 / 13 | cold, warm, snow, sticky |
| DE | Delaware | mild humid summers and cool damp winters, close to the ocean's moderating winds | 79 / 13 | cool, wind, humid, mild, damp |
| FL | Florida | hot muggy summers nearly all year, with sudden storms and mild winters | 70 / 12 | hot, storm, mild, muggy |
| GA | Georgia | hot muggy summers and mild winters, with thunderstorms common in the warm months | 80 / 13 | hot, warm, storm, mild, muggy |
| HI | Hawaii | warm breezy weather all year, with wetter mountains and drier coasts nearby | 75 / 12 | warm, wet, breez |
| ID | Idaho | warm dry summers and cold snowy winters, especially high in the mountains | 73 / 12 | cold, warm, dry, snow |
| IL | Illinois | hot humid summers, cold snowy winters, and strong storms every spring | 69 / 11 | hot, cold, snow, storm, humid |
| IN | Indiana | warm sticky summers, icy cold winters, and plenty of storms each spring | 71 / 12 | cold, warm, storm, icy, sticky |
| IA | Iowa | hot humid summers and freezing cold winters, with strong winds across the open fields | 85 / 14 | hot, cold, wind, humid, freez |
| KS | Kansas | hot dry summers and cold windy winters, with sudden storms sweeping the plains | 78 / 13 | hot, cold, dry, wind, storm |
| KY | Kentucky | warm humid summers and cool winters, with occasional snow and ice storms | 72 / 12 | cool, warm, snow, storm, humid, ice |
| LA | Louisiana | hot muggy summers most of the year, mild winters, and occasional powerful storms | 80 / 13 | hot, storm, mild, muggy |
| ME | Maine | cold snowy winters and cool breezy summers, especially up near the coast | 72 / 12 | cold, cool, snow, breez |
| MD | Maryland | hot humid summers and cold winters, milder and breezier close to the water | 74 / 13 | hot, cold, humid, mild, breez |
| MA | Massachusetts | cold snowy winters with strong coastal storms, and warm humid summers | 69 / 11 | cold, warm, snow, storm, humid |
| MI | Michigan | long cold winters with heavy lake snow, and mild humid summers | 62 / 11 | cold, snow, humid, mild |
| MN | Minnesota | bitterly cold snowy winters and warm humid summers, with big swings between them | 80 / 13 | cold, warm, snow, humid |
| MS | Mississippi | hot muggy summers nearly all year, with mild winters and frequent thunderstorms | 79 / 12 | hot, storm, mild, muggy |
| MO | Missouri | hot humid summers and cold winters, with sudden storms and occasional ice | 73 / 12 | hot, cold, storm, humid, ice |
| MT | Montana | cold snowy winters in the mountains, hot dry summers out on the plains | 70 / 13 | hot, cold, dry, snow |
| NE | Nebraska | hot windy summers and freezing cold winters, with sudden storms across the open plains | 86 / 14 | hot, cold, wind, storm, freez |
| NV | Nevada | hot dry summers, cold winters, and very little rain any time of year | 68 / 13 | hot, cold, dry, rain |
| NH | New Hampshire | cold snowy winters, especially high in the mountains, and warm summers below | 76 / 12 | cold, warm, snow |
| NJ | New Jersey | hot humid summers and cold snowy winters, with occasional storms along the shore | 80 / 13 | hot, cold, snow, storm, humid |
| NM | New Mexico | hot dry summers in the lowlands, cold snowy winters up in the mountains | 71 / 13 | hot, cold, dry, snow |
| NY | New York | cold snowy winters, heaviest near the lakes and mountains, and warm humid summers | 81 / 13 | cold, warm, snow, humid |
| NC | North Carolina | hot humid summers, and winters that turn cold and snowy up in the mountains | 75 / 14 | hot, cold, snow, humid |
| ND | North Dakota | bitterly cold winters and hot summers, with strong winds across the open plains | 79 / 13 | hot, cold, wind |
| OH | Ohio | cold snowy winters near the lake, and warm humid summers the rest of the year | 77 / 15 | cold, warm, snow, humid |
| OK | Oklahoma | hot windy summers and mild winters, with sudden severe storms in spring | 71 / 12 | hot, wind, storm, mild |
| OR | Oregon | wet mild winters and dry sunny summers near the coast, drier further east | 73 / 13 | wet, dry, sun, mild |
| PA | Pennsylvania | cold snowy winters and warm humid summers, changing a lot from place to place | 77 / 14 | cold, warm, snow, humid |
| RI | Rhode Island | cold snowy winters and warm humid summers, with strong storms off the coast | 75 / 13 | cold, warm, snow, storm, humid |
| SC | South Carolina | hot muggy summers, mild winters, and the chance of a strong coastal storm | 73 / 13 | hot, storm, mild, muggy |
| SD | South Dakota | cold windy winters and hot summers, with sudden storms sweeping the plains | 74 / 12 | hot, cold, wind, storm |
| TN | Tennessee | hot humid summers and mild winters, with occasional snow in the higher hills | 76 / 13 | hot, snow, humid, mild |
| TX | Texas | scorching hot summers, humid and stormy in the east, drier and milder out west | 78 / 14 | hot, storm, humid, mild |
| UT | Utah | dry hot summers in the lowlands, and cold snowy winters up in the mountains | 75 / 14 | hot, cold, dry, snow |
| VT | Vermont | cold snowy winters, heavy in the mountains, and mild cool summers below | 71 / 12 | cold, cool, snow, mild |
| VA | Virginia | hot humid summers near the coast, colder and snowier out in the mountains | 73 / 13 | hot, cold, snow, humid |
| WA | Washington | wet mild winters and dry summers near the coast, drier and hotter to the east | 77 / 15 | hot, wet, dry, mild |
| WV | West Virginia | warm humid summers and cold snowy winters, especially high in the hills | 71 / 12 | cold, warm, snow, humid |
| WI | Wisconsin | bitterly cold snowy winters and warm humid summers, right in the middle of the country | 86 / 15 | cold, warm, snow, humid |
| WY | Wyoming | cold snowy winters high in the mountains, and hot dry summers down in the valleys below | 87 / 16 | hot, cold, dry, snow |

### Interchangeable-climate groups (criterion 17)

These are states whose phrases are worded differently (criterion 11 is
satisfied — no two are identical or substrings of each other) but describe
**substantively the same climate**. T-026 needs this: "Which state is
`<phrase>`?" would have more than one honest answer inside a group, whatever
the exact wording is. Every state below is filled (no group member is a
blank), and no state appears in two groups.

| Group | States | Why they're alike |
|---|---|---|
| Great Plains | IA, NE, KS, SD, ND | Hot summers, bitterly cold and windy winters, sudden storms sweeping open, largely treeless land. |
| Northern Rockies | MT, WY, ID | Cold snowy mountain winters, hot dry summers in the valleys and plains below — the same inside-the-state contrast Colorado's own phrase draws. |
| Interior Southwest | AZ, NM, UT, NV | Hot dry summers, cold winters, snow concentrated in whatever mountains the state has; NV's phrasing leads with "very little rain" rather than a mountain contrast but describes the same desert climate. |
| Pacific Northwest | OR, WA | Wet mild winters and dry summers near the coast, both drier and more extreme east of the mountains. |
| Southern New England | CT, MA, RI | Cold snowy winters, warm humid summers, coastal storm exposure. |
| Northern New England | NH, VT, ME | Colder, snowier winters than their southern neighbors, especially in the mountains; cooler summers. |
| Mid-Atlantic | NJ, PA, MD, DE | Hot/warm humid summers, cold(-ish) winters, tempered by nearby water; DE and MD read slightly milder than NJ and PA, which is honest (they're smaller, flatter, and closer to open water) rather than a wording accident. |
| Great Lakes / Upper Midwest | OH, IN, IL, MI, WI, MN | Cold snowy winters (heavier near the lakes), warm-to-hot humid summers, spring severe-storm risk. |
| Deep South | AL, GA, MS, SC, LA | Hot muggy summers nearly all year, mild winters, thunderstorm and coastal-storm risk. |
| Upland South / Appalachian | TN, AR, KY, NC, VA, WV | Hot or warm humid summers; winters that are mild at low elevation and turn cold, snowy or icy in the higher hills. |

**Deliberately not grouped**, and why:

- **Missouri** sits at the boundary of three of the groups above (Great
  Plains' wind, the Great Lakes group's cold winters, the Upland South's ice
  storms) and its own phrase ("hot humid summers and cold winters, with
  sudden storms and occasional ice") doesn't cleanly match any one of them
  better than the others — grouping it with one would misrepresent the other
  two candidates as excluded.
- **New York** is itself a climate hybrid (NYC-area mid-Atlantic-adjacent,
  western NY lake-effect snow, Adirondack mountain cold) and its phrase
  reflects that internal spread rather than one region's climate; forcing it
  into either the Mid-Atlantic or Great Lakes group would overstate how
  representative it is of either.
- **Alabama vs. the Upland South group**: Alabama is Deep South by every
  measure (no mountain contrast, muggy nearly year-round) and stays there
  rather than drifting toward Tennessee/Kentucky's cooler-highlands story.
- **California, Alaska, Hawaii, Florida, Texas, Oklahoma, Colorado** are each
  distinct enough (California and Texas each span more than one climate
  *within* their own borders and say so in their own phrase; Alaska, Hawaii
  and Florida have no real US peer; Oklahoma's severe-storm/wind emphasis
  doesn't match the Great Plains group's phrasing closely enough to merit
  inclusion) to stand alone.

Reviewer: please read this table and the groups above as part of the Review
checklist's sixth box — I wrote the groups from my own reading of each
state's actual climate, not from the wording similarity alone, but a second
reader is exactly the check this box exists for.

### What I deliberately did not do

- **Judge whether a phrase is true or readable.** That's the Review checklist,
  closed by a named person, not a shape test and not me self-certifying my own
  content.
- **Touch `climate_koppen`.** Still declared, never emitted, out of scope per
  the brief.
- **Add a source/citation field**, a second phrase, or a per-season breakdown.
  Out of scope; the field stays one string per state.
- **Run a live (non-`--offline`) build.** Never did; `sources.built_at` is
  still `2026-08-04T16:05:35.000Z` in all 50 tracked files (checked in
  `climate-kid.test.ts`'s criterion-12 block) and no `fun-facts.review.json`
  was ever written.
- **Write an `engineering-decisions.md` entry.** Only required under
  criterion 16(b), which I did not take.

### Contradiction noted, not acted on

The Sessions table's `task-expander` row and my own `worker` row above both
record the same session id (`cse_01EA17nGfGQfj9H6WstCQo5j`) — this environment
appears to have continued the expander's session into the worker step rather
than starting a fresh one. I'm recording it rather than editing either row: the
brief's own instructions say to add the row with whatever
`$CLAUDE_CODE_REMOTE_SESSION_ID` actually is, and the tester (who must run in a
session different from mine) can see the same thing and judge whether it
matters.

### How to run what I touched

```
cd question-bank
bun install                     # first run only
bun test                        # 603 pass, 0 fail
bun run typecheck               # tsc --noEmit, clean
bun run src/build.ts --offline --out data/us-states   # reproduces the tracked bank byte-for-byte
```

No `bun run lint` exists in `question-bank/` (T-066) and none was added.

## Verdict

**PASS on shape — all 19 criteria hold.** 50 phrases, 0 shape violations against
predicates re-derived from the criterion text; 687 tests pass in
`question-bank/` (603 pre-existing + 84 new tester tests), `bun run typecheck`
clean. 10 deliberate mutations were made and reverted; each turned the right
tests red. **The Review checklist is untouched and still owed by a named human**
— nothing below certifies that a phrase is *true* of its state or readable by a
nine-year-old, and the reviewer must flag this PR for that (D-4a).

**What was added:** `question-bank/src/climate-kid-verify.test.ts` — the
tester's own suite, 84 tests, written from the criteria and from the Handoff
table (transcribed from the brief, not read off the bank), independent of the
worker's `climate-kid.test.ts`.

### On independence — read this before trusting the `pass`

This was a **relayed run**: one top-level session spawned `task-expander`,
`worker` and `tester` as separate agents, so the Sessions table shows my id
matching the worker's. **The session-id check therefore did not pass and I am
not claiming it did.** My independence rests on being a freshly spawned agent
with its own context window: I have no visibility into the worker's transcript
or reasoning, and I read only committed files. That is real, but it is **weaker
evidence than a distinct session id**, because it rests on the harness having
spawned me correctly rather than on anything I can verify myself. The id match
is a mechanism artifact, not a sign that one conversation wrote the code and
then graded it. This is the known limitation `.claude/agents/tester.md` and
`.claude/agents/README.md` describe.

### Handoff claims checked against the branch

Every file the `## Handoff` names is on `claude/ecstatic-mendel-x3m3tk` at
`bc544e3` with the claimed change: `src/curated/us-states.ts` (**+49 lines, −0**,
every added line a `climate_kid:`), the **49** regenerated
`data/us-states/us-state-*.json` (**+49, −0**, every added line `climate_kid`;
Colorado's file not in the diff), new `src/offline-rebuild.ts`, the four updated
suites, new `src/climate-kid.test.ts`. `index.json`, `sample-data/`,
`normalize.ts`, `openapi.yaml`, `geoquizdataplan.md`,
`engineering-decisions.md`, `frontend/`, `backend/` and `e2e/` are absent from
the diff entirely.

### Criterion by criterion

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | All 50 files carry a non-empty `climate_kid` string; none is `""`, `null`, `unknown`, `none`, `tbd`, `n/a` or `—`. The filled set equals `CURATED_US_STATES`' 50 postals. |
| 2 | pass | All 50 are 15–90 chars (min 55 CO, max 87 WY) and 3–16 words (min 11, max 16 WY). Both bounds tested at their named edges (14/15, 90/91, 2/3, 16/17). Colorado is 55 chars / 11 words as the criterion states. |
| 3 | pass | Every phrase equals its own `trim()`, no double space, no `\n` or `\t`. |
| 4 | pass | All begin lowercase `a`–`z`; none ends `.`/`!`/`?`; none contains `; : ( ) / " * \|` or `http`. Commas present in all 50 and allowed. Both T-026 frames render without a doubled stop. |
| 5 | pass | No digit, no `°`, none of `celsius`/`fahrenheit`/`degrees`/`inches`/`millimetres`/`millimeters`. The criterion's own examples land on the right sides. |
| 6 | pass | No `koppen`/`köppen` in any phrase; the 50 `climate_kid:` lines in `us-states.ts` carry none either (line count asserted as 50, so the scan cannot be vacuous). |
| 7 | pass | All 31 codes absent as whole words, case-sensitively. Verified the matcher's own edge: lowercase `as` does not trip `As`; an injected `BSk` does. |
| 8 | pass | None of the 17 geographer's words appears as a substring; `humid` (allowed) appears in 21 phrases while `humidity` appears in none — the exact distinction the criterion draws. |
| 9 | pass | Every phrase matches ≥1 of the 23 weather words; `beautiful all year round` correctly fails the same predicate. |
| 10 | pass | No phrase contains any of the 50 state names as a whole word, its own included. The `Sierra Nevada` edge and the `Great Lakes` counter-example both behave as the criterion says. |
| 11 | pass | 50 distinct keys after `trim()`+lowercase; no phrase is a substring of any other in either direction (checked both directions, 2450 ordered pairs). |
| 12 | pass | `rebuildOffline` runs the real CLI `--offline` twice: 51/51 paths byte-identical to the tracked bank and to each other. `sources.built_at` is `2026-08-04T16:05:35.000Z` in all 50. Tracked `data/` is 57,741 bytes, inside the 200 KB cap. |
| 13 | pass | `sample-data/us-state-co.json` equals tracked `us-state-co.json` in **every** field after deleting `sources.built_at` (whole-object comparison, not just `climate_kid`), and both carry the pinned phrase. The file is absent from the branch diff. |
| 14 | pass | `us-states.ts`, tracked `us-state-co.json` and the sample all carry exactly `dry and cold in the mountains, drier plains to the east`; that string still appears verbatim in `geoquizdataplan.md` and `openapi.yaml`. |
| 15 | pass | **Checked against the branch point directly**, not only tree-shaped: for each of the 51 paths, the file with `climate_kid` removed is byte-equal to `git show 13a735f:<path>` with the same key removed, and `index.json` is byte-identical. Pinned as `BASELINE_DIGESTS` so it also runs on a shallow clone. Separately: 15a 44 `landmark`s, blanks exactly DE/IA/KS/MS/OK/RI, every value equal to its curated row; 15b all 50 `state_animal` unchanged, one `fun_facts` entry each with `reviewed: true` and the curated text; 15c `top_crops` `[]` in all 50; 15d `index.json` digest pinned and free of `climate_kid`. Numstat corroborates: `data/` is +49 −0. |
| 16 | pass (a) | `127.0.0.1:1` appears in exactly one file under `question-bank/src/` — `offline-rebuild.ts`, not a `*.test.ts`; my scan excludes only my own file, so the worker's suite is inside the scanned set. No `*.test.ts` spawns `src/build.ts` (the only `Bun.spawnSync` in any test file is `git`). All five suites import `rebuildOffline` and define no proxy of their own. **The carve-out was honoured:** `landmarks-verify.test.ts`'s `stateFiles()` still reads with `readdirSync` and `landmarks.test.ts`'s `trackedStateFiles()` still goes through `git ls-files` — asserted on those two function bodies, not on the files as a whole. 16(b) was not also taken. *One literal-vs-substance note for the reviewer below.* |
| 17 | pass | The Handoff table names all 50 states once; every phrase it claims is the string shipped, and nothing ships undeclared — checked against a transcription taken from the brief, so a mis-stated row would have failed. Its per-row char/word counts are all true of the shipped phrase. The 10 groups plus the 9 "deliberately not grouped" states account for all 50 exactly once, every grouped state is filled, and each group's members ship distinct strings. *Whether the groupings are right is the Review checklist's sixth box.* |
| 18 | pass | No `reviewed": false` in any of the 54 files under `data/`+`sample-data/`; no `*.review.json` under `data/us-states/`; `question-bank/package.json` still has no `dependencies` and the same two devDependencies; no `package.json` or lockfile anywhere in the repo is in the diff; no test under `question-bank/src/` calls `fetch(`, assigns `fetch`, or calls `mock(`. |
| 19 | pass | No test deleted: floors for all eight protected suites hold. `bun test` 687 pass / 0 fail, `bun run typecheck` clean. `frontend/`, `backend/`, `e2e/` untouched. The three rewritten `climate_kid`-coverage assertions still use exact-set `toEqual`, not a count or `toContain`. |

### Mutations made, and reverted

All ten were reverted; `git status` afterwards showed only my new untracked test
file. Where a mutation touched the curated table, the bank was rebuilt offline
and rebuilt again after reverting.

| # | Mutation | Result |
|---|---|---|
| 1 | Deleted Wyoming's `climate_kid` from `us-states.ts`, rebuilt | red in both suites — criterion 1 directly, and the no-blank invariant throws rather than silently filtering |
| 2 | Vermont → `snow up to 300 inches, with a subarctic chill` | red on 5 (digit + `inches`), 8 (`subarctic`), 17 in both suites |
| 3 | Ohio → `wet winters in the Sierra Nevada, and warm summers.` | red on 4 (terminal stop), 10 (`Nevada`), 17 in both suites |
| 4 | Kansas → a strict substring of Nebraska's phrase | red on 11's containment check only — distinctness alone stayed green, which is the point of the second half of that criterion |
| 5 | Colorado → `dry and cold up high, drier plains to the east` | red on 13, 14, 17, and on criterion 2's 55-char pin |
| 6 | Hand-edited `state_animal` in built `us-state-oh.json` | red on 12 (rebuild byte-identity), 15's baseline digest and 15b |
| 7 | Gave `landmarks.test.ts` its own `HTTP_PROXY: "http://127.0.0.1:1"` | red on 16's one-file count and the no-own-proxy check, both suites |
| 8 | Deleted a test from `normalize.test.ts` | red on 19's floor for that file, both suites |
| 9 | Swapped `landmarks-verify.test.ts`'s reading route onto `git ls-files` | **stayed green first time** — my carve-out check matched an unrelated `readdirSync` elsewhere in the file. Tightened to inspect the `stateFiles()` body; the retried mutation then went red. Recorded because it was a real hole in my own test, not in the code. |
| 10 | Removed the non-zero-exit `throw` from `offline-rebuild.ts` | red on the check that the extraction did not swallow what the two removed `expect(proc.exitCode).toBe(0)` calls used to catch |

### Notes for the reviewer — none blocking

- **Criterion 16(a), literal reading.** It says every suite "obtains **both**"
  the proxy environment and the runner "from that module". The five suites
  import only `rebuildOffline`; `DEAD_PROXY` is exported but imported by name
  nowhere, reaching each suite *through* the runner that applies it. The
  criterion's purpose — one `127.0.0.1:1` to audit, no suite spawning
  `build.ts`, no suite holding its own copy — is fully met, and importing
  `DEAD_PROXY` unused would be dead code, so I read this as satisfied rather
  than as a fail. Flagging it because it is a judgement, not a measurement.
- **The `expects: 60 → 58` floor drop** in `state-animals.test.ts`,
  `landmarks.test.ts` and `landmarks-verify.test.ts` is exactly as far as the
  extraction forced: `committed-bank.test.ts` now contains precisely 58
  `expect(` occurrences, pinned by a test of mine, so the floor carries no
  slack. Mutation 10 confirms the two removed assertions' job is still done by
  a throw. Criterion 16(a) names this kind of edit exempt from "loosened".
- **`landmarks-verify.test.ts`'s digest check now strips `climate_kid`** before
  hashing (except Colorado's, whose pinned baseline included it). That is not a
  loosening in substance — it is how criterion 15 is enforced — and my own
  `BASELINE_DIGESTS` re-checks the same property from the opposite direction
  (pinning the branch point with `climate_kid` stripped everywhere, Colorado
  included).
- **Environment gap, unrelated to this task:** `frontend/`'s lint-gate suite
  has 5 failures here because `eslint` is not installed in
  `frontend/node_modules` and `bun run lint` cannot resolve its config. No
  `frontend/` file is in this branch's diff, so this is pre-existing and
  environmental. `question-bank/` has no `lint` script and none was added
  (T-066).
- **Still owed by a person:** all eight Review checklist boxes. A test confirmed
  the 50 phrases are well-formed, distinct, jargon-free, digit-free,
  state-name-free strings that read as fragments. Nothing confirmed they are
  *true*, *readable at nine*, or that the interchangeable-climate groups are
  right — and the groups are what stops T-026 shipping a question with two true
  answers.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

- Writing and then mechanically validating 49 phrases against 10 shape rules by
  hand would have been error-prone at this volume; I wrote a throwaway
  validator script (not committed — scratch only) that checked every criterion
  2–11 against draft phrases before touching `us-states.ts`, and iterated on
  the two that failed (Virginia was too long/too many words; nothing else
  needed a second pass). The committed test suite re-derives the same checks
  independently rather than trusting that script.
- Criterion 16(a)'s extraction had a side effect the brief didn't call out by
  name: moving two `expect(proc.exitCode).toBe(0)` calls out of
  `committed-bank.test.ts` and into `offline-rebuild.ts` (as a thrown `Error`
  instead) lowered that file's own `expect(` count from 60 to 58, which three
  *other* files pin as a floor. I lowered those three pinned numbers with a
  comment explaining why, rather than leaving them red — the criterion says
  this kind of edit "is not a 'loosened' test," which I read as covering this
  knock-on adjustment too, but it's worth the reviewer's eyes since it touches
  numbers in files this task didn't otherwise need to open.
- I chose real, named, non-overlapping US climate regions for the
  interchangeable-groups table (criterion 17) rather than grouping by wording
  similarity — a few phrases read alike by coincidence of vocabulary without
  the states being climate peers, and I didn't want to manufacture a
  false-positive group just because two sentences shared words.
</content>
</invoke>
