# T-068 — US livestock/poultry per state, separate from crops

**Status:** `approved — ready for review, escalated (openapi.yaml changed; child-facing text)`
**Next step:** `human` — Dkaattae reads the picks on PR #69 and merges, or not
**Approved:** `Dkaattae — 2026-10-03, in chat (session_018ET4S26HVxh9FbiQMgTU3y), with the expander's defaults for field name, placement, and livestock scope`
**Test changes:** `approved — Dkaattae, 2026-10-03`
**From:** [`tasks.md`](../tasks.md) T-068
**Branch:** `claude/next-task-queue-3ynpc7` — assigned to the expander's session
by the harness (Claude Code on the web), so `task/T-068-top-livestock` was not
available. Every later role pushes here (`CLAUDE.md` "Branches").
**PR:** #69 (https://github.com/Dkaattae/geo-discovery-zone/pull/69), opened
draft at expand time, built from the branch above. Stays draft until the reviewer
approves
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-03 | cse_018ET4S26HVxh9FbiQMgTU3y |
| worker | 2026-10-03 | cse_018ET4S26HVxh9FbiQMgTU3y (same remote session id as the expander: the orchestrated run spawns roles as subagents inside one web session, so the env var does not distinguish them) |
| tester | 2026-10-03 | cse_018ET4S26HVxh9FbiQMgTU3y (same id again: orchestrated run, spawned as a fresh subagent; see Verdict) |
| tester | 2026-10-03 | cse_01XJBrfMf9E8iwaLHeYwbwoU (attended session; applied the approved test change request and wrote the final verdict) |
| reviewer | 2026-10-03 | cse_018ET4S26HVxh9FbiQMgTU3y (orchestrated; fresh subagent, shared session id) |

## Goal

Give each state a hand-curated, kid-facing `top_livestock` list — the farm
animals and animal products it is genuinely known for (Wisconsin dairy, Delaware
and Arkansas chickens) — as the sibling to `top_crops` that T-015 deliberately
left out, so the `agriculture` topic can ask about farm animals without making
"what grows" wrong.

## Already true — do not rebuild

