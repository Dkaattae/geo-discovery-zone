import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";
import { rebuildOffline } from "./offline-rebuild";

/**
 * T-013 verification (worker). Written from the acceptance criteria in
 * `tasks/T-013-curate-landmarks.md`, not from the implementation: every bound
 * below — 4–48 characters, the forbidden punctuation set, the eight forbidden
 * phrases, the pinned `built_at`, the 51 rebuilt paths — is quoted from a
 * criterion rather than read off the curated table or the built bank.
 *
 * `HANDOFF_BLANKS`, `HANDOFF_LANDMARKS`, `SELF_NAMING_STATES` and
 * `MULTI_STATE_SPANS` are transcribed from this brief's `## Handoff`, which is
 * itself a deliverable under criteria 1, 11 and 12. They are the *claim*; the
 * tracked bank is the *fact*, and these tests compare the two. They are
 * transcribed rather than read from `tasks/` at run time because the reviewer
 * deletes the brief at sweep (`process.md` step 6) and a test that reads a file
 * which later disappears is a test that later stops meaning anything —
 * precedent: `state-animals.test.ts`'s own header comment (T-012).
 *
 * Nothing here reaches the network: the one thing it runs is the build CLI
 * with `--offline` and all six proxy spellings pointed at a dead loopback
 * port, the same trick CI uses (`test-guidelines.md`). Nothing mocks `fetch`.
 * Nothing writes inside `question-bank/` — the rebuild goes to a temp dir.
 *
 * What a shape test cannot do is check that a landmark is *actually* that
 * state's, still standing, or something a child would recognise. The brief's
 * "Review checklist" owns that and only a person can close it
 * (`process-decisions.md` D-4a).
 *
 * Criterion 9 ("nothing but landmark moves in the bank") has two kinds of
 * claim, the same split `committed-bank.test.ts` draws for T-010 criteria
 * 17–18: the tree-shaped pieces (the set of states carrying `climate_kid` is
 * exactly {Colorado}, `state_animal` values are still present, `index.json`'s
 * shape is unchanged) are committed below; "unchanged from the default
 * branch's own bytes" is a property of *this branch's diff*, not of the tree
 * — CI checks out at `fetch-depth: 1`, so `origin/main` is not there — and is
 * recorded in the Verdict with `git diff` instead.
 */
const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");
const BUILD_SCRIPT = join(PKG, "src/build.ts");

/** Criterion 7 names this instant literally. */
const PINNED_BUILT_AT = "2026-08-04T16:05:35.000Z";

/**
 * Criterion 1: "the set of states this brief's `## Handoff` names as
 * deliberately left blank". The Handoff blanks six states for lack of a
 * defensible, kid-recognisable, non-battle-site pick — see the Handoff for the
 * reason given for each.
 */
const HANDOFF_BLANKS: string[] = ["DE", "IA", "KS", "MS", "OK", "RI"];

/**
 * Criterion 12: the Handoff's 50-row table, postal → the exact `landmark`
 * string it claims was shipped, for the 44 states that are not blank.
 * Transcribed from the brief, not from the data.
 */
const HANDOFF_LANDMARKS: Record<string, string> = {
  AL: "U.S. Space & Rocket Center",
  AK: "Denali",
  AZ: "Grand Canyon",
  AR: "Crater of Diamonds State Park",
  CA: "Golden Gate Bridge",
  CO: "Rocky Mountain National Park",
  CT: "Mystic Aquarium",
  FL: "Walt Disney World",
  GA: "Georgia Aquarium",
  HI: "Diamond Head",
  ID: "Craters of the Moon National Monument",
  IL: "Willis Tower",
  IN: "Indianapolis Motor Speedway",
  KY: "Mammoth Cave National Park",
  LA: "St. Louis Cathedral",
  ME: "Acadia National Park",
  MD: "Fort McHenry",
  MA: "Plymouth Rock",
  MI: "Mackinac Bridge",
  MN: "Mall of America",
  MO: "Gateway Arch",
  MT: "Glacier National Park",
  NE: "Chimney Rock",
  NV: "Hoover Dam",
  NH: "Mount Washington",
  NJ: "Atlantic City Boardwalk",
  NM: "Carlsbad Caverns National Park",
  NY: "Statue of Liberty",
  NC: "Wright Brothers National Memorial",
  ND: "Theodore Roosevelt National Park",
  OH: "Rock and Roll Hall of Fame",
  OR: "Crater Lake National Park",
  PA: "Liberty Bell",
  SC: "Angel Oak",
  SD: "Mount Rushmore",
  TN: "Great Smoky Mountains National Park",
  TX: "Space Center Houston",
  UT: "Arches National Park",
  VT: "Ben & Jerry's Factory",
  VA: "Mount Vernon",
  WA: "Space Needle",
  WV: "New River Gorge Bridge",
  WI: "Lambeau Field",
  WY: "Yellowstone National Park",
};

