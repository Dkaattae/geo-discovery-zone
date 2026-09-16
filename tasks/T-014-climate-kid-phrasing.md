# T-014 — Curate kid-facing climate phrasing

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**From:** [`tasks.md`](../tasks.md) T-014
**Branch:** `claude/ecstatic-mendel-x3m3tk` — this session's harness assigned it
and forbids pushing elsewhere (`CLAUDE.md` "Branches", `process.md` "When the
environment names the branch for you"). **This line is the authority**, not
`task/T-014-…`: it is the branch the PR is built from and the one every later
role pushes to. Check `git branch --show-current` against it before you start.
**PR:** opened draft at expand time from the branch above — number filled in by
the expander's second commit. It stays draft until the reviewer approves it.
**Fault:** —

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-16 | cse_01EA17nGfGQfj9H6WstCQo5j |

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

Written by `worker` before the tester runs. **Always written, even when nothing
was built.** Criteria 16 and 17 both read this section, so it is a deliverable
and not a note: the 50-row table with what each phrase was checked against, the
interchangeable-climate groups, and which branch of criterion 16 was taken and
why.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

Filled in while working.
</content>
</invoke>
