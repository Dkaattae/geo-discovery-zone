import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { Entity } from "./types";

/**
 * T-067 verification (tester). Written from the acceptance criteria in
 * `tasks/T-067-climate-koppen.md`, not from the implementation: every expected
 * string below is copied out of a criterion's own wording.
 *
 * Criteria that are diff-shaped ("every other row ... is unchanged", "no line
 * of `geoquizdataplan.md` changes", "no existing E-n entry changes", "no data
 * file changes") are **not** pinned here. The only git-free way to pin them is
 * a copy of the prior text inside this file, which is the expiring-baseline
 * shape `engineering-decisions.md` E-11/E-12 removed. They were checked once by
 * diffing against the merge-base and are recorded in the brief's Verdict.
 *
 * The contract (`openapi.yaml`) and backend model (`backend/app/models.py`)
 * criteria are asserted from `backend/tests/test_climate_koppen_t067_criteria.py`,
 * where a YAML parser and the model already live.
 *
 * Local files only; `git ls-files` reads the working tree and resolves no
 * revision. No network.
 */

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const read = (path: string) => readFileSync(join(REPO, path), "utf8");

/** Assembled so this file's own source never contains the literal. */
const SNAKE = "climate" + "_koppen";
const CAMEL = "climate" + "Koppen";

// -- criterion 1 -------------------------------------------------------------

/** Compile-time half of criterion 1: `bun run typecheck` fails if the key comes back. */
type HasKoppen = "climate_koppen" extends keyof Entity ? true : false;
const entityHasNoKoppen: HasKoppen = false;

function entityInterfaceBody(): string {
  const source = read("question-bank/src/types.ts");
  const match = source.match(/export interface Entity \{([\s\S]*?)\n\}/);
  if (!match) throw new Error("export interface Entity not found in types.ts");
  return match[1]!;
}

describe("T-067 criterion 1 — types.ts Entity declares no climate_koppen", () => {
  test("the Entity type has no climate_koppen key (type-level)", () => {
    expect(entityHasNoKoppen).toBe(false);
  });

  test("the Entity interface source declares no climate_koppen property", () => {
    expect(entityInterfaceBody()).not.toMatch(new RegExp(`^\\s*${SNAKE}\\??:`, "m"));
  });

  test("climate_kid and top_crops are still declared on Entity, with their types", () => {
    const body = entityInterfaceBody();
    expect(body).toMatch(/^\s*climate_kid\?: string;$/m);
    expect(body).toMatch(/^\s*top_crops\?: string\[\];$/m);
  });
});

// -- criterion 5 -------------------------------------------------------------

function trackedFiles(paths: string[]): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "-z", "--", ...paths], { cwd: REPO });
  if (proc.exitCode !== 0) throw new Error(`git ls-files failed: ${proc.stderr.toString()}`);
  return proc.stdout.toString().split("\0").filter(Boolean);
}

const isTestFile = (path: string) =>
  /\.test\.tsx?$/.test(path) || /(^|\/)tests?\//.test(path) || /(^|\/)test_[^/]+\.py$/.test(path);

describe("T-067 criterion 5 — neither spelling survives in the named scopes", () => {
  const scopes = [
    "question-bank/src",
    "frontend/src",
    "backend/app",
    "openapi.yaml",
    "geoquizdataplan.md",
  ];

  for (const scope of scopes) {
    test(`${scope} contains neither ${SNAKE} nor ${CAMEL} (test files excepted)`, () => {
      const files = trackedFiles([scope]).filter((path) => !isTestFile(path));
      expect(files.length).toBeGreaterThan(0);
      const hits = files.filter((path) => {
        const text = read(path);
        return text.includes(SNAKE) || text.includes(CAMEL);
      });
      expect(hits).toEqual([]);
    });
  }
});

// -- criteria 6-11 (the plan) ------------------------------------------------

const PLAN = () => read("geoquizdataplan.md");

