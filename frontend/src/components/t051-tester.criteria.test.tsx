import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import * as realMaps from "react-simple-maps";
import statesTopo from "us-atlas/states-10m.json";

import * as realApi from "@/lib/api";
import * as realButton from "@/components/Button";
import type { AnswerResult, Profile, ServedQuestion, Session as SessionState } from "@/lib/api";

/**
 * T-051 tester criteria 22 to 34, written from the brief by the tester.
 *
 * No DOM library is installed (brief, Constraints), so this renders to static
 * markup. Two obstacles, and how they are got round:
 *
 * - **react-simple-maps draws its paths in an effect**, so static markup has an
 *   empty map. `Geographies` is replaced by one that hands `UsMap` every
 *   geometry in the bundled us-atlas file at once (same features, a fixed path
 *   string, so only what `UsMap` adds can differ). It also keeps the elements
 *   `UsMap` returns, so their handlers can be called. The real `Geography`
 *   renders each one, so the markup is what the browser would get.
 * - **Clicks cannot be dispatched.** The `Geography` elements' and `Button`s'
 *   own `onClick` / `onKeyDown` props are called directly. `api` is replaced by
 *   a recorder, so an answer is observed as the call the client would make, and
 *   nothing reaches the network. `fetch` is not touched.
 *
 * What static markup cannot show (the reveal banner, Next's timer, undo) is in
 * `e2e/tests/map-click.spec.ts`.
 */

type Feature = {
  type: "Feature";
  id: string;
  properties: { name: string };
  rsmKey: string;
  svgPath: string;
};
const GEOMETRIES = (
  statesTopo as unknown as {
    objects: { states: { geometries: { id: string; properties: { name: string } }[] } };
  }
).objects.states.geometries;
const FEATURES: Feature[] = GEOMETRIES.map((g, i) => ({
  type: "Feature",
  id: g.id,
  properties: g.properties,
  rsmKey: `geo-${i}`,
  svgPath: "M0,0L10,10Z",
}));
const IDS = GEOMETRIES.map((g) => String(g.id).padStart(2, "0"));
const NAMES = GEOMETRIES.map((g) => g.properties.name);

type DrawnProps = {
  geography: Feature;
  style?: unknown;
  onClick?: (() => void) | undefined;
  onKeyDown?: ((event: { key: string; preventDefault: () => void }) => void) | undefined;
};
let drawn: ReactElement<DrawnProps>[] = [];

mock.module("react-simple-maps", () => ({
  ...realMaps,
  Geographies: ({
    children,
  }: {
    children: (args: { geographies: Feature[] }) => ReactElement<DrawnProps>[];
  }) => {
    const elements = children({ geographies: FEATURES });
    drawn = elements;
    return <g className="rsm-geographies">{elements}</g>;
  },
}));

type Call = { method: string; args: unknown[] };
let calls: Call[] = [];
const fakeApi = new Proxy(
  {},
  {
    get:
      (_target, method: string) =>
      (...args: unknown[]) => {
        calls.push({ method, args });
        // Never settles: a send that is still in flight.
        return new Promise(() => {});
      },
  },
);
mock.module("@/lib/api", () => ({ ...realApi, api: fakeApi }));

type ButtonProps = { variant?: string; onClick?: () => void };
let buttons: ButtonProps[] = [];
const RealButton = realButton.Button;
mock.module("@/components/Button", () => ({
  ...realButton,
  Button: (props: Parameters<typeof RealButton>[0]) => {
    buttons.push(props as unknown as ButtonProps);
    return <RealButton {...props} />;
  },
}));

const { UsMap } = await import("./UsMap");
const { Session } = await import("./Session");
const mapClick = await import("@/lib/map-click");

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

