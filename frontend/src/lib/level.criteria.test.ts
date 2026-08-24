import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { bandLabel, bandOf, gradeLabel, gradeOf, levelLabel } from "./level";

/**
 * T-004's acceptance criteria, written out as assertions by the verifying
 * session (`process.md` step 4). Every expected value here comes from the
 * wording of a criterion in `tasks/T-004-level-tests-and-frontend-typecheck.md`
 * — none of it was read out of `level.ts`, `levels.py`, or the shared table.
 *
 * It is deliberately separate from `level.test.ts`, which is the worker's
 * suite. That one and `backend/tests/test_levels.py` both read
 * `fixtures/level-labels.json`, so an edit that changes the table *and* an
 * implementation together stays green in both. This file holds the literals the
 * criteria name independently of that table, and then checks the table against
 * them — so the pin cannot be quietly moved to wherever the code happens to be.
 *
 * Pure functions, called directly: no seam, no transport, no network
 * (`test-guidelines.md`, "Start below the transport").
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

const rowFor = (level: number): LabelRow => {
  const row = labelRows().find((candidate) => candidate.level === level);
  if (row === undefined) throw new Error(`fixtures/level-labels.json has no row for ${level}`);
  return row;
};

describe("criterion 1 — every export of level.ts is exercised", () => {
  // Each of these fails if the export's body is replaced by a constant, which
  // is the check the criterion states.
  test("gradeOf varies with the level", () => {
    expect(gradeOf(0)).toBe(0);
    expect(gradeOf(2)).toBe(1);
    expect(gradeOf(16)).toBe(8);
  });

  test("bandOf varies with the level and resets at each grade", () => {
    expect(bandOf(0)).toBeCloseTo(0, 9);
    expect(bandOf(1)).toBeCloseTo(1, 9);
    expect(bandOf(2)).toBeCloseTo(0, 9);
  });

  test("gradeLabel names more than one grade", () => {
    expect(gradeLabel(0)).toBe("Kindergarten");
    expect(gradeLabel(2)).toBe("1st grade");
    expect(gradeLabel(16)).toBe("8th grade");
  });

  test("bandLabel produces all three bands", () => {
    expect(bandLabel(0)).toBe("Easy");
    expect(bandLabel(1)).toBe("Medium");
    expect(bandLabel(1.75)).toBe("Hard");
  });

  test("levelLabel is the two labels joined, not either one alone", () => {
    expect(levelLabel(6)).toBe(`${gradeLabel(6)} · ${bandLabel(6)}`);
    expect(levelLabel(6)).not.toBe(levelLabel(7.5));
    expect(levelLabel(6)).not.toBe(levelLabel(8));
  });
});

describe("criterion 2 — bandLabel boundaries, both sides of each edge", () => {
  // The four the criterion asserts "at minimum", verbatim.
  test("bandLabel(0.74) is Easy and bandLabel(0.75) is Medium", () => {
    expect(bandLabel(0.74)).toBe("Easy");
    expect(bandLabel(0.75)).toBe("Medium");
  });

  test("bandLabel(1.49) is Medium and bandLabel(1.5) is Hard", () => {
    expect(bandLabel(1.49)).toBe("Medium");
    expect(bandLabel(1.5)).toBe("Hard");
  });

  // "The band is bandOf(level), not the raw level, so the levels chosen must
  // actually produce those bands" — so the same edges are checked at a level
  // where band and level are different numbers.
  test("the edge is the band's, so it recurs in a higher grade", () => {
    expect(bandOf(16.74)).toBeCloseTo(0.74, 9);
    expect(bandLabel(16.74)).toBe("Easy");
    expect(bandOf(12.75)).toBeCloseTo(0.75, 9);
    expect(bandLabel(12.75)).toBe("Medium");
    expect(bandOf(15.49)).toBeCloseTo(1.49, 9);
    expect(bandLabel(15.49)).toBe("Medium");
    expect(bandOf(15.5)).toBeCloseTo(1.5, 9);
    expect(bandLabel(15.5)).toBe("Hard");
  });
});

describe("criterion 3 — gradeLabel clamps at both ends of the 0-18 scale", () => {
  test("gradeLabel(0) is Kindergarten", () => {
    expect(gradeLabel(0)).toBe("Kindergarten");
  });

  test("gradeLabel(18) is 8th grade, though 18 derives grade 9", () => {
    expect(gradeOf(18)).toBe(9);
    expect(gradeLabel(18)).toBe("8th grade");
  });

  test("no level anywhere on or past the scale reads as undefined", () => {
    // The failure the criterion names: grade 9 is in neither the scale nor
    // gradeNames, so an unclamped index renders "undefined grade".
    for (const level of [0, 4.5, 16, 17.99, 18, 25]) {
      expect(gradeLabel(level)).not.toContain("undefined");
      expect(levelLabel(level)).not.toContain("undefined");
    }
  });

  test("a level below the scale is Kindergarten, not a negative index", () => {
    expect(gradeLabel(-2)).toBe("Kindergarten");
    expect(gradeLabel(-2)).not.toContain("undefined");
  });
});

describe("criterion 4 — the shared table agrees with the criteria, not just with the code", () => {
  // If the table were ever edited to match a broken implementation, both
  // suites that read it would go green together. These rows are pinned to the
  // values criteria 2 and 3 state instead.
  test("the rows on each band edge carry the labels criterion 2 names", () => {
    expect(rowFor(0.74).bandLabel).toBe("Easy");
    expect(rowFor(0.75).bandLabel).toBe("Medium");
    expect(rowFor(1.49).bandLabel).toBe("Medium");
    expect(rowFor(1.5).bandLabel).toBe("Hard");
    expect(rowFor(16.74).bandLabel).toBe("Easy");
    expect(rowFor(12.75).bandLabel).toBe("Medium");
  });

  test("the top and bottom rows carry the clamps criterion 3 names", () => {
    expect(rowFor(0).gradeLabel).toBe("Kindergarten");
    expect(rowFor(18).gradeLabel).toBe("8th grade");
    expect(rowFor(18).grade).toBe(9);
  });

  test("the table spans 0-18 and every row's display is its two labels joined", () => {
    const rows = labelRows();
    expect(Math.min(...rows.map((row) => row.level))).toBe(0);
    expect(Math.max(...rows.map((row) => row.level))).toBe(18);
    for (const row of rows) {
      expect(row.display).toBe(`${row.gradeLabel} · ${row.bandLabel}`);
    }
  });
});
