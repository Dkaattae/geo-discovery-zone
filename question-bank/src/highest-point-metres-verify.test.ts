import { afterEach, describe, expect, test } from "bun:test";
import {
  copyFileSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { BANK_DIGESTS, bankFileDigest } from "./bank-pins";
import { runBuild } from "./build";
import { CURATED_US_STATES } from "./curated/us-states";
import { normalizeUsStates, type BuildWarning } from "./normalize";
import { rebuildOffline } from "./offline-rebuild";
import { US_STATES_QUERY } from "./queries/us-states";
import { US_STATES_ELEVATION_QUERY } from "./queries/us-states-elevation";
import { EXIT_CHANGED, refreshBank } from "./refresh";
import { parseUsStates } from "./sources/wikidata";
import type { SparqlResults, SparqlRow, SparqlTransport } from "./sparql";

/**
 * T-069 verification (tester). Written from the brief's acceptance criteria.
 * Every expected value below comes from a criterion's own wording — 1609 m,
 * 12622 ft → 3846.8–3847.8, 3852 m + 12637 ft → 3850–3853, the five ranges of
 * criterion 8, Denali's 6190 — or, for criteria 11 and 12, from the default
 * branch at `b0ee336`, pinned below and in `bank-pins.ts` (T-070 rows
 * W29–W31, `engineering-decisions.md` E-30; computed once with
 * `git show b0ee336:<path>`, because CI's checkout has no history to ask).
 *
 * No network: hand-built responses go through `parseUsStates` →
 * `normalizeUsStates` directly; criteria 7 and 16 go through the
 * `SparqlTransport` seam into temp directories. `fetch` is never mocked.
 */
const PKG = resolve(import.meta.dirname, "..");
const DATA_DIR = join(PKG, "data/us-states");
const FIXTURES = join(PKG, "src/fixtures");
const MAIN_FIXTURE = join(FIXTURES, "us-states.sparql.json");
const ELEVATION_FIXTURE = join(FIXTURES, "us-states-elevation.sparql.json");

const WD = "http://www.wikidata.org/entity/";
const METRE = "Q11573";
const FOOT = "Q3710";
const KILOMETRE = "Q828224";

const ARIZONA = "Q816";
const COLORADO = "Q1261";

// ---------------------------------------------------------------------------
// Hand-built responses
// ---------------------------------------------------------------------------

/** The real main recording, re-read per call so no test can mutate another's. */
const mainResponse = (): SparqlResults =>
  JSON.parse(readFileSync(MAIN_FIXTURE, "utf8")) as SparqlResults;

const recordedElevations = (): SparqlResults =>
  JSON.parse(readFileSync(ELEVATION_FIXTURE, "utf8")) as SparqlResults;

const stateOf = (row: SparqlRow): string | undefined => row["state"]?.value.replace(WD, "");

const decimal = (value: number) => ({
  type: "literal" as const,
  datatype: "http://www.w3.org/2001/XMLSchema#decimal",
  value: String(value),
});

/**
 * The main response with one state's unitless `wdt:P2044` read set to `value`
 * (what Wikidata's MAX would return for the statements in play), or removed
 * when `value` is undefined — so the pair of responses stays self-consistent.
 */
function mainWithElevation(state: string, value: number | undefined): SparqlResults {
  const response = mainResponse();
  response.results.bindings = response.results.bindings.map((row) => {
    if (stateOf(row) !== state) return row;
    const { elevation: _dropped, ...rest } = row;
    return value === undefined ? rest : { ...rest, elevation: decimal(value) };
  });
  return response;
}

interface Statement {
  amount: number;
  /** A unit QID, or null for a value node with no unit at all. */
  unit: string | null;
}

/** An elevation-with-unit response carrying only `state`'s statements. */
function elevationResponse(state: string, statements: Statement[]): SparqlResults {
  return {
    head: { vars: ["state", "highestPoint", "statement", "amount", "unit"] },
    results: {
      bindings: statements.map((statement, i) => {
        const row: SparqlRow = {
          state: { type: "uri", value: `${WD}${state}` },
          highestPoint: { type: "uri", value: `${WD}Q999000${state.slice(1)}` },
          statement: { type: "uri", value: `${WD}statement/test-${state}-${i}` },
          amount: decimal(statement.amount),
        };
        if (statement.unit) row["unit"] = { type: "uri", value: `${WD}${statement.unit}` };
        return row;
      }),
    },
  } as SparqlResults;
}

/** The recorded elevation response with `state`'s rows replaced. */
function recordedWith(state: string, statements: Statement[]): SparqlResults {
  const recorded = recordedElevations();
  const { _fixture: _dropped, ...rest } = recorded as SparqlResults & { _fixture?: unknown };
  return {
    ...rest,
    results: {
      bindings: [
        ...recorded.results.bindings.filter((row) => stateOf(row) !== state),
        ...elevationResponse(state, statements).results.bindings,
      ],
    },
  } as SparqlResults;
}

function pipeline(main: SparqlResults, elevation: SparqlResults, postal: string) {
  const { entities, warnings } = normalizeUsStates(parseUsStates(main, elevation), {
    builtAt: "2026-10-03T00:00:00.000Z",
  });
  const id = `us-state-${postal.toLowerCase()}`;
  const entity = entities.find((e) => e.id === id) as unknown as
    Record<string, unknown> | undefined;
  if (!entity) throw new Error(`${id} was not built`);
  const elevationWarnings = warnings.filter(
    (w: BuildWarning) => w.entity === id && w.field === "highest_point_m",
  );
  return { entity, elevationWarnings };
}

// ---------------------------------------------------------------------------
// Criteria 1–6 — unit handling
// ---------------------------------------------------------------------------

describe("T-069 tester, criterion 1 — metres pass through unchanged", () => {
  test("1609 metre ships as exactly 1609, with no highest_point_m warning", () => {
    const { entity, elevationWarnings } = pipeline(
      mainWithElevation(COLORADO, 1609),
      elevationResponse(COLORADO, [{ amount: 1609, unit: METRE }]),
      "CO",
    );
    expect(entity["highest_point_m"]).toBe(1609);
    expect(elevationWarnings).toEqual([]);
  });
});

describe("T-069 tester, criterion 2 — feet are converted", () => {
  test("12622 foot ships between 3846.8 and 3847.8 inclusive", () => {
    const { entity } = pipeline(
      mainWithElevation(ARIZONA, 12622),
      elevationResponse(ARIZONA, [{ amount: 12622, unit: FOOT }]),
      "AZ",
    );
    const value = entity["highest_point_m"] as number;
    expect(typeof value).toBe("number");
    expect(value).toBeGreaterThanOrEqual(3846.8);
    expect(value).toBeLessThanOrEqual(3847.8);
  });
});

describe("T-069 tester, criterion 3 — an unrecognised unit does not ship", () => {
  test("a kilometre (Q828224) elevation: no highest_point_m key, and a warning for the entity", () => {
    const { entity, elevationWarnings } = pipeline(
      mainWithElevation(COLORADO, 4.401),
      elevationResponse(COLORADO, [{ amount: 4.401, unit: KILOMETRE }]),
      "CO",
    );
    expect(Object.hasOwn(entity, "highest_point_m")).toBe(false);
    expect(elevationWarnings.length).toBeGreaterThanOrEqual(1);
  });
});

describe("T-069 tester, criterion 4 — a unitless elevation does not ship", () => {
  test("a value node with no unit: no highest_point_m key, and a warning for the entity", () => {
    const { entity, elevationWarnings } = pipeline(
      mainWithElevation(COLORADO, 4401),
      elevationResponse(COLORADO, [{ amount: 4401, unit: null }]),
      "CO",
    );
    expect(Object.hasOwn(entity, "highest_point_m")).toBe(false);
    expect(elevationWarnings.length).toBeGreaterThanOrEqual(1);
  });

  test("an elevation in the main response with no unit information anywhere: blank and warned", () => {
    const { entity, elevationWarnings } = pipeline(
      mainWithElevation(COLORADO, 4401),
      elevationResponse(COLORADO, []),
      "CO",
    );
    expect(Object.hasOwn(entity, "highest_point_m")).toBe(false);
    expect(elevationWarnings.length).toBeGreaterThanOrEqual(1);
  });
});

describe("T-069 tester, criterion 5 — no elevation stays blank", () => {
  test("a highest point with no elevation at all: no highest_point_m key", () => {
    const { entity } = pipeline(
      mainWithElevation(COLORADO, undefined),
      elevationResponse(COLORADO, []),
      "CO",
    );
    expect(entity["highest_point"]).toBe("Mount Elbert");
    expect(Object.hasOwn(entity, "highest_point_m")).toBe(false);
  });
});

describe("T-069 tester, criterion 6 — mixed units resolve to metres, not to the bigger number", () => {
  for (const order of ["metre first", "foot first"] as const) {
    test(`3852 metre + 12637 foot (${order}) ships between 3850 and 3853, never 12637`, () => {
      const statements: Statement[] = [
        { amount: 3852, unit: METRE },
        { amount: 12637, unit: FOOT },
      ];
      if (order === "foot first") statements.reverse();
      const { entity } = pipeline(
        mainWithElevation(ARIZONA, 12637),
        elevationResponse(ARIZONA, statements),
        "AZ",
      );
      const value = entity["highest_point_m"] as number;
      expect(value).not.toBe(12637);
      expect(value).toBeGreaterThanOrEqual(3850);
      expect(value).toBeLessThanOrEqual(3853);
    });
  }
});

// ---------------------------------------------------------------------------
// Criterion 7 — the live paths, through SparqlTransport
// ---------------------------------------------------------------------------

const temps: string[] = [];
const tempDir = (prefix: string) => {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A fake Wikidata: answers the two queries a build makes, and nothing else. */
function transport(main: SparqlResults, elevation: SparqlResults): SparqlTransport {
  return async (query) => {
    if (query === US_STATES_QUERY) return structuredClone(main);
    if (query === US_STATES_ELEVATION_QUERY) return structuredClone(elevation);
    throw new Error("unexpected query");
  };
}

const arizonaInFeet = () =>
  transport(
    mainWithElevation(ARIZONA, 12622),
    recordedWith(ARIZONA, [{ amount: 12622, unit: FOOT }]),
  );

const inCriterion2Range = (value: unknown) => {
  expect(typeof value).toBe("number");
  expect(value as number).toBeGreaterThanOrEqual(3846.8);
  expect(value as number).toBeLessThanOrEqual(3847.8);
};

describe("T-069 tester, criterion 7 — the live paths apply the same correction", () => {
  test("a live `build` (no --offline) driven through SparqlTransport writes Arizona in metres", async () => {
    const out = tempDir("t069-verify-build-");
    await runBuild(["--out", out, "--no-fun-facts", "--quiet"], {
      sparql: arizonaInFeet(),
      log: () => {},
    });
    const written = JSON.parse(readFileSync(join(out, "us-state-az.json"), "utf8"));
    inCriterion2Range(written.highest_point_m);
  });

  test("a `refresh` driven through SparqlTransport writes Arizona in metres", async () => {
    const bank = tempDir("t069-verify-refresh-bank-");
    const fixtures = tempDir("t069-verify-refresh-fx-");
    for (const name of readdirSync(DATA_DIR)) copyFileSync(join(DATA_DIR, name), join(bank, name));
    // Start from the default branch's feet value, so the refresh has to write
    // Arizona to pass — an unchanged run would leave the committed 3847 and
    // prove nothing.
    const az = join(bank, "us-state-az.json");
    writeFileSync(
      az,
      readFileSync(az, "utf8").replace(/"highest_point_m": [\d.]+/, '"highest_point_m": 12622'),
    );
    copyFileSync(MAIN_FIXTURE, join(fixtures, "us-states.sparql.json"));
    copyFileSync(ELEVATION_FIXTURE, join(fixtures, "us-states-elevation.sparql.json"));

    const code = await refreshBank({
      bankDir: bank,
      fixturePath: join(fixtures, "us-states.sparql.json"),
      sparql: arizonaInFeet(),
      now: () => new Date("2026-10-03T12:34:56.789Z"),
      out: () => {},
      err: () => {},
    });
    expect(code).toBe(EXIT_CHANGED);
    inCriterion2Range(JSON.parse(readFileSync(az, "utf8")).highest_point_m);
  });
});

// ---------------------------------------------------------------------------
// Criteria 8–13 — the committed bank
// ---------------------------------------------------------------------------

const readState = (name: string) => readFileSync(join(DATA_DIR, name), "utf8");
const stateFiles = () => readdirSync(DATA_DIR).filter((n) => /^us-state-[a-z]{2}\.json$/.test(n));
const shipped = (name: string) => JSON.parse(readState(name))["highest_point_m"] as unknown;

describe("T-069 tester, criterion 8 — the five known feet values are now metres", () => {
  const ranges: [string, number, number][] = [
    ["us-state-az.json", 3840, 3860],
    ["us-state-or.json", 3420, 3435],
    ["us-state-ne.json", 1645, 1660],
    ["us-state-ks.json", 1225, 1240],
    ["us-state-ia.json", 505, 515],
  ];
  for (const [name, low, high] of ranges) {
    test(`${name}: highest_point_m between ${low} and ${high} inclusive`, () => {
      const value = shipped(name) as number;
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThanOrEqual(low);
      expect(value).toBeLessThanOrEqual(high);
    });
  }
});

describe("T-069 tester, criteria 9–10 — Alaska untouched, nothing taller than Denali", () => {
  test("us-state-ak.json's highest_point_m is exactly 6190", () => {
    expect(shipped("us-state-ak.json")).toBe(6190);
  });

  test("there are 50 state files, and none has a highest_point_m above 6190", () => {
    const files = stateFiles();
    expect(files).toHaveLength(50);
    const over = files.filter((name) => {
      const value = shipped(name);
      return typeof value === "number" && value > 6190;
    });
    expect(over).toEqual([]);
  });
});

/**
 * The default branch at `b0ee336`, per file: its `highest_point_m` line
 * (T-070 row W29). Computed once with
 * `git show b0ee336:question-bank/data/us-states/<name>`.
 */
const LINE_AT_B0EE336: Record<string, string | null> = {
  "index.json": null,
  "us-state-ak.json": "6190",
  "us-state-al.json": "735.5",
  "us-state-ar.json": "839",
  "us-state-az.json": "3847",
  "us-state-ca.json": "4421",
  "us-state-co.json": "4401",
  "us-state-ct.json": "727.2",
  "us-state-de.json": "137",
  "us-state-fl.json": "105",
  "us-state-ga.json": "1458",
  "us-state-hi.json": "4207.3",
  "us-state-ia.json": "509",
  "us-state-id.json": "3857",
  "us-state-il.json": "376",
  "us-state-in.json": "383",
  "us-state-ks.json": "1231",
  "us-state-ky.json": "1263",
  "us-state-la.json": "163",
  "us-state-ma.json": "1064",
  "us-state-md.json": "1020",
  "us-state-me.json": "1606",
  "us-state-mi.json": "603",
  "us-state-mn.json": "701",
  "us-state-mo.json": "540",
  "us-state-ms.json": "246",
  "us-state-mt.json": "3904",
  "us-state-nc.json": "2037",
  "us-state-nd.json": "1069",
  "us-state-ne.json": "1655",
  "us-state-nh.json": "1917",
  "us-state-nj.json": "550",
  "us-state-nm.json": "4011",
  "us-state-nv.json": "4007",
  "us-state-ny.json": "1629",
  "us-state-oh.json": "472",
  "us-state-ok.json": "1516.4",
  "us-state-or.json": "3425",
  "us-state-pa.json": "979",
  "us-state-ri.json": "247",
  "us-state-sc.json": "1085",
  "us-state-sd.json": "2208",
  "us-state-tn.json": "2025",
  "us-state-tx.json": "2667",
  "us-state-ut.json": "4123",
  "us-state-va.json": "1740.6",
  "us-state-vt.json": "1339.69",
  "us-state-wa.json": "4389",
  "us-state-wi.json": "594.8",
  "us-state-wv.json": "1482",
  "us-state-wy.json": "4207",
};

/**
 * T-070 row W32: the `e10f94d` values that `LINE_AT_B0EE336` no longer holds
 * (the five feet values T-069 converted, and the three Wikidata values T-079
 * overrode). Kept as search terms so criterion 15's scan does not lose them.
 */
const E10F94D_VALUES_SINCE_MOVED = [
  "12622",
  "11237",
  "5429",
  "4039",
  "1670",
  "748",
  "1737",
  "1825",
];

const ELEVATION_LINE = /^ {2}"highest_point_m": ([^,\n]+),\n/m;
const elevationLine = (raw: string) => ELEVATION_LINE.exec(raw)?.[1] ?? null;

/** Bank file name → the set of units its recorded statements carry. */
function recordedUnitsByPostal(): Map<string, Set<string>> {
  const nameByQid = new Map<string, string>();
  for (const row of mainResponse().results.bindings) {
    const q = stateOf(row);
    if (q) nameByQid.set(q, row["stateLabel"]?.value ?? "");
  }
  // Map Wikidata state → bank file through the committed bank's own name field.
  const fileByName = new Map<string, string>();
  for (const name of stateFiles()) fileByName.set(JSON.parse(readState(name)).name, name);
  const units = new Map<string, Set<string>>();
  for (const row of recordedElevations().results.bindings) {
    const q = stateOf(row);
    const file = q ? fileByName.get(nameByQid.get(q) ?? "") : undefined;
    if (!file) continue;
    const set = units.get(file) ?? new Set<string>();
    set.add(row["unit"]?.value.replace(WD, "") ?? "(none)");
    units.set(file, set);
  }
  return units;
}

describe("T-069 tester, criterion 11 — only unit-corrected states moved", () => {
  test("the recording carries unit information for all 50 state files", () => {
    expect([...recordedUnitsByPostal().keys()].sort()).toEqual(stateFiles().sort());
  });

  test("every state whose recorded unit is metre keeps b0ee336's highest_point_m line", () => {
    // T-070 row W29: re-pinned at b0ee336, with no file excluded.
    const units = recordedUnitsByPostal();
    const metreOnly = stateFiles().filter((n) => {
      const set = units.get(n);
      return set?.size === 1 && set.has(METRE);
    });
    expect(metreOnly.length).toBeGreaterThan(0);
    const moved = metreOnly.filter((n) => elevationLine(readState(n)) !== LINE_AT_B0EE336[n]);
    expect(moved).toEqual([]);
  });

  test("no state's highest_point_m line differs from b0ee336", () => {
    // T-070 row W30.
    const units = recordedUnitsByPostal();
    const notMetre = stateFiles()
      .filter((n) => {
        const set = units.get(n);
        return !(set?.size === 1 && set.has(METRE));
      })
      .sort();
    const changed = stateFiles()
      .filter((n) => elevationLine(readState(n)) !== LINE_AT_B0EE336[n])
      .sort();
    expect(notMetre).toEqual([
      "us-state-az.json",
      "us-state-ia.json",
      "us-state-ks.json",
      "us-state-ne.json",
      "us-state-or.json",
    ]);
    expect(changed).toEqual([]);
  });
});

describe("T-069 tester, criterion 12 — nothing else in the bank moved", () => {
  test("the bank holds exactly b0ee336's 51 files", () => {
    expect(readdirSync(DATA_DIR).sort()).toEqual(Object.keys(BANK_DIGESTS).sort());
  });

  // T-070 row W31: pinned whole at b0ee336 through `bank-pins.ts`.
  for (const name of Object.keys(BANK_DIGESTS)) {
    test(`${name} digests to its b0ee336 pin, built_at aside`, () => {
      expect(bankFileDigest(name, readState(name))).toBe(BANK_DIGESTS[name] as string);
    });
  }
});

describe("T-069 tester, criterion 13 — the bank is still built, not hand-edited", () => {
  test("an offline rebuild reproduces every file in data/us-states/ byte for byte", () => {
    const names = readdirSync(DATA_DIR).sort();
    const rebuilt = rebuildOffline(join(PKG, "src/build.ts"), names, "t069-verify-rebuild-");
    const differing = names.filter((n) => rebuilt.get(n) !== readState(n));
    expect(differing).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Criteria 14–16 — where the unit comes from
// ---------------------------------------------------------------------------

describe("T-069 tester, criterion 14 — the unit is recorded, not typed", () => {
  test("the elevation recording carries a _fixture block with status, captured_at, endpoint and query", () => {
    const block = (
      JSON.parse(readFileSync(ELEVATION_FIXTURE, "utf8")) as { _fixture?: Record<string, unknown> }
    )._fixture;
    expect(block).toBeDefined();
    expect(typeof block?.["status"]).toBe("string");
    expect(block?.["endpoint"]).toBe("https://query.wikidata.org/sparql");
    expect(String(block?.["query"])).toContain("US_STATES_ELEVATION_QUERY");
    const captured = String(block?.["captured_at"]);
    expect(Number.isNaN(Date.parse(captured))).toBe(false);
  });

  test("the offline build takes its units from that recording: editing a copy of it changes the output", async () => {
    const fixtures = tempDir("t069-verify-offline-fx-");
    const out = tempDir("t069-verify-offline-out-");
    copyFileSync(MAIN_FIXTURE, join(fixtures, "us-states.sparql.json"));
    // Colorado's one recorded statement re-stated in kilometres: if the offline
    // build reads units from this file, Colorado must go blank.
    const edited = recordedWith(COLORADO, [{ amount: 4.401, unit: KILOMETRE }]);
    writeFileSync(join(fixtures, "us-states-elevation.sparql.json"), JSON.stringify(edited));
    const { entities } = await runBuild(
      ["--offline", "--fixture", join(fixtures, "us-states.sparql.json"), "--out", out, "--quiet"],
      { log: () => {} },
    );
    const co = entities.find((e) => e.id === "us-state-co") as unknown as Record<string, unknown>;
    expect(Object.hasOwn(co, "highest_point_m")).toBe(false);
    const az = entities.find((e) => e.id === "us-state-az") as unknown as Record<string, unknown>;
    expect(az["highest_point_m"]).toBe(shipped("us-state-az.json"));
  });
});

/** Strips `//` and block comments so prose examples are not mistaken for data. */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("T-069 tester, criterion 15 — no hand-written elevation", () => {
  // T-079 test change request rows 3–4 (approved): criteria 7–8 put a sourced
  // highest_point_m override on exactly CT, OK and VA.
  test("curated/us-states.ts holds highest_point_m only for CT, OK, VA, each with a source naming 1377209854, and names no unit item", () => {
    const overrides = CURATED_US_STATES.filter((s) => s.highest_point_m !== undefined);
    expect(overrides.map((s) => s.postal).sort()).toEqual(["CT", "OK", "VA"]);
    for (const s of overrides) expect(s.highest_point_m?.source).toContain("1377209854");
    const curated = readFileSync(join(PKG, "src/curated/us-states.ts"), "utf8");
    expect(curated).not.toMatch(/Q11573|Q3710/);
  });

  test("no non-test source under src/ holds a shipped highest_point_m value as code, except the three T-079 overrides in curated/us-states.ts", () => {
    // Every shipped value, and every value e10f94d shipped (T-070 row W32).
    const values = new Set<string>(E10F94D_VALUES_SINCE_MOVED);
    for (const name of stateFiles()) {
      const now = shipped(name);
      if (typeof now === "number") values.add(String(now));
    }
    const sources: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (path.endsWith(".ts") && !path.endsWith(".test.ts")) sources.push(path);
      }
    };
    walk(join(PKG, "src"));
    expect(sources.length).toBeGreaterThan(5);
    const hits: string[] = [];
    for (const path of sources) {
      const body = code(readFileSync(path, "utf8"));
      for (const value of values) {
        if (new RegExp(`(?<![\\w.])${value.replace(".", "\\.")}(?![\\w.])`).test(body)) {
          hits.push(`${path.replace(PKG, "")}: ${value}`);
        }
      }
    }
    expect(hits.sort()).toEqual(
      [
        "/src/curated/us-states.ts: 727.2",
        "/src/curated/us-states.ts: 1516.4",
        "/src/curated/us-states.ts: 1740.6",
      ].sort(),
    );
  });
});

describe("T-069 tester, criterion 16 — a refresh keeps the offline build honest", () => {
  test("after a changed refresh into a temp dir, an offline rebuild from its fixtures reproduces the refreshed bank", async () => {
    const bank = tempDir("t069-verify-c16-bank-");
    const fixtures = tempDir("t069-verify-c16-fx-");
    const out = tempDir("t069-verify-c16-out-");
    for (const name of readdirSync(DATA_DIR)) copyFileSync(join(DATA_DIR, name), join(bank, name));
    copyFileSync(MAIN_FIXTURE, join(fixtures, "us-states.sparql.json"));
    copyFileSync(ELEVATION_FIXTURE, join(fixtures, "us-states-elevation.sparql.json"));

    // A live response in which Colorado's highest point is now stated in feet
    // (14440 ft ≈ 4401 m would round back; 15000 ft = 4572 m moves the value).
    const code = await refreshBank({
      bankDir: bank,
      fixturePath: join(fixtures, "us-states.sparql.json"),
      sparql: transport(
        mainWithElevation(COLORADO, 15000),
        recordedWith(COLORADO, [{ amount: 15000, unit: FOOT }]),
      ),
      now: () => new Date("2026-10-03T12:34:56.789Z"),
      out: () => {},
      err: () => {},
    });
    expect(code).toBe(EXIT_CHANGED);
    const refreshedCo = JSON.parse(readFileSync(join(bank, "us-state-co.json"), "utf8"));
    expect(refreshedCo.highest_point_m).not.toBe(4401);

    await runBuild(
      ["--offline", "--fixture", join(fixtures, "us-states.sparql.json"), "--out", out, "--quiet"],
      { log: () => {} },
    );
    const names = readdirSync(bank)
      .filter((n) => n.endsWith(".json"))
      .sort();
    expect(
      readdirSync(out)
        .filter((n) => n.endsWith(".json"))
        .sort(),
    ).toEqual(names);
    const differing = names.filter(
      (n) => readFileSync(join(out, n), "utf8") !== readFileSync(join(bank, n), "utf8"),
    );
    expect(differing).toEqual([]);
  });
});
