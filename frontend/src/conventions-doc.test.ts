import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-007's acceptance criteria, written out as assertions by the verifying
 * session (`process.md` step 4). T-058 later added the describe blocks near
 * the bottom of this file, which check the same kind of claim in `README.md`
 * and a lockfile-attribution claim in `conventions.md`'s CI section — reusing
 * this file's helpers (`workflowJobs()` in particular) rather than adding
 * another parser of `ci.yml` next to the ones that already exist —
 * `ci-action-pinning.test.ts`, `lint-gate.test.ts` and
 * `git-baseline-guard.criteria.test.ts` (T-061 folded the test file that used
 * to duplicate this one's parsing into this file, so this file stays separate
 * from that trio rather than growing a fifth).
 *
 * Every expected value here comes from the wording of a criterion in
 * `tasks/T-007-conventions-current.md` or `tasks/T-058-doc-claims-about-ci.md`,
 * or from the repo file the criterion names as the authority —
 * `backend/Makefile`, the three `package.json` files,
 * `.github/workflows/ci.yml`, `docker-compose.yml`, `e2e/tests/`. None of it
 * was read out of `conventions.md` or `README.md`: the docs are the thing
 * under test, so taking an expectation from either would only ratify whatever
 * it happens to say.
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
const readmeDoc = readFileSync(join(REPO_ROOT, "README.md"), "utf8");
const readmeLines = readmeDoc.split("\n");

/**
 * The body of a `## Heading` section of `lines`, up to the next heading of the
 * same or higher level. Lines inside a fenced code block are never
 * headings — the Commands block is full of `# frontend`-style comments.
 */