/**
 * Criterion 11: the Handoff's "self-naming" list — states whose landmark
 * value contains that state's own name, case-insensitively.
 * "Indianapolis" contains "Indiana" as a prefix; "Georgia Aquarium" names
 * Georgia outright.
 */
const SELF_NAMING_STATES: string[] = ["GA", "IN"];

/**
 * Criterion 12: the Handoff's "spans more than one state" disclosure —
 * postal → which other state(s) the landmark also lies in or borders.
 * Transcribed from the brief.
 */
const MULTI_STATE_SPANS: Record<string, string> = {
  TN: "Great Smoky Mountains National Park also lies in North Carolina",
  NV: "Hoover Dam sits on the Nevada–Arizona border",
  WY: "Yellowstone National Park also extends into Montana and Idaho",
};

interface TrackedEntity {
  id: string;
  name: string;
  region?: string;
  climate_kid?: string;
  state_animal?: string;
  landmark?: string;
  top_crops?: unknown[];
  fun_facts?: unknown[];
  sources?: { built_at?: string };
}

function git(args: string[]): { status: number; stdout: string } {
  const proc = Bun.spawnSync(["git", ...args], { cwd: REPO });
  return { status: proc.exitCode, stdout: proc.stdout.toString() };
}

/** Throws rather than returning `[]`: an empty list would make the loops vacuous. */
function trackedUnder(path: string): string[] {
  const { status, stdout } = git(["ls-files", path]);
  if (status !== 0) throw new Error(`git ls-files ${path} exited ${status}`);
  const paths = stdout.split("\n").filter(Boolean);
  if (paths.length === 0) throw new Error(`nothing tracked under ${path}`);
  return paths;
}

/** The 50 `us-state-<postal>.json` files the criteria are written about. */
function trackedStateFiles(): { postal: string; file: string; entity: TrackedEntity }[] {
  const files = trackedUnder("question-bank/data/us-states")
    .map((p) => p.split("/").pop() as string)
    .filter((n) => n !== "index.json")
    .sort();
  if (files.length !== 50) throw new Error(`expected 50 entity files, found ${files.length}`);
  return files.map((file) => ({
    postal: (file.match(/^us-state-([a-z]{2})\.json$/)?.[1] as string).toUpperCase(),
    file,
    entity: JSON.parse(readFileSync(join(DATA_DIR, file), "utf8")) as TrackedEntity,
  }));
}

/** Only the states that actually carry the key — criterion 2 allows absence. */
function trackedLandmarks(): { postal: string; file: string; value: string }[] {
  return trackedStateFiles()
    .filter(({ entity }) => entity.landmark !== undefined)
    .map(({ postal, file, entity }) => ({ postal, file, value: entity.landmark as string }));
}

// ---------------------------------------------------------------------------
// The predicates the criteria define, kept separate from the data so their own
// boundaries can be tested. Criterion 3 names 3/4 and 48/49 by hand; a checker
// that is wrong at the boundary would pass the bank for the wrong reason.
// ---------------------------------------------------------------------------

/** Criterion 3: "between 4 and 48 characters inclusive". */
const lengthOk = (value: string) => value.length >= 4 && value.length <= 48;

