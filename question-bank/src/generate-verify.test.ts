/**
 * T-021, written by the `tester` from the brief's acceptance criteria. Expected
 * values come from the brief, not from `generate.ts`, whose source was read for
 * the entry point and signature only. Pure: `generate` is called directly. The
 * only file I/O is reading the committed bank, content.json and source text.
 * No network, no seam, no spawn.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { generate } from "./generate";
import { TEMPLATES, validateTemplate } from "./templates";
import type { Template } from "./templates";
import type { Entity } from "./types";

const SRC = import.meta.dirname;
const STATES_DIR = join(SRC, "..", "data", "us-states");
// The hand-written bank, archived by T-040 when the served content.json became the generated one.
const CONTENT = resolve(SRC, "..", "..", "archive", "hand-written-bank", "content.json");

const IDENTIFY = "tpl-identify-on-map";
const CAPITAL = "tpl-capital-of";
const CLICK = "tpl-click-the-map";

/**
 * TEMPLATES as it stood when this file loaded, before any test called the
 * generator. A per-test snapshot would miss a mutation an earlier test caused.
 */
const PRISTINE = structuredClone(TEMPLATES);

/** The three T-020 records, all nine fields, as approved (criterion 25). */
const T020_RECORDS: Template[] = [
  {
    id: "tpl-identify-on-map",
    prompt: "Which state is highlighted?",
    answer_field: "name",
    distractor_strategy: "neighbours_first",
    requires: ["name", "geometry_id"],
    applies_to: ["state"],
    format: "map_identify",
    base_difficulty: 2,
    min_age_band: 1,
  },
  {
    id: "tpl-capital-of",
    prompt: "What is the capital of {name}?",
    answer_field: "capital",
    distractor_strategy: "sibling_capitals_same_region",
    requires: ["name", "capital"],
    applies_to: ["state", "country"],
    format: "multiple_choice",
    base_difficulty: 2,
    min_age_band: 1,
  },
  {
    id: "tpl-click-the-map",
    prompt: "Find {name} on the map.",
    answer_field: "geometry_id",
    distractor_strategy: "neighbours_first",
    requires: ["name", "geometry_id"],
    applies_to: ["state"],
    format: "map_click",
    base_difficulty: 3,
    min_age_band: 1,
  },
];

/** A fresh parse per call: no test can mutate another's data. */
function bank(): Entity[] {
  const files = readdirSync(STATES_DIR).filter((f) => /^us-state-[a-z]{2}\.json$/.test(f));
  return files.map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
}

/** A deep copy of TEMPLATES, so a synthetic tweak never touches the export. */
function templates(): Template[] {
  return structuredClone(TEMPLATES);
}

function tpl(id: string): Template {
  const t = templates().find((x) => x.id === id);
  if (t === undefined) throw new Error(`no template ${id}`);
  return t;
}

function synth(overrides: Record<string, unknown> = {}): Entity {
  return {
    id: "us-state-qq",
    type: "state",
    scope: "us",
    name: "Quelland",
    capital: "Quel City",
    geometry_id: "77",
    ...overrides,
  } as Entity;
}

function without(entity: Entity, key: string): Entity {
  const copy = { ...entity } as Record<string, unknown>;
  delete copy[key];
  return copy as unknown as Entity;
}

type Draft = ReturnType<typeof generate>["drafts"][number];
type Skip = ReturnType<typeof generate>["skipped"][number];

function draftOf(drafts: Draft[], templateId: string, entityId: string): Draft {
  const hits = drafts.filter((d) => d.templateId === templateId && d.entityId === entityId);
  expect(hits).toHaveLength(1);
  return hits[0] as Draft;
}

/** Every field name a skip report names, whatever key it is filed under. */
function namedFields(skip: Skip): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(skip)) {
    if (k === "templateId" || k === "entityId") continue;
    if (Array.isArray(v)) out.push(...(v as string[]));
  }
  return out;
}

const COLORADO = "us-state-co";
const ALASKA = "us-state-ak";

