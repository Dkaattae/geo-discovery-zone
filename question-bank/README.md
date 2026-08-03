# Question bank

Build-time pipeline that turns structured facts into entity records for the geo
quiz. Implements §1.2 and §1.9 of [`geoquizdataplan.md`](../geoquizdataplan.md):
generate from an entity table rather than collecting hand-written questions.

Scope today: **the 50 US states**. Countries, cities and physical features are
the same pipeline with a different query and curation table — deliberately not
built until the US loop feels good (§4).

## Run it

```bash
bun install

bun run build:sample     # offline: recorded fixture → sample-data/
bun run build            # live: query.wikidata.org → data/us-states/
bun run build -- --states CO,VT --out data/subset
bun run typecheck
```

| Flag | Meaning |
|---|---|
| `--states CO,VT` \| `all` | Which states to write (default `all`) |
| `--out <dir>` | Output directory (default `data/us-states`) |
| `--sink json` \| `db` | Where entities go (default `json`) |
| `--offline` | Replay the fixture instead of calling Wikidata. Implies `--no-fun-facts` |
| `--fixture <path>` | Use a specific fixture (implies `--offline`) |
| `--no-fun-facts` | Skip the Wikipedia summary pass |

## ⚠️ The live query has never run

`query.wikidata.org` is blocked by the egress policy of the environment this was
written in — `403` on CONNECT, from both curl and the SPARQL client. The failure
path is verified (the client reports `SPARQL request failed (403)` and exits 1);
**the success path is not**. Nothing here has seen a real Wikidata response.

Before trusting a live run, expect to check:

- the property IDs in [`src/queries/us-states.ts`](src/queries/us-states.ts), in
  particular `P5086` (FIPS 5-2 numeric) — the curated table cross-checks it, so a
  wrong ID shows up as 50 warnings rather than as bad data;
- the unit on `P2046` (area). `wdt:` drops units, so a square-mile value arrives
  looking like a plausible number. `normalize.ts` range-checks it and warns;
- that `GROUP BY` + the label service behave as expected under aggregation.

## How it fits together

```
queries/us-states.ts     one SPARQL query, all 50 states
        ↓
sources/wikidata.ts      raw bindings → WikidataStateRow[]
        ↓
curated/us-states.ts     FIPS join keys, regions, hand-curated fields
        ↓
normalize.ts             join + rank + warn → Entity[]
        ↓
sinks/                   JsonFileSink today, DbSink tomorrow
```

**Curation is not a workaround.** FIPS codes are the key
`frontend/src/components/UsMap.tsx` joins on; they are fixed by federal standard
and belong in source control, not in a nightly query result. Wikidata is still
read and cross-checked, and disagreements surface as warnings. Regions are this
app's own vocabulary. Animals and crops are called out in §1.9 as genuinely poor
Wikidata coverage, so they are left blank rather than guessed.

**Ranks need the whole field.** `population_rank` and `area_rank` are emitted as
`null` unless all 50 states are in the result set — otherwise a one-state build
would confidently report Colorado as the largest state in the country.

**Fun facts never ship unreviewed.** The Wikipedia pass writes
`fun-facts.review.json` for a human to rewrite in kid language and mark
`reviewed: true` (§1.6). It does not write into an entity's shippable text.

## The database seam

`--sink db` is wired end to end and intentionally unimplemented:
[`src/sinks/db.ts`](src/sinks/db.ts) throws with a message saying so. The point
is that `build.ts`, `normalize.ts` and every source module only ever see the
`EntitySink` interface, so adding a backend is one class — no orchestration, no
normalizer and no CLI parsing moves. That file documents the shape to keep
(upsert on `entities.id`, transaction in `open`/`close`, and the two things JSON
gets free that a table will not: deletes and schema drift).

## Layout

```
src/
  build.ts                CLI orchestrator
  types.ts                Entity, FunFact, EntitySink
  sparql.ts               SPARQL client (User-Agent, backoff, WKT parsing)
  queries/us-states.ts    the query
  sources/wikidata.ts     bindings → rows
  sources/wikipedia.ts    REST summary → draft facts
  curated/us-states.ts    manual override table
  normalize.ts            rows + curation → entities
  sinks/                  json.ts, db.ts, index.ts
  fixtures/               recorded SPARQL responses for offline runs
sample-data/              output of one committed run
```
