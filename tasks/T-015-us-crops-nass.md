# T-015 — US crops from USDA NASS Quick Stats

**Status:** `blocked`
**Next step:** `human`
**Approved:** `pending`
**From:** [`tasks.md`](../tasks.md) T-015
**Branch:** `claude/zen-johnson-zmsy1e` — the branch this session was assigned by
Claude Code on the web, used as the task branch per `process.md`, "When the
environment names the branch for you", and `CLAUDE.md` "Branches". Every later
role pushes here.
**PR:** #45, opened draft at expand time, built from the branch above.
**Fault:** the expander halted: T-015 cannot be given observable criteria without
a human deciding **where the shipped crop values come from** (nobody has a NASS
key, and no agent can register for one) and **what "top three" is ranked by** —
both are text a child is graded on, so neither is the expander's to settle.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-17 | cse_014UHMAdWWsvkfN9KUD5wDXi |

---

## TL;DR

- **Blocked on a human, before any code.** Three questions below (Q1–Q3); answer
  them in this file, set `Next step: task-expander`, and the criteria can be
  finalised in one short cycle.
- **Why:** `top_crops` must survive a **no-network, byte-identical offline
  rebuild** (`committed-bank.test.ts`, E-6), so the values have to live in a
  build *input* — a committed NASS fixture or the curated table. Producing a
  fixture needs a free Quick Stats API key that exists **nowhere** in this repo,
  this environment, or CI secrets, and registering for one is an external human
  action.
- **Not blocked on anything technical.** The seam pattern, the offline harness
  and the entity field all already exist; the survey below says exactly what is
  already true and what is left.

## Goal

Fill `Entity.top_crops` — declared at `question-bank/src/types.ts:51`, exposed as
`topCrops` at `openapi.yaml:1480`, and emitted as `[]` for all 50 states today —
with the three crops that matter most per state, so the `agriculture` topic
("What grows most in &lt;state&gt;?", `tasks.md` T-026) has data to generate
questions from. It is the last unpopulated curated-ish field on a US state.

## Blocking questions for a human

Answer inline in this file. Each one changes what the criteria say, so none can
be guessed without deciding the task's shape on your behalf.

### Q1 — Where do the shipped values come from?

All three routes are defensible; the constraint that rules the choice is E-6:
`question-bank/data/us-states/*.json` is **built output**, overwritten whole by
every rebuild, and `committed-bank.test.ts` (lines 173–192) spawns the CLI
offline twice and asserts the tracked bytes match. So `top_crops` values must
come from something the *offline* build reads.

| Route | What lands | What it costs |
|---|---|---|
| **A — live source module + committed fixture** | `sources/nass.ts` with a transport seam, a captured `src/fixtures/us-crops.nass.json` (`_fixture.captured_at`, as `test-guidelines.md` requires), replayed on `--offline` | Needs a key **and** a human to run the live capture once. Matches plan §1.9 and the task title. Commits a captured third-party response — precedent exists (`us-states.sparql.json`), but it is ~50 states × commodities of JSON |
| **B — hand-curated field** | `top_crops` on `CuratedState` in `curated/us-states.ts`, folded in by `normalize.ts` exactly as `climate_kid`, `state_animal` and `landmark` are | No key, ships this cycle, and a human reads 150 crop names anyway (they are kid-facing). Abandons the "source module" the queue entry asks for, and the numbers go stale with nothing to refresh them |
| **C — module now, data later** | The seam, the env handling, the fixture-replay path — `top_crops` stays `[]` | Does not satisfy the queue entry's own "Done when". Would need T-015 split into two entries, the second still waiting on Q2 |

**A hybrid is possible and may be the honest answer:** route A's module and seam,
with the fixture captured by a human when the key exists, and the *kid-facing
strings* curated from it (NASS returns `CORN, GRAIN` and `HAY & HAYLAGE`, not
"corn" and "hay"). Say so if that is what you want; it is two criteria sets, not
one, and probably two tasks.

### Q2 — Who supplies the key, and when?

- **There is no key anywhere**: no `NASS_API_KEY` in this environment, no
  `.env.example`, no `secrets.*` reference in `.github/workflows/` at all.
