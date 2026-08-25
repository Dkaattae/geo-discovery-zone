import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { bandLabel, bandOf, gradeLabel, gradeOf, levelLabel } from "./level";

/**
 * Display-only level formatting. Every function here is pure, so the tests call
 * them directly — no seam, no transport, no network (`test-guidelines.md`,
 * "Start below the transport").
 *
 * The table in `fixtures/level-labels.json` is the agreed answer, shared with
 * `backend/tests/test_levels.py`. `backend/app/levels.py` is a hand-copy of
 * `level.ts`, and nothing else notices when one of them changes and the other
 * does not: a child would simply read a different grade on the home screen than
 * the server thinks they are on.
 */
const FIXTURE = join(import.meta.dirname, "../../../fixtures/level-labels.json");

interface LabelRow {
  level: number;
  grade: number;
  band: number;
  gradeLabel: string;
  bandLabel: string;
  display: string;
}

/** Re-read per call, so no test can leave the table changed for the next one. */
function labelRows(): LabelRow[] {
  return (JSON.parse(readFileSync(FIXTURE, "utf8")) as { rows: LabelRow[] }).rows;
}

describe("gradeOf", () => {
  test("is the level halved and rounded down, so two levels make a grade", () => {
    expect(gradeOf(0)).toBe(0);
    expect(gradeOf(1.9)).toBe(0);
    expect(gradeOf(2)).toBe(1);
    expect(gradeOf(7)).toBe(3);
    expect(gradeOf(16)).toBe(8);
  });

  test("does not stop at the top of the scale — level 18 derives grade 9", () => {
    expect(gradeOf(18)).toBe(9);
  });

  test("rounds down rather than towards zero below the scale", () => {
    expect(gradeOf(-2)).toBe(-1);
  });
});

describe("bandOf", () => {
  test("is how far into the grade the level has got", () => {
    expect(bandOf(0)).toBeCloseTo(0, 9);
    expect(bandOf(1.5)).toBeCloseTo(1.5, 9);
    expect(bandOf(2)).toBeCloseTo(0, 9);
    expect(bandOf(7)).toBeCloseTo(1, 9);
    expect(bandOf(17.5)).toBeCloseTo(1.5, 9);
  });

  test("never reaches 2, because that is the next grade", () => {
    for (const level of [0, 0.5, 3.9, 7.25, 12.75, 17.99]) {
      const band = bandOf(level);
      expect(band).toBeGreaterThanOrEqual(0);
      expect(band).toBeLessThan(2);
    }
  });
});

describe("bandLabel boundaries", () => {
  // Both edges, both sides. The band is bandOf(level), and for a level below 2
  // the two are the same number, so these four pin the comparisons exactly.
  test("0.75 is the Easy/Medium edge", () => {
    expect(bandLabel(0.74)).toBe("Easy");
    expect(bandLabel(0.75)).toBe("Medium");
  });

  test("1.5 is the Medium/Hard edge", () => {
    expect(bandLabel(1.49)).toBe("Medium");
    expect(bandLabel(1.5)).toBe("Hard");
  });

  test("the edges are the band's, not the level's, so they repeat in every grade", () => {
    // Level 16.74 sits in grade 8 with band 0.74 — the same Easy/Medium edge,
    // four grades up. A comparison written against the raw level would call
    // this one Hard.
    expect(bandOf(16.74)).toBeCloseTo(0.74, 9);
    expect(bandLabel(16.74)).toBe("Easy");
    expect(bandOf(12.75)).toBeCloseTo(0.75, 9);
    expect(bandLabel(12.75)).toBe("Medium");
    expect(bandOf(13.49)).toBeCloseTo(1.49, 9);
    expect(bandLabel(13.49)).toBe("Medium");
    expect(bandOf(13.5)).toBeCloseTo(1.5, 9);
    expect(bandLabel(13.5)).toBe("Hard");
  });

  test("a third-grader's hardest and a fourth-grader's easiest are adjacent levels", () => {
    expect(bandLabel(7.5)).toBe("Hard");
    expect(bandLabel(8)).toBe("Easy");
  });
});

describe("gradeLabel clamping", () => {
  test('grade 0 reads as Kindergarten rather than "K grade"', () => {
    expect(gradeLabel(0)).toBe("Kindergarten");
    expect(gradeLabel(1.99)).toBe("Kindergarten");
  });

  test("the top of the scale clamps to 8th grade rather than running off gradeNames", () => {
    // gradeOf(18) is 9, which is neither on the 0-18 scale nor in gradeNames.
    // Unclamped this reads "undefined grade".
    expect(gradeOf(18)).toBe(9);
    expect(gradeLabel(18)).toBe("8th grade");
    expect(gradeLabel(17.5)).toBe("8th grade");
  });

  test("a level below the scale clamps to Kindergarten, not a negative index", () => {
    expect(gradeLabel(-2)).toBe("Kindergarten");
    expect(gradeLabel(-0.5)).toBe("Kindergarten");
  });

  test("the grades in between are named in order", () => {
    expect(gradeLabel(2)).toBe("1st grade");
    expect(gradeLabel(6)).toBe("3rd grade");
    expect(gradeLabel(16)).toBe("8th grade");
  });
});

describe("levelLabel", () => {
  test("joins the grade and the band with a middle dot", () => {
    expect(levelLabel(6)).toBe("3rd grade · Easy");
    expect(levelLabel(7.5)).toBe("3rd grade · Hard");
    expect(levelLabel(0)).toBe("Kindergarten · Easy");
  });

  test("clamps the same way its parts do", () => {
    expect(levelLabel(18)).toBe("8th grade · Easy");
    expect(levelLabel(-2)).toBe("Kindergarten · Easy");
  });
});

describe("the shared label table", () => {
  test("covers the whole 0-18 scale", () => {
    const levels = labelRows().map((row) => row.level);
    expect(Math.min(...levels)).toBe(0);
    expect(Math.max(...levels)).toBe(18);
    expect(levels.length).toBeGreaterThan(20);
  });

  test.each(labelRows().map((row) => [row.level, row] as const))(
    "level %p produces the labels backend/app/levels.py produces",
    (_level, row) => {
      expect(gradeOf(row.level)).toBe(row.grade);
      // A tolerance, not equality: `level - 2 * grade` is not exact for a level
      // that is not a multiple of 0.5 — bandOf(16.74) is 0.7400000000000002.
      expect(bandOf(row.level)).toBeCloseTo(row.band, 9);
      expect(gradeLabel(row.level)).toBe(row.gradeLabel);
      expect(bandLabel(row.level)).toBe(row.bandLabel);
      expect(levelLabel(row.level)).toBe(row.display);
    },
  );
});
