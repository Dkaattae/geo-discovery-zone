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
 * branch `main` at `e10f94d`, pinned below (computed once with
 * `git show e10f94d:<path>`, because CI's checkout has no history to ask).
 *
 * No network: hand-built responses go through `parseUsStates` →
 * `normalizeUsStates` directly; criteria 7 and 16 go through the
 * `SparqlTransport` seam into temp directories. `fetch` is never mocked.
 */
const PKG = resolve(import.meta.dirname, "..");
const DATA_DIR = join(PKG, "data/us-states");
const SAMPLE_DIR = join(PKG, "sample-data");
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
 * The default branch (`main` at `e10f94d`), per file: its `highest_point_m`
 * line, and the SHA-256 of the file with that line removed. Computed once with
 * `git show e10f94d:question-bank/data/us-states/<name>`.
 */
const MAIN_AT_E10F94D: Record<string, { line: string | null; rest: string }> = {
  "index.json": {
    line: null,
    rest: "cd6822166faad67383db4d0506bcc1a833e142884e1792b03292795ce3e1e066",
  },
  "us-state-ak.json": {
    line: "6190",
    rest: "3e82b6dd9e303bc5264c0cf08ee77c73949569ff800b2ae5df71c7234e53f56c",
  },
  "us-state-al.json": {
    line: "735.5",
    rest: "2073ef62a053c71630ff28c3fef3a5b0068b7ac73d0c6ec4e1e823867b92d5d2",
  },
  "us-state-ar.json": {
    line: "839",
    rest: "0779455f73e7c5f262fc25f137afdac92fe155992498f897df8b5a842233c0dc",
  },
  "us-state-az.json": {
    line: "12622",
    rest: "1977b77c934df67d2eafc21edeedc6c8f1582056b8b6efd880360d5131618051",
  },
  "us-state-ca.json": {
    line: "4421",
    rest: "5a45453fa543525aa49e122c4fcb3a6ccddc6cd5fd05ff1dc30226aed9654a05",
  },
  "us-state-co.json": {
    line: "4401",
    rest: "cb7dc6e309233bdffd75226ee45ee9063be872ea2a1218627bc7a4eeed67c7a9",
  },
  "us-state-ct.json": {
    line: "748",
    rest: "41a87e764537ec113ea97a9435b7f89bfdefd2a7faf70d5935ae8c168883da9a",
  },
  "us-state-de.json": {
    line: "137",
    rest: "390cdfcaebc8cdf71ec530d925998b3e54818ce8d5936851c10f136463bed3cd",
  },
  "us-state-fl.json": {
    line: "105",
    rest: "e92b96c2e9fc2812cc761aee904f1e94d237427948651d073c1601e222dfac48",
  },
  "us-state-ga.json": {
    line: "1458",
    rest: "c535ea5d1c94b1306a8814994e1af293641d685ef49fca4b4f7474ef374dd928",
  },
  "us-state-hi.json": {
    line: "4207.3",
    rest: "2995d8c23548be1fe375333479c04ee4ed06285576b2cf4c9741542546217266",
  },
  "us-state-ia.json": {
    line: "1670",
    rest: "d42c975efb5294a0e1a812d1fd0613d26dbc8320f80982bf57a2b2aef97ca668",
  },
  "us-state-id.json": {
    line: "3857",
    rest: "b35df560f1edd62732478a064f29221e72e4dfabf23ea06f2c39a52cce17ac36",
  },
  "us-state-il.json": {
    line: "376",
    rest: "49fab827d863f0f32a659f739dc672f54aa6fe050fd2b9e28367637b29de84b6",
  },
  "us-state-in.json": {
    line: "383",
    rest: "27fe9b26c7cabd19ffc7d6cbb864e3b8a3ca2e01f98e93f50255f1491501d976",
  },
  "us-state-ks.json": {
    line: "4039",
    rest: "70f67882303c72b90285f6dfdd0cae38bb1855bb370ee282fa7eee47e27acd0c",
  },
  "us-state-ky.json": {
    line: "1263",
    rest: "be166171d1ed86e50b5203c447d709b06c7080d5f75f8a5133b9b57f7fa2ce17",
  },
  "us-state-la.json": {
    line: "163",
    rest: "7bd641ea02cd934c0c19ab2b6b339bd8de566786b3cc0054eabab2c6ff6fee39",
  },
  "us-state-ma.json": {
    line: "1064",
    rest: "01ed85cf577fa8cd395f0128a59dcdc61894fcdecba65fb74c0fd1c0bc2a8feb",
  },
  "us-state-md.json": {
    line: "1020",
    rest: "0fcc471506e3afe0164e3e23b6ca4022577e64a47b7c8e13bcffda5beb90784e",
  },
  "us-state-me.json": {
    line: "1606",
    rest: "fddfc0f3604662470b2f38b7b16fb6d524fe1fb0976e73dc826096b080ebbdcb",
  },
  "us-state-mi.json": {
    line: "603",
    rest: "a1ee6ce37905ef04ab8101eb4a2a31eb2015c4bf1cb6913bcd604bd6bcd90d8b",
  },
  "us-state-mn.json": {
    line: "701",
    rest: "9f8722d991794210f565e4a62acf9c55f59fdaabd2728678d3f080b0d3eb2933",
  },
  "us-state-mo.json": {
    line: "540",
    rest: "db9df63317b56f00acd66dd02993fdde9012e2c3ee987b83abf536a00d1b5c3f",
  },
  "us-state-ms.json": {
    line: "246",
    rest: "3cb6fd161d2925c6617c057252dea578660e1abbf88a14a3e73ade69d35c6148",
  },
  "us-state-mt.json": {
    line: "3904",
    rest: "35c44b2872306576f33925bfb4c856a8eda15429cf77003ccef186fe96915402",
  },
  "us-state-nc.json": {
    line: "2037",
    rest: "2376642dac3841d4e36f3ab7f75d7d5f43cbaf2b5686d2cbdafe2fef3ccbc1f4",
  },
  "us-state-nd.json": {
    line: "1069",
    rest: "26fdbbf43f2fdd400a1ed82440ce1261068197d2d7886fc3eecac6103038c69a",
  },
  "us-state-ne.json": {
    line: "5429",
    rest: "db5e133ce3db5c8de71b07283ac80b6a5a1393c2cf6dba1068b24944be90928b",
  },
  "us-state-nh.json": {
    line: "1917",
    rest: "89f0fdd9d36f33542cae0060d6c5a71630476163aea602867af8e703a1652265",
  },
  "us-state-nj.json": {
    line: "550",
    rest: "6cd243f0ee7c2242efcb516f99a4b9bf32741176fb7e42cd627756149095c698",
  },
  "us-state-nm.json": {
    line: "4011",
    rest: "7701b662b27e14e7dcdf38981d2d3bfc581d2a50cab1bee8f5ba34c6cae4b5d5",
  },
  "us-state-nv.json": {
    line: "4007",
    rest: "24bb3336faca4cc9e1b0f74df0766382f3d9d4be388f994745a0bfd44ed7291d",
  },
  "us-state-ny.json": {
    line: "1629",
    rest: "3ee29c6fa4365a855d7b4161d4e370d654ed001032fc2ee4d9748e0e826e1e0f",
  },
  "us-state-oh.json": {
    line: "472",
    rest: "86b849b95a800825be471dd5a82ddc480955c4d6b87eea89d7585b4f095455f5",
  },
  "us-state-ok.json": {
    line: "1737",
    rest: "bedd06d6730993b86dc54ebd1ccd2cf9f0acfd3d9fe1e70c9e16132f722d381b",
  },
  "us-state-or.json": {
    line: "11237",
    rest: "4e211829a2dd930f974a1e9601e25d323c548d0278b180c9fd8e1e5c9bea866d",
  },
  "us-state-pa.json": {
    line: "979",
    rest: "d50fc1104b24fd6ea002e67f86d465b11994a419d1e4847a251bbde882a9c5c4",
  },
  "us-state-ri.json": {
    line: "247",
    rest: "47ddfeb43ebc3455f0c67157ad7aabe8aefd2f51c6b6c4f9e91103ced3cff1ad",
  },
  "us-state-sc.json": {
    line: "1085",
    rest: "5d4fa063e3718d4bd71b3920bc8fb9825294aef536c3851c668e080611f0c8a2",
  },
  "us-state-sd.json": {
    line: "2208",
    rest: "041790bf4247b1c75dee99f90082edd0e2d9228550b2031e9cff691ae20de5da",
  },
  "us-state-tn.json": {
    line: "2025",
    rest: "bb23efe697b43e1db8f0877a89d6657031f1855c05da28d44e7e557cb3a25aa1",
  },
  "us-state-tx.json": {
    line: "2667",
    rest: "08e423ec3e9b7cea3d328e45ad89c089f23511fb5ab63364a1e1d2535f35da82",
  },
  "us-state-ut.json": {
    line: "4123",
    rest: "6dcabf23a575fa61fe0f6017bf48b27db1f47af27b84153447f6b14df0f936de",
  },
  "us-state-va.json": {
    line: "1825",
    rest: "2f248e459d283a03b39074001b7d4276cceec8cf21de1165e825dfbdc2faa566",
  },
  "us-state-vt.json": {
    line: "1339.69",
    rest: "0c74f0a89b690b9eac8a35311e34a01c044f9e3c2fc1c10e8ec0bf042c74ffce",
  },
  "us-state-wa.json": {
    line: "4389",
    rest: "7f419d25cb197218d69a66d37212ad5e54488016ec0e1841f0af825ccecce0c7",
  },
  "us-state-wi.json": {
    line: "594.8",
    rest: "f966e78103566d2918c513ce65f4149691e9f9babcca74795af9b869d1a017b9",
  },
  "us-state-wv.json": {
    line: "1482",
    rest: "81bc89203fda01a1a74b4de892237c31dfdfc5d2815b4bbc84552d0d1994f280",
  },
  "us-state-wy.json": {
    line: "4207",
    rest: "07ca7a8a0fda5ebd04ddca727d9687f4e434bd42b3eae3c00204bc4644e826e2",
  },
};

/** T-079's curated overrides: bank file → the highest_point_m it now ships. */
const T079_OVERRIDES: Record<string, string> = {
  "us-state-ct.json": "727.2",
  "us-state-ok.json": "1516.4",
  "us-state-va.json": "1740.6",
};

const ELEVATION_LINE = /^ {2}"highest_point_m": ([^,\n]+),\n/m;
const sha256 = (text: string) => new Bun.CryptoHasher("sha256").update(text).digest("hex");
const elevationLine = (raw: string) => ELEVATION_LINE.exec(raw)?.[1] ?? null;
const withoutElevationLine = (raw: string) => raw.replace(ELEVATION_LINE, "");

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

  // T-079 test change request rows 1–2 (approved): CT, OK and VA are metre-only
  // in the recording but now ship a curated override, so they move by design.
  test("every state whose recorded unit is metre (and only metre) keeps main's highest_point_m bytes, except CT, OK, VA (T-079 overrides)", () => {
    const units = recordedUnitsByPostal();
    const metreOnly = stateFiles().filter((n) => {
      const set = units.get(n);
      return set?.size === 1 && set.has(METRE);
    });
    expect(metreOnly.length).toBeGreaterThan(0);
    for (const n of Object.keys(T079_OVERRIDES)) expect(metreOnly).toContain(n);
    const moved = metreOnly
      .filter((n) => !Object.hasOwn(T079_OVERRIDES, n))
      .filter((n) => elevationLine(readState(n)) !== MAIN_AT_E10F94D[n]?.line);
    expect(moved).toEqual([]);
    // The exclusion pins the new value rather than merely skipping the file.
    for (const [n, value] of Object.entries(T079_OVERRIDES)) {
      expect(elevationLine(readState(n))).toBe(value);
    }
  });

  test("the changed set is the non-metre states AZ, IA, KS, NE, OR plus the T-079 overrides CT, OK, VA", () => {
    const units = recordedUnitsByPostal();
    const notMetre = stateFiles()
      .filter((n) => {
        const set = units.get(n);
        return !(set?.size === 1 && set.has(METRE));
      })
      .sort();
    const changed = stateFiles()
      .filter((n) => elevationLine(readState(n)) !== MAIN_AT_E10F94D[n]?.line)
      .sort();
    expect(changed.filter((n) => !Object.hasOwn(T079_OVERRIDES, n))).toEqual(notMetre);
    expect(notMetre).toEqual([
      "us-state-az.json",
      "us-state-ia.json",
      "us-state-ks.json",
      "us-state-ne.json",
      "us-state-or.json",
    ]);
    expect(changed).toEqual([
      "us-state-az.json",
      "us-state-ct.json",
      "us-state-ia.json",
      "us-state-ks.json",
      "us-state-ne.json",
      "us-state-ok.json",
      "us-state-or.json",
      "us-state-va.json",
    ]);
  });
});

