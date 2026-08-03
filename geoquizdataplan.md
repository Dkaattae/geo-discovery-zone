# Geo Quiz — Data & Question Bank Plan

## 0. TL;DR

- There is **no usable open question bank** for kids' geography. Don't hunt for one.
- **Generate** questions from structured facts instead of writing them by hand. ~15 templates × ~250 entities = thousands of questions.
- Don't divide the bank US vs. World at the top level. Divide by **entity** and tag everything else.
- **Skip Elo for v1.** Seed difficulty from data you already have. Add Elo when you have real play data.
- Maps: **Natural Earth** (world) + **Census TIGER** (US), both public domain. Avoid amCharts if this might ever be commercial.

---

## 1. Question Bank

### 1.1 What exists (and why it's not enough)

| Source | Content | License | Verdict |
|---|---|---|---|
| Open Trivia DB (opentdb.com) | ~275 geography questions total, split easy/medium/hard | CC BY-SA 4.0 | Too small, written for adults, no map linkage. Useful as a *sanity check* on phrasing only. |
| The Trivia API | Similar scale, geography category | Free tier w/ attribution | Same problems. |
| Kaggle / GitHub quiz repos | Dozens of small hobby sets | Mixed, often unstated | Not worth the licensing ambiguity. |

**The catch with all of them:** CC BY-SA is *share-alike*. If you copy their questions into your bank, arguments exist that your bank inherits the license. For a small number of questions in a kids' app, that's not worth the headache.

### 1.2 The real approach: generate, don't collect

You are not writing questions. You are writing **templates** and filling them from an **entity table**.

```
entities (facts about places)  ×  templates (question shapes)  →  question bank
```

Build one entity row per place. For the US that's 50 states + ~100 cities. For the world, ~195 countries + ~200 cities. About 550 entities total.

**Entity record (US state example):**

```json
{
  "id": "us-state-co",
  "type": "state",
  "scope": "us",
  "name": "Colorado",
  "capital": "Denver",
  "region": "Mountain West",
  "geometry_id": "08",
  "centroid": [-105.55, 39.0],
  "population": 5877610,
  "population_rank": 21,
  "area_rank": 8,
  "borders": ["us-state-wy", "us-state-ne", "us-state-ks", "..."],
  "climate_koppen": ["BSk", "Dfb", "ET"],
  "climate_kid": "dry and cold in the mountains, drier plains to the east",
  "top_crops": ["corn", "wheat", "hay"],
  "state_animal": "Rocky Mountain bighorn sheep",
  "landmark": "Rocky Mountain National Park",
  "fun_facts": [
    { "text": "...", "source_url": "...", "reviewed": true }
  ]
}
```

**Template record:**

```json
{
  "id": "tpl-capital-of",
  "prompt": "What is the capital of {name}?",
  "answer_field": "capital",
  "distractor_strategy": "sibling_capitals_same_region",
  "requires": ["name", "capital"],
  "applies_to": ["state", "country"],
  "format": "multiple_choice",
  "base_difficulty": 2,
  "min_age_band": 1
}
```

Templates to build first:

| Template | Applies to | Format |
|---|---|---|
| Which state/country is highlighted? | state, country | map → 4 choices |
| Click the state/country named X | state, country | click-the-map |
| What is the capital of X? | state, country | MC |
| Which city is marked here? | city | map → MC |
| X is the capital of which country? | country | MC (reverse) |
| Which continent is X in? | country | MC |
| Which country does this flag belong to? | country | image → MC |
| Which of these borders X? | state, country | MC |
| What kind of climate does X have? | state, country | MC |
| Which crop is X known for growing? | state, country | MC |
| Which animal lives in X? | country | MC |
| This famous landmark is in which country? | landmark | image → MC |
| Which state is bigger, X or Y? | state | A/B |
| Which river is highlighted? | river | map → MC |
| Which country does the X flow through? | river | MC |
| Which ocean is this? | ocean | map → MC |
| Which continents does the X separate? | ocean | MC |
| Where is Mount X? | mountain | pin-drop / 4-pin |
| Which mountain range is X part of? | mountain | MC |
| Which is the {est} in the world? | superlative | MC + reveal on map |
| Rank these by size/length | any | drag-to-order |
| Which of these cities is highest up? | city | A/B or MC + profile reveal |
| This is a slice through X — where are the mountains? | continent, country | click-the-profile |
| Why do few people live here? | region | MC, profile + population overlay |
| Is X higher or lower than {reference}? | city, mountain | A/B |

