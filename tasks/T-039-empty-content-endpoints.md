# T-039 — Three endpoints exist and serve nothing

**Status:** `blocked`
**Next step:** `human`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-039
**Branch:** `claude/kind-pasteur-34x9tx`
**PR:** opened draft at expand time against the branch above; see the PR list for `claude/kind-pasteur-34x9tx`
**Fault:** the queue entry is three separable product decisions, none of them made, so no criterion can be written without the expander making them (task-expander, 2026-11-02).

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-02 | `cse_011oDiJespfZF72h12BCQwBp` |

## TL;DR

- **Halted before writing criteria.** T-039 is three decisions (geometry, superlative axes, elevation profiles), and the queue entry leaves all three open.
- **What a person needs to do:** answer Q1–Q3 below and either accept the proposed split (Q4) or say T-039 stays one task. Then set `Next step: task-expander` and start a new expander run.
- **Optional:** if you would rather the loop moved on first, the first decision-free task in the queue is **T-047** (see "Why T-039, and why not later tasks").

## Why T-039, and why not later tasks

`process.md` step 1: take the first task in `tasks.md` whose dependencies are done.

| Task | Skipped? | Why |
|---|---|---|
| T-085b | skipped | Depends on a reachable Census Bureau release. Its entry says a person must first choose one of three sources, and nothing in `PROGRESS.md` or the queue records that choice |
| T-056 | skipped | `Depends on: a design decision` (threshold, partial mastery, or cross-topic counting). Not made |
| T-095 | skipped | "Needs a person's call before it is expanded" — options (a)/(b)/(c). Not made |
| **T-039** | **picked** | `Depends on: —`. Its body is three decisions, so the expansion halts here instead |

