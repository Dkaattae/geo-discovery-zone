# T-043 — Shaded-relief basemap

**Status:** `blocked`
**Next step:** `human` — answer Q1–Q3 under "Blocked: decisions needed" below, then re-run `task-expander` to finish the criteria
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-043
**Branch:** `task/T-043-shaded-relief`
**PR:** #147, opened draft at expand time
**Fault:** the queue entry assumes the relief raster drops straight under the state paths, but the map's projection (`geoAlbersUsa`) does not register with a Natural Earth raster, and every way of making it register needs a dependency or a committed generated binary — both a person's call.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-16 | cse_011oDiJdNiAkMCtdKuibGJLt |

## Blocked: decisions needed

> **Answered by Dkaattae, 2026-11-16, in the orchestrator's session (verbatim):** "Q1 (a), Q2 yes, Q3 multiply blend"
> Recorded by the orchestrator; not interpreted.

**TL;DR:** the plan's "one image tag" (`geoquizdataplan.md` §2.6 A, §4) does not
hold for this map. Natural Earth relief rasters are plate carrée (lon/lat grid);
`UsMap.tsx` draws with `geoAlbersUsa`, a conic projection with Alaska and Hawaii
moved and rescaled into insets. An unprojected image under those paths will not
line up anywhere. Making it line up means reprojecting the raster, and that needs
either a new dependency or a generated binary committed to the repo. Both are
reserved for a person (`CLAUDE.md` "Packages"; the expander's own rules name
"whether to commit generated output" as a product call).

**Q1 — How does the raster get into `geoAlbersUsa`?** Pick one:

- **(a) Reprojected once, by hand, outside the repo.** Someone (or a worker
  session with GDAL available) runs e.g. `gdalwarp` on Natural Earth *Shaded
  Relief Basic*, and the result is committed as a PNG with a provenance note
  (source file and version, the exact command, the projection parameters). No
  new dependency, but the image cannot be rebuilt by any repo command. Alaska and
  Hawaii insets need separate warps composited into place, or are left without
  relief.
- **(b) Reprojected by a script in the repo.** Needs a raster decoder/encoder
  dependency (for example `geotiff` and/or `pngjs` in `question-bank/` or a
  frontend build script). Reproducible; is a new dependency to approve.
- **(c) Lower 48 only.** Either (a) or (b), but Alaska and Hawaii get no relief.
  Simpler; leaves two insets looking different from the rest.
- **(d) Drop or defer the task.** The plan calls it "nearly free"; on this
  projection it is not.

**Q2 — Commit the derived image?** Under (a) and (b) the PNG is generated output.
Committing it (as `us-atlas` geometry effectively is, bundled at build time) keeps
"the app never makes a network request" (`UsMap.tsx`). Confirm, and confirm a
size budget. **Proposed default:** committed, one file, at most 300 KB.

**Q3 — Do state fills become see-through?** Every state is filled opaquely today
(`stateProps` in `frontend/src/lib/map-click.ts`, colours `--map-land`,
`--map-mastered`, `--map-highlight`, `--map-correct` in `frontend/src/styles.css`).
A raster *under* them is invisible. Options: semi-transparent fills, or a
`multiply` blend on the state layer. Either changes how every map colour reads,
including the highlighted, correct, tapped and mastered states a child relies on.
**Proposed default:** relief shows through `--map-land` and `--map-mastered`
states; highlight, correct and tapped stay as distinguishable as they are today.

**Also unknown:** whether `naturalearthdata.com` (or its download mirror) is
reachable from a web session's proxy. T-085b found `*.census.gov` refused; if
Natural Earth is refused too, (a) needs a person to supply the file.

Once Q1–Q3 are answered, the expander finishes the criteria below and sets
`Status: awaiting approval`.

## Goal

Make every map question look like an atlas rather than a form, by showing the
terrain under the state outlines (`geoquizdataplan.md` §2.6 A, §4).

## Acceptance criteria

**Draft — not yet approvable.** Criteria 1–7 hold whichever answer Q1–Q3 get.
The ones marked *[after Q]* are placeholders until the answer is in.

1. `UsMap` renders a relief image layer beneath the state paths: in the rendered
   SVG the image element precedes every state `path` (so the paths paint over it).
