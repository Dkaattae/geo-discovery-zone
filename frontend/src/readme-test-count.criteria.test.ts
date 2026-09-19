import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-062's acceptance criteria, written out as assertions by the verifying
 * session (`process.md` step 4).
 *
 * Every expected value here comes from the wording of a criterion in
 * `tasks/T-062-readme-test-count.md`, or from the repo file a criterion names
 * as the authority (`backend/tests/test_postgres.py` for how many
 * Postgres-only tests there actually are). None of it was read out of
 * `README.md` or out of the guard in `conventions-doc.test.ts`: those are the
 * things under test, and taking an expectation from either would only ratify
 * whatever it happens to say.
 *
 * The count detector below is deliberately a second, independently written
 * implementation of "a number, then the word test(s) a few words later" — it
 * tokenises rather than pattern-matching a whole phrase — so that it can
 * disagree with the guard it is checking alongside.
 *
 * T-061 criterion 11 reviewed this pair against `conventions-doc.test.ts`'s
 * `testCountPattern` and kept both, for the reason above; see
 * `conventions-doc.test.ts`'s "no unstated test-suite size" describe block for
 * the full note and the matching non-vacuous test it added there.
 *
 * Local file reads only; no network (`test-guidelines.md`, "No network in
 * tests, ever").
 */

const REPO_ROOT = join(import.meta.dirname, "../..");
const readmeDoc = readFileSync(join(REPO_ROOT, "README.md"), "utf8");
const postgresTests = readFileSync(join(REPO_ROOT, "backend/tests/test_postgres.py"), "utf8");

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

/** The number a token states, digits or spelled out, or `null` if it is not one. */
function numberIn(token: string): number | null {
  const word = token.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (/^\d+$/.test(word)) return Number(word);
  const spelled = NUMBER_WORDS.indexOf(word);
  return spelled < 0 ? null : spelled + 1;
}

/**
 * Every "<number> … test(s)" claim in `text`: a number token with the word
 * `test` or `tests` no more than three words after it. Criterion 2's negative
 * case ("nine states") has no `test(s)` anywhere near the number, so it is not
 * a claim about a count of tests and is not reported.
 */
function testCountClaims(text: string): { count: number; phrase: string }[] {
  const tokens = text.split(/\s+/).filter((token) => token.length > 0);
  const claims: { count: number; phrase: string }[] = [];
  for (const [index, token] of tokens.entries()) {
    const count = numberIn(token);
    if (count === null) continue;
    const following = tokens.slice(index + 1, index + 5);
    const at = following.findIndex((word) => /^tests?\b/i.test(word.replace(/[^a-z]/gi, "")));
    if (at < 0) continue;
    claims.push({ count, phrase: tokens.slice(index, index + at + 2).join(" ") });
  }
  return claims;
}

/** Actual number of test functions in `backend/tests/test_postgres.py`. */
function postgresTestFunctionCount(): number {
  return (postgresTests.match(/^def test_/gm) ?? []).length;
}

/** The body of a `## Heading` section, to the next heading of the same or higher level. */
function sectionOf(text: string, heading: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start < 0) throw new Error(`README has no "${heading}" heading`);
  const level = heading.match(/^#+/)![0].length;
  const body: string[] = [];
  let inFence = false;
  for (const line of lines.slice(start + 1)) {
    if (/^```/.test(line)) inFence = !inFence;
    const hashes = inFence ? null : line.match(/^(#+)\s/);
    if (hashes && hashes[1]!.length <= level) break;
    body.push(line);
  }
  return body.join("\n");
}

/** A section with its fenced code blocks stripped out — the prose only. */
function proseOf(section: string): string {
  return section
    .split("\n")
    .reduce<{ inFence: boolean; lines: string[] }>(
      (state, line) => {
        if (/^```/.test(line)) return { inFence: !state.inFence, lines: state.lines };
        if (!state.inFence) state.lines.push(line);
        return state;
      },
      { inFence: false, lines: [] },
    )
    .lines.join("\n");
}

