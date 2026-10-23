/**
 * T-022, written by the `tester` from the brief's acceptance criteria. Expected
 * values come from the brief and the committed bank, not from `distractors.ts`,
 * whose source was read for the entry point, signature and the parallel list's
 * name (recorded in E-21) only. Distance, tiers and nearest-first order are
 * recomputed here with this file's own haversine; nothing from the module under
 * test is used to build an expectation. Pure: no network, no seam. The only file
 * I/O is reading the committed bank and source / doc text.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChoices } from "./distractors";
import type { GeneratedQuestion } from "./distractors";
import { generate } from "./generate";
import type { QuestionDraft } from "./generate";
import { DISTRACTOR_STRATEGIES, TEMPLATES } from "./templates";
import type { Template } from "./templates";
import type { Entity } from "./types";

const SRC = import.meta.dirname;
const STATES_DIR = join(SRC, "..", "data", "us-states");
const DECISIONS = join(SRC, "..", "..", "engineering-decisions.md");

const IDENTIFY = "tpl-identify-on-map";
const CAPITAL = "tpl-capital-of";
const CLICK = "tpl-click-the-map";

/** Captured before any test runs, for criterion 22. */
const PRISTINE_TEMPLATES = structuredClone(TEMPLATES);
const PRISTINE_STRATEGIES = [...DISTRACTOR_STRATEGIES];

/**
 * T-026 (approved Test change request, S3): the three templates this file was
 * written for. Tests scoped to them keep their T-022 numbers; the six T-026
 * templates are pinned by `t026-tester-verify.test.ts`.
 */
const ORIGINAL = TEMPLATES.filter((t) => [IDENTIFY, CAPITAL, CLICK].includes(t.id));

/** Fresh parse per call, so no test can mutate another's data. */
function bank(): Entity[] {
  return readdirSync(STATES_DIR)
    .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
}

const code = (id: string) => id.replace("us-state-", "").toUpperCase();
const sid = (c: string) => `us-state-${c.toLowerCase()}`;
const tpl = (id: string) => TEMPLATES.find((t) => t.id === id) as Template;

function run(entities: Entity[], templates: Template[] = TEMPLATES) {
  const { drafts } = generate(entities, templates);
  return { drafts, ...buildChoices(drafts, entities, templates) };
}

// ---- independent oracle, from the brief's "Terms used below" ----

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const nonBlank = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

function finiteCentroid(e: Entity): [number, number] | null {
  const c: unknown = e.centroid;
  if (!Array.isArray(c) || c.length !== 2) return null;
  const [lon, lat] = c as unknown[];
  if (typeof lon !== "number" || typeof lat !== "number") return null;
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return [lon, lat];
}

