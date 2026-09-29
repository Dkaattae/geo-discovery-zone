import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The one place question-bank's approved dependency set is pinned (T-071,
 * engineering-decisions.md E-16).
 *
 * Before T-071 nine test files each hand-pinned this set, so every approved
 * addition had to edit all nine. They were replaced by this file. When a human
 * approves a new dependency (CLAUDE.md "Packages"), `APPROVED_DEV_DEPENDENCIES`
 * below is the single line that changes, alongside the E-n entry recording
 * the approval.
 *
 * Reads only package.json and bun.lock from the working tree: no `git`, no
 * network, so a shallow CI checkout gets the same verdict as a full clone.
 */

const QB_ROOT = join(import.meta.dirname, "..");

/** Every devDependency a human has approved, sorted. Nothing else may appear. */
const APPROVED_DEV_DEPENDENCIES = [
  "@types/bun",
  "oxlint", // T-066, E-15
  "prettier", // T-071, E-16 — pinned exact, see below
  "typescript",
];

type Manifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

function manifest(): Manifest {
  return JSON.parse(readFileSync(join(QB_ROOT, "package.json"), "utf8")) as Manifest;
}

describe("question-bank's approved dependency set (E-16)", () => {
  test("devDependencies is exactly the approved set", () => {
    expect(Object.keys(manifest().devDependencies ?? {}).sort()).toEqual(APPROVED_DEV_DEPENDENCIES);
  });

  test("there is no runtime dependencies key, nor optional or peer dependencies", () => {
    const pkg = manifest();
    expect({
      dependencies: pkg.dependencies,
      optionalDependencies: pkg.optionalDependencies,
      peerDependencies: pkg.peerDependencies,
    }).toEqual({
      dependencies: undefined,
      optionalDependencies: undefined,
      peerDependencies: undefined,
    });
  });

  test("prettier is pinned to an exact version, not a range", () => {
    // Exact because formatter output changes between patch releases, and a
    // range would let two machines (or CI and a laptop) disagree on the same
    // file (E-16).
    expect(manifest().devDependencies?.["prettier"] ?? "").toMatch(/^3\.\d+\.\d+$/);
  });

  test("bun.lock resolves prettier to that exact version", () => {
    const pinned = manifest().devDependencies?.["prettier"];
    const lock = readFileSync(join(QB_ROOT, "bun.lock"), "utf8");
    const resolved = lock.match(/"prettier": \["prettier@([^"]+)"/)?.[1];
    expect({ pinned, resolved }).toEqual({ pinned, resolved: pinned });
  });
});
