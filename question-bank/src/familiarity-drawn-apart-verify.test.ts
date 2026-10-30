/**
 * T-085a tester: the drawn-apart familiarity input (Hawaii and Alaska lowered
 * by 2 on the two map templates and the climate template).
 *
 * Expected values come from the brief's acceptance criteria and its "before"
 * table, read off `5ae564a` (origin/main, the branch's merge base). CI checks
 * out shallow and cannot `git show` that commit, so the before state is held
 * here as sha256 digests, each recorded at `5ae564a` (E-30: a pin names the
 * commit it was recorded at). Pure: the committed bank read from disk, plus
 * synthetic entities. No network.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChoices } from "./distractors";
import { generate } from "./generate";
import { buildQuestionBank, renderQuestionFile } from "./question-file";
import * as seedLevelModule from "./seed-level";
import { LEVEL_MAX, LEVEL_MIN, LEVEL_SEED_WEIGHTS, seedLevels } from "./seed-level";
import { TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";
import { loadCommittedEntities, REPO_ROOT } from "./write-questions";

const sha = (s: string): string => createHash("sha256").update(s).digest("hex");
const read = (rel: string): string => readFileSync(join(REPO_ROOT, rel), "utf8");

// ---- Before state, recorded at 5ae564a --------------------------------------

/** sha256 of JSON.stringify([[id, level], ...]) over the 415 questions, in file order, at 5ae564a. Same for content.json. */
const BEFORE_LEVELS_SHA = "fb8c50247d9b25338dbd90566d65575666087cc2d5a209226c6904976c037bd9";
/** sha256 of the question file's questions with `level` removed, re-pinned at 6587ed0 (T-088 TCR row 12, E-30). */
const BEFORE_Q_NO_LEVEL_SHA = "47f2b645de2c500182d0aff53e38766a3b2db87d2d1b984459cb86d0b84dfac9";
/** sha256 of the question file's `_source`, at 5ae564a. */
const BEFORE_Q_SOURCE_SHA = "ba95a246d73bbbdfe6f5d2a15f98895973c8f33c5cbfb87489287effa0e3378d";
/** sha256 of content.json's questions with `level` removed, re-pinned at 6587ed0 (T-088 TCR row 13, E-30). */
const BEFORE_C_NO_LEVEL_SHA = "3d5e3f3c440a47e767a6b78fb0a573de7b30b8f4228111bdeb117f26dff834b2";
/** sha256 of JSON.stringify({...content, questions: null}), at 5ae564a. */
const BEFORE_C_REST_SHA = "f3bdb765bc79a6641354a39fc4a992df264a49271bd173b5b10fe44ec14869e6";
/** sha256 of [[file, json-without-sources.built_at], ...] over data/us-states/, sorted, at 5ae564a. */
const BEFORE_ENTITIES_SHA = "431b7fa2c5d1e013523d7fb3c8e6c7d7b433d2d1b7345ca9c6eccb14c2476822";
/** sha256 of engineering-decisions.md before "## E-22 " + NUL + from "## E-23 " on, re-pinned at 6587ed0 (T-088 TCR row 17, E-30), re-pinned at 4818fc8 (T-091 TCR row 6, E-30). */
const BEFORE_ED_OUTSIDE_E22_SHA =
  "572149631f0e348469449657e89234e941bb16464d4dc7d2f1c6278596ee827c";
/** sha256 of the T-025 hand-check table's "| " lines (header + 30 rows), at 5ae564a. */
const BEFORE_T025_TABLE_SHA = "7d04c99ce29c19b29c812b90866f12bac25ffd38b55e38ba90716c26e7401636";
/** sha256 of each file whole, at 5ae564a. */
const BEFORE_FILE_SHA: Record<string, string> = {
  "openapi.yaml": "cddf482a77ecdde887ac0568c44190714825bef6ef9f874b0a195c2200f4d216",
  "backend/pyproject.toml": "a7741b6f8be54ee317fc9caf308debff1959b93b00f28efc6e7e760468813724",
  "backend/uv.lock": "88a95ecef4a5cdcc199de0722c241f754b654d764073562d886b9c440cd1edd8",
  "e2e/bun.lock": "518a40b596a5bc9c4bc1b10ea8dbfbf32342539c08622fde3cef22e546a7574d",
  "e2e/package.json": "2a77756f4acec47ffbf4488ffd00e62a56da3c39cb89466e4f7b3f7fb49a5921",
  "frontend/bun.lock": "5ec60daccc0422c6a67e520b46e372be8a16b04bf2a37b3170f087ef69afc733",
  "frontend/package.json": "22870bb992a6e2db8770998ce5cb0b095ce785fcc16801f6bf9deb25e33e332f",
  "question-bank/bun.lock": "6bb53377c455e7936275e795c81aa62b41fcb239017b4dd9a744dfd38bda34d1",
  "question-bank/package.json": "5286f4f725a98f5e54d45cf2646be5b38152ffc87ba5ac91039b919c49ec3f72",
};

