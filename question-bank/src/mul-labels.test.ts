import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { fixtureTransport } from "./fixture-transport";
import { US_STATES_QUERY } from "./queries/us-states";
import { US_STATES_ELEVATION_QUERY } from "./queries/us-states-elevation";
import { fetchUsStates } from "./sources/wikidata";
import type { SparqlTransport } from "./sparql";

/**
 * T-084 (worker). The query must read Wikidata's `mul` labels whenever `en` is
 * missing. Tests cannot run SPARQL, so these inspect the text the refresh hands
 * its transport; the live check is recorded in the brief's Handoff.
 */
const PKG = resolve(import.meta.dirname, "..");
const FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");

/** Collapses whitespace so the assertions do not pin indentation. */
const flat = (q: string): string => q.replace(/\s+/g, " ");
const Q = flat(US_STATES_QUERY);

describe("T-084 — the query asks for mul after en", () => {
  test("the label service asks for exactly en,mul", () => {
    const langs = [...US_STATES_QUERY.matchAll(/wikibase:language\s+"([^"]*)"/g)].map((m) => m[1]);
    expect(langs).toEqual(["en,mul"]);
  });

  for (const [what, item, en, mul, out] of [
    ["highest point", "highestPointItem", "highestPointEn", "highestPointMul", "highestPointLabel"],
    ["border", "border", "borderEn", "borderMul", "borderLabelRaw"],
  ] as const) {
    test(`the ${what} label reads en and mul, en first, binding one of them`, () => {
      expect(Q).toContain(`?${item} rdfs:label ?${en} . FILTER(LANG(?${en}) = "en")`);
      expect(Q).toContain(`?${item} rdfs:label ?${mul} . FILTER(LANG(?${mul}) = "mul")`);
      // COALESCE takes the first bound argument: en wins, and only one is bound.
      expect(Q).toContain(`BIND(COALESCE(?${en}, ?${mul}) AS ?${out})`);
      // The aggregated variable is bound in exactly one place.
      expect(Q.split(`?${out} .`).length).toBe(1);
      expect(Q.split(`AS ?${out})`).length).toBe(2);
    });
  }

  test("a border with neither label is still dropped whole, QID included", () => {
    const borderBlock = Q.slice(Q.indexOf("?state wdt:P47 ?border"), Q.indexOf("?borderQid)"));
    expect(borderBlock).toContain("FILTER(BOUND(?borderLabelRaw))");
  });

  test("no third language and no other label source", () => {
    const langs = new Set([...Q.matchAll(/LANG\([^)]*\) = "([^"]*)"/g)].map((m) => m[1]));
    expect([...langs].sort()).toEqual(["en", "mul"]);
    expect(Q).not.toContain("skos:altLabel");
    expect(Q).not.toContain("schema:name");
  });

  test("SELECT keeps the fixture's twelve variables in order, one row per state", () => {
    const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as { head: { vars: string[] } };
    const select = US_STATES_QUERY.slice(
      US_STATES_QUERY.indexOf("SELECT") + "SELECT".length,
      US_STATES_QUERY.indexOf("WHERE"),
    );
    // One projection per line; its name is the last ?var on the line.
    const names = select
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => [...line.matchAll(/\?(\w+)/g)].at(-1)?.[1]);
    expect(names).toEqual(fixture.head.vars);
    expect(names).toHaveLength(12);
    expect(Q).toContain("GROUP BY ?state ?stateLabel ?capitalLabel ORDER BY");
  });
});

describe("T-084 — the offline path still replays the fixture", () => {
  test("the refresh sends US_STATES_QUERY then the elevation query", async () => {
    const seen: string[] = [];
    const replay = fixtureTransport(FIXTURE, {});
    const spy: SparqlTransport = async (q) => {
      seen.push(q);
      return replay(q);
    };
    const rows = await fetchUsStates(spy);
    expect(seen).toEqual([US_STATES_QUERY, US_STATES_ELEVATION_QUERY]);
    expect(rows).toHaveLength(50);
    expect(rows.find((r) => r.name === "Alaska")?.capital).toBe("Juneau");
  });
});
