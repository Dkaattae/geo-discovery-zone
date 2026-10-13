import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runBuild, type BuildDeps } from "./build";
import { CURATED_US_STATES, curatedByPostal, entityIdFor } from "./curated/us-states";
import { fixtureTransport } from "./fixture-transport";
import { US_STATES_QUERY } from "./queries/us-states";
import { REVIEW_FILE_NAME } from "./review-file";
import type { SparqlResults, SparqlTransport } from "./sparql";
import type { SummaryTransport } from "./sources/wikipedia";
import type { Entity, FunFact } from "./types";

/**
 * T-078 worker tests: `bun run build`'s live fun-fact pass drafts only what is
 * missing, the same rule `refresh.ts` uses (`draftMissingFunFacts`).
 *
 * Every build here is a live build: no `--offline`, no `--fixture`, no
 * `--no-fun-facts` (except criterion 9, which adds it on purpose). The
 * `SparqlTransport` replays the committed recordings through
 * `fixtureTransport`, and the `SummaryTransport` is a local function that
 * records each title. Nothing reaches the network and `fetch` is not stubbed.
 *
 * An entity gets empty `fun_facts` by blanking its curated entry in-process;
 * `afterEach` puts every original array back (criterion 11).
 */

const PKG = join(import.meta.dirname, "..");
const MAIN_FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");

const ORIGINAL_FUN_FACTS = new Map<string, FunFact[] | undefined>(
  CURATED_US_STATES.map((state) => [state.postal, state.fun_facts]),
);

const temps: string[] = [];
const tempDir = () => {
  const dir = mkdtempSync(join(tmpdir(), "t078-build-"));
  temps.push(dir);
  return dir;
};

