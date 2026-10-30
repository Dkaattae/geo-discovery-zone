import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { BANK_DIGESTS, bankFileDigest } from "./bank-pins";
import { SAME_CLIMATE_GROUPS } from "./distractors";
import { generate } from "./generate";
import { buildQuestionBank, renderQuestionFile } from "./question-file";
import { LEVEL_SEED_WEIGHTS } from "./seed-level";
import type { TaggedQuestion } from "./tags";
import { TEMPLATE_TOPICS, TEMPLATES, type Template, validateTemplate } from "./templates";
import type { Entity } from "./types";
import { loadCommittedEntities, REPO_ROOT } from "./write-questions";

/**
 * T-026 tester: one test (or more) per acceptance criterion of
 * `tasks/T-026-biggest-state-superlative.md` that the question bank can show.
 * Expected values come from the criteria and the committed entity files, never
 * from the implementation. Backend criteria are in
 * `backend/tests/test_t026_tester_criteria.py`; client criteria in
 * `frontend/src/lib/t026-tester.criteria.test.ts`.
 *
 * Reads committed files only. No network, no mocks, no spawn.
 */

const entities = loadCommittedEntities();
const bank = buildQuestionBank(entities);
const committed = JSON.parse(
  readFileSync(join(REPO_ROOT, "question-bank/data/questions/us-states.json"), "utf8"),
) as { count: number; questions: TaggedQuestion[] };

const code = (e: Entity): string => e.id.slice(-2).toUpperCase();
const byCode = new Map(entities.map((e) => [code(e), e]));
const byId = new Map(entities.map((e) => [e.id, e]));
const OLD_IDS = ["tpl-identify-on-map", "tpl-capital-of", "tpl-click-the-map"];

/** "The new template for X" per the criteria header: its topic and answer_field. */
function templateFor(topic: string, answerField: string): Template {
  const found = TEMPLATES.filter(
    (t) => TEMPLATE_TOPICS[t.id] === topic && t.answer_field === answerField,
  );
  expect(found).toHaveLength(1);
  return found[0] as Template;
}

const SUPERLATIVE = templateFor("superlative", "name");
const WILDLIFE = templateFor("wildlife", "state_animal");
const LANDMARK = templateFor("landmark", "landmark");
const CLIMATE = templateFor("climate", "climate_kid");
const CROPS = templateFor("agriculture", "top_crops");
const FARM = templateFor("agriculture", "top_livestock");
const NEW = [SUPERLATIVE, WILDLIFE, LANDMARK, CLIMATE, CROPS, FARM];
const NEW_IDS = NEW.map((t) => t.id);

const of = (t: Template): TaggedQuestion[] =>
  committed.questions.filter((q) => q.templateId === t.id);
const entityOf = (q: TaggedQuestion): Entity => byId.get(q.entityId) as Entity;
const wrongOf = (q: TaggedQuestion): string[] =>
  (q.choices as string[]).filter((_, i) => i !== q.correctIndex);
const questionFor = (t: Template, c: string): TaggedQuestion => {
  const q = of(t).find((x) => x.entityId === `us-state-${c.toLowerCase()}`);
  if (q === undefined) throw new Error(`no ${t.id} question for ${c}`);
  return q;
};
const norm = (s: string): string => s.trim().toLowerCase();
const both = (choices: string[], a: string, b: string): boolean =>
  choices.some((c) => norm(c) === norm(a)) && choices.some((c) => norm(c) === norm(b));

describe("T-026 criterion 1: exactly six new templates, the old three unchanged", () => {
  test("nine templates: the three old ids plus six, each valid MC for states with its topic", () => {
    expect(TEMPLATES).toHaveLength(9);
    expect(TEMPLATES.slice(0, 3).map((t) => t.id)).toEqual(OLD_IDS);
    expect(new Set(NEW_IDS).size).toBe(6);
    for (const t of NEW) {
      expect(OLD_IDS).not.toContain(t.id);
      expect(validateTemplate(t)).toEqual([]);
      expect(t.format).toBe("multiple_choice");
      expect(t.applies_to).toContain("state");
    }
  });

  test("the three old templates are deep-equal to their pre-T-026 values", () => {
    expect(TEMPLATES.slice(0, 3)).toEqual([
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
      expect.objectContaining({ id: "tpl-capital-of", answer_field: "capital" }),
      expect.objectContaining({ id: "tpl-click-the-map", answer_field: "geometry_id" }),
    ]);
    // Topics of the old three are unchanged.
    expect(OLD_IDS.map((id) => TEMPLATE_TOPICS[id])).toEqual(["location", "capital", "location"]);
  });
});

