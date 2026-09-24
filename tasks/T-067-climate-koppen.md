# T-067 — `climate_koppen` is declared and never emitted

**Status:** `blocked`
**Next step:** `human`
**Approved:** `pending` — replace with who approved and the date, e.g. `Kate, 2026-08-06`
**From:** [`tasks.md`](../tasks.md) T-067
**Branch:** `claude/next-task-queue-30m5cr`
**PR:** #60, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:** the queue entry recommends deleting the field because "nothing in `openapi.yaml` exposes it". That is false (`openapi.yaml:1477`), so delete-or-emit is now a contract decision the expander cannot make — question below, owned by human.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-24 | cse_019f8nCt1EE188yJwEebynad (orchestrated run) |

## Question for a human — answer here, then set `Next step: task-expander`

**TL;DR: `climate_koppen` is part of the API contract, not just the pipeline, and
the queue entry did not know that. Decide which ending you want (A, B or C
below). The expander then writes the criteria for it.**

The queue entry assumed that deleting the field touched only
`question-bank/src/types.ts:49` and the plan's example. The survey found four
places where it is declared, and none of them emit it:

| Where | What it says | Emitted / read by anything? |
|---|---|---|
| `question-bank/src/types.ts:49` | `climate_koppen?: string[]` on `Entity` | No: no query, no `normalize.ts` path, no tracked data file carries the key |
| `openapi.yaml:1477-1481` | `Entity.climateKoppen`, array of string, example `["BSk","Dfb","ET"]` | Declared in the **contract** |
| `backend/app/models.py:155` | `climate_koppen: list[str] \| None = None` on `Entity` | Declared in the served model, and nothing ever populates it |
| `geoquizdataplan.md:51` (§1.4) | `"climate_koppen": ["BSk", "Dfb", "ET"]` in the entity example | The plan |

`frontend/` does not reference it at all. `openapi.yaml`'s `Entity` description
says "Absent means 'not applicable or not yet sourced'". Under that reading, a
declared field that is never populated is consistent with the contract, which
undercuts the entry's premise that "the plan shows a field that does not exist".

**Pick one:**

- **A: delete it everywhere.** Remove it from `types.ts`, `openapi.yaml`,
  `backend/app/models.py` and the §1.4 example, and record the decision as
  `engineering-decisions.md` E-13. This is a deliberate contract change
  (`CLAUDE.md`: "change it deliberately and say so"). It also drops the field for
  future world-country entities, where the plan (§1.9, `geoquizdataplan.md:254`)
  still expects codes to be mapped into kid phrasing.
- **B: delete it from the pipeline and the plan example, and keep it in the
  contract** as "not yet sourced" for world scope. Smaller, and no contract
  change. It does leave the contract and the pipeline's type disagreeing on
  purpose, and that should be written down (E-13).
- **C: emit it.** This needs a source: Wikidata's Köppen property has thin US
  coverage, and the Beck et al. raster would be new data and probably a new
  dependency. It also moves all 50 tracked files' bytes and hits the
  pinned-digest wall (T-070). That is not an `S` task, and it would need its own
  entry.

**A second, smaller sub-question, the same for A and B:** should §1.9's
`Köppen climate` row (`geoquizdataplan.md:254`) also change? It is accurate
as a plan for world scope. For US states it is no longer what happened, because
T-014 hand-curated `climate_kid` with no codes. The queue entry does not ask for
this, so the default is **leave it alone** unless you say otherwise.

## Goal

Stop the plan and the code from describing a Köppen field that nothing produces,
and correct §1.9's US-crops row, which prices a route (USDA NASS, "free key")
the project rejected in E-7.

## Acceptance criteria

**Not approvable yet.** Criteria 1–4 are the same whichever option is chosen.
The rest are drafts for option A, and they change under B. The expander rewrites
this section once the question above is answered.

*Independent of the decision: the §1.9 US-crops row*

1. In `geoquizdataplan.md` §1.9's table, the row whose Field is `US crops` no
   longer contains the strings `USDA NASS`, `Quick Stats` or `Free key`.
2. That same row names hand-curation as the source and contains the string `E-7`
   (a reference to `engineering-decisions.md` E-7).
3. The `world crops` row of §1.9 is byte-identical to its text on the default
   branch at the time of expansion:
   `| world crops | **FAOSTAT** bulk download | Free, needs aggregation to "top 3" |`.
4. Apart from the `US crops` row (and whatever the Köppen decision requires), no
   other line of `geoquizdataplan.md` changes.

*Draft, option A only*

5. `question-bank/src/types.ts`'s `Entity` interface declares no
   `climate_koppen` property.
6. `openapi.yaml`'s `components.schemas.Entity.properties` has no `climateKoppen`
   key, and the file still parses as YAML.
7. `backend/app/models.py`'s `Entity` has no `climate_koppen` field.
8. The §1.4 entity example in `geoquizdataplan.md` has no `climate_koppen` key and
   still parses as JSON once the literal `"..."` placeholders are allowed as strings.
   Every other key in that example is unchanged.
9. No file under `question-bank/data/` or `question-bank/sample-data/` changes
   (byte-identical to the default branch).
10. `engineering-decisions.md` gains exactly one new entry, `E-13`, that records
    the deletion, names all four places it was removed from, and says why
    (never emitted; `climate_kid` is the shipped form). No existing `E-n` entry
    changes.
11. `bun test` and `bun run typecheck` pass in `question-bank/` and `frontend/`,
    and `make -C backend test` passes.
12. No new dependency in any `package.json`, `pyproject.toml` or lockfile.

## Out of scope

- **Emitting Köppen codes** (option C). That is a separate queue entry if chosen.
- `climate_kid` values, and anything in `question-bank/src/curated/us-states.ts`.
- The pinned-digest guards and T-070. Neither A nor B touches a tracked data file.
- §1.9 rows other than `US crops` (and `Köppen climate`, only if the human says so).
- `question-bank/data/**` and `sample-data/**`.
- Any T-068 livestock field.

## Constraints

- Files expected to change (option A): `geoquizdataplan.md`,
  `question-bank/src/types.ts`, `openapi.yaml`, `backend/app/models.py`,
  `engineering-decisions.md`, plus tests. Option B drops `openapi.yaml` and
  `models.py` from this list.
- **Not a light-path task**: it edits `geoquizdataplan.md`, and under A it edits
  `openapi.yaml` (`process.md`, "The light path").
- A contract change under A must be said plainly in the commit and the PR
  (`CLAUDE.md`).
- Dependencies: none.
- No test reaches the network.

## Context

- Queue entry: `tasks.md` T-067.
- Plan: `geoquizdataplan.md` §1.4 (entity example, line 51), §1.9 (source table,
  lines 254 and 256).
- Contract: `openapi.yaml` `components.schemas.Entity`, lines 1429-1481.
- Code: `question-bank/src/types.ts:49`, `backend/app/models.py:139-173`.
- Decisions: `engineering-decisions.md` E-7 (why `top_crops` is hand-curated),
  and E-11/E-12 as the house style for a new entry.
- `backend/tests/test_contract.py` checks routes against the contract, not schema
  properties. So a mismatch between `openapi.yaml` and `models.py` would not
  turn anything red on its own.

## Handoff

## Verdict

## Notes

- Survey 2026-09-24: `tasks/` held only `README.md` and `TEMPLATE.md`, so the
  last cycle (T-074) had been swept. §A's three entries (T-066, T-060, T-071) are
  all still waiting on dependency decisions, and T-063 and T-064 are blocked as
  recorded in `tasks.md`. That made T-067 the first pickable entry.
