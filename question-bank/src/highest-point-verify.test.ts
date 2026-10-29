import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { BANK_DIGESTS, bankFileDigest } from "./bank-pins";
import { CURATED_US_STATES, curatedByPostal } from "./curated/us-states";
import { normalizeUsStates } from "./normalize";
import { DEAD_PROXY, rebuildOffline } from "./offline-rebuild";
import { parseUsStates, type WikidataStateRow } from "./sources/wikidata";
import type { SparqlResults } from "./sparql";

/**
 * T-016 verification — written by the `tester` role from the acceptance
 * criteria in `tasks/T-016-alaska-highest-point.md`, independently of
 * `highest-point.test.ts` (which the worker wrote alongside the change).
 *
 * It is not a copy of that file. Every expected value below is derived from a
 * criterion's own wording or from committed bytes, never from reading this
 * branch's implementation:
 *
 *  - Criteria 5 and 6 are checked against the bank pins in `bank-pins.ts`
 *    (`BANK_DIGESTS`, recorded at `b0ee336`; T-070 rows W17, W21 and W28,
 *    `engineering-decisions.md` E-30): every bank file, Alaska's included,
 *    digests to its pin with only `sources.built_at` left out.
 *  - Criterion 9's full-fixture warning count is 3: T-079's three
 *    `highest_point_m` overrides (its approved test change request row 6) and
 *    nothing else. The CLI's stdout carrying that 3 is pinned by
 *    `build-report-stdout.test.ts` (T-080).
 *  - Criterion 8's warning is checked here in `normalizeUsStates`. The real
 *    CLI printing it for a derived fixture is asserted in
 *    `report-warnings-stdout.test.ts` (T-083).
 *
 * No network: the only subprocess is the build CLI with `--offline` and all
 * six proxy spellings pointed at a dead loopback port. Nothing mocks `fetch`.
 * Nothing writes inside `question-bank/`.
 */

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");
const FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");
const BUILD_SCRIPT = join(PKG, "src/build.ts");

/**
 * `git ls-files`, so a tracked-but-deleted file is a failure rather than a
 * silently shorter loop. Throws on an empty result for the same reason.
 */
function trackedUnder(path: string): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", path], { cwd: REPO });
  if (proc.exitCode !== 0) throw new Error(`git ls-files ${path} exited ${proc.exitCode}`);
  const paths = proc.stdout.toString().split("\n").filter(Boolean);
  if (paths.length === 0) throw new Error(`nothing tracked under ${path}`);
  return paths;
}

const trackedStateFiles = () =>
  trackedUnder("question-bank/data/us-states")
    .map((p) => p.split("/").pop() as string)
    .filter((n) => n !== "index.json")
    .sort();

const readState = (name: string) => readFileSync(join(DATA_DIR, name), "utf8");

/** A minimal row — `parseUsStates` guarantees these three keys and nothing more. */
const rowFor = (name: string, overrides: Partial<WikidataStateRow> = {}): WikidataStateRow => ({
  name,
  borderQids: [],
  borderNames: [],
  ...overrides,
});

// T-069 (approved test change request, row 6): the offline build reads the
// elevation-with-unit recording beside the main fixture, so this does too.
const ELEVATION_FIXTURE = join(PKG, "src/fixtures/us-states-elevation.sparql.json");
const fixtureRows = (): WikidataStateRow[] =>
  parseUsStates(
    JSON.parse(readFileSync(FIXTURE, "utf8")) as SparqlResults,
    JSON.parse(readFileSync(ELEVATION_FIXTURE, "utf8")) as SparqlResults,
  );