describe("T-021 criterion 1: committed bank gives exactly 150 drafts and no skips", () => {
  test("50 committed entities in, 150 drafts and an empty skip report out", () => {
    const entities = bank();
    expect(entities).toHaveLength(50);
    const out = generate(entities, TEMPLATES);
    expect(out.drafts).toHaveLength(150);
    expect(out.skipped).toEqual([]);
  });
  test("the template list defaults to TEMPLATES", () => {
    expect(generate(bank()).drafts).toHaveLength(150);
  });
});

describe("T-021 criterion 2: 50 drafts per template, 3 per entity, one per template", () => {
  test("each template id appears on exactly 50 drafts", () => {
    const { drafts } = generate(bank(), TEMPLATES);
    for (const id of [IDENTIFY, CAPITAL, CLICK]) {
      expect(drafts.filter((d) => d.templateId === id)).toHaveLength(50);
    }
  });
  test("each entity id appears on exactly 3 drafts, one from each template", () => {
    const entities = bank();
    const { drafts } = generate(entities, TEMPLATES);
    for (const e of entities) {
      const mine = drafts.filter((d) => d.entityId === e.id);
      expect(mine.map((d) => d.templateId).sort()).toEqual([CAPITAL, CLICK, IDENTIFY]);
    }
  });
});

describe("T-021 criterion 3: tpl-capital-of drafts for Colorado and Alaska", () => {
  test("Colorado: prompt and answer exact", () => {
    const d = draftOf(generate(bank(), TEMPLATES).drafts, CAPITAL, COLORADO);
    expect(d.prompt).toBe("What is the capital of Colorado?");
    expect(d.answer).toBe("Denver");
  });
  test("Alaska: answer is Juneau", () => {
    const d = draftOf(generate(bank(), TEMPLATES).drafts, CAPITAL, ALASKA);
    expect(d.answer).toBe("Juneau");
  });
});

describe("T-021 criterion 4: tpl-identify-on-map draft for Colorado", () => {
  test("prompt, answer and highlightGeometryId exact", () => {
    const d = draftOf(generate(bank(), TEMPLATES).drafts, IDENTIFY, COLORADO);
    expect(d.prompt).toBe("Which state is highlighted?");
    expect(d.answer).toBe("Colorado");
    expect(d.highlightGeometryId).toBe("08");
  });
});

describe("T-021 criterion 5: tpl-click-the-map draft for Colorado", () => {
  test("prompt, answer and answerGeometryId exact, no highlightGeometryId key", () => {
    const d = draftOf(generate(bank(), TEMPLATES).drafts, CLICK, COLORADO);
    expect(d.prompt).toBe("Find Colorado on the map.");
    expect(d.answer).toBe("Colorado");
    expect(d.answerGeometryId).toBe("08");
    expect(Object.hasOwn(d, "highlightGeometryId")).toBe(false);
  });
});

describe("T-021 criterion 6: every draft carries the six non-empty string fields", () => {
  test("id, entityId, templateId, format, prompt, answer are non-empty strings", () => {
    const { drafts } = generate(bank(), TEMPLATES);
    for (const d of drafts) {
      for (const key of ["id", "entityId", "templateId", "format", "prompt", "answer"]) {
        const v = (d as unknown as Record<string, unknown>)[key];
        expect(typeof v).toBe("string");
        expect((v as string).length).toBeGreaterThan(0);
      }
    }
  });
  test("entityId, templateId and format come from the entity and template", () => {
    const entities = bank();
    const { drafts } = generate(entities, TEMPLATES);
    const ids = new Set(entities.map((e) => e.id));
    for (const d of drafts) {
      expect(ids.has(d.entityId)).toBe(true);
      const t = tpl(d.templateId);
      expect(d.format).toBe(t.format);
    }
  });
  test("a synthetic template and entity carry their own ids and format through", () => {
    const t: Template = { ...tpl(CAPITAL), id: "tpl-synthetic-thing" };
    const { drafts } = generate([synth({ id: "x-entity-1" })], [t]);
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.entityId).toBe("x-entity-1");
    expect(drafts[0]?.templateId).toBe("tpl-synthetic-thing");
    expect(drafts[0]?.format).toBe("multiple_choice");
  });
});

