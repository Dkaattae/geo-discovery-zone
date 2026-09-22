import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-073, written by the `tester` session from the brief's acceptance criteria
 * (`process.md` step 4) — from criteria 3, 4, 5, 6 and 8, never from the
 * implementation. Criteria 1 and 2 are whole-suite outcomes and are recorded in
 * the brief's Verdict from two runs rather than asserted here; criteria 9 and
 * 10 are diff-shaped ("`ci.yml` is unchanged", "the lockfile is unchanged") and
 * are deliberately **not** tested, because the only way to assert them is the
 * git range criterion 6 forbids this task from introducing. They are recorded
 * in the Verdict as observations instead.
 *
 * What is asserted here is the property the task exists to create and keep: no
 * test in this repo decides anything by resolving a git revision. The scan
 * reads the working tree with `git ls-files` — allowed by the brief's own
 * definition, and the shape criterion 4 names as correct because it throws on a
 * non-zero exit instead of returning.
 *
 * Local files only. No network (`test-guidelines.md`, "No network in tests,
 * ever").
 */

const REPO_ROOT = join(import.meta.dirname, "../..");

/**
 * The file criterion 5 protects, assembled from two halves so the `<rev>:<path>`
 * scan below — which reads this file like any other — cannot match its own
 * source.
 */
const DECISIONS = "engineering-decisions" + ".md";

/** Subcommands that read the working tree only. The brief: "Reading only the
 * working tree (`git ls-files`, `git status`) is not [resolving a revision] and
 * stays allowed." */
const WORKING_TREE_SUBCOMMANDS = ["ls-files", "status", "check-ignore"];

function trackedFiles(paths: string[]): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "-z", "--", ...paths], { cwd: REPO_ROOT });
  if (proc.exitCode !== 0) {
    throw new Error(`git ls-files failed: ${proc.stderr.toString()}`);
  }
  return proc.stdout.toString().split("\0").filter(Boolean);
}

const isTestFile = (path: string) =>
  /\.test\.tsx?$/.test(path) || /(^|\/)tests?\//.test(path) || /(^|\/)test_[^/]+\.py$/.test(path);

const REPO_TEST_FILES = trackedFiles(["."]).filter(isTestFile);
const FRONTEND_TEST_FILES = REPO_TEST_FILES.filter((path) => path.startsWith("frontend/src/"));

const readRaw = (path: string) => readFileSync(join(REPO_ROOT, path), "utf8");

/**
 * The file's source with every comment blanked out — each comment character
 * replaced by a space, newlines kept, so offsets and line numbers still line up
 * with the file on disk. Every scan below reads this rather than the raw text.
 *
 * Prose is documentation, not an invocation. A comment recording which revision
 * a deleted test used to resolve — `level-window-claim.criteria.test.ts:166-176`
 * is exactly that — must not be flagged as the defect it records, or the honest
 * way to remove one of these looks identical to leaving it in.
 *
 * This is also how this file stopped failing against itself: on its first round
 * a sample argument list written in one of its own doc comments matched the
 * criterion-4 scan the moment the file became tracked and entered `git ls-files`
 * output. Blanking comments fixes the class; excluding this file from its own
 * scan would only have hidden it.
 *
 * Conservative by construction: anything it cannot classify stays in the scanned
 * text, so the failure mode is scanning too much, never too little.
 */
function codeOf(source: string): string {
  let out = "";
  let index = 0;
  let quote: string | null = null;
  while (index < source.length) {
    const char = source[index]!;
    const next = source[index + 1];
    if (quote !== null) {
      out += char;
      if (char === "\\") {
        out += next ?? "";
        index += 2;
        continue;
      }
      if (char === quote) quote = null;
      index += 1;
      continue;
    }
    if (char === "\\") {
      // An escape outside a string: a regex literal's `\/`, which must not be
      // read as half of a `//`.
      out += char + (next ?? "");
      index += 2;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      out += char;
      index += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") {
        out += " ";
        index += 1;
      }
      continue;
    }
    if (char === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      const stop = end === -1 ? source.length : end + 2;
      for (; index < stop; index += 1) out += source[index] === "\n" ? "\n" : " ";
      continue;
    }
    out += char;
    index += 1;
  }
  return out;
}

