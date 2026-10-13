import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { normalizeUsStates } from "./normalize";
import { US_STATES_ELEVATION_QUERY } from "./queries/us-states-elevation";
import { refreshBank } from "./refresh";
import type { SparqlResults, SparqlRow, SparqlTransport } from "./sparql";
import { parseUsStates } from "./sources/wikidata";

/**
 * T-077 (tester). Written from the brief's acceptance criteria. Every case is a
 * fresh in-memory copy of the committed recording with one binding edited; the
 * recording on disk is never touched. No network, no `fetch` mock: criteria
 * 1–7 call `parseUsStates` / `normalizeUsStates` directly, criterion 8 goes
 * through the `SparqlTransport` seam.
 */
const PKG = resolve(import.meta.dirname, "..");
const FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");
const ELEVATION_FIXTURE = join(PKG, "src/fixtures/us-states-elevation.sparql.json");
const BANK = join(PKG, "data/us-states");
const BARE = /^Q\d+$/;

function response(): SparqlResults {
  const { _fixture: _drop, ...rest } = JSON.parse(
    readFileSync(FIXTURE, "utf8"),
  ) as SparqlResults & {
    _fixture: unknown;
  };
  return rest;
}

function rowOf(res: SparqlResults, name: string): SparqlRow {
  const found = res.results.bindings.find((b) => b["stateLabel"]?.value === name);
  if (!found) throw new Error(`fixture has no row for ${name}`);
  return found;
}

/** Sets (or, with `undefined`, removes) one binding on one state's row. */
function edited(name: string, field: string, value: string | undefined): SparqlResults {
  const res = response();
  const row = rowOf(res, name);
  if (value === undefined) delete row[field];
  else row[field] = { type: "literal", value };
  return res;
}

const build = (res: SparqlResults) =>
  normalizeUsStates(parseUsStates(res), { builtAt: "2026-10-13T00:00:00Z" });

const entityById = (result: ReturnType<typeof build>, id: string) => {
  const found = result.entities.find((e) => e.id === id);
  if (!found) throw new Error(`no entity ${id}`);
  return found as unknown as Record<string, unknown>;
};

const warningsFor = (result: ReturnType<typeof build>, id: string, field: string) =>
  result.warnings.filter((w) => w.entity === id && w.field === field);

describe("T-077 criterion 1 — a bare-QID capital does not ship", () => {
  test("Alaska with capitalLabel Q29445 has no `capital` key", () => {
    const result = build(edited("Alaska", "capitalLabel", "Q29445"));
    const ak = entityById(result, "us-state-ak");
    expect(Object.hasOwn(ak, "capital")).toBe(false);
  });

  test("no entity's capital matches ^Q\\d+$ (Q1 too)", () => {
    const res = edited("Alaska", "capitalLabel", "Q29445");
    const co = rowOf(res, "Colorado");
    co["capitalLabel"] = { type: "literal", value: "Q1" };
    const result = build(res);
    for (const e of result.entities) {
      const capital = (e as unknown as Record<string, unknown>)["capital"];
      if (typeof capital === "string") expect(capital).not.toMatch(BARE);
    }
    expect(Object.hasOwn(entityById(result, "us-state-co"), "capital")).toBe(false);
    // Other states are untouched.
    expect(entityById(result, "us-state-tx")["capital"]).toBe("Austin");
  });
});

describe("T-077 criterion 2 — it warns once, naming the value", () => {
  test("exactly one capital warning for us-state-ak, message contains Q29445, not plain `missing`", () => {
    const result = build(edited("Alaska", "capitalLabel", "Q29445"));
    const ws = warningsFor(result, "us-state-ak", "capital");
    expect(ws).toHaveLength(1);
    expect(ws[0]?.message).toContain("Q29445");
    expect(ws[0]?.message).not.toBe("missing");
  });

  test("the committed recording alone gives Alaska no capital warning (baseline)", () => {
    const result = build(response());
    expect(warningsFor(result, "us-state-ak", "capital")).toHaveLength(0);
    expect(entityById(result, "us-state-ak")["capital"]).toBe("Juneau");
  });
});

describe("T-077 criterion 3 — the absent-capital warning is unchanged", () => {
  test("an absent capitalLabel gives exactly one { field: capital, message: 'missing' }", () => {
    const result = build(edited("Alaska", "capitalLabel", undefined));
    const ws = warningsFor(result, "us-state-ak", "capital");
    expect(ws).toEqual([{ entity: "us-state-ak", field: "capital", message: "missing" }]);
    expect(Object.hasOwn(entityById(result, "us-state-ak"), "capital")).toBe(false);
  });
});

