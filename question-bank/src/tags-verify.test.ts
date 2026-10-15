/**
 * T-024, written by the `tester` from the brief's acceptance criteria. Expected
 * values come from the criteria, plan §1.3, `backend/app/models.py` and the
 * committed bank, never from `tags.ts`, whose source was read for entry points
 * and signatures only. Criteria 20–22 (the worker's cross-check tests) and
 * 24–25 (the diff) are verified by mutation and by `git diff`, recorded in the
 * brief's Verdict; this file pins the rest.
 *
 * Pure: no network, no seam. The only file I/O is reading the committed bank,
 * `backend/app/models.py`, and source / doc text.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChoices } from "./distractors";
import { generate } from "./generate";
import { type LeveledQuestion, seedLevels } from "./seed-level";
import { tagQuestions } from "./tags";
import { TEMPLATE_TOPICS, TEMPLATES, TOPICS, type Template, validateTemplate } from "./templates";
import type { Entity } from "./types";

const SRC = import.meta.dirname;
const STATES_DIR = join(SRC, "..", "data", "us-states");
const MODELS = join(SRC, "..", "..", "backend", "app", "models.py");
const DECISIONS = join(SRC, "..", "..", "engineering-decisions.md");

const IDENTIFY = "tpl-identify-on-map";
const CAPITAL = "tpl-capital-of";
const CLICK = "tpl-click-the-map";
const ADDED = ["scope", "entityType", "topic", "region", "ageBand"];
const SEVEN = ["scope", "entityType", "topic", "region", "format", "ageBand", "level"];

/** Fresh parse per call, so no test can mutate another's data. */
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

function tpl(id: string): Template {
  return structuredClone(TEMPLATES.find((t) => t.id === id) as Template);
}

/** Values of `class <name>(...)` in models.py, read independently of tags.test.ts. */
function backendValues(name: string): string[] {
  const text = readFileSync(MODELS, "utf8");
  const m = new RegExp(`^class ${name}\\([^)]*\\):\\n((?:[ \\t]+.*\\n|\\n)*)`, "m").exec(text);
  if (m === null) throw new Error(`class ${name} not found in models.py`);
  const values = [...(m[1] as string).matchAll(/^\s+\w+\s*=\s*"([^"]+)"/gm)].map(
    (x) => x[1] as string,
  );
  if (values.length === 0) throw new Error(`class ${name} has no values`);
  return values;
}

const mountainWest = () => bank().filter((e) => e.region === "Mountain West");

// ---- Shape ----

describe("T-024 criterion 1: one output per input, in input order", () => {
  test("ids and length match input over the committed bank", () => {
    const entities = bank();
    const input = leveled(entities);
    const out = tagQuestions(input, entities);
    expect(out.length).toBe(input.length);
    for (let i = 0; i < input.length; i++) expect(out[i]?.id).toBe(input[i]?.id);
  });

  test("a reversed input comes back reversed", () => {
    const entities = mountainWest();
    const input = leveled(entities).reverse();
    expect(tagQuestions(input, entities).map((q) => q.id)).toEqual(input.map((q) => q.id));
  });

  test("an empty input returns an empty array", () => {
    expect(tagQuestions([], bank())).toEqual([]);
    expect(tagQuestions([], [])).toEqual([]);
  });
});

describe("T-024 criterion 2: 150 questions, all seven keys, none null/undefined", () => {
  test("committed bank", () => {
    const entities = bank();
    const out = tagQuestions(leveled(entities), entities);
    expect(out.length).toBe(150);
    for (const q of out) {
      const rec = q as unknown as Record<string, unknown>;
      for (const key of SEVEN) {
        expect(Object.hasOwn(rec, key)).toBe(true);
        expect(rec[key]).not.toBeNull();
        expect(rec[key]).not.toBeUndefined();
      }
    }
  });
});

describe("T-024 criterion 3: no snake_case tag keys", () => {
  test("no entity_type, age_band, min_age_band or entity_id on any output", () => {
    const entities = bank();
    for (const q of tagQuestions(leveled(entities), entities)) {
      for (const key of ["entity_type", "age_band", "min_age_band", "entity_id"]) {
        expect(Object.hasOwn(q, key)).toBe(false);
      }
    }
  });
});

