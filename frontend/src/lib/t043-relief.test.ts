import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

import { STATE_BLEND, TAPPABLE_STATE_LABEL, stateProps, type MapView } from "@/lib/map-click";
import { MAP_HEIGHT, MAP_WIDTH, reliefImageProps } from "@/lib/relief";

/**
 * T-043 worker tests: the shaded-relief layer (engineering-decisions.md E-32).
 *
 * The PNG is read with `node:fs` and `node:zlib` only — no image library. The
 * reference points are SVG user-space coordinates under the map's projection
 * (`geoAlbersUsa().translate([400, 250]).scale(1000)`), computed once with
 * d3-geo 2.0.2 and written down here, since d3-geo is not a direct dependency.
 */

const PNG_PATH = new URL("../assets/us-shaded-relief.png", import.meta.url);
const png = readFileSync(PNG_PATH);

interface Decoded {
  width: number;
  height: number;
  colourType: number;
  /** Grey and alpha at an SVG user-space point. */
  at(x: number, y: number): { grey: number; alpha: number };
}

/** Decodes an 8-bit, non-interlaced grayscale+alpha PNG — the only kind this file is. */
function decode(buf: Buffer): Decoded {
  expect(buf.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  let offset = 8;
  let width = 0;
  let height = 0;
  let colourType = -1;
  const idat: Buffer[] = [];
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("latin1", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      expect(data[8]).toBe(8); // bit depth
      colourType = data[9] ?? -1;
      expect(data[12]).toBe(0); // not interlaced
    } else if (type === "IDAT") {
      idat.push(data);
    }
    offset += 12 + length;
  }
  expect(colourType).toBe(4);
  const bpp = 2;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const out = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x] ?? 0;
      const a = x >= bpp ? (out[y * stride + x - bpp] ?? 0) : 0;
      const b = y > 0 ? (out[(y - 1) * stride + x] ?? 0) : 0;
      const c = x >= bpp && y > 0 ? (out[(y - 1) * stride + x - bpp] ?? 0) : 0;
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
      out[y * stride + x] = (v + pred) & 0xff;
    }
  }
  const k = width / MAP_WIDTH;
  return {
    width,
    height,
    colourType,
    at(x, y) {
      const i = (Math.floor(y * k) * width + Math.floor(x * k)) * bpp;
      return { grey: out[i] ?? -1, alpha: out[i + 1] ?? -1 };
    },
  };
}

const image = decode(png);

/** Grey values in a small square around an SVG point, opaque pixels only. */
function greysAround(x: number, y: number, r = 6) {
  const greys: number[] = [];
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const px = image.at(x + dx, y + dy);
      if (px.alpha === 255) greys.push(px.grey);
    }
  return greys;
}

describe("the relief PNG", () => {
  test("is at most 300 000 bytes", () => {
    expect(png.length).toBeLessThanOrEqual(300_000);
  });

  test("is exactly 8:5, between 800 and 2400 pixels wide", () => {
    expect(image.width * 5).toBe(image.height * 8);
    expect(image.width).toBeGreaterThanOrEqual(800);
    expect(image.width).toBeLessThanOrEqual(2400);
  });

  test("is grayscale (colour type 4)", () => {
    expect(image.colourType).toBe(4);
  });

  test.each([
    ["Colorado", 280.7, 238.4],
    ["the Alaska inset (Alaska Range)", 110.2, 420.1],
    ["the Hawaii inset (Big Island)", 269.1, 467.4],
  ])("carries visible relief inside %s", (_name, x, y) => {
    const greys = greysAround(x, y);
    expect(greys.length).toBeGreaterThan(20);
    expect(Math.max(...greys) - Math.min(...greys)).toBeGreaterThan(16);
  });

  test.each([
    ["the Pacific, top-left corner", 5, 5],
    ["Canada, top-right corner", 795, 5],
    ["the Gulf of Mexico", 503, 469.5],
    ["Mexico", 296.1, 485.6],
    ["the empty space beside the Alaska inset", 230, 380],
    ["the ocean bottom-right", 795, 495],
  ])("is fully transparent over %s", (_name, x, y) => {
    expect(image.at(x, y).alpha).toBe(0);
  });
});

describe("the relief image element", () => {
  const props = reliefImageProps("/assets/us-shaded-relief.png");

  test("covers the whole 800 x 500 map frame", () => {
    expect([props.x, props.y, props.width, props.height]).toEqual([0, 0, 800, 500]);
    expect([MAP_WIDTH, MAP_HEIGHT]).toEqual([800, 500]);
  });

  test("is hidden from assistive tech, unfocusable and takes no pointer events", () => {
    expect(props["aria-hidden"]).toBe("true");
    expect(props.pointerEvents).toBe("none");
    expect(Object.keys(props)).not.toContain("tabIndex");
    expect(Object.keys(props)).not.toContain("role");
  });
});

describe("states multiply onto the relief and stay opaque", () => {
  const ids = ["06", "08", "02", "15", "44"];
  const views: [string, MapView][] = [
    ["a tap map", { mastered: new Set(), onTap: () => {} }],
    ["a tap map after a wrong answer", { mastered: new Set(), correct: "08", tapped: "06" }],
    ["a highlight map", { mastered: new Set(["02"]), highlight: "15" }],
  ];

  test.each(views)("every interaction style multiplies, on %s", (_name, view) => {
    expect(STATE_BLEND).toBe("multiply");
    for (const id of ids) {
      const { style } = stateProps(id, view);
      for (const s of [style.default, style.hover, style.pressed]) {
        expect(s.mixBlendMode).toBe("multiply");
        expect(s.opacity).toBeUndefined();
        expect(s.fillOpacity).toBeUndefined();
      }
    }
  });

  test("the fill colours are the map variables, unchanged", () => {
    const view: MapView = {
      mastered: new Set(["02"]),
      highlight: "15",
      correct: "08",
      tapped: "06",
    };
    expect(stateProps("44", view).fill).toBe("var(--map-land)");
    expect(stateProps("02", view).fill).toBe("var(--map-mastered)");
    expect(stateProps("15", view).fill).toBe("var(--map-highlight)");
    expect(stateProps("08", view).fill).toBe("var(--map-correct)");
    expect(stateProps("06", view).fill).toBe("var(--map-highlight)");
  });

  test("the tapped state keeps its dashed dark edge; the correct one does not", () => {
    const view: MapView = { mastered: new Set(), correct: "08", tapped: "06" };
    const tapped = stateProps("06", view);
    const correct = stateProps("08", view);
    expect([tapped.stroke, tapped.strokeWidth, tapped.strokeDasharray]).toEqual([
      "var(--foreground)",
      1.6,
      "3 2",
    ]);
    expect([correct.stroke, correct.strokeWidth, correct.strokeDasharray]).toEqual([
      "var(--map-stroke)",
      0.6,
      undefined,
    ]);
  });

  test("while taps are open, every state's label and tab stop are unchanged", () => {
    const view: MapView = { mastered: new Set(), onTap: () => {} };
    for (const id of ids) {
      const props = stateProps(id, view);
      expect(props["aria-label"]).toBe(TAPPABLE_STATE_LABEL);
      expect(props.tabIndex).toBe(0);
    }
    expect(stateProps("08", { mastered: new Set() }).tabIndex).toBe(-1);
  });
});