function sectionOf(lines: string[], heading: string): string {
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start < 0) throw new Error(`doc has no "${heading}" heading`);
  const level = heading.match(/^#+/)![0].length;
  const body: string[] = [];
  let inFence = false;
  for (const line of lines.slice(start + 1)) {
    if (/^```/.test(line)) inFence = !inFence;
    const hashes = inFence ? null : line.match(/^(#+)\s/);
    if (hashes && hashes[1]!.length <= level) break;
    body.push(line);
  }
  return body.join("\n");
}

/** `section()` against `conventions.md`. */
function section(heading: string): string {
  return sectionOf(docLines, heading);
}

/** `section()` against `README.md`. */
function readmeSection(heading: string): string {
  return sectionOf(readmeLines, heading);
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

function backendTargetsNamedIn(text: string): string[] {
  return [...text.matchAll(/make\s+-C\s+backend\s+([A-Za-z][A-Za-z0-9_-]*)/g)].map(
    (match) => match[1]!,
  );
}

function backendTargetsNamedInDoc(): string[] {
  return backendTargetsNamedIn(doc);
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

/** `bun run <script>` occurrences in a fenced code block, grouped by package. */
function bunScriptsIn(block: string): Record<string, string[]> {
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

function bunScriptsByPackage(): Record<string, string[]> {
  return bunScriptsIn(codeBlock(section("## Commands")));
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
    // T-061: `longestBacktickRun()` (defined below, reused for README's job
    // list) used to be duplicated here as an inline regex; one implementation
    // now serves both.
    const longest = longestBacktickRun(section("## CI"));
    expect(longest.length).toBeGreaterThan(0);
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

// ---------------------------------------------------------------------------
// T-058 — README.md's CI claims, and conventions.md's lockfile attribution
//
// `tasks/T-058-doc-claims-about-ci.md` found four stale claims: README's job
// count and list (criteria 1-2), README's "CI skips Postgres" bullet
// (criterion 3), README's Checks block missing the `e2e` job and carrying two
// stale test counts (criteria 4, 8), and conventions.md attributing the
// lockfile-drift check to all six jobs when only four have it (criteria 5-6).
// conventions.md:66's e2e journey count (criterion 7) was removed rather than
// asserted — see the Handoff.
// ---------------------------------------------------------------------------

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];

/** The longest run of adjacent backticked tokens in `text` — the same trick
 * `criterion 10` above uses to find conventions.md's job list, generalised so
 * README's Checks section can be checked against the same authority. */
function longestBacktickRun(text: string): string[] {
  const runs = [...flat(text).matchAll(/`[^`]+`(?:\s*(?:,|and)?\s*`[^`]+`)+/g)].map((match) =>
    [...match[0].matchAll(/`([^`]+)`/g)].map((token) => token[1]!),
  );
  return runs.sort((a, b) => b.length - a.length)[0] ?? [];
}

/** Every top-level job in `ci.yml`, with the lines of its block. */
function ciJobBlocks(): { name: string; lines: string[] }[] {
  const workflow = readFileSync(join(REPO_ROOT, ".github/workflows/ci.yml"), "utf8").split("\n");
  const start = workflow.findIndex((line) => /^jobs:\s*$/.test(line));
  expect(start).toBeGreaterThanOrEqual(0);
  const jobs: { name: string; lines: string[] }[] = [];
  let current: { name: string; lines: string[] } | undefined;
  for (const line of workflow.slice(start + 1)) {
    const jobMatch = line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (jobMatch) {
      current = { name: jobMatch[1]!, lines: [] };
      jobs.push(current);
      continue;
    }
    if (/^\S/.test(line)) {
      current = undefined;
      continue;
    }
    current?.lines.push(line);
  }
  return jobs;
}

/** Job names in `ci.yml` whose steps run `git diff --exit-code` against the
 * lockfile they just installed from. */
function jobsWithLockfileCheck(): string[] {
  return ciJobBlocks()
    .filter((job) => job.lines.some((line) => /git diff --exit-code/.test(line)))
    .map((job) => job.name);
}

/** Job names in the backticked run of `conventions.md`'s `## CI` section's
 * lockfile-drift sentence — the doc's claim of which jobs check the lockfile
 * they installed from. Derived from the doc, which is the thing under test;
 * the expectation it is compared against comes from `ci.yml`. T-061: this used
 * to be defined twice (once per describe block below, five identical lines
 * each) — one definition now serves both. */
function jobsDocClaimsCheckLockfile(): string[] {
  const ci = flat(section("## CI"));
  const sentence = ci
    .split(/(?<=[.;])\s+/)
    .find((candidate) => /lockfile did not move/i.test(candidate));
  expect(sentence).toBeDefined();
  return [...sentence!.matchAll(/`([^`]+)`/g)].map((match) => match[1]!);
}

describe("README's CI claim names every job and states the right count (T-058 #1, #2)", () => {
  test("the set of job names in README's CI sentence is exactly ci.yml's job set", () => {
    const longest = longestBacktickRun(readmeSection("## Checks"));
    expect(longest.length).toBeGreaterThan(0);
    expect([...new Set(longest)].sort()).toEqual([...workflowJobs()].sort());
  });

  test("no sentence in README states a wrong number of CI jobs", () => {
    const jobCount = workflowJobs().length;
    expect(jobCount).toBeLessThan(NUMBER_WORDS.length);
    const correctWord = NUMBER_WORDS[jobCount]!;
    const stated = [...readmeDoc.matchAll(/\b([a-z]+)\s+jobs?\b/gi)]
      .map((match) => match[1]!.toLowerCase())
      .filter((word) => NUMBER_WORDS.includes(word));
    expect(stated).toEqual(stated.map(() => correctWord));
  });
});

describe("README no longer says CI skips the Postgres path (T-058 #3)", () => {
  for (const forbidden of [
    "ci only runs the sqlite path",
    "test-postgres` automatically",
    "postgres-only regression would not fail a pull request",
  ]) {
    test(`does not contain "${forbidden}"`, () => {
      expect(readmeDoc.toLowerCase()).not.toContain(forbidden);
    });
  }

  test("no sentence says nothing runs the Postgres suite automatically", () => {
    const claims = readmeDoc.match(
      /\bpostgres\b[^.\n]{0,160}\b(nothing runs|only.{0,20}locally|would not fail)\b/gi,
    );
    expect(claims).toBeNull();
  });
});

