/**
 * `map_click` (T-051, engineering-decisions.md E-29): the question offers no
 * candidates, every state on the map is a button, and the tap is the answer.
 *
 * The pieces here are pure so they can be checked without a browser. The map
 * draws its paths only after mount, so static markup has none to read, and the
 * frontend has no DOM test library (CLAUDE.md, "Packages").
 */
import type { CSSProperties, KeyboardEvent } from "react";

import type { AnswerResult, Entity } from "@/lib/api";

/** us-atlas ids are numbers in places; every join is on the two-digit string. */
export function pad(id: string | number) {
  return String(id).padStart(2, "0");
}

/**
 * The one accessible name every tappable state shares. It must not be the
 * state's name: on a `map_click` question that name is the answer.
 */
export const TAPPABLE_STATE_LABEL = "A state you can tap";

/** What the whole map shows, already padded. */
export interface MapView {
  highlight?: string | undefined;
  correct?: string | undefined;
  tapped?: string | undefined;
  mastered: ReadonlySet<string>;
  onTap?: ((geometryId: string) => void) | undefined;
}

export interface StateProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string | undefined;
  /** Always set: react-simple-maps puts every path in the tab order otherwise. */
  tabIndex: number;
  role?: "button" | undefined;
  "aria-label"?: string | undefined;
  "data-geometry-id"?: string | undefined;
  onClick?: (() => void) | undefined;
  onKeyDown?: ((event: Pick<KeyboardEvent, "key" | "preventDefault">) => void) | undefined;
  style: { default: CSSProperties; hover: CSSProperties; pressed: CSSProperties };
}

const TAP_HOVER_FILL = "color-mix(in oklab, var(--map-highlight) 45%, var(--map-land))";

/**
 * How one state is drawn and what it does. Pure, so every state can be checked
 * without a browser: the map renders its paths only after mount.
 *
 * While taps are open nothing but the geometry id differs between states, so the
 * answer cannot be picked out of the markup, the styling or the hover.
 */
export function stateProps(fips: string, view: MapView): StateProps {
  const id = pad(fips);
  const isCorrect = view.correct === id;
  const isTapped = !isCorrect && view.tapped === id;
  const isHighlight = view.highlight === id;
  const isMastered = view.mastered.has(id);
  const fill = isCorrect
    ? "var(--map-correct)"
    : isTapped || isHighlight
      ? "var(--map-highlight)"
      : isMastered
        ? "var(--map-mastered)"
        : "var(--map-land)";
  // The tapped state is told apart from the answer by its outline as well as
  // its colour: a dashed, darker edge.
  const stroke = isTapped ? "var(--foreground)" : "var(--map-stroke)";
  const strokeWidth = isTapped ? 1.6 : 0.6;
  const strokeDasharray = isTapped ? "3 2" : undefined;

  const onTap = view.onTap;
  if (!onTap) {
    return {
      fill,
      stroke,
      strokeWidth,
      strokeDasharray,
      tabIndex: -1,
      style: {
        default: { outline: "none", transition: "fill 320ms ease" },
        hover: { outline: "none", fill },
        pressed: { outline: "none", fill },
      },
    };
  }

  const tap = () => onTap(id);
  // Focus uses react-simple-maps' hover style, so a keyboard user sees where
  // they are the same way a mouse user does.
  const lit: CSSProperties = {
    outline: "none",
    cursor: "pointer",
    fill: TAP_HOVER_FILL,
    stroke: "var(--foreground)",
    strokeWidth: 1.4,
  };
  return {
    fill,
    stroke,
    strokeWidth,
    strokeDasharray,
    tabIndex: 0,
    role: "button",
    "aria-label": TAPPABLE_STATE_LABEL,
    "data-geometry-id": id,
    onClick: tap,
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        tap();
      }
    },
    style: {
      default: { outline: "none", cursor: "pointer", transition: "fill 320ms ease" },
      hover: lit,
      pressed: lit,
    },
  };
}

/** What one answer sends: an index for a choice format, a tap for `map_click`. */
export type AnswerInput = { choiceIndex: number } | { tappedGeometryId: string };

/**
 * Lets one answer through per question. Held from the moment an answer is sent
 * until the question is undone, re-served or the send fails, so a second tap
 * while the first is in flight, or while its reveal is up, sends nothing. A ref
 * rather than state: two taps can land before React re-renders.
 */
export function createAnswerGate() {
  let held = false;
  return {
    tryHold(): boolean {
      if (held) return false;
      held = true;
      return true;
    },
    release(): void {
      held = false;
    },
  };
}

/**
 * The map on a `map_click` question. Before an answer, every state is drawn
 * alike and every state is a button; after one, the answer's state is lit and,
 * on a wrong answer, the tapped state is drawn apart from it.
 */
export function mapClickView(
  result: Pick<AnswerResult, "correct" | "reveal"> | null,
  tappedGeometryId: string | null,
  entity: Pick<Entity, "geometryId"> | null | undefined,
): { correctFips?: string | undefined; tappedFips?: string | undefined; tappable: boolean } {
  if (!result) return { tappable: true };
  return {
    correctFips: result.reveal.mapHighlightGeometryId ?? entity?.geometryId,
    tappedFips: result.correct ? undefined : (tappedGeometryId ?? undefined),
    tappable: false,
  };
}
