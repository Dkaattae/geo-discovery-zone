/**
 * T-087 tester: one `describe` per acceptance criterion of
 * `tasks/T-087-refresh-regenerate-reminder.md`. Written from the criteria, not
 * from the implementation: the two commands are the brief's literal text, not
 * the constants `refresh.ts` exports.
 *
 * **Main** is `0a98e11`. Its baselines are embedded as sha256 digests, computed
 * once from a `git worktree` of `0a98e11`, because CI checks out shallow and no
 * git call here may be handed a revision (the T-081 guard). Each pin is
 * labelled "recorded at 0a98e11". A later task that deliberately changes one of
 * these files turns its pin red; that task's tester raises a test change
 * request.
 *
 * No network: every refresh is driven through the `SparqlTransport` seam with
 * the committed recording (criterion 17). Every write goes to a temp dir; the
 * real question file and served bank are only read.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { US_STATES_ELEVATION_QUERY } from "./queries/us-states-elevation";
import { main, refreshBank } from "./refresh";
import type { SparqlResults, SparqlRow, SparqlTransport } from "./sparql";
import type { SummaryTransport } from "./sources/wikipedia";

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const BANK = join(PKG, "data/us-states");
const FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");
const ELEVATION_FIXTURE = join(PKG, "src/fixtures/us-states-elevation.sparql.json");
const QUESTION_FILE_REL = "question-bank/data/questions/us-states.json";
const SERVED_BANK_REL = "backend/app/data/content.json";

/** The brief's exact text, written as run from the repository root. */
const QUESTION_COMMAND = "cd question-bank && bun run questions";
const CONTENT_COMMAND = "make -C backend content";

const sha = (s: string | Buffer): string => createHash("sha256").update(s).digest("hex");

function gitLsFiles(...paths: string[]): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "-z", "--", ...paths], { cwd: REPO });
  if (proc.exitCode !== 0) {
    throw new Error(`git ls-files exited ${proc.exitCode}: ${proc.stderr.toString()}`);
  }
  return proc.stdout.toString().split("\0").filter(Boolean).sort();
}
const fileRowsSha = (files: string[]): string =>
  sha(JSON.stringify(files.map((f) => [f, sha(readFileSync(join(REPO, f)))])));

// ---- Pins, recorded at 0a98e11 ----------------------------------------------

/** Criteria 3, 4, 5, 14: `question-bank/data/questions/us-states.json`. */
const MAIN_QUESTIONS_SHA = "cfd2f1f9092ac70b9a455110bb254c8145b71fff1b5d1331d384656088fec64b";
/** Criterion 14: `backend/app/data/content.json`. */
const MAIN_CONTENT_SHA = "103e22e5a51b0e98145b423ca0cda5c1967b1d52a8b86d39853eb66862a33e58";
/** Criterion 3: every tracked file under `question-bank/data/us-states/`. */
const MAIN_BANK_SHA = "08b0d412d56003214f21359cce858b9211c549e4bd4d3a663da4564fd95f179c";
/** Criterion 15: every tracked file under `backend/`, `frontend/`, `e2e/`. */
const MAIN_BOUNDARY_SHA = "a01711941de33c480bf4dc25940e6c416bb7f4dbb5f62df593be249bac215c6e";
/** Criterion 16: every tracked manifest and lockfile at main. */
const MAIN_MANIFESTS = [
  "backend/pyproject.toml",
  "backend/uv.lock",
  "e2e/bun.lock",
  "e2e/package.json",
  "frontend/bun.lock",
  "frontend/package.json",
  "question-bank/bun.lock",
  "question-bank/package.json",
];
/** Criterion 16: those files except `question-bank/package.json` (criterion 2 covers it). */
const MAIN_MANIFESTS_EXCEPT_QB_PKG_SHA =
  "6d6c9f94db62f456cadd9605873117a540e46a8f79e50adeb9bfe7a0105ec005";