/** Criterion 3: "begins with an uppercase letter". */
const startsWithUppercase = (value: string) => /^\p{Lu}/u.test(value);

/** Criterion 3: "is not entirely uppercase". */
const notAllCaps = (value: string) => value !== value.toUpperCase();

/** Criterion 4: comma, semicolon, colon, parenthesis, slash. */
const FORBIDDEN_PUNCTUATION = /[,;:()/]/;

/** Criterion 4: "none ends with a full stop (an interior one … is fine)". */
const endsWithFullStop = (value: string) => value.endsWith(".");

/** Criterion 4, verbatim and case-insensitive. */
const FORBIDDEN_WORDS = [
  "located",
  "famous",
  "tourist",
  "attraction",
  "known for",
  "national register",
  "you can",
  "is a ",
];

const forbiddenWordsIn = (value: string) =>
  FORBIDDEN_WORDS.filter((word) => value.toLowerCase().includes(word));

describe("T-013 criterion 1 — every state is accounted for, and no blank is silent", () => {
  test("the Handoff names exactly six states as deliberately blank", () => {
    expect(HANDOFF_BLANKS.slice().sort()).toEqual(["DE", "IA", "KS", "MS", "OK", "RI"]);
  });

  test("exactly the Handoff's declared blanks have no landmark key", () => {
    const without = trackedStateFiles()
      .filter(({ entity }) => entity.landmark === undefined)
      .map(({ postal }) => postal)
      .sort();
    expect(without).toEqual([...HANDOFF_BLANKS].sort());
  });

  test("exactly 50 − k tracked files carry the key, where k is the number the Handoff declares blank", () => {
    expect(trackedLandmarks()).toHaveLength(50 - HANDOFF_BLANKS.length);
  });

  test("the states carrying the key are exactly the 50 curated states minus the declared blanks", () => {
    const carried = trackedLandmarks()
      .map(({ postal }) => postal)
      .sort();
    const expected = CURATED_US_STATES.map((s) => s.postal)
      .filter((p) => !HANDOFF_BLANKS.includes(p))
      .sort();
    expect(expected).toHaveLength(50 - HANDOFF_BLANKS.length);
    expect(carried).toEqual(expected);
  });

  test("Colorado is not among the declared blanks", () => {
    expect(HANDOFF_BLANKS).not.toContain("CO");
  });
});

describe("T-013 criterion 2 — a blank is an absent key, not an empty one", () => {
  test("no tracked file carries landmark as an empty string, null or a placeholder word", () => {
    for (const { file, entity } of trackedStateFiles()) {
      const value = entity.landmark;
      if (value === undefined) continue;
      expect({ file, value }).not.toEqual({ file, value: "" });
      expect({ file, value }).not.toEqual({ file, value: null as unknown as string });
      const lowered = String(value).toLowerCase();
      expect({ file, lowered }).not.toEqual({ file, lowered: "unknown" });
      expect({ file, lowered }).not.toEqual({ file, lowered: "none" });
    }
  });

  test("every carried landmark is a non-empty string", () => {
    const landmarks = trackedLandmarks();
    expect(landmarks.length).toBeGreaterThan(0);
    for (const { file, value } of landmarks) {
      expect({ file, type: typeof value }).toEqual({ file, type: "string" });
      expect({ file, empty: value.length === 0 }).toEqual({ file, empty: false });
    }
  });

  test("a state the Handoff declares blank has no landmark key at all", () => {
    for (const postal of HANDOFF_BLANKS) {
      const entity = JSON.parse(
        readFileSync(join(DATA_DIR, `us-state-${postal.toLowerCase()}.json`), "utf8"),
      ) as TrackedEntity;
      expect({ postal, hasKey: Object.hasOwn(entity, "landmark") }).toEqual({
        postal,
        hasKey: false,
      });
    }
  });
});

