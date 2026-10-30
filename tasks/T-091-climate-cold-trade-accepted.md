# T-091 — Climate: record that the "only cold phrase" trade is accepted

**Status:** `test changes requested`
**Next step:** `human`
**Approved:** orchestrator — 2026-10-30, unattended run. See `runs/T-091-climate-cold-trade-accepted.md`.
**Test changes:** `approved — Dkaattae, 2026-10-30`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-091
**Branch:** `claude/amazing-ritchie-wwz0je`
**PR:** #111, opened draft at expand time against the branch above
**Fault:** test changes are waiting for approval: seven pre-existing guards pin `engineering-decisions.md` or the tracked-file set, and this task's own edit (criteria 1 and 11) and loop records turn them red by design; no criterion is unmet.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-30 | cse_011oDiJeSdbcuQndNDoPuD3h |
| worker | 2026-10-30 | cse_011oDiJeSdbcuQndNDoPuD3h (orchestrated subagent; `$CLAUDE_CODE_REMOTE_SESSION_ID` is shared with the expander's, see Notes) |
| tester | 2026-10-30 | cse_011oDiJeSdbcuQndNDoPuD3h (orchestrated subagent, fresh context; same shared id, see Verdict) |
| tester | 2026-10-30 | cse_011oDiJbguF5W6xXdBB7Kxc5 (attended; resumed the request, applied the approved rows) |

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

**TL;DR:** the decision is recorded in `engineering-decisions.md`, in two
places: a T-091 amendment in E-25's climate bullet, and E-27 (b)'s closing
paragraph, where the Owner line is now marked settled. The bank's counts match
E-27 (b): 22, 18 and 8. No code or data changed. **Seven existing guards are
red by design** (six digest pins on `engineering-decisions.md`, one file-count
pin), listed below for the tester's Test change request.

**What changed**

- `engineering-decisions.md`, E-25, `climates_outside_group` bullet: added
  `**Amended 2026-10-30 (T-091):**` after the T-090 amendment. It covers
  Dkaattae's choice of (a) on 2026-10-27; that the rule and both caps are
  unchanged and the bank was not regenerated; the three counts (22 of 50,
  18 of 50, 8); NY, RI and CA staying `too hard`; and (b), (c) and (d) as not taken.
- `engineering-decisions.md`, E-27 (b), closing paragraph: "Whether to accept
  it … is the content call" became "was the content call T-090 left out of
  scope". The `**Owner: …**` line became `**Settled 2026-10-27 by Dkaattae:
  accepted, option (a), no rule change. Recorded by T-091 in E-25's
  `climates_outside_group` bullet.**`
- This brief (Status, Sessions, Handoff, Notes).
- Nothing else. No new test file: these are record edits. The tester's
  verify file is the check.

**Where each criterion lives**

| Criteria | Where |
|---|---|
| 1–9 | E-25 climate bullet, the paragraph starting `**Amended 2026-10-30 (T-091):**` (one match, after the T-090 one) |
| 5–7 counts | Computed from `question-bank/data/questions/us-states.json` and each state's `climate_kid`, with state = file name `us-state-xx.json`. Results: only-cold answer **22**, wrong set exactly {HI, CA, OR} **18**, WA and OR both wrong **8**. These match E-27 (b), so nothing diverges. The 22 are AK CT IA IL IN MA MD ME MI MN MO NC NH NJ NY OH PA RI VA VT WI WV, the same list as E-27. |
| 7 phrasing | The 8 is in its own sentence: "In 8 questions both Washington's and Oregon's phrases are wrong answers." The 22 and 18 sit in sentences of their own, so a "number … Washington … Oregon" match cannot pick them up. |
| 10–12 | E-27 (b), last paragraph before `### (c)`. The `**47** offer at least one` and `**0** offer both` strings are untouched. |
| 13–16 | My own check against `git show 12d242e:engineering-decisions.md`: E-27's head up to `None of this breaks`, E-27 from `### (c)`, E-25 outside the bullet, and everything outside E-25/E-27 are all byte-identical. Headings are E-1..E-30 and unchanged. |
| 17–21 | Not touched. `git diff 12d242e -- question-bank backend frontend` is empty. |
| 22 | Diff against main: `engineering-decisions.md`, this brief, `runs/T-091-…` (orchestrator). |
| 23 | No test added by me. |
| 24 | See "Suite results" below. |

**Suite results (worker's run, after edit)**

- `question-bank`: `bun test` 2640 pass / **6 fail** (all listed below);
  typecheck, lint (`0 warnings and 0 errors`) and `format:check` clean. I had
  to run `bun install --frozen-lockfile` first, because the container had no
  `node_modules`. That changed no tracked file.
- `make -C backend test`: 743 pass, 9 skipped, **1 fail** (listed below).
- `frontend` `bun test`: 392 pass / **4 fail, environmental**. These four
  files cannot resolve `react-simple-maps`: `t026-setup.criteria.test.tsx`,
  `t051-map-click.test.tsx`, `t051-tester.criteria.test.tsx`,
  `screens.criteria.test.tsx`. `bun install --frozen-lockfile` in `frontend/`
  fails here: the agent proxy answers 403 to tarballs on
  `europe-west1-npm.pkg.dev` (d3-array, d3-drag). `frontend/` is
  byte-identical to main, so this is not caused by T-091. The tester should
  re-run in an environment that can install, or CI is the evidence.

**Tests made stale**

All are guards that pin `engineering-decisions.md` (or the tracked-file set)
by digest. Proposal for each: **modify**. Re-pin to the value at this worker
commit, labelled per E-30 ("re-pinned at <sha> (re-pinned T-091, Test change
request row n)"). No strip, reset or exclusion. Received values are from my run.

1. `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` >
   `T-088 criteria 20-25: what must not change` > `criterion 25: outside E-25,
   engineering-decisions.md is main's; still E-1..E-30`. Stale because of
   criterion 11 (E-27 (b) edit; E-27 is outside E-25). `MAIN_ED_OUTSIDE_E25_SHA`
   → `ee4ead2780b3eb34b59f6f378b798447a06f69310555a766631141c3c71ba9bd`.
2. `question-bank/src/seed-level-loose-ends-verify.test.ts` > `T-086 criteria
   10-12: what must not move` > `criterion 12: engineering-decisions.md outside
   E-22's body is byte-identical to the branch head's`. Stale because of
   criteria 1 and 11. `HEAD_OUTSIDE_E22_SHA` →
   `4493eb37a2179d39ba610aedf337db1118e40a43e6ae04fdedff8ee2c41bcdf4`.
3. `question-bank/src/map-click-no-candidates-verify.test.ts` > `T-092
   criterion 13: E-29 records the change; E-1..E-28 untouched` > `E-1..E-28
   are byte-identical to 49444c8's, and there are 30 E-n headings at the branch
   head`. Stale because of criteria 1 and 11. The inline digest at line 664 →
   `82f931806649319e7a4995f9260051b340d4c5393472dee333f25f0c3e0a9d22`. The
   test name says "49444c8's" and would need relabelling with the new commit.
4. `question-bank/src/farm-animal-loose-ends-verify.test.ts` > `T-096 criteria
   7-9: nothing about levels changes` > `criterion 9: engineering-decisions.md
   outside E-22's body is main's; headings unchanged`. Stale because of
   criteria 1 and 11. `MAIN_ED_FROM_E23_SHA` →
   `c598bc8a37bb989e8256cf0eb53ad190450207b4d11c775a4af54eaa29fc280f`.
   `MAIN_ED_THROUGH_E22_HEADING_SHA` still passes.
5. `question-bank/src/farm-animal-loose-ends-verify.test.ts` > `T-096 criteria
   17-21: the bank and the boundaries` > `criterion 21: outside the allowed
   files and test files, every tracked file is main's, and none is added`.
   **Red before my edit**: it already failed at `2d590ba`, the orchestrator's
   head, with 299 files against a 297 floor. The cause is the two new loop
   records `tasks/T-091-climate-cold-trade-accepted.md` and
   `runs/T-091-climate-cold-trade-accepted.md`. My edit does not touch this
   pin, because `engineering-decisions.md` is in its allowed set. This is a
   count floor: re-pin to 299 and to the matching `MAIN_UNTOUCHABLE_SHA` at
   this commit. If the reviewer's sweep adds files, the count moves again, so
   whether the pin should cover per-task loop records at all is for the
   tester and the human approving the Test change request to settle.
6. `question-bank/src/familiarity-drawn-apart-verify.test.ts` > `T-085a
   criteria 17-22: E-22` > `criterion 22: every E-n entry other than E-22 is
   byte-identical to 6587ed0's`. Stale because of criteria 1 and 11.
   `BEFORE_ED_OUTSIDE_E22_SHA` →
   `572149631f0e348469449657e89234e941bb16464d4dc7d2f1c6278596ee827c`.
7. `backend/tests/test_t089_tester_criteria.py::test_criterion_13_e1_to_e27_are_byte_identical`.
   Stale because of criteria 1 and 11. `DECISIONS_ON_MAIN` →
   `6c2f3daf046ec0008cad757465b67225bd0ad048e76542feaa19c6c765e785c0` and
   `DECISIONS_ON_MAIN_LEN` → `120943`, the byte offset of `\n## E-28 `.

The brief also names `hand-check-levels-verify.test.ts` and
`climate-far-phrases-verify.test.ts`. Both stay **green**, unmodified.

**Deliberately not done**

- No new tests. The deliverable is two record edits; the tester's verify file
  owns criteria 1–24.
- Did not touch E-25's `**Revisit when**` paragraph, E-27 (a)'s table, its
  counts, or the T-088 amendment (out of scope; criteria 13–15).
- Did not edit `tasks.md`'s T-091 entry. That is the reviewer's sweep.

**Contradictions with the brief:** none found. The bank's counts equal E-27
(b)'s.

**How to run**

```bash
cd question-bank && bun install --frozen-lockfile && bun test && bun run typecheck && bun run lint && bun run format:check
make -C backend test
cd frontend && bun install --frozen-lockfile && bun test
```

## Verdict

**TL;DR: all 24 criteria are met, and no criterion fails. The verdict is
held at `test changes requested`.** The edit to `engineering-decisions.md`
turns seven pre-existing guards red by design. They need a person's approval
before they change (rows below). This run is orchestrated, so nobody can
approve here. **Next:** start a `tester` in a session a person is attending.
It asks for approval of rows 1–7, applies the approved rows, re-runs the
suite, and writes the final verdict.

**What my independence rests on.** `$CLAUDE_CODE_REMOTE_SESSION_ID` is
`cse_011oDiJeSdbcuQndNDoPuD3h`, the same id as the expander's and the
worker's. That is because the orchestrator spawns every role under one remote
session (`runs/T-091-climate-cold-trade-accepted.md` exists). So the id check
proves nothing here. My independence rests only on being a freshly spawned
subagent with its own context: I did not see the work being done or the
worker's reasoning. That is weaker evidence than a separate session, because
it depends on the orchestrator having spawned me correctly.

**Test file:** `question-bank/src/climate-cold-trade-accepted-verify.test.ts`,
26 tests across 24 `describe`s, one per criterion. All 26 pass on this branch.
Baselines for main (`12d242e`) were recorded by running this same file in a
`git worktree` of `12d242e`, where criteria 13–21 passed. They are embedded
as digests, so the test never hands git a revision (T-081 guard). Criteria
5–7 compute their counts from `us-states.json` and each state's `climate_kid`.
The bank gives **22 / 18 / 8**, and the amendment states the same numbers.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | one T-091 marker in the climate bullet, after the T-090 one |
| 2–4 | met | Dkaattae, 2026-10-27, (a); `accept`, `unchanged`; `E-27` |
| 5 | met | bank 22; `22 of 50` in a sentence with "cold" |
| 6 | met | bank 18; `18 of 50` in a sentence naming Hawaii, California, Oregon |
| 7 | met | bank 8; the only number followed in its sentence by Washington and Oregon is 8 |
| 8, 9 | met | (b)/(c)/(d) with their key terms; NY, RI, CA and `too hard` |
| 10–12 | met | Owner line gone; Dkaattae/2026-10-27/T-091/E-25 present; `**47**`/`**0**` strings kept |
| 13–16 | met | byte digests equal main's; headings E-1..E-30 unchanged |
| 17–21 | met | bank, state files, content.json, source trees, dependency files equal main's |
| 22 | met | non-test files outside the allowed list equal main's (301); pre-existing test files equal main's |
| 23 | met | the new file has no fetch/URL/http import and spawns only `git ls-files` |
| 24 | **not yet green** | the 7 stale guards below; frontend is green in CI only (see suites) |

**Mutations (against the record and the bank, every one reverted, and
`engineering-decisions.md` checked with `cmp` against its backup):**

- `22 of 50` → `23 of 50`: criterion 5 red
- `18 of 50` → `17 of 50`: criterion 6 red
- `In 8` → `In 9`: criterion 7 red
- a second `Amended 2026-10-31 (T-091)`: criterion 1 red
- the Owner sentence put back in E-27 (b): criterion 10 red
- `by Dkaattae` → `by the owner` in E-27 (b): criterion 11 red
- `season word` → `season term`: criterion 8 red
- `too hard` → `hard`: criterion 9 red
- a whitespace edit in E-27 before `None of this…`: criterion 13 red
- a word added to the `### (c)` heading: criterion 14 red
- a space added in E-25's `**Revisit when**`: criterion 15 red
- a space added to the E-1 heading, and a line added in E-28: criterion 16 red
- a space appended to `us-state-wa.json`: criteria 18 and 22 red

**Suites (this run, on this branch with my test file):**

- **`question-bank`**: `bun test` 2666 pass / **6 fail**. All six are rows
  1–6 below. Typecheck, lint (`0 warnings and 0 errors`) and `format:check`
  are clean.
- **`make -C backend test`**: 743 pass, 9 skipped, **1 fail**, row 7.
- **`frontend` `bun test`**: 392 pass / 4 fail, all of them
  `Cannot find package 'react-simple-maps'`. This is environmental: the
  container's `node_modules` lacks it and the proxy blocks the install. In CI
  at `3123e26`, `frontend (typecheck, lint, test)` is **success**, and
  `frontend/` is byte-identical to main (criterion 20). The red CI jobs at
  `3123e26` are question-bank and the two backend jobs, which are the stale
  guards.

**Tests made stale: I checked the worker's list myself.** Each of the seven
fails is a byte pin that the T-091 edit to E-25 and E-27, or T-091's own
loop records, changed. None of them is red because code is wrong.
`hand-check-levels-verify.test.ts` and `climate-far-phrases-verify.test.ts`
stay green, and so does every other guard. I found no stale test the worker
missed.

**Observation for the reviewer.** `tasks.md` differs from main only by the
expander's `todo` → `doing` flip on T-091's heading. My criterion 22 test
treats that as the loop's own record, which is the same reading T-096's
tester made. It sits in criterion 22's allowed list in any case, as part of
the reviewer's `tasks.md` sweep.

**Note on row 5.** That guard pins the whole tracked-file set, so the brief
and run log of every later task break it. I cannot re-pin it to a digest
that includes this brief: the brief changes at every role's commit, and so
does the run log. This includes the commit that applies the request. That
leaves two ways to fix the row. Neither is clean, and the person approving
should choose:

- **Add the two T-091 loop records to its allowed set.** This keeps 297 and
  the sha. It is an exclusion, which E-30's rule forbids for content guards,
  but `4d5f283` already did it for `process-tasks.md` with Dkaattae's
  approval. This is the option I propose.
- **Refuse the row** and let the guard stay red until P-17's process task
  decides how loop records are pinned.

My own criterion 22 test has the same shape. A later task's tester will see
it go red for that task's records.

## Test change request

Every new pin is labelled with the commit it was recorded at:
`4818fc8` (the worker's commit, which holds the edited
`engineering-decisions.md`). Received values are from my run on this branch.
None of them adds a strip, reset or exclusion, except row 5, which is
flagged above.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` › `T-088 criteria 20-25: what must not change` › "criterion 25: outside E-25, engineering-decisions.md is main's; still E-1..E-30" | T-088 tester; last re-pinned `c5e0064` (T-096 row 1). Pins every E-n except E-25 | criterion 11 edits E-27 (b), which is outside E-25 | modify | same name and assertions; `MAIN_ED_OUTSIDE_E25_SHA` → `ee4ead2780b3eb34b59f6f378b798447a06f69310555a766631141c3c71ba9bd`, comment adds "re-pinned at `4818fc8` (T-091, Test change request row 1) after T-091 amended E-25 and E-27" || approved — Dkaattae, 2026-10-30, in the attended tester session ("approve all, Dkaattae") |
| 2 | `question-bank/src/seed-level-loose-ends-verify.test.ts` › `T-086 criteria 10-12: what must not move` › "criterion 12: engineering-decisions.md outside E-22's body is byte-identical to the branch head's" | T-086 tester; last re-pinned `8aea8b5` (T-088 row 15). Pins the file outside E-22 | criteria 1 and 11 edit E-25 and E-27 | modify | same name and assertions; `HEAD_OUTSIDE_E22_SHA` → `4493eb37a2179d39ba610aedf337db1118e40a43e6ae04fdedff8ee2c41bcdf4`, comment adds "Re-pinned at `4818fc8`: re-pinned T-091 (Test change request row 2, E-30), after T-091 amended E-25 and E-27" || approved — Dkaattae, 2026-10-30, in the attended tester session ("approve all, Dkaattae") |
| 3 | `question-bank/src/map-click-no-candidates-verify.test.ts` › `T-092 criterion 13: E-29 records the change; E-1..E-28 untouched` › "E-1..E-28 are byte-identical to 49444c8's, and there are 30 E-n headings at the branch head" | T-092 tester; last re-pinned `c5e0064` (T-096 row 2). Pins E-1..E-28 | criteria 1 and 11 edit E-25 and E-27 | modify | renamed "E-1..E-28 are byte-identical to 4818fc8's, and there are 30 E-n headings at the branch head"; inline digest → `82f931806649319e7a4995f9260051b340d4c5393472dee333f25f0c3e0a9d22`; both count assertions (30) unchanged; comment adds the T-091 row 3 re-pin || approved — Dkaattae, 2026-10-30, in the attended tester session ("approve all, Dkaattae") |
| 4 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `T-096 criteria 7-9: nothing about levels changes` › "criterion 9: engineering-decisions.md outside E-22's body is main's; headings unchanged" | `47581ea`, T-096 tester. Pins lines from E-23 to the end | criteria 1 and 11 edit E-25 and E-27 | modify | same name and assertions; `MAIN_ED_FROM_E23_SHA` → `c598bc8a37bb989e8256cf0eb53ad190450207b4d11c775a4af54eaa29fc280f`, comment "re-pinned at `4818fc8` (T-091, Test change request row 4)"; `MAIN_ED_THROUGH_E22_HEADING_SHA` unchanged || approved — Dkaattae, 2026-10-30, in the attended tester session ("approve all, Dkaattae") |
| 5 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `T-096 criteria 17-21: the bank and the boundaries` › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096 tester; allowed set widened in `4d5f283` (`process-tasks.md`). Pins the tracked non-test file set at 297 | T-091's own loop records, `tasks/T-091-climate-cold-trade-accepted.md` and `runs/T-091-climate-cold-trade-accepted.md`, are new tracked files (count 299) | modify | same name and assertions (`297` and `MAIN_UNTOUCHABLE_SHA` `1ac2ad79…` both unchanged); `CRITERION_21_ALLOWED` gains those two paths, with a comment citing T-091 Test change request row 5. **This is an exclusion. See "Note on row 5" above** || approved — Dkaattae, 2026-10-30, in the attended tester session ("approve all, Dkaattae") |
| 6 | `question-bank/src/familiarity-drawn-apart-verify.test.ts` › `T-085a criteria 17-22: E-22` › "criterion 22: every E-n entry other than E-22 is byte-identical to 6587ed0's" | T-085a tester; last re-pinned `8aea8b5` (T-088 row 17). Pins the file outside E-22 | criteria 1 and 11 edit E-25 and E-27 | modify | renamed "criterion 22: every E-n entry other than E-22 is byte-identical to 4818fc8's"; `BEFORE_ED_OUTSIDE_E22_SHA` → `572149631f0e348469449657e89234e941bb16464d4dc7d2f1c6278596ee827c`, comment adds the T-091 row 6 re-pin || approved — Dkaattae, 2026-10-30, in the attended tester session ("approve all, Dkaattae") |
| 7 | `backend/tests/test_t089_tester_criteria.py` › `test_criterion_13_e1_to_e27_are_byte_identical` | T-089 tester; last re-pinned `c5e0064` (T-096 row 3). Pins the byte prefix through E-27 | criteria 1 and 11 add bytes to E-25 and E-27 | modify | same name and assertions; `DECISIONS_ON_MAIN` → `6c2f3daf046ec0008cad757465b67225bd0ad048e76542feaa19c6c765e785c0`, `DECISIONS_ON_MAIN_LEN` → `120943` (the offset of `\n## E-28 `, which the second assert still checks); comment adds "Re-pinned at 4818fc8 (re-pinned T-091, Test change request row 7) after T-091 amended E-25 and E-27 (120943 bytes)" || approved — Dkaattae, 2026-10-30, in the attended tester session ("approve all, Dkaattae") |

## Notes

- **Worker (2026-10-30), model:** ran on the session model (Opus), not the
  Sonnet the brief suggested. The task was small enough that it made no
  difference.
- **Session id is shared with the expander's.** `$CLAUDE_CODE_REMOTE_SESSION_ID`
  returned `cse_011oDiJeSdbcuQndNDoPuD3h` for this worker too, because the
  orchestrator spawns roles as subagents under one remote session. Each role
  still had its own fresh context. Whether the tester accepts a matching id as
  "not the same session" is for the tester to judge against D-numbered
  isolation rules, or the human to confirm.
- **Counts reproduced:** I mapped each choice to a state by exact
  `climate_kid` equality, using the code from the file name. "Cold" is a
  case-insensitive substring. The results are 22 / 18 / 8, the same as E-27 (b).
- **Wording judgment:** the amendment says "accept the trade E-27 (b)
  describes" and lists exactly that trade, nothing broader. E-27 (b)'s "is the
  content call the brief left out of scope" became "was the content call T-090
  left out of scope", so the paragraph reads as settled. Reviewer to confirm
  this against the review checklist.
- **Pre-existing red on the branch:** T-096 criterion 21 (file count 299 vs
  297) was red before the worker started, caused by the expander's and
  orchestrator's new files. Tester to fold it into the Test change request.
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
