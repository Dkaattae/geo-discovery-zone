import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";
import { rebuildOffline } from "./offline-rebuild";

/**
 * T-013 verification, second pass — written by the `tester` role from the
 * acceptance criteria in `tasks/T-013-curate-landmarks.md`, independently of
 * `landmarks.test.ts` (which the worker wrote alongside the data). It is not a
 * copy of that file: it exists because a suite written by the same session that
 * produced the data can only ever confirm that session's own reading of the
 * criteria, and because two criteria were covered there in a way a later change
 * could slip past:
 *
 *  - **Criterion 9** ("the only difference from the same file on the default
 *    branch is the presence or value of a `landmark` key", and "`index.json` is
 *    byte-identical to the default branch's") was recorded as a `git diff`
 *    observation rather than tested, on the grounds that CI clones shallow. It
 *    can be tested without git: `DEFAULT_BRANCH_DIGESTS` below pins, per file,
 *    the SHA-256 of that file **as it stands on the default branch with any
 *    `landmark` key removed** — computed once, here, from
 *    `git show e587ec1:<path>` (e587ec1 is this branch's point off `main`).
 *    Any other field moving in any of the 50 files, or any byte of
 *    `index.json` moving, turns this red with no history required.
 *  - **Criterion 14** names six protected suites; `landmarks.test.ts`'s
 *    floor-count check pins five of them and omits `sparql.test.ts`.
 *
 * Everything else below re-derives its expected values from the criterion text
 * (the 4–48 bound, the punctuation and phrase lists, the substring rule) and
 * from the brief's `## Handoff` table, transcribed here by the tester rather
 * than copied from the built bank — so a value the Handoff mis-states is a
 * failure rather than a silent agreement.
 *
 * No network: the one subprocess is the build CLI with `--offline` and all six
 * proxy spellings pointed at a dead loopback port (`test-guidelines.md`).
 * Nothing mocks `fetch`. Nothing writes inside `question-bank/`.
 *
 * What no test here can settle is whether each landmark is the *right* one for
 * its state. That is the brief's Review checklist, and only a person closes it.
 */

const PKG = resolve(import.meta.dirname, "..");
const DATA_DIR = join(PKG, "data/us-states");
const SAMPLE = join(PKG, "sample-data/us-state-co.json");
const BUILD_SCRIPT = join(PKG, "src/build.ts");

/** Criterion 7 names this instant literally. */
const PINNED_BUILT_AT = "2026-08-04T16:05:35.000Z";

/** Criterion 1: the states the `## Handoff` declares deliberately blank. */
const HANDOFF_BLANKS = ["DE", "IA", "KS", "MS", "OK", "RI"] as const;

/**
 * Criterion 12: the Handoff's 50-row table, transcribed by the tester from the
 * brief. The 44 states it claims a string for; the six above are its blanks.
 */
