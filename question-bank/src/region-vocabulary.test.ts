import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";

/**
 * T-017 verification (tester). Written from the brief's acceptance criteria in
 * `tasks/T-017-region-vocabulary.md`, not from the implementation: every
 * expected value below is copied out of a criterion's own wording — the 13
 * vocabulary strings from criterion 1, the 15 anchor pairs from criterion 3,
 * `E-9` from criterion 7.
 *
 * Criterion 4 asks for a test rather than for code ("a test fails if any
 * `region` value ... is not one of the 13"), and the worker's Handoff left it
 * for this session deliberately. That is the right split under `process.md`
 * step 4 — the criteria become the tests, written by the session that did not
 * do the work — so the closed-set check lives here, over all three sources the
 * criterion names. `backend/app/data/content.json` is additionally checked
 * from the backend's own suite (`backend/tests/test_region_vocabulary.py`),
 * where it ships from.
 *
 * Nothing here reaches the network or spawns anything: every assertion reads a
 * committed file off disk.
 */

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");
const CURATED_SRC = join(PKG, "src/curated/us-states.ts");
const CONTENT_JSON = join(REPO, "backend/app/data/content.json");
const DECISIONS = join(REPO, "engineering-decisions.md");

/** Criterion 1's closed set, verbatim. */
const VOCABULARY = [
  "Great Basin",
  "Great Lakes",
  "Great Plains",
  "Mountain West",
  "New England",
  "Northeast",
  "Pacific",
  "Pacific Northwest",
  "Pacific West",
  "South Central",
  "Southeast",
  "Southwest",
  "Upper Midwest",
];

/**
 * The eight values the curated table carried before this task, read off the
 * pre-task revision of `curated/us-states.ts` when these tests were written.
 * Criterion 1 singles out `Midwest`; it is the only one of the eight that is
 * not also a member of the 13.
 */
const OLD_EIGHT = [
  "Midwest",
  "Mountain West",
  "Northeast",
  "Pacific",
  "Pacific Northwest",
  "South Central",
  "Southeast",
  "Southwest",
];

/** Criterion 3's 15 anchor pairs, verbatim. */
const ANCHORS: Record<string, string> = {
  Colorado: "Mountain West",
  Florida: "Southeast",
  Texas: "South Central",
  Alaska: "Pacific Northwest",
  Hawaii: "Pacific",
  Maine: "New England",
  Michigan: "Great Lakes",
  Louisiana: "South Central",
  California: "Pacific West",
  "New York": "Northeast",
  Arizona: "Southwest",
  Kansas: "Great Plains",
  Washington: "Pacific Northwest",
  Minnesota: "Upper Midwest",
  Nevada: "Great Basin",
};

interface Offender {
  where: string;
  value: unknown;
}

/**
 * Walks any JSON-ish value and collects every `region` it finds that is not in
 * the vocabulary. Returning *where* as well as *what* is deliberate: a bare
 * boolean would make the failure message useless, and a bare count would make
 * it impossible to tell two bad states from one.
 */
function regionOffenders(node: unknown, where: string): Offender[] {
  if (Array.isArray(node)) {
    return node.flatMap((item, index) => regionOffenders(item, `${where}[${index}]`));
  }
  if (node !== null && typeof node === "object") {
    const record = node as Record<string, unknown>;
    const found: Offender[] = [];
    for (const [key, value] of Object.entries(record)) {
      if (key === "region" && value !== null && value !== undefined) {
        if (typeof value !== "string" || !VOCABULARY.includes(value)) {
          found.push({ where: `${where}.region`, value });
        }
        continue;
      }
      found.push(...regionOffenders(value, `${where}.${key}`));
    }
    return found;
  }
  return [];
}

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

/** Every tracked built state file, by postal code, straight off disk. */
function builtStateFiles(): { file: string; entity: Record<string, unknown> }[] {
  return CURATED_US_STATES.map((state) => {
    const file = `us-state-${state.postal.toLowerCase()}.json`;
    return { file, entity: readJson(join(DATA_DIR, file)) as Record<string, unknown> };
  });
}

/** The file's leading block comment — criterion 2's "one place". */
function headerComment(source: string): string {
  const end = source.indexOf("*/");
  expect(source.startsWith("/**")).toBe(true);
  expect(end).toBeGreaterThan(0);
  return source.slice(0, end + 2);
}

// -- criterion 1 -------------------------------------------------------------

