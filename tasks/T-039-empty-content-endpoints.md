# T-039 — Three endpoints exist and serve nothing

**Status:** `test changes requested`
**Next step:** `human`
**Approved:** Dkaattae — 2026-11-02, given in the orchestrator's session ("I approve it"). See `runs/T-039-empty-content-endpoints.md`.
**Test changes:** `requested`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-039
**Branch:** `claude/kind-pasteur-34x9tx`
**PR:** #113, opened draft at expand time against the branch above
**Fault:** test changes are waiting for approval: eight pre-existing question-bank pins (rows 1-8 of `## Test change request`) are red by this task's own change, so criterion 17 cannot pass until a person approves them in an attended `tester` session (tester, 2026-11-02; rows 7-8 added by the attended tester).

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-02 | `cse_011oDiJespfZF72h12BCQwBp` |
| task-expander | 2026-11-02 | `cse_011oDiJespfZF72h12BCQwBp` (resumed after Dkaattae's answers) |
| worker | 2026-11-02 | `cse_011oDiJespfZF72h12BCQwBp` |
| tester | 2026-11-02 | `cse_011oDiJespfZF72h12BCQwBp` (orchestrated subagent; same id as every role, see Verdict) |
| tester | 2026-11-02 | `cse_011oDiJcM1hdV3SgkFgmp95W` (attended; a separate session from every row above) |

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

**TL;DR:** `openapi.yaml` now marks the four operations `Not implemented in v1`, with what serving each would take; the `info.description` Content bullet no longer lists them as served. No runtime change. Three existing question-bank tests that pin `openapi.yaml` byte-for-byte are now red **by design** — listed under Tests made stale. Next: tester.

**Note on sessions:** every row in the Sessions table, including the worker's, reports the same `CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_011oDiJespfZF72h12BCQwBp`). The roles ran as separate subagents under one orchestrated remote session, so that id cannot tell them apart. The tester should record its own id and judge independence on that basis; owner: tester, escalate to human if it cannot.

### What changed

- **`openapi.yaml`**
  - `info.description`: Content bullet now lists only `/entities`, `/questions`, `/bundles`; the next sentences say `/geometry`, `/elevation-profiles`, `/superlative-axes` are "not implemented in v1".
  - `getGeometry` description: rewritten (old FIPS/ISO join-key text kept, under "Once served").
  - `listElevationProfiles` description: rewritten (old "flat arrays / no API key" reasoning kept as part of what serving would take).
  - `getElevationProfile`: gained a `description` (it had none).
  - `listSuperlativeAxes` description: rewritten (old "axes, not questions" text kept under "Once served").
  - Nothing else: no path, method, operationId, parameter, response or schema touched; no `x-` extension.
- **`backend/tests/test_unimplemented_content_docs.py`** (new, 3 tests): pins criteria 1-2 exactly (the set of operations carrying the mark equals the four), the literal needles of 3-11, and 12. Worker-written, so not the independent check.
- **`tasks/T-039-empty-content-endpoints.md`**: this section, header, Sessions row, Notes.

### Where each criterion lives

| # | Where |
|---|---|
| 1-2 | `openapi.yaml` four operation descriptions, each opening `**Not implemented in v1.**`; no other operation has it |
| 3-6 | `getGeometry` description: "Every layer currently returns 404", "bundles `us-atlas` at build time … does not call this endpoint", "TopoJSON build artefact … Census TIGER … Natural Earth", "kept, rather than removed, for later clients" |
| 7-9 | `listSuperlativeAxes` description: "empty `data` list, whatever `entityType`", "`tpl-biggest-state` through `/questions`", "reviewed `promptMost` … child-facing" |
| 10-11 | `listElevationProfiles` ("empty `data` list", "terrain/elevation data source … DEM such as SRTM … at build time"); `getElevationProfile` ("404 for every `profileKey`", refers to `listElevationProfiles`) |
| 12 | `info.description`, sentence directly after the Content bullet text, inside the bullet |
| 13-14 | unchanged `backend/app/routers/content.py`; `backend/tests/test_content_api.py` untouched and passing |
| 15 | no path/method/operationId change; `test_contract.py` passes |
| 16 | schemas untouched |
| 17 | backend suite green; see below for frontend/question-bank |
| 18 | only `openapi.yaml`, one new backend test, the brief changed |
| 19 | the new test reads the parsed spec fixture only |

### How to run

- `make -C backend test` — 747 passed, 9 skipped (includes the 3 new tests).
- `make -C backend lint` and `make -C backend format-check` — clean.
- `cd question-bank && bun test` — 2676 pass, 17 fail. 14 of those fail identically on the clean head `3de6aca` (see below); 3 are the stale tests.
- `cd frontend && bun test` — 386 pass, 10 fail, **identical on the clean head**: this container has no `frontend/node_modules` (`react/jsx-runtime`, `@eslint/js` missing), and `bun install --frozen-lockfile` was refused by the proxy (403 on a tarball). No frontend file changed, so this is environmental; the tester should rerun where deps install. Side effect seen: one frontend test rewrites `frontend/README.md` (escapes a `*`) when run; I reverted it, do not commit it.

### Pre-existing reds (not caused by this change; same on `3de6aca` with my diff stashed)

- question-bank, T-066 criteria 1-8 and 15 (11 tests): `oxlint`/`prettier` not installed in this container.
- question-bank, `T-096 criteria 17-21 … criterion 21` and `T-091 criterion 22 … every tracked non-test file outside the allowed list is 12d242e's` — tree-scope pins already red on the branch head before my change.

### Tests made stale

All three pin `openapi.yaml` to an earlier hash; criteria 1-12 require changing that file, so they cannot pass. Proposed: re-pin each to the new content (new file sha256 `cd4015e64025f5a3b1b88e5a8948597708f7c5924df924109454850f21c5bcb0`), with a "re-pinned T-039" comment as the repo already does.

- `question-bank/src/agriculture-true-wrong-answers-verify.test.ts` — `T-088 criteria 20-25: what must not change > criterion 21: openapi.yaml is byte-identical to main's`. Stale by criteria 1-12. Modify: `MAIN_FILE_SHA["openapi.yaml"]` → `cd4015e6…bcb0`.
- `question-bank/src/map-click-no-candidates-verify.test.ts` — `T-092 criterion 16: no other surface changes > openapi.yaml (except []) is byte-identical to 5d72ca5`. Stale by criteria 1-12. Modify: the `openapi.yaml` row digest `35831a81…d6e6` → treeDigest `8453b57aee6100483248586f57da6555368adfd8b90abe820aaf35e2c9ffac5f` (test name would then want a new ref).
- `question-bank/src/familiarity-drawn-apart-verify.test.ts` — `T-085a criteria 23-25: negative > criterion 25: openapi.yaml is unchanged since 5ae564a`. Stale by criteria 1-12. Modify: `BEFORE_FILE_SHA["openapi.yaml"]` → `cd4015e6…bcb0`.

No count floors affected.

### Deliberately not done

- No router, README, or schema change (out of scope; already accurate).
- No `tasks.md` / `PROGRESS.md` sweep (reviewer's).
- Did not fix the pre-existing reds above (not this task).

### Contradicts the brief

- **Criterion 17 / 18 vs. existing pins:** the brief says "Test changes: `none`" and criterion 17 expects `question-bank` `bun test` to pass, but three existing tests pin `openapi.yaml`'s bytes, so any change satisfying 1-12 turns them red. Not a contradiction the worker can resolve — tester to raise the test change request (D-14), human to approve.
- **Criterion 17** also cannot be fully observed in this container for `frontend` (no deps). Tester to rerun where `bun install` works; owner: tester.

## Verdict

**TL;DR:** `test changes requested`, not yet pass. Criteria 1-16, 18 and 19 are met, each with a test in `backend/tests/test_t039_tester_criteria.py` (18 tests, all green). Criterion 17 is not met yet: the question-bank suite has **six** red pins caused by this task's own change. The worker named three; I found two more plus a knock-on one. **Next: a person approves rows 1-6 below in an attended `tester` session.** That session applies them and finishes the verdict.

**Independence.** This run is orchestrated (`runs/T-039-empty-content-endpoints.md` exists). Every role reports the same `CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_011oDiJespfZF72h12BCQwBp`), so the Sessions-table check proves nothing here. My independence rests only on being a freshly spawned subagent with its own context: I did not see the worker's reasoning. That is weaker than a separate session, because it depends on the orchestrator having spawned me correctly, and I cannot check that myself.

| # | Verdict | Evidence (`backend/tests/test_t039_tester_criteria.py`) |
|---|---|---|
| 1 | met | `test_c1_…`: all four descriptions contain `Not implemented in v1` |
| 2 | met | `test_c2_…`: walks every path and method; no other operation has the mark |
| 3 | met | `test_c3_…`: `404` plus "every layer" |
| 4 | met | `test_c4_…`: `us-atlas`, `build time`, "does not call" |
| 5 | met | `test_c5_…`: `TopoJSON`, `Census TIGER`, `Natural Earth` |
| 6 | met | `test_c6_…`: the word `later` |
| 7 | met | `test_c7_…` (empty, `data`, `entityType`); runtime half in `test_c13_…` (`?entityType=state/river/country` → `{"data": []}`) |
| 8 | met | `test_c8_…`: `tpl-biggest-state`, `/questions`, "biggest" |
| 9 | met | `test_c9_…`: `promptMost`, `reviewed`, "rank" |
| 10 | met | `test_c10_…`: list "empty" + `data`; get `404` + "every `profileKey`" |
| 11 | met | `test_c11_…`: `terrain` + `build time` on the list; get refers to `listElevationProfiles` |
| 12 | met | `test_c12_…`: the Content bullet's served list leaves out all three paths; the bullet then says "not implemented in v1" and names all three |
| 13 | met | `test_c13_…`: the five responses, exactly as the criterion gives them |
| 14 | met | `test_c14_…`: sha256 of each of the four functions' whole source lines equals its value at `3de6aca`. The four tests pass. |
| 15 | met | `test_c15_…`: (path, method, operationId) set equals the 32 at `3de6aca`; `test_contract.py` passes |
| 16 | met | `test_c16_…`: the three schemas are present; `required` lists match `3de6aca` (`GeometryLayer` is a string enum with no `required`) |
| 17 | **not met** | YAML parses (`test_c17_…`) and the backend suite is green. **question-bank is red by this task's change:** rows 1-6 below. Frontend: green in CI on `f414d7a`. Locally it is environmental only (see below). |
| 18 | met | `git diff --name-only 3de6aca HEAD -- backend/app frontend question-bank e2e '*lock*'` is empty. Checked by command, not by a test: a lasting tree pin is exactly what produced rows 4-5. |
| 19 | met | `test_c19_…`: neither T-039 test file imports a network client or names a URL. The runtime tests use the in-process ASGI client from `conftest.py`. |

**Runs (this container, branch head `f414d7a` plus my test file):**
- `make -C backend test`: **765 passed, 9 skipped.**
- `make -C backend lint`: all checks passed. `make -C backend format-check`: 57 files already formatted.
- `cd question-bank && bun test`: **2674 pass, 19 fail.**
  - 6 are rows 1-6 below.
  - 13 are pre-existing: T-066 c1-8 and c15 (11 tests: `oxlint` and `prettier` are not installed here), T-096 c21, and T-091 c22's first test. I confirmed T-096 c21 and T-091 c22a are red on `3de6aca`, before this task.
  - 1 more is bun's "Unhandled error between tests": `src/prettier-gate.test.ts` cannot find package `prettier`. Also environmental.
- `cd frontend && bun test`: 386 pass, 10 fail. Every failure is environmental: `react/jsx-runtime` is missing, and the lint and format scripts are absent because this container has no `frontend/node_modules`. No frontend file changed. CI on `f414d7a` reports `frontend (typecheck, lint, test)` **success**, and so do backend, postgres, e2e and integration. Only `question-bank` fails, which matches rows 1-6.
- One frontend test rewrote `frontend/README.md` during the run. I reverted it and did not commit it.

**Simulation of the request.** In a scratch worktree (HEAD plus this test file), I applied rows 1-6 exactly as written below. The question-bank suite then went to **2679 pass, 14 fail**. All 14 were the pre-existing and environmental reds listed above: the 13 tests plus the `prettier` load error. So the six rows are sufficient and every value in them is exact. I committed none of those edits.

**How my own tests were checked (temporary mutations, all reverted, `git status` clean afterwards):**
- I swapped `openapi.yaml` for its `3de6aca` version. c1 and c3-c12 went red (11 tests).
- I removed the mark from `getElevationProfile`. Only c1 went red.
- I added the mark to `listEntities`. Only c2 went red.
- I put `/geometry` back in the Content bullet's served list. Only c12 went red.
- I replaced `tpl-biggest-state` with other text. Only c8 went red.
- I renamed operationId `getElevationProfile` and dropped `promptMost` from `SuperlativeAxis.required`. c15 and c16 went red, and so did c1, c2, c10 and c11, because they look the operation up by its id.
- I added a trailing comment to `test_an_unknown_geometry_layer_is_rejected_by_the_enum`. c14 was green at first, because `ast.get_source_segment` ignores trailing comments. I fixed my test to hash whole lines, and it then went red. I also made `test_superlative_axes_are_empty_…` assert `or True`, and c14 went red.
- I set `SUPERLATIVE_AXES = [{"id": "x"}]` in `content.py`. c13 went red. Reverted.

**For whoever reviews this.** The worker's "Tests made stale" list named rows 1-3 only. Rows 4 and 5 are red because the worker's commit added a tracked test file under `backend/`, and my commit adds a second one. Row 6 follows from applying rows 1-3. Any later task that edits `openapi.yaml` or adds a backend test file will hit these same pins.

## Test change request

Raised 2026-11-02 by the tester. **Not approved, and nothing is applied.** **Amended 2026-11-02 by an attended tester (session `cse_011oDiJcM1hdV3SgkFgmp95W`):** rows 7 and 8 added, and row 6 recomputed. The first run called T-091 c22a and T-096 c21 "pre-existing" because it checked them at `3de6aca`. That commit already carried this task's brief and run log. On `main` (`bfa9af1`) both pass, and CI on `f414d7a` shows them red on this branch alongside rows 1-5. Re-simulated in a scratch worktree on `7e0ba39` with rows 1-8 applied: question-bank **2681 pass, 12 fail**. All 12 are environmental (11 T-066 tests plus the `prettier` load error; `oxlint` and `prettier` are not installed here). Each row was checked against the branch at `f414d7a` plus this commit. Values were computed in a scratch worktree with all six rows applied: the suite then had only the 14 pre-existing reds. All file paths are under `question-bank/src/`. "T-039" in a comment means the re-pin is this request's.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `agriculture-true-wrong-answers-verify.test.ts` › "T-088 criteria 20-25: what must not change" › "criterion 21: openapi.yaml is byte-identical to main's" | `e9d666e`, T-088 tester: T-088 must not touch the contract | Criteria 1-12 require editing `openapi.yaml` (changed in `ed00235`) | modify | Same name. `MAIN_FILE_SHA["openapi.yaml"]` changes from `cddf482a…f216` to `cd4015e64025f5a3b1b88e5a8948597708f7c5924df924109454850f21c5bcb0`, with comment `// re-pinned at \`ed00235\` (T-039, Test change request row 1): …`. It still asserts the whole file's sha256 equals that value. | |
| 2 | `map-click-no-candidates-verify.test.ts` › "T-092 criterion 16: no other surface changes" › `"openapi.yaml (except []) is byte-identical to 5d72ca5"` (a `test.each` row) | `cf63f66`, T-092 tester: T-092 must not touch the contract | Same as row 1 | modify | Remove the `openapi.yaml` row from the `test.each` table. Add a separate test, `"openapi.yaml (except []) is byte-identical to ed00235"`, asserting `treeDigest(REPO, "openapi.yaml", [])` is `8453b57aee6100483248586f57da6555368adfd8b90abe820aaf35e2c9ffac5f`, with a "Re-pinned at ed00235 (re-pinned T-039, Test change request row 2)" comment. This is the same split as the file's existing `backend/app` precedent. | |
| 3 | `familiarity-drawn-apart-verify.test.ts` › "T-085a criteria 23-25: negative" › "criterion 25: openapi.yaml is unchanged since 5ae564a" | `b061fd8`, T-085a tester: T-085a must not touch the contract | Same as row 1 | modify | Renamed to "criterion 25: openapi.yaml is unchanged since ed00235 (re-pinned T-039)". `BEFORE_FILE_SHA["openapi.yaml"]` changes to `cd4015e64025f5a3b1b88e5a8948597708f7c5924df924109454850f21c5bcb0`, with a comment. It still asserts the whole file's sha256. The other `BEFORE_FILE_SHA` loop excludes `openapi.yaml`, so nothing else moves. | |
| 4 | `refresh-regenerate-reminder-verify.test.ts` › "T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes" › "every tracked file under the three trees is 0a98e11's, none added or removed" | `40f6c54`, T-087 tester: T-087 must not touch those trees | The brief's Constraints allow a new test file under `backend/tests/`. `ed00235` added `test_unimplemented_content_docs.py`, and the tester commit adds `test_t039_tester_criteria.py`. | modify | Renamed to "every tracked file under the three trees is as re-pinned by T-039, none added or removed". `MAIN_BOUNDARY_SHA` changes from `a0171194…5c6e` to `dd45779913252a004865a331e645d523cdb14831fc5ca9b3b3074c9fa157a043`, with comment `// Re-pinned by T-039 (Test change request row 4): T-039 added two backend test files.` It still asserts the `fileRowsSha` over every tracked file under the three trees. | |
| 5 | `climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "pre-existing test files are main's, except ones in an approved Test change request" | `950f334`, T-091 tester; re-pinned by `8bf0959` (T-087). It protects every other test file from being changed. | The same two new backend test files raise the count and change the digest | modify | Same name. `MAIN_TESTS_COUNT` 107 → **109**. `MAIN_TESTS_SHA` changes from `bc91f541…291d` to `31f18e10587d68449c2355ffb1e9df00acf0faac7df1b5a04e52630b2f2ab81b`, with comment `// Re-pinned by T-039 (Test change request row 5): …`. It still asserts the count and the `fileRowsSha`. | |
| 6 | `climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | `bac230d`, T-091 tester. It pins T-091's re-pinned files to their exact bytes. | Rows 1-3 and 8 edit four of those files, so their pinned digests must move with them. A consequence of approving rows 1-3 and 8, not a separate change. | modify | Same name. In `APPLIED_REQUEST_FILE_SHAS`, four entries get a `// re-pinned by T-039 (Test change request row 6)` comment and a new value: `agriculture-true-wrong-answers-verify.test.ts` → `f683a4ee562de75491314a2873b68c391b23bf50ac28780e7bb3612cef4d5470`, `map-click-no-candidates-verify.test.ts` → `e037f5f4a62f9b54e795a7b4edf95f08b66dcdddb039e5d36e813dd7fc961ccb`, `farm-animal-loose-ends-verify.test.ts` → `acf5ab9b98a66892bac8d0a25cc9c8498bd7e4788a399c0dc7baa4f56dda6dd6`, `familiarity-drawn-apart-verify.test.ts` → `793b8f0f6cf625d1ce57abedff3156eeb715ec7f9a1132b6124497bc7c52af2e`. These are the sha256 of the four files after rows 1-3 and 8 are applied exactly as simulated. Recompute after applying, and refuse row 6 if any of rows 1-3 or 8 is refused. The other two entries do not change. | |
| 7 | `climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091 tester; re-pinned by T-087 row 11a. It protects every non-test file outside the allowed set. | T-039 edits `openapi.yaml` (criteria 1-12) and adds its brief and run log, the loop's own records. CI on `f414d7a` shows the test red (297 expected, 299 received). | modify | Same name. `CRITERION_22_ALLOWED` gains `openapi.yaml`, `tasks/T-039-empty-content-endpoints.md` and `runs/T-039-empty-content-endpoints.md`, under a comment naming this row. This follows the T-087 row 11 precedent. `MAIN_UNTOUCHABLE_COUNT` 297 → **296**, because main counted `openapi.yaml`. `MAIN_UNTOUCHABLE_SHA` changes from `b6b89907…c739` to `c7a674c1a9f9abd2a36631b661cbc3babaf8684bc3c2b53c7765f04d5b2bb9c5`, with a comment. It still asserts the count and the `fileRowsSha` over every remaining file. The reviewer's sweep deletes the brief and edits `tasks.md`/`PROGRESS.md`, all of which are allowed, so the re-pin survives the sweep. | |
| 8 | `farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21: the bank and the boundaries" › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | T-096 tester; re-pinned by T-087 row 10a. Same protection as row 7. | Same as row 7. CI on `f414d7a` shows the test red (293 expected, 295 received). | modify | Same name. `CRITERION_21_ALLOWED` gains the same three paths under a comment naming this row. The count changes from 293 to **292**, with a comment `// T-039 row 8: was 293 (T-087 row 10a: was 297)`. `MAIN_UNTOUCHABLE_SHA` changes from `ceaf01f5…e62a` to `524637788cc480495650b8a25fd3ceaf5c9e09f2c2fc30802820111d95a418ca`, with a comment. It still asserts the count and the `fileRowsSha`. | |

Rows 5, 7 and 8 change file counts inside digest pins. None of them is a T-066-style test-count floor. If only some rows are approved, the suite stays red and the verdict is `blocked`.

To approve: start the `tester` step for T-039 in a session you are attending and answer row by row there. Writing the Decision column here first is fine, but the tester will still ask you to confirm it in its session.

## Notes

- First expander run halted on Q1–Q4 (commit `1e607ae`). This run writes the criteria from Dkaattae's answers. The queue entry's estimate was M. With every answer being "document", it is S.
- Criterion 1 fixes one exact phrase on purpose. Without one, "documented as intentionally unimplemented" can only be checked by a person reading prose. With it, a test can walk every operation (criterion 2 is the negative half).

- Worker: kept the old explanatory text of each operation under "Once served" rather than deleting it — it still describes the intended shape, and the schemas stay. Decision mine; reviewer to confirm or trim.
- Worker: `getElevationProfile` had no `description`, so criterion 1 meant adding one rather than editing one.
- Worker: the brief's "Test changes: none" missed three question-bank tests that hash `openapi.yaml`. Any future brief that edits `openapi.yaml` hits the same pins; the expander's survey should grep `question-bank/src/*verify*.test.ts` for `openapi.yaml`.

## Answers — Dkaattae, 2026-11-02

Given in the orchestrator's session, recorded verbatim by the orchestrator:

> Q1 reserved, Q2 unimplemented, Q3 unimplemented — keep it one task
