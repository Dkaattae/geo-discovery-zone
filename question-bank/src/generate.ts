/**
 * The generator, per §1.2 of geoquizdataplan.md ("generate, don't collect").
 *
 * Templates × entities → one question draft per applicable pair. A pair whose
 * data has a hole in it is skipped and reported, never emitted with a blank.
 *
 * A draft is not yet an openapi.yaml `Question`: it carries the correct answer
 * only. `choices` and `correctIndex` are added after it by `buildChoices` in
 * distractors.ts (T-022), `level` by `seedLevels` in seed-level.ts (T-023, E-22), the tag set is T-024's. The draft shape and the `map_click` representation are
 * recorded in engineering-decisions.md E-20.
 *
 * Pure: no network, no file, no clock, no randomness. Nothing in the build
 * imports this module (T-021 criterion 24).
 */
import {
  type EntityField,
  type QuestionFormat,
  TEMPLATES,
  type Template,
  validateTemplate,
} from "./templates";
import type { Entity } from "./types";

export interface QuestionDraft {
  /** `gen:<templateId>:<entityId>`. Depends on that pair only. */
  id: string;
  entityId: string;
  templateId: string;
  format: QuestionFormat;
  /** The template's prompt with every `{token}` filled verbatim. */
  prompt: string;
  /**
   * The child-facing correct answer. The entity's `answer_field` value, except
   * when that field is `geometry_id`: then it is the entity's `name`, because a
   * FIPS code is never a label a child sees.
   */
  answer: string;
  /** The region to highlight. Present on `map_identify` drafts only. */
  highlightGeometryId?: string | undefined;
  /**
   * The code the child must click. Present only when the template's
   * `answer_field` is `geometry_id`. Downstream joins on this, never on `answer`.
   */
  answerGeometryId?: string | undefined;
}

export interface SkippedPair {
  templateId: string;
  entityId: string;
  /** Required fields that are absent, null, blank after trimming, or `[]`. */
  missing: EntityField[];
  /**
   * Fields that are present but would have to become text (a prompt token, or
   * the answer) and are not strings: a number, an array, an object.
   */
  notText: EntityField[];
}

export interface GenerateResult {
  drafts: QuestionDraft[];
  skipped: SkippedPair[];
}

const PLACEHOLDER = /\{([^{}]*)\}/g;

/** Same definition as templates-verify.test.ts "T-020 criterion 21". */
function isMissing(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function draftId(templateId: string, entityId: string): string {
  // A template id matches /^tpl-[a-z0-9-]+$/, so it never holds ":" and the
  // first ":" after the prefix splits the pair unambiguously.
  return `gen:${templateId}:${entityId}`;
}

function tokensOf(prompt: string): EntityField[] {
  return [...prompt.matchAll(PLACEHOLDER)].map((m) => (m[1] ?? "") as EntityField);
}

function readField(entity: Entity, field: EntityField): unknown {
  return Object.hasOwn(entity, field)
    ? (entity as unknown as Record<string, unknown>)[field]
    : undefined;
}

function checkInputs(entities: readonly Entity[], templates: readonly Template[]): void {
  const invalid: string[] = [];
  templates.forEach((template, index) => {
    const problems = validateTemplate(template);
    if (problems.length > 0) {
      const raw = (template as unknown as { id?: unknown } | null)?.id;
      const label = typeof raw === "string" ? raw : `templates[${index}]`;
      invalid.push(`${label}: ${problems.join("; ")}`);
    }
  });
  if (invalid.length > 0) {
    throw new Error(`generate: invalid template(s), nothing generated. ${invalid.join(" | ")}`);
  }

  const templateIds = new Set<string>();
  for (const template of templates) {
    if (templateIds.has(template.id)) {
      throw new Error(`generate: duplicate template id ${JSON.stringify(template.id)}`);
    }
    templateIds.add(template.id);
  }

  const entityIds = new Set<string>();
  entities.forEach((entity, index) => {
    const id: unknown = entity?.id;
    if (typeof id !== "string" || id.trim() === "") {
      throw new Error(`generate: entities[${index}] has no usable id`);
    }
    if (entityIds.has(id)) {
      throw new Error(`generate: duplicate entity id ${JSON.stringify(id)}`);
    }
    entityIds.add(id);
  });
}

function draftFor(entity: Entity, template: Template): QuestionDraft | SkippedPair {
  const tokens = tokensOf(template.prompt);
  const answerIsCode = template.answer_field === "geometry_id";

  // Fields that must be present. `requires`, plus what the draft itself needs:
  // `geometry_id` for a highlight, `name` as the label for a code answer.
  const required = new Set<EntityField>(template.requires);
  if (template.format === "map_identify") required.add("geometry_id");
  if (answerIsCode) required.add("name");

  // Fields whose value becomes a string on the draft.
  const textual = new Set<EntityField>(tokens);
  textual.add(answerIsCode ? "name" : template.answer_field);
  if (answerIsCode || template.format === "map_identify") textual.add("geometry_id");

  const missing: EntityField[] = [];
  for (const field of required) {
    if (isMissing(readField(entity, field))) missing.push(field);
  }
  const notText: EntityField[] = [];
  for (const field of textual) {
    const value = readField(entity, field);
    if (isMissing(value)) {
      if (!missing.includes(field)) missing.push(field);
    } else if (typeof value !== "string") {
      notText.push(field);
    }
  }
  if (missing.length > 0 || notText.length > 0) {
    return { templateId: template.id, entityId: entity.id, missing, notText };
  }

  const text = (field: EntityField): string => readField(entity, field) as string;
  const prompt = template.prompt.replace(PLACEHOLDER, (_, token: string) =>
    text(token as EntityField),
  );
  const draft: QuestionDraft = {
    id: draftId(template.id, entity.id),
    entityId: entity.id,
    templateId: template.id,
    format: template.format,
    prompt,
    answer: answerIsCode ? text("name") : text(template.answer_field),
  };
  if (template.format === "map_identify") draft.highlightGeometryId = text("geometry_id");
  if (answerIsCode) draft.answerGeometryId = text("geometry_id");
  return draft;
}

/**
 * One draft per (template, entity) pair where the entity's `type` is in the
 * template's `applies_to` and every field the draft needs is present and text.
 * Other applicable pairs come back in `skipped`. Pairs outside `applies_to`
 * are neither drafted nor reported.
 *
 * Throws, and generates nothing, when a template fails `validateTemplate`, two
 * templates share an id, or two entities share an id (or one has none).
 *
 * Output order: templates in input order, entities in input order within each.
 */
export function generate(
  entities: readonly Entity[],
  templates: readonly Template[] = TEMPLATES,
): GenerateResult {
  checkInputs(entities, templates);
  const drafts: QuestionDraft[] = [];
  const skipped: SkippedPair[] = [];
  for (const template of templates) {
    for (const entity of entities) {
      if (!template.applies_to.includes(entity.type)) continue;
      const out = draftFor(entity, template);
      if ("answer" in out) drafts.push(out);
      else skipped.push(out);
    }
  }
  return { drafts, skipped };
}