- **The route exists end to end** (T-015, PR #46, E-7): a field on
  `CuratedState` in `question-bank/src/curated/us-states.ts`, folded in by
  `normalize.ts:152` as `curated.top_crops ?? []`, rebuilt offline into the 50
  tracked files. `top_livestock` copies that shape; it is not a design.
- **`top_crops` already excludes livestock words**, enforced by
  `top-crops-verify.test.ts` criterion 4 (14 words). That stays as it is.
- **`bun run refresh` (T-063) needs no change**: `diffEntity` in `refresh.ts`
  walks keys generically, so a new array field is diffed without being named.
- **Decided in this brief, for approval** (the queue entry's two open questions):
  - **Field name:** `top_livestock` in the pipeline, `topLivestock` in
    `openapi.yaml`, `top_livestock` on the backend's `Entity` model — exactly
    parallel to `top_crops` / `topCrops`.
  - **Exposure:** the contract and the backend model gain the field now, so
    T-040's loader has a slot to fill rather than a contract change to make. No
    question template uses it: templates do not exist yet (T-020, T-026).
  - **What counts as livestock here:** farm animals raised for food and the food
    they produce — cattle, dairy, poultry, eggs, hogs, sheep, goats. **Farm-raised
    fish (e.g. Mississippi catfish) and horses are out** of this field: neither is
    what a child means by a farm animal on a "what does this state raise" question,
    and folding them in is a call this brief does not get to make quietly. A
    reviewer who disagrees sends it back here.

## Acceptance criteria

"The 50 tracked files" means `question-bank/data/us-states/us-state-*.json`
(not `index.json`). "The base commit" means `ed229805de735f7dc9b84c3bb4c21fbae270b7b0`,
the default branch this brief was written against.

**Shape of the data**

1. Every one of the 50 tracked files has a `top_livestock` key whose value is a
   JSON array. The key is present even when the array is empty — no file omits it.
2. Every `top_livestock` array has length 0, 1 or 2. None has 3 or more.
3. The `top_livestock` arrays of **DE**, **AR** and **WI** are each non-empty.
4. Every string in every `top_livestock` array is non-empty, has no leading or
   trailing whitespace, and equals its own lower-cased form.
5. No `top_livestock` array contains the same string twice.
6. Every string in every `top_livestock` array contains (case-insensitive
   substring) at least one of: `cattle`, `beef`, `dairy`, `milk`, `poultry`,
   `chicken`, `broiler`, `turkey`, `egg`, `hog`, `pig`, `swine`, `cow`,
   `livestock`, `sheep`, `lamb`, `goat`.
7. No string in any `top_livestock` array contains (case-insensitive substring)
   `fish`, `catfish`, `trout`, `salmon`, `shrimp`, `oyster`, `horse` or `bee`.
8. No string in any state's `top_livestock` equals (case-insensitive) any string
   in any state's `top_crops`.

**Where it comes from**

9. For each of the 50 states, the tracked file's `top_livestock` deep-equals the
   value exported for that postal code by `CURATED_US_STATES` in
   `question-bank/src/curated/us-states.ts`, or `[]` where that entry does not set
   it.
10. Calling `normalizeUsStates` (offline, on the committed fixture) yields an
    entity with `top_livestock: []` — key present — for a state whose curated
    entry sets no livestock, and the curated array unchanged for one that does.
11. An offline rebuild (the existing `rebuildOffline` harness) writes the 50 files
    byte-identical to the tracked ones, and a second consecutive offline rebuild
    writes them byte-identical again.

**Nothing else moved**

12. For each of the 50 tracked files, the parsed JSON with the `top_livestock`
    key deleted deep-equals the parsed JSON of the same file at the base commit —
    `sources.built_at` included.
13. `question-bank/data/us-states/index.json` is byte-identical to the base commit.
14. Nothing under `question-bank/sample-data/` differs from the base commit
    (T-064's territory, frozen on purpose).
15. `backend/app/data/content.json` is byte-identical to the base commit.
16. Each of the four pinned-digest guards — in `landmarks-verify.test.ts`,
    `climate-kid-verify.test.ts`, `top-crops-verify.test.ts` and
    `highest-point-verify.test.ts` — still fails when a field **other than**
    `top_livestock` is altered in a tracked file (for example one state's
    `capital`, or one state's `top_crops`). Whatever lets them pass with the new
    key removes `top_livestock` and nothing else.

**Contract and backend**

17. `openapi.yaml`'s `Entity` schema has a `topLivestock` property of
    `type: array` with `items.type: string`, and `topCrops` is still present with
    the same type.
18. The backend's `Entity` model (`backend/app/models.py`) accepts
    `top_livestock` as an optional list of strings, serialised as `topLivestock`,
    and `top_crops` is still present.
19. The backend's existing contract tests — which walk `openapi.yaml` against the
    models in both directions — pass with the new field.

**Recorded**

20. `engineering-decisions.md` gains a new entry, **E-18**, whose heading names
    `top_livestock`. It states the field name, the exposure decision above, the
    boundary between this field and `top_crops`, that fish and horses are
    excluded, and that the values are hand-curated rather than fetched.
21. E-18 lists, by postal code, every state whose `top_livestock` is `[]`, and that
    list equals exactly the set of tracked files with an empty `top_livestock`.
22. No existing `E-1` … `E-17` entry in `engineering-decisions.md` is changed.
23. The header comment of `question-bank/src/curated/us-states.ts` carries a
    `top_livestock` provenance paragraph that names T-068 and says the strings are
    the reviewed kid-facing text, with no separate review pass.

**Must not happen**

24. No new dependency: `question-bank/package.json`, `question-bank/bun.lock`,
    `backend/pyproject.toml` and `backend/uv.lock` are byte-identical to the base
    commit.
25. No test reaches the network: the whole `question-bank` suite and the whole
    backend suite pass with CI's dead-proxy environment (`.github/workflows/ci.yml`).
26. The whole `question-bank` suite (`cd question-bank && bun test`), the backend
    suite (`make -C backend test`) and `bun run format:check` / `bun run lint` in
    `question-bank/` all pass.

## Out of scope

- **Any question template** for `agriculture` or anything else (T-020, T-026).
- **`backend/app/data/content.json`** and any loader into it (T-040).
- **`question-bank/sample-data/`** — not edited, not re-pointed (T-064).
- **Settling T-070.** This task adds one neutralisation to the existing digest
  guards, the way they already handle `top_crops`; it does not re-pin them or
  introduce a shared helper. Say so on the PR, as the T-068 entry asks.
- **`top_crops` values.** Not a single crop string changes, even if one looks
  wrong; file a queue entry instead.
- **Fish, aquaculture, horses, bees/honey** — excluded by criterion 7.
- **A live USDA source** (E-7's reasoning holds unchanged).
- **The frontend** — it neither reads nor renders this field.
- `highest_point_m`'s unit bug (T-069) and bare-QID labels (T-077), even though
  both live in the same files.

## Constraints

- **Files expected to change:** `question-bank/src/curated/us-states.ts`,
  `question-bank/src/types.ts`, `question-bank/src/normalize.ts`, the 50 tracked
  `question-bank/data/us-states/us-state-*.json` (by offline rebuild only, never by
  hand), `openapi.yaml`, `backend/app/models.py`, `engineering-decisions.md`.
- **Existing tests are not the worker's to edit** (`.claude/agents/tester.md`,
  D-14). Adding a key to all 50 files will turn existing tests red **by design**:
  the four pinned-digest guards (criterion 16) and the five tests that compare the
  tracked Colorado against `sample-data/us-state-co.json` (`committed-bank`,
  `landmarks`, `landmarks-verify`, `state-animals`, `climate-kid-verify` — see the
  T-064 entry in `tasks.md`). The worker lists each under **Tests made stale**
  with the proposed one-line neutralisation; the tester raises the Test change
  request; a human approves. Do not route around this by keeping the key out of
  files — criterion 1 requires it.
- **Content rules** (`CLAUDE.md`): the strings are text a child reads. Prefer a
  blank list to a guessed one; one or two genuinely well-known items, never padding
  to two.
- **Dependencies:** none (criterion 24). Packages via `bun` and `uv` only.
- **Light path not available** — this touches `openapi.yaml` and child-facing text
  (`process.md`, "The light path").

## Context

Required reading for the worker and the tester.

- **Queue entry:** `tasks.md` T-068, and **T-070** (a) — the pinned-digest wall
  this task hits; read it before touching any guard.
- **Precedent:** `engineering-decisions.md` **E-7** (`top_crops` hand-curated) and
  **E-14** (`openapi.yaml` follows the backend); PR #46's body (T-015) for how the
  same field shape went through the loop, including the six tests it had to touch.
- **Source:**
  - `question-bank/src/curated/us-states.ts` — header comment (T-015 provenance
    paragraph) and `CuratedState`.
  - `question-bank/src/normalize.ts:147-153` — the `?? []` fold.
  - `question-bank/src/types.ts:49-55` — `Entity`.
  - `question-bank/src/offline-rebuild.ts` — `rebuildOffline`, `DEAD_PROXY`.
  - `question-bank/src/top-crops-verify.test.ts` — `LIVESTOCK_WORDS` (the 14 words
    reused in criterion 6), `withEmptyTopCrops`, and its digest guard; the other
    three guards in `landmarks-verify`, `climate-kid-verify`,
    `highest-point-verify`.
  - `backend/app/models.py:137-170` — `Entity`; `backend/tests/` contract tests,
    and `test_climate_koppen_t067_criteria.py` for how `topCrops` is asserted.
- **Contract:** `openapi.yaml`, `components.schemas.Entity` (around line 1429).
- **Plan:** `geoquizdataplan.md` §1.9 (hand-curation for fields Wikidata is bad at).
- **Tests:** `test-guidelines.md`; offline only, no `fetch` mocking.

## Review checklist

The shape criteria above cannot tell whether the picks are right. A human checks,
and records who checked on the PR:

- [ ] Every non-empty `top_livestock` is something that state is genuinely known
      for — a fact a teacher would not correct.
- [ ] Every empty one is a state with no honest standout, not a gap the worker
      skipped.
- [ ] The strings read naturally to a 7–10-year-old ("dairy cows", not "dairy
      products, n.e.c.").
- [ ] The fish/horse exclusion (criterion 7) is the call you want.

## Handoff

**TL;DR — `top_livestock` is built end to end: 24 states curated, 26 blank, contract and backend model carry it, E-18 written.** The suite has **14 stale reds, all by design** (listed below — the four digest guards, the five Colorado-vs-sample comparisons, and three "no unexpected key" allow-lists). Typecheck, lint, format:check and the backend suite (525 passed, 9 skipped) are green. Next: the tester raises the Test change request for the 14.

**Changed, file by file**

- `question-bank/src/types.ts` — `Entity.top_livestock?: string[]`, after `top_crops`.
- `question-bank/src/curated/us-states.ts` — `CuratedState.top_livestock?: string[]` with doc comment; T-068 provenance paragraph in the header comment (criterion 23); `top_livestock` set on 24 rows, directly after `top_crops`.
- `question-bank/src/normalize.ts` — `top_livestock: curated.top_livestock ?? []`, right after the `top_crops` fold.
- `question-bank/data/us-states/us-state-*.json` (all 50) — regenerated with `bun run src/build.ts --offline --out data/us-states --quiet`; insertions only (147 lines), never hand-edited. `index.json` did not change.
- `openapi.yaml` — `Entity.topLivestock` (array of string, with a description) right after `topCrops`.
- `backend/app/models.py` — `Entity.top_livestock: list[str] | None = None` after `top_crops`.
- `engineering-decisions.md` — E-18 appended; E-1…E-17 untouched (the diff against the base commit is 49 insertions, 0 deletions).

**The picks** (all lower-case, at most two)

| Value | States |
|---|---|
| `chickens` | AL, AR, DE, GA, MD, MS |
| `cattle` | AZ, CO, KS, MT, NE, OK, SD, TX |
| `dairy cows` | CA, ID, NY, PA, VT, WI |
| `pigs` | IA |
| `turkeys` | MN |
| `pigs`, `turkeys` | NC |
| `cattle`, `sheep` | WY |
| `[]` (26) | AK, CT, FL, HI, IL, IN, KY, LA, MA, ME, MI, MO, ND, NH, NJ, NM, NV, OH, OR, RI, SC, TN, UT, VA, WA, WV |

**Where each criterion lives**

| # | Where |
|---|---|
| 1–8 | the 50 tracked files; values from the curated table. Checked by an ad-hoc script (not committed): 50 files, 0 violations |
| 9 | `CURATED_US_STATES[*].top_livestock` → tracked files via the offline rebuild |
| 10 | `normalize.ts`, the `?? []` line after `top_crops`. No worker test was added for this; it is the tester's to pin |
| 11 | two consecutive dead-proxy offline rebuilds into temp dirs: `diff -r` against `data/us-states/` is empty both times |
| 12 | insertions only in the 50 files; each file with `top_livestock` deleted deep-equals the base commit (ad-hoc script, `built_at` included) |
| 13–15, 24 | `git diff --quiet ed229805 -- <those paths>` exits 0 |
| 16 | not satisfiable by the worker: the guards are existing tests (see Tests made stale) |
| 17 | `openapi.yaml`, `components.schemas.Entity.properties.topLivestock` |
| 18–19 | `backend/app/models.py` `Entity`; `make -C backend test` passes, contract-walk tests included |
| 20–22 | `engineering-decisions.md` E-18 |
| 23 | header comment of `curated/us-states.ts`, "`top_livestock` provenance (T-068, 2026-10-03)" |
| 25 | the backend suite passes with all six proxy variables on `127.0.0.1:1`. The question-bank suite's only reds are the stale 14 |
| 26 | green except the stale 14 |

**Deliberately not done**

- **No test written by the worker.** Every criterion is observable in data or in existing harnesses; the tests are the tester's.
- **Not re-pinned or refactored the digest guards** (T-070, out of scope).
- **No `top_crops` change, no `sample-data/` change, no `content.json` change.**

**Contradicts or strains the brief**

- **`beef` in criterion 6 can never be used.** Criterion 7 bans the substring `bee`, and `beef` contains it. The two criteria are consistent (6 only needs one listed word), but `beef` is dead in 6, and a "beef cattle" string would fail 7. I wrote `cattle` instead. **Owner:** the expander, if T-068 is ever re-expanded or the criteria are reused. Otherwise the reviewer only needs to know why "beef" never appears.
- **The Sessions id is the same as the expander's**, because the orchestrated run shares one web session id (see the Sessions row). **Owner:** the tester, to note and judge against `process.md`'s isolation rule.

**How to run**

```bash
cd question-bank && bun install --frozen-lockfile   # node_modules was absent in this env; lint/prettier tests need it
bun test && bun run typecheck && bun run lint && bun run format:check
bun run src/build.ts --offline --out data/us-states --quiet   # regenerates the 50 files; must leave git clean
make -C ../backend test
```

**Tests made stale** (14, all in `question-bank/src/`, all caused by criterion 1's new key). Each fix below **removes `top_livestock` and nothing else**, so a change to any other field still fails (criterion 16). There are no count floors: nothing is deleted, so no test-count pin moves.

*Pinned-digest guards (criterion 16):*

1. `top-crops-verify.test.ts` › "T-015 tester, criterion 13 — nothing else in the bank moves" › "each of the 50 files, with top_crops put back to [], Alaska's highest_point line stripped and region removed, digests to the default branch's bytes". **Modify:** before hashing, also strip the `top_livestock` block textually: `raw.replace(/^ {2}"top_livestock": \[[^\]]*\],\n/m, "")`. This works for both `[]` and multi-line arrays, because the values contain no `]`.
2. `landmarks-verify.test.ts` › "T-013 tester, criterion 9 — nothing but landmark moves in the bank" › "each of the 50 files, with landmark, climate_kid and top_crops removed, is identical to the default branch's". **Modify:** add `delete parsed["top_livestock"];` next to the existing `delete parsed["region"];`.
3. `climate-kid-verify.test.ts` › "T-014 tester, criterion 15 — nothing but climate_kid moves in the bank" › "each of the 50 files, with climate_kid and top_crops removed, digests to the default branch's value". **Modify:** the same `delete parsed["top_livestock"];`.
4. `highest-point-verify.test.ts` › "T-016 tester, criterion 5 — us-state-ak.json gains one line and nothing else" › "removing the highest_point line, reverting landmark and dropping region reproduces the default branch's bytes exactly". **Modify:** add the same textual `top_livestock` strip as item 1 to the `.replace` chain.
5. `highest-point-verify.test.ts` › "T-016 tester, criterion 6 — the other 49 files, index.json and the sample are untouched" › "each of the 49 non-Alaska state files matches the default branch once T-017's region line is dropped". **Modify:** strip `top_livestock` textually before `sha256`.
6. `highest-point-verify.test.ts` › "T-016 tester, criterion 11 — both neutralisation routes are proven real" › "the textual route (top-crops-verify) changes the bytes and drops the value". **Modify:** add the same textual strip to its `neutralised` chain.

*Tracked Colorado vs `sample-data/us-state-co.json`* (the sample is frozen by criterion 14, so the comparison has to drop the key):

7. `committed-bank.test.ts` › "T-010 criterion 4 — the tracked Colorado matches the committed sample" › "data/us-states/us-state-co.json equals sample-data/us-state-co.json except sources.built_at and top_crops". **Modify:** also delete `top_livestock` in `stripBuiltAt` (or at the call site).
8. `landmarks.test.ts` › "T-013 criterion 8 — the committed sample stays in step with the bank" › "sample-data/us-state-co.json equals the tracked Colorado in every field but sources.built_at and top_crops". **Modify:** the same.
9. `state-animals.test.ts` › "T-012 criterion 7 — the committed sample stays in step with the bank" › the same test name. **Modify:** the same.
10. `landmarks-verify.test.ts` › "T-013 tester, criterion 8 — the committed sample stays in step with the bank" › "the sample equals the tracked Colorado in every field but sources.built_at and top_crops, landmark included". **Modify:** add `delete parsed["top_livestock"]` inside its `strip`.
11. `climate-kid-verify.test.ts` › "T-014 tester, criterion 13 — the committed sample stays in step with the bank" › "the sample equals the tracked Colorado in every field but sources.built_at and top_crops". **Modify:** the same.

*"No unexpected key" allow-lists:*

12. `landmarks.test.ts` › "T-013 criterion 9 — nothing but landmark moves in the bank (tree-shaped pieces)" › "no tracked entity file has grown a key outside the schema this task may touch". **Modify:** add `"top_livestock"` to `allowed`.
13. `state-animals.test.ts` › "T-012 criterion 8 — nothing but state_animal moves in the bank" › the same test name. **Modify:** the same.
14. `climate-kid.test.ts` › "T-014 criterion 15 — nothing but climate_kid moves in the bank (tree-shaped pieces)" › the same test name. **Modify:** the same.

The brief's Constraints predicted the four guards and the five sample comparisons. It did not predict items 12–14 or the extra `highest-point-verify` reds (items 5 and 6). All of these are the same cause.

## Verdict

**TL;DR — pass.** All 26 criteria hold. Dkaattae approved all 14 test changes in this attended session, and I applied them in `e1f2689`. CI's red `question-bank` job came from those 14 stale tests. The question-bank suite is now 1419 pass, 0 fail. **Next:** the reviewer.

**Approval:** header reads `Test changes: approved — Dkaattae, 2026-10-03`. I asked Dkaattae row by row in session `cse_01XJBrfMf9E8iwaLHeYwbwoU`, offering "Approve all 14", "Approve some rows" and "Refuse all". Their answer was **"Approve all 14 (Recommended)"**.

**Independence:** this tester ran in its own attended web session, `cse_01XJBrfMf9E8iwaLHeYwbwoU`, which differs from the expander's, worker's and first tester's `cse_018ET4S26HVxh9FbiQMgTU3y`. So this round has separate-session independence, not just subagent isolation. Criteria 1–15 and 17–25 are carried from the first tester's round below. I re-ran its tests here (they are in the 1419) but did not repeat its one-off base-commit checks.

**Tests modified** (all 14 rows, `e1f2689`, each neutralising `top_livestock` and nothing else, with no assertion removed and no digest re-pinned):

- **Rows 1, 4, 5, 6.** Digest guards in `top-crops-verify.test.ts` and `highest-point-verify.test.ts` strip the `top_livestock` block textually with `/^ {2}"top_livestock": \[[^\]]*\],\n/m`.
- **Rows 2, 3.** `landmarks-verify.test.ts` and `climate-kid-verify.test.ts` add `delete parsed["top_livestock"]`.
- **Rows 7, 8, 9.** `committed-bank.test.ts`, `landmarks.test.ts` and `state-animals.test.ts` drop `top_livestock` in `stripBuiltAt`. To make the destructure typecheck, each file's local `TrackedEntity` interface gains `top_livestock?: unknown[]`, the same shape as its existing `top_crops?`.
- **Rows 10, 11.** The `strip` helpers in `landmarks-verify.test.ts` and `climate-kid-verify.test.ts` delete `top_livestock`. In `landmarks-verify.test.ts` the local `Entity` interface gains `top_livestock?` so `delete parsed.top_livestock` typechecks.
- **Rows 12, 13, 14.** `"top_livestock"` is added to the `allowed` set in `landmarks.test.ts`, `state-animals.test.ts` and `climate-kid.test.ts`, and nothing else is added.
- **Names:** each changed test's name now says it also excludes `top_livestock`, as the rows specify.

**Criterion 16 by mutation** (each on a tracked file, then reverted with `git checkout`; final `git status` shows only the test edits):

| Mutation | Guards red | Reading |
|---|---|---|
| IA `capital` → `"Ames"` | landmarks-verify c9, climate-kid-verify c15, top-crops-verify c13, highest-point-verify c6 | **all four red** |
| AK `capital` → `"Anchorage"` | landmarks-verify c9, climate-kid-verify c15, top-crops-verify c13, highest-point-verify c5 and c11 | **all four red** |
| IA `fun_facts[0].reviewed` → `false`, the field right after the `top_livestock` block | all four, as for IA `capital` | the strip does not reach past its own block |
| IA `top_crops` `"soybeans"` → `"oats"` | highest-point-verify c6, plus the T-015 curated-source and rebuild tests | **only one of the four guards** (see note) |
| IA `top_livestock` `"pigs"` → `"goats"` | none of the digest guards (30 pass) | the strip neutralises `top_livestock`, as intended. The criteria 9 and 11 tests catch this change separately |

**Note on the `top_crops` example — for the reviewer, not a block.** Three of the four guards (landmarks-verify, climate-kid-verify, top-crops-verify) do not go red on a `top_crops` change. That is not T-068's doing: since T-015 they reset `top_crops` to `[]` before hashing, and none of the 14 rows touches that line. Criterion 16's operative sentence is "removes `top_livestock` and nothing else", and that holds. The `capital` example turns all four red. T-068 did not weaken any of the guards. I tried an AK `top_crops` mutation as well, but my `sed` did not match the multi-line array, so it changed nothing and I am not counting it.

**Gates (criterion 26), all run in this session:**

- **question-bank:** `bun test` 1419 pass, 0 fail. `typecheck` clean. `lint` 0 warnings, 0 errors. `format:check` clean.
- **backend:** `make -C backend lint format-check` clean. `uv run pytest` 537 passed, 9 skipped.

| # | Verdict | Evidence |
|---|---|---|
| 1–11, 17–21, 23, 25 | hold | first tester's committed tests, all green in this run (first round's table below) |
| 12–15, 22, 24 | hold (one-off) | first tester's full-clone checks against `ed229805`, carried over |
| 16 | **holds** | mutation table above |
| 26 | **holds** | gates above |

### First tester round (orchestrated, superseded by the verdict above)

**TL;DR — not yet a verdict. The task halts for a person to approve test changes.** 25 of the 26 criteria hold. The one left open is criterion 16, because the four guards it names are among the 14 stale tests. I confirmed all 14 are red only because of the new `top_livestock` key, and raised them under `## Test change request`. **Needed next:** Dkaattae starts a `tester` in a session they are attending, approves or refuses each row there, and that tester applies the approved rows, checks criterion 16 by mutation and writes the final verdict.

**Independence:** this is an orchestrated run (`runs/T-068-top-livestock.md` exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_018ET4S26HVxh9FbiQMgTU3y`, the same id the expander and worker rows carry, so the Sessions check cannot tell the roles apart here. What independence there is comes from this tester being a freshly spawned subagent with its own context: it did not watch the work and cannot see the worker's reasoning. That is weaker than a separate session, because it depends on the orchestrator having spawned it correctly rather than on anything the tester can check for itself.

**Tests added** (commit `T-068 tester: …`):

- `question-bank/src/top-livestock-verify.test.ts`: 21 tests for criteria 1–11, 20, 21 and 23.
- `backend/tests/test_top_livestock_t068_criteria.py`: 12 tests for criteria 17–19.

**Base-commit criteria are checked once here, not pinned.** Criteria 12–15, 22 and 24 compare against `ed229805`, and CI clones shallowly. A committed test would need that commit's bytes pinned as digests, which is the expiring-baseline shape E-11 and E-12 removed and T-070 is retiring. It would go red as soon as T-040 or T-064 touches those files. Following the T-067 precedent (`test_climate_koppen_t067_criteria.py`), I checked them once in a full clone and recorded the results below.

| # | Verdict | Evidence |
|---|---|---|
| 1 | holds | criterion 1 test. Mutation (AK key removed): red |
| 2 | holds | criterion 2 test. Mutation (IA given 3 items): red |
| 3 | holds | criterion 3 tests (DE, AR, WI). Mutations (DE and WI emptied): red |
| 4 | holds | criterion 4 test. Mutations (`"Pigs"`, `" pigs"`): red |
| 5 | holds | criterion 5 test. Mutation (`["pigs","pigs"]`): red |
| 6 | holds | criterion 6 test. Mutation (`"corn"`, `"horses"`): red |
| 7 | holds | criterion 7 test. Mutations (MS `"catfish"`, AK `"horses"`): red |
| 8 | holds | criterion 8 test. Mutation (IA `"corn"`, a crop string): red |
| 9 | holds | criterion 9 test. Mutations (WI curated changed to `"cheese"`, hand-edited data): red |
| 10 | holds | criterion 10 test, run over all 50 states, with both branches asserted non-empty. Mutations (fold line deleted; fold reading `top_crops` instead): red |
| 11 | holds | criterion 11 test (two `rebuildOffline` runs, byte-compared). Red under every data and curated mutation above |
| 12 | holds (one-off) | in a full clone, all 50 files with `top_livestock` deleted `deepStrictEqual` `git show ed229805:<file>`, with `sources.built_at` equal too: 50/50. Sanity check: changing one file's `capital` is detected |
| 13 | holds (one-off) | `git diff --quiet ed229805 -- question-bank/data/us-states/index.json` exits 0 |
| 14 | holds (one-off) | `git diff --quiet ed229805 -- question-bank/sample-data` exits 0. `git ls-files` lists the same 3 files, and there is nothing untracked |
| 15 | holds (one-off) | `git diff --quiet ed229805 -- backend/app/data/content.json` exits 0 |
| 16 | **open** | its subjects are stale rows 1–6 below. **Owed by the next tester**: after applying the approved rows, alter one state's `capital` and then one state's `top_crops` in a tracked file. Each of the four guards must go red, and green again after the revert |
| 17 | holds | `test_criterion_17_*` (3 tests). Mutation (`topLivestock` renamed in `openapi.yaml`): red |
| 18 | holds | `test_criterion_18_*` (7 tests). Mutations (field deleted; field made required; type widened to `list[str] \| str`): red |
| 19 | holds | the whole backend suite passes, including the T-067 two-way field walk. `test_criterion_19_*` adds the same walk plus an `assert_matches` on an entity carrying `topLivestock` |
| 20 | holds | criterion 20 tests (6) |
| 21 | holds | criterion 21 test. Mutations (NV dropped from E-18's list; WI data emptied; AK given livestock): red |
| 22 | holds (one-off) | the base `engineering-decisions.md` (49044 bytes) is a byte-for-byte prefix of today's file, and what follows starts `\n## E-18 —`. `git diff --stat`: 49 insertions, 0 deletions |
| 23 | holds | criterion 23 test. Mutation ("no separate review pass" reworded): red |
| 24 | holds (one-off) | `git diff --quiet ed229805 --` on `question-bank/package.json`, `bun.lock`, `backend/pyproject.toml` and `uv.lock` exits 0 for all four. `dependency-set.test.ts` keeps holding the lasting half |
| 25 | holds | both suites were run with all six proxy variables set to `http://127.0.0.1:1`: question-bank 1405 pass / 14 fail (the stale 14 only), backend 537 passed, 9 skipped |
| 26 | **red until approval** | `typecheck`, `lint` (0 warnings), `format:check`, `make -C backend lint format-check` and the backend suite are green. The question-bank suite has exactly the 14 stale reds |

**The 14 stale tests are stale, not wrong code.** With `top_livestock` stripped textually from all 50 tracked files (in the working tree only, then reverted), none of the 14 failed. The only failures left were the expected rebuild-equality tests, so the new key is their sole cause. The worker's list is complete: I found no other pre-existing test red.

**Every mutation was reverted.** `git status` shows only the two new test files before commit.

**Worker's note on `beef` and `bee`:** confirmed. `beef` can never satisfy criterion 6 without failing criterion 7. That does not stop the criteria being met, so it is not a block. Owner: the expander, if these criteria are ever reused.

## Review

**TL;DR — approved, and escalated.** The code is a faithful copy of the `top_crops` route, every role stayed in its lane, and all gates are green when re-run here. It is escalated, not routine, for two reasons: **it changes `openapi.yaml`**, and **24 states gain text a child will read**. Neither is a defect. **Needed next:** Dkaattae works through the four-box checklist on PR #69 and merges, or not.

**Checks**

- **All roles' work is in the PR.** The Sessions rows (expander, worker, two testers) each have commits on `claude/next-task-queue-3ynpc7`. The base is still `ed229805` (= `origin/main`).
- **Lanes held.** The expander's commits touch only `tasks/` and `tasks.md`. The worker touched exactly the Constraints' files, plus the brief. The tester's commits touch only tests and the brief.
- **Test changes match the request.** `e1f2689` changes exactly the 8 files and 14 tests in the request's rows. Each change removes `top_livestock` and nothing else, no assertion is dropped and no digest is re-pinned. The approval is a person's (`Dkaattae`), given in an attended session (D-15).
- **Gates re-run in this session:** question-bank `bun test` 1419 pass / 0 fail, `typecheck`, `lint` and `format:check` clean; backend `make test` 537 passed, 9 skipped.
- **Fit.** Three one-line additions mirror `top_crops` exactly: `types.ts`, `normalize.ts`'s `?? []` fold and `models.py`. Each has a comment in the same style as its neighbour. The data files were regenerated, not hand-edited. Nothing speculative was added.

**Findings — none block**

1. **`openapi.yaml:1489`, `topLivestock.description`.** It reads "Empty where no state has an honest standout"; it should say "where the state has no honest standout". This is a wording slip in a doc. **Routed to T-040**, the next task to put this field on the wire, as a one-line amendment. A new entry for one word would only lengthen the queue.
2. **`question-bank/sample-data/README.md`** now also fails to mention `top_livestock`. It says `build:sample` gives "same output", which has not been true since T-015, and it explains only the `top_crops` gap. Criterion 14 froze this directory on purpose. **Routed to T-064**, which deletes the directory and already owns the five sample comparisons that grew a second exclusion here.
3. **Criterion 16's `top_crops` example is weaker than it reads.** Three of the four digest guards reset `top_crops` to `[]` before hashing, so a `top_crops` change does not turn them red. That has been true since T-015, not T-068. The `capital` mutation turns all four red, and `top_crops` changes are caught by T-015's curated-source and rebuild tests. **Routed to T-070**, whose decision about the guards has to account for it. The amendment also records that the guards now carry a fifth neutralisation (`top_livestock`).

**Flags disposed**

- **`beef` is dead in criterion 6 because of the `bee` ban (worker, tester).** Decided here: no action. The criteria are a finished record, and "cattle" is the better kid-facing word anyway. If a future livestock widening reuses the word lists, E-18's "Revisit when" is where the question will be reopened.
- **Shared session id (worker).** Closed: the final verdict came from a separate attended session, `cse_01XJBrfMf9E8iwaLHeYwbwoU`.
- **Close calls and conservative blanks (worker's Notes).** These are for a person, not this review. They are carried onto PR #69 as the escalation's checklist: CO/AZ `cattle`, ID `dairy cows`, MS `chickens`, NC `turkeys`, WY `sheep`, and the 26 blanks.
- **PR note owed about T-070.** Carried into the PR body: the digest guards gained a fifth neutralisation and were not re-pinned. T-070 still owns that decision.

**Escalation (D-4 envelope)**

- **`openapi.yaml` changed:** `Entity.topLivestock`, as criterion 17 requires.
- **Text a child will read:** 27 strings across 24 states. Tests confirm their shape; only a person can confirm their substance.
- **Inside the envelope otherwise:** no dependency added, no migration, no change to `geoquizdataplan.md`, and the pre-existing test changes carry a person's approval.

## Test change request

Raised by the tester on 2026-10-03, in an orchestrated run with no person to ask, so it waits here (D-15). All paths are under `question-bank/src/`. All 14 rows are **modify**: nothing is deleted, so no count floor moves. Each change removes `top_livestock` and nothing else, and each test keeps every assertion it has today.

**Why all 14 are stale.** Criterion 1 requires `top_livestock` in all 50 tracked files. Criterion 14 freezes `sample-data/us-state-co.json`, which does not have the key. With the key stripped from the 50 files in the working tree, all 14 pass again (Verdict).

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `top-crops-verify.test.ts` › "T-015 tester, criterion 13 — nothing else in the bank moves" › "each of the 50 files, with top_crops put back to [], Alaska's highest_point line stripped and region removed, digests to the default branch's bytes" | `313d72d`, T-015 tester. Protected: nothing in the 50 files moves except the fields named tasks are known to touch | criterion 1 adds a key absent from every pinned digest | modify | Name gains ", top_livestock removed". Before hashing, the `top_livestock` block is also stripped textually: `raw.replace(/^ {2}"top_livestock": \[[^\]]*\],\n/m, "")`, the same chain as the existing strips. It still asserts all 50 digests equal `DEFAULT_BRANCH_DIGESTS`, unchanged. Criterion 16 has to hold: changing a `capital` or a `top_crops` entry still turns it red | approved — Dkaattae, 2026-10-03 |
| 2 | `landmarks-verify.test.ts` › "T-013 tester, criterion 9 — nothing but landmark moves in the bank" › "each of the 50 files, with landmark, climate_kid and top_crops removed, is identical to the default branch's" | `3501dac`, T-015 worker (renamed from T-013's tester test). Same protection | same | modify | Name gains "and top_livestock". Adds `delete parsed["top_livestock"];` next to the existing `delete parsed["region"];`. Digests are unchanged. Criterion 16 has to hold, as in row 1 | approved — Dkaattae, 2026-10-03 |
| 3 | `climate-kid-verify.test.ts` › "T-014 tester, criterion 15 — nothing but climate_kid moves in the bank" › "each of the 50 files, with climate_kid and top_crops removed, digests to the default branch's value" | `3501dac`, T-015 worker (renamed from T-014's tester test). Same protection | same | modify | Name gains "and top_livestock". Adds `delete parsed["top_livestock"];` next to the existing deletions. Digests are unchanged. Criterion 16 has to hold | approved — Dkaattae, 2026-10-03 |
| 4 | `highest-point-verify.test.ts` › "T-016 tester, criterion 5 — us-state-ak.json gains one line and nothing else" › "removing the highest_point line, reverting landmark and dropping region reproduces the default branch's bytes exactly" | `c37381b`, T-017 worker (renamed from T-016's tester test). Protected: Alaska's file differs from its baseline by the `highest_point` line alone | same, for `us-state-ak.json` (AK's `top_livestock` is `[]`, which is still a new line) | modify | Name gains ", dropping top_livestock". The row 1 textual strip is added to the existing `.replace` chain. It still asserts exact bytes against the pinned baseline. Criterion 16 has to hold | approved — Dkaattae, 2026-10-03 |
| 5 | `highest-point-verify.test.ts` › "T-016 tester, criterion 6 — the other 49 files, index.json and the sample are untouched" › "each of the 49 non-Alaska state files matches the default branch once T-017's region line is dropped" | `c37381b`, T-017 worker (renamed from T-016's tester test). Protected: T-016 moved nothing in the other 49 | same | modify | Name ends "…once T-017's region line and T-068's top_livestock line are dropped". The row 1 textual strip is applied before `sha256`. Digests are unchanged | approved — Dkaattae, 2026-10-03 |
| 6 | `highest-point-verify.test.ts` › "T-016 tester, criterion 11 — both neutralisation routes are proven real" › "the textual route (top-crops-verify) changes the bytes and drops the value" | `34a174a`, T-016 tester. Protected: the `top-crops-verify` textual neutralisation is real, not a no-op | it replays row 1's chain and compares against the baseline, so it inherits row 1's staleness | modify | Name unchanged. The row 1 textual strip is added to its `neutralised` chain so that it mirrors row 1. Its existing assertions (the bytes change, the value is dropped, the baseline is reproduced) are unchanged | approved — Dkaattae, 2026-10-03 |
| 7 | `committed-bank.test.ts` › "T-010 criterion 4 — the tracked Colorado matches the committed sample" › "data/us-states/us-state-co.json equals sample-data/us-state-co.json except sources.built_at and top_crops" | `3501dac`, T-015 worker (T-010 criterion 4 originally). Protected: the sample stays in step with the bank | tracked CO gains `top_livestock`, and the sample is frozen without it (criterion 14) | modify | Name: "…except sources.built_at, top_crops and top_livestock". `stripBuiltAt` also drops `top_livestock`. It still asserts `toEqual` on everything else | approved — Dkaattae, 2026-10-03 |
| 8 | `landmarks.test.ts` › "T-013 criterion 8 — the committed sample stays in step with the bank" › "sample-data/us-state-co.json equals the tracked Colorado in every field but sources.built_at and top_crops" | `3501dac`, T-015 worker (T-013 criterion 8). Same protection | same | modify | Name: "…but sources.built_at, top_crops and top_livestock". The strip also drops `top_livestock`. It still asserts `toEqual` on the rest | approved — Dkaattae, 2026-10-03 |
| 9 | `state-animals.test.ts` › "T-012 criterion 7 — the committed sample stays in step with the bank" › "sample-data/us-state-co.json equals the tracked Colorado in every field but sources.built_at and top_crops" | `3501dac`, T-015 worker (T-012 criterion 7). Same protection | same | modify | as row 8 | approved — Dkaattae, 2026-10-03 |
| 10 | `landmarks-verify.test.ts` › "T-013 tester, criterion 8 — the committed sample stays in step with the bank" › "the sample equals the tracked Colorado in every field but sources.built_at and top_crops, landmark included" | `3501dac`, T-015 worker (T-013 tester). Same protection | same | modify | Name: "…but sources.built_at, top_crops and top_livestock, landmark included". `strip` adds `delete parsed["top_livestock"]`. It still asserts `toEqual` on the rest | approved — Dkaattae, 2026-10-03 |
| 11 | `climate-kid-verify.test.ts` › "T-014 tester, criterion 13 — the committed sample stays in step with the bank" › "the sample equals the tracked Colorado in every field but sources.built_at and top_crops" | `3501dac`, T-015 worker (T-014 tester). Same protection | same | modify | as row 10, without "landmark included" | approved — Dkaattae, 2026-10-03 |
| 12 | `landmarks.test.ts` › "T-013 criterion 9 — nothing but landmark moves in the bank (tree-shaped pieces)" › "no tracked entity file has grown a key outside the schema this task may touch" | `93fc433`, T-013 worker. Protected: no unexpected key appears in an entity file | criterion 1 adds a key outside its allow-list | modify | Name unchanged. `"top_livestock"` is added to `allowed`, and nothing else is added | approved — Dkaattae, 2026-10-03 |
| 13 | `state-animals.test.ts` › "T-012 criterion 8 — nothing but state_animal moves in the bank" › "no tracked entity file has grown a key outside the schema this task may touch" | `17ddab1`, T-012 tester. Same protection | same | modify | as row 12 | approved — Dkaattae, 2026-10-03 |
| 14 | `climate-kid.test.ts` › "T-014 criterion 15 — nothing but climate_kid moves in the bank (tree-shaped pieces)" › "no tracked entity file has grown a key outside the schema this task may touch" | `bc544e3`, T-014 worker. Same protection | same | modify | as row 12 | approved — Dkaattae, 2026-10-03 |

The "Introduced" commit is the one `git log -S '<current test name>'` returns. For rows renamed by T-015's worker or T-017's worker, the original task is given in brackets.

To approve: start the `tester` step for T-068 in a session you are attending, and answer it there, row by row.

## Notes

- **Worker model: Opus.** The work is mostly mechanical, but the picks are child-facing content.
- **The `bee` ban caught "beef cattle".** That is why the value is `cattle`. It also reads more simply for a 7–10-year-old.
- **Conservative on purpose.** States that raise plenty of livestock but are not *known* for it were left blank: FL and MO cattle, OH and IN eggs, VA and SC poultry, MI dairy. Most of the rest are crop or horse states (KY, TN). This is the reviewer checklist's second box. **Owner:** the human reviewer.
- **Closest calls, for the reviewer:** CO `cattle`, AZ `cattle` (one of Arizona's "five Cs"), ID `dairy cows`, MS `chickens` (catfish is more famous but excluded), NC `turkeys` as the second item alongside `pigs`, and WY `sheep`. **Owner:** the human reviewer, on the PR.
- **Environment:** `question-bank/node_modules` was missing at the start, so 13 lint/prettier gate tests failed for that reason alone. `bun install --frozen-lockfile` fixed them, with no lockfile change.
- **PR note owed (from the T-068 queue entry):** the digest guards gain a fifth neutralisation (`top_livestock`) instead of being re-pinned. T-070 still owns that decision. **Owner:** the reviewer, to carry into the PR body.