describe("T-026 criterion 2: prompt tokens", () => {
  test("the five curated prompts hold {name} exactly once and no other token", () => {
    for (const t of [WILDLIFE, LANDMARK, CLIMATE, CROPS, FARM]) {
      const tokens = t.prompt.match(/\{[^{}]*\}/g) ?? [];
      expect(tokens).toEqual(["{name}"]);
    }
  });
  test("the superlative prompt holds no token", () => {
    expect(SUPERLATIVE.prompt).not.toMatch(/[{}]/);
  });
});

describe("T-026 criterion 3: four distinct choices, the answer at correctIndex", () => {
  test("every new question", () => {
    const qs = committed.questions.filter((q) => NEW_IDS.includes(q.templateId));
    expect(qs.length).toBe(265);
    for (const q of qs) {
      expect(q.choices).toHaveLength(4);
      expect(new Set((q.choices as string[]).map(norm)).size).toBe(4);
      expect((q.choices as string[])[q.correctIndex as number]).toBe(q.answer);
    }
  });
});

describe("T-026 criterion 4: the old 150 unchanged, count 415", () => {
  test("the old-template questions hash to 6a515e2's 150, field for field, in order (re-pinned T-085a, row 25)", () => {
    const old = committed.questions.filter((q) => OLD_IDS.includes(q.templateId));
    expect(old).toHaveLength(150);
    // sha256 of JSON.stringify(main's `questions` array), recorded from 45b00d7.
    // T-092 (approved Test change request, row 23): re-pinned to the same 150
    // with `choices`, `correctIndex` and `choiceGeometryIds` stripped from the
    // 50 map_click questions, key order kept.
    // Re-pinned at 6a515e2 (re-pinned T-085a, Test change request row 25), after
    // T-085a moved the four HI/AK map levels.
    const digest = createHash("sha256").update(JSON.stringify(old)).digest("hex");
    expect(digest).toBe("f9e7455e46246d26d90f607966a149c0719e8ec122e63de5bb6f7f8a3b6cfe66");
  });
  test("count is 415 and matches the array", () => {
    expect(committed.count).toBe(415);
    expect(committed.questions).toHaveLength(415);
  });
});

describe("T-026 criterion 5: levels and concept_load", () => {
  test("every new question's level is within 0-18", () => {
    for (const q of committed.questions.filter((x) => NEW_IDS.includes(x.templateId))) {
      expect(Number.isFinite(q.level)).toBe(true);
      expect(q.level).toBeGreaterThanOrEqual(0);
      expect(q.level).toBeLessThanOrEqual(18);
    }
  });
  test("concept_load has each new id, and E-22 lists each key with its value", () => {
    const load = LEVEL_SEED_WEIGHTS.concept_load as Record<string, number>;
    const decisions = readFileSync(join(REPO_ROOT, "engineering-decisions.md"), "utf8");
    const e22 = decisions.slice(decisions.indexOf("## E-22"), decisions.indexOf("## E-23"));
    expect(e22.length).toBeGreaterThan(0);
    for (const id of NEW_IDS) {
      expect(typeof load[id]).toBe("number");
      expect(e22).toMatch(new RegExp(`${id}[^\\n]*\\b${load[id]}\\b`));
    }
  });
});

describe("T-026 criterion 6: validateTemplate's two new refusals", () => {
  const base = TEMPLATES[0] as Template;
  test("map_identify without geometry_id in requires is refused", () => {
    expect(validateTemplate({ ...base, requires: ["name"] }).length).toBeGreaterThan(0);
  });
  test("answer_field geometry_id without name in requires is refused", () => {
    const click = TEMPLATES[2] as Template;
    expect(validateTemplate({ ...click, requires: ["geometry_id"] }).length).toBeGreaterThan(0);
  });
  test("the three old templates still pass", () => {
    for (const t of TEMPLATES.slice(0, 3)) expect(validateTemplate(t)).toEqual([]);
  });
});

