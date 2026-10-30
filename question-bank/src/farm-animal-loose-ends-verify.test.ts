/**
 * T-096 tester: one test (or more) per acceptance criterion of
 * `tasks/T-096-farm-animal-loose-ends.md`.
 *
 * Main is `85612ed` (the brief's "main"). CI checks out shallow and a test may
 * not hand `git` a revision, so main's state is held here as values and sha256
 * digests recorded at `85612ed` when this file was written (E-30: a pin names
 * the commit it was recorded at). Main's `clickDistractorsFor` was run over
 * the committed bank in a worktree of `85612ed`, every template, every draft:
 * 410 drafts returned all-string arrays or a `ShortPool`, and 8 farm-animal
 * drafts returned arrays holding `undefined` (fixed-pool picks). Those 8 ids
 * are transcribed below; the 410 results are a digest.
 *
 * Pure: committed files read from disk, synthetic entity sets built in memory.
 * The one spawn is `git ls-files` (working tree only), and it throws on a
 * non-zero exit. No network.
 */
import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { ADDED_FARM_ANIMALS, buildChoices, clickDistractorsFor } from "./distractors";
import { generate, type QuestionDraft } from "./generate";
import { LEVEL_SEED_WEIGHTS } from "./seed-level";
import { TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const STATES_DIR = join(REPO_ROOT, "question-bank", "data", "us-states");
const sha = (s: string | Buffer): string => createHash("sha256").update(s).digest("hex");
const read = (rel: string): string => readFileSync(join(REPO_ROOT, rel), "utf8");

function gitLsFiles(...paths: string[]): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "-z", "--", ...paths], { cwd: REPO_ROOT });
  if (proc.exitCode !== 0) {
    throw new Error(`git ls-files exited ${proc.exitCode}: ${proc.stderr.toString()}`);
  }
  return proc.stdout.toString().split("\0").filter(Boolean).sort();
}

const fileRowsSha = (files: string[]): string =>
  sha(JSON.stringify(files.map((f) => [f, sha(readFileSync(join(REPO_ROOT, f)))])));

/** A fresh parse of the committed bank, sorted by file name. */
function bank(): Entity[] {
  return readdirSync(STATES_DIR)
    .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
}

function tpl(id: string): Template {
  const t = TEMPLATES.find((x) => x.id === id);
  if (t === undefined) throw new Error(`no template ${id}`);
  return t;
}

type Outcome = { kind: "returned"; value: unknown } | { kind: "threw"; error: unknown };

function call(d: QuestionDraft, entities: readonly Entity[]): Outcome {
  const own = entities.find((e) => e.id === d.entityId);
  if (own === undefined) throw new Error(`no entity ${d.entityId}`);
  try {
    return { kind: "returned", value: clickDistractorsFor(d, own, tpl(d.templateId), entities) };
  } catch (error) {
    return { kind: "threw", error };
  }
}

// ---- Main's state at 85612ed ------------------------------------------------

/** Drafts (all templates, committed bank) on which main returned `undefined` in its array. */
const MAIN_UNDEFINED_IDS = [
  "gen:tpl-farm-animal-of:us-state-ca",
  "gen:tpl-farm-animal-of:us-state-ia",
  "gen:tpl-farm-animal-of:us-state-mn",
  "gen:tpl-farm-animal-of:us-state-nc",
  "gen:tpl-farm-animal-of:us-state-ok",
  "gen:tpl-farm-animal-of:us-state-pa",
  "gen:tpl-farm-animal-of:us-state-sd",
  "gen:tpl-farm-animal-of:us-state-tx",
];
/** sha256 of JSON.stringify([[draftId, result], ...] sorted by id) over the other 410 drafts. */
const MAIN_OTHER_418_MINUS_8_SHA =
  "5ae3ca3775491b76ca1a032b0c2af8d033ff313c90c92f38386e08f2d75ea3bc";
