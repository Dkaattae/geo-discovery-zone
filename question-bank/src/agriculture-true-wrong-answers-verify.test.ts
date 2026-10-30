/**
 * T-088 tester: one test (or more) per acceptance criterion of
 * `tasks/T-088-agriculture-true-wrong-answers.md`.
 *
 * Expected values come from the brief: Tables A and B are transcribed from it
 * below, the eleven animals and the PA / CA sets are its criteria 5, 9 and 10.
 * Main's state (criteria 1-3, 20-23, 25) is held as sha256 digests recorded at
 * `a42b71b` (the brief's "main") when this file was written, because CI checks
 * out shallow and a test may not hand `git` a revision (E-30: a pin names the
 * commit it was recorded at). Criterion 19 is in
 * `backend/tests/test_t088_tester_criteria.py`.
 *
 * Pure: committed files read from disk, synthetic entities built in memory.
 * The one spawn is `git ls-files` (working tree only), and it throws on a
 * non-zero exit. No network.
 */
import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { ALSO_GROWN, ALSO_RAISED, buildChoices } from "./distractors";
import { generate } from "./generate";
import { renderQuestionFile } from "./question-file";
import { LEVEL_SEED_WEIGHTS } from "./seed-level";
import { TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";
import { loadCommittedEntities, REPO_ROOT } from "./write-questions";

// ---- The brief's tables, transcribed --------------------------------------

/** Table A: farm animals excluded as wrong answers, by postal code. */
const TABLE_A: Record<string, string[]> = {
  AL: ["goats"],
  AR: ["turkeys"],
  AZ: ["dairy cows"],
  CA: ["cattle", "chickens", "turkeys", "sheep", "goats", "horses", "ducks"],
  CO: ["dairy cows", "sheep", "bison"],
  DE: [],
  GA: ["goats"],
  IA: ["cattle", "chickens", "turkeys", "sheep", "goats"],
  ID: ["cattle", "sheep"],
  KS: ["pigs", "bison"],
  MD: [],
  MN: ["pigs", "dairy cows", "chickens", "cattle", "goats"],
  MS: [],
  MT: ["sheep", "bison"],
  NC: ["chickens", "goats"],
  NE: ["pigs", "bison"],
  NY: ["goats"],
  OK: ["pigs", "chickens", "goats", "horses", "bison"],
  PA: ["chickens", "pigs", "turkeys", "goats", "horses", "ducks"],
  SD: ["pigs", "turkeys", "sheep", "bison"],
  TX: ["chickens", "sheep", "dairy cows", "goats", "horses"],
  VT: [],
  WI: ["goats"],
  WY: ["sheep", "bison"],
};

/** Table B: crops excluded as wrong answers, by postal code. */
const TABLE_B: Record<string, string[]> = {
  AK: ["potatoes", "barley", "hay"],
  AL: ["soybeans", "corn", "pecans", "peaches"],
  AR: ["cotton", "corn", "wheat", "peanuts", "sorghum"],
  AZ: ["alfalfa hay", "hay", "wheat", "pecans"],
  CA: [
    "cherries",
    "potatoes",
    "apples",
    "tomatoes",
    "lettuce",
    "rice",
    "oranges",
    "peaches",
    "pears",
    "cotton",
    "alfalfa hay",
    "hay",
    "wheat",
    "corn",
    "sweet corn",
    "sweet potatoes",
    "blueberries",
    "mushrooms",
    "sugar beets",
    "chile peppers",
    "lima beans",
    "sunflowers",
  ],
  CO: ["sunflowers", "corn", "wheat", "hay", "alfalfa hay", "sugar beets", "barley", "sorghum"],
  CT: ["apples", "maple syrup", "sweet corn"],
  DE: ["corn", "soybeans", "sweet corn"],
  FL: ["sugarcane", "tomatoes", "sweet corn", "peanuts", "blueberries", "potatoes", "cotton"],
  GA: ["cotton", "blueberries", "corn", "soybeans", "tobacco", "sweet corn"],
  HI: [],
  IA: ["hay", "alfalfa hay"],
  ID: ["wheat", "barley", "sugar beets", "alfalfa hay", "hay"],
  IL: ["wheat", "sweet corn", "hay"],
  IN: ["wheat", "tomatoes", "hay"],
  KS: ["corn", "soybeans", "sunflowers", "hay", "alfalfa hay"],
  KY: ["soybeans", "wheat", "hay", "alfalfa hay"],
  LA: ["soybeans", "cotton", "sweet potatoes", "corn", "pecans"],
  MA: ["apples", "sweet corn"],
  MD: ["wheat", "sweet corn", "barley", "hay"],
  ME: ["apples", "maple syrup", "hay"],
  MI: ["corn", "soybeans", "sugar beets", "potatoes", "grapes", "wheat", "hay"],
  MN: ["sugar beets", "wheat", "hay", "alfalfa hay", "sweet corn", "potatoes"],
  MO: ["cotton", "rice", "wheat", "sorghum", "hay"],
  MS: ["corn", "rice", "sweet potatoes", "peanuts"],
  MT: ["hay", "alfalfa hay", "sugar beets", "cherries"],
  NC: ["corn", "soybeans", "cotton", "peanuts", "blueberries", "strawberries", "apples", "wheat"],
  ND: ["sugar beets", "soybeans", "corn", "barley", "potatoes", "hay"],
  NE: ["wheat", "sorghum", "hay", "alfalfa hay", "sugar beets"],
  NH: ["sweet corn", "hay"],
  NJ: ["peaches", "sweet corn", "apples"],
  NM: ["hay", "alfalfa hay", "cotton", "sorghum", "peanuts", "corn"],
  NV: ["hay", "potatoes"],
  NY: ["sweet corn", "potatoes", "corn", "soybeans", "hay"],
  OH: ["wheat", "tomatoes", "hay", "sweet corn"],
  OK: ["cotton", "sorghum", "hay", "alfalfa hay", "peanuts", "pecans", "corn", "soybeans"],
  OR: [
    "wheat",
    "barley",
    "hay",
    "alfalfa hay",
    "potatoes",
    "cherries",
    "blueberries",
    "grapes",
    "apples",
  ],
  PA: ["corn", "soybeans", "hay", "tobacco", "sweet corn", "peaches", "grapes", "potatoes"],
  RI: ["apples"],
  SC: ["soybeans", "corn", "peanuts", "tobacco", "sweet potatoes", "wheat", "pecans"],
  SD: ["sorghum", "wheat", "sunflowers", "hay", "alfalfa hay"],
  TN: ["corn", "wheat", "hay", "tobacco", "tomatoes"],
  TX: ["corn", "peaches", "wheat", "hay", "rice", "peanuts", "pecans", "oranges"],
  UT: ["hay", "wheat"],
  VA: ["soybeans", "corn", "wheat", "hay", "apples", "sweet potatoes", "tomatoes", "cotton"],
  VT: ["hay", "sweet corn", "corn"],
  WA: [
    "wheat",
    "barley",
    "alfalfa hay",
    "hay",
    "potatoes",
    "pears",
    "grapes",
    "blueberries",
    "sweet corn",
  ],
  WI: ["soybeans", "potatoes", "sweet corn", "hay", "alfalfa hay", "cherries"],
  WV: ["hay", "corn"],
  WY: ["alfalfa hay", "barley", "wheat", "corn"],
};

/** Criterion 5. */
const ELEVEN = [
  "chickens",
  "cattle",
  "dairy cows",
  "pigs",
  "turkeys",
  "sheep",
  "goats",
  "horses",
  "ducks",
  "rabbits",
  "bison",
];
/** Criterion 16. */
const ADDED = ["goats", "horses", "ducks", "rabbits", "bison"];
/** Criterion 12. */
const CROP_PAIRS: [string, string][] = [
  ["corn", "sweet corn"],
  ["hay", "alfalfa hay"],
  ["potatoes", "sweet potatoes"],
];

// ---- Main's state, recorded at a42b71b -----------------------------------

/** sha256 of JSON.stringify(ids sorted), question file, at a42b71b. */
const MAIN_IDS_SHA = "e140bd7b84385fc2e10cedbd5195949174432ce8998f27dda25ada32dd0a355a";
/** sha256 of JSON.stringify([[id, canon(q)], ...]) over non-agriculture questions, sorted by id, at a42b71b. */
const MAIN_NON_AGRI_SHA = "56395f5f34e3e5084d21e54ff8a47473ab7a52a2435728963d4088499eca6aaf";
/** Same, over agriculture questions with `choices` removed, at a42b71b. */
const MAIN_AGRI_NO_CHOICES_SHA = "326c489481b064c8c7e325c1b1f1d4d9f2bf83db413116c7dab35b90a89fd7a4";
/** sha256 of JSON.stringify([[file, sha(bytes)], ...]) over question-bank/data/us-states/, sorted, at a42b71b. */
const MAIN_ENTITY_DIR_SHA = "2eb39d22d0f7b8074671ac63d0c54b44b546534f4de266437fbaa2d7f664b81a";
/** Same shape over every tracked file under frontend/, at a42b71b. */
const MAIN_FRONTEND_SHA = "ca9fdb5fc806c9d17f7b844f79c78c426070620e35a71499fc70bb86f6bf56bc";
/** sha256 of canon(LEVEL_SEED_WEIGHTS), at a42b71b. */
const MAIN_LEVEL_SEED_WEIGHTS_SHA =
  "ba1a081d54a8a09ef2c6a802e3e7870e7f6d33ea93545bad80121356610e60b8";
/**
 * sha256 of JSON.stringify(engineering-decisions.md split at "## E-n ", E-25's part as null), at a42b71b;
 * re-pinned at `49444c8` (T-096, Test change request row 1) after T-096 amended E-22;
 * re-pinned at `4818fc8` (T-091, Test change request row 1) after T-091 amended E-25 and E-27.
 */
const MAIN_ED_OUTSIDE_E25_SHA = "ee4ead2780b3eb34b59f6f378b798447a06f69310555a766631141c3c71ba9bd";
/** sha256 of each file whole, at a42b71b. */
const MAIN_FILE_SHA: Record<string, string> = {
  "question-bank/src/curated/us-states.ts":
    "e61e8e50bd0fa6f1c958698009e23c3e92b83ba1e2af71426c6ae7afb95b4cbc",
  "openapi.yaml": "cddf482a77ecdde887ac0568c44190714825bef6ef9f874b0a195c2200f4d216",
};
const MAIN_DEP_SHA: Record<string, string> = {
  "backend/pyproject.toml": "a7741b6f8be54ee317fc9caf308debff1959b93b00f28efc6e7e760468813724",
  "backend/uv.lock": "88a95ecef4a5cdcc199de0722c241f754b654d764073562d886b9c440cd1edd8",
  "e2e/bun.lock": "518a40b596a5bc9c4bc1b10ea8dbfbf32342539c08622fde3cef22e546a7574d",
  "e2e/package.json": "2a77756f4acec47ffbf4488ffd00e62a56da3c39cb89466e4f7b3f7fb49a5921",
  "frontend/bun.lock": "5ec60daccc0422c6a67e520b46e372be8a16b04bf2a37b3170f087ef69afc733",
  "frontend/package.json": "22870bb992a6e2db8770998ce5cb0b095ce785fcc16801f6bf9deb25e33e332f",
  "question-bank/bun.lock": "6bb53377c455e7936275e795c81aa62b41fcb239017b4dd9a744dfd38bda34d1",
  "question-bank/package.json": "5286f4f725a98f5e54d45cf2646be5b38152ffc87ba5ac91039b919c49ec3f72",
};

// ---- Helpers ----------------------------------------------------------------

const sha = (s: string | Buffer): string => createHash("sha256").update(s).digest("hex");
const canon = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.map(canon).join(",")}]`;
  if (v !== null && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canon(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
};
const norm = (s: string): string => s.trim().toLowerCase();
const QUESTION_FILE = "question-bank/data/questions/us-states.json";

interface Q {
  id: string;
  templateId: string;
  entityId: string;
  answer: unknown;
  choices?: string[];
  correctIndex?: number;
  [k: string]: unknown;
}

const questionFileText = (): string => readFileSync(join(REPO_ROOT, QUESTION_FILE), "utf8");
const questions = (): Q[] => (JSON.parse(questionFileText()) as { questions: Q[] }).questions;
const AGRI = new Set(["tpl-crop-of", "tpl-farm-animal-of"]);
const ofTemplate = (id: string): Q[] => questions().filter((q) => q.templateId === id);
const byIdSorted = (qs: Q[]): Q[] => [...qs].sort((a, b) => a.id.localeCompare(b.id));
const wrong = (q: Q): string[] => (q.choices ?? []).filter((_, i) => i !== q.correctIndex);
const codeOf = (entityId: string): string => {
  const m = /^us-state-([a-z]{2})$/.exec(entityId);
  if (m === null) throw new Error(`not a state id: ${entityId}`);
  return (m[1] as string).toUpperCase();
};

const entities = loadCommittedEntities();
const entityById = new Map(entities.map((e) => [e.id, e]));
const list = (e: Entity | undefined, field: "top_crops" | "top_livestock" | "borders"): string[] =>
  (e?.[field] as string[] | undefined) ?? [];

function trackedFiles(path: string): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "-z", "--", path], { cwd: REPO_ROOT });
  if (proc.exitCode !== 0) {
    throw new Error(`git ls-files ${path} exited ${proc.exitCode}: ${proc.stderr.toString()}`);
  }
  return proc.stdout
    .toString()
    .split("\0")
    .filter((p) => p !== "");
}

const tpl = (id: string): Template => {
  const t = TEMPLATES.find((x) => x.id === id);
  if (t === undefined) throw new Error(`no template ${id}`);
  return t;
};

// ---- Criteria 1-4: the bank's shape does not change -------------------------

describe("T-088 criteria 1-4: the bank's shape does not change", () => {
  test("criterion 1: 415 ids, the same set as main's; 24 farm-animal, 50 crop", () => {
    const qs = questions();
    expect(qs).toHaveLength(415);
    expect(new Set(qs.map((q) => q.id)).size).toBe(415);
    expect(qs.filter((q) => q.templateId === "tpl-farm-animal-of")).toHaveLength(24);
    expect(qs.filter((q) => q.templateId === "tpl-crop-of")).toHaveLength(50);
    expect(sha(JSON.stringify(byIdSorted(qs).map((q) => q.id)))).toBe(MAIN_IDS_SHA);
  });

  test("criterion 2: every non-agriculture question is deep-equal to main's", () => {
    const non = byIdSorted(questions()).filter((q) => !AGRI.has(q.templateId));
    expect(non).toHaveLength(415 - 74);
    expect(sha(JSON.stringify(non.map((q) => [q.id, canon(q)])))).toBe(MAIN_NON_AGRI_SHA);
  });

  test("criterion 3: every agriculture question is main's apart from choices", () => {
    const agri = byIdSorted(questions()).filter((q) => AGRI.has(q.templateId));
    expect(agri).toHaveLength(74);
    const rest = agri.map((q) => {
      const { choices: _choices, ...others } = q;
      return [q.id, canon(others)];
    });
    expect(sha(JSON.stringify(rest))).toBe(MAIN_AGRI_NO_CHOICES_SHA);
  });

  test("criterion 4: four distinct choices, choices[correctIndex] is the answer", () => {
    const agri = questions().filter((q) => AGRI.has(q.templateId));
    expect(agri).toHaveLength(74);
    for (const q of agri) {
      const c = q.choices ?? [];
      expect([q.id, c.length]).toEqual([q.id, 4]);
      expect([q.id, new Set(c.map(norm)).size]).toEqual([q.id, 4]);
      expect([q.id, c[q.correctIndex as number]]).toEqual([q.id, q.answer as string]);
    }
  });
});

// ---- Criteria 5-10: farm animals --------------------------------------------

describe("T-088 criteria 5-10: farm animals", () => {
  const farm = () => ofTemplate("tpl-farm-animal-of");

  test("criterion 5: every wrong answer is one of the eleven", () => {
    expect(farm()).toHaveLength(24);
    const eleven = new Set(ELEVEN);
    for (const q of farm()) {
      for (const w of wrong(q)) expect([q.id, w, eleven.has(w)]).toEqual([q.id, w, true]);
    }
  });

  test("criterion 6: no wrong answer is in the state's own top_livestock", () => {
    for (const q of farm()) {
      const own = new Set(list(entityById.get(q.entityId), "top_livestock").map(norm));
      expect(own.size).toBeGreaterThan(0);
      for (const w of wrong(q)) expect([q.id, w, own.has(norm(w))]).toEqual([q.id, w, false]);
    }
  });

  test("criterion 7: no wrong answer is in the state's Table A row", () => {
    const seen = new Set<string>();
    for (const q of farm()) {
      const code = codeOf(q.entityId);
      seen.add(code);
      const row = TABLE_A[code];
      expect([code, row === undefined]).toEqual([code, false]);
      const banned = new Set((row ?? []).map(norm));
      for (const w of wrong(q)) expect([q.id, w, banned.has(norm(w))]).toEqual([q.id, w, false]);
    }
    // Every row of Table A is exercised by a question.
    expect([...seen].sort()).toEqual(Object.keys(TABLE_A).sort());
  });

  test("criterion 8: never cattle and dairy cows together, answer included", () => {
    for (const q of farm()) {
      const c = (q.choices ?? []).map(norm);
      expect([q.id, c.includes("cattle") && c.includes("dairy cows")]).toEqual([q.id, false]);
    }
  });

  const wrongFor = (code: string): Set<string> => {
    const q = farm().find((x) => x.entityId === `us-state-${code}`);
    if (q === undefined) throw new Error(`no farm-animal question for ${code}`);
    return new Set(wrong(q));
  };

  test("criterion 9: Pennsylvania's wrong answers are exactly {sheep, rabbits, bison}", () => {
    expect(wrongFor("pa")).toEqual(new Set(["sheep", "rabbits", "bison"]));
  });

  test("criterion 10: California's wrong answers are exactly {pigs, rabbits, bison}", () => {
    expect(wrongFor("ca")).toEqual(new Set(["pigs", "rabbits", "bison"]));
  });
});

// ---- Criteria 11-13: crops ----------------------------------------------------

describe("T-088 criteria 11-13: crops", () => {
  const crops = () => ofTemplate("tpl-crop-of");

  test("criterion 11: no wrong answer is in the state's Table B row", () => {
    expect(crops()).toHaveLength(50);
    const seen = new Set<string>();
    for (const q of crops()) {
      const code = codeOf(q.entityId);
      seen.add(code);
      const row = TABLE_B[code];
      expect([code, row === undefined]).toEqual([code, false]);
      const banned = new Set((row ?? []).map(norm));
      for (const w of wrong(q)) expect([q.id, w, banned.has(norm(w))]).toEqual([q.id, w, false]);
    }
    expect([...seen].sort()).toEqual(Object.keys(TABLE_B).sort());
  });

  test("criterion 12: T-026's own / bordering / same-region rule and the three pairs", () => {
    for (const q of crops()) {
      const own = entityById.get(q.entityId) as Entity;
      const borders = new Set(list(own, "borders"));
      const nearby = entities.filter(
        (e) => e.id === own.id || borders.has(e.id) || (own.region && e.region === own.region),
      );
      const banned = new Set(nearby.flatMap((e) => list(e, "top_crops")).map(norm));
      for (const w of wrong(q)) expect([q.id, w, banned.has(norm(w))]).toEqual([q.id, w, false]);
      const c = (q.choices ?? []).map(norm);
      for (const [a, b] of CROP_PAIRS) {
        expect([q.id, a, b, c.includes(a) && c.includes(b)]).toEqual([q.id, a, b, false]);
      }
    }
  });

  test("criterion 13: every wrong answer is in some other state's top_crops", () => {
    for (const q of crops()) {
      const others = new Set(
        entities.filter((e) => e.id !== q.entityId).flatMap((e) => list(e, "top_crops").map(norm)),
      );
      for (const w of wrong(q)) expect([q.id, w, others.has(norm(w))]).toEqual([q.id, w, true]);
    }
  });
});

// ---- Criteria 14-17: the rule lives in buildChoices -------------------------

/**
 * A synthetic bank: `subjectId` at the origin with its own answer, a donor
 * entity (no row: not a state id) right next to it holding only `item`, and
 * three far fillers. Every entity is in its own region with no borders, so
 * only a Table A / B row can keep `item` from being the subject's nearest
 * candidate.
 */
function synthetic(
  subjectId: string,
  field: "top_crops" | "top_livestock",
  item: string,
): Entity[] {
  const mk = (id: string, lon: number, values: string[], region: string): Entity =>
    ({
      id,
      type: "state",
      scope: "us",
      name: id,
      region,
      centroid: [lon, 0],
      borders: [],
      [field]: values,
    }) as unknown as Entity;
  return [
    mk(subjectId, 0, ["zz-subject-own"], "R-subject"),
    mk("donor", 0.01, [item], "R-donor"),
    mk("filler-1", 20, ["zz-filler-1"], "R-f1"),
    mk("filler-2", 21, ["zz-filler-2"], "R-f2"),
    mk("filler-3", 22, ["zz-filler-3"], "R-f3"),
  ];
}

function wrongOfSubject(input: Entity[], templateId: string, subjectId: string): string[] {
  const t = tpl(templateId);
  const out = buildChoices(generate(input, [t]).drafts, input, [t]);
  const q = out.questions.find((x) => x.entityId === subjectId);
  if (q === undefined) throw new Error(`no ${templateId} question for ${subjectId}`);
  return (q.choices as string[]).filter((_, i) => i !== q.correctIndex).map(norm);
}

const CASES = [
  { name: "Table A", table: TABLE_A, field: "top_livestock", templateId: "tpl-farm-animal-of" },
  { name: "Table B", table: TABLE_B, field: "top_crops", templateId: "tpl-crop-of" },
] as const;

describe("T-088 criterion 14: buildChoices applies Tables A and B to any input", () => {
  test("the lists in distractors.ts are Tables A and B, row for row", () => {
    const asSets = (t: Readonly<Record<string, readonly string[]>>) =>
      Object.fromEntries(
        Object.entries(t)
          .filter(([, v]) => v.length > 0)
          .map(([k, v]) => [k.toUpperCase(), [...v].map(norm).sort()]),
      );
    expect(asSets(ALSO_RAISED)).toEqual(asSets(TABLE_A));
    expect(asSets(ALSO_GROWN)).toEqual(asSets(TABLE_B));
  });

  for (const { name, table, field, templateId } of CASES) {
    const rowLess = Object.keys(table).find((k) => (table[k] ?? []).length === 0) as string;

    test(`${name}: every listed item, made the nearest candidate, is skipped for its state`, () => {
      let checked = 0;
      for (const [code, row] of Object.entries(table)) {
        for (const item of row) {
          const id = `us-state-${code.toLowerCase()}`;
          const w = wrongOfSubject(synthetic(id, field, item), templateId, id);
          expect([code, item, w.includes(item)]).toEqual([code, item, false]);
          checked += 1;
        }
      }
      expect(checked).toBe(Object.values(table).reduce((n, r) => n + r.length, 0));
    });

    test(`${name}: the same input offers the item to a state whose row does not list it`, () => {
      expect(rowLess).toBeDefined();
      for (const item of new Set(Object.values(table).flat())) {
        const id = `us-state-${rowLess.toLowerCase()}`;
        const w = wrongOfSubject(synthetic(id, field, item), templateId, id);
        expect([rowLess, item, w.includes(item)]).toEqual([rowLess, item, true]);
      }
    });
  }

  test("one input, two states: TX skips chickens, DE (row none) is offered it", () => {
    const input = synthetic("us-state-tx", "top_livestock", "chickens");
    input.push({ ...input[0], id: "us-state-de", centroid: [0, 0.001], region: "R-de" } as Entity);
    expect(wrongOfSubject(input, "tpl-farm-animal-of", "us-state-tx")).not.toContain("chickens");
    expect(wrongOfSubject(input, "tpl-farm-animal-of", "us-state-de")).toContain("chickens");
  });

  test("one input, two states: IA skips hay, HI (row none) is offered it", () => {
    const input = synthetic("us-state-ia", "top_crops", "hay");
    input.push({ ...input[0], id: "us-state-hi", centroid: [0, 0.001], region: "R-hi" } as Entity);
    expect(wrongOfSubject(input, "tpl-crop-of", "us-state-ia")).not.toContain("hay");
    expect(wrongOfSubject(input, "tpl-crop-of", "us-state-hi")).toContain("hay");
  });
});

describe("T-088 criterion 15: an id not of the form us-state-<two letters> gets no exclusion", () => {
  const NOT_STATE_IDS = (code: string) => [
    code,
    `us-county-${code}`,
    `state-${code}`,
    `us-state-${code}x`,
    `us-state-${code}-1`,
    `xus-state-${code}`,
  ];

  for (const { name, field, templateId } of CASES) {
    const [code, item] = name === "Table A" ? ["tx", "chickens"] : ["ia", "hay"];
    test(`${name}: ${item} (in ${code.toUpperCase()}'s row) is offered to look-alike ids`, () => {
      for (const id of NOT_STATE_IDS(code)) {
        const w = wrongOfSubject(synthetic(id, field, item), templateId, id);
        expect([id, w.includes(item)]).toEqual([id, true]);
      }
    });
  }
});

