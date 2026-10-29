import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { BANK_DIGESTS, bankFileDigest } from "./bank-pins";
import { CURATED_US_STATES } from "./curated/us-states";
import { rebuildOffline } from "./offline-rebuild";

/**
 * T-015 verification — written by the `tester` role from the 14 frozen
 * acceptance criteria in `tasks/T-015-us-crops-nass.md`, not from the
 * implementation and not from `top-crops.test.ts` (which the worker wrote
 * alongside the data). It overlaps that file deliberately on criteria 1–4 and
 * covers the ten criteria it does not reach at all: the curated table as the
 * source (5), the twice-over offline rebuild (6), the absent network and
 * environment surface (7, 8), the replaced stale assertions (9), the untouched
 * lockfile (10), the three documents (11), the frozen sample (12), the
 * "nothing else in the bank moved" digest check (13) and the two provenance
 * statements (14).
 *
 * Expected values come from the criterion text. Where a criterion is phrased
 * against "the default branch", the bank is pinned through `BANK_DIGESTS` in
 * `bank-pins.ts`, recorded at `b0ee336` (T-070 row W11, E-30), so the checks
 * hold in a shallow CI clone with no git history at all.
 *
 * No network: the only subprocesses are `git ls-files` (read-only, no remote)
 * and the build CLI run through `rebuildOffline`, which points all six proxy
 * spellings at a dead loopback port. Nothing mocks `fetch`; nothing writes
 * inside `question-bank/`.
 *
 * What no test here can settle is whether each crop is *true* of its state —
 * that is the brief's Review checklist, and only a person closes it.
 */

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");
const BUILD_SCRIPT = join(PKG, "src/build.ts");

/**
 * Criterion 13: `built_at` is pinned to the fixture's capture. It is compared
 * with the main fixture's `captured_at` rather than a literal instant, so a
 * refresh that moves both stays green (T-070 row W16).
 */
const MAIN_FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");
const fixtureBuiltAt = () =>
  new Date(
    (JSON.parse(readFileSync(MAIN_FIXTURE, "utf8")) as { _fixture: { captured_at: string } })
      ._fixture.captured_at,
  ).toISOString();

/** Criterion 4's list, transcribed word for word from the criterion. */
const LIVESTOCK_WORDS = [
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
] as const;

function git(args: string[]): string {
  const proc = Bun.spawnSync(["git", ...args], { cwd: REPO });
  if (proc.exitCode !== 0) throw new Error(`git ${args.join(" ")} exited ${proc.exitCode}`);
  return proc.stdout.toString();
}

/** Criterion 1 names this glob literally. Throws rather than yielding an empty list. */
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

function trackedUnder(prefix: string): string[] {
  return git(["ls-files", prefix]).split("\n").filter(Boolean).sort();
}

interface StateEntity {
  id: string;
  top_crops?: unknown;
  sources?: { built_at?: string };
}

const postalOf = (file: string) => file.slice("us-state-".length, -".json".length).toUpperCase();

function trackedStates(): { file: string; postal: string; raw: string; entity: StateEntity }[] {
  return trackedStateFileNames().map((file) => {
    const raw = readFileSync(join(DATA_DIR, file), "utf8");
    return { file, postal: postalOf(file), raw, entity: JSON.parse(raw) as StateEntity };
  });
}

/** The tracked `top_crops` as a plain array, with the type assertion done once. */
function cropsOf(entity: StateEntity): string[] {
  expect(Array.isArray(entity.top_crops)).toBe(true);
  return entity.top_crops as string[];
}

const curatedByPostal = new Map(CURATED_US_STATES.map((s) => [s.postal, s] as const));

/** Every shipped string, from both places criterion 4 names, tagged with its origin. */
function allCropStrings(): { where: string; value: string }[] {
  const out: { where: string; value: string }[] = [];
  for (const state of CURATED_US_STATES) {
    for (const crop of state.top_crops ?? [])
      out.push({ where: `curated:${state.postal}`, value: crop });
  }
  for (const { file, entity } of trackedStates()) {
    for (const crop of cropsOf(entity)) out.push({ where: file, value: crop });
  }
  return out;
}

