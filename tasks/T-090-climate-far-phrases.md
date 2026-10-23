# T-090 — Climate wrong answers: Hawaii and Alaska in almost every question

**Status:** `escalated`
**Next step:** `human` — approved and swept; PR #93 marked ready but escalated: changes text a child reads (the climate wrong answers). Dkaattae reads the 50 questions and decides T-091 before merging
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
| worker | 2026-10-23 | cse_01RqMHVzQ4dzC6Q8EjTwWEZi (orchestrator subagent; the remote session id is shared, the agent context is not) |
| tester | 2026-10-23 | cse_01RqMHVzQ4dzC6Q8EjTwWEZi (orchestrator subagent, fresh context; same shared id, so the id check proves nothing here) |
| reviewer | 2026-10-23 | cse_01RqMHVzQ4dzC6Q8EjTwWEZi (orchestrator subagent, fresh context; same shared id). Verdict: changes requested, back to `tester` |
| tester | 2026-10-23 | cse_01RqMHVzQ4dzC6Q8EjTwWEZi (orchestrator subagent, fresh context, round 2 for review finding 1; same shared id, so the id check proves nothing here) |
| reviewer | 2026-10-23 | cse_01RqMHVzQ4dzC6Q8EjTwWEZi (orchestrator subagent, fresh context, round 2; same shared id). Verdict: approve, escalated (text a child reads) |

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

**TL;DR**
- **Both caps are built and the bank is regenerated.** 0 of 50 climate questions now offer both HI's and AK's phrases (42 before). Nothing else in the bank moved. Both suites, typecheck, lint and format pass. No stale tests.
- **The cap has a content cost that a person must judge.** With Alaska's phrase gone, eastern states now draw West Coast phrases. HI + CA + OR is the wrong-answer set in 18 of 50. **In 22 of 50 the answer is the only phrase with "cold" in it** (1 before), so the answer is the odd one out. WA's and OR's near-twin phrases appear together in 8. All of this is the rule working as written. The brief left a stricter rule out of scope. E-27 (b) has the detail.
- **Next:** the tester, then the reviewer. Expect the reviewer to escalate to a person, as the brief predicts. That person decides whether to accept this trade or queue a stricter rule.

**Files changed**
- `question-bank/src/distractors.ts`:
  - new exported `CLIMATE_FAR_PHRASE_STATES` (`["HI", "AK"]`), next to the T-026 lists, with a comment naming T-090 and E-26;
  - new `isFarPhraseState` and `breaksClimateCap`;
  - one added line in `nearestDistractors`'s pick loop, for `climates_outside_group` only;
  - comments updated on `SAME_CLIMATE_GROUPS`, `farthestFirst` and `nearestDistractors`.
- `question-bank/src/templates.ts`: comment only, on the `climates_outside_group` strategy bullet.
- `question-bank/data/questions/us-states.json`: regenerated with `bun run ./src/write-questions.ts`.
- `backend/app/data/content.json`: regenerated with `make -C backend content`.
- `engineering-decisions.md`: E-25's climate bullet gets a dated amendment, and there is a new **E-27**.
- `question-bank/src/climate-far-phrases.test.ts`: new. Worker tests on inline fixtures, plus one bank-wide check over the committed entity files.

**Where each criterion lives**

| # | Where |
|---|---|
| 1, 2, 6 | `breaksClimateCap` far-phrase branch. The loop `continue`s and nothing is relaxed. The existing `too_few_candidates` path reports short pools. |
| 3, 4 | `breaksClimateCap` group branch: `sameGroup + 1 >= 3` skips the third from one group. |
| 5 | Unchanged sort (`byTierThenNearest`, farthest first, id tie-break), plus the existing exclusions, plus the cap check. |
| 7 | The cap check is gated on `strategy === "climates_outside_group"`. My diff script shows every non-climate question deep-equal to `3279555` in both files. |
| 8 | Both files regenerated. `committed-bank` and the backend drift tests pass. |
| 9-11 | 0 offer both. 50 climate questions, 415 bank, 365 served, climate 50, same 3 short pools as base (superlative DE/CT/RI). 42 climate questions changed choices only. `id`, `prompt`, `answer`, `correctIndex`, answer position and `level` are all unchanged. |
| 12, 13 | Non-climate questions deep-equal. `data/us-states/` and `seed-level.ts` untouched. |
| 14 | E-27 (a)-(d). |
| 15 | E-25 amendment under its `climates_outside_group` bullet, pointing at E-27. |
| 16 | `templates.ts` strategy comment. `distractors.ts`: `SAME_CLIMATE_GROUPS`, `CLIMATE_FAR_PHRASE_STATES`, `farthestFirst`, `breaksClimateCap`, `nearestDistractors`. |
| 17-20 | No package or lock change. Tests are offline. No phrase or list edited. `openapi.yaml`, `geoquizdataplan.md`, `frontend/`, `backend/` (apart from `content.json`), `backend/scripts/` and migrations show no diff against `3279555`. E-26's text is untouched: the edits are an E-25 amendment and an appended E-27. |

