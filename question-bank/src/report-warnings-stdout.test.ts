/**
 * T-083 (worker's own checks).
 *
 * Criteria 1–4: T-016 criterion 8 ("a state with no highest point warns, and
 * `build.ts` prints that warning") asserted on the real CLI's stdout, through
 * `rebuildOfflineWithStdout` on a derived fixture — the committed recording is
 * copied, never edited (`test-guidelines.md`, "Fixtures are recordings").
 *
 * Criteria 8–10: `--quiet` does what `--help` says — it drops progress lines
 * but still prints the summary and every warning. Observed in-process through
 * `runBuild(argv, { log })`; the CLI passes no `log`, so those lines are its
 * stdout.
 *
 * This file spawns nothing itself; every subprocess goes through
 * `offline-rebuild.ts` (under `DEAD_PROXY`), and the in-process builds run
 * `--offline`. Nothing mocks `fetch`.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runBuild } from "./build";
import { rebuildOfflineWithStdout } from "./offline-rebuild";

const PKG = resolve(import.meta.dirname, "..");
const BUILD = join(PKG, "src", "build.ts");
const FIXTURES = join(PKG, "src", "fixtures");

const PREFIX = `t083-${process.pid}-`;
const leftovers = () => readdirSync(tmpdir()).filter((n) => n.startsWith(PREFIX));

const temps: string[] = [];
const tempDir = (suffix: string) => {
  const dir = mkdtempSync(join(tmpdir(), `${PREFIX}${suffix}-`));
  temps.push(dir);
  return dir;
};
afterAll(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const CO_CAPITAL = "  us-state-co.capital: missing";
const CO_HIGHEST = "  us-state-co.highest_point: missing";
const WARNING_LINE = /^ {2}[a-z-]+\.[a-z_]+: .+$/;
const HEADER = /^\d+ warning\(s\):$/;

/** The derived fixture: Colorado with no `capitalLabel` and no `highestPoint`. */
function derivedFixture(): string {
  const dir = tempDir("fixture");
  cpSync(
    join(FIXTURES, "us-states-elevation.sparql.json"),
    join(dir, "us-states-elevation.sparql.json"),
  );
  const json = JSON.parse(readFileSync(join(FIXTURES, "us-states.sparql.json"), "utf8")) as {
    results: { bindings: Record<string, { value: string }>[] };
  };
  const co = json.results.bindings.filter((b) => b["stateLabel"]?.value === "Colorado");
  if (co.length !== 1) throw new Error(`expected one Colorado binding, found ${co.length}`);
  const [binding] = co as [Record<string, { value: string }>];
  if (!binding["capitalLabel"] || !binding["highestPoint"])
    throw new Error("committed Colorado binding lacks capitalLabel or highestPoint");
  delete binding["capitalLabel"];
  delete binding["highestPoint"];
  const path = join(dir, "us-states.sparql.json");
  writeFileSync(path, JSON.stringify(json));
  return path;
}

const count = (lines: string[], line: string) => lines.filter((l) => l === line).length;

describe("T-083 criteria 1–3 — a missing highest point is printed on real stdout", () => {
  const derived = rebuildOfflineWithStdout(BUILD, [], `${PREFIX}derived-`, {
    fixture: derivedFixture(),
  }).stdout.split("\n");
  const committed = rebuildOfflineWithStdout(BUILD, [], `${PREFIX}committed-`).stdout.split("\n");

  test("criterion 1: both Colorado lines appear exactly once, after the one header", () => {
    const headers = derived.flatMap((l, i) => (HEADER.test(l) ? [i] : []));
    expect(headers).toHaveLength(1);
    const at = headers[0] as number;
    expect(count(derived, CO_CAPITAL)).toBe(1);
    expect(count(derived, CO_HIGHEST)).toBe(1);
    expect(derived.indexOf(CO_CAPITAL)).toBeGreaterThan(at);
    expect(derived.indexOf(CO_HIGHEST)).toBeGreaterThan(at);
  });

  test("criterion 2: the header's count equals the warning lines that follow it", () => {
    const at = derived.findIndex((l) => HEADER.test(l));
    const n = Number((derived[at] ?? "").split(" ")[0]);
    const following = derived.slice(at + 1).filter((l) => WARNING_LINE.test(l));
    expect(following.length).toBe(n);
  });

  test("criterion 3: the unmodified fixture prints neither Colorado line", () => {
    expect(committed.some((l) => l.startsWith("Wrote 50 entities via json → "))).toBe(true);
    expect(count(committed, CO_CAPITAL)).toBe(0);
    expect(count(committed, CO_HIGHEST)).toBe(0);
  });
});

describe("T-083 criteria 8–10 — --quiet keeps the summary and drops progress", () => {
  const run = async (quiet: boolean) => {
    const lines: string[] = [];
    const argv = ["--offline", "--out", tempDir(quiet ? "quiet" : "loud")];
    if (quiet) argv.push("--quiet");
    const result = await runBuild(argv, { log: (m) => lines.push(m) });
    return { lines, result };
  };

  const expectSummary = (lines: string[]) => {
    expect(lines.some((l) => l.startsWith("Wrote 50 entities via json → "))).toBe(true);
    expect(lines.filter((l) => l === "3 warning(s):")).toHaveLength(1);
    expect(lines.filter((l) => HEADER.test(l))).toEqual(["3 warning(s):"]);
    const keys = lines
      .filter((l) => WARNING_LINE.test(l))
      .map((l) => l.trim().split(":")[0])
      .sort();
    expect(keys).toEqual([
      "us-state-ct.highest_point_m",
      "us-state-ok.highest_point_m",
      "us-state-va.highest_point_m",
    ]);
  };

  test("criterion 8: a quiet build emits the summary and its three warnings", async () => {
    expectSummary((await run(true)).lines);
  });

  test("criterion 9: a quiet build emits no progress line", async () => {
    const { lines } = await run(true);
    expect(lines.filter((l) => l.startsWith("Reading fixture"))).toEqual([]);
    expect(lines.filter((l) => l.endsWith("row(s) returned"))).toEqual([]);
    expect(lines.filter((l) => l.startsWith("Querying query.wikidata.org"))).toEqual([]);
    expect(lines.filter((l) => l.startsWith("Fetching Wikipedia summaries"))).toEqual([]);
  });

  test("criterion 10: without --quiet the summary and the progress lines both appear", async () => {
    const { lines } = await run(false);
    expectSummary(lines);
    expect(lines).toContain(`Reading fixture ${join(FIXTURES, "us-states.sparql.json")}`);
    expect(lines).toContain("  50 row(s) returned");
  });

  test("--quiet does not change what runBuild returns", async () => {
    const quiet = (await run(true)).result;
    const loud = (await run(false)).result;
    expect(JSON.stringify(quiet)).toBe(JSON.stringify(loud));
  });
});

describe("T-083 — housekeeping", () => {
  test("the harness's own temp dirs are gone", () => {
    const harness = leftovers().filter((n) => !temps.some((t) => t.endsWith(n)));
    expect(harness).toEqual([]);
  });
});