const HANDOFF_TABLE: Record<string, string> = {
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

/** Criterion 11: the Handoff's self-naming disclosure. */
const HANDOFF_SELF_NAMING = ["GA", "IN"] as const;

/** Criterion 12: the Handoff's "spans more than one state" disclosure. */
const HANDOFF_SPANS: Record<string, string> = {
  TN: "Great Smoky Mountains National Park",
  NV: "Hoover Dam",
  WY: "Yellowstone National Park",
};

/**
 * Criterion 9. SHA-256 of each tracked path as it stands on the default branch
 * (`main` at this task's branch point, commit e587ec1), with any `landmark` key
 * removed before hashing, over `JSON.stringify` of the parsed object — except
 * `index.json`, which is hashed over its raw bytes because criterion 9 says
 * "byte-identical". Regenerating these is a two-line script; they are pinned so
 * the check needs no git history.
 */
const DEFAULT_BRANCH_DIGESTS: Record<string, string> = {
  "index.json": "cd6822166faad673",
  "us-state-ak.json": "f91c4765c0d54664",
  "us-state-al.json": "40df8800263b9d38",
  "us-state-ar.json": "86f9557d4bf83304",
  "us-state-az.json": "462c3325a1966ccd",
  "us-state-ca.json": "c81f07e1f3eed888",
  "us-state-co.json": "72ed5e71192e0688",
  "us-state-ct.json": "60d1ad3776b2e2f8",
  "us-state-de.json": "18a4cebbf8e18b9a",
  "us-state-fl.json": "7d8d302b68b658c2",
  "us-state-ga.json": "6bd6f2a9b112665a",
  "us-state-hi.json": "9ea73548c0be1354",
  "us-state-ia.json": "92ce435dfb28da33",
  "us-state-id.json": "99f71c6d78861198",
  "us-state-il.json": "4960c9587162bd0e",
  "us-state-in.json": "c42d40acbad644b5",
  "us-state-ks.json": "e55a2677742bc79e",
  "us-state-ky.json": "cc8d8f8c326e755f",
  "us-state-la.json": "5205b79d8a6e3ae8",
  "us-state-ma.json": "1586c85acfc86646",
  "us-state-md.json": "4124db608007dd8f",
  "us-state-me.json": "82f4b403c9349ed0",
  "us-state-mi.json": "1bf3e4a864c1dd6d",
  "us-state-mn.json": "10b5c03bab896d76",
  "us-state-mo.json": "3a6b27a66678b8a3",
  "us-state-ms.json": "d09339ac53f425f7",
  "us-state-mt.json": "a0235f7be90d8ef4",
  "us-state-nc.json": "e04bd9bc1460db11",
  "us-state-nd.json": "a1a6485f64258b92",
  "us-state-ne.json": "4cb9f2fdce62ba3d",
  "us-state-nh.json": "55e4ea8fb903ff01",
  "us-state-nj.json": "3227bf02ad8ed07c",
  "us-state-nm.json": "3459d090da2ae6af",
  "us-state-nv.json": "69e6241d6965984e",
  "us-state-ny.json": "959cdc21ec3c6f9f",
  "us-state-oh.json": "46d4215baeb377f0",
  "us-state-ok.json": "a6e139805e3259aa",
  "us-state-or.json": "e96b742e4bdf6f4c",
  "us-state-pa.json": "59c66e1ca4946921",
  "us-state-ri.json": "53fe5e9954b1c9e0",
  "us-state-sc.json": "6938e1d64d9d1ef0",
  "us-state-sd.json": "681700497baac252",
  "us-state-tn.json": "03f9259f8e76dbd9",
  "us-state-tx.json": "681106ecdb558b4e",
  "us-state-ut.json": "668e25bd56eb1a18",
  "us-state-va.json": "60ad1ecfc356d24b",
  "us-state-vt.json": "2142ecac39f953a6",
  "us-state-wa.json": "e3e2b880b75e675b",
  "us-state-wi.json": "55249a219e8f388a",
  "us-state-wv.json": "5a76dccf55df1929",
  "us-state-wy.json": "979dc61725511def",
};

interface Entity {
  name: string;
  climate_kid?: string;
  state_animal?: string;
  landmark?: unknown;
  top_crops?: unknown[];
  sources?: { built_at?: string };
}

const digest = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);

/**
 * Read the 50 entity files straight off disk rather than via `git ls-files` —
 * a deliberately different route from `landmarks.test.ts`, so an untracked
 * stray file or a tracked-but-missing one shows up as a count mismatch here.
 */
function stateFiles(): { postal: string; file: string; raw: string; entity: Entity }[] {
  const names = readdirSync(DATA_DIR)
    .filter((n) => /^us-state-[a-z]{2}\.json$/.test(n))
    .sort();
  if (names.length !== 50) throw new Error(`expected 50 entity files on disk, found ${names.length}`);
  return names.map((file) => {
    const raw = readFileSync(join(DATA_DIR, file), "utf8");
    return {
      postal: (file.slice(9, 11) as string).toUpperCase(),
      file,
      raw,
      entity: JSON.parse(raw) as Entity,
    };
  });
}

const filled = () =>
  stateFiles()
    .filter(({ entity }) => entity.landmark !== undefined)
    .map(({ postal, file, entity }) => ({ postal, file, value: entity.landmark as string }));

// The criterion-3 and criterion-4 predicates, written from the criterion text.
const withinLength = (v: string) => v.length >= 4 && v.length <= 48;
const FORBIDDEN_CHARS = /[,;:()/]/;
const FORBIDDEN_PHRASES = [
  "located",
  "famous",
  "tourist",
  "attraction",
  "known for",
  "national register",
  "you can",
  "is a ",
];
const prosey = (v: string) =>
  FORBIDDEN_CHARS.test(v) ||
  v.includes("http") ||
  v.endsWith(".") ||
  FORBIDDEN_PHRASES.some((p) => v.toLowerCase().includes(p));