**Distractors matter more than the question.** Pull wrong answers from siblings in the same region or continent — "Which state is this?" with options Ohio / Indiana / Illinois / Iowa is a real question. With options Ohio / Hawaii / Texas / Alaska it's free. Store the strategy on the template, don't hardcode.

### 1.3 How to divide the bank

**Not** `us.json` and `world.json`. That split fails as soon as you want "capitals worldwide" or "all map questions."

Store **one flat pool** of entities plus generated questions, with these tags on every question:

| Tag | Values |
|---|---|
| `scope` | `us` \| `world` |
| `entity_type` | `state` \| `country` \| `city` \| `landmark` \| `river` \| `mountain` \| `lake` \| `ocean` |
| `topic` | `location` \| `capital` \| `climate` \| `agriculture` \| `wildlife` \| `landmark` \| `size` \| `physical` \| `superlative` \| `elevation` |
| `region` | `mountain-west`, `europe`, `southeast-asia`, … |
| `format` | `map_identify` \| `map_click` \| `multiple_choice` \| `image` \| `ab_compare` |
| `age_band` | 1 (6–8) \| 2 (9–11) \| 3 (12+) |
| `level` | 0.0–18.0 (grade + band derived from it — see §1.4) |

Quiz modes then become **filters over tags**, not separate files:

- "US States" → `scope=us, entity_type=state`
- "World Capitals" → `topic=capital, scope=world`
- "Europe" → `region=europe`
- "Farms & Weather" (older kids) → `topic in (climate, agriculture), age_band>=2`

Ship as one file per **region** for lazy-loading (`us.json`, `europe.json`, `africa.json`…) — that's a delivery decision, separate from the logical structure. Keep the loader region-agnostic.

### 1.4 Difficulty: one number, two labels

**Key insight: grade and difficulty are the same axis.** 3rd-hard ≈ 4th-easy. If you store them as two separate enums you'll be doing a painful migration the day you add progression. Store **one number** and derive both labels for display.

```
level : float, 0.0 – 18.0        // the only stored value
grade = floor(level / 2)          // 0 = K, 1 = 1st … 8 = 8th
band  = level - 2*grade           // 0 = easy, 1 = medium, 2 = hard
```

Each grade spans two steps of genuinely new ground, so `grade N hard` and `grade N+1 easy` land on the same number — exactly as intended. "3rd grade, medium" is a *rendering* of `level = 7.0`, never a stored pair.

**v1 — seed `level` deterministically.** You already have the signal:

```
level = base_level(template)
      + entity_obscurity          // population_rank / area_rank, bucketed
      + distractor_tightness      // same-region distractors are harder
      + concept_load              // "why is it dry here" > "what's the capital"
      - familiarity_bonus         // home state, very famous countries
```

Hand-check ~30 and tune the weights until the ordering looks sane. This gets you 90% of the way for free, with zero play data.

**Keep `age_band` anyway.** It does a different job: *appropriateness*, not challenge. Crop-rotation questions aren't hard, they're just uninteresting to a 7-year-old. `level` decides whether a kid can answer; `age_band` decides whether they should be asked. A question can be low-level and high-age-band.

**Build v1 Elo-ready without building Elo.** The whole point of a single scalar is that a rating can replace it later with no schema change:

```
rating = 800 + level * 45        // level 0 → 800, level 18 → 1610
```

So: give every question a `level` now, and a nullable `rating` + `times_answered` field. Ship with `rating = null` and serve on `level`. The day you have real volume, backfill ratings from levels, flip the selector to read `rating`, and every display label keeps working because `level = (rating - 800) / 45`. No migration, no reseeding.

