/**
 * T-025, written by the `tester` from the brief's acceptance criteria. Expected
 * values come from the criteria, the T-023 weights the brief lists, and the
 * pipeline (`generate` -> `buildChoices` -> `seedLevels`) run over the
 * committed bank. `seed-level.ts` was read for entry points and signatures
 * only.
 *
 * Baselines at `aa88101` (the commit the brief compares against) are embedded
 * as sha256 digests, computed once from a `git worktree` of `aa88101`, because
 * CI checks out shallow and cannot `git show` it:
 *
 *   - levels: sha256 of JSON.stringify of the 150 `[id, level]` pairs, sorted
 *     by id, from aa88101's own `seed-level.ts` over the committed bank
 *   - templates: sha256 of JSON.stringify(TEMPLATES) at aa88101
 *   - a directory: sha256 of the sorted lines `<repo path>\t<sha256 of file>\n`
 *   - a file: sha256 of its bytes
 *
 * Pure: no network, no seam. The only I/O is reading committed files.
 */
import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { buildChoices, clickDistractorsFor } from "./distractors";
import { generate } from "./generate";
import { LEVEL_MAX, LEVEL_MIN, LEVEL_SEED_WEIGHTS, seedLevels } from "./seed-level";
import { TEMPLATES } from "./templates";
import type { Entity } from "./types";

const SRC = import.meta.dirname;
const REPO = join(SRC, "..", "..");
const STATES_DIR = join(SRC, "..", "data", "us-states");
const DECISIONS = join(REPO, "engineering-decisions.md");

const IDENTIFY = "tpl-identify-on-map";
const CAPITAL = "tpl-capital-of";
const CLICK = "tpl-click-the-map";
const TPL_IDS = [IDENTIFY, CAPITAL, CLICK];

/** The 10 states of the brief. */
const TEN = ["CA", "TX", "FL", "NY", "WA", "CO", "KY", "HI", "AK", "RI"];

/** The T-023 weights, exactly as the brief's survey lists them. */
const T023 = {
  rank_bucket_edges: [10, 20, 35],
  population_rank_weight: 1,
  area_rank_weight: 0.5,
  missing_rank_bucket: 2,
  near_distractor_weight: 0.5,
  concept_load: { "tpl-identify-on-map": 0, "tpl-capital-of": 1, "tpl-click-the-map": 0 },
  concept_load_default: 1,
  familiarity_bonus: 0,
};

const sha = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");

function bank(): Entity[] {
  return readdirSync(STATES_DIR)
    .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
}

const sid = (code: string) => `us-state-${code.toLowerCase()}`;
const qid = (tpl: string, code: string) => `gen:${tpl}:${sid(code)}`;

function pipeline() {
  const entities = bank();
  const { questions } = buildChoices(generate(entities).drafts, entities);
  return { entities, questions, leveled: seedLevels(questions, entities) };
}

/**
 * T-026 (approved Test change request, S3): the pipeline over the three
 * templates T-025 hand-checked. The six T-026 templates are pinned by
 * `t026-tester-verify.test.ts`.
 */
function pipelineOriginal() {
  const original = TEMPLATES.slice(0, 3);
  const entities = bank();
  const { questions } = buildChoices(generate(entities, original).drafts, entities, original);
  return { entities, questions, leveled: seedLevels(questions, entities, original) };
}

/** T-026: the six concept_load keys added after T-023, one per new template. */
const T026_IDS = [
  "tpl-biggest-state",
  "tpl-state-animal-of",
  "tpl-landmark-in",
  "tpl-climate-of",
  "tpl-crop-of",
  "tpl-farm-animal-of",
];

function levelsById(): Map<string, number> {
  return new Map(pipeline().leveled.map((q) => [q.id, q.level]));
}

/** Run `fn` with the constant's values replaced, restoring them afterwards. */
function withWeights<T>(values: typeof T023, fn: () => T): T {
  const saved = structuredClone(LEVEL_SEED_WEIGHTS) as unknown as typeof T023;
  const target = LEVEL_SEED_WEIGHTS as unknown as typeof T023;
  const assign = (v: typeof T023) => {
    target.rank_bucket_edges = [...v.rank_bucket_edges];
    target.population_rank_weight = v.population_rank_weight;
    target.area_rank_weight = v.area_rank_weight;
    target.missing_rank_bucket = v.missing_rank_bucket;
    target.near_distractor_weight = v.near_distractor_weight;
    target.concept_load = { ...v.concept_load };
    target.concept_load_default = v.concept_load_default;
    target.familiarity_bonus = v.familiarity_bonus;
  };
  try {
    assign(values);
    return fn();
  } finally {
    assign(saved);
  }
}

