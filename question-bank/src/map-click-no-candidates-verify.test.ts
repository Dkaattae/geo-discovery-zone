/**
 * T-092 tester: one `describe` per acceptance criterion of
 * `tasks/T-092-map-click-no-candidates.md`. Expected values come from the
 * criteria and from the default branch at `5d72ca5` (origin/main when this was
 * written). `distractors.ts`, `seed-level.ts` and `question-file.ts` were read
 * for entry points and signatures only.
 *
 * The default branch's values are embedded, because CI checks out shallow and
 * the T-081 guard forbids handing `git` a revision: sha256 digests of its
 * question file, `content.json`, E-1..E-28, manifests and trees, and, for the
 * synthetic banks below, the levels and `shortPools` its stages
 * (`buildQuestionBank` at `5d72ca5`, run from a `git worktree`) computed for the
 * same input, written out literally. The helpers here are the ones that script
 * used. The tree and manifest pins go red when a later task deliberately
 * changes one of those surfaces; that task's tester raises a test change
 * request.
 *
 * Pure: no network, no seam, nothing mocked, nothing written. The only I/O is
 * reading committed files and `git ls-files`.
 */
import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildChoices } from "./distractors";
import { generate } from "./generate";
import { buildQuestionBank, renderQuestionFile } from "./question-file";
import { seedLevels } from "./seed-level";
import { TEMPLATES } from "./templates";
import type { Entity } from "./types";
import { loadCommittedEntities, REPO_ROOT } from "./write-questions";

const REPO = REPO_ROOT;
const CLICK_PREFIX = "gen:tpl-click-the-map:";

