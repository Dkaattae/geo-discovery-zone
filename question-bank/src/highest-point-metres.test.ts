import { afterEach, describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runBuild } from "./build";
import { CURATED_US_STATES } from "./curated/us-states";
import { ELEVATION_FIXTURE_NAME, fixtureTransport } from "./fixture-transport";
import { normalizeUsStates, resolveElevation } from "./normalize";
import { US_STATES_QUERY } from "./queries/us-states";
import { US_STATES_ELEVATION_QUERY } from "./queries/us-states-elevation";
import { refreshBank } from "./refresh";
import { parseUsStates } from "./sources/wikidata";
import type { SparqlResults, SparqlRow, SparqlTransport } from "./sparql";
import type { Entity } from "./types";

/**
 * T-069 worker tests: `highest_point_m` is metres derived from the unit
 * Wikidata states, never a unitless number passed through.
 *
 * Criteria 1–6 go straight through `parseUsStates` → `normalizeUsStates` with
 * hand-built responses. Criteria 7 and 16 drive `runBuild` and `refreshBank`
 * through the `SparqlTransport` seam into temp dirs. Nothing here reaches the
 * network: every transport is a local function, and the offline build reads
 * only fixture files.
 */

const PKG = join(import.meta.dirname, "..");
const MAIN_FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");
const ELEVATION_FIXTURE = join(PKG, "src/fixtures", ELEVATION_FIXTURE_NAME);
const BANK = join(PKG, "data/us-states");

const ENTITY = "http://www.wikidata.org/entity/";
const METRE = `${ENTITY}Q11573`;
const FOOT = `${ENTITY}Q3710`;
const KILOMETRE = `${ENTITY}Q828224`;
const ARIZONA = "Q816";
const AZ_ID = "us-state-az";

const readJson = (path: string) =>
  JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;

/** A recorded response without its `_fixture` block, as a fresh copy. */
function recorded(path: string): SparqlResults {
  const { _fixture: _drop, ...rest } = readJson(path);
  return rest as unknown as SparqlResults;
}

/** One Arizona row in the main query's shape, optionally with a unitless elevation. */
function mainResponse(elevation?: string): SparqlResults {
  const row: SparqlRow = {
    state: { type: "uri", value: `${ENTITY}${ARIZONA}` },
    stateLabel: { type: "literal", value: "Arizona" },
    highestPoint: { type: "literal", value: "Humphreys Peak" },
  };
  if (elevation !== undefined) row["elevation"] = { type: "literal", value: elevation };
  return { head: { vars: [] }, results: { bindings: [row] } };
}

/** Arizona's elevation statements in the elevation query's shape. */
function elevationResponse(...statements: [amount: string, unit?: string][]): SparqlResults {
  return {
    head: { vars: [] },
    results: {
      bindings: statements.map(([amount, unit]) => ({
        state: { type: "uri", value: `${ENTITY}${ARIZONA}` },
        highestPoint: { type: "uri", value: `${ENTITY}Q1239004` },
        amount: { type: "literal", value: amount },
        ...(unit ? { unit: { type: "uri", value: unit } } : {}),
      })),
    },
  };
}

function arizona(main: SparqlResults, elevation?: SparqlResults) {
  const { entities, warnings } = normalizeUsStates(parseUsStates(main, elevation), {
    builtAt: "2026-01-01T00:00:00.000Z",
  });
  const entity = entities.find((e) => e.id === AZ_ID);
  if (!entity) throw new Error("Arizona did not build");
  return {
    entity,
    elevationWarnings: warnings.filter((w) => w.entity === AZ_ID && w.field === "highest_point_m"),
  };
}

