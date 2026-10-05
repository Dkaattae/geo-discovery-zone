/**
 * T-069: each state's highest-point elevation **with its unit**.
 *
 * The main query (`us-states.ts`) reads P2044 through `wdt:`, which returns the
 * bare amount and drops the unit — so Arizona's `12622` (feet) and Alaska's
 * `6190` (metres) look alike, and its `MAX` over an item that carries both a
 * metre and a foot statement picks the feet. This query reads the full value
 * node instead (`p:P2044/psv:P2044` → `wikibase:quantityAmount`,
 * `wikibase:quantityUnit`), one row per statement, and leaves choosing between
 * them to `normalize.ts`.
 *
 * `wikibase:BestRank` keeps exactly the statements `wdt:` would have returned
 * (preferred if any, otherwise normal; never deprecated), so a state's metre
 * values here are the same set the main query aggregated.
 *
 * The unit is OPTIONAL on purpose: a statement with no unit node is "no unit
 * information", which must reach `normalize.ts` and be warned about, not
 * silently dropped by the join.
 */
export const US_STATES_ELEVATION_QUERY = `
SELECT ?state ?highestPoint ?statement ?amount ?unit WHERE {
  ?state wdt:P31 wd:Q35657 .                      # instance of: U.S. state
  ?state wdt:P610 ?highestPoint .                 # highest point
  ?highestPoint p:P2044 ?statement .              # elevation above sea level
  ?statement a wikibase:BestRank ;
             psv:P2044 ?valueNode .
  ?valueNode wikibase:quantityAmount ?amount .
  OPTIONAL { ?valueNode wikibase:quantityUnit ?unit . }
}
ORDER BY ?state ?highestPoint ?statement
`.trim();

/** Wikidata unit items for the two units the pipeline knows how to read. */
export const UNIT_METRE = "Q11573";
export const UNIT_FOOT = "Q3710";
