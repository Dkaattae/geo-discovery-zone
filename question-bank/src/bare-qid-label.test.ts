import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { isBareQid, normalizeUsStates } from "./normalize";
import { US_STATES_ELEVATION_QUERY } from "./queries/us-states-elevation";
import { refreshBank } from "./refresh";
import { parseUsStates } from "./sources/wikidata";
import type { SparqlResults, SparqlRow, SparqlTransport } from "./sparql";

/**
 * T-077 (worker). WDQS's label service returns the bare QID when an item has
 * no English label; such a value must be treated as missing and warned about.
 * Every case edits a fresh copy of the committed recording in memory — the
 * recording itself is never written. No network, no `fetch` mock.
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

function row(results: SparqlResults, name: string): SparqlRow {
  const found = results.results.bindings.find((b) => b["stateLabel"]?.value === name);
  if (!found) throw new Error(`no row for ${name}`);
  return found;
}

const literal = (value: string) => ({ type: "literal" as const, "xml:lang": "en", value });

function withLabel(name: string, key: string, value: string | undefined): SparqlResults {
  const results = response();
  const target = row(results, name);
  if (value === undefined) delete target[key];
  else target[key] = literal(value);
  return results;
}

const build = (results: SparqlResults) => normalizeUsStates(parseUsStates(results));
const entity = (result: ReturnType<typeof build>, id: string) => {
  const found = result.entities.find((e) => e.id === id);
  if (!found) throw new Error(`no entity ${id}`);
  return found;
};
const warningsFor = (result: ReturnType<typeof build>, id: string, field: string) =>
  result.warnings.filter((w) => w.entity === id && w.field === field);

describe("the bare-QID definition", () => {
  test.each(["Q29445", "Q1"])("%p is a bare QID", (value) => {
    expect(isBareQid(value)).toBe(true);
  });
  test.each(["Juneau", "Q", "q29445", "Q29445a", " Q29445", "Quebec City", "Q29445 "])(
    "%p is not",
    (value) => {
      expect(isBareQid(value)).toBe(false);
    },
  );
});

describe("criteria 1–2 — a bare-QID capital", () => {
  test("ships no capital, and warns once naming the QID", () => {
    const result = build(withLabel("Alaska", "capitalLabel", "Q29445"));
    const alaska = entity(result, "us-state-ak");

    expect("capital" in alaska).toBe(false);
    for (const e of result.entities) {
      if (e.capital !== undefined) expect(e.capital).not.toMatch(BARE);
    }
    const warnings = warningsFor(result, "us-state-ak", "capital");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain("Q29445");
    expect(warnings[0]?.message).not.toBe("missing");
  });
});

describe("criterion 3 — an absent capital still warns `missing`", () => {
  test("exactly one warning, message byte-for-byte", () => {
    const result = build(withLabel("Alaska", "capitalLabel", undefined));
    expect("capital" in entity(result, "us-state-ak")).toBe(false);
    expect(warningsFor(result, "us-state-ak", "capital")).toEqual([
      { entity: "us-state-ak", field: "capital", message: "missing" },
    ]);
  });
});

describe("criteria 4–5 — a bare-QID highest point", () => {
  test("with a curated fallback (Alaska): the curated value ships, one warning names the QID", () => {
    const result = build(withLabel("Alaska", "highestPoint", "Q130736"));
    expect(entity(result, "us-state-ak").highest_point).toBe("Mount McKinley");
    const warnings = warningsFor(result, "us-state-ak", "highest_point");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain("Q130736");
  });

  test("with no curated fallback (Colorado): no highest_point key, one warning names the QID", () => {
    const result = build(withLabel("Colorado", "highestPoint", "Q1139052"));
    expect("highest_point" in entity(result, "us-state-co")).toBe(false);
    const warnings = warningsFor(result, "us-state-co", "highest_point");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain("Q1139052");
    for (const e of result.entities) {
      if (e.highest_point !== undefined) expect(e.highest_point).not.toMatch(BARE);
    }
  });
});

describe("criterion 6 — a bare-QID state name builds no entity", () => {
  test("the row is unmatched and Alaska is not built", () => {
    const result = build(withLabel("Alaska", "stateLabel", "Q797"));
    expect(result.unmatched).toContain("Q797");
    expect(result.entities.find((e) => e.id === "us-state-ak")).toBeUndefined();
    expect(result.entities.some((e) => e.name === "Q797")).toBe(false);
  });
});

describe("criterion 7 — the boundary", () => {
  test.each(["Juneau", "Q", "q29445", "Q29445a", "Quebec City"])(
    "capitalLabel %p ships as given, with no capital warning",
    (value) => {
      const result = build(withLabel("Alaska", "capitalLabel", value));
      expect(entity(result, "us-state-ak").capital).toBe(value);
      expect(warningsFor(result, "us-state-ak", "capital")).toEqual([]);
    },
  );
});

describe("criterion 8 — the refresh route catches it end to end", () => {
  let work: string;
  beforeEach(() => {
    work = mkdtempSync(join(tmpdir(), "question-bank-bare-qid-"));
    cpSync(BANK, join(work, "bank"), { recursive: true });
    cpSync(FIXTURE, join(work, "fixture.sparql.json"));
  });
  afterEach(() => rmSync(work, { recursive: true, force: true }));

  test("Alaska's capital is blanked, never written as Q29445, and the warning is printed", async () => {
    const main = withLabel("Alaska", "capitalLabel", "Q29445");
    const sparql: SparqlTransport = async (query) =>
      query === US_STATES_ELEVATION_QUERY
        ? (JSON.parse(readFileSync(ELEVATION_FIXTURE, "utf8")) as SparqlResults)
        : main;
    const stdout: string[] = [];
    const bankDir = join(work, "bank");

    await refreshBank({
      bankDir,
      fixturePath: join(work, "fixture.sparql.json"),
      sparql,
      now: () => new Date("2026-10-13T00:00:00Z"),
      out: (line) => stdout.push(line),
      err: () => {},
    });

    const alaska = JSON.parse(readFileSync(join(bankDir, "us-state-ak.json"), "utf8")) as object;
    expect("capital" in alaska).toBe(false);
    for (const name of readdirSync(bankDir)) {
      expect(readFileSync(join(bankDir, name), "utf8")).not.toContain('"Q29445"');
    }
    const line = stdout.find((l) => l.startsWith("  us-state-ak.capital: "));
    expect(line).toBeDefined();
    expect(line).toContain("Q29445");
  });
});
