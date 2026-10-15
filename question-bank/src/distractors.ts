/**
 * Distractors: turns `generate()`'s drafts into four-option questions, per
 * §1.2 of geoquizdataplan.md ("Distractors matter more than the question").
 *
 * A separate stage after `generate()`, not part of it: a draft is built from
 * one entity, a distractor needs the others. The rules are recorded in
 * engineering-decisions.md E-21.
 *
 * - Wrong answers come from candidates (same `type` and `scope`, usable choice
 *   text, a centroid), in tiers set by the template's `distractor_strategy`,
 *   nearest-first by great-circle distance within each tier.
 * - The correct answer's position is a hash of the draft id, so it is fixed
 *   for a draft whatever else is in the input.
 * - A `map_click` question carries `choiceGeometryIds`, parallel to `choices`.
 *
 * Pure: no network, no file, no clock, no randomness, and inputs are never
 * mutated. Nothing in the build imports this module.
 */
import type { QuestionDraft } from "./generate";
import { type DistractorStrategy, TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";

/** Four choices, as in every hand-written question in content.json. */
export const CHOICE_COUNT = 4;
const DISTRACTOR_COUNT = CHOICE_COUNT - 1;

export interface GeneratedQuestion extends QuestionDraft {
  choices: string[];
  /** `choices[correctIndex] === answer`. */
  correctIndex: number;
  /**
   * `map_click` only. Entry `i` is the `geometry_id` of the entity whose name is
   * `choices[i]`, so a click on region X maps to the choice whose code is X.
   */
  choiceGeometryIds?: string[] | undefined;
}

export interface ShortPool {
  /** The draft that did not become a question. */
  draftId: string;
  /** How many distractors with distinct text were found (fewer than 3). */
  found: number;
  /**
   * `too_few_candidates`: the pool ran out. `no_centroid`: the draft's own
   * entity has no usable `centroid`, so nothing can be ordered by distance.
   */
  reason: "too_few_candidates" | "no_centroid";
}

export interface BuildChoicesResult {
  questions: GeneratedQuestion[];
  shortPools: ShortPool[];
}

type LonLat = readonly [number, number];

const EARTH_RADIUS_KM = 6371;

function centroidOf(entity: Entity): LonLat | null {
  const c: unknown = entity.centroid;
  if (!Array.isArray(c) || c.length !== 2) return null;
  const [lon, lat] = c as unknown[];
  if (typeof lon !== "number" || typeof lat !== "number") return null;
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return [lon, lat];
}

/** Great-circle distance in km between two `[longitude, latitude]` points. */
export function greatCircleKm(a: LonLat, b: LonLat): number {
  const rad = Math.PI / 180;
  const lat1 = a[1] * rad;
  const lat2 = b[1] * rad;
  const dLat = lat2 - lat1;
  const dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function nonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function readField(entity: Entity, field: string): unknown {
  return Object.hasOwn(entity, field)
    ? (entity as unknown as Record<string, unknown>)[field]
    : undefined;
}

/** The answer field's value, or `name` when that field is `geometry_id` (E-20). */
function choiceTextOf(entity: Entity, template: Template): unknown {
  return readField(
    entity,
    template.answer_field === "geometry_id" ? "name" : template.answer_field,
  );
}

function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Where the correct answer sits, from the draft id alone: FNV-1a (32-bit) of
 * the id's UTF-16 code units, through the murmur3 32-bit finalizer, modulo 4. Same id, same position, whatever else is in the input.
 */
export function correctIndexFor(draftId: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < draftId.length; i++) {
    hash ^= draftId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  // FNV-1a's low bits depend only on the low bits of each byte, so `% 4` of it
  // alone would give every template the same pattern. The murmur3 finalizer
  // mixes the high bits down first.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;
  hash ^= hash >>> 16;
  return (hash >>> 0) % CHOICE_COUNT;
}

interface Candidate {
  entity: Entity;
  text: string;
  distance: number;
}

/** Tier number, from 0, of a candidate under a strategy. */
function tierOf(strategy: DistractorStrategy, own: Entity, other: Entity): number {
  const region = own.region;
  const sameRegion = nonBlankString(region) && other.region === region;
  switch (strategy) {
    case "sibling_capitals_same_region":
      return sameRegion ? 0 : 1;
    case "neighbours_first": {
      const borders: unknown = own.borders;
      if (Array.isArray(borders) && borders.includes(other.id)) return 0;
      return sameRegion ? 1 : 2;
    }
  }
}

function byTierThenNearest(
  strategy: DistractorStrategy,
  own: Entity,
): (a: Candidate, b: Candidate) => number {
  return (a, b) => {
    const tier = tierOf(strategy, own, a.entity) - tierOf(strategy, own, b.entity);
    if (tier !== 0) return tier;
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.entity.id < b.entity.id ? -1 : a.entity.id > b.entity.id ? 1 : 0;
  };
}

function questionFor(
  draft: QuestionDraft,
  own: Entity,
  template: Template,
  entities: readonly Entity[],
): GeneratedQuestion | ShortPool {
  const origin = centroidOf(own);
  if (origin === null) return { draftId: draft.id, found: 0, reason: "no_centroid" };

  const isClick = draft.format === "map_click";
  const candidates: Candidate[] = [];
  for (const other of entities) {
    if (other.id === own.id || other.type !== own.type || other.scope !== own.scope) continue;
    const text = choiceTextOf(other, template);
    if (!nonBlankString(text)) continue;
    const at = centroidOf(other);
    if (at === null) continue;
    if (isClick && !nonBlankString(other.geometry_id)) continue;
    candidates.push({ entity: other, text, distance: greatCircleKm(origin, at) });
  }
  candidates.sort(byTierThenNearest(template.distractor_strategy, own));

  const picked: Candidate[] = [];
  for (const candidate of candidates) {
    if (picked.length === DISTRACTOR_COUNT) break;
    if (sameText(candidate.text, draft.answer)) continue;
    if (picked.some((p) => sameText(p.text, candidate.text))) continue;
    picked.push(candidate);
  }
  if (picked.length < DISTRACTOR_COUNT) {
    return { draftId: draft.id, found: picked.length, reason: "too_few_candidates" };
  }

  const correctIndex = correctIndexFor(draft.id);
  const choices = picked.map((p) => p.text);
  choices.splice(correctIndex, 0, draft.answer);
  const question: GeneratedQuestion = { ...draft, choices, correctIndex };
  if (isClick) {
    const codes = picked.map((p) => p.entity.geometry_id as string);
    codes.splice(correctIndex, 0, draft.answerGeometryId as string);
    question.choiceGeometryIds = codes;
  }
  return question;
}

/**
 * One question per draft, in draft order, each with four `choices` and a
 * `correctIndex`. A draft whose pool cannot supply three distractors with
 * distinct text, or whose own entity has no usable `centroid`, is reported in
 * `shortPools` instead.
 *
 * `entities` and `templates` are the inputs that produced `drafts`. Throws,
 * and returns nothing, when a draft's `entityId` or `templateId` is not among
 * them; the message names the draft.
 */
export function buildChoices(
  drafts: readonly QuestionDraft[],
  entities: readonly Entity[],
  templates: readonly Template[] = TEMPLATES,
): BuildChoicesResult {
  const entityById = new Map<string, Entity>();
  for (const entity of entities) {
    if (!entityById.has(entity.id)) entityById.set(entity.id, entity);
  }
  const templateById = new Map<string, Template>();
  for (const template of templates) {
    if (!templateById.has(template.id)) templateById.set(template.id, template);
  }

  const resolved = drafts.map((draft) => {
    const own = entityById.get(draft.entityId);
    if (own === undefined) {
      throw new Error(
        `buildChoices: draft ${draft.id} names entity ${JSON.stringify(draft.entityId)}, which is not in the input`,
      );
    }
    const template = templateById.get(draft.templateId);
    if (template === undefined) {
      throw new Error(
        `buildChoices: draft ${draft.id} names template ${JSON.stringify(draft.templateId)}, which is not in the input`,
      );
    }
    return { draft, own, template };
  });

  const questions: GeneratedQuestion[] = [];
  const shortPools: ShortPool[] = [];
  for (const { draft, own, template } of resolved) {
    const out = questionFor(draft, own, template, entities);
    if ("choices" in out) questions.push(out);
    else shortPools.push(out);
  }
  return { questions, shortPools };
}