// ---------------------------------------------------------------------------
// Helpers shared with the one-off script that computed the 5d72ca5 values.
function canon(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, (v as Record<string, unknown>)[k]]),
        )
      : v,
  );
}
const sha = (s: string | Buffer): string => createHash("sha256").update(s).digest("hex");
const CANDIDATE_KEYS = ["choices", "correctIndex", "choiceGeometryIds"] as const;
type Q = Record<string, unknown> & { id: string; format: string };
function omit(q: Q, keys: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(q).filter(([k]) => !keys.includes(k)));
}
function digestsOf(file: { count: number; questions: Q[] }) {
  const click = file.questions.filter((q) => q.format === "map_click");
  const other = file.questions.filter((q) => q.format !== "map_click");
  return {
    order: sha(canon(file.questions.map((q) => [q.id, q.format]))),
    // T-070 row W46: only `level` is left out; the candidate keys are no longer stripped (c3).
    clickFields: sha(canon(click.map((q) => omit(q, ["level"])))),
    clickLevels: sha(canon(click.map((q) => [q.id, q["level"]]))),
    other: sha(canon(other)),
  };
}
/** Each `## E-n` section's text, keyed by `E-n`. */
function decisionSections(doc: string): Map<string, string> {
  const parts = doc.split(/^(?=## E-\d+ )/m).slice(1);
  return new Map(parts.map((p) => [(p.match(/^## (E-\d+) /) as RegExpMatchArray)[1] as string, p]));
}
function tracked(root: string, path: string): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "--", path], { cwd: root });
  if (proc.exitCode !== 0) throw new Error(`git ls-files ${path} exited ${proc.exitCode}`);
  const paths = proc.stdout.toString().split("\n").filter(Boolean).sort();
  if (paths.length === 0) throw new Error(`nothing tracked under ${path}`);
  return paths;
}
function treeDigest(root: string, path: string, except: string[] = []): string {
  return sha(
    tracked(root, path)
      .filter((p) => !except.includes(p))
      .map((p) => `${p}\t${sha(readFileSync(join(root, p)))}\n`)
      .join(""),
  );
}

// ---------------------------------------------------------------------------
// Synthetic entity banks, invented here (not recordings): each is a case
// criteria 6, 7, 9 or 10 names. Shared verbatim with the 5d72ca5 script.
type E = {
  id: string;
  type: string;
  scope: string;
  name: string;
  capital?: string;
  geometry_id?: string | undefined;
  region?: string;
  centroid?: unknown;
  borders?: string[];
  population_rank?: number | null;
  area_rank?: number | null;
};
const st = (code: string, lon: number, lat: number, extra: Partial<E> = {}): E => ({
  id: `us-state-${code}`,
  type: "state",
  scope: "us",
  name: `State ${code.toUpperCase()}`,
  capital: `Capital ${code.toUpperCase()}`,
  geometry_id: `9${code.charCodeAt(0)}${code.charCodeAt(1)}`,
  region: `Region ${code}`,
  centroid: [lon, lat],
  ...extra,
});
/** Synthetic banks: every case criteria 9 and 10 name. */
const BANKS: Record<string, E[]> = {
  // aa's three nearest (bb, cc, dd) border it or share its region: near term non-zero.
  near: [
    st("aa", -100, 40, { region: "West", borders: ["us-state-bb"] }),
    st("bb", -99, 40),
    st("cc", -101, 40, { region: "West" }),
    st("dd", -100, 41, { region: "West" }),
    st("ee", -80, 30),
    st("ff", -79, 30),
  ],
  // Every state in its own region, no borders: near term zero for all.
  none: [
    st("aa", -100, 40),
    st("bb", -99, 40),
    st("cc", -101, 40),
    st("dd", -100, 41),
    st("ee", -80, 30),
  ],
  // Mixed: one of aa's three nearest borders it, a far one shares its region.
  mixed: [
    st("aa", -100, 40, { region: "Mid", borders: ["us-state-dd", "us-state-ee"] }),
    st("bb", -99.5, 40),
    st("cc", -100, 40.5),
    st("dd", -101, 40),
    st("ee", -70, 30, { region: "Mid", borders: ["us-state-aa"] }),
    st("ff", -71, 30, { region: "Mid" }),
  ],
  // aa has exactly two eligible peers; the rest fail one rule each.
  twoEligible: [
    st("aa", -100, 40),
    st("bb", -99, 40),
    st("cc", -101, 40),
    st("dd", -100, 41, { geometry_id: "   " }),
    st("ee", -100, 39, { geometry_id: undefined }),
    st("ff", -100, 42, { centroid: [Number.NaN, 40] }),
    st("gg", -100, 43, { centroid: undefined }),
    st("hh", -99, 41, { scope: "world" }),
    st("ii", -99, 39, { type: "country" }),
    st("jj", -101, 41, { name: "State BB" }),
  ],
  // As above with one more eligible peer: three eligible, so a question.
  threeEligible: [
    st("aa", -100, 40),
    st("bb", -99, 40),
    st("cc", -101, 40),
    st("kk", -105, 45, { region: "Region aa" }),
    st("dd", -100, 41, { geometry_id: "" }),
    st("ff", -100, 42, { centroid: [-100] }),
    st("hh", -99, 41, { scope: "world" }),
    st("ii", -99, 39, { type: "country" }),
  ],
  // States with no usable centroid, beside 0, 2 and 4 peers.
  noCentroidAlone: [st("aa", -100, 40, { centroid: undefined })],
  noCentroidTwo: [st("aa", 0, 0, { centroid: ["x", 40] }), st("bb", -99, 40), st("cc", -101, 40)],
  noCentroidMany: [
    st("aa", 0, 0, { centroid: [Number.POSITIVE_INFINITY, 40] }),
    st("bb", -99, 40, { borders: ["us-state-aa"] }),
    st("cc", -101, 40),
    st("dd", -100, 41),
    st("ee", -100, 39),
  ],
  // Ranks present, so the obscurity term varies between states too.
  ranked: [
    st("aa", -100, 40, { population_rank: 1, area_rank: 5, region: "R", borders: ["us-state-bb"] }),
    st("bb", -99, 40, { population_rank: 2, area_rank: 4, region: "R" }),
    st("cc", -101, 40, { population_rank: 3, area_rank: 3 }),
    st("dd", -100, 41, { population_rank: 4, area_rank: 2, region: "R" }),
    st("ee", -80, 30, { population_rank: 5, area_rank: 1 }),
  ],
};

interface Baseline {
  /** `level` of every map_click question, by id. */
  clickLevels: Record<string, number>;
  /** `shortPools` entries whose draft is a map_click draft. */
  clickShortPools: { draftId: string; found: number; reason: string }[];
  /** sha256 of `canon` of every non-map_click question, in output order. */
  others: string;
  /** sha256 of `canon` of every map_click question minus the three candidate keys. */
  clickRest: string;
}

// What 5d72ca5's `buildQuestionBank` produced for each bank above.
const AT_MAIN: Record<string, Baseline> = {
  near: {
    clickLevels: {
      "gen:tpl-click-the-map:us-state-aa": 7.5,
      "gen:tpl-click-the-map:us-state-bb": 6,
      "gen:tpl-click-the-map:us-state-cc": 7,
      "gen:tpl-click-the-map:us-state-dd": 7,
      "gen:tpl-click-the-map:us-state-ee": 6,
      "gen:tpl-click-the-map:us-state-ff": 6,
    },
    clickShortPools: [],
    others: "f0b9fa73a2e347e953963baf08754da42021bb573b34caf9fd7587aacb2c57d5",
    clickRest: "3a277e62ac9f79e51fc631064eb3259c21d8f97953fe4e5b1ab6771c95efc584",
  },
  none: {
    clickLevels: {
      "gen:tpl-click-the-map:us-state-aa": 6,
      "gen:tpl-click-the-map:us-state-bb": 6,
      "gen:tpl-click-the-map:us-state-cc": 6,
      "gen:tpl-click-the-map:us-state-dd": 6,
      "gen:tpl-click-the-map:us-state-ee": 6,
    },
    clickShortPools: [],
    others: "7b6ccee775626e9a1df1c038c93d903671819d1fa1c02ec7159ccd66b4ceca36",
    clickRest: "099f53b5bdb45593fcae36eb22b1f8644451b3271df8aa0b0a9e984817b05ceb",
  },
  mixed: {
    clickLevels: {
      "gen:tpl-click-the-map:us-state-aa": 7.5,
      "gen:tpl-click-the-map:us-state-bb": 6,
      "gen:tpl-click-the-map:us-state-cc": 6,
      "gen:tpl-click-the-map:us-state-dd": 6,
      "gen:tpl-click-the-map:us-state-ee": 7,
      "gen:tpl-click-the-map:us-state-ff": 7,
    },
    clickShortPools: [],
    others: "dfc10ea6f58d4f395c49c8feef2584feb5cee806a4a676ab472d31d47298b74f",
    clickRest: "775aa6b4fd62040f21a0ef164b7ae215ce9b3ccc96ea123548dbdcf54380a62f",
  },
  twoEligible: {
    clickLevels: {},
    clickShortPools: [
      {
        draftId: "gen:tpl-click-the-map:us-state-aa",
        found: 2,
        reason: "too_few_candidates",
      },
      {
        draftId: "gen:tpl-click-the-map:us-state-bb",
        found: 2,
        reason: "too_few_candidates",
      },
      {
        draftId: "gen:tpl-click-the-map:us-state-cc",
        found: 2,
        reason: "too_few_candidates",
      },
      {
        draftId: "gen:tpl-click-the-map:us-state-ff",
        found: 0,
        reason: "no_centroid",
      },
      {
        draftId: "gen:tpl-click-the-map:us-state-gg",
        found: 0,
        reason: "no_centroid",
      },
      {
        draftId: "gen:tpl-click-the-map:us-state-hh",
        found: 0,
        reason: "too_few_candidates",
      },
      {
        draftId: "gen:tpl-click-the-map:us-state-jj",
        found: 2,
        reason: "too_few_candidates",
      },
    ],
    others: "c2e0f57b54553cfff25bd601a64b6b919a66b8f7a1ec8e3706f0c4caf04da9eb",
    clickRest: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  },
  threeEligible: {
    clickLevels: {
      "gen:tpl-click-the-map:us-state-aa": 6.5,
      "gen:tpl-click-the-map:us-state-bb": 6,
      "gen:tpl-click-the-map:us-state-cc": 6,
      "gen:tpl-click-the-map:us-state-kk": 6.5,
    },
    clickShortPools: [
      {
        draftId: "gen:tpl-click-the-map:us-state-ff",
        found: 0,
        reason: "no_centroid",
      },
      {
        draftId: "gen:tpl-click-the-map:us-state-hh",
        found: 0,
        reason: "too_few_candidates",
      },
    ],
    others: "d66dab2f774487da90b988329fc8aa768174fdb50472977f96a049c36957156c",
    clickRest: "17c05312c01a8e8546aefb09e089b6405f62b9073c5700f917c4d396fec0964e",
  },
  noCentroidAlone: {
    clickLevels: {},
    clickShortPools: [
      {
        draftId: "gen:tpl-click-the-map:us-state-aa",
        found: 0,
        reason: "no_centroid",
      },
    ],
    others: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    clickRest: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  },
  noCentroidTwo: {
    clickLevels: {},
    clickShortPools: [
      {
        draftId: "gen:tpl-click-the-map:us-state-aa",
        found: 0,
        reason: "no_centroid",
      },
      {
        draftId: "gen:tpl-click-the-map:us-state-bb",
        found: 1,
        reason: "too_few_candidates",
      },
      {
        draftId: "gen:tpl-click-the-map:us-state-cc",
        found: 1,
        reason: "too_few_candidates",
      },
    ],
    others: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    clickRest: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  },
  noCentroidMany: {
    clickLevels: {
      "gen:tpl-click-the-map:us-state-bb": 6,
      "gen:tpl-click-the-map:us-state-cc": 6,
      "gen:tpl-click-the-map:us-state-dd": 6,
      "gen:tpl-click-the-map:us-state-ee": 6,
    },
    clickShortPools: [
      {
        draftId: "gen:tpl-click-the-map:us-state-aa",
        found: 0,
        reason: "no_centroid",
      },
    ],
    others: "11bde3329becda2348c114205f3fe74e9e347aac3d18720d555fae9f5ef54dd9",
    clickRest: "fba914f0676894b7434ffdf8353b37d4da9adeb91cb2324785ea92d401f00567",
  },
  ranked: {
    clickLevels: {
      "gen:tpl-click-the-map:us-state-aa": 4,
      "gen:tpl-click-the-map:us-state-bb": 4,
      "gen:tpl-click-the-map:us-state-cc": 3,
      "gen:tpl-click-the-map:us-state-dd": 4,
      "gen:tpl-click-the-map:us-state-ee": 3,
    },
    clickShortPools: [],
    others: "ce2b4e769b34a6db1a92102f2e2fba48e90535084e642235ab87bff9fe9e0007",
    clickRest: "cdac558f4fa17675d4d4674ac5550322e30fb2f3b1a2f893548835d18969a7d9",
  },
};

// ---------------------------------------------------------------------------
// Shared readers.

type Question = Record<string, unknown> & {
  id: string;
  format: string;
  entityId: string;
  answer?: string;
  level?: number;
  choices?: string[];
  correctIndex?: number;
};
interface QuestionFile {
  count: number;
  questions: Question[];
}
const QUESTION_PATH = join(REPO, "question-bank/data/questions/us-states.json");
const readFile = (): QuestionFile =>
  JSON.parse(readFileSync(QUESTION_PATH, "utf8")) as QuestionFile;
const isClick = (q: { format: string }) => q.format === "map_click";
const bankOf = (name: string) => BANKS[name] as unknown as Entity[];
const BANK_NAMES = Object.keys(BANKS);

/** Every place a synthetic bank's questions come out of the stages. */
function outputsFor(entities: Entity[]): [string, Question[]][] {
  const { drafts } = generate(entities, TEMPLATES);
  const { questions } = buildChoices(drafts, entities, TEMPLATES);
  const leveled = seedLevels(questions, entities, TEMPLATES);
  const bank = buildQuestionBank(entities).questions;
  const rendered = (JSON.parse(renderQuestionFile(entities)) as QuestionFile).questions;
  return [
    ["buildChoices", questions as unknown as Question[]],
    ["seedLevels", leveled as unknown as Question[]],
    ["buildQuestionBank", bank as unknown as Question[]],
    ["renderQuestionFile", rendered],
  ];
}

function baselineOf(entities: Entity[]): Baseline {
  const { questions, shortPools } = buildQuestionBank(entities);
  const qs = questions as unknown as Question[];
  return {
    clickLevels: Object.fromEntries(qs.filter(isClick).map((q) => [q.id, q.level as number])),
    clickShortPools: shortPools
      .filter((p) => p.draftId.startsWith(CLICK_PREFIX))
      .map(({ draftId, found, reason }) => ({ draftId, found, reason })),
    others: sha(canon(qs.filter((q) => !isClick(q)))),
    // T-070 row W47: no key is stripped before hashing.
    clickRest: sha(canon(qs.filter(isClick))),
  };
}

// 5d72ca5's question file, as digests (helpers above, `digestsOf`). `clickLevels`
// and `other` are re-pinned at 6a515e2 (re-pinned T-085a, Test change request
// rows 21 and 20), after T-085a moved the six HI/AK map and climate levels.
// `other` is re-pinned at 6587ed0 (re-pinned T-088, Test change request row 7),
// after T-088 regenerated 36 agriculture questions' choices.
const MAIN_FILE = {
  order: "5a5e2d5b8b1a15d0ce4bbb35f3414d57194e7ba09490aa06fc8853ff33c6f01e",
  clickFields: "8ddf07bc1dde01463daa3dc68fff106883fb88ea8653f86c6db8474ae625bfd9",
  clickLevels: "724c636c46013d9c380ca9fe8ebdcdb58c149f99fe5f2d3ec921502eded796ab",
  other: "c0c5072bc4a4f27fbf6bace1c302fff498a49f6f40574e7d3ae41e0500a7d601",
};
const CLICK_KEYS = [
  "id",
  "entityId",
  "templateId",
  "format",
  "prompt",
  "answer",
  "answerGeometryId",
  "scope",
  "entityType",
  "topic",
  "region",
  "ageBand",
  "level",
];

// ---------------------------------------------------------------------------

describe("T-092 criterion 1: no map_click question in the file carries candidates", () => {
  test("none of the 50 has a choices, correctIndex or choiceGeometryIds key, not even null or []", () => {
    const click = readFile().questions.filter(isClick);
    expect(click).toHaveLength(50);
    for (const q of click)
      for (const key of CANDIDATE_KEYS)
        expect([q.id, Object.hasOwn(q, key)]).toEqual([q.id, false]);
  });
});

describe("T-092 criterion 2: 50 map_click questions, same ids and positions as 5d72ca5", () => {
  test("ids and formats, in file order, hash to 5d72ca5's", () => {
    const file = readFile();
    expect(digestsOf(file).order).toBe(MAIN_FILE.order);
  });

  test("one map_click question per committed state", () => {
    const click = readFile().questions.filter(isClick);
    const states = loadCommittedEntities()
      .filter((e) => e.type === "state")
      .map((e) => e.id)
      .sort();
    expect(states).toHaveLength(50);
    expect(click.map((q) => q.entityId).sort()).toEqual(states);
  });
});

describe("T-092 criterion 3: every other map_click field as at 5d72ca5, no key added", () => {
  test("the twelve fields, in order, hash to 5d72ca5's", () => {
    expect(digestsOf(readFile()).clickFields).toBe(MAIN_FILE.clickFields);
  });

  test("a map_click question has exactly the twelve named keys plus level", () => {
    for (const q of readFile().questions.filter(isClick)) {
      expect([q.id, Object.keys(q).sort()]).toEqual([q.id, [...CLICK_KEYS].sort()]);
    }
  });
});

describe("T-092 criterion 4: the 365 other questions deep-equal 5d72ca5's, count 415", () => {
  test("every non-map_click question, level included, hashes to 6587ed0's (re-pinned T-088, row 7)", () => {
    const file = readFile();
    expect(file.questions.filter((q) => !isClick(q))).toHaveLength(365);
    expect(digestsOf(file).other).toBe(MAIN_FILE.other);
  });

  test("count and total are 415", () => {
    const file = readFile();
    expect(file.count).toBe(415);
    expect(file.questions).toHaveLength(415);
  });
});

describe("T-092 criterion 5: the committed file is what write-questions writes", () => {
  test("renderQuestionFile over the committed entity bank is byte-identical to the file", () => {
    expect(renderQuestionFile(loadCommittedEntities())).toBe(readFileSync(QUESTION_PATH, "utf8"));
  });
});

describe("T-092 criterion 6: no stage hands a map_click question candidates, any bank", () => {
  test.each(BANK_NAMES)(
    "bank %s: every stage's map_click questions lack all three keys",
    (name) => {
      for (const [stage, qs] of outputsFor(bankOf(name))) {
        for (const q of qs.filter(isClick)) {
          for (const key of CANDIDATE_KEYS)
            expect([stage, q.id, key, Object.hasOwn(q, key)]).toEqual([stage, q.id, key, false]);
        }
      }
    },
  );

  test("the banks do produce map_click questions, and so does the committed bank", () => {
    const made = BANK_NAMES.flatMap((n) => buildQuestionBank(bankOf(n)).questions).filter(isClick);
    expect(made.length).toBeGreaterThanOrEqual(20);
    const committed = buildQuestionBank(loadCommittedEntities()).questions.filter(isClick);
    expect(committed).toHaveLength(50);
    for (const q of committed)
      for (const key of CANDIDATE_KEYS) expect(Object.hasOwn(q, key)).toBe(false);
  });
});

describe("T-092 criterion 7: other formats keep four choices and a correctIndex", () => {
  test.each(BANK_NAMES)(
    "bank %s: multiple_choice and map_identify carry 4 choices, choices[correctIndex] === answer, no choiceGeometryIds",
    (name) => {
      for (const [stage, qs] of outputsFor(bankOf(name))) {
        for (const q of qs.filter((x) => !isClick(x))) {
          expect([stage, q.id, q.choices?.length]).toEqual([stage, q.id, 4]);
          expect(Number.isInteger(q.correctIndex)).toBe(true);
          expect((q.choices as string[])[q.correctIndex as number]).toBe(q.answer as string);
          expect([stage, q.id, Object.hasOwn(q, "choiceGeometryIds")]).toEqual([
            stage,
            q.id,
            false,
          ]);
        }
      }
    },
  );

  test("both formats appear among the synthetic banks' questions", () => {
    const formats = new Set(
      BANK_NAMES.flatMap((n) => buildQuestionBank(bankOf(n)).questions.map((q) => q.format)),
    );
    expect(formats.has("multiple_choice")).toBe(true);
    expect(formats.has("map_identify")).toBe(true);
  });

  test.each(BANK_NAMES)("bank %s: the non-map_click questions are exactly 5d72ca5's", (name) => {
    expect(baselineOf(bankOf(name)).others).toBe((AT_MAIN[name] as Baseline).others);
  });
});

describe("T-092 criterion 8: committed map_click levels equal 5d72ca5's", () => {
  test("(id, level) of the 50, in order, hash to 6a515e2's (re-pinned T-085a, row 21)", () => {
    const click = readFile().questions.filter(isClick);
    for (const q of click) expect(typeof q.level).toBe("number");
    expect(digestsOf(readFile()).clickLevels).toBe(MAIN_FILE.clickLevels);
  });
});

describe("T-092 criterion 9: synthetic map_click levels equal what 5d72ca5's stages compute", () => {
  test.each(BANK_NAMES)(
    "bank %s: every map_click level, and its other fields, as at 5d72ca5",
    (name) => {
      const want = AT_MAIN[name] as Baseline;
      const got = baselineOf(bankOf(name));
      expect(got.clickLevels).toEqual(want.clickLevels);
      expect(got.clickRest).toBe(want.clickRest);
    },
  );

  test("the stage-by-stage path gives the same levels as buildQuestionBank", () => {
    for (const name of BANK_NAMES) {
      const entities = bankOf(name);
      const { drafts } = generate(entities, TEMPLATES);
      const { questions } = buildChoices(drafts, entities, TEMPLATES);
      const levels = Object.fromEntries(
        seedLevels(questions, entities, TEMPLATES)
          .filter(isClick)
          .map((q) => [q.id, q.level]),
      );
      expect([name, levels]).toEqual([name, (AT_MAIN[name] as Baseline).clickLevels]);
    }
  });

  test("the banks cover a non-zero near-distractor term and a zero one", () => {
    // Same entity, same ranks (none): `near`'s aa has three near peers, `none`'s none.
    const near = baselineOf(bankOf("near")).clickLevels[`${CLICK_PREFIX}us-state-aa`] as number;
    const none = baselineOf(bankOf("none")).clickLevels[`${CLICK_PREFIX}us-state-aa`] as number;
    expect(near).toBe(7.5);
    expect(none).toBe(6);
    expect(near - none).toBe(1.5);
  });
});

describe("T-092 criterion 10: map_click shortPools entries as at 5d72ca5", () => {
  test.each(BANK_NAMES)("bank %s: draftId, found and reason as 5d72ca5 reports", (name) => {
    expect(baselineOf(bankOf(name)).clickShortPools).toEqual(
      (AT_MAIN[name] as Baseline).clickShortPools,
    );
  });

  const aa = `${CLICK_PREFIX}us-state-aa`;
  const clickIds = (name: string) =>
    buildQuestionBank(bankOf(name))
      .questions.filter(isClick)
      .map((q) => q.id);
  const poolOf = (name: string) =>
    buildQuestionBank(bankOf(name)).shortPools.filter((p) => p.draftId === aa);

  test("own centroid usable, two eligible peers: found 2, too_few_candidates, no question", () => {
    expect(
      poolOf("twoEligible").map(({ draftId, found, reason }) => ({ draftId, found, reason })),
    ).toEqual([{ draftId: aa, found: 2, reason: "too_few_candidates" }]);
    expect(clickIds("twoEligible")).not.toContain(aa);
  });

  test("own centroid usable, three eligible peers: a question, no shortPools entry", () => {
    expect(poolOf("threeEligible")).toEqual([]);
    expect(clickIds("threeEligible")).toContain(aa);
  });

  test.each(["noCentroidAlone", "noCentroidTwo", "noCentroidMany"])(
    "%s: no usable centroid gives no_centroid and no question",
    (name) => {
      expect(poolOf(name).map((p) => p.reason)).toEqual(["no_centroid"]);
      expect(clickIds(name)).not.toContain(aa);
    },
  );
});

describe("T-092 criteria 11 and 12: content.json does not move", () => {
  // Criterion 11's regeneration is the backend drift guard
  // (backend/tests/test_content_build.py); this pins criterion 12.
  // Re-pinned at 6a515e2 (re-pinned T-085a, Test change request row 22).
  // Re-pinned at 6587ed0 (re-pinned T-088, Test change request row 8).
  test("backend/app/data/content.json is byte-identical to 6587ed0's", () => {
    expect(sha(readFileSync(join(REPO, "backend/app/data/content.json")))).toBe(
      "103e22e5a51b0e98145b423ca0cda5c1967b1d52a8b86d39853eb66862a33e58",
    );
  });
});

describe("T-092 criterion 13: E-29 records the change; E-1..E-28 untouched", () => {
  const doc = readFileSync(join(REPO, "engineering-decisions.md"), "utf8");
  const sections = decisionSections(doc);

  // T-070 row W45: E-30 makes 30 headings at the branch head. The E-1..E-28
  // digest is re-pinned at 6a515e2 (re-pinned T-085a, Test change request row 23),
  // after T-085a amended E-22. Re-pinned at 6587ed0 (re-pinned T-088, Test change
  // request row 16), after T-088 amended E-25. Re-pinned at 49444c8 (re-pinned
  // T-096, Test change request row 2), after T-096 amended E-22. Re-pinned at
  // 4818fc8 (re-pinned T-091, Test change request row 3), after T-091 amended
  // E-25 and E-27.
  test("E-1..E-28 are byte-identical to 4818fc8's, and there are 30 E-n headings at the branch head", () => {
    const text = Array.from({ length: 28 }, (_, i) => sections.get(`E-${i + 1}`)).join("");
    expect(sha(text)).toBe("82f931806649319e7a4995f9260051b340d4c5393472dee333f25f0c3e0a9d22");
    expect(sections.size).toBe(30);
    expect(doc.match(/^## E-\d+/gm)).toHaveLength(30);
  });

  test("E-29 has a dated paragraph naming T-092 that says what changed and why levels did not", () => {
    const paragraphs = (sections.get("E-29") as string).split(/\n\s*\n/);
    const para = paragraphs.find((p) => /T-092/.test(p) && /\b20\d\d-\d\d-\d\d\b/.test(p));
    expect(para).toBeDefined();
    const flat = (para as string).replace(/\s+/g, " ");
    expect(flat).toMatch(/no longer writes candidates for `map_click`/);
    expect(flat).toMatch(/near distractors/);
    expect(flat).toMatch(/three nearest peers/);
    expect(flat).toMatch(/internally/);
    expect(flat).toMatch(/never written|not written/);
    expect(flat).toMatch(/level/);
    expect(flat).toMatch(/did not move|unchanged/);
    expect(flat).toMatch(/Q1/);
    expect(flat).toMatch(/"a"|\(a\)/);
  });
});

describe("T-092 criterion 14: no comment still says the file holds map_click candidates", () => {
  const qbSources = tracked(REPO, "question-bank/src").filter(
    (p) => p.endsWith(".ts") && !p.endsWith(".test.ts"),
  );

  test("no non-test question-bank/src file names choiceGeometryIds", () => {
    expect(qbSources.length).toBeGreaterThan(5);
    const naming = qbSources.filter((p) =>
      readFileSync(join(REPO, p), "utf8").includes("choiceGeometryIds"),
    );
    expect(naming).toEqual([]);
  });

  test("the four comments the brief names no longer say it", () => {
    const distractors = readFileSync(join(REPO, "question-bank/src/distractors.ts"), "utf8");
    expect(distractors).not.toMatch(/carries `choiceGeometryIds`, parallel to `choices`/);
    const questionFile = readFileSync(join(REPO, "question-bank/src/question-file.ts"), "utf8");
    expect(questionFile).not.toMatch(/`choiceGeometryIds` too/);
    const build = readFileSync(join(REPO, "backend/app/content_build.py"), "utf8");
    expect(build).not.toMatch(/question file still holds/i);
    expect(build).not.toMatch(/four candidates/);
    expect(build).not.toContain("choiceGeometryIds");
  });
});

describe("T-092 criterion 15: no new dependency, no manifest or lockfile change", () => {
  test("every package.json, pyproject.toml and lockfile is byte-identical to 5d72ca5's, none added", () => {
    const MANIFESTS = [
      "question-bank/package.json",
      "question-bank/bun.lock",
      "frontend/package.json",
      "frontend/bun.lock",
      "e2e/package.json",
      "e2e/bun.lock",
      "backend/pyproject.toml",
      "backend/uv.lock",
    ];
    const all = tracked(REPO, ".").filter((p) =>
      /(^|\/)(package\.json|pyproject\.toml|bun\.lock|uv\.lock|package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(
        p,
      ),
    );
    expect(all.sort()).toEqual([...MANIFESTS].sort());
    // re-pinned by T-087 row 4: questions script added (its criteria 1-2). Only
    // question-bank/package.json moved, to 8e27687560ccc8a0a08751dee8d7c7b578a81e575bbea02e8f09d9a5fafdd3a3.
    expect(sha(MANIFESTS.map((p) => `${p}\t${sha(readFileSync(join(REPO, p)))}\n`).join(""))).toBe(
      "0ce355ae18e0091ec6745e44261b60ba0a136d63354e06b765fdb3fe32de5c99",
    );
  });
});

describe("T-092 criterion 16: no other surface changes", () => {
  test.each([
    ["frontend", [], "67777de7b9ecb67e73d957a60d76126e1dae7e906b4d8281783fb7b7c11bc720"],
    ["e2e", [], "ee820bf3f3f4a5fafeb6863c0fdb02506d29d5b5233e00bc2e247f45465be3eb"],
    ["backend/migrations", [], "de664c4e8f50a93fe186f4795efdf872fdd3eac9642c7f728975e48a80c132cd"],
    ["openapi.yaml", [], "35831a81e0e9a3abc5f8e1e6bf4e02514adb63a27c64e2d8455e5b1e8514d6e6"],
  ] as const)("%s (except %p) is byte-identical to 5d72ca5", (path, except, digest) => {
    expect(treeDigest(REPO, path, [...except])).toBe(digest);
  });

  // Re-pinned at 6a515e2 (re-pinned T-085a, Test change request row 24), after
  // T-085a regenerated content.json. Re-pinned at 6587ed0 (re-pinned T-088, Test
  // change request row 9), after T-088 regenerated content.json. Same exception
  // list; split out of the table above so only this row's name moves.
  test('backend/app (except [ "backend/app/content_build.py" ]) is byte-identical to 6587ed0', () => {
    expect(treeDigest(REPO, "backend/app", ["backend/app/content_build.py"])).toBe(
      "291b1e49a35674790bdf91c287adfd07f5b596a88116ada1b0370de1204f11de",
    );
  });
});

describe("T-092 criterion 17: no network, no child-facing text changed", () => {
  test("neither T-092 test file names a URL, fetch, a transport or a spawn other than git", () => {
    for (const name of [
      "map-click-no-candidates.test.ts",
      "map-click-no-candidates-verify.test.ts",
    ]) {
      const body = readFileSync(join(REPO, "question-bank/src", name), "utf8")
        .split("\n")
        .filter((l) => !l.includes("this line is the check itself"))
        .join("\n");
      expect(body).not.toMatch(/https?:\/\//); // this line is the check itself
      expect(body).not.toMatch(/\bfetch\(|Transport\b|EntitySink/); // this line is the check itself
      for (const m of body.matchAll(/spawnSync\(\[\s*"([^"]+)"/g)) expect(m[1]).toBe("git");
    }
  });

  // Re-pinned at 6587ed0 (re-pinned T-088, Test change request row 10), after
  // T-088 changed 36 agriculture questions' choices.
  test("every prompt, choices entry and funFact in content.json is as at 6587ed0", () => {
    const out: unknown[] = [];
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) for (const n of node) walk(n);
      else if (node !== null && typeof node === "object")
        for (const [k, v] of Object.entries(node)) {
          if (k === "prompt" || k === "choices" || k === "funFact") out.push([k, v]);
          else walk(v);
        }
    };
    walk(JSON.parse(readFileSync(join(REPO, "backend/app/data/content.json"), "utf8")));
    expect(out).toHaveLength(830);
    expect(sha(canon(out))).toBe(
      "1d347f318e923db43f380e95534bca92ac4d48d00203a34d3d29b4f9181f847c",
    );
  });
});