describe("T-026 criterion 7: list-valued answer fields", () => {
  const tpl: Template = { ...CROPS, id: "tpl-probe-list" };
  const ent = (top_crops: unknown): Entity =>
    ({ ...(byCode.get("MI") as Entity), top_crops }) as unknown as Entity;
  test("a string array gives its first element, not notText", () => {
    const { drafts, skipped } = generate([ent(["oats", "rye"])], [tpl]);
    expect(drafts.map((d) => d.answer)).toEqual(["oats"]);
    expect(skipped).toEqual([]);
  });
  test("an empty array is still reported missing", () => {
    const { drafts, skipped } = generate([ent([])], [tpl]);
    expect(drafts).toEqual([]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]?.missing).toContain("top_crops");
  });
  test("a number-valued answer field is still notText", () => {
    const area: Template = {
      ...CROPS,
      id: "tpl-probe-number",
      answer_field: "area_km2",
      requires: ["name", "area_km2"],
    };
    const { drafts, skipped } = generate([byCode.get("MI") as Entity], [area]);
    expect(drafts).toEqual([]);
    expect(skipped[0]?.notText).toContain("area_km2");
  });
});

describe("T-026 criteria 8-10: superlative", () => {
  const byRank = new Map(entities.map((e) => [e.area_rank as number, e]));
  test("criterion 8: exactly 47, ranks 1-47; DE, CT, RI are not answers", () => {
    const qs = of(SUPERLATIVE);
    expect(qs).toHaveLength(47);
    const ranks = qs
      .map((q) => entityOf(q).area_rank)
      .sort((a, b) => (a as number) - (b as number));
    expect(ranks).toEqual(Array.from({ length: 47 }, (_, i) => i + 1));
    for (const c of ["DE", "CT", "RI"]) {
      expect(qs.some((q) => q.entityId === (byCode.get(c) as Entity).id)).toBe(false);
    }
  });
  test("criterion 9: the right choice is rank r, the wrong ones exactly r+1..r+3 by name", () => {
    for (const q of of(SUPERLATIVE)) {
      const r = entityOf(q).area_rank as number;
      expect(q.answer).toBe((byRank.get(r) as Entity).name);
      expect(wrongOf(q).sort()).toEqual(
        [r + 1, r + 2, r + 3].map((k) => (byRank.get(k) as Entity).name).sort(),
      );
    }
  });
  test("criterion 10: one prompt, asks for the biggest, no measure words", () => {
    const prompts = new Set(of(SUPERLATIVE).map((q) => q.prompt));
    expect(prompts.size).toBe(1);
    const [p] = [...prompts] as [string];
    expect(p.toLowerCase()).toContain("biggest");
    for (const w of ["km", "area", "rank", "square", "land", "water"]) {
      expect(p.toLowerCase()).not.toContain(w);
    }
  });
});

describe("T-026 criteria 11-13: wildlife", () => {
  test("criterion 11: 50, one per state, each answer its state_animal", () => {
    const qs = of(WILDLIFE);
    expect(qs).toHaveLength(50);
    expect(new Set(qs.map((q) => q.entityId)).size).toBe(50);
    for (const q of qs) expect(q.answer).toBe(entityOf(q).state_animal as string);
  });
  test("criterion 12: no question shows both members of a same-animal pair", () => {
    const pairs = [
      ["Black bear", "American black bear"],
      ["Grizzly bear", "California grizzly bear"],
      ["Gray squirrel", "Eastern gray squirrel"],
      ["Horse", "Morgan horse"],
      ["Desert bighorn sheep", "Rocky Mountain bighorn sheep"],
    ] as const;
    for (const q of of(WILDLIFE))
      for (const [a, b] of pairs) expect(both(q.choices as string[], a, b)).toBe(false);
  });
  test("criterion 13: names the state, asks for its state animal, not 'Which state'", () => {
    for (const q of of(WILDLIFE)) {
      expect(q.prompt).toContain(entityOf(q).name);
      expect(q.prompt.toLowerCase()).toContain("state animal");
      expect(q.prompt).not.toMatch(/^which state/i);
    }
  });
});

