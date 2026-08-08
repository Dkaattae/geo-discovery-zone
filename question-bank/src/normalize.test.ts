import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";
import { normalizeUsStates } from "./normalize";
import { parseUsStates, type WikidataStateRow } from "./sources/wikidata";
import type { SparqlResults } from "./sparql";

/**
 * The recorded 50-row Wikidata response. Read, never written — partial cases are
 * built by filtering the parsed rows, so the recording stays a recording
 * (`test-guidelines.md`, "Fixtures are recordings, not inventions").
 */
const FIXTURE = join(import.meta.dirname, "fixtures/us-states.sparql.json");

function allRows(): WikidataStateRow[] {
  return parseUsStates(JSON.parse(readFileSync(FIXTURE, "utf8")) as SparqlResults);
}

const rowsFor = (name: string) => allRows().filter((row) => row.name === name);

describe("criterion 2 — ranks across the full field", () => {
  test("every entity gets a population_rank and area_rank in 1-50", () => {
    const { entities } = normalizeUsStates(allRows());

    expect(entities).toHaveLength(49);
    for (const entity of entities) {
      expect(entity.population_rank).toBeGreaterThanOrEqual(1);
      expect(entity.population_rank).toBeLessThanOrEqual(50);
      expect(entity.area_rank).toBeGreaterThanOrEqual(1);
      expect(entity.area_rank).toBeLessThanOrEqual(50);
      expect(Number.isInteger(entity.population_rank)).toBe(true);
      expect(Number.isInteger(entity.area_rank)).toBe(true);
    }
  });

  test("no two entities share a rank on the same axis", () => {
    const { entities } = normalizeUsStates(allRows());

    expect(new Set(entities.map((e) => e.population_rank)).size).toBe(50);
    expect(new Set(entities.map((e) => e.area_rank)).size).toBe(50);
  });
});

describe("criterion 3 — ranks are suppressed on a partial set", () => {
  test("49 states yields null ranks for every entity", () => {
    const { entities } = normalizeUsStates(allRows().slice(0, 49));

    expect(entities).toHaveLength(49);
    for (const entity of entities) {
      expect(entity.population_rank).toBeNull();
      expect(entity.area_rank).toBeNull();
    }
  });

  test("49 states reports a warning naming the suppression and the count", () => {
    const { warnings } = normalizeUsStates(allRows().slice(0, 49));
    const suppression = warnings.find((w) => w.field.includes("rank"));

    expect(suppression).toBeDefined();
    expect(suppression?.message).toContain("49");
    expect(suppression?.message).toContain("50");
  });

  test("50 states reports no suppression warning", () => {
    const { warnings } = normalizeUsStates(allRows());

    expect(warnings.filter((w) => w.field.includes("rank"))).toHaveLength(0);
  });
});

describe("criterion 4 — ranking happens before subsetting", () => {
  test("Colorado keeps its true ranks in a one-state build", () => {
    const { entities } = normalizeUsStates(allRows(), { only: ["CO"] });

    expect(entities).toHaveLength(1);
    expect(entities[0]?.population_rank).toBe(21);
    expect(entities[0]?.area_rank).toBe(8);
  });
});

describe("criterion 5 — the curated FIPS code wins", () => {
  const withWrongFips = (rows: WikidataStateRow[]) =>
    rows.map((row) => (row.name === "Colorado" ? { ...row, fips: "99" } : row));

  test("a disagreeing Wikidata code does not reach the entity", () => {
    const { entities } = normalizeUsStates(withWrongFips(allRows()), { only: ["CO"] });

    expect(entities[0]?.geometry_id).toBe("08");
  });

  test("a disagreeing code warns, naming the entity and the field", () => {
    const { warnings } = normalizeUsStates(withWrongFips(allRows()), { only: ["CO"] });
    const mismatch = warnings.find((w) => w.field === "geometry_id");

    expect(mismatch).toBeDefined();
    expect(mismatch?.entity).toBe("us-state-co");
  });

  test("agreeing codes produce no geometry_id warning", () => {
    const { warnings } = normalizeUsStates(allRows());

    expect(warnings.filter((w) => w.field === "geometry_id")).toHaveLength(0);
  });

  test("every state's geometry_id matches the curated table", () => {
    const { entities } = normalizeUsStates(allRows());
    const curated = new Map(
      CURATED_US_STATES.map((s) => [`us-state-${s.postal.toLowerCase()}`, s]),
    );

    for (const entity of entities) {
      expect(entity.geometry_id).toBe(curated.get(entity.id)?.fips);
    }
  });
});

describe("criterion 6 — borders resolve by QID and by label to the same result", () => {
  const COLORADO = [
    "us-state-az",
    "us-state-ks",
    "us-state-ne",
    "us-state-nm",
    "us-state-ok",
    "us-state-ut",
    "us-state-wy",
  ];

  test("the QID route, with every neighbour in the result set", () => {
    const { entities } = normalizeUsStates(allRows(), { only: ["CO"] });

    expect(entities[0]?.borders).toEqual(COLORADO);
  });

  test("the label fallback, with no neighbour in the result set", () => {
    const { entities } = normalizeUsStates(rowsFor("Colorado"));

    expect(entities[0]?.borders).toEqual(COLORADO);
  });

  test("borders are entity ids, not names or QIDs", () => {
    const { entities } = normalizeUsStates(allRows());

    for (const border of entities.flatMap((e) => e.borders ?? [])) {
      expect(border).toMatch(/^us-state-[a-z]{2}$/);
    }
  });
});

describe("criterion 7 — neighbours that are not states are dropped", () => {
  test("Montana keeps its four states and drops three Canadian provinces", () => {
    const asserted = rowsFor("Montana")[0]?.borderNames ?? [];
    expect(asserted).toContain("Alberta");
    expect(asserted).toContain("Saskatchewan");
    expect(asserted).toContain("British Columbia");

    const { entities } = normalizeUsStates(allRows(), { only: ["MT"] });

    expect(entities[0]?.borders).toEqual([
      "us-state-id",
      "us-state-nd",
      "us-state-sd",
      "us-state-wy",
    ]);
  });
});
