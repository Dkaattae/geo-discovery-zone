# T-085a — Level input the weights cannot reach: Hawaii and Alaska are drawn apart from the mainland

**Status:** `awaiting approval`
**Next step:** `worker`
**Decision:** Dkaattae, 2026-10-29, given in the orchestrator's session, answering the worker's block: "split it — do T-085a now"
**Approved:** orchestrator — 2026-10-29, unattended run (T-085a, after the split). See `runs/T-085-level-familiarity-inputs.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-085 (now T-085a; the largest-city half is T-085b)
**Branch:** `claude/loving-knuth-umj4pp`
**PR:** #107, opened draft at expand time, built from the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P |
| worker | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P (same id as the expander's row: the environment variable gave this value; the tester should check its own differs) |
| task-expander (split into T-085a) | 2026-10-29 | cse_011oDiJdDaFDaDrfHH2XNp8P (same value again, from `$CLAUDE_CODE_REMOTE_SESSION_ID`; see the worker's Note on the shared id) |

## Goal

Six served questions about Hawaii and Alaska (both map templates and the
climate question) are seeded harder than a child finds them, because the level
formula sees only rank and near-distractor count. Dkaattae approved
(2026-10-27) a person-approved `familiarity_bonus` entry for the two states
drawn apart from the mainland; this task lands that entry alone, regenerates
the bank, and writes it into E-22. The largest-city entry needs a Census check
this environment cannot reach, so it is split out to T-085b (Dkaattae,
2026-10-29).

## Already true, and what remains

- **Already true.** The `familiarity_bonus` term exists in the formula and in
  `LEVEL_SEED_WEIGHTS` (`question-bank/src/seed-level.ts:68`), as a single
  scalar `0` subtracted in `levelFor` (`seed-level.ts:221`) from every
  question. `levelFor` receives the question, so it can see `templateId` and
  `entityId`. The clamp to 0–18 exists (`seed-level.ts:222`). `levelFor` and
  `nearDistractorCount` are already unexported (E-22, T-086). `ageBand` comes
  from the template's `min_age_band` (`tags.ts`), not from the level, so it
  does not move.
- **Baseline levels** ("before": `question-bank/data/questions/us-states.json`
  at `5ae564a`, which is `origin/main` and this branch's merge base; read by the
  expander). 415 questions; levels run 3 to 10. Every HI and AK question:

  | Template | HI | AK |
  |---|---|---|
  | `tpl-identify-on-map` | 6.5 | 6 |
  | `tpl-click-the-map` | 7.5 | 7 |
  | `tpl-climate-of` | 9.5 | 8 |
  | `tpl-capital-of` | 8.5 | 8 |
  | `tpl-biggest-state` | 8.5 | 7 |
  | `tpl-state-animal-of` | 8.5 | 8 |
  | `tpl-landmark-in` | 8.5 | 8 |
  | `tpl-crop-of` | 8.5 | 7 |

- **Probably already true after the change, but checked anyway (criterion
  18).** E-22's range sentences: the lowest map level is 3.5 (CA, TX), and HI's
  4.5 and AK's 4 stay above it. The highest stays 10. The climate levels 7.5 and
  6 stay inside the 3–10 range of the 265 T-026 levels.
- **Remains.** The per-state, per-template entry, both committed files
  regenerated, and E-22 amended.

## Acceptance criteria

"The bank" below means `seedLevels` applied to the committed entities in
`question-bank/data/us-states/` with the default templates, which is what
`question-bank/data/questions/us-states.json` is generated from. "Before" means
the levels on `origin/main` at `5ae564a` (the table above).

**Drawn apart from the mainland**

1. In the bank, each of these six questions has a level exactly 2 lower than
   before: `gen:tpl-identify-on-map:us-state-hi` 4.5,
   `gen:tpl-click-the-map:us-state-hi` 5.5, `gen:tpl-climate-of:us-state-hi`
   7.5, `gen:tpl-identify-on-map:us-state-ak` 4,
   `gen:tpl-click-the-map:us-state-ak` 5, `gen:tpl-climate-of:us-state-ak` 6.
2. Every HI and AK question of the other five templates (`tpl-capital-of`,
   `tpl-biggest-state`, `tpl-state-animal-of`, `tpl-landmark-in`,
   `tpl-crop-of`) has exactly its before level in the bank; in particular
   `gen:tpl-capital-of:us-state-hi` stays 8.5 and
   `gen:tpl-capital-of:us-state-ak` stays 8.
3. No question about any of the other 48 states changes level, on any template.
4. On a synthetic input, the reduction follows the entity, not the bank: a
   `tpl-identify-on-map` question whose entity is `us-state-hi` gets a level 2
   lower than the same question whose entity is an otherwise identical entity
   with a different id; and a question on a template outside the three of
   criterion 1 gets no reduction for `us-state-hi` or `us-state-ak`.

**The largest-city half is not landed**

5. Every `tpl-capital-of` question in the bank has exactly its before level
   (all 50).
6. `LEVEL_SEED_WEIGHTS` names no state id other than `us-state-hi` and
   `us-state-ak`, and names no capital or city: no unconfirmed largest-city
   membership ships, not even at a reduction of 0.

**The clamp and the module**

7. The clamp holds under the new input, on both sides of 0: on a synthetic
   input, a drawn-apart question whose level before the reduction is exactly 2
   gets 0; one whose level before the reduction is 1.5 gets 0, not -0.5; and
   one at 2.5 gets 0.5.
8. No level in the bank is below 0 or above 18.
9. `seedLevels` is still pure and deterministic: called twice on the same
   inputs it returns deep-equal results, and it mutates neither its
   `questions`, `entities` nor `templates` arguments.
10. The amount, the two state ids and the three template ids are all read from
    `LEVEL_SEED_WEIGHTS`: overriding the constant in place (as T-025 did) so
    the drawn-apart amount is 0 gives back exactly the before levels for all
    415 questions; and overriding it so the amount is 3 gives the six
    questions of criterion 1 a level exactly 3 below before, and changes no
    other question.
11. `question-bank/src/seed-level.ts` exports exactly what it exports now:
    `seedLevels`, `LEVEL_SEED_WEIGHTS`, `LEVEL_MIN`, `LEVEL_MAX`,
    `LevelSeedWeights`, `LeveledQuestion`. `levelFor` and
    `nearDistractorCount` stay unexported.

**Everything else holds still**

12. Every question in the bank other than the six of criterion 1 has exactly
    its before level (409 questions).
13. No question's fields other than `level` change, in the question file or in
    `content.json`.

**The committed files**

14. `question-bank/data/questions/us-states.json` equals what
    `cd question-bank && bun run ./src/write-questions.ts` writes from the
    committed tree (byte-identical), and carries the levels of criteria 1
    and 12.
15. `backend/app/data/content.json` equals what `make -C backend content`
    writes from the committed tree, and each served question's `level` equals
    the same question's level in the question file.
16. No file under `question-bank/data/us-states/` changes. No entity gains a
    field.

**E-22**

17. E-22 (`engineering-decisions.md`) has a new dated paragraph,
    `2026-10-29 (T-085a)` or the date it lands, that states the drawn-apart
    input: its amount (2), the two states (Hawaii, Alaska), the three templates
    (`tpl-identify-on-map`, `tpl-click-the-map`, `tpl-climate-of`), and that the
    list was approved by Dkaattae on 2026-10-27.
18. E-22's statements about the range of levels over the committed bank (the
    "150 levels run from … to …" and "265 new levels run from … to …"
    sentences, and the states named at each end) are true of the regenerated
    bank, or carry a dated note giving the new range and states.
19. E-22 has a table of every question whose level changed, one row each (six
    rows), with its id, the before level and the after level, and those values
    equal the bank's.
20. E-22 says the largest-city input is not landed and names T-085b as where
    it is decided; and no sentence or heading in E-22 still says
    `familiarity_bonus` is 0 for every question, that it is 0 because no
    reviewed list exists, or that whether it is set is T-085's question.
21. Every key and numeric leaf of `LEVEL_SEED_WEIGHTS` appears in E-22's
    "constant, as the code spells it" block with its value.
22. E-22's T-025 hand-check table (the 30 rows under "T-025 hand-check of 30
    questions") is unchanged, as is every `E-n` entry other than E-22.

**Negative**

23. No new dependency: the three `package.json` files, `bun.lock` files,
    `backend/pyproject.toml` and `backend/uv.lock` are unchanged.
24. No test reaches the network.
25. `openapi.yaml` is unchanged.

## Out of scope

- **The largest-city input, all of it** (the 17 capitals, the Census check,
  Rhode Island's accepted risk). That is T-085b in `tasks.md`. Do not add a
  placeholder for it (criterion 6), and do not write the RI risk into E-22.
- **Tuning the amount.** The queue says the amounts "are a first guess the
  task may tune". This brief pins the approved −2, because a criterion whose
  expected value the worker may choose is not a criterion. If the worker finds
  a reason to tune, it says so in Notes and the change comes back through the
  expander for a fresh approval.
- **How two familiarity inputs combine.** Only one exists after this task. Do
  not add a test that pins stacking either way; T-085b decides it.
- **The fact-field option** (a new entity field "drawn apart"). Not chosen. No
  entity schema change, no Wikidata query change, no `normalize.ts` change.
- **A player's home state** as a familiarity source. That is serving-time, not
  a seeded level (E-22).
- **The other `too hard` rows** of E-26 and E-27 (California's climate, NY and
  RI climate), the capital rows for Denver and Honolulu (T-085b), and the
  climate distractor rules (T-091).
- **Rewriting history.** E-26's and E-27's tables, which quote the old HI/AK
  levels as measured on their dates, stay as they are. So does T-025's table.
- **Selection, the level window, and serving** (`backend/app/`, E-10, E-28),
  other than regenerating `content.json`.
- **Elo** (plan §1.4).
- **Making the regeneration a script** (T-087) and **re-pinning the bank
  guards for refreshes** (T-095).

## Constraints

- **Files expected to change:** `question-bank/src/seed-level.ts`,
  `question-bank/data/questions/us-states.json`,
  `backend/app/data/content.json`, `engineering-decisions.md` (E-22 only), new
  test files, and the brief.
- **Invariant (E-22): every number the computation uses lives in
  `LEVEL_SEED_WEIGHTS`**, and the module stays pure: no network, no file, no
  clock, no randomness. The per-state membership and the template list are data
  the computation uses, so they live there too.
- **No outside source is needed.** HI and AK membership was approved by a
  person on 2026-10-27; it is not a population figure and needs no Census
  check.
- **The constant's shape meets an existing rule.** `seed-level.test.ts`
  ("one E-22 heading, and every key and numeric value of LEVEL_SEED_WEIGHTS in
  it") checks numbers, arrays and one level of object nesting against E-22's
  text. A deeper nested shape may turn it red. Either keep a shape it can read,
  or list it under **Tests made stale**; do not edit it.
- **Existing tests will go red by design, and the worker does not touch them.**
  The queue entry lists the known ones: `hand-check-levels-verify.test.ts`
  (criteria 4, 7, 8, 10, 10a, 12, 14), `seed-level-verify.test.ts` (criteria
  18, probably 20), `seed-level-loose-ends-verify.test.ts` (criteria 1–8, 10,
  12, and the E-22 heading pin at line 66), the T-089 and T-092 verify tests
  that pin E-1..E-28 byte for byte, `climate-far-phrases-verify.test.ts`
  (`LEVEL_SEED_WEIGHTS` sha and the `content.json` digest),
  `bank-pins.ts` / `BANK_DIGESTS` over the question file, and
  `highest-point-metres-verify.test.ts` if it hashes the question file. The
  worker lists every one it finds under **Tests made stale**; the tester raises
  the Test change request (D-14, D-15). **This task will halt at the tester
  for a person.**
- **Regeneration commands:** `cd question-bank && bun run ./src/write-questions.ts`,
  then `make -C backend content`. Run both, in that order, and commit both
  files.
- **Dependencies:** none (`CLAUDE.md`, "Packages").
- **Model:** Opus. Data correctness, and many pinned tests to account for.

## Context

**Required reading for the worker and the tester.**

- `tasks.md` T-085 (T-085a) — the approved HI/AK list and the option chosen —
  and T-085b, to know what is deliberately left out.
- `engineering-decisions.md` **E-22** in full (the formula, the constant block,
  "Why `familiarity_bonus` is 0", "What the module exports", the range
  sentences, the T-025 hand-check table, "What the reading found the formula
  cannot express", and its **Revisit when**).
- `engineering-decisions.md` **E-26** table D and **E-27** table D, for the
  `tpl-climate-of` HI and AK rows that make six served rows, not four.
- `engineering-decisions.md` **E-24** — the question file and `content.json`
  are committed and regenerated by hand.
- `geoquizdataplan.md` **§1.4** — the level formula, "very famous" entities as
  a familiarity source, and Elo later.
- `question-bank/src/seed-level.ts` — `LEVEL_SEED_WEIGHTS` (line 29),
  `levelFor` (line 206), `seedLevels` (line 235).
- `question-bank/src/seed-level.test.ts:182` — the constant-in-E-22 rule.
- `question-bank/src/question-file.ts:44` — where `seedLevels` runs in the
  pipeline; `question-bank/src/write-questions.ts`.
- `backend/app/content_build.py`, `backend/Makefile` target `content`.
- The tests named under Constraints, to know what will go red and why.
- `test-guidelines.md` — call `seedLevels` directly; no seam needed, no
  network.
- `CLAUDE.md` "Content rules".

## Review checklist

The criteria are testable. A person checks the one judgement a test cannot:

- [ ] Hawaii at 4.5 / 5.5 / 7.5 and Alaska at 4 / 5 / 6 read as about right for
      a seven-to-ten-year-old next to their neighbours in the bank (for
      example Florida's and California's map questions).

## Handoff

**TL;DR: blocked before building. No U.S. Census Bureau host is reachable from
this session (the proxy refuses every one with a 403), and the brief's
Constraints say to stop rather than fill the 17-capital table from memory. A
human must either open Census access or choose another source, then re-run
`worker`.**

**What I could not reach** (2026-10-29, through the session's agent proxy;
`curl -sS "$HTTPS_PROXY/__agentproxy/status"` logs each one as
`connect_rejected`, "gateway answered 403 to CONNECT"):

- `https://api.census.gov/` (PEP API)
- `https://www.census.gov/`
- `https://data.census.gov/`
- `https://www2.census.gov/` (the popest city totals datasets)

