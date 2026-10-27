/**
 * Distractors: turns `generate()`'s drafts into four-option questions, per
 * §1.2 of geoquizdataplan.md ("Distractors matter more than the question"),
 * except `map_click` drafts, which become questions with no options.
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
 * - A `map_click` question carries no candidates (E-29, T-092): no `choices`,
 *   no `correctIndex`. It is graded by `answerGeometryId` alone. The three
 *   nearest peers it would have offered are still found, by
 *   `clickDistractorsFor`, because its level counts how many are near (E-22)
 *   and whether it has three decides whether it is a question at all.
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

/**
 * A draft with its candidates. `choices` and `correctIndex` are present on
 * every format except `map_click`, and absent (never `null`, never `[]`) on
 * `map_click`, which offers no candidates (E-29).
 */
export interface GeneratedQuestion extends QuestionDraft {
  /** Four entries. Absent on `map_click`. */
  choices?: string[];
  /** `choices[correctIndex] === answer`. Absent on `map_click`. */
  correctIndex?: number;
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

/**
 * The texts an entity can offer as a choice: its answer field's value, or
 * `name` when that field is `geometry_id` (E-20). A list-valued field
 * (`top_crops`, `top_livestock`) offers each of its non-blank strings, in
 * order (T-026).
 */
function choiceTextsOf(entity: Entity, template: Template): string[] {
  const value = readField(
    entity,
    template.answer_field === "geometry_id" ? "name" : template.answer_field,
  );
  if (Array.isArray(value)) return value.filter(nonBlankString);
  return nonBlankString(value) ? [value] : [];
}

// ---------------------------------------------------------------------------
// T-026's person-approved lists. Each is copied verbatim from
// tasks/T-026-biggest-state-superlative.md; the criterion number is beside it.
// Add or remove nothing here without the brief's approval: a list that looks
// wrong is reported, not fixed.

/** Criterion 12: same animal to a reader, never both in one question. */
export const SAME_ANIMAL_PAIRS: readonly (readonly [string, string])[] = [
  ["Black bear", "American black bear"],
  ["Grizzly bear", "California grizzly bear"],
  ["Gray squirrel", "Eastern gray squirrel"],
  ["Horse", "Morgan horse"],
  ["Desert bighorn sheep", "Rocky Mountain bighorn sheep"],
];

/** Criterion 16: two NASA museums, never both in one question. */
export const SAME_LANDMARK_PAIRS: readonly (readonly [string, string])[] = [
  ["U.S. Space & Rocket Center", "Space Center Houston"],
];

/**
 * Criteria 18 and 19: landmarks that are never a wrong choice in the named
 * state's question, keyed by postal code. Criterion 18 is from `tasks.md`
 * T-026; criterion 19 is brief call C4, the expander's own geography.
 */
export const LANDMARK_TRAPS: Readonly<Record<string, readonly string[]>> = {
  WA: ["Mount Washington"],
  MO: ["St. Louis Cathedral"],
  NC: ["Chimney Rock", "Great Smoky Mountains National Park"],
  CO: ["Chimney Rock"],
  MT: ["Yellowstone National Park"],
  ID: ["Yellowstone National Park"],
  AZ: ["Hoover Dam"],
  NJ: ["Statue of Liberty"],
};

/**
 * Criteria 21 and 23: states whose `climate_kid` phrases describe the same
 * climate (T-014 criterion 17, via `tasks.md` T-026), by postal code. A
 * question never offers the climate of a state in the answer state's group.
 * AK, CA, CO, FL, HI, MO, NY, OK and TX are in no group and constrain nothing.
 * T-090 also caps a group: it never supplies all three wrong answers
 * (`breaksClimateCap`).
 */
export const SAME_CLIMATE_GROUPS: Readonly<Record<string, readonly string[]>> = {
  "Great Plains": ["IA", "NE", "KS", "SD", "ND"],
  "Northern Rockies": ["MT", "WY", "ID"],
  "Interior Southwest": ["AZ", "NM", "UT", "NV"],
  "Pacific Northwest": ["OR", "WA"],
  "Southern New England": ["CT", "MA", "RI"],
  "Northern New England": ["NH", "VT", "ME"],
  "Mid-Atlantic": ["NJ", "PA", "MD", "DE"],
  "Great Lakes / Upper Midwest": ["OH", "IN", "IL", "MI", "WI", "MN"],
  "Deep South": ["AL", "GA", "MS", "SC", "LA"],
  "Upland South": ["TN", "AR", "KY", "NC", "VA", "WV"],
};

/**
 * T-090, from E-26 section D: the states whose `climate_kid` phrases a child
 * spots at once as far away (Hawaii's island, Alaska's far north), by postal
 * code. A climate question offers at most one wrong answer from this list.
 * Not a distance rule: the list is these two states and nothing else.
 */
export const CLIMATE_FAR_PHRASE_STATES: readonly string[] = ["HI", "AK"];

/**
 * Criteria 31 and 34 (brief call C5): the same thing, or too close for a
 * child to tell apart. Never both in one question, crops or farm animals.
 */
export const AGRICULTURE_SAME_THING_PAIRS: readonly (readonly [string, string])[] = [
  ["cattle", "dairy cows"],
  ["corn", "sweet corn"],
  ["hay", "alfalfa hay"],
  ["potatoes", "sweet potatoes"],
];

/** `us-state-wa` → `WA`. Anything else has no postal code and matches no list. */
function postalCodeOf(entity: Entity): string | null {
  const match = /^us-state-([a-z]{2})$/.exec(entity.id);
  return match ? (match[1] as string).toUpperCase() : null;
}

function climateGroupOf(entity: Entity): string | null {
  const code = postalCodeOf(entity);
  if (code === null) return null;
  for (const [group, codes] of Object.entries(SAME_CLIMATE_GROUPS)) {
    if (codes.includes(code)) return group;
  }
  return null;
}

function pairsFor(strategy: DistractorStrategy): readonly (readonly [string, string])[] {
  switch (strategy) {
    case "state_animals_neighbours_first":
      return SAME_ANIMAL_PAIRS;
    case "landmarks_neighbours_first":
      return SAME_LANDMARK_PAIRS;
    case "crops_not_grown_nearby":
    case "livestock_not_raised":
      return AGRICULTURE_SAME_THING_PAIRS;
    default:
      return [];
  }
}

/** True when `a` and `b` are the two members of one pair, either way round. */
function isPair(pairs: readonly (readonly [string, string])[], a: string, b: string): boolean {
  return pairs.some(
    ([x, y]) => (sameText(a, x) && sameText(b, y)) || (sameText(a, y) && sameText(b, x)),
  );
}

function textsOfField(entity: Entity, field: string): string[] {
  const value = readField(entity, field);
  if (Array.isArray(value)) return value.filter(nonBlankString);
  return nonBlankString(value) ? [value] : [];
}

/**
 * A predicate that is true for a candidate (entity and text) the strategy
 * never offers as a wrong answer to `own`'s question.
 */
function exclusionFor(
  strategy: DistractorStrategy,
  own: Entity,
  entities: readonly Entity[],
): (other: Entity, text: string) => boolean {
  switch (strategy) {
    case "landmarks_neighbours_first": {
      const code = postalCodeOf(own);
      const traps =
        code !== null && Object.hasOwn(LANDMARK_TRAPS, code) ? LANDMARK_TRAPS[code] : [];
      return (_, text) => (traps ?? []).some((trap) => sameText(trap, text));
    }
    case "climates_outside_group": {
      const group = climateGroupOf(own);
      return (other) => group !== null && climateGroupOf(other) === group;
    }
    case "crops_not_grown_nearby": {
      // Grown by the state itself, a state it borders, or a state in its
      // region (criteria 26–28).
      const borders: unknown = own.borders;
      const region = own.region;
      const nearby = entities.filter(
        (e) =>
          e.id === own.id ||
          (Array.isArray(borders) && borders.includes(e.id)) ||
          (nonBlankString(region) && e.region === region),
      );
      const grown = nearby.flatMap((e) => textsOfField(e, "top_crops"));
      return (_, text) => grown.some((crop) => sameText(crop, text));
    }
    case "livestock_not_raised": {
      const raised = textsOfField(own, "top_livestock");
      return (_, text) => raised.some((animal) => sameText(animal, text));
    }
    default:
      return () => false;
  }
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
    case "neighbours_first":
    case "state_animals_neighbours_first":
    case "landmarks_neighbours_first": {
      const borders: unknown = own.borders;
      if (Array.isArray(borders) && borders.includes(other.id)) return 0;
      return sameRegion ? 1 : 2;
    }
    // One tier: the exclusions do the work. Nearest first, except climate,
    // which is farthest first (`farthestFirst`).
    case "climates_outside_group":
    case "crops_not_grown_nearby":
    case "livestock_not_raised":
      return 0;
    // Never sorted: `nextRankedByArea` picks by rank alone.
    case "next_ranked_by_area":
      return 0;
  }
}