describe("T-013 tester, criterion 1 — every state is accounted for, and no blank is silent", () => {
  test("the states with no landmark key are exactly the six the Handoff declares blank", () => {
    const missing = stateFiles()
      .filter(({ entity }) => entity.landmark === undefined)
      .map(({ postal }) => postal)
      .sort();
    expect(missing).toEqual([...HANDOFF_BLANKS].sort());
  });

  test("exactly 50 − 6 = 44 tracked files carry the key", () => {
    expect(filled()).toHaveLength(44);
    expect(filled().length + HANDOFF_BLANKS.length).toBe(50);
  });

  test("every one of the 50 states is either filled or declared blank, never neither", () => {
    const accounted = new Set([...filled().map((f) => f.postal), ...HANDOFF_BLANKS]);
    expect([...accounted].sort()).toEqual(CURATED_US_STATES.map((s) => s.postal).sort());
  });
});

describe("T-013 tester, criterion 2 — a blank is an absent key, not an empty one", () => {
  test("a blank state's file mentions landmark nowhere at all, in raw text", () => {
    for (const postal of HANDOFF_BLANKS) {
      const raw = readFileSync(join(DATA_DIR, `us-state-${postal.toLowerCase()}.json`), "utf8");
      expect({ postal, mentionsLandmark: raw.includes("landmark") }).toEqual({
        postal,
        mentionsLandmark: false,
      });
    }
  });

  test("no filled state carries an empty string, null, or a placeholder word", () => {
    const placeholders = ["", "none", "unknown", "n/a", "na", "tbd", "null", "-"];
    for (const { file, value } of filled()) {
      expect({ file, type: typeof value }).toEqual({ file, type: "string" });
      expect({ file, placeholder: placeholders.includes(String(value).trim().toLowerCase()) }).toEqual(
        { file, placeholder: false },
      );
    }
  });
});

describe("T-013 tester, criterion 3 — every value is a name a child could be shown, not prose", () => {
  test("the length bound is inclusive at 4 and 48 and excludes 3 and 49", () => {
    expect(withinLength("abc")).toBe(false);
    expect(withinLength("abcd")).toBe(true);
    expect(withinLength("x".repeat(48))).toBe(true);
    expect(withinLength("x".repeat(49))).toBe(false);
  });

  test("every shipped value is 4–48 characters, trimmed, single-spaced, and free of newlines and tabs", () => {
    for (const { file, value } of filled()) {
      expect({ file, value, ok: withinLength(value) }).toEqual({ file, value, ok: true });
      expect({ file, value, trimmed: value === value.trim() }).toEqual({ file, value, trimmed: true });
      expect({ file, value, doubled: value.includes("  ") }).toEqual({ file, value, doubled: false });
      expect({ file, value, control: /[\n\t]/.test(value) }).toEqual({ file, value, control: false });
    }
  });

  test("every shipped value starts uppercase and is not shouted", () => {
    for (const { file, value } of filled()) {
      expect({ file, value, upperFirst: value[0] === value[0]?.toUpperCase() }).toEqual({
        file,
        value,
        upperFirst: true,
      });
      expect({ file, value, startsLetter: /^[A-Z]/.test(value) }).toEqual({
        file,
        value,
        startsLetter: true,
      });
      expect({ file, value, allCaps: value === value.toUpperCase() }).toEqual({
        file,
        value,
        allCaps: false,
      });
    }
  });
});

describe("T-013 tester, criterion 4 — no value is reference-book prose, a citation or a location gloss", () => {
  test("the criterion's own examples fall on the sides it names", () => {
    expect(prosey("Great Smoky Mountains National Park")).toBe(false);
    expect(prosey("The Alamo, in San Antonio")).toBe(true);
    expect(prosey("Gateway Arch (St. Louis, Missouri)")).toBe(true);
    expect(prosey("St. Louis Cathedral")).toBe(false); // interior full stop is fine
    expect(prosey("Liberty Bell.")).toBe(true); // trailing one is not
    expect(prosey("A bridge that is a landmark")).toBe(true);
    expect(prosey("See https://example.org")).toBe(true);
  });

  test("no shipped value trips any of the forbidden characters, phrases, http, or a trailing full stop", () => {
    for (const { file, value } of filled()) {
      expect({ file, value, prose: prosey(value) }).toEqual({ file, value, prose: false });
    }
  });
});

