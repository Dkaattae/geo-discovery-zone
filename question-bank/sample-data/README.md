# Sample data

Output of one real pipeline run against live Wikidata, committed so the entity
shape is reviewable without running anything:

```bash
bun run build -- --states CO --out sample-data      # what produced these files
bun run build:sample                                # same output, offline replay
```

- `us-state-co.json` — one complete entity record
- `fun-facts.review.json` — the draft fact the Wikipedia pass wrote, `reviewed: false`
- `index.json` — what `JsonFileSink` writes alongside them

Everything here came from `query.wikidata.org` and the Wikipedia REST summary
endpoint. `population_rank: 21` and `area_rank: 8` are real: `--states CO` still
fetches all 50 states and ranks across the full field before subsetting, so a
one-state build reports Colorado's true position rather than "1 of 1".

The fun fact is deliberately raw Wikipedia prose, not shippable text. It is one
sentence about a "landlocked state in the Mountain West subregion" — accurate,
and no use to a seven-year-old. Someone rewrites it in kid language and sets
`reviewed: true`; until then nothing reaches an entity's `funFact` field (§1.6).

`top_crops` is empty because that needs USDA NASS, not Wikidata (§1.9).

Wikidata is edited continuously, so these values are a snapshot — population in
particular moves with each census revision. Re-run the command above to refresh.
