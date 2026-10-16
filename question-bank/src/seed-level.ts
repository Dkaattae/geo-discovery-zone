/**
 * Level seeding, per §1.4 of geoquizdataplan.md ("v1 — seed `level`
 * deterministically"). A separate stage after `buildChoices`, the same way
 * `buildChoices` is a stage after `generate()`: a level needs the distractors,
 * and the distractors need the whole bank. Recorded in engineering-decisions.md
 * E-22.
 *
 *   level = base_level(template)        the template's `base_difficulty`
 *         + entity_obscurity            population_rank / area_rank, bucketed
 *         + distractor_tightness        per near distractor
 *         + concept_load                per template id
 *         - familiarity_bonus           0 for now: see E-22
 *
 * then clamped to 0–18. Not rounded. Every number the computation uses lives
 * in `LEVEL_SEED_WEIGHTS`, so T-025 can tune it in one place.
 *
 * Pure: no network, no file, no clock, no randomness, and inputs are never
 * mutated. Nothing in the build imports this module.
 */
import type { GeneratedQuestion } from "./distractors";
import { TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";

/**
 * Every weight, bucket edge, per-template value, default and the missing-rank
 * value the level computation uses. engineering-decisions.md E-22 lists each
 * key with its value; change both together.
 */
export const LEVEL_SEED_WEIGHTS = {
  /**
   * Obscurity buckets. A rank's bucket is the number of edges it is strictly
   * above: ranks 1–10 are bucket 0, 11–20 bucket 1, 21–35 bucket 2, 36 and up
   * bucket 3. Rank 1 is the largest.
   */
  rank_bucket_edges: [10, 20, 35],
  /** Level per obscurity bucket of `population_rank`. */
  population_rank_weight: 1,
  /** Level per obscurity bucket of `area_rank`. */
  area_rank_weight: 0.5,
  /**
   * The bucket a missing or unusable rank counts as: the bucket of ranks
   * 21–35, so a missing rank is never harder than rank 50 or easier than
   * rank 1.
   */
  missing_rank_bucket: 2,
  /** Level per near distractor (0–3 of them). */
  near_distractor_weight: 0.5,
  /** Per template id. A capital is a recalled fact; a map shows the shape. */
  concept_load: {
    "tpl-identify-on-map": 0,
    "tpl-capital-of": 2,
    "tpl-click-the-map": 0,
  } as Readonly<Record<string, number>>,
  /** `concept_load` for a template id with no entry above. */
  concept_load_default: 1,
  /** Subtracted from every question. 0: see E-22. */
  familiarity_bonus: 0,
};

/**
 * The clamp: openapi.yaml `Level`, 0–18. The contract's range, not a weight,
 * so it is not in `LEVEL_SEED_WEIGHTS`.
 */
export const LEVEL_MIN = 0;
export const LEVEL_MAX = 18;

export type LevelSeedWeights = typeof LEVEL_SEED_WEIGHTS;

export interface LeveledQuestion extends GeneratedQuestion {
  /** 0–18, per plan §1.4. Not rounded. */
  level: number;
}

function nonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function readField(entity: Entity, field: string): unknown {
  return Object.hasOwn(entity, field)
    ? (entity as unknown as Record<string, unknown>)[field]
    : undefined;
}

function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** A usable rank is a positive integer; anything else is missing. */
function usableRank(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function rankBucket(value: unknown, weights: LevelSeedWeights): number {
  const rank = usableRank(value);
  if (rank === null) return weights.missing_rank_bucket;
  let bucket = 0;
  for (const edge of weights.rank_bucket_edges) if (rank > edge) bucket++;
  return bucket;
}

/** `entity_obscurity`: rarer and smaller states are harder. */
function entityObscurity(entity: Entity, weights: LevelSeedWeights): number {
  return (
    weights.population_rank_weight * rankBucket(readField(entity, "population_rank"), weights) +
    weights.area_rank_weight * rankBucket(readField(entity, "area_rank"), weights)
  );
}

/** Near: in the question entity's `borders`, or the same non-blank `region`. */
function isNear(own: Entity, other: Entity): boolean {
  const borders: unknown = readField(own, "borders");
  if (Array.isArray(borders) && borders.includes(other.id)) return true;
  const region = readField(own, "region");
  return nonBlankString(region) && readField(other, "region") === region;
}

/**
 * The entities a distractor could be. On a `map_click` question it is the one
 * with that `geometry_id`; otherwise every same-type, same-scope entity whose
 * choice text matches. Several can match only when two entities share choice
 * text, which no state capital does.
 */
function entitiesForChoice(
  question: GeneratedQuestion,
  index: number,
  own: Entity,
  template: Template,
  entities: readonly Entity[],
): Entity[] {
  const peers = entities.filter(
    (e) => e.id !== own.id && e.type === own.type && e.scope === own.scope,
  );
  const code = question.choiceGeometryIds?.[index];
  if (nonBlankString(code)) return peers.filter((e) => readField(e, "geometry_id") === code);
  const text = question.choices[index] as string;
  const field = template.answer_field === "geometry_id" ? "name" : template.answer_field;
  return peers.filter((e) => {
    const value = readField(e, field);
    return nonBlankString(value) && sameText(value, text);
  });
}

/**
 * How many of the question's distractors are near its entity. A distractor
 * counts as near when any entity it could be is near, which is order-free;
 * one that matches no entity counts as far.
 */
export function nearDistractorCount(
  question: GeneratedQuestion,
  own: Entity,
  template: Template,
  entities: readonly Entity[],
): number {
  let near = 0;
  question.choices.forEach((_, index) => {
    if (index === question.correctIndex) return;
    if (entitiesForChoice(question, index, own, template, entities).some((e) => isNear(own, e)))
      near++;
  });
  return near;
}

/** The level for one question, from its parts. Unclamped values never escape. */
export function levelFor(
  question: GeneratedQuestion,
  own: Entity,
  template: Template,
  entities: readonly Entity[],
  weights: LevelSeedWeights = LEVEL_SEED_WEIGHTS,
): number {
  const conceptLoad = Object.hasOwn(weights.concept_load, template.id)
    ? (weights.concept_load[template.id] as number)
    : weights.concept_load_default;
  const raw =
    template.base_difficulty +
    entityObscurity(own, weights) +
    weights.near_distractor_weight * nearDistractorCount(question, own, template, entities) +
    conceptLoad -
    weights.familiarity_bonus;
  return Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, raw));
}

