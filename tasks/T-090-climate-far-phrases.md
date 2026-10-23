# T-090 — Climate wrong answers: Hawaii and Alaska in almost every question

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** Dkaattae — 2026-10-23, in the orchestrator session ("approved"). See `runs/T-090-climate-far-phrases.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-090
**Branch:** `claude/eloquent-ptolemy-gmsovo`
**PR:** #93, opened draft at expand time, built from the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-23 | cse_01RqMHVzQ4dzC6Q8EjTwWEZi |

**Worker model:** Opus. This changes what a child reads in 50 questions.

**Not the light path.** The task is sized S, but it changes distractor text a
child reads, so `process.md` "The light path" rules it out. Expect the reviewer
to escalate the result for a person to read (`process.md` step 6, the envelope).

## Goal

Hawaii's and Alaska's climate phrases are wrong answers in 47 of the 50 served
climate questions, and both are in 42 of them. A child who spots the island
phrase and the far-north phrase is left with a two-way pick. Cap them so each
climate question offers at most one, and add the group cap the queue entry
proposes. Then write down how the ten states E-26 read now look.

## What is already true, and what the survey found

- **Already true, and kept:** a climate wrong answer is never from the answer
  state's own group in `SAME_CLIMATE_GROUPS`. That is the exclusion in
  `exclusionFor`, `question-bank/src/distractors.ts:228-231`. The order is
  farthest first, one tier (`farthestFirst`, `distractors.ts:356-358`, and
  `byTierThenNearest`). Ties go to the smaller entity id.
- **Missing:** a cap on Hawaii's and Alaska's phrases. In the committed
  `question-bank/data/questions/us-states.json`, 42 climate questions offer
  both of them (E-26 section D).
- **The group cap changes nothing today.** No committed climate question
  takes all three wrong answers from one group. The cap is a guard only.
- **E-26's premise for California is wrong.** It says CA's three
  "cold snowy winters" answers are "three from one cold group". They are ME's,
  RI's and NH's phrases. ME and NH are Northern New England and RI is Southern
  New England, so that is two groups. CA's question also has neither HI's nor
  AK's phrase. **Under this task's rules CA's question does not change.** That
  is expected. A worker who sees it unchanged has not made a mistake, and the
  re-read (criterion 14) records it. A stricter rule, such as at most one per
  group, would change CA. Choosing one is a content call, so this brief does
  not make it (see Out of scope).

Per-question distractor states in the committed file, for reference (answer
state first, then the three wrong answers in choice order, answer omitted).
Derived from `climate_kid` text by hand while expanding, not by running
anything: AK: FL SC GA · CA: ME RI NH · HI: ME RI MA · most others: HI, AK and
one of CA, WA, ME, FL.

## Acceptance criteria

The **cap set** is the two entities `us-state-hi` and `us-state-ak`. A
**climate question** is any question `buildChoices` produces for a template
whose `distractor_strategy` is `climates_outside_group`. In the committed bank
that is only `tpl-climate-of`. A wrong answer **comes from** the entity whose
`climate_kid` it was taken from.

### The rule, through `buildChoices` (inline fixtures are enough)

1. **Hawaii and Alaska cap.** In every climate question, at most one of the
   three wrong answers comes from the cap set. This holds for every state's
   question, including HI's and AK's own: AK's question may offer HI's phrase
   and HI's question may offer AK's.
2. **Boundary of 1.** One wrong answer from the cap set is still allowed and
   still happens. Take a fixture where HI and AK are the two farthest eligible
   candidates. The question offers the farther of the two and not the other.
3. **Group cap.** In every climate question, no single group in
   `SAME_CLIMATE_GROUPS` supplies all three wrong answers.
4. **Boundary of 2.** Two wrong answers from one group are still allowed.
   Take a fixture where the three farthest eligible candidates are all in one
   group. The question offers the first two and then the next farthest
   candidate from outside that group.
5. **Farthest first, apart from the caps.** Each climate question's wrong
   answers are what you get by walking the candidates farthest first (ties to
   the smaller entity id, as now). Skip a candidate when it is excluded today
   (same text as the answer or an earlier pick, or a state in the answer
   state's own group), or when taking it would break criterion 1 or 3. Stop at
   three. Nothing is drawn at random. The same input gives the same output
   every time.
6. **The caps are never relaxed.** If skipping candidates under criteria 1 and
   3 leaves fewer than three wrong answers, the draft is reported in
   `shortPools` with `reason: "too_few_candidates"` and the number found. No
   question is built with a capped candidate let back in. Check this with a
   fixture whose only eligible candidates are HI, AK and one other state: that
   draft is short with `found: 2`.
7. **Only climate changes.** Every other `distractor_strategy` gives exactly the
   choices and `correctIndex` it gives at base (`3279555`) for the same input.

### The committed bank

8. **Regenerated, and both drift tests pass.** `question-bank/data/questions/us-states.json`
   and `backend/app/data/content.json` were regenerated with the commands in
   `conventions.md` (`bun run ./src/write-questions.ts`, `make -C backend
   content`). Their drift tests pass.
9. **No committed climate question offers both.** In the committed question
   file, 0 of the 50 `tpl-climate-of` questions offer both HI's and AK's
   phrases. In every question at most one of the three wrong answers is either
   phrase. The same holds for the climate questions in `content.json`.
10. **Same counts.** The committed question file still has 50 `tpl-climate-of`
    questions, one per state. `content.json` still serves 365 questions, with
    `climate` 50. No climate draft became a short pool.
11. **Only distractors moved.** For every `tpl-climate-of` question in both
    committed files, `id`, `prompt`, `answer`, `correctIndex` and the position
    of the answer in `choices` are as they were at `3279555`. Only the three
    wrong answers may differ. `level` may differ only through the existing
    formula reacting to the new distractors (see criterion 13).
12. **Nothing else in the bank moved.** Every question that is not
    `tpl-climate-of` is deep-equal, field for field, to its counterpart at
    `3279555`, in both committed files. Every file under
    `question-bank/data/us-states/` is byte-identical to `3279555`.
13. **No weight moved.** `LEVEL_SEED_WEIGHTS` in `question-bank/src/seed-level.ts`
    is deep-equal to its value at `3279555`. That includes
    `concept_load["tpl-climate-of"]`, which stays 3.

### The record

14. **The re-read is written down** in a new entry in `engineering-decisions.md`,
    numbered with the next unused `E-n`. It holds:
    - **(a)** E-26 table D's ten states (CA, TX, FL, NY, WA, CO, KY, HI, AK,
      RI), re-read on the regenerated bank. Each row gives the prompt, the
      correct answer, the three wrong answers, the level, a verdict
      (`too easy`, `about right` or `too hard`, in E-26's meaning) and a reason
      for any verdict other than `about right`.
    - **(b)** The new counts: how many of the 50 offer at least one of HI's and
      AK's phrases, and how many offer both (0, by criterion 9).
    - **(c)** A judgement on `concept_load["tpl-climate-of"]` (3): keep it, or
      name the value it should move to and why. Any move is a follow-on, not
      this task (criterion 13).
    - **(d)** That CA's question is unchanged under these rules and why (its
      wrong answers come from two groups). Also whether CA is still
      `too hard`.
15. **E-25 records the rule.** E-25's `climates_outside_group` bullet, or a
    dated amendment under E-25, states both caps: the HI and AK cap of one,
    and no three wrong answers from one group. It points at the new entry
    from criterion 14.
16. **The source comments are true.** The `climates_outside_group` doc comment
    in `question-bank/src/templates.ts` and the climate comments in
    `question-bank/src/distractors.ts` describe both caps.

### What must not happen

17. **No new dependency** in any `package.json` or `pyproject.toml`, and no
    lockfile change.
18. **No test reaches the network.** Every new test runs on inline fixtures
    or committed files.
19. **No climate phrase is written or edited.** Every wrong answer in a climate
    question is, exactly, the `climate_kid` of some committed state. No entity
    file changes (criterion 12). The person-approved lists already in
    `distractors.ts` (`SAME_CLIMATE_GROUPS` and the others) are unchanged.
20. **No other surface changes.** `openapi.yaml`, `geoquizdataplan.md`,
    `frontend/` and `backend/app/` other than `backend/app/data/content.json`
    are byte-identical to `3279555`. So are the migrations,
    `backend/scripts/measure_selection.py` and E-26's text.

## Out of scope

- **A stricter group rule.** At most one per group, a "same opening words"
  check ("cold snowy winters…"), or anything else that would change CA's
  question. It is a content call. If the re-read (criterion 14 (d)) still
  finds CA `too hard`, that becomes a follow-on for a person to decide.
- **Changing `concept_load` or any level weight.** Criterion 14 (c) judges
  it. A change is a follow-on, because it moves 50 levels and E-22's pins.
- **T-085's cause.** HI and AK are seeded too hard (9.5 and 8) by rank buckets.
  That stays T-085's problem, and this task does not touch the level formula.
- **T-088's agriculture distractors**, and every non-climate strategy.
- **E-26's measurement text, and `measure_selection.py`.** The worker may run
  the script to get table D's rows. It must not change it.
- **`PROGRESS.md`'s Known-gaps line** ("Climate wrong answers repeat…") and
  the `tasks.md` bookkeeping belong to the reviewer's sweep.
- **Rewording any climate phrase** (criterion 19).

## Constraints

- **Files expected to change:** `question-bank/src/distractors.ts`,
  `question-bank/src/templates.ts` (comment only),
  `question-bank/data/questions/us-states.json` and
  `backend/app/data/content.json` (both regenerated, never hand-edited),
  `engineering-decisions.md` (E-25 amended, one new `E-n`), new test files.
- **Pure stays pure.** `distractors.ts` keeps its header promise: no network,
  no file, no clock, no randomness, inputs never mutated.
- **The cap set is HI and AK, by entity id or postal code.** It is not "the two
  farthest states" or any other distance rule. If it is a new exported list,
  put it beside the T-026 lists with a comment naming T-090 and E-26 as its
  source.
- **Existing tests are not the worker's to change** (D-14). If a test pins a
  climate distractor by value and goes red, list it under **Tests made stale**.
  The survey found none: `t026-templates.test.ts` and
  `t026-tester-verify.test.ts` check the group rule, not values.
  `backend/tests/test_measure_selection.py` uses inline fixtures.
- **Commands:** `bun` in `question-bank/`, `uv` and `make` in `backend/`
  (`CLAUDE.md` "Packages"). Run the whole suite in both, plus typecheck, lint
  and `format:check` in `question-bank/`.
- **Dependencies:** none (criterion 17).

## Context

Required reading for the worker and the tester:

- `engineering-decisions.md` **E-26 section D** and its Findings bullet "Table
  D, Hawaii's and Alaska's phrases…". This is where the task comes from, and
  the table criterion 14 re-reads.
- `engineering-decisions.md` **E-25**, the `climates_outside_group` bullet,
  and **E-21**, the tiers, the tie-break and the correct-position hash.
- `engineering-decisions.md` **E-22**, how `level` reads distractors
  (`nearDistractorCount`), and **E-24**, the two committed files and their
  drift tests.
- `question-bank/src/distractors.ts`: `SAME_CLIMATE_GROUPS` (146-157),
  `exclusionFor` (216-253), `farthestFirst` and `byTierThenNearest`
  (356-372), `nearestDistractors` (379-420).
- `question-bank/src/templates.ts:131-134`, the strategy doc comment, and
  `tpl-climate-of` (263-266).
- `question-bank/src/seed-level.ts`: `LEVEL_SEED_WEIGHTS`, `isNear`,
  `nearDistractorCount`.
- `conventions.md` "Commands", the two regeneration commands.
- `backend/scripts/measure_selection.py`, which prints table D (`--no-timing`).
- `geoquizdataplan.md` §1.2, "Distractors matter more than the question".
- `test-guidelines.md`: pure functions first, inline fixtures, no network.
- `CLAUDE.md` "Content rules". Distractors are text a child reads.

## Review checklist — for the human reading the result

Criteria 1-13 and 15-20 are tests. These are not:

- [ ] Read all 50 regenerated climate questions. Does any now offer two
      phrases a child cannot tell apart, or make the answer the only odd one
      out?
- [ ] Read criterion 14's re-read of the ten states. Do the verdicts match how
      the questions read to a seven- to ten-year-old?
- [ ] California: unchanged and probably still `too hard`. Decide whether a
      stricter rule is wanted as a follow-on (Out of scope, first bullet).
- [ ] `concept_load["tpl-climate-of"]`: agree or disagree with criterion 14
      (c)'s judgement.

## Handoff

## Verdict

## Notes

- Expander, 2026-10-23: the queue entry proposed "never three from one
  same-climate group" to fix California. The survey shows CA's three are from
  two groups, so that half does not touch CA. It is kept as written, because
  it is the queued rule and a guard. A stricter rule is left for a person
  instead of being chosen here.