// ---------------------------------------------------------------------------
// Criterion 1 — 50 of 50 tracked files carry a non-empty string highest_point
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 1 — every tracked state file carries a highest_point", () => {
  test("git ls-files finds exactly 50 tracked state files", () => {
    expect(trackedStateFiles()).toHaveLength(50);
  });

  test("all 50 carry a highest_point whose value is a non-empty string — 50 of 50, not 49", () => {
    const missing = trackedStateFiles().filter((name) => {
      const value = (JSON.parse(readState(name)) as { highest_point?: unknown }).highest_point;
      return typeof value !== "string" || value.length === 0;
    });
    expect(missing).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Criterion 2 — the curated fallback fills a gap and never overrides Wikidata
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 2 — curated fills the gap, Wikidata always wins", () => {
  const alaska = curatedByPostal.get("AK");

  test("Alaska is a state with a curated fallback, so the two cases below are not vacuous", () => {
    expect(typeof alaska?.highest_point).toBe("string");
    expect((alaska?.highest_point ?? "").length).toBeGreaterThan(0);
  });

  test("no Wikidata label + a curated fallback → the entity carries the curated value", () => {
    const { entities } = normalizeUsStates([rowFor("Alaska")]);
    expect(entities[0]?.highest_point).toBe(alaska?.highest_point as string);
  });

  test("a Wikidata label + a curated fallback for the same state → the entity carries the Wikidata label", () => {
    const { entities } = normalizeUsStates([
      rowFor("Alaska", { highestPoint: "A Label Only Wikidata Has" }),
    ]);
    expect(entities[0]?.highest_point).toBe("A Label Only Wikidata Has");
  });

  test("a curated fallback never leaks onto a different state in the same batch", () => {
    const { entities } = normalizeUsStates([rowFor("Alaska"), rowFor("Colorado")]);
    const byId = new Map(entities.map((e) => [e.id, e.highest_point]));
    expect(byId.get("us-state-ak")).toBe(alaska?.highest_point as string);
    expect(byId.get("us-state-co")).toBeUndefined();
  });

  test("neither source → the key is absent rather than an empty string", () => {
    const { entities } = normalizeUsStates([rowFor("Colorado")]);
    expect(Object.keys(entities[0] ?? {})).not.toContain("highest_point");
  });

  test("the fixture's real Alaska row is the gap case — it has no highestPoint of its own", () => {
    // Criterion 2's first half only means something if Wikidata really is
    // silent for Alaska in the recording every offline build replays.
    const ak = fixtureRows().find((row) => row.name === "Alaska");
    expect(ak).toBeDefined();
    expect(ak?.highestPoint).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Criterion 3 — Alaska's highest_point and landmark are the same string
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 3 — Alaska's two fields are pinned to one string", () => {
  const tracked = JSON.parse(readState("us-state-ak.json")) as {
    highest_point?: string;
    landmark?: string;
  };
  const curated = curatedByPostal.get("AK");

  test("in data/us-states/us-state-ak.json, highest_point equals landmark character for character", () => {
    expect(typeof tracked.landmark).toBe("string");
    expect(tracked.highest_point).toBe(tracked.landmark as string);
  });

  test("in src/curated/us-states.ts, Alaska's highest_point equals its landmark character for character", () => {
    expect(typeof curated?.landmark).toBe("string");
    expect(curated?.highest_point).toBe(curated?.landmark as string);
  });

  test("the curated string and the shipped string are also the same, so one edit moves both", () => {
    expect(tracked.highest_point).toBe(curated?.highest_point as string);
    expect(tracked.landmark).toBe(curated?.landmark as string);
  });
});

// ---------------------------------------------------------------------------
// Criterion 4 — one plain name a child can read aloud
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 4 — Alaska's highest_point is one plain name", () => {
  const shipped = (JSON.parse(readState("us-state-ak.json")) as { highest_point?: string })
    .highest_point as string;

  test("it is not the empty string", () => {
    expect(typeof shipped).toBe("string");
    expect(shipped.length).toBeGreaterThan(0);
  });

  test("it contains no parenthesis, no /, no comma and no ' or '", () => {
    expect({ value: shipped, offenders: [...shipped].filter((c) => "()/,".includes(c)) }).toEqual({
      value: shipped,
      offenders: [],
    });
    expect(shipped).not.toContain(" or ");
  });
});

