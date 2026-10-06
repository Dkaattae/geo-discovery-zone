import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { DEAD_PROXY } from "./offline-rebuild";
import { US_STATES_ELEVATION_QUERY } from "./queries/us-states-elevation";
import {
  ABSENT,
  diffBank,
  diffEntity,
  EXIT_CHANGED,
  EXIT_FAILED,
  EXIT_UNCHANGED,
  formatChange,
  isEntityFile,
  main,
  refreshBank,
} from "./refresh";
import { draftMissingFunFacts, writeReviewFile } from "./review-file";
import { SparqlError, type SparqlResults, type SparqlRow, type SparqlTransport } from "./sparql";
import type { SummaryTransport } from "./sources/wikipedia";
import type { Entity, FunFact } from "./types";

/**
 * T-063 (worker). Everything runs against temporary copies of the committed
 * bank and fixture; the live response is the committed fixture's own SPARQL
 * JSON, fed through `SparqlTransport`, edited per test. No network, no `fetch`
 * mock, no tracked file touched.
 */
const PKG = resolve(import.meta.dirname, "..");
const BANK = join(PKG, "data/us-states");
const FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");
const BUILD_SCRIPT = join(PKG, "src/build.ts");
const NOW = new Date("2026-10-02T12:34:56.789Z");
const CAPTURED_AT = "2026-10-02T12:34:56Z";

let work: string;
let bankDir: string;
let fixturePath: string;
let stdout: string[];
let stderr: string[];
let summaryCalls: string[];

const summary: SummaryTransport = async (title) => {
  summaryCalls.push(title);
  return { extract: `${title} is a place. It has things.`, url: `https://example.org/${title}` };
};

/** The committed fixture's SPARQL response, minus its `_fixture` block, as a fresh copy. */
function liveResponse(): SparqlResults {
  const { _fixture: _drop, ...rest } = JSON.parse(
    readFileSync(FIXTURE, "utf8"),
  ) as SparqlResults & {
    _fixture: unknown;
  };
  return rest;
}

function row(response: SparqlResults, name: string): SparqlRow {
  const found = response.results.bindings.find((b) => b["stateLabel"]?.value === name);
  if (!found) throw new Error(`no row for ${name}`);
  return found;
}

// T-069 (approved test change request, row 8): a refresh makes a second query
// for elevation units; that one is answered with the committed elevation
// recording, any other query with the given response as before.
const ELEVATION_FIXTURE = join(PKG, "src/fixtures/us-states-elevation.sparql.json");
const transportOf =
  (response: SparqlResults): SparqlTransport =>
  async (query) =>
    query === US_STATES_ELEVATION_QUERY
      ? (JSON.parse(readFileSync(ELEVATION_FIXTURE, "utf8")) as SparqlResults)
      : response;

function snapshot(dir: string): Map<string, string> {
  return new Map(readdirSync(dir).map((name) => [name, readFileSync(join(dir, name), "utf8")]));
}

const run = (sparql: SparqlTransport) =>
  refreshBank({
    bankDir,
    fixturePath,
    sparql,
    summary,
    now: () => NOW,
    out: (line) => stdout.push(line),
    err: (line) => stderr.push(line),
  });

const allOutput = () => [...stdout, ...stderr].join("\n");

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), "question-bank-refresh-"));
  bankDir = join(work, "bank");
  fixturePath = join(work, "fixture.sparql.json");
  cpSync(BANK, bankDir, { recursive: true });
  cpSync(FIXTURE, fixturePath);
  stdout = [];
  stderr = [];
  summaryCalls = [];
});

afterEach(() => {
  rmSync(work, { recursive: true, force: true });
});

describe("criteria 1–2 — an unchanged refresh exits 2 and writes nothing", () => {
  test("the committed fixture as the live response: exit 2, `bank unchanged` once, bytes untouched", async () => {
    const bankBefore = snapshot(bankDir);
    const fixtureBefore = readFileSync(fixturePath, "utf8");

    expect(await run(transportOf(liveResponse()))).toBe(EXIT_UNCHANGED);

    expect(stdout.filter((line) => line === "bank unchanged")).toHaveLength(1);
    expect(snapshot(bankDir)).toEqual(bankBefore);
    expect(readFileSync(fixturePath, "utf8")).toBe(fixtureBefore);
    expect(summaryCalls).toEqual([]);
  });

  test("an existing review file and index.json are not entity files", async () => {
    writeFileSync(join(bankDir, "fun-facts.review.json"), "{}\n");
    writeFileSync(join(bankDir, "index.json"), "{}\n");
    expect(await run(transportOf(liveResponse()))).toBe(EXIT_UNCHANGED);
    expect(readFileSync(join(bankDir, "fun-facts.review.json"), "utf8")).toBe("{}\n");
  });
});