describe("T-021 criterion 7: {tokens} are filled verbatim", () => {
  test("no committed-bank prompt contains a brace", () => {
    for (const d of generate(bank(), TEMPLATES).drafts) expect(d.prompt).not.toMatch(/[{}]/);
  });
  test("every token in a multi-token prompt takes the entity's value verbatim", () => {
    const t: Template = {
      ...tpl(CAPITAL),
      id: "tpl-two-tokens",
      prompt: "Is {capital} in {name}? {name}!",
      requires: ["name", "capital"],
    };
    expect(validateTemplate(t)).toEqual([]);
    const e = synth({ name: "  Odd $& Name  ", capital: "Cap$1ital" });
    const { drafts } = generate([e], [t]);
    expect(drafts[0]?.prompt).toBe("Is Cap$1ital in   Odd $& Name  ?   Odd $& Name  !");
  });
});

describe("T-021 criterion 8: highlightGeometryId iff format is map_identify", () => {
  test("committed bank: present and equal to geometry_id exactly on map_identify drafts", () => {
    const entities = bank();
    const byId = new Map(entities.map((e) => [e.id, e]));
    const { drafts } = generate(entities, TEMPLATES);
    for (const d of drafts) {
      if (d.format === "map_identify") {
        expect(d.highlightGeometryId).toBe(byId.get(d.entityId)?.geometry_id as string);
      } else {
        expect(Object.hasOwn(d, "highlightGeometryId")).toBe(false);
      }
    }
  });
  test("a synthetic map_identify template gets the highlight from its own entity", () => {
    const t: Template = { ...tpl(IDENTIFY), id: "tpl-map-capital", answer_field: "name" };
    const { drafts } = generate([synth()], [t]);
    expect(drafts[0]?.highlightGeometryId).toBe("77");
  });
});

describe("T-021 criterion 9: answerGeometryId iff answer_field is geometry_id", () => {
  test("committed bank: present and equal to geometry_id exactly on geometry_id-answer drafts", () => {
    const entities = bank();
    const byId = new Map(entities.map((e) => [e.id, e]));
    const { drafts } = generate(entities, TEMPLATES);
    for (const d of drafts) {
      if (tpl(d.templateId).answer_field === "geometry_id") {
        expect(d.answerGeometryId).toBe(byId.get(d.entityId)?.geometry_id as string);
      } else {
        expect(Object.hasOwn(d, "answerGeometryId")).toBe(false);
      }
    }
  });
  test("a multiple_choice template answering geometry_id carries answerGeometryId, no highlight", () => {
    const t: Template = { ...tpl(CLICK), id: "tpl-code-choice", format: "multiple_choice" };
    const { drafts } = generate([synth()], [t]);
    expect(drafts[0]?.answerGeometryId).toBe("77");
    expect(Object.hasOwn(drafts[0] as object, "highlightGeometryId")).toBe(false);
  });
});

describe("T-021 criterion 10: answer is the entity's answer_field value", () => {
  test("committed bank: capital-of answers equal each entity's capital", () => {
    const entities = bank();
    const { drafts } = generate(entities, TEMPLATES);
    for (const e of entities)
      expect(draftOf(drafts, CAPITAL, e.id).answer).toBe(e.capital as string);
  });
  test("a synthetic template answering state_animal returns that value", () => {
    const t: Template = {
      ...tpl(CAPITAL),
      id: "tpl-animal",
      prompt: "Which animal is {name}'s?",
      answer_field: "state_animal",
      requires: ["name", "state_animal"],
    };
    expect(validateTemplate(t)).toEqual([]);
    const { drafts } = generate([synth({ state_animal: "Mountain goat" })], [t]);
    expect(drafts[0]?.answer).toBe("Mountain goat");
  });
});