/** The brief's before table: every HI and AK question at 5ae564a. */
const BEFORE_HI_AK: Record<string, number> = {
  "gen:tpl-identify-on-map:us-state-hi": 6.5,
  "gen:tpl-identify-on-map:us-state-ak": 6,
  "gen:tpl-click-the-map:us-state-hi": 7.5,
  "gen:tpl-click-the-map:us-state-ak": 7,
  "gen:tpl-climate-of:us-state-hi": 9.5,
  "gen:tpl-climate-of:us-state-ak": 8,
  "gen:tpl-capital-of:us-state-hi": 8.5,
  "gen:tpl-capital-of:us-state-ak": 8,
  "gen:tpl-biggest-state:us-state-hi": 8.5,
  "gen:tpl-biggest-state:us-state-ak": 7,
  "gen:tpl-state-animal-of:us-state-hi": 8.5,
  "gen:tpl-state-animal-of:us-state-ak": 8,
  "gen:tpl-landmark-in:us-state-hi": 8.5,
  "gen:tpl-landmark-in:us-state-ak": 8,
  "gen:tpl-crop-of:us-state-hi": 8.5,
  "gen:tpl-crop-of:us-state-ak": 7,
};

/** Criterion 1: the six, and their after levels. */
const SIX_AFTER: Record<string, number> = {
  "gen:tpl-identify-on-map:us-state-hi": 4.5,
  "gen:tpl-click-the-map:us-state-hi": 5.5,
  "gen:tpl-climate-of:us-state-hi": 7.5,
  "gen:tpl-identify-on-map:us-state-ak": 4,
  "gen:tpl-click-the-map:us-state-ak": 5,
  "gen:tpl-climate-of:us-state-ak": 6,
};
const SIX = Object.keys(SIX_AFTER);
const OTHER_FIVE = [
  "tpl-capital-of",
  "tpl-biggest-state",
  "tpl-state-animal-of",
  "tpl-landmark-in",
  "tpl-crop-of",
];

// ---- Helpers -----------------------------------------------------------------

interface Q {
  id: string;
  entityId: string;
  templateId: string;
  level: number;
  [k: string]: unknown;
}

const entities = loadCommittedEntities();
const bank = (): Q[] => buildQuestionBank(entities).questions as unknown as Q[];
const levelsSha = (qs: Q[]): string => sha(JSON.stringify(qs.map((q) => [q.id, q.level])));
const withoutLevel = (qs: Q[]): unknown[] => qs.map(({ level: _l, ...rest }) => rest);
const byId = (qs: Q[]): Map<string, Q> => new Map(qs.map((q) => [q.id, q]));

const questionFile = (): { _source: unknown; count: number; questions: Q[] } =>
  JSON.parse(read("question-bank/data/questions/us-states.json"));
const contentFile = (): { questions: Q[]; [k: string]: unknown } =>
  JSON.parse(read("backend/app/data/content.json"));

/** The bank with the drawn-apart amount overridden in place (as T-025 did), then restored. Tests that use amount 0 as "before" check it against BEFORE_LEVELS_SHA. */
function bankUnderAmount(amount: number): Q[] {
  const saved = LEVEL_SEED_WEIGHTS.familiarity_bonus;
  try {
    (LEVEL_SEED_WEIGHTS as { familiarity_bonus: number }).familiarity_bonus = amount;
    return bank();
  } finally {
    (LEVEL_SEED_WEIGHTS as { familiarity_bonus: number }).familiarity_bonus = saved;
  }
}

const ORIGINAL = {
  familiarity_bonus: LEVEL_SEED_WEIGHTS.familiarity_bonus,
  familiarity_bonus_states: LEVEL_SEED_WEIGHTS.familiarity_bonus_states,
  familiarity_bonus_templates: LEVEL_SEED_WEIGHTS.familiarity_bonus_templates,
};
afterEach(() => {
  Object.assign(LEVEL_SEED_WEIGHTS, ORIGINAL);
});

