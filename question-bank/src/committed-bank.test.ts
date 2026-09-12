import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";
import { BUILDER_VERSION } from "./normalize";

/**
 * T-010 verification (tester). Written from the brief's acceptance criteria,
 * not from the implementation: every expected value below comes from the
 * criterion's own wording — 51 paths, `count: 50`, ranks 1–50, `type: "state"`,
 * a 200 KB cap, `reviewed: true` only.
 *
 * Nothing here reaches the network (the rebuild in criterion 6 runs `--offline`
 * with every proxy pointed at a dead loopback port), nothing mocks `fetch`, and
 * nothing writes inside `question-bank/data/` — the rebuild goes to a temp dir
 * and is compared byte for byte against the tracked files.
 */
const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");

/** No network, ever — the same loopback trick CI uses (test-guidelines.md). */
const DEAD_PROXY = {
  HTTP_PROXY: "http://127.0.0.1:1",
  HTTPS_PROXY: "http://127.0.0.1:1",
  ALL_PROXY: "http://127.0.0.1:1",
  http_proxy: "http://127.0.0.1:1",
  https_proxy: "http://127.0.0.1:1",
  all_proxy: "http://127.0.0.1:1",
};

function git(args: string[]): { status: number; stdout: string } {
  const proc = Bun.spawnSync(["git", ...args], { cwd: REPO });
  return { status: proc.exitCode, stdout: proc.stdout.toString() };
}

/**
 * Throws rather than returning `[]` when git is unavailable or the path is
 * untracked: several tests below loop over this list, and an empty list would
 * make them pass without asserting anything.
 */
function trackedUnder(path: string): string[] {
  const { status, stdout } = git(["ls-files", path]);
  if (status !== 0) throw new Error(`git ls-files ${path} exited ${status}`);
  const paths = stdout.split("\n").filter(Boolean);
  if (paths.length === 0) throw new Error(`nothing tracked under ${path}`);
  return paths;
}

const POSTALS = CURATED_US_STATES.map((s) => s.postal.toLowerCase());

interface TrackedEntity {
  id: string;
  type: string;
  scope: string;
  name: string | null;
  capital: string | null;
  geometry_id: string | null;
  centroid: [number, number] | null;
  population: number | null;
  population_rank: number | null;
  area_km2: number | null;
  area_rank: number | null;
  fun_facts: { reviewed?: boolean }[];
  sources?: { built_at?: string; builder_version?: string };
}

function readTracked(name: string): TrackedEntity {
  return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8")) as TrackedEntity;
}

const entityFiles = () =>
  trackedUnder("question-bank/data/us-states")
    .map((p) => p.split("/").pop() as string)
    .filter((n) => n !== "index.json");

describe("T-010 criterion 1 — what is committed", () => {
  test("git ls-files lists exactly 51 paths under question-bank/data/us-states", () => {
    expect(trackedUnder("question-bank/data/us-states")).toHaveLength(51);
  });

  test("the 51 are index.json plus one us-state-<postal>.json per curated state", () => {
    const names = trackedUnder("question-bank/data/us-states")
      .map((p) => p.split("/").pop() as string)
      .sort();
    const wanted = ["index.json", ...POSTALS.map((p) => `us-state-${p}.json`)].sort();

    expect(POSTALS).toHaveLength(50);
    expect(names).toEqual(wanted);
  });
});

describe("T-010 criterion 2 — index.json agrees with the entity files", () => {
  const index = JSON.parse(readFileSync(join(DATA_DIR, "index.json"), "utf8")) as {
    count: number;
    entities: { id: string }[];
  };

  test("index.json has count: 50", () => {
    expect(index.count).toBe(50);
  });

  test("index entities are the 50 tracked files' own id fields, no duplicates, none missing", () => {
    const fileIds = entityFiles()
      .map((name) => readTracked(name).id)
      .sort();
    const indexIds = index.entities.map((e) => e.id).sort();

    expect(indexIds).toHaveLength(50);
    expect(new Set(indexIds).size).toBe(50);
    expect(indexIds).toEqual(fileIds);
  });
});

