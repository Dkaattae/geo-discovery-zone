import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ComposableMap, Geography, useMapContext } from "react-simple-maps";
import statesTopo from "us-atlas/states-10m.json";

import reliefUrl from "@/assets/us-shaded-relief.png";
import { TAPPABLE_STATE_LABEL, pad, stateProps, type MapView } from "@/lib/map-click";
import { reliefImageProps } from "@/lib/relief";

import { UsMap } from "./UsMap";

/**
 * T-043 tester: the brief's acceptance criteria, one `describe` per criterion.
 *
 * Expected values come from the brief (tasks/T-043-shaded-relief.md), not from
 * the code. The map frame is the one the brief names: `geoAlbersUsa`, scale
 * 1000, 800 x 500. The PNG is decoded with `node:fs` and `node:zlib` only, and
 * the state outlines are projected with react-simple-maps' own projection over
 * the bundled us-atlas file. No DOM library, no network.
 *
 * Criteria 8, 9, 20, 21 and 22 are about docs, tooling and the repo's shape and
 * are checked by hand in the brief's Verdict (test-guidelines.md, frontend).
 */

// --------------------------------------------------------------------------
// The PNG, decoded without an image library.
// --------------------------------------------------------------------------

const PNG_FILE = new URL("../assets/us-shaded-relief.png", import.meta.url);
const pngBytes = () => readFileSync(PNG_FILE);

interface Png {
  width: number;
  height: number;
  colourType: number;
  /** One 8-bit sample per channel per pixel, row-major. */
  channels: number;
  pixels: Uint8Array;
}

const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 4: 2, 6: 4 };

/** Non-interlaced 8- or 16-bit PNGs of colour type 0, 2, 4 or 6 (16-bit keeps the high byte). */
function decodePng(buf: Buffer): Png {
  expect([...buf.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  let offset = 8;
  let width = 0;
  let height = 0;
  let depth = 0;
  let colourType = -1;
  let interlace = -1;
  const idat: Buffer[] = [];
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("latin1", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8] ?? 0;
      colourType = data[9] ?? -1;
      interlace = data[12] ?? -1;
    } else if (type === "IDAT") idat.push(data);
    offset += 12 + length;
  }
  const channels = CHANNELS[colourType];
  if (channels === undefined) throw new Error(`colour type ${colourType} is not grayscale or RGB`);
  if (depth !== 8 && depth !== 16) throw new Error(`bit depth ${depth} not supported here`);
  if (interlace !== 0) throw new Error("interlaced PNG not supported here");
  const bpp = channels * (depth / 8);
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const rows = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x] ?? 0;
      const a = x >= bpp ? (rows[y * stride + x - bpp] ?? 0) : 0;
      const b = y > 0 ? (rows[(y - 1) * stride + x] ?? 0) : 0;
      const c = x >= bpp && y > 0 ? (rows[(y - 1) * stride + x - bpp] ?? 0) : 0;
      let pred = 0;
      if (filter === 1) pred = a;
      else if (filter === 2) pred = b;
      else if (filter === 3) pred = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      rows[y * stride + x] = (v + pred) & 0xff;
    }
  }
  const step = depth / 8;
  const pixels = new Uint8Array(width * height * channels);
  for (let i = 0; i < pixels.length; i++) pixels[i] = rows[i * step] ?? 0;
  return { width, height, colourType, channels, pixels };
}

const png = decodePng(pngBytes());

/** Grey (or R) and alpha of pixel (i, j); alpha is 255 when the PNG has none. */
function sample(i: number, j: number): { grey: number; alpha: number } {
  const at = (j * png.width + i) * png.channels;
  const grey = png.pixels[at] ?? 0;
  const alpha =
    png.channels === 2 || png.channels === 4 ? (png.pixels[at + png.channels - 1] ?? 0) : 255;
  return { grey, alpha };
}

/** Relief shows where a pixel is not transparent and darkens under multiply. */
const shades = (p: { grey: number; alpha: number }) => p.alpha > 0 && p.grey < 255;

// --------------------------------------------------------------------------
// The state outlines in the map's SVG user space.
// --------------------------------------------------------------------------

