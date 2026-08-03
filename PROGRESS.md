# Progress

Where the project stands against [`geoquizdataplan.md`](geoquizdataplan.md).
Section numbers below refer to that plan.

_Last updated: 2026-08-03_

## Layout

```
frontend/       the TanStack Start app (question loop, map, profiles)
question-bank/  build-time data pipeline (Wikidata → entity JSON)
openapi.yaml    API contract for the backend that does not exist yet
geoquizdataplan.md
```

## Done

### Frontend — the v1 loop

- Screen flow end to end (§3.1): splash → profile picker → create → home →
  setup → question loop → summary.
- Question loop with the asymmetric reveal (§3.5): a correct answer gets a fun
  fact, a wrong one gets a reason plus the answer on the map. Two tiers, second
  behind a button.
- US map on `us-atlas` + `react-simple-maps`, joined on FIPS, `geoAlbersUsa`
  (§2.2, §2.3).
- Difficulty as one scalar (§1.4): `level` 0–18 stored, grade and band derived
  for display. No stored enum pair to migrate later.
- Review queue (§3.7): wrong answers queue the entity, every ~7th question pops
  one, two clean passes clear it, capped at 20.
- Level drift: +0.5 on four correct in a row, −0.5 on three wrong, applied
  silently (§1.5).
- Profiles in `localStorage`, no accounts, no PIN, no recovery code (§3.2).
- Soft milestones at 5/10/20 and a quit flow that reports places learned rather
  than a percentage (§3.6, §3.8).
- No timers anywhere (§3.4).

### Repo structure

- App moved under `frontend/` so the root can hold cross-cutting artifacts.
- `geoquizdataplan.md` at the root as the reference the work is measured against.
- `openapi.yaml` at the root — content, profile and session API, validated
  against OpenAPI 3.1. Contract only; no server implements it yet.

### Question bank — the pipeline

- `question-bank/` builds entity records for the 50 US states from a single
  Wikidata SPARQL query (§1.9), with backoff and a descriptive User-Agent.
- Curated override table for the things Wikidata is bad at or has no concept of:
  FIPS join keys, this app's regions, animals, kid-facing climate phrasing
  (§1.7, §1.9). Wikidata's FIPS is still read and cross-checked; mismatches
  warn rather than silently win.
- Ranks computed across the full field and suppressed to `null` on a partial
  build, so a one-state run cannot claim Colorado is the largest state.
- Wikipedia summary pass writes `fun-facts.review.json` for human review —
  unreviewed text never reaches an entity's shippable fields (§1.6).
- `EntitySink` seam: JSON files today, `DbSink` stubbed and wired so the backend
  step is one class rather than a refactor.
- One committed sample run in `question-bank/sample-data/`.

## Known gaps in what is done

- **The live Wikidata query has never run.** `query.wikidata.org` is blocked by
  the egress policy of the environment this was written in. The failure path is
  verified; the success path is not. Property IDs — `P5086` especially — and the
  unit on `P2046` need checking on a first real run.
- The committed sample was produced from a hand-authored fixture, not a recorded
  live response.
- `bestSustainedLevel` is written as peak (`max(best, level)`) in
  `Session.tsx`, where §1.5 argues for *sustained* — 2–3 consecutive correct.
  `openapi.yaml` specifies the sustained behaviour, so the client needs a fix
  when the backend lands.
- Lovable builds from the repo root and will need repointing at `frontend/`.

## Next

In rough order. §4 of the plan is the authority on sequencing: do not build the
world until the US loop feels good.

### 1. Finish the US entity table

- [ ] Run the pipeline live and fix whatever the first real response breaks.
- [ ] Commit the full 50-state output.
- [ ] Review the 50 draft fun facts by hand and flip `reviewed: true` (§1.6) —
      an afternoon, and it is what makes the app feel handmade rather than
      scraped.
- [ ] Fill the curated blanks: state animals, landmarks, kid-facing climate.
- [ ] US crops from USDA NASS Quick Stats (§1.9).

### 2. Question generation

Currently the question bank is hand-written in `frontend/src/data/questions.ts`.
The plan's whole point is that it should be generated (§1.2).

- [ ] Template records: `{ prompt, answer_field, distractor_strategy, requires,
      applies_to, format, base_difficulty, min_age_band }`.
- [ ] Generator: entities × templates → questions.
- [ ] Distractor strategies — same-region siblings, not random states (§1.2).
- [ ] Seed `level` deterministically from template base, entity obscurity,
      distractor tightness, concept load, familiarity (§1.4). Hand-check ~30 and
      tune.
- [ ] Emit the tag set the API filters on: `scope`, `entity_type`, `topic`,
      `region`, `format`, `age_band`, `level`.

### 3. Backend

- [ ] Implement `DbSink` — upsert on `entities.id`, transactional, idempotent.
- [ ] Schema + migrations for entities, questions, profiles, sessions.
- [ ] Serve the content half of `openapi.yaml` first; it is read-only and a
      static host satisfies it.
- [ ] Sessions and grading after that. Profiles last — that is the part that
      means storing children's data, and the app does not need it to work.

### 4. Frontend follow-ons

- [ ] Read the bank from the pipeline output instead of hand-written data.
- [ ] Map fills in as entities are mastered — the map is the progress bar (§3.6).
- [ ] Fix `bestSustainedLevel` to sustained rather than peak.
- [ ] Shaded-relief basemap: one `<image>` tag, and every existing map question
      starts looking like an atlas (§2.6, §4).

### 5. Later, in plan order

- [ ] Superlatives — nearly free once entities carry rank fields (§1.8).
- [ ] Countries, then world cities, then rivers/mountains/oceans (§1.7).
- [ ] Pin formats and the point-in-polygon grading hierarchy (§2.5).
- [ ] Elevation profiles and the altitude → climate → farming → population chain
      (§2.6) — the highest-value content for the older band.
- [ ] Elo, once there is real play data. `rating` and `times_answered` already
      have their places; nothing needs reseeding (§1.4).

### Deferred on purpose (§3.9)

Leaderboards, multiplayer, badges, sound, daily challenges, parent dashboard.
Each is a reasonable idea and each is a week not spent finding out whether the
core loop is fun.
