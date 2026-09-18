import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";
import { rebuildOffline } from "./offline-rebuild";

/**
 * T-014 verification (worker). Written from the acceptance criteria in
 * `tasks/T-014-climate-kid-phrasing.md`, not from the implementation: every
 * bound below — 15–90 characters, 3–16 words, the forbidden-word lists, the
 * 31 Köppen codes, the pinned `built_at`, the 51 rebuilt paths — is quoted
 * from a criterion rather than read off the curated table or the built bank.
 *
 * `HANDOFF_TABLE` and `INTERCHANGEABLE_GROUPS` are transcribed from this
 * brief's `## Handoff`, which is itself a deliverable under criteria 16 and
 * 17. They are the *claim*; the tracked bank is the *fact*, and these tests
 * compare the two. They are transcribed rather than read from `tasks/` at run
 * time because the reviewer deletes the brief at sweep (`process.md` step 6)
 * and a test that reads a file which later disappears is a test that later
 * stops meaning anything — precedent: `landmarks.test.ts` (T-013).
 *
 * Nothing here reaches the network: the one thing it runs is the build CLI
 * with `--offline`, via `rebuildOffline` (`offline-rebuild.ts`, this task's
 * own criterion 16(a) extraction) — the same dead-loopback-proxy trick CI
 * uses (`test-guidelines.md`). Nothing mocks `fetch`. Nothing writes inside
 * `question-bank/` — the rebuild goes to a temp dir.
 *
 * What a shape test cannot do is check that a phrase is *actually* true of a
 * state's climate, or that a child would find it readable. The brief's
 * "Review checklist" owns that and only a named person can close it
 * (`process-decisions.md` D-4a).
 *
 * Criterion 15's "the only difference from the same file on the default
 * branch is `climate_kid`" is, like T-013 criterion 9 before it, partly a
 * property of *this branch's diff* rather than of the tree — CI checks out at
 * `fetch-depth: 1`, so `origin/main` is not there. The tree-shaped pieces
 * (15a–15c: which fields are still present and unchanged) are tested below;
 * "byte-identical to `main` outside `climate_kid`" is recorded in the brief's
 * Verdict with `git diff` instead, the same split `committed-bank.test.ts`
 * draws for T-010 criteria 17–18 and `landmarks.test.ts` draws for T-013.
 */
const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");
const BUILD_SCRIPT = join(PKG, "src/build.ts");

/** Criterion 12 names this instant literally. */
const PINNED_BUILT_AT = "2026-08-04T16:05:35.000Z";

/**
 * Criterion 17: the Handoff's 50-row table, postal → the exact `climate_kid`
 * string shipped for that state. Transcribed from the brief, not read off the
 * data — a value the Handoff mis-states is a test failure, not a silent
 * agreement. Colorado's is included and is criterion 14's pinned string.
 */
const HANDOFF_TABLE: Record<string, string> = {
  AL: "hot sticky summers and mild winters, with strong thunderstorms much of the year",
  AK: "long cold snowy winters inland, milder and rainy along the southern coast",
  AZ: "scorching dry summers in the desert, cooler snowy winters up north",
  AR: "hot humid summers with strong storms, and mild winters that turn icy at times",
  CA: "sunny dry summers near the coast, hot deserts and snowy mountains further inland",
  CO: "dry and cold in the mountains, drier plains to the east",
  CT: "cold snowy winters and warm sticky summers, with all four seasons clearly felt",
  DE: "mild humid summers and cool damp winters, close to the ocean's moderating winds",
  FL: "hot muggy summers nearly all year, with sudden storms and mild winters",
  GA: "hot muggy summers and mild winters, with thunderstorms common in the warm months",
  HI: "warm breezy weather all year, with wetter mountains and drier coasts nearby",
  ID: "warm dry summers and cold snowy winters, especially high in the mountains",
  IL: "hot humid summers, cold snowy winters, and strong storms every spring",
  IN: "warm sticky summers, icy cold winters, and plenty of storms each spring",
  IA: "hot humid summers and freezing cold winters, with strong winds across the open fields",
  KS: "hot dry summers and cold windy winters, with sudden storms sweeping the plains",
  KY: "warm humid summers and cool winters, with occasional snow and ice storms",
  LA: "hot muggy summers most of the year, mild winters, and occasional powerful storms",
  ME: "cold snowy winters and cool breezy summers, especially up near the coast",
  MD: "hot humid summers and cold winters, milder and breezier close to the water",
  MA: "cold snowy winters with strong coastal storms, and warm humid summers",
  MI: "long cold winters with heavy lake snow, and mild humid summers",
  MN: "bitterly cold snowy winters and warm humid summers, with big swings between them",
  MS: "hot muggy summers nearly all year, with mild winters and frequent thunderstorms",
  MO: "hot humid summers and cold winters, with sudden storms and occasional ice",
  MT: "cold snowy winters in the mountains, hot dry summers out on the plains",
  NE: "hot windy summers and freezing cold winters, with sudden storms across the open plains",
  NV: "hot dry summers, cold winters, and very little rain any time of year",
  NH: "cold snowy winters, especially high in the mountains, and warm summers below",
  NJ: "hot humid summers and cold snowy winters, with occasional storms along the shore",
  NM: "hot dry summers in the lowlands, cold snowy winters up in the mountains",
  NY: "cold snowy winters, heaviest near the lakes and mountains, and warm humid summers",
  NC: "hot humid summers, and winters that turn cold and snowy up in the mountains",
  ND: "bitterly cold winters and hot summers, with strong winds across the open plains",
  OH: "cold snowy winters near the lake, and warm humid summers the rest of the year",
  OK: "hot windy summers and mild winters, with sudden severe storms in spring",
  OR: "wet mild winters and dry sunny summers near the coast, drier further east",
  PA: "cold snowy winters and warm humid summers, changing a lot from place to place",
  RI: "cold snowy winters and warm humid summers, with strong storms off the coast",
  SC: "hot muggy summers, mild winters, and the chance of a strong coastal storm",
  SD: "cold windy winters and hot summers, with sudden storms sweeping the plains",
  TN: "hot humid summers and mild winters, with occasional snow in the higher hills",
  TX: "scorching hot summers, humid and stormy in the east, drier and milder out west",
  UT: "dry hot summers in the lowlands, and cold snowy winters up in the mountains",
  VT: "cold snowy winters, heavy in the mountains, and mild cool summers below",
  VA: "hot humid summers near the coast, colder and snowier out in the mountains",
  WA: "wet mild winters and dry summers near the coast, drier and hotter to the east",
  WV: "warm humid summers and cold snowy winters, especially high in the hills",
  WI: "bitterly cold snowy winters and warm humid summers, right in the middle of the country",
  WY: "cold snowy winters high in the mountains, and hot dry summers down in the valleys below",
};

