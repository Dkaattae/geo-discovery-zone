import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Geography } from "react-simple-maps";
import statesTopo from "us-atlas/states-10m.json";

import type { Profile, ServedQuestion, Session as SessionState } from "@/lib/api";
import {
  TAPPABLE_STATE_LABEL,
  createAnswerGate,
  mapClickView,
  pad,
  stateProps,
  type MapView,
} from "@/lib/map-click";

import { Session } from "./Session";

/**
 * T-051 worker tests: a `map_click` question is answered by tapping the map
 * (engineering-decisions.md E-29).
 *
 * The map draws its paths after mount, so `renderToStaticMarkup` sees an empty
 * map. The per-state behaviour is therefore checked through `stateProps`, the
 * pure function `UsMap` spreads onto every path, over every id in the bundled
 * us-atlas file, and through one `<Geography>` rendered with those props to
 * show what reaches the markup. No DOM library, no network.
 */

type Geometry = { id: string; properties: { name: string } };
const GEOMETRIES = (statesTopo as unknown as { objects: { states: { geometries: Geometry[] } } })
  .objects.states.geometries;
const IDS = GEOMETRIES.map((g) => pad(g.id));
const NAMES = GEOMETRIES.map((g) => g.properties.name);

const NO_MASTERY: ReadonlySet<string> = new Set();

function presenting(onTap: (id: string) => void): MapView {
  return { mastered: NO_MASTERY, onTap };
}

/** Everything about a state's drawing except the handlers and its own id. */
function looks(fips: string, view: MapView) {
  const { onClick, onKeyDown, "data-geometry-id": ownId, ...rest } = stateProps(fips, view);
  expect(typeof onClick).toBe(typeof onKeyDown);
  if (ownId !== undefined) expect(ownId).toBe(pad(fips));
  return JSON.stringify(rest);
}

function pathMarkup(fips: string, view: MapView): string {
  return renderToStaticMarkup(
    <svg>
      <Geography geography={{ svgPath: "M0 0L1 1Z" }} {...stateProps(fips, view)} />
    </svg>,
  );
}

describe("before an answer, every state looks the same and is a button", () => {
  test("the bundled atlas still holds the four small or inset states the brief names", () => {
    for (const id of ["02", "15", "44", "10"]) expect(IDS).toContain(id);
  });

  test("every state is drawn alike, apart from its own geometry id", () => {
    const view = presenting(() => {});
    const first = looks(IDS[0]!, view);
    for (const id of IDS) expect(looks(id, view)).toBe(first);
  });

  test("every state is a focusable button with the same name, never its own", () => {
    const view = presenting(() => {});
    for (const id of IDS) {
      const props = stateProps(id, view);
      expect(props.role).toBe("button");
      expect(props.tabIndex).toBe(0);
      expect(props["aria-label"]).toBe(TAPPABLE_STATE_LABEL);
    }
    for (const name of NAMES) expect(TAPPABLE_STATE_LABEL).not.toContain(name);
  });

  test("the rendered path carries the role and tab stop, and no title or name", () => {
    const html = pathMarkup(
      "44",
      presenting(() => {}),
    );
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('data-geometry-id="44"');
    expect(html).not.toContain("<title");
    expect(html).not.toContain("Rhode Island");
  });
});

describe("a tap answers with the state's two-digit geometry id", () => {
  test("a tap on any state reports that state's id, once", () => {
    for (const id of IDS) {
      const onTap = mock((_: string) => {});
      stateProps(String(Number(id)), presenting(onTap)).onClick!();
      expect(onTap).toHaveBeenCalledTimes(1);
      expect(onTap).toHaveBeenCalledWith(id);
    }
  });

  test("Enter and Space tap; other keys do not", () => {
    const onTap = mock((_: string) => {});
    const props = stateProps("10", presenting(onTap));
    for (const key of ["Enter", " ", "Tab", "a"]) {
      props.onKeyDown!({ key, preventDefault: () => {} });
    }
    expect(onTap.mock.calls).toEqual([["10"], ["10"]]);
  });

  test("the gate lets one answer through until it is released", () => {
    const gate = createAnswerGate();
    expect(gate.tryHold()).toBe(true);
    expect(gate.tryHold()).toBe(false);
    gate.release();
    expect(gate.tryHold()).toBe(true);
  });
});