/** Same, but only the 50 drafts of `map_click` templates (all returned arrays on main). */
const MAIN_MAP_CLICK_SHA = "ddd0d07b764532987202ebec7993f697bdab8d6608e1f7a38d2ec5df3aac7672";

/** `LEVEL_SEED_WEIGHTS` at 85612ed, transcribed from `JSON.stringify` of it. */
const MAIN_LEVEL_SEED_WEIGHTS = {
  rank_bucket_edges: [10, 20, 35],
  population_rank_weight: 1,
  area_rank_weight: 0.5,
  missing_rank_bucket: 2,
  near_distractor_weight: 0.5,
  concept_load: {
    "tpl-identify-on-map": 0,
    "tpl-capital-of": 2,
    "tpl-click-the-map": 0,
    "tpl-biggest-state": 2,
    "tpl-state-animal-of": 2,
    "tpl-landmark-in": 2,
    "tpl-climate-of": 3,
    "tpl-crop-of": 2,
    "tpl-farm-animal-of": 1,
  },
  concept_load_default: 1,
  familiarity_bonus: 2,
  familiarity_bonus_states: ["us-state-hi", "us-state-ak"],
  familiarity_bonus_templates: ["tpl-identify-on-map", "tpl-click-the-map", "tpl-climate-of"],
};

/** E-22's constant-block `concept_load` line at 85612ed. */
const MAIN_E22_CONCEPT_LOAD_LINE =
  'concept_load: { "tpl-identify-on-map": 0, "tpl-capital-of": 2, "tpl-click-the-map": 0, "tpl-biggest-state": 2, "tpl-state-animal-of": 2, "tpl-landmark-in": 2, "tpl-climate-of": 3, "tpl-crop-of": 2, "tpl-farm-animal-of": 1 }';

/** sha256 of lines[0..E-22 heading line] joined by "\n", at 85612ed. */
const MAIN_ED_THROUGH_E22_HEADING_SHA =
  "6a68061fae737e6755c74036cfb811277a80c4b6fe6ee98c40a903de25f3876d";
/**
 * sha256 of lines[E-23 heading line..end] joined by "\n", at 85612ed;
 * re-pinned at `4818fc8` (T-091, Test change request row 4) after T-091
 * amended E-25 and E-27.
 */
const MAIN_ED_FROM_E23_SHA = "c598bc8a37bb989e8256cf0eb53ad190450207b4d11c775a4af54eaa29fc280f";
/** sha256 of JSON.stringify(every `## E-n ` heading line, in order), at 85612ed. */
const MAIN_ED_HEADINGS_SHA = "cab21883894bbad1d7a812f5616b1b65582ffd1b08b7f9193a204b821619b71a";

const MAIN_QUESTIONS_SHA = "cfd2f1f9092ac70b9a455110bb254c8145b71fff1b5d1331d384656088fec64b";
/** fileRowsSha over the 51 tracked files under question-bank/data/us-states/, at 85612ed. */
const MAIN_ENTITY_DIR_SHA = "08b0d412d56003214f21359cce858b9211c549e4bd4d3a663da4564fd95f179c";
const MAIN_CONTENT_JSON_SHA = "103e22e5a51b0e98145b423ca0cda5c1967b1d52a8b86d39853eb66862a33e58";
const MAIN_DEP_FILES = [
  "backend/pyproject.toml",
  "backend/uv.lock",
  "e2e/bun.lock",
  "e2e/package.json",
  "frontend/bun.lock",
  "frontend/package.json",
  "question-bank/bun.lock",
  "question-bank/package.json",
];
// re-pinned by T-087 row 6: questions script added (its criteria 1-2). Only
// question-bank/package.json moved, to 8e27687560ccc8a0a08751dee8d7c7b578a81e575bbea02e8f09d9a5fafdd3a3.
const MAIN_DEP_SHA = "9e3ffca97584b1c9e13e06c2b9fd986ee39dbd91b48454762e67515ab7d0cabc";
/**
 * fileRowsSha over every tracked file at 85612ed that is neither a test file
 * nor in CRITERION_21_ALLOWED: 297 files. Re-pinned when `process-tasks.md`
 * joined the allowed set (approved by Dkaattae, 2026-10-30, in the session
 * that made the edit).
 */