type Ring = [number, number][];
interface Topology {
  transform: { scale: [number, number]; translate: [number, number] };
  arcs: [number, number][][];
  objects: {
    states: {
      geometries: { type: string; id: string | number; arcs: number[][] | number[][][] }[];
    };
  };
}
const topo = statesTopo as unknown as Topology;

/** A minimal TopoJSON decoder: delta-decoded, quantised arcs into GeoJSON polygons. */
function decodeArc(index: number): Ring {
  const arc = topo.arcs[index < 0 ? ~index : index] ?? [];
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;
  let x = 0;
  let y = 0;
  const points: Ring = arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * sx + tx, y * sy + ty];
  });
  return index < 0 ? points.reverse() : points;
}
function ring(arcs: number[]): Ring {
  const out: Ring = [];
  arcs.forEach((a, k) => {
    const pts = decodeArc(a);
    out.push(...(k === 0 ? pts : pts.slice(1)));
  });
  return out;
}

interface Feature {
  type: "Feature";
  id: string;
  properties: Record<string, never>;
  geometry:
    { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] };
}
const FEATURES: Feature[] = topo.objects.states.geometries.map((g) => ({
  type: "Feature",
  id: pad(g.id),
  properties: {},
  geometry:
    g.type === "Polygon"
      ? { type: "Polygon", coordinates: (g.arcs as number[][]).map(ring) }
      : { type: "MultiPolygon", coordinates: (g.arcs as number[][][]).map((p) => p.map(ring)) },
}));

/** The map's own path generator for the frame the brief names. */
function mapPath() {
  let captured: ReturnType<typeof useMapContext> | undefined;
  function Probe() {
    captured = useMapContext();
    return null;
  }
  renderToStaticMarkup(
    <ComposableMap
      projection="geoAlbersUsa"
      projectionConfig={{ scale: 1000 }}
      width={800}
      height={500}
    >
      <Probe />
    </ComposableMap>,
  );
  if (!captured) throw new Error("no map context");
  return captured.path;
}

/** Projected rings of one state, in SVG units; empty for what geoAlbersUsa does not draw. */
function projectedRings(feature: Feature): Ring[] {
  const rings: Ring[] = [];
  let current: Ring = [];
  const sink = {
    beginPath() {},
    moveTo(x: number, y: number) {
      current = [[x, y]];
      rings.push(current);
    },
    lineTo(x: number, y: number) {
      current.push([x, y]);
    },
    arc() {},
    closePath() {},
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapPath().context(sink)(feature as any);
  return rings.filter((r) => r.length > 2);
}

const RINGS_BY_STATE = new Map(FEATURES.map((f) => [f.id, projectedRings(f)]));
const DRAWN_RINGS = [...RINGS_BY_STATE.values()].flat();

const UNITS_PER_PX = 800 / png.width;

/** Even-odd scanline fill of rings at the PNG's resolution, sampled at pixel centres. */
function rasterise(rings: Ring[]): Uint8Array {
  const mask = new Uint8Array(png.width * png.height);
  const crossings: number[][] = Array.from({ length: png.height }, () => []);
  for (const r of rings)
    for (let k = 0; k < r.length; k++) {
      const [x1, y1] = r[k] ?? [0, 0];
      const [x2, y2] = r[(k + 1) % r.length] ?? [0, 0];
      const j0 = Math.max(0, Math.ceil(Math.min(y1, y2) / UNITS_PER_PX - 0.5));
      const j1 = Math.min(png.height - 1, Math.floor(Math.max(y1, y2) / UNITS_PER_PX - 0.5));
      for (let j = j0; j <= j1; j++) {
        const y = (j + 0.5) * UNITS_PER_PX;
        if (y1 <= y === y2 <= y) continue;
        crossings[j]?.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
  crossings.forEach((xs, j) => {
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const from = Math.max(0, Math.ceil((xs[k] ?? 0) / UNITS_PER_PX - 0.5));
      const to = Math.min(png.width - 1, Math.floor((xs[k + 1] ?? 0) / UNITS_PER_PX - 0.5));
      for (let i = from; i <= to; i++) mask[j * png.width + i] = 1;
    }
  });
  return mask;
}

/** Distance from a point to the nearest drawn outline edge, through a grid of edges. */
function nearestOutline(): (x: number, y: number) => number {
  const CELL = 4;
  const grid = new Map<string, [number, number, number, number][]>();
  for (const r of DRAWN_RINGS)
    for (let k = 0; k < r.length; k++) {
      const [x1, y1] = r[k] ?? [0, 0];
      const [x2, y2] = r[(k + 1) % r.length] ?? [0, 0];
      for (
        let cx = Math.floor(Math.min(x1, x2) / CELL);
        cx <= Math.floor(Math.max(x1, x2) / CELL);
        cx++
      )
        for (
          let cy = Math.floor(Math.min(y1, y2) / CELL);
          cy <= Math.floor(Math.max(y1, y2) / CELL);
          cy++
        ) {
          const key = `${cx},${cy}`;
          const list = grid.get(key) ?? [];
          list.push([x1, y1, x2, y2]);
          grid.set(key, list);
        }
    }
  return (x, y) => {
    let best = Infinity;
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const [x1, y1, x2, y2] of grid.get(`${cx + dx},${cy + dy}`) ?? []) {
          const vx = x2 - x1;
          const vy = y2 - y1;
          const len = vx * vx + vy * vy;
          const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * vx + (y - y1) * vy) / len));
          best = Math.min(best, Math.hypot(x - (x1 + t * vx), y - (y1 + t * vy)));
        }
    return best;
  };
}

