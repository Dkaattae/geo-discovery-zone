/**
 * T-023, written by the `tester` from the brief's acceptance criteria. Expected
 * values come from the criteria, plan §1.4 and the committed bank, never from
 * `seed-level.ts`, whose source was read for entry points and signatures only.
 * The criteria are relational (monotone, not constant, equal to some rank), so
 * most tests compare the stage's output with itself under controlled changes.
 *
 * Synthetic set: four real states (CO and three states it borders) cloned, each
 * given its own region and no borders. With four entities every question's
 * three distractors are the other three, whatever the strategy, so the near
 * count is set exactly by putting k of them in the question entity's
 * `borders`. Pure: no network, no seam. The only file I/O is reading the
 * committed bank and source / doc text.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChoices, clickDistractorsFor } from "./distractors";
import type { GeneratedQuestion } from "./distractors";
import { generate } from "./generate";
import { LEVEL_SEED_WEIGHTS, seedLevels } from "./seed-level";
import { TEMPLATES, validateTemplate } from "./templates";
import type { Template } from "./templates";
import type { Entity } from "./types";

const SRC = import.meta.dirname;
const STATES_DIR = join(SRC, "..", "data", "us-states");
const DECISIONS = join(SRC, "..", "..", "engineering-decisions.md");

const IDENTIFY = "tpl-identify-on-map";
const CAPITAL = "tpl-capital-of";
const CLICK = "tpl-click-the-map";
const TPL_IDS = [IDENTIFY, CAPITAL, CLICK];

/** Fresh parse per call, so no test can mutate another's data. */
function bank(): Entity[] {
  return readdirSync(STATES_DIR)
    .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
}

const sid = (c: string) => `us-state-${c.toLowerCase()}`;

function questionsFor(entities: Entity[], templates: Template[] = TEMPLATES) {
  const { drafts } = generate(entities, templates);
  return buildChoices(drafts, entities, templates).questions;
}

function levelsFor(entities: Entity[], templates: Template[] = TEMPLATES) {
  return seedLevels(questionsFor(entities, templates), entities, templates);
}

const withBase = (base: number, templates: Template[] = TEMPLATES): Template[] =>
  templates.map((t) => ({ ...structuredClone(t), base_difficulty: base }));

// ---- synthetic quartet ----

const X = sid("CO");
const OTHERS = [sid("KS"), sid("NE"), sid("WY")];
const ABSENT = Symbol("absent");
type RankValue = number | null | string | typeof ABSENT;

interface Setup {
  pop?: RankValue;
  area?: RankValue;
  near?: number;
  base?: number;
  templates?: Template[];
}

/** The four source entities, parsed once; every quartet() clones them. */
const QUARTET_SOURCE: readonly Entity[] = (() => {
  const all = bank();
  return [X, ...OTHERS].map((id) => all.find((x) => x.id === id) as Entity);
})();

function quartet(s: Setup): Entity[] {
  return QUARTET_SOURCE.map((src, i) => {
    const id = src.id;
    const e = structuredClone(src);
    e.region = `Synthetic-${i}`;
    e.borders = [];
    if (id === X) {
      e.borders = OTHERS.slice(0, s.near ?? 0);
      const rec = e as unknown as Record<string, unknown>;
      if (s.pop === ABSENT) delete rec["population_rank"];
      else if (s.pop !== undefined) rec["population_rank"] = s.pop;
      if (s.area === ABSENT) delete rec["area_rank"];
      else if (s.area !== undefined) rec["area_rank"] = s.area;
    }
    return e;
  });
}

/** X's level per template id under a setup. */
function synth(s: Setup): Record<string, number> {
  const templates = s.templates ?? (s.base === undefined ? TEMPLATES : withBase(s.base));
  const entities = quartet(s);
  const out: Record<string, number> = {};
  for (const q of levelsFor(entities, templates)) if (q.entityId === X) out[q.templateId] = q.level;
  return out;
}

const RANKS = Array.from({ length: 50 }, (_, i) => i + 1);
const inRange = (l: unknown) => typeof l === "number" && Number.isFinite(l) && l >= 0 && l <= 18;

// ---- Output shape ----