When you do turn Elo on: low K for items (K≈8 — they should be stable), higher K for players (K≈32 — they're actually learning). Don't let an item's rating move at all until it has ~30 answers; before that it's noise wearing a number.

### 1.5 Session progression (design for it now, ship it later)

The intended shape — start a shade below the player's level, ramp up, report where they topped out — is worth reserving room for even though it's post-v1.

Two rules that keep it from backfiring:

- **Report *sustained* level, not peak.** "You reached 4th-hard" should mean *2–3 consecutive correct* at that level, not one lucky guess. Peak-based reporting inflates the next session's starting point, the kid opens to something too hard, and that's the classic quit moment.
- **Ramp down as readily as up.** Three wrong in a row means the level is too high — drop it immediately and quietly, no announcement. Kids read "difficulty lowered" as failure.

Store on the profile: `level` (current), `best_sustained_level`, `last_session_end_level`. v1 can write these and simply not act on them yet — the data collects itself while you're doing other things, and progression ships with history already in it.

### 1.6 Fun facts — the part that needs a human

This is the one place you can't fully automate for a kids' app.

Pipeline: Wikipedia REST summary endpoint → first 1–2 sentences → **write to a review file, not to the app**. Skim the list, flag anything grim or confusing, rewrite in kid language, mark `reviewed: true`. Only reviewed facts ship. 550 entities × 2 facts is an afternoon or two, and it's what makes the app feel handmade instead of scraped.

Keep `source_url` on every fact so you can show "Read more on Wikipedia" and satisfy CC BY-SA attribution.

### 1.7 Physical features (mountains, rivers, lakes, oceans)

These are a **fourth entity family**, not a subtype of country. A river crosses ten borders; a mountain range sits in five countries. Model them separately and link many-to-many.

```json
{
  "id": "river-nile",
  "type": "river",
  "name": "Nile",
  "length_km": 6650,
  "length_rank": 1,
  "flows_through": ["EGY", "SDN", "SSD", "UGA", "ETH"],
  "mouth": "Mediterranean Sea",
  "geometry_ref": { "layer": "rivers", "ne_name": "Nile" },
  "kid_hook": "Ancient Egypt was built along its banks."
}
```

Scope discipline matters here — there are tens of thousands of named rivers. Cap it:

| Family | Target count | Selection rule |
|---|---|---|
| Rivers | ~40 world, ~20 US | Natural Earth `scalerank <= 3`, then hand-trim |
| Mountains / peaks | ~40 world, ~15 US | Highest per continent + culturally famous (Fuji, Kilimanjaro, Matterhorn) |
| Mountain ranges | ~20 | Continental majors only |
| Lakes | ~25 | Great Lakes, Victoria, Baikal, Titicaca, Caspian… |
| Oceans & major seas | 5 oceans + ~15 seas | Fixed list |

Sources: **Wikidata** for the attributes (length, elevation, countries — coverage here is genuinely good, unlike crops and animals). **Natural Earth** for geometry. Join on name plus a manual override table; river naming is messy across datasets and you'll need ~10 hand-fixes.

### 1.8 Superlative questions ("biggest / longest / highest")

Kids love these and they're nearly free to generate — you already store rank fields.

Don't hand-write them. Define a **superlative axis** and let the generator emit both directions:

```json
{
  "id": "sup-river-length",
  "axis": "length_km",
  "entity_type": "river",
  "prompt_most": "Which is the longest river in the world?",
  "prompt_least": null,
  "scope_variants": ["world", "continent:africa", "scope:us"],
  "reveal": "map_highlight"
}
```

Rules that keep these good:

- **Distractors are the next-ranked entities.** #1 vs #2/#3/#4 is a real question. #1 vs three random rivers is not.
- **Scope them for volume.** One "longest river in the world" becomes eight questions once you ask per continent, and it's better pedagogy — a kid who knows the longest river in South America knows more than one who memorized a single global fact.
- **Skip "least."** Smallest country is a fine question (Vatican City); shortest river is a trivia-book curiosity with contested answers. Only emit `prompt_least` where you've explicitly filled it in.
- **Avoid contested rankings.** Nile vs. Amazon length is genuinely disputed, as is Caspian Sea (lake or sea?) and Denali vs. Everest depending on how you measure. Add a `contested: true` flag and either exclude those or turn them into the fun fact — "Scientists actually argue about this one!" is a better moment than a wrong red X.

**Always reveal on the map.** A superlative answered as text is a memorized fact. Answered with the Nile lighting up across northeast Africa, it's geography. This is the single highest-value pairing in the whole app — make `reveal: map_highlight` the default for every superlative.

### 1.9 Source → field mapping

| Field | Source | Notes |
|---|---|---|
| names, capitals, population, borders, continent | **Wikidata SPARQL** (`query.wikidata.org`) | CC0. One query gets all countries. |
| US state facts, state symbols | Wikidata + Census | |
| flags | Wikimedia Commons / `flagcdn.com` | Public domain mostly |
| Köppen climate | Wikidata, or Beck et al. climate raster | Map codes → kid-friendly phrasing yourself |
| world crops | **FAOSTAT** bulk download | Free, needs aggregation to "top 3" |
| US crops | **USDA NASS Quick Stats API** | Free key |
| city coordinates & population | Wikidata, or SimpleMaps World Cities basic (free tier) | |
| animals / plants | ⚠️ **hand-curate** | Wikidata coverage is genuinely poor here. Budget for this. |
| river length, peak elevation, lake area | Wikidata | Good coverage. Cross-check the top 10 by hand. |
| river / lake / peak geometry | Natural Earth physical vectors | Public domain |
| fun facts | Wikipedia REST `/page/summary/{title}` | CC BY-SA — attribute |

Run all of this in a `scripts/build-data.ts` at **build time**. Ship JSON. No runtime API calls, no keys in the client, no Wikipedia vandalism reaching a child mid-quiz.

---

## 2. Maps

### 2.1 Get geometry, not map images

For "which state is highlighted" you need shapes you can **color and click**. That means vector boundary data, not map tiles and not flat PNGs. Google Maps / Mapbox are the wrong tool and will cost you money for something you can ship for free.

### 2.2 Where to get it

**Recommended — TopoJSON, public domain:**

| Source | Coverage | License |
|---|---|---|
| `us-atlas` (npm) | US states, counties — from Census TIGER | Public domain |
| `world-atlas` (npm) | Countries, land — from Natural Earth | Public domain |
| Natural Earth (naturalearthdata.com) | Countries, states, cities, physical features, 3 detail levels | Public domain, no attribution required |
| US Census TIGER/Cartographic Boundary files | US states, counties, places | Public domain (US gov work) |

Start with `npm i us-atlas world-atlas topojson-client`. Use the **1:110m** world file (~100KB) for the whole-world view and 1:50m when zooming into a continent. The 1:10m file is ~4MB — too heavy for a first paint.

**Ready-made SVGs, if you'd rather not deal with projections:**

| Source | License | Notes |
|---|---|---|
| SimpleMaps free maps (simplemaps.com/resources/svg-maps) | US map is MIT; others free for personal + commercial use under their license | Cleaned, web-optimized, states carry postal codes and names as IDs — very convenient |
| MapSVG (mapsvg.com/maps) | Free, commercial use allowed | Per-country maps |
| Wikimedia Commons blank maps | CC BY-SA / GFDL, varies per file | Check each file; attribution required |
| **amCharts free SVG maps** | **CC BY-NC 4.0 — non-commercial only** | ⚠️ Fine for a hobby project. If you ever charge or run ads, you need their paid license. Easy trap. |

### 2.3 Wiring it up

- Render with `react-simple-maps` (wraps d3-geo, handles projections and zoom) or plain `d3-geo` if you want fewer dependencies.
- **Join key:** use **FIPS codes** for US states (`08` = Colorado) and **ISO 3166-1 alpha-3** for countries (`FRA`). Put the same key in your entity records as `geometry_id`. Never join on name strings — "Côte d'Ivoire", "Ivory Coast", and "CIV" will all show up and you'll lose an evening.
- **Projections:** `geoAlbersUsa` for the US (it tucks Alaska and Hawaii in neatly). For the world, `geoNaturalEarth1` — Mercator makes Greenland look bigger than Africa, which is actively bad in a teaching app.
- **City markers** aren't in the boundary files. Plot them yourself from lat/lon in your entity records.
- Give every clickable path a generous hit area. Rhode Island and Luxembourg are unfairly small targets for a 7-year-old on a tablet.

### 2.4 Rendering physical features

Short answer: **rivers and lakes render beautifully, mountains don't render as shapes at all.** Plan around that.

| Feature | Natural Earth layer | Geometry | How it behaves |
|---|---|---|---|
| Rivers | `ne_*_rivers_lake_centerlines` | LineString | ✅ Great. Draw as `<path>`, highlight by stroke color/width. |
| Lakes | `ne_*_lakes` | Polygon | ✅ Same as countries — fill, click, highlight. |
| Mountain **peaks** | `ne_10m_geography_regions_elevation_points` | Point | ✅ Easy — plot a marker. Comes with name + elevation. |
| Mountain **ranges** | `ne_10m_geography_regions_polys` | Polygon | ⚠️ Partial. Majors are there (Himalayas, Andes, Rockies); coverage thins out fast. |
| Oceans & seas | `ne_10m_geography_marine_polys` | Polygon | ⚠️ Usable, but boundaries between oceans are conventional, not physical. Fine for a quiz. |

Three practical notes:

- **Use the tapered rivers file.** Natural Earth ships a variant with scale ranks and line-width attributes so major rivers draw thicker than tributaries. Rivers all at uniform 1px look like a circuit diagram; tapered looks like a map. Worth the extra ~90KB.
- **Rivers are multi-segment.** The Nile is several features sharing a name, not one line. Group by name at build time into a single highlightable object, or highlighting will light up a third of the river.
- **Mountains: fake the range with a peak.** Since range polygons are unreliable, ask "where is Mount Everest?" (point, works everywhere) rather than "click the Himalayas" (polygon, may not exist). For the ranges you *do* have polygons for, you can ask range questions — just gate on data presence, don't assume.

For the world view, a physical basemap ships as: land polygons (light) + rivers (blue lines) + lakes (blue fill) + the quiz feature highlighted. That's roughly 200KB at 1:50m and looks like a proper atlas.

### 2.5 Pin mechanics — and the small-territory fix

Monaco, Singapore, Malta, Cape Verde and Liechtenstein are unclickable at world zoom. Rather than excluding them, use pins — which turn the weakness into two good question formats.

**Format A — pick from labeled pins.** Four numbered pins on the map, "which one is Cape Verde?" Recognition task, 25% guess floor. Good for younger kids and for any entity too small to tap.

**Format B — drop your own pin.** Recall task, much harder. Same template, different `format`, higher `difficulty`. Good for older kids.

Ship both. They're the same question at two levels, which is exactly what the age-band system is for.

**Grading a dropped pin — don't use a fixed radius.** A 200km tolerance is generous for Cape Verde and about three pixels at world zoom. Use a hierarchy instead:

1. Inverse-project the tap to lon/lat (`projection.invert([x, y])`).
2. **Point-in-polygon first.** If the tap lands inside a country's shape, that's their answer. Correct for large countries — a tap in west Texas is Texas, even though New Mexico's centroid is closer.
3. **If it hits no polygon** (ocean, or a sub-pixel island), fall back to **nearest centroid**, capped at a max distance so a tap mid-Atlantic doesn't accidentally win.

One code path handles Russia and Malta. No per-entity radius tuning.

For rivers, grade by **distance to the line**, not to a centroid — a river's centroid can sit in a country the river never touches.

**Auto-zoom before asking.** "Somewhere in West Africa…" then frame the map on the Atlantic before posing Cape Verde. This dissolves the tiny-territory problem properly instead of hacking around it, and it teaches the neighborhood before the country — which is how kids actually build a mental map.

**Finger occlusion.** A child's fingertip covers the exact spot they're aiming at. Use drag-then-confirm: the pin follows the finger with a crosshair offset *above* it, commits on a second tap. Otherwise you're grading motor control, not knowledge.

**On the reveal:** show the correct pin *and* the distance. "You were 340 km off!" is far more motivating than a red X, and near-misses read as progress instead of failure. Consider partial credit at that point — though keep the pass/fail binary for feeding item difficulty, or your stats get muddy.

Still tag genuinely microscopic entities as `tiny: true` so the generator routes them to pin formats and away from click-the-shape.

---

### 2.6 Elevation & terrain

The most under-used dimension in kids' geography, and the one that explains the most. Altitude is *why* Denver is cold, *why* the Atacama is dry, *why* nobody lives in the middle of the Andes. Political maps can't show any of that.

**Two separate jobs, don't conflate them:**

| Job | Needs | Solution |
|---|---|---|
| Make the map *look* like terrain | An image | Natural Earth raster underlay |
| Let a kid *feel* how high something is | Numbers | Elevation profile / cross-section |

#### A. Terrain basemap — nearly free

Natural Earth ships prerendered elevation rasters, public domain, derived from NASA SRTM Plus and registered pixel-perfect with the vector files you're already using. Drop one under your country paths as an `<image>` and you're done.

| Variant | Use for |
|---|---|
| **Shaded Relief Basic** (grayscale) | ✅ Best for quizzes. Brightness = terrain, nothing else competing. |
| Gray Earth w/ Shaded Relief + Hypsography | ✅ Good middle ground — subtle elevation tint, still readable |
| Cross-blended Hypsometric Tints | ⚠️ Beautiful, but see caveat below |
| Natural Earth II w/ Shaded Relief | Pretty atlas look, land-cover colored |

⚠️ **Cross-blended tints caveat.** They modulate color by *climate as well as elevation* — the Sahara is brown, northern Russia is boreal green, the Mekong delta is jungle green. Stunning as a basemap, but a child cannot read height from color, because color is also encoding biome. Two places at the same elevation can be different colors. **Don't use it for any question where the answer is "which is higher."** Use grayscale relief for those.

Sizes: prerendered tile sets run ~8–20MB for the world; the raw 1:50m GeoTIFFs are 10,800 × 5,400. Slice per-continent PNGs at build time and ship only what each quiz region needs.

#### B. Elevation profiles — the part that actually teaches

A top-down map fundamentally cannot convey height. Relief shading is a clever workaround, not a solution. A **cross-section** — the terrain seen from the side — turns altitude into a *shape*, and shapes are what kids remember.

Precompute at build time:

1. Define a cut line (two lon/lat endpoints), e.g. `[-122.4, 39.0] → [-75.0, 39.0]` for a US transect through Denver's latitude.
2. Sample ~200 evenly spaced points along it.
3. Look up elevation for each point.
4. Store as a flat array. Render as an SVG area chart.

```json
{
  "id": "profile-us-39n",
  "label": "Across the USA at Denver's latitude",
  "from": [-122.4, 39.0],
  "to": [-75.0, 39.0],
  "samples": [12, 340, 1180, 1609, 4300, 2100, ...],
  "markers": [
    { "at_km": 1520, "label": "Denver", "elevation_m": 1609 }
  ],
  "vertical_exaggeration": 50
}
```

**Elevation data sources:**

| Source | Coverage | Cost |
|---|---|---|
| **OpenTopoData** (self-host or public API) | Global, multiple DEMs | Free; public instance is rate-limited |
| **Open-Elevation** | Global | Free |
| **USGS 3DEP / National Map** | US, very high res | Free |
| **GEBCO / ETOPO** grids | Global, includes ocean floor | Free download, use directly |
| **Google Elevation API** | Global, reliable | Paid, needs key |

Since you're sampling at **build time**, run it once and ship the arrays — rate limits stop mattering and no key ends up in the client. If you'd rather not call any API, download an ETOPO grid and sample it locally with `rasterio`. That's the fully offline path. (This is, incidentally, the one place Google's geo APIs would genuinely earn their keep — but the free options are fine for ~30 precomputed profiles.)