- **No agent can obtain one** — Quick Stats keys come from a signup form and an
  email, which is an external action outside every role's remit.
- CI cannot help: the `question-bank` job runs with all six proxy spellings
  pointed at `127.0.0.1:1` (`.github/workflows/ci.yml`), so a live fetch can
  never run there by design.

If route A: does a key exist that a human will put in the worker's environment,
and will a human run the capture and commit the fixture? If not, route A cannot
finish, whatever the criteria say.

### Q3 — "Top three" by what measure, and in whose words?

This is a content decision, not a data one, because the answer is what a child is
marked right or wrong on.

- **Ranked by** acres harvested, production quantity, or value of production?
  California is grapes/almonds/strawberries by value and roughly hay/almonds/
  wheat by acreage — different quiz answers for the same state.
- **Which year**, and is a single year or a multi-year average wanted?
- **Is livestock a crop?** Cattle is the top agricultural commodity by value in
  several states and is not a crop; hay, forest products and "aquaculture" sit on
  the same boundary.
- **Whose words?** NASS commodity labels are machine strings in caps. Every
  shipped string is text a child reads, so under `CLAUDE.md` "Content rules" a
  human either reviews the rewrite or the rewrite is the curated table itself
  (route B). Which?

### Q4 — informational, not blocking

Four existing tests assert `top_crops` is `[]` in all 50 tracked files and each
says T-015 owns it: `climate-kid.test.ts:604`, `climate-kid-verify.test.ts:740`,
`landmarks.test.ts:551`, `state-animals.test.ts:604`. Whichever route wins, this
task must replace those assertions rather than delete them — see draft criterion
7. Flagging it so it is not read later as scope creep.

## What is already true — survey, 2026-09-17

Nothing below needs building again.

- **The field exists and reaches the client contract.** `types.ts:51`
  (`top_crops?: string[]`), `openapi.yaml:1480` (`topCrops`, array of string),
  `backend/app/models.py:157` (`top_crops: list[str] | None`). **No contract
  change is needed for this task.**
- **Every state already carries the key, empty.** `normalize.ts:142–145` emits
  `top_crops: []` unconditionally, with a comment naming USDA NASS and §1.9; all
  50 tracked files under `question-bank/data/us-states/` show `"top_crops": []`.
- **The fold-in point for a curated field exists.** `normalize.ts:137–139` folds
  `climate_kid`, `state_animal` and `landmark` from `CuratedState` in exactly the
  shape route B would use.
- **The source-module pattern exists, twice.** `sources/wikidata.ts`
  (`fetchUsStates(transport)`) and `sources/wikipedia.ts`
  (`SummaryTransport` + `createSummaryTransport(log)` + `fetchFunFact(title,
  transport)`), both pure-function-behind-a-seam, both with `httpGet` from
  `sparql.ts` doing the network.
- **The offline fixture-replay pattern exists.** `build.ts:118–126`
  (`fixtureTransport`) and `build.ts:171–173` take `built_at` from the fixture's
  `_fixture.captured_at`, which is what makes offline rebuilds byte-identical.
- **The offline test harness exists and is mandatory.** `offline-rebuild.ts`
  exports `DEAD_PROXY` and `rebuildOffline(buildScript, fileNames, tmpPrefix?)`.
  `climate-kid.test.ts:640` asserts **exactly one** file under
  `question-bank/src/` contains the loopback literal, and `:651` asserts **no**
  `*.test.ts` there spawns `src/build.ts`. A new suite must import the runner.
- **The entity allowed-key lists already include `top_crops`**
  (`climate-kid.test.ts:626`, `landmarks.test.ts:588`,
  `state-animals.test.ts:647`), so populating it trips no key-whitelist test.
- **`sample-data/README.md:29`** says `top_crops` is empty because it needs USDA
  NASS. That sentence becomes false the moment this lands.
- **`PROGRESS.md:654`** says `top_crops` is empty and names T-015.

## Draft acceptance criteria — NOT approved, NOT frozen

Recorded so that answering Q1–Q3 is a short step rather than a blank page. The
expander returns to select and finalise one set; only then does `Approved:` move
off `pending`.

**Route-independent** (true under A, B or the hybrid):

