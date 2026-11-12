import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

/**
 * T-107 acceptance criteria 1-11: the two frontend tests that run prettier's
 * writer (`bun run format`) must refuse to start it unless the pinned prettier
 * is the one that will run.
 *
 * Written by the tester (`process.md` step 4) from
 * `tasks/T-107-prettier-writer-guard.md`, not from the implementation.
 *
 * Every scenario runs in a throwaway copy of the repo's tracked files under the
 * OS temp directory, never in the real tree: the real `frontend/node_modules`
 * and `frontend/package.json` are only ever read (criterion 13). Each copy gets
 * a "sentinel" `prettier` first on `PATH` that appends a line to a log outside
 * the copy and exits 0, standing in for an unpinned global prettier. "Tracked
 * file changed" is measured by hashing every tracked `frontend/` file in the
 * copy before and after the run, because the copy is not a git checkout and no
 * test here may build one (T-073).
 *
 * Not asserted here, verified by hand and recorded in the brief's Verdict:
 * criterion 12 (whole suites, which a test inside them cannot observe), 13's
 * review of the two files' changes, and 14-15 (diffs against `main`, P-17).
 *
 * No network: every child runs under a dead proxy (criterion 16).
 */

const FRONTEND_ROOT = join(import.meta.dirname, "..");
const REPO_ROOT = join(FRONTEND_ROOT, "..");
const THIS_FILE = relative(REPO_ROOT, import.meta.path);

const FORMAT_GATE = "src/format-gate.criteria.test.ts";
const README_FENCES = "src/readme-fences.criteria.test.ts";

/** The brief's Definitions: the writer tests, by describe path and name. */
const GATE_WRITER_DESCRIBE =
  "T-075 tester, criterion 7 — the writer and the check cover the same files";
const GATE_WRITER_SUFFIX = ": after bun run format, bun run format:check exits 0";
const README_WRITER =
  "T-076 criteria 7-8: prettier 3.9.6 leaves the fenced README alone > " +
  "criterion 8: bun run format leaves frontend/README.md byte-identical";

const PINNED = (
  JSON.parse(readFileSync(join(FRONTEND_ROOT, "package.json"), "utf8")) as {
    devDependencies: Record<string, string>;
  }
).devDependencies["prettier"]!;
const WRONG = PINNED === "3.8.1" ? "3.8.0" : "3.8.1";

const DEAD = "http://127.0.0.1:1";
const RUN_TIMEOUT = 600_000;

function trackedFiles(): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "-z"], { cwd: REPO_ROOT });
  if (proc.exitCode !== 0) throw new Error(`git ls-files failed: ${proc.stderr.toString()}`);
  return proc.stdout
    .toString()
    .split("\0")
    .filter((path) => path && path !== THIS_FILE && existsSync(join(REPO_ROOT, path)));
}

type Prettier = "missing" | "wrong" | "pinned";

type Copy = {
  root: string;
  frontend: string;
  sentinelLog: string;
  packageLog: string;
  bin: string;
};

const copies: string[] = [];
afterAll(() => {
  for (const dir of copies) rmSync(dir, { recursive: true, force: true });
});

const logger = (log: string) => `#!/bin/sh\necho "ran $*" >> "${log}"\nexit 0\n`;

function makeCopy(prettier: Prettier): Copy {
  const base = mkdtempSync(join(tmpdir(), "t107-"));
  copies.push(base);
  const root = join(base, "repo");
  for (const path of trackedFiles()) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    cpSync(join(REPO_ROOT, path), join(root, path));
  }
  const frontend = join(root, "frontend");
  const sentinelLog = join(base, "sentinel.log");
  const packageLog = join(base, "package.log");
  const bin = join(base, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "prettier"), logger(sentinelLog));
  chmodSync(join(bin, "prettier"), 0o755);

  const modules = join(frontend, "node_modules");
  if (prettier === "wrong") {
    // A prettier package at the wrong version whose binary only records that it ran.
    mkdirSync(join(modules, "prettier"), { recursive: true });
    mkdirSync(join(modules, ".bin"), { recursive: true });
    writeFileSync(
      join(modules, "prettier/package.json"),
      JSON.stringify({ name: "prettier", version: WRONG, bin: "./bin/prettier.cjs" }),
    );
    writeFileSync(join(modules, ".bin/prettier"), logger(packageLog));
    chmodSync(join(modules, ".bin/prettier"), 0o755);
  } else if (prettier === "pinned") {
    // The real pinned package, copied (read-only access to the real one).
    mkdirSync(join(modules, ".bin"), { recursive: true });
    cpSync(join(FRONTEND_ROOT, "node_modules/prettier"), join(modules, "prettier"), {
      recursive: true,
    });
    symlinkSync("../prettier/bin/prettier.cjs", join(modules, ".bin/prettier"));
  }
  return { root, frontend, sentinelLog, packageLog, bin };
}

