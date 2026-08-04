import type { EntitySink } from "../types";
import { DbSink } from "./db";
import { JsonFileSink } from "./json";

export interface SinkConfig {
  kind: "json" | "db";
  outDir: string;
  connectionUrl?: string | undefined;
}

/** The only place that knows which sink is which. */
export function createSink({ kind, outDir, connectionUrl }: SinkConfig): EntitySink {
  if (kind === "db") {
    const url = connectionUrl ?? process.env["DATABASE_URL"];
    if (!url) throw new Error("--sink db needs DATABASE_URL");
    return new DbSink(url);
  }
  return new JsonFileSink(outDir);
}

export { JsonFileSink, DbSink };