/**
 * The `"top_crops": [...]` block as the sink emits it (`JSON.stringify(_, 2)`).
 */
const TOP_CROPS_BLOCK = /^ {2}"top_crops": \[\n(?: {4}[^\n]*\n)* {2}\],$/m;

describe("T-015 tester, criterion 1 — one to three non-blank crops in every tracked file", () => {
  test("git ls-files matches exactly 50 state files, and readdirSync finds no stray extra", () => {
    const tracked = trackedStateFileNames();
    expect(tracked).toHaveLength(50);
    const onDisk = readdirSync(DATA_DIR)
      .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
      .sort();
    expect(onDisk).toEqual(tracked);
  });

  test("each file's top_crops is an array whose length is 1, 2 or 3 — never 0, never 4 or more", () => {
    const lengths: Record<string, number> = {};
    for (const { file, entity } of trackedStates()) lengths[file] = cropsOf(entity).length;
    const outOfRange = Object.entries(lengths).filter(([, n]) => n < 1 || n > 3);
    expect(outOfRange).toEqual([]);
    // The boundary the criterion names, stated as a count so a regression reads
    // as a number rather than as a missing file: 50 files, all inside 1..3.
    expect(Object.values(lengths).filter((n) => n >= 1 && n <= 3)).toHaveLength(50);
  });

  test("no crop string is empty or whitespace-only after trimming", () => {
    const blank = allCropStrings().filter(({ value }) => value.trim().length === 0);
    expect(blank).toEqual([]);
  });

  test("the observed length distribution accounts for all 50 files", () => {
    const byLength = new Map<number, string[]>();
    for (const { file, entity } of trackedStates()) {
      const n = cropsOf(entity).length;
      byLength.set(n, [...(byLength.get(n) ?? []), file]);
    }
    const total = [...byLength.values()].reduce((sum, files) => sum + files.length, 0);
    expect(total).toBe(50);
    expect([...byLength.keys()].sort()).toEqual(
      [...byLength.keys()].filter((n) => n >= 1 && n <= 3).sort(),
    );
  });
});

describe("T-015 tester, criterion 2 — register", () => {
  test("every shipped string is trimmed", () => {
    expect(allCropStrings().filter(({ value }) => value !== value.trim())).toEqual([]);
  });

  test("no shipped string matches /[A-Z]{2,}/ — no shouted machine label", () => {
    expect(allCropStrings().filter(({ value }) => /[A-Z]{2,}/.test(value))).toEqual([]);
  });

  test("no shipped string contains a comma", () => {
    expect(allCropStrings().filter(({ value }) => value.includes(","))).toEqual([]);
  });

  test('no shipped string contains " - "', () => {
    expect(allCropStrings().filter(({ value }) => value.includes(" - "))).toEqual([]);
  });

  test("the register checks run over every string in both places, not an empty list", () => {
    const strings = allCropStrings();
    expect(strings.filter((s) => s.where.startsWith("curated:")).length).toBeGreaterThanOrEqual(50);
    expect(strings.filter((s) => !s.where.startsWith("curated:")).length).toBeGreaterThanOrEqual(
      50,
    );
  });
});

