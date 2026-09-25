# Engineering decisions

Choices about how the **code** is built — the schema, the test setup, the lint
gate, the CI shape — why they went the way they did, and what would make them
worth revisiting. Numbered `E-n`.

**This file is not gated.** A task in the loop may add an entry here when its
acceptance criteria call for one, and the reviewer checks it like any other
change. Decisions about the *loop itself* — the roles, the gates, the brief, who
merges — live in [`process-decisions.md`](process-decisions.md) instead, which
the loop is forbidden to touch (`run-loop.sh` G1). Product decisions live in
[`geoquizdataplan.md`](geoquizdataplan.md).

Add an entry when a decision could reasonably have gone the other way. A
decision with no trigger for revisiting is a habit, not a decision.

Split out of `decisions.md` on 2026-08-29 — see `process-decisions.md` D-12 for
why. Entries keep their original text; only the number and the file changed.

---

## E-1 — Alembic owns the database schema

**Decided:** the pipeline emits JSON; a Python loader writes Postgres. `DbSink`
in `question-bank/` stays a seam for standalone use, not the path that defines
tables.

With a TypeScript pipeline and a Python backend, something has to own the
schema, and two authors will disagree. Recorded in full in plan §5.3.

*Formerly `decisions.md` D-5.*

---

## E-2 — Frontend test files are typechecked, and `@types/bun` pays for it

**Decided:** `frontend/tsconfig.json` no longer excludes `src/**/*.test.ts(x)`.
`@types/bun` is a devDependency of `frontend/` (`^1.3.14`, the version
`question-bank/` already uses) and `"types"` carries `"bun"`, so `bun run
typecheck` covers test files exactly as it covers everything else.

The exclusion was never a decision. It was written during PR #17 to get past a
`tsc` that could not resolve `bun:test`, with a comment saying as much, and it
meant **the only frontend test file was not typechecked at all** — in a
`"strict": true` package with `exactOptionalPropertyTypes` and
`noUncheckedIndexedAccess` on. Tests are the code most likely to be written
against a stale idea of a signature, and they were the one part of `frontend/`
the compiler never read.

**The two alternatives, and why they lost:**

- **Keep the exclusion and write down why.** Free, and honest, but it leaves the
  hole open: a test can call `createApiClient({ baseUrl: 42 })` and nothing says
  so until someone runs it. The cost of closing it turned out to be one
  devDependency.
- **A separate `tsconfig.test.json` and a second `tsc` invocation.** No new
  dependency in the main config, but it needs `@types/bun` anyway to resolve
  `bun:test`, so it buys nothing and costs a second config to keep in step.
  `question-bank/tsconfig.json` already does the simple thing and has since its
  first test.

Dkaattae approved the dependency on 2026-08-24 with those alternatives stated,
per `CLAUDE.md` "Packages". It is types only: nothing it contains reaches a
build, a bundle or a browser.

**Revisit when** `@types/bun` starts costing something real — it conflicts with
`@types/node` or `vite/client` in a way `skipLibCheck` cannot absorb, or it
drags the frontend's TypeScript version forward before the app is ready. The
answer then is `tsconfig.test.json`, not the exclusion: what must not come back
is untypechecked test files.

*Formerly `decisions.md` D-9.*

---

## E-3 — CI requires frontend tests to exist

**Decided:** `--pass-with-no-tests` is gone from the frontend `Test` step in
`.github/workflows/ci.yml`. `bun test` runs bare, in both TypeScript jobs, and
bun's exit code is the step's.

The flag was added by T-003 for a true reason that has expired: `frontend/` had
no test files, `bun test` exits 1 on a package with none, and the job would
otherwise have been red for a reason nobody was going to fix that week. It is
now 65 tests across two files, and the flag's only remaining effect is that
**deleting every one of them leaves CI green** — a check that certifies nothing
in exactly the state where you would most want it to shout. That is the same
shape of failure T-003 spent three verify rounds on: run 31270170161 was green
with a failing test in the tree.

Removing it makes "the frontend has tests" a thing CI asserts rather than a
thing that happens to be true.

**What this does not do:** it is not a coverage threshold and it is not a
guarantee the tests are any good. One trivial test file satisfies it. It closes
the one failure mode that is silent — a package quietly losing its whole suite —
and nothing more.

**Revisit when** a legitimate package in this repo has no tests and should not
be forced to grow one. The fix then is to drop the `Test` step for that package
with a comment, not to bring the flag back: a step that cannot fail is worse
than a step that is absent, because it reads as coverage.

*Formerly `decisions.md` D-10.*

---

## E-4 — The lint gate fails on warnings; `components/ui/` is exempted by path