**What is reachable:** `en.wikipedia.org` and `query.wikidata.org`. Neither is
a Census Bureau release, so I did not use either as the source. I made one
probe query to see what Wikidata would give (P1082 with references, Memphis
and Nashville). Its references are uneven: Memphis 633,104 at 2020-04-01
cites "2020 United States Census", but Nashville 689,447 dated 2020-01-01 has
no `stated in` and links only to a census.gov search page. That would be a
secondary transcription with patchy provenance, which criterion 7 does not
obviously allow.

**What the human needs to decide (proposed owner: Dkaattae):**

1. **Allow `*.census.gov` for the worker session** (preferred). Then a fresh
   `worker` fetches one release, for example Vintage 2023 or 2024 Population
   Estimates for incorporated places (SUB-IP-EST), and builds the task as
   briefed. Or:
2. **Supply the 17 rows by hand from one named release.** For each state:
   capital, its population, the largest other city and its population. Commit
   them to the brief's Notes and the worker transcribes them. Or:
3. **Accept Wikidata P1082 statements whose reference is a named Census
   release** as the source. This changes how criterion 7 is read, so it goes
   back to `task-expander` for re-approval, not to the worker.

**What changed:** nothing in code or data. The only file touched is this brief
(Status, Next step, Sessions row, Handoff, Notes).

