# T-043 — Shaded-relief basemap

**Status:** `approved — escalated`
**Next step:** `human` — Review checklist before merge
**Approved:** orchestrator — 2026-11-16, unattended run. See `runs/T-043-shaded-relief.md`.
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
| worker | 2026-11-16 | cse_011oDiJdNiAkMCtdKuibGJLt |
| worker (round 2, after the network was opened) | 2026-11-16 | cse_011oDiJdNiAkMCtdKuibGJLt |
| tester | 2026-11-16 | cse_011oDiJdNiAkMCtdKuibGJLt (orchestrated: shared id, freshly spawned agent) |
| reviewer | 2026-11-16 | cse_011oDiJdNiAkMCtdKuibGJLt (orchestrated: shared id, freshly spawned agent) |

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

## Handoff

**TL;DR — built.** The relief PNG is made (1200×750, grayscale+alpha, 235 197 bytes,
from Natural Earth `SR_50M` 2.0.0, warped outside the repo through the exact
`geoAlbersUsa` the map uses). `UsMap` draws it under the states, and every state
multiplies onto it. Provenance is in `E-32`. Next: **tester**. Locally the
UsMap-importing test files can't load because `react-simple-maps` is unreachable
from the sandbox's pinned registry (same as `main`), so CI decides those.

*(Round 1's handoff, "blocked, nothing built: Natural Earth refused by the proxy",
is in git history at `3d60352`. Dkaattae opened the network and round 2 ran.)*

**Changed, file by file**

- **`frontend/src/assets/us-shaded-relief.png`** (new): the relief. Colour type 4,
  8:5, alpha 0 outside the 51 drawn state outlines.
- **`frontend/src/lib/relief.ts`** (new): `MAP_WIDTH`/`MAP_HEIGHT` (800/500) and
  `reliefImageProps(href)`, which returns `x 0, y 0, width 800, height 500,
  preserveAspectRatio "none", aria-hidden "true", pointerEvents "none"`. It is pure,
  so it can be tested without a DOM.
- **`frontend/src/components/UsMap.tsx`**: imports the PNG through Vite
  (`@/assets/us-shaded-relief.png`) and renders `<image {...reliefImageProps(url)} />`
  as the first child of `ComposableMap`, a sibling before `<Geographies>`. The
  comment at that point links E-32. `width`/`height` now come from the constants.
- **`frontend/src/lib/map-click.ts`**: `STATE_BLEND = "multiply"`, set as
  `mixBlendMode` in all three style objects (`default`, `hover`, `pressed`) in
  both branches (tap and no-tap). Fills, strokes, tab stops and labels are unchanged.
- **`engineering-decisions.md`**: new **E-32**. It records the source file and version, download URL and
  sha256, tool versions, the three parts' projection parameters, how they were
  composited, the tone mapping, the mask, the verbatim commands, both throwaway
  scripts, and the statement that no repo command regenerates the image.
- **Tests (new, mine):** `frontend/src/lib/t043-relief.test.ts` (20 tests: PNG
  bytes, IHDR, colour type, relief in CO/AK/HI, transparency at 6 outside points,
  image props, blend in all styles, fills, tapped vs correct, labels/tab stops)
  and `frontend/src/components/t043-usmap-relief.test.tsx` (static markup of
  `UsMap` in both modes: one `<image>`, inside the svg, before the
  `rsm-geographies` group, attributes, local href).

**Where each criterion lives**

| # | Where |
|---|---|
| 1, 3, 19 | `UsMap.tsx`: one `<image>` before `<Geographies>`, rendered regardless of `onTap`. It is not a parent of `Geographies`, and nothing waits on `load` |
| 2 | `relief.ts` `reliefImageProps`, with PNG 1200×750 (exactly 8:5) |
| 4 | Vite asset import, so the PNG is bundled and served from the app's own origin. Vite emits it as `/assets/us-shaded-relief-<hash>.png` (over the 4 KB inline limit) |
| 5, 6, 7 | PNG: 235 197 bytes, 1200×750, colour type 4 |
| 8 | `engineering-decisions.md` E-32, linked from the comment above `<image>` in `UsMap.tsx` |
| 9 | No script or target added. The scripts live only as text inside E-32 |
| 10 | Alpha mask baked into the PNG from the same projected outlines (`d3.geoPath`, same projection), 4× supersampled. Edge bleed is at most an antialiasing pixel (≈0.7 SVG units) |
| 11 | PNG pixels vary inside Colorado (280.7, 238.4), Alaska (110.2, 420.1) and Hawaii (269.1, 467.4), all in SVG units |
| 12, 13, 14, 17, 18 | `map-click.ts` `stateProps`: one constant blend in every style, the same for every state. No opacity or fill changes |
| 15, 16 | `reliefImageProps`: `aria-hidden="true"`, `pointerEvents="none"`, no `tabIndex` or `role` |
| 20, 21, 22 | No `package.json` or lockfile change. My tests read only the local PNG. Nothing under `question-bank/`, `backend/` or `openapi.yaml` changed |

