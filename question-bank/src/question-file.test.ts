import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { QUESTION_FILE, renderQuestionFile } from "./question-file";
import type { Entity } from "./types";
import { loadCommittedEntities, REPO_ROOT } from "./write-questions";

/**
 * T-040 worker tests for the committed question file. Reads the committed
 * entity bank and the committed question file; writes nothing, reaches no
 * network.
 */
const committed = () => readFileSync(join(REPO_ROOT, QUESTION_FILE), "utf8");

describe("T-040 — the committed question file is what the stages produce", () => {
  test("the committed file equals a fresh render from the committed entities", () => {
    expect(committed()).toBe(renderQuestionFile(loadCommittedEntities()));
  });

  test("a render from inputs with one entity field changed no longer matches", () => {
    const entities = loadCommittedEntities();
    const first = entities[0] as Entity;
    const edited: Entity[] = [
      { ...first, capital: `${first.capital ?? ""} City` },
      ...entities.slice(1),
    ];
    expect(renderQuestionFile(edited)).not.toBe(committed());
    // The edit, not some other difference, is what the comparison caught.
    expect(renderQuestionFile(entities)).toBe(committed());
  });

  test("rendering twice gives the same bytes", () => {
    const entities = loadCommittedEntities();
    expect(renderQuestionFile(entities)).toBe(renderQuestionFile(entities));
  });
});

describe("T-040 — what the file holds today", () => {
  const doc = () =>
    JSON.parse(committed()) as {
      count: number;
      questions: { id: string; format: string; entityId: string; templateId: string }[];
    };

  test("150 questions: 50 per format, one per entity per template", () => {
    const { count, questions: all } = doc();
    expect(count).toBe(all.length);
    // T-026 (approved Test change request, S3): the three original templates.
    const original = ["tpl-identify-on-map", "tpl-capital-of", "tpl-click-the-map"];
    const questions = all.filter((q) => original.includes(q.templateId));
    expect(questions).toHaveLength(150);
    for (const format of ["map_identify", "multiple_choice", "map_click"]) {
      const ofFormat = questions.filter((q) => q.format === format);
      expect(ofFormat).toHaveLength(50);
      expect(new Set(ofFormat.map((q) => q.entityId)).size).toBe(50);
    }
    expect(new Set(questions.map((q) => q.id)).size).toBe(150);
  });

  test("the file names no clock: no built_at or generated-at timestamp", () => {
    expect(committed()).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  });
});

describe("T-040 — the renderer has no I/O, clock or randomness", () => {
  test("question-file.ts reads no file, env, clock, random or network", () => {
    const text = readFileSync(join(import.meta.dirname, "question-file.ts"), "utf8");
    expect(text).not.toMatch(
      /node:fs|readFile|writeFile|Bun\.|process\.env|\bDate\b|performance\.|Math\.random|fetch\s*\(/,
    );
  });
});