describe("T-026 criteria 14-19: landmark", () => {
  const blank = ["DE", "IA", "KS", "MS", "OK", "RI"];
  const blankLandmarks = blank.map((c) => byCode.get(c)?.landmark).filter((x) => x);
  test("criterion 14: exactly 44; the six blank states get none and appear in none", () => {
    const qs = of(LANDMARK);
    expect(qs).toHaveLength(44);
    for (const c of blank) {
      expect(byCode.get(c)?.landmark ?? "").toBe("");
      expect(qs.some((q) => q.entityId === (byCode.get(c) as Entity).id)).toBe(false);
    }
    expect(blankLandmarks).toEqual([]);
  });
  test("criterion 15: answer is the state's landmark; every distractor another state's", () => {
    for (const q of of(LANDMARK)) {
      const own = entityOf(q);
      expect(q.answer).toBe(own.landmark as string);
      for (const w of wrongOf(q)) {
        const owner = entities.filter((e) => e.landmark === w);
        expect(owner.length).toBeGreaterThan(0);
        expect(owner.every((e) => e.id !== own.id)).toBe(true);
      }
    }
  });
  test("criterion 16: the two space centres never share a question", () => {
    for (const q of of(LANDMARK)) {
      expect(
        both(q.choices as string[], "U.S. Space & Rocket Center", "Space Center Houston"),
      ).toBe(false);
    }
  });
  test("criterion 17: names the state, asks which landmark is in it, not 'Where is'", () => {
    for (const q of of(LANDMARK)) {
      expect(q.prompt).toContain(entityOf(q).name);
      expect(q.prompt.toLowerCase()).toContain("landmark");
      expect(q.prompt).not.toMatch(/^where is/i);
    }
  });
  const notWrongIn = (needle: string, states: string[]): void => {
    for (const c of states) {
      const q = questionFor(LANDMARK, c);
      expect(wrongOf(q).some((w) => w.toLowerCase().includes(needle.toLowerCase()))).toBe(false);
    }
  };
  test("criterion 18: tasks.md traps", () => {
    notWrongIn("Mount Washington", ["WA"]);
    notWrongIn("St. Louis Cathedral", ["MO"]);
    notWrongIn("Chimney Rock", ["NC", "CO"]);
  });
  test("criterion 19 (C4): the expander's four traps", () => {
    notWrongIn("Great Smoky Mountains", ["NC"]);
    notWrongIn("Yellowstone", ["MT", "ID"]);
    notWrongIn("Hoover Dam", ["AZ"]);
    notWrongIn("Statue of Liberty", ["NJ"]);
  });
});

const GROUPS: Record<string, string[]> = {
  "Great Plains": ["IA", "NE", "KS", "SD", "ND"],
  "Northern Rockies": ["MT", "WY", "ID"],
  "Interior Southwest": ["AZ", "NM", "UT", "NV"],
  "Pacific Northwest": ["OR", "WA"],
  "Southern New England": ["CT", "MA", "RI"],
  "Northern New England": ["NH", "VT", "ME"],
  "Mid-Atlantic": ["NJ", "PA", "MD", "DE"],
  "Great Lakes / Upper Midwest": ["OH", "IN", "IL", "MI", "WI", "MN"],
  "Deep South": ["AL", "GA", "MS", "SC", "LA"],
  "Upland South": ["TN", "AR", "KY", "NC", "VA", "WV"],
};

