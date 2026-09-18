import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";
import { rebuildOffline } from "./offline-rebuild";

/**
 * T-014 verification, second pass — written by the `tester` role from the
 * acceptance criteria in `tasks/T-014-climate-kid-phrasing.md`, in a context
 * with no visibility into the worker's reasoning, and independently of
 * `climate-kid.test.ts` (which the worker wrote alongside the data). It is not
 * a copy of that file. It exists because a suite written by the session that
 * produced the content can only ever confirm that session's own reading of the
 * criteria, and because three criteria were covered there in a way a later
 * change could slip past:
 *
 *  - **Criterion 15** ("the only difference from the same file on the default
 *    branch is the presence or value of a `climate_kid` key") was tested only
 *    in its tree-shaped pieces (15a–15d), with the diff property recorded in
 *    prose. It *can* be tested without git history, the same way T-013's
 *    criterion 9 was: `BASELINE_DIGESTS` below pins, per tracked path, the
 *    SHA-256 of that file **as it stands on the default branch with any
 *    `climate_kid` key removed** — computed once, here, from
 *    `git show 13a735f:<path>` (13a735f is this branch's point off `main`) and
 *    checked, at the time of writing, to be byte-equal to the current tree with
 *    the same key removed. Any *other* field moving in any of the 50 files, or
 *    any byte of `index.json` moving, turns this red with no history required.
 *    Note the six states with no `landmark` (DE, IA, KS, MS, OK, RI) hash to
 *    exactly the values `landmarks-verify.test.ts` independently pinned for
 *    them, which is a cross-check that the two digest routes agree.
 *  - **Criterion 13** says the sample equals the tracked Colorado *in every
 *    field* but `sources.built_at`. `climate-kid.test.ts` compares only
 *    `climate_kid` and a `git diff` name list; the whole-object comparison is
 *    below.
 *  - **Criterion 16's** "exactly one file carries the dead-loopback proxy
 *    literal" scan excludes `climate-kid.test.ts` from its own sweep. The scan
 *    below excludes nothing: it sweeps every `*.ts` under `question-bank/src/`,
 *    this file included, and builds the needle from parts at run time so that
 *    looking for the literal never becomes a second copy of it. (Round 2 of
 *    this task is exactly why: an earlier version of this file spelled the
 *    literal out in two comments and, being untracked when the suite last ran,
 *    hid from the worker's `git ls-files`-based count until it was committed.)
 *
 * Everything else re-derives its expected values from the criterion text (the
 * 15–90 and 3–16 bounds and their named edges, the four forbidden-value lists,
 * the 31 Köppen codes, the pinned `built_at`, the 51 rebuilt paths) and from
 * the brief's `## Handoff` table, transcribed here by the tester from the brief
 * rather than read off the built bank — so a phrase the Handoff mis-states is a
 * failure rather than a silent agreement. The Handoff's own per-row character
 * and word counts are transcribed too and re-computed, since criterion 17 makes
 * the Handoff the thing a person reads instead of 50 files.
 *
 * No network: the one subprocess is the build CLI with `--offline` and all six
 * proxy spellings pointed at a dead loopback port, via `offline-rebuild.ts`
 * (`test-guidelines.md`). Nothing mocks `fetch`. Nothing writes inside
 * `question-bank/`.
 *
 * What no test here can settle is whether each phrase is *true* of that state
 * or *readable* by a nine-year-old. That is the brief's Review checklist, and
 * only a named person closes it (`process-decisions.md` D-4a).
 */

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");
const SAMPLE = join(PKG, "sample-data/us-state-co.json");
const BUILD_SCRIPT = join(PKG, "src/build.ts");

/** Criterion 12 and the brief's Constraints both name this instant literally. */
const PINNED_BUILT_AT = "2026-08-04T16:05:35.000Z";

/** Criterion 14's pinned string — also `geoquizdataplan.md` §1.4 and `openapi.yaml:1478`. */
const COLORADO_PHRASE = "dry and cold in the mountains, drier plains to the east";

/**
 * Criterion 17: the Handoff's 50-row table, transcribed by the tester from the
 * brief — `[phrase, claimed characters, claimed words]`. The Handoff is the
 * *claim*; the tracked bank is the *fact*, and the tests below compare them.
 */
const HANDOFF: Record<string, [string, number, number]> = {
  AL: ["hot sticky summers and mild winters, with strong thunderstorms much of the year", 79, 13],
  AK: ["long cold snowy winters inland, milder and rainy along the southern coast", 73, 12],
  AZ: ["scorching dry summers in the desert, cooler snowy winters up north", 66, 11],
  AR: ["hot humid summers with strong storms, and mild winters that turn icy at times", 77, 14],
  CA: ["sunny dry summers near the coast, hot deserts and snowy mountains further inland", 80, 13],
  CO: ["dry and cold in the mountains, drier plains to the east", 55, 11],
  CT: ["cold snowy winters and warm sticky summers, with all four seasons clearly felt", 78, 13],
  DE: ["mild humid summers and cool damp winters, close to the ocean's moderating winds", 79, 13],
  FL: ["hot muggy summers nearly all year, with sudden storms and mild winters", 70, 12],
  GA: ["hot muggy summers and mild winters, with thunderstorms common in the warm months", 80, 13],
  HI: ["warm breezy weather all year, with wetter mountains and drier coasts nearby", 75, 12],
  ID: ["warm dry summers and cold snowy winters, especially high in the mountains", 73, 12],
  IL: ["hot humid summers, cold snowy winters, and strong storms every spring", 69, 11],
  IN: ["warm sticky summers, icy cold winters, and plenty of storms each spring", 71, 12],
  IA: ["hot humid summers and freezing cold winters, with strong winds across the open fields", 85, 14],
  KS: ["hot dry summers and cold windy winters, with sudden storms sweeping the plains", 78, 13],
  KY: ["warm humid summers and cool winters, with occasional snow and ice storms", 72, 12],
  LA: ["hot muggy summers most of the year, mild winters, and occasional powerful storms", 80, 13],
  ME: ["cold snowy winters and cool breezy summers, especially up near the coast", 72, 12],
  MD: ["hot humid summers and cold winters, milder and breezier close to the water", 74, 13],
  MA: ["cold snowy winters with strong coastal storms, and warm humid summers", 69, 11],
  MI: ["long cold winters with heavy lake snow, and mild humid summers", 62, 11],
  MN: ["bitterly cold snowy winters and warm humid summers, with big swings between them", 80, 13],
  MS: ["hot muggy summers nearly all year, with mild winters and frequent thunderstorms", 79, 12],
  MO: ["hot humid summers and cold winters, with sudden storms and occasional ice", 73, 12],
  MT: ["cold snowy winters in the mountains, hot dry summers out on the plains", 70, 13],
  NE: ["hot windy summers and freezing cold winters, with sudden storms across the open plains", 86, 14],
  NV: ["hot dry summers, cold winters, and very little rain any time of year", 68, 13],
  NH: ["cold snowy winters, especially high in the mountains, and warm summers below", 76, 12],
  NJ: ["hot humid summers and cold snowy winters, with occasional storms along the shore", 80, 13],
  NM: ["hot dry summers in the lowlands, cold snowy winters up in the mountains", 71, 13],
  NY: ["cold snowy winters, heaviest near the lakes and mountains, and warm humid summers", 81, 13],
  NC: ["hot humid summers, and winters that turn cold and snowy up in the mountains", 75, 14],
  ND: ["bitterly cold winters and hot summers, with strong winds across the open plains", 79, 13],
  OH: ["cold snowy winters near the lake, and warm humid summers the rest of the year", 77, 15],
  OK: ["hot windy summers and mild winters, with sudden severe storms in spring", 71, 12],
  OR: ["wet mild winters and dry sunny summers near the coast, drier further east", 73, 13],
  PA: ["cold snowy winters and warm humid summers, changing a lot from place to place", 77, 14],
  RI: ["cold snowy winters and warm humid summers, with strong storms off the coast", 75, 13],
  SC: ["hot muggy summers, mild winters, and the chance of a strong coastal storm", 73, 13],
  SD: ["cold windy winters and hot summers, with sudden storms sweeping the plains", 74, 12],
  TN: ["hot humid summers and mild winters, with occasional snow in the higher hills", 76, 13],
  TX: ["scorching hot summers, humid and stormy in the east, drier and milder out west", 78, 14],
  UT: ["dry hot summers in the lowlands, and cold snowy winters up in the mountains", 75, 14],
  VT: ["cold snowy winters, heavy in the mountains, and mild cool summers below", 71, 12],
  VA: ["hot humid summers near the coast, colder and snowier out in the mountains", 73, 13],
  WA: ["wet mild winters and dry summers near the coast, drier and hotter to the east", 77, 15],
  WV: ["warm humid summers and cold snowy winters, especially high in the hills", 71, 12],
  WI: ["bitterly cold snowy winters and warm humid summers, right in the middle of the country", 86, 15],
  WY: ["cold snowy winters high in the mountains, and hot dry summers down in the valleys below", 87, 16],
};

