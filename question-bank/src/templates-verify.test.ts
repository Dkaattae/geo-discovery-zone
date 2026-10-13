import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DISTRACTOR_STRATEGIES, TEMPLATES, validateTemplate } from "./templates";
import type { Template } from "./templates";

/**
 * T-020, written by the `tester` from the brief's acceptance criteria. Expected
 * values come from the brief and plan §1.2, not from `templates.ts`. Pure
 * functions, called directly: no network, no seam, no spawn.
 */

const STATES_DIR = join(import.meta.dirname, "../data/us-states");
const SRC_DIR = import.meta.dirname;

/** Plan §1.2's example record, typed here from the brief (criterion 4). */
function valid(): Record<string, unknown> {
  return {
    id: "tpl-capital-of",
    prompt: "What is the capital of {name}?",
    answer_field: "capital",
    distractor_strategy: "sibling_capitals_same_region",
    requires: ["name", "capital"],
    applies_to: ["state", "country"],
    format: "multiple_choice",
    base_difficulty: 2,
    min_age_band: 1,
  };
}

const NINE = [
  "id",
  "prompt",
  "answer_field",
  "distractor_strategy",
  "requires",
  "applies_to",
  "format",
  "base_difficulty",
  "min_age_band",
];

function withField(key: string, value: unknown): Record<string, unknown> {
  return { ...valid(), [key]: value };
}

function byId(id: string): Template {
  const found = TEMPLATES.find((t) => t.id === id);
  if (found === undefined) throw new Error(`no template ${id}`);
  return found;
}

const sorted = (xs: readonly string[]) => [...xs].sort();

describe("T-020 criterion 1: Template has exactly the nine plan §1.2 fields", () => {
  test("each TEMPLATES entry has exactly the nine keys", () => {
    for (const t of TEMPLATES) expect(sorted(Object.keys(t))).toEqual(sorted(NINE));
  });
  test("type check: a record of the nine fields is assignable to Template", () => {
    const t: Template = {
      id: "tpl-x",
      prompt: "p",
      answer_field: "name",
      distractor_strategy: "neighbours_first",
      requires: ["name"],
      applies_to: ["state"],
      format: "map_identify",
      base_difficulty: 1,
      min_age_band: 1,
    };
    expect(validateTemplate(t)).toEqual([]);
  });
});

describe("T-020 criterion 2: TEMPLATES holds exactly the three ids", () => {
  test("three entries with the three named ids", () => {
    expect(Array.isArray(TEMPLATES)).toBe(true);
    expect(TEMPLATES).toHaveLength(3);
    expect(sorted(TEMPLATES.map((t) => t.id))).toEqual(
      sorted(["tpl-identify-on-map", "tpl-capital-of", "tpl-click-the-map"]),
    );
  });
});

describe("T-020 criterion 3: DISTRACTOR_STRATEGIES", () => {
  test("contains the two named strategies, all strings", () => {
    const names = [...DISTRACTOR_STRATEGIES] as string[];
    expect(names).toContain("neighbours_first");
    expect(names).toContain("sibling_capitals_same_region");
    for (const n of names) expect(typeof n).toBe("string");
  });
  test("every template's strategy is a member", () => {
    const names = [...DISTRACTOR_STRATEGIES] as string[];
    for (const t of TEMPLATES) expect(names).toContain(t.distractor_strategy);
  });
});

describe("T-020 criterion 4: tpl-capital-of equals the plan §1.2 example", () => {
  test("field for field", () => {
    const t = byId("tpl-capital-of");
    expect(t.prompt).toBe("What is the capital of {name}?");
    expect(t.answer_field).toBe("capital");
    expect(t.distractor_strategy).toBe("sibling_capitals_same_region");
    expect(sorted(t.requires)).toEqual(["capital", "name"]);
    expect(t.requires).toHaveLength(2);
    expect(sorted(t.applies_to)).toEqual(["country", "state"]);
    expect(t.applies_to).toHaveLength(2);
    expect(t.format).toBe("multiple_choice");
    expect(t.base_difficulty).toBe(2);
    expect(t.min_age_band).toBe(1);
  });
});

describe("T-020 criterion 5: tpl-identify-on-map", () => {
  test("pinned fields", () => {
    const t = byId("tpl-identify-on-map");
    expect(t.prompt).toBe("Which state is highlighted?");
    expect(t.answer_field).toBe("name");
    expect(t.format).toBe("map_identify");
    expect(t.distractor_strategy).toBe("neighbours_first");
    expect(t.applies_to).toEqual(["state"]);
    expect(t.requires).toContain("name");
    expect(t.requires).toContain("geometry_id");
  });
});