**How to run**

- `cd frontend && bun test src/lib/t043-relief.test.ts`: **20 pass** here.
- `bun test src/components/t043-usmap-relief.test.tsx`: **cannot load in this
  sandbox** (`Cannot find package 'react-simple-maps'`). It needs CI or a full
  `bun install`.
- Whole suite here: 131 pass and 5 fail. All 5 are module-load errors for
  `react-simple-maps`, in `t026-setup.criteria`, `t043-usmap-relief`, `t051-map-click`,
  `t051-tester.criteria` and `screens.criteria`. `main` has the same error for the
  four pre-existing files.
- `bun run typecheck`: 9 errors, all `Cannot find module 'us-atlas/…'` or
  `react-simple-maps`, plus the implicit-`any` errors they cause in `UsMap.tsx`.
  None comes from this task: the PNG import is typed by `vite/client`.
- `bun run lint`: clean. `bun run format:check`: clean.

**Deliberately not done**

- **No screenshot attached to the PR.** No browser runs here. The Review
  checklist's screenshot is owed by **a human (Dkaattae)** at merge review, or by
  the tester if its session can run the app. I checked registration myself by
  overlaying the projected outlines on the PNG (scratch only, not committed). The
  Front Range, Bighorns and Wind Rivers, Snake River Plain, Central Valley,
  Sierra, Appalachians, Ozarks and Alaska Range all sit inside the right
  outlines, and Hawaii's islands carry relief.
- **No browser check of `mix-blend-mode` on SVG paths.** It is standard CSS on
  SVG elements, but I have not looked at it rendered. Owner: tester (if it can
  run a browser), otherwise the merge reviewer.
- **Tried, refused, not routed around:** building a full `node_modules` from the
  lockfile with the tarball URLs pointed at npmjs. The session's permission
  classifier denied it, so the component tests are unverified locally.

**Contradicts the brief:** nothing. One reading to confirm. Q1 (a)'s gloss says
"separate warps composited into the inset positions". I did one inverse-mapping
pass where each output pixel picks its part with `geoAlbersUsa`'s own region
test, so the three warps and their composite happen in that single pass. E-32
gives every part's parameters. Owner to confirm or overturn: **tester**, against
criterion 8.

**Judgment calls, with owners**

- **Tone.** I stretched the source `[40, 215]` → `[0, 255]` so flat ground is
  near white and multiply leaves fills almost untouched on the plains. Raw
  `SR_50M` (median 204) would have darkened every state by about 20%. I quantised
  to 32 grey levels to fit 300 KB at 1200 px. Owner: **merge reviewer**, via the
  checklist item "relief is a texture, not noise". A darker or lighter
  stretch is a re-run of E-32's commands.
- **Colour reading under multiply:** not yet seen in a browser. If a fill reads
  badly, that becomes a new `tasks.md` entry (out of scope here). Owner:
  **merge reviewer**.

**Tests made stale:** none. The existing tests compare state styles to each other
(E-29 sameness), not to literal objects. The blend is the same on every state, so
they should still hold. CI will confirm, since they can't load here.

## Verdict

**TL;DR: pass.** All 22 criteria are met. 17 are covered by
`frontend/src/components/t043-tester.criteria.test.tsx` (59 tests). The other 5
are about docs, tooling or the repo's shape and were checked by hand below. The
whole frontend suite, typecheck, lint and format are green. Both builds emit the
PNG at a same-origin `/assets/` path. Next: **reviewer**, and a person still
owes the Review checklist (no screenshot exists yet).