// Re-pinned by T-087 row 10a: four of T-087's files already existed on main, so
// joining the allowed set takes them out of the counted set (297 -> 293). main
// (0a98e11) gives the same count and digest with the same exemption.
const MAIN_UNTOUCHABLE_SHA = "ceaf01f5308835cf8ee2fa75aff2f6a4a8011ab085b0133706418c4ce212e62a";
/**
 * Criterion 21's list, plus the orchestrator's run log and the `tasks.md`
 * status flip, which are the loop's own records of this task rather than its
 * deliverable (named in the Verdict). `process-tasks.md` is the loop's queue
 * too, and P-17's T-096 instance is recorded there. T-091's brief and run log
 * joined the set through T-091's Test change request row 5 (approved by
 * Dkaattae, 2026-10-30, in the session that made the edit): every task's loop
 * records are new tracked files, and the brief changes at every commit.
 */
const CRITERION_21_ALLOWED = new Set([
  "engineering-decisions.md",
  "question-bank/src/seed-level.ts",
  "question-bank/src/distractors.ts",
  "tasks/T-096-farm-animal-loose-ends.md",
  "tasks.md",
  "PROGRESS.md",
  "runs/T-096-farm-animal-loose-ends.md",
  "process-tasks.md",
  "tasks/T-091-climate-cold-trade-accepted.md",
  "runs/T-091-climate-cold-trade-accepted.md",
  // T-087's file set, joined through T-087's Test change request row 10
  // (approved by Dkaattae, 2026-10-30, in the session that made the edit).
  "question-bank/package.json",
  "question-bank/src/refresh.ts",
  "question-bank/README.md",
  "conventions.md",
  "tasks/T-087-refresh-regenerate-reminder.md",
  "runs/T-087-refresh-regenerate-reminder.md",
]);
const isTestFile = (f: string): boolean =>
  /\.test\.tsx?$/.test(f) || /(^|\/)test_[^/]*\.py$/.test(f);

// ---- Helpers over the record ------------------------------------------------

const edLines = (): string[] => read("engineering-decisions.md").split("\n");

function e22Range(lines: string[]): [number, number] {
  const a = lines.findIndex((l) => l.startsWith("## E-22 "));
  const b = lines.findIndex((l) => l.startsWith("## E-23 "));
  expect(a).toBeGreaterThan(-1);
  expect(b).toBeGreaterThan(a);
  return [a, b];
}

/** The E-22 bullet as the brief defines it, or null. */
function e22Bullet(): string | null {
  const lines = edLines();
  const [a, b] = e22Range(lines);
  const start = lines.findIndex(
    (l, i) => i > a && i < b && l.startsWith('- `"tpl-farm-animal-of": 1`'),
  );
  if (start === -1) return null;
  let end = start;
  while (end + 1 < lines.length && lines[end + 1]!.trim() !== "") end++;
  return lines.slice(start, end + 1).join("\n");
}

/** The JSDoc immediately above `concept_load: {` in seed-level.ts. */
function conceptLoadJsdoc(): string {
  const lines = read("question-bank/src/seed-level.ts").split("\n");
  const at = lines.findIndex((l) => l.trim().startsWith("concept_load: {"));
  expect(at).toBeGreaterThan(0);
  expect(lines[at - 1]!.trim()).toBe("*/");
  let s = at - 1;
  while (s >= 0 && !lines[s]!.trim().startsWith("/**")) s--;
  expect(s).toBeGreaterThanOrEqual(0);
  return lines.slice(s, at).join("\n");
}

const NUMBER_WORDS =
  "zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty";
/**
 * The counts a text gives for animals: a number (word or digits) followed,
 * within two words, by "animals" ("eleven farm animals", "11 animals").
 * "one of eleven ..." yields only "eleven": "one of" is not a count.
 */