describe("T-020 criterion 6: tpl-click-the-map", () => {
  test("pinned fields", () => {
    const t = byId("tpl-click-the-map");
    expect(t.format).toBe("map_click");
    expect(t.answer_field).toBe("geometry_id");
    expect(t.distractor_strategy).toBe("neighbours_first");
    expect(t.applies_to).toEqual(["state"]);
    expect(t.requires).toContain("name");
    expect(t.requires).toContain("geometry_id");
  });
  test("prompt has {name} and no other placeholder", () => {
    const tokens = [...byId("tpl-click-the-map").prompt.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]);
    expect(tokens.length).toBeGreaterThan(0);
    for (const tok of tokens) expect(tok).toBe("name");
  });
});

describe("T-020 criterion 7: map templates' difficulty and age band", () => {
  for (const id of ["tpl-identify-on-map", "tpl-click-the-map"]) {
    test(`${id}: base_difficulty finite in 0–18, min_age_band in {1,2,3}`, () => {
      const t = byId(id);
      expect(typeof t.base_difficulty).toBe("number");
      expect(Number.isFinite(t.base_difficulty)).toBe(true);
      expect(t.base_difficulty).toBeGreaterThanOrEqual(0);
      expect(t.base_difficulty).toBeLessThanOrEqual(18);
      expect([1, 2, 3]).toContain(t.min_age_band);
    });
  }
});

describe("T-020 criterion 8: every TEMPLATES entry validates clean", () => {
  for (const id of ["tpl-identify-on-map", "tpl-capital-of", "tpl-click-the-map"]) {
    test(id, () => {
      expect(validateTemplate(byId(id))).toEqual([]);
    });
  }
});