/** The brief's Definitions: a write start has `--write` or `-w` among its arguments. */
const isWriteStart = (args: string) =>
  args.split(/\s+/).some((arg) => arg === "--write" || arg === "-w");

const lines = (log: string) =>
  existsSync(log) ? readFileSync(log, "utf8").split("\n").filter(Boolean) : [];

/** sha256 of every tracked frontend file in the copy, by path. */
function snapshot(copy: Copy): Map<string, string> {
  const out = new Map<string, string>();
  for (const path of trackedFiles().filter((p) => p.startsWith("frontend/"))) {
    const full = join(copy.root, path);
    out.set(
      path,
      existsSync(full) ? createHash("sha256").update(readFileSync(full)).digest("hex") : "gone",
    );
  }
  return out;
}

const changed = (before: Map<string, string>, after: Map<string, string>) =>
  [...before].filter(([path, sha]) => after.get(path) !== sha).map(([path]) => path);

/** Every file under the copy's frontend/, node_modules aside. */
function allFiles(dir: string, root = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules") return [];
    const full = join(dir, entry.name);
    return entry.isDirectory() ? allFiles(full, root) : [relative(root, full)];
  });
}

type Outcome = { status: "pass" | "fail" | "skip"; output: string };

const decode = (text: string) =>
  text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");

type Run = {
  results: Map<string, Outcome>;
  sentinelRuns: number;
  /** The arguments of each sentinel start, one entry per start. */
  sentinelStarts: string[];
  packageRuns: number;
  changedFiles: string[];
  newFiles: string[];
  raw: string;
};

function runTests(copy: Copy, args: string[]): Run {
  const before = snapshot(copy);
  const filesBefore = new Set(allFiles(copy.frontend));
  const inheritedPath = (process.env["PATH"] ?? "")
    .split(":")
    .filter((entry) => !entry.includes("node_modules"));
  const junit = join(dirname(copy.root), "junit.xml");
  const proc = spawnSync(
    process.execPath,
    ["test", "--reporter=junit", `--reporter-outfile=${junit}`, ...args],
    {
      cwd: copy.frontend,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: [copy.bin, ...inheritedPath].join(":"),
        HTTP_PROXY: DEAD,
        HTTPS_PROXY: DEAD,
        ALL_PROXY: DEAD,
        http_proxy: DEAD,
        https_proxy: DEAD,
        all_proxy: DEAD,
      },
      maxBuffer: 256 * 1024 * 1024,
    },
  );
  const raw = `${proc.stdout ?? ""}${proc.stderr ?? ""}`;
  // Bun prints a failing test's error output, then its "(fail) describe > name" line.
  const consoleOutput = new Map<string, string>();
  let pending: string[] = [];
  for (const line of raw.split("\n")) {
    const match = line.match(/^\((?:pass|fail|skip|todo)\) (.*?)(?: \[[\d.]+m?s\])?$/);
    if (match) {
      consoleOutput.set(match[1]!, pending.join("\n"));
      pending = [];
    } else {
      pending.push(line);
    }
  }
  // Statuses come from the JUnit report: a non-TTY run prints no "(pass)" lines.
  const results = new Map<string, Outcome>();
  const xml = existsSync(junit) ? readFileSync(junit, "utf8") : "";
  for (const match of xml.matchAll(
    /<testcase name="([^"]*)" classname="([^"]*)"[^>]*?(\/>|>([\s\S]*?)<\/testcase>)/g,
  )) {
    const name = [...decode(match[2]!).split(" > ").reverse(), decode(match[1]!)].join(" > ");
    const body = match[4] ?? "";
    const status = body.includes("<failure") ? "fail" : body.includes("<skipped") ? "skip" : "pass";
    results.set(name, {
      status,
      output: `${decode(body)}\n${consoleOutput.get(name) ?? ""}`,
    });
  }
  const after = snapshot(copy);
  return {
    results,
    sentinelRuns: lines(copy.sentinelLog).length,
    sentinelStarts: lines(copy.sentinelLog).map((line) => line.replace(/^ran ?/, "")),
    packageRuns: lines(copy.packageLog).length,
    changedFiles: changed(before, after),
    newFiles: allFiles(copy.frontend).filter((file) => !filesBefore.has(file)),
    raw,
  };
}