/** Criterion 17's interchangeable-climate groups, transcribed from the Handoff. */
const HANDOFF_GROUPS: Record<string, string[]> = {
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

/** The Handoff's "deliberately not grouped" states, transcribed from the brief. */
const HANDOFF_UNGROUPED = ["MO", "NY", "CA", "AK", "HI", "FL", "TX", "OK", "CO"] as const;

/** Criterion 15a: the six states the tree carries no `landmark` for. */
const LANDMARK_BLANKS = ["DE", "IA", "KS", "MS", "OK", "RI"] as const;

/**
 * Criterion 15. SHA-256 (first 16 hex) of each of the 51 tracked paths as they
 * stand on the default branch (`main` at this task's branch point, 13a735f),
 * with any `climate_kid` key removed before hashing, over `JSON.stringify` of
 * the parsed object — except `index.json`, hashed over its raw bytes, because
 * 15d says "byte-identical". Regenerating these is a two-line script; pinning
 * them is what lets the check run on a shallow CI clone.
 *
 * **`us-state-ak.json` re-pinned 2026-09-18.** Alaska's `landmark` (and the
 * `highest_point` this task already strips) changed from "Denali" to "Mount
 * McKinley" — Dkaattae's decision on PR #47, the same call T-013's reviewer
 * left open. This digest is recomputed with the new value; nothing else about
 * the neutralisation changed.
 *
 * **All 50 re-pinned again 2026-09-18 (T-017).** `region` moved on every
 * tracked state file, the largest change any of these guards has absorbed. It
 * had a real value both before and after this task, so — unlike `climate_kid`
 * itself, which the criterion-15 test below restores by deleting the key it
 * knows was absent — the key is simply dropped before hashing, for all 50
 * files.
 */
const BASELINE_DIGESTS: Record<string, string> = {
  "index.json": "cd6822166faad673",
  "us-state-ak.json": "587666550161ddf1",
  "us-state-al.json": "82ab9588076b3db0",
  "us-state-ar.json": "561806edd56aabf4",
  "us-state-az.json": "9fa14329e4b144bb",
  "us-state-ca.json": "b6353f508ddc8359",
  "us-state-co.json": "5ca27841d528e1a2",
  "us-state-ct.json": "1252f4c86d7f7a02",
  "us-state-de.json": "15983e11ad03ae2f",
  "us-state-fl.json": "dbe71284ff699e23",
  "us-state-ga.json": "2d9fa327b4a80534",
  "us-state-hi.json": "c137c91a1bc47f3e",
  "us-state-ia.json": "b7a3b84690acab5d",
  "us-state-id.json": "118a374b6e523db0",
  "us-state-il.json": "ea3a9128cb0e1173",
  "us-state-in.json": "ec47dbaf1d17b121",
  "us-state-ks.json": "4a79f2a995cbe70e",
  "us-state-ky.json": "27ba3ecfece60554",
  "us-state-la.json": "252296416894caa6",
  "us-state-ma.json": "09cb58b494ed91a8",
  "us-state-md.json": "0da1586f68272870",
  "us-state-me.json": "a926140e1eff24b6",
  "us-state-mi.json": "808281523dd2fae7",
  "us-state-mn.json": "f66534b7c479ad1e",
  "us-state-mo.json": "3700da9e872dbc52",
  "us-state-ms.json": "492b6fdef9145442",
  "us-state-mt.json": "c9696b91c412509a",
  "us-state-nc.json": "c190c6f1999bfffb",
  "us-state-nd.json": "cdb290b86e4c6200",
  "us-state-ne.json": "aeaa240904b8aaba",
  "us-state-nh.json": "e546fff7a815a610",
  "us-state-nj.json": "febda88eeca88c97",
  "us-state-nm.json": "880ee3588c8fbc92",
  "us-state-nv.json": "44a3702a6842b5cc",
  "us-state-ny.json": "0077127c6f911388",
  "us-state-oh.json": "f98b2b1c7806048e",
  "us-state-ok.json": "634eca378ebc98a8",
  "us-state-or.json": "2b75882efa918b15",
  "us-state-pa.json": "fc29a41dfc7dc863",
  "us-state-ri.json": "c8f6a8d682284ebf",
  "us-state-sc.json": "83749783302b65a2",
  "us-state-sd.json": "4be1ea1b3cd222ae",
  "us-state-tn.json": "6d3bc1a0ce140799",
  "us-state-tx.json": "6efdc195678a7949",
  "us-state-ut.json": "03285a43eb758e57",
  "us-state-va.json": "8c98489f276d6e37",
  "us-state-vt.json": "873d23eba39d9d06",
  "us-state-wa.json": "8c2a90397321ead7",
  "us-state-wi.json": "23d1d95c21591b5a",
  "us-state-wv.json": "3ed25d05ad08bb0e",
  "us-state-wy.json": "f1bb478c900eb36f",
};

/** Criterion 7's 31 Köppen class codes, matched as whole words, case-sensitively. */
const KOPPEN_CODES = [
  "Af", "Am", "Aw", "As",
  "BWh", "BWk", "BSh", "BSk",
  "Csa", "Csb", "Csc", "Cwa", "Cwb", "Cwc", "Cfa", "Cfb", "Cfc",
  "Dsa", "Dsb", "Dsc", "Dsd", "Dwa", "Dwb", "Dwc", "Dwd", "Dfa", "Dfb", "Dfc", "Dfd",
  "ET", "EF",
];

/** Criterion 5's unit words (digits and `°` are checked separately). */
const UNIT_WORDS = ["celsius", "fahrenheit", "degrees", "inches", "millimetres", "millimeters"];

/** Criterion 8's 17 geographer's words, case-insensitive substrings. */
const GEOGRAPHER_WORDS = [
  "arid", "subtropical", "subarctic", "temperate", "oceanic", "continental",
  "steppe", "tundra", "mediterranean", "precipitation", "humidity", "latitude",
  "elevation", "climate zone", "biome", "annual", "average",
];

/** Criterion 9's 23 weather words, case-insensitive substrings. */
const WEATHER_WORDS = [
  "hot", "cold", "cool", "warm", "wet", "dry", "rain", "snow", "sun", "wind",
  "storm", "humid", "mild", "freez", "ice", "icy", "fog", "breez", "chill",
  "damp", "muggy", "sticky", "frost",
];

/** Criterion 4's forbidden characters, written out one by one from the text. */
const FORBIDDEN_CHARS = [";", ":", "(", ")", "/", '"', "*", "|"];

interface Entity {
  name: string;
  climate_kid?: string;
  state_animal?: string;
  landmark?: string;
  top_crops?: unknown[];
  fun_facts?: { text: string; reviewed?: boolean }[];
  sources?: { built_at?: string };
}

const digest = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);