const read = (path: string) => codeOf(readRaw(path));

/** One `git` argument list found in source. `args` is everything after the
 * leading `git` element. */
type GitCall = { file: string; args: string[] };

/**
 * Every argument list literal whose first element is `git`, read from code
 * only.
 */
function gitCalls(files: string[]): GitCall[] {
  const calls: GitCall[] = [];
  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(/\[\s*["'`]git["'`]([^\]]*)\]/g)) {
      const args = (match[1] ?? "")
        .split(",")
        .map((part) => part.trim().replace(/^["'`]|["'`]$/g, ""))
        .filter(Boolean)
        // `...paths` is a spread of a variable, not an argument this scan can
        // read; the subcommand check below is what decides those calls.
        .filter((part) => !part.startsWith("..."));
      calls.push({ file, args });
    }
  }
  return calls;
}

/** A commit, ref, range or merge base — the things the brief says a test may
 * not hand to `git`. */
const looksLikeRevision = (arg: string) =>
  /^HEAD\b/.test(arg) ||
  arg.includes("origin/") ||
  /\w\.\.\w/.test(arg) ||
  /\b[0-9a-f]{7,40}\b/.test(arg) ||
  /^[^\s]*:[^\s]*\$\{/.test(arg);

describe("T-073 criterion 3 — no test under frontend/src resolves a git revision", () => {
  test("the scan reaches the frontend test files, so an empty result cannot pass by accident", () => {
    expect(FRONTEND_TEST_FILES.length).toBeGreaterThanOrEqual(9);
    expect(FRONTEND_TEST_FILES).toContain("frontend/src/level-window-claim.criteria.test.ts");
    expect(FRONTEND_TEST_FILES).toContain("frontend/src/ci-action-pinning.test.ts");
    // If nothing under frontend/src called `git` at all, every rule below would
    // be vacuously true. `trackedFiles` is the one call that must survive.
    expect(gitCalls(FRONTEND_TEST_FILES).length).toBeGreaterThan(0);
  });

  test("every git call under frontend/src uses a working-tree-only subcommand", () => {
    const offenders = gitCalls(FRONTEND_TEST_FILES)
      .filter((call) => !WORKING_TREE_SUBCOMMANDS.includes(call.args[0] ?? ""))
      .map((call) => `${call.file}: git ${call.args.join(" ")}`);
    expect(offenders).toEqual([]);
  });

  test("no git call under frontend/src is handed a commit, ref, range or merge base", () => {
    const offenders = gitCalls(FRONTEND_TEST_FILES)
      .filter((call) => call.args.some(looksLikeRevision))
      .map((call) => `${call.file}: git ${call.args.join(" ")}`);
    expect(offenders).toEqual([]);
  });

  test("no literal commit sha is passed to git anywhere under frontend/src", () => {
    const offenders = gitCalls(FRONTEND_TEST_FILES)
      .filter((call) => call.args.some((arg) => /\b[0-9a-f]{40}\b/.test(arg)))
      .map((call) => call.file);
    expect(offenders).toEqual([]);
  });
});

describe("T-073 criterion 4 — no test in frontend/src can pass because git failed", () => {
  const callers = FRONTEND_TEST_FILES.filter((file) => gitCalls([file]).length > 0);

  test("the files holding a git call are found, so the rule below is not vacuous", () => {
    expect(callers.length).toBeGreaterThan(0);
  });

  test("no exit-code branch escapes through a bare return", () => {
    const offenders = callers.filter((file) =>
      /exitCode\s*!==?\s*0[^{;]*\)\s*\{?\s*return/.test(read(file)),
    );
    expect(offenders).toEqual([]);
  });

  // A proximity heuristic: the throw has to sit within 400 characters of the
  // call. It will flag a correct call whose error handling lives in a helper or
  // further away, which is a false-positive mode worth knowing about — the
  // defect it guards has recurred four times, so the trip-wire earns its keep,
  // but a future call that trips it wants the rule reconsidered rather than the
  // call contorted.
  test("every git call is followed by a throw on a non-zero exit", () => {
    const missing: string[] = [];
    for (const file of callers) {
      const source = read(file);
      for (const match of source.matchAll(/\[\s*["'`]git["'`][^\]]*\]/g)) {
        const after = source.slice(match.index ?? 0, (match.index ?? 0) + 400);
        if (!/exitCode\s*!==?\s*0/.test(after) || !/throw/.test(after)) {
          missing.push(`${file}: ${match[0]}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("T-073 criterion 5 — nothing in the repo compares engineering-decisions.md against a git revision", () => {
  test("the repo-wide scan reaches every package's tests", () => {
    expect(REPO_TEST_FILES.length).toBeGreaterThan(20);
    expect(REPO_TEST_FILES).toContain("question-bank/src/region-vocabulary.test.ts");
    expect(REPO_TEST_FILES).toContain("frontend/src/level-window-claim.criteria.test.ts");
  });

  test("no test file names the file at a revision in <rev>:<path> form", () => {
    const revPath = new RegExp("[\\w./${}-]+:" + DECISIONS.replace(".", "\\."));
    const offenders = REPO_TEST_FILES.filter((file) => revPath.test(read(file)));
    expect(offenders).toEqual([]);
  });

  test("no git call anywhere in the repo takes the file as an argument", () => {
    const offenders = gitCalls(REPO_TEST_FILES)
      .filter((call) => call.args.some((arg) => arg.includes(DECISIONS)))
      .map((call) => `${call.file}: git ${call.args.join(" ")}`);
    expect(offenders).toEqual([]);
  });
});

describe("T-073 criterion 8(b) — the deleted claim is recorded in engineering-decisions.md", () => {
  // Raw, not `read`: `engineering-decisions.md` is prose, and `codeOf` above is
  // a source-code stripper. Every assertion here is about what the entry says.
  const decisions = readRaw(DECISIONS);
  const headings = [...decisions.matchAll(/^## E-(\d+) — .+$/gm)];
  const numbers = headings.map((match) => Number(match[1]));

  /** Deliberately not "E-12 is the highest": `tasks.md` says not to reintroduce
   * a ceiling, so a later E-13 must not turn this red. */
  const newEntries = headings.filter((match) => Number(match[1]) > 11);

  function entryBody(index: number): string {
    const rest = decisions.slice(index + 1);
    const next = rest.indexOf("\n## E-");
    return next === -1 ? rest : rest.slice(0, next);
  }

  test("an entry numbered above E-11 exists and is appended after it", () => {
    expect(numbers).toContain(11);
    expect(newEntries.length).toBeGreaterThan(0);
    const elevenIndex = decisions.indexOf("## E-11 — ");
    expect(elevenIndex).toBeGreaterThan(-1);
    for (const entry of newEntries) {
      expect(entry.index ?? -1).toBeGreaterThan(elevenIndex);
    }
    // Still unique and ascending, per the constraint that no existing entry is
    // renumbered or reordered.
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  });

  const recording = newEntries.find((entry) =>
    entryBody(entry.index ?? 0).includes("level-window-claim.criteria.test.ts"),
  );

  test("the new entry names the file the test was removed from", () => {
    expect(recording).toBeDefined();
    expect(entryBody(recording?.index ?? 0)).toContain(
      "frontend/src/level-window-claim.criteria.test.ts",
    );
  });

  test("the new entry names the test that was removed", () => {
    expect(entryBody(recording?.index ?? 0)).toContain("no existing E-n entry was modified");
  });

  test("the new entry says why deletion beat re-pinning the baseline", () => {
    const body = entryBody(recording?.index ?? 0);
    expect(body).toMatch(/re-pin|repin/i);
    expect(body).toMatch(/delete/i);
  });

  test("the new entry carries a Revisit when paragraph, in E-11's shape", () => {
    expect(entryBody(recording?.index ?? 0)).toMatch(/\*\*Revisit when\*\*/);
    // The precedent it is shaped after has one too.
    const eleven = decisions.indexOf("## E-11 — ");
    expect(entryBody(eleven)).toMatch(/\*\*Revisit when\*\*/);
  });
});