**What I deliberately did not do:**

- **Did not land the drawn-apart half alone.** It needs no external source, but
  the brief is one unit: criteria 10, 15, 16, 20 and 22 describe one
  regenerated bank with both inputs. Landing half would mean regenerating the
  committed files twice and churning the stale-test list twice. If the human
  would rather split it, the split is: T-085a, drawn-apart (criteria 1–3 and
  the HI/AK rows of 10–24); T-085b, largest-city (criteria 4–9). Expander to
  decide.
- **Did not fill any of the 17 rows from general knowledge, and did not mark
  all 17 left out**, as the Constraints require.

**Survey, for the next worker (all still true at `d698b23`):**

- `question-bank/src/seed-level.ts:68` has `familiarity_bonus: 0`, a scalar.
  `levelFor` (line 206) subtracts it at line 221 and receives the question,
  so it can see `templateId` and `entityId`. The planned shape: make
  `familiarity_bonus` an object in `LEVEL_SEED_WEIGHTS`:
  `{ drawn_apart: { amount: 2, states: [...], templates: [...] }, capital_is_largest_city: { amount: 1, states: [...confirmed], templates: ['tpl-capital-of'] } }`.
  `levelFor` then sums the matching amounts before the clamp. Criterion 23's
  existing rule needs every numeric leaf named in E-22's constant block.