describe("T-026 criteria 20-23: climate", () => {
  test("criterion 20: exactly 50, each answer its climate_kid", () => {
    const qs = of(CLIMATE);
    expect(qs).toHaveLength(50);
    for (const q of qs) expect(q.answer).toBe(entityOf(q).climate_kid as string);
  });
  test("criterion 21: no distractor from the answer state's same-climate group", () => {
    for (const q of of(CLIMATE)) {
      const c = code(entityOf(q));
      const group = Object.values(GROUPS).find((g) => g.includes(c));
      if (group === undefined) continue;
      const banned = group.filter((x) => x !== c).map((x) => byCode.get(x)?.climate_kid);
      for (const w of wrongOf(q)) expect(banned).not.toContain(w);
    }
  });
  test("criterion 22: names the state, asks about its climate, not 'Which state is'", () => {
    for (const q of of(CLIMATE)) {
      expect(q.prompt).toContain(entityOf(q).name);
      expect(q.prompt.toLowerCase()).toContain("climate");
      expect(q.prompt).not.toMatch(/^which state is/i);
    }
  });
  test("criterion 23: the pipeline's one group list is exactly those 41 states in those ten groups", () => {
    const asSets = (g: Readonly<Record<string, readonly string[]>>): string[][] =>
      Object.values(g)
        .map((v) => v.map((x) => x.toUpperCase().replace(/^US-STATE-/, "")).sort())
        .sort((a, b) => a.join().localeCompare(b.join()));
    expect(asSets(SAME_CLIMATE_GROUPS)).toEqual(asSets(GROUPS));
    expect(Object.values(SAME_CLIMATE_GROUPS).flat()).toHaveLength(41);
  });
  test("criterion 23: the list lives in exactly one non-test pipeline source file", () => {
    const src = resolve(REPO_ROOT, "question-bank/src");
    const files: string[] = [];
    const walk = (d: string): void => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith(".ts") && !p.endsWith(".test.ts")) files.push(p);
      }
    };
    walk(src);
    // A group's member list is the signature: "Southern New England" with CT, MA and RI.
    const holders = files.filter((f) => {
      const t = readFileSync(f, "utf8");
      return /Interior Southwest/.test(t) && /Upland South/.test(t) && /Deep South/.test(t);
    });
    expect(holders.map((f) => f.slice(src.length + 1))).toEqual(["distractors.ts"]);
  });
});

const crops = (e: Entity | undefined): string[] => (e?.top_crops ?? []) as string[];
const stock = (e: Entity | undefined): string[] => (e?.top_livestock ?? []) as string[];

describe("T-026 criteria 24-31: crops", () => {
  test("criterion 24: exactly 50, one per state", () => {
    expect(of(CROPS)).toHaveLength(50);
    expect(new Set(of(CROPS).map((q) => q.entityId)).size).toBe(50);
  });
  test("criterion 25: each answer is the state's first top_crops entry", () => {
    for (const q of of(CROPS)) expect(q.answer).toBe(crops(entityOf(q))[0] as string);
  });
  test("criterion 26: no distractor is in the state's own top_crops", () => {
    for (const q of of(CROPS))
      for (const w of wrongOf(q)) expect(crops(entityOf(q))).not.toContain(w);
  });
  test("criterion 27: no distractor is in a bordering state's top_crops", () => {
    for (const q of of(CROPS)) {
      const near = (entityOf(q).borders ?? []).flatMap((id) => crops(byId.get(id)));
      for (const w of wrongOf(q)) expect(near).not.toContain(w);
    }
  });
  test("criterion 28: no distractor is in a same-region state's top_crops", () => {
    for (const q of of(CROPS)) {
      const region = entityOf(q).region;
      const same = entities.filter((e) => e.region === region).flatMap(crops);
      for (const w of wrongOf(q)) expect(same).not.toContain(w);
    }
  });
  test("criterion 29: every distractor is some other state's crop", () => {
    for (const q of of(CROPS)) {
      for (const w of wrongOf(q)) {
        expect(entities.some((e) => e.id !== q.entityId && crops(e).includes(w))).toBe(true);
      }
    }
  });
  test("criterion 30: names the state and asks which crop it is known for growing", () => {
    for (const q of of(CROPS)) {
      expect(q.prompt).toContain(entityOf(q).name);
      expect(q.prompt.toLowerCase()).toMatch(/crop/);
      expect(q.prompt.toLowerCase()).toMatch(/grow/);
    }
  });
  test("criterion 31: the three same-thing crop pairs never share a question", () => {
    for (const q of of(CROPS)) {
      expect(both(q.choices as string[], "corn", "sweet corn")).toBe(false);
      expect(both(q.choices as string[], "hay", "alfalfa hay")).toBe(false);
      expect(both(q.choices as string[], "potatoes", "sweet potatoes")).toBe(false);
    }
  });
});