/** Criterion 2: `question-bank/bun.lock`. */
const MAIN_BUN_LOCK_SHA = "6bb53377c455e7936275e795c81aa62b41fcb239017b4dd9a744dfd38bda34d1";
/** Criterion 2: `question-bank/package.json` `scripts` at main. */
const MAIN_SCRIPTS: Record<string, string> = {
  build: "bun run src/build.ts",
  refresh: "bun run src/refresh.ts",
  typecheck: "tsc --noEmit",
  lint: "oxlint --deny-warnings --report-unused-disable-directives --format default src",
  format: 'prettier --write "src/**/*.ts"',
  "format:check": 'prettier --check "src/**/*.ts"',
};
/** Criterion 2: sha256 of `JSON.stringify` of `dependencies` / `devDependencies` at main. */
const MAIN_DEPS_SHA = "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b";
const MAIN_DEV_DEPS_SHA = "807e876f42447e26fe012369150b086f0255a91790eef5f0a288584d44575552";
/** Criterion 11: the three refresh test files. */
const MAIN_REFRESH_TESTS: Record<string, string> = {
  "question-bank/src/refresh.test.ts":
    "4088301dbc597c3bebbc7326b5b7a72c3a6e0c95d434f8cef4730e9d1a8e3851",
  "question-bank/src/refresh-verify.test.ts":
    "dafc3a130cdcb3f61a2627a800ddff820c044186f51ef6b9a1813df07ecdf655",
  "question-bank/src/refresh-routes-verify.test.ts":
    "deb186c7101d77d1b81a8f7fbd2c9a97a48618e06a49d7e88bc87deec5c42013",
};

// ---- Sandboxes ---------------------------------------------------------------

const temps: string[] = [];
afterEach(() => {
  while (temps.length) rmSync(temps.pop()!, { recursive: true, force: true });
});
function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

/**
 * A throwaway repository root holding a copy of `question-bank/` (source,
 * data, this branch's `package.json`), so `bun run questions` writes into the
 * copy and never into the real tree.
 */
function treeCopy(): { root: string; qb: string } {
  const root = tempDir("t087-tree-");
  const qb = join(root, "question-bank");
  mkdirSync(qb);
  cpSync(join(PKG, "src"), join(qb, "src"), { recursive: true });
  cpSync(join(PKG, "data"), join(qb, "data"), { recursive: true });
  for (const f of ["package.json", "tsconfig.json"]) cpSync(join(PKG, f), join(qb, f));
  symlinkSync(join(PKG, "node_modules"), join(qb, "node_modules"));
  return { root, qb };
}

function runIn(cwd: string, argv: string[]): { code: number; stderr: string } {
  const proc = Bun.spawnSync([process.execPath, ...argv], { cwd, stdout: "pipe", stderr: "pipe" });
  return { code: proc.exitCode, stderr: proc.stderr.toString() };
}

const questionFileIn = (qb: string): Buffer =>
  readFileSync(join(qb, "data/questions/us-states.json"));

function bankDirSha(qb: string): string {
  const dir = join(qb, "data/us-states");
  const rel = readdirSync(dir)
    .filter((n) => !n.endsWith(".review.json"))
    .sort()
    .map((n) => `question-bank/data/us-states/${n}`);
  return sha(
    JSON.stringify(rel.map((f) => [f, sha(readFileSync(join(dir, f.split("/").pop()!)))])),
  );
}

function setCapital(qb: string, file: string, capital: string): void {
  const path = join(qb, "data/us-states", file);
  const entity = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  expect(entity["capital"]).not.toBe(capital);
  entity["capital"] = capital;
  writeFileSync(path, `${JSON.stringify(entity, null, 2)}\n`);
}

// ---- Refresh harness -----------------------------------------------------------

function recording(): SparqlResults {
  const { _fixture: _drop, ...rest } = JSON.parse(
    readFileSync(FIXTURE, "utf8"),
  ) as SparqlResults & {
    _fixture?: unknown;
  };
  return rest as SparqlResults;
}
const label = (row: SparqlRow) => row["stateLabel"]?.value;

