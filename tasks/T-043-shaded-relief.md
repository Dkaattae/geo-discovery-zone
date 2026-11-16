# T-043 — Shaded-relief basemap

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-043
**Branch:** `task/T-043-shaded-relief`
**PR:** #147, opened draft at expand time
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-16 | cse_011oDiJdNiAkMCtdKuibGJLt |
| task-expander (round 2, after Q1–Q3) | 2026-11-16 | cse_011oDiJdNiAkMCtdKuibGJLt |

## Decisions (answered — no longer blocking)

> **Answered by Dkaattae, 2026-11-16, in the orchestrator's session (verbatim):** "Q1 (a), Q2 yes, Q3 multiply blend"
> Recorded by the orchestrator; not interpreted.

How the expander reads those answers (the questions themselves are in git
history, commit `32c9a0e`):

- **Q1 (a)** — the relief is reprojected **once, outside the repo**, with a tool
  that is not a repo dependency (e.g. GDAL's `gdalwarp`, or a throwaway script in
  the scratchpad), and the result is committed as a PNG with a provenance note.
  Because (c) "lower 48 only" was offered and **not** chosen, Alaska and Hawaii
  insets **carry relief** too (separate warps composited into the
  `geoAlbersUsa` inset positions). No repo command regenerates the image.
- **Q2 yes** — the derived PNG is committed, one file, **at most 300 KB**
  (the proposed default, accepted).
- **Q3 multiply** — state fills stay opaque colours; the state layer is composited
  onto the relief with a `multiply` blend, so terrain darkens every state's colour
  rather than the fills turning see-through.

**Feasibility warning for the worker.** Producing the PNG needs the Natural Earth
raster (download) and a reprojection tool. If `naturalearthdata.com` or its
mirror is refused by the session's proxy, or no reprojection tool can be run
outside the repo, do not substitute another source or a hand-drawn image: set
`Status: blocked`, `Next step: human`, and say in the Handoff what a person must
supply (the source file, or the finished PNG). Do not add a dependency to get
around it.

## Goal

Make every map question look like an atlas rather than a form, by showing the
terrain under the state outlines (`geoquizdataplan.md` §2.6 A, §4).

## Acceptance criteria

**Frozen once approved.**

*Layer and placement*

1. `UsMap` renders exactly one relief image element inside the map's SVG, and in
   document order it precedes every state `path` (so the paths paint over it).
2. The relief image element is placed at `x=0`, `y=0`, `width=800`, `height=500`
   in the map's SVG user space — the same 800×500 frame the state paths are
   projected into (`ComposableMap` width/height, `geoAlbersUsa`, scale 1000) —
   and is not stretched non-uniformly (the PNG's own aspect ratio is exactly
   8:5, see criterion 6).
3. The relief appears on both map modes `UsMap` serves: `map_click` questions
   (with `onTap`) and maps without `onTap` (highlight / reveal / progress).

*The image file*

4. The relief image is a single PNG file committed under `frontend/` and
   bundled or served by the frontend itself; rendering the map makes no request
   to any origin other than the app's own (no `http(s)://` URL to another host in
   the image reference).
5. The PNG is at most **300 000 bytes** (300 000 passes, 300 001 fails).
6. The PNG's pixel width and height (from its `IHDR` header) are in an exact 8:5
   ratio — `width * 5 === height * 8` — and width is at least 800 and at most
   2400.
7. The image is Natural Earth *Shaded Relief Basic* (grayscale) or derived from
   it — not a cross-blended hypsometric-tint variant (`geoquizdataplan.md` §2.6 A,
   caveat). The PNG is grayscale in content: either PNG colour type 0 or 4
   (grayscale / grayscale+alpha), or, if colour type 2 or 6, every pixel has
   R = G = B.
8. Provenance is written down in a new `E-32` entry in `engineering-decisions.md`
   (or the next free `E-n` if `E-32` is taken when the worker starts), naming:
   the Natural Earth file and its version, where it was downloaded from, the exact
   commands run (with every projection parameter for the lower-48, Alaska and
   Hawaii warps), how the three were composited, and a statement that no repo
   command regenerates the image. That entry is linked from a comment at the
   image's point of use in `UsMap.tsx`.
9. No script, `package.json` script, or Makefile target in the repo claims to
   regenerate the relief image.

*Registration and extent*

10. Relief is visible only within the US state outlines: outside the union of the
    drawn state shapes (ocean, Canada, Mexico, and the empty space around the
    Alaska and Hawaii insets) the map shows no terrain shading. Either mechanism
    satisfies this — transparency baked into the PNG, or a clip to the state
    geometry — provided a coastline or border edge shows relief bleeding no more
    than 3 SVG units past the outline.
11. Lower 48, Alaska and Hawaii all carry relief: the PNG is not blank (fully
    transparent or uniform) inside Colorado, inside the Alaska inset, or inside
    the Hawaii inset. (Registration quality itself is in the Review checklist.)

*Blend (Q3)*

12. Every state path is composited onto the relief with `multiply` blending —
    `mix-blend-mode: multiply`, applied either to each path or to a group that
    contains all of them — in every interaction state react-simple-maps renders
    (`default`, `hover`, `pressed`). No state path is drawn with `normal`
    blending over the relief.
13. State fills stay opaque: no state's `fill` colour, `fill-opacity` or
    `opacity` is made translucent by this task. The fill colours `stateProps`
    returns for land, mastered, highlight, correct and tapped are unchanged
    (`--map-land`, `--map-mastered`, `--map-highlight`, `--map-correct`).
14. The tapped state keeps its distinctions from the correct state: `stroke`
    `var(--foreground)`, `strokeWidth` 1.6 and `strokeDasharray` `"3 2"`, while
    the correct state keeps `var(--map-stroke)`, 0.6 and no dash.