/** Alaska as served: the entity carries the answer, as Out of scope says. */
const ALASKA: ServedQuestion = {
  question: {
    id: "gen:tpl-click-the-map:us-state-ak",
    entityId: "us-state-ak",
    format: "map_click",
    prompt: "Find Alaska on the map.",
    level: 7,
    topic: "location",
    answerGeometryId: "02",
    reveal: "map_highlight",
  },
  entity: { id: "us-state-ak", type: "state", name: "Alaska", geometryId: "02" },
  isReview: false,
  index: 0,
};

const IDENTIFY: ServedQuestion = {
  question: {
    id: "gen:tpl-identify-on-map:us-state-co",
    entityId: "us-state-co",
    format: "map_identify",
    prompt: "Which state is highlighted?",
    level: 6,
    topic: "location",
    choices: ["Colorado", "Utah", "Kansas", "Wyoming"],
    highlightGeometryId: "08",
    reveal: "map_highlight",
  },
  entity: { id: "us-state-co", type: "state", name: "Colorado", geometryId: "08" },
  isReview: false,
  index: 0,
};

const CAPITAL: ServedQuestion = {
  question: {
    id: "gen:tpl-capital-of:us-state-co",
    entityId: "us-state-co",
    format: "multiple_choice",
    prompt: "What is the capital of Colorado?",
    level: 6,
    topic: "capital",
    choices: ["Denver", "Boulder", "Pueblo", "Aurora"],
  },
  entity: { id: "us-state-co", type: "state", name: "Colorado", geometryId: "08" },
  isReview: false,
  index: 0,
};

function renderSession(served: ServedQuestion): string {
  drawn = [];
  calls = [];
  buttons = [];
  return renderToStaticMarkup(
    <Session
      profile={PROFILE}
      session={SESSION}
      firstQuestion={served}
      onFinished={() => {}}
      onPlayAgain={() => {}}
      onHome={() => {}}
    />,
  );
}