describe("T-013 tester, criterion 5 — no two states share a landmark, and none contains another", () => {
  test("all 44 values are distinct case-insensitively after trimming", () => {
    const keys = filled().map(({ value }) => value.trim().toLowerCase());
    expect(keys).toHaveLength(44);
    expect(new Set(keys).size).toBe(44);
  });

  test("no value is a case-insensitive substring of any other, in either direction", () => {
    const all = filled().map(({ postal, value }) => ({ postal, key: value.trim().toLowerCase() }));
    const collisions: string[] = [];
    for (const a of all) {
      for (const b of all) {
        if (a.postal === b.postal) continue;
        if (b.key.includes(a.key)) collisions.push(`${a.postal} "${a.key}" ⊂ ${b.postal} "${b.key}"`);
      }
    }
    expect(collisions).toEqual([]);
  });

  test("the rule the criterion names by example would be caught", () => {
    const contains = (a: string, b: string) => b.toLowerCase().includes(a.toLowerCase());
    expect(contains("Yellowstone", "Yellowstone National Park")).toBe(true);
  });
});

describe("T-013 tester, criterion 6 — the text lives in the build input, not in built output", () => {
  test("each built value is its own state's curated value, and the curated table has 44 rows filled", () => {
    const curated = new Map(CURATED_US_STATES.map((s) => [s.postal, s.landmark] as const));
    const rows = CURATED_US_STATES.filter((s) => s.landmark !== undefined);
    expect(rows).toHaveLength(44);
    for (const { postal, file, value } of filled()) {
      expect({ file, curated: curated.get(postal) }).toEqual({ file, curated: value });
    }
  });

  test("a state the curated table leaves blank has no landmark in its built file", () => {
    const blankInSource = CURATED_US_STATES.filter((s) => s.landmark === undefined).map(
      (s) => s.postal,
    );
    expect(blankInSource.sort()).toEqual([...HANDOFF_BLANKS].sort());
  });

  test("every shipped string appears verbatim in the curated source file", () => {
    const source = readFileSync(join(PKG, "src/curated/us-states.ts"), "utf8");
    for (const { file, value } of filled()) {
      expect({ file, present: source.includes(`landmark: ${JSON.stringify(value)}`) }).toEqual({
        file,
        present: true,
      });
    }
  });
});

describe("T-013 tester, criterion 7 — the bank is built, not hand-edited", () => {
  test("an offline rebuild reproduces all 51 tracked paths byte-for-byte", () => {
    // `rebuildOffline` (T-014 criterion 16(a)) is the harness shared with
    // `committed-bank.test.ts`, `state-animals.test.ts` and `landmarks.test.ts`.
    const names = Object.keys(DEFAULT_BRANCH_DIGESTS);
    expect(names).toHaveLength(51);
    const rebuilt = rebuildOffline(BUILD_SCRIPT, names, "t013-tester-");
    for (const name of names) {
      expect({ name, same: rebuilt.get(name) === readFileSync(join(DATA_DIR, name), "utf8") }).toEqual(
        { name, same: true },
      );
    }
  });

  test("sources.built_at is still the pinned capture instant in all 50 files", () => {
    for (const { file, entity } of stateFiles()) {
      expect({ file, builtAt: entity.sources?.built_at }).toEqual({ file, builtAt: PINNED_BUILT_AT });
    }
  });
});

describe("T-013 tester, criterion 8 — the committed sample stays in step with the bank", () => {
  test("the sample equals the tracked Colorado in every field but sources.built_at and top_crops, landmark included", () => {
    // T-015 (2026-09-17, a later approved task) freezes `sample-data/us-state-co.json`
    // deliberately at `top_crops: []` (its own criterion 12 — that file is T-064's
    // territory) while populating the tracked bank's copy, so `top_crops` is excluded
    // here the same way `built_at` already is.
    const strip = (raw: string) => {
      const parsed = JSON.parse(raw) as Entity & { sources?: Record<string, unknown> };
      if (parsed.sources) delete parsed.sources.built_at;
      delete parsed.top_crops;
      return JSON.stringify(parsed);
    };
    expect(strip(readFileSync(SAMPLE, "utf8"))).toBe(
      strip(readFileSync(join(DATA_DIR, "us-state-co.json"), "utf8")),
    );
    expect((JSON.parse(readFileSync(SAMPLE, "utf8")) as Entity).landmark).toBe(
      "Rocky Mountain National Park",
    );
  });
});

