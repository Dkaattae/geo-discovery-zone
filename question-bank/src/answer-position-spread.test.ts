/**
 * T-094 (worker): every positioned template puts its answer at each of the four
 * positions 0..3 at least once over the committed bank, so a change that makes a
 * template's answer position predictable goes red.
 *
 * "Positioned" is derived from `TEMPLATES` by format: every template whose format
 * is not `map_click` (a `map_click` question carries no `correctIndex`, E-29).
 *
 * Pure: `generate` and `buildChoices` are called directly. The only file I/O is
 * reading the committed state files. No network, no seam.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChoices } from "./distractors";
import { generate } from "./generate";
import { TEMPLATES } from "./templates";
import type { Entity } from "./types";

const STATES_DIR = join(import.meta.dirname, "..", "data", "us-states");
const POSITIONS = [0, 1, 2, 3] as const;

/** The eight positioned templates as of T-094 (brief survey, 2026-10-27). */
const KNOWN_POSITIONED = [
  "tpl-identify-on-map",
  "tpl-capital-of",
  "tpl-biggest-state",
  "tpl-state-animal-of",
  "tpl-landmark-in",
  "tpl-climate-of",
  "tpl-crop-of",
  "tpl-farm-animal-of",
];

function loadBank(): Entity[] {
  return readdirSync(STATES_DIR)
    .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
    .map((f) => JSON.parse(readFileSync(join(STATES_DIR, f), "utf8")) as Entity);
}

const bank = loadBank();
const { questions } = buildChoices(generate(bank, TEMPLATES).drafts, bank, TEMPLATES);
const positioned = TEMPLATES.filter((t) => t.format !== "map_click").map((t) => t.id);

describe("answer-position spread over the committed bank", () => {
  test("the positioned set is derived by format and holds every known positioned template", () => {
    expect(positioned.length).toBeGreaterThan(0);
    const missing = KNOWN_POSITIONED.filter((id) => !positioned.includes(id));
    expect(missing).toEqual([]);
  });

  test("every positioned template has its answer at every index 0..3 at least once", () => {
    const missing: string[] = [];
    for (const id of positioned) {
      const seen = new Set<number>();
      for (const q of questions) {
        if (q.templateId === id && typeof q.correctIndex === "number") seen.add(q.correctIndex);
      }
      for (const i of POSITIONS) {
        if (!seen.has(i)) missing.push(`${id}: no question with correctIndex ${i}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