**Vertical exaggeration is mandatory.** At true scale, Everest across the width of Asia is an invisible bump — the Earth is remarkably smooth. Exaggerate 30–100× and label it honestly ("stretched to make the mountains easier to see"). Cartographers have done this forever; hiding it would be the dishonest choice, mentioning it is a lesson in itself.

**Profiles worth building first:**

- **South America at ~12°S** — sea level → 6,000m Andes in 200km → 3,000km of flat Amazon. The most dramatic profile on Earth.
- **USA at 39°N** — plains ramping up to Denver, then the Rockies wall.
- **Asia at 28°N** — Ganges plain into the Himalayas.
- **Europe at 46°N** — the Alps sitting between two lowlands.

#### C. Making numbers mean something

"1,609 metres" is noise to a 9-year-old. Always render elevation **relative to something they know**:

- vs. their own city ("Denver is 8× higher than where you live")
- vs. a stack of known objects (Empire State Buildings, football fields)
- vs. cruising altitude ("planes fly at 10,000m — Everest is most of the way there")
- vs. the tallest thing they've seen

Store `elevation_m` as the truth and generate the comparison at display time from the kid's home location.

#### D. The chain worth teaching

Altitude → temperature → rainfall → farming → where people live. This is the highest-value sequence in the whole app, and your `age_band` 3 content should be built around it rather than around more facts.

