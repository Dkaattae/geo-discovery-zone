/**
 * T-080 (worker's own checks): `rebuildOfflineWithStdout` returns the files an
 * offline build wrote *and* the real CLI's stdout, so `report()`'s warning
 * lines can be asserted on rather than grepped out of `build.ts`'s source.
 *
 * Every build here goes through `offline-rebuild.ts`; this file spawns nothing
 * itself (the spawn guards in `climate-kid.test.ts` and
 * `top-crops-verify.test.ts` would catch it if it did).
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rebuildOffline, rebuildOfflineWithStdout } from "./offline-rebuild";

const PKG = join(import.meta.dir, "..");
const BUILD = join(PKG, "src", "build.ts");
const MISSING = join(PKG, "src", "t080-no-such-build-script.ts");
const FILES = ["index.json", "us-state-ct.json", "us-state-co.json"];

const leftovers = (prefix: string) => readdirSync(tmpdir()).filter((n) => n.startsWith(prefix));

describe("T-080 — rebuildOfflineWithStdout on the committed fixtures", () => {
  const prefix = `t080-stdout-ok-${process.pid}-`;
  const { files, stdout } = rebuildOfflineWithStdout(BUILD, FILES, prefix);
  const lines = stdout.split("\n");

  test("stdout carries the summary line", () => {
    expect(lines.some((l) => l.startsWith("Wrote 50 entities via json → "))).toBe(true);
  });

  test("exactly one warning header, reading 3 warning(s):", () => {
    const headers = lines.filter((l) => /^\d+ warning\(s\):$/.test(l));
    expect(headers).toEqual(["3 warning(s):"]);
  });

  test("the three lines after it are the three curated highest_point_m overrides", () => {
    const at = lines.indexOf("3 warning(s):");
    const following = lines.slice(at + 1, at + 4);
    for (const line of following) expect(line).toMatch(/^ {2}[^.\s]+\.[^:\s]+: .+$/);
    const pairs = following.map((l) => l.trim().split(":")[0]).sort();
    expect(pairs).toEqual([
      "us-state-ct.highest_point_m",
      "us-state-ok.highest_point_m",
      "us-state-va.highest_point_m",
    ]);
  });

  test("returned files are byte-identical to the tracked data", () => {
    expect([...files.keys()].sort()).toEqual([...FILES].sort());
    for (const name of FILES) {
      const tracked = readFileSync(join(PKG, "data", "us-states", name), "utf8");
      expect({ name, same: files.get(name) === tracked }).toEqual({ name, same: true });
    }
  });

  test("no temp directory with this call's prefix is left behind", () => {
    expect(leftovers(prefix)).toEqual([]);
  });
});

describe("T-080 — both routes throw on a failing build and clean up", () => {
  test("rebuildOfflineWithStdout throws and leaves no temp dir", () => {
    const prefix = `t080-stdout-fail-${process.pid}-`;
    expect(() => rebuildOfflineWithStdout(MISSING, ["index.json"], prefix)).toThrow(
      /offline rebuild exited/,
    );
    expect(leftovers(prefix)).toEqual([]);
  });

  test("rebuildOffline still throws and leaves no temp dir", () => {
    const prefix = `t080-quiet-fail-${process.pid}-`;
    expect(() => rebuildOffline(MISSING, ["index.json"], prefix)).toThrow(/offline rebuild exited/);
    expect(leftovers(prefix)).toEqual([]);
  });

  test("rebuildOffline still returns a Map and leaves no temp dir", () => {
    const prefix = `t080-quiet-ok-${process.pid}-`;
    const files = rebuildOffline(BUILD, ["index.json"], prefix);
    expect(files).toBeInstanceOf(Map);
    expect(files.get("index.json")).toBe(
      readFileSync(join(PKG, "data", "us-states", "index.json"), "utf8"),
    );
    expect(leftovers(prefix)).toEqual([]);
  });
});