describe("T-013 tester, criterion 9 — nothing but landmark moves in the bank", () => {
  test("index.json is byte-identical to the default branch's", () => {
    expect(digest(readFileSync(join(DATA_DIR, "index.json"), "utf8"))).toBe(
      DEFAULT_BRANCH_DIGESTS["index.json"] as string,
    );
  });

  test("each of the 50 files, with landmark, climate_kid and top_crops removed, is identical to the default branch's", () => {
    // T-014 (2026-09-17, a later approved task) filled `climate_kid` for the
    // 49 states that did not already carry it at this task's own branch point
    // (Colorado already did, so its pinned digest is unaffected either way).
    // `DEFAULT_BRANCH_DIGESTS` was computed by removing only `landmark`, from
    // the tree as it stood before T-013 landed — before `climate_kid` existed
    // on any state but Colorado. Stripping `climate_kid` here too keeps this
    // check doing what it always did (nothing *other than the fields two
    // named, approved tasks are known to touch* has moved) instead of turning
    // permanently red the moment either task's own field lands, which would
    // make the check meaningless rather than strict.
    //
    // T-015 (2026-09-17, also later and approved) fills `top_crops` for all 50
    // states. Every file already carried the literal `top_crops: []` at this
    // baseline (the key predates T-013), so it is restored to that literal
    // here rather than deleted — deleting would change the hashed bytes
    // relative to what the pinned digest actually hashed, the same distinction
    // `climate-kid-verify.test.ts`'s equivalent check makes.
    for (const { file, raw } of stateFiles()) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      delete parsed["landmark"];
      // Colorado already carried climate_kid at the pinned baseline (it is
      // the one state T-013 itself found already filled), so its pinned
      // digest was computed with that key still present. Every other file's
      // pinned digest was computed with the key absent, since T-014 is what
      // adds it.
      if (file !== "us-state-co.json") delete parsed["climate_kid"];
      parsed["top_crops"] = [];
      expect({ file, digest: digest(JSON.stringify(parsed)) }).toEqual({
        file,
        digest: DEFAULT_BRANCH_DIGESTS[file] as string,
      });
    }
  });

  test("the set of states carrying climate_kid is exactly all 50 — T-014 filled the rest", () => {
    // Was `["Colorado"]` before T-014; T-014's criterion 1 leaves no state
    // blank, so the ground truth this compares against is now all 50, derived
    // from the curated table itself rather than a value copied out of it, so
    // it cannot silently drift out of sync with a later change to that table.
    const named = stateFiles()
      .filter(({ entity }) => entity.climate_kid !== undefined)
      .map(({ entity }) => entity.name)
      .sort();
    expect(named).toEqual(CURATED_US_STATES.map((s) => s.name).sort());
  });

  test("all 50 still carry a non-empty state_animal", () => {
    for (const { file, entity } of stateFiles()) {
      expect({ file, ok: typeof entity.state_animal === "string" && entity.state_animal.length > 0 }).toEqual(
        { file, ok: true },
      );
    }
  });
});

describe("T-013 tester, criterion 10 — Colorado's landmark is unchanged", () => {
  test("the plan's §1.4 example string is what the table, the bank and the sample all carry", () => {
    const expected = "Rocky Mountain National Park";
    expect(CURATED_US_STATES.find((s) => s.postal === "CO")?.landmark).toBe(expected);
    expect((JSON.parse(readFileSync(join(DATA_DIR, "us-state-co.json"), "utf8")) as Entity).landmark).toBe(
      expected,
    );
    expect((JSON.parse(readFileSync(SAMPLE, "utf8")) as Entity).landmark).toBe(expected);
  });
});

describe("T-013 tester, criterion 11 — a landmark that names its own state is disclosed, not hidden", () => {
  const selfNaming = () => {
    const nameOf = new Map(CURATED_US_STATES.map((s) => [s.postal, s.name] as const));
    return filled()
      .filter(({ postal, value }) =>
        value.toLowerCase().includes((nameOf.get(postal) as string).toLowerCase()),
      )
      .map(({ postal }) => postal)
      .sort();
  };

  test("the computed self-naming set is exactly the Handoff's list", () => {
    expect(selfNaming()).toEqual([...HANDOFF_SELF_NAMING].sort());
  });

  test("the prefix case the Handoff calls out really is a self-naming one", () => {
    expect("Indianapolis Motor Speedway".toLowerCase().includes("indiana")).toBe(true);
    expect("Georgia Aquarium".toLowerCase().includes("georgia")).toBe(true);
  });

  test("naming a *different* state is not what criterion 11 covers — New Hampshire's Mount Washington stays out", () => {
    // Recorded rather than asserted away: the criterion is about a state's own
    // name. "Mount Washington" naming another state is a T-026 reader-collision
    // question for the human checklist, not a criterion-11 failure.
    expect(selfNaming()).not.toContain("NH");
    expect(HANDOFF_TABLE["NH"]).toBe("Mount Washington");
  });
});

