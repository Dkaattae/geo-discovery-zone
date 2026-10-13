/**
 * Question templates, per §1.2 of geoquizdataplan.md ("Template record").
 *
 * Questions are generated from templates × entities, not written by hand. A
 * template says which entity fields a question needs (`requires`), which one is
 * the answer (`answer_field`), how wrong answers are picked
 * (`distractor_strategy`, a name only: T-022 implements the strategies), and
 * the stored inputs to `level` and appropriateness (`base_difficulty`,
 * `min_age_band`; T-023 turns them into a level).
 *
 * Nothing in the build imports this module. T-021 is the first reader.
 */
import type { Entity, EntityType } from "./types";

/**
 * Every key of `Entity`, as a runtime set. `satisfies` makes this exhaustive in
 * both directions: adding a key to `Entity` without adding it here, or listing
 * a key `Entity` does not have, fails `bun run typecheck`.
 */
const ENTITY_FIELD_SET = {
  id: true,
  type: true,
  scope: true,
  name: true,
  capital: true,
  geometry_id: true,
  region: true,
  centroid: true,
  population: true,
  population_rank: true,
  area_km2: true,
  area_rank: true,
  borders: true,
  climate_kid: true,
  top_crops: true,
  top_livestock: true,
  state_animal: true,
  landmark: true,
  highest_point: true,
  highest_point_m: true,
  fun_facts: true,
  sources: true,
} as const satisfies Record<keyof Entity, true>;

/** Every member of `EntityType`, tied to the union the same way. */
const ENTITY_TYPE_SET = {
  state: true,
  country: true,
  city: true,
  landmark: true,
  river: true,
  mountain: true,
  mountain_range: true,
  lake: true,
  ocean: true,
} as const satisfies Record<EntityType, true>;

/** `QuestionFormat` in openapi.yaml, all nine values. */
export const QUESTION_FORMATS = [
  "map_identify",
  "map_click",
  "multiple_choice",
  "image",
  "ab_compare",
  "pin_pick",
  "pin_drop",
  "drag_order",
  "click_profile",
] as const;

export type QuestionFormat = (typeof QUESTION_FORMATS)[number];

/**
 * Names of the ways wrong answers are chosen. Only names: no function sits
 * behind them until T-022.
 *
 * - `neighbours_first`: entities that border the answer, topped up from the
 *   same region.
 * - `sibling_capitals_same_region`: capitals of other entities in the answer's
 *   region.
 */
export const DISTRACTOR_STRATEGIES = ["neighbours_first", "sibling_capitals_same_region"] as const;

export type DistractorStrategy = (typeof DISTRACTOR_STRATEGIES)[number];

/** `AgeBand` in openapi.yaml: appropriateness, not challenge (plan §1.4). */
export type AgeBand = 1 | 2 | 3;

export type EntityField = keyof Entity;

export interface Template {
  /** `tpl-` then lower-case words joined by hyphens. */
  id: string;
  /** Child-facing text. Each `{token}` names a field in `requires`. */
  prompt: string;
  /** The entity field holding the correct answer. Always in `requires`. */
  answer_field: EntityField;
  distractor_strategy: DistractorStrategy;
  /** Fields an entity must have, non-empty, for the template to apply to it. */
  requires: EntityField[];
  applies_to: EntityType[];
  format: QuestionFormat;
  /** A stored input to `level`, on the same 0–18 scale. Not a level itself. */
  base_difficulty: number;
  min_age_band: AgeBand;
}

const TEMPLATE_KEYS = {
  id: true,
  prompt: true,
  answer_field: true,
  distractor_strategy: true,
  requires: true,
  applies_to: true,
  format: true,
  base_difficulty: true,
  min_age_band: true,
} as const satisfies Record<keyof Template, true>;

export const TEMPLATES: Template[] = [
  {
    id: "tpl-identify-on-map",
    prompt: "Which state is highlighted?",
    answer_field: "name",
    distractor_strategy: "neighbours_first",
    requires: ["name", "geometry_id"],
    applies_to: ["state"],
    format: "map_identify",
    base_difficulty: 2,
    min_age_band: 1,
  },
  {
    id: "tpl-capital-of",
    prompt: "What is the capital of {name}?",
    answer_field: "capital",
    distractor_strategy: "sibling_capitals_same_region",
    requires: ["name", "capital"],
    applies_to: ["state", "country"],
    format: "multiple_choice",
    base_difficulty: 2,
    min_age_band: 1,
  },
  {
    id: "tpl-click-the-map",
    prompt: "Find {name} on the map.",
    answer_field: "geometry_id",
    distractor_strategy: "neighbours_first",
    requires: ["name", "geometry_id"],
    applies_to: ["state"],
    format: "map_click",
    base_difficulty: 3,
    min_age_band: 1,
  },
];

const ID_PATTERN = /^tpl-[a-z0-9]+(-[a-z0-9]+)*$/;
const PLACEHOLDER = /\{([^{}]*)\}/g;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function has(set: object, key: string): boolean {
  return Object.hasOwn(set, key);
}

