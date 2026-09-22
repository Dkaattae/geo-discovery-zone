import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-065's acceptance criteria, written out as assertions by the verifying
 * session (`process.md` step 4).
 *
 * T-065's route is deletion, not refresh: `test-guidelines.md`, `PROGRESS.md`
 * (above its "Completed tasks" history) and `tasks.md`'s §A Foundations table
 * no longer state how many tests any suite has, because the same handful of
 * figures had gone stale eleven, five and eight times respectively. This file
 * is the guard behind that deletion — it fails if any of the three states a
 * suite-size count again, so the next brief that is tempted to write one in
 * finds out before it merges rather than the twelfth time someone notices by
 * hand.
 *
 * Every expected value here comes from the wording of a criterion in
 * `tasks/T-065-stale-suite-counts.md`, or from a repo file a criterion names
 * as the authority (`backend/tests/test_postgres.py` for how many
 * Postgres-only tests actually exist). None of it was read out of the three
 * guarded docs themselves — those are the things under test.
 *
 * This is a new, independent detector, not a rename of either README
 * detector in `conventions-doc.test.ts` or `readme-test-count.criteria.test.ts`
 * — criterion 10 keeps those two as they are, and this file guards three
 * different documents that neither of them reads.
 *
 * Local file reads only; no network (`test-guidelines.md`, "No network in
 * tests, ever").
 */

const REPO_ROOT = join(import.meta.dirname, "../..");
const guidelinesDoc = readFileSync(join(REPO_ROOT, "test-guidelines.md"), "utf8");
const progressDoc = readFileSync(join(REPO_ROOT, "PROGRESS.md"), "utf8");
const tasksDoc = readFileSync(join(REPO_ROOT, "tasks.md"), "utf8");
const postgresTestSource = readFileSync(join(REPO_ROOT, "backend/tests/test_postgres.py"), "utf8");

const NUMBER_WORDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

/**
 * A claim that a suite has some number of tests — a digit or spelled-out
 * number, then the *plural* word "tests" within a few words. Deliberately
 * plural-only: `test-guidelines.md`'s own advice uses the singular ("at least
 * one test", "exactly one test red", "One test, twelve assertions") to talk
 * about a single test, not a suite's size, and criterion 9 requires those
 * three to survive untouched. Requiring "tests" rather than "tests?" is what
 * keeps this pattern from ever looking at them — see the "distinguishes
 * advice from a count" test below, which pins that on purpose rather than by
 * accident.
 */
// No "g" flag: `toMatch()` runs this through `RegExp.prototype.test()`, which
// advances a global/sticky regex's `lastIndex` across calls — the same shared
// object is reused by every `test()` below, and a global flag here made the
// second `.toMatch()` call in a block silently start mid-string and miss.
const suiteCountPattern = new RegExp(
  `\\b(?:\\d+|${NUMBER_WORDS.join("|")})\\b(?:\\s+[a-zA-Z][a-zA-Z-]*){0,3}\\s+tests\\b`,
  "i",
);

/** The number a token states, digits or spelled out, or `null` if it is not one. */
function numberIn(token: string): number | null {
  const word = token.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (/^\d+$/.test(word)) return Number(word);
  const index = NUMBER_WORDS.indexOf(word);
  return index < 0 ? null : index + 1;
}

/** Actual number of test functions in `backend/tests/test_postgres.py`. */
function postgresTestFunctionCount(): number {
  return (postgresTestSource.match(/^def test_/gm) ?? []).length;
}

const COMPLETED_TASKS_HEADING = "## Completed tasks";

/** PROGRESS.md content above the "Completed tasks" heading — the live status, not the log. */
function progressStatus(): string {
  const index = progressDoc.indexOf(`\n${COMPLETED_TASKS_HEADING}`);
  if (index < 0) throw new Error(`PROGRESS.md has no "${COMPLETED_TASKS_HEADING}" heading`);
  return progressDoc.slice(0, index);
}

/** PROGRESS.md content from the "Completed tasks" heading onward — the per-PR history. */
function progressHistory(): string {
  const index = progressDoc.indexOf(`\n${COMPLETED_TASKS_HEADING}`);
  if (index < 0) throw new Error(`PROGRESS.md has no "${COMPLETED_TASKS_HEADING}" heading`);
  return progressDoc.slice(index);
}

const FOUNDATIONS_HEADING = "## A. Foundations";

/** The `## A. Foundations` table in `tasks.md`, up to the next `### ` heading. */
function foundationsSection(): string {
  const start = tasksDoc.indexOf(FOUNDATIONS_HEADING);
  if (start < 0) throw new Error(`tasks.md has no "${FOUNDATIONS_HEADING}" heading`);
  const rest = tasksDoc.slice(start + 1);
  const nextHeading = rest.match(/\n### /);
  const end = nextHeading ? start + 1 + nextHeading.index! : tasksDoc.length;
  return tasksDoc.slice(start, end);
}

/** The Foundations table row whose first cell is `**label**`. */
function foundationsRow(label: string): string | undefined {
  return foundationsSection()
    .split("\n")
    .find((line) => line.includes(`**${label}**`));
}

describe("test-guidelines.md states no suite-size count (T-065 criteria 1, 6, 9)", () => {
  test("both test commands are still named", () => {
    expect(guidelinesDoc).toMatch(/cd\s+question-bank\s+&&\s+bun\s+test\b/);
    expect(guidelinesDoc).toMatch(/cd\s+frontend\s+&&\s+bun\s+test\b/);
  });

  test("no digit or spelled-out suite-size claim survives anywhere in test-guidelines.md", () => {
    expect(guidelinesDoc.match(suiteCountPattern)).toBeNull();
  });

  test("the pattern is not vacuous: it matches the comments test-guidelines.md used to carry", () => {
    expect("cd question-bank && bun test    # 19 tests today").toMatch(suiteCountPattern);
    expect("cd frontend      && bun test    # 65 tests today").toMatch(suiteCountPattern);
  });

  test("the pattern also catches a spelled-out count, not only digits", () => {
    expect("cd frontend && bun test    # nine tests today").toMatch(suiteCountPattern);
  });

  test("criterion 9: the three singular 'a test' pieces of advice survive, untouched by the guard", () => {
    const advice = ["at least one test", "exactly one test red", "One test, twelve assertions"];
    for (const phrase of advice) {
      expect(guidelinesDoc).toContain(phrase);
      expect(phrase).not.toMatch(suiteCountPattern);
    }
  });
});

describe("PROGRESS.md states no suite-size count above 'Completed tasks' (T-065 criteria 2, 4, 7)", () => {
  test("no digit or spelled-out suite-size claim survives above the heading", () => {
    expect(progressStatus().match(suiteCountPattern)).toBeNull();
  });

  test("the pattern is not vacuous: it matches sentences PROGRESS.md used to state", () => {
    expect("the same 221 tests run against either").toMatch(suiteCountPattern);
    expect("687 tests (19 pre-existing, 190 added by T-010").toMatch(suiteCountPattern);
    expect("30 black-box tests over HTTP").toMatch(suiteCountPattern);
  });

  test("the pattern also catches a spelled-out count above the heading, not only digits", () => {
    expect("the frontend suite now runs nine tests").toMatch(suiteCountPattern);
  });

  test("criterion 4: the backend suite is still said to run against SQLite and Postgres", () => {
    expect(progressStatus()).toMatch(/SQLite and Postgres both supported and both tested/);
  });

  test("criterion 4: backend/integration/ is still named as where the integration tests live", () => {
    expect(progressStatus()).toContain("backend/integration/");
  });

  test("criterion 4: e2e/ is still named as where the browser tests live", () => {
    expect(progressStatus()).toMatch(/`e2e\/`/);
  });

  test("criterion 4: the frontend suite is still said to cover the API client and level/grade display", () => {
    expect(progressStatus()).toMatch(/API client/);
    expect(progressStatus()).toMatch(/level.{0,3}grade.{0,3}band display/);
  });
});

describe("PROGRESS.md:57's Postgres-only count matches reality, or states none (T-065 criterion 3)", () => {
  test("the number before 'Postgres-only', if any, equals the real count of test functions", () => {
    const match = progressStatus().match(/\b([a-zA-Z]+|\d+)\s+Postgres-only\b/i);
    if (match === null) {
      // No number stated at all is the other half of criterion 3's "either/or".
      expect(match).toBeNull();
      return;
    }
    expect(numberIn(match[1]!)).toBe(postgresTestFunctionCount());
  });

  test("the real count this criterion binds against is what it was surveyed as", () => {
    // Guards the test above against a vacuous pass if test_postgres.py ever
    // lost every `def test_` function.
    expect(postgresTestFunctionCount()).toBeGreaterThan(0);
  });
});

describe("PROGRESS.md's history below 'Completed tasks' is untouched (T-065 criterion 8)", () => {
  test("the guard does not scan the history section at all", () => {
    // Sanity check on the split point itself, not a claim that the guard
    // would pass there too — criterion 8 says the per-task figures below the
    // heading are historical facts and must keep stating their numbers.
    expect(progressStatus().length + progressHistory().length).toBe(progressDoc.length);
  });

  test("T-001's, T-010's and T-014's figures are still there, unchanged", () => {
    expect(progressHistory()).toContain("19 tests");
    expect(progressHistory()).toContain("190 tests were added (19 → 209)");
    expect(progressHistory()).toContain("200 tests");
  });
});

describe("tasks.md's §A Foundations table states no suite-size count (T-065 criterion 5)", () => {
  const rows: Record<string, string | undefined> = {
    "Unit and endpoint tests": foundationsRow("Unit and endpoint tests"),
    "Integration tests": foundationsRow("Integration tests"),
    "End-to-end tests": foundationsRow("End-to-end tests"),
  };
  const staleFigures = ["242", "184", "687", "30", "13"];

  for (const [label, row] of Object.entries(rows)) {
    test(`the "${label}" row exists`, () => {
      expect(row).toBeDefined();
    });

    test(`the "${label}" row carries none of the old figures`, () => {
      for (const figure of staleFigures) {
        expect(row).not.toMatch(new RegExp(`\\b${figure}\\b`));
      }
    });
  }

  test("the Unit and endpoint tests row still names how to run each suite", () => {
    expect(rows["Unit and endpoint tests"]).toMatch(/backend/);
    expect(rows["Unit and endpoint tests"]).toMatch(/frontend/);
    expect(rows["Unit and endpoint tests"]).toMatch(/question-bank/);
  });

  test("the Integration tests row still names backend/integration/", () => {
    expect(rows["Integration tests"]).toContain("backend/integration/");
  });

  test("the End-to-end tests row still names e2e/", () => {
    expect(rows["End-to-end tests"]).toContain("e2e/");
  });
});
