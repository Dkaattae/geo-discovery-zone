/**
 * T-083 verification (tester). Written from the acceptance criteria in
 * `tasks/T-083-retire-source-grep-stand-in.md`, independently of the worker's
 * `report-warnings-stdout.test.ts`. Every expected line (`  us-state-co.capital:
 * missing`, `3 warning(s):`, the CT/OK/VA `highest_point_m` keys, `  50 row(s)
 * returned`, `Only print the final summary.`) is quoted from a criterion.
 *
 * This file spawns nothing itself: subprocess builds go through
 * `offline-rebuild.ts` (under its dead proxy), in-process builds run
 * `--offline`. Nothing mocks `fetch`. The phrases criterion 6 forbids are
 * assembled from parts so this file is not itself a match.
 */
import { afterAll, describe, expect, spyOn, test } from "bun:test";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { runBuild } from "./build";
import { rebuildOffline, rebuildOfflineWithStdout } from "./offline-rebuild";

const PKG = resolve(import.meta.dir, "..");
const SRC = join(PKG, "src");
const BUILD = join(SRC, "build" + ".ts");
const FIXTURES = join(SRC, "fixtures");
const MAIN_FIXTURE = join(FIXTURES, "us-states.sparql.json");
const DATA = join(PKG, "data", "us-states");