describe("criteria 1–6: the unit decides, a guess never ships", () => {
  test("1: a metre value passes through unchanged, with no warning", () => {
    const { entity, elevationWarnings } = arizona(
      mainResponse("1609"),
      elevationResponse(["1609", METRE]),
    );
    expect(entity.highest_point_m).toBe(1609);
    expect(elevationWarnings).toEqual([]);
  });

  test("2: a foot value is converted to metres", () => {
    const { entity, elevationWarnings } = arizona(
      mainResponse("12622"),
      elevationResponse(["12622", FOOT]),
    );
    expect(entity.highest_point_m).toBeGreaterThanOrEqual(3846.8);
    expect(entity.highest_point_m).toBeLessThanOrEqual(3847.8);
    expect(elevationWarnings).toEqual([]);
  });

  test("3: a unit that is neither metre nor foot leaves the key absent and warns", () => {
    const { entity, elevationWarnings } = arizona(
      mainResponse("3.847"),
      elevationResponse(["3.847", KILOMETRE]),
    );
    expect("highest_point_m" in entity).toBe(false);
    expect(elevationWarnings).toHaveLength(1);
    expect(elevationWarnings[0]?.message).toContain("Q828224");
  });

  test("4: a statement with no unit leaves the key absent and warns", () => {
    const { entity, elevationWarnings } = arizona(
      mainResponse("3847"),
      elevationResponse(["3847"]),
    );
    expect("highest_point_m" in entity).toBe(false);
    expect(elevationWarnings).toHaveLength(1);
  });

  test("4: Wikidata's dimensionless unit (Q199) counts as no unit", () => {
    const { entity, elevationWarnings } = arizona(
      mainResponse("3847"),
      elevationResponse(["3847", `${ENTITY}Q199`]),
    );
    expect("highest_point_m" in entity).toBe(false);
    expect(elevationWarnings).toHaveLength(1);
  });

  test("4: an elevation from the main query with no elevation response at all is not shipped", () => {
    const { entity, elevationWarnings } = arizona(mainResponse("12622"));
    expect("highest_point_m" in entity).toBe(false);
    expect(elevationWarnings).toHaveLength(1);
    expect(elevationWarnings[0]?.message).toContain("no unit information");
  });

  test("4: …nor when the elevation response has no row for that state", () => {
    const { entity, elevationWarnings } = arizona(mainResponse("12622"), elevationResponse());
    expect("highest_point_m" in entity).toBe(false);
    expect(elevationWarnings).toHaveLength(1);
  });

  test("5: no elevation at all stays blank", () => {
    const { entity } = arizona(mainResponse(), elevationResponse());
    expect("highest_point_m" in entity).toBe(false);
  });

  test("6: a metre and a foot statement on one item resolve to the metre value, not the larger number", () => {
    const { entity, elevationWarnings } = arizona(
      mainResponse("12637"),
      elevationResponse(["3852", METRE], ["12637", FOOT]),
    );
    expect(entity.highest_point_m).toBeGreaterThanOrEqual(3850);
    expect(entity.highest_point_m).toBeLessThanOrEqual(3853);
    expect(entity.highest_point_m).not.toBe(12637);
    expect(elevationWarnings).toEqual([]);
  });
});

