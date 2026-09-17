import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";
import { rebuildOffline } from "./offline-rebuild";

/**
 * T-012 verification (tester). Written from the acceptance criteria in
 * `tasks/T-012-curate-state-animals.md`, not from the implementation: every
 * bound below — 3–40 characters, the forbidden punctuation set, the nine
 * forbidden words, the pinned `built_at`, the 51 rebuilt paths — is quoted from
 * a criterion rather than read off the curated table or the built bank.
 *
 * The two tables transcribed into this file (`HANDOFF_ANIMALS` and
 * `DISCLOSED_DUPLICATES`) are copied from the brief's `## Handoff`, which is
 * itself a deliverable under criteria 1, 9 and 10. They are the *claim*; the
 * tracked bank is the *fact*, and these tests compare the two. They are
 * transcribed rather than read from `tasks/` at run time because the reviewer
 * deletes the brief at sweep (`process.md` step 6) and a test that reads a file
 * which later disappears is a test that later stops meaning anything.
 *
 * Nothing here reaches the network: the one thing it runs is the build CLI with
 * `--offline` and all six proxy spellings pointed at a dead loopback port, the
 * same trick CI uses (`test-guidelines.md`). Nothing mocks `fetch`. Nothing
 * writes inside `question-bank/` — the rebuild goes to a temp dir.
 *
 * What a shape test cannot do is check that an animal is *actually* that
 * state's. The brief's "Review checklist" owns that and only a person can close
 * it (`process-decisions.md` D-4a).
 *
 * Three criteria are properties of *this branch's diff* rather than of the
 * tree, and are recorded in the brief's Verdict with `git diff` instead of
 * being committed here — the precedent is `committed-bank.test.ts`'s closing
 * comment on T-010 criteria 17–18: CI checks out at `fetch-depth: 1`, so
 * `origin/main` does not exist there and a diff-based test would pass
 * vacuously. Those parts are criterion 8's "only difference from the default
 * branch", criterion 11's "no package.json or lockfile gains a dependency" and
 * criterion 12's "no test is deleted or loosened". Each still gets a
 * tree-shaped test below that runs everywhere.
 */
const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");
const BUILD_SCRIPT = join(PKG, "src/build.ts");

/** Criterion 6 names this instant literally. */
const PINNED_BUILT_AT = "2026-08-04T16:05:35.000Z";

/**
 * Criterion 1: "the set of states this brief's `## Handoff` names as
 * deliberately left blank". T-012's Handoff names none — "**No state was left
 * blank.**" — so this list is empty, and all 50 files must carry the key. A
 * later task that deliberately blanks a state has to argue with this constant.
 */
const HANDOFF_BLANKS: string[] = [];

/**
 * Criterion 10: the Handoff's 50-row table, postal → the exact `state_animal`
 * string it claims was shipped. Transcribed from the brief, not from the data.
 */
const HANDOFF_ANIMALS: Record<string, string> = {
  AL: "American black bear",
  AK: "Moose",
  AZ: "Ringtail",
  AR: "White-tailed deer",
  CA: "California grizzly bear",
  CO: "Rocky Mountain bighorn sheep",
  CT: "Sperm whale",
  DE: "Gray fox",
  FL: "Florida panther",
  GA: "White-tailed deer",
  HI: "Hawaiian monk seal",
  ID: "Mountain bluebird",
  IL: "White-tailed deer",
  IN: "Northern cardinal",
  IA: "American goldfinch",
  KS: "American bison",
  KY: "Gray squirrel",
  LA: "Black bear",
  ME: "Moose",
  MD: "Baltimore oriole",
  MA: "Right whale",
  MI: "White-tailed deer",
  MN: "Common loon",
  MS: "White-tailed deer",
  MO: "Mule",
  MT: "Grizzly bear",
  NE: "White-tailed deer",
  NV: "Desert bighorn sheep",
  NH: "White-tailed deer",
  NJ: "Horse",
  NM: "American black bear",
  NY: "Beaver",
  NC: "Eastern gray squirrel",
  ND: "Western meadowlark",
  OH: "White-tailed deer",
  OK: "American bison",
  OR: "Beaver",
  PA: "White-tailed deer",
  RI: "Harbor seal",
  SC: "White-tailed deer",
  SD: "Coyote",
  TN: "Raccoon",
  TX: "Armadillo",
  UT: "Rocky Mountain elk",
  VT: "Morgan horse",
  VA: "Virginia big-eared bat",
  WA: "Orca",
  WV: "American black bear",
  WI: "American badger",
  WY: "American bison",
};

