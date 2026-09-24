import { afterAll, describe, expect, test } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * T-074's acceptance criteria, written by the tester (`process.md` step 4) from
 * `tasks/T-074-readme-suite-counts.md` — not from the worker's guard.
 *
 * - **Direct reads** of the three READMEs and PROGRESS.md (criteria 1-8, 15,
 *   17), with a count-claim detector written here from the brief's
 *   "Count claim" definition. It is a verifying detector, which criterion 12
 *   explicitly allows; the guard itself must not grow a second one.
 * - **The guard run against edited copies** (criteria 9-11, 13-16): copy the
 *   guard and every file it reads into a scratch tree, apply one edit, run
 *   `bun test` on the guard there. The real repo files are never written.
 *
 * The subprocess runs with every proxy variable pointed at a dead loopback
 * port (criterion 21; `test-guidelines.md`, "No network in tests, ever").
 */

const REPO_ROOT = join(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(join(REPO_ROOT, path), "utf8");

const BACKEND = "backend/README.md";
const INTEGRATION = "backend/integration/README.md";
const E2E = "e2e/README.md";
const READMES = [BACKEND, INTEGRATION, E2E];

// ---------------------------------------------------------------------------
// Independent detector, from the brief's definition of "count claim".
// ---------------------------------------------------------------------------

const UNITS = [
  "zero",
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

function isNumber(token: string): boolean {
  const t = token.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
  if (t === "") return false;
  if (/^\d{1,3}(,\d{3})+$/.test(t) || /^\d+$/.test(t)) return true;
  return t.split("-").every((part) => NUMBER_WORDS.has(part));
}

/** Split into clauses: sentence ends, blank lines, list items, headings, table rows. */
function clauseList(text: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of text.split("\n")) {
    const starts = /^\s*$/.test(line) || /^\s*([-*+]|\d+\.)\s|^\s*#|^\s*\|/.test(line);
    if (starts && current.length) {
      blocks.push(current.join(" "));
      current = [];
    }
    if (!/^\s*$/.test(line)) current.push(line);
  }
  if (current.length) blocks.push(current.join(" "));
  return blocks.flatMap((b) => b.split(/[.!?](?=\s|$)/));
}

function countClaims(text: string): string[] {
  const found: string[] = [];
  for (const clause of clauseList(text)) {
    const words = clause.split(/\s+/).filter(Boolean);
    words.forEach((w, i) => {
      if (w.toLowerCase().replace(/[^a-z]/g, "") !== "tests") return;
      if (words.slice(Math.max(0, i - 5), i).some(isNumber)) found.push(clause.trim());
    });
  }
  return found;
}

describe("the tester's detector is not vacuous", () => {
  test("it finds the claims the brief says were there, and spelled-out or list-comma ones", () => {
    for (const s of [
      "make -C backend test             # 221 tests on SQLite (9 Postgres-only ones skip)",
      "28 tests that talk to a running server over HTTP",
      "That is the right shape for\n221 tests and it is",
      "23 tests pass that way; the 5 restart tests skip",
      "13 Playwright tests that drive Chromium",
      "The suite has thirty tests.",
      "The suite has twenty-one tests.",
      "The suite has 221 unit, endpoint and contract tests.",
      "The suite has 1,204 tests.",
      "## Two things these tests found",
    ]) {
      expect(countClaims(s)).not.toEqual([]);
    }
  });

  test("it leaves singular prose and cross-clause numbers alone", () => {
    for (const s of [
      "That is why it is one test with a loop rather",
      "**Every test makes its own account.**",
      "There are 3 regions. The tests pass.",
      "- 5 things\n- tests run",
      "15 states and 26 questions",
    ]) {
      expect(countClaims(s)).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// Criteria 1-8: the READMEs as committed.
// ---------------------------------------------------------------------------

const before = (doc: string, marker: string) => doc.slice(0, doc.indexOf(marker));
const section = (doc: string, heading: string) => {
  const start = doc.indexOf(`\n${heading}\n`);
  expect(start).toBeGreaterThanOrEqual(0);
  const rest = doc.slice(start + heading.length + 2);
  const end = rest.search(/\n## /);
  return end < 0 ? rest : rest.slice(0, end);
};

describe("criterion 1: backend/README.md contains no count claim", () => {
  test("no count claim anywhere", () => {
    expect(countClaims(read(BACKEND))).toEqual([]);
  });
});

describe("criterion 2: backend/README.md states no number of Postgres-only tests", () => {
  test("no 'Postgres-only' has a digit or number word immediately before it", () => {
    const doc = read(BACKEND);
    const before = [...doc.matchAll(/(\S+)\s+Postgres-only/g)].map((m) => m[1]!);
    for (const word of before) expect(isNumber(word)).toBe(false);
  });
});

describe("criterion 3: backend/README.md's first command block keeps its five targets", () => {
  const doc = read(BACKEND);
  const block = doc.slice(doc.indexOf("```bash"), doc.indexOf("```", doc.indexOf("```bash") + 3));
  test("the five make targets are named in the first bash block", () => {
    for (const target of [
      "make -C backend dev",
      "make -C backend test",
      "make -C backend test-postgres",
      "make -C backend test-integration",
      "make -C backend check",
    ]) {
      expect(block).toContain(target);
    }
  });
  test("the `make -C backend test` line still says SQLite and skip", () => {
    const line = block.split("\n").find((l) => /make -C backend test\s/.test(l));
    expect(line).toBeDefined();
    expect(line).toContain("SQLite");
    expect(line).toContain("skip");
  });
});

describe("criterion 4: backend/integration/README.md contains no count claim", () => {
  test("no count claim anywhere", () => {
    expect(countClaims(read(INTEGRATION))).toEqual([]);
  });
});

describe("criterion 5: backend/integration/README.md keeps what those sentences said", () => {
  const doc = read(INTEGRATION);
  test("the intro still says `over HTTP` and ``never import `app` ``", () => {
    const intro = before(doc, "\n## ");
    expect(intro).toContain("over HTTP");
    expect(intro).toContain("never import `app`");
  });
  test("Known limits still says `restart tests` and `skip`", () => {
    const limits = section(doc, "## Known limits");
    expect(limits).toContain("restart tests");
    expect(limits).toContain("skip");
  });
});

describe("criterion 6: e2e/README.md contains no count claim", () => {
  test("no count claim anywhere", () => {
    expect(countClaims(read(E2E))).toEqual([]);
  });
});

describe("criterion 7: e2e/README.md keeps what that sentence said", () => {
  test("the intro still says Playwright and Chromium", () => {
    const intro = before(read(E2E), "\n## ");
    expect(intro).toContain("Playwright");
    expect(intro).toContain("Chromium");
  });
});

describe("criterion 8: the singular prose survives", () => {
  test("both singular sentences are still there", () => {
    expect(read(E2E)).toContain("one test with a loop rather");
    expect(read(INTEGRATION)).toContain("Every test makes its own account");
  });
});

// ---------------------------------------------------------------------------
// Criteria 15 (history figures) and 17 (header): direct reads.
// ---------------------------------------------------------------------------

describe("criterion 15: T-065's protected history figures are still in PROGRESS.md", () => {
  test("`19 tests`, `190 tests were added (19 → 209)` and `200 tests` are present", () => {
    const progress = read("PROGRESS.md");
    expect(progress).toContain("19 tests");
    expect(progress).toContain("190 tests were added (19 → 209)");
    expect(progress).toContain("200 tests");
  });
});

describe("criterion 17: the guard's header credits the right author", () => {
  const guard = read("frontend/src/stale-suite-counts.criteria.test.ts");
  const header = guard.slice(guard.indexOf("/**"), guard.indexOf("*/") + 2);
  test("it no longer says 'by the verifying session'", () => {
    expect(header.replace(/\s*\n\s*\*\s*/g, " ")).not.toContain("by the verifying session");
  });
  test("it names the `worker` as author and T-074 as having extended it", () => {
    expect(header).toMatch(/worker/);
    expect(header).toContain("T-074");
  });
});

// ---------------------------------------------------------------------------
// Criteria 9-11, 13-16: the guard, run against edited scratch copies.
// ---------------------------------------------------------------------------

const GUARD = "frontend/src/stale-suite-counts.criteria.test.ts";
const GUARD_INPUTS = [
  "test-guidelines.md",
  "PROGRESS.md",
  "tasks.md",
  "backend/tests/test_postgres.py",
  BACKEND,
  INTEGRATION,
  E2E,
];
const DEAD = "http://127.0.0.1:1";
const scratch: string[] = [];
afterAll(() => {
  for (const root of scratch) rmSync(root, { recursive: true, force: true });
});

function guardPasses(file: string, edit: (text: string) => string): boolean {
  const root = mkdtempSync(join(tmpdir(), "t074-guard-"));
  scratch.push(root);
  for (const path of [GUARD, ...GUARD_INPUTS]) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    copyFileSync(join(REPO_ROOT, path), join(root, path));
  }
  const original = read(file);
  const edited = edit(original);
  if (edited === original && edit !== identity) throw new Error(`edit to ${file} changed nothing`);
  writeFileSync(join(root, file), edited);
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
const identity = (text: string) => text;
const T = 30_000;

/** Replace the comment on the `make -C backend test` line (not -postgres / -integration). */
const testLineComment = (comment: string) => (doc: string) =>
  doc.replace(/^(make -C backend test\s+)#.*$/m, `$1${comment}`);

/** Replace the first paragraph after the `# ` title. */
const firstParagraph = (paragraph: string) => (doc: string) =>
  doc.replace(/^(# [^\n]*\n\n)[\s\S]*?(\n\n)/, `$1${paragraph}$2`);

const appendParagraph = (sentence: string) => (doc: string) =>
  `${doc.replace(/\n*$/, "")}\n\n${sentence}\n`;

describe("control: the guard passes on unedited copies", () => {
  test("unedited", () => expect(guardPasses("PROGRESS.md", identity)).toBe(true), T);
});

describe("criterion 9: each README's original claim, restored alone, turns the guard red", () => {
  test(
    "(a) backend/README.md: `# 221 tests on SQLite` on the test line",
    () => expect(guardPasses(BACKEND, testLineComment("# 221 tests on SQLite"))).toBe(false),
    T,
  );
  test(
    "(b) backend/integration/README.md: `28 tests that talk to a running server …`",
    () =>
      expect(
        guardPasses(
          INTEGRATION,
          firstParagraph(
            "28 tests that talk to a running server over HTTP and never import `app`.",
          ),
        ),
      ).toBe(false),
    T,
  );
  test(
    "(c) e2e/README.md: first paragraph starts `13 Playwright tests that drive Chromium`",
    () =>
      expect(
        guardPasses(
          E2E,
          firstParagraph(
            "13 Playwright tests that drive Chromium through the app the way a child and a\ngrown-up would.",
          ),
        ),
      ).toBe(false),
    T,
  );
});

describe("criterion 10: a count in words or across a list comma turns the guard red, per README", () => {
  for (const path of READMES) {
    for (const sentence of [
      "The suite has thirty tests.",
      "The suite has 221 unit, endpoint and contract tests.",
    ]) {
      test(
        `${path}: appending "${sentence}"`,
        () => expect(guardPasses(path, appendParagraph(sentence))).toBe(false),
        T,
      );
    }
  }
});

describe("criterion 11: a restored Postgres-only number turns the guard red", () => {
  for (const n of ["9", "nine"]) {
    test(
      `\`(${n} Postgres-only ones skip)\` with no tests count beside it`,
      () =>
        expect(
          guardPasses(BACKEND, testLineComment(`# on SQLite (${n} Postgres-only ones skip)`)),
        ).toBe(false),
      T,
    );
  }
});

const LINE = "The frontend suite has 9 tests.";
const GAPS = "## Known gaps in what is done";
const NEXT = "## Next";
const COMPLETED = "## Completed tasks";
const afterHeading = (heading: string) => (doc: string) => {
  const at = doc.indexOf(`\n${heading}\n`);
  if (at < 0) throw new Error(`no ${heading}`);
  const end = at + heading.length + 1;
  return `${doc.slice(0, end)}\n${LINE}${doc.slice(end)}`;
};
const renameHeading = (heading: string, to: string) => (doc: string) =>
  doc.replace(`\n${heading}\n`, `\n${to}\n`);

describe("criterion 13: a count in Known gaps turns the guard red", () => {
  test(
    "inserted directly after the heading",
    () => expect(guardPasses("PROGRESS.md", afterHeading(GAPS))).toBe(false),
    T,
  );
});

describe("criterion 14: a count in Next turns the guard red, down to the end of the file", () => {
  test(
    "inserted directly after the `## Next` heading",
    () => expect(guardPasses("PROGRESS.md", afterHeading(NEXT))).toBe(false),
    T,
  );
  test(
    "appended as the last line of the file, below `### Deferred on purpose (§3.9)`",
    () => {
      const doc = read("PROGRESS.md");
      expect(doc.lastIndexOf("### Deferred on purpose (§3.9)")).toBeGreaterThan(
        doc.indexOf(`\n${NEXT}\n`),
      );
      expect(guardPasses("PROGRESS.md", (d) => `${d.replace(/\n*$/, "")}\n${LINE}\n`)).toBe(false);
    },
    T,
  );
});

describe("criterion 15: the history section stays unguarded, on both edges", () => {
  test(
    "inserted directly after `## Completed tasks`: green",
    () => expect(guardPasses("PROGRESS.md", afterHeading(COMPLETED))).toBe(true),
    T,
  );
  test(
    "inserted on the line directly before `## Known gaps in what is done`: green",
    () =>
      expect(
        guardPasses("PROGRESS.md", (d) => d.replace(`\n${GAPS}\n`, `\n${LINE}\n${GAPS}\n`)),
      ).toBe(true),
    T,
  );
});

describe("criterion 16: a renamed heading fails loudly", () => {
  for (const to of ["## Known gaps", "## Gaps", "## Known gaps in what is done (live)"]) {
    test(
      `Known gaps renamed to "${to}": red`,
      () => expect(guardPasses("PROGRESS.md", renameHeading(GAPS, to))).toBe(false),
      T,
    );
  }
  for (const to of ["## Up next", "## Next steps", "## Nxt"]) {
    test(
      `Next renamed to "${to}": red`,
      () => expect(guardPasses("PROGRESS.md", renameHeading(NEXT, to))).toBe(false),
      T,
    );
  }
});