describe("T-024 criterion 4: only the five keys are added; the rest deep-equal", () => {
  test("committed bank: keys are input keys plus exactly the five, values unchanged", () => {
    const entities = bank();
    const input = leveled(entities);
    const out = tagQuestions(input, entities);
    out.forEach((q, i) => {
      const inQ = input[i] as unknown as Record<string, unknown>;
      const outQ = q as unknown as Record<string, unknown>;
      expect(Object.keys(outQ).sort()).toEqual([...Object.keys(inQ), ...ADDED].sort());
      for (const key of Object.keys(inQ)) expect(outQ[key]).toEqual(inQ[key]);
    });
  });

  test("named fields are unchanged where present", () => {
    const entities = bank();
    const input = leveled(entities);
    const out = tagQuestions(input, entities);
    const named = [
      "id",
      "entityId",
      "templateId",
      "prompt",
      "answer",
      "choices",
      "correctIndex",
      "highlightGeometryId",
      "answerGeometryId",
      "choiceGeometryIds",
    ];
    let seen = 0;
    out.forEach((q, i) => {
      const inQ = input[i] as unknown as Record<string, unknown>;
      const outQ = q as unknown as Record<string, unknown>;
      for (const key of named) {
        expect(Object.hasOwn(outQ, key)).toBe(Object.hasOwn(inQ, key));
        if (Object.hasOwn(inQ, key)) {
          expect(outQ[key]).toEqual(inQ[key]);
          seen++;
        }
      }
    });
    expect(seen).toBeGreaterThan(150 * 5);
  });

  test("with a region hole only four keys are added", () => {
    const entities = mountainWest().map((e) => {
      if (e.id !== "us-state-co") return e;
      const copy = { ...e };
      delete copy.region;
      return copy;
    });
    const input = leveled(mountainWest());
    const out = tagQuestions(input, entities);
    out.forEach((q, i) => {
      const inKeys = Object.keys(input[i] as object);
      const expected =
        q.entityId === "us-state-co"
          ? [...inKeys, "scope", "entityType", "topic", "ageBand"]
          : [...inKeys, ...ADDED];
      expect(Object.keys(q).sort()).toEqual(expected.sort());
    });
  });
});

describe("T-024 criterion 5: inputs are not mutated", () => {
  test("questions, entities, templates and TEMPLATES deep-equal after the call", () => {
    const entities = bank();
    const templates = TEMPLATES.map((t) => structuredClone(t));
    const input = leveled(entities, templates);
    const before = structuredClone({ input, entities, templates, TEMPLATES });
    tagQuestions(input, entities, templates);
    tagQuestions(input, entities);
    expect({ input, entities, templates, TEMPLATES }).toEqual(before);
  });

  test("deep-frozen inputs do not make it throw (strict-mode writes would)", () => {
    const deepFreeze = <T>(v: T): T => {
      if (v && typeof v === "object") {
        for (const x of Object.values(v)) deepFreeze(x);
        Object.freeze(v);
      }
      return v;
    };
    const entities = mountainWest();
    const templates = TEMPLATES.map((t) => structuredClone(t));
    const input = leveled(entities, templates);
    deepFreeze(entities);
    deepFreeze(templates);
    deepFreeze(input);
    expect(tagQuestions(input, entities, templates).length).toBe(input.length);
  });

  test("outputs are new objects, not the input objects", () => {
    const entities = mountainWest();
    const input = leveled(entities);
    const out = tagQuestions(input, entities);
    out.forEach((q, i) => expect(q).not.toBe(input[i] as unknown as typeof q));
  });
});

describe("T-024 criterion 6: deterministic", () => {
  test("two calls on the same inputs are deep-equal", () => {
    const entities = bank();
    const input = leveled(entities);
    expect(tagQuestions(input, entities)).toEqual(tagQuestions(input, entities));
  });
});

// ---- Each tag's value ----