describe("T-021 criterion 11: a FIPS code is never a label a child sees", () => {
  test("geometry_id answer is the entity's name", () => {
    const { drafts } = generate([synth()], [tpl(CLICK)]);
    expect(drafts[0]?.answer).toBe("Quelland");
  });
  test("committed bank: no prompt or answer equals any geometry_id, no all-digit answer", () => {
    const entities = bank();
    const codes = new Set(entities.map((e) => e.geometry_id as string));
    expect(codes.size).toBe(50);
    for (const d of generate(entities, TEMPLATES).drafts) {
      expect(codes.has(d.prompt)).toBe(false);
      expect(codes.has(d.answer)).toBe(false);
      expect(d.answer).not.toMatch(/^\d+$/);
    }
  });
});

describe("T-021 criterion 12: ids are unique and stable", () => {
  test("all 150 ids in one output are distinct", () => {
    const ids = generate(bank(), TEMPLATES).drafts.map((d) => d.id);
    expect(new Set(ids).size).toBe(150);
  });
  test("the same pair gets the same id over a subset", () => {
    const full = generate(bank(), TEMPLATES).drafts;
    const subset = bank().filter((e) => [COLORADO, ALASKA, "us-state-wy"].includes(e.id));
    expect(subset).toHaveLength(3);
    const part = generate(subset, TEMPLATES).drafts;
    expect(part).toHaveLength(9);
    for (const d of part) expect(draftOf(full, d.templateId, d.entityId).id).toBe(d.id);
  });
  test("the same pair gets the same id with entities and templates reversed", () => {
    const full = generate(bank(), TEMPLATES).drafts;
    const reversed = generate(bank().reverse(), templates().reverse()).drafts;
    expect(reversed).toHaveLength(150);
    for (const d of reversed) expect(draftOf(full, d.templateId, d.entityId).id).toBe(d.id);
  });
  test("the id differs when either side of the pair differs", () => {
    const { drafts } = generate([synth({ id: "a-1" }), synth({ id: "a-2" })], [tpl(CAPITAL)]);
    expect(drafts[0]?.id).not.toBe(drafts[1]?.id);
  });
});

describe("T-021 criterion 13: no generated id collides with content.json", () => {
  test("disjoint from the 26 hand-written question ids", () => {
    const content = JSON.parse(readFileSync(CONTENT, "utf8")) as { questions: { id: string }[] };
    expect(content.questions).toHaveLength(26);
    const handWritten = new Set(content.questions.map((q) => q.id));
    for (const d of generate(bank(), TEMPLATES).drafts) expect(handWritten.has(d.id)).toBe(false);
  });
});

