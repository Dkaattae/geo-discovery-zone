#!/usr/bin/env bun
/**
 * T-063: refresh the committed 50-state bank from live Wikidata, in one
 * command, and say what moved.
 *
 *   bun run refresh          # live: query.wikidata.org → data/us-states/ + fixture
 *
 * Exit codes — the monthly routine branches on these, so a failure must never
 * look like "nothing moved":
 *
 *   0  the bank changed; new files are written and the change summary printed
 *   1  the refresh failed (network, a malformed response, fewer than 50 states
 *      matched); nothing is written
 *   2  `bank unchanged`; nothing is written
 *
 * A changed refresh also re-records `src/fixtures/us-states.sparql.json` with
 * the live response it used, and stamps every entity's `sources.built_at` with
 * that fixture's `_fixture.captured_at` — so the offline rebuild that
 * `committed-bank.test.ts` runs reproduces the refreshed bank byte for byte
 * (E-6). `sources.built_at` alone moving is therefore not a change.
 *
 * T-069: a refresh makes a second query, for each highest point's elevation
 * **with its unit** (`queries/us-states-elevation.ts`), and on a changed bank
 * re-records that response too, as `us-states-elevation.sparql.json` beside the
 * main fixture — the file `build.ts --offline` reads `highest_point_m`'s unit
 * from. Both recordings get the same `captured_at`.
 */
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { CURATED_US_STATES, entityIdFor } from "./curated/us-states";
import { elevationFixtureBeside } from "./fixture-transport";
import { normalizeUsStates, type BuildWarning } from "./normalize";
import { US_STATES_QUERY } from "./queries/us-states";
import { US_STATES_ELEVATION_QUERY } from "./queries/us-states-elevation";
import { draftMissingFunFacts, writeReviewFile } from "./review-file";
import { JsonFileSink } from "./sinks/json";
import {
  createSparqlClient,
  WIKIDATA_ENDPOINT,
  type SparqlResults,
  type SparqlTransport,
} from "./sparql";
import { parseUsStates } from "./sources/wikidata";
import { createSummaryTransport, type SummaryTransport } from "./sources/wikipedia";
import type { Entity } from "./types";

const ROOT = resolve(import.meta.dirname, "..");
export const DEFAULT_BANK_DIR = join(ROOT, "data/us-states");
export const DEFAULT_FIXTURE = join(ROOT, "src/fixtures/us-states.sparql.json");

export const EXIT_CHANGED = 0;
export const EXIT_FAILED = 1;
export const EXIT_UNCHANGED = 2;
export type RefreshExitCode = typeof EXIT_CHANGED | typeof EXIT_FAILED | typeof EXIT_UNCHANGED;

export const UNCHANGED_LINE = "bank unchanged";

/** The one field that moves on every refresh and is never a change (criterion 11). */
const IGNORED_PATHS = new Set(["sources.built_at"]);

// ---------------------------------------------------------------------------
// Diffing — pure
// ---------------------------------------------------------------------------

/** A field present on one side only. Printed as `(absent)`, never as `null`. */
export const ABSENT: unique symbol = Symbol("absent");
export type Side = unknown | typeof ABSENT;

export interface FieldChange {
  id: string;
  path: string;
  before: Side;
  after: Side;
}

