/**
 * T-023, written by the worker. The tester's verify file is the independent
 * check; these pin what the worker was unsure of. Pure: the only file I/O is
 * reading the committed bank and engineering-decisions.md.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChoices } from "./distractors";
import { generate } from "./generate";
import { LEVEL_SEED_WEIGHTS, seedLevels } from "./seed-level";
import { TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";

const SRC = import.meta.dirname;
const STATES_DIR = join(SRC, "..", "data", "us-states");
const DECISIONS = join(SRC, "..", "..", "engineering-decisions.md");

function bank(): Entity[] {
  return readdirSync(STATES_DIR)
    .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
}

function run(entities: Entity[], templates: Template[] = TEMPLATES) {
  const { questions } = buildChoices(generate(entities, templates).drafts, entities, templates);
  return { questions, leveled: seedLevels(questions, entities, templates) };
}

const capital: Template = {
  id: "tpl-capital-of",
  prompt: "What is the capital of {name}?",
  answer_field: "capital",
  distractor_strategy: "sibling_capitals_same_region",
  requires: ["name", "capital"],
  applies_to: ["state"],
  format: "multiple_choice",
  base_difficulty: 2,
  min_age_band: 1,
};

/** A, plus three others in `region` `peers` (near) or elsewhere (far). */
function synthetic(
  rank: { population_rank?: unknown; area_rank?: unknown },
  near: number,
): Entity[] {
  const own = {
    id: "x-a",
    type: "state",
    scope: "us",
    name: "A",
    capital: "Cap A",
    region: "R",
    centroid: [0, 0],
    ...rank,
  } as unknown as Entity;
  const others: Entity[] = [1, 2, 3].map((i) => ({
    id: `x-${i}`,
    type: "state",
    scope: "us",
    name: `S${i}`,
    capital: `Cap ${i}`,
    region: i <= near ? "R" : `Far${i}`,
    centroid: [i, 0],
    population_rank: 1,
    area_rank: 1,
  }));
  return [own, ...others];
}

function levelOfA(
  rank: { population_rank?: unknown; area_rank?: unknown },
  near: number,
  t: Template = capital,
): number {
  const entities = synthetic(rank, near);
  const q = run(entities, [t]).leveled.find((l) => l.entityId === "x-a");
  if (q === undefined) throw new Error("no question for x-a");
  return q.level;
}

describe("seedLevels over the committed bank", () => {
  test("150 questions, same ids and order, level in 0-18, nothing else changed", () => {
    const { questions, leveled } = run(bank());
    expect(leveled.map((q) => q.id)).toEqual(questions.map((q) => q.id));
    expect(leveled.length).toBe(150);
    leveled.forEach((q, i) => {
      expect(Number.isFinite(q.level)).toBe(true);
      expect(q.level).toBeGreaterThanOrEqual(0);
      expect(q.level).toBeLessThanOrEqual(18);
      const { level: _, ...rest } = q;
      expect(rest).toEqual(questions[i] as never);
    });
  });

  test("each template takes at least 2 distinct levels", () => {
    const { leveled } = run(bank());
    for (const t of TEMPLATES) {
      const levels = new Set(leveled.filter((q) => q.templateId === t.id).map((q) => q.level));
      expect(levels.size).toBeGreaterThanOrEqual(2);
    }
  });

  test("reversing the entities leaves every level unchanged", () => {
    const forward = new Map(run(bank()).leveled.map((q) => [q.id, q.level]));
    const reversed = run(bank().reverse()).leveled;
    for (const q of reversed) expect(q.level).toBe(forward.get(q.id) as number);
  });

  test("buildChoices output carries no level", () => {
    for (const q of run(bank()).questions) expect(Object.hasOwn(q, "level")).toBe(false);
  });
});

