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

---

## E-15 — `question-bank/` lints with oxlint; `frontend/` stays on eslint

**2026-09-28 (T-066).** `question-bank/`'s `bun run lint` runs **oxlint**
(`oxlint --deny-warnings --report-unused-disable-directives --format default
src`, config in `question-bank/.oxlintrc.json`). `frontend/` keeps eslint with
typescript-eslint. The two packages use different linters on purpose, and rule
names from one do not apply to the other.

**Why.** `question-bank/` pins `typescript` `^7.0.2`. typescript-eslint throws
while loading against it (`typescript-eslint does not support TS 7.0.`): a hard
version guard in `typescript-eslint/dist/index.js`, not a peer-dependency
warning, and TS 7's package no longer exports the compiler API the parser needs.
Without typescript-eslint, eslint cannot parse TypeScript. oxlint parses
TypeScript with its own Rust parser and never imports the `typescript` package,
so the TS 7 pin does not matter to it. The human chose it on 2026-09-25 ("go
with oxlint").

**What was rejected.**
- **Side-by-side TS 6 and TS 7**: `typescript@^6` for typescript-eslint, TS 7
  under an alias for `tsc`. Microsoft's TS 7 post recommends it. It changes the
  `typescript` entry and adds a second compiler to keep in step.
- **Downgrading `question-bank/` to TS 5.8/6.0** to match `frontend/`. It gives
  up TS 7's checker in this package just to satisfy a linter.
- **Waiting** for typescript-eslint to support TS 7. Every brief touching
  `question-bank/` kept asking for a `bun run lint` that did not exist.

**Same rules as E-4.** The warning limit lives in the script
(`--deny-warnings`), not in `ci.yml`, so a local run and CI agree.
`--format default` is pinned because oxlint switches to a terser output format
when it detects it is running under an AI agent, and that format drops the
`Found N warnings and M errors.` summary line.

**Revisit when** typescript-eslint supports TS 7 (typescript-eslint issue
#10940), at which point one linter across both packages is possible again; or
if `frontend/` moves to oxlint, at which point the split disappears the other
way.

---

## E-16 — `question-bank/` is formatted by prettier pinned to an exact version; one test file holds the dependency set

**2026-09-28 (T-071).** Two decisions, taken together because the second was
the price of the first.

**(a) prettier, exact.** `question-bank/`'s formatter is **prettier**, a
devDependency pinned to an exact version (`3.9.6`, no `^`), with its four
settings in `question-bank/.prettierrc` — the same four as
`frontend/.prettierrc` and `conventions.md` "Code". `bun run format` rewrites
`src/**/*.ts`; `bun run format:check` checks it, and CI's `question-bank` job
runs that script as its Format step. The glob lives in the script, not in
`ci.yml`, so a local run and CI check the same files (E-4). JSON under
`data/`, `sample-data/` and `src/fixtures/` is deliberately outside the glob:
the committed bank is reproduced byte-for-byte by the offline rebuild (E-6),
and a formatter must not be a second writer of it. The human approved the
dependency on 2026-09-25 ("allow prettier"). Before this, the package had no
config and ran `bunx prettier` on whatever version the network served, with
prettier's own defaults — which is how it drifted.

**Why exact.** Prettier changes its output between minor and even patch
releases. With a range, two machines — or CI and a laptop — can resolve
different versions and disagree about the same file, and a format gate that
flips on a lockfile refresh is noise. An exact pin means a format change only
ever arrives through a deliberate version bump, in its own commit. `frontend/`
still uses `^3.7.3`; aligning it is not this decision.

**(b) One dependency-set check, not nine.** Nine test files
(`climate-kid-verify`, `climate-kid`, `landmarks-verify`, `landmarks`,
`state-animals`, `region-vocabulary`, `top-crops-verify` via its
`DEPENDENCY_DIGESTS`, `highest-point-verify` via a diff against `origin/main`,
and `lint-gate`'s T-066 criterion 16 block, which forbade any package named
`prettier`) each pinned `question-bank/`'s dependency set by hand, so every
approved addition had to edit all nine — T-066 did, for `oxlint`. They are
replaced by **`question-bank/src/dependency-set.test.ts`**: the approved
devDependency set, no `dependencies` / optional / peer keys, prettier's exact
pin, and `bun.lock` resolving that same version. It reads only the working
tree — no `git` — so a shallow CI checkout gets the same verdict as a full
clone, unlike `highest-point-verify`'s copy, which returned early there. As in
E-11 and E-12, the removed tests are deleted rather than repaired: what they
guarded is still guarded, in one place. `lint-gate.test.ts`'s T-066
criterion 17 test (no `trustedDependencies` / `overrides` / `resolutions`) is
not a dependency-set pin and stays.

**Revisit when** a prettier upgrade is wanted — bump the exact version, run
`bun run format`, and commit the result alone — or when `frontend/` gets a CI
format check, at which point the two packages' prettier versions should be
aligned deliberately rather than by accident.

## E-17 — `frontend/` is formatted by the same exact prettier as `question-bank/`, over `.`

**2026-09-29 (T-075).** Answers E-16's "Revisit when … `frontend/` gets a CI
format check".

**The pin.** `frontend/package.json` pins prettier to `3.9.6` exactly — the
same string as `question-bank/package.json`. `frontend/bun.lock` already
resolved `3.9.6` under the old `^3.7.3` range, so this changed a specifier, not
a version, and no package entered either lockfile. The reasons for exact are
E-16's: a range lets two machines disagree about the same file.

**The glob is `.`.** `bun run format:check` runs `prettier --check .`, the same
set `bun run format` (`prettier --write .`) already wrote, with
`frontend/.prettierignore` excluding build output, lockfiles and the generated
`routeTree.gen.ts`. A check narrower than the writer would let `bun run format`
produce changes CI never asks for. A source-only glob would also have gated
nothing new: `.ts`/`.tsx`/`.js`/`.mjs` were already held to prettier through
`eslint-plugin-prettier` in `bun run lint` (E-15 keeps `frontend/` on eslint),
and the files that had drifted were Markdown and CSS. As in E-16, the glob lives
in the script, not `ci.yml` (E-4). CI's `frontend` job runs it as its Format
step.

**One version, two packages.** A prettier bump changes **both** `frontend/` and
`question-bank/` in the same change — both pins, both lockfiles, and the
reformat each produces — so the two packages never disagree about what
"formatted" means.

**Revisit when** a prettier upgrade is wanted (bump both, run `bun run format`
in both, commit the reformat alone), or when Lovable is reconnected (T-044) and
rewrites `frontend/AGENTS.md` unformatted, turning this gate red.

## E-18 — `top_livestock` is a hand-curated sibling to `top_crops`, exposed in the contract now

**2026-10-03 (T-068).** Each US state carries a `top_livestock` list: the farm
animals and animal products it is genuinely known for (Wisconsin's dairy cows,
Delaware's and Arkansas's chickens). It takes exactly the route E-7 settled for
`top_crops`: a field on `CuratedState` in `question-bank/src/curated/us-states.ts`,
folded in by `normalize.ts` as `curated.top_livestock ?? []`, so a state with
nothing curated still carries the key as `[]` and the bank keeps one shape.

**Field name.** `top_livestock` in the pipeline and on the backend's `Entity`
model (`backend/app/models.py`), serialised as `topLivestock` — the same
snake/camel pair as `top_crops` / `topCrops`.

**Exposure.** `openapi.yaml`'s `Entity` schema and the backend model gain the
field now, so T-040's loader has a slot to fill rather than a contract change
to make. No question template reads it yet: templates do not exist (T-020,
T-026), and `backend/app/data/content.json` is not touched (T-040).

**Boundary with `top_crops`.** `top_crops` is plant crops only (E-7);
`top_livestock` is farm animals raised for food and the food they produce —
cattle, dairy cows, chickens, turkeys, pigs, sheep, goats, eggs. No string may
appear in both fields for any state. **Fish and horses are excluded** —
farm-raised fish such as Mississippi catfish, Kentucky's or Tennessee's horses —
as are bees and honey: none is what a child means by "the farm animals this
state raises", and widening the field to them is a separate call.

**Hand-curated, not fetched.** E-7's reasoning holds unchanged: no USDA NASS
key reaches this repo or CI, CI has no network, and "top" needs a human's
call on value versus head count anyway. Zero to two items per state, only where
the state is genuinely known for it; never padded. The strings are themselves
the reviewed, kid-facing text, with no separate review pass. Plain words a
7–10-year-old reads ("cattle", "dairy cows", "pigs") rather than commodity
labels — "beef cattle" is written as "cattle", which also keeps clear of the
`bee` exclusion.

**States with an empty `top_livestock`** (26): AK, CT, FL, HI, IL, IN, KY, LA,
MA, ME, MI, MO, ND, NH, NJ, NM, NV, OH, OR, RI, SC, TN, UT, VA, WA, WV. Several
raise plenty of livestock (Florida and Missouri cattle, Ohio and Indiana eggs,
Virginia poultry); none is what the state is known for, so they stay blank
rather than guessed.

**Pinned-digest guards.** The four guards T-070 owns each gain one more
neutralisation — `top_livestock` deleted before hashing — the same way they
already handle `top_crops`. This task does not re-pin them (T-070).

**Revisit when** a question template for the `agriculture` topic is written and
wants more than two items, or a reviewer wants fish or horses in a farm-animal
question — either is a new decision, not a widening of this one.

## E-19 — `highest_point_m` is the state's own high point; a curated value overrides Wikidata for it

**2026-10-06 (T-079).** T-069 made `highest_point_m` read Wikidata's unit
correctly, and its 50-row cross-check left three states that were still wrong
in a different way. Connecticut shipped 748 m and Oklahoma 1737 m: those are
the summits of Mount Frissell and Black Mesa, and both summits lie in a
neighbouring state (Massachusetts, New Mexico). Wikidata is right about each
mountain; the number is wrong for the state. Virginia shipped 1825 m from
Mount Rogers' single metre statement, which is simply off.

**The rule.** `highest_point_m` is the elevation of **the highest point inside
the state's borders**, for every state. A question built on it may say "the
state's highest point".

**The mechanism.** `CuratedState` (`question-bank/src/curated/us-states.ts`)
gains an optional `highest_point_m: { metres, source }`. When it is present,
`normalize.ts` (`resolveHighestPointMetres`) ships the curated value **whatever
Wikidata says**, and emits exactly one build warning (`field:
"highest_point_m"`) naming the Wikidata value, or its absence, beside the
curated value and its source. An override never applies silently. A state
without one goes through `resolveElevation` (T-069) unchanged.

**What this reverses.** E-8 settled that a curated value "fills a Wikidata gap
only, never overrides it". That still holds for the `highest_point` **label**:
Connecticut keeps "Mount Frissell" and Oklahoma "Black Mesa", because each
state's high point lies on that feature, just not at its summit. It is
reversed for `highest_point_m` only, and only for the states that carry an
override.

**The three overrides**, from en.wikipedia "List of U.S. states and
territories by elevation", **revision 1377209854** (which cites NGS datasheets
and Peakbagger), at that source's one decimal:

| State | Wikidata | Shipped |
|---|---|---|
| CT | 748 | 727.2 |
| OK | 1737 | 1516.4 |
| VA | 1825 | 1740.6 |

Decided by Dkaattae, 2026-10-06, in the T-079 orchestrator session.

**When to delete an override.** When Wikidata comes to agree with it — the
build warning then reads "Wikidata now agrees … delete the override". For CT
and OK that means a P610 or elevation that describes the in-state point, not
the summit; for VA, a corrected statement on Mount Rogers. Deleting it is a
curated-table edit and an offline rebuild, nothing more.

**Revisit when** a fourth state needs an override, or a reviewer wants a
different source of record than that revision.

## E-20 — A generated question starts as a draft; a `map_click` answer is a name with its code beside it

**2026-10-15 (T-021).** `question-bank/src/generate.ts` turns entities ×
templates into question drafts. Two things in it could reasonably have gone
another way.

**The draft shape.** A draft (`QuestionDraft`) carries `id`, `entityId`,
`templateId`, `format`, `prompt` and `answer`, plus `highlightGeometryId` on a
`map_identify` draft and `answerGeometryId` when the template's `answer_field`
is `geometry_id`. It is **not** an openapi.yaml `Question`: it has no `level`
(T-023), no tags (T-024), and no `choices` or `correctIndex` (T-022). Each later
task adds its own fields rather than replacing a placeholder. The `id` is
`gen:<templateId>:<entityId>`: it depends on that pair only, so it survives a
re-run over a subset or a reordering, and the `gen:` prefix keeps it clear of
the hand-written `q-…` ids T-040 will upsert beside it.

**The `map_click` answer.**
- The child-facing `answer` is the entity's `name` ("Colorado"), never its
  `geometry_id`. A FIPS code is never a label a child sees.
- The click target is carried separately as `answerGeometryId` ("08"). Nothing
  downstream joins on `answer`: `conventions.md`, "Join on codes, never on
  names".
- **What T-022 and T-051 build from this.** T-022 builds `choices` for a
  `map_click` question as entity `name`s, the correct one being `answer`, and
  sets `correctIndex` to its position. For every choice it should also carry
  that entity's `geometry_id` in a parallel, code-valued list, so T-051's
  renderer maps a click on region `X` to the choice whose code is `X`, and the
  backend keeps grading by `choiceIndex` (`backend/app/grading.py`
  `CHOICE_FORMATS`) without learning about maps. Names are the labels; codes
  are the join. The exact name of that parallel list is T-022's to choose and
  record in `openapi.yaml`.

**The option not taken:** making `answer` the `geometry_id` itself, with the
name looked up later for display. It is the more literal reading of
`answer_field: geometry_id`, but it puts a FIPS code in the one field every
downstream reader treats as the label. Every consumer — distractors, the
review UI, the client, a log line read by a parent — would have to remember to
translate it, and the first one that forgot would show a child "08". It would
also make `choices` a list of codes that need a name join to display.

**Revisit when** a template's answer is a code that has no `name` to stand for
it (a pin on an unnamed point, say), or T-051 finds that a click must be graded
on the client by code rather than by index.

## E-21 — Distractors come nearest-first in tiers; the correct position is a hash of the draft id

**2026-10-15 (T-022).** `question-bank/src/distractors.ts` `buildChoices(drafts,
entities, templates)` turns `generate()`'s drafts into four-option questions:
`choices` and `correctIndex`, plus `choiceGeometryIds` on `map_click`. It is a
separate stage after `generate()`, not part of it, because a draft is built from
one entity and a distractor needs the others.

**The parallel code list is `choiceGeometryIds`.** On a `map_click` question,
entry `i` is the `geometry_id` of the entity whose `name` is `choices[i]`, so
`choiceGeometryIds[correctIndex] === answerGeometryId`. This settles the name E-20
left to T-022. It enters `openapi.yaml` and `backend/app/models.py` with the task
that makes the backend serve generated questions (T-040 or T-051), not before
(E-14: the contract follows what the backend serves).

**Tiers, then nearest first.** A candidate is another entity of the same `type`
and `scope` with non-blank choice text and a finite `centroid` (and a
`geometry_id`, for `map_click`). Candidates are taken in tier order, and within a
tier by ascending great-circle distance between centroids, ties broken by
ascending entity `id`. A candidate whose text matches the answer or an
already-taken distractor (trimmed, lower-cased) is skipped.
- `sibling_capitals_same_region`: same `region`, then everything else.
- `neighbours_first`: in `borders`, then same `region`, then everything else.

*Why nearest.* A distractor near the answer is the one a child could actually
confuse with it, which is the whole point of §1.2 ("Ohio / Indiana / Illinois /
Iowa"). It needs no data beyond the `centroid` every state already has, and it
gives one answer for every reader, so a tester can compute the expected
distractors from the bank without reading the code.

**The small-region fallback.** Three distractors need a region of four states.
Seven of the 13 regions are smaller, and their 11 states top up from the last
tier, nearest first: HI, CA, NV (alone in their region: 0 same-region
distractors), AZ, NM (1), and AK, OR, WA, KS, MO, NE (2). For the map templates
AK and HI have no borders, so their first tier is empty and the same fallback
applies. The options not taken: skipping these states would drop a fifth of the
capital questions; "the nearest region" needs a region adjacency table that does
not exist.

**The correct position.** `correctIndex` is FNV-1a (32-bit) over the draft id's
UTF-16 code units, passed through the murmur3 32-bit finalizer, modulo 4
(`correctIndexFor`). The answer is spliced into the nearest-first distractor
list at that index. It depends on the id alone, so a draft keeps its position
over a subset or a reordering of the bank, and the output is deterministic with
no `Math.random`. The finalizer is there because FNV-1a's low bits depend only on
the low bits of each byte: `% 4` of it alone gave every template the identical
position pattern. Over the committed bank the 150 positions split 34 / 34 / 40 /
42.

**A short pool is reported, not thrown.** A draft that cannot get three
distractors with distinct text, or whose own entity has no usable centroid,
comes back in `shortPools` (`draftId`, `found`, `reason`) instead of as a
question. A draft naming an entity or template not in the input is a caller
bug, and throws with the draft id.

**Revisit when** a world-scope bank arrives (great-circle distance between
country centroids misleads for large or oddly shaped countries), when T-023 wants
`distractor_tightness` to loosen the pick for younger players, or when T-026
adds templates whose answers can coincide (same state animal, climate or crop)
and needs a guard beyond same-text.

## E-22 — `level` is seeded by a stage after `buildChoices`, from one constant of weights; `familiarity_bonus` is 0

**2026-10-15 (T-023).** `question-bank/src/seed-level.ts` `seedLevels(questions,
entities, templates)` takes the questions `buildChoices` returned and returns
them with `level` added, nothing else changed. Every number it uses is in the
exported constant `LEVEL_SEED_WEIGHTS` in the same module. It is a separate
stage, not a field `buildChoices` sets, for E-21's own reason one step on: a
level needs the distractors, so it comes after them. It also keeps
`buildChoices`'s output, and the tests that pin it, unchanged.

**The formula** (plan §1.4), clamped to 0–18 (`LEVEL_MIN`, `LEVEL_MAX`: the
contract's `Level` range, not a weight, so not in the constant) and not rounded:

```
level = base_level(template)      the template's base_difficulty
      + entity_obscurity          population_rank_weight * bucket(population_rank)
                                  + area_rank_weight * bucket(area_rank)
      + distractor_tightness      near_distractor_weight * (near distractors, 0-3)
      + concept_load              concept_load[template id], else concept_load_default
      - familiarity_bonus         familiarity_bonus, 0 for every question
```

**The constant, as the code spells it:**

```
rank_bucket_edges: [10, 20, 35]
population_rank_weight: 1
area_rank_weight: 0.5
missing_rank_bucket: 2
near_distractor_weight: 0.5
concept_load: { "tpl-identify-on-map": 0, "tpl-capital-of": 2, "tpl-click-the-map": 0 }
concept_load_default: 1
familiarity_bonus: 0
```

- **Buckets.** A rank's bucket is the number of `rank_bucket_edges` it is
  strictly above: ranks 1–10 → 0, 11–20 → 1, 21–35 → 2, 36 and up → 3. Rank 1
  is the largest, so a small, thinly populated state is harder. Population
  weighs double area: a child has heard of a populous state more often than of
  a large one.
- **Missing rank.** A rank that is `null`, absent, or not a positive integer
  (`0`, `-3`, `2.5`, `NaN`, a string) counts as bucket `missing_rank_bucket`
  (2), the bucket of ranks 21–35. So a missing rank is never harder than rank 50
  or easier than rank 1: it is a middling state, not a guessed extreme. Each rank
  is read on its own.
- **Near and far.** A distractor is **near** when its entity is in the question
  entity's `borders`, or has the same non-blank `region`. Every other distractor
  is **far**. A distractor's entity is found by `choiceGeometryIds` on a
  `map_click` question, otherwise by choice text among same-type, same-scope
  entities (trimmed, lower-cased); if several match it is near when any of them
  is, and if none does it is far.
- **`concept_load`.** A capital is a recalled fact with nothing on screen to
  lean on; the map templates show the shape. T-025 raised the capital's load
  from 1 to 2 after reading 30 questions (the record below); the map values
  are still the T-023 first guess.
- **Why `familiarity_bonus` is 0.** The plan's two sources are the player's home
  state and "very famous" entities. A home state is per-player, so it belongs at
  serving time, not in a stored level. No list of famous states exists in the
  bank, and a guessed one is what "prefer a blank field to a guessed one" rules
  out. The term stays in the formula and the constant so T-025 can set it.

Over the committed bank the 150 levels run from 3.5 (California and Texas,
identify on map) to 10 (Delaware, Maine, New Hampshire, Rhode Island, Vermont
and West Virginia, capital). The map templates nearly always get 3 near
distractors, so tightness mostly separates the 11 small-region states of E-21.

**The option not taken:** a continuous `(rank - 1) / 49` scale instead of
buckets. It needs no edges, but the plan says "bucketed", and a handful of
buckets is easier for T-025 to tune by reading 30 questions than a slope.

**Revisit when** T-025 hand-checks 30 questions and the ordering looks wrong, a
world-scope bank arrives (rank counts other than 50, and region near/far means
something else for countries), a player profile exists to carry a home state,
or Elo ratings replace seeded levels (plan §1.4).

### T-025 hand-check of 30 questions (2026-10-16)

**2026-10-16 (T-025).** The 30 questions are the three templates for CA, TX,
FL, NY, WA, CO, KY, HI, AK and RI, read as a seven-to-ten-year-old would meet
them. Prompts and choices are what `buildChoices` returns over the committed
bank; "T-023" is the level under the T-023 weights, "Final" under the constant
above. Every verdict is for the final level.

| State | Template | Prompt | Correct | Distractors | T-023 | Final | Verdict | Why left that way |
|---|---|---|---|---|---|---|---|---|
| CA | tpl-identify-on-map | Which state is highlighted? | California | Nevada, Oregon, Arizona | 3.5 | 3.5 | about right | |
| TX | tpl-identify-on-map | Which state is highlighted? | Texas | Oklahoma, New Mexico, Louisiana | 3.5 | 3.5 | about right | |
| FL | tpl-identify-on-map | Which state is highlighted? | Florida | Georgia, Alabama, South Carolina | 4.5 | 4.5 | about right | |
| NY | tpl-identify-on-map | Which state is highlighted? | New York | Vermont, Connecticut, Massachusetts | 4.5 | 4.5 | about right | |
| WA | tpl-identify-on-map | Which state is highlighted? | Washington | Oregon, Idaho, Alaska | 5 | 5 | about right | |
| CO | tpl-identify-on-map | Which state is highlighted? | Colorado | Wyoming, Utah, Nebraska | 5.5 | 5.5 | about right | |
| KY | tpl-identify-on-map | Which state is highlighted? | Kentucky | Tennessee, Indiana, Ohio | 7 | 7 | about right | |
| HI | tpl-identify-on-map | Which state is highlighted? | Hawaii | California, Oregon, Nevada | 6.5 | 6.5 | too hard | A chain of islands against three mainland choices is among the easiest map questions, but its ranks put it in the same buckets as Rhode Island and Vermont, and the one input that sets it apart, 0 near distractors, is worth 1.5; raising that weight lifts the other 48 states instead (tried below). |
| AK | tpl-identify-on-map | Which state is highlighted? | Alaska | Washington, Oregon, Montana | 6 | 6 | too hard | The largest state, usually drawn in its own inset, is easy to pick out, but the population term (rank 48) outweighs its area rank of 1; lowering it needs an input the formula does not have (see the proposal below). |
| RI | tpl-identify-on-map | Which state is highlighted? | Rhode Island | Massachusetts, Connecticut, New Hampshire | 8 | 8 | about right | |
| CA | tpl-capital-of | What is the capital of California? | Sacramento | Carson City, Salem, Salt Lake City | 4 | 5 | about right | |
| TX | tpl-capital-of | What is the capital of Texas? | Austin | Oklahoma City, Baton Rouge, Little Rock | 4.5 | 5.5 | about right | |
| FL | tpl-capital-of | What is the capital of Florida? | Tallahassee | Atlanta, Columbia, Montgomery | 5.5 | 6.5 | about right | |
| NY | tpl-capital-of | What is the capital of New York? | Albany | Harrisburg, Trenton, Dover | 5.5 | 6.5 | about right | |
| WA | tpl-capital-of | What is the capital of Washington? | Olympia | Salem, Juneau, Boise | 6 | 7 | about right | |
| CO | tpl-capital-of | What is the capital of Colorado? | Denver | Cheyenne, Salt Lake City, Helena | 6.5 | 7.5 | too hard | Denver is also Colorado's largest city, so it is likelier to be a name the child has met than Olympia or Frankfort; whether a nine-year-old has heard of Denver is not something this reading can check, and the bank has no field for "the capital is the largest city", so it is left. |
| KY | tpl-capital-of | What is the capital of Kentucky? | Frankfort | Nashville, Charleston, Raleigh | 8 | 9 | about right | |
| HI | tpl-capital-of | What is the capital of Hawaii? | Honolulu | Sacramento, Salem, Carson City | 7.5 | 8.5 | too hard | Honolulu is Hawaii's largest city by far and the likeliest Hawaiian place name a child knows, but nothing in the bank says so, and adding it would be a familiarity guess that needs a person's approval. |
| AK | tpl-capital-of | What is the capital of Alaska? | Juneau | Olympia, Salem, Helena | 7 | 8 | about right | |
| RI | tpl-capital-of | What is the capital of Rhode Island? | Providence | Boston, Hartford, Concord | 9 | 10 | about right | |
| CA | tpl-click-the-map | Find California on the map. | California | Nevada, Oregon, Arizona | 4.5 | 4.5 | about right | |
| TX | tpl-click-the-map | Find Texas on the map. | Texas | Oklahoma, New Mexico, Louisiana | 4.5 | 4.5 | about right | |
| FL | tpl-click-the-map | Find Florida on the map. | Florida | Georgia, Alabama, South Carolina | 5.5 | 5.5 | about right | |
| NY | tpl-click-the-map | Find New York on the map. | New York | Vermont, Connecticut, Massachusetts | 5.5 | 5.5 | about right | |
| WA | tpl-click-the-map | Find Washington on the map. | Washington | Oregon, Idaho, Alaska | 6 | 6 | about right | |
| CO | tpl-click-the-map | Find Colorado on the map. | Colorado | Wyoming, Utah, Nebraska | 6.5 | 6.5 | about right | |
| KY | tpl-click-the-map | Find Kentucky on the map. | Kentucky | Tennessee, Indiana, Ohio | 8 | 8 | about right | |
| HI | tpl-click-the-map | Find Hawaii on the map. | Hawaii | California, Oregon, Nevada | 7.5 | 7.5 | too hard | Hawaii sits apart from the mainland on any US map, so it is easier to find than Kentucky, but its ranks match Rhode Island's buckets and its 0 near distractors are worth only 1.5, for the same reason as the identify row. |
| AK | tpl-click-the-map | Find Alaska on the map. | Alaska | Washington, Oregon, Montana | 7 | 7 | too hard | The largest state, in its own corner of the map, is easy to find, but its population bucket outweighs its area bucket, and swapping those weights would push Florida, New York and Kentucky up with nothing gained elsewhere. |
| RI | tpl-click-the-map | Find Rhode Island on the map. | Rhode Island | Massachusetts, Connecticut, New Hampshire | 9 | 9 | about right | |

**Which weights changed:** one. Every other key of `LEVEL_SEED_WEIGHTS` holds
its T-023 value.

- `concept_load["tpl-capital-of"]`: 1 → 2. Under 1 the capital question tied
  click-the-map for every state but CA (Kentucky 8 and 8, Rhode Island 9 and
  9), yet a capital is a second fact about a state that a child can only use
  once the state's name and place are known, with nothing on screen to reason
  from, so it now sits one step above click and two above identify for the
  same state.

**Weights tried and not adopted** (scratch runs, not committed):

- `near_distractor_weight` 0.5 → 1 lowered Hawaii only 1.5 relative to the
  rest and lifted the other 48 states of each map template by 1.5, moving the
  whole band up without fixing the order.
- `area_rank_weight` 0.5 → 1 helped Alaska but pushed Hawaii, Florida, New
  York and Kentucky up; Florida's shape is among the easiest, so the trade is
  worse.
- Moving a `rank_bucket_edges` value to pull Florida or Colorado into an
  easier bucket was rejected: an edge chosen to move one named state is a
  familiarity list in disguise.

**What the reading found the formula cannot express.** The four `too hard`
map rows (Hawaii and Alaska, both map templates) share one cause: a state that
is drawn apart from the mainland is easy to see, and the only inputs are
population and area rank. The two `too hard` capital rows share another: the
capital is the state's largest city. Both need a new input, not a weight, and
either a fact field (drawn in an inset; capital is the largest city) or a
`familiarity_bonus` list. A list needs a person's approval (the content rule
above), so `familiarity_bonus` stays 0.

**Map questions and the near-distractor term.** 48 of each map template's 50
questions have 3 near distractors; only Hawaii (0) and Alaska (2) differ. For
map questions the term is a constant +1.5 everywhere else, so it separates
nothing but those two. It still points the right way for both, so it stays.

**The band.** The final levels run 3.5 to 10, which renders under plan §1.4 as
1st grade (hard) to 5th grade (easy), `floor(3.5 / 2) = 1` to
`floor(10 / 2) = 5`. That is right for these three templates: they are the
first questions a child meets about US states, so they should start below the
seven-to-ten-year-olds the app is for and reach into the grades where state
capitals are a fair stretch, and Setup's three-or-four-level window (§3.3)
then shows a second grader the big map states and a fifth grader the small
states' capitals. Nothing in these templates belongs above grade 5.

## E-23 — The `GET /questions` tags are added by a stage after `seedLevels`; a template's topic is assigned by id, outside the record

**2026-10-15 (T-024).** `question-bank/src/tags.ts` `tagQuestions(questions,
entities, templates = TEMPLATES, topics = TEMPLATE_TOPICS)` takes the questions
`seedLevels` returned and returns them, in input order, with five tags added and
nothing else changed. `format` and `level` are already on every question
(E-20, E-22) and are carried through, not recomputed. A stage of its own, for
E-22's reason: it keeps the earlier stages' output, and the tests that pin it,
unchanged. Pure; nothing in the build imports it.

**Where each tag comes from.** Wire names are `openapi.yaml`'s camelCase
`Question` properties, which is what `backend/app/store.py` reads from a served
bank (`ageBand`, not the Python attribute `age_band`):

| Tag | Source |
|---|---|
| `scope` | the entity's `scope` |
| `entityType` | the entity's `type` |
| `region` | the entity's `region`, verbatim (not trimmed, not slugged) |
| `topic` | `TEMPLATE_TOPICS[template.id]` |
| `ageBand` | the template's `min_age_band` |
| `format` | already on the question, from the template; must equal it |
| `level` | already on the question, from `seedLevels` |

**Topics of the three templates:** `tpl-identify-on-map` → `location`,
`tpl-click-the-map` → `location`, `tpl-capital-of` → `capital`.

**How a template gets its topic, and why.** `TEMPLATE_TOPICS` in
`templates.ts`, a map from template id to topic, beside `TEMPLATES`, not a tenth
`Template` field. Plan §1.2 defines the record as nine fields, and four
existing tests pin exactly those nine (or `TEMPLATES` deep-equal to the T-020
records); a tenth field would make them stale and need an approved Test change
request for a tag the plan files under §1.3, not §1.2. The cost is that a new
template can be added without a topic, so the stage refuses rather than
defaults: a template with no entry, or an entry outside `TOPICS`, makes
`tagQuestions` throw naming the template id, and a test fails when any
`TEMPLATES` entry has no entry. `concept_load` (E-22) is keyed the same way.

**Holes.** An entity whose `region` is absent, `null` or blank yields questions
with no `region` key at all, never `""` or `null`: a blank, not a guess. A
question whose `entityId` or `templateId` is not in the input, or whose `format`
differs from its template's, makes the stage throw naming the question.

**Backend cross-checks** (E-14: `backend/app/models.py` is the source of truth).
`question-bank/src/tags.test.ts` reads `models.py` and asserts that
`QUESTION_FORMATS` equals `class QuestionFormat` and that `TOPICS` (exported from
`templates.ts`) equals `class Topic`, as sets. Each fails, rather than skips,
when the file cannot be read, the class is missing, or it yields no values.
`Scope` and `EntityType` are not cross-checked: question-bank's `EntityType`
is a deliberate subset of the backend's.

**Revisit when** T-026 adds templates or topics (each needs a
`TEMPLATE_TOPICS` entry), a template needs more than one topic, or the plan
moves topic into the template record.
