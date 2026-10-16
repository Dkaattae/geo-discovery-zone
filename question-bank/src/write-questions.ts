/**
 * `bun run ./src/write-questions.ts` (T-040): writes the committed question file from the
 * committed entity bank.
 *
 * Reads `data/us-states/index.json` and the entity files it lists, in its
 * order, renders with `renderQuestionFile`, and writes
 * `data/questions/us-states.json`. No network, no clock: run twice on an
 * unchanged tree, the file is byte-identical.
 *
 * Regenerate by hand after the entity bank changes; `question-file.test.ts`
 * fails while the committed file is stale.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { buildQuestionBank, ENTITY_DIR, QUESTION_FILE, renderQuestionFile } from "./question-file";
import type { Entity } from "./types";

export const REPO_ROOT = resolve(import.meta.dirname, "../..");

/** The committed entities, in `index.json` order. */
export function loadCommittedEntities(root: string = REPO_ROOT): Entity[] {
  const dir = join(root, ENTITY_DIR);
  const index = JSON.parse(readFileSync(join(dir, "index.json"), "utf8")) as {
    entities: { id: string }[];
  };
  return index.entities.map(
    ({ id }) => JSON.parse(readFileSync(join(dir, `${id}.json`), "utf8")) as Entity,
  );
}

if (import.meta.main) {
  const entities = loadCommittedEntities();
  const { questions, skipped, shortPools } = buildQuestionBank(entities);
  const out = join(REPO_ROOT, QUESTION_FILE);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderQuestionFile(entities));
  console.log(
    `wrote ${QUESTION_FILE}: ${questions.length} questions from ${entities.length} entities` +
      ` (${skipped.length} pairs skipped, ${shortPools.length} short distractor pools)`,
  );
}
