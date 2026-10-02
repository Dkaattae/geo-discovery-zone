/**
 * T-063 tester's suite — written from the brief's acceptance criteria, not from
 * the implementation. Every test runs offline: the SPARQL side is a fake
 * `SparqlTransport` that replays (a modified copy of) the committed recording,
 * the Wikipedia side a counting `SummaryTransport`, and every write goes to a
 * temporary copy of `data/us-states/` and of the fixture (criterion 15).
 *
 * Expected values come from the criteria and from the committed data itself
 * (the old value of a field is read out of the bank copy, the new value is the
 * one the test put into the fake response).
 */
import { afterEach, describe, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { normalizeUsStates } from "./normalize";
import { DEAD_PROXY } from "./offline-rebuild";
import { main, refreshBank } from "./refresh";
import { draftMissingFunFacts, writeReviewFile } from "./review-file";
import type { SparqlResults, SparqlRow, SparqlTransport } from "./sparql";
import { SparqlError } from "./sparql";
import { parseUsStates } from "./sources/wikidata";
import type { SummaryTransport } from "./sources/wikipedia";
import type { Entity } from "./types";

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const BANK = join(PKG, "data/us-states");
const FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");
const BUILD = join(PKG, "src/build.ts");

/** The instant every test refresh "happens" at. */
const NOW = new Date("2026-10-02T12:34:56.000Z");

const temps: string[] = [];
afterEach(() => {
  while (temps.length) rmSync(temps.pop()!, { recursive: true, force: true });
});

interface Sandbox {
  bank: string;
  fixture: string;
}

/** Fresh temp copies of the committed bank and the fixture. */
function sandbox(): Sandbox {
  const dir = mkdtempSync(join(tmpdir(), "t063-verify-"));
  temps.push(dir);
  const bank = join(dir, "bank");
  cpSync(BANK, bank, { recursive: true });
  // Never carry a stray local review file into a test.
  for (const name of readdirSync(bank)) {
    if (name.endsWith(".review.json")) unlinkSync(join(bank, name));
  }
  const fixture = join(dir, "fx", "us-states.sparql.json");
  cpSync(FIXTURE, fixture);
  return { bank, fixture };
}

/** The recorded response, re-read per call, without its `_fixture` block. */
function recording(): SparqlResults {
  const { _fixture: _drop, ...rest } = JSON.parse(
    readFileSync(FIXTURE, "utf8"),
  ) as SparqlResults & {
    _fixture?: unknown;
  };
  return rest as SparqlResults;
}

const label = (row: SparqlRow) => row["stateLabel"]?.value;

/** The recording with one state's binding modified. */
function withRow(name: string, edit: (row: SparqlRow) => SparqlRow): SparqlResults {
  const response = recording();
  response.results.bindings = response.results.bindings.map((row) =>
    label(row) === name ? edit(row) : row,
  );
  return response;
}

const replay =
  (response: SparqlResults): SparqlTransport =>
  async () =>
    structuredClone(response);

/** Snapshot of every file under a directory (relative path → bytes as text). */
function snapshot(dir: string): Map<string, string> {
  const files = new Map<string, string>();
  const visit = (sub: string) => {
    for (const name of readdirSync(join(dir, sub))) {
      const rel = sub ? join(sub, name) : name;
      if (statSync(join(dir, rel)).isDirectory()) visit(rel);
      else files.set(rel, readFileSync(join(dir, rel), "utf8"));
    }
  };
  visit("");
  return files;
}

interface Run {
  code: number;
  out: string[];
  err: string[];
  summaryCalls: string[];
}

async function run(
  box: Sandbox,
  sparql: SparqlTransport,
  summary: SummaryTransport | "counting" = "counting",
): Promise<Run> {
  const out: string[] = [];
  const err: string[] = [];
  const summaryCalls: string[] = [];
  const counting: SummaryTransport = async (title) => {
    summaryCalls.push(title);
    return { extract: `${title} is a place. It has things.`, url: `https://example.org/${title}` };
  };
  const code = await refreshBank({
    bankDir: box.bank,
    fixturePath: box.fixture,
    sparql,
    summary: summary === "counting" ? counting : summary,
    now: () => NOW,
    out: (line) => out.push(line),
    err: (line) => err.push(line),
  });
  return { code, out, err, summaryCalls };
}

const countOf = (lines: string[], exact: string) => lines.filter((line) => line === exact).length;
const anyContains = (lines: string[], text: string) => lines.some((line) => line.includes(text));
type Obj = Record<string, unknown>;
const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8")) as Obj;
/** `at(x, "sources.built_at")` — a dotted lookup into parsed JSON. */
const at = (value: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((v, key) => (v as Obj | undefined)?.[key], value);

// ---------------------------------------------------------------------------
// Criteria 1–2: unchanged
// ---------------------------------------------------------------------------

describe("T-063 criteria 1-2: a refresh that moves nothing but built_at", () => {
  test("criterion 1: exits 2 and prints `bank unchanged` exactly once", async () => {
    const box = sandbox();
    const result = await run(box, replay(recording()));
    expect(result.code).toBe(2);
    expect(countOf(result.out, "bank unchanged")).toBe(1);
  });

  test("criterion 1: the committed built_at differs from the refresh instant, and that alone is not a change", async () => {
    const box = sandbox();
    expect(at(readJson(join(box.bank, "us-state-co.json")), "sources.built_at")).not.toBe(
      NOW.toISOString(),
    );
    expect((await run(box, replay(recording()))).code).toBe(2);
  });

  test("criterion 2: unchanged run leaves bank and fixture byte-identical and creates no file", async () => {
    const box = sandbox();
    const bankBefore = snapshot(box.bank);
    const fixtureBefore = readFileSync(box.fixture, "utf8");
    const fixtureDirBefore = readdirSync(join(box.fixture, ".."));
    await run(box, replay(recording()));
    expect(snapshot(box.bank)).toEqual(bankBefore);
    expect(readFileSync(box.fixture, "utf8")).toBe(fixtureBefore);
    expect(readdirSync(join(box.fixture, ".."))).toEqual(fixtureDirBefore);
    expect(readdirSync(box.bank).some((name) => name.endsWith(".review.json"))).toBe(false);
  });

  test("criteria 1, 12: index.json is not an entity file — a bank missing it is still unchanged", async () => {
    const box = sandbox();
    unlinkSync(join(box.bank, "index.json"));
    const result = await run(box, replay(recording()));
    expect(result.code).toBe(2);
    expect(countOf(result.out, "bank unchanged")).toBe(1);
  });

  test("criteria 1, 14: an existing *.review.json is not a bank change and is left alone", async () => {
    const box = sandbox();
    const review = join(box.bank, "fun-facts.review.json");
    writeFileSync(review, '{"drafts":[]}\n');
    const result = await run(box, replay(recording()));
    expect(result.code).toBe(2);
    expect(readFileSync(review, "utf8")).toBe('{"drafts":[]}\n');
  });
});

// ---------------------------------------------------------------------------
// Criterion 3: changed
// ---------------------------------------------------------------------------

const coPopulation = (value: string) =>
  withRow("Colorado", (row) => ({ ...row, population: { ...row["population"]!, value } }));

describe("T-063 criterion 3: a refresh that moves a field", () => {
  test("exits 0, writes the new value, and does not print `bank unchanged`", async () => {
    const box = sandbox();
    const result = await run(box, replay(coPopulation("5900001")));
    expect(result.code).toBe(0);
    expect(anyContains([...result.out, ...result.err], "bank unchanged")).toBe(false);
    expect(readJson(join(box.bank, "us-state-co.json"))["population"]).toBe(5900001);
  });

  test("an added entity file alone is a change (exit 0)", async () => {
    const box = sandbox();
    unlinkSync(join(box.bank, "us-state-vt.json"));
    const result = await run(box, replay(recording()));
    expect(result.code).toBe(0);
    expect(existsSync(join(box.bank, "us-state-vt.json"))).toBe(true);
    expect(anyContains(result.out, "bank unchanged")).toBe(false);
  });

  test("a removed entity file alone is a change (exit 0)", async () => {
    const box = sandbox();
    writeFileSync(join(box.bank, "us-state-zz.json"), '{"id":"us-state-zz"}\n');
    const result = await run(box, replay(recording()));
    expect(result.code).toBe(0);
    expect(anyContains(result.out, "bank unchanged")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Criteria 4–5: failures
// ---------------------------------------------------------------------------

async function expectFailedAndUntouched(box: Sandbox, sparql: SparqlTransport): Promise<Run> {
  const bankBefore = snapshot(box.bank);
  const fixtureBefore = readFileSync(box.fixture, "utf8");
  const fixtureDirBefore = readdirSync(join(box.fixture, ".."));
  const result = await run(box, sparql);
  expect(result.code).toBe(1);
  expect(snapshot(box.bank)).toEqual(bankBefore);
  expect(readFileSync(box.fixture, "utf8")).toBe(fixtureBefore);
  expect(readdirSync(join(box.fixture, ".."))).toEqual(fixtureDirBefore);
  expect(anyContains([...result.out, ...result.err], "bank unchanged")).toBe(false);
  return result;
}

describe("T-063 criterion 4: a failed SPARQL request", () => {
  test("transport throws (network) → exit 1, nothing written, never `bank unchanged`", async () => {
    await expectFailedAndUntouched(sandbox(), async () => {
      throw new TypeError("socket connection was closed unexpectedly");
    });
  });

  test("non-success after retries (the client's SparqlError) → exit 1, nothing written", async () => {
    await expectFailedAndUntouched(sandbox(), async () => {
      throw new SparqlError("SPARQL request failed after 5 attempts: endpoint busy (503)");
    });
  });

  test("a response with no result bindings → exit 1, nothing written", async () => {
    await expectFailedAndUntouched(
      sandbox(),
      async () => ({ error: "timeout" }) as unknown as SparqlResults,
    );
  });

  test("a failure on a bank that would otherwise be unchanged still exits 1, not 2", async () => {
    // Same bank as the unchanged case; only the transport differs.
    const result = await expectFailedAndUntouched(sandbox(), async () => {
      throw new Error("boom");
    });
    expect(result.code).not.toBe(2);
  });
});

describe("T-063 criterion 5: fewer than all 50 curated states matched", () => {
  test("49 matched → exit 1, nothing written, the missing state named", async () => {
    const response = recording();
    response.results.bindings = response.results.bindings.filter((row) => label(row) !== "Wyoming");
    const result = await expectFailedAndUntouched(sandbox(), replay(response));
    expect(anyContains([...result.out, ...result.err], "Wyoming")).toBe(true);
  });

  test("49 matched on an otherwise unchanged bank still fails rather than reading as unchanged", async () => {
    const response = recording();
    response.results.bindings = response.results.bindings.filter(
      (row) => label(row) !== "Delaware",
    );
    const result = await expectFailedAndUntouched(sandbox(), replay(response));
    expect(anyContains([...result.out, ...result.err], "Delaware")).toBe(true);
  });

  test("two missing → both named", async () => {
    const response = recording();
    response.results.bindings = response.results.bindings.filter(
      (row) => label(row) !== "Ohio" && label(row) !== "Utah",
    );
    const result = await expectFailedAndUntouched(sandbox(), replay(response));
    const all = [...result.out, ...result.err].join("\n");
    expect(all).toContain("Ohio");
    expect(all).toContain("Utah");
  });

  test("exactly 50 matched → proceeds (exit 2 here, since nothing moved)", async () => {
    expect(recording().results.bindings.length).toBe(50);
    expect((await run(sandbox(), replay(recording()))).code).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Criteria 6–8: reproducibility
// ---------------------------------------------------------------------------

describe("T-063 criteria 6-8: a changed refresh stays reproducible offline", () => {
  test("criterion 6: the fixture holds the live response used", async () => {
    const box = sandbox();
    const response = coPopulation("5900001");
    await run(box, replay(response));
    const written = readJson(box.fixture);
    expect(written["head"]).toEqual(response.head);
    expect(written["results"]).toEqual(response.results);
  });

  test("criterion 6: captured_at names the refresh instant; rows = bindings written; other _fixture keys kept", async () => {
    const box = sandbox();
    const oldBlock = readJson(FIXTURE)["_fixture"] as Record<string, unknown>;
    const response = coPopulation("5900001");
    // An extra non-state binding, so `rows` must track the response rather
    // than stay at the old 50.
    response.results.bindings.push({
      stateLabel: { type: "literal", value: "Atlantis" },
      state: { type: "uri", value: "http://www.wikidata.org/entity/Q999999999" },
    });
    await run(box, replay(response));
    const block = readJson(box.fixture)["_fixture"] as Record<string, unknown>;
    expect(Math.abs(Date.parse(block["captured_at"] as string) - NOW.getTime())).toBeLessThan(1000);
    expect(block["rows"]).toBe(51);
    expect((at(readJson(box.fixture), "results.bindings") as unknown[]).length).toBe(51);
    for (const key of Object.keys(oldBlock)) {
      if (key === "captured_at" || key === "rows") continue;
      expect(block[key]).toEqual(oldBlock[key]);
    }
  });

  test("criterion 7: every written entity's built_at is the fixture's captured_at instant", async () => {
    const box = sandbox();
    await run(box, replay(coPopulation("5900001")));
    const capturedAt = Date.parse(at(readJson(box.fixture), "_fixture.captured_at") as string);
    const entityFiles = readdirSync(box.bank).filter(
      (name) => name.endsWith(".json") && name !== "index.json" && !name.endsWith(".review.json"),
    );
    expect(entityFiles.length).toBe(50);
    for (const name of entityFiles) {
      expect(Date.parse(at(readJson(join(box.bank, name)), "sources.built_at") as string)).toBe(
        capturedAt,
      );
    }
  });

  test("criterion 8: build.ts --offline from the written fixture reproduces the bank byte for byte", async () => {
    const box = sandbox();
    // A removal too, so the rebuild must not resurrect a deleted file.
    writeFileSync(join(box.bank, "us-state-zz.json"), '{"id":"us-state-zz"}\n');
    expect((await run(box, replay(coPopulation("5900001")))).code).toBe(0);

    const out = mkdtempSync(join(tmpdir(), "t063-verify-rebuild-"));
    temps.push(out);
    const proc = Bun.spawnSync(
      ["bun", BUILD, "--offline", "--fixture", box.fixture, "--out", out, "--quiet"],
      { env: { ...process.env, ...DEAD_PROXY } },
    );
    expect(proc.exitCode).toBe(0);

    const strip = (files: Map<string, string>) =>
      new Map([...files].filter(([name]) => !name.endsWith(".review.json")));
    const bank = strip(snapshot(box.bank));
    const rebuilt = strip(snapshot(out));
    expect([...rebuilt.keys()].sort()).toEqual([...bank.keys()].sort());
    for (const [name, text] of bank) expect(rebuilt.get(name)).toBe(text);
  });
});

// ---------------------------------------------------------------------------
// Criteria 9–13: the change summary
// ---------------------------------------------------------------------------

describe("T-063 criterion 9: one line per changed field", () => {
  test("names the entity id, the field path, the old and the new value", async () => {
    const box = sandbox();
    const old = readJson(join(box.bank, "us-state-co.json"))["population"] as number;
    const result = await run(box, replay(coPopulation("5900001")));
    const lines = result.out.filter(
      (line) => line.includes("us-state-co") && /\bpopulation\b(?!_)/.test(line),
    );
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain(String(old));
    expect(lines[0]).toContain("5900001");
    expect(lines[0]!.indexOf(String(old))).toBeLessThan(lines[0]!.indexOf("5900001"));
  });

  test("a nested field is named by its path (sources.wikidata_id)", async () => {
    const box = sandbox();
    // Old value read from the bank: Colorado's QID.
    const oldQid = at(
      readJson(join(box.bank, "us-state-co.json")),
      "sources.wikidata_id",
    ) as string;
    const response = withRow("Colorado", (row) => ({
      ...row,
      state: { type: "uri", value: "http://www.wikidata.org/entity/Q424242" },
    }));
    const result = await run(box, replay(response));
    expect(result.code).toBe(0);
    const line = result.out.find(
      (l) => l.includes("us-state-co") && l.includes("sources.wikidata_id"),
    );
    expect(line).toBeDefined();
    expect(line).toContain(oldQid);
    expect(line).toContain("Q424242");
  });

  test("an array field (top_crops via an edited old bank) is reported with both sides", async () => {
    const box = sandbox();
    const path = join(box.bank, "us-state-co.json");
    const entity = readJson(path);
    const now = entity["top_crops"] as string[];
    entity["top_crops"] = ["turnips"];
    writeFileSync(path, `${JSON.stringify(entity, null, 2)}\n`);
    const result = await run(box, replay(recording()));
    expect(result.code).toBe(0);
    const line = result.out.find((l) => l.includes("us-state-co") && l.includes("top_crops"));
    expect(line).toBeDefined();
    expect(line).toContain("turnips");
    for (const crop of now) expect(line).toContain(crop);
  });

  test("only the changed field is reported for an unchanged neighbour field", async () => {
    const box = sandbox();
    const result = await run(box, replay(coPopulation("5900001")));
    // Colorado's capital did not move; no line may claim it did.
    expect(result.out.some((l) => l.includes("us-state-co") && /\bcapital\b/.test(l))).toBe(false);
  });
});

describe('T-063 criterion 10: absent is distinguishable from null, "" and 0', () => {
  test("the old-side rendering of absent differs from null, empty string and zero", async () => {
    const box = sandbox();
    const set = (file: string, mutate: (e: Obj) => void) => {
      const path = join(box.bank, file);
      const entity = readJson(path);
      mutate(entity);
      writeFileSync(path, `${JSON.stringify(entity, null, 2)}\n`);
    };
    // Same field, four old states; the new build has the real capital in each.
    set("us-state-co.json", (e) => delete e["capital"]);
    set("us-state-ut.json", (e) => (e["capital"] = null));
    set("us-state-wy.json", (e) => (e["capital"] = ""));
    set("us-state-nm.json", (e) => (e["capital"] = 0));
    const result = await run(box, replay(recording()));
    expect(result.code).toBe(0);

    const oldSide = (id: string, newCapital: string) => {
      const line = result.out.find((l) => l.includes(id) && /\bcapital\b/.test(l));
      expect(line).toBeDefined();
      const start = line!.indexOf("capital") + "capital".length;
      return line!.slice(start, line!.lastIndexOf(newCapital));
    };
    const absent = oldSide("us-state-co", "Denver");
    const sides = [
      absent,
      oldSide("us-state-ut", "Salt Lake City"),
      oldSide("us-state-wy", "Cheyenne"),
      oldSide("us-state-nm", "Santa Fe"),
    ];
    expect(new Set(sides).size).toBe(4);
  });

  test("a field present before and absent after is reported, and the new side reads differently from null", async () => {
    const box = sandbox();
    const add = (file: string, value: unknown) => {
      const path = join(box.bank, file);
      const entity = readJson(path);
      entity["retired_field"] = value;
      writeFileSync(path, `${JSON.stringify(entity, null, 2)}\n`);
    };
    add("us-state-co.json", "x");
    add("us-state-ut.json", null);
    const result = await run(box, replay(recording()));
    const co = result.out.find((l) => l.includes("us-state-co") && l.includes("retired_field"));
    const ut = result.out.find((l) => l.includes("us-state-ut") && l.includes("retired_field"));
    expect(co).toBeDefined();
    expect(ut).toBeDefined();
    // UT goes null → absent: if absent printed as null the two sides would read the same.
    const tail = ut!.slice(ut!.indexOf("retired_field") + "retired_field".length);
    expect(tail.split("null").length - 1).toBe(1);
  });
});

describe("T-063 criterion 11: sources.built_at is never a change line", () => {
  test("on a changed refresh every built_at moves, and no output line mentions it", async () => {
    const box = sandbox();
    const result = await run(box, replay(coPopulation("5900001")));
    expect(result.code).toBe(0);
    expect(anyContains(result.out, "built_at")).toBe(false);
  });

  test("not even when the old file's sources block lacks built_at", async () => {
    const box = sandbox();
    const path = join(box.bank, "us-state-co.json");
    const entity = readJson(path);
    delete (entity["sources"] as Obj)["built_at"];
    writeFileSync(path, `${JSON.stringify(entity, null, 2)}\n`);
    const result = await run(box, replay(recording()));
    expect(anyContains(result.out, "built_at")).toBe(false);
    // And with nothing else moved, that is no change at all.
    expect(result.code).toBe(2);
  });
});

describe("T-063 criterion 12: added and removed entity files", () => {
  test("a file present before but not built is reported removed by name and deleted", async () => {
    const box = sandbox();
    writeFileSync(join(box.bank, "us-state-zz.json"), '{"id":"us-state-zz"}\n');
    const result = await run(box, replay(recording()));
    expect(result.code).toBe(0);
    const line = result.out.find((l) => l.includes("us-state-zz"));
    expect(line).toBeDefined();
    expect(line!.toLowerCase()).toContain("removed");
    expect(existsSync(join(box.bank, "us-state-zz.json"))).toBe(false);
  });

  test("a file built but not present before is reported added by name", async () => {
    const box = sandbox();
    unlinkSync(join(box.bank, "us-state-vt.json"));
    const result = await run(box, replay(recording()));
    const line = result.out.find((l) => l.includes("us-state-vt"));
    expect(line).toBeDefined();
    expect(line!.toLowerCase()).toContain("added");
  });

  test("index.json and *.review.json are never reported as added or removed", async () => {
    const box = sandbox();
    unlinkSync(join(box.bank, "index.json"));
    writeFileSync(join(box.bank, "other.review.json"), "{}\n");
    unlinkSync(join(box.bank, "us-state-vt.json")); // force the changed path
    const result = await run(box, replay(recording()));
    expect(result.code).toBe(0);
    expect(anyContains(result.out, "index.json")).toBe(false);
    expect(anyContains(result.out, "other.review")).toBe(false);
  });
});

describe("T-063 criterion 13: normalisation warnings reach stdout", () => {
  const warningLines = (response: SparqlResults) =>
    normalizeUsStates(parseUsStates(structuredClone(response)), {
      builtAt: NOW.toISOString(),
    }).warnings.map((w) => `${w.entity}.${w.field}: ${w.message}`);

  test("a FIPS mismatch and an implausible area each appear in stdout", async () => {
    const response = withRow("Colorado", (row) => ({
      ...row,
      fips: { type: "literal", value: "99" },
      area: { ...row["area"]!, value: "0.5" },
    }));
    const expected = warningLines(response);
    expect(expected.some((w) => w.startsWith("us-state-co.geometry_id"))).toBe(true);
    expect(expected.some((w) => w.startsWith("us-state-co.area_km2"))).toBe(true);
    const result = await run(sandbox(), replay(response));
    const stdout = result.out.join("\n");
    for (const warning of expected) expect(stdout).toContain(warning);
  });

  test("warnings appear on an unchanged run too (FIPS mismatch keeps the curated value)", async () => {
    const response = withRow("Colorado", (row) => ({
      ...row,
      fips: { type: "literal", value: "99" },
    }));
    const expected = warningLines(response);
    expect(expected.length).toBeGreaterThan(0);
    const result = await run(sandbox(), replay(response));
    const stdout = result.out.join("\n");
    for (const warning of expected) expect(stdout).toContain(warning);
  });
});

// ---------------------------------------------------------------------------
// Criterion 14: fun-fact drafts
// ---------------------------------------------------------------------------

function findReviewFiles(dir: string): string[] {
  return [...snapshot(dir).keys()].filter((name) => name.endsWith(".review.json"));
}

describe("T-063 criterion 14: drafts only for entities with no fun_facts", () => {
  test("with the curated table, a changed refresh calls the SummaryTransport zero times and writes no review file", async () => {
    const box = sandbox();
    const result = await run(box, replay(coPopulation("5900001")));
    expect(result.code).toBe(0);
    expect(result.summaryCalls).toEqual([]);
    expect(findReviewFiles(join(box.bank, ".."))).toEqual([]);
  });

  test("an unchanged refresh calls it zero times too", async () => {
    const box = sandbox();
    const result = await run(box, replay(recording()));
    expect(result.summaryCalls).toEqual([]);
    expect(findReviewFiles(join(box.bank, ".."))).toEqual([]);
  });

  const built = (): Entity[] =>
    normalizeUsStates(parseUsStates(recording()), { builtAt: NOW.toISOString() }).entities;

  test("the drafting step requests a draft for exactly the entities whose fun_facts is empty", async () => {
    const entities = built();
    const bare = new Set(["us-state-co", "us-state-vt"]);
    for (const entity of entities) if (bare.has(entity.id)) entity.fun_facts = [];
    const calls: string[] = [];
    const { drafts } = await draftMissingFunFacts(entities, async (title) => {
      calls.push(title);
      return { extract: `${title} is a state. It is nice.`, url: `https://example.org/${title}` };
    });
    expect(calls.sort()).toEqual(["Colorado", "Vermont"]);
    expect(drafts.map((d) => d.id).sort()).toEqual(["us-state-co", "us-state-vt"]);
    for (const draft of drafts) expect(draft.fact.reviewed).toBe(false);
    // Never into the entity itself.
    for (const entity of entities) if (bare.has(entity.id)) expect(entity.fun_facts).toEqual([]);
  });

  test("with every entity carrying a fact, the drafting step makes zero requests", async () => {
    const entities = built();
    expect(entities.every((e) => (e.fun_facts?.length ?? 0) > 0)).toBe(true);
    let calls = 0;
    const { drafts } = await draftMissingFunFacts(entities, async () => {
      calls++;
      return { extract: "x." };
    });
    expect(calls).toBe(0);
    expect(drafts).toEqual([]);
  });

  test("a draft lands reviewed:false in a *.review.json file, not an entity file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "t063-verify-review-"));
    temps.push(dir);
    const entities = built().filter((e) => e.id === "us-state-co");
    entities[0]!.fun_facts = [];
    const { drafts } = await draftMissingFunFacts(entities, async (title) => ({
      extract: `${title} is high. Very high.`,
    }));
    const path = await writeReviewFile(dir, drafts);
    expect(path.endsWith(".review.json")).toBe(true);
    const review = readJson(path);
    expect((review["drafts"] as unknown[]).length).toBe(1);
    expect(at((review["drafts"] as unknown[])[0], "fact.reviewed")).toBe(false);
    expect(readdirSync(dir)).toEqual([path.slice(dir.length + 1)]);
  });
});

// ---------------------------------------------------------------------------
// The CLI entry and criterion 16
// ---------------------------------------------------------------------------

describe("T-063 CLI: main() honours --bank and --fixture", () => {
  test("main --bank <copy> --fixture <copy> on an unchanged response exits 2", async () => {
    const box = sandbox();
    const out: string[] = [];
    const code = await main(["--bank", box.bank, "--fixture", box.fixture], {
      sparql: replay(recording()),
      summary: async () => ({}),
      now: () => NOW,
      out: (l) => out.push(l),
      err: () => {},
    });
    expect(code).toBe(2);
    expect(countOf(out, "bank unchanged")).toBe(1);
  });

  test("main writes only to the paths it was given on a changed response", async () => {
    const box = sandbox();
    const trackedBank = snapshot(BANK);
    const trackedFixture = readFileSync(FIXTURE, "utf8");
    const code = await main(["--bank", box.bank, "--fixture", box.fixture, "--no-fun-facts"], {
      sparql: replay(coPopulation("5900001")),
      summary: async () => {
        throw new Error("must not be called with --no-fun-facts");
      },
      now: () => NOW,
      out: () => {},
      err: () => {},
    });
    expect(code).toBe(0);
    expect(snapshot(BANK)).toEqual(trackedBank);
    expect(readFileSync(FIXTURE, "utf8")).toBe(trackedFixture);
  });
});

describe("T-063 criterion 16: the command is documented", () => {
  test("package.json has a refresh script", () => {
    const pkg = readJson(join(PKG, "package.json"));
    expect(typeof at(pkg, "scripts.refresh")).toBe("string");
  });

  test("README documents `bun run refresh` and all three exit codes", () => {
    const readme = readFileSync(join(PKG, "README.md"), "utf8");
    expect(readme).toContain("bun run refresh");
    for (const code of ["`0`", "`1`", "`2`"]) expect(readme).toContain(code);
    expect(readme).toContain("bank unchanged");
  });

  test("conventions.md names `bun run refresh` in its Commands section", () => {
    const conventions = readFileSync(join(REPO, "conventions.md"), "utf8");
    const start = conventions.indexOf("## Commands");
    const commands = conventions.slice(start, conventions.indexOf("\n## ", start + 1));
    expect(commands).toContain("bun run refresh");
  });
});
