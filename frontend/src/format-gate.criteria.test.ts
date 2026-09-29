import { afterEach, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-075 acceptance criteria: frontend's pinned prettier and its CI format gate.
 *
 * Written by the tester (`process.md` step 4) from
 * `tasks/T-075-frontend-format-gate.md`, not from the implementation. The gate
 * criteria spawn `bun run format:check` / `bun run format` — the locally
 * installed prettier, never bunx — with probe files removed in afterEach. No
 * network: criterion 10 runs the gate under a dead proxy, and CI's Test step
 * sets the same one for this whole file.
 *
 * Not asserted here, verified by hand and recorded in the brief's Verdict:
 * criterion 4's "same keys and values as on main" and "only one bun.lock line
 * differs", 8 (byte-identical to main), 13's "question-bank job byte-identical
 * to main", 14 (CI on the head commit), 15-17 (the reformat commit's content),
 * 18 (the suites themselves), 19 and 22's "existing entries unchanged". Each of
 * those is a diff against another revision, which a test here must not resolve
 * (T-073, `git-baseline-guard.criteria.test.ts`).
 */

const FRONTEND_ROOT = join(import.meta.dirname, "..");
const REPO_ROOT = join(FRONTEND_ROOT, "..");

type PackageJson = {
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
};

const readPkg = (dir: string) =>
  JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as PackageJson;
const frontendPkg = () => readPkg(FRONTEND_ROOT);
const questionBankPkg = () => readPkg(join(REPO_ROOT, "question-bank"));

const DEAD = "http://127.0.0.1:1";
const DEAD_PROXY = {
  HTTP_PROXY: DEAD,
  HTTPS_PROXY: DEAD,
  ALL_PROXY: DEAD,
  http_proxy: DEAD,
  https_proxy: DEAD,
  all_proxy: DEAD,
};

type RunResult = { exitCode: number; output: string };

function run(script: string, env: NodeJS.ProcessEnv = process.env): RunResult {
  try {
    const output = execFileSync("bun", ["run", script], {
      cwd: FRONTEND_ROOT,
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
  const fullPath = join(FRONTEND_ROOT, relativePath);
  mkdirSync(join(fullPath, ".."), { recursive: true });
  writeFileSync(fullPath, content);
  probeFiles.push(fullPath);
}

afterEach(() => {
  while (probeFiles.length > 0) rmSync(probeFiles.pop()!, { force: true });
});

const GATE_TIMEOUT = 120_000;

/** Criterion 6's seven paths, each with content prettier 3 rewrites. */
const PROBES: Array<{ path: string; content: string }> = [
  { path: "src/t075-probe.ts", content: "const  x = {a:1}\nexport default x\n" },
  { path: "src/t075-probe.tsx", content: "export const A = () => <div   className='a'>hi</div>\n" },
  { path: "src/t075-probe.css", content: ".a{color:red}\n" },
  { path: "src/t075-probe.json", content: '{"a":1,\n"b":   2}\n' },
  { path: "t075-probe.md", content: "#  Heading\n\n*  item\n" },
  { path: "src/routes/t075-probe.md", content: "#  Heading\n\n*  item\n" },
  { path: "scripts/t075-probe.mjs", content: "const  x = {a:1}\nexport default x\n" },
];

describe("T-075 tester, criterion 1 — prettier is pinned to an exact version", () => {
  test("devDependencies.prettier matches ^\\d+.\\d+.\\d+$ — no range, tag, URL or latest", () => {
    expect(frontendPkg().devDependencies?.["prettier"] ?? "").toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("T-075 tester, criterion 2 — the same pin as question-bank", () => {
  test("frontend's devDependencies.prettier is string-equal to question-bank's, both 3.9.6", () => {
    expect({
      frontend: frontendPkg().devDependencies?.["prettier"],
      questionBank: questionBankPkg().devDependencies?.["prettier"],
    }).toEqual({ frontend: "3.9.6", questionBank: "3.9.6" });
  });
});

describe("T-075 tester, criterion 3 — bun.lock specifier and resolution", () => {
  const lock = () => readFileSync(join(FRONTEND_ROOT, "bun.lock"), "utf8");

  test("the workspace block's prettier specifier is the pinned string", () => {
    const text = lock();
    const workspace = text.slice(text.indexOf('"workspaces"'), text.indexOf('"packages"'));
    expect(workspace.length).toBeGreaterThan(0);
    const specifiers = [...workspace.matchAll(/^\s*"prettier": "([^"]+)",?$/gm)].map((m) => m[1]);
    expect(specifiers).toEqual([frontendPkg().devDependencies!["prettier"]!]);
  });

  test("the resolved prettier package entry is prettier@<the pinned version>", () => {
    const resolved = [...lock().matchAll(/^\s*"prettier": \["prettier@([^"]+)"/gm)].map(
      (m) => m[1],
    );
    expect(resolved).toEqual([frontendPkg().devDependencies!["prettier"]!]);
  });
});

describe("T-075 tester, criterion 4 — no escape hatches added", () => {
  test("no trustedDependencies, overrides or resolutions key", () => {
    const pkg = frontendPkg();
    expect({
      trustedDependencies: "trustedDependencies" in pkg,
      overrides: "overrides" in pkg,
      resolutions: "resolutions" in pkg,
    }).toEqual({ trustedDependencies: false, overrides: false, resolutions: false });
  });
});

describe("T-075 tester, criterion 5 — format:check exists and passes on the head", () => {
  test("package.json has a format:check script that runs prettier --check", () => {
    const script = frontendPkg().scripts["format:check"] ?? "";
    expect(script).toMatch(/\bprettier\b/);
    expect(script).toMatch(/(^|\s)--check(\s|$)/);
    expect(script).not.toMatch(/--write/);
  });

  test(
    "bun run format:check exits 0",
    () => {
      const result = run("format:check");
      if (result.exitCode !== 0) console.error(result.output);
      expect(result.exitCode).toBe(0);
    },
    GATE_TIMEOUT,
  );
});

describe("T-075 tester, criterion 6 — each unformatted probe fails the gate and is named", () => {
  for (const probe of PROBES) {
    test(
      `${probe.path}: non-zero exit, probe named in the output`,
      () => {
        writeProbe(probe.path, probe.content);
        const result = run("format:check");
        expect(result.exitCode).not.toBe(0);
        expect(result.output).toContain(probe.path);
      },
      GATE_TIMEOUT,
    );
  }
});

describe("T-075 tester, criterion 7 — the writer and the check cover the same files", () => {
  for (const probe of PROBES) {
    test(
      `${probe.path}: after bun run format, bun run format:check exits 0`,
      () => {
        writeProbe(probe.path, probe.content);
        expect(run("format").exitCode).toBe(0);
        const result = run("format:check");
        if (result.exitCode !== 0) console.error(result.output);
        expect(result.exitCode).toBe(0);
      },
      GATE_TIMEOUT,
    );
  }
});

describe("T-075 tester, criterion 9 — no prettier-ignore directive in tracked frontend files", () => {
  test("no tracked file under frontend/ contains the directive, in any comment syntax", () => {
    // Assembled from halves so this file does not contain the string it scans for.
    const directive = "prettier" + "-ignore";
    const proc = Bun.spawnSync(["git", "ls-files", "-z", "--", "."], { cwd: FRONTEND_ROOT });
    if (proc.exitCode !== 0) throw new Error(`git ls-files failed: ${proc.stderr.toString()}`);
    const files = proc.stdout.toString().split("\0").filter(Boolean);
    expect(files.length).toBeGreaterThan(50);
    const hits = files.filter((file) => {
      try {
        return readFileSync(join(FRONTEND_ROOT, file), "utf8").includes(directive);
      } catch {
        return false; // a tracked path deleted in the working tree
      }
    });
    expect(hits).toEqual([]);
  });
});

describe("T-075 tester, criterion 10 — the gate needs no network", () => {
  const offline = { ...process.env, ...DEAD_PROXY };

  test(
    "bun run format:check exits 0 with all six proxy variables dead",
    () => {
      expect(run("format:check", offline).exitCode).toBe(0);
    },
    GATE_TIMEOUT,
  );

  test(
    "and still fails on a probe under the dead proxy, so the 0 above is a real check",
    () => {
      writeProbe("src/t075-offline-probe.ts", PROBES[0]!.content);
      const result = run("format:check", offline);
      expect(result.exitCode).not.toBe(0);
      expect(result.output).toContain("src/t075-offline-probe.ts");
    },
    GATE_TIMEOUT,
  );
});

// ---------------------------------------------------------------------------
// CI (criteria 11-13)
// ---------------------------------------------------------------------------

const ciYml = () => readFileSync(join(REPO_ROOT, ".github/workflows/ci.yml"), "utf8");

function jobBlock(key: string): string {
  const lines = ciYml().split("\n");
  const start = lines.findIndex((line) => line === `  ${key}:`);
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

const stepsOf = (job: string) => job.split(/\n(?= {6}- )/).slice(1);
const stepField = (step: string, field: string) =>
  step.match(new RegExp(`^ {6}(?:- | {2})${field}: (.*)$`, "m"))?.[1]?.trim();

describe("T-075 tester, criterion 11 — the frontend job runs the check", () => {
  test("exactly one frontend step's run: is exactly `bun run format:check`", () => {
    const matching = stepsOf(jobBlock("frontend")).filter(
      (step) => stepField(step, "run") === "bun run format:check",
    );
    expect(matching.length).toBe(1);
  });
});

describe("T-075 tester, criterion 12 — its if: matches Typecheck, Lint and Test", () => {
  test("all four if: lines are character-identical to the documented condition", () => {
    const EXPECTED_IF = "${{ !cancelled() && steps.install.outcome == 'success' }}";
    const steps = stepsOf(jobBlock("frontend"));
    const byName = (name: string) => steps.find((s) => stepField(s, "name") === name) ?? "";
    const format = steps.find((s) => stepField(s, "run") === "bun run format:check") ?? "";
    expect({
      format: stepField(format, "if"),
      typecheck: stepField(byName("Typecheck"), "if"),
      lint: stepField(byName("Lint"), "if"),
      test: stepField(byName("Test"), "if"),
    }).toEqual({
      format: EXPECTED_IF,
      typecheck: EXPECTED_IF,
      lint: EXPECTED_IF,
      test: EXPECTED_IF,
    });
  });
});

describe("T-075 tester, criterion 13 — the job key and name are unchanged", () => {
  test("job key `frontend` has name: frontend (typecheck, lint, test)", () => {
    expect(jobBlock("frontend").split("\n")[1]).toBe("    name: frontend (typecheck, lint, test)");
  });
});

// ---------------------------------------------------------------------------
// Docs (criteria 20-22)
// ---------------------------------------------------------------------------

const conventions = () => readFileSync(join(REPO_ROOT, "conventions.md"), "utf8");

describe("T-075 tester, criterion 20 — conventions.md Formatting covers both packages", () => {
  test("the Formatting paragraph says both pin an exact version and CI runs format:check in both", () => {
    const text = conventions();
    const start = text.indexOf("**Formatting**");
    expect(start).toBeGreaterThan(-1);
    const end = text.indexOf("\n\n", start);
    const para = (end === -1 ? text.slice(start) : text.slice(start, end)).replace(/\s+/g, " ");
    expect(para).toMatch(/\bboth\b/i);
    expect(para).toContain("frontend/");
    expect(para).toContain("question-bank/");
    expect(para).toMatch(/exact version/i);
    expect(para).toContain("bun run format:check");
    expect(para).toMatch(/CI runs `bun run format:check` in both/);
    // No leftover wording that only question-bank pins or is checked.
    expect(para).not.toMatch(/`question-bank\/` pins prettier/);
  });
});

describe("T-075 tester, criterion 21 — the Commands block names frontend's format check", () => {
  test("a `cd frontend` line in the Commands block names `bun run format:check`", () => {
    const text = conventions();
    const start = text.search(/^#+ Commands\b/m);
    expect(start).toBeGreaterThan(-1);
    const rest = text.slice(text.indexOf("\n", start) + 1);
    const next = rest.search(/^## /m);
    const block = next === -1 ? rest : rest.slice(0, next);
    const lines = block
      .split("\n")
      .filter((l) => /^cd frontend\b/.test(l) && /bun run format:check(?![\w:-])/.test(l));
    expect(lines.length).toBeGreaterThan(0);
  });
});

describe("T-075 tester, criterion 22 — engineering-decisions.md E-17", () => {
  const decisions = () => readFileSync(join(REPO_ROOT, "engineering-decisions.md"), "utf8");

  function entry(id: string): string {
    const text = decisions();
    const start = text.search(new RegExp(`^## ${id}\\b`, "m"));
    expect(start).toBeGreaterThan(-1);
    const after = text.slice(start + 1);
    const next = after.search(/^## /m);
    return text.slice(start, next === -1 ? undefined : start + 1 + next);
  }

  test("## E-17 directly follows ## E-16 with no heading between", () => {
    const text = decisions();
    const e16 = text.search(/^## E-16\b/m);
    const e17 = text.search(/^## E-17\b/m);
    expect(e16).toBeGreaterThan(-1);
    expect(e17).toBeGreaterThan(e16);
    // From the line after E-16's own heading up to E-17's.
    expect(text.slice(text.indexOf("\n", e16), e17)).not.toMatch(/^#{1,6} /m);
  });

  test("E-17 records the exact pin shared with question-bank", () => {
    const text = entry("E-17").replace(/\s+/g, " ");
    expect(text).toMatch(/prettier/i);
    expect(text).toMatch(/\bexact/i);
    expect(text).toContain("3.9.6");
    expect(text).toContain("frontend/");
    expect(text).toContain("question-bank/");
  });

  test("E-17 records the glob `.` and why: it matches the writer, and .ts/.tsx were gated via eslint", () => {
    const text = entry("E-17").replace(/\s+/g, " ");
    expect(text).toContain("prettier --check .");
    expect(text).toMatch(/prettier --write \.|bun run format/);
    expect(text).toMatch(/eslint/i);
    expect(text).toMatch(/\.tsx?\b/);
  });

  test("E-17 records that a prettier bump changes both packages in the same change", () => {
    const text = entry("E-17").replace(/\s+/g, " ");
    expect(text).toMatch(/bump/i);
    expect(text).toMatch(/\bboth\b/i);
    expect(text).toMatch(/same change/i);
  });
});
