import { USER_AGENT } from "../sparql";
import type { FunFact } from "../types";

const SUMMARY_ENDPOINT = "https://en.wikipedia.org/api/rest_v1/page/summary";

export type SummaryTransport = (
  title: string,
) => Promise<{ extract?: string | undefined; url?: string | undefined }>;

/**
 * First 1–2 sentences of the Wikipedia summary (§1.6).
 *
 * These are raw material for a human, never shippable text. Everything this
 * returns is `reviewed: false`, and `build.ts` writes it to a review file rather
 * than into the entity's `funFact` — an unreviewed sentence about a state can be
 * grim, confusing, or written for adults, and none of that should reach a child
 * mid-quiz. `source_url` is kept on every fact so the app can link out and
 * satisfy CC BY-SA attribution.
 */
export function createSummaryTransport(): SummaryTransport {
  return async (title: string) => {
    const response = await fetch(`${SUMMARY_ENDPOINT}/${encodeURIComponent(title)}`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Wikipedia summary failed (${response.status}) for ${title}`);
    const payload = (await response.json()) as {
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
    };
    return { extract: payload.extract, url: payload.content_urls?.desktop?.page };
  };
}

/** Naive but adequate: Wikipedia lead sentences are conventionally punctuated. */
export function firstSentences(extract: string, count = 2): string {
  const sentences = extract.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!sentences) return extract.trim();
  return sentences.slice(0, count).join("").trim();
}

export async function fetchFunFact(
  title: string,
  fetchSummary: SummaryTransport,
): Promise<FunFact | undefined> {
  const { extract, url } = await fetchSummary(title);
  if (!extract) return undefined;
  return {
    text: firstSentences(extract),
    source_url: url ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    reviewed: false,
  };
}
