import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";
import { normalizeUsStates } from "./normalize";
import { parseUsStates } from "./sources/wikidata";
import type { SparqlResults } from "./sparql";

/**
 * T-011 verification (tester). Written from the brief's acceptance criteria in
 * `tasks/T-011-review-fun-facts.md`, not from the implementation: every bound
 * below — 40–200 characters, 25 words, the reference-opener regex, the banned
 * vocabulary, `https://`, the three `FunFact` keys — is quoted from a criterion
 * rather than read off the data or the curated table.
 *
 * Nothing here reaches the network, nothing mocks `fetch`, and nothing writes
 * anywhere: it reads the tracked bank, the curated build input and two docs.
 * The one thing it runs is `normalizeUsStates`, a pure function, on the
 * committed fixture.
 *
 * What a *shape* test cannot do is check that a fact is true, or that it reads
 * well. Criterion 12 and the brief's "Review checklist" own that, and only a
 * person can close them (`process-decisions.md` D-4a).
 */
const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");
const FIXTURE = join(import.meta.dirname, "fixtures/us-states.sparql.json");

interface TrackedFact {
  text: string;
  source_url: string | null;
  reviewed: boolean;
}

interface TrackedEntity {
  id: string;
  name: string;
  fun_facts: TrackedFact[];
}

function git(args: string[]): { status: number; stdout: string } {
  const proc = Bun.spawnSync(["git", ...args], { cwd: REPO });
  return { status: proc.exitCode, stdout: proc.stdout.toString() };
}

/** Throws rather than returning `[]`: an empty list would make the loops vacuous. */
function trackedUnder(path: string): string[] {
  const { status, stdout } = git(["ls-files", path]);
  if (status !== 0) throw new Error(`git ls-files ${path} exited ${status}`);
  const paths = stdout.split("\n").filter(Boolean);
  if (paths.length === 0) throw new Error(`nothing tracked under ${path}`);
  return paths;
}

/** The 50 `us-state-<postal>.json` files the criteria are written about. */
function trackedStateFiles(): { file: string; entity: TrackedEntity }[] {
  const files = trackedUnder("question-bank/data/us-states")
    .map((p) => p.split("/").pop() as string)
    .filter((n) => n !== "index.json")
    .sort();
  if (files.length !== 50) throw new Error(`expected 50 entity files, found ${files.length}`);
  return files.map((file) => ({
    file,
    entity: JSON.parse(readFileSync(join(DATA_DIR, file), "utf8")) as TrackedEntity,
  }));
}

/** Every (file, fact) pair, so a per-fact criterion can name the file it failed on. */
function allFacts(): { file: string; name: string; fact: TrackedFact }[] {
  return trackedStateFiles().flatMap(({ file, entity }) =>
    (entity.fun_facts ?? []).map((fact) => ({ file, name: entity.name, fact })),
  );
}

// ---------------------------------------------------------------------------
// The predicates the criteria define, kept separate from the data so their own
// boundaries can be tested. Criterion 3 names 39/40, 200/201 and 25/26 by hand;
// a checker that is wrong at the boundary would pass the bank for the wrong
// reason.
// ---------------------------------------------------------------------------

/** Criterion 3: "between 40 and 200 characters inclusive". */
const lengthOk = (text: string) => text.length >= 40 && text.length <= 200;

/** Criterion 3: "a sentence is a run ending in `.`, `!` or `?`"; 25 words passes. */
function longestSentenceWords(text: string): number {
  return Math.max(
    0,
    ...text
      .split(/[.!?]/)
      .map((run) => run.trim())
      .filter(Boolean)
      .map((run) => run.split(/\s+/).length),
  );
}