/**
 * Criterion 17's "groups the states whose phrases describe substantively the
 * same climate". Transcribed from the Handoff. Every state appears in at most
 * one group; a state not listed here was judged distinct enough to stand
 * alone (the Handoff says why for the borderline ones — Missouri and New
 * York in particular).
 */
const INTERCHANGEABLE_GROUPS: Record<string, string[]> = {
  "Great Plains": ["IA", "NE", "KS", "SD", "ND"],
  "Northern Rockies": ["MT", "WY", "ID"],
  "Interior Southwest": ["AZ", "NM", "UT", "NV"],
  "Pacific Northwest": ["OR", "WA"],
  "Southern New England": ["CT", "MA", "RI"],
  "Northern New England": ["NH", "VT", "ME"],
  "Mid-Atlantic": ["NJ", "PA", "MD", "DE"],
  "Great Lakes / Upper Midwest": ["OH", "IN", "IL", "MI", "WI", "MN"],
  "Deep South": ["AL", "GA", "MS", "SC", "LA"],
  "Upland South / Appalachian": ["TN", "AR", "KY", "NC", "VA", "WV"],
};

/** Criterion 7's 31 Köppen class codes, matched as a whole word, case-sensitively. */
const KOPPEN_CODES = [
  "Af", "Am", "Aw", "As",
  "BWh", "BWk", "BSh", "BSk",
  "Csa", "Csb", "Csc", "Cwa", "Cwb", "Cwc", "Cfa", "Cfb", "Cfc",
  "Dsa", "Dsb", "Dsc", "Dsd", "Dwa", "Dwb", "Dwc", "Dwd", "Dfa", "Dfb", "Dfc", "Dfd",
  "ET", "EF",
];

/** Criterion 8, verbatim and case-insensitive. */
const GEOGRAPHER_WORDS = [
  "arid", "subtropical", "subarctic", "temperate", "oceanic", "continental",
  "steppe", "tundra", "mediterranean", "precipitation", "humidity", "latitude",
  "elevation", "climate zone", "biome", "annual", "average",
];

/** Criterion 9, verbatim and case-insensitive. */
const WEATHER_WORDS = [
  "hot", "cold", "cool", "warm", "wet", "dry", "rain", "snow", "sun", "wind",
  "storm", "humid", "mild", "freez", "ice", "icy", "fog", "breez", "chill",
  "damp", "muggy", "sticky", "frost",
];

/** Criterion 5's unit/number words, case-insensitive (digits and ° checked separately). */
const UNIT_WORDS = ["celsius", "fahrenheit", "degrees", "inches", "millimetres", "millimeters"];

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