// ---- Synthetic input ---------------------------------------------------------

const realTemplate = (id: string): Template => {
  const t = TEMPLATES.find((x) => x.id === id);
  if (t === undefined) throw new Error(`no template ${id}`);
  return t;
};

/** `ownId` plus three peers, every rank 1, each in its own region with no borders: obscurity 0, tightness 0. */
function synthEntities(ownId: string): Entity[] {
  return [ownId, "syn-b", "syn-c", "syn-d"].map((id, i) => ({
    id,
    type: "state",
    scope: "us",
    name: `Synth ${i}`,
    capital: `Synth City ${i}`,
    geometry_id: `9${i}`,
    region: `Region ${i}`,
    centroid: [i * 40, i * 10] as [number, number],
    population_rank: 1,
    area_rank: 1,
    climate_kid: `climate phrase number ${i}`,
    state_animal: `animal ${i}`,
    landmark: `landmark ${i}`,
    top_crops: [`crop ${i}`],
    borders: [],
  })) as unknown as Entity[];
}

/** The level `seedLevels` gives `ownId`'s question on `template`. */
function synthLevel(ownId: string, template: Template): number {
  const es = synthEntities(ownId);
  const { drafts } = generate(es, [template]);
  const { questions } = buildChoices(drafts, es, [template]);
  const q = seedLevels(questions, es, [template]).find((x) => x.entityId === ownId);
  if (q === undefined) throw new Error(`no ${template.id} question for ${ownId}`);
  return q.level;
}

// ---- Tests -------------------------------------------------------------------

describe("T-085a criteria 1-3: drawn apart from the mainland, over the bank", () => {
  test("criterion 1: the six HI/AK map and climate questions are exactly 2 below before", () => {
    const got = byId(bank());
    for (const id of SIX) {
      const q = got.get(id);
      expect({ id, level: q?.level }).toEqual({ id, level: SIX_AFTER[id] });
      expect({ id, drop: (BEFORE_HI_AK[id] as number) - (q?.level as number) }).toEqual({
        id,
        drop: 2,
      });
    }
  });

  test("criterion 2: every HI/AK question on the other five templates keeps its before level", () => {
    const got = byId(bank());
    let n = 0;
    for (const t of OTHER_FIVE)
      for (const s of ["us-state-hi", "us-state-ak"]) {
        const id = `gen:${t}:${s}`;
        expect({ id, level: got.get(id)?.level }).toEqual({ id, level: BEFORE_HI_AK[id] });
        n++;
      }
    expect(n).toBe(10);
    expect(got.get("gen:tpl-capital-of:us-state-hi")?.level).toBe(8.5);
    expect(got.get("gen:tpl-capital-of:us-state-ak")?.level).toBe(8);
  });

  test("criterion 2: HI and AK have no question on any template outside the eight the table names", () => {
    const ids = bank()
      .filter((q) => q.entityId === "us-state-hi" || q.entityId === "us-state-ak")
      .map((q) => q.id)
      .sort();
    expect(ids).toEqual(Object.keys(BEFORE_HI_AK).sort());
  });

  test("criterion 3: no question about the other 48 states differs from its level under amount 0 (which is the before bank)", () => {
    const zero = bankUnderAmount(0);
    expect(levelsSha(zero)).toBe(BEFORE_LEVELS_SHA);
    const before = byId(zero);
    const others = bank().filter(
      (q) => q.entityId !== "us-state-hi" && q.entityId !== "us-state-ak",
    );
    expect(new Set(others.map((q) => q.entityId)).size).toBe(48);
    const moved = others.filter((q) => before.get(q.id)?.level !== q.level).map((q) => q.id);
    expect(moved).toEqual([]);
  });
});

