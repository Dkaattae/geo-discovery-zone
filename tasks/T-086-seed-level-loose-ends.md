# T-086 — `seed-level.ts` and E-22 loose ends after T-025

**Status:** `awaiting approval`
**Next step:** `worker` (after a human approves below)
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-086
**Branch:** `claude/wonderful-heisenberg-0ekakv`. The orchestrator assigned this
branch, and this line is the authority for every later role (`process.md`, "When
the environment names the branch for you").
**PR:** opened draft at expand time, built from the branch above. Number recorded
in the expander's handback and on the PR itself. It stays draft until the reviewer
approves it.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-16 | cse_01H1X3vo49b7U5nujJi7mYCb |

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

## Verdict

## Notes