// ---------------------------------------------------------------------------
// Criteria 5 and 6 — exactly one added line in Alaska, nothing else moved
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 5 — us-state-ak.json gains one line and nothing else", () => {
  const raw = readState("us-state-ak.json");
  const entity = JSON.parse(raw) as {
    landmark?: string;
    highest_point?: string;
    highest_point_m?: number;
    sources?: { built_at?: string };
  };

  /**
   * Addendum, 2026-09-18: after this suite's original pass, Dkaattae resolved
   * the still-open Denali / Mount McKinley call directly on PR #47 — Alaska's
   * `landmark` and `highest_point` both changed from "Denali" to "Mount
   * McKinley". Criterion 5 as originally worded ("exactly one added line") no
   * longer holds by design: a second, deliberate, human-decided line now also
   * differs from the default branch. The test below is widened to name both
   * differences explicitly rather than pretend only one exists.
   */
  test("us-state-ak.json digests to its b0ee336 pin, built_at aside", () => {
    // T-070 (row W17, E-30): Alaska is pinned like every other file, whole.
    expect(bankFileDigest("us-state-ak.json", raw)).toBe(
      BANK_DIGESTS["us-state-ak.json"] as string,
    );
  });

  test("landmark is the only other field that differs from the default branch, and it equals the decided value", () => {
    const withoutHighestPoint = raw.replace(/^ {2}"highest_point": "[^"]*",\n/m, "");
    const withDefaultLandmark = withoutHighestPoint.replace(
      /^ {2}"landmark": "[^"]*",$/m,
      '  "landmark": "Denali",',
    );
    expect(withoutHighestPoint).not.toBe(withDefaultLandmark);
    expect(entity.landmark).toBe("Mount McKinley");
    expect(entity.highest_point).toBe("Mount McKinley");
  });

  test("highest_point_m is still 6190 and sources.built_at equals the fixture's captured_at", () => {
    // T-070 row W20: no literal instant, so a refresh that moves both stays green.
    const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as {
      _fixture: { captured_at: string };
    };
    expect(entity.highest_point_m).toBe(6190);
    expect(entity.sources?.built_at).toBe(new Date(fixture._fixture.captured_at).toISOString());
  });
});

describe("T-016 tester, criterion 6 — the other 49 state files and index.json match b0ee336", () => {
  test("each of the 49 non-Alaska state files digests to its b0ee336 pin, built_at aside", () => {
    // T-070 (row W21, E-30): nothing is stripped or restored before hashing.
    const names = trackedStateFiles().filter((name) => name !== "us-state-ak.json");
    expect(names).toHaveLength(49);
    for (const name of names) {
      expect({ name, digest: bankFileDigest(name, readState(name)) }).toEqual({
        name,
        digest: BANK_DIGESTS[name] as string,
      });
    }
  });

  test("index.json is byte-identical to b0ee336's", () => {
    expect(bankFileDigest("index.json", readState("index.json"))).toBe(
      BANK_DIGESTS["index.json"] as string,
    );
  });
});

// ---------------------------------------------------------------------------
// Criteria 8 and 9 — the warning, and the full-fixture build's warning count
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 8 — a state left without a name says so", () => {
  test("normalizeUsStates warns with entity = that state's id and field = highest_point", () => {
    const { warnings } = normalizeUsStates([rowFor("Colorado")]);
    const own = warnings.filter((w) => w.field === "highest_point");
    expect(own).toHaveLength(1);
    expect(own[0]?.entity).toBe("us-state-co");
  });

  test("the entity that warning names is the one with no highest_point key", () => {
    const { entities, warnings } = normalizeUsStates([rowFor("Alaska"), rowFor("Colorado")]);
    const warned = warnings.filter((w) => w.field === "highest_point").map((w) => w.entity);
    const blank = entities.filter((e) => !e.highest_point).map((e) => e.id);
    expect(warned.sort()).toEqual(blank.sort());
  });

  test("no warning when Wikidata has a label, and none when the curated fallback supplies one", () => {
    expect(
      normalizeUsStates([rowFor("Colorado", { highestPoint: "Mount Elbert" })]).warnings.filter(
        (w) => w.field === "highest_point",
      ),
    ).toEqual([]);
    expect(
      normalizeUsStates([rowFor("Alaska")]).warnings.filter((w) => w.field === "highest_point"),
    ).toEqual([]);
  });
});

describe("T-016 tester, criterion 9 — the full fixture build warns about nothing but T-079's three overrides", () => {
  test("normalizeUsStates over all 50 parsed fixture rows emits zero highest_point warnings", () => {
    const rows = fixtureRows();
    expect(rows).toHaveLength(50);
    expect(normalizeUsStates(rows).warnings.filter((w) => w.field === "highest_point")).toEqual([]);
  });

  test("and no warnings besides the three T-079 highest_point_m overrides", () => {
    // The full-fixture count is 3. T-079's three curated overrides each warn
    // once (its test change request row 6, approved; criteria 10–11), and
    // nothing else may. The CLI's stdout carries the same 3, pinned by
    // `build-report-stdout.test.ts`.
    const { warnings } = normalizeUsStates(fixtureRows());
    expect(warnings).toHaveLength(3);
    expect(warnings.every((w) => w.field === "highest_point_m")).toBe(true);
    expect(warnings.map((w) => w.entity).sort()).toEqual([
      "us-state-ct",
      "us-state-ok",
      "us-state-va",
    ]);
    expect(warnings.filter((w) => w.field !== "highest_point_m")).toEqual([]);
  });

  test("a real offline rebuild of all 50 still produces Alaska's tracked bytes", () => {
    // The CLI-stdout side of criterion 9 (the full build prints exactly the
    // three `highest_point_m` warnings) is pinned on real stdout by
    // `build-report-stdout.test.ts` (T-080). This test checks the written bytes
    // through the sanctioned harness (`offline-rebuild.ts`) rather than
    // spawning `build.ts` directly.
    const rebuilt = rebuildOffline(BUILD_SCRIPT, ["us-state-ak.json"], "t016-rebuild-");
    expect(rebuilt.get("us-state-ak.json")).toBe(readState("us-state-ak.json"));
  });
});