**2026-08-29.** `frontend`'s lint script was `eslint .`, which exits 0 on
warnings. Every green CI run had been printing `✖ 7 problems (0 errors, 7
warnings)` and passing, so the gate reported a number nobody was obliged to act
on. The script is now `eslint . --max-warnings 0`.

**The strictness lives in `package.json`, not in `ci.yml`.** A `--max-warnings`
flag added only to the workflow would mean `bun run lint` locally and `bun run
lint` in CI returning different verdicts on the same tree, and the local one
being the lenient one. CI's `Lint` step stays a bare `bun run lint`.

**The seven split 1 / 6, and the split is not where `tasks.md` said it was.**
The queue entry recorded, re-checked 2026-08-24, that all seven were in
`frontend/src/components/ui/`. By the time the work ran that was false:

- **Fixed — one, ours.** `frontend/src/components/screens.tsx` exported `AVATARS`
  alongside eight components. Nothing outside that file imported it, so it stopped
  being exported. No call site changed, because there were none.
- **Exempted — six, vendored.** `badge.tsx`, `button.tsx`, `form.tsx`,
  `navigation-menu.tsx`, `sidebar.tsx` and `toggle.tsx`, all in
  `frontend/src/components/ui/`. These are shadcn-generated primitives, copied in
  rather than written here, and each pairs a component with its `cva` variants
  (`buttonVariants`, `badgeVariants`, `toggleVariants`,
  `navigationMenuTriggerStyle`) or a context hook (`useFormField`, `useSidebar`)
  in one file — which is how shadcn ships them.

**Why exempt rather than fix those six.** Splitting each file in two would fork
them from upstream and turn every future `shadcn add` into a manual merge, in
exchange for a fast-refresh improvement in files nobody hand-edits during
development. That is a bad trade. **Not** "to make CI green": the seventh warning,
in code we do write, was fixed rather than exempted, which is the whole point of
the split.

**The exemption is a path glob, not a comment.** `eslint.config.js` turns
`react-refresh/only-export-components` off for `src/components/ui/**` and nothing
else. The rule stays at `warn` severity everywhere else, and `--max-warnings 0`
is what makes it bite — so any rule configured at `warn`, not just this one,
fails the build. Scoping it in one config block means the exemption is greppable
in a single place instead of scattered through six files as `eslint-disable`
comments.

**What would make this worth revisiting.** If we ever start hand-editing
`components/ui/` — treating those files as ours rather than as a vendored copy —
the justification disappears and they should be split properly. Equally, if
`eslint-plugin-react-refresh` grows a way to mark variant/style exports as
refresh-safe, the exemption becomes unnecessary rather than merely cheap. Until
one of those, the directory is a boundary: generated code inside, our code
outside, and the rule applies to our code.

---

## E-5 — Third-party CI actions are pinned by commit SHA; `actions/*` stays on major tags

**2026-09-04.** `.github/workflows/ci.yml` had 13 `uses:` references across four
actions, all on mutable major tags (`actions/checkout@v5`,
`oven-sh/setup-bun@v2`, `astral-sh/setup-uv@v6`, `actions/upload-artifact@v4`) —
whoever holds push access to the repo behind that tag can change what runs on
this repo's runners without a diff here. That is the same exposure
`frontend/bunfig.toml`'s 24h `minimumReleaseAge` guard exists to close on the
npm side (T-003's tester flagged CI's own supply chain as the unguarded half of
that asymmetry).

**Decided: the rule is publisher, not action.** `oven-sh/setup-bun` and
`astral-sh/setup-uv` — actions published outside the `actions/` org, by the
smallest and least-scrutinized maintainers of the four — are pinned to the full
40-character commit SHA their major tag currently resolves to, with a trailing
comment naming the release it corresponds to (`# v2.2.0`, `# v6.8.0`).
`actions/checkout` and `actions/upload-artifact` — published and operated by
GitHub itself, under the `actions/` org's own release process — stay on the
major tag (`@v5`, `@v4`). The rule that places every `uses:` reference in one
category or the other: **an action's owner is `actions`, or it is not.** All
four actions in `ci.yml` fall under exactly one branch of that.

**Both options, and what the rejected one costs.**

- **Stay on tags everywhere (reject: pin nothing).** Free, and was the status
  quo before this entry. The cost is the exposure above, paid on all four
  actions instead of two: a tag is a pointer, not a version, and nothing in this
  repo would notice or block it moving.
- **Pin everything, including `actions/*` (reject: pin all).** Closes the same
  hole for `actions/checkout` and `actions/upload-artifact` too, at the cost of
  doubling the manual update surface — 13 references instead of 6 — for two
  actions GitHub operates directly, under org-level release controls, where a
  tag-hijack would be a materially bigger incident for GitHub to have happen and
  explain than for a two-person third-party project. The chosen rule accepts
  that residual risk rather than pay to close it too.