/**
 * Criterion 9: the Handoff's "Duplicate groups" table — every value it says two
 * or more states carry, with the states sharing it. Transcribed from the brief.
 */
const DISCLOSED_DUPLICATES: Record<string, string[]> = {
  "American black bear": ["AL", "NM", "WV"],
  Moose: ["AK", "ME"],
  "White-tailed deer": ["AR", "GA", "IL", "MI", "MS", "NE", "NH", "OH", "PA", "SC"],
  "American bison": ["KS", "OK", "WY"],
  Beaver: ["NY", "OR"],
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
function trackedAnimals(): { postal: string; file: string; value: string }[] {
  return trackedStateFiles()
    .filter(({ entity }) => entity.state_animal !== undefined)
    .map(({ postal, file, entity }) => ({ postal, file, value: entity.state_animal as string }));
}

// ---------------------------------------------------------------------------
// The predicates the criteria define, kept separate from the data so their own
// boundaries can be tested. Criterion 3 names 2/3 and 40/41 by hand; a checker
// that is wrong at the boundary would pass the bank for the wrong reason.
// ---------------------------------------------------------------------------

/** Criterion 3: "between 3 and 40 characters inclusive". */
const lengthOk = (value: string) => value.length >= 3 && value.length <= 40;

/** Criterion 3: "starts with a letter". */
const startsWithLetter = (value: string) => /^\p{L}/u.test(value);

/** Criterion 3: "is not entirely uppercase". */
const notAllCaps = (value: string) => value !== value.toUpperCase();

/** Criterion 4: "a parenthesis, a comma, a semicolon, a colon, or a full stop". */
const FORBIDDEN_PUNCTUATION = /[(),;:.]/;

/** Criterion 4, verbatim and case-insensitive. */
const FORBIDDEN_WORDS = [
  "spp.",
  "subspecies",
  "genus",
  "endemic",
  "state animal",
  "state mammal",
  "official",
  "designated",
  "adopted",
];

const forbiddenWordsIn = (value: string) =>
  FORBIDDEN_WORDS.filter((word) => value.toLowerCase().includes(word));

describe("T-012 criterion 1 — every state is accounted for, and no blank is silent", () => {
  test("the Handoff names no state as deliberately blank, so all 50 tracked files carry state_animal", () => {
    expect(HANDOFF_BLANKS).toEqual([]);
    const without = trackedStateFiles()
      .filter(({ entity }) => entity.state_animal === undefined)
      .map(({ postal }) => postal)
      .sort();
    expect(without).toEqual([...HANDOFF_BLANKS].sort());
  });

  test("exactly 50 − k tracked files carry the key, where k is the number the Handoff declares blank", () => {
    expect(trackedAnimals()).toHaveLength(50 - HANDOFF_BLANKS.length);
  });

  test("the states carrying the key are exactly the 50 curated states, one file each", () => {
    const carried = trackedAnimals()
      .map(({ postal }) => postal)
      .sort();
    const expected = CURATED_US_STATES.map((s) => s.postal)
      .filter((p) => !HANDOFF_BLANKS.includes(p))
      .sort();
    expect(expected).toHaveLength(50 - HANDOFF_BLANKS.length);
    expect(carried).toEqual(expected);
  });
});

describe("T-012 criterion 2 — a blank is an absent key, not an empty one", () => {
  test("no tracked file carries state_animal as an empty string, null or \"unknown\"", () => {
    for (const { file, entity } of trackedStateFiles()) {
      const value = entity.state_animal;
      if (value === undefined) continue;
      expect({ file, value }).not.toEqual({ file, value: "" });
      expect({ file, value }).not.toEqual({ file, value: null as unknown as string });
      expect({ file, lowered: String(value).toLowerCase() }).not.toEqual({
        file,
        lowered: "unknown",
      });
    }
  });

  test("every carried state_animal is a non-empty string", () => {
    const animals = trackedAnimals();
    expect(animals.length).toBeGreaterThan(0);
    for (const { file, value } of animals) {
      expect({ file, type: typeof value }).toEqual({ file, type: "string" });
      expect({ file, empty: value.length === 0 }).toEqual({ file, empty: false });
    }
  });

  test("a state the Handoff declares blank has no state_animal key at all", () => {
    for (const postal of HANDOFF_BLANKS) {
      const entity = JSON.parse(
        readFileSync(join(DATA_DIR, `us-state-${postal.toLowerCase()}.json`), "utf8"),
      ) as TrackedEntity;
      expect({ postal, hasKey: Object.hasOwn(entity, "state_animal") }).toEqual({
        postal,
        hasKey: false,
      });
    }
  });
});

describe("T-012 criterion 3 — every value is a kid-sized common name", () => {
  test("the length check is right at the boundaries the criterion names (2 no, 3 yes, 40 yes, 41 no)", () => {
    expect(lengthOk("x".repeat(2))).toBe(false);
    expect(lengthOk("x".repeat(3))).toBe(true);
    expect(lengthOk("x".repeat(40))).toBe(true);
    expect(lengthOk("x".repeat(41))).toBe(false);
  });

  test("the starts-with-a-letter and not-all-caps checks reject the cases they name", () => {
    expect(startsWithLetter("Elk")).toBe(true);
    expect(startsWithLetter("-eared bat")).toBe(false);
    expect(startsWithLetter(" Elk")).toBe(false);
    expect(notAllCaps("Elk")).toBe(true);
    expect(notAllCaps("ELK")).toBe(false);
  });

  test("every state_animal is between 3 and 40 characters inclusive", () => {
    for (const { file, value } of trackedAnimals()) {
      expect({ file, length: value.length, ok: lengthOk(value) }).toEqual({
        file,
        length: value.length,
        ok: true,
      });
    }
  });

  test("every state_animal equals its own trim() and contains no newline or tab", () => {
    for (const { file, value } of trackedAnimals()) {
      expect({ file, trimmed: value === value.trim() }).toEqual({ file, trimmed: true });
      expect({ file, whitespace: /[\n\t]/.test(value) }).toEqual({ file, whitespace: false });
    }
  });

  test("no state_animal contains a digit", () => {
    for (const { file, value } of trackedAnimals()) {
      expect({ file, value, digit: /\d/.test(value) }).toEqual({ file, value, digit: false });
    }
  });

  test("every state_animal starts with a letter and is not entirely uppercase", () => {
    for (const { file, value } of trackedAnimals()) {
      expect({ file, value, ok: startsWithLetter(value) }).toEqual({ file, value, ok: true });
      expect({ file, value, ok: notAllCaps(value) }).toEqual({ file, value, ok: true });
    }
  });
});

describe("T-012 criterion 4 — no value is reference-book prose or a scientific name", () => {
  test("the criterion's own worked examples land on the right side of the checks", () => {
    const passes = (value: string) =>
      !FORBIDDEN_PUNCTUATION.test(value) && forbiddenWordsIn(value).length === 0;

    expect(passes("Rocky Mountain bighorn sheep")).toBe(true);
    expect(passes("White-tailed deer (Odocoileus virginianus)")).toBe(false);
    expect(passes("official state mammal: elk")).toBe(false);
  });

  test("every forbidden word is actually caught, case-insensitively", () => {
    for (const word of FORBIDDEN_WORDS) {
      expect({ word, caught: forbiddenWordsIn(`Some ${word.toUpperCase()} thing`) }).toEqual({
        word,
        caught: [word],
      });
    }
  });

  test("no state_animal contains a parenthesis, comma, semicolon, colon or full stop", () => {
    for (const { file, value } of trackedAnimals()) {
      expect({ file, value, punctuation: FORBIDDEN_PUNCTUATION.test(value) }).toEqual({
        file,
        value,
        punctuation: false,
      });
    }
  });

  test("no state_animal contains any of the nine forbidden words", () => {
    for (const { file, value } of trackedAnimals()) {
      expect({ file, value, hits: forbiddenWordsIn(value) }).toEqual({ file, value, hits: [] });
    }
  });
});

describe("T-012 criterion 5 — the text lives in the build input, not in built output", () => {
  /**
   * Read per-postal, because criterion 9 explicitly allows two states to carry
   * the same animal: "appears in exactly one tracked file — the one for its own
   * state" is the pairing of a curated *row* with its own state's file, not a
   * claim that a string occurs once across the bank. Reading it the other way
   * would contradict criterion 9 inside the same brief.
   */
  test("every value in a tracked file appears verbatim as a state_animal in the curated table", () => {
    const curated = new Set(
      CURATED_US_STATES.map((s) => s.state_animal).filter((v): v is string => v !== undefined),
    );
    const animals = trackedAnimals();
    expect(animals.length).toBeGreaterThan(0);
    for (const { file, value } of animals) {
      expect({ file, value, inCurated: curated.has(value) }).toEqual({
        file,
        value,
        inCurated: true,
      });
    }
  });

  test("every curated state_animal appears in its own state's tracked file, matched by postal", () => {
    const byPostal = new Map(trackedAnimals().map(({ postal, value }) => [postal, value]));
    const rows = CURATED_US_STATES.filter((s) => s.state_animal !== undefined);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect({ postal: row.postal, value: byPostal.get(row.postal) }).toEqual({
        postal: row.postal,
        value: row.state_animal as string,
      });
    }
  });

  test("no tracked file carries a curated value belonging to a state that does not declare it", () => {
    const declared = new Map(
      CURATED_US_STATES.map((s) => [s.postal, s.state_animal] as const),
    );
    for (const { postal, file, value } of trackedAnimals()) {
      expect({ file, declaredByItsOwnRow: declared.get(postal) === value }).toEqual({
        file,
        declaredByItsOwnRow: true,
      });
    }
  });

  test("the curated source file contains each shipped string verbatim", () => {
    const source = readFileSync(join(PKG, "src/curated/us-states.ts"), "utf8");
    for (const { file, value } of trackedAnimals()) {
      expect({ file, verbatim: source.includes(`state_animal: ${JSON.stringify(value)}`) }).toEqual({
        file,
        verbatim: true,
      });
    }
  });
});