/**
 * Reads the 50 entity files straight off disk with `readdirSync` — deliberately
 * a different route from `climate-kid.test.ts`'s `git ls-files`, so a stray
 * untracked file or a tracked-but-missing one shows up as a count mismatch
 * here. Criterion 16's carve-out says a tester suite may keep its own route.
 */
function stateFiles(): { postal: string; file: string; raw: string; entity: Entity }[] {
  const names = readdirSync(DATA_DIR)
    .filter((n) => /^us-state-[a-z]{2}\.json$/.test(n))
    .sort();
  if (names.length !== 50) {
    throw new Error(`expected 50 entity files on disk, found ${names.length}`);
  }
  return names.map((file) => {
    const raw = readFileSync(join(DATA_DIR, file), "utf8");
    return {
      postal: file.slice(9, 11).toUpperCase(),
      file,
      raw,
      entity: JSON.parse(raw) as Entity,
    };
  });
}

/** Criterion 1 permits no blank, so a missing key throws rather than filtering away. */
function phrases(): { postal: string; file: string; value: string }[] {
  return stateFiles().map(({ postal, file, entity }) => {
    if (typeof entity.climate_kid !== "string") {
      throw new Error(`${file}: no climate_kid string — criterion 1 permits no blank`);
    }
    return { postal, file, value: entity.climate_kid };
  });
}

const wordsOf = (v: string) => v.split(/\s+/).filter(Boolean);
const wholeWord = (haystack: string, needle: string, caseSensitive: boolean) =>
  new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, caseSensitive ? "" : "i").test(
    haystack,
  );

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

describe("T-014 tester, criterion 1 — all fifty are filled, and none is a placeholder", () => {
  test("every one of the 50 files on disk carries a non-empty climate_kid string", () => {
    const rows = phrases();
    expect(rows).toHaveLength(50);
    for (const { file, value } of rows) {
      expect({ file, type: typeof value, empty: value.length === 0 }).toEqual({
        file,
        type: "string",
        empty: false,
      });
    }
  });

  test("no value is one of the placeholders the criterion names", () => {
    const placeholders = ["", "unknown", "none", "tbd", "n/a", "—"];
    for (const { file, value } of phrases()) {
      expect({ file, placeholder: placeholders.includes(value.trim().toLowerCase()) }).toEqual({
        file,
        placeholder: false,
      });
    }
  });

  test("the filled set is exactly the 50 curated states — no state is silently blank", () => {
    expect(phrases().map(({ postal }) => postal).sort()).toEqual(
      CURATED_US_STATES.map((s) => s.postal).sort(),
    );
  });
});

describe("T-014 tester, criterion 2 — short enough to read, long enough to say something", () => {
  const charsOk = (v: string) => v.length >= 15 && v.length <= 90;
  const wordsOk = (v: string) => wordsOf(v).length >= 3 && wordsOf(v).length <= 16;

  test("the character bound is inclusive where the criterion says: 14 no, 15 yes, 90 yes, 91 no", () => {
    expect(charsOk("x".repeat(14))).toBe(false);
    expect(charsOk("x".repeat(15))).toBe(true);
    expect(charsOk("x".repeat(90))).toBe(true);
    expect(charsOk("x".repeat(91))).toBe(false);
  });

  test("the word bound is inclusive where the criterion says: 2 no, 3 yes, 16 yes, 17 no", () => {
    expect(wordsOk("one two")).toBe(false);
    expect(wordsOk("one two three")).toBe(true);
    expect(wordsOk(Array.from({ length: 16 }, () => "w").join(" "))).toBe(true);
    expect(wordsOk(Array.from({ length: 17 }, () => "w").join(" "))).toBe(false);
  });

  test("every shipped phrase is 15–90 characters", () => {
    for (const { file, value } of phrases()) {
      expect({ file, chars: value.length, ok: charsOk(value) }).toEqual({
        file,
        chars: value.length,
        ok: true,
      });
    }
  });

  test("every shipped phrase is 3–16 words", () => {
    for (const { file, value } of phrases()) {
      expect({ file, words: wordsOf(value).length, ok: wordsOk(value) }).toEqual({
        file,
        words: wordsOf(value).length,
        ok: true,
      });
    }
  });

  test("Colorado's is the 55 characters and 11 words the criterion states", () => {
    const co = phrases().find((p) => p.postal === "CO")?.value as string;
    expect(co.length).toBe(55);
    expect(wordsOf(co)).toHaveLength(11);
  });
});