describe("T-023 criteria 1-4: output shape", () => {
  test("criterion 1: 150 questions over the committed bank, same ids in the same order", () => {
    // T-026 (approved Test change request, S3): the three original templates.
    const original = TEMPLATES.slice(0, 3);
    const states = bank();
    const qs = questionsFor(states, original);
    const out = seedLevels(qs, states, original);
    expect(out.length).toBe(150);
    expect(out.map((q) => q.id)).toEqual(qs.map((q) => q.id));
  });

  test("criterion 2: every level is a finite number in [0, 18]", () => {
    for (const q of levelsFor(bank())) {
      expect(typeof q.level).toBe("number");
      expect(Number.isFinite(q.level)).toBe(true);
      expect(q.level).toBeGreaterThanOrEqual(0);
      expect(q.level).toBeLessThanOrEqual(18);
    }
  });

  test("criterion 3: keys are the input's keys plus level; every other field deep-equal", () => {
    const states = bank();
    const qs = questionsFor(states);
    const before = structuredClone(qs);
    const out = seedLevels(qs, states, TEMPLATES);
    out.forEach((q, i) => {
      const input = before[i] as GeneratedQuestion;
      expect(Object.keys(q).sort()).toEqual([...Object.keys(input), "level"].sort());
      const { level: _level, ...rest } = q;
      expect(rest).toEqual(input);
    });
  });

  test("criterion 4: questions, entities and templates are not mutated (frozen and deep-equal)", () => {
    const deepFreeze = <T>(o: T): T => {
      if (o && typeof o === "object") {
        for (const v of Object.values(o)) deepFreeze(v);
        Object.freeze(o);
      }
      return o;
    };
    const states = bank();
    const templates = structuredClone(TEMPLATES);
    const qs = questionsFor(states, templates);
    const before = structuredClone({ states, templates, qs });
    deepFreeze(states);
    deepFreeze(templates);
    deepFreeze(qs);
    expect(() => seedLevels(qs, states, templates)).not.toThrow();
    expect({ states, templates, qs }).toEqual(before);
    for (const q of qs) expect(Object.hasOwn(q, "level")).toBe(false);
  });
});

// ---- Determinism ----

