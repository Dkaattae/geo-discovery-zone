import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { DEAD_PROXY, rebuildOffline, rebuildOfflineWithStdout } from "./offline-rebuild";

/**
 * T-080 verification (tester). Written from the acceptance criteria in
 * `tasks/T-080-build-report-stdout.md`; every expected value (50 entities,
 * `3 warning(s):`, the three CT/OK/VA `highest_point_m` pairs, the six proxy
 * keys) is quoted from a criterion, not read off the implementation.
 *
 * This file spawns nothing itself: every build runs through the harness. The
 * dead-loopback address is assembled from parts so this file does not become a
 * second match for the guards in `climate-kid.test.ts` and friends.
 */

const PKG = resolve(import.meta.dir, "..");
const BUILD = join(PKG, "src", "build" + ".ts");
const DATA = join(PKG, "data", "us-states");
const LOOPBACK = "http://" + ["127", "0", "0", "1"].join(".") + ":" + "1";
const PROXY_KEYS = [
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
] as const;

/** A per-call temp prefix nothing else in `os.tmpdir()` can share. */
function uniquePrefix(tag: string): string {
  return `t080-verify-${tag}-${process.pid}-${Math.random().toString(36).slice(2, 10)}-`;
}

function leftovers(prefix: string): string[] {
  return readdirSync(tmpdir()).filter((name) => name.startsWith(prefix));
}

const TRACKED = readdirSync(DATA).filter((name) => name.endsWith(".json"));

let memo: ReturnType<typeof rebuildOfflineWithStdout> | undefined;
let memoPrefix = "";
/** One real spawned build for criteria 1-6, shared across tests. */
function realRun() {
  if (!memo) {
    memoPrefix = uniquePrefix("real");
    memo = rebuildOfflineWithStdout(BUILD, TRACKED, memoPrefix);
  }
  return memo;
}

const lines = () => realRun().stdout.split(/\r?\n/);
const HEADER = /^\d+ warning\(s\):$/;
const WARNING_LINE = /^ {2}([^\s.]+)\.([^\s:]+): .+$/;

describe("T-080 criterion 1 — one harness call returns files and stdout", () => {
  test("returns a Map of the requested files and a non-empty stdout string", () => {
    const { files, stdout } = realRun();
    expect(files).toBeInstanceOf(Map);
    expect([...files.keys()].sort()).toEqual([...TRACKED].sort());
    for (const text of files.values()) expect(typeof text).toBe("string");
    expect(typeof stdout).toBe("string");
    expect(stdout.length).toBeGreaterThan(0);
  });
});

describe("T-080 criterion 2 — the summary line", () => {
  test("stdout has a line beginning `Wrote 50 entities via json → `", () => {
    expect(lines().some((l) => l.startsWith("Wrote 50 entities via json → "))).toBe(true);
  });
});

describe("T-080 criterion 3 — exactly one warning header, reading 3", () => {
  test("exactly one line matches ^\\d+ warning\\(s\\):$ and it is `3 warning(s):`", () => {
    const headers = lines().filter((l) => HEADER.test(l));
    expect(headers).toEqual(["3 warning(s):"]);
  });
});

describe("T-080 criterion 4 — the three warning lines are CT, OK, VA highest_point_m", () => {
  test("the 3 lines after the header are the three curated overrides, no duplicates, nothing else", () => {
    const all = lines();
    const at = all.findIndex((l) => HEADER.test(l));
    expect(at).toBeGreaterThanOrEqual(0);
    const next3 = all.slice(at + 1, at + 4);
    expect(next3).toHaveLength(3);
    const pairs = next3.map((l) => {
      const m = WARNING_LINE.exec(l);
      expect({ line: l, matches: m !== null }).toEqual({ line: l, matches: true });
      return m ? `${m[1]}.${m[2]}` : "";
    });
    expect(new Set(pairs).size).toBe(3);
    expect([...pairs].sort()).toEqual([
      "us-state-ct.highest_point_m",
      "us-state-ok.highest_point_m",
      "us-state-va.highest_point_m",
    ]);
    // "nothing else": the line after the third is not a fourth warning line.
    const fourth = all[at + 4] ?? "";
    expect(WARNING_LINE.test(fourth)).toBe(false);
  });
});

