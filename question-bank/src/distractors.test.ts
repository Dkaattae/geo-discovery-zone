/**
 * T-022 (worker): `buildChoices` over the committed bank and small inputs.
 *
 * Pure: `generate` and `buildChoices` are called directly. The only file I/O is
 * reading the committed state files. No network.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChoices, correctIndexFor, greatCircleKm } from "./distractors";
import { generate } from "./generate";
import { DISTRACTOR_STRATEGIES, TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";

const STATES_DIR = join(import.meta.dirname, "..", "data", "us-states");

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

const bank = loadBank();
const byId = new Map(bank.map((e) => [e.id, e]));
const byCapital = new Map(bank.map((e) => [e.capital, e]));
const byName = new Map(bank.map((e) => [e.name, e]));
const stateId = (postal: string) => `us-state-${postal.toLowerCase()}`;

function run(entities: Entity[], templates: Template[] = TEMPLATES) {
  return buildChoices(generate(entities, templates).drafts, entities, templates);
}

function distractorsOf(q: { choices: string[]; correctIndex: number }): string[] {
  return q.choices.filter((_, i) => i !== q.correctIndex);
}

/**
 * Expected distractors computed independently of the module's comparator:
 * walk tiers in order, nearest-first within each, skipping same text.
 */
function expected(own: Entity, tiers: ((e: Entity) => boolean)[], text: (e: Entity) => string) {
  const pool = bank.filter((e) => e.id !== own.id);
  const dist = (e: Entity) => greatCircleKm(own.centroid!, e.centroid!);
  const taken: string[] = [];
  const answer = text(own).trim().toLowerCase();
  const seen = new Set<string>();
  for (const inTier of tiers) {
    const tier = pool
      .filter((e) => !seen.has(e.id) && inTier(e))
      .toSorted((a, b) => dist(a) - dist(b) || (a.id < b.id ? -1 : 1));
    for (const e of tier) {
      seen.add(e.id);
      const t = text(e).trim().toLowerCase();
      if (taken.length < 3 && t !== answer && !taken.some((x) => x.toLowerCase() === t)) {
        taken.push(text(e));
      }
    }
  }
  return taken;
}

/**
 * T-026 (approved Test change request, S3): the three templates the T-022
 * tests below were written for. The six T-026 templates are pinned by
 * `t026-tester-verify.test.ts`.
 */
const ORIGINAL = TEMPLATES.filter((t) =>
  ["tpl-identify-on-map", "tpl-capital-of", "tpl-click-the-map"].includes(t.id),
);