function show(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** A list of field names: a non-empty array of distinct strings. */
function checkStringList(field: string, value: unknown, problems: string[]): string[] | null {
  if (!Array.isArray(value)) {
    problems.push(`${field}: must be an array, got ${show(value)}`);
    return null;
  }
  if (value.length === 0) {
    problems.push(`${field}: must not be empty`);
    return null;
  }
  const strings: string[] = [];
  for (const entry of value as unknown[]) {
    if (typeof entry !== "string") {
      problems.push(`${field}: every entry must be a string, got ${show(entry)}`);
      continue;
    }
    strings.push(entry);
  }
  const seen = new Set<string>();
  for (const entry of strings) {
    if (seen.has(entry)) problems.push(`${field}: duplicate entry ${show(entry)}`);
    seen.add(entry);
  }
  return strings;
}

/**
 * Checks a value against the `Template` record. Returns a list of problems;
 * an empty list means the value is valid. Never throws.
 */
export function validateTemplate(value: unknown): string[] {
  try {
    return check(value);
  } catch (error) {
    // A proxy or a throwing getter. Reported as a problem, never rethrown.
    return [`template: could not be read (${String(error)})`];
  }
}

function check(value: unknown): string[] {
  const problems: string[] = [];
  if (!isPlainObject(value)) {
    problems.push(`template: must be an object, got ${show(value)}`);
    return problems;
  }

  for (const key of Object.keys(TEMPLATE_KEYS)) {
    if (!has(value, key)) problems.push(`${key}: missing`);
  }
  for (const key of Object.keys(value)) {
    if (!has(TEMPLATE_KEYS, key)) problems.push(`${key}: not a template field`);
  }

  if (has(value, "id")) {
    const id = value["id"];
    if (typeof id !== "string" || !ID_PATTERN.test(id)) {
      problems.push(`id: must match ${ID_PATTERN.source}, got ${show(id)}`);
    }
  }

  let requires: string[] | null = null;
  if (has(value, "requires")) {
    requires = checkStringList("requires", value["requires"], problems);
    for (const field of requires ?? []) {
      if (!has(ENTITY_FIELD_SET, field)) {
        problems.push(`requires: ${show(field)} is not an Entity field`);
      }
    }
  }

  if (has(value, "answer_field")) {
    const answer = value["answer_field"];
    if (typeof answer !== "string") {
      problems.push(`answer_field: must be a string, got ${show(answer)}`);
    } else {
      if (!has(ENTITY_FIELD_SET, answer)) {
        problems.push(`answer_field: ${show(answer)} is not an Entity field`);
      }
      if (requires !== null && !requires.includes(answer)) {
        problems.push(`answer_field: ${show(answer)} is not listed in requires`);
      }
    }
  }

  if (has(value, "prompt")) {
    const prompt = value["prompt"];
    if (typeof prompt !== "string" || prompt.trim() === "") {
      problems.push(`prompt: must be a non-empty string, got ${show(prompt)}`);
    } else {
      for (const match of prompt.matchAll(PLACEHOLDER)) {
        const token = match[1] ?? "";
        if (requires === null || !requires.includes(token)) {
          problems.push(`prompt: placeholder {${token}} does not name a field in requires`);
        }
      }
      if (/[{}]/.test(prompt.replace(PLACEHOLDER, ""))) {
        problems.push(`prompt: has an unmatched brace`);
      }
    }
  }

  if (has(value, "applies_to")) {
    const appliesTo = checkStringList("applies_to", value["applies_to"], problems);
    for (const type of appliesTo ?? []) {
      if (!has(ENTITY_TYPE_SET, type)) {
        problems.push(`applies_to: ${show(type)} is not an EntityType`);
      }
    }
  }

  if (has(value, "format")) {
    const format = value["format"];
    if (!(QUESTION_FORMATS as readonly unknown[]).includes(format)) {
      problems.push(`format: must be one of ${QUESTION_FORMATS.join(", ")}, got ${show(format)}`);
    }
  }

  if (has(value, "distractor_strategy")) {
    const strategy = value["distractor_strategy"];
    if (!(DISTRACTOR_STRATEGIES as readonly unknown[]).includes(strategy)) {
      problems.push(
        `distractor_strategy: must be one of ${DISTRACTOR_STRATEGIES.join(", ")}, got ${show(strategy)}`,
      );
    }
  }

  if (has(value, "base_difficulty")) {
    const difficulty = value["base_difficulty"];
    if (
      typeof difficulty !== "number" ||
      !Number.isFinite(difficulty) ||
      difficulty < 0 ||
      difficulty > 18
    ) {
      problems.push(`base_difficulty: must be a finite number in 0-18, got ${show(difficulty)}`);
    }
  }

  if (has(value, "min_age_band")) {
    const band = value["min_age_band"];
    if (band !== 1 && band !== 2 && band !== 3) {
      problems.push(`min_age_band: must be 1, 2 or 3, got ${show(band)}`);
    }
  }

  return problems;
}