describe("T-014 tester, criterion 3 — clean text", () => {
  test("every phrase equals its own trim()", () => {
    for (const { file, value } of phrases()) {
      expect({ file, trimmed: value === value.trim() }).toEqual({ file, trimmed: true });
    }
  });

  test("no phrase contains a double space", () => {
    for (const { file, value } of phrases()) {
      expect({ file, doubled: value.includes("  ") }).toEqual({ file, doubled: false });
    }
  });

  test("no phrase contains a newline or a tab", () => {
    for (const { file, value } of phrases()) {
      expect({ file, control: /[\n\t]/.test(value) }).toEqual({ file, control: false });
    }
  });
});

describe("T-014 tester, criterion 4 — a fragment, not a sentence", () => {
  test("every phrase begins with a lowercase a–z", () => {
    for (const { file, value } of phrases()) {
      expect({ file, value, ok: /^[a-z]/.test(value) }).toEqual({ file, value, ok: true });
    }
  });

  test("no phrase ends with a full stop, an exclamation mark or a question mark", () => {
    for (const { file, value } of phrases()) {
      expect({ file, value, terminal: /[.!?]$/.test(value) }).toEqual({
        file,
        value,
        terminal: false,
      });
    }
  });

  test("no phrase contains any of ; : ( ) / \" * | or the substring http", () => {
    for (const { file, value } of phrases()) {
      const hits = FORBIDDEN_CHARS.filter((c) => value.includes(c));
      expect({ file, value, hits }).toEqual({ file, value, hits: [] });
      expect({ file, value, http: value.includes("http") }).toEqual({ file, value, http: false });
    }
  });

  test("a comma is allowed — the criterion says so and most phrases use one", () => {
    const withComma = phrases().filter(({ value }) => value.includes(","));
    expect(withComma.length).toBeGreaterThan(0);
    for (const { file, value } of withComma) {
      const hits = FORBIDDEN_CHARS.filter((c) => value.includes(c));
      expect({ file, hits }).toEqual({ file, hits: [] });
    }
  });

  test("both of T-026's frames render without a doubled stop or a capital mid-sentence", () => {
    for (const { file, postal, value } of phrases()) {
      const name = CURATED_US_STATES.find((s) => s.postal === postal)?.name as string;
      const question = `Which state is ${value}?`;
      const statement = `${name} is ${value}.`;
      expect({ file, question: /\?\?|\.\?/.test(question) }).toEqual({ file, question: false });
      expect({ file, statement: /\.\.$/.test(statement) }).toEqual({ file, statement: false });
      expect({ file, startsLower: /^Which state is [a-z]/.test(question) }).toEqual({
        file,
        startsLower: true,
      });
    }
  });
});

describe("T-014 tester, criterion 5 — no numbers and no units", () => {
  test("the criterion's own examples fall on the sides it names", () => {
    const bad = (v: string) =>
      /[0-9]/.test(v) || v.includes("°") || UNIT_WORDS.some((u) => v.toLowerCase().includes(u));
    expect(bad("snow up to 300 inches")).toBe(true);
    expect(bad("loads of snow")).toBe(false);
  });

  test("no phrase contains a digit 0–9 or the degree sign", () => {
    for (const { file, value } of phrases()) {
      expect({ file, value, digit: /[0-9]/.test(value) }).toEqual({ file, value, digit: false });
      expect({ file, value, degree: value.includes("°") }).toEqual({
        file,
        value,
        degree: false,
      });
    }
  });

  test("no phrase contains any of the six unit words, case-insensitively", () => {
    for (const { file, value } of phrases()) {
      const hits = UNIT_WORDS.filter((u) => value.toLowerCase().includes(u));
      expect({ file, value, hits }).toEqual({ file, value, hits: [] });
    }
  });
});

describe("T-014 tester, criterion 6 — nothing says Köppen", () => {
  test("no shipped phrase contains köppen or koppen, case-insensitively", () => {
    for (const { file, value } of phrases()) {
      expect({ file, hit: /k[oö]ppen/i.test(value) }).toEqual({ file, hit: false });
    }
  });

  test("no climate_kid value in the curated source mentions köppen either", () => {
    const source = readFileSync(join(PKG, "src/curated/us-states.ts"), "utf8");
    const lines = source.split("\n").filter((l) => l.trim().startsWith("climate_kid:"));
    expect(lines).toHaveLength(50);
    for (const line of lines) {
      expect({ line, hit: /k[oö]ppen/i.test(line) }).toEqual({ line, hit: false });
    }
  });
});

describe("T-014 tester, criterion 7 — no Köppen class code as a whole word", () => {
  test("the criterion's own examples: lowercase 'as' does not trip it, a stray BSk does", () => {
    expect(wholeWord("as wet as it gets", "As", true)).toBe(false);
    expect(wholeWord("winters are BSk here", "BSk", true)).toBe(true);
  });

  test("the list under test is the 31 codes the criterion names", () => {
    expect(KOPPEN_CODES).toHaveLength(31);
    expect(new Set(KOPPEN_CODES).size).toBe(31);
  });

  test("no phrase carries any of the 31 codes as a whole word, case-sensitively", () => {
    for (const { file, value } of phrases()) {
      const hits = KOPPEN_CODES.filter((code) => wholeWord(value, code, true));
      expect({ file, value, hits }).toEqual({ file, value, hits: [] });
    }
  });
});

describe("T-014 tester, criterion 8 — no geographer's word for a climate", () => {
  test("the criterion's own examples fall on the sides it names, humid included", () => {
    const hit = (v: string) => GEOGRAPHER_WORDS.filter((w) => v.toLowerCase().includes(w));
    expect(hit("humid subtropical summers")).toEqual(["subtropical"]);
    expect(hit("semi-arid plains")).toEqual(["arid"]);
    expect(hit("hot sticky summers")).toEqual([]);
    expect(hit("humid and hot")).toEqual([]);
    expect(hit("high humidity")).toEqual(["humidity"]);
  });

  test("the list under test is the 17 words the criterion names", () => {
    expect(GEOGRAPHER_WORDS).toHaveLength(17);
  });

  test("no phrase contains any of the 17, as a case-insensitive substring", () => {
    for (const { file, value } of phrases()) {
      const hits = GEOGRAPHER_WORDS.filter((w) => value.toLowerCase().includes(w));
      expect({ file, value, hits }).toEqual({ file, value, hits: [] });
    }
  });
});

