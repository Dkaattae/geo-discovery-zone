import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { BANK_DIGESTS, BANK_PINS_AT, bankFileDigest } from "./bank-pins";

/**
 * T-070: the bank's standing content guard (`engineering-decisions.md` E-30).
 *
 * Every bank file is pinned whole at `b0ee336`, except `sources.built_at`, which
 * a refresh moves on its own. No field is stripped, reset or restored before
 * the comparison, so a change to any field of any file, `top_crops` included,
 * turns this red. A task that changes the bank on purpose re-pins
 * `BANK_DIGESTS` in `bank-pins.ts` through a Test change request.
 */

const BANK = resolve(import.meta.dirname, "..", "data", "us-states");
const read = (name: string) => readFileSync(join(BANK, name), "utf8");
const PINNED = Object.keys(BANK_DIGESTS).sort();

describe("T-070: every bank file matches its pin at b0ee336, built_at aside", () => {
  test("the pins were recorded at b0ee336", () => {
    expect(BANK_PINS_AT).toBe("b0ee336");
  });

  test("the bank holds exactly index.json and the 50 pinned state files", () => {
    const onDisk = readdirSync(BANK)
      .filter((name) => name.endsWith(".json"))
      .sort();
    expect(PINNED).toHaveLength(51);
    expect(PINNED.filter((name) => /^us-state-[a-z]{2}\.json$/.test(name))).toHaveLength(50);
    expect(onDisk).toEqual(PINNED);
  });

  test.each(PINNED)("%s digests to its pinned value", (name) => {
    expect(bankFileDigest(name, read(name))).toBe(BANK_DIGESTS[name]!);
  });
});

/** Apply `edit` to the parsed file and return the edited text, keeping the committed layout. */
function edited(name: string, edit: (entity: Record<string, unknown>) => void): string {
  const entity = JSON.parse(read(name)) as Record<string, unknown>;
  edit(entity);
  return JSON.stringify(entity, null, 2) + "\n";
}

describe("T-070: bankFileDigest removes sources.built_at and nothing else", () => {
  test("moving built_at alone, as a refresh does, leaves every entity digest unchanged", () => {
    for (const name of PINNED.filter((n) => n !== "index.json")) {
      const raw = read(name);
      // Two candidates, so whichever instant the tree holds, the other one moves it.
      const instant = raw.includes("1999-01-01T00:00:00.000Z")
        ? "1999-01-02T00:00:00.000Z"
        : "1999-01-01T00:00:00.000Z";
      const moved = raw.replace(
        /("built_at":\s*")[^"]*"/,
        (_match, key: string) => `${key}${instant}"`,
      );
      expect(moved).not.toBe(raw);
      expect(bankFileDigest(name, moved)).toBe(BANK_DIGESTS[name]!);
    }
  });

  test("a file with no sources.built_at is an error, not a silent pass", () => {
    const text = edited("us-state-co.json", (e) => {
      delete (e["sources"] as Record<string, unknown>)["built_at"];
    });
    expect(() => bankFileDigest("us-state-co.json", text)).toThrow(/no sources\.built_at/);
  });

  // Criterion 5's mutations, each made alone. Every one must move the digest.
  const firstWithLivestock = PINNED.find((name) => {
    if (name === "index.json") return false;
    const livestock = (JSON.parse(read(name)) as { top_livestock?: unknown[] }).top_livestock;
    return Array.isArray(livestock) && livestock.length > 0;
  })!;
  const mutations: [string, string, (e: Record<string, unknown>) => void][] = [
    ["us-state-il.json", "top_crops[0]", (e) => ((e["top_crops"] as unknown[])[0] = "kale")],
    ["us-state-ct.json", "highest_point_m", (e) => (e["highest_point_m"] = 728)],
    ["us-state-co.json", "landmark", (e) => (e["landmark"] = "Pikes Peak")],
    ["us-state-co.json", "climate_kid", (e) => (e["climate_kid"] = "sunny")],
    ["us-state-il.json", "region", (e) => (e["region"] = "Midwest")],
    ["us-state-ak.json", "highest_point", (e) => (e["highest_point"] = "Mount Foraker")],
    [firstWithLivestock, "top_livestock", (e) => ((e["top_livestock"] as unknown[])[0] = "llamas")],
    ["us-state-co.json", "population", (e) => (e["population"] = (e["population"] as number) + 1)],
  ];
  test.each(mutations)("%s: changing %s alone moves the digest", (name, _field, edit) => {
    expect(firstWithLivestock).toMatch(/^us-state-..\.json$/);
    expect(bankFileDigest(name, edited(name, edit))).not.toBe(BANK_DIGESTS[name]!);
  });

  test("index.json: changing one id moves the digest", () => {
    const text = read("index.json").replace('"id": "us-state-co"', '"id": "us-state-cx"');
    expect(text).not.toBe(read("index.json"));
    expect(bankFileDigest("index.json", text)).not.toBe(BANK_DIGESTS["index.json"]!);
  });
});
