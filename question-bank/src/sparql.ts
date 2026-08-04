/**
 * Minimal SPARQL client for query.wikidata.org.
 *
 * No dependencies — `fetch` plus the two things the endpoint actually demands:
 * a descriptive User-Agent (requests without one are throttled or refused) and
 * backoff on 429/502/503, which is how the public endpoint and the gateway in
 * front of it shed load. All three occur in practice.
 *
 * `httpGet` falls back to curl where `fetch` cannot reach the network at all.
 */

export const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

/**
 * Wikidata's policy asks for contact details so an operator can reach you
 * before blocking you. Point this at the repo when the pipeline runs for real.
 */
export const USER_AGENT =
  "WanderTheAtlas-QuestionBank/0.1 (https://github.com/Dkaattae/geo-discovery-zone)";

export interface SparqlBinding {
  type: "uri" | "literal" | "bnode";
  value: string;
  datatype?: string;
  "xml:lang"?: string;
}

export type SparqlRow = Record<string, SparqlBinding | undefined>;

export interface SparqlResults {
  head: { vars: string[] };
  results: { bindings: SparqlRow[] };
}

/** Swappable so the offline path can replay a fixture through the same code. */
export type SparqlTransport = (query: string) => Promise<SparqlResults>;

export interface SparqlClientOptions {
  endpoint?: string;
  userAgent?: string;
  maxRetries?: number;
  timeoutMs?: number;
  /** Injected by the offline path; defaults to a real HTTP call. */
  transport?: SparqlTransport;
  log?: (message: string) => void;
}

export class SparqlError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "SparqlError";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface HttpResponse {
  status: number;
  body: string;
}

/**
 * GET a URL, falling back to curl when `fetch` cannot reach the network.
 *
 * Bun's fetch cannot negotiate some egress proxies — it fails with "socket
 * connection was closed unexpectedly" before any request is made, and Claude
 * Code's cloud sandbox is a documented case. curl handles the same proxy
 * correctly, so rather than making the pipeline unrunnable in those
 * environments, fall back to it and say so. Set `QUESTION_BANK_NO_CURL=1` to
 * disable the fallback and surface the original error instead.
 *
 * The fallback only triggers on transport failures. An HTTP error response
 * comes back as a normal `HttpResponse` and is handled by the caller.
 */
export async function httpGet(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  log: (message: string) => void = () => {},
): Promise<HttpResponse> {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
    return { status: response.status, body: await response.text() };
  } catch (error) {
    if (process.env["QUESTION_BANK_NO_CURL"] === "1") throw error;
    log(`fetch failed (${String(error)}); retrying through curl`);
    return curlGet(url, headers, timeoutMs);
  }
}

async function curlGet(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<HttpResponse> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const { mkdtemp, readFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const dir = await mkdtemp(join(tmpdir(), "question-bank-"));
  const bodyPath = join(dir, "body");
  try {
    // Body to a file, status code to stdout — keeps the two unambiguous.
    const args = [
      "-sS",
      "-m",
      String(Math.ceil(timeoutMs / 1000)),
      "-o",
      bodyPath,
      "-w",
      "%{http_code}",
    ];
    for (const [name, value] of Object.entries(headers)) args.push("-H", `${name}: ${value}`);
    args.push(url);

    const { stdout } = await promisify(execFile)("curl", args, { maxBuffer: 1 << 20 });
    return { status: Number(stdout.trim()) || 0, body: await readFile(bodyPath, "utf8") };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export function createSparqlClient(options: SparqlClientOptions = {}): SparqlTransport {
  if (options.transport) return options.transport;

  const endpoint = options.endpoint ?? WIKIDATA_ENDPOINT;
  const userAgent = options.userAgent ?? USER_AGENT;
  const maxRetries = options.maxRetries ?? 4;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const log = options.log ?? (() => {});

  return async function query(sparql: string): Promise<SparqlResults> {
    const url = `${endpoint}?${new URLSearchParams({ query: sparql, format: "json" })}`;

    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        // 2s, 4s, 8s, 16s — the endpoint recovers on this timescale.
        const backoff = 2000 * 2 ** (attempt - 1);
        log(`retrying in ${backoff}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await sleep(backoff);
      }

      try {
        const response = await httpGet(
          url,
          { Accept: "application/sparql-results+json", "User-Agent": userAgent },
          timeoutMs,
          log,
        );

        // 429/503 are load shedding and 502 is the gateway ahead of WDQS —
        // all three clear on their own, and all three do happen in practice.
        if (response.status >= 500 || response.status === 429) {
          lastError = new SparqlError(`endpoint busy (${response.status})`, response.status);
          continue;
        }
        if (response.status !== 200) {
          // 400 means the query itself is wrong — retrying cannot help.
          throw new SparqlError(
            `SPARQL request failed (${response.status})`,
            response.status,
            response.body.slice(0, 500),
          );
        }

        return JSON.parse(response.body) as SparqlResults;
      } catch (error) {
        if (error instanceof SparqlError && error.status && error.status < 500) throw error;
        lastError = error;
      }
    }

    throw new SparqlError(
      `SPARQL request failed after ${maxRetries + 1} attempts: ${String(lastError)}`,
    );
  };
}

/** `http://www.wikidata.org/entity/Q1261` → `Q1261`. */
export function qid(binding: SparqlBinding | undefined): string | undefined {
  if (!binding) return undefined;
  const match = /\/entity\/(Q\d+)$/.exec(binding.value);
  return match?.[1];
}

export const text = (binding: SparqlBinding | undefined): string | undefined => binding?.value;

export function num(binding: SparqlBinding | undefined): number | undefined {
  if (!binding) return undefined;
  const parsed = Number(binding.value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** WKT `Point(-105.5 39.0)` → `[lon, lat]`, which is the order d3-geo wants. */
export function point(binding: SparqlBinding | undefined): [number, number] | undefined {
  if (!binding) return undefined;
  const match = /^Point\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)$/i.exec(binding.value.trim());
  if (!match) return undefined;
  const lon = Number(match[1]);
  const lat = Number(match[2]);
  return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : undefined;
}