// ---- the record ----

function e22(): string {
  const text = readFileSync(DECISIONS, "utf8");
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith("## E-22 "));
  expect(start).toBeGreaterThanOrEqual(0);
  let end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  if (end < 0) end = lines.length;
  return lines.slice(start, end).join("\n");
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

interface Row {
  state: string;
  template: string;
  prompt: string;
  correct: string;
  distractors: string;
  t023: string;
  final: string;
  verdict: string;
  why: string;
}

/** The E-22 table whose header has a Template column, as rows keyed by column. */
function table(): Row[] {
  const lines = e22().split("\n");
  const headerAt = lines.findIndex((l) => l.trim().startsWith("|") && /\bTemplate\b/.test(l));
  expect(headerAt).toBeGreaterThanOrEqual(0);
  const header = cells(lines[headerAt] as string).map((h) => h.toLowerCase());
  const col = (re: RegExp) => {
    const i = header.findIndex((h) => re.test(h));
    expect({ column: re.source, found: i >= 0 }).toEqual({ column: re.source, found: true });
    return i;
  };
  const idx = {
    state: col(/^state$/),
    template: col(/^template$/),
    prompt: col(/prompt/),
    correct: col(/correct/),
    distractors: col(/distractor/),
    t023: col(/t-023/),
    final: col(/final/),
    verdict: col(/verdict/),
    why: col(/why/),
  };
  const rows: Row[] = [];
  for (let i = headerAt + 2; i < lines.length && (lines[i] as string).trim().startsWith("|"); i++) {
    const c = cells(lines[i] as string);
    rows.push({
      state: c[idx.state] ?? "",
      template: c[idx.template] ?? "",
      prompt: c[idx.prompt] ?? "",
      correct: c[idx.correct] ?? "",
      distractors: c[idx.distractors] ?? "",
      t023: c[idx.t023] ?? "",
      final: c[idx.final] ?? "",
      verdict: c[idx.verdict] ?? "",
      why: c[idx.why] ?? "",
    });
  }
  return rows;
}

/** The postal code a row's State cell names (code or full name), or null. */
function codeFor(stateCell: string): string | null {
  const cell = stateCell.replace(/`/g, "").trim();
  for (const e of bank()) {
    const code = e.id.slice("us-state-".length).toUpperCase();
    if (cell.toUpperCase() === code || cell.toLowerCase() === e.name.toLowerCase()) return code;
  }
  return null;
}

const rowId = (r: Row) => qid(r.template.replace(/`/g, "").trim(), codeFor(r.state) ?? "??");

// ---- criteria 1-5: the 30 questions ----