describe("T-010 criterion 3 — every tracked entity file is complete", () => {
  for (const postal of POSTALS) {
    test(`us-state-${postal}.json parses and has every required field non-null`, () => {
      const entity = readTracked(`us-state-${postal}.json`);

      expect(entity.type).toBe("state");
      expect(entity.scope).toBe("us");
      for (const field of [
        "id",
        "name",
        "capital",
        "geometry_id",
        "centroid",
        "population",
        "area_km2",
      ] as const) {
        expect(entity[field]).not.toBeNull();
        expect(entity[field]).toBeDefined();
      }
    });
  }

  test("population_rank takes each integer 1–50 exactly once across the 50 files", () => {
    const ranks = entityFiles()
      .map((name) => readTracked(name).population_rank)
      .sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(ranks).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
  });

  test("area_rank takes each integer 1–50 exactly once across the 50 files", () => {
    const ranks = entityFiles()
      .map((name) => readTracked(name).area_rank)
      .sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(ranks).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
  });
});

describe("T-010 criterion 4 — the tracked Colorado matches the committed sample", () => {
  test("data/us-states/us-state-co.json equals sample-data/us-state-co.json except sources.built_at", () => {
    const stripBuiltAt = (entity: TrackedEntity) => {
      const { sources, ...rest } = entity;
      const { built_at: _dropped, ...restSources } = sources ?? {};
      return { ...rest, sources: restSources };
    };
    const tracked = readTracked("us-state-co.json");
    const sample = JSON.parse(
      readFileSync(join(PKG, "sample-data/us-state-co.json"), "utf8"),
    ) as TrackedEntity;

    expect(stripBuiltAt(tracked)).toEqual(stripBuiltAt(sample));
  });
});

describe("T-010 criterion 5 — the committed bank stays small", () => {
  test("every file tracked under question-bank/data/ totals under 200 KB", () => {
    const total = trackedUnder("question-bank/data").reduce(
      (sum, path) => sum + statSync(join(REPO, path)).size,
      0,
    );
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(200 * 1024);
  });
});