describe("README's Checks section runs every suite CI runs, with real commands (T-058 #4)", () => {
  const checksBlock = () => codeBlock(readmeSection("## Checks"));

  test("every make target named for the backend is a real target", () => {
    const defined = makefileTargets();
    const undefinedTargets = backendTargetsNamedIn(checksBlock()).filter(
      (name) => !defined.has(name),
    );
    expect(undefinedTargets).toEqual([]);
  });

  test("names the backend suite, the Postgres run and the integration run", () => {
    const targets = backendTargetsNamedIn(checksBlock());
    expect(targets).toContain("check");
    expect(targets).toContain("test-postgres");
    expect(targets).toContain("test-integration");
  });

  test("names the frontend and question-bank test commands", () => {
    expect(checksBlock()).toMatch(/cd\s+frontend[^\n]*bun\s+test\b/);
    expect(checksBlock()).toMatch(/cd\s+question-bank[^\n]*bun\s+test\b/);
  });

  test("names a way to run the browser suite in e2e/", () => {
    expect(checksBlock()).toMatch(/cd\s+e2e[^\n]*bun\s+(run\s+test|test)\b/);
  });

  for (const pkg of ["frontend", "question-bank", "e2e"]) {
    test(`every \`bun run <script>\` named for ${pkg}/ in the Checks block is a real script`, () => {
      const declared = Object.keys(readJson(`${pkg}/package.json`).scripts ?? {});
      const named = bunScriptsIn(checksBlock())[pkg] ?? [];
      expect(named.filter((script) => !declared.includes(script))).toEqual([]);
    });
  }
});

describe("no unstated test-suite size survives anywhere in README (T-058 #8, T-062)", () => {
  // Catches both "9 Postgres-only tests" and "nine Postgres-only tests" —
  // anywhere in the file, not just inside the fenced Checks block — while
  // leaving a spelled-out number that isn't about a count of tests alone
  // (e.g. "nine states"), since the word "test(s)" has to follow within a
  // few words. T-062: README no longer states such a count at all (the
  // Postgres-only test count in backend/tests/test_postgres.py can drift
  // without going stale in prose), so this test's job is to keep it that
  // way rather than to pin a number.
  //
  // T-061 criterion 11: this pattern and `readme-test-count.criteria.test.ts`'s
  // `testCountClaims()` (a tokeniser, not a phrase regex) are kept as two
  // independent implementations on purpose — the latter's header comment
  // (lines 17-20) says it was written independently precisely so it could
  // disagree with the guard beside it, and folding one into the other would
  // undo that. T-061 did not add a comparison between them; it only closed the
  // gap the survey found: `testCountClaims()` already had a test proving it is
  // not vacuous (`readme-test-count.criteria.test.ts:134-137`), and this
  // pattern did not.
  //
  // T-065 criterion 11: the "not vacuous" test above proves the pattern can
  // match, but not that the *scan* has to cover the whole file — and since
  // T-062 README states no count anywhere, narrowing the assertion below from
  // `readmeDoc` to just the Checks block currently stays green too (tried by
  // hand, reverted). The "reach matters" test below is what actually backs the
  // whole-file claim: a synthetic document, independent of what README says
  // today, with a stale count placed outside the Checks block.
  const NUMBER_WORDS =
    "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen";
  const testCountPattern = new RegExp(
    `\\b(?:\\d+|${NUMBER_WORDS})\\b(?:\\s+[a-zA-Z][a-zA-Z-]*){0,3}\\s+tests?\\b`,
    "gi",
  );

  test("no digit or spelled-out count of tests appears anywhere in README.md", () => {
    expect(readmeDoc.match(testCountPattern)).toBeNull();
  });

  test("the pattern is not vacuous: it matches the sentence README.md used to state", () => {
    expect("The nine Postgres-only tests skip on SQLite, so nobody").toMatch(testCountPattern);
  });

  test("the pattern's reach matters: a stale count outside the Checks block would be missed by a narrower scan (T-065 #11)", () => {
    // README currently states no count of tests at all (T-062), so scanning
    // only the Checks code block passes just as vacuously as scanning the
    // whole file today — that mutation was tried and it stayed green. This
    // is the test that actually backs the claim above: built on a synthetic
    // skeleton rather than lifted from readmeDoc, so it stays true regardless
    // of what README happens to say, and it would catch a future PR that
    // narrowed the assertion above from `readmeDoc` to just the Checks block.
    const skeleton = [
      "# Geo quiz",
      "",
      "## Checks",
      "",
      "```bash",
      "make -C backend check",
      "```",
      "",
      "## Layout",
      "",
      "The nine Postgres-only tests skip on SQLite.",
      "",
    ].join("\n");
    const checksBlockOnly = codeBlock(sectionOf(skeleton.split("\n"), "## Checks"));
    // `.match()`, not `.toMatch()`: `testCountPattern` carries the "g" flag,
    // and `.toMatch()` runs it through `RegExp.prototype.test()`, which
    // advances the pattern's shared `lastIndex` across calls — including the
    // "not vacuous" test just above. `.match()` resets it each time, so these
    // two assertions cannot pass for the wrong reason depending on test order.
    expect(checksBlockOnly.match(testCountPattern)).toBeNull();
    expect(skeleton.match(testCountPattern)).not.toBeNull();
  });
});

