# T-079 — `highest_point_m` is the state's high point, not the mountain's summit

**Status:** `test changes requested`
**Next step:** `human`
**Approved:** orchestrator — 2026-10-06, unattended run. See `runs/T-079-highest-point-in-state.md`. Q3 values (CT 727.2, OK 1516.4, VA 1740.6) confirmed by Dkaattae in the orchestrator session; criteria not read.
**Test changes:** `requested`
**From:** [`tasks.md`](../tasks.md) T-079
**Branch:** `claude/great-keller-n8v6cq`
**PR:** #71, opened draft at expand time from the branch above.
**Fault:** All 21 criteria hold, but 11 pre-existing tests made stale by this task's own change are red and wait for a person's approval of the Test change request (D-14, D-15); nobody's fault.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-05 | cse_01F7wKd4WT75r6pKhzRsTbbB |
| task-expander | 2026-10-06 | cse_01F7wKd4WT75r6pKhzRsTbbB |
| worker | 2026-10-06 | cse_01F7wKd4WT75r6pKhzRsTbbB |
| tester | 2026-10-06 | cse_01F7wKd4WT75r6pKhzRsTbbB (orchestrator-spawned subagent; same id by construction, see Verdict) |

## Decision record (was: Why this is blocked)

**Resolved 2026-10-06.** The questions and answers stay here as the record the criteria rest on. The criteria below follow the answers.

**TL;DR:** All three bad values are confirmed. The criteria cannot be bounded until a person picks the rule, picks the mechanism, and picks the numbers. The draft criteria below assume the recommended answers. If you accept them, set `Next step: task-expander` and the next expander run freezes them as written, with the numbers filled in.

The `tasks.md` entry says this "needs a decision before a fix". `CLAUDE.md` also says "Flag uncertain data rather than silently picking a side", and this is a number a child will read. The expander may not make that call, and an orchestrated run has nobody to ask, so the run halts here.

### Q1 — What does `highest_point_m` mean?

- **(a) Recommended:** the elevation of the **highest point inside the state's borders**. A quiz that says "Connecticut's highest point is 748 m" is wrong today, because 748 m is in Massachusetts.
- **(b)** The elevation of the **feature named in `highest_point`**, wherever its summit is. This keeps CT 748 and OK 1737. Then a question template could never phrase this field as "the state's highest point".

### Q2 — Under (a), how do CT, OK and VA get a correct value?

Wikidata is not wrong about CT and OK. Its P610 for Connecticut is Mount Frissell (Q1950492), and 748 m is that mountain's summit. So no query change fixes those two. VA is different: Mount Rogers (Q688645) carries a single metre statement of 1825, which is simply off.

- **(i) Recommended:** **a curated override for `highest_point_m`**. It would be a field on `CuratedState` that **wins over Wikidata** for exactly these three states, with its source recorded beside it, and a build warning every time it replaces a Wikidata value.
  - This is the opposite of what `engineering-decisions.md` **E-8** settled for the sibling `highest_point` label ("fills a gap only, never overrides"). That is why it needs your yes and a new `E-19`, not a quiet extension.
- **(ii)** **Blank with a warning** for the three states. This follows "prefer a blank field to a guessed one" exactly, but it blanks values that have a good published source.
- **(iii)** **Fix Wikidata upstream and re-record.** No role in this loop can do this. It needs a live `bun run refresh`, which moves `built_at` in all 50 files and runs straight into T-070 (a). It also does not help CT or OK under (a), because their Wikidata items are correct about the mountain.
- (i) for CT and OK and (iii) for VA is also a legitimate answer.

### Q3 — Under (i), which source, and how precise?

T-069's 50-row cross-check recorded en.wikipedia "List of U.S. states and territories by elevation", **revision 1377209854**, which cites NGS datasheets and Peakbagger:

| State | Ships now | T-069's reference | Commonly quoted (expander's memory, **unverified**) |
|---|---|---|---|
| CT | 748 | 727.2 | 2,380 ft ≈ 725 m |
| OK | 1737 | 1516.4 | 4,973 ft ≈ 1,516 m |
| VA | 1825 | 1740.6 | 5,729 ft ≈ 1,746 m |

Pick the source of record (that revision, an NGS datasheet id, or another source) and the precision. The bank already mixes whole metres and decimals (AL 735.5, VT 1339.69), so either is consistent with the bank. The expander will not choose a number.