describe("T-015 tester, criterion 3 — distinct within a state, case-insensitively", () => {
  test("no tracked file lists the same crop twice", () => {
    const repeats: { file: string; crops: string[] }[] = [];
    for (const { file, entity } of trackedStates()) {
      const keys = cropsOf(entity).map((c) => c.trim().toLowerCase());
      if (new Set(keys).size !== keys.length) repeats.push({ file, crops: cropsOf(entity) });
    }
    expect(repeats).toEqual([]);
  });

  test("no curated entry lists the same crop twice", () => {
    const repeats: { postal: string; crops: string[] }[] = [];
    for (const state of CURATED_US_STATES) {
      const crops = state.top_crops ?? [];
      const keys = crops.map((c) => c.trim().toLowerCase());
      if (new Set(keys).size !== keys.length) repeats.push({ postal: state.postal, crops });
    }
    expect(repeats).toEqual([]);
  });

  test("a three-entry state really has three different crops", () => {
    const threes = trackedStates().filter(({ entity }) => cropsOf(entity).length === 3);
    expect(threes.length).toBeGreaterThan(0);
    for (const { file, entity } of threes) {
      const keys = cropsOf(entity).map((c) => c.trim().toLowerCase());
      expect({ file, distinct: new Set(keys).size }).toEqual({ file, distinct: 3 });
    }
  });
});

describe("T-015 tester, criterion 4 — plant crops only, no livestock word anywhere", () => {
  test("no string in the 50 tracked files contains a livestock word", () => {
    const hits: { file: string; value: string; word: string }[] = [];
    for (const { file, entity } of trackedStates()) {
      for (const value of cropsOf(entity)) {
        for (const word of LIVESTOCK_WORDS) {
          if (value.toLowerCase().includes(word)) hits.push({ file, value, word });
        }
      }
    }
    expect(hits).toEqual([]);
  });

  test("no string in CURATED_US_STATES contains a livestock word", () => {
    const hits: { postal: string; value: string; word: string }[] = [];
    for (const state of CURATED_US_STATES) {
      for (const value of state.top_crops ?? []) {
        for (const word of LIVESTOCK_WORDS) {
          if (value.toLowerCase().includes(word)) hits.push({ postal: state.postal, value, word });
        }
      }
    }
    expect(hits).toEqual([]);
  });

  test("the banned-word list is the 14 words the criterion names", () => {
    expect([...LIVESTOCK_WORDS]).toHaveLength(14);
    expect(LIVESTOCK_WORDS.some((w) => "cattle beef dairy".includes(w))).toBe(true);
  });
});

describe("T-015 tester, criterion 5 — the curated table is the source", () => {
  test("all 50 curated entries carry top_crops", () => {
    expect(CURATED_US_STATES).toHaveLength(50);
    const missing = CURATED_US_STATES.filter((s) => s.top_crops === undefined).map((s) => s.postal);
    expect(missing).toEqual([]);
  });

  test("each tracked file's array equals its curated entry's — same strings, same order", () => {
    for (const { file, postal, entity } of trackedStates()) {
      const curated = curatedByPostal.get(postal);
      expect({ file, hasCuratedEntry: curated !== undefined }).toEqual({
        file,
        hasCuratedEntry: true,
      });
      expect({ file, crops: cropsOf(entity) }).toEqual({
        file,
        crops: curated?.top_crops as string[],
      });
    }
  });

  test("order matters: a reversed curated list would not match the tracked file", () => {
    // Guards the equality above from being a set comparison in disguise.
    const multi = trackedStates().filter(({ entity }) => cropsOf(entity).length > 1);
    expect(multi.length).toBeGreaterThan(0);
    for (const { file, postal, entity } of multi) {
      const reversed = [...(curatedByPostal.get(postal)?.top_crops ?? [])].reverse();
      expect({
        file,
        equalsReversed: JSON.stringify(cropsOf(entity)) === JSON.stringify(reversed),
      }).toEqual({ file, equalsReversed: false });
    }
  });
});

