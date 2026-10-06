# T-079 — `highest_point_m` is the state's high point, not the mountain's summit

**Status:** `answered — awaiting re-expansion`
**Next step:** `task-expander` — Q1 to Q3 answered below; finalise the criteria.
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-079
**Branch:** `claude/great-keller-n8v6cq`
**PR:** #71, opened draft at expand time from the branch above.
**Fault:** The fix needs a rule chosen first. Which elevation `highest_point_m` means, whether a curated value may override Wikidata, and which source and precision to use are product and data calls. `tasks.md` reserves them for a person.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-05 | cse_01F7wKd4WT75r6pKhzRsTbbB |

## Why this is blocked

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

## Acceptance criteria — DRAFT, not approvable until Q1 to Q3 are answered

These assume **Q1 (a), Q2 (i), and the labels unchanged**. `‹CT›`, `‹OK›` and `‹VA›` stand for the Q3 numbers. A different answer to Q1 or Q2 replaces this list.

1. After an offline rebuild, `data/us-states/us-state-ct.json` has `highest_point_m` equal to `‹CT›`. `us-state-ok.json` has `‹OK›` and `us-state-va.json` has `‹VA›`.
2. The other 47 files in `data/us-states/` are byte-identical to the default branch at expand time (`323254c`).
3. `highest_point` is unchanged in all 50 files. CT is still "Mount Frissell", OK "Black Mesa" and VA "Mount Rogers".
4. Each of the three override values sits in `curated/us-states.ts` next to a source citation naming the Q3 source of record. That means the revision id, or the datasheet id.
5. `normalizeUsStates`, given a row whose Wikidata elevation resolves to a value **and** a curated override for that state, ships the override's value.
6. In the same case as criterion 5, `normalizeUsStates` emits exactly one warning with `field: "highest_point_m"` for that entity. Its message contains both the Wikidata value and the curated value.
7. `normalizeUsStates` ships exactly what `resolveElevation` returns for a state with no curated override, and emits no new warning for it. Check one metre-stated state and one foot-only state.
8. `normalizeUsStates` ships the curated value, and emits no "left blank" warning, for a state with a curated override and **no usable Wikidata elevation** (no statements, or only statements in a unit it cannot read).
9. The precedence of the `highest_point` label is unchanged. Wikidata's P610 label still wins over `curated.highest_point` when present (E-8).
10. The criteria 5 to 9 tests call `normalizeUsStates` (or `parseUsStates` followed by `normalizeUsStates`) directly, on in-test rows. They reach no network and do not spawn `build.ts`.
11. `engineering-decisions.md` gains an `E-19` that states:
    - the rule from Q1;
    - the override mechanism, and that it reverses E-8's "never overrides" for `highest_point_m` only;
    - the three states and the source for each;
    - when an override should be deleted (Wikidata comes to agree).
12. E-1 to E-18 are unchanged.
13. Both SPARQL fixtures under `src/fixtures/` are byte-identical to `323254c`.
14. No dependency is added or changed. Every `package.json` and `bun.lock` is unchanged.
15. The whole `question-bank` suite, typecheck, lint and `format:check` pass. Any pre-existing test made stale goes through a Test change request approved by a person, and is never edited by the worker.

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
- **Number source:** the bank's numbers come from the source of record named in Q3's answer, never from a model's memory. The table above is context, not a source.
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

## Verdict

## Notes
