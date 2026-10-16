# T-086 — `seed-level.ts` and E-22 loose ends after T-025

**Status:** `approved — ready for a person to merge`
**Next step:** `human` merges PR #86 (inside the envelope; no escalation)
**Approved:** orchestrator — 2026-10-16, unattended run. See `runs/T-086-seed-level-loose-ends.md`.
**Test changes:** `approved — Dkaattae, 2026-10-16`
**From:** [`tasks.md`](../tasks.md) T-086
**Branch:** `claude/wonderful-heisenberg-0ekakv`. The orchestrator assigned this
branch, and this line is the authority for every later role (`process.md`, "When
the environment names the branch for you").
**PR:** #86, opened draft at expand time, built from the branch above. It stays
draft until the reviewer approves it.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-16 | cse_01H1X3vo49b7U5nujJi7mYCb |
| worker | 2026-10-16 | cse_01H1X3vo49b7U5nujJi7mYCb (same value as the expander's: `$CLAUDE_CODE_REMOTE_SESSION_ID` reports the orchestrating session to every subagent it spawns, so it cannot tell roles apart in this run) |
| tester | 2026-10-16 | cse_01H1X3vo49b7U5nujJi7mYCb (orchestrated: same id as every role; independence rests on being a freshly spawned subagent, not on a separate session) |
| tester (attended, test change request) | 2026-10-16 | cse_014vmM26fHC8f62WKpRdPnGD (a separate session, started by a person; not listed under any other role) |
| reviewer | 2026-10-16 | cse_01H1X3vo49b7U5nujJi7mYCb (orchestrated: same id as every role, `P-14`) |

**Worker model:** Sonnet is enough. This is a documentation correction plus one
small keep-or-drop call about unused exports; nothing here changes a level, a
question or a child-facing string.

**Not a light brief.** The task is sized S, but its criteria run past four
(`process.md`, "The light path"), so the full template is used.

**Plan to attend the tester step if the worker drops anything.** Dropping the
`weights` parameter or either export turns pre-existing tests red by design (see
Constraints). Those go through a Test change request, which only a person in the
tester's own session can approve (D-14, D-15). Keeping all three needs no test
change at all.

## Goal

T-025 left three things in `question-bank/src/seed-level.ts` and
`engineering-decisions.md` E-22 that it was not allowed to touch: an API surface
nobody uses, a "Revisit when" trigger that has already fired, and a band
paragraph that is less exact than it reads. Settling them makes E-22 true again
before T-085 or T-026 build on it.

## Survey: what is already true

Read at `41811f9` (the default branch when this brief was written).

- **`levelFor` and `nearDistractorCount` have no importer anywhere.** The only
  caller of either is inside `seed-level.ts`: `seedLevels` calls `levelFor`
  (`seed-level.ts:223`) and `levelFor` calls `nearDistractorCount`
  (`seed-level.ts:177`). No source or test file imports either. The only other
  mention is `hand-check-levels-verify.test.ts:472-473`, which pins their
  signatures as **strings**.
- **No caller passes `weights` to `levelFor`.** `seedLevels` calls it with four
  arguments (`seed-level.ts:223`). T-025's hand-check did not use the parameter
  either: `hand-check-levels-verify.test.ts:78` `withWeights` mutates
  `LEVEL_SEED_WEIGHTS` in place and restores it.
- **E-22's "Revisit when" still lists T-025 as a future trigger**:
  "**Revisit when** T-025 hand-checks 30 questions and the ordering looks wrong,
  …" (`engineering-decisions.md`, the E-22 paragraph beginning `**Revisit when**`,
  line 1113 at `41811f9`). T-025 ran on 2026-10-16 (PR #85), found six rows
  `too hard` that no weight could fix, and T-085 is the follow-up.
- **A second stale T-025 future reference, not named in the queue entry.** E-22's
  "Why `familiarity_bonus` is 0" bullet ends "The term stays in the formula and
  the constant so T-025 can set it." T-025 did not set it, and E-22's own
  hand-check record says why (a list needs a person's approval). The entry's
  **Done when** is "E-22 is true", so this is in scope (criterion 6).
- **The queue entry's premise about the band is half right.** Under plan §1.4,
  level 3.5 is `grade = floor(3.5 / 2) = 1` and `band = 3.5 - 2 = 1.5`. The
  entry calls that "between medium and hard". But the app's label functions,
  `backend/app/levels.py` `band_label` and `frontend/src/lib/level.ts`
  `bandLabel`, both return `"Medium"` for `band < 1.5` and `"Hard"` otherwise.
  So the app **renders level 3.5 as "1st grade · Hard"**, and E-22's
  "1st grade (hard)" matches what a child would see. What the paragraph does not
  say is that 3.5 sits exactly on the Medium/Hard boundary: band 1.5. Criteria 7
  and 8 ask for that, and do not ask the worker to call it "medium".
  Level 10 is grade 5, band 0, "Easy" in both label functions. E-22's
  "5th grade (easy)" is already accurate.
- **Tests that read E-22's prose and must keep passing:**
  - `hand-check-levels-verify.test.ts` criterion 9 (around line 436): the band
    paragraph (the one paragraph matching `**The band`) is 1–5 sentences, one
    sentence contains "<grade 1> … to … <grade 5>" (`1st grade` or `grade 1`,
    `5th grade` or `grade 5`), and the paragraph contains `floor(level / 2)`,
    `floor(<number> / 2)` or `§1.4`.
  - `seed-level-verify.test.ts` criterion 21 (around line 611): E-22 contains
    `Revisit when`, `home state`, `famous`, `near`, `far`, `borders`, `region`,
    `missing rank`, the five formula terms, `seedLevels` and
    `LEVEL_SEED_WEIGHTS`, and every key of the constant with its value on one
    line.
  - `seed-level.test.ts` "E-22 records the constant" (line 180).
  - `hand-check-levels-verify.test.ts` reads the T-025 hand-check table inside
    E-22 row by row.

## Acceptance criteria

**Frozen once approved.** They change only by going back through `task-expander`
for a fresh approval.

"E-22" below means the text of `engineering-decisions.md` from the line starting
`## E-22 ` up to, not including, the next line starting `## `. It includes the
`### T-025 hand-check of 30 questions` subsection.

**The unused API: decided and recorded**

1. E-22 states, for **`levelFor`'s `weights` parameter**, whether it is kept or
   removed. If kept, the same passage gives a reason that names a use: a caller
   in this repository, or a queued task by id (`T-0xx`) that will call it with
   that argument. The signature pin in `hand-check-levels-verify.test.ts`
   criterion 10 does **not** count as a use, and neither does "harmless" or
   "might be useful".
2. E-22 states, for **the `export` on `levelFor`**, whether it is kept or
   removed, under the same rule for a reason as criterion 1.
3. E-22 states, for **the `export` on `nearDistractorCount`**, whether it is
   kept or removed, under the same rule for a reason as criterion 1.
4. `question-bank/src/seed-level.ts` matches what E-22 says for each of the
   three:
   - **removed parameter** → `levelFor` declares no parameter after `entities`;
   - **removed export** → the function still exists if `seedLevels` still needs
     it, but its declaration does not begin with `export`, and no other module
     imports it;
   - **kept** → the declaration is unchanged from `41811f9`.

**"Revisit when"**

5. E-22 has exactly one paragraph beginning `**Revisit when**`. It does not
   contain the words "T-025 hand-checks 30 questions", and it presents no T-025
   work as still to come. It names **T-085** as the follow-up for the inputs the
   weights cannot reach. It still names each of the three other triggers it has
   at `41811f9`:
   - a world-scope bank;
   - a player profile carrying a home state;
   - Elo ratings replacing seeded levels (plan §1.4).
6. E-22 contains no sentence that says T-025 will, or can still, set
   `familiarity_bonus`. The sentence "The term stays in the formula and the
   constant so T-025 can set it." is gone or reworded. The bullet still says why
   `familiarity_bonus` is 0, still contains `home state` and `famous`, and still
   says the term stays in the formula and the constant.

**The band paragraph**

7. E-22's band paragraph (the one paragraph containing `**The band`) states that
   level 3.5 is **band 1.5** under plan §1.4. The figure `1.5` appears in the
   paragraph, tied to 3.5, either as band 1.5 or as the arithmetic
   `3.5 - 2 = 1.5` or `3.5 - 2 * 1 = 1.5`.
8. In that paragraph, every band word (easy, medium, hard, in any case)
   attached to a level matches what `band_label` in `backend/app/levels.py`
   returns for that level: **"Hard" for 3.5** and **"Easy" for 10**. The
   paragraph does not call level 3.5 "medium" or "easy", and does not call
   level 10 "medium" or "hard". Saying that 3.5 sits on the Medium/Hard
   boundary is allowed.
9. The band paragraph still passes `hand-check-levels-verify.test.ts` criterion
   9 as committed at `41811f9`:
   - 1 to 5 sentences;
   - one sentence that names grade 1 then "to" then grade 5;
   - contains `floor(level / 2)`, `floor(<number> / 2)` or `§1.4`.

**What must not move**

10. Every one of the 150 questions `seedLevels` returns over the committed bank
    has the same `level`, by question id, as at `41811f9`.
    `LEVEL_SEED_WEIGHTS` is deep-equal to its value at `41811f9`.
11. E-22's `### T-025 hand-check of 30 questions` table, the 30 rows under the
    header with a `Template` column, is byte-identical to `41811f9`.
12. `engineering-decisions.md` changes only inside E-22. Every other `## E-n`
    entry is byte-identical to `41811f9`, no `## E-n` heading is added or
    removed, and E-22's heading line is unchanged.
13. The diff against `41811f9`, outside `tasks/`, `tasks.md` and `PROGRESS.md`,
    touches only `engineering-decisions.md`, `question-bank/src/seed-level.ts`
    and test files under `question-bank/src/`. No `package.json`, lockfile,
    `pyproject.toml`, `openapi.yaml`, plan, backend or frontend file changes.
    No dependency is added.
14. The whole suite is green:
    - `cd question-bank && bun test`, `bun run typecheck`, `bun run lint` and
      `bun run format:check`;
    - `cd frontend && bun test`;
    - `make -C backend test`.

    A test that existed at `41811f9` is deleted or modified **only** through a
    Test change request row that a person approved in the tester's session
    (D-14, D-15). Criterion 14 is not met by editing such a test without one.

## Out of scope

- **T-085.** No new formula input, no fact field, no `familiarity_bonus` list,
  no weight change. Criterion 5 only names T-085 as the follow-up.
- **Any change to a level, a template, a weight or the bank.**
- **`seedLevels`'s signature and behaviour**, including its `templates` default.
- **The T-025 hand-check record**: its table, the "Which weights changed",
  "Weights tried and not adopted", "What the reading found" and "Map questions
  and the near-distractor term" paragraphs. They are a dated record and stay as
  written.
- **E-22's "option not taken" paragraph** ("easier for T-025 to tune by reading
  30 questions"). It gives T-023's reasoning at the time, not a pending trigger.
  Leave it.
- **`seed-level.ts`'s header comment** ("so T-025 can tune it in one place",
  line 15). It is not E-22, and the queue entry does not name it. Change it only
  if the file is being edited anyway for criterion 4. Either way it is not
  checked.
- **The label functions** in `backend/app/levels.py` and
  `frontend/src/lib/level.ts`, including where the 1.5 boundary falls. They are
  read as the reference for criterion 8, not changed.
- **`hand-check-levels-verify.test.ts`'s wider pins** (T-070's concern): only
  the rows this task's own change makes stale, and only through a Test change
  request.
- **Plan §1.4.** Its band arithmetic is correct and stays as it is.

## Constraints

- **Files expected to change:** `engineering-decisions.md`, inside E-22 only.
  `question-bank/src/seed-level.ts` only if criterion 1, 2 or 3 records a
  removal.
- **Tests this will turn red if anything is removed** (none if all three are
  kept). The worker lists them under **Tests made stale** and does not touch
  them:
  - `hand-check-levels-verify.test.ts` › "criterion 10: exported names and
    function signatures of seed-level.ts equal aa88101's". Its
    `AA88101_EXPORT_SIGNATURES` pins both exports and the `weights` parameter.
  - `hand-check-levels-verify.test.ts` › "criterion 12: no famous / familiar /
    well-known list under src/ beyond what aa88101 had". Its `BASELINE` contains
    the line `seed-level.ts:weights.familiarity_bonus;` from inside `levelFor`.
    Removing the `weights` parameter changes or removes that line.
- **A new test may be added; an existing one may not be weakened.** A modified
  criterion-10 pin must still pin every remaining export's exact signature.
- **E-22 prose is engineering text, not child-facing text.** Nothing here
  reaches a question, a prompt or the app.
- **Dependencies:** none (see [`CLAUDE.md`](../CLAUDE.md)).
- **No new `E-n` entry.** This corrects E-22 in place; a dated line inside E-22
  saying what T-086 changed is welcome but not required.

## Context

**Required reading for the worker and the tester.**

- `engineering-decisions.md` **E-22** in full, including the
  `### T-025 hand-check of 30 questions` subsection.
- `question-bank/src/seed-level.ts`: all of it. It is 225 lines.
- `question-bank/src/hand-check-levels-verify.test.ts`:
  - `withWeights` (line 78);
  - `e22()` (line 101);
  - criterion 9 (around line 436);
  - criteria 10 and 12 (lines 465–575).
- `question-bank/src/seed-level-verify.test.ts` criterion 21 (around line 611),
  and `question-bank/src/seed-level.test.ts` "E-22 records the constant"
  (line 180).
- `geoquizdataplan.md` **§1.4**: `grade = floor(level / 2)`,
  `band = level - 2*grade`.
- `backend/app/levels.py` `band_label` and `frontend/src/lib/level.ts`
  `bandLabel`: the app's rendering of a band, which criterion 8 is checked
  against.
- `tasks.md` **T-085**, which criterion 5 points at.
- `process.md` step 4, "Stale or wrong tests go through the tester", and
  `.claude/agents/tester.md`, if anything is removed.

## Handoff

**TL;DR:** all three unused API pieces are **removed** (no use exists that the
criteria would accept), E-22 is corrected in place, and levels are unchanged.
**One** pre-existing test is red by design (criterion 10 signature pin, below).
It needs a Test change request approved by a person in the tester's session.

**What changed, file by file**

- `question-bank/src/seed-level.ts`
  - `nearDistractorCount`: `export` dropped; body unchanged.
  - `levelFor`: `export` and the `weights` parameter dropped. The first line of
    the body is `const weights = LEVEL_SEED_WEIGHTS;`, so the rest of the body,
    including the `weights.familiarity_bonus;` line, is byte-identical. That
    keeps `hand-check-levels-verify.test.ts` criterion 12's baseline green, and
    `withWeights` (which mutates the constant in place) still works.
  - Header comment line 15: "so T-025 can tune it in one place" → "so it is
    tuned in one place" (allowed by Out of scope, since the file was edited
    anyway; not checked).
