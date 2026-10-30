/**
 * T-088 (worker): the "also grown / raised" lists and the five added farm
 * animals, over the committed bank and over small synthetic inputs.
 *
 * Pure: `generate` and `buildChoices` are called directly. The only file I/O
 * is reading committed files. No network, no spawn.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  ADDED_FARM_ANIMALS,
  AGRICULTURE_SAME_THING_PAIRS,
  ALSO_GROWN,
  ALSO_RAISED,
  buildChoices,
} from "./distractors";
import { generate } from "./generate";
import type { TaggedQuestion } from "./tags";
import { TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";
import { loadCommittedEntities, REPO_ROOT } from "./write-questions";

const tpl = (id: string): Template => {
  const found = TEMPLATES.find((t) => t.id === id);
  if (found === undefined) throw new Error(`no template ${id}`);
  return found;
};
const CROPS = tpl("tpl-crop-of");
const FARM = tpl("tpl-farm-animal-of");

const entities = loadCommittedEntities();
const byId = new Map(entities.map((e) => [e.id, e]));
const committed = JSON.parse(
  readFileSync(join(REPO_ROOT, "question-bank/data/questions/us-states.json"), "utf8"),
) as { questions: TaggedQuestion[] };

const lower = (s: string) => s.trim().toLowerCase();
const listOf = (e: Entity, field: string): string[] => {
  const v = (e as unknown as Record<string, unknown>)[field];
  return Array.isArray(v) ? (v as string[]) : [];
};
const codeOf = (id: string) => id.slice(-2).toUpperCase();
const wrongOf = (q: { choices?: string[]; correctIndex?: number }): string[] =>
  (q.choices as string[]).filter((_, i) => i !== q.correctIndex);
const ofTemplate = (id: string) => committed.questions.filter((q) => q.templateId === id);

const STATE_ANIMALS = ["chickens", "cattle", "dairy cows", "pigs", "turkeys", "sheep"];

describe("T-088 — the committed farm-animal questions", () => {
  const farm = ofTemplate(FARM.id);

  test("24 questions, four distinct choices, answer at correctIndex", () => {
    expect(farm).toHaveLength(24);
    for (const q of farm) {
      const choices = q.choices as string[];
      expect(choices).toHaveLength(4);
      expect(new Set(choices.map(lower)).size).toBe(4);
      expect(choices[q.correctIndex as number]).toBe(q.answer);
    }
  });

  test("every wrong answer is one of the eleven, never the state's own or its Table A row", () => {
    const eleven = new Set([...STATE_ANIMALS, ...ADDED_FARM_ANIMALS]);
    expect(eleven.size).toBe(11);
    for (const q of farm) {
      const own = byId.get(q.entityId) as Entity;
      const banned = [...listOf(own, "top_livestock"), ...(ALSO_RAISED[codeOf(q.entityId)] ?? [])];
      for (const w of wrongOf(q)) {
        expect([q.id, eleven.has(w)]).toEqual([q.id, true]);
        expect([q.id, w, banned.map(lower).includes(lower(w))]).toEqual([q.id, w, false]);
      }
    }
  });

  test("Table A has exactly the 24 states with top_livestock", () => {
    const withLivestock = entities.filter((e) => listOf(e, "top_livestock").length > 0);
    expect(Object.keys(ALSO_RAISED).sort()).toEqual(withLivestock.map((e) => codeOf(e.id)).sort());
  });

  test("never cattle and dairy cows together", () => {
    for (const q of farm) {
      const c = (q.choices as string[]).map(lower);
      expect([q.id, c.includes("cattle") && c.includes("dairy cows")]).toEqual([q.id, false]);
    }
  });

  test("the boundary states: PA and CA", () => {
    const pa = farm.find((q) => q.entityId === "us-state-pa") as TaggedQuestion;
    const ca = farm.find((q) => q.entityId === "us-state-ca") as TaggedQuestion;
    expect(new Set(wrongOf(pa))).toEqual(new Set(["sheep", "rabbits", "bison"]));
    expect(new Set(wrongOf(ca))).toEqual(new Set(["pigs", "rabbits", "bison"]));
  });

  test("the added animals are never an answer and in no entity field", () => {
    for (const q of committed.questions) {
      expect([q.id, ADDED_FARM_ANIMALS.includes(lower(String(q.answer)))]).toEqual([q.id, false]);
    }
    for (const e of entities) {
      const values = JSON.stringify(Object.values(e)).toLowerCase();
      for (const a of ADDED_FARM_ANIMALS) {
        // Whole-string JSON values only: "goats" inside a sentence is not a field value.
        expect([e.id, a, values.includes(`"${a}"`)]).toEqual([e.id, a, false]);
      }
    }
  });
});

describe("T-088 — the committed crop questions", () => {
  const crops = ofTemplate(CROPS.id);

  test("50 questions; no wrong answer in Table B, T-026's rules still hold", () => {
    expect(crops).toHaveLength(50);
    for (const q of crops) {
      const own = byId.get(q.entityId) as Entity;
      const borders = listOf(own, "borders");
      const nearby = entities.filter(
        (e) => e.id === own.id || borders.includes(e.id) || e.region === own.region,
      );
      const banned = new Set(
        [
          ...nearby.flatMap((e) => listOf(e, "top_crops")),
          ...(ALSO_GROWN[codeOf(q.entityId)] ?? []),
        ].map(lower),
      );
      const otherCrops = new Set(
        entities.filter((e) => e.id !== own.id).flatMap((e) => listOf(e, "top_crops").map(lower)),
      );
      const choices = (q.choices as string[]).map(lower);
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      for (const w of wrongOf(q)) {
        expect([q.id, w, banned.has(lower(w))]).toEqual([q.id, w, false]);
        expect([q.id, w, otherCrops.has(lower(w))]).toEqual([q.id, w, true]);
      }
      for (const [a, b] of AGRICULTURE_SAME_THING_PAIRS) {
        expect([q.id, a, choices.includes(a) && choices.includes(b)]).toEqual([q.id, a, false]);
      }
    }
  });
});

// --- synthetic inputs -------------------------------------------------------

function state(
  id: string,
  centroid: [number, number],
  region: string,
  fields: Record<string, unknown>,
): Entity {
  return {
    id,
    type: "state",
    scope: "us",
    name: id,
    region,
    centroid,
    borders: [],
    ...fields,
  } as unknown as Entity;
}

function run(input: Entity[], template: Template) {
  return buildChoices(generate(input, [template]).drafts, input, [template]);
}

const questionOf = (out: ReturnType<typeof run>, entityId: string) => {
  const q = out.questions.find((x) => x.entityId === entityId);
  if (q === undefined) throw new Error(`no question for ${entityId}`);
  return q;
};

describe("T-088 — the rule lives in buildChoices", () => {
  // Every entity in its own region, no borders: only Table B can exclude.
  const crops = [
    state("us-state-ia", [0, 0], "R1", { top_crops: ["corn"] }),
    state("us-state-hi", [0.1, 0], "R2", { top_crops: ["taro"] }),
    state("not-a-state-ia", [0, 0.05], "R5", { top_crops: ["corn"] }),
    state("us-state-zz", [0.01, 0], "R3", { top_crops: ["hay"] }),
    state("us-state-yy", [5, 0], "R4", { top_crops: ["rice", "beans", "oats"] }),
  ];

  test("a Table B crop that would be nearest is skipped for its state, offered elsewhere", () => {
    const out = run(crops, CROPS);
    expect(wrongOf(questionOf(out, "us-state-ia"))).not.toContain("hay");
    expect(wrongOf(questionOf(out, "us-state-hi"))).toContain("hay");
  });

  test("an id that is not us-state-<xx> gets no Table B exclusion", () => {
    expect(wrongOf(questionOf(run(crops, CROPS), "not-a-state-ia"))).toContain("hay");
  });

  const farm = [
    state("us-state-tx", [0, 0], "R1", { top_livestock: ["cattle"] }),
    state("us-state-hi", [0.1, 0], "R2", { top_livestock: ["llamas"] }),
    state("tx", [0, 0.05], "R5", { top_livestock: ["cattle"] }),
    state("us-state-zz", [0.01, 0], "R3", { top_livestock: ["chickens"] }),
    state("us-state-yy", [5, 0], "R4", { top_livestock: ["pigs", "geese", "emus"] }),
  ];

  test("a Table A animal that would be nearest is skipped for its state, offered elsewhere", () => {
    const out = run(farm, FARM);
    expect(wrongOf(questionOf(out, "us-state-tx"))).not.toContain("chickens");
    expect(wrongOf(questionOf(out, "us-state-hi"))).toContain("chickens");
  });

  test("an id that is not us-state-<xx> gets no Table A exclusion", () => {
    expect(wrongOf(questionOf(run(farm, FARM), "tx"))).toContain("chickens");
  });

  test("the added animals come after every entity animal, in listed order", () => {
    const two = [
      state("us-state-de", [0, 0], "R1", { top_livestock: ["chickens"] }),
      state("us-state-vt", [1, 0], "R2", { top_livestock: ["pigs"] }),
    ];
    const out = run(two, FARM);
    expect(out.shortPools).toEqual([]);
    expect(wrongOf(questionOf(out, "us-state-de"))).toEqual(["pigs", "goats", "horses"]);
  });

  test("added animals respect Table A and the answer", () => {
    // PA excludes goats, horses, ducks: rabbits and bison remain.
    const two = [
      state("us-state-pa", [0, 0], "R1", { top_livestock: ["dairy cows"] }),
      state("us-state-vt", [1, 0], "R2", { top_livestock: ["sheep"] }),
    ];
    const pa = questionOf(run(two, FARM), "us-state-pa");
    expect(wrongOf(pa)).toEqual(["sheep", "rabbits", "bison"]);
  });

  test("crops get no fixed pool: a short crop pool stays short", () => {
    const two = [
      state("us-state-de", [0, 0], "R1", { top_crops: ["corn"] }),
      state("us-state-hi", [1, 0], "R2", { top_crops: ["taro"] }),
    ];
    const out = run(two, CROPS);
    expect(out.questions).toEqual([]);
    expect(out.shortPools.map((p) => p.reason)).toEqual([
      "too_few_candidates",
      "too_few_candidates",
    ]);
  });

  test("deterministic: two calls give deep-equal output", () => {
    const all = generate(entities).drafts;
    expect(buildChoices(all, entities)).toEqual(buildChoices(all, entities));
  });
});
