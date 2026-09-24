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
 * Round 2 (tester verdict, `tasks/T-065-stale-suite-counts.md`): round 1's
 * regex-only detector missed spelled-out counts past "twenty" ("thirty
 * tests", "a hundred tests") and a count with a list comma in it ("221 unit,
 * endpoint and contract tests"), because a fixed-length `\s+word` regex chain
 * can't cross a comma or a number word it never listed. It also flagged
 * `PROGRESS.md:57`'s "no number stated" case as a mismatch, because its
 * Postgres-only regex captured *any* preceding word (`with`, `the`) as if it
 * were the number, rather than only a token that actually is one. Both are
 * fixed below by scanning tokenised clauses for a genuine number token —
 * digit or word, no fixed word-count ceiling — rather than matching a rigid
 * regex shape.
 *
 * Local file reads only; no network (`test-guidelines.md`, "No network in
 * tests, ever").
 */

const REPO_ROOT = join(import.meta.dirname, "../..");
const guidelinesDoc = readFileSync(join(REPO_ROOT, "test-guidelines.md"), "utf8");
const progressDoc = readFileSync(join(REPO_ROOT, "PROGRESS.md"), "utf8");
const tasksDoc = readFileSync(join(REPO_ROOT, "tasks.md"), "utf8");
const postgresTestSource = readFileSync(join(REPO_ROOT, "backend/tests/test_postgres.py"), "utf8");

// Number-word vocabulary: units one-nineteen, tens, and the scale words that
// turn a two-word numeral into "hundred"/"thousand" tests. A compound like
// "two hundred" or "twenty-one" is recognised because at least one of its
// parts is in this set — the scanner below only needs one number token
// inside its window, not a full numeral parse.
const UNITS = [
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
];
const TENS = ["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES = ["hundred", "thousand"];
const NUMBER_WORDS = new Set([...UNITS, ...TENS, ...SCALES]);

/** True when a bare, punctuation-stripped word states some number, digit or spelled out. */
function isNumberToken(word: string): boolean {
  if (word.length === 0) return false;
  if (/^\d[\d,]*$/.test(word)) return true;
  return word.split("-").every((part) => NUMBER_WORDS.has(part));
}

/** The number a single digit token or a single unit/tens word states, or `null`. */
function numberIn(word: string): number | null {
  const clean = word.replace(/,/g, "");
  if (/^\d+$/.test(clean)) return Number(clean);
  const unitIndex = UNITS.indexOf(word);
  if (unitIndex >= 0) return unitIndex + 1;
  const tensIndex = TENS.indexOf(word);
  if (tensIndex >= 0) return (tensIndex + 2) * 10;
  return null;
}

/**
 * Split prose into clauses that a claim cannot cross: a sentence end, a
 * blank line, or the start of a new list item, heading or table row. Without
 * this, a number that ends one bullet reads as if it modified an unrelated
 * "tests" that starts the next — exactly the shape both `test-guidelines.md`
 * ("...twelve. Split by behaviour.\n- **Tests that depend...") and
 * `PROGRESS.md` ("...an HTML page with a 200.\n- Unit and endpoint tests...")
 * carry today.
 */
function clauses(text: string): string[] {
  return text.split(/[.!?;:](?=\s)|\n\s*\n|\n(?=\s*(?:[-*#|]|\d+\.)\s)/);
}

/**
 * True when some clause of `text` puts a number — digit or spelled out, of
 * any size — within a few words before the *plural* word "tests". Plural
 * only: `test-guidelines.md`'s own advice uses the singular ("at least one
 * test", "exactly one test red", "One test, twelve assertions") to talk about
 * a single test, not a suite's size, and criterion 9 requires those three to
 * survive untouched. There is no fixed-length regex chain here, so a list
 * comma between the number and "tests" ("221 unit, endpoint and contract
 * tests") does not break the scan the way it broke round 1's regex.
 */
function hasSuiteCountClaim(text: string): boolean {
  for (const clause of clauses(text)) {
    const words = clause
      .split(/\s+/)
      .map((raw) => raw.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
      .filter((word) => word.length > 0);
    for (let i = 0; i < words.length; i++) {
      if (words[i] !== "tests") continue;
      for (let back = 1; back <= 5 && i - back >= 0; back++) {
        if (isNumberToken(words[i - back]!)) return true;
      }
    }
  }
  return false;
}

/** Actual number of test functions in `backend/tests/test_postgres.py`. */
function postgresTestFunctionCount(): number {
  return (postgresTestSource.match(/^(async )?def test_/gm) ?? []).length;
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
    expect(hasSuiteCountClaim(guidelinesDoc)).toBe(false);
  });

  test("the detector is not vacuous: it catches the comments test-guidelines.md used to carry", () => {
    expect(hasSuiteCountClaim("cd question-bank && bun test    # 19 tests today")).toBe(true);
    expect(hasSuiteCountClaim("cd frontend      && bun test    # 65 tests today")).toBe(true);
  });

  test("it also catches counts a fixed-length regex chain would miss (T-065 criterion 7)", () => {
    // Words past "twenty": tens, "a hundred", "two hundred".
    expect(hasSuiteCountClaim("cd frontend && bun test    # nine tests today")).toBe(true);
    expect(hasSuiteCountClaim("The integration suite has thirty tests.")).toBe(true);
    expect(hasSuiteCountClaim("The backend suite has a hundred tests.")).toBe(true);
    expect(hasSuiteCountClaim("The backend suite has two hundred tests.")).toBe(true);
    // A comma-separated list between the number and "tests" — the exact
    // sentence T-065 deleted from PROGRESS.md.
    expect(hasSuiteCountClaim("The backend has 221 unit, endpoint and contract tests.")).toBe(true);
    // A digit numeral with a thousands comma in it.
    expect(hasSuiteCountClaim("1,131 tests across the repo.")).toBe(true);
  });

  test("criterion 9: the three singular 'a test' pieces of advice survive, untouched by the detector", () => {
    const advice = ["at least one test", "exactly one test red", "One test, twelve assertions"];
    for (const phrase of advice) {
      expect(guidelinesDoc).toContain(phrase);
      expect(hasSuiteCountClaim(phrase)).toBe(false);
    }
  });

  test("a number does not carry forward from an unrelated, earlier bullet or sentence (T-065 criterion 7 regression)", () => {
    // The shape both real docs carry today: a number ends one clause, an
    // unrelated plural "tests" opens the next.
    expect(
      hasSuiteCountClaim(
        "...rather than an HTML page with a 200.\n- Unit and endpoint tests, including",
      ),
    ).toBe(false);
    expect(
      hasSuiteCountClaim(
        "**One test, twelve assertions.** When it fails you learn one thing instead of\n  twelve. Split by behaviour.\n- **Tests that depend on each other's order.**",
      ),
    ).toBe(false);
  });
});

describe("PROGRESS.md states no suite-size count above 'Completed tasks' (T-065 criteria 2, 4, 7)", () => {
  test("no digit or spelled-out suite-size claim survives above the heading", () => {
    expect(hasSuiteCountClaim(progressStatus())).toBe(false);
  });

  test("the detector is not vacuous: it catches sentences PROGRESS.md used to state", () => {
    expect(hasSuiteCountClaim("the same 221 tests run against either")).toBe(true);
    expect(hasSuiteCountClaim("687 tests (19 pre-existing, 190 added by T-010")).toBe(true);
    expect(hasSuiteCountClaim("30 black-box tests over HTTP")).toBe(true);
    expect(hasSuiteCountClaim("13 Playwright tests")).toBe(true);
  });

  test("it also catches a spelled-out count above the heading, including past twenty and with a list comma", () => {
    expect(hasSuiteCountClaim("the frontend suite now runs nine tests")).toBe(true);
    expect(hasSuiteCountClaim("the integration suite is thirty tests today")).toBe(true);
    expect(hasSuiteCountClaim("the backend has a hundred tests")).toBe(true);
    expect(
      hasSuiteCountClaim("221 unit, endpoint and contract tests plus 30 integration tests"),
    ).toBe(true);
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
  test("'Postgres-only' is still mentioned above the heading", () => {
    expect(progressStatus()).toMatch(/Postgres-only\b/i);
  });

  test("a digit or number word immediately before 'Postgres-only' equals the real count; anything else states no number, which criterion 3 also allows", () => {
    const match = progressStatus().match(/(\S+)\s+Postgres-only\b/i);
    expect(match).not.toBeNull();
    const word = match![1]!.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
    const stated = numberIn(word);
    if (stated === null) {
      // e.g. "with Postgres-only checks" — no number stated at all, the
      // other half of criterion 3's "either/or". A non-number word like
      // "with" must NOT be mistaken for the count.
      return;
    }
    expect(stated).toBe(postgresTestFunctionCount());
  });

  test("the detector is not vacuous: a wrong number before 'Postgres-only' would not equal the real count", () => {
    expect(numberIn("eight")).not.toBe(postgresTestFunctionCount());
    expect(numberIn("8")).not.toBe(postgresTestFunctionCount());
  });

  test("a genuinely non-numeric word before 'Postgres-only' states no number", () => {
    expect(numberIn("with")).toBeNull();
    expect(numberIn("the")).toBeNull();
  });

  test("the real count this criterion binds against is nonzero", () => {
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
      expect(hasSuiteCountClaim(row ?? "")).toBe(false);
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
