import { afterEach, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-006 acceptance criteria 1-4, 6 and 7. These are properties of the eslint
 * config and the CI workflow, not of a pure function, so criteria 1-4 shell out
 * to the real `eslint` binary rather than asserting on config internals — the
 * config is only meaningful through what it makes the tool do. No network:
 * eslint runs entirely against the local tree (test-guidelines.md).
 */

const FRONTEND_ROOT = join(import.meta.dirname, "..");

function runLint(): { exitCode: number; output: string } {
  // Runs the `lint` script from package.json — via `bun run`, not eslint
  // directly — so a change to the script itself (criterion 1) is what these
  // tests are actually exercising, not a flag hardcoded here.
  try {
    const output = execFileSync("bun", ["run", "lint"], {
      cwd: FRONTEND_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { exitCode: 0, output };
  } catch (error) {
    const e = error as { status: number | null; stdout?: string; stderr?: string };
    return { exitCode: e.status ?? 1, output: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

const probeFiles: string[] = [];

function writeProbe(relativePath: string, content: string) {
  const fullPath = join(FRONTEND_ROOT, relativePath);
  mkdirSync(join(fullPath, ".."), { recursive: true });
  writeFileSync(fullPath, content);
  probeFiles.push(fullPath);
}

afterEach(() => {
  while (probeFiles.length > 0) {
    const file = probeFiles.pop()!;
    rmSync(file, { force: true });
  }
});

describe("criterion 1 — the gate is clean on the committed tree", () => {
  test("bun run lint exits 0 with no warnings", () => {
    const { exitCode, output } = runLint();
    expect(exitCode).toBe(0);
    expect(output).not.toContain("warning");
  });
});

describe("criterion 2 — warnings fail, both sides of the edge", () => {
  test("a warn-severity rule other than the exempted one fails the build", () => {
    // react-hooks/exhaustive-deps stays at warn everywhere, and is not the rule
    // criterion 3 relaxes for components/ui/ — proves --max-warnings 0 catches
    // any warn rule, not just react-refresh/only-export-components.
    writeProbe(
      "src/components/__probe_exhaustive_deps.tsx",
      [
        'import { useEffect, useState } from "react";',
        "",
        "export function ProbeExhaustiveDeps() {",
        "  const [count, setCount] = useState(0);",
        "  useEffect(() => {",
        "    console.log(count);",
        "  }, []);",
        "  return <div>{count}</div>;",
        "}",
        "",
      ].join("\n"),
    );

    const { exitCode, output } = runLint();
    expect(exitCode).not.toBe(0);
    expect(output).toContain("react-hooks/exhaustive-deps");
  });

  test("0 warnings on the clean tree still exits 0 (the other edge)", () => {
    const { exitCode } = runLint();
    expect(exitCode).toBe(0);
  });
});

describe("criterion 3 — the relaxation is a directory boundary, not a name prefix", () => {
  const violation = [
    "export function ProbeComponent() {",
    "  return <div>probe</div>;",
    "}",
    "",
    "export function probeHelper(x: number) {",
    "  return x + 1;",
    "}",
    "",
  ].join("\n");

  test("the same export shape fails outside components/ui/, even at a sibling path", () => {
    // uiHelpers.tsx sits next to the ui/ directory, not inside it — if the glob
    // were a name prefix instead of a directory boundary, this would wrongly
    // pass too.
    writeProbe("src/components/uiHelpers.tsx", violation);

    const { exitCode, output } = runLint();
    expect(exitCode).not.toBe(0);
    expect(output).toContain("react-refresh/only-export-components");
  });

  test("the identical export shape passes inside components/ui/", () => {
    writeProbe("src/components/ui/__probe_ui_export.tsx", violation);

    const { exitCode } = runLint();
    expect(exitCode).toBe(0);
  });
});

describe("criterion 4 — no file-level silencing outside components/ui/", () => {
  test("no eslint-disable for the rule under src/ outside components/ui/, except the generated route tree", () => {
    const output = execFileSync("grep", ["-rl", "eslint-disable", join(FRONTEND_ROOT, "src")], {
      encoding: "utf8",
    }).trim();
    const hits = output === "" ? [] : output.split("\n");

    const unexpected = hits.filter((file) => {
      const relative = file.replace(`${FRONTEND_ROOT}/`, "");
      if (relative.startsWith("src/components/ui/")) return false;
      // TanStack Router regenerates this file with a blanket disable comment;
      // it pre-dates this task and is restored by `bun run dev`/`build`.
      if (relative === "src/routeTree.gen.ts") return false;
      // This file names the string it is searching for; it carries no directive.
      if (relative === "src/lint-gate.test.ts") return false;
      return true;
    });

    expect(unexpected).toEqual([]);
  });
});

describe("criterion 6 — CI runs the same command as a local developer", () => {
  test("the Lint step is a bare `bun run lint`, and no --max-warnings lives only in ci.yml", () => {
    const ciYml = readFileSync(join(FRONTEND_ROOT, "../.github/workflows/ci.yml"), "utf8");
    expect(ciYml).toContain("run: bun run lint");
    expect(ciYml).not.toContain("--max-warnings");
  });
});

describe("criterion 7 — the dead cross-reference to T-003's brief is gone", () => {
  test('ci.yml no longer says "see the brief\'s Handoff"', () => {
    const ciYml = readFileSync(join(FRONTEND_ROOT, "../.github/workflows/ci.yml"), "utf8");
    expect(ciYml).not.toContain("brief's Handoff");
    // the clause was repointed rather than deleted outright
    expect(ciYml).toMatch(/No lint step[\s\S]*?#11/);
  });
});
