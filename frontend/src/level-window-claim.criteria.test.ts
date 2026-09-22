import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-057 criteria 1 and 8, written out as assertions by the verifying session
 * (`process.md` step 4). Both are repo-level claims rather than anything under
 * `frontend/src`, so this file follows the precedent already set by
 * `ci-action-pinning.test.ts`, `conventions-doc.test.ts` and
 * `readme-test-count.criteria.test.ts`: assert on repo files from `frontend`'s
 * `bun test`, which needs no new runner and no new dependency.
 *
 * Every expected value comes from the wording of a criterion in
 * `tasks/T-057-level-window-docstring.md`. Local files only — no network
 * (`test-guidelines.md`, "No network in tests, ever").
 */

const REPO_ROOT = join(import.meta.dirname, "../..");

/**
 * The false function name criterion 1 bans, assembled from two halves so that
 * this file — which lives under `frontend/` and is therefore itself in the
 * criterion's scope — does not contain the literal it is scanning for.
 */
const BANNED_NAME = "level" + "Window";

/** The paths criterion 1 names. `PROGRESS.md`, `tasks.md`, `tasks/` and `runs/` are exempt. */
const SCANNED_PATHS = [
  "backend",
  "frontend",
  "e2e",
  "question-bank",
  "fixtures",
  "openapi.yaml",
  "conventions.md",
  "test-guidelines.md",
];

function trackedFiles(paths: string[]): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "-z", "--", ...paths], { cwd: REPO_ROOT });
  if (proc.exitCode !== 0) {
    throw new Error(`git ls-files failed: ${proc.stderr.toString()}`);
  }
  return proc.stdout.toString().split("\0").filter(Boolean);
}

describe("T-057 criterion 1 — the false client function name is gone everywhere it could mislead", () => {
  const files = trackedFiles(SCANNED_PATHS);

  test("the scan actually covers the tree, so an empty result cannot pass by accident", () => {
    // Guards the assertion below against the failure mode where `git ls-files`
    // returns nothing and "no file contains the name" is vacuously true.
    expect(files.length).toBeGreaterThan(100);
    expect(files).toContain("backend/app/levels.py");
    expect(files).toContain("openapi.yaml");
  });

  test("no tracked file in the named paths mentions it", () => {
    const offenders = files.filter((path) => {
      let source: string;
      try {
        source = readFileSync(join(REPO_ROOT, path), "utf8");
      } catch {
        return false; // unreadable or binary; nothing to claim about it
      }
      return source.includes(BANNED_NAME);
    });
    expect(offenders).toEqual([]);
  });
});