1. Every one of the 50 files matched by `git ls-files question-bank/data/us-states/us-state-??.json` carries `top_crops` as an array of **exactly three** strings; none is empty or whitespace-only, and no state has fewer than three or more than three.
2. No shipped `top_crops` string contains an uppercase-only machine label, a comma-separated NASS qualifier, or a units word — concretely: each string is lower-case except for proper nouns, and none matches `/[A-Z]{2,}/` or contains `" - "`.
3. Within a single state, the three strings are distinct (case-insensitively, after trimming).
4. Two consecutive offline rebuilds (`rebuildOffline` from `question-bank/src/offline-rebuild.ts`) produce `top_crops` byte-identical to each other **and** to the tracked files, with all six proxy spellings pointed at the dead loopback — i.e. the crop values survive a rebuild with no network.
5. No API key, and no string that looks like one, is tracked: no file returned by `git ls-files` contains a value for a NASS key variable, and `git ls-files` returns nothing for any `.env` file.
6. No test reaches the network, and no test defines its own proxy map or spawns `src/build.ts` — after this task, `question-bank/src/` still contains **exactly one** file with the `127.0.0.1:1` literal (`offline-rebuild.ts`), and any new suite imports `rebuildOffline` from it.
7. No test in `question-bank/src/` asserts `top_crops` is `[]` for the tracked files any more; the four that did (`climate-kid.test.ts:604`, `climate-kid-verify.test.ts:740`, `landmarks.test.ts:551`, `state-animals.test.ts:604`) assert the populated invariant instead, and the suite is green.
8. No new runtime or dev dependency is added to `question-bank/package.json`; `bun.lock` is unchanged except by an explicitly approved addition.
9. Every doc sentence that says `top_crops` is empty is corrected: `question-bank/sample-data/README.md:29`, `question-bank/src/normalize.ts:142–144`'s comment, and `PROGRESS.md:654`.
10. `question-bank/data/us-states/index.json` and the per-state files still agree on ids and count (50), and no other entity field changes value — a diff of the 50 tracked files against `main` touches `top_crops` and `built_at` only.

**Route A only** (live module + committed fixture):

11. A build run with the key absent from the environment fails with a single-line message naming the missing variable, and does **not** write partial or empty `top_crops` over tracked files.
12. The offline path (`--offline`) never reads the key and never attempts a NASS request; with the key set to a junk value, an offline build still produces the tracked bytes.
13. The committed fixture carries a `_fixture.captured_at` timestamp and the query parameters it was captured with, per `test-guidelines.md` ("capture it from the real source and record the date").
14. Parsing is tested directly against the committed fixture — the aggregation from NASS rows to three strings is a pure function called without any transport.

**Route B only** (curated table):

11. All 50 entries in `CURATED_US_STATES` carry a `top_crops` array; a test fails if any state is missing it or has a count other than three.
12. The provenance of the curated values — source, measure (Q3), and year — is recorded in `curated/us-states.ts`'s header comment and in an `engineering-decisions.md` entry, and T-015's queue entry is rewritten to say the NASS module is no longer wanted (or a follow-up entry is added for it).

## Out of scope

- **Question generation.** The `agriculture` template ("What grows most in
  &lt;state&gt;?") is T-026 and T-021, not this task.
- **World crops / FAOSTAT** (plan §1.9, second crops row).
- **Anything in `openapi.yaml`.** `topCrops` is already declared correctly.
- **The backend loader and served bank** (`backend/app/data/content.json`).
- **`climate_koppen`** (T-067), **Alaska's highest point** (T-016), **the two
  region vocabularies** (T-017), **deleting `sample-data/`** (T-064) — all
  separate queue entries even though this task touches neighbouring lines.
- **Refreshing the suite-size counts** (T-065), which this task will make stale
  again.

## Constraints

- **Files expected to change** (route-dependent, but never outside these):
  `question-bank/src/sources/nass.ts` (new, route A),
  `question-bank/src/fixtures/*.json` (new, route A),
  `question-bank/src/curated/us-states.ts` (route B),
  `question-bank/src/normalize.ts`, `question-bank/src/build.ts`,
  `question-bank/src/types.ts`, `question-bank/data/us-states/*.json`,
  one new `question-bank/src/*.test.ts`, the four suites named in criterion 7,
  `question-bank/sample-data/README.md`, `question-bank/README.md`,
  `PROGRESS.md`, `engineering-decisions.md`.
- **Invariants:** `top_crops` values must be readable from a **build input**, not
  from built output — E-6's argument applies unchanged (built files are
  overwritten whole by `sinks/json.ts`, no merge). Ranks, borders, and every
  other field keep their current values.
