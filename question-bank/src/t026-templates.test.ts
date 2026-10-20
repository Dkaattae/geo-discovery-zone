import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  AGRICULTURE_SAME_THING_PAIRS,
  buildChoices,
  LANDMARK_TRAPS,
  SAME_ANIMAL_PAIRS,
  SAME_CLIMATE_GROUPS,
  SAME_LANDMARK_PAIRS,
} from "./distractors";
import { generate } from "./generate";
import { buildQuestionBank } from "./question-file";
import { LEVEL_SEED_WEIGHTS } from "./seed-level";
import type { TaggedQuestion } from "./tags";
import { TEMPLATE_TOPICS, TEMPLATES, type Template, validateTemplate } from "./templates";
import type { Entity } from "./types";
import { loadCommittedEntities, REPO_ROOT } from "./write-questions";

/**
 * T-026 worker tests: the six new templates over the committed bank, and the
 * two pipeline changes they needed (`validateTemplate`'s two new refusals, a
 * list-valued answer field). Reads committed files only; writes nothing,
 * reaches no network, mocks nothing. The tester's suite is the check on the
 * brief; this is the worker's own safety net.
 */

const NEW_TEMPLATES: Record<string, { topic: string; answer: string }> = {
  "tpl-biggest-state": { topic: "superlative", answer: "name" },
  "tpl-state-animal-of": { topic: "wildlife", answer: "state_animal" },
  "tpl-landmark-in": { topic: "landmark", answer: "landmark" },
  "tpl-climate-of": { topic: "climate", answer: "climate_kid" },
  "tpl-crop-of": { topic: "agriculture", answer: "top_crops" },
  "tpl-farm-animal-of": { topic: "agriculture", answer: "top_livestock" },
};

const entities = loadCommittedEntities();
const bank = buildQuestionBank(entities);
const byCode = new Map(entities.map((e) => [e.id.slice(-2).toUpperCase(), e]));
const byId = new Map(entities.map((e) => [e.id, e]));

function questionsOf(templateId: string): TaggedQuestion[] {
  return bank.questions.filter((q) => q.templateId === templateId);
}

function wrong(q: TaggedQuestion): string[] {
  return q.choices.filter((_, i) => i !== q.correctIndex);
}

function entityOf(q: TaggedQuestion): Entity {
  const e = byId.get(q.entityId);
  if (e === undefined) throw new Error(`no entity ${q.entityId}`);
  return e;
}

function list(e: Entity, field: "top_crops" | "top_livestock"): string[] {
  return e[field] ?? [];
}

function hasPair(choices: string[], [a, b]: readonly [string, string]): boolean {
  return choices.includes(a) && choices.includes(b);
}

const template = (id: string): Template => {
  const t = TEMPLATES.find((x) => x.id === id);
  if (t === undefined) throw new Error(`no template ${id}`);
  return t;
};

describe("the six templates", () => {
  test("each exists once, validates, is multiple_choice for states, with its topic and answer field", () => {
    expect(TEMPLATES).toHaveLength(9);
    for (const [id, want] of Object.entries(NEW_TEMPLATES)) {
      const t = template(id);
      expect(validateTemplate(t)).toEqual([]);
      expect(t.format).toBe("multiple_choice");
      expect(t.applies_to).toContain("state");
      expect(TEMPLATE_TOPICS[id]).toBe(want.topic as never);
      expect(t.answer_field).toBe(want.answer as never);
      expect(Object.hasOwn(LEVEL_SEED_WEIGHTS.concept_load, id)).toBe(true);
    }
  });

  test("curated prompts carry {name} once and no other token; the superlative none", () => {
    for (const id of Object.keys(NEW_TEMPLATES)) {
      const tokens = [...template(id).prompt.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]);
      expect(tokens).toEqual(id === "tpl-biggest-state" ? [] : ["name"]);
    }
  });

  test("counts: 47, 50, 44, 50, 50, 24; 415 in all", () => {
    const counts = Object.fromEntries(
      Object.keys(NEW_TEMPLATES).map((id) => [id, questionsOf(id).length]),
    );
    expect(counts).toEqual({
      "tpl-biggest-state": 47,
      "tpl-state-animal-of": 50,
      "tpl-landmark-in": 50 - 6,
      "tpl-climate-of": 50,
      "tpl-crop-of": 50,
      "tpl-farm-animal-of": 24,
    });
    expect(bank.questions).toHaveLength(415);
  });

  test("four distinct choices, and choices[correctIndex] is the answer", () => {
    for (const q of bank.questions) {
      if (!(q.templateId in NEW_TEMPLATES)) continue;
      expect(new Set(q.choices.map((c) => c.trim().toLowerCase())).size).toBe(4);
      expect(q.choices[q.correctIndex]).toBe(q.answer);
      expect(q.level).toBeGreaterThanOrEqual(0);
      expect(q.level).toBeLessThanOrEqual(18);
    }
  });

  test("the committed question file holds this bank", () => {
    const file = JSON.parse(
      readFileSync(join(REPO_ROOT, "question-bank/data/questions/us-states.json"), "utf8"),
    ) as { count: number; questions: unknown[] };
    expect(file.count).toBe(415);
    expect(file.questions).toEqual(JSON.parse(JSON.stringify(bank.questions)));
  });
});

