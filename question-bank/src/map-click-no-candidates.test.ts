/**
 * T-092, written by the worker. The tester's verify file is the independent
 * check; these pin what the worker was unsure of: that a `map_click` question
 * leaves the stages with no candidate keys, while its level and its
 * `shortPools` entry still follow the three peers it would have offered.
 * Pure: synthetic entities only, no file, no network.
 */
import { describe, expect, test } from "bun:test";
import { buildChoices } from "./distractors";
import { generate } from "./generate";
import { buildQuestionBank } from "./question-file";
import { seedLevels } from "./seed-level";
import { TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";

const CLICK = TEMPLATES.find((t) => t.id === "tpl-click-the-map") as Template;
const IDENTIFY = TEMPLATES.find((t) => t.id === "tpl-identify-on-map") as Template;
const CAPITAL = TEMPLATES.find((t) => t.id === "tpl-capital-of") as Template;
const THREE = [CLICK, IDENTIFY, CAPITAL];
const CANDIDATE_KEYS = ["choices", "correctIndex", "choiceGeometryIds"];

/** A state with no ranks, so every one has the same obscurity. */
function state(code: string, lon: number, extra: Partial<Entity> = {}): Entity {
  return {
    id: `us-state-${code}`,
    type: "state",
    scope: "us",
    name: `State ${code.toUpperCase()}`,
    capital: `Capital ${code.toUpperCase()}`,
    geometry_id: String(10 + lon),
    region: `Region ${code}`,
    centroid: [lon, 40],
    ...extra,
  };
}

function run(entities: Entity[], templates: Template[] = THREE) {
  const { drafts } = generate(entities, templates);
  const { questions, shortPools } = buildChoices(drafts, entities, templates);
  return { questions, shortPools, leveled: seedLevels(questions, entities, templates) };
}

function clickOf(leveled: ReturnType<typeof run>["leveled"], code: string) {
  return leveled.find((q) => q.id === `gen:${CLICK.id}:us-state-${code}`);
}

// Level of a click question here: base 3 + obscurity (missing ranks: 1 * 2 +
// 0.5 * 2) + 0.5 per near distractor + concept_load 0.
const clickLevel = (near: number): number => 6 + 0.5 * near;

describe("T-092: map_click questions carry no candidates", () => {
  test("no candidate keys on map_click; four choices on the other formats", () => {
    const entities = ["aa", "bb", "cc", "dd", "ee"].map((c, i) => state(c, i));
    const { questions, leveled } = run(entities);
    const bank = buildQuestionBank(entities).questions;
    for (const out of [questions, leveled, bank]) {
      expect(out.some((q) => q.format === "map_click")).toBe(true);
      for (const q of out) {
        if (q.format === "map_click") {
          for (const key of CANDIDATE_KEYS) expect(Object.hasOwn(q, key)).toBe(false);
        } else {
          expect(q.choices).toHaveLength(4);
          expect((q.choices as string[])[q.correctIndex as number]).toBe(q.answer);
          expect(Object.hasOwn(q, "choiceGeometryIds")).toBe(false);
        }
      }
    }
  });
});

describe("T-092: map_click levels still count the would-be distractors", () => {
  test("three nearest peers all near (shared region or border) → +1.5", () => {
    const entities = [
      state("aa", 0, { region: "R", borders: ["us-state-bb"] }),
      state("bb", 1),
      state("cc", 2, { region: "R" }),
      state("dd", 3, { region: "R" }),
      state("ee", 9),
    ];
    expect(clickOf(run(entities).leveled, "aa")?.level).toBe(clickLevel(3));
  });

  test("a same-region peer outranks nearer ones: two near → +1.0", () => {
    const entities = [
      state("aa", 0, { region: "R" }),
      state("bb", 1, { region: "R" }),
      state("cc", 2),
      state("dd", 3),
      state("ee", 9, { region: "R" }),
    ];
    // Same region puts ee in tier 1 ahead of cc and dd: two near peers.
    expect(clickOf(run(entities).leveled, "aa")?.level).toBe(clickLevel(2));
  });

  test("no near peer → no distractor term", () => {
    const entities = ["aa", "bb", "cc", "dd"].map((c, i) => state(c, i));
    expect(clickOf(run(entities).leveled, "aa")?.level).toBe(clickLevel(0));
  });

  test("seedLevels throws, naming the question, when the inputs no longer give three peers", () => {
    const entities = ["aa", "bb", "cc", "dd"].map((c, i) => state(c, i));
    const { questions } = run(entities);
    const aa = questions.filter((q) => q.id === `gen:${CLICK.id}:us-state-aa`);
    expect(aa).toHaveLength(1);
    expect(() => seedLevels(aa, entities.slice(0, 3), THREE)).toThrow(
      `gen:${CLICK.id}:us-state-aa`,
    );
  });
});

describe("T-092: map_click shortPools are unchanged", () => {
  test("two eligible peers → too_few_candidates, found 2, no question", () => {
    // dd has a blank geometry_id, so it is not a click candidate.
    const entities = [state("aa", 0), state("bb", 1), state("cc", 2), state("dd", 3)];
    entities[3] = { ...entities[3], geometry_id: " " } as Entity;
    const { shortPools, questions } = run(entities, [CLICK]);
    expect(shortPools).toContainEqual({
      draftId: `gen:${CLICK.id}:us-state-aa`,
      found: 2,
      reason: "too_few_candidates",
    });
    expect(questions.some((q) => q.entityId === "us-state-aa")).toBe(false);
  });

  test("three eligible peers → a question and no shortPools entry", () => {
    const entities = ["aa", "bb", "cc", "dd"].map((c, i) => state(c, i));
    const { shortPools, questions } = run(entities, [CLICK]);
    expect(shortPools).toEqual([]);
    expect(questions).toHaveLength(4);
  });

  test("own centroid unusable → no_centroid, no question", () => {
    const entities = ["aa", "bb", "cc", "dd", "ee"].map((c, i) => state(c, i));
    entities[0] = { ...entities[0], centroid: [Number.NaN, 40] } as Entity;
    const { shortPools, questions } = run(entities, [CLICK]);
    expect(shortPools).toContainEqual({
      draftId: `gen:${CLICK.id}:us-state-aa`,
      found: 0,
      reason: "no_centroid",
    });
    expect(questions.some((q) => q.entityId === "us-state-aa")).toBe(false);
  });
});