describe("over the committed bank", () => {
  const { questions } = run(bank);
  const original = run(bank, ORIGINAL);
  const originalDrafts = generate(bank, ORIGINAL).drafts;

  test("criterion 1: 150 questions, one per draft, nothing reported", () => {
    expect(bank).toHaveLength(50);
    expect(original.questions).toHaveLength(150);
    expect(original.shortPools).toEqual([]);
    expect(original.questions.map((q) => q.id)).toEqual(originalDrafts.map((d) => d.id));
  });

  test("criteria 2-5: shape, correctIndex, distinct text, draft fields kept", () => {
    for (const [i, q] of original.questions.entries()) {
      expect(q.choices).toHaveLength(4);
      for (const c of q.choices) expect(c.trim()).not.toBe("");
      expect(Number.isInteger(q.correctIndex)).toBe(true);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);
      expect(q.choices[q.correctIndex]).toBe(q.answer);
      expect(new Set(q.choices.map((c) => c.trim().toLowerCase())).size).toBe(4);
      const { choices: _c, correctIndex: _i, choiceGeometryIds: _g, ...rest } = q;
      expect(rest).toEqual(originalDrafts[i]!);
    }
  });

  test("criterion 6: sibling_capitals_same_region tiers and order", () => {
    for (const q of questions.filter((x) => x.templateId === "tpl-capital-of")) {
      const own = byId.get(q.entityId)!;
      const same = (e: Entity) => e.region === own.region;
      const want = expected(own, [same, () => true], (e) => e.capital!);
      expect(distractorsOf(q)).toEqual(want);
    }
  });

  test("criterion 7: neighbours_first tiers and order, both map templates", () => {
    for (const q of original.questions.filter((x) => x.templateId !== "tpl-capital-of")) {
      const own = byId.get(q.entityId)!;
      const borders = own.borders ?? [];
      const want = expected(
        own,
        [(e) => borders.includes(e.id), (e) => e.region === own.region, () => true],
        (e) => e.name,
      );
      expect(distractorsOf(q)).toEqual(want);
    }
  });

  test("criteria 8-9: the region boundary and the 11 fallback states", () => {
    const sameRegionCount = new Map<string, number>();
    for (const q of questions.filter((x) => x.templateId === "tpl-capital-of")) {
      const own = byId.get(q.entityId)!;
      const n = distractorsOf(q).filter((c) => byCapital.get(c)!.region === own.region).length;
      sameRegionCount.set(q.entityId, n);
    }
    const regionSize = (e: Entity) => bank.filter((x) => x.region === e.region).length;
    for (const e of bank.filter((x) => regionSize(x) >= 4)) {
      expect(sameRegionCount.get(e.id)).toBe(3);
    }
    for (const p of ["IA", "MN", "ND", "SD", "AR", "LA", "OK", "TX"]) {
      expect(sameRegionCount.get(stateId(p))).toBe(3);
    }
    for (const p of ["KS", "MO", "NE", "AK", "OR", "WA"]) {
      expect(sameRegionCount.get(stateId(p))).toBe(2);
    }
    for (const p of ["AZ", "NM"]) expect(sameRegionCount.get(stateId(p))).toBe(1);
    for (const p of ["HI", "CA", "NV"]) expect(sameRegionCount.get(stateId(p))).toBe(0);

    const fallback = [...sameRegionCount].filter(([, n]) => n < 3).map(([id]) => id);
    expect(fallback.toSorted()).toEqual(
      ["KS", "MO", "NE", "AK", "OR", "WA", "AZ", "NM", "HI", "CA", "NV"].map(stateId).toSorted(),
    );
  });

  test("criterion 8: HI, CA, NV get the capitals of their 3 nearest states", () => {
    for (const p of ["HI", "CA", "NV"]) {
      const own = byId.get(stateId(p))!;
      const nearest = bank
        .filter((e) => e.id !== own.id)
        .toSorted(
          (a, b) =>
            greatCircleKm(own.centroid!, a.centroid!) - greatCircleKm(own.centroid!, b.centroid!),
        )
        .slice(0, 3)
        .map((e) => e.capital);
      const q = questions.find((x) => x.id === `gen:tpl-capital-of:${own.id}`)!;
      expect(distractorsOf(q)).toEqual(nearest as string[]);
    }
  });

  test("criterion 10: AK and HI map questions are full, with no border tier", () => {
    for (const p of ["AK", "HI"]) {
      expect(byId.get(stateId(p))!.borders).toEqual([]);
      for (const t of ["tpl-identify-on-map", "tpl-click-the-map"]) {
        const q = questions.find((x) => x.id === `gen:${t}:${stateId(p)}`)!;
        expect(q.choices).toHaveLength(4);
      }
    }
  });

  test("criterion 11: strategy comes from the template field", () => {
    const swapped: Template = { ...tpl("tpl-capital-of"), distractor_strategy: "neighbours_first" };
    const { questions: qs } = run(bank, [swapped]);
    const oh = qs.find((q) => q.entityId === "us-state-oh")!;
    const ohio = byId.get("us-state-oh")!;
    for (const c of distractorsOf(oh)) expect(ohio.borders).toContain(byCapital.get(c)!.id);
  });

  test("criterion 12: map_click carries choiceGeometryIds parallel to choices", () => {
    const clicks = questions.filter((q) => q.format === "map_click");
    expect(clicks).toHaveLength(50);
    for (const q of clicks) {
      expect(q.choiceGeometryIds).toHaveLength(4);
      q.choices.forEach((c, i) =>
        expect(q.choiceGeometryIds![i]).toBe(byName.get(c)!.geometry_id!),
      );
      expect(q.choiceGeometryIds![q.correctIndex]).toBe(q.answerGeometryId!);
    }
  });

  test("criterion 13: deterministic", () => {
    expect(run(bank)).toEqual(run(bank));
  });

  test("criterion 14: correctIndex depends on the draft id only", () => {
    const reversed = run(bank.toReversed(), ORIGINAL).questions;
    const subset = run(
      bank.filter((e) => ["OH", "IN", "MI", "KY", "PA"].includes(e.id.slice(-2).toUpperCase())),
      ORIGINAL,
    ).questions;
    const full = new Map(original.questions.map((q) => [q.id, q.correctIndex]));
    for (const q of [...reversed, ...subset]) {
      expect(q.correctIndex).toBe(full.get(q.id)!);
      expect(q.correctIndex).toBe(correctIndexFor(q.id));
    }
    expect(subset).toHaveLength(15);
  });

  test("criterion 15: every position used at least 20 times and once per template", () => {
    for (const k of [0, 1, 2, 3]) {
      expect(questions.filter((q) => q.correctIndex === k).length).toBeGreaterThanOrEqual(20);
      for (const t of TEMPLATES) {
        expect(questions.some((q) => q.templateId === t.id && q.correctIndex === k)).toBe(true);
      }
    }
  });
});