/** Haversine on a unit sphere; `[longitude, latitude]` in degrees. */
function dist(a: [number, number], b: [number, number]): number {
  const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r;
  const dLon = (b[0] - a[0]) * r;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function choiceText(e: Entity, t: Template): unknown {
  const field = t.answer_field === "geometry_id" ? "name" : t.answer_field;
  return (e as unknown as Record<string, unknown>)[field];
}

function candidates(own: Entity, t: Template, entities: Entity[]): Entity[] {
  return entities.filter(
    (e) =>
      e.id !== own.id &&
      e.type === own.type &&
      e.scope === own.scope &&
      nonBlank(choiceText(e, t)) &&
      finiteCentroid(e) !== null &&
      (t.format !== "map_click" || nonBlank(e.geometry_id)),
  );
}

function tierOf(c: Entity, own: Entity, strategy: string): number {
  const sameRegion = nonBlank(own.region) && c.region === own.region;
  const borders = (own.borders ?? []) as string[];
  if (strategy === "neighbours_first") {
    if (borders.includes(c.id)) return 1;
    return sameRegion ? 2 : 3;
  }
  return sameRegion ? 1 : 2;
}

/** Ordered list of expected distractor entities for a draft. */
function expectedPicks(draft: QuestionDraft, entities: Entity[], templates: Template[]): Entity[] {
  const own = entities.find((e) => e.id === draft.entityId) as Entity;
  const t = templates.find((x) => x.id === draft.templateId) as Template;
  const here = finiteCentroid(own) as [number, number];
  const ordered = candidates(own, t, entities)
    .map((e) => ({
      e,
      tier: tierOf(e, own, t.distractor_strategy),
      d: dist(here, finiteCentroid(e) as [number, number]),
    }))
    .sort(
      (a, b) => a.tier - b.tier || a.d - b.d || (a.e.id < b.e.id ? -1 : a.e.id > b.e.id ? 1 : 0),
    );
  const taken: Entity[] = [];
  const texts: string[] = [draft.answer];
  for (const { e } of ordered) {
    const text = choiceText(e, t) as string;
    if (texts.some((x) => same(x, text))) continue;
    taken.push(e);
    texts.push(text);
    if (taken.length === 3) break;
  }
  return taken;
}

function distractorsOf(q: GeneratedQuestion): string[] {
  return q.choices.filter((_, i) => i !== q.correctIndex);
}

function byId(questions: GeneratedQuestion[], templateId: string, entityId: string) {
  const q = questions.find((x) => x.templateId === templateId && x.entityId === entityId);
  if (q === undefined) throw new Error(`no question for ${templateId} / ${entityId}`);
  return q;
}

// ---- Shape ----

describe("T-022 criterion 1: one question per draft over the committed bank", () => {
  test("150 questions, one per generate() draft, and no reports", () => {
    const { drafts, questions, shortPools } = run(bank(), ORIGINAL);
    expect(drafts.length).toBe(150);
    expect(questions.length).toBe(150);
    expect(shortPools).toEqual([]);
    expect(questions.map((q) => q.id).sort()).toEqual(drafts.map((d) => d.id).sort());
  });
});

describe("T-022 criterion 2: exactly four non-blank choices", () => {
  test("every question has 4 choices, all non-blank strings", () => {
    for (const q of run(bank()).questions) {
      expect(q.choices.length).toBe(4);
      for (const c of q.choices) expect(nonBlank(c)).toBe(true);
    }
  });
});

describe("T-022 criterion 3: correctIndex points at the answer", () => {
  test("integer 0..3 and choices[correctIndex] equals the draft's answer", () => {
    const { drafts, questions } = run(bank());
    for (const q of questions) {
      const d = drafts.find((x) => x.id === q.id) as QuestionDraft;
      expect(Number.isInteger(q.correctIndex)).toBe(true);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);
      expect(q.choices[q.correctIndex]).toBe(d.answer);
    }
  });
});

describe("T-022 criterion 4: no two choices share text", () => {
  test("over the bank, choices are distinct after trim + lower-case", () => {
    for (const q of run(bank()).questions) {
      const norm = q.choices.map((c) => c.trim().toLowerCase());
      expect(new Set(norm).size).toBe(4);
    }
  });
  test("a candidate whose text differs from the answer only in case and spaces is skipped", () => {
    const states = bank();
    // Give Indiana (Ohio's nearest same-region neighbour) Ohio's capital, padded and shouted.
    const oh = states.find((e) => e.id === sid("OH")) as Entity;
    const twisted = states.map((e) =>
      e.id === sid("IN") ? { ...e, capital: `  ${(oh.capital as string).toUpperCase()} ` } : e,
    );
    const { questions } = run(twisted);
    const q = byId(questions, CAPITAL, sid("OH"));
    const norm = q.choices.map((c) => c.trim().toLowerCase());
    expect(new Set(norm).size).toBe(4);
    expect(distractorsOf(q).some((c) => same(c, oh.capital as string))).toBe(false);
  });
});

describe("T-022 criterion 5: every draft field carried unchanged", () => {
  test("each question contains its draft deep-equal", () => {
    const { drafts, questions } = run(bank(), ORIGINAL);
    for (const d of drafts) {
      const q = questions.find((x) => x.id === d.id) as GeneratedQuestion;
      for (const [k, v] of Object.entries(d)) {
        expect((q as unknown as Record<string, unknown>)[k]).toEqual(v);
      }
    }
  });
});

// ---- Which distractors ----

