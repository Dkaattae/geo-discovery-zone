/**
 * T-082 (worker): the guard behind "no test spawns `build.ts` itself".
 *
 * The three older guards (`climate-kid.test.ts`, `climate-kid-verify.test.ts`,
 * `top-crops-verify.test.ts`) only see the text `build.ts` written inside the
 * spawn call. A test that names the script through a constant (declared from
 * the script's path, then passed as an argv element) slipped past all three. This guard reads the argv array literal of every
 * `Bun.spawn` / `Bun.spawnSync` call in every tracked `*.test.ts` under
 * `question-bank/src/` and rejects it when an element
 *
 *   (i)  is a string or template literal containing `build.ts`, or
 *   (ii) is an identifier declared with `const` or `let` (any scope, same file)
 *        whose initialiser contains the text `build.ts`.
 *
 * A constant naming `build.ts` that is handed to the harness
 * (`rebuildOffline(BUILD, …)`) is fine: only a spawn's argv is inspected.
 *
 * Not covered, by the brief's definition: a constant imported from another
 * module, `child_process` / `Bun.$`, a package script that runs `build.ts`,
 * and the object form of a spawn (`{ cmd: [...] }`). Comments are not stripped;
 * nothing requires either answer for a spawn written only in a comment.
 *
 * This file is subject to its own rule and to the older guards' regexes, so
 * every needle and every probe snippet below is assembled from parts: no spawn
 * call name is followed by an open paren in this source, and no code here
 * spells the script's file name.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");

const TARGET = ["build", "ts"].join(".");
const SYNC = ["Bun", "spawnSync"].join(".");
const ASYNC = ["Bun", "spawn"].join(".");

/** A spawn call whose first argument is an array literal; `[` is the last char matched. */
const SPAWN_CALL = new RegExp(String.raw`\bBun\.spawn(?:Sync)?\(\s*\[`, "g");
const DECLARATION = /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;\n]+)?=(?!=|>)/g;
const IDENTIFIER = /[A-Za-z_$][\w$]*/g;

interface SpawnFinding {
  line: number;
  argv: string;
}

/** Index just past the string or template literal opening at `start`. */
function skipString(source: string, start: number): number {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length && source[i] !== quote) i += source[i] === "\\" ? 2 : 1;
  return i + 1;
}

/**
 * Reads forward from `start` until `stop` says to, at bracket depth zero,
 * skipping string literals. Returns the index it stopped at.
 */
function scanBalanced(source: string, start: number, stop: (ch: string) => boolean): number {
  let depth = 0;
  let i = start;
  while (i < source.length) {
    const ch = source[i]!;
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipString(source, i);
      continue;
    }
    if (depth === 0 && stop(ch)) return i;
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    i++;
  }
  return i;
}

/** Names declared with `const`/`let` whose initialiser mentions the build script. */
function namesForBuildScript(source: string): Set<string> {
  const names = new Set<string>();
  for (const m of source.matchAll(DECLARATION)) {
    const from = m.index + m[0].length;
    const end = scanBalanced(source, from, (ch) => ch === ";" || ch === "\n" || ch === ",");
    if (source.slice(from, end).includes(TARGET)) names.add(m[1]!);
  }
  return names;
}

/** The source of `text` with every string and template literal blanked out. */
function withoutStrings(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === '"' || ch === "'" || ch === "`") {
      const end = skipString(text, i);
      out += " ".repeat(end - i);
      i = end;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

/** Every spawn of the build script in one file's source, by the brief's definition. */
function spawnsOfBuild(source: string): SpawnFinding[] {
  const tainted = namesForBuildScript(source);
  const found: SpawnFinding[] = [];
  for (const m of source.matchAll(SPAWN_CALL)) {
    const open = m.index + m[0].length - 1;
    // The array literal: from its `[` to the matching `]`.
    const close = scanBalanced(source, open + 1, (ch) => ch === "]");
    const argv = source.slice(open, close + 1);
    // (i) Identifiers cannot contain a dot, so any `build.ts` in the array is
    // inside a literal (or a comment, which the brief leaves open).
    const viaLiteral = argv.includes(TARGET);
    // (ii) An identifier element declared from the build script's path.
    const viaName = (withoutStrings(argv).match(IDENTIFIER) ?? []).some((id) => tainted.has(id));
    if (viaLiteral || viaName) {
      found.push({ line: source.slice(0, m.index).split("\n").length, argv });
    }
  }
  return found;
}

function trackedTests(): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "-z", "--", "question-bank/src"], { cwd: REPO });
  if (proc.exitCode !== 0) throw new Error(`git ls-files exited ${proc.exitCode}`);
  return proc.stdout
    .toString()
    .split("\0")
    .filter((p) => p.endsWith(".test.ts"))
    .sort();
}