describe("criteria 3, 6–9, 11 — a changed refresh", () => {
  async function changedRun() {
    const response = liveResponse();
    const pop = row(response, "Colorado")["population"];
    if (!pop) throw new Error("fixture lost Colorado population");
    pop.value = "5773715"; // +1: no rank moves, so exactly one field changes
    expect(await run(transportOf(response))).toBe(EXIT_CHANGED);
    return response;
  }

  test("exits 0, prints the one change old → new, never `bank unchanged` or built_at", async () => {
    await changedRun();
    const text = allOutput();
    expect(text).not.toContain("bank unchanged");
    expect(stdout).toContain("  us-state-co population: 5773714 → 5773715");
    expect(text).not.toContain("sources.built_at");
    // T-079 (approved test change request, row 11): its three curated
    // highest_point_m overrides print as `  us-state-…` warning lines too, so
    // only lines carrying ` → ` count as changes.
    const entityLines = stdout.filter((line) => line.startsWith("  us-state-"));
    expect(entityLines.filter((line) => line.includes(" → "))).toHaveLength(1);
    const others = entityLines.filter((line) => !line.includes(" → "));
    expect(others.map((line) => line.slice(0, line.indexOf(": ")))).toEqual([
      "  us-state-ct.highest_point_m",
      "  us-state-ok.highest_point_m",
      "  us-state-va.highest_point_m",
    ]);
  });

  test("the fixture is re-recorded, with its _fixture keys kept and captured_at/rows updated", async () => {
    const before = JSON.parse(readFileSync(fixturePath, "utf8")) as {
      _fixture: Record<string, unknown>;
    };
    const response = await changedRun();
    const after = JSON.parse(readFileSync(fixturePath, "utf8")) as SparqlResults & {
      _fixture: Record<string, unknown>;
    };
    expect(after._fixture).toEqual({ ...before._fixture, captured_at: CAPTURED_AT, rows: 50 });
    expect(after.results).toEqual(response.results);
    expect(after.head).toEqual(response.head);
  });

  test("every written built_at is the fixture's captured_at instant", async () => {
    await changedRun();
    for (const name of readdirSync(bankDir).filter(isEntityFile)) {
      const entity = JSON.parse(readFileSync(join(bankDir, name), "utf8")) as Entity;
      expect(new Date(entity.sources?.built_at ?? "").getTime()).toBe(
        new Date(CAPTURED_AT).getTime(),
      );
    }
  });

  test("an offline build from the written fixture reproduces the bank byte for byte", async () => {
    await changedRun();
    const out = join(work, "rebuild");
    const proc = Bun.spawnSync(
      ["bun", BUILD_SCRIPT, "--offline", "--fixture", fixturePath, "--out", out, "--quiet"],
      { env: { ...process.env, ...DEAD_PROXY } },
    );
    expect(proc.exitCode).toBe(0);
    const strip = (m: Map<string, string>) =>
      new Map([...m].filter(([name]) => !name.endsWith(".review.json")));
    expect(strip(snapshot(out))).toEqual(strip(snapshot(bankDir)));
  });
});

describe("criteria 10, 12, 13 — absent fields, added/removed files, warnings", () => {
  test("a dropped capital prints as (absent) and the normalisation warning reaches stdout", async () => {
    const response = liveResponse();
    delete row(response, "Colorado")["capitalLabel"];
    expect(await run(transportOf(response))).toBe(EXIT_CHANGED);
    expect(stdout).toContain('  us-state-co capital: "Denver" → (absent)');
    expect(stdout).toContain("  us-state-co.capital: missing");
  });

  test("a warning that changes no field still prints, on an unchanged run", async () => {
    const response = liveResponse();
    const fips = row(response, "Colorado")["fips"];
    if (!fips) throw new Error("fixture lost Colorado fips");
    fips.value = "99";
    expect(await run(transportOf(response))).toBe(EXIT_UNCHANGED);
    expect(stdout.some((l) => l.startsWith("  us-state-co.geometry_id: Wikidata FIPS 99"))).toBe(
      true,
    );
  });

  test("files are reported added and removed by name; the removed one is deleted", async () => {
    unlinkSync(join(bankDir, "us-state-co.json"));
    writeFileSync(join(bankDir, "us-state-zz.json"), '{"id":"us-state-zz"}\n');
    expect(await run(transportOf(liveResponse()))).toBe(EXIT_CHANGED);
    expect(stdout).toContain("added: us-state-co.json");
    expect(stdout).toContain("removed: us-state-zz.json");
    expect(existsSync(join(bankDir, "us-state-zz.json"))).toBe(false);
    expect(existsSync(join(bankDir, "us-state-co.json"))).toBe(true);
    expect(allOutput()).not.toContain("index.json");
  });
});