describe("T-013 tester, criterion 12 — everything a child will read can be read in one place", () => {
  test("the Handoff's table and its blanks together name all 50 states exactly once", () => {
    const listed = [...Object.keys(HANDOFF_TABLE), ...HANDOFF_BLANKS];
    expect(listed).toHaveLength(50);
    expect(new Set(listed).size).toBe(50);
    expect([...listed].sort()).toEqual(CURATED_US_STATES.map((s) => s.postal).sort());
  });

  test("every string the Handoff claims is the string actually shipped, and nothing ships undeclared", () => {
    const shipped = new Map(filled().map(({ postal, value }) => [postal, value]));
    expect([...shipped.keys()].sort()).toEqual(Object.keys(HANDOFF_TABLE).sort());
    for (const [postal, value] of Object.entries(HANDOFF_TABLE)) {
      expect({ postal, shipped: shipped.get(postal) }).toEqual({ postal, shipped: value });
    }
  });

  test("the border-spanning disclosures name landmarks that are actually shipped for those states", () => {
    const shipped = new Map(filled().map(({ postal, value }) => [postal, value]));
    for (const [postal, value] of Object.entries(HANDOFF_SPANS)) {
      expect({ postal, shipped: shipped.get(postal) }).toEqual({ postal, shipped: value });
    }
    // The two the brief's Constraints name by example must be among them.
    expect(Object.keys(HANDOFF_SPANS)).toEqual(expect.arrayContaining(["TN", "WY"]));
  });
});

describe("T-013 tester, criterion 13 — nothing unreviewed, live or new is committed", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

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

  test("question-bank still declares no runtime dependency and the same two devDependencies", () => {
    const pkg = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies ?? {}).toEqual({});
    expect(Object.keys(pkg.devDependencies ?? {}).sort()).toEqual(["@types/bun", "typescript"]);
  });

  test("the tracked bank is still well inside the 200 KB cap", () => {
    const bytes = walk(join(PKG, "data")).reduce((sum, p) => sum + statSync(p).size, 0);
    expect(bytes).toBeLessThan(200 * 1024);
  });
});

describe("T-013 tester, criterion 14 — nothing already verified is weakened", () => {
  /**
   * Floors for all **six** suites criterion 14 protects, counted at this task's
   * branch point — `sparql.test.ts` included, which `landmarks.test.ts` omits.
   * `state-animals.test.ts` is listed at its branch-point test count (43) and
   * its branch-point expect count (70): this task edited one of its assertions,
   * and the floor is what criterion 14 forbids dropping below.
   *
   * `committed-bank.test.ts`'s own expect-count floor was lowered from 60 to
   * 58 by T-014, criterion 16(a): two inline `expect(proc.exitCode).toBe(0)`
   * calls moved into the shared `rebuildOffline` helper (`offline-rebuild.ts`),
   * which throws on a non-zero exit instead — the check still fails the test,
   * just without its own `expect(` line in this file. That extraction is
   * named exempt from "loosened" by the criterion itself.
   */
  const FLOORS: Record<string, { tests: number; expects: number }> = {
    "committed-bank.test.ts": { tests: 33, expects: 58 },
    "data-us-states.test.ts": { tests: 6, expects: 14 },
    "fun-facts.test.ts": { tests: 30, expects: 59 },
    "normalize.test.ts": { tests: 14, expects: 31 },
    "sparql.test.ts": { tests: 5, expects: 7 },
    "state-animals.test.ts": { tests: 43, expects: 70 },
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

  test("the one pre-existing assertion this task edited still pins an exact set, not a loosened one", () => {
    const source = readFileSync(join(PKG, "src/state-animals.test.ts"), "utf8");
    // A `toEqual` against an explicit list, not a length check or a `toContain`.
    expect(source).toContain("expect(named).toEqual(T013_LANDMARK_STATES)");
    expect(source).not.toContain("expect(named.length).toBeGreaterThan");
  });
});