The tasks after T-039 are mostly decisions too. T-045 asks whether the pin, drag and profile formats are near-term. T-053 says "The decision here is the product one". T-093 is "snapshot the list, or decide a place looked at is a place seen". T-046 is a naming decision. **T-047** (`test-guidelines.md`'s `api/` section) is the first entry that needs no decision. I did not switch to it on my own (`task-expander.md`: "Do not pick a different task instead").

## Survey: what is already true

- **All three endpoints exist and return nothing on purpose.** `backend/app/routers/content.py:44-49` defines `ELEVATION_PROFILES = []`, `SUPERLATIVE_AXES = []` and `GEOMETRY_LAYERS = {}`, under a comment saying invented numbers are worse than none.
  - `GET /geometry/{layer}` returns 404. The problem detail already explains that "the v1 client bundles us-atlas at build time instead" (`content.py` around lines 270-282).
  - `GET /elevation-profiles` returns `{"data": []}`, and `/elevation-profiles/{profileKey}` returns 404.
  - `GET /superlative-axes` returns `{"data": []}`.
- **Tests pin the empty state on purpose.** `backend/tests/test_content_api.py`: `test_unloaded_geometry_says_so_rather_than_inventing_shapes` (l. 213), `test_an_unknown_geometry_layer_is_rejected_by_the_enum` (l. 220), `test_elevation_profiles_are_empty_rather_than_fabricated` (l. 226), and `test_superlative_axes_are_empty_until_ranked_data_exists` (l. 234). Anything that serves data turns the matching test red, and it would need a Test change request.
- **`openapi.yaml` describes all three as if they were served.** `/geometry/{layer}` (l. 379) mentions Census TIGER and Natural Earth layers, `/elevation-profiles` (l. 425) mentions build-time sampling, and `/superlative-axes` (l. 475, schema `SuperlativeAxis` l. 1685) mentions browsable categories. None of them says the endpoint is unimplemented.
- **Superlative questions are already served without this endpoint.** `question-bank/src/templates.ts` `tpl-biggest-state` (l. 235): prompt "Which of these states is the biggest?", `next_ranked_by_area`, `topic: superlative` (T-026, PR #91). No axis object exists anywhere in the pipeline. The template is a template, not a `SuperlativeAxis`.
- **No client calls any of the three.** The frontend, the integration tests and the e2e tests do not request `/geometry`, `/elevation-profiles` or `/superlative-axes`. The only caller is `backend/tests/test_content_api.py`.

## Questions for a person

Each one is a product call that `CLAUDE.md` or the role reserves for a person. Under the orchestrator the approval gate is skipped (`process.md`, "Approve"), so choosing them in the brief would mean nobody reviews the choice before code is written.

**Q1 — Geometry (`/geometry/{layer}`).** Pick one:
- **(a) Document it as reserved for later clients.** `openapi.yaml` says the endpoint is intentionally unimplemented in v1, that the v1 client bundles `us-atlas`, and what serving it would take (a Census TIGER / Natural Earth TopoJSON build artefact per layer). The 404 stays.
- **(b) Serve `us-states` now** from a TopoJSON committed to or built into `backend/`. This adds a data file to the image, and possibly a dependency or a build step, which needs your approval under `CLAUDE.md` "Packages". Say where the file comes from.
- **(c) Remove the operation** from `openapi.yaml` and the router until a client needs it.

**Q2 — Superlative axes (`/superlative-axes`).** Pick one:
- **(a) Document it as unimplemented**, and note that the area superlative ships as `tpl-biggest-state`.
- **(b) Serve the US area axis** (`axis: areaKm2` or similar, `entityType: state`, `scopeVariants: ["scope:us"]`, `reveal: map_highlight`). This needs a `promptMost` that reaches a client, which is child-facing text. Say whether reusing `tpl-biggest-state`'s already-shipped prompt, "Which of these states is the biggest?", is acceptable, or whether the text goes through `reviewed: false` first. Also say whether this axis should come from the pipeline (one source of truth with the template) or be a hand-written backend constant.
- **(c) Remove the operation.**

**Q3 — Elevation profiles (`/elevation-profiles`, `/elevation-profiles/{profileKey}`).** The entry calls this "a project of its own" (plan §2.6 B). Confirm **(a) document as intentionally unimplemented, with what it would take**, or choose **(c) remove both operations**. Serving real profiles is not offered here, because it needs a terrain source the repo does not have.

**Q4 — Split.** Proposed, if any answer is "serve" (Q1 b or Q2 b):
- **T-039a** — documentation only: every endpoint you answered (a) or (c) for, in `openapi.yaml` (and the router, for (c)). S.
- **T-039b** — serve the superlative axis (Q2 b). S–M.
- **T-039c** — serve `us-states` geometry (Q1 b). M, with the dependency or data question answered first.

If all three answers are (a) or (c), T-039 stays one S task and no split is needed.

## What the criteria will look like once answered

This is a draft, not criteria. It is only here to show that each answer leads to something checkable.

- For every endpoint answered (a): its `openapi.yaml` operation `description` states that it is intentionally unimplemented in v1 and names what serving it would take. Its runtime response is unchanged (404 or `{"data": []}`), and the existing test for that endpoint still passes unmodified.
- For every endpoint answered (c): the path is absent from `openapi.yaml`, the router no longer registers it, a request returns 404 from routing, and the contract test that walks `openapi.yaml` in both directions passes. The pinning test becomes a Test change request row.
- For Q2 (b): `GET /superlative-axes` returns exactly the agreed axis. `?entityType=state` returns it and `?entityType=country` returns `{"data": []}`. Its `promptMost` is exactly the agreed text. `test_superlative_axes_are_empty_until_ranked_data_exists` changes through a Test change request.
- In every case: no new dependency without approval, and no test reaches the network.

## Goal

To be finished after the answers. In short: stop leaving "implemented, returns nothing" undocumented, by either serving real data or saying in `openapi.yaml` that each endpoint is deliberately unimplemented.

## Acceptance criteria

**Not written. Blocked on Q1–Q4.**

## Out of scope

- Pin, drag and profile answer keys (T-045), even though polygon grading needs geometry.
- The shaded-relief basemap (T-043).
- Superlatives on any axis other than state area, and on any entity type other than `state`.

## Constraints

- Dependencies: none without asking (`CLAUDE.md`).
- `openapi.yaml` follows the backend (E-14), so a doc-only change to it needs no ceremony.
- Child-facing text that is not already shipped and reviewed does not reach a served field (`CLAUDE.md` "Content rules").

## Context

- `backend/app/routers/content.py:44-49` and the three handlers (around l. 255-325)
- `backend/tests/test_content_api.py:213-238`
- `openapi.yaml` l. 379-505 (paths) and l. 1685 (`SuperlativeAxis`)
- `geoquizdataplan.md` §1.8 (superlative axes), §2.1-2.3 (geometry), §2.6 (elevation)
- `question-bank/src/templates.ts` `tpl-biggest-state`
- `engineering-decisions.md` E-14 (openapi follows the backend)

## Handoff

## Verdict

## Notes