/** Criterion 4: the Wikipedia lead-sentence form, anchored on the entity's own name. */
function referenceOpener(name: string): RegExp {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^${escaped} is an? (landlocked |coastal )?(U\\.S\\.|US)?\\s?state (in|of)\\b`,
    "i",
  );
}

/** Criterion 4: adult-reference vocabulary, banned case-insensitively. */
const BANNED_WORDS = ["Köppen", "subregion", "per capita", "metropolitan statistical area", "census"];

describe("T-011 criterion 1 — every state is accounted for, and no blank is silent", () => {
  test("each of the 50 tracked files has a fun_facts key whose value is an array", () => {
    for (const { file, entity } of trackedStateFiles()) {
      expect({ file, hasKey: Object.hasOwn(entity, "fun_facts") }).toEqual({ file, hasKey: true });
      expect({ file, isArray: Array.isArray(entity.fun_facts) }).toEqual({ file, isArray: true });
    }
  });

  test("no tracked file has an empty fun_facts array — the Handoff names no state as blank", () => {
    // Criterion 1: "If the Handoff names none, all 50 arrays are non-empty."
    // T-011's Handoff names none ("No state is left blank"), so the whole set
    // of empty arrays must be empty. Should a later task deliberately blank a
    // state, this expectation is the thing that has to be argued with.
    const empty = trackedStateFiles()
      .filter(({ entity }) => (entity.fun_facts ?? []).length === 0)
      .map(({ file }) => file);
    expect(empty).toEqual([]);
  });

  test("the 50 non-empty arrays cover all 50 curated states, one file each", () => {
    const named = trackedStateFiles()
      .filter(({ entity }) => entity.fun_facts.length > 0)
      .map(({ entity }) => entity.name)
      .sort();
    expect(named).toEqual(CURATED_US_STATES.map((s) => s.name).sort());
  });
});

describe("T-011 criterion 2 — every fact is shaped like a FunFact, and every one is reviewed", () => {
  test("every fact has exactly the keys text, source_url and reviewed", () => {
    for (const { file, fact } of allFacts()) {
      expect({ file, keys: Object.keys(fact).sort() }).toEqual({
        file,
        keys: ["reviewed", "source_url", "text"],
      });
    }
  });

  test("text and source_url are strings on every fact", () => {
    for (const { file, fact } of allFacts()) {
      expect({ file, text: typeof fact.text, url: typeof fact.source_url }).toEqual({
        file,
        text: "string",
        url: "string",
      });
    }
  });

  test("reviewed is the boolean true on every fact, never the string \"true\"", () => {
    for (const { file, fact } of allFacts()) {
      expect({ file, reviewed: fact.reviewed }).toEqual({ file, reviewed: true });
      expect({ file, type: typeof fact.reviewed }).toEqual({ file, type: "boolean" });
    }
  });

  test('no file tracked under question-bank/data/ or sample-data/ contains reviewed": false', () => {
    const paths = [
      ...trackedUnder("question-bank/data"),
      ...trackedUnder("question-bank/sample-data"),
    ];
    expect(paths.length).toBeGreaterThan(51);
    for (const path of paths) {
      expect({ path, hasUnreviewed: readFileSync(join(REPO, path), "utf8").includes('reviewed": false') })
        .toEqual({ path, hasUnreviewed: false });
    }
  });
});

describe("T-011 criterion 3 — every fact is kid-sized", () => {
  test("the length check the criterion names is right at its boundaries (39 no, 40 yes, 200 yes, 201 no)", () => {
    expect(lengthOk("x".repeat(39))).toBe(false);
    expect(lengthOk("x".repeat(40))).toBe(true);
    expect(lengthOk("x".repeat(200))).toBe(true);
    expect(lengthOk("x".repeat(201))).toBe(false);
  });

  test("the sentence-length check is right at its boundary (25 words passes, 26 fails)", () => {
    const words = (n: number) => `${Array.from({ length: n }, () => "word").join(" ")}.`;
    expect(longestSentenceWords(words(25))).toBe(25);
    expect(longestSentenceWords(words(26))).toBe(26);
    expect(longestSentenceWords("Two words. Then a longer run of seven words.")).toBe(7);
  });

  test("every text is between 40 and 200 characters inclusive", () => {
    for (const { file, fact } of allFacts()) {
      expect({ file, length: fact.text.length, ok: lengthOk(fact.text) }).toEqual({
        file,
        length: fact.text.length,
        ok: true,
      });
    }
  });

  test("every text equals its own trim() and contains no newline or tab", () => {
    for (const { file, fact } of allFacts()) {
      expect({ file, trimmed: fact.text === fact.text.trim() }).toEqual({ file, trimmed: true });
      expect({ file, whitespace: /[\n\t]/.test(fact.text) }).toEqual({ file, whitespace: false });
    }
  });

  test("every text ends with . ! or ?", () => {
    for (const { file, fact } of allFacts()) {
      expect({ file, ends: /[.!?]$/.test(fact.text) }).toEqual({ file, ends: true });
    }
  });

  test("no text contains a sentence longer than 25 words", () => {
    for (const { file, fact } of allFacts()) {
      expect({ file, longest: longestSentenceWords(fact.text) <= 25 }).toEqual({
        file,
        longest: true,
      });
    }
  });
});

describe("T-011 criterion 4 — no fact is unrewritten reference prose", () => {
  test("the reference-opener regex matches the lead-sentence form it is written for", () => {
    // Guards the loop below: a regex that matched nothing would prove nothing.
    const opener = referenceOpener("Colorado");
    expect(opener.test("Colorado is a landlocked state in the Mountain West subregion.")).toBe(true);
    expect(opener.test("Colorado is a U.S. state in the Western United States.")).toBe(true);
    expect(opener.test("Colorado is a state of the union.")).toBe(true);
    // Criterion 4: "Facts that start 'Texas is the biggest…' are fine."
    expect(referenceOpener("Texas").test("Texas is the biggest state in the lower 48.")).toBe(false);
  });

  test("no text matches the Wikipedia lead-sentence opener for its own state", () => {
    for (const { file, name, fact } of allFacts()) {
      expect({ file, opener: referenceOpener(name).test(fact.text) }).toEqual({
        file,
        opener: false,
      });
    }
  });

  for (const word of BANNED_WORDS) {
    test(`no text contains "${word}", case-insensitively`, () => {
      for (const { file, fact } of allFacts()) {
        expect({ file, found: fact.text.toLowerCase().includes(word.toLowerCase()) }).toEqual({
          file,
          found: false,
        });
      }
    });
  }
});

describe("T-011 criterion 5 — each fact belongs to its own state, and no two states share one", () => {
  test("every text contains its entity's name as a case-sensitive substring", () => {
    for (const { file, name, fact } of allFacts()) {
      expect({ file, name, contains: fact.text.includes(name) }).toEqual({
        file,
        name,
        contains: true,
      });
    }
  });

  test("no two of the 50 tracked files carry an identical text", () => {
    const texts = allFacts().map(({ fact }) => fact.text);
    const duplicated = texts.filter((t, i) => texts.indexOf(t) !== i);
    expect(duplicated).toEqual([]);
    expect(new Set(texts).size).toBe(texts.length);
  });
});

describe("T-011 criterion 6 — every fact is attributable", () => {
  test("every source_url is a non-empty absolute https:// URL", () => {
    for (const { file, fact } of allFacts()) {
      const url = fact.source_url;
      expect({ file, nullish: url === null || url === undefined }).toEqual({ file, nullish: false });
      expect({ file, empty: (url as string).length === 0 }).toEqual({ file, empty: false });
      expect({ file, https: (url as string).startsWith("https://") }).toEqual({ file, https: true });
      expect({ file, protocol: new URL(url as string).protocol }).toEqual({
        file,
        protocol: "https:",
      });
    }
  });
});

describe("T-011 criterion 7 — the text lives in a build input", () => {
  test("every text in the 50 tracked files appears verbatim in src/curated/us-states.ts", () => {
    const curatedSource = readFileSync(join(PKG, "src/curated/us-states.ts"), "utf8");
    for (const { file, fact } of allFacts()) {
      expect({ file, inBuildInput: curatedSource.includes(fact.text) }).toEqual({
        file,
        inBuildInput: true,
      });
    }
  });

  // The second half of criterion 7 — an offline rebuild reproducing all 51
  // tracked paths byte-for-byte — is T-010's existing describe block "T-010
  // criteria 6 and 8", which spawns the CLI twice with every proxy pointed at a
  // dead loopback port. It runs against the new bytes in the same `bun test`;
  // duplicating it here would double a ~400 ms subprocess for no new signal.
});

describe("T-011 criterion 8 — a state with no curated fact still emits an empty array", () => {
  /** The committed recording, re-parsed per call (test-guidelines.md). */
  const rows = () => parseUsStates(JSON.parse(readFileSync(FIXTURE, "utf8")) as SparqlResults);

  test("a curated state whose fun_facts is absent still gets fun_facts: [] in the built entity", () => {
    const colorado = CURATED_US_STATES.find((s) => s.postal === "CO");
    if (!colorado) throw new Error("no curated CO row to exercise the blank path with");
    const saved = colorado.fun_facts;
    try {
      delete colorado.fun_facts;
      const { entities } = normalizeUsStates(rows(), {
        only: ["CO"],
        builtAt: "2026-08-04T16:05:35.000Z",
      });
      const entity = entities[0];
      expect(entity).toBeDefined();
      expect(Object.hasOwn(entity as object, "fun_facts")).toBe(true);
      expect(entity?.fun_facts).toEqual([]);
      // "the key is present with an empty array, not absent and not null" —
      // as it would be written to a tracked file.
      expect(JSON.stringify(entity, null, 2)).toContain('"fun_facts": []');
    } finally {
      if (saved) colorado.fun_facts = saved;
      else delete colorado.fun_facts;
    }
  });

  test("the same curated state with its fact restored emits that fact, so the test above is not vacuous", () => {
    const { entities } = normalizeUsStates(rows(), {
      only: ["CO"],
      builtAt: "2026-08-04T16:05:35.000Z",
    });
    expect(entities[0]?.fun_facts?.length).toBeGreaterThan(0);
  });
});

describe("T-011 criterion 10 — nothing unreviewed, live or new is committed", () => {
  test("no *.review.json path under question-bank/data/us-states/ is tracked in git", () => {
    const tracked = trackedUnder("question-bank/data/us-states").filter((p) =>
      p.endsWith(".review.json"),
    );
    expect(tracked).toEqual([]);
  });

  test("a *.review.json in the bank directory is still ignored", () => {
    expect(git(["check-ignore", "-q", "question-bank/data/us-states/fun-facts.review.json"]).status)
      .toBe(0);
    expect(git(["check-ignore", "-q", "question-bank/data/us-states/anything.review.json"]).status)
      .toBe(0);
  });

  test("the 51 bank paths are still tracked and still not ignored", () => {
    const paths = trackedUnder("question-bank/data/us-states");
    expect(paths).toHaveLength(51);
    for (const path of paths) {
      expect({ path, ignored: git(["check-ignore", "--no-index", "-q", path]).status === 0 })
        .toEqual({ path, ignored: false });
    }
  });
});

describe("T-011 criterion 11 — the docs this change falsifies are true again", () => {
  const read = (path: string) => readFileSync(join(REPO, path), "utf8");
  /** Docs wrap; compare on the text alone. */
  const flat = (text: string) => text.replace(/\s+/g, " ");

  test("11(a) — sample-data/README.md no longer calls the sample's fun fact unreviewed Wikipedia prose", () => {
    const readme = flat(read("question-bank/sample-data/README.md"));
    expect(readme.length).toBeGreaterThan(0);
    // The sample's own fun fact, described as raw/unreviewed reference prose.
    expect(readme).not.toMatch(/The fun fact is [^.]*\braw Wikipedia prose\b/i);
    expect(readme).not.toMatch(/fun fact[^.]*\bis\b[^.]*\bnot shippable text\b/i);
  });

  test("11(a) — sample-data/README.md no longer says nothing has reached an entity's fun-fact field", () => {
    const readme = flat(read("question-bank/sample-data/README.md"));
    expect(readme).not.toMatch(/nothing (reaches|has reached|reached) an entity's fun.?[Ff]act field/i);
    expect(readme).not.toMatch(/until then nothing reaches/i);
  });

  const e6 = () =>
    flat(
      read("engineering-decisions.md")
        .split(/^## /m)
        .find((s) => s.startsWith("E-6")) ?? "",
    );

  test("11(b) — E-6 no longer states in the present tense that CuratedState has no fun-fact field", () => {
    expect(e6()).not.toBe("");
    expect(e6()).not.toMatch(/no field exists on `?CuratedState`? today/i);
    expect(e6()).not.toMatch(/`?CuratedState`? (has|carries) no fun.?facts?/i);
  });

  test("11(b) — E-6 no longer states in the present tense that the tracked files carry nothing but fun_facts: []", () => {
    expect(e6()).not.toMatch(/none of the 50 tracked files[^.]*carries anything but/i);
    expect(e6()).not.toMatch(/carr(y|ies) (nothing but|only) `?fun_facts: \[\]`?/i);
  });

  test("11(b) — E-6 still designates the build input as the home for reviewed fun-fact text", () => {
    const text = e6();
    expect(text).toMatch(/question-bank\/src\/curated\/us-states\.ts/);
    expect(text).toMatch(/build input/i);
    expect(text).toMatch(/reviewed/i);
  });
});
