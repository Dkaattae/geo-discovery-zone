import { afterEach, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import * as prettier from "prettier";
import { DEAD_PROXY } from "./offline-rebuild";

/**
 * T-071 acceptance criteria: question-bank's pinned prettier and its CI gate.
 *
 * Written by the tester from the brief's criteria, not from the implementation.
 * The gate is only meaningful through what the CI step actually runs, so the
 * gate criteria (4-7, 10) resolve the script name from ci.yml's Format step and
 * spawn `bun run <that script>` (the locally installed prettier, never bunx),
 * with temporary probe files under src/ removed in afterEach. No network.
 *
 * Not here, verified by hand in the brief's Verdict instead: 2 (frozen install),
 * 9's "no other job changes", 11 and 13 (mutations of package.json, then a full
 * `bun test`), 12's "passes on the head" (the shared check's own run; a
 * second copy of the set here would itself break criterion 11's one-file rule),
 * 14 and 15 (diffs against commits a shallow CI checkout lacks),
 * 16 (the suites themselves) and 19's "no existing entry changes".
 */

const QB_ROOT = join(import.meta.dirname, "..");
const REPO_ROOT = join(QB_ROOT, "..");
const SRC = join(QB_ROOT, "src");

type PackageJson = {
  scripts: Record<string, string>;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  trustedDependencies?: unknown;
  overrides?: unknown;
  resolutions?: unknown;
};

function packageJson(): PackageJson {
  return JSON.parse(readFileSync(join(QB_ROOT, "package.json"), "utf8")) as PackageJson;
}

function ciYml(): string {
  return readFileSync(join(REPO_ROOT, ".github/workflows/ci.yml"), "utf8");
}

/** The question-bank job's block in ci.yml: from its key to the next job key. */
function questionBankJob(): string {
  const lines = ciYml().split("\n");
  const start = lines.findIndex((line) => line === "  question-bank:");
  expect(start).toBeGreaterThan(-1);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^ {2}[A-Za-z0-9_-]+:\s*$/.test(lines[i]!)) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

/** Steps of a job block, each as its own text chunk starting at `- `. */
function stepsOf(job: string): string[] {
  return job.split(/\n(?= {6}- )/).slice(1);
}

function stepField(step: string, field: string): string | undefined {
  return step.match(new RegExp(`^ {8}${field}: (.*)$`, "m"))?.[1]?.trim();
}

/** The step whose `run` is `bun run <script>` with a prettier --check script. */
function formatStep(): { step: string; script: string } | undefined {
  const scripts = packageJson().scripts;
  for (const step of stepsOf(questionBankJob())) {
    const run = stepField(step, "run");
    const script = run?.match(/^bun run (\S+)$/)?.[1];
    if (!script) continue;
    const value = scripts[script];
    if (value && /\bprettier\b/.test(value) && /(^|\s)--check(\s|$)/.test(value)) {
      return { step, script };
    }
  }
  return undefined;
}

function formatScript(): string {
  const found = formatStep();
  expect(found).toBeDefined();
  return found!.script;
}

type RunResult = { exitCode: number; output: string };

function runFormatCheck(extraArgs: string[] = [], env: NodeJS.ProcessEnv = process.env): RunResult {
  try {
    const output = execFileSync("bun", ["run", formatScript(), ...extraArgs], {
      cwd: QB_ROOT,
      encoding: "utf8",
      env,
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
  const fullPath = join(QB_ROOT, relativePath);
  mkdirSync(join(fullPath, ".."), { recursive: true });
  writeFileSync(fullPath, content);
  probeFiles.push(fullPath);
}

afterEach(() => {
  while (probeFiles.length > 0) {
    rmSync(probeFiles.pop()!, { force: true });
  }
});

function tsFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsFilesUnder(full));
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

function allFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...allFilesUnder(full));
    else out.push(full);
  }
  return out;
}

const UNFORMATTED = "const  x = {a:1}\nexport default x\n";
const GATE_TIMEOUT = 60_000;

describe("T-071 tester, criterion 1 — prettier is pinned to an exact version", () => {
  test("devDependencies.prettier matches ^3.x.y exactly, no range, tag or URL", () => {
    expect(packageJson().devDependencies?.["prettier"] ?? "").toMatch(/^3\.\d+\.\d+$/);
  });
});

describe("T-071 tester, criterion 2 — bun.lock resolves the pinned version", () => {
  test("bun.lock's prettier entry resolves to the package.json version", () => {
    const pinned = packageJson().devDependencies?.["prettier"];
    const lock = readFileSync(join(QB_ROOT, "bun.lock"), "utf8");
    const resolved = [...lock.matchAll(/"prettier@([^"]+)"/g)].map((m) => m[1]);
    expect(resolved.length).toBeGreaterThan(0);
    expect(new Set(resolved)).toEqual(new Set([pinned]));
  });
});

