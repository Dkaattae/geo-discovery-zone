import type { Entity, EntitySink } from "../types";

/**
 * Placeholder for the backend step.
 *
 * Not implemented on purpose — there is no database yet, and a half-written one
 * would be worse than an explicit gap. What matters now is that the seam exists:
 * `build.ts` only ever sees `EntitySink`, so landing this class is the whole
 * change. No source module, no normalizer, and no CLI flag parsing moves.
 *
 * When the backend lands, the shape to keep:
 *
 * - `open()` acquires the pool and begins a transaction.
 * - `write()` upserts on the natural key `entities.id` (`ON CONFLICT (id) DO
 *   UPDATE`), batched — a rebuild republishes all 50 states and must stay
 *   idempotent, since the build is the source of truth and the table is a cache
 *   of it.
 * - `close()` commits, then releases. A failed build must roll back rather than
 *   leave half a bank live.
 *
 * Two things the JSON sink gets for free that the DB one will not: deletes
 * (an entity dropped from the curated table should not linger in the table —
 * either soft-delete by build id or sweep rows whose `built_at` predates the
 * current run), and schema drift (the JSON files tolerate a new optional field,
 * a table needs a migration first).
 */
export class DbSink implements EntitySink {
  readonly name = "db";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly connectionUrl: string) {}

  async open(): Promise<void> {
    throw new Error(
      "DbSink is not implemented yet — the backend step is planned, not built. Use --sink json.",
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async write(_entities: Entity[]): Promise<void> {
    throw new Error("DbSink is not implemented yet.");
  }

  async close(): Promise<void> {
    throw new Error("DbSink is not implemented yet.");
  }
}
