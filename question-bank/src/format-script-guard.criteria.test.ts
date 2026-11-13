import { afterAll, describe, expect, test } from "bun:test";
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
import { DEAD_PROXY } from "./offline-rebuild";

/**
 * T-109 acceptance criteria 1-12, 15 and 16: `bun run format` and
 * `bun run format:check` in `frontend/` and `question-bank/` refuse to run
 * unless the pinned prettier is installed, and behave as before when it is.
 *
 * Written by the tester (`process.md` step 4) from
 * `tasks/T-109-format-script-guard.md`, not from the implementation.
 *
 * Every scenario that needs a particular `node_modules` state runs in a
 * throwaway copy of the package's tracked files under the OS temp directory.
 * The real `<package>/node_modules` is only ever read (criterion 15): the
 * "installed" copies get a byte copy of the real `node_modules/prettier`.
 * A "sentinel" `prettier` (the brief's Definitions) appends a line to a log
 * outside the copy, and also appends to an unformatted tracked file inside the
 * copy, so that if it ran it would both be seen and change a tracked file.
 *
 * Criteria 8 and 11 also run in the real package tree, which `format:check`
 * only reads.
 *
 * Not asserted here, verified by hand in the brief's Verdict: 13 and 14
 * (diffs against `main` and CI results, P-17), 17 (the conventions.md text)
 * and 18 (no existing test deleted or weakened).
 *
 * No network: every child runs under a dead proxy (criterion 16).
 */

const QB_ROOT = join(import.meta.dirname, "..");
const REPO_ROOT = join(QB_ROOT, "..");
const THIS_FILE = relative(REPO_ROOT, import.meta.path);

const RUN_TIMEOUT = 120_000;

type Pkg = {
  name: "frontend" | "question-bank";
  /** The prettier arguments the scripts passed on `main` (criterion 12), after shell quoting. */
  checkArgs: string[];
  writeArgs: string[];
  /** Where an unformatted file in the checked set goes (criterion 9). */
  probe: string;
};

const PACKAGES: Pkg[] = [
  {
    name: "frontend",
    checkArgs: ["--check", "."],
    writeArgs: ["--write", "."],
    probe: "src/t109-probe.ts",
  },
  {
    name: "question-bank",
    checkArgs: ["--check", "src/**/*.ts"],
    writeArgs: ["--write", "src/**/*.ts"],
    probe: "src/t109-probe.ts",
  },
];

/** Unformatted under any of the two packages' identical `.prettierrc`. */
const UNFORMATTED = "export const   t109 = {a:1,\n  b :  'x'}\n";

const pinnedOf = (root: string): string =>
  (
    JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      devDependencies: Record<string, string>;
    }
  ).devDependencies["prettier"]!;

function trackedFiles(pkg: Pkg): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "-z", "--", pkg.name], { cwd: REPO_ROOT });
  if (proc.exitCode !== 0) throw new Error(`git ls-files failed: ${proc.stderr.toString()}`);
  return proc.stdout
    .toString()
    .split("\0")
    .filter((path) => path && path !== THIS_FILE && existsSync(join(REPO_ROOT, path)))
    .map((path) => relative(pkg.name, path));
}

/** States (a)-(c) from the brief's Definitions, plus the installed ones. */
type State =
  | "a-missing"
  | "b-wrong-below"
  | "b-wrong-above"
  | "b-wrong-global"
  | "c-no-bin"
  | "installed-real"
  | "installed-logger";

const NOT_INSTALLED: State[] = [
  "a-missing",
  "b-wrong-below",
  "b-wrong-above",
  "b-wrong-global",
  "c-no-bin",
];

type Copy = {
  base: string;
  root: string;
  pathLog: string;
  binLog: string;
  bin: string;
  touched: string;
};

const copies: string[] = [];
afterAll(() => {
  for (const dir of copies) rmSync(dir, { recursive: true, force: true });
});

/** Logs its arguments outside the copy, damages a tracked file inside it, exits 0. */
const sentinel = (log: string, touched: string) =>
  `#!/bin/sh\necho "ran $*" >> "${log}"\necho "// sentinel" >> "${touched}"\nexit 0\n`;

function bump(version: string, delta: number): string {
  const [major, minor, patch] = version.split(".").map(Number);
  return `${major}.${minor}.${patch! + delta}`;
}

function wrongVersion(state: State, pinned: string): string {
  if (state === "b-wrong-below") return bump(pinned, -1);
  if (state === "b-wrong-above") return bump(pinned, +1);
  return pinned === "3.8.1" ? "3.8.0" : "3.8.1";
}

