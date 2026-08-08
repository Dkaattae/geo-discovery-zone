import {
  CURATED_US_STATES,
  curatedByName,
  entityIdFor,
  type CuratedState,
} from "./curated/us-states";
import type { WikidataStateRow } from "./sources/wikidata";
import type { Entity } from "./types";

export const BUILDER_VERSION = "0.1.0";

/** Smallest state ~4,000 km²; largest ~1,720,000 km². */
const AREA_SANITY_KM2 = { min: 2_000, max: 2_000_000 };

export interface BuildWarning {
  entity: string;
  field: string;
  message: string;
}

export interface NormalizeResult {
  entities: Entity[];
  warnings: BuildWarning[];
  /** Wikidata rows with no curated counterpart — historical or non-state items. */
  unmatched: string[];
}

export interface NormalizeOptions {
  /** Postal codes to keep. Filtering happens after ranking, not before. */
  only?: string[];
  builtAt?: string;
}

/**
 * Wikidata rows + curated overrides → entity records.
 *
 * Ranks are computed across the whole fetched set before subsetting, and
 * suppressed entirely when that set is not all 50 states — see below.
 */
export function normalizeUsStates(
  rows: WikidataStateRow[],
  options: NormalizeOptions = {},
): NormalizeResult {
  const warnings: BuildWarning[] = [];
  const unmatched: string[] = [];
  const builtAt = options.builtAt ?? new Date().toISOString();

  const matched: { row: WikidataStateRow; curated: CuratedState }[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const curated = curatedByName.get(row.name.toLowerCase());
    if (!curated) {
      unmatched.push(row.name);
      continue;
    }
    // A state can arrive twice when a grouped field has two live values — the
    // query filters the known case (historical capitals), but one duplicate row
    // would otherwise push the count off 50 and suppress every rank.
    if (seen.has(curated.postal)) {
      warnings.push({
        entity: entityIdFor(curated.postal),
        field: "*",
        message: "duplicate row from Wikidata; kept the first",
      });
      continue;
    }
    seen.add(curated.postal);
    matched.push({ row, curated });
  }

  // A rank is only meaningful against the whole field. Computing one over a
  // partial result set would make Colorado "the largest state" in a one-state
  // build, so ranks are suppressed rather than guessed.
  const rankable = matched.length === CURATED_US_STATES.length;
  const populationRank = rankable ? rankBy(matched, ({ row }) => row.population) : new Map();
  const areaRank = rankable ? rankBy(matched, ({ row }) => row.area) : new Map();
  if (!rankable) {
    warnings.push({
      entity: "*",
      field: "population_rank/area_rank",
      message: `suppressed: ${matched.length}/${CURATED_US_STATES.length} states in the result set`,
    });
  }
  const qidToPostal = new Map(
    matched.flatMap(({ row, curated }) => (row.qid ? [[row.qid, curated.postal] as const] : [])),
  );

  const keep = options.only?.map((code) => code.toUpperCase());
  const entities: Entity[] = [];

  for (const { row, curated } of matched) {
    if (keep && !keep.includes(curated.postal)) continue;
    const id = entityIdFor(curated.postal);

    if (row.fips && row.fips.padStart(2, "0") !== curated.fips) {
      // The curated table wins — it is the key the map joins on.
      warnings.push({
        entity: id,
        field: "geometry_id",
        message: `Wikidata FIPS ${row.fips} disagrees with curated ${curated.fips}; kept curated`,
      });
    }
    if (
      row.area !== undefined &&
      (row.area < AREA_SANITY_KM2.min || row.area > AREA_SANITY_KM2.max)
    ) {
      // P2046 carries a unit that `wdt:` drops, so a square-mile value looks
      // like a plausible number in the wrong currency. Flag, do not silently fix.
      warnings.push({
        entity: id,
        field: "area_km2",
        message: `area ${row.area} outside plausible km² range — check the unit on P2046`,
      });
    }
    if (!row.capital) warnings.push({ entity: id, field: "capital", message: "missing" });
    if (!row.centroid) warnings.push({ entity: id, field: "centroid", message: "missing" });

    const borders = resolveBorders(row, qidToPostal);
    if (borders.length === 0 && curated.postal !== "AK" && curated.postal !== "HI") {
      warnings.push({ entity: id, field: "borders", message: "no neighbours resolved" });
    }

    entities.push({
      id,
      type: "state",
      scope: "us",
      name: curated.name,
      ...(row.capital ? { capital: row.capital } : {}),
      geometry_id: curated.fips,
      region: curated.region,
      ...(row.centroid ? { centroid: row.centroid } : {}),
      ...(row.population !== undefined ? { population: row.population } : {}),
      population_rank: populationRank.get(curated.postal) ?? null,
      ...(row.area !== undefined ? { area_km2: row.area } : {}),
      area_rank: areaRank.get(curated.postal) ?? null,
      borders,
      ...(curated.climate_kid ? { climate_kid: curated.climate_kid } : {}),
      ...(curated.state_animal ? { state_animal: curated.state_animal } : {}),
      ...(curated.landmark ? { landmark: curated.landmark } : {}),
      ...(row.highestPoint ? { highest_point: row.highestPoint } : {}),
      ...(row.highestPointM !== undefined ? { highest_point_m: row.highestPointM } : {}),
      // Crops need USDA NASS (§1.9) and facts need human review (§1.6) — both
      // are filled by later passes, so they start empty rather than wrong.
      top_crops: [],
      fun_facts: [],
      sources: {
        ...(row.qid ? { wikidata_id: row.qid } : {}),
        ...(row.wikipediaTitle ? { wikipedia_title: row.wikipediaTitle } : {}),
        built_at: builtAt,
        builder_version: BUILDER_VERSION,
      },
    });
  }

  return { entities, warnings, unmatched };
}

/**
 * QID first, falling back to the English label.
 *
 * The label fallback exists because a neighbour is only resolvable by QID when
 * it is present in the same result set; joining on the curated name table covers
 * the rest. Anything that resolves to neither — Canadian provinces, Mexican
 * states, the Gulf of Mexico — drops out, which is the intended behaviour for a
 * US-only bank.
 */
function resolveBorders(row: WikidataStateRow, qidToPostal: Map<string, string>): string[] {
  const ids = new Set<string>();
  for (const borderQid of row.borderQids) {
    const postal = qidToPostal.get(borderQid);
    if (postal) ids.add(entityIdFor(postal));
  }
  for (const name of row.borderNames) {
    const curated = curatedByName.get(name.toLowerCase());
    if (curated) ids.add(entityIdFor(curated.postal));
  }
  return [...ids].sort();
}

/** Dense ranking, largest value first. Rows missing the value are unranked. */
function rankBy<T extends { curated: CuratedState }>(
  items: T[],
  valueOf: (item: T) => number | undefined,
): Map<string, number> {
  const ranked = items
    .flatMap((item) => {
      const value = valueOf(item);
      return value === undefined ? [] : [{ postal: item.curated.postal, value }];
    })
    .sort((a, b) => b.value - a.value);

  return new Map(ranked.map((entry, index) => [entry.postal, index + 1]));
}

export const typeErrorProbe: number = "not a number";
