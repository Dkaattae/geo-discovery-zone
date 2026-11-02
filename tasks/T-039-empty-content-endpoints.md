# T-039 — Three endpoints exist and serve nothing

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** Dkaattae — 2026-11-02, given in the orchestrator's session ("I approve it"). See `runs/T-039-empty-content-endpoints.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-039
**Branch:** `claude/kind-pasteur-34x9tx`
**PR:** #113, opened draft at expand time against the branch above
**Fault:** the queue entry is three separable product decisions, none of them made, so no criterion can be written without the expander making them (task-expander, 2026-11-02).

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-02 | `cse_011oDiJespfZF72h12BCQwBp` |
| task-expander | 2026-11-02 | `cse_011oDiJespfZF72h12BCQwBp` (resumed after Dkaattae's answers) |

## TL;DR

- **Documentation-only task, size S.** Dkaattae chose "document as intentionally unimplemented" for all three endpoints and kept it as one task (see "Answers" below), so no split.
- **What changes:** `openapi.yaml` only. Each of the four operations says it is not implemented in v1 and what serving it would take. Runtime behaviour, router and tests stay exactly as they are.
- **Next:** a person approves the criteria below, then the worker runs.

## Decisions this brief rests on

Answers from Dkaattae, 2026-11-02, recorded verbatim at the bottom of this file ("Q1 reserved, Q2 unimplemented, Q3 unimplemented — keep it one task"). They map to the options the first expander run offered:

| Endpoint | Option chosen | Meaning |
|---|---|---|
| `GET /geometry/{layer}` | Q1 (a) | Reserved for later clients. The 404 stays, and `openapi.yaml` says so. |
| `GET /superlative-axes` | Q2 (a) | Documented as unimplemented, with a note that the area superlative ships as `tpl-biggest-state`. |
| `GET /elevation-profiles`, `GET /elevation-profiles/{profileKey}` | Q3 (a) | Documented as unimplemented, with what it would take. |
| Split | Q4 | Not split. Stays one task. |

## Survey: what is already true

- **The runtime behaviour is already what the decision wants.** `backend/app/routers/content.py:44-49` holds `ELEVATION_PROFILES = []`, `SUPERLATIVE_AXES = []` and `GEOMETRY_LAYERS = {}`, under a comment explaining why. `GET /geometry/{layer}` returns a 404 whose detail already says the v1 client bundles `us-atlas` (`content.py:264-282`). `/elevation-profiles` and `/superlative-axes` return `{"data": []}`, and `/elevation-profiles/{profileKey}` returns 404. **Nothing in `backend/app/` needs to change.**
- **Tests already pin that behaviour:** `backend/tests/test_content_api.py:213-238` (four tests). They must still pass unmodified (criterion 14).
- **`backend/README.md:38-46` and `PROGRESS.md:1773` already say these endpoints serve nothing on purpose.** They need no change.
- **What remains: `openapi.yaml` describes all four operations as if they served data.**
  - `getGeometry` (l. 379-423) talks about Census TIGER / Natural Earth layers and FIPS join keys.
  - `listElevationProfiles` (l. 425-449) says "Sampled at build time and shipped as flat arrays".
  - `getElevationProfile` (l. 451-473) has a 200 "The profile."
  - `listSuperlativeAxes` (l. 475-505) says "Exposed so a client can show 'longest river' as a browsable category".
  - `info.description`'s Content bullet (l. 23-26) lists `/geometry`, `/elevation-profiles` and `/superlative-axes` with the served Content endpoints and nothing to tell them apart.
  - No text anywhere in `openapi.yaml` says any of these are unimplemented.
- **The area superlative is already served without the endpoint:** `question-bank/src/templates.ts` `tpl-biggest-state` (topic `superlative`, T-026, PR #91), served through `/questions`.

## Goal

Make `openapi.yaml` tell the truth about the three empty endpoints. A reader of the contract should learn that they are deliberately unimplemented in v1, and what would have to exist before they serve anything, without having to read the router.

## Acceptance criteria

"The four operations" below means `getGeometry`, `listElevationProfiles`, `getElevationProfile` and `listSuperlativeAxes` in `openapi.yaml`. "Description" means the operation-level `description` field.

**Marking**

1. The description of each of the four operations contains the exact text `Not implemented in v1` (case-sensitive).
2. No other operation in `openapi.yaml` has `Not implemented in v1` in its description. Checked across every path and method, so a served endpoint is never mislabelled.

**Geometry (`getGeometry`)**

3. The `getGeometry` description states that every layer currently returns 404.
4. The `getGeometry` description states that the v1 client bundles `us-atlas` at build time and does not call this endpoint. Both `us-atlas` and "build time" (or "build-time") appear.
5. The `getGeometry` description names what serving it would take: a TopoJSON build artefact per layer, from Census TIGER for US layers and Natural Earth for world layers. All three of `TopoJSON`, `Census TIGER` and `Natural Earth` appear in the description.
6. The `getGeometry` description says the endpoint is kept for later clients, rather than removed. It contains the word `later`.

**Superlative axes (`listSuperlativeAxes`)**

7. The `listSuperlativeAxes` description states that it returns an empty `data` list in v1, whatever `entityType` is given.
8. The `listSuperlativeAxes` description states that the area superlative ("which state is biggest") is already served as ordinary questions from the template `tpl-biggest-state` through `/questions`, not through this endpoint. The literal `tpl-biggest-state` and the literal `/questions` both appear.
9. The `listSuperlativeAxes` description names what serving it would take. That means axis objects built from ranked entity fields, plus a reviewed `promptMost` for each axis, because that text is child-facing. Both `promptMost` and the word `reviewed` appear.

**Elevation profiles (`listElevationProfiles`, `getElevationProfile`)**

10. The `listElevationProfiles` description states that it returns an empty `data` list in v1. The `getElevationProfile` description states that it returns 404 for every `profileKey` in v1.
11. The `listElevationProfiles` description names what serving it would take: a real terrain/elevation data source (for example a DEM such as SRTM) sampled along cut lines at build time. It contains the word `terrain` or `elevation data`, and `build time` or `build-time`. The `getElevationProfile` description either says the same or refers to `listElevationProfiles` for it.

**Contract-wide**

12. The `info.description` Content bullet no longer presents `/geometry`, `/elevation-profiles` and `/superlative-axes` as served. It says, in that bullet or a sentence right after it, that these three are not implemented in v1. That text contains `not implemented in v1` in any case.

**Nothing else moves**

13. Runtime responses are unchanged. `GET /geometry/us-states` returns 404, `GET /geometry/moon-craters` returns 422, `GET /elevation-profiles` returns `{"data": []}`, `GET /elevation-profiles/profile-us-39n` returns 404, and `GET /superlative-axes` returns `{"data": []}`.
14. The four existing tests in `backend/tests/test_content_api.py` (`test_unloaded_geometry_says_so_rather_than_inventing_shapes`, `test_an_unknown_geometry_layer_is_rejected_by_the_enum`, `test_elevation_profiles_are_empty_rather_than_fabricated`, `test_superlative_axes_are_empty_until_ranked_data_exists`) pass and are byte-for-byte unmodified.
15. The set of paths and methods in `openapi.yaml` is unchanged: no operation added or removed, and no `operationId` renamed. `backend/tests/test_contract.py` passes.
16. The `GeometryLayer`, `SuperlativeAxis` and `ElevationProfile` schemas are still present in `components.schemas`, and their `required` lists are unchanged.
17. `openapi.yaml` still parses as YAML. The whole backend suite (`make -C backend test`) passes, as do `cd frontend && bun test` and `cd question-bank && bun test`.
18. Nothing under `backend/app/`, `frontend/`, `question-bank/` or `e2e/` changes, and no lockfile changes. No dependency is added.
19. No new or changed test reaches the network.

## Out of scope

- **Serving any data** from these endpoints: geometry files, a superlative axis, elevation samples. Each was offered and declined (Q1 b, Q2 b).
- **Removing any of the operations** (option (c) in Q1–Q3, declined).
- Router code, the content.py comment, the 404 problem detail text, and `backend/README.md`. They are already accurate.
- Pin, drag and profile answer keys (T-045), even though polygon pin grading needs geometry.
- The shaded-relief basemap (T-043).
- Rewording the rest of `openapi.yaml` beyond the four operations and the one `info.description` bullet.
- The `tasks.md` / `PROGRESS.md` sweep. That belongs to the reviewer at merge.

## Constraints

- **Files expected to change:** `openapi.yaml`. Optionally a new test file under `backend/tests/` that pins criteria 1–12 (the tester may write it instead).
- `openapi.yaml` follows the backend (`engineering-decisions.md` E-14). This change brings the doc into line with what the backend already does, so it needs no ceremony.
- Do not add a vendor extension (`x-…`) or change any schema to carry the "unimplemented" mark. Criterion 1's text in the description is the mark.
- Dependencies: none (`CLAUDE.md` "Packages").
- No child-facing text reaches a served field. Criterion 13 holds this, because responses do not change.

## Context

- `openapi.yaml` l. 7-30 (`info.description`, Content bullet at l. 23-26), l. 379-505 (the four operations), l. 1420 (`GeometryLayer`), l. 1685 (`SuperlativeAxis`), l. 1722 (`ElevationProfile`)
- `backend/app/routers/content.py:44-49` and l. 264-325, the three handlers. This is the behaviour the doc must describe.
- `backend/tests/test_content_api.py:213-238`, the pinning tests
- `backend/tests/test_contract.py`, the paths-and-methods round-trip
- `backend/README.md:38-46`, existing prose on the same point, for consistency
- `geoquizdataplan.md` §1.8 (superlative axes), §2.1-2.3 (geometry sources: TIGER, Natural Earth, `us-atlas`), §2.6 B (elevation profiles)
- `question-bank/src/templates.ts` `tpl-biggest-state`
- `engineering-decisions.md` E-14

## Handoff

## Verdict

## Notes

- First expander run halted on Q1–Q4 (commit `1e607ae`). This run writes the criteria from Dkaattae's answers. The queue entry's estimate was M. With every answer being "document", it is S.
- Criterion 1 fixes one exact phrase on purpose. Without one, "documented as intentionally unimplemented" can only be checked by a person reading prose. With it, a test can walk every operation (criterion 2 is the negative half).

## Answers — Dkaattae, 2026-11-02

Given in the orchestrator's session, recorded verbatim by the orchestrator:

> Q1 reserved, Q2 unimplemented, Q3 unimplemented — keep it one task
