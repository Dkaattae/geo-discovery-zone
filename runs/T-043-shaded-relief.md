# T-043 — Shaded-relief basemap — run log

**Task:** T-043 · **Branch:** `task/T-043-shaded-relief` · **PR:** #147
**Started:** 2026-11-16 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-16
`Next step` on entry: `(none — no brief)` → on exit: `human`

**I picked T-043 (shaded-relief basemap) and stopped it as blocked; it needs a person.** The plan says the relief is "one image tag", but that does not work on this map. Natural Earth relief rasters use a plain longitude/latitude grid, while `frontend/src/components/UsMap.tsx` draws with `geoAlbersUsa`, which curves the map and moves Alaska and Hawaii into insets. An image laid under the states would not line up anywhere. Making it line up needs either a new dependency or a generated image committed to the repo, and both are a person's call.

- **Status:** `blocked`, Next step: `human`, Approved: `pending`
- **Branch:** `task/T-043-shaded-relief`, created from `origin/main`. The push landed: local HEAD and the remote branch are both `0a67f54`.
- **PR:** #147, draft, opened against that branch. Its body holds the questions and the draft criteria.
- **Brief:** tasks/T-043-shaded-relief.md
- **Commits:** only `tasks/T-043-shaded-relief.md` and `tasks.md`. The `tasks.md` change sets T-043 to `doing (blocked on a person)`.

**Why T-043:** every task above it is waiting on a person, T-115 is in flight, and only T-115 has an open PR (#145).

| Task | Why skipped |
|---|---|
| T-085b | Needs a person to choose a Census source |
| T-056 | Needs a design decision |
| T-095 | Has an open question for a person |
| T-110 | Needs a wording call from Dkaattae |
| T-115 | In flight (PR #145) |

**Questions the person must answer (written into the brief and the PR):**
- **Q1 – how the image gets lined up with the map:**
  - (a) Reproject it once by hand, for example with `gdalwarp`, and commit the PNG with a note of where it came from. No new dependency.
  - (b) Reproject it with a script in the repo. That needs a new dependency to read and write the image, for example `geotiff` or `pngjs`.
  - (c) Lower 48 states only, done by (a) or (b).
  - (d) Drop or defer the task.
- **Q2 – whether to commit the generated image, and how big it may be.** I proposed at most 300 KB.
- **Q3 – how the states let the relief show through.** Every state is filled with a solid colour today, so an image underneath would be hidden. The options are see-through fills or a `multiply` blend, and either changes how the highlighted, correct, tapped and mastered states look.
- **Not known:** whether naturalearthdata.com is reachable from a web session. T-085b found census.gov blocked.

**Draft criteria:** I wrote 14. Criteria 1–7 and 13–14 hold whatever the answers are: the image sits under the states, comes bundled with the app, is grayscale relief, is skipped by keyboard and screen reader, does not catch taps, keeps E-29's rule that no state's markup differs from another's except its id, and adds no dependency. Criteria 8–12 are placeholders until Q1–Q3 are answered. Once they are, the expander finishes the criteria and sets `awaiting approval`.

**For the next pick:** T-044 needs access to Lovable, which no agent has. T-048 (the hydration warning) is the next task that may be startable without a person.

## Halted — 2026-11-16
`Status: blocked`, `Next step: human`. Approved left `pending`; no stamp written (G2 — nothing to build against yet).
A person must answer Q1–Q3 in the brief / PR #147, then re-run the `task-expander`.

## Person answered — 2026-11-16
Dkaattae, in the orchestrator's session, verbatim: "Q1 (a), Q2 yes, Q3 multiply blend"
Recorded under `## Blocked: decisions needed` in the brief. Resuming with a fresh `task-expander`, as the brief's Next step asked.

## Round 2 — task-expander — 2026-11-16
`Next step` on entry: `human` → on exit: `worker`

The T-043 brief is finished and needs a person to approve it before the worker starts. Status is `awaiting approval`, Next step is `worker` and Approved is `pending`. I pushed to `task/T-043-shaded-relief` and confirmed the push landed: local and remote head are both `0977f42`. The body of draft PR #147 now lists the finished criteria.

**How I read Dkaattae's answers ("Q1 (a), Q2 yes, Q3 multiply blend"):**
- **Q1 (a):** the relief image is reprojected once, outside the repo, and only the final PNG is committed. Its provenance (source, version, exact commands) goes in a new `E-32` in `engineering-decisions.md`. I took the choice of (a) over (c), the "lower 48 only" option, to mean Alaska and Hawaii also get relief. That is my reading, not something the answer says outright; it is written in the brief.
- **Q2 yes:** the PNG is committed and must be at most 300 000 bytes.
- **Q3 multiply:** state colours stay solid, and the state layer is drawn over the relief with `mix-blend-mode: multiply` in default, hover and pressed.

**The 22 criteria cover:**
- **Placement:** one image, drawn under every state, in the same 800×500 frame as the states.
- **The file:** same-origin only, the size cap, an exact 8:5 shape, grayscale, and provenance recorded.
- **Edges:** no relief outside the state outlines, at most 3 SVG units of bleed. This one is new: because Alaska and Hawaii are moved into insets, unclipped relief would put the wrong terrain around them.
- **Coverage:** relief is present inside Colorado and inside the Alaska and Hawaii insets.
- **Blend:** multiply on every state, and the existing state colours and tapped-state outline unchanged.
- **Tap maps:** the image can't be focused, isn't read out and takes no taps. Every state still looks the same until a tap (the E-29 rule).
- **First paint:** states draw without waiting for the image.
- **Negatives:** no new dependency, no network in tests, nothing changed in `question-bank/`, `backend/` or `openapi.yaml`.

How well the relief lines up with the state outlines can't be tested without an image library, so it is a review checklist. A person checks it against the worker's screenshot.

**Risk for the worker:** making the PNG needs the Natural Earth download and a reprojection tool outside the repo. If either is unavailable, the brief tells the worker to block to a person rather than use another source or add a dependency.

**Files changed** (my commit touches only these two):
- `tasks/T-043-shaded-relief.md`
- `tasks.md` (the T-043 status changed from "doing (blocked on a person…)" to "doing")

`PROGRESS.md` has no T-043 line, so I left it alone. The Sessions table has a round-2 expander row.

## Approval — 2026-11-16
Orchestrator wrote the unattended `Approved:` stamp. No human saw the finished criteria.
