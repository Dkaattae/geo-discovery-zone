import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runBuild, type BuildDeps } from "./build";
import { CURATED_US_STATES, curatedByPostal, entityIdFor } from "./curated/us-states";
import { fixtureTransport } from "./fixture-transport";
import { US_STATES_QUERY } from "./queries/us-states";
import type { SparqlResults, SparqlTransport } from "./sparql";
import type { SummaryTransport } from "./sources/wikipedia";
import type { Entity, FunFact } from "./types";

/**
 * T-078 tester: the live `bun run build` drafts only missing fun facts, and the
 * main fixture's regeneration note names `bun run refresh`.
 *
 * Written from the brief's acceptance criteria, not from the worker's tests.
 * "A live build" is `runBuild` with no `--offline`, `--fixture` or
 * `--no-fun-facts`; its SPARQL is the committed recordings replayed through
 * `fixtureTransport`, and its `SummaryTransport` is a local recorder. No
 * network, no `fetch` stub (criterion 10: run under the six dead proxies).
 */

const PKG = join(import.meta.dirname, "..");
const MAIN_FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");
const REVIEW = "fun-facts.review.json";

/** Snapshot of the curated table before any test here touches it (criterion 11). */
const SNAPSHOT = new Map(
  CURATED_US_STATES.map((s) => [s.postal, { ref: s.fun_facts, json: JSON.stringify(s.fun_facts) }]),
);

