# Sample data

Output of one real pipeline run, committed so the entity shape is reviewable
without running anything:

```bash
bun run build:sample     # --offline --states CO --out sample-data
```

- `us-state-co.json` — one complete entity record
- `index.json` — what `JsonFileSink` writes alongside it

**The values came from a hand-authored fixture, not from Wikidata.** The live
endpoint is blocked in the environment this was built in (see the warning in
[`../README.md`](../README.md)), so
[`../src/fixtures/us-states.sparql.json`](../src/fixtures/us-states.sparql.json)
stands in for a recorded response, with values taken from the Colorado record
already in `frontend/src/data/entities.ts` and the worked example in
`geoquizdataplan.md` §1.2.

What the run does exercise for real: SPARQL binding parsing, WKT centroid
parsing, the curated-table join, FIPS cross-checking, border resolution by label
fallback, rank suppression on a partial set, and the JSON sink. Re-run against
live Wikidata and this directory should regenerate with the same shape and
trustworthy values — `population_rank` and `area_rank` fill in only on a full
50-state run.