interface TrackedEntity {
  id: string;
  name: string;
  region?: string;
  climate_kid?: string;
  state_animal?: string;
  landmark?: string;
  top_crops?: unknown[];
  fun_facts?: { text: string; reviewed?: boolean }[];
  sources?: { built_at?: string };
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

/** Every state carries the key (criterion 1 permits no blank), so this is always 50 long. */
function trackedPhrases(): { postal: string; file: string; value: string }[] {
  return trackedStateFiles().map(({ postal, file, entity }) => {
    if (entity.climate_kid === undefined) {
      throw new Error(`${file} has no climate_kid — criterion 1 permits no blank`);
    }
    return { postal, file, value: entity.climate_kid };
  });
}

const wholeWord = (haystack: string, needle: string, caseSensitive: boolean) => {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, caseSensitive ? "" : "i").test(haystack);
};

describe("T-014 criterion 1 — all fifty are filled, and none is a placeholder", () => {
  test("all 50 tracked files carry a climate_kid key", () => {
    expect(trackedPhrases()).toHaveLength(50);
  });

  test("no tracked file carries climate_kid as empty, null, or a placeholder word", () => {
    const placeholders = ["", "unknown", "none", "tbd", "n/a", "—"];
    for (const { file, value } of trackedPhrases()) {
      expect({ file, type: typeof value }).toEqual({ file, type: "string" });
      expect({ file, placeholder: placeholders.includes(value.trim().toLowerCase()) }).toEqual({
        file,
        placeholder: false,
      });
    }
  });

  test("every one of the 50 curated states has a row carrying climate_kid", () => {
    const carried = trackedPhrases()
      .map(({ postal }) => postal)
      .sort();
    expect(carried).toEqual(CURATED_US_STATES.map((s) => s.postal).sort());
  });
});

describe("T-014 criterion 2 — short enough to read, long enough to say something", () => {
  const lengthOk = (v: string) => v.length >= 15 && v.length <= 90;
  const wordsOk = (v: string) => {
    const n = v.split(/\s+/).filter(Boolean).length;
    return n >= 3 && n <= 16;
  };

  test("the length bound is right at its named edges (14 no, 15 yes, 90 yes, 91 no)", () => {
    expect(lengthOk("x".repeat(14))).toBe(false);
    expect(lengthOk("x".repeat(15))).toBe(true);
    expect(lengthOk("x".repeat(90))).toBe(true);
    expect(lengthOk("x".repeat(91))).toBe(false);
  });

  test("the word-count bound is right at its named edges (2 no, 3 yes, 16 yes, 17 no)", () => {
    expect(wordsOk("a b")).toBe(false);
    expect(wordsOk("a b c")).toBe(true);
    expect(wordsOk(Array(16).fill("x").join(" "))).toBe(true);
    expect(wordsOk(Array(17).fill("x").join(" "))).toBe(false);
  });

  test("Colorado's phrase is 55 characters and 11 words, as the brief states", () => {
    const co = HANDOFF_TABLE["CO"] as string;
    expect(co.length).toBe(55);
    expect(co.split(/\s+/).filter(Boolean)).toHaveLength(11);
  });

  test("every phrase is 15–90 characters and 3–16 words", () => {
    for (const { file, value } of trackedPhrases()) {
      expect({ file, length: value.length, ok: lengthOk(value) }).toEqual({
        file,
        length: value.length,
        ok: true,
      });
      const words = value.split(/\s+/).filter(Boolean).length;
      expect({ file, words, ok: wordsOk(value) }).toEqual({ file, words, ok: true });
    }
  });
});

describe("T-014 criterion 3 — clean text", () => {
  test("every phrase equals its own trim(), has no double space, and no newline or tab", () => {
    for (const { file, value } of trackedPhrases()) {
      expect({ file, trimmed: value === value.trim() }).toEqual({ file, trimmed: true });
      expect({ file, doubleSpace: value.includes("  ") }).toEqual({ file, doubleSpace: false });
      expect({ file, whitespace: /[\n\t]/.test(value) }).toEqual({ file, whitespace: false });
    }
  });
});

