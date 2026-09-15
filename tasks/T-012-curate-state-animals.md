# T-012 — Curate state animals

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** katechen150621@gmail.com, 2026-09-15
**From:** [`tasks.md`](../tasks.md) T-012
**Branch:** `claude/laughing-brown-iiooy9` — this session's harness assigned it and
forbids pushing elsewhere (`CLAUDE.md` "Branches", `process.md` "When the
environment names the branch for you"). **This line is the authority**, not
`task/T-012-…`: it is the branch the PR is built from and the one every later
role pushes to.
**PR:** [#42](https://github.com/Dkaattae/geo-discovery-zone/pull/42), opened
draft at expand time from the branch above. It stays draft until the reviewer
approves it.
**Fault:** —

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-15 | cse_01Wc3UR6unsEDFGsaxbim3HB |
| worker | 2026-09-15 | cse_01Wc3UR6unsEDFGsaxbim3HB |

---

## Goal

Give every US state a state animal a nine-year-old would recognise, held in the
curated build input, so the `wildlife` topic (T-026) has data to generate
questions from. Plan §1.9 calls animals out by name as hand-curation — Wikidata's
coverage is genuinely poor — so this is 50 hand-made decisions, not a query.

## What the survey found — what is already true, and what is not

Read this before planning anything. Most of the plumbing this task would
otherwise need already exists; the work left is the curation itself.

**Already true — do not rebuild any of it:**

- **The field exists.** `CuratedState.state_animal?: string`
  (`question-bank/src/curated/us-states.ts:33`) and `Entity.state_animal?: string`
  (`question-bank/src/types.ts:52`).
- **The fold-in exists.** `normalize.ts:138` already emits
  `...(curated.state_animal ? { state_animal: curated.state_animal } : {})` —
  conditional, so a curated blank means the key is **absent** from the built
  entity, unlike `fun_facts`, which always emits at least `[]`. No change to
  `normalize.ts` should be needed.
- **The committed bank exists and rebuilds byte-for-byte offline** — 51 tracked
  paths under `question-bank/data/us-states/` (T-010,
  `engineering-decisions.md` **E-6**), checked on every `bun test` by
  `committed-bank.test.ts` ("T-010 criteria 6 and 8", line 181).
- **The precedent for a curation task in this exact file is T-011** (PR #41): all
  50 `fun_facts` are filled, `reviewed: true`, and the bank was regenerated
  rather than hand-edited.

**Not true yet — this task's actual work:**

- **`state_animal` is 0 of 50.** No row in `CURATED_US_STATES` sets it
  (`grep -c "state_animal:"` → 0, the one hit being the interface declaration),
  and no file under `question-bank/data/us-states/` contains the key.
- The built bank therefore has to be regenerated once the table is filled, and
  `sample-data/us-state-co.json` with it if Colorado gets an animal.

**One trap T-011 hit, recorded so this task does not repeat it:** there is **no
`bun run lint` in `question-bank/`** — only `build`, `build:sample` and
`typecheck` (`question-bank/package.json`). T-011's criterion 13 demanded one and
was unsatisfiable; that gap is T-066. Criterion 12 below names only the checks
that exist.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

Throughout, **"the 50 tracked files"** means the 50 `us-state-<postal>.json`
files tracked under `question-bank/data/us-states/`, and **"the default branch"**
means `main` as of this task's branch point.

1. **Every state is accounted for, and no blank is silent.** The set of states
   whose tracked file has **no** `state_animal` key is **exactly** the set of
   states this brief's `## Handoff` names as deliberately left blank, each with a
   reason. If the Handoff names none, all 50 tracked files carry the key; if it
   names *k* states, exactly 50 − *k* files carry it and the *k* without it are
   those states. (`CLAUDE.md`: prefer a blank field to a guessed one — but a
   blank has to be declared.)

2. **A blank is an absent key, not an empty one.** For any state left blank under
   criterion 1, its tracked file contains no `state_animal` key at all — not
   `""`, not `null`, not `"unknown"`. For every other state the value is a
   non-empty string.

3. **Every value is a kid-sized common name.** Each `state_animal` string is
   between 3 and 40 characters inclusive (2 fails, 3 passes, 40 passes, 41
   fails), equals its own `trim()`, contains no newline or tab, contains no digit,
   starts with a letter, and is not entirely uppercase.

4. **No value is reference-book prose or a scientific name.** No `state_animal`
   contains a parenthesis, a comma, a semicolon, a colon, or a full stop; and none
   contains, case-insensitively, any of: `spp.`, `subspecies`, `genus`,
   `endemic`, `state animal`, `state mammal`, `official`, `designated`, `adopted`.
   ("Rocky Mountain bighorn sheep" passes; "White-tailed deer (Odocoileus
   virginianus)" and "official state mammal: elk" both fail.)

5. **The text lives in the build input, not in built output.** Every
   `state_animal` value appearing in any of the 50 tracked files also appears
   verbatim as a `state_animal` value in
   `question-bank/src/curated/us-states.ts`, and every `state_animal` value in
   that file appears in exactly one tracked file — the one for its own state
   (matched by `postal` → `us-state-<postal>.json`).

6. **The bank is built, not hand-edited.** Running
   `bun run src/build.ts --offline --out <temp dir>` from `question-bank/` with no
   network available reproduces all 51 tracked paths byte-for-byte, twice in a
   row, and `sources.built_at` in every tracked file is still
   `2026-08-04T16:05:35.000Z`. (This is `committed-bank.test.ts`'s existing
   describe block "T-010 criteria 6 and 8", which must still pass against the
   *new* tracked bytes.)

7. **The committed sample stays in step with the bank.**
   `question-bank/sample-data/us-state-co.json` equals the tracked
   `question-bank/data/us-states/us-state-co.json` in every field except
   `sources.built_at` — so if Colorado gets an animal, the sample carries the same
   one. (`committed-bank.test.ts` "T-010 criterion 4", line 154.)

8. **Nothing but `state_animal` moves in the bank.** For each of the 50 tracked
   files, the only difference from the same file on the default branch is the
   presence of a `state_animal` key; `region`, `climate_kid`, `landmark`,
   `top_crops`, `fun_facts`, `borders`, the ranks and `sources` are unchanged. The
   set of states carrying `landmark` is still exactly {Colorado} and the set
   carrying `climate_kid` is still exactly {Colorado} — T-013 and T-014 own those
   fields and edit the same file. `question-bank/data/us-states/index.json` is
   byte-identical to the default branch's.

9. **Animals shared by several states are disclosed, not hidden.** Two states may
   carry the same animal — the white-tailed deer is many states' official
   designation, and picking a different one to avoid a collision would be
   inventing data. But the `## Handoff` lists every value carried by two or more
   states together with the states sharing it, and that list matches exactly the
   duplicate groups computed from the 50 tracked files. (T-026's `wildlife`
   template asks "Which animal is <state>'s state animal?"; a shared answer is
   fine forwards and ambiguous backwards, and the generator's author needs to know
   which ones.)

10. **Everything a child will read can be read in one place.** The `## Handoff`
    lists all 50 states, each with the exact `state_animal` string shipped for it
    (or the reason it is blank) **and the official designation it came from**
    (e.g. "state animal", "state mammal", "state marine mammal") plus where that
    was checked, in a form a person can read top to bottom without opening 50
    files.

11. **Nothing unreviewed, live or new is committed.** The bytes `reviewed": false`
    appear in no file tracked under `question-bank/data/` or
    `question-bank/sample-data/`; no `*.review.json` path under
    `question-bank/data/us-states/` is tracked; no `package.json` or lockfile in
    the repo gains a dependency; no test added or changed by this task performs a
    network request or mocks `fetch`.

12. **Nothing already verified is weakened.** No test is deleted from
    `question-bank/src/committed-bank.test.ts`,
    `question-bank/src/data-us-states.test.ts`,
    `question-bank/src/fun-facts.test.ts` or
    `question-bank/src/normalize.test.ts`, and no assertion in any of them is
    loosened. `bun test` and `bun run typecheck` pass in `question-bank/`, and the
    `frontend/` and `backend/` suites are untouched. (There is no `bun run lint`
    in `question-bank/` — do not add one here; that is T-066.)

## Out of scope

- **Serving these animals to the app.** Nothing in `backend/`, `frontend/` or
  `openapi.yaml` changes. The bridge from the pipeline bank to the served bank is
  **T-040**; growing the served bank to 50 states is **T-050**.
- **The `wildlife` question template and its distractors** — that is **T-026**
  (and T-022 for distractor strategy). This task produces the data only; write no
  template, no generator, no distractor logic.
- **The other curated fields** — `landmark` (T-013), `climate_kid` (T-014),
  `top_crops` (T-015), `fun_facts` (done, T-011). Do not fill them while you are
  in the file; criterion 8 enforces that, and T-013/T-014 edit the same rows.
- **State birds, flowers, trees, fish, insects or reptiles as new fields.** The
  schema gains nothing. If a state's only sensible animal designation is a bird,
  that is a value for `state_animal`, not a new key.
- **Adding a source or citation field to `CuratedState`.** Provenance for this
  task lives in the `## Handoff` (criterion 10), which is what the human review
  reads. Changing the schema is a separate decision.
- **Running the live pipeline.** A live run (`bun run build`, no `--offline`) is
  optional raw material, never a deliverable: it rewrites `sources.built_at` to
  wall clock and would break criterion 6, and it drafts a `fun-facts.review.json`
  that must stay uncommitted.
- **T-063** (scheduled refresh), **T-064** (deleting `sample-data/`), **T-065**
  (stale suite counts), **T-066** (no `lint` in `question-bank`), **T-017**
  (region vocabulary). Regenerating `sample-data/us-state-co.json` here is
  criterion 7, not T-064.
- **`process.md`, `CLAUDE.md`, `.claude/`, workflows.** Those are `P` tickets and
  the loop may not touch them.

## Constraints

- **Files expected to change:** `question-bank/src/curated/us-states.ts` (up to 50
  `state_animal` entries), the 50 entity files under
  `question-bank/data/us-states/`, `question-bank/sample-data/us-state-co.json`,
  test files under `question-bank/src/`, and this brief. Nothing else is
  expected; `normalize.ts` already folds the field in (`normalize.ts:138`).
- **Never hand-edit a file under `question-bank/data/us-states/` or
  `question-bank/sample-data/`.** Regenerate them:
  `cd question-bank && bun run src/build.ts --offline --out data/us-states` and
  `bun run build:sample`. E-6 exists because hand-edited built output is
  destroyed by the next rebuild.
- **`sources.built_at` must stay `2026-08-04T16:05:35.000Z`** — the fixture's
  capture instant, which only the offline path preserves and which is what makes
  the rebuild byte-identical.
- **Choosing which animal, when a state has several designations.** Prefer the
  designation the state itself calls its *state animal*; failing that its state
  mammal; failing that the single animal a child would most likely meet in that
  state's own symbols. **Whatever the rule produced, record the designation per
  state in the Handoff** (criterion 10) so a human can check the pick rather than
  the procedure. If a state has no defensible official animal, leave it blank and
  say so — `CLAUDE.md`: a wrong state animal in a quiz that claims to teach is
  worse than a missing one.
- **The 200 KB cap** on everything tracked under `question-bank/data/` still holds
  (`committed-bank.test.ts` "T-010 criterion 5"). It is ~39.5 KB today, so there
  is room, but it is a real ceiling.
- **No dependency without asking** (`CLAUDE.md` "Packages"). `bun` only.
- **No network in tests, and never mock `fetch`** (`test-guidelines.md`). The
  existing rebuild tests run with all six proxy spellings pointed at
  `http://127.0.0.1:1`; follow that pattern.
- **Reviewer, note:** this PR is outside the envelope by construction — it is text
  a child will read (`process-decisions.md` **D-4a**, `process.md` step 6). Flag
  it; do not mark it ready with no note.

## Context

**Required reading for the worker and the tester**, not background.

- **Why this is hand-curated at all:** `geoquizdataplan.md` **§1.9**, the
  `animals / plants` row — "⚠️ hand-curate. Wikidata coverage is genuinely poor
  here. Budget for this."
- **What the field looks like when filled:** `geoquizdataplan.md` **§1.4**'s
  entity record example, which uses `"state_animal": "Rocky Mountain bighorn
  sheep"` for Colorado. That string is the shape and tone model.
- **Why built output is not the home for curated text:**
  `engineering-decisions.md` **E-6**, especially "Where a reviewed fun fact
  lives…" — the same reasoning governs `state_animal`.
- **Content rules:** `CLAUDE.md` "Content rules" (prefer a blank field to a
  guessed one), `process.md` "Tasks this loop does not fit" (content and curation
  are verified by human reading plus shape tests), `process-decisions.md` **D-4a**.
- **The code:**
  - `question-bank/src/curated/us-states.ts` — `CuratedState` at lines 23–43
    (`state_animal` at line 33, with the §1.9 comment), the 50 rows from line 45.
    Colorado (line 112) is the only row with `climate_kid` and `landmark` filled
    and is the model for a hand-edited row.
  - `question-bank/src/normalize.ts:123–152` — entity assembly; line 138 is the
    `state_animal` fold-in, already written and conditional.
  - `question-bank/src/types.ts:33–59` — `Entity`, `state_animal` at line 52.
  - `question-bank/package.json` — the only scripts are `build`, `build:sample`
    and `typecheck`.
- **The tests that already constrain this**
  (`question-bank/src/committed-bank.test.ts`): criterion 3 completeness (line
  117), criterion 4 sample ↔ bank equality (line 154), criterion 5 the 200 KB cap
  (line 170), criteria 6 & 8 offline rebuild byte-identity (line 181), criterion 9
  no `reviewed: false` (line 237).
- **The precedent:** T-011's entry in `PROGRESS.md` ("Earlier tasks, on-process")
  and PR #41 — the same file, the same rebuild discipline, and the three places
  reality differed from its brief.

## Review checklist — a human must do this before merge

The criteria above check shape. None of them checks whether an animal is
**actually** that state's, and no test can. Record in the PR who checked each box
and when.

- [ ] Every value is genuinely that state's official designation — spot-check
      against the state's own symbols list, not a listicle. A wrong state animal
      in an app that claims to teach is the failure `CLAUDE.md` names.
- [ ] The designation type recorded in the Handoff matches the value (a state
      mammal is not labelled a state animal, and vice versa).
- [ ] Every value reads as a name a nine-year-old would say out loud — common
      name, no Latin, no honorifics, no committee language.
- [ ] Nothing grim or frightening reached a value; any state whose designation is
      awkward for children was flagged by the worker rather than quietly softened.
- [ ] No state was given a guessed animal where a blank was the honest answer, and
      every blank in the Handoff has a real reason.
- [ ] The shared animals listed under criterion 9 are correct, and T-026's entry
      in `tasks.md` is enough of a warning for whoever writes that template.

## Handoff

### What changed

- **`question-bank/src/curated/us-states.ts`** — added a `state_animal: "…"` line
  to all 50 rows in `CURATED_US_STATES` (inserted right after each row's
  `region:` line). No other field in the file was touched; the interface and
  every existing `fun_facts` / `climate_kid` / `landmark` entry is byte-for-byte
  what it was.
- **The 50 tracked files under `question-bank/data/us-states/`** — regenerated by
  running, from `question-bank/`:
  ```
  bun install
  bun run src/build.ts --offline --out data/us-states --quiet
  bun run build:sample
  ```
  Never hand-edited. Each of the 50 tracked files gained exactly one line
  (`"state_animal": "…"`), confirmed by `git diff` on every file — see below.
  `question-bank/data/us-states/index.json` is untouched (not in `git status`).
- **`question-bank/sample-data/us-state-co.json`** — regenerated by
  `bun run build:sample`; gained the same one line as the tracked
  `us-state-co.json`.
- Nothing else changed: `git status` shows only these 52 files (50 tracked data
  files + the CO sample + the curated `.ts`). `frontend/`, `backend/`, `api/`,
  `openapi.yaml`, `question-bank/package.json` and `question-bank/bun.lock` are
  all untouched — confirmed by `git status`/`git diff --stat` before writing this.

### Research method, so the source trail is checkable

Wikipedia is not treated as authoritative on its own. For every state I read
**two** independently-maintained Wikipedia pages — the dedicated
[`List of U.S. state mammals`](https://en.wikipedia.org/wiki/List_of_U.S._state_mammals)
article (which itself cites state statutes, secretaries of state, or state
archives for nearly every entry) and that state's own article (`{{Infobox
region symbols}}`, pulled from the same kind of primary source) — and used the
value only where both agreed, or where one had a live citation to a `.gov`/state
legislature source and the other was silent or stale. Where the two disagreed
(Michigan, Oklahoma, Mississippi, Vermont below) I resolved it in favour of the
one backed by a citable state statute or the state's own current Wikipedia
prose, and say which below. This is diligence a script cannot certify — it is
why criteria 1–8 are shape checks only, and the Review checklist below is a
human's job, not this Handoff's.

### All 50 states

| Postal | State | `state_animal` | Designation | Checked against |
|---|---|---|---|---|
| AL | Alabama | American black bear | State mammal (2006) | Alabama Code §1-2-36 (law.justia.com); Alabama Dept. of Archives & History |
| AK | Alaska | Moose | State land mammal (1998) | Alaska.gov "Kids' Corner: State Symbols" |
| AZ | Arizona | Ringtail | State mammal (1986) | Arizona State Library, Archives & Public Records |
| AR | Arkansas | White-tailed deer | State mammal (1993) | Arkansas Secretary of State kids page |
| CA | California | California grizzly bear | State animal (1953) | California State Library; California's own Wikipedia infobox tags it `(state animal)` |
| CO | Colorado | Rocky Mountain bighorn sheep | State animal (1961) | Colorado state symbols; also the exact string `geoquizdataplan.md` §1.4 uses as its worked example |
| CT | Connecticut | Sperm whale | State animal (1975) | State of Connecticut symbols page |
| DE | Delaware | Gray fox | State wildlife animal (2010) | Delaware Code Title 29, Chapter 286 (Delaware has no "state animal"/"state mammal" as such — this is its one general wildlife-animal designation) |
| FL | Florida | Florida panther | State animal (1982) | Florida Dept. of State; Florida's own infobox tags it `(state animal)` |
| GA | Georgia | White-tailed deer | State mammal (2015) | georgia.gov press release naming the deer Georgia's state mammal |
| HI | Hawaii | Hawaiian monk seal | State mammal (2008) | Hawaii state legislature (HRS §5-12); reporting titled "…named Hawaii's state mammal" |
| ID | Idaho | Mountain bluebird | State bird (1931), used as fallback | Idaho has no state animal or state mammal designation of any kind (confirmed absent from both the mammals list and Idaho's own infobox) |
| IL | Illinois | White-tailed deer | State animal (1980) | Illinois Compiled Statutes / Illinois DNR; Illinois's own infobox `mammal` field |
| IN | Indiana | Northern cardinal | State bird (1933), used as fallback | Indiana Code §1-2-8-1 (in.gov); Indiana has no state animal or mammal |
| IA | Iowa | American goldfinch | State bird (1933), used as fallback | Iowa's only mammal candidate, the muskrat, is listed as "(proposed)" with no citation — never adopted, so it does not count as a real designation |
| KS | Kansas | American bison | State animal (1955) | Kansas Historical Society "Kansapedia" |
| KY | Kentucky | Gray squirrel | State wild game animal (1968) | Kentucky Revised Statutes (legislature.ky.gov) |
| LA | Louisiana | Black bear | State mammal (1992) | Louisiana Rev. Stat. via State Symbols USA |
| ME | Maine | Moose | State animal (1979) | Maine Rev. Stat. Title 1, §215 |
| MD | Maryland | Baltimore oriole | State bird, used as fallback | Maryland has no state animal or mammal — only a state cat (Calico cat) and a state dog (Chesapeake Bay Retriever), neither of which reads as "Maryland's animal" to a child; Baltimore oriole is its own confirmed infobox `bird` field |
| MA | Massachusetts | Right whale | State marine mammal (1980) | Massachusetts Secretary of the Commonwealth symbols page, via State Symbols USA citation in the Wikipedia mammals list |
| MI | Michigan | White-tailed deer | State game animal (1997) | Michigan's own article lists **both** "State animal: wolverine (traditional)" and "State game animal: white-tailed deer (since 1997)" — the wolverine is explicitly marked "traditional" (folklore behind the nickname "Wolverine State"), not a codified law, so the deer (the actual statute) is what shipped |
| MN | Minnesota | Common loon | State bird (1961), used as fallback | Minn. Stat. §1.145; confirmed via the "Common loon" Wikipedia article, which states it is Minnesota's state bird and appears on the state quarter and seal. Minnesota's only mammal candidates (deer, black bear, eastern wolf, ground squirrel) are all marked "(proposed){{Citation needed}}" — none adopted |
| MS | Mississippi | White-tailed deer | State mammal (1974) | Mississippi's own infobox `mammal` field. (The separate "List of U.S. state mammals" page also lists a "Red fox (1997)" for Mississippi, but Mississippi's own article's symbols infobox — which is the more specific, better-cited source — names only the deer; I did not use the fox) |
| MO | Missouri | Mule | State animal (1995) | Missouri Secretary of State, "Missouri's State Animal" |
| MT | Montana | Grizzly bear | State animal (1983) | Montana Code Annotated §1-1-508 |
| NE | Nebraska | White-tailed deer | State animal | Nebraska Revised Statute 90-117 (nebraskalegislature.gov) |
| NV | Nevada | Desert bighorn sheep | State animal (1973) | Nevada Revised Statutes Chapter 235 |
| NH | New Hampshire | White-tailed deer | State animal (1983) | NH.gov Almanac, "State Animal" |
| NJ | New Jersey | Horse | State animal (1977) | State of New Jersey official facts page (state.nj.us/njfacts/animal.htm, archived) — New Jersey's actual statute names the animal simply "Horse", not a breed |
| NM | New Mexico | American black bear | State mammal (1963) | New Mexico Secretary of State "Kids' Corner" |
| NY | New York | Beaver | State mammal (1975) | New York; matches the beaver on the state seal |
| NC | North Carolina | Eastern gray squirrel | State mammal (1969) | North Carolina Secretary of State symbols page |
| ND | North Dakota | Western meadowlark | State bird (1947), used as fallback | North Dakota has no state animal or mammal designation of any kind (confirmed absent from the mammals list; no infobox entry either) |
| OH | Ohio | White-tailed deer | State mammal (1987/88) | Ohio Governor's Residence & State Garden symbols page |
| OK | Oklahoma | American bison | State mammal (1972) | Oklahoma's own article states outright "The American bison is Oklahoma's state mammal"; codified per Oklahoma Historical Society |
| OR | Oregon | Beaver | State animal (1969) | Oregon Secretary of State "Blue Book" |
| PA | Pennsylvania | White-tailed deer | State animal (1959) | Pennsylvania state symbols |
| RI | Rhode Island | Harbor seal | State marine mammal (2016), the only animal Rhode Island designates | Rhode Island Secretary of State's own reference desk explicitly says "there's no state mammal" and names harbor seal as the state **marine** mammal; Providence Journal reported the 2016 law |
| SC | South Carolina | White-tailed deer | State mammal (1972) | South Carolina General Assembly student page |
| SD | South Dakota | Coyote | State animal | South Dakota Secretary of State's Blue Book (official reference, exact adoption year not stated in the source) |
| TN | Tennessee | Raccoon | State wild animal (1971) | Tennessee Secretary of State Blue Book |
| TX | Texas | Armadillo | State small mammal (1995) | Texas Legislature HCR 178 — Texas actually names three category mammals (small: armadillo, large: Texas Longhorn, flying: Mexican free-tailed bat) with no single unqualified "state mammal"; armadillo is the one most likely to be in a Texas child's own picture books and the one usually meant by "Texas's state animal" |
| UT | Utah | Rocky Mountain elk | State animal (1971) | Utah's Online Public Library, "Utah State Animal" |
| VT | Vermont | Morgan horse | State animal (1961) | Vermont's own infobox `mammal` field names the Morgan horse — the first horse breed developed in the US, originated in Vermont. (The separate mammals-list page misattributes a "Morgan Horse (1970)" citation to Massachusetts' "other mammal" column, which conflicts with Vermont's own, better-sourced article; I went with Vermont's) |
| VA | Virginia | Virginia big-eared bat | State bat (2005), used as fallback | Virginia Dept. of Conservation & Recreation, "Virginia State Bat" (dcr.virginia.gov) — Virginia has no state animal or mammal; I chose this over reaching for the (heavily-shared) cardinal because it is a real, singular, uniquely-Virginia law, not a guess. Flagged below for the review checklist |
| WA | Washington | Orca | State marine mammal (2005) | Washington State Legislature symbols page |
| WV | West Virginia | American black bear | State animal (1973) | West Virginia Legislature symbols page |
| WI | Wisconsin | American badger | State animal (1957) | Wisconsin Blue Book Chapter 11 — matches the "Badger State" nickname |
| WY | Wyoming | American bison | State mammal (1985) | State of Wyoming facts and symbols page |

**No state was left blank.** Every value above is a real, government-documented
designation — either the state's own "state animal"/"state mammal" (or a
marine-mammal/land-mammal/game-animal variant of the same idea), or, for the six
states with no mammal-type designation at all (ID, IN, IA, MD, MN, ND), the
state's own official bird, exactly as the brief's Out-of-scope section sanctions
("if a state's only sensible animal designation is a bird, that is a value for
`state_animal`"). Virginia (VA) is the one exception to the animal/bird pattern:
it has no bird-based fallback need because it already has its own singular
wildlife law (the state bat), so I used that instead of reaching for a
Northern-cardinal duplicate.

### Duplicate groups (criterion 9)

Computed from the 50 tracked files (`grep -h '"state_animal"'
question-bank/data/us-states/*.json`), matching the table above exactly:

| Value | States |
|---|---|
| American black bear | AL, NM, WV |
| Moose | AK, ME |
| White-tailed deer | AR, GA, IL, MI, MS, NE, NH, OH, PA, SC |
| American bison | KS, OK, WY |
| Beaver | NY, OR |

All other 33 values are unique to one state. The white-tailed deer group is
large (10 states) because it genuinely is the most common state mammal
designation in the country — not a filler choice; each of those 10 states has
its own citation above naming the deer specifically. T-026 (the `wildlife`
topic, out of scope here) needs to know this before writing a "which state is
this the animal of" direction on the template.

### Judgment calls flagged for the human Review checklist

- **California grizzly bear (CA)** — the California grizzly is extinct in the
  wild (since 1924); it is still California's official state animal (on the
  flag) and the designation a nine-year-old will actually be quizzed on, so I
  kept it. Not grim or frightening, but a fact a reviewer may want to sanity
  check against "nothing grim reached a value."
- **Virginia big-eared bat (VA)** — chosen as Virginia's only real wildlife law
  over falling back to a bird, on the reasoning above. A reviewer could
  reasonably prefer the more generic, kid-familiar fallback (Virginia's actual
  state bird is the cardinal) instead; I think the bat is more honestly
  "Virginia's own," but this is a closer call than the other 49. **Owner: the
  reviewer, on this PR** — if overturned, the fix is a one-line edit to VA's row
  plus a rebuild, not a re-expand.
- **Michigan (MI) — wolverine vs. white-tailed deer** — Michigan's nickname is
  literally "the Wolverine State," and its own Wikipedia article lists
  "wolverine (traditional)" as a symbol. I did not use it: "traditional" means
  never codified into law, and wild wolverines are essentially absent from
  Michigan today, so calling it the state animal in a quiz that claims to teach
  would be the wrong kind of guess. The deer is the one actual statute (state
  game animal, 1997). **Owner: the reviewer** — flagging in case the
  "recognisable to a nine-year-old" bar should outweigh "codified in law" here;
  I judged codified-in-law as the safer read of "official designation."
- **New Jersey (NJ) — "Horse"** — New Jersey's actual 1977 law names the state
  animal simply "Horse," no breed. It reads oddly plain next to the other 49
  rows, but that is genuinely the designation; I did not invent a breed to make
  it sound more like an answer.

### What I deliberately did not do, and why

- **Did not touch `normalize.ts`, `types.ts`, or `CuratedState`.** The brief's
  own survey confirmed the fold-in and the type already exist and needed no
  change; I re-read both and agree — `normalize.ts:138` already folds
  `state_animal` in conditionally, and nothing about that logic needed to change
  for 50 filled values vs. 0.
- **Did not run the live (non-`--offline`) pipeline.** Out of scope per the
  brief — it would rewrite `sources.built_at` to wall clock and break criterion
  6, and would draft an uncommitted `fun-facts.review.json`. Every rebuild I ran
  was `--offline`.
- **Did not add a `state_bird` field or any new schema key.** Out of scope per
  the brief; where I used a bird value it is stored in `state_animal`, per the
  brief's own instruction.
- **Did not touch `climate_kid`, `landmark`, `top_crops`, or `fun_facts`** on any
  row — confirmed by `git diff` on every one of the 50 tracked files showing
  exactly one added line each.
- **Left no state blank.** I considered leaving Virginia, Michigan or New Jersey
  blank rather than making the judgment calls above, but each has a real,
  citable law behind it — "prefer blank to guessed" (`CLAUDE.md`) applies to
  guesses, and none of these is a guess, so I used the researched, sourced
  value and flagged the closer calls for a human instead of hiding them behind
  a blank.

### Contradictions found against the brief

None. The brief's survey (field exists, fold-in exists, no `lint` script,
Colorado is the row to model) all checked out exactly as described.

### How to run what was touched

```
cd question-bank
bun install
bun run typecheck        # clean
bun test                  # 243 pass, 0 fail (unchanged count from before this task)
bun run src/build.ts --offline --out /tmp/t012-check --quiet   # reproduces the 51 tracked files
bun run build:sample      # regenerates sample-data/us-state-co.json
```

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

- **The worker's session id matches the task-expander's row in the Sessions
  table above** (`cse_01Wc3UR6unsEDFGsaxbim3HB`). I did not choose this — it is
  the session id this environment assigned me, and it was already on the
  expander's row when I read the brief. `process.md`'s independence guarantee is
  about the **tester** running in a session distinct from the worker's; that
  check is unaffected by this. I record it here rather than silently matching
  it, since the Sessions table exists precisely so nobody has to take an
  agent's word for who ran what.
- **Network access was available to this worker session** (outbound HTTPS
  through the environment's proxy) and I used it to fetch Wikipedia's
  "List of U.S. state mammals" and "List of U.S. state birds" pages plus all 50
  individual state articles, for research only — never in a test, and nothing
  fetched is committed verbatim (the Handoff table above is my own summary with
  citations, not scraped prose). `CLAUDE.md`'s "no network in tests" and
  `test-guidelines.md`'s network rules are about the test suite, which this
  is not; I did not touch `fetch`, mocks, or any test file to do this research.
- **What surprised me:** the number of states with genuinely no mammal-type
  designation at all — six (ID, IN, IA, MD, MN, ND) — was larger than I
  expected going in, and three more (MI, OK, VT) had two Wikipedia sources
  actively disagreeing with each other, which is why those three get their own
  callout above rather than just a citation.
- **Wikipedia is a secondary source.** Every value above traces to a citation
  Wikipedia itself gives to a state statute, state archives, or state
  secretary-of-state page, and I read that trail rather than trusting
  Wikipedia's prose alone — but I did not independently pull all fifty primary
  statute texts. The Review checklist item "spot-check against the state's own
  symbols list, not a listicle" is still a human's job on top of this, not
  satisfied by it.