function animalCounts(text: string): string[] {
  const re = new RegExp(`\\b(${NUMBER_WORDS}|\\d+)\\s+(?:[a-z-]+\\s+){0,2}?animals\\b`, "gi");
  const flat = text.replace(/^\s*\/?\*+\/?/gm, " ").replace(/\s+/g, " ");
  return [...flat.matchAll(re)].map((m) => m[1]!.toLowerCase());
}

// ---- Criteria 1-6: the farm-animal count ------------------------------------

describe("T-096 criteria 1-6: the farm-animal count", () => {
  test("criterion 1: the E-22 bullet exists inside E-22 and starts as named", () => {
    const bullet = e22Bullet();
    expect(bullet).not.toBeNull();
    expect(bullet!.startsWith('- `"tpl-farm-animal-of": 1`')).toBe(true);
  });

  test("criterion 2: the E-22 bullet has no 'six' and no '6'", () => {
    const bullet = e22Bullet()!;
    expect(/\bsix\b/i.test(bullet)).toBe(false);
    expect(/(?<!\d)6(?!\d)/.test(bullet)).toBe(false);
  });

  test("the animal-count reader finds main's wordings (so criteria 3 and 5 can fail)", () => {
    expect(animalCounts("every choice is one of six farm animals a child")).toEqual(["six"]);
    expect(
      animalCounts(
        "   * capital, and the farm-animal\n   * choices come from only six animals.\n   */",
      ),
    ).toEqual(["six"]);
    expect(animalCounts("one of 11 animals; T-026 entries")).toEqual(["11"]);
  });

  test("criterion 3: any count the E-22 bullet states is eleven / 11", () => {
    for (const t of animalCounts(e22Bullet()!)) expect(["eleven", "11"]).toContain(t);
  });

  test("criterion 4: the concept_load JSDoc does not say six (farm) animals", () => {
    expect(/six\s+(farm\s+)?animals/i.test(conceptLoadJsdoc())).toBe(false);
  });

  test("criterion 5: any animal count in the concept_load JSDoc is eleven / 11", () => {
    // "six T-026 entries" counts templates, not animals, so it is not matched.
    for (const t of animalCounts(conceptLoadJsdoc())) expect(["eleven", "11"]).toContain(t);
  });

  test("criterion 6: no tracked file outside the exempt set says six farm animals / only six animals", () => {
    const exempt = (f: string): boolean =>
      f.startsWith("runs/") ||
      f.startsWith("tasks/") ||
      f === "tasks.md" ||
      f === "PROGRESS.md" ||
      isTestFile(f);
    const hits: string[] = [];
    for (const f of gitLsFiles()) {
      if (exempt(f)) continue;
      const buf = readFileSync(join(REPO_ROOT, f));
      if (buf.includes(0)) continue; // binary
      const text = buf.toString("utf8").replace(/\s+/g, " ").toLowerCase();
      if (text.includes("six farm animals") || text.includes("only six animals")) hits.push(f);
    }
    expect(hits).toEqual([]);
  });
});

// ---- Criteria 7-9: nothing about levels changes -----------------------------