describe("T-025 criteria 1-5: the 30 questions are recorded", () => {
  test("the record is inside E-22, dated, and names T-025", () => {
    const s = e22();
    expect(s).toMatch(/T-025/);
    expect(s).toMatch(/T-025[^\n]*\d{4}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}[^\n]*T-025/);
  });

  test("criterion 1: exactly 30 rows, one per (10 states x 3 templates), no pair twice", () => {
    const rows = table();
    expect(rows.length).toBe(30);
    const ids = rows.map(rowId);
    expect(new Set(ids).size).toBe(30);
    const want = TEN.flatMap((c) => TPL_IDS.map((t) => qid(t, c))).sort();
    expect([...ids].sort()).toEqual(want);
    // the template list really is TEMPLATES' first three (T-026, approved S3)
    expect(
      TEMPLATES.slice(0, 3)
        .map((t) => t.id)
        .sort(),
    ).toEqual([...TPL_IDS].sort());
  });

  test("criterion 2: prompt, correct answer and three distractors equal buildChoices' output", () => {
    const { entities, questions } = pipeline();
    const byId = new Map(questions.map((q) => [q.id, q]));
    for (const r of table()) {
      const id = rowId(r);
      const q = byId.get(id);
      expect({ id, exists: q !== undefined }).toEqual({ id, exists: true });
      if (q === undefined) continue;
      // T-092 (approved Test change request, rows 21 and 28): a map_click
      // question carries no choices, so its answer is the draft's and its three
      // distractors are the peers whose geometry ids `clickDistractorsFor` returns.
      let correct: string;
      let distractors: string[];
      if (q.format === "map_click") {
        const own = entities.find((e) => e.id === q.entityId) as Entity;
        const t = TEMPLATES.find((x) => x.id === q.templateId)!;
        const codes = clickDistractorsFor(q, own, t, entities);
        expect({ id, short: !Array.isArray(codes) }).toEqual({ id, short: false });
        correct = q.answer;
        distractors = (codes as string[])
          .flatMap((g) => entities.filter((e) => e.geometry_id === g).map((e) => e.name))
          .sort();
      } else {
        const choices = q.choices as string[];
        correct = choices[q.correctIndex as number] as string;
        distractors = choices.filter((_, i) => i !== q.correctIndex).sort();
      }
      const shown = r.distractors
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d !== "")
        .sort();
      expect({ id, prompt: r.prompt, correct: r.correct, distractors: shown }).toEqual({
        id,
        prompt: q.prompt,
        correct,
        distractors,
      });
    }
  });

  test("criterion 2: a {name} placeholder is filled in every recorded prompt", () => {
    for (const r of table())
      expect({ id: rowId(r), raw: /\{|\}/.test(r.prompt) }).toEqual({ id: rowId(r), raw: false });
  });

  test("criterion 3: the T-023 column equals seedLevels under the T-023 weights (one-decimal rounding, multiples of 0.5)", () => {
    const levels = withWeights(T023, levelsById);
    for (const r of table()) {
      const id = rowId(r);
      const computed = levels.get(id) as number;
      const shown = Number(r.t023);
      expect({ id, multipleOfHalf: Number.isInteger(computed * 2) }).toEqual({
        id,
        multipleOfHalf: true,
      });
      expect({
        id,
        finite: Number.isFinite(shown),
        close: Math.abs(shown - computed) <= 0.05,
      }).toEqual({
        id,
        finite: true,
        close: true,
      });
    }
  });

  test("criterion 4: the Final column equals seedLevels under the committed weights (within 0.05)", () => {
    const levels = levelsById();
    for (const r of table()) {
      const id = rowId(r);
      const computed = levels.get(id) as number;
      const shown = Number(r.final);
      expect({
        id,
        finite: Number.isFinite(shown),
        close: Math.abs(shown - computed) <= 0.05,
      }).toEqual({
        id,
        finite: true,
        close: true,
      });
    }
  });

  test("criterion 5: each verdict is exactly one of the three; too easy / too hard rows carry a sentence", () => {
    for (const r of table()) {
      const id = rowId(r);
      expect({ id, verdict: ["about right", "too easy", "too hard"].includes(r.verdict) }).toEqual({
        id,
        verdict: true,
      });
      if (r.verdict !== "about right") {
        const words = r.why.split(/\s+/).filter((w) => w !== "").length;
        expect({ id, sentence: words >= 5 && /[.!?]$/.test(r.why) }).toEqual({
          id,
          sentence: true,
        });
      }
    }
  });
});

// ---- criteria 6-9: the weight decision and the doc ----

type Leaf = {
  key: string;
  get: (w: typeof T023) => number;
  set: (w: typeof T023, v: number) => void;
};

/** Every number in the constant; each concept_load template id is its own key. */
function leaves(w: typeof T023): Leaf[] {
  const out: Leaf[] = [];
  w.rank_bucket_edges.forEach((_, i) =>
    out.push({
      key: `rank_bucket_edges[${i}]`,
      get: (x) => x.rank_bucket_edges[i] as number,
      set: (x, v) => {
        x.rank_bucket_edges[i] = v;
      },
    }),
  );
  for (const k of [
    "population_rank_weight",
    "area_rank_weight",
    "missing_rank_bucket",
    "near_distractor_weight",
    "concept_load_default",
    "familiarity_bonus",
  ] as const) {
    out.push({
      key: k,
      get: (x) => x[k],
      set: (x, v) => {
        x[k] = v;
      },
    });
  }
  for (const t of Object.keys(w.concept_load)) {
    out.push({
      key: `concept_load["${t}"]`,
      get: (x) => (x.concept_load as Record<string, number>)[t] as number,
      set: (x, v) => {
        (x.concept_load as Record<string, number>)[t] = v;
      },
    });
  }
  return out;
}

const current = () => structuredClone(LEVEL_SEED_WEIGHTS) as unknown as typeof T023;

