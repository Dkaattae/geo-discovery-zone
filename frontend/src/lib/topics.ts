import type { Entity, Question, SessionTopic } from "@/lib/api";

/**
 * The Setup screen's topic options, in order (T-026 criteria 43–45): every
 * topic the server has questions for, then `mixed`. `size`, `physical` and
 * `elevation` have none and are not offered. The labels are child-facing and
 * a person reviews them on the PR.
 */
export const SETUP_TOPICS: readonly { id: SessionTopic; label: string }[] = [
  { id: "location", label: "Places on the map" },
  { id: "capital", label: "Capital cities" },
  { id: "superlative", label: "Biggest states" },
  { id: "wildlife", label: "State animals" },
  { id: "landmark", label: "Famous sights" },
  { id: "climate", label: "Weather and climate" },
  { id: "agriculture", label: "Farms and crops" },
  { id: "mixed", label: "A bit of everything" },
];

/** What a `multiple_choice` question shows above its choices. */
export type ChoicePanel =
  | { kind: "none" }
  /** The question's state: its outline and its name, as the capital card does. */
  | { kind: "entity"; geometryId: string | undefined; name: string }
  /** The whole US map with the answer's state lit, after a superlative. */
  | { kind: "answer_map"; geometryId: string };

/**
 * T-026 criteria 40–42. A superlative question's entity is its answer, so
 * before the child picks nothing names or outlines it; once answered, the
 * answer's state is lit on a US map. Every other `multiple_choice` question
 * shows its state, revealed or not.
 *
 * `highlight` is the reveal's `mapHighlightGeometryId` (or the entity's code)
 * once answered, and is ignored before.
 */
export function choicePanel(
  question: Pick<Question, "format" | "topic">,
  entity: Pick<Entity, "name" | "geometryId"> | null | undefined,
  revealing: boolean,
  highlight: string | undefined,
): ChoicePanel {
  if (question.format !== "multiple_choice") return { kind: "none" };
  if (question.topic === "superlative") {
    return revealing && highlight
      ? { kind: "answer_map", geometryId: highlight }
      : { kind: "none" };
  }
  if (!entity) return { kind: "none" };
  return { kind: "entity", geometryId: entity.geometryId, name: entity.name };
}
