# Sample data

Output of one real pipeline run against live Wikidata, committed so the entity
shape is reviewable without running anything:

```bash
bun run build -- --states CO --out sample-data      # what produced these files
bun run build:sample                                # same output, offline replay
```

- `us-state-co.json` — one complete entity record
- `index.json` — what `JsonFileSink` writes alongside them

Everything here came from `query.wikidata.org` and the Wikipedia REST summary
endpoint. `population_rank: 21` and `area_rank: 8` are real: `--states CO` still
fetches all 50 states and ranks across the full field before subsetting, so a
one-state build reports Colorado's true position rather than "1 of 1".

`fun_facts` here is Colorado's human-reviewed fact from `CuratedState` in
`src/curated/us-states.ts` (T-011), folded in by `normalize.ts` the same way
`climate_kid` and `landmark` are — this command runs `--offline`, so it does
not touch the Wikipedia pass or write a review file. A *live*, non-`--offline`
run against a state with no curated fact yet is what writes
`fun-facts.review.json`: raw Wikipedia prose, `reviewed: false`, never
committed (`.gitignore`, `question-bank/data/us-states/*.review.json`) and
never folded into a shippable field until a human rewrites it in kid language
and sets `reviewed: true` (§1.6).

`top_crops` is empty because that needs USDA NASS, not Wikidata (§1.9).

Wikidata is edited continuously, so these values are a snapshot — population in
particular moves with each census revision. Re-run the command above to refresh.
