import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { fixtureTransport } from "./fixture-transport";
import { normalizeUsStates } from "./normalize";
import { US_STATES_QUERY } from "./queries/us-states";
import { US_STATES_ELEVATION_QUERY } from "./queries/us-states-elevation";
import { refreshBank } from "./refresh";
import type { SparqlResults, SparqlTransport } from "./sparql";
import { parseUsStates } from "./sources/wikidata";

/**
 * T-084 (tester). Written from the brief's acceptance criteria, not from the
 * implementation. Tests cannot run SPARQL, so criteria 1–4 are checked on the
 * exact text `refreshBank` hands its `SparqlTransport` (captured below through
 * a spy that replays the committed recordings). No network, no `fetch` mock,
 * nothing written outside a temp dir.
 */
const PKG = resolve(import.meta.dirname, "..");
const FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");
const ELEVATION_FIXTURE = join(PKG, "src/fixtures/us-states-elevation.sparql.json");

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8")) as SparqlResults;

/** What `bun run refresh` sends, in order, captured at the transport seam. */
async function sentByRefresh(): Promise<string[]> {
  const seen: string[] = [];
  const spy: SparqlTransport = async (query) => {
    seen.push(query);
    return query === US_STATES_ELEVATION_QUERY ? readJson(ELEVATION_FIXTURE) : readJson(FIXTURE);
  };
  const dir = mkdtempSync(join(tmpdir(), "t084-verify-"));
  try {
    await refreshBank({
      bankDir: join(dir, "bank"),
      fixturePath: join(dir, "us-states.sparql.json"),
      sparql: spy,
      now: () => new Date("2026-10-29T00:00:00Z"),
      out: () => {},
      err: () => {},
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return seen;
}

const SENT = await sentByRefresh();
/** The first query the refresh sends: the 50-state one. */
const MAIN = SENT[0] ?? "";
const flat = (q: string) => q.replace(/\s+/g, " ").trim();

/** Every `OPTIONAL { … }` body in `q`, brace-matched, nested ones included. */
function optionalBodies(q: string): string[] {
  const bodies: string[] = [];
  for (const m of q.matchAll(/OPTIONAL\s*\{/g)) {
    let depth = 1;
    let i = (m.index ?? 0) + m[0].length;
    const start = i;
    while (depth > 0 && i < q.length) {
      if (q[i] === "{") depth++;
      else if (q[i] === "}") depth--;
      i++;
    }
    bodies.push(q.slice(start, i - 1));
  }
  return bodies;
}

/** The innermost OPTIONAL that reads `?item rdfs:label ?x` filtered to `lang`. */
function labelOptional(q: string, item: string, lang: string): { body: string; v: string }[] {
  return optionalBodies(q)
    .filter((b) => !/OPTIONAL\s*\{/.test(b))
    .flatMap((body) => {
      const m = body.match(new RegExp(`\\?${item}\\s+rdfs:label\\s+\\?(\\w+)\\s*\\.`));
      if (!m) return [];
      const v = m[1] as string;
      const langs = [...body.matchAll(new RegExp(`LANG\\(\\?${v}\\)\\s*=\\s*"([^"]*)"`, "g"))].map(
        (x) => x[1],
      );
      return langs.length === 1 && langs[0] === lang ? [{ body, v }] : [];
    });
}

/** The variable fed to the aggregate whose result is named `out`. */
function aggregated(q: string, fn: string, out: string): string {
  const m = flat(q).match(new RegExp(`\\(${fn}\\((?:DISTINCT )?\\?(\\w+)[^)]*\\) AS \\?${out}\\)`));
  if (!m) throw new Error(`no ${fn}(…) AS ?${out} in the query`);
  return m[1] as string;
}

/**
 * Criteria 2 and 3 share one rule: the aggregated label comes from en if the
 * item has one, else mul, and never from both.
 */
function expectEnThenMul(q: string, itemPattern: RegExp, fn: string, out: string) {
  const item = flat(q).match(itemPattern)?.[1];
  expect(item).toBeDefined();
  const en = labelOptional(q, item as string, "en");
  const mul = labelOptional(q, item as string, "mul");
  // Each read on its own, inside its own OPTIONAL: an item with only one of
  // the two still binds, and the two never multiply each other into two rows.
  expect(en).toHaveLength(1);
  expect(mul).toHaveLength(1);
  const enVar = en[0]?.v as string;
  const mulVar = mul[0]?.v as string;
  expect(enVar).not.toBe(mulVar);
  const label = aggregated(q, fn, out);
  // en first: COALESCE yields its first bound argument, so mul is read only
  // when en is unbound, and exactly one value reaches the aggregate.
  expect(flat(q)).toContain(`BIND(COALESCE(?${enVar}, ?${mulVar}) AS ?${label})`);
  // …and the aggregated variable is bound nowhere else (no direct rdfs:label
  // into it, no second BIND), so the aggregate never sees both names.
  expect(flat(q).match(new RegExp(`rdfs:label \\?${label}\\b`, "g"))).toBeNull();
  expect(flat(q).match(new RegExp(`AS \\?${label}\\)`, "g"))).toHaveLength(1);
}

describe("T-084 criterion 1: the label service asks for en,mul", () => {
  test("the refresh sends the 50-state query first", () => {
    expect(SENT).toHaveLength(2);
    expect(MAIN).toBe(US_STATES_QUERY);
  });

  test('exactly one label service, with the list "en,mul": en first, mul second, nothing else', () => {
    const lists = [...MAIN.matchAll(/wikibase:language\s+"([^"]*)"/g)].map((m) => m[1]);
    expect(lists).toHaveLength(1);
    expect((lists[0] as string).split(",").map((s) => s.trim())).toEqual(["en", "mul"]);
    expect(lists[0]).toBe("en,mul");
  });
});

describe("T-084 criterion 2: the highest point label can come from mul, en wins", () => {
  test("rdfs:label is read for the P610 item in en and in mul, coalesced en first", () => {
    expectEnThenMul(MAIN, /\?state wdt:P610 \?(\w+)/, "SAMPLE", "highestPoint");
  });
});

describe("T-084 criterion 3: a border name can come from mul, one name per border", () => {
  test("rdfs:label is read for the P47 item in en and in mul, coalesced en first", () => {
    expectEnThenMul(MAIN, /\?state wdt:P47 \?(\w+)/, "GROUP_CONCAT", "borderNames");
  });

  test('borderNames is still the "|"-separated list wikidata.ts splits on', () => {
    expect(flat(MAIN)).toMatch(/separator="\|"\) AS \?borderNames\)/);
  });

  test("no language other than en and mul is filtered on anywhere in the query", () => {
    const langs = new Set([...MAIN.matchAll(/LANG\([^)]*\)\s*=\s*"([^"]*)"/g)].map((m) => m[1]));
    expect([...langs].sort()).toEqual(["en", "mul"]);
  });
});

describe("T-084 criterion 4: twelve variables, same order, one row per state", () => {
  const VARS = [
    "state",
    "stateLabel",
    "capitalLabel",
    "fips",
    "population",
    "area",
    "coord",
    "article",
    "highestPoint",
    "elevation",
    "borderQids",
    "borderNames",
  ];

  test("the SELECT projects exactly the criterion's twelve names, in order", () => {
    const select = flat(MAIN.slice(MAIN.indexOf("SELECT") + 6, MAIN.indexOf("WHERE")));
    // A projection is `?x` or `(… AS ?x)`; strip the expressions to their names.
    const names = [...select.matchAll(/\([^()]*(?:\([^()]*\)[^()]*)*\)|\?\w+/g)].map((m) =>
      m[0].startsWith("(") ? (m[0].match(/AS \?(\w+)\)$/)?.[1] ?? "?") : m[0].slice(1),
    );
    expect(names).toEqual(VARS);
  });

  test("they are the head.vars the committed fixture records", () => {
    expect(readJson(FIXTURE).head.vars).toEqual(VARS);
  });

  test("GROUP BY is still ?state ?stateLabel ?capitalLabel", () => {
    const groupBy = flat(MAIN).match(/GROUP BY (.*?) ORDER BY/)?.[1];
    expect(groupBy).toBe("?state ?stateLabel ?capitalLabel");
  });
});

describe("T-084 criterion 7: the offline path still replays the fixture", () => {
  test("fixtureTransport accepts the query the refresh sends, and answers 50 states", async () => {
    const replay = fixtureTransport(FIXTURE, {});
    const res = await replay(MAIN);
    expect(res.results.bindings).toHaveLength(50);
    const alaska = parseUsStates(res).find((r) => r.name === "Alaska");
    expect(alaska?.capital).toBe("Juneau");
  });

  test("fixtureTransport still refuses a query it has no recording for", async () => {
    const replay = fixtureTransport(FIXTURE, {});
    await expect(replay(`${MAIN}\n# not the recorded query`)).rejects.toThrow();
  });
});

describe("T-084 criterion 8: a bare QID is still treated as absent", () => {
  test("a capital label of Q29445 (neither en nor mul) is blanked, with a warning naming it", () => {
    const res = readJson(FIXTURE);
    const row = res.results.bindings.find((b) => b["stateLabel"]?.value === "Alaska");
    if (!row) throw new Error("fixture has no Alaska row");
    row["capitalLabel"] = { type: "literal", value: "Q29445" };
    const result = normalizeUsStates(parseUsStates(res), { builtAt: "2026-10-29T00:00:00Z" });
    const ak = result.entities.find((e) => e.id === "us-state-ak") as unknown as
      Record<string, unknown> | undefined;
    expect(ak).toBeDefined();
    expect(ak?.["capital"]).toBeUndefined();
    const warnings = result.warnings.filter(
      (w) => w.entity === "us-state-ak" && w.field === "capital",
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain("bare QID");
    expect(warnings[0]?.message).toContain("Q29445");
  });
});