Pair a profile with a **population-dot overlay** and the question asks itself: *"Why does almost nobody live along this stretch?"* A kid who works that out has understood something no capital-city flashcard will ever deliver. Even a wrong answer here is more valuable than a right answer elsewhere — so score these gently, or not at all.



## 3. Game Logic & Session Flow

### 3.1 Screen flow

```
  Splash
    ↓
  Profile picker ──── [+ New player] ──→ Create profile
    ↓                                        ↓
  Home (name, streak, map progress)  ←───────┘
    ↓
  Setup: grade → topic → [Start]
    ↓
  ┌─────────── Question loop ───────────┐
  │  Present → Answer → Reveal → Next   │
  │       ↑                    │        │
  │       └────────────────────┘        │
  │  [Quit] → Confirm/Summary → Home    │
  └─────────────────────────────────────┘
    ↓
  Session summary
```

### 3.2 Profiles, not accounts

**v1 decision: no recovery code.** A recovery code implies a server to recover *from* — if progress lives in `localStorage`, the code is decorative. Shipping one would quietly commit you to a backend, and with it storing children's data and the whole COPPA surface you'd otherwise avoid.

| Option | Recovery? | COPPA surface | When |
|---|---|---|---|
| localStorage only | No | None | ✅ **v1** |
| + export/import JSON | Manual backup | None | v1.5 |
| Server accounts | Yes | Real | Later, if ever |

