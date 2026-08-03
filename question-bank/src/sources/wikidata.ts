import { US_STATES_QUERY } from "../queries/us-states";
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
  highestPointM?: number | undefined;
  borderQids: string[];
  borderNames: string[];
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

export function parseUsStates(results: SparqlResults): WikidataStateRow[] {
  return results.results.bindings.flatMap((row) => {
    const name = text(row["stateLabel"]);
    // A row without a label is a Wikidata data issue, not something to guess at.
    if (!name) return [];

    return [
      {
        qid: qid(row["state"]),
        name,
        capital: text(row["capitalLabel"]),
        fips: text(row["fips"]),
        population: num(row["population"]),
        area: num(row["area"]),
        centroid: point(row["coord"]),
        wikipediaTitle: wikipediaTitleFrom(text(row["article"])),
        highestPoint: text(row["highestPoint"]),
        highestPointM: num(row["elevation"]),
        borderQids: splitList(text(row["borderQids"]), ","),
        borderNames: splitList(text(row["borderNames"]), "|"),
      },
    ];
  });
}

/**
 * Fetches all 50 states in one request.
 *
 * Deliberately not parameterised by state: the whole set costs one query, and
 * population/area ranks (§1.4, §1.8) are only meaningful when every state is
 * present. Subsetting happens after the fetch.
 */
export async function fetchUsStates(query: SparqlTransport): Promise<WikidataStateRow[]> {
  return parseUsStates(await query(US_STATES_QUERY));
}