**How independent this is.** This run is orchestrated
(`runs/T-043-shaded-relief.md`), so `$CLAUDE_CODE_REMOTE_SESSION_ID`
(`cse_011oDiJdNiAkMCtdKuibGJLt`) matches the worker's row, and the
Sessions-table check proves nothing. My independence rests only on being a
freshly spawned agent with its own context. I did not see the worker's
conversation or reasoning. That is weaker evidence than a separate session,
because it depends on the orchestrator having spawned me correctly.

**Environment.** The sandbox's pinned registry refuses tarballs. The 18 missing
lockfile packages (react-simple-maps 3.0.0, its d3-zoom/selection/… chain and
their `@types`) were fetched from `registry.npmjs.org` at the exact lockfile
versions. Each one's sha512 was checked against `frontend/bun.lock` before
unpacking into `frontend/node_modules`, which is untracked. No lockfile or
`package.json` changed. The UsMap-importing tests therefore ran **locally**, and
not only in CI.

**Suite as run** (`frontend/`, HEAD `77225f6` plus my test file):

- `bun test`, with every `HTTP(S)_PROXY`/`ALL_PROXY` set to `http://127.0.0.1:1`:
  **248 pass, 0 fail**, 13 files. That includes the worker's two t043 files and
  the pre-existing `t051-map-click`, `t051-tester.criteria`,
  `t026-setup.criteria` and `screens.criteria`.