describe("resolveElevation: the edges of the choice", () => {
  test("several metre statements keep the largest, as the old MAX did (Alabama: 735.5, 735, 733)", () => {
    expect(
      resolveElevation({
        name: "Alabama",
        borderQids: [],
        borderNames: [],
        elevations: [
          { amount: 735, unit: "Q11573" },
          { amount: 735.5, unit: "Q11573" },
          { amount: 733, unit: "Q11573" },
        ],
      }),
    ).toEqual({ metres: 735.5, warnings: [] });
  });

  test("metre and foot statements that disagree by more than 1% ship the metre value and warn", () => {
    const resolved = resolveElevation({
      name: "Arizona",
      borderQids: [],
      borderNames: [],
      elevations: [
        { amount: 3000, unit: "Q11573" },
        { amount: 12622, unit: "Q3710" },
      ],
    });
    expect(resolved.metres).toBe(3000);
    expect(resolved.warnings).toHaveLength(1);
    expect(resolved.warnings[0]).toContain("disagree");
  });

  test("an unknown unit beside a metre value is ignored, and said so", () => {
    const resolved = resolveElevation({
      name: "Arizona",
      borderQids: [],
      borderNames: [],
      elevations: [
        { amount: 3847, unit: "Q11573" },
        { amount: 3.847, unit: "Q828224" },
      ],
    });
    expect(resolved.metres).toBe(3847);
    expect(resolved.warnings).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// The live paths, through the SparqlTransport seam
// ---------------------------------------------------------------------------

/** The committed elevation recording with Arizona's statements replaced by one foot value. */
function elevationWithArizonaInFeet(feet: string): SparqlResults {
  const response = recorded(ELEVATION_FIXTURE);
  const others = response.results.bindings.filter(
    (row) => row["state"]?.value !== `${ENTITY}${ARIZONA}`,
  );
  response.results.bindings = [...others, ...elevationResponse([feet, FOOT]).results.bindings];
  return response;
}

/** Answers each of the two queries from its own response; anything else is a test bug. */
function liveTransport(main: SparqlResults, elevation: SparqlResults): SparqlTransport {
  return async (query) => {
    if (query === US_STATES_QUERY) return structuredClone(main);
    if (query === US_STATES_ELEVATION_QUERY) return structuredClone(elevation);
    throw new Error("unexpected query");
  };
}

const temps: string[] = [];
const tempDir = (prefix: string) => {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const readEntity = (dir: string, id: string) =>
  JSON.parse(readFileSync(join(dir, `${id}.json`), "utf8")) as Entity;

describe("criterion 7: the live build and refresh paths convert feet too", () => {
  test("a live `build` run with Arizona stated in feet writes metres", async () => {
    const out = tempDir("t069-build-");
    await runBuild(["--out", out, "--no-fun-facts", "--quiet"], {
      sparql: liveTransport(recorded(MAIN_FIXTURE), elevationWithArizonaInFeet("12622")),
      log: () => {},
    });
    const metres = readEntity(out, AZ_ID).highest_point_m;
    expect(metres).toBeGreaterThanOrEqual(3846.8);
    expect(metres).toBeLessThanOrEqual(3847.8);
  });

  test("a `refresh` with Arizona stated in feet writes metres", async () => {
    const dir = tempDir("t069-refresh-");
    const bank = join(dir, "bank");
    cpSync(BANK, bank, { recursive: true });
    const code = await refreshBank({
      bankDir: bank,
      fixturePath: join(dir, "fx", "us-states.sparql.json"),
      sparql: liveTransport(recorded(MAIN_FIXTURE), elevationWithArizonaInFeet("12000")),
      now: () => new Date("2026-10-01T00:00:00Z"),
      out: () => {},
      err: () => {},
    });
    expect(code).toBe(0);
    // 12000 ft = 3657.6 m — distinct from the committed 3847, so this value can
    // only have come from converting the response, not from the old file.
    expect(readEntity(bank, AZ_ID).highest_point_m).toBe(3658);
  });
});

describe("criterion 16: a refresh re-records what the offline build reads", () => {
  test("an offline rebuild right after a changed refresh reproduces the refreshed bank", async () => {
    const dir = tempDir("t069-roundtrip-");
    const bank = join(dir, "bank");
    const fx = join(dir, "fx");
    cpSync(BANK, bank, { recursive: true });
    // Start from the committed pair, so a refresh that forgot to re-record the
    // elevation file would leave a stale-but-readable one behind.
    cpSync(MAIN_FIXTURE, join(fx, "us-states.sparql.json"));
    cpSync(ELEVATION_FIXTURE, join(fx, ELEVATION_FIXTURE_NAME));

    const code = await refreshBank({
      bankDir: bank,
      fixturePath: join(fx, "us-states.sparql.json"),
      sparql: liveTransport(recorded(MAIN_FIXTURE), elevationWithArizonaInFeet("12000")),
      now: () => new Date("2026-10-01T00:00:00Z"),
      out: () => {},
      err: () => {},
    });
    expect(code).toBe(0);

    const elevationBlock = readJson(join(fx, ELEVATION_FIXTURE_NAME))["_fixture"] as Record<
      string,
      unknown
    >;
    expect(elevationBlock["captured_at"]).toBe("2026-10-01T00:00:00Z");

    const out = join(dir, "rebuilt");
    await runBuild(
      ["--offline", "--fixture", join(fx, "us-states.sparql.json"), "--out", out, "--quiet"],
      { log: () => {} },
    );
    for (const name of readdirSync(bank).filter((n) => n.endsWith(".json"))) {
      expect({ name, bytes: readFileSync(join(out, name), "utf8") }).toEqual({
        name,
        bytes: readFileSync(join(bank, name), "utf8"),
      });
    }
    expect(readEntity(out, AZ_ID).highest_point_m).toBe(3658);
  });

  test("a refresh into a directory with no elevation recording writes one with its provenance keys", async () => {
    const dir = tempDir("t069-fresh-");
    const fx = join(dir, "fx");
    const code = await refreshBank({
      bankDir: join(dir, "bank"),
      fixturePath: join(fx, "us-states.sparql.json"),
      sparql: liveTransport(recorded(MAIN_FIXTURE), recorded(ELEVATION_FIXTURE)),
      now: () => new Date("2026-10-01T00:00:00Z"),
      out: () => {},
      err: () => {},
    });
    expect(code).toBe(0);
    const block = readJson(join(fx, ELEVATION_FIXTURE_NAME))["_fixture"] as Record<string, unknown>;
    expect(Object.keys(block)).toEqual(
      expect.arrayContaining(["status", "captured_at", "endpoint", "query"]),
    );
  });

  test("a failed elevation query fails the refresh and writes nothing", async () => {
    const dir = tempDir("t069-fail-");
    const bank = join(dir, "bank");
    cpSync(BANK, bank, { recursive: true });
    const before = readdirSync(bank).map((n) => readFileSync(join(bank, n), "utf8"));
    const code = await refreshBank({
      bankDir: bank,
      fixturePath: join(dir, "fx", "us-states.sparql.json"),
      sparql: async (query) => {
        if (query === US_STATES_QUERY) return recorded(MAIN_FIXTURE);
        throw new Error("elevation query timed out");
      },
      out: () => {},
      err: () => {},
    });
    expect(code).toBe(1);
    expect(readdirSync(bank).map((n) => readFileSync(join(bank, n), "utf8"))).toEqual(before);
    expect(() => readdirSync(join(dir, "fx"))).toThrow();
  });
});

// ---------------------------------------------------------------------------
// The offline transport and the recording
// ---------------------------------------------------------------------------

describe("the offline replay", () => {
  test("answers the elevation query from the recording beside the main fixture", async () => {
    const transport = fixtureTransport(MAIN_FIXTURE, {});
    const response = await transport(US_STATES_ELEVATION_QUERY);
    expect(response.head.vars).toEqual(["state", "highestPoint", "statement", "amount", "unit"]);
  });

  test("refuses a query it has no recording for", async () => {
    await expect(fixtureTransport(MAIN_FIXTURE, {})("SELECT * WHERE {}")).rejects.toThrow();
  });

  test("built_at still comes from the main fixture, not the elevation recording", async () => {
    const capture: { capturedAt?: string } = {};
    const transport = fixtureTransport(MAIN_FIXTURE, capture);
    await transport(US_STATES_QUERY);
    await transport(US_STATES_ELEVATION_QUERY);
    expect(capture.capturedAt).toBe(
      (readJson(MAIN_FIXTURE)["_fixture"] as { captured_at: string }).captured_at,
    );
  });
});

describe("criterion 14: the elevation recording says where it came from", () => {
  const block = readJson(ELEVATION_FIXTURE)["_fixture"] as Record<string, unknown>;

  test("carries status, captured_at, endpoint and query", () => {
    expect(block["status"]).toContain("RECORDED");
    expect(Number.isNaN(Date.parse(String(block["captured_at"])))).toBe(false);
    expect(block["endpoint"]).toBe("https://query.wikidata.org/sparql");
    expect(block["query"]).toContain("US_STATES_ELEVATION_QUERY");
  });

  test("covers every curated state, each with a metre or foot statement", () => {
    const byState = parseUsStates(recorded(MAIN_FIXTURE), recorded(ELEVATION_FIXTURE));
    const covered = byState.filter((row) =>
      row.elevations?.some((s) => s.unit === "Q11573" || s.unit === "Q3710"),
    );
    expect(covered).toHaveLength(CURATED_US_STATES.length);
  });

  // T-079 test change request row 5 (approved): each curated override warns once.
  test("the full offline build's only highest_point_m warnings are the three T-079 overrides", () => {
    const { warnings } = normalizeUsStates(
      parseUsStates(recorded(MAIN_FIXTURE), recorded(ELEVATION_FIXTURE)),
    );
    const elevation = warnings.filter((w) => w.field === "highest_point_m");
    expect(elevation.map((w) => w.entity).sort()).toEqual([
      "us-state-ct",
      "us-state-ok",
      "us-state-va",
    ]);
    const expected: Record<string, [string, string]> = {
      "us-state-ct": ["727.2", "748"],
      "us-state-ok": ["1516.4", "1737"],
      "us-state-va": ["1740.6", "1825"],
    };
    for (const w of elevation) {
      const [curated, wikidata] = expected[w.entity] as [string, string];
      expect(w.message).toContain(curated);
      expect(w.message).toContain(wikidata);
    }
  });
});
