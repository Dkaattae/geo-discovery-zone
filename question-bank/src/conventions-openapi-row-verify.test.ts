/**
 * T-105 tester: one test (or more) per acceptance criterion of
 * `tasks/T-105-conventions-openapi-row.md`.
 *
 * Base is `0b78dec` (the brief's "base"). CI checks out shallow and a test may
 * not hand `git` a revision, so base's `conventions.md` is held here as values
 * and a sha256 digest recorded at `0b78dec` when this file was written (E-30:
 * a pin names the commit it was recorded at). The digest covers every line of
 * the file except the `openapi.yaml` Layout row and the `backend/` Layout row,
 * as `JSON.stringify` of the `split("\n")` array with those two elements
 * removed. It was re-recorded at `5f6f811` by T-106 (CI fix plan row 1), whose
 * criterion 5 rewrites the `backend/` row; the `openapi.yaml` row is pinned
 * byte for byte to its T-105 wording instead.
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
const BASE_SPLIT_LENGTH = 137; // 136 lines plus the empty element after the final newline (T-109 CI fix plan row 3: was 134, 133 lines)
const BASE_ROW_INDEX = 15; // line 16, 1-based
/**
 * Recorded at `5f6f811` (T-106 CI fix plan row 1): every line except the
 * `openapi.yaml` and `backend/` rows. Replaces the `0b78dec` digest that also
 * covered the `backend/` row. Re-recorded by T-109 (CI fix plan row 4) after its
 * criterion 17 Formatting lines.
 */
const BASE_OTHER_LINES_SHA = "db686eed519d06cf99f4e06d49d654f4e5cc31d8588754118a9c4746c91e12f0";
/** The `openapi.yaml` row as T-105 left it, at `5f6f811`. */
const T105_OPENAPI_ROW =
  "openapi.yaml     describes the API; follows the backend, which is the source of truth (engineering-decisions.md E-14)";

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

  test("every line other than the openapi.yaml and backend/ rows is byte-identical to base, in the same order; the openapi.yaml row is T-105's wording", () => {
    const others = lines().filter((l) => !OPENAPI_ROW.test(l) && !l.startsWith("backend/ "));
    expect(sha(JSON.stringify(others))).toBe(BASE_OTHER_LINES_SHA);
    expect(openapiRows()[0]).toBe(T105_OPENAPI_ROW);
  });

  test("the backend/ row serves /api/v1 and the frontend on the same origin, without 'once built' (T-106)", () => {
    const backend = lines().filter((l) => l.startsWith("backend/ "));
    expect(backend).toHaveLength(1);
    expect(backend[0]).toContain("serving /api/v1 and the frontend on the same origin");
    expect(backend[0]).not.toMatch(/once built/i);
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