**Deliberately not done**
- **No stricter rule.** That includes one per group, no "only cold phrase" answer, and no fix for California. The brief puts these out of scope. E-27 (b) lays out the evidence for a person.
- **`concept_load` not changed.** E-27 (c) judges keep 3.
- **`PROGRESS.md` and `tasks.md` not touched.** That bookkeeping is the reviewer's sweep.

**Contradicts the brief**
- **None of the criteria.** The Goal's premise ("a child ... is left with a two-way pick") is partly undone in another way: 21 more questions now have the answer as the only cold phrase. E-27 (b) records this. Owner: **the person at the escalated review**, who decides whether to accept it or queue a stricter-rule follow-on.
- **Small mismatch in the brief:** the survey says HI's question offers "ME RI MA". The committed file agrees, and so does the E-26 table. No issue.

**How to run**
```
cd question-bank && bun install --frozen-lockfile && bun test && bun run typecheck && bun run lint && bun run format:check
bun run ./src/write-questions.ts          # byte-stable: no diff after commit
make -C backend content && make -C backend test lint format-check
cd backend && uv run python scripts/measure_selection.py --no-timing   # table D and the "both in 0" line
```

**Tests made stale:** none. The full question-bank suite (2315 pass) and the backend suite (627 pass, 9 skipped) are green.

## Verdict

**TL;DR**
- **Pass.** All 20 criteria hold. 14 are checked by new tests, and 17-20 are checked by tests plus a `git diff` against `3279555`. All 7 source mutations were caught and reverted.
- **Independence is the weaker kind.** This is an orchestrated run (`runs/T-090-climate-far-phrases.md` exists). My session id is the worker's, so the Sessions check proves nothing. My independence rests only on the orchestrator spawning me as a fresh agent: I did not see the worker's conversation or reasoning. I cannot verify that myself.
- **Next:** the reviewer. The content trade in E-27 (b) still needs a person (see below). Nothing in this verdict settles it.

**Suites** (run with every proxy variable pointed at `http://127.0.0.1:1`)
- `question-bank`: `bun test` 2363 pass, 0 fail (2315 existing + 48 new). `typecheck`, `lint` and `format:check` are clean.
- `backend`: `make test` 627 passed, 9 skipped. `lint` and `format-check` are clean.
- **Regeneration is byte-stable.** `bun run ./src/write-questions.ts` and `make -C backend content` leave no diff.