describe("T-021 criterion 14: missing data skips the pair and reports it", () => {
  const cases: [string, unknown][] = [
    ["undefined", undefined],
    ["null", null],
    ["empty string", ""],
    ["whitespace string", "   "],
    ["empty array", []],
  ];
  for (const [label, value] of cases) {
    test(`capital = ${label}: no capital-of draft, one report naming capital`, () => {
      const e = synth({ capital: value });
      let out: ReturnType<typeof generate> | undefined;
      expect(() => {
        out = generate([e], [tpl(CAPITAL)]);
      }).not.toThrow();
      expect(out?.drafts).toEqual([]);
      expect(out?.skipped).toHaveLength(1);
      const skip = out?.skipped[0] as Skip;
      expect(skip.templateId).toBe(CAPITAL);
      expect(skip.entityId).toBe("us-state-qq");
      expect(namedFields(skip)).toContain("capital");
    });
  }
  test("capital absent (no key): skipped and reported", () => {
    const out = generate([without(synth(), "capital")], [tpl(CAPITAL)]);
    expect(out.drafts).toEqual([]);
    expect(out.skipped).toHaveLength(1);
    expect(namedFields(out.skipped[0] as Skip)).toContain("capital");
  });
  test("every missing required field is named, not just the first", () => {
    const out = generate([synth({ name: "  ", capital: null })], [tpl(CAPITAL)]);
    expect(out.drafts).toEqual([]);
    expect(out.skipped).toHaveLength(1);
    const named = namedFields(out.skipped[0] as Skip);
    expect(named).toContain("name");
    expect(named).toContain("capital");
  });
  test('the other edge: "X" is present', () => {
    const out = generate([synth({ capital: "X" })], [tpl(CAPITAL)]);
    expect(out.skipped).toEqual([]);
    expect(out.drafts[0]?.answer).toBe("X");
  });
  test("the other edge: a one-element array satisfies requires", () => {
    // requires top_crops but neither prompt nor answer uses it, so no text conversion.
    const t: Template = {
      ...tpl(CAPITAL),
      id: "tpl-needs-crops",
      requires: ["name", "capital", "top_crops"],
    };
    expect(validateTemplate(t)).toEqual([]);
    const ok = generate([synth({ top_crops: ["corn"] })], [t]);
    expect(ok.skipped).toEqual([]);
    expect(ok.drafts).toHaveLength(1);
    const gap = generate([synth({ top_crops: [] })], [t]);
    expect(gap.drafts).toEqual([]);
    expect(namedFields(gap.skipped[0] as Skip)).toContain("top_crops");
  });
  test("the other edge: the number 0 satisfies requires", () => {
    const t: Template = {
      ...tpl(CAPITAL),
      id: "tpl-needs-height",
      requires: ["name", "capital", "highest_point_m"],
    };
    expect(validateTemplate(t)).toEqual([]);
    const out = generate([synth({ highest_point_m: 0 })], [t]);
    expect(out.skipped).toEqual([]);
    expect(out.drafts).toHaveLength(1);
  });
});

describe("T-021 criterion 15: a skip is per pair, not per entity", () => {
  test("empty capital loses only the capital-of draft", () => {
    const out = generate([synth({ capital: "" })], templates());
    expect(out.drafts.map((d) => d.templateId).sort()).toEqual([CLICK, IDENTIFY]);
    expect(out.skipped).toHaveLength(1);
    expect(out.skipped[0]?.templateId).toBe(CAPITAL);
  });
  test("a gap in one entity does not cost the other 50 anything", () => {
    const out = generate([...bank(), synth({ capital: "" })], TEMPLATES);
    expect(out.drafts).toHaveLength(152);
    expect(out.skipped).toHaveLength(1);
  });
});

describe("T-021 criterion 16: applies_to is respected and not reported", () => {
  test("a country gets only the capital-of draft and no report", () => {
    const country = synth({
      id: "country-qq",
      type: "country",
      scope: "world",
      geometry_id: "QQQ",
    });
    const out = generate([country], TEMPLATES);
    expect(out.drafts.map((d) => d.templateId)).toEqual([CAPITAL]);
    expect(out.skipped).toEqual([]);
  });
  test("an out-of-scope entity missing data is still not reported", () => {
    const city = synth({ id: "city-qq", type: "city", capital: "" });
    const out = generate([city], TEMPLATES);
    expect(out.drafts).toEqual([]);
    expect(out.skipped).toEqual([]);
  });
});

