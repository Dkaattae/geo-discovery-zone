# T-091 — Climate: record that the "only cold phrase" trade is accepted

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-091
**Branch:** `claude/amazing-ritchie-wwz0je`
**PR:** #111, opened draft at expand time against the branch above
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-30 | cse_011oDiJeSdbcuQndNDoPuD3h |

**Worker model:** Sonnet is enough. Two edits to `engineering-decisions.md` and
three counts read off the committed question file. No source, no data, no level
moves.

**Plan to attend the tester step.** Several guards pin `engineering-decisions.md`
by digest (listed under Constraints). Editing E-25 and E-27 turns them red by
design, so a Test change request is near certain (D-14, D-15).

## Goal

T-090 (PR #93) capped Hawaii's and Alaska's climate phrases, and that left the
answer as the only "cold" phrase in 22 of 50 climate questions. Dkaattae chose
option (a) on 2026-10-27: accept the trade and change no rule. This task writes
that decision into E-25 and closes E-27 (b)'s open "Owner" line, so the record
no longer reads as an open question.

## Acceptance criteria

**Frozen once approved.** **Main** means `12d242e`, the default branch this task
starts from. **The climate questions** are the 50 questions with `templateId`
`tpl-climate-of` in `question-bank/data/questions/us-states.json`. A choice's
**state** is the committed state whose `climate_kid` (in
`question-bank/data/us-states/*.json`) equals that choice's text. A choice
**has "cold"** when it contains the substring `cold`, case-insensitive, so
`colder` counts (Virginia's answer, "…colder and snowier out in the mountains",
is one of E-27's 22). **The climate bullet** is the text of E-25 from
`` **`climates_outside_group`** `` up to, not including,
`` **`crops_not_grown_nearby`** ``. **The amendment** is the part of the climate
bullet from the T-091 marker in criterion 1 to the end of the climate bullet.
**E-27 (b)** is the text of E-27 from `### (b)` up to, not including,
`### (c)`. All text checks below are on text with whitespace runs (line breaks
included) collapsed to one space.

### The record in E-25

1. The climate bullet contains exactly one match of
   `Amended \d{4}-\d{2}-\d{2} \(T-091\)`. It comes after the existing
   `Amended … (T-090)` text in that bullet.
2. The amendment names `Dkaattae`, the date `2026-10-27`, and option `(a)`.
3. The amendment says the trade is accepted (contains `accept`,
   case-insensitive) and that `climates_outside_group`'s rule and caps are not
   changed (contains `unchanged` or `not changed`, case-insensitive).
4. The amendment names `E-27`.
5. The amendment states, as `N of 50`, how many climate questions have an
   answer that has "cold" while none of its three wrong choices does, and N
   equals that count computed from the committed question file.
6. The amendment states, as `N of 50`, how many climate questions have wrong
   choices whose states are exactly {HI, CA, OR}, and N equals that count
   computed from the committed question file.
7. The amendment states how many climate questions offer both Washington's and
   Oregon's phrases among their wrong choices (a number followed, within the
   same sentence, by `Washington` and `Oregon`, or by `WA` and `OR`), and that
   number equals the count computed from the committed question file.
8. The amendment names the three options not taken, each by its label and a
   key term: `(b)` with `same-climate group`, `(c)` with `season word`, and
   `(d)` with `same words` (all case-insensitive).
9. The amendment names `NY`, `RI` and `CA` (or New York, Rhode Island and
   California) and the phrase `too hard`, as the questions E-27 (a) reads too
   hard that this acceptance leaves as they are.

### The Owner line in E-27 (b)

10. E-27 (b) no longer contains `Owner: the person reading T-090's escalated
    review`.
11. E-27 (b) contains `Dkaattae`, `2026-10-27`, `T-091` and `E-25`.
12. E-27 (b) still contains `**47** offer at least one` and `**0** offer both`
    (the strings `climate-far-phrases-verify.test.ts` reads).

### Nothing else in the record moves

13. E-27, from its `## E-27 ` heading line up to, not including, the paragraph
    that starts `None of this breaks a T-090 criterion`, is byte-identical to
    main's.
14. E-27, from `### (c)` up to, not including, the `## E-28 ` heading, is
    byte-identical to main's.
15. E-25, outside the climate bullet, is byte-identical to main's (its
    T-088 amendment and its `**Revisit when**` paragraph included).
