/**
 * T-021 (worker): the generator over the committed bank and synthetic inputs.
 *
 * Pure: `generate` is called directly. The only file I/O is reading the
 * committed state files and backend/app/data/content.json. No network.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { draftId, generate } from "./generate";
import { TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";

const STATES_DIR = join(import.meta.dirname, "..", "data", "us-states");
// The hand-written bank, archived by T-040 when the served content.json became the generated one.
const CONTENT = join(
  import.meta.dirname,
  "..",
  "..",
  "archive",
  "hand-written-bank",
  "content.json",
);

function loadBank(): Entity[] {
  return readdirSync(STATES_DIR)
    .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
    .map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
}

function tpl(id: string): Template {
  const found = TEMPLATES.find((t) => t.id === id);
  if (found === undefined) throw new Error(`no template ${id}`);
  return found;
}

function state(overrides: Record<string, unknown> = {}): Entity {
  return {
    id: "us-state-zz",
    type: "state",
    scope: "us",
    name: "Zedland",
    capital: "Zed City",
    geometry_id: "99",
    ...overrides,
  } as Entity;
}

describe("over the committed bank", () => {
  const bank = loadBank();
  const { drafts, skipped } = generate(bank);
  const find = (templateId: string, entityId: string) =>
    drafts.find((d) => d.templateId === templateId && d.entityId === entityId);

  test("150 drafts, nothing skipped, 50 per template and 3 per entity", () => {
    expect(bank).toHaveLength(50);
    expect(drafts).toHaveLength(150);
    expect(skipped).toEqual([]);
    for (const t of TEMPLATES) expect(drafts.filter((d) => d.templateId === t.id)).toHaveLength(50);
    for (const e of bank) {
      expect(
        drafts
          .filter((d) => d.entityId === e.id)
          .map((d) => d.templateId)
          .toSorted(),
      ).toEqual(TEMPLATES.map((t) => t.id).toSorted());
    }
  });

  test("Colorado and Alaska, one per template", () => {
    expect(find("tpl-capital-of", "us-state-co")).toMatchObject({
      prompt: "What is the capital of Colorado?",
      answer: "Denver",
    });
    expect(find("tpl-capital-of", "us-state-ak")?.answer).toBe("Juneau");
    expect(find("tpl-identify-on-map", "us-state-co")).toEqual({
      id: "gen:tpl-identify-on-map:us-state-co",
      entityId: "us-state-co",
      templateId: "tpl-identify-on-map",
      format: "map_identify",
      prompt: "Which state is highlighted?",
      answer: "Colorado",
      highlightGeometryId: "08",
    });
    const click = find("tpl-click-the-map", "us-state-co");
    expect(click).toEqual({
      id: "gen:tpl-click-the-map:us-state-co",
      entityId: "us-state-co",
      templateId: "tpl-click-the-map",
      format: "map_click",
      prompt: "Find Colorado on the map.",
      answer: "Colorado",
      answerGeometryId: "08",
    });
    expect(click !== undefined && "highlightGeometryId" in click).toBe(false);
  });

  test("no code is a label, no brace survives, ids are unique", () => {
    const codes = new Set(bank.map((e) => e.geometry_id));
    for (const d of drafts) {
      expect(codes.has(d.prompt)).toBe(false);
      expect(codes.has(d.answer)).toBe(false);
      expect(d.answer).not.toMatch(/^\d+$/);
      expect(d.prompt).not.toMatch(/[{}]/);
    }
    expect(new Set(drafts.map((d) => d.id)).size).toBe(150);
  });

  test("no id collides with a hand-written question", () => {
    const content = JSON.parse(readFileSync(CONTENT, "utf8")) as { questions: { id: string }[] };
    expect(content.questions.length).toBeGreaterThan(0);
    const handWritten = new Set(content.questions.map((q) => q.id));
    expect(drafts.filter((d) => handWritten.has(d.id))).toEqual([]);
  });

  test("ids are stable across subsets and orderings", () => {
    const subset = generate([...bank].reverse().slice(0, 5));
    for (const d of subset.drafts) {
      expect(d.id).toBe(draftId(d.templateId, d.entityId));
      expect(find(d.templateId, d.entityId)?.id).toBe(d.id);
    }
  });

  test("pure: inputs unchanged, output deterministic, drafts detached", () => {
    const before = structuredClone(TEMPLATES);
    const bankBefore = structuredClone(bank);
    const again = generate(bank);
    expect(again).toEqual({ drafts, skipped });
    for (const d of again.drafts) {
      d.prompt = "x";
      d.templateId = "x";
    }
    expect(TEMPLATES).toEqual(before);
    expect(bank).toEqual(bankBefore);
  });
});

describe("skipping", () => {
  test.each([
    ["absent", undefined],
    ["null", null],
    ["empty", ""],
    ["blank", "   "],
    ["empty array", []],
  ])("capital %s skips tpl-capital-of only, and reports it", (_label, capital) => {
    const entity = state();
    if (capital === undefined) delete entity.capital;
    else (entity as unknown as Record<string, unknown>)["capital"] = capital;
    const { drafts, skipped } = generate([entity]);
    expect(drafts.map((d) => d.templateId).toSorted()).toEqual([
      "tpl-click-the-map",
      "tpl-identify-on-map",
    ]);
    expect(skipped).toEqual([
      { templateId: "tpl-capital-of", entityId: "us-state-zz", missing: ["capital"], notText: [] },
    ]);
  });

  test("every missing field is named", () => {
    const { drafts, skipped } = generate(
      [state({ name: "", geometry_id: null })],
      [tpl("tpl-click-the-map")],
    );
    expect(drafts).toEqual([]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]?.missing.toSorted()).toEqual(["geometry_id", "name"]);
  });

  test("one-character strings, one-element arrays and 0 are present", () => {
    const t: Template = {
      ...tpl("tpl-capital-of"),
      id: "tpl-edge",
      requires: ["name", "capital", "borders", "population"],
    };
    const { drafts, skipped } = generate(
      [state({ name: "X", capital: "Y", borders: ["us-state-aa"], population: 0 })],
      [t],
    );
    expect(skipped).toEqual([]);
    expect(drafts[0]).toMatchObject({ prompt: "What is the capital of X?", answer: "Y" });
  });

  test("applies_to is respected and not reported", () => {
    const country = state({
      id: "country-zz",
      type: "country",
      scope: "world",
      geometry_id: "ZZZ",
    });
    const { drafts, skipped } = generate([country]);
    expect(drafts.map((d) => d.templateId)).toEqual(["tpl-capital-of"]);
    expect(skipped).toEqual([]);
  });

  test("a non-string answer is reported, not stringified", () => {
    const t: Template = {
      ...tpl("tpl-capital-of"),
      id: "tpl-crops",
      prompt: "What grows in {name}?",
      answer_field: "top_crops",
      requires: ["name", "top_crops"],
    };
    const { drafts, skipped } = generate([state({ top_crops: ["corn"] })], [t]);
    expect(drafts).toEqual([]);
    expect(skipped).toEqual([
      { templateId: "tpl-crops", entityId: "us-state-zz", missing: [], notText: ["top_crops"] },
    ]);
  });

  test("a non-string prompt token is reported", () => {
    const { drafts, skipped } = generate([state({ name: 7 })], [tpl("tpl-capital-of")]);
    expect(drafts).toEqual([]);
    expect(skipped[0]?.notText).toEqual(["name"]);
  });
});

describe("bad input is refused", () => {
  test("an invalid template throws with its id and a problem, nothing generated", () => {
    const bad = { ...tpl("tpl-capital-of"), id: "tpl-bad", format: "essay" } as unknown as Template;
    expect(() => generate([state()], [...TEMPLATES, bad])).toThrow(/tpl-bad.*format/);
  });

  test("duplicate template ids throw", () => {
    expect(() => generate([state()], [tpl("tpl-capital-of"), tpl("tpl-capital-of")])).toThrow(
      /duplicate template id/,
    );
  });

  test("duplicate entity ids throw", () => {
    expect(() => generate([state(), state()])).toThrow(/duplicate entity id/);
  });
});

describe("no unreviewed text ships", () => {
  test("fun fact text never appears in a draft", () => {
    const entity = state({
      fun_facts: [
        { text: "Zedland has secret ZZ", source_url: null, reviewed: false },
        { text: "Zed City", source_url: null, reviewed: true },
      ],
      capital: "Zed Town",
    });
    const { drafts } = generate([entity]);
    expect(drafts).toHaveLength(3);
    for (const d of drafts) {
      for (const v of Object.values(d)) {
        expect(v).not.toContain("secret");
        expect(v).not.toContain("Zed City");
      }
    }
  });
});
