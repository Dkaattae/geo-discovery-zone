import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";
import { normalizeUsStates } from "./normalize";
import { rebuildOffline } from "./offline-rebuild";
import { parseUsStates, type WikidataStateRow } from "./sources/wikidata";
import type { SparqlResults } from "./sparql";

/**
 * T-068 verification — written by the `tester` role from the acceptance
 * criteria in `tasks/T-068-top-livestock.md`, not from the implementation.
 * Expected values come from the criterion text.
 *
 * Covered here, durably: criteria 1–11, 20, 21 and 23 — properties of the bank,
 * the curated table, `normalizeUsStates`, the offline rebuild and the docs that
 * stay true after this task merges.
 *
 * Deliberately **not** pinned here: the criteria phrased against "the base
 * commit" (12, 13, 14, 15, 22, 24). Pinning `ed229805`'s bytes as digests in a
 * test is the expiring-baseline shape `engineering-decisions.md` E-11/E-12
 * removed and T-070 is trying to retire — it goes red the moment T-040 or T-064
 * legitimately touches those files. They were checked once against the base
 * commit in a full clone, and the result is recorded in the brief's Verdict
 * (the precedent is `backend/tests/test_climate_koppen_t067_criteria.py`).
 * Criterion 24's lasting half is already held by `dependency-set.test.ts`.
 *
 * Criterion 16 (the four existing digest guards still bite on other fields) is
 * about tests that existed before this task and are red by design until a
 * person approves the Test change request; it is verified by mutation on those
 * guards once they are changed.
 *
 * No network: subprocesses are `git ls-files` (read-only) and the build CLI via
 * `rebuildOffline` (dead-loopback proxy). Nothing mocks `fetch`.
 *
 * What no test here can settle is whether each pick is *true* of its state —
 * that is the brief's Review checklist.
 */

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");
const BUILD_SCRIPT = join(PKG, "src/build.ts");
const FIXTURE = join(import.meta.dirname, "fixtures/us-states.sparql.json");

function git(args: string[]): string {
  const proc = Bun.spawnSync(["git", ...args], { cwd: REPO });
  if (proc.exitCode !== 0) throw new Error(`git ${args.join(" ")} exited ${proc.exitCode}`);
  return proc.stdout.toString();
}

function trackedStateFileNames(): string[] {
  const names = git(["ls-files", "question-bank/data/us-states/us-state-??.json"])
    .split("\n")
    .filter(Boolean)
    .map((p) => p.split("/").pop() as string)
    .sort();
  if (names.length !== 50)
    throw new Error(`expected 50 tracked state files, found ${names.length}`);
  return names;
}

const postalOf = (file: string) => file.slice("us-state-".length, -".json".length).toUpperCase();

type Json = Record<string, unknown>;

function trackedStates(): { file: string; postal: string; raw: string; entity: Json }[] {
  return trackedStateFileNames().map((file) => {
    const raw = readFileSync(join(DATA_DIR, file), "utf8");
    return { file, postal: postalOf(file), raw, entity: JSON.parse(raw) as Json };
  });
}

function livestockOf(entity: Json): string[] {
  const value = entity["top_livestock"];
  if (!Array.isArray(value)) throw new Error(`top_livestock is not an array: ${String(value)}`);
  return value as string[];
}

const allLivestock = () =>
  trackedStates().flatMap(({ file, entity }) =>
    livestockOf(entity).map((value) => ({ file, value })),
  );

describe("T-068 tester, criterion 1 — every tracked file carries a top_livestock array", () => {
  test("all 50 files have the key, and its value is a JSON array (empty included)", () => {
    const states = trackedStates();
    expect(states).toHaveLength(50);
    for (const { file, entity } of states) {
      expect({ file, has: Object.hasOwn(entity, "top_livestock") }).toEqual({ file, has: true });
      expect({ file, isArray: Array.isArray(entity["top_livestock"]) }).toEqual({
        file,
        isArray: true,
      });
    }
  });
});

describe("T-068 tester, criterion 2 — at most two items per state", () => {
  test("every top_livestock has length 0, 1 or 2", () => {
    for (const { file, entity } of trackedStates()) {
      const len = livestockOf(entity).length;
      expect({ file, ok: len >= 0 && len <= 2 }).toEqual({ file, ok: true });
    }
  });
});

describe("T-068 tester, criterion 3 — the three named states are not blank", () => {
  for (const postal of ["DE", "AR", "WI"]) {
    test(`${postal}'s top_livestock is non-empty`, () => {
      const state = trackedStates().find((s) => s.postal === postal);
      expect(state).toBeTruthy();
      expect(livestockOf(state!.entity).length).toBeGreaterThan(0);
    });
  }
});