describe("T-013 criterion 3 — every value is a name a child could be shown, not prose", () => {
  test("the length check is right at the boundaries the criterion names (3 no, 4 yes, 48 yes, 49 no)", () => {
    expect(lengthOk("x".repeat(3))).toBe(false);
    expect(lengthOk("x".repeat(4))).toBe(true);
    expect(lengthOk("x".repeat(48))).toBe(true);
    expect(lengthOk("x".repeat(49))).toBe(false);
  });

  test("the starts-with-uppercase and not-all-caps checks reject the cases they name", () => {
    expect(startsWithUppercase("Denali")).toBe(true);
    expect(startsWithUppercase("denali")).toBe(false);
    expect(startsWithUppercase(" Denali")).toBe(false);
    expect(notAllCaps("Denali")).toBe(true);
    expect(notAllCaps("DENALI")).toBe(false);
  });

  test("every landmark is between 4 and 48 characters inclusive", () => {
    for (const { file, value } of trackedLandmarks()) {
      expect({ file, length: value.length, ok: lengthOk(value) }).toEqual({
        file,
        length: value.length,
        ok: true,
      });
    }
  });

  test("every landmark equals its own trim(), has no double space, and no newline or tab", () => {
    for (const { file, value } of trackedLandmarks()) {
      expect({ file, trimmed: value === value.trim() }).toEqual({ file, trimmed: true });
      expect({ file, doubleSpace: value.includes("  ") }).toEqual({ file, doubleSpace: false });
      expect({ file, whitespace: /[\n\t]/.test(value) }).toEqual({ file, whitespace: false });
    }
  });

  test("every landmark begins with an uppercase letter and is not entirely uppercase", () => {
    for (const { file, value } of trackedLandmarks()) {
      expect({ file, value, ok: startsWithUppercase(value) }).toEqual({ file, value, ok: true });
      expect({ file, value, ok: notAllCaps(value) }).toEqual({ file, value, ok: true });
    }
  });
});

describe("T-013 criterion 4 — no value is reference-book prose, a citation or a location gloss", () => {
  test("the criterion's own worked examples land on the right side of the checks", () => {
    const passes = (value: string) =>
      !FORBIDDEN_PUNCTUATION.test(value) &&
      !endsWithFullStop(value) &&
      forbiddenWordsIn(value).length === 0;

    expect(passes("Great Smoky Mountains National Park")).toBe(true);
    expect(passes("The Alamo, in San Antonio")).toBe(false);
    expect(passes("Gateway Arch (St. Louis, Missouri)")).toBe(false);
  });

  test("an interior full stop (St. Louis, Jr.) does not trip the ends-with check", () => {
    expect(endsWithFullStop("St. Louis Cathedral")).toBe(false);
    expect(endsWithFullStop("Gateway Arch.")).toBe(true);
  });

  test("every forbidden phrase is actually caught, case-insensitively", () => {
    for (const word of FORBIDDEN_WORDS) {
      expect({ word, caught: forbiddenWordsIn(`Some ${word.toUpperCase()} thing`) }).toEqual({
        word,
        caught: [word],
      });
    }
  });

  test("no landmark contains a comma, semicolon, colon, parenthesis or slash", () => {
    for (const { file, value } of trackedLandmarks()) {
      expect({ file, value, punctuation: FORBIDDEN_PUNCTUATION.test(value) }).toEqual({
        file,
        value,
        punctuation: false,
      });
    }
  });

  test("no landmark contains the substring http", () => {
    for (const { file, value } of trackedLandmarks()) {
      expect({ file, value, hasHttp: value.toLowerCase().includes("http") }).toEqual({
        file,
        value,
        hasHttp: false,
      });
    }
  });

  test("no landmark ends with a full stop", () => {
    for (const { file, value } of trackedLandmarks()) {
      expect({ file, value, endsWithStop: endsWithFullStop(value) }).toEqual({
        file,
        value,
        endsWithStop: false,
      });
    }
  });

  test("no landmark contains any of the eight forbidden phrases", () => {
    for (const { file, value } of trackedLandmarks()) {
      expect({ file, value, hits: forbiddenWordsIn(value) }).toEqual({ file, value, hits: [] });
    }
  });
});

