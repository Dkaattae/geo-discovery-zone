import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { BANK_DIGESTS, bankFileDigest } from "./bank-pins";
import { CURATED_US_STATES } from "./curated/us-states";
import { normalizeUsStates, resolveElevation } from "./normalize";
import { rebuildOffline } from "./offline-rebuild";
import { UNIT_FOOT, UNIT_METRE } from "./queries/us-states-elevation";
import type { ElevationStatement, WikidataStateRow } from "./sources/wikidata";

/**
 * T-079 tester. Written from the brief's acceptance criteria
 * (`tasks/T-079-highest-point-in-state.md`), not from the implementation:
 * every expected number below is the criterion's own (727.2, 1516.4, 1740.6,
 * revision 1377209854), or a digest of the default branch, computed once with
 * `git show <commit>:<path> | sha256sum` (CI's checkout has no history to ask).
 * The bank files are pinned at `b0ee336` through `bank-pins.ts` (T-070 rows
 * W33–W35, `engineering-decisions.md` E-30).
 *
 * Criteria 9-15 call `normalizeUsStates` directly on rows built in the test.
 * They reach no network and spawn nothing (criterion 16). Only the criteria
 * 1-3 rebuild spawns `build.ts`, offline, through `offline-rebuild.ts`.
 */

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");

const sha256 = (bytes: string | Buffer): string => createHash("sha256").update(bytes).digest("hex");
const readData = (name: string): string => readFileSync(join(DATA_DIR, name), "utf8");

/** The three states this task changes: criterion → file, new value, main's value, label. */
const CHANGED = [
  { postal: "CT", file: "us-state-ct.json", now: "727.2", main: "748", label: "Mount Frissell" },
  { postal: "OK", file: "us-state-ok.json", now: "1516.4", main: "1737", label: "Black Mesa" },
  { postal: "VA", file: "us-state-va.json", now: "1740.6", main: "1825", label: "Mount Rogers" },
] as const;
const CHANGED_FILES = new Set<string>(CHANGED.map((c) => c.file));
/** The 47 state files T-079 did not change. */
const OTHERS = Object.keys(BANK_DIGESTS).filter(
  (name) => name !== "index.json" && !CHANGED_FILES.has(name),
);

// ---------------------------------------------------------------------------
// Shipped data — criteria 1-6
// ---------------------------------------------------------------------------

describe("T-079 tester, criteria 1-3 — an offline rebuild ships the in-state high point", () => {
  const rebuilt = rebuildOffline(
    join(PKG, "src/build.ts"),
    CHANGED.map((c) => c.file),
    "t079-verify-",
  );

  for (const { file, now } of CHANGED) {
    test(`criterion ${CHANGED.findIndex((c) => c.file === file) + 1}: ${file} has highest_point_m ${now} after the rebuild, and the committed file is that rebuild`, () => {
      const fresh = rebuilt.get(file);
      expect(fresh).toBeDefined();
      expect(JSON.parse(fresh!).highest_point_m).toBe(Number(now));
      expect(readData(file)).toBe(fresh!);
    });
  }
});

describe("T-079 tester, criterion 4 — in CT, OK and VA only the highest_point_m line moved", () => {
  for (const { file, now } of CHANGED) {
    test(`${file} digests to its b0ee336 pin, built_at aside`, () => {
      // T-070 row W33: no value is put back before hashing.
      const text = readData(file);
      const newLine = `  "highest_point_m": ${now},\n`;
      expect(text.split(newLine)).toHaveLength(2);
      expect(bankFileDigest(file, text)).toBe(BANK_DIGESTS[file]!);
    });
  }
});

describe("T-079 tester, criterion 5 — the other 47 state files match b0ee336, built_at aside", () => {
  test("there are exactly 47 of them", () => {
    expect(OTHERS).toHaveLength(47);
  });

  // T-070 row W34.
  for (const name of OTHERS) {
    test(`${name} digests to its b0ee336 pin, built_at aside`, () => {
      expect(bankFileDigest(name, readData(name))).toBe(BANK_DIGESTS[name]!);
    });
  }
});

