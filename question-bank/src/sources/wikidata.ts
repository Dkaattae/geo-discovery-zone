import { US_STATES_QUERY } from "../queries/us-states";
import { US_STATES_ELEVATION_QUERY } from "../queries/us-states-elevation";
import { num, point, qid, text, type SparqlResults, type SparqlTransport } from "../sparql";

/** One state as Wikidata returned it, before any curation or ranking. */
export interface WikidataStateRow {
  qid?: string | undefined;
  name: string;
  capital?: string | undefined;
  fips?: string | undefined;
  population?: number | undefined;
  area?: number | undefined;
  centroid?: [number, number] | undefined;
  wikipediaTitle?: string | undefined;
  highestPoint?: string | undefined;
  /**
   * P2044 as the main query's truthy `wdt:` read returns it: an amount with its
   * unit dropped. Never shipped as is — it only tells `normalize.ts` that an
   * elevation exists, so a state whose unit is unknown is warned about rather
   * than silently blank (T-069).
   */
  elevationUnitless?: number | undefined;
  /**
   * Best-rank P2044 statements with their units, from the elevation query.
   * Absent when no elevation response was given — which `normalize.ts` treats
   * as "no unit information", never as metres.
   */
  elevations?: ElevationStatement[] | undefined;
  borderQids: string[];
  borderNames: string[];
}

/** One P2044 statement on a state's highest point, as Wikidata states it. */
export interface ElevationStatement {
  amount: number;
  /** The unit item's QID (`Q11573` metre, `Q3710` foot), or the raw unit IRI if it is not a QID. */
  unit?: string | undefined;
}

const splitList = (value: string | undefined, separator: string): string[] =>
  value
    ? value
        .split(separator)
        .map((part) => part.trim())
        .filter(Boolean)
    : [];

/**
 * `https://en.wikipedia.org/wiki/Colorado` → `Colorado`.
 * Kept as the title rather than the URL because the REST summary endpoint
 * (§1.6) is addressed by title.
 */
function wikipediaTitleFrom(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const last = url.split("/").pop();
  return last ? decodeURIComponent(last) : undefined;
}

/**
 * The elevation query's rows, grouped by state QID. A row with no parseable
 * amount carries nothing usable and is dropped; a row with no unit is kept
 * with `unit` undefined, so the missing unit reaches `normalize.ts`.
 */
export function parseElevations(results: SparqlResults): Map<string, ElevationStatement[]> {
  const byState = new Map<string, ElevationStatement[]>();
  for (const row of results.results.bindings) {
    const state = qid(row["state"]);
    const amount = num(row["amount"]);
    if (!state || amount === undefined) continue;
    const unitBinding = row["unit"];
    const unit = unitBinding ? (qid(unitBinding) ?? unitBinding.value) : undefined;
    const list = byState.get(state) ?? [];
    list.push({ amount, unit });
    byState.set(state, list);
  }
  return byState;
}

/**
 * The main response → one row per state. Pass the elevation response too to
 * attach each state's elevation statements with their units; without it, every
 * row's `elevations` is absent and no `highest_point_m` can ship.
 */
export function parseUsStates(
  results: SparqlResults,
  elevationResults?: SparqlResults,
): WikidataStateRow[] {
  const elevations = elevationResults ? parseElevations(elevationResults) : undefined;
  return results.results.bindings.flatMap((row) => {
    const name = text(row["stateLabel"]);
    // A row without a label is a Wikidata data issue, not something to guess at.
    if (!name) return [];

    const stateQid = qid(row["state"]);
    return [
      {
        qid: stateQid,
        name,
        capital: text(row["capitalLabel"]),
        fips: text(row["fips"]),
        population: num(row["population"]),
        area: num(row["area"]),
        centroid: point(row["coord"]),
        wikipediaTitle: wikipediaTitleFrom(text(row["article"])),
        highestPoint: text(row["highestPoint"]),
        elevationUnitless: num(row["elevation"]),
        ...(elevations ? { elevations: (stateQid && elevations.get(stateQid)) || [] } : {}),
        borderQids: splitList(text(row["borderQids"]), ","),
        borderNames: splitList(text(row["borderNames"]), "|"),
      },
    ];
  });
}

/**
 * Fetches all 50 states: the main query, then the elevation-with-unit query
 * (T-069), both through the same transport so an offline replay and a test
 * fake see exactly the two calls a live run makes.
 *
 * Deliberately not parameterised by state: the whole set costs two queries, and
 * population/area ranks (§1.4, §1.8) are only meaningful when every state is
 * present. Subsetting happens after the fetch.
 */
export async function fetchUsStates(query: SparqlTransport): Promise<WikidataStateRow[]> {
  const main = await query(US_STATES_QUERY);
  const elevation = await query(US_STATES_ELEVATION_QUERY);
  return parseUsStates(main, elevation);
}
