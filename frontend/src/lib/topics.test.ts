import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { choicePanel, SETUP_TOPICS } from "./topics";

/**
 * T-026 worker tests: the Setup topics (criteria 43–45) and what a
 * `multiple_choice` question shows above its choices (criteria 40–42). Both
 * are pure, so they are called directly; no render, no network.
 */

const SERVED = join(import.meta.dirname, "../../../backend/app/data/content.json");

function servedTopics(): Set<string> {
  const content = JSON.parse(readFileSync(SERVED, "utf8")) as {
    questions: { topic?: string }[];
  };
  return new Set(content.questions.map((q) => q.topic ?? ""));
}

describe("SETUP_TOPICS", () => {
  test("offers the seven served topics and mixed, in that order", () => {
    expect(SETUP_TOPICS.map((t) => t.id)).toEqual([
      "location",
      "capital",
      "superlative",
      "wildlife",
      "landmark",
      "climate",
      "agriculture",
      "mixed",
    ]);
  });

  test("every topic but mixed has served questions; size, physical and elevation are absent", () => {
    const served = servedTopics();
    for (const { id } of SETUP_TOPICS)
      if (id !== "mixed") expect({ id, served: served.has(id) }).toEqual({ id, served: true });
    const ids = SETUP_TOPICS.map((t) => t.id as string);
    for (const absent of ["size", "physical", "elevation"]) expect(ids).not.toContain(absent);
  });

  test("labels are distinct, non-blank, and none says 'both'", () => {
    const labels = SETUP_TOPICS.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const label of labels) {
      expect(label.trim()).not.toBe("");
      expect(label.toLowerCase()).not.toMatch(/\bboth\b/);
    }
  });

  test("no label contains another, so the e2e helper's substring match picks one button", () => {
    for (const a of SETUP_TOPICS)
      for (const b of SETUP_TOPICS) if (a !== b) expect(a.label.includes(b.label)).toBe(false);
  });
});

describe("choicePanel", () => {
  const ohio = { name: "Ohio", geometryId: "39" };

  test("a superlative shows nothing before the answer, even with an entity and a highlight", () => {
    const q = { format: "multiple_choice" as const, topic: "superlative" as const };
    expect(choicePanel(q, ohio, false, undefined)).toEqual({ kind: "none" });
    expect(choicePanel(q, ohio, false, "39")).toEqual({ kind: "none" });
  });

  test("a superlative shows the answer's state on the map once answered", () => {
    const q = { format: "multiple_choice" as const, topic: "superlative" as const };
    expect(choicePanel(q, ohio, true, "39")).toEqual({ kind: "answer_map", geometryId: "39" });
  });

  test("the other new topics and capital show the question's state, before and after", () => {
    for (const topic of ["capital", "wildlife", "landmark", "climate", "agriculture"] as const) {
      const q = { format: "multiple_choice" as const, topic };
      for (const revealing of [false, true])
        expect(choicePanel(q, ohio, revealing, "39")).toEqual({
          kind: "entity",
          geometryId: "39",
          name: "Ohio",
        });
    }
  });

  test("map questions get no panel here; they draw their own map", () => {
    expect(choicePanel({ format: "map_identify", topic: "location" }, ohio, false, "39")).toEqual({
      kind: "none",
    });
  });
});
