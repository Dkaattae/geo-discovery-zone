/**
 * T-111 tester: tests for criteria 1 and 2 of
 * `tasks/T-111-us-states-15-states-comments.md`.
 *
 * Both read the committed `src/curated/us-states.ts` as text. Criterion 3
 * (comments only, exports and data unchanged against `2634fc8`) and criterion 4
 * (the PR diff's file list) are checked at hand-off and recorded in the brief's
 * Verdict, not as committed pins: a comparison against `2634fc8` would go red
 * on the next task that touches this file's code (P-17).
 *
 * Pure: one committed file read from disk. No spawn, no network.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FILE = join(import.meta.dirname, "curated", "us-states.ts");
const SOURCE = readFileSync(FILE, "utf8");
const LINES = SOURCE.split("\n");

const PARAGRAPH_START = "**`region` vocabulary (T-017, 2026-09-18).**";

/**
 * "The region paragraph": from the line that begins the bolded heading to the
 * end of its `/** … *\/` block, as the brief defines it. Returned raw (lines
 * as committed) and as prose (comment `*` prefixes dropped, whitespace
 * collapsed, so a backticked value wrapped across lines still reads whole).
 */
function regionParagraph(): { raw: string[]; prose: string } {
  const start = LINES.findIndex((l) => l.includes(PARAGRAPH_START));
  if (start < 0) return { raw: [], prose: "" };
  const endOffset = LINES.slice(start).findIndex((l) => l.includes("*/"));
  const end = endOffset < 0 ? LINES.length : start + endOffset;
  const raw = LINES.slice(start, end + 1);
  const prose = raw
    .map((l) => l.replace(/^\s*\/?\*+\/?\s?/, "").replace(/\*\/\s*$/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return { raw, prose };
}

const REGIONS = [
  "Great Basin",
  "Great Lakes",
  "Great Plains",
  "Mountain West",
  "New England",
  "Northeast",
  "Pacific",
  "Pacific Northwest",
  "Pacific West",
  "South Central",
  "Southeast",
  "Southwest",
  "Upper Midwest",
];

const STATES = [
  "Colorado",
  "Florida",
  "Texas",
  "Alaska",
  "Hawaii",
  "Maine",
  "Michigan",
  "Louisiana",
  "California",
  "New York",
  "Arizona",
  "Kansas",
  "Washington",
  "Minnesota",
  "Nevada",
];

describe("T-111 criterion 1: no present-tense '15 states' claim is left", () => {
  test("no line of us-states.ts contains 'shipping today' (any case)", () => {
    const hits = LINES.filter((l) => /shipping today/i.test(l));
    expect(hits).toEqual([]);
  });

  test("no line of us-states.ts contains 'already served' (any case)", () => {
    const hits = LINES.filter((l) => /already served/i.test(l));
    expect(hits).toEqual([]);
  });

  test("the region paragraph contains no occurrence of the word 'today'", () => {
    const { raw, prose } = regionParagraph();
    expect(raw.length).toBeGreaterThan(0);
    expect(prose).not.toMatch(/\btoday\b/i);
  });
});

describe("T-111 criterion 2: T-017's decision is still recorded in the region paragraph", () => {
  test("the region paragraph exists and ends at its block's closing */", () => {
    const { raw } = regionParagraph();
    expect(raw.length).toBeGreaterThan(1);
    expect(raw[0]).toContain(PARAGRAPH_START);
    expect(raw[raw.length - 1]).toContain("*/");
  });

  test.each(["T-017", "2026-09-18", "E-9"])("it contains %p", (s) => {
    expect(regionParagraph().prose).toContain(s);
  });

  test("it contains the word '15' or 'fifteen' at least once", () => {
    expect(regionParagraph().prose).toMatch(/(?<![\w-])(15|fifteen)(?![\w-])/i);
  });

  test("exactly 13 region values are checked", () => {
    expect(new Set(REGIONS).size).toBe(13);
  });

  test.each(REGIONS)("region value `%s` appears in backticks", (region) => {
    expect(regionParagraph().prose).toContain("`" + region + "`");
  });

  test("exactly 15 state names are checked", () => {
    expect(new Set(STATES).size).toBe(15);
  });

  test.each(STATES)("state name `%s` appears in backticks", (state) => {
    expect(regionParagraph().prose).toContain("`" + state + "`");
  });
});