const replay =
  (response: unknown): SparqlTransport =>
  async (query) =>
    query === US_STATES_ELEVATION_QUERY
      ? (JSON.parse(readFileSync(ELEVATION_FIXTURE, "utf8")) as SparqlResults)
      : (structuredClone(response) as SparqlResults);

/** The recording with Wyoming's population moved: a changed refresh. */
function changed(): SparqlResults {
  const response = recording();
  response.results.bindings = response.results.bindings.map((row) =>
    label(row) === "Wyoming"
      ? { ...row, population: { ...row["population"]!, value: "600001" } }
      : row,
  );
  return response;
}

const noSummary: SummaryTransport = async () => {
  throw new Error("no Wikipedia in tests");
};

function sandbox(): { bank: string; fixture: string } {
  const dir = tempDir("t087-refresh-");
  const bank = join(dir, "bank");
  cpSync(BANK, bank, { recursive: true });
  const fixture = join(dir, "fx", "us-states.sparql.json");
  cpSync(FIXTURE, fixture);
  return { bank, fixture };
}

interface Run {
  code: number;
  out: string[];
  err: string[];
}

async function refresh(sparql: SparqlTransport): Promise<Run> {
  const box = sandbox();
  const out: string[] = [];
  const err: string[] = [];
  const code = await refreshBank({
    bankDir: box.bank,
    fixturePath: box.fixture,
    sparql,
    now: () => new Date("2026-10-30T09:00:00Z"),
    out: (l) => out.push(l),
    err: (l) => err.push(l),
  });
  return { code, out, err };
}

async function cli(sparql: SparqlTransport): Promise<Run> {
  const box = sandbox();
  const out: string[] = [];
  const err: string[] = [];
  const code = await main(["--bank", box.bank, "--fixture", box.fixture, "--no-fun-facts"], {
    sparql,
    summary: noSummary,
    now: () => new Date("2026-10-30T09:00:00Z"),
    out: (l) => out.push(l),
    err: (l) => err.push(l),
  });
  return { code, out, err };
}

const mentions = (lines: string[], text: string) => lines.some((l) => l.includes(text));
const mentionsEither = (lines: string[]) =>
  mentions(lines, QUESTION_COMMAND) || mentions(lines, CONTENT_COMMAND);

const qbPackage = () =>
  JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")) as Record<string, unknown>;

// ---------------------------------------------------------------------------
// Criteria 1-5: a named script for the question file
// ---------------------------------------------------------------------------

describe("T-087 criterion 1: package.json scripts has `questions`", () => {
  test("scripts.questions exists and is a non-empty string", () => {
    const scripts = qbPackage()["scripts"] as Record<string, unknown>;
    expect(Object.hasOwn(scripts, "questions")).toBe(true);
    expect(typeof scripts["questions"]).toBe("string");
    expect((scripts["questions"] as string).length).toBeGreaterThan(0);
  });
});

describe("T-087 criterion 2: only `questions` added; deps and bun.lock are main's", () => {
  test("scripts minus `questions` equals main's scripts exactly", () => {
    const scripts = { ...(qbPackage()["scripts"] as Record<string, string>) };
    delete scripts["questions"];
    expect(scripts).toEqual(MAIN_SCRIPTS);
  });

  test("dependencies and devDependencies are main's (recorded at 0a98e11)", () => {
    const pkg = qbPackage();
    expect(sha(JSON.stringify(pkg["dependencies"] ?? null))).toBe(MAIN_DEPS_SHA);
    expect(sha(JSON.stringify(pkg["devDependencies"] ?? null))).toBe(MAIN_DEV_DEPS_SHA);
  });

  test("question-bank/bun.lock is byte-identical to main's (recorded at 0a98e11)", () => {
    expect(sha(readFileSync(join(PKG, "bun.lock")))).toBe(MAIN_BUN_LOCK_SHA);
  });
});

