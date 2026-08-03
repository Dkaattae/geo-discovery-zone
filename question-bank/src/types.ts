/**
 * Entity record shape, per §1.2 of geoquizdataplan.md.
 *
 * This is a superset of `frontend/src/data/types.ts`. The frontend ships the
 * subset it renders today; the builder emits every field it can source, so the
 * app can start reading new ones without a rebuild of the pipeline.
 */

export type EntityType =
  | "state"
  | "country"
  | "city"
  | "landmark"
  | "river"
  | "mountain"
  | "mountain_range"
  | "lake"
  | "ocean";

export type Scope = "us" | "world";

export interface FunFact {
  text: string;
  source_url: string | null;
  /**
   * Only reviewed facts ship (§1.6). The pipeline always writes `false` — a
   * human flips it after reading, which is the one step that cannot be
   * automated for a kids' app.
   */
  reviewed: boolean;
}

export interface Entity {
  id: string;
  type: EntityType;
  scope: Scope;
  name: string;
  capital?: string;
  /** FIPS for US states, ISO 3166-1 alpha-3 for countries. Never join on names. */
  geometry_id?: string;
  region?: string;
  centroid?: [number, number];
  population?: number;
  population_rank?: number | null;
  area_km2?: number;
  area_rank?: number | null;
  /** Entity ids, not names. */
  borders?: string[];
  climate_koppen?: string[];
  climate_kid?: string;
  top_crops?: string[];
  state_animal?: string;
  landmark?: string;
  highest_point?: string;
  highest_point_m?: number;
  fun_facts?: FunFact[];
  /** Provenance, so a field can be traced back to the query that produced it. */
  sources?: EntitySources;
}

export interface EntitySources {
  wikidata_id?: string;
  wikipedia_title?: string;
  built_at: string;
  builder_version: string;
}

/**
 * Where built entities go.
 *
 * JSON files today. A `PostgresSink` (or any DB writer) implements the same
 * three methods and drops into `createSink()` — see `sinks/db.ts`. Nothing in
 * the build pipeline knows which one it is holding, so adding the backend does
 * not touch `build.ts`, `normalize.ts`, or any source module.
 */
export interface EntitySink {
  readonly name: string;
  open(): Promise<void>;
  /** Idempotent upsert keyed on `Entity.id` — safe to re-run a build. */
  write(entities: Entity[]): Promise<void>;
  close(): Promise<void>;
}

export interface BuildOptions {
  /** Postal codes to build, or "all" for the 50 states. */
  states: string[] | "all";
  outDir: string;
  sink: "json" | "db";
  /** Read from a recorded fixture instead of calling query.wikidata.org. */
  offline: boolean;
  /** Skip the Wikipedia summary fetch (§1.6). */
  skipFunFacts: boolean;
}