describe("T-013 criterion 5 — no two states share a landmark, and none contains another", () => {
  test("the criterion's own worked example is caught: Yellowstone alongside Yellowstone National Park", () => {
    const a = "yellowstone";
    const b = "yellowstone national park";
    expect(b.includes(a)).toBe(true);
  });

  test("all 44 shipped landmark values are distinct, case-insensitively, after trimming", () => {
    const values = trackedLandmarks().map(({ value }) => value.trim().toLowerCase());
    expect(values.length).toBeGreaterThan(0);
    expect(new Set(values).size).toBe(values.length);
  });

  test("no shipped landmark value is a case-insensitive substring of any other", () => {
    const landmarks = trackedLandmarks();
    for (const a of landmarks) {
      for (const b of landmarks) {
        if (a.postal === b.postal) continue;
        const lowerA = a.value.trim().toLowerCase();
        const lowerB = b.value.trim().toLowerCase();
        expect({
          a: a.postal,
          b: b.postal,
          aInB: lowerB.includes(lowerA),
        }).toEqual({ a: a.postal, b: b.postal, aInB: false });
      }
    }
  });
});

describe("T-013 criterion 6 — the text lives in the build input, not in built output", () => {
  test("every value in a tracked file appears verbatim as a landmark in the curated table", () => {
    const curated = new Set(
      CURATED_US_STATES.map((s) => s.landmark).filter((v): v is string => v !== undefined),
    );
    const landmarks = trackedLandmarks();
    expect(landmarks.length).toBeGreaterThan(0);
    for (const { file, value } of landmarks) {
      expect({ file, value, inCurated: curated.has(value) }).toEqual({
        file,
        value,
        inCurated: true,
      });
    }
  });

  test("every curated landmark appears in its own state's tracked file, matched by postal, and nowhere else", () => {
    const byPostal = new Map(trackedLandmarks().map(({ postal, value }) => [postal, value]));
    const rows = CURATED_US_STATES.filter((s) => s.landmark !== undefined);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect({ postal: row.postal, value: byPostal.get(row.postal) }).toEqual({
        postal: row.postal,
        value: row.landmark as string,
      });
    }
  });

  test("no tracked file carries a curated value belonging to a state that does not declare it", () => {
    const declared = new Map(CURATED_US_STATES.map((s) => [s.postal, s.landmark] as const));
    for (const { postal, file, value } of trackedLandmarks()) {
      expect({ file, declaredByItsOwnRow: declared.get(postal) === value }).toEqual({
        file,
        declaredByItsOwnRow: true,
      });
    }
  });

  test("the curated source file contains each shipped string verbatim", () => {
    const source = readFileSync(join(PKG, "src/curated/us-states.ts"), "utf8");
    for (const { file, value } of trackedLandmarks()) {
      expect({ file, verbatim: source.includes(`landmark: ${JSON.stringify(value)}`) }).toEqual({
        file,
        verbatim: true,
      });
    }
  });
});

describe("T-013 criterion 7 — the bank is built, not hand-edited", () => {
  const PATHS = [
    "index.json",
    ...CURATED_US_STATES.map((s) => `us-state-${s.postal.toLowerCase()}.json`),
  ];

  // Runs the real CLI offline into a throwaway directory. Nothing is mocked.
  // `rebuildOffline` (T-014 criterion 16(a)) is the harness shared with
  // `committed-bank.test.ts`, `state-animals.test.ts` and
  // `landmarks-verify.test.ts`.
  const first = rebuildOffline(BUILD_SCRIPT, PATHS, "t013-rebuild-");
  const second = rebuildOffline(BUILD_SCRIPT, PATHS, "t013-rebuild-");

  test("the offline rebuild writes all 51 paths", () => {
    expect(PATHS).toHaveLength(51);
    expect(first.size).toBe(51);
  });

  test("two offline rebuilds in a row are byte-identical to each other", () => {
    expect([...second.entries()].sort()).toEqual([...first.entries()].sort());
  });

  for (const name of [
    "index.json",
    ...CURATED_US_STATES.map((s) => `us-state-${s.postal.toLowerCase()}.json`),
  ]) {
    test(`${name} on disk is byte-identical to the offline rebuild`, () => {
      expect(readFileSync(join(DATA_DIR, name), "utf8")).toBe(first.get(name) as string);
    });
  }

  test(`sources.built_at is ${PINNED_BUILT_AT} in every tracked file`, () => {
    for (const { file, entity } of trackedStateFiles()) {
      expect({ file, builtAt: entity.sources?.built_at }).toEqual({
        file,
        builtAt: PINNED_BUILT_AT,
      });
    }
  });
});