describe("T-023 criteria 5-7: determinism", () => {
  test("criterion 5: two calls with the same inputs are deep-equal", () => {
    const states = bank();
    const qs = questionsFor(states);
    expect(seedLevels(qs, states, TEMPLATES)).toEqual(seedLevels(qs, states, TEMPLATES));
  });

  test("criterion 6: reversing entity order leaves every level unchanged, by id", () => {
    const fwd = new Map(levelsFor(bank()).map((q) => [q.id, q.level]));
    const rev = levelsFor(bank().reverse());
    expect(rev.length).toBe(fwd.size);
    for (const q of rev) expect(q.level).toBe(fwd.get(q.id) as number);
  });

  test("criterion 7: no randomness, clock, network, fs or env in seed-level.ts or anything it imports", () => {
    const seen = new Set<string>();
    const queue = ["seed-level.ts"];
    while (queue.length > 0) {
      const file = queue.shift() as string;
      if (seen.has(file)) continue;
      seen.add(file);
      const raw = readFileSync(join(SRC, file), "utf8");
      const specs = [...raw.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g)].map(
        (m) => m[1] as string,
      );
      for (const spec of specs) {
        // Only relative modules: a bare package import would be a new
        // dependency path, and is itself a failure here.
        expect(spec.startsWith(".")).toBe(true);
        const rel = join(file, "..", spec).replace(/^\.\//, "");
        if (rel.endsWith(".ts")) queue.push(rel);
        else if (existsSync(join(SRC, `${rel}.ts`))) queue.push(`${rel}.ts`);
        else queue.push(join(rel, "index.ts"));
      }
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      for (const needle of [
        /Math\.random/,
        /\bDate\b/,
        /\bperformance\b/,
        /\bfetch\s*\(/,
        /node:/,
        /\bfs\b/,
        /\bBun\./,
        /process\./,
        /\brequire\s*\(/,
        /XMLHttpRequest|WebSocket/,
      ]) {
        expect({ file, hit: needle.test(code) }).toEqual({ file, hit: false });
      }
    }
    expect(seen.has("seed-level.ts")).toBe(true);
    expect(seen.size).toBeGreaterThan(1);
  });
});

// ---- base_level ----

describe("T-023 criteria 8-9: base_level(template)", () => {
  test("criterion 8: base_difficulty greater by d gives a level greater by d, when neither is clamped", () => {
    const pairs: [number, number][] = [
      [2, 3],
      [2, 4.5],
      [0, 5],
      [1, 1.25],
      [5, 12],
    ];
    let compared = 0;
    for (const [lo, hi] of pairs) {
      const a = levelsFor(bank(), withBase(lo));
      const b = new Map(levelsFor(bank(), withBase(hi)).map((q) => [q.id, q.level]));
      for (const q of a) {
        const other = b.get(q.id) as number;
        if (q.level <= 0 || q.level >= 18 || other <= 0 || other >= 18) continue;
        expect(Math.abs(other - q.level - (hi - lo))).toBeLessThan(1e-9);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(500);
  });

  test("criterion 9: base 18 never exceeds 18 and base 0 never goes below 0, any rank 1-50/null, near 0-3", () => {
    const values: RankValue[] = [...RANKS, null];
    const bad: string[] = [];
    let checked = 0;
    for (const base of [0, 18]) {
      for (const near of [0, 1, 2, 3]) {
        for (const pop of values) {
          for (const area of values) {
            const l = synth({ pop, area, near, base });
            for (const t of TPL_IDS) {
              checked++;
              if (!inRange(l[t]))
                bad.push(
                  `base ${base} near ${near} pop ${String(pop)} area ${String(area)} ${t}: ${l[t]}`,
                );
            }
          }
        }
      }
    }
    expect(checked).toBe(2 * 4 * 51 * 51 * 3);
    expect(bad).toEqual([]);
  }, 60_000);
});

// ---- entity_obscurity ----

describe("T-023 criteria 10-13: entity_obscurity", () => {
  test("criterion 10: level never falls as population_rank or area_rank rises (1-50), each near count", () => {
    for (const near of [0, 3]) {
      const grid = RANKS.map((p) => RANKS.map((a) => synth({ pop: p, area: a, near })));
      const at = (p: number, a: number, t: string) =>
        (grid[p] as Record<string, number>[])[a]?.[t] as number;
      const bad: string[] = [];
      for (let p = 0; p < 50; p++) {
        for (let a = 0; a < 50; a++) {
          for (const t of TPL_IDS) {
            if (p < 49 && at(p + 1, a, t) < at(p, a, t))
              bad.push(`near ${near} pop ${p + 2} < ${p + 1} at area ${a + 1} ${t}`);
            if (a < 49 && at(p, a + 1, t) < at(p, a, t))
              bad.push(`near ${near} area ${a + 2} < ${a + 1} at pop ${p + 1} ${t}`);
          }
        }
      }
      expect(at(49, 49, CAPITAL)).toBeGreaterThan(0);
      expect(bad).toEqual([]);
    }
  });

  test("criterion 11: at base 2, ranked 50 on both is strictly harder than ranked 1 on both", () => {
    for (const near of [0, 1, 2, 3]) {
      const easy = synth({ pop: 1, area: 1, near, base: 2 });
      const hard = synth({ pop: 50, area: 50, near, base: 2 });
      for (const t of TPL_IDS) expect(hard[t] as number).toBeGreaterThan(easy[t] as number);
    }
  });

  const BAD: { label: string; v: RankValue }[] = [
    { label: "null", v: null },
    { label: "absent", v: ABSENT },
    { label: "0", v: 0 },
    { label: "-3", v: -3 },
    { label: "2.5", v: 2.5 },
    { label: "NaN", v: Number.NaN },
    { label: "string", v: "12" },
  ];

  test("criterion 12: null, absent, 0, -3, 2.5, NaN and a string are treated alike, for each rank and both", () => {
    for (const near of [0, 3]) {
      for (const which of ["pop", "area", "both"] as const) {
        for (const other of [1, 25, 50]) {
          const results = BAD.map(({ v }) => {
            const s: Setup =
              which === "pop"
                ? { pop: v, area: other, near }
                : which === "area"
                  ? { pop: other, area: v, near }
                  : { pop: v, area: v, near };
            let out: Record<string, number> = {};
            expect(() => {
              out = synth(s);
            }).not.toThrow();
            for (const t of TPL_IDS) expect(inRange(out[t])).toBe(true);
            return out;
          });
          for (const r of results) expect(r).toEqual(results[0] as Record<string, number>);
        }
      }
    }
  });

  test("criterion 13: a missing rank contributes exactly what one fixed real rank in 1-50 does", () => {
    for (const which of ["pop", "area"] as const) {
      let candidates = new Set(RANKS);
      for (const near of [0, 1, 3]) {
        for (const other of [1, 18, 50, null] as RankValue[]) {
          const mk = (v: RankValue): Setup =>
            which === "pop" ? { pop: v, area: other, near } : { pop: other, area: v, near };
          const missing = synth(mk(null));
          const ok = RANKS.filter((r) => {
            const real = synth(mk(r));
            return TPL_IDS.every(
              (t) => Math.abs((real[t] as number) - (missing[t] as number)) < 1e-9,
            );
          });
          candidates = new Set([...candidates].filter((r) => ok.includes(r)));
        }
      }
      expect({ which, size: candidates.size > 0 }).toEqual({ which, size: true });
    }
  });

  test("criterion 13: E-22 writes the missing-rank value down", () => {
    const e = e22();
    expect(e).toMatch(/missing/i);
    expect(e).toContain("missing_rank_bucket");
    expect(e).toContain(`missing_rank_bucket: ${LEVEL_SEED_WEIGHTS.missing_rank_bucket}`);
  });
});

// ---- distractor_tightness ----

describe("T-023 criteria 14-16: distractor_tightness", () => {
  const RANK_GRID: RankValue[] = [1, 10, 11, 20, 21, 35, 36, 50, null];

  test("criterion 14: k+1 near distractors never give a lower level than k (k = 0..2)", () => {
    for (const pop of RANK_GRID) {
      for (const area of RANK_GRID) {
        const byNear = [0, 1, 2, 3].map((near) => synth({ pop, area, near }));
        for (let k = 0; k < 3; k++) {
          for (const t of TPL_IDS) {
            expect((byNear[k + 1] as Record<string, number>)[t]).toBeGreaterThanOrEqual(
              (byNear[k] as Record<string, number>)[t] as number,
            );
          }
        }
      }
    }
  });

  test("criterion 15: at base 2, 3 near distractors is strictly harder than 0", () => {
    for (const pop of RANK_GRID) {
      for (const area of RANK_GRID) {
        const far = synth({ pop, area, near: 0, base: 2 });
        const near = synth({ pop, area, near: 3, base: 2 });
        for (const t of TPL_IDS) expect(near[t] as number).toBeGreaterThan(far[t] as number);
      }
    }
  });

  test("near/far definition: same non-blank region counts as near, exactly as borders do; blank region does not", () => {
    // Near via borders (from the quartet) against near via shared region.
    const viaBorders = synth({ pop: 25, area: 25, near: 3 });
    const regionNear = quartet({ pop: 25, area: 25, near: 0 }).map((e) => ({
      ...e,
      region: "Shared",
    }));
    const viaRegion: Record<string, number> = {};
    for (const q of levelsFor(regionNear)) if (q.entityId === X) viaRegion[q.templateId] = q.level;
    expect(viaRegion).toEqual(viaBorders);

    const farLevels = synth({ pop: 25, area: 25, near: 0 });
    for (const blank of ["", "   "]) {
      const blankRegion = quartet({ pop: 25, area: 25, near: 0 }).map((e) => ({
        ...e,
        region: blank,
      }));
      const viaBlank: Record<string, number> = {};
      for (const q of levelsFor(blankRegion))
        if (q.entityId === X) viaBlank[q.templateId] = q.level;
      expect(viaBlank).toEqual(farLevels);
    }
    expect(viaBorders).not.toEqual(farLevels);
  });

  test("criterion 16: HI and CA capital levels are strictly below their own 3-near level", () => {
    for (const code of ["HI", "CA"]) {
      const id = sid(code);
      const actual = levelsFor(bank()).find(
        (q) => q.entityId === id && q.templateId === CAPITAL,
      ) as { level: number };
      // Same ranks; every other state is now in its borders, so all 3
      // distractors are near whatever they are.
      const synthetic = bank().map((e) =>
        e.id === id
          ? {
              ...e,
              borders: bank()
                .map((o) => o.id)
                .filter((o) => o !== id),
            }
          : e,
      );
      const own = synthetic.find((e) => e.id === id) as Entity;
      const orig = bank().find((e) => e.id === id) as Entity;
      expect([own.population_rank, own.area_rank]).toEqual([orig.population_rank, orig.area_rank]);
      const threeNear = levelsFor(synthetic).find(
        (q) => q.entityId === id && q.templateId === CAPITAL,
      ) as { level: number };
      expect({ code, lower: actual.level < threeNear.level }).toEqual({ code, lower: true });
    }
  });
});

// ---- concept_load and familiarity_bonus ----

describe("T-023 criteria 17-18: concept_load and familiarity_bonus", () => {
  test("criterion 17: concept_load is keyed by template id, with a numeric default", () => {
    const cl = LEVEL_SEED_WEIGHTS.concept_load as Record<string, unknown>;
    expect(Object.keys(cl).length).toBeGreaterThan(0);
    for (const [k, v] of Object.entries(cl)) {
      expect(k).toMatch(/^tpl-[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(typeof v).toBe("number");
    }
    expect(typeof LEVEL_SEED_WEIGHTS.concept_load_default).toBe("number");
  });

  test("criterion 17: a valid template whose id is not in TEMPLATES gets in-range levels, shifted by default minus the known id's load", () => {
    const capital = TEMPLATES.find((t) => t.id === CAPITAL) as Template;
    const unknown: Template = { ...structuredClone(capital), id: "tpl-not-in-templates-yet" };
    expect(validateTemplate(unknown)).toEqual([]);
    expect(Object.hasOwn(LEVEL_SEED_WEIGHTS.concept_load, unknown.id)).toBe(false);
    const known = new Map(
      levelsFor(bank(), [capital]).map((q) => [q.entityId, q.level] as [string, number]),
    );
    const got = levelsFor(bank(), [unknown]);
    expect(got.length).toBe(50);
    const shift =
      LEVEL_SEED_WEIGHTS.concept_load_default -
      (LEVEL_SEED_WEIGHTS.concept_load[CAPITAL] as number);
    for (const q of got) {
      expect(inRange(q.level)).toBe(true);
      const k = known.get(q.entityId) as number;
      if (k > 0 && k < 18 && q.level > 0 && q.level < 18)
        expect(Math.abs(q.level - k - shift)).toBeLessThan(1e-9);
    }
  });

  test("criterion 18: familiarity_bonus is 0, and the stage takes no player input", () => {
    expect(LEVEL_SEED_WEIGHTS.familiarity_bonus).toBe(0);
    // questions, entities, templates: at most three parameters.
    expect(seedLevels.length).toBeLessThanOrEqual(3);
    const code = readFileSync(join(SRC, "seed-level.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(code).not.toMatch(/profile|player|home_?state|homeState|famous/i);
    // No list of entities anywhere in the constant: only number arrays.
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) for (const x of v) expect(typeof x).toBe("number");
      else if (v && typeof v === "object") for (const x of Object.values(v)) walk(x);
    };
    walk(LEVEL_SEED_WEIGHTS);
  });
  test("criterion 18: with every rank equal, a question's level depends only on template and near count (no per-entity bonus)", () => {
    const states = bank().map((e) => ({ ...e, population_rank: 25, area_rank: 25 }));
    const byId = new Map(states.map((e) => [e.id, e]));
    const nonBlank = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
    // Near count from the brief's definition, computed here, not by the stage.
    const nearCount = (q: GeneratedQuestion): number => {
      const own = byId.get(q.entityId) as Entity;
      const t = TEMPLATES.find((x) => x.id === q.templateId) as Template;
      // T-092 (approved Test change request, rows 22 and 27): a map_click
      // question carries no choices; its three distractors are the peers whose
      // geometry ids `clickDistractorsFor` returns.
      let others: (Entity | undefined)[];
      if (q.format === "map_click") {
        const codes = clickDistractorsFor(q, own, t, states);
        expect(Array.isArray(codes)).toBe(true);
        others = (codes as string[]).map((g) => states.find((e) => e.geometry_id === g));
      } else {
        others = (q.choices as string[])
          .filter((_, i) => i !== q.correctIndex)
          .map((text) =>
            states.find((e) => (e as unknown as Record<string, unknown>)[t.answer_field] === text),
          );
      }
      let n = 0;
      for (const other of others) {
        expect(other).toBeDefined();
        const near =
          (own.borders ?? []).includes((other as Entity).id) ||
          (nonBlank(own.region) && own.region === (other as Entity).region);
        if (near) n++;
      }
      return n;
    };
    const groups = new Map<string, Set<number>>();
    // T-026 (approved Test change request, S3): the three original templates.
    for (const q of levelsFor(states, TEMPLATES.slice(0, 3))) {
      const key = `${q.templateId}/${nearCount(q)}`;
      const set = groups.get(key) ?? new Set<number>();
      set.add(q.level);
      groups.set(key, set);
    }
    expect(groups.size).toBeGreaterThan(3);
    for (const [key, set] of groups) expect({ key, levels: set.size }).toEqual({ key, levels: 1 });
  });
});

// ---- spread ----

describe("T-023 criterion 19: spread over the real bank", () => {
  test("each template's 50 questions take at least 2 distinct levels", () => {
    const out = levelsFor(bank());
    for (const t of TPL_IDS) {
      const mine = out.filter((q) => q.templateId === t);
      expect(mine.length).toBe(50);
      expect(new Set(mine.map((q) => q.level)).size).toBeGreaterThanOrEqual(2);
    }
  });
});

// ---- One documented place ----

type Leaf = { path: (string | number)[]; value: number };
function numericLeaves(v: unknown, path: (string | number)[] = []): Leaf[] {
  if (typeof v === "number") return [{ path, value: v }];
  if (Array.isArray(v)) return v.flatMap((x, i) => numericLeaves(x, [...path, i]));
  if (v && typeof v === "object")
    return Object.entries(v).flatMap(([k, x]) => numericLeaves(x, [...path, k]));
  return [];
}
function setLeaf(path: (string | number)[], value: number) {
  let o = LEVEL_SEED_WEIGHTS as unknown as Record<string | number, unknown>;
  for (const k of path.slice(0, -1)) o = o[k] as Record<string | number, unknown>;
  o[path[path.length - 1] as string | number] = value;
}

/** The committed bank, plus synthetic variants that reach every branch. */
function corpus(): number[] {
  const out: number[] = [];
  out.push(...levelsFor(bank()).map((q) => q.level));
  const nullRanks = bank().map((e) =>
    e.id === sid("AK") ? { ...e, population_rank: null, area_rank: null } : e,
  );
  out.push(...levelsFor(nullRanks).map((q) => q.level));
  out.push(...levelsFor(bank(), withBase(0)).map((q) => q.level));
  out.push(...levelsFor(bank(), withBase(18)).map((q) => q.level));
  const unknown = TEMPLATES.map((t) => ({ ...structuredClone(t), id: `${t.id}-x` }));
  out.push(...levelsFor(bank(), unknown).map((q) => q.level));
  return out;
}

describe("T-023 criterion 20: every number in LEVEL_SEED_WEIGHTS is live", () => {
  test("changing any one numeric value by +1 or -1 changes at least one level (reverted after each)", () => {
    const baseline = corpus();
    const leaves = numericLeaves(LEVEL_SEED_WEIGHTS);
    expect(leaves.length).toBeGreaterThanOrEqual(8);
    const dead: string[] = [];
    for (const { path, value } of leaves) {
      for (const delta of [1, -1]) {
        try {
          setLeaf(path, value + delta);
          const mutated = corpus();
          if (mutated.every((l, i) => l === baseline[i]))
            dead.push(`${path.join(".")}${delta > 0 ? "+1" : "-1"}`);
        } finally {
          setLeaf(path, value);
        }
      }
    }
    expect(dead).toEqual([]);
    expect(corpus()).toEqual(baseline);
    // T-026 (approved Test change request row 68): the bank is 2.8x bigger, so on
    // CI this outruns bun's 5 s default. The assertions are unchanged.
  }, 60_000);
});

function decisions(): string {
  return readFileSync(DECISIONS, "utf8");
}
function e22(): string {
  const t = decisions();
  const start = t.indexOf("## E-22 ");
  if (start === -1) return "";
  const next = t.indexOf("\n## ", start + 1);
  return t.slice(start, next === -1 ? undefined : next);
}

describe("T-023 criterion 21: engineering-decisions.md E-22", () => {
  test("exactly one E-22 heading, and every E-n number is distinct", () => {
    const nums = [...decisions().matchAll(/^## E-(\d+)\b/gm)].map((m) => Number(m[1]));
    expect(nums.filter((n) => n === 22).length).toBe(1);
    expect(nums).toContain(21);
    expect(new Set(nums).size).toBe(nums.length);
  });

  test("names all five formula terms, the stage and the constant", () => {
    const e = e22();
    for (const term of [
      "base_level",
      "entity_obscurity",
      "distractor_tightness",
      "concept_load",
      "familiarity_bonus",
      "seedLevels",
      "LEVEL_SEED_WEIGHTS",
    ])
      expect(e).toContain(term);
  });

  test("every key of the constant appears with its value on the same line", () => {
    const lines = e22().split("\n");
    const lineWith = (key: string) => lines.filter((l) => l.includes(key));
    for (const [k, v] of Object.entries(LEVEL_SEED_WEIGHTS)) {
      if (typeof v === "number") {
        expect({ k, ok: lineWith(k).some((l) => new RegExp(`${k}\\W+${v}\\b`).test(l)) }).toEqual({
          k,
          ok: true,
        });
      } else if (Array.isArray(v)) {
        expect({ k, ok: lineWith(k).some((l) => v.every((x) => l.includes(String(x)))) }).toEqual({
          k,
          ok: true,
        });
      } else {
        expect(lineWith(k).length).toBeGreaterThan(0);
        for (const [sk, sv] of Object.entries(v as Record<string, number>)) {
          const ok = lines.some((l) => new RegExp(`${sk}"?\\W+${sv}\\b`).test(l));
          expect({ sk, ok }).toEqual({ sk, ok: true });
        }
      }
    }
  });

  test("records near/far, the missing-rank rule, why familiarity_bonus is 0, and Revisit when", () => {
    const e = e22();
    expect(e).toMatch(/\bnear\b/i);
    expect(e).toMatch(/\bfar\b/i);
    expect(e).toContain("borders");
    expect(e).toMatch(/region/);
    expect(e).toMatch(/missing rank/i);
    expect(e).toMatch(/home state/i);
    expect(e).toMatch(/famous/i);
    expect(e).toMatch(/Revisit when/);
  });
});

// ---- What must not happen ----

describe("T-023 criteria 22-24: nothing upstream moved, and the pipeline does not import the stage", () => {
  test("criterion 22: neither generate nor buildChoices returns a level key", () => {
    const states = bank();
    const { drafts } = generate(states, TEMPLATES);
    for (const d of drafts) expect(Object.hasOwn(d, "level")).toBe(false);
    for (const q of buildChoices(drafts, states, TEMPLATES).questions)
      expect(Object.hasOwn(q, "level")).toBe(false);
  });

  test("criterion 23: every TEMPLATES entry has exactly the nine Template keys", () => {
    const nine = [
      "answer_field",
      "applies_to",
      "base_difficulty",
      "distractor_strategy",
      "format",
      "id",
      "min_age_band",
      "prompt",
      "requires",
    ];
    expect(TEMPLATES.length).toBe(9); // T-026: six templates added (approved row 69)
    for (const t of TEMPLATES) {
      expect(Object.keys(t).sort()).toEqual(nine);
      expect(validateTemplate(t)).toEqual([]);
    }
  });

  test("criterion 24: build.ts, refresh.ts and normalize.ts never reach seed-level.ts", () => {
    const seen = new Set<string>();
    const queue = ["build.ts", "refresh.ts", "normalize.ts"];
    while (queue.length > 0) {
      const file = queue.shift() as string;
      if (seen.has(file)) continue;
      seen.add(file);
      const text = readFileSync(join(SRC, file), "utf8");
      const specs = [
        ...text.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["'](\.[^"']+)["']/g),
      ].map((m) => m[1] as string);
      for (const spec of specs) {
        const rel = join(file, "..", spec).replace(/^\.\//, "");
        if (rel.endsWith(".ts")) queue.push(rel);
        else if (existsSync(join(SRC, `${rel}.ts`))) queue.push(`${rel}.ts`);
        else queue.push(join(rel, "index.ts"));
      }
    }
    expect(seen.size).toBeGreaterThan(3);
    expect(seen.has("seed-level.ts")).toBe(false);
  });
});

// ---- Constraints: errors ----

describe("T-023 constraints: unknown entityId or templateId throws, naming the question", () => {
  test("an entityId not among the entities throws with the question id", () => {
    const states = bank();
    const qs = questionsFor(states);
    const lone = qs.find((q) => q.entityId === sid("WY")) as GeneratedQuestion;
    expect(() =>
      seedLevels(
        [lone],
        states.filter((e) => e.id !== sid("WY")),
        TEMPLATES,
      ),
    ).toThrow(lone.id);
  });

  test("a templateId not among the templates throws with the question id", () => {
    const states = bank();
    const qs = questionsFor(states);
    const lone = qs.find((q) => q.templateId === CLICK) as GeneratedQuestion;
    expect(() =>
      seedLevels(
        [lone],
        states,
        TEMPLATES.filter((t) => t.id !== CLICK),
      ),
    ).toThrow(lone.id);
  });
});