describe("the reveal", () => {
  const wrong = {
    correct: false,
    reveal: { tone: "reason" as const, headline: "x", mapHighlightGeometryId: "08" },
  };
  const right = {
    correct: true,
    reveal: { tone: "reward" as const, headline: "x", mapHighlightGeometryId: "08" },
  };

  test("a wrong tap lights the answer and draws the tapped state apart from it and the rest", () => {
    const shown = mapClickView(wrong, "49", { geometryId: "08" });
    expect(shown).toEqual({ correctFips: "08", tappedFips: "49", tappable: false });
    const view: MapView = { correct: "08", tapped: "49", mastered: NO_MASTERY };
    expect(stateProps("08", view).fill).toBe("var(--map-correct)");
    const tapped = looks("49", view);
    expect(tapped).not.toBe(looks("08", view));
    for (const id of IDS.filter((id) => id !== "49")) expect(looks(id, view)).not.toBe(tapped);
  });

  test("a right tap lights the answer only", () => {
    expect(mapClickView(right, "08", null)).toEqual({
      correctFips: "08",
      tappedFips: undefined,
      tappable: false,
    });
  });

  test("while the reveal is up no state is a button or a tab stop", () => {
    for (const id of IDS) {
      const props = stateProps(id, { correct: "08", tapped: "49", mastered: NO_MASTERY });
      expect(props.role).toBeUndefined();
      expect(props.tabIndex).toBe(-1);
      expect(props.onClick).toBeUndefined();
    }
  });

  test("undo brings the question back to every state alike and tappable", () => {
    expect(mapClickView(null, "49", { geometryId: "08" })).toEqual({ tappable: true });
  });
});

describe("other maps are not controls", () => {
  test("a map_identify map has no button and no tab stop", () => {
    const view: MapView = { highlight: "44", mastered: NO_MASTERY };
    for (const id of IDS) {
      expect(stateProps(id, view).role).toBeUndefined();
      expect(stateProps(id, view).tabIndex).toBe(-1);
    }
    expect(pathMarkup("44", view)).toContain('tabindex="-1"');
    expect(pathMarkup("44", view)).not.toContain("role=");
  });
});

const PROFILE: Profile = {
  id: "p-1",
  name: "Robin",
  avatar: "🦉",
  level: 6,
  bestSustainedLevel: 6,
  lastSessionEndLevel: 6,
  stats: { answered: 0, correct: 0 },
  mastery: {},
  reviewQueue: [],
};

const SESSION: SessionState = {
  id: "s-1",
  profileId: "p-1",
  topic: "location",
  level: 6,
  state: "active",
  startedAt: "2026-10-26T00:00:00Z",
  counts: { answered: 0, correct: 0, wrong: 0, correctStreak: 0, wrongStreak: 0 },
};

function renderSession(firstQuestion: ServedQuestion): string {
  return renderToStaticMarkup(
    <Session
      profile={PROFILE}
      session={SESSION}
      firstQuestion={firstQuestion}
      onFinished={() => {}}
      onPlayAgain={() => {}}
      onHome={() => {}}
    />,
  );
}

describe("the session screen", () => {
  test("a map_click question renders its prompt and a map, and no answer buttons or names", () => {
    const html = renderSession({
      question: {
        id: "gen:tpl-click-the-map:us-state-co",
        entityId: "us-state-co",
        format: "map_click",
        prompt: "Find Colorado on the map.",
        level: 6,
        topic: "location",
        reveal: "map_highlight",
      },
      entity: { id: "us-state-co", type: "state", name: "Colorado", geometryId: "08" },
      isReview: false,
      index: 0,
    });
    expect(html).toContain("Find Colorado on the map.");
    expect(html).toContain("rsm-svg");
    expect(html).not.toContain('data-variant="choice"');
    const outsidePrompt = html.replace("Find Colorado on the map.", "");
    for (const name of NAMES) expect(outsidePrompt).not.toContain(name);
  });

  test("a map_identify question still renders four answer buttons", () => {
    const html = renderSession({
      question: {
        id: "q",
        entityId: "us-state-co",
        format: "map_identify",
        prompt: "Which state is highlighted?",
        level: 6,
        choices: ["Colorado", "Utah", "Kansas", "Wyoming"],
        highlightGeometryId: "08",
      },
      isReview: false,
      index: 0,
    });
    expect(html.match(/data-variant="choice"/g)).toHaveLength(4);
  });
});