describe("T-024 criterion 7: scope is the entity's scope", () => {
  test("committed bank: all 150 are us", () => {
    const entities = bank();
    const out = tagQuestions(leveled(entities), entities);
    expect(out.filter((q) => q.scope === "us").length).toBe(150);
  });

  test("follows the entity, not a constant", () => {
    const real = mountainWest();
    const input = leveled(real);
    const world = real.map((e) => (e.id === "us-state-co" ? { ...e, scope: "world" as const } : e));
    for (const q of tagQuestions(input, world)) {
      expect(q.scope).toBe(q.entityId === "us-state-co" ? "world" : "us");
    }
  });
});

describe("T-024 criterion 8: entityType is the entity's type", () => {
  test("committed bank: all 150 are state", () => {
    const entities = bank();
    const out = tagQuestions(leveled(entities), entities);
    expect(out.filter((q) => q.entityType === "state").length).toBe(150);
  });

  test("follows the entity, not a constant", () => {
    const real = mountainWest();
    const input = leveled(real);
    const swapped = real.map((e) =>
      e.id === "us-state-co" ? { ...e, type: "country" as const } : e,
    );
    for (const q of tagQuestions(input, swapped)) {
      expect(q.entityType).toBe(q.entityId === "us-state-co" ? "country" : "state");
    }
  });
});

describe("T-024 criterion 9: region is the entity's region verbatim", () => {
  test("committed bank: equals the entity's region; CO is Mountain West", () => {
    const entities = bank();
    const byId = new Map(entities.map((e) => [e.id, e]));
    const out = tagQuestions(leveled(entities), entities);
    for (const q of out) expect(q.region).toBe(byId.get(q.entityId)?.region as string);
    const co = out.filter((q) => q.entityId === "us-state-co");
    expect(co.length).toBe(3);
    for (const q of co) expect(q.region).toBe("Mountain West");
  });

  test("odd case and spacing are kept, not trimmed or slugged", () => {
    const real = mountainWest();
    const input = leveled(real);
    const odd = "  mountain  WEST ";
    const changed = real.map((e) => (e.id === "us-state-co" ? { ...e, region: odd } : e));
    const co = tagQuestions(input, changed).filter((q) => q.entityId === "us-state-co");
    expect(co.length).toBe(3);
    for (const q of co) expect(q.region).toBe(odd);
  });
});

describe("T-024 criterion 10: topic by template", () => {
  test("identify and click are location, capital-of is capital; 100 / 50", () => {
    const entities = bank();
    const out = tagQuestions(leveled(entities), entities);
    const expected: Record<string, string> = {
      [IDENTIFY]: "location",
      [CLICK]: "location",
      [CAPITAL]: "capital",
    };
    for (const q of out) expect(q.topic).toBe(expected[q.templateId] as never);
    expect(out.filter((q) => q.topic === "location").length).toBe(100);
    expect(out.filter((q) => q.topic === "capital").length).toBe(50);
    expect(out.filter((q) => q.templateId === IDENTIFY).length).toBe(50);
    expect(out.filter((q) => q.templateId === CLICK).length).toBe(50);
  });
});

describe("T-024 criterion 11: ageBand is the template's min_age_band", () => {
  test("committed bank: 1 for all 150", () => {
    const entities = bank();
    const out = tagQuestions(leveled(entities), entities);
    expect(out.filter((q) => q.ageBand === 1).length).toBe(150);
  });

  for (const band of [2, 3] as const) {
    test(`a template with min_age_band ${band} gives ageBand ${band}, only to its own questions`, () => {
      const entities = mountainWest();
      const templates = [tpl(IDENTIFY), { ...tpl(CAPITAL), min_age_band: band }, tpl(CLICK)];
      const out = tagQuestions(leveled(entities, templates), entities, templates);
      expect(out.filter((q) => q.templateId === CAPITAL).length).toBeGreaterThan(0);
      for (const q of out) expect(q.ageBand).toBe(q.templateId === CAPITAL ? band : 1);
    });
  }
});