describe("T-025 criteria 6-9: the weight decision is recorded and matches the code", () => {
  test("criterion 6: the 'which weights changed' list names exactly the changed keys, each with old -> new and a reason", () => {
    const final = current();
    const changed = leaves(T023).filter((l) => l.get(T023) !== l.get(final));
    const s = e22();
    const at = s.search(/weights? changed/i);
    expect(at).toBeGreaterThanOrEqual(0);
    // the passage: from that label to the next bold paragraph label
    const rest = s.slice(at);
    const stop = rest.slice(1).search(/\n\n\*\*/);
    const passage = stop < 0 ? rest : rest.slice(0, stop + 1);
    if (changed.length === 0) {
      expect(passage).toMatch(/no weight changed/i);
      return;
    }
    const bullets = passage
      .split("\n- ")
      .slice(1)
      .map((b) => b.replace(/\n\s*/g, " "));
    const listed = bullets.map((b) => (b.match(/^`([^`]+)`/)?.[1] ?? "").replace(/'/g, '"'));
    expect(listed.sort()).toEqual(changed.map((l) => l.key).sort());
    for (const l of changed) {
      const b = bullets.find((x) => x.startsWith("`" + l.key + "`")) as string;
      expect({
        key: l.key,
        oldNew: new RegExp(`\\b${l.get(T023)}\\s*(→|->|to)\\s*${l.get(final)}\\b`).test(b),
      }).toEqual({
        key: l.key,
        oldNew: true,
      });
      const reason = b.replace(/^`[^`]+`:?\s*\S+\s*(→|->|to)\s*\S+\.?/, "").trim();
      expect({ key: l.key, reason: reason.split(/\s+/).length >= 5 }).toEqual({
        key: l.key,
        reason: true,
      });
    }
  });

  test("criterion 6: the changed keys are exactly what the code changed (concept_load capital 1 -> 2 at hand-off)", () => {
    // Pins the hand-off state the record describes; a different committed
    // constant would need the record (above) to change with it.
    const final = current();
    const changed = leaves(T023)
      .filter((l) => l.get(T023) !== l.get(final))
      .map((l) => `${l.key}:${l.get(T023)}->${l.get(final)}`);
    expect(changed).toEqual([`concept_load["${CAPITAL}"]:1->2`]);
  });

  test("criterion 7: the constant block lists every final key exactly once with its final value, and nothing else", () => {
    const s = e22();
    const label = s.indexOf("The constant, as the code spells it:");
    expect(label).toBeGreaterThanOrEqual(0);
    const after = s.slice(label);
    const block = after.match(/```[^\n]*\n([\s\S]*?)```/)?.[1] ?? "";
    const entries = block
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "")
      .map((l) => {
        const m = l.match(/^([a-z_]+):\s*(.+)$/);
        expect({ line: l, parses: m !== null }).toEqual({ line: l, parses: true });
        return [m?.[1] as string, JSON.parse(m?.[2] as string)] as const;
      });
    const keys = entries.map(([k]) => k);
    expect(new Set(keys).size).toBe(keys.length);
    expect(Object.fromEntries(entries)).toEqual(current());
  });

  test("criterion 8: the range sentence states the min and max of the 150 final levels, each end naming a state and template that reach it", () => {
    const leveled = pipelineOriginal().leveled; // T-026, approved S3
    expect(leveled.length).toBe(150);
    const min = Math.min(...leveled.map((q) => q.level));
    const max = Math.max(...leveled.map((q) => q.level));
    const s = e22().replace(/\s+/g, " ");
    const m = s.match(/150 levels run from ([\d.]+) \(([^)]*)\) to ([\d.]+) \(([^)]*)\)/);
    expect(m).not.toBeNull();
    if (m === null) return;
    expect([Number(m[1]), Number(m[3])]).toEqual([min, max]);
    const tplWords: Record<string, RegExp> = {
      [IDENTIFY]: /identify/i,
      [CAPITAL]: /capital/i,
      [CLICK]: /click|find/i,
    };
    const names = new Map(bank().map((e) => [e.id, e.name]));
    const reaches = (paren: string, value: number) =>
      leveled.some(
        (q) =>
          q.level === value &&
          new RegExp(`\\b${names.get(q.entityId)}\\b`).test(paren) &&
          (tplWords[q.templateId] as RegExp).test(paren),
      );
    expect({ min: reaches(m[2] as string, min), max: reaches(m[4] as string, max) }).toEqual({
      min: true,
      max: true,
    });
  });

  test("criterion 9: the band decision is 1-5 sentences and names the grade range floor(min/2) to floor(max/2)", () => {
    const leveled = pipeline().leveled;
    const gMin = Math.floor(Math.min(...leveled.map((q) => q.level)) / 2);
    const gMax = Math.floor(Math.max(...leveled.map((q) => q.level)) / 2);
    const paras = e22().split(/\n\s*\n/);
    const band = paras.filter((p) => /\*\*The band\b/i.test(p));
    expect(band.length).toBe(1);
    const p = (band[0] as string)
      .replace(/\*\*The band\.?\*\*/i, "")
      .replace(/\s+/g, " ")
      .trim();
    const sentences = p.split(/(?<=[.!?])\s+(?=[A-Z`])/).filter((x) => x.trim() !== "");
    expect(sentences.length).toBeGreaterThanOrEqual(1);
    expect(sentences.length).toBeLessThanOrEqual(5);
    const ord = (n: number) => `${n}(st|nd|rd|th)`;
    const g = (n: number) => `(${ord(n)} grade|grade ${n})`;
    // the range itself: "<min grade> ... to ... <max grade>" inside one sentence
    const range = new RegExp(`\\b${g(gMin)}[^.]*?\\bto\\b[^.]*?\\b${g(gMax)}\\b`, "i");
    expect({ gMin, gMax, named: sentences.some((x) => range.test(x)) }).toEqual({
      gMin,
      gMax,
      named: true,
    });
    expect(p).toMatch(/floor\(level \/ 2\)|floor\([\d.]+ \/ 2\)|§1\.4/);
  });
});

// ---- criteria 10-13: what must still hold ----

/**
 * At aa88101, from `seed-level.ts` as it was, less the two exports T-086 removed
 * (`nearDistractorCount` and `levelFor`, recorded in E-22). T-086 Test change
 * request row 1, approved by Dkaattae 2026-10-16. Still exact equality.
 */
const AA88101_EXPORT_SIGNATURES = [
  "export const LEVEL_SEED_WEIGHTS = {",
  "export const LEVEL_MIN = 0;",
  "export const LEVEL_MAX = 18;",
  "export type LevelSeedWeights = typeof LEVEL_SEED_WEIGHTS;",
  "export interface LeveledQuestion extends GeneratedQuestion {",
  "export function seedLevels( questions: readonly GeneratedQuestion[], entities: readonly Entity[], templates: readonly Template[] = TEMPLATES, ): LeveledQuestion[] {",
];
const AA88101_LEVELS_SHA = "b2edf333e42c802cf984e18fcad4d328e4d1d46343371c2c583520321fcd5d23";
const AA88101_TEMPLATES_SHA = "10ff564bce019de36643b2dbeee65577af4548b0ec6037b3d5815e90705f35fc";

function exportSignatures(): string[] {
  const src = readFileSync(join(SRC, "seed-level.ts"), "utf8");
  const out: string[] = [];
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!(lines[i] as string).startsWith("export ")) continue;
    const sig: string[] = [];
    for (let j = i; j < lines.length; j++) {
      sig.push((lines[j] as string).trim());
      if (/[{;]$/.test((lines[j] as string).trim())) break;
    }
    out.push(sig.join(" "));
  }
  return out;
}

describe("T-025 criteria 10-13: what must still hold", () => {
  test("criterion 10: the key set of LEVEL_SEED_WEIGHTS and of concept_load equal the T-023 sets", () => {
    expect(Object.keys(LEVEL_SEED_WEIGHTS).sort()).toEqual(Object.keys(T023).sort());
    // T-026 (approved Test change request row 74): plus exactly the six new ids.
    expect(Object.keys(LEVEL_SEED_WEIGHTS.concept_load).sort()).toEqual(
      [...Object.keys(T023.concept_load), ...T026_IDS].sort(),
    );
    expect(LEVEL_SEED_WEIGHTS.rank_bucket_edges.length).toBe(T023.rank_bucket_edges.length);
  });

  test("criterion 10: LEVEL_MIN is 0 and LEVEL_MAX is 18", () => {
    expect([LEVEL_MIN, LEVEL_MAX]).toEqual([0, 18]);
  });

  test("criterion 10: exported names and function signatures of seed-level.ts equal aa88101's, less the two exports T-086 removed (E-22)", () => {
    expect(exportSignatures()).toEqual(AA88101_EXPORT_SIGNATURES);
  });

  test("criterion 10a: under the T-023 weights set at runtime, the 150 levels by id equal aa88101's", () => {
    const pairs = withWeights(T023, () =>
      pipelineOriginal() // T-026, approved S3
        .leveled.map((q) => [q.id, q.level] as [string, number])
        .sort((a, b) => (a[0] < b[0] ? -1 : 1)),
    );
    expect(pairs.length).toBe(150);
    expect(sha(JSON.stringify(pairs))).toBe(AA88101_LEVELS_SHA);
  });

  test("criterion 10a: the weights are restored after the runtime override", () => {
    const before = JSON.stringify(LEVEL_SEED_WEIGHTS);
    withWeights(T023, () => 0);
    expect(JSON.stringify(LEVEL_SEED_WEIGHTS)).toBe(before);
  });

  test("criterion 11: TEMPLATES is deep-equal to aa88101's", () => {
    // T-026 (approved Test change request, PFX): aa88101's three stay first.
    expect(sha(JSON.stringify(TEMPLATES.slice(0, 3)))).toBe(AA88101_TEMPLATES_SHA);
    expect(TEMPLATES).toHaveLength(9);
  });

  test("criterion 12: familiarity_bonus is still 0", () => {
    expect(LEVEL_SEED_WEIGHTS.familiarity_bonus).toBe(0);
  });

  test("criterion 12: no famous / familiar / well-known list under src/ beyond what aa88101 had", () => {
    // Non-test source only: test files (this one included) name the words to
    // check for them. These six lines are every match at aa88101.
    const BASELINE = [
      "curated/us-states.ts:* One to three genuinely famous plant crops, hand-picked (not NASS-derived,",
      'curated/us-states.ts:text: "Idaho grows more potatoes than any other state, and its license plates say Famous Potatoes.",',
      'curated/us-states.ts:text: "Kentucky is famous for the Kentucky Derby, a horse race run every year since 1875.",',
      "seed-level.ts:*         - familiarity_bonus           0 for now: see E-22",
      "seed-level.ts:familiarity_bonus: 0,",
      "seed-level.ts:weights.familiarity_bonus;",
    ];
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((f) => {
        const p = join(d, f);
        return statSync(p).isDirectory() ? walk(p) : [p];
      });
    const files = walk(SRC).filter((p) => /\.(ts|json|js)$/.test(p) && !p.endsWith(".test.ts"));
    for (const p of files) {
      expect({
        file: relative(SRC, p),
        named: /famous|familiar|well.?known/i.test(relative(SRC, p)),
      }).toEqual({
        file: relative(SRC, p),
        named: false,
      });
    }
    const hits = files
      .filter((p) => p.endsWith(".ts"))
      .flatMap((p) =>
        readFileSync(p, "utf8")
          .split("\n")
          .filter((l) => /famous|familiar|well.?known/i.test(l))
          .map((l) => `${relative(SRC, p)}:${l.trim()}`),
      )
      .sort();
    expect(hits).toEqual([...BASELINE].sort());
  });

  test("criterion 12: seed-level.ts names no state", () => {
    const src = readFileSync(join(SRC, "seed-level.ts"), "utf8");
    expect(src).not.toMatch(/us-state-[a-z]{2}/);
    for (const e of bank())
      expect({ name: e.name, named: src.includes(`"${e.name}"`) }).toEqual({
        name: e.name,
        named: false,
      });
  });

  test("criterion 13: all 150 final levels are finite and within 0-18", () => {
    const leveled = pipelineOriginal().leveled; // T-026, approved S3
    expect(leveled.length).toBe(150);
    for (const q of leveled)
      expect({ id: q.id, ok: Number.isFinite(q.level) && q.level >= 0 && q.level <= 18 }).toEqual({
        id: q.id,
        ok: true,
      });
  });

  test("criterion 13: each template gives at least 2 distinct final levels", () => {
    const leveled = pipeline().leveled;
    for (const t of TPL_IDS) {
      const distinct = new Set(leveled.filter((q) => q.templateId === t).map((q) => q.level)).size;
      expect({ t, atLeast2: distinct >= 2 }).toEqual({ t, atLeast2: true });
    }
  });

  test("criterion 13: +1 / -1 on each number except missing_rank_bucket and concept_load_default changes a level", () => {
    const base = levelsById();
    const final = current();
    for (const leaf of leaves(final)) {
      if (leaf.key === "missing_rank_bucket" || leaf.key === "concept_load_default") continue;
      for (const delta of [1, -1]) {
        const w = structuredClone(final);
        leaf.set(w, leaf.get(final) + delta);
        const after = withWeights(w, levelsById);
        const moved = [...base].some(([id, v]) => after.get(id) !== v);
        expect({ key: leaf.key, delta, moved }).toEqual({ key: leaf.key, delta, moved: true });
      }
    }
  });

  test("criterion 13 (c): every number is covered, and exactly missing_rank_bucket and concept_load_default are exempt", () => {
    const keys = leaves(current()).map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.sort()).toEqual(
      [
        "rank_bucket_edges[0]",
        "rank_bucket_edges[1]",
        "rank_bucket_edges[2]",
        "population_rank_weight",
        "area_rank_weight",
        "missing_rank_bucket",
        "near_distractor_weight",
        "concept_load_default",
        "familiarity_bonus",
        ...TPL_IDS.map((t) => `concept_load["${t}"]`),
        // T-026 (approved Test change request row 78): one per new template.
        ...T026_IDS.map((t) => `concept_load["${t}"]`),
      ].sort(),
    );
    // The amended clause says the two exemptions exist because the committed
    // bank never reads them. Confirm that directly: +1 / -1 on either moves
    // no level. If this ever goes red, the exemption has stopped being true.
    const base = levelsById();
    const final = current();
    for (const leaf of leaves(final)) {
      if (leaf.key !== "missing_rank_bucket" && leaf.key !== "concept_load_default") continue;
      for (const delta of [1, -1]) {
        const w = structuredClone(final);
        leaf.set(w, leaf.get(final) + delta);
        const after = withWeights(w, levelsById);
        const moved = [...base].some(([id, v]) => after.get(id) !== v);
        expect({ key: leaf.key, delta, moved }).toEqual({ key: leaf.key, delta, moved: false });
      }
    }
  });

  // The premises the amended clause 13 (c) gives for its two exemptions.
  test("criterion 13 (c) exemption premise: every state in the committed bank has a usable population_rank and area_rank", () => {
    for (const e of bank()) {
      const r = e as unknown as Record<string, unknown>;
      for (const k of ["population_rank", "area_rank"]) {
        const v = r[k];
        expect({
          id: e.id,
          k,
          usable: typeof v === "number" && Number.isInteger(v) && v > 0,
        }).toEqual({
          id: e.id,
          k,
          usable: true,
        });
      }
    }
  });

  test("criterion 13 (c) exemption premise: every template in TEMPLATES has its own concept_load entry", () => {
    for (const t of TEMPLATES)
      expect({ id: t.id, has: Object.hasOwn(LEVEL_SEED_WEIGHTS.concept_load, t.id) }).toEqual({
        id: t.id,
        has: true,
      });
  });
});

// ---- criteria 14-17: what must not happen ----

function walkFiles(d: string): string[] {
  return readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walkFiles(p) : [p];
  });
}

function manifestSha(dir: string, except: string[] = []): string {
  return sha(
    walkFiles(join(REPO, dir))
      .map((p) => relative(REPO, p))
      .filter((r) => !except.some((prefix) => r.startsWith(prefix)))
      .sort()
      .map((r) => `${r}\t${sha(readFileSync(join(REPO, r)))}\n`)
      .join(""),
  );
}

describe("T-025 criteria 14-17: no data, dependency or E-n moved; old tests unmodified", () => {
  // T-040 added question-bank/data/questions/ (its committed question file); everything
  // that was under data/ at aa88101 is still pinned.
  test("criterion 14: question-bank/data (outside T-040's data/questions/) and src/fixtures are byte-identical to aa88101", () => {
    expect({
      data: manifestSha("question-bank/data", ["question-bank/data/questions/"]),
      fixtures: manifestSha("question-bank/src/fixtures"),
    }).toEqual({
      data: "a67db5024454f4604068fa61b3020489b14f603caa4e4ec81b70af8c973fb8d6",
      fixtures: "b7fe3a940c8b232710015de66f972308ce72e872bf76b3c27eedc35c16cf7676",
    });
  });

  // T-040 archived this file byte-for-byte and replaced the served one with the generated bank.
  test("criterion 14: aa88101's backend/app/data/content.json survives byte-identical as archive/hand-written-bank/content.json", () => {
    expect(sha(readFileSync(join(REPO, "archive", "hand-written-bank", "content.json")))).toBe(
      "81edf041acb6eb71135e09799a7f092fb00f8573ae52f894aa976d25650264fa",
    );
  });

  test("criterion 15: every package.json and lockfile is byte-identical to aa88101, and none was added", () => {
    const AT_AA88101: Record<string, string> = {
      "backend/pyproject.toml": "a7741b6f8be54ee317fc9caf308debff1959b93b00f28efc6e7e760468813724",
      "backend/uv.lock": "88a95ecef4a5cdcc199de0722c241f754b654d764073562d886b9c440cd1edd8",
      "e2e/bun.lock": "518a40b596a5bc9c4bc1b10ea8dbfbf32342539c08622fde3cef22e546a7574d",
      "e2e/package.json": "2a77756f4acec47ffbf4488ffd00e62a56da3c39cb89466e4f7b3f7fb49a5921",
      "frontend/bun.lock": "5ec60daccc0422c6a67e520b46e372be8a16b04bf2a37b3170f087ef69afc733",
      "frontend/package.json": "22870bb992a6e2db8770998ce5cb0b095ce785fcc16801f6bf9deb25e33e332f",
      "question-bank/bun.lock": "6bb53377c455e7936275e795c81aa62b41fcb239017b4dd9a744dfd38bda34d1",
      // re-pinned by T-064 row 31: build:sample removed (its criterion 2)
      "question-bank/package.json":
        "5286f4f725a98f5e54d45cf2646be5b38152ffc87ba5ac91039b919c49ec3f72",
    };
    const now = Object.fromEntries(
      Object.keys(AT_AA88101).map((p) => [
        p,
        existsSync(join(REPO, p)) ? sha(readFileSync(join(REPO, p))) : "missing",
      ]),
    );
    expect(now).toEqual(AT_AA88101);
    const proc = Bun.spawnSync(["git", "ls-files"], { cwd: REPO });
    expect(proc.exitCode).toBe(0);
    const tracked = proc.stdout
      .toString()
      .split("\n")
      .filter((p) =>
        /(^|\/)(package\.json|bun\.lockb?|uv\.lock|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|pyproject\.toml)$/.test(
          p,
        ),
      )
      .sort();
    expect(tracked).toEqual(Object.keys(AT_AA88101).sort());
  });

  // Later tasks may append E-24 onward (T-040 did); none of E-1..E-23 may move.
  test("criterion 16: E-1..E-23 each appear exactly once, and every E-n heading is E-1..E-max with no gap or repeat", () => {
    const heads = readFileSync(DECISIONS, "utf8")
      .split("\n")
      .map((l) => l.match(/^## E-(\d+)\b/)?.[1])
      .filter((x): x is string => x !== undefined)
      .map(Number);
    const max = Math.max(...heads);
    expect(max).toBeGreaterThanOrEqual(23);
    expect([...heads].sort((a, b) => a - b)).toEqual(Array.from({ length: max }, (_, i) => i + 1));
  });

  test("criterion 17: every question-bank test file at aa88101 is present and unmodified", () => {
    const files = readdirSync(SRC)
      .filter((f) => f.endsWith(".test.ts"))
      .sort();
    const AA88101_TEST_FILES = [
      "bare-qid-label-verify.test.ts",
      "bare-qid-label.test.ts",
      "build-fun-facts.test.ts",
      "build-report-stdout-verify.test.ts",
      "build-report-stdout.test.ts",
      "climate-kid-verify.test.ts",
      "climate-kid.test.ts",
      "climate-koppen.criteria.test.ts",
      "committed-bank.test.ts",
      "data-us-states.test.ts",
      "dependency-set.test.ts",
      "distractors-verify.test.ts",
      "distractors.test.ts",
      "fun-facts.test.ts",
      "generate-verify.test.ts",
      "generate.test.ts",
      "git-exit-guard.criteria.test.ts",
      "highest-point-in-state-verify.test.ts",
      "highest-point-in-state.test.ts",
      "highest-point-metres-verify.test.ts",
      "highest-point-metres.test.ts",
      "highest-point-verify.test.ts",
      "highest-point.test.ts",
      "landmarks-verify.test.ts",
      "landmarks.test.ts",
      "lint-gate.test.ts",
      "normalize.test.ts",
      "offline-rebuild-fixture-verify.test.ts",
      "offline-rebuild-fixture.test.ts",
      "prettier-gate.test.ts",
      "refresh-routes-verify.test.ts",
      "refresh-verify.test.ts",
      "refresh.test.ts",
      "region-vocabulary.test.ts",
      "report-warnings-stdout-verify.test.ts",
      "report-warnings-stdout.test.ts",
      "seed-level-verify.test.ts",
      "seed-level.test.ts",
      "sparql.test.ts",
      "spawn-guard.test.ts",
      "state-animals.test.ts",
      "tags-verify.test.ts",
      "tags.test.ts",
      "templates-verify.test.ts",
      "templates.test.ts",
      "top-crops-verify.test.ts",
      "top-crops.test.ts",
      "top-livestock-verify.test.ts",
    ];
    expect(AA88101_TEST_FILES.length).toBe(48);
    for (const f of AA88101_TEST_FILES)
      expect({ f, present: files.includes(f) }).toEqual({ f, present: true });
    const digest = sha(
      [...AA88101_TEST_FILES]
        .sort()
        .map((f) => `${f}\t${sha(readFileSync(join(SRC, f)))}\n`)
        .join(""),
    );
    // Re-pinned by T-040's approved Test change requests: rows 15, 16 and 20 modified
    // generate.test.ts, generate-verify.test.ts and tags-verify.test.ts; B1 modified
    // committed-bank.test.ts and lowered its floor in five files here.
    // Re-pinned by T-064's approved Test change request rows 1–39.
    // Re-pinned by T-026's approved Test change request (rows 1–92, A1; this is A2).
    // Re-pinned by T-092's approved Test change request rows 1–31 (this is row 32).
    expect(digest).toBe("8b1652c9613dd2fc8e3b68ee957ad7a47cb475b04c7519fac59d1cac47a0e089");
  });
});