**PIN reality check for K-8.** A kindergartener cannot manage a 4-digit PIN, and a one-time recovery code shown to a 6-year-old is lost data with extra steps. What a PIN actually protects against is *a sibling overwriting your progress on the family tablet* — and the standard solution to that is a profile picker, not authentication.

Recommended:

- **Profile = name + avatar.** Tap your face, you're in. Works at any age.
- **PIN optional**, offered only for grade 4+, framed as "keep your little brother out."
- A grown-up-facing **export button** in settings writes a JSON backup. That's the recovery story for v1.5, and it puts the responsibility on the adult where it belongs.

```json
{
  "profile_id": "p_a7f3",
  "name": "Maya",
  "avatar": "fox",
  "pin_hash": null,
  "created_at": "2026-08-02",
  "level": 7.0,
  "best_sustained_level": 8.0,
  "last_session_end_level": 7.5,
  "stats": { "answered": 214, "correct": 168, "streak_days": 4 },
  "mastery": { "us-state-co": 0.8, "country-per": 0.2 },
  "review_queue": ["us-state-vt", "river-nile"]
}
```

### 3.3 Level selection

Setup shows **topic → level → Start**. Grade isn't asked per session; it's on the profile.

The level picker displays the familiar two-part label ("3rd grade · Medium") but writes a single `level` number (§1.4). Show only a window around the profile's current level — three or four choices, not all nineteen. A K-2 child should never be scrolling past 7th grade options.