describe("T-014 criterion 4 — a fragment that slots into a sentence, not a sentence", () => {
  const FORBIDDEN_PUNCTUATION = /[;:()/"*|]/;

  test("the criterion's own worked example passes: Colorado's comma is allowed", () => {
    const co = HANDOFF_TABLE["CO"] as string;
    expect(co.includes(",")).toBe(true);
    expect(FORBIDDEN_PUNCTUATION.test(co)).toBe(false);
  });

  test("every phrase begins with a lowercase letter a–z", () => {
    for (const { file, value } of trackedPhrases()) {
      expect({ file, value, ok: /^[a-z]/.test(value) }).toEqual({ file, value, ok: true });
    }
  });

  test("no phrase ends with . ! or ?", () => {
    for (const { file, value } of trackedPhrases()) {
      expect({ file, value, ok: /[.!?]$/.test(value) }).toEqual({ file, value, ok: false });
    }
  });

  test("no phrase contains ; : ( ) / \" * | or the substring http", () => {
    for (const { file, value } of trackedPhrases()) {
      expect({ file, value, punctuation: FORBIDDEN_PUNCTUATION.test(value) }).toEqual({
        file,
        value,
        punctuation: false,
      });
      expect({ file, value, http: value.toLowerCase().includes("http") }).toEqual({
        file,
        value,
        http: false,
      });
    }
  });

  test('both of T-026\'s sentence frames read grammatically for Colorado\'s phrase', () => {
    const co = HANDOFF_TABLE["CO"] as string;
    expect(`Which state is ${co}?`).toBe(
      "Which state is dry and cold in the mountains, drier plains to the east?",
    );
    expect(`Colorado is ${co}.`).toBe(
      "Colorado is dry and cold in the mountains, drier plains to the east.",
    );
  });
});

describe("T-014 criterion 5 — no numbers and no units", () => {
  test("the criterion's own worked examples land on the right side", () => {
    const hasNumberOrUnit = (v: string) =>
      /\d/.test(v) || v.includes("°") || UNIT_WORDS.some((u) => v.toLowerCase().includes(u));
    expect(hasNumberOrUnit("snow up to 300 inches")).toBe(true);
    expect(hasNumberOrUnit("loads of snow")).toBe(false);
  });

  test("no phrase contains a digit, a degree sign, or a unit word", () => {
    for (const { file, value } of trackedPhrases()) {
      expect({ file, value, digit: /\d/.test(value) }).toEqual({ file, value, digit: false });
      expect({ file, value, degree: value.includes("°") }).toEqual({
        file,
        value,
        degree: false,
      });
      for (const unit of UNIT_WORDS) {
        expect({ file, unit, hit: value.toLowerCase().includes(unit) }).toEqual({
          file,
          unit,
          hit: false,
        });
      }
    }
  });
});

describe("T-014 criterion 6 — nothing says Köppen", () => {
  test("no phrase, in any tracked file, contains köppen or koppen case-insensitively", () => {
    for (const { file, value } of trackedPhrases()) {
      expect({ file, value, hit: /koppen|köppen/i.test(value) }).toEqual({
        file,
        value,
        hit: false,
      });
    }
  });

  test("the curated source file's climate_kid values contain no köppen mention either", () => {
    const source = readFileSync(join(PKG, "src/curated/us-states.ts"), "utf8");
    const climateKidLines = source.split("\n").filter((l) => l.trim().startsWith("climate_kid:"));
    expect(climateKidLines.length).toBe(50);
    for (const line of climateKidLines) {
      expect({ line, hit: /koppen|köppen/i.test(line) }).toEqual({ line, hit: false });
    }
  });
});

describe("T-014 criterion 7 — no Köppen class code as a whole word", () => {
  test("the criterion's own worked example: lowercase as in 'as wet as' does not trip it, BSk does", () => {
    // "As" is the Köppen code (tropical savanna); the match is case-sensitive,
    // so the lowercase "as" in ordinary prose must not trip it.
    expect(wholeWord("as wet as it gets", "As", true)).toBe(false);
    expect(wholeWord("a stray BSk shows up", "BSk", true)).toBe(true);
  });

  test("all 31 named codes are absent, case-sensitively, as whole words", () => {
    for (const { file, value } of trackedPhrases()) {
      for (const code of KOPPEN_CODES) {
        expect({ file, code, hit: wholeWord(value, code, true) }).toEqual({
          file,
          code,
          hit: false,
        });
      }
    }
  });
});

describe("T-014 criterion 8 — no geographer's word for a climate", () => {
  test("the criterion's own worked examples land on the right side", () => {
    const hasGeogWord = (v: string) => GEOGRAPHER_WORDS.some((w) => v.toLowerCase().includes(w));
    expect(hasGeogWord("humid subtropical summers")).toBe(true); // subtropical
    expect(hasGeogWord("semi-arid")).toBe(true); // arid
    expect(hasGeogWord("hot sticky summers")).toBe(false);
    expect(hasGeogWord("it feels humid")).toBe(false); // humid alone is allowed
  });

  test("none of the 17 forbidden words or phrases appears in any shipped phrase", () => {
    for (const { file, value } of trackedPhrases()) {
      const lowered = value.toLowerCase();
      const hits = GEOGRAPHER_WORDS.filter((w) => lowered.includes(w));
      expect({ file, value, hits }).toEqual({ file, value, hits: [] });
    }
  });
});

describe("T-014 criterion 9 — actually about weather", () => {
  test("the criterion's own worked example: a phrase with no weather word fails", () => {
    const hasWeatherWord = (v: string) => WEATHER_WORDS.some((w) => v.toLowerCase().includes(w));
    expect(hasWeatherWord("beautiful all year round")).toBe(false);
    expect(hasWeatherWord(HANDOFF_TABLE["CO"] as string)).toBe(true); // dry, cold
  });

  test("every phrase contains at least one of the 23 weather words", () => {
    for (const { file, value } of trackedPhrases()) {
      const lowered = value.toLowerCase();
      const matches = WEATHER_WORDS.filter((w) => lowered.includes(w));
      expect({ file, value, matches: matches.length > 0 }).toEqual({
        file,
        value,
        matches: true,
      });
    }
  });
});

describe("T-014 criterion 10 — no phrase names a state", () => {
  const STATE_NAMES = CURATED_US_STATES.map((s) => s.name);

  test("the criterion's own worked example: Sierra Nevada fails, the high Sierra passes", () => {
    expect(wholeWord("wet winters in the Sierra Nevada", "Nevada", false)).toBe(true);
    expect(wholeWord("wet winters in the high Sierra", "Nevada", false)).toBe(false);
  });

  test("the criterion's own worked example: the Great Lakes phrasing passes for every state name", () => {
    const phrase = "cold snowy winters by the Great Lakes";
    for (const name of STATE_NAMES) expect(wholeWord(phrase, name, false)).toBe(false);
  });

  test("no phrase contains any of the 50 state names as a whole word, case-insensitively", () => {
    for (const { file, value } of trackedPhrases()) {
      const hits = STATE_NAMES.filter((name) => wholeWord(value, name, false));
      expect({ file, value, hits }).toEqual({ file, value, hits: [] });
    }
  });
});

describe("T-014 criterion 11 — no two phrases are the same, and none contains another", () => {
  test("all 50 shipped phrases are distinct, case-insensitively, after trimming", () => {
    const values = trackedPhrases().map(({ value }) => value.trim().toLowerCase());
    expect(values).toHaveLength(50);
    expect(new Set(values).size).toBe(50);
  });

  test("no shipped phrase is a case-insensitive substring of any other, in either direction", () => {
    const phrases = trackedPhrases();
    const collisions: string[] = [];
    for (const a of phrases) {
      for (const b of phrases) {
        if (a.postal === b.postal) continue;
        const lowerA = a.value.trim().toLowerCase();
        const lowerB = b.value.trim().toLowerCase();
        if (lowerB.includes(lowerA)) collisions.push(`${a.postal} ⊂ ${b.postal}`);
      }
    }
    expect(collisions).toEqual([]);
  });
});

describe("T-014 criterion 12 — the bank is built, not hand-edited", () => {
  const PATHS = [
    "index.json",
    ...CURATED_US_STATES.map((s) => `us-state-${s.postal.toLowerCase()}.json`),
  ];

  // `rebuildOffline` (criterion 16(a)) is the harness shared with
  // `committed-bank.test.ts`, `state-animals.test.ts`, `landmarks.test.ts`
  // and `landmarks-verify.test.ts`.
  const first = rebuildOffline(BUILD_SCRIPT, PATHS, "t014-rebuild-");
  const second = rebuildOffline(BUILD_SCRIPT, PATHS, "t014-rebuild-");

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

describe("T-014 criterion 13 — the committed sample stays in step with the bank", () => {
  test("sample-data/us-state-co.json carries the same climate_kid as the tracked Colorado", () => {
    const tracked = JSON.parse(
      readFileSync(join(DATA_DIR, "us-state-co.json"), "utf8"),
    ) as TrackedEntity;
    const sample = JSON.parse(
      readFileSync(join(PKG, "sample-data/us-state-co.json"), "utf8"),
    ) as TrackedEntity;
    expect(sample.climate_kid).toBe(tracked.climate_kid as string);
    expect(sample.climate_kid).toBe("dry and cold in the mountains, drier plains to the east");
  });

  test("sample-data/us-state-co.json was not touched by this task (git status is clean for it)", () => {
    const { status, stdout } = git(["diff", "--name-only", "--", "question-bank/sample-data"]);
    // A clean checkout returns status 0 with no output; either way, the file
    // this task must not move is absent from any diff there is.
    expect(status === 0 || status === 1).toBe(true);
    expect(stdout).not.toContain("us-state-co.json");
  });
});

describe("T-014 criterion 14 — Colorado's phrase is unchanged", () => {
  const EXPECTED = "dry and cold in the mountains, drier plains to the east";

  test("the curated table still carries exactly this string for Colorado", () => {
    const co = CURATED_US_STATES.find((s) => s.postal === "CO");
    expect(co?.climate_kid).toBe(EXPECTED);
  });

  test("the tracked Colorado file carries exactly this string", () => {
    const entity = JSON.parse(
      readFileSync(join(DATA_DIR, "us-state-co.json"), "utf8"),
    ) as TrackedEntity;
    expect(entity.climate_kid).toBe(EXPECTED);
  });

  test("the sample carries exactly this string", () => {
    const entity = JSON.parse(
      readFileSync(join(PKG, "sample-data/us-state-co.json"), "utf8"),
    ) as TrackedEntity;
    expect(entity.climate_kid).toBe(EXPECTED);
  });
});

describe("T-014 criterion 15 — nothing but climate_kid moves in the bank (tree-shaped pieces)", () => {
  test("15a — the set of states carrying landmark is still exactly the 44 the default branch carries, unchanged", () => {
    const declared = new Map(CURATED_US_STATES.map((s) => [s.postal, s.landmark] as const));
    const withLandmark = [...declared.entries()].filter(([, v]) => v !== undefined);
    expect(withLandmark).toHaveLength(44);
    const blanks = CURATED_US_STATES.filter((s) => s.landmark === undefined)
      .map((s) => s.postal)
      .sort();
    expect(blanks).toEqual(["DE", "IA", "KS", "MS", "OK", "RI"]);

    for (const { file, entity } of trackedStateFiles()) {
      const postal = file.match(/^us-state-([a-z]{2})\.json$/)?.[1]?.toUpperCase() as string;
      expect({ file, landmark: entity.landmark }).toEqual({
        file,
        landmark: declared.get(postal),
      });
    }
  });

  test("15b — all 50 still carry state_animal, unchanged, and exactly one reviewed fun fact with the same text", () => {
    for (const { file, entity, postal } of trackedStateFiles()) {
      const curated = CURATED_US_STATES.find((s) => s.postal === postal);
      expect({ file, animal: entity.state_animal }).toEqual({
        file,
        animal: curated?.state_animal,
      });
      expect({ file, funFacts: entity.fun_facts?.length }).toEqual({ file, funFacts: 1 });
      expect({ file, reviewed: entity.fun_facts?.[0]?.reviewed }).toEqual({
        file,
        reviewed: true,
      });
      expect({ file, text: entity.fun_facts?.[0]?.text }).toEqual({
        file,
        text: curated?.fun_facts?.[0]?.text,
      });
    }
  });

  test("15c — top_crops is populated from CURATED_US_STATES in all 50 tracked files (T-015)", () => {
    for (const { postal, file, entity } of trackedStateFiles()) {
      const curated = CURATED_US_STATES.find((s) => s.postal === postal);
      const crops = entity.top_crops as unknown;
      expect(Array.isArray(crops)).toBe(true);
      const arr = crops as string[];
      expect({ file, inRange: arr.length >= 1 && arr.length <= 3 }).toEqual({
        file,
        inRange: true,
      });
      expect(curated).toBeDefined();
      expect({ file, topCrops: arr }).toEqual({ file, topCrops: curated?.top_crops as string[] });
    }
  });

  test("15d — index.json carries no climate_kid and keeps its own five-key entity shape", () => {
    const raw = readFileSync(join(DATA_DIR, "index.json"), "utf8");
    expect(raw).not.toContain("climate_kid");
    const index = JSON.parse(raw) as { count: number; entities: Record<string, unknown>[] };
    expect(Object.keys(index).sort()).toEqual(["count", "entities"]);
    expect(index.count).toBe(50);
    for (const entry of index.entities) {
      expect(Object.keys(entry).sort()).toEqual(["geometry_id", "id", "name", "scope", "type"]);
    }
  });

  test("no tracked entity file has grown a key outside the schema this task may touch", () => {
    const allowed = new Set([
      "id", "type", "scope", "name", "capital", "geometry_id", "region",
      "centroid", "population", "population_rank", "area_km2", "area_rank",
      "borders", "climate_kid", "state_animal", "landmark", "highest_point",
      "highest_point_m", "top_crops", "fun_facts", "sources",
    ]);
    for (const { file, entity } of trackedStateFiles()) {
      const unexpected = Object.keys(entity).filter((k) => !allowed.has(k));
      expect({ file, unexpected }).toEqual({ file, unexpected: [] });
    }
  });
});

describe("T-014 criterion 16 — the duplicated test harness is decided, not defaulted", () => {
  // This task took branch (a): extraction. `offline-rebuild.ts` exports both
  // DEAD_PROXY and rebuildOffline; the four pre-existing suites plus this
  // one obtain both from it. See the brief's Handoff for why (a) over (b).

  test("exactly one file under question-bank/src/ contains the dead-loopback proxy literal", () => {
    // Built from parts rather than written as one literal, so this test file
    // itself does not become a second match for the very thing it counts.
    const needle = ["127", "0", "0", "1"].join(".") + ":1";
    const files = trackedUnder("question-bank/src").filter(
      (p) => !p.endsWith(".json") && p !== "question-bank/src/climate-kid.test.ts",
    );
    const withProxy = files.filter((p) => readFileSync(join(REPO, p), "utf8").includes(needle));
    expect(withProxy).toEqual(["question-bank/src/offline-rebuild.ts"]);
  });

  test("no *.test.ts under question-bank/src/ spawns src/build.ts itself", () => {
    const tests = trackedUnder("question-bank/src").filter((p) => p.endsWith(".test.ts"));
    expect(tests.length).toBeGreaterThan(0);
    for (const path of tests) {
      const source = readFileSync(join(REPO, path), "utf8");
      expect({ path, spawnsBuild: /spawnSync\(\s*\[\s*["']bun["'][^]*?build\.ts/.test(source) }).toEqual(
        { path, spawnsBuild: false },
      );
    }
  });

  test("offline-rebuild.ts is not itself a *.test.ts file", () => {
    expect("question-bank/src/offline-rebuild.ts".endsWith(".test.ts")).toBe(false);
    expect(trackedUnder("question-bank/src")).toContain("question-bank/src/offline-rebuild.ts");
  });

  test("every offline-rebuild suite imports both DEAD_PROXY-equivalent isolation and the runner from offline-rebuild.ts", () => {
    for (const path of [
      "question-bank/src/committed-bank.test.ts",
      "question-bank/src/state-animals.test.ts",
      "question-bank/src/landmarks.test.ts",
      "question-bank/src/landmarks-verify.test.ts",
      "question-bank/src/climate-kid.test.ts",
    ]) {
      const source = readFileSync(join(REPO, path), "utf8");
      expect({ path, importsRunner: /from ["']\.\/offline-rebuild["']/.test(source) }).toEqual({
        path,
        importsRunner: true,
      });
      expect({ path, definesOwnProxy: /HTTP_PROXY:\s*["']http:\/\/127/.test(source) }).toEqual({
        path,
        definesOwnProxy: false,
      });
    }
  });

  test("the tracked-state-file reading route stays deliberately duplicated between landmarks.test.ts and landmarks-verify.test.ts", () => {
    const worker = readFileSync(join(PKG, "src/landmarks.test.ts"), "utf8");
    const tester = readFileSync(join(PKG, "src/landmarks-verify.test.ts"), "utf8");
    expect(worker).toContain('git(["ls-files"');
    expect(tester).toContain("readdirSync(DATA_DIR)");
  });
});

describe("T-014 criterion 17 — everything a person has to read is in one place", () => {
  test("the Handoff's table names all 50 states, with no overlap", () => {
    expect(Object.keys(HANDOFF_TABLE).sort()).toEqual(
      CURATED_US_STATES.map((s) => s.postal).sort(),
    );
  });

  test("every string the Handoff's table claims is the string actually shipped for that state", () => {
    const byPostal = new Map(trackedPhrases().map(({ postal, value }) => [postal, value]));
    for (const [postal, value] of Object.entries(HANDOFF_TABLE)) {
      expect({ postal, shipped: byPostal.get(postal) }).toEqual({ postal, shipped: value });
    }
  });

  test("no state ships a value the Handoff's table does not mention", () => {
    for (const { postal, file, value } of trackedPhrases()) {
      expect({ file, declared: HANDOFF_TABLE[postal] }).toEqual({ file, declared: value });
    }
  });

  test("every interchangeable group names states that are all actually filled, and no state appears in two groups", () => {
    const seen = new Set<string>();
    for (const [group, states] of Object.entries(INTERCHANGEABLE_GROUPS)) {
      expect(states.length).toBeGreaterThan(1);
      for (const postal of states) {
        expect({ group, postal, declared: HANDOFF_TABLE[postal] !== undefined }).toEqual({
          group,
          postal,
          declared: true,
        });
        expect({ group, postal, alreadyInAnotherGroup: seen.has(postal) }).toEqual({
          group,
          postal,
          alreadyInAnotherGroup: false,
        });
        seen.add(postal);
      }
    }
  });

  test("the groups cover a plausible minority of the 50 — not none, and not all treated as unique", () => {
    const grouped = new Set(Object.values(INTERCHANGEABLE_GROUPS).flat());
    expect(grouped.size).toBeGreaterThan(0);
    expect(grouped.size).toBeLessThan(50);
  });
});

describe("T-014 criterion 18 — nothing unreviewed, live or new is committed", () => {
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
      expect({ path, calls: /\bfetch\s*\(/.test(source) }).toEqual({ path, calls: false });
      expect({ path, stubs: /fetch\s*=/.test(source) }).toEqual({ path, stubs: false });
      expect({ path, mocks: /mock\s*\(\s*["']node:https?/.test(source) }).toEqual({
        path,
        mocks: false,
      });
    }
  });
});

describe("T-014 criterion 19 — nothing already verified is weakened", () => {
  /**
   * Counts pinned from the eight protected suites as they stand at this
   * task's branch point, so a later deletion shows up without needing git
   * history (CI clones shallow). `committed-bank.test.ts`'s own floor moved
   * from 60 to 58 expects by this task's own criterion 16(a) extraction (see
   * the comment at that constant in `state-animals.test.ts`, `landmarks.test.ts`
   * and `landmarks-verify.test.ts`) — named exempt from "loosened" by the
   * criterion itself. `state-animals.test.ts` and `landmarks.test.ts` grew by
   * a few expects each from this task's own edits (see each file's own
   * comment); the floors below are their post-edit counts, not their
   * pre-T-014 ones, since this task is the one making the edit.
   */
  const PINNED: Record<string, { tests: number; expects: number }> = {
    "committed-bank.test.ts": { tests: 33, expects: 58 },
    "data-us-states.test.ts": { tests: 6, expects: 14 },
    "fun-facts.test.ts": { tests: 30, expects: 59 },
    "state-animals.test.ts": { tests: 43, expects: 73 },
    "landmarks.test.ts": { tests: 53, expects: 88 },
    "landmarks-verify.test.ts": { tests: 36, expects: 69 },
    "normalize.test.ts": { tests: 14, expects: 31 },
    "sparql.test.ts": { tests: 5, expects: 7 },
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

  test("nothing outside question-bank/ is touched by this task's own new test file", () => {
    const source = readFileSync(join(PKG, "src/climate-kid.test.ts"), "utf8");
    expect(/from "\.\.\/\.\.\//.test(source)).toBe(false);
  });

  /**
   * Per-task exceptions to the assertion below, named the same way the digest
   * guards name theirs (`withEmptyTopCrops`, `withoutAlaskaHighestPoint` in
   * `top-crops-verify.test.ts`) so each one is greppable and attributable.
   *
   * Why any are needed: the diff range is `origin/main...HEAD`, not T-014's own
   * commits, so on a later task's branch this assertion no longer measures what
   * T-014 touched — it measures what *that* task touched. Any later task that
   * legitimately adds a file under `backend/` or `frontend/` therefore trips a
   * guard written about a task that ended months of commits ago.
   *
   * - `backend/tests/test_region_vocabulary.py` — T-017 (tester). The served
   *   side of the region closed-set check: criteria 3, 4 and 5 over
   *   `backend/app/data/content.json`, `openapi.yaml` and the live `/entities`
   *   and `/questions` responses, which cannot be asserted from inside
   *   `question-bank/` at all. It adds coverage under `backend/`; it weakens
   *   nothing T-014 verified, which is what this guard is actually for.
   *
   * Each entry expires on its own: once its task merges, the file is in
   * `origin/main` and the diff stops listing it. T-070 owns the real repair —
   * a task-scoped "nothing outside my package moved" assertion frozen into the
   * permanent suite is a defect shared with `climate-kid-verify.test.ts`, whose
   * own copy pins `13a735f` and is red on `origin/main` itself.
   */
  const ALLOWED_OUTSIDE_QUESTION_BANK = ["backend/tests/test_region_vocabulary.py"];

  /** Exported shape of the filter so the exception can be tested, not just trusted. */
  const outsideQuestionBank = (touched: string[]): string[] =>
    touched.filter(
      (p) =>
        (p.startsWith("frontend/") || p.startsWith("backend/")) &&
        !ALLOWED_OUTSIDE_QUESTION_BANK.includes(p),
    );

  test("frontend/ and backend/ are untouched by this task", () => {
    const { stdout } = git(["diff", "--name-only", "origin/main...HEAD"]);
    // On a shallow CI checkout `origin/main` is not present and this diff is
    // empty either way (see the module header) — recorded in the Verdict
    // with the same tool run against a real history instead. This assertion
    // is here so a full local clone still gets the check for free.
    if (stdout.trim().length > 0) {
      const touched = stdout.split("\n").filter(Boolean);
      expect(outsideQuestionBank(touched)).toEqual([]);
    } else {
      expect(stdout.trim()).toBe("");
    }
  });

  test("the allowlist is one named file, not a blanket pass for backend/ or frontend/", () => {
    // Otherwise the exception above would quietly retire the assertion it
    // is an exception to — the same thing the digest guards' own
    // "the neutralisation actually removes …" tests exist to rule out.
    expect(ALLOWED_OUTSIDE_QUESTION_BANK).toEqual(["backend/tests/test_region_vocabulary.py"]);
    expect(
      outsideQuestionBank([
        "backend/app/data/content.json",
        "backend/tests/test_region_vocabulary.py",
        "backend/tests/test_contract.py",
        "frontend/src/routes/index.tsx",
        "question-bank/src/curated/us-states.ts",
      ]),
    ).toEqual([
      "backend/app/data/content.json",
      "backend/tests/test_contract.py",
      "frontend/src/routes/index.tsx",
    ]);
  });

  test("the allowed file is a test file that exists and asserts only about region", () => {
    // An allowlist entry that named a source file, or a file that had since
    // been deleted or repurposed, would be an exception nobody could audit.
    expect(ALLOWED_OUTSIDE_QUESTION_BANK.length).toBeGreaterThan(0);
    for (const allowed of ALLOWED_OUTSIDE_QUESTION_BANK) {
      expect({ allowed, underTests: allowed.startsWith("backend/tests/") }).toEqual({
        allowed,
        underTests: true,
      });
      const source = readFileSync(join(REPO, allowed), "utf8");
      expect(source).toContain("region");
    }
  });
});
