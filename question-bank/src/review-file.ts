/**
 * Unreviewed Wikipedia drafts, and the file they land in.
 *
 * Shared by `build.ts` (the original live pass) and `refresh.ts` (T-063). A
 * draft is raw material for a human, never shippable text (§1.6, `CLAUDE.md`
 * "Content rules"): it goes to `fun-facts.review.json` with `reviewed: false`,
 * and never into an entity file.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { BuildWarning } from "./normalize";
import { fetchFunFact, type SummaryTransport } from "./sources/wikipedia";
import type { Entity, FunFact } from "./types";

export interface FunFactDraft {
  id: string;
  name: string;
  fact: FunFact;
}

export const REVIEW_FILE_NAME = "fun-facts.review.json";

/**
 * Unreviewed facts never touch an entity's shippable text. They go to a review
 * file for a human to rewrite in kid language and mark `reviewed: true` (§1.6).
 */
export async function writeReviewFile(outDir: string, drafts: FunFactDraft[]): Promise<string> {
  const path = join(outDir, REVIEW_FILE_NAME);
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

/**
 * T-063 criterion 14: request a draft only for entities whose built
 * `fun_facts` is empty. A state that already carries a curated fact needs no
 * draft — drafting all 50 anyway produces a review file where every entry is
 * already answered, which is noise a reviewer learns to ignore.
 *
 * A failed summary request is a warning, not a failure: drafts are optional
 * raw material, and the bank itself does not depend on them.
 */
export async function draftMissingFunFacts(
  entities: Entity[],
  fetchSummary: SummaryTransport,
): Promise<{ drafts: FunFactDraft[]; warnings: BuildWarning[] }> {
  const drafts: FunFactDraft[] = [];
  const warnings: BuildWarning[] = [];
  for (const entity of entities) {
    if ((entity.fun_facts?.length ?? 0) > 0) continue;
    const title = entity.sources?.wikipedia_title;
    if (!title) continue;
    try {
      const fact = await fetchFunFact(title, fetchSummary);
      if (fact) drafts.push({ id: entity.id, name: entity.name, fact });
    } catch (error) {
      warnings.push({ entity: entity.id, field: "fun_facts", message: String(error) });
    }
  }
  return { drafts, warnings };
}