describe("T-087 criterion 3: `bun run questions` on main's bank reproduces main's question file", () => {
  test("exits 0 and the question file is byte-identical to main's", () => {
    const { qb } = treeCopy();
    expect(bankDirSha(qb)).toBe(MAIN_BANK_SHA);
    // Prove the script writes: start from a file that is not main's.
    writeFileSync(join(qb, "data/questions/us-states.json"), "stale\n");
    const result = runIn(qb, ["run", "questions"]);
    expect(result.stderr).not.toContain("error:");
    expect(result.code).toBe(0);
    expect(sha(questionFileIn(qb))).toBe(MAIN_QUESTIONS_SHA);
  }, 60_000);
});

describe("T-087 criterion 4: on a changed bank, `bun run questions` writes what write-questions.ts writes", () => {
  test("one state's capital moved: both commands write the same bytes, and they are not main's", () => {
    const viaScript = treeCopy();
    const viaFile = treeCopy();
    setCapital(viaScript.qb, "us-state-co.json", "Boulder");
    setCapital(viaFile.qb, "us-state-co.json", "Boulder");

    expect(runIn(viaScript.qb, ["run", "questions"]).code).toBe(0);
    expect(runIn(viaFile.qb, ["run", "./src/write-questions.ts"]).code).toBe(0);

    const a = questionFileIn(viaScript.qb);
    const b = questionFileIn(viaFile.qb);
    expect(a.equals(b)).toBe(true);
    expect(sha(a)).not.toBe(MAIN_QUESTIONS_SHA);
    expect(a.toString()).toContain("Boulder");
  }, 60_000);
});