- **Secrets:** keys come from the environment only (`conventions.md`, "No secrets
  in the repo, and no API keys in the client"). Nothing key-shaped is committed,
  including in a fixture's request block.
- **Dependencies:** none without asking (`CLAUDE.md`). No HTTP client library —
  `httpGet` in `question-bank/src/sparql.ts` is what exists.
- **Content:** every shipped crop string is text a child reads and is graded on.
  Prefer a blank to a guess is *not* available here — criterion 1 demands three
  per state — which is exactly why Q3 has to be answered before the criteria
  freeze.
- **A criterion checked through `git ls-files` must be re-run with new files
  tracked** (`tasks.md` T-015, P-4): T-014's tester lost a round to a new fixture
  that was untracked when the check ran.

## Context

**Required reading for the worker and the tester.**

- Plan: [`geoquizdataplan.md`](../geoquizdataplan.md) §1.9 — the source → field
  table ("US crops | USDA NASS Quick Stats API | Free key") and the paragraph
  under it: build time only, ship JSON, no runtime API calls, no keys in the
  client. Also §1.4's entity example (`"top_crops": ["corn", "wheat", "hay"]`,
  line 53) — the shape and register the plan expects.
- Contract: [`openapi.yaml`](../openapi.yaml) line 1480 (`topCrops`) and the
  `Entity` description at 1426–1430 ("Absent means not applicable or not yet
  sourced; generators must gate on presence").
- Field and seams: `question-bank/src/types.ts:51`, `:76` (`EntitySink`);
  `question-bank/src/sources/wikipedia.ts` (the transport-seam pattern to copy);
  `question-bank/src/sparql.ts` (`httpGet`, `USER_AGENT`, backoff).
- Fold-in and emission: `question-bank/src/normalize.ts:137–145`.
- CLI and offline replay: `question-bank/src/build.ts:34–92` (flags),
  `:118–126` (`fixtureTransport`), `:171–178` (`built_at` determinism).
- Test harness: `question-bank/src/offline-rebuild.ts` (import `DEAD_PROXY` and
  `rebuildOffline` — do not re-create either) and the guards that enforce it,
  `question-bank/src/climate-kid.test.ts:635–693`.
- The assertions this task must replace: `climate-kid.test.ts:604`,
  `climate-kid-verify.test.ts:740`, `landmarks.test.ts:551`,
  `state-animals.test.ts:604`.
- Byte-identity check: `question-bank/src/committed-bank.test.ts:173–192`.
- Decisions: [`engineering-decisions.md`](../engineering-decisions.md) E-6 — why
  the bank is committed, and why a hand-edited value in built output cannot
  survive a rebuild.
- Rules: [`test-guidelines.md`](../test-guidelines.md) "No network in tests,
  ever" and "Fixtures" (capture from the real source, record the date);
  [`conventions.md`](../conventions.md) "No secrets in the repo";
  [`CLAUDE.md`](../CLAUDE.md) "Content rules".
- Queue: [`tasks.md`](../tasks.md) T-015, and T-026's `agriculture` row (line
  448) which is the consumer of this field.

## Review checklist — for the human answering the questions above

- [ ] Q1 answered: route A, B, C or the hybrid, in one line in this file.
- [ ] Q2 answered: whether a NASS key will exist in the worker's environment, and
      who runs the live capture if route A.
- [ ] Q3 answered: ranking measure, year, whether livestock counts, and who
      reviews the kid-facing strings.
- [ ] `Next step:` set back to `task-expander` so the criteria can be finalised
      and approved, or to `worker` if you also approve a criteria set as drafted.

## Handoff

_Not started — the brief is blocked before approval._

## Verdict

_Not started._