**New file:** `question-bank/src/climate-far-phrases-verify.test.ts`, 48 tests, one `describe` per criterion.
- **Expected values:** taken from the criteria, the committed entity files, and sha256 digests of the committed files at `3279555`.
- **How the digests were made:** computed once from a `git worktree` of `3279555`, with the same helper functions the test uses.
- **One independent check:** criterion 5 is re-implemented from its wording (`referenceWrong`) and compared against all 50 committed climate questions in both files.

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | TX fixture with HI and AK as the two farthest offers one of them. AK's question offers HI's phrase and HI's offers AK's. All 50 questions from the committed entities have at most one. |
| 2 | pass | HI farther: HI, CO, NY are offered. AK farther: AK, CO, NY. |
| 3 | pass | Three Great Plains states farthest: not all three are offered. All 50 committed questions take at most two from one group. |
| 4 | pass | IA, NE, KS, ND farthest gives IA, NE, CA. OR + WA + MT is a full question. |
| 5 | pass | The fixture walk skips own-group, same-text-as-answer, same-text-as-pick and second-cap candidates. Both caps in one walk give IA, NE, AK. A tie goes to CA over NY. The same input gives the same output, and the input is not mutated. The reference walk matches all 50 in both files. |
| 6 | pass | HI, AK and CO only: `shortPools` is `[{found: 2, reason: "too_few_candidates"}]` and no question is built. Three Great Plains states only: the same result. |
| 7 | pass | Every non-climate strategy on 7 answer fields, over a fixture that trips both caps (it offers HI and AK together under `neighbours_first`), digests equal to `3279555`. So do all non-climate templates over the committed entities. |
| 8 | pass | `us-states.json` equals `renderQuestionFile(entities)`. `content.json`'s climate choices, `correctIndex` and `level` equal the question file's. Both drift tests pass. |
| 9 | pass | 0 of 50 offer both, in both files. |
| 10 | pass | 50 climate questions, one per state. `content.json` has 365 questions, 50 of them `climate`. No climate draft is a short pool. |
| 11 | pass | `id`, `entityId`, `prompt`, `answer`, `correctIndex` and answer position match the `3279555` digest in both files. `level` equals the pipeline's output. |
| 12 | pass | Non-climate questions match the `3279555` digests in both files. `data/us-states/` matches its tree digest. |
| 13 | pass | The `LEVEL_SEED_WEIGHTS` digest matches. `concept_load["tpl-climate-of"]` is 3. |
| 14 | pass | E-27 is the newest entry and appears once. Its 10 rows match the committed questions on prompt, correct answer, wrong answers and level, and each non-`about right` verdict has a reason. (b) says **47** and **0**, which match my counts. (c) is "keep". (d) says CA is unchanged, its answers come from two groups, and it is still too hard. CA's question equals its `3279555` copy. |
| 15 | pass | E-25's climate bullet has "Amended 2026-10-23 (T-090)" naming both caps and E-27. |
| 16 | pass | The `templates.ts` doc comment and the `distractors.ts` comments name both caps. |
| 17 | pass | The 8 tracked manifests and lockfiles match the `3279555` digest. No other manifest or lockfile exists. |
| 18 | pass | Both T-090 test files are free of URLs, `fetch(`, transports and non-git spawns. The suite passes with the proxy pointed at loopback. |
| 19 | pass | Every wrong answer is exactly some committed state's `climate_kid`. The five person-approved lists match the `3279555` digest. |
| 20 | pass | `measure_selection.py` and E-26's text match their digests. `git diff 3279555 HEAD` over `openapi.yaml`, `geoquizdataplan.md`, `frontend/`, `backend/migrations` and `backend/app/` (minus `content.json`) is empty. That test is `skipIf` the commit is absent, as on CI's shallow checkout. |

**Mutations** (each made in `distractors.ts`, run against the new file, then reverted; `git diff src/distractors.ts` is empty afterwards)

| Mutation | Red tests |
|---|---|
| M1: far-phrase cap disabled | 7 (crit 1, 2, 5, 6, 8) |
| M2: group cap tightened to one per group | 6 (crit 4, 5, 6, 8) |
| M3: group cap disabled | 4 (crit 3, 4, 5, 6) |
| M4: caps applied to every strategy | 3 (crit 7 twice, 8) |
| M5: tie-break reversed | 2 (crit 5, 7) |
| M6: cap set `["HI"]` only | 7 (crit 1, 2, 5, 6, 8) |
| M7: caps relaxed to fill a short pool | 2 (crit 6) |

**Stale tests:** none. No existing test went red and none was touched. **Test changes:** none.

**For the person at review (not a criterion, confirmed independently):**
- **22 of 50 questions have the answer as the only phrase containing "cold"**, against 1 at `3279555`. My count matches E-27 (b) and lists the same states.
- **This is the "only odd one out" item in the review checklist**, and the person reading the escalated review owns it.
- **Durability caveat:** the `3279555` digests (criteria 7, 11, 12, 19) will go red when a later task deliberately regenerates non-climate questions, such as T-088's agriculture. That task's tester then raises a test change request.

### Verdict, round 2 (after review finding 1) — 2026-10-23

**TL;DR**
- **Pass, and finding 1 is fixed.** The criterion 20 `git diff 3279555` test and `baseAvailable` (`git cat-file`) are gone. The trees are now pinned by `treeDigest` sha256 digests, like the other base pins. No git call in the file is handed a revision.
- **The suite was run with the file committed-to-index** (`git add` first), so the T-081 guard scanned it: `bun test` **2367 pass, 0 fail**. That corrects round 1's "0 fail", which was measured with the file untracked.
- **Independence is still the weaker kind:** orchestrated run, shared session id. It rests on my being a fresh agent with no view of the worker's reasoning.