describe("the terms", () => {
  test("obscurity: rank 50/50 is harder than rank 1/1", () => {
    expect(levelOfA({ population_rank: 50, area_rank: 50 }, 0)).toBeGreaterThan(
      levelOfA({ population_rank: 1, area_rank: 1 }, 0),
    );
  });

  test("a missing rank in any form counts as the same thing, within rank 1-50", () => {
    const forms: unknown[] = [null, undefined, 0, -3, 2.5, Number.NaN, "7"];
    const pop = forms.map((v) =>
      levelOfA(v === undefined ? { area_rank: 5 } : { population_rank: v, area_rank: 5 }, 1),
    );
    expect(new Set(pop).size).toBe(1);
    const both = forms.map((v) =>
      levelOfA(v === undefined ? {} : { population_rank: v, area_rank: v }, 1),
    );
    expect(new Set(both).size).toBe(1);
    const real = Array.from({ length: 50 }, (_, i) =>
      levelOfA({ population_rank: i + 1, area_rank: 5 }, 1),
    );
    expect(real).toContain(pop[0] as number);
  });

  test("tightness: never decreases with near count, and 3 near > 0 near", () => {
    const levels = [0, 1, 2, 3].map((k) => levelOfA({ population_rank: 20, area_rank: 20 }, k));
    for (let k = 0; k < 3; k++)
      expect(levels[k + 1] as number).toBeGreaterThanOrEqual(levels[k] as number);
    expect(levels[3] as number).toBeGreaterThan(levels[0] as number);
  });

  test("base_difficulty shifts the level one for one, and the clamp holds at 0 and 18", () => {
    const at = (b: number, rank: number | null, k: number) =>
      levelOfA({ population_rank: rank, area_rank: rank }, k, { ...capital, base_difficulty: b });
    expect(at(5, 30, 2) - at(2, 30, 2)).toBeCloseTo(3, 9);
    for (const rank of [1, 25, 50, null])
      for (const k of [0, 1, 2, 3]) {
        expect(at(18, rank, k)).toBeLessThanOrEqual(18);
        expect(at(0, rank, k)).toBeGreaterThanOrEqual(0);
      }
  });

  test("an unknown template id gets concept_load_default", () => {
    const known = levelOfA({ population_rank: 1, area_rank: 1 }, 0);
    const other = levelOfA({ population_rank: 1, area_rank: 1 }, 0, {
      ...capital,
      id: "tpl-not-listed",
    });
    expect(other - known).toBeCloseTo(
      LEVEL_SEED_WEIGHTS.concept_load_default -
        (LEVEL_SEED_WEIGHTS.concept_load["tpl-capital-of"] as number),
      9,
    );
  });

  test("a question naming an unknown entity or template throws with its id", () => {
    const entities = synthetic({}, 0);
    const { questions } = run(entities, [capital]);
    expect(() => seedLevels(questions, entities.slice(1), [capital])).toThrow(
      questions[0]?.id as string,
    );
    expect(() => seedLevels(questions, entities, [])).toThrow(questions[0]?.id as string);
  });
});

describe("E-22 records the constant", () => {
  test("one E-22 heading, and every key and numeric value of LEVEL_SEED_WEIGHTS in it", () => {
    const text = readFileSync(DECISIONS, "utf8");
    const nums = [...text.matchAll(/^## E-(\d+)\b/gm)].map((m) => Number(m[1]));
    expect(nums.filter((n) => n === 22).length).toBe(1);
    expect(new Set(nums).size).toBe(nums.length);
    const start = text.indexOf("## E-22 ");
    const next = text.indexOf("\n## ", start + 1);
    const entry = text.slice(start, next === -1 ? undefined : next);
    expect(entry).toContain("seedLevels");
    expect(entry).toContain("LEVEL_SEED_WEIGHTS");
    for (const [key, value] of Object.entries(LEVEL_SEED_WEIGHTS)) {
      expect(entry).toContain(key);
      if (typeof value === "number") expect(entry).toContain(`${key}: ${value}`);
      else if (Array.isArray(value)) expect(entry).toContain(`${key}: [${value.join(", ")}]`);
      else
        for (const [k, v] of Object.entries(value)) expect(entry).toContain(`"${k}": ${String(v)}`);
    }
  });
});