describe("T-017 criterion 1 — every curated state's region is one of the 13", () => {
  test("the curated table still carries all 50 states", () => {
    expect(CURATED_US_STATES).toHaveLength(50);
  });

  test("no curated region falls outside the closed 13-value set", () => {
    const outside = CURATED_US_STATES.filter((state) => !VOCABULARY.includes(state.region)).map(
      (state) => `${state.name}=${state.region}`,
    );
    expect(outside).toEqual([]);
  });

  test("no state carries `Midwest`, anywhere in the curated table", () => {
    const midwest = CURATED_US_STATES.filter((state) => state.region === "Midwest").map(
      (state) => state.name,
    );
    expect(midwest).toEqual([]);
  });

  test("no state carries an old eight-region value that is not also one of the 13", () => {
    const stale = OLD_EIGHT.filter((value) => !VOCABULARY.includes(value));
    expect(stale).toEqual(["Midwest"]); // the criterion's own "in particular"
    const survivors = CURATED_US_STATES.filter((state) => stale.includes(state.region)).map(
      (state) => `${state.name}=${state.region}`,
    );
    expect(survivors).toEqual([]);
  });

  test("the vocabulary is genuinely in use — every one of the 13 is spendable, none is a typo'd near-miss", () => {
    // Not "all 13 are used": the criterion does not require that, and three of
    // them are one-state categories by design. What it does mean is that every
    // *used* value matches a vocabulary entry exactly, case and spacing
    // included, which `includes` above already enforces — so assert the
    // complement here: the distinct set in use is a subset of the 13.
    const used = [...new Set(CURATED_US_STATES.map((state) => state.region))].sort();
    expect(used.filter((value) => !VOCABULARY.includes(value))).toEqual([]);
    expect(used.length).toBeGreaterThan(0);
  });
});

// -- criterion 2 -------------------------------------------------------------

describe("T-017 criterion 2 — the 13-value set is written down once, in a comment", () => {
  const source = readFileSync(CURATED_SRC, "utf8");
  const header = headerComment(source);

  for (const value of VOCABULARY) {
    test(`the header comment names \`${value}\``, () => {
      expect(header).toContain(value);
    });
  }

  test("the vocabulary sits alongside the file's existing provenance comments", () => {
    expect(header).toContain("top_crops");
    expect(header).toContain("highest_point");
    expect(header).toContain("region");
  });

  test("the comment no longer claims the values match the frontend's", () => {
    // The stale claim this task exists to kill, per the brief's Goal.
    expect(source).not.toContain("match the values already in the frontend");
  });
});

// -- criterion 3 (curated side) ---------------------------------------------

describe("T-017 criterion 3 — the curated table agrees with the 15 served anchors", () => {
  // `content.json` itself is asserted from the backend suite; here the point is
  // that the pipeline would not re-break the vocabulary the served bank fixes.
  for (const [name, region] of Object.entries(ANCHORS)) {
    test(`${name} is \`${region}\` in both content.json and the curated table`, () => {
      const content = readJson(CONTENT_JSON) as { entities: { name: string; region: string }[] };
      const served = content.entities.find((entity) => entity.name === name);
      expect(served?.region).toBe(region);

      const curated = CURATED_US_STATES.find((state) => state.name === name);
      expect(curated?.region).toBe(region);
    });
  }
});

// -- criterion 4 -------------------------------------------------------------

describe("T-017 criterion 4 — a region outside the 13 fails a test, wherever it lives", () => {
  test("no region in the curated table is outside the 13", () => {
    const offenders = regionOffenders(
      CURATED_US_STATES as unknown,
      "question-bank/src/curated/us-states.ts",
    );
    expect(offenders).toEqual([]);
  });

  test("no region in the built us-state-*.json files is outside the 13", () => {
    const offenders = builtStateFiles().flatMap(({ file, entity }) =>
      regionOffenders(entity, `question-bank/data/us-states/${file}`),
    );
    expect(offenders).toEqual([]);
  });

  test("all 50 built files were checked, not an empty directory", () => {
    const files = builtStateFiles();
    expect(files).toHaveLength(50);
    const withRegion = files.filter(({ entity }) => typeof entity["region"] === "string");
    expect(withRegion).toHaveLength(50);
  });

  test("no region in backend/app/data/content.json is outside the 13", () => {
    const offenders = regionOffenders(readJson(CONTENT_JSON), "backend/app/data/content.json");
    expect(offenders).toEqual([]);
  });

  test("content.json's questions carry regions too, and they were checked", () => {
    const content = readJson(CONTENT_JSON) as { questions: { region?: string }[] };
    const regions = content.questions.map((question) => question.region).filter(Boolean);
    expect(regions.length).toBeGreaterThan(0);
    expect(regions.filter((value) => !VOCABULARY.includes(value as string))).toEqual([]);
  });

  test("each built file's region is the curated value for that state", () => {
    const drift = builtStateFiles()
      .map(({ file, entity }, index) => ({
        file,
        built: entity["region"],
        curated: CURATED_US_STATES[index]!.region,
      }))
      .filter((row) => row.built !== row.curated);
    expect(drift).toEqual([]);
  });

  test("the closed-set check actually rejects a bad value — otherwise it proves nothing", () => {
    // Anti-tautology guard: the same collector, run over a deliberately
    // corrupted copy of each source, must report exactly the injected value.
    expect(regionOffenders([{ name: "Ohio", region: "Midwest" }], "curated")).toEqual([
      { where: "curated[0].region", value: "Midwest" },
    ]);
    expect(regionOffenders({ region: "mountain-west" }, "built")).toEqual([
      { where: "built.region", value: "mountain-west" },
    ]);
    expect(regionOffenders({ entities: [{ region: "Great lakes" }] }, "content")).toEqual([
      { where: "content.entities[0].region", value: "Great lakes" },
    ]);
    expect(regionOffenders({ questions: [{ region: 7 }] }, "content")).toEqual([
      { where: "content.questions[0].region", value: 7 },
    ]);
  });
});

