import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { BUILDER_VERSION, normalizeUsStates } from "./normalize";
import { parseUsStates } from "./sources/wikidata";
import type { SparqlResults } from "./sparql";
import type { Entity } from "./types";

/**
 * The committed bank under `data/us-states/` must be exactly what an offline
 * rebuild from the committed fixture produces (T-010, criteria 6 and 8). This
 * test reaches no network and writes nothing inside `data/us-states/` — it
 * only reads the tracked files and compares them against `normalizeUsStates`
 * run against the same fixture, with the same fixed `built_at` the offline
 * build derives from `_fixture.captured_at` (`build.ts`'s `fixtureTransport`).
 * Changing a single value in a single tracked file is enough to fail this.
 */
const FIXTURE = join(import.meta.dirname, "fixtures/us-states.sparql.json");
const DATA_DIR = join(import.meta.dirname, "../data/us-states");

/** Mirrors `build.ts`'s offline `built_at`: the fixture's own capture time. */
function fixtureBuiltAt(): string | undefined {
  const raw = JSON.parse(readFileSync(FIXTURE, "utf8")) as {
    _fixture?: { captured_at?: string };
  };
  const capturedAt = raw._fixture?.captured_at;
  return capturedAt ? new Date(capturedAt).toISOString() : undefined;
}

function expectedEntities(): Entity[] {
  const rows = parseUsStates(JSON.parse(readFileSync(FIXTURE, "utf8")) as SparqlResults);
  const builtAt = fixtureBuiltAt();
  return normalizeUsStates(rows, builtAt ? { builtAt } : {}).entities;
}

function readTrackedFile(name: string): unknown {
  return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));
}

describe("criterion 8 — the committed bank matches an offline rebuild", () => {
  const expected = expectedEntities();
  const trackedFiles = readdirSync(DATA_DIR).filter((f) => f !== "index.json");

  test("exactly 50 tracked entity files, one per curated state", () => {
    expect(trackedFiles).toHaveLength(50);
    expect(expected).toHaveLength(50);
  });

  for (const entity of expectedEntities()) {
    test(`${entity.id} equals the offline rebuild of the committed fixture`, () => {
      expect(readTrackedFile(`${entity.id}.json`)).toEqual(entity);
    });
  }

  test("index.json's ids match the 50 tracked files exactly, no duplicates or omissions", () => {
    const index = readTrackedFile("index.json") as { count: number; entities: { id: string }[] };
    const trackedIds = trackedFiles.map((f) => f.replace(/\.json$/, "")).sort();

    expect(index.count).toBe(50);
    expect(index.entities.map((e) => e.id).sort()).toEqual(trackedIds);
    expect(new Set(index.entities.map((e) => e.id)).size).toBe(50);
  });

  test("sources.built_at is one shared ISO-8601 instant, and builder_version matches BUILDER_VERSION", () => {
    const builtAts = new Set(expected.map((e) => e.sources?.built_at));
    const versions = new Set(expected.map((e) => e.sources?.builder_version));

    expect(builtAts.size).toBe(1);
    expect(versions.size).toBe(1);
    expect(versions.has(BUILDER_VERSION)).toBe(true);
    const builtAt = [...builtAts][0];
    expect(typeof builtAt).toBe("string");
    expect(new Date(builtAt as string).toISOString()).toBe(builtAt as string);
  });

  test("no tracked file contains unreviewed fun-fact prose", () => {
    for (const name of trackedFiles) {
      const raw = readFileSync(join(DATA_DIR, name), "utf8");
      expect(raw).not.toContain('"reviewed": false');
    }
  });

  test("a second offline rebuild would leave the tracked files untouched (population_rank and area_rank are fully assigned)", () => {
    const populationRanks = expected.map((e) => e.population_rank).sort((a, b) => (a ?? 0) - (b ?? 0));
    const areaRanks = expected.map((e) => e.area_rank).sort((a, b) => (a ?? 0) - (b ?? 0));

    expect(populationRanks).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
    expect(areaRanks).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
  });
});
