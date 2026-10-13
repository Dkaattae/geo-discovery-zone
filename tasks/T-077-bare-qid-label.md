# T-077 — A label that comes back as a bare QID must warn, not ship

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** Dkaattae — 2026-10-13, in the orchestrator session: "I approve T-077 criteria". See `runs/T-077-bare-qid-label.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-077
**Branch:** `claude/inspiring-faraday-a9hh8r` (assigned by the Claude Code on the web harness; this is the task branch every role pushes to)
**PR:** #77, opened draft at expand time, built from the branch above. It **stays draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-13 | cse_019jSkM2Hn46U29v2f2miUvU |
| worker | 2026-10-13 | cse_019jSkM2Hn46U29v2f2miUvU (relayed subagent: same id as every spawned role, `process.md` "Spawning") |

**Why this task.** First in `tasks.md` whose dependencies are done. Skipped:
**T-064** (depends on T-040, not built) and **T-070** (waiting on a human answer
to Q1). Sized S, but it runs on the full brief: it has more than four criteria
(`process.md`, "The light path").

## Goal

WDQS's label service falls back to the bare QID when an item has no English
label, and the pipeline ships whatever string comes back — the first live
`bun run refresh` (T-063) would have told a child Alaska's capital is
"Q29445". A label that is just a QID must be treated as missing and warned
about, so the monthly refresh routine can be switched on without a reviewer
having to spot it by eye (`CLAUDE.md`, "Prefer a blank field to a guessed one").

## Survey — what is already true

- **`capital` is the real exposure.** `capitalLabel` is the one shipped field
  read through `SERVICE wikibase:label` (`src/queries/us-states.ts`), so it is
  the one that falls back to a QID. `parseUsStates` takes it as-is
  (`src/sources/wikidata.ts`, `capital: text(row["capitalLabel"])`), and
  `normalizeUsStates` ships it whenever it is truthy (`src/normalize.ts`,
  `...(row.capital ? { capital: row.capital } : {})`). Nothing checks it today.
- **`highest_point` is labelled explicitly, not via the label service**
  (`rdfs:label` with `FILTER(LANG(...) = "en")` in the query), so a missing
  English label gives an absent binding, not a QID. The guard is still asked for
  (criteria 4–5) because the field ships text and the query could change; it is
  cheap and the entry names it.
- **`stateLabel` is already safe.** A bare-QID state name does not match
  `curatedByName`, so the row lands in `unmatched` and no entity is built
  (`src/normalize.ts`, top of `normalizeUsStates`); `refresh.ts` then fails with
  the missing state named. Criterion 6 pins this rather than asking for new work.
- **`borderNames`** are explicit `rdfs:label` reads used only to look up a
  curated name; a QID never matches one. Out of scope.
- **The committed fixture carries no bare-QID label** (no `"Q<digits>"` string
  value in `src/fixtures/us-states.sparql.json`), so the offline build's output
  and its three `highest_point_m` override warnings (T-079) should not move.
- **Plain-absent capital already warns** `{ field: "capital", message: "missing" }`,
  and `refresh.test.ts`, `report-warnings-stdout.test.ts` and
  `report-warnings-stdout-verify.test.ts` assert the line
  `  us-state-co.capital: missing` verbatim. Criterion 3 keeps that exact text.

## Acceptance criteria

"Bare QID" below means a string matching `^Q\d+$` in full: `Q29445` and `Q1`
are bare QIDs; `Juneau`, `Q`, `q29445`, `Q29445a`, ` Q29445` and `Quebec City`
are not.

1. **A bare-QID capital does not ship.** Given a main-query response in which a
   state's `capitalLabel` binding is a bare QID (e.g. Alaska's `Q29445`),
   `normalizeUsStates(parseUsStates(...))` returns that state's entity with **no
   `capital` key**, and no entity's `capital` value matches `^Q\d+$`.
2. **It warns once, naming the value.** In that case the result's `warnings`
   holds exactly one entry with that state's entity id and `field: "capital"`,
   and its `message` contains the offending QID string (e.g. `Q29445`) — so a
   reader can tell it apart from a plain `missing`.
3. **The existing absent-capital warning is unchanged.** A state whose
   `capitalLabel` binding is absent still produces exactly one
   `{ field: "capital", message: "missing" }` warning, with that message text
   byte-for-byte.
4. **A bare-QID highest point does not ship either.** When a state's
   `highestPoint` binding is a bare QID, no entity's `highest_point` matches
   `^Q\d+$`. If the curated table has a `highest_point` for that state (Alaska:
   `Mount McKinley`), the curated value ships; if it has none (e.g. Colorado),
   the entity has no `highest_point` key.
5. **And it warns, naming the value.** In both cases of criterion 4 the
   `warnings` hold exactly one entry with that entity id and
   `field: "highest_point"` whose message contains the offending QID — including
   when the curated fallback filled the field, because the Wikidata value was
   still bad.
6. **A bare-QID state name builds no entity.** When a row's `stateLabel` is a
   bare QID, no entity is built from it and the QID appears in the result's
   `unmatched`. *(Expected already true via the `curatedByName` miss; this
   criterion pins it.)*
7. **The boundary.** For each non-matching string in the definition above used
   as `capitalLabel` (`Juneau`, `Q`, `q29445`, `Q29445a`, `Quebec City` at
   least), the value ships as `capital` exactly as given, and no `capital`
   warning is emitted for that state.
8. **The refresh route catches it end to end.** `refreshBank` run with a
   `SparqlTransport` fake whose main response is the committed fixture with
   Alaska's `capitalLabel` replaced by `Q29445`: the written `us-state-ak.json`
   has no `capital` key, no written bank file contains the string `"Q29445"`,
   and stdout includes a line starting `  us-state-ak.capital: ` that contains
   `Q29445`.
9. **The committed bank does not move.** No file under
   `question-bank/data/us-states/` changes, and the offline fixture build
   (`bun run build --offline`) prints the same warnings it printed before this
   task (the three `highest_point_m` override warnings, nothing else).
10. **No network, no new dependency.** Every new test runs offline through
    `parseUsStates` / `normalizeUsStates` directly, or through the
    `SparqlTransport` seam for criterion 8; none mocks `fetch`. `package.json`
    and `bun.lock` in `question-bank/` are unchanged.
11. **The whole `question-bank/` suite passes** (`bun test`), and so do
    `bun run lint`, `bun run typecheck` and `bun run format:check`, with no
    pre-existing test deleted or modified.

## Out of scope

- **Fixing the query.** If Juneau's English label exists and the query is
  reading the wrong item (a "City and Borough" vs city mix-up, say), changing
  `US_STATES_QUERY` is a separate task — file it in `tasks.md` via the Handoff,
  do not do it here. A query change moves the fixture and every digest guard
  (T-070).
- **Keeping the previous value on refresh.** Treating the field as missing
  means a refresh that hits this blanks Alaska's capital in the bank, visibly.
  Preserving the last good value instead is a different design and not asked for.
- **`borderNames`, `stateLabel` handling beyond criterion 6**, and any field
  not read from a SPARQL label.
- **Switching on the monthly refresh routine** — still gated on T-070 (a).
- **T-078's `build.ts` fun-fact loop and `regenerate_with`** — its own task.
- **The committed bank, the fixtures, `sample-data/`, `openapi.yaml`, `api/`,
  `backend/`, `frontend/`.**

## Constraints

- **Files expected to change:** `question-bank/src/normalize.ts` and/or
  `question-bank/src/sources/wikidata.ts`, plus new test file(s) under
  `question-bank/src/`. Nothing under `data/` or `src/fixtures/`.
- **Pre-existing tests are not edited.** If one goes red by design, list it
  under Handoff → Tests made stale; the tester raises the Test change request
  (D-14, D-15). None is expected — see Survey.
- **Warnings go through the existing `BuildWarning` list**, so `build.ts` and
  `refresh.ts` print them with no change to either reporter.
- **No new dependency** (`CLAUDE.md`, "Packages"). `bun` only.
- **No network in tests, never mock `fetch`** (`CLAUDE.md`, "Tests";
  `test-guidelines.md`).

## Context

- `question-bank/src/normalize.ts` — `normalizeUsStates`, the existing
  `capital` / `highest_point` warnings and the curated `highest_point` fallback
  (T-016).
- `question-bank/src/sources/wikidata.ts` — `parseUsStates`.
- `question-bank/src/queries/us-states.ts` — which labels come from the label
  service and which from explicit `rdfs:label`.
- `question-bank/src/refresh.ts` — `refreshBank`, `printWarnings`;
  `question-bank/src/refresh.test.ts` for how a `SparqlTransport` fake over the
  committed fixture is built.
- `question-bank/src/fixtures/us-states.sparql.json` — the recorded response;
  Alaska's `capitalLabel` is `Juneau` there.
- `question-bank/src/report-warnings-stdout.test.ts` — the existing
  `us-state-co.capital: missing` line criterion 3 must keep.
- `PROGRESS.md` T-063 entry and "Known gaps" — where `Q29445` was seen
  (2026-10-02).
- `CLAUDE.md` "Content rules"; `test-guidelines.md` (offline, seams).

## Review checklist — the one part tests cannot check

- [ ] **Juneau's label.** The entry asks whether Juneau's English label is
      really gone on Wikidata or the query reads the wrong item. That needs the
      live service, which no test may touch. The worker records in the Handoff
      what it found (which QID the capital statement points at, and whether it
      has an English label) with the evidence, or says plainly that it could not
      check and why. A human reads it; if the query is at fault, a new
      `tasks.md` entry exists.

## Handoff

**TL;DR.** A bare-QID `capital` or `highest_point` label is now treated as missing,
with one warning that names the QID. One file of production code
(`normalize.ts`) and one new test file. The suite, lint, typecheck and format
are all green (1783 pass, 0 fail). Nothing is stale. **Juneau, checked live:**
the query reads the right item. Juneau has a `mul` label but no `en` one. The
fix is filed as **T-084**, out of scope here.

**Files changed**
- **`question-bank/src/normalize.ts`**:
  - adds `isBareQid` (`/^Q\d+$/`, exported so the test pins the definition).
  - **capital:** a bare QID gives one warning,
    `label is a bare QID (Q29445), not a name; left blank`, and the value is
    dropped. An absent capital still gives `missing`, through the same code as
    before.
  - **highest_point:** a bare QID counts as absent, so the curated value fills
    it. There is exactly one warning:
    `label is a bare QID (Qn), not a name; used curated <value>` or
    `…; left blank`. In that case no second `missing` is emitted.
  - The entity now spreads the guarded `capital`, not `row.capital`.
- **`question-bank/src/bare-qid-label.test.ts`** (new, 20 tests): calls
  `parseUsStates`/`normalizeUsStates` directly over in-memory edits of the
  committed fixture, plus one `refreshBank` test through a `SparqlTransport`
  fake.
- **`tasks.md`**: new entry **T-084** (read `mul` labels), from the review
  checklist below.
- `sources/wikidata.ts` is unchanged. The guard lives in `normalize.ts`, next to
  the existing `missing` warnings, because a warning needs the entity id and the
  curated fallback.

**Where each criterion lives**

| # | Behaviour | Test (`bare-qid-label.test.ts`) |
|---|---|---|
| 1–2 | `normalize.ts` capital guard | "criteria 1–2 — a bare-QID capital" |
| 3 | unchanged `missing` branch | "criterion 3"; also the existing `report-warnings-stdout*` and `refresh.test.ts` lines, still green |
| 4–5 | `normalize.ts` `wikidataPoint` guard | "criteria 4–5": Alaska (curated Mount McKinley), Colorado (none) |
| 6 | already true: `curatedByName` miss puts it in `unmatched` (top of `normalizeUsStates`) | "criterion 6" (pin only, no code) |
| 7 | regex is anchored and case-sensitive | "criterion 7" plus "the bare-QID definition" (also covers ` Q29445` and `Q29445 `) |
| 8 | the existing `printWarnings` in `refresh.ts`, unchanged | "criterion 8 — the refresh route catches it end to end" |
| 9 | fixture has no bare QID | checked by hand, below |
| 10 | no `fetch`, no network in tests | `package.json` and `bun.lock` untouched (`git diff --stat`) |
| 11 | `bun test` 1783/0, lint 0/0, typecheck clean, format:check clean | |

**Criterion 9 evidence.**
- **Before and after:** I ran `bun run build --offline --out <scratch>` with and
  without the `normalize.ts` change (via `git stash`). The stdout differs only in
  the `--out` path. The written files are identical (`diff -r`), and they match
  `data/us-states/` (`diff -r`, review files excluded).
- **Warnings:** still exactly 3, the `highest_point_m` overrides for CT, OK and
  VA.
- **The committed bank:** `git status` shows nothing changed under `data/`.

**Fails without the fix.** With `normalize.ts` stashed, 4 tests fail: criteria
1–2, both criteria 4–5 cases, and criterion 8. The 16 that pass are criteria 3,
6 and 7 and the definition tests. Those pin behaviour that was already true.

**Review checklist: Juneau's label (checked live, 2026-10-13 ~18:25 UTC).**
- **Access:** `www.wikidata.org/w/api.php` was refused by the proxy (403).
  `query.wikidata.org/sparql` was reachable, so every check below went through
  it. Nothing in a test touches the network.
- **The capital statement:** `wd:Q797 p:P36` has one statement, NormalRank,
  pointing at **`Q29445`**. That is Juneau, so the query reads the right item.
- **Labels on `Q29445`:** there is **no `en` label**. There is a `mul` label,
  `Juneau`, plus labels in about 20 other languages (`ru`, `ja`, `nan` "Juneau",
  and others).
- **What the label service returns:**
  - `SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }` over
    `wd:Q29445` returns `Q29445`.
  - With `"en,mul"` it returns `Juneau`.
- **Cause:** Wikidata's `mul` ("default for all languages") label, which editors
  have used to replace identical `en` labels. **The query is at fault**: it asks
  for `en` only. Filed as **T-084** in `tasks.md`. The explicit
  `rdfs:label FILTER(LANG = "en")` reads for `highestPoint` and `borderNames`
  have the same blind spot. For those it shows up as an absent binding, not a
  QID.
- **Human to read and confirm.**

**Deliberately not done**
- **The query fix** (`"en,mul"`): out of scope, filed as T-084.
- **Keeping the last good value on refresh:** out of scope. A live refresh today
  would blank Alaska's capital visibly, with the warning.
- **`borderNames`:** untouched, per Out of scope.

**Contradicts the brief:** nothing. The Survey's "WDQS falls back to the bare QID"
is right. The underlying reason is `mul`, not a missing label.

**How to run**
- `cd question-bank && bun test src/bare-qid-label.test.ts` for the new tests.
- `bun test && bun run lint && bun run typecheck && bun run format:check` for
  the full gate.
- **First run:** `node_modules` was absent in this checkout. I ran
  `bun install --frozen-lockfile`, and the lockfile did not change.

**Tests made stale:** none.

## Verdict

## Notes

- **Surprise:** Juneau's English label is not missing by accident. It was folded
  into `mul`. Any item whose `en` label was deduplicated into `mul` will now come
  back as a bare QID through the label service. The guard is still worth having
  after T-084, because other languages could do the same.
- **Decision: no double warning.** When the highest point is a bare QID and the
  state has no curated value, only the bare-QID warning is emitted, not a second
  `missing`, because criterion 5 asks for exactly one. **Reviewer to confirm or
  overturn.**
- **Decision: warning text.** The text is
  `label is a bare QID (<qid>), not a name; left blank` / `…; used curated <v>`.
  The criteria only require that it contain the QID and differ from `missing`.
  **Reviewer to confirm the wording.**
- **Flag: session id.** The worker's session id equals the expander's. That is
  expected under the orchestrator relay (`process.md` "Spawning"), and it is not
  evidence of a shared context. **Tester:** apply the relay rule, do not refuse
  on it.