/** The eight writer tests' outcomes, keyed by full name. */
function writerResults(run: Run): Array<[string, Outcome]> {
  return [...run.results].filter(
    ([name]) =>
      name === README_WRITER ||
      (name.startsWith(`${GATE_WRITER_DESCRIBE} > `) && name.endsWith(GATE_WRITER_SUFFIX)),
  );
}

const TWO_FILES = [FORMAT_GATE, README_FENCES];
/** Selects exactly the eight writer tests across the two files. */
const WRITERS_ONLY = "criterion 7 — the writer|criterion 8: bun run format";

describe("T-107 criteria 1-3: pinned prettier not installed, sentinel first on PATH", () => {
  let run: Run | undefined;
  const get = () => (run ??= runTests(makeCopy("missing"), TWO_FILES));

  test(
    "criterion 1: running only the eight writer tests executes the sentinel zero times",
    () => {
      // Amended criterion 1: only the writer tests run here, so check starts from
      // the read-only format:check tests (Out of scope) cannot be counted.
      const run = runTests(makeCopy("missing"), [
        ...TWO_FILES,
        "--test-name-pattern",
        WRITERS_ONLY,
      ]);
      const writers = writerResults(run);
      expect(writers).toHaveLength(8);
      // Only the writer tests ran: everything else in the two files was filtered out.
      const writerNames = new Set(writers.map(([name]) => name));
      const othersRan = [...run.results]
        .filter(([name, o]) => !writerNames.has(name) && o.status !== "skip")
        .map(([name]) => name);
      expect(othersRan).toEqual([]);
      expect(run.sentinelStarts).toEqual([]);
    },
    RUN_TIMEOUT,
  );

  test(
    "criterion 2: no tracked file under frontend/ changes",
    () => {
      expect(get().changedFiles).toEqual([]);
    },
    RUN_TIMEOUT,
  );

  test(
    "criterion 3: all eight writer tests are reported failed",
    () => {
      const writers = writerResults(get());
      expect(writers).toHaveLength(8);
      expect(writers.map(([name, o]) => [name, o.status])).toEqual(
        writers.map(([name]) => [name, "fail"]),
      );
    },
    RUN_TIMEOUT,
  );

  test(
    "criterion 3: each failure names the pinned version and that node_modules/prettier is missing",
    () => {
      const writers = writerResults(get());
      expect(writers).toHaveLength(8);
      for (const [name, outcome] of writers) {
        expect({ name, names: outcome.output.includes(PINNED) }).toEqual({ name, names: true });
        expect({
          name,
          missing: /node_modules\/prettier[^\n]*missing/.test(outcome.output),
        }).toEqual({ name, missing: true });
      }
    },
    RUN_TIMEOUT,
  );
});

