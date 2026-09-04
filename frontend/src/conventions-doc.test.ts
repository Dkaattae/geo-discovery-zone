import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-007's acceptance criteria, written out as assertions by the verifying
 * session (`process.md` step 4).
 *
 * Every expected value here comes from the wording of a criterion in
 * `tasks/T-007-conventions-current.md`, or from the repo file the criterion
 * names as the authority — `backend/Makefile`, the three `package.json` files,
 * `.github/workflows/ci.yml`, `docker-compose.yml`. None of it was read out of
 * `conventions.md`: the doc is the thing under test, so taking an expectation
 * from it would only ratify whatever it happens to say.
 *
 * It lives in `frontend/`'s `bun test` because that suite already asserts on
 * repo-level files from the repo root (`lint-gate.test.ts`,
 * `lib/level.criteria.test.ts`) — the brief's Constraints ask for an existing
 * suite, no new runner and no new dependency. Everything below reads local
 * files only: no network (`test-guidelines.md`, "No network in tests, ever").
 */

const REPO_ROOT = join(import.meta.dirname, "../..");
const doc = readFileSync(join(REPO_ROOT, "conventions.md"), "utf8");
const docLines = doc.split("\n");

/**
 * The body of a `## Heading` section, up to the next heading of the same or
 * higher level. Lines inside a fenced code block are never headings — the
 * Commands block is full of `# frontend`-style comments.
 */
function section(heading: string): string {
  const start = docLines.findIndex((line) => line.trim() === heading);
  if (start < 0) throw new Error(`conventions.md has no "${heading}" heading`);
  const level = heading.match(/^#+/)![0].length;
  const body: string[] = [];
  let inFence = false;
  for (const line of docLines.slice(start + 1)) {
    if (/^```/.test(line)) inFence = !inFence;
    const hashes = inFence ? null : line.match(/^(#+)\s/);
    if (hashes && hashes[1]!.length <= level) break;
    body.push(line);
  }
  return body.join("\n");
}

/** Collapse newlines so a sentence broken across lines still matches. */
const flat = (text: string) => text.replace(/\s+/g, " ");

/** The contents of the first fenced code block in `text`. */
function codeBlock(text: string): string {
  const match = text.match(/```[a-z]*\n([\s\S]*?)```/);
  if (!match) throw new Error("expected a fenced code block");
  return match[1]!;
}

function readJson(relativePath: string): { scripts?: Record<string, string> } {
  return JSON.parse(readFileSync(join(REPO_ROOT, relativePath), "utf8")) as {
    scripts?: Record<string, string>;
  };
}

// ---------------------------------------------------------------------------
// Criterion 1 & 2 — the Layout block
// ---------------------------------------------------------------------------

interface LayoutEntry {
  path: string;
  description: string;
}

function layoutEntries(): LayoutEntry[] {
  return codeBlock(section("## Layout"))
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const match = line.match(/^(\S+)\s*(.*)$/)!;
      return { path: match[1]!, description: match[2]!.trim() };
    });
}

describe("criterion 1 — every path in the Layout block exists", () => {
  test("the Layout block lists at least one path", () => {
    expect(layoutEntries().length).toBeGreaterThan(0);
  });

  for (const entry of layoutEntries()) {
    test(`${entry.path} resolves relative to the repo root`, () => {
      expect(existsSync(join(REPO_ROOT, entry.path.replace(/\/$/, "")))).toBe(true);
    });
  }
});

describe("criterion 2 — the Layout block names all seven, each described", () => {
  const required = [
    "frontend/",
    "backend/",
    "question-bank/",
    "e2e/",
    "fixtures/",
    "tasks/",
    "openapi.yaml",
  ];

  for (const name of required) {
    test(`${name} is listed with a one-line description`, () => {
      const entry = layoutEntries().find((candidate) => candidate.path === name);
      expect(entry).toBeDefined();
      expect(entry!.description.length).toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Criterion 3 & 4 — nothing claims the backend is unbuilt, and `api/` is gone
// ---------------------------------------------------------------------------

describe("criterion 3 — nothing claims the backend is unbuilt", () => {
  for (const forbidden of ["not built yet", "once it exists", "cd api"]) {
    test(`the string "${forbidden}" does not appear`, () => {
      expect(doc.toLowerCase()).not.toContain(forbidden);
    });
  }

  test("no sentence describes the API, backend or database as not yet existing", () => {
    const claims = doc.match(
      /\b(api|backend|database)\b[^.\n]{0,60}\b(not built|not yet built|does not exist|doesn't exist|not yet exist|isn't built|is not built|yet to be built|when it exists)\b/gi,
    );
    expect(claims).toBeNull();
  });
});

describe("criterion 4 — `api/` is gone as a directory", () => {
  test("no reference to a top-level directory named api/", () => {
    // `/api/v1` is the URL prefix the backend serves the contract under, and
    // the criterion says it is unaffected — so remove it before looking.
    const withoutUrlPrefix = doc.replace(/\/api\/v1/g, "");
    expect(withoutUrlPrefix).not.toMatch(/\bapi\//);
  });

  test("/api/v1 itself is still allowed to appear", () => {
    // Guards the check above against being satisfied by deleting the URL too:
    // if this ever fails, the criterion's carve-out has become meaningless.
    expect(doc).toContain("/api/v1");
  });
});

// ---------------------------------------------------------------------------
// Criterion 5 — fixtures/ is explained
// ---------------------------------------------------------------------------

describe("criterion 5 — fixtures/ is explained", () => {
  test("names fixtures/level-labels.json", () => {
    expect(doc).toContain("fixtures/level-labels.json");
  });

  test("names both sides that assert against it", () => {
    expect(doc).toContain("frontend/src/lib/level.test.ts");
    expect(doc).toContain("backend/tests/test_levels.py");
  });

  test("says editing one side alone turns a suite red", () => {
    const sentences = doc.split(/(?<=[.:])\s+/);
    const warning = sentences.find(
      (sentence) => /\bred\b/i.test(sentence) && /\bedit|\bchang/i.test(sentence),
    );
    expect(warning).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Criterion 6 & 7 — backend commands and migrations are real Makefile targets
// ---------------------------------------------------------------------------

function makefileTargets(): Set<string> {
  const makefile = readFileSync(join(REPO_ROOT, "backend/Makefile"), "utf8");
  const targets = new Set<string>();
  for (const line of makefile.split("\n")) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):/);
    if (match) targets.add(match[1]!);
  }
  return targets;
}

function backendTargetsNamedInDoc(): string[] {
  return [...doc.matchAll(/make\s+-C\s+backend\s+([A-Za-z][A-Za-z0-9_-]*)/g)].map(
    (match) => match[1]!,
  );
}

describe("criterion 6 — backend commands exist and are real targets", () => {
  for (const target of ["dev", "test", "check", "migrate"]) {
    test(`names \`make -C backend ${target}\``, () => {
      expect(backendTargetsNamedInDoc()).toContain(target);
    });
  }

  test("every make target named for the backend is defined in backend/Makefile", () => {
    const defined = makefileTargets();
    const undefinedTargets = backendTargetsNamedInDoc().filter((name) => !defined.has(name));
    expect(undefinedTargets).toEqual([]);
  });

  test("no backend make invocation is written in a form that needs a cd first", () => {
    // The criterion asks for a form runnable from the repo root.
    expect(doc).not.toMatch(/cd\s+backend\s*&&\s*make/);
  });
});