/**
 * A throwaway copy of `pkg`'s tracked files, with `node_modules` in `state`.
 * `pin` overrides `devDependencies.prettier` in the copy's package.json
 * (criterion 7); `installedVersion` overrides the copied manifest's version.
 */
function makeCopy(
  pkg: Pkg,
  state: State,
  opts: { pin?: string; installedVersion?: string } = {},
): Copy {
  const base = mkdtempSync(join(tmpdir(), "t109-"));
  copies.push(base);
  const root = join(base, pkg.name);
  const realRoot = join(REPO_ROOT, pkg.name);
  for (const path of trackedFiles(pkg)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    cpSync(join(realRoot, path), join(root, path));
  }
  if (opts.pin !== undefined) {
    const file = join(root, "package.json");
    const json = JSON.parse(readFileSync(file, "utf8")) as {
      devDependencies: Record<string, string>;
    };
    json.devDependencies["prettier"] = opts.pin;
    writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  }
  // An unformatted file the writer would reformat (criterion 4), and that the
  // sentinel appends to if it ever runs.
  const touched = join(root, pkg.probe);
  writeFileSync(touched, UNFORMATTED);

  const pathLog = join(base, "path-sentinel.log");
  const binLog = join(base, "bin-sentinel.log");
  const bin = join(base, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "prettier"), sentinel(pathLog, touched));
  chmodSync(join(bin, "prettier"), 0o755);

  const pinned = pinnedOf(root);
  const modules = join(root, "node_modules");
  const realPrettier = join(realRoot, "node_modules/prettier");
  if (state === "a-missing") {
    // no node_modules/prettier at all
  } else if (state.startsWith("b-")) {
    const version = opts.installedVersion ?? wrongVersion(state, pinned);
    mkdirSync(join(modules, "prettier"), { recursive: true });
    mkdirSync(join(modules, ".bin"), { recursive: true });
    writeFileSync(
      join(modules, "prettier/package.json"),
      JSON.stringify({ name: "prettier", version, bin: "./bin/prettier.cjs" }),
    );
    writeFileSync(join(modules, ".bin/prettier"), sentinel(binLog, touched));
    chmodSync(join(modules, ".bin/prettier"), 0o755);
  } else if (state === "c-no-bin") {
    mkdirSync(join(modules, "prettier"), { recursive: true });
    writeFileSync(
      join(modules, "prettier/package.json"),
      JSON.stringify({ name: "prettier", version: pinned, bin: "./bin/prettier.cjs" }),
    );
  } else if (state === "installed-real") {
    mkdirSync(join(modules, ".bin"), { recursive: true });
    cpSync(realPrettier, join(modules, "prettier"), { recursive: true });
    symlinkSync("../prettier/bin/prettier.cjs", join(modules, ".bin/prettier"));
  } else if (state === "installed-logger") {
    // Installed by the Definitions (version equal to the pin, .bin present),
    // with a .bin that only records its arguments.
    const version = opts.installedVersion ?? pinned;
    mkdirSync(join(modules, "prettier"), { recursive: true });
    mkdirSync(join(modules, ".bin"), { recursive: true });
    writeFileSync(
      join(modules, "prettier/package.json"),
      JSON.stringify({ name: "prettier", version, bin: "./bin/prettier.cjs" }),
    );
    writeFileSync(join(modules, ".bin/prettier"), sentinel(binLog, touched));
    chmodSync(join(modules, ".bin/prettier"), 0o755);
  }
  return { base, root, pathLog, binLog, bin, touched };
}

const lines = (log: string) =>
  existsSync(log) ? readFileSync(log, "utf8").split("\n").filter(Boolean) : [];

/** sha256 of every file under `dir` except node_modules, by relative path. */
function snapshot(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile())
        out.set(relative(dir, full), createHash("sha256").update(readFileSync(full)).digest("hex"));
    }
  };
  walk(dir);
  return out;
}

function deadEnv(firstOnPath: string | undefined): Record<string, string> {
  const bunDir = dirname(process.execPath);
  const path = [firstOnPath, bunDir, "/usr/local/bin", "/usr/bin", "/bin"]
    .filter(Boolean)
    .join(":");
  return {
    PATH: path,
    HOME: process.env["HOME"] ?? "/tmp",
    ...DEAD_PROXY,
    NO_COLOR: "1",
  };
}