describe("T-020 criterion 9: ids are distinct", () => {
  test("no duplicate id", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("T-020 criterion 10: never throws", () => {
  for (const [label, value] of [
    ["null", null],
    ["undefined", undefined],
    ["42", 42],
    ['"tpl-x"', "tpl-x"],
    ["[]", []],
    ["{}", {}],
  ] as const) {
    test(label, () => {
      let result: string[] = [];
      expect(() => {
        result = validateTemplate(value);
      }).not.toThrow();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  }
});

describe("T-020 criterion 11: missing and extra keys", () => {
  test("baseline: the plan example is valid", () => {
    expect(validateTemplate(valid())).toEqual([]);
  });
  for (const key of NINE) {
    test(`missing ${key} is named`, () => {
      const v = valid();
      delete v[key];
      const problems = validateTemplate(v);
      expect(problems.length).toBeGreaterThan(0);
      expect(problems.some((p) => p.includes(key))).toBe(true);
    });
  }
  test("extra key topic is named", () => {
    const problems = validateTemplate(withField("topic", "capitals"));
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.some((p) => p.includes("topic"))).toBe(true);
  });
});

describe("T-020 criterion 12: id pattern", () => {
  for (const id of ["tpl-capital-of", "tpl-a", "tpl-a1-b2", "tpl-x9"]) {
    test(`accepts ${id}`, () => {
      expect(validateTemplate(withField("id", id))).toEqual([]);
    });
  }
  for (const id of ["tpl-", "capital-of", "tpl-Capital-Of", "tpl-capital_of"]) {
    test(`rejects ${id}`, () => {
      expect(validateTemplate(withField("id", id)).length).toBeGreaterThan(0);
    });
  }
});

describe("T-020 criterion 13: placeholders name required fields", () => {
  test("accepted when requires is [name, capital]", () => {
    expect(validateTemplate(valid())).toEqual([]);
  });
  test("rejected when requires is [capital]", () => {
    expect(validateTemplate(withField("requires", ["capital"])).length).toBeGreaterThan(0);
  });
  test("prompt with no placeholders is accepted", () => {
    expect(validateTemplate(withField("prompt", "Which state is highlighted?"))).toEqual([]);
  });
});

describe("T-020 criterion 14: answer_field must be in requires", () => {
  test("answer capital, requires [name] is rejected", () => {
    const v = { ...valid(), prompt: "Which state is highlighted?", requires: ["name"] };
    expect(validateTemplate(v).length).toBeGreaterThan(0);
  });
});

describe("T-020 criterion 15: field names are Entity keys", () => {
  for (const bad of ["capitol", "flag_url"]) {
    test(`requires entry ${bad} rejected`, () => {
      expect(
        validateTemplate(withField("requires", ["name", "capital", bad])).length,
      ).toBeGreaterThan(0);
    });
    test(`answer_field ${bad} rejected`, () => {
      const v = { ...valid(), answer_field: bad, requires: ["name", "capital", bad] };
      expect(validateTemplate(v).length).toBeGreaterThan(0);
    });
  }
  for (const good of ["top_livestock", "highest_point_m"]) {
    test(`requires entry ${good} accepted`, () => {
      expect(validateTemplate(withField("requires", ["name", "capital", good]))).toEqual([]);
    });
    test(`answer_field ${good} accepted`, () => {
      const v = { ...valid(), answer_field: good, requires: ["name", good] };
      expect(validateTemplate(v)).toEqual([]);
    });
  }
  test("empty requires rejected", () => {
    const v = { ...valid(), prompt: "Which state is highlighted?", requires: [] };
    expect(validateTemplate(v).length).toBeGreaterThan(0);
  });
  test("duplicate in requires rejected", () => {
    expect(
      validateTemplate(withField("requires", ["name", "capital", "name"])).length,
    ).toBeGreaterThan(0);
  });
});

describe("T-020 criterion 16: applies_to", () => {
  test('["state"] accepted', () => {
    expect(validateTemplate(withField("applies_to", ["state"]))).toEqual([]);
  });
  for (const bad of [[], ["province"], ["state", "continent"]]) {
    test(`${JSON.stringify(bad)} rejected`, () => {
      expect(validateTemplate(withField("applies_to", bad)).length).toBeGreaterThan(0);
    });
  }
});

describe("T-020 criterion 17: format is a QuestionFormat", () => {
  const nine = [
    "map_identify",
    "map_click",
    "multiple_choice",
    "image",
    "ab_compare",
    "pin_pick",
    "pin_drop",
    "drag_order",
    "click_profile",
  ];
  for (const f of nine) {
    test(`${f} accepted`, () => {
      expect(validateTemplate(withField("format", f))).toEqual([]);
    });
  }
  for (const f of ["map-identify", "text-mc"]) {
    test(`${f} rejected`, () => {
      expect(validateTemplate(withField("format", f)).length).toBeGreaterThan(0);
    });
  }
});

describe("T-020 criterion 18: base_difficulty", () => {
  for (const d of [0, 18, 7.5]) {
    test(`${d} accepted`, () => {
      expect(validateTemplate(withField("base_difficulty", d))).toEqual([]);
    });
  }
  for (const d of [-0.5, 18.5, Number.NaN, Number.POSITIVE_INFINITY, "2"]) {
    test(`${String(d)} (${typeof d}) rejected`, () => {
      expect(validateTemplate(withField("base_difficulty", d)).length).toBeGreaterThan(0);
    });
  }
});

describe("T-020 criterion 19: min_age_band", () => {
  for (const b of [1, 2, 3]) {
    test(`${b} accepted`, () => {
      expect(validateTemplate(withField("min_age_band", b))).toEqual([]);
    });
  }
  for (const b of [0, 4, 1.5, "1"]) {
    test(`${JSON.stringify(b)} rejected`, () => {
      expect(validateTemplate(withField("min_age_band", b)).length).toBeGreaterThan(0);
    });
  }
});

describe("T-020 criterion 20: distractor_strategy must be in DISTRACTOR_STRATEGIES", () => {
  test("every member is accepted", () => {
    for (const s of DISTRACTOR_STRATEGIES) {
      expect(validateTemplate(withField("distractor_strategy", s))).toEqual([]);
    }
  });
  test('"random" is not in the set (Handoff) and is rejected', () => {
    expect([...DISTRACTOR_STRATEGIES] as string[]).not.toContain("random");
    expect(validateTemplate(withField("distractor_strategy", "random")).length).toBeGreaterThan(0);
  });
});

describe("T-020 criterion 21: every template applies to every committed state", () => {
  test("50 files, every required field present and non-empty", () => {
    const files = readdirSync(STATES_DIR).filter((f) => /^us-state-[a-z]{2}\.json$/.test(f));
    expect(files).toHaveLength(50);
    const gaps: string[] = [];
    for (const file of files) {
      const entity = JSON.parse(readFileSync(join(STATES_DIR, file), "utf8")) as Record<
        string,
        unknown
      >;
      for (const t of TEMPLATES) {
        for (const field of t.requires) {
          const v = entity[field];
          const empty =
            v === undefined ||
            v === null ||
            (typeof v === "string" && v.trim() === "") ||
            (Array.isArray(v) && v.length === 0);
          if (empty) gaps.push(`${file}: ${t.id} needs ${field}`);
        }
      }
    }
    expect(gaps).toEqual([]);
  });
});

describe("T-020 criterion 23: pipeline does not import templates.ts", () => {
  for (const file of ["build.ts", "refresh.ts", "normalize.ts"]) {
    test(file, () => {
      const text = readFileSync(join(SRC_DIR, file), "utf8");
      expect(text).not.toMatch(/from\s+["']\.\/templates(\.ts)?["']/);
      expect(text).not.toMatch(/import\(\s*["']\.\/templates/);
    });
  }
});