describe("no unstated e2e journey count survives in conventions.md's Commands block (T-058 #7)", () => {
  test("the e2e comment does not state a count of journeys", () => {
    const commands = codeBlock(section("## Commands"));
    const e2eComment = commands.split("\n").find((line) => /^#\s*e2e\b/.test(line.trim()));
    expect(e2eComment).toBeDefined();
    // Strip the job name itself before looking for a digit — "e2e" has one.
    expect(e2eComment!.replace(/\be2e\b/i, "")).not.toMatch(/\d/);
    expect(e2eComment!.toLowerCase()).not.toMatch(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen)\b/,
    );
  });
});

describe("conventions.md attributes the lockfile check only to the jobs that have it (T-058 #5, #6)", () => {
  test("the doc's lockfile-checking job list is exactly the jobs with a `git diff --exit-code` step", () => {
    expect([...new Set(jobsDocClaimsCheckLockfile())].sort()).toEqual(
      [...jobsWithLockfileCheck()].sort(),
    );
  });

  test("backend-postgres and integration are not named as checking the lockfile", () => {
    const claimed = jobsDocClaimsCheckLockfile();
    expect(claimed).not.toContain("backend-postgres");
    expect(claimed).not.toContain("integration");
  });

  test("the CI section still says all six install from a frozen lockfile", () => {
    expect(flat(section("## CI"))).toMatch(/installs from a frozen lockfile/i);
  });
});

// ---------------------------------------------------------------------------
// T-058 tester — gaps the criteria name that the blocks above do not reach
//
// Written by the verifying session (`process.md` step 4) from the wording of
// `tasks/T-058-doc-claims-about-ci.md`'s acceptance criteria, not from the
// implementation. Three places where a criterion says more than the block
// above it asserts:
//
//   * criterion 1 forbids *any* wrong count of CI jobs; the block above only
//     looks at counts spelled as words ("five jobs"), so "all 5 jobs" would
//     pass it.
//   * criterion 4 is about README's Checks *section*, not only its fenced
//     block — `make -C backend test-integration-against` and `cd e2e && bun
//     run install-browser` are both named in its prose.
//   * criterion 5 says the claimed jobs run `git diff --exit-code` *against
//     the lockfile they installed from*; the block above only looks for the
//     command.
//   * criterion 7 says no e2e journey count survives in `conventions.md`, not
//     only in the `# e2e` comment line.
//
// Expected values come from `.github/workflows/ci.yml`, `backend/Makefile` and
// the `package.json` files. Nothing is read out of either doc. File reads
// only; no network.
// ---------------------------------------------------------------------------