describe("T-015 tester, criterion 6 — two offline rebuilds agree with each other and with the bank", () => {
  const names = () => trackedStateFileNames();

  test("top_crops survives two consecutive offline rebuilds byte-identically", () => {
    const first = rebuildOffline(BUILD_SCRIPT, names(), "t015-verify-a-");
    const second = rebuildOffline(BUILD_SCRIPT, names(), "t015-verify-b-");
    const block = (raw: string) =>
      raw.match(TOP_CROPS_BLOCK)?.[0] ?? raw.match(/^ {2}"top_crops": .*$/m)?.[0];
    for (const file of names()) {
      const a = first.get(file) as string;
      const b = second.get(file) as string;
      const tracked = readFileSync(join(DATA_DIR, file), "utf8");
      expect({ file, block: block(a) }).toEqual({ file, block: block(b) });
      expect({ file, block: block(a) }).toEqual({ file, block: block(tracked) });
      // And the value itself, parsed, in case the emitted formatting ever changes.
      const crops = (raw: string) => (JSON.parse(raw) as StateEntity).top_crops;
      expect({ file, crops: crops(a) }).toEqual({ file, crops: crops(tracked) });
      expect({ file, crops: crops(b) }).toEqual({ file, crops: crops(tracked) });
    }
  }, 120_000);
});

describe("T-015 tester, criterion 7 — no new network or environment surface", () => {
  const nonTestSources = () =>
    trackedUnder("question-bank/src").filter((p) => p.endsWith(".ts") && !p.endsWith(".test.ts"));

  /** Comments are where the *rejected* NASS route is allowed to be named. Code is not. */
  const stripComments = (source: string) =>
    source.replace(/\/\*[^]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

  test("no NASS-named variable is referenced anywhere under question-bank/src/", () => {
    const offenders = nonTestSources().filter((p) =>
      /nass/i.test(stripComments(readFileSync(join(REPO, p), "utf8"))),
    );
    expect(offenders).toEqual([]);
  });

  test("the build's outbound hosts are still only Wikidata and Wikipedia", () => {
    const hosts = new Set<string>();
    for (const path of nonTestSources()) {
      const source = readFileSync(join(REPO, path), "utf8");
      for (const match of source.matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g))
        hosts.add(match[1] as string);
    }
    // `github.com` is the contact URL inside the User-Agent string
    // (`sparql.ts`), never a request target; `www.wikidata.org` is the entity
    // URI prefix. Pinned as a whole set so a genuinely new host — a NASS
    // endpoint, say — turns this red.
    const outbound = [...hosts].filter((h) => h !== "127.0.0.1" && !h.endsWith("example.org"));
    expect(outbound.sort()).toEqual([
      "en.wikipedia.org",
      "github.com",
      "query.wikidata.org",
      "www.wikidata.org",
    ]);
  });

  test("no new file was added under question-bank/src/fixtures/", () => {
    // T-069 (2026-10-03, a later approved task; approved test change request,
    // row 4) records the elevation-with-unit response as a second fixture.
    expect(trackedUnder("question-bank/src/fixtures")).toEqual([
      "question-bank/src/fixtures/us-states-elevation.sparql.json",
      "question-bank/src/fixtures/us-states.sparql.json",
    ]);
  });
});

