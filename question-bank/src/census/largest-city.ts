/**
 * Is each state's capital its largest city, according to one named U.S.
 * Census Bureau release? The data half of T-085b.
 *
 * The release is the Census Bureau's annual city and town population totals
 * (`sub-estYYYY.csv`, "Vintage YYYY"). Everything here is pure: the CLI in
 * `fetch-largest-city.ts` downloads the file and hands the text in, and the
 * tests hand in a few rows.
 *
 * Only whole incorporated places count (summary level 162). Consolidated
 * city-counties appear there as their "balance" (Nashville-Davidson,
 * Indianapolis), which is the figure usually quoted as the city's population.
 * Hawaii has no incorporated places, so Honolulu is not in this release at all:
 * that row comes out `capital not in release` rather than a guess.
 */

/** Census summary level for an incorporated place, the whole place. */
export const PLACE_SUMLEV = "162";

export type Verdict =
  /** The capital is strictly larger than every other place in the state. */
  | "capital is largest"
  /** Another place is as large or larger. */
  | "capital is not largest"
  /** No place in the release matches the capital's name. */
  | "capital not in release";

export interface Place {
  name: string;
  population: number;
}

export interface StateRow {
  state: string;
  capital: string;
  verdict: Verdict;
  /** The release's place row matched to the capital, or null. */
  capital_place: Place | null;
  /** The largest place that is not the capital. */
  largest_other_place: Place | null;
  /** capital population minus largest other; negative when the capital is smaller. */
  margin: number | null;
}

export interface CapitalInput {
  state: string;
  capital: string;
}

/**
 * Parse CSV text into rows of fields. Handles double-quoted fields, doubled
 * quotes inside them, and CRLF line ends: enough for Census files, which quote
 * any name containing a comma.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/**
 * Every whole incorporated place in the release, grouped by state name, with
 * its population from the `POPESTIMATE<vintage>` column.
 */
export function placesByState(csv: string, vintage: number): Map<string, Place[]> {
  const [header, ...rows] = parseCsv(csv);
  if (header === undefined) throw new Error("release is empty");
  const col = (name: string): number => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`release has no ${name} column`);
    return i;
  };
  const sumlev = col("SUMLEV");
  const name = col("NAME");
  const stname = col("STNAME");
  const pop = col(`POPESTIMATE${vintage}`);

  const out = new Map<string, Place[]>();
  for (const r of rows) {
    if (r[sumlev] !== PLACE_SUMLEV) continue;
    const state = r[stname] ?? "";
    const population = Number(r[pop]);
    if (!Number.isFinite(population)) {
      throw new Error(`bad population for ${r[name]}, ${state}: ${r[pop]}`);
    }
    const list = out.get(state) ?? [];
    list.push({ name: r[name] ?? "", population });
    out.set(state, list);
  }
  return out;
}

/**
 * Does a Census place name belong to this capital? The name must start with the
 * capital and then end, or go on with a space or hyphen: "Boise City city" and
 * "Nashville-Davidson metropolitan government (balance)" match, "Jacksonville
 * city" does not match Jackson.
 */
export function placeMatchesCapital(placeName: string, capital: string): boolean {
  if (!placeName.startsWith(capital)) return false;
  const next = placeName[capital.length];
  return next === undefined || next === " " || next === "-";
}

/** One row per capital, in the order given. */
export function compareCapitals(
  capitals: readonly CapitalInput[],
  places: Map<string, Place[]>,
): StateRow[] {
  return capitals.map(({ state, capital }) => {
    const all = [...(places.get(state) ?? [])].sort((a, b) => b.population - a.population);
    const capitalPlace = all.find((p) => placeMatchesCapital(p.name, capital)) ?? null;
    const largestOther = all.find((p) => p !== capitalPlace) ?? null;
    if (capitalPlace === null) {
      return {
        state,
        capital,
        verdict: "capital not in release",
        capital_place: null,
        largest_other_place: largestOther,
        margin: null,
      };
    }
    const margin = largestOther === null ? null : capitalPlace.population - largestOther.population;
    return {
      state,
      capital,
      verdict: margin === null || margin > 0 ? "capital is largest" : "capital is not largest",
      capital_place: capitalPlace,
      largest_other_place: largestOther,
      margin,
    };
  });
}

/** The release file's URL for a vintage in the 2020s series. */
export function releaseUrl(vintage: number): string {
  return `https://www2.census.gov/programs-surveys/popest/datasets/2020-${vintage}/cities/totals/sub-est${vintage}.csv`;
}