describe("T-014 tester, criterion 9 — each phrase is actually about weather", () => {
  test("the criterion's own examples fall on the sides it names", () => {
    const any = (v: string) => WEATHER_WORDS.some((w) => v.toLowerCase().includes(w));
    expect(any("beautiful all year round")).toBe(false);
    expect(any(COLORADO_PHRASE)).toBe(true);
  });

  test("the list under test is the 23 words the criterion names", () => {
    expect(WEATHER_WORDS).toHaveLength(23);
  });

  test("every phrase contains at least one weather word", () => {
    for (const { file, value } of phrases()) {
      const matches = WEATHER_WORDS.filter((w) => value.toLowerCase().includes(w));
      expect({ file, value, matched: matches.length > 0 }).toEqual({
        file,
        value,
        matched: true,
      });
    }
  });
});

describe("T-014 tester, criterion 10 — no phrase names a state", () => {
  const STATE_NAMES = CURATED_US_STATES.map((s) => s.name);

  test("the criterion's own edge: the Sierra Nevada wording fails, the high Sierra passes", () => {
    expect(wholeWord("wet winters in the Sierra Nevada", "Nevada", false)).toBe(true);
    expect(wholeWord("wet winters in the high Sierra", "Nevada", false)).toBe(false);
    expect(
      STATE_NAMES.filter((n) => wholeWord("cold snowy winters by the Great Lakes", n, false)),
    ).toEqual([]);
  });

  test("no phrase names any of the 50 states as a whole word, its own included", () => {
    for (const { file, value } of phrases()) {
      const hits = STATE_NAMES.filter((name) => wholeWord(value, name, false));
      expect({ file, value, hits }).toEqual({ file, value, hits: [] });
    }
  });

  test("the check would catch a phrase naming its own state", () => {
    const co = CURATED_US_STATES.find((s) => s.postal === "CO")?.name as string;
    expect(wholeWord(`dry and cold in the ${co} mountains`, co, false)).toBe(true);
  });
});

describe("T-014 tester, criterion 11 — all distinct, and none contains another", () => {
  test("the 50 phrases are distinct after trim() and lowercasing", () => {
    const keys = phrases().map(({ value }) => value.trim().toLowerCase());
    expect(keys).toHaveLength(50);
    expect(new Set(keys).size).toBe(50);
  });

  test("no phrase is a substring of any other, in either direction", () => {
    const rows = phrases().map(({ postal, value }) => ({
      postal,
      key: value.trim().toLowerCase(),
    }));
    const collisions: string[] = [];
    for (const a of rows) {
      for (const b of rows) {
        if (a.postal === b.postal) continue;
        if (b.key.includes(a.key)) collisions.push(`${a.postal} ⊂ ${b.postal}`);
      }
    }
    expect(collisions).toEqual([]);
  });

  test("the containment rule is what the criterion means, not just equality", () => {
    const a: string = "hot humid summers";
    const b: string = "hot humid summers and cold winters";
    expect(a === b).toBe(false);
    expect(b.includes(a)).toBe(true);
  });
});

describe("T-014 tester, criterion 12 — the bank is built, not hand-edited", () => {
  const PATHS = Object.keys(BASELINE_DIGESTS);

  // The shared harness from `offline-rebuild.ts` (criterion 16(a)): the real
  // CLI, `--offline`, into a temp dir, every proxy spelling dead. No mocks.
  const first = rebuildOffline(BUILD_SCRIPT, PATHS, "t014-tester-");
  const second = rebuildOffline(BUILD_SCRIPT, PATHS, "t014-tester-");

  test("the rebuild covers all 51 tracked paths", () => {
    expect(PATHS).toHaveLength(51);
    expect(first.size).toBe(51);
  });

  test("an offline rebuild reproduces every tracked path byte-for-byte", () => {
    for (const name of PATHS) {
      expect({ name, same: first.get(name) === readFileSync(join(DATA_DIR, name), "utf8") }).toEqual(
        { name, same: true },
      );
    }
  });

  test("a second offline rebuild in a row is byte-identical to the first", () => {
    expect([...second.entries()].sort()).toEqual([...first.entries()].sort());
  });

  test("sources.built_at is still the pinned capture instant in all 50 files", () => {
    for (const { file, entity } of stateFiles()) {
      expect({ file, builtAt: entity.sources?.built_at }).toEqual({
        file,
        builtAt: PINNED_BUILT_AT,
      });
    }
  });

  test("the tracked bank is still inside the 200 KB cap the Constraints name", () => {
    const bytes = walk(join(PKG, "data")).reduce((sum, p) => sum + statSync(p).size, 0);
    expect(bytes).toBeLessThan(200 * 1024);
  });
});

describe("T-014 tester, criterion 13 — the committed sample stays in step with the bank", () => {
  test("the sample equals the tracked Colorado in every field but sources.built_at and top_crops", () => {
    // T-015 (2026-09-17, a later approved task) freezes the sample at
    // `top_crops: []` (its own criterion 12) while populating the tracked
    // copy, so it is excluded here the same way `built_at` already is.
    const strip = (raw: string) => {
      const parsed = JSON.parse(raw) as { sources?: Record<string, unknown> };
      if (parsed.sources) delete parsed.sources["built_at"];
      delete (parsed as Record<string, unknown>)["top_crops"];
      return JSON.stringify(parsed);
    };
    expect(strip(readFileSync(SAMPLE, "utf8"))).toBe(
      strip(readFileSync(join(DATA_DIR, "us-state-co.json"), "utf8")),
    );
  });

  test("climate_kid in particular is present and equal in both", () => {
    const sample = JSON.parse(readFileSync(SAMPLE, "utf8")) as Entity;
    const tracked = JSON.parse(readFileSync(join(DATA_DIR, "us-state-co.json"), "utf8")) as Entity;
    expect(sample.climate_kid).toBe(COLORADO_PHRASE);
    expect(tracked.climate_kid).toBe(COLORADO_PHRASE);
  });
});

describe("T-014 tester, criterion 14 — Colorado's phrase is unchanged", () => {
  test("the curated table, the tracked file and the sample all carry the pinned string", () => {
    expect(CURATED_US_STATES.find((s) => s.postal === "CO")?.climate_kid).toBe(COLORADO_PHRASE);
    expect(
      (JSON.parse(readFileSync(join(DATA_DIR, "us-state-co.json"), "utf8")) as Entity).climate_kid,
    ).toBe(COLORADO_PHRASE);
    expect((JSON.parse(readFileSync(SAMPLE, "utf8")) as Entity).climate_kid).toBe(COLORADO_PHRASE);
  });

  test("it is the string the plan's §1.4 example and openapi.yaml's climateKid example print", () => {
    expect(readFileSync(join(REPO, "geoquizdataplan.md"), "utf8")).toContain(COLORADO_PHRASE);
    expect(readFileSync(join(REPO, "openapi.yaml"), "utf8")).toContain(COLORADO_PHRASE);
  });
});