describe("superlative", () => {
  test("ranks 1-47 are answers; the three wrong choices are exactly ranks r+1..r+3", () => {
    const byRank = new Map(entities.map((e) => [e.area_rank, e.name]));
    const qs = questionsOf("tpl-biggest-state");
    expect(qs.map((q) => entityOf(q).area_rank).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(
      Array.from({ length: 47 }, (_, i) => i + 1),
    );
    for (const q of qs) {
      const r = entityOf(q).area_rank as number;
      expect(q.answer).toBe(byRank.get(r) as string);
      expect(wrong(q).sort()).toEqual([1, 2, 3].map((k) => byRank.get(r + k) as string).sort());
    }
  });

  test("ranks 48-50 are reported as short pools, not dropped silently", () => {
    expect(bank.shortPools.map((p) => p.draftId).sort()).toEqual([
      "gen:tpl-biggest-state:us-state-ct",
      "gen:tpl-biggest-state:us-state-de",
      "gen:tpl-biggest-state:us-state-ri",
    ]);
  });

  test("one prompt, with no unit or measuring word", () => {
    const prompts = new Set(questionsOf("tpl-biggest-state").map((q) => q.prompt));
    expect(prompts.size).toBe(1);
    const [prompt] = [...prompts] as [string];
    for (const word of ["km", "area", "rank", "square", "land", "water"])
      expect(prompt.toLowerCase()).not.toContain(word);
  });
});

describe("wildlife", () => {
  test("answer is the state animal, and no same-animal pair shares a question", () => {
    for (const q of questionsOf("tpl-state-animal-of")) {
      expect(q.answer).toBe(entityOf(q).state_animal as string);
      for (const pair of SAME_ANIMAL_PAIRS) expect(hasPair(q.choices, pair)).toBe(false);
    }
  });

  test("the pair list is the brief's five, verbatim", () => {
    expect(SAME_ANIMAL_PAIRS).toEqual([
      ["Black bear", "American black bear"],
      ["Grizzly bear", "California grizzly bear"],
      ["Gray squirrel", "Eastern gray squirrel"],
      ["Horse", "Morgan horse"],
      ["Desert bighorn sheep", "Rocky Mountain bighorn sheep"],
    ]);
  });
});

describe("landmark", () => {
  test("no blank-landmark state is asked about; distractors are other states' landmarks", () => {
    const landmarks = new Set(entities.map((e) => e.landmark).filter(Boolean));
    const asked = new Set(questionsOf("tpl-landmark-in").map((q) => q.entityId.slice(-2)));
    for (const code of ["de", "ia", "ks", "ms", "ok", "ri"]) expect(asked.has(code)).toBe(false);
    for (const q of questionsOf("tpl-landmark-in")) {
      expect(q.answer).toBe(entityOf(q).landmark as string);
      for (const w of wrong(q)) expect(landmarks.has(w)).toBe(true);
      for (const pair of SAME_LANDMARK_PAIRS) expect(hasPair(q.choices, pair)).toBe(false);
    }
  });

  test("no trap is a wrong choice in its state's question", () => {
    expect(Object.keys(LANDMARK_TRAPS).sort()).toEqual(
      ["AZ", "CO", "ID", "MO", "MT", "NC", "NJ", "WA"].sort(),
    );
    for (const [code, traps] of Object.entries(LANDMARK_TRAPS)) {
      const q = questionsOf("tpl-landmark-in").find(
        (x) => x.entityId === `us-state-${code.toLowerCase()}`,
      );
      expect(q).toBeDefined();
      for (const trap of traps) expect(wrong(q as TaggedQuestion)).not.toContain(trap);
    }
  });
});

describe("climate", () => {
  test("the groups are the brief's ten, 41 states, none twice", () => {
    const all = Object.values(SAME_CLIMATE_GROUPS).flat();
    expect(Object.keys(SAME_CLIMATE_GROUPS)).toHaveLength(10);
    expect(all).toHaveLength(41);
    expect(new Set(all).size).toBe(41);
    for (const code of ["AK", "CA", "CO", "FL", "HI", "MO", "NY", "OK", "TX"])
      expect(all).not.toContain(code);
  });

  test("no distractor is the climate of a state in the answer's group", () => {
    for (const q of questionsOf("tpl-climate-of")) {
      const own = entityOf(q);
      expect(q.answer).toBe(own.climate_kid as string);
      const code = own.id.slice(-2).toUpperCase();
      const group = Object.values(SAME_CLIMATE_GROUPS).find((g) => g.includes(code)) ?? [];
      const banned = group
        .filter((c) => c !== code)
        .map((c) => byCode.get(c)?.climate_kid as string);
      for (const w of wrong(q)) expect(banned).not.toContain(w);
    }
  });
});

describe("crops", () => {
  test("answer is the first crop; no distractor is grown by the state, a neighbour or its region", () => {
    const anyCrop = new Set(entities.flatMap((e) => list(e, "top_crops")));
    for (const q of questionsOf("tpl-crop-of")) {
      const own = entityOf(q);
      expect(q.answer).toBe(list(own, "top_crops")[0] as string);
      const nearby = entities.filter(
        (e) => e.id === own.id || (own.borders ?? []).includes(e.id) || e.region === own.region,
      );
      const grown = new Set(nearby.flatMap((e) => list(e, "top_crops")));
      for (const w of wrong(q)) {
        expect({ q: q.id, w, grown: grown.has(w) }).toEqual({ q: q.id, w, grown: false });
        expect(anyCrop.has(w)).toBe(true);
      }
      for (const pair of AGRICULTURE_SAME_THING_PAIRS) expect(hasPair(q.choices, pair)).toBe(false);
    }
  });
});

describe("farm animals", () => {
  test("answer is the first animal; no distractor is one the state lists, none invented", () => {
    const anyAnimal = new Set(entities.flatMap((e) => list(e, "top_livestock")));
    const qs = questionsOf("tpl-farm-animal-of");
    expect(qs.map((q) => q.entityId).sort()).toEqual(
      entities
        .filter((e) => list(e, "top_livestock").length > 0)
        .map((e) => e.id)
        .sort(),
    );
    for (const q of qs) {
      const own = entityOf(q);
      expect(q.answer).toBe(list(own, "top_livestock")[0] as string);
      for (const w of wrong(q)) {
        expect(list(own, "top_livestock")).not.toContain(w);
        expect(anyAnimal.has(w)).toBe(true);
      }
      expect(hasPair(q.choices, ["cattle", "dairy cows"])).toBe(false);
    }
  });
});

describe("generate: list-valued answers (criterion 7)", () => {
  const crop = template("tpl-crop-of");
  const base = entities[0] as Entity;

  test("first entry of a string list is the answer, and it is not notText", () => {
    const { drafts, skipped } = generate([{ ...base, top_crops: ["corn", "soy"] }], [crop]);
    expect(skipped).toEqual([]);
    expect(drafts[0]?.answer).toBe("corn");
  });

  test("an empty list is still missing", () => {
    const { drafts, skipped } = generate([{ ...base, top_crops: [] }], [crop]);
    expect(drafts).toEqual([]);
    expect(skipped[0]?.missing).toEqual(["top_crops"]);
  });

  test("a number-valued answer is still notText", () => {
    const capital = template("tpl-capital-of");
    const { skipped } = generate([{ ...base, capital: 7 as unknown as string }], [capital]);
    expect(skipped[0]?.notText).toEqual(["capital"]);
  });

  test("a list with a non-string entry is notText, not stringified", () => {
    const { skipped } = generate(
      [{ ...base, top_crops: ["corn", 3] as unknown as string[] }],
      [crop],
    );
    expect(skipped[0]?.notText).toEqual(["top_crops"]);
  });
});

describe("validateTemplate: the two refusals generate() used to patch (criterion 6)", () => {
  test("map_identify without geometry_id in requires is refused", () => {
    const t = { ...template("tpl-identify-on-map"), requires: ["name"] };
    expect(validateTemplate(t).some((p) => p.includes("geometry_id"))).toBe(true);
  });

  test("a geometry_id answer without name in requires is refused", () => {
    const t = { ...template("tpl-click-the-map"), requires: ["geometry_id"], prompt: "Find it." };
    expect(validateTemplate(t).some((p) => p.includes('"name"'))).toBe(true);
  });

  test("the three original templates still pass", () => {
    for (const id of ["tpl-identify-on-map", "tpl-capital-of", "tpl-click-the-map"])
      expect(validateTemplate(template(id))).toEqual([]);
  });
});

describe("buildChoices: guards hold on a small input", () => {
  test("a no-centroid state's superlative draft is reported, as E-21 says", () => {
    const own = { ...(byCode.get("TX") as Entity), centroid: null as unknown as [number, number] };
    const input = entities.map((e) => (e.id === own.id ? own : e));
    const sup = template("tpl-biggest-state");
    const { drafts } = generate(input, [sup]);
    const { shortPools } = buildChoices(drafts, input, [sup]);
    expect(shortPools).toContainEqual({
      draftId: "gen:tpl-biggest-state:us-state-tx",
      found: 0,
      reason: "no_centroid",
    });
  });
});
