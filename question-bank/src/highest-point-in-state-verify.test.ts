import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";
import { normalizeUsStates, resolveElevation } from "./normalize";
import { rebuildOffline } from "./offline-rebuild";
import { UNIT_FOOT, UNIT_METRE } from "./queries/us-states-elevation";
import type { ElevationStatement, WikidataStateRow } from "./sources/wikidata";

/**
 * T-079 tester. Written from the brief's acceptance criteria
 * (`tasks/T-079-highest-point-in-state.md`), not from the implementation:
 * every expected number below is the criterion's own (727.2, 1516.4, 1740.6,
 * revision 1377209854), or a digest of the default branch at expand time,
 * `323254c`, computed once with `git show 323254c:<path> | sha256sum`
 * (CI's checkout has no history to ask).
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

/** `git show 323254c:question-bank/data/us-states/<name> | sha256sum`. */
const MAIN_DIGESTS: Record<string, string> = {
  "us-state-ak.json": "f28e22edbcb3ecd5e069a1dfa0345706ad5b4e7026c8f9e450e7f2dc1996abfd",
  "us-state-al.json": "a52b8ad3c4f8ce0a3381e07726346822330428604f331588bce2a0432b878188",
  "us-state-ar.json": "71c4822e4b57ce622978d3bc9a16d40691d9726d265354a7a1e437b79424c09d",
  "us-state-az.json": "e9c19a1e510c2dcf852e4d7cba11619528f8d254b69b455cd6f8303bede85b83",
  "us-state-ca.json": "6e0bcc2c1c323875822ec5effbf228cd92e048ba2b9d294e88aeaae584adff2b",
  "us-state-co.json": "df34ee28731b42de2c94e1901345fccdb69955b5a17e812cf6d2bd9d239c80d3",
  "us-state-ct.json": "28254e36df7b0fddc962d5c20a6ada0ec37318539850f5191897505ccf69977e",
  "us-state-de.json": "8c4e61702068085751ba17e59715fcd21177c8b29401c31d07b8baea173e1f7a",
  "us-state-fl.json": "59cce844770de3d6b68b07c6c8a88f5b24fc0cf4c44e8a2c0b715bced837f2dc",
  "us-state-ga.json": "c3396bd94fd03bc12dd68f8a3ac639f3554a40cc3ca6b184d17f99a80b590127",
  "us-state-hi.json": "35fbe3178872f8ee25911bf0ca4946f08f4fe70c3306f65d47b0b78f3107ea1a",
  "us-state-ia.json": "6e33a9d592ead70f5bf1151484b2301e6202a4e08ccf5526d3d146f8f378ef5c",
  "us-state-id.json": "ad38c645aee8eec6bae3e7118e7406e91e7e154d1a516ccba997504bcc91d0f7",
  "us-state-il.json": "c1bb7cfdd7208d3a1677b0ab4e0e5483beae1e851d1bc7418ff83e004c594379",
  "us-state-in.json": "be17dd4dd3fa8d98042876d10aee7f1bb5a6478b47b9d8ce10f987869e583c75",
  "us-state-ks.json": "bd4308137a43c96fb2787a3dc0f86c180265d1866f9168c7c1b38034d421bbac",
  "us-state-ky.json": "7ae104e6aaf4ee4c4c91029fd71c8af232cee2c9ad987d583c4baca5a2057cce",
  "us-state-la.json": "cf442ac0a0db895104f7b2c147468b253c716a80f790749a76a96fc39e6df71a",
  "us-state-ma.json": "05727b04f43d900f8516dc6dd3b4d8c1d244afcfcba179a96d054c06f678fdae",
  "us-state-md.json": "419f3069735b84d4471684f809437464f6416b9886d095d46ccd39f9ba19bb39",
  "us-state-me.json": "2aff0bbf01c745e51505ed38b0ebe60c0b46a3be6b0ab26dae2f430f27dff997",
  "us-state-mi.json": "252b7f8cec0fcdeca1eed358dda773d0882e080ddbbe23c8bbc4459a0ce9d940",
  "us-state-mn.json": "942dfcb8bdff5cdd85adf251a5be2c948d41e3bd41425f003eec6db38f17b672",
  "us-state-mo.json": "b8a8eea72e8e8ffdcdd9fe6c8de7db91aa64659cdc18133001040fbca4625a8b",
  "us-state-ms.json": "5e595291816dbb32c4f2b9bd2834156000ce41db8b9cb1ad19cb2d653dad3b49",
  "us-state-mt.json": "3fb38c06b709a453ced3ce52cc2d7eda6413cca5e31f25a460138552b069ef3f",
  "us-state-nc.json": "9e05b9b308d575080a0f36e12ea08ce7630b21a01feefa40c2ced203b7bfb405",
  "us-state-nd.json": "a1d2309eb3254c7a5ba803da727771dcb69b2e34898591cb0232b6ae395bdf0d",
  "us-state-ne.json": "83fedf1d6cd376f533527f65c3ad40cca8e0768a5dc146cf01af4359fb12051a",
  "us-state-nh.json": "77d6ff265c156ce527e82ba48290f18d82a49c6fe3ff601a50702d2f8d40acd9",
  "us-state-nj.json": "3863b7f8b4cab836471832bef571ccf93e6c9cf70bebcc280a2df9e084367c15",
  "us-state-nm.json": "7e1417cfc6478cfe13e3aa3c614547a8d50449295bccbe7ccfb3fdab3a526a53",
  "us-state-nv.json": "170102a6239cf7d184292da42d817c26f9fefa1e32ee14f90e6ccc2b81f71f3f",
  "us-state-ny.json": "3e982b0c5dd74a93808eafca4d6d1134c2578fcaf7b1adc131dd16126dfecb02",
  "us-state-oh.json": "d3663516518108469eb5044262c534deec6ba2d1900b24be9f715925a470f3c9",
  "us-state-ok.json": "25c14ed8349b068b128d74980676f02f5e2745fcd037b23978183a9f52355f40",
  "us-state-or.json": "66ff8da8070cb43b45a82feec17db9d275b7f0d82aa83fc6ca631bb8b2e557bf",
  "us-state-pa.json": "999d56664a1085a0a28455ae4feb145bb21cba9c935b24c1cee041a84acf1c1f",
  "us-state-ri.json": "f71906ea420da2083d0d57f26cda855de6c52fb911ec1e96b388c0680c185462",
  "us-state-sc.json": "d76c1e9512525548305111b6c27fca080fd9a6667c6659d81380ed8ca8bbb357",
  "us-state-sd.json": "c13f380133b13c82aa94e9d6442bdecd015fa57f61f97d6909ae4124c441133c",
  "us-state-tn.json": "b2ef4eb37c6ce02606e0b9e390e398ab882062d767d0f509201ebd2b9d3bdb39",
  "us-state-tx.json": "c63e9c872407f60ab5a7e52927d175a6a8ad7050b221199d0524865278ddf201",
  "us-state-ut.json": "5535306451b1d2ee4c13f05778ba5b0f97ea60becbe1ed15fbdd248a0dea4efd",
  "us-state-va.json": "b7f2b2d54cc062c5253086687f673dc6551dcd6b8fe1239fdd92c0d2a08d531e",
  "us-state-vt.json": "6dfcff1cfc2f2da7b1a5a571fe9ceebc69d6bba2d1b4b64211c5ad3a98a09e80",
  "us-state-wa.json": "287c3ecb62e598b2ae4a9108fc5cf11fbcf1d2dc3e157b5b651b6b50d53a8973",
  "us-state-wi.json": "a23fb3286b581f935aacbf64e85d373e445d5f68b5f124452b58b2336ac17be2",
  "us-state-wv.json": "f9cd12bc4e7a7e85c00c32ecdb02214f49dd8d517089dbeccf65600abc94842e",
  "us-state-wy.json": "8fada212390dafcdc30676c7c230cc7156245f8b589bef9577564df2b08e1108",
};