*`map_click` and accessibility*

15. The relief image is not focusable and not announced: no `tabIndex` ≥ 0, no
    `role`, and it carries `aria-hidden="true"` or empty alt text.
16. The relief image takes no pointer events (`pointer-events: none` or the
    `pointerEvents="none"` attribute): a tap anywhere on a state still reports
    that state's geometry id.
17. While taps are open on a `map_click` question, every state's props from
    `stateProps` are identical except `data-geometry-id` and the handlers'
    bound id — the E-29 invariant holds with the blend in place (the blend is not
    a per-state attribute).
18. The accessible name every tappable state carries is still
    `TAPPABLE_STATE_LABEL`, and the tab order of states is unchanged (states keep
    `tabIndex` 0 when tappable, -1 otherwise).

*First paint*

19. The state paths do not wait on the image: the image is not a condition of,
    or a parent of, the `Geographies` render, and nothing awaits its `load`
    event before drawing states.

*Negative*

20. No dependency is added to, and no version changed in, any `package.json`
    or lockfile.
21. No test reaches the network.
22. No file under `question-bank/`, `backend/`, or `openapi.yaml` changes.

## Out of scope

- Physical feature layers (rivers, lakes, peaks — §2.4) and elevation profiles
  (§2.6 B).
- Any change to which questions exist, their topics, or the bank
  (`question-bank/data/`, `backend/app/data/content.json`).
- `/geometry/{layer}` and `openapi.yaml`: the relief is a frontend asset, not an
  API resource.
- The world map, countries, or any other region.
- Changing the projection away from `geoAlbersUsa`, or its scale / viewport.
- Re-tuning the map colour variables to compensate for the darker multiply look.
  If a colour reads badly, say so in the Handoff; it becomes a new `tasks.md`
  entry.
- A reproducible in-repo pipeline for the raster (that was Q1 (b), not chosen).
- Dark-mode treatment of the relief beyond what multiply gives for free.
- T-048's hydration warning, even if the image touches the prerendered shell.

## Constraints

- Files expected to change: `frontend/src/components/UsMap.tsx`; possibly
  `frontend/src/lib/map-click.ts` (if the blend lives in `stateProps`' styles) and
  `frontend/src/styles.css`; one new PNG under `frontend/` (e.g.
  `frontend/src/assets/` or `frontend/public/`); `engineering-decisions.md` (the
  new `E-n`); new tests.
- The reprojection runs **outside the repo**: no GDAL wrapper, no script, no
  downloaded source raster committed. Only the final PNG is committed.
- No network at runtime: geometry and imagery are bundled (`UsMap.tsx` header
  comment).
- Dependencies: none (`CLAUDE.md` "Packages"). Tests that read the PNG header or
  pixels use what the runtime already provides (e.g. `node:fs`, `node:zlib`
  under bun), not a new image library.
- Tests: pure functions first; the frontend has no DOM test library
  (`frontend/src/lib/map-click.ts` header) — do not add one. Existing
  `frontend/src/components/t051-map-click.test.tsx` must still pass.
- Must work in both builds: `frontend/vite.config.ts` and
  `frontend/vite.static.config.ts`.
- Licence: Natural Earth is public domain (`geoquizdataplan.md` §5 table); no
  attribution required, but record the source (criterion 8).

## Context

- Plan: `geoquizdataplan.md` §2.6 A (variants and the cross-blend caveat), §4
  ("worth adding early"), §5 maps table and the `geoAlbersUsa` projection note.
- Map: `frontend/src/components/UsMap.tsx` (projection `geoAlbersUsa`, scale
  1000, 800×500 viewport), `frontend/src/lib/map-click.ts` (`stateProps`, the
  E-29 sameness invariant, `TAPPABLE_STATE_LABEL`), `frontend/src/styles.css`
  lines ~145–149 (map colour variables).
- Existing map tests: `frontend/src/components/t051-map-click.test.tsx`.
- `engineering-decisions.md` E-29 (`map_click`: nothing but geometry id
  differs); its last entry is E-31, so the new one is E-32 unless taken.
- `geoAlbersUsa`'s composite parameters (lower 48 / Alaska / Hawaii) are in
  d3-geo's `albersUsa` source, already in `frontend/node_modules` via
  react-simple-maps — read it for the warp parameters; do not add it as a
  dependency.
- Precedent for an unreachable data source: `tasks.md` T-085b.

## Review checklist — for the human approving the merge

Registration and look cannot be pinned by a test without an image library.
The worker attaches a screenshot of the map (quiz and progress views) to the PR;
a person checks:

- [ ] The Rocky Mountain front range falls inside Colorado and Wyoming, the
      Sierra Nevada inside California, the Appalachians run through
      West Virginia / Pennsylvania — not offset into neighbours.
- [ ] Alaska's inset shows the Alaska Range / Brooks Range inside its outline;
      Hawaii's islands show relief on the island outlines.
- [ ] Highlighted, correct, tapped (dashed) and mastered states are still easy
      to tell apart from plain land with the relief under them.
- [ ] The map still reads as a children's map — relief is a texture, not noise.

## Notes

- Picked T-043 because every task above it is waiting on a person: T-085b (a
  Census source), T-056 (a design decision), T-095 (Q for a person), T-110 (a
  wording call); T-115 is in flight (PR #145).
- Nothing of this task already exists: no image, no relief layer, no Natural
  Earth file anywhere in the repo.
- Round 2 (after Q1–Q3): the earlier draft's criterion "registers in the lower
  48" became criteria 2, 6, 10, 11 (testable shape) plus the Review checklist
  (registration a person judges). Criterion 10 (no relief outside the US) is new:
  with insets moved by `geoAlbersUsa`, unclipped relief would put Mexican or
  Pacific terrain around the Alaska inset.
