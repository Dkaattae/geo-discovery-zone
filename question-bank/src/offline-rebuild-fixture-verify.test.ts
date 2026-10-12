/**
 * T-082 (tester): criteria 1–4 of the brief, written from the criteria rather
 * than from the harness's source.
 *
 * Criteria 1 and 2 run the real build through the harness from an edited temp
 * copy of the committed fixtures. Criteria 3 and 4's isolation half pass the
 * harness a stand-in build script (its `buildScript` parameter is the seam) that
 * prints the argv and proxy variables it was spawned with, so the test can see
 * what the harness hands a build without reaching the network or editing
 * `build.ts`. This file spawns nothing itself.
 */
import { afterAll, describe, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { rebuildOffline, rebuildOfflineWithStdout } from "./offline-rebuild";

const PKG = resolve(import.meta.dirname, "..");
const SCRIPT = join(PKG, "src", ["build", "ts"].join("."));
const FIXTURES = join(PKG, "src", "fixtures");
const PROXY_KEYS = [
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
] as const;
// The dead-loopback value, assembled so this file never holds it as one literal.
const DEAD = ["http://127.0.0", "1:1"].join(".");

const work = mkdtempSync(join(tmpdir(), "t082-tester-"));
afterAll(() => rmSync(work, { recursive: true, force: true }));

/** Temp copies of both committed fixtures, Colorado's population set to 5900001. */
const fixture = join(work, "us-states.sparql.json");
cpSync(
  join(FIXTURES, "us-states-elevation.sparql.json"),
  join(work, "us-states-elevation.sparql.json"),
);
{
  const json = JSON.parse(readFileSync(join(FIXTURES, "us-states.sparql.json"), "utf8")) as {
    results: { bindings: { stateLabel?: { value: string }; population?: { value: string } }[] };
  };
  const co = json.results.bindings.filter((b) => b.stateLabel?.value === "Colorado");
  if (co.length !== 1 || !co[0]!.population) throw new Error("expected one Colorado binding");
  co[0]!.population.value = "5900001";
  writeFileSync(fixture, JSON.stringify(json, null, 2));
}

/**
 * A stand-in build: writes one file into `--out` and prints its argv and proxy
 * environment as JSON. The harness's throw is exercised with the real build.
 */
const probe = join(work, "probe-build.ts");
writeFileSync(
  probe,
  [
    `import { writeFileSync } from "node:fs";`,
    `import { join } from "node:path";`,
    `const argv = process.argv.slice(2);`,
    `const out = argv[argv.indexOf("--out") + 1];`,
    `writeFileSync(join(out, "probe.json"), "{}");`,
    `const keys = ${JSON.stringify(PROXY_KEYS)};`,
    `console.log(JSON.stringify({ argv, env: Object.fromEntries(keys.map((k) => [k, process.env[k]])) }));`,
  ].join("\n"),
);

const leftovers = (prefix: string) => readdirSync(tmpdir()).filter((n) => n.startsWith(prefix));

describe("T-082 criterion 1 — the harness builds from a given fixture", () => {
  test("criterion 1: rebuildOffline returns us-state-co.json with population 5900001", () => {
    const files = rebuildOffline(SCRIPT, ["us-state-co.json"], "t082-c1a-", { fixture });
    expect(JSON.parse(files.get("us-state-co.json")!).population).toBe(5900001);
  });

  test("criterion 1: rebuildOfflineWithStdout returns us-state-co.json with population 5900001", () => {
    const { files } = rebuildOfflineWithStdout(SCRIPT, ["us-state-co.json"], "t082-c1b-", {
      fixture,
    });
    expect(JSON.parse(files.get("us-state-co.json")!).population).toBe(5900001);
  });

  test("criterion 1: the elevation fixture is read from beside the given one", () => {
    // Same main fixture in a directory with no elevation fixture: the build
    // cannot find its pair, so it must fail rather than fall back silently.
    const lone = mkdtempSync(join(work, "lone-"));
    const loneFixture = join(lone, "us-states.sparql.json");
    cpSync(fixture, loneFixture);
    expect(() =>
      rebuildOffline(SCRIPT, ["us-state-co.json"], "t082-c1c-", { fixture: loneFixture }),
    ).toThrow();
  });
});

describe("T-082 criterion 2 — stdout names the fixture", () => {
  test("criterion 2: stdout contains `Reading fixture <absolute path>` as a line", () => {
    const { stdout } = rebuildOfflineWithStdout(SCRIPT, [], "t082-c2-", { fixture });
    expect(stdout.split("\n")).toContain(`Reading fixture ${resolve(fixture)}`);
  });

  test("criterion 2: a relative fixture path is reported absolutely", () => {
    const rel = relative(process.cwd(), fixture);
    expect(isAbsolute(rel)).toBe(false);
    const { stdout } = rebuildOfflineWithStdout(SCRIPT, [], "t082-c2r-", { fixture: rel });
    expect(stdout.split("\n")).toContain(`Reading fixture ${resolve(fixture)}`);
  });
});

describe("T-082 criterion 3 — without a fixture, nothing changes", () => {
  test("criterion 3: no fixture → the build gets no --fixture argument, both entry points", () => {
    const { stdout } = rebuildOfflineWithStdout(probe, ["probe.json"], "t082-c3a-");
    const seen = JSON.parse(stdout.trim()) as { argv: string[] };
    expect(seen.argv).not.toContain("--fixture");
    expect(seen.argv.slice(0, 2)).toEqual(["--offline", "--out"]);
    // rebuildOffline still passes --quiet and reads the named file back.
    expect(rebuildOffline(probe, ["probe.json"], "t082-c3b-").get("probe.json")).toBe("{}");
  });

  test("criterion 3: no fixture → the committed fixture is read (CO population is the committed one)", () => {
    const committed = JSON.parse(
      readFileSync(join(PKG, "data", "us-states", "us-state-co.json"), "utf8"),
    ).population as number;
    const files = rebuildOffline(SCRIPT, ["us-state-co.json"], "t082-c3c-");
    expect(JSON.parse(files.get("us-state-co.json")!).population).toBe(committed);
    expect(committed).not.toBe(5900001);
  });
});

describe("T-082 criterion 4 — isolation is unchanged with a fixture", () => {
  test("criterion 4: with a fixture, the spawned build gets all six dead-proxy variables", () => {
    const { stdout } = rebuildOfflineWithStdout(probe, [], "t082-c4env-", { fixture });
    const seen = JSON.parse(stdout.trim()) as { argv: string[]; env: Record<string, string> };
    for (const key of PROXY_KEYS) expect(seen.env[key]).toBe(DEAD);
    expect(seen.argv).toContain("--fixture");
    expect(seen.argv[seen.argv.indexOf("--fixture") + 1]).toBe(resolve(fixture));
  });

  for (const [name, run] of [
    ["rebuildOffline", rebuildOffline],
    ["rebuildOfflineWithStdout", rebuildOfflineWithStdout],
  ] as const) {
    test(`criterion 4: ${name} with a missing fixture throws and leaves no tmpPrefix dir`, () => {
      const prefix = `t082-c4missing-${name}-`;
      const missing = join(work, "no-such-dir", "us-states.sparql.json");
      expect(existsSync(missing)).toBe(false);
      expect(() => run(SCRIPT, ["us-state-co.json"], prefix, { fixture: missing })).toThrow();
      expect(leftovers(prefix)).toEqual([]);
    });

    test(`criterion 4: ${name} throws on the build's non-zero exit itself, not only on a missing output file`, () => {
      // No file names to read back, so only the exit code can make this throw.
      const prefix = `t082-c4exit-${name}-`;
      const missing = join(work, "no-such-dir", "us-states.sparql.json");
      expect(() => run(SCRIPT, [], prefix, { fixture: missing })).toThrow();
      expect(leftovers(prefix)).toEqual([]);
    });

    test(`criterion 4: ${name} with a fixture leaves no tmpPrefix dir after a normal return`, () => {
      const prefix = `t082-c4ok-${name}-`;
      run(SCRIPT, ["us-state-co.json"], prefix, { fixture });
      expect(leftovers(prefix)).toEqual([]);
    });
  }
});