- `engineering-decisions.md`, inside E-22 only:
  - `familiarity_bonus` bullet: "so T-025 can set it" reworded; still says the
    term stays in the formula and the constant, and points at T-085.
  - New bullet **"What the module exports"** recording the three removals.
  - **Revisit when**: the T-025 trigger is replaced by T-085; world-scope bank,
    home-state profile and Elo triggers kept verbatim.
  - **The band** paragraph: one clause appended to the second sentence, giving
    `3.5 - 2 = 1.5`, the Medium/Hard boundary, and that the app renders it as
    Hard. Still 2 sentences.

**Where each criterion lives**

| # | Where |
|---|---|
| 1–3 | E-22 bullet "What the module exports": each of the three marked **removed**, with the reason |
| 4 | `seed-level.ts` `levelFor` (no param after `entities`, no `export`), `nearDistractorCount` (no `export`); `grep -rn "levelFor\|nearDistractorCount" --include=*.ts .` finds only `seed-level.ts` and the test's string pins |
| 5 | E-22 `**Revisit when**` paragraph (the only one) |
| 6 | E-22 bullet "Why `familiarity_bonus` is 0" |
| 7–8 | E-22 `**The band.**` paragraph; checked against `backend/app/levels.py:35` `band_label` (`band < 1.5` → Medium, else Hard) and `frontend/src/lib/level.ts:20` |
| 9 | `hand-check-levels-verify.test.ts` criterion 9 passes |
| 10 | `hand-check-levels-verify.test.ts` criteria 4/7/8/10a (levels by id, constant values) all pass; `LEVEL_SEED_WEIGHTS` untouched |
| 11 | The hand-check table is not in the diff |
| 12 | `git diff 41811f9 -- engineering-decisions.md` has three hunks, all between `## E-22 ` and `## E-23` |
| 13 | `git diff --stat 41811f9` outside `tasks/` and `tasks.md`: `engineering-decisions.md`, `seed-level.ts`, and `runs/T-086-seed-level-loose-ends.md`. The `runs/` file is the orchestrator's run log, not worker output; criterion 13's exception list does not name `runs/`, so **tester to judge** whether that counts (it is process record, not code) |
| 14 | See "Suite" below |

