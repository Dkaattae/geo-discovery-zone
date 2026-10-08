/**
 * T-082 (worker's own checks): both harness entry points accept a main SPARQL
 * fixture, build from it (with the elevation fixture beside it), report every
 * file the build wrote, and keep their isolation and cleanup when given one.
 *
 * Every build here goes through `offline-rebuild.ts`; this file spawns nothing.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { rebuildOffline, rebuildOfflineWithStdout } from "./offline-rebuild";

const PKG = resolve(import.meta.dirname, "..");
const BUILD = join(PKG, "src", "build.ts");
const FIXTURES = join(PKG, "src", "fixtures");
const BANK = join(PKG, "data", "us-states");

interface Binding {
  stateLabel?: { value: string };
  population?: { value: string };
}

/** A temp copy of both committed fixtures, with Colorado's population edited. */
const work = mkdtempSync(join(tmpdir(), "t082-fixture-"));
afterAll(() => rmSync(work, { recursive: true, force: true }));
const fixture = join(work, "us-states.sparql.json");
cpSync(
  join(FIXTURES, "us-states-elevation.sparql.json"),
  join(work, "us-states-elevation.sparql.json"),
);
{
  const json = JSON.parse(readFileSync(join(FIXTURES, "us-states.sparql.json"), "utf8")) as {
    results: { bindings: Binding[] };
  };
  const co = json.results.bindings.find((b) => b.stateLabel?.value === "Colorado");
  if (!co?.population) throw new Error("fixture has no Colorado population binding");
  co.population.value = "5900001";
  writeFileSync(fixture, JSON.stringify(json));
}

const population = (text: string | undefined) =>
  (JSON.parse(text ?? "{}") as { population?: number }).population;

const leftovers = (prefix: string) => readdirSync(tmpdir()).filter((n) => n.startsWith(prefix));

describe("T-082 — the harness builds from a given fixture", () => {
  test("rebuildOffline reads the given fixture", () => {
    const files = rebuildOffline(BUILD, ["us-state-co.json"], "t082-a-", { fixture });
    expect(population(files.get("us-state-co.json"))).toBe(5900001);
  });

  test("rebuildOfflineWithStdout reads it too and says so with the absolute path", () => {
    const { files, stdout } = rebuildOfflineWithStdout(BUILD, ["us-state-co.json"], "t082-b-", {
      fixture,
    });
    expect(population(files.get("us-state-co.json"))).toBe(5900001);
    expect(stdout.split("\n")).toContain(`Reading fixture ${fixture}`);
  });

  test("without a fixture, the committed one is used", () => {
    const files = rebuildOffline(BUILD, ["us-state-co.json"], "t082-c-");
    const committed = readFileSync(join(BANK, "us-state-co.json"), "utf8");
    expect(files.get("us-state-co.json")).toBe(committed);
  });

  test("listing names every file the build wrote, sorted", () => {
    const { listing } = rebuildOfflineWithStdout(BUILD, [], "t082-d-", { fixture });
    const bank = readdirSync(BANK)
      .filter((n) => !n.endsWith(".review.json"))
      .sort();
    expect(listing).toEqual(bank);
  });

  test("a fixture that does not exist throws and leaves no temp dir behind", () => {
    const prefix = `t082-missing-${process.pid}-`;
    const missing = join(work, "no-such.sparql.json");
    expect(() => rebuildOffline(BUILD, ["index.json"], prefix, { fixture: missing })).toThrow();
    expect(() =>
      rebuildOfflineWithStdout(BUILD, ["index.json"], prefix, { fixture: missing }),
    ).toThrow();
    expect(leftovers(prefix)).toEqual([]);
  });

  test("a normal return leaves no temp dir behind", () => {
    const prefix = `t082-ok-${process.pid}-`;
    rebuildOfflineWithStdout(BUILD, [], prefix, { fixture });
    expect(leftovers(prefix)).toEqual([]);
  });
});