describe("T-068 tester, criterion 4 — strings are non-empty, trimmed and lower-case", () => {
  test("every string is a non-empty, trimmed, lower-cased string", () => {
    for (const { file, value } of allLivestock()) {
      expect({ file, type: typeof value }).toEqual({ file, type: "string" });
      expect({ file, value, empty: value.length === 0 }).toEqual({ file, value, empty: false });
      expect({ file, value }).toEqual({ file, value: value.trim() });
      expect({ file, value }).toEqual({ file, value: value.toLowerCase() });
    }
  });
});

describe("T-068 tester, criterion 5 — no duplicates within a state", () => {
  test("no top_livestock array repeats a string", () => {
    for (const { file, entity } of trackedStates()) {
      const list = livestockOf(entity);
      expect({ file, size: new Set(list).size }).toEqual({ file, size: list.length });
    }
  });
});

const REQUIRED_WORDS = [
  "cattle",
  "beef",
  "dairy",
  "milk",
  "poultry",
  "chicken",
  "broiler",
  "turkey",
  "egg",
  "hog",
  "pig",
  "swine",
  "cow",
  "livestock",
  "sheep",
  "lamb",
  "goat",
];
const BANNED_WORDS = ["fish", "catfish", "trout", "salmon", "shrimp", "oyster", "horse", "bee"];

describe("T-068 tester, criterion 6 — every string names a farm animal or its product", () => {
  test("every string contains at least one of the 17 listed words", () => {
    for (const { file, value } of allLivestock()) {
      const hit = REQUIRED_WORDS.some((w) => value.toLowerCase().includes(w));
      expect({ file, value, hit }).toEqual({ file, value, hit: true });
    }
  });
});

describe("T-068 tester, criterion 7 — no fish, shellfish, horses or bees", () => {
  test("no string contains any of the 8 excluded substrings", () => {
    for (const { file, value } of allLivestock()) {
      const hits = BANNED_WORDS.filter((w) => value.toLowerCase().includes(w));
      expect({ file, value, hits }).toEqual({ file, value, hits: [] });
    }
  });
});

describe("T-068 tester, criterion 8 — no overlap with any state's top_crops", () => {
  test("no top_livestock string equals any top_crops string, across all states", () => {
    const crops = new Set<string>();
    for (const { entity } of trackedStates()) {
      const list = entity["top_crops"];
      expect(Array.isArray(list)).toBe(true);
      for (const crop of list as string[]) crops.add(crop.toLowerCase());
    }
    expect(crops.size).toBeGreaterThan(0);
    for (const { file, value } of allLivestock()) {
      expect({ file, value, inCrops: crops.has(value.toLowerCase()) }).toEqual({
        file,
        value,
        inCrops: false,
      });
    }
  });
});

describe("T-068 tester, criterion 9 — the tracked value is the curated value", () => {
  test("each state's top_livestock deep-equals CURATED_US_STATES' value for that postal, or []", () => {
    const curated = new Map(CURATED_US_STATES.map((s) => [s.postal, s] as const));
    const states = trackedStates();
    expect(states).toHaveLength(50);
    for (const { file, postal, entity } of states) {
      const entry = curated.get(postal);
      expect({ file, curated: entry !== undefined }).toEqual({ file, curated: true });
      expect({ file, value: entity["top_livestock"] }).toEqual({
        file,
        value: entry?.top_livestock ?? [],
      });
    }
  });
});

describe("T-068 tester, criterion 10 — normalizeUsStates folds the curated value in", () => {
  const allRows = (): WikidataStateRow[] =>
    parseUsStates(JSON.parse(readFileSync(FIXTURE, "utf8")) as SparqlResults);

  test("a state with no curated livestock gets top_livestock: [] (key present); one with livestock gets it unchanged", () => {
    const { entities } = normalizeUsStates(allRows());
    expect(entities).toHaveLength(50);
    const byName = new Map(CURATED_US_STATES.map((s) => [s.name, s] as const));
    let blank = 0;
    let set = 0;
    for (const entity of entities) {
      const entry = byName.get(entity.name);
      expect({ name: entity.name, curated: entry !== undefined }).toEqual({
        name: entity.name,
        curated: true,
      });
      expect({ name: entity.name, has: Object.hasOwn(entity, "top_livestock") }).toEqual({
        name: entity.name,
        has: true,
      });
      if (entry?.top_livestock === undefined) {
        blank += 1;
        expect({ name: entity.name, value: entity.top_livestock }).toEqual({
          name: entity.name,
          value: [],
        });
      } else {
        set += 1;
        expect({ name: entity.name, value: entity.top_livestock }).toEqual({
          name: entity.name,
          value: [...entry.top_livestock],
        });
      }
    }
    // Both branches of the criterion are actually exercised.
    expect(blank).toBeGreaterThan(0);
    expect(set).toBeGreaterThan(0);
  });
});

