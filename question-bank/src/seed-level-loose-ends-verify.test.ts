/**
 * T-086, written by the `tester` from the brief's acceptance criteria.
 * `seed-level.ts` was read for entry points and signatures only.
 *
 * Baselines at `41811f9` (the commit the brief compares against) are embedded
 * as sha256 digests, computed once from a `git worktree` of `41811f9`, because
 * CI checks out shallow and cannot `git show` it:
 *
 *   - levels: sha256 of JSON.stringify of the 150 `[id, level]` pairs, sorted
 *     by id, from 41811f9's `seed-level.ts` over the committed bank
 *   - outside E-22: sha256 of `engineering-decisions.md` with E-22's body
 *     removed (its heading line kept), joined by "\n"
 *   - the hand-check table: sha256 of the header row, separator and 30 rows
 *     joined by "\n"
 *
 * Pure: no network, no seam. The only I/O is reading committed files.
 */
import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { buildChoices } from "./distractors";
import { generate } from "./generate";
import * as seedLevel from "./seed-level";
import { LEVEL_SEED_WEIGHTS, seedLevels } from "./seed-level";
import type { Entity } from "./types";

const SRC = import.meta.dirname;
const REPO = join(SRC, "..", "..");
const STATES_DIR = join(SRC, "..", "data", "us-states");
const DECISIONS = join(REPO, "engineering-decisions.md");
const SEED_LEVEL = join(SRC, "seed-level.ts");

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

// ---- baselines at 41811f9 ----

const BASE_LEVELS_SHA = "6af643acafd9cba393dbd52da67a88034ae0019977e0b7fc57e6efc85376f5da";
const BASE_WEIGHTS = {
  rank_bucket_edges: [10, 20, 35],
  population_rank_weight: 1,
  area_rank_weight: 0.5,
  missing_rank_bucket: 2,
  near_distractor_weight: 0.5,
  concept_load: { "tpl-identify-on-map": 0, "tpl-capital-of": 2, "tpl-click-the-map": 0 },
  concept_load_default: 1,
  familiarity_bonus: 0,
};
const BASE_OUTSIDE_E22_SHA = "399b5eb68794105712edda7f1a9dacf08ade39dc7fff43918cf46a0c49e40728";
const BASE_E22_HEADING =
  "## E-22 — `level` is seeded by a stage after `buildChoices`, from one constant of weights; `familiarity_bonus` is 0";
const BASE_E_HEADING_COUNT = 23;
const BASE_TABLE_SHA = "abbae9b5089f52608433bae0b8d0e25d9a4fe389b1058fed9a8f9d7199329efd";

// ---- helpers ----

function decisionLines(): string[] {
  return readFileSync(DECISIONS, "utf8").split("\n");
}

function e22Bounds(lines: string[]): [number, number] {
  const start = lines.findIndex((l) => l.startsWith("## E-22 "));
  expect(start).toBeGreaterThanOrEqual(0);
  let end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  if (end < 0) end = lines.length;
  return [start, end];
}

function e22(): string {
  const lines = decisionLines();
  const [s, e] = e22Bounds(lines);
  return lines.slice(s, e).join("\n");
}

