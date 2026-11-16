# T-043 — Shaded-relief basemap — run log

**Task:** T-043 · **Branch:** `task/T-043-shaded-relief` · **PR:** #147
**Started:** 2026-11-16 · **Outcome:** halted — needs human

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
