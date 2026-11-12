/**
 * T-106 tester: one test (or more) per acceptance criterion of
 * `tasks/T-106-openapi-contract-wording.md`.
 *
 * Criteria 1-5 read the committed docs. Criteria 6 and 7 are verified by
 * `git diff 5f6f811 -- <file>` and per-commit `git show --stat`, recorded in
 * the brief's Verdict, not by a committed digest pin (the criteria say so;
 * P-17). Criterion 8 is the full-suite run, also recorded in the Verdict.
 *
 * Pure: three committed files read from disk. No spawn, no network.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const lines = (file: string): string[] => readFileSync(join(REPO_ROOT, file), "utf8").split("\n");

const OPENAPI_LINE = /^openapi\.yaml\s/;
const TECH_STACK_ROW = "| `openapi.yaml` |";

/** The lines strictly inside the first fenced code block after `## Layout`. */
function layoutBlock(file: string): string[] {
  const all = lines(file);
  const heading = all.indexOf("## Layout");
  expect(heading).toBeGreaterThanOrEqual(0);
  const open = all.findIndex((l, i) => i > heading && l.startsWith("```"));
  const close = all.findIndex((l, i) => i > open && l.startsWith("```"));
  expect(open).toBeGreaterThan(heading);
  expect(close).toBeGreaterThan(open);
  return all.slice(open + 1, close);
}

/** The lines from `## Tech stack` up to the next `## ` heading. */
function techStackSection(): string[] {
  const all = lines("README.md");
  const heading = all.indexOf("## Tech stack");
  expect(heading).toBeGreaterThanOrEqual(0);
  const next = all.findIndex((l, i) => i > heading && l.startsWith("## "));
  return all.slice(heading + 1, next === -1 ? all.length : next);
}

/** 1-based column where the description starts: first non-space after the name and its padding. */
function descriptionColumn(line: string): number {
  const m = /^(\S+\s+)\S/.exec(line);
  expect(m).not.toBeNull();
  return (m?.[1]?.length ?? -1) + 1;
}

describe("T-106 criterion 1 — README Tech stack row for openapi.yaml is not a contract", () => {
  const rows = (): string[] => techStackSection().filter((l) => l.startsWith(TECH_STACK_ROW));

  test("exactly one Tech stack row starts '| `openapi.yaml` |'", () => {
    expect(rows()).toHaveLength(1);
  });

  test("the row contains no 'contract' in any case", () => {
    expect(rows()[0]).not.toMatch(/contract/i);
  });

  test("the row contains no 'Both sides' in any case", () => {
    expect(rows()[0]).not.toMatch(/both sides/i);
  });

  test("the row contains 'follows the backend'", () => {
    expect(rows()[0]).toContain("follows the backend");
  });

  test("the row contains E-14 as a whole word", () => {
    expect(rows()[0]).toMatch(/\bE-14\b/);
  });
});

describe("T-106 criterion 2 — README Layout line for openapi.yaml is not a contract", () => {
  const matches = (): string[] => layoutBlock("README.md").filter((l) => OPENAPI_LINE.test(l));

  test("the README Layout block has exactly one /^openapi\\.yaml\\s/ line", () => {
    expect(matches()).toHaveLength(1);
  });

  test("the line contains no 'contract' in any case", () => {
    expect(matches()[0]).not.toMatch(/contract/i);
  });

  test("the line contains 'follows the backend' and E-14 as a whole word", () => {
    expect(matches()[0]).toContain("follows the backend");
    expect(matches()[0]).toMatch(/\bE-14\b/);
  });

  test("its description starts at column 21, as every other line of the block does", () => {
    expect(descriptionColumn(matches()[0] ?? "")).toBe(21);
    for (const l of layoutBlock("README.md")) {
      expect([l, descriptionColumn(l)]).toEqual([l, 21]);
    }
  });
});

describe("T-106 criterion 3 — no 'contract' anywhere in README.md", () => {
  test("no line of README.md contains 'contract' in any case", () => {
    const hits = lines("README.md").filter((l) => /contract/i.test(l));
    expect(hits).toEqual([]);
  });
});

describe("T-106 criterion 4 — PROGRESS.md Layout line for openapi.yaml is not a contract", () => {
  const matches = (): string[] => layoutBlock("PROGRESS.md").filter((l) => OPENAPI_LINE.test(l));

  test("the PROGRESS.md Layout block has exactly one /^openapi\\.yaml\\s/ line", () => {
    expect(matches()).toHaveLength(1);
  });

  test("the line contains no 'contract' in any case", () => {
    expect(matches()[0]).not.toMatch(/contract/i);
  });

  test("the line contains 'follows the backend' and E-14 as a whole word", () => {
    expect(matches()[0]).toContain("follows the backend");
    expect(matches()[0]).toMatch(/\bE-14\b/);
  });

  test("its description starts at column 17", () => {
    expect(descriptionColumn(matches()[0] ?? "")).toBe(17);
  });
});

describe("T-106 criterion 5 — conventions.md backend/ row no longer says 'once built'", () => {
  const rows = (): string[] =>
    layoutBlock("conventions.md").filter((l) => l.startsWith("backend/ "));

  test("the conventions.md Layout block has exactly one line starting 'backend/ '", () => {
    expect(rows()).toHaveLength(1);
  });

  test("the row contains no 'once built' in any case", () => {
    expect(rows()[0]).not.toMatch(/once built/i);
  });

  test("the row still contains '/api/v1' and 'the frontend on the same origin'", () => {
    expect(rows()[0]).toContain("/api/v1");
    expect(rows()[0]).toContain("the frontend on the same origin");
  });

  test("its description starts at column 18, like every other row of the block", () => {
    expect(descriptionColumn(rows()[0] ?? "")).toBe(18);
    for (const l of layoutBlock("conventions.md")) {
      expect([l, descriptionColumn(l)]).toEqual([l, 18]);
    }
  });
});