**What changed** (only `question-bank/src/climate-far-phrases-verify.test.ts`, plus this brief)
- `treeDigest` takes an optional `except` list.
- Criterion 20 now has 5 digest tests. They cover `openapi.yaml`, `geoquizdataplan.md`, `frontend`, `backend/migrations`, and `backend/app` except `backend/app/data/content.json`. The digests were computed from a `git worktree` of `3279555` and are identical to HEAD's. These run on CI, where the old test was skipped.
- Removed: the unused `BASE` const, `baseAvailable`, and the `git diff` test. The header comment is updated. `git-exit-guard.criteria.test.ts` was not touched.

**Suites** (proxy variables pointed at `http://127.0.0.1:1`)
- `question-bank`: `bun test` 2367 pass, 0 fail (2363 − 1 removed + 5 new). `typecheck`, `lint` and `format:check` are clean.
- `backend`: `make test` 627 passed, 9 skipped.

**Mutation of the new pins** (reverted with `git checkout`; `git status` afterwards shows only the test file)
- I appended a line to `openapi.yaml`, `backend/app/__init__.py` and `frontend/package.json`.
- Result: the `openapi.yaml`, `frontend` and `backend/app` pins went red, and so did criterion 17's manifest pin. 48 pass, 4 fail.
- `content.json` differs from base at HEAD, yet the `backend/app` pin passes. So the exclusion works.

**Durability:** these five pins, like the round 1 pins, will go red when a later task deliberately changes those trees. That task's tester raises a test change request (review N2).

## Review

**TL;DR**
- **Changes requested, back to `tester`.** The implementation is good and I would approve it. But the question-bank suite is **red on the committed branch**: 3 failures, all in the pre-existing T-081 git guard, all caused by the tester's new `climate-far-phrases-verify.test.ts`. CI's `question-bank (typecheck, lint, test)` job fails on `92a320e` too.
- **Why the Verdict said "0 fail":** the guard lists files with `git ls-files`, so it cannot see an untracked file. The tester ran the suite before committing the new file, so the guard never scanned it. Once committed, it does.
- **Next:** `tester` fixes finding 1 in its own file only, re-runs the whole suite **after** committing, and hands back to `reviewer`. The worker owes nothing.

### Finding 1 — blocks: the new verify test breaks the T-081 git guard (`tester`)