describe("T-085a criterion 4: the reduction follows the entity, not the bank", () => {
  test("tpl-identify-on-map: us-state-hi is exactly 2 below an otherwise identical entity with another id", () => {
    const t = { ...realTemplate("tpl-identify-on-map"), base_difficulty: 6 };
    const other = synthLevel("syn-a", t);
    const hi = synthLevel("us-state-hi", t);
    expect(other).toBe(6);
    expect(hi).toBe(4);
  });

  test("us-state-ak on the same synthetic input is also exactly 2 below", () => {
    const t = { ...realTemplate("tpl-identify-on-map"), base_difficulty: 6 };
    expect(synthLevel("syn-a", t) - synthLevel("us-state-ak", t)).toBe(2);
  });

  test("a template outside the three gives no reduction to us-state-hi or us-state-ak", () => {
    for (const id of ["tpl-capital-of", "tpl-landmark-in", "tpl-crop-of"]) {
      const t = { ...realTemplate(id), base_difficulty: 6 };
      const other = synthLevel("syn-a", t);
      for (const s of ["us-state-hi", "us-state-ak"])
        expect({ id, s, level: synthLevel(s, t) }).toEqual({ id, s, level: other });
    }
  });

  test("an entity whose name or geometry is Hawaii's but whose id is not gets no reduction", () => {
    const t = { ...realTemplate("tpl-identify-on-map"), base_difficulty: 6 };
    const es = synthEntities("syn-a").map((e, i) =>
      i === 0 ? ({ ...e, name: "Hawaii", geometry_id: "15", capital: "Honolulu" } as Entity) : e,
    );
    const { questions } = buildChoices(generate(es, [t]).drafts, es, [t]);
    const q = seedLevels(questions, es, [t]).find((x) => x.entityId === "syn-a");
    expect(q?.level).toBe(6);
  });
});

describe("T-085a criteria 5-6: the largest-city half is not landed", () => {
  test("criterion 5: all 50 tpl-capital-of questions equal their level under amount 0 (the before bank)", () => {
    const zero = bankUnderAmount(0);
    expect(levelsSha(zero)).toBe(BEFORE_LEVELS_SHA);
    const before = byId(zero);
    const caps = bank().filter((q) => q.templateId === "tpl-capital-of");
    expect(caps.length).toBe(50);
    expect(caps.filter((q) => before.get(q.id)?.level !== q.level).map((q) => q.id)).toEqual([]);
  });

  test("criterion 6: LEVEL_SEED_WEIGHTS names no state but HI and AK, and no capital or city", () => {
    const strings: string[] = [];
    const walk = (v: unknown): void => {
      if (typeof v === "string") strings.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v !== null && typeof v === "object")
        for (const [k, x] of Object.entries(v)) {
          strings.push(k);
          walk(x);
        }
    };
    walk(LEVEL_SEED_WEIGHTS);
    const text = strings.join("\n").toLowerCase();
    const entityIds = new Set(entities.map((e) => e.id));
    const named = strings.filter((s) => entityIds.has(s) || s.startsWith("us-state-"));
    expect([...new Set(named)].sort()).toEqual(["us-state-ak", "us-state-hi"]);
    for (const e of entities) {
      if (e.id === "us-state-hi" || e.id === "us-state-ak") continue;
      expect({ id: e.id, hit: text.includes(e.id) }).toEqual({ id: e.id, hit: false });
      if (e.capital !== undefined)
        expect({ capital: e.capital, hit: text.includes(e.capital.toLowerCase()) }).toEqual({
          capital: e.capital,
          hit: false,
        });
    }
    for (const cap of ["honolulu", "juneau", "denver", "providence", "boston", "phoenix"])
      expect({ cap, hit: text.includes(cap) }).toEqual({ cap, hit: false });
    // Keys and values may mention a template id (tpl-capital-of) but no
    // largest-city input: no key or value about a city or a largest anything.
    const nonTemplate = strings.filter((s) => !TEMPLATES.some((t) => t.id === s));
    expect(nonTemplate.filter((s) => /city|cities|largest|capital/i.test(s))).toEqual([]);
  });
});

