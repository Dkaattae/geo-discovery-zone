/**
 * The offline build's `SparqlTransport`: replays recorded responses instead of
 * calling query.wikidata.org.
 *
 * Since T-069 a build makes two queries — the main one and the
 * elevation-with-unit one — so the replay answers each from its own recording.
 * The elevation recording lives **beside** the main fixture under a fixed name,
 * which is what lets `refresh.ts` re-record both into any directory (a test's
 * temp dir included) and have `build.ts --offline --fixture <that dir>/…` read
 * the matching pair back (criterion 16).
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { US_STATES_QUERY } from "./queries/us-states";
import { US_STATES_ELEVATION_QUERY } from "./queries/us-states-elevation";
import type { SparqlResults, SparqlTransport } from "./sparql";

export const ELEVATION_FIXTURE_NAME = "us-states-elevation.sparql.json";

/** Where the elevation recording that pairs with `mainFixture` lives. */
export const elevationFixtureBeside = (mainFixture: string): string =>
  join(dirname(mainFixture), ELEVATION_FIXTURE_NAME);

/**
 * Replays the main fixture for `US_STATES_QUERY` and its sibling elevation
 * fixture for `US_STATES_ELEVATION_QUERY`; any other query is an error rather
 * than a silently wrong answer. Stashes the **main** fixture's
 * `_fixture.captured_at` into `capture`, which is what the offline build stamps
 * as `built_at` — so the elevation recording's own capture time never moves
 * a bank file.
 */
export function fixtureTransport(
  mainFixture: string,
  capture: { capturedAt?: string | undefined },
): SparqlTransport {
  return async (query) => {
    if (query === US_STATES_ELEVATION_QUERY) {
      return JSON.parse(
        await readFile(elevationFixtureBeside(mainFixture), "utf8"),
      ) as SparqlResults;
    }
    if (query !== US_STATES_QUERY) {
      throw new Error("no recorded fixture for this query");
    }
    const raw = JSON.parse(await readFile(mainFixture, "utf8")) as SparqlResults & {
      _fixture?: { captured_at?: string };
    };
    capture.capturedAt = raw._fixture?.captured_at;
    return raw;
  };
}