function usableRank(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * Plan §1.8, T-026 criteria 8–9: the entities ranked `area_rank` + 1, + 2 and
 * + 3 among same-type, same-scope entities, in that order. `found` counts how
 * many of the three exist with exactly one entity at the rank and usable text.
 */
function nextRankedByArea(
  draft: QuestionDraft,
  own: Entity,
  template: Template,
  entities: readonly Entity[],
): Candidate[] | ShortPool {
  const rank = usableRank(own.area_rank);
  const picked: Candidate[] = [];
  if (rank !== null) {
    for (let step = 1; step <= DISTRACTOR_COUNT; step++) {
      const atRank = entities.filter(
        (e) =>
          e.id !== own.id &&
          e.type === own.type &&
          e.scope === own.scope &&
          usableRank(e.area_rank) === rank + step,
      );
      const only = atRank.length === 1 ? atRank[0] : undefined;
      const text = only === undefined ? undefined : choiceTextsOf(only, template)[0];
      if (only === undefined || text === undefined) break;
      if (sameText(text, draft.answer) || picked.some((p) => sameText(p.text, text))) break;
      picked.push({ entity: only, text, distance: 0 });
    }
  }
  if (picked.length < DISTRACTOR_COUNT) {
    return { draftId: draft.id, found: picked.length, reason: "too_few_candidates" };
  }
  return picked;
}

/**
 * Climate only, a worker's call in T-026 (Handoff): neighbouring states
 * outside one same-climate group still read alike ("hot humid summers and mild
 * winters…"), so the climate distractors come farthest first. Walking that
 * order, two caps from T-090 skip a candidate (`breaksClimateCap`); they are
 * never relaxed, so a pool they leave short is reported as short.
 */
function farthestFirst(strategy: DistractorStrategy): boolean {
  return strategy === "climates_outside_group";
}

function isFarPhraseState(entity: Entity): boolean {
  const code = postalCodeOf(entity);
  return code !== null && CLIMATE_FAR_PHRASE_STATES.includes(code);
}

/**
 * Climate only, T-090 (E-25, E-27): true when taking `candidate` after
 * `picked` would give the question two wrong answers from
 * `CLIMATE_FAR_PHRASE_STATES`, or all three wrong answers from one
 * `SAME_CLIMATE_GROUPS` group. Two from one group is still allowed.
 */
function breaksClimateCap(picked: readonly Candidate[], candidate: Candidate): boolean {
  if (isFarPhraseState(candidate.entity) && picked.some((p) => isFarPhraseState(p.entity))) {
    return true;
  }
  const group = climateGroupOf(candidate.entity);
  if (group === null) return false;
  const sameGroup = picked.filter((p) => climateGroupOf(p.entity) === group).length;
  return sameGroup + 1 >= DISTRACTOR_COUNT;
}

function byTierThenNearest(
  strategy: DistractorStrategy,
  own: Entity,
): (a: Candidate, b: Candidate) => number {
  return (a, b) => {
    const tier = tierOf(strategy, own, a.entity) - tierOf(strategy, own, b.entity);
    if (tier !== 0) return tier;
    if (a.distance !== b.distance) {
      return farthestFirst(strategy) ? b.distance - a.distance : a.distance - b.distance;
    }
    return a.entity.id < b.entity.id ? -1 : a.entity.id > b.entity.id ? 1 : 0;
  };
}

/**
 * Up to three distractors, tiered and nearest-first, skipping any candidate
 * whose text matches the answer or an earlier pick, that the strategy
 * excludes, or that forms a same-thing pair with the answer or a pick.
 * Climate also skips a candidate that would break a T-090 cap.
 */
function nearestDistractors(
  draft: QuestionDraft,
  own: Entity,
  template: Template,
  entities: readonly Entity[],
): Candidate[] | ShortPool {
  const origin = centroidOf(own);
  if (origin === null) return { draftId: draft.id, found: 0, reason: "no_centroid" };

  const strategy = template.distractor_strategy;
  const isClick = draft.format === "map_click";
  const candidates: Candidate[] = [];
  for (const other of entities) {
    if (other.id === own.id || other.type !== own.type || other.scope !== own.scope) continue;
    const texts = choiceTextsOf(other, template);
    if (texts.length === 0) continue;
    const at = centroidOf(other);
    if (at === null) continue;
    if (isClick && !nonBlankString(other.geometry_id)) continue;
    const distance = greatCircleKm(origin, at);
    for (const text of texts) candidates.push({ entity: other, text, distance });
  }
  // Stable: an entity's own texts keep their listed order at equal distance.
  candidates.sort(byTierThenNearest(strategy, own));

  const excluded = exclusionFor(strategy, own, entities);
  const pairs = pairsFor(strategy);
  const picked: Candidate[] = [];
  for (const candidate of candidates) {
    if (picked.length === DISTRACTOR_COUNT) break;
    if (sameText(candidate.text, draft.answer)) continue;
    if (picked.some((p) => sameText(p.text, candidate.text))) continue;
    if (excluded(candidate.entity, candidate.text)) continue;
    if (isPair(pairs, candidate.text, draft.answer)) continue;
    if (picked.some((p) => isPair(pairs, p.text, candidate.text))) continue;
    if (strategy === "climates_outside_group" && breaksClimateCap(picked, candidate)) continue;
    picked.push(candidate);
  }
  if (picked.length < DISTRACTOR_COUNT) {
    return { draftId: draft.id, found: picked.length, reason: "too_few_candidates" };
  }
  return picked;
}

/** The three distractors for a draft, or why there are not three. */
function distractorsFor(
  draft: QuestionDraft,
  own: Entity,
  template: Template,
  entities: readonly Entity[],
): Candidate[] | ShortPool {
  // Every strategy reports an own entity with no usable centroid, as E-21
  // says, even `next_ranked_by_area`, which orders by rank alone.
  if (centroidOf(own) === null) return { draftId: draft.id, found: 0, reason: "no_centroid" };
  return template.distractor_strategy === "next_ranked_by_area"
    ? nextRankedByArea(draft, own, template, entities)
    : nearestDistractors(draft, own, template, entities);
}

/**
 * `map_click` only (T-092): the `geometry_id`s of the three peers a
 * `map_click` draft would offer if it offered candidates, nearest first, or
 * the `ShortPool` that keeps it from being a question. Never written to a
 * question: `buildChoices` uses it to decide whether the draft is a question,
 * `seedLevels` to count its near distractors (E-22, E-29).
 */
export function clickDistractorsFor(
  draft: QuestionDraft,
  own: Entity,
  template: Template,
  entities: readonly Entity[],
): string[] | ShortPool {
  const found = distractorsFor(draft, own, template, entities);
  if (!Array.isArray(found)) return found;
  return found.map((p) => p.entity.geometry_id as string);
}

function questionFor(
  draft: QuestionDraft,
  own: Entity,
  template: Template,
  entities: readonly Entity[],
): GeneratedQuestion | ShortPool {
  const found = distractorsFor(draft, own, template, entities);
  if (!Array.isArray(found)) return found;
  // No candidates on a map_click question (E-29): the draft is the question.
  if (draft.format === "map_click") return { ...draft };

  const correctIndex = correctIndexFor(draft.id);
  const choices = found.map((p) => p.text);
  choices.splice(correctIndex, 0, draft.answer);
  return { ...draft, choices, correctIndex };
}

/**
 * One question per draft, in draft order, each with four `choices` and a
 * `correctIndex`, except a `map_click` question, which has neither (E-29). A
 * draft whose pool cannot supply three distractors with distinct text, or
 * whose own entity has no usable `centroid`, is reported in `shortPools`
 * instead — `map_click` included, though its distractors are never written.
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
    if ("reason" in out) shortPools.push(out);
    else questions.push(out);
  }
  return { questions, shortPools };
}
