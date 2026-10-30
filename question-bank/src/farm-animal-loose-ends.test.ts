/**
 * T-096 worker tests: `clickDistractorsFor` refuses a fixed-pool pick rather
 * than emitting `undefined`, and still returns entity picks' geometry ids and
 * `ShortPool`s as before.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ADDED_FARM_ANIMALS, clickDistractorsFor } from "./distractors";
import { generate } from "./generate";
import { TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";

const STATES_DIR = join(import.meta.dirname, "..", "data", "us-states");
const bank: Entity[] = readdirSync(STATES_DIR)
  .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
const byId = new Map(bank.map((e) => [e.id, e]));

function tpl(id: string): Template {
  const found = TEMPLATES.find((t) => t.id === id);
  if (found === undefined) throw new Error(`no template ${id}`);
  return found;
}

describe("clickDistractorsFor with a fixed-pool pick", () => {
  const farm = tpl("tpl-farm-animal-of");
  // Two states: one other entity cannot supply three wrong answers, so the
  // pick must reach `ADDED_FARM_ANIMALS`.
  const pair = [byId.get("us-state-ia")!, byId.get("us-state-tx")!];
  const draft = generate(pair, [farm]).drafts.find((d) => d.entityId === "us-state-ia")!;

  test("the fixture really needs the pool", () => {
    expect(draft).toBeDefined();
    expect(ADDED_FARM_ANIMALS.length).toBeGreaterThan(0);
  });

  test("throws an Error naming the draft id, does not return", () => {
    let thrown: unknown;
    let returned: unknown = "not called";
    try {
      returned = clickDistractorsFor(draft, pair[0]!, farm, pair);
    } catch (e) {
      thrown = e;
    }
    expect(returned).toBe("not called");
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toContain(draft.id);
  });
});

describe("clickDistractorsFor over the committed bank's map_click drafts", () => {
  const clickTemplates = TEMPLATES.filter((t) => t.format === "map_click");
  const drafts = generate(bank, clickTemplates).drafts;

  test("there are map_click drafts to check", () => {
    expect(drafts.length).toBeGreaterThan(0);
  });

  test("every returned element is another entity's geometry_id string", () => {
    for (const d of drafts) {
      const out = clickDistractorsFor(d, byId.get(d.entityId)!, tpl(d.templateId), bank);
      if (!Array.isArray(out)) continue;
      const own = byId.get(d.entityId)!.geometry_id;
      for (const g of out) {
        expect([d.id, typeof g]).toEqual([d.id, "string"]);
        expect(bank.some((e) => e.geometry_id === g && e.geometry_id !== own)).toBe(true);
      }
    }
  });
});

describe("clickDistractorsFor passes a ShortPool through", () => {
  test("own entity with no centroid returns no_centroid, not a throw", () => {
    const click = TEMPLATES.find((t) => t.format === "map_click")!;
    const own = { ...byId.get("us-state-ia")!, centroid: undefined } as unknown as Entity;
    const draft = generate([own], [click]).drafts[0]!;
    expect(clickDistractorsFor(draft, own, click, bank)).toEqual({
      draftId: draft.id,
      found: 0,
      reason: "no_centroid",
    });
  });

  test("too few peers returns too_few_candidates, not a throw", () => {
    const click = TEMPLATES.find((t) => t.format === "map_click")!;
    const pair = [byId.get("us-state-ia")!, byId.get("us-state-tx")!];
    const draft = generate(pair, [click]).drafts.find((d) => d.entityId === "us-state-ia")!;
    const out = clickDistractorsFor(draft, pair[0]!, click, pair);
    expect(Array.isArray(out)).toBe(false);
    expect(out).toMatchObject({ draftId: draft.id, reason: "too_few_candidates" });
  });
});
