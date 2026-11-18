#!/usr/bin/env bun
/**
 * Download the newest Census city-population release and record, for every
 * state, whether its capital is its largest city. Writes
 * `data/census/largest-city.json`. T-085b reads that file; nothing here changes
 * the question bank.
 *
 *   bun run census                       # newest vintage www2.census.gov has
 *   bun run census --vintage 2024        # one vintage
 *   bun run census --file sub-est2024.csv --vintage 2024   # a file you downloaded
 *
 * Needs a network that reaches www2.census.gov (your machine, or GitHub
 * Actions: `.github/workflows/census-largest-city.yml`). The web sessions'
 * proxy refuses it.
 *
 * The output holds no timestamp, so running it against an unchanged release
 * leaves the file byte-identical and the monthly workflow opens nothing.
 *
 * Exit codes: 0 the file changed, 2 unchanged, 1 failed (nothing written).
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { compareCapitals, placesByState, releaseUrl, type CapitalInput } from "./largest-city";

const ROOT = resolve(import.meta.dir, "../..");
const STATES_DIR = join(ROOT, "data/us-states");
const OUT = join(ROOT, "data/census/largest-city.json");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? undefined : process.argv[i + 1];
}

async function loadCapitals(): Promise<CapitalInput[]> {
  const files = (await readdir(STATES_DIR)).filter((f) => /^us-state-[a-z]{2}\.json$/.test(f));
  const out: CapitalInput[] = [];
  for (const f of files.sort()) {
    const e = JSON.parse(await readFile(join(STATES_DIR, f), "utf8")) as {
      name: string;
      capital?: string;
    };
    if (e.capital) out.push({ state: e.name, capital: e.capital });
  }
  if (out.length !== 50) throw new Error(`expected 50 states with a capital, found ${out.length}`);
  return out;
}

/** Census CSVs are Latin-1 ("Cañon City"); decode them as such. */
function decode(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("latin1");
}

async function download(vintage: number): Promise<ArrayBuffer | null> {
  const res = await fetch(releaseUrl(vintage));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${releaseUrl(vintage)}: HTTP ${res.status}`);
  return res.arrayBuffer();
}

async function main(): Promise<number> {
  const file = arg("file");
  const pinned = arg("vintage");
  let vintage: number;
  let bytes: ArrayBuffer;
  let source: string;

  if (file !== undefined) {
    if (pinned === undefined) throw new Error("--file needs --vintage");
    vintage = Number(pinned);
    const buf = await readFile(file);
    bytes = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    source = releaseUrl(vintage);
  } else {
    const candidates =
      pinned !== undefined
        ? [Number(pinned)]
        : Array.from(
            { length: new Date().getUTCFullYear() - 2020 },
            (_, i) => new Date().getUTCFullYear() - i,
          );
    let found: { v: number; b: ArrayBuffer } | null = null;
    for (const v of candidates) {
      const b = await download(v);
      if (b !== null) {
        found = { v, b };
        break;
      }
    }
    if (found === null) throw new Error(`no release found for vintages ${candidates.join(", ")}`);
    vintage = found.v;
    bytes = found.b;
    source = releaseUrl(vintage);
  }

  const rows = compareCapitals(await loadCapitals(), placesByState(decode(bytes), vintage));
  const record = {
    release: `U.S. Census Bureau, Vintage ${vintage} Population Estimates, incorporated places (sub-est${vintage}.csv)`,
    url: source,
    sha256: createHash("sha256").update(new Uint8Array(bytes)).digest("hex"),
    population_column: `POPESTIMATE${vintage}`,
    rule: "capital is largest = strictly larger than every other incorporated place (SUMLEV 162) in the state",
    states: rows,
  };
  const text = `${JSON.stringify(record, null, 2)}\n`;

  const before = await readFile(OUT, "utf8").catch(() => null);
  if (before === text) {
    console.log(`unchanged: Vintage ${vintage}`);
    return 2;
  }
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, text);
  for (const r of rows) {
    if (r.verdict !== "capital is largest") {
      console.log(
        `${r.state}: ${r.verdict} (${r.capital}; largest other ${r.largest_other_place?.name ?? "—"})`,
      );
    }
  }
  const largest = rows.filter((r) => r.verdict === "capital is largest");
  console.log(`wrote ${OUT}: Vintage ${vintage}, capital is largest in ${largest.length} states`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
