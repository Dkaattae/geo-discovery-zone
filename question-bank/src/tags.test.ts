/**
 * T-024, written by the worker. The tester's verify file is the independent
 * check; these pin what the worker built. The only file I/O is reading the
 * committed bank and `backend/app/models.py` (for the two cross-checks).
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChoices } from "./distractors";
import { generate } from "./generate";
import { type LeveledQuestion, seedLevels } from "./seed-level";
import { tagQuestions } from "./tags";
import { QUESTION_FORMATS, TEMPLATE_TOPICS, TEMPLATES, TOPICS, type Template } from "./templates";
import type { Entity } from "./types";

const SRC = import.meta.dirname;
const STATES_DIR = join(SRC, "..", "data", "us-states");
const MODELS = join(SRC, "..", "..", "backend", "app", "models.py");

function bank(): Entity[] {
  return readdirSync(STATES_DIR)
    .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
}

function leveled(entities: Entity[], templates: Template[] = TEMPLATES): LeveledQuestion[] {
  const { questions } = buildChoices(generate(entities, templates).drafts, entities, templates);
  return seedLevels(questions, entities, templates);
}

/**
 * The values of `class <name>(StrEnum)` in models.py. Throws when the file
 * cannot be read; returns [] when the class is absent, so the caller's
 * non-empty assertion fails rather than skips.
 */