// -- criterion 6 -------------------------------------------------------------

describe("T-017 criterion 6 — each pinned-digest guard gained a region neutralisation", () => {
  // The guards passing is what criterion 6 actually asks, and that is proved by
  // running them (they are four separate suites). What is asserted here is the
  // structural half the criterion also names: each carries a region
  // neutralisation *and* a test that the neutralisation really strips the
  // field, in the shape the brief's Constraints point at.
  const GUARDS = [
    "landmarks-verify.test.ts",
    "climate-kid-verify.test.ts",
    "top-crops-verify.test.ts",
    "highest-point-verify.test.ts",
  ];

  for (const guard of GUARDS) {
    test(`${guard} neutralises region before hashing`, () => {
      const source = readFileSync(join(PKG, "src", guard), "utf8");
      expect(source).toContain("region");
      const neutralises = /withoutRegion|delete parsed\["region"\]|delete .*\.region/.test(source);
      expect(neutralises).toBe(true);
    });

    test(`${guard} proves its own region neutralisation is not a no-op`, () => {
      const source = readFileSync(join(PKG, "src", guard), "utf8");
      expect(source).toMatch(/region removal actually drops/);
    });
  }
});

// -- criterion 7 -------------------------------------------------------------

describe("T-017 criterion 7 — engineering-decisions.md records the choice as E-9", () => {
  const decisions = readFileSync(DECISIONS, "utf8");
  const headings = [...decisions.matchAll(/^## (E-\d+) — (.+)$/gm)];

  test("an E-9 entry exists", () => {
    const ids = headings.map((match) => match[1]);
    expect(ids).toContain("E-9");
  });

  test("E-9 is the next number — no other entry claims it, and none is higher", () => {
    const numbers = headings.map((match) => Number(match[1]!.slice(2)));
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(Math.max(...numbers)).toBe(9);
  });

  test("the entries run in ascending order, so E-9 is the last block in the file", () => {
    // Criterion 7 says "next number"; a next number filed above its
    // predecessor is only half of that, and the first round of this task did
    // exactly that (E-9 landed between E-7 and E-8).
    const numbers = headings.map((match) => Number(match[1]!.slice(2)));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    expect(numbers.at(-1)).toBe(9);
    expect(decisions.slice(decisions.indexOf("## E-9 —"))).not.toContain("\n## E-");
  });

  test("E-9 says which vocabulary won and why", () => {
    const start = decisions.indexOf("## E-9 —");
    const rest = decisions.slice(start + 1);
    const next = rest.indexOf("\n## ");
    const entry = next === -1 ? rest : rest.slice(0, next);
    expect(entry).toContain("thirteen");
    expect(entry).toContain("eight");
    expect(entry).toContain("content.json");
    // E-7 and E-8's shape, which criterion 7 says to mirror.
    expect(entry).toMatch(/Revisit when/);
  });
});

// -- criterion 8 -------------------------------------------------------------

describe("T-017 criterion 8 — no new dependency, no network", () => {
  test("question-bank declares no runtime dependency and the same two devDependencies as before this task", () => {
    // The literal set read off the pre-task revision (f5b2382) when these tests
    // were written, so adding anything here fails rather than being absorbed.
    const manifest = readJson(join(PKG, "package.json")) as Record<string, unknown>;
    expect(manifest["dependencies"]).toBeUndefined();
    expect(Object.keys(manifest["devDependencies"] as object).sort()).toEqual([
      "@types/bun",
      "typescript",
    ]);
  });

  test("no question-bank test file calls the network directly", () => {
    // `sparql.ts` is the one module that may call `fetch`, behind the
    // `SparqlTransport` seam; no test may. Test-guidelines: no network, ever,
    // and never a mocked `fetch` either.
    const callers = readdirSync(join(PKG, "src"))
      .filter((name) => name.endsWith(".test.ts"))
      .filter((name) => /(?<![.\w])fetch\s*\(/.test(readFileSync(join(PKG, "src", name), "utf8")));
    expect(callers).toEqual([]);
  });
});