- **The chosen split** pays the update chore on 6 of the 13 references
  (`oven-sh/setup-bun` ×3, `astral-sh/setup-uv` ×3) and accepts mutable-tag
  exposure on the other 7 (`actions/checkout` ×6, `actions/upload-artifact` ×1).

**How a version change reaches this repo — and on neither side of the rule does
it happen automatically.** For the two pinned actions, nothing in this repo
notices a new upstream release: a human has to know the tag moved, resolve it to
a commit SHA by hand, and edit `ci.yml`. For the two tagged actions, the
opposite is true and is exactly the risk this rule accepts rather than solves:
the next CI run after the maintainer (GitHub) moves the major tag runs whatever
it now points to, with no diff and no review in this repo, whether that commit
is a bug fix or something worse. **No Dependabot or Renovate config exists in
this repo today** — `.github/` holds only `workflows/` — so neither the pinned
references nor the tagged ones are watched by anything automated. Enabling
Dependabot would close the update-chore side of this but is Dkaattae's call
(`CLAUDE.md` "Packages"), not this task's to make; see the `tasks.md` entry this
task adds proposing it.

**Revisit when** either: (a) a pinned SHA here goes roughly six months without
being refreshed to the action's then-current release — stale enough that the
pinned code is plausibly missing a real upstream fix, which means the manual
chore has already lapsed and needs an owner or a bot; or (b) `actions/checkout`
or `actions/upload-artifact` is the subject of a disclosed tag-integrity
incident, at which point they move to the pinned side of the rule too.

