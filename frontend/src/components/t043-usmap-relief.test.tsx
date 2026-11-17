import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { UsMap } from "./UsMap";

/**
 * T-043 worker tests: `UsMap` draws the shaded relief before, and outside, the
 * group that holds every state path (engineering-decisions.md E-32).
 *
 * The real `Geographies` renders its `<g class="rsm-geographies">` in static
 * markup but fills it only after mount, so the group stands in for "every
 * state path": an image before the group precedes every path in it.
 */

function markup(withTap: boolean): string {
  return renderToStaticMarkup(
    withTap ? (
      <UsMap onTap={() => {}} />
    ) : (
      <UsMap highlightFips="8" masteredFips={new Set(["2"])} />
    ),
  );
}

describe.each([
  ["a map_click map (with onTap)", true],
  ["a highlight / progress map (no onTap)", false],
])("on %s", (_name, withTap) => {
  const html = markup(withTap);
  const images = html.match(/<image\b[^>]*>/g) ?? [];

  test("there is exactly one relief image, inside the map's svg", () => {
    expect(images).toHaveLength(1);
    const svgOpen = html.indexOf("<svg");
    expect(svgOpen).toBeGreaterThanOrEqual(0);
    expect(html.indexOf("<image")).toBeGreaterThan(svgOpen);
    expect(html.indexOf("<image")).toBeLessThan(html.indexOf("</svg>"));
  });

  test("it comes before the states' group, not inside it", () => {
    const group = html.indexOf("rsm-geographies");
    expect(group).toBeGreaterThan(0);
    expect(html.indexOf("<image")).toBeLessThan(html.lastIndexOf("<g", group));
  });

  test("it fills the 800 x 500 frame, is hidden, and takes no pointer events", () => {
    const tag = images[0] ?? "";
    expect(tag).toContain('x="0"');
    expect(tag).toContain('y="0"');
    expect(tag).toContain('width="800"');
    expect(tag).toContain('height="500"');
    expect(tag).toContain('aria-hidden="true"');
    expect(tag).toContain('pointer-events="none"');
    expect(tag).not.toContain("tabindex");
    expect(tag).not.toContain("role=");
  });

  test("its reference is the app's own asset, not another origin", () => {
    const href = /\bhref="([^"]*)"/.exec(images[0] ?? "")?.[1] ?? "";
    expect(href).toContain("us-shaded-relief");
    expect(href).not.toMatch(/^(https?:)?\/\//);
  });
});
