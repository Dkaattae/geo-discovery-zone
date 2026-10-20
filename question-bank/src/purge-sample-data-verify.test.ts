/**
 * T-064 tester. Written from the brief's acceptance criteria
 * (`tasks/T-064-purge-sample-data.md`), not from the implementation.
 *
 * Covers the criteria that stay true of the tree after the task lands:
 * 1 (nothing tracked or present under the sample directory), 2 and 3 (no
 * script named for it or pointing at it), 5 and 6 (live docs and non-test
 * source stop naming it), 7 (the README still points at one concrete entity
 * file), and 13 (no test reads it).
 *
 * Criteria 4 and 8-11 compare the branch with base `97780b5`. CI clones
 * shallow, so base is not reachable from a test there. Those criteria were
 * checked once with `git diff 97780b5` and the result is recorded in the
 * brief's Verdict, not pinned here.
 *
 * The directory's name is assembled from parts so that this file is not
 * itself a hit for criterion 13's scan. No network, no writes.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const SAMPLE_DIR_NAME = ["sample", "data"].join("-");
const SAMPLE_SCRIPT = ["build", "sample"].join(":");
const THIS_FILE = "question-bank/src/purge-sample-data-verify.test.ts";

function git(args: string[]): string {
  const proc = Bun.spawnSync(["git", ...args], { cwd: REPO });
  if (proc.exitCode !== 0) throw new Error(`git ${args.join(" ")} exited ${proc.exitCode}`);
  return proc.stdout.toString();
}

const tracked = (): string[] => git(["ls-files"]).split("\n").filter(Boolean);
const read = (path: string) => readFileSync(join(REPO, path), "utf8");

describe("T-064 tester, criterion 1 — nothing under the sample directory is tracked or present", () => {
  test("git ls-files question-bank/<sample dir> prints nothing", () => {
    expect(git(["ls-files", `question-bank/${SAMPLE_DIR_NAME}`])).toBe("");
  });

  test("the directory does not exist in the checkout", () => {
    expect(existsSync(join(PKG, SAMPLE_DIR_NAME))).toBe(false);
  });

  test("the scan is not vacuous: git ls-files does list the bank directory beside it", () => {
    expect(git(["ls-files", "question-bank/data/us-states"])).toContain("us-state-co.json");
  });
});

describe("T-064 tester, criteria 2 and 3 — no package script builds the sample", () => {
  const scripts = () =>
    (JSON.parse(read("question-bank/package.json")) as { scripts: Record<string, string> }).scripts;

  test("criterion 2: question-bank/package.json has no scripts key named build:sample", () => {
    expect(Object.keys(scripts())).not.toContain(SAMPLE_SCRIPT);
    // Not vacuous: the scripts object is the real one.
    expect(Object.keys(scripts())).toContain("build");
  });

  test("criterion 3: no script value contains the sample directory's name", () => {
    const hits = Object.entries(scripts()).filter(([, v]) => v.includes(SAMPLE_DIR_NAME));
    expect(hits).toEqual([]);
  });
});

describe("T-064 tester, criterion 5 — live docs and non-test source stop naming it", () => {
  const nonTestSources = () =>
    tracked().filter(
      (p) => p.startsWith("question-bank/src/") && p.endsWith(".ts") && !p.endsWith(".test.ts"),
    );

  test("the non-test source list is the real one (includes build.ts and a nested module)", () => {
    const files = nonTestSources();
    expect(files).toContain("question-bank/src/build.ts");
    expect(files.some((p) => p.split("/").length > 3)).toBe(true);
  });

  test("README.md, conventions.md, test-guidelines.md, question-bank/README.md and every non-test src .ts name neither the directory nor the script", () => {
    const paths = [
      "README.md",
      "conventions.md",
      "test-guidelines.md",
      "question-bank/README.md",
      ...nonTestSources(),
    ];
    const hits = paths.flatMap((path) => {
      const text = read(path);
      return [SAMPLE_DIR_NAME, SAMPLE_SCRIPT]
        .filter((needle) => text.includes(needle))
        .map((needle) => ({ path, needle }));
    });
    expect(hits).toEqual([]);
  });
});

describe("T-064 tester, criterion 6 — PROGRESS.md's live part stops naming it", () => {
  test("the text above ## Completed tasks names neither the directory nor the script", () => {
    const text = read("PROGRESS.md");
    const cut = text.search(/^## Completed tasks\b/m);
    expect(cut).toBeGreaterThan(0);
    const live = text.slice(0, cut);
    expect({ dir: live.includes(SAMPLE_DIR_NAME), script: live.includes(SAMPLE_SCRIPT) }).toEqual({
      dir: false,
      script: false,
    });
  });
});

describe("T-064 tester, criterion 7 — question-bank/README.md still points at one entity record", () => {
  test("it names a specific data/us-states/us-state-<xx>.json file, and that file is tracked", () => {
    const named = [
      ...read("question-bank/README.md").matchAll(/data\/us-states\/(us-state-[a-z]{2}\.json)/g),
    ].map((m) => m[1] as string);
    expect(named.length).toBeGreaterThan(0);
    const files = tracked();
    for (const name of named) {
      expect({ name, tracked: files.includes(`question-bank/data/us-states/${name}`) }).toEqual({
        name,
        tracked: true,
      });
    }
  });
});

describe("T-064 tester, criterion 13 — no test reads, hashes, lists or stats the sample directory", () => {
  /**
   * A test file that names the directory at all is treated as touching it.
   * That is stricter than the criterion, which exempts literals never
   * resolved against the filesystem. The criterion names the only such
   * literals (the source snippets in `git-exit-guard.criteria.test.ts`), so
   * that file is the one exemption. This file avoids the literal.
   */
  const EXEMPT = new Set(["question-bank/src/git-exit-guard.criteria.test.ts", THIS_FILE]);

  test("no tracked test file except the named exemption mentions it", () => {
    const tests = tracked().filter((p) => /\.(test|spec)\.tsx?$/.test(p));
    expect(tests.length).toBeGreaterThan(50);
    const hits = tests.filter((p) => !EXEMPT.has(p) && read(p).includes(SAMPLE_DIR_NAME));
    expect(hits).toEqual([]);
  });
});
