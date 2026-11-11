/**
 * T-105 tester: one test (or more) per acceptance criterion of
 * `tasks/T-105-conventions-openapi-row.md`.
 *
 * Base is `0b78dec` (the brief's "base"). CI checks out shallow and a test may
 * not hand `git` a revision, so base's `conventions.md` is held here as values
 * and a sha256 digest recorded at `0b78dec` when this file was written (E-30:
 * a pin names the commit it was recorded at). The digest covers every line of
 * the file except the `openapi.yaml` Layout row, as `JSON.stringify` of the
 * `split("\n")` array with that one element removed.
 *
 * Criterion 3 is verified by `git diff --stat 0b78dec..HEAD` and per-commit
 * `git show --stat`, recorded in the brief's Verdict, not by a committed pin
 * (the criterion says so; P-17). Criterion 4 is the full-suite run, also
 * recorded in the Verdict.
 *
 * Pure: one committed file read from disk. No spawn, no network.
 */
import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const sha = (s: string): string => createHash("sha256").update(s).digest("hex");

const OPENAPI_ROW = /^openapi\.yaml\s/;

/** Recorded at `0b78dec`. */
const BASE_SPLIT_LENGTH = 134; // 133 lines plus the empty element after the final newline
const BASE_ROW_INDEX = 15; // line 16, 1-based
const BASE_OTHER_LINES_SHA = "61792261e1929326da0aef278105d41f5696be008ac7c152698688712d977f4b";

const lines = (): string[] => readFileSync(join(REPO_ROOT, "conventions.md"), "utf8").split("\n");

function openapiRows(): string[] {
  return lines().filter((l) => OPENAPI_ROW.test(l));
}

/** The lines strictly inside the code block under `## Layout`. */
function layoutBlock(): string[] {
  const all = lines();
  const heading = all.indexOf("## Layout");
  expect(heading).toBeGreaterThanOrEqual(0);
  const open = all.indexOf("```", heading);
  const close = all.indexOf("```", open + 1);
  expect(open).toBeGreaterThan(heading);
  expect(close).toBeGreaterThan(open);
  return all.slice(open + 1, close);
}

describe("T-105 criterion 1 — the openapi.yaml row follows the backend, not a contract", () => {
  test("exactly one line of conventions.md matches /^openapi\\.yaml\\s/, inside the Layout block", () => {
    expect(openapiRows()).toHaveLength(1);
    expect(layoutBlock().filter((l) => OPENAPI_ROW.test(l))).toHaveLength(1);
  });

  test("the row does not contain 'contract' in any case", () => {
    expect(openapiRows()[0]).not.toMatch(/contract/i);
  });

  test("the row does not contain 'once both are built'", () => {
    expect(openapiRows()[0]).not.toContain("once both are built");
  });

  test("the row contains 'follows the backend'", () => {
    expect(openapiRows()[0]).toContain("follows the backend");
  });

  test("the row contains E-14 as a whole word", () => {
    expect(openapiRows()[0]).toMatch(/\bE-14\b/);
  });
});

describe("T-105 criterion 2 — nothing else in conventions.md changes", () => {
  test("the file has the same number of lines as at base 0b78dec", () => {
    expect(lines()).toHaveLength(BASE_SPLIT_LENGTH);
  });

  test("the openapi.yaml row sits where it did at base (line 16)", () => {
    expect(lines().findIndex((l) => OPENAPI_ROW.test(l))).toBe(BASE_ROW_INDEX);
  });

  test("every other line is byte-identical to base 0b78dec, in the same order", () => {
    const others = lines().filter((l) => !OPENAPI_ROW.test(l));
    expect(sha(JSON.stringify(others))).toBe(BASE_OTHER_LINES_SHA);
  });

  test("the backend/ row keeps 'once built, the frontend on the same origin'", () => {
    const backend = lines().filter((l) => l.startsWith("backend/ "));
    expect(backend).toHaveLength(1);
    expect(backend[0]).toContain("once built, the frontend on the same origin");
  });

  test("the openapi.yaml description starts in column 18, like every other Layout row", () => {
    const row = openapiRows()[0] ?? "";
    expect(row.slice(0, 17)).toBe("openapi.yaml     ");
    expect(row[17]).not.toBe(" ");
    for (const l of layoutBlock()) {
      expect(l.slice(0, 17)).toMatch(/^\S+\s+$/);
      expect(l[17]).toMatch(/\S/);
    }
  });
});
