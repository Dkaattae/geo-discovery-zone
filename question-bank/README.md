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

## What the first live run found

The query has now run against `query.wikidata.org` for real: 50 states, every
core field populated, no warnings. Three things it got wrong first time, all
fixed here, all worth knowing if you extend the query:

**`P5086` is the alpha code, not the numeric one.** It returns `CO`; the map
joins on `08`. The numeric code is **`P5087`**. This is the failure the curated
FIPS table exists to catch — the build reported 50 mismatch warnings and kept the
correct codes, rather than emitting a bank whose every state failed to highlight.

**A state can arrive twice.** Louisiana lists New Orleans alongside Baton Rouge,
and a truthy `wdt:P36` returns both — which, with `?capitalLabel` in `GROUP BY`,
splits it into two rows and pushes the count to 51. The query now reads the
capital through its statement and rejects any with a `P582` end-time qualifier.
`normalize.ts` also de-duplicates defensively, since the next such state would
otherwise silently suppress every rank.

**`P2046` area units were fine.** Values came back in km² across all 50 (Alaska
1,717,856; Rhode Island 3,144), so the range check in `normalize.ts` never fired.
It stays, because `wdt:` still drops the unit and a future edit could change it.

Two smaller notes: Alaska has no `P610` highest point, and WDQS returned one
transient `502` mid-session — the client's backoff absorbs both.

## Networks that `fetch` cannot reach

Bun's `fetch` cannot negotiate some egress proxies. It fails with `socket
connection was closed unexpectedly` before a request leaves the process, and
Claude Code's cloud sandbox is a documented case. `httpGet()` in
[`src/sparql.ts`](src/sparql.ts) therefore falls back to `curl` on transport
failure and logs when it does. HTTP error responses are *not* fallback triggers —
those are the caller's business. Set `QUESTION_BANK_NO_CURL=1` to disable the
fallback and see the original error.

If the run fails with `403 Host not in allowlist`, that is the sandbox, not
Wikidata: add `query.wikidata.org` and `en.wikipedia.org` to the environment's
allowed domains and start a fresh session.

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