2. The relief image is a file bundled with the frontend build; rendering the map
   makes no request to any origin other than the app's own.
3. The relief image is Natural Earth *Shaded Relief Basic* (grayscale) or derived
   from it, and not a cross-blended hypsometric-tint variant
   (`geoquizdataplan.md` §2.6 A, caveat). Its source file, version and how it was
   derived are written down in the repo next to it or in a new `E-n` in
   `engineering-decisions.md`.
4. The image layer is not focusable and not announced: it has no `tabIndex` ≥ 0,
   no `role`, and is `aria-hidden` or has empty alt text. The tab order and
   accessible names of states on a `map_click` question are unchanged.
5. On a `map_click` question the image layer takes no pointer events: a tap on any
   state still reports that state's geometry id, exactly as before.
6. While taps are open on a `map_click` question, no state's markup, styling or
   hover differs from any other's except by geometry id (the E-29 invariant
   `stateProps` documents) — the relief does not become a per-state attribute.
7. The highlighted, correct and tapped states remain distinguishable from an
   unmarked state with the relief present (the existing colour and, for tapped,
   dashed-outline distinctions all still apply).
8. *[after Q2]* The relief image file is at most **300 KB** (proposed; 300 000
   bytes passes, 300 001 fails).
9. *[after Q2]* The state paths do not wait on the image: the map's paths render
   whether or not the image has loaded (e.g. the image is not a prerequisite of
   the `Geographies` render).
10. *[after Q1]* The relief registers with the state outlines in the lower 48 —
    the criterion and its tolerance depend on how the image is produced (a fixed
    landmark such as the Rockies' front range falling inside Colorado's path, or a
    stated pixel tolerance). Whether Alaska and Hawaii insets carry relief is
    Q1 (c).
11. *[after Q1]* If (b): the image is reproducible by one documented command, and
    re-running it on the same source produces a byte-identical file. If (a): the
    exact command and parameters are recorded (criterion 3) and no repo command
    claims to regenerate it.
12. *[after Q3]* How states let the relief show through, per the answer.
13. No dependency is added to any `package.json` (or, under Q1 (b), exactly the
    approved one, with its lockfile committed).
14. No test reaches the network.

## Out of scope

- Physical feature layers (rivers, lakes, peaks — §2.4) and elevation profiles
  (§2.6 B).
- Any change to which questions exist, their topics, or the bank
  (`question-bank/data/`, `backend/app/data/content.json`).
- `/geometry/{layer}` and `openapi.yaml`: the relief is a frontend asset, not an
  API resource.
- The world map, countries, or any other region.
- Changing the projection away from `geoAlbersUsa`.
- T-048's hydration warning, even if the image touches the prerendered shell.

## Constraints

- Files expected to change: `frontend/src/components/UsMap.tsx`, possibly
  `frontend/src/lib/map-click.ts` and `frontend/src/styles.css` (Q3), one new
  image asset under `frontend/`, and its provenance note.
- No network at runtime: geometry and imagery are bundled (`UsMap.tsx` header
  comment).
- Dependencies: none without the answer to Q1 (`CLAUDE.md` "Packages").
- Tests: pure functions first; the frontend has no DOM test library
  (`frontend/src/lib/map-click.ts` header) — do not add one.
- Licence: Natural Earth is public domain (`geoquizdataplan.md` §5 table); no
  attribution required, but record the source (criterion 3).

## Context

- Plan: `geoquizdataplan.md` §2.6 A (variants and the cross-blend caveat), §4
  ("worth adding early"), §5 maps table.
- Map: `frontend/src/components/UsMap.tsx` (projection `geoAlbersUsa`, scale
  1000, 800×500 viewport), `frontend/src/lib/map-click.ts` (`stateProps`, the
  E-29 sameness invariant), `frontend/src/styles.css` (map colour variables).
- `engineering-decisions.md` E-29 (`map_click`: nothing but geometry id differs).
- Precedent for an unreachable data source: `tasks.md` T-085b.

## Notes

- Picked T-043 because every task above it is waiting on a person: T-085b (a
  Census source), T-056 (a design decision), T-095 (Q for a person), T-110 (a
  wording call); T-115 is in flight (PR #145).
- Nothing of this task already exists: no image, no relief layer, no Natural
  Earth file anywhere in the repo.
