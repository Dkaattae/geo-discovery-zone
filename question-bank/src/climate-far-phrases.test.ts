/**
 * T-090 (worker): the two climate caps in `buildChoices`. At most one wrong
 * answer from Hawaii or Alaska, and never all three from one same-climate
 * group. Inline fixtures for the rule, the committed entity files for the
 * bank-wide check. No network, nothing mocked, nothing written. The tester's
 * suite is the check on the brief; this is the worker's own safety net.
 */
import { describe, expect, test } from "bun:test";

import { buildChoices, CLIMATE_FAR_PHRASE_STATES, SAME_CLIMATE_GROUPS } from "./distractors";
import type { QuestionDraft } from "./generate";
import { TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";
import { loadCommittedEntities } from "./write-questions";

const CLIMATE = TEMPLATES.find((t) => t.id === "tpl-climate-of") as Template;

/** A state on the equator at `lon`, so distance from `lon` 0 grows with `lon`. */
function state(code: string, lon: number): Entity {
  return {
    id: `us-state-${code.toLowerCase()}`,
    type: "state",
    scope: "us",
    name: `State ${code}`,
    centroid: [lon, 0],
    climate_kid: `climate of ${code}`,
  } as unknown as Entity;
}

function draftFor(own: Entity): QuestionDraft {
  return {
    id: `gen:tpl-climate-of:${own.id}`,
    entityId: own.id,
    templateId: CLIMATE.id,
    format: "multiple_choice",
    prompt: `What kind of climate does ${own.name} have?`,
    answer: own.climate_kid as string,
  };
}

/** The wrong answers' postal codes, in choice order. */
function wrongCodes(entities: Entity[], ownCode: string): string[] {
  const own = entities.find((e) => e.id === `us-state-${ownCode.toLowerCase()}`) as Entity;
  const { questions, shortPools } = buildChoices([draftFor(own)], entities, [CLIMATE]);
  expect(shortPools).toEqual([]);
  const q = questions[0]!;
  return q.choices
    .filter((_, i) => i !== q.correctIndex)
    .map((text) => text.replace("climate of ", ""));
}

describe("the Hawaii and Alaska cap", () => {
  test("the list is HI and AK", () => {
    expect([...CLIMATE_FAR_PHRASE_STATES].toSorted()).toEqual(["AK", "HI"]);
  });

  test("HI and AK the two farthest: the farther is offered, the other skipped", () => {
    const entities = [
      state("TX", 0),
      state("AK", 40),
      state("HI", 50),
      state("CA", 30),
      state("FL", 20),
    ];
    expect(wrongCodes(entities, "TX")).toEqual(["HI", "CA", "FL"]);
  });

  test("HI's own question may offer AK's phrase, and AK's may offer HI's", () => {
    const hi = [state("HI", 0), state("AK", 50), state("CA", 40), state("FL", 30)];
    expect(wrongCodes(hi, "HI")).toEqual(["AK", "CA", "FL"]);
    const ak = [state("AK", 0), state("HI", 50), state("CA", 40), state("FL", 30)];
    expect(wrongCodes(ak, "AK")).toEqual(["HI", "CA", "FL"]);
  });

  test("never relaxed: HI, AK and one other is a short pool with found 2", () => {
    const entities = [state("TX", 0), state("HI", 50), state("AK", 40), state("CA", 30)];
    const own = entities[0]!;
    const out = buildChoices([draftFor(own)], entities, [CLIMATE]);
    expect(out.questions).toEqual([]);
    expect(out.shortPools).toEqual([
      { draftId: draftFor(own).id, found: 2, reason: "too_few_candidates" },
    ]);
  });
});

describe("the group cap", () => {
  test("three farthest in one group: the first two, then the next from outside it", () => {
    const entities = [
      state("TX", 0),
      state("ME", 50),
      state("NH", 40),
      state("VT", 30),
      state("CA", 20),
      state("FL", 10),
    ];
    expect(wrongCodes(entities, "TX")).toEqual(["ME", "NH", "CA"]);
  });

  test("the two caps together, and the answer's own group still excluded", () => {
    const entities = [
      state("RI", 0),
      state("HI", 60),
      state("AK", 55),
      state("CT", 52), // RI's own group: excluded as before
      state("ME", 50),
      state("NH", 40),
      state("VT", 30),
      state("CA", 20),
    ];
    expect(wrongCodes(entities, "RI")).toEqual(["HI", "ME", "NH"]);
  });

  test("same input, same output", () => {
    const entities = [state("TX", 0), state("ME", 50), state("NH", 40), state("VT", 30)];
    const a = buildChoices([draftFor(entities[0]!)], entities, [CLIMATE]);
    const b = buildChoices([draftFor(entities[0]!)], entities, [CLIMATE]);
    expect(a).toEqual(b);
    expect(a.shortPools).toEqual([
      { draftId: draftFor(entities[0]!).id, found: 2, reason: "too_few_candidates" },
    ]);
  });
});

describe("over the committed entity files", () => {
  const entities = loadCommittedEntities();
  const byClimate = new Map(
    entities.map((e) => [e.climate_kid as string, e.id.slice(-2).toUpperCase()]),
  );
  const groupOf = (code: string) =>
    Object.entries(SAME_CLIMATE_GROUPS).find(([, codes]) => codes.includes(code))?.[0];
  const drafts = entities.map(draftFor);
  const { questions, shortPools } = buildChoices(drafts, entities, [CLIMATE]);

  test("50 climate questions, none short", () => {
    expect(questions).toHaveLength(50);
    expect(shortPools).toEqual([]);
  });

  test("each offers at most one of HI and AK, and never three from one group", () => {
    for (const q of questions) {
      const codes = q.choices
        .filter((_, i) => i !== q.correctIndex)
        .map((text) => byClimate.get(text) as string);
      expect(codes.every((c) => c !== undefined)).toBe(true);
      expect(codes.filter((c) => CLIMATE_FAR_PHRASE_STATES.includes(c)).length).toBeLessThanOrEqual(
        1,
      );
      const groups = codes.map(groupOf);
      const allOne = groups[0] !== undefined && groups.every((g) => g === groups[0]);
      expect(allOne).toBe(false);
    }
  });
});