describe("criterion 7 — migrations, in practice", () => {
  test("names the command that applies migrations", () => {
    expect(backendTargetsNamedInDoc()).toContain("migrate");
    expect(makefileTargets().has("migrate")).toBe(true);
  });

  test("names the command that creates a new migration", () => {
    expect(backendTargetsNamedInDoc()).toContain("revision");
    expect(makefileTargets().has("revision")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Criterion 8 — the database is described
// ---------------------------------------------------------------------------

describe("criterion 8 — the database is described", () => {
  test("names GEO_DATABASE_URL as the setting that chooses the database", () => {
    expect(doc).toMatch(/GEO_DATABASE_URL[^.]{0,120}\b(chooses|selects|single setting|picks)\b/i);
  });

  test("says SQLite is the default", () => {
    expect(doc).toMatch(/sqlite[^.]{0,80}\bdefault\b|\bdefault\b[^.]{0,80}sqlite/i);
  });

  test("says Postgres is supported and tested", () => {
    expect(doc).toMatch(/postgres[^.]{0,120}\btested\b/i);
    expect(doc).toMatch(/postgres[^.]{0,120}\bsupported\b/i);
  });
});

// ---------------------------------------------------------------------------
// Criterion 9 — frontend, question-bank and e2e commands are complete and real
// ---------------------------------------------------------------------------

/** `bun run <script>` occurrences in the Commands block, grouped by package. */
function bunScriptsByPackage(): Record<string, string[]> {
  const block = codeBlock(section("## Commands"));
  const packages: Record<string, string[]> = { frontend: [], "question-bank": [], e2e: [] };
  const headingFor = (line: string): string | undefined => {
    const lowered = line.toLowerCase();
    if (/question[- ]bank/.test(lowered)) return "question-bank";
    if (/\be2e\b/.test(lowered)) return "e2e";
    if (/\bfrontend\b/.test(lowered)) return "frontend";
    if (/\bbackend\b/.test(lowered)) return "backend";
    return undefined;
  };

  let current: string | undefined;
  for (const line of block.split("\n")) {
    if (/^\s*#/.test(line)) {
      const heading = headingFor(line);
      if (heading) current = heading;
      continue;
    }
    const cd = line.match(/cd\s+([A-Za-z0-9_-]+)/);
    const owner = cd ? cd[1]! : current;
    if (!owner || !(owner in packages)) continue;
    for (const match of line.matchAll(/bun\s+run\s+([A-Za-z0-9:_-]+)/g)) {
      packages[owner]!.push(match[1]!);
    }
  }
  return packages;
}

describe("criterion 9 — frontend commands are complete and real", () => {
  test("the frontend block names `bun run typecheck`", () => {
    expect(bunScriptsByPackage()["frontend"]).toContain("typecheck");
  });

  test("the frontend block names how to run the frontend tests", () => {
    const frontendLines = codeBlock(section("## Commands"))
      .split("\n")
      .filter((line) => /frontend/.test(line));
    expect(frontendLines.some((line) => /\bbun\s+test\b/.test(line))).toBe(true);
  });

  for (const pkg of ["frontend", "question-bank", "e2e"]) {
    test(`every \`bun run <script>\` named for ${pkg}/ is a key of its package.json scripts`, () => {
      const declared = Object.keys(readJson(`${pkg}/package.json`).scripts ?? {});
      const named = bunScriptsByPackage()[pkg]!;
      expect(named.length).toBeGreaterThan(0);
      expect(named.filter((script) => !declared.includes(script))).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// Criterion 10 — CI is described, and the job list matches exactly
// ---------------------------------------------------------------------------

function workflowJobs(): string[] {
  const workflow = readFileSync(join(REPO_ROOT, ".github/workflows/ci.yml"), "utf8").split("\n");
  const start = workflow.findIndex((line) => /^jobs:\s*$/.test(line));
  expect(start).toBeGreaterThanOrEqual(0);
  const jobs: string[] = [];
  for (const line of workflow.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    const match = line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (match) jobs.push(match[1]!);
  }
  return jobs;
}

describe("criterion 10 — CI is described, and the job list matches", () => {
  test("names the workflow file", () => {
    expect(doc).toContain(".github/workflows/ci.yml");
  });

  test("says it runs on every pull request to main and every push to main", () => {
    const ci = section("## CI");
    expect(ci).toMatch(/pull request[\s\S]{0,60}\bmain\b/i);
    expect(ci).toMatch(/push[\s\S]{0,40}\bmain\b/i);
  });

  test("the set of job names in the doc is exactly the set of jobs in ci.yml", () => {
    // The doc's job list is its longest run of adjacent backticked tokens —
    // "`frontend`, `question-bank`, ..." — which is well defined without
    // reading any expected value out of the doc. Neither a job the list omits
    // nor a name in it that is not a job satisfies the criterion.
    const runs = [...flat(section("## CI")).matchAll(/`[^`]+`(?:\s*(?:,|and)?\s*`[^`]+`)+/g)].map(
      (match) => [...match[0].matchAll(/`([^`]+)`/g)].map((token) => token[1]!),
    );
    const longest = runs.sort((a, b) => b.length - a.length)[0];
    expect(longest).toBeDefined();
    expect([...new Set(longest)].sort()).toEqual([...workflowJobs()].sort());
  });
});

// ---------------------------------------------------------------------------
// Criterion 11 — Docker is pointed at, not restated
// ---------------------------------------------------------------------------

describe("criterion 11 — Docker is pointed at, not restated", () => {
  test("names Dockerfile and docker-compose.yml", () => {
    const docker = section("## Docker");
    expect(docker).toContain("Dockerfile");
    expect(docker).toContain("docker-compose.yml");
  });

  test("says the image serves the frontend and the API on one origin", () => {
    expect(flat(section("## Docker"))).toMatch(/\b(one|the same|a single) origin\b/i);
  });

  test("links to README.md for the run instructions", () => {
    expect(section("## Docker")).toMatch(/\]\(README\.md\)/);
  });

  test("copies no docker run flag set, volume name or port mapping", () => {
    const docker = section("## Docker");
    expect(docker).not.toMatch(/docker\s+run/i);
    expect(docker).not.toMatch(/(^|\s)-[pv]\s/);
    expect(docker).not.toMatch(/--(volume|publish)\b/);
    expect(docker).not.toMatch(/\b\d{2,5}:\d{2,5}\b/);
    // Every named volume declared in docker-compose.yml.
    const compose = readFileSync(join(REPO_ROOT, "docker-compose.yml"), "utf8");
    const volumesBlock = compose.split(/^volumes:\s*$/m)[1] ?? "";
    for (const match of volumesBlock.matchAll(/^ {2}([A-Za-z0-9_-]+):/gm)) {
      expect(docker).not.toContain(match[1]!);
    }
  });
});

// ---------------------------------------------------------------------------
// Criterion 12 — every relative link resolves
// ---------------------------------------------------------------------------

function linkTargets(): string[] {
  return [...doc.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]!);
}

describe("criterion 12 — every relative link resolves", () => {
  test("the file contains markdown links at all", () => {
    expect(linkTargets().length).toBeGreaterThan(0);
  });

  test("no link targets a URL that would have to be fetched to check", () => {
    expect(linkTargets().filter((target) => /^[a-z][a-z0-9+.-]*:\/\//i.test(target))).toEqual([]);
  });

  test("every relative link points at a file that exists", () => {
    const broken = linkTargets()
      .map((target) => target.split("#")[0]!)
      .filter((target) => target.length > 0)
      .filter((target) => !existsSync(join(REPO_ROOT, target)));
    expect(broken).toEqual([]);
  });
});