describe("T-107 criteria 4-6: the wrong prettier version installed, sentinel first on PATH", () => {
  let run: Run | undefined;
  const get = () => (run ??= runTests(makeCopy("wrong"), TWO_FILES));

  test(
    "criterion 4: the writer tests run no prettier at all, neither the sentinel nor node_modules/prettier",
    () => {
      // Only the eight writer tests run here, so every prettier start counted
      // below belongs to one of them (the criterion's "for any of the writer tests").
      const run = runTests(makeCopy("wrong"), [...TWO_FILES, "--test-name-pattern", WRITERS_ONLY]);
      expect(writerResults(run)).toHaveLength(8);
      const { sentinelRuns, packageRuns } = run;
      expect({ sentinelRuns, packageRuns }).toEqual({ sentinelRuns: 0, packageRuns: 0 });
    },
    RUN_TIMEOUT,
  );

  test(
    "criterion 5: no tracked file under frontend/ changes",
    () => {
      expect(get().changedFiles).toEqual([]);
    },
    RUN_TIMEOUT,
  );

  test(
    "criterion 6: all eight writer tests are reported failed",
    () => {
      const writers = writerResults(get());
      expect(writers).toHaveLength(8);
      expect(writers.map(([name, o]) => [name, o.status])).toEqual(
        writers.map(([name]) => [name, "fail"]),
      );
    },
    RUN_TIMEOUT,
  );

  test(
    "criterion 6: each failure names both the pinned version and the version found",
    () => {
      const writers = writerResults(get());
      expect(writers).toHaveLength(8);
      for (const [name, outcome] of writers) {
        expect({
          name,
          pinned: outcome.output.includes(PINNED),
          found: outcome.output.includes(WRONG),
        }).toEqual({ name, pinned: true, found: true });
      }
    },
    RUN_TIMEOUT,
  );
});

describe("T-107 criteria 7-10: the pinned prettier installed", () => {
  let run: Run | undefined;
  const get = () => (run ??= runTests(makeCopy("pinned"), TWO_FILES));

  test(
    "criterion 7: with a sentinel first on PATH, the sentinel runs zero times",
    () => {
      expect(get().sentinelRuns).toBe(0);
    },
    RUN_TIMEOUT,
  );

  test(
    "criterion 8: all eight writer tests pass",
    () => {
      const writers = writerResults(get());
      expect(writers).toHaveLength(8);
      expect(writers.map(([name, o]) => [name, o.status])).toEqual(
        writers.map(([name]) => [name, "pass"]),
      );
    },
    RUN_TIMEOUT,
  );

  test(
    "criterion 10: no tracked file under frontend/ changes, and no probe file is left behind",
    () => {
      const { changedFiles, newFiles } = get();
      expect({ changedFiles, newFiles }).toEqual({ changedFiles: [], newFiles: [] });
    },
    RUN_TIMEOUT,
  );

  test(
    "criterion 9: with the writer made a no-op, every format-gate criterion 7 test fails",
    () => {
      const copy = makeCopy("pinned");
      const pkgPath = join(copy.frontend, "package.json");
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { scripts: Record<string, string> };
      pkg.scripts["format"] = "true";
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
      const writers = writerResults(
        runTests(copy, [FORMAT_GATE, "--test-name-pattern", "criterion 7 — the writer"]),
      );
      expect(writers).toHaveLength(7);
      expect(writers.map(([name, o]) => [name, o.status])).toEqual(
        writers.map(([name]) => [name, "fail"]),
      );
    },
    RUN_TIMEOUT,
  );

  test(
    "criterion 9: with a README line the pinned prettier rewrites, readme-fences criterion 8 fails",
    () => {
      const copy = makeCopy("pinned");
      const readme = join(copy.frontend, "README.md");
      const text = readFileSync(readme, "utf8").split("\n");
      const heading = text.findIndex((line) => /^# \S/.test(line));
      expect(heading).toBeGreaterThan(-1);
      text[heading] = text[heading]!.replace(/^# /, "#   ");
      writeFileSync(readme, text.join("\n"));
      const run = runTests(copy, [README_FENCES, "--test-name-pattern", "criterion 8: bun run"]);
      expect(run.results.get(README_WRITER)?.status).toBe("fail");
    },
    RUN_TIMEOUT,
  );
});

describe("T-107 criterion 11: the whole frontend suite, no node_modules, sentinel first on PATH", () => {
  test(
    "no tracked file changes in the copy, and the sentinel is never started as a writer",
    () => {
      const run = runTests(makeCopy("missing"), []);
      // The run really happened: the writer tests were among the results.
      expect(writerResults(run)).toHaveLength(8);
      // Amended criterion 11: check starts are allowed and not counted; write starts are.
      const writeStarts = run.sentinelStarts.filter(isWriteStart);
      const { changedFiles } = run;
      expect({ writeStarts, changedFiles }).toEqual({ writeStarts: [], changedFiles: [] });
    },
    RUN_TIMEOUT,
  );
});