**`blocked-run-notice.yml`'s own `actions/checkout@v5`** (line 36, loop
machinery, not CI) falls under the same rule and already satisfies it — its
owner is `actions`, so it stays on the tag as it already is, and this task made
no edit there. If that file ever adds a third-party action, pinning it is a
hand-written `P` ticket (`process.md`, "Work on the loop itself never enters the
loop"), not part of this task.

---

## E-6 — The 50-state bank is committed; `question-bank/data/us-states/` is tracked

**2026-09-12 (T-010).** `question-bank/data/us-states/` — 50 entity files plus
`index.json`, built offline from the committed SPARQL fixture
(`src/fixtures/us-states.sparql.json`) — is now **tracked in git**, not
generated at deploy or build time. `question-bank/.gitignore` narrows from
`data/` to `data/*` with `!data/us-states`, so everything else written under
`data/` (a `--out data/subset`, a live rerun awaiting review) stays ignored and
only this one directory is exempted.

**The option not taken: keep `question-bank/data/` generated, matching the old
`.gitignore` comment ("the full bank is regenerated from Wikidata, not stored in
git").** Its real cost, stated plainly rather than strawmanned: **Wikidata is
edited continuously, so a committed snapshot goes stale** the moment it is
written (`sample-data/README.md`, before this change, made the same point about
the one-state sample). Every population figure and any hand-corrected fact in
this bank is an August 2026 reading, not a live one, until something refreshes
it. That is a genuine, ongoing cost, not a one-time migration cost — it does not
go away when this PR merges.

**Why committed won anyway.** `T-040`'s loader needs something to seed the
database from at deploy time, and CI cannot rebuild live to check a generated
copy is current — the `question-bank` CI job runs with `HTTP_PROXY` pointed at
`127.0.0.1:1` (`test-guidelines.md`, "No network in tests, ever"), so "regenerate
from Wikidata first" would be a deploy-time step nothing in this repo owns yet.
Committing turns "is the served bank right" into a question a diff review can
answer, and turns "is the offline rebuild still faithful to the fixture" into
something CI checks on every push — `question-bank/src/committed-bank.test.ts`
("T-010 criteria 6 and 8 — the tracked bytes are what an offline rebuild
produces") actually spawns the CLI offline twice into a throwaway directory and
diffs the resulting bytes against what's tracked — rather than something
asserted.

**What committing did *not* require giving up.** The two arguments that looked
strongest for staying generated turned out to already be satisfied without it:
an offline, no-network rebuild from a committed fixture already existed
(`build.ts --offline`) before this task, and the per-entity-file output shape
(`sinks/json.ts`) already gives reviewable diffs. The one real gap — `built_at`
was wall-clock (`new Date().toISOString()`), so every offline rebuild rewrote
all 50 files even with no fact changed — is closed by this task: the offline
path (`build.ts`'s `fixtureTransport`) now takes `built_at` from the fixture's
own `_fixture.captured_at` instead, so `normalizeUsStates(rows, { builtAt })`
produces byte-identical output on every offline run. `built_at`'s meaning
changed accordingly: on the offline path it reads as "the fixture this build
replayed was captured at instant X", not "this file was written at instant X" —
a live run (`bun run build`, no `--offline`) is unaffected and still stamps wall
clock, since a live Wikidata response has no captured-at of its own to reuse.

**Where a reviewed fun fact lives, so a future rebuild does not destroy it
(T-010's Q2) — corrected 2026-09-12, see the round-1 review.** The built entity
files under `question-bank/data/us-states/` are **not** a safe home: every
offline rebuild criterion 6 requires be byte-identical to that rebuild, and at
T-010 time `normalize.ts:145` emitted `fun_facts: []` unconditionally on every
run — `--offline` implying `--no-fun-facts` only means the Wikipedia pass does
not *add* new drafts, it does not mean an existing `fun_facts` survives. A
rebuild overwrites each entity file whole (`sinks/json.ts`'s `writeFile`, no
read or merge), so a hand-reviewed fact placed in built output and criterion
6's byte-identical rebuild are mutually exclusive by construction, not
complementary — true whether the fold-in is unconditional (T-010) or reads a
curated field (T-011): either way, a rebuild derives the file from source and
overwrites whatever was there.

`reviewed: true` fun-fact text instead belongs in a **build input**:
a new field on `CuratedState` in `question-bank/src/curated/us-states.ts`,
committed and hand-edited exactly the way `climate_kid`, `state_animal` and
`landmark` already are, folded into each entity's `fun_facts` by
`normalize.ts` the same way those three fields already are folded in. That
survives an offline rebuild for the same reason `climate_kid` does today: the
curated table is a build *input* the rebuild reads, not part of the built
output it overwrites, and it survives `git clean` because it is tracked
source, not a build artefact. Q2's answer already allows this reading —
"T-011 edits it (or the source the build folds into it) directly" — so this is
not a new decision, only the option Q2 already named being the one actually
built. **T-010 named this home; it did not fill it.** T-011 (2026-09-14) added
the field to `CuratedState`, the fold-in in `normalize.ts`, and wrote the
first fifty `reviewed: true` facts — one per state, listed in full in
`tasks/T-011-review-fun-facts.md`'s Handoff.

**Confirmed by Dkaattae, 2026-09-14.** The round-1 reviewer flagged this
re-reading of Q2 for sign-off before merging rather than treating it as
routine, since it changes what T-011 builds. Reviewed directly: the reading
holds — a build input a human edits and the pipeline folds in, not built
output the pipeline overwrites, is what Q2's own parenthetical already
allowed, and it is the only shape that survives criterion 6's byte-identical
rebuild. No change to the decision. T-011 (`tasks.md`) proceeds on this basis.

**What a fresh clone gets, concretely.** `question-bank/README.md` and
`conventions.md` both now say a clone already contains the 50-state bank, and
that `bun run build` (live) or `bun run build -- --offline --out
data/us-states` (offline, from the fixture) is how it gets refreshed — neither
runs automatically, and no CI job runs the live query.

**Revisit when** the committed bank is old enough that the staleness cost above
stops being theoretical — concretely, when `T-063` (the periodic refresh job,
queued but not built by this task) exists and can post a diff showing the
tracked bank disagrees with a live Wikidata pull, or when someone manually
notices a value here is wrong against Wikidata and there is no job that would
have caught it. Either is a signal that "committed, refreshed by hand" has
become "committed, refreshed never" — at which point the generated-only option
this entry rejected is worth re-costing, not re-arguing from scratch.

---

## E-7 — `top_crops` is hand-curated, not fetched from USDA NASS

**2026-09-17 (T-015).** `Entity.top_crops` — declared since T-010 but emitted as
`[]` for all 50 states until now — is filled the same way as `climate_kid`,
`state_animal` and `landmark`: a field on `CuratedState` in
`question-bank/src/curated/us-states.ts`, folded into each entity by
`normalize.ts` (`curated.top_crops ?? []`, the same array-field shape
`fun_facts` uses at the line below it). There is no `sources/nass.ts`, no
captured fixture, no API key, and no environment variable.

**Why not the live USDA NASS Quick Stats API the queue entry's title named.**
The expander halted T-015 on exactly this (see the task's own "History"
section) before this decision was made:

- **No key exists anywhere** this repo, environment or CI secrets can reach —
  Quick Stats keys come from a signup form and an email, an action outside
  every role's remit, and there is no `NASS_API_KEY` in `.env.example` or any
  `.github/workflows/` secret.
- **CI could not use one if it existed.** The `question-bank` job runs with all
  six proxy spellings pointed at a dead loopback (`.github/workflows/ci.yml`),
  so a live fetch can never run there by design (`test-guidelines.md`, "No
  network in tests, ever").
- **"Top three" has no single honest answer without a key decision NASS
  encodes and a human has to make anyway**: ranked by acres, production
  quantity or value differ (California is grapes/almonds/strawberries by
  value, roughly hay/almonds/wheat by acreage); a year or multi-year average
  has to be picked; and NASS commodity labels are machine strings in shouted
  case, not the kid-facing text every shipped string here already has to be.

**What is curated instead.** One to three genuinely famous **plant** crops per
state, hand-picked by a human and guided informally by rough production
quantity — not a statistic tied to a year, because there is no live lookup to
pin a year to, and not an exhaustive top-N. Livestock, poultry, dairy and eggs
are never crops here: cattle is the top agricultural commodity by value in
several states and would contradict a kid-facing "what grows" question, so
that data is tracked separately by **T-068**, a sibling curated field this
decision deliberately excludes. Fewer than three is correct, not a gap, for a
state with fewer than three honest entries — `CLAUDE.md`'s "prefer a blank
field to a guessed one" rules out padding to three.

**Whose words.** The curated table's `top_crops` strings are themselves the
reviewed, kid-facing text under `CLAUDE.md` "Content rules" — there is no
separate review pass for this field the way `fun-facts.review.json` provides
for `fun_facts` (E-6's build-input reasoning applies here too: a curated field
is a build input the rebuild reads, not built output it overwrites, so it
survives criterion 6's byte-identical offline rebuild the same way
`climate_kid` does).

**Revisit when** a live USDA NASS integration becomes worth the cost this entry
declined to pay now — concretely, if a key becomes available to CI without a
human registering by hand, or if T-068's livestock field turns up a similar
need and the two are worth solving together.

---

## E-8 — `highest_point`'s curated value fills a Wikidata gap only, never overrides it

**2026-09-18 (T-016).** `Entity.highest_point` has been declared and folded in
since the pipeline's first commit, sourced entirely from Wikidata's `P610`
(`normalize.ts`, `sources/wikidata.ts`). Alaska's row in the committed SPARQL
fixture (`src/fixtures/us-states.sparql.json`) is the one exception: it carries
an `elevation` (`P2044`) binding but no `highestPoint` label, so Alaska shipped
with `highest_point_m: 6190` and no name — a silent blank on the most famous
peak in the country, and one nothing in the build warned about.

**What changed.** `CuratedState` (`curated/us-states.ts`) gains an optional
`highest_point` field, read only as a **fallback**: `normalize.ts` computes
`row.highestPoint ?? curated.highest_point`, so a live Wikidata label always
wins when present, and the curated value is used only when Wikidata's own is
absent. A state that ends up with neither now gets a build warning (`field:
"highest_point"`) the same shape as the existing `capital`/`centroid` warnings,
so a future gap like Alaska's announces itself in `build.ts`'s report instead
of disappearing the way this one did.

**Alaska is the only state relying on it today**, because it is the only row
the fixture leaves without a `P610` label. The curated value is not
independently chosen: it is pinned equal to Alaska's `landmark`, so the two
fields cannot silently drift apart. That pinning is what turned the Denali /
Mount McKinley question — escalated by T-013's reviewer on PR #43, still open
when this decision was first written — into exactly one place to be answered
rather than two. **Dkaattae answered it 2026-09-18, on PR #47: Mount
McKinley.** Both `landmark` and `highest_point` were changed together in the
same edit to `curated/us-states.ts`, followed by an offline rebuild, exactly as
this pinning was designed to make possible.

**Why a curated fallback rather than accepting the blank.** `tasks.md` offered
both routes; the approved brief took the fallback because the string already
existed three lines away in the same curated row, `geoquizdataplan.md` §1.9
lists peak elevation as a field the bank carries, and a blank specifically on
Denali is the worst blank to ship in a quiz that claims to teach US geography.

**What this does not do.** It does not fix the `highest_point_m` unit bug
found while surveying this task — several states carry the elevation in feet
under a metres key (Arizona, Oregon, Nebraska, Kansas, Iowa) — filed separately
as **T-069**, since Alaska's `6190` is genuinely metres and the two problems
are unrelated. It also does not change `US_STATES_QUERY` or re-capture the
fixture: the committed fixture is what every offline test replays, so a query
change cannot be verified offline and risks moving the other 49 files.

**Revisit when** a second state needs this fallback — at that point, whether
the curated value is independently sourced or, like Alaska, pinned to another
already-curated field is worth deciding per state rather than assuming Alaska's
shape generalises.

---

## E-9 — The app's `region` vocabulary is the served bank's thirteen values, not the pipeline's eight

**2026-09-18 (T-017).** `question-bank/src/curated/us-states.ts` assigned each
of the 50 states one of **eight** region strings (`Midwest`, `Mountain West`,
`Northeast`, `Pacific`, `Pacific Northwest`, `South Central`, `Southeast`,
`Southwest`); the bank the app actually serves today
(`backend/app/data/content.json`, 15 states) uses **thirteen**. The curated
table's own comment claimed to match "the values already in the frontend" —
that had stopped being true, and `region` query filters meant something
different depending on which half of the repo produced the row.

**Why the served bank's set won, not the pipeline's.** Asked of the human
rather than guessed, per `process.md`'s expander gate for decisions "not yours
to make": the finer, thirteen-value list is the one already shipping to
children today, and it is the one `openapi.yaml`'s `region` filter already
returns real values from. Widening the pipeline's eight-value set up to match
it, rather than collapsing the served bank's thirteen down to eight, keeps the
vocabulary the one already in production and avoids a second, disruptive
change to `content.json` on top of this one.

**What changed and what did not.** `content.json`'s 15 `region` values are
untouched — this task confirms they already satisfy the closed 13-value set
(they do; that set is defined as their union) and freezes them. Every one of
the 50 rows in the curated table now carries one of exactly those 13 values,
written down once in that file's header comment. For the 15 states already
served, the curated table's row was brought to match `content.json`'s value,
not the other way around. For the remaining 35, a human assigned the finer
category by ordinary US regional usage — adapted from, not copied from, the
Census Bureau's divisions (e.g. the Dakotas, Kansas, Nebraska and Missouri
split between `Great Plains` and `Upper Midwest`; New England split out from
the rest of the Northeast; Nevada alone keeps `Great Basin` while the other
Rocky Mountain states stay `Mountain West`). That per-state judgment is
content curation under `CLAUDE.md`'s "Content rules", the same kind already
governing `state_animal` and `climate_kid`, and the brief's Review checklist
records who spot-checked it.

**What this unblocks.** T-022 (same-region distractors for map/capital
questions) was blocked on the vocabulary being well-defined at all; this
decision is what "well-defined" now means for that task, though T-022 itself
still needs T-021 first regardless.

**Revisit when** T-050 wires the pipeline's 50-state output into what the app
actually serves — at that point every one of the 50 rows' region assignment
(not just the 15 already live) becomes user-facing, and the 35 judgment calls
this entry describes are worth a second look by whoever picks that task up.

---

## E-10 — The level window is computed once, on the server, and `level.ts` stays

**2026-09-21 (T-057).** `backend/app/levels.py`'s `level_window` docstring
claimed to mirror a `levelWindow()` function in the client. No such function
has ever existed — `grep -rn levelWindow` over the whole tree matched nothing
outside that one docstring, `tasks.md` and `PROGRESS.md`. The false claim
raised the question T-004 had deliberately left open: does the client need its
own window arithmetic at all, or was the docstring simply wrong?

**The docstring was wrong, not the client.** `backend/app/serializers.py` puts
`level_window(profile.last_session_end_level)` straight into `suggestedLevels`
on `GET /profiles/{profileId}/progress`, and `frontend/src/components/screens.tsx`'s
`Setup` already renders that array as-is — one button per entry, falling back
to `[profile.lastSessionEndLevel]` only when the array is absent or empty. No
module under `frontend/src` derives a window from a level; there was nothing
to move to the client, because the client was never supposed to compute one.

**`frontend/src/lib/level.ts` keeps existing anyway**, and this is the part
worth writing down rather than assuming: `suggestedLevels` is an array of bare
numbers, not the labelled `LevelLabel` object the session endpoints return.
Something still has to turn `6` into `"3rd grade · Hard"` for a screen that has
a level but no session to ask — `Setup`'s own "How tricky?" buttons
(`screens.tsx:423`, calling `levelLabel(option)` on each candidate the server
suggested), the profile line above it (`screens.tsx:361`), and the profile
picker (`screens.tsx:195`). `level.ts` is exactly that: display-only formatting
that never computes a level, only labels one the server already picked.
Deleting it would not remove any arithmetic — it would just leave those three
call sites with a bare number where a child expects a grade and a difficulty.

**What this leaves open, on purpose.** Whether label formatting itself should
move server-side — so the client never duplicates `gradeOf`/`bandOf` at all —
is T-004's larger question, and it stays open. `fixtures/level-labels.json`
pins the two implementations together so a drift between them fails loudly
instead of quietly; that is what buys the time to decide it properly rather
than under this task's much narrower scope (a false docstring and a window
that broke its own three-or-four rule at the top of the scale).

**Revisit when** T-004's label-formatting question is actually picked up — at
that point this entry's three call sites are exactly what would need a home on
the server, and `level.ts` is what would be deleted once they had one.

---

## E-11 — The two `origin/main...HEAD` / `13a735f` diff guards are deleted, not repaired

**2026-09-22 (T-072).** `question-bank/src/climate-kid.test.ts` and
`question-bank/src/climate-kid-verify.test.ts` each carried a test, written for
T-014's criterion 19 ("nothing already verified is weakened"), that shelled out
to `git diff --name-only` against a git range fixed at the task that wrote it —
`origin/main...HEAD` in the first, the literal commit `13a735f` in the second —
and asserted that nothing under `frontend/` or `backend/` appeared in the
result. Both were broken by construction, in two different ways:

- **`climate-kid-verify.test.ts`'s copy was already red on `origin/main` itself**,
  in any full clone: `13a735f` predates the FastAPI backend, so
  `backend/app/data/content.json` and everything else added since show up in
  the diff every time, on every branch, including `main`'s own head. Its
  docstring said as much and named `runs/T-057-level-window-docstring.md`
  (1253 pass / 2 fail on a full clone) as the measurement.
- **`climate-kid.test.ts`'s copy measured whichever task happened to be
  running**, not T-014: `origin/main...HEAD` is `main` to *this* branch, so
  every later task that legitimately touched `frontend/` or `backend/` tripped
  a guard written about a task that had ended months of commits earlier. The
  file grew a hand-maintained `ALLOWED_OUTSIDE_QUESTION_BANK` allowlist to
  paper over this, one entry per task that hit it (T-017's
  `backend/tests/test_region_vocabulary.py` was the one live entry, and it had
  already merged and gone stale on `origin/main` by the time this task ran).

**Neither failure showed up in CI**, which is the actual defect this closes:
`.github/workflows/ci.yml`'s `question-bank (typecheck, test)` job checks out
with `actions/checkout@v5` and no `fetch-depth`, so the clone is shallow and
`origin/main` and `13a735f` are both simply absent. Both tests swallowed that
silently — one by treating a non-zero or empty `git` result as a pass, the
other by accepting exit code 0, 1 *or* 128 as sufficient — so CI reported green
while asserting nothing.

**Decided: delete both tests and their allowlist, rather than widen
`fetch-depth` or rewrite the range to be self-relative.** Raising
`fetch-depth` in `ci.yml` is out of reach for a `T` task (`process.md`, "Work
on the loop itself never enters the loop" — workflow changes are `P-n`
tickets, done by hand). A range that resolved itself at run time (a computed
merge-base, say) was considered and rejected: the property both tests were
trying to check — "this file imports nothing from outside the package" for
the structural half of criterion 19 — already has a git-free test right next
to the deleted one (`climate-kid.test.ts`'s "nothing outside question-bank/ is
touched by this task's own new test file"), and it survives this change
untouched. The diff-based half was T-014-specific bookkeeping wearing a
permanent-suite disguise; once a task merges, a diff against a fixed point in
its history stops meaning "what did T-014 touch" and starts meaning "what has
every subsequent task touched," which is not a thing worth gating every task
after T-014 on.

**What this does not touch.** The pinned-digest baselines in
`landmarks-verify.test.ts`, `climate-kid-verify.test.ts` (`BASELINE_DIGESTS`)
and `top-crops-verify.test.ts`, and their accumulated per-task
neutralisations, are a different defect — T-070's, not this one's — and
nothing about them changed here.

**Revisit when** a real cross-package "nothing outside my package moved" check
is wanted again. The honest version needs either a deeper `fetch-depth` in
`ci.yml` (a `P-n` ticket) or a check that does not depend on git range at all
— a manifest of files each task's own commits are expected to touch, checked
against `git status` at PR time rather than against history baked into the
test file.

---

## E-12 — The "no existing E-n entry was modified" test is deleted, not re-pinned

**2026-09-22 (T-073).** `frontend/src/level-window-claim.criteria.test.ts`
carried a test, written for T-057 criterion 8, that read this file's content
at `git merge-base HEAD origin/main` and compared everything before the
`## E-10 — ` heading against the whole of `engineering-decisions.md` at that
commit. It held only while T-057 was in flight and E-10 was not yet on `main`;
once E-10 merged, the merge-base copy of the file already contained E-10 (and
later E-11), so the "everything before E-10" slice of the merge-base copy and
of the working copy stopped matching by construction — the test could never
pass again, on any branch, because the file it was diffing against now
contained the very entry it was trying to prove hadn't been added yet.

This was the fourth instance of the defect E-11 closes two of: a git baseline
fixed at the task that wrote it, silently defused in CI because
`actions/checkout@v5` runs with no `fetch-depth` (`.github/workflows/ci.yml:24`)
so `origin/main` is simply absent, and both `git` calls (`merge-base`, `show`)
escaped through a bare `return` on non-zero exit instead of failing. Green in
CI, red in any full clone, for the same reason as the two E-11 deleted.

**Decided: delete the test, not re-pin its baseline to today's `main`.**
Re-pinning is what produced all four instances — each one worked until the
next merge past its fixed point, then failed forever after. A self-relative
range (comparing against the parent commit, say) was considered and rejected
for the same reason E-11 rejected it for the diff guards: once a task merges,
"has anything changed since commit X" stops meaning what the test's author
meant by it and starts meaning "has any later task touched this file," which
is not a property worth gating every subsequent task on. Raising `fetch-depth`
in `ci.yml` to make the comparison resolvable in CI is out of reach for a `T`
task (`process.md`, "Work on the loop itself never enters the loop"); E-11
already rejected this route for the same defect.

**What survives.** The property this test partially stood in for — the file
only ever grows, entries are never renumbered or reordered — is still asserted
git-free, and was already asserted git-free before this task, by the
heading-list checks two tests above it in the same file (`E-n` numbers unique,
ascending, nothing after E-10 is ≤ 10) and by the same shape in
`question-bank/src/region-vocabulary.test.ts:318-351` for E-9. What is lost is
strictly narrower: whether an *existing* entry's body text was edited in
place, as opposed to only appended to. No git-free test in this repo asserts
that today, for E-10 or for any other entry, because the only way to assert it
without a git baseline is to pin a hash or a copy of each entry's prior text
inside the test itself — which is exactly the same expiring-baseline shape
this task exists to remove, just moved from a git call into a string literal.

**Revisit when** a real "entries are never edited in place" check is wanted
again. The honest version needs either the same deeper `fetch-depth` E-11's
"Revisit when" already named, or a hash of each entry's body recorded next to
it in the file at the time it is filed — a per-entry checksum, checked at PR
time by the reviewer reading the diff rather than by a test that ages the
moment history moves past it.

---

## E-13 — `climate_koppen` is deleted everywhere, the contract included

**2026-09-25 (T-067).** `climate_koppen` (`climateKoppen` in the contract) is
removed from all four places that declared it:

- `question-bank/src/types.ts`, the pipeline's `Entity` interface;
- `openapi.yaml`, `components.schemas.Entity.properties.climateKoppen`;
- `backend/app/models.py`, the served `Entity` model;
- `geoquizdataplan.md` §1.4, the entity example.

The `Köppen climate` row of the plan's §1.9 source table is deleted too, and
the one comment that cited it (on `climate_kid` in
`question-bank/src/curated/us-states.ts`) no longer does.

**This is a contract change, made deliberately.** Removing an optional
property from `openapi.yaml`'s `Entity` schema is a change to the
frontend/backend contract (`CLAUDE.md`: "change it deliberately and say so").
Nothing on either side read or wrote the field, so no client or response
changes shape.

**Why delete rather than keep or emit.** The field was never emitted: no
query, no `normalize.ts` path, no tracked data file and nothing in
`frontend/` produced or read it, and the backend model declared it without
ever populating it. `climate_kid` is the shipped form. T-014 hand-curated it as
kid-facing phrasing with no climate codes in it, and the tests for that field
forbid the codes outright. Keeping the field in the contract only as "not yet
sourced" was option B and was declined. Emitting it (option C) needs a source
this repo does not have: Wikidata's Köppen coverage is thin for US states, and
the Beck et al. raster would be new data and probably a new dependency. The
human chose deletion everywhere in their answer on T-067 (2026-09-24),
together with deleting the §1.9 row.

**Revisit when** world-scope climate data is actually sourced, for example
when world countries are built and a Köppen source is chosen for them. Then
the field comes back as a new, deliberate addition to the pipeline, the
backend and the contract together, not as a revival of this unused
declaration.

---

## E-14 — Once the backend and frontend are built, the backend is the source of truth

**2026-09-25 (T-067).** Once the backend and the frontend are both built, the
backend is the source of truth for the API's shape. `openapi.yaml` follows the
backend rather than constraining it. When the two disagree, the fix is to
bring `openapi.yaml` in line with what the backend serves, not to hold a
backend change back because the contract says otherwise.

**Where this came from.** It is the human's rule, given in their answer on
T-067 (2026-09-24): "Do not need to care about the openapi contract, once
backend and front built, backend is the source of truth. Please note
somewhere." T-067's own contract change (E-13) was the first decision made
under it.

**What it does not say.** It is not a sweep of existing drift, and it does not
address the period before both halves are built.

**Amended 2026-09-25 (P-8), by katechen150621@gmail.com: the `openapi.yaml`
contract does not matter.** This paragraph used to add that "a change to it is
still deliberate and still said out loud". That was T-067's worker's wording,
not the human's, and it is withdrawn. A change to `openapi.yaml` needs no
special care, no announcement and no escalation. It is kept in step with the
backend because the backend's contract check (`backend/tests/conftest.py`,
`assert_matches`: no response key the contract leaves undeclared) fails
otherwise, which makes it a file to update, not a promise to defend.
`CLAUDE.md`'s opening paragraph says the same.

**Revisit when** a consumer outside this repo depends on `openapi.yaml`, for
example a second client or a published API. At that point the contract has a
reader the backend cannot see, and it would need to constrain the backend
again.