describe("T-015 tester, criterion 8 — no test reaches the network", () => {
  test("exactly one file under question-bank/src/ carries the dead-loopback literal", () => {
    // Assembled from parts so this suite is not itself a match for what it counts.
    const needle = ["127", "0", "0", "1"].join(".") + ":1";
    const own = "question-bank/src/top-crops-verify.test.ts";
    const files = trackedUnder("question-bank/src").filter(
      (p) => !p.endsWith(".json") && p !== "question-bank/src/climate-kid.test.ts" && p !== own,
    );
    const withProxy = files.filter((p) => readFileSync(join(REPO, p), "utf8").includes(needle));
    expect(withProxy).toEqual(["question-bank/src/offline-rebuild.ts"]);
  });

  test("no *.test.ts under question-bank/src/ spawns src/build.ts itself", () => {
    const tests = trackedUnder("question-bank/src").filter((p) => p.endsWith(".test.ts"));
    expect(tests.length).toBeGreaterThan(0);
    for (const path of tests) {
      const source = readFileSync(join(REPO, path), "utf8");
      expect({
        path,
        spawnsBuild: /spawnSync\(\s*\[\s*["']bun["'][^]*?build\.ts/.test(source),
      }).toEqual({ path, spawnsBuild: false });
    }
  });

  test("this suite obtains its rebuild from offline-rebuild.ts rather than re-creating it", () => {
    const own = readFileSync(join(PKG, "src/top-crops-verify.test.ts"), "utf8");
    expect(/from ["']\.\/offline-rebuild["']/.test(own)).toBe(true);
    expect(/HTTP_PROXY:\s*["']http:\/\//.test(own)).toBe(false);
  });
});

describe("T-015 tester, criterion 9 — the stale assertions are replaced, not deleted", () => {
  const suites = () => trackedUnder("question-bank/src").filter((p) => p.endsWith(".test.ts"));

  test("no suite asserts that a tracked file's top_crops is an empty array", () => {
    // The shape the four replaced assertions had: comparing the tracked value
    // against a literal `[]`, with the tracked file as the subject.
    const offenders: { path: string; line: string }[] = [];
    for (const path of suites()) {
      const lines = readFileSync(join(REPO, path), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (
          /topCrops:\s*\[\s*\]/.test(line) &&
          !/parsed\[|restore|baseline/i.test(lines[i - 1] ?? "")
        ) {
          offenders.push({ path, line: line.trim() });
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  test("each of the four named suites now asserts a populated top_crops invariant", () => {
    for (const path of [
      "question-bank/src/climate-kid.test.ts",
      "question-bank/src/climate-kid-verify.test.ts",
      "question-bank/src/landmarks.test.ts",
      "question-bank/src/state-animals.test.ts",
    ]) {
      const source = readFileSync(join(REPO, path), "utf8");
      expect({ path, mentionsCurated: source.includes("CURATED_US_STATES") }).toEqual({
        path,
        mentionsCurated: true,
      });
      expect({ path, asserts: /top_crops is populated/.test(source) }).toEqual({
        path,
        asserts: true,
      });
    }
  });
});

describe("T-015 tester, criterion 11 — the docs no longer say the field is empty", () => {
  const readDoc = (path: string) => readFileSync(join(REPO, path), "utf8");

  test("normalize.ts's top_crops comment no longer defers to USDA NASS", () => {
    const source = readDoc("question-bank/src/normalize.ts");
    // No NASS anywhere in the module, and the emitted value reads the curated
    // table rather than a literal (criterion 5's fold-in, checked from here
    // because criterion 11 is about what the comment beside it claims).
    expect(/NASS/i.test(source)).toBe(false);
    expect(source).toContain("top_crops: curated.top_crops ?? []");
    const upTo = source.indexOf("top_crops: curated");
    const commentAbove = source.slice(source.lastIndexOf("//", upTo) - 400, upTo);
    expect(/curated/i.test(commentAbove)).toBe(true);
  });

  test("PROGRESS.md no longer describes top_crops as empty or awaiting NASS", () => {
    const text = readDoc("PROGRESS.md");
    expect(/`top_crops` is empty/.test(text)).toBe(false);
    expect(/`top_crops` is \*\*50 of 50\*\*/.test(text)).toBe(true);
  });
});

describe("T-015 tester, criterion 13 — nothing else in the bank moves", () => {
  test("each of the 50 state files digests to its b0ee336 pin, built_at aside", () => {
    // T-070 (row W11, E-30): pinned whole at b0ee336 through `bank-pins.ts`.
    // Nothing is stripped, reset or restored before hashing.
    for (const { file, raw } of trackedStates()) {
      expect({ file, digest: bankFileDigest(file, raw) }).toEqual({
        file,
        digest: BANK_DIGESTS[file] as string,
      });
    }
  });

  test("index.json is byte-identical to b0ee336's", () => {
    expect(bankFileDigest("index.json", readFileSync(join(DATA_DIR, "index.json"), "utf8"))).toBe(
      BANK_DIGESTS["index.json"] as string,
    );
  });

  test("built_at equals the main fixture's captured_at in all 50 files", () => {
    const builtAt = fixtureBuiltAt();
    for (const { file, entity } of trackedStates()) {
      expect({ file, builtAt: entity.sources?.built_at }).toEqual({ file, builtAt });
    }
  });

  test("index.json and the per-state files still agree on ids and count", () => {
    const index = JSON.parse(readFileSync(join(DATA_DIR, "index.json"), "utf8")) as {
      count: number;
      entities: { id: string }[];
    };
    expect(index.count).toBe(50);
    expect(index.entities.map((e) => e.id).sort()).toEqual(
      trackedStates()
        .map(({ entity }) => entity.id)
        .sort(),
    );
  });
});

describe("T-015 tester, criterion 14 — provenance recorded in two places", () => {
  /** Both documents hard-wrap, so phrases are matched against unwrapped text. */
  const unwrap = (text: string) => text.replace(/\s+/g, " ");
  /**
   * The criterion says "the header comment", so this is the file's leading
   * block comment alone — not the whole preamble, which would let the doc
   * comment on the field itself satisfy a claim the header never makes.
   */
  const header = () => {
    const source = readFileSync(join(PKG, "src/curated/us-states.ts"), "utf8");
    const end = source.indexOf("*/");
    expect(source.startsWith("/**")).toBe(true);
    expect(end).toBeGreaterThan(0);
    return unwrap(source.slice(0, end + 2));
  };
  const e7 = () => {
    const text = readFileSync(join(REPO, "engineering-decisions.md"), "utf8");
    const start = text.indexOf("## E-7");
    expect(start).toBeGreaterThan(-1);
    return unwrap(text.slice(start));
  };

  for (const [label, read] of [
    ["curated/us-states.ts header", header],
    ["engineering-decisions.md E-7", e7],
  ] as const) {
    test(`${label} says the values are hand-picked by a human, not from a live source`, () => {
      const text = read();
      expect({ label, handPicked: /hand-(picked|curated)/i.test(text) }).toEqual({
        label,
        handPicked: true,
      });
      expect({ label, notNass: /not[^.]{0,60}(USDA NASS|NASS-derived)/i.test(text) }).toEqual({
        label,
        notNass: true,
      });
    });

    test(`${label} says production quantity was the informal guide, with no year pinned`, () => {
      const text = read();
      // Tied to the "guided by" clause, not just any mention of the phrase —
      // E-7 also discusses production quantity when explaining why NASS's own
      // ranking measure is ambiguous, and that sentence is not this claim.
      expect({ label, quantity: /guided[^.]{0,80}production quantity/i.test(text) }).toEqual({
        label,
        quantity: true,
      });
      expect({ label, noYear: /year/i.test(text) }).toEqual({ label, noYear: true });
    });

    test(`${label} says plant crops only, livestock tracked by T-068`, () => {
      const text = read();
      expect({ label, plantOnly: /plant crops only|plant\b/i.test(text) }).toEqual({
        label,
        plantOnly: true,
      });
      expect({ label, t068: text.includes("T-068") }).toEqual({ label, t068: true });
    });

    test(`${label} says the curated strings are themselves the reviewed kid-facing text`, () => {
      const text = read();
      expect({ label, reviewed: /reviewed/i.test(text) }).toEqual({ label, reviewed: true });
      expect({ label, contentRules: /CLAUDE\.md/.test(text) }).toEqual({
        label,
        contentRules: true,
      });
    });
  }

  test("E-7 is a new numbered entry, not a rewrite of an earlier one", () => {
    const text = readFileSync(join(REPO, "engineering-decisions.md"), "utf8");
    const headings = [...text.matchAll(/^## (E-\d+)/gm)].map((m) => m[1]);
    expect(headings).toContain("E-7");
    expect(new Set(headings).size).toBe(headings.length);
  });
});