describe("T-026 criteria 32-34: farm animals", () => {
  test("criterion 32: exactly 24, one per state with non-empty top_livestock", () => {
    const want = entities
      .filter((e) => stock(e).length > 0)
      .map((e) => e.id)
      .sort();
    expect(want).toHaveLength(24);
    expect(
      of(FARM)
        .map((q) => q.entityId)
        .sort(),
    ).toEqual(want);
  });
  // T-088 TCR row 2 (approved): T-088's five added animals may also be wrong answers.
  test("criterion 33: answer is the first entry; distractors not the state's, but another's or one of T-088's five", () => {
    const added = ["goats", "horses", "ducks", "rabbits", "bison"];
    for (const q of of(FARM)) {
      const own = stock(entityOf(q));
      expect(q.answer).toBe(own[0] as string);
      for (const w of wrongOf(q)) {
        expect(own).not.toContain(w);
        expect(
          entities.some((e) => e.id !== q.entityId && stock(e).includes(w)) || added.includes(w),
        ).toBe(true);
      }
    }
  });
  test("criterion 34: never both cattle and dairy cows", () => {
    for (const q of of(FARM))
      expect(both(q.choices as string[], "cattle", "dairy cows")).toBe(false);
  });
});

describe("T-026 criterion 35: regeneration changes nothing", () => {
  test("rendering the committed entities gives the committed question file's bytes", () => {
    const onDisk = readFileSync(
      join(REPO_ROOT, "question-bank/data/questions/us-states.json"),
      "utf8",
    );
    expect(renderQuestionFile(entities)).toBe(onDisk);
  });
  test("the in-memory bank is the committed file's questions", () => {
    expect(bank.questions).toEqual(committed.questions);
  });
});

describe("T-026 criterion 39: the bank is under the cap, 400 KB at most", () => {
  test("every file under question-bank/data/ totals under 400 KB", () => {
    let total = 0;
    const walk = (d: string): void => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else total += statSync(p).size;
      }
    };
    walk(join(REPO_ROOT, "question-bank/data"));
    expect(total).toBeLessThan(400 * 1024);
  });
  test("a new E-n entry after E-24 names the cap", () => {
    const decisions = readFileSync(join(REPO_ROOT, "engineering-decisions.md"), "utf8");
    const after = decisions.slice(decisions.indexOf("## E-25"));
    expect(decisions.indexOf("## E-25")).toBeGreaterThan(0);
    expect(after).toMatch(/400 KB/);
  });
});

describe("T-026 criteria 50-51: no entity data changed, choices copied from entity fields", () => {
  // T-070 row W48 (E-30): pinned whole at b0ee336 through `bank-pins.ts`.
  test("criterion 50: the committed entity files match their b0ee336 pins, built_at aside", () => {
    const dir = join(REPO_ROOT, "question-bank/data/us-states");
    const files = readdirSync(dir).sort();
    expect(files).toEqual(Object.keys(BANK_DIGESTS).sort());
    for (const f of files)
      expect({ f, digest: bankFileDigest(f, readFileSync(join(dir, f), "utf8")) }).toEqual({
        f,
        digest: BANK_DIGESTS[f] as string,
      });
  });
  // T-088 TCR row 3 (approved): for tpl-farm-animal-of only, T-088's five added animals are allowed too.
  test("criterion 51: every new choice is a value of its template's answer field on some entity (T-088: farm animals may also be one of its five)", () => {
    const values = (t: Template): Set<string> =>
      new Set(
        entities.flatMap((e) => {
          const v = e[t.answer_field];
          return Array.isArray(v) ? (v as string[]) : typeof v === "string" ? [v] : [];
        }),
      );
    for (const t of NEW) {
      const ok = values(t);
      if (t.id === "tpl-farm-animal-of")
        for (const a of ["goats", "horses", "ducks", "rabbits", "bison"]) ok.add(a);
      for (const q of of(t)) for (const c of q.choices as string[]) expect(ok.has(c)).toBe(true);
    }
  });
  test("criterion 51: the new prompts are the only new strings in the file (six distinct shapes)", () => {
    const shapes = new Set(
      committed.questions
        .filter((q) => NEW_IDS.includes(q.templateId))
        .map((q) => q.prompt.replace(entityOf(q).name, "{name}")),
    );
    expect([...shapes].sort()).toEqual(NEW.map((t) => t.prompt).sort());
  });
});