describe("T-024 criterion 12: format is the template's format", () => {
  test("committed bank", () => {
    const entities = bank();
    const fmt = new Map(TEMPLATES.map((t) => [t.id, t.format]));
    for (const q of tagQuestions(leveled(entities), entities)) {
      expect(q.format).toBe(fmt.get(q.templateId) as never);
    }
  });
});

describe("T-024 criterion 13: level is carried strictly", () => {
  test("every level is the input's, strictly equal", () => {
    const entities = bank();
    const input = leveled(entities);
    const out = tagQuestions(input, entities);
    out.forEach((q, i) => expect(Object.is(q.level, input[i]?.level)).toBe(true));
  });

  test("a hand-set 17.25 comes out as 17.25", () => {
    const entities = mountainWest();
    const input = leveled(entities).map((q, i) => (i === 1 ? { ...q, level: 17.25 } : q));
    const out = tagQuestions(input, entities);
    expect(out[1]?.level).toBe(17.25);
  });
});

// ---- Matches the schema ----

describe("T-024 criterion 14: committed bank matches backend enums", () => {
  test("topic, scope, entityType, format in backend enums; ageBand, level, region in range", () => {
    const topics = new Set(backendValues("Topic"));
    const scopes = new Set(backendValues("Scope"));
    const types = new Set(backendValues("EntityType"));
    const formats = new Set(backendValues("QuestionFormat"));
    expect(topics.size).toBe(10);
    const entities = bank();
    const out = tagQuestions(leveled(entities), entities);
    expect(out.length).toBe(150);
    for (const q of out) {
      expect(topics.has(q.topic)).toBe(true);
      expect(scopes.has(q.scope)).toBe(true);
      expect(types.has(q.entityType)).toBe(true);
      expect(formats.has(q.format)).toBe(true);
      expect(Number.isInteger(q.ageBand)).toBe(true);
      expect([1, 2, 3]).toContain(q.ageBand);
      expect(Number.isFinite(q.level)).toBe(true);
      expect(q.level).toBeGreaterThanOrEqual(0);
      expect(q.level).toBeLessThanOrEqual(18);
      expect(typeof q.region).toBe("string");
      expect((q.region as string).trim().length).toBeGreaterThan(0);
    }
  });
});

// ---- Holes and bad input ----

describe("T-024 criterion 15: a missing or blank region omits the key", () => {
  const cases: Array<[string, (e: Entity) => Entity]> = [
    [
      "absent",
      (e) => {
        const c = { ...e };
        delete c.region;
        return c;
      },
    ],
    ["null", (e) => ({ ...e, region: null as unknown as string })],
    ["empty", (e) => ({ ...e, region: "" })],
    ["whitespace", (e) => ({ ...e, region: " \t\n " })],
  ];
  for (const [label, hole] of cases) {
    test(`${label} region: no region key, other six present, no throw`, () => {
      const real = mountainWest();
      const input = leveled(real);
      const holed = real.map((e) => (e.id === "us-state-co" ? hole(e) : e));
      const out = tagQuestions(input, holed);
      const co = out.filter((q) => q.entityId === "us-state-co");
      expect(co.length).toBe(3);
      for (const q of co) {
        expect(Object.hasOwn(q, "region")).toBe(false);
        const rec = q as unknown as Record<string, unknown>;
        for (const key of SEVEN.filter((k) => k !== "region")) {
          expect(rec[key] === undefined || rec[key] === null).toBe(false);
        }
      }
      for (const q of out.filter((q) => q.entityId !== "us-state-co")) {
        expect(q.region).toBe("Mountain West");
      }
    });
  }
});

describe("T-024 criterion 16: a template with no topic is refused", () => {
  test("throws naming the template id, even mixed with good questions", () => {
    const entities = mountainWest();
    const orphan: Template = { ...tpl(CAPITAL), id: "tpl-orphan-verify" };
    expect(Object.hasOwn(TEMPLATE_TOPICS, orphan.id)).toBe(false);
    const templates = [...TEMPLATES, orphan];
    const input = leveled(entities, templates);
    expect(input.some((q) => q.templateId === orphan.id)).toBe(true);
    let result: unknown = "not set";
    expect(() => {
      result = tagQuestions(input, entities, templates);
    }).toThrow("tpl-orphan-verify");
    expect(result).toBe("not set");
  });

  test("an explicit empty topic map refuses even the real templates", () => {
    const entities = mountainWest();
    const capitalOnly = leveled(entities).filter((q) => q.templateId === CAPITAL);
    expect(capitalOnly.length).toBeGreaterThan(0);
    expect(() => tagQuestions(capitalOnly, entities, TEMPLATES, {})).toThrow(CAPITAL);
  });
});