/**
 * Each question with `level` added, in input order. Nothing else on a question
 * changes.
 *
 * `entities` and `templates` are the inputs that produced `questions`. Throws,
 * and returns nothing, when a question's `entityId` or `templateId` is not
 * among them; the message names the question.
 */
export function seedLevels(
  questions: readonly GeneratedQuestion[],
  entities: readonly Entity[],
  templates: readonly Template[] = TEMPLATES,
): LeveledQuestion[] {
  const entityById = new Map<string, Entity>();
  for (const entity of entities) {
    if (!entityById.has(entity.id)) entityById.set(entity.id, entity);
  }
  const templateById = new Map<string, Template>();
  for (const template of templates) {
    if (!templateById.has(template.id)) templateById.set(template.id, template);
  }

  const resolved = questions.map((question) => {
    const own = entityById.get(question.entityId);
    if (own === undefined) {
      throw new Error(
        `seedLevels: question ${question.id} names entity ${JSON.stringify(question.entityId)}, which is not in the input`,
      );
    }
    const template = templateById.get(question.templateId);
    if (template === undefined) {
      throw new Error(
        `seedLevels: question ${question.id} names template ${JSON.stringify(question.templateId)}, which is not in the input`,
      );
    }
    return { question, own, template };
  });

  return resolved.map(({ question, own, template }) => ({
    ...question,
    level: levelFor(question, own, template, entities),
  }));
}