describe("T-071 tester, criterion 3 — resolved options are the documented four", () => {
  // Prettier 3's own defaults, applied when a config omits a key.
  const DEFAULTS = { printWidth: 80, semi: true, singleQuote: false, trailingComma: "all" };
  const EXPECTED = { printWidth: 100, semi: true, singleQuote: false, trailingComma: "all" };

  test("every .ts under src/ resolves printWidth 100, semi, double quotes, trailing commas all", async () => {
    const files = tsFilesUnder(SRC);
    expect(files.length).toBeGreaterThan(10);
    const wrong: Record<string, unknown> = {};
    for (const file of files) {
      const resolved = (await prettier.resolveConfig(file, { editorconfig: true })) ?? {};
      const effective = { ...DEFAULTS, ...resolved };
      const picked = {
        printWidth: effective.printWidth,
        semi: effective.semi,
        singleQuote: effective.singleQuote,
        trailingComma: effective.trailingComma,
      };
      if (JSON.stringify(picked) !== JSON.stringify(EXPECTED))
        wrong[relative(QB_ROOT, file)] = picked;
    }
    expect(wrong).toEqual({});
  });

  test("the config comes from a file committed in question-bank/, not a parent directory", async () => {
    const configPath = await prettier.resolveConfigFile(join(SRC, "build.ts"));
    expect(configPath).not.toBeNull();
    expect(relative(QB_ROOT, configPath!).startsWith("..")).toBe(false);
  });
});

describe("T-071 tester, criterion 4 — the format check passes on the branch head", () => {
  test(
    "bun run <format script> exits 0",
    () => {
      const result = runFormatCheck();
      expect(result).toEqual({ exitCode: 0, output: expect.any(String) });
    },
    GATE_TIMEOUT,
  );
});

describe("T-071 tester, criteria 5 and 6 — an unformatted probe fails the gate", () => {
  for (const probe of ["src/t071-probe.ts", "src/sinks/t071-probe.ts"]) {
    test(
      `${probe}: exit non-zero naming the file, then 0 once removed`,
      () => {
        writeProbe(probe, UNFORMATTED);
        const failing = runFormatCheck();
        expect(failing.exitCode).not.toBe(0);
        expect(failing.output).toContain(probe);

        rmSync(join(QB_ROOT, probe));
        expect(runFormatCheck().exitCode).toBe(0);
      },
      GATE_TIMEOUT,
    );
  }
});

