# Progress

Where the project stands against [`geoquizdataplan.md`](geoquizdataplan.md).
Section numbers below refer to that plan.

_Last updated: 2026-08-04_

## Layout

```
frontend/       the TanStack Start app (question loop, map, profiles)
question-bank/  build-time data pipeline (Wikidata → entity JSON)
api/            FastAPI backend — planned, not built (plan §5)
openapi.yaml    API contract for the backend that does not exist yet
```

Docs: [`geoquizdataplan.md`](geoquizdataplan.md) is the plan (§5 is the tech
stack), [`tasks.md`](tasks.md) is the work queue, [`process.md`](process.md) is
how to work through it, and [`CLAUDE.md`](CLAUDE.md) holds the repo rules. This
file is the coarse-grained view; `tasks.md` is where the detail lives.

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
- Tech stack settled and written into plan §5: React frontend, FastAPI backend,
  Postgres with Alembic owning the schema, uv for Python and bun for TypeScript.
- Working docs in place — `CLAUDE.md` (rules), `tasks.md` (queue),
  `process.md` (loop), `test-guidelines.md` (what and how to test), and
  `tasks/` for the brief of whatever is in flight.
- Development loop defined end to end: pick → expand into a brief with
  acceptance criteria → work → verify in a fresh session that writes tests from
  those criteria alone → PR → sweep the brief and re-evaluate the queue.
- Four agents in `.claude/agents/` — task-expander, worker, tester, reviewer —
  each prevented from doing the job that would let it grade its own work. The
  reviewer merges only inside a narrow envelope and escalates everything else.
- `decisions.md` records why the process is shaped this way — no orchestrator,
  markdown queue rather than an issue tracker, sequential sessions — with the
  trigger that would make each worth revisiting.
- `geoquizdataplan.md` at the root as the reference the work is measured against.
- `openapi.yaml` at the root — content, profile and session API, validated
  against OpenAPI 3.1. Contract only; no server implements it yet.

### Question bank — the pipeline

- `question-bank/` builds entity records for the 50 US states from a single
  Wikidata SPARQL query (§1.9), with backoff and a descriptive User-Agent.
- **Run live against Wikidata**: 50 states, every core field populated, zero
  warnings. Ranks verified against reality — California first by population,
  Alaska first by area, Rhode Island fiftieth.
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
- One committed sample run in `question-bank/sample-data/`, containing real
  downloaded data plus the unreviewed Wikipedia draft fact.
- Recorded fixture of a real 50-row response, so `--offline` reproduces a full
  build with no network.

## Known gaps in what is done

- The 50-state output is **not committed** — `question-bank/data/` is gitignored
  and regenerated from Wikidata. Only the one-state sample is in git.
- Fun facts are drafted but **not reviewed**. Nothing ships until a human
  rewrites them (§1.6).
- `top_crops` and `state_animal` are still empty; they need USDA NASS and hand
  curation respectively (§1.9).
- Bun's `fetch` cannot traverse some egress proxies, so the client falls back to
  `curl`. Fine where curl exists; a runtime without it needs another path.
- `bestSustainedLevel` is written as peak (`max(best, level)`) in
  `Session.tsx`, where §1.5 argues for *sustained* — 2–3 consecutive correct.
  `openapi.yaml` specifies the sustained behaviour, so the client needs a fix
  when the backend lands.
- Lovable builds from the repo root and will need repointing at `frontend/`.

## Next

Broken into small, independently landable tasks in [`tasks.md`](tasks.md) — that
is the queue to work from. The summary below stays for orientation. §4 of the
plan is the authority on sequencing: do not build the world until the US loop
feels good.

### 1. Finish the US entity table

- [x] Run the pipeline live and fix whatever the first real response breaks —
      `P5086` was the alpha FIPS code, not numeric (`P5087`), and Louisiana's
      historical capital split it into two rows.
- [ ] Decide whether the full 50-state output belongs in git or stays generated.
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
