import { afterEach, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import { DEAD_PROXY } from "./offline-rebuild";

/**
 * T-066 acceptance criteria: question-bank's `bun run lint` (oxlint).
 *
 * Written by the tester from the brief's criteria. The lint gate is only
 * meaningful through what it makes the tool do, so criteria 1-8 and 15 shell
 * out to `bun run lint` (the package's own script, never oxlint directly) and
 * drop temporary probe files under src/, removed in afterEach. No network:
 * oxlint runs entirely against the local tree (test-guidelines.md).
 *
 * Not here, verified by hand in the brief's Verdict instead: criterion 9 (the
 * suites themselves), 12, 17 and 19 (diffs against the branch point 01a32eb,
 * which a shallow CI checkout does not have), and 18 (a frozen install).
 */

const QB_ROOT = join(import.meta.dirname, "..");
const REPO_ROOT = join(QB_ROOT, "..");

type LintResult = { exitCode: number; output: string };

function runLint(extraArgs: string[] = [], env: NodeJS.ProcessEnv = process.env): LintResult {
  try {
    const output = execFileSync("bun", ["run", "lint", ...extraArgs], {
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

function packageJson(): {
  scripts: { lint: string };
  trustedDependencies?: unknown;
  overrides?: unknown;
  resolutions?: unknown;
} {
  return JSON.parse(readFileSync(join(QB_ROOT, "package.json"), "utf8"));
}

/** Strip // and /* *\/ comments from JSONC, leaving string contents alone. */
function stripJsonComments(text: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (inString) {
      out += c;
      if (c === "\\") out += text[++i] ?? "";
      else if (c === '"') inString = false;
    } else if (c === '"') {
      inString = true;
      out += c;
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        if (text[i] === "\n") out += "\n";
        i++;
      }
      i++;
    } else {
      out += c;
    }
  }
  return out;
}

const OXLINTRC = join(QB_ROOT, ".oxlintrc.json");

function oxlintConfig(): {
  rules?: Record<string, unknown>;
  categories?: Record<string, unknown>;
  overrides?: { rules?: Record<string, unknown> }[];
} {
  if (!existsSync(OXLINTRC)) return {};
  return JSON.parse(stripJsonComments(readFileSync(OXLINTRC, "utf8")));
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

function tsFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...tsFilesUnder(full));
    else if (name.endsWith(".ts")) out.push(full);
  }
  return out;
}

const DEBUGGER_PROBE = "export function probe(): number {\n  debugger;\n  return 1;\n}\n";

describe("T-066 criterion 1 — a `lint` script exists and exits 0 on the committed tree", () => {
  test("package.json scripts has `lint`, and `bun run lint` exits 0", () => {
    expect(typeof packageJson().scripts.lint).toBe("string");
    const { exitCode, output } = runLint();
    if (exitCode !== 0) console.error(output);
    expect(exitCode).toBe(0);
  });
});

describe("T-066 criterion 2 — the clean tree reports zero warnings and zero errors", () => {
  test("output carries oxlint's summary with 0 warnings and 0 errors", () => {
    const { output } = runLint();
    expect(output).toMatch(/Found 0 warnings and 0 errors/);
  });
});

describe("T-066 criterion 3 — the linter is the locally installed oxlint, not a download", () => {
  test("the script invokes oxlint and never bunx/npx/pnpx/dlx", () => {
    const script = packageJson().scripts.lint;
    expect(script).toMatch(/^oxlint(\s|$)/);
    expect(script).not.toMatch(/\b(bunx|npx|pnpx|dlx|bun\s+x)\b/);
  });

  test("the oxlint the script runs is the one in question-bank/node_modules", () => {
    const installed = JSON.parse(
      readFileSync(join(QB_ROOT, "node_modules/oxlint/package.json"), "utf8"),
    ) as {
      version: string;
    };
    // `bun run lint --version` appends --version to the script's own oxlint
    // invocation, so it reports whichever binary the script actually resolves.
    const { exitCode, output } = runLint(["--version"]);
    expect(exitCode).toBe(0);
    expect(output).toContain(installed.version);
  });
});

describe("T-066 criterion 4 — a core JavaScript rule is on", () => {
  test("a `debugger;` probe fails the script (eslint/no-debugger)", () => {
    writeProbe("src/__probe_t066_debugger.ts", DEBUGGER_PROBE);
    const { exitCode, output } = runLint();
    expect(exitCode).not.toBe(0);
    expect(output).toContain("no-debugger");
  });
});

describe("T-066 criterion 5 — a TypeScript rule is on", () => {
  test("an explicit `any` annotation, and nothing else, fails the script (typescript/no-explicit-any)", () => {
    writeProbe("src/__probe_t066_any.ts", "const x: any = 1;\nexport { x };\n");
    const { exitCode, output } = runLint();
    expect(exitCode).not.toBe(0);
    expect(output).toContain("no-explicit-any");
  });
});

describe("T-066 criterion 6 — a warning alone fails the script", () => {
  // Rule used: eqeqeq, enabled at warning severity with oxlint's -W.
  const RULE = "eqeqeq";
  const PROBE = "export const f = (a: number) => a == 1;\n";

  test("the committed config does not configure eqeqeq", () => {
    const config = oxlintConfig();
    const configured = [
      config.rules ?? {},
      ...(config.overrides ?? []).map((o) => o.rules ?? {}),
    ].some((rules) => Object.keys(rules).some((key) => key === RULE || key.endsWith(`/${RULE}`)));
    expect(configured).toBe(false);
    expect(packageJson().scripts.lint).not.toContain(RULE);
  });

  test("the probe is clean without -W eqeqeq (it violates only that rule)", () => {
    writeProbe("src/__probe_t066_eqeqeq.ts", PROBE);
    const { exitCode } = runLint();
    expect(exitCode).toBe(0);
  });

  test("with -W eqeqeq the same probe produces a warning and the script exits non-zero", () => {
    writeProbe("src/__probe_t066_eqeqeq.ts", PROBE);
    const { exitCode, output } = runLint(["-W", RULE]);
    expect(output).toContain(RULE);
    expect(output).not.toMatch(/Found \d+ warnings? and [1-9]\d* errors?/);
    expect(exitCode).not.toBe(0);
  });
});

describe("T-066 criterion 7 — coverage reaches every .ts file under src/, tests included", () => {
  for (const location of [
    "src/__probe_t066_cov.ts",
    "src/__probe_t066_cov.test.ts",
    "src/sinks/__probe_t066_cov.ts",
  ]) {
    test(`a debugger probe at ${location} fails the script`, () => {
      writeProbe(location, DEBUGGER_PROBE);
      const { exitCode, output } = runLint();
      expect(exitCode).not.toBe(0);
      expect(output).toContain("__probe_t066_cov");
    });
  }
});

describe("T-066 criterion 8 — formatting is not this gate's job", () => {
  test("a lint-clean but prettier-hostile probe leaves the script at exit 0", () => {
    const longLine = `export const longLine = '${"x".repeat(150)}'`;
    writeProbe(
      "src/__probe_t066_format.ts",
      [
        "export const single = 'quoted'",
        "export function   spaced( a:number ){return a+1}",
        longLine,
        "",
      ].join("\n"),
    );
    const { exitCode, output } = runLint();
    if (exitCode !== 0) console.error(output);
    expect(exitCode).toBe(0);
  });
});

describe("T-066 criterion 10 — every lint-suppression comment under src/ states why", () => {
  test("each eslint-/oxlint-disable directive has a ` -- ` reason or a comment line directly above", () => {
    // Built by concatenation so this file does not match its own pattern.
    const directive = new RegExp(
      "(?://|/\\*)\\s*(?:es|ox)lint-" + "disable(?:-next-line|-line)?\\b",
    );
    const unexplained: string[] = [];
    for (const file of tsFilesUnder(join(QB_ROOT, "src"))) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        const match = directive.exec(line);
        if (!match) return;
        const rest = line.slice(match.index + match[0].length);
        if (/\s--\s+\S/.test(rest)) return;
        const above = (lines[i - 1] ?? "").trim();
        const aboveIsReason =
          /^(\/\/|\/\*|\*)/.test(above) &&
          !directive.test(above) &&
          above.replace(/^(\/\/|\/\*|\*)\s*/, "").length > 0;
        if (aboveIsReason) return;
        unexplained.push(`${relative(QB_ROOT, file)}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(unexplained).toEqual([]);
  });
});

describe("T-066 criterion 11 — every rule or category turned off or down to warning has a reason beside it", () => {
  const isOffOrWarn = (value: unknown): boolean => {
    const level = Array.isArray(value) ? value[0] : value;
    return level === "off" || level === "warn" || level === "allow" || level === 0 || level === 1;
  };

  test("each off/warn entry in .oxlintrc.json has a comment on its line or the line above", () => {
    const config = oxlintConfig();
    const relaxed = [
      ...Object.entries(config.rules ?? {}),
      ...Object.entries(config.categories ?? {}),
      ...(config.overrides ?? []).flatMap((o) => Object.entries(o.rules ?? {})),
    ]
      .filter(([, value]) => isOffOrWarn(value))
      .map(([key]) => key);

    if (relaxed.length === 0) return;
    const lines = readFileSync(OXLINTRC, "utf8").split("\n");
    const unexplained = relaxed.filter((key) => {
      const i = lines.findIndex((line) => line.includes(`"${key}"`));
      if (i === -1) return true;
      return !(lines[i]!.includes("//") || /^\s*(\/\/|\/\*|\*)/.test(lines[i - 1] ?? ""));
    });
    expect(unexplained).toEqual([]);
  });

  test("the script itself turns nothing off or down (no -A/--allow/-W/--warn flags)", () => {
    // Reasons can only live beside config entries; package.json takes no
    // comments, so a relaxation in the script would have nowhere to explain itself.
    expect(packageJson().scripts.lint).not.toMatch(/(^|\s)(-A|--allow|-W|--warn)(\s|=|$)/);
  });
});

describe("T-066 criterion 13 — CI's question-bank job runs `bun run lint`", () => {
  test("a step's run: is exactly `bun run lint`, with the Typecheck step's if:, and the job name says it lints", () => {
    const job = questionBankJob();
    const steps = stepsOf(job);
    const lint = steps.find((step) => /^\s*run: bun run lint\s*$/m.test(step));
    const typecheck = steps.find((step) => /^\s*run: bun run typecheck\s*$/m.test(step));
    expect(lint).toBeDefined();
    expect(typecheck).toBeDefined();

    const ifOf = (step: string) => /^\s*-?\s*if: (.*)$/m.exec(step)?.[1]?.trim();
    expect(ifOf(typecheck!)).toBe("${{ !cancelled() && steps.install.outcome == 'success' }}");
    expect(ifOf(lint!)).toBe(ifOf(typecheck!));

    const name = /^ {4}name: (.*)$/m.exec(job)?.[1] ?? "";
    expect(name).toMatch(/\blint\b/);
  });
});

describe("T-066 criterion 14 — nothing claims question-bank has no lint", () => {
  test("ci.yml no longer says question-bank has no lint step, config or linter dependency", () => {
    const text = ciYml();
    expect(text).not.toMatch(/no lint step/i);
    expect(text).not.toMatch(/no eslint config/i);
    expect(text).not.toMatch(/no eslint\s+dependency/i);
    expect(text).not.toMatch(/question-bank has no (lint|linter|eslint)/i);
  });

  test("frontend/src/lint-gate.test.ts no longer asserts it, and keeps its criterion-6 and -7 checks", () => {
    const text = readFileSync(join(REPO_ROOT, "frontend/src/lint-gate.test.ts"), "utf8");
    expect(text).not.toMatch(/toMatch\(\/No lint step/);
    expect(text).toContain(`expect(ciYml).not.toContain("brief's Handoff");`);
    expect(text).toContain('expect(ciYml).toContain("run: bun run lint");');
    expect(text).toContain('expect(ciYml).not.toContain("--max-warnings");');
  });
});

describe("T-066 criterion 15 — the gate runs with the network fenced off", () => {
  test("`bun run lint` exits 0 with all six proxy variables pointed at the dead loopback proxy", () => {
    // The repo's one copy of the dead-loopback proxy (T-014 criterion 16 pins
    // it to offline-rebuild.ts), checked here against the criterion's wording.
    const dead = ["http:/", ["127", "0", "0", "1"].join(".") + ":1"].join("/");
    expect(Object.keys(DEAD_PROXY).sort()).toEqual([
      "ALL_PROXY",
      "HTTPS_PROXY",
      "HTTP_PROXY",
      "all_proxy",
      "http_proxy",
      "https_proxy",
    ]);
    for (const value of Object.values(DEAD_PROXY) as string[]) expect(value).toBe(dead);
    const env = { ...process.env, ...DEAD_PROXY };
    const { exitCode, output } = runLint([], env);
    if (exitCode !== 0) console.error(output);
    expect(exitCode).toBe(0);
  });
});

describe("T-066 criterion 17 — no trustedDependencies, overrides or resolutions", () => {
  test("package.json carries none of those keys", () => {
    const pkg = packageJson();
    expect(pkg.trustedDependencies).toBeUndefined();
    expect(pkg.overrides).toBeUndefined();
    expect(pkg.resolutions).toBeUndefined();
  });
});

describe("T-066 criterion 20 — no eslint config exists in question-bank/", () => {
  test("no eslint.config.* and no .eslintrc* outside node_modules", () => {
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (name === "node_modules" || name === ".git") continue;
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (name.startsWith("eslint.config.") || name.startsWith(".eslintrc"))
          found.push(relative(QB_ROOT, full));
      }
    };
    walk(QB_ROOT);
    expect(found).toEqual([]);
  });
});

describe("T-066 criteria 21-22 — written where a brief writer will see it", () => {
  test("conventions.md's question-bank Commands block names `bun run lint`", () => {
    const conventions = readFileSync(join(REPO_ROOT, "conventions.md"), "utf8");
    const commands = conventions.slice(conventions.indexOf("## Commands"));
    const block = /```bash\n([\s\S]*?)```/.exec(commands)?.[1] ?? "";
    // The question-bank section runs from its `# question bank` heading to the next blank-line-separated `# ` heading.
    const qb = /# question bank[\s\S]*?(?=\n\n# |$)/.exec(block)?.[0] ?? "";
    expect(qb).toContain("cd question-bank");
    expect(qb).toMatch(/^bun run lint\b/m);
  });

  test("conventions.md or question-bank/README.md says it lints with oxlint, not eslint", () => {
    const text = ["conventions.md", "question-bank/README.md"]
      .map((file) => readFileSync(join(REPO_ROOT, file), "utf8"))
      .join("\n");
    expect(text).toMatch(/oxlint,?\s+not\s+eslint/i);
  });
});

describe("T-066 criterion 23 — no doc says or implies question-bank has no lint", () => {
  test("conventions.md, README.md, question-bank/README.md, test-guidelines.md and ci.yml", () => {
    const hits: string[] = [];
    for (const file of [
      "conventions.md",
      "README.md",
      "question-bank/README.md",
      "test-guidelines.md",
      ".github/workflows/ci.yml",
    ]) {
      const path = join(REPO_ROOT, file);
      if (!existsSync(path)) continue;
      readFileSync(path, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (
            /no lint\b|no linter|no eslint|not linted|without (a )?lint|lint(ing)? is not (run|set up)|has no `?lint/i.test(
              line,
            ) ||
            /question-bank \(typecheck, test\)/.test(line)
          ) {
            hits.push(`${file}:${i + 1}: ${line.trim()}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });
});

describe("T-066 criterion 24 — engineering-decisions.md E-15", () => {
  function e15(): string {
    const text = readFileSync(join(REPO_ROOT, "engineering-decisions.md"), "utf8");
    const start = text.search(/^## E-15\b/m);
    expect(start).toBeGreaterThan(-1);
    const rest = text.slice(start + 1);
    const next = rest.search(/^## E-\d+/m);
    return next === -1 ? text.slice(start) : text.slice(start, start + 1 + next);
  }

  test("records the split: question-bank on oxlint, frontend on eslint", () => {
    const entry = e15();
    expect(entry).toMatch(/question-bank/);
    expect(entry).toMatch(/oxlint/);
    expect(entry).toMatch(/frontend/);
    expect(entry).toMatch(/eslint/);
  });

  test("records why: typescript-eslint throws on TS 7, oxlint does not depend on typescript", () => {
    const entry = e15();
    expect(entry).toMatch(/typescript-eslint/);
    expect(entry).toMatch(/(TS|typescript`?)\s*`?\^?7/i);
    expect(entry).toMatch(/throw/i);
    expect(entry).toMatch(
      /oxlint[\s\S]*(not|never)[\s\S]*`?typescript`? package|does not depend on the `?typescript`? package/i,
    );
  });

  test("records what was rejected: side-by-side TS 6/7, downgrading TS, waiting", () => {
    const entry = e15();
    expect(entry).toMatch(/side-by-side/i);
    expect(entry).toMatch(/downgrad/i);
    expect(entry).toMatch(/wait/i);
    expect(entry).toMatch(/rejected/i);
  });

  test("records what would change it: typescript-eslint #10940, or frontend moving to oxlint", () => {
    const entry = e15();
    expect(entry).toContain("#10940");
    expect(entry).toMatch(/frontend\/?`? moves? to oxlint/i);
  });
});
