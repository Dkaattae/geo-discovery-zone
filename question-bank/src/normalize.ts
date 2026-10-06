import {
  CURATED_US_STATES,
  curatedByName,
  entityIdFor,
  type CuratedState,
} from "./curated/us-states";
import { UNIT_FOOT, UNIT_METRE } from "./queries/us-states-elevation";
import type { ElevationStatement, WikidataStateRow } from "./sources/wikidata";
import type { Entity } from "./types";

export const BUILDER_VERSION = "0.1.0";

/** Smallest state ~4,000 km²; largest ~1,720,000 km². */
const AREA_SANITY_KM2 = { min: 2_000, max: 2_000_000 };

/** International foot, exactly (1959 agreement). */
export const METRES_PER_FOOT = 0.3048;

/**
 * How far a state's metre and foot statements may disagree before the pair is
 * flagged. Wikidata's paired statements are usually one survey written twice
 * (Arizona: 3847 m / 12622 ft = 3847.2 m), so 1% is generous for rounding and
 * still catches two statements describing different points.
 */
const UNIT_DISAGREEMENT = 0.01;

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

    // Wikidata's P610 label wins when present; the curated table only fills the
    // gap it leaves (T-016) — never the other way around. Warn rather than ship
    // a silent blank when neither has one.
    const highestPoint = row.highestPoint ?? curated.highest_point;
    if (!highestPoint) warnings.push({ entity: id, field: "highest_point", message: "missing" });

    const elevation = resolveHighestPointMetres(row, curated);
    for (const message of elevation.warnings) {
      warnings.push({ entity: id, field: "highest_point_m", message });
    }

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
      ...(highestPoint ? { highest_point: highestPoint } : {}),
      ...(elevation.metres !== undefined ? { highest_point_m: elevation.metres } : {}),
      // Hand-curated plant crops (T-015; see the header comment in
      // curated/us-states.ts for provenance), folded in the same shape as
      // `fun_facts` below — the key stays present even if a future state has
      // none curated yet, rather than being spread away.
      top_crops: curated.top_crops ?? [],
      // Hand-curated farm animals and animal products (T-068), the sibling to
      // `top_crops`, folded the same way so a state with none keeps the key.
      top_livestock: curated.top_livestock ?? [],
      fun_facts: curated.fun_facts ?? [],
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

export interface ResolvedElevation {
  /** Metres, or undefined when no statement could be read as metres. */
  metres?: number;
  warnings: string[];
}

const largest = (statements: ElevationStatement[]): number =>
  Math.max(...statements.map((statement) => statement.amount));

/**
 * A state's highest-point elevation in metres, from statements whose unit is
 * stated (T-069). A guess never ships (`CLAUDE.md` "Content rules"):
 *
 * - **Metre statements present** → the largest of them, unchanged. Largest
 *   mirrors the main query's old `MAX`, so a metre-stated state ships exactly
 *   what it shipped before (Alabama carries 735.5, 735 and 733).
 * - **Otherwise foot statements** → the largest, × 0.3048, rounded to whole
 *   metres (a foot is 0.3 m, so a decimal would be false precision).
 * - **Otherwise** → blank, with a warning: a unit that is neither metre nor
 *   foot, a statement with no unit (or Wikidata's dimensionless `Q199`), or an
 *   elevation the main query saw with no elevation response to give its unit.
 * - **No elevation at all** → blank, silently, as before.
 *
 * Statements in other units next to a usable value are not used, and are
 * warned about; so are metre and foot statements that disagree by more than 1%.
 */
export function resolveElevation(row: WikidataStateRow): ResolvedElevation {
  const statements = row.elevations ?? [];
  const metre = statements.filter((statement) => statement.unit === UNIT_METRE);
  const foot = statements.filter((statement) => statement.unit === UNIT_FOOT);
  const other = statements.filter(
    (statement) => statement.unit !== UNIT_METRE && statement.unit !== UNIT_FOOT,
  );
  const warnings: string[] = [];
  const describe = (statement: ElevationStatement): string =>
    statement.unit === undefined || statement.unit === "Q199"
      ? `${statement.amount} with no unit`
      : `${statement.amount} in unit ${statement.unit}`;

  let metres: number | undefined;
  if (metre.length) {
    metres = largest(metre);
    if (foot.length) {
      const fromFeet = largest(foot) * METRES_PER_FOOT;
      if (Math.abs(fromFeet - metres) > metres * UNIT_DISAGREEMENT) {
        warnings.push(
          `metre statement ${metres} and foot statement ${largest(foot)} (${Math.round(fromFeet)} m) disagree by more than 1%; shipped the metre value — check P2044`,
        );
      }
    }
  } else if (foot.length) {
    metres = Math.round(largest(foot) * METRES_PER_FOOT);
  }

  if (metres === undefined) {
    if (other.length) {
      warnings.push(
        `elevation ${other.map(describe).join(", ")} is neither metres (${UNIT_METRE}) nor feet (${UNIT_FOOT}); left blank — check the unit on P2044`,
      );
    } else if (row.elevationUnitless !== undefined) {
      warnings.push(
        `elevation ${row.elevationUnitless} has no unit information; left blank rather than assumed to be metres`,
      );
    }
  } else if (other.length) {
    warnings.push(`ignored elevation ${other.map(describe).join(", ")}: neither metres nor feet`);
  }

  return { ...(metres !== undefined ? { metres } : {}), warnings };
}

/**
 * A state's `highest_point_m`: the elevation of the highest point inside its
 * borders (T-079, `engineering-decisions.md` E-19).
 *
 * With no curated `highest_point_m`, this is exactly `resolveElevation`. With
 * one, the curated value ships whatever Wikidata says, and replaces
 * `resolveElevation`'s warnings with exactly one of its own, naming the
 * Wikidata value (or its absence) beside the curated value and its source, so
 * an override never applies silently. Wikidata's own unit warnings are folded
 * into that one message rather than repeated: they describe a value that is not
 * shipped, and "left blank" would be false.
 */
export function resolveHighestPointMetres(
  row: WikidataStateRow,
  curated: CuratedState,
): ResolvedElevation {
  const fromWikidata = resolveElevation(row);
  const override = curated.highest_point_m;
  if (!override) return fromWikidata;

  const used = `used curated ${override.metres} (${override.source})`;
  let message: string;
  if (fromWikidata.metres === undefined) {
    const statements = row.elevations ?? [];
    message = statements.length
      ? `${used}; Wikidata's elevation could not be read as metres or feet (${statements
          .map((statement) => `${statement.amount} in unit ${statement.unit ?? "none"}`)
          .join(", ")})`
      : `${used}; Wikidata has no elevation for this state`;
  } else if (fromWikidata.metres === override.metres) {
    message = `${used}; Wikidata now agrees (${fromWikidata.metres}) — delete the override (E-19)`;
  } else {
    message = `${used} instead of Wikidata ${fromWikidata.metres}`;
  }
  return { metres: override.metres, warnings: [message] };
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
