import { describe, expect, test } from "bun:test";

import { CURATED_US_STATES } from "./curated/us-states";
import { normalizeUsStates, resolveElevation } from "./normalize";
import { UNIT_FOOT, UNIT_METRE } from "./queries/us-states-elevation";
import type { ElevationStatement, WikidataStateRow } from "./sources/wikidata";

/**
 * T-079 worker tests: a curated `highest_point_m` wins over Wikidata and warns
 * every time it applies (E-19); a state without one is untouched.
 *
 * Every test builds `WikidataStateRow`s by hand and calls `normalizeUsStates`
 * directly. No transport, no network, no `build.ts`.
 */

function row(name: string, extra: Partial<WikidataStateRow> = {}): WikidataStateRow {
  return { name, borderQids: [], borderNames: [], ...extra };
}

function normalizeOne(r: WikidataStateRow) {
  const result = normalizeUsStates([r], { builtAt: "2026-10-06T00:00:00.000Z" });
  expect(result.entities).toHaveLength(1);
  const entity = result.entities[0]!;
  const elevationWarnings = result.warnings
    .filter((w) => w.entity === entity.id && w.field === "highest_point_m")
    .map((w) => w.message);
  return { entity, elevationWarnings };
}

const metre = (amount: number): ElevationStatement => ({ amount, unit: UNIT_METRE });
const foot = (amount: number): ElevationStatement => ({ amount, unit: UNIT_FOOT });

describe("curated highest_point_m table", () => {
  test("exactly CT, OK and VA carry an override, with the recorded values", () => {
    const withOverride = CURATED_US_STATES.filter((s) => s.highest_point_m !== undefined);
    expect(withOverride.map((s) => [s.postal, s.highest_point_m!.metres])).toEqual([
      ["CT", 727.2],
      ["OK", 1516.4],
      ["VA", 1740.6],
    ]);
  });

  test("each override's source is data and names revision 1377209854", () => {
    for (const s of CURATED_US_STATES.filter((c) => c.highest_point_m)) {
      expect(s.highest_point_m!.source).toContain("1377209854");
    }
  });
});

describe("normalizeUsStates with a curated override (Connecticut)", () => {
  test("a differing single metre statement: ships the override, one warning naming both", () => {
    const { entity, elevationWarnings } = normalizeOne(
      row("Connecticut", { elevations: [metre(748)] }),
    );
    expect(entity.highest_point_m).toBe(727.2);
    expect(elevationWarnings).toHaveLength(1);
    expect(elevationWarnings[0]).toContain("748");
    expect(elevationWarnings[0]).toContain("727.2");
  });

  test("no elevation at all: ships the override, one warning naming it", () => {
    const { entity, elevationWarnings } = normalizeOne(row("Connecticut"));
    expect(entity.highest_point_m).toBe(727.2);
    expect(elevationWarnings).toHaveLength(1);
    expect(elevationWarnings[0]).toContain("727.2");
  });

  test.each([
    ["no unit", [{ amount: 748 }]],
    ["dimensionless Q199", [{ amount: 748, unit: "Q199" }]],
    ["kilometre", [{ amount: 0.748, unit: "Q828224" }]],
  ] as [string, ElevationStatement[]][])(
    "unreadable unit (%s): ships the override, never says 'left blank'",
    (_label, elevations) => {
      const { entity, elevationWarnings } = normalizeOne(
        row("Connecticut", { elevations, elevationUnitless: 748 }),
      );
      expect(entity.highest_point_m).toBe(727.2);
      expect(elevationWarnings.length).toBeGreaterThan(0);
      for (const message of elevationWarnings) expect(message).not.toContain("left blank");
    },
  );

  test("metre and foot statements that disagree: still one warning, override ships", () => {
    const { entity, elevationWarnings } = normalizeOne(
      row("Connecticut", { elevations: [metre(748), foot(2000)] }),
    );
    expect(entity.highest_point_m).toBe(727.2);
    expect(elevationWarnings).toHaveLength(1);
  });

  test("the P610 label still wins, and stays as Wikidata gives it (E-8)", () => {
    const { entity } = normalizeOne(
      row("Connecticut", { highestPoint: "Mount Frissell", elevations: [metre(748)] }),
    );
    expect(entity.highest_point).toBe("Mount Frissell");
  });
});

describe("normalizeUsStates without a curated override", () => {
  test.each([
    ["metre-stated", [metre(4401), foot(14440)]],
    ["foot-only", [foot(14440)]],
    ["metre and foot disagreeing", [metre(4401), foot(12000)]],
  ] as [string, ElevationStatement[]][])(
    "%s row: ships exactly resolveElevation's metres and warnings",
    (_label, elevations) => {
      const r = row("Colorado", { elevations });
      const expected = resolveElevation(r);
      expect(expected.metres).toBeDefined();
      const { entity, elevationWarnings } = normalizeOne(r);
      expect(entity.highest_point_m).toBe(expected.metres!);
      expect(elevationWarnings).toEqual(expected.warnings);
    },
  );

  test("no elevation: highest_point_m stays absent, no warning", () => {
    const { entity, elevationWarnings } = normalizeOne(row("Colorado"));
    expect("highest_point_m" in entity).toBe(false);
    expect(elevationWarnings).toEqual([]);
  });

  test("a curated highest_point label fills the gap, but never beats P610 (E-8)", () => {
    expect(normalizeOne(row("Alaska")).entity.highest_point).toBe("Mount McKinley");
    expect(normalizeOne(row("Alaska", { highestPoint: "Denali" })).entity.highest_point).toBe(
      "Denali",
    );
  });
});