describe("T-021 criterion 17: a non-string value never becomes text", () => {
  test("answer_field top_crops = ['corn']: no draft, one report naming top_crops", () => {
    const t: Template = {
      ...tpl(CAPITAL),
      id: "tpl-top-crop",
      prompt: "What does {name} grow most?",
      answer_field: "top_crops",
      requires: ["name", "top_crops"],
    };
    expect(validateTemplate(t)).toEqual([]);
    const out = generate([synth({ top_crops: ["corn"] })], [t]);
    expect(out.drafts).toEqual([]);
    expect(out.skipped).toHaveLength(1);
    expect(namedFields(out.skipped[0] as Skip)).toContain("top_crops");
  });
  const nonStrings: [string, unknown][] = [
    ["a number", 42],
    ["an array", ["Quel"]],
    ["an object", { en: "Quel" }],
  ];
  for (const [label, value] of nonStrings) {
    test(`prompt token name as ${label}: capital-of skipped, name reported`, () => {
      const out = generate([synth({ name: value })], [tpl(CAPITAL)]);
      expect(out.drafts).toEqual([]);
      expect(out.skipped).toHaveLength(1);
      expect(namedFields(out.skipped[0] as Skip)).toContain("name");
    });
    test(`answer capital as ${label}: skipped, capital reported`, () => {
      const out = generate([synth({ capital: value })], [tpl(CAPITAL)]);
      expect(out.drafts).toEqual([]);
      expect(out.skipped).toHaveLength(1);
      expect(namedFields(out.skipped[0] as Skip)).toContain("capital");
    });
  }
  test("answer_field highest_point_m = 0 (present, a number): skipped, not '0'", () => {
    const t: Template = {
      ...tpl(CAPITAL),
      id: "tpl-height",
      prompt: "How high is {name}?",
      answer_field: "highest_point_m",
      requires: ["name", "highest_point_m"],
    };
    const out = generate([synth({ highest_point_m: 0 })], [t]);
    expect(out.drafts).toEqual([]);
    expect(namedFields(out.skipped[0] as Skip)).toContain("highest_point_m");
  });
});

describe("T-021 criterion 18: an invalid template is refused", () => {
  test("throws with the template's id and one of its problems; valid ones not drafted", () => {
    const bad = { ...tpl(CAPITAL), id: "tpl-broken-one", base_difficulty: 99 } as Template;
    const problems = validateTemplate(bad);
    expect(problems.length).toBeGreaterThan(0);
    let result: unknown = "unset";
    let message = "";
    try {
      result = generate(bank(), [tpl(IDENTIFY), bad, tpl(CLICK)]);
    } catch (error) {
      message = String((error as Error).message);
    }
    expect(result).toBe("unset");
    expect(message).toContain("tpl-broken-one");
    expect(problems.some((p) => message.includes(p))).toBe(true);
  });
  test("an invalid template last in the list still stops the valid ones before it", () => {
    const bad = { ...tpl(CLICK), id: "tpl-bad-format", format: "essay" } as unknown as Template;
    expect(() => generate(bank(), [tpl(IDENTIFY), tpl(CAPITAL), bad])).toThrow("tpl-bad-format");
  });
});

describe("T-021 criterion 19: duplicate ids are refused", () => {
  test("two templates sharing an id throws", () => {
    const twin: Template = { ...tpl(CLICK), id: CAPITAL };
    expect(() => generate(bank(), [tpl(CAPITAL), twin])).toThrow();
  });
  test("two entities sharing an id throws", () => {
    const entities = [...bank(), synth({ id: COLORADO, name: "Other" })];
    expect(() => generate(entities, TEMPLATES)).toThrow();
  });
  test("distinct ids do not throw (the other edge)", () => {
    expect(() => generate([synth({ id: "a" }), synth({ id: "b" })], TEMPLATES)).not.toThrow();
  });
});

describe("T-021 criterion 20: inputs are not mutated", () => {
  test("TEMPLATES and the entities are deep-equal before and after a call", () => {
    const before = structuredClone(TEMPLATES);
    const entities = bank();
    const entitiesBefore = structuredClone(entities);
    generate(entities, TEMPLATES);
    generate([...entities, synth({ capital: "" }), synth({ id: "c", type: "country" })], TEMPLATES);
    expect(TEMPLATES).toEqual(before);
    expect(TEMPLATES).toEqual(PRISTINE);
    expect(entities).toEqual(entitiesBefore);
  });
  test("mutating returned drafts and report does not reach TEMPLATES or the entities", () => {
    const before = structuredClone(TEMPLATES);
    const entities = [synth(), synth({ id: "gap", capital: "" })];
    const entitiesBefore = structuredClone(entities);
    const out = generate(entities, TEMPLATES);
    for (const d of out.drafts) {
      const r = d as unknown as Record<string, unknown>;
      for (const k of Object.keys(r)) r[k] = "MUTATED";
    }
    for (const s of out.skipped) {
      for (const v of Object.values(s)) if (Array.isArray(v)) v.push("MUTATED" as never);
    }
    expect(TEMPLATES).toEqual(before);
    expect(entities).toEqual(entitiesBefore);
    expect(generate(entities, TEMPLATES).drafts[0]?.prompt).toBe("Which state is highlighted?");
  });
});

