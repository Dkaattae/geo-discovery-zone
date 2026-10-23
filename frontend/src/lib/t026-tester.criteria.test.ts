import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { SessionTopic } from "@/lib/api";

import { choicePanel, SETUP_TOPICS } from "./topics";

/**
 * T-026 tester: the client criteria 40-45 of
 * `tasks/T-026-biggest-state-superlative.md`, through the pure rule
 * `Session.tsx` renders (`choicePanel`) and the Setup list (`SETUP_TOPICS`).
 * The rendered Setup markup is checked in
 * `src/components/t026-setup.criteria.test.tsx`. No render here, no network.
 */

const ENTITY = { name: "Texas", geometryId: "48" };
const SUPER = { format: "multiple_choice", topic: "superlative" } as const;
const OTHER_NEW = ["wildlife", "landmark", "climate", "agriculture"] as const;

describe("T-026 criterion 40: before a superlative is answered, nothing names or outlines its state", () => {
  test("the panel is empty, whatever highlight is passed", () => {
    expect(choicePanel(SUPER, ENTITY, false, undefined)).toEqual({ kind: "none" });
    expect(choicePanel(SUPER, ENTITY, false, "48")).toEqual({ kind: "none" });
  });
  test("Session.tsx renders an entity's name only through the panel", () => {
    const src = readFileSync(join(import.meta.dirname, "../components/Session.tsx"), "utf8");
    expect(src).not.toMatch(/entity\??\.name/);
  });
});

describe("T-026 criterion 41: after a superlative, right or wrong, the answer's state is lit on a US map", () => {
  test("revealing with the answer's code gives the whole map with that state", () => {
    expect(choicePanel(SUPER, ENTITY, true, "48")).toEqual({
      kind: "answer_map",
      geometryId: "48",
    });
  });
});

describe("T-026 criterion 42: the other new templates show the question's state", () => {
  test("before and after the answer", () => {
    for (const topic of [...OTHER_NEW, "capital"] as const) {
      for (const revealing of [false, true]) {
        expect(choicePanel({ format: "multiple_choice", topic }, ENTITY, revealing, "48")).toEqual({
          kind: "entity",
          geometryId: "48",
          name: "Texas",
        });
      }
    }
  });
});

describe("T-026 criteria 43-45: the Setup topics", () => {
  test("criterion 43: one option per topic, plus mixed", () => {
    expect(SETUP_TOPICS.map((t): string => t.id).sort()).toEqual(
      [
        "location",
        "capital",
        "superlative",
        "wildlife",
        "landmark",
        "climate",
        "agriculture",
        "mixed",
      ].sort(),
    );
  });
  test("criterion 43: SessionTopic admits all eight (typecheck)", () => {
    const all: SessionTopic[] = [
      "location",
      "capital",
      "superlative",
      "wildlife",
      "landmark",
      "climate",
      "agriculture",
      "mixed",
    ];
    expect(all).toHaveLength(8);
  });
  test("criterion 44: no label contains the word 'both'", () => {
    for (const t of SETUP_TOPICS) expect(t.label).not.toMatch(/\bboth\b/i);
  });
  test("criterion 45: every offered topic has served questions; size, physical and elevation absent", () => {
    const content = JSON.parse(
      readFileSync(join(import.meta.dirname, "../../../backend/app/data/content.json"), "utf8"),
    ) as { questions: { topic: string }[] };
    const counts = new Map<string, number>();
    for (const q of content.questions) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
    for (const t of SETUP_TOPICS) {
      if (t.id === "mixed") continue;
      expect(counts.get(t.id) ?? 0).toBeGreaterThan(0);
    }
    const ids = SETUP_TOPICS.map((t) => t.id as string);
    for (const absent of ["size", "physical", "elevation"]) expect(ids).not.toContain(absent);
  });
});