describe("T-088 criterion 16: the five added animals are never a correct answer", () => {
  test("no question in the file has one as its answer, or at correctIndex", () => {
    const added = new Set(ADDED);
    for (const q of questions()) {
      expect([q.id, added.has(norm(String(q.answer)))]).toEqual([q.id, false]);
      if (q.choices !== undefined) {
        const right = norm(q.choices[q.correctIndex as number] as string);
        expect([q.id, added.has(right)]).toEqual([q.id, false]);
      }
    }
  });

  test("they are offered only as wrong answers, and only in farm-animal questions", () => {
    const added = new Set(ADDED);
    let offered = 0;
    for (const q of questions()) {
      for (const w of wrong(q)) {
        if (!added.has(norm(w))) continue;
        offered += 1;
        expect([q.id, q.templateId]).toEqual([q.id, "tpl-farm-animal-of"]);
      }
    }
    expect(offered).toBeGreaterThan(0);
  });

  test("no entity field holds one, in any string or list value", () => {
    const added = new Set(ADDED);
    const walk = (v: unknown, where: string): void => {
      if (typeof v === "string") expect([where, v, added.has(norm(v))]).toEqual([where, v, false]);
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`));
      else if (v !== null && typeof v === "object") {
        for (const [k, x] of Object.entries(v)) walk(x, `${where}.${k}`);
      }
    };
    for (const e of entities) walk(e, e.id);
  });
});

describe("T-088 criterion 17: buildChoices is deterministic", () => {
  test("two calls on the committed bank give deep-equal output", () => {
    const { drafts } = generate(entities);
    expect(buildChoices(drafts, entities)).toEqual(buildChoices(drafts, entities));
  });

  test("two calls on a synthetic farm-animal bank that reaches the added animals", () => {
    const input = synthetic("us-state-pa", "top_livestock", "cattle");
    const t = tpl("tpl-farm-animal-of");
    const drafts = generate(input, [t]).drafts;
    const a = buildChoices(drafts, input, [t]);
    const b = buildChoices(drafts, input, [t]);
    expect(a).toEqual(b);
    expect(a.questions.length).toBeGreaterThan(0);
  });
});

// ---- Criterion 18: regeneration ---------------------------------------------

describe("T-088 criterion 18: the writer reproduces the committed question file", () => {
  test("renderQuestionFile(committed entities) is byte-identical to the file", () => {
    expect(renderQuestionFile(loadCommittedEntities())).toBe(questionFileText());
  });
});

// ---- Criteria 20-25: what must not change -----------------------------------

describe("T-088 criteria 20-25: what must not change", () => {
  test("criterion 20: question-bank/data/us-states/ is byte-identical to main's", () => {
    const dir = join(REPO_ROOT, "question-bank/data/us-states");
    const rows = readdirSync(dir)
      .sort()
      .map((f) => [f, sha(readFileSync(join(dir, f)))]);
    expect(sha(JSON.stringify(rows))).toBe(MAIN_ENTITY_DIR_SHA);
  });

  test("criterion 20: curated/us-states.ts is byte-identical to main's", () => {
    const f = "question-bank/src/curated/us-states.ts";
    expect(sha(readFileSync(join(REPO_ROOT, f)))).toBe(MAIN_FILE_SHA[f] as string);
  });

  test("criterion 21: openapi.yaml is byte-identical to main's", () => {
    expect(sha(readFileSync(join(REPO_ROOT, "openapi.yaml")))).toBe(
      MAIN_FILE_SHA["openapi.yaml"] as string,
    );
  });

  test("criterion 21: every tracked file under frontend/ is byte-identical to main's", () => {
    const rows = trackedFiles("frontend")
      .sort()
      .map((p) => [p, sha(readFileSync(join(REPO_ROOT, p)))]);
    expect(rows.length).toBeGreaterThan(0);
    expect(sha(JSON.stringify(rows))).toBe(MAIN_FRONTEND_SHA);
  });

  test("criterion 22: LEVEL_SEED_WEIGHTS is deep-equal to main's", () => {
    expect(sha(canon(LEVEL_SEED_WEIGHTS))).toBe(MAIN_LEVEL_SEED_WEIGHTS_SHA);
  });

  test("criterion 23: every package.json, bun.lock, pyproject.toml and uv.lock is main's", () => {
    const names = /(^|\/)(package\.json|bun\.lock|pyproject\.toml|uv\.lock)$/;
    const tracked = trackedFiles(".").filter((p) => names.test(p));
    expect(tracked.sort()).toEqual(Object.keys(MAIN_DEP_SHA).sort());
    for (const [f, digest] of Object.entries(MAIN_DEP_SHA)) {
      expect([f, sha(readFileSync(join(REPO_ROOT, f)))]).toEqual([f, digest]);
    }
  });

  test("criterion 24: the T-088 test files reach no network and spawn nothing but git ls-files", () => {
    const files = [
      "question-bank/src/agriculture-true-wrong-answers.test.ts",
      "question-bank/src/agriculture-true-wrong-answers-verify.test.ts",
    ];
    for (const f of files) {
      const src = readFileSync(join(REPO_ROOT, f), "utf8");
      for (const needle of ["fetch" + "(", "http" + "://", "https" + "://", "node:" + "http"]) {
        expect([f, needle, src.includes(needle)]).toEqual([f, needle, false]);
      }
      const spawns = src.match(/Bun\.spawn(?:Sync)?\(\s*\[[^\]]*\]/g) ?? [];
      for (const s of spawns) expect([f, s.includes('"git", "ls-files"')]).toEqual([f, true]);
    }
  });

  test("criterion 25: outside E-25, engineering-decisions.md is main's; still E-1..E-30", () => {
    const ed = readFileSync(join(REPO_ROOT, "engineering-decisions.md"), "utf8");
    const parts = ed.split(/^(?=## E-\d+ )/m);
    const heads = parts.slice(1).map((p) => Number((/^## E-(\d+) /.exec(p) as RegExpExecArray)[1]));
    expect(heads).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    const masked = parts.map((p, i) => (i > 0 && heads[i - 1] === 25 ? null : p));
    expect(sha(JSON.stringify(masked))).toBe(MAIN_ED_OUTSIDE_E25_SHA);
  });
});

// ---- Criteria 26-31: the record (E-25) --------------------------------------

describe("T-088 criteria 26-31: E-25's T-088 amendment", () => {
  const e25 = (): string => {
    const ed = readFileSync(join(REPO_ROOT, "engineering-decisions.md"), "utf8");
    const part = ed.split(/^(?=## E-\d+ )/m).find((p) => p.startsWith("## E-25 "));
    if (part === undefined) throw new Error("no E-25 section");
    return part;
  };
  const flat = (s: string): string => s.replace(/\s+/g, " ");
  /** The amendment: from the dated T-088 heading to the "Revisit when" paragraph. */
  const amendment = (): string => {
    const text = flat(e25());
    const start = text.search(/\*\*Amended \d{4}-\d{2}-\d{2} \(T-088\)/);
    expect(start).toBeGreaterThanOrEqual(0);
    const end = text.indexOf("**Revisit when**", start);
    return end < 0 ? text.slice(start) : text.slice(start, end);
  };

  test("criterion 26: dated, names T-088, the per-state lists, approval and the rule", () => {
    const a = amendment();
    for (const needle of ["T-088", "Dkaattae", "2026-10-27", "also grown / raised"]) {
      expect([needle, a.includes(needle)]).toEqual([needle, true]);
    }
    expect(a).toMatch(/crops/);
    expect(a).toMatch(/farm animals/);
    expect(a).toMatch(/each state/i);
    expect(a).toMatch(/top-10 national producer/);
    expect(a).toMatch(/widely known/);
  });

  test("criterion 27: drafted from general knowledge; not yet checked against USDA NASS", () => {
    const a = amendment();
    expect(a).toMatch(/general knowledge/);
    expect(a).toMatch(/not from a committed source/);
    expect(a).toMatch(/not yet checked against USDA NASS/);
  });

  test("criterion 28: the five animals, their approval, never correct, one ordering sentence", () => {
    const a = amendment();
    for (const animal of ADDED)
      expect([animal, a.includes(`\`${animal}\``)]).toEqual([animal, true]);
    expect(a).toMatch(/approved by Dkaattae on 2026-10-27 \(`ADDED_FARM_ANIMALS`\)/);
    expect(a).toMatch(/never a correct answer to any question/);
    const ordering = a
      .split(/(?<=\.)\s/)
      .filter(
        (s) => /\border\b/.test(s) && /state[- ]?list|states? lists?|some state lists/.test(s),
      );
    expect(ordering.length).toBeGreaterThanOrEqual(1);
  });

  test("criterion 29: cattle and dairy cows stay separate; the pairs rule still applies", () => {
    const a = amendment();
    expect(a).toMatch(/`cattle` and `dairy cows` stay separate/);
    expect(a).toMatch(/`AGRICULTURE_SAME_THING_PAIRS` rule still applies/);
  });

  test("criterion 30: the counts it states match the regenerated question file", () => {
    const farm = ofTemplate("tpl-farm-animal-of");
    const withAdded = farm.filter((q) => wrong(q).some((w) => ADDED.includes(norm(w)))).length;
    const a = amendment();
    expect(a).toMatch(new RegExp(`\\b${withAdded} of the 24 farm-animal questions`));
    for (const animal of ADDED) {
      const n = farm.filter((q) => wrong(q).map(norm).includes(animal)).length;
      expect([animal, new RegExp(`\`${animal}\` ${n}\\b`).test(a)]).toEqual([animal, true]);
    }
  });

  test("criterion 31: Revisit when no longer holds C3's risk open; names what reopens it", () => {
    const text = flat(e25());
    const start = text.lastIndexOf("**Revisit when**");
    expect(start).toBeGreaterThanOrEqual(0);
    const revisit = text.slice(start);
    expect(revisit).not.toMatch(/accepted risk/);
    expect(revisit).not.toMatch(/finds a "not grown nearby" wrong answer/);
    expect(revisit).toMatch(/narrowed by the T-088 lists/);
    expect(revisit).toMatch(/row is found wrong against USDA NASS/);
    expect(revisit).toMatch(/new crop or animal is added/);
  });
});