Also confirm the labels stay as they are under (a). CT keeps "Mount Frissell" and OK keeps "Black Mesa": each state's high point lies on that feature, just not at its summit. The draft below assumes yes.

### Answers — Dkaattae, 2026-10-06

Given in the orchestrator session as "accept the recommended answers". The orchestrator wrote it here.

- **Q1: (a).** `highest_point_m` is the highest point inside the state's borders.
- **Q2: (i).** A curated override for `highest_point_m` that wins over Wikidata for CT, OK and VA. Each override records its source and raises a build warning. Record it as a new E-19.
- **Q3: T-069's reference.** en.wikipedia "List of U.S. states and territories by elevation", revision 1377209854, at that source's one-decimal precision: **CT 727.2, OK 1516.4, VA 1740.6**. This was the only source of record the brief offered, so the orchestrator took it as the accepted answer.
- **Labels: unchanged.** CT keeps "Mount Frissell" and OK keeps "Black Mesa".

## Goal

Make `highest_point_m` mean one written-down thing for all 50 states, so a future "how high is X's highest point?" question is never true of a neighbouring state's mountain instead.

## Survey — what is already true

- **T-069 (PR #70) settled the unit**, and it is not the problem here. All three values are metre statements on Wikidata, and `resolveElevation` (`question-bank/src/normalize.ts:212`) ships them unchanged.
- **Where each value comes from:** `src/fixtures/us-states-elevation.sparql.json`.
  - CT: Q1950492, 748 m.
  - OK: Q880398, 1737 m.
  - VA: Q688645, 1825 m.
  - Each state has a single statement. None of them also carries a foot statement, so T-069's 1% disagreement warning never fires for them.
- **Shipped values:**
  - `data/us-states/us-state-ct.json:26` is `748`.
  - `us-state-ok.json:28` is `1737`.
  - `us-state-va.json:28` is `1825`.
- **No curated override exists for any Wikidata-sourced number.** `CuratedState` (`curated/us-states.ts:81`) has `highest_point` as a gap-filler only (E-8), and nothing else that touches elevation.
- **The other 47 states are within 0.7%** of T-069's reference (PR #70). This task does not revisit them.
- **Tests that pin the current values:** `highest-point-metres-verify.test.ts:385`, `:501` and `:537` pin `748`, `1737` and `1825` as default-branch lines. So do the four pinned-digest guards that T-070 owns. Any value change here makes some of them stale. That goes through the tester's Test change request (D-14, D-15), not the worker.

## Acceptance criteria

Frozen once approved. They encode **Q1 (a), Q2 (i), Q3 = T-069's reference at one decimal, labels unchanged** (answers above). The source of record throughout is en.wikipedia "List of U.S. states and territories by elevation", revision **1377209854**.

**Shipped data**

1. After an offline rebuild (`bun run build --offline` in `question-bank/`), `data/us-states/us-state-ct.json` has `highest_point_m` equal to `727.2`.
2. After the same rebuild, `us-state-ok.json` has `highest_point_m` equal to `1516.4`.
3. After the same rebuild, `us-state-va.json` has `highest_point_m` equal to `1740.6`.
4. In those three files, the only line that differs from the default branch at expand time (`323254c`) is the `highest_point_m` line. An offline build takes `built_at` from the fixture's capture time (`build.ts:148`), so it does not move.
5. The other 47 files in `data/us-states/` are byte-identical to `323254c`.
6. `highest_point` is unchanged in all 50 files: CT is still "Mount Frissell", OK "Black Mesa", VA "Mount Rogers".

**The curated override**

7. Exactly three states in the curated table (`CURATED_US_STATES`) carry a `highest_point_m` override: CT, OK and VA. The other 47 carry none.
8. Each of the three overrides records its source **as data a test can read**, not only as a comment, and that source string contains `1377209854`.

**Normalisation behaviour** (tests call `normalizeUsStates` directly on in-test rows)

9. For a state with a curated override and a Wikidata elevation that resolves to a value different from it, `normalizeUsStates` ships the override's value as `highest_point_m`.
10. In the case of criterion 9, given a row whose only elevation is a single metre statement, `normalizeUsStates` emits exactly one warning with `field: "highest_point_m"` for that entity, and its message contains both the Wikidata value and the curated value.
11. For a state with a curated override and **no** elevation statements at all, `normalizeUsStates` ships the override's value and emits exactly one `highest_point_m` warning for that entity, whose message contains the curated value.
12. For a state with a curated override whose only elevation statements are in a unit `resolveElevation` cannot read (e.g. no unit, or a unit that is neither metre nor foot), `normalizeUsStates` ships the override's value, and no `highest_point_m` warning for that entity contains the words "left blank".
13. For a state with **no** curated override, `normalizeUsStates` ships exactly the `metres` that `resolveElevation` returns for the same row, and its `highest_point_m` warnings for that entity are exactly `resolveElevation`'s warnings. Checked for at least one metre-stated row and one foot-only row.
14. For a state with no curated override and no elevation, `highest_point_m` stays absent from the entity, as today.
15. The `highest_point` **label** precedence is unchanged: when the row carries a P610 label and the curated table also has `highest_point`, the row's label ships (E-8).
16. The tests for criteria 9 to 15 reach no network and do not spawn `build.ts`.

**Decision record**

17. `engineering-decisions.md` gains an entry `E-19` that states: (a) the rule — `highest_point_m` is the elevation of the highest point inside the state's borders; (b) the mechanism — a curated `highest_point_m` that wins over Wikidata and warns at build time; (c) that this reverses E-8's "never overrides" for `highest_point_m` only, and leaves the `highest_point` label under E-8; (d) the three states with their values and the source of record, revision `1377209854`; (e) when an override is to be deleted (Wikidata comes to agree with it).
18. E-1 to E-18 in `engineering-decisions.md` are unchanged.

**What must not happen**

19. Both SPARQL fixtures under `question-bank/src/fixtures/` are byte-identical to `323254c`.
20. No dependency is added or changed: every `package.json` and `bun.lock` is byte-identical to `323254c`.
21. The whole `question-bank` suite, `typecheck`, `lint` and `format:check` pass. Any pre-existing test this change makes stale is changed only through a Test change request a person approves (D-14, D-15), never by the worker.

### Known stale tests (for the tester, not the worker)

These pre-existing tests assert the values or the warning count this task changes by design. They are expected to go through a Test change request:

- `src/highest-point-metres-verify.test.ts` `:385`, `:501`, `:537` pin `748`, `1737`, `1825`.
- `src/highest-point-metres.test.ts:406` asserts the full offline build emits no `highest_point_m` warning; criterion 10 makes it emit three.
- `src/highest-point-verify.test.ts:458` asserts the full offline build emits zero warnings of any field; same cause.
- The four pinned-digest guards T-070 (a) owns, for the three changed files.

The list may be incomplete; the tester runs the suite and finds the rest.

## Out of scope

- **The other 47 states' elevations.** T-069 cross-checked them; they are within 0.7%.
- **Any override of `highest_point` (the label)** or any other Wikidata field.
- **Re-recording either fixture, or editing Wikidata.** A person may do the latter by hand. It is not a criterion here.
- **Re-pinning the digest guards or adding a shared neutralisation helper.** That is T-070 (a). This task adds its exceptions through the tester's Test change request like every task before it.
- `openapi.yaml`, `backend/`, `content.json` and the served bank (T-040).
- `sample-data/` (T-064).

## Constraints

- **Files expected to change:**
  - `question-bank/src/curated/us-states.ts`
  - `question-bank/src/normalize.ts`
  - the three `data/us-states/us-state-{ct,ok,va}.json`
  - new test file(s) under `question-bank/src/`
  - `engineering-decisions.md`
- **Number source:** `727.2`, `1516.4`, `1740.6`, exactly as T-069 recorded them from revision 1377209854. Never a model's memory; the "commonly quoted" column above is not a source.
- **Warning field:** the override warning uses `field: "highest_point_m"` (criteria 10, 11), so it shows up in the build's warning output a person reads on refresh.
- **Rebuild offline only.** Use `rebuildOffline()` / `bun run build --offline`, which replays both recorded fixtures.
- **No dependency** without asking (`CLAUDE.md`).
- **This is child-facing data.** The reviewer escalates it as outside the envelope.

## Context

- `question-bank/src/normalize.ts`: `normalizeUsStates` (`:133-164`) and `resolveElevation` (`:186-255`).
- `question-bank/src/curated/us-states.ts`: the `CuratedState` interface (`:81`) and its header comment on provenance.
- `question-bank/src/queries/us-states-elevation.ts` explains why the elevation is read per statement.
- `question-bank/src/fixtures/us-states-elevation.sparql.json` has the CT, OK and VA rows quoted above.
- `engineering-decisions.md` **E-8** is the precedent this would reverse for one field, and **E-11/E-12** show the house style for a decision entry.
- `PROGRESS.md` T-069 entry, and PR #70's cross-check table.
- `tasks.md` T-079 and T-070 (a).
- `geoquizdataplan.md` §1.9 lists peak elevation as a field the bank carries.
- `CLAUDE.md` "Content rules".
- `test-guidelines.md`: below the transport, no network.

## Handoff

**TL;DR:** Built. CT, OK and VA now ship 727.2, 1516.4 and 1740.6 from a curated override that wins over Wikidata and warns on every build; the other 47 files are unchanged. Typecheck, lint and format:check are green. The suite is 1524 pass / **11 fail**, and all 11 are the stale tests listed below (baseline on this branch before the change: 1521 pass / 0 fail). Tester next, with a Test change request for the 11.

**Same session id as the expander.** The orchestrator ran the expander and worker under one remote session id (`cse_01F7wKd4WT75r6pKhzRsTbbB`). The tester must not run in it either. Orchestrator to confirm the tester's session is different.

### What changed, file by file

- **`question-bank/src/curated/us-states.ts`**:
  - new `CuratedElevation { metres; source }` interface and `HIGHEST_POINT_M_SOURCE` constant (contains `1377209854`);
  - `CuratedState.highest_point_m?: CuratedElevation`;
  - set on CT (727.2), OK (1516.4) and VA (1740.6) only;
  - a `highest_point_m` provenance paragraph in the header comment.
- **`question-bank/src/normalize.ts`**: new exported `resolveHighestPointMetres(row, curated)`. `normalizeUsStates` now calls it where it used to call `resolveElevation`.
  - No override: returns `resolveElevation(row)` unchanged.
  - With an override: ships `override.metres` and replaces `resolveElevation`'s warnings with exactly one. That warning names the Wikidata value ("instead of Wikidata 748"), or says Wikidata has none, or lists the statements it could not read. It never says "left blank". If Wikidata ever equals the override, it says "Wikidata now agrees … delete the override (E-19)".
- **`question-bank/data/us-states/us-state-{ct,ok,va}.json`**: only the `highest_point_m` line, from `bun run build --offline`.
- **`question-bank/src/highest-point-in-state.test.ts`** (new, 14 tests): worker tests for criteria 7–15, all calling `normalizeUsStates` on in-test rows.
- **`engineering-decisions.md`**: E-19 appended. E-1 to E-18 are untouched.

### Where each criterion lives

| # | Where |
|---|---|
| 1–3 | `data/us-states/us-state-{ct,ok,va}.json`; offline build output prints the three override warnings |
| 4–5 | `git diff 323254c -- question-bank/data` shows 3 files, 1 line each |
| 6 | labels untouched; `highest_point` logic in `normalize.ts` unchanged |
| 7–8 | `curated/us-states.ts` `highest_point_m` on CT/OK/VA; `source` is a string field |
| 9–12 | `normalize.ts` `resolveHighestPointMetres` |
| 13–14 | same function's no-override path, i.e. `resolveElevation` verbatim |
| 15 | `normalize.ts` `row.highestPoint ?? curated.highest_point`, unchanged |
| 17–18 | `engineering-decisions.md` E-19 |
| 19–20 | no fixture, `package.json` or `bun.lock` touched |

### How to run

```
cd question-bank
bun install --frozen-lockfile   # node_modules was absent in this container; no lockfile change
bun run build --offline
bun test src/highest-point-in-state.test.ts
bun test && bun run typecheck && bun run lint && bun run format:check
```

### Deliberately not done

- **No stale test was changed.** That is D-14: the tester's job.
- **No digest re-pin.** That belongs to T-070 (a).
- **No fixture re-record.**
- **The override warnings stay on in every build.** That is by design (criteria 10 and 11): they are how a person on refresh sees the override is still live.

### Contradiction with the brief

- **The pins at `highest-point-metres-verify.test.ts:385`, `:501` and `:537` did not go red.** The brief expected them to; they pass, so they must read Wikidata/fixture values rather than shipped ones. The T-069 tests that did go red are listed below.

### Tests made stale

All 11 pass on this branch before the change and fail after it, by design.

**`src/highest-point-metres-verify.test.ts`**

1. `T-069 tester, criterion 11 — only unit-corrected states moved > every state whose recorded unit is metre (and only metre) keeps main's highest_point_m bytes`
   - Why: CT, OK and VA are metre-stated and now move (criteria 1–3).
   - Proposal: modify it to exclude states with a curated `highest_point_m`.
2. `T-069 tester, criterion 11 — only unit-corrected states moved > the changed set is exactly the states whose recorded unit is not metre: AZ, IA, KS, NE, OR`
   - Why: same cause.
   - Proposal: modify it to compare the T-069 baseline to a T-079-aware set, or exclude the overridden states.
3. `T-069 tester, criterion 15 — no hand-written elevation > curated/us-states.ts names no elevation, highest_point_m or unit item`
   - Why: criteria 7 and 8 require exactly this field.
   - Proposal: delete it, or narrow it to "only CT/OK/VA, each with a source".
4. `T-069 tester, criterion 15 — no hand-written elevation > no non-test source under src/ holds a shipped highest_point_m value as code`
   - Why: 727.2, 1516.4 and 1740.6 are now code in `curated/us-states.ts` (criterion 7).
   - Proposal: modify it to allow the three curated values in that file.

**`src/highest-point-metres.test.ts`**

5. `criterion 14: the elevation recording says where it came from > the full offline build warns about no elevation`
   - Why: criterion 10 makes the build emit three.
   - Proposal: modify it to expect exactly the CT/OK/VA override warnings.

**`src/highest-point-verify.test.ts`**

6. `T-016 tester, criterion 9 — the full fixture build warns about nothing at all > and zero warnings of any other field — the default branch's count is 0`
   - Why: same cause.
   - Proposal: modify it to expect only the three `highest_point_m` warnings.
7. `T-016 tester, criterion 6 — the other 49 files, index.json and the sample are untouched > each of the 49 non-Alaska state files matches the default branch once T-017's region line and T-068's top_livestock line are dropped`
   - Why: this is a pinned-digest guard.
   - Proposal: neutralise `highest_point_m` for CT, OK and VA (T-070 (a) pattern).

**`src/climate-kid-verify.test.ts`**

8. `T-014 tester, criterion 15 — nothing but climate_kid moves in the bank > each of the 50 files, with climate_kid, top_crops and top_livestock removed, digests to the default branch's value`
   - Why: pinned-digest guard.
   - Proposal: same neutralisation.

**`src/landmarks-verify.test.ts`**

9. `T-013 tester, criterion 9 — nothing but landmark moves in the bank > each of the 50 files, with landmark, climate_kid, top_crops and top_livestock removed, is identical to the default branch's`
   - Why: pinned-digest guard.
   - Proposal: same neutralisation.

**`src/top-crops-verify.test.ts`**

10. `T-015 tester, criterion 13 — nothing else in the bank moves > each of the 50 files, with top_crops put back to [], Alaska's highest_point line stripped, region removed and top_livestock removed, digests to the default branch's bytes`
    - Why: pinned-digest guard.
    - Proposal: same neutralisation.

**`src/refresh.test.ts`**

11. `criteria 3, 6–9, 11 — a changed refresh > exits 0, prints the one change old → new, never \`bank unchanged\` or built_at`
    - Why: the build's warning lines also start with `  us-state-`. The three new override warnings push the count of such stdout lines from 1 to 4. This is not on the brief's list.
    - Proposal: modify the filter to count only change lines (those containing `→`), or expect 4.

**No count floors found** that pin a test count in these files. The tester should still confirm this.

## Verdict

**TL;DR:** Every one of the 21 criteria holds, and my 114 new tests pass. The verdict is not **pass** yet, because 11 older tests are red. This task's own change made them stale, and none of them points to a bug. They wait on the Test change request below, which a person has to approve in an attended tester session. Next step: **human**.

**Independence: weaker than a separate session.** My session id `cse_01F7wKd4WT75r6pKhzRsTbbB` is the same one listed for the expander and the worker. This run is orchestrated (`runs/T-079-highest-point-in-state.md` exists), and every role the orchestrator spawns shares that id, so the id check cannot show separation here. What I can claim is narrower: I am a freshly spawned agent with my own context. I did not see the work being done or the worker's reasoning, only what is committed. That rests on the orchestrator having spawned me correctly, which I cannot check myself.

**Suite on `claude/great-keller-n8v6cq`** (`question-bank/`, after `bun install --frozen-lockfile`, which changed no tracked file):

- `bun test`: **1638 pass, 11 fail** (1649 tests, 26 files). The 11 failures are exactly the Handoff's **Tests made stale** list, and nothing else fails.
- `typecheck`, `lint` and `format:check`: all green.
- New file: `question-bank/src/highest-point-in-state-verify.test.ts`, 114 tests, all green. The worker's `highest-point-in-state.test.ts` is also green.

### Criteria

Expected values come from the criteria and from digests of `323254c` (`git show 323254c:<path> | sha256sum`). None was read out of the code.

| # | Verdict | Evidence (test describe in `highest-point-in-state-verify.test.ts`) |
|---|---|---|
| 1–3 | met | `criteria 1-3`: offline rebuild (`rebuildOffline`, dead proxy) gives CT 727.2, OK 1516.4, VA 1740.6, and the committed file equals the rebuilt bytes |
| 4 | met | `criterion 4`: putting main's `748`/`1737`/`1825` back on the single `highest_point_m` line reproduces main's sha256 exactly |
| 5 | met | `criterion 5`: the 47 other state files each digest to `323254c`'s value. `index.json` is also unchanged (`git diff`), though the criterion does not name it |
| 6 | met | `criterion 6`: CT, OK and VA labels are unchanged, and the other 47 match byte for byte |
| 7 | met | `criterion 7`: the overrides are exactly CT/OK/VA = 727.2/1516.4/1740.6. The other 47 have no `highest_point_m` key, and the table has 50 states |
| 8 | met | `criterion 8`: each `source` is a string field containing `1377209854` |
| 9 | met | `criterion 9`: all three states with a differing metre statement, a multi-statement case, a foot-only case and a value 0.1 m off |
| 10 | met | `criterion 10`: exactly one warning, containing both values, for all three states. A neighbour in the same batch gets none |
| 11 | met | `criterion 11`: no statements, or an empty list, ships the override with exactly one warning that contains it |
| 12 | met | `criterion 12`: no unit, Q199, kilometre, two unreadable statements, or a unitless main-query value. Each ships 727.2 with no "left blank" |
| 13 | met | `criterion 13`: six non-override rows (metre, foot-only, multi-metre, disagreeing metre/foot, unreadable unit, unitless). `metres` and warnings equal `resolveElevation`'s |
| 14 | met | `criterion 14`: CO, AK and RI with no elevation have no `highest_point_m` key |
| 15 | met | `criterion 15`: Alaska's row label beats its curated `highest_point`, the curated one fills the gap, and CT's row label is kept |
| 16 | met | The criteria 9–15 tests call `normalizeUsStates` / `resolveElevation` directly, with no transport, spawn or `fetch`. Only the criteria 1–3 rebuild spawns `build.ts`, offline |
| 17 | met | `criterion 17`: E-19 exists once and covers (a) through (e). I also read it in full: it matches the brief's answers |
| 18 | met | `criterion 18`: everything before `## E-19` digests to `323254c`'s whole file |
| 19 | met | `criterion 19`: both fixtures digest to `323254c` |
| 20 | met | `criterion 20`: the six tracked `package.json`/`bun.lock` digest to `323254c`, and no other is tracked |
| 21 | **not yet** | typecheck, lint and format are green. The suite has 11 stale reds, waiting on the request below |

### Mutations (each reverted; `git status` clean afterwards)

| Mutation | Red in my file |
|---|---|
| Override ignored (`resolveHighestPointMetres` always returns Wikidata) | 23 (crit 1–3, 9–12) |
| Wikidata's own warnings kept beside the override message | 5 (crit 12, "left blank") |
| Wikidata value dropped from the override message | 4 (crit 10) |
| No-override path drops `resolveElevation`'s warnings | 3 (crit 13) |
| Label precedence swapped (`curated ?? row`) | 1 (crit 15) |
| CT curated 727.2 → 727 | 12 (crit 1, 7, 9–12) |
| No warning when Wikidata has no elevation | 4 (crit 11) |
| CT label edited in the data file; CO data file given one extra byte | crit 1, 4, 5, 6 |

### Stale tests checked

- **All 11 are stale, and each is red only because of a change the criteria require.**
  - Rows 1–2 and 4: the CT/OK/VA values move.
  - Row 3: the curated table now carries `highest_point_m`.
  - Rows 5–6: the three override warnings.
  - Rows 7–10: CT/OK/VA digests.
  - Row 11: three extra `  us-state-…highest_point_m:` warning lines in refresh stdout (`refresh.ts:380`).
- **None hides a bug.** The four digest guards stop at the first mismatching file, so they cannot show whether anything beyond CT/OK/VA moved. My criterion 5 test can: the other 47 files are byte-identical.
- **I found no stale test beyond the worker's 11.** The brief's `:385/:501/:537` pins pass, as the worker said.
- **Count floors:**
  - `climate-kid.test.ts` pins `landmarks-verify.test.ts` at ≥36 tests and ≥69 `expect(`. Row 9 is a modify, so the floor still holds.
  - No floor covers the other affected files.
  - `region-vocabulary.test.ts`'s structural checks on the four guards are unaffected by these rows.

### For the reviewer, not criteria failures

- **The override warning prints on every build, by design (criteria 10–11).** So a build or refresh now always has 3 warning lines.
- **An override equal to Wikidata still ships and warns "delete the override".** The criteria do not cover it either way. The worker's Note flags it for the reviewer.

## Test change request

Raised by the T-079 tester, 2026-10-06. No row has been applied. **Approval must come from a person, in an attended `tester` session** (D-15). The orchestrator cannot give it.

**Neutralisation used by rows 7–10:** put back the default-branch `highest_point_m` for the three T-079 files: `us-state-ct.json` → `748`, `us-state-ok.json` → `1737`, `us-state-va.json` → `1825`. Do this the same way each guard already restores T-069's five files. In the guards that rewrite the raw line, widen the line regex from `\d+` to `[\d.]+` so that it matches `727.2`. Leave the other 47 files untouched by it. Each guard also gets a check that the T-079 restore is not a no-op: after the restore, CT's line reads `748`. A comment cites T-079 and this request.

| # | Test (file › describe › name) | Introduced | Why stale | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `src/highest-point-metres-verify.test.ts` › "T-069 tester, criterion 11 — only unit-corrected states moved" › "every state whose recorded unit is metre (and only metre) keeps main's highest_point_m bytes" | `1386de3`, T-069 tester. Protected the rule that only unit-corrected states moved | Criteria 1–3 move CT, OK and VA, which are metre-only | modify | "…keeps main's highest_point_m bytes, except CT, OK, VA (T-079 overrides)". The metre-only set minus exactly `{ct, ok, va}` has the same `elevationLine` as `MAIN_AT_E10F94D`. Add a second assertion: for CT/OK/VA the line now equals the curated value (727.2/1516.4/1740.6), so the exclusion pins the new value and does not merely skip it | |
| 2 | same file › same describe › "the changed set is exactly the states whose recorded unit is not metre: AZ, IA, KS, NE, OR" | `1386de3`, T-069 tester. Same | Same cause: the changed set is now 8 | modify | "the changed set is the non-metre states AZ, IA, KS, NE, OR plus the T-079 overrides CT, OK, VA". The changed set equals the sorted 8 files exactly. The non-metre part still equals `notMetre` | |
| 3 | same file › "T-069 tester, criterion 15 — no hand-written elevation" › "curated/us-states.ts names no elevation, highest_point_m or unit item" | `1386de3`, T-069 tester. Protected against a hand-written elevation | Criteria 7–8 require exactly that field on three states | modify | "curated/us-states.ts holds highest_point_m only for CT, OK, VA, each with a source naming 1377209854, and names no unit item". Through `CURATED_US_STATES`: the overrides are exactly those 3 postals, each `source` contains `1377209854`. The file text still matches no `Q11573` or `Q3710` | |
| 4 | same file › same describe › "no non-test source under src/ holds a shipped highest_point_m value as code" | `1386de3`, T-069 tester. Same | Criterion 7 puts 727.2, 1516.4 and 1740.6 in `curated/us-states.ts` as code | modify | "no non-test source under src/ holds a shipped highest_point_m value as code, except the three T-079 overrides in curated/us-states.ts". Hits equal exactly `["/src/curated/us-states.ts: 727.2", "…: 1516.4", "…: 1740.6"]` in any order. Any other hit, including those values in any other file, fails | |
| 5 | `src/highest-point-metres.test.ts` › "criterion 14: the elevation recording says where it came from" › "the full offline build warns about no elevation" | `e64b016`, T-069 worker. Protected a clean build | Criteria 10–11 make the build warn once per override | modify | "the full offline build's only highest_point_m warnings are the three T-079 overrides". `highest_point_m` warnings map to entities exactly `["us-state-ct", "us-state-ok", "us-state-va"]`. Each message contains its curated value and the Wikidata value (748/1737/1825) | |
| 6 | `src/highest-point-verify.test.ts` › "T-016 tester, criterion 9 — the full fixture build warns about nothing at all" › "and zero warnings of any other field — the default branch's count is 0" | `34a174a`, T-016 tester. Protected a zero-warning build | Same cause | modify | "and no warnings besides the three T-079 highest_point_m overrides". The warnings list has length 3, every warning is `field: "highest_point_m"`, and entities are exactly CT, OK, VA. Warnings of any other field: `[]` | |
| 7 | `src/highest-point-verify.test.ts` › "T-016 tester, criterion 6 — the other 49 files, index.json and the sample are untouched" › "each of the 49 non-Alaska state files matches the default branch once T-017's region line and T-068's top_livestock line are dropped" | `c37381b`, T-017 worker (pinned-digest guard). Protected "nothing else moves" | CT/OK/VA digests change (criteria 1–3) | modify | Same name, extended with "…and T-079's three highest_point_m lines restored". The T-079 neutralisation above is applied; the digests are unchanged | |
| 8 | `src/climate-kid-verify.test.ts` › "T-014 tester, criterion 15 — nothing but climate_kid moves in the bank" › "each of the 50 files, with climate_kid, top_crops and top_livestock removed, digests to the default branch's value" | `775671c`, T-014 tester. Same kind of guard | Same | modify | T-079 neutralisation on the parsed object (`parsed["highest_point_m"] = 748/1737/1825` for those three files). Digests unchanged | |
| 9 | `src/landmarks-verify.test.ts` › "T-013 tester, criterion 9 — nothing but landmark moves in the bank" › "each of the 50 files, with landmark, climate_kid, top_crops and top_livestock removed, is identical to the default branch's" | `8b5bb81`, T-013 tester. Same | Same | modify | As row 8. Keeps the file at or above the `climate-kid.test.ts` floor of 36 tests / 69 expects | |
| 10 | `src/top-crops-verify.test.ts` › "T-015 tester, criterion 13 — nothing else in the bank moves" › "each of the 50 files, with top_crops put back to [], Alaska's highest_point line stripped, region removed and top_livestock removed, digests to the default branch's bytes" | `313d72d`, T-015 tester. Same | Same | modify | As row 7: raw-line restore with the regex widened to `[\d.]+`. Digests unchanged | |
| 11 | `src/refresh.test.ts` › "criteria 3, 6–9, 11 — a changed refresh" › "exits 0, prints the one change old → new, never `bank unchanged` or built_at" | `321cf65`, T-063 worker. Protected "exactly one change line" | The three override warnings print as `  us-state-…highest_point_m: …` and match the `  us-state-` prefix filter | modify | Same name. Count only change lines: stdout lines starting `  us-state-` **and containing ` → `** must have length 1. Add an assertion that the only other `  us-state-` lines are exactly the three `highest_point_m` override warnings (CT, OK, VA) | |

There are no deletions, so no count floor drops.

## Notes

- **expander, 2026-10-06: Q3 was inferred, not explicitly answered.** The recorded answer was "accept the recommended answers". Q3 offered no recommendation. The orchestrator took T-069's reference (the only source of record the brief named) and its one-decimal precision. The criteria freeze those numbers. **Whoever approves this brief is confirming `727.2 / 1516.4 / 1740.6` from revision 1377209854.** If that approval comes from the orchestrator unread, the reviewer's escalation of child-facing data is the first point at which a person sees them.
- **expander: criterion 11 is a choice the answers implied.** Q2 (i) said each override "raises a build warning". The expander read that as covering the case where Wikidata has no value too, so an override never applies silently.
- **expander: survey still holds.** The default branch is `323254c` (origin/main unchanged since the first expansion). Nothing in this task is already done.
- **worker, 2026-10-06: one warning replaces `resolveElevation`'s warnings when an override applies.**
  - What I decided: Wikidata's unit-disagreement and "left blank" messages describe a value that is not shipped, so they are folded into the single override message.
  - Why: criteria 10 and 12 together point this way, and "left blank" would be false.
  - Owner: reviewer to confirm or overturn.
- **worker: the warning wording is neutral** ("used curated X (source) instead of Wikidata Y").
  - What I decided: I dropped a draft clause saying the Wikidata value "is not the highest point inside the state".
  - Why: for VA the problem is a wrong number, not an out-of-state summit.
  - Owner: reviewer to confirm.
- **worker: an override that equals Wikidata still ships, and warns "delete the override".**
  - What I decided: this is the E-19 (e) deletion trigger, made visible in the build output.
  - Owner: reviewer to confirm.
- **worker: `node_modules` was missing in the container.**
  - What I did: before `bun install --frozen-lockfile`, typecheck, lint and the T-066 tests failed for that reason alone. The install changed no tracked file.