describe("T-057 criterion 3 — no window arithmetic lives under frontend/src", () => {
  /**
   * Criterion 3's first sentence is a negative about the whole of
   * `frontend/src`, which nothing rendered can prove — a component test can
   * only show that one screen behaves, not that no other module misbehaves.
   * So this half is asserted against the source, and the behavioural half (what
   * `Setup` actually renders) is `components/screens.criteria.test.tsx`.
   */
  const sources = trackedFiles(["frontend/src"]).filter(
    (path) => /\.(ts|tsx)$/.test(path) && !path.includes(".test."),
  );

  test("the scan covers the client source, so an empty result cannot pass by accident", () => {
    expect(sources.length).toBeGreaterThan(10);
    expect(sources).toContain("frontend/src/components/screens.tsx");
    expect(sources).toContain("frontend/src/lib/level.ts");
  });

  test("screens.tsx is the only non-test module that reads suggestedLevels", () => {
    const readers = sources.filter((path) =>
      /\bsuggestedLevels\b/.test(readFileSync(join(REPO_ROOT, path), "utf8")),
    );
    // `lib/api/types.ts` only declares the contract's field; it derives nothing.
    expect(readers.sort()).toEqual([
      "frontend/src/components/screens.tsx",
      "frontend/src/lib/api/types.ts",
    ]);
  });

  test("Setup's options are suggestedLevels, or exactly the one-element fallback", () => {
    const screens = readFileSync(join(REPO_ROOT, "frontend/src/components/screens.tsx"), "utf8");
    const normalised = screens.replace(/\s+/g, " ");
    expect(normalised).toContain(
      "const options = progress?.suggestedLevels?.length " +
        "? progress.suggestedLevels " +
        ": [profile.lastSessionEndLevel];",
    );
  });

  test("level.ts exports formatting only — nothing that returns a list of levels", () => {
    const level = readFileSync(join(REPO_ROOT, "frontend/src/lib/level.ts"), "utf8");
    const exported = [...level.matchAll(/export\s+(?:function|const)\s+(\w+)/g)].map((m) => m[1]);
    expect(exported.sort()).toEqual(["bandLabel", "bandOf", "gradeLabel", "gradeOf", "levelLabel"]);
    // A window is an array of levels; a formatter never builds one.
    expect(level).not.toContain("[]");
    expect(level).not.toMatch(/Array|\.map\(|\bpush\(/);
  });
});

describe("T-057 criterion 8 — engineering-decisions.md records the level-window decision as E-10", () => {
  const decisions = readFileSync(join(REPO_ROOT, "engineering-decisions.md"), "utf8");
  const headings = [...decisions.matchAll(/^## (E-(\d+)) — (.+)$/gm)];
  const numbers = headings.map((match) => Number(match[2]));

  function entryBody(id: string): string {
    const start = decisions.indexOf(`## ${id} — `);
    expect(start).toBeGreaterThan(-1);
    const rest = decisions.slice(start + 1);
    const next = rest.indexOf("\n## E-");
    return next === -1 ? rest : rest.slice(0, next);
  }

  test("an E-10 entry exists, the numbers are unique and ascending, and nothing after it is ≤ 10", () => {
    // Deliberately NOT `numbers.at(-1) === 10`. That is the ceiling T-017
    // criterion 7 pinned at 9 and this task's criteria 10 and 11 exist to
    // remove — `CLAUDE.md` says `engineering-decisions.md` is "not gated; a
    // task may add an entry when its criteria say so", so a later task's E-11
    // must not turn this suite red. Criterion 8 asks only that the file gains
    // E-10 and that no existing entry is modified; existence, uniqueness,
    // ascending order and "E-10 is followed only by higher numbers" say all of
    // that without re-arming the landmine.
    expect(numbers).toContain(10);
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    const tenIndex = numbers.indexOf(10);
    for (const laterNumber of numbers.slice(tenIndex + 1)) {
      expect(laterNumber).toBeGreaterThan(10);
    }
  });

  test("E-10 names the field the window is served as", () => {
    expect(entryBody("E-10")).toContain("suggestedLevels");
  });

  test("E-10 names the client module it decides to keep", () => {
    expect(entryBody("E-10")).toContain("frontend/src/lib/level.ts");
  });

  test("E-10 names a call site that needs client-side label formatting", () => {
    const body = entryBody("E-10");
    const sites = ["screens.tsx:361", "screens.tsx:423", "screens.tsx:195"];
    expect(sites.filter((site) => body.includes(site)).length).toBeGreaterThan(0);
  });

  // "no existing E-n entry was modified" was checked here by diffing this file
  // against `origin/main`'s merge base — a git baseline that expired the moment
  // E-10 merged (the comparison target became the file it was supposed to be
  // compared against) and silently asserted nothing in a shallow clone, since
  // both `git` calls escaped through a bare `return` on non-zero exit. It was
  // the fourth instance of the defect E-11 deleted two of; removed the same way
  // rather than re-pinned to a newer commit, which would only reproduce it a
  // fifth time. See `engineering-decisions.md` E-12. The append-only property
  // this test partially stood in for — no two E-n numbers collide, and nothing
  // after E-10 is numbered ≤ 10 — is still asserted above, git-free, and stays
  // green at any clone depth.
});