// --------------------------------------------------------------------------
// The rendered map.
// --------------------------------------------------------------------------

const MODES: [string, () => ReactElement][] = [
  ["a map_click map (onTap)", () => <UsMap onTap={() => {}} />],
  ["a highlight map (no onTap)", () => <UsMap highlightFips="8" />],
  ["a reveal map (no onTap)", () => <UsMap correctFips="8" tappedFips="6" />],
  ["a progress map (no onTap)", () => <UsMap masteredFips={new Set(["2", "15"])} />],
];

const images = (html: string) => html.match(/<image\b[^>]*>/g) ?? [];
const attr = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

const NO_MASTERY: ReadonlySet<string> = new Set();
const ALL_IDS = FEATURES.map((f) => f.id);

/** Every state that react-simple-maps draws: the ones the projection gives a path. */
const DRAWN_IDS = ALL_IDS.filter((id) => (RINGS_BY_STATE.get(id)?.length ?? 0) > 0);

function pathMarkup(fips: string, view: MapView): string {
  return renderToStaticMarkup(
    <svg>
      <Geography geography={{ svgPath: "M0 0L1 1Z" }} {...stateProps(fips, view)} />
    </svg>,
  );
}

// --------------------------------------------------------------------------
// Criteria
// --------------------------------------------------------------------------

describe("criterion 1: one relief image inside the svg, before every state path", () => {
  test.each(MODES)("on %s", (_name, el) => {
    const html = renderToStaticMarkup(el());
    expect(images(html)).toHaveLength(1);
    const svgOpen = html.indexOf("<svg");
    const svgClose = html.indexOf("</svg>");
    const image = html.indexOf("<image");
    // The group react-simple-maps' <Geographies> draws every state path into.
    const group = html.indexOf('<g class="rsm-geographies');
    expect(svgOpen).toBeGreaterThanOrEqual(0);
    expect(group).toBeGreaterThan(svgOpen);
    expect(image).toBeGreaterThan(svgOpen);
    expect(image).toBeLessThan(group);
    expect(group).toBeLessThan(svgClose);
    // No state path sits before the image.
    expect(html.slice(0, image)).not.toContain("<path");
  });
});

describe("criterion 2: placed at 0,0 800x500 in the map frame, not stretched", () => {
  test.each(MODES)("the rendered image's box on %s", (_name, el) => {
    const tag = images(renderToStaticMarkup(el()))[0] ?? "";
    expect(attr(tag, "x")).toBe("0");
    expect(attr(tag, "y")).toBe("0");
    expect(attr(tag, "width")).toBe("800");
    expect(attr(tag, "height")).toBe("500");
  });

  test("the map's svg is the same 800x500 frame", () => {
    const html = renderToStaticMarkup(<UsMap />);
    expect(html).toContain('viewBox="0 0 800 500"');
  });

  test("the PNG's aspect ratio equals the box's, so any scaling is uniform", () => {
    expect(png.width * 500).toBe(png.height * 800);
  });
});