const paragraphs = (text: string) => text.split(/\n\s*\n/);
const flat = (s: string) => s.replace(/\s+/g, " ").trim();
const sentences = (p: string) =>
  flat(p)
    .split(/(?<=[.!?])\s+(?=[A-Z`*])/)
    .filter((x) => x !== "");

function bank(): Entity[] {
  return readdirSync(STATES_DIR)
    .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
}

/** The full declaration of function `name` in seed-level.ts, up to its `{`. */
function declaration(name: string): string {
  const src = readFileSync(SEED_LEVEL, "utf8");
  const m = src.match(
    new RegExp(`^((?:export\\s+)?function\\s+${name}\\s*\\([\\s\\S]*?\\)\\s*:[^{]*)\\{`, "m"),
  );
  expect({ name, found: m !== null }).toEqual({ name, found: true });
  return flat((m as RegExpMatchArray)[1] as string);
}

function params(decl: string): string[] {
  const inner = decl.slice(decl.indexOf("(") + 1, decl.lastIndexOf(")"));
  return inner
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "")
    .map((p) => (p.split(":")[0] as string).trim());
}

/**
 * The E-22 lines (bullet or paragraph text, flattened) that record the
 * decision for `subject`, and the decision each states.
 */
function decisionsFor(subject: RegExp): ("kept" | "removed")[] {
  const units = e22()
    .split(/\n(?=\s*- )|\n\s*\n/)
    .map(flat)
    .filter((u) => subject.test(u));
  const out: ("kept" | "removed")[] = [];
  for (const u of units) {
    const kept = /\bkept\b/i.test(u);
    const removed = /\bremoved\b/i.test(u);
    if (kept !== removed) out.push(kept ? "kept" : "removed");
  }
  return out;
}

// ---- criteria 1-4: the unused API ----

describe("T-086 criteria 1-4: the unused API is decided, recorded, and matches the source", () => {
  const WEIGHTS_PARAM = /`levelFor`'s `weights` parameter|`weights` parameter[^.]*`levelFor`/;
  const LEVELFOR_EXPORT = /`export` on `levelFor`/;
  const NDC_EXPORT = /`export` on `nearDistractorCount`/;

  test("criterion 1: E-22 states exactly one decision (kept or removed) for levelFor's weights parameter", () => {
    expect(decisionsFor(WEIGHTS_PARAM).length).toBe(1);
  });

  test("criterion 2: E-22 states exactly one decision (kept or removed) for the export on levelFor", () => {
    expect(decisionsFor(LEVELFOR_EXPORT).length).toBe(1);
  });

  test("criterion 3: E-22 states exactly one decision (kept or removed) for the export on nearDistractorCount", () => {
    expect(decisionsFor(NDC_EXPORT).length).toBe(1);
  });

  test("criteria 1-3: a 'kept' decision names a use (a T-0xx id or an importing module)", () => {
    for (const subject of [WEIGHTS_PARAM, LEVELFOR_EXPORT, NDC_EXPORT]) {
      const units = e22()
        .split(/\n(?=\s*- )|\n\s*\n/)
        .map(flat)
        .filter((u) => subject.test(u) && /\bkept\b/i.test(u));
      for (const u of units) expect(u).toMatch(/T-0\d\d|\.ts\b/);
    }
  });

  test("criterion 4: levelFor's parameter list matches E-22's weights decision", () => {
    const [d] = decisionsFor(WEIGHTS_PARAM);
    const ps = params(declaration("levelFor"));
    if (d === "removed") {
      expect(ps[ps.length - 1]).toBe("entities");
    } else {
      expect(declaration("levelFor")).toBe(
        "export function levelFor( question: GeneratedQuestion, own: Entity, template: Template, entities: readonly Entity[], weights: LevelSeedWeights = LEVEL_SEED_WEIGHTS, ): number",
      );
    }
  });

  for (const [name, subject] of [
    ["levelFor", LEVELFOR_EXPORT],
    ["nearDistractorCount", NDC_EXPORT],
  ] as const) {
    test(`criterion 4: ${name}'s export matches E-22's decision, in the source and at runtime`, () => {
      const [d] = decisionsFor(subject);
      const decl = declaration(name);
      const exported = Object.hasOwn(seedLevel, name);
      if (d === "removed") {
        expect({ startsWithExport: decl.startsWith("export"), exported }).toEqual({
          startsWithExport: false,
          exported: false,
        });
      } else {
        expect({ startsWithExport: decl.startsWith("export"), exported }).toEqual({
          startsWithExport: true,
          exported: true,
        });
      }
    });

    test(`criterion 4: if ${name}'s export is removed, no other module imports it`, () => {
      const [d] = decisionsFor(subject);
      if (d !== "removed") return;
      const walk = (dir: string): string[] =>
        readdirSync(dir).flatMap((f) => {
          if (f === "node_modules") return [];
          const p = join(dir, f);
          return statSync(p).isDirectory() ? walk(p) : [p];
        });
      const importers = [join(REPO, "question-bank"), join(REPO, "frontend", "src")]
        .flatMap(walk)
        .filter((p) => /\.(ts|tsx)$/.test(p) && p !== SEED_LEVEL)
        .filter((p) =>
          new RegExp(`import[^;]*\\b${name}\\b[^;]*from\\s*["'][^"']*seed-level["']`).test(
            readFileSync(p, "utf8"),
          ),
        )
        .map((p) => relative(REPO, p));
      expect(importers).toEqual([]);
    });
  }
});

// ---- criteria 5-6: "Revisit when" and familiarity_bonus ----

describe("T-086 criteria 5-6: no stale T-025 future references in E-22", () => {
  const revisit = () =>
    paragraphs(e22()).filter((p) => p.trimStart().startsWith("**Revisit when**"));

  test("criterion 5: E-22 has exactly one paragraph beginning **Revisit when**", () => {
    expect(revisit().length).toBe(1);
  });

  test("criterion 5: Revisit when drops 'T-025 hand-checks 30 questions' and presents no T-025 work as to come", () => {
    const p = flat(revisit()[0] as string);
    expect(p).not.toContain("T-025 hand-checks 30 questions");
    expect(p).not.toMatch(/\bT-025 (will|can|could|should|hand-checks|tunes|sets|checks)\b/);
    expect(p).not.toMatch(/when T-025\b/);
  });

  test("criterion 5: Revisit when names T-085 and keeps the world-scope, home-state and Elo triggers", () => {
    const p = flat(revisit()[0] as string);
    expect({
      t085: /\bT-085\b/.test(p),
      world: /world-scope bank/.test(p),
      home: /player profile[^.]*home state/.test(p),
      elo: /Elo ratings replace seeded levels/.test(p),
      plan: /§1\.4/.test(p),
    }).toEqual({ t085: true, world: true, home: true, elo: true, plan: true });
  });

  test("criterion 6: no sentence in E-22 says T-025 will or can set familiarity_bonus", () => {
    const text = flat(e22());
    expect(text).not.toContain(
      "The term stays in the formula and the constant so T-025 can set it.",
    );
    for (const s of sentences(e22()))
      expect({ s, future: /T-025 (will|can|could|may|is to)\b[^.]*\bset\b/.test(s) }).toEqual({
        s,
        future: false,
      });
    expect(text).not.toMatch(/so T-025 can set/);
  });

  test("criterion 6: the 'Why familiarity_bonus is 0' bullet still explains it and keeps the term", () => {
    const bullets = e22()
      .split(/\n(?=- )/)
      .filter((b) => /Why `familiarity_bonus` is 0/.test(b));
    expect(bullets.length).toBe(1);
    const b = flat(bullets[0] as string);
    expect({
      home: b.includes("home state"),
      famous: b.includes("famous"),
      stays: /term stays in the formula and the constant/.test(b),
    }).toEqual({ home: true, famous: true, stays: true });
  });
});

// ---- criteria 7-9: the band paragraph ----

describe("T-086 criteria 7-9: the band paragraph", () => {
  const band = () => {
    const ps = paragraphs(e22()).filter((p) => p.includes("**The band"));
    expect(ps.length).toBe(1);
    return flat(ps[0] as string);
  };

  test("criterion 7: the band paragraph states level 3.5 is band 1.5", () => {
    expect(band()).toMatch(/3\.5[^.]{0,30}\b(band 1\.5|3\.5 - 2 = 1\.5|3\.5 - 2 \* 1 = 1\.5)/);
  });

  test("criterion 8: every band word in the paragraph matches band_label (3.5 -> Hard, 10 -> Easy)", () => {
    // The level a band word is attached to is the nearest level mention before it.
    const p = band().replace(/\bMedium\/Hard boundary\b/gi, "BOUNDARY");
    const mention = /\b(3\.5|1st grade|grade 1|10|5th grade|grade 5)\b/gi;
    const word = /\b(easy|medium|hard)\b/gi;
    const mentions = [...p.matchAll(mention)].map((m) => ({
      at: m.index as number,
      level: /3\.5|1st|grade 1/i.test(m[1] as string) ? "3.5" : "10",
    }));
    const expected: Record<string, string> = { "3.5": "hard", "10": "easy" };
    const words = [...p.matchAll(word)];
    expect(words.length).toBeGreaterThan(0);
    for (const w of words) {
      const prior = mentions.filter((m) => m.at < (w.index as number)).pop();
      expect(prior).toBeDefined();
      const level = (prior as { level: string }).level;
      expect({ level, word: (w[1] as string).toLowerCase() }).toEqual({
        level,
        word: expected[level] as string,
      });
    }
  });

  test("criterion 8: the paragraph never calls 3.5 medium or easy, nor 10 medium or hard", () => {
    const p = band();
    expect(p).not.toMatch(/1st grade \((medium|easy)\)/i);
    expect(p).not.toMatch(/5th grade \((medium|hard)\)/i);
    expect(p).toMatch(/1st grade \(hard\)/i);
    expect(p).toMatch(/5th grade \(easy\)/i);
  });

  test("criterion 9: the hand-check test's criterion 9 file is unchanged in what it checks (1-5 sentences, grade 1 to grade 5, floor or §1.4)", () => {
    const body = band()
      .replace(/\*\*The band\.?\*\*/i, "")
      .trim();
    const ss = body.split(/(?<=[.!?])\s+(?=[A-Z`])/).filter((x) => x.trim() !== "");
    expect(ss.length).toBeGreaterThanOrEqual(1);
    expect(ss.length).toBeLessThanOrEqual(5);
    expect(
      ss.some((s) => /\b(1st grade|grade 1)[^.]*?\bto\b[^.]*?\b(5th grade|grade 5)\b/i.test(s)),
    ).toBe(true);
    expect(body).toMatch(/floor\(level \/ 2\)|floor\([\d.]+ \/ 2\)|§1\.4/);
  });
});

// ---- criteria 10-12: what must not move ----

describe("T-086 criteria 10-12: what must not move", () => {
  test("criterion 10: the 150 seeded levels by id equal 41811f9's", () => {
    const entities = bank();
    const { questions } = buildChoices(generate(entities).drafts, entities);
    const pairs = seedLevels(questions, entities)
      .map((q) => [q.id, q.level] as [string, number])
      .sort((a, b) => (a[0] < b[0] ? -1 : 1));
    expect(pairs.length).toBe(150);
    expect(sha(JSON.stringify(pairs))).toBe(BASE_LEVELS_SHA);
  });

  test("criterion 10: LEVEL_SEED_WEIGHTS is deep-equal to 41811f9's", () => {
    expect(LEVEL_SEED_WEIGHTS).toEqual(BASE_WEIGHTS);
  });

  test("criterion 11: the T-025 hand-check table (header, separator, 30 rows) is byte-identical to 41811f9's", () => {
    const lines = e22().split("\n");
    const sub = lines.findIndex((l) => l.startsWith("### T-025 hand-check of 30 questions"));
    expect(sub).toBeGreaterThan(0);
    const hdr = lines.findIndex(
      (l, i) => i > sub && l.startsWith("|") && /\|\s*Template\s*\|/.test(l),
    );
    expect(hdr).toBeGreaterThan(sub);
    let j = hdr;
    while (j < lines.length && (lines[j] as string).startsWith("|")) j++;
    const table = lines.slice(hdr, j);
    expect(table.length).toBe(32);
    expect(sha(table.join("\n"))).toBe(BASE_TABLE_SHA);
  });

  test("criterion 12: engineering-decisions.md outside E-22's body is byte-identical to 41811f9's", () => {
    const lines = decisionLines();
    const [s, e] = e22Bounds(lines);
    const outside = [...lines.slice(0, s + 1), ...lines.slice(e)].join("\n");
    expect(sha(outside)).toBe(BASE_OUTSIDE_E22_SHA);
  });

  test("criterion 12: E-22's heading line is unchanged and no ## E-n heading is added or removed", () => {
    const lines = decisionLines();
    const [s] = e22Bounds(lines);
    expect(lines[s]).toBe(BASE_E22_HEADING);
    expect(lines.filter((l) => /^## E-\d+/.test(l)).length).toBe(BASE_E_HEADING_COUNT);
  });
});
