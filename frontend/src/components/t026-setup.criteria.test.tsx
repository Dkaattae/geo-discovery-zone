import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { Profile } from "@/lib/api";

import { Setup } from "./screens";

/**
 * T-026 tester, criteria 43-45 as rendered: the Setup screen's topic buttons,
 * read back out of `renderToStaticMarkup` (as `screens.criteria.test.tsx`
 * does). No DOM, no network.
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

function topicLabels(): string[] {
  const html = renderToStaticMarkup(
    <Setup
      profile={PROFILE}
      progress={undefined}
      onStart={() => {}}
      onBack={() => {}}
      pending={false}
    />,
  );
  const beforeLevels = html.split("How tricky?")[0] ?? "";
  return [...beforeLevels.matchAll(/data-variant="choice"[^>]*>([^<]*)</g)].map((m) => m[1]!);
}

describe("T-026 criteria 43-45: Setup renders eight topic options", () => {
  test("eight buttons, none saying 'both'", () => {
    const labels = topicLabels();
    expect(labels).toHaveLength(8);
    for (const label of labels) expect(label).not.toMatch(/\bboth\b/i);
    expect(new Set(labels).size).toBe(8);
  });
});