describe("T-058 #1 — no wrong CI job count survives in README, in digits either", () => {
  test("every digit job count in README equals ci.yml's number of jobs", () => {
    const stated = [...readmeDoc.matchAll(/\b(\d+)\s+jobs?\b/gi)].map((match) => Number(match[1]!));
    expect(stated).toEqual(stated.map(() => workflowJobs().length));
  });

  test("README's CI sentence names every job in ci.yml individually", () => {
    const sentence = flat(readmeSection("## Checks"))
      .split(/(?<=[.])\s+/)
      .find((candidate) => /\bjobs?\b/i.test(candidate) && /\bCI\b/.test(candidate));
    expect(sentence).toBeDefined();
    const named = [...sentence!.matchAll(/`([^`]+)`/g)].map((match) => match[1]!);
    for (const job of workflowJobs()) expect(named).toContain(job);
  });
});

describe("T-058 #4 — every command README's Checks section names is real", () => {
  const checksSection = () => readmeSection("## Checks");

  test("every `make -C backend <target>` in the section is a target of backend/Makefile", () => {
    const named = backendTargetsNamedIn(checksSection());
    expect(named.length).toBeGreaterThan(0);
    const defined = makefileTargets();
    expect(named.filter((target) => !defined.has(target))).toEqual([]);
  });

  for (const pkg of ["frontend", "question-bank", "e2e"]) {
    test(`every \`bun run <script>\` the section names for ${pkg}/ is a key of its scripts`, () => {
      const declared = Object.keys(readJson(`${pkg}/package.json`).scripts ?? {});
      const named = bunScriptsIn(checksSection())[pkg] ?? [];
      expect(named.filter((script) => !declared.includes(script))).toEqual([]);
    });
  }

  test("the section names a command for every suite CI runs", () => {
    const flatSection = flat(checksSection());
    // backend suite, Postgres run, integration run — by Makefile target.
    const targets = backendTargetsNamedIn(checksSection());
    expect(targets).toContain("check");
    expect(targets).toContain("test-postgres");
    expect(targets).toContain("test-integration");
    // frontend, question-bank and the browser suite — by package.
    for (const pkg of ["frontend", "question-bank", "e2e"]) {
      expect(flatSection).toMatch(new RegExp(`cd\\s+${pkg}\\s*&&[^.]{0,80}bun\\s+(run\\s+)?test`));
    }
  });
});

describe("T-058 #5 — the jobs conventions.md credits diff the lockfile they installed", () => {
  test("each credited job runs `git diff --exit-code` against the lockfile it installed from", () => {
    const blocks = ciJobBlocks();
    const credited = [...new Set(jobsDocClaimsCheckLockfile())];
    expect(credited.length).toBeGreaterThan(0);
    for (const name of credited) {
      const job = blocks.find((candidate) => candidate.name === name);
      expect(job).toBeDefined();
      const body = job!.lines.join("\n");
      const lockfile = /bun install/.test(body)
        ? "bun.lock"
        : /uv sync/.test(body)
          ? "uv.lock"
          : undefined;
      expect(lockfile).toBeDefined();
      expect(body).toMatch(
        new RegExp(`git diff --exit-code[^\\n]*${lockfile!.replace(".", "\\.")}`),
      );
    }
  });

  test("no job with such a step is left out of the doc's list", () => {
    expect([...new Set(jobsDocClaimsCheckLockfile())].sort()).toEqual(
      [...jobsWithLockfileCheck()].sort(),
    );
  });
});

describe("T-058 #7 — no e2e journey count survives anywhere in conventions.md", () => {
  test("no number, in digits or words, qualifies `journeys`", () => {
    expect(flat(doc)).not.toMatch(
      new RegExp(
        `\\b(\\d+|${NUMBER_WORDS.join("|")}|nine|ten|eleven|twelve|thirteen|fourteen)\\b[^.]{0,20}journeys`,
        "i",
      ),
    );
  });
});
