import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Entity, EntitySink } from "../types";

/**
 * One JSON file per entity plus an `index.json`.
 *
 * Per-entity files keep diffs readable — a rebuild that only moves Colorado's
 * population shows one changed file instead of one changed 50-state blob. The
 * app's own lazy-load bundles (§1.3) are a separate, later packaging step; this
 * is the build artifact, not the shipping format.
 */
export class JsonFileSink implements EntitySink {
  readonly name = "json";
  private written: Entity[] = [];

  constructor(private readonly outDir: string) {}

  async open(): Promise<void> {
    await mkdir(this.outDir, { recursive: true });
    this.written = [];
  }

  async write(entities: Entity[]): Promise<void> {
    for (const entity of entities) {
      const path = join(this.outDir, `${entity.id}.json`);
      await writeFile(path, `${JSON.stringify(entity, null, 2)}\n`, "utf8");
      this.written.push(entity);
    }
  }

  async close(): Promise<void> {
    const index = this.written
      .map((entity) => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        scope: entity.scope,
        geometry_id: entity.geometry_id,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    await writeFile(
      join(this.outDir, "index.json"),
      `${JSON.stringify({ count: index.length, entities: index }, null, 2)}\n`,
      "utf8",
    );
  }
}