describe("T-013 criterion 8 — the committed sample stays in step with the bank", () => {
  const stripBuiltAt = (entity: TrackedEntity) => {
    const { sources, ...rest } = entity;
    const { built_at: _dropped, ...restSources } = sources ?? {};
    return { ...rest, sources: restSources };
  };
  const tracked = () =>
    JSON.parse(readFileSync(join(DATA_DIR, "us-state-co.json"), "utf8")) as TrackedEntity;
  const sample = () =>
    JSON.parse(readFileSync(join(PKG, "sample-data/us-state-co.json"), "utf8")) as TrackedEntity;

  test("sample-data/us-state-co.json equals the tracked Colorado in every field but sources.built_at", () => {
    expect(stripBuiltAt(sample())).toEqual(stripBuiltAt(tracked()));
  });

  test("the sample carries the same landmark as the tracked Colorado", () => {
    expect(sample().landmark).toBe(tracked().landmark as string);
    expect(sample().landmark).toBe("Rocky Mountain National Park");
  });
});

describe("T-013 criterion 9 — nothing but landmark moves in the bank (tree-shaped pieces)", () => {
  test("the set of states carrying climate_kid is exactly all 50 — T-014 filled the rest", () => {
    // Was `["Colorado"]` at this task's (T-013's) own landing; T-014
    // (2026-09-17, a later approved task) filled the other 49 with no blanks,
    // so the ground truth this test compares against moved from one name to
    // all 50, the same way `state-animals.test.ts`'s own landmark-coverage
    // assertion moved for this task. Still an exact-equality comparison
    // against a named list, not loosened to a count.
    const named = trackedStateFiles()
      .filter(({ entity }) => entity.climate_kid !== undefined)
      .map(({ entity }) => entity.name)
      .sort();
    expect(named).toEqual(CURATED_US_STATES.map((s) => s.name).sort());
  });

  test("all 50 tracked files still carry a non-empty state_animal", () => {
    for (const { file, entity } of trackedStateFiles()) {
      expect({ file, hasAnimal: typeof entity.state_animal === "string" && entity.state_animal.length > 0 }).toEqual({
        file,
        hasAnimal: true,
      });
    }
  });

  test("top_crops is still an empty array in all 50 tracked files — T-015 owns it", () => {
    for (const { file, entity } of trackedStateFiles()) {
      expect({ file, topCrops: entity.top_crops }).toEqual({ file, topCrops: [] });
    }
  });

  test("index.json carries no landmark and keeps its own five-key entity shape", () => {
    const raw = readFileSync(join(DATA_DIR, "index.json"), "utf8");
    expect(raw).not.toContain("landmark");
    const index = JSON.parse(raw) as { count: number; entities: Record<string, unknown>[] };
    expect(Object.keys(index).sort()).toEqual(["count", "entities"]);
    expect(index.count).toBe(50);
    for (const entry of index.entities) {
      expect(Object.keys(entry).sort()).toEqual(["geometry_id", "id", "name", "scope", "type"]);
    }
  });

  test("no tracked entity file has grown a key outside the schema this task may touch", () => {
    const allowed = new Set([
      "id",
      "type",
      "scope",
      "name",
      "capital",
      "geometry_id",
      "region",
      "centroid",
      "population",
      "population_rank",
      "area_km2",
      "area_rank",
      "borders",
      "climate_kid",
      "state_animal",
      "landmark",
      "highest_point",
      "highest_point_m",
      "top_crops",
      "fun_facts",
      "sources",
    ]);
    for (const { file, entity } of trackedStateFiles()) {
      const unexpected = Object.keys(entity).filter((k) => !allowed.has(k));
      expect({ file, unexpected }).toEqual({ file, unexpected: [] });
    }
  });
});