describe("T-024 criterion 17: a topic outside the backend's ten is refused", () => {
  test("geography on a new template throws naming it", () => {
    const entities = mountainWest();
    const orphan: Template = { ...tpl(CAPITAL), id: "tpl-geo-verify" };
    const input = leveled(entities, [orphan]);
    expect(input.length).toBeGreaterThan(0);
    expect(() =>
      tagQuestions(input, entities, [orphan], { "tpl-geo-verify": "geography" }),
    ).toThrow("tpl-geo-verify");
  });

  test("geography on an existing template throws naming it", () => {
    const entities = mountainWest();
    const topics = { ...TEMPLATE_TOPICS, [CAPITAL]: "geography" };
    expect(() => tagQuestions(leveled(entities), entities, TEMPLATES, topics)).toThrow(CAPITAL);
  });

  test("non-string topic values are refused too", () => {
    const entities = mountainWest();
    for (const bad of [null, undefined, "", "Capital", 1]) {
      const topics = { ...TEMPLATE_TOPICS, [CAPITAL]: bad };
      expect(() => tagQuestions(leveled(entities), entities, TEMPLATES, topics)).toThrow(CAPITAL);
    }
  });

  test("a valid alternate topic is honoured, so refusal is about membership", () => {
    const entities = mountainWest();
    const topics = { ...TEMPLATE_TOPICS, [CAPITAL]: "landmark" };
    const out = tagQuestions(leveled(entities), entities, TEMPLATES, topics);
    for (const q of out.filter((q) => q.templateId === CAPITAL)) expect(q.topic).toBe("landmark");
  });

  test("validateTemplate still accepts every TEMPLATES entry (unchanged)", () => {
    for (const t of TEMPLATES) expect(validateTemplate(t)).toEqual([]);
  });
});

describe("T-024 criterion 18: every TEMPLATES entry has a topic", () => {
  test("each TEMPLATES id has a TEMPLATE_TOPICS entry that is a backend Topic", () => {
    const backend = new Set(backendValues("Topic"));
    expect(TEMPLATES.length).toBeGreaterThan(0);
    for (const t of TEMPLATES) {
      expect(Object.hasOwn(TEMPLATE_TOPICS, t.id)).toBe(true);
      expect(backend.has(TEMPLATE_TOPICS[t.id] as string)).toBe(true);
    }
  });
});

describe("T-024 criterion 19: unknown entity or template throws naming the question", () => {
  test("unknown entityId, mixed with good questions", () => {
    const entities = mountainWest();
    const input = leveled(entities);
    const bad = { ...(input[2] as LeveledQuestion), entityId: "us-state-zz" };
    const mixed = [...input.slice(0, 2), bad, ...input.slice(3)];
    let result: unknown = "not set";
    expect(() => {
      result = tagQuestions(mixed, entities);
    }).toThrow(bad.id);
    expect(result).toBe("not set");
  });

  test("entity present in the bank but not in the entities passed", () => {
    const entities = mountainWest();
    const input = leveled(entities);
    const co = input.find((q) => q.entityId === "us-state-co") as LeveledQuestion;
    expect(() =>
      tagQuestions(
        input,
        entities.filter((e) => e.id !== "us-state-co"),
      ),
    ).toThrow(co.id);
  });

  test("templateId not among the templates passed", () => {
    const entities = mountainWest();
    const input = leveled(entities);
    const click = input.find((q) => q.templateId === CLICK) as LeveledQuestion;
    expect(() =>
      tagQuestions(
        input,
        entities,
        TEMPLATES.filter((t) => t.id !== CLICK),
      ),
    ).toThrow(click.id);
  });
});

