/**
 * The committed question file (T-040): every question the four stages produce
 * from a set of entities, rendered as one JSON document.
 *
 *   generate → buildChoices → seedLevels → tagQuestions
 *
 * This module is the pure half: entities in, file text out. Reading the
 * committed entity files and writing the result is `write-questions.ts`, so a
 * test can render from edited entities without touching the disk.
 *
 * The rendered file carries every question the stages produce, `map_click`
 * included, with every field they produce — `answer`, `answerGeometryId` and
 * `choiceGeometryIds` too. Deciding what the app serves is the backend loader's
 * job (`backend/app/content_build.py`), not this file's.
 *
 * Pure: no network, no file, no clock, no randomness. Recorded in
 * engineering-decisions.md E-24.
 */
import { buildChoices, type ShortPool } from "./distractors";
import { generate, type SkippedPair } from "./generate";
import { seedLevels } from "./seed-level";
import { type TaggedQuestion, tagQuestions } from "./tags";
import type { Entity } from "./types";

/** Repo-relative path of the committed question file. */
export const QUESTION_FILE = "question-bank/data/questions/us-states.json";

/** Repo-relative path of the entity directory the file is generated from. */
export const ENTITY_DIR = "question-bank/data/us-states";

export interface QuestionBank {
  questions: TaggedQuestion[];
  /** Template/entity pairs `generate` skipped for a missing field. */
  skipped: SkippedPair[];
  /** Drafts `buildChoices` could not give three distractors. */
  shortPools: ShortPool[];
}

/** Runs the four stages, in order, over `entities`. */
export function buildQuestionBank(entities: readonly Entity[]): QuestionBank {
  const { drafts, skipped } = generate(entities);
  const { questions, shortPools } = buildChoices(drafts, entities);
  const tagged = tagQuestions(seedLevels(questions, entities), entities);
  return { questions: tagged, skipped, shortPools };
}

/**
 * The file's bytes. Two-space JSON with a trailing newline. `_source` names the
 * inputs and nothing time-dependent, so the same entities always give the same
 * bytes.
 */
export function renderQuestionFile(entities: readonly Entity[]): string {
  const { questions } = buildQuestionBank(entities);
  const document = {
    _source: {
      from: `${ENTITY_DIR}/`,
      generatedBy: "cd question-bank && bun run ./src/write-questions.ts",
      stages: ["generate", "buildChoices", "seedLevels", "tagQuestions"],
      note: "Every question the stages produce, map_click included. The backend loader (make -C backend content) decides which of them are served.",
    },
    count: questions.length,
    questions,
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}
