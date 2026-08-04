#!/usr/bin/env bun
/**
 * Build entity records for the 50 US states.
 *
 *   bun run build            # live: query.wikidata.org → data/us-states/
 *   bun run build:sample     # offline: recorded fixture → sample-data/
 *
 * Everything runs at build time and ships as JSON (§1.9): no runtime API calls,
 * no keys in the client, and no Wikipedia vandalism reaching a child mid-quiz.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { normalizeUsStates } from "./normalize";
import { createSink } from "./sinks";
import { createSparqlClient, type SparqlResults, type SparqlTransport } from "./sparql";
import { fetchUsStates } from "./sources/wikidata";
import { createSummaryTransport, fetchFunFact } from "./sources/wikipedia";
import type { Entity, FunFact } from "./types";

interface Args {
  states: string[] | "all";
  out: string;
  sink: "json" | "db";
  offline: boolean;
  fixture: string;
  funFacts: boolean;
  quiet: boolean;
}

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_FIXTURE = join(ROOT, "src/fixtures/us-states.sparql.json");

function parseArgs(argv: string[]): Args {
  const args: Args = {
    states: "all",
    out: join(ROOT, "data/us-states"),
    sink: "json",
    offline: false,
    fixture: DEFAULT_FIXTURE,
    funFacts: true,
    quiet: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    switch (flag) {
      case "--states":
        if (!value) throw new Error("--states needs a value (e.g. CO,VT or all)");
        args.states = value === "all" ? "all" : value.split(",").map((s) => s.trim().toUpperCase());
        i++;
        break;
      case "--out":
        if (!value) throw new Error("--out needs a path");
        args.out = resolve(value);
        i++;
        break;
      case "--sink":
        if (value !== "json" && value !== "db") throw new Error("--sink must be json or db");
        args.sink = value;
        i++;
        break;
      case "--fixture":
        if (!value) throw new Error("--fixture needs a path");
        args.fixture = resolve(value);
        args.offline = true;
        i++;
        break;
      case "--offline":
        args.offline = true;
        break;
      case "--no-fun-facts":
        args.funFacts = false;
        break;
      case "--quiet":
        args.quiet = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      // eslint-disable-next-line no-fallthrough
      default:
        if (flag?.startsWith("--")) throw new Error(`unknown flag: ${flag}`);
    }
  }

  // The offline path has no network at all, so the Wikipedia pass cannot run.
  if (args.offline) args.funFacts = false;
  return args;
}

function printHelp() {
  console.log(`
Build US state entity records from Wikidata.

  --states <CO,VT|all>   Which states to write (default: all). A subset still
                         fetches all 50, but population_rank and area_rank are
                         emitted as null unless every state is in the result.
  --out <dir>            Output directory (default: data/us-states)
  --sink <json|db>       Where entities go (default: json). "db" is the seam
                         for the backend step and is not implemented yet.
  --offline              Replay the recorded fixture instead of calling
                         query.wikidata.org. Implies --no-fun-facts.
  --fixture <path>       Use a specific fixture file (implies --offline).
  --no-fun-facts         Skip the Wikipedia summary pass.
  --quiet                Only print the final summary.
`);
}

/** Replays a recorded SPARQL response through the exact parsing path. */
function fixtureTransport(path: string): SparqlTransport {
  return async () => JSON.parse(await readFile(path, "utf8")) as SparqlResults;
}

/**
 * Unreviewed facts never touch an entity's shippable text. They go to a review
 * file for a human to rewrite in kid language and mark `reviewed: true` (§1.6).
 */
async function writeReviewFile(
  outDir: string,
  drafts: { id: string; name: string; fact: FunFact }[],
): Promise<string> {
  const path = join(outDir, "fun-facts.review.json");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    `${JSON.stringify(
      {
        note: "Draft facts scraped from Wikipedia. Rewrite in kid language, then set reviewed: true. Only reviewed facts ship.",
        generated_at: new Date().toISOString(),
        drafts,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return path;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const log = args.quiet ? () => {} : (message: string) => console.log(message);

  const query = args.offline
    ? fixtureTransport(args.fixture)
    : createSparqlClient({ log: (message) => log(`  ${message}`) });

  log(args.offline ? `Reading fixture ${args.fixture}` : "Querying query.wikidata.org …");
  const rows = await fetchUsStates(query);
  log(`  ${rows.length} row(s) returned`);

  const { entities, warnings, unmatched } = normalizeUsStates(rows, {
    ...(args.states === "all" ? {} : { only: args.states }),
  });

  if (args.funFacts) {
    log("Fetching Wikipedia summaries …");
    const fetchSummary = createSummaryTransport((message) => log(`  ${message}`));
    const drafts: { id: string; name: string; fact: FunFact }[] = [];
    for (const entity of entities) {
      const title = entity.sources?.wikipedia_title;
      if (!title) continue;
      try {
        const fact = await fetchFunFact(title, fetchSummary);
        if (fact) drafts.push({ id: entity.id, name: entity.name, fact });
      } catch (error) {
        warnings.push({ entity: entity.id, field: "fun_facts", message: String(error) });
      }
    }
    if (drafts.length)
      log(`  wrote ${drafts.length} draft(s) → ${await writeReviewFile(args.out, drafts)}`);
  }

  const sink = createSink({ kind: args.sink, outDir: args.out });
  await sink.open();
  await sink.write(entities);
  await sink.close();

  report(entities, warnings, unmatched, args, log);
}

function report(
  entities: Entity[],
  warnings: { entity: string; field: string; message: string }[],
  unmatched: string[],
  args: Args,
  log: (message: string) => void,
) {
  log("");
  log(
    `Wrote ${entities.length} entit${entities.length === 1 ? "y" : "ies"} via ${args.sink} → ${args.out}`,
  );
  if (unmatched.length) {
    log(`Ignored ${unmatched.length} unmatched Wikidata row(s): ${unmatched.join(", ")}`);
  }
  if (warnings.length) {
    log(`${warnings.length} warning(s):`);
    for (const warning of warnings) log(`  ${warning.entity}.${warning.field}: ${warning.message}`);
  }
  const incomplete = entities.filter((e) => !e.capital || !e.centroid || !e.population);
  if (incomplete.length) {
    log(
      `${incomplete.length} entit(ies) missing core fields: ${incomplete.map((e) => e.id).join(", ")}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