describe("T-014 tester, criterion 15 — nothing but climate_kid moves in the bank", () => {
  test("each of the 50 files, with climate_kid and top_crops removed, digests to the default branch's value", () => {
    // T-015 (2026-09-17, a later approved task) fills `top_crops` for all 50
    // states. `BASELINE_DIGESTS` was computed at a branch point that predates
    // T-015 too, where every file still carried the literal `top_crops: []`
    // (present, not absent — unlike `climate_kid`, which that baseline never
    // had at all for 49 of the 50 states). Restoring that literal here, rather
    // than deleting the key, reproduces exactly what the pinned digest hashed,
    // so this keeps checking "nothing other than the fields named, approved
    // tasks are known to touch has moved" instead of turning permanently red
    // the moment T-015's own field lands.
    for (const { file, raw } of stateFiles()) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      delete parsed["climate_kid"];
      // T-016 (2026-09-18, a later approved task) adds `highest_point` to
      // Alaska only — the other 49 states already carried it at this task's
      // own baseline, so their pinned digests were computed with it present.
      // Alaska's was not, so it alone is stripped here.
      if (file === "us-state-ak.json") delete parsed["highest_point"];
      // T-017 (2026-09-18, a later approved task) resettles `region` for all
      // 50 states — see the BASELINE_DIGESTS comment above.
      delete parsed["region"];
      parsed["top_crops"] = [];
      expect({ file, digest: digest(JSON.stringify(parsed)) }).toEqual({
        file,
        digest: BASELINE_DIGESTS[file] as string,
      });
    }
  });

  test("the region removal actually drops the key — otherwise the digest check proves nothing (T-017)", () => {
    const il = readFileSync(join(DATA_DIR, "us-state-il.json"), "utf8");
    const parsed = JSON.parse(il) as Record<string, unknown>;
    expect(parsed["region"]).toBe("Great Lakes");
    delete parsed["region"];
    expect(Object.keys(parsed)).not.toContain("region");
  });

  test("15a — exactly 44 states carry landmark, and the six blanks are the ones named", () => {
    const rows = stateFiles();
    const blanks = rows
      .filter(({ entity }) => entity.landmark === undefined)
      .map(({ postal }) => postal)
      .sort();
    expect(blanks).toEqual([...LANDMARK_BLANKS].sort());
    expect(rows.filter(({ entity }) => entity.landmark !== undefined)).toHaveLength(44);
  });

  test("15a — every landmark value still equals its curated row", () => {
    const curated = new Map(CURATED_US_STATES.map((s) => [s.postal, s.landmark] as const));
    for (const { file, postal, entity } of stateFiles()) {
      expect({ file, landmark: entity.landmark }).toEqual({ file, landmark: curated.get(postal) });
    }
  });

  test("15b — all 50 carry state_animal, matching the curated row", () => {
    const curated = new Map(CURATED_US_STATES.map((s) => [s.postal, s.state_animal] as const));
    for (const { file, postal, entity } of stateFiles()) {
      expect({
        file,
        animal: entity.state_animal,
        nonEmpty: (entity.state_animal ?? "").length > 0,
      }).toEqual({ file, animal: curated.get(postal), nonEmpty: true });
    }
  });

  test("15b — every state has exactly one fun fact, reviewed: true, with the curated text", () => {
    const curated = new Map(CURATED_US_STATES.map((s) => [s.postal, s.fun_facts] as const));
    for (const { file, postal, entity } of stateFiles()) {
      expect({ file, count: entity.fun_facts?.length }).toEqual({ file, count: 1 });
      expect({ file, reviewed: entity.fun_facts?.[0]?.reviewed }).toEqual({
        file,
        reviewed: true,
      });
      expect({ file, text: entity.fun_facts?.[0]?.text }).toEqual({
        file,
        text: curated.get(postal)?.[0]?.text,
      });
    }
  });

  test("15c — top_crops is populated from CURATED_US_STATES in all 50 (T-015)", () => {
    const curatedCrops = new Map(CURATED_US_STATES.map((s) => [s.postal, s.top_crops] as const));
    for (const { file, postal, entity } of stateFiles()) {
      const crops = entity.top_crops as unknown;
      expect(Array.isArray(crops)).toBe(true);
      const arr = crops as string[];
      expect({ file, inRange: arr.length >= 1 && arr.length <= 3 }).toEqual({
        file,
        inRange: true,
      });
      expect(curatedCrops.has(postal)).toBe(true);
      expect({ file, topCrops: arr }).toEqual({ file, topCrops: curatedCrops.get(postal) as string[] });
    }
  });

  test("15d — index.json is byte-identical to the default branch's and mentions no climate_kid", () => {
    const raw = readFileSync(join(DATA_DIR, "index.json"), "utf8");
    expect(digest(raw)).toBe(BASELINE_DIGESTS["index.json"] as string);
    expect(raw).not.toContain("climate_kid");
  });

  test("the digest check has teeth: a changed non-climate_kid field breaks it", () => {
    const raw = readFileSync(join(DATA_DIR, "us-state-co.json"), "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    delete parsed["climate_kid"];
    parsed["state_animal"] = "not the real one";
    expect(digest(JSON.stringify(parsed))).not.toBe(BASELINE_DIGESTS["us-state-co.json"]);
  });
});