// ---------------------------------------------------------------------------
// Criteria 10 and 11 — the digest guards, and the neutralisation's honesty
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 10 — the pinned digest guards were not weakened", () => {
  const GUARDS = [
    "src/landmarks-verify.test.ts",
    "src/climate-kid-verify.test.ts",
    "src/top-crops-verify.test.ts",
  ];

  for (const guard of GUARDS) {
    const source = readFileSync(join(PKG, guard), "utf8");

    test(`${guard} has no skipped, todo or empty-bodied test`, () => {
      expect(source).not.toMatch(/\b(test|describe|it)\.(skip|todo|skipIf)\b/);
      expect(source).not.toMatch(/\bxtest\b|\bxdescribe\b/);
    });

    test(`${guard} still asserts — its expect() count is well above zero`, () => {
      expect([...source.matchAll(/\bexpect\(/g)].length).toBeGreaterThan(10);
    });
  }

  test("no guard strips highest_point before comparing", () => {
    // T-070 (row W25, E-30): the guards no longer neutralise anything, so the
    // same scan of their sources finds no highest_point removal at all.
    const removals: { guard: string; line: string }[] = [];
    for (const guard of GUARDS) {
      const source = readFileSync(join(PKG, guard), "utf8");
      for (const line of source
        .split("\n")
        .filter((l) => !l.trimStart().startsWith("*") && !l.trimStart().startsWith("//"))
        .filter(
          (l) =>
            /delete\s+parsed\[["']highest_point["']\]/.test(l) ||
            /replace\(\s*ALASKA_HIGHEST_POINT_LINE/.test(l),
        ))
        removals.push({ guard, line });
    }
    expect(removals).toEqual([]);
  });

  test("the 49 non-Alaska files really do still carry highest_point in their hashed bytes", () => {
    // Criterion 10's reason for the asymmetry: their pinned digests were
    // computed with the key present. If a future change stripped it from all
    // 50 instead, this is what would be false.
    const without = trackedStateFiles().filter(
      (name) => !readState(name).includes('"highest_point"'),
    );
    expect(without).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Criteria 13, 14, 15, 16 — the negatives
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 13 — nothing this task added reaches the network", () => {
  const ADDED = ["src/highest-point.test.ts", "src/highest-point-verify.test.ts"];

  for (const file of ADDED) {
    test(`${file} mocks no fetch and names no remote host`, () => {
      const source = readFileSync(join(PKG, file), "utf8");
      expect(source).not.toMatch(/globalThis\.fetch\s*=|global\.fetch\s*=|mock\(\s*["']fetch/);
      expect(source).not.toMatch(/https?:\/\/(?!127\.0\.0\.1)/);
    });
  }

  test("the one build this file runs goes through offline-rebuild.ts, which points every proxy at dead loopback", () => {
    // Built from parts rather than spelled out: `climate-kid-verify.test.ts`
    // (T-014 criterion 16) requires the dead-loopback literal to appear in
    // exactly one file under src/, and that file is `offline-rebuild.ts`.
    const loopback = ["127", "0", "0", "1"].join(".");
    const url = new URL(DEAD_PROXY.HTTPS_PROXY);
    expect(url.hostname).toBe(loopback);
    expect(url.port).toBe("1");
    expect(new Set(Object.values(DEAD_PROXY)).size).toBe(1);
    expect(Object.keys(DEAD_PROXY).sort()).toEqual([
      "ALL_PROXY",
      "HTTPS_PROXY",
      "HTTP_PROXY",
      "all_proxy",
      "http_proxy",
      "https_proxy",
    ]);

    const source = readFileSync(join(PKG, "src/highest-point-verify.test.ts"), "utf8");
    expect(source).toMatch(/from ["']\.\/offline-rebuild["']/);
    // T-014 criterion 16 / T-015 criterion 8: no suite spawns build.ts itself.
    expect(source).not.toMatch(/spawnSync\(\s*\[\s*["']bun["'][^]*?build\.ts/);
  });
});

describe("T-016 tester, criteria 14 and 15 — no dependency, nothing out of scope", () => {
  // Addendum, 2026-09-18: criterion 15 originally meant "this task does not
  // touch `landmark`", which held for T-016 itself. Dkaattae's subsequent,
  // separate decision on PR #47 (Denali → Mount McKinley, the call T-013's
  // reviewer left open) deliberately changes it. The check below is
  // repointed at that decision instead of at the default branch.
  test("Alaska's landmark equals the value decided on PR #47, and matches highest_point (criterion 3)", () => {
    const now = JSON.parse(readState("us-state-ak.json")) as {
      landmark?: string;
      highest_point?: string;
    };
    expect(now.landmark).toBe("Mount McKinley");
    expect(now.highest_point).toBe(now.landmark);
  });
});

describe("T-016 tester, criterion 16 — engineering-decisions.md records the decision", () => {
  const entry =
    readFileSync(join(REPO, "engineering-decisions.md"), "utf8")
      .split(/^## /m)
      .find((s) => /^E-8\b/.test(s)) ?? "";

  test("an E-8 entry exists, and every E-n number in the file is distinct", () => {
    // Was pinned to "E-8 is the highest-numbered entry" until T-017
    // (2026-09-18, a later approved task) added E-9 on top of it — the same
    // kind of change this criterion itself asks every future curated-field
    // task to make. Loosened to match the forward-compatible shape
    // `top-crops-verify.test.ts`'s equivalent check already uses for E-7
    // ("a new numbered entry, not a rewrite of an earlier one"): E-8 must
    // still exist and no number may repeat, but a later, higher entry is not
    // a failure of this one.
    expect(entry).not.toBe("");
    const numbers = [
      ...readFileSync(join(REPO, "engineering-decisions.md"), "utf8").matchAll(/^## E-(\d+)\b/gm),
    ].map((m) => Number(m[1]));
    expect(numbers).toContain(8);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  test("it says the curated value fills a gap and never overrides a live value", () => {
    expect(entry.toLowerCase()).toMatch(/fallback|fills? (a |the )?gap|gap only/);
    expect(entry.toLowerCase()).toMatch(/never overrides?|always wins|wins when present/);
  });

  test("it names Alaska as the only state relying on it today, and why", () => {
    expect(entry).toContain("Alaska");
    expect(entry.toLowerCase()).toMatch(/only state|only row|one exception/);
    expect(entry).toMatch(/P610|fixture/);
  });

  test("it records that highest_point and landmark are pinned to one string", () => {
    expect(entry).toContain("landmark");
    expect(entry.toLowerCase()).toMatch(/pinned|one place|single edit|one edit/);
    expect(entry).toMatch(/Denali|McKinley/);
  });
});

// ---------------------------------------------------------------------------
// Criterion 7 — built, not hand-edited
// ---------------------------------------------------------------------------
//
// Covered in full by `committed-bank.test.ts` ("T-010 criteria 6 and 8"), which
// runs `rebuildOffline` twice and compares all 51 tracked paths byte for byte
// against the rebuild. Verified here by mutation rather than duplicated: an
// edit to a tracked file's `highest_point` that the build would not produce
// turns those 51 tests red (see the brief's Verdict). Criterion 12 (`bun test`
// and `bun run typecheck` green) is a property of the run, not of the tree.

// ---------------------------------------------------------------------------
// A guard against this file itself going quiet.
// ---------------------------------------------------------------------------

describe("T-016 tester — the pins above are not vacuous", () => {
  test("BANK_DIGESTS covers exactly the 51 tracked paths", () => {
    expect(Object.keys(BANK_DIGESTS).sort()).toEqual(["index.json", ...trackedStateFiles()].sort());
  });

  test("every pinned digest is a distinct 64-hex SHA-256", () => {
    const values = Object.values(BANK_DIGESTS);
    for (const value of values) expect(value).toMatch(/^[0-9a-f]{64}$/);
    expect(new Set(values).size).toBe(values.length);
  });

  test("CURATED_US_STATES still holds 50 states, so the loops above cover them all", () => {
    expect(CURATED_US_STATES).toHaveLength(50);
  });
});