function backendEnum(name: string): string[] {
  const text = readFileSync(MODELS, "utf8");
  const lines = text.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^class ${name}\\(StrEnum\\):`).test(l));
  if (start === -1) return [];
  const values: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "") continue;
    if (!/^\s/.test(line)) break;
    const m = /^\s+\w+\s*=\s*"([^"]*)"/.exec(line);
    if (m) values.push(m[1] as string);
  }
  return values;
}

const ADDED = ["scope", "entityType", "topic", "region", "ageBand"];

describe("tagQuestions over the committed bank", () => {
  const entities = bank();
  const input = leveled(entities);
  const out = tagQuestions(input, entities);

  test("150 questions, ids in input order, all seven tags present", () => {
    expect(out).toHaveLength(150);
    expect(out.map((q) => q.id)).toEqual(input.map((q) => q.id));
    for (const q of out) {
      for (const key of ["scope", "entityType", "topic", "region", "format", "ageBand", "level"]) {
        expect(q[key as keyof typeof q]).not.toBeNil();
      }
      for (const key of ["entity_type", "age_band", "min_age_band", "entity_id"]) {
        expect(Object.hasOwn(q, key)).toBe(false);
      }
    }
  });

  test("only the five tags are added; everything else deep-equal", () => {
    out.forEach((q, i) => {
      const rest = Object.fromEntries(Object.entries(q).filter(([k]) => !ADDED.includes(k)));
      expect(rest).toEqual({ ...input[i] });
    });
  });

  test("values: us, state, verbatim region, topic by template, age band 1", () => {
    expect(new Set(out.map((q) => q.scope))).toEqual(new Set(["us"]));
    expect(new Set(out.map((q) => q.entityType))).toEqual(new Set(["state"]));
    expect(new Set(out.map((q) => q.ageBand))).toEqual(new Set([1]));
    expect(out.filter((q) => q.topic === "location")).toHaveLength(100);
    expect(out.filter((q) => q.topic === "capital")).toHaveLength(50);
    for (const q of out.filter((q) => q.entityId === "us-state-co")) {
      expect(q.region).toBe("Mountain West");
    }
  });

  test("values are members of the backend enums", () => {
    const topics = new Set(backendEnum("Topic"));
    const scopes = new Set(backendEnum("Scope"));
    const types = new Set(backendEnum("EntityType"));
    const formats = new Set(backendEnum("QuestionFormat"));
    for (const q of out) {
      expect(topics.has(q.topic)).toBe(true);
      expect(scopes.has(q.scope)).toBe(true);
      expect(types.has(q.entityType)).toBe(true);
      expect(formats.has(q.format)).toBe(true);
      expect(Number.isFinite(q.level) && q.level >= 0 && q.level <= 18).toBe(true);
      expect((q.region ?? "").trim()).not.toBe("");
    }
  });

  test("pure and deterministic", () => {
    const before = structuredClone({ input, entities, TEMPLATES });
    const again = tagQuestions(input, entities);
    expect(again).toEqual(out);
    expect({ input, entities, TEMPLATES }).toEqual(before);
  });
});

describe("cross-checks against backend/app/models.py", () => {
  test("QUESTION_FORMATS equals class QuestionFormat", () => {
    const backend = backendEnum("QuestionFormat");
    expect(backend.length).toBeGreaterThan(0);
    expect([...(QUESTION_FORMATS as readonly string[])].sort()).toEqual(
      [...new Set(backend)].sort(),
    );
  });

  test("TOPICS equals class Topic", () => {
    const backend = backendEnum("Topic");
    expect(backend.length).toBeGreaterThan(0);
    expect([...(TOPICS as readonly string[])].sort()).toEqual([...new Set(backend)].sort());
  });

  test("the parser finds nothing for a class that is not there", () => {
    expect(backendEnum("NoSuchEnum")).toEqual([]);
  });
});

describe("topics", () => {
  test("every TEMPLATES entry has a topic in TOPICS", () => {
    for (const t of TEMPLATES) {
      expect(Object.hasOwn(TEMPLATE_TOPICS, t.id)).toBe(true);
      expect(TOPICS as readonly string[]).toContain(TEMPLATE_TOPICS[t.id] as string);
    }
  });

  const co = bank().filter((e) => e.id === "us-state-co" || e.region === "Mountain West");
  const capital = TEMPLATES.find((t) => t.id === "tpl-capital-of") as Template;
  const orphan: Template = { ...capital, id: "tpl-orphan" };

  test("a template with no topic is refused, naming the template", () => {
    const qs = leveled(co, [orphan]);
    expect(qs.length).toBeGreaterThan(0);
    expect(() => tagQuestions(qs, co, [orphan])).toThrow("tpl-orphan");
  });

  test("a topic outside the backend's ten is refused, naming the template", () => {
    const qs = leveled(co, [orphan]);
    expect(() => tagQuestions(qs, co, [orphan], { "tpl-orphan": "geography" })).toThrow(
      "tpl-orphan",
    );
  });

  test("ageBand follows min_age_band", () => {
    for (const band of [2, 3] as const) {
      const t: Template = { ...capital, min_age_band: band };
      const out = tagQuestions(leveled(co, [t]), co, [t]);
      expect(out.length).toBeGreaterThan(0);
      for (const q of out) expect(q.ageBand).toBe(band);
    }
  });
});

describe("holes and bad input", () => {
  const entities = bank().filter((e) => e.region === "Mountain West");
  const input = leveled(entities);

  test("a blank or missing region omits the key and keeps the other tags", () => {
    for (const region of [undefined, null, "", "   "]) {
      const holed = entities.map((e) => {
        if (e.id !== "us-state-co") return e;
        const copy: Record<string, unknown> = { ...e };
        if (region === undefined) delete copy["region"];
        else copy["region"] = region;
        return copy as unknown as Entity;
      });
      const out = tagQuestions(input, holed).filter((q) => q.entityId === "us-state-co");
      expect(out).toHaveLength(3);
      for (const q of out) {
        expect(Object.hasOwn(q, "region")).toBe(false);
        expect(q.scope).toBe("us");
        expect(q.topic).toBeDefined();
      }
    }
  });

  test("level is carried, not recomputed", () => {
    const first = { ...(input[0] as LeveledQuestion), level: 17.25 };
    expect(tagQuestions([first], entities)[0]?.level).toBe(17.25);
  });

  test("unknown entity or template throws naming the question", () => {
    const q = input[0] as LeveledQuestion;
    expect(() => tagQuestions([{ ...q, entityId: "nope" }], entities)).toThrow(q.id);
    expect(() => tagQuestions([{ ...q, templateId: "tpl-nope" }], entities)).toThrow(q.id);
  });

  test("empty input gives empty output", () => {
    expect(tagQuestions([], [])).toEqual([]);
  });
});