**Tests made stale**

- `question-bank/src/hand-check-levels-verify.test.ts` › `T-025 criteria 10-13:
  what must still hold` › `criterion 10: exported names and function signatures
  of seed-level.ts equal aa88101's`.
  - **Stale because** criteria 1–3/4: `AA88101_EXPORT_SIGNATURES` pins
    `export function nearDistractorCount(…)` and `export function levelFor(…,
    weights: LevelSeedWeights = LEVEL_SEED_WEIGHTS, )`, which are no longer
    exports.
  - **Proposed:** modify, not delete: remove those two entries from
    `AA88101_EXPORT_SIGNATURES` (leaving the other six exact signatures pinned,
    as the brief's Constraints require), and note in a comment that T-086
    removed them per E-22. Optionally add a new test that `levelFor` and
    `nearDistractorCount` are not exported and `levelFor` has four parameters.
  - No count floor is affected.
- **Not stale:** criterion 12's `BASELINE` line `seed-level.ts:weights.familiarity_bonus;`
  still matches (see the local-const choice above).

**Suite (run on this branch)**

- `question-bank`: `bun test` 2211 pass, **1 fail** (the stale test above);
  `typecheck`, `lint` (0 warnings, 0 errors), `format:check` clean. Needed
  `bun install --frozen-lockfile` first; no lockfile change.
- `make -C backend test`: 537 passed, 9 skipped.
- `frontend`: `bun test` 375 pass, 1 fail. **Environment, not this change:**
  `bun install --frozen-lockfile` gets a 403 from the agent proxy on the
  `pkg.dev` registry (`d3-array`), so `react-simple-maps` is not installed and
  `UsMap.tsx` cannot load. This is the known 403 in `PROGRESS.md` (line ~876);
  no frontend file is touched. CI's frontend job is the check for criterion 14
  here. Note: one frontend lint test rewrote `frontend/README.md` with
  prettier while deps were half-installed; I reverted it, so watch for it.

**What I deliberately did not do**

- No change to `seedLevels`, weights, templates, the hand-check record, the
  "option not taken" paragraph, plan §1.4 or the label functions.
- Did not touch any pre-existing test (D-14).

## Test change request

Written by `tester` (D-14). Decided by a person in an attended tester session
(D-15) and applied in `T-086 tester: apply approved test change request`.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/hand-check-levels-verify.test.ts` › `T-025 criteria 10-13: what must still hold` › "criterion 10: exported names and function signatures of seed-level.ts equal aa88101's" | `236b0e0`, T-025 tester: pinned that T-025 changed no exported name or signature of `seed-level.ts` while tuning weights | Criteria 2, 3 and 4 of this brief: E-22 now records the `export` on `levelFor` and on `nearDistractorCount` as removed and `levelFor`'s `weights` parameter as removed, so `AA88101_EXPORT_SIGNATURES` entries 6 (`export function nearDistractorCount(…)`) and 7 (`export function levelFor(…, weights: LevelSeedWeights = LEVEL_SEED_WEIGHTS, )`) can no longer appear. Currently red: actual export list is the other six. | modify | Name: "criterion 10: exported names and function signatures of seed-level.ts equal aa88101's, less the two exports T-086 removed (E-22)". Asserts `exportSignatures()` `toEqual` exactly these six strings in this order, unchanged from today's pin: `export const LEVEL_SEED_WEIGHTS = {`, `export const LEVEL_MIN = 0;`, `export const LEVEL_MAX = 18;`, `export type LevelSeedWeights = typeof LEVEL_SEED_WEIGHTS;`, `export interface LeveledQuestion extends GeneratedQuestion {`, `export function seedLevels( questions: readonly GeneratedQuestion[], entities: readonly Entity[], templates: readonly Template[] = TEMPLATES, ): LeveledQuestion[] {`. A comment on the constant cites T-086 and this request. Still exact equality, so any added, removed or changed export still turns it red. (Non-export of `levelFor`/`nearDistractorCount` and `levelFor`'s four parameters are already pinned by the new `seed-level-loose-ends-verify.test.ts` criterion 4 tests.) | **approved** — Dkaattae, 2026-10-16, in attended tester session `cse_014vmM26fHC8f62WKpRdPnGD` (answer: "Approve row 1"). Applied as written. |

No count floor is affected. Criterion 12's `BASELINE` in the same file is **not** stale: it still passes (the worker kept the `weights.familiarity_bonus;` line via a local const).

## Verdict

### Attended tester, 2026-10-16: pass

**TL;DR: pass.** Dkaattae approved Test change request row 1 in this session;
it is applied exactly as written and the question-bank suite is green
(2235 pass, 0 fail). Every criterion 1–14 now holds. Next: `reviewer`.

- **Independence:** session `cse_014vmM26fHC8f62WKpRdPnGD` is a separate
  session a person started, not listed under task-expander or worker. The
  original verification below was done by the orchestrated tester.
- **Approval:** header reads `Test changes: approved — Dkaattae, 2026-10-16`.
  The person's words in this session: "Approve row 1"; name to record:
  "Dkaattae".
- **Test modified (the only one):** `question-bank/src/hand-check-levels-verify.test.ts`
  › `T-025 criteria 10-13: what must still hold` › criterion 10 signature pin.
  Renamed to "…equal aa88101's, less the two exports T-086 removed (E-22)";
  the `nearDistractorCount` and `levelFor` entries dropped from
  `AA88101_EXPORT_SIGNATURES`; the other six signatures unchanged and still
  exact-equal; comment cites T-086 and this request. Reason: criteria 2–4 remove
  those two exports. No test deleted; no count floor affected.
- **Mutation:** re-adding `export` on `levelFor` turns the modified test red
  (reverted).
- **Rows refused:** none.

| Check | Result |
|---|---|
| `question-bank` `bun test` | 2235 pass, 0 fail |
| `typecheck` / `lint` / `format:check` | clean / 0 warnings 0 errors / clean |
| `make -C backend test` | 537 passed, 9 skipped |
| `frontend` `bun test` | **not runnable here**: 369 pass, 7 fail, all `Cannot find package` (`@eslint/js`, `react/jsx-runtime`, …), deps uninstallable through the proxy (known 403, `PROGRESS.md`). No frontend file is in the diff; CI's frontend job on the previous head (`234aa65`) was green and is the check for this push. |
| CI before this push | only `question-bank` red, on exactly this one test |

Criterion 13's `runs/` note below stands for the reviewer to judge.

### Orchestrated tester (earlier)

**TL;DR: not yet a verdict — test changes requested.** Every criterion except
14's suite-green clause holds, verified by 23 new tests (all green, 6 mutations
each turned the matching test red). The suite has exactly one red test, the
stale criterion-10 signature pin above, which only a person can approve
changing. Next: a human starts an attended `tester` session for T-086.

**Independence:** orchestrated run (`runs/T-086-seed-level-loose-ends.md`
exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01H1X3vo49b7U5nujJi7mYCb`,
the same id listed as task-expander and worker, so the session check proves
nothing. My independence rests only on being a freshly spawned subagent with
its own context that did not see the work or the worker's reasoning; that
depends on the orchestrator having spawned me correctly, which I cannot verify.

**New test file:** `question-bank/src/seed-level-loose-ends-verify.test.ts`
(23 tests). Baselines at `41811f9` computed from a `git worktree` of
`41811f9` and embedded as sha256 digests (CI is shallow).

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | E-22 bullet records `weights` parameter **removed**; test "criterion 1" |
| 2 | met | `export` on `levelFor` **removed**; test "criterion 2" |
| 3 | met | `export` on `nearDistractorCount` **removed**; test "criterion 3" |
| 4 | met | `levelFor` params end at `entities`; neither declaration starts with `export`; neither is on the module namespace at runtime; no `.ts`/`.tsx` in `question-bank/` or `frontend/src` imports either |
| 5 | met | one `**Revisit when**` paragraph, names T-085, keeps world-scope / home state / Elo (§1.4), no T-025 future |
| 6 | met | old sentence gone; bullet keeps `home state`, `famous`, "term stays in the formula and the constant" |
| 7 | met | band paragraph: "level 3.5 is band `3.5 - 2 = 1.5`" |
| 8 | met | "1st grade (hard)", "5th grade (easy)", 3.5 "on the Medium/Hard boundary ... render as Hard"; matches `band_label` (`band < 1.5` → Medium, else Hard) |
| 9 | met | `hand-check-levels-verify.test.ts` criterion 9 (unchanged file) passes; mirrored in new test |
| 10 | met | 150 levels by id sha-equal to `41811f9`; `LEVEL_SEED_WEIGHTS` deep-equal |
| 11 | met | header + separator + 30 rows sha-equal to `41811f9` |
| 12 | met | file outside E-22's body sha-equal; heading unchanged; 23 `## E-n` headings |
| 13 | met, with a note | `git diff --stat 41811f9` outside `tasks/`, `tasks.md`, `PROGRESS.md`: `engineering-decisions.md`, `question-bank/src/seed-level.ts`, `runs/T-086-seed-level-loose-ends.md`, plus this tester's test file. The `runs/` file is the orchestrator's mandated run log (process.md), not task output; I read the criterion's intent (no code/dependency/contract change) as met. No package, lockfile, backend, frontend, plan or `openapi.yaml` change. Reviewer may overrule. |
| 14 | **not met yet** | see suite below |

**Suite (this branch, with my test file):**

- `question-bank` `bun test`: 2234 pass, **1 fail**: `hand-check-levels-verify.test.ts` › "criterion 10: exported names and function signatures of seed-level.ts equal aa88101's" (the stale pin; Test change request row 1). `typecheck`, `lint` (0/0), `format:check` clean.
- `make -C backend test`: 537 passed, 9 skipped.
- `frontend` `bun test`: 375 pass, 1 fail — `Cannot find package 'react-simple-maps'` from `UsMap.tsx`. Environment: the proxy 403 on `bun install` noted in `PROGRESS.md`; no frontend file is in the diff. Could not read PR CI (`gh` GraphQL 403); CI's frontend job is the check.

**Mutations (all reverted, `git status` clean apart from the new test file):**

- re-add `export` on `levelFor` → criterion 4 export test red
- re-add `weights` parameter to `levelFor` → criterion 4 parameter test red
- `concept_load["tpl-capital-of"]` 2 → 1 → both criterion 10 tests red
- restore `engineering-decisions.md` to `41811f9` → criteria 1–7 tests red (10 tests)
- "1st grade (hard)" → "1st grade (medium)" → both criterion 8 tests red
- insert a line into E-1 → criterion 12 outside-E-22 test red

**To finish:** an attended tester asks a person about row 1, applies it if
approved, reruns the whole suite, and records pass/fail.

## Notes

- **Keep or drop was decided by the criteria, not by taste.** Keeping any of
  the three needed a named caller or a queued task id that calls it. None
  exists: T-085 changes the formula's inputs but names no call to `levelFor`
  with alternate weights. So all three are removed. **Reviewer to confirm**, or
  send back to `task-expander` if T-085 is expected to want `levelFor` exported.
- **`const weights = LEVEL_SEED_WEIGHTS;` inside `levelFor`** rather than
  rewriting each `weights.` to `LEVEL_SEED_WEIGHTS.`: smaller diff, and it
  keeps criterion 12's baseline line, so one stale test instead of two.
  **Reviewer to confirm or overturn.**
- **The band paragraph keeps "1st grade (hard)"**, which was already right
  (the brief's survey caught that the queue entry's "between medium and hard"
  premise was half right). Only the band-1.5 arithmetic and boundary were
  added.
- **Session ids** in this run are the orchestrator's for every role, so the
  Sessions table cannot prove tester/worker separation here. **Orchestrator /
  process owner to note** in the run log; not this task's to fix.

## Review

**TL;DR: approve, inside the envelope.** The change is small, in the module's
own idiom, and E-22 is now true. One non-blocking finding: the tester's new
file adds more permanent digest pins, which P-17 and T-070 already own; both
amended, plus T-085's test cost. Next: a person merges PR #86.

- **Every role's work is in the PR.** Expander `146c64f`/`88b85d6`, worker
  `23b3227`, tester `4009ee5`/`a0bec65`/`f196d58`, orchestrator log commits.
- **Lanes held.** Expander touched only `tasks/` and `tasks.md`; tester touched
  only tests and the brief; the one pre-existing test modified (`a0bec65`) is
  exactly Test change request row 1, approved by Dkaattae (a person), and
  comes from a `tester` commit.
- **Suite rerun here:** question-bank 2235 pass / 0 fail, typecheck, lint,
  format:check clean.

**Worker flags, disposed**

- **Remove all three (param + two exports): confirmed.** T-085 changes the
  formula's inputs, which means editing `levelFor` in place; it needs neither
  an export nor an alternate-weights argument.
- **`const weights = LEVEL_SEED_WEIGHTS;` local alias: confirmed.** It keeps
  the body identical and matches the module's other helpers (`rankBucket`,
  `entityObscurity`), which take `weights: LevelSeedWeights`.
- **Band paragraph keeps "1st grade (hard)": confirmed.** Matches `band_label`.
- **Session ids:** already `P-14`; nothing new to file.
- **`runs/` under criterion 13: met.** `runs/` is the orchestrator's own lane
  (`process.md` roles table); it is process record, not task output.

**Finding 1 (non-blocking): new permanent pins.**
`question-bank/src/seed-level-loose-ends-verify.test.ts` criteria 10 and 12
pin the 150 levels, `LEVEL_SEED_WEIGHTS`, `engineering-decisions.md` outside
E-22 and the `## E-n` heading count (23) at `41811f9`. The first task to add
any `E-n` entry, or edit any entry but E-22, turns it red; T-085 and T-026
will too, via levels. Its criteria 1-8 also read E-22's prose (T-085 must keep
naming itself in "Revisit when", or request a change). This is the same
pattern P-17 describes, from the same kind of "nothing else moved" criterion.
Not a send-back: the tester encoded the criteria faithfully, and the fix is a
loop decision. **Amended:** P-17 (second instance, wider: the decisions log
itself), T-070 (a sixth guard), T-085 (test cost).