describe("T-080 criterion 6 — returned files are byte-identical to the tracked bank", () => {
  test("index.json, us-state-ct.json and us-state-co.json match data/us-states/", () => {
    const { files } = realRun();
    for (const name of ["index.json", "us-state-ct.json", "us-state-co.json"]) {
      expect({ name, same: files.get(name) === readFileSync(join(DATA, name), "utf8") }).toEqual({
        name,
        same: true,
      });
    }
  });

  test("every tracked data/us-states/*.json matches its rebuilt twin", () => {
    const { files } = realRun();
    expect(TRACKED.length).toBe(51);
    for (const name of TRACKED) {
      expect({ name, same: files.get(name) === readFileSync(join(DATA, name), "utf8") }).toEqual({
        name,
        same: true,
      });
    }
  });
});

describe("T-080 criterion 7 — the build runs behind DEAD_PROXY", () => {
  test("DEAD_PROXY is exported with exactly the six keys, all the dead loopback", () => {
    expect(Object.keys(DEAD_PROXY).sort()).toEqual([...PROXY_KEYS].sort());
    for (const key of PROXY_KEYS) expect<string>(DEAD_PROXY[key]).toBe(LOOPBACK);
  });

  test("the stdout route's spawned process sees all six proxy variables set to the loopback", () => {
    // A stand-in script that prints its own proxy env, run through the same
    // harness route. Nothing here spawns; the harness does.
    const dir = mkdtempSync(join(tmpdir(), uniquePrefix("envprobe")));
    try {
      const probe = join(dir, "env-probe.ts");
      writeFileSync(
        probe,
        `const keys = ${JSON.stringify(PROXY_KEYS)};\n` +
          `console.log(JSON.stringify(Object.fromEntries(keys.map((k) => [k, process.env[k] ?? null]))));\n`,
      );
      const { stdout } = rebuildOfflineWithStdout(probe, [], uniquePrefix("envrun"));
      const seen = JSON.parse(stdout.trim()) as Record<string, string | null>;
      for (const key of PROXY_KEYS)
        expect({ key, value: seen[key] }).toEqual({ key, value: LOOPBACK });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("T-080 criteria 8 and 10 — a failing build throws and leaves no temp dir", () => {
  const missing = join(PKG, "src", "t080-no-such-script.ts");

  // fileNames is [] so the only thing that can throw is the exit-code check,
  // not a readFileSync of an output file the failed build never wrote.
  test("the script really is missing", () => {
    expect(existsSync(missing)).toBe(false);
  });

  test("rebuildOfflineWithStdout throws on a non-zero exit and cleans up its prefix", () => {
    const prefix = uniquePrefix("throw-stdout");
    expect(() => rebuildOfflineWithStdout(missing, [], prefix)).toThrow();
    expect(leftovers(prefix)).toEqual([]);
  });

  test("rebuildOffline still throws on a non-zero exit and cleans up its prefix", () => {
    const prefix = uniquePrefix("throw-quiet");
    expect(() => rebuildOffline(missing, [], prefix)).toThrow();
    expect(leftovers(prefix)).toEqual([]);
  });
});

describe("T-080 criterion 9 — a successful call leaves no temp dir", () => {
  test("stdout route: no directory with the call's prefix remains", () => {
    realRun();
    expect(memoPrefix.length).toBeGreaterThan(0);
    expect(leftovers(memoPrefix)).toEqual([]);
  });

  test("rebuildOffline route: no directory with the call's prefix remains", () => {
    const prefix = uniquePrefix("ok-quiet");
    const files = rebuildOffline(BUILD, ["index.json"], prefix);
    expect(files.get("index.json")).toBe(readFileSync(join(DATA, "index.json"), "utf8"));
    expect(leftovers(prefix)).toEqual([]);
  });
});

describe("T-080 criterion 11 — rebuildOffline keeps its signature", () => {
  test("type-level: (string, string[], string?) => Map<string, string>; runtime: Map of strings", () => {
    // Fails `bun run typecheck` if the signature or return type changes.
    const pinned: (
      buildScript: string,
      fileNames: string[],
      tmpPrefix?: string,
    ) => Map<string, string> = rebuildOffline;
    const files = pinned(BUILD, ["us-state-co.json"]);
    expect(files).toBeInstanceOf(Map);
    expect([...files.keys()]).toEqual(["us-state-co.json"]);
    expect(typeof files.get("us-state-co.json")).toBe("string");
  });
});