16. `engineering-decisions.md` outside E-25 and E-27 is byte-identical to
    main's, and its `## E-n` headings are still exactly E-1 to E-30, in order,
    each heading line unchanged. No new entry.

### Nothing in the bank or the code moves

17. `question-bank/data/questions/us-states.json` is byte-identical to main's.
18. Every file under `question-bank/data/us-states/` is byte-identical to
    main's.
19. `backend/app/data/content.json` is byte-identical to main's.
20. Every non-test file under `question-bank/src/`, `backend/app/` and
    `frontend/src/` is byte-identical to main's (so `distractors.ts`,
    `templates.ts` and `LEVEL_SEED_WEIGHTS` are unchanged).

### Boundaries

21. No dependency is added or changed: every `package.json`, `bun.lock`,
    `backend/pyproject.toml` and `backend/uv.lock` is byte-identical to main's.
22. The branch's diff against main touches only: `engineering-decisions.md`,
    new test files, pre-existing test files changed only through an approved
    Test change request row, this brief, `runs/`, and the reviewer's sweep of
    `tasks.md` / `PROGRESS.md`.
23. No test reaches the network.
24. The whole suites are green: `cd question-bank && bun test`, its typecheck,
    lint and `format:check`; `make -C backend test`; `cd frontend && bun test`.

## Out of scope

- **Any rule change.** Options (b), (c) and (d) were not chosen. No change to
  `climates_outside_group`, `breaksClimateCap`, `SAME_CLIMATE_GROUPS`,
  `CLIMATE_FAR_PHRASE_STATES` or any `climate_kid` phrase.
- **Regenerating either committed file.** The queue entry's "Test cost:
  regenerates both committed files" was written before (a) was chosen and no
  longer applies.
- **`concept_load["tpl-climate-of"]` and every level.** E-27 (c) keeps 3; not
  re-judged here.
- **California's, New York's and Rhode Island's `too hard` verdicts.** They are
  named in the record (criterion 9), not fixed.
- **E-26's table D and E-27's table (a), counts and Revisit paragraph.** They
  are the measurement as it was; this task records a decision on top of them.
- **E-25's `**Revisit when**` paragraph.** T-088 criterion 31 pins it (it must
  not contain `accepted risk`); leave it alone.
- **A new `E-n` entry.** The queue entry asks for E-25 and E-27 only.
- T-085b, T-087, T-095 and anything else in the queue.

## Constraints