describe("T-068 tester, criterion 11 — two offline rebuilds reproduce the tracked files", () => {
  test("two consecutive offline rebuilds each write the 50 files byte-identical to the tracked ones", () => {
    const names = trackedStateFileNames();
    const first = rebuildOffline(BUILD_SCRIPT, names, "t068-verify-a-");
    const second = rebuildOffline(BUILD_SCRIPT, names, "t068-verify-b-");
    for (const file of names) {
      const tracked = readFileSync(join(DATA_DIR, file), "utf8");
      expect({ file, same: first.get(file) === tracked }).toEqual({ file, same: true });
      expect({ file, same: second.get(file) === tracked }).toEqual({ file, same: true });
    }
  }, 120_000);
});

const DECISIONS = join(REPO, "engineering-decisions.md");

function e18Section(): string {
  const text = readFileSync(DECISIONS, "utf8");
  const start = text.search(/^## E-18\b/m);
  if (start < 0) throw new Error("no E-18 heading");
  const rest = text.slice(start);
  const next = rest.slice(1).search(/^## /m);
  return next < 0 ? rest : rest.slice(0, next + 1);
}

describe("T-068 tester, criterion 20 — E-18 records the decision", () => {
  test("there is exactly one E-18 heading, and it names top_livestock", () => {
    const headings = readFileSync(DECISIONS, "utf8").match(/^## E-18\b.*$/gm) ?? [];
    expect(headings).toHaveLength(1);
    expect(headings[0]).toContain("top_livestock");
  });

  test("it states the field name on both sides of the contract", () => {
    const section = e18Section();
    expect(section).toContain("top_livestock");
    expect(section).toContain("topLivestock");
  });

  test("it states the exposure decision: contract and backend model now", () => {
    const section = e18Section();
    expect(section).toContain("openapi.yaml");
    expect(section).toContain("models.py");
  });

  test("it states the boundary with top_crops", () => {
    expect(e18Section()).toContain("top_crops");
  });

  test("it states that fish and horses are excluded", () => {
    const section = e18Section();
    expect(section).toMatch(/fish/i);
    expect(section).toMatch(/horse/i);
    expect(section).toMatch(/exclu/i);
  });

  test("it states the values are hand-curated, not fetched", () => {
    expect(e18Section()).toMatch(/hand-curated/i);
  });
});

const POSTALS = new Set(CURATED_US_STATES.map((s) => s.postal));

describe("T-068 tester, criterion 21 — E-18 lists exactly the blank states", () => {
  test("the postal codes E-18 lists as empty equal the tracked files with an empty top_livestock", () => {
    const paragraph = e18Section()
      .split(/\n\s*\n/)
      .filter((p) => /empty `top_livestock`/.test(p));
    expect(paragraph).toHaveLength(1);
    const listed = [...new Set((paragraph[0] as string).match(/\b[A-Z]{2}\b/g) ?? [])]
      .filter((code) => POSTALS.has(code))
      .sort();
    const blank = trackedStates()
      .filter(({ entity }) => livestockOf(entity).length === 0)
      .map(({ postal }) => postal)
      .sort();
    expect(blank.length).toBeGreaterThan(0);
    expect(listed).toEqual(blank);
  });
});

describe("T-068 tester, criterion 23 — curated/us-states.ts carries the provenance paragraph", () => {
  test("the header comment has a top_livestock paragraph naming T-068, reviewed kid-facing text, no separate review pass", () => {
    const source = readFileSync(join(import.meta.dirname, "curated/us-states.ts"), "utf8");
    const header = source.match(/^\/\*\*[^]*?\*\//)?.[0];
    expect(header).toBeTruthy();
    const paragraphs = (header as string)
      .split(/\n \*\s*\n/)
      .filter((p) => p.includes("`top_livestock` provenance"));
    expect(paragraphs).toHaveLength(1);
    const p = (paragraphs[0] as string).replace(/\s*\n \* ?/g, " ");
    expect(p).toContain("T-068");
    expect(p).toMatch(/reviewed,? kid-facing/);
    expect(p).toMatch(/no separate review pass/);
  });
});