describe("T-012 criterion 6 — the bank is built, not hand-edited", () => {
  const PATHS = [
    "index.json",
    ...CURATED_US_STATES.map((s) => `us-state-${s.postal.toLowerCase()}.json`),
  ];

  // Runs the real CLI offline into a throwaway directory. Nothing is mocked.
  // `rebuildOffline` (T-014 criterion 16(a)) is the harness shared with
  // `committed-bank.test.ts`, `landmarks.test.ts` and `landmarks-verify.test.ts`.
  const first = rebuildOffline(BUILD_SCRIPT, PATHS, "t012-rebuild-");
  const second = rebuildOffline(BUILD_SCRIPT, PATHS, "t012-rebuild-");

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

describe("T-012 criterion 7 — the committed sample stays in step with the bank", () => {
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

  test("the sample carries the same state_animal as the tracked Colorado", () => {
    expect(sample().state_animal).toBe(tracked().state_animal as string);
  });
});

describe("T-012 criterion 8 — nothing but state_animal moves in the bank", () => {
  /**
   * T-013 (a later, approved task) is explicitly tasked with filling `landmark`
   * for the other 49 states — `tasks/T-013-curate-landmarks.md` criterion 1.
   * The set this assertion checks against is no longer {Colorado}; it is
   * Colorado plus the 43 states T-013's Handoff names as filled (44 total),
   * transcribed from that Handoff the same way `HANDOFF_ANIMALS` above is
   * transcribed from this task's own. The check itself is unchanged — still an
   * exact-equality comparison, not loosened — only the ground truth it compares
   * against has moved, the same way this test would have to move again if a
   * future task changed `state_animal`'s own coverage.
   */
  test("the set of states carrying landmark is exactly Colorado plus T-013's 43 filled states", () => {
    const named = trackedStateFiles()
      .filter(({ entity }) => entity.landmark !== undefined)
      .map(({ entity }) => entity.name)
      .sort();
    const T013_LANDMARK_STATES = [
      "Alabama",
      "Alaska",
      "Arizona",
      "Arkansas",
      "California",
      "Colorado",
      "Connecticut",
      "Florida",
      "Georgia",
      "Hawaii",
      "Idaho",
      "Illinois",
      "Indiana",
      "Kentucky",
      "Louisiana",
      "Maine",
      "Maryland",
      "Massachusetts",
      "Michigan",
      "Minnesota",
      "Missouri",
      "Montana",
      "Nebraska",
      "Nevada",
      "New Hampshire",
      "New Jersey",
      "New Mexico",
      "New York",
      "North Carolina",
      "North Dakota",
      "Ohio",
      "Oregon",
      "Pennsylvania",
      "South Carolina",
      "South Dakota",
      "Tennessee",
      "Texas",
      "Utah",
      "Vermont",
      "Virginia",
      "Washington",
      "West Virginia",
      "Wisconsin",
      "Wyoming",
    ].sort();
    expect(T013_LANDMARK_STATES).toHaveLength(44);
    expect(named).toEqual(T013_LANDMARK_STATES);
  });

  test("the set of states carrying climate_kid is exactly all 50 — T-014 filled the rest", () => {
    // Was `["Colorado"]` before T-014 (2026-09-17): T-014's criterion 1 leaves
    // no state blank, unlike `landmark`'s six declared blanks above, so the
    // set to check against grew from one name to all 50, transcribed from
    // T-014's own `## Handoff` the same way `T013_LANDMARK_STATES` above is
    // transcribed from T-013's.
    const named = trackedStateFiles()
      .filter(({ entity }) => entity.climate_kid !== undefined)
      .map(({ entity }) => entity.name)
      .sort();
    const T014_CLIMATE_KID_STATES = [
      "Alabama",
      "Alaska",
      "Arizona",
      "Arkansas",
      "California",
      "Colorado",
      "Connecticut",
      "Delaware",
      "Florida",
      "Georgia",
      "Hawaii",
      "Idaho",
      "Illinois",
      "Indiana",
      "Iowa",
      "Kansas",
      "Kentucky",
      "Louisiana",
      "Maine",
      "Maryland",
      "Massachusetts",
      "Michigan",
      "Minnesota",
      "Mississippi",
      "Missouri",
      "Montana",
      "Nebraska",
      "Nevada",
      "New Hampshire",
      "New Jersey",
      "New Mexico",
      "New York",
      "North Carolina",
      "North Dakota",
      "Ohio",
      "Oklahoma",
      "Oregon",
      "Pennsylvania",
      "Rhode Island",
      "South Carolina",
      "South Dakota",
      "Tennessee",
      "Texas",
      "Utah",
      "Vermont",
      "Virginia",
      "Washington",
      "West Virginia",
      "Wisconsin",
      "Wyoming",
    ].sort();
    expect(T014_CLIMATE_KID_STATES).toHaveLength(50);
    expect(named).toEqual(T014_CLIMATE_KID_STATES);
  });

  test("top_crops is still an empty array in all 50 tracked files — T-015 owns it", () => {
    for (const { file, entity } of trackedStateFiles()) {
      expect({ file, topCrops: entity.top_crops }).toEqual({ file, topCrops: [] });
    }
  });

  test("index.json carries no state_animal and keeps its own five-key entity shape", () => {
    const raw = readFileSync(join(DATA_DIR, "index.json"), "utf8");
    expect(raw).not.toContain("state_animal");
    const index = JSON.parse(raw) as { count: number; entities: Record<string, unknown>[] };
    expect(Object.keys(index).sort()).toEqual(["count", "entities"]);
    expect(index.count).toBe(50);
    for (const entry of index.entities) {
      expect(Object.keys(entry).sort()).toEqual([
        "geometry_id",
        "id",
        "name",
        "scope",
        "type",
      ]);
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

describe("T-012 criterion 9 — animals shared by several states are disclosed, not hidden", () => {
  /** Groups computed from the 50 tracked files, which is what the criterion compares against. */
  function computedDuplicates(): Record<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const { postal, value } of trackedAnimals()) {
      groups.set(value, [...(groups.get(value) ?? []), postal]);
    }
    return Object.fromEntries(
      [...groups.entries()]
        .filter(([, states]) => states.length > 1)
        .map(([value, states]) => [value, states.sort()]),
    );
  }

  test("the Handoff's duplicate table is exactly the duplicate groups in the tracked bank", () => {
    const declared = Object.fromEntries(
      Object.entries(DISCLOSED_DUPLICATES).map(([value, states]) => [value, [...states].sort()]),
    );
    expect(computedDuplicates()).toEqual(declared);
  });

  test("the comparison is not vacuous — the bank really does share animals between states", () => {
    expect(Object.keys(computedDuplicates()).length).toBeGreaterThan(0);
  });

  test("every state named in a disclosed group actually carries that animal", () => {
    const byPostal = new Map(trackedAnimals().map(({ postal, value }) => [postal, value]));
    for (const [value, states] of Object.entries(DISCLOSED_DUPLICATES)) {
      for (const postal of states) {
        expect({ postal, value: byPostal.get(postal) }).toEqual({ postal, value });
      }
    }
  });
});

describe("T-012 criterion 10 — everything a child will read can be read in one place", () => {
  test("the Handoff's table names all 50 states", () => {
    expect(Object.keys(HANDOFF_ANIMALS).sort()).toEqual(
      CURATED_US_STATES.map((s) => s.postal).sort(),
    );
  });

  test("every string the Handoff's table claims is the string actually shipped for that state", () => {
    const byPostal = new Map(trackedAnimals().map(({ postal, value }) => [postal, value]));
    for (const [postal, value] of Object.entries(HANDOFF_ANIMALS)) {
      expect({ postal, shipped: byPostal.get(postal) }).toEqual({ postal, shipped: value });
    }
  });

  test("no state ships a value the Handoff's table does not mention", () => {
    for (const { postal, file, value } of trackedAnimals()) {
      expect({ file, declared: HANDOFF_ANIMALS[postal] }).toEqual({ file, declared: value });
    }
  });
});

describe("T-012 criterion 11 — nothing unreviewed, live or new is committed", () => {
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

describe("T-012 criterion 12 — nothing already verified is weakened", () => {
  /**
   * Counts pinned from the four suites as they stand at this task's branch
   * point, so a later deletion shows up without needing git history (CI clones
   * shallow). "No assertion loosened" is a diff property and is checked in the
   * brief's Verdict instead.
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
    const source = readFileSync(join(PKG, "src/state-animals.test.ts"), "utf8");
    expect(/from "\.\.\/\.\.\//.test(source)).toBe(false);
  });
});