function entityExampleBlock(): string {
  const plan = PLAN();
  const anchor = plan.indexOf("**Entity record (US state example):**");
  expect(anchor).toBeGreaterThanOrEqual(0);
  const open = plan.indexOf("```json\n", anchor);
  const close = plan.indexOf("\n```", open + 8);
  return plan.slice(open + "```json\n".length, close + 1);
}

describe("T-067 criterion 6 — the plan's entity example has no climate_koppen key", () => {
  test("the fenced json block still parses as JSON", () => {
    expect(() => JSON.parse(entityExampleBlock())).not.toThrow();
  });

  test("the parsed example has no climate_koppen key", () => {
    const example = JSON.parse(entityExampleBlock()) as Record<string, unknown>;
    expect(Object.keys(example)).not.toContain(SNAKE);
  });

  test("its neighbours survive in order: borders, climate_kid, top_crops", () => {
    const keys = Object.keys(JSON.parse(entityExampleBlock()) as Record<string, unknown>);
    const at = (key: string) => keys.indexOf(key);
    expect(at("borders")).toBeGreaterThanOrEqual(0);
    expect(at("climate_kid")).toBe(at("borders") + 1);
    expect(at("top_crops")).toBe(at("climate_kid") + 1);
  });
});

/** §1.9's table rows, as raw lines, header and separator included. */
function sourceTableLines(): string[] {
  const plan = PLAN();
  const start = plan.indexOf("### 1.9 ");
  expect(start).toBeGreaterThanOrEqual(0);
  const section = plan.slice(start, plan.indexOf("\n## ", start));
  return section.split("\n").filter((line) => line.startsWith("|"));
}

const fieldOf = (row: string) => row.split("|")[1]!.trim();

describe("T-067 criterion 7 — §1.9 has no Köppen climate row", () => {
  test("the table exists and no row's Field is `Köppen climate`", () => {
    const rows = sourceTableLines();
    expect(rows.length).toBeGreaterThan(2);
    expect(rows.map(fieldOf)).not.toContain("Köppen climate");
  });
});

describe("T-067 criteria 8 and 9 — §1.9's US crops row", () => {
  const usCrops = () => {
    const rows = sourceTableLines().filter((row) => fieldOf(row) === "US crops");
    expect(rows).toHaveLength(1);
    return rows[0]!;
  };

  for (const banned of ["USDA NASS", "Quick Stats", "Free key"]) {
    test(`criterion 8: the US crops row does not contain "${banned}"`, () => {
      expect(usCrops()).not.toContain(banned);
    });
  }

  test("criterion 9: the US crops row names hand-curation as the source", () => {
    const source = usCrops().split("|")[2]!;
    expect(source.toLowerCase()).toMatch(/hand-curat/);
  });

  test("criterion 9: the US crops row cites E-7", () => {
    expect(usCrops()).toMatch(/\bE-7\b/);
  });
});

describe("T-067 criterion 10 — §1.9's world crops row is byte-identical", () => {
  test("the world crops row is exactly the criterion's string", () => {
    const rows = sourceTableLines().filter((row) => fieldOf(row) === "world crops");
    expect(rows).toEqual([
      '| world crops | **FAOSTAT** bulk download | Free, needs aggregation to "top 3" |',
    ]);
  });
});

describe("T-067 criterion 11 — §1.9's header and separator are intact", () => {
  // Only the parts of criterion 11 that hold without a baseline copy: the
  // header and separator rows lead the table. Row-by-row identity was checked
  // against the merge-base and is recorded in the Verdict.
  test("the table opens with its Field | Source | Notes header and separator", () => {
    const rows = sourceTableLines();
    expect(rows[0]).toBe("| Field | Source | Notes |");
    expect(rows[1]).toBe("|---|---|---|");
  });
});

// -- criterion 13 ------------------------------------------------------------

describe("T-067 criterion 13 — us-states.ts no longer points at the deleted §1.9 row", () => {
  test('the file does not contain "map Köppen codes yourself"', () => {
    expect(read("question-bank/src/curated/us-states.ts")).not.toContain(
      "map Köppen codes yourself",
    );
  });

  test("CuratedState still declares climate_kid", () => {
    expect(read("question-bank/src/curated/us-states.ts")).toMatch(/^\s*climate_kid\?: string;$/m);
  });
});