describe("short pools and bad input", () => {
  const four = ["us-state-oh", "us-state-in", "us-state-mi", "us-state-ky"].map((id) =>
    byId.get(id)!,
  );

  test("criterion 16: 4 states give questions; 3 states give reports only", () => {
    const ok = run(four, ORIGINAL);
    expect(ok.questions).toHaveLength(12);
    expect(ok.shortPools).toEqual([]);

    const short = run(four.slice(0, 3), ORIGINAL);
    expect(short.questions).toEqual([]);
    expect(short.shortPools).toHaveLength(9);
    for (const r of short.shortPools) {
      expect(r.found).toBe(2);
      expect(r.reason).toBe("too_few_candidates");
    }
  });

  test("criterion 16: missing or non-finite own centroid is reported, not thrown", () => {
    for (const centroid of [undefined, [1], [Number.NaN, 40], ["1", 2]]) {
      const broken = { ...four[0]!, centroid } as Entity;
      const input = [broken, ...four.slice(1)];
      const out = run(input, ORIGINAL);
      const own = out.shortPools.filter((r) => r.draftId.endsWith(broken.id));
      expect(own).toHaveLength(3);
      for (const r of own) expect(r.reason).toBe("no_centroid");
      expect(out.questions.some((q) => q.entityId === broken.id)).toBe(false);
    }
  });

  test("criterion 16: duplicate text does not count as a distractor", () => {
    const twin = { ...four[1]!, id: "us-state-zz", capital: " columbus " } as Entity;
    const out = run([...four, twin], [tpl("tpl-capital-of")]);
    for (const q of out.questions) {
      expect(new Set(q.choices.map((c) => c.trim().toLowerCase())).size).toBe(4);
    }
  });

  test("criterion 17: unknown entity or template throws with the draft id", () => {
    const { drafts } = generate(four);
    expect(() => buildChoices(drafts, four.slice(1))).toThrow(drafts[0]!.id);
    const missingTpl = drafts.find((d) => d.templateId === "tpl-capital-of")!;
    expect(() =>
      buildChoices(drafts, four, [tpl("tpl-identify-on-map"), tpl("tpl-click-the-map")]),
    ).toThrow(missingTpl.id);
  });

  test("criterion 20: inputs are not mutated", () => {
    const entities = structuredClone(bank);
    const { drafts } = generate(entities);
    const before = structuredClone({ entities, drafts, templates: TEMPLATES });
    buildChoices(drafts, entities, TEMPLATES);
    expect({ entities, drafts, templates: TEMPLATES }).toEqual(before);
  });

  test("criterion 22: strategy names unchanged", () => {
    // T-026 (approved Test change request, PFX): the T-022 names stay first, in order.
    expect([...DISTRACTOR_STRATEGIES].slice(0, 2)).toEqual([
      "neighbours_first",
      "sibling_capitals_same_region",
    ]);
    expect(DISTRACTOR_STRATEGIES).toHaveLength(8);
  });
});