describe("T-013 criterion 10 — Colorado's landmark is unchanged", () => {
  test("the curated table still carries exactly Rocky Mountain National Park for Colorado", () => {
    const co = CURATED_US_STATES.find((s) => s.postal === "CO");
    expect(co?.landmark).toBe("Rocky Mountain National Park");
  });

  test("the tracked Colorado file carries exactly Rocky Mountain National Park", () => {
    const entity = JSON.parse(readFileSync(join(DATA_DIR, "us-state-co.json"), "utf8")) as TrackedEntity;
    expect(entity.landmark).toBe("Rocky Mountain National Park");
  });
});

describe("T-013 criterion 11 — a landmark that names its own state is disclosed, not hidden", () => {
  /** Computed straight from the tracked bank, independent of the Handoff's own claim. */
  function computedSelfNaming(): string[] {
    const byPostal = new Map(CURATED_US_STATES.map((s) => [s.postal, s.name] as const));
    return trackedLandmarks()
      .filter(({ postal, value }) => {
        const name = byPostal.get(postal);
        return name !== undefined && value.toLowerCase().includes(name.toLowerCase());
      })
      .map(({ postal }) => postal)
      .sort();
  }

  test("the Handoff's self-naming list is exactly the states whose landmark contains their own state's name", () => {
    expect(computedSelfNaming()).toEqual([...SELF_NAMING_STATES].sort());
  });

  test("Colorado's landmark contains no state name — the hypothetical the criterion contrasts against", () => {
    expect("Rocky Mountain National Park".toLowerCase().includes("colorado")).toBe(false);
  });

  test("Indianapolis Motor Speedway is flagged because Indianapolis contains Indiana as a prefix", () => {
    expect("indianapolis motor speedway".includes("indiana")).toBe(true);
  });
});

describe("T-013 criterion 12 — everything a child will read can be read in one place", () => {
  test("the Handoff's table plus its blanks names all 50 states, with no overlap", () => {
    const filled = Object.keys(HANDOFF_LANDMARKS).sort();
    const blanks = [...HANDOFF_BLANKS].sort();
    expect(filled.length + blanks.length).toBe(50);
    expect(new Set([...filled, ...blanks]).size).toBe(50);
    expect([...filled, ...blanks].sort()).toEqual(CURATED_US_STATES.map((s) => s.postal).sort());
  });

  test("every string the Handoff's table claims is the string actually shipped for that state", () => {
    const byPostal = new Map(trackedLandmarks().map(({ postal, value }) => [postal, value]));
    for (const [postal, value] of Object.entries(HANDOFF_LANDMARKS)) {
      expect({ postal, shipped: byPostal.get(postal) }).toEqual({ postal, shipped: value });
    }
  });

  test("no state ships a value the Handoff's table does not mention", () => {
    for (const { postal, file, value } of trackedLandmarks()) {
      expect({ file, declared: HANDOFF_LANDMARKS[postal] }).toEqual({ file, declared: value });
    }
  });

  test("the Handoff discloses at least the border-straddling cases the brief names by example", () => {
    // Constraints: "Great Smoky Mountains National Park is TN and NC, Yellowstone
    // is mostly WY". Both are shipped here (TN, WY), and each is disclosed.
    expect(Object.keys(MULTI_STATE_SPANS)).toEqual(expect.arrayContaining(["TN", "WY"]));
    for (const postal of Object.keys(MULTI_STATE_SPANS)) {
      expect(HANDOFF_LANDMARKS[postal]).toBeDefined();
    }
  });
});

