/**
 * The shaded-relief layer under the state outlines (T-043).
 *
 * The image is a one-off derivative of Natural Earth's Shaded Relief Basic,
 * warped once, outside the repo, into the exact frame `UsMap` projects into
 * (`geoAlbersUsa`, scale 1000, 800×500), with the Alaska and Hawaii insets in
 * place and everything outside the states transparent. How it was made, and why
 * nothing in the repo regenerates it: engineering-decisions.md E-32.
 */

/** The SVG user space `UsMap`'s `ComposableMap` is drawn in. */
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 500;

export interface ReliefImageProps {
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
  preserveAspectRatio: "none";
  "aria-hidden": "true";
  pointerEvents: "none";
}

/**
 * The relief image's attributes. Covers the whole map frame (the PNG is 8:5, so
 * nothing is stretched), is never announced or focused, and lets every tap
 * through to the state under it.
 */
export function reliefImageProps(href: string): ReliefImageProps {
  return {
    href,
    x: 0,
    y: 0,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    preserveAspectRatio: "none",
    "aria-hidden": "true",
    pointerEvents: "none",
  };
}