describe("T-085a criteria 7-11: the clamp and the module", () => {
  const drawnApart = (base: number): number =>
    synthLevel("us-state-hi", { ...realTemplate("tpl-identify-on-map"), base_difficulty: base });

  test("criterion 7: pre-reduction level 2 gives 0", () => {
    expect(
      synthLevel("syn-a", { ...realTemplate("tpl-identify-on-map"), base_difficulty: 2 }),
    ).toBe(2);
    expect(drawnApart(2)).toBe(0);
  });

  test("criterion 7: pre-reduction level 1.5 gives 0, not -0.5", () => {
    expect(
      synthLevel("syn-a", { ...realTemplate("tpl-identify-on-map"), base_difficulty: 1.5 }),
    ).toBe(1.5);
    const got = drawnApart(1.5);
    expect(got).toBe(0);
    expect(Object.is(got, -0)).toBe(false);
  });

  test("criterion 7: pre-reduction level 2.5 gives 0.5", () => {
    expect(drawnApart(2.5)).toBe(0.5);
  });

  test("criterion 7: on the climate template the reduction comes before the clamp too (pre 3 gives 1)", () => {
    // concept_load["tpl-climate-of"] is 3 and base_difficulty may not go below
    // 0, so a climate question cannot reach the clamp; this pins the order only.
    const t = { ...realTemplate("tpl-climate-of"), base_difficulty: 0 };
    expect(synthLevel("syn-a", t)).toBe(3);
    expect(synthLevel("us-state-ak", t)).toBe(1);
  });

  test("criterion 8: no level in the bank is below 0 or above 18", () => {
    const levels = bank().map((q) => q.level);
    expect(levels.length).toBe(415);
    expect(levels.filter((l) => !(l >= LEVEL_MIN && l <= LEVEL_MAX))).toEqual([]);
    expect(LEVEL_MIN).toBe(0);
    expect(LEVEL_MAX).toBe(18);
  });

  test("criterion 9: seedLevels is deterministic and mutates none of its arguments", () => {
    const es = loadCommittedEntities();
    const { questions } = buildChoices(generate(es).drafts, es);
    const templates = TEMPLATES.map((t) => ({ ...t }));
    const snapshot = JSON.stringify([questions, es, templates]);
    const a = seedLevels(questions, es, templates);
    const b = seedLevels(questions, es, templates);
    expect(a).toEqual(b);
    expect(a.length).toBe(415);
    expect(JSON.stringify([questions, es, templates])).toBe(snapshot);
  });

  test("criterion 10: amount 0 in place gives exactly the before levels for all 415 questions", () => {
    const zero = bankUnderAmount(0);
    expect(zero.length).toBe(415);
    expect(levelsSha(zero)).toBe(BEFORE_LEVELS_SHA);
    expect(LEVEL_SEED_WEIGHTS.familiarity_bonus).toBe(2);
  });

  test("criterion 10: amount 3 in place puts the six exactly 3 below before and moves nothing else", () => {
    const before = byId(bankUnderAmount(0));
    const three = bankUnderAmount(3);
    for (const id of SIX)
      expect({ id, level: byId(three).get(id)?.level }).toEqual({
        id,
        level: (BEFORE_HI_AK[id] as number) - 3,
      });
    const moved = three
      .filter((q) => !SIX.includes(q.id) && before.get(q.id)?.level !== q.level)
      .map((q) => q.id);
    expect(moved).toEqual([]);
  });

  test("criterion 10: the state ids are read from the constant (emptying the list gives the before bank)", () => {
    (
      LEVEL_SEED_WEIGHTS as { familiarity_bonus_states: readonly string[] }
    ).familiarity_bonus_states = [];
    expect(levelsSha(bank())).toBe(BEFORE_LEVELS_SHA);
  });

  test("criterion 10: the template ids are read from the constant (one template left moves only its two)", () => {
    (
      LEVEL_SEED_WEIGHTS as { familiarity_bonus_templates: readonly string[] }
    ).familiarity_bonus_templates = ["tpl-climate-of"];
    const before = byId(bankUnderAmount(0));
    const moved = bank()
      .filter((q) => before.get(q.id)?.level !== q.level)
      .map((q) => q.id)
      .sort();
    expect(moved).toEqual(["gen:tpl-climate-of:us-state-ak", "gen:tpl-climate-of:us-state-hi"]);
  });

  test("criterion 11: the runtime exports are exactly seedLevels, LEVEL_SEED_WEIGHTS, LEVEL_MIN, LEVEL_MAX", () => {
    expect(Object.keys(seedLevelModule).sort()).toEqual(
      ["LEVEL_MAX", "LEVEL_MIN", "LEVEL_SEED_WEIGHTS", "seedLevels"].sort(),
    );
  });

  test("criterion 11: the source exports exactly the six names, and levelFor / nearDistractorCount are not exported", () => {
    const src = read("question-bank/src/seed-level.ts");
    const exported = [
      ...src.matchAll(
        /^export\s+(?:declare\s+)?(?:const|let|var|function|type|interface|class|enum)\s+([A-Za-z_$][\w$]*)/gm,
      ),
    ].map((m) => m[1]);
    expect(exported.sort()).toEqual(
      [
        "LEVEL_MAX",
        "LEVEL_MIN",
        "LEVEL_SEED_WEIGHTS",
        "LevelSeedWeights",
        "LeveledQuestion",
        "seedLevels",
      ].sort(),
    );
    expect(src).not.toMatch(/^export\s*\{/m);
    expect(src).not.toMatch(/^export\s+default/m);
    expect(src).toMatch(/^function levelFor\(/m);
    expect(src).toMatch(/^function nearDistractorCount\(/m);
  });
});

describe("T-085a criteria 12-16: everything else holds still; the committed files", () => {
  test("criterion 12: the 409 questions outside the six keep their before level", () => {
    const now = bank();
    const before = byId(bankUnderAmount(0));
    expect(levelsSha([...before.values()])).toBe(BEFORE_LEVELS_SHA);
    const rest = now.filter((q) => !SIX.includes(q.id));
    expect(rest.length).toBe(409);
    expect(rest.filter((q) => before.get(q.id)?.level !== q.level).map((q) => q.id)).toEqual([]);
  });

  test("criterion 12: the committed question file's levels are before with only the six changed", () => {
    const qs = questionFile().questions;
    const restored = qs.map((q) =>
      SIX.includes(q.id) ? { ...q, level: BEFORE_HI_AK[q.id] as number } : q,
    );
    expect(levelsSha(restored)).toBe(BEFORE_LEVELS_SHA);
    for (const id of SIX)
      expect({ id, level: byId(qs).get(id)?.level }).toEqual({ id, level: SIX_AFTER[id] });
  });

  test("criterion 13: no field but level changed in the question file", () => {
    const f = questionFile();
    expect(f.questions.length).toBe(415);
    expect(f.count).toBe(415);
    expect(sha(JSON.stringify(withoutLevel(f.questions)))).toBe(BEFORE_Q_NO_LEVEL_SHA);
    expect(sha(JSON.stringify(f._source))).toBe(BEFORE_Q_SOURCE_SHA);
    expect(Object.keys(f).sort()).toEqual(["_source", "count", "questions"]);
  });

  test("criterion 13: no field but level changed in content.json", () => {
    const c = contentFile();
    expect(sha(JSON.stringify(withoutLevel(c.questions)))).toBe(BEFORE_C_NO_LEVEL_SHA);
    expect(sha(JSON.stringify({ ...c, questions: null }))).toBe(BEFORE_C_REST_SHA);
  });

  test("criterion 14: the committed question file is byte-identical to what write-questions renders", () => {
    expect(read("question-bank/data/questions/us-states.json")).toBe(renderQuestionFile(entities));
  });

  test("criterion 14: and it carries the levels of criteria 1 and 12", () => {
    const qs = questionFile().questions;
    for (const id of SIX)
      expect({ id, level: byId(qs).get(id)?.level }).toEqual({ id, level: SIX_AFTER[id] });
    const restored = qs.map((q) =>
      SIX.includes(q.id) ? { ...q, level: BEFORE_HI_AK[q.id] as number } : q,
    );
    expect(levelsSha(restored)).toBe(BEFORE_LEVELS_SHA);
  });

  test("criterion 15: every served question's level equals the question file's level for that id", () => {
    const file = byId(questionFile().questions);
    const served = contentFile().questions;
    expect(served.length).toBeGreaterThan(0);
    const mismatched = served
      .filter((q) => file.get(q.id) === undefined || file.get(q.id)?.level !== q.level)
      .map((q) => q.id);
    expect(mismatched).toEqual([]);
    const servedById = byId(served);
    for (const id of SIX)
      expect({ id, level: servedById.get(id)?.level }).toEqual({ id, level: SIX_AFTER[id] });
  });

  test("criterion 16: no file under data/us-states/ changed since 5ae564a, built_at aside, and no entity gained a field", () => {
    const dir = join(REPO_ROOT, "question-bank/data/us-states");
    const files = readdirSync(dir).sort();
    expect(files.length).toBe(51);
    const parts = files.map((f) => {
      const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
      if (j.sources) delete j.sources.built_at;
      return [f, j];
    });
    expect(sha(JSON.stringify(parts))).toBe(BEFORE_ENTITIES_SHA);
  });
});

describe("T-085a criteria 17-22: E-22", () => {
  const ed = read("engineering-decisions.md");
  const a = ed.indexOf("\n## E-22 ");
  const b = ed.indexOf("\n## E-23 ");
  const e22 = ed.slice(a, b);

  test("E-22 exists once and precedes E-23", () => {
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(ed.split("\n## E-22 ").length).toBe(2);
  });

  test("criterion 17: a dated T-085a paragraph states amount 2, Hawaii, Alaska, the three templates and Dkaattae's 2026-10-27 approval", () => {
    const start = e22.search(/\*\*2026-10-\d\d \(T-085a\)\.\*\*/);
    expect(start).toBeGreaterThan(0);
    const next = e22.slice(start + 5).search(/\n\*\*[^*\n]*\*\*/);
    const para = next < 0 ? e22.slice(start) : e22.slice(start, start + 5 + next);
    expect(para).toMatch(/`familiarity_bonus` is 2\b/);
    expect(para).toContain("Hawaii");
    expect(para).toContain("Alaska");
    for (const t of ["tpl-identify-on-map", "tpl-click-the-map", "tpl-climate-of"])
      expect(para).toContain(`\`${t}\``);
    expect(para).toMatch(/approved\s+by\s+Dkaattae\s+on\s+2026-10-27/);
  });

  test("criterion 18: the '150 levels' sentence's ends and states hold over the regenerated bank", () => {
    expect(e22).toMatch(
      /the 150 levels run from 3\.5 \(California and Texas,\s+identify on map\) to 10 \(Delaware, Maine, New Hampshire, Rhode Island, Vermont\s+and West Virginia, capital\)/,
    );
    const old = bank().filter((q) =>
      ["tpl-identify-on-map", "tpl-capital-of", "tpl-click-the-map"].includes(q.templateId),
    );
    expect(old.length).toBe(150);
    const levels = old.map((q) => q.level);
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    expect([min, max]).toEqual([3.5, 10]);
    expect(
      old
        .filter((q) => q.level === min)
        .map((q) => `${q.entityId} ${q.templateId}`)
        .sort(),
    ).toEqual(["us-state-ca tpl-identify-on-map", "us-state-tx tpl-identify-on-map"]);
    expect(
      old
        .filter((q) => q.level === max)
        .map((q) => `${q.entityId} ${q.templateId}`)
        .sort(),
    ).toEqual(
      ["de", "me", "nh", "ri", "vt", "wv"].map((s) => `us-state-${s} tpl-capital-of`).sort(),
    );
  });

  test("criterion 18: the '265 new levels' sentence's ends and states hold over the regenerated bank", () => {
    expect(e22).toMatch(
      /the 265 new levels run from 3 \(California and Texas, farm animal\) to 10 \(state\s+animal and landmark for the small north-eastern states and West Virginia\)/,
    );
    const neu = bank().filter(
      (q) => !["tpl-identify-on-map", "tpl-capital-of", "tpl-click-the-map"].includes(q.templateId),
    );
    expect(neu.length).toBe(265);
    const levels = neu.map((q) => q.level);
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    expect([min, max]).toEqual([3, 10]);
    expect(
      neu
        .filter((q) => q.level === min)
        .map((q) => `${q.entityId} ${q.templateId}`)
        .sort(),
    ).toEqual(["us-state-ca tpl-farm-animal-of", "us-state-tx tpl-farm-animal-of"]);
    const top = neu.filter((q) => q.level === max);
    expect(top.length).toBeGreaterThan(0);
    expect(
      top.filter((q) => !["tpl-state-animal-of", "tpl-landmark-in"].includes(q.templateId)),
    ).toEqual([]);
    expect(top.some((q) => q.entityId === "us-state-wv")).toBe(true);
    // The drawn-apart six are inside both ranges, as the brief says.
    expect(top.some((q) => q.entityId === "us-state-hi" || q.entityId === "us-state-ak")).toBe(
      false,
    );
  });

  test("criterion 19: E-22 has a six-row table of the changed questions whose values equal the bank's", () => {
    const now = byId(bank());
    const rows = new Map<string, [number, number]>();
    for (const line of e22.split("\n")) {
      const m = line.match(/^\|\s*`(gen:[^`]+)`\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*$/);
      if (m) rows.set(m[1] as string, [Number(m[2]), Number(m[3])]);
    }
    expect([...rows.keys()].sort()).toEqual([...SIX].sort());
    for (const id of SIX)
      expect({ id, row: rows.get(id) }).toEqual({
        id,
        row: [BEFORE_HI_AK[id] as number, now.get(id)?.level as number],
      });
  });

  test("criterion 20: E-22 says the largest-city input is not landed and names T-085b", () => {
    expect(e22).toMatch(/largest-city input is not landed/i);
    const i = e22.search(/largest-city input is not landed/i);
    const para = e22.slice(i, e22.indexOf("\n\n", i));
    expect(para).toMatch(/\bT-085b\b/);
  });

  test("criterion 20: no sentence or heading in E-22 still says familiarity_bonus is 0 / 0 for lack of a list / T-085's question", () => {
    const flat = e22.replace(/\s+/g, " ");
    expect(flat).not.toMatch(/`?familiarity_bonus`?\s*(is|stays|=|:)\s*0\b/);
    expect(flat).not.toMatch(/0 for every question/);
    expect(flat).not.toMatch(/Why `familiarity_bonus` is 0/);
    expect(flat).not.toMatch(/(stays|left it|remains|kept) (at )?0\b/);
    expect(flat).not.toMatch(/No list of famous states exists/i);
    expect(flat).not.toMatch(/whether it is (ever )?set is T-085's question/i);
    const heading = e22.split("\n").find((l) => l.startsWith("## E-22 ")) as string;
    expect(heading).not.toMatch(/is 0\b/);
  });

  test("criterion 21: every key and numeric leaf of LEVEL_SEED_WEIGHTS appears with its value in the constant block", () => {
    const i = e22.indexOf("**The constant, as the code spells it:**");
    expect(i).toBeGreaterThan(0);
    const open = e22.indexOf("```", i);
    const close = e22.indexOf("```", open + 3);
    const block = e22.slice(open + 3, close);
    const lines = new Map<string, string>();
    for (const l of block.split("\n")) {
      const m = l.match(/^([a-z_]+): (.*)$/);
      if (m) lines.set(m[1] as string, m[2] as string);
    }
    expect([...lines.keys()].sort()).toEqual(Object.keys(LEVEL_SEED_WEIGHTS).sort());
    for (const [key, value] of Object.entries(LEVEL_SEED_WEIGHTS)) {
      const text = lines.get(key) as string;
      if (typeof value === "number") expect({ key, text }).toEqual({ key, text: String(value) });
      else expect({ key, parsed: JSON.parse(text) }).toEqual({ key, parsed: value });
    }
  });

  test("criterion 22: the T-025 hand-check table is unchanged since 5ae564a", () => {
    const t = e22.indexOf("### T-025 hand-check of 30 questions");
    expect(t).toBeGreaterThan(0);
    const rows = e22
      .slice(t)
      .split("\n")
      .filter((l) => l.startsWith("| "))
      .slice(0, 32);
    expect(rows.length).toBe(31);
    expect(sha(rows.join("\n"))).toBe(BEFORE_T025_TABLE_SHA);
  });

  test("criterion 22: every E-n entry other than E-22 is byte-identical to 4818fc8's", () => {
    expect(sha(`${ed.slice(0, a)}\u0000${ed.slice(b)}`)).toBe(BEFORE_ED_OUTSIDE_E22_SHA);
  });
});

describe("T-085a criteria 23-25: negative", () => {
  test("criterion 23: no package.json, bun.lock, pyproject.toml or uv.lock changed since 5ae564a", () => {
    for (const [f, h] of Object.entries(BEFORE_FILE_SHA))
      if (f !== "openapi.yaml") expect({ f, h: sha(read(f)) }).toEqual({ f, h });
  });

  test("criterion 24: the T-085a test files import nothing that reaches the network", () => {
    for (const f of ["familiarity-drawn-apart-verify.test.ts", "seed-level-familiarity.test.ts"]) {
      const src = readFileSync(join(import.meta.dirname, f), "utf8");
      // Built from parts so this file's own text does not match.
      const banned = [
        "fet" + "ch(",
        "node:" + "http",
        "node:" + "net",
        "Bun." + "connect",
        "Web" + "Socket",
        "sparql" + "Transport",
      ];
      for (const b of banned) expect({ f, b, hit: src.includes(b) }).toEqual({ f, b, hit: false });
    }
  });

  test("criterion 25: openapi.yaml is unchanged since 5ae564a", () => {
    expect(sha(read("openapi.yaml"))).toBe(BEFORE_FILE_SHA["openapi.yaml"] as string);
  });
});