describe("T-069 tester, criterion 12 — nothing else in the bank moved", () => {
  test("the bank holds exactly main's 51 files", () => {
    expect(readdirSync(DATA_DIR).sort()).toEqual(Object.keys(MAIN_AT_E10F94D).sort());
  });

  for (const name of Object.keys(MAIN_AT_E10F94D)) {
    test(`${name}: everything but the highest_point_m line digests to main's bytes`, () => {
      const raw = readState(name);
      // The line is still there (a key removed would be caught here) …
      if (MAIN_AT_E10F94D[name]?.line !== null) expect(elevationLine(raw)).not.toBeNull();
      else expect(elevationLine(raw)).toBeNull();
      // … and nothing else in the file differs, built_at included.
      expect(sha256(withoutElevationLine(raw))).toBe(MAIN_AT_E10F94D[name]?.rest as string);
    });
  }

  test("sample-data/ is byte-identical to main", () => {
    const names = readdirSync(SAMPLE_DIR).sort();
    expect(names).toEqual(Object.keys(SAMPLE_DIGESTS_AT_E10F94D).sort());
    const digests = Object.fromEntries(
      names.map((n) => [n, sha256(readFileSync(join(SAMPLE_DIR, n), "utf8"))]),
    );
    expect(digests).toEqual(SAMPLE_DIGESTS_AT_E10F94D);
  });
});

/** `git show e10f94d:question-bank/sample-data/<name> | sha256sum`. */
const SAMPLE_DIGESTS_AT_E10F94D: Record<string, string> = {
  "README.md": "92c74154dc75c172020317ad3133b92eb9eedf74f374632c1a5ed6a3c0c2708a",
  "index.json": "8e90e3ecc300d4829ef539db2af204df4885213caafd83f9983c6a7de270dee2",
  "us-state-co.json": "88db1cb06c0bb0c494327703c50cb5afefdf48cc0bc878615ef4277cb28b338f",
};

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
    // Every shipped value, and every feet value the default branch shipped.
    const values = new Set<string>();
    for (const [name, pin] of Object.entries(MAIN_AT_E10F94D)) {
      if (pin.line) values.add(pin.line);
      const now = name === "index.json" ? undefined : shipped(name);
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
