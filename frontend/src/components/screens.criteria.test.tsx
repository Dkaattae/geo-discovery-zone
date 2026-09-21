import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { Profile, ProfileProgress } from "@/lib/api";
import { levelLabel } from "@/lib/level";

import { Setup } from "./screens";

/**
 * Criterion 3 of `tasks/T-057-level-window-docstring.md`: the Setup screen's
 * "How tricky?" options are exactly `progress.suggestedLevels` when that array
 * is non-empty, and exactly `[profile.lastSessionEndLevel]` when it is absent
 * or empty (`screens.tsx:383-385`). No window arithmetic may live under
 * `frontend/src` — the server computes the window, this component only
 * renders whatever list it was given.
 *
 * No jsdom or @testing-library/react is installed here, and adding one is a
 * new dependency (`CLAUDE.md` "Packages"), so this renders `Setup` to a static
 * HTML string with `react-dom/server` — already a dependency of every screen
 * in this file — and reads the option buttons back out of the markup rather
 * than querying a live DOM. Pure rendering, no seam, no network
 * (`test-guidelines.md`, "Start below the transport").
 */

const PROFILE: Profile = {
  id: "profile-1",
  name: "Robin",
  avatar: "🦉",
  level: 6,
  bestSustainedLevel: 6,
  lastSessionEndLevel: 6,
  stats: { answered: 0, correct: 0 },
  mastery: {},
  reviewQueue: [],
};

function progressWith(suggestedLevels: number[]): ProfileProgress {
  return {
    profileId: PROFILE.id,
    mastery: {},
    masteredEntityIds: [],
    masteredGeometryIds: [],
    entitiesSeen: 0,
    mapProgress: { filled: 0, total: 0 },
    suggestedLevels,
    reviewQueue: [],
  };
}

function renderSetup(profile: Profile, progress: ProfileProgress | undefined): string {
  return renderToStaticMarkup(
    <Setup
      profile={profile}
      progress={progress}
      onStart={() => {}}
      onBack={() => {}}
      pending={false}
    />,
  );
}

/**
 * The "How tricky?" buttons only — everything rendered after that heading's
 * text in the markup. The three topic buttons above it share the same
 * `data-variant="choice"` marker, so this must not count those too.
 */
function levelOptionLabels(html: string): string[] {
  const afterHeading = html.split("How tricky?")[1];
  if (afterHeading === undefined) {
    throw new Error('Setup\'s markup has no "How tricky?" heading to split on');
  }
  return [...afterHeading.matchAll(/data-variant="choice"[^>]*>([^<]*)</g)].map(
    (match) => match[1]!,
  );
}

describe("criterion 3 — the level picker options are exactly suggestedLevels, or the one-element fallback", () => {
  test("a non-empty suggestedLevels renders exactly those options, in the given order", () => {
    const suggested = [5, 6, 7, 8];
    const html = renderSetup(PROFILE, progressWith(suggested));
    expect(levelOptionLabels(html)).toEqual(suggested.map((level) => levelLabel(level)));
  });

  test("a three-choice suggestedLevels (the top-of-scale case) renders exactly three, not four", () => {
    // Three, because criterion 4 requires `level_window(18.0)` to offer three
    // or four choices — it used to collapse to two, and the name and the data
    // here used to disagree about that. The client still renders whatever list
    // it is handed; this case only pins that a shorter list is not padded out.
    const suggested = [16, 17, 18];
    const html = renderSetup(PROFILE, progressWith(suggested));
    expect(levelOptionLabels(html)).toEqual(suggested.map((level) => levelLabel(level)));
    expect(levelOptionLabels(html)).toHaveLength(3);
  });

  test("an empty suggestedLevels array falls back to the single lastSessionEndLevel", () => {
    const html = renderSetup(PROFILE, progressWith([]));
    expect(levelOptionLabels(html)).toEqual([levelLabel(PROFILE.lastSessionEndLevel)]);
  });

  test("progress being undefined (not yet loaded) falls back the same way", () => {
    const html = renderSetup(PROFILE, undefined);
    expect(levelOptionLabels(html)).toEqual([levelLabel(PROFILE.lastSessionEndLevel)]);
  });

  test("the fallback is exactly one option, never a computed window", () => {
    // If any module under src ever grew its own window arithmetic, the
    // fallback would offer more than the single level the client actually has
    // — it would look identical to a server-computed suggestion instead of
    // the placeholder it is.
    const html = renderSetup(PROFILE, progressWith([]));
    expect(levelOptionLabels(html)).toHaveLength(1);
  });
});
