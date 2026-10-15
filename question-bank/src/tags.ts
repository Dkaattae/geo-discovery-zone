/**
 * The tag stage: adds the `GET /questions` filter tags (plan §1.3, openapi.yaml
 * `listQuestions`) to the questions `seedLevels` returned. A stage after
 * `seedLevels`, the same way `seedLevels` is a stage after `buildChoices`; it
 * changes nothing those stages produced. Recorded in engineering-decisions.md
 * E-23.
 *
 * Wire names are openapi.yaml's camelCase `Question` properties. Of the seven
 * tags, `format` and `level` are already on the question; this adds:
 *
 * - `scope`      the entity's `scope`
 * - `entityType` the entity's `type`
 * - `region`     the entity's `region`, verbatim; the key is omitted when the
 *                region is absent, null or blank
 * - `topic`      the template's entry in `TEMPLATE_TOPICS`; refused, never
 *                defaulted, when there is none
 * - `ageBand`    the template's `min_age_band`
 *
 * Pure: no network, no file, no environment, no clock, no randomness, and
 * inputs are never mutated. Nothing in the build imports this module.
 */
import type { LeveledQuestion } from "./seed-level";
import {
  type AgeBand,
  TEMPLATE_TOPICS,
  TEMPLATES,
  TOPICS,
  type Template,
  type Topic,
} from "./templates";
import type { Entity, EntityType, Scope } from "./types";

export interface TaggedQuestion extends LeveledQuestion {
  scope: Scope;
  entityType: EntityType;
  topic: Topic;
  /** Absent, never blank, when the entity has no usable region. */
  region?: string;
  ageBand: AgeBand;
}

function nonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function topicFor(template: Template, topics: Readonly<Record<string, unknown>>): Topic {
  if (!Object.hasOwn(topics, template.id)) {
    throw new Error(`tagQuestions: template ${template.id} has no topic defined`);
  }
  const topic = topics[template.id];
  if (!(TOPICS as readonly unknown[]).includes(topic)) {
    throw new Error(
      `tagQuestions: template ${template.id} has topic ${JSON.stringify(topic)}, which is not one of ${TOPICS.join(", ")}`,
    );
  }
  return topic as Topic;
}

/**
 * Each question with `scope`, `entityType`, `topic`, `region` (when known) and
 * `ageBand` added, in input order. Nothing else on a question changes.
 *
 * `entities` and `templates` are the inputs that produced `questions`;
 * `topics` maps a template id to its topic. Throws, and returns nothing, when a
 * question's `entityId` or `templateId` is not among the inputs (the message
 * names the question), when its `format` differs from its template's (the
 * message names the question), or when its template has no topic or one
 * outside `TOPICS` (the message names the template).
 */
export function tagQuestions(
  questions: readonly LeveledQuestion[],
  entities: readonly Entity[],
  templates: readonly Template[] = TEMPLATES,
  topics: Readonly<Record<string, unknown>> = TEMPLATE_TOPICS,
): TaggedQuestion[] {
  const entityById = new Map<string, Entity>();
  for (const entity of entities) {
    if (!entityById.has(entity.id)) entityById.set(entity.id, entity);
  }
  const templateById = new Map<string, Template>();
  for (const template of templates) {
    if (!templateById.has(template.id)) templateById.set(template.id, template);
  }

  // Resolve everything first, so a bad question anywhere returns nothing.
  const resolved = questions.map((question) => {
    const own = entityById.get(question.entityId);
    if (own === undefined) {
      throw new Error(
        `tagQuestions: question ${question.id} names entity ${JSON.stringify(question.entityId)}, which is not in the input`,
      );
    }
    const template = templateById.get(question.templateId);
    if (template === undefined) {
      throw new Error(
        `tagQuestions: question ${question.id} names template ${JSON.stringify(question.templateId)}, which is not in the input`,
      );
    }
    if (question.format !== template.format) {
      throw new Error(
        `tagQuestions: question ${question.id} has format ${JSON.stringify(question.format)}, but template ${template.id} has ${JSON.stringify(template.format)}`,
      );
    }
    return { question, own, template, topic: topicFor(template, topics) };
  });

  return resolved.map(({ question, own, template, topic }) => {
    const region: unknown = Object.hasOwn(own, "region") ? own.region : undefined;
    return {
      ...question,
      scope: own.scope,
      entityType: own.type,
      topic,
      ...(nonBlankString(region) ? { region } : {}),
      ageBand: template.min_age_band,
    };
  });
}