afterEach(() => {
  for (const state of CURATED_US_STATES) {
    const original = ORIGINAL_FUN_FACTS.get(state.postal);
    if (original === undefined) delete state.fun_facts;
    else state.fun_facts = original;
  }
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** Blank one state's curated fun facts for the rest of this test. */
function blankFunFacts(postal: string) {
  const curated = curatedByPostal.get(postal);
  if (!curated) throw new Error(`no curated state ${postal}`);
  curated.fun_facts = [];
}

/** The committed recordings, optionally with one state's Wikipedia sitelink removed. */
function recordedTransport(dropArticleFor?: string): SparqlTransport {
  const replay = fixtureTransport(MAIN_FIXTURE, {});
  return async (query) => {
    const response = await replay(query);
    if (query !== US_STATES_QUERY || !dropArticleFor) return response;
    const bindings = response.results.bindings.map((row) => {
      if (row["stateLabel"]?.value !== dropArticleFor) return row;
      const { article: _dropped, ...rest } = row;
      return rest;
    });
    return { ...response, results: { bindings } } as SparqlResults;
  };
}

interface Recorder {
  calls: string[];
  transport: SummaryTransport;
}

function recordingSummary(failFor?: string): Recorder {
  const calls: string[] = [];
  return {
    calls,
    transport: async (title) => {
      calls.push(title);
      if (title === failFor) throw new Error(`summary for ${title} failed`);
      return {
        extract: `DRAFT-${title} is a state with a sentence. It has a second one.`,
        url: `https://example.org/${title}`,
      };
    },
  };
}

async function liveBuild(extraArgs: string[], deps: BuildDeps) {
  const out = tempDir();
  const result = await runBuild(["--out", out, "--quiet", ...extraArgs], {
    log: () => {},
    ...deps,
  });
  return { out, result };
}

/** One `us-state-*.json` per entity; `index.json` and the review file are not entities. */
const entityFiles = (out: string) =>
  readdirSync(out).filter((name) => name.startsWith("us-state-") && name.endsWith(".json"));

const readEntity = (out: string, id: string) =>
  JSON.parse(readFileSync(join(out, `${id}.json`), "utf8")) as Entity;

describe("T-078: the live build drafts only missing fun facts", () => {
  test("criteria 1 and 2: with every state curated, zero requests and no review file", async () => {
    const summary = recordingSummary();
    const { out, result } = await liveBuild([], {
      sparql: recordedTransport(),
      summary: summary.transport,
    });
    expect(result.entities).toHaveLength(50);
    for (const entity of result.entities) expect(entity.fun_facts?.length ?? 0).toBeGreaterThan(0);
    expect(summary.calls).toEqual([]);
    expect(existsSync(join(out, REVIEW_FILE_NAME))).toBe(false);
  });

  test("criteria 3, 4 and 5: one missing fact, one request, one unreviewed draft that never ships", async () => {
    blankFunFacts("VT");
    const summary = recordingSummary();
    const { out, result } = await liveBuild([], {
      sparql: recordedTransport(),
      summary: summary.transport,
    });
    const vt = entityIdFor("VT");
    expect(summary.calls).toEqual(["Vermont"]);

    const review = JSON.parse(readFileSync(join(out, REVIEW_FILE_NAME), "utf8")) as {
      drafts: { id: string; fact: FunFact }[];
    };
    expect(review.drafts).toHaveLength(1);
    expect(review.drafts[0]?.id).toBe(vt);
    expect(review.drafts[0]?.fact.reviewed).toBe(false);

    expect(result.entities).toHaveLength(50);
    expect(readEntity(out, vt).fun_facts).toEqual([]);
    const draftText = review.drafts[0]?.fact.text ?? "";
    expect(draftText).toContain("DRAFT-Vermont");
    const files = entityFiles(out);
    expect(files).toHaveLength(50);
    for (const name of files) {
      expect(readFileSync(join(out, name), "utf8")).not.toContain(draftText);
      expect(readFileSync(join(out, name), "utf8")).not.toContain("DRAFT-");
    }
  });

  test("criterion 6: an entity with empty fun_facts and no wikipedia_title gets no request", async () => {
    blankFunFacts("VT");
    const summary = recordingSummary();
    const { out, result } = await liveBuild([], {
      sparql: recordedTransport("Vermont"),
      summary: summary.transport,
    });
    const vt = result.entities.find((entity) => entity.id === entityIdFor("VT"));
    expect(vt).toBeDefined();
    expect(vt?.fun_facts).toEqual([]);
    expect(vt?.sources).toBeDefined();
    expect(vt?.sources?.wikipedia_title).toBeUndefined();
    expect(summary.calls).toEqual([]);
    expect(existsSync(join(out, REVIEW_FILE_NAME))).toBe(false);
  });

  test("criterion 7: a failed request is a fun_facts warning, and the build still writes all 50", async () => {
    blankFunFacts("VT");
    const summary = recordingSummary("Vermont");
    const { out, result } = await liveBuild([], {
      sparql: recordedTransport(),
      summary: summary.transport,
    });
    expect(summary.calls).toEqual(["Vermont"]);
    expect(entityFiles(out)).toHaveLength(50);
    const funFactWarnings = result.warnings.filter((warning) => warning.field === "fun_facts");
    expect(funFactWarnings).toHaveLength(1);
    expect(funFactWarnings[0]?.entity).toBe(entityIdFor("VT"));
  });

  test("criterion 8: a --states subset requests only the missing state inside it", async () => {
    blankFunFacts("VT");
    // A state outside the subset with a blank fact must not be drafted either.
    blankFunFacts("TX");
    const summary = recordingSummary();
    const { result } = await liveBuild(["--states", "CO,VT"], {
      sparql: recordedTransport(),
      summary: summary.transport,
    });
    expect(result.entities.map((entity) => entity.id).sort()).toEqual([
      entityIdFor("CO"),
      entityIdFor("VT"),
    ]);
    expect(summary.calls).toEqual(["Vermont"]);
  });

  test("criterion 9: --no-fun-facts still skips the pass entirely", async () => {
    blankFunFacts("VT");
    const summary = recordingSummary();
    const { out } = await liveBuild(["--no-fun-facts"], {
      sparql: recordedTransport(),
      summary: summary.transport,
    });
    expect(summary.calls).toEqual([]);
    expect(existsSync(join(out, REVIEW_FILE_NAME))).toBe(false);
  });

  test("criterion 15: the offline build makes no request and writes no review file", async () => {
    blankFunFacts("VT");
    const summary = recordingSummary();
    const { out } = await liveBuild(["--offline"], { summary: summary.transport });
    expect(summary.calls).toEqual([]);
    expect(existsSync(join(out, REVIEW_FILE_NAME))).toBe(false);
  });
});

describe("T-078 criterion 11: the curated table is left as found", () => {
  // Runs after the tests above, each of which blanked a state's fun facts.
  test("every curated state still carries its original fun_facts", () => {
    for (const state of CURATED_US_STATES) {
      expect(state.fun_facts).toBe(ORIGINAL_FUN_FACTS.get(state.postal));
      expect(state.fun_facts?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