describe("criterion 1: no count of tests in README.md survives unpinned (T-062)", () => {
  test("every count-of-tests claim in README.md matches backend/tests/test_postgres.py", () => {
    const wrong = testCountClaims(readmeDoc).filter(
      (claim) => claim.count !== postgresTestFunctionCount(),
    );
    expect(wrong).toEqual([]);
  });

  // Criterion 1 allows either route — drop the number or pin it — and the
  // route taken was to drop it. The test above is the one that binds under
  // either route; this one records the route actually shipped, and would need
  // rewriting (not deleting) if a later task chose to pin a count instead.
  test("the route taken: README.md states no count of tests at all", () => {
    expect(testCountClaims(readmeDoc)).toEqual([]);
  });

  test("the detector is not vacuous: it reports the count README.md used to state", () => {
    const claims = testCountClaims("The nine Postgres-only tests skip on SQLite, so nobody");
    expect(claims.map((claim) => claim.count)).toEqual([9]);
  });
});

describe("criterion 2: the guard reaches the whole file, words as well as digits (T-062)", () => {
  // Criterion 2 is about the guard's *reach*, not about what README.md says
  // today, so each case is a synthetic document shaped like README — a Checks
  // section with a fenced block and prose under it, and a second section — with
  // the criterion's sentence dropped into one position. Building these from a
  // skeleton rather than from `readmeDoc` keeps them from double-reporting
  // whatever the real file happens to contain.
  const sentence = (number: string) => `The ${number} Postgres-only tests skip on SQLite.`;
  const skeleton = (checksProse: string, layoutProse: string, inFence: string) =>
    [
      "# Geo quiz",
      "",
      "## Checks",
      "",
      "```bash",
      "make -C backend check",
      inFence,
      "```",
      "",
      checksProse,
      "",
      "## Layout",
      "",
      layoutProse,
      "",
    ].join("\n");

  const counts = (doc: string) => testCountClaims(doc).map((claim) => claim.count);

  test("a document with no count of tests anywhere is clean", () => {
    expect(
      counts(skeleton("The Postgres-only tests skip on SQLite.", "One directory per app.", "")),
    ).toEqual([]);
  });

  for (const number of ["eleven", "11"]) {
    test(`"The ${number} Postgres-only tests" is caught in the Checks prose`, () => {
      expect(counts(skeleton(sentence(number), "One directory per app.", ""))).toEqual([11]);
    });

    test(`"The ${number} Postgres-only tests" is caught in a different section`, () => {
      expect(
        counts(skeleton("The Postgres-only tests skip on SQLite.", sentence(number), "")),
      ).toEqual([11]);
    });

    test(`"The ${number} Postgres-only tests" is caught inside a fenced block too`, () => {
      expect(
        counts(
          skeleton(
            "The Postgres-only tests skip on SQLite.",
            "One directory per app.",
            `# ${sentence(number)}`,
          ),
        ),
      ).toEqual([11]);
    });
  }

  test("a spelled-out number in a sentence that is not about tests is left alone", () => {
    expect(
      counts(
        skeleton(
          "The Postgres-only tests skip on SQLite.",
          "The quiz covers nine states today.",
          "",
        ),
      ),
    ).toEqual([]);
  });
});

describe("criterion 3: the reason a reader needs that sentence survives (T-062)", () => {
  const checks = () => sectionOf(readmeDoc, "## Checks");

  test("the Checks section still says the Postgres-only tests skip on SQLite", () => {
    expect(proseOf(checks())).toMatch(/postgres[^.\n]*\bskip\b[^.\n]*\bSQLite\b/i);
  });

  test("the Checks section still says no database has to be installed for `make -C backend check`", () => {
    expect(proseOf(checks())).toMatch(
      /\b(nobody needs|no one needs|without)\b[^.\n]*\bdatabase\b[^.]*installed/i,
    );
  });

  test("the literal string `make -C backend check` stays in the Checks section", () => {
    expect(checks()).toContain("make -C backend check");
  });

  test("the GEO_TEST_DATABASE_URL override sentence above it is intact", () => {
    const prose = proseOf(checks());
    expect(prose).toContain("GEO_TEST_DATABASE_URL=postgresql+psycopg://");
    expect(prose).toMatch(/override the default/i);
    expect(prose).toContain("make -C backend test-postgres");
  });

  test("the skip-on-SQLite claim README makes is true of backend/tests/test_postgres.py", () => {
    expect(postgresTests).toMatch(/dialect\.name\s*!=\s*"postgresql"/);
    expect(postgresTests).toMatch(/pytest\.skip\(/);
  });
});