/** Each `<path …>` tag, as a map of its attributes. */
function paths(html: string): Map<string, string>[] {
  return [...html.matchAll(/<path\b([^>]*)\/?>/g)].map((match) => {
    const attrs = new Map<string, string>();
    for (const attr of match[1]!.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs.set(attr[1]!, attr[2]!);
    return attrs;
  });
}

function geometryIdOf(path: Map<string, string>): string | undefined {
  return path.get("data-geometry-id");
}

const key = (k: string) => ({ key: k, preventDefault: () => {} });
const answers = () => calls.filter((call) => call.method === "submitAnswer");

const RESULT_BASE = {
  answerId: "a-1",
  session: SESSION,
} as const;

function wrongResult(): AnswerResult {
  return {
    ...RESULT_BASE,
    correct: false,
    correctAnswer: "Alaska",
    reveal: { tone: "reason", headline: "It is up north.", mapHighlightGeometryId: "02" },
  };
}

function rightResult(): AnswerResult {
  return {
    ...RESULT_BASE,
    correct: true,
    correctAnswer: "Alaska",
    reveal: { tone: "reward", headline: "Big!", mapHighlightGeometryId: "02" },
  };
}

// -- 22 ----------------------------------------------------------------------

describe("criterion 22: a map_click question renders its prompt and a map, no answer buttons", () => {
  test("the prompt and a drawn US map are in the markup", () => {
    const html = renderSession(ALASKA);
    expect(html).toContain("Find Alaska on the map.");
    expect(paths(html).length).toBeGreaterThanOrEqual(51);
  });

  test("no element has data-variant=choice", () => {
    expect(renderSession(ALASKA)).not.toContain('data-variant="choice"');
  });
});

// -- 23 ----------------------------------------------------------------------

describe("criterion 23: no state's name appears before commit, except in the prompt", () => {
  test("no state name is in the markup outside the prompt", () => {
    const html = renderSession(ALASKA);
    const outside = html.split("Find Alaska on the map.").join("");
    for (const name of NAMES) expect(outside).not.toContain(name);
  });

  test("the answer's name is in no aria-label, title or alt", () => {
    const html = renderSession(ALASKA);
    const labelled = [...html.matchAll(/(?:aria-label|title|alt)="([^"]*)"/g)].map((m) => m[1]!);
    for (const value of labelled) {
      for (const name of NAMES) expect(value).not.toContain(name);
    }
    expect(html).not.toContain("<title");
  });

  test("a prompt naming a different state does not leak the entity's name", () => {
    // Guards the entity, not the prompt: the served entity is the answer.
    const html = renderSession({
      ...ALASKA,
      question: { ...ALASKA.question, prompt: "Find the biggest state on the map." },
    });
    expect(html).not.toContain("Alaska");
  });
});

// -- 24 ----------------------------------------------------------------------

describe("criterion 24: before commit every state is drawn alike", () => {
  test("every path's attributes match, apart from one equal to its own geometry id", () => {
    const html = renderSession(ALASKA);
    const drawnPaths = paths(html);
    const shapes = new Set(
      drawnPaths.map((path) => {
        const own = geometryIdOf(path);
        const rest = [...path].filter(([, value]) => value !== own);
        return JSON.stringify(rest.sort());
      }),
    );
    expect(shapes.size).toBe(1);
  });

  test("the answer's path (02) is indistinguishable from Hawaii's (15)", () => {
    const drawnPaths = paths(renderSession(ALASKA));
    const ak = drawnPaths.find((p) => geometryIdOf(p) === "02")!;
    const hi = drawnPaths.find((p) => geometryIdOf(p) === "15")!;
    expect(ak).toBeDefined();
    expect(hi).toBeDefined();
    ak.delete("data-geometry-id");
    hi.delete("data-geometry-id");
    expect([...ak]).toEqual([...hi]);
  });

  test("hover and pressed styles are the same for every state", () => {
    renderSession(ALASKA);
    const styles = new Set(drawn.map((el) => JSON.stringify(el.props.style)));
    expect(drawn.length).toBeGreaterThanOrEqual(51);
    expect(styles.size).toBe(1);
  });
});

// -- 25 ----------------------------------------------------------------------

describe("criterion 25: before commit every drawn state is a control in the tab order", () => {
  test('every path has role="button" and tabindex="0"', () => {
    const drawnPaths = paths(renderSession(ALASKA));
    expect(drawnPaths.length).toBeGreaterThanOrEqual(51);
    for (const path of drawnPaths) {
      expect(path.get("role")).toBe("button");
      expect(path.get("tabindex")).toBe("0");
    }
  });

  test("Enter and Space on a state tap it; another key does not", () => {
    const tapped: string[] = [];
    renderToStaticMarkup(<UsMap onTap={(id) => tapped.push(id)} />);
    const colorado = drawn.find((el) => String(el.props.geography.id) === "08")!;
    const onKeyDown = colorado.props.onKeyDown!;
    onKeyDown(key("a"));
    onKeyDown(key("Tab"));
    expect(tapped).toEqual([]);
    onKeyDown(key("Enter"));
    onKeyDown(key(" "));
    expect(tapped).toEqual(["08", "08"]);
  });
});

// -- 26 ----------------------------------------------------------------------

describe("criterion 26: a tap submits one answer with that state's two-digit geometry id", () => {
  test("every drawn state on a tap map reports its own padded id", () => {
    const tapped: string[] = [];
    renderToStaticMarkup(<UsMap onTap={(id) => tapped.push(id)} />);
    const ids: string[] = [];
    for (const el of drawn) {
      ids.push(String(el.props.geography.id).padStart(2, "0"));
      el.props.onClick!();
    }
    expect(tapped).toEqual(ids);
    for (const id of tapped) expect(id).toMatch(/^\d{2}$/);
  });

  test("an atlas id given as a number is still padded (Alabama, 1 -> 01)", () => {
    const tapped: string[] = [];
    const view: Parameters<typeof mapClick.stateProps>[1] = {
      mastered: new Set(),
      onTap: (id) => tapped.push(id),
    };
    mapClick.stateProps(String(1), view).onClick!();
    expect(tapped).toEqual(["01"]);
  });

  for (const [name, id] of [
    ["Alaska", "02"],
    ["Hawaii", "15"],
    ["Rhode Island", "44"],
    ["Delaware", "10"],
  ] as const) {
    test(`tapping ${name} in the session sends tappedGeometryId "${id}" once`, () => {
      renderSession(ALASKA);
      const state = drawn.find((el) => el.props.geography.properties.name === name)!;
      expect(state).toBeDefined();
      state.props.onClick!();
      expect(answers()).toEqual([
        {
          method: "submitAnswer",
          args: ["s-1", { questionId: ALASKA.question.id, tappedGeometryId: id }],
        },
      ]);
    });
  }

  test("the tap is matched by id: a state whose name is the answer's is not special", () => {
    renderSession(ALASKA);
    const texas = drawn.find((el) => el.props.geography.properties.name === "Texas")!;
    texas.props.onClick!();
    expect(answers()).toHaveLength(1);
    expect((answers()[0]!.args[1] as { tappedGeometryId: string }).tappedGeometryId).toBe("48");
  });
});

// -- 27 ----------------------------------------------------------------------

describe("criterion 27: while submitting, or while the reveal is up, a tap sends nothing", () => {
  test("a second tap while the first is in flight sends nothing", () => {
    renderSession(ALASKA);
    const [first, second] = [drawn[0]!, drawn[5]!];
    first.props.onClick!();
    second.props.onClick!();
    first.props.onKeyDown!(key("Enter"));
    expect(answers()).toHaveLength(1);
  });

  test("with a reveal up the map has no control: no role, no tab stop, no handler", () => {
    for (const result of [wrongResult(), rightResult()]) {
      const view = mapClick.mapClickView(result, "48", ALASKA.entity);
      expect(view.tappable).toBe(false);
      const html = renderToStaticMarkup(
        <UsMap correctFips={view.correctFips} tappedFips={view.tappedFips} />,
      );
      for (const path of paths(html)) {
        expect(path.has("role")).toBe(false);
        expect(path.get("tabindex")).not.toBe("0");
      }
      for (const el of drawn) {
        expect(el.props.onClick).toBeUndefined();
        expect(el.props.onKeyDown).toBeUndefined();
      }
    }
  });
});

// -- 28, 29, 30 --------------------------------------------------------------

function revealPaths(result: AnswerResult, tapped: string) {
  const view = mapClick.mapClickView(result, tapped, ALASKA.entity);
  return paths(
    renderToStaticMarkup(<UsMap correctFips={view.correctFips} tappedFips={view.tappedFips} />),
  ).map((path, i) => ({ id: IDS[i]!, path }));
}

/** What a map_identify reveal draws the answer with. */
function identifyRevealFill(): string {
  const html = renderToStaticMarkup(<UsMap correctFips="02" />);
  return paths(html)[IDS.indexOf("02")]!.get("fill")!;
}

describe("criteria 28 and 29: the answer's state takes the correct-answer colour", () => {
  test("map_identify's reveal colour is var(--map-correct)", () => {
    expect(identifyRevealFill()).toBe("var(--map-correct)");
  });

  test("after a right tap, the answer's state is var(--map-correct)", () => {
    const drawnPaths = revealPaths(rightResult(), "02");
    expect(drawnPaths.find((p) => p.id === "02")!.path.get("fill")).toBe(identifyRevealFill());
  });

  test("after a wrong tap, the answer's state is var(--map-correct)", () => {
    const drawnPaths = revealPaths(wrongResult(), "48");
    expect(drawnPaths.find((p) => p.id === "02")!.path.get("fill")).toBe("var(--map-correct)");
  });

  test("the lit state is the server's mapHighlightGeometryId, not the entity's", () => {
    const result = {
      ...wrongResult(),
      reveal: { ...wrongResult().reveal, mapHighlightGeometryId: "15" },
    };
    const drawnPaths = revealPaths(result, "48");
    expect(drawnPaths.find((p) => p.id === "15")!.path.get("fill")).toBe("var(--map-correct)");
    expect(drawnPaths.find((p) => p.id === "02")!.path.get("fill")).not.toBe("var(--map-correct)");
  });
});

describe("criterion 30: after a wrong tap, the tapped state is drawn apart", () => {
  test("Texas (tapped) differs from Alaska (answer) and from every untapped state", () => {
    const drawnPaths = revealPaths(wrongResult(), "48");
    const look = (p: Map<string, string>) =>
      JSON.stringify([...p].filter(([k]) => k !== "data-geometry-id").sort());
    const tapped = look(drawnPaths.find((p) => p.id === "48")!.path);
    const answer = look(drawnPaths.find((p) => p.id === "02")!.path);
    expect(tapped).not.toBe(answer);
    for (const { id, path } of drawnPaths) {
      if (id === "48") continue;
      expect(look(path)).not.toBe(tapped);
    }
  });
});

// -- 32 (the pure half; the browser half is e2e) ------------------------------

describe("criterion 32: with no result the map is back to every state alike and tappable", () => {
  test("mapClickView with no result marks nothing and is tappable", () => {
    const view = mapClick.mapClickView(null, null, ALASKA.entity);
    expect(view.tappable).toBe(true);
    expect(view.correctFips).toBeUndefined();
    expect(view.tappedFips).toBeUndefined();
  });

  test("the answer gate opens again after release", () => {
    const gate = mapClick.createAnswerGate();
    expect(gate.tryHold()).toBe(true);
    expect(gate.tryHold()).toBe(false);
    gate.release();
    expect(gate.tryHold()).toBe(true);
  });
});

// -- 33, 34 ------------------------------------------------------------------

describe("criterion 33: map_identify and multiple_choice are unchanged", () => {
  test("map_identify renders its highlighted state and four answer buttons, no state control", () => {
    const html = renderSession(IDENTIFY);
    expect(html.match(/data-variant="choice"/g)).toHaveLength(4);
    const drawnPaths = paths(html);
    const lit = drawnPaths
      .map((path, i) => ({ id: IDS[i], fill: path.get("fill") }))
      .filter((p) => p.fill === "var(--map-highlight)");
    expect(lit.map((p) => p.id)).toEqual(["08"]);
    for (const path of drawnPaths) {
      expect(path.has("role")).toBe(false);
      expect(path.get("tabindex")).not.toBe("0");
    }
  });

  test("multiple_choice renders its choice panel and four answer buttons, no state control", () => {
    const html = renderSession(CAPITAL);
    expect(html.match(/data-variant="choice"/g)).toHaveLength(4);
    expect(html).toContain("Colorado"); // the entity panel's name
    const drawnPaths = paths(html);
    expect(drawnPaths.length).toBeGreaterThanOrEqual(51); // the panel's small map
    for (const path of drawnPaths) {
      expect(path.has("role")).toBe(false);
      expect(path.get("tabindex")).not.toBe("0");
    }
  });
});

describe("criterion 34: choice answers send choiceIndex and no tappedGeometryId", () => {
  for (const served of [IDENTIFY, CAPITAL]) {
    test(`${served.question.format}: the third button sends choiceIndex 2 only`, () => {
      renderSession(served);
      const choice = buttons.filter((b) => b.variant === "choice");
      expect(choice).toHaveLength(4);
      choice[2]!.onClick!();
      expect(answers()).toEqual([
        {
          method: "submitAnswer",
          args: ["s-1", { questionId: served.question.id, choiceIndex: 2 }],
        },
      ]);
    });
  }
});
