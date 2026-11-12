import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-076 acceptance criteria: the four blocks of `frontend/README.md` that
 * T-075's reformat flattened are fenced again, byte for byte.
 *
 * Written by the tester (`process.md` step 4) from
 * `tasks/T-076-frontend-readme-fences.md`, not from the implementation.
 *
 * Expected values come from the brief, never from git: the sha256 of each
 * block is copied from the brief's Definitions table, and the flattened lines
 * of criterion 5 are literals copied by hand from `main`'s README (at
 * `0b78dec`) at verification time. No test here resolves a revision (T-073,
 * `git-baseline-guard.criteria.test.ts`).
 *
 * Not asserted here, verified by hand and recorded in the brief's Verdict:
 * criterion 6 (a comparison with `main`'s file), 9's "byte-identical to main"
 * and 11 (diffs against another revision), and 10 (a whole `bun test` run,
 * which a test inside that run cannot observe). 9's ban on the ignore
 * directive is T-075's criterion 9 test in `format-gate.criteria.test.ts`.
 *
 * Local files only. No network.
 */

const FRONTEND_ROOT = join(import.meta.dirname, "..");
const README = join(FRONTEND_ROOT, "README.md");

const readReadme = () => readFileSync(README, "utf8");

type FencedBlock = {
  /** 0-based index of the opening fence line. */
  open: number;
  /** 0-based index of the closing fence line. */
  close: number;
  /** The lines between the two fence lines. */
  content: string[];
};

/**
 * CommonMark fenced code blocks: an opening line of three or more backticks or
 * tildes, indented at most three spaces, optionally followed by an info string;
 * closed by a line of the same character, at least as long, with nothing after
 * it but spaces. An unclosed fence runs to the end of the document.
 */
function parse(lines: string[]): { blocks: FencedBlock[]; outside: string[] } {
  const blocks: FencedBlock[] = [];
  const outside: string[] = [];
  let current: { open: number; char: string; length: number; content: string[] } | null = null;
  lines.forEach((line, index) => {
    if (current === null) {
      const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
      if (opening && !(opening[1]![0] === "`" && opening[2]!.includes("`"))) {
        current = { open: index, char: opening[1]![0]!, length: opening[1]!.length, content: [] };
      } else {
        outside.push(line);
      }
      return;
    }
    const closing = /^ {0,3}(`{3,}|~{3,}) *$/.exec(line);
    if (closing && closing[1]![0] === current.char && closing[1]!.length >= current.length) {
      blocks.push({ open: current.open, close: index, content: current.content });
      current = null;
    } else {
      current.content.push(line);
    }
  });
  if (current !== null) {
    const unclosed = current as { open: number; content: string[] };
    blocks.push({ open: unclosed.open, close: lines.length, content: unclosed.content });
  }
  return { blocks, outside };
}

const readmeLines = () => readReadme().split("\n");

/** The brief's digest definition: the lines joined with `\n`, plus one trailing `\n`. */
const digest = (lines: string[]) =>
  createHash("sha256")
    .update(lines.join("\n") + "\n", "utf8")
    .digest("hex");

/** The single index of the line matching `match`, outside any fenced block. */
function anchorIndex(lines: string[], match: (line: string) => boolean): number {
  const { blocks } = parse(lines);
  const inFence = (index: number) => blocks.some((b) => index >= b.open && index <= b.close);
  const hits = lines.flatMap((line, index) => (match(line) && !inFence(index) ? [index] : []));
  expect(hits).toHaveLength(1);
  return hits[0]!;
}

type BlockCase = {
  criterion: number;
  name: string;
  sha256: string;
  after: (line: string) => boolean;
  afterLabel: string;
  before: (line: string) => boolean;
  beforeLabel: string;
};

/** The brief's Definitions table and the anchors each criterion names. */
const BLOCKS: BlockCase[] = [
  {
    criterion: 1,
    name: "B1 (data-shape interfaces)",
    sha256: "95f8a9dd2ada3652c0f79d77331350f0fe5fbc122adca7a14b8870f5b4c9bfd3",
    after: (line) => line === "4. Data shapes",
    afterLabel: "the line `4. Data shapes`",
    before: (line) => line.startsWith("Ship ~15 entities"),
    beforeLabel: "the line that starts `Ship ~15 entities`",
  },
  {
    criterion: 2,
    name: "B2 (level formula)",
    sha256: "c56ca1a16b7141ff5684f6be76c58d577916872be761df39612168ae803b26aa",
    after: (line) => line.startsWith("Grade and difficulty are one axis"),
    afterLabel: "the line that starts `Grade and difficulty are one axis`",
    before: (line) => line.startsWith("This is deliberate:"),
    beforeLabel: "the line that starts `This is deliberate:`",
  },
  {
    criterion: 3,
    name: "B3 (question-loop states)",
    sha256: "115d2f0ad70d8873381e73b7861761fc6b30fee206819a7135f826b3369a647a",
    after: (line) => line === "States",
    afterLabel: "the line `States`",
    before: (line) => line === "Committing an answer",
    beforeLabel: "the line `Committing an answer`",
  },
  {
    criterion: 4,
    name: 'B4 ("9. Screens" diagram)',
    sha256: "0b698c6d5f98bdb0edc2c42f5e8fcd4c444d1f0d55537c106085cd12ea2fc042",
    after: (line) => line === "9. Screens",
    afterLabel: "the line `9. Screens`",
    before: (line) => line.startsWith("Session summary copy matters."),
    beforeLabel: "the line that starts `Session summary copy matters.`",
  },
];

describe("T-076 criteria 1-4: each block is fenced once, byte for byte, in its place", () => {
  for (const block of BLOCKS) {
    describe(`criterion ${block.criterion}: ${block.name}`, () => {
      test("exactly one fenced block's content has the brief's sha256", () => {
        const { blocks } = parse(readmeLines());
        const matching = blocks.filter((b) => digest(b.content) === block.sha256);
        expect(matching).toHaveLength(1);
      });

      test(`it sits after ${block.afterLabel} and before ${block.beforeLabel}`, () => {
        const lines = readmeLines();
        const fenced = parse(lines).blocks.find((b) => digest(b.content) === block.sha256);
        expect(fenced).toBeDefined();
        const after = anchorIndex(lines, block.after);
        const before = anchorIndex(lines, block.before);
        expect(fenced!.open).toBeGreaterThan(after);
        expect(fenced!.close).toBeLessThan(before);
      });
    });
  }

  test("criterion 2: B2's `*` is not escaped and its blank line is kept", () => {
    const fenced = parse(readmeLines()).blocks.find((b) => digest(b.content) === BLOCKS[1]!.sha256);
    expect(fenced).toBeDefined();
    expect(fenced!.content).toHaveLength(4);
    expect(fenced!.content[1]).toContain("level - 2 * gradeOf(level)");
    expect(fenced!.content[1]).toStartWith("const bandOf  = ");
    expect(fenced!.content[2]).toBe("");
  });
});

/**
 * Every line of `main`'s flattened ranges (104-141, 149-152, 164-166, 264-277
 * at `0b78dec`) that differs from its B1-B4 original, copied by hand from
 * `main` at verification time. Lines that prettier left unchanged (`}`,
 * `interface Entity {`, `Splash`, the comment lines, ...) are not here: the
 * criterion excludes them, and they legitimately appear inside the fences.
 */
const FLATTENED_ONLY_ON_MAIN = [
  // B1
  'id: string; // "us-state-co"',
  "type: 'state' | 'country' | 'city';",
  'name: string; // "Colorado"',
  "capital?: string;",
  'fipsCode?: string; // "08" — joins to us-atlas geometry',
  'region: string; // "Mountain West"',
  "funFact: string; // shown on CORRECT answers",
  'funFactDetail: string; // shown behind "Tell me more"',
  "id: string;",
  "entityId: string;",
  "type: 'map-identify' | 'text-mc';",
  'prompt: string; // "Which state is highlighted?"',
  "choices: string[]; // exactly 4",
  "correctIndex: number;",
  "level: number; // 0.0–18.0, see §5",
  "topic: 'location' | 'capital';",
  "ageBand: 1 | 2 | 3;",
  "highlightFips?: string; // for map-identify: which shape to highlight",
  'shortExplanation: string; // shown on WRONG answers — answers "why"',
  'detailExplanation: string; // behind "Why?" button',
  "name: string;",
  "avatar: string; // emoji or icon key",
  "level: number; // current difficulty, 0.0–18.0",
  "lastSessionEndLevel: number;",
  "bestSustainedLevel: number;",
  "stats: { answered: number; correct: number };",
  "mastery: Record<string, number>; // entityId -> 0..1",
  "reviewQueue: string[]; // entityIds",
  // B2
  "const gradeOf = (level: number) => Math.floor(level / 2); // 0 = K, 1 = 1st … 8 = 8th",
  "const bandOf = (level: number) => level - 2 * gradeOf(level); // 0 easy, 1 med, 2 hard",
  // B3
  "PRESENTING → question rendered, input live",
  "COMMITTED → answer locked, grading runs",
  'REVEALING → explanation shown, "Next" enabled',
  // B4
  "↓",
  "↓ ↓",
  "Home ←────────────────────────┘",
  "· greeting, US map with mastered states filled",
  "· [Start] → Setup",
  'Question loop ──[Quit]──→ "Done for now?"',
  "· present → answer → reveal → next ├─ session summary",
  "├─ [Keep playing] ← default, larger",
  "└─ [Back home]",
];

describe("T-076 criterion 5: the flattened copies are gone", () => {
  test("no line outside a fenced block equals a flattened line from main", () => {
    const { outside } = parse(readmeLines());
    const leftovers = outside.filter((line) => FLATTENED_ONLY_ON_MAIN.includes(line));
    expect(leftovers).toEqual([]);
  });

  test("the brief's four named examples appear nowhere outside a fence", () => {
    const { outside } = parse(readmeLines());
    for (const example of [
      'id: string; // "us-state-co"',
      "↓ ↓",
      "PRESENTING → question rendered, input live",
      "├─ [Keep playing] ← default, larger",
    ]) {
      expect(outside).not.toContain(example);
    }
  });
});

function runScript(script: string): { exitCode: number; output: string } {
  try {
    const output = execFileSync("bun", ["run", script], {
      cwd: FRONTEND_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { exitCode: 0, output };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return {
      exitCode: failure.status ?? 1,
      output: `${failure.stdout ?? ""}${failure.stderr ?? ""}`,
    };
  }
}

/** Criteria 7 and 8 are about the pinned prettier; a global fallback proves nothing. */
const installedPrettierVersion = () =>
  (
    JSON.parse(readFileSync(join(FRONTEND_ROOT, "node_modules/prettier/package.json"), "utf8")) as {
      version: string;
    }
  ).version;

/** Refuse the writer unless the pinned prettier is what `bun run format` will run (T-107). */
function requirePinnedPrettier(): void {
  const pkg = JSON.parse(readFileSync(join(FRONTEND_ROOT, "package.json"), "utf8")) as {
    devDependencies?: Record<string, string>;
  };
  const pinned = pkg.devDependencies?.["prettier"];
  const manifest = join(FRONTEND_ROOT, "node_modules/prettier/package.json");
  if (!existsSync(manifest)) {
    throw new Error(
      `refusing to run the prettier writer: pinned prettier ${pinned} is required, but node_modules/prettier is missing`,
    );
  }
  const found = (JSON.parse(readFileSync(manifest, "utf8")) as { version: string }).version;
  if (found !== pinned) {
    throw new Error(
      `refusing to run the prettier writer: pinned prettier ${pinned} is required, found ${found} in node_modules/prettier`,
    );
  }
  if (!existsSync(join(FRONTEND_ROOT, "node_modules/.bin/prettier"))) {
    throw new Error(
      `refusing to run the prettier writer: prettier ${found} is installed but node_modules/.bin/prettier is missing, so bun run would fall back to PATH`,
    );
  }
}

describe("T-076 criteria 7-8: prettier 3.9.6 leaves the fenced README alone", () => {
  test("the installed prettier is 3.9.6", () => {
    expect(installedPrettierVersion()).toBe("3.9.6");
  });

  test("criterion 7: bun run format:check exits 0", () => {
    const result = runScript("format:check");
    expect(result.output).not.toContain("README.md");
    expect(result.exitCode).toBe(0);
  });

  test("criterion 8: bun run format leaves frontend/README.md byte-identical", () => {
    requirePinnedPrettier();
    const before = readFileSync(README);
    const result = runScript("format");
    const after = readFileSync(README);
    expect(result.exitCode).toBe(0);
    expect(after.equals(before)).toBe(true);
    // And still byte-for-byte the four blocks, after the writer ran.
    const { blocks } = parse(after.toString("utf8").split("\n"));
    for (const block of BLOCKS) {
      expect(blocks.filter((b) => digest(b.content) === block.sha256)).toHaveLength(1);
    }
  });
});