describe("T-087 criterion 5: `bun run ./src/write-questions.ts` still works", () => {
  test("exits 0 and on main's bank leaves the question file byte-identical to main's", () => {
    const { qb } = treeCopy();
    expect(bankDirSha(qb)).toBe(MAIN_BANK_SHA);
    writeFileSync(join(qb, "data/questions/us-states.json"), "stale\n");
    expect(runIn(qb, ["run", "./src/write-questions.ts"]).code).toBe(0);
    expect(sha(questionFileIn(qb))).toBe(MAIN_QUESTIONS_SHA);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// Criteria 6-11: the refresh says what to run next
// ---------------------------------------------------------------------------

describe("T-087 criterion 6: a changed refresh prints both commands on stdout", () => {
  test("refreshBank: exit 0, one stdout line contains each command", async () => {
    const r = await refresh(replay(changed()));
    expect(r.code).toBe(0);
    expect(mentions(r.out, QUESTION_COMMAND)).toBe(true);
    expect(mentions(r.out, CONTENT_COMMAND)).toBe(true);
  });

  test("the CLI (`main` with --bank / --fixture): exit 0, both commands on stdout", async () => {
    const r = await cli(replay(changed()));
    expect(r.code).toBe(0);
    expect(mentions(r.out, QUESTION_COMMAND)).toBe(true);
    expect(mentions(r.out, CONTENT_COMMAND)).toBe(true);
  });
});

describe("T-087 criterion 7: summary line, then question command, then content command", () => {
  test("indices on stdout are strictly ordered", async () => {
    const r = await refresh(replay(changed()));
    expect(r.code).toBe(0);
    const summary = r.out.findIndex((l) => l.startsWith("bank changed ("));
    const question = r.out.findIndex((l) => l.includes(QUESTION_COMMAND));
    const content = r.out.findIndex((l) => l.includes(CONTENT_COMMAND));
    expect(summary).toBeGreaterThanOrEqual(0);
    expect(question).toBeGreaterThan(summary);
    expect(content).toBeGreaterThan(question);
  });

  test("the summary line is printed once, so no command line precedes a later summary", async () => {
    const r = await refresh(replay(changed()));
    expect(r.out.filter((l) => l.startsWith("bank changed (")).length).toBe(1);
  });
});

describe("T-087 criterion 8: exit 2 prints neither command", () => {
  test("refreshBank: `bank unchanged`, neither command on stdout or stderr", async () => {
    const r = await refresh(replay(recording()));
    expect(r.code).toBe(2);
    expect(r.out).toContain("bank unchanged");
    expect(mentionsEither(r.out)).toBe(false);
    expect(mentionsEither(r.err)).toBe(false);
  });

  test("CLI: exit 2, neither command anywhere", async () => {
    const r = await cli(replay(recording()));
    expect(r.code).toBe(2);
    expect(mentionsEither([...r.out, ...r.err])).toBe(false);
  });
});

describe("T-087 criterion 9: exit 1 prints neither command, on each README failure path", () => {
  test("the transport fails", async () => {
    const r = await refresh(async () => {
      throw new TypeError("socket connection was closed unexpectedly");
    });
    expect(r.code).toBe(1);
    expect(mentionsEither([...r.out, ...r.err])).toBe(false);
  });

  test("the response is malformed (no results.bindings array)", async () => {
    const r = await refresh(replay({ head: { vars: [] }, results: { notBindings: [] } }));
    expect(r.code).toBe(1);
    expect(mentionsEither([...r.out, ...r.err])).toBe(false);
  });

  test("fewer than all 50 states match (49, on a response that would otherwise be a change)", async () => {
    const response = changed();
    response.results.bindings = response.results.bindings.filter((row) => label(row) !== "Utah");
    const r = await refresh(replay(response));
    expect(r.code).toBe(1);
    expect(mentionsEither([...r.out, ...r.err])).toBe(false);
  });
});

describe("T-087 criterion 10: a changed refresh does not run either command", () => {
  test("refreshBank: question file and served bank are byte-identical before and after", async () => {
    const qBefore = readFileSync(join(REPO, QUESTION_FILE_REL));
    const cBefore = readFileSync(join(REPO, SERVED_BANK_REL));
    const r = await refresh(replay(changed()));
    expect(r.code).toBe(0);
    expect(readFileSync(join(REPO, QUESTION_FILE_REL)).equals(qBefore)).toBe(true);
    expect(readFileSync(join(REPO, SERVED_BANK_REL)).equals(cBefore)).toBe(true);
  });

  test("CLI with --bank <tmp> --fixture <tmp>: same two files untouched", async () => {
    const qBefore = readFileSync(join(REPO, QUESTION_FILE_REL));
    const cBefore = readFileSync(join(REPO, SERVED_BANK_REL));
    const r = await cli(replay(changed()));
    expect(r.code).toBe(0);
    expect(readFileSync(join(REPO, QUESTION_FILE_REL)).equals(qBefore)).toBe(true);
    expect(readFileSync(join(REPO, SERVED_BANK_REL)).equals(cBefore)).toBe(true);
  });
});

describe("T-087 criterion 11: the three refresh test files are main's", () => {
  for (const [file, digest] of Object.entries(MAIN_REFRESH_TESTS)) {
    test(`${file} is byte-identical to 0a98e11`, () => {
      expect(sha(readFileSync(join(REPO, file)))).toBe(digest);
    });
  }

  test("a changed refresh adds no stdout line starting `  us-state-` beyond the field changes", async () => {
    const r = await refresh(replay(changed()));
    // Warnings above the summary also start `  us-state-`; from the summary on,
    // the only such lines are field changes. One field moved (Wyoming's population).
    const summary = r.out.findIndex((l) => l.startsWith("bank changed ("));
    expect(r.out[summary]).toContain("1 field change(s)");
    const changeLines = r.out.slice(summary).filter((l) => l.startsWith("  us-state-"));
    expect(changeLines).toHaveLength(1);
    expect(changeLines[0]).toContain("us-state-wy");
  });
});

// ---------------------------------------------------------------------------
// Criteria 12-13: the docs
// ---------------------------------------------------------------------------

describe("T-087 criterion 12: README 'Refreshing the committed bank' names both commands, question first", () => {
  test("the section contains both, the question command first", () => {
    const readme = readFileSync(join(PKG, "README.md"), "utf8");
    const start = readme.indexOf("## Refreshing the committed bank");
    expect(start).toBeGreaterThanOrEqual(0);
    const nextHeading = readme.indexOf("\n## ", start + 1);
    const section = readme.slice(start, nextHeading === -1 ? undefined : nextHeading);
    const q = section.indexOf(QUESTION_COMMAND);
    const c = section.indexOf(CONTENT_COMMAND);
    expect(q).toBeGreaterThanOrEqual(0);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(q).toBeLessThan(c);
  });
});

describe("T-087 criterion 13: conventions.md question-bank command block", () => {
  function questionBankBlock(): string {
    const doc = readFileSync(join(REPO, "conventions.md"), "utf8");
    const start = doc.indexOf("## Commands");
    expect(start).toBeGreaterThanOrEqual(0);
    const end = doc.indexOf("\n## ", start + 1);
    const section = doc.slice(start, end === -1 ? undefined : end);
    const blocks = [...section.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]!);
    const qb = blocks.filter((b) => b.includes("cd question-bank"));
    expect(qb).toHaveLength(1);
    return qb[0]!;
  }

  test("lists `bun run questions`", () => {
    expect(questionBankBlock()).toMatch(/^bun run questions\b/m);
  });

  test("no longer lists `bun run ./src/write-questions.ts`", () => {
    expect(questionBankBlock()).not.toContain("bun run ./src/write-questions.ts");
  });
});

// ---------------------------------------------------------------------------
// Criteria 14-17: what must not happen
// ---------------------------------------------------------------------------

describe("T-087 criterion 14: question file and served bank are main's", () => {
  test("question file sha256 recorded at 0a98e11", () => {
    expect(sha(readFileSync(join(REPO, QUESTION_FILE_REL)))).toBe(MAIN_QUESTIONS_SHA);
  });

  test("served bank sha256 recorded at 0a98e11", () => {
    expect(sha(readFileSync(join(REPO, SERVED_BANK_REL)))).toBe(MAIN_CONTENT_SHA);
  });

  test("_source.generatedBy still names `bun run ./src/write-questions.ts`", () => {
    const file = JSON.parse(readFileSync(join(REPO, QUESTION_FILE_REL), "utf8")) as {
      _source?: { generatedBy?: string };
    };
    expect(file._source?.generatedBy).toContain("bun run ./src/write-questions.ts");
  });
});

describe("T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes", () => {
  test("every tracked file under the three trees is 0a98e11's, none added or removed", () => {
    expect(fileRowsSha(gitLsFiles("backend", "frontend", "e2e"))).toBe(MAIN_BOUNDARY_SHA);
  });
});

describe("T-087 criterion 16: no new dependency", () => {
  test("the tracked manifests and lockfiles are main's list, none added", () => {
    const manifests = gitLsFiles().filter((f) =>
      /(^|\/)(package\.json|bun\.lockb?|pyproject\.toml|uv\.lock|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|requirements[^/]*\.txt)$/.test(
        f,
      ),
    );
    expect(manifests).toEqual(MAIN_MANIFESTS);
  });

  test("every manifest but question-bank/package.json is byte-identical to 0a98e11", () => {
    expect(fileRowsSha(MAIN_MANIFESTS.filter((f) => f !== "question-bank/package.json"))).toBe(
      MAIN_MANIFESTS_EXCEPT_QB_PKG_SHA,
    );
  });
});

describe("T-087 criterion 17: no test of this task reaches the network", () => {
  const tests = ["refresh-next-steps.test.ts", "refresh-regenerate-reminder-verify.test.ts"];
  for (const name of tests) {
    test(`${name} drives the refresh through SparqlTransport and never calls fetch`, () => {
      const source = readFileSync(join(PKG, "src", name), "utf8");
      expect(source).toContain("SparqlTransport");
      expect(source).not.toMatch(/\bfetch\s*\(/);
      for (const live of [
        ["create", "SparqlClient"],
        ["create", "SummaryTransport"],
      ]) {
        expect(source).not.toContain(live.join(""));
      }
    });
  }
});