describe("T-014 tester, criterion 16 — the harness decision holds as branch (a)", () => {
  /**
   * Built from parts so that looking for the literal is never itself a second
   * copy of it — which is what lets the sweep below exclude nothing, this file
   * included. Round 2's defect was an exclusion plus a spelled-out literal.
   */
  const NEEDLE = ["127", "0", "0", "1"].join(".") + ":1";

  const srcFiles = () =>
    readdirSync(join(PKG, "src"))
      .filter((n) => n.endsWith(".ts"))
      .sort();

  test("exactly one file under question-bank/src/ carries the dead-loopback literal, and it is offline-rebuild.ts", () => {
    const withNeedle = srcFiles().filter((n) =>
      readFileSync(join(PKG, "src", n), "utf8").includes(NEEDLE),
    );
    expect(withNeedle).toEqual(["offline-rebuild.ts"]);
  });

  test("the one file is not itself a *.test.ts", () => {
    expect("offline-rebuild.ts".endsWith(".test.ts")).toBe(false);
  });

  test("it exports both the proxy environment and the offline-build runner", async () => {
    const mod = (await import("./offline-rebuild")) as Record<string, unknown>;
    expect(typeof mod["rebuildOffline"]).toBe("function");
    const proxy = mod["DEAD_PROXY"] as Record<string, string>;
    expect(Object.keys(proxy).sort()).toEqual([
      "ALL_PROXY",
      "HTTPS_PROXY",
      "HTTP_PROXY",
      "all_proxy",
      "http_proxy",
      "https_proxy",
    ]);
    for (const value of Object.values(proxy)) expect(value).toContain(NEEDLE);
  });

  test("no *.test.ts under question-bank/src/ spawns src/build.ts itself", () => {
    const tests = srcFiles().filter((n) => n.endsWith(".test.ts"));
    expect(tests.length).toBeGreaterThan(4);
    for (const name of tests) {
      const source = readFileSync(join(PKG, "src", name), "utf8");
      const spawns = [...source.matchAll(/spawnSync\(\s*\[[^\]]*\]/g)].filter((m) =>
        m[0].includes("build.ts"),
      );
      expect({ name, spawnsBuild: spawns.length }).toEqual({ name, spawnsBuild: 0 });
    }
  });

  test("all five offline-rebuild suites obtain the harness from the module and define no proxy of their own", () => {
    for (const name of [
      "committed-bank.test.ts",
      "state-animals.test.ts",
      "landmarks.test.ts",
      "landmarks-verify.test.ts",
      "climate-kid.test.ts",
    ]) {
      const source = readFileSync(join(PKG, "src", name), "utf8");
      expect({ name, imports: /from "\.\/offline-rebuild"/.test(source) }).toEqual({
        name,
        imports: true,
      });
      // A definition, not a mention: the four pre-existing suites each held
      // the dead-loopback proxy address as the quoted value of an `HTTP_PROXY`
      // key in an object literal. A suite that merely *checks* for that
      // spelling (as `climate-kid.test.ts` does) is not defining one, so the
      // pattern requires an `HTTP_PROXY:` key with a quoted `http` value.
      expect({ name, ownProxy: /HTTP_PROXY:\s*["']http/.test(source) }).toEqual({
        name,
        ownProxy: false,
      });
      expect({ name, usesRunner: source.includes("rebuildOffline(") }).toEqual({
        name,
        usesRunner: true,
      });
    }
  });

  test("the deliberate readdirSync-vs-git-ls-files divergence was not collapsed", () => {
    // Criterion 16's carve-out: the *reading route* must stay duplicated, so
    // a stray file (caught by readdirSync) and a tracked-but-missing one
    // (caught by git ls-files) each still fail one suite. Checked on the body
    // of the function that does the reading, not on the file as a whole — the
    // same file also uses `readdirSync` for an unrelated `*.review.json` scan,
    // and matching that would let the real route be swapped unnoticed.
    const bodyOf = (source: string, signature: string) => {
      const start = source.indexOf(signature);
      expect(start).toBeGreaterThan(-1);
      const end = source.indexOf("\n}", start);
      return source.slice(start, end);
    };
    const worker = readFileSync(join(PKG, "src/landmarks.test.ts"), "utf8");
    const tester = readFileSync(join(PKG, "src/landmarks-verify.test.ts"), "utf8");

    const testerRoute = bodyOf(tester, "function stateFiles()");
    expect(testerRoute).toContain("readdirSync(");
    expect(testerRoute).not.toContain("ls-files");
    expect(testerRoute).not.toContain("trackedUnder(");

    const workerRoute = bodyOf(worker, "function trackedStateFiles()");
    expect(workerRoute).toContain("trackedUnder(");
    expect(workerRoute).not.toContain("readdirSync(");
    expect(bodyOf(worker, "function trackedUnder(")).toContain("ls-files");
  });

  test("criterion 16(b) was not also taken — no new engineering-decisions entry claims this", () => {
    // Exactly one of (a) and (b) must be true. (a) is demonstrated above, so
    // the record must not simultaneously carry (b)'s "kept, with the reason"
    // entry, which would describe duplication that no longer exists.
    const decisions = readFileSync(join(REPO, "engineering-decisions.md"), "utf8");
    expect(decisions).not.toContain("dead-loopback proxy map");
  });
});

describe("T-014 tester, criterion 17 — everything a person has to read is in one place", () => {
  test("the Handoff's table names all 50 states exactly once", () => {
    const keys = Object.keys(HANDOFF);
    expect(keys).toHaveLength(50);
    expect(keys.sort()).toEqual(CURATED_US_STATES.map((s) => s.postal).sort());
  });

  test("every phrase the Handoff claims is the phrase the tracked file carries, exactly", () => {
    const shipped = new Map(phrases().map(({ postal, value }) => [postal, value]));
    for (const [postal, [claimed]] of Object.entries(HANDOFF)) {
      expect({ postal, shipped: shipped.get(postal) }).toEqual({ postal, shipped: claimed });
    }
  });

  test("nothing ships a phrase the Handoff does not declare", () => {
    for (const { file, postal, value } of phrases()) {
      expect({ file, declared: HANDOFF[postal]?.[0] }).toEqual({ file, declared: value });
    }
  });

  test("the Handoff's per-row character and word counts are true of the shipped phrase", () => {
    for (const [postal, [phrase, chars, words]] of Object.entries(HANDOFF)) {
      expect({ postal, chars: phrase.length, words: wordsOf(phrase).length }).toEqual({
        postal,
        chars,
        words,
      });
    }
  });

  test("every grouped state is filled, and no state appears in two groups", () => {
    const seen = new Set<string>();
    for (const [group, states] of Object.entries(HANDOFF_GROUPS)) {
      expect({ group, size: states.length > 1 }).toEqual({ group, size: true });
      for (const postal of states) {
        expect({ group, postal, filled: HANDOFF[postal] !== undefined }).toEqual({
          group,
          postal,
          filled: true,
        });
        expect({ group, postal, twice: seen.has(postal) }).toEqual({ group, postal, twice: false });
        seen.add(postal);
      }
    }
  });

  test("the grouped and deliberately-ungrouped states together account for all 50", () => {
    const grouped = Object.values(HANDOFF_GROUPS).flat();
    const all = [...grouped, ...HANDOFF_UNGROUPED];
    expect(new Set(all).size).toBe(50);
    expect([...new Set(all)].sort()).toEqual(CURATED_US_STATES.map((s) => s.postal).sort());
  });

  test("grouped states really do ship different strings — grouping is about content, criterion 11 about wording", () => {
    const shipped = new Map(phrases().map(({ postal, value }) => [postal, value]));
    for (const [group, states] of Object.entries(HANDOFF_GROUPS)) {
      const values = states.map((p) => shipped.get(p) as string);
      expect({ group, distinct: new Set(values).size }).toEqual({
        group,
        distinct: states.length,
      });
    }
  });
});

describe("T-014 tester, criterion 18 — nothing unreviewed, live or new is committed", () => {
  test('no file under data/ or sample-data/ contains reviewed": false', () => {
    const files = [...walk(join(PKG, "data")), ...walk(join(PKG, "sample-data"))];
    expect(files.length).toBeGreaterThan(51);
    for (const path of files) {
      expect({ path, unreviewed: readFileSync(path, "utf8").includes('reviewed": false') }).toEqual({
        path,
        unreviewed: false,
      });
    }
  });

  test("no *.review.json file sits under data/us-states/", () => {
    expect(readdirSync(DATA_DIR).filter((n) => n.endsWith(".review.json"))).toEqual([]);
  });

  test("question-bank declares no runtime dependency and the same two devDependencies", () => {
    const pkg = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies ?? {}).toEqual({});
    expect(Object.keys(pkg.devDependencies ?? {}).sort()).toEqual(["@types/bun", "typescript"]);
  });

  test("no test file under question-bank/src/ calls fetch, assigns it, or mocks a transport", () => {
    const tests = readdirSync(join(PKG, "src")).filter((n) => n.endsWith(".test.ts"));
    expect(tests.length).toBeGreaterThan(4);
    for (const name of tests) {
      const source = readFileSync(join(PKG, "src", name), "utf8");
      expect({ name, calls: /\bfetch\s*\(/.test(source) }).toEqual({ name, calls: false });
      expect({ name, assigns: /fetch\s*=/.test(source) }).toEqual({ name, assigns: false });
      expect({ name, mocks: /\bmock\s*\(/.test(source) }).toEqual({ name, mocks: false });
    }
  });

  test("the only package.json under question-bank/ still has no dependencies block growth", () => {
    // The brief's criterion 18 is repo-wide; the two other packages are checked
    // for an unchanged dependency list by their own suites, and this task's
    // Verdict records the `git diff` over every lockfile in the repo.
    const pkg = readFileSync(join(PKG, "package.json"), "utf8");
    expect(pkg).not.toContain('"dependencies"');
  });
});

describe("T-014 tester, criterion 19 — nothing already verified is weakened", () => {
  /**
   * Floors for the eight suites criterion 19 protects, counted from the tree as
   * this task leaves it. A later deletion drops below the floor without needing
   * git history (CI clones shallow). Whether an assertion was *loosened* is a
   * diff property and is recorded in the brief's Verdict; the two exact-equality
   * assertions this task rewrote are re-checked below rather than counted.
   */
  const FLOORS: Record<string, { tests: number; expects: number }> = {
    "committed-bank.test.ts": { tests: 33, expects: 58 },
    "data-us-states.test.ts": { tests: 6, expects: 14 },
    "fun-facts.test.ts": { tests: 30, expects: 59 },
    "state-animals.test.ts": { tests: 43, expects: 73 },
    "landmarks.test.ts": { tests: 53, expects: 88 },
    "landmarks-verify.test.ts": { tests: 36, expects: 69 },
    "normalize.test.ts": { tests: 14, expects: 31 },
    "sparql.test.ts": { tests: 5, expects: 7 },
  };

  for (const [file, floor] of Object.entries(FLOORS)) {
    test(`${file} still declares at least ${floor.tests} tests and ${floor.expects} expectations`, () => {
      const source = readFileSync(join(PKG, "src", file), "utf8");
      const tests = [...source.matchAll(/^\s*test(\.\w+)?\(/gm)].length;
      const expects = [...source.matchAll(/expect\(/g)].length;
      expect({ file, tests: tests >= floor.tests, expects: expects >= floor.expects }).toEqual({
        file,
        tests: true,
        expects: true,
      });
    });
  }

  test("the rewritten climate_kid-coverage assertions still pin an exact set, not a count", () => {
    for (const name of [
      "state-animals.test.ts",
      "landmarks.test.ts",
      "landmarks-verify.test.ts",
    ]) {
      const source = readFileSync(join(PKG, "src", name), "utf8");
      expect({ name, exact: /^\s*expect\(named\)\.toEqual\(/m.test(source) }).toEqual({
        name,
        exact: true,
      });
      // Anchored to the start of a statement, so a *quoted* mention of a
      // loosened form (T-013's own tester asserts one is absent) is not a hit.
      expect({
        name,
        loosened: /^\s*expect\(named(\.length)?\)\.(toContain|toHaveLength|toBeGreaterThan)/m.test(
          source,
        ),
      }).toEqual({ name, loosened: false });
    }
  });

  test("committed-bank.test.ts's expect count really is 58, so the lowered floor is not slack", () => {
    // Criterion 16(a) exempts the harness extraction from "loosened"; this
    // pins that the floor three files carry was lowered exactly as far as the
    // extraction forced and no further.
    const source = readFileSync(join(PKG, "src/committed-bank.test.ts"), "utf8");
    expect([...source.matchAll(/expect\(/g)].length).toBe(58);
  });

  test("the offline runner still fails a non-zero build rather than swallowing it", () => {
    // The two `expect(proc.exitCode).toBe(0)` calls the extraction removed are
    // replaced by a throw inside `rebuildOffline`; if that throw were dropped,
    // a broken build would read as a pass everywhere.
    const source = readFileSync(join(PKG, "src/offline-rebuild.ts"), "utf8");
    expect(source).toContain("exitCode !== 0");
    expect(source).toContain("throw new Error");
    expect(() => rebuildOffline(join(PKG, "src/does-not-exist.ts"), ["index.json"], "t014-neg-")).toThrow();
  });

  /**
   * Same named per-task exception as `climate-kid.test.ts`'s copy of this
   * guard, and for the same reason: the range is not scoped to T-014's own
   * commits, so on a later task's branch this measures that task's diff.
   *
   * - `backend/tests/test_region_vocabulary.py` — T-017 (tester), the served
   *   side of the region closed-set check.
   *
   * **This does not make the assertion pass, and is not meant to.** Its range
   * is the hardcoded `13a735f`, which predates the FastAPI backend itself, so
   * `backend/app/data/content.json` is in the diff on `origin/main` too and
   * this test is red there — measured, 1192 pass / 1 fail in a clean worktree
   * at `f5b2382`. The exception exists so that T-017 adds nothing to that
   * failure: the list it reports here is identical to the one it reports on
   * `origin/main`. T-070 owns re-pinning it for real.
   */
  const ALLOWED_OUTSIDE_QUESTION_BANK = ["backend/tests/test_region_vocabulary.py"];

  test("frontend/ and backend/ carry no change from this task", () => {
    const proc = Bun.spawnSync(["git", "diff", "--name-only", "13a735f...HEAD"], { cwd: REPO });
    const stdout = proc.stdout.toString();
    if (proc.exitCode === 0 && stdout.trim().length > 0) {
      const outside = stdout
        .split("\n")
        .filter(Boolean)
        .filter((p) => p.startsWith("frontend/") || p.startsWith("backend/") || p.startsWith("e2e/"))
        .filter((p) => !ALLOWED_OUTSIDE_QUESTION_BANK.includes(p));
      expect(outside).toEqual([]);
    } else {
      // Shallow clone: the branch point is not present. Recorded in the Verdict
      // from a full clone instead.
      expect(proc.exitCode === 0 || proc.exitCode === 128 || proc.exitCode === 1).toBe(true);
    }
  });
});