**Default to the profile's `last_session_end_level`,** so the common case is: open app, tap topic, tap Start.

### 3.4 Timers — dropped for v1

No countdown on any question. The stated goal is to slow down and let the explanations land; a timer works directly against that, penalizes slow readers, and punishes the child who is thinking hardest.

If a "Speed Round" is ever wanted, build it as a **separate opt-in mode** over simple recall questions only — never over map, elevation, or "why" questions, where deliberate looking is the entire skill being taught.

Reserve a nullable `time_limit_s` on the question schema so the option stays open. Ship it null.

### 3.5 The question lifecycle

```
PRESENTING  → question rendered, input live
SELECTED    → answer chosen, not committed  (MC only)
COMMITTED   → grading runs
REVEALING   → explanation shown, Next enabled
```

**Commit friction should scale with the input.**

- **Multiple choice:** tap the answer = commit. A separate Submit button doubles the taps on every question in the app. If accidental taps worry you, add a 1.5s undo bar instead of a permanent extra step.
- **Pin-drop:** drag, then Submit. Here the confirm step is genuinely needed (see §2.5 — finger occlusion).

**Asymmetric reveals.** If every single question triggers a full explanation modal, kids learn to dismiss without reading. Within a week you'll have taught them to tap through the exact content the app is for. Differentiate:

Two tiers, and the *content differs by outcome*:

| Outcome | Short tier (always shown) | Detail tier (behind a button) |
|---|---|---|
| **Correct** | Green + a **fun fact**. No re-teaching — they got it. Dismissible immediately. | "Tell me more →" opens the fuller Wikipedia-derived blurb |
| **Wrong** | An **explanation**: why the right answer is right. Correct answer highlighted **on the map**. Next enabled after ~1s. | "Why? →" opens the deeper reasoning, plus the fun fact |

The asymmetry is the point. A correct answer earns a *reward*; a wrong answer earns a *reason*. Collapsing both into one generic modal is how you train kids to tap through the exact content the app exists to deliver.

Two rules for the short tier:

- Keep it to one or two sentences. If it needs three, it belongs in the detail tier.
- On a wrong answer, the short text must answer **"why,"** not restate the answer. "Denver is the capital, not Colorado Springs" teaches nothing. "Denver grew up as the railroad hub, so the government settled there" does.