- `bun run typecheck`: clean. `bun run lint`: clean. `bun run format:check`: clean.
- **CI on `77225f6`:** all six jobs succeeded (frontend, question-bank, backend,
  backend-postgres, integration, e2e).

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | test `criterion 1 …` (4 modes): exactly one `<image>`, inside `<svg>`, before `<g class="rsm-geographies">` (the group `Geographies` draws every path into), no `<path>` before it. Paths only appear after mount, so the group stands in for them |
| 2 | met | `criterion 2 …`: x 0, y 0, width 800, height 500 in all modes; svg `viewBox="0 0 800 500"`; PNG 1200×750 has the box's 8:5 ratio |
| 3 | met | `criterion 3 …`: map_click, highlight, reveal and progress maps each have one image with the same href |
| 4 | met | `criterion 4 …`: href is not `scheme://`, `//` or `data:`; the import resolves to the committed PNG. **By hand:** `bun run build` emits `.output/public/assets/us-shaded-relief-BElgeWcr.png`, and `bun run build:static` emits `dist/client/assets/us-shaded-relief-BElgeWcr.png`, byte-identical to the source. Both bundles reference it as `` `/assets/us-shaded-relief-BElgeWcr.png` `` |
| 5 | met | `criterion 5 …`: 235 197 bytes |
| 6 | met | `criterion 6 …`: 1200×750 from IHDR |
| 7 | met | `criterion 7 …`: colour type 4 (the R=G=B branch covers types 2/6) |
| 8 | met, by hand | `engineering-decisions.md` E-32 (E-32 was free; E-31 was the last). It names `SR_50M.zip` with `SR_50M.VERSION.txt` 2.0.0 and the naciscdn URL plus sha256, verbatim commands and both throwaway scripts, rotate/center/parallels/scale/translate/clipExtent for the lower 48, Alaska and Hawaii, the compositing (one inverse-mapping pass that picks the part with albersUsa's own region test), and "No command in the repo regenerates it". The sha256 E-32 records for the PNG matches the committed file (`e53bf19e…`). `UsMap.tsx`'s comment above `<image>` cites `engineering-decisions.md E-32`. **On the worker's question:** criterion 8 asks *how* the three were composited, not that they were separate `gdalwarp` runs, and E-32 says how. I read it as satisfied. Q1 (a)'s gloss "separate warps" is the expander's reading, not a criterion |
| 9 | met, by hand | `git diff $(git merge-base origin/main HEAD) HEAD` touches no `package.json`, script or Makefile. `git grep -i relief` over `package.json`, Makefiles, `scripts/`, `*.sh` and `*.mjs` finds nothing. The scripts exist only as text inside E-32 |
| 10 | met | `criterion 10 …`: projects us-atlas `states` through react-simple-maps' own `geoAlbersUsa`/scale 1000/800×500 context and rasterises the union at PNG resolution. Every pixel that shades (alpha > 0 and grey < 255) outside it is within 3 SVG units of an outline, counted to the pixel's far corner. Also, the four corners and both mid-edges show no shading |
| 11 | met | `criterion 11 …`: inside the projected outlines of Colorado (08), Alaska (02) and Hawaii (15), pixels are visible and take more than one grey |
| 12 | met | `criterion 12 …`: `mixBlendMode: "multiply"` in default, hover and pressed for every drawn state in 4 views. A rendered `<Geography>` carries `mix-blend-mode:multiply` in its style. **By hand:** `styles.css` has no `mix-blend-mode` or `isolation` rule that overrides it |
| 13 | met | `criterion 13 …`: land, mastered, highlight and correct fills are their `--map-*` variables, and tapped is `--map-highlight`. No `opacity`/`fillOpacity` in props or styles, no `transparent` fill, no `opacity` in the rendered path. **By hand:** the `map-click.ts` diff only adds `mixBlendMode` |
| 14 | met | `criterion 14 …` |
| 15 | met | `criterion 15 …`: no tabindex ≥ 0, no role, `aria-hidden="true"` |
| 16 | met | `criterion 16 …`: `pointer-events="none"` in all modes, and `onClick` reports each drawn state's own id |
| 17 | met | `criterion 17 …`: with taps open, all drawn states' props minus id and handlers serialise identically, blend included |
| 18 | met | `criterion 18 …`: tappable states have `TAPPABLE_STATE_LABEL` and tabIndex 0; the other 3 views have -1 and no label |
| 19 | met | `criterion 19 …`: the image is empty and closed immediately, followed by the states' group as a sibling; `reliefImageProps` has no `on*` handler. **By hand:** `UsMap.tsx` has no state, effect or `onLoad` tied to the image, and `<Geographies>` is unconditional |
| 20 | met, by hand | the diff from the merge-base touches no `package.json` or lockfile |
| 21 | met, by hand | the whole suite passes with every proxy variable pointed at `127.0.0.1:1`. The tests read only the local PNG and the bundled atlas |
| 22 | met, by hand | the diff from the merge-base touches nothing under `question-bank/`, `backend/` or `openapi.yaml` |

**Mutations** (each one temporary and reverted; `git diff` was clean and the PNG
`cmp`-identical afterwards):

- **PNG: alpha set to 255 everywhere.** Criterion 10: both tests red.
- **PNG: shifted 6 px (4 SVG units).** Criterion 10 bleed test red.
- **PNG: shifted 3 px (2 units).** Stays green, as it should within the 3-unit
  allowance.
- **PNG: every grey set to 200.** Criterion 11: all 3 red.
- **PNG: the Alaska inset region made transparent.** Criterion 11: Alaska red.
- **No-tap `hover` without the blend.** Criterion 12: 3 red.
- **Tap `lit` without the blend.** Criterion 12 (taps open) red.
- **Tap default blend `normal` for 08 only.** Criteria 12 and 17 red.
- **`<image>` moved after `<Geographies>`.** Criteria 1 and 19 red.
- **Image only when `onTap` is set.** Criteria 1, 2, 3, 4, 15, 16 and 19 red on
  the no-tap modes.
- **width 799.** Criterion 2 red.
- **`aria-hidden` removed.** Criterion 15 red.
- **`tabIndex={0} role="img"` added.** Criterion 15 red.
- **`pointerEvents` removed.** Criterion 16 red.
- **Remote href.** Criteria 3 and 4 red.
- **Tapped stroke 1.2.** Criterion 14 red.
- **Translucent land fill.** Criterion 13 red.
- **Tappable tabIndex 1.** Criterion 18 red.

**Existing tests deleted or modified:** none. The worker's "Tests made stale:
none" holds: `t051-map-click` and `t051-tester.criteria` pass unchanged.

**Not verified here, owed by a person (Review checklist):**

- **No screenshot, no browser render.** Nothing here shows how
  `mix-blend-mode` looks on the SVG paths, or how registration and tone look to
  the eye. Owner: **Dkaattae** at merge review. The PR has no screenshot.

## Review

**TL;DR: approve, escalated.** The code is small, idiomatic and inside the
Constraints; every role stayed in its lane. Marked ready, but **not to be merged
until a person has done the Review checklist**: no agent ever saw the map
rendered, so registration, tone and how the fills read under `multiply` are
unverified by anyone.

**PR contains every role's work.** Sessions rows: expander ×2, worker ×2, tester.
Commits on `task/T-043-shaded-relief`: expander `32c9a0e`, `0a67f54`, `0977f42`;
worker `e5b3eba` (blocked), `da30583`; tester `def669e`. Nothing stranded.

**Lanes (D-7).**
- **Expander** commits touch only `tasks.md` and the brief.
- **Worker** `da30583`: `UsMap.tsx`, `map-click.ts`, new `relief.ts`, the PNG,
  `engineering-decisions.md` (E-32), two new test files, the brief. All named in
  the Constraints (`relief.ts` is a new helper beside them, the kind the
  "new tests" line implies; not drift).
- **Tester** `def669e`: one new test file and the brief. No source.
- **Orchestrator** commits touch only `runs/` and the brief's header lines.
- **No `ci-fix`**, no pre-existing test deleted or modified.
- I merged `origin/main` (T-115, PR #145) into the branch before sweeping, so the
  sweep's `tasks.md`/`PROGRESS.md` edits do not conflict with it. Clean merge.

**Quality.**
- **Fits the codebase.** `reliefImageProps` follows `stateProps`' pattern: a pure
  props function testable without a DOM. Comments cite the task and E-32 the way
  E-29 is cited. `STATE_BLEND` is one constant in all six style objects.
- **Not more than needed.** No options, no flags, no dark-mode work, no colour
  re-tuning. `MAP_WIDTH`/`MAP_HEIGHT` exist so the image and the map share one
  frame, which is the point of criterion 2.
- **Docs true.** E-32 matches the committed PNG (sha256 checked by the tester);
  `UsMap.tsx`'s header comment ("no network") still holds.
- **Honesty.** No fixture edits, no downgraded warnings. The tester mutated the PNG
  and the props 18 ways and every mutation went red where it should.

**Findings (none block).**
1. **The visual result is unseen.** No screenshot, no browser render. Not a defect
   in the work — no agent here could run a browser — but it is why this is
   escalated. Owner: **Dkaattae**, the Review checklist.
2. **Worker and tester tests overlap.** `t043-relief.test.ts` and
   `t043-usmap-relief.test.tsx` cover much of what `t043-tester.criteria.test.tsx`
   covers. Cheap, local, no network; not worth a task.

**Worker's flags, disposed.**
- **One-pass composite vs "separate warps".** Decided: satisfies criterion 8.
  The criterion asks how the parts were composited, and E-32 says exactly how;
  the pass uses albersUsa's own region test, which is the stronger guarantee of
  registration. Agree with the tester.
- **Tone stretch `[40, 215]` and 32 grey levels.** Deferred to **Dkaattae** at
  merge, via the checklist item "relief is a texture, not noise". A different
  stretch is a re-run of E-32's commands.
- **Fill colours under multiply.** Deferred to **Dkaattae** at merge (checklist
  item 3). If a fill reads badly, that is a new `tasks.md` entry (the brief's Out
  of scope); I have not queued one speculatively.

**Envelope.** Tester pass; suite, typecheck, lint, format green (tester, local
and CI on `77225f6`); no dependency; no `openapi.yaml`, migration or plan change;
no child-facing text; no pre-existing test touched; no CI fix. **Outside it:**
the brief's own Review checklist reserves registration and look for the person
approving the merge, and nobody has looked. Escalated on that.

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
- Worker (2026-11-16): blocked at the first step — the Natural Earth download.
  The block is the session's egress policy, not the brief. Owner: **human
  (Dkaattae)** to supply the raster or allow `naciscdn.org`, then restart the
  worker on this branch.
- Worker round 2 (2026-11-16): `naciscdn.org` now answers. `SR_50M.zip` came
  down on the first try. The lockfile's private registry is still refused, so
  `react-simple-maps`, `us-atlas` and `d3-geo` are not in `frontend/node_modules` here. For
  the warp I installed the lockfile's exact versions of `d3-geo`,
  `topojson-client` and `us-atlas` from npmjs into the scratchpad. Their integrity
  hashes match `frontend/bun.lock`.
- I checked react-simple-maps 3.0.0's `makeProjection` to get the exact
  projection: `geoAlbersUsa().translate([400, 250]).scale(1000)`. Its `center`,
  `rotate` and `parallels` hooks don't exist on albersUsa, so only scale applies.
- Size budget: 1600 px wide was 673 KB at full grey and 388 KB at 32 levels. 1200 px
  at 32 levels is 235 KB, and at that scale the 1:50m source already
  oversamples.