describe("T-096 criteria 7-9: nothing about levels changes", () => {
  test("criterion 7: LEVEL_SEED_WEIGHTS deep-equals main's; farm animal is still 1", () => {
    expect(LEVEL_SEED_WEIGHTS).toEqual(MAIN_LEVEL_SEED_WEIGHTS);
    expect(LEVEL_SEED_WEIGHTS.concept_load["tpl-farm-animal-of"]).toBe(1);
  });

  test("criterion 8: E-22's constant-block concept_load line is main's, byte for byte", () => {
    const lines = edLines();
    const [a, b] = e22Range(lines);
    const found = lines.slice(a, b).filter((l) => l.startsWith("concept_load: {"));
    expect(found).toEqual([MAIN_E22_CONCEPT_LOAD_LINE]);
  });

  test("criterion 9: engineering-decisions.md outside E-22's body is main's; headings unchanged", () => {
    const lines = edLines();
    const [a, b] = e22Range(lines);
    expect(sha(lines.slice(0, a + 1).join("\n"))).toBe(MAIN_ED_THROUGH_E22_HEADING_SHA);
    expect(sha(lines.slice(b).join("\n"))).toBe(MAIN_ED_FROM_E23_SHA);
    expect(sha(JSON.stringify(lines.filter((l) => /^## E-\d+ /.test(l))))).toBe(
      MAIN_ED_HEADINGS_SHA,
    );
  });
});

// ---- Criteria 10-11: distractors.ts comments --------------------------------

describe("T-096 criteria 10-11: distractors.ts comments", () => {
  const lines = (): string[] => read("question-bank/src/distractors.ts").split("\n");
  const isJsdocEnd = (l: string): boolean => l.trim().endsWith("*/");

  test("criterion 10: the poolFor JSDoc ends on the line right before `function poolFor(`", () => {
    const ls = lines();
    const decl = ls.findIndex((l) => l.startsWith("function poolFor("));
    expect(decl).toBeGreaterThan(0);
    const prev = ls[decl - 1]!;
    expect(isJsdocEnd(prev)).toBe(true);
    let s = decl - 1;
    while (s >= 0 && !ls[s]!.trim().startsWith("/**")) s--;
    const doc = ls.slice(s, decl).join(" ");
    expect(doc).toContain(
      "The fixed-pool candidates a strategy offers after its entity candidates.",
    );
  });

  test("criterion 11: `type Pick` has exactly one JSDoc, about Pick; no stacked JSDocs in the region", () => {
    const ls = lines();
    const pick = ls.findIndex((l) => l === "type Pick = Candidate | PoolCandidate;");
    expect(pick).toBeGreaterThan(0);
    expect(isJsdocEnd(ls[pick - 1]!)).toBe(true);
    let s = pick - 1;
    while (s >= 0 && !ls[s]!.trim().startsWith("/**")) s--;
    const doc = ls.slice(s, pick).join(" ");
    expect(doc).not.toContain("fixed-pool candidates a strategy offers");
    expect(/wrong answer/i.test(doc)).toBe(true);
    expect(/entity/i.test(doc) && /pool/i.test(doc)).toBe(true);
    // Exactly one: the line above the block's opening is not another JSDoc's end.
    expect(isJsdocEnd(ls[s - 1] ?? "")).toBe(false);

    // Region scan: from `interface PoolCandidate` to `function poolFor`, every
    // JSDoc block is followed (after itself) by a non-comment line, never by
    // another `/**` with only blank lines between.
    const from = ls.findIndex((l) => /^(export )?interface PoolCandidate\b/.test(l));
    const to = ls.findIndex((l) => l.startsWith("function poolFor("));
    expect(from).toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);
    const region = ls.slice(from, to + 1);
    for (let i = 0; i < region.length; i++) {
      if (
        !isJsdocEnd(region[i]!) ||
        !region
          .slice(0, i + 1)
          .join("\n")
          .includes("/**")
      )
        continue;
      let j = i + 1;
      while (j < region.length && region[j]!.trim() === "") j++;
      expect([from + i + 1, region[j]?.trim().startsWith("/**")]).toEqual([from + i + 1, false]);
    }
  });
});

// ---- Criteria 12-16: clickDistractorsFor enforces its assumption -------------

describe("T-096 criteria 12-16: clickDistractorsFor", () => {
  const farm = tpl("tpl-farm-animal-of");

  test("the narrow-set fixture really picks from ADDED_FARM_ANIMALS (buildChoices shows it)", () => {
    for (const set of [
      ["us-state-ia"],
      ["us-state-ia", "us-state-tx"],
      ["us-state-ne", "us-state-ca", "us-state-hi"],
    ]) {
      const all = bank();
      const ents = set.map((id) => all.find((e) => e.id === id)!);
      const drafts = generate(ents, [farm]).drafts;
      const { questions } = buildChoices(drafts, ents, [farm]);
      const q = questions.find((x) => x.entityId === set[0])!;
      expect(q).toBeDefined();
      expect(q.choices!.some((c) => c !== q.answer && ADDED_FARM_ANIMALS.includes(c))).toBe(true);
    }
  });

  test("criteria 12-13: a fixed-pool pick throws an Error naming draft.id, and nothing is returned", () => {
    for (const set of [
      ["us-state-ia"],
      ["us-state-ia", "us-state-tx"],
      ["us-state-ne", "us-state-ca", "us-state-hi"],
    ]) {
      const all = bank();
      const ents = set.map((id) => all.find((e) => e.id === id)!);
      const d = generate(ents, [farm]).drafts.find((x) => x.entityId === set[0])!;
      const out = call(d, ents);
      expect([d.id, out.kind]).toEqual([d.id, "threw"]);
      if (out.kind !== "threw") continue;
      expect(out.error).toBeInstanceOf(Error);
      expect((out.error as Error).message).toContain(d.id);
    }
  });

  test("criteria 12-13: over the committed bank, exactly main's 8 undefined-emitting drafts throw, each naming its id", () => {
    const ents = bank();
    const threw: string[] = [];
    for (const d of generate(ents, TEMPLATES).drafts) {
      const out = call(d, ents);
      if (out.kind !== "threw") continue;
      threw.push(d.id);
      expect(out.error).toBeInstanceOf(Error);
      expect((out.error as Error).message).toContain(d.id);
    }
    expect(threw.sort()).toEqual(MAIN_UNDEFINED_IDS);
  });

  test("criterion 14: every returned array holds only strings (committed bank, and narrow subsets)", () => {
    const all = bank();
    const sets: Entity[][] = [
      all,
      all.slice(0, 4),
      all.filter((e) => ["us-state-hi", "us-state-ak", "us-state-me"].includes(e.id)),
      all.filter((_, i) => i % 7 === 0),
    ];
    let arrays = 0;
    for (const ents of sets) {
      for (const d of generate(ents, TEMPLATES).drafts) {
        const out = call(d, ents);
        if (out.kind !== "returned" || !Array.isArray(out.value)) continue;
        arrays++;
        for (const g of out.value as unknown[]) expect([d.id, typeof g]).toEqual([d.id, "string"]);
      }
    }
    expect(arrays).toBeGreaterThan(400);
  });

  test("criterion 15: all-entity picks return main's result, in main's order (all 410 non-pool drafts)", () => {
    const ents = bank();
    const rows: [string, unknown][] = [];
    for (const d of generate(ents, TEMPLATES).drafts) {
      if (MAIN_UNDEFINED_IDS.includes(d.id)) continue;
      const out = call(d, ents);
      expect([d.id, out.kind]).toEqual([d.id, "returned"]);
      if (out.kind === "returned") rows.push([d.id, out.value]);
    }
    rows.sort((x, y) => (x[0] < y[0] ? -1 : 1));
    expect(rows.length).toBe(410);
    expect(sha(JSON.stringify(rows))).toBe(MAIN_OTHER_418_MINUS_8_SHA);
  });

  test("criterion 15: every map_click draft of the committed bank returns main's geometry_ids", () => {
    const ents = bank();
    const click = TEMPLATES.filter((t) => t.format === "map_click");
    const rows: [string, unknown][] = generate(ents, click).drafts.map((d) => {
      const out = call(d, ents);
      expect(out.kind).toBe("returned");
      return [d.id, out.kind === "returned" ? out.value : null];
    });
    rows.sort((x, y) => (x[0] < y[0] ? -1 : 1));
    expect(rows.length).toBe(50);
    expect(sha(JSON.stringify(rows))).toBe(MAIN_MAP_CLICK_SHA);
  });

  test("criterion 16: a ShortPool comes back as-is, for both reasons", () => {
    const all = bank();
    const click = TEMPLATES.find((t) => t.format === "map_click")!;

    // no_centroid: own entity's centroid unusable.
    const ownNoC = {
      ...all.find((e) => e.id === "us-state-co")!,
      centroid: null,
    } as unknown as Entity;
    const ents1 = all.map((e) => (e.id === ownNoC.id ? ownNoC : e));
    const d1 = generate([ownNoC], [click]).drafts[0]!;
    const out1 = call(d1, ents1);
    expect(out1).toEqual({
      kind: "returned",
      value: { draftId: d1.id, found: 0, reason: "no_centroid" },
    });

    // too_few_candidates: one peer only, for a map_click and for the farm template.
    const two = [
      all.find((e) => e.id === "us-state-co")!,
      all.find((e) => e.id === "us-state-ut")!,
    ];
    const d2 = generate(two, [click]).drafts.find((d) => d.entityId === "us-state-co")!;
    const out2 = call(d2, two);
    expect(out2.kind).toBe("returned");
    expect(out2.kind === "returned" ? out2.value : null).toEqual({
      draftId: d2.id,
      found: 1,
      reason: "too_few_candidates",
    });
  });
});

// ---- Criteria 17-21: the bank does not move; boundaries ---------------------

describe("T-096 criteria 17-21: the bank and the boundaries", () => {
  test("criterion 17: data/questions/us-states.json is main's", () => {
    expect(sha(readFileSync(join(REPO_ROOT, "question-bank/data/questions/us-states.json")))).toBe(
      MAIN_QUESTIONS_SHA,
    );
  });

  test("criterion 18: every file under data/us-states/ is main's (same 51 files)", () => {
    const files = gitLsFiles("question-bank/data/us-states");
    expect(files.length).toBe(51);
    expect(readdirSync(STATES_DIR).length).toBe(51);
    expect(fileRowsSha(files)).toBe(MAIN_ENTITY_DIR_SHA);
  });

  test("criterion 19: backend/app/data/content.json is main's", () => {
    expect(sha(readFileSync(join(REPO_ROOT, "backend/app/data/content.json")))).toBe(
      MAIN_CONTENT_JSON_SHA,
    );
  });

  test("criterion 20: every package.json, bun.lock, pyproject.toml and uv.lock is main's", () => {
    const deps = gitLsFiles().filter(
      (f) =>
        /(^|\/)package\.json$/.test(f) ||
        /(^|\/)bun\.lock$/.test(f) ||
        f === "backend/pyproject.toml" ||
        f === "backend/uv.lock",
    );
    expect(deps).toEqual(MAIN_DEP_FILES);
    expect(fileRowsSha(deps)).toBe(MAIN_DEP_SHA);
  });

  test("criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added", () => {
    const rest = gitLsFiles().filter((f) => !CRITERION_21_ALLOWED.has(f) && !isTestFile(f));
    expect(rest.length).toBe(293); // T-087 row 10a: was 297
    expect(fileRowsSha(rest)).toBe(MAIN_UNTOUCHABLE_SHA);
  });
});

// ---- Criterion 22: no network -----------------------------------------------

describe("T-096 criterion 22: no test reaches the network", () => {
  test("the T-096 test files hold no fetch, URL or http import, and spawn only git ls-files", () => {
    for (const f of [
      "question-bank/src/farm-animal-loose-ends.test.ts",
      "question-bank/src/farm-animal-loose-ends-verify.test.ts",
    ]) {
      const src = read(f);
      for (const needle of [
        "fetch" + "(",
        "http" + "://",
        "https" + "://",
        "node:" + "http",
        "node:" + "net",
      ]) {
        expect([f, needle, src.includes(needle)]).toEqual([f, needle, false]);
      }
      const spawns = src.match(/Bun\.spawn(?:Sync)?\(\s*\[[^\]]*\]/g) ?? [];
      for (const s of spawns) expect([f, s.includes('"git", "ls-files"')]).toEqual([f, true]);
    }
  });
});