Never use a red X alone. For pin-drop, show distance instead ("340 km off!" — §2.5).

Both tiers are fields on the entity/template, authored alongside the fun facts in §1.6 — so this costs writing time, not engineering time.

### 3.6 Standalone questions + the closure problem

Endless standalone questions is the right call for this content — but it removes any sense of *finishing*, and kids need a stopping point that feels earned rather than abandoned.

Resolve it without imposing fixed-length rounds:

- A **session** is whatever was played since Start. It ends when the kid quits. That's it.
- Show a lightweight progress ribbon — questions answered this session, current streak — so there's rhythm without a finish line.
- Offer **soft milestones**: at 5, 10, 20 questions, a small celebration and an explicit "Great stopping point! Keep going?" Gives permission to stop, which is the thing open-ended play usually lacks.
- Long term, the **map itself is the progress bar.** States fill in with color as they're mastered. A half-colored US map is a far better motivator than any point total, and it makes the goal legible at a glance.

### 3.7 The review queue — the biggest gap in the current design

As described, a wrong answer produces an explanation and then vanishes forever. That's the single largest missed opportunity in the whole flow: the questions a kid gets *wrong* are the only ones that actually need re-asking.

Minimum viable version:

1. Wrong or timed-out → push `entity_id` to `review_queue`.
2. Every ~7th question, pop from the queue instead of generating fresh.
3. Answered correctly on review → increment `mastery`, remove after two clean passes.
4. Cap the queue (~20) so it never feels like punishment.

**Triggering a review round.** Two different signals, two different responses — don't conflate them:

| Signal | Meaning | Response |
|---|---|---|
| **3 wrong in a row** | Level is too high | Drop `level` quietly. No message. Don't offer review — they're already struggling. |
| **5 wrong cumulative this session** | Real gaps worth revisiting | Offer a review round |

The offer should be an **invitation, not an interruption**:

> "Want to try those tricky ones again?"
> [Let's do it] · [Keep going]

Never force it, and never re-ask immediately after a wrong answer — that reads as being corrected. Wait for the next natural gap.

On accepting, run the queue as a short set (5 max) and end it with a genuine win: *"You got 4 of those right this time!"* Review that ends in another failure is worse than no review at all.

**Don't recycle the exact same question.** If they missed "which state is this?" for Vermont, come back with "what's the capital of Vermont?" — same entity, different angle. Otherwise you're testing whether they remember the last thirty seconds, not whether they learned Vermont.

This is perhaps 40 lines of code and it's the difference between a quiz and something that teaches.

### 3.8 Quit flow

Confirm-before-exit is right — accidental quits are common on tablets.

```
[Quit] → "Done for now?"
         ├── Summary: answered, correct, new places learned
         ├── [Keep playing]  (default, larger target)
         └── [Back home]
```

Two notes: make **Keep playing** the visually dominant option, and never show the summary as a scorecard with a percentage. "You learned 3 new states!" beats "60%" for a child who got 6 of 10 — same information, completely different message about whether to come back.

### 3.9 What to defer

Not in v1, to keep the loop shippable: leaderboards, multiplayer, achievements/badges, sound design, daily challenges, parent dashboard. Every one is a reasonable idea and every one is a week you're not testing whether the core question loop is fun.

---

## 4. Build order

1. Entity table for **50 US states** only — Wikidata query, ~1 hour.
2. Three templates: identify-on-map, capital-of, click-the-map.
3. Wire `us-atlas` + `react-simple-maps`, join on FIPS.
4. **Question loop only** — present → answer → reveal → next. No profiles, no setup screen, no timer. Hardcode `level = 7.0`.
5. Fun facts for 50 states, reviewed by hand.
6. Ship it. Play it with an actual kid. Watch where they get stuck.
7. Then, in order: review queue → profile picker → topic/difficulty setup → map-fills-in progress.
8. Then: countries → world cities → rivers/mountains/oceans → elevation profiles → climate/crops for the older band.

Superlatives are the cheapest win on that list — once entities carry rank fields, the whole family generates itself. Slot them in as soon as countries land.

The **shaded-relief basemap is worth adding early** — it's one image tag, and it makes every existing map question look more like an atlas and less like a form. Profiles come later; they need real build tooling.

Do not build the world data until the US loop feels good. The world is 4× the entities and every structural mistake gets 4× more expensive to fix.