describe("T-013 criterion 13 — nothing unreviewed, live or new is committed", () => {
  test('no file tracked under question-bank/data/ or sample-data/ contains reviewed": false', () => {
    const paths = [
      ...trackedUnder("question-bank/data"),
      ...trackedUnder("question-bank/sample-data"),
    ];
    expect(paths.length).toBeGreaterThan(51);
    for (const path of paths) {
      expect({
        path,
        unreviewed: readFileSync(join(REPO, path), "utf8").includes('reviewed": false'),
      }).toEqual({ path, unreviewed: false });
    }
  });

  test("no *.review.json path under question-bank/data/us-states/ is tracked", () => {
    const reviews = trackedUnder("question-bank/data/us-states").filter((p) =>
      p.endsWith(".review.json"),
    );
    expect(reviews).toEqual([]);
  });

  test("question-bank/package.json still declares no runtime dependency and the same two devDependencies", () => {
    const pkg = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies ?? {}).toEqual({});
    expect(Object.keys(pkg.devDependencies ?? {}).sort()).toEqual(["@types/bun", "typescript"]);
  });

  test("no test file in question-bank/src mocks fetch or issues a request", () => {
    const tests = trackedUnder("question-bank/src").filter((p) => p.endsWith(".test.ts"));
    expect(tests.length).toBeGreaterThan(0);
    for (const path of tests) {
      const source = readFileSync(join(REPO, path), "utf8");
      // Comments saying "nothing mocks `fetch`" are fine; a call or an
      // assignment to it is not.
      expect({ path, calls: /\bfetch\s*\(/.test(source) }).toEqual({ path, calls: false });
      expect({ path, stubs: /fetch\s*=/.test(source) }).toEqual({ path, stubs: false });
      expect({ path, mocks: /mock\s*\(\s*["']node:https?/.test(source) }).toEqual({
        path,
        mocks: false,
      });
    }
  });
});

describe("T-013 criterion 14 — nothing already verified is weakened", () => {
  /**
   * Counts pinned from the five protected suites as they stand at this task's
   * branch point, so a later deletion shows up without needing git history (CI
   * clones shallow). This task touched `state-animals.test.ts` once — to update
   * one T-012 assertion whose expected value was superseded by this task's own
   * criterion 1 (see the comment at that test) — which only *added* tests and
   * expects, never removed any; the pinned floor below reflects that.
   * "No assertion loosened" for the other four files (which this task does not
   * touch at all) is a diff property and is checked in the brief's Verdict
   * instead.
   *
   * `committed-bank.test.ts`'s own expect-count floor was lowered from 60 to
   * 58 by T-014, criterion 16(a): two inline `expect(proc.exitCode).toBe(0)`
   * calls moved into the shared `rebuildOffline` helper (`offline-rebuild.ts`),
   * which throws on a non-zero exit instead — the check still fails the test,
   * just without its own `expect(` line in this file. That extraction is
   * named exempt from "loosened" by the criterion itself.
   */
  const PINNED: Record<string, { tests: number; expects: number }> = {
    "committed-bank.test.ts": { tests: 33, expects: 58 },
    "data-us-states.test.ts": { tests: 6, expects: 14 },
    "fun-facts.test.ts": { tests: 30, expects: 59 },
    "normalize.test.ts": { tests: 14, expects: 31 },
    "state-animals.test.ts": { tests: 43, expects: 73 },
  };

  for (const [file, counts] of Object.entries(PINNED)) {
    test(`${file} still declares at least its ${counts.tests} tests and ${counts.expects} expectations`, () => {
      const source = readFileSync(join(PKG, "src", file), "utf8");
      expect({
        file,
        tests: [...source.matchAll(/^\s*test(\.\w+)?\(/gm)].length >= counts.tests,
        expects: [...source.matchAll(/expect\(/g)].length >= counts.expects,
      }).toEqual({ file, tests: true, expects: true });
    });
  }

  test("nothing outside question-bank/ is touched by this task's tests — no frontend or backend import", () => {
    const source = readFileSync(join(PKG, "src/landmarks.test.ts"), "utf8");
    expect(/from "\.\.\/\.\.\//.test(source)).toBe(false);
  });
});
