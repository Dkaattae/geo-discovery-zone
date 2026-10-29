/**
 * T-085a, written by the worker. The tester's verify file is the independent
 * check; these pin what the worker was unsure of: that the drawn-apart
 * reduction follows the entity id and the template id, and that the clamp
 * holds under it. Pure: synthetic input, plus the committed bank read from
 * disk. No network.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChoices } from "./distractors";
import { generate } from "./generate";
import { LEVEL_SEED_WEIGHTS, seedLevels } from "./seed-level";
import type { Template } from "./templates";
import type { Entity } from "./types";

const STATES_DIR = join(import.meta.dirname, "..", "data", "us-states");

/** A multiple-choice template asking the capital, under the id given. */
function tpl(id: string, base_difficulty = 2): Template {
  return {
    id,
    prompt: "What is the capital of {name}?",
    answer_field: "capital",
    distractor_strategy: "sibling_capitals_same_region",
    requires: ["name", "capital"],
    applies_to: ["state"],
    format: "multiple_choice",
    base_difficulty,
    min_age_band: 1,
  };
}

/** `ownId` plus three far peers; every rank 1, so obscurity and tightness are 0. */
function entities(ownId: string): Entity[] {
  return [ownId, "x-1", "x-2", "x-3"].map(
    (id, i) =>
      ({
        id,
        type: "state",
        scope: "us",
        name: `S${i}`,
        capital: `Cap ${i}`,
        region: `R${i}`,
        centroid: [i, 0],
        population_rank: 1,
        area_rank: 1,
      }) as unknown as Entity,
  );
}

function levelOf(ownId: string, template: Template): number {
  const es = entities(ownId);
  const { questions } = buildChoices(generate(es, [template]).drafts, es, [template]);
  const q = seedLevels(questions, es, [template]).find((l) => l.entityId === ownId);
  if (q === undefined) throw new Error(`no question for ${ownId}`);
  return q.level;
}

describe("T-085a: the drawn-apart input follows the entity and the template", () => {
  test("us-state-hi on tpl-identify-on-map is 2 below an otherwise identical entity", () => {
    const t = tpl("tpl-identify-on-map", 5);
    expect(levelOf("x-other", t) - levelOf("us-state-hi", t)).toBe(2);
  });

  test("each of the three templates lowers both states by the constant's amount", () => {
    for (const id of LEVEL_SEED_WEIGHTS.familiarity_bonus_templates)
      for (const state of LEVEL_SEED_WEIGHTS.familiarity_bonus_states)
        expect({
          id,
          state,
          drop: levelOf("x-other", tpl(id, 5)) - levelOf(state, tpl(id, 5)),
        }).toEqual({ id, state, drop: LEVEL_SEED_WEIGHTS.familiarity_bonus });
  });

  test("a template outside the three gets no reduction for HI or AK", () => {
    for (const id of ["tpl-capital-of", "tpl-crop-of", "tpl-not-listed"])
      for (const state of ["us-state-hi", "us-state-ak"])
        expect({
          id,
          state,
          drop: levelOf("x-other", tpl(id, 5)) - levelOf(state, tpl(id, 5)),
        }).toEqual({ id, state, drop: 0 });
  });
});

describe("T-085a: the clamp holds under the reduction", () => {
  test("2 before the reduction gives 0, 1.5 gives 0, 2.5 gives 0.5", () => {
    // tpl-identify-on-map has concept_load 0, so the level before the
    // reduction is exactly base_difficulty.
    expect(levelOf("x-other", tpl("tpl-identify-on-map", 2))).toBe(2);
    expect(levelOf("us-state-hi", tpl("tpl-identify-on-map", 2))).toBe(0);
    expect(levelOf("us-state-hi", tpl("tpl-identify-on-map", 1.5))).toBe(0);
    expect(Object.is(levelOf("us-state-hi", tpl("tpl-identify-on-map", 1.5)), -0)).toBe(false);
    expect(levelOf("us-state-hi", tpl("tpl-identify-on-map", 2.5))).toBe(0.5);
  });
});

describe("T-085a: over the committed bank", () => {
  function bankLevels(): Map<string, number> {
    const es = readdirSync(STATES_DIR)
      .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
      .sort()
      .map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
    const { questions } = buildChoices(generate(es).drafts, es);
    return new Map(seedLevels(questions, es).map((q) => [q.id, q.level]));
  }

  test("amount 0 and amount 3 move exactly the six drawn-apart questions", () => {
    const saved = LEVEL_SEED_WEIGHTS.familiarity_bonus;
    try {
      const at2 = bankLevels();
      LEVEL_SEED_WEIGHTS.familiarity_bonus = 0;
      const at0 = bankLevels();
      LEVEL_SEED_WEIGHTS.familiarity_bonus = 3;
      const at3 = bankLevels();
      const moved0 = [...at2]
        .filter(([id, v]) => at0.get(id) !== v)
        .map(([id]) => id)
        .sort();
      const moved3 = [...at0]
        .filter(([id, v]) => at3.get(id) !== v)
        .map(([id]) => id)
        .sort();
      const six = ["identify-on-map", "click-the-map", "climate-of"]
        .flatMap((t) => ["hi", "ak"].map((s) => `gen:tpl-${t}:us-state-${s}`))
        .sort();
      expect(at2.size).toBe(415);
      expect(moved0).toEqual(six);
      expect(moved3).toEqual(six);
      for (const id of six) expect((at0.get(id) as number) - (at3.get(id) as number)).toBe(3);
    } finally {
      LEVEL_SEED_WEIGHTS.familiarity_bonus = saved;
    }
  });
});