type Run = { exitCode: number; output: string };

function bunRun(cwd: string, script: string, extra: string[], firstOnPath?: string): Run {
  const proc = Bun.spawnSync([process.execPath, "run", script, ...extra], {
    cwd,
    env: deadEnv(firstOnPath),
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCode: proc.exitCode ?? -1,
    output: proc.stdout.toString() + proc.stderr.toString(),
  };
}

const SCRIPTS = ["format", "format:check"] as const;

/** Snapshot of the real node_modules/prettier and .bin/prettier, for criterion 15. */
function realModulesDigest(pkg: Pkg): string {
  const real = join(REPO_ROOT, pkg.name, "node_modules");
  const h = createHash("sha256");
  for (const [path, sha] of [...snapshotAll(join(real, "prettier"))].sort()) h.update(path + sha);
  const bin = join(real, ".bin/prettier");
  h.update(existsSync(bin) ? "bin:present" : "bin:absent");
  h.update(readdirSync(real).sort().join(","));
  return h.digest("hex");
}

function snapshotAll(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!existsSync(dir)) return out;
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile())
        out.set(relative(dir, full), createHash("sha256").update(readFileSync(full)).digest("hex"));
    }
  };
  walk(dir);
  return out;
}

for (const pkg of PACKAGES) {
  const realRoot = join(REPO_ROOT, pkg.name);
  const realBefore = realModulesDigest(pkg);

  describe(`T-109 ${pkg.name}: criteria 1-6 — the pinned prettier is not installed`, () => {
    for (const state of NOT_INSTALLED) {
      for (const script of SCRIPTS) {
        describe(`state ${state}, bun run ${script}`, () => {
          let run: Run;
          let copy: Copy;
          let before: Map<string, string>;
          let after: Map<string, string>;
          let pinned: string;
          const setup = () => {
            if (run) return;
            copy = makeCopy(pkg, state);
            pinned = pinnedOf(copy.root);
            before = snapshot(copy.root);
            run = bunRun(copy.root, script, [], copy.bin);
            after = snapshot(copy.root);
          };

          test(
            `criterion ${script === "format" ? 1 : 2}: exits non-zero`,
            () => {
              setup();
              expect(run.exitCode).not.toBe(0);
            },
            RUN_TIMEOUT,
          );

          test("criterion 3: no sentinel runs, neither first on PATH nor in .bin", () => {
            setup();
            expect(lines(copy.pathLog)).toEqual([]);
            expect(lines(copy.binLog)).toEqual([]);
          });

          if (script === "format") {
            test("criterion 4: no file under the package changes, with an unformatted file present", () => {
              setup();
              expect(readFileSync(copy.touched, "utf8")).toBe(UNFORMATTED);
              expect(after).toEqual(before);
            });
          }

          test("criterion 5: the output contains the pinned version", () => {
            setup();
            expect(run.output).toContain(pinned);
          });

          if (state.startsWith("b-")) {
            test("criterion 6: the output also contains the version found", () => {
              setup();
              expect(run.output).toContain(wrongVersion(state, pinned));
            });
          }
        });
      }
    }
  });

  describe(`T-109 ${pkg.name}: criterion 7 — the pinned version is read, not hard-coded`, () => {
    const X = "3.7.4";

    for (const script of SCRIPTS) {
      test(
        `bun run ${script}: pin changed to ${X}, prettier 3.9.6 installed, is state (b) naming ${X}`,
        () => {
          const copy = makeCopy(pkg, "b-wrong-global", { pin: X, installedVersion: "3.9.6" });
          const run = bunRun(copy.root, script, [], copy.bin);
          expect(run.exitCode).not.toBe(0);
          expect(run.output).toContain(X);
          expect(run.output).toContain("3.9.6");
          expect(lines(copy.pathLog)).toEqual([]);
          expect(lines(copy.binLog)).toEqual([]);
        },
        RUN_TIMEOUT,
      );

      test(
        `bun run ${script}: pin changed to ${X}, prettier ${X} installed with .bin, passes the guard`,
        () => {
          const copy = makeCopy(pkg, "installed-logger", { pin: X, installedVersion: X });
          const run = bunRun(copy.root, script, [], copy.bin);
          expect(run.exitCode).toBe(0);
          expect(lines(copy.binLog).length).toBe(1);
          expect(lines(copy.pathLog)).toEqual([]);
        },
        RUN_TIMEOUT,
      );
    }
  });

  describe(`T-109 ${pkg.name}: criteria 8-12 — the pinned prettier is installed`, () => {
    test(
      "criterion 8: bun run format:check exits 0 on the clean tree",
      () => {
        const run = bunRun(realRoot, "format:check", []);
        expect(run.output).not.toContain("refusing");
        expect(run.exitCode).toBe(0);
      },
      RUN_TIMEOUT,
    );

    test(
      "criterion 9: one unformatted file in the checked set makes format:check exit non-zero, naming it",
      () => {
        const copy = makeCopy(pkg, "installed-real");
        const run = bunRun(copy.root, "format:check", [], copy.bin);
        expect(run.exitCode).not.toBe(0);
        expect(run.output).toContain(pkg.probe);
        expect(lines(copy.pathLog)).toEqual([]);
      },
      RUN_TIMEOUT,
    );

    test(
      "criterion 10: bun run format rewrites it, and a following format:check exits 0",
      () => {
        const copy = makeCopy(pkg, "installed-real");
        const write = bunRun(copy.root, "format", [], copy.bin);
        expect(write.exitCode).toBe(0);
        expect(readFileSync(copy.touched, "utf8")).not.toBe(UNFORMATTED);
        const check = bunRun(copy.root, "format:check", [], copy.bin);
        expect(check.exitCode).toBe(0);
        expect(lines(copy.pathLog)).toEqual([]);
      },
      RUN_TIMEOUT,
    );

    if (pkg.name === "question-bank") {
      test(
        "criterion 11: format:check --use-tabs --no-semi on the clean tree names every .ts under src/",
        () => {
          const run = bunRun(realRoot, "format:check", ["--use-tabs", "--no-semi"]);
          expect(run.exitCode).not.toBe(0);
          const ts: string[] = [];
          const walk = (d: string) => {
            for (const e of readdirSync(d, { withFileTypes: true })) {
              const full = join(d, e.name);
              if (e.isDirectory()) walk(full);
              else if (e.name.endsWith(".ts")) ts.push(relative(realRoot, full));
            }
          };
          walk(join(realRoot, "src"));
          expect(ts.length).toBeGreaterThan(0);
          expect(ts.filter((rel) => !run.output.includes(rel))).toEqual([]);
        },
        RUN_TIMEOUT,
      );
    }

    test(
      "criterion 11: extra arguments reach prettier after its own",
      () => {
        const copy = makeCopy(pkg, "installed-logger");
        const run = bunRun(copy.root, "format:check", ["--use-tabs", "--no-semi"], copy.bin);
        expect(run.exitCode).toBe(0);
        expect(lines(copy.binLog)).toEqual([
          `ran ${[...pkg.checkArgs, "--use-tabs", "--no-semi"].join(" ")}`,
        ]);
      },
      RUN_TIMEOUT,
    );

    for (const script of SCRIPTS) {
      test(
        `criterion 12: bun run ${script} hands prettier exactly main's file set`,
        () => {
          const copy = makeCopy(pkg, "installed-logger");
          const run = bunRun(copy.root, script, [], copy.bin);
          expect(run.exitCode).toBe(0);
          const args = script === "format" ? pkg.writeArgs : pkg.checkArgs;
          expect(lines(copy.binLog)).toEqual([`ran ${args.join(" ")}`]);
          expect(lines(copy.pathLog)).toEqual([]);
        },
        RUN_TIMEOUT,
      );
    }
  });

  describe(`T-109 ${pkg.name}: criterion 15 — no test touches the real node_modules`, () => {
    test("the real node_modules/prettier, .bin/prettier and top-level entries are unchanged", () => {
      expect(realModulesDigest(pkg)).toBe(realBefore);
    });

    test("every copy was made outside the real package", () => {
      for (const dir of copies) {
        expect(relative(realRoot, dir).startsWith("..")).toBe(true);
      }
    });
  });
}

describe("T-109 criterion 16 — every spawned child runs under the dead proxy", () => {
  test("deadEnv sets all six proxy variables to offline-rebuild's DEAD_PROXY loopback", () => {
    const env = deadEnv(undefined);
    for (const key of [
      "HTTP_PROXY",
      "HTTPS_PROXY",
      "ALL_PROXY",
      "http_proxy",
      "https_proxy",
      "all_proxy",
    ]) {
      expect(env[key]).toBe(DEAD_PROXY[key as keyof typeof DEAD_PROXY]);
      expect(env[key]).toMatch(/^http:\/\/127\.0\.0\.1:1$/);
    }
  });
});
