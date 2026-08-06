import { describe, expect, test } from "bun:test";

import { point, type SparqlBinding } from "./sparql";

const literal = (value: string): SparqlBinding => ({ type: "literal", value });

describe("criterion 8 — WKT point parsing", () => {
  test("returns [longitude, latitude], in that order", () => {
    // Colorado's centroid: west of Greenwich, north of the equator. Longitude
    // first is what d3-geo expects, and getting it backwards puts every US
    // state in the Indian Ocean.
    expect(point(literal("Point(-105.5 39.0)"))).toEqual([-105.5, 39]);
  });

  test("tolerates surrounding whitespace and mixed case", () => {
    expect(point(literal("  point( -105.5  39.0 )  "))).toEqual([-105.5, 39]);
  });

  test("returns undefined for geometry that is not a point", () => {
    expect(point(literal("POLYGON(1 2)"))).toBeUndefined();
  });

  test("returns undefined for a malformed point", () => {
    expect(point(literal("Point(-105.5)"))).toBeUndefined();
    expect(point(literal("Point(west north)"))).toBeUndefined();
    expect(point(literal(""))).toBeUndefined();
  });

  test("returns undefined when the binding is absent", () => {
    expect(point(undefined)).toBeUndefined();
  });
});
