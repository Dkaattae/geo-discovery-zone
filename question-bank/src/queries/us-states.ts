/**
 * One query gets all 50 states (§1.9). Everything optional is genuinely
 * optional — Wikidata coverage is uneven and a missing `OPTIONAL` would silently
 * drop whole states from the result rather than leaving one field blank.
 *
 * Aggregates rather than raw multi-values: population is stated once per census,
 * so several truthy values can coexist and would otherwise multiply the rows.
 */
export const US_STATES_QUERY = `
SELECT
  ?state
  ?stateLabel
  ?capitalLabel
  (SAMPLE(?fipsCode) AS ?fips)
  (MAX(?populationValue) AS ?population)
  (SAMPLE(?areaValue) AS ?area)
  (SAMPLE(?coordValue) AS ?coord)
  (SAMPLE(?articleUrl) AS ?article)
  (SAMPLE(?highestPointLabel) AS ?highestPoint)
  (MAX(?elevationValue) AS ?elevation)
  (GROUP_CONCAT(DISTINCT ?borderQid; separator=",") AS ?borderQids)
  (GROUP_CONCAT(DISTINCT ?borderLabelRaw; separator="|") AS ?borderNames)
WHERE {
  ?state wdt:P31 wd:Q35657 .                      # instance of: U.S. state

  # Current capital only. Louisiana carries New Orleans alongside Baton Rouge,
  # and a truthy wdt:P36 returns both — which, with ?capitalLabel in GROUP BY,
  # splits the state into two rows. A statement with no end-time qualifier is the
  # one still in force.
  OPTIONAL {
    ?state p:P36 ?capitalStatement .
    ?capitalStatement ps:P36 ?capital .
    FILTER NOT EXISTS { ?capitalStatement pq:P582 ?capitalEndTime }
  }

  # P5087 is the NUMERIC code (08), which is what the map joins on.
  # P5086 is the alpha code (CO) — an easy and silent mix-up.
  OPTIONAL { ?state wdt:P5087 ?fipsCode . }       # FIPS 5-2 numeric code
  OPTIONAL { ?state wdt:P1082 ?populationValue . }
  OPTIONAL { ?state wdt:P2046 ?areaValue . }      # area (see unit caveat in normalize.ts)
  OPTIONAL { ?state wdt:P625 ?coordValue . }      # coordinate location
  OPTIONAL {
    ?state wdt:P610 ?highestPointItem .           # highest point
    # Labelled explicitly rather than via the label service: an auto ?xLabel is
    # only reliable for variables that appear in GROUP BY, and this one is
    # consumed inside an aggregate.
    OPTIONAL {
      ?highestPointItem rdfs:label ?highestPointLabel .
      FILTER(LANG(?highestPointLabel) = "en")
    }
    OPTIONAL { ?highestPointItem wdt:P2044 ?elevationValue . }
  }
  OPTIONAL {
    ?state wdt:P47 ?border .                      # shares border with
    ?border rdfs:label ?borderLabelRaw .
    FILTER(LANG(?borderLabelRaw) = "en")
    BIND(STRAFTER(STR(?border), "/entity/") AS ?borderQid)
  }
  OPTIONAL {
    ?articleUrl schema:about ?state ;
                schema:isPartOf <https://en.wikipedia.org/> .
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?state ?stateLabel ?capitalLabel
ORDER BY ?stateLabel
`.trim();