const dirs: string[] = [];
afterEach(() => {
  for (const s of CURATED_US_STATES) {
    const orig = SNAPSHOT.get(s.postal)?.ref;
    if (orig === undefined) delete s.fun_facts;
    else s.fun_facts = orig;
  }
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function blank(postal: string) {
  const c = curatedByPostal.get(postal);
  if (!c) throw new Error(`no curated ${postal}`);
  c.fun_facts = [];
}

/** Replays the committed recordings; optionally drops the Wikipedia article for one state label. */
function replay(dropArticleFor?: string): SparqlTransport {
  const inner = fixtureTransport(MAIN_FIXTURE, {});
  return async (query) => {
    const res = await inner(query);
    if (query !== US_STATES_QUERY || !dropArticleFor) return res;
    let dropped = 0;
    const bindings = res.results.bindings.map((row) => {
      if (row["stateLabel"]?.value !== dropArticleFor) return row;
      dropped++;
      const copy = { ...row };
      delete copy["article"];
      return copy;
    });
    if (dropped === 0) throw new Error(`no row for ${dropArticleFor}`);
    return { ...res, results: { bindings } } as SparqlResults;
  };
}

function recorder(throwFor?: string) {
  const titles: string[] = [];
  const transport: SummaryTransport = async (title) => {
    titles.push(title);
    if (title === throwFor) throw new Error(`boom ${title}`);
    return {
      extract: `TESTERDRAFT about ${title} here. A second sentence follows.`,
      url: `https://example.invalid/${encodeURIComponent(title)}`,
    };
  };
  return { titles, transport };
}

async function build(args: string[], deps: BuildDeps) {
  const out = mkdtempSync(join(tmpdir(), "t078-tester-"));
  dirs.push(out);
  const result = await runBuild(["--out", out, "--quiet", ...args], { log: () => {}, ...deps });
  return { out, result };
}

const entityFiles = (out: string) =>
  readdirSync(out).filter((n) => /^us-state-[a-z]{2}\.json$/.test(n));

const titleOf = (entities: Entity[], postal: string) =>
  entities.find((e) => e.id === entityIdFor(postal))?.sources?.wikipedia_title;

describe("T-078 tester — the live fun-fact pass", () => {
  test("criterion 1: all 50 curated → SummaryTransport called zero times", async () => {
    const rec = recorder();
    const { result } = await build([], { sparql: replay(), summary: rec.transport });
    expect(result.entities).toHaveLength(50);
    expect(result.entities.every((e) => (e.fun_facts?.length ?? 0) > 0)).toBe(true);
    expect(rec.titles).toHaveLength(0);
  });

  test("criterion 2: all 50 curated → no fun-facts.review.json in --out", async () => {
    const rec = recorder();
    const { out } = await build([], { sparql: replay(), summary: rec.transport });
    expect(entityFiles(out)).toHaveLength(50);
    expect(existsSync(join(out, REVIEW))).toBe(false);
  });

  test("criterion 3: one missing fact with a title → exactly one call, with that title", async () => {
    blank("WY");
    const rec = recorder();
    const { result } = await build([], { sparql: replay(), summary: rec.transport });
    const title = titleOf(result.entities, "WY");
    expect(title).toBeTruthy();
    expect(rec.titles).toEqual([title as string]);
  });

  test("criterion 4: that draft lands in the review file, one draft, its id, reviewed: false", async () => {
    blank("WY");
    const rec = recorder();
    const { out } = await build([], { sparql: replay(), summary: rec.transport });
    const file = JSON.parse(readFileSync(join(out, REVIEW), "utf8")) as {
      drafts: { id: string; fact: FunFact }[];
    };
    expect(file.drafts).toHaveLength(1);
    expect(file.drafts[0]?.id).toBe(entityIdFor("WY"));
    expect(file.drafts[0]?.fact.reviewed).toBe(false);
  });

  test("criterion 5: the draft never ships — WY's fun_facts is [] and the text is in no entity file", async () => {
    blank("WY");
    const rec = recorder();
    const { out } = await build([], { sparql: replay(), summary: rec.transport });
    const wy = JSON.parse(readFileSync(join(out, `${entityIdFor("WY")}.json`), "utf8")) as Entity;
    expect(wy.fun_facts).toEqual([]);
    const draft = (
      JSON.parse(readFileSync(join(out, REVIEW), "utf8")) as { drafts: { fact: FunFact }[] }
    ).drafts[0]?.fact.text;
    expect(draft).toContain("TESTERDRAFT");
    const files = readdirSync(out).filter((n) => n.endsWith(".json") && n !== REVIEW);
    expect(files.length).toBeGreaterThanOrEqual(50);
    for (const n of files) {
      const text = readFileSync(join(out, n), "utf8");
      expect(text).not.toContain(draft as string);
      expect(text).not.toContain("TESTERDRAFT");
    }
  });

  test("criterion 6: empty fun_facts but no wikipedia_title → zero calls", async () => {
    blank("WY");
    const rec = recorder();
    const { result } = await build([], { sparql: replay("Wyoming"), summary: rec.transport });
    const wy = result.entities.find((e) => e.id === entityIdFor("WY"));
    expect(wy?.fun_facts).toEqual([]);
    expect(wy?.sources?.wikipedia_title).toBeUndefined();
    expect(rec.titles).toHaveLength(0);
  });

  test("criterion 7: a throwing request still resolves, writes 50 entity files, one fun_facts warning for WY", async () => {
    blank("WY");
    const probe = recorder();
    const { result: first } = await build([], { sparql: replay(), summary: probe.transport });
    const title = titleOf(first.entities, "WY") as string;
    expect(title).toBeTruthy();

    const rec = recorder(title);
    const run = build([], { sparql: replay(), summary: rec.transport });
    await expect(run).resolves.toBeDefined();
    const { out, result } = await run;
    expect(entityFiles(out)).toHaveLength(50);
    const ff = result.warnings.filter((w) => w.field === "fun_facts");
    expect(ff).toHaveLength(1);
    expect(ff[0]?.entity).toBe(entityIdFor("WY"));
  });

  test("criterion 8: --states CO,VT with only VT blank → one call, VT's title; never CO's or an outsider's", async () => {
    blank("VT");
    blank("ME"); // outside the subset, also blank: must not be drafted
    const rec = recorder();
    const { result } = await build(["--states", "CO,VT"], {
      sparql: replay(),
      summary: rec.transport,
    });
    expect(result.entities.map((e) => e.id).sort()).toEqual(
      [entityIdFor("CO"), entityIdFor("VT")].sort(),
    );
    const vt = titleOf(result.entities, "VT");
    const co = titleOf(result.entities, "CO");
    expect(vt).toBeTruthy();
    expect(co).toBeTruthy();
    expect(rec.titles).toEqual([vt as string]);
    expect(rec.titles).not.toContain(co as string);
  });

  test("criterion 9: --no-fun-facts with one missing fact → zero calls", async () => {
    blank("WY");
    const rec = recorder();
    const { out } = await build(["--no-fun-facts"], { sparql: replay(), summary: rec.transport });
    expect(rec.titles).toHaveLength(0);
    expect(existsSync(join(out, REVIEW))).toBe(false);
  });

  test("criterion 15: --offline makes zero SummaryTransport calls and writes no review file", async () => {
    blank("WY");
    const rec = recorder();
    const { out } = await build(["--offline"], { summary: rec.transport });
    expect(rec.titles).toHaveLength(0);
    expect(existsSync(join(out, REVIEW))).toBe(false);
    expect(entityFiles(out)).toHaveLength(50);
  });
});

describe("T-078 tester — criterion 11: curated table left as found", () => {
  test("every state's fun_facts is the original array, unchanged in content", () => {
    for (const s of CURATED_US_STATES) {
      const snap = SNAPSHOT.get(s.postal);
      expect(s.fun_facts).toBe(snap?.ref);
      expect(JSON.stringify(s.fun_facts)).toBe(snap?.json as string);
      expect(s.fun_facts?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

/** Key-sorted JSON, so the digest compares content, not key order (deep-equal). */
const canonical = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, canonical((v as Record<string, unknown>)[k])]),
        )
      : v;

describe("T-078 tester — the fixture's regeneration note", () => {
  const raw = JSON.parse(readFileSync(MAIN_FIXTURE, "utf8")) as {
    _fixture: Record<string, unknown>;
  };

  test("criterion 12: _fixture.regenerate_with names `bun run refresh` and not `bun run build`", () => {
    const note = raw._fixture["regenerate_with"];
    expect(typeof note).toBe("string");
    expect(note as string).toContain("bun run refresh");
    expect(note as string).not.toContain("bun run build");
  });

  test("criterion 13: apart from regenerate_with, the parsed fixture deep-equals the default branch's (d71dd8a)", () => {
    const copy = JSON.parse(JSON.stringify(raw)) as typeof raw;
    delete copy._fixture["regenerate_with"];
    // `git show d71dd8a:question-bank/src/fixtures/us-states.sparql.json`, parsed,
    // regenerate_with deleted, key-sorted, JSON.stringify'd, sha256.
    const digest = new Bun.CryptoHasher("sha256")
      .update(JSON.stringify(canonical(copy)))
      .digest("hex");
    expect(digest).toBe("2acd0f046e4cb363ec0f9bac338dd43a061af538c9d540f8f80c88dda01fa360");
  });
});