- **Where:** `question-bank/src/climate-far-phrases-verify.test.ts:783` (`baseAvailable`, `git cat-file -e ${BASE}^{commit}`) and `:803` (`git diff --name-only ${BASE} -- …`, the criterion 20 test).
- **What fails:** `src/git-exit-guard.criteria.test.ts`, "T-081 criteria 3–8":
  - "every invocation uses a working-tree subcommand" (`cat-file` is not allowed);
  - "no invocation is handed a revision" (both calls are handed `3279555`);
  - "every invocation fails when git exits with a status it does not expect" (line 783's exit status is only read as a boolean).
- **Reproduce:** `cd question-bank && bun test` on the branch as committed: 2360 pass, 3 fail.
- **What would make it acceptable:** the criterion 20 check without a git call handed a revision. The file already has `treeDigest`, used for `measure_selection.py` and the entity tree. Pin `openapi.yaml`, `geoquizdataplan.md`, `frontend/`, `backend/migrations` and `backend/app/` (minus `content.json`) the same way, computed once from a worktree of `3279555`, as the other digests were. Then drop `baseAvailable` and the `git diff` test. This also means the check runs on CI instead of skipping.
- **Not acceptable:** changing `git-exit-guard.criteria.test.ts`. It existed before this task (D-14).
- **Then:** run the whole question-bank suite **after** the commit (or after `git add`), so the guard sees the file. Correct the Verdict's suite line.

### Not blocking

- **N1 — the content trade (worker's flag, also the tester's).** In 22 of 50 climate questions, the answer is now the only "cold" phrase (1 before). HI + CA + OR is the wrong-answer set in 18 of 50. There are 16 same-group near-twin pairs (3 before). I checked these against E-27 (b). They are the rule working as written, and the brief puts a stricter rule out of scope. **Disposition:** a person decides this at the escalated review. This PR will be escalated whatever happens, because it changes text a child reads. The approving reviewer files the person's choice as a follow-on task at sweep. It is not decided here.
- **N2 — base-commit digests will go stale.** The pins for criteria 7, 11, 12 and 19 at `3279555` will go red when T-088 regenerates agriculture questions. That will mean a test change request (D-14). This repo already pins digests elsewhere (`climate-kid-verify.test.ts`), so this is not new. **Disposition:** at sweep, amend T-088's `tasks.md` entry to say its tester should expect this. T-088 has to regenerate the bank anyway, so it already owns the question. A new task would be redundant.
- **Worker's other flags:**
  - the `bun run format` slip was reverted before commit, and the diff confirms no existing test changed. Closed;
  - the Status/Approved mismatch was the orchestrator's stamp order. No action;
  - the expander's `python3` use touched no source. Its commits touch only `tasks/` and `tasks.md`. Closed.

### What I checked, for the next reviewer

- **Lanes:** the expander touched `tasks.md` and the brief only. The worker touched the files the Constraints list, plus the brief. The tester touched its test file and the brief. The orchestrator touched `runs/` and the brief header. Every role in Sessions has a commit on this branch.
- **Code:** the `distractors.ts` diff is small, in the file's idiom, gated to `climates_outside_group`, and pure. `CLIMATE_FAR_PHRASE_STATES` sits beside the T-026 lists, as the Constraints ask. The comments are true. Nothing beyond the brief.
- **Docs:** the E-25 amendment and E-27 match the code and the committed bank. E-26 is untouched.
- **Other suites:** backend 627 passed, 9 skipped. Lint and format are clean. Typecheck, lint and format:check are clean in question-bank. Regeneration leaves no diff.
- **Sweep not done**, because this is a send-back. The approving reviewer applies N2 to T-088.

### Review, round 2 — 2026-10-23

**TL;DR**
- **Approved, escalated.** Finding 1 is fixed: the criterion 20 `git diff` and `git cat-file` calls are gone, and the trees are pinned by `treeDigest` digests. The suite is green on the committed branch, locally and on CI.
- **Escalated because it changes text a child reads** (the wrong answers in 42 climate questions). It is outside the envelope, so a person reads the result before merging. Nothing else is outside it.
- **Next:** Dkaattae reads the 50 climate questions and E-27, then decides T-091 (accept the lone-"cold"-answer trade, or queue a stricter rule).

**Re-checked on `6963e7b`**
- `question-bank`: `bun test` **2367 pass, 0 fail**, with the proxy pointed at loopback. `typecheck`, `lint` and `format:check` are clean.
- `backend`: `make test` 627 passed, 9 skipped. `lint` and `format-check` are clean.
- CI on `6963e7b`: `question-bank (typecheck, lint, test)` and `backend (lint, format, test)` succeed. The other jobs were still running when I checked.
- **Round 2 diff:** only `climate-far-phrases-verify.test.ts` and the brief changed. No git call in the file is handed a revision. `git-exit-guard.criteria.test.ts` is untouched.
- **No pre-existing test** was deleted or modified. Against `origin/main`, both test files are `A` (added). `Test changes: none` is correct.

**Dispositions**
- **Finding 1:** closed.
- **N1, the content trade:** the answer is the only "cold" phrase in 22 of 50 questions, and HI + CA + OR is the set in 18. **Filed as T-091**, waiting on a person. It is also the escalation reason on the PR.
- **N2, base-commit pins:** **amended T-088** to say its tester should expect the `3279555` pins (criteria 7, 11, 12 and 19) to go red.
- **N3, new and not blocking. The criterion 20 pins are wide.** They hash all of `frontend/`, `backend/app/` (except `content.json`), `openapi.yaml`, `geoquizdataplan.md` and `backend/migrations` at `3279555`. So the next frontend or backend task turns them red and needs a test change request (D-14). **Amended T-070**, which owns the digest-guard question, rather than opening a new task. The finding is also named in the PR body.
- **Worker's flags:** closed in round 1. The new trade is now T-091.

## Notes

- Expander, 2026-10-23: the queue entry proposed "never three from one
  same-climate group" to fix California. The survey shows CA's three are from
  two groups, so that half does not touch CA. It is kept as written, because
  it is the queued rule and a guard. A stricter rule is left for a person
  instead of being chosen here.
- Worker, 2026-10-23: the caps did exactly what the brief predicted: 0 offer both, and CA is unchanged. Reading all 50 afterwards showed a trade the survey could not see. Alaska's phrase was the only "cold" rival for most eastern states. Removing it makes the next farthest pick a West Coast phrase, so 21 more questions have the answer as the lone cold phrase, and WA/OR twins appear 8 times. I built to the criteria and put the numbers in E-27 (b) for a person, without choosing a stricter rule.
- Worker, 2026-10-23: the pinned `bun run format` failed because `node_modules` was missing. The fallback rewrote two existing test files. I reverted both with `git checkout` before anything was committed. After `bun install --frozen-lockfile`, the pinned prettier passes. No existing test is changed in this branch.