const PREFIX = `t083-verify-${process.pid}-`;
const made: string[] = [];
function scratch(tag: string): string {
  const dir = mkdtempSync(join(tmpdir(), `${PREFIX}${tag}-`));
  made.push(dir);
  return dir;
}
afterAll(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

// Definitions from the brief.
const WARNING_LINE = /^ {2}[a-z-]+\.[a-z_]+: .+$/;
const HEADER = /^\d+ warning\(s\):$/;
const CO_CAPITAL = "  us-state-co.capital: missing";
const CO_HIGHEST = "  us-state-co.highest_point: missing";

type Binding = Record<string, { value: string } | undefined>;

/**
 * The derived fixture: the committed recording with Colorado's `capitalLabel`
 * and `highestPoint` keys removed, beside an unchanged elevation fixture.
 */
function derivedFixture(): string {
  const dir = scratch("fixture");
  cpSync(
    join(FIXTURES, "us-states-elevation.sparql.json"),
    join(dir, "us-states-elevation.sparql.json"),
  );
  const json = JSON.parse(readFileSync(MAIN_FIXTURE, "utf8")) as {
    results: { bindings: Binding[] };
  };
  const colorado = json.results.bindings.filter((b) => b["stateLabel"]?.value === "Colorado");
  if (colorado.length !== 1) throw new Error(`expected 1 Colorado binding, got ${colorado.length}`);
  const co = colorado[0] as Binding;
  // Both keys must exist to be removed, or the derivation proves nothing.
  if (co["capitalLabel"] === undefined || co["highestPoint"] === undefined)
    throw new Error("Colorado binding already lacks capitalLabel or highestPoint");
  delete co["capitalLabel"];
  delete co["highestPoint"];
  const path = join(dir, "us-states.sparql.json");
  writeFileSync(path, JSON.stringify(json, null, 2));
  return path;
}

const occurrences = (lines: string[], line: string) => lines.filter((l) => l === line).length;

describe("T-083 tester, criteria 1–3 — T-016 criterion 8 on the real CLI's stdout", () => {
  const derived = rebuildOfflineWithStdout(BUILD, [], `${PREFIX}derived-`, {
    fixture: derivedFixture(),
  }).stdout.split("\n");
  const committed = rebuildOfflineWithStdout(BUILD, [], `${PREFIX}committed-`).stdout.split("\n");

  test("criterion 1: exactly one warnings header in the derived build's stdout", () => {
    expect(derived.filter((l) => HEADER.test(l))).toHaveLength(1);
  });

  test("criterion 1: `us-state-co.capital: missing` printed exactly once, after the header", () => {
    const header = derived.findIndex((l) => HEADER.test(l));
    expect(header).toBeGreaterThanOrEqual(0);
    expect(occurrences(derived, CO_CAPITAL)).toBe(1);
    expect(derived.indexOf(CO_CAPITAL)).toBeGreaterThan(header);
  });

  test("criterion 1: `us-state-co.highest_point: missing` printed exactly once, after the header", () => {
    const header = derived.findIndex((l) => HEADER.test(l));
    expect(header).toBeGreaterThanOrEqual(0);
    expect(occurrences(derived, CO_HIGHEST)).toBe(1);
    expect(derived.indexOf(CO_HIGHEST)).toBeGreaterThan(header);
  });

  test("criterion 2: the header's <n> equals the number of warning lines after it", () => {
    const header = derived.findIndex((l) => HEADER.test(l));
    const n = Number(/^(\d+) /.exec(derived[header] ?? "")?.[1]);
    expect(Number.isInteger(n)).toBe(true);
    const after = derived.slice(header + 1).filter((l) => WARNING_LINE.test(l));
    expect(after).toHaveLength(n);
    // The derived build carries the full build's three plus Colorado's two.
    expect(n).toBeGreaterThanOrEqual(2);
  });

  test("criterion 3: the unmodified fixture's build prints neither Colorado line", () => {
    // Guard against an empty stdout passing vacuously.
    expect(committed.some((l) => l.startsWith("Wrote 50 entities via json → "))).toBe(true);
    expect(committed).not.toContain(CO_CAPITAL);
    expect(committed).not.toContain(CO_HIGHEST);
  });
});

describe("T-083 tester, criteria 8–10 — --quiet prints the summary, not progress", () => {
  async function build(quiet: boolean): Promise<string[]> {
    const lines: string[] = [];
    const argv = ["--offline", "--out", scratch(quiet ? "quiet" : "loud")];
    if (quiet) argv.push("--quiet");
    await runBuild(argv, { log: (message) => lines.push(message) });
    return lines;
  }
  // Started lazily, so a filtered run (`-t`) never leaves a build writing into
  // a temp dir that afterAll has already removed.
  let quietBuild: Promise<string[]> | undefined;
  let loudBuild: Promise<string[]> | undefined;
  const quietRun = () => (quietBuild ??= build(true));
  const loudRun = () => (loudBuild ??= build(false));

  const WARNED = ["us-state-ct", "us-state-ok", "us-state-va"].map(
    (id) => `  ${id}.highest_point_m: `,
  );

  function expectSummary(lines: string[]) {
    expect(lines.filter((l) => l.startsWith("Wrote 50 entities via json → "))).toHaveLength(1);
    expect(lines.filter((l) => l === "3 warning(s):")).toHaveLength(1);
    for (const start of WARNED) {
      expect(lines.filter((l) => l.startsWith(start) && WARNING_LINE.test(l))).toHaveLength(1);
    }
  }

  test("criterion 8: a quiet build emits `Wrote 50 entities via json → …`", async () => {
    const lines = await quietRun();
    expect(lines.some((l) => l.startsWith("Wrote 50 entities via json → "))).toBe(true);
  });

  test("criterion 8: a quiet build emits exactly one `3 warning(s):` and the CT/OK/VA lines", async () => {
    expectSummary(await quietRun());
  });

  test("criterion 9: a quiet build emits no progress line", async () => {
    const lines = await quietRun();
    const rowsReturned = new RegExp(String.raw`row\(s\) returned$`);
    expect(lines.filter((l) => l.startsWith("Reading fixture"))).toEqual([]);
    expect(lines.filter((l) => rowsReturned.test(l))).toEqual([]);
    expect(lines.filter((l) => l.startsWith("Querying query.wikidata.org"))).toEqual([]);
    expect(lines.filter((l) => l.startsWith("Fetching Wikipedia summaries"))).toEqual([]);
    expect(lines.filter((l) => l.startsWith("  wrote "))).toEqual([]);
  });

  test("criterion 10: a non-quiet build emits the summary and both progress lines", async () => {
    const lines = await loudRun();
    expectSummary(lines);
    expect(lines).toContain(`Reading fixture ${MAIN_FIXTURE}`);
    expect(lines).toContain("  50 row(s) returned");
  });

  test("criterion 10: non-quiet output is the quiet output plus only the progress lines", async () => {
    const quiet = await quietRun();
    const loud = await loudRun();
    const progress = loud.filter(
      (l) => l.startsWith("Reading fixture") || l === "  50 row(s) returned",
    );
    expect(progress).toHaveLength(2);
    // The --out dirs differ between the two runs; compare with the path masked.
    const mask = (lines: string[]) =>
      lines.map((l) => (l.startsWith("Wrote ") ? l.replace(/→ .*$/, "→ <out>") : l));
    expect(mask(loud.filter((l) => !progress.includes(l)))).toEqual(mask(quiet));
  });
});

describe("T-083 tester, criterion 11 — --help's --quiet line is unchanged", () => {
  test("`--help` still describes --quiet as `Only print the final summary.`", async () => {
    const printed: string[] = [];
    const log = spyOn(console, "log").mockImplementation((...parts: unknown[]) => {
      printed.push(parts.map(String).join(" "));
    });
    const exit = spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as typeof process.exit);
    try {
      await expect(runBuild(["--help"])).rejects.toThrow("exit 0");
    } finally {
      log.mockRestore();
      exit.mockRestore();
    }
    const quietLines = printed
      .join("\n")
      .split("\n")
      .filter((l) => l.trimStart().startsWith("--quiet"));
    expect(quietLines).toHaveLength(1);
    expect(quietLines[0]?.replace(/^\s*--quiet\s+/, "")).toBe("Only print the final summary.");
  });
});