/** The three states this task changes: criterion → file, new value, main's value, label. */
const CHANGED = [
  { postal: "CT", file: "us-state-ct.json", now: "727.2", main: "748", label: "Mount Frissell" },
  { postal: "OK", file: "us-state-ok.json", now: "1516.4", main: "1737", label: "Black Mesa" },
  { postal: "VA", file: "us-state-va.json", now: "1740.6", main: "1825", label: "Mount Rogers" },
] as const;
const CHANGED_FILES = new Set<string>(CHANGED.map((c) => c.file));

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
  for (const { file, now, main } of CHANGED) {
    test(`${file}: putting main's value back on that one line restores main's exact bytes`, () => {
      const text = readData(file);
      const newLine = `  "highest_point_m": ${now},\n`;
      expect(text.split(newLine)).toHaveLength(2);
      const restored = text.replace(newLine, `  "highest_point_m": ${main},\n`);
      expect(sha256(restored)).toBe(MAIN_DIGESTS[file]!);
    });
  }
});

describe("T-079 tester, criterion 5 — the other 47 state files are byte-identical to 323254c", () => {
  const others = Object.keys(MAIN_DIGESTS).filter((name) => !CHANGED_FILES.has(name));

  test("there are exactly 47 of them", () => {
    expect(others).toHaveLength(47);
  });

  for (const name of others) {
    test(`${name} digests to main's value`, () => {
      expect(sha256(readData(name))).toBe(MAIN_DIGESTS[name]!);
    });
  }
});

describe("T-079 tester, criterion 6 — the highest_point label is unchanged in all 50 files", () => {
  for (const { file, label } of CHANGED) {
    test(`${file} still names ${label}`, () => {
      expect(JSON.parse(readData(file)).highest_point).toBe(label);
    });
  }

  test("the other 47 keep main's bytes, label included (criterion 5's digests)", () => {
    const others = Object.keys(MAIN_DIGESTS).filter((name) => !CHANGED_FILES.has(name));
    const moved = others.filter((name) => sha256(readData(name)) !== MAIN_DIGESTS[name]);
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

describe("T-079 tester, criterion 19 — both SPARQL fixtures are byte-identical to 323254c", () => {
  const fixtures: Record<string, string> = {
    "us-states.sparql.json": "994223feb64bec88ac9f0f85bd0f538a9bc061329dfb09c4a97397f0e1aff41f",
    "us-states-elevation.sparql.json":
      "9ef05326f66f54876ca3a554698f7bd11648ff6ba8884116028dd9e293598ab7",
  };
  for (const [name, digest] of Object.entries(fixtures)) {
    test(name, () => {
      expect(sha256(readFileSync(join(PKG, "src/fixtures", name)))).toBe(digest);
    });
  }
});

describe("T-079 tester, criterion 20 — every package.json and bun.lock is byte-identical to 323254c", () => {
  const manifests: Record<string, string> = {
    "question-bank/package.json":
      "c00e1069eb97d80bd1a838a2c9d9e3e72c22e79e34bd7307ae088e599850b676",
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