describe("T-071 tester, criterion 7 — no .ts under src/ is exempt", () => {
  test("no .prettierignore in question-bank/ or any parent up to the repo root", () => {
    const found = [QB_ROOT, REPO_ROOT, SRC]
      .map((dir) => join(dir, ".prettierignore"))
      .filter((path) => existsSync(path));
    expect(found).toEqual([]);
  });

  test("no line anywhere under src/ is a prettier-ignore directive", () => {
    const hits: string[] = [];
    for (const file of allFilesUnder(SRC)) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          const t = line.trim();
          if (t.startsWith("// prettier-ignore") || t.startsWith("/* prettier-ignore")) {
            hits.push(`${relative(QB_ROOT, file)}:${i + 1}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });

  test(
    "the check's own file arguments and ignore files reach every .ts under src/",
    () => {
      // --use-tabs and --no-semi override the config on the CLI, so every file
      // with an indented line or a statement semicolon (all of them) becomes
      // "unformatted"; the files the check warns about are then exactly the
      // files it covers, through its own globs and ignore files.
      const result = runFormatCheck(["--use-tabs", "--no-semi"]);
      expect(result.exitCode).not.toBe(0);
      const missed = tsFilesUnder(SRC)
        .map((file) => relative(QB_ROOT, file))
        .filter((rel) => !result.output.includes(rel));
      expect(missed).toEqual([]);
    },
    GATE_TIMEOUT,
  );
});

describe("T-071 tester, criterion 8 — the CI step", () => {
  test("a question-bank step runs exactly `bun run <script>` for a prettier --check script", () => {
    const found = formatStep();
    expect(found).toBeDefined();
    const value = packageJson().scripts[found!.script]!;
    expect(value).not.toMatch(/--write/);
    expect(stepField(found!.step, "run")).toBe(`bun run ${found!.script}`);
  });

  test("its if: is the same as Typecheck, Lint and Test", () => {
    const EXPECTED_IF = "${{ !cancelled() && steps.install.outcome == 'success' }}";
    const steps = stepsOf(questionBankJob());
    const byName = (name: string) =>
      steps.find((s) => s.match(/^ {6}- name: (.*)$/m)?.[1]?.trim() === name);
    const ifs = {
      format: stepField(formatStep()!.step, "if"),
      typecheck: stepField(byName("Typecheck") ?? "", "if"),
      lint: stepField(byName("Lint") ?? "", "if"),
      test: stepField(byName("Test") ?? "", "if"),
    };
    expect(ifs).toEqual({
      format: EXPECTED_IF,
      typecheck: EXPECTED_IF,
      lint: EXPECTED_IF,
      test: EXPECTED_IF,
    });
  });
});

describe("T-071 tester, criterion 9 — no stale 'not checked' comment", () => {
  test("no comment in the question-bank job says formatting is not checked", () => {
    const comments = questionBankJob()
      .split("\n")
      .filter((line) => line.trim().startsWith("#"))
      .join("\n");
    expect(comments).not.toMatch(/format\w*[^\n]*not (yet )?(checked|gated)/i);
    expect(comments).not.toMatch(/not (yet )?(checked|gated)[^\n]*format/i);
  });
});

describe("T-071 tester, criterion 10 — the gate needs no network", () => {
  const offline = { ...process.env, ...DEAD_PROXY };

  test(
    "criterion 4 under the dead proxy: exit 0",
    () => {
      expect(runFormatCheck([], offline).exitCode).toBe(0);
    },
    GATE_TIMEOUT,
  );

  test(
    "criterion 5 under the dead proxy: probe fails the gate and is named",
    () => {
      writeProbe("src/t071-offline-probe.ts", UNFORMATTED);
      const result = runFormatCheck([], offline);
      expect(result.exitCode).not.toBe(0);
      expect(result.output).toContain("src/t071-offline-probe.ts");
    },
    GATE_TIMEOUT,
  );
});

describe("T-071 tester, criterion 12 — the shared check reads only the working tree", () => {
  test("dependency-set.test.ts spawns nothing and reads only package.json / bun.lock", () => {
    const text = readFileSync(join(SRC, "dependency-set.test.ts"), "utf8");
    expect(text).not.toMatch(/child_process|Bun\.spawn|Bun\.\$|execSync|execFile|spawnSync/);
    expect(text).not.toMatch(/\bgit\s/);
    const reads = [...text.matchAll(/readFileSync\(([^)]*)\)/g)].map((m) => m[1]!);
    expect(reads.length).toBeGreaterThan(0);
    for (const arg of reads) expect(arg).toMatch(/"package\.json"|"bun\.lock"|QB_ROOT/);
  });
});

describe("T-071 tester, criterion 17 — no escape hatches, no plugin", () => {
  test("no trustedDependencies, overrides or resolutions key", () => {
    const pkg = packageJson();
    expect({
      trustedDependencies: "trustedDependencies" in pkg,
      overrides: "overrides" in pkg,
      resolutions: "resolutions" in pkg,
    }).toEqual({ trustedDependencies: false, overrides: false, resolutions: false });
  });
});

describe("T-071 tester, criterion 18 — conventions.md", () => {
  const conventions = () => readFileSync(join(REPO_ROOT, "conventions.md"), "utf8");

  test("no longer contains `bunx prettier`", () => {
    expect(conventions()).not.toContain("bunx prettier");
  });

  test("its Commands block lists the format check as `bun run <CI's script>`", () => {
    const text = conventions();
    const start = text.search(/^#+ Commands\b/m);
    expect(start).toBeGreaterThan(-1);
    const rest = text.slice(text.indexOf("\n", start) + 1);
    const nextHeading = rest.search(/^## /m); // "# frontend" inside the fence is a comment
    const block = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
    expect(block).toMatch(
      new RegExp(`bun run ${formatScript().replace(/[:]/g, "\\:")}(?![\\w:-])`),
    );
  });
});

describe("T-071 tester, criterion 19 — engineering-decisions.md E-16", () => {
  const decisions = () => readFileSync(join(REPO_ROOT, "engineering-decisions.md"), "utf8");

  test("a `## E-16` heading follows `## E-15`", () => {
    const text = decisions();
    const e15 = text.search(/^## E-15\b/m);
    const e16 = text.search(/^## E-16\b/m);
    expect(e15).toBeGreaterThan(-1);
    expect(e16).toBeGreaterThan(e15);
    expect(text.slice(e15 + 1, e16)).not.toMatch(/^## /m);
  });

  test("E-16 records prettier pinned exact, why, and the one shared dependency check by file", () => {
    const text = decisions();
    const start = text.search(/^## E-16\b/m);
    const after = text.slice(start + 1);
    const next = after.search(/^## /m);
    const entry = next === -1 ? after : after.slice(0, next);
    expect(entry).toMatch(/prettier/i);
    expect(entry).toMatch(/exact/i);
    expect(entry).toMatch(/because|why|so that|otherwise|would let/i);
    expect(entry).toMatch(/nine/i);
    expect(entry).toContain("dependency-set.test.ts");
  });
});