describe("T-083 tester, criterion 12 — offline-rebuild.ts does not say --quiet prints nothing", () => {
  test("no comment in offline-rebuild.ts says the quiet build prints nothing", () => {
    const text = readFileSync(join(SRC, "offline-rebuild.ts"), "utf8");
    expect(text).not.toMatch(/prints?\s+nothing/i);
    expect(text).not.toMatch(/--quiet`?,?\s+so\s+the\s+build\s+(prints|is)\s+(nothing|silent)/i);
  });
});

describe("T-083 tester, criterion 13 — rebuildOffline (which passes --quiet) still matches the bank", () => {
  test("every tracked data/us-states file is rebuilt byte-identical", () => {
    const names = readdirSync(DATA).filter((n) => n.endsWith(".json"));
    expect(names.length).toBeGreaterThanOrEqual(51);
    const rebuilt = rebuildOffline(BUILD, names, `${PREFIX}bank-`);
    for (const name of names)
      expect(rebuilt.get(name)).toBe(readFileSync(join(DATA, name), "utf8"));
  });
});

// ---------------------------------------------------------------------------
// Criteria 5–7: these turn green only once the approved Test change request
// rows are applied to highest-point-verify.test.ts.
// ---------------------------------------------------------------------------

const HPV = join(SRC, "highest-point-verify.test.ts");

describe("T-083 tester, criterion 5 — the source-grep stand-in is gone", () => {
  test("highest-point-verify.test.ts reads no source text of build.ts", () => {
    const text = readFileSync(HPV, "utf8");
    expect(text).not.toMatch(/readFileSync\(\s*BUILD_SCRIPT/);
    expect(text).not.toContain('indexOf("function report(")');
  });

  test("the `:432` test is deleted, or asserts on rebuildOfflineWithStdout's stdout", () => {
    const text = readFileSync(HPV, "utf8");
    const name = "build.ts's report prints every warning it is given, with no allow-list of fields";
    const at = text.indexOf(name);
    if (at === -1) return; // deleted: criterion met.
    const body = text.slice(at, text.indexOf("\n  });", at));
    expect(body).toContain("rebuildOfflineWithStdout(");
    expect(body).toContain(".stdout");
  });
});

describe("T-083 tester, criterion 6 — no comment says stdout cannot be read in a test", () => {
  const phrases = [
    ["returns written files,", "not"].join(" "),
    ["cannot live here as", "a test"].join(" "),
    ["checked by hand", "and is"].join(" "),
  ];
  // "Across a line break" includes the comment marker that starts the next line.
  const runByHand = new RegExp(["was", "run", "by", "hand"].join(String.raw`(?:\s|\/\/|\*)+`));

  function filesUnder(dir: string): string[] {
    return (readdirSync(dir, { recursive: true }) as string[]).map((rel) => join(dir, rel));
  }

  test("none of the forbidden phrases appears anywhere under question-bank/src/", () => {
    const hits: string[] = [];
    for (const path of filesUnder(SRC)) {
      let text: string;
      try {
        text = readFileSync(path, "utf8");
      } catch {
        continue; // a directory
      }
      for (const phrase of phrases) if (text.includes(phrase)) hits.push(`${path}: ${phrase}`);
      if (runByHand.test(text)) hits.push(`${path}: ${runByHand.source}`);
    }
    expect(hits).toEqual([]);
  });
});

describe("T-083 tester, criterion 7 — no comment pins the full-fixture warning count at 0", () => {
  test("highest-point-verify.test.ts never states the count is, or measured as, 0", () => {
    const text = readFileSync(HPV, "utf8");
    expect(text).not.toMatch(/pinned\s+(at\s+`?0`?|count\s+of\s+`?0`?)/);
    expect(text).not.toMatch(/count\s+of\s+`?0`?\b/);
    expect(text).not.toMatch(/printed\s+no\s+warning\s+line/);
  });
});