describe("criterion 3: the relief is on both map modes", () => {
  test("with onTap and without it, each map has one image with the same reference", () => {
    const hrefs = MODES.map(([, el]) => {
      const tags = images(renderToStaticMarkup(el()));
      expect(tags).toHaveLength(1);
      return attr(tags[0] ?? "", "href");
    });
    expect(new Set(hrefs).size).toBe(1);
    expect(hrefs[0]).toContain("us-shaded-relief");
  });
});

describe("criterion 4: the image is the app's own file, from no other origin", () => {
  test.each(MODES)("the href on %s names no other host", (_name, el) => {
    const tag = images(renderToStaticMarkup(el()))[0] ?? "";
    const href = attr(tag, "href") ?? attr(tag, "xlink:href") ?? "";
    expect(href).not.toBe("");
    expect(href).not.toMatch(/^[a-z][a-z0-9+.-]*:\/\//i);
    expect(href).not.toMatch(/^\/\//);
    expect(href).not.toMatch(/^data:/);
  });

  test("the imported reference is the committed PNG", () => {
    expect(reliefUrl).toMatch(/us-shaded-relief[^/]*\.png$/);
  });
});

describe("criterion 5: the PNG is at most 300 000 bytes", () => {
  test("file size", () => {
    expect(pngBytes().length).toBeLessThanOrEqual(300_000);
  });
});

describe("criterion 6: IHDR is exactly 8:5, width 800 to 2400", () => {
  test("width * 5 === height * 8", () => {
    expect(png.width * 5).toBe(png.height * 8);
  });
  test("800 <= width <= 2400", () => {
    expect(png.width).toBeGreaterThanOrEqual(800);
    expect(png.width).toBeLessThanOrEqual(2400);
  });
});

describe("criterion 7: the PNG is grayscale in content", () => {
  test("colour type 0 or 4, or every pixel has R = G = B", () => {
    expect([0, 2, 4, 6]).toContain(png.colourType);
    if (png.colourType === 2 || png.colourType === 6) {
      let coloured = 0;
      for (let p = 0; p < png.width * png.height; p++) {
        const at = p * png.channels;
        const [r, g, b] = [png.pixels[at], png.pixels[at + 1], png.pixels[at + 2]];
        if (r !== g || g !== b) coloured++;
      }
      expect(coloured).toBe(0);
    }
  });
});

describe("criterion 10: no terrain shading outside the drawn states, bleed at most 3 units", () => {
  test("the outlines project to the lower 48, Alaska and Hawaii (sanity of the frame)", () => {
    for (const id of ["02", "08", "15", "06", "44"]) expect(DRAWN_IDS).toContain(id);
  });

  test("every shading pixel lies within the states, or within 3 SVG units of an outline", () => {
    const inside = rasterise(DRAWN_RINGS);
    const distance = nearestOutline();
    // A pixel's relief reaches as far as its far corner from the outline.
    const halfDiagonal = (UNITS_PER_PX * Math.SQRT2) / 2;
    const offenders: string[] = [];
    let worst = 0;
    for (let j = 0; j < png.height; j++)
      for (let i = 0; i < png.width; i++) {
        if (inside[j * png.width + i] || !shades(sample(i, j))) continue;
        const x = (i + 0.5) * UNITS_PER_PX;
        const y = (j + 0.5) * UNITS_PER_PX;
        const reach = distance(x, y) + halfDiagonal;
        worst = Math.max(worst, Math.min(reach, 1e6));
        if (reach > 3 && offenders.length < 10)
          offenders.push(`(${x.toFixed(1)}, ${y.toFixed(1)})`);
      }
    expect(offenders).toEqual([]);
    expect(worst).toBeLessThanOrEqual(3);
  });

  test("the corners and the space beside the insets carry no shading", () => {
    const at = (x: number, y: number) =>
      sample(Math.floor(x / UNITS_PER_PX), Math.floor(y / UNITS_PER_PX));
    for (const [x, y] of [
      [1, 1],
      [799, 1],
      [1, 499],
      [799, 499],
      [10, 250],
      [790, 250],
    ] as const)
      expect(shades(at(x, y))).toBe(false);
  });
});

describe("criterion 11: Colorado, the Alaska inset and the Hawaii inset all carry relief", () => {
  test.each([
    ["Colorado", "08"],
    ["Alaska", "02"],
    ["Hawaii", "15"],
  ])("the PNG is neither transparent nor uniform inside %s", (_name, id) => {
    const mask = rasterise(RINGS_BY_STATE.get(id) ?? []);
    const greys = new Set<number>();
    let pixels = 0;
    let visible = 0;
    for (let p = 0; p < mask.length; p++) {
      if (!mask[p]) continue;
      pixels++;
      const s = sample(p % png.width, Math.floor(p / png.width));
      if (s.alpha > 0) {
        visible++;
        greys.add(s.grey);
      }
    }
    expect(pixels).toBeGreaterThan(0);
    expect(visible).toBeGreaterThan(0);
    expect(greys.size).toBeGreaterThan(1);
  });
});

const VIEWS: [string, MapView][] = [
  ["taps open", { mastered: NO_MASTERY, onTap: () => {} }],
  ["a highlight", { mastered: NO_MASTERY, highlight: "08" }],
  ["a reveal after a wrong tap", { mastered: NO_MASTERY, correct: "08", tapped: "06" }],
  ["progress", { mastered: new Set(["02", "15", "44"]) }],
];

describe("criterion 12: every state multiplies onto the relief, in every interaction state", () => {
  test.each(VIEWS)("default, hover and pressed all multiply, with %s", (_name, view) => {
    for (const id of DRAWN_IDS) {
      const { style } = stateProps(id, view);
      expect(style.default.mixBlendMode).toBe("multiply");
      expect(style.hover.mixBlendMode).toBe("multiply");
      expect(style.pressed.mixBlendMode).toBe("multiply");
    }
  });

  test.each(VIEWS)("the drawn path carries mix-blend-mode:multiply, with %s", (_name, view) => {
    for (const id of ["08", "06", "02", "15", "44"]) {
      expect(pathMarkup(id, view)).toMatch(/style="[^"]*mix-blend-mode:\s*multiply/);
    }
  });
});

describe("criterion 13: fills stay opaque and keep their colours", () => {
  const reveal: MapView = {
    mastered: new Set(["02"]),
    highlight: "15",
    correct: "08",
    tapped: "06",
  };

  test("land, mastered, highlight, correct and tapped fills are the map variables", () => {
    expect(stateProps("44", reveal).fill).toBe("var(--map-land)");
    expect(stateProps("02", reveal).fill).toBe("var(--map-mastered)");
    expect(stateProps("15", reveal).fill).toBe("var(--map-highlight)");
    expect(stateProps("08", reveal).fill).toBe("var(--map-correct)");
    expect(stateProps("06", reveal).fill).toBe("var(--map-highlight)");
  });

  test.each(VIEWS)(
    "no opacity, fill-opacity or translucent fill in any style, with %s",
    (_name, view) => {
      for (const id of DRAWN_IDS) {
        const props = stateProps(id, view) as unknown as Record<string, unknown>;
        expect(props["opacity"]).toBeUndefined();
        expect(props["fillOpacity"]).toBeUndefined();
        const { style } = stateProps(id, view);
        for (const s of [style.default, style.hover, style.pressed]) {
          expect(s.opacity).toBeUndefined();
          expect(s.fillOpacity).toBeUndefined();
          expect(String(s.fill ?? "")).not.toContain("transparent");
        }
        expect(pathMarkup(id, view)).not.toMatch(/opacity/);
      }
    },
  );
});

describe("criterion 14: the tapped state stays distinct from the correct one", () => {
  test("tapped: foreground, 1.6, dashed 3 2; correct: map-stroke, 0.6, no dash", () => {
    const view: MapView = { mastered: NO_MASTERY, correct: "08", tapped: "06" };
    const tapped = stateProps("06", view);
    const correct = stateProps("08", view);
    expect(tapped.stroke).toBe("var(--foreground)");
    expect(tapped.strokeWidth).toBe(1.6);
    expect(tapped.strokeDasharray).toBe("3 2");
    expect(correct.stroke).toBe("var(--map-stroke)");
    expect(correct.strokeWidth).toBe(0.6);
    expect(correct.strokeDasharray).toBeUndefined();
  });
});

describe("criterion 15: the relief is not focusable and not announced", () => {
  test.each(MODES)("on %s", (_name, el) => {
    const tag = images(renderToStaticMarkup(el()))[0] ?? "";
    const tabindex = attr(tag, "tabindex") ?? attr(tag, "tabIndex");
    if (tabindex !== undefined) expect(Number(tabindex)).toBeLessThan(0);
    expect(attr(tag, "role")).toBeUndefined();
    expect(attr(tag, "aria-hidden") === "true" || attr(tag, "alt") === "").toBe(true);
  });
});

describe("criterion 16: the relief takes no pointer events; a tap reports the state's id", () => {
  test.each(MODES)("pointer-events none on %s", (_name, el) => {
    const tag = images(renderToStaticMarkup(el()))[0] ?? "";
    const viaAttr = attr(tag, "pointer-events") === "none";
    const viaStyle = /pointer-events:\s*none/.test(attr(tag, "style") ?? "");
    expect(viaAttr || viaStyle).toBe(true);
  });

  test("a tap on any drawn state reports that state's geometry id", () => {
    const taps: string[] = [];
    const view: MapView = { mastered: NO_MASTERY, onTap: (id) => taps.push(id) };
    for (const id of DRAWN_IDS) stateProps(id, view).onClick?.();
    expect(taps).toEqual(DRAWN_IDS);
  });
});

describe("criterion 17: while taps are open, states differ only by geometry id and handlers", () => {
  test("every drawn state's props are identical once the id and handlers are removed", () => {
    const view: MapView = { mastered: NO_MASTERY, onTap: () => {} };
    const looks = DRAWN_IDS.map((id) => {
      const { onClick, onKeyDown, "data-geometry-id": ownId, ...rest } = stateProps(id, view);
      expect(ownId).toBe(id);
      expect(typeof onClick).toBe("function");
      expect(typeof onKeyDown).toBe("function");
      return JSON.stringify(rest);
    });
    expect(new Set(looks).size).toBe(1);
    expect(looks[0]).toContain('"mixBlendMode":"multiply"');
  });
});

describe("criterion 18: label and tab order are unchanged", () => {
  test("tappable states are labelled TAPPABLE_STATE_LABEL and have tabIndex 0", () => {
    const view: MapView = { mastered: NO_MASTERY, onTap: () => {} };
    for (const id of DRAWN_IDS) {
      const props = stateProps(id, view);
      expect(props["aria-label"]).toBe(TAPPABLE_STATE_LABEL);
      expect(props.tabIndex).toBe(0);
    }
  });

  test.each(VIEWS.slice(1))("states have tabIndex -1 and no label with %s", (_name, view) => {
    for (const id of DRAWN_IDS) {
      const props = stateProps(id, view);
      expect(props.tabIndex).toBe(-1);
      expect(props["aria-label"]).toBeUndefined();
    }
  });
});

describe("criterion 19: the states do not wait on the image", () => {
  test.each(MODES)("the image is an empty sibling before the states' group on %s", (_name, el) => {
    const html = renderToStaticMarkup(el());
    // Empty, closed straight away, and the states' group follows it: the image
    // cannot be the parent of the states' group.
    expect(html).toMatch(/<image\b[^>]*(\/>|><\/image>)<g class="rsm-geographies/);
  });

  test("the image's props carry no load handler", () => {
    const props = reliefImageProps("/x.png") as unknown as Record<string, unknown>;
    expect(Object.keys(props).filter((k) => /^on/i.test(k))).toEqual([]);
  });
});