- **File expected to change:** `engineering-decisions.md` only (E-25's climate
  bullet and E-27 (b)'s closing paragraph), plus new tests.
- **The counts come from the committed bank**, not from E-27 (b). If the bank's
  counts differ from E-27 (b)'s 22, 18 and 8, the amendment states the bank's
  numbers and the worker says so in its Handoff. E-27 (b)'s own numbers are not
  edited (criterion 13).
- **Expected stale tests**, for the worker's Handoff and the tester's Test
  change request — candidates found by reading, not a complete list; the worker
  runs the suite and names what actually goes red:
  - `question-bank/src/agriculture-true-wrong-answers-verify.test.ts`,
    criterion 25, `MAIN_ED_OUTSIDE_E25_SHA` (E-27 is outside E-25).
  - `question-bank/src/map-click-no-candidates-verify.test.ts`, T-092
    criterion 13, the E-1..E-28 digest.
  - `backend/tests/test_t089_tester_criteria.py`, criterion 13,
    `DECISIONS_ON_MAIN` / `DECISIONS_ON_MAIN_LEN` (byte prefix through E-27).
  - `question-bank/src/seed-level-loose-ends-verify.test.ts`, criterion 12,
    `HEAD_OUTSIDE_E22_SHA`.
  - `question-bank/src/familiarity-drawn-apart-verify.test.ts`, criterion 22,
    `BEFORE_ED_OUTSIDE_E22_SHA`.
  - Any other guard that hashes `engineering-decisions.md` outside one entry
    (`hand-check-levels-verify.test.ts`, `farm-animal-loose-ends-verify.test.ts`,
    `climate-far-phrases-verify.test.ts` are worth checking).
- **Re-pins follow E-30:** each new pin is labelled with the commit it was
  recorded at, and no guard gains a strip, reset or exclusion to stay green.
- **Tests that must stay green unmodified:** `climate-far-phrases-verify.test.ts`
  T-090 criteria 14 and 15 read E-27 (b)'s `**47**` / `**0**` strings, E-27
  (d)'s phrases, and E-25's climate bullet (`Amended … (T-090)`, `Hawaii or
  Alaska`, `all three`, `E-27`). The amendment adds to the bullet; it does not
  remove those.
- The worker never modifies a pre-existing test; it lists them under **Tests
  made stale**.
- **Escalate at review.** Climate choices are text a child reads, and this
  records a content trade a person accepted, so the reviewer flags the PR
  (queue entry, "Done when").
- Dependencies: none (`CLAUDE.md`, "Packages"). `bun` in `question-bank/` and
  `frontend/`; `uv` in `backend/`.

## Context

- Queue entry: [`tasks.md`](../tasks.md) T-091 (section D), including the
  options (a)–(d) and Dkaattae's choice.
- `engineering-decisions.md` §E-25, the `climates_outside_group` bullet and its
  "Amended 2026-10-23 (T-090)" text (about line 1408 on main); §E-27, all of
  it, and especially (b) "The new counts" and its closing paragraph ending
  `**Owner: the person reading T-090's escalated review.**` (about lines
  1797–1827); §E-30 for how re-pins are labelled.
- `question-bank/data/questions/us-states.json` — the 50 `tpl-climate-of`
  questions (`choices`, `correctIndex`).
- `question-bank/data/us-states/*.json` — `climate_kid`, to map a choice back
  to its state.
- `question-bank/src/climate-far-phrases-verify.test.ts` — T-090 criteria 14–15,
  which read the same two entries; its helpers (`sectionOf`, `wrongOf`,
  `capCount`) show how T-090 computed the counts.
- [`test-guidelines.md`](../test-guidelines.md) — read the committed files
  directly; no seam needed.
- `process-decisions.md` D-14, D-15 for the Test change request route.

## Review checklist

A test can check that the numbers and names are there; only a person can check
the record says what was decided.

- [ ] The amendment reads as Dkaattae's decision, (a), and does not overstate
      it (it accepts the trade E-27 (b) describes, nothing more).
- [ ] E-27 (b)'s closing paragraph no longer reads as an open question, and
      still makes sense next to E-27's unchanged Revisit paragraph.

## Handoff

## Verdict

## Notes

- **Already true on main (expander survey, by reading only):** no rule,
  bank or level change is needed. E-27 (b) already describes the trade and its
  counts; what is missing is the decision. E-25's climate bullet has the T-090
  amendment and nothing after it.
- **Why "cold" is a substring match:** Virginia's answer contains `colder`, not
  `cold` as a word, and E-27 lists VA among the 22. A whole-word match would
  not reproduce T-090's count.
- **Why the amendment goes in the climate bullet** rather than after T-088's
  amendment: T-088's criteria 26–31 read E-25 from `Amended … (T-088)` to
  `**Revisit when**`, so text placed there would land inside T-088's amendment.
- **Picked over T-085b**, which is first in the queue but needs a Census
  source a person has not chosen yet.
- **PR:** #111, opened draft at expand time from branch
  `claude/amazing-ritchie-wwz0je`.
