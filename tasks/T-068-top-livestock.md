# T-068 — US livestock/poultry per state, separate from crops

**Status:** `approved`
**Next step:** `worker`
**Approved:** `Dkaattae — 2026-10-03, in chat (session_018ET4S26HVxh9FbiQMgTU3y), with the expander's defaults for field name, placement, and livestock scope`
**Test changes:** `none`
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

## Verdict

## Notes