export interface BankDiff {
  changes: FieldChange[];
  /** File names, e.g. `us-state-co.json`. */
  added: string[];
  removed: string[];
  /** Existing entity files that could not be parsed; rewritten on a changed refresh. */
  unreadable: string[];
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** JSON with sorted keys, so key order alone never reads as a change. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

/**
 * Per-field differences between two entity records. Objects (`sources`) are
 * descended into so the path names the leaf (`sources.wikidata_id`); arrays
 * (`borders`, `centroid`, `top_crops`, `fun_facts`) are compared and shown
 * whole.
 */
export function diffEntity(id: string, before: unknown, after: unknown): FieldChange[] {
  const changes: FieldChange[] = [];
  walk(id, "", before, after, changes);
  return changes;
}

function walk(id: string, path: string, before: Side, after: Side, out: FieldChange[]): void {
  if (IGNORED_PATHS.has(path)) return;
  const bothObjectish =
    (isPlainObject(before) || before === ABSENT) &&
    (isPlainObject(after) || after === ABSENT) &&
    (isPlainObject(before) || isPlainObject(after));
  if (bothObjectish) {
    const b = isPlainObject(before) ? before : {};
    const a = isPlainObject(after) ? after : {};
    const keys = [...Object.keys(a), ...Object.keys(b).filter((key) => !(key in a))];
    for (const key of keys) {
      walk(
        id,
        path ? `${path}.${key}` : key,
        key in b ? b[key] : ABSENT,
        key in a ? a[key] : ABSENT,
        out,
      );
    }
    return;
  }
  if (before === ABSENT && after === ABSENT) return;
  if (before !== ABSENT && after !== ABSENT && canonical(before) === canonical(after)) return;
  out.push({ id, path, before, after });
}

/**
 * The existing bank (file name → raw text) against the new build. An entity
 * file is any `*.json` other than `index.json` and `*.review.json`
 * (criterion 12).
 */
export function diffBank(existing: Map<string, string>, built: Entity[]): BankDiff {
  const diff: BankDiff = { changes: [], added: [], removed: [], unreadable: [] };
  const builtByFile = new Map(built.map((entity) => [`${entity.id}.json`, entity]));

  for (const file of [...builtByFile.keys()].sort()) {
    const raw = existing.get(file);
    if (raw === undefined) {
      diff.added.push(file);
      continue;
    }
    let before: unknown;
    try {
      before = JSON.parse(raw);
    } catch {
      diff.unreadable.push(file);
      continue;
    }
    diff.changes.push(...diffEntity(file.replace(/\.json$/, ""), before, builtByFile.get(file)));
  }
  for (const file of [...existing.keys()].sort()) {
    if (!builtByFile.has(file)) diff.removed.push(file);
  }
  return diff;
}

export const isUnchanged = (diff: BankDiff): boolean =>
  diff.changes.length === 0 &&
  diff.added.length === 0 &&
  diff.removed.length === 0 &&
  diff.unreadable.length === 0;

export const formatSide = (value: Side): string =>
  value === ABSENT ? "(absent)" : (JSON.stringify(value) ?? "undefined");

export const formatChange = (change: FieldChange): string =>
  `${change.id} ${change.path}: ${formatSide(change.before)} → ${formatSide(change.after)}`;

export const isEntityFile = (name: string): boolean =>
  name.endsWith(".json") && name !== "index.json" && !name.endsWith(".review.json");

// ---------------------------------------------------------------------------
// The command
// ---------------------------------------------------------------------------

export interface RefreshOptions {
  bankDir: string;
  fixturePath: string;
  /**
   * Where the elevation-with-unit recording goes (T-069). Defaults to
   * `us-states-elevation.sparql.json` beside `fixturePath`, which is where
   * `build.ts --offline --fixture <fixturePath>` looks for it.
   */
  elevationFixturePath?: string;
  sparql: SparqlTransport;
  /** Omit to skip the Wikipedia draft pass entirely. */
  summary?: SummaryTransport | undefined;
  /** Wall clock, injectable so tests can pin `captured_at`. */
  now?: () => Date;
  /** stdout — the change summary and warnings. */
  out?: (line: string) => void;
  /** stderr — progress and failures. */
  err?: (line: string) => void;
}

async function readBank(dir: string): Promise<Map<string, string>> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Map();
    throw error;
  }
  const files = new Map<string, string>();
  for (const name of names.filter(isEntityFile).sort()) {
    files.set(name, await readFile(join(dir, name), "utf8"));
  }
  return files;
}

async function readFixtureBlock(path: string): Promise<Record<string, unknown>> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
  const parsed = JSON.parse(raw) as { _fixture?: unknown };
  return isPlainObject(parsed._fixture) ? parsed._fixture : {};
}

function assertResults(value: unknown): asserts value is SparqlResults {
  const results = isPlainObject(value) ? value["results"] : undefined;
  if (!isPlainObject(results) || !Array.isArray(results["bindings"])) {
    throw new Error("SPARQL response has no results.bindings array");
  }
}

/** Second precision, matching the `_fixture.captured_at` already committed. */
const stamp = (date: Date): string => date.toISOString().replace(/\.\d{3}Z$/, "Z");