describe("T-024 criterion 21: the exported topic list equals backend Topic", () => {
  test("TOPICS as a set equals class Topic's values (independent parse)", () => {
    const ours = [...(TOPICS as readonly string[])];
    expect(new Set(ours).size).toBe(ours.length);
    expect(new Set(ours)).toEqual(new Set(backendValues("Topic")));
  });
});

// ---- What must not happen ----

describe("T-024 criterion 23: build.ts and refresh.ts never reach tags.ts", () => {
  test("transitive relative imports exclude tags.ts", () => {
    const seen = new Set<string>();
    const queue = ["build.ts", "refresh.ts"];
    while (queue.length > 0) {
      const file = queue.shift() as string;
      if (seen.has(file)) continue;
      seen.add(file);
      const text = readFileSync(join(SRC, file), "utf8");
      const specs = [
        ...text.matchAll(/(?:from\s+|import\s*\(\s*|import\s+|require\s*\(\s*)["'](\.[^"']+)["']/g),
      ].map((m) => m[1] as string);
      for (const spec of specs) {
        const rel = join(file, "..", spec).replace(/^\.\//, "");
        if (rel.endsWith(".ts")) queue.push(rel);
        else if (existsSync(join(SRC, `${rel}.ts`))) queue.push(`${rel}.ts`);
        else queue.push(join(rel, "index.ts"));
      }
    }
    expect(seen.size).toBeGreaterThan(3);
    expect(seen.has("tags.ts")).toBe(false);
  });
});

describe("T-024 criterion 26: the tag stage reads no file, env or clock", () => {
  test("tags.ts and its runtime imports contain no I/O, env, clock, random or network", () => {
    const forbidden =
      /node:fs|from\s+["']fs["']|readFile|Bun\.file|process\.env|Bun\.env|Date\b|performance\.|Math\.random|fetch\s*\(|crypto/;
    const tags = readFileSync(join(SRC, "tags.ts"), "utf8");
    expect(forbidden.test(tags)).toBe(false);
    const runtime = [...tags.matchAll(/^import\s+(?!type\b)[^;]*?from\s+["'](\.[^"']+)["']/gm)].map(
      (m) => m[1] as string,
    );
    for (const spec of runtime) {
      expect(["./templates", "./types"]).toContain(spec);
      expect(forbidden.test(readFileSync(join(SRC, `${spec}.ts`), "utf8"))).toBe(false);
    }
  });
});

// ---- Record ----

describe("T-024 criterion 28: engineering-decisions.md E-23", () => {
  const text = () => readFileSync(DECISIONS, "utf8");
  const e23 = () => {
    const t = text();
    const start = t.indexOf("## E-23 ");
    expect(start).toBeGreaterThan(-1);
    const next = t.indexOf("\n## ", start + 1);
    return t.slice(start, next === -1 ? undefined : next);
  };

  test("exactly one E-23, it is the highest, and E-1..E-22 all still exist", () => {
    const nums = [...text().matchAll(/^## E-(\d+) /gm)].map((m) => Number(m[1]));
    expect(nums.filter((n) => n === 23).length).toBe(1);
    expect(Math.max(...nums)).toBe(23);
    for (let n = 1; n <= 22; n++) expect(nums).toContain(n);
  });

  test("names the stage, module, five sources, topics, wire names, region hole, cross-checks", () => {
    const e = e23();
    for (const s of [
      "tagQuestions",
      "tags.ts",
      "scope",
      "entityType",
      "region",
      "topic",
      "ageBand",
      "min_age_band",
      "camelCase",
      "tags.test.ts",
      "QuestionFormat",
      "Topic",
      "models.py",
      "TEMPLATE_TOPICS",
    ]) {
      expect(e).toContain(s);
    }
    expect(e).toMatch(/`tpl-identify-on-map` → `location`/);
    expect(e).toMatch(/`tpl-click-the-map` → `location`/);
    expect(e).toMatch(/`tpl-capital-of` → `capital`/);
    expect(e).toMatch(/no `region` key/);
  });
});
