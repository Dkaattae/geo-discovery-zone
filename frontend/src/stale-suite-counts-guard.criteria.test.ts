import { afterAll, describe, expect, test } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * T-065's acceptance criteria, written by the tester (`process.md` step 4),
 * from `tasks/T-065-stale-suite-counts.md` — not from the worker's guard.
 *
 * Two kinds of check live here:
 *
 * - **Direct reads of the three documents** (criteria 1-5, 8, 9), with a count
 *   detector written by the tester in round 1, independently of the worker's
 *   round-1 `suiteCountPattern`. It tokenises and knows the whole family of
 *   English number words, not a fixed list that stops early. The worker's
 *   round-2 guard (`hasSuiteCountClaim`) adopted the same clause-and-token
 *   shape, so the two no longer disagree much; the harness below, which runs
 *   the guard itself against edited documents, is the independent signal.
 *
 * - **The guard, run against edited copies of the documents** (criteria 3, 6,
 *   7, 8). Criteria 6-8 are phrased as "with the file edited like this, a test
 *   fails / the suite stays green", so the executable form is exactly that: copy
 *   the worker's guard file and the documents it reads into a scratch tree,
 *   apply one edit, and run `bun test` on that copy in a subprocess. The guard
 *   file is the only test in `frontend/` that reads `PROGRESS.md`, so running it
 *   alone is what decides "at least one test fails" for these edits. The real
 *   repo files are never written.
 *
 * Local files and a local `bun` subprocess only. The subprocess runs with every
 * proxy variable pointed at a dead loopback port (`test-guidelines.md`, "No
 * network in tests, ever"), the same way CI runs the suites.
 */

const REPO_ROOT = join(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(join(REPO_ROOT, path), "utf8");

const guidelinesDoc = read("test-guidelines.md");
const progressDoc = read("PROGRESS.md");
const tasksDoc = read("tasks.md");

const HISTORY_HEADING = "\n## Completed tasks\n";

function splitProgress(doc: string): { status: string; history: string } {
  const at = doc.indexOf(HISTORY_HEADING);
  if (at < 0) throw new Error("PROGRESS.md has no '## Completed tasks' heading");
  return { status: doc.slice(0, at), history: doc.slice(at) };
}

// ---------------------------------------------------------------------------
// An independent detector: "<number> … tests" within a few words.
// ---------------------------------------------------------------------------

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
const SCALES = ["hundred", "thousand", "dozen"];
const NUMBER_WORDS = new Set([...UNITS, ...TENS, ...SCALES]);

/** True when a bare word (punctuation already stripped) states a number. */
function isNumberToken(word: string): boolean {
  if (/^\d[\d,]*$/.test(word)) return true;
  return word.split("-").every((part) => NUMBER_WORDS.has(part)) && word.length > 0;
}

/**
 * Clauses of markdown prose: a claim never spans a sentence end, a blank line,
 * or the start of a new list item, heading or table row.
 */
function clauses(text: string): string[] {
  return text.split(/[.!?;:](?=\s)|\n\s*\n|\n(?=\s*(?:[-*#|]|\d+\.)\s)/);
}

/**
 * Every clause of `text` that puts a number within four words before the plural
 * word "tests". The singular "a test" / "one test" is advice about one test,
 * not a suite size (criterion 9), so only the plural counts.
 */
function countClaims(text: string): string[] {
  const claims: string[] = [];
  for (const clause of clauses(text)) {
    const words = clause
      .split(/\s+/)
      .map((raw) => raw.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
      .filter((word) => word.length > 0);
    words.forEach((word, i) => {
      if (word !== "tests") return;
      for (let back = 1; back <= 5 && i - back >= 0; back++) {
        if (isNumberToken(words[i - back]!)) {
          claims.push(words.slice(i - back, i + 1).join(" "));
          return;
        }
      }
    });
  }
  return claims;
}

describe("the independent detector is not vacuous", () => {
  test("it finds counts in digits and in words, including tens and hundreds", () => {
    expect(countClaims("cd frontend && bun test    # 65 tests today")).toHaveLength(1);
    expect(countClaims("The nine Postgres-only tests skip.")).toHaveLength(1);
    expect(countClaims("The thirty black-box tests run over HTTP.")).toHaveLength(1);
    expect(countClaims("221 unit, endpoint and contract tests.")).toHaveLength(1);
  });

  test("it leaves singular advice and non-test numbers alone", () => {
    expect(countClaims("Every criterion gets at least one test, named so")).toEqual([]);
    expect(countClaims("One test, twelve assertions.")).toEqual([]);
    expect(countClaims("fifty states and nine regions")).toEqual([]);
  });

  test("it does not join a number to 'tests' across a sentence or list item", () => {
    expect(
      countClaims("rather than a page with a 200.\n- Unit and endpoint tests, including"),
    ).toEqual([]);
    expect(countClaims("instead of\n  twelve. Split by behaviour.\n- **Tests that depend")).toEqual(
      [],
    );
  });
});

// ---------------------------------------------------------------------------
// Criteria 1-5, 8, 9: the documents as they stand.
// ---------------------------------------------------------------------------

describe("criterion 1: test-guidelines.md states no number of tests", () => {
  test("no count-of-tests claim anywhere in the file", () => {
    expect(countClaims(guidelinesDoc)).toEqual([]);
  });

  test("the fenced bun test block still names both commands", () => {
    const heading = guidelinesDoc.indexOf("### `question-bank/` and `frontend/` — `bun test`");
    expect(heading).toBeGreaterThanOrEqual(0);
    const fence = guidelinesDoc.slice(heading).match(/```bash\n([\s\S]*?)```/);
    expect(fence).not.toBeNull();
    expect(fence![1]).toMatch(/cd question-bank\s+&&\s+bun test/);
    expect(fence![1]).toMatch(/cd frontend\s+&&\s+bun test/);
  });

  test("the two named stale comments are gone", () => {
    expect(guidelinesDoc).not.toContain("# 19 tests today");
    expect(guidelinesDoc).not.toContain("# 65 tests today");
  });
});

describe("criterion 2: PROGRESS.md above 'Completed tasks' states no number of tests", () => {
  const { status } = splitProgress(progressDoc);

  test("no count-of-tests claim above the heading", () => {
    expect(countClaims(status)).toEqual([]);
  });

  test("none of the specifically named figures survive above the heading", () => {
    for (const gone of [
      "same 221 tests",
      "221 unit and endpoint tests",
      "30 integration tests",
      "13 browser tests",
      "80 tests",
      "687 tests",
      "30 black-box tests",
      "13 Playwright tests",
    ]) {
      expect(status).not.toContain(gone);
    }
  });
});

describe("criterion 3: the Postgres-only figure is absent or equals test_postgres.py's count", () => {
  test("any number stated before 'Postgres-only' equals the number of test functions", () => {
    const { status } = splitProgress(progressDoc);
    const real = (read("backend/tests/test_postgres.py").match(/^(async )?def test_/gm) ?? [])
      .length;
    expect(real).toBeGreaterThan(0);
    const stated = [...status.matchAll(/(\S+)\s+Postgres-only/g)].map((m) => m[1]!.toLowerCase());
    for (const word of stated) {
      if (/^\d+$/.test(word)) expect(Number(word)).toBe(real);
      else if (UNITS.includes(word)) expect(UNITS.indexOf(word) + 1).toBe(real);
      // anything else ("with", "the") states no number, which criterion 3 allows
    }
  });
});

describe("criterion 4: only the numbers went, not the sentences", () => {
  const { status } = splitProgress(progressDoc);
  const paragraphs = status.split(/\n(?=- |\n)/);
  const somewhere = (...needles: (string | RegExp)[]) =>
    paragraphs.some((p) =>
      needles.every((n) => (typeof n === "string" ? p.includes(n) : n.test(p))),
    );

  test("backend/integration/ is still named where the integration tests are described", () => {
    expect(somewhere(/integration tests/i, "backend/integration/")).toBe(true);
  });

  test("e2e/ is still named where the browser tests are described", () => {
    expect(somewhere(/(browser|end-to-end|playwright)/i, "e2e/")).toBe(true);
  });

  test("the backend suite still runs against both SQLite and Postgres", () => {
    expect(somewhere("SQLite", "Postgres", /tested|suite/)).toBe(true);
  });

  test("the frontend suite still covers the API client and level→grade/band display", () => {
    expect(somewhere("API client", /level→grade\/band display/)).toBe(true);
  });
});

describe("criterion 5: tasks.md's §A table states no number of tests", () => {
  const start = tasksDoc.indexOf("## A. Foundations");
  const section = tasksDoc.slice(start, tasksDoc.indexOf("\n### ", start));
  const row = (label: string) =>
    section.split("\n").find((line) => line.startsWith(`| **${label}** |`));

  for (const [label, where] of [
    ["Unit and endpoint tests", /bun test|make -C backend/],
    ["Integration tests", /backend\/integration\//],
    ["End-to-end tests", /e2e\//],
  ] as const) {
    test(`the ${label} row carries none of 242, 184, 687, 30, 13 and still says where or how`, () => {
      expect(start).toBeGreaterThanOrEqual(0);
      const line = row(label);
      expect(line).toBeDefined();
      expect(line!.match(/\b(242|184|687|30|13)\b/g)).toBeNull();
      expect(countClaims(line!)).toEqual([]);
      expect(line).toMatch(where);
    });
  }
});

describe("criterion 8: the per-task history figures are still there", () => {
  test("T-001's, T-010's and T-014's figures read as before", () => {
    const { history } = splitProgress(progressDoc);
    expect(history).toContain("19 tests");
    expect(history).toContain("190 tests were added (19 → 209)");
    expect(history).toContain("200 tests");
  });
});

describe("criterion 9: the singular-test advice survives in test-guidelines.md", () => {
  for (const advice of [
    /at least one test/i,
    /exactly one test red/i,
    /one test, twelve assertions/i,
  ]) {
    test(`${advice} is still there`, () => {
      expect(guidelinesDoc).toMatch(advice);
    });
  }
});

describe("criterion 10: the two README detectors stay two", () => {
  test("testCountPattern and testCountClaims() are each defined in their own file, neither imported", () => {
    const conventions = read("frontend/src/conventions-doc.test.ts");
    const readmeCriteria = read("frontend/src/readme-test-count.criteria.test.ts");
    expect(conventions).toMatch(/const testCountPattern = new RegExp\(/);
    expect(readmeCriteria).toMatch(/function testCountClaims\(/);
    expect(conventions).not.toMatch(/from "\.\/readme-test-count/);
    expect(readmeCriteria).not.toMatch(/from "\.\/conventions-doc/);
  });
});

// ---------------------------------------------------------------------------
// Criteria 3, 6, 7, 8: the worker's guard, run against edited copies.
// ---------------------------------------------------------------------------

const GUARD = "frontend/src/stale-suite-counts.criteria.test.ts";
const GUARD_INPUTS = [
  "test-guidelines.md",
  "PROGRESS.md",
  "tasks.md",
  "backend/tests/test_postgres.py",
  // T-074: the guard now also reads these three READMEs.
  "backend/README.md",
  "backend/integration/README.md",
  "e2e/README.md",
];
const DEAD = "http://127.0.0.1:1";
const scratchRoots: string[] = [];

afterAll(() => {
  for (const root of scratchRoots) rmSync(root, { recursive: true, force: true });
});

/** Copy the guard and its inputs, apply `edit` to one input, run the guard; true if it passed. */
function guardPassesWith(file: string, edit: (text: string) => string): boolean {
  const root = mkdtempSync(join(tmpdir(), "t065-guard-"));
  scratchRoots.push(root);
  for (const path of [GUARD, ...GUARD_INPUTS]) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    copyFileSync(join(REPO_ROOT, path), join(root, path));
  }
  writeFileSync(join(root, file), edit(read(file)));
  const proxies = Object.fromEntries(
    ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY"].flatMap((v) => [
      [v, DEAD],
      [v.toLowerCase(), DEAD],
    ]),
  );
  const run = Bun.spawnSync([process.execPath, "test", `./${GUARD.replace("frontend/", "")}`], {
    cwd: join(root, "frontend"),
    env: { ...process.env, ...proxies },
    stdout: "pipe",
    stderr: "pipe",
  });
  return run.exitCode === 0;
}

const aboveHistory = (sentence: string) => (doc: string) => {
  const at = doc.indexOf(HISTORY_HEADING);
  return `${doc.slice(0, at)}\n${sentence}\n${doc.slice(at)}`;
};
const belowHistory = (sentence: string) => (doc: string) => {
  const at = doc.indexOf(HISTORY_HEADING) + HISTORY_HEADING.length;
  return `${doc.slice(0, at)}\n${sentence}\n${doc.slice(at)}`;
};

describe("the harness is not vacuous", () => {
  test("the guard passes on unedited copies", () => {
    expect(guardPassesWith("PROGRESS.md", (doc) => doc)).toBe(true);
  });
});

describe("criterion 6: a count restored to test-guidelines.md turns the guard red", () => {
  test("`cd frontend      && bun test    # 223 tests today` fails", () => {
    const edit = (doc: string) =>
      doc.replace(
        /^cd frontend {6}&& bun test$/m,
        "cd frontend      && bun test    # 223 tests today",
      );
    expect(edit(guidelinesDoc)).not.toBe(guidelinesDoc);
    expect(guardPassesWith("test-guidelines.md", edit)).toBe(false);
  });
});

describe("criterion 7: a count added above 'Completed tasks' turns the guard red, digits or words", () => {
  for (const sentence of [
    "The frontend suite has 9 tests.",
    "The frontend suite has nine tests.",
    // The integration suite is thirty tests today; spelled out, that is the
    // most natural way the old "30 black-box tests" comes back in words.
    "The integration suite has thirty tests.",
    "The backend suite has two hundred tests.",
    "The backend suite has a hundred tests.",
    // The sentence T-065 deleted from PROGRESS.md, with a list comma in it.
    "The backend has 221 unit, endpoint and contract tests.",
    // Round 2 additions: other ordinary ways a count gets written back.
    "The repo has twenty-one tests.",
    "The repo has eleven hundred tests.",
    "| Frontend | 286 tests |",
    "The frontend suite now runs **286** tests.",
    "The frontend suite runs 286\n  tests on every PR.",
  ]) {
    test(`"${sentence}" above the heading fails the guard`, () => {
      expect(guardPassesWith("PROGRESS.md", aboveHistory(sentence))).toBe(false);
    });
  }
});

describe("criterion 8: the same sentence below 'Completed tasks' leaves the guard green", () => {
  for (const sentence of [
    "The frontend suite has 9 tests.",
    "The frontend suite has nine tests.",
    "The integration suite has thirty tests.",
    "The backend has 221 unit, endpoint and contract tests.",
  ]) {
    test(`"${sentence}" below the heading passes the guard`, () => {
      expect(guardPassesWith("PROGRESS.md", belowHistory(sentence))).toBe(true);
    });
  }
});

describe("criterion 3: both halves of the either/or keep the guard green", () => {
  test("stating no Postgres-only number at all passes the guard", () => {
    const edit = (doc: string) =>
      doc.replace("with 9 Postgres-only checks", "with Postgres-only checks");
    expect(edit(progressDoc)).not.toBe(progressDoc);
    expect(guardPassesWith("PROGRESS.md", edit)).toBe(true);
  });

  test("stating a wrong Postgres-only number fails the guard", () => {
    const edit = (doc: string) =>
      doc.replace("with 9 Postgres-only checks", "with 8 Postgres-only checks");
    expect(guardPassesWith("PROGRESS.md", edit)).toBe(false);
  });

  test("stating the right Postgres-only number in words passes the guard", () => {
    const edit = (doc: string) =>
      doc.replace("with 9 Postgres-only checks", "with nine Postgres-only checks");
    expect(edit(progressDoc)).not.toBe(progressDoc);
    expect(guardPassesWith("PROGRESS.md", edit)).toBe(true);
  });

  test("stating a wrong Postgres-only number in words fails the guard", () => {
    const edit = (doc: string) =>
      doc.replace("with 9 Postgres-only checks", "with twelve Postgres-only checks");
    expect(guardPassesWith("PROGRESS.md", edit)).toBe(false);
  });
});