describe("T-082 — no *.test.ts under question-bank/src/ spawns build.ts, literally or through a constant", () => {
  const files = trackedTests();

  test("the scan finds test files, the two refresh suites among them", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain("question-bank/src/refresh.test.ts");
    expect(files).toContain("question-bank/src/refresh-verify.test.ts");
    expect(files).toContain("question-bank/src/spawn-guard.test.ts");
  });

  test("no tracked test spawns build.ts", () => {
    const findings = files.flatMap((path) =>
      spawnsOfBuild(readFileSync(join(REPO, path), "utf8")).map((f) => `${path}:${f.line}`),
    );
    expect(findings).toEqual([]);
  });
});

describe("T-082 — what the scan catches and what it lets through (probes built from parts)", () => {
  const sync = (argv: string) => `${SYNC}(${argv});`;
  const spawn = (argv: string) => `${ASYNC}(${argv});`;

  test("a constant from a single-string path", () => {
    const source = [`const B = join(PKG, "src/${TARGET}");`, sync(`["bun", B, "--offline"]`)].join(
      "\n",
    );
    expect(spawnsOfBuild(source).map((f) => f.line)).toEqual([2]);
  });

  test("a constant from a split path, declared with let, spawned on a later line", () => {
    const source = [
      `let B2 = join(PKG, "src", "${TARGET}");`,
      `const other = 1;`,
      sync(`["bun", B2, "--offline", "--quiet"]`),
    ].join("\n");
    expect(spawnsOfBuild(source).map((f) => f.line)).toEqual([3]);
  });

  test("a constant whose initialiser spans lines, used in a multi-line argv", () => {
    const source = [
      `const BUILD_SCRIPT = join(`,
      `  PKG,`,
      `  "src/${TARGET}",`,
      `);`,
      `test("x", () => {`,
      `  const proc = ${SYNC}(`,
      `    ["bun", BUILD_SCRIPT, "--offline", "--fixture", f, "--out", out],`,
      `    { env: {} },`,
      `  );`,
      `});`,
    ].join("\n");
    expect(spawnsOfBuild(source).map((f) => f.line)).toEqual([6]);
  });

  test("an async spawn of a literal path", () => {
    expect(spawnsOfBuild(spawn(`["bun", "src/${TARGET}", "--offline"]`))).toHaveLength(1);
  });

  test("a sync spawn of a literal path, and of a template literal", () => {
    expect(spawnsOfBuild(sync(`["bun", "src/${TARGET}", "--offline"]`))).toHaveLength(1);
    expect(spawnsOfBuild(sync("[`bun`, `${PKG}/src/" + TARGET + "`]"))).toHaveLength(1);
  });

  test("a build-script constant handed to the harness is not a spawn", () => {
    const source = [
      `const BUILD = join(PKG, "src/${TARGET}");`,
      `const files = rebuildOffline(BUILD, ["index.json"], "x-");`,
      `const report = rebuildOfflineWithStdout(BUILD, [], "y-", { fixture });`,
    ].join("\n");
    expect(spawnsOfBuild(source)).toEqual([]);
  });

  test("spawns of git and of bun run lint / format:check pass, beside a build-script constant", () => {
    const source = [
      `const BUILD = join(PKG, "src/${TARGET}");`,
      sync(`["git", "ls-files", "question-bank/src"]`),
      sync(`["bun", "run", "lint"]`),
      spawn(`["bun", "run", "format:check"]`),
    ].join("\n");
    expect(spawnsOfBuild(source)).toEqual([]);
  });

  test("an identifier only sharing a prefix with a build-script constant passes", () => {
    const source = [
      `const BUILD = join(PKG, "src/${TARGET}");`,
      `const BUILD_LOG = "out.txt";`,
      sync(`["cat", BUILD_LOG]`),
    ].join("\n");
    expect(spawnsOfBuild(source)).toEqual([]);
  });

  test("a string argument naming the constant is not the constant", () => {
    const source = [`const B = join(PKG, "src/${TARGET}");`, sync(`["echo", "B"]`)].join("\n");
    expect(spawnsOfBuild(source)).toEqual([]);
  });
});
