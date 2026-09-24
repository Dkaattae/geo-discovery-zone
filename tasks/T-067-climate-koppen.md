# T-067 — `climate_koppen` is declared and never emitted

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending` — replace with who approved and the date, e.g. `Kate, 2026-08-06`
**From:** [`tasks.md`](../tasks.md) T-067
**Branch:** `claude/next-task-queue-30m5cr`
**PR:** #60, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it.
**Fault:** resolved 2026-09-24 by the human's answer (option A). It was: the queue entry recommends deleting the field because "nothing in `openapi.yaml` exposes it". That is false (`openapi.yaml:1477`), so delete-or-emit is now a contract decision the expander cannot make — question below, owned by human.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-24 | cse_019f8nCt1EE188yJwEebynad (orchestrated run) |
| task-expander | 2026-09-24 | cse_019f8nCt1EE188yJwEebynad (orchestrated run, round 2: criteria rewritten for option A) |

## Question for a human — answered 2026-09-24 (option A)

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

### Answer — katechen150621@gmail.com, 2026-09-24 (given in chat, written in by the orchestrator)

> Do not need to care about the openapi contract, once backend and front built,
> backend is the source of truth. Please note somewhere. You can delete the row.

- **Option A**: delete `climate_koppen` everywhere, `openapi.yaml` included.
  The contract is not a reason to keep it.
- **The §1.9 `Köppen climate` row**: delete it too.
- **Record the rule** where later tasks will find it: once the backend and
  frontend are built, the backend is the source of truth, and `openapi.yaml`
  follows it rather than constraining it.

## Goal

Stop the plan, the pipeline, the backend and the contract from describing a
Köppen field that nothing produces. Correct §1.9's US-crops row, which still
prices a route (USDA NASS, "free key") that E-7 rejected. Write down the rule the
human gave: once the backend and frontend are built, the backend is the source of
truth and `openapi.yaml` follows it.

## Acceptance criteria

**TL;DR: option A (delete `climate_koppen` everywhere, `openapi.yaml` included),
delete §1.9's `Köppen climate` row, fix §1.9's `US crops` row, and add two
decision entries: E-13 for the deletion and E-14 for the backend-is-source-of-truth
rule. No data file moves, and no dependency is added.**

*Already true at expansion. Keep it true, no work needed:* no query, no
`normalize.ts` path, no file under `question-bank/data/` or `sample-data/`, and
nothing in `frontend/` produces or reads `climate_koppen` / `climateKoppen`
(survey, 2026-09-24).

*The field is gone*

1. `question-bank/src/types.ts`'s `Entity` interface declares no `climate_koppen`
   property. Every other property of that interface is unchanged, including
   `climate_kid` and `top_crops`.
2. In `openapi.yaml`, `components.schemas.Entity.properties` has no `climateKoppen`
   key. The file still parses as YAML.
3. Every other property of `openapi.yaml`'s `Entity` schema, and that schema's
   `description` and `required`, are unchanged. No other schema or path in
   `openapi.yaml` changes.
4. `backend/app/models.py`'s `Entity` class has no `climate_koppen` field. Every
   other field of that class is unchanged.
5. After the change, the strings `climate_koppen` and `climateKoppen` (case-sensitive)
   appear in none of these: `question-bank/src/**`, `frontend/src/**`,
   `backend/app/**`, `openapi.yaml`, `geoquizdataplan.md`. **Exceptions:** test
   files that assert the absence of the field, and
   `engineering-decisions.md`, which names it on purpose.

*The plan*

6. The §1.4 entity example in `geoquizdataplan.md` has no `climate_koppen` key.
   The fenced ```` ```json ```` block still parses as JSON, and every other key
   and value in it is unchanged, in the same order.
7. `geoquizdataplan.md` §1.9's table has no row whose Field is `Köppen climate`.
8. In §1.9's table, the row whose Field is `US crops` does not contain the strings
   `USDA NASS`, `Quick Stats` or `Free key`.
9. That same `US crops` row names hand-curation as the source and contains the
   string `E-7`.
10. The `world crops` row of §1.9 is byte-identical to
    `| world crops | **FAOSTAT** bulk download | Free, needs aggregation to "top 3" |`.
11. Every other row of §1.9's table, and the header and separator rows, are
    unchanged. The table keeps its order, minus the one deleted row.
12. Apart from criteria 6–9, no line of `geoquizdataplan.md` changes.

*The one dangling pointer*

13. `question-bank/src/curated/us-states.ts` no longer contains the string
    `map Köppen codes yourself`. That comment on `climate_kid` cited the §1.9 row
    that criterion 7 deletes. No `climate_kid` value, and no non-comment line of
    that file, changes.

*The decisions*

14. `engineering-decisions.md` gains an entry headed `## E-13 — `. It records the
    deletion of `climate_koppen`, names all four places it was removed from
    (`types.ts`, `openapi.yaml`, `backend/app/models.py`, plan §1.4), and names the
    §1.9 `Köppen climate` row as deleted too. It gives the reason: never emitted,
    and `climate_kid` is the shipped form. It also has a "Revisit when" line (for
    example, when world-scope climate data is sourced).
15. `engineering-decisions.md` gains an entry headed `## E-14 — ` that states the
    rule: once the backend and frontend are built, the backend is the source of
    truth, and `openapi.yaml` follows the backend rather than constraining it. It
    credits the rule to the human's answer on T-067 (2026-09-24) and has a
    "Revisit when" line.
16. E-13 and E-14 are the only new entries. E-13 comes directly after E-12, and E-14
    directly after E-13. No existing `E-n` entry's heading or body changes.
17. `conventions.md`'s line describing `openapi.yaml` (currently line 15, "the
    contract between frontend and backend") points at `E-14`, so a reader of the
    layout finds the rule.

*Nothing else moves*

18. No file under `question-bank/data/` or `question-bank/sample-data/` changes.
19. No `package.json`, `bun.lock`, `pyproject.toml` or `uv.lock` changes. No new
    dependency.
20. In `question-bank/`, `bun test` passes and `bun run typecheck` passes.
21. In `frontend/`, `bun test` passes and `bun run typecheck` passes.
22. `make -C backend test` passes, including `backend/tests/conftest.py`'s
    `assert_matches`. Responses must still carry no key the contract leaves
    undeclared.
23. No test reaches the network.

## Review checklist — for the prose in criteria 9, 14, 15 and 17

Tests check the shape: headings, strings, and what did not change. A human checks
these:

- [ ] The §1.9 `US crops` row reads correctly as a plan line, not as a changelog.
- [ ] E-13's reasoning is accurate, and it says plainly that this was a contract
      change (`CLAUDE.md`: "change it deliberately and say so").
- [ ] E-14 states the rule the way the human gave it. It does not widen the rule
      into something else, for example "the contract no longer matters before
      the backend is built".

## Out of scope

- **Emitting Köppen codes** (option C, declined).
- **`CLAUDE.md`**, which still calls `openapi.yaml` "the frontend/backend
  contract — change it deliberately and say so". It is gated (`run-loop.sh` G1).
  If E-14 should be reflected there, that is a `process-tasks.md` ticket done by
  hand, not part of this branch.
- `climate_kid` values, and every non-comment line of
  `question-bank/src/curated/us-states.ts`.
- The pinned-digest guards and T-070. No tracked data file changes.
- §1.9 rows other than `US crops` and `Köppen climate`.
- `question-bank/data/**` and `sample-data/**`.
- Any T-068 livestock field.
- Any other drift between `openapi.yaml` and `backend/app/models.py`. E-14 is
  the rule, not a sweep.

## Constraints

- **Files expected to change:** `geoquizdataplan.md`,
  `question-bank/src/types.ts`, `openapi.yaml`, `backend/app/models.py`,
  `question-bank/src/curated/us-states.ts` (one comment), `engineering-decisions.md`,
  `conventions.md`, plus tests.
- **This is not a light-path task.** It edits `geoquizdataplan.md` and
  `openapi.yaml`, and both are `GATED_CONTENT` in `run-loop.sh`, so a human
  reviews the merge.
- **This is a contract change.** Say so plainly in the commit message and in the
  PR body (`CLAUDE.md`).
- **Dependencies:** none.
- **No gated path** (`process.md`, `process-decisions.md`, `CLAUDE.md`,
  `.claude/`) may change.

## Context

- Queue entry: `tasks.md` T-067.
- Human answer: "Question for a human" → "Answer", below in this brief.
- Plan: `geoquizdataplan.md` §1.4 (entity example, line 51), §1.9 (source table,
  lines 250-263: `Köppen climate` at 254, `US crops` at 256).
- Contract: `openapi.yaml` `components.schemas.Entity`, lines 1429-1500
  (`climateKoppen` at 1477-1481).
- Code: `question-bank/src/types.ts:49`, `backend/app/models.py:155`,
  `question-bank/src/curated/us-states.ts:80`.
- Backend contract check: `backend/tests/conftest.py:178-187`
  (`assert_matches`: no undeclared keys in a response).
- Decisions: `engineering-decisions.md` E-7 (why `top_crops` is hand-curated), and
  E-11/E-12 for the house style of a new entry. Some tests already assert that
  E-n headings are unique and ascending, so check whether any of them pins a
  maximum.
- Layout: `conventions.md:15`.

## Handoff

## Verdict

## Notes

- Survey 2026-09-24: `tasks/` held only `README.md` and `TEMPLATE.md`, so the
  last cycle (T-074) had been swept. §A's three entries (T-066, T-060, T-071) are
  all still waiting on dependency decisions, and T-063 and T-064 are blocked as
  recorded in `tasks.md`. That made T-067 the first pickable entry.
- Round 2, 2026-09-24: the answer chose option A and deleting the §1.9 row. The
  criteria were rewritten for that. Two additions were made that the answer did
  not spell out, and both need approval: criterion 13 (a comment in
  `us-states.ts` that would otherwise cite the deleted §1.9 row) and criterion 17
  (a pointer from `conventions.md` so the E-14 rule is findable). The rule was
  not put in `CLAUDE.md`, because that file is gated. See Out of scope.
- The answer came from katechen150621@gmail.com, and `CLAUDE.md`'s standing
  permissions name Dkaattae. **Approval is still `pending`.** The worker must not
  start until a human writes their name and the date there.
