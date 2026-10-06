# T-079 — `highest_point_m` is the state's high point, not the mountain's summit

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-10-06, unattended run. See `runs/T-079-highest-point-in-state.md`. Q3 values (CT 727.2, OK 1516.4, VA 1740.6) confirmed by Dkaattae in the orchestrator session; criteria not read.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-079
**Branch:** `claude/great-keller-n8v6cq`
**PR:** #71, opened draft at expand time from the branch above.
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-05 | cse_01F7wKd4WT75r6pKhzRsTbbB |
| task-expander | 2026-10-06 | cse_01F7wKd4WT75r6pKhzRsTbbB |

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

## Verdict

## Notes

- **expander, 2026-10-06: Q3 was inferred, not explicitly answered.** The recorded answer was "accept the recommended answers". Q3 offered no recommendation. The orchestrator took T-069's reference (the only source of record the brief named) and its one-decimal precision. The criteria freeze those numbers. **Whoever approves this brief is confirming `727.2 / 1516.4 / 1740.6` from revision 1377209854.** If that approval comes from the orchestrator unread, the reviewer's escalation of child-facing data is the first point at which a person sees them.
- **expander: criterion 11 is a choice the answers implied.** Q2 (i) said each override "raises a build warning". The expander read that as covering the case where Wikidata has no value too, so an override never applies silently.
- **expander: survey still holds.** The default branch is `323254c` (origin/main unchanged since the first expansion). Nothing in this task is already done.
