/**
 * Minimal SPARQL client for query.wikidata.org.
 *
 * No dependencies — `fetch` plus the two things the endpoint actually demands:
 * a descriptive User-Agent (requests without one are throttled or refused) and
 * backoff on 429/503, which is how the public endpoint sheds load.
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
        const response = await fetch(url, {
          headers: { Accept: "application/sparql-results+json", "User-Agent": userAgent },
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (response.status === 429 || response.status === 503) {
          lastError = new SparqlError(`endpoint busy (${response.status})`, response.status);
          continue;
        }
        if (!response.ok) {
          // 400 means the query itself is wrong — retrying cannot help.
          throw new SparqlError(
            `SPARQL request failed (${response.status})`,
            response.status,
            (await response.text()).slice(0, 500),
          );
        }

        return (await response.json()) as SparqlResults;
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
