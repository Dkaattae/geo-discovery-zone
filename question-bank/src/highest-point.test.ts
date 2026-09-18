import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES, curatedByPostal } from "./curated/us-states";
import { normalizeUsStates } from "./normalize";
import type { WikidataStateRow } from "./sources/wikidata";

/**
 * T-016 — `highest_point`'s curated fallback and Alaska's shape.
 *
 * `normalize.test.ts` covers ranking, borders and duplicate-row handling but
 * never exercises `highest_point` at all. `committed-bank.test.ts` already
 * proves the bank is built, not hand-edited, byte-for-byte — this file does
 * not repeat that; it is the fold-in logic (criterion 2) and Alaska's content
 * shape (criteria 1, 3, 4, 8, 9) that no existing suite reaches.
 *
 * No network: every case below constructs `WikidataStateRow` objects by hand
 * rather than reading the fixture over HTTP, and the one full-fixture check
 * reads `us-states.sparql.json` off disk (`test-guidelines.md`).
 */

const PKG = resolve(import.meta.dirname, "..");
const DATA_DIR = join(PKG, "data/us-states");
const FIXTURE_PATH = join(PKG, "src/fixtures/us-states.sparql.json");

/** The one curated field this task adds. Alaska is the only state that has it. */
const ALASKA_CURATED = curatedByPostal.get("AK");
if (!ALASKA_CURATED?.highest_point) {
  throw new Error("expected Alaska's curated row to carry a highest_point fallback");
}

/** A minimal row: only `name`, `borderQids` and `borderNames` are required. */
function rowFor(name: string, overrides: Partial<WikidataStateRow> = {}): WikidataStateRow {
  return { name, borderQids: [], borderNames: [], ...overrides };
}

describe("criterion 2 — the curated fallback fills a gap and never overrides Wikidata", () => {
  test("no label, curated fallback present → the entity carries the curated value", () => {
    const { entities } = normalizeUsStates([rowFor("Alaska")]);

    expect(entities).toHaveLength(1);
    expect(entities[0]?.highest_point).toBe(ALASKA_CURATED.highest_point);
  });

  test("a Wikidata label present, curated fallback also present → Wikidata wins", () => {
    const { entities } = normalizeUsStates([rowFor("Alaska", { highestPoint: "Test Peak" })]);

    expect(entities).toHaveLength(1);
    expect(entities[0]?.highest_point).toBe("Test Peak");
    expect(entities[0]?.highest_point).not.toBe(ALASKA_CURATED.highest_point);
  });

  test("no label, no curated fallback → the key is absent, not an empty string", () => {
    // Colorado has no curated highest_point fallback at all.
    const { entities } = normalizeUsStates([rowFor("Colorado")]);

    expect(entities).toHaveLength(1);
    expect(entities[0]?.highest_point).toBeUndefined();
  });
});

describe("criterion 8 — a build that still leaves a state blank says so", () => {
  test("a row with no label and no curated fallback produces a highest_point warning naming that entity", () => {
    const { warnings } = normalizeUsStates([rowFor("Colorado")]);
    const warning = warnings.find((w) => w.field === "highest_point");

    expect(warning).toBeDefined();
    expect(warning?.entity).toBe("us-state-co");
  });

  test("a row with a label, or a curated fallback, produces no highest_point warning", () => {
    const withLabel = normalizeUsStates([rowFor("Colorado", { highestPoint: "Mount Elbert" })]);
    expect(withLabel.warnings.filter((w) => w.field === "highest_point")).toHaveLength(0);

    const withFallback = normalizeUsStates([rowFor("Alaska")]);
    expect(withFallback.warnings.filter((w) => w.field === "highest_point")).toHaveLength(0);
  });
});

describe("criterion 9 — the full fixture build emits zero highest_point warnings", () => {
  test("every one of the 50 curated states resolves a highest_point from Wikidata or the fallback", () => {
    const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as {
      results: { bindings: Record<string, unknown>[] };
    };
    const rows: WikidataStateRow[] = fixture.results.bindings.map((binding) => {
      const get = (key: string) => (binding[key] as { value?: string } | undefined)?.value;
      return rowFor(get("stateLabel") ?? "", {
        highestPoint: get("highestPoint"),
      });
    });
    expect(rows).toHaveLength(50);

    const { warnings } = normalizeUsStates(rows);
    expect(warnings.filter((w) => w.field === "highest_point")).toHaveLength(0);
  });
});

describe("criteria 1, 3, 4 — every tracked file carries a plain, non-empty highest_point", () => {
  test("all 50 CURATED_US_STATES entries resolve some highest_point through their own tracked file", () => {
    for (const state of CURATED_US_STATES) {
      const file = join(DATA_DIR, `us-state-${state.postal.toLowerCase()}.json`);
      const entity = JSON.parse(readFileSync(file, "utf8")) as { highest_point?: unknown };
      expect({ postal: state.postal, type: typeof entity.highest_point }).toEqual({
        postal: state.postal,
        type: "string",
      });
      expect({ postal: state.postal, empty: (entity.highest_point as string).length === 0 }).toEqual({
        postal: state.postal,
        empty: false,
      });
    }
  });

  test("Alaska's tracked highest_point equals its landmark, character for character", () => {
    const entity = JSON.parse(readFileSync(join(DATA_DIR, "us-state-ak.json"), "utf8")) as {
      highest_point?: string;
      landmark?: string;
    };
    expect(entity.highest_point).toBe(entity.landmark);
  });

  test("Alaska's curated highest_point equals its curated landmark, character for character", () => {
    expect(ALASKA_CURATED.highest_point).toBe(ALASKA_CURATED.landmark);
  });

  test("Alaska's highest_point is one plain name: no parenthesis, /, comma, or ' or '", () => {
    const value = ALASKA_CURATED.highest_point as string;
    expect(value.length).toBeGreaterThan(0);
    expect(/[(),/]/.test(value)).toBe(false);
    expect(value).not.toContain(" or ");
  });
});