describe("criteria 4–5 — failures exit 1 and write nothing", () => {
  async function expectFailureWritesNothing(sparql: SparqlTransport) {
    const bankBefore = snapshot(bankDir);
    const fixtureBefore = readFileSync(fixturePath, "utf8");
    expect(await run(sparql)).toBe(EXIT_FAILED);
    expect(snapshot(bankDir)).toEqual(bankBefore);
    expect(readFileSync(fixturePath, "utf8")).toBe(fixtureBefore);
    expect(allOutput()).not.toContain("bank unchanged");
  }

  test("the transport throws", async () => {
    await expectFailureWritesNothing(async () => {
      throw new SparqlError("SPARQL request failed after 5 attempts: endpoint busy (503)");
    });
    expect(allOutput()).toContain("endpoint busy (503)");
  });

  test("the response has no bindings array", async () => {
    await expectFailureWritesNothing(async () => ({ head: { vars: [] } }) as never);
  });

  test("49 matched states fail and name the missing one", async () => {
    const response = liveResponse();
    response.results.bindings = response.results.bindings.filter(
      (b) => b["stateLabel"]?.value !== "Wyoming",
    );
    await expectFailureWritesNothing(transportOf(response));
    expect(allOutput()).toContain("Wyoming");
  });

  test("50 matched plus an unmatched row still proceeds", async () => {
    const response = liveResponse();
    response.results.bindings.push({
      stateLabel: { type: "literal", value: "District of Columbia" },
    });
    expect(await run(transportOf(response))).toBe(EXIT_UNCHANGED);
  });
});

describe("criterion 14 — fun-fact drafts only where there is no curated fact", () => {
  test("with every state curated, the summary transport is never called on a changed run", async () => {
    const response = liveResponse();
    const pop = row(response, "Vermont")["population"];
    if (!pop) throw new Error("fixture lost Vermont population");
    pop.value = String(Number(pop.value) + 1);
    expect(await run(transportOf(response))).toBe(EXIT_CHANGED);
    expect(summaryCalls).toEqual([]);
    expect(readdirSync(bankDir).filter((n) => n.endsWith(".review.json"))).toEqual([]);
  });

  test("an entity with empty fun_facts gets a reviewed:false draft; a curated one does not", async () => {
    summaryCalls = [];
    const entity = (id: string, facts: FunFact[]): Entity => ({
      id,
      type: "state",
      scope: "us",
      name: id,
      fun_facts: facts,
      sources: { wikipedia_title: id, built_at: "x", builder_version: "x" },
    });
    const { drafts } = await draftMissingFunFacts(
      [entity("Empty", []), entity("Curated", [{ text: "t", source_url: null, reviewed: true }])],
      summary,
    );
    expect(summaryCalls).toEqual(["Empty"]);
    expect(drafts.map((d) => [d.id, d.fact.reviewed])).toEqual([["Empty", false]]);

    const path = await writeReviewFile(work, drafts);
    const written = JSON.parse(readFileSync(path, "utf8")) as { drafts: unknown[] };
    expect(written.drafts).toHaveLength(1);
  });
});

describe("the diff itself", () => {
  test("absent is distinguishable from null, empty string and zero", () => {
    const lines = [null, "", 0].map((v) => formatChange(diffEntity("e", { f: v }, {})[0]!));
    expect(lines).toEqual(["e f: null → (absent)", 'e f: "" → (absent)', "e f: 0 → (absent)"]);
  });

  test("objects are descended into, arrays shown whole, key order ignored", () => {
    expect(
      diffEntity(
        "e",
        { sources: { built_at: "a", wikidata_id: "Q1" }, borders: ["x"], o: { b: 1, a: 2 } },
        { sources: { built_at: "b", wikidata_id: "Q2" }, borders: ["x", "y"], o: { a: 2, b: 1 } },
      ),
    ).toEqual([
      { id: "e", path: "sources.wikidata_id", before: "Q1", after: "Q2" },
      { id: "e", path: "borders", before: ["x"], after: ["x", "y"] },
    ]);
  });

  test("a whole missing sources block never reports built_at", () => {
    const changes = diffEntity("e", {}, { sources: { built_at: "b", wikidata_id: "Q2" } });
    expect(changes).toEqual([
      { id: "e", path: "sources.wikidata_id", before: ABSENT, after: "Q2" },
    ]);
  });

  test("unparseable old files count as a change", () => {
    const diff = diffBank(new Map([["e.json", "{nope"]]), [{ id: "e" } as Entity]);
    expect(diff.unreadable).toEqual(["e.json"]);
  });
});

describe("the CLI entry point", () => {
  test("--bank and --fixture are honoured and the exit code passes through", async () => {
    const code = await main(["--bank", bankDir, "--fixture", fixturePath], {
      sparql: transportOf(liveResponse()),
      summary,
      out: (line) => stdout.push(line),
      err: (line) => stderr.push(line),
    });
    expect(code).toBe(EXIT_UNCHANGED);
    expect(stdout).toContain("bank unchanged");
  });

  test("an unknown argument fails without querying", async () => {
    let queried = false;
    const code = await main(["--bogus"], {
      sparql: async () => {
        queried = true;
        return liveResponse();
      },
      summary,
      err: (line) => stderr.push(line),
    });
    expect(code).toBe(EXIT_FAILED);
    expect(queried).toBe(false);
  });
});