describe("T-077 criteria 4–5 — a bare-QID highest point", () => {
  test("Alaska (curated Mount McKinley): curated value ships, one warning naming the QID", () => {
    const result = build(edited("Alaska", "highestPoint", "Q130018"));
    const ak = entityById(result, "us-state-ak");
    expect(ak["highest_point"]).toBe("Mount McKinley");
    const ws = warningsFor(result, "us-state-ak", "highest_point");
    expect(ws).toHaveLength(1);
    expect(ws[0]?.message).toContain("Q130018");
  });

  test("Colorado (no curated value): no highest_point key, one warning naming the QID", () => {
    const result = build(edited("Colorado", "highestPoint", "Q1208"));
    const co = entityById(result, "us-state-co");
    expect(Object.hasOwn(co, "highest_point")).toBe(false);
    const ws = warningsFor(result, "us-state-co", "highest_point");
    expect(ws).toHaveLength(1);
    expect(ws[0]?.message).toContain("Q1208");
  });

  test("no entity's highest_point matches ^Q\\d+$ when several are bare QIDs", () => {
    const res = edited("Alaska", "highestPoint", "Q130018");
    rowOf(res, "Colorado")["highestPoint"] = { type: "literal", value: "Q1208" };
    rowOf(res, "Texas")["highestPoint"] = { type: "literal", value: "Q1" };
    const result = build(res);
    for (const e of result.entities) {
      const hp = (e as unknown as Record<string, unknown>)["highest_point"];
      if (typeof hp === "string") expect(hp).not.toMatch(BARE);
    }
  });

  test("a real Wikidata name still wins over the curated value (baseline: Colorado Mount Elbert)", () => {
    const result = build(response());
    expect(entityById(result, "us-state-co")["highest_point"]).toBe("Mount Elbert");
    expect(warningsFor(result, "us-state-co", "highest_point")).toHaveLength(0);
  });
});

describe("T-077 criterion 6 — a bare-QID state name builds no entity", () => {
  test("Ohio's stateLabel as Q1397: in unmatched, no entity built from it", () => {
    const res = edited("Ohio", "stateLabel", "Q1397");
    const result = build(res);
    expect(result.unmatched).toContain("Q1397");
    expect(result.entities.find((e) => e.id === "us-state-oh")).toBeUndefined();
    expect(result.entities.find((e) => (e as { name?: string }).name === "Q1397")).toBeUndefined();
    expect(result.entities).toHaveLength(49);
  });
});

describe("T-077 criterion 7 — the boundary: non-QID strings ship as given", () => {
  for (const value of ["Juneau", "Q", "q29445", "Q29445a", " Q29445", "Q29445 ", "Quebec City"]) {
    test(`capitalLabel ${JSON.stringify(value)} ships verbatim, no capital warning`, () => {
      const result = build(edited("Alaska", "capitalLabel", value));
      expect(entityById(result, "us-state-ak")["capital"]).toBe(value);
      expect(warningsFor(result, "us-state-ak", "capital")).toHaveLength(0);
    });
  }
});

describe("T-077 criterion 8 — the refresh route catches it end to end", () => {
  let work: string;
  let bankDir: string;
  let fixturePath: string;
  let stdout: string[];

  beforeEach(() => {
    work = mkdtempSync(join(tmpdir(), "t077-tester-"));
    bankDir = join(work, "bank");
    fixturePath = join(work, "fixture.sparql.json");
    cpSync(BANK, bankDir, { recursive: true });
    cpSync(FIXTURE, fixturePath);
    stdout = [];
  });

  afterEach(() => rmSync(work, { recursive: true, force: true }));

  test('written us-state-ak.json has no capital; no bank file has "Q29445"; stdout names it', async () => {
    const main = edited("Alaska", "capitalLabel", "Q29445");
    const sparql: SparqlTransport = async (query) =>
      query === US_STATES_ELEVATION_QUERY
        ? (JSON.parse(readFileSync(ELEVATION_FIXTURE, "utf8")) as SparqlResults)
        : main;

    await refreshBank({
      bankDir,
      fixturePath,
      sparql,
      now: () => new Date("2026-10-13T12:00:00Z"),
      out: (line) => stdout.push(line),
      err: () => {},
    });

    const ak = JSON.parse(readFileSync(join(bankDir, "us-state-ak.json"), "utf8")) as Record<
      string,
      unknown
    >;
    expect(Object.hasOwn(ak, "capital")).toBe(false);
    expect(ak["name"]).toBe("Alaska");

    for (const name of readdirSync(bankDir)) {
      expect(readFileSync(join(bankDir, name), "utf8")).not.toContain('"Q29445"');
    }

    const lines = stdout.filter((l) => l.startsWith("  us-state-ak.capital: "));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.includes("Q29445"))).toBe(true);
  });
});