describe("T-079 tester, criterion 6 — the highest_point label is unchanged in all 50 files", () => {
  for (const { file, label } of CHANGED) {
    test(`${file} still names ${label}`, () => {
      expect(JSON.parse(readData(file)).highest_point).toBe(label);
    });
  }

  test("the other 47 keep their b0ee336 pins, label included (criterion 5's digests)", () => {
    // T-070 row W35.
    const moved = OTHERS.filter(
      (name) => bankFileDigest(name, readData(name)) !== BANK_DIGESTS[name],
    );
    expect(moved).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The curated override — criteria 7-8
// ---------------------------------------------------------------------------

describe("T-079 tester, criterion 7 — exactly CT, OK and VA carry a highest_point_m override", () => {
  test("the curated table still has 50 states", () => {
    expect(CURATED_US_STATES).toHaveLength(50);
  });

  test("the set carrying one is exactly CT, OK, VA, with 727.2, 1516.4, 1740.6", () => {
    const withOverride = CURATED_US_STATES.filter((s) => s.highest_point_m !== undefined)
      .map((s) => [s.postal, s.highest_point_m!.metres] as const)
      .sort(([a], [b]) => a.localeCompare(b));
    expect(withOverride).toEqual([
      ["CT", 727.2],
      ["OK", 1516.4],
      ["VA", 1740.6],
    ]);
  });

  test("the other 47 carry no highest_point_m key at all", () => {
    const others = CURATED_US_STATES.filter((s) => !["CT", "OK", "VA"].includes(s.postal));
    expect(others).toHaveLength(47);
    expect(others.filter((s) => "highest_point_m" in s).map((s) => s.postal)).toEqual([]);
  });
});

describe("T-079 tester, criterion 8 — each override's source is readable data naming revision 1377209854", () => {
  for (const postal of ["CT", "OK", "VA"]) {
    test(`${postal}'s override has a string source containing 1377209854`, () => {
      const state = CURATED_US_STATES.find((s) => s.postal === postal)!;
      const source: unknown = (state.highest_point_m as unknown as Record<string, unknown>)[
        "source"
      ];
      expect(typeof source).toBe("string");
      expect(source as string).toContain("1377209854");
    });
  }
});

// ---------------------------------------------------------------------------
// Normalisation — criteria 9-15, pure calls on in-test rows (criterion 16)
// ---------------------------------------------------------------------------

const row = (name: string, extra: Partial<WikidataStateRow> = {}): WikidataStateRow => ({
  name,
  borderQids: [],
  borderNames: [],
  ...extra,
});
const metre = (amount: number): ElevationStatement => ({ amount, unit: UNIT_METRE });
const foot = (amount: number): ElevationStatement => ({ amount, unit: UNIT_FOOT });

function normalizeOne(r: WikidataStateRow) {
  const result = normalizeUsStates([r], { builtAt: "2026-10-06T00:00:00.000Z" });
  expect(result.unmatched).toEqual([]);
  expect(result.entities).toHaveLength(1);
  const entity = result.entities[0]!;
  const elevationWarnings = result.warnings
    .filter((w) => w.entity === entity.id && w.field === "highest_point_m")
    .map((w) => w.message);
  return { entity, elevationWarnings };
}

const OVERRIDDEN = [
  { name: "Connecticut", curated: 727.2 },
  { name: "Oklahoma", curated: 1516.4 },
  { name: "Virginia", curated: 1740.6 },
] as const;

describe("T-079 tester, criterion 9 — an override wins over a differing Wikidata value", () => {
  for (const { name, curated } of OVERRIDDEN) {
    test(`${name}: a single metre statement of 2000 ships ${curated}`, () => {
      expect(normalizeOne(row(name, { elevations: [metre(2000)] })).entity.highest_point_m).toBe(
        curated,
      );
    });
  }

  test("Connecticut: several metre statements (largest 900) still ship 727.2", () => {
    const r = row("Connecticut", { elevations: [metre(700), metre(900), metre(800)] });
    expect(normalizeOne(r).entity.highest_point_m).toBe(727.2);
  });

  test("Virginia: a foot-only statement that resolves to a different value still ships 1740.6", () => {
    const r = row("Virginia", { elevations: [foot(5987)] });
    expect(resolveElevation(r).metres).not.toBe(1740.6);
    expect(normalizeOne(r).entity.highest_point_m).toBe(1740.6);
  });

  test("Oklahoma: a value 0.1 m off the override still ships the override", () => {
    const r = row("Oklahoma", { elevations: [metre(1516.5)] });
    expect(normalizeOne(r).entity.highest_point_m).toBe(1516.4);
  });
});

describe("T-079 tester, criterion 10 — one highest_point_m warning naming both values", () => {
  for (const { name, curated } of OVERRIDDEN) {
    test(`${name}: a single metre statement of 2000 gives exactly one warning containing 2000 and ${curated}`, () => {
      const { elevationWarnings } = normalizeOne(row(name, { elevations: [metre(2000)] }));
      expect(elevationWarnings).toHaveLength(1);
      expect(elevationWarnings[0]).toContain("2000");
      expect(elevationWarnings[0]).toContain(String(curated));
    });
  }

  test("Connecticut with Wikidata's real 748: one warning containing 748 and 727.2", () => {
    const { elevationWarnings } = normalizeOne(row("Connecticut", { elevations: [metre(748)] }));
    expect(elevationWarnings).toHaveLength(1);
    expect(elevationWarnings[0]).toContain("748");
    expect(elevationWarnings[0]).toContain("727.2");
  });

  test("the warning is on the overridden entity only; a neighbour in the same batch gets none", () => {
    const result = normalizeUsStates(
      [
        row("Connecticut", { elevations: [metre(748)] }),
        row("Rhode Island", { elevations: [metre(247)] }),
      ],
      { builtAt: "2026-10-06T00:00:00.000Z" },
    );
    const byEntity = (id: string) =>
      result.warnings.filter((w) => w.entity === id && w.field === "highest_point_m");
    expect(byEntity("us-state-ct")).toHaveLength(1);
    expect(byEntity("us-state-ri")).toHaveLength(0);
  });
});

describe("T-079 tester, criterion 11 — an override with no Wikidata elevation still ships, and warns once", () => {
  for (const { name, curated } of OVERRIDDEN) {
    test(`${name}: no elevation statements ships ${curated} with exactly one warning containing it`, () => {
      const { entity, elevationWarnings } = normalizeOne(row(name));
      expect(entity.highest_point_m).toBe(curated);
      expect(elevationWarnings).toHaveLength(1);
      expect(elevationWarnings[0]).toContain(String(curated));
    });
  }

  test("an explicitly empty elevations list behaves the same", () => {
    const { entity, elevationWarnings } = normalizeOne(row("Oklahoma", { elevations: [] }));
    expect(entity.highest_point_m).toBe(1516.4);
    expect(elevationWarnings).toHaveLength(1);
    expect(elevationWarnings[0]).toContain("1516.4");
  });
});

describe("T-079 tester, criterion 12 — an override over an unreadable unit ships, and never says 'left blank'", () => {
  const unreadable: [string, Partial<WikidataStateRow>][] = [
    ["a statement with no unit", { elevations: [{ amount: 727 }] }],
    ["a dimensionless Q199 statement", { elevations: [{ amount: 727, unit: "Q199" }] }],
    ["a kilometre (Q828224) statement", { elevations: [{ amount: 0.727, unit: "Q828224" }] }],
    [
      "two unreadable statements",
      { elevations: [{ amount: 727 }, { amount: 2385, unit: "Q174728" }] },
    ],
    ["an elevation with no unit response at all", { elevationUnitless: 748 }],
  ];

  for (const [label, extra] of unreadable) {
    test(`Connecticut with ${label}: ships 727.2, no warning contains "left blank"`, () => {
      const r = row("Connecticut", extra);
      // The case is real: without the override this row would be blanked.
      expect(resolveElevation(r).metres).toBeUndefined();
      const { entity, elevationWarnings } = normalizeOne(r);
      expect(entity.highest_point_m).toBe(727.2);
      expect(elevationWarnings.filter((m) => m.includes("left blank"))).toEqual([]);
    });
  }
});

describe("T-079 tester, criterion 13 — with no override, normalizeUsStates is exactly resolveElevation", () => {
  const cases: [string, WikidataStateRow][] = [
    ["Colorado, one metre statement", row("Colorado", { elevations: [metre(4401.2)] })],
    ["Colorado, foot-only", row("Colorado", { elevations: [foot(14440)] })],
    [
      "Alabama, several metre statements",
      row("Alabama", { elevations: [metre(735.5), metre(735), metre(733)] }),
    ],
    [
      "Kansas, metre and foot disagreeing by more than 1%",
      row("Kansas", { elevations: [metre(1300), foot(4039)] }),
    ],
    ["Oregon, an unreadable unit", row("Oregon", { elevations: [{ amount: 3429 }] })],
    ["Iowa, a unitless main-query elevation", row("Iowa", { elevationUnitless: 509 })],
  ];

  for (const [label, r] of cases) {
    test(`${label}: same metres, same warnings`, () => {
      const expected = resolveElevation(r);
      const { entity, elevationWarnings } = normalizeOne(r);
      expect(entity.highest_point_m).toBe(expected.metres);
      expect(elevationWarnings).toEqual(expected.warnings);
    });
  }

  test("the metre-stated and foot-only cases actually resolve to a value", () => {
    expect(resolveElevation(cases[0]![1]).metres).toBe(4401.2);
    expect(resolveElevation(cases[1]![1]).metres).toBeGreaterThan(0);
  });

  test("the disagreeing case actually carries a warning, so the equality is not between two empties", () => {
    expect(resolveElevation(cases[3]![1]).warnings.length).toBeGreaterThan(0);
  });
});

describe("T-079 tester, criterion 14 — no override and no elevation leaves highest_point_m absent", () => {
  for (const name of ["Colorado", "Alaska", "Rhode Island"]) {
    test(`${name} with no elevation has no highest_point_m key`, () => {
      const { entity } = normalizeOne(row(name));
      expect("highest_point_m" in entity).toBe(false);
    });
  }
});

describe("T-079 tester, criterion 15 — the highest_point label still prefers Wikidata (E-8)", () => {
  test("Alaska: a row label beats the curated highest_point", () => {
    const alaska = CURATED_US_STATES.find((s) => s.postal === "AK")!;
    expect(alaska.highest_point).toBeDefined();
    const { entity } = normalizeOne(row("Alaska", { highestPoint: "Denali From Wikidata" }));
    expect(entity.highest_point).toBe("Denali From Wikidata");
  });

  test("Alaska: with no row label, the curated label fills the gap", () => {
    const alaska = CURATED_US_STATES.find((s) => s.postal === "AK")!;
    const { entity } = normalizeOne(row("Alaska"));
    expect(entity.highest_point).toBe(alaska.highest_point!);
  });

  test("Connecticut: the elevation override does not touch the label the row carries", () => {
    const { entity } = normalizeOne(
      row("Connecticut", { highestPoint: "Mount Frissell", elevations: [metre(748)] }),
    );
    expect(entity.highest_point).toBe("Mount Frissell");
  });
});

// ---------------------------------------------------------------------------
// Decision record — criteria 17-18
// ---------------------------------------------------------------------------

const DECISIONS = readFileSync(join(REPO, "engineering-decisions.md"), "utf8");
/** `git show 323254c:engineering-decisions.md | sha256sum`, 51988 bytes. */
const MAIN_DECISIONS_DIGEST = "751d9bc3088bd2422bb4280fd42783c7c630627a346905ab1d826c6669d30998";

function e19(): string {
  const start = DECISIONS.search(/^## E-19\b/m);
  expect(start).toBeGreaterThan(-1);
  const rest = DECISIONS.slice(start);
  const next = rest.slice(1).search(/^## /m);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

describe("T-079 tester, criterion 17 — engineering-decisions.md gains E-19", () => {
  test("exactly one E-19 heading exists", () => {
    expect(DECISIONS.match(/^## E-19\b/gm)).toHaveLength(1);
  });

  test("(a) it states the rule: the highest point inside the state's borders", () => {
    expect(e19()).toMatch(/highest point inside\s+the state's borders/);
  });

  test("(b) it names the mechanism: a curated highest_point_m that wins and warns", () => {
    const text = e19();
    expect(text).toContain("CuratedState");
    expect(text).toContain("highest_point_m");
    expect(text).toMatch(/warning/);
  });

  test("(c) it says it reverses E-8 for highest_point_m only, leaving the label under E-8", () => {
    const text = e19();
    expect(text).toContain("E-8");
    expect(text).toMatch(/reversed/i);
    expect(text).toMatch(/label/);
  });

  test("(d) it lists CT, OK, VA with 727.2, 1516.4, 1740.6 and revision 1377209854", () => {
    const text = e19();
    for (const s of ["CT", "OK", "VA", "727.2", "1516.4", "1740.6", "1377209854"]) {
      expect(text).toContain(s);
    }
  });

  test("(e) it says when an override is deleted: when Wikidata comes to agree", () => {
    expect(e19()).toMatch(
      /delete[\s\S]{0,80}Wikidata comes to agree|Wikidata comes to agree[\s\S]{0,80}delete/i,
    );
  });
});

describe("T-079 tester, criterion 18 — E-1 to E-18 are unchanged", () => {
  test("everything before E-19 is main's file, byte for byte", () => {
    const start = DECISIONS.search(/^## E-19\b/m);
    expect(start).toBeGreaterThan(-1);
    const before = DECISIONS.slice(0, start).replace(/\n+$/, "\n");
    expect(sha256(before)).toBe(MAIN_DECISIONS_DIGEST);
  });
});

// ---------------------------------------------------------------------------
// What must not happen — criteria 19-20
// ---------------------------------------------------------------------------

describe("T-079 tester, criterion 20 — every package.json and bun.lock is byte-identical to 323254c", () => {
  const manifests: Record<string, string> = {
    // re-pinned by T-064 row 32: build:sample removed (its criterion 2)
    "question-bank/package.json":
      "5286f4f725a98f5e54d45cf2646be5b38152ffc87ba5ac91039b919c49ec3f72",
    "question-bank/bun.lock": "6bb53377c455e7936275e795c81aa62b41fcb239017b4dd9a744dfd38bda34d1",
    "frontend/package.json": "22870bb992a6e2db8770998ce5cb0b095ce785fcc16801f6bf9deb25e33e332f",
    "frontend/bun.lock": "5ec60daccc0422c6a67e520b46e372be8a16b04bf2a37b3170f087ef69afc733",
    "e2e/package.json": "2a77756f4acec47ffbf4488ffd00e62a56da3c39cb89466e4f7b3f7fb49a5921",
    "e2e/bun.lock": "518a40b596a5bc9c4bc1b10ea8dbfbf32342539c08622fde3cef22e546a7574d",
  };
  for (const [path, digest] of Object.entries(manifests)) {
    test(path, () => {
      expect(sha256(readFileSync(join(REPO, path)))).toBe(digest);
    });
  }

  test("no other package.json or bun.lock is tracked", () => {
    const proc = Bun.spawnSync(["git", "ls-files"], { cwd: REPO });
    expect(proc.exitCode).toBe(0);
    const tracked = proc.stdout
      .toString()
      .split("\n")
      .filter((p) => /(^|\/)(package\.json|bun\.lock)$/.test(p))
      .sort();
    expect(tracked).toEqual(Object.keys(manifests).sort());
  });
});
