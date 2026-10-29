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
    #
    # mul is read as well as en (T-084): Wikidata now moves names that are
    # the same in every language onto a single mul label, and an item can be
    # left with no en label at all (Juneau, Q29445, by 2026-10). A mul
    # label is a name an editor wrote, not a translation. COALESCE makes en
    # win and binds exactly one of the two, so SAMPLE never chooses between
    # them.
    OPTIONAL {
      ?highestPointItem rdfs:label ?highestPointEn .
      FILTER(LANG(?highestPointEn) = "en")
    }
    OPTIONAL {
      ?highestPointItem rdfs:label ?highestPointMul .
      FILTER(LANG(?highestPointMul) = "mul")
    }
    BIND(COALESCE(?highestPointEn, ?highestPointMul) AS ?highestPointLabel)
    OPTIONAL { ?highestPointItem wdt:P2044 ?elevationValue . }
  }
  OPTIONAL {
    ?state wdt:P47 ?border .                      # shares border with
    # Same rule as the highest point (T-084): en, else mul, never both, so
    # a border contributes one name to ?borderNames. A border with neither is
    # still dropped whole, QID included, as it was when only en was read.
    OPTIONAL {
      ?border rdfs:label ?borderEn .
      FILTER(LANG(?borderEn) = "en")
    }
    OPTIONAL {
      ?border rdfs:label ?borderMul .
      FILTER(LANG(?borderMul) = "mul")
    }
    BIND(COALESCE(?borderEn, ?borderMul) AS ?borderLabelRaw)
    FILTER(BOUND(?borderLabelRaw))
    BIND(STRAFTER(STR(?border), "/entity/") AS ?borderQid)
  }
  OPTIONAL {
    ?articleUrl schema:about ?state ;
                schema:isPartOf <https://en.wikipedia.org/> .
  }

  # mul after en (T-084): Juneau has only a mul label, and "en" alone
  # hands back its bare QID, which normalize.ts then blanks (T-077).
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
}
GROUP BY ?state ?stateLabel ?capitalLabel
ORDER BY ?stateLabel
`.trim();