- **Exports**: still the six of criterion 14.
- **Tests made stale**: not applicable, since nothing was built. The brief's
  Constraints list is the starting point for whoever builds it.

**How to run:** nothing to run. The suite is untouched by this session.

## Verdict

## Notes

- **Worker, 2026-10-29.** The Census check is the only part that needs the
  outside world, and the environment blocks exactly that. The brief anticipated
  this case and named the response, so I am stopping as it says. Worth adding
  to the queue's environment notes: the web harness's egress policy does not
  include `census.gov`. Any future task that cites a Census figure will hit the
  same wall. Proposed owner: Dkaattae, as a `process-tasks.md` entry or an
  allowlist change.
- The Sessions table shows the same session id for expander and worker. That is
  what `$CLAUDE_CODE_REMOTE_SESSION_ID` returned. The orchestrator relay may be
  sharing the id across spawned roles. Orchestrator to check, because the tester
  relies on that table to confirm it is a different session.

- **Task-expander, 2026-10-29 (split).** Dkaattae chose the worker's proposed
  split. This brief is now T-085a, drawn-apart only; the criteria were
  rewritten and renumbered (25 instead of 27), so `Approved:` is back to
  `pending`. The **Handoff** above is the worker's round-1 report on the unsplit
  brief; its Census block does not apply to T-085a, and the next worker
  replaces it. The largest-city half, its approved list, the Census blocker and
  the RI accepted-risk record are now `tasks.md` T-085b.