describe("T-022 criteria 6 and 7: tiers, nearest-first, same-text skip", () => {
  test("every question's distractors are exactly the first three by the brief's rule", () => {
    const states = bank();
    const { drafts, questions } = run(states, ORIGINAL);
    for (const q of questions) {
      const d = drafts.find((x) => x.id === q.id) as QuestionDraft;
      const t = tpl(q.templateId);
      const want = expectedPicks(d, states, ORIGINAL).map((e) => choiceText(e, t) as string);
      expect([q.id, [...distractorsOf(q)].sort()]).toEqual([q.id, [...want].sort()]);
    }
  });
  test("criterion 6 on Ohio: the three nearest Great Lakes capitals", () => {
    const states = bank();
    const oh = states.find((e) => e.id === sid("OH")) as Entity;
    const here = finiteCentroid(oh) as [number, number];
    const want = states
      .filter((e) => e.id !== oh.id && e.region === oh.region)
      .sort(
        (a, b) =>
          dist(here, finiteCentroid(a) as [number, number]) -
          dist(here, finiteCentroid(b) as [number, number]),
      )
      .slice(0, 3)
      .map((e) => e.capital);
    expect(want.length).toBe(3);
    expect(distractorsOf(byId(run(states).questions, CAPITAL, oh.id)).sort()).toEqual(
      [...want].sort() as string[],
    );
  });
  test("criterion 7 on Ohio: the three nearest bordering states", () => {
    const states = bank();
    const oh = states.find((e) => e.id === sid("OH")) as Entity;
    const here = finiteCentroid(oh) as [number, number];
    const want = states
      .filter((e) => (oh.borders as string[]).includes(e.id))
      .sort(
        (a, b) =>
          dist(here, finiteCentroid(a) as [number, number]) -
          dist(here, finiteCentroid(b) as [number, number]),
      )
      .slice(0, 3)
      .map((e) => e.name);
    const { questions } = run(states);
    expect(distractorsOf(byId(questions, IDENTIFY, oh.id)).sort()).toEqual([...want].sort());
    expect(distractorsOf(byId(questions, CLICK, oh.id)).sort()).toEqual([...want].sort());
  });
  test("criterion 7 tier 2 tops up from the same region when borders run short", () => {
    // Every map question whose state has fewer than 3 borders: the border states all appear.
    const states = bank();
    const { questions } = run(states);
    let checked = 0;
    for (const s of states) {
      const borders = (s.borders ?? []) as string[];
      if (borders.length >= 3) continue;
      const names = states.filter((e) => borders.includes(e.id)).map((e) => e.name);
      for (const t of [IDENTIFY, CLICK]) {
        const ds = distractorsOf(byId(questions, t, s.id));
        for (const n of names) expect(ds).toContain(n);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
  test("candidates exclude other scopes, other types, non-finite centroids and blank text", () => {
    const states = bank();
    const oh = states.find((e) => e.id === sid("OH")) as Entity;
    // Decoys sit on Ohio's own centroid (distance 0) and in its region; each fails one rule.
    const decoys: Entity[] = [
      { ...oh, id: "us-state-x1", name: "Decoy World", capital: "Worldtown", scope: "world" },
      { ...oh, id: "us-state-x2", name: "Decoy Country", capital: "Countryville", type: "country" },
      {
        ...oh,
        id: "us-state-x3",
        name: "Decoy NaN",
        capital: "Nantown",
        centroid: [Number.NaN, 40],
      },
      {
        ...oh,
        id: "us-state-x4",
        name: "Decoy Short",
        capital: "Shortville",
        centroid: [1] as unknown as [number, number],
      },
      { ...oh, id: "us-state-x5", name: "Decoy Blank", capital: "   " },
    ];
    const withDecoys = [...states, ...decoys].map((e) =>
      e.id === oh.id
        ? { ...e, borders: [...(oh.borders as string[]), ...decoys.map((d) => d.id)] }
        : e,
    );
    const { questions } = buildChoices(generate(withDecoys).drafts, withDecoys);
    const banned = [
      "Decoy World",
      "Decoy Country",
      "Decoy NaN",
      "Decoy Short",
      "Worldtown",
      "Countryville",
      "Nantown",
      "Shortville",
    ];
    for (const t of [IDENTIFY, CAPITAL, CLICK]) {
      const q = byId(questions, t, oh.id);
      for (const b of banned) expect(q.choices).not.toContain(b);
    }
    // Blank capital is not a capital candidate, but its name is a valid map candidate.
    expect(byId(questions, CAPITAL, oh.id).choices.some((c) => c.trim() === "")).toBe(false);
    expect(byId(questions, IDENTIFY, oh.id).choices).toContain("Decoy Blank");
  });
  test("map_click candidates need a geometry_id; map_identify candidates do not", () => {
    const states = bank();
    const oh = states.find((e) => e.id === sid("OH")) as Entity;
    const noGeo = { ...oh, id: "us-state-zz", name: "Zedland", capital: "Zedville" } as Entity;
    delete (noGeo as Partial<Entity>).geometry_id;
    const input = [...states, noGeo].map((e) =>
      e.id === oh.id ? { ...e, borders: [...(oh.borders as string[]), noGeo.id] } : e,
    );
    const { questions } = buildChoices(generate(input).drafts, input);
    expect(byId(questions, IDENTIFY, oh.id).choices).toContain("Zedland");
    expect(byId(questions, CLICK, oh.id).choices).not.toContain("Zedland");
  });
  test("equal distance breaks ties by ascending entity id", () => {
    const states = bank();
    const oh = states.find((e) => e.id === sid("OH")) as Entity;
    // Four same-place twins, all bordering Ohio at distance 0; ids decide which three.
    const twins = ["us-state-t4", "us-state-t2", "us-state-t3", "us-state-t1"].map(
      (id, i) =>
        ({
          ...oh,
          id,
          name: `Twin ${id}`,
          capital: `Twincap ${i}`,
          geometry_id: `9${i}`,
        }) as Entity,
    );
    const input = [...states, ...twins].map((e) =>
      e.id === oh.id
        ? { ...e, borders: [...twins.map((t) => t.id), ...(oh.borders as string[])] }
        : e,
    );
    const { questions } = buildChoices(generate(input).drafts, input);
    expect(distractorsOf(byId(questions, IDENTIFY, oh.id)).sort()).toEqual([
      "Twin us-state-t1",
      "Twin us-state-t2",
      "Twin us-state-t3",
    ]);
  });
});

describe("T-022 criterion 8: the region boundary for tpl-capital-of", () => {
  const sameRegionCount = (q: GeneratedQuestion, states: Entity[]) => {
    const own = states.find((e) => e.id === q.entityId) as Entity;
    return distractorsOf(q).filter((c) =>
      states.some((e) => e.capital === c && e.id !== own.id && e.region === own.region),
    ).length;
  };
  const TWO = ["KS", "MO", "NE", "AK", "OR", "WA"];
  const ONE = ["AZ", "NM"];
  const NONE = ["HI", "CA", "NV"];
  const SMALL = [...TWO, ...ONE, ...NONE];

  test("every state outside the 11 gets three same-region capitals, the exactly-4 regions included", () => {
    const states = bank();
    const { questions } = run(states);
    const big = states.filter((s) => !SMALL.includes(code(s.id)));
    expect(big.length).toBe(39);
    for (const s of big) {
      expect([code(s.id), sameRegionCount(byId(questions, CAPITAL, s.id), states)]).toEqual([
        code(s.id),
        3,
      ]);
    }
    for (const c of ["IA", "MN", "ND", "SD", "AR", "LA", "OK", "TX"]) {
      expect([c, sameRegionCount(byId(questions, CAPITAL, sid(c)), states)]).toEqual([c, 3]);
    }
  });
  test("KS, MO, NE, AK, OR, WA have exactly 2 same-region distractors", () => {
    const states = bank();
    const { questions } = run(states);
    for (const c of TWO)
      expect([c, sameRegionCount(byId(questions, CAPITAL, sid(c)), states)]).toEqual([c, 2]);
  });
  test("AZ and NM have exactly 1", () => {
    const states = bank();
    const { questions } = run(states);
    for (const c of ONE)
      expect([c, sameRegionCount(byId(questions, CAPITAL, sid(c)), states)]).toEqual([c, 1]);
  });
  test("HI, CA, NV have none, and get the capitals of the 3 nearest states", () => {
    const states = bank();
    const { questions } = run(states);
    for (const c of NONE) {
      const own = states.find((e) => e.id === sid(c)) as Entity;
      const here = finiteCentroid(own) as [number, number];
      const nearest = states
        .filter((e) => e.id !== own.id)
        .sort(
          (a, b) =>
            dist(here, finiteCentroid(a) as [number, number]) -
            dist(here, finiteCentroid(b) as [number, number]),
        )
        .slice(0, 3)
        .map((e) => e.capital as string);
      const q = byId(questions, CAPITAL, own.id);
      expect([c, sameRegionCount(q, states)]).toEqual([c, 0]);
      expect([c, distractorsOf(q).sort()]).toEqual([c, nearest.sort()]);
    }
  });
});

describe("T-022 criterion 9: the fallback fires for exactly the 11", () => {
  test("capital questions with any out-of-region distractor are exactly the 11 states", () => {
    const states = bank();
    const { questions } = run(states);
    const fired = questions
      .filter((q) => q.templateId === CAPITAL)
      .filter((q) => {
        const own = states.find((e) => e.id === q.entityId) as Entity;
        return distractorsOf(q).some((c) => {
          const from = states.find((e) => e.capital === c) as Entity;
          return from.region !== own.region;
        });
      })
      .map((q) => code(q.entityId))
      .sort();
    expect(fired).toEqual(["AK", "AZ", "CA", "HI", "KS", "MO", "NE", "NM", "NV", "OR", "WA"]);
  });
});

describe("T-022 criterion 10: no borders still gives a full question", () => {
  test("AK and HI map questions have 4 choices, picked with tier 1 empty", () => {
    const states = bank();
    const { drafts, questions } = run(states);
    for (const c of ["AK", "HI"]) {
      const own = states.find((e) => e.id === sid(c)) as Entity;
      expect(own.borders).toEqual([]);
      for (const t of [IDENTIFY, CLICK]) {
        const q = byId(questions, t, own.id);
        expect(q.choices.length).toBe(4);
        const d = drafts.find((x) => x.id === q.id) as QuestionDraft;
        const want = expectedPicks(d, states, TEMPLATES).map((e) => e.name);
        expect(distractorsOf(q).sort()).toEqual(want.sort());
      }
    }
  });
});

describe("T-022 criterion 11: the strategy is read from the template", () => {
  test("tpl-capital-of switched to neighbours_first gives Ohio its bordering states' capitals", () => {
    const states = bank();
    const switched = TEMPLATES.map((t) =>
      t.id === CAPITAL ? { ...t, distractor_strategy: "neighbours_first" as const } : t,
    );
    const { questions } = run(states, switched);
    const oh = states.find((e) => e.id === sid("OH")) as Entity;
    const here = finiteCentroid(oh) as [number, number];
    const want = states
      .filter((e) => (oh.borders as string[]).includes(e.id))
      .sort(
        (a, b) =>
          dist(here, finiteCentroid(a) as [number, number]) -
          dist(here, finiteCentroid(b) as [number, number]),
      )
      .slice(0, 3)
      .map((e) => e.capital as string);
    const got = distractorsOf(byId(questions, CAPITAL, oh.id));
    expect(got.sort()).toEqual(want.sort());
    const borderCapitals = states
      .filter((e) => (oh.borders as string[]).includes(e.id))
      .map((e) => e.capital);
    for (const g of got) expect(borderCapitals).toContain(g);
  });
});

// ---- map_click ----

describe("T-022 criterion 12: map_click carries a parallel geometry_id list", () => {
  test("choiceGeometryIds is parallel to choices and its correct entry is answerGeometryId", () => {
    const states = bank();
    const clicks = run(states).questions.filter((q) => q.format === "map_click");
    expect(clicks.length).toBe(50);
    for (const q of clicks) {
      const ids = q.choiceGeometryIds as string[];
      expect(ids.length).toBe(q.choices.length);
      q.choices.forEach((name, i) => {
        const e = states.find((x) => x.name === name) as Entity;
        expect(ids[i]).toBe(e.geometry_id as string);
      });
      expect(ids[q.correctIndex]).toBe(q.answerGeometryId as string);
    }
  });
});

// ---- Position of the correct answer ----

describe("T-022 criterion 13: deterministic", () => {
  test("two full runs give deep-equal output", () => {
    const a = run(bank());
    const b = run(bank());
    expect(a.questions).toEqual(b.questions);
    expect(a.shortPools).toEqual(b.shortPools);
  });
});

describe("T-022 criterion 14: correctIndex depends on the draft id only", () => {
  test("same index over the bank, the bank reversed, and per-draft subsets", () => {
    const states = bank();
    const full = new Map(run(states, ORIGINAL).questions.map((q) => [q.id, q.correctIndex]));
    const reversed = run([...states].reverse(), ORIGINAL).questions;
    expect(reversed.length).toBe(150);
    for (const q of reversed)
      expect([q.id, q.correctIndex]).toEqual([q.id, full.get(q.id) as number]);

    // Subsets: the draft's own state plus three far-away states (so different
    // distractors), and plus every 7th state, each in two orders.
    for (const s of states) {
      const others = states.filter((e) => e.id !== s.id);
      const subsets = [
        [s, ...others.slice(-3)],
        [...others.slice(0, 3).reverse(), s],
        [s, ...others.filter((_, i) => i % 7 === 0)],
      ];
      for (const sub of subsets) {
        const mine = run(sub, ORIGINAL).questions.filter((x) => x.entityId === s.id);
        expect([s.id, sub.length, mine.length]).toEqual([s.id, sub.length, 3]);
        for (const q of mine) {
          expect(full.has(q.id)).toBe(true);
          expect([q.id, q.correctIndex]).toEqual([q.id, full.get(q.id) as number]);
        }
      }
    }
  });
});

describe("T-022 criterion 15: position not predictable from the format", () => {
  test("each index 0..3 holds at least 20 of 150, and appears for every template", () => {
    const { questions } = run(bank());
    for (const i of [0, 1, 2, 3]) {
      expect([i, questions.filter((q) => q.correctIndex === i).length >= 20]).toEqual([i, true]);
      for (const t of [IDENTIFY, CAPITAL, CLICK]) {
        expect([i, t, questions.some((q) => q.templateId === t && q.correctIndex === i)]).toEqual([
          i,
          t,
          true,
        ]);
      }
    }
  });
});

// ---- Bad input and short pools ----

describe("T-022 criterion 16: short pools are reported, not returned", () => {
  const pick = (codes: string[]) => bank().filter((e) => codes.includes(code(e.id)));

  test("4 committed states as the whole input: every draft becomes a question", () => {
    for (const group of [
      ["OH", "IN", "IL", "IA"],
      ["HI", "AK", "ME", "FL"],
      ["CA", "NV", "AZ", "NM"],
    ]) {
      const { drafts, questions, shortPools } = run(pick(group), ORIGINAL);
      expect(drafts.length).toBe(12);
      expect(questions.length).toBe(12);
      expect(shortPools).toEqual([]);
    }
  });
  test("3 committed states as the whole input: every draft reported with found 2, none a question", () => {
    for (const group of [
      ["OH", "IN", "IL"],
      ["HI", "AK", "ME"],
    ]) {
      const { drafts, questions, shortPools } = run(pick(group), ORIGINAL);
      expect(drafts.length).toBe(9);
      expect(questions).toEqual([]);
      expect(shortPools.length).toBe(9);
      expect(shortPools.map((r) => r.draftId).sort()).toEqual(drafts.map((d) => d.id).sort());
      for (const r of shortPools) expect(r.found).toBe(2);
    }
  });
  test("4 states but only 2 distinct capitals among the candidates: that capital draft is reported", () => {
    const four = pick(["OH", "IN", "IL", "IA"]);
    const il = four.find((e) => e.id === sid("IL")) as Entity;
    const input = four.map((e) =>
      e.id === sid("IA") ? { ...e, capital: `  ${(il.capital as string).toUpperCase()} ` } : e,
    );
    const { drafts, questions, shortPools } = run(input);
    const ohCap = drafts.find(
      (d) => d.templateId === CAPITAL && d.entityId === sid("OH"),
    ) as QuestionDraft;
    expect(questions.some((q) => q.id === ohCap.id)).toBe(false);
    const r = shortPools.find((x) => x.draftId === ohCap.id);
    expect(r?.found).toBe(2);
    // Names are still distinct, so the map drafts for Ohio are questions.
    expect(questions.some((q) => q.templateId === IDENTIFY && q.entityId === sid("OH"))).toBe(true);
  });
  for (const [label, centroid] of [
    ["missing", undefined],
    ["null", null],
    ["NaN", [Number.NaN, 40]],
    ["Infinity", [Number.POSITIVE_INFINITY, 40]],
    ["one number", [-82]],
    ["three numbers", [-82, 40, 1]],
    ["strings", ["-82", "40"]],
  ] as const) {
    test(`own centroid ${label}: its drafts are reported, others still built, no throw`, () => {
      const five = pick(["OH", "IN", "IL", "IA", "MI"]);
      const input = five.map((e) =>
        e.id === sid("OH") ? ({ ...e, centroid } as unknown as Entity) : e,
      );
      const { drafts } = generate(input, ORIGINAL);
      let out: ReturnType<typeof buildChoices> | undefined;
      expect(() => {
        out = buildChoices(drafts, input, ORIGINAL);
      }).not.toThrow();
      const result = out as ReturnType<typeof buildChoices>;
      const ohDrafts = drafts
        .filter((d) => d.entityId === sid("OH"))
        .map((d) => d.id)
        .sort();
      expect(ohDrafts.length).toBe(3);
      expect(result.questions.some((q) => q.entityId === sid("OH"))).toBe(false);
      const reported = result.shortPools.filter((r) => ohDrafts.includes(r.draftId));
      expect(reported.map((r) => r.draftId).sort()).toEqual(ohDrafts);
      for (const r of reported) {
        expect(Number.isInteger(r.found)).toBe(true);
        expect(r.found).toBeLessThan(3);
      }
      expect(result.questions.length).toBe(12);
    });
  }
});

describe("T-022 criterion 17: unknown entity or template throws with the draft id", () => {
  test("a draft whose entityId is not in the input", () => {
    const states = bank();
    const { drafts } = generate(states);
    const bad = {
      ...(drafts[0] as QuestionDraft),
      id: "gen:tpl-capital-of:us-state-nowhere",
      entityId: "us-state-nowhere",
    };
    expect(() => buildChoices([...drafts, bad], states)).toThrow(
      "gen:tpl-capital-of:us-state-nowhere",
    );
  });
  test("a draft whose templateId is not in the input templates", () => {
    const states = bank();
    const { drafts } = generate(states);
    const lone = drafts.find(
      (d) => d.templateId === CLICK && d.entityId === sid("OH"),
    ) as QuestionDraft;
    const withoutClick = TEMPLATES.filter((t) => t.id !== CLICK);
    const kept = drafts.filter((d) => d.templateId !== CLICK);
    expect(() => buildChoices([...kept, lone], states, withoutClick)).toThrow(lone.id);
  });
});

// ---- Recorded, and nothing else moved ----

describe("T-022 criterion 18: engineering-decisions.md E-21", () => {
  const text = () => readFileSync(DECISIONS, "utf8");
  const entry = () => {
    const t = text();
    const start = t.indexOf("## E-21 ");
    const next = t.indexOf("\n## ", start + 1);
    return t.slice(start, next === -1 ? undefined : next);
  };
  test("exactly one E-21 heading, following E-20, and every E-n number is distinct", () => {
    // "The next unused E-n" holds at the time of writing; a later, higher
    // entry is not a failure of this one (same shape as
    // highest-point-verify.test.ts's E-8 check). Review finding 1.
    const nums = [...text().matchAll(/^## E-(\d+)\b/gm)].map((m) => Number(m[1]));
    expect(nums.filter((n) => n === 21).length).toBe(1);
    expect(nums).toContain(20);
    expect(new Set(nums).size).toBe(nums.length);
  });
  test("names the parallel list exactly as the code spells it", () => {
    const click = run(bank()).questions.find((q) => q.format === "map_click") as GeneratedQuestion;
    const extra = Object.keys(click).filter(
      (k) => Array.isArray((click as unknown as Record<string, unknown>)[k]) && k !== "choices",
    );
    expect(extra).toEqual(["choiceGeometryIds"]);
    expect(entry()).toContain("`choiceGeometryIds`");
  });
  test("records tiers and nearest-first with a reason, the 11 fallback states, and the id-derived position", () => {
    const e = entry();
    expect(e).toMatch(/nearest/i);
    expect(e).toMatch(/why nearest/i);
    expect(e).toMatch(/tier/i);
    for (const c of ["HI", "CA", "NV", "AZ", "NM", "AK", "OR", "WA", "KS", "MO", "NE"])
      expect(e).toContain(c);
    expect(e).toMatch(/draft id/i);
    expect(e).toContain("correctIndex");
  });
});

describe("T-022 criterion 20: no I/O, clock, randomness or input mutation", () => {
  const source = () => readFileSync(join(SRC, "distractors.ts"), "utf8");
  test("distractors.ts imports only ./generate, ./templates and ./types", () => {
    const specs = [...source().matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    for (const s of specs) expect(["./generate", "./templates", "./types"]).toContain(s as string);
    expect(source()).not.toMatch(/\bimport\s*\(/);
    expect(source()).not.toMatch(/\brequire\s*\(/);
  });
  test("no fetch, fs, Bun I/O, Date, performance clock or Math.random", () => {
    const t = source();
    for (const needle of [
      /\bfetch\s*\(/,
      /node:/,
      /\bfs\b/,
      /\bBun\./,
      /\bDate\b/,
      /Math\.random/,
      /performance\./,
      /process\./,
    ]) {
      expect(t).not.toMatch(needle);
    }
  });
  test("inputs are not mutated (deep-frozen inputs, and deep-equal after a run)", () => {
    const deepFreeze = <T>(o: T): T => {
      if (o && typeof o === "object") {
        for (const v of Object.values(o)) deepFreeze(v);
        Object.freeze(o);
      }
      return o;
    };
    const states = bank();
    const templates = structuredClone(TEMPLATES);
    const { drafts } = generate(states, templates);
    const before = structuredClone({ states, templates, drafts });
    deepFreeze(states);
    deepFreeze(templates);
    deepFreeze(drafts);
    expect(() => buildChoices(drafts, states, templates)).not.toThrow();
    expect({ states, templates, drafts }).toEqual(before);
  });
});

describe("T-022 criterion 21: the pipeline does not import distractors.ts", () => {
  test("build.ts, refresh.ts, normalize.ts never reach it, directly or transitively", () => {
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
    expect(seen.size).toBeGreaterThan(3);
    expect(seen.has("distractors.ts")).toBe(false);
  });
});

describe("T-022 criterion 22: TEMPLATES and DISTRACTOR_STRATEGIES unchanged in value", () => {
  const T020: Template[] = [
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
  test("equal to the pre-T-022 values at load and after buildChoices runs", () => {
    // T-026 (approved Test change request, PFX): the T-020 values stay pinned as
    // the first entries, and the totals are pinned so nothing is dropped unseen.
    run(bank());
    expect(PRISTINE_TEMPLATES.slice(0, 3)).toEqual(T020);
    expect(TEMPLATES.slice(0, 3)).toEqual(T020);
    expect(PRISTINE_TEMPLATES).toHaveLength(9);
    expect(TEMPLATES).toHaveLength(9);
    expect(PRISTINE_STRATEGIES.slice(0, 2)).toEqual([
      "neighbours_first",
      "sibling_capitals_same_region",
    ]);
    expect([...DISTRACTOR_STRATEGIES].slice(0, 2)).toEqual([
      "neighbours_first",
      "sibling_capitals_same_region",
    ]);
    expect(PRISTINE_STRATEGIES).toHaveLength(8);
    expect(DISTRACTOR_STRATEGIES).toHaveLength(8);
  });
});