describe("T-021 criterion 21: deterministic", () => {
  test("two calls give deep-equal output in the same order", () => {
    const a = generate(bank(), TEMPLATES);
    const b = generate(bank(), TEMPLATES);
    expect(a).toEqual(b);
    expect(a.drafts.map((d) => d.id)).toEqual(b.drafts.map((d) => d.id));
  });
  test("with skips present too", () => {
    const input = () => [...bank(), synth({ capital: "" }), synth({ id: "x", name: 3 })];
    expect(generate(input(), TEMPLATES)).toEqual(generate(input(), TEMPLATES));
  });
});

describe("T-021 criterion 22: no fun fact text in any draft", () => {
  function allStrings(value: unknown, out: string[] = []): string[] {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) for (const v of value) allStrings(v, out);
    else if (value !== null && typeof value === "object") {
      for (const v of Object.values(value)) allStrings(v, out);
    }
    return out;
  }
  test("committed bank: no draft string contains any fun fact text", () => {
    const entities = bank();
    const facts = entities.flatMap((e) => (e.fun_facts ?? []).map((f) => f.text));
    expect(facts.length).toBeGreaterThan(0);
    const strings = allStrings(generate(entities, TEMPLATES).drafts);
    for (const s of strings) for (const f of facts) expect(s.includes(f)).toBe(false);
  });
  test("reviewed and unreviewed facts on a synthetic entity never reach a draft", () => {
    const facts = [
      { text: "UNREVIEWED-FACT-SENTINEL", reviewed: false },
      { text: "REVIEWED-FACT-SENTINEL", reviewed: true },
    ];
    const e = synth({ fun_facts: facts });
    const t: Template = {
      ...tpl(CAPITAL),
      id: "tpl-fact",
      prompt: "True? {fun_facts}",
      answer_field: "fun_facts",
      requires: ["name", "fun_facts"],
    };
    expect(validateTemplate(t)).toEqual([]);
    const out = generate([e], [...templates(), t]);
    const joined = allStrings(out.drafts).join("\n");
    expect(joined).not.toContain("FACT-SENTINEL");
    expect(out.drafts.some((d) => d.templateId === "tpl-fact")).toBe(false);
  });
});

describe("T-021 criteria 23, 24, 27: no I/O, not wired into the pipeline", () => {
  const source = () => readFileSync(join(SRC, "generate.ts"), "utf8");
  test("generate.ts imports only ./templates and ./types", () => {
    const specs = [...source().matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    expect(specs.sort()).toEqual(["./templates", "./types"]);
    expect(source()).not.toMatch(/\bimport\s*\(/);
    expect(source()).not.toMatch(/\brequire\s*\(/);
  });
  test("generate.ts has no fetch, file write, Bun I/O, clock or randomness", () => {
    const text = source();
    for (const needle of [/\bfetch\s*\(/, /\bwriteFile/, /\bBun\./, /\bDate\b/, /Math\.random/]) {
      expect(text).not.toMatch(needle);
    }
  });
  test("the pipeline imports neither the generator nor ./templates, directly or transitively", () => {
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
    expect(seen.has("generate.ts")).toBe(false);
    expect(seen.has("templates.ts")).toBe(false);
    expect(seen.size).toBeGreaterThan(3);
  });
});

describe("T-021 criterion 25: TEMPLATES unchanged", () => {
  test("still the three T-020 records, every field, at load and after every call above", () => {
    expect(PRISTINE).toEqual(T020_RECORDS);
    expect(TEMPLATES).toEqual(T020_RECORDS);
    for (const t of TEMPLATES) expect(validateTemplate(t)).toEqual([]);
  });
});