// -- criteria 14-16 (the decisions) ------------------------------------------

const DECISIONS = () => read("engineering-decisions.md");

function entry(id: string): string {
  const text = DECISIONS();
  const start = text.indexOf(`\n## ${id} — `);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = text.indexOf("\n## ", start + 1);
  return text.slice(start, next === -1 ? undefined : next);
}

describe("T-067 criterion 14 — E-13 records the deletion", () => {
  test("an entry headed `## E-13 — ` exists and names the field", () => {
    expect(entry("E-13")).toContain(SNAKE);
  });

  for (const place of ["types.ts", "openapi.yaml", "backend/app/models.py", "§1.4"]) {
    test(`E-13 names ${place} as a place it was removed from`, () => {
      expect(entry("E-13")).toContain(place);
    });
  }

  test("E-13 names the §1.9 `Köppen climate` row as deleted", () => {
    const body = entry("E-13");
    expect(body).toContain("§1.9");
    expect(body).toContain("Köppen climate");
  });

  test("E-13 gives the reason: never emitted, and climate_kid is the shipped form", () => {
    const body = entry("E-13");
    expect(body).toMatch(/never\s+emitted/i);
    expect(body).toContain("climate_kid");
    expect(body).toMatch(/shipped\s+form/i);
  });

  test("E-13 has a Revisit when line", () => {
    expect(entry("E-13")).toMatch(/\*\*Revisit when\*\*/);
  });
});

describe("T-067 criterion 15 — E-14 states the backend-is-source-of-truth rule", () => {
  test("an entry headed `## E-14 — ` exists", () => {
    expect(entry("E-14").length).toBeGreaterThan(0);
  });

  test("E-14 says the backend is the source of truth once backend and frontend are built", () => {
    const body = entry("E-14");
    expect(body).toMatch(/backend\s+is\s+the\s+source\s+of\s+truth/i);
    expect(body).toMatch(/backend\s+and\s+(the\s+)?frontend\s+are\s+(both\s+)?built/i);
  });

  test("E-14 says openapi.yaml follows the backend rather than constraining it", () => {
    const body = entry("E-14");
    expect(body).toMatch(/openapi\.yaml`?\s+follows\s+the\s+backend/i);
    expect(body).toMatch(/rather\s+than\s+constraining\s+it/i);
  });

  test("E-14 credits the human's answer on T-067 (2026-09-24)", () => {
    const body = entry("E-14");
    expect(body).toContain("T-067");
    expect(body).toContain("2026-09-24");
  });

  test("E-14 has a Revisit when line", () => {
    expect(entry("E-14")).toMatch(/\*\*Revisit when\*\*/);
  });
});

describe("T-067 criterion 16 — E-13 directly follows E-12, E-14 directly follows E-13", () => {
  const ids = () => [...DECISIONS().matchAll(/^## (E-\d+) — /gm)].map((match) => match[1]!);

  test("E-13 is the heading immediately after E-12", () => {
    const list = ids();
    expect(list[list.indexOf("E-12") + 1]).toBe("E-13");
  });

  test("E-14 is the heading immediately after E-13", () => {
    const list = ids();
    expect(list[list.indexOf("E-13") + 1]).toBe("E-14");
  });

  test("E-13 and E-14 each appear exactly once", () => {
    const list = ids();
    expect(list.filter((id) => id === "E-13")).toHaveLength(1);
    expect(list.filter((id) => id === "E-14")).toHaveLength(1);
  });
});

// -- criterion 17 ------------------------------------------------------------

describe("T-067 criterion 17 — conventions.md's openapi.yaml layout line points at E-14", () => {
  test("the layout line describing openapi.yaml mentions E-14", () => {
    const lines = read("conventions.md")
      .split("\n")
      .filter((line) => /^openapi\.yaml\s/.test(line));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("the contract between frontend and backend");
    expect(lines[0]).toMatch(/\bE-14\b/);
  });
});