export async function refreshBank(options: RefreshOptions): Promise<RefreshExitCode> {
  const out = options.out ?? ((line: string) => console.log(line));
  const err = options.err ?? ((line: string) => console.error(line));
  const now = options.now ?? (() => new Date());

  // Everything is read and computed before anything is written, so every
  // failure path below leaves the bank and the fixture untouched (criteria 4, 5).
  let existing: Map<string, string>;
  const elevationFixturePath =
    options.elevationFixturePath ?? elevationFixtureBeside(options.fixturePath);
  let fixtureBlock: Record<string, unknown>;
  let elevationBlock: Record<string, unknown>;
  let response: SparqlResults;
  let elevationResponse: SparqlResults;
  try {
    existing = await readBank(options.bankDir);
    fixtureBlock = await readFixtureBlock(options.fixturePath);
    elevationBlock = await readFixtureBlock(elevationFixturePath);
    err("Querying Wikidata …");
    const raw: unknown = await options.sparql(US_STATES_QUERY);
    assertResults(raw);
    response = raw;
    const rawElevation: unknown = await options.sparql(US_STATES_ELEVATION_QUERY);
    assertResults(rawElevation);
    elevationResponse = rawElevation;
  } catch (error) {
    err(`refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    err("nothing was written");
    return EXIT_FAILED;
  }

  const capturedAt = stamp(now());
  // The same conversion `build.ts --offline` applies to `_fixture.captured_at`,
  // so an offline rebuild from the re-recorded fixture is byte-identical (criterion 8).
  const builtAt = new Date(capturedAt).toISOString();
  const { entities, warnings, unmatched } = normalizeUsStates(
    parseUsStates(response, elevationResponse),
    {
      builtAt,
    },
  );

  const builtIds = new Set(entities.map((entity) => entity.id));
  const missing = CURATED_US_STATES.filter((state) => !builtIds.has(entityIdFor(state.postal)));

  printWarnings(warnings, out);
  if (unmatched.length) {
    out(`Ignored ${unmatched.length} unmatched Wikidata row(s): ${unmatched.join(", ")}`);
  }

  if (missing.length) {
    err(
      `refresh failed: the live response matched ${entities.length}/${CURATED_US_STATES.length} states; missing: ${missing
        .map((state) => `${state.name} (${entityIdFor(state.postal)})`)
        .join(", ")}`,
    );
    err("nothing was written");
    return EXIT_FAILED;
  }

  const diff = diffBank(existing, entities);
  if (isUnchanged(diff)) {
    out(UNCHANGED_LINE);
    return EXIT_UNCHANGED;
  }

  // Drafts are only worth requesting once the bank is going to be written; an
  // unchanged run writes nothing at all, review file included (criterion 2).
  let drafts: Awaited<ReturnType<typeof draftMissingFunFacts>>["drafts"] = [];
  if (options.summary) {
    const drafted = await draftMissingFunFacts(entities, options.summary);
    drafts = drafted.drafts;
    printWarnings(drafted.warnings, out);
  }

  try {
    const sink = new JsonFileSink(options.bankDir);
    await sink.open();
    await sink.write(entities);
    await sink.close();
    for (const file of diff.removed) await rm(join(options.bankDir, file), { force: true });

    const { _fixture: _ignored, ...rest } = response as SparqlResults & { _fixture?: unknown };
    const fixture = {
      _fixture: {
        ...fixtureBlock,
        captured_at: capturedAt,
        rows: response.results.bindings.length,
      },
      ...rest,
    };
    await mkdir(resolve(options.fixturePath, ".."), { recursive: true });
    await writeFile(options.fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");

    // The elevation recording the offline build reads `highest_point_m`'s unit
    // from (T-069 criterion 16). Its provenance keys are filled in when there
    // was no previous block to keep, so a fresh directory still gets a
    // recording that says what it is.
    const { _fixture: _ignoredElevation, ...elevationRest } = elevationResponse as SparqlResults & {
      _fixture?: unknown;
    };
    const elevationFixture = {
      _fixture: {
        status: "RECORDED — a real response from query.wikidata.org",
        endpoint: WIKIDATA_ENDPOINT,
        query: "src/queries/us-states-elevation.ts (US_STATES_ELEVATION_QUERY)",
        ...elevationBlock,
        captured_at: capturedAt,
        rows: elevationResponse.results.bindings.length,
      },
      ...elevationRest,
    };
    await mkdir(resolve(elevationFixturePath, ".."), { recursive: true });
    await writeFile(elevationFixturePath, `${JSON.stringify(elevationFixture, null, 2)}\n`, "utf8");

    if (drafts.length) {
      const path = await writeReviewFile(options.bankDir, drafts);
      out(`Wrote ${drafts.length} unreviewed fun-fact draft(s) → ${path}`);
    }
  } catch (error) {
    err(
      `refresh failed while writing — the bank may be partly written; restore it with git: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return EXIT_FAILED;
  }

  printSummary(diff, capturedAt, out);
  return EXIT_CHANGED;
}

function printWarnings(warnings: BuildWarning[], out: (line: string) => void): void {
  if (!warnings.length) return;
  out(`${warnings.length} warning(s):`);
  for (const warning of warnings) out(`  ${warning.entity}.${warning.field}: ${warning.message}`);
}

function printSummary(diff: BankDiff, capturedAt: string, out: (line: string) => void): void {
  const states = new Set(diff.changes.map((change) => change.id));
  out(
    `bank changed (Wikidata read at ${capturedAt}): ${diff.changes.length} field change(s) in ${states.size} state(s), ${diff.added.length} added, ${diff.removed.length} removed`,
  );
  if (diff.changes.length) {
    out("Changed fields (old → new):");
    for (const change of diff.changes) out(`  ${formatChange(change)}`);
  }
  for (const file of diff.added) out(`added: ${file}`);
  for (const file of diff.removed) out(`removed: ${file}`);
  for (const file of diff.unreadable) out(`rewritten (old file was not valid JSON): ${file}`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export interface CliDeps {
  sparql: SparqlTransport;
  summary: SummaryTransport;
  now?: () => Date;
  out?: (line: string) => void;
  err?: (line: string) => void;
}

const HELP = `
Refresh the committed 50-state bank from live Wikidata and print what changed.

  --bank <dir>       Bank directory (default: data/us-states)
  --fixture <path>   Fixture to re-record (default: src/fixtures/us-states.sparql.json)
  --no-fun-facts     Skip the Wikipedia draft pass
  --help             This text

Exit codes: 0 the bank changed and was written; 1 the refresh failed and
nothing was written; 2 "bank unchanged" and nothing was written.
`;

/** Argument parsing plus `refreshBank`; returns the exit code. */
export async function main(argv: string[], deps: CliDeps): Promise<RefreshExitCode> {
  const err = deps.err ?? ((line: string) => console.error(line));
  let bankDir = DEFAULT_BANK_DIR;
  let fixturePath = DEFAULT_FIXTURE;
  let funFacts = true;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    switch (flag) {
      case "--bank":
      case "--fixture":
        if (!value) {
          err(`${flag} needs a path`);
          return EXIT_FAILED;
        }
        if (flag === "--bank") bankDir = resolve(value);
        else fixturePath = resolve(value);
        i++;
        break;
      case "--no-fun-facts":
        funFacts = false;
        break;
      case "--help":
      case "-h":
        (deps.out ?? ((line: string) => console.log(line)))(HELP);
        // Not 0: a routine that misreads `--help` as a run must not open a PR.
        return EXIT_FAILED;
      default:
        err(`unknown argument: ${flag}`);
        return EXIT_FAILED;
    }
  }
  return refreshBank({
    bankDir,
    fixturePath,
    sparql: deps.sparql,
    summary: funFacts ? deps.summary : undefined,
    ...(deps.now ? { now: deps.now } : {}),
    ...(deps.out ? { out: deps.out } : {}),
    err,
  });
}

if (import.meta.main) {
  const progress = (message: string) => console.error(`  ${message}`);
  main(process.argv.slice(2), {
    sparql: createSparqlClient({ log: progress }),
    summary: createSummaryTransport(progress),
  })
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      console.error(`refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(EXIT_FAILED);
    });
}
