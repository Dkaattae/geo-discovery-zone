/**
 * T-020 (worker): the template record, the three templates, and the validator.
 *
 * Pure: `validateTemplate` and `TEMPLATES` are called directly, and the only
 * file I/O is reading the committed state files. No network, no build.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DISTRACTOR_STRATEGIES, TEMPLATES, type Template, validateTemplate } from "./templates";

const STATES_DIR = join(import.meta.dirname, "..", "data", "us-states");

function template(id: string): Template {
  const found = TEMPLATES.find((t) => t.id === id);
  if (found === undefined) throw new Error(`no template ${id}`);
  return found;
}

function valid(): Record<string, unknown> {
  return { ...template("tpl-capital-of"), requires: ["name", "capital"] };
}

function withField(key: string, value: unknown): Record<string, unknown> {
  return { ...valid(), [key]: value };
}

describe("TEMPLATES", () => {
  test("holds the three templates of plan §4 step 2, with distinct ids", () => {
    // T-026 (approved Test change request, PFX): the three come first, in order,
    // and all nine ids are distinct.
    const ids = TEMPLATES.map((t) => t.id);
    expect(ids.slice(0, 3)).toEqual(["tpl-identify-on-map", "tpl-capital-of", "tpl-click-the-map"]);
    expect(ids).toHaveLength(9);
    expect(new Set(ids).size).toBe(9);
  });

  test("every template validates clean and uses a known strategy", () => {
    for (const t of TEMPLATES) {
      expect(validateTemplate(t)).toEqual([]);
      expect(DISTRACTOR_STRATEGIES as readonly string[]).toContain(t.distractor_strategy);
    }
  });

  test("tpl-capital-of is the plan §1.2 example", () => {
    const t = template("tpl-capital-of");
    expect({
      ...t,
      requires: [...t.requires].sort(),
      applies_to: [...t.applies_to].sort(),
    }).toEqual({
      id: "tpl-capital-of",
      prompt: "What is the capital of {name}?",
      answer_field: "capital",
      distractor_strategy: "sibling_capitals_same_region",
      requires: ["capital", "name"],
      applies_to: ["country", "state"],
      format: "multiple_choice",
      base_difficulty: 2,
      min_age_band: 1,
    });
  });

  test("the map templates join on geometry_id", () => {
    const identify = template("tpl-identify-on-map");
    expect(identify.prompt).toBe("Which state is highlighted?");
    expect(identify.requires).toContain("geometry_id");
    const click = template("tpl-click-the-map");
    expect(click.answer_field).toBe("geometry_id");
    expect([...click.prompt.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1])).toEqual(["name"]);
  });

  test("every template's required fields are present and non-empty in all 50 state files", () => {
    const files = readdirSync(STATES_DIR).filter((f) => /^us-state-[a-z]{2}\.json$/.test(f));
    expect(files).toHaveLength(50);
    for (const file of files) {
      const entity = JSON.parse(readFileSync(join(STATES_DIR, file), "utf8")) as Record<
        string,
        unknown
      >;
      // T-026 (approved Test change request, S3): the three original templates.
      // Blank landmarks (6) and empty top_livestock (26) are deliberate.
      for (const t of TEMPLATES.slice(0, 3)) {
        for (const field of t.requires) {
          const v = entity[field];
          const label = `${file} ${t.id} ${field}`;
          expect(v, label).not.toBeUndefined();
          expect(v, label).not.toBeNull();
          expect(v, label).not.toBe("");
          if (Array.isArray(v)) expect(v.length, label).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("validateTemplate", () => {
  test("rejects non-objects without throwing", () => {
    for (const v of [null, undefined, 42, "tpl-x", [], {}]) {
      expect(validateTemplate(v).length).toBeGreaterThan(0);
    }
  });

  test("survives a throwing getter and a hostile proxy", () => {
    const getter = { ...valid() };
    Object.defineProperty(getter, "prompt", {
      enumerable: true,
      get() {
        throw new Error("boom");
      },
    });
    expect(validateTemplate(getter).length).toBeGreaterThan(0);
    const proxy = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error("boom");
        },
      },
    );
    expect(validateTemplate(proxy).length).toBeGreaterThan(0);
  });

  test("names a missing field and an extra one", () => {
    for (const key of Object.keys(valid())) {
      const v = valid();
      delete v[key];
      const problems = validateTemplate(v);
      expect(problems.some((p) => p.includes(key))).toBe(true);
    }
    const problems = validateTemplate(withField("topic", "capitals"));
    expect(problems.some((p) => p.includes("topic"))).toBe(true);
  });

  test("id", () => {
    expect(validateTemplate(withField("id", "tpl-a1-b2"))).toEqual([]);
    for (const id of ["tpl-", "capital-of", "tpl-Capital-Of", "tpl-capital_of", 7]) {
      expect(validateTemplate(withField("id", id)).length, String(id)).toBeGreaterThan(0);
    }
  });

  test("placeholders must name a required field", () => {
    expect(validateTemplate(withField("requires", ["capital"])).length).toBeGreaterThan(0);
    expect(validateTemplate(withField("prompt", "Which state is highlighted?"))).toEqual([]);
    expect(validateTemplate(withField("prompt", "Where is {}?")).length).toBeGreaterThan(0);
    expect(validateTemplate(withField("prompt", "Where is {name?")).length).toBeGreaterThan(0);
    expect(validateTemplate(withField("prompt", "")).length).toBeGreaterThan(0);
  });

  test("answer_field must be required", () => {
    const v = { ...valid(), prompt: "Name a capital.", requires: ["name"] };
    expect(validateTemplate(v).length).toBeGreaterThan(0);
  });

  test("field names are Entity keys; requires is non-empty and distinct", () => {
    for (const bad of ["capitol", "flag_url", "toString", "__proto__"]) {
      expect(
        validateTemplate(withField("requires", ["name", "capital", bad])).length,
      ).toBeGreaterThan(0);
    }
    for (const good of ["top_livestock", "highest_point_m"]) {
      expect(validateTemplate(withField("requires", ["name", "capital", good]))).toEqual([]);
    }
    expect(validateTemplate(withField("requires", [])).length).toBeGreaterThan(0);
    expect(
      validateTemplate(withField("requires", ["name", "capital", "name"])).length,
    ).toBeGreaterThan(0);
    const v = { ...valid(), answer_field: "capitol", requires: ["name", "capital", "capitol"] };
    expect(validateTemplate(v).length).toBeGreaterThan(0);
  });

  test("applies_to", () => {
    expect(validateTemplate(withField("applies_to", ["state"]))).toEqual([]);
    for (const bad of [[], ["province"], ["state", "continent"], ["state", "state"], "state"]) {
      expect(validateTemplate(withField("applies_to", bad)).length).toBeGreaterThan(0);
    }
  });

  test("format", () => {
    for (const good of ["map_click", "click_profile"]) {
      expect(validateTemplate(withField("format", good))).toEqual([]);
    }
    for (const bad of ["map-identify", "text-mc", undefined]) {
      expect(validateTemplate(withField("format", bad)).length).toBeGreaterThan(0);
    }
  });

  test("base_difficulty", () => {
    for (const good of [0, 18, 7.5]) {
      expect(validateTemplate(withField("base_difficulty", good))).toEqual([]);
    }
    for (const bad of [-0.5, 18.5, Number.NaN, Number.POSITIVE_INFINITY, "2"]) {
      expect(validateTemplate(withField("base_difficulty", bad)).length).toBeGreaterThan(0);
    }
  });

  test("min_age_band", () => {
    for (const good of [1, 2, 3]) {
      expect(validateTemplate(withField("min_age_band", good))).toEqual([]);
    }
    for (const bad of [0, 4, 1.5, "1"]) {
      expect(validateTemplate(withField("min_age_band", bad)).length).toBeGreaterThan(0);
    }
  });

  test("distractor_strategy", () => {
    expect(DISTRACTOR_STRATEGIES as readonly string[]).not.toContain("random");
    expect(validateTemplate(withField("distractor_strategy", "random")).length).toBeGreaterThan(0);
    expect(validateTemplate(withField("distractor_strategy", "neighbours_first"))).toEqual([]);
  });
});