describe("T-010 criteria 6 and 8 — the tracked bytes are what an offline rebuild produces", () => {
  /**
   * Runs the real CLI offline into a throwaway directory, so the comparison is
   * against the bytes the build writes — not against a re-derivation of them.
   * Two runs, both compared, is criterion 6's "and a second time" boundary.
   */
  function rebuild(): Map<string, string> {
    const out = mkdtempSync(join(tmpdir(), "t010-rebuild-"));
    try {
      const proc = Bun.spawnSync(
        ["bun", join(PKG, "src/build.ts"), "--offline", "--out", out, "--quiet"],
        { cwd: PKG, env: { ...process.env, ...DEAD_PROXY } },
      );
      expect(proc.exitCode).toBe(0);
      const files = new Map<string, string>();
      for (const name of ["index.json", ...POSTALS.map((p) => `us-state-${p}.json`)]) {
        files.set(name, readFileSync(join(out, name), "utf8"));
      }
      return files;
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }

  const first = rebuild();
  const second = rebuild();

  test("two offline rebuilds of the committed fixture are byte-identical to each other", () => {
    expect([...second.entries()].sort()).toEqual([...first.entries()].sort());
  });

  for (const name of ["index.json", ...POSTALS.map((p) => `us-state-${p}.json`)]) {
    test(`${name} on disk is byte-identical to the offline rebuild`, () => {
      expect(readFileSync(join(DATA_DIR, name), "utf8")).toBe(first.get(name) as string);
    });
  }
});

describe("T-010 criterion 7 — provenance is deterministic, not deleted", () => {
  test("sources.built_at is the same ISO-8601 UTC instant in all 50 files", () => {
    const values = new Set(entityFiles().map((name) => readTracked(name).sources?.built_at));

    expect(values.size).toBe(1);
    const builtAt = [...values][0];
    expect(typeof builtAt).toBe("string");
    expect(builtAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
    expect(new Date(builtAt as string).toISOString()).toBe(builtAt as string);
  });

  test("sources.builder_version equals BUILDER_VERSION in all 50 files", () => {
    const values = new Set(entityFiles().map((name) => readTracked(name).sources?.builder_version));

    expect([...values]).toEqual([BUILDER_VERSION]);
  });
});

describe("T-010 criterion 9 — no unreviewed prose in a shippable field", () => {
  test("every tracked entity's fun_facts is an array whose elements are all reviewed: true", () => {
    for (const name of entityFiles()) {
      const funFacts = readTracked(name).fun_facts;
      expect(Array.isArray(funFacts)).toBe(true);
      for (const fact of funFacts) expect(fact.reviewed).toBe(true);
    }
  });

  test("no file tracked under question-bank/data/ contains reviewed: false anywhere", () => {
    for (const path of trackedUnder("question-bank/data")) {
      expect(readFileSync(join(REPO, path), "utf8")).not.toMatch(/"reviewed"\s*:\s*false/);
    }
  });
});

describe("T-010 criterion 10 — the ignore rules match the decision, both directions", () => {
  test("no tracked path under question-bank/data/ is matched by an ignore rule", () => {
    for (const path of trackedUnder("question-bank/data")) {
      // --no-index so a rule that matches a tracked file is still reported.
      expect(git(["check-ignore", "--no-index", "-q", path]).status).toBe(1);
    }
  });

  test("a non-bank output path under question-bank/data/ is still ignored", () => {
    expect(git(["check-ignore", "-q", "question-bank/data/subset/us-state-co.json"]).status).toBe(0);
  });
});

describe("T-010 criteria 11–16 — the rules and the docs say the same thing", () => {
  const read = (path: string) => readFileSync(join(REPO, path), "utf8");
  const e6 = read("engineering-decisions.md").split(/^## /m).find((s) => s.startsWith("E-6")) ?? "";

  test("criterion 11 — no shipped file still asserts the bank is not stored in git", () => {
    for (const path of [
      "question-bank/.gitignore",
      "question-bank/README.md",
      "question-bank/sample-data/README.md",
      "conventions.md",
      "PROGRESS.md",
    ]) {
      expect(read(path)).not.toContain("regenerated from Wikidata, not stored in git");
    }
  });

  test("criterion 12 — engineering-decisions.md has an E-6 entry stating the decision", () => {
    expect(e6).not.toBe("");
    expect(e6).toMatch(/question-bank\/data\/us-states/);
    expect(e6.toLowerCase()).toMatch(/tracked|committed/);
  });

  test("criterion 13 — E-6 names the rejected option, its staleness cost, and a revisit trigger", () => {
    expect(e6.toLowerCase()).toMatch(/option not taken|not taken|rejected/);
    expect(e6.toLowerCase()).toContain("stale");
    expect(e6.toLowerCase()).toContain("revisit");
  });

  test("criterion 14 — E-6 names the tracked home for reviewed fun-fact text", () => {
    const funFactParagraph = e6
      .split(/\n\n/)
      .find((p) => /reviewed/i.test(p) && /fun.fact/i.test(p));
    expect(funFactParagraph).toBeTruthy();
    expect(funFactParagraph).toMatch(/question-bank\/data\/us-states|tracked entity files/);
  });

  test("criterion 15 — README and conventions say a fresh clone already has the bank", () => {
    expect(read("question-bank/README.md")).toMatch(/committed/);
    expect(read("question-bank/README.md")).toMatch(/fresh clone/i);
    expect(read("conventions.md")).toMatch(/committed/);
    expect(read("conventions.md")).toMatch(/data\/us-states/);
  });

  test("criterion 16 — tasks.md T-040 reads the committed bank, and PROGRESS.md records it", () => {
    const t040 = read("tasks.md")
      .split(/^### /m)
      .find((s) => s.startsWith("T-040"));
    expect(t040).toBeTruthy();
    expect(t040).toMatch(/question-bank\/data\/us-states/);
    expect(t040?.toLowerCase()).toMatch(/no live wikidata|without a live|needs no live/);

    expect(read("PROGRESS.md")).toMatch(/question-bank\/data\/us-states/);
  });
});

/**
 * Criteria 17 (no new dependency) and 18 (nothing outside the Constraints list)
 * are properties of *this branch's diff*, not of the tree, so they are verified
 * in the brief's Verdict with `git diff --name-only origin/main...HEAD` rather
 * than committed as tests. A committed version would be either wrong — every
 * later PR that legitimately adds a dependency would fail it — or, worse, a
 * tautology: CI checks out at `fetch-depth: 1` (`.github/workflows/ci.yml`,
 * `actions/checkout@v5`), so `origin/main` does not exist there and the diff
 * would come back empty, passing no matter what the branch contained.
 */
